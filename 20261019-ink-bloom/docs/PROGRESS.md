# PROGRESS (append-only)

## 2026-10-19 09:33 TPE — start (elapsed 0h04)
- Read CHALLENGE.md, r4 RESEARCH benchmark v4, r4 FINAL_REPORT, showroom README. Showroom pulled.
- Next: Phase A research (web), RESEARCH.md with Visual Quality Benchmark v5.

## 2026-10-19 09:35 TPE — Phase A done (elapsed 4 min)
- RESEARCH.md: 10 refs (Ciechanowski watch, Balian watch, Abeto Messenger, 2026 template landscape: kintsugi/glass/marbling/dominoes, PARISON, Jaffer marbling, Hevesh5 field flip, Thomson 1885 vortex-ring cascade, Keever/Seveso ink photography, Jaquet-Droz). Principles 13–18; benchmark v5.
- Finding: kintsugi, glassblowing, marbling, domino sandboxes all already exist as AI-built web templates (kills 3 obvious ideas).
- Next: Phase B concepts + 3 prototypes.

## 2026-10-19 09:45 TPE — Phase B done (elapsed 14 min)
- Built 3 renderable prototypes: P1 ink cascade (vortex filaments + GPU tracers), P2 cam automaton, P3 domino field flip. Shots in shots/p1-*, p2-*, p3b-*.
- Chose P1 Ink Bloom; Hero Moment + V1 scope in PLAN.md.
- Note: SwiftShader is fast for this workload (~1–20 s per shot), unlike Round 4.
- Next: deploy stub early to validate pipeline, then V1.

## 2026-10-19 10:01 TPE — Phase C V1 deployed (elapsed 30 min)
- Built v1/ (index.html + main.js, plain WebGL2): CPU vortex-ring dynamics (self-induction, expansion, Widnall-mode growth, split into k tilted children, gen 0–3, mutual Biot–Savart induction, stir field), GPU tracer advection (TW² tracers, 4 drop slots, roll-up capture for newborn rings), absorbance splat + 3-scale blur, studio backdrop, TIR mirror band under the surface, caustics, motes, dropper + falling bead + ripples, 5 inks, hold=bigger drop, drag=stir, Space=slow, R=reset, M=mute, synthesised drip/water audio, auto first drop at 1.1 s, GPU probe picks TW 1024/768/512.
- Tuned: grow .05, Γ decay .015+.02·gen, child Γ .55, roll-up k 3 (bells re-form each generation instead of streaking into "legs").
- Deployed: showroom 3166523 (V1 at 20261019-ink-bloom/ and /v1/), root README + index.html card. Stub 6d0b6a5 earlier (Phase B).
- Verified live URL: HTTP 200 (/, v1/, main.js, og.jpg); fresh headless session: 0 console errors, 0 page errors (tools/live.js).
- Shots (rendered from the LIVE URL): shots/v1/hero-t{0.25,3,6,11}.png, hero-sheet.png, two-inks-t13.png, live-{1-auto,2-click,3-stir,4-reset}.png.
- Known V1 issues: single-drop bloom ≈ 50 % frame height with an empty upper third; dropper affordance weak (bulb clipped at top edge); faint ripple dashes in the TIR band; stir weak; grain at TW 512; real-GPU fps unmeasured (SwiftShader live ≈ 3–4 fps → live screenshots lag).
- Bottleneck: hero scale/composition of a single drop + real-GPU performance unknown.
- Next: STOP per run scope; await independent adversarial review (REVIEW.md) before Phase D passes.

## 2026-10-19 10:14 TPE — REVIEW-01 received (10/24, verdict b). (elapsed 43 min)
- Plan: one new engine (v2/) with switches so X1 (volumetric grid raymarch), X2 (raymarched tank + following camera, V1 splat ink as a sheet) and X3 (salt-stratified tank) share the same sim and the same ?shot= harness. Judge at 1920×1080: t=11 frame, 100 % crop, 200 px thumb.

