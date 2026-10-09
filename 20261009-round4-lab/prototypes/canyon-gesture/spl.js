// Implicit stream-power landscape evolution (Braun & Willett 2013, n=1) on a N×N grid, CPU.
// Per step: priority-flood fill (Barnes 2014, ε) → D8 steepest receivers on the filled surface → stack (donor DFS from
// base-level nodes) → drainage area (reverse stack) → implicit O(N) erosion  h_i ← (h_i + U·dt + F·h_r)/(1+F),
// F = K(stratum)·dt·A^m / dist, applied only where A ≥ Ac (channel initiation) → threshold-slope hillslopes (cliff retreat).
// Row j=0 is base level (the plateau edge / river outlet).
export function createSPL(N, opt = {}) {
  const NN = N * N, h = new Float32Array(NN), h0 = new Float32Array(NN), hf = new Float32Array(NN), A = new Float32Array(NN), rain = new Float32Array(NN).fill(1);
  const rec = new Int32Array(NN), stack = new Int32Array(NN), ndon = new Int32Array(NN), don = new Int32Array(NN * 8), dist = new Float32Array(NN);
  const P = Object.assign({ K: 0.05, m: 0.5, U: 0.1, dt: 1, Ac: 24, Sc: 1.4, layer: 4.6 }, opt);
  const DX = [-1, 0, 1, -1, 1, -1, 0, 1], DY = [-1, -1, -1, 0, 0, 1, 1, 1], DL = DX.map((x, k) => Math.hypot(x, DY[k]));
  // binary heap for priority flood
  const heap = new Int32Array(NN), closed = new Uint8Array(NN); let hn = 0;
  const less = (a, b) => hf[a] < hf[b];
  const push = i => { let k = hn++; heap[k] = i; while (k > 0) { const p = (k - 1) >> 1; if (less(heap[k], heap[p])) { const t = heap[k]; heap[k] = heap[p]; heap[p] = t; k = p; } else break; } };
  const pop = () => { const r = heap[0]; heap[0] = heap[--hn]; let k = 0; for (;;) { const l = 2 * k + 1, rr = l + 1; let s = k;
    if (l < hn && less(heap[l], heap[s])) s = l; if (rr < hn && less(heap[rr], heap[s])) s = rr; if (s === k) break; const t = heap[k]; heap[k] = heap[s]; heap[s] = t; k = s; } return r; };
  const hardK = (z, i) => { const k = Math.floor((z + dipZ(i)) / P.layer); const r = Math.sin(k * 127.1 + 7.13) * 43758.5453; const f = r - Math.floor(r); return f < 0.45 ? 0.35 : 1.0; };
  const dipZ = i => ((i % N) / N - .5) * 2.0 + (((i / N) | 0) / N - .5) * 1.5;
  const isBase = i => i < N;
  function step() {
    const dt = P.dt;
    // uplift (base row fixed)
    for (let i = N; i < NN; i++) h[i] += P.U * dt;
    // priority flood fill from base row
    hn = 0; closed.fill(0);
    for (let i = 0; i < N; i++) { hf[i] = h[i]; closed[i] = 1; push(i); }
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
    for (let b = 0; b < N; b++) { st[sp++] = b; while (sp) { const c = st[--sp]; stack[ns++] = c; for (let d = 0; d < ndon[c]; d++) st[sp++] = don[c * 8 + d]; } }
    // drainage area
    for (let i = 0; i < NN; i++) A[i] = rain[i];
    for (let s = ns - 1; s >= 0; s--) { const i = stack[s]; const r = rec[i]; if (r !== i) A[r] += A[i]; }
    // lakes: fill to the spill surface
    for (let i = 0; i < NN; i++) if (hf[i] > h[i]) h[i] = hf[i];
    // implicit fluvial incision in stack order
    for (let s = 0; s < ns; s++) { const i = stack[s]; const r = rec[i]; if (r === i || A[i] < P.Ac) continue;
      const F = P.K * hardK(h[i], i) * dt * Math.pow(A[i], P.m) / dist[i];
      h[i] = (h[i] + F * h[r]) / (1 + F); }
    // threshold hillslopes: nothing steeper than Sc relative to any lower neighbour (cliff retreat), two sweeps
    for (let pass = 0; pass < 2; pass++) for (let s = 0; s < ns; s++) { const i = stack[s]; if (isBase(i)) continue; const cx = i % N, cy = (i / N) | 0; let lim = h[i];
      for (let k = 0; k < 8; k++) { const x = cx + DX[k], y = cy + DY[k]; if (x < 0 || y < 0 || x >= N || y >= N) continue; lim = Math.min(lim, h[y * N + x] + P.Sc * DL[k]); }
      h[i] = lim; }
    return ns;
  }
  return { N, h, h0, A, rain, P, step };
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
