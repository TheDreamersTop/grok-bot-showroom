const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=480,300'], defaultViewport: { width: 480, height: 300 } });
  const p = await b.newPage(); let e = 0, w = 0; p.on('console', m => { if (m.type() === 'error') e++; if (m.type() === 'warning') w++; }); p.on('pageerror', x => { e++; console.log('P', x.message); });
  await p.goto(process.argv[2], { waitUntil: 'load' });
  await p.waitForFunction(`__st && __st.mode !== 'intro'`, { timeout: 600000, polling: 500 }); await p.click('#bNext');
  await p.waitForFunction(`__st.mode === 'shatter'`, { timeout: 60000, polling: 200 }); for (const k of ['KeyD', 'KeyO', 'KeyG']) await p.keyboard.press(k); await p.keyboard.press('Enter');
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 10000)); const s = await p.evaluate(() => JSON.stringify({ m: __st.mode, slots: document.getElementById('word').className, pw: document.getElementById('pw').textContent.slice(0, 60) })); console.log(i * 10 + 's', s); if (s.includes('DOG') && s.includes('forged')) break; }
  console.log('errors', e, 'warnings', w); await b.close(); })();
