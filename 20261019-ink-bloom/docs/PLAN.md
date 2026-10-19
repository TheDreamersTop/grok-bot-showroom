# PLAN — Round 5 (gk-overnight-challenge-005)

Objective: a desktop WebGL piece that makes experts, adults and kids stop and stare; final ≥ 20/24 on benchmark v5
(RESEARCH.md) by independent review, with #8 originality and #9 kids test = 2.

## Phase B — candidate concepts (≥5)

### C1 墨華 Ink Bloom — the Thomson vortex-ring cascade
- **Concept:** a tall, backlit glass tank of still water on a pale studio sweep. Click to release a drop of ink.
  The drop rolls into a vortex ring, sinks, swells, breaks into N lobes; each lobe becomes a smaller ring and sinks,
  again and again — an ink chandelier / jellyfish / dandelion grows downward through the tank, joined by fine threads.
- **Hero moment:** one click → over ~8 s a single dot becomes a 3-generation ink flower filling the tank, colour
  subtractively mixing where two blooms interpenetrate (cyan + magenta → deep violet).
- **Visual identity:** Keever/Seveso tank photography: bright warm-white backlight, Beer–Lambert absorbed colour,
  glass walls with refraction edges, meniscus line, no glow, no black.
- **Core interaction:** click = drop (height/position); hold = bigger drop (more lobes); drag = slow stir that
  shears/tilts the rings; choose ink (sumi black-blue, indigo, cinnabar, gamboge); scrub/slow time.
- **Technical challenge:** GPU vortex-filament (regularised Biot–Savart) + 100k–500k tracer particles; ring
  instability → bifurcation rule; volumetric absorption render; tracers are real advection so threads are emergent.
- **Emotional impact:** hypnotic, calm, "is this a photograph?"; children: "it turned into a jellyfish/flower".
- **Expansion:** stratified water (salt layer: rings stop & spread like clouds), temperature, a pebble obstacle,
  capture/print the bloom; physics-accurate time slider.
- **Risks:** bifurcation must look right (not mechanical); perf of tracers in SwiftShader; ink-in-water web toys exist
  (2D stir sims, glow-on-black) — differentiation must be visible in frame 1 (bright tank, 3D cascade).

### C2 機巧 The Draughtsman — a machine learns your drawing
- **Concept:** you sketch on a card; a brass automaton's cam stack is cut to encode it (x, y, pen-lift), then the
  mechanism turns and a mechanical hand redraws your drawing in ink.
- **Hero:** the cams you just "cut" spin, followers rise and fall, the pen traces your sketch line by line.
- **Identity:** Jaquet-Droz brass + walnut + paper, engraving-style render.
- **Interaction:** draw, crank speed (drag), open the case, reverse time.
- **Tech:** Fourier/arc-length resampling → cam radius functions, linkage IK, mechanism solver.
- **Emotion:** charm ("the robot copied me").  **Risks:** final frame = the user's wobbly sketch (weak picture);
  brass PBR + many parts from scratch = time sink; cam calculators exist.

### C3 翻牌 Field Flip — the domino wave that reveals a picture
- **Concept:** a huge ivory domino field; one push sends a front through it; as dominoes fall their painted faces
  assemble a hidden picture (or your drawing) in a sweeping wave.
- **Hero:** the travelling front converting ivory → picture.  **Identity:** tilt-shift macro, warm wood floor.
- **Interaction:** paint the hidden image, place push points, multiple fronts collide.
- **Tech:** 10k+ instanced dominoes, front-propagation dynamics.  **Risks:** domino sandboxes exist (Topple, Rapier
  100k demos); "toy" look; the picture is low-res.

### C4 紙劇 Pop-up Theatre — cut a folded card, open it to a 3D pop-up
- Cuts on a folded sheet become parallel-fold pop-up architecture when the card opens 0→90°.
- **Risks:** pop-up generators exist (Atomm, ZumaTools); light-on-paper risks being judged "shadow" again.

### C5 鐘 Your Bell — draw a profile, cast it in bronze, hear its modes
- Axisymmetric shell modal analysis → you hear your own drawing; Chladni-like mode visualisation on the bronze.
- **Risks:** visual hero weak (a bell is a bell); Chladni covered in round 3.

### C6 (rejected) 吹玻璃 Glassblowing — PARISON/Kiln Breath already do it. 
### C7 (rejected) 金繼 Kintsugi — full game + prompt template exist.

Ranking for prototypes (impact × originality × legibility × feasibility): **C1, C2, C3**.

## Phase B result — prototypes & decision
See `prototypes/EVALUATIONS.md`. Chosen: **C1 墨華 Ink Bloom** (working title; final name 墨華 *Ink Bloom*).

## Hero Moment (defined before V1)
- **What is seen:** a vast, bright, still tank of water (backlit warm white, faint meniscus line near the top).
  You click; a single bead of ink falls through the air, punches the surface (tiny splash ring on the meniscus),
  and rolls into a small dark ring.
- **Trigger:** one click (hold = bigger drop). No text needed: an idle pipette/drop hovers at the cursor.
- **How the frame transforms (~10 s):** the ring sinks and swells into a translucent bell; at ~3 s it buckles into
  5–6 lobes, each sinking as a smaller bell trailing threads; again at ~6 s; by ~10 s a three-tier ink chandelier
  (≈ 70 % of frame height) hangs in the tank, every tier connected by hair-fine threads. The camera eases down
  with the cascade. A second colour dropped into it interpenetrates and mixes subtractively (indigo + cinnabar →
  aubergine), producing a colour neither drop had.
