// real-mode smoke test: no ?shot, exercise inputs, collect console errors
const puppeteer = require(process.env.PUPPETEER_CORE || 'puppeteer-core'); // npm i puppeteer-core
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
(async () => {
  const url = process.argv[2];
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 0,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=960,540', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: 960, height: 540 } });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`); });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(8000);
  const info0 = await page.evaluate(() => window.__OF && window.__OF.info);
  await page.mouse.move(300, 200); await page.mouse.move(600, 300, { steps: 10 });
  await page.mouse.click(500, 280);
  await page.keyboard.down('Shift'); await page.mouse.move(400, 250, { steps: 5 }); await sleep(1500); await page.keyboard.up('Shift');
  for (const k of ['Digit2', 'Digit3', 'Digit1', 'Space', 'KeyH', 'KeyH', 'KeyM', 'KeyR', 'KeyQ']) { await page.keyboard.press(k); await sleep(1500); }
  await page.mouse.wheel({ deltaY: 300 });
  await sleep(4000);
  const info = await page.evaluate(() => ({ ...window.__OF.info, frame: window.__OF.frame }));
  console.log('info0', JSON.stringify(info0), 'info', JSON.stringify(info));
  console.log(logs.join('\n') || '(no console output)');
  await browser.close();
})().catch((e) => { console.error('ERR', e); process.exit(1); });
