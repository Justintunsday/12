# Unified userscript architecture · 1.2.0

## One runtime

`wblock/fireflies.user.js` is the only application entry point. It is the original iOS userscript, now shared by iOS, desktop and Android userscript managers. The existing path, name, namespace, host ID and storage keys are retained so wBlock users can update their installed script in place. Metadata declares version 1.2.0 and the same stable download/update URL.

The Python CLI, Manifest V3 extension and generated Android bookmarklet/installer have been removed. There is no platform build flag, native-fetch transport, page-memory storage mode or duplicate application UI. Node.js and Playwright are development-only dependencies; ordinary users import the committed script.

## Manager APIs

The script supports both callback-style `GM_*` APIs and promise-based `GM.*` APIs. Each adapter prefers the legacy function when present, then calls the modern method with its manager object as the receiver. Settings and answer cache are always kept in the manager's per-script storage. Missing APIs produce a visible error rather than falling back to website storage.

Requests use `GM_xmlhttpRequest` or `GM.xmlHttpRequest`, the official DeepSeek endpoint, anonymous mode and a four-minute timeout. Both callback errors and rejected request promises are handled. Cancellation aborts the manager's request handle when provided and discards late responses. Managers must support storage, cross-origin requests and the declared permissions; other browsers/managers require installation testing.

## Shared behavior

The script operates in the top-level Fireflies HTTPS page. It extracts `.readable > .note-content`, question cards under `form .card`, and labeled radio options with IDs such as `rb_0_2`. Reading is restricted to individual assignment paths. Only article title, text, questions and options enter the model prompt.

Model responses must finish normally and contain one valid option per question, a nonempty explanation and a numeric confidence in [0, 1]. Interrupted output, malformed JSON, duplicate numbers and mismatched IDs are rejected. Answers below 80% confidence require manual review before filling.

All platforms use the original floating iOS panel, with selection controls above collapsible explanations. Filling checks the current URL, article, questions and option metadata against the analyzed assignment, then re-fetches inputs while waiting for asynchronous form updates. Submission remains manual.

## Migration

Existing iOS settings and cached answers keep their original manager keys. Desktop extension storage and Python files are not imported into the script; users enter their key again when moving to another manager. Android users replace the old bookmark with a userscript installation in a supported browser. Existing local Python output and browser profile folders remain ignored by Git.

## Verification

- `wblock/check.cjs`: metadata/version consistency, response validation, synchronous and promise-based GM APIs, storage behavior, request errors, cancellation, timeout and URL/frame guards.
- `wblock/check-fill.cjs`: asynchronous form re-rendering, repeated fill, disabled options, rejected clicks and navigation.
- `wblock/check-browser.cjs`: the identical userscript executed in desktop, iPhone and Android Chromium viewports with mocked manager APIs. Exercises extraction, persistent settings/cache across reloads, analysis payloads, low-confidence gating, collapsible UI, selection without submission, stale-page rejection, network/HTTP failures, cancellation and timeout.

Run `npm ci`, `npx playwright install chromium`, then `npm test`. Browser mocks test application behavior, not extension sandboxing or actual cross-origin network policies. Physical iOS/Android devices, actual wBlock/Tampermonkey installations, authenticated Fireflies pages and paid DeepSeek completions remain unverified.

Manager references: [Tampermonkey API documentation](https://www.tampermonkey.net/documentation.php), [Tampermonkey for Firefox on Android](https://addons.mozilla.org/en-US/android/addon/tampermonkey/), [wBlock source](https://github.com/0xCUB3/wBlock).
