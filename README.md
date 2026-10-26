# Fireflies Reading Assistant 1.1

Read articles and multiple-choice questions from a signed-in Fireflies assignment page and use DeepSeek to analyze the answers. This project includes an Android Chrome/Edge bookmarklet, a desktop Chrome/Edge Manifest V3 extension (1.0), a wBlock userscript for iOS Safari, and a Python script. No API key is included.

## Android Chrome and Edge

Android Chrome cannot load the desktop extension. Use the self-contained bookmarklet in either Android browser:

1. Open [the bookmark code](https://raw.githubusercontent.com/Justintunsday/pianpianliuying/main/android/bookmarklet.txt) and copy the complete line, including `javascript:`.
2. Bookmark an ordinary webpage, name the bookmark **Fireflies Assistant**, then edit its URL and replace it with the copied code.
3. Sign in to Fireflies, open an individual assignment, tap the address bar, type **Fireflies Assistant**, and tap the saved bookmark suggestion.
4. Enter your own DeepSeek API key, analyze the questions, review the explanations, select the answers, then submit manually on the website.

Keys and answers stay in the current page's memory and are cleared when it reloads or closes. Keep the assignment in the foreground while analyzing. No extension, userscript manager, hosted helper, or external script loader is required.

See [Android installation and troubleshooting](android/README.md). A copy-button installer is also included as `android/install.html`; download the repository and open that file locally. Chromium tests with Android Chrome and Edge user agents and touch viewports pass; physical-device installation and the signed-in live workflow have not been verified.

See [program analysis and platform design](ANALYSIS.md) for the architecture and compatibility decisions.

## iOS Safari (wBlock)

Install the userscript through wBlock using this URL:

https://raw.githubusercontent.com/Justintunsday/pianpianliuying/main/wblock/fireflies.user.js

The script adds a collapsible assistant to the assignment page. Enter your own API key, analyze the questions, review the answers and select options, then submit manually. See [wBlock installation instructions](wblock/README.md) for setup and limitations. Actual iOS behavior has not yet been verified on a device.

## Desktop Chrome and Edge Extension

1. Open `chrome://extensions` in desktop Chrome or `edge://extensions` in desktop Edge and enable **Developer mode**.
2. Click **Load unpacked** and select the `chrome-extension` folder.
3. Complete the website's security verification and sign in manually in Chrome, then open an individual assignment.
4. Click the extension icon. Enter your own DeepSeek API key in the assistant's settings and save it.
5. Click **DeepSeek 分析答案** (Analyze answers), review the answers and supporting explanations, then click **一键勾选答案** (Select all answers).
6. Return to the assignment page, check the selections, and submit manually.

The extension uses the official endpoint `https://api.deepseek.com` and the `deepseek-flash` model by default. Your API key is stored locally in Chrome extension storage. Only the article title, article text, questions, and options are sent to DeepSeek; website cookies and login credentials are not extracted. Answers can be restored for the same assignment tab or exported as JSON.

The extension does not complete or bypass website security verification. Model answers may be incorrect, and confidence scores are self-reported by the model. Low-confidence answers require manual review before automatic selection.

## Python Script

Requires Python 3.10 or later. Run these commands in PowerShell:

```powershell
py -m pip install -r requirements.txt
py -m playwright install chromium
$taskKey = Read-Host 'DeepSeek API Key' -AsSecureString
$env:DEEPSEEK_API_KEY = [System.Net.NetworkCredential]::new('', $taskKey).Password
py fireflies_answer.py --fill
```

On the first run, sign in manually in the separate browser window opened by the script. By default, the script only outputs suggested answers. `--fill` selects the answers, while `--submit` selects and submits them, updating your assignment record on the website.

Run outputs are saved in `outputs`, and browser login data is stored in `.browser-profile`. These folders are excluded from version control.

If the script's browser cannot complete security verification, open the assignment in your regular browser, press Ctrl+S, choose **Webpage, Complete**, and save it as `assignment.html`. Then run:

```powershell
py fireflies_answer.py --html "assignment.html"
```

Local HTML mode outputs suggested answers; select and submit them manually on the website. For additional options, run `py fireflies_answer.py --help`.

## Checks

```powershell
node --check chrome-extension/app.js
node chrome-extension/check.cjs
node chrome-extension/check-fill.cjs
node --check wblock/fireflies.user.js
node wblock/check.cjs
node chrome-extension/check-fill.cjs --wblock
py -m py_compile fireflies_answer.py
```

For the Android build and mobile browser checks, install Node.js 20 or later and run:

```sh
npm ci
npx playwright install chromium
npm test
```

The browser checks use `/usr/bin/chromium` when available, otherwise Playwright's Chromium. Set `CHROMIUM_PATH` to use another Chromium executable. Rebuild the committed Android files after changing the shared userscript or installer template with `npm run build:android`.

Checks cover answer validation, option mapping, interrupted model output, asynchronous form re-rendering, failed selections, mobile layout, native API request behavior, cancellation, timeouts, privacy, and page changes. Physical-device installation and the full live assignment workflow still require verification.
