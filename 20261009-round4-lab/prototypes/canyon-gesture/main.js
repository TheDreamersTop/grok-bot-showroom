// Deep Time — look-dev spike A2: "canyon postcard". Stream-power landscape evolution, horizon framing, golden hour.
import * as THREE from 'three';
import { createSPL, seedPlateau, gesture, childPath, childPath2 } from './spl.js';
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
const sim = createSPL(N, { K: P('k') || 0.004, U: P('u') || 0.1, Ac: P('ac') || 60, Sc: P('sc') || 2.2, dt: P('dt') || 2 });
const tdata = new Float32Array(N * N * 4); const dtex = new THREE.DataTexture(tdata, N, N, THREE.RGBAFormat, THREE.FloatType); dtex.minFilter = dtex.magFilter = THREE.NearestFilter;
const T0 = { texture: dtex };
function upload() { for (let i = 0; i < N * N; i++) { tdata[i * 4] = sim.h[i]; tdata[i * 4 + 2] = sim.A[i]; tdata[i * 4 + 3] = sim.h0[i]; } dtex.needsUpdate = true; }
const SH = new THREE.WebGLRenderTarget(N, N, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const simScene = new THREE.Scene(); const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); simScene.add(quad);
const VS = `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const HTOP = P('htop') || 46, LAYER = P('layer') || 4.6;
const SHARED = `
precision highp float;
uniform float N; uniform float seed;
#define HTOP ${HTOP.toFixed(2)}
#define LAYER ${LAYER.toFixed(2)}
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i+seed),hash(i+vec2(1,0)+seed),f.x),mix(hash(i+vec2(0,1)+seed),hash(i+vec2(1,1)+seed),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*vnoise(p); p=p*2.03+17.1; a*=.5; } return s; }
// geologic column: layer k is hard (cliff former) or soft (slope former)
float hardOf(float k){ float h=hash(vec2(k,7.13)); return h<.45 ? 2.8 : 0.45; }
float dipZ(vec2 uv){ return (uv.x-.5)*2.0 + (uv.y-.5)*1.5; }            // very gentle structural dip
// stair-step profile: hard layers form vertical cliffs, soft layers form talus slopes below them
float terrace(float h, vec2 uv){ float z=h+dipZ(uv); float k=floor(z/LAYER); float f=fract(z/LAYER);
  float hd = hardOf(k);
  float g = hd>1. ? smoothstep(0.58,0.97,f)*0.90 + f*0.10 : pow(f,1.6);
  return (k+g)*LAYER - dipZ(uv); }
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
const SUN = new THREE.Vector3(P('sx') || 0.6, P('sy') || 0.20, P('sz') || 0.75).normalize();
const VSC = (P('vx') || 1.25) / 256;    // cells -> world height (vertical exaggeration)
const shMat = pass(`uniform sampler2D T; uniform vec3 sun; uniform float vsc;
float Ht(vec2 uv){ return terrace(texture(T,uv).x, uv); }
void main(){ float h=Ht(vUv)*vsc; vec2 d=normalize(sun.xz); float sl=sun.y/length(sun.xz); float res=1., tt=1.5/N;
  for(int i=0;i<80;i++){ vec2 p=vUv+d*tt; if(p.x<0.||p.y<0.||p.x>1.||p.y>1.) break; float hh=Ht(p)*vsc; float ray=h+sl*tt;
    res=min(res, 18.*(ray-hh)/max(tt,1e-3)/ (1.+tt*30.)); tt += max(1.0/N, tt*0.05); if(res<-.2) break; }
  o=vec4(clamp(res,0.,1.)); }`, { T: { value: null }, sun: { value: new THREE.Vector3(SUN.x, SUN.y, SUN.z) }, vsc: { value: VSC } });

