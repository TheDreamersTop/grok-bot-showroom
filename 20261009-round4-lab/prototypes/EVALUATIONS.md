# Phase B — Prototype evaluations (honest), 2026-10-09 rev. 3 (~07:57 TPE)

> **Rev. 3 changes (after the 07:35 critique "all three are ordinary"):** (1) a look-dev spike for A — **A2 "canyon
> postcard"** (`prototypes/canyon-postcard/`); (2) a 4th wildcard prototype — **D 龜裂 Dry Lake** (`prototypes/dry-lake/`);
> (3) re-scored comparison and an updated (still non-binding) recommendation. Rev. 2 text is kept below unchanged.
> Contact sheet: `shots/contact-sheet-phaseB-rev3.png`.

## A2 · Deep Time look-dev spike — "canyon postcard" (kill criterion: still a terrain tool at ~08:15 → say so)
Shots: before `shots/proto-deep-time-v4-sp.png` → after `shots/proto-deep-time-A2-postcard.png`, 100 % crop
`shots/proto-deep-time-A2-postcard-crop.png`, seed frame (t=0) `shots/proto-deep-time-A2-postcard-t0-seed.png`, unseeded
sim attempts `shots/proto-deep-time-A2-unseeded-network.png`, `shots/proto-deep-time-A2-unseeded-k1500.png`.
- **What changed (rendering):** no slab or void. A rim-level horizon view (fov 38) across a plateau; a sky with a
  gradient and sun glow; distant buttes in three haze layers; and a far plain continued past the sim domain (a ray–plane
  hit plus a procedural distant canyon network), so the world runs to the horizon. A **stair-step strata profile** is
  applied to the B-spline-interpolated height: hard layers become vertical cliffs and soft layers talus slopes, which
  gives the Grand Canyon "layer-cake" read from far away. A Coconino-cream / Redwall-red / mauve palette, desert-varnish
  streaks and cliff fluting. **Golden-hour key light** (sun elevation ≈11°, from the right) with warm bounce light inside
  the canyon and violet sky fill in shadow. **Sun shadows are computed once per frame as a sim-space texture (80-step
  horizon march) and sampled bilinearly, so the moiré is gone.** Water is a sky-reflecting ribbon (Fresnel) where log₂(drainage) > 6.5, so it
  only shows on real rivers. Mesh 1100² removes the triangle saw-tooth on cliff edges.
- **What changed (sim):** the same stream-power model (MFD accumulation, K·A^½·S/hardness, creep, talus) with a uniform
  drizzle and a fixed base level at the far edge, but **the main canyon and 9 tributaries are seeded procedurally**
  (a meandering centre line plus branching side canyons with ragged rims). The sim then runs 1,500 steps and adds the
  river network, gullies and rim erosion.
- **Kill-criterion verdict:** **not killed.** At thumbnail and full-frame size it reads as a canyon-country postcard
  (winding, branching canyon, stepped strata, river at the bottom, buttes on the horizon, warm/cool light), not a GIS tool.
  Harsh caveats: (1) at 100 % the walls read as **clay/plastic** with too-regular fine strata lines; there is no rock grain
  or talus debris. (2) The near-left mesas melt into blobs where creep rounded the terrace. (3) The far plain is a large,
  low-information band (≈30 % of the frame). (4) **Most importantly, the canyon is art-directed, not emergent.**
  Unseeded, the stream-power sim only makes shallow dendritic valleys in 3,000–4,000 steps (see the unseeded shots).
  So the "you are the rain → a canyon appears" causality, A's hero, is *weaker* in A2 than in v4.
- **Path to keep both:** the child's gesture lays down the river (drag = where the rain runs, or the time-lapse is
  driven by the user's rain path). The sim deepens that seed into a canyon over a visible deep-time clock, and the
  stair-step strata renderer makes any incision look like the Grand Canyon. Needs: rock micro-normal/grain, talus
  scree, varnish streaks from the rim downward, a smaller far plain, and a real-GPU speed test (the live page renders the
  postcard; SwiftShader live is ~0.3 fps, which says nothing about real GPUs).
