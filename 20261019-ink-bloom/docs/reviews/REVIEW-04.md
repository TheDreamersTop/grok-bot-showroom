# REVIEW-04: 墨華 Ink Bloom V4 (live, showroom 7f407db)

Reviewer: independent adversarial review (Hostile CD + Principal Engineer). No project code edited.
Live URL: https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/ (byte-identical to `/v4/` and `v4/main.js`).
Renders: headless Chrome at 1920×1080 on SwiftShader. Deterministic frames use `?shot=T&tw=768`. The live session is `?fps`, and the log is in `assets-04/log-live.json`.
Live run: HTTP 200, **0 console errors, 0 failed requests**.

## Verdict

**21/24. The gate is NOT met: originality #8 = 1.**

V4 fixed almost everything REVIEW-03 asked for: the black flash, camera drift, the lantern framing, the colour gamut, the crown, the pipette, the loops, the stem hook, salt discoverability and the UI.

But the new **auto calligraphy stroke at 6.2 s slashes through the indigo chandelier while it is still forming**, so the default hero is wrecked. A passive stranger never sees the one image only this piece can make (the full Thomson–Newall cascade). Instead they get a red ribbon and a red curled blob hanging off the right side. Compare `hero-t11.jpg` / `hero-t16.jpg` / `hero-t24.jpg` with `hero-t11-noauto.jpg`. This blocks #8 and drags #1 down.

## Scores

| # | Criterion | V1 | V2 | V3 | **V4** | Evidence (V4) |
|---|---|---|---|---|---|---|
| 1 | Focal / composition | 1 | 2 | 2 | **1** | Framing is now excellent: a symmetric lantern, the tank at 78% width after the push-in and dark side panes (`hero-t6`). But the default payoff at 10–25 s is unbalanced. The auto stroke cuts the cascade, puts a heavy carmine blob at the right edge, and the chandelier never completes (`hero-t11/16/24` vs `hero-t11-noauto`). Restore the payoff and this is a 2. |
| 2 | Value | 1 | 2 | 2 | **2** | The dark studio, the glowing tank and dense ink cores give a clear value hierarchy. |
| 3 | Palette & colour script | 1 | 1 | 1 | **2** | Gamut fixed: carmine reaches (172,9,22), plus true amber and teal (`mix-gamboge-viridian`). Dilution shift is visible by t24. Mixing works when ink overlaps: a same-x overlap gives **46% violet pixels**, a real aubergine (`crop-mix-same-x`). It does NOT happen with default placement: side-by-side indigo+carmine gives 2.6% violet, gamboge+viridian 3.6% green, carmine+gamboge 7.7% orange, 7 drops 3.1/1.4/5.4%. So this is a placement problem, not a render problem. |
| 4 | Light | 1 | 1 | 1 | **2** | The tank is now the light source: it spills onto the table, there are table caustics, Beer–Lambert cores and forward-scatter rims. Minus: the caustic "web" is a high-contrast, regular Voronoi texture that reads CG (`crop-table-caustics`). |
| 5 | Depth | 0 | 1 | 1 | **2** | Five layers: foreground bottle column, glass edges, dark side panes, a lit interior with floor perspective, and the studio with its table. |
| 6 | Material | 1 | 2 | 2 | **2** | Ink reads as pigment in water: rolled edges and granulation (`crop-brush-t11`). The pipette is clear glass with a red bulb and an ink column (`crop-crown-t0.6`). |
| 7 | Detail at 100% crop | 0 | 1 | 1 | **2** | Fixed: no dark contour loops on the young ring (`crop-ring-t3`) and no "?" stem hook. Gen-2 holds at tw512. Minuses: the crown is a translucent grey sine-wave curtain behind the pipette that reads like smoke, not water. The low tier shows stair-step jaggies on the inner side pane (`crop-live-ui-salt`). The bottom glass slab shows streaked ink refraction (`crop-slab-t16`), which is plausible and not a bug. |
| 8 | Originality | 1 | 1 | 1 | **1** | At 200 px (`thumbs-v3-v4.jpg`) V4 no longer reads as "ink in a white box room". It reads as **"ink in a lit aquarium in a dark room"**: a classier but familiar genre (ink-in-water macro footage). The distinctive things (the fractal cascade chandelier, the salt-layer umbrella) are not in the default thumbnail, and the auto stroke actively erases the cascade. The ink occupies about 25% of the thumbnail; the rest is an empty white back wall. |
| 9 | Hero legibility (kids) | 1 | 1 | 2 | **2** | Kids test: bottles look like bottles (32 px column, correct hues), the pipette looks like a dropper, click → drop → splash → it grows, and the salt jar is labelled "鹽 salt · pour brine" when active. A 7-year-old gets it in under 5 s. |
| 10 | Emergent response | 1 | 1 | 2 | **2** | 7 rapid clicks 110 ms apart → drops 1→8, released 2→9, so the queue is correct. One salt pour → a visible horizon line and the cascade flattens into an umbrella (`salt-1pour-t13`, `crop-live-salt-umbrella`). Stir mixes and curls. |
| 11 | Motion | 1 | 1 | 1 | **1** | By design: a critically damped intro push-in (`camTarget(wide)` 1.13× → 1× after 1.2 s, k=.9, x always 0, no ink-follow drift), R fades out, and old rings fade at the cap. Still **no real-GPU frame rate**. Live SwiftShader low tier runs 2.2–3 fps, falling to **0.8 fps with 185 live rings** after 7 drops, so smoothness can't be verified. |
| 12 | Polish / UI in world | 1 | 1 | 1 | **2** | The title fits (墨華 *Ink Bloom*, small), there is a 32 px bottle column clear of the tank and a salt jar label. No black frames: 12 jpeg probes were 61–74 KB, and frames after `rsChanges=2` were normal. No errors. The auto stroke is the polish regression. |
| | **Total** | **10** | **15** | **17** | **21** | **Gate needs ≥20 AND #8=2 AND #9=2 → fails on #8** |

