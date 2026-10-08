# REVIEW-02: Independent adversarial review of V1 (2026-10-08 ~16:55 TPE)
Roles: Hostile Creative Director + Principal Engineer. I judged pixels:
- the builder's `shots/v1-*.png` frames;
- 100 % crops;
- linear-luminance measurements I ran with my own script;
- three extra renders from the **live URL**, saved in `reviews/review02-assets/`:
  - `live-preset2-solved.png` = `?shot=1&t=6&preset=1`
  - `live-t2.png` = `?shot=1&t=2.0`
  - `live-wide.png` = `?shot=1&t=6&cd=26`

I did not modify any builder files.
**Limitation:** I already know the targets (cat / tree / swallow), so my T1/T2 judgments are *not* truly context-free. I tried to read each crop as a stranger would, but the builder must still run real context-free viewers. I can't hear audio or see motion, so I judged sound and motion only through frame sequences.

---
## Verdict in one paragraph
V1 is a **real leap**: **10 → 15/24**. The solved frame is the first image in this project that looks like a gallery piece and not a demo:
- black room;
- three converging pools;
- a brass object on a pin;
- tasteful labels.

It only *just* meets the V1 gate (≥ 15). It does **not** yet produce a WOW, for three structural reasons:
1. **The object is visibly the cat** (and in preset 2, visibly a hand). Seen from the camera, the brass nest *is* a straw cat with a curled tail (`crop-solved-obj.png`). The "one meaningless object" premise is gone, and the viewer reads "a cat statue casts a cat shadow".
2. **The lock is a contrast fade, not a transformation.** In the filmstrip all three figures are fully legible at −400 ms. At t = 2–3 s a pale cat is already on the back wall, and a **cat appears on the tree wall** (`live-t2.png`, `crops-opening-3s-shadows.png`). The reveal is spoiled before it happens.
3. **The "before" state is empty.** Misaligned shadows are artificially lightened to about **1.15 : 1** (scrambled frame: pool 0.889 vs. shadow 0.775 linear). Strangers see three blank white ellipses. This also breaks optical truth: real shadows don't get darker when you rotate the object.

   I own this one. REVIEW-01 item 6 asked for "darker as you approach". At the strength it was implemented, it makes things worse. **Retract it:** shadows must always be physically dark. Signal proximity only with penumbra/iris and sound.

The single most impressive frame in the whole set is **`v1-drawing-flyin.png`**: a storm of rods with hatched light/shadow lacework in every pool. That frame, not the fade, is where the hero moment should live.

---
## T1–T12: builder's self-assessment vs. my verification
| Test | Builder | Verified | Evidence / reason |
|---|---|---|---|
| **T1** naming | PASS (self) | **PARTIAL** | Crops, text hidden:<br>- **Tree**: reads as tree (forked trunk sells it), slightly broccoli.<br>- **Cat**: reads as cat; risk of *fox/dog*. Only one ear survives, there's a snout bump, and the body tapers to a point with no paws. Internal speckle holes.<br>- **Swallow**: reads as "a bird in flight", but the **plinth disc and pin shadow sit on its body**.<br>- **Preset 2 fish fails** completely: 67 % rod coverage, reads as broken junk (`live-preset2-solved.png`). |
| **T2** before/after | PASS (self) | **FAIL (in spirit)** | The scrambled frame names nothing only because the shadows are nearly invisible (1.15 : 1). At t = 2–3 s the cat is legible on the back wall *and* a cat-like figure is on the tree wall. The object is cat-shaped. The pair reads as "pale → dark", not "chaos → picture". |
| **T3** contrast ≥ 4 : 1 | PASS 8.3 / 8.0 / 19.4 | **PASS (solved)** | My numbers: cat ≈ 11 : 1, tree ≈ 9 : 1. Side effect: the pools sit at 0.89 linear (≈ sRGB 243). They're **blown out**: no plaster, no lamp colour. |
| **T4** fidelity ≥ 97 % | FAIL | **FAIL** | Rods 96.6 / 93.6 / 93.9 %. Ragged, speckled edges with pinholes inside the cat (`crop-solved-cat.png`). Preset 2 fish 67.1 % (live log). |
| **T5** thumbnail | PASS | **PASS** | At 320 px all three read; the object is the focal point. |
| **T6** scramble IoU ≤ 0.35 | FAIL | **FAIL** | `v1-metrics.json` says 0.58 / 0.52 / 0.47, but PROGRESS quotes 0.53 / 0.55 / 0.37. **The numbers don't match.** Pick one source of truth. |
| **T7** solvable | PASS 2.25 s | **PASS, but a warning** | The metrics say the naive solver needs 1.75 s and 3 drags. That isn't a puzzle; it's a toggle. Solving gives no sense of "I did it". |
| **T8** filmstrip | PASS | **WEAK PASS** | Stagger and darkening are visible, but the figures are already readable at −400 ms. The lock adds contrast, not meaning. |
| **T9** authoring | PARTIAL | **FAIL** | `v1-drawing-rebuild.json`: 2.35 s, rod fidelity 94.1 / 93.7 / 93.4 %, all below 95 % (PROGRESS says "93.3–95.1"). The heart shadow has a hole and ragged edges. |
| **T10** first 3 s | PASS | **PASS (letter) / FAIL (spirit)** | Lamps are on and the object is moving. But the frame shows a brass cat casting pale cats, which spoils the reveal. The beams are a faint grey wedge (`crop-solved-beam.png`). |
| **T11** tech | 0 errors; fps unknown | **PARTIAL** | My 3 live renders had no console or page errors. But the **forge runs on the main thread at boot: 2.2–2.6 s** (live log), and again on every "Next sculpture" and every drawing. fps on a real GPU is still unmeasured. |
| **T12** score ≥ 15 | pending | **15/24: PASS (barely)** | See below. |

