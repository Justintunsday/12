const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, 'fireflies.user.js'), 'utf8');
const pkg = require('../package.json');
const installUrl = 'https://raw.githubusercontent.com/Justintunsday/pianpianliuying/main/wblock/fireflies.user.js';
assert.equal(source.match(/^\/\/ @version\s+(\S+)/m)[1], pkg.version);
for (const grant of ['GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_xmlhttpRequest',
  'GM.getValue', 'GM.setValue', 'GM.deleteValue', 'GM.xmlHttpRequest']) {
  assert(source.split('\n').some((line) => line.trim() === '// @grant        ' + grant));
}
assert(source.includes('// @connect      api.deepseek.com'));
assert(source.includes('// @inject-into  content'));
assert(source.includes('// @updateURL    ' + installUrl));
assert(source.includes('// @downloadURL  ' + installUrl));
assert(!/sk-[a-zA-Z0-9]{16,}/.test(source));

function createContext(style = 'legacy') {
  const nodes = new Map(), storage = new Map();
  const context = {
    document: {getElementById: () => null}, window: {}, setTimeout,
    location: {origin: 'https://fireflies.chiculture.org.hk'},
    nodes, responseMode: 'success', aborts: 0
  };
  context.window.top = context.window;
  context.window.self = context.window;
  const get = (key, fallback) => storage.has(key) ? storage.get(key) : fallback;
  const set = (key, value) => {storage.set(key, value);};
  const remove = (key) => {storage.delete(key);};
  const transport = (details) => {
    context.lastRequest = details;
    if (context.responseMode === 'reject') return Promise.reject(new Error('manager rejected'));
    let resolve, reject;
    const promise = new Promise((yes, no) => {resolve = yes; reject = no;});
    if (style !== 'modern') promise.catch(() => {});
    const handle = style === 'modern' ? promise : {};
    handle.abort = () => {
      context.aborts++; details.onabort(); reject(new Error('aborted'));
    };
    if (context.responseMode !== 'pending') setTimeout(() => {
      const mode = context.responseMode;
      if (mode === 'network') {details.onerror({error:'offline'}); reject(new Error('offline'));}
      else if (mode === 'timeout') {details.ontimeout(); reject(new Error('timeout'));}
      else {
        const response = {status: mode === 'http' ? 401 : 200,
          responseText: mode === 'json' ? 'not json' : '{"choices":[]}'};
        details.onload(response); resolve(response);
      }
    }, 0);
    return handle;
  };
  if (style === 'modern') context.GM = {
    async getValue(key, fallback) {assert.equal(this, context.GM); return get(key, fallback);},
    async setValue(key, value) {assert.equal(this, context.GM); set(key, value);},
    async deleteValue(key) {assert.equal(this, context.GM); remove(key);},
    xmlHttpRequest(details) {assert.equal(this, context.GM); return transport(details);}
  };
  else if (style === 'legacy' || style === 'legacy-async') {
    context.GM_getValue = style === 'legacy' ? get : async (...args) => get(...args);
    context.GM_setValue = style === 'legacy' ? set : async (...args) => set(...args);
    context.GM_deleteValue = style === 'legacy' ? remove : async (...args) => remove(...args);
    context.GM_xmlhttpRequest = transport;
  }
  vm.createContext(context);
  vm.runInContext(source.replace('  bootstrap();', `
    root = {getElementById(id) {
      if (!globalThis.nodes.has(id)) globalThis.nodes.set(id, {checked:false});
      return globalThis.nodes.get(id);
    }};
    Object.assign(globalThis, {validateAssignment, validateAnswers, parseCompletion, callDeepSeek,
      getValue, setValue, deleteValue, cancel: () => cancelRequest?.()});
  `), context);
  return context;
}

