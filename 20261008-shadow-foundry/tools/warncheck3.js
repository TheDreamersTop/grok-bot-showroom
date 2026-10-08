const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size='+(process.env.VW||960)+','+(process.env.VH||600)], defaultViewport: { width: +(process.env.VW||960), height: +(process.env.VH||600) } });
  const page = await browser.newPage(); let errs = 0, warns = 0; const W = [];
  page.on('console', m => { const t = m.type(); if (t === 'error') { errs++; W.push('E ' + m.text()); } else if (t === 'warning') { warns++; W.push('W ' + m.text()); } else if (/quality/.test(m.text())) console.log('[log]', m.text()); });
  page.on('pageerror', e => { errs++; W.push('P ' + e.message); });
  await page.goto(process.argv[2], { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 3000));
  await page.keyboard.press('Escape'); await new Promise(r => setTimeout(r, 6000));
  for (const k of ['KeyC', 'KeyA', 'KeyT']) { await page.keyboard.press(k); await new Promise(r => setTimeout(r, 300)); }
  await page.keyboard.press('Enter'); await page.mouse.click(480, 300); await new Promise(r => setTimeout(r, +(process.env.LONG||25000)));
  const info = await page.evaluate(() => ({ perf: window.__perf, dbg: (document.getElementById('dbg') || {}).textContent, audio: window.__st && window.__st.mode }));
  console.log(JSON.stringify(info)); console.log('errors', errs, 'warnings', warns); W.slice(0, 8).forEach(x => console.log(x.slice(0, 200))); await page.screenshot({path:process.env.OUT||'gov-end.png'}); await browser.close();
})();
