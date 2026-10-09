// Deep Time V1 — your stroke, a billion years later. A2 renderer; implicit stream-power solver in a Worker (worker.js / sim.js).
import * as THREE from 'three';
import { HARD, LAYER as SLAYER, strokeShape } from './sim.js';
const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot'), TSTEPS = +(Q.get('t') || 0);
const N = +(Q.get('n') || 256);
const P = k => +(Q.get(k));
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);

const rtOpt = { type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false };
const mk = () => new THREE.WebGLRenderTarget(N, N, rtOpt);
const tdata = new Float32Array(N * N * 4); const dtex = new THREE.DataTexture(tdata, N, N, THREE.RGBAFormat, THREE.FloatType); dtex.minFilter = dtex.magFilter = THREE.NearestFilter;
const T0 = { texture: dtex };
let simInfo = { top: 20, steps: 0, total: 0, msPerStep: 0, budget: 0, done: false };
function onFrame(m) { tdata.set(m.data); dtex.needsUpdate = true; terrainMat.uniforms.ptop.value = m.top - 2; terrainMat.uniforms.capTop.value = m.top; shMat.uniforms.capTop.value = m.top; skyMat.uniforms.capTop.value = m.top; skyMat.uniforms.ptopS.value = m.top - 0.6; terrainMat.uniforms.upl.value = m.upl; shMat.uniforms.upl && (shMat.uniforms.upl.value = m.upl); simInfo = m; }
const SH = new THREE.WebGLRenderTarget(N, N, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const simScene = new THREE.Scene(); const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); simScene.add(quad);
const VS = `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const HTOP = P('htop') || 40, LAYER = SLAYER;
const SHARED = `
precision highp float;
uniform float N; uniform float seed;
#define HTOP ${HTOP.toFixed(2)}
#define LAYER ${LAYER.toFixed(2)}
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i+seed),hash(i+vec2(1,0)+seed),f.x),mix(hash(i+vec2(0,1)+seed),hash(i+vec2(1,1)+seed),f.x),f.y); }
uniform float detail;
float fbm(vec2 p){ float a=.5,s=0.; int oc = detail > 0.5 ? 6 : 4; for(int i=0;i<6;i++){ if (i>=oc) break; s+=a*vnoise(p); p=p*2.03+17.1; a*=.5; } return s; }
// geologic column: layer k is hard (cliff former) or soft (slope former)
const float HT[64] = float[64](${HARD.map(v => v.toFixed(1)).join(',')});   // bound to the solver's strata table (spl.js)
float hardOf(float k){ return HT[int(mod(k,64.))] > .5 ? 2.8 : 0.45; }
uniform float upl, capTop;   // strata are rock-fixed: they rise with uplift
float dipZ(vec2 uv){ return (uv.x-.5)*0.8 + (uv.y-.5)*0.6 - upl; }            // very gentle structural dip
// stair-step profile: hard layers form vertical cliffs, soft layers form talus slopes below them
float terrace(float h, vec2 uv){ float z=h+dipZ(uv); float k=floor(z/LAYER); float f=fract(z/LAYER);
  float hd = hardOf(k);
  float g = hd>1. ? smoothstep(0.58,0.97,f)*0.90 + f*0.10 : pow(f,1.6);
  float tr = (k+g)*LAYER - dipZ(uv);
  return mix(tr, h, step(1.,capTop)*smoothstep(capTop-5.0, capTop-2.6, h)); }   // the untouched plateau top is one caprock surface, not dip-cut steps
