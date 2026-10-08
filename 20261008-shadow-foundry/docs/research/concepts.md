# Candidate concepts (Phase B) — 2026-10-08

Each judged against: kid-surprise, expert-surprise, originality vs. previous work (no space/particles/glow), feasibility in ~6h, verifiable hero moment.

## C1. 影雕 SHADOW FOUNDRY — multi-view shadow sculpture
- **Concept:** A dark gallery. On a plinth floats a chaotic, abstract sculpture. Three lamps project its shadows onto three plaster walls (left, back, floor/right). Rotate it, and when it aligns, the three shadows *simultaneously* snap into three crisp, unrelated images (e.g. a cat, a bird, a hand; or 影 / 光 / 形). Then you can draw your own three silhouettes and the machine carves a brand-new sculpture whose shadows are your drawings.
- **Hero moment:** You drag to spin a meaningless lump; as you near the right angle, the shadows sharpen and lock — three different perfect pictures from one object. Kids: "how?!". Experts: realtime visual-hull carving (Shadow Art, SIGGRAPH Asia '09) authored live.
- **Visual identity:** Museum chiaroscuro: warm tungsten lamps, cool plaster walls, bronze/obsidian sculpture, long soft penumbrae, dust in lamp cones (volumetric), film grain. No glow-space.
- **Core interaction:** drag to rotate (with inertia + magnetic snap near solution), drag lamps, draw-your-own silhouettes → carve animation (material eroding away).
- **Technical challenge:** voxel/SDF carving from 3 orthographic silhouettes at interactive rates (GPU 3D texture or CPU 96³ + marching cubes/raymarch), crisp+soft shadow maps from 3 lights, volumetric light, carve animation.
- **Emotional impact:** the gallery "aha" — hidden order revealed by your own hand; then authorship.
- **Expansion:** puzzle mode (find the angle), animated shadows (sculpture turns into a shadow-puppet movie: rotating gives frame-by-frame animation!), sharing a sculpture via URL hash, sound of stone grinding.
- **Risks:** carved visual hulls look blocky/ugly → need smooth SDF + nice material; three-shadow reveal must be pixel-crisp; drawing UI must be elegant.

## C2. 光室 LUMEN ATELIER — paint with real global illumination (Radiance Cascades)
- **Concept:** A paper-cut night diorama (houses, trees, a lighthouse) in 2D. You paint light sources, coloured glass, walls; light bounces with real-time noiseless GI: soft penumbrae, colour bleeding, light leaking under doors.
- **Hero moment:** you drag the sun/moon across the sky and the whole town's shadows sweep and fill with bounced colour; dropping a lantern into a dark alley lights it realistically.
- **Visual identity:** layered paper-cut silhouettes, indigo night, amber light, coloured stained-glass bleed.
- **Core interaction:** paint light/wall/glass; move sun; click windows to switch on lights.
- **Technical challenge:** radiance cascades + JFA distance field at 1080p in WebGL2; artifact-free merging; artistic layers.
- **Emotional impact:** cozy, magical; "my drawing glows".
- **Expansion:** day/night cycle, fireflies, coloured glass puzzles.
- **Risks:** 2D can read flat; RC ringing artifacts; existing tech demos exist (originality is in art direction, not tech); may drift toward "glow".

## C3. 聲沙 CHLADNI — a playable cymatics instrument
- **Concept:** A macro shot of a black-anodised (or brass) plate covered with fine white sand. You "bow" the plate (drag on its edge) or play keys; each note excites a real eigenmode; 200k grains leap and migrate to the nodal lines forming crisp geometry.
- **Hero moment:** silence, scattered sand; you drag the bow → a pure tone sings and within a second chaos snaps into an intricate mandala; change note → it dissolves and re-forms.
- **Visual identity:** studio product photography: single soft box, shallow DoF, metal anisotropic reflections, sand with self-shadowing.
- **Core interaction:** bow/keys = frequency; draw a custom plate shape (violin, guitar, heart) → compute its own modes.
- **Technical challenge:** GPU particle sand with jump physics; eigenmodes for arbitrary shapes (GPU wave-equation resonance or Lanczos on a grid); WebAudio synthesis matched to modes.
- **Emotional impact:** sound made visible; music + geometry.
- **Expansion:** song mode, record & replay, water cymatics (Faraday waves).
- **Risks:** "particles" again (though material, not glow); single gimmick if shapes don't add depth.

## C4. 摺界 POP-UP CITY — a procedural kirigami book
- **Concept:** a large paper book on a desk; you open it and a paper city unfolds with correct V-fold / parallel-fold kinematics; a candle you move casts shadows through cut windows.
- **Hero moment:** page turn → towers and bridges rise and lock with paper physics.
- **Visual identity:** cream paper, ink linework, warm candle light.
- **Interaction:** turn pages, pull tabs, move candle.
- **Technical challenge:** procedural pop-up mechanism solver; paper shading.
- **Risks:** kinematics complex; can look low-poly; limited interactivity beyond page turns.

## C5. 墨流 SUMINAGASHI — marbling printmaker
- **Concept:** float ink on water, comb it into marbled patterns (Turkish ebru), then lay paper to print.
- **Hero moment:** paper lifts off revealing a perfect print.
- **Risks:** WebGL fluid demos are extremely common (Dobryakov) → originality low.

## C6. 無限樓 ESCHER LANTERN — raymarched impossible architecture
- **Concept:** a lantern-lit raymarched building with non-Euclidean portals, Penrose stairs.
- **Hero:** step through a door into the room you're standing in, smaller.
- **Risks:** heavy raymarching at 1080p; navigation UX; SwiftShader verification nearly impossible.

## C7. 光桌 SPECTRAL BENCH — optical table with dispersion
- **Concept:** top-down lab bench; lasers, prisms, lenses, mirrors; spectral rays split into rainbows, caustics on the table.
- **Risks:** close to "glow"; overlaps with C2.

## Shortlist for prototypes
C1 Shadow Foundry (most original, strongest binary hero), C2 Lumen Atelier (frontier rendering tech), C3 Chladni (sound + physics). Three different visual languages: 3D chiaroscuro gallery / 2D paper-cut GI / macro product-photo material sim.
