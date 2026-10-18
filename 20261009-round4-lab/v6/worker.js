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
  { const B = 3, eb = sim.edgeBase; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const e = Math.min(x, N - 1 - x, N - 1 - y); if (e >= B) continue; const i = y * N + x; if (eb && eb[i] && y < 2) continue; const t = sim.h0[i] + sim.upl; h[i] = Math.max(h[i], t - (t - h[i]) * e / B); } }   /* render: the side/near border rows stay plateau, so the clamped skirt never stretches a canyon to the horizon */
  const isl = islandMask();
  for (let i = 0; i < N * N; i++) { const lake = W[i] > 0.1; out[i * 4] = lake ? h[i] + W[i] : h[i]; out[i * 4 + 1] = lake ? W[i] : (isl ? -isl[i] : 0);   /* y < 0: island (plateau ringed by a canyon) -> renderer tones it down, no lip highlight (REVIEW-06 #2) */ out[i * 4 + 3] = rain[i] > 2 ? Math.min(1, (rain[i] - 1) / GR) : 0; if (h[i] > top) top = h[i]; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; let r = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N || dx * dx + dy * dy > 5) continue; const n = yy * N + xx;
      if (A[n] > 8 && h[i] - h[n] < 0.9) { const v = Math.log2(1 + A[n] * 8); if (v > r) r = v; } }
    out[i * 4 + 2] = r; }
  postMessage({ type: 'frame', data: out, top, upl: sim.upl, steps, total, msPerStep: ms / Math.max(1, steps), budget, done, cb: carvedBox() }, [out.buffer]);
}
let bt = null, bt2 = null, hs = null;
function blurH(src, passes) { if (!passes) return src; bt = bt || new Float32Array(N * N); bt2 = bt2 || new Float32Array(N * N); let a = src, b = bt;
  for (let p = 0; p < passes; p++) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0, ws = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const wgt = (dx ? 1 : 2) * (dy ? 1 : 2); s += a[Y * N + X] * wgt; ws += wgt; }
      b[y * N + x] = s / ws; }
    a = b; b = (b === bt) ? bt2 : bt; }
  return a; }
