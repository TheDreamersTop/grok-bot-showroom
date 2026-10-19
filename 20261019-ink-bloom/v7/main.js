'use strict';
window.addEventListener('error', () => { window.__ready = true; });
// 墨華 Ink Bloom — V6 engine (hero: two-tone chandelier over a default brine layer; lantern framing, pigment gamut, ink brush). Vortex-filament ink cascade + GPU tracers, rendered as a raymarched dye volume in a real tank.
// Switches (for the Phase-B exploration X1/X2/X3 and V2): ?ink=vol|splat  &tank=0|1  &follow=0|1  &salt=<y>
(() => {
const Q = new URLSearchParams(location.search);
const SALT0 = +(Q.get('salt0') || .72);
const SHOT = Q.has('shot');
const OPT = {
  ink: Q.get('ink') || 'vol',            // vol: 3D dye grid raymarch (X1); splat: V1 screen splats (X2-only test)
  tank: Q.get('tank') !== '0',           // raymarched glass tank, floor, TIR surface (X2)
  follow: Q.get('follow') !== '0',       // camera fits the cascade (X2)
  salt: Q.has('salt') ? +Q.get('salt') : SALT0,  // brine layer height; V5 default = a faint layer partway down, ?salt=0 = none
  thr: Q.has('thr') ? +Q.get('thr') : .6,             // fine-thread detail layer from tracers (0..1)
};
const cv = document.getElementById('c');
const gl = cv.getContext('webgl2', { antialias: false, preserveDrawingBuffer: SHOT, alpha: false });
if (!gl || !gl.getExtension('EXT_color_buffer_float')) { document.getElementById('nogl').style.display = 'flex'; return; }
const RINFO = gl.getExtension('WEBGL_debug_renderer_info'); const RENDERER = RINFO ? String(gl.getParameter(RINFO.UNMASKED_RENDERER_WEBGL)) : '';
const SOFT = /swiftshader|llvmpipe|software|basic render/i.test(RENDERER);
const IGPU = /intel|iris|uhd|apple m\d|apple gpu|mali|adreno|powervr|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics/i.test(RENDERER);
// GPU probe: a short synthetic fragment workload, timed with gl.finish, picks a tier for real GPUs too (high / mid / low)
function probeGPU() { try {
  const vs = '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}';
  const fs = '#version 300 es\nprecision highp float;out vec4 o;void main(){vec2 p=gl_FragCoord.xy*.01;float a=0.;for(int i=0;i<96;i++){p=vec2(p.x*p.x-p.y*p.y,2.*p.x*p.y)*.5+vec2(.3,.2)+sin(p.yx*3.1)*.2;a+=dot(p,p);}o=vec4(fract(a));}';
  const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 512, 512);
  const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
  const px = new Uint8Array(4); gl.viewport(0, 0, 512, 512); gl.useProgram(pr); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const t0 = performance.now(); for (let i = 0; i < 4; i++) gl.drawArrays(gl.TRIANGLES, 0, 3); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const ms = (performance.now() - t0) / 4; // readPixels forces the GPU to finish
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteTexture(tx); gl.deleteProgram(pr); return ms; } catch (e) { return 99; } }
const PROBE_MS = SHOT ? 0 : probeGPU();
const TIER = Q.get('tier') || (Q.has('low') ? (Q.get('low') === '1' ? 'low' : 'high') : SHOT ? 'high' : (SOFT || PROBE_MS > 20) ? 'low' : (IGPU || PROBE_MS > 2.5) ? 'mid' : 'high');
const LOW = TIER === 'low', SMALLGRID = TIER !== 'high';
let RS = LOW ? .55 : TIER === 'mid' ? .85 : 1; // render scale, adapted to frame rate in live mode
gl.getExtension('EXT_float_blend'); gl.getExtension('OES_texture_float_linear');
const DBG = Q.has('dbg'); const T0 = performance.now(); const log = m => DBG && console.log('[' + ((performance.now() - T0) / 1000).toFixed(2) + 's] ' + m);
const DPR = Math.min(window.devicePixelRatio || 1, SHOT || TIER !== 'high' ? 1 : 1.25);
let W = 0, H = 0;

// ---------------- helpers
let seed = +(Q.get('seed') || 5);
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
const SURF = 2.2, Y0 = .32, XH = 1.75, ZH = .55, GT = .028, SLAB = .075, RIM = 2.36;
const FOV = .50;
const MAXR = LOW ? 128 : 224, SEGS = 24, SLOTS = 8, MAXSTIR = 10;
// volume grid (atlas of z-slices)
const GX = SMALLGRID ? 256 : 384, GY = SMALLGRID ? 176 : 256, GZ = SMALLGRID ? 40 : 48, TX = 8, TY = SMALLGRID ? 5 : 6, AW = GX * TX, AH = GY * TY;
const LX = 128, LY = 88, LZ = 32, LTX = 8, LTY = 4, LAW = LX * LTX, LAH = LY * LTY;
const VOX = (2 * XH / GX) * ((SURF - Y0) / GY) * (2 * ZH / GZ);
// pigments: absorbance per unit optical depth (R,G,B). Chosen so mixtures keep hue windows.
const INKS = [
  { zh: '藍', en: 'indigo', ab: [1.1, .94, .74], ui: '#2a3f71' },
  { zh: '臙脂', en: 'carmine', ab: [.42, 1.1, .86], ui: '#b9233c' },
  { zh: '藤黃', en: 'gamboge', ab: [.17, .47, 1.1], ui: '#d7a028' },
  { zh: '墨', en: 'sumi', ab: [1.0, .96, .9], ui: '#2a2a2e' },
  { zh: '青', en: 'viridian', ab: [1.1, .6, .65], ui: '#1e6e5f' },
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
 v+=hash3(p*91.+t)*(.008+.0016*min(age,30.));
 p+=v*dt;
 p.y=clamp(p.y,${(Y0 + .006).toFixed(3)},${(SURF - .004).toFixed(3)});
 p.x=clamp(p.x,${(-XH + .01).toFixed(3)},${(XH - .01).toFixed(3)});p.z=clamp(p.z,${(-ZH + .01).toFixed(3)},${(ZH - .01).toFixed(3)});
 o=vec4(p,P.w+dt);}`);

log('UPD compiled');
// ---------------- volume splat (tracers -> z-slice atlas, two slices with linear weights)
const VSPL = prog(`#version 300 es
#define HZ ${(+(Q.get('hz') || (LOW ? 2 : 6))).toFixed(2)}
precision highp float;precision highp sampler2D;uniform sampler2D pos,col;uniform int tw,rows;uniform float amt,fade[${SLOTS}],entF[${SLOTS}];uniform vec3 entAb[${SLOTS}];out vec3 ab;
void main(){ivec2 ij=ivec2(gl_VertexID%tw,gl_VertexID/tw);vec4 P=texelFetch(pos,ij,0);vec4 C=texelFetch(col,ij,0);
 int sl=min(ij.y/rows,${SLOTS - 1});float f=fade[sl];
 float hsel=fract(sin(float(ij.x*131+ij.y*977)*.0137)*43758.5453);float en=hsel<entF[sl]?smoothstep(.05,.65,P.w)*smoothstep(entF[sl],entF[sl]*.6,hsel):0.;C.rgb=mix(C.rgb,entAb[sl],en);
 vec3 g=(P.xyz-vec3(${-XH},${Y0},${-ZH}))/vec3(${2 * XH},${(SURF - Y0).toFixed(4)},${2 * ZH})*vec3(${GX},${GY},${GZ});
 float gz=g.z-.5;float iz=floor(gz)+float(gl_InstanceID);float w=gl_InstanceID==0?1.-fract(gz):fract(gz);
 if(P.y<-50.||C.a<.01||f<=0.||iz<0.||iz>${GZ - 1}.){gl_Position=vec4(2,2,2,1);gl_PointSize=1.;ab=vec3(0);return;}
 vec2 tile=vec2(mod(iz,${TX}.),floor(iz/${TX}.));vec2 px=tile*vec2(${GX},${GY})+clamp(g.xy,vec2(.5),vec2(${GX - .5},${GY - .5}));
 gl_Position=vec4(px/vec2(${AW},${AH})*2.-1.,0,1);bool hz=(ij.x*7+ij.y*3)%10<3;float ps=hz?mix(2.,HZ,smoothstep(1.5,16.,P.w)):2.;gl_PointSize=ps;
 ab=C.rgb*1.6*C.a*amt*f*w*min(1.,P.w*5.)*mix(1.,.38,smoothstep(3.,22.,P.w))*4./(ps*ps);}`, `#version 300 es
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
vec3 tmOD(vec3 od){float m=max(od.r,max(od.g,od.b));return od/(1.+m/${(+(Q.get("cap")||5.5)).toFixed(2)});}
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
precision highp float;precision highp sampler2D;uniform sampler2D pos,col;uniform mat4 VP;uniform int tw,rows;uniform float ps,amt,fade[${SLOTS}],entF[${SLOTS}];uniform vec3 entAb[${SLOTS}];out vec3 ab;
void main(){ivec2 ij=ivec2(gl_VertexID%tw,gl_VertexID/tw);vec4 P=texelFetch(pos,ij,0);vec4 C=texelFetch(col,ij,0);
 int sl=min(ij.y/rows,${SLOTS - 1});float f=fade[sl];
 float hsel=fract(sin(float(ij.x*131+ij.y*977)*.0137)*43758.5453);float en=hsel<entF[sl]?smoothstep(.05,.65,P.w)*smoothstep(entF[sl],entF[sl]*.6,hsel):0.;C.rgb=mix(C.rgb,entAb[sl],en);
 if(P.y<-50.||C.a<.01||f<=0.){gl_Position=vec4(2,2,2,1);gl_PointSize=1.;ab=vec3(0);return;}
 vec4 cp=VP*vec4(P.xyz,1.);gl_Position=cp;gl_PointSize=ps;ab=C.rgb*1.6*C.a*amt*f*smoothstep(2.8,5.,P.w)*mix(1.,.4,smoothstep(8.,24.,P.w));}`, `#version 300 es
precision highp float;in vec3 ab;out vec4 o;void main(){vec2 d=gl_PointCoord*2.-1.;float r=dot(d,d);if(r>1.)discard;o=vec4(ab*exp(-r*2.6),1);}`);
const BLUR = prog(QVS, `#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D s;uniform vec2 d;
void main(){float w[5]=float[](.227,.194,.121,.054,.016);vec4 a=texture(s,uv)*w[0];for(int i=1;i<5;i++)a+=(texture(s,uv+d*float(i))+texture(s,uv-d*float(i)))*w[i];o=a;}`);

// ---------------- the scene: tank, water, dye volume, TIR surface, floor, backdrop
const SCENE = prog(QVS, `#version 300 es
precision highp float;precision highp sampler2D;in vec2 uv;out vec4 o;
uniform sampler2D D,LT,SD,SB;uniform vec2 res;uniform float t,KA,KS,salt,thr;uniform vec3 eye,cf,cr,cu,Ld;uniform float tanF;
uniform vec4 rip[4];uniform vec4 pour[2];uniform vec3 ib0,ib1;uniform vec4 pip;uniform vec3 pipAb;uniform float pipOn;uniform vec4 bds[4];uniform vec3 bdAb[4];
${SAMPLE_GLSL}
#define INK_VOL ${OPT.ink === 'vol' ? 1 : 0}
#define TANK ${OPT.tank ? 1 : 0}
#define WVE ${(+(Q.get('wve') || .45)).toFixed(2)}
#define CROWNWALL ${Q.has('crownwall') ? 1 : 0}
#define AAW ${LOW ? '.028' : '.010'}
float h1(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
vec2 box(vec3 ro,vec3 rd,vec3 a,vec3 b){vec3 i=1./rd;vec3 t0=(a-ro)*i,t1=(b-ro)*i;vec3 mn=min(t0,t1),mx=max(t0,t1);return vec2(max(max(mn.x,mn.y),mn.z),min(min(mx.x,mx.y),mx.z));}
const vec3 LCOL=vec3(1.0,.955,.89);
// studio sweep behind the tank: the light source. Falls off to warm grey at the edges.
vec3 sweep(vec3 ro,vec3 rd){float tt=(-2.4-ro.z)/min(rd.z,-1e-3);vec3 p=ro+rd*tt;
 // a softbox behind the tank: the tank is the brightest object, the studio falls to deep warm grey around it
 float sb=exp(-pow(abs(p.x)/2.6,5.)-pow(abs(p.y-1.30)/1.25,5.));float r=length(vec2(p.x*.40,(p.y-1.40)*.60));
 float L=1.24*sb*(.84+.16*exp(-r*r*2.))+.03*exp(-r*r*.25);
 vec3 c=LCOL*L;c=mix(c,vec3(.40,.31,.24)*L,(1.-sb)*.7);return c;}
vec3 room(vec3 rd){return mix(vec3(.030,.026,.023),vec3(.085,.072,.062),smoothstep(-.3,.6,rd.y));}
vec3 tableCol(vec3 p,vec3 ro){float g=n2(vec2(p.x*1.4,p.z*9.)+n2(p.xz*vec2(.6,3.))*3.);vec3 c=mix(vec3(.085,.07,.06),vec3(.14,.115,.095),g);
 // soft light pool from the sweep and tank shadow toward the viewer
 float pool=exp(-pow(p.x*.42,4.))*smoothstep(2.6,${ZH.toFixed(3)},p.z);c*=.35+1.5*pool;
 // caustic light thrown through the water onto the table in front of the tank
 float cz=smoothstep(${ZH.toFixed(3)},${(ZH + .15).toFixed(3)},p.z)*smoothstep(${(ZH + 1.3).toFixed(3)},${(ZH + .3).toFixed(3)},p.z)*smoothstep(${(XH + .1).toFixed(3)},${(XH - .3).toFixed(3)},abs(p.x));
 vec2 wq=p.xz+.35*vec2(n2(p.xz*1.7+t*.05),n2(p.xz*1.7+5.3-t*.04))-.17;float c2=n2(wq*vec2(5.,8.)+vec2(t*.2,t*.08))+n2(wq*vec2(8.,5.5)-vec2(t*.14,-t*.16));
 float caus=pow(max(0.,1.-abs(c2-1.)*1.15),2.5)*smoothstep(.25,.75,n2(p.xz*vec2(1.3,2.4)+3.1));
 c+=vec3(1.,.82,.58)*caus*cz*.10;
 float shd=smoothstep(.0,.45,abs(p.x)-${XH})+smoothstep(${ZH},${ZH + 1.6},p.z)*.6;c*=mix(.62,1.,clamp(shd,0.,1.));return c;}
vec3 floorCol(vec3 p){vec3 Lt=sampleL(LT,p+vec3(0,.012,0));float g=n2(p.xz*vec2(14.,14.))*.04;vec3 base=vec3(.40,.385,.36)-g;
 float lit=.55+.45*exp(-pow(p.x*.32,2.));return base*(LCOL*.95*Lt*lit+vec3(.12,.12,.13));}
float cosw(float e){return sqrt(max(0.,1.-e*e));}
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
           nd=normalize(nd+vec3(rp*.03,0,rp*.03));refl*=clamp(1.+rp*1.6,.55,1.7);}
         else {bgc=LCOL*1.05;break;} }
