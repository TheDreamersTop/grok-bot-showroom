import * as THREE from 'three';
const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot'), TSTEPS = +(Q.get('t') || 0);
const N = +(Q.get('n') || 256);
const HS = N / 256;                       // height scale so shapes stay similar across N
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ---------------------------------------------------------------- simulation targets
const rtOpt = { type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
const mk = () => new THREE.WebGLRenderTarget(N, N, rtOpt);
let T0 = mk(), T1 = mk(), F0 = mk(), F1 = mk();
const B0 = mk(); // original height (static) for crust / deposits
const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const simScene = new THREE.Scene();
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
simScene.add(quad);
const VS = `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const COMMON = `
precision highp float;
#define KC float(${+(Q.get('kc')||14)})
#define KD float(${+(Q.get('kd')||0.006)})
in vec2 vUv; out vec4 o;
uniform float N; uniform float dt; uniform float seed; uniform float HS;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i+seed),hash(i+vec2(1,0)+seed),f.x),mix(hash(i+vec2(0,1)+seed),hash(i+vec2(1,1)+seed),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*vnoise(p); p=p*2.03+17.1; a*=.5; } return s; }
// geologic column: band index by elevation; hardness per band
float bandWarp(vec2 uv){ return (fbm(uv*3.0)-.5)*6.0*HS + (uv.x-.5)*4.0*HS; }   // gentle dip + warp
float hardness(float z){ float k=floor(z/(3.2*HS)); float h=hash(vec2(k,7.13));
  return h<.35 ? 0.3 : (h<.7 ? 1.0 : 2.6); }  // erodibility multiplier: hard caprock vs soft shale