let EH = null, EI = null;   /* REVIEW-06 #4: no erosion near the domain edge (far band + sides): the recurring far-edge pits / nubs came from soft-bed retreat there */
function edgeIdx() { if (EI) return EI; const L = []; const fb = Math.round((cfg.edgeFreeze ?? 0.17) * N), sb = Math.round(0.05 * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (y < fb || x < sb || x >= N - sb) L.push(y * N + x); return (EI = Int32Array.from(L)); }
function edgeHold() { if (cfg.edgeFreeze === 0) return null; const I = edgeIdx(); EH = EH || new Float32Array(I.length); for (let k = 0; k < I.length; k++) EH[k] = sim.h[I[k]]; return EH; }
function edgeFreeze(hp) { const I = edgeIdx(), h = sim.h, b = sim.base, eb = sim.edgeBase, du = sim.P.U * sim.P.dt; for (let k = 0; k < I.length; k++) { const i = I[k]; if (b[i] && !(eb && eb[i])) continue; const want = hp[k] + du; if (h[i] < want && !(rainHere(i))) h[i] = want; } }
const rainHere = i => sim.rain[i] > 2;   // the player's own strokes still carve there
function loop() {
  if (budget <= 0) { running = false; pack(true); return; }
  if (pauseAt && performance.now() - pauseAt < 8000) { setTimeout(loop, 40); return; } if (pauseAt) { T0 += performance.now() - pauseAt; pauseAt = 0; }   /* a later stroke is being drawn: deep time holds still until it is released, so the old canyon doesn't keep widening under the pen */
  const n = Math.min(cfg.chunk, budget), t0 = performance.now();
  if (!cfg.quiet && !fast) { const want = B0 * Math.pow(Math.min(1, (performance.now() - T0) / cfg.playMs), 1.5); /* ease-in: early incision slow + readable */ if (B0 - budget >= want) { setTimeout(loop, 12); return; } }   // paced: deep time plays over ~playMs, so the carve is watchable
  for (let k = 0; k < n; k++) { const hp = edgeHold(); sim.step(); if (hp) edgeFreeze(hp); }
  ms += performance.now() - t0; steps += n; total += n; budget -= n;
  if (!cfg.quiet || budget <= 0) pack(budget <= 0);
  if (budget > 0) setTimeout(loop, 0); else running = false;
}
let BGF = null, B0 = 1, T0 = 0, fast = false, snap = null, SUP = null, allPts = [], xf = null, ref = null, uplRef = 0, carveN = 0, pauseAt = 0, edge0 = null;
const mapXF = q => [xf.ncx + (q[0] - xf.cx) * (xf.sx || xf.s), xf.ncy + (q[1] - xf.cy) * xf.s];
function silt() {   /* every new drawing: older canyons silt in (fill 92 %, sinks and stroke rain cleared) so the new drawing stays legible (REVIEW-05 #7) */
  const { h, h0, base } = sim, eb = sim.edgeBase, u = sim.upl; for (let i = 0; i < N * N; i++) { if (eb && eb[i] && edge0[i]) continue; if (eb) eb[i] = edge0 ? edge0[i] : 0; base[i] = 0; const top = h0[i] + u, d = top - h[i]; if (d > 0) h[i] += d * (cfg.siltF ?? 0.92); }
  sim.rain.fill(0); allPts = []; SUP = null; arid(); if (edge0 && sim.edgeBase) sim.edgeBase.set(edge0); }
let ISL = null, isQ = null, OUTM = null;
function gullies(Q, seed) {   /* REVIEW-06 #3: short side canyons branching off the OUTER rim (3-6 per 100 rim cells), draining into the main canyon */
  if (cfg.gul === 0 || !OUTM) return; let s0 = (seed * 7919 + 13) % 2147483647; const rnd = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
  const V = []; let acc = 0, nextAt = 10 + rnd() * 12; const near = (x, y, r) => { for (const q of Q) if (q && (q[0] - x) ** 2 + (q[1] - y) ** 2 < r * r) return true; return false; };
  for (let k = 1; k < Q.length - 1; k++) { const a = Q[k - 1], b = Q[k], c = Q[k + 1]; if (!a || !b || !c) continue; acc += Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc < nextAt) continue; acc = 0; nextAt = (cfg.gulSp ?? 20) * (0.4 + 1.4 * rnd()); if (rnd() < 0.3) continue;
    let tx = c[0] - a[0], ty = c[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
    for (const sg of [1, -1]) { const nx = -ty * sg, ny = tx * sg, px = b[0] + nx * 12, py = b[1] + ny * 12, ix = Math.round(px), iy = Math.round(py); if (ix < 4 || iy < 4 || ix >= N - 4 || iy >= N - 4) continue; if (!OUTM[iy * N + ix] || near(px, py, 9) || near(b[0] + nx * 26, b[1] + ny * 26, 18) || near(b[0] + nx * 40, b[1] + ny * 40, 30)) continue;   /* only where the plateau is open well beyond the rim */
      const len = 5 + rnd() * rnd() * 20, bend = (rnd() - 0.5) * 1.6, g = []; let x = b[0] + nx * 3, y = b[1] + ny * 3, dx = nx, dy = ny; for (let t = 0; t <= len; t += 1.5) { g.push([x, y]); const ca = Math.cos(bend * 0.18), sa = Math.sin(bend * 0.18); [dx, dy] = [dx * ca - dy * sa, dx * sa + dy * ca]; x += dx * 1.5; y += dy * 1.5; }
      let clear = true; for (let q = 0; q < g.length; q++) if (q * 1.5 > 8 && near(g[q][0], g[q][1], 10)) { clear = false; break; }   // never reach toward another part of the drawing (spiral arms, house roof)
      if (clear && g.length > 2) { g.reverse(); V.push(...g, null); } break; } }   // drawn from the tip toward the canyon: the groove deepens toward its mouth
  for (let i = 0; i < V.length; i++) { if (!V[i]) continue; }
  gesture(sim, V, cfg.gulD ?? 0.8, cfg.gw * (cfg.gulW ?? 0.38), GR * (cfg.gulR ?? 0.16)); }
function islandMask() {   /* plateau cells that can't reach the domain border without crossing the carved canyon */
  if (!ref) return null; const h = sim.h, du = sim.upl - uplRef, NN = N * N; ISL = ISL || new Float32Array(NN); isQ = isQ || new Int32Array(NN); const cut = i => ref[i] + du - h[i] > 1.2;
  const out = new Uint8Array(NN); let qn = 0; for (let k = 0; k < N; k++) for (const j of [k, (N - 1) * N + k, k * N, k * N + N - 1]) if (!cut(j) && !out[j]) { out[j] = 1; isQ[qn++] = j; }
  while (qn) { const i = isQ[--qn], x = i % N, y = (i / N) | 0; if (x > 0 && !out[i - 1] && !cut(i - 1)) { out[i - 1] = 1; isQ[qn++] = i - 1; } if (x < N - 1 && !out[i + 1] && !cut(i + 1)) { out[i + 1] = 1; isQ[qn++] = i + 1; } if (y > 0 && !out[i - N] && !cut(i - N)) { out[i - N] = 1; isQ[qn++] = i - N; } if (y < N - 1 && !out[i + N] && !cut(i + N)) { out[i + N] = 1; isQ[qn++] = i + N; } }
  let any = false; for (let i = 0; i < NN; i++) { ISL[i] = (!out[i] && !cut(i)) ? 1 : 0; if (ISL[i]) any = true; } if (!any) return null;
  for (let pass = 0; pass < 3; pass++) for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = y * N + x; if (ISL[i] >= 1) continue; const m = Math.max(ISL[i - 1], ISL[i + 1], ISL[i - N], ISL[i + N]); if (m > 0) ISL[i] = Math.max(ISL[i], m * 0.75); }   // spill onto the island's own wall top (its lip)
  return ISL; }