#if TANK
       else if(fr&&d2.z>0.){bgc=room(d2)*.6;break;}
       else if(flo){bgc=floorCol(pe2);break;}
#else
       else if(flo){bgc=sweep(pe2,d2);break;}
#endif
       else if(bk){float vx=abs(pe2.x)/${XH.toFixed(3)},vy=(pe2.y-${((SURF + Y0) / 2).toFixed(3)})/${((SURF - Y0) / 2).toFixed(3)};float wv=mix(WVE,1.,exp(-pow(vx/.66,2.4)-pow(abs(vy)/.88,3.)));
         float ce=smoothstep(0.,AAW,${XH.toFixed(3)}-abs(pe2.x));bgc=mix(room(d2)*1.3+sweep(pe2,d2)*.07,sweep(pe2,d2)*wv*vec3(1.,.975,.94),ce);break;}
       else if(sd){float ce=smoothstep(AAW,0.,pe2.z+${ZH.toFixed(3)});bgc=mix(room(d2)*1.3+sweep(pe2,d2)*.07,sweep(pe2,d2)*.58*vec3(1.,.975,.94),ce);break;}
       else {bgc=room(d2);break;}
       if(tir){refl*=.9;o2=pe2;d2=nd;vec2 h2=box(o2-d2*.002,d2,wa,wb);tEnd=max(h2.y-.002,0.);if(sg==2)bgc=room(d2)*.7;}
     }
     bgc*=refl;
     // salt layer shimmer (Schlieren line)
     if(salt>0.){float tA=max(hw.x,0.),tB=hw.y;vec3 pa=ro+rd*tA,pb=ro+rd*tB;float ya=pa.y-salt,yb=pb.y-salt;
       float fb=(ya<0.&&yb<0.)?1.:((ya>=0.&&yb>=0.)?0.:(ya<0.?ya/(ya-yb):yb/(yb-ya)));float Lb=fb*(tB-tA);
       bgc=mix(bgc,bgc*vec3(.93,.96,1.)+vec3(.05,.055,.06),clamp(Lb*.6,0.,.55)); // brine is faintly milky
       float ts=(salt-ro.y)/rd.y;if(ts>tA&&ts<tB){vec3 ps=ro+rd*ts;float sn=n2(ps.xz*vec2(6.,20.)+vec2(t*.12,t*.05));float gz=exp(-abs(rd.y)*22.);bgc*=1.+(.12+.7*gz)*(sn-.38);}
       float dl=abs(p0.y-salt);if(abs(p0.z-${ZH})<.003)bgc*=1.+.35*exp(-dl*dl/.00002)-.18*exp(-pow((p0.y-salt+.006)/.004,2.));}
     // poured brine: a falling schlieren plume with glinting crystals, spreading over the floor
     for(int i=0;i<2;i++){vec4 Pq=pour[i];if(Pq.w<=0.)continue;float a=t-Pq.z;if(a<0.||a>4.)continue;
       vec2 o2=ro.xz-Pq.xy;vec2 d2=rd.xz;float tt=-dot(o2,d2)/max(dot(d2,d2),1e-6);float b=length(o2+d2*tt);float y=ro.y+rd.y*tt;
       float head=max(${SURF}-a*1.6,${Y0});float fade=1.-smoothstep(1.6,4.,a);
       float wdt=.03+.10*(${SURF}-y)*Pq.w;float m=step(head,y)*step(y,${SURF})*exp(-b*b/(wdt*wdt));
       float nn=n2(vec2(b*70.,y*34.+a*26.))+.5*n2(vec2(b*150.,y*80.-a*40.));
       bgc*=1.+m*fade*(.9*(nn-.72));bgc=mix(bgc,vec3(.95,.97,1.)*1.05,m*fade*.16);
       float sp=h1(floor(vec2(b*240.*sign(dot(o2+d2*tt,vec2(1,.3)))+.5,y*160.+a*90.)));if(sp>.975&&m>.25)bgc+=vec3(.9)*fade*m;
       float fl=step(${Y0}+.001,head+.001)*smoothstep(.6,1.3,a);float tf=(${Y0 + .03}-ro.y)/rd.y;
       if(fl>0.&&tf>max(hw.x,0.)){vec3 pf=ro+rd*tf;float rr=length(pf.xz-Pq.xy);float R2=.15+.5*(a-.9)*Pq.w;bgc*=1.+.12*fl*fade*smoothstep(R2,R2-.12,rr)*(n2(pf.xz*24.+a)-.45);}}
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
   col=mix(col,col*vec3(.55,.65,.62),edge*.35);
   col+=vec3(.9,.94,.92)*edgeHi*.75;
 } else {
   if(TANK==1&&rd.y<0.){float tt=(${Y0 - SLAB}-ro.y)/rd.y;vec3 p=ro+rd*tt;col=tableCol(p,ro);}
   else col=sweep(ro,rd);
 }
