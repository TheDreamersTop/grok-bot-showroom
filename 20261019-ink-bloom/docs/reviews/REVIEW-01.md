# REVIEW-01 — Independent adversarial review of V1 墨華 Ink Bloom
Reviewer: independent subagent (Hostile Creative Director + Principal Engineer). No project code was edited.
Date: 2026-10-19, review started 10:02 TPE (UTC+8), about 31 min into the run.
Under review: LIVE https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/. The live `main.js` is byte-identical to `v1/main.js`.
Method: headless Chrome with SwiftShader at 1920×1080, DPR 1. Deterministic `?shot=T&tw=1024` frames come from the live URL. Two real-time live sessions covered auto-drop, click, 700 ms hold, ink change, circular stir, Space and R. All images are in `reviews/assets-01/`. The contact sheet is `contact-sheet.jpg`.

## Evidence index (all in assets-01/)
| Frame | File | What it shows |
|---|---|---|
| First screen (live, 0.7 s) | `first-screen-0.7s.jpg` | An empty warm-grey field with a grey band across the top. There is no subject, no tank and no pipette (the cursor is hidden until the mouse moves). |
| t=0.3 | `hero-t0.3.jpg` | One 10 px bead in the top band. |
| t=3 | `hero-t3.jpg`, `crop-ring-t3.jpg` | A ring about 70 px wide (≈ 3.5 % of frame width) under a carrot-shaped trail. |
| t=6 | `hero-t6.jpg` | A bell with 4 lobes, about 120 px wide. |
| t=11 | `hero-t11.jpg`, `crop-bell-t11.jpg`, `crop-gen2-t11.jpg`, `thumb200-t11.jpg` | The best frame: a 3-tier "chandelier", about 50 % of frame height. |
| t=16 | `hero-t16.jpg`, `crop-ui-collision-t16.jpg` | The cascade falls into the ink-palette HTML and dissolves into scattered specks. |
| Two inks, t=14 | `mix-indigo-cinnabar-t14.jpg`, `crop-mix-t14.jpg`, `thumb200-mix.jpg` | Indigo and cinnabar sit side by side. Where they overlap the colour is near-black: the darkest pixel is RGB(14,14,26), not aubergine. |
| Big drop (size 1.6), t=12 | `bigdrop-t12.jpg` | Wider. Its lower tier also crashes into the UI. |
| Live click + hold | `live-2-click.jpg` | Two rings with a dark neon-like rim halo. Faint dashed ripple artefacts sit on the surface line. |
| Live stir | `live-3-stir.jpg`, `stir-before-after.jpg` | A 2-turn circular drag through the bloom. Effect is mild: a slight tilt and scatter, hard to tell apart from the natural evolution. |
| R | `live-4-reset.jpg` | Clean reset. Works. |
| tw 512 fallback | `hero-t11-tw512.jpg`, `crop-gen2-t11-tw512.jpg` | Heavy stipple: individual points are visible. |

Console: **0 errors, 0 warnings, 0 page errors, HTTP 200** across 3 fresh sessions.
Performance: SwiftShader probe chose TW=512 and ran at **5 fps**. Real-GPU fps is still unmeasured, so the builder's own note stands.

