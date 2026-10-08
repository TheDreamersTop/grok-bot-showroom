// generic page smoke test: node pagecheck.js <url> [waitMs]
// prints console errors, page errors, failed requests and HTTP >= 400 responses; exit 1 if any.
const puppeteer = require(process.env.PUPPETEER_CORE || 'puppeteer-core'); // npm i puppeteer-core
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
(async () => {
  const url = process.argv[2]; const waitMs = +(process.argv[3] || 8000);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 0,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=1280,720'],
    defaultViewport: { width: 1280, height: 720 } });
  const page = await browser.newPage();
  const bad = []; const reqs = [];
  page.on('console', (m) => { if (m.type() === 'error') bad.push(`[console.error] ${m.text()}`); });
  page.on('pageerror', (e) => bad.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => bad.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { reqs.push(`${r.status()} ${r.url()}`); if (r.status() >= 400) bad.push(`[http ${r.status()}] ${r.url()}`); });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await new Promise((r) => setTimeout(r, waitMs));
  await page.mouse.move(400, 300); await page.mouse.move(700, 360, { steps: 8 }); await page.mouse.click(640, 360);
  for (const k of ['Digit2', 'Digit3', 'Digit1', 'Space']) { await page.keyboard.press(k); await new Promise((r) => setTimeout(r, 1000)); }
  await new Promise((r) => setTimeout(r, 2000));
  console.log('requests:\n  ' + reqs.join('\n  '));
  console.log(bad.length ? 'PROBLEMS:\n  ' + bad.join('\n  ') : 'OK: no console errors, no failed requests');
  await browser.close();
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
