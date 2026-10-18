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
const SH = new THREE.WebGLRenderTarget(N * (P('shr') || 2), N * (P('shr') || 2), { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const simScene = new THREE.Scene(); const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); simScene.add(quad);
const VS = `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const HTOP = P('htop') || 40, LAYER = SLAYER;
const SHARED = `
#define RIMSS ${Q.has("rimss") ? "true" : "false"}
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
float Hb(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p);   /* same cubic B-spline as the mesh: the data texture is nearest-filtered, so anything else self-shadows the walls in texel teeth (REVIEW-05 'stilts') */
  vec4 wx = vec4(pow(1.-f.x,3.), 3.*f.x*f.x*f.x-6.*f.x*f.x+4., -3.*f.x*f.x*f.x+3.*f.x*f.x+3.*f.x+1., f.x*f.x*f.x)/6.;
  vec4 wy = vec4(pow(1.-f.y,3.), 3.*f.y*f.y*f.y-6.*f.y*f.y+4., -3.*f.y*f.y*f.y+3.*f.y*f.y+3.*f.y+1., f.y*f.y*f.y)/6.;
  float s=0.; for(int j=0;j<4;j++){ float r=0.; for(int k=0;k<4;k++){ r += wx[k]*texture(T,(i+vec2(float(k)-1.,float(j)-1.)+.5)/N).x; } s += wy[j]*r; } return s; }
