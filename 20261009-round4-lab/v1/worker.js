// V1 solver worker: implicit stream-power (Braun & Willett 2013) on an arid mesa; the player's stroke is the only real rain.
import { createSPL, mesa, gesture, strokeShape } from './sim.js';
let sim, N, cfg, budget = 0, steps = 0, ms = 0, running = false, total = 0;
const GR = 60;   // stroke rain weight — identical for live strokes and deterministic shots
function pack(done) {
  const { W, A, rain } = sim, out = new Float32Array(N * N * 4); let top = -1e9;
  // render-only smoothing: the D8/threshold solver leaves cell-scale jaggies on walls; the renderer's strata terrace restores crisp cliffs
  const h = blurH(sim.h, cfg.blur);
  for (let i = 0; i < N * N; i++) { const lake = W[i] > 0.1; out[i * 4] = lake ? h[i] + W[i] : h[i]; out[i * 4 + 1] = lake ? W[i] : 0; out[i * 4 + 3] = rain[i] > 2 ? Math.min(1, (rain[i] - 1) / GR) : 0; if (h[i] > top) top = h[i]; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; let r = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N || dx * dx + dy * dy > 5) continue; const n = yy * N + xx;
      if (A[n] > 8 && h[i] - h[n] < 0.9) { const v = Math.log2(1 + A[n] * 8); if (v > r) r = v; } }
    out[i * 4 + 2] = r; }
  postMessage({ type: 'frame', data: out, top, upl: sim.upl, steps, total, msPerStep: ms / Math.max(1, steps), budget, done }, [out.buffer]);
}
let bt = null, bt2 = null;
function blurH(src, passes) { if (!passes) return src; bt = bt || new Float32Array(N * N); bt2 = bt2 || new Float32Array(N * N); let a = src, b = bt;
  for (let p = 0; p < passes; p++) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0, ws = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const wgt = (dx ? 1 : 2) * (dy ? 1 : 2); s += a[Y * N + X] * wgt; ws += wgt; }
      b[y * N + x] = s / ws; }
    a = b; b = (b === bt) ? bt2 : bt; }
  return a; }
function loop() {
  if (budget <= 0) { running = false; pack(true); return; }
  const n = Math.min(cfg.chunk, budget), t0 = performance.now();
  for (let k = 0; k < n; k++) sim.step();
  ms += performance.now() - t0; steps += n; total += n; budget -= n;
  if (!cfg.quiet || budget <= 0) pack(budget <= 0);
  if (budget > 0) setTimeout(loop, 0); else running = false;
}
function arid() { for (let i = 0; i < N * N; i++) if (sim.rain[i] <= 1) sim.rain[i] = cfg.bg; for (let i = 0; i < N * N; i++) sim.A[i] = sim.rain[i]; }
onmessage = ({ data: m }) => {
  if (m.type === 'init') { budget = 0; steps = 0; ms = 0; total = 0; N = m.N; cfg = Object.assign({ K: 0.02, Ac: 10, dt: 2, U: 0.05, ScH: 6, ScS: 2.0, H0: 20, bg: 0.05, chunk: 2, budget: 160, quiet: false, seed: 3, edges: 'f', blur: 2 }, m.cfg);
    sim = createSPL(N, { K: cfg.K, Ac: cfg.Ac, dt: cfg.dt, U: cfg.U, ScH: cfg.ScH, ScS: cfg.ScS, lakes: 1 }); mesa(sim, { seed: cfg.seed, H0: cfg.H0, edges: cfg.edges }); arid();
    if (m.stroke && m.stroke !== 'none') { gesture(sim, strokeShape(m.stroke, N), 1.5, 2.2, GR); arid(); }
    pack(false); if (m.t) { budget = m.t; cfg.quiet = true; running = true; loop(); } }
  else if (m.type === 'seg') { gesture(sim, m.pts, 1.5, 2.2, GR); arid(); pack(false); }     // live stroke segment: same groove + rain as shots
  else if (m.type === 'release') { budget = cfg.budget; steps = 0; ms = 0; if (!running) { running = true; loop(); } }   // budget restarts on every stroke
};
