// Biblioteca de cenário — expansão temática das arenas reconstruídas:
// Cidade Abandonada, Fábrica dos Mortos, Floresta Sombria, Base Militar e Necrópole.
// Mesmo formato de scenery.js. Extras suportados pela Arena:
//   span: [w, d]   ocupa várias células (âncora = canto superior esquerdo; modelo centrado na área)
//   faceOpen       a frente (+z) vira para o lado livre (fachadas, criptas)
//   light: { at: [x, y, z], i, dist, color, off }   luz pontual real (off = começa apagada)
//   spawn          vira ponto de surgimento de inimigos (covas)
//   theme          arena onde o elemento nasceu (só informativo no catálogo)

const R = (r, a, b) => a + (b - a) * r();
const cube = (side, top, extra = []) => [[0, 0.5, 0, 1, 1, 1, side], [0, 0.97, 0, 1.02, 0.08, 1.02, top], ...extra];

// ---------------------------------------------------------------- terrenos novos
const tiles = (g, x, y, P, r, cols, n = 4) => {
  const q = P / n;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.fillRect(x + i * q, y + j * q, q + 0.5, q + 0.5);
    }
};
const belt = (dir) => (g, x, y, P, r) => {
  g.fillStyle = '#26262a';
  g.fillRect(x, y, P, P);
  g.fillStyle = '#3a3a40';
  for (let k = 0; k < 4; k++) (dir === 'e' || dir === 'w' ? g.fillRect(x + k * 8 + 1, y + 4, 4, P - 8) : g.fillRect(x + 4, y + k * 8 + 1, P - 8, 4));
  g.fillStyle = '#e8b020';
  if (dir === 'e' || dir === 'w') {
    g.fillRect(x, y, P, 3);
    g.fillRect(x, y + P - 3, P, 3);
  } else {
    g.fillRect(x, y, 3, P);
    g.fillRect(x + P - 3, y, 3, P);
  }
  // seta pintada
  g.fillStyle = 'rgba(232,176,32,0.55)';
  g.beginPath();
  const c = P / 2;
  const pts = { e: [[8, 8], [24, 16], [8, 24]], w: [[24, 8], [8, 16], [24, 24]], n: [[8, 24], [16, 8], [24, 24]], s: [[8, 8], [16, 24], [24, 8]] }[dir];
  g.moveTo(x + pts[0][0] * (P / 32), y + pts[0][1] * (P / 32));
  for (const [px, py] of pts.slice(1)) g.lineTo(x + px * (P / 32), y + py * (P / 32));
  g.closePath();
  g.fill();
  void c;
};
export const TERRAIN_PAINT2 = {
  asphalt: (g, x, y, P, r) => {
    tiles(g, x, y, P, r, ['#3a3c40', '#36383c', '#404246', '#34363a']);
    g.strokeStyle = 'rgba(15,15,18,0.8)';
    g.lineWidth = 1.2;
    if (r() < 0.45) {
      g.beginPath();
      let px = x + r() * P;
      let py = y + r() * P;
      g.moveTo(px, py);
      for (let k = 0; k < 3; k++) {
        px += (r() - 0.5) * 14;
        py += (r() - 0.5) * 14;
        g.lineTo(px, py);
      }
      g.stroke();
    }
    if (r() < 0.12) {
      g.fillStyle = 'rgba(230,190,60,0.75)';
      g.fillRect(x + 4, y + P / 2 - 2, P - 8, 4);
    }
    if (r() < 0.1) {
      g.fillStyle = 'rgba(60,110,40,0.7)';
      g.fillRect(x + r() * (P - 6), y + r() * (P - 6), 4, 6);
    }
  },
  sidewalk: (g, x, y, P, r) => {
    tiles(g, x, y, P, r, ['#9a9890', '#8e8c84', '#a4a29a'], 2);
    g.strokeStyle = 'rgba(40,40,40,0.35)';
    g.strokeRect(x + 0.5, y + 0.5, P / 2, P / 2);
    g.strokeRect(x + P / 2 + 0.5, y + P / 2 + 0.5, P / 2 - 1, P / 2 - 1);
    if (r() < 0.15) {
      g.fillStyle = 'rgba(70,110,50,0.8)';
      g.fillRect(x + P / 2 - 1, y + r() * P, 3, 5);
    }
  },
  planks: (g, x, y, P, r) => {
    for (let k = 0; k < 4; k++) {
      g.fillStyle = ['#7a5232', '#6e4a2c', '#84593a'][Math.floor(r() * 3)];
      g.fillRect(x, y + k * (P / 4), P, P / 4);
      g.fillStyle = 'rgba(30,18,8,0.6)';
      g.fillRect(x, y + k * (P / 4), P, 1);
      g.fillRect(x + ((k * 11) % P), y + k * (P / 4), 1, P / 4);
    }
  },
  grating: (g, x, y, P) => {
    g.fillStyle = '#4a4e54';
    g.fillRect(x, y, P, P);
    g.fillStyle = '#2a2c30';
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) g.fillRect(x + i * 8 + 2, y + j * 8 + 2, 4, 4);
  },
  toxic: (g, x, y, P, r) => {
    tiles(g, x, y, P, r, ['#3e8a22', '#4a9a2a', '#5aaa34']);
    g.fillStyle = 'rgba(190,255,90,0.6)';
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.arc(x + r() * P, y + r() * P, 1.5 + r() * 2.5, 0, Math.PI * 2);
      g.fill();
    }
  },
  beltE: belt('e'),
  beltW: belt('w'),
  beltN: belt('n'),
  beltS: belt('s'),
  elec: (g, x, y, P) => {
    g.fillStyle = '#34383e';
    g.fillRect(x, y, P, P);
    for (let k = 0; k < 8; k++) {
      g.fillStyle = k % 2 ? '#1a1a1a' : '#e8b020';
      g.fillRect(x + k * 4, y, 4, 3);
      g.fillRect(x + k * 4, y + P - 3, 4, 3);
    }
    g.strokeStyle = '#3a8ad8';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 6, y + 10);
    g.lineTo(x + 14, y + 16);
    g.lineTo(x + 10, y + 18);
    g.lineTo(x + 26, y + 24);
    g.stroke();
  },
  platform: (g, x, y, P, r) => {
    tiles(g, x, y, P, r, ['#5a5e4a', '#565a46', '#5e624e'], 2);
    g.fillStyle = '#2a2c24';
    for (const [a, b] of [[3, 3], [P - 5, 3], [3, P - 5], [P - 5, P - 5]]) g.fillRect(x + a, y + b, 2, 2);
    g.strokeStyle = 'rgba(232,176,32,0.8)';
    g.lineWidth = 2;
    g.strokeRect(x + 1, y + 1, P - 2, P - 2);
  },
};
// códigos de terreno (continuação de TERRAIN_CODE em scenery.js; 9 = arbusto)
export const TERRAIN_CODE2 = { asphalt: 10, sidewalk: 11, planks: 12, grating: 13, toxic: 14, beltE: 15, beltW: 16, beltN: 17, beltS: 18, elec: 19, platform: 20 };
export const BELT_DIR = { 15: [1, 0], 16: [-1, 0], 17: [0, -1], 18: [0, 1] };

