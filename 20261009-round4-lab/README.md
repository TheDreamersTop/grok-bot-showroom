# 深時 Deep Time · 2026-10-09

在沙漠台地上畫一條線，看六百萬年的雨把它刻成峽谷。
*Draw a line on a desert plateau and watch six million years of rain carve it into a canyon.*

▶ Live: https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v9/

## 狀態 · Status

**v9 通過：2026-10-19 獨立對抗式審查 21/24，門檻通過（原創性 2、兒童測試 2）。** 詳見 [`docs/reviews/REVIEW-10.md`](docs/reviews/REVIEW-10.md) 與 [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md)。誠實的但書：通過得很勉強。依 REVIEW-09 的規則（只排除弱猜）盲猜為 9/9；依審查者更嚴格的規則（只算有把握的猜測）為 7/9，屬邊緣。箭頭與太陽是最不穩的兩個形狀。仍待改進：5/9 張明信片沒有地平線、箭頭的倒鉤會併成鉤狀、牆緣有鋸齒、缺少側谷與階地等侵蝕細節、岩層色彩偏飽和。歷次分數：v1 14、v2 16、v3 17、v4 15、v5 16、v6 17、v7 19、v8 20（兒童測試未通過）、v9 21（通過）。
*v9 passed: independently scored **21/24** on 2026-10-19, gate PASS (originality 2, kids test 2). See [`docs/reviews/REVIEW-10.md`](docs/reviews/REVIEW-10.md) and [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md). Honest caveat: the pass is narrow. The strict blind read is 9/9 under REVIEW-09's rule (drop weak guesses only), but 7/9 under the reviewer's stricter confident-only count, which is borderline. The arrow and the sun are the fragile reads. Remaining weaknesses: 5 of 9 postcards have no horizon, the arrow's barbs fold into a hook, wall edges are blocky, there are no side canyons or benches, and the strata are over-saturated. Score history: v1 14, v2 16, v3 17, v4 15, v5 16, v6 17, v7 19, v8 20 (kids-test FAIL), v9 21 (PASS).*

## 怎麼玩 · How it works

- 在台地上拖曳畫線，放開後模擬開始。*Drag a line across the plateau; release to start.*
- Web Worker 裡的隱式 stream-power 侵蝕求解器把線刻成峽谷；硬岩層成為崖壁，軟岩層成為緩坡。*An implicit stream-power erosion solver in a Web Worker carves the line into a canyon; hard layers stand as cliffs, soft layers as slopes.*
- 滾輪可來回檢視深度快照；R 換新台地；M 靜音。*Mouse wheel scrubs depth snapshots; R = new plateau; M = mute.*
- 抬升、乾旱、筆畫上的雨與鏡頭是編排好的；峽谷的平面形狀、深度、支流與裸露岩層全是求解器的輸出。*Uplift, aridity, rain on the stroke and the camera are scripted; the canyon's plan form, depth, tributaries and exposed strata are solver output only.*

## 版本 · Versions

| Path | Pass |
|---|---|
| [`v9/`](v9/) | REVIEW-09 fixes: side canyons off (they read as legs), look-down postcard for zigzags / junctions / bumpy outlines (bolt, arrow, tree, key, cloud), protected acute corners, brighter gorge floors (canyon median ≥ .165), no wall tick marks, higher low-quality floor (**REVIEW-10: 21/24, PASS**, narrowly: 7/9 confident-only) |
| [`v8/`](v8/) | REVIEW-08 fixes: postcard frames the newest carve's real rim cells with a 5% margin (automated in-frame check), gorge fill light (floors ~17%), sim side canyons, horizontal strata + benches + talus, 3/4 view for thin glyphs, clean silted carves (REVIEW-09: 20/24, FAIL on kids test) |
| [`v7/`](v7/) | REVIEW-07 fixes: safe-area postcard, horizon + sky + foreground ledge, upright glyphs (yaw within ±25°), branching side canyons, benches, lip cap + strata, colour script (REVIEW-08: 19/24, FAIL) |
| [`v6/`](v6/) | REVIEW-06 fixes: thin-shape postcard, island shading, side gullies, edge freeze (REVIEW-07: 17/24, FAIL) |
| [`v5/`](v5/) | REVIEW-05 fixes: framing, multi-stroke, hole read, plateau edge, postcard (REVIEW-06: 16/24, FAIL) |
| [`v4/`](v4/) | Pass 3 polish + wrap-up crop/occlusion fix |
| [`v3/`](v3/) | Pass 2 experience |
| [`v2/`](v2/) | Pass 1 visual |
| [`v1/`](v1/) | V1 end-to-end |
| [`prototypes/`](prototypes/) | Phase B prototypes (see `prototypes/EVALUATIONS.md`) |
| [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md) | Final report |
| [`docs/reviews/REVIEW-05.md`](docs/reviews/REVIEW-05.md) | Independent re-score of live v4 (15/24) |

需要桌面瀏覽器與 WebGL2；手機會顯示替代畫面。*Desktop + WebGL2; phones get a fallback screen.*