(async () => {
  const context = createContext();
  const assignment = {article:'Article', questions:[{question:'Question', options:[{id:'rb_0_2', text:'B. Option'}]}]};
  const good = {question_number:1, option_id:'rb_0_2', reason:'Evidence', confidence:.9};
  context.validateAssignment(assignment);
  assert.throws(() => context.validateAssignment({...assignment, article:''}));
  assert.equal(context.validateAnswers({answers:[good]}, assignment)[0].option_id, 'rb_0_2');
  for (const invalid of [
    {...good, option_id:'rb_0_1'}, {...good, confidence:2}, {...good, confidence:NaN},
    {...good, question_number:2}, {...good, reason:''}, {...good, confidence:'0.9'}
  ]) assert.throws(() => context.validateAnswers({answers:[invalid]}, assignment));
  assert.throws(() => context.validateAnswers({answers:[]}, assignment));
  assert.throws(() => context.validateAnswers({answers:[good, good]}, {
    ...assignment, questions:[...assignment.questions, ...assignment.questions]
  }));
  const completion = {choices:[{finish_reason:'stop', message:{content:JSON.stringify({answers:[good]})}}]};
  assert.equal(context.parseCompletion(completion, assignment)[0].option_id, good.option_id);
  completion.choices[0].message.content = '```json\n' + JSON.stringify({answers:[good]}) + '\n```';
  assert.equal(context.parseCompletion(completion, assignment)[0].option_id, good.option_id);
  for (const reason of ['length', 'content_filter', 'aborted', 'insufficient_system_resource', 'tool_calls']) {
    completion.choices[0].finish_reason = reason;
    assert.throws(() => context.parseCompletion(completion, assignment), new RegExp('finish_reason=' + reason));
  }
  completion.choices[0].finish_reason = 'stop';
  completion.choices[0].message.content = '';
  assert.throws(() => context.parseCompletion(completion, assignment), /正文为空/);
  completion.choices[0].message.content = '{"answers":[';
  assert.throws(() => context.parseCompletion(completion, assignment), /完整的 JSON/);
  assert.throws(() => context.parseCompletion({}, assignment), /未返回/);

  for (const style of ['legacy', 'legacy-async', 'modern']) {
    const c = createContext(style);
    assert.equal(await c.getValue('settings', 'fallback'), 'fallback');
    await c.setValue('settings', {apiKey:'test-key'});
    assert.equal((await c.getValue('settings')).apiKey, 'test-key');
    await c.deleteValue('settings');
    assert.equal(await c.getValue('settings', null), null);
    await c.callDeepSeek({model:'deepseek-flash'}, 'test-key');
    assert.equal(c.lastRequest.url, 'https://api.deepseek.com/chat/completions');
    assert.equal(c.lastRequest.anonymous, true);
    assert.equal(c.lastRequest.headers.Authorization, 'Bearer test-key');
    assert.equal(c.lastRequest.timeout, 240000);
    assert.equal(JSON.parse(c.lastRequest.data).model, 'deepseek-flash');
    for (const [mode, message] of [
      ['http', /HTTP 401/], ['json', /不是 JSON/], ['network', /offline/],
      ['timeout', /超过 4 分钟/], ['reject', /manager rejected/]
    ]) {
      c.responseMode = mode;
      await assert.rejects(() => c.callDeepSeek({}, 'test-key'), message);
    }
    c.responseMode = 'pending';
    const cancelled = c.callDeepSeek({}, 'test-key');
    c.cancel();
    await assert.rejects(() => cancelled, /已取消/);
    assert.equal(c.aborts, 1);
    c.lastRequest.onload({status:200, responseText:'{}'});
    console.log(style + ': manager storage, requests, errors, timeout and cancellation passed.');
  }
  const missing = createContext('missing');
  assert.throws(() => missing.getValue('settings'), /用户脚本 API 不可用/);
  await assert.rejects(() => missing.callDeepSeek({}, 'test-key'), /用户脚本 API 不可用/);
  for (const framed of [false, true]) {
    const window = {};
    window.self = window; window.top = framed ? {} : window;
    vm.runInNewContext(source, {window, location:{origin:'https://example.org'},
      document:{getElementById() {throw new Error('must not access unrelated page');}}});
  }
  console.log('Userscript metadata, response validation and origin/frame guards passed.');
})().catch((error) => {console.error(error); process.exitCode = 1;});
