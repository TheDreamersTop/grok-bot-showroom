# 墨華 Ink Bloom

**▶ Live:** https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/ (desktop Chrome, WebGL2)

The tank is a lantern: a glowing glass box in a dark studio, the whole tank always in frame. Click the water. A bead of ink swells at the tip of a glass pipette, falls, splashes a small crown and rolls into a vortex ring. The ring sinks and swells into a bell, then buckles into five lobes; each lobe becomes a smaller ring and sinks, again and again, until a chandelier of ink hangs in the tank. A faint layer of brine sits partway down, so the cascade stalls on it and spreads into an umbrella canopy over a shimmering horizon. At 8 s a carmine drop falls into the same column, entrains the indigo-stained wake and turns the chandelier plum and indigo. Drag to write into it with an ink brush; drop other colours and they interpenetrate and mix subtractively.

點一下水面：墨滴落入水中，捲成渦環，下沉、膨脹成鐘形，再裂成五瓣；每一瓣又成為更小的渦環繼續下沉分裂，最後在水中長成一盞墨的吊燈。再滴另一種顏色，兩股墨流互相穿透、減色混合。

## Controls
| Input | Effect |
|---|---|
| Click | release a drop where you point; pointing higher lifts the pipette, so the drop enters faster (tighter, stronger ring) |
| Hold, then release | a bigger bead (more lobes, deeper cascade) |
| Drag | write with the brush: a slow stroke is wide and wet, a fast one thin and dry (飛白 bristle streaks); the ink drifts, shears and curls into small rings, and the stroke bends and breaks the bells |
| 1–5 or the ink bottles | 藍 indigo · 臙脂 carmine · 藤黃 gamboge · 墨 sumi · 青 viridian |
| S or the salt jar, then click | pour brine: a shimmering plume sinks and builds a dense layer; one pour already reaches mid-depth, so the cascade stalls on it and spreads into an umbrella |
| Space (hold) | slow time |
| R | fresh water (the brine layer stays; add `?salt=0` for a tank without it) |
| M | sound on/off |

## How it works
- **Physics:** each ring is a vortex filament (24 segments, regularised Biot–Savart). It self-propels at the thin-ring speed `Γ/(4πR)·(ln(8R/a) − ¼)`, expands, and grows an azimuthal (Widnall-type) wave. When the wave saturates, the ring splits into *k* tilted child rings. Rings push one another through their induced flow. The cascade behaviour follows Thomson & Newall (1885) and the "bifurcation flower" of heavy drops (Phys. Fluids 2021).
- **Ink:** 262k–1M tracer particles on the GPU (float textures, ping-pong), each advected by the velocity field of every nearby filament. Bells, threads and sheets are emergent, not drawn.
- **Rendering (V2):** tracers are splatted into a 3D dye grid (384×256×48 z-slice atlas, 3D-blurred) and the scene is **raymarched**: a glass tank with a thick floor slab and contact shadow, Beer–Lambert absorption with low-albedo forward scatter and self-shadowing toward the backlight, and total internal reflection at the underside of the surface and at the side panes. A thin thread layer from the tracers keeps the ring edges crisp. The camera fits the cascade to ~80 % of the frame height.
- **Every drop differs:** 4–7 lobes, its own tilt and asymmetry, and an entry speed set by the pipette height.
- **Tank memory:** when a drop slot is reused, its ink is baked into a persistent dye volume that keeps diffusing and slowly thinning, so earlier blooms stay in the water. Ink also dilutes with age.
- **Tiers (V3):** a short GPU probe at start picks high / mid / low. Integrated GPUs get DPR 1 and the smaller grid; software renderers get the low tier; the render scale then adapts to the frame rate. Add `?fps` for a frame-rate overlay.
- **V4 look:** fixed lantern framing (tank ≈ 77 % of the frame width, symmetric, never cut), side panes looking out into the dark studio, table light pool and caustics; pigment absorbances re-fitted inside sRGB (carmine ≈ (185,35,60), gamboge ≈ (215,160,40), viridian ≈ (30,110,95)) with a soft OD cap, so overlaps go aubergine / olive / orange; ink visibly dilutes by ~20 s.
- **V5 hero:** a default brine layer (pycnocline) at ~⅓ depth; the second auto drop lands in the same column, and a drop falling through an earlier drop's dyed column carries part of that pigment (entrainment), so the two-tone mix is rendered subtractively. Short bright-rimmed crown, soft warm caustics, inner-tank vignette, tighter framing. Low tier: ring cap 128, brush taper + dry-brush breaks, smoothed side-pane corners. The V4 auto brush stroke is now opt-in (`?autostroke`).
- V1 rendering: absorbance point splats blurred at three scales over a studio backdrop.
- Plain WebGL2 and JavaScript, no libraries and no build step.

## Versions
- `v5/` (current, also at the project root): V5 (2026-10-19), hero = plum/indigo two-tone chandelier over a default brine layer (umbrella canopy), no auto stroke, short bright crown, soft caustics, low-tier brush/pane/ring-cap fixes.
- `v4/`: V4 (2026-10-19), lantern composition as the default hero framing, pigment gamut + mixing + dilution, calligraphy brush, auto brush stroke in the hero sequence, bigger crown, clear glass pipette, salt that works in one pour (jar lid + glint), no black flash on render-scale change.
- `v3/`: V3 (2026-10-19), pipette + crown splash opening, per-drop variation, stir/brush, salt pour, dark studio with the tank as a lightbox, ink bottles, GPU tiers.
- `v2/`: V2 (2026-10-19), volumetric dye render in a raymarched glass tank, following camera, tank memory, salt layer, chromatic pigments.
- `v1/`: V1 (2026-10-19), first end-to-end version (point-splat render).

Started 2026-10-19 (TPE). Built by Grok Bot during an autonomous creative challenge.
