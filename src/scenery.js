// Biblioteca de cenário do Block Horde: 35 elementos modulares em blocos para montar arenas.
// Cada elemento tem um símbolo de mapa (1 caractere = 1 bloco de 1 m), modelo, colisão e comportamento.
//
// Peça de modelo: [dx, y, dz, sx, sy, sz, cor, ry?, brilho?, marca?] — centro da peça; y a partir do chão.
// O modelo é desenhado ao longo do eixo x; peças "orient" giram 90° quando os vizinhos estão na vertical.
//
// coll: 'tall' bloqueia movimento e tiros · 'low' bloqueia movimento (cobertura: tiros passam por cima,
//       ácido inimigo é barrado) · 'none' decoração andável · 'floor' terreno pintado no chão
// beh:  static (estático) · destruct (destrutível) · interact (interativo) · cover (cobertura)

import { SCENERY2, TERRAIN_PAINT2, TERRAIN_CODE2, BELT_DIR } from './scenery2.js';
import { SCENERY3, TERRAIN_PAINT3, TERRAIN_CODE3 } from './scenery3.js';

const R = (r, a, b) => a + (b - a) * r();

// ---------------------------------------------------------------- terrenos (chão)
// paint(g, x, y, P, r): pinta uma célula de P×P pixels no canvas do chão
const checker = (cols) => (g, x, y, P, r) => {
  const q = P / 4;
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.fillRect(x + i * q, y + j * q, q + 0.5, q + 0.5);
    }
};
const TERRAIN_PAINT = {
  grass: (g, x, y, P, r) => {
    checker(['#4f8a3a', '#5a9442', '#468032', '#62a04a'])(g, x, y, P, r);
    if (r() < 0.5) {
      g.fillStyle = '#3a6e2a';
      g.fillRect(x + r() * P * 0.7, y + r() * P * 0.7, 3, 6);
    }
  },
  dirt: (g, x, y, P, r) => {
    checker(['#7a5232', '#6e4a2c', '#84593a', '#8a6040'])(g, x, y, P, r);
    g.fillStyle = 'rgba(40,24,12,0.45)';
    for (let k = 0; k < 3; k++) g.fillRect(x + r() * (P - 4), y + r() * (P - 4), 3, 3);
  },
  stone: (g, x, y, P, r) => {
    g.fillStyle = '#8a8c90';
    g.fillRect(x, y, P, P);
    g.strokeStyle = 'rgba(30,30,34,0.55)';
    g.lineWidth = 1.5;
    const h = P / 3;
    for (let j = 0; j < 3; j++) {
      const off = j % 2 ? P / 4 : 0;
      for (let i = -1; i < 2; i++) {
        g.fillStyle = ['#8a8c90', '#7e8084', '#96989c'][Math.floor(r() * 3)];
        g.fillRect(x + off + i * (P / 2) + 1, y + j * h + 1, P / 2 - 2, h - 2);
        g.strokeRect(x + off + i * (P / 2), y + j * h, P / 2, h);
      }
    }
  },
  moss: (g, x, y, P, r) => {
    TERRAIN_PAINT.stone(g, x, y, P, r);
    g.fillStyle = 'rgba(74,122,58,0.85)';
    for (let k = 0; k < 4; k++) g.fillRect(x + r() * (P - 8), y + r() * (P - 6), 5 + r() * 9, 3 + r() * 6);
  },
  sand: (g, x, y, P, r) => {
    checker(['#e0c888', '#d8bf7c', '#e8d29a', '#dcc484'])(g, x, y, P, r);
    g.fillStyle = 'rgba(150,120,70,0.5)';
    for (let k = 0; k < 4; k++) g.fillRect(x + r() * (P - 2), y + r() * (P - 2), 2, 2);
  },
  snow: (g, x, y, P, r) => {
    checker(['#eef2f6', '#e2e8ee', '#f6f8fb', '#d8e2ea'])(g, x, y, P, r);
    g.fillStyle = 'rgba(150,180,210,0.35)';
    g.fillRect(x + r() * P * 0.6, y + r() * P * 0.6, 8 + r() * 6, 3);
  },
  lava: (g, x, y, P, r) => {
    checker(['#2a1a14', '#341e16', '#24160f'])(g, x, y, P, r);
    g.strokeStyle = '#ff7a1a';
    g.lineWidth = 2.5;
    g.beginPath();
    let px = x + r() * P;
    let py = y;
    g.moveTo(px, py);
    for (let k = 0; k < 4; k++) {
      px = x + r() * P;
      py += P / 4;
      g.lineTo(px, py);
    }
    g.stroke();
    g.strokeStyle = '#ffd040';
    g.lineWidth = 1;
    g.stroke();
  },
  water: (g, x, y, P, r) => {
    checker(['#2a6ab0', '#3074b8', '#2662a6'])(g, x, y, P, r);
    g.strokeStyle = 'rgba(190,230,255,0.55)';
    g.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) {
      const yy = y + 6 + k * 14 + r() * 4;
      g.beginPath();
      g.moveTo(x + 4, yy);
      g.quadraticCurveTo(x + P / 2, yy - 4, x + P - 4, yy);
      g.stroke();
    }
  },
};
// cubo do catálogo: corpo + camada de cima
const cube = (side, top, extra = []) => [[0, 0.5, 0, 1, 1, 1, side], [0, 0.97, 0, 1.02, 0.08, 1.02, top], ...extra];
// códigos da grade de terreno (Arena.terrain)
export const TERRAIN_CODE = { grass: 1, dirt: 2, stone: 3, moss: 4, sand: 5, snow: 6, lava: 7, water: 8 };