#if !INK_VOL
 { vec4 Ds=texture(SD,uv)*.42+texture(SB,uv)*.58; vec3 T=exp(-tmOD(Ds.rgb));col=col*T+(1.-T)*vec3(.10,.10,.115)*.4; }
#endif
 if(thr>0.){vec4 a=texture(SD,uv),b=texture(SB,uv);vec3 hp=max(a.rgb-b.rgb,vec3(0))*thr;col*=exp(-tmOD(hp));}
 // crown splash (V5): short-lived (<0.3 s), narrow, mostly clear water wall with a bright specular rim; beads fly a little longer
 for(int i=0;i<4;i++){vec4 Rr=rip[i];if(Rr.z<=0.)continue;float a=t-Rr.y;if(a<0.||a>.55)continue;
   float ac=min(a,.28);float rc=.025+.20*sqrt(ac)*Rr.z;float hc=.10*Rr.z*sin(3.1416*min(a/.28,1.));
   vec2 o2=ro.xz-Rr.xw;vec2 d2=rd.xz;float A=dot(d2,d2),Bq=dot(o2,d2),C=dot(o2,o2)-rc*rc;float h=Bq*Bq-A*C;
   if(CROWNWALL==1&&h>0.&&a<.28)for(int s=0;s<2;s++){float tt=(-Bq+(s==0?-1.:1.)*sqrt(h))/A;vec3 p=ro+rd*tt;float th=atan(p.z-Rr.w,p.x-Rr.x);
     float tp=${SURF}+hc*(.78+.22*cos(th*11.+Rr.y*7.));
     if(p.y>${SURF - .003}&&p.y<tp){float k=(1.-a/.28)*(s==0?1.:.5);
       float rim=exp(-pow((tp-p.y)/.0035,2.));float wall=smoothstep(${SURF.toFixed(3)},tp,p.y);
       col=mix(col,col*.9,k*.25*wall);col+=vec3(1.,.99,.96)*rim*k*.9*(.7+.3*sin(th*11.+1.));}}
   // spray beads at the scallop tips: small bright specular droplets
   float hb=.10*Rr.z;float rb=.025+.20*sqrt(.28)*Rr.z;
   for(int j=0;j<11;j++){float th=float(j)*.5712+Rr.y*7.+.3*sin(float(j)*3.7);float rr=rb*(1.+a*1.1);vec3 c=vec3(Rr.x+cos(th)*rr,${SURF}+hb*1.1+(.5+.25*fract(float(j)*.618))*a-2.2*a*a,Rr.w+sin(th)*rr);
     vec3 oc=ro-c;float bb=dot(oc,rd);float r=.009*Rr.z;float hh=bb*bb-dot(oc,oc)+r*r;if(hh>0.&&c.y>${SURF}){float e=sqrt(hh)/r;col=mix(col,col*.55,.6*(1.-a/.55));col+=vec3(1.,.98,.95)*pow(e,6.)*.9*(1.-a/.55);}}
 }
 // glass pipette (analytic, closest approach to its vertical axis): clear glass with bright rims, a coloured ink column
 // lit from the softbox, a short rubber bulb on top. Short enough to stay inside the frame at every camera distance.
 if(pipOn>0.){vec2 o2=ro.xz-pip.xy;vec2 d2=rd.xz;float tt=-dot(o2,d2)/max(dot(d2,d2),1e-6);
   float b=length(o2+d2*tt);float y=ro.y+rd.y*tt;float ty=pip.z;float u=y-ty;
   float R=u<0.?0.:(u<.07?mix(.005,.024,smoothstep(0.,1.,u/.07)):(u<.175?.024:0.));
   float Rb=(u>.165&&u<.24)?.029*sqrt(max(0.,1.-pow((u-.2025)/.0375,2.))):0.;
   if(Rb>0.&&b<Rb&&tt>0.){float e=b/Rb;vec3 g=vec3(.10,.035,.03)*(.55+.45*sqrt(max(0.,1.-e*e)))+vec3(.5,.3,.25)*exp(-pow((e-.45)/.12,2.))*.35;col=mix(col,g,pipOn);}
   else if(R>0.&&b<R&&tt>0.){float e=b/R;
     vec3 g=col*.93+vec3(.03);
     float ri=R*.72;if(b<ri&&u<.125){float ch=2.*sqrt(ri*ri-b*b)/ri;vec3 T=exp(-pipAb*(.35+.8*ch));g=g*T+LCOL*T*.42*(.4+.6*smoothstep(.2,1.,cosw(e)));}
     g+=vec3(1.,.97,.92)*(pow(e,10.)*.75+exp(-pow((e+.35)/.12,2.))*.0+exp(-pow((e-.55)/.06,2.))*.28)*(q.x<0.?1.:.8);
     g*=1.-.35*smoothstep(.86,1.,e);g+=vec3(.9,.95,1.)*pow(e,40.)*.6;
     col=mix(col,g,pipOn);}}
 // ink beads: the swelling bead at the tip and falling beads (absorbing spheres with a highlight)
 for(int i=0;i<4;i++){vec4 B=bds[i];if(B.w<=0.)continue;vec3 oc=ro-B.xyz;float bb=dot(oc,rd);float h=bb*bb-dot(oc,oc)+B.w*B.w;if(h<0.)continue;float tt=-bb-sqrt(h);if(tt<0.)continue;
   vec3 n=normalize(oc+rd*tt);float th=2.*sqrt(h);vec3 g=col*exp(-bdAb[i]*min(th*95.,10.));
   g+=vec3(1.,.97,.92)*(pow(max(dot(reflect(rd,n),normalize(vec3(-.3,.6,.75))),0.),40.)*.9+pow(1.-abs(dot(n,rd)),4.)*.3);col=g;}
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
// V4 lantern framing: the whole tank is the hero object, a glowing box in a dark studio.
// The camera never follows the ink (so it can't drift or cut a bloom): it fits the tank + pipette headroom + table pool,
// symmetric, tank ≈ 75–78 % of the frame width on 16:9, and eases in from a slightly wider opening.
const FRAME = { bot: Y0 - SLAB - +(Q.get('fb') || .02), top: RIM + +(Q.get('ft') || .15), wfrac: +(Q.get('wfrac') || .86), hfrac: +(Q.get('hf') || .985) };
function camTarget(wide, nopush) {
  const tf = Math.tan(FOV / 2), asp = W / H, zf = ZH + GT;
  const Dw = (XH + GT) / (FRAME.wfrac * tf * asp), Dh = (FRAME.top - FRAME.bot) * .5 / (FRAME.hfrac * tf);
  const D = Math.max(Dw, Dh) * (wide ? 1.13 : 1); const y0 = (FRAME.top + FRAME.bot) * .5;
  // V7 late push-in: once the umbrella has formed (passive hero only), ease in on the chandelier + brine horizon;
  // capped so the glass edges / lantern glow stay in frame-ish. Any click/drag keeps the fixed lantern framing.
  const pf = PUSH * smooth(PUSH_T0, PUSH_T0 + 5, time) * (interacted && !SHOT ? 0 : 1) * (haveInkTop ? 1 : 0);
  if (pf <= 0 || nopush) return { y: y0, x: 0, d: D + zf };
  const top = SURF + .04, bot = Math.max(Y0 + .12, lowY - .1, OPT.salt > 0 ? salt.h - .2 : 0), Dc = (top - bot) * .5 / (.95 * tf), yc = (top + bot) * .5;
  const Dp = Math.max(D * (1 - PUSH_MAX), Math.min(D, Dc));
  return { y: y0 + (yc - y0) * pf, x: 0, d: D + (Dp - D) * pf + zf };
}
function camPushed() { return PUSH * smooth(PUSH_T0, PUSH_T0 + 5, time) * (interacted && !SHOT ? 0 : 1) * (haveInkTop ? 1 : 0) > .001; }
function stepCam(dt) { if (dropCount > 0 && time > 2) haveInkTop = true; const T = camTarget(time < 1.2 && !SHOT_HERO_SKIP); const k = .9, z = 2 * Math.sqrt(k);
  for (const [a, b] of [['y', 'vy'], ['x', 'vx'], ['d', 'vd']]) { const acc = k * (T[a] - cam[a]) - z * cam[b]; cam[b] += acc * dt; cam[a] += cam[b] * dt; } }
