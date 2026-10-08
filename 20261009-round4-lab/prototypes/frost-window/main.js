import * as THREE from 'three';
const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot');
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
const W = +(Q.get('sw') || 640), H = Math.round(W * 9 / 16);
const rtOpt = { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false };
let A = new THREE.WebGLRenderTarget(W, H, rtOpt), B = new THREE.WebGLRenderTarget(W, H, rtOpt);
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); const sc = new THREE.Scene();
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); sc.add(quad);
const VS = `out vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const NOISE = `
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float hash3(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+17.1; a*=.5; } return s; }
`;
// channels: r = ice (0/1, then thickening), g = vapour, b = fog (condensation), a = crystal orientation (0..1 -> 0..pi/3) or -1 none
const initMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, uniforms: { res: { value: new THREE.Vector2(W, H) }, seed: { value: 1 } },
  fragmentShader: `precision highp float; in vec2 vUv; out vec4 o; uniform vec2 res; uniform float seed;` + NOISE + `
  void main(){ vec2 c = vUv*res;
    float fog = clamp(0.75 + 0.35*(fbm(vUv*vec2(4.,2.5)+seed)-.5) + 0.25*(1.-vUv.y), 0., 1.);  // denser low on the pane
    float ice = 0.; float ori = -1.;
    // frost nucleates along the window frame (cold edges) and at a few specks of dust
    float edge = min(min(c.x, res.x-c.x), min(c.y, res.y-c.y));
    float r = hash(c+seed*7.1);
    if (edge < 2.0 && r < 0.018) { ice = 1.; ori = hash(c*1.7+seed); }
    if (r > 0.99993) { ice = 1.; ori = hash(c*3.1+seed); }
    o = vec4(ice, fog*0.7, fog, ori); }` });
const stepMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS,
  uniforms: { S: { value: null }, res: { value: new THREE.Vector2(W, H) }, frame: { value: 0 }, brushA: { value: new THREE.Vector3(-1, -1, 0) }, brushB: { value: new THREE.Vector3(-1, -1, 0) }, rate: { value: 1 } },
  fragmentShader: `precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D S; uniform vec2 res; uniform float frame, rate; uniform vec3 brushA, brushB;` + NOISE + `
  float segD(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.); return length(pa-ba*h); }
  void main(){ vec2 px = 1./res; vec4 s = texture(S, vUv); vec2 c = vUv*res;
    float ice=s.r, vap=s.g, fog=s.b, ori=s.a;
    // vapour diffuses (5-point), fed by the fog film, consumed by ice
    float lap = texture(S,vUv+vec2(px.x,0)).g + texture(S,vUv-vec2(px.x,0)).g + texture(S,vUv+vec2(0,px.y)).g + texture(S,vUv-vec2(0,px.y)).g - 4.*vap;
    vap += 0.22*lap + 0.0006*(fog*0.7 - vap);
    if (ice < 0.5) {
      // anisotropic stochastic attachment: a neighbour crystal grows along its six preferred axes
      float best = 0.; float bestOri = -1.;
      for (int j=-1;j<=1;j++) for (int i=-1;i<=1;i++) { if (i==0&&j==0) continue;
        vec4 n = texture(S, vUv + vec2(i,j)*px); if (n.r < 0.5) continue;
        float th = atan(float(-j), float(-i)) ;              // direction from neighbour to me
        float phi = n.a*1.0471976;
        float an = pow(abs(cos(3.*(th - phi))), 16.);        // six-fold
        float sc = (0.045 + an) / length(vec2(i,j));
        if (sc > best) { best = sc; bestOri = n.a; } }
      float p = rate * best * pow(clamp(vap/0.7,0.,1.), 3.) * 1.2;
      float r = hash3(vec3(c, frame*0.618));
      if (best > 0. && fog > 0.12 && r < p) { ice = 1.; ori = bestOri; vap = 0.; }
    } else {
      ice = min(ice + 0.01*vap, 2.0);  vap *= 0.9;          // crystals thicken, drinking vapour
    }
    // warm finger: wipes fog and melts ice along the stroke
    float d = segD(c, brushA.xy, brushB.xy);
    if (brushB.z > 0.5) { float w = smoothstep(brushB.z*1.0, brushB.z*0.55, d)*step(-0.5, brushA.x);
      fog *= 1.-w; vap *= 1.-w; if (w > 0.5) { ice = 0.; ori = -1.; } }
    fog = min(1., fog + 0.00005);                                  // the glass slowly fogs again
    o = vec4(ice, max(vap,0.), fog, ori); }` });
function run(m, t) { quad.material = m; renderer.setRenderTarget(t); renderer.render(sc, cam); renderer.setRenderTarget(null); }
let frame = 0;
function init(seed) { initMat.uniforms.seed.value = seed; run(initMat, A); frame = 0; }
function step() { stepMat.uniforms.S.value = A.texture; stepMat.uniforms.frame.value = frame++; run(stepMat, B); [A, B] = [B, A]; }

// ---------------------------------------------------------------- the night outside (rendered once to a texture)
const BW = 960, BH = 540;
const bgRT = new THREE.WebGLRenderTarget(BW, BH, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
const bgMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, uniforms: { seed: { value: 3 } },
  fragmentShader: `precision highp float; in vec2 vUv; out vec4 o; uniform float seed;` + NOISE + `
  float hill(float x, float base, float amp, float f, float s){ return base + amp*(fbm(vec2(x*f+s, s))-.5); }
  void main(){ vec2 uv=vUv; float x=uv.x*1.778;
    vec3 sky = mix(vec3(.010,.018,.045), vec3(.045,.06,.12), smoothstep(1.,.25,uv.y));
    vec2 mp = vec2(1.25,.80); float md = length(vec2(x,uv.y)-mp); sky += vec3(.5,.55,.7)*exp(-md*md*60.)*0.25 + vec3(1.,1.,.95)*smoothstep(.035,.03,md)*1.4;
    sky += vec3(.9,.9,1.)*step(.9975, hash(floor(uv*vec2(400.,225.))))*smoothstep(.45,.9,uv.y)*0.6;
    vec3 col = sky;
    // three layers of snowy hills, nearest last
    for (int L=0; L<3; L++) { float fl=float(L);
      float h = hill(x, .52-fl*.11, .18-fl*.03, 1.2+fl*.8, seed+fl*3.1);
      if (uv.y < h) { float shade = mix(.40, .16, fl/2.); vec3 snow = vec3(.55,.62,.80)*shade*(0.8+0.4*smoothstep(h-.03,h,uv.y));
        col = snow;
        // houses with warm windows on the middle and near hill
        if (L>0) { float cell = floor(x*(5.+fl*3.)); float hc = hash(vec2(cell, fl+seed));
          float cx = (cell+.5)/(5.+fl*3.); float hx = hill(cx, .52-fl*.11, .18-fl*.03, 1.2+fl*.8, seed+fl*3.1);
          if (hc > .35) { float wdt = .045/(1.+fl*.0)*(1.-fl*.25); float ht = wdt*.8;
            vec2 q = vec2(x - cx, uv.y - hx + .02);
            if (abs(q.x) < wdt && q.y < ht && q.y > -0.05) { col = vec3(.03,.025,.03)*(1.+fl);
              vec2 wq = fract(vec2(q.x/wdt*1.5+.5, q.y/ht*1.4)) ; vec2 wi = floor(vec2(q.x/wdt*1.5+.5, q.y/ht*1.4));
              if (wq.x>.25&&wq.x<.75&&wq.y>.3&&wq.y<.8 && hash(wi+cell+fl)>.6 && wi.y<1.5) col = vec3(1.0,.55,.18)*(6.+4.*hash(wi*3.+cell)); }
            float roof = ht + (wdt - abs(q.x))*0.8; if (abs(q.x)<wdt*1.15 && q.y>ht && q.y<roof) col = vec3(.45,.5,.65)*.25; }
          // pine trees
          float tc = floor(x*(14.+fl*10.)); float th2 = hash(vec2(tc, 9.+fl));
          if (th2 > .55) { float tx = (tc+.5)/(14.+fl*10.); float thx = hill(tx, .52-fl*.11, .18-fl*.03, 1.2+fl*.8, seed+fl*3.1);
            float tw = .018*(.6+fl*.4); vec2 q=vec2(x-tx, uv.y-thx+.01); float tri = tw*(1.-q.y/(tw*3.5));
            if (q.y>0. && abs(q.x)<tri) col = vec3(.02,.035,.04)*(1.+fl*.3); } }
      } }
    // street lamps glow & haze
    col += vec3(1.,.6,.25)*0.10*exp(-pow((uv.y-.33)*6.,2.));
    for (int k=0;k<9;k++){ vec2 lp = vec2(0.1+0.2*float(k)+0.05*hash(vec2(k,seed)), 0.25+0.12*hash(vec2(seed,k))); float ld=length((vec2(x/1.778,uv.y)-lp)*vec2(1.778,1.)); col += vec3(1.,.62,.3)*exp(-ld*ld*9000.)*12.; }
    o = vec4(col,1.); }` });
// blurred copies of the night (gaussian, separable) for out-of-focus looks
const blurMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, uniforms: { S: { value: null }, dir: { value: new THREE.Vector2() } },
  fragmentShader: `precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D S; uniform vec2 dir;
  void main(){ vec3 c=vec3(0.); float w=0.; for(int i=-12;i<=12;i++){ float k=exp(-float(i*i)/50.); c+=texture(S,vUv+dir*float(i)).rgb*k; w+=k; } o=vec4(c/w,1.); }` });
const mkB = (w, h) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
const midA = mkB(480, 270), midB = mkB(480, 270), softA = mkB(160, 90), softB = mkB(160, 90);
function blur(src, tmp, dst, r) { blurMat.uniforms.S.value = src.texture; blurMat.uniforms.dir.value.set(r / 1.778, 0); quad.material = blurMat; renderer.setRenderTarget(tmp); renderer.render(sc, cam);
  blurMat.uniforms.S.value = tmp.texture; blurMat.uniforms.dir.value.set(0, r); renderer.setRenderTarget(dst); renderer.render(sc, cam); renderer.setRenderTarget(null); }
const comp = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS,
  uniforms: { S: { value: null }, BG: { value: midA.texture }, SOFT: { value: softA.texture }, BGS: { value: bgRT.texture }, res: { value: new THREE.Vector2(W, H) }, scr: { value: new THREE.Vector2(innerWidth, innerHeight) }, time: { value: 0 } },
  fragmentShader: `precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D S, BG, SOFT, BGS; uniform vec2 res, scr; uniform float time;` + NOISE + `
  vec3 bgBlur(vec2 uv, float r){ return r < 0.02 ? texture(BG,uv).rgb : texture(SOFT,uv).rgb; }
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
  void main(){ vec2 uv=vUv; vec2 px=1./res; vec4 s=texture(S,uv);
    float ice = s.r, fog = s.b;
    // smooth ice coverage + normal for refraction
    float il=texture(S,uv-vec2(px.x,0)).r, ir=texture(S,uv+vec2(px.x,0)).r, it=texture(S,uv+vec2(0,px.y)).r, ib=texture(S,uv-vec2(0,px.y)).r;
    float iceS = clamp((ice+il+ir+it+ib)/5.0, 0., 2.);
    vec2 g = vec2(ir-il, it-ib);
    vec3 sharp = texture(BGS, uv).rgb;                       // the village is beyond focus
    vec3 soft  = bgBlur(uv + g*0.004, 0.05);
    vec3 col = sharp;
    // condensation: milky scattering + micro droplets
    float drops = smoothstep(.55,.9,vnoise(uv*res*1.2));
    vec3 fogc = soft*0.7 + vec3(.020,.018,.020) + soft*drops*0.3;
    col = mix(col, fogc, smoothstep(0.05,0.6,fog));
    // frost: bright crystalline, catches the warm lights through the glass
    float edge = clamp(length(g)*0.8,0.,1.);
    vec3 glow = bgBlur(uv + g*0.02, 0.09);
    vec3 frost = vec3(.16,.20,.27)*0.5 + glow*1.3 + vec3(.45,.55,.7)*edge*0.25 + vec3(1.,.8,.6)*edge*dot(glow,vec3(.3))*3.;
    frost *= 0.85 + 0.3*hash(floor(uv*res));
    col = mix(col, frost, smoothstep(0.15, 0.9, iceS));
    // window frame & mullion (warm-lit wood), interior reflection
    vec2 p = uv*vec2(1.778,1.);
    float frame = max(step(uv.x, .035)+step(.965, uv.x), step(uv.y,.06)+step(.94,uv.y));
    float mull = step(abs(uv.x-.70), .010);
    vec3 wood = vec3(.09,.05,.03)*(0.6+0.6*uv.y*0.)+vec3(.25,.12,.05)*smoothstep(.4,0.,uv.y)*0.6;
    col = mix(col, wood, max(frame, mull));
    col += vec3(.06,.035,.02)*smoothstep(.6,0.,uv.y);   // warm room light reflected on the glass
    col = aces(col*1.15); col = pow(col, vec3(1./2.2));
    vec2 q=uv-.5; col *= 1.-0.6*dot(q,q);
    col += (hash(uv*scr+time)-.5)/120.;
    o = vec4(col,1.); }` });
function renderBG(seed) { bgMat.uniforms.seed.value = seed; quad.material = bgMat; renderer.setRenderTarget(bgRT); renderer.render(sc, cam); renderer.setRenderTarget(null);
  blur(bgRT, midB, midA, 1 / 540 * 0.8); blur(midA, softB, softA, 1 / 90 * 0.9); }
function render() { comp.uniforms.S.value = A.texture; quad.material = comp; renderer.setRenderTarget(null); renderer.render(sc, cam); }

// ---------------------------------------------------------------- input
let last = null, down = false;
function toSim(e) { return new THREE.Vector2(e.clientX / innerWidth * W, (1 - e.clientY / innerHeight) * H); }
function stroke(a, b, r) { stepMat.uniforms.brushA.value.set(a.x, a.y, 0); stepMat.uniforms.brushB.value.set(b.x, b.y, r); }
addEventListener('pointerdown', e => { down = true; last = toSim(e); });
addEventListener('pointerup', () => { down = false; stepMat.uniforms.brushB.value.z = 0; });
addEventListener('pointermove', e => { if (!down) return; const p = toSim(e); stroke(last, p, W / 90); last = p; });
addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') { init(Math.random() * 100); renderBG(Math.random() * 100); } });

init(+(Q.get('seed') || 2)); renderBG(+(Q.get('bg') || 3));
if (SHOT) {
  // scripted drawing: a heart traced by a warm finger, then frost grows for t steps
  const steps = +(Q.get('t') || 600);
  const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2; const x = 16 * Math.pow(Math.sin(a), 3), y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    pts.push(new THREE.Vector2(W * 0.40 + x * W / 95, H * 0.52 + y * W / 95)); }
  if (!Q.has('nodraw')) for (let i = 1; i < pts.length; i++) { stroke(pts[i - 1], pts[i], W / 70); step(); }
  stepMat.uniforms.brushB.value.z = 0;
  let s = 0; const chunk = () => { const e = Math.min(steps, s + 100); for (; s < e; s++) step(); if (s < steps) setTimeout(chunk, 0); else { render(); window.__ready = true; } };
  chunk();
} else {
  const loop = () => { requestAnimationFrame(loop); for (let i = 0; i < 3; i++) step(); if (!down) stepMat.uniforms.brushB.value.z = 0; render(); window.__ready = true; };
  loop();
}