`;
const pass = (frag, uniforms) => new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, fragmentShader: COMMON + frag,
  uniforms: Object.assign({ N: { value: N }, dt: { value: 0.12 }, seed: { value: 3.0 }, HS: { value: HS } }, uniforms) });

const initMat = pass(`
uniform float H;
void main(){ vec2 uv=vUv; vec2 c=uv-.5;
  // tilted tableland (mesa) bounded by an escarpment; drains toward +x
  vec2 q = c + (vec2(fbm(uv*3.),fbm(uv*3.+9.))-.5)*0.18;
  float r = length(q*vec2(0.95,1.1))/0.5;
  float table = H*(0.60 + 0.50*(0.5-q.x) + 0.10*(fbm(uv*2.5)-.5));
  float vy = 0.5 + 0.06*sin(uv.x*9.0+1.3) + 0.04*(fbm(uv*4.)-.5);   // faint ancestral drainage line
  table -= H*0.06*exp(-pow((uv.y-vy)/0.05,2.));
  float edge = smoothstep(1.0, 0.52, r);
  vec2 e2 = min(uv,1.-uv); edge *= smoothstep(0.02,0.12,min(e2.x,e2.y));
  float n = (fbm(uv*6.0)-.5)*0.05*H + (fbm(uv*23.0)-.5)*0.012*H;
  float b = table*edge + n - 9.0*HS*smoothstep(.85,1.2,r) - 1.5*HS;
  o = vec4(b, max(0.,-b), 0., 0.); }`, { H: { value: 40 * HS } });

const fluxMat = pass(`
uniform sampler2D T, F;
float H(vec2 uv){ vec4 t=texture(T,uv); return t.x+t.y; }
void main(){ vec2 px=vec2(1./N); vec4 t=texture(T,vUv); float h=t.x+t.y;
  vec4 f=texture(F,vUv);
  vec4 dh = vec4(h-H(vUv-vec2(px.x,0.)), h-H(vUv+vec2(px.x,0.)), h-H(vUv+vec2(0.,px.y)), h-H(vUv-vec2(0.,px.y))); // L R T B
  f = max(vec4(0.), f*0.998 + dt*1.0*dh);
  float sum = f.x+f.y+f.z+f.w;
  float K = sum>0. ? min(1., t.y/(sum*dt)) : 0.;
  o = f*K; }`, { T: { value: null }, F: { value: null } });

const waterMat = pass(`
uniform sampler2D T, F, B; uniform vec3 rain; uniform float rainAmt;
void main(){ vec2 px=vec2(1./N); vec4 t=texture(T,vUv); vec4 f=texture(F,vUv);
  vec4 fl=texture(F,vUv-vec2(px.x,0.)), fr=texture(F,vUv+vec2(px.x,0.)), ft=texture(F,vUv+vec2(0.,px.y)), fb=texture(F,vUv-vec2(0.,px.y));
  float inflow = fl.y + fr.x + ft.w + fb.z;
  float outflow = f.x+f.y+f.z+f.w;
  float d0=t.y, d1 = max(0., d0 + dt*(inflow-outflow));
  float dav = max(.5*(d0+d1), 1e-3);
  float vx = .5*(fl.y - f.x + f.y - fr.x), vy = .5*(fb.z - f.w + f.z - ft.w);
  vec2 v = vec2(vx,vy)/dav; float sp=length(v); if(sp>4.) v*=4./sp; sp=min(sp,4.);
  // slope
  float bl=texture(T,vUv-vec2(px.x,0.)).x, br=texture(T,vUv+vec2(px.x,0.)).x, bt=texture(T,vUv+vec2(0.,px.y)).x, bb=texture(T,vUv-vec2(0.,px.y)).x;
  vec2 g = vec2(br-bl, bt-bb)*.5; float sl = length(g)/sqrt(1.+dot(g,g));
  float b=t.x, s=t.z;
  float depthF = clamp(dav/0.6,0.,1.) * clamp(2.0 - dav/3.0, 0., 1.); // shallow fast water carves; deep calm water doesn't
  float C = KC*max(sl,0.05)*sp*depthF;
  float hard = hardness(b + bandWarp(vUv));
  float b0 = texture(B,vUv).x;
  if (b > b0 + .05) hard = 2.6;                    // fresh deposits are loose
  if (C > s) { float bmin = min(min(bl,br),min(bt,bb)); float e = min(min(0.20*hard*(C-s), 0.6), max(0., b - bmin + 0.6)); b -= e; s += e; }
  else { float bmax = max(max(bl,br),max(bt,bb)); float dep = min(KD*(s-C), max(0., bmax - b)); b += dep; s -= dep; }
  // rain
  vec2 rp = vUv - rain.xy; float rg = exp(-dot(rp,rp)/(rain.z*rain.z));
  d1 += dt*rainAmt*rg;
  d1 *= (1.-0.006*dt); d1 = max(0., d1 - 0.012*dt);   // evaporation + infiltration kill thin sheets
  if (b < 0.) { d1 = mix(d1, -b, 0.35); }          // the sea: fixed level 0
  vec2 eb=min(vUv,1.-vUv); if (min(eb.x,eb.y) < 2.5/N) { d1 = max(0.,-b); s = 0.; }
  float wet = max(t.w*0.997, smoothstep(0.02,0.25,d1));
  o = vec4(b, d1, s, wet); }`, { T: { value: null }, F: { value: null }, B: { value: B0.texture }, rain: { value: new THREE.Vector3(.5, .5, .06) }, rainAmt: { value: 0 } });

const advMat = pass(`
uniform sampler2D T, F;
void main(){ vec2 px=vec2(1./N); vec4 t=texture(T,vUv); vec4 f=texture(F,vUv);
  vec4 fl=texture(F,vUv-vec2(px.x,0.)), fr=texture(F,vUv+vec2(px.x,0.)), ft=texture(F,vUv+vec2(0.,px.y)), fb=texture(F,vUv-vec2(0.,px.y));
  float dav=max(t.y,1e-3);
  vec2 v = vec2(.5*(fl.y - f.x + f.y - fr.x), .5*(fb.z - f.w + f.z - ft.w))/dav; float sp=length(v); if(sp>4.) v*=4./sp;
  vec2 p = vUv - v*dt*px;
  float s = texture(T,p).z;
  o = vec4(t.x, t.y, s, t.w); }`, { T: { value: null }, F: { value: null } });

const thermMat = pass(`
uniform sampler2D T;
void main(){ vec2 px=vec2(1./N); vec4 t=texture(T,vUv); float b=t.x; float acc=0.;
  float tal = 2.2;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ if(i==0&&j==0) continue;
    float dist = length(vec2(i,j)); float bn = texture(T,vUv+vec2(i,j)*px).x;
    float d = (b-bn)/dist; float lim = tal;
    if (d > lim) acc -= (d-lim)*dist; else if (-d > lim) acc += (-d-lim)*dist; }
  float avg = 0.25*(texture(T,vUv+vec2(px.x,0.)).x+texture(T,vUv-vec2(px.x,0.)).x+texture(T,vUv+vec2(0.,px.y)).x+texture(T,vUv-vec2(0.,px.y)).x);
  b += 0.02*acc; b = mix(b, avg, t.y>0.05 ? 0.035 : 0.003);   // slight creep smooths pipe-model checkerboarding
  o = vec4(b, t.yzw); }`, { T: { value: null } });


// ---------------------------------------------------------------- alternative model: stream-power landscape evolution (?model=sp)
const SPM = Q.get('model') !== 'pipe';   // default: stream-power; ?model=pipe = virtual-pipe shallow water (v1-v3)
const accMat = pass(`
uniform sampler2D T; uniform vec3 rain; uniform float rainAmt;
float Hh(vec2 uv){ return texture(T,uv).x; }
void main(){ vec2 px=vec2(1./N); float acc=0.;
  vec2 rp = vUv - rain.xy; acc += rainAmt*exp(-dot(rp,rp)/(rain.z*rain.z)) + 0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ if(i==0&&j==0) continue;
    vec2 q = vUv + vec2(i,j)*px; float hq = Hh(q); float Aq = texture(T,q).z;
    // fraction of q's outflow that goes to me (multiple-flow-direction, slope^1.3)
    float tot=0., mine=0.;
    for(int b=-1;b<=1;b++) for(int a=-1;a<=1;a++){ if(a==0&&b==0) continue;
      float dl = length(vec2(a,b)); float sl = (hq - Hh(q+vec2(a,b)*px))/dl;
      if (sl>0.) { float w=pow(sl,1.3); tot+=w; if(a==-i&&b==-j) mine=w; } }
    if (tot>0.) acc += Aq*mine/tot; }
  vec4 t=texture(T,vUv); o = vec4(t.x, t.y, acc, t.w); }`, { T: { value: null }, rain: waterMat.uniforms.rain, rainAmt: { value: 0 } });
const eroMat = pass(`
uniform sampler2D T, B;
void main(){ vec2 px=vec2(1./N); vec4 t=texture(T,vUv); float b=t.x, A=t.z;
  float hmin=b; float S=0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ if(i==0&&j==0) continue; float hn=texture(T,vUv+vec2(i,j)*px).x; float sl=(b-hn)/length(vec2(i,j)); if(sl>S){S=sl;} hmin=min(hmin,hn); }
  float hard = hardness(b + bandWarp(vUv));
  float E = float(${+(Q.get('kc')||200)})*0.0001*hard*pow(max(A-3.0,0.),0.5)*min(S,3.0);
  if (b > 0.2) b = max(b - E, min(b, hmin + 0.02));
  else if (A > 2.0) b = min(b + 0.0008*sqrt(A), -0.25);           // sediment fan into the shallow sea
  float lap = texture(T,vUv+vec2(px.x,0)).x+texture(T,vUv-vec2(px.x,0)).x+texture(T,vUv+vec2(0,px.y)).x+texture(T,vUv-vec2(0,px.y)).x-4.*b;
  b += 0.0006*lap;                                                  // hillslope creep
  float river = clamp((log2(1.+A) - 3.0)*0.35, 0., 2.0);           // channel water depth (cells) for rendering
  float d = b < 0. ? -b : river;
  float wet = max(t.w*0.998, smoothstep(0.1,0.6,river));
  o = vec4(b, d, A, wet); }`, { T: { value: null }, B: { value: B0.texture } });
function stepSP(rainOn) {
  accMat.uniforms.T.value = T0.texture; accMat.uniforms.rainAmt.value = rainOn ? 1.0 : 0; run(accMat, T1); [T0, T1] = [T1, T0];
  eroMat.uniforms.T.value = T0.texture; run(eroMat, T1); [T0, T1] = [T1, T0];
  if (!Q.has('notherm')) { thermMat.uniforms.T.value = T0.texture; run(thermMat, T1); [T0, T1] = [T1, T0]; }
}

function run(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(simScene, simCam); }
function init(seed) {
  initMat.uniforms.seed.value = seed; for (const m of [fluxMat, waterMat, advMat, thermMat, accMat, eroMat]) m.uniforms.seed.value = seed;
  run(initMat, T0); run(initMat, B0);
  renderer.setRenderTarget(F0); renderer.setClearColor(0, 0); renderer.clear(); renderer.setRenderTarget(F1); renderer.clear();
  renderer.setRenderTarget(null);
}
function step(rainOn) {
  if (SPM) return stepSP(rainOn);
  fluxMat.uniforms.T.value = T0.texture; fluxMat.uniforms.F.value = F0.texture; run(fluxMat, F1); [F0, F1] = [F1, F0];
  waterMat.uniforms.T.value = T0.texture; waterMat.uniforms.F.value = F0.texture; waterMat.uniforms.rainAmt.value = rainOn ? 0.55 : 0; run(waterMat, T1); [T0, T1] = [T1, T0];
  advMat.uniforms.T.value = T0.texture; advMat.uniforms.F.value = F0.texture; run(advMat, T1); [T0, T1] = [T1, T0];
  if (!Q.has('notherm')) { thermMat.uniforms.T.value = T0.texture; run(thermMat, T1); [T0, T1] = [T1, T0]; }
}

// ---------------------------------------------------------------- render scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.05, 50);
let camAz = +(Q.get('az') || -0.55), camEl = +(Q.get('el') || 0.50), camR = +(Q.get('cr') || 1.95);
function placeCam() { camera.position.set(Math.sin(camAz) * Math.cos(camEl) * camR, Math.sin(camEl) * camR + 0.0, Math.cos(camAz) * Math.cos(camEl) * camR); camera.lookAt(0, -0.03, 0); }
placeCam();
const VERT_SCALE = 1 / 256 * 1.0; // cells -> world (width = 1)
const RCOMMON = `
precision highp float;
uniform sampler2D T, B; uniform float N, HS, seed; uniform vec3 sunDir; uniform vec3 rain; uniform float rainAmt;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i+seed),hash(i+vec2(1,0)+seed),f.x),mix(hash(i+vec2(0,1)+seed),hash(i+vec2(1,1)+seed),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*vnoise(p); p=p*2.03+17.1; a*=.5; } return s; }
float bandWarp(vec2 uv){ return (fbm(uv*3.0)-.5)*6.0*HS + (uv.x-.5)*4.0*HS; }
vec3 strata(float z, vec2 uv){
  float zz = z + bandWarp(uv);
  float k = floor(zz/(3.2*HS)); float h = hash(vec2(k,7.13)); float h2=hash(vec2(k,3.7));
  vec3 c;
  if (h<.35) c = mix(vec3(.80,.74,.62), vec3(.88,.84,.74), h2);          // hard pale limestone caps
  else if (h<.7) c = mix(vec3(.62,.16,.06), vec3(.78,.30,.10), h2);       // rust sandstone
  else c = mix(vec3(.78,.50,.18), vec3(.45,.24,.26), h2);                  // ochre / mauve shale
  float fine = fract(zz/(0.8*HS)); c *= 0.9 + 0.1*smoothstep(.0,.15,fine)*smoothstep(1.,.8,fine);
  return c*0.42; }
