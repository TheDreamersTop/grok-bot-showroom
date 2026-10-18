[OPEN THE EXPERIENCE] → https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v9/

> **Final status, 2026-10-19 (TPE):** live **v9** was independently scored in [`reviews/REVIEW-10.md`](reviews/REVIEW-10.md) at **21/24 and passed the gate**: total ≥ 20, originality 2, kids test 2. This is the first passing version.
>
> **Borderline caveat:** the pass is narrow.
> - The strict blind read is **9/9** under REVIEW-09's rule (drop weak, by-elimination guesses only).
> - Under the reviewer's stricter count (confident and fairly-confident guesses only) it is **7/9**, which is borderline. The arrow (its head reads as a hook) and the sun (first impression "bug") are the fragile reads.
> - Both counts are upper bounds, because the reviewer knew the set of shape names.
>
> The history below the score table is the original v4-era report, kept for the record; the update notes inside it are superseded by this section.

## Score history (independent adversarial reviews)
| Version | Score | Gate | Review |
|---|---|---|---|
| v1 | 14/24 | PASS (V1 gate) | REVIEW-02 |
| v2 | 16/24 | — | REVIEW-03 |
| v3 | 17/24 | — | REVIEW-04 |
| v4 | 15/24 | FAIL (kids test) | REVIEW-05 |
| v5 | 16/24 | FAIL | REVIEW-06 |
| v6 | 17/24 | FAIL | REVIEW-07 |
| v7 | 19/24 | FAIL (1 point short) | REVIEW-08 |
| v8 | 20/24 | FAIL (kids test) | REVIEW-09 |
| **v9** | **21/24** | **PASS (narrow)** | REVIEW-10 |

**What got v9 over the line:**
- Side canyons that changed the outline are switched off, so shapes no longer grow "legs".
- Zigzags, junctions and bumpy outlines (bolt, arrow, tree, key, cloud) get look-down postcards.
- Canyon floors are lifted to a median luminance of 0.16–0.21 (it was 0.10–0.12).
- The wall tick marks and the 4-carve heart smear are fixed.
- 0 console, page or HTTP errors.

