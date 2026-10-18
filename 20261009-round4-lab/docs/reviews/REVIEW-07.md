# REVIEW-07: independent review of live Deep Time v6
Reviewer: GK (Grok Bot). Fresh session on 2026-10-18, 17:05–18:10 TPE. No code edits.
URL: https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v6/ (showroom e91414c), at `?q=4` and 640×360.

## Protocol
Same as REVIEW-06:
- Headless Chrome on SwiftShader.
- **Trusted `page.mouse` strokes** in screen space.
- 3 parallel sessions with 16 carves, R between the blind shapes, a reload, and iPhone-13 emulation.

**Change from REVIEW-06:** the per-carve wait cap went from 420 s to 1100 s. In all 16 carves the log shows `… toRest → reveal` before the final frame was taken, so every "final" is the true resting postcard. The heart timeout did not recur.

Script and logs: `assets-07/rv7.js`, `A.log`, `B.log`, `C.log`.

## Verdict
**v6 = 17/24.** For reference: v5 = 16, v4 = 15, v3 = 17. **Gate: FAIL**, because the total is below 20.

- **Originality = 2. Kids test = 2.** The blind read on final frames was **9/9**.
- **This is the first version to pass both hard criteria.** The ending is now legible: the postcard fits the shape and turns thin shapes so their long side runs across the screen.
- **The fit overshoots.** Canyons touch the frame edges and run under the end-card caption. In the 4-carve run, the 3rd and 4th carves are cropped.
- **The camera climbed.** Most postcards no longer show a horizon, so the "postcard" is now a bigger reveal and the grandeur is gone.
- **The "side canyons" are scallops.** The scalloped rim reads as pie crust or frosting, not as tributaries.
- **The raised-island read survives** on low-oblique postcards.

**AI-expert wow verdict:** "legible and charming, still a clay engraving." Your drawing becoming a canyon is now unmistakable. A sense of deep time and scale is not there yet.

## Functional checks (live, public URL)
| Check | Result | Evidence |
|---|---|---|
| Load / white flash | **PASS.** 40 frames before ready; no white frame. Ready in 4–9 s. | `01` |
| Title, idle hint, draw pose | **PASS.** The draw pose is clean. | `01` |
| Carve → reveal → rim → rest → end card | **PASS** in 16/16 carves. The caption reads "your line, 5.1 million years later". | logs |
| Multi-stroke (house 2, smile 4, boat 3 strokes) | **PASS.** All strokes are kept and legible in both reveal and postcard. | `04` |
| Thin-shape postcards (A, bolt, I) | **Legible but mis-oriented.** The bolt is now big and clear, lying horizontal. The **A is turned about 30° on its side** with its apex under the caption. The **I lies horizontal, so it reads as a minus sign or a bar, not an I.** The corner seam (a dark diagonal plateau edge) is visible on the bolt and I postcards. Red horizontal stripe lines run along the I's wall, with a faint ghost line above it. | `02`, `06` |
| Raised islands | **Improved but not fixed.** On high-pitch postcards (house, smile, boat) the islands read as sunken. On the low-oblique postcard (heart, session C), a **bright cream lip rings the whole island**, so it still reads as a plinth in a moat. | `06` top left |
| Side canyons | **Not delivered.** The outer rims have regular bumps and scallops (smile, boat, bolt). These read as pie crust or icing, not drainage. There are no notches cut into the walls and no branching. | `06` middle left |
| Edge pits | **FIXED.** No far-edge pits in 16 carves. The tap makes only its own small sinkhole. | `05` |
| Grey band | **Softened, still present** at the top of every reveal frame. | `00` bottom half |
| Stair-steps | **Mostly gone** on the lip, which is now soft and fuzzy. Pixel steps remain on dark wall edges, and the I wall shows banding lines. | `06` |
| Edge stroke (top of the screen) | **PASS.** Re-laid inward as one trench. In the low-oblique postcard, the trench reads as a pale raised log with dark drips. | `05` |
| 4+ carves in a row (heart → star → A → spiral, no R) | **Mechanics PASS:** each carve is legible and the older ones silt to ghosts. **Framing FAIL:** the A's postcard is cropped at the bottom and the spiral's at the right and top. The A postcard also shows a **dark lollipop-shaped blob** on the plateau beside the A (a ghost of an earlier carve or a stray shadow). | `03`, `06` top right |
| Postcard canyon ≥ 45 % of frame width | **PASS for all 9 blind shapes** (visual estimate about 50–90 %). The new problem is **over-fit**: the canyon touches the frame edge or sits under the caption in A, S, house, smile and boat. | `00` |
| Wheel scrub, M, R, reload | **PASS.** Scrub back goes to idx 4 (step 82) and forward to 170. M toggles. R was used 8×. Reload returns to `first`. | logs |
| Console / page / HTTP errors | **0** in all three sessions and in mobile. | logs |
| Mobile fallback | **PASS.** | `07` |

