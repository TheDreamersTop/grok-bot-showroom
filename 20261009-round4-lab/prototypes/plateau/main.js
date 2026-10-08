import * as THREE from 'three';
const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
const R = 0.5;                       // ring radius
let h = +(Q.get('h') || 0.42);       // ring separation (world); critical = 1.3255 R
let pinch = 0;                       // 0 = catenoid, 1 = snapped into two discs
let snapT = -1;

// ---------------------------------------------------------------- film thickness simulation (param space s,theta)
const SN = +(Q.get('sn') || 384);
const rtOpt = { type: THREE.FloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping };
let A = new THREE.WebGLRenderTarget(SN, SN, rtOpt), Bt = new THREE.WebGLRenderTarget(SN, SN, rtOpt);
const gl = renderer.getContext();
const linOK = !!gl.getExtension('OES_texture_float_linear');
if (!linOK) { for (const t of [A, Bt]) { t.texture.minFilter = t.texture.magFilter = THREE.NearestFilter; } }
const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); const simScene = new THREE.Scene();
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); simScene.add(quad);
const VS = `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const NOISE = `
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+17.1; a*=.5; } return s; }
`;
// x channel: thickness in microns. param: vUv.x = theta/2pi (wraps), vUv.y = s in [0,1] along axis
const initMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, uniforms: { seed: { value: 1 } },
  fragmentShader: `precision highp float; in vec2 vUv; out vec4 o; uniform float seed;` + NOISE + `
  void main(){ float th = 0.42 + 0.45*fbm(vUv*vec2(6.,3.)+seed) ; o=vec4(th,0.,0.,1.); }` });
const stepMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS,
  uniforms: { S: { value: null }, time: { value: 0 }, dt: { value: 0.016 }, breath: { value: new THREE.Vector3(0.25, 0.5, 0) }, circ: { value: 1 } },
  fragmentShader: `precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D S; uniform float time, dt, circ; uniform vec3 breath;` + NOISE + `
  vec2 curl(vec2 p){ float e=0.01; float n1=fbm(p+vec2(0,e)), n2=fbm(p-vec2(0,e)), n3=fbm(p+vec2(e,0)), n4=fbm(p-vec2(e,0));
    return vec2(n1-n2, -(n3-n4))/(2.*e); }
  void main(){
    float th = vUv.x*6.2831853;
    // gravity drainage: film slides toward the bottom of the tube (theta = pi is down: y = r cos theta)
    vec2 v = vec2(0.035*sin(th)/6.2831853*circ, 0.);
    // marangoni turbulence: slow curl flow (stronger near the rings where the film is fed)
    vec2 p = vUv*vec2(5.,2.5) + vec2(time*0.03, -time*0.02);
    v += curl(p)*0.0028 * (0.6 + 0.8*pow(abs(vUv.y-.5)*2.,2.));
    v += curl(vUv*vec2(16.,8.) + vec2(-time*0.05, time*0.04) + 31.)*0.0016;
    v += curl(vUv*vec2(40.,20.) + vec2(time*0.09, time*0.07) + 77.)*0.0006;
    // breath: local swirl around cursor
    vec2 d = vUv - breath.xy; d.x = d.x - floor(d.x+.5);
    float bw = exp(-dot(d,d)/0.004)*breath.z;
    v += vec2(-d.y, d.x)*bw*0.9 + d*bw*0.25;
    vec2 q = vUv - v*dt*60.;
    float t = texture(S, q).x;
    // thinning: evaporation + drainage; top of tube drains faster
    float top = 0.5+0.5*cos(th);
    t -= dt*(0.006 + 0.012*top*circ)*t;
    t += dt*0.05*(1.0 - t)*pow(abs(vUv.y-.5)*2.,10.);     // fresh film drawn from the rings
    t = max(t, 0.0);
    o = vec4(t,0.,0.,1.); }` });
function runSim(mat, tgt) { quad.material = mat; renderer.setRenderTarget(tgt); renderer.render(simScene, simCam); renderer.setRenderTarget(null); }
function dip(seed) { initMat.uniforms.seed.value = seed; runSim(initMat, A); runSim(initMat, Bt); pinch = 0; snapT = -1; }
let simTime = 0;
function simStep(dt) { stepMat.uniforms.S.value = A.texture; stepMat.uniforms.time.value = simTime; stepMat.uniforms.dt.value = dt; runSim(stepMat, Bt); [A, Bt] = [Bt, A]; simTime += dt; }

// ---------------------------------------------------------------- scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.05, 50);
camera.position.set(0.85, 0.34, 2.15); camera.lookAt(0.02, -0.03, 0);
const ENV = `
vec3 env(vec3 d){
  // dark studio: two long softboxes + a warm kicker + faint floor bounce
  vec3 c = vec3(0.010,0.011,0.014) + vec3(0.02,0.022,0.028)*smoothstep(-0.2,0.8,d.y);
  c += vec3(0.55,0.56,0.6)*smoothstep(-0.1,0.9,d.z)*smoothstep(-0.6,0.4,d.y);   // large diffuse front panel
  c += vec3(0.5,0.48,0.45)*smoothstep(0.5,0.95,abs(d.x))*smoothstep(-0.5,0.3,d.y);   // side panels (light the drum films)
  c += vec3(0.6,0.62,0.66)*smoothstep(0.2,0.8,-d.z)*smoothstep(0.55,0.1,abs(d.y+0.1))*smoothstep(0.75,0.2,abs(d.x));   // rear bounce card
  vec2 a = vec2(atan(d.x,d.z), asin(clamp(d.y,-1.,1.)));
  float sb1 = smoothstep(0.14,0.0,abs(a.x-0.55)-0.16)*smoothstep(0.14,0.,abs(a.y-0.25)-0.36);
  float sb2 = smoothstep(0.12,0.0,abs(a.x+1.9)-0.09)*smoothstep(0.12,0.,abs(a.y-0.05)-0.5);
  float top = smoothstep(0.75,0.95,d.y);
  c += vec3(1.0,0.98,0.95)*sb1*5.0 + vec3(0.85,0.92,1.0)*sb2*3.0 + vec3(1.0,0.75,0.5)*top*1.2;
  return c; }
