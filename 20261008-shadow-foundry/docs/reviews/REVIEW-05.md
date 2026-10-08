# REVIEW-05: Shadow Foundry, Pass 3 (Polish). Independent, adversarial

- **Reviewer:** independent; judged only my own renders of the live site plus the live JS. The builder's notes were used only as a checklist.
- **Tested:** showroom commit **`1525152`** ("typing during the opening is buffered; labels avoid the UI", 19:49 TPE). I re-checked at 20:10 TPE and it was still the head, so all renders below are of that commit.
- **Window:** 19:53–20:20 TPE. Headless Chrome on SwiftShader. 21 shot-mode renders (`?shot=1`), plus 3 default-mode sessions: 1920 typing, 800×500 shatter chain + paste, and a 1280 governor probe.
- **Assets:** `reviews/review05-assets/`. The scripts that made them are there too: `r05.sh`, `r05flow.js`, `r05flow2.js`, `r05gov.js`.

## 0. Verdict

**Score: 22 / 24** (REVIEW-04: 20; Pass 3 target: ≥ 21, **met**).

Pass 3 fixed nearly everything I flagged in REVIEW-04:
- **Spoiler:** the placard now shows "No. 1 — · · ·" until the lock, then the names.
- **Typed words:** they read as typed: TPE, LOV, GEB, and WMW come out in order with an upright floor letter. When the worker reorders a word, the placard says so.
- **Pools:** the letters sit inside them. The pools no longer form a Venn diagram.
- **Plaster:** ≈ 0.019 linear, so the room exists now.
- **Brass:** it pops.
- **Hold:** the push-in holds about 5 s.
- **Share links:** a pasted `#w=` forges.
- **Console:** 0 errors and 0 warnings in every session, including audio.

What still looks cheap:
1. The sculpture spells the answer from the hero camera. It reads as a gold "cat" or an "O" or "S" in its own right.
2. The tree pool's barn-door cut is a straight chord with no visible cause, so it reads like a clipping bug.
3. Typed letters are still ragged (SKY 82.7 %, LOV 75.7 %).

The one real **regression risk** is the governor:
- It only ever steps down.
- Its last levels cut the shadow map to 1024 and the pixel ratio to 0.5. Shadows are the artwork, so this damages the piece itself.
- Its overlay misreports fps on slow machines.

## 1. Console / network

| Session | Errors | Warnings | Notes |
|---|---|---|---|
| 21 shot-mode renders (opening ×10, shatter ×4, words ×6, viewports ×2, scramble) | 0 | 0 | No 4xx/5xx, no failed requests. Only SwiftShader driver noise. |
| Default 1920, `?debug=1`: click at 5 s, type CAT during the opening | 0 | 0 | **No AudioContext warnings** (REVIEW-04 had a spam of them). Fixed. |
| Default 800×500, `?debug=1`: 3 rapid Next, 3 sculpture clicks, paste `#w=SKY` | 0 | 0 | `COUNTS warn 0 err 0` |
| Default 1280×800, `?debug=1`: 100 s governor probe | 0 | 0 | Stepped q0→q1 at 55 s |

## 2. Opening: unlabelled crops and the placard at each time

See `sheet-opening-crops-nolabel.png` and `sheet-placard-per-time.png`.

| t (s) | Left / right / floor shadows (named cold) | Placard line 2 |
|---|---|---|
| 1 | empty cool / warm / neutral pools | **No. 1 — · · ·** |
| 2 | hatched straw | · · · |
| 3 | lace, nothing nameable | · · · |
| 4 | denser lace | · · · |
| 4.8 | haystack / nest blobs | · · · |
| 5.5 | **tree / cat / swallow** | · · · |
| 6 | tree / cat / swallow, pushed in | **No. 1 — Cat, Tree, Swallow** |
| 7 | same | same |

