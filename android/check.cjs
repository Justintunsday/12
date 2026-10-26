const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');

const bookmarklet = fs.readFileSync(path.join(__dirname, 'bookmarklet.txt'), 'utf8').trim();
const assignmentUrl = 'https://fireflies.chiculture.org.hk/app/assignments/2026-10-07';
const apiUrl = 'https://api.deepseek.com/chat/completions';
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Assignment</title></head><body>
  <div class="readable"><h1>阅读练习</h1><div class="note-content">文章：小明在雨天带伞上学。</div></div>
  <form>${[0, 1].map((n) => `<div class="card"><h5><span class="note-content">第 ${n + 1} 题</span></h5>
    <input type="radio" id="rb_${n}_1" name="answers.${n}.answered" value="1"><label for="rb_${n}_1">A. 没带伞</label>
    <input type="radio" id="rb_${n}_2" name="answers.${n}.answered" value="2"><label for="rb_${n}_2">B. 带伞</label></div>`).join('')}
    <button type="submit">Submit</button>
  </form></body></html>`;
const completion = (confidence = .95) => ({choices: [{finish_reason: 'stop', message: {
  content: JSON.stringify({answers: [0, 1].map((n) => ({
    question_number: n + 1, option_id: `rb_${n}_2`, reason: '文章说小明带伞上学。', confidence
  }))})
}}]});

async function run(browser, platform) {
  const context = await browser.newContext({
    viewport: platform.viewport, userAgent: platform.userAgent, isMobile: true, hasTouch: true
  });
  // Retain a test-only handle to the closed shadow root without changing its mode.
  await context.addInitScript(() => {
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (options) {
      const root = attach.call(this, options);
      if (this.id === 'fireflies-android-host') window.testAssistantRoot = root;
      return root;
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let blockApi = false;
  await page.route('https://fireflies.chiculture.org.hk/**', (route) => route.fulfill({
    contentType: 'text/html', body: fixture,
    headers: blockApi ? {'Content-Security-Policy': "connect-src 'self'"} : {}
  }));
  let responseMode = 'success', requests = [], pending = [];
  await page.route(apiUrl, async (route) => {
    const req = route.request();
    const headers = {'Access-Control-Allow-Origin': 'https://fireflies.chiculture.org.hk',
      'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'POST'};
    if (req.method() === 'OPTIONS') return route.fulfill({status: 204, headers});
    requests.push({headers: req.headers(), payload: req.postDataJSON()});
    if (responseMode === 'pending') return new Promise((resolve) => pending.push(async () => {
      await route.abort().catch(() => {}); resolve();
    }));
    if (responseMode === 'network') return route.abort('failed');
    await route.fulfill({status: responseMode === 'unauthorized' ? 401 : 200,
      contentType: 'application/json', headers,
      body: responseMode === 'malformed' ? '{}' : JSON.stringify(completion(responseMode === 'low' ? .5 : .95))});
  });
  const node = async (id) => (await page.evaluateHandle((id) => window.testAssistantRoot.getElementById(id), id)).asElement();
  const tap = async (id) => (await node(id)).tap();
  const text = () => page.evaluate(() => window.testAssistantRoot.getElementById('status').textContent);
  const waitStatus = (part) => page.waitForFunction((part) => window.testAssistantRoot?.getElementById('status').textContent.includes(part), part);
  const disabled = (id) => page.evaluate((id) => window.testAssistantRoot.getElementById(id).disabled, id);
  const launch = async () => {
    await page.evaluate((url) => {location.href = url;}, bookmarklet);
    await waitStatus('已读取 2 道题');
  };
  const key = 'test-key-never-use-in-production';
  const enterKey = async () => {await (await node('key')).fill(key);};

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
  await context.addCookies([{name: 'session', value: 'must-not-reach-deepseek', url: assignmentUrl}]);
  await launch();
  assert.equal(await disabled('fill'), true);
  await enterKey();
  await tap('save');
  assert.match(await text(), /当前页面/);
  await tap('solve');
  await waitStatus('答案已生成');
  assert.equal(requests.length, 1);
  const sent = requests[0];
  assert.equal(sent.headers.authorization, 'Bearer ' + key);
  assert.equal(sent.headers.cookie, undefined);
  assert.equal(sent.headers.referer, undefined);
  const data = JSON.parse(sent.payload.messages[1].content);
  assert.deepEqual(Object.keys(data).sort(), ['article', 'questions', 'title']);
  assert.equal(data.questions.length, 2);
  assert(!JSON.stringify(sent.payload).includes('must-not-reach-deepseek'));
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  assert.equal(await disabled('fill'), false);
  await tap('fill');
  await waitStatus('全部答案已勾选');
  assert.deepEqual(await page.locator('form input:checked').evaluateAll((nodes) => nodes.map((node) => node.id)), ['rb_0_2', 'rb_1_2']);
  assert.equal(await page.evaluate(() => window.testSubmissions), 0);

  // Second activation reopens the existing assistant and retains its in-memory key.
  await tap('close');
  await page.evaluate((url) => {location.href = url;}, bookmarklet);
  await page.waitForFunction(() => !window.testAssistantRoot.getElementById('panel').hidden);
  assert.equal(await page.locator('#fireflies-android-host').count(), 1);
  assert.equal(await page.evaluate(() => window.testAssistantRoot.getElementById('panel').hidden), false);
  assert.equal(await (await node('key')).inputValue(), key);
  const box = await (await node('panel')).boundingBox();
  assert(box.x >= 0 && box.x + box.width <= platform.viewport.width + 1);
  assert(box.y >= 0 && box.y + box.height <= platform.viewport.height + 1);
  await page.setViewportSize({width: platform.viewport.width, height: 400});
  const shortBox = await (await node('panel')).boundingBox();
  assert(shortBox.y >= 0 && shortBox.y + shortBox.height <= 401);
  await page.setViewportSize(platform.viewport);

  responseMode = 'low';
  await tap('solve'); await waitStatus('低置信度');
  assert.equal(await disabled('fill'), true);
  await (await node('review')).check();
  assert.equal(await disabled('fill'), false);
  await page.locator('.readable > .note-content').evaluate((node) => {node.textContent = 'Changed article';});
  await tap('fill'); await waitStatus('文章或题目已改变');

  responseMode = 'unauthorized';
  await tap('solve'); await waitStatus('HTTP 401');
  assert.equal(await disabled('fill'), true);
  responseMode = 'malformed';
  await tap('solve'); await waitStatus('未返回');
  assert.equal(await disabled('fill'), true);
  responseMode = 'network';
  await tap('solve'); await waitStatus('接口连接失败');
  assert.equal(await disabled('fill'), true);
  responseMode = 'pending';
  await tap('solve');
  await page.waitForFunction(() => !window.testAssistantRoot.getElementById('cancel').hidden);
  await tap('cancel'); await waitStatus('已取消');
  await Promise.all(pending.splice(0).map((finish) => finish()));
  assert.equal(await disabled('solve'), false);
  assert.equal(await disabled('fill'), true);

  // Exercise the actual four-minute timeout with the browser clock.
  await page.clock.install();
  await tap('solve');
  await page.clock.fastForward(240001);
  await waitStatus('超过 4 分钟');
  await Promise.all(pending.splice(0).map((finish) => finish()));
  await page.clock.resume();

  responseMode = 'success';
  await tap('forget');
  assert.equal(await (await node('key')).inputValue(), '');
  await enterKey(); await tap('save');
  await page.reload(); await launch();
  assert.equal(await (await node('key')).inputValue(), '');
  assert.equal(await disabled('fill'), true);

  // A restrictive site policy must surface a connection error and leave fill disabled.
  blockApi = true;
  await page.reload(); await launch(); await enterKey();
  await tap('solve'); await waitStatus('接口连接失败');
  assert.equal(await disabled('fill'), true);

  // Wrong-site activation must neither mount the panel nor send credentials.
  const before = requests.length;
  await page.route('https://example.org/**', (route) => route.fulfill({contentType:'text/html', body:'<p>Other site</p>'}));
  await page.goto('https://example.org/');
  const dialog = page.waitForEvent('dialog').then((dialog) => dialog.dismiss());
  await page.evaluate((url) => {location.href = url;}, bookmarklet);
  await dialog;
  assert.equal(await page.locator('#fireflies-android-host').count(), 0);
  assert.equal(requests.length, before);
  assert.deepEqual(errors, []);
  await context.close();
  console.log(`${platform.name}: mobile UI, request privacy, async selection, review gate, stale page, HTTP/network errors, cancel, timeout, reload and URL scope passed.`);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    headless: true, args: ['--no-sandbox']
  });
  try {
    for (const platform of [
      {name:'Android Chrome', viewport:{width:360,height:800}, userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'},
      {name:'Android Edge', viewport:{width:412,height:915}, userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0'}
    ]) await run(browser, platform);
  } finally {await browser.close();}
})().catch((error) => {console.error(error); process.exitCode = 1;});
