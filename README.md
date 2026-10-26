# Grok Bot Showroom · 作品展示間

這個 repo 收錄我和 **Grok Bot** 一起做的所有專案。每個專案一個資料夾，各自有 README，並且都能直接透過 GitHub Pages 線上試玩。
*A showroom of every project I build with Grok Bot — one folder per project, each with its own README and a live GitHub Pages demo.*

🌐 **展示首頁 Landing page:** https://thedreamerstop.github.io/grok-bot-showroom/

## 專案列表 · Projects

| 開始日期 Date | 專案 Project | 簡介 Description | 線上試玩 Live demo | 原始碼 Source |
|---|---|---|---|---|
| 2026-10-07 | 星鍛 Orbital Forge | 桌面 WebGL2 星核鍛造場：26 萬顆 GPU 粒子、HDR 泛光、超新星與重力井。<br/>*Desktop WebGL2 stellar forge — 262k GPU particles, HDR bloom, supernova & gravity well.* | [v2 ▶](https://thedreamerstop.github.io/grok-bot-showroom/20261007-orbital-forge/) · [v1](https://thedreamerstop.github.io/grok-bot-showroom/20261007-orbital-forge/v1/) | [`20261007-orbital-forge/`](20261007-orbital-forge/) |
| 2026-10-08 | 影鑄 Shadow Foundry | 約 1,500 根黃銅桿的懸吊雕塑，三盞燈投出三個影子；轉到唯一的角度，影子同時鎖定成貓、樹與燕。輸入三個字母即鑄出文字雕塑（可分享 `#w=` 連結），也能畫出自己的三個影子，或「成為那盞燈」從光源看見黃銅裡的圖形。<br/>*~1,500 brass rods, three lamps, three shadows that lock into a cat, a tree and a swallow at one angle. Type three letters to forge a word (shareable `#w=` links), draw your own three shadows, or “be the lamp” and see the figure in the brass itself.* | [▶ Live](https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/) | [`20261008-shadow-foundry/`](20261008-shadow-foundry/) |
| 2026-10-09 | 深時 Deep Time | 在沙漠台地上畫一條線，看六百萬年的雨把它刻成峽谷；走向、深度、支流與裸露岩層全由侵蝕模擬算出。<br/>*Draw a line on a desert plateau and watch six million years of rain carve it into a canyon, all computed by an erosion simulation.* | [v9 ▶](https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v9/) · [Versions](https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/) | [`20261009-round4-lab/`](20261009-round4-lab/) |
| 2026-10-19 | 墨華 Ink Bloom | 一滴墨落入靜水，捲成渦環、下沉、分裂成五瓣，再一層層分裂成墨的吊燈；渦絲動力學與 GPU 示蹤粒子即時模擬。<br/>*Drop ink into a still tank and watch it branch into a vortex-ring cascade — vortex filaments + GPU tracers, raymarched as a dye volume in a backlit glass tank; a glowing tank in a dark studio where a crimson-and-plum chandelier over indigo spreads into an umbrella on a hidden brine layer; write into it with an ink brush (V6).* | [▶ Live](https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/) | [`20261019-ink-bloom/`](20261019-ink-bloom/) |
| 2026-10-25 | 您的來電對我們很重要 Your Call Is Important to Us | 92 秒短片：一個男人打電話想取消訂閱，結果被轉入等候——鏡頭不動，窗外從幾週走到太陽死去，等候音樂隨時代換裝，訂閱照樣續約。<br/>*A 92-second short film: a man calls to cancel his subscription and is put on hold — one locked camera, one room, deep time, and a plan that keeps renewing.* | [▶ Watch](https://thedreamerstop.github.io/grok-bot-showroom/20261025-on-hold/) | [`20261025-on-hold/`](20261025-on-hold/) |
| 2026-10-26 | 媽，是我 Hi Mum, It's Me | 60 秒短片，為 Common Defense 而作：一則聽起來就像兒子的訊息，其實是讀過你貼文的機器寫的。<br/>*A 60-second short film for Common Defense: a message that sounds exactly like your son, written by a machine that read your posts.* | [▶ Watch](https://thedreamerstop.github.io/grok-bot-showroom/20261026-hi-mum/) | [`20261026-hi-mum/`](20261026-hi-mum/) |

## 資料夾命名規則 · Folder naming

```
YYYYMMDD-<slug>/
```

- `YYYYMMDD` 是專案的**開始日期**（台北時間），所以資料夾會依時間先後自然排序。*The date is the project's start date, so folders sort chronologically.*
- `<slug>` 用小寫英文與連字號，例如 `orbital-forge`。*Lowercase, hyphenated slug.*
- 同一專案後續的改版放在同一個資料夾內（例如舊版放進 `v1/` 子資料夾），不另開新資料夾。*Later versions stay in the same folder (older versions in sub-folders such as `v1/`).*

每個專案資料夾的慣例 *Per-project layout*：

| 路徑 Path | 內容 Contents |
|---|---|
| `index.html` | 可直接試玩的 demo（Pages 入口）*Playable entry point* |
| `README.md` | 專案說明、操作、技術、版本歷史 *Project docs* |
| `shots/` | 截圖 *Screenshots* |
| `docs/` | 開發報告與筆記 *Build reports & notes* |
| `tools/` | 截圖／測試等輔助工具（非必要）*Helper tooling (optional)* |

## GitHub Pages 怎麼運作 · How Pages serves each folder

本 repo 以 **Deploy from a branch → `main` / `(root)`** 發佈，整個 repo 就是一個靜態網站，所以**每個資料夾自動擁有自己的網址，所有專案同時在線**，互不影響：
*The whole repo is published as one static site, so every folder gets its own URL and all projects are live at once:*

```
https://thedreamerstop.github.io/grok-bot-showroom/                          ← 展示首頁 index.html
https://thedreamerstop.github.io/grok-bot-showroom/<YYYYMMDD-slug>/          ← 專案 demo
https://thedreamerstop.github.io/grok-bot-showroom/<YYYYMMDD-slug>/v1/       ← 舊版（若有）
```

注意事項 *Notes*：
- 所有資源路徑必須是**相對路徑**（`./js/main.js`，不要用 `/js/main.js`），因為網站位於 `/grok-bot-showroom/` 子路徑下。*Use relative asset paths — the site lives under a sub-path.*
- 根目錄有 `.nojekyll`，讓 GitHub Pages 原樣提供檔案（不經 Jekyll 處理）。*`.nojekyll` serves files as-is.*
- 新增專案時：建立資料夾 → 放入 `index.html` 與 `README.md` → 在上方表格與根目錄 `index.html` 加一列。*To add a project: new folder, add it to this table and to the root `index.html`.*

---
Built with Grok Bot · 由 Grok Bot 協作完成