- **Gesture test (07:59–08:02, `?gesture=1`):** I replaced the seeded canyon with only a 3-cell finger groove along the
  same path (what a child's drag would leave) and ran stream-power for 3,000 steps at K=300 and K=1200
  (`shots/proto-deep-time-A2-gesture-t0.png` → `-gesture-t3000.png`). **The groove did not deepen into a canyon.** Instead,
  the tilted plateau broke up into scattered stepped badlands near the camera. The knickpoint retreat from base level is
  ~20 steps per cell, and the talus pass fills the slot as fast as it cuts. Evidence for the open question: with today's
  model, a postcard canyon from the player's own gesture needs either a much faster incision scheme (multiple incision
  sub-steps per frame, implicit stream-power solver à la Braun–Willett, or a lower talus near channels) or an
  art-directed "deep-time" driver (base level lowered along the drawn path, with sim gullies on top). Fun side note:
  the t=0 groove frame, with the strata renderer, already looks like a slot canyon "drawn by a finger".
  Follow-up (08:05): K=3000/tal 6 and K=8000/tal 8 give **the same picture** (`-gesture-k8000-tal8.png`): dendritic
  side gullies grow along the groove (pretty, "Painted Desert" badlands), but there is still no deep trunk canyon. So the
  limiter is the explicit scheme (each cell may only drop to its lowest neighbour per step, so incision travels upstream
  at ≤1 cell/step and the depth gain per step is small), not the erodibility. An implicit O(N) stream-power solver
  (Braun & Willett 2013), or several incision sub-steps per frame along the steepest-descent tree, is the real fix.
- **Scores (A2):** Focal 1 · Value 2 · Palette 2 · Light 2 · Depth 2 · Material 1 · Detail 1 · Originality 1 · Hero 1 ·
  Emergent 1 · Motion 1 · Polish 1 → **16/24** (v4 was 12). Originality stays 1: art-directed canyon renders exist in
  terrain demos. The originality claim lives in the *deep-time causality*, and this spike didn't prove that.

