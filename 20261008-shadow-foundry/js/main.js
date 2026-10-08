import * as THREE from 'three';
import { FIGURES, PRESETS } from './figures.js';
import { G, MR, maskFromDraw, maskFromDrawT, maskFromCanvas, repairTight, fitFigures, forgeRods, Hull, coverageFromHull, fidelity, maskToWorld, sdf as sdfOf, projectRodsPosed, downMask, maxIoU } from './forge.js';
import { Sound } from './audio.js';
import { WALL_VS, WALL_FS, HAZE_FS, COMP_FS, QUAD_VS } from './shaders.js';

const Q = new URLSearchParams(location.search);
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
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 80);
const CAMDIR = new THREE.Vector3(1, 0.8, 1).normalize();
const CAMDIST = +(Q.get('cd') || 16.8);
const LOOK = new THREE.Vector3(2.2, 2.3, 2.2);
function placeCamera(px = 0, py = 0, push = 0) {
  const dir = CAMDIR.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), px * 0.035).applyAxisAngle(new THREE.Vector3(1, 0, -1).normalize(), -py * 0.03);
  camera.position.copy(LOOK).addScaledVector(dir, CAMDIST * (1 - push)); camera.lookAt(LOOK);
}
placeCamera();

// ---------------- environment for brass reflections (dark room + 3 lamp-coloured softboxes)
const LAMP_COL = [new THREE.Color(1.0, 0.80, 0.58), new THREE.Color(0.80, 0.88, 1.0), new THREE.Color(1.0, 0.92, 0.80)];
{
  const es = new THREE.Scene(); es.background = new THREE.Color(0x0a0908);
  const box = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x15120f, side: THREE.BackSide })); es.add(box);
  G.walls.forEach((w, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ color: LAMP_COL[i].clone().multiplyScalar(6), side: THREE.DoubleSide })); const d = V3(w.lamp).sub(CEN).normalize(); p.position.copy(d.clone().multiplyScalar(9)); p.lookAt(0, 0, 0); es.add(p); });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x3a2f24 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -6; es.add(fl);
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
  l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.012;
  l.shadow.camera.near = G.L - 2.0; l.shadow.camera.far = G.L + G.d + 1; l.map = cookieTex;
  scene.add(l); return l;
});
const rim = new THREE.DirectionalLight(0xbcd0ff, 0.0); rim.position.set(-3, 9, -3).add(CEN); rim.target.position.copy(CEN); scene.add(rim, rim.target);

// lamp housings (visible fixtures)
const housingMat = new THREE.MeshStandardMaterial({ color: 0x141312, metalness: 0.6, roughness: 0.45, envMap: ENV });
const lensMats = [];
function lampFixture(i) {
  const w = G.walls[i], g = new THREE.Group(); g.position.copy(V3(w.lamp)); g.lookAt(CEN);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 0.8, 32, 1, true), housingMat); body.rotation.x = Math.PI / 2; body.position.z = -0.15; g.add(body);
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), housingMat); back.position.z = -0.55; back.rotation.y = Math.PI; g.add(back);
  for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.018, 8, 40), housingMat); r.position.z = -0.45 + k * 0.08; g.add(r); }
  const lm = new THREE.MeshBasicMaterial({ color: LAMP_COL[i].clone().multiplyScalar(0) }); lensMats.push(lm);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.27, 32), lm); lens.position.z = 0.26; g.add(lens);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.025, 8, 40), new THREE.MeshStandardMaterial({ color: 0x8a6a40, metalness: 1, roughness: 0.35, envMap: ENV })); lip.position.z = 0.25; g.add(lip);
  // yoke
  const yk = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.022, 8, 32, Math.PI), housingMat); yk.rotation.z = Math.PI; yk.rotation.y = Math.PI / 2; g.add(yk);
  scene.add(g);
  const steel = housingMat;
  if (i < 2) { // floor stand
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, w.lamp[1] - 0.44, 12), steel); pole.position.set(w.lamp[0], (w.lamp[1] - 0.44) / 2, w.lamp[2]); scene.add(pole);
    for (let k = 0; k < 3; k++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.9, 8), steel); const a = k * 2.094 + 0.4; leg.position.set(w.lamp[0] + Math.cos(a) * 0.32, 0.22, w.lamp[2] + Math.sin(a) * 0.32); leg.lookAt(w.lamp[0] + Math.cos(a) * 0.7, 0, w.lamp[2] + Math.sin(a) * 0.7); leg.rotateX(Math.PI / 2); scene.add(leg); }
  } else { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8, 12), steel); rod.position.set(w.lamp[0], w.lamp[1] + 4.4, w.lamp[2]); scene.add(rod); }
}
[0, 1, 2].forEach(lampFixture);

