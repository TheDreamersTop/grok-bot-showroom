'use strict';
window.addEventListener('error', () => { window.__ready = true; });
// 墨華 Ink Bloom — V2 engine. Vortex-filament ink cascade + GPU tracers, rendered as a raymarched dye volume in a real tank.
// Switches (for the Phase-B exploration X1/X2/X3 and V2): ?ink=vol|splat  &tank=0|1  &follow=0|1  &salt=<y>
(() => {
const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot');
const OPT = {
  ink: Q.get('ink') || 'vol',            // vol: 3D dye grid raymarch (X1); splat: V1 screen splats (X2-only test)
  tank: Q.get('tank') !== '0',           // raymarched glass tank, floor, TIR surface (X2)
  follow: Q.get('follow') !== '0',       // camera fits the cascade (X2)
  salt: +(Q.get('salt') || 0),           // salt layer height, 0 = none (X3)
  thr: Q.has('thr') ? +Q.get('thr') : .6,             // fine-thread detail layer from tracers (0..1)
};
const cv = document.getElementById('c');
const gl = cv.getContext('webgl2', { antialias: false, preserveDrawingBuffer: SHOT, alpha: false });
if (!gl || !gl.getExtension('EXT_color_buffer_float')) { document.getElementById('nogl').style.display = 'flex'; return; }
const RINFO = gl.getExtension('WEBGL_debug_renderer_info'); const RENDERER = RINFO ? String(gl.getParameter(RINFO.UNMASKED_RENDERER_WEBGL)) : '';
const SOFT = /swiftshader|llvmpipe|software|basic render/i.test(RENDERER); const LOW = Q.has('low') ? Q.get('low') === '1' : (SOFT && !SHOT);
let RS = LOW ? .55 : 1; // render scale, adapted to frame rate in live mode
gl.getExtension('EXT_float_blend'); gl.getExtension('OES_texture_float_linear');
const DBG = Q.has('dbg'); const T0 = performance.now(); const log = m => DBG && console.log('[' + ((performance.now() - T0) / 1000).toFixed(2) + 's] ' + m);
const DPR = Math.min(window.devicePixelRatio || 1, SHOT ? 1 : 1.25);
let W = 0, H = 0;

// ---------------- helpers
let seed = +(Q.get('seed') || 11);
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2831853 * rnd());
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]), nrm = a => mul(a, 1 / len(a));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const frameOf = n => { const t = Math.abs(n[1]) < .9 ? [0, 1, 0] : [1, 0, 0]; const u = nrm(cross(t, n)); return [u, cross(n, u)]; };
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(s); console.warn(src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n')); throw new Error(log); } return s; }
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

// ---------------- world
const SURF = 2.2, Y0 = .32, XH = 1.5, ZH = .55, GT = .028, SLAB = .075, RIM = 2.42;
const FOV = .50;
const MAXR = 192, SEGS = 24, SLOTS = 4, MAXSTIR = 6;
// volume grid (atlas of z-slices)
const GX = LOW ? 256 : 384, GY = LOW ? 176 : 256, GZ = LOW ? 40 : 48, TX = 8, TY = LOW ? 5 : 6, AW = GX * TX, AH = GY * TY;
const LX = 128, LY = 88, LZ = 32, LTX = 8, LTY = 4, LAW = LX * LTX, LAH = LY * LTY;
const VOX = (2 * XH / GX) * ((SURF - Y0) / GY) * (2 * ZH / GZ);
// pigments: absorbance per unit optical depth (R,G,B). Chosen so mixtures keep hue windows.
const INKS = [
  { zh: '藍', en: 'indigo', ab: [1.12, .82, .58], ui: '#34466e' },
  { zh: '臙脂', en: 'carmine', ab: [.14, 1.12, .80], ui: '#b3243a' },
  { zh: '藤黃', en: 'gamboge', ab: [.03, .18, 1.32], ui: '#e2b318' },
  { zh: '墨', en: 'sumi', ab: [1.0, .96, .88], ui: '#2a2a2e' },
  { zh: '青', en: 'viridian', ab: [1.18, .40, .66], ui: '#1f6f66' },
];
let TW = +(Q.get('tw') || 0);
const ROWS = () => TW / SLOTS | 0;

log('start');
// ---------------- tracer update
const UPD = prog(QVS, `#version 300 es
precision highp float;precision highp sampler2D;in vec2 uv;out vec4 o;
uniform sampler2D pos,rings,segs;uniform int nr;uniform float dt,t,salt;
uniform vec4 stirP[${MAXSTIR}],stirV[${MAXSTIR}];
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
  if(E.y>.5&&E.x<.9){vec3 cp=A.xyz+rad/rho*B.w;vec3 dv=cp-p;float dl=length(dv);float k=(1.-E.x/.9);
    v+=dv*3.*k*smoothstep(1.9*B.w,.9*B.w,dl)*smoothstep(.15*B.w,.5*B.w,dl);}
  vec3 prev=texelFetch(segs,ivec2(r*${SEGS}+${SEGS - 1},0),0).xyz;
  for(int k=0;k<${SEGS};k++){vec3 q=texelFetch(segs,ivec2(r*${SEGS}+k,0),0).xyz;vec3 dl=q-prev;vec3 rr=p-.5*(q+prev);float r2=dot(rr,rr)+a2;v+=G*cross(dl,rr)/(12.566*r2*sqrt(r2));prev=q;}
 }
 for(int i=0;i<${MAXSTIR};i++){vec4 S=stirP[i];if(S.w<=0.)continue;vec3 d=p-S.xyz;v+=stirV[i].xyz*exp(-dot(d,d)/(S.w*S.w));}
 return v;}
void main(){vec4 P=texelFetch(pos,ivec2(gl_FragCoord.xy),0);if(P.y<-50.){o=P;return;}
 vec3 p=P.xyz;vec3 v=vel(p);
 float age=P.w;
 v.y-=.010;
 if(salt>0.){float b=smoothstep(salt+.03,salt-.05,p.y);v.y+=b*(.010+.25*(salt-.012-p.y));v.y*=1.-.6*b;v.xz*=1.+.0*b;}
 v+=hash3(p*91.+t)*(.008+.0006*min(age,40.));
 p+=v*dt;
 p.y=clamp(p.y,${(Y0 + .006).toFixed(3)},${(SURF - .004).toFixed(3)});
 p.x=clamp(p.x,${(-XH + .01).toFixed(3)},${(XH - .01).toFixed(3)});p.z=clamp(p.z,${(-ZH + .01).toFixed(3)},${(ZH - .01).toFixed(3)});
 o=vec4(p,P.w+dt);}`);

log('UPD compiled');
// ---------------- volume splat (tracers -> z-slice atlas, two slices with linear weights)
const VSPL = prog(`#version 300 es
precision highp float;precision highp sampler2D;uniform sampler2D pos,col;uniform int tw,rows;uniform float amt,fade[${SLOTS}];out vec3 ab;
void main(){ivec2 ij=ivec2(gl_VertexID%tw,gl_VertexID/tw);vec4 P=texelFetch(pos,ij,0);vec4 C=texelFetch(col,ij,0);
 int sl=min(ij.y/rows,${SLOTS - 1});float f=fade[sl];
 vec3 g=(P.xyz-vec3(${-XH},${Y0},${-ZH}))/vec3(${2 * XH},${(SURF - Y0).toFixed(4)},${2 * ZH})*vec3(${GX},${GY},${GZ});
 float gz=g.z-.5;float iz=floor(gz)+float(gl_InstanceID);float w=gl_InstanceID==0?1.-fract(gz):fract(gz);
 if(P.y<-50.||C.a<.01||f<=0.||iz<0.||iz>${GZ - 1}.){gl_Position=vec4(2,2,2,1);gl_PointSize=1.;ab=vec3(0);return;}
 vec2 tile=vec2(mod(iz,${TX}.),floor(iz/${TX}.));vec2 px=tile*vec2(${GX},${GY})+clamp(g.xy,vec2(.5),vec2(${GX - .5},${GY - .5}));
 gl_Position=vec4(px/vec2(${AW},${AH})*2.-1.,0,1);gl_PointSize=2.;
 ab=C.rgb*1.6*C.a*amt*f*w*min(1.,P.w*5.)*mix(1.,.45,smoothstep(6.,40.,P.w));}`, `#version 300 es
precision highp float;in vec3 ab;out vec4 o;void main(){vec2 d=gl_PointCoord-.5;o=vec4(ab*exp(-dot(d,d)*4.)*.68,1);}`);
// separable blur inside atlas tiles; axis 0=x 1=y 2=z
const VBLUR = prog(QVS, `#version 300 es
precision highp float;precision highp sampler2D;in vec2 uv;out vec4 o;uniform sampler2D s;uniform int axis;uniform float rad,k;
void main(){ivec2 P=ivec2(gl_FragCoord.xy);ivec2 tile=P/ivec2(${GX},${GY});ivec2 q=P-tile*ivec2(${GX},${GY});int z=tile.x+tile.y*${TX};
 float w[4]=float[](1.,.0,.0,.0);float sg=rad;float tot=0.;vec4 a=vec4(0);
 for(int i=-3;i<=3;i++){float wi=exp(-float(i*i)/(2.*sg*sg));ivec2 pp;
  if(axis==0){int x=clamp(q.x+i,0,${GX - 1});pp=tile*ivec2(${GX},${GY})+ivec2(x,q.y);}
  else if(axis==1){int y=clamp(q.y+i,0,${GY - 1});pp=tile*ivec2(${GX},${GY})+ivec2(q.x,y);}
  else {int zz=clamp(z+i,0,${GZ - 1});pp=ivec2(zz%${TX},zz/${TX})*ivec2(${GX},${GY})+q;}
  a+=texelFetch(s,pp,0)*wi;tot+=wi;}
 o=a/tot*k;}`);
const COPYK = prog(QVS, `#version 300 es
precision highp float;precision highp sampler2D;out vec4 o;uniform sampler2D s;uniform float k;void main(){o=texelFetch(s,ivec2(gl_FragCoord.xy),0)*k;}`);
const SAMPLE_GLSL = `
vec3 toG(vec3 p){return (p-vec3(${-XH},${Y0},${-ZH}))/vec3(${2 * XH},${(SURF - Y0).toFixed(4)},${2 * ZH});}
vec3 sampleD(sampler2D A,vec3 p){vec3 g=toG(p);if(any(lessThan(g,vec3(0)))||any(greaterThan(g,vec3(1))))return vec3(0);
 float z=g.z*${GZ}.-.5;float z0=clamp(floor(z),0.,${GZ - 1}.);float z1=min(z0+1.,${GZ - 1}.);float f=clamp(z-z0,0.,1.);
 vec2 inT=clamp(g.xy*vec2(${GX},${GY}),vec2(.5),vec2(${GX - .5},${GY - .5}));
 vec2 a0=(vec2(mod(z0,${TX}.),floor(z0/${TX}.))*vec2(${GX},${GY})+inT)/vec2(${AW},${AH});
 vec2 a1=(vec2(mod(z1,${TX}.),floor(z1/${TX}.))*vec2(${GX},${GY})+inT)/vec2(${AW},${AH});
 return mix(texture(A,a0).rgb,texture(A,a1).rgb,f);}
vec3 sampleL(sampler2D A,vec3 p){vec3 g=clamp(toG(p),vec3(0),vec3(1));
 float z=g.z*${LZ}.-.5;float z0=clamp(floor(z),0.,${LZ - 1}.);float z1=min(z0+1.,${LZ - 1}.);float f=clamp(z-z0,0.,1.);
 vec2 inT=clamp(g.xy*vec2(${LX},${LY}),vec2(.5),vec2(${LX - .5},${LY - .5}));
 vec2 a0=(vec2(mod(z0,${LTX}.),floor(z0/${LTX}.))*vec2(${LX},${LY})+inT)/vec2(${LAW},${LAH});
 vec2 a1=(vec2(mod(z1,${LTX}.),floor(z1/${LTX}.))*vec2(${LX},${LY})+inT)/vec2(${LAW},${LAH});
 return mix(texture(A,a0).rgb,texture(A,a1).rgb,f);}
vec3 tmOD(vec3 od){float m=max(od.r,max(od.g,od.b));return od/(1.+m/${(+(Q.get("cap")||10)).toFixed(2)});}
`;
log('VSPL/VBLUR');
// light transmittance volume: march from each voxel toward the backlight
const LIGHT = prog(QVS, `#version 300 es
precision highp float;precision highp sampler2D;in vec2 uv;out vec4 o;uniform sampler2D D;uniform vec3 Ld;uniform float KA;
${SAMPLE_GLSL}
void main(){ivec2 P=ivec2(gl_FragCoord.xy);ivec2 tile=P/ivec2(${LX},${LY});ivec2 q=P-tile*ivec2(${LX},${LY});int z=tile.x+tile.y*${LTX};
 vec3 g=(vec3(vec2(q),float(z))+.5)/vec3(${LX},${LY},${LZ});vec3 p=vec3(${-XH},${Y0},${-ZH})+g*vec3(${2 * XH},${(SURF - Y0).toFixed(4)},${2 * ZH});
 vec3 od=vec3(0);float st=.04;
 for(int i=1;i<=26;i++){vec3 s=p-Ld*(float(i)*st-.02);if(s.z<${(-ZH).toFixed(3)}||s.y>${SURF}||s.y<${Y0}||abs(s.x)>${XH.toFixed(3)})break;od+=sampleD(D,s)*st;}
 o=vec4(exp(-tmOD(od*KA)*.85),1);}`);

log('LIGHT');
// ---------------- screen splat (V1 style) for ink=splat and the thread layer
const SPL = prog(`#version 300 es
precision highp float;precision highp sampler2D;uniform sampler2D pos,col;uniform mat4 VP;uniform int tw,rows;uniform float ps,amt,fade[${SLOTS}];out vec3 ab;
void main(){ivec2 ij=ivec2(gl_VertexID%tw,gl_VertexID/tw);vec4 P=texelFetch(pos,ij,0);vec4 C=texelFetch(col,ij,0);
 int sl=min(ij.y/rows,${SLOTS - 1});float f=fade[sl];
 if(P.y<-50.||C.a<.01||f<=0.){gl_Position=vec4(2,2,2,1);gl_PointSize=1.;ab=vec3(0);return;}
 vec4 cp=VP*vec4(P.xyz,1.);gl_Position=cp;gl_PointSize=ps;ab=C.rgb*1.6*C.a*amt*f*min(1.,P.w*5.);}`, `#version 300 es
precision highp float;in vec3 ab;out vec4 o;void main(){vec2 d=gl_PointCoord*2.-1.;float r=dot(d,d);if(r>1.)discard;o=vec4(ab*exp(-r*2.6),1);}`);
const BLUR = prog(QVS, `#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D s;uniform vec2 d;
void main(){float w[5]=float[](.227,.194,.121,.054,.016);vec4 a=texture(s,uv)*w[0];for(int i=1;i<5;i++)a+=(texture(s,uv+d*float(i))+texture(s,uv-d*float(i)))*w[i];o=a;}`);

// ---------------- the scene: tank, water, dye volume, TIR surface, floor, backdrop
const SCENE = prog(QVS, `#version 300 es
precision highp float;precision highp sampler2D;in vec2 uv;out vec4 o;
uniform sampler2D D,LT,SD,SB;uniform vec2 res;uniform float t,KA,KS,salt,thr;uniform vec3 eye,cf,cr,cu,Ld;uniform float tanF;
uniform vec4 bead;uniform vec3 beadCol;uniform vec4 rip[4];uniform vec3 ib0,ib1;
${SAMPLE_GLSL}
#define INK_VOL ${OPT.ink === 'vol' ? 1 : 0}
#define TANK ${OPT.tank ? 1 : 0}
float h1(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
vec2 box(vec3 ro,vec3 rd,vec3 a,vec3 b){vec3 i=1./rd;vec3 t0=(a-ro)*i,t1=(b-ro)*i;vec3 mn=min(t0,t1),mx=max(t0,t1);return vec2(max(max(mn.x,mn.y),mn.z),min(min(mx.x,mx.y),mx.z));}
const vec3 LCOL=vec3(1.0,.955,.89);
// studio sweep behind the tank: the light source. Falls off to warm grey at the edges.
vec3 sweep(vec3 ro,vec3 rd){float tt=(-2.4-ro.z)/min(rd.z,-1e-3);vec3 p=ro+rd*tt;
 float r=length(vec2(p.x*.40,(p.y-1.40)*.60));float L=1.22*exp(-r*r*1.45)+.07;
 vec3 c=LCOL*L;c=mix(c,vec3(.55,.52,.50)*L,smoothstep(.2,1.4,r)*.4);return c;}
vec3 room(vec3 rd){return mix(vec3(.16,.145,.13),vec3(.42,.40,.37),smoothstep(-.3,.6,rd.y));}
vec3 tableCol(vec3 p,vec3 ro){float g=n2(vec2(p.x*1.4,p.z*9.)+n2(p.xz*vec2(.6,3.))*3.);vec3 c=mix(vec3(.085,.07,.06),vec3(.14,.115,.095),g);
 // soft light pool from the sweep and tank shadow toward the viewer
 float pool=exp(-pow(p.x*.35,2.))*smoothstep(3.,-.5,p.z);c*=.6+1.2*pool;
 float shd=smoothstep(.0,.45,abs(p.x)-${XH})+smoothstep(${ZH},${ZH + 1.6},p.z)*.6;c*=mix(.62,1.,clamp(shd,0.,1.));return c;}
vec3 floorCol(vec3 p){vec3 Lt=sampleL(LT,p+vec3(0,.012,0));float g=n2(p.xz*vec2(14.,14.))*.04;vec3 base=vec3(.80,.79,.76)-g;
 float lit=.55+.45*exp(-pow(p.x*.32,2.));return base*(LCOL*.95*Lt*lit+vec3(.12,.12,.13));}
float phaseHG(float c,float g){return (1.-g*g)/pow(1.+g*g-2.*g*c,1.5)/12.566;}
// march dye through [t0,t1]
void marchVol(vec3 ro,vec3 rd,float t0,float t1,inout vec3 od,inout vec3 L,float jit){
#if INK_VOL
 float cs=dot(Ld,-rd);float pf=mix(.35,1.7,pow(max(cs,0.),6.));
 vec2 hb=box(ro,rd,ib0,ib1);t0=max(t0,hb.x);t1=min(t1,hb.y);if(t1<=t0)return;
 float len=t1-t0;int N=int(clamp(len/${LOW ? '.012' : '.0085'},6.,190.));float dt=len/float(N);
 for(int i=0;i<190;i++){if(i>=N)break;vec3 p=ro+rd*(t0+(float(i)+jit)*dt);vec3 d=sampleD(D,p);float lum=d.r+d.g+d.b;
  if(lum<.004)continue;
  vec3 Lt=sampleL(LT,p);vec3 tint=exp(-d/(lum*.3333)*.7);
  vec3 Tc=exp(-tmOD(od));
  L+=Tc*(LCOL*1.1*Lt*pf+vec3(.16,.155,.15))*tint*KS*lum*.3333*dt*KA;
  od+=d*dt*KA;}
#endif
}
void main(){vec2 fc=gl_FragCoord.xy;vec2 q=(fc-.5*res)/res.y*2.;
 vec3 rd=normalize(cf+q.x*tanF*cr+q.y*tanF*cu);vec3 ro=eye;
 float jit=h1(fc+fract(t*7.3)*17.);
 vec3 col;vec3 od=vec3(0),L=vec3(0);float tirK=1.;
 vec3 wa=vec3(${-XH},${Y0},${-ZH}),wb=vec3(${XH},${SURF},${ZH});
 vec3 ga=vec3(${-XH - GT},${Y0 - SLAB},${-ZH - GT}),gb=vec3(${XH + GT},${RIM},${ZH + GT});
 vec2 hg=box(ro,rd,ga,gb);
 vec3 glassTint=vec3(1);float edge=0.,edgeHi=0.;
 vec3 bgc;
 if(hg.x<hg.y&&hg.y>0.){
   vec3 pe=ro+rd*hg.x;
#if !TANK
   pe=vec3(0,1,0);
#endif
   // entry through the front pane: edge-on glass at the sides, thick bottom slab
   if(abs(pe.z-${ZH + GT})<.002){float ex=${XH}-abs(pe.x);edge=smoothstep(.0,-.004,ex);edgeHi=exp(-pow((ex+${GT * .5})/.004,2.));
     if(pe.y<${Y0}){edge=max(edge,.85);edgeHi=max(edgeHi,exp(-pow((pe.y-${Y0 - .012})/.006,2.)));}
     if(pe.y>${RIM - .006})edgeHi=max(edgeHi,1.);}
#if TANK
   glassTint=vec3(.955,.975,.965);
#endif
   vec2 hw=box(ro,rd,wa,wb);
   if(hw.x<hw.y&&hw.y>0.){
     vec3 p0=ro+rd*hw.x;
     vec3 o2=ro+rd*max(hw.x,0.);vec3 d2=rd;float tEnd=hw.y-max(hw.x,0.);float refl=1.;
     for(int sg=0;sg<3;sg++){
       marchVol(o2,d2,0.,tEnd,od,L,jit);
       vec3 pe2=o2+d2*tEnd;
       float eps=.0008;bool top=pe2.y>${SURF}-eps,flo=pe2.y<${Y0}+eps,bk=pe2.z<-${ZH}+eps,sd=abs(pe2.x)>${XH}-eps,fr=pe2.z>${ZH}-eps;
       vec3 nd=d2;bool tir=false;
       if(top&&d2.y>0.){ if(d2.y<.66){nd.y=-d2.y;tir=true;
           float rp=0.;for(int i=0;i<4;i++){vec4 R=rip[i];if(R.z<=0.)continue;float a=t-R.y;if(a<0.||a>4.)continue;float dd=length(pe2.xz-R.xw);float rr=a*.30;rp+=R.z*sin((dd-rr)*70.)*exp(-pow((dd-rr)*9.,2.))*exp(-a*1.2)/(1.+dd*4.);}
           nd=normalize(nd+vec3(rp*.03,0,rp*.03));}
         else {bgc=LCOL*1.05;break;} }
#if TANK
       else if(sd&&abs(d2.x)<.66&&sg<2){nd.x=-d2.x;tir=true;}
       else if(fr&&d2.z>0.){bgc=room(d2)*.6;break;}
       else if(flo){bgc=floorCol(pe2);break;}
#else
       else if(flo){bgc=sweep(pe2,d2);break;}
#endif
       else if(bk){bgc=sweep(pe2,d2);break;}
       else if(sd){bgc=sweep(pe2,d2)*vec3(.86,.9,.88)+room(d2)*.1;break;}
       else {bgc=room(d2);break;}
       if(tir){refl*=.9;o2=pe2;d2=nd;vec2 h2=box(o2-d2*.002,d2,wa,wb);tEnd=max(h2.y-.002,0.);if(sg==2)bgc=room(d2)*.7;}
     }
     bgc*=refl;
     // salt layer shimmer (Schlieren line)
     if(salt>0.){float ts=(salt-ro.y)/rd.y;if(ts>hw.x&&ts<hw.y){vec3 ps=ro+rd*ts;float s=n2(ps.xz*vec2(9.,30.)+t*.2);bgc*=1.+.05*(s-.5);}}
     col=bgc*exp(-tmOD(od))+L;
     // meniscus at the front pane
     if(abs(p0.z-${ZH})<.002){float dm=p0.y-${SURF};col=mix(col,vec3(.30,.31,.32),exp(-pow(dm/.0035,2.))*.65);}
   } else {
     // above the water inside the tank, or through the slab
     vec3 pe2=ro+rd*hg.y;
     if(pe.y<${Y0}){bgc=floorCol(vec3(pe.x,${Y0},pe.z))*vec3(.55,.68,.62);} 
     else if(pe2.z<${-ZH}){bgc=sweep(pe2,rd);}else bgc=room(rd);
     col=bgc;
   }
   col*=glassTint;
   col=mix(col,col*vec3(.42,.55,.50),edge*.8);
   col+=vec3(.85,.9,.88)*edgeHi*.55;
 } else {
   if(TANK==1&&rd.y<0.){float tt=(${Y0 - SLAB}-ro.y)/rd.y;vec3 p=ro+rd*tt;col=tableCol(p,ro);}
   else col=sweep(ro,rd);
 }
#if !INK_VOL
 { vec4 Ds=texture(SD,uv)*.42+texture(SB,uv)*.58; vec3 T=exp(-tmOD(Ds.rgb));col=col*T+(1.-T)*vec3(.10,.10,.115)*.4; }
#endif
 if(thr>0.){vec4 a=texture(SD,uv),b=texture(SB,uv);vec3 hp=max(a.rgb-b.rgb,vec3(0))*thr;col*=exp(-tmOD(hp));}
 // falling bead
 if(bead.w>0.){vec2 d=fc-bead.xy;float r=length(d)/bead.z;if(r<1.){float z=sqrt(1.-r*r);vec3 bc=beadCol*(.25+.75*z);
     bc+=vec3(.9)*pow(max(0.,dot(normalize(vec3(d/bead.z,z)),normalize(vec3(-.4,.5,.8)))),30.);col=mix(col,bc,bead.w*smoothstep(1.,.85,r));}}
 // filmic tone + vignette + grain
 col*=1.-.42*pow(length((fc/res-.5)*vec2(1.1,1.))*1.15,2.4);
 col=col*(2.51*col+.03)/(col*(2.43*col+.59)+.14);
 col=pow(clamp(col,0.,1.),vec3(1./1.9));
 col+=(h1(fc+fract(t)*91.)-.5)*.012;
 o=vec4(col,1);}`);

log('SCENE');
// ---------------- resources
let posT, posF, colT, cur = 0;
const volT = [0, 1].map(() => tex(AW, AH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR)), volF = volT.map(fbo);
const memT = [0, 1].map(() => tex(AW, AH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR)), memF = memT.map(fbo); let mc = 0, memClock = 0, memAxis = 0;
function clearMem() { memF.forEach(f => { gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }); }
clearMem();
const litT = tex(LAW, LAH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR), litF = fbo(litT);
const ringT = tex(MAXR, 5, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
const segT = tex(MAXR * SEGS, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
let sdT, sdF, sbT, sbF, stT, stF;
function allocTracers() { const NT = TW * TW; const init = new Float32Array(NT * 4).fill(-99);
  posT = [0, 1].map(() => tex(TW, TW, gl.RGBA32F, gl.RGBA, gl.FLOAT, init)); posF = posT.map(fbo);
  colT = tex(TW, TW, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(NT * 4)); }
function allocRT() { W = Math.max(2, Math.round(innerWidth * DPR * RS)); H = Math.max(2, Math.round(innerHeight * DPR * RS)); cv.width = W; cv.height = H;
  [typeof sdT !== 'undefined' && sdT, typeof stT !== 'undefined' && stT, typeof sbT !== 'undefined' && sbT].forEach(t => t && gl.deleteTexture(t));
  const hf = (w, h) => tex(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR);
  sdT = hf(W, H); sdF = fbo(sdT); stT = hf(W >> 1, H >> 1); stF = fbo(stT); sbT = hf(W >> 1, H >> 1); sbF = fbo(sbT); }

// ---------------- camera (fits the cascade)
const cam = { y: 1.62, x: 0, d: 2.2, vy: 0, vx: 0, vd: 0, px: 0, py: 0, tx: 0, ty: 0 };
let lowY = SURF, inkX = 0, inkW = .3, haveInk = false;
// ink AABB (union of everywhere rings and stirs have carried ink since the last reset); the raymarch only samples dye inside it
const IB = [9, 9, 9, -9, -9, -9]; const ibAdd = (c, r) => { for (let k = 0; k < 3; k++) { IB[k] = Math.min(IB[k], c[k] - r); IB[k + 3] = Math.max(IB[k + 3], c[k] + r); } IB[1] = Y0; };
const ibReset = () => { IB[0] = IB[1] = IB[2] = 9; IB[3] = IB[4] = IB[5] = -9; };
function camTarget() {
  if (!OPT.follow) return { y: 1.45, x: 0, d: 4.05 };
  const top = SURF + .12, bot = Math.min(lowY - .16, SURF - 1.62);
  const hgt = top - bot; const fh = hgt / .80;
  let d = fh * .5 / Math.tan(FOV / 2) + ZH; // distance from tank centre
  const wfit = (inkW + .5) * .5 / (Math.tan(FOV / 2) * W / H) + ZH; d = Math.max(d, wfit);
  d = clamp(d, 1.55, 4.25);
  const fhA = (d - ZH) * 2 * Math.tan(FOV / 2);
  const y = top - fhA * .5 + .02;
  return { y, x: clamp(inkX * .6, -.6, .6), d };
}
function stepCam(dt) { const T = camTarget(); const k = 1.1, z = 2 * Math.sqrt(k);
  for (const [a, b] of [['y', 'vy'], ['x', 'vx'], ['d', 'vd']]) { const acc = k * (T[a] - cam[a]) - z * cam[b]; cam[b] += acc * dt; cam[a] += cam[b] * dt; } }
let EYE, CF, CR, CU, VP;
function persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]; }
function lookAt(e, c, u) { const z = nrm(sub(e, c)), x = nrm(cross(u, z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]; }
function mm(a, b) { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return r; }
function updCam() { const e = [cam.x + cam.px * .12, cam.y - .08 + cam.py * .04, cam.d]; const c = [cam.x * .9, cam.y + .02, 0];
  EYE = e; CF = nrm(sub(c, e)); CR = nrm(cross(CF, [0, 1, 0])); CU = cross(CR, CF); VP = mm(persp(FOV, W / H, .05, 30), lookAt(e, c, [0, 1, 0])); }
function proj(p) { const v = VP; let x = 0, y = 0, w = 0; for (let k = 0; k < 4; k++) { const c = k < 3 ? p[k] : 1; x += v[k * 4] * c; y += v[k * 4 + 1] * c; w += v[k * 4 + 3] * c; } return [(x / w) * .5 + .5, (y / w) * .5 + .5, w]; }
function screenToWater(sx, sy) { // ray from eye through screen point, intersect plane z=0
  const q = [(sx - .5) * 2 * W / H, (sy - .5) * 2]; const tf = Math.tan(FOV / 2);
  const rd = nrm(add(add(CF, mul(CR, q[0] * tf)), mul(CU, q[1] * tf))); const t = -EYE[2] / rd[2]; return add(EYE, mul(rd, t)); }

// ---------------- rings (CPU)
let rings = [], time = 0;
const PR = { grow: +(Q.get('grow') || .07), gd0: +(Q.get('gd0') || .02), gd1: +(Q.get('gd1') || .03), gch: +(Q.get('gch') || .48), tilt: .45 };
const KS_ = [0, 4, 3, 3];
function newRing(c, n, R, G, gen, k, slot) { const [u, v] = frameOf(n); return { c, n, u, v, R, G, a: R * .22, gen, k, amp: R * .004 * (1 + rnd()), ph: rnd() * 6.283, age: 0, alive: true, sig: .8 + .3 * rnd(), slot }; }
function nodes(r) { const out = []; for (let s = 0; s < SEGS; s++) { const th = s / SEGS * 6.2831853; const w = Math.cos(r.k * th + r.ph); const rad = add(mul(r.u, Math.cos(th)), mul(r.v, Math.sin(th))); const RR = r.R * (1 - .25 * w * r.amp / r.R); out.push(add(add(r.c, mul(rad, RR)), mul(r.n, w * r.amp))); } return out; }
function biot(p, segsArr, G, a) { let v = [0, 0, 0]; let prev = segsArr[segsArr.length - 1]; for (const q of segsArr) { const dl = sub(q, prev), m = mul(add(q, prev), .5), rr = sub(p, m); const r2 = dot(rr, rr) + a * a; v = add(v, mul(cross(dl, rr), G / (12.566 * r2 * Math.sqrt(r2)))); prev = q; } return v; }
const stirs = [];
function stirVel(p) { let v = [0, 0, 0]; for (const s of stirs) { const d = sub(p, s.p); v = add(v, mul(s.v, Math.exp(-dot(d, d) / (s.r * s.r)))); } return v; }
function stepRings(dt) {
  const live = rings.filter(r => r.alive); const ns = live.map(nodes);
  for (let i = 0; i < live.length; i++) { const r = live[i];
    let U = r.G / (12.566 * r.R) * (Math.log(8 * r.R / r.a) - .25);
    // floor / salt interface: a ring approaching a wall slows and spreads (image vortex)
    const wallY = OPT.salt > 0 && r.c[1] > OPT.salt - .02 ? OPT.salt : Y0;
    const gap = r.c[1] - wallY; const wk = smooth(.0, r.R * 2.4 + .02, gap) * (r.n[1] < 0 ? 1 : 1);
    let v = mul(r.n, U * (OPT.salt > 0 && wallY === OPT.salt ? .25 + .75 * wk : .2 + .8 * wk));
    for (let j = 0; j < live.length; j++) { if (i === j) continue; const o = live[j]; if (len(sub(o.c, r.c)) > o.R * 5 + r.R) continue; v = add(v, biot(r.c, ns[j], o.G, o.a * 1.5)); }
    v = add(v, stirVel(r.c)); v[1] -= .01 * wk;
    r.c = add(r.c, mul(v, dt));
    r.R += dt * U * (PR.grow * r.sig + (1 - wk) * .9); r.a = Math.min(r.a + dt * .002, r.R * .4);
    r.G *= Math.exp(-dt * (PR.gd0 + PR.gd1 * r.gen + (1 - wk) * .35));
    r.amp *= Math.exp((1.15 + .3 * r.gen) * dt * r.sig * (.3 + .7 * wk)); r.age += dt;
    if (r.gen < 3 && r.amp > r.R * .42) split(r);
    if (r.gen === 3 && r.age > 4) r.G *= Math.exp(-dt * .6);
    if (r.G < .0015) r.alive = false;
    if (r.alive) { lowY = Math.min(lowY, r.c[1] - r.R * .6); ibAdd(r.c, r.R + .35); }
  }
  if (rings.length > 600) rings = rings.filter(r => r.alive);
  const lv = rings.filter(r => r.alive); if (lv.length) { let a = 9, b = -9, m = 0; lv.forEach(r => { a = Math.min(a, r.c[0] - r.R); b = Math.max(b, r.c[0] + r.R); m += r.c[0]; }); inkW = Math.max(inkW, b - a); inkX = inkX + ((a + b) * .5 - inkX) * Math.min(1, dt * .8); }
}
function split(r) { r.alive = false; const k = r.k;
  for (let j = 0; j < k; j++) { const th = (2 * Math.PI * j - r.ph) / k;
    const rad = add(mul(r.u, Math.cos(th)), mul(r.v, Math.sin(th)));
    const tilt = PR.tilt + .2 * rnd(); const n = nrm(add(mul(r.n, Math.cos(tilt)), mul(rad, Math.sin(tilt))));
    const c = add(add(r.c, mul(rad, r.R * .95)), mul(r.n, r.amp));
    const g = r.gen + 1; rings.push(newRing(c, n, r.R * (.31 + .07 * rnd()), r.G * (PR.gch + .06 * rnd()), g, KS_[Math.min(3, g + 1)] + (rnd() < .3 ? 1 : 0), r.slot)); }
  sfx.split(r.gen);
}
const ringBuf = new Float32Array(MAXR * 5 * 4), segBuf = new Float32Array(MAXR * SEGS * 4);
function uploadRings() { const live = rings.filter(r => r.alive).slice(-MAXR); ringBuf.fill(0);
  live.forEach((r, i) => { ringBuf.set([r.c[0], r.c[1], r.c[2], r.R + r.amp], i * 4); ringBuf.set([r.G, r.a * .55, Math.min(1, r.amp / (r.R * .42)), r.R], (MAXR + i) * 4); ringBuf.set([r.n[0], r.n[1], r.n[2], r.k], (2 * MAXR + i) * 4); ringBuf.set([r.u[0], r.u[1], r.u[2], r.ph], (3 * MAXR + i) * 4); ringBuf.set([r.age, r.gen, 0, 0], (4 * MAXR + i) * 4); nodes(r).forEach((q, s) => segBuf.set([q[0], q[1], q[2], 0], (i * SEGS + s) * 4)); });
  gl.bindTexture(gl.TEXTURE_2D, ringT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXR, 5, gl.RGBA, gl.FLOAT, ringBuf);
  gl.bindTexture(gl.TEXTURE_2D, segT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXR * SEGS, 1, gl.RGBA, gl.FLOAT, segBuf); return live.length; }

// ---------------- drops
let dropCount = 0; const slotFade = new Float32Array(SLOTS); const slotTarget = new Float32Array(SLOTS);
const ripples = [];
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
  ripples.push({ x, z, t: time, a: .9 * size }); if (ripples.length > 4) ripples.shift();
  if (!haveInk) { haveInk = true; } sfx.drip(size);
}
const falling = []; const TIPY = SURF + .24;
// tank memory: before a drop slot is reused, its ink is baked into a persistent volume that keeps diffusing and slowly dilutes
function bakeSlot(slot) {
  if (OPT.ink !== 'vol' || slotFade[slot] <= .001) return;
  const f = new Float32Array(SLOTS); f[slot] = slotFade[slot];
  gl.bindFramebuffer(gl.FRAMEBUFFER, memF[mc]); gl.viewport(0, 0, AW, AH); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  gl.useProgram(VSPL); gl.bindVertexArray(emptyVao); bindTex(VSPL, 'pos', 0, posT[cur]); bindTex(VSPL, 'col', 1, colT);
  gl.uniform1i(VSPL.u.tw, TW); gl.uniform1i(VSPL.u.rows, ROWS()); gl.uniform1fv(VSPL.u.fade, f); gl.uniform1f(VSPL.u.amt, MASS / (ROWS() * TW) / VOX);
  gl.drawArraysInstanced(gl.POINTS, 0, TW * TW, 2); gl.disable(gl.BLEND); slotFade[slot] = 0;
}
function memTick(dt) {
  if (OPT.ink !== 'vol') return; memClock += dt; if (memClock < .4) return; memClock = 0;
  gl.bindFramebuffer(gl.FRAMEBUFFER, memF[1 - mc]); gl.viewport(0, 0, AW, AH); gl.useProgram(VBLUR); bindTex(VBLUR, 's', 0, memT[mc]);
  gl.uniform1i(VBLUR.u.axis, memAxis); gl.uniform1f(VBLUR.u.rad, .55); gl.uniform1f(VBLUR.u.k, .9965); drawQuad(VBLUR); mc = 1 - mc; memAxis = (memAxis + 1) % 3;
}
function release(x, z, ink, size) { const slot = dropCount % SLOTS; bakeSlot(slot); slotTarget[slot] = 0; falling.push({ x, z, ink, size, y: TIPY, v: 0, slot }); }
function stepFalling(dt) { for (const f of falling) { f.v += 3.4 * dt; f.y -= f.v * dt; }
  while (falling.length && falling[0].y <= SURF && slotFade[falling[0].slot] <= .02) { const f = falling.shift(); spawn(f.x, f.z, f.ink, f.size); }
  for (const f of falling) if (f.y < SURF) f.y = SURF; }

function step(dt) {
  stepFalling(dt);
  for (let i = 0; i < SLOTS; i++) { if (slotFade[i] > slotTarget[i]) slotFade[i] = Math.max(slotTarget[i], slotFade[i] - dt * 1.8); }
  for (const s of stirs) s.v = mul(s.v, Math.exp(-dt * 1.6));
  while (stirs.length && len(stirs[0].v) < .002) stirs.shift();
  stepRings(dt); stepCam(dt); const n = uploadRings();
  gl.viewport(0, 0, TW, TW); gl.disable(gl.BLEND); gl.bindFramebuffer(gl.FRAMEBUFFER, posF[1 - cur]);
  gl.useProgram(UPD); bindTex(UPD, 'pos', 0, posT[cur]); bindTex(UPD, 'rings', 1, ringT); bindTex(UPD, 'segs', 2, segT);
  gl.uniform1i(UPD.u.nr, n); gl.uniform1f(UPD.u.dt, dt); gl.uniform1f(UPD.u.t, time); gl.uniform1f(UPD.u.salt, OPT.salt);
  const sp = new Float32Array(MAXSTIR * 4), sv = new Float32Array(MAXSTIR * 4); stirs.forEach(st => { if (IB[3] > IB[0]) ibAdd(st.p, st.r + .35); });
  stirs.slice(-MAXSTIR).forEach((s, i) => { sp.set([s.p[0], s.p[1], s.p[2], s.r], i * 4); sv.set([s.v[0], s.v[1], s.v[2], 0], i * 4); });
  gl.uniform4fv(UPD.u.stirP, sp); gl.uniform4fv(UPD.u.stirV, sv);
  drawQuad(UPD); cur = 1 - cur; time += dt; memTick(dt);
}

// ---------------- render
const KA = +(Q.get('ka') || 1.0), KSC = +(Q.get('ks') || .08), MASS = +(Q.get('mass') || 3);
function renderVolume() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, volF[0]); gl.viewport(0, 0, AW, AH); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.useProgram(VSPL); gl.bindVertexArray(emptyVao);
  bindTex(VSPL, 'pos', 0, posT[cur]); bindTex(VSPL, 'col', 1, colT);
  gl.uniform1i(VSPL.u.tw, TW); gl.uniform1i(VSPL.u.rows, ROWS()); gl.uniform1fv(VSPL.u.fade, slotFade);
  gl.uniform1f(VSPL.u.amt, MASS / (ROWS() * TW) / VOX);
  gl.drawArraysInstanced(gl.POINTS, 0, TW * TW, 2);
  gl.useProgram(COPYK); bindTex(COPYK, 's', 0, memT[mc]); gl.uniform1f(COPYK.u.k, 1); drawQuad(COPYK); gl.disable(gl.BLEND);
  const pass = (src, dst, axis, rad) => { gl.bindFramebuffer(gl.FRAMEBUFFER, volF[dst]); gl.viewport(0, 0, AW, AH); gl.useProgram(VBLUR); bindTex(VBLUR, 's', 0, volT[src]); gl.uniform1i(VBLUR.u.axis, axis); gl.uniform1f(VBLUR.u.rad, rad); gl.uniform1f(VBLUR.u.k, 1); drawQuad(VBLUR); };
  const PSK = +(Q.get('pskip') || 0); if (PSK === 1) return;
  const vb = +(Q.get('vb') || .55); pass(0, 1, 0, vb); pass(1, 0, 1, vb); pass(0, 1, 2, vb * .93);
  gl.bindFramebuffer(gl.FRAMEBUFFER, litF); gl.viewport(0, 0, LAW, LAH); gl.useProgram(LIGHT); bindTex(LIGHT, 'D', 0, volT[1]);
  gl.uniform3fv(LIGHT.u.Ld, LD); gl.uniform1f(LIGHT.u.KA, KA); drawQuad(LIGHT);
}
const LD = nrm([0, -.34, 1]);
function renderSplat() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, sdF); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.useProgram(SPL); gl.bindVertexArray(emptyVao);
  bindTex(SPL, 'pos', 0, posT[cur]); bindTex(SPL, 'col', 1, colT);
  gl.uniformMatrix4fv(SPL.u.VP, false, VP); gl.uniform1i(SPL.u.tw, TW); gl.uniform1i(SPL.u.rows, ROWS()); gl.uniform1fv(SPL.u.fade, slotFade);
  const ps = Math.max(1.3, 1.9 * H / 1080); gl.uniform1f(SPL.u.ps, ps);
  gl.uniform1f(SPL.u.amt, (65536 / (ROWS() * TW)) * Math.pow(H / 720 * 3.9 / Math.max(1, cam.d), 2) / Math.pow(ps / 1.37, 2) * .55);
  gl.drawArrays(gl.POINTS, 0, TW * TW); gl.disable(gl.BLEND);
  gl.viewport(0, 0, W >> 1, H >> 1); gl.useProgram(BLUR); gl.bindFramebuffer(gl.FRAMEBUFFER, stF); bindTex(BLUR, 's', 0, sdT); gl.uniform2f(BLUR.u.d, 2 / W, 0); drawQuad(BLUR);
  gl.bindFramebuffer(gl.FRAMEBUFFER, sbF); bindTex(BLUR, 's', 0, stT); gl.uniform2f(BLUR.u.d, 0, 2 / H); drawQuad(BLUR);
}
let pointer = { x: .5, y: .5, in: false, down: false, hold: 0, ink: 0 };
let volTick = 0;
function render() {
  updCam();
  volTick++; if (OPT.ink === 'vol' && +(Q.get('pskip') || 0) !== 2 && (!LOW || SHOT || volTick % 3 === 1)) renderVolume();
  if (OPT.ink !== 'vol' || OPT.thr > 0) renderSplat();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(SCENE);
  bindTex(SCENE, 'D', 0, volT[1]); bindTex(SCENE, 'LT', 1, litT); bindTex(SCENE, 'SD', 2, sdT); bindTex(SCENE, 'SB', 3, sbT);
  gl.uniform2f(SCENE.u.res, W, H); gl.uniform1f(SCENE.u.t, time); gl.uniform1f(SCENE.u.KA, KA); gl.uniform1f(SCENE.u.KS, KSC); gl.uniform3f(SCENE.u.ib0, IB[0], IB[1], IB[2]); gl.uniform3f(SCENE.u.ib1, IB[3], IB[4], IB[5]);
  gl.uniform1f(SCENE.u.salt, OPT.salt); gl.uniform1f(SCENE.u.thr, OPT.thr);
  gl.uniform3fv(SCENE.u.eye, EYE); gl.uniform3fv(SCENE.u.cf, CF); gl.uniform3fv(SCENE.u.cr, CR); gl.uniform3fv(SCENE.u.cu, CU); gl.uniform3fv(SCENE.u.Ld, LD);
  gl.uniform1f(SCENE.u.tanF, Math.tan(FOV / 2));
  let bead = [0, 0, 0, 0];
  if (falling.length) { const f = falling[falling.length - 1]; const bp = proj([f.x, f.y, f.z]); bead = [bp[0] * W, bp[1] * H, 9 * f.size * H / 1080 * 2.2 / Math.max(.8, bp[2]), f.y > SURF ? 1 : 0]; }
  gl.uniform4fv(SCENE.u.bead, bead); gl.uniform3fv(SCENE.u.beadCol, hex(INKS[pointer.ink].ui));
  const rp = new Float32Array(16); ripples.forEach((r, i) => rp.set([r.x, r.t, r.a, r.z], i * 4)); gl.uniform4fv(SCENE.u.rip, rp);
  drawQuad(SCENE);
}
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255 * .7, (n >> 8 & 255) / 255 * .7, (n & 255) / 255 * .7]; }

