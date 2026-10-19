'use strict';
// 墨華 Ink Bloom — V1. Vortex-filament ink cascade (Thomson & Newall 1885) with GPU tracers and absorption rendering.
(() => {
const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot');
const cv = document.getElementById('c');
const gl = cv.getContext('webgl2', { antialias: false, preserveDrawingBuffer: SHOT, alpha: false });
if (!gl || !gl.getExtension('EXT_color_buffer_float')) { document.getElementById('nogl').style.display = 'flex'; return; }
gl.getExtension('EXT_float_blend');
const DPR = Math.min(window.devicePixelRatio || 1, SHOT ? 1 : 1.5);
let W = 0, H = 0;

// ---------------- helpers
let seed = +(Q.get('seed') || 11);
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2831853 * rnd());
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]), nrm = a => mul(a, 1 / len(a));
const frameOf = n => { const t = Math.abs(n[1]) < .9 ? [0, 1, 0] : [1, 0, 0]; const u = nrm(cross(t, n)); return [u, cross(n, u)]; };
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function prog(vs, fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); p.u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); p.u[a.name.replace('[0]', '')] = gl.getUniformLocation(p, a.name); } return p; }
function tex(w, h, ifmt, fmt, type, data, filter) { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, data || null); const f = filter || gl.NEAREST; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
function fbo(t) { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; }
const QVS = `#version 300 es
in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0,1);}`;
const quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
const emptyVao = gl.createVertexArray();
function drawQuad(p) { gl.useProgram(p); gl.bindVertexArray(quadVao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
function bindTex(p, name, unit, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(p.u[name], unit); }

// ---------------- world constants
const SURF = 2.2;                 // water surface height
const ZF = .5, ZB = -.32;        // front glass / back of tank (surface band)
const FOV = .52, CAMD = 3.9, CAMY = 1.42;
const MAXR = 192, SEGS = 24, SLOTS = 4, MAXSTIR = 6;
const INKS = [
  { id: 'indigo', zh: '藍', en: 'indigo', ab: [1.55, 1.02, .32], ui: '#23356e' },
  { id: 'sumi', zh: '墨', en: 'sumi', ab: [1.05, 1.0, .9], ui: '#24242a' },
  { id: 'cinnabar', zh: '朱', en: 'cinnabar', ab: [.16, 1.22, 1.36], ui: '#b8322a' },
  { id: 'gamboge', zh: '藤黃', en: 'gamboge', ab: [.05, .38, 1.45], ui: '#d9a21b' },
  { id: 'viridian', zh: '青', en: 'viridian', ab: [1.35, .3, .62], ui: '#1d6e63' },
];

const KS = [0, 4, 3, 3];
const PR = { grow: +(Q.get('grow') || .07), gd0: +(Q.get('gd0') || .02), gd1: +(Q.get('gd1') || .03), gch: +(Q.get('gch') || .48), tilt: +(Q.get('tilt') || .45), roll: +(Q.get('roll') || .9), rollk: +(Q.get('rollk') || 3) };
// ---------------- quality
let TW = +(Q.get('tw') || 0);
const ROWS = () => TW / SLOTS | 0;

// ---------------- programs
const UPD = prog(QVS, `#version 300 es
precision highp float;precision highp sampler2D;in vec2 uv;out vec4 o;
uniform sampler2D pos,rings,segs;uniform int nr;uniform float dt,t;
uniform vec4 stirP[${MAXSTIR}],stirV[${MAXSTIR}];
#define ROLL ${PR.roll.toFixed(3)}
#define ROLLK ${PR.rollk.toFixed(3)}
vec3 hash3(vec3 p){p=fract(p*vec3(.1031,.103,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx)-.5;}
vec3 vel(vec3 p){vec3 v=vec3(0);
 for(int r=0;r<${MAXR};r++){if(r>=nr)break;vec4 A=texelFetch(rings,ivec2(r,0),0);
  float d=length(p-A.xyz); if(d>A.w*2.6+.035)continue;
  vec4 B=texelFetch(rings,ivec2(r,1),0);if(B.x<=0.)continue;
  float G=B.x,a2=B.y*B.y;
  vec4 N4=texelFetch(rings,ivec2(r,2),0),U4=texelFetch(rings,ivec2(r,3),0);
  vec3 dd=p-A.xyz;float ax=dot(dd,N4.xyz);vec3 rad=dd-ax*N4.xyz;float rho=length(rad)+1e-5;vec3 V=cross(N4.xyz,U4.xyz);
  float th=atan(dot(rad,V),dot(rad,U4.xyz));float dc=length(vec2(rho-B.w,ax));float w=exp(-dc*dc/(a2*24.));float s=B.z*B.z;
  vec3 tng=-sin(th)*U4.xyz+cos(th)*V;float ph=N4.w*th+U4.w;
  v+=w*s*(-sin(ph)*tng*B.w*1.6+cos(ph)*N4.xyz*B.w*1.25+(rad/rho)*B.w*.3*s);
  vec4 E=texelFetch(rings,ivec2(r,4),0);
  if(E.y>.5&&E.x<ROLL){vec3 cp=A.xyz+rad/rho*B.w;vec3 dv=cp-p;float dl=length(dv);float k=(1.-E.x/ROLL);
    v+=dv*ROLLK*k*smoothstep(1.9*B.w,.9*B.w,dl)*smoothstep(.15*B.w,.5*B.w,dl);}
  vec3 prev=texelFetch(segs,ivec2(r*${SEGS}+${SEGS - 1},0),0).xyz;
  for(int k=0;k<${SEGS};k++){vec3 q=texelFetch(segs,ivec2(r*${SEGS}+k,0),0).xyz;vec3 dl=q-prev;vec3 rr=p-.5*(q+prev);float r2=dot(rr,rr)+a2;v+=G*cross(dl,rr)/(12.566*r2*sqrt(r2));prev=q;}
 }
 for(int i=0;i<${MAXSTIR};i++){vec4 S=stirP[i];if(S.w<=0.)continue;vec3 d=p-S.xyz;v+=stirV[i].xyz*exp(-dot(d,d)/(S.w*S.w));}
 return v;}
void main(){vec4 P=texelFetch(pos,ivec2(gl_FragCoord.xy),0);if(P.y<-50.){o=P;return;}
 vec3 p=P.xyz;vec3 v=vel(p);
 v.y-=.010;
 v+=hash3(p*91.+t)*.010;
 p+=v*dt;
 if(p.y>${SURF - .004}){p.y=${SURF - .004};}
 o=vec4(p,P.w+dt);}`);

const SPL = prog(`#version 300 es
precision highp float;precision highp sampler2D;uniform sampler2D pos,col;uniform mat4 VP;uniform int tw,rows;uniform float ps,focus,amt,fade[${SLOTS}];out vec3 ab;
void main(){ivec2 ij=ivec2(gl_VertexID%tw,gl_VertexID/tw);vec4 P=texelFetch(pos,ij,0);vec4 C=texelFetch(col,ij,0);
 int sl=min(ij.y/rows,${SLOTS - 1});float f=fade[sl];
 if(P.y<-50.||C.a<.01||f<=0.){gl_Position=vec4(2,2,2,1);gl_PointSize=1.;ab=vec3(0);return;}
 vec4 cp=VP*vec4(P.xyz,1.);gl_Position=cp;float coc=abs(cp.w-focus)*1.5;float s=1.+coc*2.5;
 gl_PointSize=ps*s;ab=C.rgb*1.6*C.a*amt*f/(s*s)*min(1.,P.w*5.);}`, `#version 300 es
precision highp float;in vec3 ab;out vec4 o;void main(){vec2 d=gl_PointCoord*2.-1.;float r=dot(d,d);if(r>1.)discard;o=vec4(ab*exp(-r*2.6),1);}`);

const BLUR = prog(QVS, `#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D s;uniform vec2 d;
void main(){float w[5]=float[](.227,.194,.121,.054,.016);vec4 a=texture(s,uv)*w[0];for(int i=1;i<5;i++)a+=(texture(s,uv+d*float(i))+texture(s,uv-d*float(i)))*w[i];o=a;}`);

const COMP = prog(QVS, `#version 300 es
precision highp float;precision highp sampler2D;in vec2 uv;out vec4 o;
uniform sampler2D den,b1,b2;uniform vec2 res;uniform float t,yF,yB;
uniform vec4 bead;      // screen x,y (uv), radius px, alpha
uniform vec3 beadCol;uniform vec4 pip; // pipette tip uv x,y, alpha, width px
uniform vec4 rip[4];    // ripple: uv x, start time, amp, -
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
vec3 backdrop(vec2 q){float asp=res.x/res.y;
 vec3 top=vec3(.975,.958,.925),mid=vec3(.93,.915,.885),bot=vec3(.74,.75,.75);
 vec3 c=mix(bot,mid,smoothstep(-.05,.55,q.y));c=mix(c,top,smoothstep(.5,1.,q.y));
 c*=1.-.30*pow(length((q-vec2(.5,.66))*vec2(asp*.55,1.)),2.4);
 c+=vec3(.035,.03,.01)*smoothstep(.55,0.,length((q-vec2(.47,.8))*vec2(asp,1.)));
 return c;}
vec4 inkD(vec2 q){return texture(den,q)*.42+texture(b1,q)*.36+texture(b2,q)*.22;}
vec3 shade(vec3 bg,vec4 D,float lit){vec3 T=exp(-D.rgb);vec3 sc=vec3(.10,.10,.115)*(.45+.55*lit);return bg*T+(1.-T)*sc;}
void main(){vec2 q=uv;float asp=res.x/res.y;vec2 px=gl_FragCoord.xy;
 float ripple=0.;
 for(int i=0;i<4;i++){vec4 R=rip[i];if(R.z<=0.)continue;float a=t-R.y;if(a<0.||a>3.)continue;float dx=abs(q.x-R.x)*asp;float r=a*.22;
   ripple+=R.z*sin((dx-r)*90.)*exp(-pow((dx-r)*10.,2.))*exp(-a*1.6)*smoothstep(0.,.08,a);}
 vec3 col;
 if(q.y>yF+ripple*.004){ // air above waterline seen through the front glass
   vec3 air=backdrop(q)*1.012;col=air;
 } else {
   vec2 qq=q;
   // underside of the surface: total internal reflection band
   float band=smoothstep(yB-.004,yB+.002,q.y);
   vec3 bg=backdrop(q);
   // caustic light under surface
   float cz=smoothstep(yB-.38,yB,q.y);
   float c=n2(vec2(q.x*asp*13.,q.y*7.-t*.35))*n2(vec2(q.x*asp*8.+t*.27,q.y*12.+t*.1));
   bg+=cz*(1.-band)*vec3(.06,.055,.045)*smoothstep(.18,.62,c);
   vec4 D=inkD(qq);
   col=shade(bg,D,q.y);
   if(band>0.){vec2 mq=vec2(q.x,2.*yB-q.y+ripple*.01);vec4 MD=inkD(mq)*.75;
     vec3 mir=shade(mix(bg,vec3(.96,.955,.94),.5),MD,1.)*(.95+ripple*.05);
     col=mix(col,mir,band*.92);}
   // lip of the meniscus at the far line and the front line
   col=mix(col,vec3(.58,.60,.62),exp(-abs(q.y-yB)*res.y*.8)*.55);
   col=mix(col,vec3(.50,.52,.55),exp(-abs(q.y-yF-ripple*.004)*res.y*.7)*.8);
   col+=vec3(.22)*exp(-abs(q.y-yF+1.8/res.y)*res.y*1.1);
   // motes
   for(int L=0;L<3;L++){float s=float(L);vec2 g=px/(26.+s*22.)+vec2(s*17.3,t*(.02+s*.01));vec2 id=floor(g);vec2 f=fract(g)-.5;
     vec2 off=vec2(h(id),h(id+3.1))-.5;float k=h(id+7.7);if(k>.94){float d=length(f-off*.6);col*=1.-.035*exp(-d*d*(900.-s*250.));}}
 }
 // pipette (glass dropper) and bead
 if(pip.z>0.){vec2 d=(px-pip.xy*res);float w=pip.w;
   if(d.y>-w*.6){float taper=mix(.45,1.,smoothstep(0.,w*7.,d.y));float e=abs(d.x)/(w*taper);float m=smoothstep(1.05,.95,e)*pip.z;
     float fill=smoothstep(w*5.5,w*4.5,d.y); // ink inside the lower tube
     vec3 glass=col*vec3(.90,.91,.92)+vec3(.05)*smoothstep(.3,0.,abs(e-.45));
     vec3 inside=mix(glass,beadCol*1.15+.05,fill*.85*smoothstep(.75,.55,e));
     col=mix(col,inside,m);col=mix(col,vec3(.30,.32,.35),smoothstep(.70,.98,e)*m*.75);
     col+=vec3(.35)*m*exp(-pow((d.x/(w*taper)+.45)*5.,2.))*smoothstep(-w*.4,w*2.,d.y);
     // rubber bulb at top of screen
     float bulb=smoothstep(w*2.2,w*2.,length((px-vec2(pip.x*res.x,res.y-w*1.2))*vec2(1.,.55)));col=mix(col,vec3(.16,.13,.12),bulb*pip.z*.9);}
 }
 if(bead.w>0.){vec2 d=px-bead.xy*res;float r=length(d)/bead.z;if(r<1.){float z=sqrt(1.-r*r);vec3 bc=beadCol*(.3+.7*z);
     bc+=vec3(.9)*pow(max(0.,dot(normalize(vec3(d/bead.z,z)),normalize(vec3(-.4,.5,.8)))),30.);col=mix(col,bc,bead.w*smoothstep(1.,.85,r));}}
 col+=(h(px+fract(t)*91.)-.5)*.014;
 o=vec4(col,1);}`);

// ---------------- resources
let posT, posF, colT, cur = 0, denT, denF, b1T, b1F, b2T, b2F, tmp1T, tmp1F, tmp2T, tmp2F;
const ringT = tex(MAXR, 5, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
const segT = tex(MAXR * SEGS, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
function allocTracers() {
  const NT = TW * TW; const init = new Float32Array(NT * 4).fill(-99);
  posT = [0, 1].map(() => tex(TW, TW, gl.RGBA32F, gl.RGBA, gl.FLOAT, init)); posF = posT.map(fbo);
  colT = tex(TW, TW, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(NT * 4));
}
function allocRT() {
  W = Math.max(2, Math.round(innerWidth * DPR)); H = Math.max(2, Math.round(innerHeight * DPR)); cv.width = W; cv.height = H;
  const hf = (w, h) => tex(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR);
  denT = hf(W, H); denF = fbo(denT);
  const w2 = W >> 1, h2 = H >> 1, w4 = W >> 2, h4 = H >> 2;
  tmp1T = hf(w2, h2); tmp1F = fbo(tmp1T); b1T = hf(w2, h2); b1F = fbo(b1T);
  tmp2T = hf(w4, h4); tmp2F = fbo(tmp2T); b2T = hf(w4, h4); b2F = fbo(b2T);
}

// ---------------- camera
const cam = { px: 0, py: 0, tx: 0, ty: 0 };
function persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]; }
function lookAt(e, c, u) { const z = nrm(sub(e, c)), x = nrm(cross(u, z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]; }
function mm(a, b) { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return r; }
let VP = null, EYE = [0, CAMY, CAMD];
function updCam() { EYE = [cam.px * .22, CAMY + cam.py * .06, CAMD]; VP = mm(persp(FOV, W / H, .1, 30), lookAt(EYE, [cam.px * .05, CAMY, 0], [0, 1, 0])); }
function proj(p) { const v = VP; let x = 0, y = 0, w = 0; for (let k = 0; k < 4; k++) { const c = k < 3 ? p[k] : 1; x += v[k * 4] * c; y += v[k * 4 + 1] * c; w += v[k * 4 + 3] * c; } return [(x / w) * .5 + .5, (y / w) * .5 + .5, w]; }
function unprojX(sx, z) { // screen uv x -> world x on plane z at water mid-height
  const d = EYE[2] - z; return EYE[0] + (sx * 2 - 1) * Math.tan(FOV / 2) * (W / H) * d; }

// ---------------- rings
let rings = [], time = 0;
function newRing(c, n, R, G, gen, k, slot) { const [u, v] = frameOf(n); return { c, n, u, v, R, G, a: R * .22, gen, k, amp: R * .004 * (1 + rnd()), ph: rnd() * 6.283, age: 0, alive: true, sig: .8 + .3 * rnd(), slot }; }
function nodes(r) { const out = []; for (let s = 0; s < SEGS; s++) { const th = s / SEGS * 6.2831853; const w = Math.cos(r.k * th + r.ph); const rad = add(mul(r.u, Math.cos(th)), mul(r.v, Math.sin(th))); const RR = r.R * (1 - .25 * w * r.amp / r.R); out.push(add(add(r.c, mul(rad, RR)), mul(r.n, w * r.amp))); } return out; }
function biot(p, segsArr, G, a) { let v = [0, 0, 0]; let prev = segsArr[segsArr.length - 1]; for (const q of segsArr) { const dl = sub(q, prev), m = mul(add(q, prev), .5), rr = sub(p, m); const r2 = dot(rr, rr) + a * a; v = add(v, mul(cross(dl, rr), G / (12.566 * r2 * Math.sqrt(r2)))); prev = q; } return v; }
const stirs = []; // {p:[x,y,z], v:[..], r, born}
function stirVel(p) { let v = [0, 0, 0]; for (const s of stirs) { const d = sub(p, s.p); v = add(v, mul(s.v, Math.exp(-dot(d, d) / (s.r * s.r)))); } return v; }
function stepRings(dt) {
  const live = rings.filter(r => r.alive); const ns = live.map(nodes);
  for (let i = 0; i < live.length; i++) { const r = live[i];
    const U = r.G / (12.566 * r.R) * (Math.log(8 * r.R / r.a) - .25);
    let v = mul(r.n, U);
    for (let j = 0; j < live.length; j++) { if (i === j) continue; const o = live[j]; if (len(sub(o.c, r.c)) > o.R * 5 + r.R) continue; v = add(v, biot(r.c, ns[j], o.G, o.a * 1.5)); }
    v = add(v, stirVel(r.c)); v[1] -= .01;
    r.c = add(r.c, mul(v, dt));
    r.R += dt * U * PR.grow * r.sig; r.a = Math.min(r.a + dt * .002, r.R * .4);
    r.G *= Math.exp(-dt * (PR.gd0 + PR.gd1 * r.gen));
    r.amp *= Math.exp((1.15 + .3 * r.gen) * dt * r.sig); r.age += dt;
    if (r.gen < 3 && r.amp > r.R * .42) split(r);
    if (r.gen === 3 && r.age > 4) r.G *= Math.exp(-dt * .6);
    if (r.G < .0015 || r.c[1] < -1) r.alive = false;
  }
  if (rings.length > 600) rings = rings.filter(r => r.alive);
}
function split(r) { r.alive = false; const k = r.k;
  for (let j = 0; j < k; j++) { const th = (2 * Math.PI * j - r.ph) / k;
    const rad = add(mul(r.u, Math.cos(th)), mul(r.v, Math.sin(th)));
    const tilt = PR.tilt + .2 * rnd(); const n = nrm(add(mul(r.n, Math.cos(tilt)), mul(rad, Math.sin(tilt))));
    const c = add(add(r.c, mul(rad, r.R * .95)), mul(r.n, r.amp));
    const g = r.gen + 1; const ch = newRing(c, n, r.R * (.31 + .07 * rnd()), r.G * (PR.gch + .06 * rnd()), g, KS[Math.min(3, g + 1)] + (rnd() < .3 ? 1 : 0), r.slot); rings.push(ch); }
}
const ringBuf = new Float32Array(MAXR * 5 * 4), segBuf = new Float32Array(MAXR * SEGS * 4);
function uploadRings() { const live = rings.filter(r => r.alive).slice(-MAXR); ringBuf.fill(0);
  live.forEach((r, i) => { ringBuf.set([r.c[0], r.c[1], r.c[2], r.R + r.amp], i * 4); ringBuf.set([r.G, r.a * .55, Math.min(1, r.amp / (r.R * .42)), r.R], (MAXR + i) * 4); ringBuf.set([r.n[0], r.n[1], r.n[2], r.k], (2 * MAXR + i) * 4); ringBuf.set([r.u[0], r.u[1], r.u[2], r.ph], (3 * MAXR + i) * 4); ringBuf.set([r.age, r.gen, 0, 0], (4 * MAXR + i) * 4); nodes(r).forEach((q, s) => segBuf.set([q[0], q[1], q[2], 0], (i * SEGS + s) * 4)); });
  gl.bindTexture(gl.TEXTURE_2D, ringT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXR, 5, gl.RGBA, gl.FLOAT, ringBuf);
  gl.bindTexture(gl.TEXTURE_2D, segT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXR * SEGS, 1, gl.RGBA, gl.FLOAT, segBuf); return live.length; }

// ---------------- drops
let dropCount = 0; const slotFade = new Float32Array(SLOTS); const slotTarget = new Float32Array(SLOTS);
const ripples = []; // {x, t, a}
function spawn(x, z, inkIdx, size) {
  const slot = dropCount % SLOTS; dropCount++;
  rings.forEach(r => { if (r.slot === slot) r.alive = false; });
  const R0 = .068 * size, G = .046 * size; const c = [x, SURF - .10, z];
  const ink = INKS[inkIdx];
  rings.push(newRing(c, [0, -1, 0], R0, G, 0, size > 1.25 ? 6 : 5, slot));
  const rows = ROWS(), n = rows * TW, P = new Float32Array(n * 4), C = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { let p; const f = rnd();
    if (f < .82) { const th = rnd() * 6.283, cr = Math.abs(gauss()) * R0 * .30, ph = rnd() * 6.283; const rr = R0 + cr * Math.cos(ph); p = [x + rr * Math.cos(th), c[1] + cr * Math.sin(ph), z + rr * Math.sin(th)]; }
    else if (f < .9) { const yy = c[1] + Math.pow(rnd(), 1.5) * (SURF - c[1]); const sp = .0045 * size * (1 + 1.2 * (yy - c[1]) / (SURF - c[1])); p = [x + gauss() * sp, yy, z + gauss() * sp]; }
    else { const r = Math.cbrt(rnd()) * R0 * 1.05, th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1); p = [x + r * Math.sin(ph) * Math.cos(th), c[1] + r * Math.cos(ph) * .6, z + r * Math.sin(ph) * Math.sin(th)]; }
    P[i * 4] = p[0]; P[i * 4 + 1] = p[1]; P[i * 4 + 2] = p[2]; P[i * 4 + 3] = 0;
    const k = .5 + .5 * rnd(); C[i * 4] = ink.ab[0] / 1.6 * 255; C[i * 4 + 1] = ink.ab[1] / 1.6 * 255; C[i * 4 + 2] = ink.ab[2] / 1.6 * 255; C[i * 4 + 3] = k * 255 | 0; }
  for (const t of posT) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, slot * rows, TW, rows, gl.RGBA, gl.FLOAT, P); }
  gl.bindTexture(gl.TEXTURE_2D, colT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, slot * rows, TW, rows, gl.RGBA, gl.UNSIGNED_BYTE, C);
  slotFade[slot] = 1; slotTarget[slot] = 1;
  ripples.push({ x, t: time, a: .8 * size }); if (ripples.length > 4) ripples.shift();
  sfx.drip(size);
}
// a drop in flight from pipette to surface
const falling = []; // {x,z,ink,size,y,v}
const TIPY = SURF + .19;
function release(x, z, ink, size) {
  // if the slot we will reuse still holds ink, fade it first
  const slot = dropCount % SLOTS; slotTarget[slot] = 0;
  falling.push({ x, z, ink, size, y: TIPY, v: 0, slot });
}
function stepFalling(dt) {
  for (const f of falling) { f.v += 3.2 * dt; f.y -= f.v * dt; }
  while (falling.length && falling[0].y <= SURF && slotFade[falling[0].slot] <= .02) { const f = falling.shift(); spawn(f.x, f.z, f.ink, f.size); }
  for (const f of falling) if (f.y < SURF) f.y = SURF;
}

