// Biblioteca de cenário — expansão 2: objetos interativos, biblioteca modular de blocos e os elementos
// do Laboratório de Pesquisa, do Coliseu da Arena e do Templo Antigo. Mesmo formato de scenery.js / scenery2.js.
//
// Marcas de peça novas (desenhadas pela Arena):
//   'state'  luz de estado (desativado, disponível, ativado, danificado) — cor definida pelo jogo
//   'door'   folha de porta (some quando a porta abre)         'spike'  espinho que sobe e desce
//   'blade'  lâmina que gira em torno do centro                'bars'   grade do portão que sobe
//   'portal' núcleo luminoso que pulsa                         'glyph'  hieróglifo que acende na maldição
//   'liquid' líquido luminoso (apaga quando o tanque quebra)   'plate'  placa de pressão (afunda)
//   'lever'  alavanca (inclina quando puxada)                  'holo'   tela holográfica que flutua
// Extras de catálogo: platform (o piso vira plataforma elevada), mat (material modular), variant (variação)

const R = (r, a, b) => a + (b - a) * r();
const cube = (side, top, extra = []) => [[0, 0.5, 0, 1, 1, 1, side], [0, 0.97, 0, 1.02, 0.08, 1.02, top], ...extra];
const tiles = (g, x, y, P, r, cols, n = 4) => {
  const q = P / n;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.fillRect(x + i * q, y + j * q, q + 0.5, q + 0.5);
    }
};

