# REVIEW (independent adversarial reviews + self-critique)

## Self-critique at end of Phase B (builder, 2026-10-08 ~15:41 TPE) — to be superseded by independent review
- None of the prototypes is "stunning" yet; each proves its core tech. Best frame: Chladni v2. Best concept: Shadow Foundry.
- Shadow Foundry: terraced sculpture surface, generic room, trick given away by the camera angle, no hero choreography.
- Lumen Atelier: drifts into "dark + glow" cliché; flat silhouettes.
- Chladni: diagram-like risk, textbook physics, single gimmick.
Independent review: pending (reviews/).

## Independent review #1 (2026-10-08 15:52 TPE, full text: reviews/REVIEW-01.md)
- **Verdict:** GO with Shadow Foundry (wire/rod sculpture). Don't explore a 4th concept. First spend at most 60–75 min on a look-dev and legibility spike. Kill criterion: if the solved frame fails T1–T3 or scores < 14/24, fall back to Chladni, and only with arbitrary-shape plates.
- **Honest scores:** Foundry wire2 10/24, solid v3 9/24, Chladni v3 12/24, Lumen v3 5/24. The builder's 16/16/12 is inflated. None of them would wow a stranger in 3 s today.
- **Key evidence:**
  - The pixel mosaic comes from the 256 px `image-rendering:pixelated` grain overlay, in all three prototypes.
  - The cat and bird shadows are only 1.25× darker than their pools (the cat shadow is brighter than the unlit wall).
  - Cat reads as rabbit, bird as airplane, tree as mushroom.
  - The scrambled frame shows the targets on the wrong walls.
  - Free 3-DOF rotation with a 0.22 rad snap basin can't realistically be solved (≈ 0.05 % of SO(3)).
- **Top changes:**
  1. Redesign the figures, run the consistency pass, choose scramble poses by entropy.
  2. Lighting rig: no spill, shadow:lit ≥ 4:1, visible lamp heads with haze beams sliced by rods.
  3. Shader grain and plaster, no skirting boxes.
  4. Elevated (1, 0.8, 1) diagonal camera, tight frame, pin and plinth.
  5. Rods: fewer, full-span, 3 gauges, patinated brass, AO, separable 2D-SDF hull test.
  6. Constrained DOF plus guidance (penumbra, darkness, audio beating to unison).
  7. Auto-intro and choreographed LOCK by 4 s.
  8. Draw-on-wall authoring with live re-forge in V1.
  9. Procedural sound.
  10. Museum wall labels instead of the debug HUD.
- **V1 acceptance tests (T1–T12):** context-free naming of all three figures, no figure named in the scrambled frame, contrast ≥ 4:1, coverage ≥ 97 %, thumbnail legibility, scramble IoU ≤ 0.35, solvable in ≤ 60 s, auto-LOCK ≤ 5 s, hero filmstrip, authoring re-forge ≤ 1 s, t = 3 s frame already striking, no errors / ≥ 50 fps, independent score ≥ 15/24.

## Self-status at V1 (2026-10-08 ~16:50 TPE; builder's own view, to be verified by review #2)
- **T1 Stranger naming:** self-judged PASS on text-free crops (shots/v1-t1t2-crops.png): cat clear; tree clear (a bit lollipop-like); swallow clear but the plinth's shadow covers its body. Not yet verified by fresh subagents.
- **T2 Before/after:** scrambled frame reads as blobs (self-judged); the mid-approach frame already hints at the cat. Unverified.
- **T3 Contrast:** PASS by script, 8.3 / 8.0 / 19.4 : 1.
- **T4 Fidelity:** FAIL. Rod coverage 96.6 / 93.6 / 93.9 % (< 97 %). Edges are ragged/speckled at 100 % crop. Grain is per-pixel (no mosaic).
- **T5 Thumbnail:** self-judged PASS at 320×180 (v1-thumb-320.png).
- **T6 Scramble IoU ≤ 0.35:** FAIL. The strict metric gives 0.53 / 0.55 / 0.37 because blob overlap dominates IoU; visually non-revealing.
- **T7 Solvability:** PASS. Naive guidance-following solver: 2.25 s simulated. Auto-lock at 4.0 s.
- **T8 Hero filmstrip:** PASS (self). The strip shows soft/pale → staggered collapse → near-black and labels.
- **T9 Authoring:** PARTIAL. Re-forge works (heart/star/A), but takes 2.3 s CPU (> 1 s target) and coverage is 93.3–95.1 % (< 95 % on 2/3).
- **T10 First 3 seconds:** PASS (lamps, beams, object in motion, figures emerging).
- **T11 Tech:** 0 console errors live; audio only after a gesture. fps not measurable here (SwiftShader only), so it is unknown on a real GPU.
- **T12 Honest score:** pending independent review.

