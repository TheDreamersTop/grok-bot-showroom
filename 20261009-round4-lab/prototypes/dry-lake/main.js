// Dry Lake (龜裂) — wildcard prototype D.
// Drying mud cracks in a hierarchical network (long early cracks, later ones meet them at T-junctions).
// "Memory of flow" (Nakahara & Matsuo): paste that was stirred remembers the motion, and its cracks later run
// parallel to the stroke — so you draw in wet mud, and the drying ground redraws your gesture as cracks.
import * as THREE from 'three';
const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot'), TSTEPS = +(Q.get('t') || 0);
const W = innerWidth, H = innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
let seed = +(Q.get('seed') || 7);
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------------------------------------------------------------- simulation grid (cells), crack geometry is vector
const CS = +(Q.get('cs') || 4);                      // px per cell
const GW = Math.ceil(W / CS), GH = Math.ceil(H / CS), GN = GW * GH;
const moist = new Float32Array(GN), strength = new Float32Array(GN), dmin = new Float32Array(GN), occ = new Int32Array(GN);
const memX = new Float32Array(GN), memY = new Float32Array(GN);   // doubled-angle orientation memory
let cracks = [], tips = [], nextId = 1, dryClock = 0;
function reset() {
  for (let i = 0; i < GN; i++) { moist[i] = 1; strength[i] = 0.55 + 0.45 * rnd(); dmin[i] = 1e3; occ[i] = 0; memX[i] = 0; memY[i] = 0; }
  // domain border acts as a crack (lake shore)
  cracks = []; tips = []; nextId = 1; dryClock = 0;
  for (let x = 0; x < GW; x++) { stamp(x, 0, -1); stamp(x, GH - 1, -1); } for (let y = 0; y < GH; y++) { stamp(0, y, -1); stamp(GW - 1, y, -1); }
}
function stamp(cx, cy, id) {   // mark occupancy + update distance-to-nearest-crack in a disc
  cx = Math.round(cx); cy = Math.round(cy); if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return;
  occ[cy * GW + cx] = id; const R = 40;
  for (let y = Math.max(0, cy - R); y <= Math.min(GH - 1, cy + R); y++) for (let x = Math.max(0, cx - R); x <= Math.min(GW - 1, cx + R); x++) {
    const d = Math.hypot(x - cx, y - cy); if (d > R) continue; const i = y * GW + x; if (d < dmin[i]) dmin[i] = d; }
}
// ---------------------------------------------------------------- stroke memory (and a visible groove in the wet mud)
const groove = document.createElement('canvas'); groove.width = W; groove.height = H; const gctx = groove.getContext('2d');
function strokeMem(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (L < 0.5) return;
  const c2 = (dx * dx - dy * dy) / (L * L), s2 = 2 * dx * dy / (L * L);
  const R = 34 / CS; const steps = Math.ceil(L / CS);
  for (let k = 0; k <= steps; k++) { const px = (x0 + dx * k / steps) / CS, py = (y0 + dy * k / steps) / CS;
    for (let y = Math.max(0, Math.floor(py - R)); y <= Math.min(GH - 1, Math.ceil(py + R)); y++) for (let x = Math.max(0, Math.floor(px - R)); x <= Math.min(GW - 1, Math.ceil(px + R)); x++) {
      const i = y * GW + x; if (moist[i] < 0.6) continue; const w = Math.exp(-((x - px) ** 2 + (y - py) ** 2) / (R * R * 0.5));
      memX[i] += (c2 - memX[i]) * w * 0.5; memY[i] += (s2 - memY[i]) * w * 0.5; } }
  gctx.strokeStyle = 'rgba(255,255,255,0.5)'; gctx.lineCap = 'round'; gctx.lineWidth = 26; gctx.beginPath(); gctx.moveTo(x0, y0); gctx.lineTo(x1, y1); gctx.stroke();
}
// ---------------------------------------------------------------- drying + cracking
const LC = +(Q.get('lc') || 20);    // characteristic crack spacing (cells) at full dryness
function stress(i) { return Math.max(0, (1 - moist[i]) - 0.25) / 0.75; }
function prefDir(x, y, fallback) {
  const i = Math.round(y) * GW + Math.round(x); if (i < 0 || i >= GN) return fallback;
  const mx = memX[i], my = memY[i], m = Math.hypot(mx, my); if (m < 0.08) return fallback;
  const a = 0.5 * Math.atan2(my, mx); return { a, m: Math.min(1, m) };
}
function nucleate() {
  const tries = 300; let best = -1, bs = 0;
  for (let k = 0; k < tries; k++) { const x = 2 + Math.floor(rnd() * (GW - 4)), y = 2 + Math.floor(rnd() * (GH - 4)); const i = y * GW + x;
    const s = stress(i) * Math.min(dmin[i], 60) / (LC * (1.35 - 0.75 * stress(i))); if (s > strength[i] && s > bs) { bs = s; best = i; } }
  if (best < 0) return;
  const x = best % GW, y = (best / GW) | 0;
  const p = prefDir(x, y, null); let a = rnd() * Math.PI;
  if (p) a = p.a + (rnd() - .5) * 0.6 * (1 - p.m);
  // secondary cracks in a polygon prefer to run perpendicular to the nearest crack (classic T-junctions): approximate via gradient of dmin
  else { const gx = dmin[best + 1] - dmin[best - 1], gy = dmin[best + GW] - dmin[best - GW]; if (Math.hypot(gx, gy) > 0.1) a = Math.atan2(gy, gx); }
  const id = nextId++; const gen = cracks.length;
  const c = { id, pts: [[x, y]], pts2: [[x, y]], born: dryClock, w: 0, gen }; cracks.push(c);
  tips.push({ c, x, y, a, side: 0, n: 0 }, { c, x, y, a: a + Math.PI, side: 1, n: 0 });
  stamp(x, y, id);
}
function growTips() {
  const alive = [];
  for (const t of tips) {
    let stop = false;
    for (let sub = 0; sub < 3 && !stop; sub++) {
      const p = prefDir(t.x, t.y, null);
      let da = (rnd() - .5) * 0.35;
      if (p) { let d = p.a - t.a; while (d > Math.PI / 2) d -= Math.PI; while (d < -Math.PI / 2) d += Math.PI; da += d * 0.35 * p.m; }
      t.a += da; const nx = t.x + Math.cos(t.a) * 0.9, ny = t.y + Math.sin(t.a) * 0.9;
      const cx = Math.round(nx), cy = Math.round(ny);
      if (cx < 1 || cy < 1 || cx >= GW - 1 || cy >= GH - 1) { stop = true; break; }
      const o = occ[cy * GW + cx]; const i = cy * GW + cx;
      if (o !== 0 && o !== t.c.id) { (t.side ? t.c.pts2 : t.c.pts).push([nx, ny]); stop = true; break; }   // T-junction
      if (stress(i) < 0.05) { stop = true; break; }
      t.x = nx; t.y = ny; t.n++; (t.side ? t.c.pts2 : t.c.pts).push([nx, ny]); stamp(nx, ny, t.c.id);
      if (t.n > 900) stop = true;
    }
    if (!stop) alive.push(t);
  }
  tips = alive;
}
let sunX = -1, sunY = -1, sunOn = 0;
function dry(rate) {
  dryClock += rate;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const i = y * GW + x;
    let r = rate * (0.75 + 0.5 * Math.sin(x * 0.05 + y * 0.03) * 0.5);
    r *= 1 + 0.8 * Math.exp(-dmin[i] / 12);                 // edges of plates dry faster
    if (sunOn) { const d2 = ((x * CS - sunX) ** 2 + (y * CS - sunY) ** 2) / (W * W * 0.06); r *= 0.25 + 4 * Math.exp(-d2); }
    moist[i] = Math.max(0, moist[i] - r); }
}
function simStep(rate) { dry(rate); if (tips.length < 60) for (let k = 0; k < 2; k++) nucleate(); growTips(); }

