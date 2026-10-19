# REVIEW-03 — Independent adversarial review of V3 墨華 Ink Bloom (Pass 2)
Reviewer: independent subagent (Hostile Creative Director + Principal Engineer). No project code was edited.
Date: 2026-10-19, review started 13:08 TPE (UTC+8). About 4 h of budget remain (to ~17:31 TPE).

**What was reviewed.** The live root URL and `/v3/`. Their `main.js` files are byte-identical to `v3/main.js` (showroom 3bad116).

**Protocol.** Same as REVIEW-01 and REVIEW-02:
- Headless Chrome with SwiftShader at 1920×1080, DPR 1.
- Deterministic frames from the live URL with `?shot=T&tw=768`.
- One long real-time live session on `/?fps`, and a SwiftShader per-tier timing run.

All evidence is in `reviews/assets-03/`.
- Overview: `contact-sheet.jpg`
- Before/after against REVIEW-02: `before-after-v2-v3.jpg` and `thumbs-v2-v3.jpg`
- Live session: `live-sheet.jpg`
- Timings: `perf-swiftshader.txt`

**Console and loading.** 0 errors, 0 warnings, 0 page errors, HTTP 200 and no failed requests, in all sessions.

## Re-check of every REVIEW-02 fix
| REVIEW-02 fix | Status | Evidence |
|---|---|---|
| **P0 drop queue** | **Fixed.** | Deterministic: 7 drops 0.1 s apart → 7 blooms (`p0-7drops-0.1s-t8.jpg`). Live: 7 clicks about 110 ms apart → `drops: 8` (auto + 7) and a row of 7 beads at +1 s (`live-rapid-1s.jpg`). R clears the queue. |
| Opening / pipette / crown | **Mostly fixed.** | Frame 1 has a pipette and a bead (`hero-t0.3.jpg`); the drop lands by 0.45 s with ripple ellipses and a small scalloped crown (`crop-crown-t0.6.jpg`). Weak points: the pipette is a black needle that is clipped by the frame top in close-ups (`crop-pipette-t3.jpg`); the crown is about 60 px, too small to notice. |
| Thin wavering trail | **Partly fixed.** | The carrot is gone. But every drop's stem now ends in the same "?"-shaped hook at the top (`var4-indigo-t12.jpg`, all 4 drops), so a new signature artefact replaced the old one. |
| Per-drop variation | **Partly fixed.** | Four indigo drops differ in skirt width and lobe count (`var4-indigo-t12.jpg`), but all share the same pinched-vase stem plus skirt silhouette. At a glance they are still siblings. |
| Stir | **Fixed, and now the strongest verb.** | A scripted stir sweeps a stem into a brush-calligraphy stroke and sheds small rings (`stir-t10.jpg`, `crop-stir-t10.jpg`). This is the most distinctive frame in the build. Live, the stroke lays a **thick, uniform-width ribbon** (a red sine "snake" in `live-stir-3s.jpg`) that reads like a paint-program line, not ink in water. |
| Salt as a pour | **Works, still hard to discover.** | The jar is the 6th of six ~20 px bottles in the bottom-left corner. The plume is a faint white-on-white schlieren (`crop-salt-plume-t1.jpg`). **One pour** only builds a layer near the floor, so the cascade never reaches it: no umbrella (`salt-pour-t13.jpg`, `live-salt-drop-11s.jpg`). **Three pours** give a visible horizon line and the ring flattens into an anvil (`salt-3pours-t14.jpg`), a good image that nobody will find. |
| Environment re-art | **Half fixed.** | The wide opening shot is a big improvement: lightbox tank in a dark warm studio, table, thin glass edges (`hero-t0.3.jpg`). But once the camera eases in, the frame is again the white box interior: back wall, two pale side "walls", floor (`hero-t11.jpg`). The dark studio survives only as thin bars. At 200 px, V2 and V3 hero frames are nearly identical (`thumbs-v2-v3.jpg`). |
| Colour gamut | **Not done (known).** | Carmine and gamboge are still clipped primaries. The 7-drop frame reads as a flag of poster colours. |
| fps tiers / `?fps` | **Done, and well shaped.** | The overlay shows `fps · tier · RS · probe ms`. SwiftShader probe 37 ms → low. The integrated-GPU name match (Intel/Iris/UHD/Apple M*/Radeon Graphics/…) → mid tier, with DPR 1, the small grid, TW 512 and the volume every 2nd frame. SwiftShader medians at 1920×1080: high 1933 ms (V2 was 2650), **mid 667 ms**, low 250 ms. |