// ---------------------------------------------------------------- render
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(P('fov') || 38, innerWidth / innerHeight, 0.01, 20);
const cam = { x: P('cx') || 0.22, y: P('cy') || 0.36, z: P('cz') || 0.47, tx: P('tx') || -0.10, ty: P('ty') || 0.11, tz: P('tz') || -0.30 };
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
vec3 skyCol(vec3 rd){ float y=rd.y; float sd=max(dot(rd,sun),0.);
  vec3 hor = mix(vec3(.58,.62,.78), vec3(1.10,.62,.32), pow(sd,3.));
  vec3 c = mix(hor, vec3(.16,.30,.62), smoothstep(-.01,.22,y));
  c += vec3(1.,.55,.25)*pow(sd,12.)*0.8 + vec3(1.,.8,.55)*pow(sd,400.)*8.;
  return c; }
vec3 haze(vec3 col, vec3 rd, float dist, float wy){ float sd=max(dot(rd,sun),0.);
  vec3 hc = mix(vec3(.34,.40,.66), vec3(1.0,.62,.36), pow(sd,4.))*0.70;
  float f = 1.-exp(-dist*dist*0.22) ; f = clamp(f + 0.25*exp(-max(wy,0.)*28.)*smoothstep(0.,1.,dist), 0., 1.);  // canyon floor haze
  return mix(col, hc, f*0.92); }
vec3 strataCol(float z){ float k=floor(z/LAYER); float h=hash(vec2(k,3.7)); float hd=hardOf(k);
  vec3 c;
  if (hd>1.) c = mix(vec3(.80,.58,.40), vec3(.78,.32,.16), step(.4,h));        // cream Coconino / red Redwall-like cliffs
  else c = mix(vec3(.70,.28,.14), vec3(.56,.30,.32), h);                       // red-brown / mauve slope formers
  float fine=fract(z/(LAYER*0.17)); c *= 0.80+0.20*smoothstep(0.,.25,fine); c *= 0.85+0.3*hash(vec2(k,11.));
  return c; }
`;
const terrainMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3,
  uniforms: { T: { value: null }, SHT: { value: SH.texture }, N: { value: N }, seed: { value: +(Q.get('seed') || 3) }, sun: { value: SUN }, vsc: { value: VSC } },
  vertexShader: SHARED + `uniform sampler2D T; uniform float vsc; out vec2 vUv; out vec3 vW;
    vec4 TB(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p); vec2 q=(i+.5)/N; float e=1./N;
      return mix(mix(texture(T,q),texture(T,q+vec2(e,0)),f.x), mix(texture(T,q+vec2(0,e)),texture(T,q+vec2(e,e)),f.x), f.y); }
    float HB(vec2 uv){ vec2 p=uv*N-.5; vec2 i=floor(p), f=fract(p);
  vec4 wx = vec4(pow(1.-f.x,3.), 3.*f.x*f.x*f.x-6.*f.x*f.x+4., -3.*f.x*f.x*f.x+3.*f.x*f.x+3.*f.x+1., f.x*f.x*f.x)/6.;
  vec4 wy = vec4(pow(1.-f.y,3.), 3.*f.y*f.y*f.y-6.*f.y*f.y+4., -3.*f.y*f.y*f.y+3.*f.y*f.y+3.*f.y+1., f.y*f.y*f.y)/6.;
  float s=0.; for(int j=0;j<4;j++){ float r=0.; for(int k=0;k<4;k++){ r += wx[k]*texture(T,(i+vec2(float(k)-1.,float(j)-1.)+.5)/N).x; } s += wy[j]*r; } return s; }