// ---------------- audio
const sfx = (() => { let ac = null, master = null, muted = false;
  function init() { if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .7; master.connect(ac.destination);
    const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); let b = 0; for (let i = 0; i < n; i++) { b = .985 * b + .015 * (Math.random() * 2 - 1); d[i] = b * 3; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; const g = ac.createGain(); g.gain.value = 0; src.connect(lp); lp.connect(g); g.connect(master); src.start(); g.gain.linearRampToValueAtTime(.14, ac.currentTime + 3);
  } catch (e) { ac = null; } }
  function tone(f, a, d, type) { if (!ac || muted) return; const t = ac.currentTime; const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .05); }
  function drip(size) { if (!ac || muted) return; const t = ac.currentTime; const o = ac.createOscillator(), g = ac.createGain();
    const f0 = 1100 / Math.sqrt(size); o.frequency.setValueAtTime(f0 * .55, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + .06); o.frequency.exponentialRampToValueAtTime(f0 * .9, t + .18);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.2, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g); g.connect(master); o.start(t); o.stop(t + .4); tone(92 / size, .1, 2.5); }
  const PENT = [392, 440, 523.25, 587.33, 659.25];
  function split(gen) { tone(PENT[(gen * 2 + (Math.random() * 3 | 0)) % 5] / (gen + 1) * 2, .035, 2.2, 'triangle'); }
  return { init, drip, split, toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : .7; } };
})();