float Ht(vec2 uv){ return terrace(Hb(uv), uv); }
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
float HSm(vec2 uv){ if (!RIMSS) return HB(uv); float o=0.55/N; return 0.25*(HB(uv+vec2(o,o))+HB(uv+vec2(-o,o))+HB(uv+vec2(o,-o))+HB(uv+vec2(-o,-o))); }   /* REVIEW-06 #5: 2x2 supersampled B-spline: rim/wall tops lose the D8 texel teeth */
float Hs(vec2 uv){ return terrace(HSm(uv), uv); }
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
  if (hd>1.) c = mix(vec3(.72,.52,.36), vec3(.80,.34,.16), step(.4,h));   /* cream cliff toned to sandstone: the inner island's lit face must not glow like cake icing */        // cream Coconino / red Redwall-like cliffs
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
float HSv(vec2 uv){ if (!RIMSS) return HB(uv); float o=0.55/N; return 0.25*(HB(uv+vec2(o,o))+HB(uv+vec2(-o,o))+HB(uv+vec2(o,-o))+HB(uv+vec2(-o,-o))); }
void main(){ vec2 u=vec2(uv.x, 1.-uv.y); vec2 u0=u;
#ifdef OUTER
      { float ox = max(max(-u.x, u.x-1.), 0.); u.y += 0.0*(fbm(vec2(u.x*3.1,1.7))-.5)*smoothstep(0.,.12,ox)*step(u.y,.6); }   // the escarpment wanders on beyond the sim domain: bays + promontories
#endif
      vUv=u; float h=terrace(HSv(u),u); vec3 p=vec3(u0.x-.5, h*vsc, u0.y-.5); vW=p;
      gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  fragmentShader: RCOMMON + `uniform float ptop; uniform vec2 ghost;
#define DBGTOP ${Q.has('dbgtop') ? 'true' : 'false'}
#define DBGO ${Q.has('dbgo') ? 'true' : 'false'}
#define WLEVEL ${Q.has('nowl') ? 'false' : 'true'}
#define RIVON ${Q.has('oldriver') ? 'false' : 'true'}
#define P_WL ${(P('wl') || 0.18).toFixed(3)}
#define STRK ${(P('strk') || 0.10).toFixed(3)}
#define JNT ${(P('jnt') || 0.10).toFixed(3)}
#define GN ${(Q.has('gn') ? P('gn') : 1).toFixed(3)}
#define FN ${(Q.has('fn') ? P('fn') : 0).toFixed(3)}
#define SHB ${(Q.has('shb') ? P('shb') : 2.5).toFixed(3)}
#define ISLON ${Q.has('noisl') ? '0.' : '1.'}
#define STB ${(Q.has('stb') ? P('stb') : 1).toFixed(3)}
#define LIPCAP ${(Q.has('lipcap') ? P('lipcap') : 1.1).toFixed(3)}
#define EF0 ${(Q.has('ef0') ? P('ef0') : 0.42).toFixed(3)}
#define EFK ${(Q.has('efk') ? P('efk') : 1).toFixed(3)}
#define DBGISL ${Q.has('dbgisl') ? 'true' : 'false'}
#define RLO ${(P('rlo') || 9.0).toFixed(2)}
in vec2 vUv; in vec3 vW; out vec4 o;
  void main(){
#ifdef OUTER
    if (vUv.x > 0.0005 && vUv.x < 0.9995 && vUv.y > 0.0005 && vUv.y < 0.9995 && abs(vW.z - (vUv.y-.5)) < 1e-4) discard;   // inside the sim domain the real terrain draws
    if (DBGO) { o=vec4(1.,0.,0.,1.); return; }
#endif
    float e=0.6/N; float hl=Hs(vUv-vec2(e,0.)), hr=Hs(vUv+vec2(e,0.)), hd=Hs(vUv-vec2(0.,e)), hu=Hs(vUv+vec2(0.,e));
    vec3 n=normalize(vec3((hl-hr)*vsc, 2.*e, (hd-hu)*vsc));
    if (FN > 0.) { vec3 ng = normalize(cross(dFdy(vW), dFdx(vW))); if (ng.y < 0.) ng = -ng; n = normalize(mix(n, ng, FN*(1.-smoothstep(.45,.8,n.y)))); }   /* walls: shade the true mesh, not the texel-sampled slope (vertical stripes) */
    vec4 t=TB(vUv); float h=Ht(vUv); float z=h+dipZ(vUv);
    // rock grain: pseudo-3D world-space noise (no fixed-pitch flutes), irregular bedding, broken ledges
    vec3 wq = vW*vec3(1.,1./vsc*0.004,1.);
    float g1 = fbm(vec2(vW.x*620.+vW.y*410., vW.z*620.-vW.y*380.)), g2 = fbm(vec2(vW.z*260.-vW.y*300., vW.x*260.+vW.y*170.)+9.);
    float wall = 1.-smoothstep(.55,.9,n.y);
    n = normalize(n + (vec3(g1-.5, 0., g2-.5)*0.9 + vec3(g2-.5,0.,-(g1-.5))*0.5)*wall*(GN));
    float fineZ = z/(LAYER*0.21) + 0.9*fbm(vUv*55.+z*0.02); float bed = smoothstep(0.,.18,fract(fineZ))*smoothstep(1.,.8,fract(fineZ)); { float fw = fwidth(fineZ); bed = mix(bed, 0.62, smoothstep(.20, .60, fw)); }   /* REVIEW-07 #5: band-limited bedding: no stripe aliasing on long walls seen edge-on */
    float flat_ = smoothstep(.80,.95,n.y);
    vec3 rock = strataCol(z); { float k = floor(z/LAYER), hk = hardOf(k), fz = fract(z/LAYER); rock *= hk > 1. ? 1.0 + 0.10*STB : 1.0 - 0.16*STB; rock = mix(rock, rock*vec3(1.06,.92,.86), STB*smoothstep(.75,1.,fz)*(hk>1.?0.:1.)); rock = mix(rock, vec3(.62,.38,.26), smoothstep(.35,.85,fwidth(z/LAYER))); }   /* REVIEW-07 #5: strata read as bands (hard beds paler, soft beds darker/redder), band-limited when sub-pixel */
    // plateau top: sand, slickrock with cross-bedding, desert-varnish patches, scrub, bleached caprock at the rim
    float n7 = fbm(vUv*7.+3.), n25 = fbm(vUv*25.+11.), n60 = fbm(vUv*60.);
    vec3 top = mix(vec3(.55,.41,.30), vec3(.44,.33,.24), smoothstep(.30,.80,n60));
    float slick = smoothstep(.60,.70,fbm(vUv*13.+5.) + 0.18*(n25-.5));
    float xbed = smoothstep(.0,.25,abs(fract(n25*9. + vUv.x*30.)-.5)*2.);              // swirling cross-bed lines in the slickrock
    top = mix(top, vec3(.80,.60,.44)*(0.90+0.10*xbed), slick*0.6);
    float varn = smoothstep(.55,.64, fbm(vUv*14.+27.) + 0.30*(n25-.5)) * (1.-slick*0.7);                       // dark desert-varnish / cryptobiotic crust patches
    top = mix(top, vec3(.23,.16,.12), varn*0.76);
    float rimL = 3./N; float hm = min(min(Ht(vUv+vec2(rimL,0.)),Ht(vUv-vec2(rimL,0.))), min(Ht(vUv+vec2(0.,rimL)),Ht(vUv-vec2(0.,rimL))));
    float rim = smoothstep(3., 10., h - hm);                                                // bleached caprock lip above every cliff
    top = mix(top, vec3(.74,.56,.40), rim*0.12);
    top *= (0.90+0.20*fbm(vUv*140.)) * 0.86;
    float scrubD = mix(0.79, 0.66, smoothstep(.3,.7,fbm(vUv*5.+40.))) + slick*0.12 + rim*0.1;
    float trees = smoothstep(scrubD, scrubD+0.05, fbm(vUv*520.+3.))*flat_*(1.-smoothstep(.45,.65,clamp((ptop-h)/32.,0.,1.)));
    vec3 alb = mix(rock, top, flat_*mix(0.85, 1.0, smoothstep(capTop-5., capTop-2., h)));   /* untouched caprock: no strata colour bleeding through */ alb = mix(alb, vec3(.13,.15,.08), trees*0.25);
    float cliff = 1.-smoothstep(.25,.55,n.y);   // fine bedding only on true cliffs, so talus slopes don't read as contour lines
    alb *= mix(1., 0.72+0.28*bed, cliff) * (0.82+0.36*g1*wall + (1.-wall)*0.18);
    { float sz = z/(LAYER*0.5); float sub = fract(sz + 0.3*fbm(vUv*30.)); alb *= mix(1., 0.8 + 0.2*smoothstep(0.,.08,sub), cliff*smoothstep(.38,.62,fbm(vW.xz*60.+vec2(z*.07,3.)))*(1.-smoothstep(.15,.45,fwidth(sz)))); }   /* partings break up: irregular bedding, not ruled hairlines */   // ledge partings
    { float hk = hardOf(floor(z/LAYER)); float below = fract(z/LAYER);                                   // desert varnish: dark streaks hanging from hard ledges, irregular pitch
      float st = smoothstep(.6,.8, fbm(vec2((vW.x+vW.z)*520.+g2*3., z*0.05)));
      alb *= 1. - (STRK)*st*wall*(hk>1. ? (1.-below*0.7) : 0.35);
      float scree = (hk<1. ? 1. : 0.)*smoothstep(.55,.85,n.y+0.25)*wall;                                  // talus aprons on soft slopes
      alb = mix(alb, vec3(.62,.44,.32)*(0.8+0.4*g2), scree*0.45); }
    { float hk = hardOf(floor(z/LAYER)); vec2 tg = normalize(vec2(-n.z, n.x)+1e-5); float s = dot(vW.xz, tg);   // vertical joints: blocky cliff faces in hard beds
      float lay = floor(z/(LAYER*0.5)); float pitch = 11. + 12.*hash(vec2(lay,8.1)); float u = s*pitch + hash(vec2(lay,2.3))*7. + 0.6*fbm(vec2(s*40., z*0.3));
      float cell = floor(u), fu = fract(u); float jm = wall*smoothstep(.3,.7,hk-0.5);
      float joint = 1.-smoothstep(0.,.12,fu)*smoothstep(1.,.88,fu);
      alb *= 1. - jm*(JNT)*(joint + 0.8*(hash(vec2(cell,lay))-.5));   /* REVIEW-05: softer joints/varnish so walls don't read as pickets or stilts */
      n = normalize(n + jm*vec3(tg.x,0.,tg.y)*(fu-.5)*0.35); }
    { float isl = clamp(-t.y, 0., 1.) * ISLON; alb *= 1. - 0.12*isl*flat_ - 0.34*isl*(1.-flat_)*smoothstep(capTop-20., capTop-2., h); }   /* REVIEW-06 #2: island tops ~10 % under the plateau, and no bright caprock lip on island rims (only the outer rim gets it) -> a hole, not a pedestal */
    alb *= 0.55;
    float sh = texture(SHT, vUv).x;
    if (wall > 0.01 && SHB > 0.) { vec2 tg2 = normalize(vec2(-n.z, n.x)+1e-5)*SHB/N; float sb = 0.; for (int k=-3; k<=3; k++) sb += texture(SHT, vUv + tg2*float(k)/3.).x; sh = mix(sh, sb/7., wall); }   /* walls: smooth the shadow along the wall, so texel steps don't become vertical stripes / stilts */
    if (flat_ > 0.01 && detail > 1.5) { vec2 q = vUv*38.+50.; float e2 = 0.02; float b0 = fbm(q), bx = fbm(q+vec2(e2,0.)), bz = fbm(q+vec2(0.,e2));   // micro-relief on the caprock: slickrock domes + rubble catch the grazing sun
      vec2 q2 = vUv*160.; float c0 = fbm(q2), cx = fbm(q2+vec2(e2,0.)), cz = fbm(q2+vec2(0.,e2));
      vec2 gb = vec2(bx-b0, bz-b0)/e2*(0.10+0.25*slick) + vec2(cx-c0, cz-c0)/e2*0.05;
      n = normalize(n - vec3(gb.x, 0., gb.y)*flat_); }
    float nd = dot(n,sun); nd = mix(nd, max(nd, 0.06 + 0.5*nd), flat_);   // low sun grazes flat tops: keep them golden, not violet
    float dif = clamp(nd,0.,1.)*sh;
    float skyl = clamp(.5+.5*n.y,0.,1.);
    float bounce = clamp(dot(n, normalize(vec3(-sun.x,0.,-sun.z))),0.,1.);
    float depth = clamp((ptop - h)/24., 0., 1.);
    // scrub casts a tiny shadow on the sand (offset along -sun)
    { float ts2 = smoothstep(scrubD, scrubD+0.05, fbm((vUv+normalize(sun.xz)*0.0018)*520.+3.))*flat_; dif *= 1.-0.6*ts2*(1.-trees); }
    vec3 lin = dif*vec3(3.0,1.80,0.85)*2.5 + skyl*vec3(.24,.26,.58)*0.62*(1.-0.45*depth) + bounce*vec3(.70,.32,.13)*(0.30+0.30*depth)*(0.6+0.4*(1.-sh)) + vec3(.26,.10,.05)*depth*0.10;   /* less glow from below: a hole must get darker with depth */
    lin *= mix(1., 0.62, depth*(1.-sh)) * mix(1., 0.30, smoothstep(.05, .6, depth)*(1.-0.6*sh*clamp(nd,0.,1.)));   /* sky occlusion: the floor and lower walls see little sky */                                                    // deep shade is deep: value structure
    vec3 col = alb*lin; col = mix(col, vec3(.05,.05,.07), 0.62*smoothstep(.18, .70, depth));
    if (LIPCAP > 0.) { float ndP = max(sun.y, 0.06 + 0.5*sun.y); vec3 platC = vec3(.50,.38,.28)*0.86*0.55*(ndP*vec3(3.0,1.80,0.85)*2.5 + vec3(.24,.26,.58)*0.62);   /* REVIEW-07 #5: walls never outshine the plateau: <=1.1x on outer rims, <=0.85x on island walls (no plinth glow, no icing) */
      float Lp = dot(platC, vec3(.299,.587,.114)), Lc = mix(LIPCAP, 0.85, clamp(-t.y,0.,1.))*Lp, L = dot(col, vec3(.299,.587,.114)); float ww = max(1. - flat_, rim);
      if (L > Lc) col *= mix(1., (Lc + (L - Lc)*0.12)/L, ww); }   /* floor + lower walls darken and cool with depth below the rim: a hole, not a raised block (REVIEW-05 #3) */   /* cool shadowed haze pooled at the bottom */
    // river: water where drainage area is large, reflecting the sky
    vec4 ts = TBS(vUv + (vec2(fbm(vUv*90.), fbm(vUv*90.+31.))-.5)*1.4/N);   // slight domain warp: organic banks instead of D8 cell stairs
    float riv = RIVON ? smoothstep(RLO, RLO+1.6, ts.z) * smoothstep(.45,.75,n.y+0.1) * smoothstep(ptop-3., ptop-9., h) : smoothstep(9.5, 11.0, log2(1.+t.z)) * smoothstep(.9,.97,n.y+0.1) * smoothstep(HTOP-4., HTOP-12., h);
    riv = max(riv, smoothstep(0.35, 0.9, ts.y));   // lakes (real ones only)
    if (WLEVEL && riv > 0.01) {   // water surface = local floor level: the shoreline follows the smooth height contour, not the D8 cell grid
      float lv = 1e9, lv2 = 1e9; for (int j=-2;j<=2;j++) for (int i=-2;i<=2;i++) { float hv = texture(T, vUv + vec2(i,j)/N).x; lv2 = min(lv2, hv); if (abs(i)<2 && abs(j)<2) lv = min(lv, hv); }
      float hr = HB(vUv); float wl = mix(lv, lv2, 0.3) + (P_WL) + 0.10*(fbm(vUv*36.+11.)-.5);   /* width varies along the reach */
      riv = smoothstep(0.02, 0.25, riv) * smoothstep(wl+0.06, wl-0.14, hr); }   // a ribbon in the floor, not a moat
    float wet = t.w * smoothstep(ptop-6., ptop-1., h);
    if (ghost.y > 0.) { float gd = 1e9; vec2 pc = vec2(0.26, 0.80+0.05*sin(0.6));   // wordless hint: a wet streak draws itself and dries
      for (int q=1; q<=24; q++) { float s=min(float(q)/24., ghost.x); vec2 c = vec2(0.26+0.48*s, 0.80+0.05*sin(s*6.283+0.6));
        vec2 pa=vUv-pc, ba=c-pc; float hq=clamp(dot(pa,ba)/max(dot(ba,ba),1e-9),0.,1.); gd = min(gd, length(pa-ba*hq)); pc = c; if (float(q)/24. >= ghost.x) break; }
      wet = max(wet, ghost.y * (1.-smoothstep(0.009, 0.022, gd)) * smoothstep(ptop-3., ptop-1., h)); }   // the drawn line reads as rain-darkened, glistening ground
    if (ghost.y > 0. && ghost.x < 1.) { vec2 tip = vec2(0.26+0.48*ghost.x, 0.80+0.05*sin(ghost.x*6.283+0.6)); float td = length(vUv-tip);   // the pen tip: a glinting drop leading the wet line
      col += vec3(1.4,1.2,.9)*(1.-smoothstep(.004,.012,td))*ghost.y*3.0 + vec3(1.,.8,.5)*exp(-td*td/(.025*.025))*ghost.y*0.6; }
    col *= 1. - 0.45*wet; { vec3 Rw=reflect(normalize(vW-cameraPosition), n); col += wet * skyCol(Rw) * 0.18 * pow(max(dot(Rw,sun),0.),24.) * 6.; }
    vec3 V=normalize(cameraPosition-vW); vec3 rd=-V;
    if (riv>0.) { float r1=fbm(vW.xz*vec2(900.,300.)+vec2(0.,vW.x*200.)), r2=fbm(vW.xz*vec2(260.,780.)+7.);   // ripples, streaked
      vec3 wn=normalize(vec3((r1-.5)*0.10,1.,(r2-.5)*0.10)); vec3 R=reflect(rd, wn); float fr=0.04+0.96*pow(1.-max(dot(V,wn),0.),5.);
      float deepW = clamp(smoothstep(.45,1.,riv)*0.6 + smoothstep(0.3,3.,ts.y)*0.6 + smoothstep(RLO+1.,RLO+4.,ts.z)*0.4, 0., 1.);
      vec3 body = mix(vec3(.25,.30,.21), vec3(.09,.13,.10), deepW*0.75);   /* silt-jade, S<=.35 (REVIEW-04 P3-5) */                  // Horseshoe-Bend jade: luminous in the sun, deep green in shade
      body *= mix(0.38, 0.85, sh);
      float gl = max(dot(R,sun),0.);
      vec3 w = mix(body, skyCol(R)*vec3(.72,.74,.62)*0.60, clamp(fr*1.0,.04,.16))                 // sky-reflection highlights in the ripples
             + vec3(1.,.85,.6)*(pow(gl,60.)*3.0 + pow(gl,8.)*0.25)*mix(0.3,1.,sh);              // sun glint path
      float bank = riv*(1.-riv)*4.; col = mix(col, col*0.62 + vec3(.05,.035,.02)*bank, bank*0.6);   // dark wet sand margin where water meets rock
      w *= 0.85+0.3*r1; col = mix(col, w, smoothstep(0.15,0.6,riv)); }
    float dist=length(vW-cameraPosition);
    float wm = (riv>0.) ? smoothstep(0.15,0.6,riv) : 0.;
    if (DBGTOP) { o=vec4(sh, dif, depth, 1.); return; }
    if (DBGISL) { o=vec4(clamp(-t.y,0.,1.), clamp(t.y,0.,1.), 0., 1.); return; }
    col = mix(haze(col, rd, dist, vW.y), haze(col, rd, dist*0.45, 1.), wm);     // water keeps its jade (no violet floor haze)
#ifndef OUTER
    if (EFK > 0.) { vec3 wp = vW; vec3 lightG = vec3(2.6,1.75,1.05)*2.0*sun.y*1.4 + vec3(.18,.24,.37);   /* REVIEW-06 #4: the far margin of the sim domain blends into the exact colour the sky pass paints for the tableland beyond it -> no hard pale band */
      vec3 g = vec3(.60,.41,.30)*0.40*(0.85+0.3*fbm(wp.xz*30.))*lightG; float sd3=max(dot(rd,sun),0.); vec3 dust = mix(vec3(.62,.54,.56), vec3(1.10,.70,.42), pow(sd3,3.))*0.52;
      g *= (0.60 + 0.55*fbm(wp.xz*2.5+9.))*vec3(1.,.90,.80); g = mix(g, vec3(.24,.14,.10)*lightG*0.5, 0.55*smoothstep(.5,.72,fbm(wp.xz*5.+1.))); g = mix(g, vec3(.80,.62,.46)*lightG*0.42, 0.45*smoothstep(.58,.72,fbm(wp.xz*11.+4.)));
      g = mix(g, dust, clamp(1.-exp(-dist*0.11), 0., 0.70)); float ef = smoothstep(-EF0, -0.5, vW.z); col = mix(col, g, EFK*ef); }
#endif
    o=vec4(col,1.); }` });