## Independent review #2 (2026-10-08 ~16:55 TPE, full text: reviews/REVIEW-02.md)
- **Score: V1 15/24** (prototype 10). It just meets the V1 gate. The solved still looks like a gallery piece. Not a WOW yet.
- **Verified T-table:**

  | Test | Result | Note |
  |---|---|---|
  | T1 naming | PARTIAL | The preset 2 fish fails; plinth shadow on the swallow; cat may read as fox. |
  | T2 before/after | FAIL (spirit) | The scrambled state only "passes" because shadows are lightened to 1.15:1; a cat is visible at 2–3 s, including on the tree wall. |
  | T3 contrast | PASS | ≈ 11:1 / 9:1. |
  | T4 fidelity | FAIL | Coverage 93.6–96.6 %; fish 67 %. |
  | T5 thumbnail | PASS | |
  | T6 scramble IoU | FAIL | The metrics file and PROGRESS disagree. |
  | T7 solvable | PASS | But trivial: 3 drags. |
  | T8 filmstrip | WEAK PASS | |
  | T9 authoring | FAIL | 2.35 s; 93–94 %. |
  | T10 first 3 s | PASS (letter) / FAIL (spirit) | |
  | T11 tech | PARTIAL | 2.2–2.6 s main-thread forge at boot; no GPU fps. |
  | T12 score | PASS (barely) | 15/24. |

- **Top criticisms:**
  1. The brass object is visibly the cat (and the hand), so the "meaningless object" magic is gone.
  2. The lock is a contrast fade over already-legible figures.
  3. Ragged, pinholed shadow edges and a broken preset 2.
  4. Blown-out identical pools in a black void, faint beams, one lamp out of frame.
  5. Shallow verbs and nothing shareable.
  - The reviewer retracts REVIEW-01's "darker as you approach": shadows must stay physically dark.
- **Escalation plan:**
  - **Pass 1, Visual:** coverage ≥ 98 % (skin rods + greedy hole-fill, baked presets), exposure so pools sit at 0.55–0.65 with visible colour and plaster, a real room with a reflective floor and a ceiling lamp track, beams sliced by rods, longer patinated rods, a ceiling suspension wire. Target ≥ 18.
  - **Pass 2, Experience:** a new hero, "The Forge": rods fly in from darkness, hatch-storm shadows resolve into three figures at about 5 s. Shatter → re-forge as the repeatable verb. Type-to-forge (GEB / initials / 影光形) plus a share URL. Draggable lamps. A "be the lamp" secret. 4 curated works in one room; no multi-room gallery; no literal orbit. Target ≥ 20 with 8 and 9 = 2.
  - **Pass 3, Polish:** < 1.5 s boot with baked presets and a Worker forge, a perf governor, a timing and audio pass, dead-end sweep, micro-details, a full visitor-flow proof.

## Independent review #3 (2026-10-08 ~18:20 TPE, Pass 1 live; full text: reviews/REVIEW-03.md)
- **Score: 18/24** (V1 15). The Pass 1 target is met, at the floor. All the gain is visual:
  - palette 1 → 2;
  - depth 1 → 2;
  - detail 1 → 2.

  Experience criteria 8 / 9 / 10 are still 1.
- **Live checks:** 14 fresh headless sessions, 0 errors, 0 failed requests. Live console fidelity: 98.7/99.7/98.2 and 98.7/98.1/98.2. Worker forge 95.6–97.4 %.
- **Checklist:**
  - fidelity: DONE (presets);
  - exposure/colour: mostly done (pools still identical discs);
  - room: PARTIAL (plaster 0.007, too dark);
  - beams: PARTIAL (no visible rod streaks);
  - object: PARTIAL (wire ✓; chips, not rods; tail hook; wire shadow "hangs" the cat).
