// usage: node shot.js <url> '<steps JSON>'   (e.g. node shot.js "http://localhost:8765/20261007-orbital-forge/?shot=1&tex=384" "$(cat seq1.json)")
// steps: [{at:N}|{ff:N}|{wait:N}|{eval:"js"}|{mouse:[x,y],steps}|{key:"Space"}|{sleep:ms}|{shot:"file.png"}]
const puppeteer = require(process.env.PUPPETEER_CORE || 'puppeteer-core'); // npm i puppeteer-core
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
(async () => {
  const [url, steps] = [process.argv[2], JSON.parse(process.argv[3] || '[]')];
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', protocolTimeout: 0,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${process.env.VW||1920},${process.env.VH||1080}`, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: +(process.env.VW||1920), height: +(process.env.VH||1080), deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  const flat = [];
  for (const s of steps) for (const k of ['ff', 'eval', 'mouse', 'key', 'sleep', 'at', 'wait', 'shot']) if (s[k] !== undefined) flat.push({ [k]: s[k], steps: s.steps });
  for (const s of flat) {
    if (s.wait !== undefined) {
      for (;;) { const f = await page.evaluate(() => window.__OF ? window.__OF.frame : -1); if (f >= s.wait) break; await new Promise((r) => setTimeout(r, 300)); }
    } else if (s.eval) {
      await page.evaluate(s.eval);
    } else if (s.shot) {
      await page.screenshot({ path: s.shot, type: 'png' });
      await page.evaluate(() => { window.__pause = false; });
      const f = await page.evaluate(() => window.__OF ? window.__OF.frame : -1);
      console.log('shot', s.shot, 'frame', f, ((Date.now() - t0) / 1000).toFixed(1) + 's');
    } else if (s.at !== undefined) {
      // fast-forward to at-2 without rendering, then render exactly up to frame `at` and freeze
      await page.evaluate(() => { window.__skipRender = true; window.__pause = false; });
      for (let it = 0;; it++) { const f = await page.evaluate(() => window.__OF ? window.__OF.frame : -1); if (it % 50 === 0) console.log('  ff', f, '->', s.at); if (f >= s.at - 3) break; await new Promise((r) => setTimeout(r, 100)); }
      await page.evaluate((n) => { window.__skipRender = false; window.__pauseAt = n; }, s.at);
      for (let it = 0;; it++) { const p = await page.evaluate(() => [!!window.__pause, window.__OF.frame, window.__pauseAt, !!window.__skipRender]); if (it % 25 === 0) console.log('  wait', JSON.stringify(p)); if (p[0]) break; await new Promise((r) => setTimeout(r, 200)); }
      for (let k = 0; k < 2; k++) { await page.evaluate(() => { window.__OF.redraw(); return window.__OF.sync(); }); await new Promise((r) => setTimeout(r, 1800)); }
    } else if (s.ff !== undefined) {
      await page.evaluate(() => { window.__skipRender = true; });
      for (;;) { const f = await page.evaluate(() => window.__OF ? window.__OF.frame : -1); if (f >= s.ff) break; await new Promise((r) => setTimeout(r, 200)); }
      await page.evaluate(() => { window.__skipRender = false; });
    } else if (s.sleep) {
      await new Promise((r) => setTimeout(r, s.sleep));
    } else if (s.mouse) {
      await page.mouse.move(s.mouse[0], s.mouse[1], { steps: s.steps || 1 });
    } else if (s.key) {
      await page.keyboard.press(s.key);
    }
  }
  console.log(logs.join('\n'));
  await browser.close();
})().catch((e) => { console.error('ERR', e); process.exit(1); });
