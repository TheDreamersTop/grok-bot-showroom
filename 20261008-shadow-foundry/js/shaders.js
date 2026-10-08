export const WALL_VS = /* glsl */`
varying vec3 vW; varying vec2 vUv;
void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`;

export const WALL_FS = /* glsl */`
#include <packing>
uniform vec3 lampPos, lampDir, lampColor; uniform float lampInt, cosOuter, cosInner;
uniform sampler2D shadowMap, cookie, drawTex, reflTex; uniform mat4 shadowMatrix, reflMat; uniform float radius, darkness, drawAmt, workLight, time, reflAmt;
uniform vec3 N; uniform int axis; uniform vec3 bounce; uniform vec3 mo, mu, mv; uniform float M;
uniform vec3 pc[3], pcol[3]; uniform vec4 lens; uniform vec2 res; uniform vec4 shape; uniform vec3 barn; uniform float plaster;
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
uniform float smap;
float shadowAt(vec3 P){
  vec4 sc = shadowMatrix * vec4(P,1.); sc.xyz /= sc.w;
  if(sc.x<0.||sc.x>1.||sc.y<0.||sc.y>1.||sc.z>1.) return 1.;
  float a = ign(gl_FragCoord.xy)*6.2831; mat2 R = mat2(cos(a),sin(a),-sin(a),cos(a));
  vec2 ts = vec2(1./smap); float s=0.;
  for(int i=0;i<16;i++){ vec2 o = R*PD[i]*radius*ts; s += step(sc.z-0.0006, unpackRGBAToDepth(texture2D(shadowMap, sc.xy+o))); }
  return s/16.;
}
// procedural lens cookie: soft edge (focus), faint lens ring, chromatic fringe, slight hotspot
vec3 lensCookie(vec2 uv){
  vec2 q = (uv-.5)/shape.xy; float r = length(q)*2.; // shape.xy: ellipse (1 = round)
  float door = barn.z > 0. ? 1. - smoothstep(barn.z - .0025, barn.z + .0025, dot(uv-.5, barn.xy)) : 1.; /* hard barn-door cut */
  float e0 = .92 - lens.x, e1 = .985;
  vec3 c = vec3(1.-smoothstep(e0-lens.z, e1-lens.z, r), 1.-smoothstep(e0, e1, r), 1.-smoothstep(e0+lens.z, e1+lens.z*1.6, r));
  c *= 1. + lens.y*exp(-pow((r-.80)/.035,2.)) - lens.y*.6*exp(-pow((r-.86)/.03,2.));
  c *= 1. + lens.w*(1.-r*r);
  return max(c, 0.) * door;
}
void main(){
  vec3 P = vW;
  float lo = fbm(P*.35), mid = fbm(P*2.1+3.), fine = fbm(P*14.);
  vec3 albedo = vec3(.80,.77,.72) * (.84 + .16*lo) * (.92+.08*mid);
  if(axis==1) albedo = vec3(.30,.285,.27)*(.82+.18*lo)*(.9+.1*mid); // floor: dark polished concrete
  float e=.02; vec3 t1 = axis==2? vec3(1,0,0) : axis==0? vec3(0,0,1) : vec3(1,0,0); vec3 t2 = axis==1? vec3(0,0,1) : vec3(0,1,0);
  float f0=fbm(P*9.), fx=fbm((P+t1*e)*9.), fy=fbm((P+t2*e)*9.);
  float f1=fbm(P*31.), f1x=fbm((P+t1*e*.3)*31.), f1y=fbm((P+t2*e*.3)*31.);
  vec3 n = normalize(N + (t1*(f0-fx) + t2*(f0-fy))*(axis==1? .35 : 1.4) + (t1*(f1-f1x)+t2*(f1-f1y))*(axis==1? .2 : .9));
  vec3 L = lampPos - P; float dist = length(L); L/=dist;
  vec4 sc = shadowMatrix * vec4(P,1.); sc.xy/=sc.w;
  vec3 ck = (sc.x>0.&&sc.x<1.&&sc.y>0.&&sc.y<1.) ? lensCookie(sc.xy) : vec3(0.);
  float sh = shadowAt(P);
  float vis = mix(1., sh, darkness);
  float ndl = max(dot(n,L),0.);
  vec3 direct = lampColor * lampInt * ndl * ck * vis;
  // corner occlusion + fake one-bounce from the three pools + faint room tone
  float d1 = axis==2? P.x : axis==0? P.z : P.x, d2 = axis==1? P.z : P.y;
  float ao = (1.-.6*exp(-d1/.5))*(1.-.6*exp(-d2/.5));
  vec3 amb = bounce;
  for(int j=0;j<3;j++){ vec3 dv = P - pc[j]; float dd = length(dv); float fc = .12 + .88*clamp(dot(N, -dv)/max(dd,1e-3)*2., 0., 1.); amb += pcol[j] * fc * (.07*exp(-dd/2.2) + .03*exp(-dd/6.)); }
  amb *= (.6+.4*lo) * ao * (.8 + .4*ndl);
  amb += vec3(.98,.94,.88) * plaster * (.75+.25*lo) * ao * (1. - .9*clamp(ck.g,0.,1.)); // lift the plaster outside the pools only
  vec3 col = albedo*(direct + amb);
  if(axis==1 && reflAmt>0.){ // polished floor: planar reflection with roughness blur + fresnel
    vec4 rp = reflMat * vec4(P,1.); vec2 ruv = rp.xy/rp.w; vec2 nrm = (n.xz)*.04;
    vec3 rc = vec3(0.); float a0 = ign(gl_FragCoord.xy)*6.2831;
    for(int i=0;i<8;i++){ float a=a0+float(i)*2.399; float rr=sqrt((float(i)+.5)/8.); rc += texture2D(reflTex, ruv + nrm + vec2(cos(a),sin(a))*rr*.006*(1.+3.*fine)).rgb; }
    rc /= 8.; float fres = .06 + .5*pow(1.-max(dot(normalize(cameraPosition-P), vec3(0,1,0)),0.),5.);
    col = col + rc*fres*reflAmt*(.7+.6*mid);
  }
  if(drawAmt>0.){ vec3 q=P-mo; vec2 duv=vec2(dot(q,mu),dot(q,mv))/M+.5;
    if(duv.x>0.&&duv.x<1.&&duv.y>0.&&duv.y<1.){ float a=texture2D(drawTex,duv).a; float ch=.55+.45*fbm(P*40.);
      col = mix(col, col*vec3(.10,.09,.085)*ch, a*drawAmt); }
    vec2 e2=abs(duv-.5); float fr=smoothstep(.006,.0,abs(max(e2.x,e2.y)-.47))*step(max(e2.x,e2.y),.48);
    col *= 1. - .25*fr*drawAmt*step(.5, fract((duv.x+duv.y)*40.)); }
  col *= 0.95 + 0.1*fine*fine;
  gl_FragColor = vec4(col,1.);
}`;

