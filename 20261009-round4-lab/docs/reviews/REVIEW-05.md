# REVIEW-05 — independent hostile review of v4 (live public URL)
Reviewer: GK (Grok Bot), fresh session, 2026-10-14 20:05–21:00 TPE. No source edits.
URL: https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v4/ (`?q=4`, 640×360 and 480×270; `?shot=1&q=0` at 1280×720).
Method: headless Chrome + SwiftShader. Strokes are **trusted `page.mouse` input** (real screen-space down/move/up), not window-dispatched events. 3 parallel sessions, 18 carves, R between shapes, reload, iPhone-13 emulation. Script and logs: `assets-05/rv5.js`, `A.log`, `B.log`, `C.log`.

## Verdict
**v4 = 15/24 (v3 was 17). FAIL: originality passes (2), but the kids test fails (1).** v4 is a polished shell (load, title, end card, sound, mobile, 0 errors) around a hero that reads as a **cookie-cutter outline trench in clay**, not a canyon. AI-expert wow: **"nice demo, not wow."** An expert sees an SDF-ish groove with banded walls, not stream-power landscape evolution: no tributaries, no benches, no dendritic rim, and the shape stamps in rather than *emerges*. The q=0 rim shot (`05-q0-shots.png`, bottom) is the one frame that earns a wow, and the player never ends on it.

## Functional checks (live)
| Check | Result | Evidence |
|---|---|---|
| Load / white flash | PASS. 40 screencast frames before ready: mean luma 45/255, max 187, warm dark with a glow line. Ready ~11 s on SwiftShader. | `01` top row |
| Title + idle hint | PASS. 深時 / DEEP TIME in-world, glint hint visible at 640×360. | `01` middle |
| Drawing pose | PASS: hover glides in. But the top-down pose shows a **tilted grey slab with a dark band across the top** (plateau edge or skirt), which looks like a glitch. | `01` bottom, `04` bottom |
| Carve → reveal → rim → rest | PASS in all 18 runs, e.g. `toReveal → reveal → toRim → rim → toRest → reveal`, done at 200 steps. | logs |
| End card | PASS: "your line, 6.0 million years later · 深時 · deep time · draw again". | `02` |
| Draw again (click) / R | PASS. R mid-run resets to draw with steps 0. | `sp.js` output in this file |
| Wheel scrub | PASS: back 5 → idx 5 / step 102; forward → step 200. | A.log |
| Space | Works: 19.0 → 24.9 steps/s on SwiftShader (CPU-bound; only 1.3×). Space with no run is a no-op. | |
| M | PASS: mute toggles. | A.log |
| Off-plateau stroke | **BUG**: it does not reject. It carves a full-width straight trench along the top of the plateau. | `02` row 2 |
| Tap | Carves a sinkhole pit (by design); a few stray pits appeared near the edge. | `02` row 1 |
| 4+ carves | 6 carves were stable, but they accumulate into mush: the arrow merged into the off-plateau trench and is not legible. | `02` row 3 left |
| Tall/thin: A, I, bolt | **A FAIL**: the legs run off the bottom of the frame and the crossbar is lost or hidden. I passes (a slot). **Bolt FAIL**: the top is clipped by the slab, so it reads as "two blobs". | `03` bottom, `04` bottom |
| Multi-stroke (house, smile, fish) | **FAIL in this harness**: only the first stroke survives (house = square, no roof; fish = oval, no tail; smile = round pit). Caveat: the commit grace is 1.2 s after the last pointerup, and SwiftShader made the gaps between my strokes longer than that. Even so, 1.2 s is too short for a child lifting the pen to draw a roof. | `04` |
| Refresh | PASS: back to `first`, clean. | C.log |
| Console / HTTP errors | **0** across all sessions, the mobile session and the shot pages. | logs |
| Mobile fallback | PASS and pretty: a heart-canyon still with "Deep Time is drawn with a mouse. Open it on a desktop." | `M-mobile.png` |

## Blind shape read (9 shapes; guesses written to `assets-05/blind_guesses.txt` before opening `blind_key.json`)
Key: spiral, A, fish, smile, house, bolt, heart, I, star → **4/9 correct** (spiral, heart, I, star). The A was partial (an inverted V with no crossbar). The bolt was guessed only by elimination. Fish, smile and house were all wrong. This is an upper bound, because I knew the name set. The target was ≥ 7/8. → **#9 = 1.**
Contact sheet: `assets-05/06-contact-blind-9.png`.

