# 星鍛 Orbital Forge — 建置報告

> 📁 公開版備註：ship.page 認領 token 已移除；ship.place 網址約 2026-11-06～07 到期，僅作歷史紀錄。v1 現在可在 https://thedreamerstop.github.io/grok-bot-showroom/20261007-orbital-forge/v1/ 試玩（showroom 版改用同資料夾 `vendor/three.module.js`（r160），不再依賴 unpkg CDN）。下方 Paths 表為開發機路徑；showroom 中對應為 `v1/index.html`、`v1/vendor/`、`shots/v1/desktop.jpg`。


**Live URL:** https://burly-belief-ipm9p.ship.place/  
**Deployed:** 2026-10-07 22:21 (Asia/Taipei, UTC+8)  
**Expires (free drop):** ~2026-11-06  

## Paths
| Path | Note |
|------|------|
| `/workspace/_tmp/overnight/20261007-orbital-forge/index.html` | 單檔正式體驗（~37 KB） |
| `/workspace/_tmp/overnight/20261007-orbital-forge/DEPLOY_URL.txt` | 公開 URL |
| `/workspace/_tmp/overnight/20261007-orbital-forge/shots/desktop.png` | 1920×1080 桌面截圖 |
| `/workspace/_tmp/overnight/20261007-orbital-forge/vendor/three.module.js` | Three.js r160 離線副本 |
| `/workspace/_tmp/overnight/20261007-orbital-forge/stub.html` | 早期 stub 部署用 |

## Controls
| Input | Action |
|-------|--------|
| 拖曳 | 軌道旋轉攝影機 |
| 移動 | 噴灑／雕塑粒子；路徑短暫形成星座線 |
| 點擊 | 震波 shockwave |
| 滾輪 | 縮放 |
| `Shift` 按住 | 重力井（吸引粒子至游標） |
| `1` / `2` / `3` | 材料：電漿 / 晶核 / 灰燼 |
| `Space` | 核心爆發 |
| `F` | 全螢幕 |
| `H` | 隱藏／顯示 HUD |
| `R` 或「重置」鈕 | 重置鍛造場 |
| 「複製種子」 | 複製 `OF-XXXXXXXX` 種子與參數 |

## What was polished
- 載入即英雄鏡頭：攝影機從遠距緩入核心，intro 標題卡淡出後自動震波＋粒子爆發（無需點擊）
- 雙粒子系統（forge 4200 + spray 1800）＋ Additive glow sprites 偽 bloom
- 三材料視覺／物理差異（電漿渦旋、晶核晶格、灰燼飄散）
- 軌道環、星野、film grain、暗角、自訂游標
- 星座連線（滑鼠軌跡）、配方面板即時 seed／參數、複製種子
- FPS 自適應（掉幀時縮小粒子 size／opacity）
- 繁中 HUD＋英文副標；桌面 16:9 導向
- ship.page 匿名單 HTML 部署；CDN Three.js（unpkg r160）

## Known limits
- 免費 ship.page 右下角有 Hosted badge；匿名 drop 約 30 天到期，無法同 URL 原地更新
- 軟體 WebGL（SwiftShader）截圖環境約 16–18 FPS；真實桌面 GPU 目標 60 FPS
- 未做任何行動版適配（依需求）
- 瀏覽器仍可能請求 `/favicon.ico`（已內嵌 SVG data-URI icon）
- Bloom 為 additive sprites，非完整 postprocessing stack（為效能取捨）

## Pass / Fail checklist
| # | Criterion | Result |
|---|-----------|--------|
| 1 | Public https URL returns 200；~2s 內自動開場視覺 | **PASS**（200；intro ~2.2s 後隱藏並爆發） |
| 2 | Mouse orbit + ≥2 keyboard modes | **PASS**（orbit；驗證 `1/2/3` 電漿/晶核/灰燼、`Space` 爆發） |
| 3 | Impressive 1920×1080 `shots/desktop.png` | **PASS** |
| 4 | No mobile work | **PASS**（刻意零行動版） |

## Deploy history (early stub → final)
1. Stub: `https://knowing-tower-cx8pp.ship.place/`
2. First full: `https://tide-utensil-cxixw.ship.place/`
3. Perf patch: `https://chip-topaz-mmpmk.ship.place/`
4. **Final:** `https://burly-belief-ipm9p.ship.place/`
