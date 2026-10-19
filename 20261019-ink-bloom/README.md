# 墨華 Ink Bloom

**▶ Live:** https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/ (desktop Chrome, WebGL2)

Click the water. A bead of ink swells at the tip of a glass pipette, falls, splashes a small crown and rolls into a vortex ring. The ring sinks and swells into a bell, then buckles into five lobes; each lobe becomes a smaller ring and sinks, again and again, until a chandelier of ink hangs in the tank. Drop a second colour into it and the two cascades interpenetrate and mix subtractively.

點一下水面：墨滴落入水中，捲成渦環，下沉、膨脹成鐘形，再裂成五瓣；每一瓣又成為更小的渦環繼續下沉分裂，最後在水中長成一盞墨的吊燈。再滴另一種顏色，兩股墨流互相穿透、減色混合。

## Controls
| Input | Effect |
|---|---|
| Click | release a drop where you point; pointing higher lifts the pipette, so the drop enters faster (tighter, stronger ring) |
| Hold, then release | a bigger bead (more lobes, deeper cascade) |
| Drag | stir: the stroke bends and breaks the bells, sheds small vortex rings and lays a ribbon of ink (brush) |
| 1–5 or the ink bottles | 藍 indigo · 臙脂 carmine · 藤黃 gamboge · 墨 sumi · 青 viridian |
| S or the salt jar, then click | pour brine: a shimmering plume sinks and builds a dense layer from the floor up; rings stall on it and spread into umbrellas |
| Space (hold) | slow time |
| R | fresh water |
| M | sound on/off |

## How it works
- **Physics:** each ring is a vortex filament (24 segments, regularised Biot–Savart). It self-propels at the thin-ring speed `Γ/(4πR)·(ln(8R/a) − ¼)`, expands, and grows an azimuthal (Widnall-type) wave. When the wave saturates, the ring splits into *k* tilted child rings. Rings push one another through their induced flow. The cascade behaviour follows Thomson & Newall (1885) and the "bifurcation flower" of heavy drops (Phys. Fluids 2021).
- **Ink:** 262k–1M tracer particles on the GPU (float textures, ping-pong), each advected by the velocity field of every nearby filament. Bells, threads and sheets are emergent, not drawn.
- **Rendering (V2):** tracers are splatted into a 3D dye grid (384×256×48 z-slice atlas, 3D-blurred) and the scene is **raymarched**: a glass tank with a thick floor slab and contact shadow, Beer–Lambert absorption with low-albedo forward scatter and self-shadowing toward the backlight, and total internal reflection at the underside of the surface and at the side panes. A thin thread layer from the tracers keeps the ring edges crisp. The camera fits the cascade to ~80 % of the frame height.
- **Every drop differs:** 4–7 lobes, its own tilt and asymmetry, and an entry speed set by the pipette height.
- **Tank memory:** when a drop slot is reused, its ink is baked into a persistent dye volume that keeps diffusing and slowly thinning, so earlier blooms stay in the water. Ink also dilutes with age.
- **Tiers (V3):** a short GPU probe at start picks high / mid / low. Integrated GPUs get DPR 1 and the smaller grid; software renderers get the low tier; the render scale then adapts to the frame rate. Add `?fps` for a frame-rate overlay.
- V1 rendering: absorbance point splats blurred at three scales over a studio backdrop.
- Plain WebGL2 and JavaScript, no libraries and no build step.

## Versions
- `v3/` (current, also at the project root): V3 (2026-10-19), pipette + crown splash opening, per-drop variation, stir/brush, salt pour, dark studio with the tank as a lightbox, ink bottles, GPU tiers.
- `v2/`: V2 (2026-10-19), volumetric dye render in a raymarched glass tank, following camera, tank memory, salt layer, chromatic pigments.
- `v1/`: V1 (2026-10-19), first end-to-end version (point-splat render).

Started 2026-10-19 (TPE). Built by Grok Bot during an autonomous creative challenge.
