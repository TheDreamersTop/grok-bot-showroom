# PLAN — 影鑄 Shadow Foundry (start 2026-10-08 15:24 TPE)

## Decision (locked by REVIEW-01)
- Concept: **Shadow Foundry, brass-rod sculpture.** No 4th concept. Lumen killed. Chladni is the kill-criterion fallback only.
- Honest Phase-B scores (reviewer): wire2 10/24. Target after look-dev spike: ≥ 14/24 and T1–T3 pass. V1 target ≥ 15/24. Final ≥ 20/24 with criteria 8 & 9 = 2.

## Hero Moment (precise, verifiable)
**What the stranger sees first (no input, ≤ 3 s):** a dark museum corner. Three brass lamp heads *clunk* on one by one. Soft haze beams cut through the room and converge on a tangled nest of aged brass rods tumbling in midair on a thin black pin. Its three wall/floor shadows are soft, grey, unreadable.

**What triggers the reveal:** either the auto-intro (default) or the visitor's turntable drag. As alignment rises, each shadow *darkens* (luminance ratio climbs toward ≥ 4:1) and its penumbra *tightens*. Two oscillators that were beating slow to unison.

**The lock (≈ 350 ms, at ~4.0–4.5 s of auto-intro):**
1. Each lamp iris snaps shut in sequence (stagger 60 ms), collapsing penumbrae from ~30 px → 1 px.
2. Shadows go near-black.
3. Camera pushes in 3 %.
4. A warm triad chord (one note per lamp, panned).
5. Dust in the beams freezes 200 ms.
6. Museum labels fade in under each pool: 「貓 Cat · No. 1」「樹 Tree · No. 1」「鳥 Bird · No. 1」.

**Why surprising:** one meaningless nest casts three *unrelated* crisp pictures at once. The reveal is optical truth, not a particle morph. The visitor then draws their own three silhouettes on the plaster and watches the nest re-forge.

**Not a normal WebGL demo:** content is computed (visual hull + rod sampling); no particles/bloom/space; the before/after pair is binary and namable.

## Look-dev spike (changes 1–4, ≤ 75 min) — CURRENT
Order: figures → lighting → cheap cues → camera/plinth. Gate: T1–T3.

## V1 (changes 5–10) — after spike
Rod art direction, constrained DOF + guidance, auto-intro LOCK, draw-your-own, WebAudio, museum labels, no debug HUD.

## Acceptance (T1–T12)
See reviews/REVIEW-01.md. Evidence under shots/v1-*.png. Independent review #2 will re-score.

## Deployment
Folder: `20261008-shadow-foundry` (git mv from overnight-v3). Pages: https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/. Append to root README + index. Never touch 20261007-orbital-forge.

## Current state
V1 deployed 16:4x TPE: https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/ (commits 3823875, ce18a2e). Awaiting independent review #2. NOT done. Phase D (creative escalation) and coverage ≥97 % are still to come.
