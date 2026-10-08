// Forge in a worker: fit → consistency repair → rods. Posts the long rods first so the fly-in can start.
import { fitFigures, maskFromDrawT, repairTight, forgeRods, Hull, rayCoverage, fidelity, quickFidelity, trimSpurs } from './forge.js';
self.onmessage = (e) => {
  const { bitmaps, evals, seed, T: T0, lim, perm: doPerm, inOrder, trim } = e.data; let tilt = false, Tsel = null; const t0 = performance.now();
  // copy each bitmap once into a CPU canvas: a GPU-backed ImageBitmap would cost a GPU readback on every drawImage,
  // queued behind the page's WebGL frames (this stalled the forge while the scene was rendering)
  const cpu = bitmaps.map(b => { const c = new OffscreenCanvas(1000, 1000); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(b, 0, 0, 1000, 1000); g.getImageData(0, 0, 1, 1); if (b.close) b.close(); return c; });
  const D = cpu.map(c => (g) => g.drawImage(c, 0, 0, 1000, 1000)); let perm = [0, 1, 2]; let draws = D.slice(0, 3);
  if (doPerm) { // letters: typed order reads left wall (1) → right wall (0) → floor (2); bitmaps 3..5 are the floor-turned versions.
    // Another assignment is used only if it gains > 3 points of worst-wall fit (quick fit, deterministic).
    // Candidates: 6 wall orders × floor letter upright (bitmaps 3..5) or at its natural 45° (bitmaps 0..2). An alternative wins only if its
    // worst-wall gain beats the penalties: +3 points for a reorder, +6 points for the 45° floor letter.
    const DEF = [1, 0, 2]; const P = [DEF, [0, 1, 2], [0, 2, 1], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const pick = (p, tl) => p.map((li, k) => k === 2 && D.length === 6 && !tl ? D[3 + li] : D[li]);
    let bestAdj = -9, bestP = null, bestTilt = false; // stage 1: quick screen of the 11 alternatives
    if (!inOrder) for (const p of P) for (const tl of [false, true]) { if (p === DEF && !tl) continue; const d = pick(p, tl);
      const f = fitFigures(d, { evals: 16, step: 6, noFid: true, lim, seed: 5, init: [0, 1, 2].map(() => ({ sx: 0.9, sy: 0.9, tx: 0, ty: 0, r: 0 })) });
      const q = quickFidelity(d.map((dd, i) => maskFromDrawT(dd, f.T[i])), 4); const adj = Math.min(...q) - (p === DEF ? 0 : 0.03) - (tl ? 0.06 : 0);
      if (adj > bestAdj) { bestAdj = adj; bestP = p; bestTilt = tl; } }
    // stage 2: full fits of the default (typed order, upright floor) and the best alternative; the alternative must beat the penalties
    const full = (p, tl) => { const d = pick(p, tl); const f = fitFigures(d, { evals: evals || 60, noFid: true, lim, init: [0, 1, 2].map(() => ({ sx: 0.95, sy: 0.95, tx: 0, ty: 0, r: 0 })) });
      const q = quickFidelity(d.map((dd, i) => maskFromDrawT(dd, f.T[i])), 2); return { d, T: f.T, q: Math.min(...q), p, tl }; };
    const A = full(DEF, false); let pickd = A;
    if (bestP) { const B = full(bestP, bestTilt); const pen = (bestP === DEF ? 0 : 0.03) + (bestTilt ? 0.06 : 0); if (B.q - A.q > pen) pickd = B; }
    perm = pickd.p; tilt = pickd.tl; draws = pickd.d; Tsel = pickd.T; }
  maskFromDrawT(draws[0], { sx: 0.95, sy: 0.95, tx: 0, ty: 0, r: 0 }); const tWarm = performance.now() - t0;
  const T = T0 || Tsel || fitFigures(draws, { evals: evals || 60, noFid: true, lim, init: [0, 1, 2].map(() => ({ sx: 0.95, sy: 0.95, tx: 0, ty: 0, r: 0 })) }).T;
  const tFit = performance.now() - t0;
  const orig = draws.map((d, i) => maskFromDrawT(d, T[i]));
  const fixed = repairTight(orig, 3, 3.2); const tRep = performance.now() - t0;
  self.postMessage({ type: 'stage', stage: 'repaired', ms: performance.now() - t0 });
  const res = forgeRods(fixed, { seed, target: orig, onBatch: (rods) => self.postMessage({ type: 'long', rods, ms: performance.now() - t0 }) });
  const fidHull = fidelity(orig, rayCoverage(new Hull(fixed), orig, 0));
  let trimInfo = null; if (trim) { const tr = trimSpurs(res.rods, orig); trimInfo = { before: res.fidelity, clipped: tr.clipped, dropped: tr.dropped, n0: res.rods.length }; res.rods = tr.rods; res.fidelity = tr.fidelity; }
  self.postMessage({ type: 'done', rods: res.rods, T, fidHull, fidRods: res.fidelity, counts: res.counts, perm, tilt, trimInfo, stages: { warm: Math.round(tWarm), fit: Math.round(tFit), repaired: Math.round(tRep), forge: res.times }, ms: performance.now() - t0 });
};
