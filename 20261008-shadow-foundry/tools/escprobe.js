const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=480,300'], defaultViewport: { width: 480, height: 300 } });
  const p = await b.newPage(); p.on('pageerror', e => console.log('P', e.message)); await p.goto(process.argv[2], { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 1500)); await p.keyboard.press('Escape');
  for (let i = 0; i < 16; i++) { await new Promise(r => setTimeout(r, 8000)); console.log(await p.evaluate(() => JSON.stringify({ m: __st.mode, it: +(__st.introT || 0).toFixed(2), ww: !!__st.waitWork, sk: !!__st.skipWanted, fd: !!__st.forgeDone, t: +__st.t.toFixed(1), pw: document.getElementById('pw').textContent.slice(0, 30), hint: document.getElementById('hint').textContent }))); }
  await b.close(); })();
