import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import * as S from './shaders.js';
import { ForgeAudio } from './audio.js';

/* =====================================================================
   星鍛 Orbital Forge v2 — HDR stellar forge
   ===================================================================== */
const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot');
const FIXED = SHOT || Q.has('fixed');
const FIXED_DT = 1 / 30;

const QUALITY = [
  { key: 'LOW',   zh: '低', tex: 256, scale: 0.75, stars: 14000, levels: 6, msaa: 0 },
  { key: 'MED',   zh: '中', tex: 384, scale: 1.0,  stars: 22000, levels: 7, msaa: 0 },
  { key: 'HIGH',  zh: '高', tex: 512, scale: 1.0,  stars: 32000, levels: 7, msaa: 4 },
  { key: 'ULTRA', zh: '極', tex: 768, scale: 1.5,  stars: 42000, levels: 8, msaa: 4 },
];
let qLevel = Q.has('q') ? Math.max(0, Math.min(3, +Q.get('q'))) : 2;
let qAuto = !Q.has('q') && !SHOT;
const SHOT_TEX = +(Q.get('tex') || 0);

const MODES = [
  { zh: '電漿', en: 'PLASMA',  sub: '高溫電漿盤 · Hot plasma disk',
    tint: [1.0, 0.97, 0.95], sat: 1.12, shadow: [0.0, 0.55, 0.7], exposure: 1.0, shock: [1.0, 0.55, 0.25], css: '#ffb070',
    neb: { c1: [0.04, 0.30, 0.66], c2: [0.70, 0.05, 0.50], c3: [1.0, 0.52, 0.16], dust: [0.10, 0.05, 0.10], int: 2.1 } },
  { zh: '晶核', en: 'CRYSTAL', sub: '晶格軌道 · Lattice orbitals',
    tint: [0.95, 0.99, 1.06], sat: 1.08, shadow: [0.35, 0.2, 0.9], exposure: 1.0, shock: [0.45, 0.8, 1.0], css: '#8fd8ff',
    neb: { c1: [0.08, 0.22, 0.75], c2: [0.42, 0.12, 0.85], c3: [0.12, 0.72, 0.82], dust: [0.03, 0.03, 0.09], int: 1.15 } },
  { zh: '灰燼', en: 'EMBER',   sub: '冷卻餘燼 · Cooling embers',
    tint: [1.06, 0.96, 0.88], sat: 1.15, shadow: [0.6, 0.12, 0.04], exposure: 1.05, shock: [1.0, 0.35, 0.08], css: '#ff6a3a',
    neb: { c1: [0.85, 0.16, 0.04], c2: [0.50, 0.03, 0.14], c3: [1.0, 0.55, 0.18], dust: [0.06, 0.02, 0.015], int: 2.0 } },
];

/* ---------------- seed ---------------- */
let seed = Q.has('seed') ? (parseInt(Q.get('seed'), 16) >>> 0) : ((Math.random() * 0xffffffff) >>> 0);
if (SHOT && !Q.has('seed')) seed = 0x5EED2026;
const seedHex = 'OF2-' + seed.toString(16).toUpperCase().padStart(8, '0');
function rng(s) { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x >>>= 0; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
const R = rng(seed);
const nebSeed = new THREE.Vector3(R() * 50, R() * 50, R() * 50);

/* ---------------- DOM ---------------- */
const $ = (id) => document.getElementById(id);
const canvas = $('c');
const hud = $('hud');

/* ---------------- renderer ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true });
renderer.autoClear = false;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
let W = innerWidth, H = innerHeight;
let PR = 1;

const camera = new THREE.PerspectiveCamera(36, W / H, 0.05, 2000);
const scene = new THREE.Scene();
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fsGeo = new THREE.PlaneGeometry(2, 2);

/* ---------------- state ---------------- */
let mode = Q.has('mode') ? Math.max(0, Math.min(2, +Q.get('mode') - 1)) : 0;
const modeW = new THREE.Vector3(mode === 0 ? 1 : 0, mode === 1 ? 1 : 0, mode === 2 ? 1 : 0);
const modeTarget = modeW.clone();
let prevMode = mode;
let nebBlend = 1;
const grade = { tint: new THREE.Vector3(...MODES[mode].tint), shadow: new THREE.Vector3(...MODES[mode].shadow), sat: MODES[mode].sat, exposure: MODES[mode].exposure };
let time = 0;      // simulation time
let frame = 0;
let introT = 0;
let introDone = false;
const INTRO_LEN = 4.4;
let hudVisible = true;
let lastInput = -100;
let shockCount = 0, sprayTotal = 0;

/* ===================================================================
   NEBULA: baked HDR cubemaps (one per mode), progressive face baking
   =================================================================== */
const SKY_STEPS = SHOT ? 14 : 22;
const CUBE = SHOT ? 384 : (qLevel >= 2 ? 1024 : 640);
const bakeScene = new THREE.Scene();
const bakeMat = new THREE.ShaderMaterial({
  vertexShader: S.bakeVert, fragmentShader: S.bakeFrag, side: THREE.BackSide, depthTest: false, depthWrite: false,
  defines: { STEPS: SKY_STEPS },
  uniforms: { c1: { value: new THREE.Vector3() }, c2: { value: new THREE.Vector3() }, c3: { value: new THREE.Vector3() }, cDust: { value: new THREE.Vector3() }, uSeed: { value: nebSeed }, uInt: { value: 1 } },
});
bakeScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), bakeMat));
const cubes = MODES.map(() => {
  const rt = new THREE.WebGLCubeRenderTarget(CUBE, { type: THREE.HalfFloatType, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  const cam = new THREE.CubeCamera(0.1, 100, rt);
  return { rt, cam, faces: 0, ready: false };
});
function setBakeMode(m) {
  const n = MODES[m].neb;
  bakeMat.uniforms.c1.value.set(...n.c1); bakeMat.uniforms.c2.value.set(...n.c2); bakeMat.uniforms.c3.value.set(...n.c3);
  bakeMat.uniforms.cDust.value.set(...n.dust); bakeMat.uniforms.uInt.value = n.int;
}
function bakeFace(m) {
  const c = cubes[m];
  if (c.faces >= 6) return;
  if (c.faces === 0) { c.cam.coordinateSystem = renderer.coordinateSystem; c.cam.updateCoordinateSystem(); c.cam.updateMatrixWorld(true); }
  setBakeMode(m);
  renderer.setRenderTarget(c.rt, c.faces);
  renderer.clear();
  renderer.render(bakeScene, c.cam.children[c.faces]);
  renderer.setRenderTarget(null);
  c.faces++;
  if (c.faces >= 6) c.ready = true;
}
function bakeAll(m) { while (cubes[m].faces < 6) bakeFace(m); }

const skyMat = new THREE.ShaderMaterial({
  vertexShader: S.skyVert, fragmentShader: S.skyFrag, depthWrite: false, depthTest: false, side: THREE.BackSide,
  uniforms: { tA: { value: cubes[mode].rt.texture }, tB: { value: cubes[mode].rt.texture }, uBlend: { value: 1 }, uInt: { value: 0 }, uTime: { value: 0 } },
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), skyMat);
sky.frustumCulled = false; sky.renderOrder = -10;
scene.add(sky);

/* ===================================================================
   STARFIELD
   =================================================================== */
let stars = null;
const starMat = new THREE.ShaderMaterial({
  vertexShader: S.starVert, fragmentShader: S.starFrag, transparent: true, depthWrite: false, depthTest: true,
  blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uFade: { value: 0 } },
});
function buildStars(n) {
  if (stars) { scene.remove(stars); stars.geometry.dispose(); }
  const r = rng(seed ^ 0x9e3779b9);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), ph = new Float32Array(n);
  const bandN = new THREE.Vector3(0.42, 1.0, -0.22).normalize();
  const u = new THREE.Vector3().crossVectors(bandN, new THREE.Vector3(1, 0, 0)).normalize();
  const w = new THREE.Vector3().crossVectors(bandN, u);
  const temps = [[0.62, 0.74, 1.0], [0.8, 0.88, 1.0], [1.0, 0.97, 0.92], [1.0, 0.86, 0.66], [1.0, 0.68, 0.42]];
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    if (r() < 0.45) {
      const a = r() * Math.PI * 2;
      const g = (r() + r() + r() - 1.5) * 0.28;
      v.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a)).addScaledVector(bandN, g).normalize();
    } else {
      const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      v.set(s * Math.cos(a), z, s * Math.sin(a));
    }
    const rad = 120 + r() * 380;
    pos[i * 3] = v.x * rad; pos[i * 3 + 1] = v.y * rad; pos[i * 3 + 2] = v.z * rad;
    const m = Math.pow(r(), 9);
    const big = r() < 0.0025;
    size[i] = big ? 18 + r() * 22 : 1.0 + m * 4.5 + r() * 0.6;
    const t = temps[(r() * temps.length) | 0];
    const b = big ? 2.2 + r() * 3 : (0.10 + m * 5.0 + r() * 0.14);
    col[i * 3] = t[0] * b; col[i * 3 + 1] = t[1] * b; col[i * 3 + 2] = t[2] * b;
    ph[i] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  stars = new THREE.Points(g, starMat);
  stars.frustumCulled = false; stars.renderOrder = -9;
  scene.add(stars);
}