**REVIEW-10 sub-scores at 1:** depth (#5), detail at 100 % (#7), emergent response (#10). All other criteria score 2.

## Remaining weaknesses (REVIEW-10's top 5)
1. **No horizon on 5 of 9 blind postcards (#5 depth, #1).** The look-down frames used for arrow, fish, bolt, flower and T lose the sky and horizon. Fix: a ~35–40° three-quarter view with a sky band of ≥ 8 %, falling back to look-down only if a blind check fails. Target: ≥ 7/9 finals with a horizon while the strict blind read stays ≥ 8/9.
2. **Arrow head and thin connectors (#9 robustness).** The arrow's barbs still fold into a hook or "Z", with the lower barb as a separate blob. The bolt's middle link is a thin, broken neck. Fix: protect acute vertices from widening or merging, and set a minimum width on short segments.
3. **Blocky wall edges and lips (#7).** Pixel stair-steps along the outer wall edges show in 2× crops, the lit lips carry a bristly fringe, and 1–2 isolated dark blots remain per frame. Fix: sample walls and lips with the mesh's B-spline or supersample 2×.
4. **Little visible erosion character (#10).** With side canyons off and no benches or talus, the landform is a banded trench in the shape of the drawing. Fix: thin, dark V-crack gullies on outer rims only, plus 1–2 geometric benches and talus aprons, without changing silhouettes or the blind read.
5. **Strata grade (#3, #6).** The bands lean saturated, like sand art in a bottle. Fix: desaturate them ~20 % and move the teal stripe toward a grey-green, so the walls read as Colorado-Plateau sandstone.

---

> **Update 2026-10-14 21:00 TPE:** after this report was written, live v4 was independently re-scored in [`reviews/REVIEW-05.md`](reviews/REVIEW-05.md): **15/24 (down from v3's 17/24), kids-test FAIL** (blind read 4/9). That review also found the tall-shape crop still present, multi-stroke drawings losing every stroke after the first, off-plateau strokes carving a trench instead of being rejected, and few visible tributaries or benches. Claims below about the kids test and "not re-scored" are superseded by it.

# 深時 Deep Time: Final Report

## What I built
A desktop WebGL2 piece: you draw a line on a desert plateau, and an implicit stream-power erosion solver (Braun & Willett 2013, in a Web Worker) carves that line into a canyon over ~6 million years. Hard strata become cliffs, soft strata become benches; the plan form, depth, tributaries and exposed rock are solver output, not authored geometry.

Ways to play:
1. **Draw** on the plateau (hover glides to a steep drawing pose so screen strokes land true).
2. **Watch** the canyon grow (~9 s paced run; hold Space to skip the wait on a fast CPU).
3. **Wheel-scrub** back through ~10 depth snapshots without recomputing.
4. **Draw again** from the reveal or postcard; the new stroke carves through the old canyon.
5. **R** for a fresh plateau. **M** mutes the desert wind / rain / depth drone.

Static files only. Endorheic drainage (each stroke drains to its own playa). Wordless idle hint. Mobile gets a still postcard and an "open on a desktop" note (no WebGL).

## The Hero Moment
Release the pen. Rain starts on your stroke. Over a few seconds the plateau opens along the line you drew — a winding, stair-stepped canyon with sunlit walls, jade water, and a year counter climbing to millions. The postcard rests with sky and raking light so the shape still reads.

It is surprising because the canyon *is* your gesture, computed, not a stamped brush. A child can read a heart or a star without any text (self-imposed kids test).

## Evolution
| Stage | Independent score | What changed | Evidence |
|---|---|---|---|
| Phase A/B prototypes | best ~16/24 (A2 canyon postcard); pick → A | 10 refs, 10 concepts, 3+ rendered prototypes (deep-time, plateau film, frost window) + A2 look-dev + dry-lake wildcard; gesture test forced implicit solver | `prototypes/`, `shots/contact-sheet-phaseB*.png`, `reviews/REVIEW-01.md` |
| **V1** | **14/24** | End-to-end: worker solver, draw→carve→reveal, wordless hint, deploy | `reviews/REVIEW-02.md` (gate PASS, picture = clay toy) |
| **Pass 1** (visual) → v2 | **16/24** | Side light, sky, caprock, water level contour, reveal framing, quality governor | `shots/v2/`, `reviews/REVIEW-03.md` |
| **Pass 2** (experience) → v3 | **17/24** | Drawing pose + aspect fidelity, auto-scale strokes, paced growth, scrub, draw-again, audio on first press, blind 6/6 | `shots/v3/`, `reviews/REVIEW-04.md` |
| **Pass 3** (polish) → v4 | *not independently re-scored* | Exposure regrade, grandeur (wider/deeper), postcard rest pose, endorheic outlets (kills fixed stubs), stuck-in-draw race fix, fonts/OG/mobile fallback; then fitPose pull-back for tall-shape near-edge crop + deeper floor occlusion (deployed in wrap-up) | `shots/v4/`, public `v4/` |

Last independent score is **17/24 on v3**. Pass 3 shipped against REVIEW-04's list; a fifth adversarial re-score of live v4 was not completed before the 8 h budget ended, and is called out honestly below.

## Actual Work
- **Start:** 2026-10-09 06:57 TPE. **Primary build end:** ~13:20 TPE (v4 public verification). **Elapsed productive build:** ~6 h 23 min of the ~8 h budget. Remaining ~1.5 h was intended for final QA + FINAL_REPORT; those slipped. **Wrap-up:** 2026-10-14 (landing + README earlier that day; crop fix deploy + this report).
- Phase B held longer than v3's 23 min prematurely-closed research: multiple prototype iterations, originality kill of frost/film, and a gesture-feasibility proof before V1.
- Testing: headless Chrome + SwiftShader; deterministic `?shot=` frames; live synthetic-pointer sessions; public URL verification (0 console / HTTP errors on checked sessions). Real-GPU fps was not measured.
- Deploys: many normal pushes to `20261009-round4-lab/` (v1–v4 untouched relative to each other). No force-push. Other showroom projects untouched.

## Known Limitations
- **No independent score on final v4.** Last scored review is Pass 2 / v3 at 17/24. Pass 3 changes are listed above with evidence folders, not a new /24.
- **Real-GPU frame rate unverified.** Quality governor exists (`?q=0..4`); SwiftShader is 0.3–few fps.
- **Tall shapes (A, bolt)** could still feel tight in the postcard on some aspect ratios; fitPose pull-back was added in wrap-up to keep bbox corners in frame.
- **Desktop only** (by brief). Phones show a fallback still.
- **Software-render grading:** exposure/colour judged on SwiftShader frames.

## Artifacts
- **Live:** https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v4/
- **Versions hub:** https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/
- **Source:** https://github.com/TheDreamersTop/grok-bot-showroom/tree/main/20261009-round4-lab
- **Work folder:** `/workspace/_tmp/overnight/20261009-0657-r4/` — `PLAN.md`, `RESEARCH.md`, `PROGRESS.md`, `reviews/REVIEW-01..04.md`, `prototypes/`, `shots/`, `v1`–`v4/`
- **Tools:** `/workspace/_tmp/r4tools/`

**What makes it exceptional rather than merely competent:**
- The canyon is your drawn line after millions of years of computed rain, not a mesh stamp.
- Hard/soft strata and endorheic playas fall out of the solver; the camera and rain are the only authored parts.
- A child can read the shape without reading any text.