// ---------------- simulation step
function step(dt) {
  stepFalling(dt);
  for (let i = 0; i < SLOTS; i++) { if (slotFade[i] > slotTarget[i]) slotFade[i] = Math.max(slotTarget[i], slotFade[i] - dt * 1.8); }
  for (const s of stirs) { s.v = mul(s.v, Math.exp(-dt * 1.6)); }
  while (stirs.length && len(stirs[0].v) < .002) stirs.shift();
  stepRings(dt); const n = uploadRings();
  gl.viewport(0, 0, TW, TW); gl.disable(gl.BLEND); gl.bindFramebuffer(gl.FRAMEBUFFER, posF[1 - cur]);
  gl.useProgram(UPD); bindTex(UPD, 'pos', 0, posT[cur]); bindTex(UPD, 'rings', 1, ringT); bindTex(UPD, 'segs', 2, segT);
  gl.uniform1i(UPD.u.nr, n); gl.uniform1f(UPD.u.dt, dt); gl.uniform1f(UPD.u.t, time);
  const sp = new Float32Array(MAXSTIR * 4), sv = new Float32Array(MAXSTIR * 4);
  stirs.slice(-MAXSTIR).forEach((s, i) => { sp.set([s.p[0], s.p[1], s.p[2], s.r], i * 4); sv.set([s.v[0], s.v[1], s.v[2], 0], i * 4); });
  gl.uniform4fv(UPD.u.stirP, sp); gl.uniform4fv(UPD.u.stirV, sv);
  drawQuad(UPD); cur = 1 - cur; time += dt;
}

