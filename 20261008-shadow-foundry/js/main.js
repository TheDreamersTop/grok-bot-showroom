import * as THREE from 'three';
import { FIGURES, PRESETS, letterFig, LETTER_LIM, GLYPHS } from './figures.js';
import { G, MR, maskFromDraw, maskFromDrawT, maskFromCanvas, repairTight, fitFigures, forgeRods, Hull, coverageFromHull, fidelity, maskToWorld, sdf as sdfOf, projectRodsPosed, downMask, maxIoU } from './forge.js';
import { Sound } from './audio.js';
import { rayPoint, rasterRodsSW, rayCoverage, quickFidelity } from './forge.js';
import { WALL_VS, WALL_FS, HAZE_FS, COMP_FS, QUAD_VS, MOTE_VS, MOTE_FS } from './shaders.js';

const Q = new URLSearchParams(location.search);
const SMAP = +(Q.get('sm') || 2048), RMIN = +(Q.get('rmin') || 1.6);
const SHOT = Q.has('shot');
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const CEN = V3(G.C);

// ---------------- renderer & targets
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: SHOT });
const DPR = Math.min(devicePixelRatio, 1.5);
renderer.setPixelRatio(DPR); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
let W = Math.floor(innerWidth * DPR), H = Math.floor(innerHeight * DPR);
const sceneRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const depthRT = new THREE.WebGLRenderTarget(W >> 1, H >> 1, { depthTexture: new THREE.DepthTexture(W >> 1, H >> 1) });
const hazeRT = new THREE.WebGLRenderTarget(W >> 1, H >> 1, { type: THREE.HalfFloatType });

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(+(Q.get('fov') || 31), innerWidth / innerHeight, 0.1, 80);
const CAMDIR = new THREE.Vector3(1, 0.8, 1).normalize();
const CAMDIST = +(Q.get('cd') || 20.5);
const LOOK = new THREE.Vector3(+(Q.get('lx') || 2.3), +(Q.get('ly') || 3.55), +(Q.get('lx') || 2.3));
const HERO = +(Q.get('hp') || 0.33), HERO_LOOK = new THREE.Vector3(...(Q.get('hl') || '0,-1.35,0').split(',').map(Number)); let heroAmt = 0;
function placeCamera(px = 0, py = 0, push = 0) { // push includes the post-reveal hero push-in (heroAmt 0..1): pools fill ~60 % of the width
  const dir = CAMDIR.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), px * 0.035).applyAxisAngle(new THREE.Vector3(1, 0, -1).normalize(), -py * 0.03);
  const look = LOOK.clone().addScaledVector(HERO_LOOK, heroAmt); const k = heroAmt * heroAmt * (3 - 2 * heroAmt);
  const hp = camera.aspect >= 16 / 9 ? HERO : Math.max(0, 1 - (1 - HERO) * (16 / 9) / camera.aspect); // narrower screens: same pool share of the width, labels stay in frame
  camera.position.copy(look).addScaledVector(dir, CAMDIST * (1 - push - hp * k)); camera.lookAt(look);
}
placeCamera();

// ---------------- environment for brass reflections (dark room + 3 lamp-coloured softboxes)
const LAMP_COL = [new THREE.Color(1.0, 0.62, 0.34), new THREE.Color(0.48, 0.72, 1.0), new THREE.Color(1.0, 0.84, 0.64)];
{
  const es = new THREE.Scene(); es.background = new THREE.Color(0x0a0908);
  const box = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x15120f, side: THREE.BackSide })); es.add(box);
  G.walls.forEach((w, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ color: LAMP_COL[i].clone().multiplyScalar(6), side: THREE.DoubleSide })); const d = V3(w.lamp).sub(CEN).normalize(); p.position.copy(d.clone().multiplyScalar(9)); p.lookAt(0, 0, 0); es.add(p); });
  [[0, 0, -1], [-1, 0, 0], [0, -1, 0]].forEach((d, i) => { const p = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32), new THREE.MeshBasicMaterial({ color: LAMP_COL[i].clone().multiplyScalar(1.1), side: THREE.DoubleSide })); p.position.set(d[0] * 8, d[1] * 8, d[2] * 8); p.lookAt(0, 0, 0); es.add(p); });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x1a1510 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -6; es.add(fl);
  const pm = new THREE.PMREMGenerator(renderer); var ENV = pm.fromScene(es, 0.02).texture;
}

// ---------------- lamps
const cookieTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.55, '#f4f4f4'); gr.addColorStop(0.78, '#d8d8d8'); gr.addColorStop(0.86, '#e6e6e6'); gr.addColorStop(0.93, '#555'); gr.addColorStop(1, '#000');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); return t; })();
const ANG = Math.atan(2.45 / (G.L + G.d));
const lamps = G.walls.map((w, i) => {
  const l = new THREE.SpotLight(LAMP_COL[i], 0, 0, ANG, 0.18, 0);
  l.position.copy(V3(w.lamp)); l.target.position.copy(CEN); scene.add(l.target);
  l.castShadow = true; l.shadow.mapSize.set(SMAP, SMAP); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.012;
  l.shadow.camera.near = G.L - 2.0; l.shadow.camera.far = G.L + G.d + 1; l.map = cookieTex;
  scene.add(l); return l;
});
const rim = new THREE.DirectionalLight(0xbcd0ff, 0.0); rim.position.set(-3, 9, -3).add(CEN); rim.target.position.copy(CEN); scene.add(rim, rim.target);

// lamp housings (visible fixtures), hung from a ceiling track
const CEIL = 9.2;
const housingBase = new THREE.MeshStandardMaterial({ color: 0x141312, metalness: 0.6, roughness: 0.45, envMap: ENV });
const lensMats = [], fixtures = [];
function lampFixture(i) {
  const housingMat = housingBase.clone(); housingMat.emissive = new THREE.Color(0, 0, 0);
  const w = G.walls[i], g = new THREE.Group(); g.position.copy(V3(w.lamp)); g.lookAt(CEN);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 0.8, 32, 1, true), housingMat); body.rotation.x = Math.PI / 2; body.position.z = -0.15; g.add(body);
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), housingMat); back.position.z = -0.55; back.rotation.y = Math.PI; g.add(back);
  for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.018, 8, 40), housingMat); r.position.z = -0.45 + k * 0.08; g.add(r); }
  const lm = new THREE.MeshBasicMaterial({ color: LAMP_COL[i].clone().multiplyScalar(0) }); lensMats.push(lm);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.27, 32), lm); lens.position.z = 0.26; g.add(lens);
  const lipMat = new THREE.MeshStandardMaterial({ color: 0x8a6a40, metalness: 1, roughness: 0.35, envMap: ENV, emissive: new THREE.Color(0, 0, 0) });
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.025, 8, 40), lipMat); lip.position.z = 0.25; g.add(lip);
  // yoke
  const yk = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.022, 8, 32, Math.PI), housingMat); yk.rotation.z = Math.PI; yk.rotation.y = Math.PI / 2; g.add(yk);
  scene.add(g);
  const steel = housingMat;
  const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, CEIL - w.lamp[1] - 0.4, 10), steel); drop.position.set(w.lamp[0], (CEIL + w.lamp[1] + 0.4) / 2, w.lamp[2]); scene.add(drop);
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), steel); carriage.position.set(w.lamp[0], CEIL - 0.1, w.lamp[2]); scene.add(carriage);
  fixtures[i] = { g, drop, carriage, mat: housingMat, lipMat };
}
[0, 1, 2].forEach(lampFixture);
{ // ceiling + two steel tracks crossing over the overhead lamp
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x0d0c0b, metalness: 0.8, roughness: 0.35, envMap: ENV });
  const tA = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 10.5), trackMat); tA.position.set(G.d, CEIL - 0.04, 5.25); scene.add(tA);
  const tB = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.07, 0.09), trackMat); tB.position.set(5.25, CEIL - 0.04, G.d); scene.add(tB);
  const tC = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.07, 0.09), trackMat); tC.position.set(G.d, CEIL - 0.04, G.d + G.L); scene.add(tC); // cross tracks: lamps 0/1 slide sideways
  const tD = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 6.2), trackMat); tD.position.set(G.d + G.L, CEIL - 0.04, G.d); scene.add(tD);
  for (const z of [0.6, 4.5, 9.5]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), trackMat); c.position.set(G.d, CEIL - 0.09, z); scene.add(c); }
}

// ---------------- walls (custom isolated lighting)
const wallMats = [];
const LENS = [[0.10, 0.06, 0.005, 0.14], [0.05, 0.08, 0.006, 0.05], [0.15, 0.035, 0.004, 0.2]]; // focus softness, ring, chromatic fringe, hotspot
function wall(i, geo, pos, rot, N, axis) {
  const m = new THREE.ShaderMaterial({ vertexShader: WALL_VS, fragmentShader: WALL_FS, uniforms: {
    lampPos: { value: V3(G.walls[i].lamp) }, lampDir: { value: CEN.clone().sub(V3(G.walls[i].lamp)).normalize() }, lampColor: { value: LAMP_COL[i] }, lampInt: { value: 0 },
    cosOuter: { value: Math.cos(ANG) }, cosInner: { value: Math.cos(ANG * 0.82) }, shadowMap: { value: null }, cookie: { value: cookieTex }, drawTex: { value: null },
    shadowMatrix: { value: new THREE.Matrix4() }, radius: { value: 2 }, smap: { value: SMAP }, darkness: { value: 0.95 }, drawAmt: { value: 0 }, workLight: { value: 0 }, time: { value: 0 },
    N: { value: N }, axis: { value: axis }, bounce: { value: new THREE.Vector3() }, reflTex: { value: null }, reflMat: { value: new THREE.Matrix4() }, reflAmt: { value: axis === 1 ? 1 : 0 }, pc: { value: [V3([G.d, G.h, 0]), V3([0, G.h, G.d]), V3([G.d, 0, G.d])] }, pcol: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, lens: { value: new THREE.Vector4(...LENS[i]) }, res: { value: new THREE.Vector2(1, 1) }, mo: { value: V3(G.walls[i].o) }, mu: { value: V3(G.walls[i].u) }, mv: { value: V3(G.walls[i].v) }, M: { value: G.M } } });
  const mesh = new THREE.Mesh(geo, m); mesh.position.copy(pos); mesh.rotation.copy(rot); scene.add(mesh); wallMats[i] = m; return mesh;
}
const wallBack = wall(0, new THREE.PlaneGeometry(14, CEIL), new THREE.Vector3(7, CEIL / 2, 0), new THREE.Euler(0, 0, 0), new THREE.Vector3(0, 0, 1), 2);
const wallLeft = wall(1, new THREE.PlaneGeometry(14, CEIL), new THREE.Vector3(0, CEIL / 2, 7), new THREE.Euler(0, Math.PI / 2, 0), new THREE.Vector3(1, 0, 0), 0);
const wallFloor = wall(2, new THREE.PlaneGeometry(14, 14), new THREE.Vector3(7, 0, 7), new THREE.Euler(-Math.PI / 2, 0, 0), new THREE.Vector3(0, 1, 0), 1);
const WALLS = [wallBack, wallLeft, wallFloor];
const ceilMat = new THREE.ShaderMaterial({ vertexShader: WALL_VS, fragmentShader: WALL_FS, uniforms: THREE.UniformsUtils.clone(wallMats[0].uniforms) });
ceilMat.uniforms.lampInt.value = 0; ceilMat.uniforms.N.value = new THREE.Vector3(0, -1, 0); ceilMat.uniforms.axis.value = 1; ceilMat.uniforms.reflAmt.value = 0;
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), ceilMat); ceiling.rotation.x = Math.PI / 2; ceiling.position.set(7, CEIL, 7); scene.add(ceiling);

