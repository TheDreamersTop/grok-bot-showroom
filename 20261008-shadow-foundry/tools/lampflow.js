const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => {
  const Wd = +(process.env.VW || 960), Hd = +(process.env.VH || 540);
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${Wd},${Hd}`], defaultViewport: { width: Wd, height: Hd } });
  const page = await browser.newPage(); const t0 = Date.now(); const T = () => ((Date.now() - t0) / 1000).toFixed(1); let errs = 0;
  page.on('console', m => { if (m.type() === 'error') { errs++; console.log(T(), '[error]', m.text().slice(0, 200)); } });
  page.on('pageerror', e => { errs++; console.log(T(), '[pageerror]', e.message); });
  await page.goto(process.argv[2], { waitUntil: 'load' });
  const L = () => page.evaluate(() => window.__lamps && window.__lamps());
  await new Promise(r => setTimeout(r, 2500)); await page.keyboard.press('Escape');
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 1000)); const s = await page.evaluate(() => window.__st && window.__st.forgeDone); if (s) break; }
  await page.mouse.move(Wd / 2, 40); await new Promise(r => setTimeout(r, 1500));
  let s = await L(); console.log(T(), 'before', JSON.stringify(s)); const lamp = +(process.env.LAMP || 0); const [x, y] = s.screen[lamp];
  await page.mouse.move(x - 3, y - 3); await page.mouse.move(x, y); await new Promise(r => setTimeout(r, 1500)); s = await L(); console.log(T(), 'hover', JSON.stringify({ hover: s.hover, hl: s.hl, cursor: s.cursor }));
  if (process.env.SHOT1) await page.screenshot({ path: process.env.SHOT1 });
  await page.mouse.down(); const DX = +(process.env.DX || -160), DY = +(process.env.DY || 0);
  for (let k = 1; k <= 8; k++) { await page.mouse.move(x + DX * k / 8, y + DY * k / 8); await new Promise(r => setTimeout(r, 250)); }
  await new Promise(r => setTimeout(r, 2500)); s = await L(); console.log(T(), 'dragging', JSON.stringify({ off: s.off[lamp], drag: s.drag, cursor: s.cursor, hero: s.hero, mode: s.mode }));
  if (process.env.SHOT2) await page.screenshot({ path: process.env.SHOT2 });
  await page.mouse.up(); const tr = []; for (let k = 0; k < 10; k++) { await new Promise(r => setTimeout(r, 400)); s = await L(); tr.push(s.off[lamp].map(v => v.toFixed(2)).join(',') + (s.homing[lamp] ? 'h' : '')); }
  console.log(T(), 'release trace', tr.join(' | ')); console.log(T(), 'after', JSON.stringify({ off: s.off, homing: s.homing, mode: s.mode, yawUnchanged: await page.evaluate(() => window.__st.yaw) }));
  console.log('errors', errs); await browser.close();
})();