vec4 TB(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p); vec2 q=(i+.5)/N; float e=1./N;
  return mix(mix(texture(T,q),texture(T,q+vec2(e,0)),f.x), mix(texture(T,q+vec2(0,e)),texture(T,q+vec2(e,e)),f.x), f.y); }
float Hs(vec2 uv){ return TB(uv).x; }
`;
const terrainMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3,
  uniforms: { T: { value: null }, B: { value: B0.texture }, N: { value: N }, HS: { value: HS }, seed: { value: 3 }, sunDir: { value: new THREE.Vector3(-0.85, 0.40, 0.15).normalize() }, rain: waterMat.uniforms.rain, rainAmt: { value: 0 }, VS: { value: VERT_SCALE } },
  vertexShader: `uniform sampler2D T; uniform float VS; out vec2 vUv; out vec3 vW;
    void main(){ vUv=uv; float b=texture(T,uv).x; vec3 p=vec3(position.x, b*VS, position.y*-1.); vW=p; gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  fragmentShader: RCOMMON + `
  uniform float VS; in vec2 vUv; in vec3 vW; out vec4 o;
  float shadow(vec2 uv, float h){ vec2 d = normalize(sunDir.xz*vec2(1.,-1.)); float slope = sunDir.y/length(sunDir.xz);
    float res=1.; float t=1.0/N;
    for(int i=0;i<56;i++){ vec2 p=uv+d*t; if(p.x<0.||p.y<0.||p.x>1.||p.y>1.) break;
      float hh = Hs(p)*VS; float ray = h + 0.0015 + slope*t; res = min(res, 10.*(ray-hh)/t); t += max(0.6/N, t*0.06); }
    return smoothstep(0.,1.,clamp(res,0.,1.)); }
  void main(){ vec2 px=vec2(1./N); vec4 t=TB(vUv);
    float bl=Hs(vUv-vec2(px.x,0.)), br=Hs(vUv+vec2(px.x,0.)), bt=Hs(vUv+vec2(0.,px.y)), bb=Hs(vUv-vec2(0.,px.y));
    float bl2=Hs(vUv-vec2(2.*px.x,0.)), br2=Hs(vUv+vec2(2.*px.x,0.)), bt2=Hs(vUv+vec2(0.,2.*px.y)), bb2=Hs(vUv-vec2(0.,2.*px.y));
    vec3 n = normalize(vec3((bl+bl2-br-br2)*VS, 6.*px.x, -(bt+bt2-bb-bb2)*VS));
    float b=t.x, b0=texture(B,vUv).x;
    float eroded = b0 - b;
    vec3 rock = strata(b, vUv);
    vec3 crust = mix(vec3(.40,.38,.24), vec3(.22,.27,.15), smoothstep(.35,.7,fbm(vUv*40.)))*0.42;      // sage scrub + desert varnish crust
    crust *= 0.8+0.4*fbm(vUv*140.);
    vec3 alb = mix(crust, rock, smoothstep(0.35*HS, 1.2*HS, eroded));
    vec3 sand = vec3(.66,.58,.42)*0.45;
    alb = mix(alb, sand, smoothstep(1.0, 3.0, b-b0)); alb *= 1. - 0.25*smoothstep(0.1,1.0,b-b0)*(1.-smoothstep(1.0,3.0,b-b0));
    if (b < 0.3) alb = mix(alb, vec3(.55,.52,.42)*0.45, smoothstep(0.3,-1.5,b));     // seabed sand
    alb *= mix(1.0, 0.55, t.w);                                                        // wet soil darker
    float sh = shadow(vUv, b*VS);
    float dif = clamp(dot(n,sunDir),0.,1.);
    float sky = clamp(.5+.5*n.y,0.,1.);
    float ind = clamp(dot(n, normalize(sunDir*vec3(-1.,0.,-1.))),0.,1.);
    float occ = clamp(0.55 + 0.45*(b - 0.25*(bl+br+bt+bb))/(1.0*HS) + 0.45, 0.3, 1.0);
    vec3 lin = dif*vec3(1.75,1.35,1.0)*2.2*pow(vec3(sh),vec3(1.,1.25,1.6));
    lin += sky*vec3(.20,.26,.40)*0.9*occ + ind*vec3(.40,.25,.15)*0.5*occ;
    vec3 col = alb*lin;
    // cloud shadow while raining
    vec2 rp=vUv-rain.xy; col *= 1.-0.45*rainAmt*exp(-dot(rp,rp)/(rain.z*rain.z*4.));
    o = vec4(col,1.); }`
});
const terrain = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, N - 1, N - 1), terrainMat);
scene.add(terrain);

