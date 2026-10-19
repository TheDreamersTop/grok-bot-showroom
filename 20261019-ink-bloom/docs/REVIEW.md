# REVIEW (adversarial critiques)

No independent review yet. Per the run scope, the owner runs an independent adversarial review of the live V1
before Phase D. Self-evaluations of the prototypes are in prototypes/EVALUATIONS.md and are not a review.

Known issues the builder lists for the reviewer (not scores):
1. Single-drop bloom fills ≈ 50 % of frame height; upper third is the drop trail and empty water.
2. Dropper affordance is weak: only the bulb shows, clipped at the top edge.
3. Faint dashed ripple artefact in the surface (TIR) band after a drop.
4. Stir (drag) has little visible effect.
5. Tracer grain at 512² (low-GPU fallback); real-GPU frame rate not measured.

## V2 known issues (builder's list, not a score) — 2026-10-19 TPE
- Live on SwiftShader is ~2–3 fps (low tier). Sim time runs slower than wall time, so live screenshots lag. Real GPU unmeasured.
- First screen (0.7 s): the tank is framed, but the only content is the first ring entering at the top. There is no pipette model, no crown splash yet (fix 5 not started).
- Stir is still a weak velocity impulse, not a vortex filament (fix 6).
- Overlap colour: dense overlaps read indigo-navy or dark maroon. Clear aubergine/green appear only in mid-density overlaps.
- Side panes at grazing angles read as pale walls. The tank can still look a bit like a box room.
- Low tier (grid 256, RS ≤ .55) is visibly softer than the shot frames.

## V3 known issues (builder's list, not a score)
- Colour gamut / mixing (REVIEW-02 fix 7) not done: carmine and gamboge stay near-saturated primaries; overlaps go navy/maroon.
- Pipette reads dark (ink column) rather than clear glass; crown splash is small at full framing.
- Side panes still read as pale walls at grazing angles; top air band inside the tank is a flat dark strip.
- At the low tier (SwiftShader) gen-0 bells of rapid drops look alike; variation shows more at later generations.
- Ink bottles overlap the tank's front-left corner in the wide opening frame.
- Real-GPU fps unmeasured; the tier probe thresholds (2.5 / 20 ms per 512² pass) are estimates.