`;
// thin-film interference: reflectance spectrum -> RGB via analytic CIE (Wyman et al. 2013)
const TF = `
float g1(float x,float m,float s1,float s2){ float t=(x-m)/(x<m?s1:s2); return exp(-0.5*t*t); }
vec3 cie(float l){ float x=1.056*g1(l,599.8,37.9,31.0)+0.362*g1(l,442.0,16.0,26.7)-0.065*g1(l,501.1,20.4,26.2);
  float y=0.821*g1(l,568.8,46.9,40.5)+0.286*g1(l,530.9,16.3,31.1); float z=1.217*g1(l,437.0,11.8,36.0)+0.681*g1(l,459.0,26.0,13.8); return vec3(x,y,z); }
vec3 xyz2rgb(vec3 c){ return mat3(3.2406,-0.9689,0.0557,-1.5372,1.8758,-0.2040,-0.4986,0.0415,1.0570)*c; }
vec3 thinFilm(float dnm, float cosI){
  float n=1.33; float sinT2=(1.-cosI*cosI)/(n*n); float cosT=sqrt(max(0.,1.-sinT2));
  float R0 = pow((n-1.)/(n+1.),2.);
  vec3 acc=vec3(0.); vec3 wsum=vec3(0.);
  for(int i=0;i<24;i++){ float l = 390.+float(i)*13.5; vec3 w=cie(l);
    float ph = 6.2831853*2.*n*dnm*cosT/l; float r = 2.*R0*(1.-cos(ph)) ; acc += w*r; wsum += w; }
  return max(xyz2rgb(acc/wsum.y), 0.); }
