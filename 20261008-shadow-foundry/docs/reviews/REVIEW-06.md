# REVIEW-06: Shadow Foundry, final. Independent, adversarial

- **Reviewer:** independent. I judged my own renders of the live site and the live JS. The builder's FINAL_REPORT.md and README were fact-checked, not trusted.
- **Tested:** showroom **`0be205c`** (docs; code **`e77ea33`**, "Be the lamp"), still the head when I checked at 21:12 TPE.
- **Window:** 21:12–21:26 TPE, headless Chrome on SwiftShader.
- **Renders:** 25 shot-mode renders: opening ×5, late idle ×3, shatter ×2, viewports ×2, lamp flight/arrival ×9, GEB lamps ×3, TPE.
- **Default-mode session:** one 800×500 session covering the cold load, Esc skip, keys 1/2/3, Esc, click-return, typing GEB in lamp view, and Next in lamp view.
- **Assets:** `reviews/review06-assets/`. Scripts: `r06.sh`, `r06flow.js`.
- **Real-GPU fps** is still unmeasured by anyone. Double-click on a lamp head was **not** driven by mouse; I checked its code path only.

## 0. Verdict

**Score: 23 / 24** (REVIEW-05: 22).

**Be the lamp is the best thing in the piece.**
- From the right lamp you see a woven gold cat hanging in front of the warm pool, with the tree's shadow raking the left wall (`lamp0-k1-t9.png`).
- From the left lamp you see a gold tree inside the blue disc. From the floor lamp, a gold swallow. For GEB, a brass G, E and B.
- It turns the old flaw (the brass spells the figure) into the reveal.
- The flight is a smooth 1.2 s ease with no clipping through geometry.
- Esc, a click, or the same key brings you back. I could not get stuck. 0 errors, 0 warnings.

The problem for a first-time visitor is **discoverability**:
- Nothing on screen ever mentions Be the lamp, the 1/2/3 keys, clicking the sculpture, or dragging a lamp. The lamp hint appears only if the cursor happens to hover a lamp head.
- The opening plays **silently** unless the visitor has already clicked.
- After the 5 s hold, the work **undoes itself** into a tangle and waits for a drag.

So a passive visitor's lasting image is a tangle, and the best frame stays hidden.

## 1. Console / network
- 25 shot renders and the default session: **0 errors, 0 warnings, no 4xx/5xx**. This includes the audio path after keys and clicks.
- The governor stepped q0 → q1 → q2 on SwiftShader and stopped at q2 (DPR 0.8). It did **not** reduce the shadow maps. The overlay now reports the raw rate (0.29–1.0 fps here). **The REVIEW-05 fixes are confirmed.**

## 2. Be the lamp (all three lamps, plus GEB)

See `sheet-lamp-flight.png`, `sheet-lamp-partial.png`, `sheet-lamp2-and-late.png`, `sheet-default-lamp-flow-a.png` and `sheet-default-lamp-flow-b.png`.

| View | What the brass reads as from the lamp | Notes |
|---|---|---|
| Key 2, right lamp (`lv=0`) | **a gold cat** that exactly covers its own shadow | The best frame of the piece. A tree shadow rakes the left quarter of the frame. |
| Key 1, left lamp (`lv=1`) | **a gold tree** in the blue disc | The brass is darker (back-lit) but reads clearly. The cat shadow fills the right edge. |
| Key 3, floor lamp (`lv=2`) | **a gold swallow** on the cream pool | Pale gold on cream, the lowest contrast of the three. The hanging wire shows as a grey dot in the bird's body. |
| GEB, lamps 0/1/2 | **E / G / B** in brass | All three read. The B is a little "8"-like. |

- **Flight:** 1.2 s. The in-between frames (k = 0.2, 0.5, 0.8) slide smoothly, and the brass figure assembles out of the tangle as the camera arrives. It is not jarring.
  - While entering lamp view, the sculpture eases to its solved pose, so you never arrive at a tangle. In default mode at very low fps, one frame (`lv-k6`) showed the floor view mid-ease as a starburst. It is transient.