---
## Benchmark score: V1 = 15/24 (prototype was 10)
| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Focal point | **2** | Triad of pools converging on the object, beams lead the eye in. A strong icon composition. |
| 2 | Value | **2** | Rich blacks, bright pools, reads at thumbnail. (Pools clip, see 3 and 4.) |
| 3 | Palette | 1 | The warm/cool/neutral split is lost to overexposure: all three pools read white-cream. Brass is the only colour. Restrained but bland. |
| 4 | Lighting | 1 | Shadows are correct. But the pools are identical cookie discs with no bounce onto adjacent planes, no fill on the brass from the bright walls, and beams too faint to read as light shafts. |
| 5 | Depth | 1 | The room dissolves into black void. No architecture reads outside the pools, and the wide render shows the wall planes *ending* in the void. Lamps give some foreground. |
| 6 | Material | 1 | Brass reads as metal at mid distance, but up close as "shredded wheat / straw doll". Plaster is invisible inside the blown pools. |
| 7 | Detail at 100 % | 1 | The grain mosaic is fixed and AA is clean, but shadow edges are ragged and speckled with pinholes (looks like a bug). |
| 8 | Originality | 1 | Three-lamp shadow art is rare on the web, but a cat-shaped object casting a cat collapses it to "sculpture + shadow". |
| 9 | Hero legibility | 1 | The after frame is a clear 2. The before → after pair is not: the before is empty and the object gives it away. |
| 10 | Motion (from strips) | 1 | Eased geodesic and staggered lock look fine. The tumble passes through figure-revealing poses. |
| 11 | UI / typography | **2** | Placard, perspective wall labels and serif text buttons sit in the world. No debug text. |
| 12 | Polish | 1 | Intro, sound and transitions exist. But "Next sculpture" leads to a broken fish, edges are ragged, and boot blocks for ~2 s. |

---
## Does V1 impress a stranger?
- **The still solved frame:** yes, mildly. "Oh, that's beautiful… one thing makes a tree, a cat and a bird."
- **The live sequence:** the stranger sees a straw cat on a pin casting a pale cat, and then the shadows darken. The tree and bird are the only surprise, and they've been half-visible since second 2. Kids say "cool". AI experts say "visual hull, nice", and that's the end of the visit unless they find drawing, which takes 2.4 s and returns ragged shapes.
- **Not WOW yet.**