// ---------------- render
let pointer = { x: .5, y: .5, in: false, down: false, hold: 0, ink: 0 };
function render() {
  updCam();
  gl.bindFramebuffer(gl.FRAMEBUFFER, denF); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.useProgram(SPL); gl.bindVertexArray(emptyVao);
  bindTex(SPL, 'pos', 0, posT[cur]); bindTex(SPL, 'col', 1, colT);
  gl.uniformMatrix4fv(SPL.u.VP, false, VP); gl.uniform1i(SPL.u.tw, TW); gl.uniform1i(SPL.u.rows, ROWS());
  gl.uniform1f(SPL.u.ps, Math.max(1.3, 1.9 * H / 1080)); gl.uniform1f(SPL.u.focus, CAMD);
  gl.uniform1f(SPL.u.amt, (65536 / (ROWS() * TW)) * (H / 720) * (H / 720) / Math.pow(Math.max(1.3, 1.9 * H / 1080) / 1.37, 2) * .55);
  gl.uniform1fv(SPL.u.fade, slotFade);
  gl.drawArrays(gl.POINTS, 0, TW * TW); gl.disable(gl.BLEND);
  const blur = (srcT, tmpF, tmpT, dstF, w, h, s) => { gl.viewport(0, 0, w, h); gl.useProgram(BLUR); gl.bindFramebuffer(gl.FRAMEBUFFER, tmpF); bindTex(BLUR, 's', 0, srcT); gl.uniform2f(BLUR.u.d, s / w, 0); drawQuad(BLUR); gl.bindFramebuffer(gl.FRAMEBUFFER, dstF); bindTex(BLUR, 's', 0, tmpT); gl.uniform2f(BLUR.u.d, 0, s / h); drawQuad(BLUR); };
  blur(denT, tmp1F, tmp1T, b1F, W >> 1, H >> 1, 1.0);
  blur(b1T, tmp2F, tmp2T, b2F, W >> 2, H >> 2, 1.6);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(COMP);
  bindTex(COMP, 'den', 0, denT); bindTex(COMP, 'b1', 1, b1T); bindTex(COMP, 'b2', 2, b2T);
  gl.uniform2f(COMP.u.res, W, H); gl.uniform1f(COMP.u.t, time);
  const yF = proj([0, SURF, ZF])[1], yB = proj([0, SURF, ZB])[1];
  gl.uniform1f(COMP.u.yF, yF); gl.uniform1f(COMP.u.yB, yB);
  // pipette + bead
  const ink = INKS[pointer.ink];
  let bead = [0, 0, 0, 0], pip = [0, 0, 0, 0];
  const px = unprojX(pointer.x, 0);
  if (pointer.in && !uiHover) {
    const tip = proj([px, TIPY + .02, 0]); const size = 1 + Math.min(pointer.hold, 1.3) * .55;
    pip = [tip[0], tip[1], 1, 7.5 * H / 1080];
    const bp = proj([px, TIPY - .012 * size, 0]); bead = [bp[0], bp[1], 8.5 * size * H / 1080 * (pointer.down ? 1 : .8), 1];
  }
  if (falling.length) { const f = falling[falling.length - 1]; const bp = proj([f.x, f.y, f.z]); bead = [bp[0], bp[1], 9 * f.size * H / 1080, f.y > SURF ? 1 : 0]; }
  gl.uniform4fv(COMP.u.bead, bead); gl.uniform3fv(COMP.u.beadCol, hex(ink.ui)); gl.uniform4fv(COMP.u.pip, pip);
  const rp = new Float32Array(16); ripples.forEach((r, i) => { const s = proj([r.x, SURF, 0]); rp.set([s[0], r.t, r.a, 0], i * 4); }); gl.uniform4fv(COMP.u.rip, rp);
  drawQuad(COMP);
}
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255 * .7, (n >> 8 & 255) / 255 * .7, (n & 255) / 255 * .7]; }