/* ===================================================================
   STAR CORE + CORONA
   =================================================================== */
const coreMat = new THREE.ShaderMaterial({
  vertexShader: S.coreVert, fragmentShader: S.coreFrag,
  uniforms: { uTime: { value: 0 }, uBright: { value: 0 }, uHeat: { value: 0 }, uMode: { value: modeW } },
});
const core = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), coreMat);
core.renderOrder = 0;
scene.add(core);
const CORONA_SCALE = 5.0;
const coronaMat = new THREE.ShaderMaterial({
  vertexShader: S.coronaVert, fragmentShader: S.coronaFrag, transparent: true, depthWrite: false, depthTest: true,
  blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uBright: { value: 0 }, uScale: { value: CORONA_SCALE }, uHeat: { value: 0 }, uMode: { value: modeW } },
});
const corona = new THREE.Mesh(new THREE.PlaneGeometry(2 * CORONA_SCALE, 2 * CORONA_SCALE), coronaMat);
corona.renderOrder = 1;
scene.add(corona);

/* ===================================================================
   GPU PARTICLES
   =================================================================== */
let gpu = null, posVar = null, velVar = null, particles = null, TEX = 0, SPRAY_ROW = 0, N = 0;
const simU = {
  uTime: { value: 0 }, uDt: { value: 1 / 60 }, uMode: { value: modeW },
  uMouseP: { value: new THREE.Vector3(0, 0, 0) }, uMouseV: { value: new THREE.Vector3() }, uCamDir: { value: new THREE.Vector3(0, 0, 1) },
  uSculpt: { value: 0 }, uGrav: { value: 0 },
  uShock: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
  uShockK: { value: new THREE.Vector4() },
  uImplode: { value: 0 }, uBlast: { value: 0 }, uRecover: { value: 1 }, uSprayRow: { value: 0 }, uEmit: { value: 0 }, uNovaSpawn: { value: 0 },
  uEmitP0: { value: new THREE.Vector3() }, uEmitP1: { value: new THREE.Vector3() }, uEmitV: { value: new THREE.Vector3() },
};
const partMat = new THREE.ShaderMaterial({
  vertexShader: S.particleVert, fragmentShader: S.particleFrag, transparent: true, depthWrite: false, depthTest: true,
  blending: THREE.AdditiveBlending,
  uniforms: {
    tPos: { value: null }, tVel: { value: null }, uTime: { value: 0 }, uIntro: { value: 0 }, uSize: { value: 0.022 },
    uStreak: { value: 0.045 }, uTex: { value: 512 }, uIntensity: { value: 1 }, uSprayV: { value: 1.6 }, uNovaOn: { value: 0 }, uFlash: { value: 0 }, uMode: { value: modeW }, uRes: { value: new THREE.Vector2(W, H) },
  },
});
const gasMat = new THREE.ShaderMaterial({
  vertexShader: S.gasVert, fragmentShader: S.gasFrag, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
  uniforms: { tPos: { value: null }, tVel: { value: null }, uTime: { value: 0 }, uIntro: { value: 0 }, uIntensity: { value: 0.03 }, uTex: { value: 512 }, uMode: { value: modeW }, uRes: partMat.uniforms.uRes },
});
const dustMat = new THREE.ShaderMaterial({
  vertexShader: S.gasVert, fragmentShader: S.gasFrag, transparent: true, depthWrite: false, depthTest: true, defines: { DUST: 1 },
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcColorFactor,
  uniforms: { tPos: gasMat.uniforms.tPos, tVel: gasMat.uniforms.tVel, uTime: gasMat.uniforms.uTime, uIntro: gasMat.uniforms.uIntro, uIntensity: { value: 0.22 }, uTex: gasMat.uniforms.uTex, uMode: { value: modeW }, uRes: partMat.uniforms.uRes },
});
let gas = null, dust = null;
const GAS_COUNT = [6000, 9000, 14000, 20000];
function buildGas() {
  if (gas) { scene.remove(gas); scene.remove(dust); gas.geometry.dispose(); dust.geometry.dispose(); }
  const G = SHOT ? 14000 : GAS_COUNT[qLevel];
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const ref = new Float32Array(G * 2), rnd = new Float32Array(G * 4);
  const r = rng(seed ^ 0x6a5);
  const diskN = SPRAY_ROW * TEX;
  for (let i = 0; i < G; i++) {
    const idx = Math.floor((i + r() * 0.999) * diskN / G);
    const x = idx % TEX, y = Math.floor(idx / TEX);
    ref[i * 2] = (x + 0.5) / TEX; ref[i * 2 + 1] = (y + 0.5) / TEX;
    rnd[i * 4] = r(); rnd[i * 4 + 1] = r(); rnd[i * 4 + 2] = r(); rnd[i * 4 + 3] = r();
  }
  g.setAttribute('aRef', new THREE.InstancedBufferAttribute(ref, 2));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.instanceCount = G;
  gas = new THREE.Mesh(g, gasMat); gas.frustumCulled = false; gas.renderOrder = 1.5;
  dust = new THREE.Mesh(g, dustMat); dust.frustumCulled = false; dust.renderOrder = 2.5;
  gasMat.uniforms.uTex.value = TEX;
  gasMat.uniforms.uIntensity.value = 0.024 * (14000 / G);
  dustMat.uniforms.uIntensity.value = 0.12 * Math.pow(14000 / G, 0.8);
  scene.add(gas); scene.add(dust);
  if (Q.has('nogas')) gas.visible = false;
  if (Q.has('nodust')) dust.visible = false;
}
function buildParticles() {
  const q = QUALITY[qLevel];
  TEX = SHOT_TEX || q.tex;
  N = TEX * TEX;
  SPRAY_ROW = Math.floor(TEX * 0.87);
  if (gpu) gpu.dispose();
  if (particles) { scene.remove(particles); particles.geometry.dispose(); }
  gpu = new GPUComputationRenderer(TEX, TEX, renderer);
  gpu.setDataType(THREE.FloatType);
  const p0 = gpu.createTexture(), v0 = gpu.createTexture();
  posVar = gpu.addVariable('texturePosition', S.posFrag, p0);
  velVar = gpu.addVariable('textureVelocity', S.velFrag, v0);
  gpu.setVariableDependencies(posVar, [posVar, velVar]);
  gpu.setVariableDependencies(velVar, [posVar, velVar]);
  Object.assign(posVar.material.uniforms, simU);
  Object.assign(velVar.material.uniforms, simU);
  simU.uSprayRow.value = SPRAY_ROW;
  const err = gpu.init();
  if (err) console.error(err);
  initParticleState();
  // render geometry
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const ref = new Float32Array(N * 2), rnd = new Float32Array(N * 4);
  const r = rng(seed ^ 0x51ed270b);
  for (let y = 0, i = 0; y < TEX; y++) for (let x = 0; x < TEX; x++, i++) {
    ref[i * 2] = (x + 0.5) / TEX; ref[i * 2 + 1] = (y + 0.5) / TEX;
    rnd[i * 4] = r(); rnd[i * 4 + 1] = r(); rnd[i * 4 + 2] = r(); rnd[i * 4 + 3] = r();
  }
  g.setAttribute('aRef', new THREE.InstancedBufferAttribute(ref, 2));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.instanceCount = N;
  partMat.uniforms.uTex.value = TEX;
  particles = new THREE.Mesh(g, partMat);
  particles.frustumCulled = false; particles.renderOrder = 2;
  if (Q.has('nopart')) particles.visible = false;
  scene.add(particles);
  // particle size compensation so lower tiers keep similar luminance
  partMat.uniforms.uIntensity.value = 0.42 * Math.pow(262144 / N, 0.75);
  partMat.uniforms.uSize.value = 0.0145 * Math.pow(262144 / N, 0.22);
  $('pCount').textContent = N.toLocaleString('en-US');
  buildGas();
}
let initMats = null;
function initParticleState() {
  if (!initMats) {
    initMats = {
      pos: gpu.createShaderMaterial(S.initPosFrag, { uMode: { value: modeW }, uSprayRow: { value: 0 } }),
      vel: gpu.createShaderMaterial(S.initVelFrag, { uMode: { value: modeW }, uSprayRow: { value: 0 } }),
    };
  } else {
    // shader materials are bound to the resolution define; rebuild for new size
    initMats.pos.dispose(); initMats.vel.dispose();
    initMats = null; return initParticleState();
  }
  initMats.pos.uniforms.uSprayRow.value = SPRAY_ROW; initMats.vel.uniforms.uSprayRow.value = SPRAY_ROW;
  for (let k = 0; k < 2; k++) {
    gpu.doRenderTarget(initMats.pos, posVar.renderTargets[k]);
    gpu.doRenderTarget(initMats.vel, velVar.renderTargets[k]);
  }
}

