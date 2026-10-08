// Procedural sound: nothing is loaded; everything is synthesized. Starts only after a user gesture.
export class Sound {
  constructor() { this.ctx = null; this.lastTick = 0; this.muted = false; try { this.muted = localStorage.getItem('shadowFoundry.muted') === '1'; } catch (e) { /* storage blocked */ } }
  ok() { return !!this.ctx && (this.offline || this.ctx.state === 'running'); }
  start() { // only inside a real user activation (Esc does not count): no autoplay warnings
    const ua = navigator.userActivation; if (ua && !ua.isActive) return;
    if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); return; }
    this.build(new (window.AudioContext || window.webkitAudioContext)());
  }
  build(C, offline = false) { this.ctx = C; this.offline = offline;
    // master → brick-wall-ish limiter → out. Mix (peak into master): clunk ≈ 0.34, storm ≈ 0.3 + 0.42 rumble, collapse hit ≈ 0.45, chord ≈ 0.30
    this.lim = C.createDynamicsCompressor(); this.lim.threshold.value = -4; this.lim.knee.value = 2; this.lim.ratio.value = 20; this.lim.attack.value = 0.002; this.lim.release.value = 0.2;
    this.out = C.createGain(); this.out.gain.value = 0.95; this.lim.connect(this.out).connect(C.destination);
    this.master = C.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(this.lim);
    // small room reverb from a generated impulse
    const len = C.sampleRate * 2.6, ir = C.createBuffer(2, len, C.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.verb = C.createConvolver(); this.verb.buffer = ir; this.verbIn = C.createGain(); this.verbIn.gain.value = 0.35; this.verbIn.connect(this.verb).connect(this.master);
    this.noise = C.createBuffer(1, C.sampleRate * 2, C.sampleRate); const nd = this.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // room tone
    const rt = this.loopNoise(); const rf = C.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 220; const rg = C.createGain(); rg.gain.value = 0.018; rt.connect(rf).connect(rg).connect(this.master);
    // rotation friction
    const fr = this.loopNoise(); this.fricF = C.createBiquadFilter(); this.fricF.type = 'bandpass'; this.fricF.frequency.value = 900; this.fricF.Q.value = 1.2; this.fricG = C.createGain(); this.fricG.gain.value = 0; fr.connect(this.fricF).connect(this.fricG).connect(this.master);
    // tuning beat: two sines, detune ∝ misalignment (beats slow to unison at the solution)
    this.tuneG = C.createGain(); this.tuneG.gain.value = 0; this.tuneG.connect(this.master); this.tuneG.connect(this.verbIn);
    this.o1 = C.createOscillator(); this.o2 = C.createOscillator(); this.o1.frequency.value = 196; this.o2.frequency.value = 196;
    const g1 = C.createGain(), g2 = C.createGain(); g1.gain.value = g2.gain.value = 0.5; this.o1.connect(g1).connect(this.tuneG); this.o2.connect(g2).connect(this.tuneG); this.o1.start(); this.o2.start();
  }
  loopNoise() { const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true; s.start(); return s; }
  setMuted(m) { this.muted = m; try { localStorage.setItem('shadowFoundry.muted', m ? '1' : '0'); } catch (e) { /* storage blocked */ } if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05); }
  visible(v) { if (!this.ctx || this.offline) return; if (!v) { if (this.ctx.state === 'running') { this.ctx.suspend(); this.autoSusp = true; } } else if (this.autoSusp) { this.autoSusp = false; this.ctx.resume(); } }
  pan(p) { const P = this.ctx.createStereoPanner(); P.pan.value = p; return P; }
  clunk(i) { if (!this.ok()) return; const C = this.ctx, t = C.currentTime, p = this.pan([-0.6, 0.6, 0][i]); p.connect(this.master); p.connect(this.verbIn);
    const o = C.createOscillator(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); const g = C.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.34, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g).connect(p); o.start(t); o.stop(t + 0.4);
    const n = C.createBufferSource(); n.buffer = this.noise; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 3; const ng = C.createGain(); ng.gain.setValueAtTime(0.16, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); n.connect(f).connect(ng).connect(p); n.start(t, Math.random()); n.stop(t + 0.06);
    // filament hum swelling in
    const h = C.createOscillator(); h.type = 'sawtooth'; h.frequency.value = 50; const hf = C.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 160; const hg = C.createGain(); hg.gain.setValueAtTime(0, t); hg.gain.linearRampToValueAtTime(0.012, t + 0.4); hg.gain.linearRampToValueAtTime(0.004, t + 2.5); h.connect(hf).connect(hg).connect(p); h.start(t); h.stop(t + 3);
  }
  update(angVel, misalign, engaged) { if (!this.ok()) return; const t = this.ctx.currentTime;
    this.fricG.gain.setTargetAtTime(Math.min(0.12, angVel * 0.9), t, 0.05); this.fricF.frequency.setTargetAtTime(500 + angVel * 2500, t, 0.08);
    const beat = 0.15 + 9 * Math.min(1, misalign / 1.2); this.o2.frequency.setTargetAtTime(196 + beat, t, 0.1);
    this.tuneG.gain.setTargetAtTime(engaged ? 0.035 * (0.4 + 0.6 * (1 - Math.min(1, misalign / 1.5))) : 0, t, 0.25);
  }
  chord() { if (!this.ok()) return; const C = this.ctx, t = C.currentTime; [[220, -0.6], [277.18, 0.6], [329.63, 0], [440, 0]].forEach(([f, pn], k) => {
    const p = this.pan(pn); p.connect(this.master); p.connect(this.verbIn); const tt = t + k * 0.06;
    for (const [mul, a] of [[1, 1], [2, 0.25], [3, 0.08]]) { const o = C.createOscillator(); o.frequency.value = f * mul; const g = C.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.058 * a, tt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, tt + 3.6); o.connect(g).connect(p); o.start(tt); o.stop(tt + 3.7); }
  }); }
  hit() { if (!this.ok()) return; const C = this.ctx, t = C.currentTime; // the forge lands: sub thump + struck-brass partials + noise burst
    const o = C.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.35); const g = C.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(g).connect(this.master); o.start(t); o.stop(t + 1);
    for (const [f, a, d] of [[311, 0.07, 2.4], [523, 0.05, 1.8], [847, 0.035, 1.3], [1371, 0.02, 0.9]]) { const q = C.createOscillator(); q.frequency.value = f; const gg = C.createGain(); gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(a, t + 0.004); gg.gain.exponentialRampToValueAtTime(0.0001, t + d); q.connect(gg); gg.connect(this.master); gg.connect(this.verbIn); q.start(t); q.stop(t + d + 0.05); }
    const n = C.createBufferSource(); n.buffer = this.noise; const f2 = C.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 1800; const g2 = C.createGain(); g2.gain.setValueAtTime(0.09, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); n.connect(f2).connect(g2).connect(this.master); n.start(t, Math.random()); n.stop(t + 0.3);
  }
  tick(pan = 0) { if (!this.ok()) return; const C = this.ctx, t = C.currentTime; if (t - this.lastTick < 0.018) return; this.lastTick = t;
    const p = this.pan(pan); p.connect(this.master); p.connect(this.verbIn); const f = 2400 + Math.random() * 2600;
    for (const m of [1, 2.76]) { const o = C.createOscillator(); o.frequency.value = f * m; const g = C.createGain(); g.gain.setValueAtTime(0.03 / m, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + Math.random() * 0.1); o.connect(g).connect(p); o.start(t); o.stop(t + 0.25); }
  }
  whoosh() { if (!this.ok()) return; const C = this.ctx, t = C.currentTime; // the storm: rising bandpassed air + a low rumble body, ~1.4 s
    const n = C.createBufferSource(); n.buffer = this.noise; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1800, t + 0.7);
    const g = C.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3); n.connect(f).connect(g).connect(this.master); g.connect(this.verbIn); n.start(t, Math.random()); n.stop(t + 1.4);
    const r = C.createBufferSource(); r.buffer = this.noise; const rf = C.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 140; const rg = C.createGain(); rg.gain.setValueAtTime(0.0001, t); rg.gain.exponentialRampToValueAtTime(0.42, t + 0.25); rg.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); r.connect(rf).connect(rg).connect(this.master); r.start(t, Math.random()); r.stop(t + 1.5); }
}