// ---------------- audio (synthesised, starts on first gesture)
const sfx = (() => { let ac = null, master = null, muted = false, bed = null;
  function init() { if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .7; master.connect(ac.destination);
    // low water bed: filtered noise
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); let b = 0; for (let i = 0; i < len; i++) { b = .985 * b + .015 * (Math.random() * 2 - 1); d[i] = b * 3; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; bed = ac.createGain(); bed.gain.value = 0; src.connect(lp); lp.connect(bed); bed.connect(master); src.start(); bed.gain.linearRampToValueAtTime(.16, ac.currentTime + 3);
  } catch (e) { ac = null; } }
  function drip(size) { if (!ac || muted) return; const t = ac.currentTime; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
    const f0 = 1100 / Math.sqrt(size); o.frequency.setValueAtTime(f0 * .55, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + .06); o.frequency.exponentialRampToValueAtTime(f0 * .9, t + .18);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g); g.connect(master); o.start(t); o.stop(t + .4);
    const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.frequency.value = 92 / size; g2.gain.setValueAtTime(.0, t); g2.gain.linearRampToValueAtTime(.12, t + .05); g2.gain.exponentialRampToValueAtTime(.001, t + 2.5); o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + 2.6); }
  return { init, drip, toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : .7; } };
})();