// ---------------------------------------------------------------- crack drawing (vector, at screen resolution)
const crackCv = document.createElement('canvas'); crackCv.width = W; crackCv.height = H; const cctx = crackCv.getContext('2d');
function drawCracks() {
  cctx.fillStyle = '#000'; cctx.fillRect(0, 0, W, H); cctx.lineCap = 'round'; cctx.lineJoin = 'round';
  for (const c of cracks) {
    const age = Math.max(0, dryClock - c.born); const wpx = Math.min(1, 0.2 + age * 1.6) * CS * (c.gen < 25 ? 2.6 : c.gen < 90 ? 1.8 : 1.2);
    const path = c.pts.slice().reverse().concat(c.pts2.slice(1)); if (path.length < 2) continue;
    cctx.strokeStyle = '#fff'; cctx.lineWidth = wpx; cctx.beginPath();
    cctx.moveTo(path[0][0] * CS, path[0][1] * CS); for (let k = 1; k < path.length; k++) cctx.lineTo(path[k][0] * CS, path[k][1] * CS);
    cctx.stroke(); }
}
// ---------------------------------------------------------------- render
const mkTex = cv => { const t = new THREE.CanvasTexture(cv); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; return t; };
const crackTex = mkTex(crackCv), grooveTex = mkTex(groove);
const moistTex = new THREE.DataTexture(new Uint8Array(GN * 4), GW, GH, THREE.RGBAFormat); moistTex.magFilter = THREE.LinearFilter; moistTex.minFilter = THREE.LinearFilter; moistTex.flipY = false;
function uploadMoist() { const d = moistTex.image.data; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const i = y * GW + x, j = ((GH - 1 - y) * GW + x) * 4;
  d[j] = moist[i] * 255; d[j + 1] = Math.min(255, dmin[i] * 4); d[j + 2] = 0; d[j + 3] = 255; } moistTex.needsUpdate = true; }
