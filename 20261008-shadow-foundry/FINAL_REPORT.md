[OPEN THE EXPERIENCE] → https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/

# 影鑄 Shadow Foundry: Final Report

## What I built
A desktop WebGL2 installation of one hanging sculpture of about 1,500 aged-brass rods in a plaster room corner, lit by three track lamps. Each lamp casts the sculpture's shadow onto its own surface (east wall, north wall, polished floor). From almost every angle the shadows are tangles. At exactly one orientation all three lock at once into a **cat**, a **tree** and a **swallow**.

The sculptures are computed, not modelled. A perspective visual hull from the three lamps (after Mitra & Pauly, *Shadow Art*) is filled with sphere-traced rods, edge rods and repair rods. Coverage is then measured by rasterising the real rods from each lamp: built-in works reach ≥ 98 %, GEB ≥ 95.6 %.

Ways to play:
1. **Turn** the sculpture into alignment. Penumbra, sound and a magnetic detent guide you.
2. **Type any three letters** to forge a word sculpture live in a Web Worker. Words get shareable `#w=ABC` links.
3. **Draw your own three shadows** and forge a sculpture that casts them.
4. **Shatter**: click the sculpture or *Next*. The rods storm and implode into the next work (No. 2 hand · key · butterfly, No. 3 G·E·B after Hofstadter).
5. **Drag a lamp** along its ceiling track: the shadow reprojects live, and the lamp springs home with a clunk.
6. **Be the lamp**: click *Be the lamp · 1 2 3*, double-click a lamp head or press 1/2/3. The camera flies into the lamp, and from there the brass's own silhouette *is* the figure.

Static files only, three.js r160, procedural WebAudio, bilingual README.

## The Hero Moment
***The Forge*** (the first ~5 s, no input needed):
- Three lamps clunk on, one after another, onto empty walls.
- ~1,500 brass rods fly in out of the dark and swirl as a storm cloud, filling every pool with moving hatching. The rods slice streaks through the beams.
- The rods implode from ~4.2 s, and at ~5 s **all three pictures lock at once on three surfaces from one object**, with a lock chord, a penumbra collapse and a slow push-in.

It is surprising because the shadows are clearly cast by the brass, not drawn. And it is not a particle demo, because the same rods are the sculpture you then turn, shatter, re-forge and look through.