## REVIEW-03 fixes: re-check

| REVIEW-03 fix | Status | Evidence |
|---|---|---|
| Black flash on RS change | **Fixed** (as far as SwiftShader can show) | `allocRT` now runs before render. Live had 2 RS changes; bf0–11 jpeg sizes were 61–74 KB with no small black frames; post-change frames were normal. |
| Camera drift / bloom cut | **Fixed** | cam.x stays 0. cam.d goes 6.33 → 5.67 once (an intentional intro push-in, critically damped), then is constant for 60 s. The tank is 69% width at t0.3, then 77.7% (L214–R1706). |
| Lantern framing / 200 px thumb | **Mostly fixed** | Now a glowing tank in a dark studio with dark side panes. It is no longer a "white box room", but the interior is still a big flat white rectangle and the ink is small at thumbnail size. |
| Colour targets | **Fixed** | Carmine (172,9,22), amber, teal; see #3. |
| Mixed ≥15% | **Not met by default** | 2.6–7.7% side-by-side vs 46% violet with same-x overlap. The renderer mixes; the default placement keeps the inks apart. |
| Brush as ink (taper, 飛白, curls) | **Partial** | High tier / shot (`stir-t10`, `crop-brush-t11`): taper, rolled edges, a curl, and violet where the ribbon crosses indigo. Good. Live low tier (`crop-live-ribbon`): a near-uniform-width spray-paint sausage, and 飛白 is not visible. |
| Dark loops / stem hook | **Fixed** | `crop-ring-t3`, `crop-bell-t11-noauto` |
| Crown 2.5× | **Bigger but wrong material** | The 11 beads are good. The crown curtain is grey, translucent and wide, sitting behind the pipette tip; it reads as smoke or a hologram (`crop-crown-t0.6`). |
| Clear glass pipette | **Fixed** | Clear barrel, red bulb, ink column. |
| Salt: one pour → umbrella | **Fixed** | salt 0.586 after a 0.9 s hold, 1.396 after a longer one. Visible horizon; the drop spreads at the layer. |
| Jar label / glint | **Fixed** (label confirmed) | "鹽 salt · pour brine" when S is active. The glint was not separately confirmed in stills. |
| Title / 32 px bottles | **Fixed** | `crop-live-ui-salt` |
| Ring-cap fade | **Works** | Live rings were capped at 185 against 578 total. |
| Auto calligraphy stroke at ~6 s | **Implemented and harmful** | See the verdict. Timing and placement destroy the hero. |
| Real-GPU frame rate | **Still missing** | Only SwiftShader numbers exist. |

## Top fixes for the final pass (about 2 h; budget ends about 17:31 TPE)

1. **(P0, ~20 min) Give the hero back to the cascade.**
   - Remove the 6.2 s auto stroke from the passive sequence, or move it to ≥18 s. If it stays, make it thin sumi through the empty *upper* water, with no end-curl blob.
   - Instead, at ~8 s auto-drop **carmine into the same column (same x, z ±0.02)**. That alone gives the plum/aubergine mixing (46% violet when overlapped) and a two-tone chandelier.
   - Fixes #1 and the ≥15% mixing target, and is the precondition for #8.
2. **(P0, ~40 min) Make the default thumbnail something only this piece does.** Two cheap levers, ideally both:
   - (a) A default faint salt layer (pycnocline) partway down, so the passive cascade spreads into an umbrella canopy: an "ink tree" with a visible horizon. Your best unique image is currently hidden behind the S key.
   - (b) Kill the empty white rectangle. Add an inner-tank vignette or warm gradient on the back wall (centre bright, edges ~60%), or frame tighter so the ink fills ≥40% of the 200 px thumb.
   - Then re-check at 200 px. That is what #8 is judged on.
3. **(P1, ~20 min) Crown material.** Replace the grey translucent curtain with a short-lived (<0.35 s), narrow, bright-rimmed crown at the surface with specular beads. If it can't look like water, cut it to beads plus a ripple ring; the ripple is already good.
4. **(P1, ~10 min) Table caustics.** Cut contrast ~50%, blur, warm them, and break the regular cell web. They currently pull the eye and read CG.
5. **(P1, ~15 min) One real-GPU number.** Run `?fps` on any real laptop or phone: high tier idle, then after 7 drops. Low tier on SwiftShader falls to 0.8 fps with 185 live rings; consider capping MAXR / live rings lower on the low tier.
6. **(P2, ~10 min) Low-tier brush.** Enforce taper and a dry-brush break at low RS; live low tier is a uniform spray stroke.
7. **(P2, ~5 min)** Low-tier side-pane stair-step aliasing (inner pane edge).

If 1+2 land cleanly, I expect #1 → 2 and a real shot at #8 → 2 (total 23). The other items are polish and can't move the gate.

## Assets

- `before-after-v3-v4.jpg`, `thumbs-v3-v4.jpg`, `contact-sheet.jpg`, `live-sheet.jpg`
- `hero-t0.3/0.6/3/6/8/11/16/24.jpg`, `hero-t11-noauto.jpg`, `hero-t11-tw512.jpg`
- `mix-*-t14.jpg`, `p0-7drops-0.1s-t8.jpg`, `stir-t10.jpg`, `salt-1pour-t13.jpg`, `var4-indigo-t12.jpg`
- `crop-*.png` (crown, pipette, ring t3, bell, brush, slab, bottles/title, side pane, mix, gen2 tw512, salt umbrella, caustics, live ribbon, live UI)
- `live-*.png` plus `log-live.json` (live session: errors, info snapshots, black-frame probes)
