// usage: node shot.js <url> <out.png> [timeoutSec]  — waits for window.__ready
const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => {
  const [url, out, to] = [process.argv[2], process.argv[3], +(process.argv[4] || 240)];
  const W = +(process.env.VW || 1920), H = +(process.env.VH || 1080);
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 0,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${W},${H}`, '--hide-scrollbars'],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
  const page = await browser.newPage(); const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  page.on('response', r => { if (r.status() >= 400) logs.push('[http ' + r.status() + '] ' + r.url()); });
  page.on('requestfailed', r => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  try { await page.waitForFunction('window.__ready === true', { timeout: to * 1000, polling: 250 }); } catch (e) { logs.push('[timeout waiting __ready]'); }
  if (process.env.EVAL) { await page.evaluate(process.env.EVAL); await new Promise(r => setTimeout(r, +(process.env.EVALWAIT || 1000))); }
  await page.screenshot({ path: out, type: 'png' });
  if (process.env.DUMP) { const v = await page.evaluate(process.env.DUMP); require('fs').writeFileSync(out.replace(/\.png$/, '.json'), JSON.stringify(v)); }
  console.log(logs.join('\n')); console.log('shot', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
