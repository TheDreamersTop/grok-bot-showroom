# REVIEW-01: Independent adversarial review, Phase B (2026-10-08 15:52 TPE)
Reviewer roles: Hostile Creative Director + Principal Engineer. I built none of this.
Material judged: everything in `shots/`, viewed full-frame and as 100 % crops, plus one extra render I made myself:
`reviews/review01-assets/wire2-a0-grain-hidden.png`, which is the same URL as `wire2-a0` with the `#grain` overlay hidden through EVAL. I changed no builder files.
I read code only to explain artifacts I could already see on screen. All scores come from pixels.
Limitation: I only have stills, so I cannot judge motion (criterion 10). I scored it 1 for every prototype and marked it unverified.

---
## TL;DR verdict
- **Direction: GO Shadow Foundry (wire/rod sculpture). Do NOT explore a 4th concept.** Spend the remaining exploration budget, capped at 60–75 min, on a Shadow Foundry *look-dev and legibility spike* (items 1–4 below), then start V1.
- **Why not explore more:** the concept is not what's failing. The execution is. All three prototypes have the same template-level problems: muddy value, spill light, a mosaic grain overlay, debug HUD, and the same tracked-caps serif and CJK title layout. A 4th concept would start at the same ~9/24 and use up the time the winner needs.
- **The builder's scores are inflated by 4–6 points.** The builder gave Foundry 16, Chladni 16, Lumen 12. My honest scores are Foundry wire2 **10/24**, Foundry solid v3 **9/24**, Chladni v3 **12/24**, Lumen v3 **5/24**. **No prototype would impress a stranger in 3 seconds today.**
- **Kill criterion:** after the spike, the solved frame must pass acceptance tests T1–T3 (below) and score ≥ 14/24 honestly. If it doesn't, fall back to Chladni only with arbitrary-shape plates (violin, guitar, heart) and computed eigenmodes, and only if that fallback can be built. I don't expect the fallback to be needed.

---
## Findings that change the plan (evidence-backed)
1. **The "pixelated plaster" is mostly your grain overlay, not the texture.** `#grain` is a 256×256 canvas stretched to 1920×1080 with `image-rendering: pixelated`, which produces 7.5 px mosaic squares over the entire frame, including shadows and type. All three prototypes do this. Evidence: `review01-assets/grain-mosaic-on-vs-off.png` (left: shipped, right: grain hidden). This is the single biggest "cheap" cue in every frame, and it takes 10 minutes to fix.
2. **The shadows are too pale to read.** I measured sRGB luminance in `wire2-a0`:
   - Cat shadow: **146** vs. the lit pool next to it at **182**, a ratio of 1.25.
   - The cat shadow is *brighter than the unlit wall* (113).
   - Floor bird: 81 vs. 100 (1.24).
   - Tree: 64 vs. 141 (2.2, the only acceptable one).

   Spill from the other spots, the env map and the hemisphere fill the shadows. The "hero" images are grey ghosts. Real shadow-art photos (Tim Noble & Sue Webster) work because the shadow is near-black inside a bright pool.
3. **The puzzle can't be solved by a stranger.** It is free 3-DOF rotation with a 0.22 rad snap basin. That basin is about 0.05 % of SO(3) (θ³/6π). Random dragging will not find it in any reasonable time, which makes this a dead end unless you add DOF constraints and guidance. Shadowmatic (Triada, Apple Design Award 2015) avoids the problem by limiting rotation axes.
4. **The scrambled state gives away the answer.** In `v3-a1` and `wire2-a1` the left wall shows a tilted cat or rabbit and the right wall shows the tree/mushroom. The builder found this (axis-permutation scramble), but it means the current "before" frame already contains the "after" images, so the before/after pair has no reveal in it.
5. **Silhouettes are misread.** Each of the three fails:
   - **Cat → rabbit.** The ears are tall, narrow and close together, and the body is an egg.
   - **Bird (floor) → airplane / crucifix.** It's cross-shaped with rounded wings and a fan tail, and it's foreshortened on a grazing floor.
   - **Tree → lollipop / broccoli / mushroom** in the wire version. There's no negative space and the canopy is a single blob.

   Two of the three "reveals" would get named wrong.
6. **In the solid version, the object *is* the cat.** You can see the extruded cat outline and ears in `v3-a0`, so the trick is given away. The wire nest mostly fixes this, but in `wire2-a0` the nest's top outline still shows two ear bumps. That's acceptable in the solved state, and the scrambled `wire2-a1` reads as abstract, which is good.
7. **Voxel stair-steps** show on shadow edges at 100 %: the cat's tail and the tree trunk edge. They come from the 120³ binary occupancy grid plus 2048² PCF.