// water surface
const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, N - 1, N - 1), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, transparent: true, depthWrite: false,
  uniforms: { T: terrainMat.uniforms.T, F: { value: null }, N: { value: N }, HS: { value: HS }, seed: { value: 3 }, sunDir: terrainMat.uniforms.sunDir, VS: { value: VERT_SCALE }, B: { value: B0.texture }, rain: waterMat.uniforms.rain, rainAmt: terrainMat.uniforms.rainAmt },
  vertexShader: `uniform sampler2D T; uniform float VS; out vec2 vUv; out vec3 vW; out float vD;
    void main(){ vUv=uv; vec4 t=texture(T,uv); vD=t.y; vec3 p=vec3(position.x, (t.x+t.y)*VS + 0.0004, -position.y); vW=p; gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  fragmentShader: RCOMMON + `
  uniform float VS; uniform sampler2D F; in vec2 vUv; in vec3 vW; in float vD; out vec4 o;
  float W(vec2 uv){ vec4 t=TB(uv); return t.x+t.y; }
  void main(){ vec2 px=vec2(1./N); vec4 t=TB(vUv); float d=t.y; if(d<0.10) discard;
    float hl=W(vUv-vec2(px.x,0.)), hr=W(vUv+vec2(px.x,0.)), ht=W(vUv+vec2(0.,px.y)), hb=W(vUv-vec2(0.,px.y));
    vec3 n = normalize(vec3((hl-hr)*VS, 2.*px.x, -(ht-hb)*VS));
    vec4 f=texture(F,vUv); float flow = (f.x+f.y+f.z+f.w)/max(d,0.05);
    vec3 V = normalize(cameraPosition - vW);
    float fr = 0.02 + 0.98*pow(1.-max(dot(n,V),0.),5.);
    vec3 deep = vec3(.02,.13,.16), shallow = vec3(.10,.42,.40), silt=vec3(.45,.33,.20);
    float a = 1.-exp(-d*0.35/HS);
    vec3 col = mix(shallow, deep, smoothstep(0.,1.,d/(10.*HS)));
    col = mix(col, silt*0.6, clamp(t.z*1.5,0.,.7));              // muddy where carrying sediment
    vec3 R = reflect(-V,n); vec3 sky = mix(vec3(.55,.62,.70), vec3(.95,.85,.70), clamp(R.y*.5+.5,0.,1.))*0.8;
    float spec = pow(max(dot(R,sunDir),0.),180.)*6.;
    col = col*(0.35+0.9*clamp(dot(n,sunDir),0.,1.)) + fr*sky + spec*vec3(1.,.9,.7);
    col += vec3(.8,.85,.8)*smoothstep(2.5,6.,flow)*0.12;           // whitewater
    o = vec4(col, clamp(a*0.92 + fr*0.3, 0., 0.97)); }`
}));
scene.add(waterMesh);

// diorama side walls (geologic block-diagram cut)
function wallGeo() {
  const pos = [], uvs = [], idx = []; const floorY = -0.11;
  const sides = [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]];
  let base = 0;
  for (const [ax, ay, bx, by] of sides) {
    for (let i = 0; i < N; i++) { const s = i / (N - 1); const u = ax + (bx - ax) * s, v = ay + (by - ay) * s;
      pos.push(u - .5, 0, -(v - .5), u - .5, floorY, -(v - .5)); uvs.push(u, v, 1, u, v, 0); }
    for (let i = 0; i < N - 1; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    base += N * 2;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uvt', new THREE.Float32BufferAttribute(uvs, 3)); g.setIndex(idx); return g;
}
const wallMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, side: THREE.DoubleSide,
  uniforms: { T: terrainMat.uniforms.T, B: { value: B0.texture }, N: { value: N }, HS: { value: HS }, seed: { value: 3 }, sunDir: terrainMat.uniforms.sunDir, VS: { value: VERT_SCALE }, rain: waterMat.uniforms.rain, rainAmt: terrainMat.uniforms.rainAmt },
  vertexShader: `uniform sampler2D T; uniform float VS; in vec3 uvt; out vec2 vUv; out float vZ; out float vTop;
    void main(){ vUv=uvt.xy; float b=texture(T,clamp(uvt.xy,0.001,0.999)).x; float y = uvt.z>.5 ? b*VS : position.y;
      vZ = y/VS; vTop=uvt.z; gl_Position=projectionMatrix*viewMatrix*vec4(position.x,y,position.z,1.); }`,
  fragmentShader: RCOMMON + `in vec2 vUv; in float vZ; in float vTop; out vec4 o;
    void main(){ vec3 c = strata(vZ, vUv); float l = 1.25 + 0.1*fbm(vec2(vZ*.3, vUv.x*80.+vUv.y*80.));
      c *= l * mix(0.55, 1.0, smoothstep(-15.,10.,vZ));
      o = vec4(c*vec3(1.05,1.,.95),1.); }`
});
scene.add(new THREE.Mesh(wallGeo(), wallMat));
// sea walls (glass-like water slab where the sea is cut)
// plinth + background
const bgMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, depthWrite: false, depthTest: false,
  vertexShader: `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.999,1.); }`,
  fragmentShader: `in vec2 vUv; out vec4 o; void main(){ vec2 p=vUv-vec2(.5,.42); float v=1.-dot(p*vec2(1.2,1.6),p*vec2(1.2,1.6));
    vec3 c = mix(vec3(.030,.028,.026), vec3(.20,.18,.155), clamp(v,0.,1.)); o=vec4(pow(c,vec3(1./2.2)),1.); }` });
const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat); bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);
const plinth = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, transparent: true, depthWrite: false,
  vertexShader: `out vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `in vec2 vUv; out vec4 o; void main(){ vec2 p=abs(vUv-.5)*3.; float d=length(max(p-vec2(.5),0.)); o=vec4(0.,0.,0.,0.75*exp(-d*d*40.)); }` }));
