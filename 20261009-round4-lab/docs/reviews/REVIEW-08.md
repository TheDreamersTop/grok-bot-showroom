# REVIEW-08: independent review of live Deep Time v7
- **Reviewer:** GK (Grok Bot), in a fresh session on 2026-10-18, 19:25–20:35 TPE. No code edits.
- **URL:** https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v7/ (showroom 883c321), `?q=4`, 640×360.
- **Protocol:** same as REVIEW-07. Headless Chrome on SwiftShader, **trusted `page.mouse` strokes** in screen space, 3 parallel sessions, 16 carves, R between blind shapes, a reload, and iPhone-13 emulation.
- **Waits:** the per-carve wait was capped at 1100 s. For all 16 carves the log shows `toRest → reveal` before the final frame, so every final is a true resting postcard.
- **Script and logs:** `assets-08/rv8.js`, `A.log`, `B.log`, `C.log`.

## Verdict
**v7 = 19/24, one point short of the gate. Gate: FAIL.** Earlier totals: v6 17, v5 16, v4 15, v3 17. Originality = 2. Kids test = 2: the blind read on final frames was **9/9**, with 4 of the 9 guesses hedged.

This is the best version so far:
- The horizon is back.
- The postcard has golden light and a dark foreground ledge.
- The caption sits in the sky.
- Letters stay upright.

It falls short on three things:
1. **The safe-area framing still fails its own acceptance test.** The blind-set arrow's head and lower barb run off the right edge, so it reads as an "L". The 4-carve A is cut at the bottom-left.
2. **The side canyons are hairline cracks, and there are no visible benches.**
3. **The walls read as bristly straw**, not stratified rock.

Fixing #1 alone gives 20. Fixing #1 plus either #2 or #3 gives margin.

**AI-expert wow verdict:** "Close. The ending finally looks like a photograph of a place." The canyons still read as a clean trench in the shape of your drawing, not as landscape evolution. There is no branching, no benching and no talus. Closing that gap is what turns "clever" into "wow".

## Re-check of the REVIEW-07 fixes
| # | Fix | Verdict | Evidence |
|---|---|---|---|
| 1 | Safe-area framing + caption overlap | **Caption: FIXED.** It now sits over the sky in every final. **Safe area: FAILED its own acceptance test** (no canyon pixel within 4 % of an edge). The arrow (blind set) loses its head and lower barb off the right edge. The 4-carve A is cut at the bottom-left. The house's near corner grazes the bottom ledge. | `08`, `03`, `04` |
| 2 | Horizon on 7/9 | **PASS: 8/9 blind finals show the horizon.** The 9th is the bolt, which has no horizon by design, as does the I. The 4-carve finals all have a horizon. The low oblique flattens shapes, though: the house roof and the boat sail get thin. | `00` |
| 3 | Rotation ≤ ±25° | **PASS.** The A, bolt and I are upright in their postcards, and the arrow stays horizontal as drawn. The bolt and I postcards are only ~10–13 % wide, a tall sliver in a wide frame with the grey plateau-edge band across the top. They are legible but empty as compositions. | `02` |
| 4 | Side canyons + benches | **Not delivered visually.** The "side canyons" are short hairline cracks off a few corners (bolt, arrow, A tip), only seen at a 2× crop. No benches are visible on any wall, which matches the builder's note that benches are render-time only. | `06` |
| 5 | Light, material, artefacts, colour script | **Colour script: improved.** The neutral reveal moves to a golden-hour postcard with a warm sky gradient. **Light:** low sun and long shadows, but the canyon floors are crushed near-black, with no bounce or fill. **Material:** the walls have a vertical comb/bristle texture (straw, not sandstone), and the strata don't read. **Artefacts:** the dark lollipop streak beside the A is still in the 4-carve run (builder known). The grey band is soft but prominent in the bolt and I postcards. Silted older carves leave pale ridge-lines. The stripe lines on the I wall are gone. **Islands:** in the low oblique, the lit island walls read about 50/50 between a moat and a plinth. The moon's island reads raised. | `06`, `02`, `03` |

## Functional checks (live)
| Check | Result |
|---|---|
| Load / white flash | **PASS.** No white frame in 40 pre-ready frames. Ready in 4–9 s. |
| Title, idle hint, draw pose | **PASS.** |
| Carve → reveal → rim → rest → end card | **PASS**, 16/16. |
| Multi-stroke: house (2), boat (3), arrow (2) | **PASS.** All strokes kept. (`04`) |
| Edge stroke (top of screen), tap | **PASS.** The stroke is re-laid inward; the tap makes a single sinkhole; no far-edge pits. (`05`) |
| 4+ carves (heart → star → A → spiral, no R) | **Mechanics PASS.** All four are legible and the older ones silt to ghosts. **Framing:** the A is cut at the bottom-left, and the dark streak sits beside the A. (`03`) |
| Postcard width ≥ 45 % | **8/9 blind finals pass.** The bolt is ~12 %, by design. Off-blind, the I is ~10 %. |
| Wheel scrub, M, R, reload | **PASS.** Scrub back goes to step 82 and forward to 170. M toggles. R was used 8×. Reload returns to `first`. |
| Console / page / HTTP errors | **0** in all three sessions and in mobile. |
| Mobile fallback | **PASS.** (`07`) |

