// Procedural silhouettes (font-independent). Coordinates: 1000x1000 canvas, y down.
// Each figure is drawn so it reads correctly as seen from the gallery camera.
const ell = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, Math.PI * 2); g.fill(); };
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };

export const FIGURES = {
  cat(g) { // sitting cat in profile, facing right, tail curling up behind
    g.save(); g.translate(-105, 0);
    ell(g, 470, 700, 170, 215);          // haunch
    ell(g, 570, 560, 112, 175, -0.12);   // chest
    ell(g, 600, 345, 112, 102);          // head
    ell(g, 700, 380, 48, 34);            // muzzle
    poly(g, [[515, 300], [528, 165], [612, 255]]);   // far ear (short, wide)
    poly(g, [[608, 250], [688, 150], [706, 300]]);   // near ear
    g.beginPath(); g.roundRect(570, 640, 78, 270, 30); g.fill();   // front legs
    ell(g, 515, 900, 200, 34);           // paws/base
    g.lineWidth = 60; g.lineCap = 'round'; g.beginPath(); g.moveTo(360, 870);
    g.bezierCurveTo(215, 880, 190, 720, 250, 600); g.bezierCurveTo(280, 540, 300, 515, 292, 470); g.stroke();
    g.restore();
  },
  tree(g) { // deciduous tree: rooted trunk, forked branches, clustered canopy with gaps
    poly(g, [[400, 935], [600, 935], [560, 900], [545, 620], [455, 620], [440, 900]]); // trunk with root flare
    g.lineCap = 'round';
    g.lineWidth = 60; g.beginPath(); g.moveTo(500, 650); g.quadraticCurveTo(450, 520, 320, 450); g.stroke();
    g.beginPath(); g.moveTo(500, 650); g.quadraticCurveTo(560, 520, 690, 440); g.stroke();
    g.lineWidth = 50; g.beginPath(); g.moveTo(500, 640); g.lineTo(505, 330); g.stroke();
    for (const [x, y, r] of [[290, 420, 125], [218, 335, 78], [390, 270, 140], [510, 160, 125], [650, 260, 145], [772, 352, 90], [720, 440, 100], [350, 140, 75], [680, 120, 85], [500, 330, 110], [505, 98, 60]]) ell(g, x, y, r, r * 0.92);
  },
  swallow(g) { // swallow seen from above: long crescent wings, deeply forked tail
    g.save(); g.translate(0, 45);
    ell(g, 500, 470, 62, 170);           // body
    ell(g, 500, 300, 58, 58);            // head
    poly(g, [[485, 248], [500, 205], [515, 248]]); // beak
    g.beginPath(); g.moveTo(468, 395); g.bezierCurveTo(380, 330, 210, 350, 40, 430); g.bezierCurveTo(200, 450, 330, 480, 470, 525); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(532, 395); g.bezierCurveTo(620, 330, 790, 350, 960, 430); g.bezierCurveTo(800, 450, 670, 480, 530, 525); g.closePath(); g.fill();
    poly(g, [[455, 600], [545, 600], [560, 640], [612, 845], [578, 700], [500, 655], [422, 700], [388, 845], [440, 640]]);
    g.restore();
  },
  // second preset set
  hand(g) { ell(g, 500, 640, 190, 230); for (const [x, y, a, l] of [[355, 520, -0.33, 200], [430, 430, -0.1, 285], [510, 410, 0.02, 272], [590, 430, 0.12, 258], [662, 520, 0.28, 195]]) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.roundRect(-34, -l, 68, l + 60, 34); g.fill(); g.restore(); } g.save(); g.translate(330, 680); g.rotate(-0.75); g.beginPath(); g.roundRect(-38, -95, 76, 135, 38); g.fill(); g.restore(); g.fillRect(380, 820, 240, 120); },
  key(g) { g.lineWidth = 64; g.beginPath(); g.arc(500, 250, 122, 0, Math.PI * 2); g.stroke(); g.fillRect(465, 360, 70, 560); g.fillRect(535, 760, 120, 60); g.fillRect(535, 860, 90, 60); },
  fish(g) { ell(g, 470, 500, 300, 150); poly(g, [[730, 500], [940, 330], [880, 500], [940, 670]]); poly(g, [[400, 360], [520, 230], [580, 370]]); poly(g, [[420, 640], [520, 760], [560, 640]]); g.globalCompositeOperation = 'destination-out'; ell(g, 280, 460, 26, 26); g.globalCompositeOperation = 'source-over'; },
  butterfly(g) { // seen from above: wide, shallow, symmetric
    for (const sg of [-1, 1]) { g.save(); g.translate(500, 500); g.scale(sg, 1);
      g.beginPath(); g.moveTo(20, -20); g.bezierCurveTo(120, -230, 330, -270, 430, -200); g.bezierCurveTo(470, -150, 420, -60, 300, -10); g.bezierCurveTo(200, 20, 90, 10, 20, 0); g.fill();
      g.beginPath(); g.moveTo(20, 10); g.bezierCurveTo(140, 30, 300, 60, 330, 150); g.bezierCurveTo(340, 230, 230, 260, 160, 210); g.bezierCurveTo(100, 170, 50, 100, 20, 40); g.fill();
      g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(12, -150); g.quadraticCurveTo(35, -205, 75, -228); g.stroke(); g.restore(); }
    ell(g, 500, 520, 34, 190); ell(g, 500, 335, 30, 30); },
  catFront(g) { // sitting cat seen from the front: two ears, tail curling out at the base
    ell(g, 500, 700, 205, 225); ell(g, 500, 560, 150, 150); ell(g, 500, 385, 140, 125);
    poly(g, [[372, 350], [378, 175], [470, 290]]); poly(g, [[628, 350], [622, 175], [530, 290]]);
    ell(g, 430, 905, 70, 38); ell(g, 570, 905, 70, 38);
    g.lineWidth = 58; g.lineCap = 'round'; g.beginPath(); g.moveTo(640, 880); g.bezierCurveTo(790, 900, 850, 830, 830, 735); g.stroke(); },
  // test drawings (T9)
  star(g) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 190 : 450; p.push([500 + r * Math.cos(a), 530 + r * Math.sin(a)]); } poly(g, p); },
  heart(g) { g.beginPath(); g.moveTo(500, 900); g.bezierCurveTo(100, 620, 80, 300, 300, 200); g.bezierCurveTo(420, 150, 490, 230, 500, 300); g.bezierCurveTo(510, 230, 580, 150, 700, 200); g.bezierCurveTo(920, 300, 900, 620, 500, 900); g.fill(); },
  letterA(g) { poly(g, [[110, 920], [430, 80], [570, 80], [890, 920], [720, 920], [640, 690], [360, 690], [280, 920]]); g.globalCompositeOperation = 'destination-out'; poly(g, [[400, 560], [600, 560], [500, 270]]); g.globalCompositeOperation = 'source-over'; },
};

export const PRESETS = [
  { no: 1, title: ['貓 Cat', '樹 Tree', '燕 Swallow'], figs: ['catFront', 'tree', 'swallow'], T: [{ sx: 1.12, sy: 0.9732, tx: -0.041, ty: -0.0314, r: 0.15 }, { sx: 0.6735, sy: 0.8, tx: 0.0171, ty: 0.0944, r: -0.1229 }, { sx: 0.6592, sy: 1.0938, tx: -0.0027, ty: 0.0039, r: -0.0274 }] },
  { no: 2, title: ['手 Hand', '鑰 Key', '蝶 Butterfly'], figs: ['hand', 'key', 'butterfly'], T: [{ sx: 1.12, sy: 0.9925, tx: -0.0302, ty: 0.0151, r: -0.0467 }, { sx: 1.0969, sy: 0.9864, tx: 0.0044, ty: 0.0718, r: -0.0312 }, { sx: 0.66, sy: 0.731, tx: -0.0407, ty: 0.0003, r: 0.0546 }] },
];
