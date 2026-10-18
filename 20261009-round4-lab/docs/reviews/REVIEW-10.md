# REVIEW-10: independent review of live Deep Time v9
- **Reviewer:** GK (Grok Bot), fresh session, 2026-10-19 00:30–01:45 TPE. No code edits.
- **URL:** https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v9/ (showroom 2a44514), at `?q=4`, 640×360.

## Protocol
Same as REVIEW-09:
- One sequential session in headless Chrome with SwiftShader.
- Trusted `page.mouse` strokes in screen space.
- 16 carves with R between shapes, then a reload. iPhone-13 emulation ran afterwards.
- Every final frame is a true resting postcard: `toRest → reveal` is logged for 16/16 carves.

The run was interrupted once. The browser session kept running and all of its outputs were reused. The blind guesses and the key are unchanged.

Script and log: `assets-10/rv10.js`, `S.log`.

## Verdict
**v9 = 21/24. Gate: PASS, narrowly.**
- Total ≥ 20.
- Originality = 2.
- Kids test = 2: the strict blind read is 9/9 under the REVIEW-09 rule (exclude weak, by-elimination guesses).
- Caveat: under a tighter confident-only count it is 7/9. The arrow and the sun are the fragile reads.

**What earned it:**
- Removing the outline-changing side canyons restored the silhouettes.
- The canyon floors are no longer black.
- The tick marks and the heart smear are essentially gone.

**What it cost:**
- 5 of the 9 blind postcards are look-down frames with **no horizon**. Depth regressed.
- With the side canyons gone and no benches or talus, the landform is a banded trench in the shape of the drawing. Nothing grows out of the physics.

**AI-expert wow verdict: "Polished and charming; one notch below wow."** The strata are gorgeous at the reveal. An expert will still ask where the erosion is, because nothing branches, steps or slumps.

## Re-check of the REVIEW-09 fixes
| # | Fix | Verdict | Evidence |
|---|---|---|---|
| 1 | No outline-changing side canyons | **PASS.** Side canyons are disabled, so no "legs". Heart, cloud and moon read confidently. Some lips still fray slightly (star in the 4-carve run). | `00`, `04` |
| 2a | Bolt | **Improved.** The zig is visible in the look-down postcard and I read it fairly confidently. The middle link is a thin, broken neck, and the frame is small (~15 % width) with no horizon. | `02` |
| 2b | Arrow barbs | **Not fixed.** The head still reads as a bent hook or "Z"; the lower barb is a separate blob. My read was moderate. | `02` |
| 3 | Fill light ≥ 0.15 | **PASS.** Canyon-pixel median luminance over the 9 blind finals is **0.160–0.206** (p25 0.13–0.18), against a plateau of ≈ 0.40. Same method as REVIEW-09, where it was 0.10–0.12. | numbers below |
| 4 | Tick marks and blocky edges | **Ticks: mostly fixed.** Only 1–2 isolated dark blots per frame remain (cloud, heart island lip). **Blocky edges: not fixed.** Pixel stair-steps along the outer wall edges are obvious in 2× crops. The lit lips also carry a bristly fringe. | `06` |
| 5 | Heart smear | **FIXED.** The 4-carve heart is clean; only a small dribble remains under the tip. | `03` |
| — | 4-carve check (heart → star → A → spiral, no R) | **PASS.** All four are legible and in frame. Older carves silt away. The star's rims are frayed. | `03` |

Canyon-pixel median L per final: sun .175, flower .192, T .206, cloud .177, bolt .202, arrow .172, moon .164, heart .173, fish .160.

## Builder's trade-offs
| Trade-off | Verdict |
|---|---|
| Six shapes use a look-down postcard with no horizon | **Confirmed.** In my blind 9, five finals have no horizon (arrow, fish, bolt, flower, T); four keep it (sun, moon, heart, cloud). The I keeps its horizon. This undoes REVIEW-07's horizon target (7/9) and costs #5. |
| Side canyons disabled | **Confirmed.** This is the right call for legibility, but it leaves #10 at 1. |
| Benches and talus skipped | **Confirmed.** The walls are banded, but there are no geometric steps and no aprons at the wall feet. |

