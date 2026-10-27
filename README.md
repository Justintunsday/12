# Fireflies Reading Assistant · Usage Guide

Use DeepSeek to explain multiple-choice questions on [篇篇流萤 / Fireflies](https://fireflies.chiculture.org.hk/), review the suggested answers, and select options on your assignment page. The assistant reads the article, questions and options from an individual assignment. You complete website verification and sign in yourself.

This guide covers release 1.1. The desktop extension still displays version 1.0.

## 1. Choose your version

| Your device | Use this version | What you need to install |
| --- | --- | --- |
| Android phone or tablet, Chrome or Edge | [Android bookmarklet](#2-android-chrome-or-edge) | A saved browser bookmark containing the assistant code |
| Windows, macOS or Linux, desktop Chrome or Edge | [Desktop extension](#3-desktop-chrome-or-edge) | The repository's `chrome-extension` folder |
| iPhone or iPad, Safari | [wBlock userscript](#4-iphone-or-ipad-safari) | wBlock and the Fireflies userscript |
| Computer, command-line workflow | [Python script](#6-python-script-advanced) | Python 3.10+, Python dependencies and Playwright Chromium |

For the three browser versions, you do **not** need Python, Node.js or a terminal. Android Chrome cannot load the desktop extension; use the bookmarklet on Android.

### Before you start

1. Make sure you can sign in to Fireflies and open an unanswered assignment with its article and multiple-choice questions loaded.
2. Obtain your own API key from the [DeepSeek platform](https://platform.deepseek.com/). API analysis uses your DeepSeek API balance. No API key or API credit is included in this repository.
3. Keep the key private. Enter it in the assistant's settings or your local Python environment; do not put it in GitHub issues, source files or the bookmark URL.
4. Check the model name in settings. The current default is `deepseek-flash`; change it to a compatible model available to your API account if necessary.

An individual assignment URL looks like `https://fireflies.chiculture.org.hk/app/assignments/2026-10-07`. The date is an example: use the URL of **your** assignment, rather than the homepage or assignment list.

## 2. Android Chrome or Edge

A **bookmarklet** is a saved bookmark whose URL contains JavaScript. Opening this bookmark on an assignment adds the assistant to that page.

### Install once

1. Open [the complete bookmark code](https://raw.githubusercontent.com/Justintunsday/pianpianliuying/main/android/bookmarklet.txt) and copy the entire single line, including `javascript:` at the beginning. The line is about 26 KB; select all of it.
2. In Chrome or Edge, bookmark an ordinary webpage and name the bookmark **Fireflies Assistant**.
3. Open the browser's **Bookmarks** menu, find that bookmark, and choose **Edit**.
4. Replace its entire **URL** with the copied code and save. Check that the URL still starts with `javascript:`.

If copying the raw text is difficult, [download the repository ZIP](https://github.com/Justintunsday/pianpianliuying/archive/refs/heads/main.zip), extract it, and open `android/install.html` in your browser. Its **Copy bookmark code** button helps copy the same code. If clipboard access is unavailable, it selects the text so you can copy manually. Opening the HTML file's source view on GitHub does not run the installer.

### Use on an assignment

1. Open Fireflies in the same browser, finish verification and sign in, then open your assignment.
2. Tap the address bar, type **Fireflies Assistant**, and tap the saved bookmark suggestion. If your browser allows it, you can also open the bookmark from **Bookmarks**. The assistant panel should appear over the assignment.
3. Expand **DeepSeek 设置** (Settings), enter your API key and model name, and tap **保存设置** (Save settings).
4. Check the article title and question count. If needed, tap **读取题目** (Read questions).
5. Tap **分析答案** (Analyze answers). Keep this tab in the foreground while it runs.
6. Expand **答案分析** (Answer analysis) and read the explanations. If a low-confidence review checkbox appears, check the answers before ticking it.
7. Tap **一键勾选** (Select answers), then **收起** (Collapse). Check the selections on the website and submit manually.

**Each time the assignment reloads or closes, the Android key and answers are cleared.** Run the bookmark again and re-enter the key. Running it twice on the same loaded page reopens the existing panel.

For detailed setup and browser-policy limitations, see the [Android guide](android/README.md).

## 3. Desktop Chrome or Edge

### Install once

1. [Download the repository ZIP](https://github.com/Justintunsday/pianpianliuying/archive/refs/heads/main.zip) and extract it to a folder you will keep on your computer.
2. Open `chrome://extensions` in desktop Chrome or `edge://extensions` in desktop Edge.
3. Enable **Developer mode**, click **Load unpacked**, and select the **`chrome-extension` folder inside the extracted repository**. Select the folder containing `manifest.json`, rather than the ZIP or repository root.
4. Open the browser's extensions menu and find **篇篇流萤 · 阅读答题助手**. Pin it to the toolbar if you want quick access.

### Use on an assignment

1. In the same browser, sign in to Fireflies and open your assignment.
2. While that assignment tab is active, click the extension icon. The assistant opens in a separate tab and reads the original assignment.
3. In **接口设置** (API settings), enter your API key and model name, then click **保存设置** (Save settings).
4. Confirm the title and question count. Click **读取题目** (Read questions) if you need to read the page again.
5. Click **DeepSeek 分析答案** (Analyze answers), then review each answer and explanation. Complete the review checkbox if one appears.
6. Click **一键勾选答案** (Select answers), then **返回题目页** (Return to assignment). Check the selections and submit on the website yourself.

Keep both the assistant and original assignment tabs open during analysis; you may switch to other tabs. Settings are saved locally in the extension. Cached answers can be restored for the same original assignment tab when its content has not changed. **导出文章与答案** exports the currently loaded article, questions and any generated answers as JSON.

See the [desktop extension guide](chrome-extension/README.md) for additional details.

## 4. iPhone or iPad: Safari

### Install once

1. Install or update [wBlock](https://apps.apple.com/hk/app/wblock/id6746388723), then follow wBlock's instructions to enable its Safari extension.
2. In wBlock, open **Userscripts** and add a script using this URL:

   ```text
   https://raw.githubusercontent.com/Justintunsday/pianpianliuying/main/wblock/fireflies.user.js
   ```

3. Enable the script and apply changes if wBlock prompts you. Allow **wBlock Scripts** to run on `fireflies.chiculture.org.hk` in Safari.
4. If URL installation is unavailable, import the script file or paste its complete contents into wBlock's userscript editor. Add it as a **userscript**, rather than a filter list.

### Use on an assignment

1. In Safari, sign in to Fireflies and open your assignment. Reload the page after installing the script.
2. Tap the floating **答题助手** (Answer assistant) button.
3. Expand **DeepSeek 设置** (Settings), enter your API key and model name, and tap **保存设置** (Save settings).
4. Tap **读取题目** (Read questions), then **分析答案** (Analyze answers). Keep Safari in the foreground.
5. Expand **答案分析** (Answer analysis), review the explanations, and complete the review checkbox if one appears.
6. Tap **一键勾选** (Select answers), then **收起** (Collapse). Open the website's answer tab if needed, check the selections, and submit manually.

Settings and cached answers are stored through wBlock's per-script storage. **清除密钥** (Clear key) removes this script's saved settings. See the [iOS guide](wblock/README.md) for permissions and storage details.

## 5. Understanding the controls and results

The browser interface uses Chinese labels:

| Label | Meaning |
| --- | --- |
| 答题助手 | Open the answer assistant |
| 读取题目 | Read the current article and questions again |
| 分析答案 / DeepSeek 分析答案 | Ask DeepSeek for answers and explanations |
| 答案分析 | Expand or collapse the mobile answer explanations |
| 一键勾选 / 一键勾选答案 | Select the suggested options on the website |
| 保存设置 | Save the key and model using this version's storage |
| 清除密钥 | Clear saved settings in the Android or iOS version |
| 取消 / 取消分析 | Cancel the current analysis |
| 收起 | Collapse the mobile panel |
| 返回题目页 | Return to the desktop extension's original assignment tab |
| 导出文章与答案 | Download JSON from the desktop extension |

Each generated answer includes the selected option, an explanation and a **model-estimated confidence score**. That score is not an accuracy guarantee. In the browser versions, any answer below 80% confidence requires the review checkbox before selection is enabled.

**Selecting answers and submitting are separate actions.** The browser versions select options only; you review and submit on the website. If the article or options change after analysis, read the assignment again and generate fresh answers. Do not rely on an old answer set for a changed page.

## 6. Python script (advanced)

The Python version opens a separate Chromium window with its own saved browser session. It can also analyze a saved HTML file or an exported `assignment.json`. Use this option if you prefer a terminal workflow.

### Install and configure

Install Python 3.10 or later, download and extract the repository, then open a terminal **inside the extracted repository folder**.

**Windows PowerShell:**

```powershell
py -m pip install -r requirements.txt
py -m playwright install chromium
$taskKey = Read-Host 'DeepSeek API Key' -AsSecureString
$env:DEEPSEEK_API_KEY = [System.Net.NetworkCredential]::new('', $taskKey).Password
$assignmentUrl = Read-Host 'Paste your full Fireflies assignment URL'
py fireflies_answer.py --url "$assignmentUrl"
```

**macOS or Linux, using Bash or Zsh:**

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m playwright install chromium
printf 'DeepSeek API Key: '
read -r -s DEEPSEEK_API_KEY
printf '\n'
export DEEPSEEK_API_KEY
printf 'Paste your full Fireflies assignment URL: '
read -r assignmentUrl
python fireflies_answer.py --url "$assignmentUrl"
```

The key prompt hides your input. These commands set the key for the current terminal session. If you open another terminal, set the key again. To change the model, add `--model "MODEL_NAME"` to the command, replacing `MODEL_NAME` with a compatible model available to your account.

When Chromium opens, complete verification and sign in **in that window**. Wait for the assignment to load, return to the terminal, and press Enter when prompted. The default command prints and saves suggestions. It waits for another Enter before closing the browser, so you can review the results.

### Choose what the script does

These examples use PowerShell's `py` launcher and the `$assignmentUrl` entered above. In the macOS/Linux environment, replace `py` with `python`.

| Command | Behavior |
| --- | --- |
| `py fireflies_answer.py --url "$assignmentUrl"` | Analyze and save suggestions; leave options unchanged |
| `py fireflies_answer.py --url "$assignmentUrl" --fill` | Analyze and select options; leave submission to you |
| `py fireflies_answer.py --url "$assignmentUrl" --submit` | Analyze, select and submit; this updates the website's assignment record |
| `py fireflies_answer.py --url "$assignmentUrl" --extract-only` | Save the article and questions without calling DeepSeek; no API key required |
| `py fireflies_answer.py --help` | Show all options |

By default, Python stops selection and submission if any confidence score is below 80%; it still saves the suggested answers. Unlike the browser interface, it has no review checkbox. Review those suggestions and fill them manually. Run results are stored in timestamped folders under `outputs/`; the separate browser session is stored in `.browser-profile/`.

### If Chromium cannot finish website verification

1. Open the assignment in your regular desktop browser and finish verification and login there.
2. Wait until the article and questions appear, then save the page using **Webpage, Complete** as `assignment.html`.
3. With `DEEPSEEK_API_KEY` still set, run:

   ```powershell
   py fireflies_answer.py --url "$assignmentUrl" --html "assignment.html"
   ```

This reads the saved file without opening Chromium. Review the output, then select and submit manually on the live website. Local-file mode cannot be combined with `--fill` or `--submit`.

For an `assignment.json` exported by the Python script, use `--input "path/to/assignment.json"` instead of `--html`. The desktop extension's `fireflies-answers.json` has a different wrapper structure and is not a direct `--input` file.

## 7. Troubleshooting

| Problem | What to check |
| --- | --- |
| Android bookmark does nothing | Verify the saved URL starts with `javascript:` and includes the full code. Invoke the saved bookmark suggestion while viewing an assignment. Pasting the code into the address bar can turn it into a search. |
| Desktop extension is missing | Extract the ZIP first, enable Developer mode, and load the inner `chrome-extension` folder. Find the assistant in the browser's extensions menu. |
| No floating button in Safari | Enable the userscript in wBlock, allow its Safari extension on the Fireflies domain, apply changes, and reload the assignment. |
| Article or questions cannot be found | Complete verification and login, open an individual unanswered assignment, wait for it to load, and read the questions again. The homepage and assignment list are not supported. |
| DeepSeek returns HTTP 401 or another API error | Check the key, API balance and model name in the DeepSeek platform. Re-enter the settings and save them. |
| Connection error or four-minute timeout | Check the network. Keep mobile browsers in the foreground, cancel if necessary, and retry. Android requests also depend on the site's browser security policy and DeepSeek's cross-origin policy. |
| Select answers is disabled | Wait for successful analysis. If the low-confidence review checkbox appears, review the answers and tick it. Failed or interrupted analysis cannot be used to fill answers. |
| Page or options changed | Read the assignment again and analyze it again before filling. |
| Some options did not remain selected | Return to the website and inspect them. Refresh or reread the assignment before retrying; selection depends on the site's current form structure. |
| Android asks for the key again | Expected after a reload or closed page: Android settings are kept only in that page's memory. |

The project does not complete or bypass website verification. If the website changes its article or question layout, extraction and selection may need a code update.

## 8. Data storage, updates and verification status

Only the article title, article text, questions and options are included in the DeepSeek analysis data. The API key is sent as authentication to the configured API endpoint. Website login credentials are not extracted into the prompt.

| Version | Where settings and results are kept | How to update |
| --- | --- | --- |
| Android | Current assignment page memory; lost on reload or close. Runs in the website's page context. | Replace the bookmark URL with the latest code, then reload the assignment. |
| Desktop extension | Local extension storage; optional JSON exports in your downloads. | Replace the extracted extension files, click Reload on the extensions page, then reopen the assistant from the assignment. |
| iOS wBlock | wBlock per-script storage; wBlock sync/backup settings may affect retention. | Update or replace the userscript in wBlock, apply changes, then reload Safari's assignment page. |
| Python | Key in the process environment; results in `outputs/`; browser session in `.browser-profile/`. | Download the latest files and reinstall requirements if they changed. |

The repository excludes Python output and browser-profile folders from Git, but files you export or share can still contain assignment content.

The automated checks cover response validation, option selection, asynchronous form updates and error handling. Android checks execute the generated bookmarklet in desktop Chromium with Android Chrome/Edge user agents, touch input and mobile viewports. **Physical Android/iOS installation, the signed-in live website workflow and a real paid DeepSeek completion remain unverified.**

## 9. For contributors

Ordinary browser users can use the committed installation files without building them. To run checks or rebuild the Android files, install Node.js 20 or later and run from the repository root:

```sh
npm ci
npx playwright install chromium
npm test
```

The browser checks use `/usr/bin/chromium` when available, otherwise Playwright's Chromium. Set `CHROMIUM_PATH` to select another Chromium executable.

After changing the shared userscript or Android installer template, run `npm run build:android` and commit both generated files, `android/bookmarklet.txt` and `android/install.html`. Python syntax can be checked with `python -m py_compile fireflies_answer.py`.

See [ANALYSIS.md](ANALYSIS.md) for the architecture and platform decisions, and the platform guides for additional details: [Android](android/README.md), [desktop extension](chrome-extension/README.md), [iOS wBlock](wblock/README.md).