/* ===================================================================
   SHOCKWAVES / FLASH / NOVA RING
   =================================================================== */
const shellGeo = new THREE.IcosahedronGeometry(1, 5);
const shocks = [];
const shellPool = [];
for (let i = 0; i < 4; i++) {
  const m = new THREE.ShaderMaterial({
    vertexShader: S.shellVert, fragmentShader: S.shellFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color() }, uAlpha: { value: 0 }, uTime: { value: 0 } },
  });
  const mesh = new THREE.Mesh(shellGeo, m); mesh.visible = false; mesh.renderOrder = 3; scene.add(mesh); shellPool.push(mesh);
}
const flashMat = new THREE.ShaderMaterial({
  vertexShader: S.coronaVert, fragmentShader: S.flashFrag, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: new THREE.Color(1, 0.8, 0.6) }, uAlpha: { value: 0 } },
});
const flash = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), flashMat); flash.renderOrder = 5; flash.visible = false; scene.add(flash);
let flashAmt = 0, flashScale = 6;
const ringMat = new THREE.ShaderMaterial({
  vertexShader: S.coronaVert, fragmentShader: S.ringFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uColor: { value: new THREE.Color() }, uAlpha: { value: 0 }, uTime: { value: 0 }, uWidth: { value: 0.05 } },
});
const novaRing = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ringMat);
novaRing.rotation.x = -Math.PI / 2; novaRing.visible = false; novaRing.renderOrder = 4; scene.add(novaRing);