**Performance estimate.** I applied the same conventional SwiftShader→GPU ratios as REVIEW-02; these are estimates, not measurements.
- Discrete GPU, high tier: about 10–19 ms.
- iGPU, mid tier: about 22–44 ms, i.e. 23–45 fps. **No longer an architectural risk.**
- It still needs one real-hardware number for the final report.

## New bugs found
1. **Full-screen black frame whenever the render scale changes (all tiers).**
   - Live, after moving the mouse, the whole canvas is black; only the HTML title and bottles show. The overlay reads `RS 0.55` while RS was being lowered (`live-pipette-hover.jpg`).
   - **Cause:** in the loop, `render()` runs first; then the fps adapter calls `allocRT()`, which sets `cv.width/height`. That clears the drawing buffer, and the cleared (black) buffer is what gets presented for that frame.
   - On a real GPU this is a 1-frame black flash on a bright scene every time RS adapts, a very visible flicker in the first seconds of a session.
   - **Fix:** adapt RS before `render()` in the same frame, or render again right after `allocRT()`.
2. **The live camera loses composition with many drops or a stir.** With the 7-drop row plus a stir, the frame drifts right: the tank's right edge lands at ~88 % of frame width, and the leftmost bloom is cut by the left frame edge (`live-stir-3s.jpg`). The camera fits the ink AABB including the brush ribbon and pointer parallax, but never clamps to keep the tank symmetric or the whole ink in frame.
3. **Black contour lines inside young rings.** The fine-thread layer draws dark pen-like loops inside the ring and crown (`crop-t3-ring.jpg`, `crop-crown-t0.6.jpg`). It reads as a doodle drawn on the blob, and it is visible in full frames at t ≈ 0.6–3 s, the moment everyone watches.
4. **Minor.**
   - The title reads "click the wate…": it is clipped by the tank edge in close-ups (`crop-title-t11.jpg`).
   - The bottles overlap the tank's left edge in the wide frame (known).
   - In the 7-drop frame there are 335 live rings, beyond MAXR 224. Only the newest 224 drive the GPU velocity field, so older blooms freeze. Not visible yet, but it would be in long sessions.