- **"Name nothing at 3 s, all three at 6 s" holds.** The placard spoiler from REVIEW-04 is **fixed**: the names appear after the shadows have resolved.
- **Push-in and hold:** at t = 6, 8 and 10 the frame is solved and pushed in; at t = 11 it loosens (`sheet-hold-6-11.png`). The hold is ≈ 5 s. **Confirmed.**
- **Pool span** (on the 42 % row, where linear L > 0.15): 63 % at 1920×1080, 60 % at 1280×800 and 1440×900. The 62 % claim is **confirmed** (REVIEW-04 measured 47 %).
- **Default mode:** on a slow machine the names appear a beat after the figures are readable (`flow-1-typed-early.png` shows the figures with "· · ·"). That is the right direction to err in.
- **Scramble:** in `?pose=scramble` the placard still says "Cat, Tree, Swallow". This is a debug pose, so it is a nit only.

## 3. Shatter, three in a row, and re-forge

- **Shot-mode shatter** (`sheet-shatter.png`, +0.4 / 1.4 / 2.4 / 3.2 s): nest → storm → organising → **key / hand / butterfly**. Clean. Nothing stray in the pools.
- **Three rapid Next clicks** (800×500 default, 1.5 s apart; `sheet-default-flow-800.png`): exactly one transition (to No. 2). The other two clicks are ignored by the `shatter` / `reforge` mode guard. No state soup, no doubled storms. Safe, though there is no feedback that a click was ignored.
- **Three sculpture clicks, 44 s apart:** No. 2 → **No. 3 GEB** (hash set to `#w=GEB`). The third click landed mid-reforge and was ignored. The work settled on GEB correctly.
- During every reforge the placard reads "No. N — · · ·". **No spoiler.**

## 4. `#w=` links, paste, and typing

| Word | Walls L / R / floor | Reads as | Fidelity (worst wall) | Notes |
|---|---|---|---|---|
| CAT | C / T / A | "C T A" | 89.3 | Reordered. The placard says "C A T … (letters rearranged for a cleaner cast)". Honest, but it still doesn't read as CAT. |
| TPE | T / P / E | **T P E** | 92.5 | Upright floor E. |
| WMW | W / M / W | W M W | 95.5 | Floor W tilted 45° (by the fit rule) |
| SKY | S / Y / K | "S Y K" | 82.7 | Reordered. Broken S with spurs at the top (`crop-sky-lov.png`). |
| LOV (1280×800) | L / O / V | **L O V** | 75.7 | Upright V. The O has a spur. |
| GEB | G / E / B | **G E B** | 95.6 | Baked |

- **Order and floor rule:** confirmed. 4 of 6 read in typed order; the 2 reordered words say so in the placard. The floor letter is upright unless the fit rule tilts it (WMW).
- **Letter size:** all letters now sit inside their pools. **Fixed.**
- **Spur trim:** it runs (41–151 rods clipped per word). The weakest words still show spurs and hairs (SKY, LOV). **Partial.**
- **Paste into an open tab:** `location.hash = '#w=SKY'` forged SKY at ~8 s and settled at No. 4 "SKY · forged for you". **Fixed.**
  - Caveat: the retry gives up after 60 × 500 ms = 30 s. A paste made during draw mode, or during a very slow reforge, is silently dropped, and the hash then points at a different work.
- **Hash clearing:** line 424 now clears the hash for non-word works. I verified this in code; live I saw `hash: ""` for the presets after the intro and after Next. **Fixed.**
- **Typing during the opening** (1920 default): CAT typed at 12.8 s.
  - The slots and the hint "Type any 3 letters to forge them in brass · Enter to forge" were visible.
  - The forge ran in the worker, then reforged to No. 4 with `#w=CAT`.
  - The buffering fix works.
- **The typing hint** is readable at 18 px in all three viewports. **Fixed.**

## 5. Viewports and thumbnail

- **1920×1080, 1440×900, 1280×800:** the layout is clean. The bottom band is no longer crowded, and the Tree label is clear of the drop rod (**fixed**).
  - Labels that would collide now fade out. At 1920 pushed in, the **Swallow label is simply gone**, and at 1280 it is present. That inconsistency is acceptable. The remaining wall labels are dim (≈ 30 % opacity), and the `字 C` / `字 T` labels on words add little.
