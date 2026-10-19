# FINAL REPORT: 墨華 Ink Bloom

**[OPEN THE EXPERIENCE] → https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/**

- **Live:** the URL above is V6, the final version. Desktop Chrome, WebGL2. Earlier versions: [v1](https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/v1/) · [v2](https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/v2/) · [v3](https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/v3/) · [v4](https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/v4/) · [v5](https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/v5/) · [v6](https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/v6/)
- **Source:** https://github.com/TheDreamersTop/grok-bot-showroom/tree/main/20261019-ink-bloom
- **Docs and reviews:** https://github.com/TheDreamersTop/grok-bot-showroom/tree/main/20261019-ink-bloom/docs
- **Run:** autonomous creative challenge, round 5, 2026-10-19, 09:31–16:33 TPE (7 h 02 min).
- **Final score:** **23/24** in the independent review (REVIEW-06). The gate is met and there are no must-fixes.

All paths below are relative to the project folder `20261019-ink-bloom/` in the showroom repository.

## What was built
A real-time ink-in-water piece in plain WebGL2 and JavaScript, with no libraries and no build step.

**What you see.** A backlit glass tank glows like a lantern in a dark studio, the whole tank always in frame.

**What happens when you click.**
1. A bead of ink swells at the tip of a glass pipette, falls, and leaves beads and a ripple on the surface.
2. It rolls into a vortex ring. The ring sinks, swells into a bell, and buckles into 4–7 lobes.
3. Each lobe becomes a smaller ring and does the same again.
4. The result is a Thomson–Newall chandelier of ink.
5. A faint brine layer (pycnocline) sits partway down. The cascade stalls on it and spreads into an umbrella over a shimmering horizon.
6. At 8 s a carmine drop falls into the same column. It enters crimson and takes on the indigo-stained wake as it falls, so the chandelier hangs crimson and plum over indigo.

**Other interactions.**
- Drag to write into the water with a calligraphy brush. It is speed-sensitive and leaves 飛白 dry-brush streaks; the ink shears and curls into small rings.
- Pick one of five pigments: 藍 indigo, 臙脂 carmine, 藤黃 gamboge, 墨 sumi, 青 viridian.
- Pour salt to build more brine.
- Hold to make a bigger drop.
- Space slows time, R gives fresh water, M toggles sound.

**Engine.**
- **Physics:** CPU vortex-filament physics. Each ring has 24 segments and uses regularised Biot–Savart, the thin-ring self-propulsion speed, Widnall-type wave growth and a split into k tilted children. Rings induce flow on one another, with a ring cap.
- **Tracers:** 262k–1M GPU tracer particles in ping-pong float textures, 8 drop slots.
- **Dye volume:** a 3D dye grid (a z-slice atlas) with a 3D blur and a light-transmittance volume.
- **Raymarch:** the scene is raymarched with Beer–Lambert absorption and a soft optical-density cap, low-albedo forward scatter and self-shadowing. It also covers total internal reflection (TIR) at the surface and side panes, a thick floor slab, the table and caustics.
- **Detail and memory:** a thread layer keeps edges crisp. "Tank memory" bakes old drops into a persistent volume that keeps diffusing.
- **Performance:** a GPU probe picks the high, mid or low tier, and the render scale adapts to the frame rate.
- **Testing:** `?shot=T` gives a deterministic replay for every evidence frame.

## The Hero Moment
One click (or none: the first drop falls by itself) turns an empty bright tank into a branching, two-tone ink chandelier within ~15 s:
- **0.3 s:** surface beads and ripple.
- **3 s:** bell.
- **6 s:** first split.
- **8 s:** the second drop enters crimson.
- **9 s:** it has turned plum.
- **11–16 s:** chandelier.
- **16–24 s:** an umbrella canopy on the brine horizon.

Nobody expects a drop of ink to *branch*. It is real vortex-ring physics, not an animation, and every drop branches differently.

Key frames:
- `shots/v6-entry-t8.6.jpg`
- `shots/v6-hero-t16.jpg`
- `shots/v6-hero-t24.jpg`
- `docs/reviews/assets-06/hero-t{0.3,0.6,8.6,9.2,12,16,24}.jpg`

The share image is `og.jpg`.

## Evolution (independent adversarial review scores, out of 24)
| Version | Review | Score | What changed |
|---|---|---|---|
| Prototype P1 | REVIEW-01 (self-est. 13) | — | Three prototypes in 14 min: ink cascade (`docs/reviews/assets-01/p1-sheet.jpg`), cam automaton (`p2-t07b.jpg`), domino field flip (`p3b-sheet.jpg`). Ink cascade chosen: vortex filaments + GPU tracers, point splats. |
| V1 | REVIEW-01 | **10** | End-to-end, live at 10:01. Point-splat absorbance on a studio backdrop. Verdict: the visual approach caps the piece at about 14, so explore other renderers. |
| V2 | REVIEW-02 | **15** | **Redesign 1** (exploration X1–X3, 70 min): volumetric dye grid plus raymarched glass tank, following camera, tank memory, salt toggle. |
| V3 | REVIEW-03 | **17** | P0 drop-queue bug fixed. Pipette, bead and crown opening; per-drop variation; brush/stir; salt as a pour gesture; **redesign 2** of the environment (lightbox tank in a dark studio); ink bottles; GPU tiers. |
| V4 | REVIEW-04 | **21** | Fixed lantern framing; render scale set before render (no black flash); pigments refitted to sRGB with a soft OD cap; calligraphy brush; auto stroke. Gate blocked on originality (the auto stroke wrecked the hero). |
| V5 | REVIEW-05 | **23** (gate met) | **Redesign 3** of the hero sequence: default brine layer (umbrella), same-column carmine at 8 s with entrainment (two-tone chandelier), vignette and tighter framing, short crown, soft caustics, low-tier brush/pane/ring-cap fixes; auto stroke made opt-in. |
| V6 | REVIEW-06 | **23** (gate met, no regression, no must-fix) | Final polish, see below. |

Score history: **10 → 15 → 17 → 21 → 23 → 23**. Six independent reviews are in `docs/reviews/REVIEW-01.md` … `REVIEW-06.md`, with their evidence in `docs/reviews/assets-01` … `assets-06`.

### V6 polish (REVIEW-05 tells)
1. **Entrainment no longer pre-colours the drop, and has no 20 s cliff.**
   - **Before (V5):** a fixed fraction of the drop's tracers was tagged with the earlier ink at spawn, if the earlier drop was less than 20 s old and within 0.2. This gave a plum drop at entry, a hard cutoff, and 0% red in the hero.
   - **Now (V6):** each tracer hashes a value and blends towards the entrained pigment in the shader with `smoothstep(.05,.65,age)`, so the drop *enters crimson and turns plum as it falls*. The entrained fraction is a smooth function of lateral distance and of how much dye from the earlier drop is still in the column: it decays with age (`exp(-a/45)`, a smooth ramp-down over 3–22 s, a ramp-in over 0.3–2.5 s). There is no cutoff, and the strongest earlier drop wins.
   - **Builder's colour measurements**, share of ink pixels (V5 → V6):

     | Frame | Violet (250–330°) | Red |
     |---|---|---|
     | Hero t16 | 26.2% → 33.2% | 9.0% → 12.2% |
     | Hero t24 | 23.7% → 32.7% | 7.3% → 10.5% |

   - **REVIEW-06's own colour bands** at t16: magenta 13.6% → 20.5%, violet 52.2% → 53.4%. It confirms the crimson entry at t8.6 and plum by t9.2 (`docs/reviews/assets-06/crop-entry-v5-t8.6_v6-t8.6_v6-t9.2.jpg`).
   - **25 s gap control:** V5 snapped to pure red. V6 is still mostly crimson (46.4% red), with a slight smooth plum tint.
2. **Share image:** `og.jpg` (also the showroom card) is cropped on the chandelier and its brine horizon.
   - At 200 px the ink bbox covers **41.8%** of the image, against ~13–20% for V5.
   - Ink pixel fraction is 19.6% (V5 6.7%). The chandelier is a lacy shape, so ≥40% *pixel* fill is not reachable without cutting it.
   - REVIEW-06: "the strongest stranger-facing image the project has had".
3. **Crown:** the thin white sine-wave wall that read as a vector squiggle is gone by default (`?crownwall` restores it). The crown is now flying beads plus the surface ripple rings (`shots/v6-crown-entry.jpg`, `docs/reviews/assets-06/crop-crown-v5-v6-t0.3-t0.6.jpg`).
4. **Optional earlier ink:** not changed. In deterministic time the first drop is already a ring in the water at 1.5 s (`?shot=1.5`). The "empty first 3 s" seen live probably comes from the slow software renderer (~2 fps, with a 0.05 s frame-step cap). Changing the boot timing was not "trivially safe", so it was left alone.

**Hero safety check:** V5 and V6 compared at t8.6, t11, t16 and t24 (`shots/v6-before-after.jpg`; 11 rows in `docs/reviews/assets-06/before-after-v5-v6.jpg`). The chandelier silhouette, umbrella and horizon are unchanged; the colour moved in the requested direction. Nothing was reverted. The entrainment strength was tuned from 0.5 to 0.75: at 0.5 violet fell to 12%, which was too red, and 0.95 left 2% red.

## Actual work
- **Start:** 2026-10-19 09:31 TPE.
- **End:** 2026-10-19 16:33 TPE.
- **Elapsed:** 7 h 02 min.
- **Milestones (TPE):**
  - 09:35 research
  - 09:45 three prototypes; Ink Bloom chosen
  - 10:01 V1 live
  - 10:11 REVIEW-01 (10)
  - 11:21 exploration decision
  - 12:02 V2 live
  - 12:24 REVIEW-02 (15)
  - 13:08 V3 live
  - 13:25 REVIEW-03 (17)
  - 14:22 V4 live
  - 14:40 REVIEW-04 (21)
  - 15:27 V5 live
  - 15:51 REVIEW-05 (23, gate met)
  - 16:06 V6 live
  - 16:16 V6 verified live, docs published
  - 16:30 REVIEW-06 (23, gate met, no must-fix)
  - 16:33 final docs cleanup
- **Redesigns:**
  1. Renderer (point splats → volumetric raymarch, after REVIEW-01).
  2. Environment (bright following camera → lantern tank in a dark studio, V3/V4).
  3. Hero sequence (auto stroke → brine umbrella + same-column two-tone entrainment, V5).
- **Validation, every version:**
  - deterministic `?shot=` evidence sets with before/after sheets, 100% crops and 200 px thumbnails;
  - colour statistics and ink-fill measurements;
  - live-URL checks: HTTP 200, the served JS byte-identical to the build, 0 console errors, rapid clicks (7 clicks 100 ms apart), live salt pour, and black-frame sampling under forced render-scale changes.
- **V6 live results:**
  - 0 errors.
  - Rapid clicks: 8/8 drops, including the auto drop.
  - Salt pour: layer 0.72 → 1.005 → 1.02.
  - Black frames: 0/40 while forcing 34 render-scale changes, and 0/40 normally.
- **Independent review:** six adversarial reviews, each with its own evidence folder. REVIEW-06 also checked v1–v6, the og image, the showroom card and the docs links.

## Known limitations (honest)
- **Real-GPU frame rate is unmeasured.** All testing ran on headless Chrome with SwiftShader (software GL): live 0.7–3.7 fps, GPU probe 22–51 ms. The tier and adaptive render-scale logic is designed for real GPUs but was not measured on one. Motion (#11) is the one criterion still at 1 in REVIEW-05 and REVIEW-06.
- **Entrainment is a rule, not physics.** The second drop takes on the earlier pigment through a per-tracer blend with a smooth age and distance weight. It does not sample or advect the actual dye field, so it can misjudge how much dye a column really holds (e.g. after brush strokes).
- The vortex dynamics are a reduced filament model: no viscous core diffusion, rings are capped, and the split is a rule triggered by wave amplitude. The brine layer is a density rule acting on rings and tracers, not a stratified Navier–Stokes solve.
- **Ink fill:** ink still covers only a small part of the in-app frame (~7% pixel fill at 200 px). Only the share crop reaches ≥40% bbox fill. The og crop is tight at the bottom and shows no tank.
- **V6 trade-offs** noted by REVIEW-06:
  - The t16 chandelier is more marbled, so V5's clean two-tier silhouette is slightly softer at 200 px.
  - Side-by-side indigo+carmine violet fell from 6.0% to 1.9%, at noise level, on a non-hero test.
- On the low tier the chandelier is grainier and the two-tone mix is coarser (fewer tracers). Faint dark hairlines remain in the lobes. A settled ink speck can appear on the floor at late times.
- Desktop Chrome and WebGL2 only. Touch works but was not tuned; audio is minimal.

## Artifacts
In the showroom folder `20261019-ink-bloom/`:
- **Builds:** `index.html` + `main.js` (V6, the live root); `v1/` through `v6/`.
- **Share image:** `og.jpg`.
- **Evidence images:**
  - `shots/v1-*` … `shots/v5-*`
  - for V6: `shots/v6-before-after.jpg`, `shots/v6-crown-entry.jpg`, `shots/v6-entry-t8.6.jpg`, `shots/v6-hero-t16.jpg`, `shots/v6-hero-t24.jpg`
- **Docs:** `docs/` holds FINAL_REPORT, CHALLENGE, PLAN, RESEARCH, REVIEW and PROGRESS, plus `docs/reviews/REVIEW-01.md` … `REVIEW-06.md` with `assets-01` … `assets-06`. The assets were converted to JPG at ≤1600 px. They include the live session frames, the per-version 15 s live frames and the log files.
- **Not published:** the testing tools (shot harness, colour statistics, live, rapid-click, salt and black-frame tests) stay in the build's local work folder.

## What makes this exceptional
- **It shows a phenomenon most people have never seen.** A drop of ink *branches*, again and again, into a chandelier (Thomson & Newall 1885). Here it emerges from simulated vortex rings rather than keyframes, so every drop branches differently and drops interact through their own flow.
- **It does not look like a WebGL fluid toy.** It is subtractive pigment on a bright, backlit field inside a glass lantern. There are no glowing particles on black. Colours mix as real pigments do: indigo plus carmine gives plum. The look follows ink-in-water photography (Seveso, Keever). In REVIEW-05 and REVIEW-06 the adversarial reviewer couldn't name a template it came from.
- **The hero needs no instructions.** One drop falls by itself. A second drop enters crimson, turns plum as it rides the first one's wake, and the whole cascade stalls on a hidden brine layer into an umbrella over a horizon. REVIEW-06's kids-legibility reading of an unlabelled before/after: "a blue drop became a flower, a red one fell in and turned purple, and it stops on an invisible floor."
- **Every judgement has evidence.** It went from 10/24 to 23/24 through six independent adversarial reviews and three redesigns in about seven hours. Deterministic replay frames, colour statistics and live-URL tests stand behind each decision, and the report states openly what was not measured.