## Scores — Benchmark v5 (0–2, rendered frames only)
| # | Criterion | V1 | V2 | **V3** | Evidence |
|---|---|---|---|---|---|
| 1 | Focal point & composition | 1 | 2 | **2** | The hero frames are centred and fill ≈ 65 % of height. Still at risk: the live camera drift and bloom cut (bug 2), the pipette clipped at the top edge, the title clipped. |
| 2 | Value structure | 1 | 2 | **2** | The dark studio adds true darks around the light box; deep navy cores; reads at 200 px. |
| 3 | Palette & colour script | 1 | 1 | **1** | Primaries unchanged (known). No visible dilution by t = 16. Overlaps still navy/maroon. |
| 4 | Light behaviour | 1 | 1 | **1** | The table light pool and caustics show only in the wide shot. Inside the tank the light is still even grey, with no glow-through at thin veils. The wide opening frame is the best lighting in the piece. |
| 5 | Depth | 0 | 1 | **1** | The wide frame has fg/mid/bg (bottles, tank, studio). The hero frame is the flat box interior again; the side panes are pale planks. |
| 6 | Material identity | 1 | 2 | **2** | Ink unmistakable. The glass is now thin edges, and the meniscus ripples help. |
| 7 | Detail at 100 % crop | 0 | 1 | **1** | Soft voxels are acceptable, but there are black doodle contours in young rings (bug 3) and a repeated "?" hook at the top of every stem. |
| 8 | **Originality** | 1 | 1 | **1** | **Gate blocker.** The hero thumbnail is "ink in a white box", essentially identical to V2. The most original images (calligraphy stir, salt anvil, lantern-tank in a dark studio) are not the default frame. |
| 9 | **Hero legibility (kids)** | 1 | 1 | **2** | The before frame now contains a dropper and a bead above water; after, an ink tree. A child says "the drop fell in and grew into a jellyfish / tree". Rapid clicks give a rainbow row. Earned. |
| 10 | Emergent response | 1 | 1 | **2** | Every gesture now has a physical consequence within about 1 s: landing at 0.45 s with ripples, rapid clicks that all count, stir that sheds rings and bends bells, salt that stalls rings into an anvil, drop height that sets entry speed. |
| 11 | Motion quality | 1 | 1 | **1** | The entry beat now exists. It is still one slow tempo after it, and there is the black-flash bug. Real-time motion cannot be verified at 2 fps on this box. |
| 12 | Polish / UI in world | 1 | 1 | **1** | The diegetic bottles are a good idea but ~20 px, in a corner, overlapping the tank, and the salt jar is unlabeled until hover. Paint-program ribbon, black flash, clipped title, dark pipette. |
| | **Total** | **10** | **15** | **17 / 24** | +2. Pass 2 was mostly experience work, and it shows in #9 and #10. |