- **Top problems:**
  1. Reveal spoiled: a cat on the TREE wall at 1.5 s, the cat legible at 3 s, the curled tail on both walls in the scramble, and the lock frames are identical.
  2. The object gives it away: tail hook; scramble pose = crucifix; the forged heart is a brass heart.
  3. Template Venn of 3 identical discs, faint beams, black plaster.
  4. Brass reads as shredded tobacco; wire shadow on the cat's head.
  5. Interaction unchanged; raw ids leak ("letterA"); GPU fps unmeasured.
- **Pass 2, prioritized:**
  1. **Forge IMPLOSION opening:** a storm cloud of rods at 1.6–2.2× hull radius → all collapse together at ~4.5–4.9 s, so nothing is nameable before. Single most impactful change.
  2. Shatter → storm → implode as the "next" transition.
  3. Type 3 letters → forge + `#w=` share URL, with GEB baked as Work No. 3.
  4. Draggable lamps, if time allows.
  5. "Be the lamp" as a Pass 3 stretch.

  Also: drop 影光形 unless it's ≥ 95 % first try; demote and refit the scramble (no crucifix, no tail); fade the wire shadow. No multi-room, no orbit, no big finale.

## Independent review #4 (2026-10-08 ~19:15 TPE, Pass 2 live at showroom d71df2f, loaded 18:57–19:03; 4afe8e1 landed at 19:08 and was not tested; full text: reviews/REVIEW-04.md)

**Score: 20 / 24** (REVIEW-03: 18). The Pass 2 target of ≥ 20 is met, at the floor. Gains: originality, hero legibility and motion each went from 1 to 2. Loss: UI went from 2 to 1.

- **The reveal works now.** In unlabelled crops I can name nothing at 1–4.8 s (lace and haystack shadows) and name tree, cat and swallow at 5.5 and 6 s. The t = 2–4 s storm is the best image in the project.
- **Shatter → re-forge works:** the cat / tree / swallow bursts into lace, a haystack forms at +2.4 s, and the hand / key / butterfly appears at +3.2 s.
- **Share links work.** `#w=` WMW, CAT, TPE, LOV and GEB all load in fresh sessions. The default-mode typing flow (Esc → T P E → forged → URL `#w=TPE`) works.
- **No errors** in any session.

**Top 5 problems:**
1. **The placard names the answer during the storm.** It shows "No. 1 — Cat, Tree, Swallow" from t = 1 s, and "W, W, M" before the forge.
2. **Typed words don't read as typed.** The wall order is permuted (CAT shows as T / C / ∀) and the floor letter is upside down from the camera. Letters overfill the pools, and LOV has hair spurs.
3. **Brass at the push-in is still chips**, with no highlight or rim.
4. **Still three identical discs in a Venn**, with no rod shafts in the beams. The plaster measures 0.006–0.007 (target 0.015–0.025).
5. **UI faults:**
   - the Tree label is cut by the drop rod at 1280 / 1440 / 1920;
   - the typing hint is near-invisible;
   - the empty slot boxes persist after a forge;
   - the 1280 bottom band is crowded;
   - 22 AudioContext warnings;
   - the real-GPU frame rate is still unmeasured.

**Pass 3 priority:**
- **P0:**
  - hide the titles until the lock;
  - typed order = left / right / floor, upright floor letter, typed word on the placard;
  - letter scale to about 80 % of the pool, plus a spur trim;
  - fix the label occlusion and the 1280 layout;
  - a visible typing hint and hidden slots;
  - clear the stale `#w=` hash for non-word works and add a `hashchange` handler.
- **P1:**
  - a real-GPU frame log and quality governor;
  - brass key / rim light and rod gauges;
  - different pool sizes and shapes;
  - plaster at 0.015–0.025.
- **P2:**
  - beam rod streaks (behind the governor);
  - a 4–5 s solved hold and audio mix;
  - dead ends.
- **QA:** full fresh-session matrix, including the placard text per frame.

## REVIEW-05: Pass 3 (Polish), independent, commit `1525152` (tested 19:53–20:20 TPE)

**Score: 22/24** (R-04: 20; target ≥ 21, **met**). Full review: `reviews/REVIEW-05.md`; assets in `reviews/review05-assets/`.

