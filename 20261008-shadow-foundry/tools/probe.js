const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => {
  const url = process.argv[2], secs = +(process.argv[3] || 30);
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 60000,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=1920,1080', '--hide-scrollbars'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
  const page = await browser.newPage(); const t0 = Date.now(); const T = () => ((Date.now() - t0) / 1000).toFixed(1);
  page.on('console', m => console.log(T(), `[${m.type()}] ${m.text()}`.slice(0, 300)));
  page.on('pageerror', e => console.log(T(), '[pageerror]', e.message));
  page.on('error', e => console.log(T(), '[CRASH]', e.message));
  page.on('requestfailed', r => console.log(T(), '[reqfail]', r.url()));
  await page.goto(url, { waitUntil: 'load', timeout: 120000 }); console.log(T(), 'loaded');
  for (let i = 0; i < secs / 3; i++) { await new Promise(r => setTimeout(r, 3000));
    try { const v = await page.evaluate(() => ({ ready: window.__ready, mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : -1, st: window.__st ? (typeof window.__st === 'function' ? 'fn' : JSON.stringify(window.__st).slice(0, 120)) : null })); console.log(T(), JSON.stringify(v)); }
    catch (e) { console.log(T(), 'eval fail', e.message); break; } }
  if (process.argv[4]) { await page.screenshot({ path: process.argv[4] }); console.log(T(), 'screenshot', process.argv[4]); }
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
