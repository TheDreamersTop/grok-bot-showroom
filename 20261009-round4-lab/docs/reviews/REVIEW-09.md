# REVIEW-09: independent review of live Deep Time v8

- **Reviewer:** GK (Grok Bot), fresh session, 2026-10-18 21:00–22:20 TPE. No code edits.
- **Build:** https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v8/ (showroom 7cfdc48), `?q=4`, 640×360.
- **Protocol:** the same as REVIEW-08, run as **one sequential session** (no parallel browsers, so the quality governor was not starved).
  - Headless Chrome with SwiftShader.
  - **Trusted `page.mouse` strokes** in screen space.
  - 17 carves in total, with R between shapes, then a reload. iPhone-13 emulation ran afterwards.
- **Resting frames:** every final is a true resting postcard (`toRest → reveal` logged for 17/17 carves).
- **Interruption:** the run was interrupted once. The session kept running, and all outputs were reused as they were. The blind guesses and key are untouched.
- **Script and log:** `assets-09/rv9.js`, `S.log`.

## Verdict
**v8 scores 20/24, which reaches the total for the first time. Gate: FAIL**, because the kids test is 1.
- Originality = 2.
- The blind read was 9/9 nominally, but 3 of the 9 were **weak, by-elimination** guesses. Excluding those, it is **6/9**, below the required 7/8. In REVIEW-08 the same strict count gave 8/9.

**What improved since v7:**
- The framing is fixed.
- The walls now read as layered red rock.
- The 4-carve run is clean, and the dark streak beside the A is gone.

**What broke:** the two new features that were meant to add grandeur cost legibility.
1. **The side canyons grow as bulbous lobes and stubs.** On rounded shapes they read as **legs**. My first reads were "crab" or "spider" for the heart and the cloud, and the moon read as a doughnut.
2. **The three-quarter view collapses the bolt's zig** into a "7" or "1".

**AI-expert wow verdict:** "Now it looks like a real place, but the drawing is getting lost." The reveal frames are the best yet: a banded red-rock canyon in the shape of your line. The finals trade the drawing's identity for texture.

## Re-check of the REVIEW-08 fixes
| # | Fix | Verdict | Evidence |
|---|---|---|---|
| 1 | Framing: everything in frame with a 5 % margin, incl. the arrow and the 4-carve A | **PASS.** All 13 shape finals sit inside the frame with margin. The arrow head and the 4-carve A are fully in. The caption stays in the sky. | `00`, `03`, `04` |
| 2 | Fill light: floors at 15–20 %, moat read | **Not met.** Canyon pixels (below 0.6× the plateau median) have a median luminance of **0.10–0.12** across 7 finals (p25 is 0.08–0.09), against a plateau at 0.40. Floors are still near-black. The moat read is better than in v7 because the island walls are banded, but the lit island lips still make some islands look like plinths. | numbers below; `06` |
| 3 | Side canyons | **Present, but harmful.** On closed rounded shapes (heart, cloud, moon, fish, key) they appear as **bulbous lobes and stub arms with rounded ends**, not V-notches. They change the silhouette, which is what produced the crab/spider reads. Straight shapes (A, I, bolt, line) get none, as the builder noted. | `04` (cloud, tree), `00` |
| 4 | Strata, benches, talus (2× wall crop) | **Strata: PASS.** Horizontal bedding in red, brown and maroon (plus a thin teal band) reads as layered rock at 2×. **Benches: not visible** as geometry. **Talus: none.** Blocky stair-step pixels remain along the dark wall edges. | `06` |
| 5 | I/bolt three-quarter view + artefacts | **Three-quarter view with horizon: delivered.** The I is legible at ~15 % width. **The bolt loses its zig** and reads as "7" or "1". **Artefacts:** the dark A streak is gone, and so are the far-edge pits. **New artefact:** dark vertical "tick" marks at regular intervals along every lit wall and island lip (arrow shaft, cloud, key, the line). They look like burnt fence posts. The heart in the 4-carve run trails a dark rubble smear. | `02`, `06`, `03`, `05` |

Floor luminance (median of the canyon pixels in the final frame): arrow .101, cloud .120, fish .104, key .120, heart .105, A .119, moon .116.

## Functional checks (live)
- **Load:** no white frame in 40 frames before ready. Ready in ~9 s.
- **Title and hint:** both shown.
- **Draw pose:** works.
- **Carves:** 17/17 completed reveal → rim → rest → end card.
- **Multi-stroke:** passed for arrow (2 strokes), key (3), tree (2) and fish (2).
- **Edge stroke:** re-laid inward. A tap makes one sinkhole.
- **4+ carves (heart → star → A → spiral):** all four are legible and in frame. The heart carries a dark smear.
- **Controls:** wheel scrub goes back to step 82 and forward to 170. M toggles mute. R was used 12×. Reload returns to `first`.
- **Errors:** 0 console, page or HTTP errors.
- **Mobile fallback:** passes.