// ---------------- pin + plinth
const blackSteel = new THREE.MeshStandardMaterial({ color: 0x0e0d0c, metalness: 0.7, roughness: 0.38, envMap: ENV });
const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, G.walls[2].lamp[1] - 0.3 - G.C[1], 6), blackSteel); wire.position.set(G.C[0], (G.walls[2].lamp[1] - 0.3 + G.C[1]) / 2, G.C[2]); wire.castShadow = false; scene.add(wire);

// ---------------- the nest (rods)
const pivot = new THREE.Group(); pivot.position.copy(CEN); scene.add(pivot);
const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 14, 1, false); rodGeo.translate(0, 0.5, 0);
function rodMaterial(color, metal, rough) {
  const m = new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, envMap: ENV, envMapIntensity: 0.9 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aRough; varying float vRough;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRough = aRough;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vRough;').replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vRough;');
  };
  return m;
}
const ROD_MATS = [rodMaterial(0xffffff, 1.0, 0.45), rodMaterial(0xffffff, 1.0, 0.22), rodMaterial(0xffffff, 0.75, 0.4)];
let rodMeshes = [], current = null;
function buildNest(res) {
  for (const m of rodMeshes) { pivot.remove(m); m.geometry.dispose(); } rodMeshes = [];
  const byMat = [[], [], []]; res.rods.forEach(r => byMat[r.mat].push(r));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  byMat.forEach((list, mi) => {
    if (!list.length) return;
    const geo = rodGeo.clone(); const rough = new Float32Array(list.length);
    const im = new THREE.InstancedMesh(geo, ROD_MATS[mi], list.length);
    list.forEach((r, i) => {
      a.set(...r.a).sub(CEN); b.set(...r.b).sub(CEN); const d = b.clone().sub(a); const L = d.length();
      q.setFromUnitVectors(up, d.normalize()); m4.compose(a, q, s.set(r.r, L, r.r)); im.setMatrixAt(i, m4);
      const ao = Math.min(1, 0.45 + r.depth * 2.5);
      if (mi === 0) col.setRGB(0.15 + 0.07 * r.tone, 0.088 + 0.04 * r.tone, 0.03 + 0.015 * r.tone); // dark aged patina (#6e5530 base)
      else if (mi === 1) col.setRGB(0.80, 0.58, 0.28);
      else col.setRGB(0.07, 0.065, 0.06);
      col.multiplyScalar(ao); im.setColorAt(i, col);
      rough[i] = mi === 0 ? 0.32 + 0.3 * ((r.tone * 7.13) % 1) : mi === 1 ? 0.2 + 0.08 * r.tone : 0.38 + 0.15 * r.tone;
    });
    geo.setAttribute('aRough', new THREE.InstancedBufferAttribute(rough, 1));
    im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true;
    pivot.add(im); rodMeshes.push(im);
  });
}

// ---------------- pose
const AX_T = new THREE.Vector3(1, 0, -1).normalize(), AX_Y = new THREE.Vector3(0, 1, 0);
function poseQuat(yaw, tilt) { return new THREE.Quaternion().setFromAxisAngle(AX_T, tilt).multiply(new THREE.Quaternion().setFromAxisAngle(AX_Y, yaw)); }

// ---------------- post: depth pre-pass → volumetric haze → composite
const quadGeo = new THREE.PlaneGeometry(2, 2), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
const hazeMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: HAZE_FS, depthTest: false, depthWrite: false, uniforms: {
  depthTex: { value: depthRT.depthTexture }, sm0: { value: null }, sm1: { value: null }, sm2: { value: null }, smat0: { value: new THREE.Matrix4() }, smat1: { value: new THREE.Matrix4() }, smat2: { value: new THREE.Matrix4() },
  invVP: { value: new THREE.Matrix4() }, camPos: { value: new THREE.Vector3() }, lp: { value: G.walls.map(w => V3(w.lamp)) }, ld: { value: G.walls.map(w => CEN.clone().sub(V3(w.lamp)).normalize()) },
  lc: { value: LAMP_COL.map(c => new THREE.Vector3(c.r, c.g, c.b)) }, li: { value: [0, 0, 0] }, cosOuter: { value: Math.cos(ANG) }, time: { value: 0 }, density: { value: +(Q.get('hz') || 0.045) }, freeze: { value: 0 } } });
const compMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: COMP_FS, depthTest: false, depthWrite: false, uniforms: {
  sceneTex: { value: sceneRT.texture }, hazeTex: { value: hazeRT.texture }, res: { value: new THREE.Vector2(W, H) }, time: { value: 0 }, exposure: { value: 1.0 }, grain: { value: 0.028 }, fade: { value: 1 } } });
// planar floor reflection (half res, mirrored camera)
const reflRT = new THREE.WebGLRenderTarget(W >> 1, H >> 1, { type: THREE.HalfFloatType });
const reflCam = new THREE.PerspectiveCamera(); const reflMatrix = new THREE.Matrix4(); const BIAS = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
function renderReflection() {
  reflCam.copy(camera); reflCam.position.set(camera.position.x, -camera.position.y, camera.position.z); reflCam.up.set(0, -1, 0);
  const tgt = LOOK.clone(); tgt.y = -tgt.y; reflCam.lookAt(tgt); reflCam.updateMatrixWorld(); reflCam.projectionMatrix.copy(camera.projectionMatrix);
  reflMatrix.copy(BIAS).multiply(reflCam.projectionMatrix).multiply(reflCam.matrixWorldInverse);
  wallFloor.visible = false; motes.visible = false; const sm = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
  const RM = [...wallMats, ceilMat]; for (const m of RM) m.uniforms.reflTex.value = null;
  renderer.setRenderTarget(reflRT); renderer.render(scene, reflCam); renderer.shadowMap.autoUpdate = sm; wallFloor.visible = true; motes.visible = true;
  for (const m of RM) m.uniforms.reflTex.value = reflRT.texture;
}
// dust motes lit only inside the cones
const MOTES = 900, mg = new THREE.BufferGeometry(), mpos = new Float32Array(MOTES * 3), mseed = new Float32Array(MOTES);
{ const R = (() => { let a = 99; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  for (let i = 0; i < MOTES; i++) { const k = i % 3, w = G.walls[k]; const t = 0.15 + 0.8 * R(); const ax = CEN.clone().sub(V3(w.lamp)); const len = ax.length() + G.d; ax.normalize();
    const base = V3(w.lamp).addScaledVector(ax, len * t); const rr = Math.tan(ANG) * len * t * Math.sqrt(R()); const tmp = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).cross(ax).normalize().multiplyScalar(rr);
    base.add(tmp); mpos.set([base.x, base.y, base.z], i * 3); mseed[i] = R(); } }
mg.setAttribute('position', new THREE.BufferAttribute(mpos, 3)); mg.setAttribute('seed', new THREE.BufferAttribute(mseed, 1));
const moteMat = new THREE.ShaderMaterial({ vertexShader: MOTE_VS, fragmentShader: MOTE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: {
  lp: { value: G.walls.map(w => V3(w.lamp)) }, ld: { value: G.walls.map(w => CEN.clone().sub(V3(w.lamp)).normalize()) }, lc: { value: LAMP_COL.map(c => new THREE.Vector3(c.r, c.g, c.b)) }, li: { value: [0, 0, 0] },
  cosOuter: { value: Math.cos(ANG) }, time: { value: 0 }, freeze: { value: 0 }, px: { value: DPR }, amt: { value: +(Q.get('ma') || 0.5) } } });
const motes = new THREE.Points(mg, moteMat); motes.frustumCulled = false; scene.add(motes);
const hazeScene = new THREE.Scene(); hazeScene.add(new THREE.Mesh(quadGeo, hazeMat));
const compScene = new THREE.Scene(); compScene.add(new THREE.Mesh(quadGeo, compMat));

// ---------------- state → scene
const LAMP_GAIN = (Q.get('lg') || '1.12,1.12,2.05').split(',').map(Number);
const WALL_INT = +(Q.get('wi') || 0.72), BOUNCE = +(Q.get('bo') || 1.0);
const S = { lamp: [1, 1, 1], radius: [1.2, 1.2, 1.2], dark: [0.97, 0.97, 0.97], push: 0, freeze: 0, fade: 1, time: 0 };
const mouse = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
function applyState() {
  for (let i = 0; i < 3; i++) {
    const on = S.lamp[i]; lamps[i].intensity = 3.2 * on; const u = wallMats[i].uniforms;
    u.lampInt.value = WALL_INT * LAMP_GAIN[i] * on; u.radius.value = S.radius[i]; u.darkness.value = S.dark[i]; u.time.value = S.time;
    lensMats[i].color.copy(LAMP_COL[i]).multiplyScalar(14 * on);
    u.bounce.value.set(0.016, 0.0152, 0.0145);
    hazeMat.uniforms.li.value[i] = on; moteMat.uniforms.li.value[i] = on;
  }
  for (let j = 0; j < 3; j++) { const c = LAMP_COL[j], k = S.lamp[j] * WALL_INT * 0.78 * BOUNCE; wallMats[0].uniforms.pcol.value[j].set(c.r * k, c.g * k, c.b * k); }
  for (const m of [...wallMats, ceilMat]) { m.uniforms.pcol.value = wallMats[0].uniforms.pcol.value; m.uniforms.reflTex.value = reflRT.texture; m.uniforms.reflMat.value = reflMatrix; }
  {
  }
  hazeMat.uniforms.freeze.value = S.freeze; moteMat.uniforms.freeze.value = S.freeze; moteMat.uniforms.time.value = S.time; hazeMat.uniforms.time.value = S.time; compMat.uniforms.time.value = S.time; compMat.uniforms.fade.value = S.fade;
  if (!SHOT) { cam.x += (mouse.x - cam.x) * 0.04; cam.y += (mouse.y - cam.y) * 0.04; }
  placeCamera(cam.x, cam.y, S.push);
}
function render() {
  applyState();
  renderReflection();
  renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);
  lamps.forEach((l, i) => { if (l.shadow.map) { const tex = l.shadow.map.texture; wallMats[i].uniforms.shadowMap.value = tex; wallMats[i].uniforms.shadowMatrix.value.copy(l.shadow.matrix); hazeMat.uniforms['sm' + i].value = tex; hazeMat.uniforms['smat' + i].value.copy(l.shadow.matrix); } });
  // depth pre-pass (half res) for the haze march
  scene.overrideMaterial = depthOnly; motes.visible = false; const bg = scene.background; scene.background = null; const sm = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
  renderer.setRenderTarget(depthRT); renderer.render(scene, camera); scene.overrideMaterial = null; motes.visible = true; scene.background = bg; renderer.shadowMap.autoUpdate = sm;
  hazeMat.uniforms.invVP.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse); hazeMat.uniforms.camPos.value.copy(camera.position);
  renderer.setRenderTarget(hazeRT); renderer.render(hazeScene, postCam);
  renderer.setRenderTarget(null); renderer.render(compScene, postCam);
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight); W = Math.floor(innerWidth * DPR); H = Math.floor(innerHeight * DPR);
  sceneRT.setSize(W, H); reflRT.setSize(W >> 1, H >> 1); depthRT.setSize(W >> 1, H >> 1); hazeRT.setSize(W >> 1, H >> 1); compMat.uniforms.res.value.set(W, H);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
});

