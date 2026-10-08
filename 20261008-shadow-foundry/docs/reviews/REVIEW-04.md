# REVIEW-04: Shadow Foundry, Pass 2 (Experience). Independent, adversarial

- **Tested:** live `https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/`, showroom commit **d71df2f** (pushed 18:53:56 TPE, "fix worker stall while rendering"). Every render and session was loaded between 18:57 and 19:03 TPE. The live `js/main.js` I pulled has 742 lines.
  - **Newer commit:** `4afe8e1` landed at **19:08:03 TPE**, after all my sessions loaded. It's probably the draggable lamps or the layout fix. **Nothing in this review covers 4afe8e1**, so re-check §5 (layout) against it.
  - Draggable lamps were not in d71df2f.
- **Method:**
  - Headless Chrome + SwiftShader (`shot.js`, plus `r04flow.js` for default mode). Every session was fresh.
  - Assets are in `reviews/review04-assets/` (≈45 files). The scripts are in `/workspace/_tmp/v3tools/tmp/r04*.{sh,js}` and the logs in `tmp/r04-*.log`.
  - I judged only my own renders. The builder's `p2-*` shots were used only to cross-check.

## 0. Verdict in one paragraph

Pass 2 delivered the thing REVIEW-02 and REVIEW-03 asked for most: **the reveal now works.** In my unlabelled crops (`sheet-opening-crops-nolabel.png`), I can name nothing at 1, 2, 3, 4 or 4.8 s, and I name tree, cat and swallow instantly at 5.5 and 6 s.

The storm frames (t = 2–4 s, `crop-storm-t3.png`) are the most beautiful images this project has produced. Three pools fill with hatched lacework under a brass rod cloud, like light through a bird's nest. The 320 px thumbnail of the storm still reads.

Type-three-letters works end-to-end in a real default-mode session (Esc → T P E → forged → URL `#w=TPE` → placard). `#w=` links work cold in fresh sessions. Click → shatter → re-forge works, and the strip progresses.

What drags it down is a set of cheap, easily fixed text and layout faults:
- **The placard names the figures during the storm.** "No. 1 — Cat, Tree, Swallow" shows at t = 1 s and 3 s, which undoes the very reveal the storm protects.
- The typed word is **never readable as typed**. CAT shows as `T | C | ∀`, and the floor letter is upside down from the camera.
- The "Tree" wall label is cut by the lamp's drop rod at every viewport.
- Brass, pools and beams are unchanged from Pass 1.

**Score: 20 / 24, which meets the Pass 2 target of ≥ 20 at the floor** (REVIEW-03 gave 18).

## 1. Console / network

| Session | errors | failed req | HTTP ≥ 400 | notes |
|---|---|---|---|---|
| 22 shot-mode renders (opening ×11, shatter ×5, words ×5, viewports ×3, scramble) | 0 | 0 | 0 | only SwiftShader "GL Driver Message" / GPU stall perf warnings |
| default `#w=WMW`, fresh, 230 s | 0 | 0 | 0 | `forged word WMW (walls WWM): rods 1897, 96.7/96.9/95.2, 20042 ms` |
| default typing flow (Esc, T P E, Enter, Copy, click), 400+ s | 0 | 0 | 0 | **22× `[warn] The AudioContext was not allowed to start`**, in bursts on frames after Esc/keys (see §6) |

Worker forge times under SwiftShader with 5 parallel Chromes were 7.5–20 s (TPE 13.5 s, CAT 7.5 s, WMW 9.1 s shot / 20 s default, LOV 16.8 s). The builder's 3.5 s median is plausible on an unloaded CPU. In the slow default session the storm covers the wait, so it never looked frozen.

## 2. Opening: does "name nothing at 3 s, name all three at 6 s" hold?

Sheet: `sheet-opening-crops-nolabel.png`. These are centre crops with the placard and wall labels outside the crop.