`;
const COMMON = SHARED + `in vec2 vUv; out vec4 o;\n`;
const pass = (frag, u) => new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, fragmentShader: COMMON + frag,
  uniforms: Object.assign({ N: { value: N }, seed: { value: +(Q.get('seed') || 3) } }, u) });
function run(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(simScene, simCam); renderer.setRenderTarget(null); }

// ---------------------------------------------------------------- initial land: a plateau tilted toward a far base level
const initMat = pass(`${Q.has('gesture') ? '#define GESTURE' : ''}
float mxOf(float y){ return 0.5 + 0.16*sin(y*8.5+0.6) + 0.07*sin(y*19.+2.) + (fbm(vec2(y*3.,1.))-.5)*0.15; }
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h); }
void main(){ vec2 uv=vUv;
  float plateau = HTOP*(0.90 + 0.10*uv.y) + (fbm(uv*5.)-.5)*2.0 + (fbm(uv*21.)-.5)*0.8;
  vec2 w = uv + (vec2(fbm(uv*7.),fbm(uv*7.+5.))-.5)*0.035;               // ragged rims
  // main canyon: centre line meanders, floor deepens toward the far base level
  float dm = abs(w.x - mxOf(w.y));
  float floorZ = 2.0 + 10.0*uv.y;
  float cut = 1.-smoothstep(0.025, ${(P('cw') || 0.16).toFixed(3)}, dm);   // 1 at river, 0 at rim
  // tributary side canyons, alternating sides, branching off downstream-pointing
  float tcut = 0.;
  for (int k=0;k<9;k++){ float fk=float(k); float y0 = 0.08 + fk*0.105 + (hash(vec2(fk,2.))-.5)*0.04;
    float side = mod(fk,2.)<.5 ? -1. : 1.; vec2 a = vec2(mxOf(y0), y0);
    float L = 0.18 + 0.16*hash(vec2(fk,9.)); vec2 b = a + vec2(side*L, L*(0.55+0.5*hash(vec2(fk,4.))));
    vec2 m = mix(a,b,.5) + vec2(0., (hash(vec2(fk,6.))-.5)*0.08);
    float d = min(sdSeg(w,a,m), sdSeg(w,m,b));
    float along = clamp(length(w-a)/L,0.,1.);
    tcut = max(tcut, (1.-smoothstep(0.012, 0.07*(1.-0.6*along), d))*(1.-0.75*along)); }
  float c = max(cut, tcut*0.85);
  #ifdef GESTURE
  c = 1.-smoothstep(0.004, 0.018, dm);            // only a shallow finger-groove along the drawn path: the sim must dig the canyon
  floorZ = plateau - 3.0;
  #endif
  float b = mix(plateau, floorZ, c);
  if (uv.y < 1.5/N && c > 0.6) b = 0.;
  #ifdef GESTURE
  if (uv.y < 1.5/N && c > 0.3) b = 0.;
  #endif
  o = vec4(b, 0., 0., b); }`, {});
const accMat = pass(`uniform sampler2D T; uniform vec3 rain; uniform float rainAmt, base;
float Hh(vec2 uv){ return texture(T,uv).x; }
void main(){ vec2 px=vec2(1./N); vec2 rp=vUv-rain.xy; float acc = base + rainAmt*exp(-dot(rp,rp)/(rain.z*rain.z));
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ if(i==0&&j==0) continue;
    vec2 q=vUv+vec2(i,j)*px; if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) continue; float hq=Hh(q); float Aq=texture(T,q).z;
    float tot=0., mine=0.;
    for(int b=-1;b<=1;b++) for(int a=-1;a<=1;a++){ if(a==0&&b==0) continue; vec2 r=q+vec2(a,b)*px; if(r.x<0.||r.y<0.||r.x>1.||r.y>1.) continue;
      float sl=(hq-Hh(r))/length(vec2(a,b)); if(sl>0.){ float w=pow(sl,1.5); tot+=w; if(a==-i&&b==-j) mine=w; } }
    if(tot>0.) acc += Aq*mine/tot; }
  vec4 t=texture(T,vUv); o=vec4(t.x,t.y,acc,t.w); }`, { T: { value: null }, rain: { value: new THREE.Vector3(.5, .5, .06) }, rainAmt: { value: 0 }, base: { value: 0 } });
const eroMat = pass(`uniform sampler2D T; uniform float K;
void main(){ vec2 px=vec2(1./N); vec4 t=texture(T,vUv); float b=t.x, A=t.z;
  if (vUv.y < 1.5/N && t.w < 1.) { o=vec4(0.,0.,A,t.w); return; }
  float hmin=b, S=0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ if(i==0&&j==0) continue; vec2 q=vUv+vec2(i,j)*px; if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) continue;
    float hn=texture(T,q).x; S=max(S,(b-hn)/length(vec2(i,j))); hmin=min(hmin,hn); }
  float z=b+dipZ(vUv); float hd=hardOf(floor(z/LAYER));
  float E = K*0.0001*pow(max(A-2.,0.),0.5)*min(S,4.)/hd;
  b = max(b-E, min(b, hmin+0.01));
  float lap=0.; for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ if(abs(i)+abs(j)!=1) continue; vec2 q=clamp(vUv+vec2(i,j)*px,.5/N,1.-.5/N); lap+=texture(T,q).x-t.x; }
  b += 0.0012*lap/hd;
  o=vec4(b,t.y,A,t.w); }`, { T: { value: null }, K: { value: P('k') || 120 } });
const thermMat = pass(`uniform sampler2D T; uniform float tal;
void main(){ vec2 px=vec2(1./N); vec4 t=texture(T,vUv); float b=t.x; float d=0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ if(i==0&&j==0) continue; vec2 q=vUv+vec2(i,j)*px; if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) continue;
    float l=length(vec2(i,j)); float hn=texture(T,q).x; float s=(b-hn)/l;
    if (s>tal) d -= (s-tal)*l*0.05; else if (-s>tal) d += (-s-tal)*l*0.05; }
  if (vUv.y < 1.5/N && t.w < 1.) d=0.; o=vec4(b+d*0.5,t.y,t.z,t.w); }`, { T: { value: null }, tal: { value: P('tal') || 2.4 } });
// soft sun shadow computed in sim space (smooth, bilinear-sampled at render => no moiré)
const SUN = new THREE.Vector3(P('sx') || -0.85, P('sy') || 0.18, P('sz') || -0.25).normalize();
const VSC = (P('vx') || 1.25) / 256;    // cells -> world height (vertical exaggeration)
const shMat = pass(`uniform sampler2D T; uniform vec3 sun; uniform float vsc;
float Ht(vec2 uv){ return terrace(texture(T,uv).x, uv); }
void main(){ float h=Ht(vUv)*vsc; vec2 d=normalize(sun.xz); float sl=sun.y/length(sun.xz); float res=1., tt=1.5/N;
  for(int i=0;i<80;i++){ vec2 p=vUv+d*tt; if(p.x<0.||p.y<0.||p.x>1.||p.y>1.) break; float hh=Ht(p)*vsc; float ray=h+sl*tt;
    res=min(res, clamp((ray-hh)/(0.0006+tt*0.035),0.,1.));   /* penumbra widens with distance, but open flat ground is never self-shadowed (was a march-length darkening across the plateau) */ tt += max(1.0/N, tt*0.05); if(res<-.2) break; }
  o=vec4(clamp(res,0.,1.)); }`, { T: { value: null }, upl: { value: 0 }, capTop: { value: 0 }, sun: { value: new THREE.Vector3(SUN.x, SUN.y, SUN.z) }, vsc: { value: VSC } });

// ---------------------------------------------------------------- render
const scene = new THREE.Scene(); const DETAIL = { value: 2 };   // shader detail level, driven by the quality governor
const FOV0 = P('fov') || 50; const camera = new THREE.PerspectiveCamera(FOV0, innerWidth / innerHeight, 0.01, 20);
const cam = { x: P('cx') || 0.0, y: P("cy") || 0.17, z: P("cz") || 0.50, tx: P("tx") || 0.0, ty: P("ty") || 0.0, tz: P("tz") || -0.15 };
camera.position.set(cam.x, cam.y, cam.z); camera.lookAt(cam.tx, cam.ty, cam.tz);
const RCOMMON = SHARED + `
uniform sampler2D T, SHT; uniform vec3 sun; uniform float vsc;
vec4 TB(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p); vec2 q=(i+.5)/N; float e=1./N;
  return mix(mix(texture(T,q),texture(T,q+vec2(e,0)),f.x), mix(texture(T,q+vec2(0,e)),texture(T,q+vec2(e,e)),f.x), f.y); }
float HB(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p);
  vec4 wx = vec4(pow(1.-f.x,3.), 3.*f.x*f.x*f.x-6.*f.x*f.x+4., -3.*f.x*f.x*f.x+3.*f.x*f.x+3.*f.x+1., f.x*f.x*f.x)/6.;
  vec4 wy = vec4(pow(1.-f.y,3.), 3.*f.y*f.y*f.y-6.*f.y*f.y+4., -3.*f.y*f.y*f.y+3.*f.y*f.y+3.*f.y+1., f.y*f.y*f.y)/6.;
  float s=0.; for(int j=0;j<4;j++){ float r=0.; for(int k=0;k<4;k++){ r += wx[k]*texture(T,(i+vec2(float(k)-1.,float(j)-1.)+.5)/N).x; } s += wy[j]*r; } return s; }
float Ht(vec2 uv){ return terrace(HB(uv), uv); }
vec4 TBS(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p);   // smooth cubic B-spline of the data texture (river/lake masks without texel stairs)
  vec4 wx = vec4(pow(1.-f.x,3.), 3.*f.x*f.x*f.x-6.*f.x*f.x+4., -3.*f.x*f.x*f.x+3.*f.x*f.x+3.*f.x+1., f.x*f.x*f.x)/6.;
  vec4 wy = vec4(pow(1.-f.y,3.), 3.*f.y*f.y*f.y-6.*f.y*f.y+4., -3.*f.y*f.y*f.y+3.*f.y*f.y+3.*f.y+1., f.y*f.y*f.y)/6.;
  vec4 s=vec4(0.); for(int j=0;j<4;j++){ vec4 r=vec4(0.); for(int k=0;k<4;k++){ r += wx[k]*texture(T,(i+vec2(float(k)-1.,float(j)-1.)+.5)/N); } s += wy[j]*r; } return s; }
vec3 skyCol(vec3 rd){ float y=rd.y; float sd=max(dot(rd,sun),0.);
  vec3 hor = mix(vec3(1.05,.66,.48), vec3(1.45,.70,.28), pow(sd,2.0));   // warm dust-glow band at the horizon                 // dusty lavender horizon, apricot toward the sun
  vec3 mid = mix(vec3(.42,.46,.72), vec3(.95,.60,.42), pow(sd,3.)*0.7);
  vec3 c = mix(hor, mid, smoothstep(-.005,.10,y)); c = mix(c, vec3(.07,.17,.48), smoothstep(.08,.40,y));   // deep zenith
  c += vec3(1.,.50,.20)*pow(sd,10.)*1.0 + vec3(1.,.8,.55)*pow(sd,500.)*10.;
  return c; }
vec3 haze(vec3 col, vec3 rd, float dist, float wy){ float sd=max(dot(rd,sun),0.);
  vec3 hc = mix(vec3(.46,.56,.74), vec3(1.10,.70,.42), pow(sd,3.))*0.72;          // aerial perspective: violet away from the sun, gold toward it
  float f = 1.-exp(-max(dist-0.6,0.)*max(dist-0.6,0.)*0.10) ; f = clamp(f + 0.10*exp(-max(wy,0.)*28.)*smoothstep(0.,1.,dist), 0., 1.);
  return mix(col, hc, f*0.90); }