// ---------------------------------------------------------------- modelos
const ruinWall = (r) => {
  const h = R(r, 1.7, 3.2);
  const col = [0x8a8478, 0x7a766c, 0x948e80][Math.floor(r() * 3)];
  const p = [[0, h / 2, 0, 1, h, 1, col]];
  p.push([R(r, -0.25, 0.25), h + 0.18, R(r, -0.2, 0.2), R(r, 0.3, 0.55), 0.36, R(r, 0.4, 0.8), col, R(r, 0, 1)]);
  for (const s of [1, -1]) {
    p.push([R(r, -0.2, 0.2), Math.min(h - 0.4, 1.8), s * 0.505, 0.38, 0.45, 0.01, 0x1a1a1e]);
    p.push([R(r, -0.35, 0.35), R(r, 0.3, h - 0.3), s * 0.506, 0.03, R(r, 0.3, 0.7), 0.01, 0x3a3630]);
  }
  p.push([R(r, -0.3, 0.3), h + 0.3, R(r, -0.3, 0.3), 0.04, 0.5, 0.04, 0x6a4a3a]);
  p.push([0, 0.05, 0, 1.04, 0.1, 1.04, 0x5a5650]);
  if (r() < 0.5) p.push([R(r, -0.3, 0.3), 0.15, 0.62, 0.3, 0.2, 0.25, col, R(r, 0, 3)]);
  return p;
};
const windowWall = (r) => {
  const p = [[0, 1.6, 0, 1, 3.2, 1, [0x6a6458, 0x5a5650, 0x74685a][Math.floor(r() * 3)]], [0, 3.22, 0, 1.04, 0.08, 1.04, 0x3a3630], [0, 0.6, 0, 1.01, 0.04, 1.01, 0x4a4640]];
  for (const s of [1, -1])
    for (const y of [1.25, 2.4]) {
      const lit = r() < 0.3;
      p.push([0, y, s * 0.506, 0.52, 0.62, 0.01, 0x2a2622]);
      p.push([0, y, s * 0.512, 0.44, 0.54, 0.01, lit ? 0xffd890 : 0x141820, 0, lit]);
      p.push([0, y, s * 0.516, 0.04, 0.54, 0.01, 0x2a2622]);
    }
  return p;
};
const shop = (r) => {
  const sign = [0xd82020, 0x2a8ad8, 0x30b050, 0xe8a020][Math.floor(r() * 4)];
  const lit = r() < 0.5;
  return [
    [0, 1.4, 0, 1, 2.8, 1, 0x5a4a3a], [0, 2.82, 0, 1.04, 0.08, 1.04, 0x3a2e24],
    [0, 0.95, 0.506, 0.86, 1.2, 0.01, 0x2a3a44], [0, 0.95, 0.51, 0.06, 1.2, 0.01, 0x3a3a3a],
    [-0.22, 0.75, 0.515, 0.2, 0.12, 0.01, 0x9ad0e8], [0.25, 1.25, 0.515, 0.12, 0.25, 0.01, 0x9ad0e8], [0.1, 0.5, 0.515, 0.25, 0.08, 0.01, 0x9ad0e8],
    ...[-0.375, -0.125, 0.125, 0.375].map((x, k) => [x, 1.78, 0.62, 0.25, 0.07, 0.3, k % 2 ? 0xf0f0f0 : sign]),
    [0, 2.3, 0.512, 0.8, 0.26, 0.02, lit ? sign : 0x2a2a2a, 0, lit],
    [0, 0.12, 0.52, 0.9, 0.24, 0.04, 0x3a3630],
  ];
};
const rubble = (r) => {
  const p = [];
  for (let k = 0; k < 6; k++) {
    const s = R(r, 0.25, 0.55);
    p.push([R(r, -0.3, 0.3), s * 0.4 + (k > 3 ? 0.25 : 0), R(r, -0.3, 0.3), s, s * 0.7, s * R(r, 0.8, 1.3), [0x8a8478, 0x7a766c, 0x6a5a4a][k % 3], R(r, 0, 3)]);
  }
  p.push([R(r, -0.2, 0.2), 0.6, R(r, -0.2, 0.2), 0.04, 0.6, 0.04, 0x6a4a3a, 0.4]);
  return p;
};
const bus = () => {
  const y = 0xd8a020;
  return [
    [0, 0.62, 0, 2.9, 1.24, 0.98, y], [0, 1.25, 0, 2.5, 0.02, 0.5, 0x2a3a44],
    ...[-1, -0.5, 0, 0.5, 1].map((x) => [x, 1.26, 0, 0.06, 0.02, 0.5, y]),
    [0, 0.35, 0.495, 2.9, 0.06, 0.01, 0x1a1a1a], [0, 0.35, -0.495, 2.9, 0.06, 0.01, 0x1a1a1a],
    [1.46, 0.6, 0, 0.04, 0.9, 0.8, 0x2a3a44], [-1.46, 0.6, 0, 0.04, 0.6, 0.7, 0x3a3020],
    ...[-1.05, 1.05].flatMap((x) => [[x, 0.62, -0.5, 0.45, 0.45, 0.12, 0x111111], [x, 0.62, -0.57, 0.18, 0.18, 0.02, 0x6a6a6a]]),
    [0.4, 0.95, 0.495, 0.5, 0.3, 0.01, 0x7a4a20], [-0.8, 0.4, 0.495, 0.35, 0.2, 0.01, 0x7a4a20],
  ];
};
const car = (r) => {
  const col = [0x8a2a24, 0x2a4a7a, 0xc8c8c0, 0x3a3a3a, 0x4a6a3a][Math.floor(r() * 5)];
  return [
    [0, 0.45, 0, 1.95, 0.6, 0.95, col], [-0.1, 0.95, 0, 1.1, 0.45, 0.85, 0x1e2a36], [-0.1, 1.2, 0, 1.1, 0.06, 0.9, col],
    ...[[-0.65, -0.48], [-0.65, 0.48], [0.65, -0.48], [0.65, 0.48]].map(([x, z]) => [x, 0.2, z, 0.38, 0.38, 0.08, 0x111111]),
    [0.98, 0.5, 0.3, 0.02, 0.12, 0.18, 0xfff0c0, 0, true, 'hl'], [0.98, 0.5, -0.3, 0.02, 0.12, 0.18, 0xfff0c0, 0, true, 'hl'],
    [-0.98, 0.5, 0.3, 0.02, 0.1, 0.16, 0xff2020, 0, true, 'tl'], [-0.98, 0.5, -0.3, 0.02, 0.1, 0.16, 0xff2020, 0, true, 'tl'],
    [R(r, -0.6, 0.6), 0.35, 0.477, 0.35, 0.18, 0.01, 0x6a4a30], [0.5, 0.76, 0, 0.6, 0.02, 0.8, 0x5a3a2a],
  ];
};
const fireBarrel = () => [
  [0, 0.42, 0, 0.6, 0.84, 0.6, 0x6a4a30], [0, 0.42, 0, 0.66, 0.78, 0.46, 0x6a4a30], [0, 0.42, 0, 0.46, 0.78, 0.66, 0x6a4a30],
  [0, 0.2, 0, 0.68, 0.05, 0.68, 0x4a3020], [0, 0.65, 0, 0.68, 0.05, 0.68, 0x4a3020],
  [0, 0.92, 0, 0.42, 0.22, 0.42, 0xff8a20, 0, true, 'fire'], [0.05, 1.1, -0.05, 0.24, 0.24, 0.24, 0xffc040, 0, true, 'fire'],
];
const pipes = () => {
  const p = [];
  for (const [y, c] of [[0.55, 0x9a5a2a], [1.45, 0x6a7078]]) p.push([0, y, 0, 1.02, 0.42, 0.3, c], [0, y, 0, 1.02, 0.3, 0.42, c], [0.45, y, 0, 0.06, 0.48, 0.48, 0x3a3e44]);
  p.push([0, 1.0, 0, 0.12, 2.0, 0.6, 0x3a3e44], [0, 2.0, 0, 1.0, 0.1, 0.6, 0x3a3e44]);
  p.push([-0.2, 1.45, 0.3, 0.26, 0.26, 0.04, 0xc02020], [-0.2, 1.45, 0.24, 0.06, 0.06, 0.1, 0x3a3e44]);
  return p;
};
const tank = () => [
  [0, 1.5, 0, 1.0, 3, 0.7, 0xc8c0a8], [0, 1.5, 0, 0.7, 3, 1.0, 0xc8c0a8], [0, 1.5, 0, 0.92, 3, 0.92, 0xc8c0a8],
  ...[0, 1, 2, 3, 4].map((k) => [-0.4 + k * 0.2, 2.2, 0, 0.2, 0.2, 1.02, k % 2 ? 0x1a1a1a : 0xe8b020]),
  [0, 3.05, 0, 0.62, 0.14, 0.62, 0xb0a890], [0.52, 1.5, 0, 0.04, 2.9, 0.22, 0x5a5e66],
  [0, 0.5, 0.52, 0.3, 0.2, 0.06, 0x6a3a2a], [0, 0.05, 0, 1.06, 0.1, 1.06, 0x5a5e66],
];
const forklift = () => [
  [0, 0.42, 0, 0.9, 0.56, 0.62, 0xe8b020], [-0.2, 0.95, 0.27, 0.06, 0.9, 0.06, 0x2a2a2a], [-0.2, 0.95, -0.27, 0.06, 0.9, 0.06, 0x2a2a2a],
  [-0.2, 1.4, 0, 0.5, 0.05, 0.6, 0x2a2a2a], [-0.15, 0.78, 0, 0.3, 0.2, 0.36, 0x1a1a1a], [0.48, 0.85, 0, 0.06, 1.5, 0.5, 0x2a2a2a],
  [0.75, 0.08, 0.15, 0.55, 0.05, 0.08, 0x8a8e96], [0.75, 0.08, -0.15, 0.55, 0.05, 0.08, 0x8a8e96],
  ...[[-0.3, 0.32], [-0.3, -0.32], [0.3, 0.32], [0.3, -0.32]].map(([x, z]) => [x, 0.16, z, 0.3, 0.3, 0.1, 0x111111]),
  [-0.42, 0.5, 0, 0.12, 0.4, 0.5, 0x3a3a3a],
];
const machine = (r) => [
  [0, 1.0, 0, 0.96, 2.0, 0.96, 0x5a6068], [0, 1.4, 0.49, 0.7, 0.8, 0.02, 0x4a4e56],
  [0.2, 1.6, 0.505, 0.1, 0.06, 0.01, r() < 0.5 ? 0x30ff60 : 0xff3030, 0, true], [0, 1.6, 0.505, 0.1, 0.06, 0.01, 0xe8b020, 0, true],
  ...[0, 1, 2, 3, 4].map((k) => [-0.4 + k * 0.2, 0.1, 0, 0.2, 0.2, 0.98, k % 2 ? 0x1a1a1a : 0xe8b020]),
  [0.25, 2.3, -0.2, 0.2, 0.6, 0.2, 0x3a3e44], [-0.3, 2.05, 0.1, 0.3, 0.1, 0.5, 0x6a7078],
];
const press = () => [
  [-0.43, 1.2, 0, 0.12, 2.4, 0.9, 0x4a4e56], [0.43, 1.2, 0, 0.12, 2.4, 0.9, 0x4a4e56],
  [0, 2.3, 0, 0.98, 0.4, 0.9, 0x7a2a1a], [0, 2.0, 0, 0.7, 0.5, 0.7, 0x8a8e96, 0, false, 'ram'],
  ...[0, 1, 2, 3].map((k) => [-0.3 + k * 0.2, 0.03, 0, 0.2, 0.06, 0.9, k % 2 ? 0x1a1a1a : 0xe8b020]),
  [0.43, 2.0, 0.46, 0.08, 0.08, 0.02, 0xff2020, 0, true, 'warn'],
];
const steamVent = () => [
  [0, 0.04, 0, 0.8, 0.08, 0.8, 0x3a3e44], ...[-0.24, 0, 0.24].map((x) => [x, 0.09, 0, 0.06, 0.02, 0.7, 0x1a1c20]),
  [0, 0.5, -0.38, 0.24, 1.0, 0.24, 0x6a7078], [0, 1.0, -0.2, 0.24, 0.24, 0.5, 0x6a7078], [0.18, 0.7, -0.38, 0.2, 0.2, 0.04, 0xc02020],
];
const consoleModel = (screen) => () => [
  [0, 0.55, 0, 0.5, 1.1, 0.4, 0x3a3e46], [0, 0.97, 0.205, 0.38, 0.26, 0.01, screen, 0, true, 'screen'],
  [0, 0.74, 0.27, 0.44, 0.05, 0.18, 0x2a2c32], [0, 0.03, 0, 0.6, 0.06, 0.5, 0xe8b020], [0, 1.15, 0, 0.12, 0.12, 0.12, screen, 0, true, 'screen'],
];
const generator = () => [
  [0, 0.48, 0, 0.92, 0.88, 0.66, 0x4a5a3a], [0, 0.95, 0, 0.94, 0.06, 0.68, 0x3a4a2a], [0.3, 1.3, -0.18, 0.1, 0.6, 0.1, 0x2a2a2a],
  [-0.25, 0.6, 0.335, 0.3, 0.3, 0.01, 0x2a2c24], [-0.3, 0.68, 0.34, 0.06, 0.06, 0.01, 0x30ff60, 0, true, 'gen'], [-0.2, 0.68, 0.34, 0.06, 0.06, 0.01, 0xffc020, 0, true, 'gen'],
  [0.25, 0.5, 0.335, 0.25, 0.4, 0.01, 0x3a4a2a], [0, 0.05, 0, 1.0, 0.1, 0.74, 0x2a2a2a],
];
const beacon = () => [[0, 0.2, 0, 0.3, 0.4, 0.3, 0x2a2a2e], [0, 0.5, 0, 0.26, 0.22, 0.26, 0xff6020, 0, true, 'beacon'], [0, 0.63, 0, 0.3, 0.04, 0.3, 0x2a2a2e]];
const glowShroom = (r) => {
  const p = [];
  const cols = [0x9a4aff, 0x3ce0ff, 0xc060ff];
  for (let k = 0; k < 3; k++) {
    const x = R(r, -0.25, 0.25);
    const z = R(r, -0.25, 0.25);
    const s = k ? R(r, 0.5, 0.8) : 1.1;
    const c = cols[Math.floor(r() * 3)];
    p.push([x, 0.22 * s, z, 0.1 * s, 0.44 * s, 0.1 * s, 0xd8d0e8]);
    p.push([x, 0.46 * s, z, 0.44 * s, 0.1 * s, 0.44 * s, c, 0, true, 'cap'], [x, 0.53 * s, z, 0.26 * s, 0.07 * s, 0.26 * s, c, 0, true, 'cap']);
  }
  return p;
};
const twistedTree = () => {
  const c = 0x3a2e2a;
  return [
    [0, 1.1, 0, 0.36, 2.2, 0.36, c], [0.1, 0.1, 0.1, 0.6, 0.2, 0.5, 0x2e2420],
    [0.3, 1.6, 0.1, 0.55, 0.12, 0.12, c, 0.5], [0.55, 1.9, 0.25, 0.12, 0.5, 0.12, c], [-0.35, 2.0, -0.1, 0.6, 0.12, 0.12, c, -0.4],
    [-0.62, 2.3, -0.2, 0.12, 0.5, 0.12, c], [0, 2.45, 0.3, 0.12, 0.12, 0.6, c], [0.05, 2.7, 0.55, 0.1, 0.4, 0.1, c],
    [0.62, 2.18, 0.25, 0.08, 0.08, 0.08, 0x7a3aaa, 0, true],
  ];
};
const giantPine = () => [
  [0, 0.9, 0, 0.45, 1.8, 0.45, 0x3a2618],
  [0, 1.8, 0, 2.4, 0.7, 2.4, 0x1e4a2e], [0, 2.5, 0, 1.9, 0.7, 1.9, 0x24563a], [0, 3.2, 0, 1.4, 0.7, 1.4, 0x1e4a2e],
  [0, 3.85, 0, 0.9, 0.65, 0.9, 0x24563a], [0, 4.4, 0, 0.45, 0.5, 0.45, 0x1e4a2e], [0, 4.75, 0, 0.18, 0.25, 0.18, 0x24563a],
];
const mossRuin = (r) => {
  const h = R(r, 1.0, 2.6);
  return [
    [0, h / 2, 0, 1, h, 1, 0x6a6c70], [R(r, -0.2, 0.2), h + 0.15, 0, R(r, 0.4, 0.8), 0.3, 1.02, 0x5e6064],
    [0, h + 0.02, 0, 0.9, 0.03, 0.9, 0x3e6a2e], [R(r, -0.3, 0.3), R(r, 0.3, h - 0.2), 0.506, 0.3, 0.3, 0.01, 0x3e6a2e], [0.506, R(r, 0.2, h - 0.2), R(r, -0.3, 0.3), 0.01, 0.4, 0.3, 0x4a7a3a],
    [0, 0.3, 0, 1.01, 0.03, 1.01, 0x4e5054], [0, 0.9, 0, 1.01, 0.03, 1.01, 0x4e5054],
  ];
};
const cabinWall = () => {
  const p = [];
  for (let k = 0; k < 7; k++) p.push([0, 0.16 + k * 0.3, 0, 1.0, 0.3, 0.9, k % 2 ? 0x6a4428 : 0x7a5232], [0, 0.16 + k * 0.3, 0, 0.9, 0.26, 1.0, k % 2 ? 0x6a4428 : 0x7a5232]);
  p.push([0, 2.2, 0, 1.12, 0.12, 1.12, 0x3a2a1e]);
  return p;
};
const roots = (r) => {
  const p = [];
  for (let k = 0; k < 4; k++) p.push([R(r, -0.3, 0.3), R(r, 0.05, 0.14), R(r, -0.3, 0.3), R(r, 0.5, 0.9), R(r, 0.08, 0.16), 0.1, 0x2a1a24, R(r, 0, 3)]);
  for (let k = 0; k < 3; k++) p.push([R(r, -0.35, 0.35), 0.16, R(r, -0.35, 0.35), 0.08, 0.08, 0.08, 0xb04aff, 0, true]);
  return p;
};
const towerPost = () => [
  [0, 1.6, 0, 0.18, 3.2, 0.18, 0x4a4e3a], [0, 1.0, 0, 0.6, 0.08, 0.08, 0x3a3e2a, 0.785], [0, 1.0, 0, 0.6, 0.08, 0.08, 0x3a3e2a, -0.785],
  [0, 3.25, 0, 0.7, 0.1, 0.7, 0x3a3e2a], [0, 2.6, 0, 0.5, 0.06, 0.06, 0x3a3e2a], [0, 2.6, 0, 0.06, 0.06, 0.5, 0x3a3e2a],
];
const tent = () => [
  [0, 0.65, 0, 1.9, 1.3, 1.9, 0x5a6a3a], [0, 1.45, 0, 2.0, 0.3, 1.3, 0x52623a], [0, 1.68, 0, 2.02, 0.18, 0.7, 0x4a5a32], [0, 1.82, 0, 2.04, 0.1, 0.2, 0x42522c],
  [0, 0.55, 0.96, 0.55, 1.0, 0.02, 0x2a3220], [0, 0.55, -0.96, 0.4, 0.4, 0.02, 0x2a3220],
  ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [a * 1.05, 0.05, b * 1.05, 0.08, 0.1, 0.08, 0x2a2a2a]),
  [0.5, 1.2, 0.951, 0.3, 0.2, 0.01, 0xd8d8d0], [0.5, 1.2, 0.955, 0.06, 0.16, 0.01, 0xc02020], [0.5, 1.2, 0.955, 0.16, 0.06, 0.01, 0xc02020],
];
const heli = () => [
  [0, 0.8, 0, 2.4, 1.3, 1.2, 0x4a5a3a], [1.15, 1.0, 0, 0.6, 0.8, 1.0, 0x2a3a44], [1.4, 0.7, 0, 0.3, 0.5, 0.8, 0x3a4a2a],
  [-1.7, 1.0, 0, 1.3, 0.3, 0.3, 0x4a5a3a], [-2.25, 1.35, 0, 0.3, 0.7, 0.08, 0x3a4a2a],
  [0, 1.55, 0, 0.3, 0.2, 0.3, 0x2a2a2a], [0, 1.7, 0, 3.4, 0.05, 0.2, 0x1e1e1e, 0.6], [0.2, 1.68, 0.4, 2.2, 0.05, 0.2, 0x1e1e1e, -0.9],
  [0, 0.12, 0.65, 2.2, 0.06, 0.08, 0x2a2a2a], [0, 0.12, -0.65, 2.2, 0.06, 0.08, 0x2a2a2a],
  [0.3, 0.9, 0.605, 0.5, 0.5, 0.01, 0x1a1a1a], [-0.4, 0.6, 0.605, 0.6, 0.3, 0.01, 0x2a2a20], [0.1, 1.46, 0, 0.8, 0.02, 0.8, 0x1a1a14],
];
const lightTower = () => [
  [0, 2.0, 0, 0.3, 4.0, 0.3, 0x6a6e74], [0, 0.1, 0, 0.7, 0.2, 0.7, 0x3a3e44],
  ...[0.8, 1.6, 2.4, 3.2].map((y, k) => [0, y, 0, 0.5, 0.05, 0.05, 0x5a5e64, k % 2 ? 0.785 : -0.785]),
  [0, 4.1, 0.05, 0.95, 0.5, 0.2, 0x2a2a2e], [-0.24, 4.1, 0.16, 0.36, 0.36, 0.02, 0xfff4d0, 0, true, 'bulb'], [0.24, 4.1, 0.16, 0.36, 0.36, 0.02, 0xfff4d0, 0, true, 'bulb'],
];
const apc = () => [
  [0, 0.75, 0, 2.8, 0.9, 1.7, 0x4a5a3a], [-0.2, 1.38, 0, 2.0, 0.4, 1.4, 0x56663f], [1.3, 0.85, 0, 0.35, 0.6, 1.5, 0x56663f],
  [0.2, 1.76, 0, 0.8, 0.36, 0.8, 0x4a5a3a], [1.0, 1.78, 0, 1.0, 0.1, 0.1, 0x2a2a2a], [-0.6, 1.62, 0.4, 0.4, 0.08, 0.3, 0x2a2a2a],
  ...[-1.0, -0.33, 0.33, 1.0].flatMap((x) => [[x, 0.35, 0.88, 0.55, 0.55, 0.14, 0x111111], [x, 0.35, -0.88, 0.55, 0.55, 0.14, 0x111111]]),
  [-0.8, 1.0, 0.855, 0.6, 0.3, 0.01, 0x3a4a2a], [0.5, 0.7, 0.855, 0.4, 0.25, 0.01, 0x6a7a4a], [-1.41, 0.8, 0, 0.02, 0.4, 0.6, 0x2a2a2a],
];
const gatePosts = () => [
  [-0.46, 1.1, 0, 0.14, 2.2, 0.2, 0xe8b020], [0.46, 1.1, 0, 0.14, 2.2, 0.2, 0xe8b020],
  ...[0.3, 0.9, 1.5].map((y) => [-0.46, y, 0, 0.15, 0.2, 0.21, 0x1a1a1a]), ...[0.3, 0.9, 1.5].map((y) => [0.46, y, 0, 0.15, 0.2, 0.21, 0x1a1a1a]),
  [-0.46, 2.3, 0, 0.12, 0.12, 0.12, 0xff3020, 0, true, 'gl'], [0.46, 2.3, 0, 0.12, 0.12, 0.12, 0xff3020, 0, true, 'gl'],
];
const booth = () => [
  [0, 1.1, 0, 0.9, 2.2, 0.9, 0xe8e4d8], [0, 2.26, 0, 1.1, 0.12, 1.1, 0x3a3a3a], [0, 0.5, 0, 0.92, 0.12, 0.92, 0xc02020],
  [0, 1.45, 0.455, 0.6, 0.5, 0.01, 0xffe8a0, 0, true], [0.455, 1.45, 0, 0.01, 0.5, 0.6, 0xffe8a0, 0, true], [-0.455, 1.45, 0, 0.01, 0.5, 0.6, 0x2a3a44],
];
const grave = (r) => [
  [0, 0.08, 0.1, 0.52, 0.16, 0.86, 0x4a3a2a], [0, 0.16, 0.1, 0.4, 0.04, 0.7, 0x3a2e22],
  [R(r, -0.05, 0.05), 0.42, -0.36, 0.52, 0.68, 0.12, 0x8a8a90, R(r, -0.2, 0.2)], [0, 0.78, -0.36, 0.34, 0.08, 0.12, 0x8a8a90],
  [0, 0.5, -0.295, 0.06, 0.26, 0.01, 0x5a5a60], [0, 0.56, -0.295, 0.18, 0.06, 0.01, 0x5a5a60],
];
const bell = () => [
  [-0.4, 1.3, 0, 0.12, 2.6, 0.12, 0x5a4a3a], [0.4, 1.3, 0, 0.12, 2.6, 0.12, 0x5a4a3a], [0, 2.56, 0, 1.0, 0.14, 0.14, 0x4a3a2a],
  [0, 2.48, 0, 0.12, 0.1, 0.12, 0x2a2a2a], [0, 2.1, 0, 0.46, 0.6, 0.46, 0xb8902a, 0, false, 'bell'], [0, 1.8, 0, 0.62, 0.1, 0.62, 0xc8a03a, 0, false, 'bell'],
  [0.12, 1.2, 0.05, 0.03, 1.1, 0.03, 0xc8b890], [0, 0.05, 0, 1.0, 0.1, 0.4, 0x4a4a52],
];
const crypt = () => [
  [0, 1.25, 0, 1, 2.5, 1, 0x6a6a72], [0, 2.6, 0, 1.12, 0.2, 1.12, 0x5a5a62], [0, 2.82, 0, 0.7, 0.25, 1.12, 0x5a5a62],
  [0, 0.9, 0.506, 0.46, 1.4, 0.01, 0x14141c], [0, 1.65, 0.51, 0.56, 0.12, 0.02, 0x5a5a62],
  [-0.4, 1.2, 0.48, 0.12, 2.3, 0.12, 0x7a7a82], [0.4, 1.2, 0.48, 0.12, 2.3, 0.12, 0x7a7a82],
  [0, 0.06, 0.56, 1.1, 0.12, 0.2, 0x5a5a62], [0.3, 2.0, 0.506, 0.2, 0.3, 0.01, 0x3e6a2e],
];
const ironFence = () => {
  const p = [[0, 0.95, 0, 1, 0.05, 0.05, 0x1a1a20], [0, 0.25, 0, 1, 0.05, 0.05, 0x1a1a20]];
  for (let x = -0.4; x < 0.45; x += 0.2) p.push([x, 0.6, 0, 0.04, 1.2, 0.04, 0x22222a], [x, 1.25, 0, 0.08, 0.1, 0.08, 0x2a2a32, 0.785]);
  return p;
};
const candles = (r) => {
  const p = [];
  for (let k = 0; k < 3; k++) {
    const x = R(r, -0.25, 0.25);
    const z = R(r, -0.25, 0.25);
    const h = R(r, 0.12, 0.3);
    p.push([x, h / 2, z, 0.07, h, 0.07, 0xe8e0c8], [x, h + 0.05, z, 0.04, 0.08, 0.04, 0xffc040, 0, true, 'flame']);
  }
  return p;
};
const statue = () => [
  [0, 0.4, 0, 0.8, 0.8, 0.8, 0x7a7a80], [0, 0.84, 0, 0.9, 0.08, 0.9, 0x6a6a70],
  [0, 1.45, 0, 0.42, 1.15, 0.34, 0x9a9aa0], [0, 2.2, 0, 0.28, 0.3, 0.28, 0x9a9aa0], [0, 1.25, 0.05, 0.5, 0.7, 0.3, 0x8e8e94],
  [-0.38, 1.7, -0.12, 0.4, 0.95, 0.08, 0xa4a4aa, 0.3], [0.38, 1.7, -0.12, 0.4, 0.95, 0.08, 0xa4a4aa, -0.3],
  [0.2, 0.84, 0.3, 0.3, 0.04, 0.2, 0x4a7a3a],
];