plinth.rotation.x = -Math.PI / 2; plinth.position.y = -0.1105; scene.add(plinth);

// final gamma: ShaderMaterials output linear; we apply gamma via a post quad
const rtMain = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: SHOT ? 0 : 4 });
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, uniforms: { S: { value: rtMain.texture }, res: { value: new THREE.Vector2(innerWidth, innerHeight) } },
  vertexShader: `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D S; uniform vec2 res; in vec2 vUv; out vec4 o;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    void main(){ vec2 p=vUv-.5;
      // tilt-shift: blur grows away from the focus band
      float bl = smoothstep(.2,.6,abs(vUv.y-.47))*2.0; vec3 c=vec3(0.); float w=0.;
      for(int i=-3;i<=3;i++) for(int j=-3;j<=3;j++){ vec2 q=vec2(i,j); float k=exp(-dot(q,q)/6.); c+=texture(S,vUv+q*bl/res).rgb*k; w+=k; }
      c/=w; c = aces(c*1.05); c = pow(c, vec3(1./2.2));
      c *= 1.-0.35*dot(p,p)*1.8; c += (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
      o=vec4(c,1.); }` }));
const postScene = new THREE.Scene(); postScene.add(post);
// the bg quad already outputs gamma; render it linear by undoing: simpler — treat bg as linear-ish dark
bgMat.fragmentShader = bgMat.fragmentShader.replace('pow(c,vec3(1./2.2))', 'c');