function carvedBox() {   /* bbox of cells cut >1.2 below the pre-carve surface (rim included via a 2-cell pad) -> camera framing */
  if (!ref) return null; const h = sim.h, du = sim.upl - uplRef; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, lo = 1e9;
  for (let y = Math.round(0.12 * N); y < N; y++)   /* skip the far escarpment band: its soft beds retreat everywhere and are not the player's canyon */ for (let x = 0; x < N; x++) { const i = y * N + x; if (ref[i] + du - h[i] > 1.2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (h[i] < lo) lo = h[i]; } }
  return x1 >= x0 ? [x0 - 2, x1 + 2, y0 - 2, y1 + 2, lo] : null; }
   // patchy background rain (a forcing, not a canyon): side canyons get uneven lengths instead of identical lobes
function bgField() { if (BGF && BGF.length === N * N) return BGF; BGF = new Float32Array(N * N); let s = (cfg.seed || 3) * 9301 + 49297; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const G = 9, g = Array.from({ length: (G + 1) * (G + 1) }, r), G2 = 23, g2 = Array.from({ length: (G2 + 1) * (G2 + 1) }, r);
  const vn = (arr, n, x, y) => { const X = Math.min(n - 1, Math.floor(x)), Y = Math.min(n - 1, Math.floor(y)), fx = x - X, fy = y - Y, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), k = n + 1;
    return (arr[Y * k + X] * (1 - sx) + arr[Y * k + X + 1] * sx) * (1 - sy) + (arr[(Y + 1) * k + X] * (1 - sx) + arr[(Y + 1) * k + X + 1] * sx) * sy; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = 0.65 * vn(g, G, x / N * G, y / N * G) + 0.35 * vn(g2, G2, x / N * G2, y / N * G2); BGF[y * N + x] = (cfg.bgVar ?? 1) ? 0.15 + 2.2 * v * v : 1; }
  return BGF; }
const TRIB = i => { const x = i % N, y = (i / N) | 0, v = Math.sin(x * 0.37 + 1.3 * Math.sin(y * 0.11)) * Math.sin(y * 0.41 + 1.1 * Math.sin(x * 0.13)); return v > 0.35 ? (v - 0.35) * 3 : 0; };
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
  OUTM = out;
  const R = (cfg.supR ?? 0.40) * N, f0 = cfg.supIn ?? 0.02; for (let i = 0; i < N * N; i++) { const near = Math.min(1, D[i] / R); SUP[i] = (!out[i] && D[i] >= 2.5) ? f0 : f0 + (1 - f0) * near * near + (cfg.supOut || 0) * (out[i] ? 1 : 0) * Math.max(0, 1 - D[i] / (0.10 * N)) * TRIB(i); }   /* REVIEW-05 #6: a little rain on the outer rim, patchy, so short tributaries branch off the canyon */
  return SUP; }