## Blind read (fresh set, 9 shapes)
- **Shapes:** arrow and cloud (as requested), the new ones fish, tree and **key** (key is new to any review), plus heart, A, bolt and moon.
- **Shuffle:** seed 91018.
- **Key:** kept outside the repo at `/workspace/_tmp/r4tools/tmp/review09/BLIND_KEY_review09.json`.
- **Guesses:** written before the key was opened, in `assets-09/blind_guesses_review09.txt`.

**Result: 9/9 nominally.**
- **Confident:** A, key.
- **Moderate:** arrow (first read was "hockey stick"), tree, heart (first read was "crab"), fish.
- **Weak / by elimination:** bolt ("7"), moon ("doughnut"), cloud ("crab").

Strict score, excluding the weak guesses: **6/9**. It is an upper bound, because I knew the name set. A child would not know the set. **→ Kids test = 1.**

## Builder's known issues
| Issue | Verdict |
|---|---|
| Side canyons only on rounded closed shapes | **Confirmed.** Worse than "only": on those shapes they create false silhouettes (legs). |
| Cloud may read as a crab | **Confirmed.** The heart reads as a crab too. |
| Arrow barbs merge into a hockey stick | **Confirmed.** It still read as an arrow, but only moderately. |
| I and bolt at 11–18 % width | **Confirmed.** The I is fine. The bolt fails in the three-quarter view. |

## 12-criterion scores (v8; v7 = 19)
| # | Criterion | v8 | Note |
|---|---|---|---|
| 1 | Focal / composition | **2** | Everything in frame with margin; horizon, ledge, caption in the sky |
| 2 | Value structure | **2** | |
| 3 | Palette / colour script | **2** | Golden postcard; red and maroon strata add a hue family |
| 4 | Light | 1 | Floors at L .10–.12; no visible bounce |
| 5 | Depth | **2** | |
| 6 | Material | **2** | Layered red rock reads at a glance (new) |
| 7 | Detail @100 % | 1 | Tick-mark artefacts, blocky dark edges, lumpy side canyons, smear |
| 8 | Originality | **2** | |
| 9 | Kids test | **1** | Strict blind 6/9; side-canyon "legs" and the bolt view |
| 10 | Emergent response | 1 | The side canyons exist, but read as lobes, not drainage |
| 11 | Motion | **2** | |
| 12 | Polish / UI | **2** | 0 errors, mobile works |
| | **Total** | **20/24** | **FAIL**: #9 must be 2 |

## Ranked fixes
1. **Make the side canyons thin V-notches that never change the silhouette** (this gate-blocks #9 and also lifts #10 and #7).
   - Width ≤ 0.4× the main canyon, tapering to 0 at the head.
   - Orient them down the local gradient, away from the hull.
   - Suppress them at the shape's extremities and on concave insides.
   - Limit length to ≤ 1× the canyon width.
   - Darken them as cracks instead of capping them with lit rounded ends.
   - **Accept when** the heart, cloud and moon get confident blind reads and no first read says "crab" or "legs".
2. **Bolt (and any acute zig) postcard.** For strokes with turn angles < 60°, raise the pitch to ~50°, or choose the yaw that maximises the projected turn angle. **Accept when** the bolt gets a confident blind read.
3. **Fill light to floors at 0.15–0.20** (#4). Add sky fill weighted by openness, plus a warm bounce from the sunlit wall. **Accept when** the canyon-pixel median is ≥ 0.15 on 7 finals.
4. **Artefacts** (#7):
   - Remove the regular dark vertical tick marks on lit walls and lips (they look like a shadow or strata sampling period).
   - Smooth the blocky dark wall edges.
   - Remove the dark rubble smear under the 4-carve heart.
5. **Corners and benches:**
   - Protect acute stroke vertices from widening, so the arrow barbs don't merge into a hockey stick.
   - Turn the render-time benches into 1–2 geometric steps with talus aprons at the wall feet.

## Key evidence (`assets-09/`)
- `00-contact-blind9-finals-top-reveals-bottom.jpg`: contact sheet, shuffled order.
- `04-multistroke-arrow-cloud-key-tree.jpg`: the side-canyon "legs", the hockey-stick arrow.
- `02-thin-shapes-A-bolt-I-reveal-vs-postcard.jpg`: the bolt's zig collapsing.
- `06-2x-crops-walls-strata-ticks-sidecanyons.jpg`
- `03-four-carves-in-a-row.jpg`
- `05-edge-stroke-tap.jpg`
- `01-load-title.jpg`
- `07-mobile.png`
