// Forge in a worker: fit → consistency repair → rods. Posts the long rods first so the fly-in can start.
import { fitFigures, maskFromDrawT, repairTight, forgeRods, Hull, rayCoverage, fidelity } from './forge.js';
self.onmessage = (e) => {
  const { bitmaps, evals, seed, T: T0 } = e.data; const t0 = performance.now();
  const draws = bitmaps.map(b => (g) => g.drawImage(b, 0, 0, 1000, 1000));
  maskFromDrawT(draws[0], { sx: 0.95, sy: 0.95, tx: 0, ty: 0, r: 0 }); const tWarm = performance.now() - t0;
  const T = T0 || fitFigures(draws, { evals: evals || 60, noFid: true, init: [0, 1, 2].map(() => ({ sx: 0.95, sy: 0.95, tx: 0, ty: 0, r: 0 })) }).T;
  const tFit = performance.now() - t0;
  const orig = draws.map((d, i) => maskFromDrawT(d, T[i]));
  const fixed = repairTight(orig, 3, 3.2); const tRep = performance.now() - t0;
  self.postMessage({ type: 'stage', stage: 'repaired', ms: performance.now() - t0 });
  const res = forgeRods(fixed, { seed, target: orig, onBatch: (rods) => self.postMessage({ type: 'long', rods, ms: performance.now() - t0 }) });
  const fidHull = fidelity(orig, rayCoverage(new Hull(fixed), orig, 0));
  self.postMessage({ type: 'done', rods: res.rods, T, fidHull, fidRods: res.fidelity, counts: res.counts, stages: { warm: Math.round(tWarm), fit: Math.round(tFit), repaired: Math.round(tRep), forge: res.times }, ms: performance.now() - t0 });
};
