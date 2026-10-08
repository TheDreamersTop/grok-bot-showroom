import { NOISE } from './noise.js';

/* ------------------------------------------------------------------ */
/*  Shared: per-particle orbital parameters (used by init + sim)      */
/* ------------------------------------------------------------------ */
const ORBIT = /* glsl */`
const float GM = 7.4;
const float ARM_PITCH = 2.1;
const float ARM_SPEED = 0.10;
struct Orbit { float rHome; vec3 axis; float kz; float turb; float relax; float kr; float spin; float halo; };
vec3 anyPerp(vec3 a){ return normalize(abs(a.y) < 0.9 ? cross(a, vec3(0.0,1.0,0.0)) : cross(a, vec3(1.0,0.0,0.0))); }
Orbit orbitFor(vec4 h, vec4 h2, vec3 mW){
  Orbit o;
  float halo = step(0.80, h.y);
  o.halo = halo;
  vec3 up = vec3(0.0, 1.0, 0.0);
  // random tilt direction in the disk plane
  float ta = h.z * 6.2831853;
  vec3 tv = vec3(cos(ta), 0.0, sin(ta));
  float tm = (h.w - 0.5) * 2.0;
  // PLASMA: flared hot disk + puffy halo of inclined orbits
  float rP = 1.45 + 6.2 * pow(h.x, 1.45);
  vec3 axP = normalize(up + tv * tm * mix(0.05, 1.1, halo));
  // CRYSTAL: discrete razor-thin rings + three crossed orbital planes
  float ring = floor(h.x * 8.0);
  float rC = 1.7 + ring * 0.62 + (h2.w - 0.5) * mix(0.04, 0.10, step(4.0, ring));
  float pa = floor(h.z * 3.0) * 2.0943951 + 0.4;
  vec3 axCh = normalize(vec3(cos(pa) * 0.95, 0.42, sin(pa) * 0.95));
  vec3 axC = halo > 0.5 ? axCh : normalize(up + tv * tm * 0.012);
  if (halo > 0.5) rC = 2.2 + floor(h.x * 3.0) * 0.95 + (h2.w - 0.5) * 0.05;
  // ASH: wide, thick, drifting smoke-and-ember disk
  float rA = 1.8 + 7.6 * pow(h.x, 1.2);
  vec3 axA = normalize(up + tv * tm * mix(0.07, 0.7, halo));
  o.rHome = dot(mW, vec3(rP, rC, rA));
  o.axis = normalize(mW.x * axP + mW.y * axC + mW.z * axA + vec3(0.0, 1e-4, 0.0));
  o.kz = dot(mW, vec3(1.6, 7.0, 1.1));
  o.turb = dot(mW, vec3(0.42, 0.04, 0.34));
  o.relax = dot(mW, vec3(0.85, 1.8, 0.55));
  o.kr = dot(mW, vec3(0.32, 1.6, 0.4));
  o.spin = dot(mW, vec3(1.0, 1.0, 0.72));
  return o;
}
vec3 homePos(Orbit o, vec4 h, vec4 h2){
  vec3 u = anyPerp(o.axis); vec3 w = cross(o.axis, u);
  float arm = floor(h2.y * 3.0);
  float th = arm * 2.0943951 + log(o.rHome) * 2.6 + (h2.z - 0.5) * mix(1.1, 6.2831853, o.halo);
  float hgt = (h2.x - 0.5) * (0.04 + 0.05 * o.rHome) * (1.0 - o.halo);
  return o.rHome * (cos(th) * u + sin(th) * w) + o.axis * hgt;
}
`;

/* ------------------------------------------------------------------ */
/*  GPGPU: init                                                       */
/* ------------------------------------------------------------------ */
export const initPosFrag = /* glsl */`
uniform vec3 uMode; uniform float uSprayRow;
${NOISE}
${ORBIT}
void main(){
  vec2 coord = floor(gl_FragCoord.xy);
  vec4 h = hash42(coord); vec4 h2 = hash42(coord + 17.31);
  if (coord.y >= uSprayRow) { gl_FragColor = vec4(0.0, -50.0, 0.0, 0.0); return; }
  Orbit o = orbitFor(h, h2, uMode);
  gl_FragColor = vec4(homePos(o, h, h2), -1.0);
}`;
export const initVelFrag = /* glsl */`
uniform vec3 uMode; uniform float uSprayRow;
${NOISE}
${ORBIT}
void main(){
  vec2 coord = floor(gl_FragCoord.xy);
  vec4 h = hash42(coord); vec4 h2 = hash42(coord + 17.31);
  if (coord.y >= uSprayRow) { gl_FragColor = vec4(0.0); return; }
  Orbit o = orbitFor(h, h2, uMode);
  vec3 p = homePos(o, h, h2);
  vec3 er = normalize(p - o.axis * dot(p, o.axis));
  vec3 tang = normalize(cross(o.axis, er));
  gl_FragColor = vec4(tang * sqrt(GM / o.rHome) * o.spin, 0.5);
}`;

/* ------------------------------------------------------------------ */
/*  GPGPU: shared spawn logic for spray / ejecta pool                 */
/* ------------------------------------------------------------------ */
const SIM_UNIFORMS = /* glsl */`
uniform float uTime, uDt;
uniform vec3 uMode;
uniform vec3 uMouseP, uMouseV, uCamDir;
uniform float uSculpt, uGrav;
uniform vec4 uShock[4];
uniform vec4 uShockK;
uniform float uImplode, uBlast, uRecover, uSprayRow, uEmit, uNovaSpawn;
uniform vec3 uEmitP0, uEmitP1, uEmitV;
`;
const SPAWN = /* glsl */`
// returns 0 = stay dead, 1 = spray spawn, 2 = nova ejecta
float spawnKind(vec2 coord){
  if (uNovaSpawn > 0.5) return 2.0;
  float r = hash12(coord * 1.37 + fract(uTime * 13.17) * 301.0);
  return r < uEmit ? 1.0 : 0.0;
}
vec3 novaDir(vec4 h){
  float z = h.x * 2.0 - 1.0; float a = h.y * 6.2831853; float s = sqrt(1.0 - z*z);
  vec3 d = vec3(s * cos(a), z * 0.55, s * sin(a));
  return normalize(d);
}
`;