## Blind shape read (fresh set)
- **Shapes:** 7 from earlier reviews (heart, A, bolt, house, boat, star, moon) and **2 new ones: arrow (2 strokes) and cloud**.
- **Shuffle:** seed 81018.
- **Key:** kept outside the repo, at `/workspace/_tmp/r4tools/tmp/review08/BLIND_KEY_review08.json`.
- **Guesses:** written before opening the key, in `assets-08/blind_guesses_review08.txt`.

**Result: 9/9 correct.**
- **Confident:** bolt, house, star, moon, A.
- **Moderate:** arrow, boat, heart.
- **Weak:** cloud. I read it as "a wide rounded blob, could be a heart or a pillow".

Excluding the weak guess, the score is 8/9, still at or above 7/8. This is an upper bound, because I knew the name set. Legibility is **less robust than in v6**, because the low oblique compresses depth. A child would likely miss the cloud, and possibly the boat.

## 12-criterion scores (v7; v6 = 17)
| # | Criterion | v7 | Note |
|---|---|---|---|
| 1 | Focal / composition | 1 | Horizon, ledge and clear caption, but the safe area is violated (arrow head off-frame, 4-carve A cut). The bolt/I frames are tall slivers. |
| 2 | Value structure | **2** | Reads at thumbnail size. |
| 3 | Palette / colour script | **2** | Neutral reveal → golden-hour postcard; the green river is the accent. |
| 4 | Light | 1 | Low sun with long shadows, but the floors are crushed black: no bounce, no fill. |
| 5 | Depth | **2** | Horizon, haze, distant mesas, a dark foreground ledge. |
| 6 | Material | 1 | Bristly vertical streaks on the walls; no strata or benches. |
| 7 | Detail @100 % | 1 | Dark streak, hairline cracks, grey band, silt ridge ghosts. |
| 8 | Originality | **2** | |
| 9 | Kids test | **2** | Blind 9/9 (8/9 excluding the weak guess). |
| 10 | Emergent response | 1 | Stubby hairline gullies; nothing branches or benches. |
| 11 | Motion | **2** | |
| 12 | Polish / UI | **2** | Caption in the sky, 0 errors, mobile works. |
| | **Total** | **19/24** | **FAIL** by 1 point (needs ≥ 20) |

## Ranked fixes
1. **Make the safe-area fit actually hold.** This one point flips the gate.
   - Fit the projected 3D bbox of the carved cells plus a rim pad of ~3 cells, after the final postcard yaw.
   - Iterate the distance until all 8 corners sit inside an inner rectangle with a 5 % margin on all sides, over the ledge and under the caption.
   - In multi-carve runs, fit only the newest carve.
   - **Accept when:** in the 9 blind finals plus a 4-carve run, no canyon pixel falls within 4 % of an edge. The arrow is the test case.
2. **Real side canyons (#10).** Upgrade the cracks to **V-notch gullies**: each ≥ 1.5× the canyon width long and ≥ ½ the canyon depth deep, cut into the rim at drainage low points, with 3–6 per 100 rim cells and ≥ 1 branching. Do it in the sim (rim knickpoints with locally boosted erosion), not as decals.
   - **Accept when:** visible at 640×360 without zooming.
3. **Strata and benches on the walls (#6, #7).**
   - Replace the vertical comb texture with horizontal bedding: 4–6 bands of alternating hue and value.
   - Add 1–2 geometric benches by stepping the wall in the height function, not only in the shader.
   - Add talus aprons at the wall feet.
   - **Accept when:** a 2× wall crop reads as "layered sandstone", not straw.
4. **Fill light in the canyon (#4).**
   - Add sky fill plus a warm bounce off the sunlit far wall onto the floor and the shadowed wall, so the floor is ~15–20 % luminance, not black.
   - Let the river glint pick up the sky.
   - This also settles the islands: lit floors make the moat read as a moat.
5. **Thin-shape postcards and artefacts.**
   - For the I and bolt, choose a 3/4 oblique with the horizon (pitch ~35°, closer) instead of a top-down sliver, and keep them upright.
   - Remove the dark streak beside the 4-carve A.
   - Fade silted carves so they leave no pale ridge-lines.
   - Push the plateau-edge grey band into haze in the bolt and I frames.

## Key evidence (`assets-08/`)
- `00-contact-blind9-finals-top-reveals-bottom.jpg`: contact sheet, shuffled order.
- `08-arrow-final-cropped-right-edge.png`
- `02-thin-shapes-A-bolt-I-reveal-vs-postcard.jpg`
- `03-four-carves-in-a-row.jpg`
- `04-multistroke-house-boat-arrow.jpg`
- `06-crops-island-streak-benches-sidecanyon-moon-arrowcrop.jpg`
- `05-edge-stroke-tap.jpg`
- `01-load-title-pose-reload.jpg`
- `07-mobile.png`
