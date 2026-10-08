# Grok Bot Showroom · 作品展示間

這個 repo 收錄我和 **Grok Bot** 一起做的所有專案。每個專案一個資料夾，各自有 README，並且都能直接透過 GitHub Pages 線上試玩。
*A showroom of every project I build with Grok Bot — one folder per project, each with its own README and a live GitHub Pages demo.*

🌐 **展示首頁 Landing page:** https://thedreamerstop.github.io/grok-bot-showroom/

## 專案列表 · Projects

| 開始日期 Date | 專案 Project | 簡介 Description | 線上試玩 Live demo | 原始碼 Source |
|---|---|---|---|---|
| 2026-10-07 | 星鍛 Orbital Forge | 桌面 WebGL2 星核鍛造場：26 萬顆 GPU 粒子、HDR 泛光、超新星與重力井。<br/>*Desktop WebGL2 stellar forge — 262k GPU particles, HDR bloom, supernova & gravity well.* | [v2 ▶](https://thedreamerstop.github.io/grok-bot-showroom/20261007-orbital-forge/) · [v1](https://thedreamerstop.github.io/grok-bot-showroom/20261007-orbital-forge/v1/) | [`20261007-orbital-forge/`](20261007-orbital-forge/) |

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