---
## Per prototype

### A. 影鑄 Shadow Foundry, solid v3 (`v3-a0` solved, `v3-a1` scrambled, `proto-shadow-foundry.png` v1)
- **Stranger in 3 s?** No. What a stranger sees is a brown room, two circular stage-light pools, and a glossy copper toffee floating at the corner seam. Once they find the shadows, the object is clearly cat-shaped, so the "how?!" never comes.
- **30-minute AI demo tells:**
  - Default `RoomEnvironment` reflections give the object a flat orange-copper sheen.
  - Clearcoat terracing reads as layered plywood or a toffee bar (`foundry-solid-terracing-100pct.png`).
  - The plaster looks like Photoshop "clouds" blotches.
  - The pools are perfect circles with uniform falloff (`decay=0`).
  - Black CAD-box skirting lines.
  - A uniform vignette.
  - Mosaic grain.
  - Tracked-out uppercase serif plus a CJK title, which is the generic "AI luxury" template.
  - The object floats with no support and has no contact shadow.
- **Identity:** generic "spotlight demo room". Not distinctive.
- **Hero:** not legible, because the object gives away the trick and the scrambled frame already shows the figures.
- **Verdict:** abandon the solid MC surface as the hero object. It could come back as a 1-second "hull X-ray" in an expert mode.

### B. Shadow Foundry, wire nest (`wire-a0`, `wire-a0.25`, `wire2-a0/a1`)
- **Stranger in 3 s?** Not yet. A gold hay bale or pile of french fries hangs in a muddy room. The solved frame *is* intriguing once you notice that one tangle casts three different shadows. That is the only frame in the whole set with a real "wait, what?" in it. But it takes about 5 seconds and active looking, because the shadows are pale and two of them get misnamed.
- **AI-demo tells:**
  - Every rod is the same saturated yellow-gold with the same brightness, which reads as instanced CG.
  - The 6-sided cylinders facet at 100 %.
  - There's no ambient occlusion between rods, so the interior is as bright as the surface and the bundle has no depth (`wire2-nest-100pct.png`).
  - Rod lengths are short and similar ("fries", "matchsticks").
  - All of the room problems from A.
- **Is the wire nest a real improvement or a gimmick?** Real. It hides the extrusion, gives the work material and craft identity in the Tim Noble / Shigeo Fukuda lineage, and puts a hand-made texture on the shadow edges. It is a conceptual improvement that hasn't been achieved visually yet. "5,200 rods" is complexity standing in for quality. Fewer, longer, varied, occluded rods will look more expensive.
- **Hero legibility risks:**
  - Rabbit instead of cat.
  - Airplane instead of bird.
  - Mushroom instead of tree.
  - Shadows too pale.
  - Floor shadow foreshortened by the low camera.
  - The viewer can't see the lamps, so the cause → effect chain (lamp → object → wall) isn't on screen.

### C. 聲沙 Chladni v3 (`chladni-v3`, `-v3-before`, v1, v2)
- **Stranger in 3 s?** The after frame is the best-looking single image here, with strong value and a clear subject. The before → after pair is fully legible: static becomes a figure. The before frame, though, is literally TV static.
- **AI-demo tells:**
  - The "brushed metal" is **screen-space horizontal streaks** that ignore the plate's perspective, so it reads as scanlines or a broken monitor (`chladni-edge-streaks-100pct.png`).
  - The plate's right edge is stair-stepped and broken into segments.
  - The sand has no height, heaps or self-shadow. It's a decal.
  - The plate is centered in a black void, which fails your own gate ("no black-canvas tech demo look").
- **Originality:** low. The square plate and analytic modes are textbook, and cymatics visualisers are everywhere. An expert's reaction would be "nice shader".
- **Ceiling:** medium. It would need computed eigenmodes for user-drawn plate shapes plus heaped, shadowed sand to get beyond "pretty demo". Keep it as the fallback only.

### D. 光室 Lumen Atelier v3
- **Stranger in 3 s?** No. Murky grey-blue fog, flat black cardboard houses, and rainbow lantern smears that look like a cheap holiday card. The GI is blocky and low-res at 100 % (`lumen-gi-100pct.png`) and the colours bleed as blotches. It reads as "dark + glow", the exact cliché the brief bans. **Kill it.**

