const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=480,270'], defaultViewport: { width: 480, height: 270 } });
  let W = null; const page = await browser.newPage(); await page.evaluateOnNewDocument(() => { const O = Worker; window.Worker = function (u, o) { const w = new O(u, o); w.addEventListener('error', e => console.log('WORKER ERROR', e.message, e.filename, e.lineno)); w.addEventListener('message', e => console.log('MSG', e.data.type, e.data.stage || '', Math.round(e.data.ms || 0))); w.addEventListener('messageerror', e => console.log('WORKER MSGERR')); const pm = w.postMessage.bind(w); w.postMessage = (m, t) => { console.log('post', Object.keys(m).join(','), m.bitmaps && m.bitmaps.length); return pm(m, t); }; return w; }; }); const t0 = Date.now(); const T = () => ((Date.now() - t0) / 1000).toFixed(1);
  page.on('console', m => console.log(T(), `[${m.type()}] ${m.text()}`.slice(0, 300)));
  page.on('pageerror', e => console.log(T(), '[pageerror]', e.message));
  page.on('workercreated', w => { console.log(T(), 'worker created', w.url()); w.on('console', m => console.log(T(), '[W]', m.text().slice(0,300))); W = w; });
  page.on('workerdestroyed', w => console.log(T(), 'worker destroyed'));
  await page.goto(process.argv[2], { waitUntil: 'load' });
  for (let i = 0; i < 3; i++) { await new Promise(r => setTimeout(r, 4000)); console.log(T(), JSON.stringify(await page.evaluate(() => ({ lw: window.__lastWord || null, it: window.__st && window.__st.introT })))); }
  await browser.close();
})();
