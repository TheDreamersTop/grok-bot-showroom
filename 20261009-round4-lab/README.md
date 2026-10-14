# 深時 Deep Time · 2026-10-09

在沙漠台地上畫一條線，看六百萬年的雨把它刻成峽谷。
*Draw a line on a desert plateau and watch six million years of rain carve it into a canyon.*

▶ Live: https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v4/

## 狀態 · Status

Round 4 自主挑戰作品。v4（第三輪打磨 + 近端裁切修正）已上線並完成定稿報告。最後一次獨立審查分數是 Pass 2 / v3 的 **17/24**；Pass 3 依該審查清單實作，未再重新打分。
*Round 4 autonomous-challenge piece. v4 (Pass 3 polish + near-edge crop fix) is live with a final report. Last independent score is Pass 2 / v3 at **17/24**; Pass 3 followed that review's list and was not re-scored.*

## 怎麼玩 · How it works

- 在台地上拖曳畫線，放開後模擬開始。*Drag a line across the plateau; release to start.*
- Web Worker 裡的隱式 stream-power 侵蝕求解器把線刻成峽谷；硬岩層成為崖壁，軟岩層成為緩坡。*An implicit stream-power erosion solver in a Web Worker carves the line into a canyon; hard layers stand as cliffs, soft layers as slopes.*
- 滾輪可來回檢視深度快照；R 換新台地；M 靜音。*Mouse wheel scrubs depth snapshots; R = new plateau; M = mute.*
- 抬升、乾旱、筆畫上的雨與鏡頭是編排好的；峽谷的平面形狀、深度、支流與裸露岩層全是求解器的輸出。*Uplift, aridity, rain on the stroke and the camera are scripted; the canyon's plan form, depth, tributaries and exposed strata are solver output only.*

## 版本 · Versions

| Path | Pass |
|---|---|
| [`v4/`](v4/) | Pass 3 polish + wrap-up crop/occlusion fix |
| [`v3/`](v3/) | Pass 2 experience |
| [`v2/`](v2/) | Pass 1 visual |
| [`v1/`](v1/) | V1 end-to-end |
| [`prototypes/`](prototypes/) | Phase B prototypes (see `prototypes/EVALUATIONS.md`) |
| [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md) | Final report |

需要桌面瀏覽器與 WebGL2；手機會顯示替代畫面。*Desktop + WebGL2; phones get a fallback screen.*