// ---------------- UI
let uiHover = false;
const inksEl = document.getElementById('inks');
INKS.forEach((k, i) => { const d = document.createElement('div'); d.className = 'ink' + (i === 0 ? ' on' : ''); d.innerHTML = `<i style="background:${k.ui}"></i><b>${k.zh} ${k.en}</b>`;
  d.addEventListener('pointerdown', e => { e.stopPropagation(); setInk(i); }); d.addEventListener('pointerenter', () => uiHover = true); d.addEventListener('pointerleave', () => uiHover = false); inksEl.appendChild(d); });
function setInk(i) { pointer.ink = i; [...inksEl.children].forEach((c, j) => c.classList.toggle('on', j === i)); }
let slow = false, holdStart = 0, downXY = null, stirMode = false, lastMove = null, interacted = false;
cv.addEventListener('pointermove', e => { pointer.x = e.clientX / innerWidth; pointer.y = 1 - e.clientY / innerHeight; pointer.in = true;
  cam.tx = (pointer.x - .5) * 2; cam.ty = (pointer.y - .5) * 2;
  if (pointer.down && downXY) { const dx = e.clientX - downXY[0], dy = e.clientY - downXY[1]; if (!stirMode && Math.hypot(dx, dy) > 14) stirMode = true;
    if (stirMode && lastMove) { const now = performance.now(); const dtm = Math.max(8, now - lastMove.t) / 1000; const wx = unprojX(pointer.x, 0), wy = worldY(pointer.y);
      const v = [(wx - lastMove.wx) / dtm * .35, (wy - lastMove.wy) / dtm * .35, 0]; const vl = len(v); const vv = vl > .6 ? mul(v, .6 / vl) : v;
      stirs.push({ p: [wx, wy, 0], v: vv, r: .14 }); if (stirs.length > MAXSTIR) stirs.shift(); lastMove = { t: now, wx, wy }; } }
});
function worldY(sy) { return CAMY + (sy * 2 - 1) * Math.tan(FOV / 2) * CAMD; }
cv.addEventListener('pointerleave', () => { pointer.in = false; });
cv.addEventListener('pointerdown', e => { sfx.init(); interacted = true; pointer.down = true; holdStart = performance.now(); downXY = [e.clientX, e.clientY]; stirMode = false;
  lastMove = { t: performance.now(), wx: unprojX(e.clientX / innerWidth, 0), wy: worldY(1 - e.clientY / innerHeight) }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointerup', e => { if (!pointer.down) return; pointer.down = false;
  if (!stirMode) { const size = 1 + Math.min(pointer.hold, 1.3) * .55; release(unprojX(pointer.x, 0), (rnd() - .5) * .25, pointer.ink, size); fadeTitle(); }
  pointer.hold = 0; stirMode = false; });