const terrain = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, (P('mesh') || 1100) - 1, (P('mesh') || 1100) - 1), terrainMat);
scene.add(terrain);
// the tableland runs on to the horizon: an outer skirt (same shader, clamped data, wandering escarpment), so there is no slab edge
const SKD = P('skd') || 40, outerGeo = new THREE.PlaneGeometry(1, 1, 7 * SKD, 4 * SKD); { const uv = outerGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, -3 + 7 * uv.getX(i), -3 + 4 * uv.getY(i)); }
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
          g = mix(g, dust, max(clamp(1.-exp(-tt*0.11), 0., 0.70), ${(Q.has('bhz') ? P('bhz') : 0.5).toFixed(3)}*smoothstep(-0.52, -1.1, wp.z))); }   /* REVIEW-07 #5: the tableland past the far rim recedes into haze (no flat grey band) */ c = g; if (DBGPLAIN && farPlain) c = vec3(1.,0.,1.); }
      o=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

const rtMain = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: SHOT ? 0 : 4 });
const GR = { ex: P('ex') || 0.80, sat: P('sat') || 0.78, vig: P('vig') || 0.30, sc: P('sc') || 0.62 };   /* one grade for shots and live (shots never ran tick, so they rendered at ex 1.0) */
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, uniforms: { S: { value: rtMain.texture }, sc: { value: GR.sc }, sat: { value: GR.sat }, vig: { value: GR.vig }, res: { value: new THREE.Vector2(innerWidth, innerHeight) }, ex: { value: GR.ex }, ledge: { value: 0 }, warm: { value: 0 } },
  vertexShader: `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D S; uniform vec2 res; uniform float ex, sc, sat, vig, ledge, warm; in vec2 vUv; out vec4 o;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    void main(){ vec2 p=vUv-.5; vec3 c=texture(S,vUv).rgb;
      vec3 g=vec3(0.); float w=0.; for(int i=-4;i<=4;i++) for(int j=-4;j<=4;j++){ vec2 q=vec2(i,j)*6.; vec3 s=texture(S,vUv+q/res).rgb; g+=max(s-1.1,0.); w+=1.; }
      c += g/w*0.6;
      c = aces(c*ex); c = pow(c, vec3(1./2.2));
      c = mix(c, c*c*(3.-2.*c), sc);                                   // gentle S-curve: more value structure
      float L = dot(c, vec3(.299,.587,.114)); c = mix(vec3(L), c, sat);
      { float w = warm; c *= mix(vec3(1.), w > 0. ? vec3(1.07,.99,.89) : vec3(.94,1.0,1.07), abs(w)); float L2 = dot(c, vec3(.299,.587,.114));   /* REVIEW-07 #6 colour script: cool, even light while you draw -> warm at the reveal -> low golden light + cool shadows on the postcard */
        c += (vec3(.035,-.004,-.035)*smoothstep(.40,.90,L2) + vec3(-.018,.0,.022)*(1.-smoothstep(.04,.35,L2)))*max(w,0.); }
      if (ledge > 0.001) { float x = vUv.x; float e = (0.026 + 0.016*sin(x*6.3+1.3) + 0.010*sin(x*15.7+.4) + 0.005*sin(x*39.+2.))*ledge;   /* REVIEW-07 #2: an out-of-focus near ledge along the bottom of the postcard (foreground occluder, depth) */
        float m = smoothstep(e + 0.004, e - 0.003, vUv.y); vec3 lc = c*0.16 + vec3(.040,.026,.020) + vec3(.55,.32,.17)*exp(-max(e - vUv.y, 0.)*260.)*0.22; c = mix(c, lc, m); }
      c *= 1.-vig*dot(p,p)*1.6; c *= vec3(.985,1.02,.975);   /* neutralise the pink-magenta cast */ c += (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
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
let heroPts = SHOT && Q.get('stroke') ? strokeShape(Q.get('stroke'), N).slice() : [];   /* cells of the current drawing (null = pen up), for the postcard's long-axis yaw */
function frameView(cx, cz, W, D, pitchDeg, fill, yawDeg = 0, box = false) { const y = (simInfo.top || 20) * VSC;   // steep high-oblique camera solved so a W x D box fills `fill` of the width
  const fov = 50, th = Math.tan(fov / 2 * Math.PI / 180), tw = th * Math.max(1, innerWidth / innerHeight), a = pitchDeg * Math.PI / 180;
  const d = Math.max(W / (fill * 2 * tw), D * Math.sin(a) / (0.80 * 2 * th));
  const yw = yawDeg * Math.PI / 180, make = dd => ({ p: new THREE.Vector3(cx - dd * Math.cos(a) * Math.sin(yw), y + dd * Math.sin(a), cz + dd * Math.cos(a) * Math.cos(yw)), t: new THREE.Vector3(cx, y, cz), f: fov });
  return make(d); }   /* yaw > 0 swings the camera toward the sun (-x): sunlit walls face us, near walls fall into shade */
function heroBox() {   /* the carved cells (rim included) from the worker, unioned with the stroke bbox padded by the groove half-width; world units */
  const cb = simInfo.cb, top = (simInfo.top || 20) * VSC, ok = bbox.x1 > bbox.x0, gp = 0.035;
  let x0 = ok ? bbox.x0 - gp : focus.x - 0.3, x1 = ok ? bbox.x1 + gp : focus.x + 0.3, z0 = ok ? bbox.z0 - gp : focus.z - 0.3, z1 = ok ? bbox.z1 + gp : focus.z + 0.3, lo = top - 0.06;
  if (cb) { x0 = Math.min(x0, cb[0] / N - .5); x1 = Math.max(x1, cb[1] / N - .5); z0 = Math.min(z0, cb[2] / N - .5); z1 = Math.max(z1, cb[3] / N - .5); lo = Math.min(lo, cb[4] * VSC); }
  return { x0: Math.max(-.5, x0), x1: Math.min(.5, x1), z0: Math.max(-.5, z0), z1: Math.min(.5, z1), y0: lo, y1: top }; }
const FITCAM = new THREE.PerspectiveCamera(50, 1, 0.001, 100);
function fit3(box, pitchDeg, yawDeg, fov, lim = { l: -0.76, r: 0.76, b: -0.76, t: 0.76 }, lookPitch = null) {   /* REVIEW-05 #1: frustum fit of all 8 corners of the carved box with a 12 % margin each side, then re-centre */
  const a = pitchDeg * Math.PI / 180, yw = yawDeg * Math.PI / 180, dir = new THREE.Vector3(-Math.cos(a) * Math.sin(yw), Math.sin(a), Math.cos(a) * Math.cos(yw));
  const tgt = box.c ? new THREE.Vector3(box.c[0], (box.y0 + box.y1) / 2, box.c[1]) : new THREE.Vector3((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, (box.z0 + box.z1) / 2);
  const yb = box.y1 - 0.3 * (box.y1 - box.y0), C = []; if (box.C) { for (const [x, z] of box.C) for (const y of [yb, box.y1]) C.push(new THREE.Vector3(x, y, z)); } else for (const x of [box.x0, box.x1]) for (const y of [yb, box.y1]) for (const z of [box.z0, box.z1]) C.push(new THREE.Vector3(x, y, z));   /* the floor sits inside the rim outline from any oblique: fit the rim-level box (+30 % of the depth), not the deepest floor corner */
  FITCAM.fov = fov; FITCAM.aspect = innerWidth / Math.max(1, innerHeight); FITCAM.updateProjectionMatrix();
  const lp = (lookPitch ?? pitchDeg) * Math.PI / 180, look = new THREE.Vector3(Math.cos(lp) * Math.sin(yw), -Math.sin(lp), -Math.cos(lp) * Math.cos(yw));   // look direction may sit flatter than the camera elevation: the box goes low in frame, sky above
  const ext = d => { FITCAM.position.copy(tgt).addScaledVector(dir, d); FITCAM.lookAt(FITCAM.position.clone().add(look)); FITCAM.updateMatrixWorld(); let l = 9, r = -9, b = 9, t = -9, bad = false;
    for (const c of C) { const q = c.clone().project(FITCAM); if (q.z > 1 || q.z < -1) bad = true; l = Math.min(l, q.x); r = Math.max(r, q.x); b = Math.min(b, q.y); t = Math.max(t, q.y); } return { l, r, b, t, bad }; };
  let d = 1;
  for (let it = 0; it < 3; it++) {
    let lo = 0.03, hi = 8; for (let k = 0; k < 28; k++) { const m = (lo + hi) / 2, e = ext(m); if (e.bad || (e.r - e.l) > (lim.r - lim.l) || (e.t - e.b) > (lim.t - lim.b)) lo = m; else hi = m; } d = hi;
    const e = ext(d), ox = (e.l + e.r) / 2 - (lim.l + lim.r) / 2, oy = (e.b + e.t) / 2 - (lim.b + lim.t) / 2;   // shift the look-at so the box sits centred in the allowed window
    const th = Math.tan(fov / 2 * Math.PI / 180), right = new THREE.Vector3().setFromMatrixColumn(FITCAM.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(FITCAM.matrixWorld, 1);
    tgt.addScaledVector(right, ox * th * FITCAM.aspect * d).addScaledVector(up, oy * th * d); }
  const pp = tgt.clone().addScaledVector(dir, d), e = ext(d); return { p: pp, t: pp.clone().addScaledVector(look, d), f: fov, wfrac: (e.r - e.l) / 2 }; }
window.__fitCheck = () => { const box = heroBox(); camera.updateMatrixWorld(); let l = 9, r = -9, b = 9, t = -9; for (const x of [box.x0, box.x1]) for (const y of [box.y0, box.y1]) for (const z of [box.z0, box.z1]) { const q = new THREE.Vector3(x, y, z).project(camera); l = Math.min(l, q.x); r = Math.max(r, q.x); b = Math.min(b, q.y); t = Math.max(t, q.y); } return { box, ndc: [l, r, b, t].map(v => +v.toFixed(3)) }; };
const revView = () => { const hb = heroBox(), v = fit3(hb, P('rpitch') || 56, Q.has('ryaw') ? P('ryaw') : 12, 50); if (Q.has('noband')) return v;   /* REVIEW-06 #4: tilt the look down until the far plain (beyond the escarpment) leaves the top of the frame, as long as the shape stays inside */
  const y = (simInfo.top || 20) * VSC, d0 = v.t.clone().sub(v.p); FITCAM.fov = 50; FITCAM.aspect = innerWidth / Math.max(1, innerHeight); FITCAM.updateProjectionMatrix();
  const test = t => { FITCAM.position.copy(v.p); FITCAM.lookAt(t); FITCAM.updateMatrixWorld(); let edge = -9, top = -9; for (let k = -4; k <= 4; k++) edge = Math.max(edge, new THREE.Vector3(k * 0.12, y, -0.47).project(FITCAM).y);
    for (const x of [hb.x0, hb.x1]) for (const z of [hb.z0, hb.z1]) top = Math.max(top, new THREE.Vector3(x, y, z).project(FITCAM).y); return { edge, top }; };
  let best = v.t; for (let k = 1; k <= 30; k++) { const t = v.t.clone().add(new THREE.Vector3(0, -k * 0.006, 0).add(d0.clone().setY(0).normalize().multiplyScalar(-k * 0.0))); const r = test(t); if (r.top > 0.93) break; best = t; if (r.edge > 1.0) break; }
  return { p: v.p, t: best, f: v.f }; };   // reveal: high oblique on the carved area
function shapeAxis() {   /* REVIEW-06 #1: PCA of the drawing's cells -> long-axis angle, oriented extents, open (fine-detail) strokes */
  const P0 = heroPts.filter(Boolean); if (P0.length < 3) return null; let mx = 0, mz = 0; for (const [x, z] of P0) { mx += x; mz += z; } mx /= P0.length; mz /= P0.length;
  let sxx = 0, szz = 0, sxz = 0; for (const [x, z] of P0) { sxx += (x - mx) ** 2; szz += (z - mz) ** 2; sxz += (x - mx) * (z - mz); }
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th); let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  for (const [x, z] of P0) { const a = (x - mx) * ux + (z - mz) * uz, b = -(x - mx) * uz + (z - mz) * ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
  const ext = Math.max(a1 - a0, b1 - b0, 1); let open = false, st = [];
  for (const q of heroPts.concat([null])) { if (q) { st.push(q); continue; } if (st.length > 1) { const [f, l] = [st[0], st[st.length - 1]]; if (Math.hypot(f[0] - l[0], f[1] - l[1]) > 0.25 * ext) open = true; } st = []; }
  let corners = 0; st = []; for (const q of heroPts.concat([null])) { if (q) { st.push(q); continue; } for (let i = 4; i < st.length - 4; i++) { const p0 = st[i - 4], p1 = st[i], p2 = st[i + 4]; const ux = p1[0] - p0[0], uy = p1[1] - p0[1], vx = p2[0] - p1[0], vy = p2[1] - p1[1]; const cs = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) + 1e-9); if (cs < 0.35) { corners++; i += 4; } } st = []; }   // sharp corners (star points)
  return { th, ux, uz, mx, mz, a0, a1, b0, b1, thin: (b1 - b0) / Math.max(1, a1 - a0), open, corners }; }
let RVC = null;   /* restView is asked every frame while resting: cache it per drawing / plateau height / viewport */
function restView() {
  const key = heroPts.length + ':' + (simInfo.top || 0).toFixed(2) + ':' + innerWidth + 'x' + innerHeight + ':' + (heroPts.length ? heroPts.find(Boolean) : '');
  if (RVC && RVC.key === key) return { p: RVC.v.p.clone(), t: RVC.v.t.clone(), f: RVC.v.f };
  /* REVIEW-07 #1-#3. Safe area: the top 18 % holds the end-card caption, plus a 6 % margin on every side -> the canyon lives in x [-.88,.88], y [-.88,.52].
     Horizon mode (default): wide lens, flat look (horizon + >=10 % sky behind the caption), the shape sits low in a
     window that ends at y=.30, foreground ledge on. High mode only for very thin glyphs (I, bolt): steeper, no horizon.
     Yaw stays within +-25 deg of the drawn orientation (never lay a glyph on its side). Fit = the newest drawing's cells only. */
  const hb = heroBox(), ax = shapeAxis(); const yaw = Q.has('pyaw') ? Math.max(-25, Math.min(25, P('pyaw'))) : 10;
  const g = P('ppad') || 10, HC = []; for (const q of heroPts) if (q) for (const [dx, dz] of [[g, 0], [-g, 0], [0, g], [0, -g]]) HC.push([(q[0] + dx) / N - .5, (q[1] + dz) / N - .5]);
  let box = hb; if (ax && HC.length) { let cx = 0, cz = 0; for (const c of HC) { cx += c[0]; cz += c[1]; } box = Object.assign({}, hb, { C: HC, c: [cx / HC.length, cz / HC.length] }); }
  const wf = vv => { if (!heroPts.some(Boolean)) return vv.wfrac; FITCAM.fov = vv.f; FITCAM.aspect = innerWidth / Math.max(1, innerHeight); FITCAM.updateProjectionMatrix(); FITCAM.position.copy(vv.p); FITCAM.lookAt(vv.t); FITCAM.updateMatrixWorld();
    const y = (simInfo.top || 20) * VSC; let l = 9, r = -9; for (const q of heroPts) if (q) { const x = new THREE.Vector3(q[0] / N - .5, y, q[1] / N - .5).project(FITCAM).x; l = Math.min(l, x); r = Math.max(r, x); } return (r - l) / 2 + 0.03; };
  const HFOV = P('hfov') || 60, HLP = P('hlp') || 23, HT = Q.has('htop') ? P('htop') : 0.30;
  const horizon = () => { const v = fit3(box, HLP + 12, yaw, HFOV, { l: -0.88, r: 0.88, b: -0.88, t: HT }, HLP); v.mode = 'horizon'; return v; };
  const high = (pp) => { const v = fit3(box, pp, yaw, 50, { l: -0.88, r: 0.88, b: -0.88, t: 0.52 }, pp - 2); v.mode = 'high'; return v; };
  const mid = () => { const v = fit3(box, (P('mlp') || 28) + 14, yaw, P('mfov') || 70, { l: -0.88, r: 0.88, b: -0.88, t: Q.has('mtop') ? P('mtop') : 0.30 }, P('mlp') || 28); v.mode = 'mid'; return v; };   // open glyphs (A, S, moon): steeper, the horizon still in the top band
  const thinG = ax && ax.thin < (P('thinH') || 0.38), openG = ax && ax.open && ax.thin < (P('openT') || 0.9);
  const spiky = ax && ax.corners >= (P('cornT') || 4); const pm = Q.get('pmode') || (thinG ? 'high' : (openG || spiky) ? 'mid' : 'horizon');   // many sharp points (star): a steeper look keeps the points apart
  let v = pm === 'high' ? high(P('ppitch') || (ax && ax.thin < 0.15 ? 62 : 56)) : pm === 'mid' ? mid() : horizon(); v.wfrac = wf(v);
  if (v.mode === 'mid' && v.wfrac < 0.45 && !Q.has('pmode')) { const h1 = horizon(); h1.wfrac = wf(h1); if (h1.wfrac > v.wfrac) v = h1; }   // a tall open glyph (S) gains width from the flatter view and keeps the horizon
  if (v.mode !== 'high' && v.wfrac < 0.45) { const h2 = high(56); h2.wfrac = wf(h2); if (h2.wfrac > v.wfrac + 0.02) v = h2; }
  window.__pcard = { mode: v.mode, yaw, wfrac: +v.wfrac.toFixed(3), thin: ax && +ax.thin.toFixed(2), open: ax && ax.open, corners: ax && ax.corners, n: heroPts.length,
    safe: (() => { FITCAM.fov = v.f; FITCAM.updateProjectionMatrix(); FITCAM.position.copy(v.p); FITCAM.lookAt(v.t); FITCAM.updateMatrixWorld(); const y = (simInfo.top || 20) * VSC; let l = 9, r = -9, b = 9, t = -9; for (const c of HC) { const p = new THREE.Vector3(c[0], y, c[1]).project(FITCAM); l = Math.min(l, p.x); r = Math.max(r, p.x); b = Math.min(b, p.y); t = Math.max(t, p.y); } return [l, r, b, t].map(x => +x.toFixed(2)); })(),
    hz: (() => { const d = new THREE.Vector3().subVectors(v.t, v.p).normalize(); const lp = Math.asin(-d.y) * 180 / Math.PI; const yh = Math.tan(lp * Math.PI / 180) / Math.tan(v.f / 2 * Math.PI / 180); return +((1 - yh) / 2).toFixed(3); })() };   /* hz = sky fraction of the frame height above the geometric horizon (<=0: none) */
  RVC = { key, v: { p: v.p.clone(), t: v.t.clone(), f: v.f } }; choreo.pmode = v.mode;
  return v; }   // postcard: safe-area fit, horizon kept, glyph upright
window.__rested = () => !!choreo.rested;
const drawView = () => frameView(0, P('dcz') || 0.16, 0.76, 0.76, P('dpitch') || 74, 0.84);   // drawing pose: >=70 deg down, so what you draw on screen is what lands on the ground   // drawing pose: steep enough that what you draw on screen lands undistorted
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
  for (const k in GR) post.material.uniforms[k].value = GR[k]; choreo.exk = (choreo.exk ?? 1) + ((choreo.rested ? 0.88 : (choreo.mode === 'reveal' || choreo.mode === 'toReveal') ? 1.12 : 1) - (choreo.exk ?? 1)) * 0.03; post.material.uniforms.ex.value = GR.ex * choreo.exk; { const U = post.material.uniforms, tw = Q.has('nocs') ? 0 : choreo.rested ? 0.9 : choreo.mode === 'rim' || choreo.mode === 'toRim' ? 0.6 : (choreo.mode === 'reveal' || choreo.mode === 'toReveal') ? 0.25 : -0.6; U.warm.value += (tw - U.warm.value) * Math.min(1, dt * 1.5);   /* colour script */
    const tl = (choreo.rested && choreo.pmode !== 'high' && !Q.has('noledge')) ? 1 : 0; U.ledge.value += (tl - U.ledge.value) * Math.min(1, dt * 1.2); }   /* the postcard is mostly sunlit plain + sky: a touch darker so the walls carry the value range */
  if (yrs) { const show = (running || simInfo.done) && simInfo.steps > 0 && !['draw', 'toDraw', 'first'].includes(choreo.mode);
    yrs.style.opacity = show ? (simInfo.done ? 0.55 : 0.9) : 0; if (show) { const y = simInfo.steps * 30000; yrs.innerHTML = y >= 1e6 ? (y / 1e6).toFixed(1) + '<small>million years</small>' : Math.max(10, Math.round(y / 1e4) * 10) + '<small>thousand years</small>'; }}
  { const ti = document.getElementById('title'), ca = document.getElementById('card'), resting = choreo.rested && choreo.mode === 'reveal' && simInfo.done;
    if (ti) ti.style.opacity = (choreo.mode === 'first' && !SHOT && !Q.has('notitle')) ? 1 : 0;
    if (ca) { if (resting && !ca.dataset.on) { ca.dataset.on = 1; const my = simInfo.steps * 0.03; document.getElementById('cardA').textContent = 'your line, ' + (my >= 1 ? my.toFixed(1) + ' million' : Math.round(my * 1000) + ' thousand') + ' years later'; } if (!resting) delete ca.dataset.on; ca.style.opacity = resting && !Q.has('notitle') ? 1 : 0; if (yrs && resting) yrs.style.opacity = 0; } }
  if (running) choreo.ran = true;
  if ((running || (choreo.ran && simInfo.done)) && (choreo.mode === 'draw' || choreo.mode === 'toDraw') && !drawingNow()) { choreo.ran = false; goTo('toReveal'); }   /* also catches a run that finished while we were still in the draw pose (REVIEW-04: stuck in draw after a 2-stroke second carve) */   // carving starts: rise to the reveal pose
  const T = { toDraw: [0.45, drawView, 'draw'], toReveal: [1.6, revView, 'reveal'], toRim: [4.5, rimView, 'rim'], toRest: [3.2, restView, 'reveal'] }[choreo.mode];
  if (T) { choreo.k = Math.min(1, choreo.k + dt / T[0]); setView(choreo.from, T[1](), choreo.k); if (choreo.k >= 1) { choreo.mode = T[2]; if (T[2] === 'draw') onDrawPose(); } }
  if (choreo.mode === 'draw') { const r = drawView(); setView(r, r, 1); }
  if (choreo.mode === 'first') { const r = firstView(); setView(r, r, 1); }
  if (choreo.mode === 'reveal') { const r = choreo.rested ? restView() : revView(); setView(r, r, 1);
    if (simInfo.done && !choreo.rested && scrub.idx < 0) { if (choreo.hold === 0) snd.chord(); choreo.hold += dt; if (choreo.hold > 2.2 && !Q.has('noRest')) { if (Q.has('norim')) { choreo.rested = true; goTo('toRest'); } else goTo('toRim'); choreo.hold = 0; } } }   // hold the finished shape ~2 s, then descend
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
  return { reset() { S.length = 0; idx = -1; }, keep(m) { if (idx >= 0) return; const lastS = S[S.length - 1]; if (!lastS || m.steps - lastS.steps >= 20 || m.done) S.push({ data: m.data.slice(), top: m.top, upl: m.upl, steps: m.steps }); },
    ok() { return S.length > 2 && simInfo.done; },
    by(d) { if (idx < 0) idx = S.length - 1; idx = Math.max(0, Math.min(S.length - 1, idx + d)); const s = S[idx]; const keep = simInfo; onFrame({ data: s.data, top: s.top, upl: s.upl }); simInfo = Object.assign({}, keep, { steps: s.steps, top: s.top }); if (idx === S.length - 1) idx = -1; },
    get n() { return S.length; }, get idx() { return idx; } }; })();
window.__scrub = (d) => { if (d) scrub.by(d); return { n: scrub.n, idx: scrub.idx, steps: simInfo.steps }; };
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
const CFG = {}; for (const k of ['K', 'Ac', 'U', 'ScH', 'ScS', 'H0', 'bg', 'budget', 'seed', 'blur', 'rimSharp', 'bgVar', 'playMs', 'minSize', 'gw', 'sup', 'supR', 'supIn', 'farDry', 'lakes', 'endo', 'edgeUp', 'supOut', 'silt', 'gul', 'gulSp', 'gulD', 'gulR', 'gulW', 'edgeFreeze', 'siltF', 'bench', 'bR1', 'bR2', 'bF1', 'bF2', 'gulL', 'gulThin', 'stretchMax', 'oldLakes']) if (Q.has(k)) CFG[k] = +Q.get(k); if (Q.has('edges')) CFG.edges = Q.get('edges');
worker.postMessage({ type: 'init', N, cfg: CFG, stroke: SHOT ? (Q.get('stroke') || null) : null, t: SHOT ? TSTEPS : 0 });
const hud = document.getElementById('hud');
if (SHOT) {
  worker.onmessage = ({ data: m }) => { onFrame(m); if (m.done || !TSTEPS) { const cm = Q.get('cam') || (TSTEPS > 0 ? 'reveal' : 'low'); { if (cm === 'rest') post.material.uniforms.ex.value = GR.ex * 0.88; const r = cm === 'rim' ? rimView() : cm === 'draw' ? drawView() : cm === 'reveal' ? revView() : cm === 'rest' ? restView() : firstView(); setView(r, r, 1); if (cm === 'rest') { post.material.uniforms.warm.value = Q.has('nocs') ? 0 : 0.9; post.material.uniforms.ledge.value = (choreo.pmode !== 'high' && !Q.has('noledge')) ? 1 : 0; } } render(); window.__ready = true; } };
} else {
  let curCont = false, setCont = false, lastUp = 0, drawing = false, last = null, idle = performance.now(), drew = false, down = false, ptr = null, strokePts = [], setPts = [], grace = 0, lastSet = [];
  drawingNow = () => drawing || grace > 0;
  window.__strokeCells = () => lastSet.filter(Boolean); const DBG = window.__dbg = []; const dlog = o => { if (DBG.length < 200) DBG.push(Object.assign({ t: Math.round(performance.now()), m: choreo.mode, b: simInfo.budget, st: simInfo.steps }, o)); };
  const toCell = e => { m2.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(m2, camera); const p = new THREE.Vector3();
    plane.constant = -(simInfo.top || 20) * VSC; if (!ray.ray.intersectPlane(plane, p)) return null; const cx = (p.x + .5) * N, cy = (p.z + .5) * N;
    return (cx < 0.04 * N || cx > 0.96 * N || cy < 0.09 * N || cy > 0.97 * N) ? null : [cx, cy]; };   /* REVIEW-05 #4: off the plateau the pen lifts (clipped), so no trench along the edge */
  const graceMs = () => (P('grace') || 2500) + 5 * Math.min(1500, gov.slow || 0);   /* wall-clock grace, stretched when frames are slow (a slow GPU delays the next pointerdown by several frames) */
  const contNow = () => grace > 0 || setPts.length > 0 || (simInfo.budget > 0 && !simInfo.done);   // this stroke continues the current drawing (grace window or carve still running)
  const startDraw = e => { const cont = contNow(); curCont = cont; choreo.rested = false; choreo.ran = false; choreo.hold = 0; drawing = true; drew = false; last = toCell(e); strokePts = last ? [last] : []; idle = Infinity; if (grace) { clearTimeout(grace); grace = 0; }
    dlog({ e: 'begin', cont, c: last && last.map(Math.round) }); worker.postMessage({ type: 'begin', cont }); snd.rain(true); scrub.reset(); };
  onDrawPose = () => { if (choreo.pending && down && ptr) startDraw(ptr); choreo.pending = false; };
  const commit = () => { grace = 0; if (!setPts.length) return; lastSet = setPts; dlog({ e: 'release', cont: setCont, n: setPts.length }); worker.postMessage({ type: 'release', pts: setPts, cont: setCont }); setPts = []; setCont = false; };   // multi-stroke: the run starts 1.2 s after the LAST stroke
  addEventListener('pointerdown', e => { if (e.button > 0) return; down = true; choreo.ran = false; ptr = e; snd.start(); if (grace) { clearTimeout(grace); grace = 0; }
    if (choreo.mode === 'draw') { startDraw(e); return; }
    if (contNow() || choreo.mode === 'toReveal') { choreo.mode = 'draw'; const r = drawView(); setView(r, r, 1); camera.updateMatrixWorld(); startDraw(e); return; }   /* REVIEW-05 #2: a stroke that continues the drawing starts at once (no glide that swallows it) */
    if (choreo.mode !== 'toDraw') goTo('toDraw'); choreo.pending = true; });   // never swallow the click: glide to the drawing pose (0.45 s), then the stroke starts under the pointer
  addEventListener('pointermove', e => { ptr = e; if (choreo.mode === 'first') goTo('toDraw');   // hover glides the camera into the drawing pose
    if (!drawing && grace && !down && performance.now() - lastUp < 6000) { clearTimeout(grace); grace = setTimeout(commit, graceMs()); }   // hovering toward the next stroke keeps the grace window open (max ~6 s)
    if (!drawing) return; const c = toCell(e); if (!c && strokePts.length && strokePts[strokePts.length - 1]) strokePts.push(null); if (c && last) { worker.postMessage({ type: 'seg', pts: [last, c], cont: curCont }); strokePts.push(c); drew = true; snd.speed(Math.hypot(c[0] - last[0], c[1] - last[1]));
      if (!curCont) { focus.sx += c[0] / N - .5; focus.sz += c[1] / N - .5; focus.n++; focus.x = focus.sx / focus.n; focus.z = focus.sz / focus.n; bboxAdd(c[0] / N - .5, c[1] / N - .5); } } last = c; });
  const up = () => { down = false; snd.rain(false); if (!drawing) return; drawing = false; idle = Infinity;
    if (!drew && last) { const dot = []; for (const r of [3.2, 1.6]) for (let k = 0; k <= 12; k++) { const a = k / 12 * 2 * Math.PI; dot.push([last[0] + r * Math.cos(a), last[1] + r * Math.sin(a)]); }   // a tap = a dot (a sinkhole/spring), e.g. smiley eyes
      worker.postMessage({ type: 'seg', pts: dot, cont: curCont }); strokePts = dot; bboxAdd(last[0] / N - .5, last[1] / N - .5); drew = true; }
    if (drew) { if (!setPts.length) setCont = curCont; setPts.push(...strokePts, null); lastUp = performance.now(); grace = setTimeout(commit, graceMs()); } drew = false; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up); addEventListener('blur', () => { if (down || drawing) up(); });
  addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') { worker.postMessage({ type: 'init', N, cfg: Object.assign({}, CFG, { seed: 1 + Math.floor(Math.random() * 1000) }) }); goTo('toDraw'); focus.sx = focus.sz = focus.n = 0; focus.x = 0; focus.z = 0.02; bbox.x0 = bbox.z0 = 1; bbox.x1 = bbox.z1 = -1; scrub.reset(); }   // R = new plateau
    if (e.key === ' ') { e.preventDefault(); if (!e.repeat) worker.postMessage({ type: 'fast', on: true }); }   // hold space: deep time races
    if (e.key === 'm' || e.key === 'M') snd.mute(); });
  addEventListener('keyup', e => { if (e.key === ' ') worker.postMessage({ type: 'fast', on: false }); });
  addEventListener('wheel', e => { if (scrub.ok()) { e.preventDefault(); scrub.by(e.deltaY > 0 ? -1 : 1); } }, { passive: false });   // wheel: scrub deep time (down = back toward the stroke)
  setInterval(() => snd.rumble(simInfo.budget > 0 && !simInfo.done, simInfo.steps / Math.max(1, simInfo.steps + simInfo.budget)), 200);
  window.__audio = () => snd.state();
  worker.onmessage = ({ data: m }) => { if (m.type === 'stroke') { if (m.first || m.fresh) heroPts = []; heroPts.push(...(m.cells || []), null); dlog({ e: 'stroke', bb: m.b.map(Math.round), first: m.first, fresh: m.fresh }); lastSet = m.cells || lastSet; if (m.first || m.fresh) { bbox.x0 = bbox.z0 = 1; bbox.x1 = bbox.z1 = -1; } bboxAdd(m.b[0] / N - .5, m.b[2] / N - .5); bboxAdd(m.b[1] / N - .5, m.b[3] / N - .5); return; } if (m.steps > 0 || m.done) scrub.keep(m); if (m.steps > 0) choreo.ran = true; onFrame(m); };   /* a run that starts AND finishes between two slow frames must still hand over to the reveal */   // camera choreography (reveal -> rim) is driven from tick()
  // adaptive quality governor: measures frame time (EMA) and steps a ladder of render scale, shader detail and mesh LOD.
  // ?q=0..4 pins a level (0 = best); default is auto, starting at level 1.
  const LADDER = [{ s: 1.0, d: 2, mesh: 1100 }, { s: 0.85, d: 2, mesh: 1100 }, { s: 0.72, d: 1, mesh: 700 }, { s: 0.6, d: 1, mesh: 700 }, { s: 0.5, d: 0, mesh: 400 }];
  const QPIN = Q.has('q') ? Math.max(0, Math.min(4, Math.round(+Q.get('q')))) : -1;
  const gov = { lvl: QPIN >= 0 ? QPIN : 1, ema: 16, t: performance.now(), hold: 0, worst: 0, log: [] };
  window.__applyLevel = applyLevel; applyLevel(gov.lvl);
  function governor() { const now = performance.now(), d = now - gov.t; gov.t = now; if (document.hidden) return; gov.worst = Math.max(gov.worst, d);
    gov.ema += (Math.min(d, 150) - gov.ema) * 0.08; gov.slow = (gov.slow || 16) + (Math.min(d, 3000) - (gov.slow || 16)) * 0.25; if (QPIN >= 0 || ++gov.hold < 20) return;
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
