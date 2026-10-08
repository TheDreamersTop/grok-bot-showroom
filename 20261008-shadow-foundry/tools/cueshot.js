const puppeteer = require('/workspace/_tmp/overnight/20261007-wordverse/node_modules/puppeteer-core');
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,800'], defaultViewport: { width: 1280, height: 800 } });
  const p = await b.newPage(); let e = 0, w = 0; p.on('console', m => { if (m.type() === 'error') e++; if (m.type() === 'warning') w++; }); p.on('pageerror', () => e++);
  await p.goto(process.argv[2], { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 6000));
  const c1 = await p.evaluate(() => document.body.classList.contains('sndcue')); await p.screenshot({ path: 'cue-before.png' });
  await p.mouse.click(640, 120); await new Promise(r => setTimeout(r, 2500)); const c2 = await p.evaluate(() => document.body.classList.contains('sndcue') + ' ctx=' + (__sound.ctx && __sound.ctx.state));
  console.log('cue before gesture', c1, '| after click', c2, '| errors', e, 'warnings', w); await b.close(); })();