vec3 strataCol(float z){ float k=floor(z/LAYER); float h=hash(vec2(k,3.7)); float hd=hardOf(k);
  vec3 c;
  if (hd>1.) c = mix(vec3(.86,.62,.40), vec3(.84,.34,.15), step(.4,h));        // cream Coconino / red Redwall-like cliffs
  else c = mix(vec3(.74,.30,.13), vec3(.58,.30,.30), h);                       // red-brown / mauve slope formers
  c *= 0.85+0.3*hash(vec2(k,11.));
  return c; }
`;
const terrainMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3,
  uniforms: { detail: DETAIL, ghost: { value: new THREE.Vector2(0, 0) }, ptop: { value: 46 }, capTop: { value: 0 }, upl: { value: 0 }, T: { value: null }, SHT: { value: SH.texture }, N: { value: N }, seed: { value: +(Q.get('seed') || 3) }, sun: { value: SUN }, vsc: { value: VSC } },
  vertexShader: SHARED + `uniform sampler2D T; uniform float vsc; out vec2 vUv; out vec3 vW;
    vec4 TB(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p); vec2 q=(i+.5)/N; float e=1./N;
      return mix(mix(texture(T,q),texture(T,q+vec2(e,0)),f.x), mix(texture(T,q+vec2(0,e)),texture(T,q+vec2(e,e)),f.x), f.y); }
    float HB(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p);
  vec4 wx = vec4(pow(1.-f.x,3.), 3.*f.x*f.x*f.x-6.*f.x*f.x+4., -3.*f.x*f.x*f.x+3.*f.x*f.x+3.*f.x+1., f.x*f.x*f.x)/6.;
  vec4 wy = vec4(pow(1.-f.y,3.), 3.*f.y*f.y*f.y-6.*f.y*f.y+4., -3.*f.y*f.y*f.y+3.*f.y*f.y+3.*f.y+1., f.y*f.y*f.y)/6.;
  float s=0.; for(int j=0;j<4;j++){ float r=0.; for(int k=0;k<4;k++){ r += wx[k]*texture(T,(i+vec2(float(k)-1.,float(j)-1.)+.5)/N).x; } s += wy[j]*r; } return s; }