addEventListener('keydown', e => { if (e.code === 'Space') { slow = true; e.preventDefault(); } if (e.key === 'r' || e.key === 'R') resetWater(); if (e.key === 'm' || e.key === 'M') sfx.toggle(); const n = +e.key; if (n >= 1 && n <= INKS.length) setInk(n - 1); });
addEventListener('keyup', e => { if (e.code === 'Space') slow = false; });
addEventListener('resize', () => { allocRT(); });
function resetWater() { for (let i = 0; i < SLOTS; i++) slotTarget[i] = 0; rings.forEach(r => r.alive = false); }
let titleFaded = false; function fadeTitle() { if (titleFaded) return; titleFaded = true; setTimeout(() => { document.querySelector('#title p').style.opacity = 0; }, 2500); }

// ---------------- quality probe (GPU time of tracer update)
function probe() {
  if (TW) return;
  TW = 1024; allocTracers();
  // fake load: 12 rings + tracers everywhere near them
  for (let i = 0; i < 12; i++) rings.push(newRing([(i % 4 - 1.5) * .3, 1.6 - (i >> 2) * .3, 0], [0, -1, 0], .08, .04, 1, 4, 0));
  const NT = TW * TW, P = new Float32Array(NT * 4); for (let i = 0; i < NT; i++) { P[i * 4] = (rnd() - .5) * 1.2; P[i * 4 + 1] = 1 + rnd(); P[i * 4 + 2] = (rnd() - .5) * .3; }
  gl.bindTexture(gl.TEXTURE_2D, posT[0]); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TW, TW, gl.RGBA, gl.FLOAT, P);
  step(1 / 60); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4));
  const t0 = performance.now(); for (let i = 0; i < 3; i++) step(1 / 60); gl.bindFramebuffer(gl.FRAMEBUFFER, posF[cur]); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4));
  const ms = (performance.now() - t0) / 3;
  rings = []; time = 0;
  TW = ms < 7 ? 1024 : ms < 16 ? 768 : 512;
  allocTracers(); window.__probe = { ms, TW };
}