// ---------------------------------------------------------------- modelos
const brick = () => {
  const p = [[0, 1.2, 0, 1, 2.4, 1, 0xa8442e]];
  for (let y = 0.3; y < 2.4; y += 0.3) p.push([0, y, 0, 1.012, 0.035, 1.012, 0x5a2a1e]);
  // juntas verticais alternadas a cada fiada (frente/trás e laterais)
  for (let k = 0; k < 8; k++) {
    const y = 0.15 + k * 0.3;
    for (const o of k % 2 ? [0] : [-0.25, 0.25]) p.push([o, y, 0, 0.03, 0.3, 1.014, 0x5a2a1e], [0, y, o, 1.014, 0.3, 0.03, 0x5a2a1e]);
  }
  p.push([0, 2.43, 0, 1.04, 0.06, 1.04, 0x8a3a28]);
  return p;
};
// versão leve para a borda da arena (só fiadas, sem juntas verticais)
const brickLite = () => {
  const p = [[0, 1.2, 0, 1, 2.4, 1, 0xa8442e]];
  for (let y = 0.3; y < 2.4; y += 0.3) p.push([0, y, 0, 1.012, 0.035, 1.012, 0x5a2a1e]);
  p.push([0, 2.43, 0, 1.04, 0.06, 1.04, 0x8a3a28]);
  return p;
};
const concrete = (r) => [
  [0, 1.2, 0, 1, 2.4, 1, 0xb8bcc0],
  [0, 0.8, 0, 1.01, 0.03, 1.01, 0x8a9096],
  [0, 1.6, 0, 1.01, 0.03, 1.01, 0x8a9096],
  [R(r, -0.3, 0.3), R(r, 0.3, 2), 0.505, 0.18, 0.12, 0.01, 0x9aa0a6],
  [0.505, R(r, 0.3, 2), R(r, -0.3, 0.3), 0.01, 0.2, 0.15, 0x9aa0a6],
  [R(r, -0.3, 0.3), R(r, 0.3, 2), -0.505, 0.14, 0.18, 0.01, 0xa4aab0],
  [0, 2.42, 0, 1.03, 0.04, 1.03, 0xa4a8ac],
];
const metal = () => {
  const p = [[0, 1.2, 0, 1, 2.4, 1, 0x7a8088]];
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) p.push([a * 0.47, 1.2, b * 0.47, 0.1, 2.42, 0.1, 0x5a6068]);
  for (const y of [0.05, 1.2, 2.35]) p.push([0, y, 0, 1.03, 0.1, 1.03, 0x5a6068]);
  for (const s of [1, -1]) for (const y of [0.6, 1.8]) for (const x of [-0.3, 0.3]) p.push([x, y, s * 0.51, 0.06, 0.06, 0.02, 0xb0b8c0], [s * 0.51, y, x, 0.02, 0.06, 0.06, 0xb0b8c0]);
  return p;
};
const woodBlock = () => {
  const p = [[0, 1.0, 0, 1, 2.0, 1, 0x9a6a3a]];
  for (let y = 0.25; y < 2; y += 0.25) p.push([0, y, 0, 1.012, 0.03, 1.012, 0x5a3a1e]);
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) p.push([a * 0.46, 1.0, b * 0.46, 0.1, 2.02, 0.1, 0x6a4424]);
  p.push([0, 2.02, 0, 0.9, 0.04, 0.9, 0xa8783e]);
  return p;
};
const crateX = () => {
  const p = [[0, 0.47, 0, 0.92, 0.92, 0.92, 0xb07a42]];
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) p.push([a * 0.44, 0.47, b * 0.44, 0.08, 0.95, 0.08, 0x7a5228]);
  p.push([0, 0.04, 0, 0.96, 0.08, 0.96, 0x7a5228], [0, 0.9, 0, 0.96, 0.08, 0.96, 0x7a5228]);
  // X em degraus nas 4 faces
  for (const t of [-0.3, -0.1, 0.1, 0.3]) {
    for (const s of [1, -1]) {
      p.push([t, 0.47 + t, s * 0.465, 0.17, 0.17, 0.02, 0x8a5e30], [t, 0.47 - t, s * 0.465, 0.17, 0.17, 0.02, 0x8a5e30]);
      p.push([s * 0.465, 0.47 + t, t, 0.02, 0.17, 0.17, 0x8a5e30], [s * 0.465, 0.47 - t, t, 0.02, 0.17, 0.17, 0x8a5e30]);
    }
  }
  return p;
};
const fence = () => {
  const c = 0x4a4e54;
  const p = [[-0.48, 1.0, 0, 0.08, 2.0, 0.08, c], [0.48, 1.0, 0, 0.08, 2.0, 0.08, c], [0, 1.96, 0, 1, 0.07, 0.07, c], [0, 0.06, 0, 1, 0.07, 0.07, c], [0, 1.0, 0, 1, 0.05, 0.06, c]];
  for (let x = -0.36; x < 0.4; x += 0.12) p.push([x, 1.0, 0, 0.022, 1.88, 0.022, 0x6a7078]);
  for (let y = 0.25; y < 1.9; y += 0.25) p.push([0, y, 0, 0.98, 0.022, 0.022, 0x6a7078]);
  return p;
};
const jersey = (c1, c2) => {
  const g = 0xb8bcc0;
  const p = [[0, 0.18, 0, 1, 0.36, 0.62, g], [0, 0.52, 0, 1, 0.32, 0.42, g], [0, 0.78, 0, 1, 0.2, 0.28, 0xc4c8cc]];
  for (let k = 0; k < 5; k++)
    for (const s of [1, -1]) {
      const x = -0.4 + k * 0.2;
      p.push([x, 0.47, s * 0.212, 0.2, 0.18, 0.012, k % 2 ? c2 : c1]);
      if (c1 !== 0xf0c020) p.push([x, 0.65, s * 0.212, 0.2, 0.16, 0.012, k % 2 ? c1 : c2]);
    }
  return p;
};
const rocks = (r) => {
  const p = [];
  const n = 3 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const s = R(r, 0.14, 0.34);
    p.push([R(r, -0.3, 0.3), s * 0.4, R(r, -0.3, 0.3), s, s * 0.8, s * R(r, 0.8, 1.2), [0x7a7c80, 0x8a8c90, 0x6a6c70][k % 3], R(r, 0, 3)]);
  }
  return p;
};
const logs = () => {
  const p = [];
  for (const [y, z] of [[0.15, -0.16], [0.15, 0.16], [0.42, 0]]) {
    p.push([0, y, z, 1.0, 0.28, 0.28, 0x7a5230], [0, y, z, 1.0, 0.2, 0.32, 0x7a5230], [0, y, z, 1.0, 0.32, 0.2, 0x7a5230]);
    for (const s of [1, -1]) p.push([s * 0.505, y, z, 0.02, 0.24, 0.24, 0xc89a62], [s * 0.512, y, z, 0.02, 0.1, 0.1, 0xa87a42]);
  }
  return p;
};
const bush = (r) => {
  const p = [];
  for (let k = 0; k < 5; k++) {
    const s = R(r, 0.4, 0.7);
    p.push([R(r, -0.2, 0.2), s * 0.5 + R(r, 0, 0.15), R(r, -0.2, 0.2), s, s * 0.85, s, [0x3a7a32, 0x4a8a3a, 0x2e6a2a, 0x5a9a44][k % 4], R(r, 0, 3)]);
  }
  return p;
};
const tallGrass = (r) => {
  const p = [];
  for (let k = 0; k < 9; k++) {
    const h = R(r, 0.3, 0.6);
    p.push([R(r, -0.35, 0.35), h / 2, R(r, -0.35, 0.35), 0.05, h, 0.05, [0x5aa040, 0x4a8a34, 0x6ab04a][k % 3], R(r, 0, 3)]);
  }
  return p;
};
const mushrooms = (r) => {
  const p = [];
  for (let k = 0; k < 3; k++) {
    const x = R(r, -0.28, 0.28);
    const z = R(r, -0.28, 0.28);
    const s = k ? R(r, 0.6, 0.85) : 1;
    p.push([x, 0.1 * s, z, 0.07 * s, 0.2 * s, 0.07 * s, 0xe8dcc0]);
    p.push([x, 0.23 * s, z, 0.26 * s, 0.07 * s, 0.26 * s, 0xd8281e], [x, 0.28 * s, z, 0.16 * s, 0.05 * s, 0.16 * s, 0xd8281e]);
    p.push([x + 0.05 * s, 0.307 * s, z, 0.045 * s, 0.012, 0.045 * s, 0xffffff], [x - 0.06 * s, 0.267 * s, z + 0.06 * s, 0.04 * s, 0.012, 0.04 * s, 0xffffff]);
  }
  return p;
};
const pine = () => [
  [0, 0.6, 0, 0.3, 1.2, 0.3, 0x5a3a22],
  [0, 1.25, 0, 1.6, 0.5, 1.6, 0x2e6a3a],
  [0, 1.75, 0, 1.25, 0.5, 1.25, 0x367a42],
  [0, 2.22, 0, 0.85, 0.45, 0.85, 0x2e6a3a],
  [0, 2.62, 0, 0.45, 0.4, 0.45, 0x367a42],
  [0, 2.9, 0, 0.18, 0.2, 0.18, 0x2e6a3a],
];
const leafy = () => [
  [0, 0.8, 0, 0.38, 1.6, 0.38, 0x6a4428],
  [0, 2.1, 0, 1.8, 1.1, 1.8, 0x4a9a3a],
  [0.4, 2.75, 0.2, 1.0, 0.6, 1.0, 0x5aaa44],
  [-0.55, 1.9, -0.3, 0.9, 0.7, 0.9, 0x3a8a32],
  [0.1, 2.95, -0.3, 0.7, 0.4, 0.7, 0x6aba4a],
];
const deadTree = () => {
  const c = 0x5a4030;
  return [
    [0, 1.0, 0, 0.32, 2.0, 0.32, c], [0, 0.08, 0, 0.5, 0.16, 0.5, 0x4a3426],
    [0.35, 1.45, 0, 0.6, 0.1, 0.1, c], [0.62, 1.72, 0, 0.1, 0.45, 0.1, c],
    [-0.3, 1.85, 0.1, 0.5, 0.1, 0.1, c], [-0.52, 2.12, 0.1, 0.1, 0.45, 0.1, c],
    [0, 2.25, -0.28, 0.1, 0.1, 0.5, c], [0, 2.5, -0.5, 0.1, 0.4, 0.1, c],
    [0.05, 2.15, 0, 0.12, 0.3, 0.12, c],
  ];
};
const bigRock = () => [
  [0, 0.6, 0, 1.1, 1.2, 1.0, 0x7a7c80],
  [0.15, 1.35, -0.1, 0.8, 0.5, 0.7, 0x8a8c90],
  [-0.32, 0.35, 0.35, 0.6, 0.7, 0.5, 0x6a6c70],
  [0.42, 0.3, -0.38, 0.45, 0.6, 0.4, 0x707276],
  [0.1, 1.61, -0.05, 0.5, 0.03, 0.4, 0x4a7a3a],
  [-0.38, 0.71, 0.32, 0.3, 0.03, 0.3, 0x5a8a44],
  [0.555, 0.8, 0.1, 0.01, 0.3, 0.3, 0x4a7a3a],
];
const lamp = () => [
  [0, 0.15, 0, 0.36, 0.3, 0.36, 0x1e1e22],
  [0, 1.6, 0, 0.12, 3.0, 0.12, 0x26262a],
  [0.3, 3.05, 0, 0.7, 0.08, 0.1, 0x26262a],
  [0.6, 2.96, 0, 0.36, 0.14, 0.28, 0x1e1e22],
  [0.6, 2.87, 0, 0.28, 0.04, 0.2, 0xffd860, 0, true, 'bulb'],
];
const traffic = () => {
  const p = [
    [0, 0.1, 0, 0.4, 0.2, 0.4, 0x2a2a2a],
    [0, 1.2, 0, 0.14, 2.2, 0.14, 0x1e1e22],
    [0, 2.45, 0, 0.32, 0.92, 0.28, 0x1a1a1a],
  ];
  for (const s of [1, -1])
    for (const [y, col, tag] of [[2.72, 0xff3020, 'r'], [2.45, 0xffc020, 'y'], [2.18, 0x30ff60, 'g']]) {
      p.push([0, y + 0.1, s * 0.17, 0.24, 0.03, 0.06, 0x1a1a1a]);
      p.push([0, y, s * 0.145, 0.18, 0.18, 0.02, col, 0, true, tag]);
    }
  return p;
};
const signpost = () => [
  [0, 0.9, 0, 0.12, 1.8, 0.12, 0x7a5230],
  [0.25, 1.45, 0.08, 0.7, 0.2, 0.05, 0xd8a838], [0.64, 1.45, 0.08, 0.1, 0.12, 0.05, 0xd8a838],
  [0.22, 1.45, 0.108, 0.42, 0.03, 0.01, 0x5a4220],
  [-0.25, 1.1, 0.08, 0.7, 0.2, 0.05, 0xa87a3a], [-0.64, 1.1, 0.08, 0.1, 0.12, 0.05, 0xa87a3a],
  [-0.22, 1.1, 0.108, 0.42, 0.03, 0.01, 0x4a3a20],
  [0, 1.83, 0, 0.16, 0.06, 0.16, 0x6a4424],
];
const billboard = () => [
  [-0.36, 0.75, 0, 0.08, 1.5, 0.08, 0x8a8e94], [0.36, 0.75, 0, 0.08, 1.5, 0.08, 0x8a8e94],
  [0, 1.78, 0, 1.06, 0.86, 0.06, 0x8a8e94],
  [0, 1.78, 0, 1.0, 0.8, 0.08, 0xc8281e],
  // caveira branca nas duas faces
  ...[1, -1].flatMap((s) => [
    [0, 1.86, s * 0.045, 0.32, 0.26, 0.01, 0xffffff], [0, 1.68, s * 0.045, 0.2, 0.1, 0.01, 0xffffff],
    [-0.075, 1.86, s * 0.05, 0.08, 0.08, 0.01, 0xc8281e], [0.075, 1.86, s * 0.05, 0.08, 0.08, 0.01, 0xc8281e],
    [0, 1.535, s * 0.045, 0.5, 0.05, 0.01, 0xffffff],
  ]),
];
export const BARREL_MODEL = [
  [0, 0.48, 0, 0.62, 0.96, 0.62, 0xb02a1a],
  [0, 0.48, 0, 0.7, 0.9, 0.5, 0xb02a1a],
  [0, 0.48, 0, 0.5, 0.9, 0.7, 0xb02a1a],
  [0, 0.24, 0, 0.72, 0.05, 0.72, 0x7a1a10], [0, 0.72, 0, 0.72, 0.05, 0.72, 0x7a1a10],
  [0, 0.97, 0, 0.52, 0.03, 0.52, 0x8a2216],
  ...[1, -1].flatMap((s) => [[0, 0.5, s * 0.355, 0.24, 0.24, 0.012, 0xf0c020], [0, 0.5, s * 0.362, 0.08, 0.14, 0.01, 0x2a1a10]]),
  ...[1, -1].flatMap((s) => [[s * 0.355, 0.5, 0, 0.012, 0.24, 0.24, 0xf0c020], [s * 0.362, 0.5, 0, 0.01, 0.14, 0.08, 0x2a1a10]]),
];
const blueBarrel = () => [
  [0, 0.48, 0, 0.62, 0.96, 0.62, 0x2a5ab0],
  [0, 0.48, 0, 0.7, 0.9, 0.5, 0x2a5ab0],
  [0, 0.48, 0, 0.5, 0.9, 0.7, 0x2a5ab0],
  [0, 0.25, 0, 0.72, 0.05, 0.72, 0x1e4a90], [0, 0.72, 0, 0.72, 0.05, 0.72, 0x1e4a90],
  [0, 0.97, 0, 0.52, 0.03, 0.52, 0x3a6ac0],
  [0.15, 0.995, 0.1, 0.08, 0.03, 0.08, 0x1e3a70],
];
const pallet = () => {
  const p = [];
  for (let z = -0.4; z < 0.45; z += 0.2) p.push([0, 0.13, z, 1.0, 0.04, 0.16, 0xa8783e]);
  for (const x of [-0.42, 0, 0.42]) p.push([x, 0.055, 0, 0.12, 0.11, 1.0, 0x8a5e2e]);
  return p;
};
const lowWall = (r) => [
  [0, 0.3, 0, 1, 0.6, 0.5, 0xa8acb0],
  [0, 0.67, -0.04, 1, 0.14, 0.36, 0xb4b8bc],
  [0, 0.78, -0.08, 1, 0.08, 0.22, 0xc0c4c8],
  [R(r, -0.3, 0.3), R(r, 0.15, 0.45), 0.252, 0.16, 0.08, 0.01, 0x8a8e92],
  [R(r, -0.3, 0.3), R(r, 0.15, 0.45), -0.252, 0.12, 0.1, 0.01, 0x8a8e92],
];
export const CONE_MODEL = [
  [0, 0.03, 0, 0.42, 0.06, 0.42, 0xe8601a],
  [0, 0.16, 0, 0.27, 0.2, 0.27, 0xf07a20],
  [0, 0.31, 0, 0.21, 0.11, 0.21, 0xffffff],
  [0, 0.42, 0, 0.15, 0.12, 0.15, 0xf07a20],
  [0, 0.53, 0, 0.08, 0.1, 0.08, 0xf07a20],
];
const sandbags = () => {
  const c = [0xc8b48a, 0xbca880, 0xd0bc92];
  const p = [];
  [-0.34, 0, 0.34].forEach((x, k) => p.push([x, 0.13, 0, 0.36, 0.26, 0.56, c[k % 3], (k - 1) * 0.06], [x, 0.13, 0.29, 0.2, 0.02, 0.02, 0x8a7a5a]));
  [-0.17, 0.17].forEach((x, k) => p.push([x, 0.38, 0, 0.36, 0.24, 0.52, c[(k + 1) % 3], (k ? 0.08 : -0.05), false, 'top']));
  p.push([0, 0.58, 0, 0.36, 0.2, 0.48, c[2], 0.03, false, 'top']);
  return p;
};

