# REVIEW-06: independent review of live Deep Time v5
Reviewer: GK (Grok Bot). Fresh session on 2026-10-18, 13:50–14:45 TPE. No code edits.
URL: https://thedreamerstop.github.io/grok-bot-showroom/20261009-round4-lab/v5/ (showroom 1117cda), at `?q=4` and 640×360.
Protocol: same as REVIEW-05.
- Headless Chrome with SwiftShader.
- Strokes are **trusted `page.mouse` input** in screen space.
- 3 parallel sessions, 16 carves in total, R between the blind shapes, a reload, and iPhone-13 emulation.
- Script and logs: `assets-06/rv6.js`, `A.log`, `B.log`, `C.log`.

## Verdict
**v5 = 16/24** (v4 was 15/24 in REVIEW-05; v3 was 17). **Gate: FAIL.**
- Originality = 2.
- Kids test = 1. The blind read of the final frames was **6/9**, or 6/8 with the harness-affected heart frame excluded. The gate needs ≥ 7/8.

v5 fixed most of REVIEW-05's mechanical blockers. Multi-stroke works, A is fully framed, edge strokes behave, and 4 carves in a row stay legible. **The reveal frame is now excellent.** Read after the key (so not blind), all 9 shapes are unmistakable in it (`00`, bottom half).

**The game is now lost in the last 10 seconds.** The postcard end frame shrinks thin shapes: the bolt is ~21 % of the frame width and the I is ~15 %. In the rim and postcard views, the inner islands read as **raised pedestals in a moat**.

**AI-expert wow verdict:** the reveal is "oh, that's clever, my drawing became a canyon." The ending is still a "clay engraving," with no side canyons and no sense of scale.

## Functional checks (live, public URL)
| Check | Result | Evidence |
|---|---|---|
| Load / white flash | **PASS.** I captured 40 screencast frames before ready. Mean luma is 45/255 in every frame and the maximum is 187. Ready in 4–9 s. | `01` |
| Title + idle hint | **PASS.** 深時 / DEEP TIME and the glint hint are visible. | `01` |
| Drawing pose | **PASS.** Hovering glides the camera into the pose, and the grey edge slab is gone from the draw pose. A thin grey band is still visible at the top of every **reveal** frame. | `01`, `00` |
| Carve → reveal → rim → rest → end card | **PASS** in all 16 runs. The end card reads "your line, 5.1 million years later". | logs |
| Multi-stroke | **PASS.** House (2 strokes), smile (4), fish (2) and tree (2) kept every stroke, even with SwiftShader's slow frames. | `04` |
| A / I / bolt framing | **A: PASS.** It is fully framed with the crossbar visible, in both reveal and postcard. **I: weak.** Reveal OK, but the postcard is a stubby slot at ~15 % of the frame width. **Bolt: FAIL at the postcard.** The zig collapses into a "1" or "7" at ~21 % width (the reveal is fine). | `02` |
| Inner islands | **Read as RAISED** in the rim and postcard views. A cream lit lip runs on the island's edge but not on the outer rim, and the island top has the same tone as the plateau, so it reads as a pedestal rising from a moat. Hollow-reading at the reveal. | `06` |
| Edge stroke (top of the screen) | **PASS.** It is re-laid inward as one clean trench, with no full-width trench and no stretching. | `05` |
| Tap | A small sinkhole, as designed. | `05` |
| Recurring far-edge pits | **Present.** 1–3 small pits or pale nubs near the far edge in most runs, including the tap and I runs. This matches the builder's known issue. | `05`, `02` |
| 4+ carves in a row (heart → star → A → spiral, no R) | **PASS.** All four are legible and the older canyons silt to faint ghosts. | `03` |
| Postcard canyon ≥ 45 % of frame width (visual estimate on the 640 px finals) | **6/10 pass.** Fish 63 %, smile 56 %, star 53 %, moon 53 %, house 53 %, heart 47 %. **Fail:** tree 41 %, A 32 %, bolt 21 %, I 15 %. Thin shapes fail systematically. | `00`, `02` |
| Wheel scrub | **PASS.** Back 5 notches goes to idx 4 (step 82); forward returns to 170. | A.log |
| M | **PASS.** Mute toggles. | A.log |
| R | **PASS.** Used 8×, and each time it returned to toDraw with steps 0. | logs |
| Space | Not re-measured. It was 1.3× on SwiftShader in REVIEW-05. | |
| Refresh | **PASS.** Returns to `first` with the title. | `01`, C.log |
| Console / page / HTTP errors | **0** in all three sessions and in the mobile session. | logs |
| Mobile fallback | **PASS.** A heart-canyon still plus "Deep Time is drawn with a mouse. Open it on a desktop." | `07` |

## Blind shape read (fresh sheet, 9 shapes)
- **Shapes:** heart, A, bolt, house, smile, star, fish, moon, tree. moon and tree are new. All were drawn live with screen units from REVIEW-05, then shuffled with seed 61018.
- **Key:** kept outside the repo at `/workspace/_tmp/r4tools/tmp/review06/BLIND_KEY_review06.json`.
- **Guesses:** written before opening the key, in `assets-06/blind_guesses_review06.txt`.