void main(){ vec2 u=vec2(uv.x, 1.-uv.y); vec2 u0=u;
#ifdef OUTER
      { float ox = max(max(-u.x, u.x-1.), 0.); u.y += 0.16*(fbm(vec2(u.x*3.1,1.7))-.5)*smoothstep(0.,.12,ox)*step(u.y,.6); }   // the escarpment wanders on beyond the sim domain: bays + promontories
#endif
      vUv=u; float h=terrace(HB(u),u); vec3 p=vec3(u0.x-.5, h*vsc, u0.y-.5); vW=p;
      gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  fragmentShader: RCOMMON + `uniform float ptop; uniform vec2 ghost;
#define DBGTOP ${Q.has('dbgtop') ? 'true' : 'false'}
#define DBGO ${Q.has('dbgo') ? 'true' : 'false'}
#define WLEVEL ${Q.has('nowl') ? 'false' : 'true'}
#define RIVON ${Q.has('oldriver') ? 'false' : 'true'}
#define P_WL ${(P('wl') || 0.18).toFixed(3)}
#define RLO ${(P('rlo') || 9.0).toFixed(2)}
in vec2 vUv; in vec3 vW; out vec4 o;
  void main(){
#ifdef OUTER
    if (vUv.x > 0.0005 && vUv.x < 0.9995 && vUv.y > 0.0005 && vUv.y < 0.9995 && abs(vW.z - (vUv.y-.5)) < 1e-4) discard;   // inside the sim domain the real terrain draws
    if (DBGO) { o=vec4(1.,0.,0.,1.); return; }
#endif
    float e=0.6/N; float hl=Ht(vUv-vec2(e,0.)), hr=Ht(vUv+vec2(e,0.)), hd=Ht(vUv-vec2(0.,e)), hu=Ht(vUv+vec2(0.,e));
    vec3 n=normalize(vec3((hl-hr)*vsc, 2.*e, (hd-hu)*vsc));
    vec4 t=TB(vUv); float h=Ht(vUv); float z=h+dipZ(vUv);
    // rock grain: pseudo-3D world-space noise (no fixed-pitch flutes), irregular bedding, broken ledges
    vec3 wq = vW*vec3(1.,1./vsc*0.004,1.);
    float g1 = fbm(vec2(vW.x*620.+vW.y*410., vW.z*620.-vW.y*380.)), g2 = fbm(vec2(vW.z*260.-vW.y*300., vW.x*260.+vW.y*170.)+9.);
    float wall = 1.-smoothstep(.55,.9,n.y);
    n = normalize(n + (vec3(g1-.5, 0., g2-.5)*0.9 + vec3(g2-.5,0.,-(g1-.5))*0.5)*wall);
    float fineZ = z/(LAYER*0.21) + 0.9*fbm(vUv*55.+z*0.02); float bed = smoothstep(0.,.18,fract(fineZ))*smoothstep(1.,.8,fract(fineZ));
    float flat_ = smoothstep(.80,.95,n.y);
    vec3 rock = strataCol(z);
    // plateau top: sand, slickrock with cross-bedding, desert-varnish patches, scrub, bleached caprock at the rim
    float n7 = fbm(vUv*7.+3.), n25 = fbm(vUv*25.+11.), n60 = fbm(vUv*60.);
    vec3 top = mix(vec3(.72,.50,.32), vec3(.62,.44,.29), smoothstep(.35,.75,n60));
    float slick = smoothstep(.60,.70,fbm(vUv*13.+5.) + 0.18*(n25-.5));
    float xbed = smoothstep(.0,.25,abs(fract(n25*9. + vUv.x*30.)-.5)*2.);              // swirling cross-bed lines in the slickrock
    top = mix(top, vec3(.80,.60,.44)*(0.90+0.10*xbed), slick*0.6);
    float varn = smoothstep(.60,.66, fbm(vUv*14.+27.) + 0.30*(n25-.5)) * (1.-slick*0.7);                       // dark desert-varnish / cryptobiotic crust patches
    top = mix(top, vec3(.36,.24,.17), varn*0.55);
    float rimL = 3./N; float hm = min(min(Ht(vUv+vec2(rimL,0.)),Ht(vUv-vec2(rimL,0.))), min(Ht(vUv+vec2(0.,rimL)),Ht(vUv-vec2(0.,rimL))));
    float rim = smoothstep(3., 10., h - hm);                                                // bleached caprock lip above every cliff
    top = mix(top, vec3(.88,.74,.56), rim*0.45);
    top *= (0.90+0.20*fbm(vUv*140.)) * 0.86;
    float scrubD = mix(0.79, 0.66, smoothstep(.3,.7,fbm(vUv*5.+40.))) + slick*0.12 + rim*0.1;
    float trees = smoothstep(scrubD, scrubD+0.05, fbm(vUv*520.+3.))*flat_*(1.-smoothstep(.45,.65,clamp((ptop-h)/32.,0.,1.)));
    vec3 alb = mix(rock, top, flat_*mix(0.85, 1.0, smoothstep(capTop-5., capTop-2., h)));   // untouched caprock: no strata colour bleeding through alb = mix(alb, vec3(.13,.15,.08), trees*0.75);
    float cliff = 1.-smoothstep(.25,.55,n.y);   // fine bedding only on true cliffs, so talus slopes don't read as contour lines
    alb *= mix(1., 0.72+0.28*bed, cliff) * (0.82+0.36*g1*wall + (1.-wall)*0.18);
    { float sub = fract(z/(LAYER*0.5) + 0.3*fbm(vUv*30.)); alb *= mix(1., 0.8 + 0.2*smoothstep(0.,.08,sub), cliff); }   // ledge partings
    { float hk = hardOf(floor(z/LAYER)); float below = fract(z/LAYER);                                   // desert varnish: dark streaks hanging from hard ledges, irregular pitch
      float st = smoothstep(.6,.8, fbm(vec2((vW.x+vW.z)*1400.+g2*3., z*0.05)));
      alb *= 1. - 0.14*st*wall*(hk>1. ? (1.-below) : 0.3);
      float scree = (hk<1. ? 1. : 0.)*smoothstep(.55,.85,n.y+0.25)*wall;                                  // talus aprons on soft slopes
      alb = mix(alb, vec3(.62,.44,.32)*(0.8+0.4*g2), scree*0.45); }
    { float hk = hardOf(floor(z/LAYER)); vec2 tg = normalize(vec2(-n.z, n.x)+1e-5); float s = dot(vW.xz, tg);   // vertical joints: blocky cliff faces in hard beds
      float lay = floor(z/(LAYER*0.5)); float pitch = 26. + 22.*hash(vec2(lay,8.1)); float u = s*pitch + hash(vec2(lay,2.3))*7. + 0.6*fbm(vec2(s*40., z*0.3));
      float cell = floor(u), fu = fract(u); float jm = wall*smoothstep(.3,.7,hk-0.5);
      float joint = 1.-smoothstep(0.,.06,fu)*smoothstep(1.,.94,fu);
      alb *= 1. - jm*(0.45*joint + 0.22*(hash(vec2(cell,lay))-.5));
      n = normalize(n + jm*vec3(tg.x,0.,tg.y)*(fu-.5)*0.35); }
    alb *= 0.55;
    float sh = texture(SHT, vUv).x;
    if (flat_ > 0.01 && detail > 1.5) { vec2 q = vUv*38.+50.; float e2 = 0.02; float b0 = fbm(q), bx = fbm(q+vec2(e2,0.)), bz = fbm(q+vec2(0.,e2));   // micro-relief on the caprock: slickrock domes + rubble catch the grazing sun
      vec2 q2 = vUv*160.; float c0 = fbm(q2), cx = fbm(q2+vec2(e2,0.)), cz = fbm(q2+vec2(0.,e2));
      vec2 gb = vec2(bx-b0, bz-b0)/e2*(0.10+0.25*slick) + vec2(cx-c0, cz-c0)/e2*0.05;
      n = normalize(n - vec3(gb.x, 0., gb.y)*flat_); }
    float nd = dot(n,sun); nd = mix(nd, max(nd, 0.10 + 0.6*nd), flat_);   // low sun grazes flat tops: keep them golden, not violet
    float dif = clamp(nd,0.,1.)*sh;
    float skyl = clamp(.5+.5*n.y,0.,1.);
    float bounce = clamp(dot(n, normalize(vec3(-sun.x,0.,-sun.z))),0.,1.);
    float depth = clamp((ptop - h)/32., 0., 1.);
    // scrub casts a tiny shadow on the sand (offset along -sun)
    { float ts2 = smoothstep(scrubD, scrubD+0.05, fbm((vUv+normalize(sun.xz)*0.0018)*520.+3.))*flat_; dif *= 1.-0.6*ts2*(1.-trees); }
    vec3 lin = dif*vec3(3.0,1.80,0.85)*2.5 + skyl*vec3(.24,.26,.58)*0.62*(1.-0.45*depth) + bounce*vec3(.70,.32,.13)*(0.30+1.0*depth)*(0.6+0.4*(1.-sh)) + vec3(.26,.10,.05)*depth*0.45;
    lin *= mix(1., 0.62, depth*(1.-sh));                                                    // deep shade is deep: value structure
    vec3 col = alb*lin;
    // river: water where drainage area is large, reflecting the sky
    vec4 ts = TBS(vUv + (vec2(fbm(vUv*90.), fbm(vUv*90.+31.))-.5)*1.4/N);   // slight domain warp: organic banks instead of D8 cell stairs
    float riv = RIVON ? smoothstep(RLO, RLO+1.6, ts.z) * smoothstep(.45,.75,n.y+0.1) * smoothstep(ptop-3., ptop-9., h) : smoothstep(9.5, 11.0, log2(1.+t.z)) * smoothstep(.9,.97,n.y+0.1) * smoothstep(HTOP-4., HTOP-12., h);
    riv = max(riv, smoothstep(0.35, 0.9, ts.y));   // lakes (real ones only)
    if (WLEVEL && riv > 0.01 && detail > 0.5) {   // water surface = local floor level: the shoreline follows the smooth height contour, not the D8 cell grid
      float lv = 1e9, lv2 = 1e9; for (int j=-2;j<=2;j++) for (int i=-2;i<=2;i++) { float hv = texture(T, vUv + vec2(i,j)/N).x; lv2 = min(lv2, hv); if (abs(i)<2 && abs(j)<2) lv = min(lv, hv); }
      float hr = HB(vUv); float wl = mix(lv, lv2, 0.3) + (P_WL);
      riv = smoothstep(0.02, 0.25, riv) * smoothstep(wl+0.06, wl-0.14, hr); }   // a ribbon in the floor, not a moat
    float wet = t.w * smoothstep(ptop-6., ptop-1., h);
    if (ghost.y > 0.) { float gd = 1e9; vec2 pc = vec2(0.30, 0.56+0.07*sin(0.6));   // wordless hint: a wet streak draws itself and dries
      for (int q=1; q<=24; q++) { float s=min(float(q)/24., ghost.x); vec2 c = vec2(0.30+0.40*s, 0.56+0.07*sin(s*6.283+0.6));
        vec2 pa=vUv-pc, ba=c-pc; float hq=clamp(dot(pa,ba)/max(dot(ba,ba),1e-9),0.,1.); gd = min(gd, length(pa-ba*hq)); pc = c; if (float(q)/24. >= ghost.x) break; }
      wet = max(wet, ghost.y * (1.-smoothstep(0.006, 0.016, gd)) * smoothstep(ptop-3., ptop-1., h)); }   // the drawn line reads as rain-darkened, glistening ground
    if (ghost.y > 0. && ghost.x < 1.) { vec2 tip = vec2(0.30+0.40*ghost.x, 0.56+0.07*sin(ghost.x*6.283+0.6)); float td = length(vUv-tip);   // the pen tip: a glinting drop leading the wet line
      col += vec3(1.4,1.2,.9)*(1.-smoothstep(.003,.010,td))*ghost.y*1.8 + vec3(1.,.8,.5)*exp(-td*td/(.02*.02))*ghost.y*0.35; }
    col *= 1. - 0.45*wet; { vec3 Rw=reflect(normalize(vW-cameraPosition), n); col += wet * skyCol(Rw) * 0.18 * pow(max(dot(Rw,sun),0.),24.) * 6.; }
    vec3 V=normalize(cameraPosition-vW); vec3 rd=-V;
    if (riv>0.) { float r1=fbm(vW.xz*vec2(900.,300.)+vec2(0.,vW.x*200.)), r2=fbm(vW.xz*vec2(260.,780.)+7.);   // ripples, streaked
      vec3 wn=normalize(vec3((r1-.5)*0.10,1.,(r2-.5)*0.10)); vec3 R=reflect(rd, wn); float fr=0.04+0.96*pow(1.-max(dot(V,wn),0.),5.);
      float deepW = clamp(smoothstep(.45,1.,riv)*0.6 + smoothstep(0.3,3.,ts.y)*0.6 + smoothstep(RLO+1.,RLO+4.,ts.z)*0.4, 0., 1.);
      vec3 body = mix(vec3(.19,.33,.15), vec3(.05,.15,.08), deepW*0.7);                  // Horseshoe-Bend jade: luminous in the sun, deep green in shade
      body *= mix(0.50, 0.85, sh);
      float gl = max(dot(R,sun),0.);
      vec3 w = mix(body, skyCol(R)*vec3(.66,.74,.52)*0.60, clamp(fr*1.0,.04,.16))                 // sky-reflection highlights in the ripples
             + vec3(1.,.85,.6)*(pow(gl,60.)*3.0 + pow(gl,8.)*0.25)*mix(0.3,1.,sh);              // sun glint path
      float bank = riv*(1.-riv)*4.; col = mix(col, col*0.62 + vec3(.05,.035,.02)*bank, bank*0.6);   // dark wet sand margin where water meets rock
      w *= 0.85+0.3*r1; col = mix(col, w, smoothstep(0.15,0.6,riv)); }
    float dist=length(vW-cameraPosition);
    float wm = (riv>0.) ? smoothstep(0.15,0.6,riv) : 0.;
    if (DBGTOP) { o=vec4(sh, dif, depth, 1.); return; }
    col = mix(haze(col, rd, dist, vW.y), haze(col, rd, dist*0.45, 1.), wm);     // water keeps its jade (no violet floor haze)
    o=vec4(col,1.); }` });