const SHOT_HERO_SKIP = false; const PUSH = Q.has('push') ? +Q.get('push') : 1, PUSH_T0 = +(Q.get("pusht") || 12), PUSH_MAX = +(Q.get('pushmax') || .32); let haveInkTop = false;
let EYE, CF, CR, CU, VP;
function persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]; }
function lookAt(e, c, u) { const z = nrm(sub(e, c)), x = nrm(cross(u, z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]; }
function mm(a, b) { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return r; }
function updCam() { const e = [cam.x + cam.px * .04, cam.y + .30 + cam.py * .02, cam.d]; const c = [0, cam.y - .03, 0];
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
    if (stirs.length) { // the stir's shear tilts and excites the ring, so bells bend and break up under the brush
      const pu = mul(r.u, r.R), pv = mul(r.v, r.R);
      const d1 = sub(stirVel(add(r.c, pu)), stirVel(sub(r.c, pu))), d2 = sub(stirVel(add(r.c, pv)), stirVel(sub(r.c, pv)));
      const w = mul(add(cross(r.u, d1), cross(r.v, d2)), .9 / (2 * r.R + .02));
      r.n = nrm(add(r.n, mul(cross(w, r.n), dt))); r.u = nrm(add(r.u, mul(cross(w, r.u), dt))); r.u = nrm(sub(r.u, mul(r.n, dot(r.u, r.n)))); r.v = cross(r.n, r.u);
      r.amp += (len(d1) + len(d2)) * dt * .25 * r.R; }
    r.c = add(r.c, mul(v, dt));
    r.R += dt * U * (PR.grow * r.sig + (1 - wk) * .9); r.a = Math.min(r.a + dt * .002, r.R * .4);
    r.G *= Math.exp(-dt * (PR.gd0 + PR.gd1 * r.gen + (1 - wk) * .35));
    r.amp *= Math.exp((1.15 + .3 * r.gen) * dt * r.sig * (.3 + .7 * wk)); r.age += dt;
    if (r.gen < 3 && r.amp > r.R * .42) split(r);
    if (r.gen === 3 && r.age > 4) r.G *= Math.exp(-dt * .6);
    if (r.G < .0015) r.alive = false;
    if (r.alive) { lowY = Math.min(lowY, r.c[1] - r.R * .6); ibAdd(r.c, r.R + .35); }
  }
  { const al = rings.filter(r => r.alive), ex = al.length - (MAXR - 24); for (let i = 0; i < ex; i++) al[i].G *= Math.exp(-dt * 2.2); }
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
  live.forEach((r, i) => { ringBuf.set([r.c[0], r.c[1], r.c[2], r.R + r.amp], i * 4); ringBuf.set([r.G, r.a * .55, Math.min(1, r.amp / (r.R * .42)), r.R], (MAXR + i) * 4); ringBuf.set([r.n[0], r.n[1], r.n[2], r.k], (2 * MAXR + i) * 4); ringBuf.set([r.u[0], r.u[1], r.u[2], r.ph], (3 * MAXR + i) * 4); ringBuf.set([r.age, r.slot < 0 ? 0 : r.gen, 0, 0], (4 * MAXR + i) * 4); nodes(r).forEach((q, s) => segBuf.set([q[0], q[1], q[2], 0], (i * SEGS + s) * 4)); });
  gl.bindTexture(gl.TEXTURE_2D, ringT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXR, 5, gl.RGBA, gl.FLOAT, ringBuf);
  gl.bindTexture(gl.TEXTURE_2D, segT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXR * SEGS, 1, gl.RGBA, gl.FLOAT, segBuf); return live.length; }

