// Shadow forge: masks (on wall planes) -> signed distance fields -> visual hull under
// perspective projection from 3 lamps -> brass rods that lie entirely inside the hull.
export const MR = 384; // mask resolution

// ---------- geometry of the gallery (corner at origin; walls z=0 back, x=0 left, y=0 floor)
export const G = (() => {
  const d = 2.7, h = 2.7, L = 5.2, M = 4.1;
  const C = [d, h, d];
  // floor mask frame rotated 45deg so the figure reads upright from the diagonal camera
  const s = Math.SQRT1_2;
  return {
    d, h, L, M, C,
    walls: [
      { name: 'back', lamp: [d, h, d + L], axis: 2, plane: 0, o: [d, h, 0], u: [1, 0, 0], v: [0, 1, 0] },
      { name: 'left', lamp: [d + L, h, d], axis: 0, plane: 0, o: [0, h, d], u: [0, 0, -1], v: [0, 1, 0] },
      { name: 'floor', lamp: [d, h + L, d], axis: 1, plane: 0, o: [d, 0, d], u: [1, 0, 0], v: [0, 0, -1] },
    ],
  };
})();

// project world point p from wall's lamp onto wall plane; return mask pixel coords (x right, y down)
export function projectToMask(w, p, out) {
  const a = w.axis, l = w.lamp; const t = (w.plane - l[a]) / (p[a] - l[a]);
  const q0 = l[0] + (p[0] - l[0]) * t - w.o[0], q1 = l[1] + (p[1] - l[1]) * t - w.o[1], q2 = l[2] + (p[2] - l[2]) * t - w.o[2];
  const u = (q0 * w.u[0] + q1 * w.u[1] + q2 * w.u[2]) / G.M + 0.5, v = (q0 * w.v[0] + q1 * w.v[1] + q2 * w.v[2]) / G.M + 0.5;
  out[0] = u * MR; out[1] = (1 - v) * MR; out[2] = t; return out;
}
export function maskToWorld(w, px, py) {
  const u = px / MR - 0.5, v = (1 - py / MR) - 0.5;
  return [w.o[0] + (w.u[0] * u + w.v[0] * v) * G.M, w.o[1] + (w.u[1] * u + w.v[1] * v) * G.M, w.o[2] + (w.u[2] * u + w.v[2] * v) * G.M];
}

// ---------- masks
export function maskFromDraw(draw) {
  if (!_mc) { _mc = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(MR, MR) : Object.assign(document.createElement('canvas'), { width: MR, height: MR }); _mg = _mc.getContext('2d', { willReadFrequently: true }); }
  const c = _mc, g = _mg; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, MR, MR); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 1; g.lineCap = 'butt'; g.lineJoin = 'miter';
  g.save(); g.scale(MR / 1000, MR / 1000); draw(g); g.restore();
  return maskFromCanvas(c);
}
export function maskFromCanvas(c) {
  const g = c.getContext('2d', { willReadFrequently: true }); const d = g.getImageData(0, 0, MR, MR).data; const m = new Uint8Array(MR * MR);
  for (let i = 0; i < MR * MR; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0; return m;
}

// Felzenszwalb 1D EDT
function edt1d(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s; do { const p = v[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k]) k--; else break; } while (k >= 0);
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; }
}
function edt2d(inside) { // squared distance to nearest pixel where inside==1
  const n = MR, INF = 1e20, g = new Float64Array(n * n), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let i = 0; i < n * n; i++) g[i] = inside[i] ? 0 : INF;
  for (let x = 0; x < n; x++) { for (let y = 0; y < n; y++) f[y] = g[y * n + x]; edt1d(f, n, d, v, z); for (let y = 0; y < n; y++) g[y * n + x] = d[y]; }
  for (let y = 0; y < n; y++) { for (let x = 0; x < n; x++) f[x] = g[y * n + x]; edt1d(f, n, d, v, z); for (let x = 0; x < n; x++) g[y * n + x] = d[x]; }
  return g;
}
export function sdf(mask) { // signed distance in pixels: negative inside
  const out = edt2d(mask), inv = new Uint8Array(mask.length); for (let i = 0; i < mask.length; i++) inv[i] = 1 - mask[i];
  const inn = edt2d(inv); const s = new Float32Array(mask.length);
  for (let i = 0; i < mask.length; i++) s[i] = mask[i] ? -(Math.sqrt(inn[i]) - 0.5) : (Math.sqrt(out[i]) - 0.5);
  return SDF_SMOOTH ? smooth121(s, SDF_SMOOTH) : s;
}
// separable [1,2,1] passes: turn the binary-mask staircase into smooth level sets (cleaner rod-traced edges)
export let SDF_SMOOTH = 2; export function setSdfSmooth(n) { SDF_SMOOTH = n; }
function smooth121(s, passes) {
  const n = MR, t = new Float32Array(s.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = y * n + x; t[i] = (s[x > 0 ? i - 1 : i] + 2 * s[i] + s[x < n - 1 ? i + 1 : i]) * 0.25; }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = y * n + x; s[i] = (t[y > 0 ? i - n : i] + 2 * t[i] + t[y < n - 1 ? i + n : i]) * 0.25; }
  }
  return s;
}
function sample(s, x, y) { // bilinear; pixel k's value sits at its centre (x+0.5, y+0.5)
  x -= 0.5; y -= 0.5;
  if (x < 0 || y < 0 || x >= MR - 1 || y >= MR - 1) return 50;
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * MR + x0;
  return (s[i] * (1 - fx) + s[i + 1] * fx) * (1 - fy) + (s[i + MR] * (1 - fx) + s[i + MR + 1] * fx) * fy;
}