// ============================================================== V1 experience
const sound = new Sound();
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

// ---------------- fonts (self-hosted)
const fontsReady = (async () => {
  const faces = [new FontFace('Cormorant', 'url(fonts/cormorant.woff)', { weight: '300 700' }), new FontFace('Cormorant', 'url(fonts/cormorant-italic.woff)', { style: 'italic', weight: '300 700' }), new FontFace('NotoSerifTC', 'url(fonts/notoseriftc.woff)')];
  await Promise.all(faces.map(f => f.load().then(ff => document.fonts.add(ff)).catch(e => console.warn('font', e.message))));
})();

// ---------------- forge pipeline
function forgeFrom(draws, opts) {
  const t0 = performance.now();
  let T = opts.T, fid0 = null;
  if (!T) { const fit = fitFigures(draws, { evals: opts.evals || 70, lim: opts.lim, init: [0, 1, 2].map(() => ({ sx: 0.95, sy: 0.95, tx: 0, ty: 0, r: 0 })) }); T = fit.T; }
  const tFit = performance.now() - t0;
  const orig = draws.map((d, i) => maskFromDrawT(d, T[i]));
  const fixed = repairTight(orig, opts.repairIter || 3, opts.maxCost || 3.2);
  const tRep = performance.now() - t0;
  const fidHull = fidelity(orig, rayCoverage(new Hull(fixed), orig, 0));
  const tHull = performance.now() - t0;
  const res = forgeRods(fixed, { seed: opts.seed || 11, target: orig, maxEdge: opts.maxEdge || 2200, maxRepair: opts.maxRepair || 1200 });
  const fidRods = res.fidelity;
  return { T, orig, masks: fixed, rods: res.rods, fidHull, fidRods, ms: performance.now() - t0, times: { fit: tFit, repairTight: tRep, hullCheck: tHull, forge: res.times }, counts: res.counts };
}
function scrambleSearch(rods, targetsMasks, exclude = 0.42) {
  const targets = targetsMasks.map(m => downMask(m)); const res = [];
  for (let yi = 0; yi < 36; yi++) { const yaw = yi * Math.PI / 18; const md = Math.abs(((yaw + Math.PI / 4) % (Math.PI / 2)) - Math.PI / 4); if (md < exclude) continue;
    for (const tilt of [-0.62, -0.4, 0.4, 0.62]) { const q = poseQuat(yaw, tilt); const pm = projectRodsPosed(rods, [q.x, q.y, q.z, q.w]); const iou = pm.map(m => maxIoU(m, targets)); res.push({ yaw, tilt, max: Math.max(...iou), iou }); } }
  res.sort((a, b) => a.max - b.max); return res;
}

// ---------------- nest with fly-in animation
let nest = null; // { meshes:[{im, list}], t0, mode:'in'|'out'|'idle' }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
function prepNest(res, prev, t0 = 0) {
  buildNest(res); // creates rodMeshes with final matrices (grouped by material, order preserved)
  const R = mulberry(5 + res.rods.length); const meshes = []; const byRod = [];
  res.rods.forEach((r, i) => r.__i = i);
  const groups = [[], [], []]; res.rods.forEach(r => groups[r.mat].push(r)); const lists = groups.filter(g => g.length);
  rodMeshes.forEach((im, mi) => { const n = im.count; const data = []; for (let i = 0; i < n; i++) { im.getMatrixAt(i, _m4); const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); _m4.decompose(pos, q, sc);
    const ri = lists[mi][i].__i; const old = prev && prev[ri];
    let d; if (old) d = { ...old, pos, q, sc }; else { const dir = pos.clone().add(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.8)).normalize(); const far = pos.clone().addScaledVector(dir, 3.5 + R() * 4).add(new THREE.Vector3(0, 1.5 + R() * 2, 0));
      const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6, R() * 6, R() * 6)); d = { pos, q, sc, far, q0, delay: t0 + pos.length() * 0.28 + R() * 0.35, landed: false }; }
    data.push(d); byRod[ri] = d; }
    meshes.push({ im, data }); });
  addForgeData(meshes); rodMeshes.forEach(m => { m.frustumCulled = false; });
  return { meshes, byRod, t0: 0, mode: prev ? 'in' : 'idle' };
}
// ---------------- "The Forge" opening: rods fly in from the dark into a churning swarm (hatch storm on all three walls),
// then every rod snaps home inside ~0.3 s so all three shadows resolve at once. Pure function of intro time (shot-mode safe).
const FG = { A0: 1.2, A1: 2.9, FLY: 0.8, S0: +(Q.get('fs0') || 4.2), JIT: 0.08, D: 0.62, CR: +(Q.get('fcr') || 1.9), STORM_R: 4.0 };
FG.END = FG.S0 + FG.JIT + FG.D; // last rod lands
function addForgeData(meshes) {
  const R = mulberry(77); const all = meshes.flatMap(m => m.data); const L = all.map(d => d.pos.length()).sort((a, b) => a - b); const med = L[(L.length / 2) | 0] || 1, r90 = L[(L.length * 0.9) | 0] || 1;
  for (const d of all) {
    const dir = new THREE.Vector3(R() - 0.5, (R() - 0.5) * 0.8, R() - 0.5).normalize();
    d.off = dir.clone().multiplyScalar(med); // used by shatter for burst direction jitter
    d.cloud = dir.multiplyScalar(r90 * FG.CR * (0.25 + 0.75 * Math.cbrt(R()))); // storm cloud: independent of the final layout (no figure density)
    d.qs = new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6.28, R() * 6.28, R() * 6.28));
    d.ax = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(); d.spin = (R() < 0.5 ? -1 : 1) * (0.5 + 1.3 * R());
    d.orb = (0.25 + 0.35 * R()) * (R() < 0.8 ? 1 : -1); d.ph = R() * 6.28;
    const wave = (R() * 3) | 0; d.arrive = FG.A0 + wave * (FG.A1 - FG.A0) / 3 + R() * (FG.A1 - FG.A0) / 3;
    d.snap = FG.S0 + (R() * 2 - 1) * FG.JIT; d.ticked = false;
  }
}
function cloudAt(d, t, out) { const a = d.orb * t, c = Math.cos(a), s = Math.sin(a); // slow orbit about the wire axis
  return out.set(d.cloud.x * c - d.cloud.z * s, d.cloud.y + 0.08 * Math.sin(t * 1.3 + d.ph), d.cloud.x * s + d.cloud.z * c); }
const _sp = new THREE.Vector3(), _sq = new THREE.Quaternion(), _qa = new THREE.Quaternion(), ZERO = new THREE.Vector3(1e-4, 1e-4, 1e-4);
function forgeIntroPose(it, sounds) {
  if (!nest) return; let ticks = 0;
  for (const { im, data } of nest.meshes) { for (let i = 0; i < data.length; i++) { const d = data[i];
    if (it < d.arrive) { _m4.compose(d.far, d.q0, ZERO); im.setMatrixAt(i, _m4); continue; }
    if (it >= d.snap + FG.D) { _m4.compose(d.pos, d.q, d.sc); im.setMatrixAt(i, _m4); continue; }
    cloudAt(d, it, _sp);
    _qa.setFromAxisAngle(d.ax, d.spin * it); _sq.copy(_qa).multiply(d.qs);
    let sc = 1;
    if (it < d.arrive + FG.FLY) { const u = easeOut((it - d.arrive) / FG.FLY); _p.lerpVectors(d.far, _sp, u); _q.copy(d.q0).slerp(_sq, u); sc = 0.3 + 0.7 * u; if (u > 0.85 && !d.ticked) { d.ticked = true; ticks++; } }
    else if (it < d.snap) { _p.copy(_sp); _q.copy(_sq); }
    else { const u = clamp((it - d.snap) / FG.D, 0, 1), e = u * u * u; _p.lerpVectors(_sp, d.pos, e); _q.copy(_sq).slerp(d.q, sm(0.6, 1, u)); } // implosion: ease-in, rotate in the last 40 %
    _s.copy(d.sc).multiplyScalar(sc); _m4.compose(_p, _q, _s); im.setMatrixAt(i, _m4); }
    im.instanceMatrix.needsUpdate = true; }
  if (sounds && ticks) for (let k = 0; k < Math.min(2, ticks); k++) sound.tick((Math.random() - 0.5) * 1.2);
}
// misalignment loosens the sculpture: rods drift part-way into the storm cloud (the puzzle starts half-rebuilt;
// no pose of the assembled object can spoil the figures, and closing in visibly pulls the rods together)
const SCAT = +(Q.get('scat') || 0.55); let scatLast = -1;
function scatterAmount(ang) { const a0 = poseAngle(SCR[1].yaw, SCR[1].tilt); const u = clamp((ang - 0.04) / Math.max(0.1, a0 - 0.04), 0, 1.3); return SCAT * Math.pow(u, 1.25); }
function scatterPose(k, t) {
  if (!nest || (k < 1e-3 && scatLast < 1e-3)) return; scatLast = k;
  for (const { im, data } of nest.meshes) { for (let i = 0; i < data.length; i++) { const d = data[i];
    if (k < 1e-3) { _m4.compose(d.pos, d.q, d.sc); im.setMatrixAt(i, _m4); continue; }
    cloudAt(d, t, _sp); _p.lerpVectors(d.pos, _sp, k); _qa.setFromAxisAngle(d.ax, d.spin * t); _sq.copy(_qa).multiply(d.qs); _q.copy(d.q).slerp(_sq, Math.min(1, k * 1.4));
    _m4.compose(_p, _q, d.sc); im.setMatrixAt(i, _m4); }
    im.instanceMatrix.needsUpdate = true; }
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function animateNest(t) { // t: seconds since animation start
  if (!nest || nest.mode === 'idle') return; let landedNow = 0, allDone = true;
  for (const { im, data } of nest.meshes) { for (let i = 0; i < data.length; i++) { const d = data[i];
    let k = clamp((t - d.delay) / 0.85, 0, 1); if (nest.mode === 'out') k = 1 - clamp((t - d.delay * 0.4) / 0.6, 0, 1);
    if (k < 1) allDone = false; const e = nest.mode === 'out' ? k * k : easeOut(k);
    if (nest.mode === 'in' && k >= 1 && !d.landed) { d.landed = true; landedNow++; }
    _p.lerpVectors(d.far, d.pos, e); _q.copy(d.q0).slerp(d.q, e); _s.copy(d.sc).multiplyScalar(nest.mode === 'out' ? Math.max(0.001, e) : 0.3 + 0.7 * e); _m4.compose(_p, _q, _s); im.setMatrixAt(i, _m4); }
    im.instanceMatrix.needsUpdate = true; }
  if (landedNow) for (let k = 0; k < Math.min(3, landedNow); k++) sound.tick((Math.random() - 0.5) * 0.8);
  if (allDone) { nest.mode = nest.mode === 'out' ? 'gone' : 'idle'; }
}

// ---------------- labels in the light pools
const labelMeshes = [];
let LABEL_POS = (Q.get('lp') ? JSON.parse(Q.get('lp')) : [[6.35, 3.0, 0.004], [0.004, 3.0, 6.35], [6.1, 0.004, 2.1]]);
function makeLabel(text, sub, w) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 320; const g = c.getContext('2d');
  g.fillStyle = 'rgba(236,226,208,1)'; g.textBaseline = 'alphabetic';
  g.font = '500 132px NotoSerifTC, serif'; const zh = text[0]; g.fillText(zh, 0, 140); const zw = g.measureText(zh).width;
  g.font = 'italic 500 120px Cormorant, serif'; g.fillText(text[1], zw + 30, 136);
  g.fillRect(4, 178, 120, 4);
  g.font = '600 54px Cormorant, serif'; g.fillStyle = 'rgba(236,226,208,0.62)'; g.fillText(sub, 4, 250);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const LW = 1.9; const mesh = new THREE.Mesh(new THREE.PlaneGeometry(LW, LW * 320 / 1024), m); mesh.renderOrder = 5; m.color.setScalar(0.55);
  const P = LABEL_POS[w]; mesh.position.set(P[0], P[1], P[2]);
  if (w === 1) mesh.rotation.y = Math.PI / 2; else if (w === 2) { mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = Math.PI / 4; }
  scene.add(mesh); return mesh;
}
function setLabels(titles, no) { for (const m of labelMeshes) { scene.remove(m); m.material.map.dispose(); } labelMeshes.length = 0; titles.forEach((t, i) => labelMeshes.push(makeLabel(t.split(' '), `No. ${no}  ·  ${['first', 'second', 'third'][i]} shadow`, i))); }