---
## Scores against the builder's 24-point benchmark (0–2 each)
| # | Criterion | Foundry solid v3 | Foundry wire2 | Chladni v3 | Lumen v3 |
|---|---|---|---|---|---|
| 1 | Focal point | 1: object sits on the corner seam, which splits the frame in half | 1: same layout, object larger | 2 | 0 |
| 2 | Value structure | 1: muddy mids, pale shadows | 1: measured shadow/lit ratio of 1.25 on two of three | 2 | 1 |
| 3 | Palette | 1: brown mud, copper too orange | 1: gold too saturated against brown | 1: monochrome plus cream, safe | 0 |
| 4 | Lighting | 1: spots with shadows, but spill, no bounce, invisible sources | 1 | 1: plate reflections OK, sand unlit | 1 |
| 5 | Depth | 1 | 1 | 1 | 0 |
| 6 | Material | 0: toffee / plywood | 1: reads as brass rods, but as CG instancing | 1: sand yes, metal no (scanlines) | 0 |
| 7 | Detail at 100 % | 0: grain mosaic, voxel steps, low-res plaster | 0: same | 0: streak aliasing, stair-stepped edge, mosaic | 0 |
| 8 | Originality | 1: Shadowmatic and gallery-shadow-art lineage | 1: better, still known | 0 | 0 |
| 9 | Hero legibility | 1: trick given away, rabbit/airplane | 1: two of three figures misread, pale | 2: before/after obvious | 0 |
| 10 | Motion (unverified) | 1 | 1 | 1 | 1 |
| 11 | UI / type | 1: decent title, but `ALIGNMENT 100.0%` is a debug readout and the hint is illegible | 1 | 1: the Hz readout is the best HUD of the set | 1 |
| 12 | Polish | 0: no intro, sound or transitions | 0 | 0 | 0 |
| | **Total** | **9** | **10** | **12** | **5** |

The builder's claimed 16/16/12 is not supported by the pixels.

---
## Answers to the brief's questions
- **Highest ceiling in ~6 h:** Shadow Foundry, wire variant, *if and only if* the authoring loop ships in V1: draw three shadows and the machine forges one object. Experts get a live visual-hull solve (Mitra & Pauly 2009 is offline; I found no browser tool that does it live). Kids get a magic trick they performed themselves. Chladni has the better frame today but a lower ceiling.
- **What a hostile CD attacks first:**
  - **Foundry:** "a muddy room with two circular stage spots and grey ghost shadows; I can't tell what the shadows are, and I can't see where the light comes from."
  - **Chladni:** "a screensaver on a black void with scanlines on the metal."
  - **Lumen:** "a Christmas card under fog."
- **Weakest part of the chosen direction:** shadow legibility. That means figure design, contrast, scramble entropy and floor foreshortening. Everything else depends on it.
- **What makes it 2× more impressive:**
  1. Put the apparatus on screen: three physical lamp heads with **volumetric beams through haze that the rods visibly slice** (shadowed light shafts converging on the object). This gives leading lines, a focal point, and an instantly readable cause and effect.
  2. **Draw directly on the wall** and watch the brass re-forge live.

  The lamps, beams and live re-forge are what separate it from a demo, not more rods.
- **Architectural limits:**
  1. A 120³ binary voxel grid caps edge quality and re-forge speed. Hull membership is *separable*: a point is in the hull exactly when each of its three orthographic projections lies inside its mask. So drop the voxel grid entirely, march rods against 2D mask SDFs at 1024², and you get crisp edges and millisecond re-forging.
  2. Constant-kernel PCF with `radius = 1..8` gives a Gaussian smear, not a penumbra. Use PCSS (three.js has a PCSS example) or light-size-scaled multi-tap so penumbra width grows with the object-to-wall distance.
  3. There's no post pipeline, so no AO, no shader grain, no highlight bloom.
  4. All three lights also light the object from the axes, which flattens it. Add a non-shadow-casting key/rim on the sculpture only.
  5. `Math.random` plaster is non-deterministic and blurry (a 512² texture repeated twice over ~16 m).
  6. Everything lives in a single 200-line file. Split it into silhouettes / forge (Worker) / render / audio / choreography state machine before V1 grows.
- **Complexity mistaken for quality:** 5,200 rods, 3-pass marching-cubes smoothing, "262,144 grains", "6 cascades". None of these address what's actually visible: grain mosaic, spill light, figure design, a debug HUD, no sound, no choreography.