- **800×500** (below the target, informational only): the pushed-in floor pool runs under the placard and the action links, leaving white serif text on a white pool.
- **320 px thumbs** (`thumb-320-t7.png`, `thumb-320-CAT.png`): tree, cat and swallow read, and so does C·T·A. Strong.

## 6. Did the new pools, barn door, rim light, or governor cause regressions? Bluntly

1. **The governor is a one-way ratchet whose bottom levels damage the art.**
   - Levels 3–5 halve the shadow map to 1024 and drop the pixel ratio to 0.65 and then 0.5. There is no step-up.
   - At q5 (`flowS-5-click2.png`) the letter edges are stair-stepped and the dust becomes blocky grain over the figures.
   - The trigger is an EMA above 20 ms (below 50 fps) for 2 s. A mid-range laptop at 40–45 fps will therefore walk down to q5 and stay there, even though 40 fps is perfectly fine for this piece.
   - **Cap it at q2 (haze 40, DPR 0.8). Never touch the shadow map. Use a threshold around 28–30 ms.**
2. **The governor overlay misreports on slow machines.**
   - Frame times are capped at 200 ms before the EMA, so it says "6 fps · 173 ms (p95 200.0)".
   - Measured with a rAF counter, the real rate was ≈ 0.3 fps (`gov-probe-1280.log`).
   - It is debug-only. Show the raw value or label it "capped".
3. **Barn-door cut on the tree pool.**
   - A hard straight chord on the left of the cool pool, with no barn-door hardware on the lamp and no visible reason (`live-t7.png`, `live-scrambled.png`).
   - At thumbnail size it reads as "a different shaped pool", which is good. At 100 % it reads as a clipped circle.
   - Soften the edge (2–3 % feather) or accept it as is. It is not worth a risky change.
4. **The rim light** makes the brass pop: it is gold, not chips. But it also makes the **sculpture read as the answer from the hero camera**: a gold seated cat, an "O" for LOV, an "S" for SKY. That undercuts "the object is abstract, only the shadows know". This is the piece's oldest flaw and too big to fix tonight.
5. **The pools** are three different shapes (soft ellipse, barn-door, larger floor) and they no longer overlap. No regression. The plaster at 0.019 brings back the room and doesn't wash anything out (p99.5 is 0.62, nothing clips).
6. Still cheap, but known: ragged typed letters (LOV 75.7 %, SKY 82.7 %), and reordered words that don't read as typed (CAT → C T A).

## 7. Benchmark (/24)

| # | Criterion | R-03 | R-04 | **R-05** | Justification |
|---|---|---|---|---|---|
| 1 | Focal point | 2 | 2 | **2** | Storm → collapse → 62 % push-in, held 5 s. |
| 2 | Value | 2 | 2 | **2** | Plaster 0.019 lifts the room, pools p99.5 0.62, nothing clips, thumbnails read. |
| 3 | Palette | 2 | 2 | **2** | Cool / warm / neutral pools, gold accent. |
| 4 | Lighting | 1 | 1 | **2** | Three different pools, no Venn, haze cones, key/rim on the brass. The barn door at 100 % is the only blemish. |
| 5 | Depth | 2 | 2 | **2** | Lit plaster, track, rods, floor. |
| 6 | Material | 1 | 1 | **1** | Pops now, but at 100 % it reads as a yellow-gold foil block rather than "aged brass and blackened steel" rods, and it spells the answer. |
| 7 | Detail at 100 % | 2 | 2 | **2** | Presets are clean. Typed words still ragged (would be 1.5). |
| 8 | Originality | 1 | 2 | **2** | Unchanged. |
| 9 | Hero legibility | 1 | 2 | **2** | Nothing at ≤ 4.8 s, all three at 5.5 s, the placard follows. |
| 10 | Motion | 1 | 2 | **2** | Opening and shatter strips progress cleanly. Rapid clicks are safe. |
| 11 | UI / typography | 2 | 1 | **2** | Spoiler gone, typed order honest, hint readable, labels avoid the UI. |
| 12 | Polish | 1 | 1 | **1** | 0 errors and 0 warnings, paste works. But the governor's floor is destructive and its overlay lies, a paste can be dropped after 30 s, and real-GPU fps is still unmeasured by anyone outside SwiftShader. |
| | **Total** | 18 | 20 | **22** | |