// ---------------- DOM UI
const ui = document.getElementById('ui');
ui.innerHTML = `
<div id="placard"><div class="pt"><span class="zh">影鑄</span> Shadow Foundry</div><div class="pw" id="pw"></div><div class="pm" id="pm"></div></div>
<div id="hint"></div>
<button id="mute" title="Sound"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path id="mw" d="M16 8.5c1.2 1 1.2 6 0 7M18.5 6c2.5 2.3 2.5 9.7 0 12" stroke="currentColor" fill="none" stroke-width="1.4"/></svg></button>
<div id="word"><div id="wslots"><canvas></canvas><canvas></canvas><canvas></canvas></div><div id="wprompt">Type 3 letters to forge a sculpture</div></div>
<div id="actions"><button id="bCopy" class="hidden">Copy share link ⧉</button><button id="bDraw">Draw your own three shadows <span class="zh">畫你的影子</span></button><button id="bNext">Next sculpture →</button></div>
<div id="drawbar" class="hidden"><div class="dt">Draw a silhouette on each lit wall. Closed outlines fill in by themselves.</div>
<div class="db"><button id="bClear">Clear</button><button id="bCancel">Back</button><button id="bForge" disabled>Forge the sculpture →</button></div></div>
<div id="forging" class="hidden">forging…</div>`;
const $ = (id) => document.getElementById(id);
function setPlacard(no, titles, nRods, fid, word) {
  $('pw').innerHTML = `No. ${no} — ${titles.map(t => t.split(' ')[1]).join(', ')}${word && !PRESET_LIST.some(P => P.word === word) ? ' · forged for you' : ''}`;
  $('pm').innerHTML = `aged brass &amp; blackened steel, ${nRods.toLocaleString('en-US')} rods · ${(100 * Math.min(...fid)).toFixed(1)} % shadow fidelity`;
}
let hintTimer = 0; function hint(txt) { const h = $('hint'); h.textContent = txt; h.classList.toggle('on', !!txt); }
$('mute').onclick = (e) => { e.stopPropagation(); sound.start(); sound.setMuted(!sound.muted); $('mute').classList.toggle('off', sound.muted); };

// ---------------- state machine
const PRESET_LIST = PRESETS;
let presetIdx = +(Q.get('preset') || 0);
if (Q.get('T')) PRESETS[presetIdx].T = JSON.parse(Q.get('T'));
let work = null;          // current forged work {orig, masks, rods, fidHull, fidRods, titles, no}
let SCR = [{ yaw: 2.27, tilt: 0.62 }, { yaw: +(Q.get('sy') || -0.698), tilt: +(Q.get('st') || 0.62) }];
const st = { mode: 'intro', t: 0, introT: 0, yaw: 0, tilt: 0, vy: 0, vt: 0, drag: false, lockAt: -1, locked: false, lastMove: 0, freeStart: 0, labelA: 0, anim: 0, lastLockIntro: false, lampMul: 1 };

function loadWork(w) {
  work = w; current = w; scatLast = -1;
  nest = prepNest({ rods: w.rods }); setLabels(w.titles, w.no); setPlacard(w.no, w.titles, w.rods.length, w.fidRods, w.word);
  $('bCopy').classList.toggle('hidden', !w.word); if (w.word && !SHOT) history.replaceState(null, '', '#w=' + w.word);
  window.__forge = { current: w, fidRaw: w.fidHull, fidRep: w.fidRods };
}
function presetWork(i) {
  const P = PRESET_LIST[i]; const w = forgeFrom(P.figs.map(f => FIGURES[f]), { T: P.T, seed: 11 });
  w.titles = P.title; w.no = P.no; console.log(`preset ${P.no}: rods ${w.rods.length}, hull fidelity ${w.fidHull.map(x => (100 * x).toFixed(1)).join('/')}, rod coverage ${w.fidRods.map(x => (100 * x).toFixed(1)).join('/')}, ${w.ms.toFixed(0)} ms`);
  if (!P.T) {} return w;
}
let masks = null;
const KIND = ['long', 'repair', 'edge'];
function packWork(w) { const f = (x) => +x.toFixed(4); return { no: w.no, T: w.T, fidHull: w.fidHull.map(f), fidRods: w.fidRods.map(f), counts: w.counts,
  rods: w.rods.map(r => [...r.a.map(f), ...r.b.map(f), f(r.r), r.g, KIND.indexOf(r.kind), f(r.depth), r.mat, f(r.tone)]) }; }
function unpackWork(j, P) { const rods = j.rods.map(a => ({ a: [a[0], a[1], a[2]], b: [a[3], a[4], a[5]], r: a[6], g: a[7], kind: KIND[a[8]], depth: a[9], mat: a[10], tone: a[11] }));
  const w = { rods, T: j.T, fidHull: j.fidHull, fidRods: j.fidRods, counts: j.counts, titles: P.title, no: P.no, word: P.word, ms: 0 };
  Object.defineProperty(w, 'orig', { get() { return this._o || (this._o = P.figs.map((n, i) => maskFromDrawT(FIGURES[n], j.T[i]))); } });
  Object.defineProperty(w, 'masks', { get() { return this._m || (this._m = repairTight(this.orig, 3, 3.2)); } }); return w; }
async function loadPreset(i) {
  const P = PRESET_LIST[i];
  if (!Q.has('nobake')) { try { const r = await fetch(`data/preset-${P.no}.json`); if (r.ok) { const w = unpackWork(await r.json(), P); console.log(`preset ${P.no} (baked): rods ${w.rods.length}, rod coverage ${w.fidRods.map(x => (100 * x).toFixed(1)).join('/')}`); return w; } } catch (e) { console.warn('bake load failed', e.message); } }
  return presetWork(i);
}
window.__bake = (i) => { const P = PRESET_LIST[i]; const w = forgeFrom(P.figs.map(n => FIGURES[n]), { T: P.T, seed: 11 }); w.no = P.no; return packWork(w); };

// pose → guidance (penumbra radius, darkness): the signal the visitor sees (and hears)
function poseAngle(yaw, tilt) { return poseQuat(yaw, tilt).angleTo(new THREE.Quaternion()); }
function guidance(ang) { const a = 1 - Math.exp(-ang / 0.16); return { radius: RMIN + 30 * a, dark: 0.975 }; }

// lock choreography relative to lock time
function lockFX(dt) { // dt seconds since lock (<0: not locked)
  const out = { radius: [0, 0, 0], k: [0, 0, 0], push: 0, freeze: 0, labels: 0, flash: 0 };
  if (dt < 0) return out;
  for (let i = 0; i < 3; i++) out.k[i] = easeOut((dt - 0.06 * i) / 0.25);
  out.push = 0.03 * easeOut(dt / 0.35); out.flash = 0.14 * Math.exp(-dt / 0.25) * (dt < 1.5 ? 1 : 0); out.freeze = dt < 0.2 ? 1 : Math.max(0, 1 - (dt - 0.2) / 0.3); out.labels = sm(0.6, 1.0, dt);
  return out;
}

// intro timeline (pure function of t) → pose & lamps
const LAMP_T = [0.3, 0.62, 0.94], LOCK_T = 4.95, UNLOCK_T = 8.6, FREE_T = 10.8;
function lampOn(t, i) { const d = t - LAMP_T[i]; if (d < 0) return 0; const ramp = clamp(d / 0.09, 0, 1); const fl = d < 0.22 ? (Math.sin(d * 140 + i) > 0.2 ? 1 : 0.35) : 1; return ramp * fl; }
const AXS = new THREE.Vector3(+(Q.get('ax') || 0.42), +(Q.get('ay') || 0.78), +(Q.get('az') || 0.46)).normalize(), A0 = +(Q.get('a0') || 2.05);
const qIdent = new THREE.Quaternion();
function introQuat(t) { // The Forge: the sculpture assembles in its true pose; the swarm (not a tumble) hides the figures
  if (t < UNLOCK_T) return qIdent.clone();
  const u = easeOut((t - UNLOCK_T) / (FREE_T - UNLOCK_T)); const s2 = SCR[1]; const k = u * u * (3 - 2 * u); return poseQuat(s2.yaw * k, s2.tilt * k);
}
const qAngle = (q) => 2 * Math.acos(Math.min(1, Math.abs(q.w)));