## D · 龜裂 Dry Lake — wildcard: draw in wet mud, and the drying ground redraws your gesture as cracks
Shots: `shots/proto-dry-lake-t0.png` (spiral drawn in wet mud), `shots/proto-dry-lake-t520-front.png` (sun drying front
sweeping across), `shots/proto-dry-lake-t1000-full.png` (dried: crack network traces the spiral), 100 % crop
`shots/proto-dry-lake-t1000-crop.png`, live test `shots/proto-dry-lake-live-wave.png` (synthetic pointer drag of a sine
wave, then release: cracks re-draw the wave).
- **Idea / physics:** pastes have **memory** (Nakahara & Matsuo 2005–2011; Ooshida's continuum model): stir a wet
  paste and its later desiccation cracks align with the flow you gave it. A child stirs the mud with a finger, the sun
  dries it, and the ground "remembers" and redraws the swirl as cracks. Experts get T-junction hierarchy plus the
  memory effect, a real and little-known result.
- **Core effect (working):** CPU sim on a 4-px cell grid. Moisture field dries (faster near crack edges, much faster
  under the cursor "sun" when the button is up). Tensile stress = dryness. Cracks nucleate where
  stress·(distance to nearest crack)/L_c(dryness) > local random strength, which gives the hierarchy: early long cracks,
  later ones subdividing plates. Tips random-walk and are steered toward the **stored flow orientation** (a doubled-angle
  tensor field written by your drag). A tip stops at another crack (T-junction) or in still-wet ground. Cracks are drawn
  as vectors at screen resolution, widen with age and generation, and feed a shader (mipmap blur = proximity field) for
  curled plate rims, deep slots, a sun-side shadow, and a wet sheen with sky reflection and glints.
- **Child test:** passes on the first try. "I drew a spiral in the mud and the cracks made my spiral." The before/after pair needs no text.
- **Originality check (harsh, web search ~07:52):** drying-mud crack sims **already exist**: Emergent Mind Labs
  *Drying Mud* (canvas spring lattice, T-junction hierarchy, rewet brush suggested), helpmarq *Crack Polygon Order*
  (an installable component with primary/secondary/tertiary cracks and a rewet cycle), Steven Abbott's crack simulator,
  and a Three.js "expanding cracked floor" tutorial. **The base effect is a commodity (0).** I found no interactive
  memory-of-flow piece (only papers), so the twist is new. → **Originality 1**, and it can reach 2 only if the gesture → memory
  → cracks loop is the whole show.
- **Weak (harsh):** a flat, top-down 2D plane, so Depth is 0. At 100 % the plates look like **embossed ink or woodcut**
  more than clay (uniform dark slot fill, no plate thickness, no lifted flakes, no per-plate colour). It is sepia
  monochrome. Wet mud reads as smooth grey-brown clay, not a glossy puddle. There is one verb, plus waiting.
  Physics caveat: papers disagree on the flow-memory sign (Nakahara: cracks parallel to flow for water-poor pastes;
  Ooshida's model: perpendicular, as for vibration). I implemented "parallel", which is the more legible choice.
- **Ceiling:** medium-high for emotion, low for world-building. Possible additions: a low-angle 3D view of the plates
  catching the golden sun, rain re-wetting and healing the cracks (and a second drying showing the memory twice),
  footprints and birds, plates curling and flaking, a whole dry lakebed (Uyuni hexagons) or a terraced paddy at sunset.
- **Scores (D):** Focal 2 · Value 1 · Palette 1 · Light 1 · Depth 0 · Material 1 · Detail 1 · Originality 1 · Hero 2 ·
  Emergent 2 · Motion 1 · Polish 0 → **13/24**.

## Comparison (rev. 3)
| Criterion | A v4 (07:35) | **A2 postcard** | B Plateau | C Frost Window | **D Dry Lake** |
|---|---|---|---|---|---|
| 1 Focal | 2 | 1 | 2 | 2 | 2 |
| 2 Value | 1 | 2 | 1 | 2 | 1 |
| 3 Palette | 1 | 2 | 1 | 2 | 1 |
| 4 Light | 1 | 2 | 1 | 1 | 1 |
| 5 Depth | 1 | 2 | 1 | 1 | 0 |
| 6 Material | 1 | 1 | 2 | 2 | 1 |
| 7 Detail @100 % | 0 | 1 | 1 | 0 | 1 |
| 8 Originality | 1 | 1 | 1 | 0 | 1 |
| 9 Hero legibility (kids) | 1 | 1 | 1 | 2 | 2 |
| 10 Emergent | 2 | 1 | 1 | 2 | 2 |
| 11 Motion (prov.) | 1 | 1 | 1 | 1 | 1 |
| 12 Polish | 0 | 1 | 0 | 0 | 0 |
| **Total** | 12 | **16** | 13 | 15 | **13** |

Nobody has #8 = 2 yet. Only C and D have #9 = 2.

## Recommendation (mine, rev. 3 — the independent reviewer decides)
Still **A**, now with the A2 art direction as the visual target, *on one condition the reviewer should check*: Phase C
must prove that the canyon the player sees comes from the player's own gesture. That means the drag lays down the river
course, deep time deepens it, and the stair-step strata renderer makes it look like a postcard. If that can't be shown in
the first hour of Phase C, A2 is "a pretty canyon render" (Originality 1, Emergent 1) and A's case collapses.
**D** is the best *child moment* found so far (the gesture comes back as cracks) and has a real, little-known physics
idea. But its base effect is commodity, its look is 2D and monochrome, and its world is small. Pick D if the reviewer
values a crisp, surprising causal loop over world-scale beauty. In that case, Phase C should start with a low 3D view
and real clay material.

## Open question for the reviewer
Is it acceptable that A's canyon is *seeded by the player's drag and then deepened by the sim* (honest, but the shape is
partly authored), or does Deep Time need a fully emergent canyon (which my sim can't yet produce at the depth that makes
the postcard)?

---

# Rev. 2 (07:35 TPE, kept for history)


## A · 雨刻 Deep Time — erosion diorama
Shots: `shots/proto-deep-time-v2-t0.png` (before), `shots/proto-deep-time-v2-t5000.png` (after), `shots/proto-deep-time-v2-crop.png`; v1 history `proto-deep-time-t0/-t4000*.png`.
- **Works:** real GPU erosion: virtual-pipe shallow water (Mei et al. 2007) + sediment capacity/erosion/deposition + semi-Lagrangian sediment advection + strata-dependent hardness + thermal slippage, 256², 4 passes/step. Hold mouse = rain under the cursor; water finds its own path off the tilted tableland and cuts an orange gorge that exposes strata; block-diagram side walls show the strata column; IQ-style key/sky/bounce lighting, heightfield soft shadows, tilt-shift.
- **Weak (harsh):** the hero is *not yet* a "layer-cake canyon" — after 5,000 steps the gorge is 6–10 cells deep and blobby; cliffs show nearest-neighbour stair-steps; water renders as noisy white/blue shards; cream sand deposits mottle the escarpment; the tilt-shift blur hides detail; parameters are resolution-dependent and fiddly (I needed 4 iterations to stop flute artifacts and sheet-stripping). The diorama reads as "terrain tool" more than as an art piece.
- **Ceiling:** highest. 3D world with many verbs (rain, uplift, time speed, plant forest, sea level, seasons/glaciers), deep time is an emotional idea, experts respect real erosion; Taiwan/Taroko angle possible.
- **Scores:** Focal 1 · Value 1 · Palette 1 · Light 1 · Depth 1 · Material 1 · Detail 0 · Originality 1 · Hero legibility 1 · Emergent 2 · Motion 1 · Polish 0 → **11/24** (v2, pipe model).
- **v4 (rev. 2): stream-power model** `?model=sp&kc=200` — shots `shots/proto-deep-time-v4-sp.png`, `shots/proto-deep-time-v4-sp-crop.png`
  (scripted rain on the summit at (.5,.5) r .07, 4,500 steps, camera cr 1.5 / el .62). Per step: multiple-flow-direction
  drainage accumulation (one Jacobi sweep, slope^1.3 weights, 72 texture reads) → erosion E = K·hardness(stratum)·(A−A₀)^0.5·S,
  clamped so a cell never drops below its lowest neighbour (no pits) → hillslope creep → existing talus pass; rivers are
  drawn where log₂A exceeds a threshold, and sediment builds a fan where accumulated flow meets the sea.
  **Result:** the first frame that reads as "a canyon": a stepped amphitheatre with orange/cream strata terraces cut out of
  the plateau, with branching tributaries (k=200 at the old rain spot showed clear dendritic headward branches,
  `r4tools/tmp/sp_k200*.png`). It is more stable and less resolution-fiddly than the pipe model (3 iterations to a good frame).
  **Still weak:** heightfield-shadow moiré on the slopes (worst Detail problem), the summit is a soft dome, not a crisp mesa;
  the crust texture is muddy camouflage; the sea is a translucent slab; channels have no visible running water yet in this
  frame; strata bands are too clean/synthetic at 100 %. The v4 hero follows the pre-seeded drainage line — needs to come
  more from the user's rain.
  **v4 scores:** Focal 2 · Value 1 · Palette 1 · Light 1 · Depth 1 · Material 1 · Detail 0 · Originality 1 · Hero 1 · Emergent 2 · Motion 1 · Polish 0 → **12/24**.

## B · 皂膜 Plateau — soap-film catenoid that snaps
Shots: `shots/proto-plateau-v2-catenoid.png`, `shots/proto-plateau-pinch.png`, `shots/proto-plateau-snapped.png`, strip `proto-plateau-strip.png`.
- **Works:** exact catenoid (larger root of a·cosh(h/2a)=R), snap at the Goldschmidt/stability limit h/R ≈ 1.3255, 0.18 s pinch then two shivering drum films; spectral thin-film interference (24 wavelengths, analytic CIE fit, n=1.33, angle-dependent); 384² film-thickness advection with gravity drainage, two octaves of curl "Marangoni" swirl and a breath swirl under the cursor; studio env with soft boxes; polished wire rings.
- **Weak (harsh):** reads as an abstract iridescent glass tube more than "soap"; colour is everywhere rainbow (iridescence shaders are common — Originality risk); the pinch interpolation is a fake (film over-hangs the rings mid-snap); no transmission/refraction, no shadows, dark-studio look flirts with "black canvas demo"; drum films after the snap look like CDs; interaction is essentially one slider (separation) → one event.
- **Ceiling:** medium. Beautiful material, a crisp physics moment, but thin as a world; expansion (other wire shapes, Möbius film, foams) is math-heavy and less child-readable.
- **Scores:** Focal 2 · Value 1 · Palette 1 · Light 1 · Depth 1 · Material 2 · Detail 1 · Originality 1 · Hero 1 · Emergent 1 · Motion 1 · Polish 0 → **13/24**.

## C · 霜窗 Frost Window — frost grows around what you draw
Shots: `shots/proto-frost-window-v2-t0.png` (heart drawn in fog, frost seeding at frame), `shots/proto-frost-window-v2-t900.png`, `shots/proto-frost-window-v2-crop.png`; v1 `proto-frost-window-t800.png`.
- **Works:** stochastic anisotropic (six-fold, per-crystal orientation) attachment driven by a diffusing, depleting vapour field fed by the fog film → fern/feather dendrites that look like real window frost, emerging from the cold frame; warm-finger stroke wipes fog and melts ice, frost cannot cross the cleared line, so the drawing ends up framed in crystal; procedural night village with warm windows seen sharp through the line and as warm glow scattered through frost; mullion on the thirds line.
- **Weak (harsh):** at 100 % the frost is cell-grid pixel noise (640×360 sim upscaled, hash sparkle per cell); frost becomes a uniform white blanket after ~1,000 steps (needs density control/seasonal stop); the village is mostly hidden; window frame is a flat brown rectangle; the "night window + bokeh" setting is adjacent to BigWings' *Heartfelt* Shadertoy (template risk, though the growth mechanic is new); it is 2D — depth comes only from blur.
- **Ceiling:** high for emotion and the kids test; medium for interaction depth (draw, breathe, tap-to-nucleate, sunrise melt with running droplets, the room behind you reflected in the glass) and for expert depth (DLA / Gravner–Griffeath-style growth is respected but less "hard" than erosion).
- **v3:** `shots/proto-frost-window-v3-t900.png`, `-v3-crop.png` — sub-cell display field removes pixel noise, but the feathers now look blobby rather than needle-like.
- **Scores (rev. 2):** Focal 2 · Value 2 · Palette 2 · Light 1 · Depth 1 · Material 2 · Detail 0 · Originality **0** (was 1, see originality check) · Hero 2 · Emergent 2 · Motion 1 · Polish 0 → **15/24**.

---

## Originality check (rev. 2, web search 2026-10-09)
- **C Frost Window — near clones exist as ready-made web components:** helpmarq *Rime Creep* (shadcn component: dendritic
  window frost on a 60° lattice, growing tips, warm fingertip melts it), Canvas UI *Frost* (hover melts, frost refreezes),
  CrazyGL *Frosted Typography*. Plus BigWings' *Heartfelt* for the night-window-bokeh setting. C's central verb (finger
  melts frost, frost regrows) is already a component that anyone can install. → Originality 0; the hardest path to 2.
- **B Plateau:** Princeton (Vanderbei) WebGL catenoid demo already shows ring separation → collapse into two discs;
  mysimulator.uk has soap-film/thin-film demos. Ours is prettier, but the event is the same. → Originality ≤1.
- **A Deep Time:** erosion *tools* exist (keepitwiel erosion-sim, LanLou123 WebGL-Erosion, Gullywash terrain painter,
  tessapower's erosion), plus 2D "Shader Strata" background components. I found **no** art-directed experience where
  *you are the rain* over deep time in a strata block-diagram diorama. → Originality 1 with a credible path to 2
  (deep-time framing, strata reveal, layer-cake block diagram, time scale, Taroko angle).

## Comparison (rev. 2)
| Criterion | A Deep Time (v4 sp) | B Plateau | C Frost Window |
|---|---|---|---|
| 1 Focal point | 2 | 2 | 2 |
| 2 Value structure | 1 | 1 | 2 |
| 3 Palette | 1 | 1 | 2 |
| 4 Light behaviour | 1 | 1 | 1 |
| 5 Depth | 1 | 1 | 1 |
| 6 Material identity | 1 | 2 | 2 |
| 7 Detail @100 % | 0 | 1 | 0 |
| 8 Originality | 1 | 1 | **0** |
| 9 Hero legibility (kids) | 1 | 1 | 2 |
| 10 Emergent response | 2 | 1 | 2 |
| 11 Motion (provisional) | 1 | 1 | 1 |
| 12 Polish | 0 | 0 | 0 |
| **Total** | **12** | **13** | **15** |
| Ceiling in 6 h | highest (3D world, many verbs) | medium | high emotion, but originality capped |
| Main risk | making erosion *look* art-directed; shadow moiré; sim time on slow GPUs | thin interaction, existing demos | component clones (Rime Creep, Canvas UI Frost) |

Note: #8 and #9 must both reach 2 in the final. C has #9 but its #8 is blocked by existing components; A must earn
both, but nothing blocks it.

## Recommendation (mine, rev. 2 — the independent reviewer decides)
**A · Deep Time (stream-power model)**. Today it scores below C on first-frame beauty (12 vs 15), but it is the only
one of the three with a defensible path to Originality 2 *and* the highest ceiling: a 3D world where a child holds the
mouse to rain and watches a canyon with layer-cake walls appear, and an expert sees a real landscape-evolution model
(drainage accumulation, stream-power incision, strata hardness, hillslope creep). The v4 run shows the hero is reachable:
a stepped strata amphitheatre emerged in 4,500 steps. Phase D must fix: shadow moiré (blur/low-res shadow map or
cone-traced AO), crisp mesa caprock, running water in channels, river-to-sea delta, richer strata (thickness variation,
a hard caprock), a visible time scale ("1 second = 10,000 years"), and a second verb (uplift/tilt, sea level).

**C · Frost Window** is the prettiest *frame* and passes the kids test, but it was demoted: the core verb already exists
as installable web components, so it would read as a re-skin. Pick it only if the reviewer values first-frame beauty
over originality.

**B · Plateau** — not picked: beautiful material, thin experience, and the event already exists as a math demo.

## Open question for the reviewer
Can A's riskier 3D deep-time world be made art-directed (not "terrain tool") in Phases C–D, or is the beautiful but
cloned C, or the thin B, the safer bet? My bet is A, because originality is a hard gate and A's weakness (rendering
polish) is fixable, whereas C's (prior art) is not.

---

# Rev. 3b (08:20 TPE) — Open question settled: can the player's gesture make the canyon? → **Fully emergent is feasible in V1.**

Prototype: `prototypes/canyon-gesture/` (A2 renderer, new CPU solver `spl.js`; `canyon-postcard/` untouched).

**Solver (Braun & Willett 2013, n = 1), 256², CPU, single thread.** Per step: priority-flood fill (Barnes 2014, ε) → D8 steepest receivers on the filled surface → stack by donor DFS from the base-level row → drainage area by reverse stack (with per-cell rain weight) → implicit incision in stack order `h ← (h + F·h_rec)/(1+F)`, `F = K·k(stratum)·dt·A^m/dx`, m = 0.5, only where A ≥ Ac (channel head) → two threshold-slope sweeps (Sc, cliff retreat). Uplift U = 0.1/yr-unit everywhere except the far-edge base-level row (h = 0). Strata alternate hard (k = 0.35) / soft by elevation + dip. Final params: K 0.004, Ac 60, Sc 2.2, dt 2, 210 steps.

**Test.** Flat-ish layered plateau (h ≈ 4–6, tilt + fbm, no canyon anywhere). Gesture = a wobbly hand-drawn S from near the viewer to the far edge: groove 1.5 units deep (≈⅓ of one stratum) × 2.2 cells wide, plus rain ×60 along the stroke (= "held mouse"). Then deep time.

**Timing (Node 22, this box, 1 thread):** 21–23 ms/step at 256² (6.6 ms at 128²). Final run = 210 steps = **4.8 s CPU**; implicit ⇒ dt 1 × 420 gives the same landscape as dt 2 × 210 (path depth 21.9 vs 21.8), so step size is free. Headless Chrome (SwiftShader box, main thread) 32–39 ms/step. Comfortably inside the 20–60 s budget even at 2 steps/frame live (~10 s to full canyon), or in a Worker.

**Evidence** (`shots/contact-sheet-canyon-gesture.png`):
- seed → 105 steps → 210 steps: the groove becomes a deep (≈22 of 46 units, ~5 strata), winding, stair-stepped canyon along the drawn S, with dendritic tributaries branching off both rims; the canyon head-cuts from the edge toward the viewer.
- **Control, identical run without the gesture:** only an escarpment with small gullies along the edge, plateau intact. Off-gesture dissection (cells > 10 below the plateau, > 12 cells from the stroke, excluding the edge band) = 2.8 % with the gesture.
- Second, different gesture (diagonal zig-zag): canyon follows it too ⇒ not tuned to one path.

**Caveats (what V1 still needs, none of them a scripted canyon):** (1) the stroke must connect to an outlet (edge/base level) — a stroke ending mid-plateau will need "rain → lake → spill" or we auto-extend it to the nearest edge; (2) the canyon head-cuts from the outlet, so the near end of a long stroke lags (2nd gesture: near third still shallow at 210 steps) — fine as drama ("watch it eat its way back to you"), or raise K·rain; (3) small zig-zags get straightened (rivers short-cut — physically right, may disappoint a child); (4) canyon width is set by Sc — narrower and less "Grand" than the hand-shaped A2 postcard; widening needs a lateral-erosion/cliff-retreat term or Sc per stratum; (5) the A2 shading (terraces, colours) is still a render layer, not the sim's own strata — they agree only loosely; (6) river water ribbon needs re-tuning for the new A range (currently mostly hidden).

**Verdict: fully emergent is feasible in V1.** The gesture alone, through a physically based implicit solver, produces a deep, branching, stair-stepped canyon that follows the player's line in ~5 s of CPU. A scripted driver is not needed for the canyon itself; art direction moves to parameters (K, Sc per stratum, rain along the stroke) and the render layer.
