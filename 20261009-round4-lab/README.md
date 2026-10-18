# 深時 Deep Time · 2026-10-09

在沙漠台地上畫一條線，看六百萬年的雨把它刻成峽谷。
*Draw a line on a desert plateau and watch six million years of rain carve it into a canyon.*

▶ Live: https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v5/

## 狀態 · Status

Round 4 自主挑戰作品。v4（第三輪打磨 + 近端裁切修正）已上線並完成定稿報告。v4 已於 2026-10-14 由獨立對抗式審查重新打分：**15/24（v3 為 17/24），未通過兒童測試**（盲猜形狀 4/9；高瘦形狀被裁切、多筆畫只留第一筆、閉合形狀內島看起來像凸起的方塊）。詳見 [`docs/reviews/REVIEW-05.md`](docs/reviews/REVIEW-05.md)。2026-10-18：v5 已上線，修正 REVIEW-05 的阻擋問題（尚未經獨立審查重新打分）。
*Round 4 autonomous-challenge piece. v4 (Pass 3 polish + near-edge crop fix) is live with a final report. v4 was independently re-scored on 2026-10-14: **15/24 (v3 was 17/24), kids-test FAIL** (blind shape read 4/9; tall shapes cropped, multi-stroke drawings keep only the first stroke, closed shapes' inner islands read as raised blocks). See [`docs/reviews/REVIEW-05.md`](docs/reviews/REVIEW-05.md). 2026-10-18: v5 is live with fixes for the REVIEW-05 blockers (not yet independently re-scored).*

## 怎麼玩 · How it works

- 在台地上拖曳畫線，放開後模擬開始。*Drag a line across the plateau; release to start.*
- Web Worker 裡的隱式 stream-power 侵蝕求解器把線刻成峽谷；硬岩層成為崖壁，軟岩層成為緩坡。*An implicit stream-power erosion solver in a Web Worker carves the line into a canyon; hard layers stand as cliffs, soft layers as slopes.*
- 滾輪可來回檢視深度快照；R 換新台地；M 靜音。*Mouse wheel scrubs depth snapshots; R = new plateau; M = mute.*
- 抬升、乾旱、筆畫上的雨與鏡頭是編排好的；峽谷的平面形狀、深度、支流與裸露岩層全是求解器的輸出。*Uplift, aridity, rain on the stroke and the camera are scripted; the canyon's plan form, depth, tributaries and exposed strata are solver output only.*

## 版本 · Versions

| Path | Pass |
|---|---|
| [`v5/`](v5/) | REVIEW-05 fixes: framing, multi-stroke, hole read, plateau edge, postcard (not yet independently re-scored) |
| [`v4/`](v4/) | Pass 3 polish + wrap-up crop/occlusion fix |
| [`v3/`](v3/) | Pass 2 experience |
| [`v2/`](v2/) | Pass 1 visual |
| [`v1/`](v1/) | V1 end-to-end |
| [`prototypes/`](prototypes/) | Phase B prototypes (see `prototypes/EVALUATIONS.md`) |
| [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md) | Final report |
| [`docs/reviews/REVIEW-05.md`](docs/reviews/REVIEW-05.md) | Independent re-score of live v4 (15/24) |

需要桌面瀏覽器與 WebGL2；手機會顯示替代畫面。*Desktop + WebGL2; phones get a fallback screen.*