// world units per mask pixel at the object (approx, for converting px distances into world steps)
const PXW = G.M / MR * (G.L / (G.L + G.d));

export class Hull {
  constructor(masks) { this.masks = masks; this.sdfs = masks.map(sdf); this.tmp = [0, 0, 0]; }
  // min over walls of -sdf (positive inside), in world units
  depth(p) {
    let m = 1e9; for (let i = 0; i < 3; i++) { projectToMask(G.walls[i], p, this.tmp); const s = -sample(this.sdfs[i], this.tmp[0], this.tmp[1]) * (G.M / MR) / this.tmp[2]; if (s < m) m = s; }
    return m;
  }
}

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// Consistency repair: for uncovered pixels of mask i, find the cheapest point along the lamp ray and
// dilate the other two masks there (a local stand-in for Mitra & Pauly's 2D warp).
export function repairMasks(masks, maxIter = 2) {
  masks = masks.map(m => m.slice());
  const tmp = [0, 0, 0];
  for (let it = 0; it < maxIter; it++) {
    const hull = new Hull(masks); let fixed = 0;
    const cov = coverageFromHull(hull);
    for (let i = 0; i < 3; i++) {
      const w = G.walls[i];
      for (let py = 0; py < MR; py += 1) for (let px = 0; px < MR; px += 1) {
        const k = py * MR + px; if (!masks[i][k] || cov[i][k]) continue;
        const q = maskToWorld(w, px + 0.5, py + 0.5); let best = 1e9, bp = null;
        for (let s = 0; s <= 48; s++) { // march across the object region
          const t = 0.45 + 0.4 * s / 48; const p = [w.lamp[0] + (q[0] - w.lamp[0]) * t, w.lamp[1] + (q[1] - w.lamp[1]) * t, w.lamp[2] + (q[2] - w.lamp[2]) * t];
          let c = 0; for (let j = 0; j < 3; j++) if (j !== i) { projectToMask(G.walls[j], p, tmp); c += Math.max(0, hull.sdfs[j][Math.min(MR - 1, Math.max(0, tmp[1] | 0)) * MR + Math.min(MR - 1, Math.max(0, tmp[0] | 0))]); }
          if (c < best) { best = c; bp = p; }
        }
        if (bp && best < 7) { for (let j = 0; j < 3; j++) if (j !== i) { projectToMask(G.walls[j], bp, tmp); const cx = tmp[0] | 0, cy = tmp[1] | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < MR && y < MR) masks[j][y * MR + x] = 1; } } fixed++; }
      }
    }
    if (!fixed) break;
  }
  return masks;
}