// ---------------------------------------------------------------- biblioteca modular
// 7 materiais × 8 variações, todos com 1 m de base e encaixe na grade
const MATS = {
  concrete: { name: 'Concreto', base: 0xb8bcc0, dark: 0x8a9096, light: 0xc8ccd0, floor: ['#a8acb0', '#b0b4b8', '#a0a4a8'], hp: 260 },
  metal: { name: 'Metal', base: 0x6a7078, dark: 0x3a3e44, light: 0x8a9098, floor: ['#5a6068', '#626870', '#565c64'], hp: 420 },
  brick: { name: 'Tijolo', base: 0xa8442e, dark: 0x5a2a1e, light: 0xb85a40, floor: ['#9a4a34', '#a8543c', '#8e422e'], hp: 240 },
  stone: { name: 'Pedra', base: 0x8a8c90, dark: 0x5a5c60, light: 0x9a9ca0, floor: ['#8a8c90', '#7e8084', '#96989c'], hp: 320 },
  sand: { name: 'Arenito', base: 0xd8b878, dark: 0xa8884c, light: 0xe8cc90, floor: ['#d8bc80', '#e0c48a', '#ccb074'], hp: 220 },
  glass: { name: 'Vidro', base: 0x9ad8f0, dark: 0x4a6a7a, light: 0xc8f0ff, floor: ['#8ac0d4', '#9acce0', '#80b4c8'], hp: 30, glass: true },
  grate: { name: 'Grade metálica', base: 0x4a4e54, dark: 0x2a2c30, light: 0x6a7078, floor: ['#3a3e44', '#44484e', '#34383e'], hp: 300, grate: true },
};
const H = 2.4; // altura padrão de parede
const matWall = (m) => () => {
  if (m.glass) return [
    [0, 1.2, 0, 0.96, 2.3, 0.3, m.base], [0, 1.2, 0, 0.3, 2.3, 0.96, m.light],
    ...[[0.46, 0.46], [0.46, -0.46], [-0.46, 0.46], [-0.46, -0.46]].map(([a, b]) => [a, 1.2, b, 0.08, H, 0.08, 0x3a3e44]),
    [0, 0.04, 0, 1.02, 0.08, 1.02, 0x3a3e44], [0, 2.38, 0, 1.02, 0.06, 1.02, 0x3a3e44], [0.2, 1.6, 0.16, 0.06, 0.8, 0.01, 0xffffff],
  ];
  if (m.grate) {
    const p = [[0, 1.2, 0, 1, 0.06, 0.06, m.dark], [0, 2.3, 0, 1, 0.08, 0.08, m.dark], [0, 0.1, 0, 1, 0.08, 0.08, m.dark]];
    for (let x = -0.4; x < 0.45; x += 0.2) p.push([x, 1.2, 0, 0.05, 2.3, 0.05, m.base]);
    return p;
  }
  return [[0, H / 2, 0, 1, H, 1, m.base], [0, 0.8, 0, 1.01, 0.03, 1.01, m.dark], [0, 1.6, 0, 1.01, 0.03, 1.01, m.dark], [0, H + 0.02, 0, 1.03, 0.04, 1.03, m.light]];
};
const matDamaged = (m) => (r) => {
  const h = R(r, 1.5, 2.1);
  const p = [[0, h / 2, 0, 1, h, 1, m.base], [R(r, -0.25, 0.25), h + 0.15, R(r, -0.2, 0.2), R(r, 0.3, 0.6), 0.3, R(r, 0.5, 0.9), m.base, R(r, 0, 1)]];
  for (const s of [1, -1]) p.push([R(r, -0.3, 0.3), R(r, 0.4, h - 0.3), s * 0.506, 0.03, R(r, 0.4, 0.8), 0.01, m.dark, R(r, -0.5, 0.5)], [R(r, -0.3, 0.3), R(r, 0.3, h - 0.3), s * 0.506, 0.2, 0.16, 0.01, m.dark]);
  p.push([R(r, -0.3, 0.3), 0.12, 0.62, 0.28, 0.24, 0.28, m.base, R(r, 0, 3)]);
  if (m.glass) p.push([0, h / 2, 0.51, 0.06, h, 0.01, 0xffffff, 0.6]);
  return m.grate ? matWall(m)().map((q, k) => (k > 3 && k % 2 ? [q[0], q[1] * 0.6, q[2], q[3], q[4] * 0.6, q[5], q[6], 0.3] : q)) : p;
};
const matDestroyed = (m) => (r) => {
  const p = [];
  for (let k = 0; k < 6; k++) {
    const s = R(r, 0.22, 0.5);
    p.push([R(r, -0.32, 0.32), s * 0.35 + (k > 3 ? 0.22 : 0), R(r, -0.32, 0.32), s, s * 0.7, s * R(r, 0.8, 1.3), [m.base, m.dark, m.light][k % 3], R(r, 0, 3)]);
  }
  return p;
};
const matColumn = (m) => () => [
  [0, 0.12, 0, 0.82, 0.24, 0.82, m.dark], [0, H / 2, 0, 0.5, H - 0.3, 0.5, m.glass ? m.light : m.base], [0, H - 0.1, 0, 0.82, 0.22, 0.82, m.dark],
  [0, H / 2, 0.255, 0.08, H - 0.4, 0.01, m.dark], [0.255, H / 2, 0, 0.01, H - 0.4, 0.08, m.dark],
];
const matCorner = (m) => () => [
  ...matWall(m)(), [0.47, H / 2, 0.47, 0.12, H + 0.04, 0.12, m.dark], [-0.47, H / 2, 0.47, 0.12, H + 0.04, 0.12, m.dark],
  [0.47, H / 2, -0.47, 0.12, H + 0.04, 0.12, m.dark], [-0.47, H / 2, -0.47, 0.12, H + 0.04, 0.12, m.dark],
];
const matPlatform = (m) => () => [
  [0, 0.12, 0, 1, 0.24, 1, m.glass ? m.dark : m.base], [0, 0.25, 0, 1.02, 0.03, 1.02, m.light],
  [0.42, 0.26, 0, 0.06, 0.012, 0.8, 0xe8b020], [-0.42, 0.26, 0, 0.06, 0.012, 0.8, 0xe8b020],
];
const MOD_VARIANTS = [
  ['wall', 'inteiro', 'Bloco inteiro: parede alta, bloqueia passagem e tiros.'],
  ['dmg', 'danificado', 'Rachado e lascado: quebra com tiros e explosões.'],
  ['ruin', 'destruído', 'Restos do bloco: cobertura baixa.'],
  ['col', 'coluna', 'Coluna com base e capitel.'],
  ['corner', 'canto', 'Bloco de canto com quinas reforçadas.'],
  ['floor', 'piso', 'Piso do material, pintado no chão.'],
  ['ramp', 'rampa', 'Rampa de acesso (andável) até as plataformas.'],
  ['plat', 'plataforma', 'Plataforma elevada: rifles e sniper ganham alcance e dano.'],
];
const MODULAR = {};
export const TERRAIN_PAINT3 = {};
export const TERRAIN_CODE3 = {};
let code = 30;
let ch = 0x100; // símbolos de mapa da biblioteca modular: Ā, ā, Ă...
let n = 100;
for (const [mk, m] of Object.entries(MATS))
  for (const [vk, vname, vdesc] of MOD_VARIANTS) {
    const id = `${mk}_${vk}`;
    const def = { n: n++, ch: String.fromCharCode(ch++), name: `${m.name} — ${vname}`, cat: 'modular', mat: mk, variant: vk, desc: vdesc };
    if (vk === 'wall') Object.assign(def, m.glass ? { beh: 'destruct', coll: 'tall', hp: m.hp, glass: true } : m.grate ? { beh: 'cover', coll: 'low', orient: true } : { beh: 'static', coll: 'tall' }, { model: matWall(m) });
    else if (vk === 'dmg') Object.assign(def, { beh: 'destruct', coll: m.grate ? 'low' : 'tall', hp: Math.round(m.hp * (m.glass ? 0.5 : 0.6)), glass: m.glass, model: matDamaged(m) });
    else if (vk === 'ruin') Object.assign(def, { beh: 'cover', coll: 'low', model: matDestroyed(m) });
    else if (vk === 'col') Object.assign(def, { beh: 'static', coll: 'low', model: matColumn(m) });
    else if (vk === 'corner') Object.assign(def, { beh: 'static', coll: m.grate ? 'low' : 'tall', model: matCorner(m) });
    else if (vk === 'floor' || vk === 'ramp') {
      Object.assign(def, { beh: 'static', coll: 'floor', model: () => cube(m.base, m.light, vk === 'ramp' ? [[0, 1.02, 0, 0.7, 0.02, 0.12, 0xe8b020, 0.6], [0, 1.02, 0.25, 0.7, 0.02, 0.12, 0xe8b020, 0.6]] : []) });
      TERRAIN_CODE3[id] = code++;
      TERRAIN_PAINT3[id] = vk === 'floor'
        ? (g, x, y, P, r) => { tiles(g, x, y, P, r, m.floor, m.grate || m.metal ? 2 : 4); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.strokeRect(x + 0.5, y + 0.5, P - 1, P - 1); }
        : (g, x, y, P, r) => {
          // degraus em faixas (claro → escuro) com setas amarelas
          for (let k = 0; k < 4; k++) {
            g.fillStyle = m.floor[k % m.floor.length];
            g.fillRect(x, y + (k * P) / 4, P, P / 4 + 0.5);
            g.fillStyle = 'rgba(0,0,0,0.2)';
            g.fillRect(x, y + ((k + 1) * P) / 4 - 2, P, 2);
          }
          g.fillStyle = 'rgba(232,176,32,0.75)';
          g.beginPath();
          g.moveTo(x + P * 0.3, y + P * 0.62);
          g.lineTo(x + P * 0.5, y + P * 0.38);
          g.lineTo(x + P * 0.7, y + P * 0.62);
          g.closePath();
          g.fill();
          void r;
        };
    } else if (vk === 'plat') Object.assign(def, { beh: 'interact', coll: 'none', platform: true, model: matPlatform(m) });
    MODULAR[id] = def;
  }