// ---------------------------------------------------------------- catálogo
export const SCENERY2 = {
  asphalt: { n: 36, ch: 'f', name: 'Asfalto rachado', cat: 'terrain', beh: 'static', coll: 'floor', theme: 'city', desc: 'Rua com rachaduras, faixas e mato nas fendas.', model: () => cube(0x3a3c40, 0x404246, [[0.2, 1.02, 0, 0.5, 0.01, 0.08, 0xe8c040]]) },
  sidewalk: { n: 37, ch: 'k', name: 'Calçada', cat: 'terrain', beh: 'static', coll: 'floor', theme: 'city', desc: 'Lajotas de concreto da cidade.', model: () => cube(0x8e8c84, 0x9a9890) },
  planks: { n: 38, ch: 'h', name: 'Assoalho de madeira', cat: 'terrain', beh: 'static', coll: 'floor', theme: 'forest', desc: 'Piso de cabanas e alojamentos.', model: () => cube(0x6e4a2c, 0x84593a) },
  grating: { n: 39, ch: '=', name: 'Grade de piso', cat: 'terrain', beh: 'static', coll: 'floor', theme: 'factory', desc: 'Piso metálico vazado de fábrica.', model: () => cube(0x3a3e44, 0x4a4e54) },
  toxic: { n: 40, ch: '~', name: 'Lago contaminado', cat: 'terrain', beh: 'static', coll: 'floor', theme: 'forest', hazard: true, desc: 'Água infectada: fere (5/s) e deixa 40% mais lento.', model: () => [[0, 0.45, 0, 1, 0.9, 1, 0x3e8a22], [0, 0.93, 0, 1.01, 0.06, 1.01, 0x8aff4a, 0, true]] },
  beltE: { n: 41, ch: '>', name: 'Esteira (leste)', cat: 'terrain', beh: 'interact', coll: 'floor', theme: 'factory', desc: 'Arrasta jogadores e inimigos. Também há esteiras para oeste (<), norte (^) e sul (V).', model: () => cube(0x2a2a2e, 0x26262a, [[0, 1.02, 0.45, 1.02, 0.02, 0.08, 0xe8b020], [0, 1.02, -0.45, 1.02, 0.02, 0.08, 0xe8b020]]) },
  beltW: { n: 41.1, ch: '<', name: 'Esteira (oeste)', cat: 'terrain', beh: 'interact', coll: 'floor', theme: 'factory', hidden: true, desc: '', model: () => cube(0x2a2a2e, 0x26262a) },
  beltN: { n: 41.2, ch: '^', name: 'Esteira (norte)', cat: 'terrain', beh: 'interact', coll: 'floor', theme: 'factory', hidden: true, desc: '', model: () => cube(0x2a2a2e, 0x26262a) },
  beltS: { n: 41.3, ch: 'V', name: 'Esteira (sul)', cat: 'terrain', beh: 'interact', coll: 'floor', theme: 'factory', hidden: true, desc: '', model: () => cube(0x2a2a2e, 0x26262a) },
  elec: { n: 42, ch: 'e', name: 'Piso elétrico', cat: 'terrain', beh: 'interact', coll: 'floor', theme: 'factory', hazard: true, desc: 'Liga de tempos em tempos (ou pelo console): choque e atordoamento.', model: () => cube(0x34383e, 0x3a3e46, [[0, 1.02, 0, 0.6, 0.02, 0.08, 0x3a8ad8, 0.6, true]]) },
  platform: { n: 43, ch: 'N', name: 'Plataforma elevada', cat: 'terrain', beh: 'interact', coll: 'floor', theme: 'military', desc: 'Torre de vigia: de cima, rifles e sniper têm +40% de alcance e +20% de dano.', model: () => cube(0x4a4e3a, 0x5a5e4a) },

  ruin: { n: 44, ch: 'Y', name: 'Prédio destruído', cat: 'structure', beh: 'static', coll: 'tall', theme: 'city', desc: 'Parede de concreto quebrada, com janelas vazias e ferragens.', model: ruinWall },
  windows: { n: 45, ch: 'J', name: 'Fachada com janelas', cat: 'structure', beh: 'static', coll: 'tall', theme: 'city', desc: 'Prédio com janelas — algumas ainda acesas.', model: windowWall },
  shop: { n: 46, ch: '$', name: 'Loja saqueada', cat: 'structure', beh: 'static', coll: 'tall', faceOpen: true, theme: 'city', desc: 'Vitrine quebrada, toldo listrado e letreiro.', model: shop },
  rubble: { n: 47, ch: ':', name: 'Entulho', cat: 'structure', beh: 'cover', coll: 'low', theme: 'city', desc: 'Pilha de concreto: cobertura baixa.', model: rubble },
  bus: { n: 48, ch: 'q', name: 'Ônibus tombado', cat: 'urban', beh: 'static', coll: 'tall', span: [3, 1], theme: 'city', desc: 'Ocupa 3 blocos: barreira alta no meio da rua.', model: bus },
  acar: { n: 49, ch: 's', name: 'Carro com alarme', cat: 'urban', beh: 'interact', coll: 'tall', span: [2, 1], hp: 220, shoot: 0.9, theme: 'city', desc: 'Atirou, disparou o alarme: a horda vem. Destruído, explode.', model: car },
  firebarrel: { n: 50, ch: '&', name: 'Tambor em chamas', cat: 'urban', beh: 'static', coll: 'low', theme: 'city', light: { at: [0, 1.4, 0], i: 9, dist: 7, color: 0xff8a30 }, desc: 'Fogo de sobrevivente: ilumina e queima quem encosta.', model: fireBarrel },
  generator: { n: 51, ch: '8', name: 'Gerador', cat: 'urban', beh: 'interact', coll: 'low', desc: 'Fique ao lado por 2 s para ligar: acende os postes (cidade) ou alimenta as defesas (base).', model: generator },

  pipes: { n: 52, ch: '-', name: 'Tubulação', cat: 'structure', beh: 'static', coll: 'tall', orient: true, theme: 'factory', desc: 'Canos enferrujados com válvula.', model: pipes },
  tank: { n: 53, ch: '0', name: 'Tanque industrial', cat: 'structure', beh: 'static', coll: 'tall', theme: 'factory', desc: 'Silo com faixa de risco e escada.', model: tank },
  forklift: { n: 54, ch: '1', name: 'Empilhadeira', cat: 'urban', beh: 'cover', coll: 'low', theme: 'factory', desc: 'Abandonada no meio do galpão: cobertura baixa.', model: forklift },
  machine: { n: 55, ch: '2', name: 'Máquina', cat: 'structure', beh: 'static', coll: 'tall', theme: 'factory', desc: 'Maquinário com painel e chaminé.', model: machine },
  press: { n: 56, ch: '3', name: 'Prensa', cat: 'structure', beh: 'interact', coll: 'none', theme: 'factory', desc: 'Desce a cada 3,5 s e esmaga quem estiver embaixo (atraia a horda!).', model: press },
  steam: { n: 57, ch: '4', name: 'Saída de vapor', cat: 'structure', beh: 'interact', coll: 'none', theme: 'factory', desc: 'Chia e solta vapor fervente em volta de tempos em tempos.', model: steamVent },
  econsole: { n: 58, ch: '5', name: 'Console do piso elétrico', cat: 'urban', beh: 'interact', coll: 'low', theme: 'factory', desc: 'Fique ao lado por 1,5 s: liga todos os pisos elétricos por 5 s.', model: consoleModel(0x3a8ad8) },
  beacon: { n: 59, ch: '9', name: 'Luz de emergência', cat: 'urban', beh: 'static', coll: 'low', light: { at: [0, 1.0, 0], i: 6, dist: 6, color: 0xff5020 }, desc: 'Giroflex: alerta vermelho-alaranjado.', model: beacon },

  giantpine: { n: 60, ch: '!', name: 'Pinheiro gigante', cat: 'nature', beh: 'static', coll: 'tall', theme: 'forest', desc: 'Conífera escura de quase 5 m.', model: giantPine },
  twisted: { n: 61, ch: 'y', name: 'Árvore retorcida', cat: 'nature', beh: 'interact', coll: 'tall', theme: 'forest', desc: 'Pode cair durante a partida: esmaga e vira barreira.', model: twistedTree },
  glowshroom: { n: 62, ch: '*', name: 'Cogumelo luminoso', cat: 'nature', beh: 'interact', coll: 'none', hp: 1, shoot: 0.35, theme: 'forest', desc: 'Brilha no escuro. Tocado ou atingido, solta esporos tóxicos.', model: glowShroom },
  ruinmoss: { n: 63, ch: '%', name: 'Ruína antiga', cat: 'structure', beh: 'static', coll: 'tall', theme: 'forest', desc: 'Pedras musgosas de uma construção esquecida.', model: mossRuin },
  cabin: { n: 64, ch: '[', name: 'Parede de cabana', cat: 'structure', beh: 'static', coll: 'tall', theme: 'forest', desc: 'Toras empilhadas de cabana abandonada.', model: cabinWall },
  roots: { n: 65, ch: ',', name: 'Raízes infectadas', cat: 'nature', beh: 'static', coll: 'none', theme: 'forest', desc: 'Raízes pulsando com brilho roxo.', model: roots },

  post: { n: 66, ch: '+', name: 'Pilar de torre de vigia', cat: 'structure', beh: 'static', coll: 'low', theme: 'military', desc: 'Pilar com travas: usado em volta das plataformas elevadas.', model: towerPost },
  tent: { n: 67, ch: '(', name: 'Barraca militar', cat: 'structure', beh: 'static', coll: 'tall', span: [2, 2], theme: 'military', desc: 'Alojamento de lona (2×2 blocos).', model: tent },
  heli: { n: 68, ch: ')', name: 'Helicóptero destruído', cat: 'urban', beh: 'static', coll: 'tall', span: [3, 2], theme: 'military', desc: 'Destroço fumegante (3×2 blocos).', model: heli },
  lighttower: { n: 69, ch: '}', name: 'Torre de holofote', cat: 'urban', beh: 'static', coll: 'low', theme: 'military', light: { at: [0, 3.8, 0.5], i: 26, dist: 16, color: 0xfff4d8, off: true }, desc: 'Holofote alimentado pelo gerador.', model: lightTower },
  apc: { n: 70, ch: '{', name: 'Blindado', cat: 'urban', beh: 'static', coll: 'tall', span: [3, 2], theme: 'military', desc: 'Veículo blindado abandonado (3×2 blocos).', model: apc },
  mgate: { n: 71, ch: ']', name: 'Portão militar', cat: 'structure', beh: 'interact', coll: 'none', theme: 'military', desc: 'Aberto no início. Pelo console de portão, fecha com aço (os zumbis tentam arrombar).', model: gatePosts },
  gconsole: { n: 72, ch: '7', name: 'Console de portões', cat: 'urban', beh: 'interact', coll: 'low', theme: 'military', desc: 'Fique ao lado por 1,5 s: fecha ou abre todos os portões (precisa de energia).', model: consoleModel(0xe8a020) },
  tconsole: { n: 73, ch: '6', name: 'Console de torre', cat: 'urban', beh: 'interact', coll: 'low', theme: 'military', desc: 'Fique ao lado por 1,5 s: ativa uma torre automática por 25 s (precisa de energia).', model: consoleModel(0x30ff60) },
  booth: { n: 74, ch: '?', name: 'Posto de controle', cat: 'structure', beh: 'static', coll: 'tall', theme: 'military', desc: 'Guarita com janelas acesas.', model: booth },

  grave: { n: 75, ch: 'ç', name: 'Cova', cat: 'nature', beh: 'interact', coll: 'none', spawn: true, theme: 'graveyard', desc: 'Os mortos saem daqui: ponto de surgimento de inimigos.', model: grave },
  bell: { n: 76, ch: 'é', name: 'Sino da capela', cat: 'urban', beh: 'interact', coll: 'low', theme: 'graveyard', desc: 'Fique ao lado por 1,5 s: o badalo atordoa os mortos a até 10 m.', model: bell },
  crypt: { n: 77, ch: 'ã', name: 'Cripta', cat: 'structure', beh: 'static', coll: 'tall', faceOpen: true, theme: 'graveyard', desc: 'Mausoléu de pedra com colunas.', model: crypt },
  ironfence: { n: 78, ch: 'õ', name: 'Grade de ferro', cat: 'structure', beh: 'cover', coll: 'low', orient: true, theme: 'graveyard', desc: 'Lanças de ferro: barram a passagem, tiros atravessam.', model: ironFence },
  candles: { n: 79, ch: 'á', name: 'Velas', cat: 'nature', beh: 'static', coll: 'none', theme: 'graveyard', desc: 'Velas acesas sobre os túmulos.', model: candles },
  statue: { n: 80, ch: 'â', name: 'Estátua de anjo', cat: 'structure', beh: 'static', coll: 'tall', theme: 'graveyard', desc: 'Anjo de pedra coberto de musgo.', model: statue },
};