## 8. Final QA and last fixes, 21:00–23:00 TPE (only safe, worthwhile items)

**Fix (small, low-risk, in this order):**
1. **Governor floor and threshold** (≈ 10 lines; the most important).
   - Stop at level 2 (haze 40, DPR 0.8).
   - **Never reduce the shadow map.**
   - Raise the trigger to EMA > 28 ms.
   - Optionally step back up after 10 s under 18 ms.
   - Today a decent laptop at 40 fps ends up permanently at DPR 0.5 with 1024 shadows: blurry, with stair-stepped letters.
2. **Overlay honesty:** compute fps from the uncapped frame time (keep the 200 ms cap only for the governor's input). This is debug only, so there's zero risk.
3. **Hash paste:** after the 30 s retry gives up, clear the hash, or keep retrying while in draw mode. Either way the URL must never point at a work that isn't shown.
4. **Barn-door edge:** feather the chord a few %, or leave it. Do not change pool positions this late.
5. *(Optional, copy only)* Reordered words: also add the actual reading order to the placard, e.g. "C A T · cast as C T A". It costs nothing and removes the "is it broken?" moment.

**Do not do this late:** new pool shapes, re-baking presets, changing timing or the push-in, reworking the brass shader, anything in the worker fit.

**Final QA script (real GPU, ~20 min):**
1. At 1920×1080 and 1280×800, open a cold tab, and with `?debug=1` read fps after 30 s. Note the level reached; it should be q0 on a decent GPU.
2. Watch the opening. Nothing is nameable at 3 s, the placard shows "· · ·" until the figures resolve, and the push-in holds ~5 s.
3. Type during the opening, then again after it. Both should forge, and Enter / Backspace / Esc should behave.
4. Click Next ×3 fast, click the sculpture ×3, and run Draw → back. Check there is no stuck state and the hash is cleared on presets.
5. Open `#w=CAT`, `#w=LOV`, and `#w=QQQ` in fresh tabs. Paste `#w=TPE` into an open tab, and paste one while in draw mode.
6. Toggle sound after a gesture. Check there are 0 console warnings and the GitHub Pages files return 200 with no stale cache (hard reload).
7. Check a phone or narrow window shows the desktop-only message rather than a broken layout.

## 9. Asset index (`reviews/review05-assets/`)

- **Opening and placard:** `live-t{1,2,3,4,4.8,5.5,6,7,8,10,11}.png`, `sheet-opening-crops-nolabel.png`, `sheet-placard-per-time.png`, `sheet-hold-6-11.png`
- **Shatter:** `live-shatter-{0.4,1.4,2.4,3.2}.png`, `sheet-shatter.png`
- **Words:** `live-w-{CAT,TPE,WMW,SKY,GEB}-t7.png` (+ `.json` fit dumps), `live-1280x800-w-LOV-t7.png`, `sheet-words.png`, `crop-sky-lov.png`
- **Viewports:** `live-1280x800-t7.png`, `live-1440x900-t7.png`, `thumb-320-t7.png`, `thumb-320-CAT.png`, `sheet-thumbs-brass-barndoor.png`, `live-scrambled.png`
- **Default-mode flows:** `flow-1-typed-early.png`, `flow-1920-typing.log`, `flowS-*.png`, `sheet-default-flow-800.png`, `flow-800-shatters-paste.log`, `gov-probe-1280.log`, `gov-1280-debug-100s.png`, `crop-haze-q2-vs-q0.png`
- **Scripts:** `r05.sh`, `r05flow.js`, `r05flow2.js`, `r05gov.js`
