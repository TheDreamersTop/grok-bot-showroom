const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core'); const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage(); await page.goto('http://localhost:8931/v1/style.css');
  for (const [label, file] of [['before', 'tmp/audio-old.js'], ['after', '/workspace/_tmp/overnight/20261008-1524-v3/v1/js/audio.js']]) {
    const src = fs.readFileSync(file, 'utf8');
    const r = await page.evaluate(async (src) => {
      const mod = await import(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      Object.defineProperty(navigator, 'userActivation', { value: { isActive: true }, configurable: true });
      const SR = 48000; const meas = (buf, a = 0, b = buf.length) => { let pk = 0, ss = 0, n = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = a; i < b; i++) { const v = Math.abs(d[i]); if (v > pk) pk = v; ss += v * v; n++; } } return { peak: +(20 * Math.log10(pk + 1e-9)).toFixed(1), rms: +(10 * Math.log10(ss / n + 1e-12)).toFixed(1) }; };
      async function render(dur, plan) { const C = new OfflineAudioContext(2, SR * dur, SR); const Orig = window.AudioContext; window.AudioContext = function () { return C; };
        const s = new mod.Sound(); s.muted = false; s.start(); window.AudioContext = Orig; s.ok = () => true; if (s.tuneG) s.tuneG.gain.value = 0;
        for (const [t, fn] of plan) { if (t === 0) fn(s); else C.suspend(t).then(() => { fn(s); C.resume(); }); }
        return C.startRendering(); }
      const out = {};
      for (const [name, fn, dur] of [['clunk', s => s.clunk(0), 2], ['storm whoosh', s => s.whoosh(), 2.5], ['collapse hit', s => s.hit(), 3], ['chord', s => s.chord(), 4.5], ['hit + chord', s => { s.hit(); s.chord(); }, 4.5]]) {
        const b = await render(dur, [[0.05, fn]]); out[name] = meas(b, 0, Math.min(b.length, SR * 1.5)); out[name].peakAll = meas(b).peak; }
      // the opening: three clunks, storm, collapse hit + chord together (the worst case for clipping)
      const b = await render(7, [[0.3, s => s.clunk(0)], [0.55, s => s.clunk(1)], [0.8, s => s.clunk(2)], [1.2, s => s.whoosh()], [2.9, s => s.whoosh()], [4.9, s => { s.hit(); s.chord(); }]]);
      out['opening (sum)'] = meas(b); out['lock moment 4.9–6 s'] = meas(b, SR * 4.9, SR * 6);
      return out; }, src);
    console.log(label, JSON.stringify(r));
  }
  await browser.close();
})();