function update(dt) {
  st.t += dt; const t = st.t;
  let lamp = [1, 1, 1], radius = [0, 0, 0], dark = [0, 0, 0], push = 0, freeze = 0, labels = 0, ang = 0;
  if (st.mode === 'intro') {
    st.introT += dt; if (st.waitWork && st.introT > FG.A0 - 0.05) { st.introT = FG.A0 - 0.05; if (!st.waitHint) { st.waitHint = 1; hint('forging your sculpture…'); } }
    const it = st.introT; lamp = [0, 1, 2].map(i => lampOn(it, i));
    if (SHOT) lamp = lamp.map((v, i) => it > LAMP_T[i] + 0.25 ? 1 : v);
    [0, 1, 2].forEach(i => { const was = st['lamp' + i]; const now = lamp[i] > 0.5; if (now && !was) sound.clunk(i); st['lamp' + i] = now; });
    st.q = introQuat(it); if (it >= UNLOCK_T) { const k = easeOut((it - UNLOCK_T) / (FREE_T - UNLOCK_T)); const kk = k * k * (3 - 2 * k); st.yaw = SCR[1].yaw * kk; st.tilt = SCR[1].tilt * kk; }
    const L = lockFX(it < UNLOCK_T ? it - LOCK_T : -1); if (it >= LOCK_T && !st.lastLockIntro) { st.lastLockIntro = true; sound.hit(); sound.chord(); }
    if (it < FG.END + 0.1 || !st.forgeDone) { forgeIntroPose(it, !SHOT); if (it >= FG.END + 0.1) st.forgeDone = true; }
    else if (it >= UNLOCK_T) scatterPose(scatterAmount(qAngle(st.q)), t);
    labels = it < UNLOCK_T ? L.labels : Math.max(0, 1 - (it - UNLOCK_T) / 0.5); push = it < UNLOCK_T ? L.push : 0.03 * Math.max(0, 1 - (it - UNLOCK_T) / 1.2);
    if (it < LOCK_T) push = -0.07 * Math.pow(1 - it / LOCK_T, 1.6); // wider start (track + lamps), drifting in
    ang = qAngle(st.q); const g = guidance(ang);
    const r0 = it < UNLOCK_T ? FG.STORM_R : g.radius;
    for (let i = 0; i < 3; i++) { radius[i] = r0 + (1.0 - r0) * L.k[i]; dark[i] = 0.975; }
    freeze = L.freeze; if (it < UNLOCK_T) lamp = lamp.map(v => v * (1 + L.flash));
    if (it > FREE_T) { st.mode = 'free'; st.freeStart = t; hint('Drag to turn the sculpture until its shadows become pictures'); }
  } else if (st.mode === 'free' || st.mode === 'forged') {
    if (!st.drag) { st.yaw += st.vy; st.tilt += st.vt; st.vy *= 0.92; st.vt *= 0.92; }
    st.tilt = clamp(st.tilt, -0.7, 0.7);
    ang = poseAngle(st.yaw, st.tilt);
    const since = t - (st.lastLock || st.freeStart);
    const basin = 0.17 + (since > 20 ? Math.min(0.2, (since - 20) / 40 * 0.2) : 0);
    if (!st.drag && ang < basin && !st.locked) { // magnetic snap
      const ty = Math.round(st.yaw / (2 * Math.PI)) * 2 * Math.PI; st.yaw += (ty - st.yaw) * 0.09; st.tilt += (0 - st.tilt) * 0.09; st.vy *= 0.7; st.vt *= 0.7;
    }
    if (!st.locked && ang < 0.012 && !st.drag) { st.locked = true; st.lockAt = t; st.lastLock = t; sound.chord(); hint(''); st.yaw = Math.round(st.yaw / (2 * Math.PI)) * 2 * Math.PI; st.tilt = 0; }
    if (st.locked && ang > 0.05) { st.locked = false; st.lockAt = -1; }
    if (!nest || nest.mode === 'idle') scatterPose(st.locked ? 0 : scatterAmount(ang), t);
    const L = lockFX(st.locked ? t - st.lockAt : -1); const g = guidance(ang);
    for (let i = 0; i < 3; i++) { radius[i] = g.radius + (1.0 - g.radius) * L.k[i]; dark[i] = g.dark + (0.975 - g.dark) * L.k[i]; }
    push = L.push; freeze = L.freeze; labels = L.labels; lamp = lamp.map(v => v * (1 + L.flash));
    sound.update(Math.abs(st.vy) * 60 * 0.05 + Math.abs(st.vt) * 60 * 0.05, ang, st.drag || (t - st.lastMove) < 1.5);
  } else if (st.mode === 'shatter') {
    const e = t - st.shT; if (st.next && !st.shrinkT && e >= SH.DUR - 0.3) st.shrinkT = t;
    shatterPose(e, st.shrinkT ? clamp((t - st.shrinkT) / 0.3, 0, 1) : 0); ang = 0.6; for (let i = 0; i < 3; i++) { radius[i] = FG.STORM_R; dark[i] = 0.975; }
    if (!st.next && e > SH.DUR + 0.4) hint('forging…');
    if (st.shrinkT && t - st.shrinkT >= 0.3) { hint(''); loadWork(st.next); st.next = null; st.mode = 'reforge'; st.rfT = t; st.yaw = 0; st.tilt = 0; st.vy = st.vt = 0; for (const m of nest.meshes) m.data.forEach(d => d.ticked = false); }
  } else if (st.mode === 'reforge') {
    const it = SH.IT0 + (t - st.rfT) * SH.RF; forgeIntroPose(it, !SHOT); ang = 0; for (let i = 0; i < 3; i++) { radius[i] = FG.STORM_R; dark[i] = 0.975; }
    if (it >= FG.END + 0.03) { forgeIntroPose(99, false); st.mode = 'forged'; st.lastLock = t; st.freeStart = t; sound.hit(); }
  } else if (st.mode === 'draw') {
    lamp = [0.62, 0.62, 0.62]; ang = 0; for (let i = 0; i < 3; i++) { radius[i] = 1.5; dark[i] = 0.9; }
  }
  // nest animation
  if (nest && nest.mode !== 'idle') animateNest(t - st.anim);
  if (st.mode === 'intro') pivot.quaternion.copy(st.q);
  else if (st.mode === 'shatter') pivot.quaternion.copy(st.shQ);
  else if (st.mode === 'reforge') pivot.quaternion.identity();
  else { const q = poseQuat(st.yaw, st.tilt); if (st.blendQ) { const k = easeOut((t - st.blendT) / 0.7); q.copy(st.blendQ.clone().slerp(q, k)); if (k >= 1) st.blendQ = null; } pivot.quaternion.copy(q); }
  for (let i = 0; i < 3; i++) { S.lamp[i] = lamp[i] * st.lampMul; S.radius[i] = radius[i]; S.dark[i] = dark[i]; }
  // hero push-in after a reveal; eases back out as soon as the visitor interacts
  if (st.mode === 'intro') heroAmt = sm(LOCK_T + 0.25, LOCK_T + 1.7, st.introT) * (1 - sm(UNLOCK_T - 0.2, UNLOCK_T + 0.9, st.introT));
  else { const tgt = (st.locked && !st.drag && LD.drag < 0 && !LD.homing.some(Boolean) && t - st.lockAt > 0.35) ? 1 : 0; heroAmt += (tgt - heroAmt) * (1 - Math.exp(-dt / (tgt ? 0.55 : 0.3))); if (SHOT && Q.get('pose') === 'solved') heroAmt = 1; }
  updateLamps(dt);
  S.push = push; S.freeze = freeze; S.time = t;
  const drawAmt = st.mode === 'draw' ? 1 : 0; for (const m of wallMats) m.uniforms.drawAmt.value += (drawAmt - m.uniforms.drawAmt.value) * (SHOT ? 1 : 0.15);
  for (const m of labelMeshes) m.material.opacity = labels;
  st.ang = ang;
}

// ---------------- shatter → re-forge (the repeatable verb): rods burst out under gravity, the next curated work forges in
const SH = { DUR: 1.05, RF: 1.0, IT0: 3.3 };
function shatterPose(e, shrink) {
  if (!nest) return; const R = mulberry(901);
  for (const { im, data } of nest.meshes) { for (let i = 0; i < data.length; i++) { const d = data[i];
    const tt = Math.max(0, e - R() * 0.06), u = clamp(tt / 0.55, 0, 1), k = 1 - Math.pow(1 - u, 3);
    cloudAt(d, FG.A1 + e, _sp); _p.lerpVectors(d.pos, _sp, k); _p.y -= 0.9 * Math.sin(Math.PI * u) * 0.5; // burst out with a gravity sag
    _qa.setFromAxisAngle(d.ax, d.spin * 5 * tt); _q.copy(_qa).multiply(d.q);
    const sc = 1 - shrink; _s.copy(d.sc).multiplyScalar(Math.max(1e-4, sc)); _m4.compose(_p, _q, _s); im.setMatrixAt(i, _m4); }
    im.instanceMatrix.needsUpdate = true; }
}
function shatterTo(target) { // target: preset index or a Promise<work> (worker forge); the storm hides the wait
  if (st.mode === 'shatter' || st.mode === 'reforge' || st.mode === 'draw') return false;
  if (st.mode === 'intro') { if (!st.forgeDone) return false; st.mode = 'free'; st.freeStart = st.t; for (const m of labelMeshes) m.material.opacity = 0; scatterPose(0, st.t); } // leave the intro afterglow
  sound.start(); sound.hit(); sound.whoosh(); hint('');
  const p = typeof target === 'number' ? (presetIdx = target, loadPreset(target)) : target;
  st.mode = 'shatter'; st.shT = st.t; st.shrinkT = 0; st.locked = false; st.lockAt = -1; st.next = null; st.blendQ = null;
  st.shQ = poseQuat(st.yaw, st.tilt); p.then(w => { st.next = w; }); return true;
}
window.__shatter = (idx = (presetIdx + 1) % PRESET_LIST.length) => shatterTo(idx);
// ---------------- input
function skipIntro() { // jump to the last moment of the forge: rods snap home, lock hit + labels follow immediately
  if (st.mode !== 'intro' || st.introT >= LOCK_T - 0.15) return;
  st.introT = LOCK_T - 0.15; [0, 1, 2].forEach(i => st['lamp' + i] = true); hint('');
}
addEventListener('keydown', (e) => { if (e.key === 'Escape') { sound.start(); skipIntro(); } });
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let lastX = 0, lastY = 0, drawing = null, downX = 0, downY = 0, downT = 0;
function hitsSculpture(e) { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); rodMeshes.forEach(m => { m.boundingSphere = null; }); return ray.intersectObjects(rodMeshes, false).length > 0; }
canvas.addEventListener('pointerdown', (e) => {
  sound.start(); lastX = e.clientX; lastY = e.clientY; downX = e.clientX; downY = e.clientY; downT = performance.now(); st.lastMove = st.t;
  if (st.mode === 'draw') { const hit = wallHit(e); if (hit) { drawing = hit; strokeTo(hit, true); } return; }
  const li = lampEnabled() ? lampUnderMouse(e) : -1;
  if (st.mode === 'intro' && st.introT < LOCK_T - 0.15) { skipIntro(); return; }
  if (st.mode === 'intro') { // skip ahead: keep lamps on, go free from current pose
    st.mode = 'free'; st.freeStart = st.t; st.locked = false; st.lockAt = -1; for (const m of labelMeshes) m.material.opacity = 0;
    st.blendQ = pivot.quaternion.clone(); st.blendT = st.t; if (qAngle(st.blendQ) < 0.05) { st.yaw = 0; st.tilt = 0; } else { st.yaw = SCR[1].yaw; st.tilt = SCR[1].tilt; } st.vy = st.vt = 0;
  }
  if (li >= 0) { startLampDrag(li, e); return; }
  st.drag = true; canvas.style.cursor = 'grabbing'; hint('');
});
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1;
  if (st.mode === 'draw') { if (drawing) { const hit = wallHit(e, drawing.w); if (hit) strokeTo(hit, false); } return; }
  if (LD.drag >= 0) { moveLampDrag(e); return; }
  if (!st.drag) { setLampHover(lampEnabled() ? lampUnderMouse(e) : -1); return; } const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; st.lastMove = st.t;
  st.vy = dx * 0.0065; st.vt = dy * 0.0045; st.yaw += st.vy; st.tilt = clamp(st.tilt + st.vt, -0.7, 0.7);
});
addEventListener('pointerup', (e) => { if (LD.drag >= 0) { endLampDrag(); return; } if (st.drag && (st.mode === 'free' || st.mode === 'forged') && Math.hypot(e.clientX - downX, e.clientY - downY) < 5 && performance.now() - downT < 350 && hitsSculpture(e)) { st.drag = false; shatterTo((presetIdx + 1) % PRESET_LIST.length); return; }
  st.drag = false; canvas.style.cursor = st.mode === 'draw' ? 'crosshair' : 'grab'; if (drawing) { finishStroke(drawing.w); drawing = null; } });


