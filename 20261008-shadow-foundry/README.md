# 影鑄 Shadow Foundry

*A brass sculpture that is nothing from the front, and three different pictures from the side.*

**Live:** https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/

Three lamps light one tangle of about a thousand aged-brass rods. Each lamp casts its shadow on a different surface: the east wall, the north wall and the floor. From most angles the shadows are formless blobs. Turn the sculpture to its one true angle and all three shadows lock into pictures at once: a cat, a tree and a swallow. Then you can draw three shadows of your own, and the foundry forges a new sculpture that casts them.

## How to use it
- **Watch** for the first ~5 seconds. The lamps switch on, the sculpture tumbles, and the shadows lock.
- **Drag** to turn the sculpture: horizontal drag turns it, vertical drag tilts it. The shadows sharpen and darken as you get closer, and a soft magnetic detent catches you near the solution.
- **Draw your own three shadows**: sketch one silhouette per lit surface (closed outlines fill in automatically), then press *Forge*. A new rod sculpture is computed in your browser and flies in.
- **Next sculpture** loads No. 2 (hand · key · fish).
- Sound is procedural (WebAudio) and starts on your first click. Use the speaker glyph to mute.

Desktop browsers (1440×900 to 1920×1080), WebGL2.

## How it works
- **Shadow art / visual hull** (after Mitra & Pauly, *Shadow Art*, SIGGRAPH Asia 2009). Each target is a 2D mask. A point is inside the sculpture iff its perspective projection from every lamp lands inside that lamp's mask.
- **Making three drawings consistent.** Per-figure similarity transforms are hill-climbed to maximize hull fidelity, followed by a boundary-hugging repair (≤2 px).
- **Forging.** About 760 long rods are sphere-traced inside the hull against signed-distance fields of the masks, in three gauges. Coverage-repair rods are then seeded on uncovered shadow pixels, placed perpendicular to the lamp ray.
- **Rendering** (three.js r160):
  - Each surface is lit only by its own lamp.
  - The custom plaster shader samples that lamp's shadow map with a rotated Poisson PCF. Its penumbra radius and darkness carry the "you are getting closer" signal.
  - Also: volumetric haze from the shadow maps, an HDR composite with ACES and grain, and instanced rods with per-rod AO and a patina/polished/blackened-steel mix.
- Everything is static files; no build step, no server.

## Folder
| Path | Contents |
|---|---|
| `index.html`, `js/`, `style.css`, `fonts/`, `vendor/` | the experience (V1) |
| `prototypes/` | the three Phase-B prototypes (Shadow Foundry, Lumen Atelier, Chladni) |
| `shots/` | screenshots |

## Versions
- **V1** (2026-10-08): the opening lock sequence, constrained turntable with sharpening cues, draw-your-own, procedural sound and museum labels.

Fonts: Cormorant Garamond (OFL), Noto Serif TC (OFL), self-hosted subsets. three.js (MIT), vendored.
