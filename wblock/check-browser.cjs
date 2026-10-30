const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const source = fs.readFileSync(path.join(__dirname, 'fireflies.user.js'), 'utf8');
const assignmentUrl = 'https://fireflies.chiculture.org.hk/app/assignments/2026-10-07';
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Assignment</title></head><body>
  <div class="readable"><h1>阅读练习</h1><div class="note-content">文章：小明在雨天带伞上学。</div></div>
  <form>${[0, 1].map((n) => `<div class="card"><h5><span class="note-content">第 ${n + 1} 题</span></h5>
    <input type="radio" id="rb_${n}_1" name="answers.${n}.answered" value="1"><label for="rb_${n}_1">A. 没带伞</label>
    <input type="radio" id="rb_${n}_2" name="answers.${n}.answered" value="2"><label for="rb_${n}_2">B. 带伞</label></div>`).join('')}
    <button type="submit">Submit</button>
  </form></body></html>`;

async function run(browser, platform) {
  const context = await browser.newContext(platform.options);
  const storage = new Map(), requests = [], errors = [];
  await context.exposeBinding('testStorage', (_, action, key, value) => {
    if (action === 'get') return storage.has(key) ? storage.get(key) : value;
    if (action === 'set') storage.set(key, value);
    if (action === 'delete') storage.delete(key);
  });
  await context.exposeBinding('testRecordRequest', (_, details) => {requests.push(details);});
  await context.addInitScript(({style}) => {
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (options) {
      const root = attach.call(this, options);
      if (this.id === 'fireflies-wblock-host') window.testAssistantRoot = root;
      return root;
    };
    window.testMode = 'success';
    // A userscript must use its manager, never a page-native network fallback.
    window.fetch = () => {throw new Error('Unexpected native fetch');};
    const transport = (details) => {
      window.testRecordRequest({url:details.url, method:details.method, headers:details.headers,
        anonymous:details.anonymous, payload:JSON.parse(details.data), timeout:details.timeout});
      const mode = window.testMode;
      let resolve, reject, settled = false, responseTimer;
      const promise = new Promise((yes, no) => {resolve = yes; reject = no;});
      if (style === 'legacy') promise.catch(() => {});
      const finish = (event, value) => {
        if (settled) return;
        settled = true; clearTimeout(timeoutTimer); clearTimeout(responseTimer);
        details[event](value);
        if (event === 'onload') resolve(value); else reject(new Error(event));
      };
      const timeoutTimer = setTimeout(() => finish('ontimeout'), details.timeout);
      if (mode !== 'pending') responseTimer = setTimeout(() => {
        if (mode === 'network') return finish('onerror', {error:'offline'});
        const completion = {choices:[{finish_reason:'stop', message:{content:JSON.stringify({answers:[0, 1].map((n) => ({
          question_number:n + 1, option_id:`rb_${n}_2`, reason:'文章说小明带伞上学。', confidence:mode === 'low' ? .5 : .95
        }))})}}]};
        finish('onload', {status:mode === 'http' ? 401 : 200,
          responseText:mode === 'json' ? 'invalid json' : mode === 'malformed' ? '{}' : JSON.stringify(completion)});
      }, 0);
      const handle = style === 'modern' ? promise : {};
      handle.abort = () => finish('onabort');
      return handle;
    };
    if (style === 'modern') window.GM = {
      getValue: (key, fallback) => window.testStorage('get', key, fallback),
      setValue: (key, value) => window.testStorage('set', key, value),
      deleteValue: (key) => window.testStorage('delete', key),
      xmlHttpRequest: transport
    };
    else {
      window.GM_getValue = (key, fallback) => window.testStorage('get', key, fallback);
      window.GM_setValue = (key, value) => window.testStorage('set', key, value);
      window.GM_deleteValue = (key) => window.testStorage('delete', key);
      window.GM_xmlhttpRequest = transport;
    }
  }, {style:platform.style});
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://fireflies.chiculture.org.hk/**', (route) => route.fulfill({contentType:'text/html', body:fixture}));
  const node = async (id) => (await page.evaluateHandle((id) => window.testAssistantRoot.getElementById(id), id)).asElement();
  const click = async (id) => (await node(id)).click();
  const disabled = (id) => page.evaluate((id) => window.testAssistantRoot.getElementById(id).disabled, id);
  const waitStatus = (part) => page.waitForFunction((part) => window.testAssistantRoot?.getElementById('status').textContent.includes(part), part);
  const launch = async (expected = '已读取 2 道题') => {
    await page.evaluate(source);
    await click('launcher');
    await waitStatus(expected);
  };
  const mode = (value) => page.evaluate((value) => {window.testMode = value;}, value);
  const key = 'test-key-never-use-in-production';

  await page.goto(assignmentUrl);
  await page.evaluate(() => {
    window.testSubmissions = 0;
    document.querySelector('form').addEventListener('submit', (event) => {event.preventDefault(); window.testSubmissions++;});
    document.querySelector('form').addEventListener('change', () => {
      const selected = [...document.querySelectorAll('input:checked')].map((input) => input.id);
      setTimeout(() => {
        const form = document.querySelector('form');
        const cards = [...form.querySelectorAll('.card')].map((card) => card.cloneNode(true));
        form.querySelectorAll('.card').forEach((card) => card.remove());
        cards.reverse().forEach((card) => form.prepend(card));
        selected.forEach((id) => {document.getElementById(id).checked = true;});
      }, 15);
    });
  });
  await launch();
  assert.equal(await disabled('fill'), true);
  await (await node('key')).fill(key);
  await click('save'); await waitStatus('设置已保存');
  assert.equal(storage.get('settings').apiKey, key);
  await click('solve'); await waitStatus('答案已生成');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://api.deepseek.com/chat/completions');
  assert.equal(requests[0].anonymous, true);
  assert.equal(requests[0].headers.Authorization, 'Bearer ' + key);
  assert.equal(requests[0].timeout, 240000);
  assert.deepEqual(Object.keys(JSON.parse(requests[0].payload.messages[1].content)).sort(), ['article', 'questions', 'title']);
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  assert.equal(await disabled('fill'), false);
  assert.equal(await (await node('analysis')).evaluate((el) => el.open), false);
  await (await node('analysis')).evaluate((el) => {el.open = true;});
  assert.match(await (await node('answers')).innerText(), /小明带伞/);
  await (await node('analysis')).evaluate((el) => {el.open = false;});
  await click('fill'); await waitStatus('全部答案已勾选');
  assert.deepEqual(await page.locator('form input:checked').evaluateAll((nodes) => nodes.map((node) => node.id)), ['rb_0_2', 'rb_1_2']);
  assert.equal(await page.evaluate(() => window.testSubmissions), 0);

  await click('close'); await page.evaluate(source);
  await page.waitForFunction(() => !window.testAssistantRoot.getElementById('panel').hidden);
  assert.equal(await page.locator('#fireflies-wblock-host').count(), 1);
  const box = await (await node('panel')).boundingBox();
  const viewport = page.viewportSize();
  assert(box.x >= 0 && box.x + box.width <= viewport.width + 1);
  assert(box.y >= 0 && box.y + box.height <= viewport.height + 1);
  await page.setViewportSize({width:viewport.width, height:400});
  const shortBox = await (await node('panel')).boundingBox();
  assert(shortBox.y >= 0 && shortBox.y + shortBox.height <= 401);
  await page.setViewportSize(viewport);

  await page.reload(); await launch('已恢复这篇文章的答案');
  assert.equal(await (await node('key')).inputValue(), key);
  assert.equal(requests.length, 1, 'cached answers must not request another completion');
  assert.equal(await disabled('fill'), false);
  await mode('low'); await click('solve'); await waitStatus('低置信度');
  assert.equal(await disabled('fill'), true);
  await (await node('review')).check();
  assert.equal(await disabled('fill'), false);
  await page.locator('.readable > .note-content').evaluate((el) => {el.textContent = 'Changed article';});
  await click('fill'); await waitStatus('文章或题目已改变');
  await click('read'); await waitStatus('已读取 2 道题');
  assert.equal(await disabled('fill'), true);
  for (const [value, message] of [['http', 'HTTP 401'], ['malformed', '未返回'], ['json', '不是 JSON'], ['network', 'offline']]) {
    await mode(value); await click('solve'); await waitStatus(message);
    assert.equal(await disabled('fill'), true);
  }
  await mode('pending'); await click('solve');
  await page.waitForFunction(() => !window.testAssistantRoot.getElementById('cancel').hidden);
  await click('cancel'); await waitStatus('已取消');
  assert.equal(await disabled('solve'), false);
  assert.equal(await disabled('fill'), true);
  await page.clock.install();
  await click('solve'); await page.clock.fastForward(240001); await waitStatus('超过 4 分钟');
  await page.clock.resume();
  assert.equal(await disabled('fill'), true);

  await (await node('settings')).evaluate((el) => {el.open = true;});
  await click('forget'); await waitStatus('已清除');
  assert.equal(await (await node('key')).inputValue(), '');
  assert.equal(storage.has('settings'), false);
  await page.reload(); await launch('已恢复这篇文章的答案');
  assert.equal(await (await node('key')).inputValue(), '');
  assert.equal(await disabled('fill'), true, 'low-confidence review must reset on reload');
  await page.goto('https://fireflies.chiculture.org.hk/app/assignments');
  await launch('请先打开一篇文章的答题页');
  assert.equal(await disabled('solve'), true);
  await page.route('https://example.org/**', (route) => route.fulfill({contentType:'text/html', body:'<p>Other site</p>'}));
  await page.goto('https://example.org/'); await page.evaluate(source);
  assert.equal(await page.locator('#fireflies-wblock-host').count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
  console.log(platform.name + ': shared UI, GM persistence/cache, analysis, selection, review, errors, cancel, timeout and scope passed.');
}

(async () => {
  const browser = await chromium.launch({
    executablePath:process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    headless:true
  });
  try {
    for (const platform of [
      {name:'iPhone viewport / legacy GM', style:'legacy', options:{viewport:{width:390, height:844}, isMobile:true, hasTouch:true,
        userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}},
      {name:'Desktop viewport / modern GM', style:'modern', options:{viewport:{width:1280, height:800}}},
      {name:'Android viewport / modern GM', style:'modern', options:{viewport:{width:360, height:800}, isMobile:true, hasTouch:true,
        userAgent:'Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0'}}
    ]) await run(browser, platform);
  } finally {await browser.close();}
})().catch((error) => {console.error(error); process.exitCode = 1;});
