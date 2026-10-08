# REVIEW-03: Independent adversarial review of Pass 1 (v1b, live), 2026-10-08 ~18:20 TPE
Roles: Hostile Creative Director + Principal Engineer.

**What I judged:** only my own renders of the **live URL** (https://thedreamerstop.github.io/grok-bot-showroom/20261008-shadow-foundry/). I used headless Chrome with SwiftShader. I also used the builder's `shots/v1b-*` for reference only. I did not edit code or the repo.

All assets are in `reviews/review03-assets/`.

**Renders, `?shot=1`, 1920×1080:**
- `live-t0.5`, `live-t1.5`, `live-t3`, `live-t4.0`, `live-t6-hero`
- `live-scrambled`, `live-scrambled-p2`, `live-preset2-t6`, `live-mid-approach`, `live-wide-cd26`
- `live-forge-flyin` (forgeTest heart/star/A, phase=long)
- `live-1440x900-t6` (1440×900)

**Thumbnail:** `thumb-320.png`.

**Default mode** (no shot flag, fixed waits):
- `live-default-{4,10,20}s.png`
- `live-default-click-{35,45,60}s.png` (canvas click at ~76 s wall-clock)

**Crops:**
- `crop-object-hero-200`, `crop-object-p2-200`, `crop-object-scr-200` (2× nearest)
- `crop-cat-100`, `crop-tree-100`, `crop-swallow-100`, `crop-beam-left-100`, `crop-lamp-right-100`

**Sheets:**
- `sheet-opening-live.png` (0.5 / 1.5 / 3 / 4 / 6 s, plus scramble)
- `crops-spoilers-nolabel.png`

**Console:** 14 fresh sessions, all against the live URL:
- **0** pageerrors, **0** HTTP ≥ 400 responses, **0** failed requests, **0** GL driver warnings.
- Baked presets load. The console reports:
  - No. 1: 98.7 / 99.7 / 98.2
  - No. 2: 98.7 / 98.1 / 98.2
- Worker forge (live, headless): 97.4 / 96.7 / 95.6 %. First rods at **5.06 s**, done at **5.88 s**. That's slower than the builder's 3.3 / 3.85 s, but my sessions ran 3–4 in parallel on 8 cores, so treat it as a worst case.

**Default mode caveat:** under SwiftShader the intro clock crawls. At 4 s wall-clock all lamps are still off, and at 76 s the intro is still on lamp 1. Motion in default mode **cannot be judged headless**. Everything about motion below comes from the deterministic `t=` frames.

**Limitation:** I know the targets, so my naming isn't truly context-free. I read every crop *as a stranger*, and the spoiler frames below are unambiguous anyway.

---
## Verdict in one paragraph
Pass 1 is a **real visual step** and reaches the target **exactly: 15 → 18/24**. The solved frame has become a lit room:
- coloured pools (warm 2700 K cat, cool tree, neutral floor);
- pool centres at **0.52–0.53 linear** (V1 0.80–0.90);
- clean shadow edges with no pinholes;
- a ceiling track with all three lamps in frame;
- a floor that reflects the pools;
- a fixed preset 2 that reads instantly (hand / key / butterfly).

The +3 comes **entirely from the visual criteria** (palette, depth, detail). The **experience criteria (8 originality, 9 hero, 10 motion) are unchanged at 1.** The reveal is still spoiled, and the lock is still a non-event:
- at **t = 1.5 s** there is a **cat with a raised curled tail on the TREE wall**;
- at **t = 3 s** the **cat is fully legible** on its own wall;
- the scrambled pose shows the **curled cat tail on both walls**;
- the builder's own lock filmstrip shows 8 practically identical frames.

Pass 2 must be about **one thing first: a real chaos → picture transformation**. Everything else is secondary.

---
## What I see (named as a stranger, no labels)
| Frame | Left wall (tree lamp) | Right wall (cat lamp) | Floor | Brass object, main camera |
|---|---|---|---|---|
| t = 0.5 | dark, unlit | leaf / splat with a stalk, hint of an ear | – | small brass cluster |
| **t = 1.5** | **a cat lying down with its tail up** (spoiler, wrong wall) | maple leaf / splat | blob with a stalk (sea creature?) | crumpled brass foil |
| **t = 3.0** | sitting dog/bear with a tail | **sitting cat, 100 % legible** | flying-squirrel / hide shape | brass clump |
| t = 4.0 / 6.0 | **tree** (lollipop/broccoli canopy, forked trunk) | **cat** (sitting, seen from behind, ears, curled tail) | **swallow / bird in flight** (forked tail) | **a small brass sitting animal with a curled tail**, squirrel or cat (`crop-object-hero-200`) |
| scramble | blob with a **curled tail** (squirrel) | the **same** blob with a curled tail | cross / cactus | **a cross / crucifix** (`crop-object-scr-200`) |
| preset 2, t = 6 | **key** | **hand** (five fingers, instant) | **butterfly** | spiky brass bouquet / claw. Doesn't read as a hand: good |
| preset 2, scramble | ink-blot hatching | ink-blot hatching | hatching, almost glyph-like | small brass fragments. **This is what the "before" should look like** |
| forge test | star | heart (ragged top edge) | letter A | **a brass heart**: the object gives it away |

**Object vs. figure:**
- **No. 1** no longer screams "cat" at viewing size (~190 px tall at 1080p). At 100 % it is still a sitting animal with a curled tail; the hook *is* the giveaway.
- **No. 2** is genuinely abstract from the camera.
- **User forges** (the heart) are again literal.

**Room:**
- The room now reads at thumbnail size: corner seams, track, drop rods, lamps.
- Plaster away from the pools measures **0.006–0.007 linear** (target 0.015–0.03), so the walls are nearly black. The room reads **only through seam lines and the track**, not through surface.
- Bounce is real but weak: 0.016 next to the beam.

**Lighting:**
- Pools have colour, a soft lens fringe (bluish chromatic edge) and visible plaster grain.
- But they are still **three identical perfect discs**, same size and falloff, overlapping in a **Venn/trefoil diagram dead centre**. That's still the stage-spotlight template.
- **Beams:** faint wedges with dust motes. **No rod-sliced dark streaks visible at 100 %** (`crop-beam-left-100`).
- **Floor reflection:** present and nice (the blue/cream smear under the floor pool). This is the most "expensive" cue in the frame.

**Edges:**
- Cat, swallow and key are clean, with no pinholes. Huge improvement over V1.
- The tree canopy shows faint lighter ring outlines inside the blobs ("broccoli").
- The forged heart is ragged on top.
- **The suspension wire's shadow lands exactly on the cat's head and on the tree's crown.** It reads as a *hanged cat* or a puppet on a string.

**Object material:** at 100 % the brass is **short chips / shredded tobacco**, not rods:
- no long rods crossing the hull;
- no visible gauge variation;
- dark brown with sparse yellow glints.

The object sits on the bright pool overlap, so it reads as a dark crumb on cream (low figure/ground pop).

**1440×900:** the composition holds. The pools scale up, the labels stay legible, and nothing clips.

**320 px thumbnail:** tree, cat and bird all read, and the room corner reads. Passes.

---
## Benchmark /24 (REVIEW-02: 15)
| # | Criterion | V1 | **v1b** | One-line justification |
|---|---|---|---|---|
| 1 | Focal point | 2 | **2** | Three pools converge on the object; all three lamps are in frame, so every shadow has a visible cause. |
| 2 | Value | 2 | **2** | Pools 0.52–0.53, shadows ≈ 7 : 1, blacks rich, thumbnail reads. |
| 3 | Palette | 1 | **2** | Warm / cool / neutral lamp colours finally visible, with brass as the accent. Coherent. |
| 4 | Lighting | 1 | **1** | Fringe, bounce and reflection are added. But the pools are 3 identical discs in a Venn layout and the beams are still a smudge with no rod shafts. |
| 5 | Depth | 1 | **2** | Track, drop rods, corner seams and reflective floor make a room. (Plaster is still too black.) |
| 6 | Material | 1 | **1** | Plaster now visible inside the pools, but the brass at 100 % is short chips, not rods. No gauge variety, no rim. |
| 7 | Detail at 100 % | 1 | **2** | Clean edges, no pinholes on presets. Minor: canopy rings, wire shadow. |
| 8 | Originality | 1 | **1** | Still read as "a figurine with its shadows": the No. 1 object has the tail hook, and the heart forges a heart. The Venn-disc composition is template-ish. |
| 9 | Hero legibility | 1 | **1** | The after frame is a 2; the before → after is still a fade over figures legible from ~1.5–3 s. |
| 10 | Motion (strips) | 1 | **1** | Lock filmstrip 3.6–5.0 s: 8 near-identical frames. Opening tumble passes through cat poses. |
| 11 | UI / typography | 2 | **2** | Placard and wall labels are in-world. Minor: raw ids leak ("letterA", "· heart"). |
| 12 | Polish | 1 | **1** | Fixed preset 2, baked boot and Worker forge are real. But reveal spoilers, a crucifix scramble pose, and default-mode pacing/fps unverified on GPU. |
| | **Total** | **15** | **18** | **Pass 1 target (≥ 18): met, at the floor.** |

Criterion 4 is the closest call (1.5). A generous reader gives 19; I won't.

---
## Pass 1 checklist (REVIEW-02): verdicts
| Item | Verdict | Evidence |
|---|---|---|
| 1. Fidelity ≥ 98 %, no pinholes, bake presets, fix the fish | **DONE** (presets) / **PARTIAL** (user forges) | Live console 98.7/99.7/98.2 and 98.7/98.1/98.2. Edges are clean at 100 %. The fish is replaced by a butterfly that reads instantly. Forge test 95.6–97.4 % with a ragged heart top. |
| 2. Exposure 0.55–0.65, lamp colours, plaster, lens ring/fringe, **pools differ** | **PARTIAL** (mostly done) | Measured 0.517–0.533 (a hair low); colours, grain and fringe are visible. **Pools are still identical discs:** same size, same falloff, no differing focus or shape. |
| 3. Room: plaster 0.015–0.03 + bounce, reflective floor, ceiling track | **PARTIAL** | Track ✓, reflection ✓, bounce weak ✓. **Plaster 0.006–0.007, 2–4× too dark.** |
| 4. Beams: 2–3× haze, rod-sliced streaks, motes | **PARTIAL** | Motes ✓, haze up ✓. **Streaks not visible** at 100 %. The builder admits "subtle". |
| 5. Object: longer rods, 3 gauges, darker patina + 10 % polished, rim bounce, wire suspension | **PARTIAL** (wire done, rods not) | Wire ✓, and nothing lands on the swallow ✓. But the rods read as chips, the hook remains, there's no rim pop, and the **wire shadow hangs the cat and the tree**. |
| Proof set | **DONE** | Before/after, crops, coverage table, luminance, thumbnail all present and consistent with my renders (one source: forgeRods). The T6 metric conflict from REVIEW-02 is resolved. |

---
## Top 5 problems (blunt)
1. **The hero is still spoiled and still a fade.**
   - A cat with a raised tail appears on the **tree** wall at 1.5 s.
   - The real cat is fully legible at 3 s.
   - The scramble shows the cat's curled tail on **both** walls, so the "puzzle" is pre-solved by recognition.
   - The lock frames are identical.

   This is the biggest gap between "beautiful still" and WOW, and it hasn't moved since V1. Preset 2's scramble (pure hatching) proves the right "before" is possible.
2. **The object gives the game away.**
   - No. 1 is a little brass sitting animal with a curled tail (`crop-object-hero-200`).
   - User forges are literal (a brass heart casts a heart).
   - The **scramble pose of No. 1 is a crucifix** (`crop-object-scr-200`), with a cross-shaped floor shadow. That's an unforced religious-symbol accident sitting in the default puzzle state. Kill it.
3. **Template lighting composition.**
   - Three identical perfect discs overlap as a Venn/trefoil dead centre.
   - The object is a dark crumb (~17 % of frame height) sitting on the bright overlap, with weak figure/ground.
   - Beams are faint wedges with no rod shadows in the air.
   - Plaster outside the pools is black, so the "room" is only lines.
4. **Brass reads as shredded tobacco, not a forged object.** Short, uniform chips with sparse glints. Up close, nothing says "1,457 hand-cut rods" (no long members, no gauge hierarchy, no polished highlights). And the **wire shadow on the cat's head and the tree's crown** reads as a hanged animal.
5. **Interaction is unchanged from V1:**
   - drag to solve (trivial);
   - draw three (high effort, ~4–6 s headless, literal object, ragged);
   - next.

   Nothing to keep or share. Test ids leak into the UI ("letterA", "· heart"). Real-GPU fps is still unmeasured. The Pass 1 frame cost rose ~30 % (builder's number), and nobody has seen the default-mode opening at real speed except on SwiftShader, where it crawls.

---
## Pass 2 (Experience) plan: prioritized, ~18:25 → 20:45, then Pass 3 20:45 → 22:00, QA/deploy/report 22:00 → 23:24
**Single most impactful change: "The Forge" opening, built as an IMPLOSION, not a fly-in.**

Physics lesson from your own frames: if rods fly *to their final positions* one by one, any subset of hull rods projects *inside* the silhouette. The figure's envelope is legible by ~40 % arrival, which is exactly why t = 1.5–3 s spoils.

The fix is a two-phase choreography:

| Time | Phase | What happens |
|---|---|---|
| 0–1.2 s | Dark | Dark room, wide; the lamps clunk on one by one onto **empty** walls. |
| 1.2–4.2 s | **Storm** | ~1,000+ rods swirl in a loose **cloud 1.6–2.2× the hull radius**, randomly oriented and slowly orbiting the wire point. Each pool fills edge to edge with moving hatching. **Nothing nameable.** This also covers the Worker wait for user forges: the storm *is* the loading state. |
| 4.2–4.9 s | **Implosion** | All rods collapse together onto their final transforms. Use an **ease-in** (accelerating) curve with ±80 ms per-rod jitter, rotate to the final orientation during the last 40 % of travel, and land within ~150 ms of each other. The silhouettes appear only in the last ~250 ms, **on all three walls at once**. |
| ~4.9 s | Lock | Metallic clatter → chord, 2–3 % push-in, a dust puff in the beams, labels. |

- Shadows are physically dark the whole time.
- **Acceptance:** context-free crops at t = 1, 2, 3, 4 s name **nothing**; t = 5.5 s names **all three**; 12-frame filmstrip.

Everything below reuses this one system.

| Pri | Item | Time | Verdict | Notes |
|---|---|---|---|---|
| **1** | **The Forge implosion opening** (above) | 60–75 min | **DO** | The whole score delta (8, 9, 10 → 2) lives here. Also fixes T2. Skippable on first click. |
| **2** | **Shatter → storm → implode next work** (click sculpture / "Next work" / Space) | 30 min | **DO** | Same code reversed: the burst goes to the cloud (with gravity sag and clatter), hovers, then implodes into the next work. Every transition becomes the hero. |
| **3** | **Type three letters → forge + share URL** (`#w=GEB`) | 60 min | **DO, constrained** | <ul><li>A–Z only, a heavy square sans (blocky glyphs are hull-friendly).</li><li>Rasterise → Worker → the storm runs while it computes → implode.</li><li>Placard: "No. 7 · G, E, B · forged for you · xx.x % fidelity" (honest number).</li><li>"Copy link" button; the fresh-session `#w=` URL opens straight into the forge.</li><li>**Pre-test ~20 combos** (GEB, ABC, your initials-style pairs). If some letter triples fall below ~93 %, show the number anyway. Don't fake.</li><li>**Bake GEB as Work No. 3.** That's the Hofstadter homage experts will screenshot.</li></ul> |
| 4 | **Draggable lamps** (drag a lamp head along the track; its shadow skews and slides; spring home, re-lock chord) | 25–30 min | **DO if items 1–3 land by ~20:15** | The cheapest proof that it's real projection, and great discovery value. |
| 5 | **"Be the lamp"** (double-click a pool → camera flies to the lamp and looks through it → the brass occludes as the figure) | 20 min | **Pass 3 stretch** | Expert delight, but only if the camera path is smooth. Never ship janky. |
| 6 | **4 curated works in one room** | – | **3 works, not 4** | cat/tree/swallow, hand/key/butterfly, GEB. **Drop 影/光/形** unless it bakes ≥ 95 % in one try (complex CJK strokes are hull-hostile, a likely time sink). |
| 7 | Scramble puzzle | 10 min | **Demote + fix** | Pick a new scramble pose: no crucifix object, no tail on any wall (preset 2's scramble is the model). Or enter the puzzle only via a shatter-half-rebuild. Not the main verb. |
| – | Drawing mode | – | **Keep, don't invest** | Rename the test ids. It stays as the "advanced" path behind type-to-forge. |
| – | Multi-room, orbit camera, big finale | – | **NO** | Feature count, not quality. |

**Fold into Pass 2 while you're in those files (small, high value):**
- **Kill the No. 1 tail hook spoiler.** Either curl the cat's tail *around its body* in the mask (refit), or accept the hook but make sure it is **not** the first thing the camera sees: rotate the rest pose so the hook faces away or into the darker side. If coverage drops, prefer the honest number over the spoiler.
- **Wire shadow:** a 0.3 mm wire's shadow would be blurred to nothing by a real lamp's penumbra at ~1 m. Render the wire shadow at ≤ 15 % opacity, or give the wire's shadow a large-penumbra term. No more hanged cat.

**Pass 3 (polish) priorities, in order:**
1. Real-GPU or at least a real-time frame-time log and a governor (haze steps / reflection every other frame / DPR). Honest numbers.
2. Pools that differ:
   - slightly different diameters;
   - one with a harder focus, one softer;
   - the floor one elliptical with a faint barn-door edge;
   - break the Venn symmetry: shift one pool 5–8 % off the centroid.
3. Beam shafts: make the rod-blocked streaks actually visible. Even fake it with a projected-shadow texture in the haze march, at 2× the current gain inside the cone only.
4. Plaster to 0.015–0.025 (a fill bounce term) so the room reads as surface.
5. Brass:
   - a 10 % polished-rod highlight;
   - one rim/spec kicker from the brightest pool, so the object pops off the cream overlap;
   - some long rods if the forge allows.
6. Timing/audio pass:
   - storm hiss → implosion clatter → chord;
   - skip-intro;
   - idle re-forge every ~40 s.
7. Dead-end sweep: Esc/Back, resize, a hidden tab, double clicks during the implosion, a `#w=` with junk input.

**Proof required for Pass 2:**
- an implosion filmstrip (12 frames, 0–7 s);
- context-free crops at 1/2/3/4 s (nothing) and 5.5 s (all three);
- a shatter → re-forge strip;
- `#w=GEB` from a fresh headless session with fidelity printed;
- a lamp-drag before/after.

**Target ≥ 20/24 with 8, 9 and 10 at 2.**

---
## Anything that looks cheap (no mercy)
- Three identical discs = "stage spotlight" stock look.
- The crucifix scramble.
- The hanged-cat wire shadow.
- A brass heart casting a heart.
- "letterA" in the placard.
- Shredded-tobacco brass at 100 %.
- A lock that nobody can see happen.

**The good, which is not cheap:**
- the floor reflection;
- the coloured pools with plaster grain;
- the clean key/hand/butterfly;
- preset 2's scramble hatching (that's the look the whole opening should have).