export const velFrag = /* glsl */`
${SIM_UNIFORMS}
${NOISE}
${ORBIT}
${SPAWN}
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 coord = floor(gl_FragCoord.xy);
  vec4 h = hash42(coord); vec4 h2 = hash42(coord + 17.31);
  vec4 P = texture2D(texturePosition, uv);
  vec4 V = texture2D(textureVelocity, uv);
  vec3 pos = P.xyz; vec3 vel = V.xyz; float temp = V.w; float life = P.w;
  bool spray = coord.y >= uSprayRow;
  if (spray && life <= 0.0) {
    float k = spawnKind(coord);
    if (k > 1.5) { gl_FragColor = vec4(novaDir(h) * (5.0 + h2.y * 16.0), 0.7 + 0.6 * h2.z * h2.z); return; }
    if (k > 0.5) {
      vec3 jit = (h2.xyz - 0.5) * 2.0;
      gl_FragColor = vec4(uEmitV * (0.55 + 0.6 * h.w) + jit * (0.5 + 0.25 * length(uEmitV)), 0.88 + 0.16 * h2.z);
      return;
    }
    gl_FragColor = vec4(0.0); return;
  }
  Orbit o = orbitFor(h, h2, uMode);
  float rr = length(pos);
  vec3 e = pos / max(rr, 1e-4);
  float hgt = dot(pos, o.axis);
  vec3 inPlane = pos - o.axis * hgt;
  float rc = max(length(inPlane), 1e-3);
  vec3 er = inPlane / rc;
  vec3 tang = normalize(cross(o.axis, er));
  float vk = sqrt(GM / max(rc, 0.9));
  vec3 acc = vec3(0.0);
  float rec = uRecover;
  float sprayK = spray ? 0.35 : 1.0;
  // keep in orbital plane, pull toward home shell
  acc -= o.axis * hgt * o.kz * rec * sprayK;
  acc -= er * (rc - o.rHome) * o.kr * rec * sprayK;
  // relax towards Keplerian circular velocity
  acc += (tang * vk * o.spin - vel) * o.relax * mix(0.25, 1.0, rec);
  // curl-noise turbulence
  float plume = smoothstep(0.82, 1.0, h.w) * (0.6 + 0.4 * sin(uTime * 0.3 + h.z * 30.0));
  vec3 cp = pos * 0.42 + vec3(0.0, uTime * 0.06, uTime * 0.02);
  vec3 turbA = bitangentCurl(cp) * o.turb * 0.55;
  turbA -= o.axis * dot(turbA, o.axis) * 0.75 * (1.0 - uMode.z);
  acc += turbA;
  // density-wave spiral arms (trailing, rigidly rotating pattern)
  float armK = (uMode.x + uMode.z * 1.0) * (1.0 - o.halo) * (spray ? 0.0 : 1.0);
  if (armK > 0.01) {
    float th = atan(pos.z, pos.x);
    float ph = 2.0 * (th - log(rc) * ARM_PITCH + uTime * ARM_SPEED);
    acc += tang * (2.2 * sin(ph) / rc) * armK * smoothstep(1.3, 2.2, rc);
  }
  acc += bitangentCurl(pos * 1.1 - vec3(uTime * 0.11)) * 0.7 * uMode.z * (0.2 + plume);
  // ash buoyancy: embers rise
  acc += vec3(0.0, 1.0, 0.0) * uMode.z * (0.06 + 2.4 * plume) * (1.0 - o.halo * 0.5);
  // core surface repulsion
  if (rr < 1.18) acc += e * (1.18 - rr) * 90.0;
  // mouse sculpt (moving the cursor drags matter along)
  vec3 dm = pos - uMouseP; float dm2 = dot(dm, dm);
  float fall = exp(-dm2 / 1.1);
  acc += uMouseV * fall * uSculpt * 2.6;
  temp += fall * uSculpt * min(length(uMouseV), 8.0) * uDt * 0.9;
  // gravity well (Shift): attract + swirl
  if (uGrav > 0.001) {
    vec3 tg = -dm; float d2 = dm2 + 0.30; float id = inversesqrt(d2);
    acc += tg * id * id * id * 9.0 * uGrav;
    acc += cross(uCamDir, tg) * id * id * 5.0 * uGrav;
    temp += uGrav * uDt * 1.3 / (1.0 + d2 * 1.5);
  }
  // shockwaves (expanding spherical fronts)
  for (int i = 0; i < 4; i++) {
    vec4 s = uShock[i]; float k = uShockK[i];
    if (k <= 0.0) continue;
    vec3 ds = pos - s.xyz; float d = length(ds);
    float front = s.w * 7.5;
    float x = (d - front) / (0.45 + s.w * 0.6);
    float band = exp(-x*x) * k;
    acc += ds / max(d, 1e-3) * band * 30.0;
    temp += band * uDt * 2.6;
  }
  // supernova
  acc -= e * uImplode * 22.0 / max(rr, 0.6);
  temp += uImplode * uDt * 1.5;
  if (uBlast > 0.0) { vel += e * uBlast * (4.0 + h2.x * 10.0) * (0.5 + 0.5 * smoothstep(8.0, 1.0, rr)); temp = 0.55 + 0.5 * h2.y * h2.y; }
  vel += acc * uDt;
  // temperature model: hotter inside, heated by excess speed, cools over time
  float baseMul = dot(uMode, vec3(1.0, 0.85, 0.8));
  float base = clamp(2.4 / rc, 0.0, 1.0) * baseMul * mix(1.0, 0.6, o.halo);
  float excess = max(length(vel) - vk * 1.15, 0.0) * 0.06;
  temp = mix(temp, base + excess, 1.0 - exp(-uDt * (spray ? 0.55 : 1.1)));
  float sp = length(vel);
  if (sp > 38.0) vel *= 38.0 / sp;
  gl_FragColor = vec4(vel, clamp(temp, 0.0, 1.5));
}`;