- **Clipping:** I saw none through walls or rods. Mid-flight to the left lamp, the other lamp's housing passes behind the placard text (`crop-lamp-lens-sliver.png`). It is transient and minor.
- **Getting stuck:** I found no way.
  - Key → Esc returns. Key 2 → key 3 switches directly. A click returns. The same key toggles.
  - Draw mode exits lamp view.
  - Typing GEB in lamp view forged GEB and stayed in lamp view, showing the brass B. Then Next shattered, and Esc returned to No. 1.
- **Jarring:** a shatter or typed forge **while in lamp view** puts the camera inside the storm. Thousands of giant out-of-focus rods fill the frame (`lv-k7-typed-in-lamp.png`, `lv-k9-next-in-lamp.png`). Some will find it thrilling, but it reads as clutter and hides the reveal.
- **Caption:** "You are the lamp — Esc to step back" is illegible on the floor-lamp view (white italic on the cream pool, `lamp2-k1-t9.png`). On the wall views it is fine.

## 3. Regressions from the latest commits
- **Opening** (`sheet-opening-crops.png`):
  - t = 2–3: storm with rod streaks in the beams.
  - t = 4.8: nests.
  - t = 5.5: tree, cat and swallow.
  - The placard follows the lock.
  - **No regression.**
- **Tree pool:** a plain circle now, no barn-door chord. **Fixed.** The pools overlap slightly behind the sculpture at 1440 (TPE), which is fine.
- **Shatter:** storm at +1.4 s, re-forge at +2.4 s. Clean.
- **1280×800 / 1440×900:** layout clean. The Swallow label sits on the floor pool's right rim at 1280; acceptable.
- **Governor recovery:**
  - It steps back up only when the EMA is below **14 ms**, which means more than 71 fps.
  - On a 60 Hz vsync display the frame time is about 16.7 ms, so **it can never recover**.
  - Once a visitor's machine hitches into q1 or q2, they stay there. The damage is mild because q2 is soft, not broken. But the README claim "recovers when frames are fast again" is false on most desktops.

## 4. Cold first-visitor pass (no prior knowledge)

| Time | What the visitor sees | What they can discover |
|---|---|---|
| 0–1 s | Dark room, lamps clunk on. **Silent**, because audio needs a gesture. | Placard: "影鑄 Shadow Foundry · No. 1 — · · ·". Bottom right: "Type any 3 letters to forge them in brass", "Draw your own three shadows", "Next sculpture →". The speaker glyph is tiny, top right. |
| 1–5 s | The storm, the implosion, then three pictures. | Nothing new. |
| 5–10 s | Push-in, solved hero, the names appear. | Nothing new. |
| 10.2 s | **The piece loosens back into a tangle.** | — |
| 12.4 s | The hint appears: "*Drag to turn the sculpture until its shadows become pictures*" (bottom centre, legible, `crop-t20-hint.png`). | Drag. |
| 12–30 s | Tangle, wide camera (`live-t12/20/30.png`). | Only what's listed above. **No mention** of clicking the sculpture, Be the lamp (1/2/3), dragging lamps, Esc to skip, or sound. |

**Discoverable in 30 s:** typing, drawing, Next, and dragging to turn.

**Not discoverable:**
- **Be the lamp.** It shows only via a hover hint on a lamp head that most people won't hover.
- Click-to-shatter. Next covers it.
- Lamp dragging.

**Confusing:**
1. Why the finished picture falls apart at 10 s.
2. A typed word on a slow machine shows "No. 4 — · · ·" for a long time with only a small "forging…".
3. Silence, unless the visitor clicked during the opening.

## 5. Benchmark (/24)

