// usage: node flow.js <url> <outprefix>  — default-mode visitor flow at 800x450: skip intro, type a word, screenshots
const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => {
  const [url, out, word] = [process.argv[2], process.argv[3], process.argv[4] || 'CAT'];
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 120000,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=800,450', '--hide-scrollbars'],
    defaultViewport: { width: 800, height: 450, deviceScaleFactor: 1 } });
  const page = await browser.newPage(); const t0 = Date.now(); const T = () => ((Date.now() - t0) / 1000).toFixed(1); let errs = 0;
  page.on('console', m => { if (m.type() === 'error') errs++; console.log(T(), `[${m.type()}] ${m.text()}`.slice(0, 240)); });
  page.on('pageerror', e => { errs++; console.log(T(), '[pageerror]', e.message); });
  page.on('error', e => { errs++; console.log(T(), '[CRASH]', e.message); });
  page.on('requestfailed', r => { errs++; console.log(T(), '[reqfail]', r.url()); });
  const st = () => page.evaluate(() => ({ mode: window.__st.mode, it: +window.__st.introT.toFixed(2), t: +window.__st.t.toFixed(2) }));
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  await page.goto(url, { waitUntil: 'load', timeout: 120000 }); console.log(T(), 'loaded');
  const until = async (f, maxS) => { for (let i = 0; i < maxS * 2; i++) { const s = await st(); if (f(s)) return s; await wait(500); } return await st(); };
  if (!process.env.NOSKIP) { await wait(1500); await page.mouse.click(400, 225); console.log(T(), 'click (skip)', JSON.stringify(await st())); }
  let s = await until(s => s.mode === 'intro' && s.it > 5.3 || s.mode !== 'intro', 240); console.log(T(), 'revealed', JSON.stringify(s));
  await page.screenshot({ path: out + '-1-reveal.png' });
  if (process.env.NOTYPE) { console.log(T(), 'errors', errs); await browser.close(); return; }
  await page.keyboard.type(word, { delay: 120 }); await wait(400); await page.screenshot({ path: out + '-2-typed.png' }); console.log(T(), 'typed', JSON.stringify(await st()));
  s = await until(s => s.mode === 'shatter', 60); console.log(T(), 'shatter', JSON.stringify(s)); await wait(1500); await page.screenshot({ path: out + '-3-storm.png' });
  s = await until(s => s.mode === 'forged', 240); console.log(T(), 'forged', JSON.stringify(s)); await wait(5000); await page.screenshot({ path: out + '-4-word.png' });
  const info = await page.evaluate(() => ({ hash: location.hash, placard: document.getElementById('pw').textContent + ' | ' + document.getElementById('pm').textContent, copyVisible: !document.getElementById('bCopy').classList.contains('hidden'), last: window.__lastWord }));
  console.log(T(), JSON.stringify(info)); console.log(T(), 'errors', errs);
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
