# Android Chrome / Edge 1.1

Use Fireflies Reading Assistant directly in the signed-in assignment tab in Android Chrome or Edge. This edition is a bookmarklet: a saved bookmark whose URL starts with `javascript:`. It bundles the assistant's code and calls DeepSeek directly, without installing an extension or fetching executable code from a remote server.

## Install

1. Open [bookmarklet.txt](https://raw.githubusercontent.com/Justintunsday/pianpianliuying/main/android/bookmarklet.txt). Copy the entire single line. The code starts with `javascript:` and is about 26 KB; do not copy just the visible part.
2. In Chrome or Edge, bookmark an ordinary webpage. Name it **Fireflies Assistant**.
3. Open the browser's **Bookmarks** menu, find that bookmark, and choose **Edit**. Replace the entire **URL** with the copied code and save. Check that `javascript:` remains at the start.
4. Open `https://fireflies.chiculture.org.hk/`, complete verification and sign in manually, then open one assignment. Its URL should look like `/app/assignments/2026-10-07`.
5. With that assignment displayed, tap the address bar, type **Fireflies Assistant**, and tap the saved bookmark suggestion. Opening it through **Bookmarks** is another option if your browser permits bookmarklets there. The assistant opens over the assignment.
6. Enter your own API key in **DeepSeek 设置** (Settings). **保存设置** (Save settings) retains it for the current page only. The default model is `deepseek-flash`; use a model available to your account.
7. Tap **分析答案** (Analyze answers) and keep the browser in the foreground. Expand **答案分析** (Answer analysis) to review the explanations. Low-confidence answers require the review checkbox before selection.
8. Tap **一键勾选** (Select answers), collapse the panel, check the website's selections, and submit manually.

For a copy button, download the repository ZIP from GitHub's **Code → Download ZIP**, extract it, and open `android/install.html` in the browser. That file works without hosting. If clipboard permission is unavailable for a local file, the button selects the code for manual copying. GitHub's source-file view does not run the HTML installer.

After refreshing an assignment, run the bookmark again and re-enter the key. Re-running the bookmark while its assistant already exists reopens that panel. To update the assistant, replace the bookmark URL with the latest code and refresh the assignment.

## Storage and requests

API keys, settings and cached answers remain in memory in the assignment tab. They are not written to `localStorage`, `sessionStorage`, the bookmark URL, or GitHub. Reloading or closing the page discards them; **清除密钥** (Clear key) removes the currently saved key immediately.

The bookmarklet runs in the website's page context, which does not provide extension-level isolation from that website. Use it on the trusted Fireflies assignment site. It sends the article title, article text, questions and options to `https://api.deepseek.com/chat/completions`. Requests omit cookies and referrer information, reject redirects, support cancellation, and time out after four minutes. The initial activation checks the exact HTTPS origin and assignment path.

Before selecting options, it checks that the article, questions and options still match the analyzed assignment. It verifies selections after asynchronous form updates and never submits the form.

## Troubleshooting

- **Nothing opens:** Check that you opened a single assignment and that the bookmark URL still begins with `javascript:`. Invoke the saved bookmark suggestion from the address bar while viewing the assignment. Pasting the code directly into the address bar may remove that prefix or perform a search.
- **Code is incomplete:** Recopy the entire raw text line, or use the local installer. Browser bookmark editors and managed-browser policies may limit JavaScript URLs. Installation on your specific device still needs verification.
- **No questions found:** Finish verification and sign in manually, open an unanswered assignment, wait for it to load, then tap **读取题目** (Read questions). The script expects the site's `.readable` article and `form .card` radio-button structure.
- **API connection failed:** Check your network and keep the tab in the foreground. Requests depend on DeepSeek's CORS policy and the assignment site's Content Security Policy. A restrictive policy is reported as a connection failure; this edition cannot override it.
- **HTTP 401 or another API error:** Check the key, balance and configured model. No key is bundled with this project.
- **Page or options changed:** Reread the assignment and analyze again before selecting answers.

Android Chrome does not load the project's desktop Manifest V3 extension. This bookmarklet is the shared Android route for Chrome and Edge, including installations without extension support.

## Build and verification

From the repository root, using Node.js 20 or later:

```sh
npm ci
npm run build:android
npx playwright install chromium
npm test
```

`wblock/fireflies.user.js` is the shared assistant source. The build enables its bookmarklet runtime, minifies it with esbuild, and generates `bookmarklet.txt` and `install.html`. `install.template.html` is the installer source. Commit both generated files when changing the source. `npm run check:android` detects stale generated files and runs browser checks.

The browser checks use Chromium with Android Chrome and Android Edge user agents, touch input and narrow viewports. They exercise the actual generated JavaScript URL, requests with mocked API responses, option selection after form re-rendering, low-confidence review, stale pages, HTTP/network/policy errors, cancellation, timeout, memory-only storage, repeated activation and viewport resizing. Use `CHROMIUM_PATH` to select a custom browser executable; `/usr/bin/chromium` is used if present, otherwise Playwright's Chromium.

Physical Android devices, browser bookmark editors, the signed-in Fireflies workflow and paid DeepSeek analysis have not been tested. The API's CORS preflight allowed the Fireflies origin during development; future service or site policy changes may affect this edition.