// ---------------- UI
let uiHover = false;
const inksEl = document.getElementById('inks');
INKS.forEach((k, i) => { const d = document.createElement('div'); d.className = 'ink' + (i === 0 ? ' on' : ''); d.innerHTML = `<i style="background:${k.ui}"></i><b>${k.zh} ${k.en}</b>`;
  d.addEventListener('pointerdown', e => { e.stopPropagation(); setInk(i); }); inksEl.insertBefore(d, document.getElementById('salt')); });
const saltEl = document.getElementById('salt');
function setSalt(on) { OPT.salt = on ? 1.15 : 0; saltEl.classList.toggle('on', on); }
saltEl.addEventListener('pointerdown', e => { e.stopPropagation(); setSalt(!(OPT.salt > 0)); }); setSalt(OPT.salt > 0);
function setInk(i) { pointer.ink = i; [...inksEl.querySelectorAll('.ink')].forEach((c, j) => c.classList.toggle('on', j === i)); }
let slow = false, holdStart = 0, downXY = null, stirMode = false, lastMove = null, interacted = false;
cv.addEventListener('pointermove', e => { pointer.x = e.clientX / innerWidth; pointer.y = 1 - e.clientY / innerHeight; pointer.in = true;
  cam.tx = (pointer.x - .5) * 2; cam.ty = (pointer.y - .5) * 2;
  if (pointer.down && downXY) { const dx = e.clientX - downXY[0], dy = e.clientY - downXY[1]; if (!stirMode && Math.hypot(dx, dy) > 14) stirMode = true;
    if (stirMode && lastMove) { const now = performance.now(); const dtm = Math.max(8, now - lastMove.t) / 1000; const w = screenToWater(pointer.x, pointer.y);
      const v = [(w[0] - lastMove.w[0]) / dtm * .35, (w[1] - lastMove.w[1]) / dtm * .35, 0]; const vl = len(v); const vv = vl > .6 ? mul(v, .6 / vl) : v;
      stirs.push({ p: w, v: vv, r: .16 }); if (stirs.length > MAXSTIR) stirs.shift(); lastMove = { t: now, w }; } } });