void main(){ vUv=uv; vec2 u=vec2(uv.x, 1.-uv.y); vUv=u; float h=terrace(HB(u),u); vec3 p=vec3(u.x-.5, h*vsc, u.y-.5); vW=p;
      gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  fragmentShader: RCOMMON + `in vec2 vUv; in vec3 vW; out vec4 o;
  void main(){ float e=0.6/N; float hl=Ht(vUv-vec2(e,0.)), hr=Ht(vUv+vec2(e,0.)), hd=Ht(vUv-vec2(0.,e)), hu=Ht(vUv+vec2(0.,e));
    vec3 n=normalize(vec3((hl-hr)*vsc, 2.*e, (hd-hu)*vsc));
    vec4 t=TB(vUv); float h=Ht(vUv); float z=h+dipZ(vUv);
    float fl = fbm(vec2((vUv.x+vUv.y)*900., z*0.4)) - .5; n = normalize(n + vec3(fl, 0., -fl)*0.6*(1.-n.y));
    float flat_ = smoothstep(.80,.95,n.y);
    vec3 rock = strataCol(z);
    vec3 top = mix(vec3(.66,.46,.30), vec3(.46,.38,.26), smoothstep(.4,.7,fbm(vUv*60.)));           // sandy benches, sparse juniper
    top *= 0.88+0.24*fbm(vUv*90.);
    float trees = smoothstep(.66,.74,fbm(vUv*420.+3.))*flat_*smoothstep(HTOP*0.6,HTOP*0.8,h);
    vec3 alb = mix(rock, top, flat_*0.85); alb = mix(alb, vec3(.16,.17,.10), trees*0.55);
    alb *= 0.9 + 0.2*fbm(vec2(vUv.x*400., z*3.));                                                  // vertical streaks / desert varnish
    alb *= 0.55;
    float sh = texture(SHT, vUv).x;
    float dif = clamp(dot(n,sun),0.,1.)*sh;
    float skyl = clamp(.5+.5*n.y,0.,1.);
    float bounce = clamp(dot(n, normalize(vec3(-sun.x,0.,-sun.z))),0.,1.);
    float depth = clamp((HTOP - h)/HTOP, 0., 1.);
    vec3 lin = dif*vec3(2.8,1.75,0.95)*2.4 + skyl*vec3(.26,.36,.62)*0.55*(1.-0.5*depth) + bounce*vec3(.62,.30,.14)*(0.35+0.9*depth) + vec3(.30,.13,.06)*depth*0.5;
    vec3 col = alb*lin;
    // river: water where drainage area is large, reflecting the sky
    float A=t.z; float riv = smoothstep(9.5, 11.0, log2(1.+A)) * smoothstep(.9,.97,n.y+0.1) * smoothstep(HTOP-4., HTOP-12., h);
    vec3 V=normalize(cameraPosition-vW); vec3 rd=-V;
    if (riv>0.) { vec3 R=reflect(rd, vec3(0.,1.,0.)); float fr=0.04+0.96*pow(1.-max(V.y,0.),5.);
      vec3 w = mix(vec3(.10,.22,.20)*0.6, skyCol(R)*0.9, fr) * mix(0.55,1.,sh);
      col = mix(col, w, riv); }
    float dist=length(vW-cameraPosition);
    col = haze(col, rd, dist, vW.y);
    o=vec4(col,1.); }` });
const terrain = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, (P('mesh') || 1100) - 1, (P('mesh') || 1100) - 1), terrainMat);
scene.add(terrain);
// sky + far distance: distant mesa silhouettes in layers of haze
const skyMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, depthWrite: false, depthTest: false,
  uniforms: { sun: { value: SUN }, ipm: { value: new THREE.Matrix4() }, cpos: { value: camera.position }, N: { value: N }, seed: { value: 3 }, T: { value: null }, SHT: { value: null }, vsc: { value: VSC } },
  vertexShader: `out vec2 vP; void main(){ vP=position.xy; gl_Position=vec4(position.xy,0.9999,1.); }`,
  fragmentShader: RCOMMON + `uniform mat4 ipm; uniform vec3 cpos; in vec2 vP; out vec4 o;
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
          c = mix(m*0.7, mix(vec3(.40,.44,.64), vec3(1.0,.62,.36), pow(max(dot(rd,sun),0.),4.))*0.72, 0.35 + fl*0.2); }
      }
      if (rd.y < 0.) { float hp = HTOP*0.92*vsc; float tt = (cpos.y-hp)/max(-rd.y,1e-4); vec3 wp = cpos+rd*tt;
        vec3 g = vec3(.62,.50,.36)*0.55*(0.85+0.3*fbm(wp.xz*30.))*(vec3(2.6,1.75,1.05)*2.0*sun.y*1.4 + vec3(.18,.24,.37));
        float cd = abs(fbm(wp.xz*3.5+7.)-.5); float cn = 1.-smoothstep(0.012, 0.05, cd);          // distant canyon network
        float rim = smoothstep(0.05,0.03,cd)*(1.-cn);
        g = mix(g, vec3(.34,.20,.24)*0.6, cn*0.6) + rim*vec3(.5,.25,.12)*0.25;
        g = haze(g, rd, tt*0.8, 1.); c = g; }
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
      c *= 1.-0.30*dot(p,p)*1.6; c += (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
      o=vec4(c,1.); }` }));