| t | Left wall | Right wall | Floor | Brass object |
|---|---|---|---|---|
| 1.0 | empty cool pool | empty warm pool | empty pool | none |
| 2.0 | hatched straw / pick-up sticks | hatched straw | hatched straw | sparse flying rods |
| 3.0 | **lace / nest**, nothing nameable | lace | lace | a rod storm ball filling the centre |
| 4.0 | lace, denser | lace | lace | ball, contracting |
| 4.8 | **haystack blob** | haystack with spikes | bird's nest | small brass haystack |
| 5.5 | **tree** | **cat** | **swallow** | small brass seated animal |
| 6.0 | tree | cat | swallow | pushed in; brass "seahorse/cat" with a curled tail (`crop-object-t6-100.png`) |

- **Shadows: holds.** It's a clean 0 → 3 switch between 4.8 s and 5.5 s. The spoiler problem from REVIEW-03 (cat legible at 1.5 s) is gone, and so is the scramble crucifix (`live-scrambled.png` is an urchin with dappled-leaf shadows, no tail).
- **Text: fails.** The placard reads "*No. 1 — Cat, Tree, Swallow*" in every opening frame from t = 1 s (`live-t1.png`, `live-t3.png`). With the `#w=` link, the placard reads "*No. 4 — W, W, M · forged for you*" while only one lamp is lit and the storm hasn't started (`fresh-WMW-early.png`). A first-time visitor reads the answer before the shadows give it. **This is the single cheapest high-value fix in Pass 3.**
- **The object still reveals the cat.** At the push-in, the brass object is about 2× bigger and has the hook tail (`crop-object-t6-100.png`). It now appears at the same instant as the shadows, so it no longer spoils anything. But it means "a figurine with its shadows" rather than "a nest that becomes three things".
- **Push-in size:** measured pool span is **47 %** of the frame width at t = 6 (luminance > 0.15 on a row at 42 % height). It may reach the builder's 58 % around 7–8 s; I didn't measure it there. **The solved hold lasts 5.5 → ~8.5 s.** By 9 s the object loosens into the urchin, and by 12 s the drag hint appears (`sheet-after-reveal-6-12.png`). That gives about 3 s of hero before the puzzle takes it back. It's acceptable because the puzzle is the point, but it's short. Consider 4–5 s.

## 3. Shatter → re-forge

Sheet: `sheet-shatter.png`, from `?shot=1&shatter=0.4/1.4/2.4/3.2/5`.
- At +0.4 and +1.4 s the cat/tree/swallow rods burst into the lace cloud. At +2.4 s the cloud contracts into a haystack.
- At +3.2 s the scene shows key / hand / butterfly. The hand is legible instantly, and the object is a brass "bouquet" that doesn't give the hand away (good). +5 s is identical to +3.2 s with crisper edges.
- In default mode I clicked (1000, 600) on the typed TPE sculpture. It burst into the lace cloud and preset No. 2 loaded (`flow-6-click-shatter.png`, `flow-7-after-shatter.png`). SwiftShader's default-mode clock is too slow to watch the re-forge finish there; shot mode covers that. The placard kept saying "P, T, E" through the storm.
- Verdict: **works and has real motion**. The cloud is the same lace ball as the opening, so the second and third shatters will feel samey. A different exit per work (sag-and-fall vs. outward burst) would help, but this is P2.

## 4. `#w=` share links and typing

`sheet-words.png`. All in fresh sessions:

| Link | Forged | Walls (L / R / floor) as seen | Worst-wall coverage | Reads as typed? |
|---|---|---|---|---|
| `#w=WMW` | yes (shot and default) | W / W / **M rotated ~180°**, clipped by the pool edge | 95.2 % | No: "W W ʍ" |
| `#w=CAT` | yes | **T / C / ∀** (A upside down); C's top clipped by the pool edge | 95.6 % | **No**: reads "TC∀" |
| `#w=TPE` (my choice) | yes | T / P / **E on its back** | 97.7 % | No: reads "TP ш" |
| `#w=LOV` (worst in builder table) | yes | O / L / V upside-down ("∠") | 83.8 % | No. The O has visible hairs/spurs on its left side |
| `#w=GEB` (baked No. 3) | yes | E / G / B (B rotated) | 99.5 % | Mostly. The object reads as the famous GEB cube, which is a real homage |