// símbolo de mapa de uma peça modular: modCh('glass', 'wall')
export const modCh = (mat, variant) => MODULAR[`${mat}_${variant}`].ch;

// ---------------------------------------------------------------- terrenos das arenas novas
Object.assign(TERRAIN_PAINT3, {
  labtile: (g, x, y, P, r) => {
    tiles(g, x, y, P, r, ['#d0d6dc', '#c8ced4', '#d8dee2'], 2);
    g.strokeStyle = 'rgba(40,60,70,0.35)';
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, P / 2, P / 2);
    g.strokeRect(x + P / 2 + 0.5, y + P / 2 + 0.5, P / 2 - 1, P / 2 - 1);
    if (r() < 0.12) {
      g.fillStyle = 'rgba(48,208,160,0.5)';
      g.fillRect(x + 2, y + P / 2 - 1, P - 4, 2);
    }
  },
  mosaic: (g, x, y, P, r) => {
    tiles(g, x, y, P, r, ['#c8a874', '#b89860', '#d4b480'], 4);
    g.fillStyle = r() < 0.5 ? 'rgba(160,40,30,0.55)' : 'rgba(30,60,120,0.45)';
    g.fillRect(x + P * 0.375, y + P * 0.375, P / 4, P / 4);
  },
  sandstone: (g, x, y, P, r) => {
    g.fillStyle = '#c8a868';
    g.fillRect(x, y, P, P);
    g.strokeStyle = 'rgba(90,60,30,0.45)';
    g.lineWidth = 1.5;
    for (let j = 0; j < 2; j++) {
      const off = j % 2 ? P / 4 : 0;
      for (let i = -1; i < 2; i++) {
        g.fillStyle = ['#c8a868', '#bc9c5c', '#d4b474'][Math.floor(r() * 3)];
        g.fillRect(x + off + i * (P / 2) + 1, y + j * (P / 2) + 1, P / 2 - 2, P / 2 - 2);
        g.strokeRect(x + off + i * (P / 2), y + j * (P / 2), P / 2, P / 2);
      }
    }
  },
});
Object.assign(TERRAIN_CODE3, { labtile: 21, mosaic: 22, sandstone: 23 });

// ---------------------------------------------------------------- objetos interativos comuns
const stateLamp = (x, y, z) => [x, y, z, 0.1, 0.1, 0.1, 0x2ecc71, 0, true, 'state'];
const chemTank = () => [
  [0, 0.1, 0, 0.96, 0.2, 0.96, 0x3a3e44], [0, 1.0, 0, 0.82, 1.6, 0.6, 0xd8d0b0], [0, 1.0, 0, 0.6, 1.6, 0.82, 0xd8d0b0], [0, 1.0, 0, 0.76, 1.6, 0.76, 0xd8d0b0],
  [0, 1.15, 0, 0.84, 0.36, 0.84, 0xe8b020], [0, 1.15, 0.425, 0.3, 0.26, 0.01, 0x1a1a1a], [0, 1.15, 0.43, 0.14, 0.14, 0.01, 0x8aff4a, 0, true, 'liquid'],
  [0, 1.85, 0, 0.5, 0.14, 0.5, 0xb0a890], [0.3, 1.95, 0, 0.08, 0.3, 0.08, 0x5a5e66], stateLamp(0.3, 2.14, 0),
];
const medTotem = () => [
  [0, 0.1, 0, 0.8, 0.2, 0.8, 0x2a2e36], [0, 0.75, 0, 0.42, 1.1, 0.42, 0xe8ecf0], [0, 0.75, 0, 0.46, 0.1, 0.46, 0x2ecc71],
  [0, 1.45, 0, 0.62, 0.3, 0.2, 0xe8ecf0], [0, 1.45, 0.105, 0.36, 0.1, 0.01, 0xe53935, 0, true, 'state'], [0, 1.45, 0.105, 0.1, 0.26, 0.01, 0xe53935, 0, true, 'state'],
  [0, 1.75, 0, 0.14, 0.14, 0.14, 0x2ecc71, 0, true, 'state'],
];
const wavePortal = () => [
  [0, 0.04, 0, 1.0, 0.08, 1.0, 0x2a2232], ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const a = (k / 8) * Math.PI * 2;
    return [Math.sin(a) * 0.42, 0.1, Math.cos(a) * 0.42, 0.22, 0.12, 0.12, 0x4a3a5a, a];
  }),
  [0, 0.09, 0, 0.6, 0.02, 0.6, 0xb060ff, 0, true, 'portal'], [0, 0.11, 0, 0.3, 0.02, 0.3, 0xe8c0ff, 0, true, 'portal'],
];