// ---------------------------------------------------------------- catálogo
// ch: símbolo no mapa · hp: resistência (destrutíveis) · drop: chance de soltar item
// boomOnly: só explosões danificam · push: empurrável · knock: cai ao ser tocado · orient: gira com os vizinhos
export const SCENERY = {
  grass: { n: 1, ch: 'g', name: 'Grama', cat: 'terrain', beh: 'static', coll: 'floor', desc: 'Piso de terra com grama verde quadriculada.', model: () => cube(0x7a5232, 0x5a9442, [[0, 0.88, 0, 1.015, 0.1, 1.015, 0x4f8a3a]]) },
  dirt: { n: 2, ch: 'd', name: 'Terra', cat: 'terrain', beh: 'static', coll: 'floor', desc: 'Solo compactado para caminhos e trilhas.', model: () => cube(0x8a5a36, 0x7a5232, [[0.25, 1.02, 0.2, 0.12, 0.03, 0.12, 0x5a3a22]]) },
  stone: { n: 3, ch: 'p', name: 'Pedra', cat: 'terrain', beh: 'static', coll: 'floor', desc: 'Piso de pedras retangulares encaixadas.', model: () => cube(0x7e8084, 0x8a8c90, [[0, 0.7, 0, 1.012, 0.03, 1.012, 0x5a5c60], [0, 0.35, 0, 1.012, 0.03, 1.012, 0x5a5c60]]) },
  moss: { n: 4, ch: 'm', name: 'Pedra musgosa', cat: 'terrain', beh: 'static', coll: 'floor', desc: 'Rocha com musgo nas juntas: ruínas e cantos úmidos.', model: () => cube(0x7e8084, 0x8a8c90, [[0.2, 1.02, -0.1, 0.4, 0.03, 0.35, 0x4a7a3a], [-0.3, 0.6, 0.505, 0.3, 0.2, 0.012, 0x4a7a3a]]) },
  sand: { n: 5, ch: 'a', name: 'Areia', cat: 'terrain', beh: 'static', coll: 'floor', desc: 'Piso arenoso para praias e margens.', model: () => cube(0xd8bf7c, 0xe8d29a) },
  snow: { n: 6, ch: 'n', name: 'Neve', cat: 'terrain', beh: 'static', coll: 'floor', desc: 'Terra coberta por uma camada de neve.', model: () => cube(0x7a5232, 0xf2f6fa, [[0, 0.86, 0, 1.015, 0.14, 1.015, 0xe2e8ee]]) },
  lava: { n: 7, ch: 'l', name: 'Lava', cat: 'terrain', beh: 'static', coll: 'floor', hazard: true, desc: 'Fere quem pisa (jogadores e inimigos). Os zumbis evitam.', model: () => cube(0x2a1a14, 0x341e16, [[0.1, 1.02, 0, 0.7, 0.02, 0.08, 0xff7a1a, 0, true], [-0.2, 1.02, 0.2, 0.08, 0.02, 0.5, 0xffa030, 0, true], [0.505, 0.5, 0, 0.012, 0.5, 0.08, 0xff7a1a, 0, true]]) },
  water: { n: 8, ch: 'w', name: 'Água', cat: 'terrain', beh: 'static', coll: 'floor', slow: true, desc: 'Rasa: deixa jogadores e inimigos 40% mais lentos.', model: () => [[0, 0.45, 0, 1, 0.9, 1, 0x2a6ab0], [0, 0.93, 0, 1.01, 0.06, 1.01, 0x5a9ad8, 0, true]] },

  brick: { n: 9, ch: 'B', name: 'Parede de tijolos', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Parede alta de tijolos: bloqueia passagem e tiros.', model: brick, edgeModel: brickLite },
  concrete: { n: 10, ch: 'K', name: 'Bloco de concreto', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Bloco industrial liso com manchas.', model: concrete },
  metal: { n: 11, ch: 'M', name: 'Bloco metálico', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Aço com placas, parafusos e cantos reforçados.', model: metal },
  woodblock: { n: 12, ch: 'W', name: 'Bloco de madeira', cat: 'structure', beh: 'destruct', coll: 'tall', hp: 160, drop: 0.15, desc: 'Parede de tábuas: quebre a tiros para abrir caminho.', model: woodBlock },
  crate: { n: 13, ch: 'X', name: 'Caixa de madeira', cat: 'structure', beh: 'destruct', coll: 'low', hp: 60, drop: 0.25, shoot: 0.46, desc: 'Barra tiros e quebra. 25% de chance de soltar um item.', model: crateX },
  fence: { n: 14, ch: 'H', name: 'Grade metálica', cat: 'structure', beh: 'cover', coll: 'low', orient: true, desc: 'Barra a passagem, mas tiros atravessam a grade.', model: fence },
  ibarrier: { n: 15, ch: 'I', name: 'Barreira industrial', cat: 'structure', beh: 'cover', coll: 'low', orient: true, desc: 'Concreto com faixa amarela e preta: cobertura parcial.', model: () => jersey(0xf0c020, 0x1a1a1a) },
  sbarrier: { n: 16, ch: 'S', name: 'Barreira de segurança', cat: 'structure', beh: 'cover', coll: 'low', orient: true, desc: 'Concreto com faixas vermelhas e brancas: cobertura parcial.', model: () => jersey(0xd82020, 0xf4f4f4) },

  rocks: { n: 17, ch: 'r', name: 'Pedras', cat: 'nature', beh: 'static', coll: 'none', desc: 'Pedrinhas soltas decorando o chão.', model: rocks },
  logs: { n: 18, ch: 'L', name: 'Troncos', cat: 'nature', beh: 'destruct', coll: 'low', hp: 140, orient: true, desc: 'Pilha de troncos: cobertura baixa e destrutível.', model: logs },
  bush: { n: 19, ch: 'u', name: 'Arbusto', cat: 'nature', beh: 'static', coll: 'none', thick: true, desc: 'Andável, mas atrasa quem passa por dentro (30%).', model: bush },
  tallgrass: { n: 20, ch: '"', name: 'Grama alta', cat: 'nature', beh: 'static', coll: 'none', desc: 'Folhas compridas que preenchem o terreno.', model: tallGrass },
  mushrooms: { n: 21, ch: 'o', name: 'Cogumelos', cat: 'nature', beh: 'static', coll: 'none', desc: 'Chapéus vermelhos com pintas: decoração de floresta.', model: mushrooms },
  pine: { n: 22, ch: 'P', name: 'Pinheiro', cat: 'nature', beh: 'static', coll: 'tall', desc: 'Conífera em camadas: bloqueia passagem e tiros.', model: pine },
  leafy: { n: 23, ch: 'A', name: 'Árvore folhosa', cat: 'nature', beh: 'static', coll: 'tall', desc: 'Tronco grosso e copa em cubos.', model: leafy },
  deadtree: { n: 24, ch: 'D', name: 'Árvore seca', cat: 'nature', beh: 'static', coll: 'tall', desc: 'Galhos nus: áreas mortas e cemitérios.', model: deadTree },
  bigrock: { n: 25, ch: 'R', name: 'Rocha grande', cat: 'nature', beh: 'static', coll: 'tall', desc: 'Formação rochosa com musgo: obstáculo natural.', model: bigRock },

  lamp: { n: 26, ch: 'i', name: 'Poste de luz', cat: 'urban', beh: 'interact', coll: 'low', hp: 40, shoot: 0.2, light: true, desc: 'Ilumina de verdade. Atire nele para apagar e derrubar.', model: lamp },
  traffic: { n: 27, ch: 'E', name: 'Semáforo', cat: 'urban', beh: 'interact', coll: 'low', hp: 60, shoot: 0.22, desc: 'Alterna verde, amarelo e vermelho. Pode ser derrubado.', model: traffic },
  signpost: { n: 28, ch: 'j', name: 'Placa direcional', cat: 'urban', beh: 'destruct', coll: 'low', hp: 25, shoot: 0.22, desc: 'Poste de madeira com setas. Quebra fácil.', model: signpost },
  billboard: { n: 29, ch: 'O', name: 'Placa de perigo', cat: 'urban', beh: 'destruct', coll: 'low', hp: 80, shoot: 0.45, desc: 'Painel vermelho com caveira: avisa áreas perigosas.', model: billboard },
  xbarrel: { n: 30, ch: 'x', name: 'Barril explosivo', cat: 'urban', beh: 'destruct', coll: 'low', desc: 'Explode ao levar dano: armadilha contra a horda (fere você também).', model: () => BARREL_MODEL },
  barrel: { n: 31, ch: 'U', name: 'Barril comum', cat: 'urban', beh: 'interact', coll: 'low', hp: 140, shoot: 0.36, push: true, desc: 'Empurre andando contra ele. Barra tiros e pode ser destruído.', model: blueBarrel },
  pallet: { n: 32, ch: '_', name: 'Pallet de madeira', cat: 'urban', beh: 'destruct', coll: 'none', hp: 30, boomOnly: true, desc: 'Piso baixo de depósito. Explosões o destroem.', model: pallet },
  lowwall: { n: 33, ch: 'Z', name: 'Mureta de concreto', cat: 'urban', beh: 'cover', coll: 'low', orient: true, desc: 'Cobertura parcial: barra o ácido e os ferrões inimigos.', model: lowWall },
  cone: { n: 34, ch: 'z', name: 'Cone de trânsito', cat: 'urban', beh: 'interact', coll: 'none', knock: true, desc: 'Leve: cai e desliza quando alguém esbarra ou atira.', model: () => CONE_MODEL },
  sandbags: { n: 35, ch: 'Q', name: 'Sacos de areia', cat: 'urban', beh: 'cover', coll: 'low', hp: 300, boomOnly: true, orient: true, desc: 'Cobertura resistente: só explosões desgastam (perde a fileira de cima).', model: sandbags },
};
// expansão temática (arenas reconstruídas)
Object.assign(SCENERY, SCENERY2, SCENERY3);
Object.assign(TERRAIN_CODE, TERRAIN_CODE2, TERRAIN_CODE3);
Object.assign(TERRAIN_PAINT, TERRAIN_PAINT2, TERRAIN_PAINT3);
export { BELT_DIR };
// ordem do catálogo (variações escondidas, como as outras direções da esteira, ficam de fora)
export const SCENERY_ORDER = Object.keys(SCENERY).filter((id) => !SCENERY[id].hidden).sort((a, b) => SCENERY[a].n - SCENERY[b].n);
export const SCENERY_BY_CHAR = {};
for (const id of Object.keys(SCENERY)) {
  SCENERY[id].id = id;
  SCENERY_BY_CHAR[SCENERY[id].ch] = SCENERY[id];
}
export const SCENERY_CATS = { terrain: 'Terreno', structure: 'Estrutura', nature: 'Natureza', urban: 'Urbano', modular: 'Blocos modulares' };
export const SCENERY_BEH = { static: 'Estático', destruct: 'Destrutível', interact: 'Interativo', cover: 'Cobertura' };
export { TERRAIN_PAINT };

// peças giradas em Y em torno do centro do objeto; devolve [x, y, z, sx, sy, sz, cor, ry, brilho, marca] no mundo
export function placeParts(parts, x, z, rot = 0) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return parts.map((p) => [x + p[0] * c + p[2] * s, p[1], z - p[0] * s + p[2] * c, p[3], p[4], p[5], p[6], (p[7] || 0) + rot, p[8] || false, p[9] || null]);
}

// Gera o texto do mapa por código: retângulos, pontos e espelhamento horizontal.
export function makeMap(W, D, wall, gates, draw) {
  const g = Array.from({ length: D }, () => Array(W).fill('.'));
  for (let i = 0; i < W; i++) g[0][i] = g[D - 1][i] = wall;
  for (let j = 0; j < D; j++) g[j][0] = g[j][W - 1] = wall;
  const inside = (x, y) => x > 0 && y > 0 && x < W - 1 && y < D - 1;
  const api = {
    put: (x, y, ch) => inside(x, y) && (g[y][x] = ch),
    rect: (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.put(x, y, ch); },
    // mesma peça nos dois lados (espelho horizontal)
    sym: (x, y, ch) => { api.put(x, y, ch); api.put(W - 1 - x, y, ch); },
    symRect: (x0, y0, x1, y1, ch) => { api.rect(x0, y0, x1, y1, ch); api.rect(W - 1 - x1, y0, W - 1 - x0, y1, ch); },
    get: (x, y) => g[y]?.[x],
  };
  draw(api);
  for (const [x, y, n, dir] of gates) for (let k = 0; k < n; k++) g[dir === 'h' ? y : y + k][dir === 'h' ? x + k : x] = 'G';
  return g.map((r) => r.join(''));
}
