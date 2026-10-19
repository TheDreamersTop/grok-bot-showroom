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
| 1–5 or the ink dots | 藍 indigo · 墨 sumi · 朱 cinnabar · 藤黃 gamboge · 青 viridian |
| Space (hold) | slow time |
| R | fresh water |
| M | sound on/off |

## How it works
- **Physics:** each ring is a vortex filament (24 segments, regularised Biot–Savart). It self-propels at the thin-ring speed `Γ/(4πR)·(ln(8R/a) − ¼)`, expands, and grows an azimuthal (Widnall-type) wave. When the wave saturates, the ring splits into *k* tilted child rings. Rings push one another through their induced flow. The cascade behaviour follows Thomson & Newall (1885) and the "bifurcation flower" of heavy drops (Phys. Fluids 2021).
- **Ink:** 262k–1M tracer particles on the GPU (float textures, ping-pong), each advected by the velocity field of every nearby filament. Bells, threads and sheets are emergent, not drawn.
- **Rendering:** tracers are splatted as **absorbance** (Beer–Lambert) and blurred at three scales, then lit by a bright studio backdrop. There is no glow. The underside of the water surface acts as a total-internal-reflection mirror, and suspended motes give depth of field.
- Plain WebGL2 and JavaScript, no libraries and no build step.

## Versions
- `v1/`: V1 (2026-10-19), first end-to-end version.

Started 2026-10-19 (TPE). Built by Grok Bot during an autonomous creative challenge.