// ---------------------------------------------------------------- Laboratório de Pesquisa
const LABW = 0xd8dde2;
const labWall = () => [
  [0, 1.2, 0, 1, 2.4, 1, LABW], [0, 0.08, 0, 1.02, 0.16, 1.02, 0x3a4048], [0, 2.42, 0, 1.04, 0.06, 1.04, 0x9aa2aa],
  [0, 1.0, 0, 1.012, 0.1, 1.012, 0x30a8d0], [0, 1.6, 0, 1.012, 0.03, 1.012, 0xb8c0c8],
  [0.25, 1.2, 0.506, 0.02, 2.2, 0.01, 0xb8c0c8], [-0.25, 1.2, -0.506, 0.02, 2.2, 0.01, 0xb8c0c8],
];
const bioTank = (r) => {
  const c = [0x40ff9a, 0x3ce0ff, 0xb060ff][Math.floor(r() * 3)];
  return [
    [0, 0.15, 0, 0.94, 0.3, 0.94, 0x3a4048], [0, 2.15, 0, 0.94, 0.22, 0.94, 0x3a4048], [0, 2.4, 0, 0.3, 0.3, 0.3, 0x5a6068],
    ...[[0.42, 0.42], [0.42, -0.42], [-0.42, 0.42], [-0.42, -0.42]].map(([a, b]) => [a, 1.15, b, 0.08, 1.8, 0.08, 0x5a6068]),
    [0, 1.15, 0, 0.72, 1.78, 0.72, c, 0, true, 'liquid'],
    [0, 1.25, 0.37, 0.26, 0.5, 0.02, 0x1a2a24], [0, 1.6, 0.37, 0.18, 0.16, 0.02, 0x1a2a24], [0.06, 1.62, 0.39, 0.04, 0.04, 0.01, 0xff3020, 0, true, 'liquid'],
    stateLamp(0.38, 0.32, 0.48),
  ];
};
const capsule = () => [
  [0, 0.12, 0, 0.92, 0.24, 0.92, 0x2a2e36], [0, 1.25, -0.3, 0.9, 2.1, 0.3, 0x5a6068], [0.4, 1.25, 0, 0.1, 2.1, 0.9, 0x5a6068], [-0.4, 1.25, 0, 0.1, 2.1, 0.9, 0x5a6068],
  [0, 2.36, 0, 0.92, 0.18, 0.92, 0x2a2e36], [0, 1.1, 0, 0.36, 1.1, 0.28, 0x4a2a5a], [0, 1.82, 0, 0.3, 0.3, 0.3, 0x6a3a7a], [0.07, 1.86, 0.15, 0.06, 0.04, 0.01, 0xff3a3a, 0, true],
  [0, 1.2, 0.36, 0.72, 1.9, 0.06, 0x8ad8f0, 0, false, 'door'], [0, 1.2, 0.4, 0.62, 0.06, 0.02, 0x3a4048, 0, false, 'door'],
  stateLamp(0, 2.5, 0.3),
];
const holoPanel = () => [
  [0, 0.5, 0, 0.6, 1.0, 0.44, 0x3a4048], [0, 1.02, 0.1, 0.62, 0.06, 0.4, 0x2a2e36], [0, 0.04, 0, 0.7, 0.08, 0.54, 0x30a8d0],
  [0, 1.5, 0.05, 0.8, 0.5, 0.02, 0x3ce0ff, 0, true, 'holo'], [0, 1.5, 0.06, 0.6, 0.06, 0.02, 0xc8f8ff, 0, true, 'holo'], [-0.2, 1.62, 0.06, 0.18, 0.12, 0.02, 0xc8f8ff, 0, true, 'holo'],
  stateLamp(0.24, 1.08, 0.2),
];
const labDoor = () => [
  [-0.46, 1.2, 0, 0.1, 2.4, 0.5, 0x5a6068], [0.46, 1.2, 0, 0.1, 2.4, 0.5, 0x5a6068], [0, 2.32, 0, 1.0, 0.16, 0.5, 0x5a6068],
  [-0.21, 1.1, 0, 0.42, 2.2, 0.14, 0xb8c0c8, 0, false, 'door'], [0.21, 1.1, 0, 0.42, 2.2, 0.14, 0xb8c0c8, 0, false, 'door'],
  [-0.21, 1.1, 0.075, 0.12, 0.6, 0.01, 0xe8b020, 0, false, 'door'], [0.21, 1.1, 0.075, 0.12, 0.6, 0.01, 0xe8b020, 0, false, 'door'],
  stateLamp(0, 2.2, 0.27),
];
const sciEquip = (r) => [
  [0, 0.42, 0, 0.96, 0.08, 0.6, 0xd8dde2], [-0.42, 0.2, 0.24, 0.06, 0.4, 0.06, 0x5a6068], [0.42, 0.2, 0.24, 0.06, 0.4, 0.06, 0x5a6068], [-0.42, 0.2, -0.24, 0.06, 0.4, 0.06, 0x5a6068], [0.42, 0.2, -0.24, 0.06, 0.4, 0.06, 0x5a6068],
  [-0.25, 0.62, 0, 0.18, 0.32, 0.2, 0x2a2e36], [-0.25, 0.82, 0.05, 0.06, 0.18, 0.06, 0x2a2e36],
  ...[0, 1, 2].map((k) => [0.1 + k * 0.13, 0.56 + R(r, 0, 0.06), 0, 0.08, 0.2, 0.08, [0x40ff9a, 0x3ce0ff, 0xb060ff][k], 0, true]),
];
const labPipes = () => {
  const p = [];
  for (const [y, c] of [[0.6, 0x9aa2aa], [1.5, 0x9aa2aa]]) p.push([0, y, 0, 1.02, 0.3, 0.3, c], [0.45, y, 0, 0.06, 0.36, 0.36, 0x5a6068]);
  p.push([-0.2, 0.6, 0, 0.3, 0.32, 0.32, 0x40ff9a, 0, true], [0.2, 1.5, 0, 0.3, 0.32, 0.32, 0x3ce0ff, 0, true], [0, 1.05, 0, 0.1, 1.9, 0.5, 0x5a6068]);
  return p;
};

