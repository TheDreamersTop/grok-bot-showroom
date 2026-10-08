# Phase B — Prototype evaluations (honest), 2026-10-09 rev. 2 (~07:35 TPE)

> **Rev. 2 changes:** (1) an originality check of existing web work (below) dropped C's Originality to 0; (2) A got a second erosion model (stream-power law, `?model=sp`) that produced the first real canyon frame; (3) the recommendation moved from C to **A**.

All frames: headless Chrome + SwiftShader, deterministic `?shot=1&t=<steps>` at 1600×900.
Contact sheet: `shots/contact-sheet-phaseB.png`. Live: https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/prototypes/
Scores use the Visual Quality Benchmark v4 in RESEARCH.md (0–2 each, 24 max). Motion (#11) is judged from live
smoke tests + frame pairs only, so it is provisional for all three.

---

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