## The four creative-director concerns
1. **Raised clay letters / extruded walls: CONFIRMED (partly).** At reveal, a bright lit rim lip plus a dark floor reads as a hole. But the inner island of every closed shape (heart, house, smile) reads as a **raised block/cake** in the rim and postcard (`05` bottom, `04` right column, `M-mobile.png`). On A and smile, **bright vertical streaks run from the canyon to the bottom of the frame** (stretched near-wall texture), which read as extruded stilts (`03` bottom, `04` middle left).
2. **Tall shapes cropped: CONFIRMED.** The fitPose pull-back did not fix it on the live site at 16:9: A's legs leave the frame in both reveal and postcard, and the bolt's top is eaten by the slab (`03`, `04`).
3. **Soft, muddy, over-vignetted postcard: CONFIRMED.** The finals are low-contrast and pinkish-grey, with a heavy radial darkening and haze. The canyon is ~15 % of the frame width and sits in mid-ground mush (`06`). The end-card text is small, low-contrast serif at the top.
4. **Grandeur: engraved trench, not Grand Canyon.** Walls are uniform near-vertical with even width, a flat floor and a thin green river line. No benches or side canyons, and nothing beyond the stroke changes. The only grand frame is the q=0 `cam=rim` shot, and the live sequence passes through it but rests on the high oblique.

## 12-criterion scores (v4; v3 = 17)
| # | Criterion | v4 | Note |
|---|---|---|---|
| 1 | Focal / composition | 1 | Centred blob; tall shapes cropped |
| 2 | Value structure | 1 | Finals are mid-grey mush; reveal frames are better |
| 3 | Palette / colour script | 1 | Coherent desert, but the colour does not tell the story; pink cast |
| 4 | Light | 1 | Key light + rim lip; no bounce in the canyon, no sim-reactive light |
| 5 | Depth | 1 | Horizon and haze, but the hero sits in mid-ground with no foreground occluder |
| 6 | Material | 1 | Reads as clay or cake, not stratified sandstone, at thumbnail size |
| 7 | Detail @100 % | 1 | Wall streak stretching; slab artefact |
| 8 | Originality | **2** | Erosion as deep-time authorship of your own drawing; no nameable template |
| 9 | Kids test | **1** | Blind 4/9; multi-stroke and tall shapes fail |
| 10 | Emergent response | 1 | Outcome ≈ a buffered outline; erosion adds little unscripted structure |
| 11 | Motion | 2 | Weighted choreography; scrub shows time accumulating |
| 12 | Polish / UI in world | 2 | Load, title, end card, sound, mobile, 0 errors |
| | **Total** | **15/24** | Gate: **FAIL** (#9 < 2) |

## Ranked fixes
**True blockers**
1. **Tall-shape framing.** Fit the reveal and postcard camera to the projected 3D bbox of the *carved* cells (rim included) with a 12 % safe margin, using an actual frustum test on all 8 bbox corners rather than a distance heuristic. Accept when A, I and bolt at 0.75 H are fully in frame at 16:9 and 4:3.
2. **Multi-stroke loss.** Grace 1.2 s → 2.5 s, reset on any pointermove near the canvas. Alternatively, keep the run going but **merge** later strokes into the active carve (mask union) instead of dropping or restarting. Accept when house, smile and fish pass the blind read.
3. **"Raised block" read.** Darken and cool the floor plus the lower 60 % of the walls (AO by depth below the local rim), add a lit far wall and a shadowed near wall, and lower the inner island's albedo/caprock highlight so it is not brighter than the outer plateau. Kill the vertical streaks: triplanar mapping on walls with slope > 60° instead of a top-projected UV stretch.
4. **Off-plateau and slab.** Reject or clip strokes outside the plateau (show a soft "edge" glow). Hide the skirt/edge slab in the draw pose: clamp the camera or put a fog curtain beyond the domain.

**Nice-to-haves (grandeur and postcard)**
5. **Postcard**: end on the q=0 `cam=rim` low oblique (25–30°), with the canyon ≥ 45 % of the frame width. Reduce the vignette strength by ~50 %, apply a contrast S-curve (range ≥ .60), and remove the pink cast in the grade.
6. **Grandeur**: benching (alternating hard/soft strata, ScS ∝ hardness), short tributary side canyons along the rim (perturb the rim with a noise-driven drainage area so headward erosion branches), variable width, and talus fans.
7. **Several carves**: fade or soften earlier carves, or cap at 3, so the 4th+ shapes stay legible.
8. **Space**: make the speed-up visible (≥ 3× via budget and pace, not CPU) with a visual time-rush cue.

Key evidence: `assets-05/06-contact-blind-9.png` (contact sheet), `03-heart-A-crop.png`, `04-multistroke-loss-house-smile-bolt.png`, `02-edge-tap-off-arrow.png`, `05-q0-shots.png`, `01-load-title-pose.png`, `M-mobile.png`.
