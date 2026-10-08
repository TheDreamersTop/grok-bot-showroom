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
  const c = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(MR, MR) : Object.assign(document.createElement('canvas'), { width: MR, height: MR });
  const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
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
  return s;
}
function sample(s, x, y) { // bilinear
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

export function forgeRods(masks, opts = {}) {
  const t0 = performance.now();
  const seed = opts.seed || 7, R = rng(seed), hull = new Hull(masks);
  const nLong = opts.nLong || 760, maxRepair = opts.maxRepair || 800;
  const rods = [];
  // diameter estimate for min length
  const minLong = opts.minLong || 0.62;
  const randDir = () => { for (;;) { const u = R() * 2 - 1, ph = R() * 6.2832, s = Math.sqrt(1 - u * u); const d = [s * Math.cos(ph), u, s * Math.sin(ph)]; if (Math.max(Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])) < 0.86) return d; } };
  const randInside = () => { for (let k = 0; k < 2000; k++) { const p = [G.C[0] + (R() - 0.5) * 3.0, G.C[1] + (R() - 0.5) * 3.0, G.C[2] + (R() - 0.5) * 3.0]; if (hull.depth(p) > 0.03) return p; } return null; };
  const pickGauge = () => { const x = R(); return x < 0.55 ? 0 : x < 0.88 ? 1 : 2; };
  let tries = 0;
  while (rods.length < nLong && tries++ < nLong * 30) {
    const p = randInside(); if (!p) break; const d = randDir(); const gi = pickGauge(); const r = GAUGE[gi];
    const [a, b] = extend(hull, p, d, r); if (a + b < minLong) continue;
    rods.push({ a: [p[0] - d[0] * a, p[1] - d[1] * a, p[2] - d[2] * a], b: [p[0] + d[0] * b, p[1] + d[1] * b, p[2] + d[2] * b], r, g: gi, kind: 'long' });
  }
  // coverage repair with shorter rods seeded on uncovered pixels, laid perpendicular to that lamp ray
  const ctxs = [mkCtx(), mkCtx(), mkCtx()];
  let cov = rasterRods(rods, ctxs), fid = fidelity(masks, cov), rounds = 0;
  while (rounds++ < 10 && Math.min(...fid) < 0.995 && rods.length < nLong + maxRepair) {
    for (let w = 0; w < 3; w++) {
      const holes = []; for (let k = 0; k < MR * MR; k++) if (masks[w][k] && !cov[w][k]) holes.push(k);
      const want = Math.min(Math.ceil(holes.length / 3), 110);
      for (let n = 0; n < want && rods.length < nLong + maxRepair; n++) {
        const k = holes[(R() * holes.length) | 0]; const q = maskToWorld(G.walls[w], (k % MR) + 0.5, ((k / MR) | 0) + 0.5); const l = G.walls[w].lamp;
        const cands = []; for (let s = 0; s <= 40; s++) { const t = 0.45 + 0.4 * s / 40; const p = [l[0] + (q[0] - l[0]) * t, l[1] + (q[1] - l[1]) * t, l[2] + (q[2] - l[2]) * t]; if (hull.depth(p) > 0.004) cands.push(p); }
        if (!cands.length) continue; const p = cands[(R() * cands.length) | 0];
        const ray = [q[0] - l[0], q[1] - l[1], q[2] - l[2]]; const rl = Math.hypot(...ray); ray[0] /= rl; ray[1] /= rl; ray[2] /= rl;
        let best = null, bl = 0;
        for (let k2 = 0; k2 < 6; k2++) { let d = randDir(); const dt = d[0] * ray[0] + d[1] * ray[1] + d[2] * ray[2]; d = [d[0] - ray[0] * dt, d[1] - ray[1] * dt, d[2] - ray[2] * dt]; const dl = Math.hypot(...d); d = [d[0] / dl, d[1] / dl, d[2] / dl]; const [a, b] = extend(hull, p, d, 0.008); if (a + b > bl) { bl = a + b; best = [d, a, b]; } }
        if (!best || bl < 0.03) continue; const [d, a, b] = best; const gi = bl > 0.5 ? 1 : 0;
        rods.push({ a: [p[0] - d[0] * a, p[1] - d[1] * a, p[2] - d[2] * a], b: [p[0] + d[0] * b, p[1] + d[1] * b, p[2] + d[2] * b], r: bl > 0.5 ? GAUGE[1] * 0.8 : 0.0095, g: gi, kind: 'repair' });
      }
    }
    cov = rasterRods(rods, ctxs); fid = fidelity(masks, cov);
  }
  // per-rod depth inside hull (for AO) and material class
  for (const r of rods) { const m = [(r.a[0] + r.b[0]) / 2, (r.a[1] + r.b[1]) / 2, (r.a[2] + r.b[2]) / 2]; r.depth = hull.depth(m); const x = R(); r.mat = x < 0.05 ? 2 : x < 0.15 ? 1 : 0; r.tone = R(); }
  return { rods, fidelity: fid, ms: performance.now() - t0, cov };
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
export function maskFromDrawT(draw, T) {
  const c = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(MR, MR) : Object.assign(document.createElement('canvas'), { width: MR, height: MR });
  const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
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
  let best = score(quickFidelity(mk(T))), n = 1;
  const lim = { sx: [0.5, 1.08], sy: [0.5, 1.08], tx: [-0.12, 0.12], ty: [-0.12, 0.12], r: [-0.35, 0.35] };
  while (n < evals) {
    const T2 = T.map(t => ({ ...t })); const i = (R() * 3) | 0; const keys = Object.keys(lim); const k = keys[(R() * keys.length) | 0];
    const span = lim[k][1] - lim[k][0]; T2[i][k] = Math.min(lim[k][1], Math.max(lim[k][0], T2[i][k] + (R() - 0.5) * span * (n < evals / 2 ? 0.35 : 0.12)));
    if (R() < 0.3) { const j = (R() * 3) | 0; const k2 = keys[(R() * keys.length) | 0]; const sp2 = lim[k2][1] - lim[k2][0]; T2[j][k2] = Math.min(lim[k2][1], Math.max(lim[k2][0], T2[j][k2] + (R() - 0.5) * sp2 * 0.2)); }
    const s = score(quickFidelity(mk(T2))); n++;
    if (s > best) { best = s; T = T2; }
  }
  const masks = mk(T);
  return { T, masks, fid: quickFidelity(masks, 2) };
}
// tight repair: only accept additions that hug the existing mask boundary (no islands)
export function repairTight(masks, maxIter = 3, maxCost = 2.2) {
  masks = masks.map(m => m.slice()); const tmp = [0, 0, 0];
  for (let it = 0; it < maxIter; it++) {
    const hull = new Hull(masks); const cov = coverageFromHull(hull); let fixed = 0;
    const add = [new Set(), new Set(), new Set()];
    for (let i = 0; i < 3; i++) {
      const w = G.walls[i];
      for (let k = 0; k < MR * MR; k++) {
        if (!masks[i][k] || cov[i][k]) continue; const px = k % MR, py = (k / MR) | 0;
        const q = maskToWorld(w, px + 0.5, py + 0.5); let best = 1e9, bp = null;
        for (let s = 0; s <= 60; s++) { const t = 0.42 + 0.46 * s / 60; const p = [w.lamp[0] + (q[0] - w.lamp[0]) * t, w.lamp[1] + (q[1] - w.lamp[1]) * t, w.lamp[2] + (q[2] - w.lamp[2]) * t];
          let c = 0; for (let j = 0; j < 3; j++) if (j !== i) { projectToMask(G.walls[j], p, tmp); const x = Math.min(MR - 1, Math.max(0, tmp[0] | 0)), y = Math.min(MR - 1, Math.max(0, tmp[1] | 0)); c += Math.max(0, hull.sdfs[j][y * MR + x] + 0.5); }
          if (c < best) { best = c; bp = p; } }
        if (bp && best <= maxCost) { for (let j = 0; j < 3; j++) if (j !== i) { projectToMask(G.walls[j], bp, tmp); const x = tmp[0] | 0, y = tmp[1] | 0; if (x >= 0 && y >= 0 && x < MR && y < MR) add[j].add(y * MR + x); } fixed++; }
      }
    }
    // fill straight segments from each added pixel to the nearest mask pixel (keeps additions connected)
    for (let j = 0; j < 3; j++) for (const k of add[j]) masks[j][k] = 1;
    if (!fixed) break;
  }
  return masks;
}