## 2026-10-19 11:21 TPE — Exploration X1–X3 done, decision made (elapsed 110 min)
- X1 volumetric (no dots at 100 %, darkest (9,14,43)), X2 tank+camera (composition ok, splat ink too pale), X3 salt umbrella (new silhouette). Winner X1+X2 + thread layer; X3 as toggle. Frames in prototypes/x/, write-up in prototypes/EVALUATIONS.md, decision in PLAN.md.
- Tooling note: /workspace/_tmp/r4tools/node_modules had disappeared; installed puppeteer-core into /workspace/_tmp/r5node and repointed tools/*.js.
- Tank memory replaces the 4-slot erase (bake on slot reuse, slow diffuse + thin).
- Next: Pass 1 → V2 (tank look, dilution, salt toggle, UI), before/after vs reviews/assets-01, deploy to v2/.

## 2026-10-19 12:02 TPE — V2 (Pass 1) deployed; STOP for REVIEW-02 (elapsed 151 min)
- REVIEW-01 fixes 1–4 in V2 (v2/main.js):
  1. Volumetric dye render: 3D dye grid (384×256×48 atlas; low tier 256×176×40), 3D blur, light-transmittance volume, raymarch with Beer–Lambert, low-albedo forward scatter, self-shadow. A thread layer (thr .6) gives crisp ring edges. No dots at 100 % crop.
  2. Recomposition: the camera fits the cascade to ~80 % of the frame height and snaps to the final framing at boot. The inks moved to a frosted column at the far left margin, plus a salt-layer chip. No key legend.
  3. Tank: raymarched glass tank with edge lines, floor slab and contact shadow, TIR at the surface underside and at the side panes, meniscus, stronger backlight falloff and vignette.
  4. Colour: new absorbances (indigo .82 G, carmine [.14,1.12,.80], gamboge G .18, viridian [1.18,.40,.66]), OD soft clamp 10, mass 3, age dilution (×0.45 from 6 s to 40 s).
- The 4-slot erase is replaced by **tank memory**: before a slot is reused it is baked into a persistent volume (diffuse + thin −0.35 % per 0.4 s). In a 7-drop spam all 7 blooms persist (shots/v2/a-spam-t16.png).
- Salt layer (X3) is a toggle: key S / the 鹽層 chip.
- Perf: ink-AABB-limited raymarch. Low tier for software GPUs: smaller grid, TW 512, adaptive render scale down to .42, volume update every 3rd frame.
- After frames: shots/v2/after/ (hero-t{0.7,3,6,11,16}, crops, thumbs, mixes, bigdrop, salt). Before/after sheet: shots/v2/before-after.png (vs reviews/assets-01).
- Deployed: showroom d367a7c. V2 is at 20261019-ink-bloom/v2/ and at the root (clearly better); v1/ is kept. The project README, root README row and index card were updated.
- Verified live: HTTP 200 for /, v2/, main.js, og.jpg, v1/. Fresh headless live sessions on /v2/ and / had 0 console errors and 0 page errors (tools/live.js). The live-URL t=11 frame is shots/v2/after/hero-t11-live.png.
- Bottleneck: SwiftShader live frame rate is ~2–3 fps even at the low tier (V1: 3–4). The volume passes (splat + 3D blur + light) cost about as much as the scene raymarch. Real-GPU fps has not been measured. Also, mixes overlap mostly as indigo-dominated navy/maroon; aubergine/green read only in mid-density overlaps.
- Next: STOP for REVIEW-02.

## 2026-10-19 12:29 TPE — V3 started (Pass 2); P0 drop-queue fixed
- v3/ copied from v2. Slot assigned at release (releaseCount), spawn never waits (bakes an occupied slot into tank memory), R clears falling[]. SLOTS 4→8.
- Deterministic acceptance: 7 drops 0.1 s apart → 7 blooms at t=8 (shots/v3/p0-7drops-0.1s-t8.png).
- Per-drop variation: lobes 4–7, random tilt, initial asymmetry, entry speed from drop height (R0 and Γ scale).

## 2026-10-19 12:38 TPE — V3 opening + stir
- Opening: analytic glass pipette with an ink column follows the cursor; its height (from cursor height) sets the entry speed. The bead swells from frame 1 (bigger while holding), falls as a 3D ink sphere, auto drop at 0.12 s lands ≈0.45 s; crown splash (scalloped wall + spray beads) and ripple glints on the TIR surface; the trail is now a thin wavering, beading filament. Camera opens wide on the whole tank + pipette, then eases in as the cascade grows.
- Stir: the shear tilts and excites rings (bells bend and break), each stroke sheds small vortex rings and lays a thin ink ribbon (brush). Deterministic stir via &stir=t0,x0,y0,x1,y1,dur,ink. Frames shots/v3/stir-*.png, open2-*.png.

## 2026-10-19 12:40 TPE — V3 salt pour
- Salt is now a tool (鹽 salt · pour, key S): click (hold = more) pours brine. A schlieren plume with glinting crystals sinks, spreads on the floor, and after ~1.1 s the dense layer rises from the floor (+0.42×amount per pour, capped). The interface shows as a horizon glint + faint milky haze below; rings stall on it and spread into skirts. Frames shots/v3/salt2-{0.8,11}.png.

## 2026-10-19 13:08 TPE — V3 (Pass 2) deployed; STOP for REVIEW-03 (elapsed 217 min)
- Done (priority order):
  1. P0 drop queue fixed: the slot is assigned at release, nothing ever blocks, R clears falling[], 8 slots.
     - Deterministic: shots/v3/after/p0-7drops-0.1s-t8.png and bug-doubleclick-t6.png (3 blooms).
     - Live: 7 clicks 150 ms apart on the live root gave 8/8 drops (auto drop + 7) and 0 errors (tools/rapid.js, shots/v3/live-url/root-rapid7-final.png).
  2. Opening: glass pipette with an ink column and a swelling bead from frame 1. The auto drop lands at ≈0.45 s with a crown splash, spray beads and ripple glints. The trail is a thin wavering, beading filament. The camera opens wide on the tank and eases in.
  3. Per-drop variation: 4–7 lobes, tilt, asymmetry, size jitter, entry speed from the pipette height (cursor height).
  4. Stir: shear tilts and excites the bells, the stroke sheds vortex rings and lays an ink ribbon (brush).
  5. Salt: a pour tool (jar / S). A visible schlieren plume with crystals sinks, spreads on the floor and builds a layer from the floor up, with a horizon glint and haze; rings stall into skirts.
- Stretch, done: environment re-art (softbox lightbox tank in a dark warm studio, table light pool + caustics, thin glass highlights, light title off the glass, ink bottles on the table instead of the card); GPU tiers (readPixels-synced probe → high/mid/low, iGPU name match → mid with DPR 1 + small grid + volume every 2nd frame; ?fps overlay).
- Evidence: shots/v3/after/ (all frames at tw=768), before/after vs assets-02: shots/v3/before-after-v2-v3.png; live frames shots/v3/live-url/.
- Deployed: showroom c49cfba + 3bad116 → 20261019-ink-bloom/v3/ and root (v1/, v2/ kept); project README, root README row, index card updated.
- Verified live: 200 for /, v3/, main.js, og.jpg, v2/, v1/, shots; fresh sessions (live.js on / and /v3/, rapid.js on /) 0 console/page errors.
- Bottleneck: real-GPU fps still unmeasured (SwiftShader live ≈1.5–2.5 fps at the low tier; probe 29 ms/pass). Colour gamut (fix 7) not done: carmine/gamboge still saturated poster primaries, overlaps not yet aubergine/green.
- Next: STOP for REVIEW-03.

## 2026-10-19 14:14 TPE — V4 (Pass 3) in progress (elapsed 283 min)
- v4/ copied from v3. Before frames of V3: shots/v4/before/ (tools/set.sh, tools/shot.js; tw=768).
- Fix 1: RS adapt + allocRT now run before render() in the same frame; resize re-renders at once. Camera never follows ink (no drift/cut).
- Fix 2: lantern framing is the default: fixed symmetric camera fitted to tank + pipette headroom + table (tank ≈ 77 % width at 16:9), wider tank (XH 1.75) and lower rim, eye slightly high so the table pool shows; side panes look out into the dark studio (no TIR planks); darker floor.
- Fix 3: pigment re-fit (indigo [1.1,.94,.74], carmine [.42,1.1,.86], gamboge [.17,.47,1.1], viridian [1.1,.6,.65]); OD soft cap 10→5.5; dilution ×0.38 from 3 s to 22 s, more age diffusion. Model: indigo+carmine → aubergine, gamboge+viridian → olive green, carmine+gamboge → orange.
- Fix 4: brush = calligraphy: width/wetness from stroke speed, entry taper, gaussian core + halo, bristle streaks (飛白) on fast strokes; one stir blob per segment (overlapping blobs used to drag the ribbon along with the pointer); curl rings across the stroke roll the ribbon edges; brush rings never capture tracers (black knot).
- Fix 5: thread layer fades in from 2.8 s (no pen loops in young rings/crown); stem filament fades toward the surface with random sway (no '?' hook); crown ~2.5× bigger, 11 spray beads; pipette = short clear glass + coloured ink column + rubber bulb, inside the frame.
- Fix 6/7 (partial): one salt pour lifts the layer to ~y 1.1 (umbrella with the default cascade); jar lid lifts on hover, tilts on pour, one-time glint after the first bloom; bottles 32×42 px in a column in the dark studio, layout computed from the projected tank; title shrinks until clear; oldest rings fade at the cap; stir swish + salt tinkle sounds.
- Fallback signature: auto carmine calligraphy stroke at 6.2 s in the hero sequence (live: only if the visitor hasn't interacted).

## 2026-10-19 14:22 TPE — V4 (Pass 3) deployed + verified; STOP for REVIEW-04 (elapsed 291 min)
- Deployed: showroom 50877c4 (V4 at root + v4/, v1–v3 kept, og.jpg, shots/v4-*.jpg, project README, root README row, index card) + 7f407db (pipette ink column lighter/lit).
- Verified live (fresh headless SwiftShader sessions, low tier): HTTP 200 for /, v4/, main.js, v4/main.js, og.jpg, v3/, v2/, v1/; served main.js = v4/main.js (md5 0b46cb7d…).
  - live.js on / and /v4/: 0 console / page errors.
  - rapid.js, 7 clicks 0.1 s apart: drops 8/8 (auto + 7), 0 errors (shots/v4/live-url/final-rapid7-0.1s.png).
  - saltlive.js: clicked the jar → one pour → layer at y 1.01–1.14; the next drop stalls at lowY ≈ 0.99 (umbrella), 0 errors (salt-hover/pour/umbrella.png).
  - blackframe.js, 40 frames during mouse moves: forced RS flips (?rstest, 35 changes) → 0 black frames; natural adapt → 0 black frames.
- Evidence: shots/v4/before (V3), shots/v4/after (V4), before-after-v3-v4.png (side-by-side, 9 rows), thumbs200-v3-v4.png, crops-crown-ring-v3-v4.png, live-local/, live-url/.
- Measured colour (tools/inkstat.py): V4 indigo+carmine t14 carmine median (198,54,81), p25 (163,35,59), indigo median (55,77,130); darkest cores ≈ (22,40,100) indigo. Mixed hues: purple/aubergine only ≈ 2 % and olive ≈ 5 % of ink pixels in the two-ink frames, so the ≥ 15 % target is NOT met (side-by-side blooms rarely overlap along the view ray; an age-growing haze splat didn't move it).
- Known issues: live (SwiftShader 1–3 fps) a straight constant-speed drag still gives a fairly even ribbon (taper and 飛白 show with speed changes, as in the scripted stroke); 7-drop row is still a row of distinct colours (less poster-like); real-GPU fps still unmeasured.
- Next: STOP for REVIEW-04.

## 2026-10-19 14:54 TPE — V5 (final pass) built; evidence rendering (elapsed 323 min)
- REVIEW-04: 21/24, gate blocked by #8 = 1; #1 dropped to 1 because the 6.2 s auto stroke wrecked the cascade.
- v5/ copied from v4 (v4 kept). Before = V4 frames (shots/v5/before, plus V4 hero t0.35/8/16/24 and low-tier frames).
- Fix 1 hero: auto stroke removed from the default (opt-in ?autostroke). At 8 s an auto carmine drop falls into the SAME column (x −0.12, z +0.015). Entrainment: a drop falling through an earlier drop's dyed column (|dx|,|dz| < .2, < 20 s) carries ~45 % of its tracers in the earlier pigment, so the mix is rendered subtractively → a plum/indigo two-tone chandelier (≈ 30 % purple/aubergine ink pixels at t16, tools/inkstat.py; V4 side-by-side ≈ 2 %). Hero drops are bigger (1.6 / 1.1); default seed 5.
- Fix 2 originality: a faint brine layer at y 0.72 by default (?salt=0 removes it; R keeps it), so the passive cascade stalls into an umbrella canopy over a visible horizon. Inner-tank vignette on the back wall (edges ~45 %) and tighter framing (tank ≈ 86 % width, pipette shortened to fit).
- Fix 3 crown: < 0.28 s, narrow (r .025+.2√t), mostly clear wall with a bright specular rim; beads are small bright droplets that live to 0.55 s.
- Fix 4 caustics: contrast −55 %, softer lines (pow 5 → 2.5), warmer, domain-warped and masked by low-frequency noise (no regular web).
- Fix 5 perf: low-tier ring cap 128 (high/mid 224). Real-GPU fps still not measurable here (headless = SwiftShader only).
- Fix 6 low-tier brush: widths ×1.6 and a longer entry taper on the small grid, along-stroke dry-brush gaps on fast strokes, exit taper on lift (last 3 segments → 80/55/30 % ink).
- Fix 7 side panes: back/side corner blended over AAW (.028 low tier, .010 otherwise) instead of a hard switch.

## 2026-10-19 15:27 TPE — V5 deployed + verified live; STOP for REVIEW-05 (elapsed 356 min)
- Deployed: showroom 8b233c1 (V5 at root + v5/, v1–v4 kept; og.jpg = V5 hero t16; shots/v5-*.jpg; project README, root README row, index card) + 8b81bf0 (bottle column clear of the tank at narrow margins). Served main.js = v5/main.js = local (md5 be67ab11…).
- Verified live (fresh headless SwiftShader sessions, low tier): HTTP 200 for /, v5/, index.html, og.jpg, v4/, v3/, v2/, v1/; live.js on / and /v5/ 0 errors (one GL performance *warning* from the GPU probe's readPixels); rapid 7 clicks 0.1 s apart → 7/7 drops (8/8 incl. auto drop in the earlier run); salt: jar → one pour → layer 0.72 → 1.00–1.02, drop stalls on it, 0 errors; black frames: 0/40 with 35 forced RS changes, 0/40 natural.
- Evidence: shots/v5/before (V4), shots/v5/after (V5), before-after-v4-v5.png (11 rows), thumbs200-v4-v5.png, crops-crown-caustics-pane-brush-v4-v5.png, layout-*.png, live-url/.
- Metrics (tools/inkstat.py, tw=768): hero t16 purple/aubergine 29.2 % of ink px (V4 1.4 %), t24 26.5 % (V4 0.9 %); side-by-side indigo+carmine t14 6.1 % (V4 1.3 %); 7 drops 3.1 %. 200 px thumb ink pixel fraction 6.7 % (V4 6.1 %); ink bbox ≈ 13–20 % of the thumb (≥ 40 % NOT met by this measure; tighter framing was limited by keeping the whole tank + pipette in frame).
- fps: SwiftShader low tier 1.1–2.9 fps live (probe 22–51 ms/pass); no real GPU reachable from this box, so real-GPU fps is still unmeasured.
- Next: STOP for REVIEW-05.

## 2026-10-19 16:06 TPE — V6 (final polish) built, evidence, deployed (elapsed 395 min)
- Entrainment: blended per tracer in the shader over the first ~0.6 s of the fall (crimson entry → plum skirt); smooth weight (lateral distance × age decay, no 20 s cliff); ENTRAIN .75 after a sweep (.5 → violet 12%, too red; .95 → 2% red). Hero t16 violet 26.2→33.2 %, red 9.0→12.2 % (inkstat, V5→V6). Gap-25 s control fades smoothly instead of snapping to pure red.
- Crown: thin white wall off by default (?crownwall), beads + ripple only.
- og.jpg cropped on chandelier + horizon (tools/ogcrop.py): bbox fill at 200 px 41.8 % (V5 ~13–20 %), pixel fill 19.6 %.
- Optional earlier ink: not changed (in sim time ink is in the water at 1.5 s; the empty start live is SwiftShader's ~2 fps × 0.05 s step cap).
- Evidence: shots/v6/before (V5), after (V6), before-after-v5-v6.png, crops-crown-entry-v5-v6.png. No hero degradation, so nothing was reverted.
- Showroom 5bde669: root + /v6/, og, README, root README row, index card.

## 2026-10-19 16:16 TPE — V6 verified live; FINAL_REPORT; docs published (elapsed 405 min)
- Live: HTTP 200 for /, v1–v6, og, shots; served main.js = v6/main.js (md5). live.js 0 errors; rapid (7 clicks 100 ms apart) 8/8 drops incl. auto; salt 0.72→1.005→1.02, 0 errors; black frames 0/40 under ?rstest (34 RS changes) and 0/40 natural. Logs in shots/v6/live-url/.
- FINAL_REPORT.md written. Docs (PLAN, RESEARCH, REVIEW, PROGRESS, FINAL_REPORT, CHALLENGE, reviews + assets as JPG) copied to showroom 20261019-ink-bloom/docs/.
- End of run: 16:16 TPE, elapsed 6h45.

## 2026-10-19 16:33 TPE — final docs cleanup after REVIEW-06 (23/24, gate met, no must-fix) (elapsed 422 min)
- Docs only, no code changes: 404 links (docs/README reviews/, project README docs/) now point to the GitHub tree or to files; FINAL_REPORT uses the published showroom paths, has 6 reviews (10/15/17/21/23/23), an OPEN THE EXPERIENCE line, and the final end time; REVIEW-01 prototype sheets and REVIEW-06 + assets-06 (JPG) published in docs/reviews.
- End of run: 16:33 TPE, elapsed 7 h 02 min.