cv.addEventListener('pointerdown', e => { sfx.init(); interacted = true; pointer.down = true; holdStart = performance.now(); downXY = [e.clientX, e.clientY]; stirMode = false;
  lastMove = { t: performance.now(), w: screenToWater(e.clientX / innerWidth, 1 - e.clientY / innerHeight) }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointerup', () => { if (!pointer.down) return; pointer.down = false;
  if (!stirMode) { const size = 1 + Math.min(pointer.hold, 1.3) * .55; const w = screenToWater(pointer.x, pointer.y); release(clamp(w[0], -XH + .3, XH - .3), (rnd() - .5) * .2, pointer.ink, size); fadeTitle(); }
  pointer.hold = 0; stirMode = false; });
addEventListener('keydown', e => { if (e.code === 'Space') { slow = true; e.preventDefault(); } if (e.key === 'r' || e.key === 'R') resetWater(); if (e.key === 'm' || e.key === 'M') sfx.toggle(); if (e.key === 's' || e.key === 'S') setSalt(!(OPT.salt > 0)); const n = +e.key; if (n >= 1 && n <= INKS.length) setInk(n - 1); });
addEventListener('keyup', e => { if (e.code === 'Space') slow = false; });
addEventListener('resize', () => allocRT());
function resetWater() { clearMem(); ibReset(); for (let i = 0; i < SLOTS; i++) slotTarget[i] = 0; rings.forEach(r => r.alive = false); lowY = SURF; inkW = .3; }
let titleFaded = false; function fadeTitle() { if (titleFaded) return; titleFaded = true; setTimeout(() => { document.querySelector('#title p').style.opacity = 0; }, 2500); }

