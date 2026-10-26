# Program analysis and Android support

## Existing architecture

Fireflies Reading Assistant reads an assignment's article and multiple-choice questions, sends those fields to DeepSeek, validates its structured answer output, and optionally selects the suggested radio buttons. It has three original entry points:

| Entry point | Page access | DeepSeek transport | Settings and answers |
| --- | --- | --- | --- |
| Desktop Manifest V3 extension | `chrome.scripting` in the original assignment tab | Extension-page `fetch`, with declared host permissions | `chrome.storage.local` |
| iOS Safari wBlock userscript | Direct DOM access through a userscript | `GM_xmlhttpRequest`, with `@connect api.deepseek.com` | wBlock per-script GM storage |
| Python CLI | Playwright browser session or saved assignment HTML | Python API client | Environment key, local output files and browser profile |

The browser implementations extract `.readable > .note-content`, question cards under `form .card`, and labeled radio options with IDs such as `rb_0_2`. Model responses must contain one valid option ID per question, an explanation and a confidence score between zero and one. Responses with interrupted generation, malformed JSON, duplicate question numbers or invalid option IDs are rejected. Low-confidence browser answers require review before selection. Page content is checked before filling, and selected inputs are looked up again after asynchronous re-rendering. Browser editions leave submission to the user; the Python CLI also offers an explicit `--submit` option.

## Android compatibility gap

The desktop extension needs `chrome.scripting`, `chrome.storage` and a Manifest V3 installation. Stock Android Chrome does not provide desktop extension installation. Edge's Android extension availability varies by version and distribution, so changing the manifest alone does not provide a common route. The iOS userscript depends on wBlock's GM APIs, which ordinary Android pages do not supply. The Python CLI requires a separate Python/Playwright runtime.

A self-contained bookmarklet provides direct access to the signed-in page in both Android browsers without those installation dependencies. Its native cross-origin request requires permission from DeepSeek's CORS policy and the website's Content Security Policy. During development, an unauthenticated OPTIONS request to DeepSeek allowed POST with `authorization,content-type` from `https://fireflies.chiculture.org.hk`. The unauthenticated assignment redirect did not advertise a restrictive Content Security Policy; the signed-in site's policy still needs live verification.

## Implemented Android runtime

The Android build reuses `wblock/fireflies.user.js` for extraction, answer validation, rendering and selection. Its build-time flag selects a native `fetch` adapter and an in-memory settings/cache adapter. Normal wBlock execution keeps the GM request and storage APIs. This avoids maintaining another copy of the assignment parser and answer-selection logic.

`android/build.cjs` creates a complete encoded JavaScript URL and an offline HTML copy helper. No external script loader, hosted relay or public API-key proxy is introduced. Activation is restricted to the exact Fireflies HTTPS origin and individual assignment paths. Repeated activation reopens the existing assistant. The panel uses touch-sized controls, wrapping text and viewport-relative bounds.

Native requests omit credentials and referrers, reject redirects, support abort and a four-minute timeout, and report HTTP or browser-policy failures. Keys are kept only in the current page's memory because a bookmarklet does not have private extension storage. The assignment page's JavaScript context is not an isolation boundary; the Android instructions explain that difference.

## Verification and limits

The original extension and wBlock offline checks remain in the test suite. Android browser checks execute the committed bookmarklet through a JavaScript URL in Chromium using Android Chrome and Edge user agents, touch input, and 360 px / 412 px viewports. They verify extraction, native request fields, omitted cookies/referrers, page-memory storage, async form re-rendering, manual submission, review gating, stale-content rejection, HTTP/network/CSP failures, cancellation, four-minute timeout, repeated activation and layout after viewport resizing. Build checks reject stale generated artifacts.

These are desktop Chromium emulation tests with fixture assignments and mocked completions. They establish the runtime behavior under those conditions, not installation success on a physical phone or compatibility with every signed-in assignment. Device bookmark installation, mobile keyboard behavior, authenticated website policy and a real paid DeepSeek completion remain unverified. The DOM selectors also remain dependent on the current website structure.