export const posFrag = /* glsl */`
${SIM_UNIFORMS}
${NOISE}
${SPAWN}
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 coord = floor(gl_FragCoord.xy);
  vec4 h = hash42(coord); vec4 h2 = hash42(coord + 17.31);
  vec4 P = texture2D(texturePosition, uv);
  vec4 V = texture2D(textureVelocity, uv);
  vec3 pos = P.xyz; float life = P.w;
  bool spray = coord.y >= uSprayRow;
  if (spray) {
    if (life <= 0.0) {
      float k = spawnKind(coord);
      if (k > 1.5) { gl_FragColor = vec4(novaDir(h) * 1.2, 3.0 + h2.z * 4.0); return; }
      if (k > 0.5) {
        vec3 p = mix(uEmitP0, uEmitP1, h2.w) + (h.xyz - 0.5) * 0.22;
        gl_FragColor = vec4(p, 1.6 + h.w * 2.6); return;
      }
      gl_FragColor = vec4(0.0, -50.0, 0.0, 0.0); return;
    }
    life = max(life - uDt, 0.0);
  } else life = -1.0;
  pos += V.xyz * uDt;
  float r = length(pos);
  if (r > 70.0) pos *= 70.0 / r;
  gl_FragColor = vec4(pos, life);
}`;

/* ------------------------------------------------------------------ */
/*  Particle render (instanced, velocity-stretched soft quads)        */
/* ------------------------------------------------------------------ */
export const particleVert = /* glsl */`
uniform sampler2D tPos, tVel;
uniform float uTime, uIntro, uSize, uStreak, uIntensity, uSprayV, uFlash, uTex, uNovaOn;
uniform vec3 uMode;
uniform vec2 uRes;
attribute vec2 aRef;
attribute vec4 aRnd;
varying vec3 vCol;
varying vec3 vQ; // x along, y across, z half length
varying float vSize;
${NOISE}
vec3 palette(float t, vec3 mW, float cold){
  vec3 pP = ramp4(t, vec3(0.10,0.06,0.55), vec3(0.85,0.08,0.55), vec3(1.0,0.38,0.10), vec3(1.0,0.86,0.62));
  vec3 pC = ramp4(t, vec3(0.07,0.05,0.42), vec3(0.45,0.17,1.0), vec3(0.12,0.78,1.0), vec3(0.85,0.97,1.0));
  vec3 pA = ramp4(t, vec3(0.16,0.012,0.008), vec3(0.72,0.06,0.015), vec3(1.0,0.30,0.035), vec3(1.0,0.78,0.42));
  vec3 cP = vec3(0.10, 0.55, 1.0);  // blue-teal counterpoint
  vec3 cC = vec3(1.0, 0.35, 0.80);   // pink glints
  vec3 cA = vec3(0.45, 0.55, 0.65);  // cold ash smoke
  vec3 warm = mW.x * pP + mW.y * pC + mW.z * pA;
  vec3 coldc = mW.x * cP + mW.y * cC + mW.z * cA;
  return mix(warm, coldc * (0.55 + 0.9 * t), cold);
}
void main(){
  vec4 P = texture2D(tPos, aRef);
  vec4 V = texture2D(tVel, aRef);
  vec3 pos = P.xyz; vec3 vel = V.xyz; float temp = V.w; float life = P.w;
  float alpha = 1.0;
  bool isSpray = life >= 0.0;
  if (isSpray) { alpha = smoothstep(0.0, 0.6, life); if (life <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } }
  // opening: matter unfurls from the core in a spiral
  if (uIntro < 1.0) {
    float rr = length(pos);
    float k = clamp(uIntro * 1.6 - (rr / 11.0) * 0.6, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - k, 3.0);
    float a = (1.0 - e) * 3.2;
    float c = cos(a), s = sin(a);
    pos.xz = mat2(c, -s, s, c) * pos.xz;
    pos *= mix(0.12, 1.0, e);
    temp += (1.0 - e) * 0.35;
    alpha *= smoothstep(0.0, 0.15, uIntro + aRnd.x * 0.05) * (0.25 + 0.75 * e * e);
  }
  vec4 c0 = projectionMatrix * viewMatrix * vec4(pos, 1.0);
  if (c0.w < 0.2) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float vlen = length(vel);
  vec3 vv = vel * uStreak * (isSpray ? uSprayV : 1.0) * smoothstep(2.0, 5.5, vlen);
  vec4 c1 = projectionMatrix * viewMatrix * vec4(pos - vv, 1.0);
  c1.w = max(c1.w, 0.2);
  vec2 s0 = c0.xy / c0.w * 0.5 * uRes;
  vec2 s1 = c1.xy / c1.w * 0.5 * uRes;
  vec2 d = s0 - s1;
  float len = min(length(d), 48.0);
  vec2 dir = len > 1e-3 ? normalize(d) : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  // projected size in pixels (half width)
  float world = uSize * (0.55 + 0.9 * aRnd.y * aRnd.y) * (isSpray ? 1.25 : 1.0);
  float px = world * projectionMatrix[1][1] * 0.5 * uRes.y / c0.w;
  float energy = 1.0;
  if (px < 0.85) { energy = (px * px) / (0.85 * 0.85); px = 0.85; }
  px = min(px, 9.0);
  float hl = len * 0.5;
  vec2 center = s0 - dir * hl;
  vec2 off = dir * position.x * (px + hl) + nrm * position.y * px;
  vec2 sp = center + off;
  gl_Position = vec4(sp / (0.5 * uRes) * c0.w, c0.z, c0.w);
  vQ = vec3(position.x * (px + hl), position.y * px, hl);
  vSize = px;
  // colour / temperature
  float t = clamp(temp, 0.0, 1.5);
  if (isSpray && uNovaOn < 0.5) t = min(t, 0.80);
  vec4 hh = hash42(floor(aRef * uTex));
  float halo = step(0.80, hh.y);
  float cold = max(step(0.93, aRnd.z), halo * step(0.35, aRnd.z)) * (1.0 - smoothstep(0.6, 1.05, t)) * (1.0 - float(isSpray));
  vec3 col = palette(min(t, 1.0), uMode, cold);
  col = mix(col, vec3(0.75, 0.86, 1.0) * 1.2, smoothstep(1.0, 1.25, t) * 0.85);
  float rcd = length(pos.xz);
  float armPh = 2.0 * (atan(pos.z, pos.x) - log(max(rcd, 0.5)) * 2.1 + uTime * 0.10);
  float arm = pow(0.5 + 0.5 * cos(armPh), 3.0) * (1.0 - halo) * (uMode.x + uMode.z * 1.0) * smoothstep(1.4, 2.4, rcd) * (isSpray ? 0.0 : 1.0);
  float b = 0.30 + 0.9 * t + 0.8 * t * t + 1.2 * max(t - 1.0, 0.0);
  b *= mix(1.0, mix(mix(0.25, 0.08, uMode.z), mix(2.3, 3.2, uMode.z), arm), (uMode.x + uMode.z * 1.0) * (1.0 - halo) * (isSpray ? 0.0 : 1.0));
  col = mix(col, mix(col, vec3(0.75, 0.85, 1.0) * (0.6 + t), 0.35), arm * step(0.7, aRnd.z) * uMode.x);
  // crystal glints / ash sparks
  float tw = pow(0.5 + 0.5 * sin(uTime * (2.0 + aRnd.w * 6.0) + aRnd.x * 60.0), 24.0);
  b *= 1.0 + uMode.y * tw * 5.0 * step(0.6, aRnd.w);
  float spark = uMode.z * step(0.93, aRnd.w);
  b *= 1.0 + spark * (1.8 + tw * 7.0);
  col = mix(col, vec3(1.0, 0.72, 0.36) * 1.25, spark * 0.75 * (1.0 - float(isSpray)));
  b *= mix(1.0, 0.5, uMode.z * (1.0 - step(0.93, aRnd.w)));
  b *= (0.55 + 0.9 * aRnd.x);
  b *= isSpray ? 1.5 : 1.0;
  // streaks share the energy of a dot
  energy *= px / (px + hl * 0.65);
  vCol = col * b * energy * alpha * uIntensity * (1.0 + uFlash);
}`;
export const particleFrag = /* glsl */`
varying vec3 vCol;
varying vec3 vQ;
varying float vSize;
void main(){
  float dx = max(abs(vQ.x) - vQ.z, 0.0);
  float d = length(vec2(dx, vQ.y)) / vSize;
  float a = exp(-d * d * 3.2);
  float head = vQ.z > 0.5 ? mix(0.35, 1.0, clamp(vQ.x / (vQ.z + vSize) * 0.5 + 0.5, 0.0, 1.0)) : 1.0;
  gl_FragColor = vec4(vCol * a * head, 1.0);
}`;

