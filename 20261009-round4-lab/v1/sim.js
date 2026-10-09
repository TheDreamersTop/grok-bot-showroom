// Implicit stream-power landscape evolution (Braun & Willett 2013, n=1) on a N×N grid, CPU.
// Per step: priority-flood fill (Barnes 2014, ε) → D8 steepest receivers on the filled surface → stack (donor DFS from
// base-level nodes) → drainage area (reverse stack) → implicit O(N) erosion  h_i ← (h_i + U·dt + F·h_r)/(1+F),
// F = K(stratum)·dt·A^m / dist, applied only where A ≥ Ac (channel initiation) → threshold-slope hillslopes (cliff retreat).
// Row j=0 is base level (the plateau edge / river outlet).
export const LAYER = 4.6, NLAY = 64;
export const HARD = Array.from({ length: NLAY }, (_, k) => { const r = Math.sin(k * 127.1 + 7.13) * 43758.5453; return (r - Math.floor(r)) < 0.45 ? 1 : 0; });
export const layerOf = (z, i, N) => { const k = Math.floor((z + ((i % N) / N - .5) * 0.8 + (((i / N) | 0) / N - .5) * 0.6) / LAYER); return ((k % NLAY) + NLAY) % NLAY; };
export function createSPL(N, opt = {}) {
  const NN = N * N, h = new Float32Array(NN), h0 = new Float32Array(NN), hf = new Float32Array(NN), A = new Float32Array(NN), rain = new Float32Array(NN).fill(1);
  const rec = new Int32Array(NN), stack = new Int32Array(NN), ndon = new Int32Array(NN), don = new Int32Array(NN * 8), dist = new Float32Array(NN);
  const P = Object.assign({ K: 0.05, m: 0.5, U: 0.1, dt: 1, Ac: 24, Sc: 1.4, ScH: 0, ScS: 0, lakes: 1, lakeMin: 0.8, layer: 4.6 }, opt);
  const W = new Float32Array(NN);  // lake water depth (filled surface − bed)
  const DX = [-1, 0, 1, -1, 1, -1, 0, 1], DY = [-1, -1, -1, 0, 0, 1, 1, 1], DL = DX.map((x, k) => Math.hypot(x, DY[k]));
  // binary heap for priority flood
  const heap = new Int32Array(NN), closed = new Uint8Array(NN); let hn = 0;
  const less = (a, b) => hf[a] < hf[b];
  const push = i => { let k = hn++; heap[k] = i; while (k > 0) { const p = (k - 1) >> 1; if (less(heap[k], heap[p])) { const t = heap[k]; heap[k] = heap[p]; heap[p] = t; k = p; } else break; } };
  const pop = () => { const r = heap[0]; heap[0] = heap[--hn]; let k = 0; for (;;) { const l = 2 * k + 1, rr = l + 1; let s = k;
    if (l < hn && less(heap[l], heap[s])) s = l; if (rr < hn && less(heap[rr], heap[s])) s = rr; if (s === k) break; const t = heap[k]; heap[k] = heap[s]; heap[s] = t; k = s; } return r; };
  let upl = 0;   // total uplift so far: strata are fixed in the rock, so layer = f(h − upl)
  const hardK = (z, i) => HARD[layerOf(z - upl, i, N)] ? 0.35 : 1.0;
  const scOf = (z, i) => P.ScH ? (HARD[layerOf(z - upl, i, N)] ? P.ScH : P.ScS) : P.Sc;
  const dipZ = i => ((i % N) / N - .5) * 2.0 + (((i / N) | 0) / N - .5) * 1.5;
  const base = new Uint8Array(NN); for (let i = 0; i < N; i++) base[i] = 1;
  const isBase = i => base[i] === 1;
  const lower = new Float32Array(NN);   // optional scripted forcing: extra base-level lowering rate (per step) along the stroke
  function step() {
    const dt = P.dt;
    // uplift (base row fixed)
    for (let i = 0; i < NN; i++) if (!base[i]) h[i] += P.U * dt - lower[i] * dt; upl += P.U * dt;
    // priority flood fill from base row
    hn = 0; closed.fill(0);
    for (let i = 0; i < NN; i++) if (base[i]) { hf[i] = h[i]; closed[i] = 1; push(i); }
    while (hn) { const c = pop(); const cx = c % N, cy = (c / N) | 0;
      for (let k = 0; k < 8; k++) { const x = cx + DX[k], y = cy + DY[k]; if (x < 0 || y < 0 || x >= N || y >= N) continue; const n = y * N + x; if (closed[n]) continue;
        closed[n] = 1; hf[n] = Math.max(h[n], hf[c] + 1e-4 * DL[k]); push(n); } }
    // receivers (steepest descent on filled surface)
    ndon.fill(0);
    for (let i = 0; i < NN; i++) { rec[i] = i; dist[i] = 1; if (isBase(i)) continue; const cx = i % N, cy = (i / N) | 0; let best = 0;
      for (let k = 0; k < 8; k++) { const x = cx + DX[k], y = cy + DY[k]; if (x < 0 || y < 0 || x >= N || y >= N) continue; const n = y * N + x;
        const s = (hf[i] - hf[n]) / DL[k]; if (s > best) { best = s; rec[i] = n; dist[i] = DL[k]; } }
      const r = rec[i]; if (r !== i) don[r * 8 + ndon[r]++] = i; }
    // stack (iterative DFS from base nodes)
    let ns = 0; const st = heap; let sp = 0;
    for (let b = 0; b < NN; b++) { if (!base[b]) continue; st[sp++] = b; while (sp) { const c = st[--sp]; stack[ns++] = c; for (let d = 0; d < ndon[c]; d++) st[sp++] = don[c * 8 + d]; } }
    // drainage area
    for (let i = 0; i < NN; i++) A[i] = rain[i];
    for (let s = ns - 1; s >= 0; s--) { const i = stack[s]; const r = rec[i]; if (r !== i) A[r] += A[i]; }
    // lakes: fill to the spill surface
    if (!P.lakes) for (let i = 0; i < NN; i++) if (hf[i] > h[i]) h[i] = hf[i];
    for (let i = 0; i < NN; i++) { const w = hf[i] - h[i]; if (w > P.lakeMin) W[i] = w; else { W[i] = 0; if (w > 0) h[i] = hf[i]; } }  // micro-pits fill, real ponds stay lakes
    // implicit fluvial incision in stack order (lake beds don't incise; the spill point does)
    for (let s = 0; s < ns; s++) { const i = stack[s]; const r = rec[i]; if (r === i || A[i] < P.Ac || W[i] > 1e-3 || h[r] > h[i]) continue;
      const F = P.K * hardK(h[i], i) * dt * Math.pow(A[i], P.m) / dist[i];
      h[i] = (h[i] + F * h[r]) / (1 + F); }
    // threshold hillslopes: nothing steeper than Sc relative to any lower neighbour (cliff retreat), two sweeps
    for (let pass = 0; pass < 2; pass++) for (let s = 0; s < ns; s++) { const i = stack[s]; if (isBase(i)) continue; const cx = i % N, cy = (i / N) | 0; let lim = h[i]; const sc = scOf(h[i], i);
      for (let k = 0; k < 8; k++) { const x = cx + DX[k], y = cy + DY[k]; if (x < 0 || y < 0 || x >= N || y >= N) continue; lim = Math.min(lim, h[y * N + x] + sc * DL[k]); }
      h[i] = lim; }
    return ns;
  }
  return { N, h, h0, hf, W, A, rain, P, step, base, lower, get upl() { return upl; } };
}
// layered plateau + a child-like gesture: groove + rain along the drag path
export function seedPlateau(sim, seed = 3, H0 = 4) {
  const { N, h, h0 } = sim; let s = seed * 9973; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const G = 32, g = new Float32Array((G + 1) * (G + 1)).map(() => rnd());
  const vn = (x, y) => { const fx = x * G, fy = y * G, ix = Math.min(G - 1, Math.floor(fx)), iy = Math.min(G - 1, Math.floor(fy)), tx = fx - ix, ty = fy - iy;
    const a = g[iy * (G + 1) + ix], b = g[iy * (G + 1) + ix + 1], c = g[(iy + 1) * (G + 1) + ix], d = g[(iy + 1) * (G + 1) + ix + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = i / N, v = j / N; const k = j * N + i;
    h[k] = j === 0 ? 0 : H0 + 1.5 * v + 0.8 * vn(u, v) + 0.3 * vn(u * 3 % 1, v * 3 % 1); h0[k] = h[k]; }
}
export function gesture(sim, pts, depth = 1.5, width = 2.2, rainBoost = 6) {   // pts in cell coords (x, y=row)
  const { N, h, rain } = sim;
  for (let p = 1; p < pts.length; p++) { const [x0, y0] = pts[p - 1], [x1, y1] = pts[p]; const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L * 2);
    for (let t = 0; t <= n; t++) { const x = x0 + (x1 - x0) * t / n, y = y0 + (y1 - y0) * t / n; const R = Math.ceil(width * 2);
      for (let yy = Math.max(1, Math.floor(y - R)); yy <= Math.min(N - 1, Math.ceil(y + R)); yy++) for (let xx = Math.max(0, Math.floor(x - R)); xx <= Math.min(N - 1, Math.ceil(x + R)); xx++) {
        const d = Math.hypot(xx - x, yy - y); const k = yy * N + xx; const w = Math.exp(-(d * d) / (width * width));
        h[k] = Math.min(h[k], sim.h0[k] - depth * w); rain[k] = Math.max(rain[k], 1 + rainBoost * w); } } }
}
export function childPath(N) {  // a wobbly hand-drawn S from near the viewer to the plateau edge (row 0)
  const pts = []; for (let k = 0; k <= 60; k++) { const t = k / 60; const y = N * (0.92 - 0.92 * t) + 0.5; const x = N * (0.5 + 0.22 * Math.sin(t * 7.0 + 0.4) + 0.03 * Math.sin(t * 31)); pts.push([x, Math.max(1, y)]); }
  return pts;
}
export function childPath2(N) {  // a second, different scribble: diagonal zig-zag from the left-near corner to the far edge, right of centre
  const pts = []; for (let k = 0; k <= 60; k++) { const t = k / 60; const y = N * (0.85 - 0.85 * t) + 0.5; const x = N * (0.18 + 0.5 * t + 0.09 * Math.sin(t * 13.0)); pts.push([x, Math.max(1, y)]); }
  return pts;
}
export function childPath3(N) {  // a stroke that ends mid-plateau (does NOT reach the outlet edge)
  const pts = []; for (let k = 0; k <= 50; k++) { const t = k / 50; const y = N * (0.88 - 0.42 * t); const x = N * (0.40 + 0.18 * t + 0.08 * Math.sin(t * 9.0)); pts.push([x, y]); }
  return pts;
}

