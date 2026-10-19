# RESEARCH — Phase A, Round 5 (2026-10-19, TPE)

Method: web search + fetched pages/case studies (09:35–10:05 TPE). I cannot watch video; motion analysis is from
published descriptions, papers and well-known stills. Rounds 3–4 already covered Igloo Inc, Lusion, Bruno Simon,
Tiny Glade, Townscaper, teamLab, IQ's lighting rig, Physarum, Cellular Forms, Noita, PGV, Anadol, erosion.
This round studies **explorable mechanisms, 2026 template saturation, and physical-process photography**.

Banned topics this round (prior works): orbital/stars, word toys, shadow/light casting, erosion/canyon.

---

## 1. Bartosz Ciechanowski — *Mechanical Watch* (2022, 4,298 HN points)
Source: ciechanow.ski/mechanical-watch; woah.dev write-up (2026); his Patreon making-of.
- **Why it stuns:** a real mechanism, every part live and correct (escape-wheel teeth rub the pallet jewels "without
  any gaps"); you *stop the escapement yourself*. Truth of mechanism = authority.
- **Composition:** one object per figure, neutral background, colour-coded parts; camera always frames the moving part.
- **Light/material:** deliberately clean, flat-ish shading — clarity over photoreal. Hand-written WebGL, 327 KB.
- **Most memorable interaction:** a slider that runs *time* forward/backward through a mechanism.
- **Beyond demo:** ~80 CAD parts, couplings verified; global pause toggle; zero dependencies.
- **Principle:** *correctness you can poke is a wow in itself; scrubbing time through a causal process is the best verb.*

## 2. Balian.dev — *A Mechanical Watch in 3D* (ETA 6497-1)
Source: balian.dev/work/how-a-watch-works.
- **Why:** a custom outline renderer (edges from depth + normal buffers) makes three.js read as a technical drawing.
- **Motion:** a rule-based mechanism solver drives everything — "nothing in it is a canned animation"; a headless test
  asserts the couplings before shipping.
- **Principle:** *own render style + solver-driven motion + headless assertions on the physics.*

## 3. Abeto — *Messenger* (Awwwards Developer Site of the Year 2025)
Source: awwwards.com/messenger.html case study; webgpu.com showcase.
- **Why:** tiny spherical planet, cel-shaded, "calm but a little weird"; 5.7 MB initial load; UI built inside WebGL.
- **Composition:** the world curves away from you — the horizon is always the composition; scale cues everywhere.
- **Beyond demo:** weeks of hand-modelling of 7 distinct spots, custom LOD that preserves silhouettes, WASM glyphs.
- **Principle:** *a coherent tiny world with one distinctive look beats realism; UI belongs inside the world.*

## 4. 2026 template saturation: Kintsugi, glass-blowing, marbling, dominoes
Sources: playkintsugi.app; emergentmind.com/visualizations/kintsugi; animatedwebs "Hairline Kintsugi Studio";
mysimulator.uk; aimade.games/g/parison; renkmobil Kiln Breath; craigfahner/marbling; Coding Train #183; Topple (itch);
r/threejs Rapier domino sim; "a million dominoes in a browser" Replit post.
- In 2026 every *named craft process* already has an AI-built interactive: Kintsugi has a full game + a prompt template
  ("Paste this into Claude Code…"); glassblowing has PARISON (viscoelastic contour sim, blackbody glow) and Kiln Breath;
  marbling has Jaffer-transform apps; dominoes have Rapier sandboxes with 100k bodies.
- **Principle 13 (new):** *the process alone is not original. Originality must come from (a) a hero result nobody has
  rendered, (b) a render style nobody uses for it, or (c) a physical truth the templates fake.* Check with search
  before committing (done for each Phase B concept, see PLAN/CONCEPTS).

## 5. PARISON (aimade.games) — glass on a pipe
- **Why notable:** the whole thing is one physical law (VFT viscosity creep) producing inflation, sag, tool marks and
  freezing; blackbody glow is the *only* thermometer (diegetic UI).
- **Principle:** *one law, many consequences; let the material's own appearance be the UI.*

## 6. Lu, Jaffer et al. — *Mathematical Marbling* (IEEE CG&A 2011); Blake Jones "Turing clouds"
- Closed-form, area-preserving, invertible tool transforms → razor-sharp, resolution-independent patterns.
- **Principle:** *closed-form/inverse mapping gives crispness that survives a 100 % crop (benchmark #7).*

## 7. Hevesh5 (Lily Hevesh) — domino "field flip"
Source: hevesh5.com tutorials; "The Art of Dominoes" talk.
- **Why it stuns:** a dense field shows image A; one push and a wave of toppling flips it into image B. The reveal is
  a *travelling front*, so the picture assembles in a sweep — anticipation + payoff.
- **Beyond demo:** safety gaps, direction changers, choreography of multiple fronts meeting.
- **Principle:** *a travelling front that converts state is a legible, rhythmic hero (the colour event moves).*

## 8. J. J. Thomson & Newall (1885) "On the formation of vortex rings by drops falling into liquids"; 
##    Phys. Fluids 2021 "heavy impacting droplet: via a vortex ring to a bifurcation flower"; Xi'an Jiaotong 2022
Source: doi 10.1098/rspl.1885.0034; doi 10.1063/5.0064072; zkxb.xjtu.edu.cn (multistage bifurcation).
- A heavy drop entering water rolls into a toroidal vortex ring; the ring grows, slows, its azimuthal (Widnall)
  instability makes it break into N lobes; each lobe sinks as a new smaller ring, repeating — a **cascade "flower"**,
  connected by ink threads. Real physics, slow and graceful, and almost never simulated interactively (web ink demos
  are 2D Navier–Stokes stir-toys, "glowing ink in black water").
- **Principle:** *a real, little-known physical cascade = surprise for experts and beauty for kids.*

## 9. Kim Keever / Alberto Seveso — ink & paint in water tanks (photography)
Source: kimkeever.com/the-process; DPReview "macro photos of paint and water that look like CGI".
- **Why:** pigment absorbing light in a backlit tank: soft, dense, sculptural clouds with crisp edges; Keever adds
  miniature landscapes so ink becomes weather. Colour from **absorption**, not emission — the opposite of glow.
- **Composition:** single plume, huge negative space, gradient backdrop, slight lens fall-off.
- **Principle:** *subtractive colour (Beer–Lambert) on a bright field reads as "real photograph", not "WebGL".*

## 10. Jaquet-Droz automata (The Writer, The Draughtsman, 1768–74); CamFollowerJS; Lanky Doodler
Source: Wikipedia; fhs.swiss "The Art of Automata"; github jumpjack/CamFollowerJS.
- The Draughtsman stores drawings as **stacks of brass cams** (x, y, pen-lift); a child-sized figure draws them.
- Web landscape: cam-follower calculators and a product sketch-to-cam workflow; no art-directed "machine that learns
  your drawing".
- **Principle:** *a mechanism that visibly encodes the user's own input (your drawing becomes metal) is both legible
  and magical; the honest mechanism is the special effect.*

---

## Cross-cutting principles for Round 5 (carry 1–12 from Round 4, add):
13. **Process ≠ originality** (see §4). Hero must be a result/look no template renders.
14. **Subtractive light on a bright field** (§9) to escape "particles + glow on black".
15. **Travelling fronts** (§7, §8): the transformation should sweep through the frame with rhythm, not pop.
16. **Mechanism truth you can poke** (§1, §2): solver-driven, scrubbable, headless-asserted.
17. **Final frame first** (Round 4 lesson): design and frame the *finished* hero result; the last frame must read as
    a thumbnail; framing fit to the actual rendered bounds; no black shadows, no noise, no crop.
18. **Budget SwiftShader**: every test frame is costly; deterministic `?shot=` states with `window.__ready`.

---

## VISUAL QUALITY BENCHMARK v5 (grade rendered frames 0–2 each; 24 max; final target ≥ 20)
Same 12 criteria as v4 (kept for comparability with Rounds 3–4), with sharpened 2-anchors:

| # | Criterion | 0 = fail | 1 = ok | 2 = pass |
|---|---|---|---|---|
| 1 | **Focal point & composition** | eye wanders / centred blob / crop | subject clear, static framing | one unmistakable subject, framing fit to actual rendered bounds, intentional negative space |
| 2 | **Value structure** | flat / all dark / crushed blacks | some contrast | clear darks/mids/lights; reads as 200 px thumbnail; no pure-black shadow areas |
| 3 | **Palette & colour script** | rainbow / defaults | coherent but generic | 2–3 hue families + one accent; colour *changes* with the story |
| 4 | **Light behaviour** | unlit | key only | key + fill + bounce or physically-based transport (absorption/scatter) that reacts to the sim |
| 5 | **Depth** | flat | some parallax | fg/mid/bg separation (DoF, aerial perspective, occlusion, scale cues) |
| 6 | **Material identity** | CG plastic | recognisable | unmistakable material at a glance |
| 7 | **Detail at 100 % crop** | aliasing, banding, noise blots | minor artefacts | crisp, intentional grain; sim detail survives crop |
| 8 | **Originality** | nameable template/demo (incl. 2026 AI-built templates) | familiar technique, fresh dressing | can't name the template; new phenomenon + look |
| 9 | **Hero legibility (kids test)** | needs words | adult gets it | child describes the transformation from an unlabelled before/after pair |
| 10 | **Emergent response** | canned | reacts, predictable | one gesture → rich, physically motivated, unscripted consequence within ~1 s |
| 11 | **Motion quality** | linear/jitter | smooth | weighted, eased, secondary motion, travelling fronts, time visibly accumulates |
| 12 | **Polish / UI in world** | debug UI | clean minimal UI | UI part of the world; intro; sound; no scaffolding |

Gate rules: no particles-in-space + bloom; no black-canvas demo look; #8 and #9 must be 2 for final; best interaction
discoverable without text from second one; 0 console errors on the live URL; V1 gate ≥ 12/24.