/* ------------------------------------------------------------------ */
/*  Nebula cubemap bake (raymarched shell of domain-warped fbm)       */
/* ------------------------------------------------------------------ */
export const bakeVert = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const bakeFrag = /* glsl */`
uniform vec3 c1, c2, c3, cDust;
uniform vec3 uSeed;
uniform float uInt;
varying vec3 vDir;
${NOISE}
void main(){
  vec3 d = normalize(vDir);
  vec3 bandN = normalize(vec3(0.42, 1.0, -0.22));
  float bd = dot(d, bandN);
  float band = exp(-bd * bd / 0.075);
  float wide = exp(-bd * bd / 0.5);
  vec3 sp = d * 1.5 + uSeed;
  vec3 w = vec3(fbm3(sp), fbm3(sp + vec3(5.2, 1.3, 7.1)), fbm3(sp + vec3(9.7, 3.4, 2.9)));
  vec3 col = vec3(0.0); float T = 1.0;
  float dl = 1.0 / float(STEPS);
  for (int i = 0; i < STEPS; i++) {
    float t = (float(i) + 0.5) * dl;
    vec3 p = d * (2.0 + 2.6 * t) + w * 1.15 + uSeed;
    float n = fbm4(p * 1.3);
    float dens = clamp(n * 1.1 + 0.55 * wide + 0.45 * band - 0.62, 0.0, 1.0);
    float fil = smoothstep(0.48, 0.92, ridged4(p * 1.3 + 3.0));
    dens = dens * dens * 2.2 * (0.38 + 1.5 * fil);
    float hue = fbm3(p * 0.55 + 11.0);
    vec3 ec = mix(c1, c2, smoothstep(-0.32, 0.32, hue));
    ec = mix(ec, c3, smoothstep(0.42, 0.85, n + band * 0.15) * 0.7);
    float glow = (0.45 + 3.4 * smoothstep(0.25, 0.85, n) * (0.4 + band)) * (0.7 + 0.6 * fil);
    col += T * ec * dens * dl * glow;
    T *= exp(-dens * 3.2 * dl);
  }
  // dark dust lanes threading the galactic band
  float lanes = smoothstep(0.02, 0.38, fbm4(d * 4.5 + w * 0.7 + 3.0)) * (band * 0.9 + wide * 0.25);
  col *= mix(vec3(1.0), cDust * 0.6, clamp(lanes, 0.0, 0.9));
  // contrast: crush the faint haze so filaments read crisply
  float lum = dot(col, vec3(0.333));
  col *= smoothstep(0.004, 0.05, lum) * 0.85 + 0.15;
  // unresolved starlight along the band
  float sl = 0.5 + 0.5 * fbm3(d * 14.0 + 2.0);
  col += mix(c1, c3, 0.5) * band * 0.06 * sl;
  col += c2 * wide * 0.008;
  gl_FragColor = vec4(col * uInt, 1.0);
}`;

export const skyVert = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
export const skyFrag = /* glsl */`
uniform samplerCube tA, tB;
uniform float uBlend, uInt, uTime;
varying vec3 vDir;
${NOISE}
void main(){
  vec3 d = normalize(vDir);
  vec3 a = textureCube(tA, d).rgb;
  vec3 b = textureCube(tB, d).rgb;
  vec3 c = mix(a, b, uBlend);
  // high-frequency filament detail on top of the baked volume
  float f = snoise(d * 38.0 + vec3(0.0, uTime * 0.01, 0.0)) * 0.5 + snoise(d * 90.0) * 0.25;
  c *= 0.86 + 0.28 * (f * 0.5 + 0.5);
  gl_FragColor = vec4(c * uInt, 1.0);
}`;

/* ------------------------------------------------------------------ */
/*  Starfield                                                         */
/* ------------------------------------------------------------------ */
export const starVert = /* glsl */`
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
uniform float uTime, uPR, uFade;
varying vec3 vCol;
varying float vSpike;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.7 + 0.3 * sin(uTime * (1.2 + aPhase * 3.5) + aPhase * 40.0);
  float s = aSize * uPR;
  float e = 1.0;
  if (s < 1.5) { e = s / 1.5; s = 1.5; }
  gl_PointSize = s;
  vCol = aColor * tw * uFade * e;
  vSpike = step(9.0, aSize);
}`;
export const starFrag = /* glsl */`
varying vec3 vCol;
varying float vSpike;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  float core = exp(-r2 * 14.0);
  float halo = exp(-sqrt(r2) * 5.0) * 0.12;
  float spike = vSpike * (exp(-abs(q.x) * 60.0) * pow(1.0 - min(abs(q.y), 1.0), 3.0) + exp(-abs(q.y) * 60.0) * pow(1.0 - min(abs(q.x), 1.0), 3.0)) * 0.9;
  gl_FragColor = vec4(vCol * (core + halo + spike), 1.0);
}`;