// ---------------- draggable lamps: slide a lamp along its ceiling track (it stays aimed at the sculpture); the pool slides and the
// shadow reprojects live (no re-forge, only the light / shadow-camera move). On release it springs home with a clunk.
const LHOME = G.walls.map(w => V3(w.lamp));
const LAX = [[new THREE.Vector3(1, 0, 0)], [new THREE.Vector3(0, 0, 1)], [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)]]; // track directions
const LMAX = 2.6;
const LD = { off: LHOME.map(() => new THREE.Vector3()), vel: LHOME.map(() => new THREE.Vector3()), tgt: LHOME.map(() => new THREE.Vector3()), hover: -1, hl: [0, 0, 0], drag: -1, grab: new THREE.Vector3(), start: new THREE.Vector3(), homing: [false, false, false], dirty: [true, true, true] };
const _lp = new THREE.Vector3(), _ld = new THREE.Vector3();
function lampEnabled() { return st.mode === 'free' || st.mode === 'forged' || (st.mode === 'intro' && st.forgeDone); }
function lampUnderMouse(e) { // cheap: ray distance to each lamp head
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); let best = -1, bd = 0.62;
  for (let i = 0; i < 3; i++) { const d = ray.ray.distanceToPoint(fixtures[i].g.position); if (d < bd) { bd = d; best = i; } } return best;
}
function trackPoint(i, e, out) { // where the mouse ray meets the lamp's track (closest point to the ray / the track plane for the overhead lamp)
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const o = ray.ray.origin, d = ray.ray.direction;
  const P0 = LHOME[i];
  if (LAX[i].length === 2) { const tt = (P0.y - o.y) / (Math.abs(d.y) > 1e-4 ? d.y : 1e-4); return out.copy(o).addScaledVector(d, Math.max(0, tt)).sub(P0); }
  const u = LAX[i][0], w0 = o.clone().sub(P0); const b = u.dot(d), dd = u.dot(w0), ee = d.dot(w0); const den = 1 - b * b; const sc = den > 1e-5 ? (dd - b * ee) / den : 0;
  return out.copy(u).multiplyScalar(sc);
}
function constrainLamp(i, v) { // each pool already nearly touches its room corner, so travel is mostly toward open wall / floor
  if (LAX[i].length === 2) { if (Math.abs(v.x) > Math.abs(v.z)) v.z = 0; else v.x = 0; }
  const soft = (c) => { const lo = -LMAX, hi = 0.3, k = 0.35; if (c > hi - k) return hi - k + k * Math.tanh((c - hi + k) / k); if (c < lo + k) return lo + k - k * Math.tanh((lo + k - c) / k); return c; };
  v.x = soft(v.x); v.z = soft(v.z); v.y = 0; return v;
}
function startLampDrag(i, e) { LD.drag = i; LD.homing[i] = false; trackPoint(i, e, LD.grab); LD.start.copy(LD.off[i]); LD.tgt[i].copy(LD.off[i]); st.drag = false; canvas.style.cursor = 'grabbing'; hint(''); st.lastMove = st.t; }
function moveLampDrag(e) { const i = LD.drag; const p = trackPoint(i, e, new THREE.Vector3()); LD.tgt[i].copy(LD.start).add(p.sub(LD.grab)); constrainLamp(i, LD.tgt[i]); st.lastMove = st.t; }
function endLampDrag() { const i = LD.drag; LD.drag = -1; LD.homing[i] = true; LD.vel[i].set(0, 0, 0); LD.tgt[i].set(0, 0, 0); canvas.style.cursor = 'grab'; }
function setLampHover(i) { if (LD.hover === i) return; LD.hover = i; if (st.mode !== 'draw' && LD.drag < 0) canvas.style.cursor = 'grab'; if (i >= 0 && !st.lampHinted) { st.lampHinted = 1; hint('Drag a lamp along its track'); setTimeout(() => hint(''), 2600); } }
window.__lamps = () => ({ screen: fixtures.map(f => { const v = f.g.position.clone().project(camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; }), off: LD.off.map(o => o.toArray().map(x => +x.toFixed(3))), hover: LD.hover, hl: LD.hl.map(x => +x.toFixed(2)), drag: LD.drag, homing: LD.homing.slice(), cursor: canvas.style.cursor, mode: st.mode, hero: +heroAmt.toFixed(2) });
if (Q.get('lamp')) { const [i, x, y, z] = Q.get('lamp').split(',').map(Number); LD.off[i].set(x, y || 0, z || 0); } // shot mode: a displaced lamp
if (Q.get('hover')) { const i = +Q.get('hover'); LD.hover = i; LD.hl[i] = 1; }
function updateLamps(dt) {
  dt = Math.min(dt, 1 / 20);
  for (let i = 0; i < 3; i++) {
    const off = LD.off[i], vel = LD.vel[i]; const before = off.clone();
    if (LD.drag === i) { off.lerp(LD.tgt[i], 1 - Math.exp(-dt / 0.06)); vel.set(0, 0, 0); }
    else if (LD.homing[i]) { // underdamped spring home (a little overshoot), clunk when it seats
      const k = 70, c = 2 * 0.32 * Math.sqrt(k); const prevDot = off.dot(LD.tgt[i].set(0, 0, 0)); void prevDot;
      const pre = off.clone(); vel.addScaledVector(off, -k * dt).multiplyScalar(Math.max(0, 1 - c * dt)); off.addScaledVector(vel, dt);
      if (!LD.seated && pre.lengthSq() > 1e-4 && pre.dot(off) <= 0) { sound.clunk(i); LD.seated = true; LD.wob = 1; }
      if (off.length() < 0.002 && vel.length() < 0.01) { off.set(0, 0, 0); vel.set(0, 0, 0); LD.homing[i] = false; if (!LD.seated) sound.clunk(i); LD.seated = false; }
    }
    // hover / drag highlight
    const h = (LD.drag === i ? 1 : LD.hover === i && lampEnabled() ? 0.7 : 0); LD.hl[i] += (h - LD.hl[i]) * (1 - Math.exp(-dt / 0.12));
    fixtures[i].mat.emissive.copy(LAMP_COL[i]).multiplyScalar(0.035 * LD.hl[i]); fixtures[i].lipMat.emissive.copy(LAMP_COL[i]).multiplyScalar(0.35 * LD.hl[i]);
    if (before.distanceToSquared(off) > 1e-10 || LD.dirty[i]) { LD.dirty[i] = false; placeLamp(i); }
  }
}
function placeLamp(i) {
  _lp.copy(LHOME[i]).add(LD.off[i]); const f = fixtures[i];
  lamps[i].position.copy(_lp); lamps[i].updateMatrixWorld();
  f.g.position.copy(_lp); f.g.lookAt(CEN); f.drop.position.x = _lp.x; f.drop.position.z = _lp.z; f.carriage.position.x = _lp.x; f.carriage.position.z = _lp.z;
  _ld.copy(CEN).sub(_lp); const dist = _ld.length(); _ld.normalize();
  const sc = lamps[i].shadow.camera; sc.near = Math.max(0.5, dist - 2.0); sc.far = dist * (G.L + G.d) / G.L + 2.5; sc.updateProjectionMatrix();
  const u = wallMats[i].uniforms; u.lampPos.value.copy(_lp); u.lampDir.value.copy(_ld);
  hazeMat.uniforms.lp.value[i].copy(_lp); hazeMat.uniforms.ld.value[i].copy(_ld); moteMat.uniforms.lp.value[i].copy(_lp); moteMat.uniforms.ld.value[i].copy(_ld);
  const a = G.walls[i].axis; const tt = _lp.getComponent(a) / (_lp.getComponent(a) - CEN.getComponent(a)); const pc = _lp.clone().lerp(CEN, tt); // the pool centre (feeds the fake bounce)
  for (const m of [...wallMats, ceilMat]) m.uniforms.pc.value[i].copy(pc);
}

// ---------------- drawing your own shadows
const drawCanvases = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = c.height = MR; return c; });
const fillCanvases = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = c.height = MR; return c; });
const drawTex = fillCanvases.map(c => { const t = new THREE.CanvasTexture(c); return t; });
wallMats.forEach((m, i) => m.uniforms.drawTex.value = drawTex[i]);
const lastPt = [null, null, null];
function wallHit(e, only) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(only !== undefined ? [WALLS[only]] : WALLS, false); if (!hits.length) return null;
  const w = WALLS.indexOf(hits[0].object), p = hits[0].point, wall = G.walls[w];
  const q = [p.x - wall.o[0], p.y - wall.o[1], p.z - wall.o[2]]; const u = (q[0] * wall.u[0] + q[1] * wall.u[1] + q[2] * wall.u[2]) / G.M + 0.5, v = (q[0] * wall.v[0] + q[1] * wall.v[1] + q[2] * wall.v[2]) / G.M + 0.5;
  if (u < 0.03 || u > 0.97 || v < 0.03 || v > 0.97) return null; return { w, x: u * MR, y: (1 - v) * MR };
}
function strokeTo(h, start) { const g = drawCanvases[h.w].getContext('2d'); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = g.lineJoin = 'round'; g.lineWidth = MR * 0.028;
  const lp = lastPt[h.w]; g.beginPath(); if (start || !lp) { g.arc(h.x, h.y, g.lineWidth / 2, 0, 7); g.fill(); } else { g.moveTo(lp[0], lp[1]); g.lineTo(h.x, h.y); g.stroke(); }
  lastPt[h.w] = start ? [h.x, h.y] : [h.x, h.y]; if (start) lastPt[h.w] = [h.x, h.y]; refreshFill(h.w, false); }
