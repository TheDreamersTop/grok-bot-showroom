export const WALL_VS = /* glsl */`
varying vec3 vW; varying vec2 vUv;
void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`;

export const WALL_FS = /* glsl */`
#include <packing>
uniform vec3 lampPos, lampDir, lampColor; uniform float lampInt, cosOuter, cosInner;
uniform sampler2D shadowMap, cookie, drawTex; uniform mat4 shadowMatrix; uniform float radius, darkness, drawAmt, workLight, time;
uniform vec3 N; uniform int axis; uniform vec3 bounce; uniform vec3 mo, mu, mv; uniform float M;
varying vec3 vW;
float h3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }
float ign(vec2 p){ return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715)))); }
const vec2 PD[16] = vec2[16](vec2(-.94201624,-.39906216),vec2(.94558609,-.76890725),vec2(-.09418410,-.92938870),vec2(.34495938,.29387760),
 vec2(-.91588581,.45771432),vec2(-.81544232,-.87912464),vec2(-.38277543,.27676845),vec2(.97484398,.75648379),vec2(.44323325,-.97511554),
 vec2(.53742981,-.47373420),vec2(-.26496911,-.41893023),vec2(.79197514,.19090188),vec2(-.24188840,.99706507),vec2(-.81409955,.91437590),
 vec2(.19984126,.78641367),vec2(.14383161,-.14100790));
float shadowAt(vec3 P){
  vec4 sc = shadowMatrix * vec4(P,1.); sc.xyz /= sc.w;
  if(sc.x<0.||sc.x>1.||sc.y<0.||sc.y>1.||sc.z>1.) return 1.;
  float a = ign(gl_FragCoord.xy)*6.2831; mat2 R = mat2(cos(a),sin(a),-sin(a),cos(a));
  vec2 ts = vec2(1./2048.); float s=0.;
  for(int i=0;i<16;i++){ vec2 o = R*PD[i]*radius*ts; s += step(sc.z-0.0006, unpackRGBAToDepth(texture2D(shadowMap, sc.xy+o))); }
  return s/16.;
}
void main(){
  // plaster: low-frequency tone, mid mottling, fine relief revealed by light
  vec3 P = vW;
  float lo = fbm(P*.35), mid = fbm(P*2.1+3.), fine = fbm(P*14.);
  vec3 albedo = vec3(.78,.75,.70) * (.86 + .14*lo) * (.94+.06*mid);
  if(axis==1) albedo = vec3(.42,.39,.36)*(.85+.15*lo)*(.92+.08*mid); // floor: darker polished concrete
  // relief normal from fbm gradient
  float e=.02; vec3 t1 = axis==2? vec3(1,0,0) : axis==0? vec3(0,0,1) : vec3(1,0,0); vec3 t2 = axis==1? vec3(0,0,1) : vec3(0,1,0);
  float f0=fbm(P*9.), fx=fbm((P+t1*e)*9.), fy=fbm((P+t2*e)*9.);
  vec3 n = normalize(N + (t1*(f0-fx) + t2*(f0-fy))*0.9);
  vec3 L = lampPos - P; float dist = length(L); L/=dist;
  float cosA = dot(-L, lampDir);
  float cone = smoothstep(cosOuter, cosInner, cosA);
  vec4 sc = shadowMatrix * vec4(P,1.); sc.xy/=sc.w;
  float ck = texture2D(cookie, clamp(sc.xy,0.,1.)).r;
  float sh = shadowAt(P);
  float vis = mix(1., sh, darkness);
  float ndl = max(dot(n,L),0.);
  vec3 direct = lampColor * lampInt * ndl * cone * ck * vis;
  // corner occlusion (soft cove) & faint room bounce
  float d1 = axis==2? P.x : axis==0? P.z : P.x, d2 = axis==1? P.z : P.y;
  float ao = (1.-.55*exp(-d1/.45))*(1.-.55*exp(-d2/.45));
  vec3 amb = bounce * (.6+.4*lo) * ao;
  vec3 col = albedo*(direct*(0.93+0.07*ao) + amb);
  // charcoal drawing overlay (authoring)
  if(drawAmt>0.){ vec3 q=P-mo; vec2 duv=vec2(dot(q,mu),dot(q,mv))/M+.5;
    if(duv.x>0.&&duv.x<1.&&duv.y>0.&&duv.y<1.){ float a=texture2D(drawTex,duv).a; float ch=.55+.45*fbm(P*40.);
      col = mix(col, col*vec3(.10,.09,.085)*ch, a*drawAmt); }
    // faint frame showing the drawable area
    vec2 e2=abs(duv-.5); float fr=smoothstep(.006,.0,abs(max(e2.x,e2.y)-.47))*step(max(e2.x,e2.y),.48);
    col *= 1. - .25*fr*drawAmt*step(.5, fract((duv.x+duv.y)*40.)); }
  col *= 0.96 + 0.08*fine*fine;
  gl_FragColor = vec4(col,1.);
}`;