## Scores — Benchmark v5 (0–2 each, from rendered frames only)
| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Focal point & composition | **1** | The subject is clear at t=11, but the upper 40 % of the frame is trail and empty water. The bloom sits in the lower half and at t≥14 runs into the bottom UI (`crop-ui-collision-t16`). The first screen has no focal point. Framing is not fitted to the rendered bounds, which violates principle 17. |
| 2 | Value structure | **1** | A single mid-value blue sits on ivory, with few true darks except clumps. The 200 px thumbnail (`thumb200-t11`) reads as "small blue squiggle, lots of white". The background has no value design: no dark wall edges and no floor. |
| 3 | Palette & colour script | **1** | Ivory plus one ink is coherent. But "indigo" renders as saturated digital ultramarine, not indigo ink. The promised "colour neither drop had" fails: the overlap goes to near-black. Colour never changes over time (no dilution into pale tint). |
| 4 | Light behaviour | **1** | There is Beer–Lambert absorption and nothing else. No in-scattering, no self-shadowing, no backlight glowing through thin veils. The ink casts nothing on the back sweep. Caustics are invisible in every frame. |
| 5 | Depth | **0** | There is no tank: no glass edges, no floor, no back wall, no occlusion, no perspective on the meniscus. The rings read as flat 2D blots. The blurred bokeh blobs are the only depth cue, and they read as a wallpaper photo. |
| 6 | Material identity | **1** | Gen-1 bells read as "ink or smoke" at a distance. At 100 % the ink is stipple, not dye. Water and glass are not present as materials, and the top band reads as a UI header bar, not a meniscus or total internal reflection (TIR). |
| 7 | Detail at 100 % crop | **0** | Even at tw=1024 the point splats are visible (`crop-bell-t11`); at tw=512 (what SwiftShader and weaker GPUs get) they are blotches. Young rings have a dark neon halo. The trail is a stiff, symmetric carrot or arrowhead and breaks at the surface band (`crop-trail-t11`). There are dashed ripple artefacts. |
| 8 | Originality | **1** | The Thomson cascade is genuinely rare on the web, and that is the asset. As rendered it reads as "GPU particle sim on a white background". A stranger cannot tell it from the many ink-in-water / smoke-particle toys. The phenomenon is new; the look is not yet. |
| 9 | Hero legibility (kids) | **1** | For the unlabelled pair blank → t=11, an adult says "ink dropped and branched". A child says "a blue jellyfish", but only after ~10 s of slow, small action, and nothing happens during the first ~3 s. |
| 10 | Emergent response | **1** | Branching is genuinely emergent and two drops interact. But the response is slow: bead fall plus ~3 s to the first split. Stir is weak. The 4-slot cap silently erases your 1st bloom on the 5th click, and new drops can wait in a queue for a slot to fade. |
| 11 | Motion quality | **1** | Sinking is smooth and weighted, and the cascade gives a slow travelling front. But it is one uniform tempo: no entry beat, no splash, no acceleration or "pop" at a split, and the trail is rigid. Not verified on a real GPU (5 fps in SwiftShader). |
| 12 | Polish / UI in world | **1** | The minimal UI is clean and sound exists. But the palette strip and key legend are HTML overlays the bloom crashes into. The legend is debug-ish text. There is no intro or title moment. The surface band looks like page chrome. |
| | **Total** | **10 / 24** | Below the brief's own V1 gate of 12. The builder's P1 self-estimate of 13 was optimistic, and V1 is visually almost the same frame as P1 (`shots/p1-sheet.jpg`) scaled up. |

## Was exploration genuine? Mostly no.
- Phase A took 4 min and Phase B 10 min for 5 concepts and 3 prototypes. That is not visual exploration; it is confirmation.
- P2 (`p2-t07b.jpg`) is untextured primitives in a black void. P3 (`p3b-sheet.jpg`) is a moiré mosaic. Both are strawmen built to lose: neither could have beaten P1, so the comparison proved nothing.
- More importantly, **no alternative visual approach was tried for the winner**. The rendering approach (point splats + 3-scale blur) is what caps criteria 4–8, and it was never questioned. V1 = P1 with more tracers. The "creative comparison" that matters now is between rendering approaches and compositions for the same phenomenon, not between concepts.