// ---------------- drops
const recentDrops = [], ENTRAIN = +(Q.get('entrain') || .75); const entF = new Float32Array(SLOTS), entAb = new Float32Array(SLOTS * 3);
let dropCount = 0; const slotFade = new Float32Array(SLOTS); const slotTarget = new Float32Array(SLOTS);
const ripples = [];
function spawn(x, z, inkIdx, size, slot, sp) {
  // slot was assigned at release; if it still holds an older drop, bake that drop into the tank memory first (never block)
  if (slotFade[slot] > .001) bakeSlot(slot);
  dropCount++; sp = clamp(sp || 1, .55, 1.5);
  rings.forEach(r => { if (r.slot === slot) r.alive = false; });
  // per-drop variation: entry speed (drop height) -> tighter, stronger ring; random lobe count, tilt and asymmetry
  const R0 = .080 * size * (1.18 - .18 * sp) * (.92 + .16 * rnd()), G = .062 * size * Math.pow(sp, .85) * (.9 + .2 * rnd()); const c = [x, SURF - .10, z];
  const ink = INKS[inkIdx];
  // entrainment: a drop that falls through an earlier drop's dyed column (same x within ~.2, < 20 s ago) sweeps that stained
  // wake fluid into its own ring, so part of its tracers carry the earlier pigment; the mix is then rendered subtractively
  let prev = null, ent = 0; for (const d of recentDrops) { if (d.ink === inkIdx) continue; const a = time - d.t, dl = Math.hypot(d.x - x, d.z - z);
    const w = ENTRAIN * Math.max(0, 1 - dl / .22) * (1 - .62 * smooth(3, 22, a)) * Math.exp(-a / 45) * smooth(.3, 2.5, a); if (w > ent) { ent = w; prev = d; } }
  entF[slot] = ent; if (prev) entAb.set(INKS[prev.ink].ab.map(v => v / 1.6), slot * 3);
  recentDrops.push({ x, z, ink: inkIdx, t: time }); if (recentDrops.length > 8) recentDrops.shift();
  const kk = 4 + Math.min(3, Math.floor(rnd() * 3.2 + (size - 1) * 2.2)); const tn = nrm([gauss() * .13, -1, gauss() * .09]);
  const r0 = newRing(c, tn, R0, G, 0, kk, slot); r0.amp *= 1 + rnd() * 3; r0.sig *= .85 + .3 * rnd(); rings.push(r0);
  const rows = ROWS(), n = rows * TW, P = new Float32Array(n * 4), C = new Uint8Array(n * 4);
  const fil = { a: .018 + .02 * rnd(), kx: 4 + 5 * rnd(), kz: 3 + 5 * rnd(), px: rnd() * 6.3, pz: rnd() * 6.3, bk: 38 + 30 * rnd(), p0: rnd() * 6.3, sg: rnd() < .5 ? -1 : 1 }; fil.kx = 1.5 + 3 * rnd(); fil.kz = 1.5 + 3 * rnd();
  for (let i = 0; i < n; i++) { let p; const f = rnd();
    if (f < .82) { const th = rnd() * 6.283, cr = Math.abs(gauss()) * R0 * .30, ph = rnd() * 6.283; const rr = R0 + cr * Math.cos(ph); p = [x + rr * Math.cos(th), c[1] + cr * Math.sin(ph), z + rr * Math.sin(th)]; }
    else if (f < .885) { // thin wavering, beading filament instead of a carrot: constant thin core, lateral wave growing upward, density beads
      let yy = 0; for (let tries = 0; tries < 6; tries++) { yy = c[1] + Math.pow(rnd(), 1.25) * (SURF - c[1]); const bdn = .5 + .5 * Math.sin((yy - c[1]) * fil.bk + fil.p0); const uu = (yy - c[1]) / (SURF - c[1]); if (rnd() < (.22 + .78 * bdn * bdn) * (1 - smooth(.45, 1, uu) * .85)) break; }
      const u = (yy - c[1]) / (SURF - c[1]); const A = fil.a * fil.sg * u * (1 - u) * 3.2; const sp = .0016 * size * (1 + .8 * u);
      p = [x + A * Math.sin(u * fil.kx + fil.px) + gauss() * sp, yy, z + A * .7 * Math.cos(u * fil.kz + fil.pz) + gauss() * sp]; }
    else { const r = Math.cbrt(rnd()) * R0 * 1.05, th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1); p = [x + r * Math.sin(ph) * Math.cos(th), c[1] + r * Math.cos(ph) * .6, z + r * Math.sin(ph) * Math.sin(th)]; }
    P[i * 4] = p[0]; P[i * 4 + 1] = p[1]; P[i * 4 + 2] = p[2]; P[i * 4 + 3] = 0;
    const k = .5 + .5 * rnd(); C[i * 4] = ink.ab[0] / 1.6 * 255; C[i * 4 + 1] = ink.ab[1] / 1.6 * 255; C[i * 4 + 2] = ink.ab[2] / 1.6 * 255; C[i * 4 + 3] = k * 255 | 0; }
  for (const t of posT) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, slot * rows, TW, rows, gl.RGBA, gl.FLOAT, P); }
  gl.bindTexture(gl.TEXTURE_2D, colT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, slot * rows, TW, rows, gl.RGBA, gl.UNSIGNED_BYTE, C);
  slotFade[slot] = 1; slotTarget[slot] = 1;
  ripples.push({ x, z, t: time, a: .9 * size }); if (ripples.length > 4) ripples.shift();
  if (!haveInk) { haveInk = true; } sfx.drip(size);
}
const falling = []; const TIPY = SURF + .10; const AUTO2 = +(Q.get('auto2') || 8), HS1 = +(Q.get('hs1') || 1.6), HS2 = +(Q.get('hs2') || 1.1);
// the pipette: follows the cursor above the water; its height (from the cursor height) sets the drop's entry speed
const BEADR = .024; const pip = { x: -.12, z: 0, tip: TIPY, tipT: TIPY, on: 1, bead: .7, xT: -.12 };
const pipInk = () => pointer.ink; const pipClear = () => pointer.tool === 'salt';
function stepPip(dt) { pip.x += (pip.xT - pip.x) * Math.min(1, dt * 9); pip.tip += (pip.tipT - pip.tip) * Math.min(1, dt * 6);
  const want = pointer.down && !stirMode ? 1 + Math.min(pointer.hold, 1.3) * .55 : 1; pip.bead = Math.min(want, pip.bead + dt * (pip.bead < 1 ? 1.4 : .7)); }
// tank memory: before a drop slot is reused, its ink is baked into a persistent volume that keeps diffusing and slowly dilutes
function bakeSlot(slot) {
  if (OPT.ink !== 'vol' || slotFade[slot] <= .001) return;
  const f = new Float32Array(SLOTS); f[slot] = slotFade[slot];
  gl.bindFramebuffer(gl.FRAMEBUFFER, memF[mc]); gl.viewport(0, 0, AW, AH); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  gl.useProgram(VSPL); gl.bindVertexArray(emptyVao); bindTex(VSPL, 'pos', 0, posT[cur]); bindTex(VSPL, 'col', 1, colT);
  gl.uniform1i(VSPL.u.tw, TW); gl.uniform1i(VSPL.u.rows, ROWS()); gl.uniform1fv(VSPL.u.fade, f); gl.uniform1fv(VSPL.u.entF, entF); gl.uniform3fv(VSPL.u.entAb, entAb); gl.uniform1f(VSPL.u.amt, MASS / (ROWS() * TW) / VOX);
  gl.drawArraysInstanced(gl.POINTS, 0, TW * TW, 2); gl.disable(gl.BLEND); slotFade[slot] = 0;
}
function memTick(dt) {
  if (OPT.ink !== 'vol') return; memClock += dt; if (memClock < .4) return; memClock = 0;
  gl.bindFramebuffer(gl.FRAMEBUFFER, memF[1 - mc]); gl.viewport(0, 0, AW, AH); gl.useProgram(VBLUR); bindTex(VBLUR, 's', 0, memT[mc]);
  gl.uniform1i(VBLUR.u.axis, memAxis); gl.uniform1f(VBLUR.u.rad, .55); gl.uniform1f(VBLUR.u.k, .9965); drawQuad(VBLUR); mc = 1 - mc; memAxis = (memAxis + 1) % 3;
}
const salt = { h: 0, target: 0, pours: [] };
function pour(x, z, amt) { salt.pours.push({ x, z, t: time, a: amt }); if (salt.pours.length > 2) salt.pours.shift(); pip.bead = 0;
  salt.queue = (salt.queue || []); salt.queue.push({ t: time + 1.1, add: (salt.target > Y0 + .05 ? .3 : .78) * amt }); pip.x = pip.xT = x; sfx.pour(amt); saltUsed = true; saltEl && (saltEl.classList.add('pouring'), setTimeout(() => saltEl.classList.remove('pouring'), 900)); }
let saltUsed = false;
function stepSalt(dt) { if (salt.queue) for (let i = 0; i < salt.queue.length; i++) if (time >= salt.queue[i].t) { salt.target = Math.min(SURF - .75, Math.max(salt.target, Y0 + .04) + salt.queue[i].add); salt.queue.splice(i--, 1); }
  salt.h += (salt.target - salt.h) * Math.min(1, dt * .9); OPT.salt = salt.h > Y0 + .05 ? salt.h : 0; }
let releaseCount = 0;
// brush: a drag lays a thin ribbon of the current ink along the stroke (calligraphy). Tracers are written row by row into a slot.
const brush = { slot: -1, row: 0, n: 0, w: .002, last: [] };
// exit taper: when the stroke lifts, the last segments thin out (alpha 30 / 55 / 80 %) like a brush leaving the paper
function brushLift() { const L = brush.last; const k = [.8, .55, .3].slice(3 - L.length);
  L.forEach((sg, i) => { const C = sg.C; for (let j = 3; j < C.length; j += 4) C[j] = C[j] * k[i] | 0; gl.bindTexture(gl.TEXTURE_2D, colT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, sg.row0, TW, sg.nr, gl.RGBA, gl.UNSIGNED_BYTE, C); }); brush.last = []; }