**Gate (≥ 20, #8 = 2, #9 = 2): not met.** The total is 3 short and **#8 Originality = 1 blocks it.** #9 is now 2.
- **The realistic path to 20:**
  - #3 → 2: colour gamut.
  - #8 → 2: make the signature image the default.
  - #7 → 2 or #12 → 2: artefact and polish fixes.
- **Stretch:** #5 and #4 via wider framing.

## Kids test (V3)
- **Gasp?** A small "ooh" at the splash (if they notice it; it is small), then "a jellyfish / an upside-down tree!" at ~8 s.
- **The real delight moments:**
  - **Rapid clicking**, which makes a rainbow row of jellyfish.
  - **Scribbling**, which paints a thick ribbon of ink. A child will love it, and it is the first thing they will show a parent.

| Kid move | What happens now |
|---|---|
| Click-click-click | All drops count (fixed) |
| Scribble | A big ink ribbon plus curling stems (great for kids, but crude for adults) |
| All colours | Flag-like poster primaries |
| Hold | Bigger, wider chandelier |
| Salt jar | Probably never found; one pour shows nothing |
| Watching | A black flash when the frame rate adapts would make a child say "it broke" |

## Answers to the brief's questions (V3)
- **Impress a stranger?** The opening wide shot (glowing tank in a dark studio with a dropper) is now a genuinely good first frame. Within 3 s the camera pushes into a white box and it becomes "a nice ink sim".
- **Looks like a 30-min AI demo?** No. It looks like a careful 4-hour build. The poster colours and white box keep it from looking art-directed.
- **Is the identity distinctive?** Not yet in the default frame. It is distinctive in the stir/calligraphy frame and in the wide lantern frame.
- **Is the hero memorable?** The cascade is, the colours are not. The calligraphy stroke is the most memorable thing in the piece.
- **What is the weakest part?**
  - The camera pushes into the box and throws away the re-art.
  - Then colour.
  - Then the ribbon look.
- **What would make it 2× more impressive?**
  - Keep the tank as a glowing object in the dark (lantern composition) throughout.
  - Use pigment colour with real mixing.
  - Turn stir into ink calligraphy that tapers and diffuses, so the 墨 identity becomes the piece's signature: drop, bloom, then write into the bloom.
- **Are there architectural limits?** No blocking ones. MAXR 224 freezes older blooms in long sessions; the RS adapt flash.
- **Is it mistaking complexity for quality?** Slightly. Salt is now a sophisticated system nobody will discover. One great, legible verb (calligraphy) is worth more than salt polish.

## Top fixes for Pass 3, in priority order
1. **Fix the black-frame flash.** Do the RS adapt and `allocRT()` before `render()`, or re-render immediately. While there, clamp the camera so the tank stays symmetric and all ink stays inside a 6 % safe margin. Never cut a bloom at the frame edge. *Acceptance:* sample 40 live frames during mouse moves, 0 black frames; `live-stir-3s` equivalent keeps every bloom in frame.
2. **Lantern composition as the default hero (the #8 unlock).** Stop the camera at a distance where the whole tank plus 10–15 % of dark studio stays visible: tank about 75–80 % of frame width, bloom about 55–65 % of height. Darken or refract the side panes so they show the dark studio instead of pale planks, and let the table light pool and caustics show under the tank. *Acceptance:* the 200 px thumbnail of t = 11 reads as "a glowing tank in the dark with an ink chandelier", visibly different from `../assets-02/thumb200-hero-t11.jpg`.
3. **Colour gamut and mixing (#3).** Re-fit carmine, gamboge and viridian absorbances so the full-density transmitted colour stays well inside sRGB: target carmine about (185,35,60), gamboge about (215,160,40), viridian about (30,110,95). Use soft per-channel OD tone-mapping so overlaps produce aubergine, green and orange at mid density (≥ 15 % of ink pixels a mixed hue in the two-ink frames), and make dilution visible by t ≈ 20 s. Re-shoot the 7-drop frame; it must stop reading as a flag.
4. **Make the brush ink, not paint.** Taper ribbon width by stroke speed, start it thin, give it diffuse edges, and let it advect, shear and roll into small rings as it sinks. *Acceptance:* 100 % crop of the live stir shows varying width and soft edges; the stroke changes shape within 2 s. This is the signature verb, so polish it more than salt.
5. **Kill the two artefacts that sit in everyone's eyeline.** Remove the dark contour loops of the thread layer in young rings (fade the thread layer in after ~3 s, or limit it to low-density edges). Randomise or fade the "?" hook at the top of the stem. Also make the crown splash 2–3× bigger, with spray beads visible at full frame, and make the pipette glass clear with a coloured ink column (not a black needle) and fully inside the frame.
6. **Salt discoverability.** One pour must already make a visible layer that the default cascade hits: start the layer at about 55–60 % depth, or make one pour equal 2.5 of today's. Give the jar a hover label and a lid-lift animation. A first-time hint could be the salt jar gently "glinting" once after the first bloom settles.
7. **Real-hardware proof and final polish.**
   - Record one real-GPU `?fps` number in the final report.
   - Keep the title fully clear of the tank edge at every camera distance.
   - Make the bottles slightly bigger (30–36 px), clear of the tank in the wide frame, and lift a bottle on selection.
   - Raise MAXR or retire old rings into the memory volume so long sessions don't freeze.
   - Add a sound check (drip, splash, stir).

## Verdict
**No rework.** The engine, tiers and interactions are sound, and Pass 2 delivered real experience gains (kids test 2, emergent response 2). Spend the remaining ~4 h on fixes 1–5, which are mostly art direction and composition, not systems.
- **The gate depends on #8.** If, after fix 2 and fix 3, the default thumbnail still reads as "ink in a white box", the piece will not reach 2 on originality.
- **Fallback signature:** make the calligraphy stir part of the hero sequence, e.g. an auto brush stroke after the first bloom settles. This frame (`stir-t10.jpg`) is the one image no other ink sim has.