export const HAZE_FS = /* glsl */`
#include <packing>
uniform sampler2D depthTex, sm0, sm1, sm2; uniform mat4 smat0, smat1, smat2, invVP; uniform vec3 camPos;
uniform vec3 lp[3], ld[3], lc[3]; uniform float li[3]; uniform float cosOuter, time, density, freeze, hsteps;
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
  const int STEPS = 64; float st = tmax/hsteps; float j = ign(gl_FragCoord.xy + time*7.);
  vec3 acc = vec3(0.);
  for(int i=0;i<STEPS;i++){ if(float(i) >= hsteps) break;
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

export const MOTE_VS = /* glsl */`
uniform vec3 lp[3], ld[3], lc[3]; uniform float li[3]; uniform float cosOuter, time, freeze, px;
attribute float seed; varying vec3 vC;
void main(){
  vec3 P = position + vec3(sin(time*.11+seed*40.), sin(time*.07+seed*13.)*.6 - mod(time*.02+seed, 1.)*0., cos(time*.09+seed*29.))*.12*(1.-freeze);
  vec3 c = vec3(0.);
  for(int k=0;k<3;k++){ vec3 L=P-lp[k]; float dl=length(L); float cs=dot(L/dl, ld[k]); c += lc[k]*li[k]*smoothstep(cosOuter, mix(cosOuter,1.,.3), cs)/(1.+.02*dl*dl); }
  float tw = .6+.4*sin(time*1.7+seed*90.);
  vC = c*tw;
  vec4 mv = modelViewMatrix*vec4(P,1.); gl_Position = projectionMatrix*mv; gl_PointSize = px*(1.5+seed*1.5)/(-mv.z)*10.;
}`;
export const MOTE_FS = /* glsl */`
varying vec3 vC; uniform float amt;
void main(){ vec2 q=gl_PointCoord-.5; float a=smoothstep(.5,.0,length(q)); gl_FragColor=vec4(vC*a*amt,1.); }`;