| # | Criterion | R-04 | R-05 | **R-06** | Justification |
|---|---|---|---|---|---|
| 1 | Focal point | 2 | 2 | **2** | Storm → implosion → push-in. The lamp views are perfectly centred. |
| 2 | Value | 2 | 2 | **2** | Unchanged. The floor-lamp view is low-contrast (pale gold on cream). |
| 3 | Palette | 2 | 2 | **2** | Cool, warm and neutral, with gold. |
| 4 | Lighting | 1 | 2 | **2** | The barn door is gone, the pools differ, the beams have streaks. |
| 5 | Depth | 2 | 2 | **2** | Lamp views add strong foreground / midground / wall layering. |
| 6 | Material | 1 | 1 | **2** | Lamp views show it is woven brass rods with a key and rim, not foil. From the main camera it is still a gold block. |
| 7 | Detail at 100 % | 2 | 2 | **2** | Presets are clean. In lamp view the cat and tree outlines are crisp. Typed letters are still ragged. |
| 8 | Originality | 2 | 2 | **2** | Be the lamp completes the concept. |
| 9 | Hero legibility | 2 | 2 | **2** | Holds. |
| 10 | Motion | 2 | 2 | **2** | The lamp flight is smooth. The storm-in-lens is the one cluttered beat. |
| 11 | UI / typography | 1 | 2 | **2** | Placard and cast order are honest. The lamp caption is illegible on the floor view; the best feature is unlisted. |
| 12 | Polish | 1 | 1 | **1** | 0 errors and warnings, no stuck states, a safe governor. But real-GPU fps has never been measured, governor recovery is dead at 60 Hz, the lamp caption contrast is poor, and the opening is silent for a passive visitor. |
| | **Total** | 20 | 22 | **23** | |

## 6. Ranked safe fixes for the remaining ~60–90 min

1. **Advertise Be the lamp** (≈ 10 min, **highest impact**). Add a fourth action link, "Be the lamp · 1 2 3", which enters the cat lamp (`enterLamp(0)`). Optionally also extend the 12.4 s hint to "Drag to turn the sculpture · or press 1 2 3 to be the lamp". The best frame in the piece is currently invisible to almost everyone.
2. **Make the lamp caption legible** (≈ 5 min). Give `#lvcap` a dark pill (`background: rgba(10,8,6,.55); padding: 4px 12px; border-radius: 3px`), or move it to the top of the frame. Today it vanishes on the floor-lamp view.
3. **Leave lamp view when a shatter starts** (≈ 5 min). Call `exitLamp()` at the top of `shatterTo` when `LV.on`, so a forge or Next never flies the storm through the lens. Low risk; both paths are already tested.
4. **Sound cue** (≈ 10 min, medium impact). While the audio context isn't running, pulse the speaker glyph or show a one-line "click anywhere for sound" under it during the opening, and hide it on the first gesture. Do **not** add a start veil this late, because it changes the hero timing.
5. **Governor recovery threshold** (1 min). Change the step-up condition `GOV.ema < 14` to `< 18`, so 60 Hz displays can recover. Otherwise reword the README.
6. *(Only if 1–5 are done, moderate risk)* **Idle re-lock:** after about 25 s with no input in free mode, ease back to the solved pose, using the same easing as the lamp view's solved-pose snap. Then hold, then loosen. That way a passive visitor sees pictures again, not a tangle forever. Skip it if there is any doubt; a stuck detent or a sound loop this late would cost more than it gains.
7. **Docs corrections** (below). Zero risk; do them last, with the final times.

**Don't:** touch the opening timing, presets, the brass shader, the worker fit or the lamp flight path.

## 7. FINAL_REPORT.md and README fact-check