function brushAdd(a, b, speed) {
  const rows = ROWS(); if (!TW) return;
  if (brush.slot < 0 || brush.row >= rows) { const slot = releaseCount++ % SLOTS; if (slotFade[slot] > .001) bakeSlot(slot); rings.forEach(r => { if (r.slot === slot) r.alive = false; });
    brush.slot = slot; brush.row = 0; entF[slot] = 0; const P = new Float32Array(rows * TW * 4).fill(-99), C = new Uint8Array(rows * TW * 4);
    for (const t of posT) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, slot * rows, TW, rows, gl.RGBA, gl.FLOAT, P); }
    gl.bindTexture(gl.TEXTURE_2D, colT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, slot * rows, TW, rows, gl.RGBA, gl.UNSIGNED_BYTE, C); slotFade[slot] = 1; slotTarget[slot] = 1; }
  const nr = Math.min(rows - brush.row, 2), n = nr * TW, P = new Float32Array(n * 4), C = new Uint8Array(n * 4); const ink = INKS[pointer.ink];
  const ya = clamp(a[1], Y0 + .05, SURF - .02), yb = clamp(b[1], Y0 + .05, SURF - .02);
  // calligraphy: slow = wide and wet, fast = thin and dry; the stroke starts thin (entry taper); soft gaussian core + faint halo
  const spd = clamp(+(speed || .6), .05, 3), w0 = brush.w, w1 = (.004 + .032 / (1 + spd * 3)) * (SMALLGRID ? 1.6 : 1) * smooth(0, SMALLGRID ? 4 : 3, brush.n + 1);
  // dry-brush break along the stroke: on fast strokes some segments run dry (gaps that read at any grid resolution)
  const segDry = spd > .6 ? clamp(.15 + .85 * Math.pow(rnd(), .6 + spd * .5), 0, 1) : 1;
  if (!brush.br || brush.n === 0) brush.br = Array.from({ length: 16 }, () => .15 + .85 * rnd()); const dryness = smooth(.7, 2.4, spd) * .9; brush.w = w1; brush.n++;
  const wet = clamp(.9 / (.3 + spd), .6, 1.5); const dx = b[0] - a[0], dy = yb - ya, dl = Math.hypot(dx, dy) + 1e-6, nx = -dy / dl, ny = dx / dl;
  for (let i = 0; i < n; i++) { const f = rnd(); const x = a[0] + dx * f, y = ya + dy * f; const wdt = w0 + (w1 - w0) * f; const halo = rnd() < .3;
    const off = gauss() * wdt * (halo ? 2.6 : 1), al = gauss() * .002; const bk = brush.br[clamp(Math.floor((off / (wdt + 1e-6) + 3) * 2.5), 0, 15)]; // bristle streaks: fast strokes break into flying-white 飛白
    const dry = (halo ? .25 : (.55 + .45 * rnd()) * (1 - .5 * Math.max(0, Math.abs(off) / (wdt * 2.2) - .3))) * (1 - dryness + dryness * bk * bk);
    P.set([clamp(x + nx * off + dx / dl * al, -XH + .02, XH - .02), y + ny * off + dy / dl * al, gauss() * (halo ? .02 : .009), 0], i * 4);
    const gap = dryness > .2 && Math.sin(f * 6.283 * (1.5 + 2 * brush.br[0]) + brush.n * 1.7) > .55 ? .12 : 1;
    C.set([ink.ab[0] / 1.6 * 255, ink.ab[1] / 1.6 * 255, ink.ab[2] / 1.6 * 255, clamp(dry * wet * 1.05 * segDry * gap, .02, 1) * 255 | 0], i * 4); }
  const row0 = brush.slot * rows + brush.row;
  for (const t of posT) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, row0, TW, nr, gl.RGBA, gl.FLOAT, P); }
  gl.bindTexture(gl.TEXTURE_2D, colT); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, row0, TW, nr, gl.RGBA, gl.UNSIGNED_BYTE, C); brush.row += nr; brush.last.push({ row0, nr, C }); if (brush.last.length > 3) brush.last.shift();
  ibAdd([a[0], a[1], 0], .3); ibAdd([b[0], b[1], 0], .3); haveInk = true;
}
// the slot is assigned at release time, so rapid clicks never wait on each other
function release(x, z, ink, size, h) { const slot = releaseCount++ % SLOTS; const y0 = h ? SURF + h : pip.tip; pip.x = pip.xT = x; pip.z = z; if (h) pip.tip = pip.tipT = y0; pip.bead = 0; falling.push({ x, z, ink, size, y: y0 - BEADR * size, v: 0, slot }); }
const VREF = Math.sqrt(2 * 3.4 * (TIPY - SURF - BEADR));
function stepFalling(dt) { stepPip(dt); stepSalt(dt); for (const f of falling) { f.v += 3.4 * dt; f.y -= f.v * dt; }
  for (let i = 0; i < falling.length; i++) { const f = falling[i]; if (f.y <= SURF) { falling.splice(i--, 1); spawn(f.x, f.z, f.ink, f.size, f.slot, f.v / VREF); } } }

function step(dt) {
  stepFalling(dt); autoStroke();
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
  gl.uniform1i(VSPL.u.tw, TW); gl.uniform1i(VSPL.u.rows, ROWS()); gl.uniform1fv(VSPL.u.fade, slotFade); gl.uniform1fv(VSPL.u.entF, entF); gl.uniform3fv(VSPL.u.entAb, entAb);
  gl.uniform1f(VSPL.u.amt, MASS / (ROWS() * TW) / VOX);
  gl.drawArraysInstanced(gl.POINTS, 0, TW * TW, 2);
  gl.useProgram(COPYK); bindTex(COPYK, 's', 0, memT[mc]); gl.uniform1f(COPYK.u.k, INKOFF ? 0 : 1); drawQuad(COPYK); gl.disable(gl.BLEND);
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
  gl.uniformMatrix4fv(SPL.u.VP, false, VP); gl.uniform1i(SPL.u.tw, TW); gl.uniform1i(SPL.u.rows, ROWS()); gl.uniform1fv(SPL.u.fade, slotFade); gl.uniform1fv(SPL.u.entF, entF); gl.uniform3fv(SPL.u.entAb, entAb);
  const ps = Math.max(1.3, 1.9 * H / 1080); gl.uniform1f(SPL.u.ps, ps);
  gl.uniform1f(SPL.u.amt, (65536 / (ROWS() * TW)) * Math.pow(H / 720 * 3.9 / Math.max(1, cam.d), 2) / Math.pow(ps / 1.37, 2) * .55);
  gl.drawArrays(gl.POINTS, 0, TW * TW); gl.disable(gl.BLEND);
  gl.viewport(0, 0, W >> 1, H >> 1); gl.useProgram(BLUR); gl.bindFramebuffer(gl.FRAMEBUFFER, stF); bindTex(BLUR, 's', 0, sdT); gl.uniform2f(BLUR.u.d, 2 / W, 0); drawQuad(BLUR);
  gl.bindFramebuffer(gl.FRAMEBUFFER, sbF); bindTex(BLUR, 's', 0, stT); gl.uniform2f(BLUR.u.d, 0, 2 / H); drawQuad(BLUR);
}
let pointer = { x: .5, y: .5, in: false, down: false, hold: 0, ink: 0 };
let volTick = 0; const INKOFF = SHOT && Q.has('inkoff'); // test only: same sim + camera, ink not drawn (empty reference for fill measurements)
function render() {
  updCam();
  volTick++; if (OPT.ink === 'vol' && +(Q.get('pskip') || 0) !== 2 && (TIER === 'high' || SHOT || volTick % (LOW ? 3 : 2) === 1)) renderVolume();
  if (OPT.ink !== 'vol' || OPT.thr > 0) renderSplat();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(SCENE);
  bindTex(SCENE, 'D', 0, volT[1]); bindTex(SCENE, 'LT', 1, litT); bindTex(SCENE, 'SD', 2, sdT); bindTex(SCENE, 'SB', 3, sbT);
  gl.uniform2f(SCENE.u.res, W, H); gl.uniform1f(SCENE.u.t, time); gl.uniform1f(SCENE.u.KA, KA); gl.uniform1f(SCENE.u.KS, KSC); gl.uniform3f(SCENE.u.ib0, IB[0], IB[1], IB[2]); gl.uniform3f(SCENE.u.ib1, IB[3], IB[4], IB[5]);
  gl.uniform1f(SCENE.u.salt, OPT.salt); { const pq = new Float32Array(8); salt.pours.forEach((q, i) => pq.set([q.x, q.z, q.t, q.a], i * 4)); gl.uniform4fv(SCENE.u.pour, pq); } gl.uniform1f(SCENE.u.thr, OPT.thr);
  gl.uniform3fv(SCENE.u.eye, EYE); gl.uniform3fv(SCENE.u.cf, CF); gl.uniform3fv(SCENE.u.cr, CR); gl.uniform3fv(SCENE.u.cu, CU); gl.uniform3fv(SCENE.u.Ld, LD);
  gl.uniform1f(SCENE.u.tanF, Math.tan(FOV / 2));
  const bd = new Float32Array(16), ba = new Float32Array(12); let nb = 0;
  const pAb = pipClear() ? [.02, .015, .01] : INKS[pipInk()].ab;
  if (pip.on > .01 && !pipClear()) { const r = BEADR * pip.bead; if (r > .002) { bd.set([pip.x, pip.tip - r * .85, pip.z, r], 0); ba.set(pAb, 0); nb = 1; } }
  for (let i = falling.length - 1; i >= 0 && nb < 4; i--) { const f = falling[i]; bd.set([f.x, f.y, f.z, BEADR * f.size], nb * 4); ba.set(INKS[f.ink].ab, nb * 3); nb++; }
  gl.uniform4fv(SCENE.u.bds, bd); gl.uniform3fv(SCENE.u.bdAb, ba);
  gl.uniform4f(SCENE.u.pip, pip.x, pip.z, pip.tip, 0); gl.uniform3fv(SCENE.u.pipAb, pAb); gl.uniform1f(SCENE.u.pipOn, pip.on);
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
  function noise(dur, f, q, a) { if (!ac || muted) return; const t = ac.currentTime, n = Math.ceil(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = b; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + dur * .3); g.gain.exponentialRampToValueAtTime(.0008, t + dur); s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .02); }
  let lastSw = 0; function swish(sp) { if (!ac) return; const t = ac.currentTime; if (t - lastSw < .12) return; lastSw = t; noise(.35, 300 + 500 * Math.min(sp, 3), 1.2, .05 + .03 * Math.min(sp, 2)); }
  function pour(a) { noise(1.2, 3800, 3, .035 * a); for (let i = 0; i < 6; i++) setTimeout(() => tone(1800 + Math.random() * 2400, .012, .25, 'sine'), 60 + Math.random() * 900); }
  return { init, drip, split, swish, pour, toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : .7; } };
})();

