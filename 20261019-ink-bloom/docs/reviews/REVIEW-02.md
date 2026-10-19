# REVIEW-02 — Independent adversarial review of V2 墨華 Ink Bloom (Pass 1)
Reviewer: independent subagent (Hostile Creative Director + Principal Engineer). No project code was edited.
Date: 2026-10-19, review started 12:03 TPE (UTC+8).

**What was reviewed.** The live root URL and `/v2/`. Their `main.js` files are byte-identical to `v2/main.js` (showroom d367a7c).

**Protocol.** Same as REVIEW-01:
- Headless Chrome with SwiftShader at 1920×1080, DPR 1.
- Deterministic frames from the live URL with `?shot=T&tw=768`; 768 is the high-tier tracer count a real GPU gets.
- One long real-time live session, a deterministic repro for a bug found in it, and a SwiftShader per-pass timing run.

All evidence is in `reviews/assets-02/`.
- Overview: `contact-sheet.jpg`
- Before/after against REVIEW-01: `before-after-v1-v2.jpg` and `thumbs-v1-v2.jpg`
- Live session: `live-sheet.jpg`

**Console and loading.** 0 errors, 0 warnings, 0 page errors, HTTP 200 and no failed requests, in all sessions.

## Before / after vs assets-01 (what Pass 1 actually bought)
| Aspect | V1 (assets-01) | V2 (assets-02) | Verdict |
|---|---|---|---|
| Ink at 100 % | Visible stipple, neon rims (`../assets-01/crop-bell-t11.jpg`) | Continuous dye with deep cores and soft veils; no dots (`crop-bell-t11.jpg`) | **Fixed.** Fix 1 met. Slightly soft: one voxel ≈ 4–5 px. |
| Scale / framing | ≈ 50 % of frame height, empty upper third, collides with UI | ≈ 70–75 % of height, centred, clear of UI (`hero-t11/16.jpg`) | **Fixed** in shot frames. |
| 200 px thumbnail | "Small blue squiggle on white" | A dark chandelier inside a frame that reads immediately (`thumbs-v1-v2.jpg`) | **Big gain.** |
| Tank / depth | None | Raymarched box, side panes, floor slab, glass edge rods | **Partly fixed.** It now reads as a white box room or gallery booth, not an aquarium (see #5). |
| Colour | Ultramarine; mixes go near-black | Real indigo navy. Carmine is (242,1,2) and gamboge (251,222,1): clipped sRGB primaries | **Traded** one problem for another (see #3). |
| Persistence | 5th drop erased the 1st | Tank memory: all 7 blooms persist with 0.4 s gaps (`spam7-t16.jpg`) | Fixed only at ≥ 0.38 s between clicks. **New P0 bug below.** |
| Stir | Barely visible | Drags the trail into a calligraphic S-curve (`live-stir-4s.jpg`, `crop-live-stir-4s.jpg`) | **Much better.** This is the best new interaction surface. |
| First screen | Empty ivory field | Empty grey box room with a 6 px bead (`live-first-0.7s.jpg`, `hero-t0.3.jpg`) | **Not fixed** (fix 5, known). |
| Trail | Rigid carrot / arrowhead | The same carrot, now in navy (`crop-trail-t11.jpg`) | **Not fixed.** |

## P0 bug found — drops clicked < 0.38 s apart disappear (live-reproduced and deterministic)
- **Live repro.** I clicked 7 times, 230 ms apart, with inks 1–5. After 12 s of sim time only the first indigo bloom exists (`live-spam-12s.jpg`).
- **They come back later.** After pressing R, S and dropping a new held drop, the stuck carmine, gamboge and sumi beads suddenly fall instead. My own held drop never appears (`live-salt-hold-11s.jpg`).
- **Deterministic repro.** Drops at t = 0 / 0.2 / 0.3 s give only one bloom (`bug-doubleclick-t6.jpg`). The control with 0.45 s gaps gives all three (`control-0.45s-gap-t6.jpg`). The builder's 7-drop spam test used 0.4 s gaps, just above the threshold, which is why it passed.
- **Cause.**
  - `release()` computes `slot = dropCount % SLOTS`, but `dropCount` only increments in `spawn()`, when the bead reaches the water about 0.376 s later.
  - So every drop released during one bead's fall gets the same slot.
  - The first spawn sets `slotFade[slot] = 1, slotTarget = 1`. Every queued drop then waits for `slotFade <= .02`, which never happens.
  - The queue is FIFO, so all later drops are blocked too, until R sets the targets to 0.
  - R does not clear `falling[]`.
- **Fix.** Assign the slot at release (increment a `releaseCount`), or allocate it in `spawn()`. Never gate the queue head on a slot that is filling. R must clear `falling`.
- **Why it matters.** This is exactly what a child (or an excited adult) does first: click-click-click. Right now their drops silently vanish.

## Scores — Benchmark v5 (0–2, rendered frames only)
| # | Criterion | V1 | **V2** | Evidence |
|---|---|---|---|---|
| 1 | Focal point & composition | 1 | **2** | The camera fits the cascade to ≈ 70–75 % of height and centres it (`hero-t11/16`, both mixes). The thumbnail reads. Caveats: in the live spam session the framing drifted and cut the bloom at the left pane (`live-spam-12s.jpg`); the title text is crossed by the left glass rod (`crop-title-panel.jpg`). |
| 2 | Value structure | 1 | **2** | Deep navy cores (darkest ≈ (1,6,24)) on light grey, with real mids in the veils. Holds at 200 px. The box-room greys are a flat mid-band, the remaining weakness. |
| 3 | Palette & colour script | 1 | **1** | Indigo is now right. Carmine hits (242,1,2) and gamboge (251,222,1), saturation 1.0: highlighter and poster paint, not pigment in water. Mixed hues are rare: violet is 4.1 % of ink pixels in the indigo+carmine frame, green 4.0 % in indigo+gamboge, orange 6 % in carmine+gamboge. Where violet appears it is near-black ((20,14,37)). The 7-drop frame reads as a flag. Age dilution is not visible by t = 16. |
| 4 | Light behaviour | 1 | **1** | Absorption, forward scatter and self-shadow exist and the cores darken believably. But there is no visible backlit glow-through at thin edges, no caustics, no light on the floor. The environment is evenly lit grey. The physics is there; the light design is not. |
| 5 | Depth | 0 | **1** | A box in perspective with side panes and floor gives space. But it reads as an empty room or booth (back wall plus two "walls" plus ceiling band). The glass edges render as chrome poles (`crop-tank-edge-right.jpg`). No refraction of the room or table through the panes, no DoF or atmospheric depth, and the ink sits flat against the back wall. |
| 6 | Material identity | 1 | **2** | Indigo ink in water is unmistakable at a glance: veils, cores, rolled rims (`crop-bell-t11.jpg`). The glass and water themselves still fail: poles, flat panes, no meniscus read. |
| 7 | Detail at 100 % crop | 0 | **1** | Stipple is gone. But it is soft (slightly out of focus), the low tier shows faint drawn contour lines from the thread layer (`crop-gen2-t11-tw512.jpg`), and the carrot trail is unchanged. The surface band shows blurred upside-down blobs (TIR) that read as smears (`crop-surface-spam7.jpg`). |
| 8 | Originality | 1 | **1** | It no longer looks like a particle demo. But "grey box room plus coloured ink chandelier" is not yet a signature image, and ink-in-water renders exist. The salt umbrella (`salt-t11.jpg`) is the most original silhouette in the build, and it is hidden behind a chip. |
| 9 | Hero legibility (kids) | 1 | **1** | Unlabelled, the pair is an empty box → ink chandelier: "someone poured ink". The *drop → branching* transformation is not readable because the "before" has no visible drop or pipette, and the split happens ~3 s in, at small scale. |
| 10 | Emergent response | 1 | **1** | Stir is now genuinely good: calligraphic curls. Salt is a real phenomenon, and tank memory works. But the drop-queue bug kills rapid input, and every drop produces a near-identical silhouette (compare the two bells in `mix-indigo-carmine-t14.jpg`, or the 7 in `spam7-t16.jpg`): by drop 3 it feels canned. |
| 11 | Motion quality | 1 | **1** | Weighted, eased camera; slow travelling cascade. Still one tempo: no entry beat, no splash, a rigid trail. Not verifiable live at 2–3 fps (and the low tier updates the volume every 3rd frame, which will judder on weak GPUs). |
| 12 | Polish / UI in world | 1 | **1** | The left frosted panel is tidy but is a generic UI card overlapping the glass; the sumi dot is invisible on it. Title clipped by a pole. No pipette, no intro. The P0 queue bug. |
| | **Total** | **10** | **15 / 24** | +5. A real Pass 1, not cosmetic. #8 and #9 are still 1, which is the gate for final. |

## Salt toggle (X3)
`S` and the 鹽層 chip both work (live `OPT.salt` = 1.15). The ring stalls at ~60 % depth and spreads into a wide umbrella with curled rims. Multi-colour salt drops make a layered skirt (`live-salt-hold-11s.jpg`).
- It is the most surprising image in the piece, but it is undiscoverable: a checkbox called "salt layer" means nothing to a child. Nothing in the tank shows that a layer exists, apart from a near-invisible schlieren shimmer.
- **Make the layer visible and physical.** Show a faint refractive shimmer band where the background bends. Better, let the user *pour* it: hold S, or drag a salt spoon, and a heavy cloud sinks and settles into a visible layer. Ink parked on it reads as a horizon.

## Kids test
- **Gasp?** At 0–3 s, no: grey box, tiny bead. At ~10 s a mild "whoa, a jellyfish / upside-down tree". The 7-colour spam (when it works) gives a delighted "rainbow!" and the salt umbrella gives "a mushroom!". The stir curl is the moment a child would get excited, because *they* made the shape.
- **What they try, and what happens:**

| Kid move | What happens now |
|---|---|
| Click-click-click | Drops vanish (P0) |
| Scribble / stir | Calligraphic curls (good, but only the trail visibly bends; the bells barely respond) |
| All the colours at once | Flag-like bands with dark muddy overlaps, not new colours |
| Hold for a giant drop | A wider chandelier (good) |
| Toggle the salt chip | Nothing visible until the next drop |
| R | Gentle fade (good) |

## Performance — architectural risk? Moderate on integrated GPUs, not a blocker on discrete GPUs.
**Cost structure, high tier** (what any non-software GPU gets, from code):
- **Tracer advection.** TW = 768, so 590 k tracers per step. Each loops over the live rings (up to 192) with a distance cull; only nearby rings run 24-segment Biot–Savart. That is about 2–4 GFLOP per step, at 1 step per frame at 60 fps.
- **Volume splat.** 590 k × 2 instanced points into a 3072×1536 RGBA16F atlas (384×256×48 voxels = 4.7 M texels), plus a full-atlas memory composite.
- **3D blur.** 3 separable passes × 4.7 M texels × 7 taps ≈ 99 M fetches. Writes plus cached reads ≈ 0.3–0.9 GB of traffic per frame. At 60 fps that is 20–55 GB/s, **the dominant iGPU risk**: LPDDR is shared at about 60–100 GB/s.
- **Light volume.** 128×88×32 × 26 steps: trivial.
- **Scene raymarch.** Full-screen, up to 3 segments (TIR bounces), ink march ≤ 190 steps (step 0.0085) clipped to the ink AABB, 4 fetches per step. Render size is 1920×1080 × DPR up to 1.25², i.e. 3.2 M px.
- **VRAM.** About 160 MB (4 atlas buffers of 38 MB each, plus the rest): fine.

**Measured on SwiftShader, 1920×1080:**

| Config | Median frame |
|---|---|
| High tier (`low=0`) | 2650 ms |
| High tier, volume passes skipped (`pskip=2`) | 2030 ms |
| High tier, thread layer off | 2420 ms |
| Low tier, RS .42 | 217 ms |

- The volume passes cost about 0.6 s and thread splat plus blur about 0.23 s.
- **The scene raymarch with almost no ink on screen costs about 2.0 s.** The tank/background shader itself is the biggest consumer, not the ink.

**Estimate.** I applied a conventional SwiftShader→GPU speed-up of about ×100–200 for a mid discrete GPU and about ×15–30 for an iGPU. This is an estimate, not a measurement.
- **Discrete GPU** (RTX 3060 / RX 6600 class) at 1080p: about 8–18 ms, i.e. 55–60+ fps. Fine.
- **iGPU** (Intel Iris Xe, Apple M1 base) at 1080p × DPR 1.25: about 40–90 ms, i.e. 11–25 fps, before adaptation.
  - Adaptive RS (floor 0.5) only shrinks the scene pass.
  - The 384×256×48 volume and 590 k tracers are not tiered for real hardware. LOW triggers only for software renderers.
  - Expect about 20–30 fps on a MacBook Air.

**Verdict.** No architectural rework is needed, but **tiering is wrong-shaped**:
1. Use `EXT_disjoint_timer_query_webgl2` (or the rAF median in the first 2 s) to pick a tier for real GPUs too. The mid tier should be the LOW grid with TW 512, volume update every 2nd frame.
2. Make the tank/background cheap. Pre-render or analytically shade the static box into a texture once per camera move, and raymarch only inside the ink AABB. That is the 2 s in SwiftShader, and probably 30–40 % of iGPU time.
3. Cap the DPR at 1.0 for the raymarch on iGPU.

**Measure on real hardware before Pass 3.** A one-line `?fps` overlay is enough to ask anyone with a laptop.

## Answers to the brief's questions (V2)
- **Impress a stranger?** At 10 s, yes: the indigo chandelier in the tank is a good image. In the first 3 s, no.
- **Looks like a 30-min AI demo?** No longer in the hero frames. The grey box room, chrome poles and the floating frosted card still say "3D scene", not "photograph".
- **Is the identity distinctive?** The indigo frame is getting there. The multi-colour frames are not; they read as poster primaries.
- **Is the hero memorable?** The *structure* is, the *moment* is not: there is no visible drop or splash, and every drop looks the same.
- **What is the weakest part?** The opening 3 seconds and the environment art (box room). Then colour gamut. Then the P0 queue bug.
- **What would make it 2× more impressive?**
  - A real aquarium look: thin glass with refraction of a dark studio behind, darker surroundings with the tank as a lightbox, and a visible meniscus.
  - A pipette that drips on the first frame.
  - Per-drop variation.
  - Making stir the second hero: "write with ink" calligraphy.
- **Are there architectural limits?**
  - Per-drop morphology is near-deterministic.
  - The 4 volume slots plus a baked memory are fine.
  - Tiering only for software renderers (see perf).
  - The scene raymarch is spent on a static box.
- **Is it mistaking complexity for quality?** Less than V1. The volume work clearly paid. The remaining risk is spending Pass 2 on more switches instead of the opening, the environment and the verbs.

## Rework needed?
**No re-architecture or direction change.** Escalate Ink Bloom. Targeted fixes: one P0 bug fix plus environment re-art plus colour gamut. The Pass-1 render core (volume + thread layer + camera fit) is the right foundation.

## Top fixes, in priority order
### Pass 2 — Experience
1. **P0: fix the drop queue.** Allocate slot/dropCount at release, never block the queue head, and make R clear `falling[]`. *Acceptance:* `drops=…0;…0.1;…0.2;…0.3;…0.4;…0.5;…0.6` → 7 blooms at t = 8, plus a live test with 7 clicks 150 ms apart.
2. **Opening and entry beat (fix 5).**
   - Frame 1 shows a visible glass pipette or brush tip above the water at the cursor, with a bead swelling.
   - The auto drop lands by 0.5 s with a crown and ripple rings on a visible meniscus, and a short entrainment cavity.
   - Replace the carrot trail with a thin, wavering, beading filament.
   - The "before" frame of the kids test must contain the drop.
3. **Per-drop variation.** Seed lobe count k (4–7), tilt, initial asymmetry, entry speed (hold height) and size jitter per drop, so no two blooms match. Let the drop height (cursor y above the surface) control entry speed, which gives tighter or looser rings. That is a discoverable variable with a physical meaning.
4. **Promote stir to a verb.** The trail-curl is the most "I made this" moment. Make bells respond too (larger stir radius, line-vortex injection along the path), and give it a slow-motion trail of the stroke on the glass or a ripple. Consider "brush mode": drag at the surface lays a ribbon of ink (calligraphy 墨).
5. **Make salt discoverable and physical.** Pour or hold to lay a visible layer (shimmer band plus refraction offset of the background). Ink hitting it makes the umbrella. Drop the checkbox language.

### Pass 3 — Polish
6. **Environment re-art (kills the "box room").**
   - Dark, warm studio around a backlit tank that is the brightest object, with the corners falling to deep warm grey.
   - Glass as thin bright edge highlights plus refraction offset of the background and table seen through the panes. No chrome cylinders.
   - A visible meniscus line with TIR.
   - Floor: a soft caustic pool and the ink's contact shadow when it settles.
   - Move the title off the glass rod. Make the ink panel diegetic (small ink bottles on the table to the left of the tank, which also adds foreground depth) or make it vanish after first use.
7. **Colour gamut and mixing, plus perf tiers.**
   - Pigment absorbances must never hit saturation 1.0. Target carmine about (190,30,60) at full density, gamboge about (225,170,40), fading to tinted veils.
   - Tone-map in optical density per channel so overlaps become aubergine, green and orange at mid density (target ≥ 15 % of ink pixels showing a mixed hue in the two-ink frames).
   - Make age dilution visible by t ≈ 20 s.
   - Perf: timer-query tiering for real GPUs, a cheap static background, DPR 1 on iGPU, and a measured fps number in the final report.
