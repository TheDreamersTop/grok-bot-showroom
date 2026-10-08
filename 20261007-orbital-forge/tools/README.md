# tools — 截圖與錯誤檢查 · Screenshot & smoke-test harness

開發時用來在 headless Chrome（SwiftShader 軟體 GPU）裡拍截圖、檢查 console 錯誤的 Node 腳本。不是 demo 的一部分。

需求 *Requirements*：Node 18+、`npm i puppeteer-core`、本機 Chrome（預設 `/usr/bin/google-chrome`，可用環境變數 `CHROME` 指定；`PUPPETEER_CORE` 可指定 puppeteer-core 模組路徑）。

```bash
# 1) 在 repo 根目錄起一個靜態伺服器
python3 -m http.server 8765

# 2) 截圖：步驟以 JSON 傳入（seq*.json 是當時用過的序列；輸出路徑在 /tmp/，可自行修改）
node shot.js "http://localhost:8765/20261007-orbital-forge/?shot=1&tex=384" "$(cat seq1.json)"

# 3) v2 實際模式 smoke test：模擬滑鼠、Shift、1/2/3、Space、H、M、R、Q、滾輪，列出 console 錯誤與 HTTP ≥400
node errcheck.js "http://localhost:8765/20261007-orbital-forge/"

# 4) 通用頁面檢查（v1 / 任何頁面）：console 錯誤、pageerror、失敗請求、HTTP ≥400
node pagecheck.js "http://localhost:8765/20261007-orbital-forge/v1/"
```

`shot.js` 步驟 *steps*：`{"at":N}` 快轉到第 N 幀並凍結（不渲染中間幀）、`{"ff":N}` 快轉、`{"wait":N}` 等到第 N 幀、`{"eval":"js"}`、`{"mouse":[x,y],"steps":n}`、`{"key":"Space"}`、`{"sleep":ms}`、`{"shot":"out.png"}`。
頁面需搭配 `?shot=1`（固定 dt、關閉音效），會暴露 `window.__OF`（frame、redraw、sync、nova、shockAtScreen…）。