// ---------------- boot
allocRT(); updCam();
if (SHOT) {
  TW = TW || 512; allocTracers();
  const T = +Q.get('shot'); const DT = 1 / 60;
  const script = (Q.get('drops') || '-0.12,0,0,1,0').split(';').map(s => s.split(',').map(Number));
  pointer.x = +(Q.get('px') || .62); pointer.in = Q.get('pip') === '1'; pointer.ink = +(Q.get('ink') || 0);
  let si = 0; const N = Math.round(T / DT);
  (async () => { for (let i = 0; i < N; i++) { while (si < script.length && script[si][4] <= time + 1e-6) { const s = script[si++]; release(s[0], s[1], s[2], s[3]); } step(DT); if (i % 20 === 0) await new Promise(r => setTimeout(r, 0)); }
    render(); gl.finish(); window.__ready = true; })();
} else {
  probe();
  let last = performance.now(), autoT = 0, autoDone = false;
  const loop = now => {
    let d = Math.min(.05, (now - last) / 1000); last = now;
    cam.px += (cam.tx * .5 - cam.px) * Math.min(1, d * 1.5); cam.py += (cam.ty * .5 - cam.py) * Math.min(1, d * 1.5);
    if (pointer.down) pointer.hold = (now - holdStart) / 1000;
    autoT += d; if (!autoDone && autoT > 1.1 && !interacted) { autoDone = true; release(-.08, 0, 0, 1.15); }
    const sd = d * (slow ? .25 : 1); const k = Math.max(1, Math.ceil(sd / (1 / 50)));
    for (let i = 0; i < k; i++) step(sd / k);
    render(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.__ready = true;
}
window.__info = () => ({ bbox: (() => { let a = [9, 9], b = [-9, -9]; rings.filter(r => r.alive).forEach(r => { a = [Math.min(a[0], r.c[0] - r.R), Math.min(a[1], r.c[1])]; b = [Math.max(b[0], r.c[0] + r.R), Math.max(b[1], r.c[1])]; }); return [a, b]; })(), gens: rings.filter(r=>r.alive).map(r=>r.gen).join(''), TW, rings: rings.length, live: rings.filter(r => r.alive).length, time, probe: window.__probe });
})();