## Does it still look like an AI demo?
Less, but these cues remain:
1. **Three identical perfect ellipses** with the same cookie falloff and clipped centers. It's the "stage spotlight" template, and the plaster you built is invisible.
2. **Black void instead of a room.** No floor material, ceiling or corner architecture. Wall planes visibly end in the wide view.
3. **Generic lamp primitives** (cylinder + torus fins), cut off by the frame corners. The third (overhead) lamp is out of frame, so one shadow has no visible cause.
4. **Beams are a grey smudge.** No rod-sliced shafts, no motes.
5. **Ragged and pinholed shadow edges.** They read as a rendering bug, not as craft.
6. **Straw-doll object:** short rods, uniform gauge, silhouette = figure.
7. **The plinth shadow lands on the swallow.** That's a composition mistake a human art director would never ship.
8. Elegant Cormorant italics plus CJK. Tasteful, but it is now the house "AI gallery" look. It's acceptable; just don't add more of it.

## Is the auto-lock at ~4 s strong enough?
**No.** It's a 350 ms contrast change applied to images the viewer can already read. A hero needs a **state change in kind**: chaos → order, nothing → something, or meaningless → meaningful. You already built the right asset: the **rod fly-in**. Make the forge itself the hero (Pass 2).

## Is the interaction depth enough?
No. Each of the three verbs is shallow:
- **The rotate puzzle** is trivial: 3 drags, 1.75 s. And after the intro has shown the answer, there's no mystery left.
- **Drawing your own** is the strongest idea, but:
  - it needs three drawings, which is a high-effort ask;
  - the result takes 2.4 s and comes back ragged;
  - there's no way to keep or share it.
- **Next sculpture** goes to a broken preset.

What's missing for "discover unexpected changes" and shareability:
1. A **low-effort authoring path**: type 3 letters or characters, GEB-style.
2. A **share URL** that re-forges the sculpture for a friend.
3. A **physical toy** you can poke and see respond: drag a lamp and watch its shadow skew and slide.
4. A **repeatable spectacle verb**: shatter and re-forge.

## Architectural limits
1. **The main-thread forge, 2.2–2.6 s, blocks boot and every transition.** Bake the presets offline to JSON (rods + metrics) so they load instantly. Run user forges in a Web Worker and animate while you wait (rods already lifting off).
2. **Coverage plateau at ~94 %:** volume-filling fixed-gauge rods can't hug a silhouette boundary.
   - Add a **skin pass**: thin rods laid tangent to each mask's boundary inside the hull.
   - Then a **greedy hole-fill**: render the projected coverage, find missed pixels, and add the shortest in-hull rod covering each cluster. Iterate until coverage ≥ 98 %.
   - Validate every preset at load in dev. Reject any preset below 97 %; the fish at 67 % must never ship.
   - **Do not** fake the shadows with an invisible hull caster. The placard prints a fidelity number, and it must stay true.
3. **Object silhouette = figure.** This is inherent to a visual hull seen from between the lamps. Mitigate:
   - Pick figures whose hull intersection reads as abstract from the camera (test it).
   - Use darker, low-contrast patina so the object's *outline* doesn't pop against the void.
   - Use longer rods that cross the hull, so the eye reads the line texture rather than the outline.
   - **Stage it** so the object is chaos while the reveal happens (the fly-in).
4. **Exposure / tonemapping:** pools at 0.89 linear clip after ACES. Drop exposure so pool centers sit at about 0.5–0.65 linear. Then the plaster relief, the lamp colours and the lens rings appear.
5. **No light transport between planes.** Add a cheap one-bounce fake: each lit pool adds its colour × pool brightness × ~0.03 as fill to the adjacent planes and as a broad reflection on the brass. That turns "three spots in a void" into "a room".

---
## The three mandatory escalation passes (≈ 6.5 h left: 16:55 → 23:24)
Suggested schedule:
- Pass 1: 17:00–18:45
- Pass 2: 18:45–20:45
- Pass 3: 20:45–22:15
- QA + deploy + report: 22:15–23:24

### PASS 1: Visual Escalation (17:00–18:45)
**Bottleneck:** shadow *finish* and *light realism*. Ragged, pinholed edges plus blown pools in a black void read as "a CG spotlight demo with a bug", not "a crafted object in a real room".
**Why it limits:** shadow edges are the hero pixels. Every reveal, label and share screenshot is a picture of a shadow, so 94 % coverage puts a ceiling on everything else.
**Changes, in order:**
1. **Shadow fidelity ≥ 98 %, no pinholes:**
   - Skin rods plus greedy hole-fill, as described under "Architectural limits".
   - Bake the presets.
   - Fix the fish or replace it. Use figures that are hull-consistent *by design*: the hand and key are great; the floor needs a wide, symmetric shape like a fish seen from above, a leaf or a butterfly.