- **Copy share link: unverified.** In headless Chrome with clipboard permissions granted, `navigator.clipboard.readText()` came back empty after the click, and the 4 s hint had already cleared by the time the slow screenshot landed. Check it by hand on the desktop in QA.
- **The share link works**: the hash is parsed on load, the storm holds with "forging your sculpture…", and it implodes into the word. "Copy share link ⧉" only appears for word works. In my typing flow the URL became `#w=TPE` once the reforge finished, and the placard reads "No. 4 — P, T, E · forged for you".
- **But the result does not say the word.** The quick-fit chooses the best wall permutation for fidelity (CAT→CTA), and the floor letter faces the far wall, so from the main camera it's upside down. Someone who types their initials will see them scrambled and inverted, and the placard repeats the scramble ("P, T, E"). **Fix:**
  - lock the reading order to left wall → right wall → floor = the typed order;
  - rotate the floor target 180° so it reads upright from the camera;
  - only allow a permutation when it gains > 3 points of coverage;
  - print the typed word in the placard ("TPE — forged for you").
- **Stale URL (confirmed in code and in session):**
  - `history.replaceState` only ever *sets* `#w=`. Live `main.js:386` never clears it.
  - After I clicked the TPE sculpture and it shattered toward preset No. 2, the URL was still `#w=TPE` (`flow-7-after-shatter.png`, STATE log). Anyone copying the address bar after "Next sculpture" or a drawing shares the wrong work.
  - There's also no `hashchange` listener, so pasting a new `#w=XYZ` into an open tab does nothing until reload.
  - Fix: clear the hash (`replaceState(null,'',location.pathname)`) for non-word works, and add a `hashchange` → `forgeWord`.
- **Letters overfill the pools.** CAT's C, WMW's M and the T of TPE touch or cross the pool rim, and the part outside is invisible. Scale the letter targets to about 80 % of the pool diameter.
- **Typing discoverability:**
  - "Type 3 letters to forge a sculpture" is a ~11 px dim italic line at the top centre, sitting on the ceiling track. I missed it at 1:1 until I knew it was there.
  - The three slot boxes appear over the track/lamp (`flow-2-typed-TPE.png`), and **they stay on screen, empty, after the forge finishes** (`flow-5-copied.png`, `flow-6-click-shatter.png`). It's a leftover outline over the top lamp.
  - Make the hint brighter, place it under the placard or near the action links, and keep it.

## 5. Viewports

`live-1280x800-t6.png`, `live-1440x900-t6.png`, `live-1440x900-t3.png`, `crop-1280-corners-label.png`, `thumb-320-t6.png`, `thumb-320-t3-storm.png`.
- 1280 and 1440 frame the same way. All three pools are inside and nothing important is cropped.
- **The "樹 Tree" label is sliced by the left drop rod at 1280, 1440 and 1920** ("Tre|e"). The rod passes in front of the text.
- At 1280×800 the two floor lamps sit right on top of the placard and the "Draw your own…" link, and the "燕 Swallow" label sits beside the placard's last line, so the bottom band is crowded. This is presumably what the builder's layout fix addresses. Re-check after it lands.
- **Thumbnail:** the hero thumbnail reads (tree / cat / bird are clear at 320 px), and the storm thumbnail reads as a glowing nest. Both are good.

## 6. Cheap or broken, bluntly