// coverage of each mask by the projection of the hull (sampled on a 3D grid)
export function coverageFromHull(hull, res = 150) {
  const cov = [0, 1, 2].map(() => new Uint8Array(MR * MR)); const tmp = [0, 0, 0]; const half = 1.6, st = 2 * half / res;
  for (let k = 0; k < res; k++) for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
    const p = [G.C[0] - half + (i + 0.5) * st, G.C[1] - half + (j + 0.5) * st, G.C[2] - half + (k + 0.5) * st];
    if (hull.depth(p) <= 0) continue;
    for (let w = 0; w < 3; w++) { projectToMask(G.walls[w], p, tmp); const x = tmp[0] | 0, y = tmp[1] | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < MR && yy < MR) cov[w][yy * MR + xx] = 1; } }
  }
  return cov;
}

export function fidelity(masks, cov) { return masks.map((m, i) => { let t = 0, h = 0; for (let k = 0; k < m.length; k++) if (m[k]) { t++; h += cov[i][k]; } return t ? h / t : 1; }); }

// ---------- rods
const GAUGE = [0.0145, 0.023, 0.036];
function extend(hull, p, d, margin) {
  const ends = [];
  for (const sgn of [-1, 1]) {
    let t = 0; for (let it = 0; it < 400; it++) {
      const q = [p[0] + d[0] * sgn * t, p[1] + d[1] * sgn * t, p[2] + d[2] * sgn * t];
      const dep = hull.depth(q) - margin; if (dep <= 0.0015) break; t += Math.max(dep * 0.9, 0.003); if (t > 4) break;
    }
    ends.push(Math.max(0, t - 0.004));
  }
  return ends;
}
function rasterRods(rods, ctxs) {
  const tmp = [0, 0, 0], tmp2 = [0, 0, 0];
  for (let w = 0; w < 3; w++) { const g = ctxs[w]; g.clearRect(0, 0, MR, MR); g.strokeStyle = '#fff'; g.lineCap = 'round'; }
  for (const r of rods) for (let w = 0; w < 3; w++) {
    projectToMask(G.walls[w], r.a, tmp); projectToMask(G.walls[w], r.b, tmp2);
    const g = ctxs[w]; g.lineWidth = Math.max(1, 2 * r.r * 0.5 * (tmp[2] + tmp2[2]) / (G.M / MR) * 0.95); g.beginPath(); g.moveTo(tmp[0], tmp[1]); g.lineTo(tmp2[0], tmp2[1]); g.stroke();
  }
  return ctxs.map(g => { const d = g.getImageData(0, 0, MR, MR).data; const m = new Uint8Array(MR * MR); for (let i = 0; i < MR * MR; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0; return m; });
}
function mkCtx() { const c = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(MR, MR) : Object.assign(document.createElement('canvas'), { width: MR, height: MR }); return c.getContext('2d', { willReadFrequently: true }); }

// fast software rasterizer: rod capsules projected onto each wall (pixel centre within projected radius)
export function rasterAdd(r, cov, tmp = [0, 0, 0], tmp2 = [0, 0, 0]) {
  for (let w = 0; w < 3; w++) {
    projectToMask(G.walls[w], r.a, tmp); projectToMask(G.walls[w], r.b, tmp2);
    const x0 = tmp[0], y0 = tmp[1], x1 = tmp2[0], y1 = tmp2[1]; const hw = Math.max(0.5, r.r * 0.5 * (tmp[2] + tmp2[2]) / (G.M / MR));
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-9, hw2 = hw * hw, c = cov[w];
    const xa = Math.max(0, Math.floor(Math.min(x0, x1) - hw)), xb = Math.min(MR - 1, Math.ceil(Math.max(x0, x1) + hw)), ya = Math.max(0, Math.floor(Math.min(y0, y1) - hw)), yb = Math.min(MR - 1, Math.ceil(Math.max(y0, y1) + hw));
    for (let y = ya; y <= yb; y++) { const py = y + 0.5 - y0; for (let x = xa; x <= xb; x++) { const px = x + 0.5 - x0; let t = (px * dx + py * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = px - t * dx, ey = py - t * dy; if (ex * ex + ey * ey <= hw2) c[y * MR + x] = 1; } }
  }
}
export function rasterRodsSW(rods) { const cov = [0, 1, 2].map(() => new Uint8Array(MR * MR)); const t1 = [0, 0, 0], t2 = [0, 0, 0]; for (const r of rods) rasterAdd(r, cov, t1, t2); return cov; }

const EDGE_R = 0.0055;
// best point on the lamp ray through mask point (px,py) of wall w: maximises clearance in the other two masks
export function rayPoint(hull, w, px, py, need, ret) {
  const q = maskToWorld(G.walls[w], px, py), l = G.walls[w].lamp, tmp = [0, 0, 0]; let best = -1e9, bp = null;
  for (let s = 0; s <= 48; s++) { const t = 0.42 + 0.46 * s / 48; const p = [l[0] + (q[0] - l[0]) * t, l[1] + (q[1] - l[1]) * t, l[2] + (q[2] - l[2]) * t];
    let m = 1e9; for (let j = 0; j < 3; j++) if (j !== w) { projectToMask(G.walls[j], p, tmp); const v = -sample(hull.sdfs[j], tmp[0], tmp[1]) * (G.M / MR) / tmp[2]; if (v < m) m = v; }
    if (m > best) { best = m; bp = p; } }
  if (ret) return best; return best >= need ? bp : null;
}
const mkRod = (p, d, a, b, r, g, kind) => ({ a: [p[0] - d[0] * a, p[1] - d[1] * a, p[2] - d[2] * a], b: [p[0] + d[0] * b, p[1] + d[1] * b, p[2] + d[2] * b], r, g, kind });

export function forgeRods(masks, opts = {}) {
  const t0 = performance.now(); const target = opts.target || masks; const onBatch = opts.onBatch;
  const seed = opts.seed || 7, R = rng(seed), hull = new Hull(masks);
  const nLong = opts.nLong || 640, maxRepair = opts.maxRepair || 900, maxEdge = opts.maxEdge || 900;
  const rods = []; const minLong = opts.minLong || 0.78; const times = {};
  const randDir = () => { for (;;) { const u = R() * 2 - 1, ph = R() * 6.2832, s = Math.sqrt(1 - u * u); const d = [s * Math.cos(ph), u, s * Math.sin(ph)]; if (Math.max(Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])) < 0.86) return d; } };
  const randInside = () => { for (let k = 0; k < 2000; k++) { const p = [G.C[0] + (R() - 0.5) * 3.0, G.C[1] + (R() - 0.5) * 3.0, G.C[2] + (R() - 0.5) * 3.0]; if (hull.depth(p) > 0.03) return p; } return null; };
  const pickGauge = () => { const x = R(); return x < 0.55 ? 0 : x < 0.88 ? 1 : 2; };
  let tries = 0;
  while (rods.length < nLong && tries++ < nLong * 25) {
    const p = randInside(); if (!p) break; const d = randDir(); const gi = pickGauge(); const r = GAUGE[gi];
    const [a, b] = extend(hull, p, d, r); if (a + b < minLong) continue;
    rods.push(mkRod(p, d, a, b, r, gi, 'long'));
  }
  const R2 = rng(seed + 99); const finish = (r) => { if (r.mat !== undefined) return; const m = [(r.a[0] + r.b[0]) / 2, (r.a[1] + r.b[1]) / 2, (r.a[2] + r.b[2]) / 2]; r.depth = hull.depth(m); const x = R2(); r.mat = r.kind === 'edge' ? 0 : x < 0.05 ? 2 : x < 0.15 ? 1 : 0; r.tone = R2(); };
  rods.forEach(finish); times.long = performance.now() - t0; if (onBatch) onBatch(rods.slice(), 'long');
  const cov = rasterRodsSW(rods); const t1 = [0, 0, 0], t2 = [0, 0, 0];
  const add = (r) => { rods.push(r); rasterAdd(r, cov, t1, t2); };
  // 1) interior holes: thin rods laid perpendicular to the lamp ray through the hole
  let nRep = 0;
  for (let round = 0; round < 10 && nRep < maxRepair; round++) {
    let placed = 0;
    for (let w = 0; w < 3; w++) {
      const sd = hull.sdfs[w]; const holes = []; for (let k = 0; k < MR * MR; k++) if (target[w][k] && !cov[w][k] && sd[k] < -2.5) holes.push(k);
      for (let i = holes.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = holes[i]; holes[i] = holes[j]; holes[j] = t; }
      for (const k of holes) { if (cov[w][k] || nRep >= maxRepair) continue;
        const q = maskToWorld(G.walls[w], (k % MR) + 0.5, ((k / MR) | 0) + 0.5); const l = G.walls[w].lamp;
        const p = rayPoint(hull, w, (k % MR) + 0.5, ((k / MR) | 0) + 0.5, 0.0105); if (!p) continue;
        const ray = [q[0] - l[0], q[1] - l[1], q[2] - l[2]]; const rl = Math.hypot(...ray); ray[0] /= rl; ray[1] /= rl; ray[2] /= rl;
        let best = null, bl = 0;
        for (let k2 = 0; k2 < 5; k2++) { let d = randDir(); const dt = d[0] * ray[0] + d[1] * ray[1] + d[2] * ray[2]; d = [d[0] - ray[0] * dt, d[1] - ray[1] * dt, d[2] - ray[2] * dt]; const dl = Math.hypot(...d); d = [d[0] / dl, d[1] / dl, d[2] / dl]; const [a, b] = extend(hull, p, d, 0.0095); if (a + b > bl) { bl = a + b; best = [d, a, b]; } }
        if (!best || bl < 0.02) continue; const [d, a, b] = best; add(mkRod(p, d, a, b, bl > 0.5 ? GAUGE[1] * 0.8 : 0.0095, bl > 0.5 ? 1 : 0, 'repair')); nRep++; placed++;
      }
    }
    if (!placed) break;
  }
  times.repair = performance.now() - t0;
  // 2) edge rods: thin rods that run along the silhouette boundary, hugging it from inside (clean edges)
  let nEdge = 0, miss = 0; const missInfo = [];
  for (let round = 0; round < 7 && nEdge < maxEdge; round++) {
    let placed = 0;
    for (let w = 0; w < 3; w++) {
      const sd = hull.sdfs[w], W = G.walls[w]; const band = []; for (let k = 0; k < MR * MR; k++) if (target[w][k] && !cov[w][k]) band.push(k);
      for (let i = band.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = band[i]; band[i] = band[j]; band[j] = t; }
      for (const k of band) { if (cov[w][k] || nEdge >= maxEdge) continue;
        const x = (k % MR) + 0.5, y = ((k / MR) | 0) + 0.5; const s0 = sample(sd, x, y);
        let gx = sample(sd, x + 1, y) - sample(sd, x - 1, y), gy = sample(sd, x, y + 1) - sample(sd, x, y - 1); const gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl;
        const tsc = 1.5, hwpx = EDGE_R * tsc / (G.M / MR); const sStar = Math.min(s0, -hwpx * 1.0); const qx = x - gx * (s0 - sStar), qy = y - gy * (s0 - sStar);
        const p = rayPoint(hull, w, qx, qy, EDGE_R * 0.28); if (!p) continue;
        let best = null, bl = 0;
        for (const ang of [0, 0.2, -0.2, 0.45, -0.45]) { const ca = Math.cos(ang), sa = Math.sin(ang); const tx = -gy * ca - gx * sa, ty = gx * ca - gy * sa;
          let d = [W.u[0] * tx - W.v[0] * ty, W.u[1] * tx - W.v[1] * ty, W.u[2] * tx - W.v[2] * ty]; const dl = Math.hypot(...d); d = [d[0] / dl, d[1] / dl, d[2] / dl];
          const [a, b] = extend(hull, p, d, EDGE_R * 0.42); if (a + b > bl) { bl = a + b; best = [d, a, b]; } if (bl > 0.15) break; }
        if (!best) continue; const [d, a, b] = best; const L = Math.max(bl, 0.004);
        const aa = bl < 0.004 ? 0.002 : a, bb = bl < 0.004 ? 0.002 : b;
        add(mkRod(p, d, aa, bb, EDGE_R, 0, 'edge')); nEdge++; placed++; if (!cov[w][k]) { miss++; if (missInfo.length < 5) { projectToMask(W, p, t1); missInfo.push([x, y, +qx.toFixed(2), +qy.toFixed(2), +t1[0].toFixed(2), +t1[1].toFixed(2), +s0.toFixed(2), +bl.toFixed(4)]); } }
      }
    }
    if (!placed) break;
  }
  times.edge = performance.now() - t0;
  const fid = fidelity(target, cov);
  rods.forEach(finish);
  return { rods, fidelity: fid, ms: performance.now() - t0, cov, times, counts: { long: rods.filter(r => r.kind === 'long').length, repair: nRep, edge: nEdge, miss, missInfo } };
}