// ---------------- walls (custom isolated lighting)
const wallMats = [];
function wall(i, geo, pos, rot, N, axis) {
  const m = new THREE.ShaderMaterial({ vertexShader: WALL_VS, fragmentShader: WALL_FS, uniforms: {
    lampPos: { value: V3(G.walls[i].lamp) }, lampDir: { value: CEN.clone().sub(V3(G.walls[i].lamp)).normalize() }, lampColor: { value: LAMP_COL[i] }, lampInt: { value: 0 },
    cosOuter: { value: Math.cos(ANG) }, cosInner: { value: Math.cos(ANG * 0.82) }, shadowMap: { value: null }, cookie: { value: cookieTex }, drawTex: { value: null },
    shadowMatrix: { value: new THREE.Matrix4() }, radius: { value: 2 }, darkness: { value: 0.95 }, drawAmt: { value: 0 }, workLight: { value: 0 }, time: { value: 0 },
    N: { value: N }, axis: { value: axis }, bounce: { value: new THREE.Vector3() }, mo: { value: V3(G.walls[i].o) }, mu: { value: V3(G.walls[i].u) }, mv: { value: V3(G.walls[i].v) }, M: { value: G.M } } });
  const mesh = new THREE.Mesh(geo, m); mesh.position.copy(pos); mesh.rotation.copy(rot); scene.add(mesh); wallMats[i] = m; return mesh;
}
const wallBack = wall(0, new THREE.PlaneGeometry(14, 10), new THREE.Vector3(7, 5, 0), new THREE.Euler(0, 0, 0), new THREE.Vector3(0, 0, 1), 2);
const wallLeft = wall(1, new THREE.PlaneGeometry(14, 10), new THREE.Vector3(0, 5, 7), new THREE.Euler(0, Math.PI / 2, 0), new THREE.Vector3(1, 0, 0), 0);
const wallFloor = wall(2, new THREE.PlaneGeometry(14, 14), new THREE.Vector3(7, 0, 7), new THREE.Euler(-Math.PI / 2, 0, 0), new THREE.Vector3(0, 1, 0), 1);
const WALLS = [wallBack, wallLeft, wallFloor];

// ---------------- pin + plinth
const blackSteel = new THREE.MeshStandardMaterial({ color: 0x0e0d0c, metalness: 0.7, roughness: 0.38, envMap: ENV });
const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, G.C[1], 12), blackSteel); pin.position.set(G.C[0], G.C[1] / 2, G.C[2]); pin.castShadow = true; scene.add(pin);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 0.07, 48), blackSteel); plinth.position.set(G.C[0], 0.035, G.C[2]); plinth.castShadow = true; scene.add(plinth);

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
      const ao = Math.min(1, 0.32 + r.depth * 3.2);
      if (mi === 0) col.setRGB(0.55 + 0.12 * r.tone, 0.40 + 0.08 * r.tone, 0.22 + 0.05 * r.tone); // aged brass
      else if (mi === 1) col.setRGB(0.95, 0.78, 0.50);
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
  lc: { value: LAMP_COL.map(c => new THREE.Vector3(c.r, c.g, c.b)) }, li: { value: [0, 0, 0] }, cosOuter: { value: Math.cos(ANG) }, time: { value: 0 }, density: { value: +(Q.get('hz') || 0.016) }, freeze: { value: 0 } } });
const compMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: COMP_FS, depthTest: false, depthWrite: false, uniforms: {
  sceneTex: { value: sceneRT.texture }, hazeTex: { value: hazeRT.texture }, res: { value: new THREE.Vector2(W, H) }, time: { value: 0 }, exposure: { value: 1.0 }, grain: { value: 0.028 }, fade: { value: 1 } } });
const hazeScene = new THREE.Scene(); hazeScene.add(new THREE.Mesh(quadGeo, hazeMat));
const compScene = new THREE.Scene(); compScene.add(new THREE.Mesh(quadGeo, compMat));

// ---------------- state → scene
const S = { lamp: [1, 1, 1], radius: [1.2, 1.2, 1.2], dark: [0.97, 0.97, 0.97], push: 0, freeze: 0, fade: 1, time: 0 };
const mouse = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
function applyState() {
  for (let i = 0; i < 3; i++) {
    const on = S.lamp[i]; lamps[i].intensity = 3.2 * on; const u = wallMats[i].uniforms;
    u.lampInt.value = 3.4 * on; u.radius.value = S.radius[i]; u.darkness.value = S.dark[i]; u.time.value = S.time;
    lensMats[i].color.copy(LAMP_COL[i]).multiplyScalar(14 * on);
    const b = new THREE.Vector3(0.004, 0.004, 0.004); for (let k = 0; k < 3; k++) if (k !== i) b.add(new THREE.Vector3(LAMP_COL[k].r, LAMP_COL[k].g, LAMP_COL[k].b).multiplyScalar(0.014 * S.lamp[k]));
    u.bounce.value.copy(b); hazeMat.uniforms.li.value[i] = on;
  }
  hazeMat.uniforms.freeze.value = S.freeze; hazeMat.uniforms.time.value = S.time; compMat.uniforms.time.value = S.time; compMat.uniforms.fade.value = S.fade;
  if (!SHOT) { cam.x += (mouse.x - cam.x) * 0.04; cam.y += (mouse.y - cam.y) * 0.04; }
  placeCamera(cam.x, cam.y, S.push);
}
function render() {
  applyState();
  renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);
  lamps.forEach((l, i) => { if (l.shadow.map) { const tex = l.shadow.map.texture; wallMats[i].uniforms.shadowMap.value = tex; wallMats[i].uniforms.shadowMatrix.value.copy(l.shadow.matrix); hazeMat.uniforms['sm' + i].value = tex; hazeMat.uniforms['smat' + i].value.copy(l.shadow.matrix); } });
  // depth pre-pass (half res) for the haze march
  scene.overrideMaterial = depthOnly; const bg = scene.background; scene.background = null; const sm = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
  renderer.setRenderTarget(depthRT); renderer.render(scene, camera); scene.overrideMaterial = null; scene.background = bg; renderer.shadowMap.autoUpdate = sm;
  hazeMat.uniforms.invVP.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse); hazeMat.uniforms.camPos.value.copy(camera.position);
  renderer.setRenderTarget(hazeRT); renderer.render(hazeScene, postCam);
  renderer.setRenderTarget(null); renderer.render(compScene, postCam);
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight); W = Math.floor(innerWidth * DPR); H = Math.floor(innerHeight * DPR);
  sceneRT.setSize(W, H); depthRT.setSize(W >> 1, H >> 1); hazeRT.setSize(W >> 1, H >> 1); compMat.uniforms.res.value.set(W, H);
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
  if (!T) { const fit = fitFigures(draws, { evals: opts.evals || 70, init: [0, 1, 2].map(() => ({ sx: 0.95, sy: 0.95, tx: 0, ty: 0, r: 0 })) }); T = fit.T; }
  const orig = draws.map((d, i) => maskFromDrawT(d, T[i]));
  const fixed = repairTight(orig, opts.repairIter || 3);
  const fidHull = fidelity(orig, coverageFromHull(new Hull(fixed)));
  const res = forgeRods(fixed, { seed: opts.seed || 11 });
  const fidRods = fidelity(orig, res.cov);
  return { T, orig, masks: fixed, rods: res.rods, fidHull, fidRods, ms: performance.now() - t0 };
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
function prepNest(res) {
  buildNest(res); // creates rodMeshes with final matrices
  const R = mulberry(5); const meshes = [];
  rodMeshes.forEach((im) => { const n = im.count; const data = []; for (let i = 0; i < n; i++) { im.getMatrixAt(i, _m4); const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); _m4.decompose(pos, q, sc);
    const dir = pos.clone().add(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.8)).normalize(); const far = pos.clone().addScaledVector(dir, 3.5 + R() * 4).add(new THREE.Vector3(0, 1.5 + R() * 2, 0));
    const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6, R() * 6, R() * 6)); data.push({ pos, q, sc, far, q0, delay: pos.length() * 0.28 + R() * 0.35, landed: false }); }
    meshes.push({ im, data }); });
  return { meshes, t0: 0, mode: 'idle' };
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
<div id="actions"><button id="bDraw">Draw your own three shadows <span class="zh">畫你的影子</span></button><button id="bNext">Next sculpture →</button></div>
<div id="drawbar" class="hidden"><div class="dt">Draw a silhouette on each lit wall. Closed outlines fill in by themselves.</div>
<div class="db"><button id="bClear">Clear</button><button id="bCancel">Back</button><button id="bForge" disabled>Forge the sculpture →</button></div></div>
<div id="forging" class="hidden">forging…</div>`;
const $ = (id) => document.getElementById(id);
function setPlacard(no, titles, nRods, fid) {
  $('pw').innerHTML = `No. ${no} — ${titles.map(t => t.split(' ')[1]).join(', ')}`;
  $('pm').innerHTML = `aged brass &amp; blackened steel, ${nRods.toLocaleString('en-US')} rods · ${(100 * Math.min(...fid)).toFixed(1)} % shadow fidelity`;
}
let hintTimer = 0; function hint(txt) { const h = $('hint'); h.textContent = txt; h.classList.toggle('on', !!txt); }
$('mute').onclick = (e) => { e.stopPropagation(); sound.start(); sound.setMuted(!sound.muted); $('mute').classList.toggle('off', sound.muted); };

// ---------------- state machine
const PRESET_LIST = PRESETS;
let presetIdx = +(Q.get('preset') || 0);
let work = null;          // current forged work {orig, masks, rods, fidHull, fidRods, titles, no}
let SCR = [{ yaw: 2.27, tilt: 0.62 }, { yaw: +(Q.get('sy') || -0.9), tilt: +(Q.get('st') || 0.45) }];
const st = { mode: 'intro', t: 0, introT: 0, yaw: 0, tilt: 0, vy: 0, vt: 0, drag: false, lockAt: -1, locked: false, lastMove: 0, freeStart: 0, labelA: 0, anim: 0, lastLockIntro: false, lampMul: 1 };

function loadWork(w) {
  work = w; current = w; masks = w.masks;
  nest = prepNest({ rods: w.rods }); setLabels(w.titles, w.no); setPlacard(w.no, w.titles, w.rods.length, w.fidHull);
  window.__forge = { masks: w.masks, origMasks: w.orig, current: w, fidRaw: w.fidHull, fidRep: w.fidRods };
}
function presetWork(i) {
  const P = PRESET_LIST[i]; const w = forgeFrom(P.figs.map(f => FIGURES[f]), { T: P.T, seed: 11 });
  w.titles = P.title; w.no = P.no; console.log(`preset ${P.no}: rods ${w.rods.length}, hull fidelity ${w.fidHull.map(x => (100 * x).toFixed(1)).join('/')}, rod coverage ${w.fidRods.map(x => (100 * x).toFixed(1)).join('/')}, ${w.ms.toFixed(0)} ms`);
  if (!P.T) {} return w;
}
let masks = null;
loadWork(presetWork(presetIdx));

// pose → guidance (penumbra radius, darkness): the signal the visitor sees (and hears)
function poseAngle(yaw, tilt) { return poseQuat(yaw, tilt).angleTo(new THREE.Quaternion()); }
function guidance(ang) { const a = 1 - Math.exp(-ang / 0.16); return { radius: 1.3 + 30 * a, dark: 0.80 - 0.30 * (1 - Math.exp(-ang / 0.35)) }; }

// lock choreography relative to lock time
function lockFX(dt) { // dt seconds since lock (<0: not locked)
  const out = { radius: [0, 0, 0], k: [0, 0, 0], push: 0, freeze: 0, labels: 0, flash: 0 };
  if (dt < 0) return out;
  for (let i = 0; i < 3; i++) out.k[i] = easeOut((dt - 0.06 * i) / 0.25);
  out.push = 0.03 * easeOut(dt / 0.35); out.flash = 0.14 * Math.exp(-dt / 0.25) * (dt < 1.5 ? 1 : 0); out.freeze = dt < 0.2 ? 1 : Math.max(0, 1 - (dt - 0.2) / 0.3); out.labels = sm(0.6, 1.0, dt);
  return out;
}

// intro timeline (pure function of t) → pose & lamps
const LAMP_T = [0.35, 0.75, 1.15], LOCK_T = 4.0, UNLOCK_T = 7.2, FREE_T = 9.4;
function lampOn(t, i) { const d = t - LAMP_T[i]; if (d < 0) return 0; const ramp = clamp(d / 0.09, 0, 1); const fl = d < 0.22 ? (Math.sin(d * 140 + i) > 0.2 ? 1 : 0.35) : 1; return ramp * fl; }
const AXS = new THREE.Vector3(+(Q.get('ax') || 0.42), +(Q.get('ay') || 0.78), +(Q.get('az') || 0.46)).normalize(), A0 = +(Q.get('a0') || 2.05);
const qIdent = new THREE.Quaternion();
function introQuat(t) { // oblique-axis tumble, then a single eased geodesic into alignment (never passes axis permutations)
  if (t < 1.3) return new THREE.Quaternion().setFromAxisAngle(AXS, A0 + 0.9 * (1.3 - t));
  if (t < LOCK_T) { const u = (t - 1.3) / (LOCK_T - 1.3); return new THREE.Quaternion().setFromAxisAngle(AXS, A0 * Math.pow(1 - u, 1.35)); }
  if (t < UNLOCK_T) return qIdent.clone();
  const u = easeOut((t - UNLOCK_T) / (FREE_T - UNLOCK_T)); const s2 = SCR[1]; const k = u * u * (3 - 2 * u); return poseQuat(s2.yaw * k, s2.tilt * k);
}
const qAngle = (q) => 2 * Math.acos(Math.min(1, Math.abs(q.w)));


function update(dt) {
  st.t += dt; const t = st.t;
  let lamp = [1, 1, 1], radius = [0, 0, 0], dark = [0, 0, 0], push = 0, freeze = 0, labels = 0, ang = 0;
  if (st.mode === 'intro') {
    st.introT += dt; const it = st.introT; lamp = [0, 1, 2].map(i => lampOn(it, i));
    if (SHOT) lamp = lamp.map((v, i) => it > LAMP_T[i] + 0.25 ? 1 : v);
    [0, 1, 2].forEach(i => { const was = st['lamp' + i]; const now = lamp[i] > 0.5; if (now && !was) sound.clunk(i); st['lamp' + i] = now; });
    st.q = introQuat(it); if (it >= UNLOCK_T) { const k = easeOut((it - UNLOCK_T) / (FREE_T - UNLOCK_T)); const kk = k * k * (3 - 2 * k); st.yaw = SCR[1].yaw * kk; st.tilt = SCR[1].tilt * kk; }
    const L = lockFX(it < UNLOCK_T ? it - LOCK_T : -1); if (it >= LOCK_T && !st.lastLockIntro) { st.lastLockIntro = true; sound.chord(); }
    labels = it < UNLOCK_T ? L.labels : Math.max(0, 1 - (it - UNLOCK_T) / 0.5); push = it < UNLOCK_T ? L.push : 0.03 * Math.max(0, 1 - (it - UNLOCK_T) / 1.2);
    ang = qAngle(st.q); const g = guidance(ang);
    for (let i = 0; i < 3; i++) { radius[i] = g.radius + (1.0 - g.radius) * L.k[i]; dark[i] = g.dark + (0.975 - g.dark) * L.k[i]; }
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
    const L = lockFX(st.locked ? t - st.lockAt : -1); const g = guidance(ang);
    for (let i = 0; i < 3; i++) { radius[i] = g.radius + (1.0 - g.radius) * L.k[i]; dark[i] = g.dark + (0.975 - g.dark) * L.k[i]; }
    push = L.push; freeze = L.freeze; labels = L.labels; lamp = lamp.map(v => v * (1 + L.flash));
    sound.update(Math.abs(st.vy) * 60 * 0.05 + Math.abs(st.vt) * 60 * 0.05, ang, st.drag || (t - st.lastMove) < 1.5);
  } else if (st.mode === 'draw') {
    lamp = [0.62, 0.62, 0.62]; ang = 0; for (let i = 0; i < 3; i++) { radius[i] = 1.5; dark[i] = 0.9; }
  }
  // nest animation
  if (nest && nest.mode !== 'idle') animateNest(t - st.anim);
  if (st.mode === 'intro') pivot.quaternion.copy(st.q);
  else { const q = poseQuat(st.yaw, st.tilt); if (st.blendQ) { const k = easeOut((t - st.blendT) / 0.7); q.copy(st.blendQ.clone().slerp(q, k)); if (k >= 1) st.blendQ = null; } pivot.quaternion.copy(q); }
  for (let i = 0; i < 3; i++) { S.lamp[i] = lamp[i] * st.lampMul; S.radius[i] = radius[i]; S.dark[i] = dark[i]; }
  S.push = push; S.freeze = freeze; S.time = t;
  const drawAmt = st.mode === 'draw' ? 1 : 0; for (const m of wallMats) m.uniforms.drawAmt.value += (drawAmt - m.uniforms.drawAmt.value) * (SHOT ? 1 : 0.15);
  for (const m of labelMeshes) m.material.opacity = labels;
  st.ang = ang;
}

// ---------------- input
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let lastX = 0, lastY = 0, drawing = null;
canvas.addEventListener('pointerdown', (e) => {
  sound.start(); lastX = e.clientX; lastY = e.clientY; st.lastMove = st.t;
  if (st.mode === 'draw') { const hit = wallHit(e); if (hit) { drawing = hit; strokeTo(hit, true); } return; }
  if (st.mode === 'intro') { // skip ahead: keep lamps on, go free from current pose
    st.mode = 'free'; st.freeStart = st.t; st.locked = false; st.lockAt = -1; for (const m of labelMeshes) m.material.opacity = 0;
    st.blendQ = pivot.quaternion.clone(); st.blendT = st.t; if (qAngle(st.blendQ) < 0.05) { st.yaw = 0; st.tilt = 0; } else { st.yaw = SCR[1].yaw; st.tilt = SCR[1].tilt; } st.vy = st.vt = 0;
  }
  st.drag = true; canvas.style.cursor = 'grabbing'; hint('');
});
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1;
  if (st.mode === 'draw') { if (drawing) { const hit = wallHit(e, drawing.w); if (hit) strokeTo(hit, false); } return; }
  if (!st.drag) return; const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; st.lastMove = st.t;
  st.vy = dx * 0.0065; st.vt = dy * 0.0045; st.yaw += st.vy; st.tilt = clamp(st.tilt + st.vt, -0.7, 0.7);
});
addEventListener('pointerup', () => { st.drag = false; canvas.style.cursor = st.mode === 'draw' ? 'crosshair' : 'grab'; if (drawing) { finishStroke(drawing.w); drawing = null; } });

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
let userNo = 0;
function forgeDrawings(draws, titles) {
  $('forging').classList.remove('hidden');
  setTimeout(() => {
    const D = draws || fillCanvases.map(c => (g) => g.drawImage(c, 0, 0, 1000, 1000));
    const w = forgeFrom(D, { evals: SHOT ? 50 : 70, seed: 21 + userNo });
    userNo++; w.no = `${PRESET_LIST.length + userNo}`; w.titles = titles || ['影 Yours', '影 Yours', '影 Yours'];
    console.log(`forged drawing: rods ${w.rods.length}, hull fidelity ${w.fidHull.map(x => (100 * x).toFixed(1)).join('/')}, rod coverage ${w.fidRods.map(x => (100 * x).toFixed(1)).join('/')}, ${w.ms.toFixed(0)} ms`);
    window.__lastForge = { ms: w.ms, rods: w.rods.length, fidHull: w.fidHull, fidRods: w.fidRods };
    loadWork(w); nest.mode = 'in'; st.anim = st.t; st.mode = 'forged'; st.yaw = 0; st.tilt = 0; st.locked = false; st.lastLock = st.t;
    $('forging').classList.add('hidden'); exitDraw(); sound.whoosh();
    if (!SHOT) setTimeout(() => { st.locked = true; st.lockAt = st.t; sound.chord(); }, 1500);
  }, 30);
}
$('bNext').onclick = (e) => { e.stopPropagation(); sound.start(); presetIdx = (presetIdx + 1) % PRESET_LIST.length; loadWork(presetWork(presetIdx)); nest.mode = 'in'; st.anim = st.t; st.mode = 'free'; st.yaw = SCR[1].yaw; st.tilt = SCR[1].tilt; st.locked = false; st.lastLock = st.t; sound.whoosh(); hint('Drag to turn the sculpture until its shadows become pictures'); };

// ---------------- main loop (deterministic in ?shot mode)
let frame = 0, last = performance.now();
const SHOT_T = +(Q.get('t') || 6.0);
async function boot() {
  await fontsReady; setLabels(work.titles, work.no);
  if (SHOT) {
    const pose = Q.get('pose');
    if (pose) { // free-mode still: pose=scramble|solved|<k 0..1 toward scramble>
      st.mode = 'free'; st.freeStart = -100; const k = pose === 'solved' ? 0 : pose === 'scramble' ? 1 : +pose; st.yaw = SCR[1].yaw * k; st.tilt = SCR[1].tilt * k; st.lastLock = -100;
      if (k === 0) { st.locked = true; st.lockAt = -10; }
      update(0); st.t = 10; if (k === 0) st.lockAt = 0;
    } else if (Q.get('forgeTest')) {
      const names = Q.get('forgeTest').split(','); forgeDrawings(names.map(n => FIGURES[n]), names.map(n => `· ${n}`));
      await new Promise(r => setTimeout(r, 200)); st.mode = 'forged'; const ft = +(Q.get('ft') || 3); st.anim = st.t - ft; st.locked = ft > 1.6; st.lockAt = st.t - (ft - 1.6);
    } else if (Q.get('drawDemo')) {
      enterDraw(); st.anim = st.t - 5; ['heart', 'star', 'letterA'].forEach((n, w) => { const g = drawCanvases[w].getContext('2d'); g.save(); g.scale(MR / 1000, MR / 1000); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
        if (w === 2) { g.lineWidth = 26; g.lineJoin = 'round'; const c2 = document.createElement('canvas'); c2.width = c2.height = 1000; const gg = c2.getContext('2d'); gg.fillStyle = '#fff'; FIGURES[n](gg); g.restore(); g.save(); g.scale(MR / 1000, MR / 1000); g.drawImage(c2, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(c2, 0, 0); g.globalCompositeOperation = 'source-over'; FIGURES[n](g); }
        else FIGURES[n](g); g.restore(); refreshFill(w, true); });
      for (const m of wallMats) m.uniforms.drawAmt.value = 1; st.t += 5;
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