// ---------------- boot
allocRT(); { const T0c = camTarget(); cam.x = T0c.x; cam.y = T0c.y; cam.d = T0c.d; } updCam();
if (SHOT) {
  TW = TW || 512; allocTracers();
  const T = +Q.get('shot'); const DT = 1 / 60;
  const script = (Q.get('drops') || '-0.12,0,0,1,0').split(';').map(s => s.split(',').map(Number));
  let si = 0; const N = Math.round(T / DT);
  (async () => { for (let i = 0; i < N; i++) { while (si < script.length && script[si][4] <= time + 1e-6) { const s = script[si++]; pointer.ink = s[2]; release(s[0], s[1], s[2], s[3]); } step(DT); if (i % 20 === 0) await new Promise(r => setTimeout(r, 0)); }
    log('sim done'); render(); gl.finish(); log('render done'); window.__ready = true; })();
} else {
  TW = TW || (LOW ? 512 : 768); allocTracers(); let fpsClock = 0;
  let last = performance.now(), autoT = 0, autoDone = false;
  const loop = now => { let d = Math.min(LOW ? .1 : .05, (now - last) / 1000); last = now;
    cam.px += (cam.tx * .5 - cam.px) * Math.min(1, d * 1.5); cam.py += (cam.ty * .5 - cam.py) * Math.min(1, d * 1.5);
    if (pointer.down) pointer.hold = (now - holdStart) / 1000;
    autoT += d; if (!autoDone && autoT > .4 && !interacted) { autoDone = true; release(-.12, 0, 0, 1); }
    const sd = d * (slow ? .25 : 1); const k = Math.max(1, Math.ceil(sd / (1 / 50))); for (let i = 0; i < k; i++) step(sd / k);
    render(); FR.push(performance.now()); if (FR.length > 60) FR.shift();
    fpsClock += d; if (fpsClock > 2 && FR.length > 8) { fpsClock = 0; const f = window.__fps(); const r0 = RS; if (f < 24 && RS > (LOW ? .42 : .5)) RS = Math.max(LOW ? .42 : .5, RS * .82); else if (f > 52 && RS < 1) RS = Math.min(1, RS * 1.12); if (RS !== r0) allocRT(); } requestAnimationFrame(loop); };
  const FR = []; window.__fps = () => FR.length > 1 ? +((FR.length - 1) * 1000 / (FR[FR.length - 1] - FR[0])).toFixed(1) : 0;
  requestAnimationFrame(loop); window.__ready = true;
}
window.__info = () => ({ RS: +RS.toFixed(2), LOW, RENDERER, fps: window.__fps ? window.__fps() : 0, TW, rings: rings.length, live: rings.filter(r => r.alive).length, time, cam: { y: cam.y, d: cam.d, x: cam.x }, lowY, OPT });
})();