// spur trim: rods whose shadow strays outside a target ("hairs") are clipped to their longest inside run, or dropped if mostly outside
export function trimSpurs(rods, targets, opts = {}) {
  const tol = opts.tol ?? 2.5, N = opts.n ?? 14, keepFrac = opts.keep ?? 0.45, minLen = opts.minLen ?? 0.12;
  const S = targets.map(t => sdf(t)); const tmp = [0, 0, 0], out = []; let clipped = 0, dropped = 0;
  const inside = (p) => { for (let w = 0; w < 3; w++) { projectToMask(G.walls[w], p, tmp); const x = tmp[0], y = tmp[1]; if (x < 0 || y < 0 || x >= MR || y >= MR) return false; if (sample(S[w], x, y) > tol) return false; } return true; };
  const P = [0, 0, 0];
  for (const r of rods) {
    const ok = []; for (let k = 0; k <= N; k++) { const t = k / N; P[0] = r.a[0] + (r.b[0] - r.a[0]) * t; P[1] = r.a[1] + (r.b[1] - r.a[1]) * t; P[2] = r.a[2] + (r.b[2] - r.a[2]) * t; ok.push(inside(P)); }
    if (ok.every(Boolean)) { out.push(r); continue; }
    let best = [0, -1], s0 = -1; for (let k = 0; k <= N + 1; k++) { if (k <= N && ok[k]) { if (s0 < 0) s0 = k; } else if (s0 >= 0) { if (k - 1 - s0 > best[1] - best[0]) best = [s0, k - 1]; s0 = -1; } }
    const L = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1], r.b[2] - r.a[2]); const frac = best[1] < 0 ? 0 : (best[1] - best[0]) / N;
    if (frac < keepFrac || frac * L < minLen) { dropped++; continue; }
    const ta = best[0] / N, tb = best[1] / N; const lerp = (t) => [0, 1, 2].map(i => r.a[i] + (r.b[i] - r.a[i]) * t);
    out.push({ ...r, a: lerp(ta), b: lerp(tb) }); clipped++;
  }
  const cov = rasterRodsSW(out); return { rods: out, fidelity: fidelity(targets, cov), clipped, dropped };
}