2. **Exposure and pools:**
   - Pool center 0.55–0.65 linear.
   - Visible lamp colours: 2700 K warm on the cat, 5600 K cool on the tree, 4000 K neutral on the floor.
   - Plaster relief visible under the lamp.
   - A faint lens ring and slight chromatic fringe at the pool edge.
   - Pools should differ slightly in shape, focus and falloff (they're three physical lamps).
3. **Room, not void:**
   - Wall plaster faintly visible in the dark (0.015–0.03 linear) with a fake bounce gradient from each pool.
   - A floor of dark polished concrete or oiled wood that **reflects the pools and the brass** (a screen-space or planar reflection with roughness blur). This is the single biggest "expensive" cue available.
   - A ceiling track holding all three lamps, so every shadow has a visible cause.
4. **Beams:**
   - 2–3× density in the haze only.
   - Clearly visible **dark streaks where rods block the beam**.
   - Sparse, slow dust motes lit only inside the cones.
5. **Object:**
   - Longer rods (min 50 % of hull diameter).
   - 3 gauges; darker patina (#6e5530 base) with 10 % polished rods.
   - A brass rim lit by the bright walls (fake bounce).
   - **Suspend it from the ceiling on a fine wire** instead of the pin and plinth, so nothing lands on the floor figure. The wire is nearly collinear with the overhead lamp, so its floor shadow is a dot.

**Proof (before/after, same t and camera):**
- `v1-solved-hero` vs. `p1-solved-hero`;
- 100 % edge crops of the cat ear and tail and the swallow tail;
- coverage table for every preset (≥ 98 %);
- pool-center luminance;
- context-free naming of each shadow crop;
- a 320 px thumbnail;
- **independent target ≥ 18/24.**

### PASS 2: Experience Escalation (18:45–20:45)
**Bottleneck:** the hero is a fade over images that are already readable, and the verbs are shallow (a 3-drag toggle, a high-effort drawing, a broken "next").
**Why it limits:** memorability and shareability depend on a transformation in kind and a reason to come back or send the link. Right now there's neither.
**Changes, ranked by WOW per hour:**
1. **New hero, "The Forge" (opening, ≤ 7 s, skippable):**

   | Time | What happens |
   |---|---|
   | 0–1.2 s | Darkness. Three lamps clunk on one by one onto *empty* walls. The camera starts **wider** (all three lamps and the ceiling track visible) and drifts in. |
   | 1.5–4.5 s | ~1,000 rods **fly in out of the darkness** in waves, like the fly-in shot. Their shadows are a storm of moving hatching across all three pools. Metallic ticks, density-limited. |
   | ~5.0 s | The last rods land. All three hatch-storms **resolve at once** into cat / tree / swallow: 60 ms staggered iris snap, chord, 3 % push-in, labels. |

   - Shadows are **always physically dark**; delete the darkness ramp.
   - The object is chaos *during* the reveal, so its figure-shaped silhouette at rest no longer spoils anything.
2. **Shatter → re-forge as the core repeatable verb.**
   - Click the sculpture (or press "Next work"): rods burst outward with gravity and clatter, the pools fill with falling hatch shadows, and the next work forges in.
   - Every transition becomes a hero moment, using one animation system you already have.
3. **Type-to-forge plus share URL** (the memorability engine).
   - "Three letters → one object": GEB, ABC, or your initials; also 影 光 形.
   - Rasterize the glyphs → masks → bake in the Worker → forge.
   - `#w=GEB` (or `#d=<compressed drawings>`) opens straight into the forge of *that* sculpture, with the label "No. 7 · G, E, B · forged for you".
   - Kids type their initials, experts recognize Hofstadter, everyone shares the link.
4. **Draggable lamps** (discovery, optical truth).
   - Drag a lamp along its track: its shadow skews, stretches and slides in real perspective, and the illusion visibly breaks.
   - Release and it springs home, re-locking with the chord.
   - Cheap (it's just the light position), and proof that this is real projection, not a texture.
5. **Secret: "be the lamp."** Double-click a pool and the camera flies to that lamp's position and looks through it: the brass occludes exactly as the figure, framed by its own shadow behind. Expert delight, and nothing more than a camera path.
6. **Puzzle only for later works:** a farther scramble and a small basin. Don't make it the main verb.

**Judgement on bolder ideas:**
- **Gallery of multiple rooms: NO.** It's feature count that splits the polish budget. Do **4 curated works in one room**, cycled through shatter/re-forge:
  1. cat / tree / swallow;
  2. hand / key / fish (fixed);
  3. G / E / B homage;
  4. 影 / 光 / 形.
- **Camera orbit to show the "meaningless" object: NO** in its literal form. The object isn't meaningless from most angles; it's figure-shaped. Use "be the lamp" plus the wide establishing shot instead.
- **Lamp dragging: YES.**
- **URL share: YES** (with type-to-forge).
- **Finale:** small. After the 4th work, all lamps dim except one and a single beam lights a blank wall with the line "your turn". That links into type or draw. No big finale scene.

**Proof:**
- A 12-frame filmstrip of the new opening (0–7 s), showing hatch chaos → three figures at about 5 s.
- Context-free naming on frames at 3 s (must name **nothing**) and at 6 s (must name **all three**).
- Shatter/re-forge strip.
- `#w=GEB` opened in a fresh headless session, with a screenshot.
- Lamp-drag before/after.
- **Independent target ≥ 20/24, with 8 and 9 = 2.**

### PASS 3: Exceptional Polish (20:45–22:15), then QA (22:15–23:24)
**Bottleneck:** feel and robustness. Unknown real-GPU performance, the 2 s boot stall, timing, and dead ends.
**Why it limits:** a stall or a broken preset in the first minute erases the hero for a real visitor, and the brief requires "acceptable performance, no dead ends".
**Changes:**
- **Boot:** first lit frame < 1.5 s. Load baked presets, no main-thread forge, and a lamp clunk that starts immediately.
- **Perf governor:** measure frame time and scale the haze steps, DPR (1.5 → 1.0) and shadow-map size. Target 60 fps at 1080p on an integrated GPU. Log real numbers if any GPU browser is available; otherwise state honestly that fps is unmeasured.
- **Timing pass:**
  - lamp flicker;
  - wave cadence of the fly-in;
  - lock stagger;
  - label fade;
  - skip-intro on the first click;
  - idle behaviour after 30 s: a slow breathing tumble and re-lock, so a left-open tab still performs.
- **Audio mix:** levels, a limiter, tick density cap, and a stereo pan per wall. Mute persists.
- **Dead ends:**
  - Esc and Back everywhere.
  - An empty or contradictory drawing gives a heat-map and an auto-warp message, not silence.
  - Forging is cancellable.
  - Resize, 1440×900, a hidden tab and double-clicks during animation all behave.
- **Micro-detail:**
  - lamp cables on the floor;
  - a lens glint when a lamp faces the camera;
  - pool lens rings;
  - floor reflection roughness;
  - label kerning;
  - placard numbers that update after each forge and stay true.

**Proof:**
- before/after contact sheet V1 → P1 → P2 → P3;
- a perf log;
- 1440×900 and 1920×1080 shots;
- a console-clean fresh-session live run;
- a real visitor flow recorded as frames (load → intro → shatter → type GEB → share URL → open fresh).

---
## Top 5 criticisms (blunt)
1. The object **is** the cat (and the hand). The core magic, "one meaningless thing", is not on screen.
2. The hero is a **contrast fade over already-legible images**, spoiled from about 2 s (including a cat on the tree wall).
3. **Shadow finish:** 93–94 % coverage, ragged and pinholed edges, a **broken preset 2 (fish 67 %)**, and the plinth shadow sitting on the swallow.
4. **Spotlights in a void:** blown pools, invisible plaster and colour, no room, faint beams, one lamp out of frame.
5. **Shallow verbs:** a 3-drag puzzle, high-effort drawing with slow ragged output, nothing to keep or share. Also: inconsistent self-reported metrics (T6, T9). Report from one source.