1. **Placard spoils the reveal** (§2). This is broken in intent, and the fix takes 10 minutes.
2. **Typed words don't read as typed**: scrambled order and an upside-down floor letter (§4). This is the headline feature of Pass 2 and it currently produces "TC∀".
3. **Brass at the push-in is still tobacco chips.** The camera now pushes the object to about 2× size, which exposes the material problem from REVIEW-03 more, not less. There's no highlight, no rim and no gauge variety.
4. **Three identical discs in a Venn** and beams that are a smudge, unchanged since V1. The storm makes the pools beautiful *inside*, but at rest the composition is still a clip-art Venn diagram.
5. **The plaster is still black.** Median linear luminance of the left wall outside the pools is **0.0062–0.0071**, against a target of 0.015–0.025. The room disappears in the thumbnail.
6. Tree label occluded by the drop rod (§5). The URL keeps a stale `#w=` after moving on (§4).
7. LOV-class words show visible hairs and spurs (rods that stick out of the letter). Run a trim pass that drops rods whose shadow lies > N px outside every target.
8. AudioContext autoplay warnings, 22 per session. They are harmless, but they mean the audio is being poked every frame before the context is resumed. Gate it on `ctx.state === 'running'`.
9. **The real-GPU frame rate is still unmeasured.** The storm updates about 1.5 k instance matrices per frame plus three shadow maps, and that is the hero. I can't verify it under SwiftShader, and nobody has measured it on a GPU.

## 7. Benchmark (/24)

| # | Criterion | V1 | v1b | **p2** | One-line justification |
|---|---|---|---|---|---|
| 1 | Focal point | 2 | 2 | **2** | Storm ball → collapse → push-in. The eye is always on the centre. |
| 2 | Value | 2 | 2 | **2** | Pools p99.5 ≈ 0.52–0.65, deep shadows, both thumbnails read. Plaster too black, but not fatal. |
| 3 | Palette | 1 | 2 | **2** | Cool / warm / neutral pools with brass accent, coherent. |
| 4 | Lighting | 1 | 1 | **1** | The lace pools in the storm and scramble are gorgeous (1.5), but at rest it's still 3 identical discs and no rod shafts in the beams. |
| 5 | Depth | 1 | 2 | **2** | Track, rods, seams and reflective floor make a room. |
| 6 | Material | 1 | 1 | **1** | The push-in shows chips, not rods. No highlight or rim. |
| 7 | Detail at 100 % | 1 | 2 | **2** | Preset edges are clean. Word letters are ragged and LOV has hairs (would be 1.5). |
| 8 | Originality | 1 | 1 | **2** | The storm-implosion forge and "type three letters, get an object that casts them" (with GEB as the canonical homage) are genuinely this piece's own. |
| 9 | Hero legibility | 1 | 1 | **2** | Shadows give nothing at ≤ 4.8 s and all three at 5.5 s. It holds (the placard spoiler is scored under 11). |
| 10 | Motion (strips) | 1 | 1 | **2** | Opening and shatter strips progress through distinct states: dark → lamps → lace → haystack → figures → push-in. |
| 11 | UI / typography | 2 | 2 | **1** | Real titles now, but the placard names the answer during the storm, the typed word reads scrambled and inverted, the Tree label is cut by the rod, and the typing hint is near-invisible. |
| 12 | Polish | 1 | 1 | **1** | 0 errors, worker forge, links work cold. But GPU fps is unmeasured, there is audio-warning spam, letters overflow the pools, and the 1280 bottom band is crowded. |
| | **Total** | **15** | **18** | **20** | **Pass 2 target (≥ 20): met, at the floor.** Fixing items 1–3 of §8 gets 11 back to 2 (→ 21). The brass and pool items are the route to 22–23. |

## 8. Pass 3 (Polish) list, 20:00–22:15 TPE, then QA to 23:24

Ordered by value ÷ minutes. Do P0 first. Each P0 item is a small text or parameter change.

**P0 (20:00–20:50)**
1. **Hide the answer until the lock** (10 min). Until `st.locked`/lock-FX, the placard subtitle reads "No. 1 — · · ·" (or "forging…" for words), and the real titles fade in with the wall labels.
2. **Make typed words read as typed** (25 min, plus re-running the word table):
   - fixed order: left = letter 1, right = letter 2, floor = letter 3;
   - floor target rotated so it reads upright from the hero camera;
   - allow a permutation only for a gain > 3 points;
   - placard reads "TPE — forged for you". Re-shoot CAT / TPE / WMW.