const postScene = new THREE.Scene(); postScene.add(post);
function render() {
  shMat.uniforms.T.value = T0.texture; run(shMat, SH);
  terrainMat.uniforms.T.value = T0.texture;
  camera.updateMatrixWorld(); skyMat.uniforms.ipm.value.copy(camera.projectionMatrixInverse).premultiply(camera.matrixWorld);
  renderer.setRenderTarget(rtMain); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, simCam);
}
// ---------------------------------------------------------------- interaction: hold = rain where you point
const ray = new THREE.Raycaster(), m2 = new THREE.Vector2(); let down = false;
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -5 * VSC);

addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); rtMain.setSize(innerWidth, innerHeight); post.material.uniforms.res.value.set(innerWidth, innerHeight); });

seedPlateau(sim, +(Q.get('seed') || 3));
const tm = { steps: 0, ms: 0 };
function runSteps(n) { const t0 = performance.now(); for (let k = 0; k < n; k++) sim.step(); tm.steps += n; tm.ms += performance.now() - t0; }
if (!Q.has('nog')) gesture(sim, Q.get('path') === '2' ? childPath2(N) : childPath(N), +(Q.get('gd') || 1.5), 2.2, +(Q.get('gr') || 60));
if (SHOT) {
  if (TSTEPS === 0) for (let i = 0; i < N * N; i++) sim.A[i] = sim.rain[i];
  let s = 0; const chunk = () => { const n = Math.min(20, TSTEPS - s); runSteps(n); s += n; if (s < TSTEPS) setTimeout(chunk, 0); else { upload(); render(); window.__ready = true; } }; if (TSTEPS) chunk(); else { upload(); render(); window.__ready = true; }
} else {
  // live: drag draws the groove + rain trail on the plateau; deep time runs while not dragging
  let drawing = false, path = [];
  const toCell = e => { m2.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(m2, camera); const p = new THREE.Vector3();
    return ray.ray.intersectPlane(plane, p) ? [(p.x + .5) * N, (p.z + .5) * N] : null; };
  addEventListener('pointerdown', e => { drawing = true; path = []; const c = toCell(e); if (c) path.push(c); });
  addEventListener('pointermove', e => { if (!drawing) return; const c = toCell(e); if (c) { path.push(c); if (path.length > 1) gesture(sim, path.slice(-2)); } });
  addEventListener('pointerup', () => { drawing = false; });
  const loop = () => { requestAnimationFrame(loop); if (!drawing && tm.steps < (P('max') || 230)) runSteps(+(Q.get('spf') || 2)); upload(); render(); window.__ready = true; }; loop();
}
window.__timing = () => ({ steps: tm.steps, msPerStep: tm.ms / Math.max(1, tm.steps) });
window.__stats = () => { const a = tdata;
  let mx = -1e9, mn = 1e9, amx = 0; for (let i = 0; i < N * N; i++) { mx = Math.max(mx, a[i * 4]); mn = Math.min(mn, a[i * 4]); amx = Math.max(amx, a[i * 4 + 2]); } return { mx, mn, amx }; };