- **Why surprising:** nobody expects a drop of ink to *branch*; it looks like a jellyfish, a chandelier, a tree, a
  dandelion — and it is real physics (Thomson & Newall 1885), not an animation.
- **Why it differs from an ordinary WebGL demo:** subtractive absorption on a bright field (no glow, no black void);
  3D Lagrangian vortex-filament dynamics with a million tracers instead of a 2D stir sim; the structure is emergent
  (every drop branches differently, drops interact through their induced flow).
- **Verifiable frames:** `?shot=` at t = 0.6 (entry), 3 (ring/bell), 6 (first split), 11 (chandelier),
  plus a two-colour frame. Final frame must fill ≥ 55 % of frame height and pass a 200 px thumbnail read.

## V1 scope (Phase C)
1. Core: GPU tracer advection (1024² = 1M tracers; 4 drop slots of 262k), CPU ring dynamics with split cascade
   (gen 0–3), mutual induction, settling, drop entry (falling bead + surface ripple).
2. Render: absorption splat with depth-dependent size (DoF), multi-scale blur for volume + crisp threads,
   backlit studio sweep, meniscus, faint suspended motes, water-surface caustics; ACES-ish tone, grain.
3. Interaction: click = drop at x (depth randomised slightly); hold = drop size; 5-ink palette strip as small
   ink bottles at the bottom (diegetic); drag = gentle stir current; Space = slow motion; R = fresh water.
4. Camera: slow follow of the cascade's centre of mass, eased.
5. Identity: title card 墨華 Ink Bloom fades in over the first bloom; sound (soft drip + low water tone) on first click.
6. Deploy to showroom `20261019-ink-bloom/`, verify 200 + 0 console errors.

## Acceptance criteria (V1)
- Hero frames above render in headless SwiftShader with 0 console errors; bloom ≥ 55 % frame height at t = 11.
- Works from public URL; click → drop within 100 ms; ≥ 3 interactions (drop/size, colour, stir, slow-mo, reset).

## Current state
- 2026-10-19 09:45 TPE: Phase A + B done, direction chosen.
- 2026-10-19 ~10:03 TPE: V1 deployed and verified (200, 0 console errors). Hero frames from live URL in shots/v1/.
  Acceptance: hero frames render ✔; 0 errors ✔; ≥3 interactions ✔ (drop/hold size, 5 inks, stir, slow-mo, reset);
  bloom ≥ 55 % height at t=11 ✖ (≈ 50 % single drop; two-ink frame ≈ 60 %).
- Waiting for independent adversarial review before Phase D.

## Exploration decision (2026-10-19 11:22 TPE) — see prototypes/EVALUATIONS.md, round X
- **Direction stays Ink Bloom; renderer and staging change.** V2 = X1 volumetric dye raymarch + X2 raymarched tank with following camera + thread layer from tracers; X3 salt layer kept as a toggle (key `S` / UI chip) rather than the default.
- **V2 scope (Pass 1, REVIEW-01 fixes 1–4):**
  1. Volumetric render (done in the engine): no dots at 100 %, deep chromatic cores, low-albedo forward scatter, thread layer.
  2. Recomposition: camera fits the cascade to ~80 % of the frame height; inks in a column at the far left margin, no key legend; title small at top left, outside the water column.
  3. Tank: glass edge lines, TIR at the surface and side panes, floor slab with contact shadow, backlight falloff (darker corners).
  4. Colour: pigment absorbances chosen for chromatic mixes; OD tone clamp; dilution over time (tracer diffusion grows with age, and older ink thins).
  - Replace the 4-slot erase with a **tank memory**: before a slot is reused its ink is baked into a persistent volume that keeps diffusing and slowly thinning (−0.35 % per 0.4 s).
- Not in Pass 1: splash/crown (fix 5), stir vortex filaments (fix 6), real-GPU tiers (fix 7).

## Status 2026-10-19 12:02 TPE
- V2 (Pass 1) deployed at 20261019-ink-bloom/v2/ and the project root (v1/ kept). Waiting for REVIEW-02. Next passes: fix 5 (first 3 s: pipette, crown splash, filament), fix 6 (stir filaments), fix 7 (real-GPU tiers, intro).

## Status 2026-10-19 13:08 TPE
- V3 (Pass 2) deployed at v3/ and root. Waiting for REVIEW-03. Remaining: colour gamut + mixing, real-GPU measurement, polish (pipette glass, crown scale, side panes).

## Status 2026-10-19 14:22 TPE
- V4 (Pass 3) deployed at v4/ and root (v1–v3 kept). Waiting for REVIEW-04. Open: mixed-hue fraction (≈2–5 % vs 15 % target), real-GPU fps.

## Status 2026-10-19 15:27 TPE
- V5 deployed at v5/ and root (v1–v4 kept). Waiting for REVIEW-05. Open: real-GPU fps; ink coverage at 200 px below 40 %; side-by-side mixing still low (only same-column entrainment mixes).

## Status 16:16 TPE
V6 (final polish) deployed and verified live; FINAL_REPORT.md written; docs published. Run complete.