## Answers to the brief's reviewer questions
- **Would it impress a stranger?** Not in the first 5 s. They see a blank grey screen, then a tiny blue dot. At ~10 s an attentive viewer thinks "oh, that's pretty". Most strangers have left by then. The t=11 frame is pleasant, not a jaw-drop.
- **Does it look like a 30-min AI demo?** Yes. Particle stipple, a floating HTML palette, a key legend in the corner, an empty field and one centred effect make up the visual grammar of a competent WebGL experiment. Nothing in the frame says "a real object, art-directed, photographed".
- **Is the identity distinctive?** The idea (bright backlit tank, subtractive ink, Thomson cascade, 墨華 naming) is distinctive. The rendered identity is not yet. Remove the title and it is "blue particles on white".
- **Is the hero memorable?** The *structure* at t=11–14 is memorable: a 3-tier chandelier with threads. The *moment* is not. There is no entry, no beat, no scale; it happens in 30 % of the screen and then falls into the UI.
- **What is the weakest part?** The render (stipple, no volume, no light transport, no tank) together with the composition (blank first screen, empty upper half, bloom colliding with UI). The physics is the strongest part and is being undersold by the image.
- **What would make it 2× more impressive?**
  - A true volumetric ink render: continuous dye density, backlit forward scattering, self-shadowed veils, glowing thin edges.
  - Placed in a real tank you can see: glass edges with refraction, floor, meniscus in perspective.
  - A camera that descends with a cascade that fills 75–85 % of the frame.
  - Water that remembers: older blooms persist as faded clouds, and a salt layer stops rings into umbrellas.

  That is the difference between "particle demo" and "is this a photograph?".
- **Are there architectural limits?** Yes, several are hard:
  1. **Point splats, then screen-space blur.** This can never produce a continuous dye sheet or self-shadowing, and the stipple is inherent. A 3D density grid (splat tracers into a 3D texture or slice atlas, then raymarch) is the needed step.
  2. **SLOTS=4, about 65k tracers per drop.** The 5th drop deletes the 1st, so the tank cannot accumulate history, which kills "my composition" play.
  3. **MAXR=192 rings and CPU ring dynamics.** This caps cascade depth, which is why gen-3 dissolves into specks rather than gen-4 threads.
  4. **Stir is 6 Gaussian velocity puffs at z=0 with r=0.14.** It is not a vortex, so it cannot visibly shear structure.
  5. **The camera does not follow the cascade**, despite the PLAN, so composition cannot be fitted.
  6. **Scene is a backdrop quad plus band.** There is no tank geometry, so depth needs new scene work, not tuning.
- **Is it mistaking complexity for quality?** Partly. Biot–Savart filaments plus 1M tracers is real engineering, but the frame does not show that ambition. The tank is the sales pitch, and there is none on screen. Adding inks, keys and audio before the single frame looks like a photograph is feature-count over quality.

## Kids test
- **Gasp?** No gasp at open (blank screen). A mild "ooh, a jellyfish!" at ~10 s if they wait. The two-colour chandelier gets the best reaction.
- **What they try next, and what happens:**
  1. *Click ten times fast.* Drops queue behind slot fades, and the first blooms vanish. That reads as broken.
  2. *Pick every colour and mash them together.* Everything goes to near-black mud; a child expects purple, green, orange.
  3. *Scribble hard with the mouse ("stir it!").* Barely any visible response, so it feels like a dead end.
  4. *Hold forever for a giant drop.* Size is capped and it falls into the buttons.
  5. *Click above the water / on the surface band.* No splash, no ripple worth seeing.

  Every one of those is the obvious kid move, and every one currently disappoints. Fixing them is also the Pass-2 plan.

