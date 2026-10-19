# REVIEW-05: 墨華 Ink Bloom V5 (live, showroom 8b81bf0)

Reviewer: independent adversarial review (Hostile CD + Principal Engineer). No project code edited.

- **Live URL:** https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/. The served `main.js` is byte-identical to `/v5/main.js` and the local `v5/main.js`.
- **Renders:** headless Chrome on SwiftShader at 1920×1080 and 1440×900. Deterministic frames use `?shot=T&tw=768`; the live session uses `?fps` with a passive watch first.
- **Live run:** HTTP 200, **0 console errors / warnings, 0 failed requests** (`assets-05/log-live.json`).

## Verdict

**23/24. GATE MET: ≥20, originality (#8) = 2, kids (#9) = 2.**

V5 shows the image only this piece can make, and it does so for a passive stranger with no help:

- one indigo drop opens into a Thomson–Newall chandelier;
- a second drop falls through the same column and turns the upper tiers plum;
- the whole cascade stalls and spreads into an umbrella on a visible brine horizon (`hero-t16.jpg`, `crop-chand-t16.jpg`, `crop-horizon-t16.jpg`).

It holds on low tier, at 1440×900 and live (`live-passive-t17.jpg`). The only criterion still at 1 is Motion: the real-GPU frame rate is still unmeasured.

This is not a soft pass, but #8 is the narrowest 2 on the sheet. Its weak points:

- Ink still fills only about 13–20% of the 200 px thumbnail.
- The brine horizon is barely legible at that size.
- The first 3 s are still an empty lit tank.

The reasons are under "Originality" below.

## Scores

| # | Criterion | V1 | V2 | V3 | V4 | **V5** | Evidence (V5) |
|---|---|---|---|---|---|---|---|
| 1 | Focal / composition | 1 | 2 | 2 | 1 | **2** | The default no longer cuts the hero; the auto stroke is opt-in (`hero-t16-autostroke` shows what it was). The two-tone chandelier sits on the axis and the brine horizon gives a base line. The intro push-in takes the tank from 77% to 87% width (live L222–R1698 → L125–R1796). Minus: the ink bbox is small and the upper corners are empty. |
| 2 | Value | 1 | 2 | 2 | 2 | **2** | The back-wall vignette (edges darker) now frames the ink. Dense cores, dark studio. |
| 3 | Palette & colour script | 1 | 1 | 1 | 2 | **2** | Analogous indigo + plum duet. Hero t16: **52% violet (260–330°)** of ink pixels, 13.6% magenta, 34% blue; V4 t16 had 1.9% violet. Dilution still shows by t24/t40. Side-by-side mixing (`mix-ic-t14`) is 6.0% violet (V4 2.3%). Minus: the hero has *no pure carmine left* (0% red), so it has lost its warm accent. |
| 4 | Light | 1 | 1 | 1 | 2 | **2** | The lantern tank glows in a dark room, the brine is faintly milky with soft schlieren streaks (`crop-brine-bands-3x`, intentional rather than banding), and the floor carries a cast shadow. Caustics are now subtle (`crop-caustics-t16`). The tighter framing crops most of the table spill. |
| 5 | Depth | 0 | 1 | 1 | 2 | **2** | Bottle column in the studio margin, glass edges, side panes, the brine horizon as a mid-plane, the floor, the studio. |
| 6 | Material | 1 | 2 | 2 | 2 | **2** | Pigment in water: plum lobes with granulation and a rolled indigo skirt on the layer. Glass pipette with an ink column. |
| 7 | Detail at 100% crop | 0 | 1 | 1 | 2 | **2** | Sim detail survives the crop (`crop-chand-t16`): filament cores, ring rolls and beads. Minor issues: (a) at t≈0.3 the new crown is a thin white sine-wave line plus dots that reads like a vector squiggle (`crop-crown-t0.3`); it lives under 0.28 s. (b) Faint dark hairlines run through the plum lobes. (c) Low-tier side pane is now clean except for faint ticks on the inner edge (`crop-low-pane`). |
| 8 | Originality | 1 | 1 | 1 | 1 | **2** | Rubric for a 2: "can't name the template; new phenomenon + look". The web templates are 2D stable-fluid stir-toys, mostly glowing ink on black; a re-search turned up Ink Wake, the GiveMePrompts Fluid Ink and masafykun/ink. Volcomix/ink-drop is the nearest real-time "ink drop" precedent (not checked visually). None shows a subtractive, backlit vortex-ring cascade that entrains a second pigment and stalls on a pycnocline. At 200 px (`thumbs-v4-v5.jpg`) V5 now reads as a specific silhouette, a two-tone ink chandelier / fuchsia over a horizon, not "ink in an aquarium". The look is in the Seveso / Keever photographic lineage, which was the stated reference, not a template. **Borderline:** small ink fill, a horizon weak at thumbnail size, and the first 3 s empty. |
| 9 | Hero legibility (kids) | 1 | 1 | 2 | 2 | **2** | Unlabelled pair, empty tank → t16: "the drop turned into an upside-down flower / jellyfish, a red one fell into the blue one, and it stopped on an invisible floor." The hint "click the water · 輕點水面", bottles that look like bottles and the salt jar all read without words. |
| 10 | Emergent response | 1 | 1 | 2 | 2 | **2** | 7 rapid clicks → drops 2→9 (7/7). Salt jar: one pour raises the layer 0.72 → 0.895, then 1.137, and the next drop stalls into an umbrella (`live-salt-drop-11s`). Stir curls and mixes. Entrainment is a new consequence a visitor can find on their own (drop into the same spot). |
| 11 | Motion | 1 | 1 | 1 | 1 | **1** | By design it has travelling fronts, accumulation (the descent, the spread on the layer), an eased push-in and fades. But there is **still no real-GPU frame rate**. Live SwiftShader low tier runs 2.3–3 fps idle and drops to 1.0 fps after 7 drops (85 live rings; the low-tier cap of 128 holds). Smoothness can't be verified, so this stays a 1. |
| 12 | Polish / UI in world | 1 | 1 | 1 | 2 | **2** | Clean at 1440×900 (`crop-1440-left`): title, hint, a 6-bottle column clear of the tank. No black frames (12 jpeg probes 60–71 KB; rsChanges=2 with normal frames). No errors. |
| | **Total** | **10** | **15** | **17** | **21** | **23** | **Gate met** |

## Entrainment: plausible or a cheat?

**Verdict: it reads as plausible, so it isn't a cheat in effect. It is a heuristic, not physics, and an expert can catch it.**

- **What it is** (`v5/main.js` ~L469–475): at spawn, if an earlier drop of a *different* ink fell within 0.2 in x/z less than 20 s ago, ~45% of the new drop's tracers (falling linearly to 0 at 0.2 offset) are tagged with the earlier pigment. Nothing samples the actual dye field.
- **What reads right:**
  - The indigo stem really does reach the surface at 8 s (`hero-t6`), so a drop entering that column is *expected* to bruise.
  - The result looks like Seveso-style two-tone ink.
  - The lower tiers keep the indigo and the upper ones the plum, which is causal-looking.
- **Tells:**
  1. The drop is already plum at the surface, before it has fallen through anything (`crop-entry-t8.6`), while the pipette above it holds crimson ink. A real carmine drop enters crimson and darkens as it entrains.
  2. There is a hard 20 s cliff. The control with the same column 25 s later (`entrain-ctrl-gap25-t35`) is pure crimson (4.7% violet) even though indigo still lies lower in the column.
  3. The same ink never entrains itself, and only the most recent prior drop counts.
  4. The 45% is applied evenly, so no pure carmine survives anywhere in the hero (0% red pixels).

  None of these is visible to a passive stranger. Tells 1 and 4 cost some beauty, not just some truth.

## Before / after vs V4

- `before-after-v4-v5.jpg` has 10 rows, `thumbs-v4-v5.jpg` is the 200 px comparison, and `contact-sheet.jpg`, `sheet-hero.jpg`, `sheet-tests.jpg`, `sheet-variants.jpg` and `live-sheet.jpg` are overviews.
- V4 t11–t24 showed a red ribbon slashing a half-formed chandelier. V5 shows a complete, symmetric two-tone chandelier spreading on the horizon.
- At 200 px, V4 read as "messy scribble in an aquarium" and V5 reads as "ink chandelier". This is the change that moves #1 and #8.

## Remaining issues and smallest fixes (optional; the gate is met; each fits in ~60 min)

1. **(~20 min) Make entrainment causal-looking and bring back the accent.**
   - Start the tracers in their own pigment and blend toward the entrained pigment as they fall through the old column (by depth, or over ~0.6 s), so you get a crimson head with a plum skirt.
   - Replace the 20 s cliff with a smooth decay.
   - This fixes tells 1, 2 and 4 and adds a warm accent to the hero.
2. **(~10 min, needs a real device) One real-GPU frame rate.** `?fps` on any laptop or phone, idle and after 7 drops. This is the only path for #11 → 2.
3. **(~5 min) Share thumbnail.** Crop `og.jpg` / the showroom card on the chandelier plus horizon, so the ink fills ≥40% instead of ~15%. This protects the borderline #8 where strangers actually meet the piece.
4. **(~10 min) Crown at t≈0.3.** The thin white sine-squiggle reads as a vector line. Soften or thicken it, or keep only the beads plus the ripple.
5. **(P2) Low-tier live brush** is still a fat spray stroke at 1–3 fps (`crop-live-ribbon`). Side-by-side mixing is still low (6%). Both are acceptable.

Don't start anything larger. Fixes 1 and 3 are the ones that protect the gate; nothing should risk regressing the hero sequence.

## Assets

- **Heroes:** `hero-t0.3/0.6/3/6/8.6/10/12/16/24/40.jpg`, `hero-t16-1440.jpg`, `hero-t0.3-1440.jpg`, `hero-t16-low.jpg`, `hero-t16-salt0.jpg`, `hero-t16-autostroke.jpg`
- **Tests:** `mix-ic-t14`, `mix-gv-t14`, `drops7-t10`, `stir-t10`, `salt1-t13`, `entrain-ctrl-gap25-t35`
- **Crops:** `crop-*.png`
- **Thumbnails:** `thumb200-*.png`
- **Live:** `live-*.png` and `log-live.json`. The shot logs are in `logs/`.
