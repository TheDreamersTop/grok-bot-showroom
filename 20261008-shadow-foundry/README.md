# 影鑄 Shadow Foundry

*A brass sculpture that is nothing from the front, and three different pictures from the side.*

**Live:** https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/

Three track lamps light one tangle of about 1,500 aged-brass rods, hung from the ceiling on a single wire. Each lamp casts its shadow on a different surface: the east wall, the north wall and the dark polished floor. From most angles the shadows are formless blobs. Turn the sculpture to its one true angle and all three shadows lock into pictures at once: a cat, a tree and a swallow. Then you can draw three shadows of your own, and the foundry forges a new sculpture that casts them.

## How to use it
- **Watch** for the first ~5 seconds. The lamps switch on, the sculpture tumbles, and the shadows lock.
- **Drag** to turn the sculpture: horizontal drag turns it, vertical drag tilts it. The shadows stay dark; they sharpen (and the sound tunes in) as you get closer, and a soft magnetic detent catches you near the solution.
- **Draw your own three shadows**: sketch one silhouette per lit surface (closed outlines fill in automatically), then press *Forge*. A new rod sculpture is computed in a background Web Worker (the page never freezes); the long rods fly in first, then the edge rods.
- **Next sculpture** loads No. 2 (hand · key · butterfly). Built-in sculptures are precomputed (`data/preset-*.json`) and load instantly.
- Sound is procedural (WebAudio) and starts on your first click. Use the speaker glyph to mute.

Desktop browsers (1440×900 to 1920×1080), WebGL2.

## How it works
- **Shadow art / visual hull** (after Mitra & Pauly, *Shadow Art*, SIGGRAPH Asia 2009). Each target is a 2D mask. A point is inside the sculpture iff its perspective projection from every lamp lands inside that lamp's mask.
- **Making three drawings consistent.** Per-figure similarity transforms are hill-climbed to maximize hull fidelity, followed by a repair driven by an exact per-pixel ray test: each unreachable shadow pixel gets the cheapest small disc added to the other two masks (≤3.2 px).
- **Forging.** Long rods (min. length 0.78) are sphere-traced inside the hull against signed-distance fields of the masks, in three gauges. Interior-repair rods fill holes perpendicular to the lamp ray, and thin edge rods are laid tangent to each silhouette to trace its outline. Coverage is measured by rasterising the actual rod capsules from each lamp: every built-in figure is ≥98 % covered (No. 1 cat/tree/swallow 98.7/99.5/98.4 %, No. 2 hand/key/butterfly 98.7/98.2/98.0 %).
- **Rendering** (three.js r160):
  - Each surface is lit only by its own lamp.
  - The custom plaster shader samples that lamp's shadow map with a rotated Poisson PCF. Its penumbra radius carries the "you are getting closer" signal. A procedural lens cookie (hotspot, faint ring, chromatic fringe) shapes each pool. The lamps are 2700 K, 5600 K and 4000 K.
  - A fake one-bounce from the three pools lights the room, and the polished floor shows a blurred planar reflection with Fresnel.
  - Also: volumetric haze from the shadow maps (so the beams are sliced by the rods), dust motes lit only inside the cones, an HDR composite with ACES and grain, and instanced rods with per-rod AO and a patina/polished/blackened-steel mix.
- Everything is static files; no build step, no server.

## Folder
| Path | Contents |
|---|---|
| `index.html`, `js/`, `style.css`, `fonts/`, `data/`, `vendor/` | the experience |
| `prototypes/` | the three Phase-B prototypes (Shadow Foundry, Lumen Atelier, Chladni) |
| `shots/` | screenshots |

## Versions
- **V1** (2026-10-08): the opening lock sequence, constrained turntable with sharpening cues, draw-your-own, procedural sound and museum labels.
- **Pass 1 / visual escalation** (2026-10-08): ≥98 % rod coverage via edge rods and hole fill; precomputed sculptures; a front-facing cat; a butterfly replaces the fish; a real room (ceiling track, ceiling wire, polished floor, bounce-lit plaster); exposure lowered so the pools show lamp colour; dust; the forge moved to a Web Worker with progressive fly-in.

Fonts: Cormorant Garamond (OFL), Noto Serif TC (OFL), self-hosted subsets. three.js (MIT), vendored.
