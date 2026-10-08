/* Procedural WebAudio: evolving drone + reactive impacts. Starts on first user gesture. */
export class ForgeAudio {
  constructor(disabled = false) {
    this.disabled = disabled;
    this.ctx = null; this.on = true; this.onState = null;
  }
  unlock() {
    if (this.disabled) return;
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    const master = this.master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.3;
    master.connect(comp); comp.connect(ctx.destination);
    // reverb
    const rev = this.rev = ctx.createConvolver();
    rev.buffer = this._impulse(4.2, 2.6);
    const revGain = ctx.createGain(); revGain.gain.value = 0.55;
    rev.connect(revGain); revGain.connect(master);
    this.dry = ctx.createGain(); this.dry.gain.value = 1; this.dry.connect(master);
    this.send = ctx.createGain(); this.send.gain.value = 1; this.send.connect(rev);
    // drone
    const droneBus = this.droneBus = ctx.createGain(); droneBus.gain.value = 0.0;
    const lp = this.droneLP = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 2.5;
    droneBus.connect(lp); lp.connect(this.dry); lp.connect(this.send);
    this.oscs = [];
    const base = [55, 82.41, 110, 164.81];
    base.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 1.5) * 7;
      const g = ctx.createGain(); g.gain.value = [0.22, 0.14, 0.12, 0.06][i];
      o.connect(g); g.connect(droneBus); o.start(); this.oscs.push(o);
    });
    // slow filter LFO
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 220;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
    // airy noise bed
    const noise = this.noiseBuf = this._noise(3);
    const ns = ctx.createBufferSource(); ns.buffer = noise; ns.loop = true;
    const nbp = ctx.createBiquadFilter(); nbp.type = 'bandpass'; nbp.frequency.value = 900; nbp.Q.value = 0.6;
    const ng = ctx.createGain(); ng.gain.value = 0.018;
    ns.connect(nbp); nbp.connect(ng); ng.connect(this.send); ns.start();
    // spray whoosh
    const ss = ctx.createBufferSource(); ss.buffer = noise; ss.loop = true;
    const sbp = this.sprayBP = ctx.createBiquadFilter(); sbp.type = 'bandpass'; sbp.frequency.value = 1400; sbp.Q.value = 1.2;
    const sg = this.sprayG = ctx.createGain(); sg.gain.value = 0;
    ss.connect(sbp); sbp.connect(sg); sg.connect(this.dry); sg.connect(this.send); ss.start();
    // gravity sub hum
    const go = ctx.createOscillator(); go.type = 'sine'; go.frequency.value = 41;
    const go2 = ctx.createOscillator(); go2.type = 'sine'; go2.frequency.value = 61.7;
    const gg = this.gravG = ctx.createGain(); gg.gain.value = 0;
    go.connect(gg); go2.connect(gg); gg.connect(this.dry); gg.connect(this.send); go.start(); go2.start();
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(this.on ? 0.8 : 0, t, 0.6);
    droneBus.gain.setTargetAtTime(0.5, t, 2.5);
    this.mode(this._mode || 0, true);
    if (this.onState) this.onState(this.on);
  }
  toggle() {
    this.on = !this.on;
    if (this.ctx) this.master.gain.setTargetAtTime(this.on ? 0.8 : 0, this.ctx.currentTime, 0.15);
    return this.on;
  }
  _noise(sec) {
    const ctx = this.ctx; const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  _impulse(sec, decay) {
    const ctx = this.ctx; const len = ctx.sampleRate * sec; const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  mode(m, instant = false) {
    this._mode = m;
    if (!this.ctx) return;
    const t = this.ctx.currentTime; const tc = instant ? 0.01 : 1.2;
    const sets = [[55, 82.41, 110, 164.81], [73.42, 110, 146.83, 220], [41.2, 61.74, 82.41, 123.47]];
    const types = [['sawtooth', 'sawtooth', 'triangle', 'triangle'], ['triangle', 'sine', 'triangle', 'sine'], ['sawtooth', 'sawtooth', 'sawtooth', 'triangle']];
    this.oscs.forEach((o, i) => { o.frequency.setTargetAtTime(sets[m][i], t, tc); o.type = types[m][i]; });
    this.droneLP.frequency.setTargetAtTime([420, 900, 260][m], t, tc);
    if (!instant) this._bell(m);
  }
  _bell(m) {
    const ctx = this.ctx, t = ctx.currentTime;
    const f = [440, 659.25, 220][m];
    [1, 2.01, 3.98].forEach((k, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * k;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08 / (i + 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5 / (i + 1));
      o.connect(g); g.connect(this.send); g.connect(this.dry); o.start(t); o.stop(t + 3);
    });
  }
  shock(k = 1, kind = 'click') {
    if (!this.ctx || kind === 'intro') return;
    const ctx = this.ctx, t = ctx.currentTime;
    // thump
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(kind === 'nova' ? 70 : 120, t); o.frequency.exponentialRampToValueAtTime(kind === 'nova' ? 22 : 38, t + (kind === 'nova' ? 2.5 : 0.5));
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7 * Math.min(k, 1.5), t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'nova' ? 3.5 : 0.8));
    o.connect(g); g.connect(this.dry); g.connect(this.send); o.start(t); o.stop(t + 4);
    // crack
    const n = ctx.createBufferSource(); n.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(kind === 'nova' ? 3000 : 2400, t); bp.frequency.exponentialRampToValueAtTime(kind === 'nova' ? 90 : 300, t + (kind === 'nova' ? 3 : 0.5));
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime((kind === 'nova' ? 0.9 : 0.28) * Math.min(k, 1.5), t + 0.008); ng.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'nova' ? 4 : 0.6));
    n.connect(bp); bp.connect(ng); ng.connect(this.dry); ng.connect(this.send); n.start(t, Math.random() * 2); n.stop(t + 4.5);
  }
  nova() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // implosion riser (0.75 s) — the boom is triggered by shock('nova')
    const n = ctx.createBufferSource(); n.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.Q.value = 3;
    hp.frequency.setValueAtTime(200, t); hp.frequency.exponentialRampToValueAtTime(5000, t + 0.75);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    n.connect(hp); hp.connect(g); g.connect(this.dry); g.connect(this.send); n.start(t); n.stop(t + 1);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(40, t); o.frequency.exponentialRampToValueAtTime(320, t + 0.75);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.12, t + 0.7); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.78);
    o.connect(og); og.connect(this.send); o.start(t); o.stop(t + 1);
  }
  spray(k) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sprayG.gain.setTargetAtTime(k * 0.07, t, 0.08);
    this.sprayBP.frequency.setTargetAtTime(900 + k * 2200, t, 0.1);
  }
  grav(on) {
    if (!this.ctx) return;
    this.gravG.gain.setTargetAtTime(on ? 0.22 : 0, this.ctx.currentTime, on ? 0.25 : 0.4);
  }
}
