const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 0, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=480,300'], defaultViewport: { width: 480, height: 300 } });
  const p = await b.newPage(); let e = 0, w = 0; p.on('console', m => { if (m.type() === 'error') e++; if (m.type() === 'warning') w++; }); p.on('pageerror', x => { e++; console.log('P', x.message); });
  const W = (x, to = 900000) => p.waitForFunction(x, { timeout: to, polling: 250 }); const s = () => p.evaluate(() => JSON.stringify({ m: __st.mode, yaw: +__st.yaw.toFixed(2), tilt: +__st.tilt.toFixed(2), locked: __st.locked, t: +__st.t.toFixed(1), li: +(__st.lastInput || 0).toFixed(1) }));
  await p.goto(process.argv[2], { waitUntil: 'load' }); await W(`__st && __st.mode === 'free'`); console.log('free (passive, scrambled) →', await s());
  await W(`__st.locked`); console.log('idle re-lock →', await s());
  // drag it out of alignment, then keep moving the mouse: no re-lock while there is input
  await p.mouse.move(240, 150); await p.mouse.down(); for (let i = 0; i < 12; i++) await p.mouse.move(240 + i * 12, 150 + i * 4); await p.mouse.up(); await W(`!__st.locked`, 60000); console.log('after drag →', await s());
  const t0 = await p.evaluate(() => __st.t); for (let i = 0; i < 10; i++) { await p.mouse.move(100 + i * 20, 100); await sleep(800); }
  console.log('while moving the mouse (should stay unlocked) →', await s(), 'sim-time elapsed', (await p.evaluate(() => __st.t) - t0).toFixed(1));
  await W(`__st.locked`); console.log('re-lock after input stops →', await s());
  console.log('errors', e, 'warnings', w); await b.close(); })();
