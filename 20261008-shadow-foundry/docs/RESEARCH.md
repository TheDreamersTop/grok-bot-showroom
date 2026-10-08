# RESEARCH — Phase A (2026-10-08, TPE)

Method: web research (Awwwards case studies, studio write-ups, conference talks, technique posts). I cannot watch video, so analysis is based on case-study text, published technique breakdowns, and my knowledge of these works' still frames/interaction models. Sources listed per entry.

---

## 1. Igloo Inc (Abeto × Bureaux, 2024; Awwwards SOTD, Webby 2026 Best Visual Design)
Source: awwwards.com/igloo-inc-case-study.html; discourse.threejs.org/t/67249
- **Why it wows:** an icy, crystalline world that feels *made of a material* (ice, frosted glass, volumetric fog), not of "3D objects". Every section is one sculpted object in a void with exact lighting.
- **Composition:** one hero object centered, enormous negative space, tiny UI typography at the edges; scroll = camera travel through a continuous world, never a page cut.
- **Lighting/depth/motion:** baked-in Houdini volume data + realtime fluid simulation; cold palette (#b6bac5 / #383e4e) with only value contrast, no saturated colour. Motion is slow, heavy, inertial.
- **Most memorable interaction:** the transition—objects shatter / reassemble into particles of ice between sections; UI text scrambles via SDF glyph offsets (UI rendered in WebGL so it can glitch with the scene).
- **Beyond demo:** UI is part of the render (same post-processing as the world); custom volume exporter; sound design; restraint in palette.
- **Principle:** *material identity + monochrome restraint + UI living inside the render.*

## 2. Lusion v3 (Lusion, 2023 Awwwards Site of the Year)
Source: awwwards case study (SOTM May), commarts.com/project/36283, mark-n.co reverse-engineering
- **Why it wows:** it starts like a normal web page then reveals that everything is 3D: objects jump between HTML boxes, physics bodies follow the cursor.
- **Techniques:** FLIP fluid, ray marching, ray tracing; pre-baked Houdini cloth sim blended by cursor direction (220 KB arraybuffer); vertex-animation textures; Rapier physics; single 0→1 progress uniform driving complex vertex-shader choreography.
- **Most memorable interaction:** cursor-reactive physics/cloth that *feels* simulated (fake but convincing).
- **Beyond demo:** "cheat where the eye can't tell" — precompute expensive physics, spend realtime budget on response to input.
- **Principle:** *the cursor should physically disturb the world; expensive-looking ≠ expensive to run.*

## 3. Bruno Simon folio (2019 → 2025 WebGPU rebuild)
Source: awwwards.com/brunos-portfolio-case-study.html, github.com/brunosimon/folio-2025
- **Why it wows:** you *drive* the portfolio. A toy world with physics where everything can be knocked over; a kid understands it in 1 second.
- **Composition:** fixed 3/4 isometric camera, toy-like miniature scale, saturated matte palette, baked lighting (matcaps/palette textures) → looks hand-crafted.
- **Most memorable interaction:** crashing into things; hidden secrets rewarding exploration.
- **Beyond demo:** spatial audio, secrets, multiplayer ghosts, careful game-loop architecture, ordered systems.
- **Principle:** *instant agency (no instructions) + toy scale + secrets that reward the 2nd and 3rd minute.*

## 4. Tiny Glade (Pounce Light, 2024) — diorama builder
Source: digitalfoundry.net Tiny Glade article; 80.lv interview; GPC 2024 talk "Rendering Tiny Glades with entirely too much ray marching"
- **Why it wows:** you drag a line and a *castle wall grows*, with procedural bricks, ivy, windows, doors that adapt to context. Input is crude, output is lovingly detailed.
- **Lighting:** software ray-traced GI at 1 ray / 4×4 px against proxy geometry, SH-encoded and denoised; warm pastel sun; ray-marched shadows and DoF give the miniature/tilt-shift look.
- **Most memorable interaction:** the gap between your gesture and the richness of the result ("I did that?").
- **Principle:** *amplify a simple gesture into a rich, physically-lit result; GI is what makes stylized scenes feel real.*

## 5. Townscaper / Bad North (Oskar Stålberg)
Source: gamedeveloper.com "How Townscaper Works"; IndieCade Europe 2019 talk
- **Why it wows:** click anywhere on the water → a house appears, and neighbours *re-solve* (WFC on an irregular quad grid) into arches, stairs, roofs, gardens. No goal, pure toy.
- **Composition:** soft pastel palette, ocean void, orthographic-ish camera, everything is one cohesive diorama.
- **Principle:** *constraint solving that produces "intentional-looking" architecture from random input; every click causes a satisfying local cascade.*

## 6. Evan Wallace — WebGL Water (2011, still the reference caustics demo)
Source: madebyevan.com/webgl-water; medium "Rendering realtime caustics in WebGL"
- **Why it wows:** a 2011 browser demo with physically plausible caustics, refraction, ambient occlusion; you drag a ball through water and light patterns dance on the pool floor.
- **Technique:** project a dense light mesh through the water surface; brightness = oldArea/newArea via dFdx/dFdy. Cheap, physically motivated.
- **Principle:** *one physically correct light phenomenon (caustics) beats ten generic effects; "light behaving correctly" reads as magic to everyone.*

## 7. Radiance Cascades (Alexander Sannikov, PoE2; web demos by Jason McGhee, tmpvar, GM Shaders)
Source: jason.today/gi, jason.today/rc, tmpvar.com/poc/radiance-cascades
- **Why it wows:** noiseless realtime 2D global illumination in a browser: draw a line of light, every wall casts soft penumbrae, colours bleed. Experts know realtime GI is hard; kids just see "my drawing glows and casts shadows".
- **Technique:** scene → jump-flood distance field → N cascades (each level: 4× rays, 2× probe spacing, doubled interval) → merge top-down; linear colour space.
- **Weakness of existing demos:** they are *technical* demos: black canvas, MS-Paint brush, no art direction, no world. Opportunity: wrap a frontier technique in a real art-directed experience.

## 8. Shadow Art (Mitra & Pauly, SIGGRAPH Asia 2009) and shadow sculptors (Tim Noble & Sue Webster; Kumi Yamashita; Fred Eerdekens)
Source: knowledge of the paper "Shadow Art" (ETH) and the artists' works; GEB cover (Hofstadter's carved block casting G, E, B)
- **Why it wows:** a meaningless pile of junk under a single lamp casts a perfect portrait on the wall. The reveal is binary and instantaneous — a classic "stop and stare" moment in galleries.
- **Principle:** *a hidden order that appears only from one exact viewpoint/light position; the audience performs the reveal.*
- **Web gap:** I'm not aware of any polished interactive web piece that lets you *author* multi-view shadow sculptures in real time.