---
## TOP 10 changes for Shadow Foundry (priority order)
1. **Redesign the three figures and make them consistent; fix the scramble.**
   - **Cat:** sitting, in profile or 3/4 back view. Short, wide-set triangular ears (height ≈ 0.18 × head width apart). Clear neck notch. Long tail curling *away* from the body with a visible gap.
   - **Tree:** forked trunk, asymmetric lobed canopy with 2–3 sky holes (negative space).
   - **Floor:** not the cross-bird. Use a **swallow** (crescent swept wings, deeply forked tail) or a **butterfly**. Both survive grazing foreshortening.
   - Run the 1-D consistency pass from RESEARCH.md: shared Y extents between cat and tree, shared X between cat and floor, shared Z between tree and floor. Coverage must be **≥ 97 %** for each figure.
   - **Scramble:** choose by rejection sampling. Reject any pose within 35° of the 24 axis-permutation rotations. Reject any pose where a scrambled shadow has IoU > 0.35 with *any* target under 90° rotations or mirroring.
   - Optional expert easter egg preset: GEB-style letters, or 影 · 光 · 形.
2. **Lighting rig and value structure.** This is the 2× item.
   - **Walls:** lit only by their own projector. Remove the hemisphere light. The env map affects metal only (`envMapIntensity` on the rods, nothing on the walls). Room outside the pools ≈ #141210.
   - **Shadow:lit contrast ≥ 4:1 linear.** Shadows read near-black with a slight complementary tint.
   - **Lamp colours:** back wall warm 2700 K (#ffb877), left wall cool 5600 K (#cfe0ff), floor neutral 4000 K (#ffe9cf).
   - **Visible lamp heads** (ellipsoidal museum spots on a ceiling track or floor stands) with **haze beams** (half-res raymarched cones, 24 steps, sampling each spot's shadow map) so the rods cut dark streaks through the beams.
   - **Pools:** soft-edged with a gobo or lens-ring cookie, not perfect discs.
   - **Sculpture:** one non-shadow-casting rim light from top-back.
3. **Kill the cheap-looking cues.**
   - Replace the 256 px pixelated grain with **per-pixel blue-noise grain in a post shader** at 2–3 % amplitude.
   - Procedural plaster in the wall shader: triplanar fBm with fine normal relief that a grazing light reveals, at a minimum of 1 texel per screen pixel.
   - Delete the black skirting boxes. Use soft corner AO and a subtle plaster cove instead.
   - Proper MSAA or SMAA on rods.
4. **Camera and composition.**
   - Put the camera on the corner's (1, 0.8, 1) diagonal at about 30–35° elevation with FOV 28–32°, so all three planes are about equally foreshortened (≈ 0.58) and the floor figure stops collapsing.
   - Frame tight: the three pools take ≥ 65 % of the frame, the object sits at about 45 % of frame height, and beams converge on it.
   - Keep the composition symmetric. It's an icon, like the GEB cover. Break it with light colour, not off-centre placement.
   - Add a slow mouse-parallax camera drift of ±2°.
   - Mount the object on a thin blackened steel pin rising from a low plinth, so it stops floating. The pin's shadow below the cat reads as a stand.
5. **Rod sculpture art direction.**
   - 700–1,200 rods, **full-span** (maximal length inside the hull, minimum length 40 % of the hull diameter).
   - 3 gauges (1×, 1.6×, 2.5×). 12–16-sided rods with bevelled caps.
   - **Patinated brass:** base #8c6b3e, roughness varied per rod 0.3–0.6, about 10 % of rods polished (#e8c98a highlights) and about 5 % blackened steel.
   - Per-instance AO from depth inside the hull plus SSAO/GTAO.
   - Bias rod directions away from the three projection axes.
   - Replace the voxel `inside()` test with the separable 2D-mask SDF test.
6. **Make it solvable, and make solving feel like tuning.**
   - Turntable yaw plus a limited tilt (±40°) for presets 1–2. Full freedom only in later presets.
   - **Guidance gradient:** penumbra width and shadow darkness both follow alignment, so shadows get blacker and sharper as you approach.
   - **Audio:** two oscillators detuned by Δf ∝ misalignment. The beating slows to unison at the solution, so you *hear* yourself approach.
   - The snap basin grows after 20 s without success.
7. **Hero choreography and auto-intro.** The first-3-seconds wow has to happen without input.
   - **Load sequence:**
     - t = 0: black.
     - 0.3 s: lamp 1 *clunks* on.
     - 0.7 s: lamp 2.
     - 1.1 s: lamp 3. The beams appear, and the nest tumbles in, scrambled.
     - 1.5–4.0 s: it decelerates on an eased spring into alignment.
     - About 4 s: **LOCK.**
   - **Lock (≈ 350 ms):**
     - The lamp irises close, collapsing the penumbrae from about 30 px to 1 px, staggered 60 ms per wall.
     - Shadows darken from 70 % to 95 %.
     - A 3 % camera push-in.
     - A chord, one note per lamp, each panned toward its wall.
     - Dust in the beams freezes for 200 ms.
   - **After lock:** at +600 ms the gallery wall labels fade in. Hold 2.5 s. Then the nest "unlocks", drifts away, and the cursor affordance appears: "your turn".
8. **Authoring is part of V1, not a stretch goal.**
   - Click a wall to enter draw mode. You draw on the plaster itself as a charcoal stroke, and the lamp dims to work light.
   - The forge runs in a Worker: 2D SDF masks → consistency warp → rods. Re-forge < 500 ms on GPU.
   - Rods fly in and out on spring paths, staggered by distance, over about 1.2 s.
   - Show a "lost pixels" ember heat-map where the drawings contradict each other, then auto-warp.
   - Second-minute depth:
     - A gallery of 4 presets.
     - Drag a lamp and watch its shadow slide and distort, which proves the projection is real.
     - Share via URL hash.
9. **Sound design (WebAudio, procedural, starts on first gesture).**
   - Lamp clunk: low thump plus filtered noise tick.
   - Rotation friction: band-passed noise ∝ angular velocity.
   - Tuning beat, as in item 6.
   - Lock chord: warm triad with a long tail.
   - Re-forge: tinkling metal ticks, granular, one per rod landing, rate-limited.
   - Small mute glyph.
10. **HUD and typography inside the world.**
    - Delete `ALIGNMENT 100.0%` and the bottom hint line.
    - Replace them with **museum wall labels** projected *in the light pool* under each shadow at solve, e.g. "貓 Cat · No. 1", plus one corner label: "影鑄 Shadow Foundry — No. 1 · brass, 1,024 rods · 99.1 % shadow fidelity". The fidelity figure is the expert detail.
    - Self-host one real typeface pair (e.g. Cormorant Garamond plus Noto Serif TC subset). Never fall back to Georgia.
    - Move away from the all-caps 0.3 em tracking that every prototype here shares. It's the template giveaway.

---
## V1 acceptance tests (the builder must pass these and attach evidence)
- **T1 Stranger naming:** show the solved frame (1920×1080, all text hidden) to ≥ 3 *fresh, context-free* vision subagents, each asked "what do you see on each wall/floor?". All three figures must be named correctly on the first guess in ≥ 3/3 runs. Each shadow crop on its own must also be named correctly.
- **T2 Before/after:** shown the scrambled frame alone, no run names any target figure. Shown the pair, every run describes "the shadows became pictures / the object made the images" without being prompted.
- **T3 Contrast:** linear luminance ratio between each shadow and the adjacent lit pool is ≥ 4:1, measured in a script on the solved frame and logged.
- **T4 Fidelity:** coverage is ≥ 97 % for all three preset figures. At 100 % crop, shadow-edge stair steps are ≤ 1 px. Grain sits at pixel scale with no mosaic.
- **T5 Thumbnail:** at 320×180 the three shadows are still identifiable and the object is the focal point (highest local contrast within the central third).
- **T6 Scramble entropy:** IoU between each scrambled shadow and every target (including 90° rotations and mirrors) is ≤ 0.35.
- **T7 Solvability:** a scripted naive solver that follows only the on-screen and audio guidance signal solves preset 1 in ≤ 60 s of simulated interaction. The auto-intro reaches LOCK in ≤ 5 s after load without input.
- **T8 Hero filmstrip:** an 8-frame strip from lock −400 ms to +1,000 ms shows the staggered penumbra collapse, the darkening and the labels appearing.
- **T9 Authoring:** scripted drawings (star / heart / letter A) re-forge in ≤ 1 s on GPU (≤ 10 s SwiftShader is acceptable for CI) with ≥ 95 % coverage after auto-warp. Screenshot the result.
- **T10 First 3 seconds:** the frame captured at t = 3 s with no input shows lit lamps, visible beams and the object in motion, not black and not loading.
- **T11 Tech:** zero console errors on the public URL in a fresh session. ≥ 50 fps at 1920×1080 on a mid-range GPU (state the device honestly). Audio starts only after a gesture.
- **T12 Honest score:** ≥ 15/24 at V1, scored by an independent reviewer, with criteria 8 and 9 both ≥ 1. The final needs ≥ 20 with 8 and 9 = 2.

## Process note
Phase A+B took 23 minutes of a 2-hour budget, and every prototype stopped at about the first frame that rendered without errors. The brief's own lesson ("converged too early with low self-acceptance bar") applies here as written. Use the remaining ~75 min of exploration budget on the four look-dev items above, rendering and A/B-testing each one against T1–T5, before writing V1 architecture.
