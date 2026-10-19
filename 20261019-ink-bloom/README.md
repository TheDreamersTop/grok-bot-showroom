# 墨華 Ink Bloom

**▶ Live:** https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/ (desktop Chrome, WebGL2)

Click the water. A bead of ink falls from the dropper and rolls into a vortex ring. The ring sinks and swells into a bell, then buckles into five lobes; each lobe becomes a smaller ring and sinks, again and again, until a chandelier of ink hangs in the tank. Drop a second colour into it and the two cascades interpenetrate and mix subtractively.

點一下水面：墨滴落入水中，捲成渦環，下沉、膨脹成鐘形，再裂成五瓣；每一瓣又成為更小的渦環繼續下沉分裂，最後在水中長成一盞墨的吊燈。再滴另一種顏色，兩股墨流互相穿透、減色混合。

## Controls
| Input | Effect |
|---|---|
| Click | release a drop where you point |
| Hold, then release | bigger drop (more lobes, deeper cascade) |
| Drag | stir the water |
| 1–5 or the ink panel | 藍 indigo · 臙脂 carmine · 藤黃 gamboge · 墨 sumi · 青 viridian |
| S or 鹽層 | hidden salt layer: rings stall at the density step and open into umbrellas |
| Space (hold) | slow time |
| R | fresh water |
| M | sound on/off |

## How it works
- **Physics:** each ring is a vortex filament (24 segments, regularised Biot–Savart). It self-propels at the thin-ring speed `Γ/(4πR)·(ln(8R/a) − ¼)`, expands, and grows an azimuthal (Widnall-type) wave. When the wave saturates, the ring splits into *k* tilted child rings. Rings push one another through their induced flow. The cascade behaviour follows Thomson & Newall (1885) and the "bifurcation flower" of heavy drops (Phys. Fluids 2021).
- **Ink:** 262k–1M tracer particles on the GPU (float textures, ping-pong), each advected by the velocity field of every nearby filament. Bells, threads and sheets are emergent, not drawn.
- **Rendering (V2):** tracers are splatted into a 3D dye grid (384×256×48 z-slice atlas, 3D-blurred) and the scene is **raymarched**: a glass tank with a thick floor slab and contact shadow, Beer–Lambert absorption with low-albedo forward scatter and self-shadowing toward the backlight, and total internal reflection at the underside of the surface and at the side panes. A thin thread layer from the tracers keeps the ring edges crisp. The camera fits the cascade to ~80 % of the frame height.
- **Tank memory:** when a drop slot is reused, its ink is baked into a persistent dye volume that keeps diffusing and slowly thinning, so earlier blooms stay in the water. Ink also dilutes with age.
- **Tiers:** software / weak GPUs get a smaller grid, an adaptive render scale and an amortised volume update.
- V1 rendering: absorbance point splats blurred at three scales over a studio backdrop.
- Plain WebGL2 and JavaScript, no libraries and no build step.

## Versions
- `v2/` (current, also at the project root): V2 (2026-10-19), volumetric dye render in a raymarched glass tank, following camera, tank memory, salt layer, chromatic pigments.
- `v1/`: V1 (2026-10-19), first end-to-end version (point-splat render).

Started 2026-10-19 (TPE). Built by Grok Bot during an autonomous creative challenge.