function sinks(Q) {   /* endorheic shapes (REVIEW-04 P3-4): each stroke drains to its own playa sink inside the drawing, so no outlet canyon is cut to the plateau edge */
  if (cfg.endo === 0) return; let best = -1, bh = 1e9; const flush = () => { if (best < 0) return; const bx = best % N, by = (best / N) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = bx + dx, y = by + dy; if (x > 0 && y > 0 && x < N - 1 && y < N - 1) sim.base[y * N + x] = 1; } best = -1; bh = 1e9; };
  for (const q of Q) { if (!q) { flush(); continue; } const x = Math.round(q[0]), y = Math.round(q[1]); if (x < 2 || y < 2 || x > N - 3 || y > N - 3) continue; const i = y * N + x; if (sim.h[i] < bh) { bh = sim.h[i]; best = i; } } flush(); }
function arid() { const F = bgField(), S = supField(); for (let i = 0; i < N * N; i++) if (sim.rain[i] <= 1) { const j = Math.floor(i / N), ii = i % N, ed = Math.min(j / N, ii / N, 1 - ii / N), fb = Math.min(1, Math.max(0, (ed - 0.09) / 0.20));   /* no background rain near the escarpments: no gullies/pits at the same spots behind every shape */ sim.rain[i] = cfg.bg * F[i] * S[i] * (cfg.farDry === 0 ? 1 : fb * fb * (3 - 2 * fb)); }   /* dry band at the far escarpment: no constant outlet stubs; only the shape's own river cuts through */ for (let i = 0; i < N * N; i++) sim.A[i] = sim.rain[i]; }
onmessage = ({ data: m }) => {
  if (m.type === 'init') { EI = null; EH = null; pauseAt = 0; BGF = null; SUP = null; allPts = []; snap = null; xf = null; ref = null; carveN = 0; budget = 0; steps = 0; ms = 0; total = 0; N = m.N; cfg = Object.assign({ playMs: 9000, minSize: 0.72, gw: 3.4, K: 0.025, Ac: 10, dt: 2, U: 0.05, ScH: 6, ScS: 0.6, H0: 20, bg: 0.012, chunk: 2, budget: 170, quiet: false, seed: 3, edges: 'f', blur: 2 }, m.cfg);
    sim = createSPL(N, { K: cfg.K, Ac: cfg.Ac, dt: cfg.dt, U: cfg.U, ScH: cfg.ScH, ScS: cfg.ScS, lakes: cfg.lakes ?? 1 }); mesa(sim, { seed: cfg.seed, H0: cfg.H0, edges: cfg.edges }); if (cfg.edgeUp !== 0) { sim.edgeBase = sim.base.slice(); edge0 = sim.base.slice(); } arid();
    if (m.stroke && m.stroke !== 'none') { ref = sim.h.slice(); uplRef = sim.upl; const S = strokeShape(m.stroke, N); gesture(sim, S, 1.5, cfg.gw, GR); allPts = S.concat([null]); SUP = null; arid(); gullies(S, 1 + (cfg.seed || 3)); arid(); sinks(allPts); }
    pack(false); if (m.t) { budget = m.t; cfg.quiet = true; running = true; loop(); } }
  else if (m.type === 'begin') { if (!m.cont) { xf = null; if (total > 0) carveN++; if (carveN >= 1 && cfg.silt !== 0) silt(); }   /* every new drawing: older canyons silt up to faint ghosts, their sinks and rain are cleared, so the new shape is never swallowed by the old one (REVIEW-05 #6) */
    if (m.cont && xf && running) pauseAt = performance.now();
    if (!snap && !(m.cont && xf)) snap = { h: sim.h.slice(), rain: sim.rain.slice() }; if (!m.cont || !ref) { ref = sim.h.slice(); uplRef = sim.upl; } }   // one snapshot per multi-stroke set; a stroke that continues the drawing (grace/run) reuses the set's transform
  else if (m.type === 'fast') { fast = !!m.on; }
  else if (m.type === 'seg') { gesture(sim, xf && m.cont ? m.pts.map(mapXF) : m.pts, 1.5, cfg.gw, GR); arid(); pack(false); }     // live stroke segment: same groove + rain as shots
  else if (m.type === 'release') {
    const contXF = !!(m.cont && xf); const P = contXF ? (m.pts || []).map(q => q && mapXF(q)) : (m.pts || []); const V = P.filter(Boolean); const first = total === 0 && !contXF;   /* later strokes of the same drawing land through the first set's re-lay transform (REVIEW-05: house roof / fish tail were lost) */
    if (V.length > 1) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of V) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const ext = Math.max(x1 - x0, y1 - y0, 1), MIN = (first ? cfg.minSize : 0.3) * N, LIM = first ? MIN : 0.2 * N;
      let Q = P;
      const offside = first && (x0 < 0.08 * N || x1 > 0.92 * N || y0 < 0.10 * N || y1 > 0.88 * N);   /* near an edge: the canyon would widen into the boundary (and the skirt would stretch it to the horizon) */   /* a stroke (partly) off the plateau is re-laid onto it */
      if (!contXF) xf = { s: 1, cx: 0, cy: 0, ncx: 0, ncy: 0 };
      if (!contXF && snap && (ext < LIM || offside)) {   // shape-fidelity floor: a small drawing is re-laid at a readable size (same shape; the first set is also centred)
        const s = Math.min(MIN / ext, 5), asp = (x1 - x0) / Math.max(1, y1 - y0), st = (first && asp >= 0.3 && asp < 0.75 && cfg.stretch !== 0) ? Math.min(1.85, 0.85 / asp) : 1, sx = Math.min(s * st, (0.82 * N) / Math.max(1, x1 - x0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) * sx / 2, hh = (y1 - y0) * s / 2;   /* REVIEW-06 #1: narrow upright drawings (A, tree) are widened up to 1.45x so the postcard can hold them at >=45 % width */
        let ncx = first ? N * 0.5 : cx, ncy = first ? N * 0.58 : cy; ncx = Math.min(N * 0.91 - hw, Math.max(N * 0.09 + hw, ncx)); ncy = Math.min(N * 0.88 - hh, Math.max(N * 0.11 + hh, ncy));
        sim.h.set(snap.h); sim.rain.set(snap.rain); Q = P.map(q => q && [ncx + (q[0] - cx) * sx, ncy + (q[1] - cy) * s]); gesture(sim, Q, 1.5, cfg.gw, GR);
        x0 = ncx - hw; x1 = ncx + hw; y0 = ncy - hh; y1 = ncy + hh; xf = { s, sx, cx, cy, ncx, ncy }; }
      if (contXF && !running) { sim.rain.fill(0); gesture(sim, Q, 1.5, cfg.gw, GR); if (sim.edgeBase) for (let i = 0; i < N * N; i++) if (sim.base[i]) sim.edgeBase[i] = 1; }   /* finished canyons freeze: their sinks rise with the plateau, so they don't become ever-deeper drains that pull the new strokes through the island */   /* only the NEW strokes rain: earlier canyons of this drawing keep their shape instead of eating the island (REVIEW-05 smiley/fish) */
      allPts.push(...Q, null); SUP = null; arid(); gullies(Q, allPts.length + (cfg.seed || 3)); arid(); sinks(Q.concat([null]));
      postMessage({ type: 'stroke', b: [x0, x1, y0, y1], first, fresh: !contXF, cells: Q }); }
    snap = null; if (pauseAt) { T0 += performance.now() - pauseAt; pauseAt = 0; }
    if (contXF && running) { budget = Math.max(budget, Math.round(cfg.budget * 0.5)); B0 = steps + budget; } else if (contXF) { B0 = budget = Math.round(cfg.budget * (cfg.extB || 0.4)); T0 = performance.now(); steps = 0; ms = 0; } else { B0 = cfg.budget; T0 = performance.now(); budget = cfg.budget; steps = 0; ms = 0; } if (!running) { running = true; loop(); } }   // a stroke merged into a running carve extends it instead of restarting
};