## 9. Inigo Quilez / Shadertoy masterpieces ("Selfie Girl", "Rainforest", "Snail") & Patricio Gonzalez Vivo
Source: iquilezles.org articles (SDF, soft shadows, fog, colour), Book of Shaders
- **Why they wow:** entire worlds in one fragment shader; the lighting is *painterly*: key light + sky fill + bounce + fog, artist-tuned palettes, soft shadows (k-factor penumbra), AO, careful tonemapping.
- **Principle:** *light composition rules (key/fill/rim, warm/cool split, aerial perspective) matter more than geometry count.*

## 10. Cymatics / Chladni plates (Ernst Chladni 1787; physics demos, Nigel Stanford "Cymatics" music video)
- **Why it wows:** sand on a metal plate leaps into precise geometry when a bow sings a note. Sound made visible; adults remember it from science class, kids gasp.
- **Principle:** *a physical transformation you can hear and see at once; order emerging from chaos in ~1 second.*

---

## Addendum (15:45 TPE): deeper notes

### Shadow Art method (Mitra & Pauly 2009), relevant to concept C1
Source: graphics.stanford.edu/~niloy/research/shadowArt (paper PDF)
- Build the **shadow hull** = intersection of the silhouette extrusions (voxels).
- Arbitrary target images are usually **inconsistent** (the hull's shadows lose pixels). They fix this by *deforming the 2D input images*, not the sculpture: find missing shadow pixels, pick the least-cost voxel line that would cover them, derive positional constraints in the other images, and apply as-rigid-as-possible 2D warps (25 % of displacement per iteration, stiffness relaxed over time) until consistent within tolerance.
- Practical takeaways for a realtime web version: (1) design preset silhouettes with *row/column coverage rules* (every row of the back-wall image must be non-empty in the side image, etc.); (2) for user drawings, a cheap consistency pass: **per-row/column scaling and translation** of each silhouette so their extents match (a 1-D version of their warp) + show the user a "lost pixels" heat-map; (3) render the result as an SDF/marching-cubes sculpture with smoothing.

### The template landscape to avoid (what's common in 2025–26)
Source: Codrops 2025–26 tutorials (mouse-following lens, scroll-driven image tubes, scroll-revealed WebGL galleries, GSAP shader ripples); Awwwards SOTY 2025 (Lando Norris, OFF+BRAND) is a branding/scroll site.
- Common: scroll-driven galleries, distortion/RGB-shift lenses, image ripples, particle morphs of logos, black-hole/space scenes, fluid cursor trails (Dobryakov fluid), bloom-heavy neon.
- Rare: *authoring tools that compute something physically/geometrically non-trivial and show it as a crafted object* (Tiny Glade, Townscaper on desktop; almost nothing in this class on the web).
- => The strongest differentiation is a **toy-like authoring loop whose output is a beautifully lit physical artifact**, not another camera-on-rails scroll piece.

---

## Cross-cutting principles to apply
1. **One material, one phenomenon, done correctly** (ice, paper, brass, shadow, caustic) > a pile of effects.
2. **Restrained palette + value contrast;** colour only where it means something.
3. **Single focal point, big negative space;** camera composition decided like a photograph (rule of thirds, foreground occluder, horizon).
4. **Instant agency:** the first mouse movement must visibly change the world within 100 ms.
5. **Gesture amplification:** small, crude input → rich, crafted output (Tiny Glade, Townscaper).
6. **A binary reveal** (shadow snaps into a figure, sand snaps into a pattern) gives a verifiable hero moment.
7. **Secrets / second-minute depth:** variations that reward exploration.
8. **UI belongs to the world** (typography sparse, rendered in the same style).
9. **Cheat smart:** precompute or approximate where the eye can't tell; spend budget on reactivity.
10. **Sound** greatly multiplies perceived quality (WebAudio, procedurally synthesized, no assets needed).

---

## VISUAL QUALITY BENCHMARK (grade every screenshot 0–2 per line; target ≥ 20/24 for "final")
| # | Criterion | 0 = fail | 2 = pass |
|---|---|---|---|
| 1 | **Focal point** | eye wanders / centered blob | one unmistakable subject, composed (thirds / leading lines) |
| 2 | **Value structure** | flat mid-grey or all-dark | clear darks, mids, lights; reads as a thumbnail at 200 px |
| 3 | **Palette** | rainbow / default colours | 2–3 hue families, intentional accent, consistent with concept |
| 4 | **Lighting realism or stylization** | unlit/ambient only | key light + shadows + bounce/fill; light *behaves* (penumbra, falloff) |
| 5 | **Depth** | flat | foreground/mid/background separation (DoF, fog, occlusion, scale cues) |
| 6 | **Material identity** | "CG plastic" | surface clearly reads as a material (paper, brass, sand, plaster, glass) |
| 7 | **Detail at 100 % crop** | aliasing, banding, noise, stretched textures | crisp, grain/dither intentional, no artifacts |
| 8 | **Originality** | looks like a known demo/template | I can't name the template it came from |
| 9 | **Hero moment legibility** | needs explanation | a stranger sees the transformation in a 2-frame before/after |
| 10 | **Motion quality** (judged by frame sequences) | linear / jittery | eased, weighted, physically motivated, secondary motion |
| 11 | **UI/typography** | debug-looking, default fonts, clutter | minimal, art-directed, part of the world |
| 12 | **Polish/no-demo smell** | dat.GUI, console text, placeholder | intro, transitions, sound, no visible scaffolding |

Gate rules: no "pretty space + particles + bloom"; no black-canvas tech demo look; criterion 8 and 9 must be 2 for the final.