// ---------------------------------------------------------------- Coliseu da Arena
const STONE = 0xd8ccb0;
const stands = (r) => {
  const p = [[0, 0.4, 0.25, 1, 0.8, 0.5, STONE], [0, 0.9, -0.05, 1, 1.8, 0.5, 0xccc0a4], [0, 1.6, -0.35, 1, 3.2, 0.3, 0xc0b498]];
  // torcida em blocos (cabeças e camisas coloridas)
  for (const [y, z] of [[0.95, 0.3], [1.95, -0.05], [3.3, -0.35]])
    for (let k = 0; k < 2; k++) {
      const x = -0.22 + k * 0.44 + R(r, -0.05, 0.05);
      p.push([x, y, z, 0.26, 0.24, 0.2, [0xc84a3a, 0x3a6ac8, 0xe8b020, 0x4aa04a, 0x8a4ac8][Math.floor(r() * 5)]], [x, y + 0.22, z, 0.2, 0.2, 0.2, [0xe8c29c, 0xb07a52, 0x7a5232][Math.floor(r() * 3)]]);
    }
  return p;
};
const romanColumn = () => [
  [0, 0.15, 0, 0.84, 0.3, 0.84, 0xc8bca0], [0, 1.6, 0, 0.54, 2.6, 0.54, 0xe8dcc0], [0, 1.6, 0, 0.6, 2.5, 0.3, 0xdcd0b4], [0, 1.6, 0, 0.3, 2.5, 0.6, 0xdcd0b4],
  [0, 3.0, 0, 0.84, 0.28, 0.84, 0xc8bca0], [0, 3.18, 0, 0.7, 0.1, 0.7, 0xb8ac90],
];
const portcullis = () => [
  [-0.45, 1.5, 0, 0.14, 3.0, 0.4, 0x8a8070], [0.45, 1.5, 0, 0.14, 3.0, 0.4, 0x8a8070], [0, 3.05, 0, 1.06, 0.3, 0.44, 0x9a9080],
  ...[-0.3, -0.1, 0.1, 0.3].map((x) => [x, 1.4, 0, 0.05, 2.6, 0.05, 0x2a2a2e, 0, false, 'bars']), [0, 2.2, 0, 0.8, 0.06, 0.06, 0x2a2a2e, 0, false, 'bars'], [0, 0.9, 0, 0.8, 0.06, 0.06, 0x2a2a2e, 0, false, 'bars'],
  [0, 0.02, 0, 0.8, 0.03, 0.4, 0x1a1418],
];
const banner = (r) => {
  const c = [0xc8281e, 0x2a4ab0, 0xd8a020][Math.floor(r() * 3)];
  return [[0, 1.3, 0, 0.08, 2.6, 0.08, 0x5a4a3a], [0, 2.55, 0, 0.6, 0.06, 0.06, 0x5a4a3a], [0, 1.95, 0.02, 0.56, 1.1, 0.02, c], [0, 1.4, 0.02, 0.4, 0.14, 0.02, c], [0, 2.0, 0.035, 0.2, 0.2, 0.01, 0xe8c040]];
};
const gladiator = () => [
  [0, 0.4, 0, 0.84, 0.8, 0.84, 0xb8ac90], [0, 0.84, 0, 0.92, 0.08, 0.92, 0xa89c80],
  [0, 1.5, 0, 0.42, 1.0, 0.3, 0xc8c0b0], [0, 2.2, 0, 0.3, 0.32, 0.3, 0xc8c0b0], [0, 2.4, 0, 0.34, 0.08, 0.34, 0xb0a890], [0, 2.48, -0.05, 0.06, 0.2, 0.3, 0xc83a2a],
  [-0.32, 1.5, 0.08, 0.1, 0.6, 0.5, 0xb0a890], [0.3, 1.7, 0.18, 0.08, 0.08, 0.7, 0xa8a8b0],
];
const spikeTrap = () => [
  [0, 0.02, 0, 0.96, 0.04, 0.96, 0x4a4248], ...[-0.3, 0, 0.3].flatMap((a) => [-0.3, 0, 0.3].map((b) => [a, 0.28, b, 0.08, 0.5, 0.08, 0xb8bcc4, 0, false, 'spike'])),
  [0.42, 0.05, 0.42, 0.08, 0.04, 0.08, 0xff3020, 0, true, 'warn'], [-0.42, 0.05, -0.42, 0.08, 0.04, 0.08, 0xff3020, 0, true, 'warn'],
];
const tunnel = () => [
  [0, 0.015, 0, 0.9, 0.03, 0.9, 0x120e10], [0, 0.04, 0, 1.0, 0.04, 0.12, 0x5a4a3a], [0, 0.04, 0, 0.12, 0.04, 1.0, 0x5a4a3a],
  [0.47, 0.06, 0, 0.06, 0.1, 1.0, 0x8a8070], [-0.47, 0.06, 0, 0.06, 0.1, 1.0, 0x8a8070], [0, 0.06, 0.47, 1.0, 0.1, 0.06, 0x8a8070], [0, 0.06, -0.47, 1.0, 0.1, 0.06, 0x8a8070],
];