/* ------------------------------------------------------------------ */
/*  Star core surface                                                 */
/* ------------------------------------------------------------------ */
export const coreVert = /* glsl */`
varying vec3 vObj; varying vec3 vN; varying vec3 vV;
void main(){
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
export const coreFrag = /* glsl */`
uniform float uTime, uBright, uHeat;
uniform vec3 uMode;
varying vec3 vObj; varying vec3 vN; varying vec3 vV;
${NOISE}
vec2 rot2(vec2 p, float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c) * p; }
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(vV);
  float mu = clamp(dot(n, v), 0.0, 1.0);
  vec3 p = normalize(vObj);
  float lat = p.y;
  p.xz = rot2(p.xz, uTime * (0.10 - 0.05 * lat * lat));
  float t = uTime;
  vec3 col = vec3(0.0);
  // ---------- PLASMA: boiling photosphere with bright turbulent veins ----------
  if (uMode.x > 0.01) {
    vec3 q = p * 1.9;
    vec3 w = vec3(fbm3(q + vec3(0.0, t * 0.05, 0.0)), fbm3(q + vec3(5.2, -t * 0.04, 1.3)), fbm3(q + vec3(9.1, 2.0, t * 0.045)));
    vec3 q2 = q * 1.6 + w * 1.4;
    float nf = fbm5(q2 + vec3(t * 0.03));
    float veins = ridged4(q2 * 1.3 + vec3(0.0, 0.0, t * 0.06));
    veins = pow(clamp(veins, 0.0, 1.0), 2.2);
    vec3 vo = voronoi3(p * 26.0 + w * 0.4 + vec3(0.0, t * 0.1, 0.0));
    float gran = smoothstep(0.0, 0.35, vo.y - vo.x);
    float spn = snoise(p * 3.2 + vec3(3.0, t * 0.01, 0.0));
    float spots = smoothstep(0.76, 0.92, spn);
    float heat = clamp(0.25 + 0.55 * (nf * 0.5 + 0.5) + 0.75 * veins, 0.0, 1.4);
    heat *= mix(0.86, 1.04, gran);
    heat *= 1.0 - spots * 0.75;
    vec3 base = ramp4(clamp(heat * 0.78, 0.0, 1.0), vec3(0.35, 0.02, 0.005), vec3(0.95, 0.16, 0.02), vec3(1.0, 0.48, 0.08), vec3(1.0, 0.86, 0.55));
    float limb = 0.10 + 0.90 * pow(mu, 0.8);
    vec3 limbTint = mix(vec3(1.0, 0.18, 0.05), vec3(1.0), pow(mu, 0.45));
    vec3 c = base * limbTint * limb * (0.9 + 3.4 * heat * heat);
    c += vec3(1.0, 0.3, 0.12) * pow(1.0 - mu, 3.0) * 2.4;
    col += c * uMode.x;
  }
  // ---------- CRYSTAL: faceted, refracting lattice core ----------
  if (uMode.y > 0.01) {
    vec3 vo = voronoi3(p * 4.2 + vec3(0.0, t * 0.03, 0.0));
    float edge = 1.0 - smoothstep(0.0, 0.07, vo.y - vo.x);
    vec3 fn = normalize(n + (hash33(vec3(vo.z * 91.0)) - 0.5) * 0.9);
    float fres = pow(1.0 - clamp(dot(fn, v), 0.0, 1.0), 2.0);
    float inner = 0.5 + 0.5 * snoise(p * 3.0 + vec3(t * 0.2));
    vec3 facet = mix(vec3(0.10, 0.08, 0.55), vec3(0.25, 0.75, 1.0), fres) * (0.6 + 1.6 * inner);
    facet += vec3(0.75, 0.4, 1.0) * pow(max(dot(reflect(-v, fn), normalize(vec3(0.4, 0.8, 0.3))), 0.0), 24.0) * 6.0;
    float sweep = pow(0.5 + 0.5 * sin(dot(p, vec3(4.0, 7.0, 2.0)) - t * 2.0), 12.0);
    vec3 c = facet + vec3(0.55, 0.95, 1.0) * edge * (3.0 + 6.0 * sweep);
    c += vec3(0.6, 0.35, 1.0) * pow(1.0 - mu, 3.0) * 4.0;
    col += c * uMode.y;
  }
  // ---------- ASH: cooling crust over molten cracks ----------
  if (uMode.z > 0.01) {
    vec3 w = vec3(fbm3(p * 2.0), fbm3(p * 2.0 + 4.3), fbm3(p * 2.0 + 8.1));
    vec3 vo = voronoi3(p * 5.0 + w * 0.7);
    float nf = fbm4(p * 3.5 + w);
    float crack = 1.0 - smoothstep(0.0, 0.05 + 0.08 * (nf * 0.5 + 0.5), vo.y - vo.x);
    float pool = smoothstep(0.25, 0.65, nf);
    float flick = 0.75 + 0.25 * sin(t * 3.0 + vo.z * 40.0);
    vec3 crust = vec3(0.035, 0.022, 0.02) * (0.6 + 0.8 * fbm3(p * 9.0) );
    vec3 lava = ramp4(0.5 + 0.5 * nf, vec3(0.6, 0.04, 0.0), vec3(1.0, 0.18, 0.02), vec3(1.0, 0.45, 0.06), vec3(1.0, 0.8, 0.4));
    float core2 = 1.0 - smoothstep(0.0, 0.018 + 0.02 * (nf * 0.5 + 0.5), vo.y - vo.x);
    vec3 c = crust + lava * (crack * 7.0 + pool * 1.1) * flick + vec3(1.0, 0.82, 0.5) * core2 * 9.0 * flick;
    c *= 0.4 + 0.6 * pow(mu, 0.4);
    c += vec3(1.0, 0.18, 0.04) * pow(1.0 - mu, 3.0) * 2.2;
    col += c * uMode.z;
  }
  col *= uBright;
  col += vec3(1.0, 0.95, 0.9) * uHeat * (2.0 + 6.0 * pow(mu, 2.0));
  gl_FragColor = vec4(col, 1.0);
}`;

/* ------------------------------------------------------------------ */
/*  Corona billboard                                                  */
/* ------------------------------------------------------------------ */
export const coronaVert = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const coronaFrag = /* glsl */`
uniform float uTime, uBright, uScale, uHeat;
uniform vec3 uMode;
varying vec2 vUv;
${NOISE}
void main(){
  float r = length(vUv) * uScale;     // in core radii
  if (r < 0.9) discard;
  vec2 dir = vUv / max(length(vUv), 1e-4);
  float h = max(r - 1.0, 0.0);
  float t = uTime;
  // base glow
  float g = exp(-h * 3.2) * 0.9 + exp(-h * 0.9) * 0.22;
  // streamers
  vec3 sp = vec3(dir * 2.6, h * 0.35 - t * 0.08);
  float st = fbm4(sp + vec3(0.0, 0.0, t * 0.02));
  float streamers = pow(max(st * 0.5 + 0.5, 0.0), 3.0) * exp(-h * 0.9) * 2.4;
  // fine rays
  float fr = pow(max(snoise(vec3(dir * 9.0, h * 0.15 - t * 0.1)), 0.0), 2.0) * exp(-h * 1.6);
  // prominence filaments arcing from the limb
  vec3 pp = vec3(dir * 3.2, h * 2.6 - t * 0.22);
  vec3 wp = vec3(snoise(pp * 0.7 + 3.0), snoise(pp * 0.7 + 7.0), 0.0) * 0.6;
  float fil = 1.0 - abs(snoise(pp + wp));
  fil = pow(fil, 7.0);
  float mask = smoothstep(0.1, 0.55, snoise(vec3(dir * 1.4, t * 0.05)));
  float prom = fil * mask * smoothstep(0.55, 0.0, h) * smoothstep(0.0, 0.04, h);
  vec3 cG = uMode.x * vec3(1.0, 0.42, 0.12) + uMode.y * vec3(0.35, 0.55, 1.0) + uMode.z * vec3(0.9, 0.16, 0.03);
  vec3 cS = uMode.x * vec3(1.0, 0.25, 0.55) + uMode.y * vec3(0.55, 0.85, 1.0) + uMode.z * vec3(0.55, 0.12, 0.05);
  vec3 cP = uMode.x * vec3(1.0, 0.22, 0.10) + uMode.y * vec3(0.8, 0.45, 1.0) + uMode.z * vec3(1.0, 0.35, 0.05);
  // crystal: sharp hex spikes instead of soft streamers
  float ang = atan(dir.y, dir.x);
  float hex = pow(abs(cos(ang * 3.0 + t * 0.15)), 60.0) * exp(-h * 0.7) * 1.5;
  vec3 col = cG * g * 1.8 + cS * (streamers * (1.0 - uMode.y * 0.6) + fr * 0.8) + cP * prom * 2.2 * (1.0 - uMode.y * 0.7);
  col += uMode.y * vec3(0.6, 0.85, 1.0) * hex;
  col += uMode.z * vec3(1.0, 0.24, 0.04) * (exp(-h * 1.3) * 0.9 + exp(-h * 0.45) * 0.12);
  col += vec3(1.0, 0.9, 0.8) * uHeat * exp(-h * 1.5) * 4.0;
  col *= uBright * smoothstep(uScale, uScale * 0.7, r);
  gl_FragColor = vec4(col, 1.0);
}`;

/* ------------------------------------------------------------------ */
/*  Shock shell + flash + nova ring                                   */
/* ------------------------------------------------------------------ */
export const shellVert = /* glsl */`
varying vec3 vN; varying vec3 vV; varying vec3 vObj;
void main(){
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
export const shellFrag = /* glsl */`
uniform vec3 uColor; uniform float uAlpha, uTime;
varying vec3 vN; varying vec3 vV; varying vec3 vObj;
${NOISE}
void main(){
  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  f = pow(f, 5.0);
  float n = 0.55 + 0.45 * snoise(vObj * 3.5 + vec3(uTime * 2.0));
  gl_FragColor = vec4(uColor * f * n * uAlpha, 1.0);
}`;
export const ringFrag = /* glsl */`
uniform vec3 uColor; uniform float uAlpha, uTime, uWidth;
varying vec2 vUv;
${NOISE}
void main(){
  float r = length(vUv);
  float x = (r - 0.82) / uWidth;
  float band = exp(-x * x);
  float inner = smoothstep(0.82, 0.0, r) * 0.08;
  vec2 dir = vUv / max(r, 1e-4);
  float n = fbm3(vec3(dir * 4.0, uTime * 0.6));
  float rays = pow(max(snoise(vec3(dir * 18.0, uTime)), 0.0), 2.0);
  float v = band * (0.55 + 0.6 * n) + inner + band * rays * 0.8;
  gl_FragColor = vec4(uColor * v * uAlpha, 1.0);
}`;
export const flashFrag = /* glsl */`
uniform vec3 uColor; uniform float uAlpha;
varying vec2 vUv;
void main(){
  float r = length(vUv);
  float v = exp(-r * r * 9.0) * 2.0 + exp(-r * 3.5) * 0.4;
  float ang = atan(vUv.y, vUv.x);
  v += exp(-abs(vUv.y) * 90.0) * (1.0 - smoothstep(0.0, 1.0, abs(vUv.x))) * 1.5;
  v *= smoothstep(1.0, 0.85, r);
  gl_FragColor = vec4(uColor * v * uAlpha, 1.0);
}`;

/* ------------------------------------------------------------------ */
/*  Post-processing                                                   */
/* ------------------------------------------------------------------ */
export const fsVert = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// 13-tap downsample (Jimenez / CoD AW) with soft threshold on first level
export const downFrag = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uFirst, uThresh;
varying vec2 vUv;
vec3 S(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 karis(vec3 a, vec3 b, vec3 c, vec3 d){
  float wa = 1.0 / (1.0 + luma(a)), wb = 1.0 / (1.0 + luma(b)), wc = 1.0 / (1.0 + luma(c)), wd = 1.0 / (1.0 + luma(d));
  return (a*wa + b*wb + c*wc + d*wd) / (wa + wb + wc + wd);
}
void main(){
  vec3 a = S(vec2(-2.0, 2.0)), b = S(vec2(0.0, 2.0)), c = S(vec2(2.0, 2.0));
  vec3 d = S(vec2(-2.0, 0.0)), e = S(vec2(0.0, 0.0)), f = S(vec2(2.0, 0.0));
  vec3 g = S(vec2(-2.0, -2.0)), h = S(vec2(0.0, -2.0)), i = S(vec2(2.0, -2.0));
  vec3 j = S(vec2(-1.0, 1.0)), k = S(vec2(1.0, 1.0)), l = S(vec2(-1.0, -1.0)), m = S(vec2(1.0, -1.0));
  vec3 col;
  if (uFirst > 0.5) {
    col = karis(j, k, l, m) * 0.5 + karis(a, b, d, e) * 0.125 + karis(b, c, e, f) * 0.125 + karis(d, e, g, h) * 0.125 + karis(e, f, h, i) * 0.125;
    float br = luma(col);
    float knee = uThresh * 0.6;
    float soft = clamp(br - uThresh + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 1e-4);
    float w = max(soft, br - uThresh) / max(br, 1e-4);
    col *= clamp(w, 0.0, 1.0);
    col = min(col, vec3(80.0));
  } else {
    col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  }
  gl_FragColor = vec4(col, 1.0);
}`;
export const upFrag = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uRadius, uWeight;
varying vec2 vUv;
vec3 S(vec2 o){ return texture2D(tSrc, vUv + o * uTexel * uRadius).rgb; }
void main(){
  vec3 c = S(vec2(0.0)) * 4.0;
  c += (S(vec2(-1.0, 0.0)) + S(vec2(1.0, 0.0)) + S(vec2(0.0, -1.0)) + S(vec2(0.0, 1.0))) * 2.0;
  c += S(vec2(-1.0, -1.0)) + S(vec2(1.0, -1.0)) + S(vec2(-1.0, 1.0)) + S(vec2(1.0, 1.0));
  gl_FragColor = vec4(c / 16.0 * uWeight, 1.0);
}`;

export const compositeFrag = /* glsl */`
uniform sampler2D tScene, tBloom, tDirt, tWide;
uniform vec2 uRes;
uniform float uTime;
uniform vec4 uShock[4];
uniform vec3 uShockCol;
uniform float uExposure, uBloom, uDirt, uCA, uVignette, uGrain, uSat, uFlash;
uniform vec3 uTint, uShadow;
uniform vec2 uCore;
uniform float uRays;
uniform vec4 uWell;
uniform float uNova, uDof;
varying vec2 vUv;
const mat3 ACESIn = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
const mat3 ACESOut = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 c){ c = ACESIn * c; c = RRTAndODTFit(c); c = ACESOut * c; return clamp(c, 0.0, 1.0); }
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 uv = vUv;
  vec2 off = vec2(0.0);
  float ring = 0.0;
  // gravity well: gravitational lensing + event horizon + photon ring
  float horizon = 1.0; float photon = 0.0;
  if (uWell.w > 0.001) {
    vec2 wd = (uv - uWell.xy) * asp;
    float wr = max(length(wd), 1e-4);
    float R = uWell.z;
    float lens = R * R / wr * uWell.w * smoothstep(R * 0.2, R * 0.9, wr) * exp(-wr / (R * 9.0));
    off += wd / wr * min(lens, wr * 0.9);
    horizon = mix(1.0, smoothstep(R * 0.42, R * 0.62, wr), uWell.w);
    float px = (wr - R * 0.66) / (R * 0.07);
    photon = exp(-px * px) * uWell.w;
  }
  for (int i = 0; i < 4; i++) {
    vec4 s = uShock[i];
    if (s.w <= 0.0) continue;
    vec2 d = (uv - s.xy) * asp;
    float r = length(d);
    float wdt = 0.012 + s.z * 0.10;
    float x = (r - s.z) / wdt;
    float prof = x * exp(-x * x);
    off += (d / max(r, 1e-4)) * prof * s.w * 0.065;
    ring += exp(-x * x) * s.w;
  }
  uv -= off / asp;
  vec2 cd = uv - 0.5;
  float ca = uCA * dot(cd * asp, cd * asp) + length(off) * 0.9;
  vec2 cv = cd * ca;
  vec3 scene = vec3(texture2D(tScene, uv + cv).r, texture2D(tScene, uv).g, texture2D(tScene, uv - cv).b);
  // opening depth of field: everything but the star core drifts out of focus
  if (uDof > 0.001) {
    float m = smoothstep(0.10, 0.48, length((uv - uCore) * asp)) * uDof;
    if (m > 0.02) {
      vec3 acc = scene; float rad = m * 9.0;
      for (int i = 1; i < 16; i++) {
        float fi = float(i);
        float r = sqrt(fi / 15.0) * rad;
        float a = fi * 2.39996;
        acc += texture2D(tScene, uv + vec2(cos(a), sin(a)) * r / uRes).rgb;
      }
      scene = acc / 16.0;
    }
  }
  vec3 bloom = vec3(texture2D(tBloom, uv + cv * 1.5).r, texture2D(tBloom, uv).g, texture2D(tBloom, uv - cv * 1.5).b);
  vec3 wide = texture2D(tWide, uv).rgb;
  // radial light shafts streaming from the core (screen-space scattering)
  vec3 rays = vec3(0.0);
  if (uRays > 0.0) {
    vec2 rd = (uv - uCore);
    float jit = hash(gl_FragCoord.xy + fract(uTime) * 61.0);
    float wsum = 0.0;
    for (int i = 0; i < 12; i++) {
      float t = (float(i) + jit) / 12.0;
      vec2 sp = uCore + rd * (1.0 - t * 0.55);
      float w = 1.0 - t * 0.6;
      rays += texture2D(tWide, sp).rgb * w;
      wsum += w;
    }
    rays /= wsum;
  }
  vec3 dirt = texture2D(tDirt, vUv).rgb;
  vec3 hdr = scene + bloom * uBloom + wide * dirt * uDirt + rays * uRays;
  hdr += uShockCol * ring * 0.22;
  hdr *= horizon;
  // supernova colour grade: blue-white core, magenta/amber shell
  if (uNova > 0.001) {
    vec2 nd = (uv - uCore) * asp; float nr = length(nd);
    float ang = atan(nd.y, nd.x);
    vec3 inner = vec3(0.62, 0.80, 1.30);
    vec3 shellC = mix(vec3(1.30, 0.38, 0.95), vec3(1.35, 0.70, 0.28), 0.5 + 0.5 * sin(ang * 3.0 + nr * 9.0 + uTime * 0.8));
    vec3 g = mix(inner, shellC, smoothstep(0.03, 0.20, nr));
    g = mix(g, vec3(1.0), smoothstep(0.42, 0.85, nr) * 0.6);
    hdr *= pow(g, vec3(uNova));
  }
  hdr += (uShockCol * 0.6 + 0.5) * photon * 0.55;
  hdr *= uExposure * (1.0 + uFlash);
  float l = dot(hdr, vec3(0.2126, 0.7152, 0.0722));
  hdr = max(mix(vec3(l), hdr, uSat), 0.0);
  hdr *= uTint;
  hdr += uShadow * 0.012 * (1.0 - smoothstep(0.0, 0.25, l));
  vec3 c = aces(hdr * 0.85);
  if (uNova > 0.001) {
    // hue-preserving compression so the blast never clips to flat white
    vec3 hp = hdr * 0.85; float mx = max(max(hp.r, hp.g), hp.b);
    vec3 hpc = hp / max(mx, 1e-4) * (mx / (1.0 + mx)) * 1.12;
    c = mix(c, clamp(hpc, 0.0, 1.0), min(uNova, 1.0) * 0.9);
  }
  c = toSRGB(c);
  vec2 vq = cd * asp;
  float vig = smoothstep(1.25, 0.25, length(vq * vec2(0.9, 1.15)));
  c *= mix(1.0, vig, uVignette);
  float gr = hash(gl_FragCoord.xy * 0.987 + fract(uTime * 7.31) * 113.0) - 0.5;
  c += gr * uGrain * (0.6 + 0.4 * (1.0 - l));
  gl_FragColor = vec4(c, 1.0);
}`;

/* ------------------------------------------------------------------ */
/*  Gas splats (emissive volume) + dust (absorbing lanes)             */
/* ------------------------------------------------------------------ */
export const gasVert = /* glsl */`
uniform sampler2D tPos, tVel;
uniform float uTime, uIntro, uIntensity, uTex;
uniform vec3 uMode;
uniform vec2 uRes;
attribute vec2 aRef;
attribute vec4 aRnd;
varying vec3 vCol;
varying vec2 vQ;
${NOISE}
void main(){
  vec4 P = texture2D(tPos, aRef);
  vec4 V = texture2D(tVel, aRef);
  vec3 pos = P.xyz; float temp = V.w;
  vec4 hh = hash42(floor(aRef * uTex));
  float halo = step(0.80, hh.y);
  float alpha = 1.0;
  if (uIntro < 1.0) {
    float rr = length(pos);
    float k = clamp(uIntro * 1.6 - (rr / 11.0) * 0.6, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - k, 3.0);
    float a = (1.0 - e) * 3.2; float c = cos(a), s = sin(a);
    pos.xz = mat2(c, -s, s, c) * pos.xz;
    pos *= mix(0.12, 1.0, e);
    alpha *= e * e;
  }
  float rcd = length(pos.xz);
  float armPh = 2.0 * (atan(pos.z, pos.x) - log(max(rcd, 0.5)) * 2.1 + uTime * 0.10);
  float armW = (uMode.x + uMode.z * 1.0) * smoothstep(1.4, 2.4, rcd);
#ifdef DUST
  // dust sits on the inner (leading) edge of the arms, in the mid-plane
  float lane = pow(0.5 + 0.5 * cos(armPh + 0.9), 6.0);
  float mid = mix(exp(-pow(pos.y / (0.06 + 0.02 * rcd), 2.0)), 1.0, uMode.z);
  alpha *= mid * (1.0 - halo) * smoothstep(1.6, 2.6, rcd) * smoothstep(8.5, 4.5, rcd);
  alpha *= mix(0.03, 1.0, lane * armW + (1.0 - armW) * 0.5);
  alpha *= 1.0 + uMode.z * 1.8;
  alpha *= (1.0 - uMode.y * 0.85);
  float world = (0.15 + 0.26 * aRnd.y) * (1.0 + 0.7 * uMode.z);
#else
  float arm = pow(0.5 + 0.5 * cos(armPh), 3.0);
  alpha *= mix(1.0, mix(0.08, 2.2, arm), armW) * (1.0 - halo * 0.6);
  float world = 0.32 + 0.55 * aRnd.y;
#endif
  vec4 c0 = projectionMatrix * viewMatrix * vec4(pos, 1.0);
  if (c0.w < 0.3 || alpha < 0.002) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float px = world * projectionMatrix[1][1] * 0.5 * uRes.y / c0.w;
  alpha *= smoothstep(150.0, 45.0, px);
  px = min(px, 150.0);
  vec2 s0 = c0.xy / c0.w * 0.5 * uRes;
  vec2 sp = s0 + position.xy * px;
  gl_Position = vec4(sp / (0.5 * uRes) * c0.w, c0.z, c0.w);
  vQ = position.xy;
  float t = clamp(temp, 0.0, 1.0);
#ifdef DUST
  vCol = vec3(0.55, 0.68, 0.82) * alpha * uIntensity;
#else
  vec3 pP = ramp4(t, vec3(0.10,0.10,0.70), vec3(0.75,0.10,0.65), vec3(1.0,0.36,0.14), vec3(1.0,0.80,0.55));
  vec3 pC = ramp4(t, vec3(0.06,0.06,0.45), vec3(0.35,0.2,1.0), vec3(0.15,0.7,1.0), vec3(0.7,0.95,1.0));
  vec3 pA = ramp4(t, vec3(0.2,0.02,0.01), vec3(0.6,0.07,0.02), vec3(0.95,0.28,0.04), vec3(1.0,0.7,0.35));
  vec3 col = uMode.x * pP + uMode.y * pC + uMode.z * pA;
  col = mix(col, vec3(0.15, 0.45, 1.0) * 0.8, halo * 0.7);
  float armc = pow(0.5 + 0.5 * cos(armPh), 3.0);
  col = mix(col, vec3(0.28, 0.24, 0.95) * 0.75, uMode.x * (1.0 - armc) * (1.0 - smoothstep(0.35, 0.75, t)) * 0.65);
  vCol = col * (0.35 + 1.4 * t) * alpha * uIntensity * (1.0 - 0.15 * uMode.z);
#endif
}`;
export const gasFrag = /* glsl */`
varying vec3 vCol;
varying vec2 vQ;
void main(){
  float r2 = dot(vQ, vQ);
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 3.5) * (1.0 - r2);
  gl_FragColor = vec4(vCol * a, 1.0);
}`;