**Finals (the resting end frame): 6/9.**
- ✓ star, moon, A, fish, smile, house.
- ✗ **bolt.** I read it as a "1" or "7".
- ✗ **heart.** No read. This tile caught the low rim leg because my harness has a 420 s cap per carve, so it is a harness artefact. The heart's real rest frame in session C reads as a heart.
- ✗ **tree.** I read it as "tree / up-arrow", which is moderate. It was scored as a miss because the guess was hedged.

So the result is 6/9 strict, or 7/9 lenient (counting the tree), with the heart excluded as an artefact. That is still **< 7/8**.

**Reveals:** 9/9, but this read was **after** the key, so it is not blind and doesn't count toward the gate. It does say the fix lives in the ending, not the sim.

## Builder's known issues: independent verdicts
| Issue | Verdict |
|---|---|
| Bolt and I postcards are weak | **Confirmed, and worse than "weak".** The bolt fails the blind read. The A and the tree also fall under the 45 % width rule. |
| Inner islands look slightly raised | **Confirmed, more than "slightly".** In the rim and postcard views they read as pedestals (`06`). |
| Recurring small far-edge pit | **Confirmed** (`05`, `02`). |
| No side canyons | **Confirmed.** The walls are uniform, the outline is buffered, and there are no tributaries. |

## 12-criterion scores (v5; v4 = 15, v3 = 17)
| # | Criterion | v5 | Note |
|---|---|---|---|
| 1 | Focal / composition | 1 | The reveal is a clear single subject, but there is a grey band at the top, thin shapes are small in the postcard, and there is no foreground occluder |
| 2 | Value structure | **2** | The reveal reads at thumbnail size (dark trench, light lip); finals range .35–.70 |
| 3 | Palette / colour script | 1 | The pink is fixed and the palette is coherent, but the colour does not change with the story |
| 4 | Light | 1 | Key + lip + depth darkening; no bounce off the walls |
| 5 | Depth | 1 | Horizon and haze in the postcard; the hero sits in the mid-ground |
| 6 | Material | 1 | Still reads as clay or cake; the strata are faint |
| 7 | Detail @100 % | 1 | Stair-step texel teeth on the wall edges at 2× (`06`); far-edge pits |
| 8 | Originality | **2** | Erosion as deep-time authorship of your drawing; no nameable template |
| 9 | Kids test | 1 | Blind finals 6/8–7/9; the reveal would pass, the ending doesn't |
| 10 | Emergent response | 1 | The result ≈ a buffered outline; no tributaries or benches; nothing unscripted |
| 11 | Motion | **2** | Weighted choreography; the scrub shows time accumulating; silt ghosts across carves |
| 12 | Polish / UI in world | **2** | Load, title, end card, sound, mute, mobile, 0 errors |
| | **Total** | **16/24** | **FAIL** (needs ≥ 20, #8 = 2, #9 = 2) |

The path to 20 is clear and short:
- Fix the ending legibility: #9 → 2, #1 → 2.
- Fix the island and lip shading: #6 → 2 or #4 → 2.
- Add side canyons: #10 → 2.

## Ranked fixes
**Blockers (gate)**
1. **Thin-shape postcard (A, bolt, I, tree).** Before fitting, yaw the postcard camera around the shape so its **long axis runs horizontally on screen** (PCA of the stroke cells, pick the yaw within ±90° of the sun side). Then fit the distance on *width*. For shapes with fine features (minimum gap between segments < 3 canyon widths, e.g. a bolt), raise the elevation to ≥ 55°, or end on the reveal pose instead. Accept when every one of the 9 shapes is ≥ 45 % of the frame width and the bolt passes a blind read.
2. **Raised islands.** Draw the bright caprock lip only where the wall faces the sun **and** the cell is on the *outer* rim. On island rims, cap the lip at ≤ 1.05× the plateau albedo. Drop island-top albedo ~10 % below the outer plateau and add a far-wall cast shadow across the moat floor onto the island foot. Accept when, in an unlabelled rim crop, 3 of 3 viewers say "hole," not "block."

**High value**

3. **Side canyons (#10, grandeur).** Turn on `supOut` with a visible effect: perturb the rim with noise-weighted drainage so headward erosion branches. Target 3–6 short side gullies per 100 rim cells, plus 1–2 benches per wall (alternate hard and soft strata). Accept when tributaries are visible in the reveal and the blind read still passes.

4. **Far-edge pits and the reveal top band.** Clamp sinks and outlets within 0.08 N of the domain edge, or zero erosion there, so the pits stop appearing. Pitch the reveal down 3–4° or fade the plateau edge into haze, so the grey band leaves the frame.

5. **Wall-edge stair-stepping.** Sample the rim and lip mask with the same B-spline or bicubic used for the mesh, or supersample it 2×, so the wall tops stop showing texel teeth at a 2× crop.

**Nice-to-haves**
- A foreground occluder (rock or ledge) in the postcard.
- Colour that shifts with the story, from dawn at the reveal to gold at the postcard.
- A Space speed-up that shows on screen.

## Key evidence (`assets-06/`)
`00-contact-blind9-finals-top-reveals-bottom.jpg` (contact sheet, same shuffled order), `02-thin-shapes-A-bolt-I-tree-reveal-vs-postcard.jpg`, `06-island-crops-heart-smile-heartrim.jpg`, `03-four-carves-in-a-row.jpg`, `04-multistroke-house-smile-fish.jpg`, `05-edge-stroke-tap-farpit.jpg`, `01-load-title-pose-reload.jpg`, `07-mobile.png`.
