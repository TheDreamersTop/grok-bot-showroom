# PROGRESS (append-only)

## 2026-10-08 15:25 TPE — Run 1 start (Phase A+B dispatch)
- Read CHALLENGE.md. Starting Phase A research.
- 15:26 RESEARCH.md written (10 references + 12-point Visual Quality Benchmark).
- 15:27 research/concepts.md: 7 concepts, shortlist C1 Shadow Foundry, C2 Lumen Atelier, C3 Chladni.
- 15:38 Prototypes shadow-foundry, lumen-atelier, chladni written; first shots rendered (SwiftShader 4-8s each with ?shot=1). Local server port 8931 (8765 busy).
- 15:39 Tweak pass v2 on prototypes (foundry darker room + 2-pass smoothing; chladni granular noise + low camera — big improvement; lumen sky tweak, minor). PLAN.md written with comparison table; leaning Shadow Foundry (not final).
- 15:40 DEPLOY TEST: pushed commit 099b9a1 "Add 20261008-overnight-v3 pipeline test (WIP prototypes)" to showroom main (no force, only new folder). Pages: https://thedreamerstop.github.io/grok-bot-showroom/20261008-overnight-v3/ → 200 (~30 s after push); prototypes/chladni, shadow-foundry, lumen-atelier, vendor files → 200; 20261007-orbital-forge and root still 200. Live headless render of chladni OK (only favicon 404).
- 15:40 prototypes/EVALUATIONS.md written. Phase A+B complete pending independent review. Elapsed since start: ~16 min.
  Current quality bottleneck: no concept has a choreographed hero transition yet; Shadow Foundry sculpture material (terracing) and camera giving away the trick.
  Next action: independent reviewer critiques shots/*.png; then choose concept, write Hero Moment spec, start V1.
- 15:41 NOTE: actual elapsed only ~17 min for first pass of A+B (tool calls were fast). Not stopping: deepening research and iterating prototypes so the comparison is fair (brief budgets ~2h for A+B).
- 15:41 RESEARCH.md addendum: Shadow Art paper method (consistency via 2D warps) + template landscape to avoid (Codrops 2025-26, SOTY 2025).
- 15:44 Iteration 2 on prototypes: Shadow Foundry v3 (plaster, colour-coded pools, penumbra tied to alignment = crystallize transition) + NEW wire-nest variant (5,200 brass rods inside hull; shadows preserved, object no longer gives away the trick) — most promising. Chladni v3 brushed-metal env. Lumen v3 GI rim (minor). Docs updated (EVALUATIONS, PLAN table).
- 15:45 Draft Hero Moment (Shadow Foundry wire-nest) added to PLAN.md; reviews/REVIEW_BRIEF.md + shots/contact-sheet-phaseB.png prepared for independent reviewer. Pages updated (commit 21e0ac5) and verified 200 incl. new wire variant. END OF RUN 1 DISPATCH (A+B). Elapsed since 15:24: 21 min.
- 15:46 Iteration 3: wire-nest composition/rod study (closer cam, 1,600 thick rods) + Chladni before frame. Findings: scramble angle must avoid axis permutations; cat preset reads as rabbit.
- 15:47 Pushed 88656f7, Pages verified 200 with latest code. Run-1 dispatch complete; awaiting independent review. Elapsed: 23 min.
- 15:52 Independent REVIEW-01 received. Verdict: GO Shadow Foundry (brass-rod). Scores: wire 10/24, solid 9, Chladni 12, Lumen 5. Kill criterion T1–T3 after look-dev spike. Starting Phase C.
- 16:08 Phase C spike: new V1 codebase in v1/ (figures.js procedural silhouettes, forge.js = wall masks → SDF → perspective visual hull from 3 lamps → brass rods with coverage repair; fitFigures() similarity-transform search; repairTight() boundary-hugging consistency repair; custom wall shader with ISOLATED per-wall lamp lighting, 16-tap Poisson PCF, plaster fBm relief, corner AO; half-res volumetric haze using the spot shadow maps; HDR MSAA RT + ACES composite + per-pixel IGN grain; visible lamp fixtures + stands; pin + plinth; camera on (1,0.8,1) diagonal).
  Figures redesigned (cat: short wide ears + curled tail; tree: rooted trunk + clustered canopy; swallow from above). Floor frame switched to axis-aligned after diagnosing 45° frame mismatch (debug sheets shots/debug-masks-1..5.png).
  Hull fidelity 98.5/98.7/96.6 %, rod coverage 96.6/93.5/93.7 % (1,046 rods). T3 measured by script on shots/spike-2b.png: back 4.88:1, left 5.04:1, floor 8.99:1 → PASS (linear luminance).
  Failed/learned: first spike (shots/spike-1.png) had 66–78 % rod coverage and stray fragments from island-producing repair → replaced. Bottleneck: shadows still read grey (haze over pools), tree squeezed narrow by fit (0.57), nest small in frame, one cat ear tip lost.

## 2026-10-08 16:29 TPE — V1 build (elapsed 65 min)
- Fonts: TC subset fixed (TTC index 3 = Noto Serif CJK TC, verified via name table); mkfonts.sh collects CJK chars from js/html.
- **Incident:** while cutting the spike section I truncated main.js's render tail (post pipeline/state/render) and the work folder had no git → rebuilt it from shaders.js uniforms (~10 min lost). Fix: local git repo initialised in the work folder; committing every step now.
- **Incident:** /tmp is shared with other agents (a /tmp/sheet2.png collision). All scratch now goes to /workspace/_tmp/v3tools/tmp/.
- V1 main.js features: intro timeline (lamps clunk on at 0.35/0.75/1.15 s with flicker, oblique-axis tumble → single geodesic into alignment, LOCK at 4.0 s: staggered 60 ms penumbra collapse, darkness 0.80→0.975, lamp flash, 3 % push-in, dust freeze, labels at +0.6 s), unlock at 7.2 s → drift to scramble, free turntable (yaw/tilt ±0.7, inertia, magnetic basin 0.17→0.37 rad after 20 s, lock <0.012 rad), museum labels in pools (canvas textures), HTML placard, mute glyph, draw-your-own (raycast walls → MR canvas, charcoal overlay in the wall shader, flood-fill auto-close, fit+repair+forge, staggered rod fly-in with tick sounds), Next sculpture (preset 2), procedural audio (audio.js: clunk+hum, friction noise, beating detune → unison, lock chord, forge ticks, whoosh, room tone).
- **Discovery:** yaw-only scrambles near π/2 multiples reveal figures (prism extrusion), e.g. yaw≈π shows a mirrored cat; also the unwrapped yaw 5.41 made the drift sweep through 90/180/270°. Intro now tumbles about an oblique axis; free scramble picked visually from a 12-pose mask contact sheet: yaw −0.6, tilt +0.65 (three blobs).
- Guidance made steep near the solution (r = 1.3 + 30(1−e^(−ang/0.16)), darkness 0.80→0.50), and the approach uses (1−u)^1.35 so the shadows are still visibly soft ~0.4 s before lock (the first filmstrip showed no visible change).
- Drawing test (heart/star/A): 996 rods, hull fidelity 95.4/97.0/96.7 %, rod coverage 93.3/95.1/94.1 %, 2.3 s CPU in SwiftShader Chrome (T9's ≤1 s target is not met here; desktop CPU will likely be ~2× faster).
- Preset 1: 1046 rods, hull 98.5/98.8/96.8 %, rod coverage 96.6/93.6/93.9 %.
- Next: verify the reshoot batch, build the before/after sheet, deploy to 20261008-shadow-foundry.

## 2026-10-08 16:44 TPE — V1 deployed (elapsed 80 min; run was cut ~16:40, resumed 16:43)
- Labels moved OUT of the pools onto dark wall/floor as off-white lettering (in-pool dark text was tiny/illegible and fought the shadows).
- **Failure found:** the 96 px mask contact sheet called (−0.6, +0.65) "three blobs" but the full render still showed a pale cat with ears and tail on the back wall. The coarse masks hide the details people read. The scramble is now chosen from real renders: (−0.9, +0.45), verified in shots/v1-scrambled.png.
- Deploy: showroom git mv 20261008-overnight-v3 → 20261008-shadow-foundry. V1 sits at the folder root. prototypes/ are kept (vendor moved to the folder root, prototype importmaps → ../../vendor/, old test index → prototypes/index.html). README.md is added. The root README row and index card were appended. 20261007-orbital-forge is untouched (empty diff).
  Commits 3823875 and ce18a2e were pushed normally. Pages returns 200 for /, prototypes/, js/main.js (latest code verified via grep) and shots/. orbital-forge still returns 200.
- Live headless (SwiftShader, fresh session, default and ?shot=1&t=6): 0 console errors, 0 page errors.
- Metrics:
  - T3 8.27/8.03/19.39:1 PASS.
  - Preset rod coverage 96.6/93.6/93.9 % (T4 FAIL; hull 98.5/98.8/96.8).
  - Scramble maxIoU 0.53/0.55/0.37 (T6 strict FAIL; visually non-revealing).
  - Naive solver 2.25 s simulated (T7 PASS); auto-lock at 4.0 s.
  - Drawing re-forge 2.3–2.4 s CPU, coverage 93.3–95.1 % (T9 partial).
- Evidence: shots/v1-opening-3s, v1-scrambled, v1-mid-approach, v1-solved-hero, v1-lock-1..8 + v1-lock-filmstrip, v1-draw-mode, v1-drawing-flyin, v1-drawing-rebuild, v1-before-after, v1-t1t2-crops, v1-thumb-320, v1-live-hero.
- Bottleneck: rod coverage / shadow-edge quality (93–96 %, ragged speckled edges). It drives T4, T9 and the perceived finish. Next action: wait for independent review #2; then do coverage repair to ≥97 % with edge-hugging thin rods, then Phase D escalation.

## 2026-10-08 17:43 TPE — Pass 1 visual escalation (elapsed 139 min; runs cut ~17:10 and ~17:40)
Commits (local): 16:51 a526123 forge rework → 17:06 d7d690b room/worker/bake → 17:10 66cc392 preset 2 ≥98 % → 17:11 b12785a rebake → 17:14 a9b8829 exposure → 17:19 b58c7e2 worker timings → 17:21 96dd67a T3 → 17:25 edf1f69 smoothed SDF → 17:32 3d416ad scramble → 17:37 ef41ce0 proof shots. Showroom deploy **5703498** pushed 17:38.
- **Coverage (T4).**
  - Root causes found:
    - (a) The dilated 150³ voxel coverage metric hid real hull losses. It is replaced by an exact per-pixel ray test (`rayCoverage`), which also drives `repairTight` (disc stamping at the cheapest ray point).
    - (b) Edge rods were degenerate dots because the own-wall margin was too tight.
    - (c) A half-pixel SDF sampling offset made the edge rods miss; fixed in `sample()`, misses 0.
  - Added: interior hole-fill rods and thin tangent edge rods.
  - Figure/fit work: switched to a front-facing cat (raw hull 98.2 %), trimmed extremities, constrained offline refits. Relaxed edge-rod clearance (EDGE_R·0.28). Smoothed SDF level sets (2× [1,2,1]), which removed the rod "whiskers" on edges.
  - Result (rod raster, single source = forgeRods):
    - No. 1 cat/tree/swallow: 98.67/99.74/98.18 % (V1 96.6/93.6/93.9).
    - No. 2 hand/key/butterfly: 98.74/98.14/98.20 %. The fish (67 %) was never fitted, so it is replaced by a fitted butterfly.
- **Precomputed sculptures.** `data/preset-1/2.json` are baked by `window.__bake` and load instantly (console line "(baked)").
- **Drawing forge (T9).**
  - Moved to a module Web Worker; the long-rod batch is posted first, so the fly-in starts before the final result.
  - Heart/star/A coverage: 97.4/96.7/95.6 %.
  - Headless SwiftShader timing: first rods 3.1–3.3 s, done 3.7–3.9 s. Stages: warm 0.44, fit 1.34, repair 1.37, rods 0.23 s.
  - Main thread is never blocked (V1 blocked it for 2.3 s). Wall-clock is still slower than the ≤1 s target.
- **Room / look.**
  - Room: ceiling track with all 3 lamps on drop rods in frame (floor stands removed); a ceiling wire (castShadow) replaces pin + plinth, so the swallow is unobstructed.
  - Floor and walls: polished dark floor with half-res planar reflection + Fresnel; bounce-lit plaster with no self-bounce on coplanar pools.
  - Lamps: procedural lens cookie (ring, chromatic fringe). LAMP_GAIN per lamp; tree lamp cooler.
  - Air: haze 0.045 (was 0.016 in V1); 900 dust motes lit only inside the cones.
  - Pool-centre linear luminance is cat 0.552, tree 0.559, swallow 0.541 (V1 0.80–0.90).
  - T3: No. 1 6.08/8.43/8.36:1, No. 2 6.22/5.48/7.41:1, PASS.
- **Failures / learned.**
  - A reflection-pass framebuffer feedback loop (GL warnings): fixed by unbinding reflTex during the pass.
  - haze 0.09 washed the shadows (4.7:1): backed off.
  - A shorter cat tail dropped the swallow to 96.6 % (the tail supports the swallow tail in the hull): reverted.
  - 3072² shadow maps made no visible difference (the edge stair came from the mask staircase): reverted to 2048.
  - The scramble (−0.9,+0.45) showed a front-cat silhouette on the TREE wall (the front-cat hull is nearly an extrusion). The new scramble (−0.698,+0.62) was picked from real 4-up renders; max IoU 0.55/0.57/0.54; naive solve 2.25 s.
- **Proof.** shots/v1b-* (do not touch v1-*). Contents:
  - before-after;
  - edge-crops-100;
  - shadow-crops-nolabel;
  - thumb-320;
  - solved-hero, preset2-hero;
  - scrambled (+preset2), opening-3s, mid-approach;
  - lock-1..8 + lock-filmstrip;
  - drawing-flyin, drawing-rebuild;
  - table in shots/v1b-pass1-proof.md.
- **Bottleneck.**
  - From the main camera the No. 1 object still shows a small hook (the cat tail) at its base. It reads as an abstract brass cluster, not a cat, but the hook is a hint.
  - Dark plaster is 0.007 (target 0.015–0.03).
  - Worker forge wall-clock is ~3.8 s headless.
  - Next: live verification, then report; Pass 2 waits for the dispatch.

## 2026-10-08 17:54 TPE — Pass 1 live-verified (elapsed 150 min)
- Deploy 5703498 is live. Pages 200 for: /, data/preset-1/2.json, js/forge-worker.js, js/main.js (new scramble value grep-verified), fonts, shots/v1b-before-after.png, prototypes/. 20261007-orbital-forge still returns 200, and the commit doesn't touch it.
- Fresh headless sessions against the live URL:
  - ?shot=1&t=6: 0 errors; "(baked)" line, 98.7/99.7/98.2.
  - Worker forge: 0 errors; 97.4/96.7/95.6 %, first rods 3.29 s, done 3.85 s.
  - Default mode, 2 sessions × 36 s with streamed console/pageerror/crash/requestfailed: 0 errors, 0 crashes, 0 failed requests.
  - Evidence: shots/v1b-live-hero, v1b-live-default, v1b-live-forge.
- **Harness note.** Default (non-shot) mode never sets `__ready` (same in V1). The earlier "Target closed" was shell `timeout` killing Chrome during the 180 s wait, not an app crash. probe.js streams logs instead.
- **Perf, SwiftShader 1920×1080, gl-finished frame.** V1 2.4 s → Pass 1 3.1 s (+30 %: reflection pass + 64-step haze + heavier wall shader). Not measurable on a real GPU here. If Pass 2 needs headroom: half-res reflection only every other frame, or haze 48 steps.
- Pass 1 checklist:
  - room with ceiling track and all 3 lamps in frame ✓;
  - beams with rod-sliced streaks + dust ✓ (subtle; haze capped at 0.045 to keep T3 ≥6:1);
  - ceiling wire ✓;
  - sculpture 2 fixed (butterfly 98.2 %) ✓;
  - ≥98 % every preset figure ✓;
  - exposure/pool colours ✓;
  - object silhouette: No. 1 reads as a brass cluster with a small hook (the cat tail; shortening it costs swallow coverage), No. 2 as a spiky bouquet. Decoy interior rods were not added because they cannot change the outline.
- Remaining bottleneck: dark plaster is 0.007 (target 0.015–0.03); the hook on object No. 1; worker forge ~3.8 s headless wall-clock; beam slicing is subtle.

## 2026-10-08 18:09 TPE — Pass 2 item 1+2: The Forge (implosion) + shatter → re-forge (elapsed 165 min; times from git log)
- 17:57 first version (fly-in → swarm around final positions → 0.3 s snap). Strip fs-a: worked, but the swarm was centred on the final layout (faint mass at 4.2 s). Then review #3 arrived and asked for an implosion.
- 18:03 **Implosion** (commit "Forge as IMPLOSION"):
  - Timeline:
    - lamps clunk on at 0.30/0.62/0.94 s onto empty walls;
    - rods fly from the dark in 3 waves (1.2–3.7 s) into a storm cloud that is independent of the final layout (uniform in a sphere of radius 1.9 × r90(hull), orbiting the wire axis, random spin);
    - 4.2 s ±80 ms: ease-in (u³) collapse, rotating to the final orientation in the last 40 %;
    - all landed by 4.90 s; lock at 4.95 s: hit (sub thump + struck-brass partials + noise burst) + chord, iris snap, 3 % push-in, labels.
  - The camera starts 7 % wider and drifts in. Shadows stay at darkness 0.975 throughout.
  - Skip: click or Esc during the storm jumps to 4.80 s (the implosion finishes, lock follows).
  - All of it is a pure function of intro time, so shot mode can render any frame.
- Acceptance (shots/p2-opening-crops-nolabel.png): context-free pool crops at 1/2/3/4 s show only empty pools or hatching; at 5.5 s, cat / tree / swallow. 4.8 s shows converging scribbles (unnameable).
- Proof: shots/p2-opening-filmstrip.png (12 frames, 0.3–6.0 s) plus p2-opening-01..12, p2-thumb-320.png (t=6) and p2-thumb-320-storm.png (t=3.5).
- **Shatter → re-forge.** Trigger: click the sculpture (click < 5 px, < 350 ms, raycast on rods) or "Next sculpture".
  - Old rods burst out into the cloud with a gravity sag and shrink away over 1.05 s while the next baked preset loads.
  - The new work's rods take over the cloud and implode (same pose code, clock starting at 3.3 s).
  - Then a hit sound, and the lock + labels in forged mode.
  - About 2.7 s click → figures. Strip: shots/p2-shatter-strip.png (+0.4/1.4/2.4/3.2 s).
- **Scramble fix (review #3 a).** A 22-pose contact sheet showed the front-cat hull projects ears + a tail curl from nearly every orientation, so no rotation fixes it.
  - Instead, misalignment now loosens the sculpture: rods drift up to 55 % of the way into the storm cloud, scaled by the pose angle relative to the scramble angle.
  - The puzzle starts half-rebuilt and shows hatched blobs only, with no tail and no crucifix (shots/p2-scrambled.png, p2-scrambled-preset2.png). Approaching the solution visibly pulls the rods together (p2-mid-approach.png).
- (b) The wire casts no shadow (a 0.3 mm wire would vanish in the penumbra). (c) Forge-test labels use real titles (心 Heart / 星 Star / 字 A), with no raw ids.
- Failure/learned: shot.js default-mode waits are 180 s; filmstrips are now rendered 3 in parallel (~2 min per 12 frames).
- Bottleneck / next: type-three-letters + #w= share link (next dispatch). The real-GPU frame rate is still unmeasured; scatterPose updates ~1.5 k matrices per frame while unlocked.

## 2026-10-08 18:16 TPE — Pass 2 deployed + live-verified (elapsed 172 min)
- Showroom commit **8932170** (18:11, normal push; orbital-forge untouched). Pages returns 200 for /, js/main.js (shatterTo grep-verified), audio.js, forge-worker.js, preset-1/2.json, fonts, shots/p2-opening-filmstrip.png. orbital-forge returns 200.
- Fresh headless sessions on the live URL, all with 0 errors / 0 failed requests:
  - ?shot=1&t=3.0 (storm);
  - ?shot=1&t=6 (three figures + labels);
  - ?shot=1&shatter=3.2 (No. 2 imploded in);
  - default mode, 36 s streamed probe (0 crashes).
- Local: the forge test placard reads "No. 3 — Heart, Star, A" with label "字 A". The font subset was rebuilt (15 TC glyphs).
- Next: type-three-letters + #w= share link (awaiting dispatch).

## 18:56 Pass 2b deployed: hero push-in, type-3-letters, #w= share links, No. 3 GEB (elapsed 212 min)
- **Hero push-in:** HERO 0.33, look offset −1.35 y. After the lock, the pools span about 58 % of the frame width (shots/p2-hero-push.png), easing out on drag. hp 0.4 reached 64 % but cut off the floor pool and labels.
- **Type 3 letters:**
  - prompt + 3 slot canvases with heavy blocky procedural A–Z; Enter, or 1.1 s after the 3rd letter;
  - shatter → storm (hides the worker forge) → implode into the word;
  - the worker tries all 6 wall assignments (quick-fit) and keeps the best;
  - placard: worst-wall rod coverage + "forged for you"; the URL becomes #w=WORD; Copy share link (clipboard only).
- **#w=ABC on load:** the Forge opening holds in the empty storm ('forging your sculpture…') until the worker is done, then implodes into the word. Preset words (GEB) load baked.
- **No. 3 GEB** baked: 99.6 / 99.5 / 99.9 % (1,357 rods).
- **Bug found by the live default-mode probe:** the worker never finished while the scene rendered. ImageBitmaps from main-thread canvases were GPU-backed, so every drawImage in the fit needed a GPU readback queued behind WebGL frames. Fix: copy each bitmap into a CPU OffscreenCanvas once. Default-mode forges now take ~4 s while rendering; drawing forges benefit too.
- **Also fixed:** typing during the intro afterglow was dropped (shatterTo refused intro mode).
- **Word table (21 typed words, CPU raster):** 15 ≥95 %, 20 ≥90 %; WMW 95.2, IXI 98.8, QOS 99.1; worst LOV 83.8; median 3.5 s (shots/p2-word-table.md).
- **Deploys:** showroom 8c4b9ca, then d71df2f (worker fix).
- **Live, fresh sessions, 0 errors:**
  - shot #w=KEY (YEK 94.6+) and #w=GEB (baked);
  - default #w=WMW (forged in 4.8 s);
  - a default-mode typing flow: Esc → C A T → Enter → shatter → reforge → forged, URL #w=CAT.
- **Draggable lamps:** not started (time).

## 19:10 Draggable lamps + compact UI deployed (elapsed 226 min)
- **Lamps:**
  - hover a lamp head → grab cursor + faint lamp-coloured glow on the housing and brass lip (one-time hint "Drag a lamp along its track");
  - drag slides it along its ceiling track (new cross tracks for the wall lamps; the overhead lamp takes either crossing track); it stays aimed at the sculpture;
  - per frame: SpotLight position, shadow-camera near/far, wall / haze / mote uniforms, pool centre for the bounce. No re-forge;
  - the pool slides and the shadow reprojects live (cat shears, tree stretches, swallow smears);
  - release: underdamped spring home (60 fps sim: clunk at 0.25 s, 32 % overshoot, settled 2.5 s);
  - the hero push eases out while dragging; the sculpture doesn't rotate during a lamp drag.
- **Asymmetric track travel** (−2.6 … +0.3, rubber-band ends): at home each pool already nearly touches its room corner, and sliding toward the corner cut the pool off at the isolated-lit corner (seen in the first test).
- **Compact UI below 1440×900** (smaller type, tighter margins; zh button suffix hidden under 1100 px); the hero push is aspect-aware so labels stay in frame at 16:10. Checked at 1024×640, 1280×800 and 1920×1080 (unchanged).
- **Proofs:** shots/p2-lamp-drag-before-after.png (+ before / after-cat / tree / floor), p2-lamp-hover.png, p2-lamp-live-drag-1280.png (live, mid-drag), p2-ui-1280x800 / 1920x1080 / 1024x640.
- **Showroom 4afe8e1:** all 200. Live fresh sessions, 0 errors: shot with lamp 0 displaced; default-mode 1280×800 hover → drag → release → homing.

## 19:24 Pass 3 must-dos deployed (elapsed 240 min)
- **Lamps / layout:** already complete before the cut (4afe8e1, logged 19:10); nothing remained.
- **Review #4** read (20/24 on d71df2f).
- **1. Placard:** shows "No. N — · · ·" until LOCK_T+0.6 (in sync with the wall labels), and during shatter / reforge / #w= waiting. Live: #w=WMW reads "" then "No. 4 — · · ·", never "W, W, M" before the lock.
- **2. Typed order:** left wall (1) = letter 1, right wall (0) = letter 2, floor = letter 3.
  - The floor letter is turned 315° (verified with C/F: reads upright from the hero camera).
  - The worker quick-fits all 6 orders but uses another only if the worst-wall gain > 3 pts; the placard then adds "(letters rearranged for a cleaner cast)".
  - The placard prints the word ("No. 3 — G E B").
- **Cost of 2 + 3, measured honestly:** the upright floor letter's 45° strokes fight the walls' axis-aligned strokes.
  - 12-word sample, worst wall 80–97 %: QOS 96, DOG 95.1, TPE 92.5, BOX 93, YES 90.5, CAT 89.7 (swapped to C-T-A), KEY 86.7, WMW 84.2, LOV 80.1, IXI 80.6.
  - Forced in-order CAT: 69 % on the A (p3-word-cat-forced-inorder.png, ?inorder test flag).
  - GEB re-baked in reading order with an upright B: 95.6 / 95.8 / 96.6.
- **3. Letters:** 80 % scale (WORD_SCALE) with the fit capped at sx/sy ≤ 1.0. Spur trim not done.
- **4. Tree label** moved to [0.004, 4.6, 5.75]: clear of the drop rod at 1280 and 1920. 1280×800 layout OK (p3-1280x800.png).
- **5. Hash:** non-word works clear the hash (live: #stale → ""); a hashchange listener forges a pasted #w= link (live: #w=GEB → shatter).
- **6. Prompt:** "Type any 3 letters to forge them in brass", 18 px, above the action links. Slots only while typing, hidden immediately on submit.
- **7. Hero:** push-in ramp LOCK_T+0.1…+1.05, UNLOCK_T 8.6 → 10.2 (hold ~5 s). Pool span at the 42 % row, linear L > 0.15: 62 % at t=6 and t=8 (reviewer measured 47 %); 60 % at 1280×800.
- **Showroom:** ac6dada (+ README follow-up). Live: all 200, 0 errors (shot t=6, #w=GEB, #w=CAT 1280, default-mode WMW / stale-hash / hashchange).

## 19:38 Pass 3 "Next" items done (19:25 dispatch)
- Floor letter: the worker now does a quick screen of the 11 alternatives, then fully fits A = (typed order, upright floor) against B = the best alternative. B wins only on a worst-wall gain of > 6 (45° floor) or > 3 (reorder). Word table (22 words): ≥90 % 19/22, ≥95 % 7/22, typed order 12/22, upright 10/22; LOV 75.7 % is the weakest. GEB kept as baked (95.6/95.8/96.6).
- Spur trim (forge.js trimSpurs): rods outside a 2.5 px band on any wall are clipped to their longest inside run or dropped; up to ~230 rods per word, 0–4.4 points.
- Brass: emissive key + fresnel rim in the rod shader (sculpture only); 3 gauges already present. Cat-tail hook kept: those rods cast the tail.
- Venn broken: soft ellipse (cat), hard barn-door pool (tree), larger floor; aims offset; floor label moved to [6.0,0,0.6] beside the larger pool (checked at t=7 and pushed-in GEB).
- Plaster outside pools 0.0071 → 0.0173 linear (left), 0.0070 → 0.0172 (right).
- Governor: EMA frame time, >20 ms for 2 s → haze 48→40→32, DPR→0.8, shadow 2048→1024. Verified on SwiftShader: steps to q3, renders fine. ?debug=1 overlay. Bug found: long frames (>250 ms) were skipped, so it never fired on slow GPUs. Now they are capped at 200 ms.
- Audio: start() only inside navigator.userActivation; all node creation gated on ctx running → 0 warnings in a default Esc+type+click session.
- Proof: shots/p3n-before-after.png (same frame t=7, ?rim=0&venn=0&pl=0 vs default), shots/p3n-brass-crop.png, shots/p3n-governor-cat.png.

## 19:49 fixes found in live verification
- Typed letters were silently dropped while the opening was still running (slow loads), so a word typed then never forged. Letters are now buffered at any time except in draw mode, and submit waits until a shatter is allowed. The #w= hashchange retry no longer starts a worker forge on every 500 ms attempt.
- Labels whose projected screen box hits the placard or the action links (or the bottom edge) fade out, which matters on small windows and with the pushed-in camera.
- Verified locally at 1280×800 with Esc at 3 s and typing at 9 s: the word forges, 0 errors / 0 warnings (shots/p3n-typed-early-1280.png).
- 19:52 Live verification on showroom 1525152: all files 200; shot t=7 has 0 errors/warnings; default session at 1280×800 (Esc + early CAT + click, ?debug=1) has 0 errors / 0 warnings, the word was accepted and is reforging, and the governor stepped to q2 on SwiftShader.

## 20:11 19:53 dispatch + Review #5 items (in progress)
- Tree pool: barn door dropped (it read as a glitch). The tree pool is now a smaller hard-edged circle (ang 0.95): cat = soft ellipse, tree = small hard circle, floor = large.
- Dead ends: one shared worker job queue, so a word typed during a drawn forge can't steal its messages. Next / Draw pressed mid-shatter are queued (one slot). Esc while a #w= word forges skips as soon as it arrives. A pasted #w= is queued until a forge is allowed (draw mode: waits until Back, dropped if you forge your own). The copy link falls back to a selected field + "Press Ctrl+C"; the button says "Copied ✓". The Forge button says how many walls still need a drawing. A hidden tab suspends audio.
- Audio: master limiter (DynamicsCompressor −4 dB, 20:1, 2 ms) and mute remembered in localStorage. Mix measured offline (OfflineAudioContext, peak/RMS dBFS), before → after: clunk −7.6/−31.4 → −13.3/−35.5, storm −31.3/−52.2 → −17.6/−38.0, hit −5.9/−24.0 → −7.7/−24.0, chord −14.0/−29.2 → −16.8/−31.2; opening sum peak −4.4 dBFS.
- Storm streaks: the haze gets a streak uniform during the storm (cleaner dust, ×2.4 density); no extra samples, off at q ≥ 1 and with ?nostreak.
- Review #5: the governor now floors at q2 (haze 40, DPR 0.8) and never changes shadow maps. It triggers at > 28 ms for 2 s and steps up after 5 s < 14 ms. The ?debug fps comes from the raw frame time. The placard shows "cast as C·T·A" for reordered words.
- 20:27 Placard cast order fixed to reading order (left·right·floor): 'CAT · forged for you · cast as C·T·A'. The redundant 'letters rearranged' note is dropped; the floor-turn note stays. Deployed 3b7b553 + this fix.
- 20:32 Bug found by the dead-end harness: Enter after typing, with a button still focused (e.g. Next), also clicked that button, so Next was queued ahead of the word. Enter now suppresses the default when letters are in the slots. Verified: Next → type DOG mid-shatter → Enter → No. 2 settles, then DOG forges ("cast as G·D·O").
- Dead-end harness (v3tools/deadends.js, fresh pages, local): esc-during-hash-forge ok, empty-draw ok ("Draw on all three lit walls"), copy-denied-forced ok (field selected, "Press Ctrl+C" → "Copied ✓"), next-after-word ok (No. 2, hash cleared), resize-mid-forge ok, three-shatters ok (rapid ×3 → No. 2, No. 3 queued, third dropped), paste-in-draw ok (SKY waits, forges after Back), tab-hidden ok (audio suspended/resumed, clock paused), type-during-shatter ok after the fix. All 0 errors / 0 warnings.
- 20:34 Live verification on showroom fbae884: all files 200. Shots t=7 and #w=CAT (placard 'CAT · forged for you · cast as C·T·A'): 0 errors/warnings. Default 1280×800 ?debug=1 flow (Esc + early CAT + click): 0 errors / 0 warnings; the overlay shows the real 0.5 fps; governor at q1 with shadow 2048.

## 20:48 "Be the lamp" (20:35 dispatch, timebox 21:40)
- Double-click a lamp head or press 1/2/3 (left/right/floor). The camera flies 1.2 s (smootherstep; position lerp + quaternion slerp + FOV 31→40) into the lamp and looks at the sculpture centre. The floor lamp uses up = (−1,0,−1) so its figure reads upright. That lamp's fixture is hidden; haze ×0.35 and motes ×0.3 in lamp view. In free/forged mode the pose eases to solved, and the magnetic snap then locks it. Esc or a click flies back; dragging and lamp hover are off; typing works (forge from the lamp view); entering Draw exits. Caption "You are the lamp — Esc to step back". Shot hooks ?lv=i&lvk=0..1.
- Verified (lvflow.js, default mode): key 2 → lamp view; typed SUN in lamp view → shatter → forged, still in lamp view; Esc → back; dblclick on the lamp head → in; click → back; 3/3 toggles; Draw from lamp view → draw mode, camera back. 0 errors / 0 warnings. Shots: p3l-lamp-strip.png (main → mid-flight → lamp view, cat), p3l-lamp-geb.png (E in brass), p3l-lamp-views-check.png (t=7 regression + left + floor lamp).
- Docs: deploy/README.md rewritten bilingual (zh-Hant + English: interaction, share links, tech, limitations). Showroom root README row + index card updated, new thumb.jpg. FINAL_REPORT.md drafted.

## 21:09 Final QA on showroom e77ea33 (live, fresh sessions, SwiftShader)
- Asset sweep: 156/156 files under 20261008-shadow-foundry → 200. Root, README, thumb, prototypes/ and 20261007-orbital-forge/ → 200; the root card shows the new text.
- Dead-end harness (live): esc-during-hash-forge, empty-draw, copy-denied-forced, next-after-word, resize-mid-forge, three-shatters, paste-in-draw, type-during-shatter, tab-hidden → all ok, 0 errors / 0 warnings. Two first attempts timed out under 7-browser CPU contention and passed on rerun.
- Lamp view flow (live): key 2, typing in lamp view, Esc, dblclick, click, 3/3, Draw → all ok, 0/0.
- Hard refresh (cache disabled) + #w=GEB fresh session + reload: 0 errors, 0 warnings, 0 failed requests; the hash stays correct.
- Shots t=7 and lamp-view GEB: 0 console problems. Default 1280×800 ?debug=1 flow: 0/0, overlay 0.6 fps (real), q1, shadow 2048.
- FINAL_REPORT.md finalised (end 21:09 TPE, elapsed 5 h 45 min).

## 21:29 Review #6 (23/24) fixes, group 1
- "Be the lamp · 1 2 3" action link (enters the cat lamp; toggles). Idle hint now ends "· press 1 2 3 to be a lamp".
- Lamp caption on a dark pill (readable on the floor-lamp view).
- shatterTo() calls exitLamp(), so a forge / Next / sculpture click leaves lamp view before the storm.
- Sound cue: "click anywhere for sound" under the speaker, which pulses until the AudioContext runs; hidden when muted and in shot mode. Opening timing unchanged.
- Governor step-up threshold 14 → 18 ms (60 Hz displays can recover).
- Checks: 1280×800 layout with the 4th link OK; cue present before the gesture, gone after the first click (ctx running), 0/0; floor-lamp caption legible (shots/p3r-group1-checks.png).

## 21:37 Review #6 fixes, group 2: idle re-lock
- After 20 s without input (pointer, key, wheel) in free/forged mode, not in lamp view and not locked, yaw/tilt ease (τ 1.1 s) toward the solved pose. The existing magnetic snap then locks with its chord, so a passive visitor ends on the three pictures. Any input resets the timer. ?idle=N for tests.
- Verified (idleflow.js, default mode, ?idle=4): passive scrambled (−0.70, 0.62) → locked at sim t 19.2; a drag unlocks; mouse movement keeps it unlocked; re-locks after input stops. 0 errors / 0 warnings.

## 22:14 Final live QA after the REVIEW-06 fixes (showroom c4b0810)
- Asset sweep: 227/227 files under 20261008-shadow-foundry → 200 (README.md, FINAL_REPORT.md, shots/thumb.jpg included); root + 20261007-orbital-forge → 200.
- deadends.js live, 2 groups: 10/10 ok, 0 errors / 0 warnings.
- refresh.js live: hard refresh → intro, hash ""; #w=GEB → "No. 3 — GEB", reload keeps the hash and replays; 0 errors, 0 warnings, 0 failed requests.
- cueshot.js live (1280×800): sound cue on before the gesture; after a click it clears, ctx running; 0/0.
- Live console: preset 1 (baked) 98.7/99.7/98.2 (placard 98.2 %); baked preset 2 98.7/98.1/98.2.
- lvflow.js live: key 2 → lamp; typing SUN in lamp view → shatter exits lamp view → forged; Esc; double-click a lamp head → lamp; key 3 in/out; the "Be the lamp" link in/out; Draw from lamp view → draw, k 0; 0/0. The centre-click-exit step hit #wprompt: at the harness's 480×300 viewport, the 4-link action stack plus the Copy row reaches the vertical centre. At 1280×800 the stack starts at ~y 660, so no change was made (the click exit itself was re-verified locally on the canvas).
- Shots: shots/p3r-live-1280-t7-final.png, shots/p3r-live-1280-floorlamp-caption.png (caption pill legible).
- Docs: FINAL_REPORT.md + README corrected per the REVIEW-06 fact-check (Phase A/B, Final 23/24 noted as pre-fix, lock ~5 s, live coverage, typed-order wording, governor < 18 ms, 1280×800, REVIEW-01..06, final times/commits).

## 22:20 Docs deploy (finished by hand after the builder run was cut ~22:15)
- FINAL_REPORT.md end time set to 22:20 TPE (elapsed 6 h 56 min); README and FINAL_REPORT copied into the showroom folder and pushed as a docs-only commit.