const terrain = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, (P('mesh') || 1100) - 1, (P('mesh') || 1100) - 1), terrainMat);
scene.add(terrain);
// the tableland runs on to the horizon: an outer skirt (same shader, clamped data, wandering escarpment), so there is no slab edge
const outerGeo = new THREE.PlaneGeometry(1, 1, 7 * 40, 4 * 40); { const uv = outerGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, -3 + 7 * uv.getX(i), -3 + 4 * uv.getY(i)); }
const outerMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, uniforms: terrainMat.uniforms, defines: { OUTER: 1 }, vertexShader: terrainMat.vertexShader, fragmentShader: terrainMat.fragmentShader });
const outer = new THREE.Mesh(outerGeo, outerMat); outer.frustumCulled = false; if (!Q.has('noskirt')) scene.add(outer);
// sky + far distance: distant mesa silhouettes in layers of haze
const skyMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, depthWrite: false, depthTest: false,
  uniforms: { detail: DETAIL, ptopS: { value: 20 }, capTop: { value: 0 }, sun: { value: SUN }, ipm: { value: new THREE.Matrix4() }, cpos: { value: camera.position }, N: { value: N }, seed: { value: 3 }, T: { value: null }, SHT: { value: null }, vsc: { value: VSC } },
  vertexShader: `out vec2 vP; void main(){ vP=position.xy; gl_Position=vec4(position.xy,0.9999,1.); }`,
  fragmentShader: RCOMMON + `uniform mat4 ipm; uniform vec3 cpos; uniform float ptopS; in vec2 vP; out vec4 o;
#define DBGPLAIN ${Q.has('dbgplain') ? 'true' : 'false'}
    float d_lit(vec3 rd, float az){ return 0.5+0.5*clamp(sun.x*sign(rd.x)*0.0+0.6,0.,1.); }
    void main(){ vec4 w=ipm*vec4(vP,1.,1.); vec3 rd=normalize(w.xyz/w.w-cpos);
      vec3 c=skyCol(rd);
      float az=atan(rd.x,-rd.z);
      for(int L=0; L<3; L++){ float fl=float(L); float hh=-1.;
        for(int q=0;q<7;q++){ float fq=float(q)+fl*7.; float a0=(hash(vec2(fq,1.3))-.5)*1.6; float wdt=0.03+0.10*hash(vec2(fq,2.7)); float ht=(0.010+0.026*hash(vec2(fq,5.1)))*(1.-fl*0.25);
          float d=abs(az-a0); float prof = ht*smoothstep(wdt, wdt*0.82, d) + ht*0.45*smoothstep(wdt*1.9, wdt, d); hh=max(hh,prof); }
        hh += 0.002*fbm(vec2(az*80.,fl));
        float horizon = 0.0 - fl*0.0;
        if (rd.y >= 0. && rd.y < horizon + hh && hh>0.002) { float lit = d_lit(rd, az);
          vec3 m = vec3(.62,.32,.22)*lit + vec3(.20,.22,.36);
          c = mix(m*0.62, mix(vec3(.48,.44,.56), vec3(1.0,.62,.36), pow(max(dot(rd,sun),0.),4.))*0.72, 0.18 + fl*0.18); }   // crisp, warm distant mesa skyline
      }
      if (rd.y < 0.) { float hp = 0.; float tt = (cpos.y-hp)/max(-rd.y,1e-4); vec3 wp = cpos+rd*tt;
        { float tq = (cpos.y-ptopS*vsc)/max(-rd.y,1e-4); vec3 q = cpos+rd*tq; if (q.z > -0.5 - 0.22*fbm(vec2(q.x*3.,7.)) - 0.06*sin(q.x*9.+1.)) { tt = tq; wp = q; } }   // irregular rim, not a ruler edge   // the tableland continues left/right/behind you
        vec3 lightG = vec3(2.6,1.75,1.05)*2.0*sun.y*1.4 + vec3(.18,.24,.37);
        vec3 g = (wp.y > 1e-4 ? vec3(.60,.41,.30)*0.40 : vec3(.66,.42,.28)*0.40)*(0.85+0.3*fbm(wp.xz*30.))*lightG;
        bool farPlain = wp.y < 1e-4;
        if (farPlain) {   // the lowland beyond the escarpment: dark scrub/varnish mottling, and a second, distant tableland with its own cliff line
          g *= 0.75 + 0.5*fbm(wp.xz*4.) ; g = mix(g, vec3(.30,.20,.15)*lightG*0.5, 0.45*smoothstep(.55,.7,fbm(wp.xz*9.+3.)));
          float hF = ptopS*vsc*0.98; /* the opposite rim of the great gorge: tableland to the horizon */ float tF = (cpos.y-hF)/max(-rd.y,1e-4); vec3 qF = cpos+rd*tF;
          float edgeF = -1e9 - 0.30*fbm(vec2(qF.x*1.3, 2.)) - 0.10*sin(qF.x*5.+1.3*sin(qF.x*2.));
          float edgeG = -1e9 - 0.30*fbm(vec2(wp.x*1.3, 2.)) - 0.10*sin(wp.x*5.+1.3*sin(wp.x*2.)) - 0.05*fbm(vec2(wp.x*14., 5.));
          if (qF.z < edgeF) { tt = tF; wp = qF; g = vec3(.66,.46,.31)*0.5*(0.8+0.4*fbm(qF.xz*6.))*lightG; farPlain = false; }
          else if (wp.z < edgeG) { float yc = cpos.y + rd.y*((edgeG-cpos.z)/rd.z); float zl = yc/hF;          // ray meets the cliff face
            vec3 rk = mix(vec3(.85,.38,.18), vec3(.90,.62,.40), smoothstep(.3,.7, fract(zl*2.6+0.3*fbm(vec2(wp.x*20.,zl*3.)))));
            g = rk*0.5*(vec3(2.6,1.6,.9)*1.6*max(0.,sun.z*0.6+0.25)*(0.6+0.8*fbm(vec2(wp.x*30.,zl*4.))) + vec3(.20,.22,.40)); /* the far wall stands in its own shade, gullied */ tt = (edgeG-cpos.z)/rd.z; farPlain = false; } }
        if (false) g = haze(g, rd, tt, wp.y);
        else { float sd=max(dot(rd,sun),0.); vec3 dust = mix(vec3(.62,.54,.56), vec3(1.10,.70,.42), pow(sd,3.))*0.52;   // warm dusty distance, never a lavender 'lake'
          g *= (0.60 + 0.55*fbm(wp.xz*2.5+9.))*vec3(1.,.90,.80); g = mix(g, vec3(.24,.14,.10)*lightG*0.5, 0.55*smoothstep(.5,.72,fbm(wp.xz*5.+1.)));   // red soil, dark varnish/scrub
          g = mix(g, vec3(.80,.62,.46)*lightG*0.42, 0.45*smoothstep(.58,.72,fbm(wp.xz*11.+4.)));   // pale slickrock benches   // mottled distant tableland: varnish, scrub, slickrock
          g = mix(g, dust, clamp(1.-exp(-tt*0.11), 0., 0.70)); } c = g; if (DBGPLAIN && farPlain) c = vec3(1.,0.,1.); }
      o=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

const rtMain = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: SHOT ? 0 : 4 });
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, uniforms: { S: { value: rtMain.texture }, res: { value: new THREE.Vector2(innerWidth, innerHeight) }, ex: { value: P('ex') || 1.0 } },
  vertexShader: `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D S; uniform vec2 res; uniform float ex; in vec2 vUv; out vec4 o;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    void main(){ vec2 p=vUv-.5; vec3 c=texture(S,vUv).rgb;
      vec3 g=vec3(0.); float w=0.; for(int i=-4;i<=4;i++) for(int j=-4;j<=4;j++){ vec2 q=vec2(i,j)*6.; vec3 s=texture(S,vUv+q/res).rgb; g+=max(s-1.1,0.); w+=1.; }
      c += g/w*0.6;
      c = aces(c*ex); c = pow(c, vec3(1./2.2));
      c = mix(c, c*c*(3.-2.*c), 0.30);                                   // gentle S-curve: more value structure
      float L = dot(c, vec3(.299,.587,.114)); c = mix(vec3(L), c, 1.12);
      c *= 1.-0.30*dot(p,p)*1.6; c += (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
      o=vec4(c,1.); }` }));
const postScene = new THREE.Scene(); postScene.add(post);
const DPR = SHOT ? 1 : Math.min(devicePixelRatio || 1, 1.25), meshes = {}; terrain.userData.mesh = P("mesh") || 1100;
function applyLevel(l) { const L = [{ s: 1.0, d: 2, mesh: 1100 }, { s: 0.85, d: 2, mesh: 1100 }, { s: 0.72, d: 1, mesh: 700 }, { s: 0.6, d: 1, mesh: 700 }, { s: 0.5, d: 0, mesh: 400 }][l];
  const w = Math.round(innerWidth * DPR * L.s), h = Math.round(innerHeight * DPR * L.s); rtMain.setSize(w, h); post.material.uniforms.res.value.set(w, h); DETAIL.value = L.d;
  const mz = Math.min(L.mesh, P('mesh') || 1100); if (terrain.userData.mesh !== mz) { meshes[mz] = meshes[mz] || new THREE.PlaneGeometry(1, 1, mz - 1, mz - 1); terrain.geometry = meshes[mz]; terrain.userData.mesh = mz; }
  if (window.__gov0) window.__gov0.lvl = l; }
// ---------------------------------------------------------------- hero choreography: deep-time sky clock + camera descent to the rim
const SUN0 = SUN.clone(); const TOP0 = 20 * VSC;   // every pose is relative to the CURRENT plateau top (the plateau rises during a run)
const firstView = () => { const dy = (simInfo.top || 20) * VSC - TOP0; return { p: new THREE.Vector3(cam.x, cam.y + dy, cam.z), t: new THREE.Vector3(cam.tx, cam.ty + dy, cam.tz), f: FOV0 }; };
const focus = { x: 0, z: SHOT ? 0.06 : 0.02, sx: 0, sz: 0, n: 0 };   // rim view frames the player's own stroke (centroid of drawn cells)
const rimView = () => { const y = (simInfo.top || 20) * VSC; const fx = focus.x, fz = focus.z;
  return { p: new THREE.Vector3(fx * 0.6 + 0.02, y + 0.045, Math.min(0.49, fz + 0.45)), t: new THREE.Vector3(fx - 0.02, y - 0.03, fz) }; };
const bbox = { x0: 1, x1: -1, z0: 1, z1: -1 };   // stroke bounding box (world units), for the reveal framing
function bboxAdd(x, z) { bbox.x0 = Math.min(bbox.x0, x); bbox.x1 = Math.max(bbox.x1, x); bbox.z0 = Math.min(bbox.z0, z); bbox.z1 = Math.max(bbox.z1, z); }
if (SHOT && Q.get('stroke')) for (const q of strokeShape(Q.get('stroke'), N)) if (q) bboxAdd(q[0] / N - .5, q[1] / N - .5);
function frameView(cx, cz, W, D, pitchDeg, fill) { const y = (simInfo.top || 20) * VSC;   // steep high-oblique camera solved so a W x D box fills `fill` of the width
  const fov = 50, th = Math.tan(fov / 2 * Math.PI / 180), tw = th * Math.max(1, innerWidth / innerHeight), a = pitchDeg * Math.PI / 180;
  const d = Math.max(W / (fill * 2 * tw), D * Math.sin(a) / (0.80 * 2 * th));
  return { p: new THREE.Vector3(cx, y + d * Math.sin(a), cz + d * Math.cos(a)), t: new THREE.Vector3(cx, y, cz), f: fov }; }
const revView = () => { const ok = bbox.x1 > bbox.x0, pad = 0.10;   // reveal: ~60 deg down, tight on the stroke
  return frameView(ok ? (bbox.x0 + bbox.x1) / 2 : focus.x, ok ? (bbox.z0 + bbox.z1) / 2 : focus.z, ok ? bbox.x1 - bbox.x0 + 2 * pad : 0.6, ok ? bbox.z1 - bbox.z0 + 2 * pad : 0.6, P('rpitch') || 60, P('rfill') || 0.60); };
const drawView = () => frameView(0, 0.12, 0.78, 0.78, P('dpitch') || 74, 0.84);   // drawing pose: >=70 deg down, so what you draw on screen is what lands on the ground   // drawing pose: steep enough that what you draw on screen lands undistorted
const choreo = { mode: SHOT ? 'draw' : 'first', k: 0, last: performance.now(), hold: 0, from: null, pending: false, prog: 0 };
function setView(a, b, k) { const e = k * k * (3 - 2 * k); camera.position.lerpVectors(a.p, b.p, e); const fa = a.f || FOV0, fb = b.f || FOV0; if (camera.fov !== fa + (fb - fa) * e) { camera.fov = fa + (fb - fa) * e; camera.updateProjectionMatrix(); } camera.lookAt(new THREE.Vector3().lerpVectors(a.t, b.t, e)); }
const curView = () => { const d = new THREE.Vector3(); camera.getWorldDirection(d); return { p: camera.position.clone(), t: camera.position.clone().add(d.multiplyScalar(0.5)), f: camera.fov }; };
function goTo(mode) { choreo.from = curView(); choreo.mode = mode; choreo.k = 0; }
const yrs = document.getElementById('yrs');
function tick() {
  const now = performance.now(), dt = Math.min(0.25, (now - choreo.last) / 1000); choreo.last = now;
  const running = simInfo.budget > 0 && !simInfo.done;
  const prog = simInfo.steps / Math.max(1, simInfo.budget + simInfo.steps); choreo.prog += ((running || simInfo.done ? prog : 0) - choreo.prog) * Math.min(1, dt * 3);
  // calm deep-time clock: no day/night strobe; the low sun swings slowly round so shadows creep across the walls as the canyon deepens
  const az = -0.55 * choreo.prog; SUN.set(SUN0.x * Math.cos(az) - SUN0.z * Math.sin(az), SUN0.y * (1 - 0.25 * choreo.prog), SUN0.x * Math.sin(az) + SUN0.z * Math.cos(az)).normalize(); shMat.uniforms.sun.value.copy(SUN);
  post.material.uniforms.ex.value = P('ex') || 1.0;
  if (yrs) { const show = (running || simInfo.done) && simInfo.steps > 0 && !['draw', 'toDraw', 'first'].includes(choreo.mode);
    yrs.style.opacity = show ? (simInfo.done ? 0.55 : 0.9) : 0; if (show) yrs.textContent = (Math.round(simInfo.steps * 30000 / 10000) * 10000).toLocaleString('en-US') + ' yrs'; }
  if (running && (choreo.mode === 'draw' || choreo.mode === 'toDraw') && !drawingNow()) goTo('toReveal');   // carving starts: rise to the reveal pose
  const T = { toDraw: [0.45, drawView, 'draw'], toReveal: [1.6, revView, 'reveal'], toRim: [4.5, rimView, 'rim'], toRest: [3.0, revView, 'reveal'] }[choreo.mode];
  if (T) { choreo.k = Math.min(1, choreo.k + dt / T[0]); setView(choreo.from, T[1](), choreo.k); if (choreo.k >= 1) { choreo.mode = T[2]; if (T[2] === 'draw') onDrawPose(); } }
  if (choreo.mode === 'draw') { const r = drawView(); setView(r, r, 1); }
  if (choreo.mode === 'first') { const r = firstView(); setView(r, r, 1); }
  if (choreo.mode === 'reveal') { const r = revView(); setView(r, r, 1);
    if (simInfo.done && !choreo.rested && scrub.idx < 0) { if (choreo.hold === 0) snd.chord(); choreo.hold += dt; if (choreo.hold > 2.2 && !Q.has('norim')) { goTo('toRim'); choreo.hold = 0; } } }   // hold the finished shape ~2 s, then descend
  if (choreo.mode === 'rim') { const r = rimView(); const s = Math.sin(now / 9000) * 0.05; r.p.x += s; r.t.x += s * 0.6; setView(r, r, 1);
    choreo.hold += dt; if (choreo.hold > 4 && !Q.has('stayrim')) { choreo.hold = 0; choreo.rested = true; goTo('toRest'); } }   // stand on the rim, then pull back up: the resting frame is YOUR shape
}
let drawingNow = () => false, onDrawPose = () => {};
function render() {
  shMat.uniforms.T.value = T0.texture; run(shMat, SH);
  terrainMat.uniforms.T.value = T0.texture;
  camera.updateMatrixWorld(); skyMat.uniforms.ipm.value.copy(camera.projectionMatrixInverse).premultiply(camera.matrixWorld);
  renderer.setRenderTarget(rtMain); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, simCam);
}
// ---------------------------------------------------------------- interaction: hold = rain where you point
const ray = new THREE.Raycaster(), m2 = new THREE.Vector2(); 
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -5 * VSC);

addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); applyLevel(window.__gov ? window.__gov().level : 0); });

const snd = (() => { let ac = null, master, rainG, rainF, rumG, windG, droneO = null, muted = false;
  const start = () => { if (ac || SHOT) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0); let b = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.985 * b + 0.015 * w; d[i] = w * 0.6 + b * 4; }
    const src = () => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * 2); return s; };
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 380; wf.Q.value = 0.6; windG = ac.createGain(); windG.gain.value = 0.05; src().connect(wf).connect(windG).connect(master);   // desert wind
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 160; lfo.connect(lg).connect(wf.frequency); lfo.start();
    rainF = ac.createBiquadFilter(); rainF.type = 'highpass'; rainF.frequency.value = 2400; rainG = ac.createGain(); rainG.gain.value = 0; src().connect(rainF).connect(rainG).connect(master);   // rain hiss under the pen
    const rf = ac.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 110; rumG = ac.createGain(); rumG.gain.value = 0; src().connect(rf).connect(rumG).connect(master);   // deep-time rumble
    const o = ac.createOscillator(), og = ac.createGain(); droneO = o; o.frequency.value = 41; og.gain.value = 0.35; o.connect(og).connect(rumG); o.start(); };
  const ramp = (g, v, t = 0.25) => { if (ac && g) g.gain.setTargetAtTime(v, ac.currentTime, t); };
  return { start, rain: on => ramp(rainG, on ? 0.10 : 0, on ? 0.05 : 0.4), speed: v => { if (ac && rainF) { rainF.frequency.setTargetAtTime(1800 + Math.min(4000, v * 900), ac.currentTime, 0.05); ramp(rainG, 0.06 + Math.min(0.12, v * 0.04), 0.05); } },
    rumble: (on, k = 0) => { ramp(rumG, on ? 0.18 + 0.25 * k : 0, on ? 0.6 : 1.5); if (ac && droneO) droneO.frequency.setTargetAtTime(38 + 30 * k, ac.currentTime, 0.5); },
    chord: () => { if (!ac || muted) return; const t = ac.currentTime; for (const f of [196, 246.9, 293.7, 392]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0005, t + 6); o.connect(g).connect(master); o.start(t); o.stop(t + 6.2); } },
    state: () => ({ state: ac ? ac.state : 'none', muted }), mute: () => { muted = !muted; if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.05); } }; })();
window.__snd = snd;
const scrub = (() => { const S = []; let idx = -1;   // deep-time snapshots (~every 10 steps) of the packed terrain; the wheel scrubs them, no recompute
  return { reset() { S.length = 0; idx = -1; }, keep(m) { if (idx >= 0) return; const lastS = S[S.length - 1]; if (!lastS || m.steps - lastS.steps >= 10 || m.done) S.push({ data: m.data.slice(), top: m.top, upl: m.upl, steps: m.steps }); },
    ok() { return S.length > 2 && simInfo.done; },
    by(d) { if (idx < 0) idx = S.length - 1; idx = Math.max(0, Math.min(S.length - 1, idx + d)); const s = S[idx]; const keep = simInfo; onFrame({ data: s.data, top: s.top, upl: s.upl }); simInfo = Object.assign({}, keep, { steps: s.steps, top: s.top }); if (idx === S.length - 1) idx = -1; },
    get n() { return S.length; }, get idx() { return idx; } }; })();
window.__scrub = (d) => { if (d) scrub.by(d); return { n: scrub.n, idx: scrub.idx, steps: simInfo.steps }; };
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
const CFG = {}; for (const k of ['K', 'Ac', 'U', 'ScH', 'ScS', 'H0', 'bg', 'budget', 'seed', 'blur', 'rimSharp', 'bgVar', 'playMs', 'minSize', 'gw', 'sup', 'supR', 'supIn']) if (Q.has(k)) CFG[k] = +Q.get(k); if (Q.has('edges')) CFG.edges = Q.get('edges');
worker.postMessage({ type: 'init', N, cfg: CFG, stroke: SHOT ? (Q.get('stroke') || null) : null, t: SHOT ? TSTEPS : 0 });
const hud = document.getElementById('hud');
if (SHOT) {
  worker.onmessage = ({ data: m }) => { onFrame(m); if (m.done || !TSTEPS) { const cm = Q.get('cam') || (TSTEPS > 0 ? 'reveal' : 'low'); { const r = cm === 'rim' ? rimView() : cm === 'draw' ? drawView() : cm === 'reveal' ? revView() : firstView(); setView(r, r, 1); } render(); window.__ready = true; } };
} else {
  let drawing = false, last = null, idle = performance.now(), drew = false, down = false, ptr = null, strokePts = [], setPts = [], grace = 0, lastSet = [];
  drawingNow = () => drawing || grace > 0;
  window.__strokeCells = () => lastSet.filter(Boolean);
  const toCell = e => { m2.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(m2, camera); const p = new THREE.Vector3();
    plane.constant = -(simInfo.top || 20) * VSC; return ray.ray.intersectPlane(plane, p) ? [(p.x + .5) * N, (p.z + .5) * N] : null; };
  const startDraw = e => { choreo.rested = false; choreo.hold = 0; drawing = true; drew = false; last = toCell(e); strokePts = last ? [last] : []; idle = Infinity; if (grace) { clearTimeout(grace); grace = 0; }
    worker.postMessage({ type: 'begin' }); snd.rain(true); scrub.reset(); };
  onDrawPose = () => { if (choreo.pending && down && ptr) startDraw(ptr); choreo.pending = false; };
  const commit = () => { grace = 0; if (!setPts.length) return; lastSet = setPts; worker.postMessage({ type: 'release', pts: setPts }); setPts = []; };   // multi-stroke: the run starts 1.2 s after the LAST stroke
  addEventListener('pointerdown', e => { if (e.button > 0) return; down = true; ptr = e; snd.start(); if (grace) { clearTimeout(grace); grace = 0; }
    if (choreo.mode === 'draw') { startDraw(e); return; }
    if (choreo.mode !== 'toDraw') goTo('toDraw'); choreo.pending = true; });   // never swallow the click: glide to the drawing pose (0.45 s), then the stroke starts under the pointer
  addEventListener('pointermove', e => { ptr = e; if (choreo.mode === 'first') goTo('toDraw');   // hover glides the camera into the drawing pose
    if (!drawing) return; const c = toCell(e); if (c && last) { worker.postMessage({ type: 'seg', pts: [last, c] }); strokePts.push(c); drew = true; snd.speed(Math.hypot(c[0] - last[0], c[1] - last[1]));
      focus.sx += c[0] / N - .5; focus.sz += c[1] / N - .5; focus.n++; focus.x = focus.sx / focus.n; focus.z = focus.sz / focus.n; bboxAdd(c[0] / N - .5, c[1] / N - .5); } last = c; });
  addEventListener('pointerup', () => { down = false; snd.rain(false); if (!drawing) return; drawing = false; idle = Infinity;
    if (!drew && last) { const dot = []; for (const r of [3.2, 1.6]) for (let k = 0; k <= 12; k++) { const a = k / 12 * 2 * Math.PI; dot.push([last[0] + r * Math.cos(a), last[1] + r * Math.sin(a)]); }   // a tap = a dot (a sinkhole/spring), e.g. smiley eyes
      worker.postMessage({ type: 'seg', pts: dot }); strokePts = dot; bboxAdd(last[0] / N - .5, last[1] / N - .5); drew = true; }
    if (drew) { setPts.push(...strokePts, null); grace = setTimeout(commit, P('grace') || 1200); } drew = false; });
  addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') { worker.postMessage({ type: 'init', N, cfg: Object.assign({}, CFG, { seed: 1 + Math.floor(Math.random() * 1000) }) }); goTo('toDraw'); focus.sx = focus.sz = focus.n = 0; focus.x = 0; focus.z = 0.02; bbox.x0 = bbox.z0 = 1; bbox.x1 = bbox.z1 = -1; scrub.reset(); }   // R = new plateau
    if (e.key === ' ') { e.preventDefault(); if (!e.repeat) worker.postMessage({ type: 'fast', on: true }); }   // hold space: deep time races
    if (e.key === 'm' || e.key === 'M') snd.mute(); });
  addEventListener('keyup', e => { if (e.key === ' ') worker.postMessage({ type: 'fast', on: false }); });
  addEventListener('wheel', e => { if (scrub.ok()) { e.preventDefault(); scrub.by(e.deltaY > 0 ? -1 : 1); } }, { passive: false });   // wheel: scrub deep time (down = back toward the stroke)
  setInterval(() => snd.rumble(simInfo.budget > 0 && !simInfo.done, simInfo.steps / Math.max(1, simInfo.steps + simInfo.budget)), 200);
  window.__audio = () => snd.state();
  worker.onmessage = ({ data: m }) => { if (m.type === 'stroke') { lastSet = m.cells || lastSet; if (m.first) { bbox.x0 = bbox.z0 = 1; bbox.x1 = bbox.z1 = -1; } bboxAdd(m.b[0] / N - .5, m.b[2] / N - .5); bboxAdd(m.b[1] / N - .5, m.b[3] / N - .5); return; } if (m.steps > 0 || m.done) scrub.keep(m); onFrame(m); };   // camera choreography (reveal -> rim) is driven from tick()
  // adaptive quality governor: measures frame time (EMA) and steps a ladder of render scale, shader detail and mesh LOD.
  // ?q=0..4 pins a level (0 = best); default is auto, starting at level 1.
  const LADDER = [{ s: 1.0, d: 2, mesh: 1100 }, { s: 0.85, d: 2, mesh: 1100 }, { s: 0.72, d: 1, mesh: 700 }, { s: 0.6, d: 1, mesh: 700 }, { s: 0.5, d: 0, mesh: 400 }];
  const QPIN = Q.has('q') ? Math.max(0, Math.min(4, Math.round(+Q.get('q')))) : -1;
  const gov = { lvl: QPIN >= 0 ? QPIN : 1, ema: 16, t: performance.now(), hold: 0, worst: 0, log: [] };
  window.__applyLevel = applyLevel; applyLevel(gov.lvl);
  function governor() { const now = performance.now(), d = now - gov.t; gov.t = now; if (document.hidden) return; gov.worst = Math.max(gov.worst, d);
    gov.ema += (Math.min(d, 150) - gov.ema) * 0.08; if (QPIN >= 0 || ++gov.hold < 20) return;
    let l = gov.lvl; if (gov.ema > 24 && l < LADDER.length - 1) l++; else if (gov.ema < 12.5 && l > 0 && gov.hold > 240) l--;   // fast down, slow up
    if (l !== gov.lvl) { gov.log.push({ t: Math.round(now), from: gov.lvl, to: l, ms: +gov.ema.toFixed(1) }); applyLevel(l); gov.hold = 0; } }
  window.__gov = () => ({ level: gov.lvl, ...LADDER[gov.lvl], frameMs: +gov.ema.toFixed(1), worstMs: Math.round(gov.worst), pinned: QPIN >= 0, log: gov.log });
  const loop = () => { requestAnimationFrame(loop); governor(); tick(); { const it = (performance.now() - idle - 2500) / 1000; let gx = 0, gy = 0;   // wordless idle hint: a wet stroke draws itself across the plateau, then dries
      if (it > 0) { const c = it % 5; gx = Math.min(1, c / 1.6); gy = c < 1.6 ? 1 : Math.max(0, 1 - (c - 1.6) / 1.4); }
      terrainMat.uniforms.ghost.value.set(gx, gy); } render(); window.__ready = true; }; loop();
}
window.__bench = (n = 3) => { const gl = renderer.getContext(), out = [], px = new Uint8Array(4); for (let l = 0; l < 5; l++) { applyLevel(l); render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const t0 = performance.now(); for (let k = 0; k < n; k++) { render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } out.push({ level: l, ms: +((performance.now() - t0) / n).toFixed(1) }); } return out; };
window.__choreo = () => choreo.mode;
window.__cam = () => ({ pose: choreo.mode, p: camera.position.toArray().map(v => +v.toFixed(3)), top: +((simInfo.top || 20) * VSC).toFixed(3) });
window.__timing = () => ({ steps: simInfo.steps, total: simInfo.total, msPerStep: simInfo.msPerStep, budget: simInfo.budget, done: simInfo.done });
window.__cellToScreen = (x, y) => { const v = new THREE.Vector3(x / N - .5, (simInfo.top || 20) * VSC, y / N - .5).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
window.__stats = () => { const a = tdata;
  let mx = -1e9, mn = 1e9, amx = 0; for (let i = 0; i < N * N; i++) { mx = Math.max(mx, a[i * 4]); mn = Math.min(mn, a[i * 4]); amx = Math.max(amx, a[i * 4 + 2]); } return { mx, mn, amx }; };