function addShock(origin, strength, kind = 'click') {
  if (shocks.length >= 4) shocks.shift();
  shocks.push({ o: origin.clone(), age: 0, k: strength, kind });
  shockCount++;
  $('pShock').textContent = shockCount;
  flashAt(origin, kind === 'nova' ? 0 : 0.32 * strength, kind === 'nova' ? 0 : 2.2);
  audio.shock(strength, kind);
}
function flashAt(p, amt, scale) {
  if (amt <= 0) return;
  flash.position.copy(p);
  flashAmt = Math.max(flashAmt, amt); flashScale = scale;
}

/* ---------- supernova ---------- */
const nova = { t: -1, blasted: false };
let novaGlowCur = 0;
function triggerNova() {
  if (nova.t >= 0 && nova.t < 2.5) return;
  nova.t = 0; nova.blasted = false;
  audio.nova();
  toast('超新星', 'SUPERNOVA');
}
let shake = 0, exposureKick = 0, caKick = 0, bloomKick = 0;

/* ===================================================================
   POST PIPELINE (HDR → multi-mip bloom → composite)
   =================================================================== */
let rtScene = null, mips = [];
const downMat = new THREE.ShaderMaterial({ vertexShader: S.fsVert, fragmentShader: S.downFrag, depthTest: false, depthWrite: false,
  uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uFirst: { value: 0 }, uThresh: { value: 0.55 } } });
const upMat = new THREE.ShaderMaterial({ vertexShader: S.fsVert, fragmentShader: S.upFrag, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
  uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 1 }, uWeight: { value: 1 } } });
const compMat = new THREE.ShaderMaterial({ vertexShader: S.fsVert, fragmentShader: S.compositeFrag, depthTest: false, depthWrite: false,
  uniforms: {
    tScene: { value: null }, tBloom: { value: null }, tDirt: { value: null }, tWide: { value: null },
    uRes: { value: new THREE.Vector2() }, uTime: { value: 0 },
    uShock: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
    uShockCol: { value: new THREE.Vector3(1, 0.6, 0.3) },
    uExposure: { value: 1 }, uBloom: { value: 0.16 }, uDirt: { value: 0.35 }, uCA: { value: 0.012 }, uVignette: { value: 0.55 }, uGrain: { value: 0.035 },
    uSat: { value: 1.1 }, uFlash: { value: 0 }, uTint: { value: grade.tint }, uShadow: { value: grade.shadow },
    uCore: { value: new THREE.Vector2(0.5, 0.5) }, uRays: { value: 0.0 }, uWell: { value: new THREE.Vector4() }, uNova: { value: 0 }, uDof: { value: 0 },
  } });
const fsQuad = new THREE.Mesh(fsGeo, downMat); fsQuad.frustumCulled = false;
const fsScene = new THREE.Scene(); fsScene.add(fsQuad);
function fsPass(mat, target) { fsQuad.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }

function buildTargets() {
  const q = QUALITY[qLevel];
  PR = SHOT ? 1 : Math.min(devicePixelRatio || 1, 2) * (q.scale >= 1 ? 1 : q.scale);
  if (q.key === 'ULTRA') PR = Math.min(Math.max(devicePixelRatio || 1, 1) * 1.25, 2);
  renderer.setPixelRatio(PR);
  renderer.setSize(W, H, false);
  const w = Math.floor(W * PR), h = Math.floor(H * PR);
  if (rtScene) rtScene.dispose();
  mips.forEach((m) => m.dispose());
  rtScene = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: SHOT ? 0 : q.msaa, depthBuffer: true, stencilBuffer: false });
  mips = [];
  let mw = w, mh = h;
  for (let i = 0; i < q.levels; i++) {
    mw = Math.max(2, Math.floor(mw / 2)); mh = Math.max(2, Math.floor(mh / 2));
    mips.push(new THREE.WebGLRenderTarget(mw, mh, { type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }));
  }
  compMat.uniforms.uRes.value.set(w, h);
  partMat.uniforms.uRes.value.set(w, h);
  starMat.uniforms.uPR.value = PR;
  camera.aspect = W / H; camera.updateProjectionMatrix();
}
function renderBloom() {
  let src = rtScene.texture, sw = rtScene.width, sh = rtScene.height;
  for (let i = 0; i < mips.length; i++) {
    downMat.uniforms.tSrc.value = src;
    downMat.uniforms.uTexel.value.set(1 / sw, 1 / sh);
    downMat.uniforms.uFirst.value = i === 0 ? 1 : 0;
    fsPass(downMat, mips[i]);
    src = mips[i].texture; sw = mips[i].width; sh = mips[i].height;
  }
  for (let i = mips.length - 1; i > 0; i--) {
    upMat.uniforms.tSrc.value = mips[i].texture;
    upMat.uniforms.uTexel.value.set(1 / mips[i].width, 1 / mips[i].height);
    upMat.uniforms.uWeight.value = i > mips.length - 3 ? 0.85 : 0.75;
    fsPass(upMat, mips[i - 1]);
  }
}
/* procedural lens dirt */
function makeDirt() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 576;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  const r = rng(seed ^ 0xd1e7);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 160; i++) {
    const x = r() * c.width, y = r() * c.height, rad = 4 + Math.pow(r(), 3) * 70;
    const a = 0.02 + r() * 0.07;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const hue = r() < 0.5 ? '255,230,200' : '200,230,255';
    gr.addColorStop(0, `rgba(${hue},${a})`); gr.addColorStop(0.7, `rgba(${hue},${a * 0.6})`); gr.addColorStop(1, `rgba(${hue},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 9; i++) { // smudges
    const x = r() * c.width, y = r() * c.height;
    g.save(); g.translate(x, y); g.rotate(r() * Math.PI); g.scale(1, 0.25 + r() * 0.3);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 160 + r() * 120);
    gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 300, 0, Math.PI * 2); g.fill(); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  return t;
}
compMat.uniforms.tDirt.value = makeDirt();

/* ===================================================================
   CAMERA / INPUT
   =================================================================== */
const orbit = { theta: -1.15, phi: 0.95, radius: 7.5, tTheta: 0.42, tPhi: 0.27, tRadius: 20.5, drag: false, lx: 0, ly: 0, downX: 0, downY: 0, downT: 0 };
const INTRO_FROM = { theta: -1.15, phi: 0.95, radius: 7.5 };
const INTRO_TO = { theta: 0.42, phi: 0.27, radius: 20.5 };
const lookTarget = new THREE.Vector3(0, -0.25, 0);
const CAM_ROLL = +(Q.get('roll') ?? -0.09);
const mouse = { x: W / 2, y: H / 2, ndc: new THREE.Vector2(), world: new THREE.Vector3(), prevWorld: new THREE.Vector3(), vel: new THREE.Vector3(), speed: 0, moved: false, inside: false };
const ray = new THREE.Raycaster();
const plane = new THREE.Plane();
let gravity = 0, gravHeld = false;
let emitP0 = new THREE.Vector3(), emitAccum = 0;

function updateMouseWorld() {
  ray.setFromCamera(mouse.ndc, camera);
  const n = camera.getWorldDirection(new THREE.Vector3()).negate();
  plane.setFromNormalAndCoplanarPoint(n, new THREE.Vector3(0, 0, 0));
  const hit = new THREE.Vector3();
  if (ray.ray.intersectPlane(plane, hit)) { if (hit.length() > 14) hit.setLength(14); mouse.world.copy(hit); }
}

addEventListener('pointermove', (e) => {
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true;
  mouse.ndc.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
  cursorTo(e.clientX, e.clientY);
  lastInput = time;
  if (orbit.drag) {
    const dx = e.clientX - orbit.lx, dy = e.clientY - orbit.ly;
    orbit.tTheta -= dx * 0.0052; orbit.tPhi = Math.max(-1.25, Math.min(1.25, orbit.tPhi + dy * 0.0045));
    orbit.lx = e.clientX; orbit.ly = e.clientY;
  } else mouse.moved = true;
});
addEventListener('pointerdown', (e) => {
  if (e.target.closest && e.target.closest('.ui')) return;
  audio.unlock();
  if (e.button !== 0) return;
  orbit.drag = true; orbit.lx = orbit.downX = e.clientX; orbit.ly = orbit.downY = e.clientY; orbit.downT = performance.now();
  lastInput = time;
  document.body.classList.add('dragging');
});
addEventListener('pointerup', (e) => {
  if (!orbit.drag) return;
  orbit.drag = false;
  document.body.classList.remove('dragging');
  const moved = Math.hypot(e.clientX - orbit.downX, e.clientY - orbit.downY);
  if (moved < 6 && introT > 1.2) {
    mouse.ndc.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
    updateMouseWorld();
    addShock(mouse.world, 1.0, 'click');
    cursorPulse();
  }
});
addEventListener('wheel', (e) => {
  e.preventDefault();
  orbit.tRadius = Math.max(7, Math.min(40, orbit.tRadius * Math.exp(e.deltaY * 0.0011)));
  lastInput = time;
}, { passive: false });
addEventListener('pointerleave', () => { mouse.inside = false; });
addEventListener('keydown', (e) => {
  if (e.repeat && e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') return;
  audio.unlock();
  lastInput = time;
  switch (e.code) {
    case 'Digit1': case 'Numpad1': setMode(0); break;
    case 'Digit2': case 'Numpad2': setMode(1); break;
    case 'Digit3': case 'Numpad3': setMode(2); break;
    case 'Space': e.preventDefault(); triggerNova(); break;
    case 'KeyF': if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); break;
    case 'KeyH': setHud(!hudVisible); break;
    case 'KeyR': resetForge(); break;
    case 'KeyQ': cycleQuality(); break;
    case 'KeyM': toggleSound(); break;
    case 'KeyC': copySeed(); break;
    case 'ShiftLeft': case 'ShiftRight': gravHeld = true; document.body.classList.add('grav'); $('pGrav').textContent = '開 ON'; audio.grav(true); break;
  }
});
addEventListener('keyup', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { gravHeld = false; document.body.classList.remove('grav'); $('pGrav').textContent = '關 OFF'; audio.grav(false); }
});
addEventListener('blur', () => { gravHeld = false; document.body.classList.remove('grav'); audio.grav(false); });
addEventListener('resize', () => { W = innerWidth; H = innerHeight; buildTargets(); });

/* ---------------- cursor ---------------- */
const cur = $('cur');
function cursorTo(x, y) { cur.style.transform = `translate(${x}px, ${y}px)`; }
function cursorPulse() { cur.classList.remove('pulse'); void cur.offsetWidth; cur.classList.add('pulse'); }

/* ===================================================================
   MODES / HUD
   =================================================================== */
function setMode(m, silent = false) {
  if (m === mode && !silent) { addShock(new THREE.Vector3(), 0.6, 'mode'); return; }
  prevMode = mode; mode = m;
  modeTarget.set(m === 0 ? 1 : 0, m === 1 ? 1 : 0, m === 2 ? 1 : 0);
  if (!cubes[m].ready) bakeAll(m);
  skyMat.uniforms.tA.value = cubes[prevMode].rt.texture;
  skyMat.uniforms.tB.value = cubes[m].rt.texture;
  nebBlend = 0;
  document.querySelectorAll('.mode').forEach((el) => el.classList.toggle('active', +el.dataset.m === m));
  document.documentElement.style.setProperty('--mode', MODES[m].css);
  $('pMode').textContent = MODES[m].zh + ' ' + MODES[m].en;
  if (!silent) {
    toast(MODES[m].zh, MODES[m].en + ' · ' + MODES[m].sub.split(' · ')[1]);
    addShock(new THREE.Vector3(), 0.7, 'mode');
    audio.mode(m);
  }
}
function toast(zh, en) {
  const t = $('toast');
  t.querySelector('.tz').textContent = zh; t.querySelector('.te').textContent = en;
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1700);
}
function setHud(v) { hudVisible = v; hud.classList.toggle('hidden', !v); }
function resetForge() {
  initParticleState();
  shocks.length = 0; nova.t = -1; simU.uRecover.value = 1; simU.uImplode.value = 0;
  shockCount = 0; sprayTotal = 0; $('pShock').textContent = '0'; $('pSpray').textContent = '0';
  orbit.tRadius = 20.5; orbit.tPhi = 0.27;
  introT = 0.9; introDone = false; partMat.uniforms.uIntro.value = 0; // replay the unfurl
  toast('重置', 'RESET · REFORGED');
  audio.shock(0.8, 'mode');
}
function cycleQuality() {
  qAuto = false;
  qLevel = (qLevel + 1) % QUALITY.length;
  applyQuality();
  toast('畫質 ' + QUALITY[qLevel].zh, 'QUALITY · ' + QUALITY[qLevel].key + ' · 手動 MANUAL');
}
function applyQuality() {
  buildTargets(); buildParticles(); buildStars(SHOT ? 26000 : QUALITY[qLevel].stars);
  $('pQual').textContent = QUALITY[qLevel].zh + ' ' + QUALITY[qLevel].key + (qAuto ? ' · AUTO' : '');
}
async function copySeed() {
  const url = location.origin + location.pathname + '?seed=' + seed.toString(16).toUpperCase().padStart(8, '0') + '&mode=' + (mode + 1);
  try { await navigator.clipboard.writeText(url); toast('已複製種子', 'SEED COPIED · ' + seedHex); }
  catch { toast(seedHex, 'COPY FAILED · 請手動複製'); }
}
function toggleSound() {
  audio.unlock();
  const on = audio.toggle();
  $('snd').classList.toggle('off', !on);
  $('sndLabel').textContent = on ? '聲音 ON' : '靜音 OFF';
}
document.querySelectorAll('.mode').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); audio.unlock(); setMode(+el.dataset.m); }));
$('btnCopy').addEventListener('click', (e) => { e.stopPropagation(); copySeed(); });
$('btnReset').addEventListener('click', (e) => { e.stopPropagation(); resetForge(); });
$('btnQual').addEventListener('click', (e) => { e.stopPropagation(); cycleQuality(); });
$('snd').addEventListener('click', (e) => { e.stopPropagation(); toggleSound(); });
$('seedCode').textContent = seedHex;

/* ===================================================================
   AUDIO
   =================================================================== */
const audio = new ForgeAudio(SHOT);
audio.onState = (on) => { $('snd').classList.toggle('off', !on); $('sndLabel').textContent = on ? '聲音 ON' : '靜音 OFF'; };

/* ===================================================================
   MAIN LOOP
   =================================================================== */
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const expo = (x) => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
let fpsFrames = 0, fpsT = performance.now(), fps = 60, fpsHist = [], lastQualChange = 0;
let introFired = false;
let lastNow = performance.now();

function step(dt) {
  time += dt; frame++;
  introT += dt;
  /* ---------- mode blend ---------- */
  const mk = 1 - Math.exp(-dt * 1.6);
  modeW.lerp(modeTarget, mk);
  nebBlend = Math.min(1, nebBlend + dt * 0.7);
  skyMat.uniforms.uBlend.value = ease(nebBlend);
  const M = MODES[mode];
  grade.tint.lerp(tmpV.set(...M.tint), mk); grade.shadow.lerp(tmpV.set(...M.shadow), mk);
  grade.sat += (M.sat - grade.sat) * mk; grade.exposure += (M.exposure - grade.exposure) * mk;

  /* ---------- intro timeline ---------- */
  const it = introT;
  partMat.uniforms.uIntro.value = Math.min(1, Math.max(0, (it - 0.12) / 2.7));
  let coreB = Math.min(1, it / 0.35);
  coreB *= 1 + 1.0 * Math.exp(-Math.max(it - 0.35, 0) * 2.6) * (it > 0.2 ? 1 : 0);
  skyMat.uniforms.uInt.value = Math.min(1, Math.max(0, (it - 0.05) / 1.6));
  starMat.uniforms.uFade.value = Math.min(1, Math.max(0, (it - 0.1) / 1.4));
  if (!introFired && it > 0.32) { introFired = true; addShock(new THREE.Vector3(), 0.55, 'intro'); flashAt(new THREE.Vector3(), 1.1, 7); exposureKick = Math.max(exposureKick, 0.25); }
  if (!introDone) {
    const k = ease(Math.min(1, it / INTRO_LEN));
    if (!orbit.drag) {
      orbit.theta = INTRO_FROM.theta + (INTRO_TO.theta - INTRO_FROM.theta) * k;
      orbit.phi = INTRO_FROM.phi + (INTRO_TO.phi - INTRO_FROM.phi) * k;
      orbit.radius = INTRO_FROM.radius + (orbit.tRadius - INTRO_FROM.radius) * k;
      orbit.tTheta = orbit.theta; orbit.tPhi = orbit.phi;
    }
    if (it >= INTRO_LEN || (orbit.drag && it > 1.2)) { introDone = true; }
  }
  if (it > 0.55 && !document.body.classList.contains('t-in')) document.body.classList.add('t-in');
  if (it > 3.5 && !document.body.classList.contains('t-out')) { document.body.classList.add('t-out'); document.body.classList.add('hud-in'); }

  /* ---------- camera ---------- */
  const idle = time - lastInput > 6 && introDone && !orbit.drag;
  if (idle) {
    orbit.tTheta += dt * 0.045;
    orbit.tPhi += (0.3 + Math.sin(time * 0.07) * 0.12 - orbit.tPhi) * dt * 0.2;
  }
  if (introDone) {
    const ck = 1 - Math.exp(-dt * 5.0);
    orbit.theta += (orbit.tTheta - orbit.theta) * ck;
    orbit.phi += (orbit.tPhi - orbit.phi) * ck;
    orbit.radius += (orbit.tRadius - orbit.radius) * (1 - Math.exp(-dt * 3.5));
  }
  const r = orbit.radius;
  camera.position.set(r * Math.sin(orbit.theta) * Math.cos(orbit.phi), r * Math.sin(orbit.phi), r * Math.cos(orbit.theta) * Math.cos(orbit.phi));
  camera.lookAt(lookTarget);
  camera.rotateZ(CAM_ROLL);
  if (shake > 0.001) {
    const s = shake * 0.35;
    camera.position.x += (Math.sin(time * 71.0) + Math.sin(time * 33.7)) * s * 0.5;
    camera.position.y += (Math.sin(time * 57.3) + Math.sin(time * 41.1)) * s * 0.5;
    camera.rotateZ(Math.sin(time * 23.0) * s * 0.04);
    shake *= Math.exp(-dt * 2.2);
  }
  camera.updateMatrixWorld();

  /* ---------- mouse in world ---------- */
  updateMouseWorld();
  tmpV2.copy(mouse.world).sub(mouse.prevWorld).divideScalar(Math.max(dt, 1e-3));
  if (tmpV2.length() > 40) tmpV2.setLength(40);
  mouse.vel.lerp(tmpV2, 0.35);
  if (!mouse.moved || orbit.drag) mouse.vel.multiplyScalar(Math.exp(-dt * 8));
  const spd = mouse.vel.length();
  const sculpt = introT > 1.2 && !orbit.drag && mouse.inside ? Math.min(1, spd / 2.5) : 0;
  simU.uSculpt.value = sculpt;
  simU.uMouseP.value.copy(mouse.world);
  simU.uMouseV.value.copy(mouse.vel).clampLength(0, 14);
  simU.uCamDir.value.copy(camera.getWorldDirection(tmpV));
  // spray emitter
  const pool = (TEX - SPRAY_ROW) * TEX;
  let emit = 0;
  if (sculpt > 0.05) {
    const want = Math.min(pool * 0.03, spd * 55 * QUALITY[qLevel].tex / 512) * (dt * 60);
    emit = Math.min(1, want / pool);
    sprayTotal += Math.round(want);
  }
  simU.uEmit.value = emit;
  simU.uEmitP0.value.copy(mouse.prevWorld); simU.uEmitP1.value.copy(mouse.world);
  simU.uEmitV.value.copy(mouse.vel).multiplyScalar(0.6).clampLength(0, 9);
  mouse.prevWorld.copy(mouse.world);
  mouse.moved = false;
  audio.spray(sculpt);
  // gravity well
  gravity += ((gravHeld ? 1 : 0) - gravity) * (1 - Math.exp(-dt * 6));
  simU.uGrav.value = gravity;

  /* ---------- supernova sequence ---------- */
  simU.uBlast.value = 0; simU.uNovaSpawn.value = 0;
  partMat.uniforms.uNovaOn.value = nova.t >= 0 ? 1 : 0;
  let coreScale = 1, coreHeat = 0;
  let novaGlow = 0;
  if (nova.t >= 0) {
    nova.t += dt;
    const t = nova.t;
    if (t < 0.75) {
      const k = t / 0.75;
      simU.uImplode.value = k * k;
      coreScale = 1 - 0.38 * k * k;
      coreHeat = k * k * 0.6;
      shake = Math.max(shake, k * 0.15);
    } else {
      simU.uImplode.value = 0;
      if (!nova.blasted) {
        nova.blasted = true;
        simU.uBlast.value = 1; simU.uNovaSpawn.value = 1;
        simU.uRecover.value = 0;
        addShock(new THREE.Vector3(), 2.4, 'nova');
        flashAt(new THREE.Vector3(), 1.5, 8);
        exposureKick = 0.6; shake = 1.0; caKick = 1.0; bloomKick = 0.6;
        novaRing.visible = true;
      }
      const a = t - 0.75;
      novaGlow = Math.min(1, a * 25) * Math.exp(-a * 0.9) * (1 + 1.0 * Math.exp(-a * 6));
      coreScale = 0.62 + 0.38 * (1 - Math.exp(-a * 1.6)) + 0.25 * Math.exp(-a * 3.0) * Math.sin(a * 9.0);
      coreHeat = 3.5 * Math.exp(-a * 1.4);
      simU.uRecover.value = Math.min(1, Math.max(0, (a - 0.5) / 3.5));
      // nova ring in the disk plane
      const rr = 1.2 + a * 9.0 + a * a * 0.6;
      novaRing.scale.setScalar(rr);
      ringMat.uniforms.uAlpha.value = 3.0 * Math.exp(-a * 0.75) * Math.min(1, a * 8.0);
      ringMat.uniforms.uWidth.value = 0.035 + a * 0.02;
      ringMat.uniforms.uColor.value.setRGB(...MODES[mode].shock);
      if (a > 6.0) { novaRing.visible = false; }
      if (a > 9.0) { nova.t = -1; simU.uRecover.value = 1; }
    }
  }
  novaGlowCur = novaGlow;
  exposureKick *= Math.exp(-dt * 3.6);
  caKick *= Math.exp(-dt * 1.8);
  bloomKick *= Math.exp(-dt * 2.0);

  /* ---------- shocks ---------- */
  const proj = tmpV;
  for (let i = shocks.length - 1; i >= 0; i--) { shocks[i].age += dt; if (shocks[i].age > 2.2) shocks.splice(i, 1); }
  for (let i = 0; i < 4; i++) {
    const s = shocks[i];
    const sim = simU.uShock.value[i];
    const comp = compMat.uniforms.uShock.value[i];
    const shell = shellPool[i];
    if (!s) { simU.uShockK.value.setComponent(i, 0); comp.w = 0; shell.visible = false; continue; }
    sim.set(s.o.x, s.o.y, s.o.z, s.age);
    const fade = Math.exp(-s.age * 1.6) * Math.min(1, s.age * 20);
    simU.uShockK.value.setComponent(i, s.k * fade);
    proj.copy(s.o).project(camera);
    const dist = camera.position.distanceTo(s.o);
    const worldR = s.age * 7.5;
    const rUV = worldR / (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    comp.set(proj.x * 0.5 + 0.5, proj.y * 0.5 + 0.5, rUV, s.k * Math.exp(-s.age * 2.0) * Math.min(1, s.age * 12) * (s.kind === 'nova' ? 1.6 : 1.0));
    shell.visible = true;
    shell.position.copy(s.o);
    shell.scale.setScalar(Math.max(0.01, worldR));
    shell.material.uniforms.uAlpha.value = (s.kind === 'nova' ? 3.0 : 2.4) * s.k * Math.exp(-s.age * 2.2) * Math.min(1, s.age * 15);
    shell.material.uniforms.uColor.value.setRGB(...MODES[mode].shock);
    shell.material.uniforms.uTime.value = time;
  }
  compMat.uniforms.uShockCol.value.set(...MODES[mode].shock);

  /* ---------- flash sprite ---------- */
  flashAmt *= Math.exp(-dt * 4.5);
  flash.visible = flashAmt > 0.01;
  flash.quaternion.copy(camera.quaternion);
  flash.scale.setScalar(flashScale * (1.0 + (1 - Math.min(1, flashAmt)) * 0.3));
  flashMat.uniforms.uAlpha.value = flashAmt;
  flashMat.uniforms.uColor.value.setRGB(...MODES[mode].shock).lerp(new THREE.Color(1, 1, 1), 0.2);

  /* ---------- core ---------- */
  const pulse = 1 + Math.sin(time * 1.7) * 0.012 + Math.sin(time * 4.3) * 0.004;
  core.scale.setScalar(coreScale * pulse);
  coreMat.uniforms.uTime.value = time;
  coreMat.uniforms.uBright.value = coreB * (1 + gravity * 0.25);
  coreMat.uniforms.uHeat.value = coreHeat + (coreB > 1 ? (coreB - 1) * 0.6 : 0);
  corona.quaternion.copy(camera.quaternion);
  corona.scale.setScalar(coreScale * pulse);
  coronaMat.uniforms.uTime.value = time;
  coronaMat.uniforms.uBright.value = coreB;
  coronaMat.uniforms.uHeat.value = coreHeat * 0.6;

  /* ---------- particles ---------- */
  simU.uTime.value = time; simU.uDt.value = Math.min(dt, 1 / 30);
  gpu.compute();
  partMat.uniforms.tPos.value = gpu.getCurrentRenderTarget(posVar).texture;
  partMat.uniforms.tVel.value = gpu.getCurrentRenderTarget(velVar).texture;
  partMat.uniforms.uTime.value = time;
  partMat.uniforms.uFlash.value = exposureKick * 0.15;
  gasMat.uniforms.tPos.value = partMat.uniforms.tPos.value; gasMat.uniforms.tVel.value = partMat.uniforms.tVel.value;
  gasMat.uniforms.uTime.value = time; gasMat.uniforms.uIntro.value = partMat.uniforms.uIntro.value;

  /* ---------- sky/stars ---------- */
  skyMat.uniforms.uTime.value = time;
  starMat.uniforms.uTime.value = time;

  /* ---------- progressive bake of other modes ---------- */
  if (!SHOT && introT > 5 && frame % 3 === 0) {
    for (let m = 0; m < 3; m++) if (!cubes[m].ready) { bakeFace(m); break; }
  }

  /* ---------- render ---------- */
  if (window.__skipRender) return;
  renderFrame();
}
function renderFrame() {
  const proj = tmpV;
  renderer.setRenderTarget(rtScene);
  renderer.setClearColor(0x000000, 1);
  renderer.clear(true, true, false);
  renderer.render(scene, camera);
  renderBloom();
  proj.set(0, 0, 0).project(camera);
  const cu = compMat.uniforms;
  cu.tScene.value = rtScene.texture;
  cu.tBloom.value = mips[0].texture;
  cu.tWide.value = mips[Math.min(2, mips.length - 1)].texture;
  cu.uCore.value.set(proj.x * 0.5 + 0.5, proj.y * 0.5 + 0.5);
  cu.uTime.value = time;
  cu.uExposure.value = grade.exposure * (1 + exposureKick * 0.55);
  cu.uBloom.value = 0.16 + bloomKick * 0.25;
  cu.uCA.value = 0.0045 + caKick * 0.05;
  cu.uSat.value = grade.sat;
  cu.uRays.value = 0.0;
  if (gravity > 0.002) {
    proj.copy(mouse.world).project(camera);
    const wd = camera.position.distanceTo(mouse.world);
    const R = 0.55 / (2 * wd * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    cu.uWell.value.set(proj.x * 0.5 + 0.5, proj.y * 0.5 + 0.5, R, gravity * (0.85 + 0.15 * Math.sin(time * 6.0)));
  } else cu.uWell.value.w = 0;
  cu.uNova.value = novaGlowCur;
  { const it = introT; cu.uDof.value = it < 1.2 ? Math.min(1, it / 0.4) : Math.max(0, 1 - (it - 1.2) / 2.6); }
  cu.uFlash.value = 0;
  fsPass(compMat, null);
}

function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  let dt = Math.min((now - lastNow) / 1000, 1 / 20);
  lastNow = now;
  if (FIXED) dt = FIXED_DT;
  if (window.__pauseAt && frame >= window.__pauseAt) { window.__pause = true; window.__pauseAt = 0; }
  if (window.__pause) return;
  step(dt);
  // fps + auto quality
  fpsFrames++;
  if (now - fpsT >= 1000) {
    fps = Math.round(fpsFrames * 1000 / (now - fpsT)); fpsFrames = 0; fpsT = now;
    $('fps').textContent = fps;
    $('pSpray').textContent = sprayTotal.toLocaleString('en-US');
    if (qAuto && introT > 4.5) {
      fpsHist.push(fps); if (fpsHist.length > 3) fpsHist.shift();
      const avg = fpsHist.reduce((a, b) => a + b, 0) / fpsHist.length;
      if (fpsHist.length === 3 && avg < 42 && qLevel > 0 && time - lastQualChange > 4 && !document.hidden) {
        qLevel--; lastQualChange = time; fpsHist = []; applyQuality();
        toast('自動降低畫質', 'AUTO QUALITY → ' + QUALITY[qLevel].key);
      }
    }
  }
}

/* ===================================================================
   BOOT
   =================================================================== */
buildTargets();
bakeAll(mode);
skyMat.uniforms.tA.value = skyMat.uniforms.tB.value = cubes[mode].rt.texture;
buildParticles();
buildStars(SHOT ? 26000 : QUALITY[qLevel].stars);
setMode(mode, true);
$('pQual').textContent = QUALITY[qLevel].zh + ' ' + QUALITY[qLevel].key + (qAuto ? ' · AUTO' : '');
document.body.classList.add('ready');
if (SHOT) document.body.classList.add('shot');
lastNow = performance.now();
loop();

/* debug / capture hooks */
window.__OF = {
  get frame() { return frame; }, get time() { return time; }, seed: seedHex,
  setMode: (m) => setMode(m), nova: triggerNova, reset: resetForge,
  shock: (x = 0, y = 0, z = 0, k = 1) => addShock(new THREE.Vector3(x, y, z), k, 'click'),
  shockAtScreen: (sx, sy, k = 1) => { mouse.ndc.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1); updateMouseWorld(); addShock(mouse.world, k, 'click'); },
  orbit, hud: setHud, bakeAll: () => { for (let m = 0; m < 3; m++) bakeAll(m); },
  mouse: (sx, sy) => { mouse.x = sx; mouse.y = sy; mouse.inside = true; mouse.moved = true; mouse.ndc.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1); },
  grav: (on) => { gravHeld = on; },
  get novaT() { return nova.t; },
  redraw: () => renderFrame(),
  sync: () => { const gl = renderer.getContext(); const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return px[0]; },
  get info() { return { N, TEX, qLevel, PR, fps }; },
};