## Top fixes, in priority order
1. **Replace the point-splat renderer with a volumetric dye render.** Splat tracers into a low-res 3D density texture (for example 128×256×64, or a 2D slice atlas), blur in 3D, then raymarch from the camera. Use Beer–Lambert transmittance plus single forward-scatter from the backlight, plus a shadow march toward the light. Keep the tracers only for the crisp thread layer. *Acceptance:* `crop-bell-t11` at 100 % shows no individual dots; thin veils glow warm at their edges; thick cores go deep but chromatic; this works at the low tier too.
2. **Re-compose for the finished hero.** Make the cascade fill 75–85 % of frame height: a larger gen-0, or a camera that eases down and back with the cascade's bounding box (`__info().bbox` already exists). Remove the empty upper third. Keep the cascade clear of all UI: move inks and legend into the world (bottles on a sill at the tank's base, outside the water column) or into the far margins. *Acceptance:* the 200 px thumbnail of t=11 and of the two-ink frame reads as one striking object.
3. **Build the tank.** Add visible glass edges with refraction/dispersion lines and a thick glass bottom with ink pooling and a contact shadow. Show the meniscus in slight perspective, seen from just below the surface so TIR mirrors the ring (this would make the top band beautiful instead of a header bar). Give the backlight a falloff so there are darks at the frame corners. That gives a fg/mid/bg read for #5 and a material read for #6.
4. **Fix the colour.** Use real pigment absorbance: indigo is a desaturated blue-violet, not ultramarine. Clamp or tone-map optical density so mixtures stay chromatic (indigo × cinnabar → aubergine, indigo × gamboge → green). Add a colour script: dense cores at the start, dilution into pale tinted veils over 20–40 s. *Acceptance:* in the two-ink frame the darkest overlap pixel has saturation > 0.3 and a visibly new hue.
5. **Fix the first 3 seconds.**
   - Do not open on a blank field: show a visible pipette with a bead swelling at its tip, or a faded bloom from a previous drop already hanging in the tank.
   - The first drop should land by ~0.5 s with an entry beat: crown splash on the meniscus, ripple rings in perspective, a short entrainment cavity.
   - Replace the rigid carrot trail with a wavering, thinning filament (add vorticity noise, let it break into beads).
   - Remove the dashed ripple artefact and the trail break at the surface band.
6. **Make kid gestures pay off.**
   - Stir should inject a real line/ring vortex along the drag path (an added filament), so structure visibly shears and curls within 300 ms.
   - Make the tank a memory: use a persistent faded dye field instead of the 4-slot erase, and never queue drops.
   - Add a hidden salt/density layer at about 60 % depth where rings stop, flatten and spread into umbrellas. This is a new phenomenon, gives a second composition plane, and is a discovery reward.
7. **Measure and tier for a real GPU, and finish the world UI.** Record fps on a real GPU (or estimate from SwiftShader ms/step), use tiered quality, and keep low-tier frames free of stipple. Add a short title/intro moment (the title written in ink?), and drop the key legend in favour of a discoverable gesture hint.

## Verdict: **(b) explore further first, briefly and narrowly, then escalate Ink Bloom.**
The phenomenon is still the best bet among the candidates, and nothing seen here says abandon it. But the current visual approach caps the piece at about 14/24 no matter how much tuning goes in. Before spending Phase D on polishing splats, prototype the rendering and composition approaches the builder skipped. Time-box it to 60–90 min (until about 11:30 TPE), using the same `?shot=` harness and frames, and judge by the t=11 frame plus 100 % crop plus 200 px thumbnail:
- **X1 Volumetric dye:** the same sim with a 3D density grid and raymarched absorption + forward scatter + self-shadow. This is the most likely big leap.
- **X2 Real tank and camera:** visible glass, floor, meniscus in perspective from just below the surface, and a camera that descends with the cascade (tall-tank framing on 16:9, possibly with a slight tilt). This can be combined with X1, but evaluate it separately.
- **X3 Wild card for genuine comparison:** a stratified tank (salt layer, rings stop and spread into umbrellas/clouds) as an alternative hero. Or, if the builder wants a true concept rival, one new concept rendered to a *photographic* standard rather than another strawman. Do not re-prototype P2/P3.

Pick the winner by evidence, then run the escalation passes below.

### Escalation plan (after the exploration)
- **Pass 1 — Visual** (target ≥ 16/24): volumetric render (fix 1), composition and camera (fix 2), tank (fix 3), colour (fix 4). Before/after: t=11, two-ink t=14, 100 % crop, 200 px thumbnail, compared against `assets-01/`.
- **Pass 2 — Experience** (target ≥ 19/24): first-3-seconds entry beat (fix 5), vortex stir, persistent tank memory, salt layer, hold-to-grow with a visible bead swelling at the pipette (fix 6). Run the kids-test list above as an acceptance checklist; each gesture must produce a visible, physical consequence within ~1 s.
- **Pass 3 — Polish** (target ≥ 20/24, with #8 and #9 = 2): diegetic UI, title moment, sound tied to splits and entry, real-GPU perf tiers, OG image from the best frame, fresh-session live verification with 0 console errors.