## Functional checks (live)
| Check | Result |
|---|---|
| Load | No white frame in 40 pre-ready frames. |
| Title and hint | Both shown. |
| Carves | 16/16 complete reveal → rim → rest → end card. |
| Multi-stroke | Sun (7 strokes), flower (2), T (2), arrow (2), fish (2): all kept. |
| Edge stroke | Re-laid inward. |
| Tap | Makes a single sinkhole. |
| Controls | Wheel scrub goes back to step 82 and forward to 170. M toggles. R was used 12×. Reload returns to `first`. |
| Errors | **0** console, page or HTTP errors. |
| Mobile fallback | Passes (`07`). |

## Blind read (fresh set of 9, strict)
- **Shapes:** sun, flower and T are new to any review. Cloud, bolt, arrow and moon are past failures. Heart and fish complete the set.
- **Shuffle:** seed 101019.
- **Key:** outside the repo at `/workspace/_tmp/r4tools/tmp/review10/BLIND_KEY_review10.json`.
- **Guesses:** graded C/F/M/W and written before opening the key, in `assets-10/blind_guesses_review10.txt`.

**Result: 9/9 correct.**
- Confident: fish, flower, T, moon, cloud.
- Fairly confident: bolt, heart.
- Moderate: arrow (head reads as a hook), sun (first impression "bug").
- No weak or by-elimination guesses.

**Strict (REVIEW-09 rule, exclude W): 9/9 ≥ 7/8 → kids test = 2.** On a confident-or-fairly-confident-only count it is 7/9. This is an upper bound, because I knew the set of names.

## 12-criterion scores (v9; v8 = 20)
| # | Criterion | v9 | Note |
|---|---|---|---|
| 1 | Focal / composition | **2** | One clear subject, always in frame with margin, caption clear. |
| 2 | Value structure | **2** | |
| 3 | Palette / colour script | **2** | Golden postcard plus banded strata. The bands lean toward saturated "sand-art". |
| 4 | Light | **2** | Fill light lifts the floors to 0.16–0.21; low sun with long shadows. |
| 5 | Depth | 1 | 5/9 postcards are look-down with no horizon. |
| 6 | Material | **2** | Layered red rock at a glance. |
| 7 | Detail @100 % | 1 | Blocky stair-step wall edges, bristly lips, stray dark blots. |
| 8 | Originality | **2** | |
| 9 | Kids test | **2** | Strict blind 9/9 (7/9 confident-only). |
| 10 | Emergent response | 1 | No side canyons, benches or talus. |
| 11 | Motion | **2** | |
| 12 | Polish / UI | **2** | 0 errors, mobile works. |
| | **Total** | **21/24** | **PASS**: ≥ 20, #8 = 2, #9 = 2 |

## Ranked fixes (to make the pass robust and reach wow)
1. **Give the look-down postcards a horizon again (#5, #1).** Use a ~35–40° three-quarter view with a sky band of ≥ 8 % for the look-down group, and fall back to look-down only if a blind check fails. At minimum, tilt up until the mesa skyline enters the frame. **Accept when** ≥ 7/9 finals show the horizon and the strict blind read stays ≥ 8/9.
2. **Arrow head and thin connectors (#9 robustness).** Protect acute stroke vertices from widening or merging, so the two barbs stay separate. Enforce a minimum canyon width on short segments so the bolt's middle link is not a broken neck. **Accept when** the arrow and the bolt are read confidently.
3. **Blocky wall edges and lips (#7).** Sample the wall and lip mask with the mesh's B-spline or supersample it 2×. Soften the bristle fringe on the lit lips. Remove the remaining isolated dark blots. **Accept when** a 2× crop shows no pixel stair-steps.
4. **Bring back erosion character without changing silhouettes (#10).**
   - Add thin, dark V-crack gullies (≤ 0.4× canyon width, ≤ 1× canyon width long) on the outer rims only, pointing downhill.
   - Add 1–2 geometric benches and talus aprons at the wall feet.
   - **Accept when** an expert sees "erosion", and the blind read and silhouettes are unchanged.
5. **Strata grade (#3, #6).** Desaturate the bands ~20 % and drop the teal stripe toward a grey-green, so the walls read as Colorado-Plateau sandstone rather than sand art in a bottle.

## Key evidence (`assets-10/`)
- `00-contact-blind9-finals-top-reveals-bottom.jpg`: contact sheet, in shuffled order.
- `02-bolt-arrow-I-reveal-vs-postcard.jpg`
- `03-four-carves-in-a-row.jpg`
- `04-multistroke-and-closed-shapes-sun-flower-cloud-heart.jpg`
- `06-2x-crops-walls-ticks-edges.jpg`
- `05-edge-stroke-tap.jpg`
- `01-load-title.jpg`
- `07-mobile.png`