// ---------------- UI
let uiHover = false;
const inksEl = document.getElementById('inks');
INKS.forEach((k, i) => { const d = document.createElement('div'); d.className = 'ink' + (i === 0 ? ' on' : ''); d.innerHTML = `<i style="background:${k.ui}"></i><b>${k.zh} ${k.en}</b>`;
  d.addEventListener('pointerdown', e => { e.stopPropagation(); setInk(i); }); inksEl.insertBefore(d, document.getElementById('salt')); });
const saltEl = document.getElementById('salt');
// salt is a tool, not a switch: select it, then click (hold = more) to pour brine; it sinks and builds a dense layer from the floor up
function setSalt(on) { pointer.tool = on ? 'salt' : 'ink'; saltEl.classList.toggle('on', on); [...inksEl.querySelectorAll('.ink')].forEach((c, j) => c.classList.toggle('on', !on && j === pointer.ink)); }
saltEl.addEventListener('pointerdown', e => { e.stopPropagation(); setSalt(pointer.tool !== 'salt'); });
if (OPT.salt > 0) { salt.h = salt.target = OPT.salt; }
const SALT_DEFAULT = OPT.salt > 0 ? OPT.salt : 0;
function setInk(i) { pointer.ink = i; pointer.tool = 'ink'; saltEl.classList.remove('on'); [...inksEl.querySelectorAll('.ink')].forEach((c, j) => c.classList.toggle('on', j === i)); }
let lastVort = 0, curlSide = 1;
function stirStep(w, now) { if (!lastMove) { lastMove = { t: now, w }; return; } const dtm = Math.max(8, now - lastMove.t) / 1000;
      const v = [(w[0] - lastMove.w[0]) / dtm * .15, (w[1] - lastMove.w[1]) / dtm * .15, 0]; const vl = len(v); const vv = vl > .35 ? mul(v, .35 / vl) : v;
      const sl = len(sub(w, lastMove.w));
      if (sl > .04) { // one stir blob per brush segment (overlapping blobs used to sum to the pointer speed and drag the ribbon along)
        stirs.push({ p: w, v: mul(vv, .8), r: .22 }); if (stirs.length > MAXSTIR) stirs.shift(); brushAdd(lastMove.w, w, sl / dtm); sfx.swish(sl / dtm);
        if (now - lastVort > 110 && len(vv) > .05) { lastVort = now; const vr = newRing([w[0], w[1], 0], nrm([vv[0], vv[1], .0001]), .075, clamp(len(vv) * .012, .002, .005), 3, 0, -1); vr.amp = 0; if (!Q.has("novr")) rings.push(vr);
          // curl: a small ring whose axis lies across the stroke, alternating side, rolls the ribbon edge into a vortex
          if (!Q.has("nocurl")) { curlSide = -curlSide; const pn = nrm([-vv[1] * curlSide, vv[0] * curlSide, .25 * curlSide]); const cr = newRing([w[0] - pn[0] * .03, w[1] - pn[1] * .03, 0], pn, .035 + .02 * rnd(), clamp(len(vv) * .03, .004, .011), 3, 0, -1); cr.amp = 0; rings.push(cr); } }
        lastMove = { t: now, w }; } }
// hero sequence: after the first bloom settles, an unseen brush writes one carmine stroke through the stem (press, fast, lift)
const AUTO = { t0: 6.2, dur: 1.5, on: Q.has('autostroke'), done: false, started: false };
function autoStroke() { if (!AUTO.on || AUTO.done || time < AUTO.t0) return; if (interacted && !SHOT) { AUTO.done = true; if (AUTO.started) pointer.ink = AUTO.ink; return; }
  const f = clamp((time - AUTO.t0) / AUTO.dur, 0, 1); const e = f * f * (3 - 2 * f); // ease: slow press, fast middle, slow lift
  if (!AUTO.started) { AUTO.started = true; lastMove = null; brush.slot = -1; brush.n = 0; brush.w = .002; AUTO.ink = pointer.ink; pointer.ink = 1; }
  stirStep([-.85 + 1.7 * e, 1.50 - .22 * e + .06 * Math.sin(e * 3.1416), 0], time * 1000);
  if (f >= 1) { brushLift(); AUTO.done = true; pointer.ink = AUTO.ink; lastMove = null; } }
let slow = false, holdStart = 0, downXY = null, stirMode = false, lastMove = null, interacted = false;
cv.addEventListener('pointermove', e => { pointer.x = e.clientX / innerWidth; pointer.y = 1 - e.clientY / innerHeight; pointer.in = true;
  cam.tx = (pointer.x - .5) * 2; cam.ty = (pointer.y - .5) * 2;
  if (!pointer.down || !stirMode) { const wp = screenToWater(pointer.x, pointer.y); pip.xT = clamp(wp[0], -XH + .3, XH - .3); pip.tipT = SURF + .04 + .07 * clamp((wp[1] - (SURF - 1.4)) / 1.4, 0, 1); }
  if (pointer.down && downXY) { const dx = e.clientX - downXY[0], dy = e.clientY - downXY[1]; if (!stirMode && Math.hypot(dx, dy) > 14) stirMode = true;
    if (stirMode && lastMove) stirStep(screenToWater(pointer.x, pointer.y), performance.now()); } });
cv.addEventListener('pointerdown', e => { sfx.init(); interacted = true; pointer.down = true; holdStart = performance.now(); downXY = [e.clientX, e.clientY]; stirMode = false;
  lastMove = { t: performance.now(), w: screenToWater(e.clientX / innerWidth, 1 - e.clientY / innerHeight) }; brush.slot = -1; brush.n = 0; brush.w = .002; brush.last = []; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointerup', () => { if (!pointer.down) return; pointer.down = false; if (stirMode) brushLift();
  if (!stirMode) { const size = 1 + Math.min(pointer.hold, 1.3) * .55; const w = screenToWater(pointer.x, pointer.y); if (pointer.tool === 'salt') pour(clamp(w[0], -XH + .3, XH - .3), 0, size); else release(clamp(w[0], -XH + .3, XH - .3), (rnd() - .5) * .2, pointer.ink, size); fadeTitle(); }
  pointer.hold = 0; stirMode = false; });