| Claim | Where | Verdict | Correction |
|---|---|---|---|
| "Phase A/B prototypes: 10/24 (best of 3)" | FINAL_REPORT, Evolution table | **Wrong.** REVIEW-01 scored Foundry wire2 10, Foundry solid 9, **Chladni 12**, Lumen 5. | "10/24 (Foundry wire2; Chladni scored 12, Lumen 5)" |
| "Final — " score | FINAL_REPORT, Evolution table | Missing | "**23/24** (REVIEW-06)" |
| "At ~4.2 s the rods all implode together; in the last quarter-second…" | FINAL_REPORT, Hero Moment | **Imprecise.** Still nests at 4.8 s; the figures lock at ≈ 5.0 s (LOCK_T 4.95) and are clear at 5.5 s. | "implode from ~4.2 s; all three pictures lock at ~5 s" |
| "End 21:09 TPE, ~2 h 15 min unused, elapsed 5 h 45 min" | FINAL_REPORT, Actual Work | Stale if work continues to ~23:00 | Update the end time, elapsed time and unused time at delivery. |
| "reviews/REVIEW-01..05.md" | FINAL_REPORT, Artifacts | Stale | "01..06" |
| "Final showroom commit: code e77ea33 + docs-only commit" | FINAL_REPORT, Artifacts | True today. Will be stale after any fix. | Update at delivery. |
| "governor floor and hysteresis" / "recovers when frames are fast again" | FINAL_REPORT; README, Rendering | **Overclaim.** Step-up needs EMA < 14 ms (> 71 fps), which never happens on a 60 Hz vsync display. | Fix the threshold (§6.5) or say "recovers only on high-refresh displays". |
| No. 1 coverage "98.7/99.5/98.4 %", No. 2 "98.7/98.2/98.0 %" | README, How it works | **Mismatch with live.** The live console logs 98.7/99.7/98.2 and 98.7/98.1/98.2. The placard shows 98.2 % and 98.1 %. | Use the live numbers. |
| "It reads in typed order… upright from the camera" | README, How to interact | **Leads with the exception.** Per the builder's own table, 10/22 words are reordered and 12/22 have a 45° floor letter (FINAL_REPORT, Known Limitations). | "It aims to read in typed order… when that casts worse, the worker reorders or tilts, and the placard says so (10 of 22 test words reordered)." |
| "Be the lamp… you see the cat in the brass itself" | Both | **True** (lamp0 view). | — |
| "Typing still works in lamp view; dragging is off. Esc or a click flies back." | README | **True.** Verified. | — |
| "Pass 3 22/24", "Pass 2 20/24", "Pass 1 18/24", "V1 15/24" | FINAL_REPORT | True | — |
| "~1,500 rods", "GEB ≥ 95.6 %", "three.js r160", "static files" | Both | True (1,457 rods; 95.6/95.8/96.6; vendored r160) | — |
| "0 console errors and 0 warnings" | FINAL_REPORT, Testing | True in all my sessions | — |
| Desktop range "1440×900–1920×1080" | README, Known limitations | Conservative: 1280×800 also lays out cleanly | Optionally "1280×800–1920×1080". |
| Test harness files, `shots/p3l-*`, `p3n-live-t7-final.png` | FINAL_REPORT | Exist. The README hero image returns 200 on GitHub. | — |
| Draggable lamps, turning with a magnetic detent | Both | **Not verified this round** (no mouse drag driven). | — |

## 8. Asset index (`reviews/review06-assets/`)
- **Lamp views:**
  - `lamp{0,1,2}-k1-t9.png`, `lamp{0,1,2}-k0.5-t9.png`, `lamp0-k0.2-t9.png`, `lamp1-k0.8-t9.png`, `geb-lamp{0,1,2}-k1.png`
  - Sheets: `sheet-lamp-flight.png`, `sheet-lamp-partial.png`, `sheet-lamp2-and-late.png`
  - `crop-lamp-lens-sliver.png`
- **Default-mode flow:** `lv-*.png`, `sheet-default-lamp-flow-a.png`, `sheet-default-lamp-flow-b.png`, `flow-lamp-800.log`
- **Opening, late idle, shatter, viewports:**
  - `live-t{2,3,4.8,5.5,7,12,20,30}.png`, `sheet-opening-crops.png`, `crop-t20-hint.png`
  - `live-shatter-{1.4,2.4}.png`
  - `live-1280x800-t7.png`, `live-1440x900-w-TPE-t7.png`