// shadow projection of the posed hull for scramble entropy (IoU) — uses rods for speed
export function projectRodsPosed(rods, quat, res = 96) {
  const masks = [0, 1, 2].map(() => new Uint8Array(res * res)); const tmp = [0, 0, 0]; const sc = res / MR;
  const rot = (p) => { const [x, y, z] = [p[0] - G.C[0], p[1] - G.C[1], p[2] - G.C[2]]; const [qx, qy, qz, qw] = quat; const ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z; return [ix * qw + iw * -qx + iy * -qz - iz * -qy + G.C[0], iy * qw + iw * -qy + iz * -qx - ix * -qz + G.C[1], iz * qw + iw * -qz + ix * -qy - iy * -qx + G.C[2]]; };
  for (const r of rods) { const a = rot(r.a), b = rot(r.b); const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.02) + 1; for (let s = 0; s <= n; s++) { const t = s / n; const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; for (let w = 0; w < 3; w++) { projectToMask(G.walls[w], p, tmp); const x = (tmp[0] * sc) | 0, y = (tmp[1] * sc) | 0; if (x >= 0 && y >= 0 && x < res && y < res) masks[w][y * res + x] = 1; } } }
  return masks;
}
export function downMask(m, res = 96) { const o = new Uint8Array(res * res), f = MR / res; for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) { let s = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) s += m[((y * f + j) | 0) * MR + ((x * f + i) | 0)]; o[y * res + x] = s > f * f / 2 ? 1 : 0; } return o; }
export function maxIoU(a, targets, res = 96) { // vs every target, incl. 4 rotations x mirror
  let best = 0;
  for (const t of targets) for (let rot = 0; rot < 4; rot++) for (let mir = 0; mir < 2; mir++) {
    let I = 0, U = 0;
    for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) { let X = mir ? res - 1 - x : x, Y = y; for (let r = 0; r < rot; r++) { const t2 = X; X = res - 1 - Y; Y = t2; } const av = a[y * res + x], tv = t[Y * res + X]; I += av & tv; U += av | tv; }
    best = Math.max(best, U ? I / U : 0);
  }
  return best;
}