function finishStroke(w) { lastPt[w] = null; refreshFill(w, true); }
function refreshFill(w, doFill) {
  const src = drawCanvases[w], dst = fillCanvases[w], g = dst.getContext('2d'); g.clearRect(0, 0, MR, MR); g.drawImage(src, 0, 0);
  if (doFill) { // flood-fill the outside; whatever stays enclosed becomes solid
    const d = src.getContext('2d').getImageData(0, 0, MR, MR).data, out = new Uint8Array(MR * MR), stack = [];
    for (let i = 0; i < MR; i++) stack.push(i, (MR - 1) * MR + i, i * MR, i * MR + MR - 1);
    while (stack.length) { const k = stack.pop(); if (out[k] || d[k * 4 + 3] > 60) continue; out[k] = 1; const x = k % MR, y = (k / MR) | 0; if (x > 0) stack.push(k - 1); if (x < MR - 1) stack.push(k + 1); if (y > 0) stack.push(k - MR); if (y < MR - 1) stack.push(k + MR); }
    const id = g.getImageData(0, 0, MR, MR); for (let k = 0; k < MR * MR; k++) if (!out[k]) { id.data[k * 4] = id.data[k * 4 + 1] = id.data[k * 4 + 2] = 255; id.data[k * 4 + 3] = 255; } g.putImageData(id, 0, 0);
  }
  drawTex[w].needsUpdate = true; const ok = fillCanvases.every(c => { const d = c.getContext('2d').getImageData(0, 0, MR, MR).data; let n = 0; for (let k = 3; k < d.length; k += 16) n += d[k] > 127; return n > 40; });
  $('bForge').disabled = !ok;
}
function enterDraw() { st.mode = 'draw'; st.locked = false; nest.mode = 'out'; st.anim = st.t; sound.whoosh(); hint(''); $('drawbar').classList.remove('hidden'); $('actions').classList.add('hidden'); canvas.style.cursor = 'crosshair'; for (const m of labelMeshes) m.material.opacity = 0; }
function exitDraw() { $('drawbar').classList.add('hidden'); $('actions').classList.remove('hidden'); canvas.style.cursor = 'grab'; }
$('bDraw').onclick = (e) => { e.stopPropagation(); sound.start(); enterDraw(); };
$('bClear').onclick = () => { for (let i = 0; i < 3; i++) { drawCanvases[i].getContext('2d').clearRect(0, 0, MR, MR); refreshFill(i, true); } };
$('bCancel').onclick = () => { exitDraw(); st.mode = 'free'; nest.mode = 'in'; nest.meshes.forEach(m => m.data.forEach(d => d.landed = false)); st.anim = st.t; st.yaw = 0; st.tilt = 0; st.lastLock = st.t; };
$('bForge').onclick = () => forgeDrawings();
let userNo = 0, forgeWorker = null;
function getWorker() { if (forgeWorker !== null) return forgeWorker; try { forgeWorker = Q.has('noworker') ? false : new Worker(new URL('./forge-worker.js', import.meta.url), { type: 'module' }); } catch (e) { forgeWorker = false; } return forgeWorker; }
function forgeDrawings(draws, titles) {
  $('forging').textContent = 'forging…'; $('forging').classList.remove('hidden'); const t0 = performance.now();
  const srcs = draws ? draws.map(d => { const c = document.createElement('canvas'); c.width = c.height = 1000; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; d(g); return c; }) : fillCanvases;
  const scale = draws ? 1 : 1000 / MR; userNo++; const no = `${PRESET_LIST.length + userNo}`; const tl = titles || ['影 Yours', '影 Yours', '影 Yours'];
  let resLong, resDone; const longP = new Promise(r => resLong = r), doneP = new Promise(r => resDone = r);
  const startFly = (rods) => { exitDraw(); nest = prepNest({ rods }); nest.mode = 'in'; st.anim = st.t; st.mode = 'forged'; st.yaw = 0; st.tilt = 0; st.locked = false; st.lastLock = st.t; for (const m of labelMeshes) m.material.opacity = 0; sound.whoosh(); $('forging').textContent = 'placing rods…'; };
  const finish = (m) => {
    const w = { rods: m.rods, T: m.T, fidHull: m.fidHull, fidRods: m.fidRods, counts: m.counts, titles: tl, no, ms: performance.now() - t0 };
    const drawsW = srcs.map(c => (g) => g.drawImage(c, 0, 0, 1000 / scale * scale, 1000));
    Object.defineProperty(w, 'orig', { get() { return this._o || (this._o = drawsW.map((d, i) => maskFromDrawT(d, m.T[i]))); } });
    const prev = nest && nest.byRod; work = w; current = w; nest = prepNest({ rods: w.rods }, prev, st.t - st.anim + 0.05); if (!prev) { nest.mode = 'in'; st.anim = st.t; st.mode = 'forged'; exitDraw(); }
    setLabels(tl, no); setPlacard(no, tl, w.rods.length, w.fidRods);
    window.__forge = { current: w, fidRaw: w.fidHull, fidRep: w.fidRods };
    window.__lastForge = { msFirstRods: Math.round(m.msLong || 0), msDone: Math.round(w.ms), workerMs: Math.round(m.ms), stages: m.stages, rods: w.rods.length, counts: w.counts, fidHull: w.fidHull.map(x => +(100 * x).toFixed(2)), fidRods: w.fidRods.map(x => +(100 * x).toFixed(2)) };
    console.log(`forged drawing: rods ${w.rods.length}, rod coverage ${w.fidRods.map(x => (100 * x).toFixed(1)).join('/')}, first rods ${Math.round(m.msLong || 0)} ms, done ${Math.round(w.ms)} ms`);
    $('forging').classList.add('hidden');
    if (!SHOT) setTimeout(() => { st.locked = true; st.lockAt = st.t; sound.chord(); }, 1600);
    resDone(w);
  };
  Promise.all(srcs.map(c => createImageBitmap(c))).then(bitmaps => {
    const Wk = getWorker();
    if (!Wk) { setTimeout(() => { const D = bitmaps.map(b => (g) => g.drawImage(b, 0, 0, 1000, 1000)); const w = forgeFrom(D, { evals: 60, seed: 21 + userNo }); finish({ rods: w.rods, T: w.T, fidHull: w.fidHull, fidRods: w.fidRods, counts: w.counts, ms: w.ms }); resLong(); }, 30); return; }
    let msLong = 0;
    Wk.onmessage = (e) => { const m = e.data; if (m.type === 'long') { msLong = performance.now() - t0; startFly(m.rods); resLong(); } else if (m.type === 'done') { m.msLong = msLong; finish(m); } };
    Wk.postMessage({ bitmaps, evals: 60, seed: 21 + userNo }, bitmaps);
  });
  return { longP, doneP };
}
// ---------------- type three letters → forge (worker), share link #w=ABC
let wordNo = 0;
function forgeWordWork(word) {
  const P = PRESET_LIST.findIndex(p => p.word === word); if (P >= 0) return { idx: P };
  const letters = [...word]; const srcs = letters.map(c => { const cv = document.createElement('canvas'); cv.width = cv.height = 1000; const g = cv.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; letterFig(c)(g); return cv; });
  const t0 = performance.now(); wordNo++; const no = PRESET_LIST.length + userNo + wordNo;
  const prom = Promise.all(srcs.map(c => createImageBitmap(c))).then(bitmaps => new Promise((resolve) => {
    const done = (m, perm) => { const order = perm || [0, 1, 2]; const tl = order.map(i => `字 ${letters[i]}`);
      const w = { rods: m.rods, T: m.T, fidHull: m.fidHull, fidRods: m.fidRods, counts: m.counts, titles: tl, no, word, ms: performance.now() - t0, perm: order };
      Object.defineProperty(w, 'orig', { get() { return this._o || (this._o = order.map((i, k) => maskFromDrawT(letterFig(letters[i]), m.T[k]))); } });
      window.__lastWord = { word, perm: order.map(i => letters[i]).join(''), ms: Math.round(w.ms), rods: w.rods.length, fidHull: w.fidHull.map(x => +(100 * x).toFixed(1)), fidRods: w.fidRods.map(x => +(100 * x).toFixed(1)) };
      console.log(`forged word ${word} (walls ${window.__lastWord.perm}): rods ${w.rods.length}, rod coverage ${window.__lastWord.fidRods.join('/')}, ${Math.round(w.ms)} ms`); resolve(w); };
    const Wk = getWorker();
    if (!Wk) { setTimeout(() => { const w = forgeFrom(letters.map(c => letterFig(c)), { evals: 60, seed: 21, lim: LETTER_LIM }); done(w, null); }, 30); return; }
    Wk.onmessage = (e) => { const m = e.data; if (m.type === 'done') done(m, m.perm); };
    Wk.postMessage({ bitmaps, evals: 60, seed: 31, lim: LETTER_LIM, perm: true }, bitmaps);
  }));
  return { prom };
}
function forgeWord(word) { const r = forgeWordWork(word); return shatterTo(r.prom || r.idx); }
const wordState = { s: '', timer: 0 };
const wsCanv = [...document.querySelectorAll('#wslots canvas')]; wsCanv.forEach(c => { c.width = c.height = 64; });
function drawSlots() { wsCanv.forEach((c, i) => { const g = c.getContext('2d'); g.clearRect(0, 0, 64, 64); const ch = wordState.s[i];
  g.strokeStyle = 'rgba(236,226,208,0.35)'; g.lineWidth = 1.5; g.strokeRect(1, 1, 62, 62);
  if (ch) { g.save(); g.scale(0.064, 0.064); g.fillStyle = g.strokeStyle = 'rgba(236,226,208,0.95)'; letterFig(ch)(g); g.restore(); } });
  $('word').classList.toggle('typing', wordState.s.length > 0); }