// ---- V1: mesa initial condition, stroke shapes, metrics ----
export function mesa(sim, { seed = 3, H0 = 30, edges = 'lrf', margin = 0.06 } = {}) {   // plateau with escarpments on the given sides (l,r,f = far, n = near)
  const { N, h, h0, base } = sim; let s = seed * 9973 + 1; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const G = 32, g = new Float32Array((G + 1) * (G + 1)).map(() => rnd());
  const vn = (x, y) => { const fx = x * G, fy = y * G, ix = Math.min(G - 1, Math.floor(fx)), iy = Math.min(G - 1, Math.floor(fy)), tx = fx - ix, ty = fy - iy;
    const a = g[iy * (G + 1) + ix], b = g[iy * (G + 1) + ix + 1], c = g[(iy + 1) * (G + 1) + ix], d = g[(iy + 1) * (G + 1) + ix + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty; };
  base.fill(0);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * N + i, u = i / N, v = j / N;
    let e = 1e9; if (edges.includes('l')) e = Math.min(e, u); if (edges.includes('r')) e = Math.min(e, 1 - u); if (edges.includes('f')) e = Math.min(e, v); if (edges.includes('n')) e = Math.min(e, 1 - v);
    const isB = (edges.includes('l') && i === 0) || (edges.includes('r') && i === N - 1) || (edges.includes('f') && j === 0) || (edges.includes('n') && j === N - 1);
    const ramp = Math.min(1, Math.max(0, (e - 1 / N) / margin)); const sm = ramp * ramp * (3 - 2 * ramp);
    h[k] = isB ? 0 : H0 * sm + 0.5 * vn(u, v) + 0.2 * vn(u * 3 % 1, v * 3 % 1) + 0.3 * v; if (isB) base[k] = 1; h0[k] = h[k]; }
}
export function strokeShape(name, N) {
  const pts = [], c = [0.5 * N, 0.52 * N];
  if (name === 'heart') for (let k = 0; k <= 240; k++) { const t = k / 240 * 2 * Math.PI; const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); pts.push([c[0] + x * N / 48, c[1] - y * N / 48]); }
  else if (name === 'spiral') for (let k = 0; k <= 300; k++) { const t = k / 300; const a = t * 2.25 * 2 * Math.PI, r = N * (0.05 + 0.30 * t); pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a) * 0.95]); }
  else for (let k = 0; k <= 240; k++) { const t = k / 240; const a = (t * 2 - 1) * 1.15 * Math.PI; pts.push([c[0] - 0.22 * N * Math.sin(a), c[1] - (0.5 - t) * 0.62 * N]); }
  return pts;
}
// fraction of stroke length incised ≥ minDepth below the (uplifted) initial plateau
export function fidelity(sim, pts, steps, minDepth) {
  const { N, h, h0, P } = sim; const up = P.U * P.dt * steps; let ok = 0, n = 0, dsum = 0;
  for (const [x, y] of pts) { const i = Math.round(y) * N + Math.round(x); let d = 1e9; // min over 3x3 so a slightly-shifted channel counts
    let best = -1e9; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const k = i + dy * N + dx; if (k < 0 || k >= N * N) continue; best = Math.max(best, h0[i] + 1.5 + up - h[k]); }
    d = best; n++; dsum += d; if (d >= minDepth) ok++; }
  return { frac: ok / n, meanDepth: dsum / n };
}