// ---------- automatic figure fitting (cheap stand-in for Mitra & Pauly's warp):
// search per-figure similarity transforms (scale x/y, offset, rotation) maximizing hull fidelity.
let _mc = null, _mg = null;
export function maskFromDrawT(draw, T) {
  if (!_mc) { _mc = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(MR, MR) : Object.assign(document.createElement('canvas'), { width: MR, height: MR }); _mg = _mc.getContext('2d', { willReadFrequently: true }); }
  const c = _mc, g = _mg; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, MR, MR); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 1; g.lineCap = 'butt'; g.lineJoin = 'miter';
  g.save(); g.translate(MR * (0.5 + T.tx), MR * (0.5 + T.ty)); g.rotate(T.r); g.scale(T.sx * MR / 1000, T.sy * MR / 1000); g.translate(-500, -500); draw(g); g.restore();
  return maskFromCanvas(c);
}
export function quickFidelity(masks, step = 4) {
  const tmp = [0, 0, 0]; const out = [];
  for (let i = 0; i < 3; i++) {
    const w = G.walls[i]; let tot = 0, hit = 0;
    for (let py = (step >> 1); py < MR; py += step) for (let px = (step >> 1); px < MR; px += step) {
      if (!masks[i][py * MR + px]) continue; tot++;
      const q = maskToWorld(w, px + 0.5, py + 0.5); let ok = false;
      for (let s = 0; s <= 40 && !ok; s++) {
        const t = 0.42 + 0.46 * s / 40; const p = [w.lamp[0] + (q[0] - w.lamp[0]) * t, w.lamp[1] + (q[1] - w.lamp[1]) * t, w.lamp[2] + (q[2] - w.lamp[2]) * t];
        let inAll = true; for (let j = 0; j < 3 && inAll; j++) if (j !== i) { projectToMask(G.walls[j], p, tmp); const x = tmp[0] | 0, y = tmp[1] | 0; inAll = x >= 0 && y >= 0 && x < MR && y < MR && masks[j][y * MR + x] === 1; }
        ok = inAll;
      }
      hit += ok ? 1 : 0;
    }
    out.push(tot ? hit / tot : 1);
  }
  return out;
}
export function fitFigures(draws, opts = {}) {
  const R = rng(opts.seed || 3); const evals = opts.evals || 120;
  const score = (f) => Math.min(...f) + 0.25 * (f[0] + f[1] + f[2]) / 3;
  let T = (opts.init || [0, 1, 2].map(() => ({ sx: 0.9, sy: 0.9, tx: 0, ty: 0, r: 0 }))).map(t => ({ ...t }));
  const mk = (T) => draws.map((d, i) => maskFromDrawT(d, T[i]));
  const st = opts.step || 4; let best = score(quickFidelity(mk(T), st)), n = 1;
  const lim = opts.lim || { sx: [0.5, 1.08], sy: [0.5, 1.08], tx: [-0.12, 0.12], ty: [-0.12, 0.12], r: [-0.35, 0.35] };
  while (n < evals) {
    const T2 = T.map(t => ({ ...t })); const i = (R() * 3) | 0; const keys = Object.keys(lim); const k = keys[(R() * keys.length) | 0];
    const span = lim[k][1] - lim[k][0]; T2[i][k] = Math.min(lim[k][1], Math.max(lim[k][0], T2[i][k] + (R() - 0.5) * span * (opts.fine ? 0.06 : (n < evals / 2 ? 0.35 : 0.12))));
    if (R() < 0.3) { const j = (R() * 3) | 0; const k2 = keys[(R() * keys.length) | 0]; const sp2 = lim[k2][1] - lim[k2][0]; T2[j][k2] = Math.min(lim[k2][1], Math.max(lim[k2][0], T2[j][k2] + (R() - 0.5) * sp2 * 0.2)); }
    const s = score(quickFidelity(mk(T2), st)); n++;
    if (s > best) { best = s; T = T2; }
  }
  const masks = mk(T);
  return { T, masks, fid: opts.noFid ? null : quickFidelity(masks, 2) };
}
// exact coverage: target pixel is reachable iff some point on its lamp ray has clearance >= tau in the other two masks
export function rayCoverage(hull, target, tau = 0.003) {
  const cov = [0, 1, 2].map(() => new Uint8Array(MR * MR));
  for (let w = 0; w < 3; w++) for (let k = 0; k < MR * MR; k++) { if (!target[w][k]) continue; if (rayPoint(hull, w, (k % MR) + 0.5, ((k / MR) | 0) + 0.5, tau, true) >= tau) cov[w][k] = 1; }
  return cov;
}
// tight repair driven by the exact ray test: for each unreachable pixel find the cheapest point on its ray
// and stamp a small disc into the other masks there (additions hug the existing boundary; no islands)
export function repairTight(masks, maxIter = 3, maxCost = 3.2, tau = 0.0035) {
  const target = masks; masks = masks.map(m => m.slice()); const tmp = [0, 0, 0];
  const tauPx = (t) => tau * t / (G.M / MR);
  for (let it = 0; it < maxIter; it++) {
    const hull = new Hull(masks); const cov = rayCoverage(hull, target, tau); let fixed = 0;
    const add = [[], [], []];
    for (let i = 0; i < 3; i++) {
      const w = G.walls[i];
      for (let k = 0; k < MR * MR; k++) {
        if (!target[i][k] || cov[i][k]) continue; const px = k % MR, py = (k / MR) | 0;
        const q = maskToWorld(w, px + 0.5, py + 0.5); let best = 1e9, bp = null;
        for (let s = 0; s <= 60; s++) { const t = 0.42 + 0.46 * s / 60; const p = [w.lamp[0] + (q[0] - w.lamp[0]) * t, w.lamp[1] + (q[1] - w.lamp[1]) * t, w.lamp[2] + (q[2] - w.lamp[2]) * t];
          let c = 0; for (let j = 0; j < 3; j++) if (j !== i) { projectToMask(G.walls[j], p, tmp); c += Math.max(0, sample(hull.sdfs[j], tmp[0], tmp[1]) + tauPx(tmp[2]) + 0.3); }
          if (c < best) { best = c; bp = p; } }
        if (bp && best <= maxCost) { for (let j = 0; j < 3; j++) if (j !== i) { projectToMask(G.walls[j], bp, tmp); if (sample(hull.sdfs[j], tmp[0], tmp[1]) + tauPx(tmp[2]) + 0.3 > 0) add[j].push(tmp[0], tmp[1], tauPx(tmp[2]) + 0.9); } fixed++; }
      }
    }
    for (let j = 0; j < 3; j++) { const A = add[j]; for (let n = 0; n < A.length; n += 3) { const cx = A[n], cy = A[n + 1], rr = A[n + 2]; const r2 = rr * rr;
      for (let y = Math.max(0, Math.floor(cy - rr)); y <= Math.min(MR - 1, Math.ceil(cy + rr)); y++) for (let x = Math.max(0, Math.floor(cx - rr)); x <= Math.min(MR - 1, Math.ceil(cx + rr)); x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r2) masks[j][y * MR + x] = 1; } } }
    if (!fixed) break;
  }
  return masks;
}
