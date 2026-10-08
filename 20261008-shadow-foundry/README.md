# 影鑄 Shadow Foundry

*A brass sculpture that is nothing from the front, and three different pictures from the side.*

**Live:** https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/

Three track lamps light one tangle of about 1,500 aged-brass rods, hung from the ceiling on a single wire. Each lamp casts its shadow on a different surface: the east wall, the north wall and the dark polished floor. From most angles the shadows are formless blobs. Turn the sculpture to its one true angle and all three shadows lock into pictures at once: a cat, a tree and a swallow. Then you can draw three shadows of your own, and the foundry forges a new sculpture that casts them.

## How to use it
- **Watch** the opening, *The Forge* (~5 s; click or Esc to skip). Three lamps clunk on onto empty walls. About 1,500 brass rods fly in out of the dark and swirl as a storm cloud, so every pool fills with moving hatching. At ~4.2 s they all implode together, and in the last quarter-second all three shadows become pictures at once.
- **Drag** to turn the sculpture: horizontal drag turns it, vertical drag tilts it. Out of alignment, the sculpture loosens into a cloud of rods; turning it back pulls them together. The shadows stay dark; they sharpen (and the sound tunes in) as you get closer, and a soft magnetic detent catches you near the solution.
- **Draw your own three shadows**: sketch one silhouette per lit surface (closed outlines fill in automatically), then press *Forge*. A new rod sculpture is computed in a background Web Worker (the page never freezes); the long rods fly in first, then the edge rods.
- **Type three letters** (A–Z; the prompt sits above the links) to forge a word sculpture. It reads in typed order: left wall, right wall, then the floor letter, turned upright as seen from the camera. Press Enter, or simply wait a moment after the third letter. The current sculpture shatters into a storm while a Web Worker computes the new one, then the rods implode into your word. Letters are swapped between walls only when that improves the cast by more than 3 points; the placard then says so. The placard prints your word and the measured rod coverage of the worst wall. Backspace edits; Esc clears.
- **Share a word**: *Copy share link* copies a URL such as `…/20261008-shadow-foundry/#w=GEB`. Opening it plays *The Forge* straight into that word; pasting a new `#w=` link into an open tab forges it too. Built-in and drawn works clear the hash. Only the clipboard is used; nothing is sent anywhere.
- **Click the sculpture** (or *Next sculpture*) to shatter it: the rods burst into a storm and implode into the next curated work: No. 2 (hand · key · butterfly), then No. 3 (G · E · B, after Hofstadter's *Gödel, Escher, Bach* cover).
- **Drag a lamp**: hover a lamp head (it glows faintly) and drag it along its ceiling track. It stays aimed at the sculpture, so its pool slides across the wall and the shadow reprojects live: the cat shears, the tree stretches, the swallow smears. Let go and it springs back home with a clunk. Only the light and its shadow camera move; nothing is re-forged.
- After the opening (and whenever the shadows lock), the camera pushes in until the pools fill about 60 % of the frame, then eases back out as soon as you drag. Built-in sculptures are precomputed (`data/preset-*.json`) and load instantly.
- Sound is procedural (WebAudio) and starts on your first click. Use the speaker glyph to mute.

Desktop browsers (1440×900 to 1920×1080), WebGL2.

## How it works
- **Shadow art / visual hull** (after Mitra & Pauly, *Shadow Art*, SIGGRAPH Asia 2009). Each target is a 2D mask. A point is inside the sculpture iff its perspective projection from every lamp lands inside that lamp's mask.
- **Making three drawings consistent.** Per-figure similarity transforms are hill-climbed to maximize hull fidelity, followed by a repair driven by an exact per-pixel ray test: each unreachable shadow pixel gets the cheapest small disc added to the other two masks (≤3.2 px).
- **Forging.** Long rods (min. length 0.78) are sphere-traced inside the hull against signed-distance fields of the masks, in three gauges. Interior-repair rods fill holes perpendicular to the lamp ray, and thin edge rods are laid tangent to each silhouette to trace its outline. Coverage is measured by rasterising the actual rod capsules from each lamp: every built-in figure is ≥98 % covered (No. 1 cat/tree/swallow 98.7/99.5/98.4 %, No. 2 hand/key/butterfly 98.7/98.2/98.0 %, No. 3 G/E/B in reading order with an upright floor B: 95.6/95.8/96.6 %). Typed words are forged live. In a test of 21 words (about 3.5 s each in the worker), 15 reach ≥95 % on every wall and 20 reach ≥90 %. Hard combinations hold up: WMW 95.2, IXI 98.8, QOS 99.1. The weakest is LOV at 83.8 %, where the O and V cannot fully share one hull.
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
- **Pass 2 / experience** (2026-10-08): *The Forge* implosion opening with skip; shatter → storm → re-forge; misalignment loosens the sculpture (no figure-revealing scramble); the wire casts no shadow; type-three-letters word sculptures with `#w=` share links; No. 3 GEB; a stronger hero push-in; draggable lamps; a compact layout below 1440×900.
- **Pass 1 / visual escalation** (2026-10-08): ≥98 % rod coverage via edge rods and hole fill; precomputed sculptures; a front-facing cat; a butterfly replaces the fish; a real room (ceiling track, ceiling wire, polished floor, bounce-lit plaster); exposure lowered so the pools show lamp colour; dust; the forge moved to a Web Worker with progressive fly-in.

Fonts: Cormorant Garamond (OFL), Noto Serif TC (OFL), self-hosted subsets. three.js (MIT), vendored.