Its second beat is **Be the lamp**: from the lamp's position the sculpture's silhouette lines up into the figure, so you see the cat in the brass itself. That turns the main limitation (the hull carries the figure's outline) into the point. Proof: `shots/p3l-lamp-strip.png`, `shots/p3l-lamp-geb.png`.

## Evolution
| Stage | Independent score | What changed | Evidence |
|---|---|---|---|
| Phase A/B prototypes | 10/24 (Foundry wire2; Chladni scored 12, Lumen 5) | 10 references, a 12-point benchmark, 7 concepts, 3 rendered prototypes (Shadow Foundry, Lumen Atelier, Chladni). The review chose the brass-rod Foundry | `prototypes/`, `shots/contact-sheet-phaseB.png`, `reviews/REVIEW-01.md` |
| **V1** | **15/24** | Visual hull + rod forging, per-lamp isolated plaster shader, lock sequence, turntable with sharpening cues, draw-your-own, procedural sound, museum labels | `shots/v1-before-after.png`, `shots/v1-lock-filmstrip.png`, `reviews/REVIEW-02.md` |
| **Pass 1** (visual) | **18/24** | Rod coverage 93–96 % → ≥ 98 % (exact ray-test repair, edge rods, hole fill); a real room (track, wire, polished floor, bounce); precomputed works; worker forging | `shots/v1b-before-after.png`, `shots/v1b-edge-crops-100.png`, `reviews/REVIEW-03.md` |
| **Pass 2** (experience) | **20/24** | *The Forge* implosion opening; shatter → storm → re-forge; type-three-letters + `#w=` links; No. 3 GEB; hero push-in; draggable lamps | `shots/p2-opening-filmstrip.png`, `shots/p2-shatter-strip.png`, `shots/p2-lamp-drag-before-after.png`, `reviews/REVIEW-04.md` |
| **Pass 3** (polish) | **22/24** | Placard reveals at the lock; typed order with an upright floor letter (switches only for > 6 / > 3 points); spur trim; brass key + rim light; three distinct pools; plaster lift; frame-time governor + `?debug=1`; gesture-only audio with a limiter; dead-end fixes | `shots/p3n-before-after.png`, `shots/p3n-brass-crop.png`, `shots/p3-word-cat.png`, `reviews/REVIEW-05.md` |
| Final | **23/24** (REVIEW-06) | Review #5 fixes (governor floor at q2 without touching shadow maps, honest fps, paste queue, cast order on the placard); storm streaks; tree pool without the barn door; **Be the lamp**. *After* REVIEW-06 scored it, its fixes were applied (not re-scored): a *Be the lamp · 1 2 3* link + idle hint, a caption pill, exit lamp view on shatter/forge, a sound cue until the first gesture, governor step-up under 18 ms, idle re-lock after 20 s | `shots/p3l-lamp-strip.png`, `shots/p3l-lamp-geb.png`, `shots/p3n-live-t7-final.png`, `shots/p3r-group1-checks.png`, `reviews/REVIEW-06.md` |

## Actual Work
- **Start:** 15:24 TPE. **End:** 22:20 TPE (REVIEW-06 fixes, final live QA and these docs deployed; about 64 min of the 8 h budget unused). **Elapsed:** 6 h 56 min. (The first "final" was at 21:09; the REVIEW-06 fixes and final QA ran 21:26–22:20.)
- **Phase A/B took ~23 min (15:24–15:47).** That is far under the ~2 h the brief suggests, and it was flagged as premature. The prototypes were real renders, but the comparison was thin: independent review #1 scored them 10/9/12/5 against my inflated 16/16/12. I compensated with a 60-min look-dev spike under a kill criterion before V1.
- **Executor interruptions:** runs were cut at about 16:40, 17:10, 17:40, 19:08 and ~22:15 TPE (the last one after the final QA, before the docs push, which I then finished by hand); one test was interrupted at ~20:09 by a steering message. Each resume restarted from git and PROGRESS.md. One early incident cost ~10 min: main.js's render tail was truncated before the work folder had git. A local repo was then created and committed at every step.
- **Testing:** done entirely in headless Chrome on SwiftShader (0.3–8 fps), with deterministic `?shot=1` renders and default-mode puppeteer flows. A dead-end harness (10 scenarios) plus live checks ran after every deploy: 200 on all assets, 0 console errors **and** 0 warnings. Final live QA after the REVIEW-06 fixes: 227/227 folder files 200; 10/10 dead-end scenarios ok (0/0); hard refresh and `#w=GEB` + reload clean (0 errors, 0 warnings, 0 failed requests); the sound cue shows before the first gesture and clears after it; lamp flow (keys, double-click, the new link, typing exits lamp view, Draw exits) ok with 0/0; idle re-lock verified with `?idle=4`; 1280×800 frames `shots/p3r-live-1280-t7-final.png` and `shots/p3r-live-1280-floorlamp-caption.png`.
- **Bugs found by my own verification:**
  - a worker stall on GPU-backed ImageBitmaps;
  - letters dropped during the opening;
  - Enter also clicking a focused button;
  - the governor ignoring slow frames;
  - an empty-draw Forge label not initialised;
  - a shader compile error from a `//` comment;
  - a reversed cast order on the placard.
- **Deploys:** 24 normal pushes to the showroom (no force). 20261007-orbital-forge was never touched.

## Known Limitations
- **No real-GPU frame-rate measurement.** Everything was tested with software rendering (SwiftShader). The quality governor (haze, then pixel ratio, floor at q2; steps down above 28 ms for 2 s, back up after 5 s under 18 ms so 60 Hz displays recover) is designed for slow GPUs but is unverified on real hardware.
- **The sculpture reads as the figure from the main camera.** A visual hull carries the outline of its figures, so a squint shows the cat in the brass. *Be the lamp* makes this the point, but "nothing from the front" is only partly true.
- **Weak letter triples:** LOV's worst wall is 75.7 %. 19/22 test words reach ≥ 90 %, 7/22 reach ≥ 95 %.
- **Reordered and tilted words:** typing aims for typed order, but 10/22 test words are cast in a different wall order and 12/22 with a 45° floor letter. The placard says so (e.g. *CAT · cast as C·T·A*).
- **Software-render-only testing:** visual judgements (haze density, brass rim, streak strength) were made on SwiftShader frames. Real GPUs may look slightly different, e.g. through MSAA and precision.
- **Other gaps:** desktop only (1280×800–1920×1080); tested in Chrome only.

## Artifacts
- **Live:** https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/. Share links: `…/#w=GEB`, `…/#w=CAT`; debug: `…/?debug=1`.
- **Source in the showroom:** https://github.com/TheDreamersTop/grok-bot-showroom/tree/main/20261008-shadow-foundry. The folder README is bilingual (zh-Hant + English).
- **Showroom root:** https://thedreamerstop.github.io/grok-bot-showroom/ (card + README row updated).
- **Work folder:** `/workspace/_tmp/overnight/20261008-1524-v3/` (local git):
  - `v1/`: the experience source;
  - `deploy/README.md`: the folder README;
  - `PLAN.md`, `RESEARCH.md`, `PROGRESS.md`, `REVIEW.md`, `reviews/REVIEW-01..06.md`;
  - `prototypes/`: Phase B;
  - `shots/`: all evidence; key frames are `p3n-live-t7-final.png`, `p3l-lamp-strip.png`, `p3l-lamp-geb.png`, `p3n-before-after.png`, `p2-opening-filmstrip.png`, `v1-before-after.png`.
- **Test harness:** `/workspace/_tmp/v3tools/`: `shot.js`, `deadends.js`, `lvflow.js`, `refresh.js`, `cueshot.js`, `idleflow.js`, `warncheck3.js`, `mixmeter.js`.
- **Final showroom commits:** last code commit c4b0810 (idle re-lock; REVIEW-06 group 1 was a143ffe), followed by one docs-only commit carrying this report and the corrected README. Local work-folder code commit: 5d45018.

**What makes it exceptional rather than merely competent:**
- The shadows are physically cast by a computed object. Three unrelated pictures resolve from one tangle at one angle, and the coverage is measured, not faked.
- The same rods carry every verb: forge, turn, shatter, re-forge, type, draw.
- *Be the lamp* lets you stand where the light stands and see why it works.
