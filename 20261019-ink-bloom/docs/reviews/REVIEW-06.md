# REVIEW-06 (final): 墨華 Ink Bloom V6 (live, showroom f859086)

Reviewer: independent adversarial review (Hostile CD + Principal Engineer). No project code edited. Nothing pushed.

- **Live URL:** https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/. The served `main.js` is byte-identical to `/v6/main.js` and the local `v6/main.js`.
- **Showroom:** `main` HEAD = f859086, confirmed through the GitHub API.
- **Renders:** headless Chrome on SwiftShader at 1920×1080 and 1440×900. Deterministic frames use `?shot=T&tw=768`; the live session watches passively first, then drives clicks, stir and salt.
- **Live run:** HTTP 200, **0 console errors / page errors / failed requests**.

## Verdict

**23/24, unchanged from V5. GATE STILL MET: ≥20, originality (#8) = 2, kids (#9) = 2. No regression that costs a point.**

All three V6 changes did what they claimed:

1. **Entrainment.** The second drop now enters **crimson** at t8.6 and is plum by t9.2 (`crop-entry-v5-t8.6_v6-t8.6_v6-t9.2.jpg`; V5 was already plum at the surface). The hero keeps more warm accent: at t16, magenta is 13.6% → **20.5%** and violet 52.2% → 53.4% (260–330° / 330–350° bands, sat > .35). The gap-25 s control is still ≈ pure crimson (5.3% violet), which is consistent with an age decay and no cliff.
2. **Crown.** The vector-looking sine-squiggle wall is gone at t0.3; only the beads and the ripple remain (`crop-crown-v5-v6-t0.3-t0.6.jpg`).
3. **og.jpg.** It is 1200×630 and cropped on the chandelier and horizon. At 200 px the ink fills most of the card (`thumb200-og-live.jpg`), against ~13–20% for the in-app frame. This is the strongest stranger-facing image the project has had.

Minor art notes, none of them a score change:

- The t16 chandelier is now more *marbled*, with plum and indigo threads interwoven. V5's cleaner "plum bell over indigo skirt" two-tier silhouette is slightly softer at 200 px (`thumbs-v5-v6.jpg`). It still reads.
- Side-by-side indigo+carmine violet is 6.0% → 1.9%, which is noise-level, on a non-hero test.
- og.jpg crops tight at the bottom, so the umbrella's outer edges touch the frame edge, and it shows no tank. It reads as a premium ink-in-water photo (Seveso lineage). It is distinctive because of the chandelier shape, not because of the context.

## Scores

| # | Criterion | V1 | V2 | V3 | V4 | V5 | **V6** | Evidence (V6) |
|---|---|---|---|---|---|---|---|---|
| 1 | Focal / composition | 1 | 2 | 2 | 1 | 2 | **2** | Symmetric two-tone chandelier on the axis over the brine horizon; the tank fills 87% of the width after the push-in. Ink still occupies a small part of the in-app frame. |
| 2 | Value | 1 | 2 | 2 | 2 | 2 | **2** | Vignetted back wall, dense cores, dark studio. |
| 3 | Palette & colour script | 1 | 1 | 1 | 2 | 2 | **2** | Indigo + plum + now a crimson head (magenta 20.5% at t16, 17.1% at t24). |
| 4 | Light | 1 | 1 | 1 | 2 | 2 | **2** | Lantern tank, milky brine with schlieren, cast shadow. |
| 5 | Depth | 0 | 1 | 1 | 2 | 2 | **2** | Unchanged from V5. |
| 6 | Material | 1 | 2 | 2 | 2 | 2 | **2** | Unchanged; the crimson entry ring reads as wet pigment. |
| 7 | Detail at 100% crop | 0 | 1 | 1 | 2 | 2 | **2** | Crown squiggle removed. Faint dark filament hairlines remain, which is acceptable. |
| 8 | Originality | 1 | 1 | 1 | 1 | 2 | **2** | Same phenomenon and look as V5. og.jpg now sells it at card size. Still the narrowest 2: the in-app 200 px frame has a small ink fill. |
| 9 | Hero legibility (kids) | 1 | 1 | 2 | 2 | 2 | **2** | Unlabelled before/after: "a blue drop became a flower, a red one fell in and turned purple, and it stops on an invisible floor." |
| 10 | Emergent response | 1 | 1 | 2 | 2 | 2 | **2** | Live: 7 rapid clicks → drops 2→9. Salt pour 0.72 → 0.929 → 1.165 and the next drop forms an umbrella. Stir mixes. Entrainment is now visible as a colour change during the fall. |
| 11 | Motion | 1 | 1 | 1 | 1 | 1 | **1** | Still no real-GPU frame rate. SwiftShader live ran 0.7–2.6 fps; this run is slower than REVIEW-05 because a second browser was running in parallel. Can't be verified. |
| 12 | Polish / UI in world | 1 | 1 | 1 | 2 | 2 | **2** | Clean at 1440×900. 0 errors. No black frames (12 jpeg probes 59–71 KB, rsChanges=2). |
| | **Total** | **10** | **15** | **17** | **21** | **23** | **23** | **Gate met** |

## Delivery checks

| Check | Result | Severity |
|---|---|---|
| Live root, `/v6/` | 200, 0 errors (live session + `logs/versions.json`) | ok |
| `/v1/`–`/v5/` | All 200, **0 console/page errors** after 15 s at 1440×900 (`version-v*-15s.jpg`). v1 shows no ink yet at 15 s wall time on SwiftShader (its slow 2D-era boot); it loads and runs. | ok |
| `og.jpg` | 200, 1200×630, chandelier crop | ok |
| Root showroom index card | Card thumb = `20261019-ink-bloom/og.jpg`; Play → `20261019-ink-bloom/` (200); Source → GitHub tree (200) | ok |
| Root README row | Present (2026-10-19 · 墨華 Ink Bloom, bilingual blurb mentions V6). The Live link (200) and folder link are correct. | ok |
| `docs/FINAL_REPORT.md`, `docs/README.md`, `docs/{CHALLENGE,PLAN,RESEARCH,PROGRESS,REVIEW}.md`, `docs/reviews/REVIEW-01..05.md` | All 200. FINAL_REPORT reports V5 = 23 and states that real-GPU fps is unmeasured (honest). | ok |
| Images inside the docs | The docs embed **no** images (no `![]()`). Asset references are plain filenames, rewritten .png → .jpg. Every filename in REVIEW-02..05 exists under `docs/reviews/assets-0N/`. REVIEW-01 names 3 prototype sheets (`p1-sheet`, `p2-t07b`, `p3b-sheet`) that were not copied. | optional |
| `docs/README.md` link `reviews/` and project README link `docs/` | **404 on GitHub Pages**, which has no directory index; they work in the GitHub repo view. | optional (link to the GitHub tree URL or to `reviews/REVIEW-01.md`) |
| FINAL_REPORT file paths | Mentions work-folder paths (`shots/v6/before-after-v5-v6.jpg`, `shots/v6/crops-crown-entry-v5-v6.jpg`, `og-v6.jpg`, `shots/v6/after/hero-t*.png`) that don't exist in the showroom, which has `shots/v6-before-after.jpg`, `v6-crown-entry.jpg`, `v6-hero-t16.jpg`, `v6-entry-t8.6.jpg`. These are plain text, not links. | optional |
| REVIEW-06 in docs | Not published; FINAL_REPORT says five reviews. | optional (copy this review if the record should be complete) |

**No must-fix before delivery.**

## Assets (`assets-06/`)

- `before-after-v5-v6.jpg` (11 rows), `thumbs-v5-v6.jpg` (with the live og), `og-live.jpg`, `thumb200-*.png`
- `hero-t0.3/0.6/8.6/9.2/12/16/24.jpg`, `hero-t16-1440.jpg`, `hero-t16-low.jpg`, `entrain-ctrl-gap25-t35.jpg`, `mix-ic-t14.jpg`, `salt1-t13.jpg`
- `crop-entry-v5-t8.6_v6-t8.6_v6-t9.2.jpg`, `crop-crown-v5-v6-t0.3-t0.6.jpg`
- `live-*.png`, `log-live.json`, `version-v1..v6-15s.jpg`, `sheet-versions-live.jpg`, `logs/` (shot logs, `versions.json`)