## Blind shape read (fresh set)
- **Shapes:** heart, A, bolt, house, star, moon and smile from REVIEW-06, plus **2 new: boat (3 strokes) and S**. Shuffled with seed 71018.
- **Key:** kept outside the repo at `/workspace/_tmp/r4tools/tmp/review07/BLIND_KEY_review07.json`.
- **Guesses:** written before opening the key, in `assets-07/blind_guesses_review07.txt`.

**Final postcards: 9/9.** Boat, S, A (noted as "on its side"), heart, moon, bolt (noted as "lying horizontal"), smile, house and star (noted as "smaller, lower contrast").

This is an upper bound, because I knew the set of names. A child shown the I postcard would likely say "a line" or "a minus". It was outside the blind set.

## Re-check of the builder's open issues
| Issue | Verdict |
|---|---|
| Grey band softened but present | **Confirmed.** |
| Corner seam on I and bolt postcards | **Confirmed** (`02`, `06`). |
| Stair-steps | **Mostly fixed on the lip.** Wall banding and stripe lines remain on the I. |
| No benches | **Confirmed.** |
| Gully pits along the I | **Seen as stripes and ghost lines** along the I, and a nub at its end in the reveal. |

## 12-criterion scores (v6; v5 = 16)
| # | Criterion | v6 | Note |
|---|---|---|---|
| 1 | Focal / composition | 1 | One unmistakable subject, but it is cropped at the edges and under the caption. Most postcards have no horizon. |
| 2 | Value structure | **2** | Reads instantly at thumbnail size. |
| 3 | Palette / colour script | 1 | Coherent; the colour does not change with the story. |
| 4 | Light | 1 | The overbright cream lip glows like frosting; no bounce light in the canyon. |
| 5 | Depth | 1 | The high postcard pitch lost the horizon and sky; no foreground occluder. |
| 6 | Material | 1 | Clay with icing lips; the strata do not read. |
| 7 | Detail @100 % | 1 | Corner seam, stripe lines on the I wall, ghost blob, scallops. |
| 8 | Originality | **2** | Unchanged. |
| 9 | Kids test | **2** | Blind 9/9 on final frames. |
| 10 | Emergent response | 1 | The scallops are decorative noise; no tributaries or benches. |
| 11 | Motion | **2** | Choreography, scrub, silt ghosts. |
| 12 | Polish / UI | **2** | Clean, 0 errors, mobile works. The caption collision is noted under #1 and in fix 1. |
| | **Total** | **17/24** | **FAIL** (needs ≥ 20) |

**Path to 20:**
- #1 → 2: safe-area fit with the horizon kept.
- #5 → 2: horizon, sky and a foreground occluder in the postcard.
- #10 → 2: real tributaries.
- #6 or #4 → 2: a strata and lip regrade.

## Ranked fixes
1. **Postcard over-fit and caption collision (blocker for #1).**
   - Fit to a safe rectangle: exclude the caption band (top ~18 %) plus a 6 % margin on every side.
   - In multi-carve runs, fit only the current carve's cells. The 3rd and 4th carves are cropped now, which suggests the fit reuses an older box.
   - **Accept when** no canyon pixel falls within 4 % of a frame edge or under the caption, across the 9 blind shapes and a 4-carve run.
2. **Bring the horizon back (depth and grandeur, #5 and #1).**
   - Cap the postcard elevation so ≥ 10 % sky shows for compact shapes. The session-C heart shows this works.
   - Raise the elevation only as far as legibility needs.
   - Add a near-ledge foreground occluder.
   - **Accept when** 7 of 9 finals show the horizon and the blind read stays ≥ 8/9.
3. **Don't lay glyphs on their side.**
   - Limit the postcard yaw to ±25° of the drawn orientation.
   - For tall thin shapes (I, A), get the size by moving closer or raising the pitch, not by rotating 90°.
   - **Accept when** an I reads as "I" or "1", not as a minus.
4. **Real side canyons and benches (#10).**
   - Replace the rim scallops with drainage-driven gullies: V notches cut into the wall, ≥ 2× the canyon width long, branching toward the rim low points.
   - Add 1–2 benches per wall from alternating hard and soft strata.
   - **Accept when** an expert reads it as "dendritic tributaries", not "pie crust".
5. **Islands, lips and artefacts (#4, #6, #7).**
   - Cap the lip brightness at ≤ 1.1× the plateau and put it only on sun-facing *outer* rims. This fixes the plinth read on low obliques.
   - Remove the dark ghost blob left by silted carves.
   - Fade the corner seam and the grey band into haze.
   - Kill the stripe lines on the I wall: they look like strata aliasing, so apply a mip bias or a band-limited strata function.

## Key evidence (`assets-07/`)
- `00-contact-blind9-finals-top-reveals-bottom.jpg`: the contact sheet, shuffled order.
- `02-thin-shapes-A-bolt-I-reveal-vs-postcard.jpg`
- `03-four-carves-in-a-row.jpg`
- `04-multistroke-house-smile-boat.jpg`
- `05-edge-stroke-tap.jpg`
- `06-crops-islands-shadow-scallops-seam-Igullies-caption.jpg`
- `01-load-title-pose-reload.jpg`
- `07-mobile.png`