addEventListener('keydown', e => { if (e.code === 'Space') { slow = true; e.preventDefault(); } if (e.key === 'r' || e.key === 'R') resetWater(); if (e.key === 'm' || e.key === 'M') sfx.toggle(); if (e.key === 's' || e.key === 'S') setSalt(pointer.tool !== 'salt'); const n = +e.key; if (n >= 1 && n <= INKS.length) setInk(n - 1); });
addEventListener('keyup', e => { if (e.code === 'Space') slow = false; });
addEventListener('resize', () => { allocRT(); if (!SHOT && TW) render(); });
function resetWater() { recentDrops.length = 0; clearMem(); ibReset(); falling.length = 0; salt.h = salt.target = SALT_DEFAULT; salt.pours.length = 0; if (salt.queue) salt.queue.length = 0; OPT.salt = 0; for (let i = 0; i < SLOTS; i++) slotTarget[i] = 0; rings.forEach(r => r.alive = false); lowY = SURF; inkW = .3; }
let titleFaded = false; function fadeTitle() { if (titleFaded) return; titleFaded = true; setTimeout(() => { document.querySelector('#title p').style.opacity = 0; }, 2500); }

// ---------------- UI layout: keep the title and the ink bottles in the dark studio, clear of the tank at any aspect
const titleEl = document.getElementById('title');
function layoutUI() { if (!VP) return; const VPs = VP; { const T = camTarget(false, true); const e = [T.x, T.y + .30, T.d], c = [0, T.y - .03, 0]; VP = mm(persp(FOV, W / H, .05, 30), lookAt(e, c, [0, 1, 0])); } try { layoutUI0(); } finally { VP = VPs; } }
function layoutUI0() { const zf = ZH + GT; const cs = [[-XH - GT, Y0 - SLAB, zf], [XH + GT, Y0 - SLAB, zf], [-XH - GT, RIM, zf], [XH + GT, RIM, zf]].map(proj);
  const L = Math.min(...cs.map(c => c[0])) * innerWidth, Rr = Math.max(...cs.map(c => c[0])) * innerWidth, T = (1 - Math.max(...cs.map(c => c[1]))) * innerHeight, B = (1 - Math.min(...cs.map(c => c[1]))) * innerHeight;
  window.__tank = { L: Math.round(L), R: Math.round(Rr), T: Math.round(T), B: Math.round(B), W: innerWidth, H: innerHeight };
  const side = L > 56; inksEl.classList.toggle('col', side); inksEl.classList.toggle('narrow', side && L < 170);
  if (side) { inksEl.style.left = Math.max(8, L * .5 - (L < 170 ? 16 : 40)) + 'px'; inksEl.style.bottom = Math.max(14, innerHeight - B + 6) + 'px'; }
  else { inksEl.style.left = '50%'; inksEl.style.bottom = '8px'; }
  // title: top-left of the studio; shrink until it clears the tank
  let fs = 28; titleEl.style.left = Math.max(12, Math.min(innerWidth * .03, L * .14)) + 'px'; titleEl.style.top = Math.max(10, Math.min(innerHeight * .042, T * .25)) + 'px';
  for (let i = 0; i < 6; i++) { titleEl.style.setProperty('--fs', fs + 'px'); const r = titleEl.getBoundingClientRect(); if (r.right < L - 10 || r.bottom < T - 6) break; fs *= .85; } }
// salt jar glint: once, after the first bloom settles, if salt was never used
let glinted = false; function glintSalt() { if (glinted || saltUsed) return; glinted = true; saltEl.classList.add('glint'); setTimeout(() => saltEl.classList.remove('glint'), 3200); }
// ---------------- boot
allocRT(); { const T0c = camTarget(true); cam.x = T0c.x; cam.y = T0c.y; cam.d = T0c.d; } updCam();
if (SHOT) {
  TW = TW || 512; allocTracers();
  const T = +Q.get('shot'); const DT = 1 / 60;
  const script = (Q.get('drops') || (Q.has('noauto') ? '-0.12,0,0,1,0' : '-0.12,0,0,' + HS1 + ',0;-0.12,0.015,1,' + HS2 + ',' + AUTO2)).split(';').map(s => s.split(',').map(Number));
  let si = 0; const N = Math.round(T / DT); const stirScript = Q.get('stir') ? Q.get('stir').split(';').map(s => s.split(',').map(Number)) : [];
  (async () => { for (let i = 0; i < N; i++) { while (si < script.length && script[si][4] <= time + 1e-6) { const s = script[si++]; if (s[2] === 9) pour(s[0], s[1], s[3]); else { pointer.ink = s[2]; release(s[0], s[1], s[2], s[3], s[5]); } }
      for (const st of stirScript) { if (st.on && !st.off && time > st[0] + st[5]) { st.off = 1; brushLift(); } if (time >= st[0] && time <= st[0] + st[5]) { const f = (time - st[0]) / st[5]; pointer.ink = st[6] | 0; if (!st.on) { st.on = 1; lastMove = null; brush.slot = -1; brush.n = 0; brush.w = .002; brush.last = []; } stirStep([st[1] + (st[3] - st[1]) * f, st[2] + (st[4] - st[2]) * f + .12 * Math.sin(f * 9.4), 0], time * 1000); } }
      step(DT); if (i % 20 === 0) await new Promise(r => setTimeout(r, 0)); }
    log('sim done'); if (INKOFF) slotFade.fill(0); render(); layoutUI(); if (Q.has('glint')) { saltEl.classList.add('glint'); } gl.finish(); log('render done'); window.__ready = true; })();
} else {
  TW = TW || (TIER === 'high' ? 768 : 512); allocTracers(); let fpsClock = 0;
  let last = performance.now(), autoT = 0, autoDone = false, auto2Done = false;
  const loop = now => { let d = Math.min(LOW ? .1 : .05, (now - last) / 1000); last = now;
    cam.px += (cam.tx * .5 - cam.px) * Math.min(1, d * 1.5); cam.py += (cam.ty * .5 - cam.py) * Math.min(1, d * 1.5);
    if (pointer.down) pointer.hold = (now - holdStart) / 1000;
    autoT += d; if (!autoDone && autoT > .12 && !interacted) { autoDone = true; release(-.12, 0, 0, HS1); }
    if (!auto2Done && autoDone && time > AUTO2 - .35 && !interacted && !Q.has('noauto')) { auto2Done = true; release(-.12, .015, 1, HS2); }
    const sd = d * (slow ? .25 : 1); const k = Math.max(1, Math.ceil(sd / (1 / 50))); for (let i = 0; i < k; i++) step(sd / k);
    fpsClock += d; if (fpsClock > (Q.has('rstest') ? .8 : 2) && FR.length > 8) { fpsClock = 0; const f = window.__fps(); const r0 = RS; if (Q.has('rstest')) RS = RS > .5 ? .45 : .6; else if (f < 24 && RS > (LOW ? .42 : .5)) RS = Math.max(LOW ? .42 : .5, RS * .82); else if (f > 52 && RS < 1) RS = Math.min(1, RS * 1.12); if (RS !== r0) { allocRT(); window.__rsChanges = (window.__rsChanges || 0) + 1; } }
    render(); FR.push(performance.now()); if (FR.length > 60) FR.shift(); requestAnimationFrame(loop); };
  const fpsEl = Q.has('fps') ? Object.assign(document.body.appendChild(document.createElement('div')), { style: 'position:fixed;right:10px;top:8px;font:12px monospace;color:#cfc6b8;opacity:.8;pointer-events:none' }) : null;
  setInterval(() => { if (fpsEl) fpsEl.textContent = `${window.__fps()} fps · ${TIER} · RS ${RS.toFixed(2)} · probe ${PROBE_MS.toFixed(1)} ms`; }, 1000);
  const FR = []; window.__fps = () => FR.length > 1 ? +((FR.length - 1) * 1000 / (FR[FR.length - 1] - FR[0])).toFixed(1) : 0;
  requestAnimationFrame(loop); window.__ready = true;
  setInterval(() => { layoutUI(); if (dropCount && time > 9 && !glinted) glintSalt(); }, 500); setTimeout(layoutUI, 50);
}
window.__info = () => ({ tank: window.__tank, rsChanges: window.__rsChanges || 0, salt: +salt.h.toFixed(3), drops: dropCount, released: releaseCount, falling: falling.length, RS: +RS.toFixed(2), TIER, PROBE_MS: +PROBE_MS.toFixed(2), IGPU, RENDERER, fps: window.__fps ? window.__fps() : 0, TW, rings: rings.length, live: rings.filter(r => r.alive).length, time, cam: { y: cam.y, d: cam.d, x: cam.x }, lowY, OPT });
})();
