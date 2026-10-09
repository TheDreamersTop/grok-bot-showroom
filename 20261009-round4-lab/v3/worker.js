// V1 solver worker: implicit stream-power (Braun & Willett 2013) on an arid mesa; the player's stroke is the only real rain.
import { createSPL, mesa, gesture, strokeShape } from './sim.js';
let sim, N, cfg, budget = 0, steps = 0, ms = 0, running = false, total = 0;
const GR = 60;   // stroke rain weight — identical for live strokes and deterministic shots
function pack(done) {
  const { W, A, rain } = sim, out = new Float32Array(N * N * 4); let top = -1e9;
  // render-only smoothing: the D8/threshold solver leaves cell-scale jaggies on walls; the renderer's strata terrace restores crisp cliffs
  const hb = blurH(sim.h, cfg.blur), hr = sim.h; let rt = -1e9; for (let i = 0; i < N * N; i++) if (hr[i] > rt) rt = hr[i];
  hs = hs || new Float32Array(N * N); const h = hs, R0 = rt - (cfg.rimSharp ?? 3.2), R1 = rt - 0.6;   // smooth only below the rim: caprock lips stay sharp-edged
  for (let i = 0; i < N * N; i++) { const s = Math.min(1, Math.max(0, (hr[i] - R0) / (R1 - R0))); const k = s * s * (3 - 2 * s); h[i] = hb[i] + (Math.max(hr[i], hb[i]) - hb[i]) * k; }
  for (let i = 0; i < N * N; i++) { const lake = W[i] > 0.1; out[i * 4] = lake ? h[i] + W[i] : h[i]; out[i * 4 + 1] = lake ? W[i] : 0; out[i * 4 + 3] = rain[i] > 2 ? Math.min(1, (rain[i] - 1) / GR) : 0; if (h[i] > top) top = h[i]; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; let r = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N || dx * dx + dy * dy > 5) continue; const n = yy * N + xx;
      if (A[n] > 8 && h[i] - h[n] < 0.9) { const v = Math.log2(1 + A[n] * 8); if (v > r) r = v; } }
    out[i * 4 + 2] = r; }
  postMessage({ type: 'frame', data: out, top, upl: sim.upl, steps, total, msPerStep: ms / Math.max(1, steps), budget, done }, [out.buffer]);
}
let bt = null, bt2 = null, hs = null;
function blurH(src, passes) { if (!passes) return src; bt = bt || new Float32Array(N * N); bt2 = bt2 || new Float32Array(N * N); let a = src, b = bt;
  for (let p = 0; p < passes; p++) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0, ws = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const wgt = (dx ? 1 : 2) * (dy ? 1 : 2); s += a[Y * N + X] * wgt; ws += wgt; }
      b[y * N + x] = s / ws; }
    a = b; b = (b === bt) ? bt2 : bt; }
  return a; }
function loop() {
  if (budget <= 0) { running = false; pack(true); return; }
  const n = Math.min(cfg.chunk, budget), t0 = performance.now();
  if (!cfg.quiet && !fast) { const want = B0 * Math.pow(Math.min(1, (performance.now() - T0) / cfg.playMs), 1.5); /* ease-in: early incision slow + readable */ if (B0 - budget >= want) { setTimeout(loop, 12); return; } }   // paced: deep time plays over ~playMs, so the carve is watchable
  for (let k = 0; k < n; k++) sim.step();
  ms += performance.now() - t0; steps += n; total += n; budget -= n;
  if (!cfg.quiet || budget <= 0) pack(budget <= 0);
  if (budget > 0) setTimeout(loop, 0); else running = false;
}
let BGF = null, B0 = 1, T0 = 0, fast = false, snap = null, SUP = null, allPts = [];
   // patchy background rain (a forcing, not a canyon): side canyons get uneven lengths instead of identical lobes
function bgField() { if (BGF && BGF.length === N * N) return BGF; BGF = new Float32Array(N * N); let s = (cfg.seed || 3) * 9301 + 49297; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const G = 9, g = Array.from({ length: (G + 1) * (G + 1) }, r), G2 = 23, g2 = Array.from({ length: (G2 + 1) * (G2 + 1) }, r);
  const vn = (arr, n, x, y) => { const X = Math.min(n - 1, Math.floor(x)), Y = Math.min(n - 1, Math.floor(y)), fx = x - X, fy = y - Y, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), k = n + 1;
    return (arr[Y * k + X] * (1 - sx) + arr[Y * k + X + 1] * sx) * (1 - sy) + (arr[(Y + 1) * k + X] * (1 - sx) + arr[(Y + 1) * k + X + 1] * sx) * sy; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = 0.65 * vn(g, G, x / N * G, y / N * G) + 0.35 * vn(g2, G2, x / N * G2, y / N * G2); BGF[y * N + x] = (cfg.bgVar ?? 1) ? 0.15 + 2.2 * v * v : 1; }
  return BGF; }