// ---------------------------------------------------------------- Templo Antigo
const SAND = 0xd8b878;
const sandWall = (r) => {
  const p = [[0, 1.3, 0, 1, 2.6, 1, SAND], [0, 2.64, 0, 1.06, 0.1, 1.06, 0xc8a860]];
  for (let y = 0.4; y < 2.6; y += 0.4) p.push([0, y, 0, 1.012, 0.03, 1.012, 0xa8884c]);
  if (r() < 0.4) p.push([R(r, -0.3, 0.3), R(r, 0.5, 2), 0.506, 0.2, 0.16, 0.01, 0xb89858]);
  return p;
};
const glyphWall = (r) => [
  ...sandWall(r),
  ...[[-0.25, 1.9], [0.15, 1.9], [-0.1, 1.35], [0.25, 1.35], [0, 0.8]].flatMap(([x, y], k) => [
    [x, y, 0.508, 0.16, 0.22, 0.01, 0x8a6a34], [x, y, 0.512, k % 2 ? 0.06 : 0.1, k % 2 ? 0.14 : 0.04, 0.01, 0x40e0c0, 0, true, 'glyph'],
  ]),
];
const obelisk = () => [
  [0, 0.15, 0, 0.9, 0.3, 0.9, 0xc8a868], [0, 1.2, 0, 0.6, 1.8, 0.6, SAND], [0, 2.5, 0, 0.46, 0.8, 0.46, SAND], [0, 3.05, 0, 0.3, 0.3, 0.3, 0xe8c040],
  [0, 1.5, 0.302, 0.12, 0.9, 0.01, 0x40e0c0, 0, true, 'glyph'], [0.302, 1.5, 0, 0.01, 0.9, 0.12, 0x40e0c0, 0, true, 'glyph'],
];
const templePillar = () => [
  [0, 0.15, 0, 0.86, 0.3, 0.86, 0xc8a868], [0, 1.4, 0, 0.6, 2.3, 0.6, SAND], [0, 0.9, 0, 0.64, 0.12, 0.64, 0x2a7a8a], [0, 1.9, 0, 0.64, 0.12, 0.64, 0x2a7a8a],
  [0, 2.65, 0, 0.9, 0.24, 0.9, 0xc8a868],
];
const sarcophagus = () => [
  [0, 0.3, 0, 0.62, 0.6, 0.96, 0xc89a3a], [0, 0.66, 0, 0.66, 0.12, 1.0, 0xe8c040], [0, 0.74, 0.28, 0.3, 0.06, 0.3, 0xe8c040],
  [0, 0.74, 0.3, 0.16, 0.04, 0.12, 0x2a7a8a], [0, 0.3, 0.485, 0.4, 0.3, 0.01, 0x2a7a8a], [0, 0.3, -0.485, 0.4, 0.3, 0.01, 0x2a7a8a],
];
const pressurePlate = () => [[0, 0.02, 0, 0.84, 0.04, 0.84, 0x9a7a44], [0, 0.05, 0, 0.7, 0.04, 0.7, 0xb8945a, 0, false, 'plate'], [0, 0.075, 0, 0.2, 0.01, 0.2, 0x40e0c0, 0, true, 'glyph']];
const dartWall = (r) => [
  ...sandWall(r),
  ...[-0.25, 0, 0.25].flatMap((x) => [[x, 1.1, 0.506, 0.1, 0.1, 0.01, 0x1a120a], [x, 1.1, 0.51, 0.05, 0.05, 0.01, 0xff5020, 0, true, 'warn']]),
  [0, 1.1, 0.507, 0.84, 0.24, 0.01, 0x8a6a34],
];
const spinBlade = () => [
  [0, 0.03, 0, 0.96, 0.06, 0.96, 0x4a3a2a], [0, 0.08, 0, 0.9, 0.04, 0.1, 0x1a120a], [0, 0.35, 0, 0.12, 0.6, 0.12, 0x5a5048],
  [0, 0.55, 0, 1.1, 0.04, 0.16, 0xd8dce4, 0, false, 'blade'], [0, 0.55, 0, 0.16, 0.04, 1.1, 0xc8ccd4, 0, false, 'blade'], [0, 0.58, 0, 0.18, 0.06, 0.18, 0x8a6a34],
];
const secretDoor = (r) => sandWall(r).map((q) => [...q.slice(0, 7), q[7] || 0, false, 'door']);
const lever = () => [
  [0, 0.25, 0, 0.4, 0.5, 0.3, 0xa8884c], [0, 0.52, 0, 0.3, 0.06, 0.2, 0x2a7a8a], [0, 0.8, 0, 0.06, 0.5, 0.06, 0x5a4a3a, 0, false, 'lever'], [0, 1.06, 0, 0.12, 0.12, 0.12, 0xe8c040, 0, false, 'lever'],
  stateLamp(0.14, 0.4, 0.16),
];
const templePortal = () => [
  [0, 0.1, 0, 1.0, 0.2, 0.6, 0xa8884c], [-0.42, 1.2, 0, 0.16, 2.2, 0.3, SAND], [0.42, 1.2, 0, 0.16, 2.2, 0.3, SAND], [0, 2.3, 0, 1.0, 0.22, 0.34, 0xc8a860],
  [0, 1.15, 0, 0.66, 1.9, 0.06, 0x40e0c0, 0, true, 'portal'], [0, 1.15, 0, 0.36, 1.4, 0.07, 0xc8fff4, 0, true, 'portal'], [0, 2.3, 0.18, 0.2, 0.14, 0.02, 0x40e0c0, 0, true, 'glyph'],
];
const altar = () => [
  [0, 0.35, 0, 0.96, 0.7, 0.7, 0xa8884c], [0, 0.74, 0, 1.0, 0.08, 0.74, 0xc8a860], [0, 0.92, 0, 0.26, 0.26, 0.26, 0x40e0c0, 0, true, 'state'],
  [0, 0.35, 0.36, 0.5, 0.3, 0.01, 0x2a7a8a],
];
const torch = () => [
  [0, 0.06, 0, 0.36, 0.12, 0.36, 0x6a5a4a], [0, 0.7, 0, 0.1, 1.2, 0.1, 0x5a4a3a], [0, 1.35, 0, 0.26, 0.12, 0.26, 0x8a6a34],
  [0, 1.52, 0, 0.18, 0.24, 0.18, 0xff8a20, 0, true, 'fire'], [0, 1.66, 0, 0.1, 0.16, 0.1, 0xffd060, 0, true, 'fire'],
];