function render() {
  terrainMat.uniforms.T.value = T0.texture; waterMesh.material.uniforms.F.value = F0.texture;
  renderer.setRenderTarget(rtMain); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, simCam);
}

// ---------------------------------------------------------------- interaction
const ray = new THREE.Raycaster(); let mouseDown = false, rotDrag = false, lastX = 0, lastY = 0; const m2 = new THREE.Vector2();
const pickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.08);
function pick(e) { m2.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(m2, camera);
  const p = new THREE.Vector3(); if (ray.ray.intersectPlane(pickPlane, p)) { waterMat.uniforms.rain.value.set(p.x + .5, -p.z + .5, .045); } }
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('pointerdown', e => { if (e.button === 2) { rotDrag = true; lastX = e.clientX; lastY = e.clientY; } else { mouseDown = true; pick(e); } });
addEventListener('pointerup', () => { mouseDown = false; rotDrag = false; });
addEventListener('pointermove', e => { if (rotDrag) { camAz -= (e.clientX - lastX) * 0.005; camEl = Math.min(1.3, Math.max(0.2, camEl + (e.clientY - lastY) * 0.004)); lastX = e.clientX; lastY = e.clientY; placeCam(); } else pick(e); });
addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') init(Math.random() * 100); });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); rtMain.setSize(innerWidth, innerHeight); post.material.uniforms.res.value.set(innerWidth, innerHeight); });