const mat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3,
  uniforms: { C: { value: crackTex }, G: { value: grooveTex }, M: { value: moistTex }, res: { value: new THREE.Vector2(W, H) }, sun: { value: new THREE.Vector3(-0.62, 0.55, 0.30).normalize() }, sunPos: { value: new THREE.Vector3(-1, -1, 0) } },
  vertexShader: `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `precision highp float; uniform sampler2D C, G, M; uniform vec2 res; uniform vec3 sun, sunPos; in vec2 vUv; out vec4 o;
  float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.1+3.1; a*=.5; } return s; }
  vec2 U(vec2 uv){ return vec2(uv.x, 1.-uv.y); }
  float height(vec2 uv){ vec2 c=U(uv);
    float cr = texture(C,c).r;                                                     // crack opening (sharp)
    float near = textureLod(C,c,2.5).r*0.6 + textureLod(C,c,3.5).r*0.9 + textureLod(C,c,4.5).r*0.9;   // proximity to cracks (blurry)
    float m = texture(M,uv).r;
    float dryk = 1.-smoothstep(0.15,0.75,m);
    float g = textureLod(G,c,1.5).r;
    float h = 0.;
    h += dryk*(0.9*smoothstep(0.,1.0,near) - 0.25*smoothstep(0.,1.,textureLod(C,c,6.).r));                                     // plate edges curl up as they dry
    h -= textureLod(C,c,0.8).r*1.4*dryk;                                                              // the crack itself is a deep slot
    h -= g*0.35*(1.-0.6*dryk);                                                     // your finger groove
    h += (fbm(uv*res/9.)-.5)*0.10 + (fbm(uv*res/3.5)-.5)*0.025*dryk;               // grain
    return h; }
  void main(){ vec2 e=1./res; float h=height(vUv);
    float hx=height(vUv+vec2(e.x,0.))-height(vUv-vec2(e.x,0.)), hy=height(vUv+vec2(0.,e.y))-height(vUv-vec2(0.,e.y));
    vec3 n=normalize(vec3(-hx*9.0, -hy*9.0, 1.));
    float m = texture(M,vUv).r; float dryk = 1.-smoothstep(0.15,0.75,m);
    vec2 c=U(vUv); float cr=texture(C,c).r; float near=textureLod(C,c,3.).r;
    vec3 wet = vec3(.10,.065,.04), dryc = vec3(.80,.58,.38);
    float tone = fbm(vUv*vec2(3.,2.))*0.25 + fbm(vUv*res/60.)*0.15;
    vec3 alb = mix(wet, dryc*(0.85+tone), dryk);
    alb = mix(alb, alb*vec3(1.08,1.02,.92), smoothstep(.2,.8,near)*dryk);          // salt-pale curled rims
    // shadow: march toward the sun in screen space on the height field
    vec2 so = U(vUv + normalize(sun.xy)*e*5.); vec2 so2 = U(vUv + normalize(sun.xy)*e*11.);
    float sh = 1. - dryk*(0.55*smoothstep(.15,.7,textureLod(C,so,1.2).r) + 0.25*smoothstep(.1,.6,textureLod(C,so2,2.).r));
    sh = max(sh, 0.);
    float dif = clamp(dot(n,sun),0.,1.)*sh;
    vec3 col = alb*(dif*vec3(2.7,1.95,1.30)*1.25 + vec3(.26,.32,.50)*(0.35+0.25*n.z));
    vec3 slot = mix(vec3(.035,.022,.016), alb*0.35, 1.-cr); col = mix(col, slot, smoothstep(.35,.9,cr)*dryk);                                                       // the slot is dark
    // wet sheen: sky reflection + sun glint
    vec3 V=vec3(0.,-.35,1.); V=normalize(V); vec3 R=reflect(-V,n);
    float fr=0.06+0.94*pow(1.-max(dot(n,V),0.),5.);
    vec3 sky = mix(vec3(.95,.70,.45), vec3(.30,.42,.66), clamp(vUv.y*1.1-.05 + R.y*0.6,0.,1.));
    float wetk = smoothstep(0.35,0.85,m);
    col = mix(col, col*0.7 + sky*(0.10+fr*0.6), wetk*0.8);
    col += wetk*pow(max(dot(R,normalize(sun+vec3(0,0,.4))),0.),120.)*vec3(1.,.85,.6)*2.5;
    // the sun under the cursor: warm spot
    if (sunPos.z>0.) { float d=length((vUv-sunPos.xy)*res)/res.y; col *= 1.+0.35*sunPos.z*exp(-d*d*12.)*vec3(1.,.8,.55); }
    vec2 p=vUv-.5; col *= 1.-0.35*dot(p,p)*1.6;
    col = clamp((col*(2.51*col+.03))/(col*(2.43*col+.59)+.14),0.,1.); col=pow(col,vec3(1./2.2));
    col += (hash(gl_FragCoord.xy)-.5)/255.;
    o=vec4(col,1.); }` });
const scene = new THREE.Scene(); scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)); const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function render() { drawCracks(); crackTex.needsUpdate = true; grooveTex.needsUpdate = true; uploadMoist(); renderer.render(scene, cam); }

// ---------------------------------------------------------------- interaction
let down = false, lx = 0, ly = 0, idle = 0;
addEventListener('pointerdown', e => { down = true; lx = e.clientX; ly = e.clientY; });
addEventListener('pointerup', () => { down = false; });
addEventListener('pointermove', e => { if (down) { strokeMem(lx, ly, e.clientX, e.clientY); lx = e.clientX; ly = e.clientY; idle = 0; } sunX = e.clientX; sunY = e.clientY; });
addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') { reset(); gctx.clearRect(0, 0, W, H); } });

reset();
// scripted gesture for shot mode: a spiral (or ?g=wave)
function scriptGesture() {
  const g = Q.get('g') || 'spiral'; const pts = [];
  if (g === 'spiral') for (let k = 0; k <= 700; k++) { const a = k * 0.03, r = 18 + a * 34; pts.push([W * 0.5 + r * Math.cos(a), H * 0.5 + r * Math.sin(a) * 0.95]); }
  else for (let k = 0; k <= 400; k++) { const x = W * 0.1 + k / 400 * W * 0.8; pts.push([x, H * 0.5 + Math.sin(k * 0.05) * H * 0.18]); }
  for (let k = 1; k < pts.length; k++) strokeMem(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]);
}
if (SHOT) {
  if (!Q.has('nog')) scriptGesture();
  if (Q.has('sun')) { sunOn = 1; sunX = W * (+(Q.get('sun')) || 0.3); sunY = H * 0.4; }
  let s = 0; const chunk = () => { const end = Math.min(TSTEPS, s + 40); for (; s < end; s++) simStep(0.0016); if (s < TSTEPS) setTimeout(chunk, 0); else { render(); window.__ready = true; } }; chunk();
} else {
  const loop = () => { requestAnimationFrame(loop); idle++; if (!down && idle > 30) { for (let k = 0; k < 2; k++) simStep(0.0012 * (+(Q.get('dr')) || 1)); }
    mat.uniforms.sunPos.value.set(sunX / W, 1 - sunY / H, down ? 0 : 1); sunOn = down ? 0 : 1; render(); window.__ready = true; }; loop();
}
window.__stats = () => ({ cracks: cracks.length, tips: tips.length, dry: dryClock });