`;
const filmMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  uniforms: { S: { value: null }, h: { value: h }, a: { value: 0.4 }, pinch: { value: 0 }, R: { value: R }, disc: { value: 0 } },
  vertexShader: `uniform float h, a, pinch, R, disc; out vec2 vUv; out vec3 vW; out vec3 vN;
    void main(){ vUv=uv; float th=uv.x*6.2831853; float s=uv.y*2.-1.;
      vec3 p; vec3 n;
      if (disc < 0.5) {
        float x = s*h*.5; float r = a*cosh(x/a);
        // pinch-off: neck collapses, film retracts toward the rings
        float k = pinch; float side = sign(s+1e-5);
        float rr = mix(r, R*smoothstep(0.0,1.0,(abs(s)-(1.-k))/max(k,1e-3)), smoothstep(0.,1.,k));
        p = vec3(x, rr*cos(th), rr*sin(th));
        float drdx = sinh(x/a); n = normalize(vec3(-drdx, cos(th), sin(th)));
      } else { // flat disc spanning a ring (uv.y = radius fraction)
        float side = disc < 1.5 ? -1. : 1.; float rr = uv.y*R;
        float wob = 0.012*sin(rr*20.-pinch*18.)*exp(-pinch*1.5)*(1.-uv.y);
        p = vec3(side*h*.5 + wob, rr*cos(th), rr*sin(th)); n = vec3(1.,0.,0.); }
      vN = normalize(mat3(modelMatrix)*n); vec4 w = modelMatrix*vec4(p,1.); vW = w.xyz;
      gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `precision highp float; uniform sampler2D S; uniform float disc; in vec2 vUv; in vec3 vW; in vec3 vN; out vec4 o;` + ENV + TF + `
    void main(){ vec3 V = normalize(cameraPosition - vW); vec3 n = normalize(vN); if (dot(n,V)<0.) n=-n;
      float cosI = clamp(dot(n,V),0.,1.);
      vec2 suv = disc < 0.5 ? vUv : vec2(vUv.x, 0.5 + (disc<1.5?-1.:1.)*0.5*(1.-vUv.y)*0.98);
      float th = texture(S, suv).x;               // microns
      if (disc > 0.5) th = th*0.6 + 0.25 + 0.25*vUv.y;   // freshly pulled drum films are thicker toward the wire
      vec3 refl = thinFilm(th*1000., cosI);
      vec3 E = env(reflect(-V,n));
      vec3 col = refl*E*3.2 + refl*0.05;          // reflections carry the colour; faint self-glow so the film reads
      float alpha = clamp(dot(refl, vec3(.3)),0.,1.)*0.6;
      o = vec4(col, alpha); }` });