export const HAZE_FS = /* glsl */`
#include <packing>
uniform sampler2D depthTex, sm0, sm1, sm2; uniform mat4 smat0, smat1, smat2, invVP; uniform vec3 camPos;
uniform vec3 lp[3], ld[3], lc[3]; uniform float li[3]; uniform float cosOuter, time, density, freeze;
varying vec2 vUv;
float h3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float ign(vec2 p){ return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715)))); }
float vis(sampler2D m, mat4 M, vec3 P){ vec4 sc=M*vec4(P,1.); sc.xyz/=sc.w; if(sc.x<0.||sc.x>1.||sc.y<0.||sc.y>1.) return 0.; return step(sc.z-0.001, unpackRGBAToDepth(texture2D(m,sc.xy))); }
void main(){
  float d = texture2D(depthTex, vUv).x;
  vec4 wp = invVP * vec4(vUv*2.-1., d*2.-1., 1.); wp.xyz/=wp.w;
  vec3 ro = camPos, rd = wp.xyz-camPos; float tmax = length(rd); rd/=tmax; tmax = min(tmax, 40.);
  const int STEPS = 48; float st = tmax/float(STEPS); float j = ign(gl_FragCoord.xy + time*7.);
  vec3 acc = vec3(0.);
  for(int i=0;i<STEPS;i++){
    vec3 P = ro + rd*(float(i)+j)*st;
    float dust = .55 + .45*n3(P*1.7 + vec3(0., -time*.12, time*.07)*(1.-freeze)) * n3(P*5.3 - vec3(time*.05,0.,0.)*(1.-freeze));
    for(int k=0;k<3;k++){
      vec3 L = P - lp[k]; float dl = length(L); float c = dot(L/dl, ld[k]);
      if(c < cosOuter) continue;
      float cone = smoothstep(cosOuter, mix(cosOuter,1.,.35), c);
      float v = k==0? vis(sm0,smat0,P) : k==1? vis(sm1,smat1,P) : vis(sm2,smat2,P);
      float g = .35; float ph = (1.-g*g)/pow(1.+g*g-2.*g*dot(-rd, -L/dl),1.5);
      acc += lc[k]*li[k]*cone*v*dust*ph/(1.+.02*dl*dl);
    }
  }
  gl_FragColor = vec4(acc*st*density, 1.);
}`;

export const COMP_FS = /* glsl */`
uniform sampler2D sceneTex, hazeTex; uniform vec2 res; uniform float time, exposure, grain, fade;
varying vec2 vUv;
vec3 aces(vec3 x){ const float a=2.51,b=.03,c=2.43,d=.59,e=.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.,1.); }
float ign(vec2 p){ return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715)))); }
void main(){
  vec3 c = texture2D(sceneTex, vUv).rgb + texture2D(hazeTex, vUv).rgb;
  c = aces(c*exposure);
  c = pow(c, vec3(1./2.2));
  vec2 q = vUv-.5; q.x *= res.x/res.y; c *= 1. - .35*smoothstep(.45, 1.1, length(q));
  float n = ign(gl_FragCoord.xy + fract(time*13.)*vec2(97.,61.)) - .5;
  c += n*grain;
  gl_FragColor = vec4(c*fade, 1.);
}`;
export const QUAD_VS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
