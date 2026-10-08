const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=640,360'], defaultViewport: { width: 640, height: 360 } });
  const page = await browser.newPage(); const t0 = Date.now(); const T = () => ((Date.now() - t0) / 1000).toFixed(1); let errs = 0;
  page.on('console', m => { if (m.type() === 'error') errs++; console.log(T(), `[${m.type()}] ${m.text()}`.slice(0, 200)); });
  page.on('pageerror', e => { errs++; console.log(T(), '[pageerror]', e.message); });
  await page.goto(process.argv[2], { waitUntil: 'load' });
  const S = async () => page.evaluate(() => { const s = window.__st || {}; return { mode: s.mode, it: +(s.introT || 0).toFixed(2), t: +(s.t || 0).toFixed(1), fd: s.forgeDone, slots: [...document.querySelectorAll('#word')].map(e => e.className).join(), url: location.hash, placard: (document.querySelector('#placard') || {}).innerText }; });
  await new Promise(r => setTimeout(r, 3000)); await page.mouse.click(320, 180); await page.keyboard.press('Escape');
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 1000)); const s = await S(); if (s.fd) { console.log(T(), 'intro done', JSON.stringify(s)); break; } }
  for (const k of ['C', 'A', 'T']) { await page.keyboard.press('Key' + k); await new Promise(r => setTimeout(r, 300)); }
  console.log(T(), 'typed', JSON.stringify(await S())); await page.keyboard.press('Enter');
  const seen = []; for (let i = 0; i < 60; i++) { await new Promise(r => setTimeout(r, 1500)); const s = await S(); if (seen[seen.length - 1] !== s.mode) { seen.push(s.mode); console.log(T(), 'mode', JSON.stringify(s)); } if (s.mode === 'forged' && i > 3) { await new Promise(r => setTimeout(r, 6000)); break; } }
  console.log(T(), 'final', JSON.stringify(await S())); await page.screenshot({ path: process.argv[3] }); console.log('errors', errs, 'modes', seen.join(' > '));
  await browser.close();
})();