// ---------------------------------------------------------------- catálogo
export const SCENERY3 = {
  // objetos interativos comuns (podem ir para qualquer arena)
  chemtank: { n: 81, ch: '@', name: 'Tanque químico', cat: 'urban', beh: 'interact', coll: 'tall', hp: 120, shoot: 0.45, states: true, desc: 'Destruído, libera uma nuvem tóxica que fere todos por perto (inclusive a horda).', model: chemTank },
  medtotem: { n: 82, ch: 'Ú', name: 'Totem médico', cat: 'urban', beh: 'interact', coll: 'low', hp: 160, states: true, desc: 'Fique ao lado 1,2 s: cura o time numa área por 6 s. Recarrega em 35 s; danificado, cura metade.', model: medTotem },
  wportal: { n: 83, ch: 'Ô', name: 'Portal de onda', cat: 'urban', beh: 'interact', coll: 'none', spawn: true, desc: 'O sistema de ondas usa o portal para trazer inimigos (pulsa ao abrir).', model: wavePortal },
  // laboratório
  labtile: { n: 84, ch: 'ò', name: 'Piso de laboratório', cat: 'terrain', beh: 'static', coll: 'floor', theme: 'lab', desc: 'Lajotas claras com faixas verdes.', model: () => cube(0xc8ced4, 0xd8dee2) },
  labwall: { n: 85, ch: 'Ë', name: 'Parede de laboratório', cat: 'structure', beh: 'static', coll: 'tall', theme: 'lab', desc: 'Painéis brancos com faixa azul.', model: labWall },
  biotank: { n: 86, ch: 'Ö', name: 'Tanque biológico', cat: 'structure', beh: 'interact', coll: 'tall', hp: 90, shoot: 0.45, states: true, theme: 'lab', light: { at: [0, 1.4, 0.5], i: 7, dist: 6, color: 0x40ffb0 }, desc: 'Cultura em líquido luminoso. Quebrado, vaza ácido e solta o experimento.', model: bioTank },
  capsule: { n: 87, ch: 'Ü', name: 'Cápsula de contenção', cat: 'structure', beh: 'interact', coll: 'tall', states: true, theme: 'lab', desc: 'Na quebra de contenção, abre e libera uma criatura.', model: capsule },
  holopanel: { n: 88, ch: 'Ì', name: 'Painel holográfico', cat: 'urban', beh: 'interact', coll: 'low', states: true, theme: 'lab', light: { at: [0, 1.6, 0.3], i: 12, dist: 9, color: 0x3ce0ff }, desc: 'Fique ao lado 1,5 s: ativa a contenção (tranca as portas, sela as cápsulas e limpa os vazamentos).', model: holoPanel },
  labdoor: { n: 89, ch: 'Í', name: 'Porta automática', cat: 'structure', beh: 'interact', coll: 'none', states: true, theme: 'lab', desc: 'Abre sozinha para os jogadores; os zumbis precisam dar a volta. Trancada na contenção.', model: labDoor },
  sciequip: { n: 90, ch: 'Î', name: 'Equipamento científico', cat: 'urban', beh: 'cover', coll: 'low', theme: 'lab', desc: 'Bancada com microscópio e frascos: cobertura baixa.', model: sciEquip },
  labpipes: { n: 91, ch: 'Ï', name: 'Tubulação de laboratório', cat: 'structure', beh: 'static', coll: 'tall', orient: true, theme: 'lab', desc: 'Canos com fluidos luminosos.', model: labPipes },
  // coliseu
  mosaic: { n: 92, ch: 'ù', name: 'Mosaico da arena', cat: 'terrain', beh: 'static', coll: 'floor', theme: 'colosseum', desc: 'Piso de areia batida com mosaico.', model: () => cube(0xb89860, 0xc8a874) },
  stands: { n: 93, ch: 'Ø', name: 'Arquibancada', cat: 'structure', beh: 'static', coll: 'low', faceOpen: true, theme: 'colosseum', desc: 'Degraus de pedra com a torcida. Bloqueia tiros, mas permite passagem.', model: stands },
  rcolumn: { n: 94, ch: 'Ñ', name: 'Coluna romana', cat: 'structure', beh: 'static', coll: 'low', theme: 'colosseum', desc: 'Coluna canelada com capitel. Bloqueia tiros, mas permite passagem de mobs.', model: romanColumn },
  portcullis: { n: 95, ch: 'Ÿ', name: 'Portão monumental', cat: 'structure', beh: 'interact', coll: 'none', spawn: true, faceOpen: true, theme: 'colosseum', desc: 'A grade sobe e a horda entra por aqui.', model: portcullis },
  banner: { n: 96, ch: 'ß', name: 'Bandeira', cat: 'urban', beh: 'destruct', coll: 'low', hp: 30, shoot: 0.25, theme: 'colosseum', desc: 'Estandarte de tecido: queima e quebra.', model: banner },
  gstatue: { n: 97, ch: 'Æ', name: 'Estátua de gladiador', cat: 'structure', beh: 'static', coll: 'low', theme: 'colosseum', desc: 'Gladiador de pedra com escudo e espada. Bloqueia tiros, mas permite passagem.', model: gladiator },
  spiketrap: { n: 98, ch: 'Œ', name: 'Armadilha de espinhos', cat: 'structure', beh: 'interact', coll: 'none', hazard: true, theme: 'colosseum', desc: 'Avisa com luz vermelha e lança espinhos do chão (fere todos).', model: spikeTrap },
  tunnel: { n: 99, ch: 'Þ', name: 'Túnel subterrâneo', cat: 'structure', beh: 'interact', coll: 'none', spawn: true, theme: 'colosseum', desc: 'Alçapão dos túneis: inimigos sobem por aqui.', model: tunnel },
  // templo
  sandstone: { n: 99.1, ch: 'ð', name: 'Piso de arenito', cat: 'terrain', beh: 'static', coll: 'floor', theme: 'temple', desc: 'Lajes de arenito encaixadas.', model: () => cube(0xbc9c5c, 0xc8a868) },
  sandwall: { n: 99.2, ch: 'Ð', name: 'Muro de arenito', cat: 'structure', beh: 'static', coll: 'tall', theme: 'temple', desc: 'Pedra dourada em fiadas.', model: sandWall },
  glyphwall: { n: 99.3, ch: 'Ê', name: 'Parede de hieróglifos', cat: 'structure', beh: 'interact', coll: 'tall', theme: 'temple', desc: 'Os símbolos acendem durante a maldição.', model: glyphWall },
  obelisk: { n: 99.4, ch: 'Ò', name: 'Obelisco', cat: 'structure', beh: 'interact', coll: 'low', theme: 'temple', desc: 'Agulha de pedra com ponta dourada. Bloqueia tiros, mas permite passagem.', model: obelisk },
  tpillar: { n: 99.5, ch: 'Ó', name: 'Pilar do templo', cat: 'structure', beh: 'static', coll: 'low', theme: 'temple', desc: 'Pilar de arenito com faixas turquesa. Bloqueia tiros, mas permite passagem de mobs.', model: templePillar },
  sarcophagus: { n: 99.6, ch: 'Õ', name: 'Sarcófago', cat: 'structure', beh: 'destruct', coll: 'low', hp: 80, shoot: 0.45, theme: 'temple', desc: 'Cobertura baixa. Quebrado (ou na maldição), pode soltar uma múmia ou um tesouro.', model: sarcophagus },
  pplate: { n: 99.7, ch: 'Ç', name: 'Placa de pressão', cat: 'structure', beh: 'interact', coll: 'none', theme: 'temple', desc: 'Pisou, disparou: os lançadores de dardos próximos atiram.', model: pressurePlate },
  dartwall: { n: 99.8, ch: 'Å', name: 'Lançador de dardos', cat: 'structure', beh: 'interact', coll: 'tall', faceOpen: true, theme: 'temple', desc: 'Atira dardos quando alguém pisa numa placa de pressão próxima.', model: dartWall },
  blade: { n: 99.9, ch: 'Ý', name: 'Lâmina giratória', cat: 'structure', beh: 'interact', coll: 'none', hazard: true, theme: 'temple', desc: 'Gira sem parar e corta quem passa (jogadores e inimigos).', model: spinBlade },
  secretdoor: { n: 99.91, ch: 'Ä', name: 'Porta secreta', cat: 'structure', beh: 'interact', coll: 'tall', theme: 'temple', desc: 'Parece muro. A alavanca abre a passagem para a câmara de desafio.', model: secretDoor },
  lever: { n: 99.92, ch: 'Â', name: 'Alavanca', cat: 'urban', beh: 'interact', coll: 'low', states: true, theme: 'temple', desc: 'Fique ao lado 1 s: abre (ou fecha) as portas secretas.', model: lever },
  tportal: { n: 99.93, ch: 'Ã', name: 'Portal mágico', cat: 'urban', beh: 'interact', coll: 'none', theme: 'temple', desc: 'Entre para sair no portal par do outro lado do templo.', model: templePortal },
  altar: { n: 99.94, ch: 'À', name: 'Altar do desafio', cat: 'urban', beh: 'interact', coll: 'low', states: true, theme: 'temple', desc: 'Fique ao lado 1,5 s: chama uma elite. Vencendo, ganha 2 caixas de suprimentos.', model: altar },
  torch: { n: 99.95, ch: 'Ê'.toLowerCase(), name: 'Tocha', cat: 'urban', beh: 'static', coll: 'low', theme: 'temple', light: { at: [0, 1.6, 0], i: 8, dist: 7, color: 0xff9a40 }, desc: 'Fogo que ilumina os corredores.', model: torch },
  ...MODULAR,
};