const SEG = SHOT ? 160 : 128;
const tube = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, SEG, SEG), filmMat);
tube.geometry.translate(0.5, 0.5, 0); // uv stays 0..1, positions unused
tube.frustumCulled = false; scene.add(tube);
const discL = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 96, 48), filmMat.clone()); discL.material.uniforms = filmMat.uniforms; 
const discMatL = filmMat.clone(); discMatL.uniforms = Object.assign({}, filmMat.uniforms, { disc: { value: 1 } });
const discMatR = filmMat.clone(); discMatR.uniforms = Object.assign({}, filmMat.uniforms, { disc: { value: 2 } });
discL.material = discMatL; discL.frustumCulled = false;
const discR = new THREE.Mesh(discL.geometry, discMatR); discR.frustumCulled = false;
scene.add(discL, discR);
// rings: polished steel wire
const ringMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3,
  vertexShader: `out vec3 vW; out vec3 vN; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `precision highp float; in vec3 vW; in vec3 vN; out vec4 o;` + ENV + `
    void main(){ vec3 V=normalize(cameraPosition-vW); vec3 n=normalize(vN); vec3 r=reflect(-V,n);
      float f = 0.6+0.4*pow(1.-max(dot(n,V),0.),5.); o=vec4(env(r)*vec3(0.95,0.93,0.9)*f*0.9 + vec3(0.01),1.); }` });
const ringGeo = new THREE.TorusGeometry(R, 0.0075, 16, 160); ringGeo.rotateY(Math.PI / 2);
const ringL = new THREE.Mesh(ringGeo, ringMat), ringR = new THREE.Mesh(ringGeo, ringMat); scene.add(ringL, ringR);
// handles: thin rods going down out of frame
const rodGeo = new THREE.CylinderGeometry(0.006, 0.006, 1.2, 12); rodGeo.translate(0, -R - 0.6, 0);
const rodL = new THREE.Mesh(rodGeo, ringMat), rodR = new THREE.Mesh(rodGeo, ringMat); scene.add(rodL, rodR);
// backdrop: velvet with a soft pool of light
const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, depthWrite: false, depthTest: false,
  vertexShader: `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.999,1.); }`,
  fragmentShader: `in vec2 vUv; out vec4 o; void main(){ vec2 p=(vUv-vec2(.62,.55))*vec2(1.6,1.); float v=exp(-dot(p,p)*2.2);
    o=vec4(vec3(0.006,0.007,0.010)+vec3(0.030,0.034,0.044)*v,1.); }` }));
bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

// post: tonemap + gentle bloom-ish glow + grain
const rtMain = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: SHOT ? 0 : 4 });
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, uniforms: { S: { value: rtMain.texture }, res: { value: new THREE.Vector2(innerWidth, innerHeight) } },
  vertexShader: `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D S; uniform vec2 res; in vec2 vUv; out vec4 o;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    void main(){ vec3 c=texture(S,vUv).rgb; vec3 g=vec3(0.); float w=0.;
      for(int i=-4;i<=4;i++) for(int j=-4;j<=4;j++){ vec2 q=vec2(i,j); float k=exp(-dot(q,q)/10.); g+=max(texture(S,vUv+q*3./res).rgb-0.8,0.)*k; w+=k; }
      c += g/w*0.8; c=aces(c*1.1); c=pow(c,vec3(1./2.2)); vec2 p=vUv-.5; c*=1.-0.5*dot(p,p);
      c += (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/200.; o=vec4(c,1.); }` }));
const postScene = new THREE.Scene(); postScene.add(post);

function solveA(h) { // larger root of a*cosh(h/(2a)) = R ; returns -1 if none (beyond Goldschmidt limit)
  const c = h / 2; const aMin = c / 1.19968; if (aMin * Math.cosh(1.19968) > R) return -1;
  let lo = aMin, hi = R; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (m * Math.cosh(c / m) > R) hi = m; else lo = m; } return (lo + hi) / 2; }
let lastA = 0.45;
function update(dtReal) {
  const a = solveA(h);
  if (a < 0 && snapT < 0) snapT = 0;            // beyond critical: snap!
  if (a > 0) lastA = a;
  if (snapT >= 0) { snapT += dtReal; pinch = Math.min(1, snapT / 0.18); }
  filmMat.uniforms.h.value = h; filmMat.uniforms.a.value = lastA; filmMat.uniforms.pinch.value = pinch;
  tube.visible = pinch < 1; discL.visible = discR.visible = snapT >= 0;
  discMatL.uniforms.pinch = discMatR.uniforms.pinch = { value: snapT >= 0 ? snapT * 6 : 0 };
  ringL.position.x = -h / 2; ringR.position.x = h / 2; rodL.position.x = -h / 2; rodR.position.x = h / 2;
  stepMat.uniforms.circ.value = snapT >= 0 ? 0.3 : 1;
}
function render() {
  filmMat.uniforms.S.value = A.texture;
  renderer.setRenderTarget(rtMain); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, simCam);
}
// interaction
let drag = false, lx = 0; const ray = new THREE.Raycaster(); const m2 = new THREE.Vector2();
addEventListener('pointerdown', e => { drag = true; lx = e.clientX; });
addEventListener('pointerup', () => drag = false);
addEventListener('pointermove', e => {
  if (drag) { h = Math.max(0.25, h + (e.clientX - lx) * 0.0022); lx = e.clientX; }
  m2.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(m2, camera);
  // approximate breath position in film param space: intersect the plane x = ray, map to (theta, s)
  const o = ray.ray.origin, d = ray.ray.direction; const t = -o.z / d.z; const p = o.clone().addScaledVector(d, t);
  const th = Math.atan2(p.z, p.y); stepMat.uniforms.breath.value.set(((Math.atan2(0.3, p.y) / 6.2831853) + 1) % 1 * 0 + ((th / 6.2831853) + 1) % 1, Math.min(1, Math.max(0, p.x / h + 0.5)), Math.abs(p.y) < R ? 1 : 0);
});
addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') { h = 0.42; dip(Math.random() * 50); } });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); rtMain.setSize(innerWidth, innerHeight); post.material.uniforms.res.value.set(innerWidth, innerHeight); });

dip(+(Q.get('seed') || 2));
if (SHOT) {
  const steps = +(Q.get('t') || 300); const snapAge = +(Q.get('snap') || -1);
  stepMat.uniforms.breath.value.set(0.12, 0.45, Q.has('breath') ? 1 : 0);
  for (let i = 0; i < steps; i++) simStep(0.016);
  update(0);
  if (snapAge >= 0) { snapT = snapAge; pinch = Math.min(1, snapAge / 0.18); update(0); }
  render(); window.__ready = true;
} else {
  let last = performance.now();
  const loop = () => { requestAnimationFrame(loop); const now = performance.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now;
    simStep(0.016); simStep(0.016); update(dt); render(); window.__ready = true; };
  loop();
}