function submitWord() { clearTimeout(wordState.timer); if (wordState.s.length !== 3) return; const wd = wordState.s;
  if (forgeWord(wd)) { setTimeout(() => { wordState.s = ''; drawSlots(); }, 900); } }
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || st.mode === 'draw') return;
  if (st.mode === 'intro' && !st.forgeDone) return; if (st.mode === 'shatter' || st.mode === 'reforge') return;
  if (/^[a-zA-Z]$/.test(e.key)) { if (wordState.s.length >= 3) wordState.s = ''; wordState.s += e.key.toUpperCase(); drawSlots(); clearTimeout(wordState.timer); if (wordState.s.length === 3) wordState.timer = setTimeout(submitWord, 1100); sound.start(); }
  else if (e.key === 'Backspace') { wordState.s = wordState.s.slice(0, -1); clearTimeout(wordState.timer); drawSlots(); }
  else if (e.key === 'Enter') submitWord();
  else if (e.key === 'Escape' && wordState.s) { wordState.s = ''; clearTimeout(wordState.timer); drawSlots(); }
});
$('bCopy').onclick = async (e) => { e.stopPropagation(); if (!work || !work.word) return; const url = location.origin + location.pathname + '#w=' + work.word;
  try { await navigator.clipboard.writeText(url); hint('Link copied: ' + url.replace(/^https?:\/\//, '')); } catch (err) { hint(url); } setTimeout(() => hint(''), 4000); };
window.__forgeWord = forgeWord;
window.__wordTable = async (words) => { const out = []; for (const wd of words) { const r = forgeWordWork(wd); if (r.prom) { await r.prom; out.push(window.__lastWord); } } return out; };
$('bNext').onclick = (e) => { e.stopPropagation(); shatterTo((presetIdx + 1) % PRESET_LIST.length); };

// ---------------- main loop (deterministic in ?shot mode)
let frame = 0, last = performance.now();
const SHOT_T = +(Q.get('t') || 6.0);
const TEST_TITLES = { heart: '心 Heart', star: '星 Star', letterA: '字 A', tree: '樹 Tree', swallow: '燕 Swallow', catFront: '貓 Cat', key: '鑰 Key', hand: '手 Hand', butterfly: '蝶 Butterfly' };
const HASHW = (/^#w=([A-Za-z]{3})$/.exec(decodeURIComponent(location.hash || '')) || [])[1]?.toUpperCase() || null;
async function boot() {
  let w0 = null;
  if (HASHW) { const r = forgeWordWork(HASHW); if (r.prom) { st.waitWork = true; r.prom.then(w => { loadWork(w); st.waitWork = false; hint(''); }); if (SHOT) { await fontsReady; await r.prom; } else await fontsReady; } else presetIdx = r.idx; }
  if (!st.waitWork && !(HASHW && SHOT && work)) { [, w0] = await Promise.all([fontsReady, loadPreset(presetIdx)]); loadWork(w0); }
  if (SHOT) {
    const pose = Q.get('pose');
    if (pose) { // free-mode still: pose=scramble|solved|<k 0..1 toward scramble>
      st.mode = 'free'; st.freeStart = -100; const k = pose === 'solved' ? 0 : pose === 'scramble' ? 1 : +pose; st.yaw = SCR[1].yaw * k; st.tilt = SCR[1].tilt * k; st.lastLock = -100;
      if (k === 0) { st.locked = true; st.lockAt = -10; }
      update(0); st.t = 10; if (k === 0) st.lockAt = 0;
    } else if (Q.get('forgeTest')) {
      const names = Q.get('forgeTest').split(','); const F = forgeDrawings(names.map(n => FIGURES[n]), names.map(n => TEST_TITLES[n] || '影 Yours'));
      const ft = +(Q.get('ft') || 3);
      if (Q.get('phase') === 'long') { await F.longP; st.anim = st.t - ft; } else { await F.doneP; st.mode = 'forged'; st.anim = st.t - ft; st.locked = ft > 1.6; st.lockAt = st.t - (ft - 1.6); }
    } else if (Q.get('drawDemo')) {
      enterDraw(); st.anim = st.t - 5; ['heart', 'star', 'letterA'].forEach((n, w) => { const g = drawCanvases[w].getContext('2d'); g.save(); g.scale(MR / 1000, MR / 1000); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
        if (w === 2) { g.lineWidth = 26; g.lineJoin = 'round'; const c2 = document.createElement('canvas'); c2.width = c2.height = 1000; const gg = c2.getContext('2d'); gg.fillStyle = '#fff'; FIGURES[n](gg); g.restore(); g.save(); g.scale(MR / 1000, MR / 1000); g.drawImage(c2, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(c2, 0, 0); g.globalCompositeOperation = 'source-over'; FIGURES[n](g); }
        else FIGURES[n](g); g.restore(); refreshFill(w, true); });
      for (const m of wallMats) m.uniforms.drawAmt.value = 1; st.t += 5;
    } else if (Q.get('shatter')) { // still of the shatter → re-forge at <sec> after the click
      st.mode = 'free'; st.freeStart = -100; st.lastLock = -100; update(0); const e = +Q.get('shatter'); st.t = 20; const QW = Q.get('word'); const r = QW ? forgeWordWork(QW.toUpperCase()) : null;
      shatterTo(r ? (r.prom || r.idx) : (presetIdx + 1) % PRESET_LIST.length);
      const w = r && r.prom ? await r.prom : await loadPreset(presetIdx); st.next = w; if (e < SH.DUR) st.shT = st.t - e + 1 / 60; else { st.shT = st.t - SH.DUR; st.shrinkT = st.t - 0.31; update(1 / 60); st.rfT = st.t - (e - SH.DUR) + 1 / 60; }
    } else { st.introT = SHOT_T - 1 / 60; st.t = SHOT_T; [0, 1, 2].forEach(i => st['lamp' + i] = true); st.lastLockIntro = SHOT_T >= LOCK_T; }
  }
  requestAnimationFrame(tick);
}
function tick(now) {
  frame++; const dt = SHOT ? 1 / 60 : Math.min(0.05, (now - last) / 1000); last = now;
  if (SHOT && Q.get('pose')) { update(0); } else update(dt);
  render();
  if (SHOT && frame >= 3) { window.__ready = true; return; }
  requestAnimationFrame(tick);
}
boot();
window.__S = S; window.__st = st; window.__render = render;

// ---------------- test hooks
window.__t3points = () => {
  const out = [];
  for (let w = 0; w < 3; w++) {
    const s = sdfOf(work.orig[w]); const shadow = [], lit = [];
    for (let k = 0; k < 8000; k++) {
      const px = Math.random() * MR, py = Math.random() * MR; const v = s[(py | 0) * MR + (px | 0)];
      const wp = new THREE.Vector3(...maskToWorld(G.walls[w], px, py)); const dc = Math.hypot(px - MR / 2, py - MR / 2) / (MR / 2);
      const sp = wp.clone().project(camera); const sx = (sp.x * 0.5 + 0.5) * innerWidth, sy = (1 - (sp.y * 0.5 + 0.5)) * innerHeight;
      if (v < -5 && shadow.length < 400) shadow.push([sx, sy]); else if (v > 10 && v < 28 && dc < 0.85 && lit.length < 400) lit.push([sx, sy]);
    }
    out.push({ wall: G.walls[w].name, shadow, lit });
  }
  return out;
};
window.__scrambleSearch = () => { const t0 = performance.now(); const r = scrambleSearch(work.rods, work.orig); return { ms: performance.now() - t0, best: r.slice(0, 8).map(x => ({ yaw: +x.yaw.toFixed(3), tilt: x.tilt, max: +x.max.toFixed(3), iou: x.iou.map(v => +v.toFixed(3)) })) }; };
window.__iouAt = (yaw, tilt) => { const targets = work.orig.map(m => downMask(m)); const q = poseQuat(yaw, tilt); const pm = projectRodsPosed(work.rods, [q.x, q.y, q.z, q.w]); return pm.map(m => +maxIoU(m, targets).toFixed(3)); };
window.__naiveSolve = (start = SCR[1]) => { // follows only the visible guidance signal (penumbra radius); 4 drags per simulated second
  let yaw = start.yaw, tilt = start.tilt, step = 0.5, tsim = 0; const sig = (y, t) => guidance(poseAngle(y, t)).radius;
  for (let it = 0; it < 2000; it++) {
    const cur = sig(yaw, tilt); if (poseAngle(yaw, tilt) < 0.17) { return { solved: true, seconds: +(tsim + 1.0).toFixed(2), drags: it }; } // magnetic basin finishes it (~1 s)
    let best = null; for (const [dy, dt] of [[step, 0], [-step, 0], [0, step * 0.6], [0, -step * 0.6]]) { const t2 = clamp(tilt + dt, -0.7, 0.7); const v = sig(yaw + dy, t2); if (v < cur - 1e-4 && (!best || v < best.v)) best = { v, y: yaw + dy, t: t2 }; }
    tsim += 0.25; if (best) { yaw = best.y; tilt = best.t; } else step *= 0.6; if (step < 0.01) step = 0.5;
  }
  return { solved: false, seconds: tsim };
};

window.__scrSheet = (cands) => { // contact sheet of projected rod shadows for candidate scramble poses
  const R = 96, c = document.createElement('canvas'); c.width = R * 3 + 20; c.height = (R + 6) * cands.length; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  cands.forEach(([y, t], j) => { const q = poseQuat(y, t); const pm = projectRodsPosed(work.rods, [q.x, q.y, q.z, q.w]); pm.forEach((m, w) => { const id = g.createImageData(R, R); for (let k = 0; k < R * R; k++) { const v = m[k] ? 20 : 235; id.data[k * 4] = id.data[k * 4 + 1] = id.data[k * 4 + 2] = v; id.data[k * 4 + 3] = 255; } g.putImageData(id, w * (R + 10), j * (R + 6)); }); });
  return c.toDataURL();
};

window.__benchWords = (words, o = {}) => words.map(wd => { const w = forgeFrom([...wd].map(c => FIGURES['L_' + c]), { evals: 60, seed: 21, lim: LETTER_LIM, ...o });
  const r = (a) => a.map(x => +(100 * x).toFixed(1)); return { word: wd, rods: w.rods.length, ms: Math.round(w.ms), hull: r(w.fidHull), cov: r(w.fidRods), min: +(100 * Math.min(...w.fidRods)).toFixed(1), T: w.T.map(t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +v.toFixed(4)]))) }; });
window.__bench = (names, o = {}) => { const w = names ? forgeFrom(names.map(n => FIGURES[n]), { evals: 60, seed: 21, ...o }) : forgeFrom(PRESET_LIST[presetIdx].figs.map(f => FIGURES[f]), { T: PRESET_LIST[presetIdx].T, seed: 11, ...o });
  const r = (a) => a.map(x => +(100 * x).toFixed(2)); return { ms: Math.round(w.ms), times: JSON.parse(JSON.stringify(w.times, (k, v) => typeof v === 'number' ? Math.round(v) : v)), counts: w.counts, rods: w.rods.length, hull: r(w.fidHull), cov: r(w.fidRods) }; };

window.__diag = () => { const w0 = work; const hull = new Hull(w0.masks); const cov = rasterRodsSW(w0.rods); const out = [];
  for (let w = 0; w < 3; w++) { const c = { target: 0, unc: 0, noHull: 0, thin: 0, ok: 0, ownOut: 0, edge2: 0 }; const sd = hull.sdfs[w];
    for (let k = 0; k < MR * MR; k++) { if (!w0.orig[w][k]) continue; c.target++; if (cov[w][k]) continue; c.unc++; const x = (k % MR) + 0.5, y = ((k / MR) | 0) + 0.5;
      if (sd[k] > -0.2) c.ownOut++; if (sd[k] > -2.5) c.edge2++;
      const b = rayPoint(hull, w, x, y, 0, true); if (b < 0) c.noHull++; else if (b < 0.0033) c.thin++; else c.ok++; }
    out.push(c); } return out; };
window.__diagImg = () => { const w0 = work; const hull = new Hull(w0.masks); const cov = rasterRodsSW(w0.rods); const c = document.createElement('canvas'); c.width = MR * 3; c.height = MR; const g = c.getContext('2d'); const id = g.createImageData(MR * 3, MR);
  for (let w = 0; w < 3; w++) for (let k = 0; k < MR * MR; k++) { const x = k % MR, y = (k / MR) | 0, o = (y * MR * 3 + w * MR + x) * 4; let col = [255, 255, 255];
    if (w0.masks[w][k] && !w0.orig[w][k]) col = [160, 200, 255]; if (w0.orig[w][k]) col = cov[w][k] ? [70, 70, 70] : (rayPoint(hull, w, x + .5, y + .5, 0, true) < 0 ? [255, 0, 0] : [255, 170, 0]);
    if (!w0.orig[w][k] && cov[w][k]) col = [0, 160, 0]; id.data[o] = col[0]; id.data[o + 1] = col[1]; id.data[o + 2] = col[2]; id.data[o + 3] = 255; }
  g.putImageData(id, 0, 0); return c.toDataURL(); };
window.__refit = (evals = 160, pi = presetIdx, fine = true, step = 2, init) => { const P = PRESET_LIST[pi]; const t0 = performance.now(); const before = quickFidelity(P.figs.map((n, i) => maskFromDrawT(FIGURES[n], P.T[i])), 2); const f = fitFigures(P.figs.map(n => FIGURES[n]), { evals, init: init || P.T, seed: 5, step, fine, lim: window.__LIM || { sx: [0.5, 1.12], sy: [0.5, 1.12], tx: [-0.14, 0.14], ty: [-0.14, 0.14], r: [-0.4, 0.4] } });
  return { before, ms: performance.now() - t0, T: f.T.map(t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +v.toFixed(4)]))), fid: f.fid }; };