function supField() {   // bg rain x0.2 inside the drawn shape's hull and within ~0.06 N of any stroke: no side canyons ("gear teeth") eating the shape
  if (SUP) return SUP; SUP = new Float32Array(N * N).fill(1); if (!allPts.length || cfg.sup === 0) return SUP;
  const D = new Float32Array(N * N).fill(1e9);
  for (let p = 1; p < allPts.length; p++) { const a = allPts[p - 1], b = allPts[p]; if (!a || !b) continue; const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])) + 1;
    for (let k = 0; k <= n; k++) { const x = Math.round(a[0] + (b[0] - a[0]) * k / n), y = Math.round(a[1] + (b[1] - a[1]) * k / n); if (x >= 0 && y >= 0 && x < N && y < N) D[y * N + x] = 0; } }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (x > 0) D[i] = Math.min(D[i], D[i - 1] + 1); if (y > 0) D[i] = Math.min(D[i], D[i - N] + 1); if (x > 0 && y > 0) D[i] = Math.min(D[i], D[i - N - 1] + 1.414); if (x < N - 1 && y > 0) D[i] = Math.min(D[i], D[i - N + 1] + 1.414); }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; if (x < N - 1) D[i] = Math.min(D[i], D[i + 1] + 1); if (y < N - 1) D[i] = Math.min(D[i], D[i + N] + 1); if (x < N - 1 && y < N - 1) D[i] = Math.min(D[i], D[i + N + 1] + 1.414); if (x > 0 && y < N - 1) D[i] = Math.min(D[i], D[i + N - 1] + 1.414); }
  const out = new Uint8Array(N * N), q = []; const blk = i => D[i] < 2.5;   // flood from the border: what it can't reach is inside the shape
  for (let i = 0; i < N; i++) for (const j of [i, (N - 1) * N + i, i * N, i * N + N - 1]) if (!blk(j) && !out[j]) { out[j] = 1; q.push(j); }
  while (q.length) { const i = q.pop(), x = i % N, y = (i / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const j = Y * N + X; if (!out[j] && !blk(j)) { out[j] = 1; q.push(j); } } }
  const R = (cfg.supR ?? 0.40) * N, f0 = cfg.supIn ?? 0.02; for (let i = 0; i < N * N; i++) { const near = Math.min(1, D[i] / R); SUP[i] = (!out[i] && D[i] >= 2.5) ? f0 : f0 + (1 - f0) * near * near; }
  return SUP; }
function arid() { const F = bgField(), S = supField(); for (let i = 0; i < N * N; i++) if (sim.rain[i] <= 1) sim.rain[i] = cfg.bg * F[i] * S[i]; for (let i = 0; i < N * N; i++) sim.A[i] = sim.rain[i]; }
onmessage = ({ data: m }) => {
  if (m.type === 'init') { BGF = null; SUP = null; allPts = []; snap = null; budget = 0; steps = 0; ms = 0; total = 0; N = m.N; cfg = Object.assign({ playMs: 9000, minSize: 0.55, gw: 1.6, K: 0.02, Ac: 10, dt: 2, U: 0.05, ScH: 6, ScS: 2.0, H0: 20, bg: 0.05, chunk: 2, budget: 160, quiet: false, seed: 3, edges: 'f', blur: 2 }, m.cfg);
    sim = createSPL(N, { K: cfg.K, Ac: cfg.Ac, dt: cfg.dt, U: cfg.U, ScH: cfg.ScH, ScS: cfg.ScS, lakes: 1 }); mesa(sim, { seed: cfg.seed, H0: cfg.H0, edges: cfg.edges }); arid();
    if (m.stroke && m.stroke !== 'none') { const S = strokeShape(m.stroke, N); gesture(sim, S, 1.5, cfg.gw, GR); allPts = S.concat([null]); SUP = null; arid(); }
    pack(false); if (m.t) { budget = m.t; cfg.quiet = true; running = true; loop(); } }
  else if (m.type === 'begin') { if (!snap) snap = { h: sim.h.slice(), rain: sim.rain.slice() }; }   // one snapshot per multi-stroke set
  else if (m.type === 'fast') { fast = !!m.on; }
  else if (m.type === 'seg') { gesture(sim, m.pts, 1.5, cfg.gw, GR); arid(); pack(false); }     // live stroke segment: same groove + rain as shots
  else if (m.type === 'release') {
    const P = (m.pts || []); const V = P.filter(Boolean); const first = total === 0;
    if (V.length > 1) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of V) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const ext = Math.max(x1 - x0, y1 - y0, 1), MIN = (first ? cfg.minSize : 0.3) * N, LIM = first ? MIN : 0.2 * N;
      let Q = P;
      if (snap && ext < LIM) {   // shape-fidelity floor: a small drawing is re-laid at a readable size (same shape; the first set is also centred)
        const s = Math.min(MIN / ext, 5), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) * s / 2, hh = (y1 - y0) * s / 2;
        let ncx = first ? N * 0.5 : cx, ncy = first ? N * 0.54 : cy; ncx = Math.min(N * 0.93 - hw, Math.max(N * 0.07 + hw, ncx)); ncy = Math.min(N * 0.93 - hh, Math.max(N * 0.10 + hh, ncy));
        sim.h.set(snap.h); sim.rain.set(snap.rain); Q = P.map(q => q && [ncx + (q[0] - cx) * s, ncy + (q[1] - cy) * s]); gesture(sim, Q, 1.5, cfg.gw, GR);
        x0 = ncx - hw; x1 = ncx + hw; y0 = ncy - hh; y1 = ncy + hh; }
      allPts.push(...Q, null); SUP = null; arid();
      postMessage({ type: 'stroke', b: [x0, x1, y0, y1], first, cells: Q }); }
    snap = null; B0 = cfg.budget; T0 = performance.now(); budget = cfg.budget; steps = 0; ms = 0; if (!running) { running = true; loop(); } }   // budget restarts on every stroke
};