**Confirmed fixed:**
- The placard shows "· · ·" until the figures lock.
- Typed order and the upright floor letter: TPE, LOV, GEB, WMW. The placard notes when a word was reordered (CAT, SKY).
- Letters sit inside the pools.
- The Tree label is clear of the rod.
- The 1280 layout is clean.
- Hash clearing works, and a pasted `#w=` forges.
- The typing hint is readable, and typing during the opening is buffered.
- 62 % push-in (measured 63 / 60 / 60 %), held ≈ 5 s.
- The brass pops.
- The pools no longer overlap.
- Plaster ≈ 0.019.
- Rapid triple Next is safe.
- 0 errors and 0 warnings, including audio.

**Partial:** spur trim (SKY 82.7 %, LOV 75.7 % still ragged).

**Top problems:**
1. The governor only steps down, and its lowest levels cut the shadow map to 1024 and the pixel ratio to 0.5. A 40 fps laptop would end up blurry, with stair-stepped shadows.
2. The `?debug` fps readout is computed from frame times capped at 200 ms, so it shows 6 fps when the real rate is 0.3 fps.
3. The sculpture spells the answer from the hero camera (a gold cat, an "O", an "S").
4. The barn-door chord on the tree pool reads as clipping at 100 %.
5. A paste is dropped after a 30 s retry, leaving a hash that doesn't match the work shown.

**Final list (21:00–23:00):**
1. Governor: stop at q2, never reduce shadow maps, trigger at more than 28 ms, optional step-up.
2. Show uncapped fps in the overlay.
3. Clear the hash, or keep retrying, when a paste gives up.
4. *(Optional)* Feather the barn-door edge.
5. *(Optional)* Placard copy that also gives the cast order for reordered words.

**Don't touch:** pools, timing, presets, the brass shader, the worker fit.

**QA:** a real-GPU `?debug=1` fps check at 1920 and 1280; the opening, placard and hold; typing before and after the opening; Next ×3, clicks ×3, draw → back; fresh `#w=` links plus a paste (including in draw mode); 0 warnings; Pages 200s after a hard reload.

## REVIEW-06: final, independent, showroom `0be205c` (code `e77ea33`), tested 21:12–21:26 TPE

**Score: 23/24** (R-05: 22). Full review: `reviews/REVIEW-06.md`; assets in `reviews/review06-assets/`.

**Be the lamp works on all three lamps and on GEB:**
- From the lamps you see a woven gold cat, tree and swallow; for GEB, E / G / B.
- The flight is a smooth 1.2 s with no clipping.
- No stuck states: Esc, a click, the same key or draw mode all return. 0 errors and 0 warnings.

**The REVIEW-05 fixes are confirmed:**
- governor floor at q2, with the shadow maps kept;
- raw fps in the overlay;
- the tree pool is a plain circle.

**Top problems:**
1. Be the lamp, the 1/2/3 keys, click-to-shatter and lamp dragging are never mentioned on screen (only a hover hint).
2. The opening is silent for a passive visitor.
3. After the 5 s hold the piece loosens into a tangle and stays that way unless you drag.
4. The lamp caption is illegible on the floor-lamp view.
5. A shatter or forge in lamp view flies the storm through the lens.
6. Governor step-up needs more than 71 fps, so it never recovers on 60 Hz displays.

**Safe fixes, ranked:**
1. A "Be the lamp · 1 2 3" action link and hint (~10 min, highest impact).
2. A caption pill (~5 min).
3. `exitLamp()` when a shatter starts (~5 min).
4. A sound cue during the opening (~10 min).
5. Step-up threshold `< 18` ms (1 min).
6. *(Optional, moderate risk)* idle re-lock after 25 s.
7. Docs.

**Report corrections:**
- Phase A/B "10/24 best of 3" is wrong (Chladni scored 12).
- The final score is 23.
- The hero locks at ~5 s, not 4.2 s.
- The end time, elapsed time, commit and REVIEW-01..06 list need updating at delivery.
- "Recovers when fast again" is false at 60 Hz.
- README coverage numbers differ from live (98.7/99.7/98.2 and 98.7/98.1/98.2).
- "Reads in typed order" leads with what is the exception for 10 of 22 test words.
