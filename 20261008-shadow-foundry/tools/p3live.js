const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => {
  const B = process.argv[2]; let errs = 0;
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=640,400'], defaultViewport: { width: 640, height: 400 } });
  const run = async (url, fn) => { const page = await browser.newPage(); page.on('console', m => { if (m.type() === 'error') { errs++; console.log('[error]', m.text()); } }); page.on('pageerror', e => { errs++; console.log('[pageerror]', e.message); }); await page.goto(url, { waitUntil: 'load' }); await fn(page); await page.close(); };
  const P = (page) => page.evaluate(() => ({ pw: document.getElementById('pw').innerText, hash: location.hash, mode: window.__st && window.__st.mode, slots: getComputedStyle(document.getElementById('wslots')).display, prompt: document.getElementById('wprompt').innerText }));
  await run(B + '/#w=WMW', async (p) => { await new Promise(r => setTimeout(r, 4000)); console.log('WMW early', JSON.stringify(await P(p))); await new Promise(r => setTimeout(r, 12000)); console.log('WMW +16s', JSON.stringify(await P(p))); });
  await run(B + '/#stale', async (p) => { await new Promise(r => setTimeout(r, 5000)); console.log('non-word load', JSON.stringify(await P(p))); await p.keyboard.press('Escape'); await new Promise(r => setTimeout(r, 8000));
    await p.evaluate(() => { location.hash = '#w=GEB'; }); await new Promise(r => setTimeout(r, 15000)); console.log('after hashchange #w=GEB', JSON.stringify(await P(p))); });
  console.log('errors', errs); await browser.close();
})();