3. **Letter scale to about 80 % of the pool diameter** and a rod trim pass for spurs outside the target (10 min). Re-shoot LOV and WMW.
4. **Label occlusion and the 1280 bottom band** (10 min, overlaps with the builder's layout fix). Move "樹 Tree" off the drop rod. Make sure the lamps don't sit on the placard or links at 1280×800.
5. **Stale `#w=` hash**: clear it when the work isn't a word, and add a `hashchange` handler (5 min).
6. **Typing hint**: brighter and moved off the ceiling track (5 min). Keep the slot boxes off the lamp, and hide them again once the word is submitted (right now the empty boxes persist).

**P1 (20:50–21:45)**
7. **Real-GPU frame log + quality governor** (30 min). This is the one thing that can sink the piece on a visitor's laptop.
   - Log p50/p95 frame ms for opening, storm, shatter and the drag.
   - If p95 > 25 ms, drop the shadow-map size, then the rods updated per frame in the storm (update a third per frame), then the DPR.
   - Must be measured on a real GPU (the user's desktop), not SwiftShader.
8. **Brass pops** (20 min): one narrow warm key / rim light on the object only (layers), higher roughness contrast, and 2–3 rod gauges. Check `crop-object-t6` at 100 %.
9. **Break the Venn** (20 min): pools at different diameters (for example 0.85 / 1.0 / 1.15), one slightly elliptical or with a soft iris gobo, and offset so the overlaps aren't symmetric. Re-check that coverage doesn't clip.
10. **Plaster to 0.015–0.025** (5 min). Raise ambient/bounce on the walls only, and re-measure the left wall outside the pools.

**P2 (21:45–22:15, only if P0/P1 are green)**
11. **Rod streaks in the beams during the storm** (≤ 30 min, behind the governor). Use 6–8 shadow-map taps along the beam in the cone shader. Skip it if the governor says no.
12. **Hold the solved hero for 4–5 s** before the loosen (now about 3 s). Time the push-in peak to the chord. Audio: one low hit at collapse and a soft swell into the lock. Silence the AudioContext warnings by not touching the audio before `resume()`.
13. **Dead ends:**
    - Esc during `#w=` waiting;
    - typing during shatter (currently ignored silently; show slot feedback or a "wait…" state);
    - Copy-link failure fallback (shows the URL in the hint, which is OK);
    - "Next sculpture" after a word goes to preset No. 1? Check it's not a loop with no word path back.

**QA (22:15–23:24):**
- Fresh-session matrix:
  - the unlabelled opening sheet (1–6 s), including the **placard text** in each frame;
  - `#w=` CAT / TPE / WMW / LOV / GEB;
  - typing in default mode;
  - shatter ×3 in a row (memory / instancing leaks);
  - Esc mid-storm;
  - 1280 / 1440 / 1920 + 320 thumbnail;
  - a GPU frame log from the real desktop.
- 0 errors, and the AudioContext warning count = 0.

## 9. Asset index (`reviews/review04-assets/`)

- **Opening:** `live-t{1,2,3,4,4.8,5.5,6,7,8,9,12}.png`; `sheet-opening-crops-nolabel.png`; `sheet-after-reveal-6-12.png`; `crop-storm-t3.png`; `crop-object-t6-100.png`.
- **Scramble:** `live-scrambled.png`.
- **Shatter:** `live-shatter-{0.4,1.4,2.4,3.2,5}.png`; `sheet-shatter.png`.
- **Words:** `live-w-{WMW,CAT,TPE,LOV,GEB}-t6.png` (+ `.json` worker results); `sheet-words.png`.
- **Default mode:** `fresh-WMW-{early,late}.png`; `flow-1-after-esc.png` … `flow-7-after-shatter.png`.
- **Viewports:** `live-1280x800-t6.png`, `live-1440x900-t6.png`, `live-1440x900-t3.png`, `crop-1280-corners-label.png`, `thumb-320-t6.png`, `thumb-320-t3-storm.png`.