init(+(Q.get('seed') || 3));
window.__steps = 0;
if (SHOT) {
  // deterministic scripted storm: rain wanders over the summit, then drains
  const total = TSTEPS; let s = 0;
  const chunk = () => {
    const end = Math.min(total, s + 50);
    for (; s < end; s++) { const k = s / Math.max(total, 1); const on = k < (SPM ? 0.97 : 0.75) && !Q.has('norain');
      const a = s * 0.004; waterMat.uniforms.rain.value.set(+(Q.get('rx') || .24) + .02 * Math.cos(a * 1.3), +(Q.get('ry') || .52) + .03 * Math.sin(a), +(Q.get('rr') || .045));
      step(on); }
    window.__steps = s;
    if (s < total) setTimeout(chunk, 0); else { terrainMat.uniforms.rainAmt.value = 0; render(); window.__ready = true; }
  };
  chunk();
} else {
  const loop = () => { requestAnimationFrame(loop);
    const spf = 6; for (let i = 0; i < spf; i++) step(mouseDown);
    terrainMat.uniforms.rainAmt.value += ((mouseDown ? 1 : 0) - terrainMat.uniforms.rainAmt.value) * 0.1;
    render(); window.__ready = true; };
  loop();
}
window.__stats = () => { const a = new Float32Array(N * N * 4), c = new Float32Array(N * N * 4);
  renderer.readRenderTargetPixels(T0, 0, 0, N, N, a); renderer.readRenderTargetPixels(B0, 0, 0, N, N, c);
  let mx = -1e9, mn = 1e9, er = 0, ner = 0, dmax = 0, wet = 0; const hist = [0, 0, 0, 0, 0];
  for (let i = 0; i < N * N; i++) { const b = a[i * 4], d = a[i * 4 + 1], e = c[i * 4] - b; mx = Math.max(mx, b); mn = Math.min(mn, b); er = Math.max(er, e); if (e > 0.6) ner++; dmax = Math.max(dmax, b > 0 ? d : 0); if (b > 0 && d > 0.05) wet++;
    hist[e < 0 ? 0 : e < 0.3 ? 1 : e < 1 ? 2 : e < 3 ? 3 : 4]++; }
  return { mx, mn, er, ner, dmax, wet, hist }; };
