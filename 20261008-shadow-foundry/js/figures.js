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
    for (const [x, y, r] of [[290, 420, 125], [190, 330, 90], [390, 270, 140], [510, 160, 125], [650, 260, 145], [800, 350, 105], [720, 440, 100], [350, 140, 75], [680, 120, 85], [500, 330, 110], [505, 70, 70]]) ell(g, x, y, r, r * 0.92);
  },
  swallow(g) { // swallow seen from above: long crescent wings, deeply forked tail
    g.save(); g.translate(0, 45);
    ell(g, 500, 470, 62, 170);           // body
    ell(g, 500, 300, 58, 58);            // head
    poly(g, [[485, 248], [500, 205], [515, 248]]); // beak
    g.beginPath(); g.moveTo(468, 395); g.bezierCurveTo(380, 330, 210, 350, 40, 430); g.bezierCurveTo(200, 450, 330, 480, 470, 525); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(532, 395); g.bezierCurveTo(620, 330, 790, 350, 960, 430); g.bezierCurveTo(800, 450, 670, 480, 530, 525); g.closePath(); g.fill();
    poly(g, [[455, 600], [545, 600], [560, 640], [625, 870], [580, 700], [500, 655], [420, 700], [375, 870], [440, 640]]);
    g.restore();
  },
  // second preset set
  hand(g) { ell(g, 500, 640, 190, 230); for (const [x, y, a, l] of [[350, 520, -0.35, 230], [430, 430, -0.1, 300], [510, 410, 0.02, 320], [590, 430, 0.12, 290], [665, 520, 0.3, 220]]) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.roundRect(-34, -l, 68, l + 60, 34); g.fill(); g.restore(); } g.save(); g.translate(300, 700); g.rotate(-1.0); g.beginPath(); g.roundRect(-38, -220, 76, 260, 38); g.fill(); g.restore(); g.fillRect(380, 820, 240, 120); },
  key(g) { g.lineWidth = 70; g.beginPath(); g.arc(500, 240, 140, 0, Math.PI * 2); g.stroke(); g.fillRect(465, 360, 70, 560); g.fillRect(535, 760, 120, 60); g.fillRect(535, 860, 90, 60); },
  fish(g) { ell(g, 470, 500, 300, 150); poly(g, [[730, 500], [940, 330], [880, 500], [940, 670]]); poly(g, [[400, 360], [520, 230], [580, 370]]); poly(g, [[420, 640], [520, 760], [560, 640]]); g.globalCompositeOperation = 'destination-out'; ell(g, 280, 460, 26, 26); g.globalCompositeOperation = 'source-over'; },
  // test drawings (T9)
  star(g) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 190 : 450; p.push([500 + r * Math.cos(a), 530 + r * Math.sin(a)]); } poly(g, p); },
  heart(g) { g.beginPath(); g.moveTo(500, 900); g.bezierCurveTo(100, 620, 80, 300, 300, 200); g.bezierCurveTo(420, 150, 490, 230, 500, 300); g.bezierCurveTo(510, 230, 580, 150, 700, 200); g.bezierCurveTo(920, 300, 900, 620, 500, 900); g.fill(); },
  letterA(g) { poly(g, [[110, 920], [430, 80], [570, 80], [890, 920], [720, 920], [640, 690], [360, 690], [280, 920]]); g.globalCompositeOperation = 'destination-out'; poly(g, [[400, 560], [600, 560], [500, 270]]); g.globalCompositeOperation = 'source-over'; },
};

export const PRESETS = [
  { no: 1, title: ['貓 Cat', '樹 Tree', '燕 Swallow'], figs: ['cat', 'tree', 'swallow'], T: [{ sx: 1.08, sy: 1.08, tx: 0.02, ty: -0.12, r: 0.177 }, { sx: 0.57, sy: 0.852, tx: -0.025, ty: -0.035, r: -0.041 }, { sx: 0.89, sy: 1.058, tx: -0.071, ty: 0.017, r: -0.18 }] },
  { no: 2, title: ['手 Hand', '鑰 Key', '魚 Fish'], figs: ['hand', 'key', 'fish'], T: [0, 1, 2].map(() => ({ sx: 0.9, sy: 0.9, tx: 0, ty: 0, r: 0 })) },
];
