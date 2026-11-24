import * as THREE from 'three';
import { baseMatrix, drawCharacter } from './render.js';

// Modelos 3D dos inimigos, feitos de caixas.
// Humanoides usam o esqueleto de drawCharacter (render.js) com peças extras;
// aranha, morcego, cão e esporo têm esqueletos próprios desenhados aqui.
// extras: [osso, cx, cy, cz, sx, sy, sz, cor, rx?, rz?, brilho?]

const SWAP = { armL: 'armR', armR: 'armL', legL: 'legR', legR: 'legL' };
function mirror(...parts) {
  const out = [];
  for (const e of parts) {
    out.push(e);
    const m = e.slice();
    m[0] = SWAP[e[0]] || e[0];
    m[1] = -e[1];
    if (m[9]) m[9] = -m[9];
    out.push(m);
  }
  return out;
}

const BLOOD = 0x8a1610;
const BLOOD_D = 0x5a0c08;
const TEETH = 0xeee4cc;
const GLOW = true;

// rosto bravo: olhos brilhantes inclinados, sobrancelha e boca com dentes
function face(eye, { brow = 0x2a1a14, mouth = 0x2a0606, open = 0.12, fangs = true } = {}) {
  return [
    ...mirror(
      ['head', 0.13, 0.33, 0.276, 0.12, 0.07, 0.02, eye, 0, 0.28, GLOW],
      ['head', 0.13, 0.405, 0.278, 0.17, 0.045, 0.025, brow, 0, 0.38],
    ),
    ['head', 0, 0.15, 0.277, 0.3, open, 0.02, mouth],
    ...(fangs ? mirror(['head', 0.09, 0.15 + open / 2 - 0.03, 0.284, 0.05, 0.06, 0.015, TEETH], ['head', 0.06, 0.15 - open / 2 + 0.025, 0.284, 0.04, 0.05, 0.015, TEETH]) : []),
  ];
}

// ------------------------------------------------------------------ humanoides
const ZUMBI_SKIN = 0x7fae4a;
const ZUMBI_SHIRT = 0xd6cfbd;
const ZUMBI_HAIR = 0x4a3220;

const PALE = 0xd2b6a0;
const PALE_D = 0xbc9e88;
const STONE = 0x6a5a52;
const STONE_D = 0x4e423c;
const LAVA = 0xff5a1a;
const ROBE = 0x4a2a62;
const ROBE_D = 0x37204a;
const ARMOR = 0x464a50;
const ARMOR_L = 0x5c6168;
const ARMOR_D = 0x2c2f33;

const HUMANS = {
  walker: {
    skin: ZUMBI_SKIN, shirt: ZUMBI_SHIRT, sleeve: ZUMBI_SKIN, pants: 0x5f6b3a, boots: 0x3a3424, noFace: true, arms: 'reach',
    extras: [
      ...face(0xb4ff3a),
      // cabelo
      ['head', 0, 0.56, -0.02, 0.57, 0.08, 0.58, ZUMBI_HAIR],
      ['head', 0, 0.4, -0.275, 0.57, 0.3, 0.04, ZUMBI_HAIR],
      ...mirror(['head', 0.275, 0.46, -0.08, 0.03, 0.16, 0.36, ZUMBI_HAIR]),
      ['head', 0.06, 0.53, 0.26, 0.2, 0.06, 0.06, ZUMBI_HAIR],
      // camisa rasgada com manga curta e sangue
      ...mirror(['armL', 0, -0.07, 0, 0.2, 0.16, 0.22, ZUMBI_SHIRT]),
      ['torso', 0.17, -0.04, 0, 0.1, 0.09, 0.3, ZUMBI_SHIRT],
      ['torso', -0.06, -0.05, 0, 0.09, 0.11, 0.3, ZUMBI_SHIRT],
      ['torso', 0.08, 0.32, 0.166, 0.2, 0.2, 0.012, BLOOD],
      ['torso', -0.14, 0.12, 0.166, 0.13, 0.1, 0.012, BLOOD],
      ['torso', -0.12, 0.38, 0.166, 0.08, 0.08, 0.012, ZUMBI_SKIN],
      ['armR', 0, -0.3, 0.096, 0.09, 0.1, 0.012, BLOOD],
      // calça rasgada mostrando a pele
      ['legL', 0, -0.35, 0.121, 0.12, 0.08, 0.012, ZUMBI_SKIN],
      ['legR', -0.106, -0.26, 0.03, 0.012, 0.1, 0.1, ZUMBI_SKIN],
      ['legR', 0, -0.2, 0.121, 0.08, 0.06, 0.012, BLOOD_D],
    ],
  },

  runner: {
    skin: 0xc9c1b1, shirt: 0xdcd6c6, sleeve: 0xc9c1b1, pants: 0x3c3c3c, boots: 0x2c2a28, noFace: true, arms: 'run',
    extras: [
      ...face(0xff3a2a),
      ['head', 0, 0.56, 0, 0.5, 0.03, 0.5, 0xb8b0a0],
      // regata: ombros de fora
      ...mirror(['torso', 0.235, 0.43, 0, 0.08, 0.13, 0.33, 0xc9c1b1]),
      ['torso', 0, 0.48, 0.166, 0.16, 0.08, 0.012, 0xc9c1b1],
      ['torso', -0.1, 0.22, 0.166, 0.14, 0.16, 0.012, BLOOD],
      ['torso', 0.13, 0.08, 0.166, 0.09, 0.08, 0.012, 0xb0a890],
      // bermuda: canelas de fora
      ...mirror(['legL', 0, -0.35, 0, 0.215, 0.2, 0.245, 0xc9c1b1]),
      ['legL', 0, -0.25, 0.123, 0.21, 0.04, 0.012, 0x2a2a2a],
      ['armL', 0, -0.32, 0.096, 0.07, 0.08, 0.012, BLOOD],
    ],
  },

  brute: {
    skin: PALE, shirt: PALE, sleeve: PALE, hands: 0xa82020, pants: 0x5a4232, boots: 0x332620, noFace: true, arms: 'brawl',
    extras: [
      ...face(0xff3020, { open: 0.14 }),
      ['head', 0, 0.06, 0.27, 0.44, 0.1, 0.05, PALE_D],
      // peito largo, suspensórios e cinto
      ['torso', 0, 0.36, 0.17, 0.5, 0.18, 0.04, PALE_D],
      ...mirror(
        ['torso', 0.14, 0.26, 0.168, 0.07, 0.52, 0.015, 0x6a4428],
        ['torso', 0.14, 0.26, -0.168, 0.07, 0.52, 0.015, 0x6a4428],
        ['torso', 0.14, 0.42, 0.178, 0.09, 0.07, 0.015, 0xb89040],
      ),
      ['torso', 0, 0.025, 0, 0.58, 0.08, 0.36, 0x4a3020],
      ['torso', 0, 0.025, 0.182, 0.1, 0.07, 0.015, 0xb89040],
      ['torso', -0.16, 0.2, 0.172, 0.1, 0.12, 0.012, BLOOD],
      ['head', -0.13, 0.5, 0.276, 0.08, 0.06, 0.012, BLOOD],
      // ombreiras com espinhos, braçadeiras e luvas grandes
      ...mirror(
        ['armL', 0.03, -0.03, 0, 0.3, 0.17, 0.3, 0x55555c],
        ['armL', 0.07, 0.11, 0.07, 0.07, 0.16, 0.07, 0xb4b4bc, 0, -0.45],
        ['armL', 0.07, 0.11, -0.07, 0.07, 0.16, 0.07, 0xb4b4bc, 0, -0.45],
        ['armL', 0, -0.33, 0, 0.23, 0.14, 0.25, 0x5e5e66],
        ['armL', 0.116, -0.33, 0.06, 0.012, 0.04, 0.04, 0xa8a8b0],
        ['armL', 0.116, -0.33, -0.06, 0.012, 0.04, 0.04, 0xa8a8b0],
        ['armL', 0, -0.48, 0, 0.25, 0.19, 0.27, 0xa82020],
      ),
      ['armR', 0, -0.16, 0.096, 0.07, 0.09, 0.012, BLOOD],
    ],
  },

  spitter: {
    skin: 0x7e9a48, shirt: 0x7e9a48, sleeve: 0x7e9a48, pants: 0x5a4a34, boots: 0x3a3022, noFace: true, arms: 'reach',
    extras: [
      ...face(0x9aff3a, { open: 0.18, mouth: 0x1e1406 }),
      ['head', 0.03, 0.02, 0.29, 0.09, 0.16, 0.04, 0x8aff3a, 0, 0, GLOW],
      ['head', 0, 0.56, 0, 0.5, 0.03, 0.5, 0x6e8a40],
      // barriga inchada, feridas e ombros grossos
      ['torso', 0, 0.2, 0.19, 0.52, 0.38, 0.12, 0x8aa856],
      ['torso', 0, 0.14, 0.255, 0.36, 0.22, 0.02, 0xa4b878],
      ['torso', 0.14, 0.3, 0.256, 0.12, 0.12, 0.012, BLOOD],
      ['torso', -0.18, 0.08, 0.256, 0.1, 0.1, 0.012, BLOOD_D],
      ['torso', 0, 0.025, 0, 0.6, 0.07, 0.4, 0x4a3a24],
      ...mirror(['armL', 0.02, -0.08, 0, 0.23, 0.22, 0.25, 0x7e9a48]),
      ['armL', 0, -0.25, 0.1, 0.08, 0.1, 0.012, BLOOD],
    ],
  },

  bloater: {
    skin: PALE, shirt: PALE, sleeve: PALE, pants: 0x4a3a2c, boots: 0x2c241c, noFace: true, arms: 'reach',
    extras: [
      ...face(0xff3020),
      // cinto de dinamite (frente, lados e costas) com fita
      ...[-0.2, -0.07, 0.07, 0.2].map((x) => ['torso', x, 0.17, 0.205, 0.11, 0.3, 0.1, 0xc02a1e]),
      ...[-0.2, -0.07, 0.07, 0.2].map((x) => ['torso', x, 0.17, -0.205, 0.11, 0.3, 0.1, 0xb02418]),
      ...mirror(['torso', 0.31, 0.17, 0.06, 0.1, 0.3, 0.1, 0xb02418], ['torso', 0.31, 0.17, -0.06, 0.1, 0.3, 0.1, 0xc02a1e]),
      ['torso', 0, 0.21, 0, 0.66, 0.05, 0.44, 0x3a2a1a],
      ['torso', 0, 0.1, 0, 0.66, 0.04, 0.44, 0x3a2a1a],
      // alças cruzadas
      ['torso', 0, 0.37, 0.168, 0.07, 0.5, 0.015, 0x5a3a20, 0, 0.62],
      ['torso', 0, 0.37, 0.168, 0.07, 0.5, 0.015, 0x5a3a20, 0, -0.62],
      // pavio aceso no ombro
      ['armL', 0.02, 0.07, 0.04, 0.05, 0.14, 0.05, 0x2a2a2a],
      ['armL', 0.02, 0.17, 0.04, 0.1, 0.1, 0.1, 0xffa020, 0.6, 0.6, GLOW],
      ['torso', 0.17, 0.42, 0.166, 0.1, 0.1, 0.012, BLOOD],
      ['armR', 0, -0.25, 0.096, 0.08, 0.12, 0.012, BLOOD],
    ],
  },

  armored: {
    skin: 0x8a8a80, shirt: ARMOR, sleeve: ARMOR, hands: ARMOR_D, pants: 0x2e3034, boots: 0x1c1d20, noFace: true, arms: 'shield',
    extras: [
      // capacete fechado com visor e olhos vermelhos
      ['head', 0, 0.3, 0, 0.62, 0.62, 0.62, ARMOR_L],
      ['head', 0, 0.63, 0, 0.12, 0.06, 0.52, ARMOR],
      ['head', 0, 0.33, 0.312, 0.48, 0.13, 0.02, 0x0e0e10],
      ...mirror(['head', 0.11, 0.33, 0.32, 0.1, 0.055, 0.015, 0xff2a2a, 0, 0.2, GLOW]),
      ['head', 0, 0.17, 0.313, 0.42, 0.03, 0.02, ARMOR_D],
      ['head', 0, 0.1, 0.313, 0.42, 0.03, 0.02, ARMOR_D],
      // peitoral, ombreiras e joelheiras
      ['torso', 0, 0.3, 0.18, 0.5, 0.38, 0.05, ARMOR_L],
      ['torso', 0, 0.3, 0.206, 0.04, 0.3, 0.01, ARMOR_D],
      ['torso', 0, 0.03, 0, 0.58, 0.08, 0.36, ARMOR_D],
      ...mirror(['armL', 0.03, -0.05, 0, 0.27, 0.18, 0.28, ARMOR_L], ['legL', 0, -0.26, 0.13, 0.2, 0.14, 0.04, ARMOR_L]),
      // escudo antimotim no braço esquerdo (eixo z local = para cima com o braço erguido)
      ['armL', -0.04, -0.5, -0.2, 0.64, 0.08, 0.9, 0x55595f],
      ['armL', -0.04, -0.545, -0.2, 0.68, 0.02, 0.94, 0x3a3d42],
      ['armL', -0.04, -0.552, 0.08, 0.34, 0.015, 0.11, 0x9aa4ac],
      ['armL', -0.04, -0.553, 0.08, 0.27, 0.016, 0.05, 0x2a3036],
      ['armL', -0.04, -0.556, -0.5, 0.6, 0.014, 0.2, 0x1a1a1a],
      ...[-0.24, -0.08, 0.08, 0.24].map((x) => ['armL', -0.04 + x, -0.558, -0.5, 0.08, 0.015, 0.2, 0xf0c020]),
    ],
  },

  summoner: {
    skin: 0x24182c, shirt: ROBE, sleeve: ROBE, hands: 0x9a8aa8, pants: ROBE_D, boots: 0x1e1424, noFace: true, arms: 'staff',
    extras: [
      ...mirror(['head', 0.12, 0.3, 0.276, 0.11, 0.06, 0.02, 0xd060ff, 0, 0.22, GLOW]),
      // capuz
      ['head', 0, 0.58, -0.02, 0.66, 0.1, 0.66, ROBE],
      ...mirror(['head', 0.31, 0.27, -0.02, 0.06, 0.62, 0.64, ROBE]),
      ['head', 0, 0.27, -0.32, 0.66, 0.62, 0.06, ROBE],
      ['head', 0, 0.52, 0.31, 0.62, 0.1, 0.04, ROBE_D],
      ['head', 0, 0.62, -0.26, 0.3, 0.14, 0.22, ROBE],
      // manto até os pés, cinto e barra
      ['torso', 0, -0.25, 0, 0.62, 0.52, 0.4, 0x44265a],
      ['torso', 0, -0.49, 0, 0.66, 0.06, 0.44, 0x5e3a78],
      ['torso', 0, 0.04, 0, 0.6, 0.07, 0.38, 0x5a3a20],
      ['torso', 0, 0.04, 0.2, 0.1, 0.08, 0.02, 0xc8a040],
      ['torso', 0, 0.3, 0.166, 0.08, 0.5, 0.012, 0x5e3a78],
      ...mirror(['armL', 0, -0.38, 0, 0.22, 0.12, 0.24, 0x5e3a78]),
      // cajado com cristal roxo (com o braço erguido, o eixo z local aponta para cima)
      ['armR', -0.06, -0.46, 0.15, 0.065, 0.065, 1.75, 0x6a4a2a],
      ['armR', -0.06, -0.46, 0.98, 0.24, 0.05, 0.05, 0x6a4a2a],
      ['armR', -0.06, -0.46, 1.16, 0.16, 0.16, 0.3, 0xc070ff, 0, 0, GLOW],
      ['armR', -0.06, -0.46, 1.16, 0.13, 0.13, 0.13, 0xf0c0ff, 0.785, 0.785, GLOW],
    ],
  },

  reaper: {
    skin: 0xb8b0a0, shirt: 0x2e2438, sleeve: 0x2e2438, hands: 0x9a9284, pants: 0x241c2e, boots: 0x140f18, noFace: true, arms: 'reach',
    extras: [
      ...face(0xff3020, { brow: 0x1a121e, mouth: 0x1a0608, open: 0.1, fangs: false }),
      // capuz pontudo com abertura no rosto
      ['head', 0, 0.58, -0.02, 0.64, 0.12, 0.64, 0x2e2438],
      ...mirror(['head', 0.31, 0.27, -0.02, 0.06, 0.64, 0.64, 0x2e2438]),
      ['head', 0, 0.27, -0.32, 0.64, 0.64, 0.06, 0x2e2438],
      ['head', 0, 0.52, 0.31, 0.6, 0.1, 0.04, 0x3e3050],
      ['head', 0, 0.66, -0.26, 0.3, 0.14, 0.22, 0x2e2438],
      ['head', 0, 0.1, 0.286, 0.24, 0.08, 0.03, 0x1a121e],
      // manto esfarrapado e cinto
      ['torso', 0, -0.24, 0, 0.62, 0.5, 0.42, 0x342840],
      ['torso', 0, -0.48, 0, 0.66, 0.08, 0.46, 0x3e2e4a],
      ...[-0.22, 0, 0.22].map((x, i) => ['torso', x, -0.36 - (i % 2) * 0.04, 0.21, 0.14, 0.2, 0.02, 0x241a2e]),
      ['torso', 0, 0.02, 0, 0.62, 0.08, 0.4, 0x1a1220],
      ['torso', 0, 0.3, 0.166, 0.06, 0.5, 0.012, 0x6a2438],
      ['torso', 0, 0.32, 0.172, 0.1, 0.06, 0.015, 0x9a9284],
      // ombreiras e duas lâminas presas aos braços
      ...mirror(
        ['armL', 0.03, -0.02, 0, 0.28, 0.16, 0.3, 0x3e3050],
        ['armL', 0, -0.28, 0, 0.2, 0.24, 0.22, 0x342840],
        ['armL', 0, -0.44, 0, 0.11, 0.08, 0.2, 0x8a1a2a, 0, 0, GLOW],
        ['armL', 0, -0.68, 0, 0.06, 0.5, 0.16, 0xb8bcc4],
        ['armL', 0, -0.92, 0, 0.04, 0.18, 0.1, 0xe8eef4],
        ['armL', 0, -0.7, 0.09, 0.07, 0.4, 0.015, 0xffffff],
        ['armL', 0, -0.6, -0.09, 0.07, 0.3, 0.015, 0x7a8088],
      ),
    ],
  },

  boss: {
    skin: STONE, shirt: 0x5e4e46, sleeve: STONE, hands: 0x6a3a2c, pants: STONE_D, boots: 0x3a302a, noFace: true, arms: 'brawl',
    extras: [
      ...face(0xff3a1a, { brow: STONE_D, open: 0.16 }),
      // chifres vermelhos
      ...mirror(
        ['head', 0.3, 0.6, 0, 0.13, 0.32, 0.13, 0xb01c1c, 0, -0.55],
        ['head', 0.42, 0.8, 0, 0.09, 0.22, 0.09, 0xd83030, 0, -0.15],
      ),
      ['head', 0, 0.44, 0.285, 0.5, 0.07, 0.04, STONE_D],
      ['head', -0.15, 0.5, 0.277, 0.025, 0.12, 0.01, LAVA, 0, 0.4, GLOW],
      // rachaduras de lava no corpo
      ['torso', 0.06, 0.3, 0.166, 0.03, 0.3, 0.012, LAVA, 0, 0.35, GLOW],
      ['torso', -0.1, 0.17, 0.166, 0.03, 0.22, 0.012, LAVA, 0, -0.5, GLOW],
      ['torso', 0.13, 0.12, 0.166, 0.15, 0.03, 0.012, LAVA, 0, 0, GLOW],
      ['torso', -0.15, 0.4, 0.166, 0.12, 0.025, 0.012, LAVA, 0, 0.3, GLOW],
      ['torso', 0, 0.36, 0.172, 0.5, 0.18, 0.03, 0x655449],
      ['torso', 0, 0.03, 0, 0.6, 0.09, 0.38, 0x3a2e28],
      ['torso', 0, 0.03, 0.195, 0.14, 0.1, 0.02, 0x8a8078],
      ...[0.4, 0.2].map((y) => ['torso', 0, y, -0.2, 0.09, 0.2, 0.09, 0xc02020, -0.6, 0]),
      // ombros de pedra com espinhos e punhos gigantes com lava
      ...mirror(
        ['armL', 0.04, -0.03, 0, 0.32, 0.24, 0.32, 0x5e504a],
        ['armL', 0.1, 0.15, 0.07, 0.08, 0.2, 0.08, 0xc02020, 0, -0.5],
        ['armL', 0.14, 0.08, -0.08, 0.08, 0.18, 0.08, 0xc02020, 0.4, -0.95],
        ['armL', 0.096, -0.22, 0.02, 0.01, 0.14, 0.03, LAVA, 0, 0.3, GLOW],
        ['armL', 0, -0.52, 0, 0.34, 0.28, 0.36, 0x6a3a2c],
        ['armL', 0.172, -0.52, 0, 0.01, 0.2, 0.04, LAVA, 0, 0.3, GLOW],
        ['armL', 0, -0.52, 0.182, 0.22, 0.03, 0.01, LAVA, 0, 0, GLOW],
        ['legL', 0.106, -0.2, 0.02, 0.01, 0.16, 0.03, LAVA, 0, -0.3, GLOW],
      ),
    ],
  },
};

const OTHER_COLORS = {
  spider: [0x3e2436, 0xb81c1c],
  bat: [0x4a2a44, 0xa01c2a],
  dog: [0x6a3a24, 0xb82a2a],
  spore: [0x7a3ab0, 0x5a6a30],
  wasp: [0xc8b020, 0x3a3020],
  specter: [0x70e8ff, 0x2a4a5a],
};

// Chefes das arenas reconstruídas: variantes do corpo do Colosso com cor e detalhes próprios.
const BOSS_VARIANTS = {
  devourer: { skin: 0x7a8a4a, shirt: 0x3a2a22, sleeve: 0x6a7a3a, hands: 0x5a3a2a, pants: 0x2a221c, boots: 0x1e1a14, eye: 0xb4ff3a, accent: 0x8a1a12, shade: 0x2a1a14 },
  mechworker: { skin: 0x7a8088, shirt: 0x2e4a6a, sleeve: 0x5a6068, hands: 0x9aa0a8, pants: 0x3a3e44, boots: 0x22262a, eye: 0x3fe0ff, accent: 0xe8a020, shade: 0x1a1e22 },
  guardian: { skin: 0x5a3a22, shirt: 0x3a5a2a, sleeve: 0x4a3020, hands: 0x6a4a2a, pants: 0x2e2a1a, boots: 0x1e1a12, eye: 0xc070ff, accent: 0x8a1a2a, shade: 0x1a2a14 },
  general: { skin: 0xc9b090, shirt: 0x4a5a2a, sleeve: 0x4a5a2a, hands: 0xb09a7a, pants: 0x2e3420, boots: 0x1e1e18, eye: 0xff3a1a, accent: 0xb01c1c, shade: 0x141a10 },
};
function bossVariant(v) {
  return {
    zombie: true, skin: v.skin, shirt: v.shirt, sleeve: v.sleeve, hands: v.hands, pants: v.pants, boots: v.boots, noFace: true, arms: 'brawl',
    extras: [
      ...face(v.eye, { brow: v.shade, open: 0.14 }),
      // capacete/placas de ombro com detalhe luminoso
      ['head', 0, 0.5, 0, 0.62, 0.18, 0.62, v.shade],
      ['head', 0, 0.42, 0.29, 0.5, 0.05, 0.02, v.accent, 0, 0, GLOW],
      ...mirror(
        ['armL', 0.04, -0.03, 0, 0.34, 0.26, 0.34, v.shade],
        ['armL', 0.1, 0.14, 0.05, 0.07, 0.2, 0.07, v.accent, 0, -0.4],
        ['armL', 0.096, -0.22, 0.02, 0.012, 0.16, 0.03, v.eye, 0, 0.3, GLOW],
        ['armL', 0, -0.52, 0, 0.36, 0.3, 0.38, v.hands],
        ['armL', 0.18, -0.52, 0, 0.012, 0.22, 0.05, v.eye, 0, 0.3, GLOW],
      ),
      ['torso', 0.06, 0.3, 0.166, 0.03, 0.3, 0.012, v.eye, 0, 0.35, GLOW],
      ['torso', -0.1, 0.17, 0.166, 0.03, 0.22, 0.012, v.accent, 0, -0.5, GLOW],
      ['torso', 0, 0.36, 0.172, 0.5, 0.18, 0.03, v.skin],
      ['torso', 0, 0.03, 0.195, 0.14, 0.1, 0.02, v.accent],
    ],
  };
}
Object.assign(HUMANS, Object.fromEntries(Object.entries(BOSS_VARIANTS).map(([k, v]) => [k, bossVariant(v)])));

// aparência de cada tipo (objeto compartilhado; o jogo só lê)
const LOOKS = {};
export function enemyLook(type) {
  if (LOOKS[type]) return LOOKS[type];
  const h = HUMANS[type];
  const NAVAL_PALETTE = {
    nv_pirate:    [0x4a7a74, 0x2c3c4c],
    nv_harpooner: [0x3c6c7c, 0x1e3848],
    nv_mimic:     [0x8a5828, 0xd4a040],
    nv_crab:      [0xc84830, 0x7a2c1e],
    nv_ghost:     [0x70e8ff, 0x286a84],
    nv_octopus:   [0x3c4468, 0x1e2438],
    nv_angler:    [0x286274, 0x40e8ff],
    nv_brute:     [0x3a5a52, 0x222c34],
    nv_shark:     [0x3a6a84, 0x1e3a4c],
    nv_serpent:   [0x1e7a64, 0x30d890],
  };
  const oc = OTHER_COLORS[type] || NAVAL_PALETTE[type] || [0x6a7a72, 0x2e3a44]; // tipos sem aparência própria (ex.: laboratório)
  const look = h ? { zombie: true, ...h } : { zombie: true, skin: oc[0], shirt: oc[1] };
  LOOKS[type] = look;
  return look;
}

// ------------------------------------------------------------------ esqueletos próprios
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();
const _sc = new THREE.Vector3();
const _mm = new THREE.Matrix4();
const _e = new THREE.Euler();
const _one = new THREE.Vector3(1, 1, 1);
const _jl = new THREE.Matrix4();
const POOL = Array.from({ length: 16 }, () => new THREE.Matrix4());
let pi = 0;
const _base = new THREE.Matrix4();

// articulação: matriz do pai · translação · rotação (YXZ)
function joint(parent, px, py, pz, rx = 0, ry = 0, rz = 0) {
  const out = POOL[pi++ % POOL.length];
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _jl.compose(_v1.set(px, py, pz), _q, _one);
  return out.multiplyMatrices(parent, _jl);
}

// segmento de caixa entre dois pontos locais (patas)
function seg(B, base, scale, ax, ay, az, bx, by, bz, t, color) {
  _v1.set(ax, ay, az).applyMatrix4(base);
  _v2.set(bx, by, bz).applyMatrix4(base);
  _dir.subVectors(_v2, _v1);
  const len = _dir.length();
  if (len < 1e-4) return;
  _dir.divideScalar(len);
  _q.setFromUnitVectors(_up, _dir);
  _mm.compose(_v1.add(_v2).multiplyScalar(0.5), _q, _sc.set(t * scale, len + t * scale * 0.5, t * scale));
  B.mat(_mm, color);
}

function drawSpider(B, G, base, z, col, t) {
  const sc = z.scale;
  const P = (cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (cx, cy, cz, sx, sy, sz, c, rz = 0) => G.part(base, cx, cy, cz, 0, rz, 0, 0, 0, sx, sy, sz, c);
  const bob = Math.sin(z.walk * 2) * 0.03;
  // abdômen com marca vermelha
  P(0, 0.66 + bob, -0.45, 0.86, 0.62, 0.86, 0x3e2436);
  P(0, 0.98 + bob, -0.45, 0.18, 0.02, 0.56, 0xb81c1c);
  P(0, 0.98 + bob, -0.38, 0.5, 0.02, 0.15, 0xb81c1c);
  P(0.22, 0.98 + bob, -0.66, 0.12, 0.02, 0.12, 0xb81c1c);
  P(-0.22, 0.98 + bob, -0.66, 0.12, 0.02, 0.12, 0xb81c1c);
  P(0, 0.8 + bob, -0.89, 0.4, 0.3, 0.02, 0x2e1a28);
  // tórax e cabeça
  P(0, 0.52, 0.16, 0.62, 0.42, 0.56, 0x4a2a40);
  P(0, 0.74, 0.16, 0.3, 0.03, 0.3, 0xa01818);
  P(0, 0.5, 0.5, 0.46, 0.36, 0.2, 0x3a2030);
  // aglomerado de olhos vermelhos
  for (const [x, y, s] of [[0.09, 0.56, 0.1], [-0.09, 0.56, 0.1], [0.17, 0.46, 0.06], [-0.17, 0.46, 0.06], [0.05, 0.44, 0.06], [-0.05, 0.44, 0.06], [0.13, 0.64, 0.05], [-0.13, 0.64, 0.05]])
    L(x, y, 0.605, s, s, 0.02, 0xff2020);
  // presas
  const bite = (z.attackT > 0 ? 0.4 : 0) + Math.sin(t * 6) * 0.05;
  P(0.1, 0.28, 0.56, 0.07, 0.2, 0.07, TEETH, 0.3 + bite, 0.15);
  P(-0.1, 0.28, 0.56, 0.07, 0.2, 0.07, TEETH, 0.3 + bite, -0.15);
  P(0, 0.34, 0.6, 0.18, 0.06, 0.02, 0x7a1010);
  // 8 patas em grupos alternados
  const zs = [0.36, 0.16, -0.04, -0.24];
  for (let i = 0; i < 4; i++)
    for (const sg of [1, -1]) {
      const ph = z.walk * 1.4 + (i % 2 ? Math.PI : 0) + (sg > 0 ? Math.PI : 0);
      const hx = sg * 0.28;
      const hz = zs[i];
      const spread = (i - 1.5) * 0.42;
      const fx = sg * (0.95 + (i === 0 || i === 3 ? -0.1 : 0.05));
      const fz = hz + spread + Math.sin(ph) * 0.16;
      const fy = Math.max(0, Math.cos(ph)) * 0.14;
      const kx = hx + (fx - hx) * 0.45;
      const kz = hz + (fz - hz) * 0.45;
      seg(B, base, sc, hx, 0.52, hz, kx, 0.95 + fy, kz, 0.1, col(0x3a2236));
      seg(B, base, sc, kx, 0.95 + fy, kz, fx, fy + 0.18, fz, 0.08, col(0x2e1a2a));
      seg(B, base, sc, fx, fy + 0.2, fz, fx * 1.04, fy, fz, 0.07, col(0xb01c1c));
      B.part(base, kx, 0.95 + fy, kz, 0, 0, 0, 0, 0, 0.12, 0.1, 0.12, col(0xa01818));
    }
}

function drawBat(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0, -0.04, 0.36, 0.42, 0.32, 0x4a2a44);
  P(base, 0, -0.04, 0.12, 0.24, 0.26, 0.02, 0x5e3456);
  P(base, 0, 0.38, 0.05, 0.44, 0.38, 0.42, 0x5a3050);
  for (const sg of [1, -1]) {
    P(base, sg * 0.15, 0.64, 0.02, 0.11, 0.2, 0.08, 0x4a2a44, 0, -sg * 0.3);
    P(base, sg * 0.15, 0.63, 0.06, 0.05, 0.12, 0.01, 0xa01c2a, 0, -sg * 0.3);
    G.part(base, sg * 0.1, 0.42, 0.265, 0, sg * 0.3, 0, 0, 0, 0.11, 0.06, 0.02, 0xff2a2a);
    P(base, sg * 0.06, 0.24, 0.272, 0.04, 0.07, 0.012, TEETH);
    P(base, sg * 0.08, -0.28, 0.02, 0.07, 0.14, 0.07, 0x2e1a2a);
  }
  P(base, 0, 0.27, 0.268, 0.2, 0.06, 0.02, 0x2a0a10);
  // asas batendo: membrana vermelha + osso escuro, duas partes
  const flap = Math.sin(t * 15 + z.walk * 0.2) * 0.75 + 0.1;
  for (const sg of [1, -1]) {
    const w1 = joint(base, sg * 0.17, 0.1, -0.05, 0, 0, sg * flap);
    P(w1, sg * 0.36, 0, -0.06, 0.72, 0.03, 0.44, 0xa01c2a);
    P(w1, sg * 0.36, 0.015, 0.16, 0.74, 0.06, 0.06, 0x4a2a44);
    const w2 = joint(w1, sg * 0.72, 0, 0.13, 0, sg * 0.35, sg * flap * 0.6);
    P(w2, sg * 0.3, 0, -0.2, 0.6, 0.03, 0.5, 0xb02030);
    P(w2, sg * 0.3, 0.015, 0.02, 0.62, 0.06, 0.06, 0x4a2a44);
    P(w2, sg * 0.62, 0.015, 0.06, 0.08, 0.06, 0.14, 0x2e1a2a);
    for (const k of [0.12, 0.34, 0.54]) P(w2, sg * k, 0, -0.46, 0.08, 0.03, 0.1, 0xb02030);
  }
}

function drawDog(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const fur = 0x6a3a24;
  const furD = 0x52281a;
  const gait = z.walk * 1.3;
  const bob = Math.abs(Math.sin(gait)) * 0.04;
  // corpo, peito e espinhos
  P(base, 0, 0.64 + bob, -0.1, 0.42, 0.36, 0.88, fur);
  P(base, 0, 0.62 + bob, 0.26, 0.46, 0.46, 0.38, furD);
  P(base, 0, 0.47 + bob, -0.1, 0.34, 0.06, 0.6, 0x7a4a30);
  for (const [zz, hh] of [[0.3, 0.22], [0.12, 0.2], [-0.08, 0.18], [-0.28, 0.14]]) P(base, 0, 0.86 + bob + hh * 0.35, zz, 0.08, hh, 0.12, 0xc03030, -0.55);
  // cauda
  const tail = joint(base, 0, 0.72 + bob, -0.52, -0.9 + Math.sin(t * 9) * 0.2, 0, Math.sin(t * 7) * 0.3);
  P(tail, 0, 0.2, 0, 0.08, 0.4, 0.08, furD);
  // cabeça com focinho, mandíbula aberta, olhos vermelhos
  const head = joint(base, 0, 0.8 + bob, 0.44, -0.1 + (z.state === 'lunge' ? -0.3 : 0), 0, Math.sin(gait * 0.5) * 0.05);
  P(head, 0, 0.06, 0.12, 0.38, 0.34, 0.36, fur);
  P(head, 0, -0.02, 0.38, 0.26, 0.17, 0.24, furD);
  P(head, 0, 0.06, 0.5, 0.1, 0.06, 0.03, 0x1a1010);
  const jaw = 0.3 + (z.attackT > 0 || z.state === 'lunge' ? 0.35 : 0);
  P(head, 0, -0.14, 0.32, 0.24, 0.06, 0.24, 0x4a2418, jaw);
  P(head, 0, -0.1, 0.34, 0.2, 0.04, 0.2, 0x8a1a1a, jaw * 0.5);
  for (const sg of [1, -1]) {
    G.part(head, sg * 0.11, 0.12, 0.305, 0, sg * 0.3, 0, 0, 0, 0.09, 0.05, 0.02, 0xff2a2a);
    P(head, sg * 0.14, 0.28, 0.02, 0.08, 0.18, 0.08, furD, -0.35, -sg * 0.2);
    P(head, sg * 0.09, -0.11, 0.48, 0.035, 0.07, 0.03, TEETH);
    P(head, sg * 0.09, -0.16, 0.41, 0.035, 0.06, 0.03, TEETH, jaw);
  }
  // patas (trote: diagonais juntas)
  const legs = [[0.15, 0.3, 0], [-0.15, 0.3, Math.PI], [0.15, -0.42, Math.PI], [-0.15, -0.42, 0]];
  for (const [x, zz, ph] of legs) {
    const a = z.state === 'lunge' ? (zz > 0 ? -1.1 : 0.9) : Math.sin(gait + ph) * 0.65;
    const leg = joint(base, x, 0.52 + bob, zz, a, 0, 0);
    P(leg, 0, -0.23, 0, 0.13, 0.5, 0.15, furD);
    P(leg, 0, -0.48, 0.04, 0.15, 0.07, 0.21, 0x3a1e14);
  }
}

function drawSpore(B, G, base, z, col, t) {
  const sc = z.scale;
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const pulse = 1 + Math.sin(t * 3.2 + z.walk) * 0.05 + (z.attackT > 0 ? 0.12 : 0);
  // raízes
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    const r = 0.5 + Math.sin(z.walk * 1.5 + k) * 0.05;
    seg(B, base, sc, Math.sin(a) * 0.12, 0.2, Math.cos(a) * 0.12, Math.sin(a) * r, 0.03, Math.cos(a) * r, 0.1, col(k % 2 ? 0x4a5a28 : 0x3e4c22));
  }
  // caule com anéis
  const stem = joint(base, 0, 0, 0, Math.sin(t * 1.3) * 0.06, 0, Math.sin(t * 1.7 + 1) * 0.06);
  P(stem, 0, 0.4, 0, 0.44, 0.72, 0.44, 0x5a6a30);
  P(stem, 0, 0.3, 0, 0.47, 0.06, 0.47, 0x46542a);
  P(stem, 0, 0.55, 0, 0.47, 0.06, 0.47, 0x46542a);
  P(stem, 0.12, 0.42, 0.225, 0.08, 0.2, 0.012, 0x6e8040);
  // cacho de bolhas roxas com espinhos rosa
  const bulbs = [[0, 1.0, 0, 0.6], [0.34, 0.9, 0.1, 0.46], [-0.32, 0.92, 0.08, 0.46], [0.08, 0.94, 0.34, 0.44], [-0.1, 0.92, -0.32, 0.46], [0.24, 1.24, -0.1, 0.42], [-0.22, 1.26, 0.14, 0.42], [0.04, 1.44, 0.02, 0.38], [0.3, 1.0, -0.3, 0.36]];
  for (const [x, y, zz, s] of bulbs) {
    const ss = s * pulse;
    P(stem, x, y, zz, ss, ss, ss, 0x7a3ab0);
    P(stem, x - s * 0.15, y + ss * 0.5, zz + s * 0.15, s * 0.36, 0.02, s * 0.36, 0xb070e0);
  }
  for (const [x, y, zz, rx, rz] of [[0.3, 1.36, 0, 0.1, -0.5], [-0.3, 1.4, 0.05, 0, 0.5], [0, 1.68, 0, 0, 0], [0.05, 1.3, 0.3, 0.6, 0], [0, 1.28, -0.3, -0.6, 0], [0.48, 1.0, 0.1, 0, -1.1], [-0.46, 1.0, 0.1, 0, 1.1]])
    P(stem, x, y, zz, 0.08, 0.28, 0.08, 0xe070c8, rx, rz);
  // esporos brilhando
  for (let k = 0; k < 3; k++) {
    const a = t * 1.2 + k * 2.1;
    G.part(stem, Math.sin(a) * 0.55, 1.2 + Math.sin(t * 2 + k) * 0.25, Math.cos(a) * 0.55, 0, 0, 0, 0, 0, 0.07, 0.07, 0.07, 0xd080ff);
  }
}

function drawWasp(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const bob = Math.sin(t * 7 + z.walk * 0.4) * 0.04;
  // abdômen listrado, inclinado para trás
  const ab = joint(base, 0, 0.04 + bob, -0.18, -0.22 + Math.sin(t * 2.5) * 0.05, 0, 0);
  P(ab, 0, -0.02, -0.3, 0.44, 0.42, 0.7, 0xd8b820);
  P(ab, 0, -0.02, -0.1, 0.46, 0.44, 0.08, 0x2a2418);
  P(ab, 0, -0.02, -0.32, 0.46, 0.44, 0.08, 0x2a2418);
  P(ab, 0, -0.02, -0.52, 0.42, 0.38, 0.08, 0x2a2418);
  P(ab, 0, -0.02, -0.7, 0.12, 0.12, 0.22, 0x3a3020);
  P(ab, 0, -0.02, -0.83, 0.05, 0.05, 0.12, 0x1a1410);
  // tórax e faixa amarela
  P(base, 0, 0.08 + bob, 0.1, 0.5, 0.46, 0.52, 0x3a3020);
  P(base, 0, 0.22 + bob, 0.1, 0.38, 0.1, 0.38, 0xd8b820);
  P(base, 0, 0.02 + bob, 0.1, 0.42, 0.06, 0.44, 0x2a2418);
  // cabeça com olhos compostos, mandíbulas e antenas
  const head = joint(base, 0, 0.12 + bob, 0.36, -0.08 + (z.attackT > 0 ? 0.25 : 0), 0, 0);
  P(head, 0, 0, 0.08, 0.4, 0.36, 0.36, 0x2e281a);
  P(head, 0, -0.06, 0.2, 0.34, 0.22, 0.2, 0x1a1410);
  for (const sg of [1, -1]) {
    G.part(head, sg * 0.15, 0.05, 0.25, 0, sg * 0.25, 0, 0, 0, 0.18, 0.2, 0.07, 0xc8e020);
    P(head, sg * 0.12, -0.13, 0.28, 0.06, 0.14, 0.06, 0x1a1410, 0.45, sg * 0.25);
    const ant = joint(head, sg * 0.1, 0.16, 0.16, -0.55, 0, sg * 0.55);
    P(ant, 0, 0.14, 0, 0.03, 0.3, 0.03, 0x1a1410);
    P(ant, 0, 0.3, 0, 0.06, 0.08, 0.06, 0xd8b820);
  }
  // asas membranosas batendo
  const flap = 0.35 + Math.sin(t * 28 + z.walk * 0.2) * 0.45;
  for (const sg of [1, -1]) {
    const w1 = joint(base, sg * 0.18, 0.26 + bob, 0.04, 0, sg * 0.35, sg * flap);
    P(w1, sg * 0.42, 0.02, 0.02, 0.86, 0.025, 0.36, 0xb8d8e8);
    P(w1, sg * 0.4, 0.035, 0.02, 0.8, 0.02, 0.05, 0x7a9aaa);
    const w2 = joint(w1, sg * 0.82, 0, 0.03, 0, sg * 0.2, sg * flap * 0.5);
    P(w2, sg * 0.28, 0.01, 0.06, 0.56, 0.02, 0.3, 0xa8c8d8);
    P(w2, sg * 0.28, 0.025, 0.06, 0.5, 0.015, 0.04, 0x7a9aaa);
  }
  // seis patas encolhidas sob o corpo
  for (let k = 0; k < 3; k++)
    for (const sg of [1, -1]) {
      const leg = joint(base, sg * 0.2, -0.14 + bob, 0.22 - k * 0.18, 0, 0, sg * (0.55 + k * 0.12));
      P(leg, 0, -0.16, 0.04, 0.07, 0.32, 0.07, 0x2e281a);
      P(leg, 0, -0.3, 0.1, 0.06, 0.08, 0.18, 0x1a1410);
    }
}

function drawSpecter(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const bob = Math.sin(t * 2.4 + z.walk * 0.3) * 0.07;
  const sway = Math.sin(t * 1.7) * 0.05;
  // cauda espectral em segmentos
  const tail = joint(base, 0, -0.1 + bob, 0, 0, 0, sway);
  P(tail, 0, -0.12, 0, 0.42, 0.34, 0.36, 0x2a4a5a);
  P(tail, 0, -0.38, -0.02, 0.32, 0.3, 0.3, 0x223e4c);
  P(tail, 0, -0.6, 0.02, 0.22, 0.22, 0.22, 0x1a303c);
  P(tail, 0, -0.76, 0.06, 0.1, 0.16, 0.12, 0x142830);
  // farrapos do manto
  for (const [x, zz, ph] of [[-0.24, 0.14, 0], [0.24, -0.08, 1.7], [0.04, 0.2, 3.1]]) {
    const s = joint(base, x, -0.22 + bob, zz, 0, 0, Math.sin(t * 2 + ph) * 0.18);
    P(s, 0, -0.2, 0, 0.12, 0.38, 0.09, 0x223e4c);
  }
  // torso e peito
  P(base, 0, 0.12 + bob, 0, 0.54, 0.52, 0.42, 0x2e5262);
  P(base, 0, 0.2 + bob, 0.2, 0.38, 0.36, 0.04, 0x3a6474);
  P(base, 0, 0.02 + bob, 0, 0.5, 0.06, 0.4, 0x1e3a46);
  // braços com garras
  for (const sg of [1, -1]) {
    const arm = joint(base, sg * 0.31, 0.3 + bob, 0, -0.55 + Math.sin(t * 3 + sg) * 0.08, 0, sg * 0.5);
    P(arm, 0, -0.2, 0, 0.12, 0.42, 0.14, 0x2e5262);
    P(arm, 0, -0.44, 0.02, 0.1, 0.14, 0.16, 0x9ad8d8);
    for (let k = 0; k < 3; k++) P(arm, (k - 1) * 0.045, -0.54, 0.04, 0.03, 0.16, 0.03, 0xd8f8ff);
  }
  // capuz e rosto
  P(base, 0, 0.56 + bob, -0.02, 0.52, 0.44, 0.48, 0x244452);
  P(base, 0, 0.55 + bob, 0.2, 0.36, 0.32, 0.1, 0x142830);
  G.part(base, 0.1, 0.59 + bob, 0.256, 0, 0.25, 0, 0, 0, 0.08, 0.05, 0.02, 0x8af8ff);
  G.part(base, -0.1, 0.59 + bob, 0.256, 0, -0.25, 0, 0, 0, 0.08, 0.05, 0.02, 0x8af8ff);
  P(base, 0, 0.8 + bob, -0.04, 0.42, 0.1, 0.42, 0x1e3a46);
  P(base, 0, 0.52 + bob, -0.25, 0.48, 0.36, 0.08, 0x1e3a46);
  // aura de energia
  for (let k = 0; k < 3; k++) {
    const a = t * 1.4 + k * 2.1;
    G.part(base, Math.sin(a) * 0.5, 0.25 + Math.cos(a * 1.3) * 0.3 + bob, Math.cos(a) * 0.35, 0, 0, 0, 0, 0, 0.06, 0.06, 0.06, 0x70e8ff);
  }
  if (z.attackT > 0) {
    G.part(base, 0.1, 0.59 + bob, 0.27, 0, 0.25, 0, 0, 0, 0.12, 0.08, 0.02, 0xffffff);
    G.part(base, -0.1, 0.59 + bob, 0.27, 0, -0.25, 0, 0, 0, 0.12, 0.08, 0.02, 0xffffff);
  }
}

const BODIES = { spider: drawSpider, bat: drawBat, dog: drawDog, spore: drawSpore, wasp: drawWasp, specter: drawSpecter, nv_crab: drawNvCrab, nv_octopus: drawNvOctopus, nv_angler: drawNvAngler, nv_shark: drawNvShark, nv_serpent: drawNvSerpent, nv_mimic: drawNvMimic, nv_pirate: drawNvPirate, nc_vampire: drawNcVampire, nc_nosferatu: drawNcNosferatu, nc_knight: drawNcKnight, nc_executioner: drawNcExecutioner, nc_reaper: drawNcReaper, nc_banshee: drawNcBanshee, nc_abomination: drawNcAbomination, nc_gargoyle: drawNcGargoyle, nc_plague: drawNcPlague, nc_tombking: drawNcTombking };

// ------------------------------------------------------------------ Egito Antigo (só no Templo Antigo)
const GOLD = 0xd4a020;
const GOLD_L = 0xf0c840;
const IMPERIAL = 0x2a4aa0;
const BANDAGE = 0xd8cba0;
const BANDAGE_D = 0xb3a57a;
const JACKAL = 0x22222a;
// toucado de faraó (nemes) listrado azul e dourado, com abas caindo sobre o peito
const nemes = (c1 = IMPERIAL, c2 = GOLD) => [
  ['head', 0, 0.56, -0.02, 0.64, 0.12, 0.64, c2],
  ['head', 0, 0.49, 0.3, 0.62, 0.07, 0.02, c2],
  ['head', 0, 0.66, 0.26, 0.08, 0.14, 0.06, c2],
  ['head', 0, 0.3, -0.31, 0.62, 0.52, 0.06, c1],
  ...[0.44, 0.28, 0.12].map((y) => ['head', 0, y, -0.345, 0.62, 0.05, 0.012, c2]),
  ...mirror(
    ['head', 0.31, 0.3, -0.04, 0.06, 0.52, 0.52, c1],
    ['head', 0.345, 0.4, -0.04, 0.012, 0.05, 0.52, c2],
    ['head', 0.345, 0.24, -0.04, 0.012, 0.05, 0.52, c2],
    ['torso', 0.2, 0.36, 0.17, 0.13, 0.34, 0.03, c1],
    ['torso', 0.2, 0.42, 0.188, 0.13, 0.04, 0.012, c2],
    ['torso', 0.2, 0.28, 0.188, 0.13, 0.04, 0.012, c2],
  ),
];
// rosto de criatura: olhos vermelhos brilhando, boca aberta com presas
const fiend = (brow = 0x1a1210) => face(0xff2a1a, { brow, mouth: 0x3a0606, open: 0.17, fangs: true });
const bandStripes = (c = BANDAGE_D) => [
  ['head', 0, 0.42, 0.278, 0.58, 0.035, 0.02, c, 0, 0.1],
  ['torso', 0, 0.14, 0.166, 0.56, 0.04, 0.012, c, 0, 0.2],
  ['torso', 0, 0.3, 0.166, 0.56, 0.04, 0.012, c, 0, -0.18],
  ...mirror(['legL', 0, -0.15, 0.121, 0.2, 0.04, 0.012, c, 0, 0.25], ['legL', 0, -0.32, 0.121, 0.2, 0.04, 0.012, c, 0, -0.2], ['armL', 0, -0.2, 0.096, 0.18, 0.035, 0.012, c, 0, 0.3]),
];
Object.assign(HUMANS, {
  // Múmia Guerreira: bandagens, toucado listrado, boca aberta, braceletes azul e dourado
  mummy: {
    skin: BANDAGE, shirt: BANDAGE, sleeve: BANDAGE, hands: BANDAGE_D, pants: BANDAGE, boots: 0x8a7a5a, noFace: true, arms: 'reach',
    extras: [
      ...fiend(BANDAGE_D),
      ...nemes(),
      ...bandStripes(),
      ['torso', 0, 0.5, 0.12, 0.6, 0.1, 0.14, GOLD],
      ['torso', 0, 0.44, 0.19, 0.34, 0.04, 0.012, IMPERIAL],
      ['torso', 0, 0.02, 0, 0.6, 0.08, 0.36, GOLD],
      ['torso', 0, 0.02, 0.185, 0.14, 0.12, 0.012, IMPERIAL],
      ...mirror(['armL', 0, -0.36, 0, 0.22, 0.08, 0.22, IMPERIAL], ['armL', 0, -0.44, 0, 0.22, 0.05, 0.22, GOLD]),
      ['armR', -0.02, -0.66, 0.02, 0.05, 0.26, 0.02, BANDAGE, 0, 0.2],
    ],
  },
  // Guardião Anúbis: chacal preto rosnando, armadura azul e dourada, machado dourado
  anubis: {
    skin: JACKAL, shirt: IMPERIAL, sleeve: JACKAL, hands: JACKAL, pants: GOLD, boots: GOLD, noFace: true, arms: 'brawl',
    extras: [
      // focinho com boca aberta vermelha e presas
      ['head', 0, 0.24, 0.38, 0.26, 0.12, 0.28, JACKAL],
      ['head', 0, 0.3, 0.53, 0.1, 0.06, 0.04, 0x0a0a0a],
      ['head', 0, 0.1, 0.36, 0.22, 0.08, 0.24, JACKAL, 0.25],
      ['head', 0, 0.16, 0.42, 0.2, 0.05, 0.2, 0x8a1010],
      ...mirror(['head', 0.08, 0.19, 0.5, 0.03, 0.06, 0.03, TEETH], ['head', 0.08, 0.12, 0.47, 0.03, 0.05, 0.03, TEETH]),
      ...mirror(['head', 0.17, 0.74, -0.02, 0.11, 0.38, 0.08, JACKAL, 0, -0.1], ['head', 0.17, 0.72, 0.03, 0.05, 0.24, 0.012, GOLD, 0, -0.1]),
      ...mirror(['head', 0.13, 0.38, 0.276, 0.13, 0.05, 0.02, 0xff2a1a, 0, 0.3, GLOW]),
      ...mirror(['head', 0.29, 0.2, -0.05, 0.04, 0.4, 0.4, IMPERIAL], ['head', 0.3, 0.26, -0.05, 0.02, 0.05, 0.4, GOLD], ['head', 0.3, 0.12, -0.05, 0.02, 0.05, 0.4, GOLD]),
      ['head', 0, 0.2, -0.29, 0.56, 0.42, 0.04, IMPERIAL],
      ['torso', 0, 0.48, 0.12, 0.64, 0.16, 0.16, GOLD],
      ['torso', 0, 0.48, 0.2, 0.5, 0.05, 0.012, IMPERIAL],
      ['torso', 0, 0.32, 0.172, 0.22, 0.12, 0.012, GOLD_L, 0, 0, GLOW],
      ['torso', 0, 0.02, 0, 0.62, 0.08, 0.38, GOLD],
      ...mirror(['armL', 0.04, -0.02, 0, 0.32, 0.18, 0.32, GOLD], ['armL', 0.04, 0.06, 0, 0.34, 0.04, 0.34, IMPERIAL], ['armL', 0, -0.45, 0, 0.22, 0.08, 0.22, GOLD]),
      // machado cerimonial grande
      ['armR', 0, -0.55, 0.08, 0.06, 1.1, 0.06, 0x3a2414],
      ['armR', 0, -0.12, 0.32, 0.05, 0.5, 0.36, GOLD],
      ['armR', 0, -0.12, 0.5, 0.06, 0.56, 0.04, GOLD_L],
      ['armR', 0, -0.12, 0.2, 0.06, 0.14, 0.06, IMPERIAL],
    ],
  },
  // Arqueiro do Deserto: múmia encapuzada, arco dourado com flecha em chamas
  archer: {
    skin: BANDAGE, shirt: 0xc8b890, sleeve: BANDAGE, hands: BANDAGE_D, pants: 0xc8b890, boots: 0x7a5a32, noFace: true, arms: 'reach',
    extras: [
      ...fiend(BANDAGE_D),
      // capuz de faixas caindo nas costas
      ['head', 0, 0.54, -0.04, 0.66, 0.16, 0.66, BANDAGE_D],
      ['head', 0, 0.3, -0.31, 0.64, 0.56, 0.06, BANDAGE_D],
      ...mirror(['head', 0.31, 0.32, -0.06, 0.05, 0.5, 0.5, BANDAGE_D]),
      ['torso', 0, 0.4, -0.2, 0.5, 0.4, 0.04, BANDAGE_D],
      ...bandStripes(0xa89a70),
      ['torso', 0, 0.5, 0.15, 0.5, 0.07, 0.06, GOLD],
      ['torso', 0, 0.02, 0, 0.58, 0.07, 0.36, GOLD],
      ['torso', 0.12, 0.34, -0.25, 0.14, 0.44, 0.12, 0x6a4a28, 0, 0.35],
      // arco dourado e flecha em chamas
      ['armL', 0, -0.55, 0.16, 0.06, 1.05, 0.06, GOLD],
      ['armL', 0, -0.55, 0.08, 0.012, 1.0, 0.012, 0xeeeeee],
      ...[-0.06, -1.04].map((y) => ['armL', 0, y, 0.16, 0.07, 0.1, 0.07, GOLD_L]),
      ['armL', 0, -0.55, 0.36, 0.03, 0.03, 0.5, 0x6a4a28],
      ['armL', 0, -0.55, 0.64, 0.08, 0.08, 0.1, 0xff8a1a, 0, 0, GLOW],
    ],
  },
});

// Faraó Renegado (chefão): faraó-múmia gigante, toucado listrado, armadura azul e dourada, olhos vermelhos
HUMANS.pharaoh = {
  zombie: true, skin: BANDAGE, shirt: IMPERIAL, sleeve: BANDAGE, hands: BANDAGE_D, pants: GOLD, boots: GOLD, noFace: true, arms: 'brawl',
  extras: [
    ...fiend(BANDAGE_D),
    ...nemes(),
    ['head', 0, 0.74, 0.02, 0.3, 0.2, 0.3, GOLD_L],
    ['head', 0, 0.86, 0.02, 0.14, 0.12, 0.14, 0xff2a1a, 0, 0, GLOW],
    ...bandStripes(),
    ['torso', 0, 0.5, 0.1, 0.7, 0.18, 0.22, GOLD],
    ['torso', 0, 0.46, 0.21, 0.5, 0.05, 0.012, IMPERIAL],
    ['torso', 0, 0.3, 0.172, 0.3, 0.16, 0.012, GOLD_L, 0, 0, GLOW],
    ['torso', 0, 0.02, 0, 0.66, 0.1, 0.4, GOLD],
    ['torso', 0, -0.1, 0.19, 0.24, 0.2, 0.02, IMPERIAL],
    ...mirror(
      ['armL', 0.04, -0.02, 0, 0.36, 0.24, 0.36, GOLD],
      ['armL', 0.04, 0.08, 0, 0.38, 0.05, 0.38, IMPERIAL],
      ['armL', 0, -0.4, 0, 0.24, 0.1, 0.24, IMPERIAL],
      ['armL', 0, -0.48, 0, 0.24, 0.05, 0.24, GOLD],
      ['legL', 0, -0.12, 0.12, 0.24, 0.1, 0.04, IMPERIAL],
    ),
  ],
};

// Sobek, o Devorador (chefão): crocodilo humanoide, escamas verdes, armadura dourada, mandíbula aberta
const CROC = 0x4a7a3a;
const CROC_D = 0x35602a;
HUMANS.sobek = {
  zombie: true, skin: CROC, shirt: 0x2a2a30, sleeve: CROC, hands: CROC_D, pants: GOLD, boots: CROC_D, noFace: true, arms: 'brawl',
  extras: [
    // focinho comprido com mandíbula aberta, dentes e olhos vermelhos
    ['head', 0, 0.28, 0.52, 0.44, 0.16, 0.56, CROC],
    ['head', 0, 0.36, 0.3, 0.46, 0.08, 0.2, CROC_D],
    ['head', 0, 0.06, 0.48, 0.4, 0.1, 0.5, CROC, 0.35],
    ['head', 0, 0.16, 0.48, 0.36, 0.06, 0.46, 0x8a1010, 0.18],
    ...[0.32, 0.46, 0.6, 0.74].flatMap((zz) => mirror(['head', 0.17, 0.19, zz, 0.04, 0.08, 0.04, TEETH])),
    ...[0.36, 0.5, 0.64].flatMap((zz) => mirror(['head', 0.15, 0.12, zz - 0.02, 0.04, 0.07, 0.04, TEETH, 0.35])),
    ...mirror(['head', 0.15, 0.44, 0.24, 0.12, 0.08, 0.06, 0xff2a1a, 0, 0.2, GLOW]),
    // escamas no topo da cabeça e toucado listrado
    ...[0.12, 0.3, 0.48].map((zz) => ['head', 0, 0.38, zz, 0.08, 0.06, 0.1, CROC_D]),
    ['head', 0, 0.56, -0.08, 0.6, 0.1, 0.5, GOLD],
    ['head', 0, 0.3, -0.31, 0.6, 0.5, 0.06, IMPERIAL],
    ...[0.42, 0.26, 0.1].map((y) => ['head', 0, y, -0.345, 0.6, 0.05, 0.012, GOLD]),
    ...mirror(['head', 0.3, 0.28, -0.1, 0.05, 0.46, 0.4, IMPERIAL], ['head', 0.33, 0.36, -0.1, 0.012, 0.05, 0.4, GOLD]),
    // armadura dourada e azul no peito, ombros e braços; escamas nas costas
    ['torso', 0, 0.48, 0.12, 0.72, 0.18, 0.2, GOLD],
    ['torso', 0, 0.48, 0.225, 0.5, 0.05, 0.012, IMPERIAL],
    ['torso', 0, 0.26, 0.172, 0.34, 0.2, 0.012, GOLD_L],
    ['torso', 0, 0.02, 0, 0.66, 0.1, 0.4, GOLD],
    ...[0.1, 0.3, 0.5].map((y) => ['torso', 0, y, -0.2, 0.2, 0.08, 0.08, CROC_D]),
    ...mirror(
      ['armL', 0.04, -0.02, 0, 0.38, 0.26, 0.38, GOLD],
      ['armL', 0.04, 0.08, 0, 0.4, 0.05, 0.4, IMPERIAL],
      ['armL', 0, -0.42, 0, 0.26, 0.1, 0.26, GOLD],
      ['armL', 0.06, -0.7, 0.1, 0.05, 0.14, 0.05, TEETH, 0.4],
      ['legL', 0, -0.14, 0.12, 0.26, 0.12, 0.04, IMPERIAL],
    ),
    // cauda grossa
    ['torso', 0, -0.05, -0.36, 0.26, 0.24, 0.5, CROC],
    ['torso', 0, -0.18, -0.72, 0.16, 0.16, 0.4, CROC_D],
  ],
};

// Crocodilo do Nilo (filhote de Sobek): baixo, comprido, boca grande
function drawCroc(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const sway = Math.sin(z.walk * 2) * 0.12;
  P(base, 0, 0.3, 0, 0.5, 0.28, 0.9, CROC);
  for (const zz of [-0.3, -0.05, 0.2]) P(base, 0, 0.46, zz, 0.12, 0.06, 0.12, CROC_D);
  const tail = joint(base, 0, 0.3, -0.45, 0, sway, 0);
  P(tail, 0, -0.02, -0.3, 0.3, 0.2, 0.6, CROC_D);
  P(tail, 0, -0.04, -0.7, 0.16, 0.14, 0.4, CROC_D);
  const jaw = z.attackT > 0 || z.state === 'lunge' ? 0.5 : 0.2;
  const hd = joint(base, 0, 0.32, 0.45, 0, -sway * 0.5, 0);
  P(hd, 0, 0.04, 0.3, 0.36, 0.14, 0.6, CROC);
  P(hd, 0, -0.1, 0.26, 0.32, 0.08, 0.52, CROC_D, jaw);
  P(hd, 0, -0.04, 0.28, 0.28, 0.04, 0.48, 0x8a1010, jaw * 0.5);
  for (const sg of [1, -1]) {
    G.part(hd, sg * 0.12, 0.14, 0.12, 0, 0, 0, 0, 0, 0.07, 0.05, 0.06, 0xff2a1a);
    for (const zz of [0.2, 0.36, 0.52]) P(hd, sg * 0.15, -0.04, zz, 0.03, 0.06, 0.03, TEETH);
  }
  P(base, 0, 0.42, 0.42, 0.4, 0.06, 0.1, GOLD);
  for (const [x, zz, ph] of [[0.28, 0.28, 0], [-0.28, 0.28, Math.PI], [0.28, -0.28, Math.PI], [-0.28, -0.28, 0]]) {
    const a = Math.sin(z.walk * 2.4 + ph) * 0.5;
    const leg = joint(base, x, 0.25, zz, a, 0, 0);
    P(leg, 0, -0.12, 0, 0.12, 0.26, 0.14, CROC_D);
  }
}
BODIES.crocling = drawCroc;
OTHER_COLORS.crocling = [CROC, GOLD];

// Bastet Sombria (chefão): felina humanoide preta, armadura roxa e dourada, olhos roxos, cajado-ankh
const CAT = 0x1a1a22;
const VIOLET = 0x5a2a8a;
HUMANS.bastet = {
  zombie: true, skin: CAT, shirt: VIOLET, sleeve: CAT, hands: CAT, pants: 0x2a1640, boots: GOLD, noFace: true, arms: 'brawl',
  extras: [
    // focinho felino, nariz, presas e olhos roxos brilhando
    ['head', 0, 0.18, 0.32, 0.26, 0.14, 0.12, CAT],
    ['head', 0, 0.24, 0.39, 0.08, 0.05, 0.02, 0x4a2a4a],
    ['head', 0, 0.12, 0.385, 0.18, 0.04, 0.012, 0x3a0a3a],
    ...mirror(['head', 0.06, 0.1, 0.39, 0.03, 0.06, 0.02, TEETH]),
    ...mirror(['head', 0.13, 0.36, 0.276, 0.14, 0.07, 0.02, 0xd080ff, 0, 0.3, GLOW]),
    // orelhas pontudas de gato com miolo roxo
    ...mirror(['head', 0.18, 0.7, 0, 0.16, 0.3, 0.1, CAT, 0, -0.25], ['head', 0.17, 0.68, 0.055, 0.08, 0.18, 0.012, 0x8a3ad0, 0, -0.25]),
    // toucado roxo e dourado
    ['head', 0, 0.52, 0.29, 0.6, 0.06, 0.02, GOLD],
    ['head', 0, 0.3, -0.31, 0.6, 0.5, 0.06, VIOLET],
    ...[0.42, 0.26, 0.1].map((y) => ['head', 0, y, -0.345, 0.6, 0.05, 0.012, GOLD]),
    ...mirror(['head', 0.3, 0.26, -0.05, 0.05, 0.42, 0.42, VIOLET], ['head', 0.33, 0.34, -0.05, 0.012, 0.05, 0.42, GOLD]),
    // armadura: colar largo dourado, joia roxa, saia e ombreiras
    ['torso', 0, 0.48, 0.12, 0.64, 0.16, 0.18, GOLD],
    ['torso', 0, 0.48, 0.215, 0.44, 0.05, 0.012, VIOLET],
    ['torso', 0, 0.3, 0.172, 0.16, 0.16, 0.012, 0xd080ff, 0, 0.785, GLOW],
    ['torso', 0, 0.02, 0, 0.62, 0.1, 0.38, GOLD],
    ...mirror(['armL', 0.04, -0.02, 0, 0.34, 0.2, 0.34, GOLD], ['armL', 0, -0.42, 0, 0.24, 0.08, 0.24, GOLD], ['armL', 0.06, -0.68, 0.1, 0.04, 0.14, 0.04, TEETH, 0.5]),
    // cauda
    ['torso', 0, -0.05, -0.3, 0.1, 0.1, 0.4, CAT, -0.4],
    // cajado em forma de ankh com brilho roxo
    ['armR', 0, -0.55, 0.12, 0.06, 1.3, 0.06, GOLD],
    ['armR', 0, 0.2, 0.12, 0.34, 0.06, 0.06, GOLD],
    ['armR', 0, 0.42, 0.12, 0.3, 0.06, 0.06, GOLD],
    ...mirror(['armR', 0.15, 0.36, 0.12, 0.06, 0.22, 0.06, GOLD]),
    ['armR', 0, 0.36, 0.12, 0.2, 0.14, 0.04, 0xd080ff, 0, 0, GLOW],
  ],
};
HUMANS.bastetclone = HUMANS.bastet; // a ilusão tem a mesma aparência (menor)
HUMANS.lich = {
  zombie: true, skin: 0xc8c0b0, shirt: 0x2a1a3a, sleeve: 0x2a1a3a, hands: 0xb0a898, pants: 0x3a2a4a, boots: 0x2a1a3a, noFace: true, arms: 'brawl',
  extras: [
    ['head', 0, 0.82, 0.02, 0.34, 0.3, 0.34, 0xd8d0c0],
    ['head', 0, 0.92, 0.02, 0.18, 0.14, 0.18, 0x6a2a8a, 0, 0, 'glow'],
    ['torso', 0, 0.5, 0.1, 0.6, 0.4, 0.3, 0x2a1a3a],
    ['torso', 0, 0.2, 0.12, 0.4, 0.12, 0.02, 0x6a2a8a, 0, 0, 'glow'],
    ['torso', 0, -0.05, 0, 0.62, 0.12, 0.42, 0x3a2a4a],
  ],
};

// Escaravelho Gigante: carapaça azul e dourada, patas reforçadas, olhos vermelhos
function drawScarab(B, G, base, z, col, t) {
  const P = (cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (cx, cy, cz, sx, sy, sz, c) => G.part(base, cx, cy, cz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const bob = Math.abs(Math.sin(z.walk * 3)) * 0.04;
  // carapaça em duas metades com faixa dourada
  P(0.2, 0.5 + bob, -0.15, 0.38, 0.4, 0.9, 0x1e4a8a);
  P(-0.2, 0.5 + bob, -0.15, 0.38, 0.4, 0.9, 0x1e4a8a);
  P(0, 0.72 + bob, -0.15, 0.06, 0.02, 0.88, GOLD);
  P(0, 0.71 + bob, -0.15, 0.7, 0.02, 0.06, GOLD);
  P(0, 0.42 + bob, -0.62, 0.62, 0.24, 0.12, 0x163a6a);
  // cabeça com chifre e olhos vermelhos
  P(0, 0.42, 0.42, 0.5, 0.3, 0.3, 0x14305a);
  P(0, 0.62, 0.52, 0.08, 0.26, 0.08, GOLD, -0.5);
  L(0.14, 0.48, 0.575, 0.08, 0.06, 0.02, 0xff2a1a);
  L(-0.14, 0.48, 0.575, 0.08, 0.06, 0.02, 0xff2a1a);
  const bite = z.attackT > 0 ? 0.35 : 0;
  P(0.12, 0.28, 0.6, 0.06, 0.06, 0.18, GOLD, 0, 0.4 + bite);
  P(-0.12, 0.28, 0.6, 0.06, 0.06, 0.18, GOLD, 0, -0.4 - bite);
  // 6 patas reforçadas
  const zs = [0.25, -0.1, -0.45];
  for (let i = 0; i < 3; i++)
    for (const sg of [1, -1]) {
      const ph = z.walk * 2.2 + (i % 2 ? Math.PI : 0) + (sg > 0 ? Math.PI : 0);
      const hx = sg * 0.36;
      const hz = zs[i];
      const fx = sg * 0.78;
      const fz = hz + (i - 1) * 0.3 + Math.sin(ph) * 0.14;
      const fy = Math.max(0, Math.cos(ph)) * 0.12;
      seg(B, base, z.scale, hx, 0.4, hz, sg * 0.62, 0.62 + fy, hz, 0.1, col(0x163a6a));
      seg(B, base, z.scale, sg * 0.62, 0.62 + fy, hz, fx, fy, fz, 0.08, col(GOLD));
    }
}
BODIES.scarab = drawScarab;
OTHER_COLORS.scarab = [0x1e4a8a, GOLD];

Object.assign(HUMANS, {
  // Sacerdote Profano: capuz roxo com bordas douradas, rosto de múmia, cajado com orbe roxo
  priest: {
    skin: BANDAGE_D, shirt: 0x5a2a8a, sleeve: 0x5a2a8a, hands: BANDAGE_D, pants: 0x4a2272, boots: 0x2a1640, noFace: true, arms: 'reach',
    extras: [
      ...fiend(0x8a7a50),
      ['head', 0, 0.56, -0.04, 0.68, 0.16, 0.68, 0x4a2272],
      ['head', 0, 0.3, -0.33, 0.68, 0.6, 0.06, 0x4a2272],
      ...mirror(['head', 0.33, 0.32, -0.04, 0.06, 0.56, 0.6, 0x4a2272], ['head', 0.365, 0.32, 0.25, 0.012, 0.56, 0.06, GOLD]),
      ['head', 0, 0.63, 0.27, 0.68, 0.05, 0.03, GOLD],
      ['head', 0, 0.72, 0.24, 0.1, 0.12, 0.05, GOLD],
      ['torso', 0, 0.02, 0, 0.62, 0.3, 0.4, 0x4a2272],
      ['torso', 0, 0.48, 0.15, 0.6, 0.1, 0.08, GOLD],
      ['torso', 0, 0.3, 0.172, 0.1, 0.5, 0.012, GOLD],
      ...mirror(['torso', 0.16, 0.24, 0.172, 0.05, 0.05, 0.012, 0xc070ff, 0, 0, GLOW]),
      ...mirror(['legL', 0, -0.2, 0, 0.26, 0.44, 0.28, 0x4a2272], ['armL', 0, -0.4, 0, 0.22, 0.06, 0.22, GOLD]),
      ['armR', 0, -0.5, 0.12, 0.06, 1.3, 0.06, GOLD],
      ['armR', 0, 0.22, 0.12, 0.24, 0.24, 0.24, 0xc070ff, 0.6, 0.6, GLOW],
      ['armR', 0, 0.22, 0.12, 0.3, 0.06, 0.06, GOLD],
    ],
  },
  // Construto de Areia: blocos de arenito dourado, olhos vermelhos, punhos enormes
  construct: {
    skin: 0xd8a848, shirt: 0xc89838, sleeve: 0xd8a848, hands: 0xb88a38, pants: 0xb8883a, boots: 0x8a6a30, noFace: true, arms: 'brawl',
    extras: [
      ...face(0xff2a1a, { brow: 0x8a6a30, mouth: 0x5a3a14, open: 0.1, fangs: false }),
      ['head', 0, 0.52, 0, 0.66, 0.14, 0.66, 0xb88a38],
      ['head', 0.2, 0.22, 0.25, 0.16, 0.14, 0.08, 0xe8c068],
      ['head', -0.22, 0.46, 0.2, 0.14, 0.1, 0.16, 0xe8c068],
      ['torso', 0, 0.3, 0.17, 0.44, 0.44, 0.04, 0xb88a38],
      ['torso', -0.2, 0.1, 0.18, 0.18, 0.14, 0.05, 0xe8c068],
      ['torso', 0.24, 0.48, 0.18, 0.12, 0.12, 0.05, 0xe8c068],
      ['torso', 0, 0.62, 0, 0.8, 0.16, 0.5, 0xc89838],
      ...mirror(
        ['armL', 0.04, -0.02, 0, 0.4, 0.3, 0.4, 0xb88a38],
        ['armL', 0, -0.56, 0, 0.5, 0.42, 0.5, 0xd8a848],
        ['armL', 0.1, -0.46, 0.16, 0.14, 0.12, 0.2, 0xe8c068],
      ),
      ...mirror(['legL', 0, -0.3, 0.12, 0.26, 0.2, 0.04, 0xb88a38]),
    ],
  },
});
// Serpente Sagrada: corpo em segmentos dourados com faixas vermelhas, cabeça erguida
function drawSerpent(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const n = 7;
  for (let i = 0; i < n; i++) {
    const zz = -0.1 - i * 0.24;
    const xx = Math.sin(z.walk * 1.6 - i * 0.9) * 0.18 * (i / n + 0.3);
    const s = 0.34 - i * 0.03;
    P(base, xx, s / 2, zz, s, s, 0.26, i % 2 ? 0xd4a020 : 0xb88818);
    if (i % 2 === 0) P(base, xx, s + 0.005, zz, s * 0.6, 0.02, 0.1, 0xa01a14);
  }
  // pescoço e cabeça erguidos (sobe mais no bote)
  const up = z.state === 'lunge' ? 0.2 : z.attackT > 0 ? 0.12 : 0;
  // naja erguida: pescoço alto quase vertical
  const neck = joint(base, 0, 0.3, 0.12, -0.12 - up, 0, Math.sin(t * 2) * 0.08);
  P(neck, 0, 0.45, 0, 0.3, 0.95, 0.28, 0xd4a020);
  for (const y of [0.15, 0.45, 0.75]) P(neck, 0, y, 0.145, 0.22, 0.12, 0.012, 0xf0d070);
  const head = joint(neck, 0, 0.95, 0.06, 0.12 + up, 0, 0); // cabeça na horizontal, olhando para frente
  P(head, 0, 0.04, 0.12, 0.44, 0.26, 0.52, 0xd4a020);
  P(head, 0, 0.18, 0.1, 0.36, 0.02, 0.4, 0xa01a14);
  G.part(head, 0.13, 0.1, 0.39, 0, 0, 0, 0, 0, 0.1, 0.07, 0.02, 0xff3a1a);
  G.part(head, -0.13, 0.1, 0.39, 0, 0, 0, 0, 0, 0.1, 0.07, 0.02, 0xff3a1a);
  const bite = z.attackT > 0 || z.state === 'lunge' ? 0.5 : 0.3;
  P(head, 0, -0.1, 0.12, 0.32, 0.08, 0.42, 0xb88818, bite);
  P(head, 0, -0.06, 0.14, 0.26, 0.04, 0.36, 0x8a1010, bite * 0.5);
  for (const sg of [1, -1]) P(head, sg * 0.1, -0.1, 0.4, 0.04, 0.14, 0.03, TEETH);
  // capuz de naja
  // capuz largo atrás da cabeça
  P(neck, 0, 0.72, -0.08, 0.86, 0.7, 0.06, 0xb88818);
  for (const y of [0.5, 0.68, 0.86]) P(neck, 0, y, -0.045, 0.62, 0.05, 0.02, 0xa01a14);
}

// Fantasma do Faraó: corpo translúcido ciano, toucado de faraó, cauda espectral
function drawPhantom(B, G, base, z, col, t) {
  base = joint(base, 0, -0.4, 0); // corpo mais baixo: cabeça na altura dos outros inimigos
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const bob = Math.sin(t * 2.2 + z.walk * 0.3) * 0.07;
  const sway = Math.sin(t * 1.6) * 0.06;
  // cauda que some no ar
  const tail = joint(base, 0, -0.1 + bob, 0, 0, 0, sway);
  L(tail, 0, -0.14, 0, 0.4, 0.3, 0.34, 0x2a8aa8);
  L(tail, 0, -0.4, -0.02, 0.28, 0.26, 0.26, 0x1e6a88);
  L(tail, 0, -0.62, 0.02, 0.16, 0.2, 0.16, 0x145068);
  // tronco com vestes de faraó
  L(base, 0, 0.32 + bob, 0, 0.56, 0.6, 0.36, 0x3ac8e8);
  P(base, 0, 0.5 + bob, 0.16, 0.6, 0.12, 0.08, GOLD);
  P(base, 0, 0.36 + bob, 0.19, 0.26, 0.1, 0.02, IMPERIAL);
  // braços estendidos
  const reach = z.attackT > 0 ? -1.2 : -0.6;
  for (const sg of [1, -1]) {
    const a = joint(base, sg * 0.36, 0.56 + bob, 0, reach, 0, sg * 0.15);
    L(a, 0, -0.26, 0, 0.16, 0.5, 0.16, 0x3ac8e8);
    P(a, 0, -0.1, 0, 0.18, 0.08, 0.18, GOLD);
  }
  // cabeça com toucado (nemes) e olhos luminosos
  const hd = joint(base, 0, 0.94 + bob, 0, 0, 0, sway);
  L(hd, 0, 0, 0, 0.44, 0.44, 0.44, 0x6ae0ff);
  P(hd, 0, 0.2, -0.02, 0.5, 0.12, 0.5, GOLD);
  P(hd, 0.24, -0.04, -0.04, 0.06, 0.42, 0.42, IMPERIAL);
  P(hd, -0.24, -0.04, -0.04, 0.06, 0.42, 0.42, IMPERIAL);
  P(hd, 0, 0.3, 0.18, 0.08, 0.14, 0.06, GOLD);
  for (const sg of [1, -1]) {
    P(hd, sg * 0.1, 0.03, 0.222, 0.13, 0.1, 0.02, 0x0a2a3a);
    L(hd, sg * 0.1, 0.03, 0.232, 0.06, 0.05, 0.02, 0xff2a1a);
    P(hd, sg * 0.245, 0.08, -0.04, 0.012, 0.05, 0.42, GOLD);
    P(hd, sg * 0.245, -0.12, -0.04, 0.012, 0.05, 0.42, GOLD);
  }
  P(hd, 0, -0.13, 0.222, 0.24, 0.1, 0.02, 0x0a2a3a);
  P(hd, 0, -0.12, 0.232, 0.2, 0.04, 0.012, TEETH);
}
BODIES.serpent = drawSerpent;
BODIES.phantom = drawPhantom;
OTHER_COLORS.serpent = [0xd4a020, 0xa01a14];
OTHER_COLORS.phantom = [0x3ac8e8, GOLD];

const BONE = 0xe8e0c8;
const BONE_D = 0xb8ae90;
Object.assign(HUMANS, {
  // Esqueleto de Faraó: ossos, toucado e armadura dourada, espada cerimonial
  skeleton: {
    skin: BONE, shirt: BONE_D, sleeve: BONE, hands: BONE, pants: BONE_D, boots: BONE_D, noFace: true, arms: 'brawl',
    extras: [
      // crânio: órbitas escuras com olhos vermelhos, dentes
      ...mirror(['head', 0.13, 0.33, 0.276, 0.14, 0.12, 0.02, 0x1a1210], ['head', 0.13, 0.33, 0.284, 0.06, 0.05, 0.012, 0xff2a1a, 0, 0, GLOW]),
      ['head', 0, 0.12, 0.278, 0.3, 0.08, 0.02, 0x1a1210],
      ['head', 0, 0.12, 0.284, 0.26, 0.04, 0.012, TEETH],
      // toucado listrado de faraó
      ['head', 0, 0.52, -0.02, 0.62, 0.12, 0.62, GOLD],
      ...mirror(['head', 0.29, 0.24, -0.06, 0.04, 0.42, 0.4, IMPERIAL], ['head', 0.3, 0.24, -0.06, 0.02, 0.06, 0.4, GOLD]),
      ['head', 0, 0.62, 0.22, 0.08, 0.16, 0.06, GOLD],
      // costelas aparentes e armadura dourada
      ...[0.18, 0.28, 0.38].map((y) => ['torso', 0, y, 0.166, 0.44, 0.04, 0.012, 0x1a1210]),
      ['torso', 0, 0.5, 0.15, 0.56, 0.08, 0.06, GOLD],
      ['torso', 0, 0.02, 0, 0.58, 0.08, 0.36, GOLD],
      ...mirror(['armL', 0.04, -0.02, 0, 0.26, 0.14, 0.26, GOLD]),
      // espada cerimonial curva (khopesh)
      ['armR', 0, -0.62, 0.1, 0.05, 0.12, 0.05, 0x5a3a20],
      ['armR', 0, -0.66, 0.36, 0.04, 0.08, 0.46, GOLD_L],
      ['armR', 0, -0.56, 0.6, 0.04, 0.22, 0.12, GOLD_L, 0.6],
    ],
  },
});

// Escorpião Imperial: armadura preta e dourada, pinças robustas, ferrão roxo
function drawScorpion(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const bob = Math.abs(Math.sin(z.walk * 2.5)) * 0.03;
  // corpo segmentado
  P(base, 0, 0.42 + bob, 0.1, 0.62, 0.3, 0.6, 0x1a1a20);
  P(base, 0, 0.58 + bob, 0.1, 0.4, 0.03, 0.5, GOLD);
  P(base, 0, 0.4 + bob, -0.32, 0.5, 0.26, 0.3, 0x22222a);
  G.part(base, 0.12, 0.5, 0.42, 0, 0, 0, 0, 0, 0.07, 0.05, 0.02, 0xff2a1a);
  G.part(base, -0.12, 0.5, 0.42, 0, 0, 0, 0, 0, 0.07, 0.05, 0.02, 0xff2a1a);
  // cauda curvada sobre o corpo, ferrão roxo (golpeia no ataque)
  const strike = z.attackT > 0 ? 0.7 : 0;
  let m = joint(base, 0, 0.45, -0.45, 0.9 - strike * 0.3, 0, Math.sin(t * 2) * 0.05);
  for (let i = 0; i < 4; i++) {
    P(m, 0, 0.13, 0, 0.22 - i * 0.02, 0.26, 0.22 - i * 0.02, i % 2 ? GOLD : 0x1a1a20);
    m = joint(m, 0, 0.24, 0, 0.45 + strike * 0.35, 0, 0);
  }
  P(m, 0, 0.08, 0, 0.14, 0.18, 0.14, 0x7a2ab0);
  G.part(m, 0, 0.2, 0.05, 0.5, 0, 0, 0, 0, 0.05, 0.16, 0.05, 0xc070ff);
  // pinças
  const pinch = z.attackT > 0 ? 0.5 : Math.sin(t * 3) * 0.1;
  for (const sg of [1, -1]) {
    const arm = joint(base, sg * 0.3, 0.42, 0.36, 0, sg * -0.3, 0);
    P(arm, 0, 0, 0.18, 0.12, 0.12, 0.36, 0x1a1a20);
    const claw = joint(arm, 0, 0, 0.4, 0, sg * (0.2 + pinch), 0);
    P(claw, 0, 0, 0.1, 0.22, 0.16, 0.26, GOLD);
    P(claw, sg * -0.08, 0, 0.3, 0.06, 0.1, 0.2, 0x1a1a20);
  }
  // 8 patas
  for (let i = 0; i < 4; i++)
    for (const sg of [1, -1]) {
      const ph = z.walk * 2 + (i % 2 ? Math.PI : 0) + (sg > 0 ? Math.PI : 0);
      const hz = 0.2 - i * 0.18;
      const fz = hz + (i - 1.5) * 0.2 + Math.sin(ph) * 0.1;
      const fy = Math.max(0, Math.cos(ph)) * 0.1;
      seg(B, base, z.scale, sg * 0.3, 0.38, hz, sg * 0.56, 0.52 + fy, hz, 0.07, col(0x1a1a20));
      seg(B, base, z.scale, sg * 0.56, 0.52 + fy, hz, sg * 0.72, fy, fz, 0.06, col(GOLD));
    }
}

// Híbrido Chacal: fera de quatro patas, pelo preto com faixas de múmia, colar dourado, olhos vermelhos
function drawJackal(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const fur = 0x1e1e24;
  const gait = z.walk * 1.4;
  const bob = Math.abs(Math.sin(gait)) * 0.05;
  P(base, 0, 0.68 + bob, -0.1, 0.46, 0.4, 0.92, fur);
  P(base, 0, 0.68 + bob, 0.28, 0.5, 0.5, 0.4, fur);
  // faixas de múmia no corpo e pelos espetados no dorso
  for (const zz of [-0.4, -0.15, 0.1]) P(base, 0, 0.68 + bob, zz, 0.48, 0.42, 0.06, BANDAGE_D, 0.3);
  for (const [zz, hh] of [[0.3, 0.24], [0.1, 0.22], [-0.1, 0.18], [-0.3, 0.14]]) P(base, 0, 0.9 + bob + hh * 0.35, zz, 0.1, hh, 0.12, 0x3a2a1a, -0.55);
  P(base, 0, 0.82 + bob, 0.46, 0.54, 0.1, 0.14, GOLD);
  P(base, 0, 0.8 + bob, 0.54, 0.2, 0.08, 0.02, IMPERIAL);
  const tail = joint(base, 0, 0.76 + bob, -0.56, -0.9 + Math.sin(t * 8) * 0.2, 0, Math.sin(t * 6) * 0.3);
  P(tail, 0, 0.2, 0, 0.1, 0.42, 0.1, fur);
  // cabeça de chacal: orelhas altas, focinho longo, boca aberta
  const lunge = z.state === 'lunge';
  const head = joint(base, 0, 0.92 + bob, 0.5, -0.15 + (lunge ? -0.3 : 0), 0, Math.sin(gait * 0.5) * 0.05);
  P(head, 0, 0.08, 0.1, 0.4, 0.34, 0.36, fur);
  P(head, 0, 0.02, 0.4, 0.24, 0.16, 0.3, fur);
  P(head, 0, 0.08, 0.56, 0.1, 0.06, 0.03, 0x0a0a0a);
  const jaw = 0.35 + (z.attackT > 0 || lunge ? 0.35 : 0);
  P(head, 0, -0.12, 0.34, 0.22, 0.06, 0.28, fur, jaw);
  P(head, 0, -0.08, 0.36, 0.18, 0.04, 0.24, 0x8a1010, jaw * 0.5);
  for (const sg of [1, -1]) {
    G.part(head, sg * 0.12, 0.14, 0.285, 0, sg * 0.3, 0, 0, 0, 0.1, 0.05, 0.02, 0xff2a1a);
    P(head, sg * 0.13, 0.4, 0.02, 0.1, 0.32, 0.08, fur, -0.15, -sg * 0.1);
    P(head, sg * 0.13, 0.38, 0.06, 0.05, 0.22, 0.012, GOLD, -0.15, -sg * 0.1);
    P(head, sg * 0.08, -0.08, 0.53, 0.035, 0.08, 0.03, TEETH);
    P(head, sg * 0.08, -0.15, 0.46, 0.035, 0.06, 0.03, TEETH, jaw);
  }
  const legs = [[0.16, 0.32, 0], [-0.16, 0.32, Math.PI], [0.16, -0.44, Math.PI], [-0.16, -0.44, 0]];
  for (const [x, zz, ph] of legs) {
    const a = lunge ? (zz > 0 ? -1.1 : 0.9) : Math.sin(gait + ph) * 0.7;
    const leg = joint(base, x, 0.56 + bob, zz, a, 0, 0);
    P(leg, 0, -0.25, 0, 0.14, 0.54, 0.16, fur);
    P(leg, 0, -0.2, 0, 0.15, 0.08, 0.17, BANDAGE_D);
    P(leg, 0, -0.52, 0.05, 0.16, 0.07, 0.22, 0x0e0e12);
  }
}

// Portal das Almas: obelisco único de arenito com portal roxo oval na frente, runas e cubos flutuantes
function drawPortal(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const charge = z.state === 'cast' ? 1 : 0;
  const pulse = 0.5 + 0.5 * Math.sin(t * (charge ? 14 : 3));
  P(base, 0, 0.12, 0, 1.3, 0.24, 1.0, 0x8a7a5a);
  P(base, 0, 0.3, 0, 1.1, 0.14, 0.86, 0xa8946a);
  // obelisco afinando para cima com ponta dourada
  P(base, 0, 1.1, 0, 0.9, 1.5, 0.7, 0xc8b080);
  P(base, 0, 2.15, 0, 0.74, 0.6, 0.56, 0xc8b080);
  P(base, 0, 2.6, 0, 0.5, 0.3, 0.4, GOLD, 0, 0);
  P(base, 0, 2.8, 0, 0.24, 0.14, 0.2, GOLD_L);
  // moldura e portal roxo oval
  P(base, 0, 1.05, 0.36, 0.7, 1.2, 0.04, 0x6a5a40);
  const s = 0.9 + pulse * 0.1 + charge * 0.2;
  G.part(base, 0, 1.05, 0.39, 0, 0, 0, 0, 0, 0.5 * s, 1.0 * s, 0.02, charge ? 0xe0a0ff : 0x9a4ae0);
  G.part(base, 0, 1.05, 0.4, 0, t * 2, 0, 0, 0, 0.3 * s, 0.6 * s, 0.02, 0x3a0a6a);
  G.part(base, 0, 1.05, 0.41, 0, 0, 0, 0, 0, 0.12, 0.24, 0.02, 0xffffff);
  // runas roxas nas laterais
  for (const sg of [1, -1]) for (let k = 0; k < 4; k++) G.part(base, sg * 0.46, 0.55 + k * 0.42, 0.2, 0, 0, 0, 0, 0, 0.02, 0.12, 0.1, pulse > 0.5 || charge ? 0xc070ff : 0x7a3ab0);
  // cubos roxos flutuando ao redor
  for (let k = 0; k < 5; k++) {
    const a = t * (0.8 + charge * 2) + k * 1.26;
    G.part(base, Math.sin(a) * 1.0, 1.0 + Math.sin(t * 2 + k) * 0.4 + k * 0.15, Math.cos(a) * 0.7, a, a, 0, 0, 0, 0.14, 0.14, 0.14, 0x9a4ae0);
  }
}

BODIES.jackal = drawJackal;
BODIES.scorpion = drawScorpion;
BODIES.portal = drawPortal;
OTHER_COLORS.scorpion = [0x1a1a20, GOLD];
OTHER_COLORS.jackal = [0x1e1e24, GOLD];
OTHER_COLORS.portal = [0x6a5e52, 0x8a3ad0];

// Carruagem Maldita: carruagem dourada, rodas grandes, dois cavalos esqueletos e condutor infectado
function drawChariot(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const wind = z.state === 'wind';
  const roll = z.walk * 2;
  // caixa da carruagem
  P(base, 0, 0.7, -0.55, 1.1, 0.5, 0.9, GOLD);
  P(base, 0, 0.98, -0.55, 1.14, 0.08, 0.94, GOLD_L);
  P(base, 0, 0.7, -0.09, 1.0, 0.36, 0.04, IMPERIAL);
  P(base, 0, 0.5, 0.3, 0.08, 0.08, 1.0, 0x5a3a20);
  // rodas grandes girando
  for (const sg of [1, -1]) {
    const w = joint(base, sg * 0.62, 0.5, -0.55, roll, 0, 0);
    P(w, 0, 0, 0, 0.08, 0.9, 0.9, 0x3a2a1a);
    P(w, 0, 0, 0, 0.1, 0.12, 0.94, GOLD);
    P(w, 0, 0, 0, 0.1, 0.94, 0.12, GOLD);
    P(w, 0, 0, 0, 0.12, 0.2, 0.2, GOLD_L);
  }
  // condutor múmia com toucado listrado e arco
  P(base, 0, 1.25, -0.5, 0.38, 0.5, 0.3, BANDAGE);
  P(base, 0, 1.3, -0.34, 0.38, 0.04, 0.012, BANDAGE_D);
  P(base, 0, 1.68, -0.5, 0.34, 0.34, 0.34, BANDAGE);
  P(base, 0, 1.88, -0.52, 0.38, 0.08, 0.38, GOLD);
  P(base, 0, 1.68, -0.69, 0.38, 0.36, 0.04, IMPERIAL);
  for (const sg of [1, -1]) P(base, sg * 0.19, 1.62, -0.52, 0.04, 0.34, 0.34, IMPERIAL);
  P(base, 0, 1.58, -0.33, 0.14, 0.06, 0.02, 0x3a0606);
  P(base, 0.3, 1.3, -0.3, 0.05, 0.7, 0.05, GOLD);
  G.part(base, 0.08, 1.7, -0.335, 0, 0, 0, 0, 0, 0.06, 0.04, 0.02, 0xff2a1a);
  G.part(base, -0.08, 1.7, -0.335, 0, 0, 0, 0, 0, 0.06, 0.04, 0.02, 0xff2a1a);
  // dois cavalos esqueletos à frente
  for (const sg of [1, -1]) {
    const hx = sg * 0.32;
    const gal = Math.sin(z.walk * 2.4 + (sg > 0 ? 0 : 1.2));
    P(base, hx, 0.95 + gal * 0.03, 0.85, 0.3, 0.32, 0.8, BONE);
    for (let r = 0; r < 3; r++) P(base, hx, 0.95, 0.65 + r * 0.2, 0.32, 0.04, 0.04, 0x2a2018);
    const nk = joint(base, hx, 1.1, 1.22, -0.7 + (wind ? -0.3 : 0), 0, 0);
    P(nk, 0, 0.2, 0, 0.16, 0.4, 0.18, BONE);
    P(nk, 0, 0.42, 0.14, 0.18, 0.18, 0.36, BONE);
    G.part(nk, 0.06, 0.48, 0.26, 0, 0, 0, 0, 0, 0.05, 0.04, 0.04, wind ? 0xffd040 : 0xff2a1a);
    for (const [lx, lz, ph] of [[0.1, 1.1, 0], [-0.1, 1.1, 1.5], [0.1, 0.6, 3], [-0.1, 0.6, 4.5]]) {
      const a = Math.sin(z.walk * 2.4 + ph) * 0.5;
      const leg = joint(base, hx + lx, 0.8, lz, a, 0, 0);
      P(leg, 0, -0.38, 0, 0.07, 0.76, 0.07, BONE_D);
    }
  }
  // aviso da investida: brilho dourado no chão à frente
  if (wind) G.part(base, 0, 0.03, 1.6, 0, 0, 0, 0, 0, 0.9, 0.02, 1.6 + Math.sin(t * 20) * 0.2, 0xffd040);
}

// Hórus Corrompido: falcão inteiro de asas douradas listradas de azul, olhos vermelhos
function drawHorus(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const flap = Math.sin(t * 8 + z.walk) * 0.5;
  const dive = z.state === 'lunge' ? 0.55 : z.state === 'wind' ? -0.35 : 0.1;
  const body = joint(base, 0, -0.1, 0, dive, 0, 0);
  // corpo horizontal
  P(body, 0, 0, 0, 0.42, 0.38, 0.8, GOLD);
  P(body, 0, -0.12, 0.08, 0.36, 0.16, 0.6, 0xe8d8a0);
  P(body, 0, 0.12, -0.05, 0.3, 0.06, 0.6, IMPERIAL);
  // cauda em leque
  P(body, 0, 0.02, -0.56, 0.44, 0.06, 0.36, IMPERIAL);
  P(body, 0, 0.04, -0.6, 0.3, 0.06, 0.3, GOLD);
  // cabeça de falcão com bico curvo
  const hd = joint(body, 0, 0.22, 0.46, -dive * 0.4, 0, 0);
  P(hd, 0, 0, 0, 0.32, 0.32, 0.32, GOLD);
  P(hd, 0, 0.1, -0.02, 0.34, 0.08, 0.34, IMPERIAL);
  P(hd, 0, -0.04, 0.2, 0.14, 0.12, 0.12, 0x2a2018);
  P(hd, 0, -0.1, 0.26, 0.08, 0.08, 0.06, 0x2a2018, 0.6);
  G.part(hd, 0.12, 0.02, 0.15, 0, 0, 0, 0, 0, 0.06, 0.06, 0.04, 0xff2a1a);
  G.part(hd, -0.12, 0.02, 0.15, 0, 0, 0, 0, 0, 0.06, 0.06, 0.04, 0xff2a1a);
  // asas grandes batendo, com penas azuis nas pontas
  for (const sg of [1, -1]) {
    const wg = joint(body, sg * 0.2, 0.1, 0.05, 0, 0, sg * (0.15 + flap));
    P(wg, sg * 0.5, 0, 0, 1.0, 0.07, 0.6, GOLD);
    for (let k = 0; k < 3; k++) P(wg, sg * (0.3 + k * 0.3), -0.01, -0.28, 0.24, 0.05, 0.16, IMPERIAL);
    const tip = joint(wg, sg * 1.0, 0, 0, 0, 0, sg * flap * 0.6);
    P(tip, sg * 0.32, 0, -0.06, 0.64, 0.05, 0.46, GOLD_L);
    P(tip, sg * 0.4, -0.01, -0.28, 0.5, 0.04, 0.12, IMPERIAL);
  }
  // garras
  for (const sg of [1, -1]) P(body, sg * 0.12, -0.28, 0.12, 0.08, 0.16, 0.08, 0x2a2018);
  if (z.attackT > 0) G.part(hd, 0, -0.04, 0.36, 0, 0, 0, 0, 0, 0.16, 0.16, 0.16, 0x3fe0ff);
}
BODIES.chariot = drawChariot;
BODIES.horus = drawHorus;
OTHER_COLORS.chariot = [GOLD, IMPERIAL];
OTHER_COLORS.horus = [IMPERIAL, GOLD];

// A Esfinge Eterna (chefão final): leão de pedra e ouro com cabeça de faraó, inscrições e olhos vermelhos
function drawSphinx(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const STONE_S = 0xd8b070;
  const STONE_SD = 0xb08a50;
  const step = Math.sin(z.walk * 1.2) * 0.25;
  const slam = z.state === 'slam' ? 0.4 : 0;
  // corpo de leão deitado/andando
  P(base, 0, 0.75, -0.3, 1.1, 0.8, 1.7, STONE_S);
  P(base, 0, 1.18, -0.3, 1.0, 0.08, 1.5, STONE_SD);
  for (const zz of [-0.8, -0.3, 0.2]) P(base, 0.56, 0.8, zz, 0.02, 0.3, 0.3, STONE_SD);
  for (const zz of [-0.8, -0.3, 0.2]) P(base, -0.56, 0.8, zz, 0.02, 0.3, 0.3, STONE_SD);
  // rachaduras brilhando
  G.part(base, 0.565, 0.6, -0.55, 0, 0, 0, 0, 0, 0.02, 0.3, 0.04, 0xff8a1a);
  G.part(base, -0.565, 0.9, 0.05, 0, 0, 0, 0, 0, 0.02, 0.04, 0.3, 0xff8a1a);
  // cauda
  P(base, 0, 0.5, -1.2, 0.14, 0.14, 0.5, STONE_SD, -0.5);
  // patas dianteiras enormes (levantam na pancada)
  for (const sg of [1, -1]) {
    const leg = joint(base, sg * 0.42, 0.7, 0.5, step * sg - slam, 0, 0);
    P(leg, 0, -0.3, 0.1, 0.36, 0.7, 0.4, STONE_S);
    P(leg, 0, -0.62, 0.3, 0.42, 0.18, 0.6, STONE_SD);
    for (const x of [-0.12, 0, 0.12]) P(leg, x, -0.62, 0.62, 0.08, 0.1, 0.06, 0xe8c888);
    const back = joint(base, sg * 0.42, 0.6, -0.95, -step * sg, 0, 0);
    P(back, 0, -0.28, 0, 0.36, 0.6, 0.4, STONE_S);
  }
  // peito e cabeça de faraó com toucado, barba, olhos vermelhos
  P(base, 0, 1.15, 0.45, 0.9, 0.7, 0.5, STONE_S);
  const hd = joint(base, 0, 1.6, 0.55, 0, Math.sin(t * 0.6) * 0.08, 0);
  P(hd, 0, 0.1, 0, 0.62, 0.62, 0.56, STONE_S);
  P(hd, 0, 0.44, -0.02, 0.7, 0.12, 0.62, GOLD);
  P(hd, 0, 0.12, -0.3, 0.72, 0.62, 0.06, IMPERIAL);
  for (const y of [0.28, 0.08, -0.12]) P(hd, 0, y, -0.335, 0.72, 0.05, 0.02, GOLD);
  for (const sg of [1, -1]) {
    P(hd, sg * 0.36, 0, -0.02, 0.06, 0.72, 0.56, IMPERIAL);
    P(hd, sg * 0.395, 0.12, -0.02, 0.012, 0.06, 0.56, GOLD);
    P(hd, sg * 0.395, -0.12, -0.02, 0.012, 0.06, 0.56, GOLD);
    G.part(hd, sg * 0.15, 0.16, 0.285, 0, 0, sg * 0.3, 0, 0, 0.14, 0.07, 0.02, 0xff2a1a);
    P(hd, sg * 0.15, 0.25, 0.285, 0.18, 0.04, 0.02, STONE_SD, 0, sg * 0.35);
  }
  P(hd, 0, 0.62, 0.22, 0.12, 0.2, 0.1, GOLD);
  P(hd, 0, -0.08, 0.285, 0.3, 0.08, 0.02, 0x3a2a14);
  P(hd, 0, -0.32, 0.22, 0.14, 0.34, 0.12, GOLD);
  // brilho do raio carregando nos olhos e na boca
  if (z.state === 'beam') G.part(hd, 0, -0.08, 0.32, 0, 0, 0, 0, 0, 0.36, 0.14, 0.06, 0x3fe0ff);
}
BODIES.sphinx = drawSphinx;
OTHER_COLORS.sphinx = [0xd8b070, GOLD];

// ------------------------------------------------------------------ Roma Antiga (só no Coliseu da Arena)
const RM_RED = 0xc01e1e;
const RM_RED_D = 0x861212;
const RM_STEEL = 0xb4b8c0;
const RM_STEEL_D = 0x767a84;
const RM_LEATHER = 0x6a4426;
const RM_SKIN = 0x9aa486; // pele zumbi acinzentada (diferente do verde do zumbi comum e da bandagem do Egito)
const RM_SKIN_D = 0x7a8468;
const RM_WOOD = 0x7a4a24;
const rmEyes = (brow = RM_SKIN_D) => face(0xff2a1a, { brow, mouth: 0x3a0606, open: 0.15, fangs: true });
// elmo romano (galea): calota, aba dourada, protetores de bochecha e de nuca
const galea = (c = RM_STEEL, trim = GOLD) => [
  ['head', 0, 0.56, -0.02, 0.62, 0.14, 0.62, c],
  ['head', 0, 0.5, 0.3, 0.62, 0.06, 0.04, trim],
  ['head', 0, 0.36, -0.31, 0.64, 0.26, 0.06, c],
  ['head', 0, 0.24, -0.35, 0.7, 0.05, 0.12, trim],
  ...mirror(['head', 0.3, 0.3, 0.1, 0.05, 0.36, 0.26, c], ['head', 0.32, 0.36, 0.1, 0.012, 0.05, 0.2, trim]),
];
// crista: longitudinal (soldado) ou transversal (centurião)
const crestLong = (c = RM_RED) => [
  ['head', 0, 0.66, -0.02, 0.08, 0.08, 0.5, GOLD],
  ['head', 0, 0.8, -0.04, 0.14, 0.22, 0.66, c],
  ['head', 0, 0.74, -0.38, 0.14, 0.2, 0.12, c],
  ['head', 0, 0.92, 0.02, 0.1, 0.06, 0.5, RM_RED_D],
];
const crestCross = (c = RM_RED) => [
  ['head', 0, 0.66, 0, 0.5, 0.08, 0.08, GOLD],
  ['head', 0, 0.82, 0, 0.92, 0.26, 0.16, c],
  ...mirror(['head', 0.42, 0.72, 0, 0.12, 0.2, 0.16, c]),
  ['head', 0, 0.97, 0, 0.7, 0.06, 0.12, RM_RED_D],
];
// saia de tiras de couro (pteruges) sobre a túnica vermelha
const pteruges = (strip = RM_LEATHER, tunic = RM_RED) => [
  ['torso', 0, 0.02, 0, 0.6, 0.12, 0.38, tunic],
  ...[-0.21, -0.07, 0.07, 0.21].map((x) => ['torso', x, -0.1, 0.17, 0.1, 0.2, 0.02, strip]),
  ...[-0.14, 0, 0.14].map((x) => ['torso', x, -0.1, -0.17, 0.1, 0.2, 0.02, strip]),
];
Object.assign(HUMANS, {
  // Legionário Zumbi: lorica segmentada de aço, elmo com crista vermelha, escudo retangular vermelho e gladius
  rm_legion: {
    skin: RM_SKIN, shirt: RM_STEEL, sleeve: RM_RED, hands: RM_SKIN_D, pants: RM_SKIN, boots: RM_LEATHER, noFace: true, arms: 'shield',
    extras: [
      ...rmEyes(),
      ...galea(),
      ...crestLong(),
      // lorica segmentata: faixas horizontais e alças de couro
      ...[0.14, 0.24, 0.34].map((y) => ['torso', 0, y, 0.166, 0.56, 0.025, 0.012, RM_STEEL_D]),
      ...mirror(['torso', 0.13, 0.42, 0.168, 0.07, 0.2, 0.012, RM_LEATHER], ['armL', 0.03, -0.03, 0, 0.26, 0.15, 0.26, RM_STEEL], ['armL', 0.03, 0.03, 0, 0.27, 0.03, 0.27, RM_STEEL_D]),
      ...pteruges(),
      ['torso', 0, 0.08, 0.186, 0.12, 0.08, 0.012, GOLD],
      ['torso', -0.12, 0.28, 0.168, 0.12, 0.1, 0.012, BLOOD],
      // sandálias com tiras subindo a canela
      ...mirror(['legL', 0, -0.26, 0.121, 0.22, 0.03, 0.012, RM_LEATHER], ['legL', 0, -0.18, 0.121, 0.22, 0.03, 0.012, RM_LEATHER]),
      // escudo retangular (scutum) vermelho com borda, umbo e emblema dourados
      ['armL', -0.1, -0.5, 0, 0.6, 0.06, 0.82, RM_RED],
      ['armL', -0.1, -0.535, 0.39, 0.6, 0.02, 0.05, GOLD],
      ['armL', -0.1, -0.535, -0.39, 0.6, 0.02, 0.05, GOLD],
      ...[0.18, -0.38].map((x) => ['armL', x, -0.535, 0, 0.04, 0.02, 0.82, GOLD]),
      ['armL', -0.1, -0.545, 0, 0.16, 0.03, 0.16, GOLD_L],
      ['armL', -0.1, -0.54, 0, 0.04, 0.02, 0.6, GOLD],
      ['armL', -0.1, -0.54, 0.16, 0.36, 0.02, 0.04, GOLD],
      // gladius: lâmina curta e larga, guarda e pomo dourados
      ['armR', 0, -0.46, 0.04, 0.07, 0.1, 0.1, RM_LEATHER],
      ['armR', 0, -0.46, 0.12, 0.16, 0.05, 0.04, GOLD],
      ['armR', 0, -0.46, 0.38, 0.1, 0.03, 0.48, 0xdfe3ea],
      ['armR', 0, -0.46, 0.64, 0.06, 0.03, 0.06, 0xdfe3ea],
      ['armR', 0, -0.46, -0.04, 0.07, 0.07, 0.06, GOLD],
    ],
  },
  // Centurião Infectado: couraça dourada musculada, crista transversal, capa vermelha, espada longa
  rm_centurion: {
    skin: RM_SKIN, shirt: GOLD, sleeve: RM_RED, hands: RM_SKIN_D, pants: RM_SKIN, boots: GOLD, noFace: true, arms: 'brawl',
    extras: [
      ...rmEyes(),
      ...galea(RM_STEEL, GOLD_L),
      ...crestCross(),
      // couraça musculada: peitorais e abdômen em relevo, medalhão vermelho
      ...mirror(['torso', 0.12, 0.38, 0.172, 0.2, 0.14, 0.02, GOLD_L]),
      ...[0.2, 0.1].map((y) => ['torso', 0, y, 0.172, 0.3, 0.06, 0.02, GOLD_L]),
      ['torso', 0, 0.3, 0.184, 0.1, 0.1, 0.012, RM_RED],
      ['torso', 0, 0.5, 0.12, 0.62, 0.08, 0.14, GOLD_L],
      // ombreiras douradas grandes em camadas
      ...mirror(['armL', 0.05, -0.0, 0, 0.34, 0.18, 0.34, GOLD], ['armL', 0.05, -0.1, 0, 0.3, 0.06, 0.3, RM_RED], ['armL', 0, -0.4, 0, 0.21, 0.1, 0.23, GOLD]),
      ...pteruges(RM_RED_D, RM_RED),
      ...[-0.21, -0.07, 0.07, 0.21].map((x) => ['torso', x, -0.2, 0.17, 0.1, 0.03, 0.025, GOLD]),
      // capa vermelha caindo nas costas
      ['torso', 0, 0.12, -0.2, 0.62, 0.84, 0.04, RM_RED],
      ['torso', 0, 0.5, -0.19, 0.66, 0.08, 0.06, RM_RED_D],
      // grevas douradas
      ...mirror(['legL', 0, -0.24, 0.07, 0.23, 0.26, 0.12, GOLD]),
      // espada longa (spatha) com guarda dourada
      ['armR', 0, -0.46, 0.04, 0.08, 0.1, 0.1, RM_LEATHER],
      ['armR', 0, -0.46, 0.13, 0.22, 0.06, 0.05, GOLD_L],
      ['armR', 0, -0.46, 0.5, 0.11, 0.035, 0.7, 0xdfe3ea],
      ['armR', 0, -0.46, 0.5, 0.03, 0.04, 0.66, RM_STEEL_D],
      ['armR', 0, -0.46, -0.05, 0.08, 0.08, 0.07, GOLD_L],
      // bastão de vinha (vitis) preso ao cinto, símbolo de comando
      ['torso', 0.3, 0.02, 0.1, 0.04, 0.5, 0.04, RM_WOOD, 0.3],
    ],
  },
  // Arqueiro Romano: elmo com pequena crista, túnica vermelha e couro, arco de madeira com flecha flamejante, aljava
  rm_archer: {
    skin: RM_SKIN, shirt: RM_RED, sleeve: RM_SKIN, hands: RM_SKIN_D, pants: RM_SKIN, boots: RM_LEATHER, noFace: true, arms: 'reach',
    extras: [
      ...rmEyes(),
      ...galea(RM_STEEL, GOLD),
      ['head', 0, 0.7, -0.04, 0.1, 0.12, 0.44, RM_RED],
      // colete de couro com cinto transversal da aljava
      ['torso', 0, 0.3, 0.166, 0.36, 0.3, 0.012, RM_LEATHER],
      ['torso', 0, 0.27, 0.18, 0.08, 0.66, 0.012, 0x4a2a14, 0, -0.6],
      ...pteruges(RM_LEATHER, RM_RED_D),
      ...mirror(['armL', 0, -0.35, 0, 0.2, 0.1, 0.22, RM_LEATHER]),
      // aljava nas costas com penas vermelhas
      ['torso', 0.1, 0.32, -0.24, 0.16, 0.56, 0.14, RM_LEATHER, 0, 0.35],
      ['torso', 0.22, 0.64, -0.24, 0.12, 0.1, 0.1, RM_RED, 0, 0.35],
      ['torso', 0.16, 0.66, -0.26, 0.04, 0.14, 0.04, 0xeeeeee, 0, 0.35],
      // arco recurvo de madeira em pé, pontas douradas, corda puxada e flecha em brasa apontando à frente
      ['armL', 0, -0.5, 0, 0.07, 0.07, 1.1, RM_WOOD],
      ...[0.52, -0.52].map((zz) => ['armL', 0, -0.47, zz, 0.1, 0.1, 0.08, GOLD]),
      ['armL', 0, -0.3, 0, 0.012, 0.012, 1.0, 0xeeeeee],
      ['armL', 0, -0.62, 0, 0.03, 0.66, 0.03, 0x8a5a30],
      ['armL', 0, -0.98, 0, 0.06, 0.1, 0.06, 0xdfe3ea],
      ['armL', 0, -1.02, 0, 0.08, 0.08, 0.08, 0xff8a1a, 0, 0, GLOW],
    ],
  },
  // Gladiador Corrompido: elmo fechado dourado com grade, tronco nu, braço direito blindado (manica), maça com espinhos; curvado para a frente
  rm_gladiator: {
    skin: RM_SKIN, shirt: RM_SKIN, sleeve: RM_SKIN, hands: RM_LEATHER, pants: RM_LEATHER, boots: RM_LEATHER, noFace: true, arms: 'brawl', lean: 0.32,
    extras: [
      // elmo fechado: viseira dourada com grade e olhos vermelhos brilhando atrás
      ['head', 0, 0.27, 0.285, 0.58, 0.56, 0.03, GOLD],
      ['head', 0, 0.3, 0.3, 0.4, 0.26, 0.012, 0x1a1210],
      ...[-0.12, 0, 0.12].map((x) => ['head', x, 0.3, 0.31, 0.03, 0.28, 0.02, GOLD_L]),
      ...[0.36, 0.24].map((y) => ['head', 0, y, 0.31, 0.42, 0.025, 0.02, GOLD_L]),
      ...mirror(['head', 0.1, 0.31, 0.302, 0.09, 0.05, 0.012, 0xff2a1a, 0, 0.25, GLOW]),
      ['head', 0, 0.56, -0.02, 0.62, 0.14, 0.62, GOLD],
      ['head', 0, 0.48, -0.02, 0.84, 0.05, 0.84, GOLD_L],
      ['head', 0, 0.74, -0.04, 0.1, 0.22, 0.5, GOLD],
      ['head', 0, 0.76, -0.04, 0.14, 0.12, 0.4, RM_RED],
      // tronco nu musculoso com cicatrizes e cinto largo
      ...mirror(['torso', 0.12, 0.38, 0.166, 0.2, 0.12, 0.012, RM_SKIN_D]),
      ...[0.22, 0.12].map((y) => ['torso', 0, y, 0.166, 0.24, 0.04, 0.012, RM_SKIN_D]),
      ['torso', -0.1, 0.3, 0.17, 0.14, 0.1, 0.012, BLOOD],
      ['torso', 0, 0.04, 0, 0.62, 0.14, 0.38, RM_LEATHER],
      ['torso', 0, 0.04, 0.195, 0.18, 0.12, 0.012, GOLD],
      ['torso', 0, -0.1, 0.18, 0.3, 0.22, 0.02, RM_RED],
      // ombreira (galerus) no braço esquerdo
      ['armL', 0.06, 0.02, 0, 0.34, 0.24, 0.34, RM_STEEL],
      ['armL', 0.06, 0.12, 0, 0.36, 0.04, 0.36, GOLD],
      // braço direito blindado em segmentos
      ...[-0.04, -0.14, -0.24, -0.34].map((y) => ['armR', 0, y, 0, 0.22, 0.08, 0.24, RM_STEEL]),
      ...[-0.09, -0.19, -0.29].map((y) => ['armR', 0, y, 0, 0.23, 0.02, 0.25, RM_STEEL_D]),
      // caneleiras douradas
      ...mirror(['legL', 0, -0.26, 0.07, 0.23, 0.24, 0.12, GOLD]),
      // maça: cabo de madeira e bola de ferro com espinhos
      ['armR', 0, -0.48, 0.2, 0.06, 0.06, 0.46, RM_WOOD],
      ['armR', 0, -0.48, 0.52, 0.26, 0.26, 0.26, 0x3a3a40],
      ...[[0.17, 0, 0], [-0.17, 0, 0], [0, 0.17, 0], [0, -0.17, 0], [0, 0, 0.17]].map(([x, y, zz]) => ['armR', x, -0.48 + y, 0.52 + zz, x ? 0.1 : 0.06, y ? 0.1 : 0.06, zz ? 0.1 : 0.06, RM_STEEL]),
    ],
  },
  // Pretor Sombrio: toga e armadura roxas com dourado, capuz, olhos roxos e cajado com orbe de corrupção
  rm_engineer: {
    skin: RM_SKIN, shirt: RM_LEATHER, sleeve: RM_RED, hands: RM_SKIN_D, pants: 0x4a3420, boots: RM_LEATHER, noFace: true, arms: 'brawl',
    extras: [
      ...rmEyes(),
      // elmo simples de aço com borda de couro
      ['head', 0, 0.52, -0.02, 0.62, 0.16, 0.62, RM_STEEL],
      ['head', 0, 0.62, -0.02, 0.52, 0.1, 0.52, RM_STEEL_D],
      ['head', 0, 0.44, 0.3, 0.58, 0.05, 0.05, GOLD],
      // capa vermelha nas costas e avental de ferramentas
      ['torso', 0, 0.16, -0.2, 0.58, 0.72, 0.04, RM_RED],
      ['torso', 0, 0.24, 0.17, 0.46, 0.38, 0.02, 0x5a3a1e],
      ['torso', 0, 0.06, 0.18, 0.56, 0.1, 0.03, RM_LEATHER],
      ['torso', 0, 0.06, 0.195, 0.12, 0.09, 0.02, GOLD],
      // martelo de ferro pesado na mão direita
      ['armR', 0, -0.46, 0.22, 0.07, 0.07, 0.58, RM_WOOD],
      ['armR', 0, -0.46, 0.52, 0.26, 0.16, 0.16, RM_STEEL],
      ['armR', 0, -0.46, 0.52, 0.28, 0.05, 0.18, RM_STEEL_D],
      // barril de madeira com aros de ferro na mão esquerda
      ['armL', -0.06, -0.48, 0.14, 0.34, 0.42, 0.34, RM_WOOD],
      ['armL', -0.06, -0.36, 0.14, 0.36, 0.05, 0.36, RM_STEEL_D],
      ['armL', -0.06, -0.58, 0.14, 0.36, 0.05, 0.36, RM_STEEL_D],
    ],
  },
  rm_praetor: {
    skin: 0x7a5a9a, shirt: 0x5a2a8a, sleeve: 0x4a2272, hands: 0x6a4a8a, pants: 0x3a1a5e, boots: 0x2a1640, noFace: true, arms: 'staff',
    extras: [
      // olhos roxos brilhantes, sobrancelha e faixa cobrindo a boca
      // rosto: placa clara, órbitas escuras com olhos roxos, sobrancelha e máscara com borda dourada
      ['head', 0, 0.22, 0.278, 0.46, 0.44, 0.02, 0x8a6aa8],
      ...mirror(['head', 0.12, 0.31, 0.288, 0.15, 0.1, 0.02, 0x2a1640], ['head', 0.12, 0.31, 0.296, 0.1, 0.06, 0.02, 0xd080ff, 0, 0.26, GLOW]),
      ...mirror(['head', 0.12, 0.39, 0.292, 0.17, 0.045, 0.02, 0x3a1a5e, 0, 0.3]),
      ['head', 0, 0.08, 0.288, 0.42, 0.16, 0.02, 0x3a1a5e],
      ['head', 0, 0.16, 0.29, 0.44, 0.025, 0.02, GOLD],
      // capuz roxo com borda dourada e abas laterais
      ['head', 0, 0.58, -0.04, 0.68, 0.14, 0.68, 0x4a2272],
      ['head', 0, 0.65, 0.22, 0.62, 0.05, 0.06, GOLD],
      ...mirror(['head', 0.33, 0.3, -0.04, 0.06, 0.54, 0.62, 0x4a2272], ['head', 0.365, 0.42, 0.2, 0.012, 0.42, 0.06, GOLD]),
      ['head', 0, 0.3, -0.34, 0.68, 0.6, 0.06, 0x3a1a5e],
      ['head', 0, 0.72, -0.24, 0.26, 0.2, 0.18, 0x5a2a8a],
      // peitoral dourado, gema roxa no centro e ombreiras roxas
      ['torso', 0, 0.34, 0.172, 0.5, 0.3, 0.02, GOLD],
      ['torso', 0, 0.34, 0.186, 0.16, 0.16, 0.02, 0x7a2ab0],
      ['torso', 0, 0.34, 0.198, 0.1, 0.1, 0.012, 0xe0a0ff, 0, 0, GLOW],
      ['torso', 0, 0.48, 0.15, 0.56, 0.08, 0.07, GOLD_L],
      ['torso', 0, 0.06, 0.186, 0.28, 0.06, 0.02, GOLD],
      // toga roxa atravessada no peito e cinto
      ['torso', 0.02, 0.2, 0.178, 0.2, 0.5, 0.02, 0x6a3aa0, 0, -0.5],
      ['torso', 0, -0.02, 0, 0.62, 0.1, 0.38, 0x3a1a5e],
      ['torso', 0, -0.02, 0.195, 0.14, 0.1, 0.02, GOLD],
      ...mirror(['armL', 0.05, 0.02, 0, 0.36, 0.2, 0.36, 0x4a2272], ['armL', 0.05, 0.12, 0, 0.38, 0.05, 0.38, GOLD]),
      ...pteruges(0x4a2272, 0x3a1a5e),
      ...mirror(['legL', 0, -0.16, 0.128, 0.24, 0.34, 0.02, 0x3a1a5e]),
      // cajado: haste dourada, garras segurando o orbe roxo
      ['armR', -0.06, -0.46, 0.2, 0.06, 0.06, 1.75, 0x6a4a2a],
      ['armR', -0.06, -0.46, 0.5, 0.075, 0.075, 0.08, GOLD],
      ['armR', -0.06, -0.46, 1.02, 0.2, 0.05, 0.05, GOLD],
      ...[[0.1, 0], [-0.1, 0], [0, 0.1], [0, -0.1]].map(([x, y]) => ['armR', -0.06 + x, -0.46 + y, 1.14, 0.05, 0.05, 0.26, GOLD]),
      ['armR', -0.06, -0.46, 1.3, 0.26, 0.26, 0.26, 0xb050ff, 0, 0, GLOW],
      ['armR', -0.06, -0.46, 1.3, 0.14, 0.14, 0.14, 0xf0d0ff, 0, 0, GLOW],
      ['armR', -0.06, -0.46, 1.3, 0.32, 0.32, 0.06, 0xd080ff, 0.785, 0.785, GLOW],
      // motas roxas de corrupção girando junto ao corpo
      ...[[0.34, 0.42, 0.2, 0xc070ff, 0], [-0.3, 0.16, 0.26, 0x9a4ae0, 0.5], [0.26, -0.1, -0.24, 0x9a4ae0, 1]].map(([x, y, zz, c, r]) => ['torso', x, y, zz, 0.09, 0.09, 0.09, c, r, r * 0.8, GLOW]),
    ],
  },
});

// Cão de Caça Infectado: cão magro de pelo cinza, crina vermelha eriçada, coleira de cravos dourados, olhos vermelhos
function drawHound(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const fur = 0x8a8478;
  const furD = 0x625c52;
  const gait = z.walk * 1.4;
  const bob = Math.abs(Math.sin(gait)) * 0.05;
  const lunge = z.state === 'lunge';
  // corpo fino e comprido, costelas aparentes e barriga recolhida
  P(base, 0, 0.66 + bob, -0.12, 0.32, 0.3, 0.92, fur);
  P(base, 0, 0.66 + bob, 0.26, 0.38, 0.4, 0.34, furD);
  for (const zz of [0.06, -0.06, -0.18]) for (const sg of [1, -1]) P(base, sg * 0.165, 0.64 + bob, zz, 0.012, 0.16, 0.04, 0x4a2a24);
  P(base, 0, 0.5 + bob, -0.2, 0.22, 0.04, 0.5, 0x8a1a1a);
  // crina vermelha eriçada ao longo do dorso
  for (const [zz, hh] of [[0.36, 0.26], [0.2, 0.24], [0.02, 0.2], [-0.16, 0.16], [-0.34, 0.12]]) P(base, 0, 0.84 + bob + hh * 0.35, zz, 0.1, hh, 0.12, RM_RED, -0.6);
  // coleira de couro com cravos dourados
  P(base, 0, 0.8 + bob, 0.42, 0.36, 0.1, 0.16, RM_LEATHER, -0.4);
  for (const sg of [1, -1, 0]) P(base, sg * 0.16, 0.82 + bob, 0.46 + (sg ? 0 : 0.06), 0.05, 0.05, 0.05, GOLD_L);
  // cauda fina
  const tail = joint(base, 0, 0.72 + bob, -0.56, -0.7 + Math.sin(t * 9) * 0.2, 0, Math.sin(t * 7) * 0.3);
  P(tail, 0, 0.22, 0, 0.06, 0.44, 0.06, furD);
  // cabeça alongada, focinho fino e boca aberta
  const head = joint(base, 0, 0.86 + bob, 0.48, -0.12 + (lunge ? -0.3 : 0), 0, Math.sin(gait * 0.5) * 0.05);
  P(head, 0, 0.06, 0.1, 0.34, 0.3, 0.32, fur);
  P(head, 0, 0.0, 0.38, 0.2, 0.14, 0.32, furD);
  P(head, 0, 0.05, 0.55, 0.09, 0.06, 0.03, 0x1a1010);
  const jaw = 0.32 + (z.attackT > 0 || lunge ? 0.4 : 0);
  P(head, 0, -0.12, 0.34, 0.18, 0.05, 0.28, 0x4a3a30, jaw);
  P(head, 0, -0.09, 0.36, 0.15, 0.04, 0.24, 0x8a1010, jaw * 0.5);
  for (const sg of [1, -1]) {
    G.part(head, sg * 0.1, 0.12, 0.265, 0, sg * 0.3, 0, 0, 0, 0.1, 0.05, 0.02, 0xff2a1a);
    P(head, sg * 0.12, 0.3, -0.02, 0.08, 0.22, 0.07, furD, -0.45, -sg * 0.25);
    P(head, sg * 0.07, -0.08, 0.52, 0.03, 0.08, 0.03, TEETH);
    P(head, sg * 0.07, -0.15, 0.44, 0.03, 0.06, 0.03, TEETH, jaw);
  }
  // patas longas e finas
  const legs = [[0.12, 0.3, 0], [-0.12, 0.3, Math.PI], [0.12, -0.44, Math.PI], [-0.12, -0.44, 0]];
  for (const [x, zz, ph] of legs) {
    const a = lunge ? (zz > 0 ? -1.1 : 0.9) : Math.sin(gait + ph) * 0.7;
    const leg = joint(base, x, 0.56 + bob, zz, a, 0, 0);
    P(leg, 0, -0.25, 0, 0.1, 0.54, 0.11, furD);
    P(leg, 0, -0.52, 0.04, 0.12, 0.06, 0.18, 0x2a2420);
  }
}
BODIES.rm_hound = drawHound;
OTHER_COLORS.rm_hound = [0x8a8478, RM_RED];

// Besta de Arena: leão de arena grande e baixo, juba vermelha com pontas douradas, olhos vermelhos e presas
function drawBeast(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const fur = 0xc08a3a;
  const furD = 0x966424;
  const mane = 0xa82020;
  const maneD = 0x741414;
  const gait = z.walk * 1.5;
  const bob = Math.abs(Math.sin(gait)) * 0.05;
  const lunge = z.state === 'lunge';
  // tronco largo e comprido, mais baixo que o cão de caça
  P(base, 0, 0.72 + bob, -0.2, 0.54, 0.52, 1.0, fur);
  P(base, 0, 0.74 + bob, 0.28, 0.62, 0.56, 0.42, fur);
  P(base, 0, 0.56 + bob, 0.1, 0.44, 0.16, 0.72, furD);
  // arreios de arena: tira de couro no dorso e placa dourada no peito
  P(base, 0, 0.98 + bob, -0.14, 0.56, 0.06, 0.42, 0x6a4426);
  P(base, 0, 0.86 + bob, 0.5, 0.2, 0.16, 0.08, GOLD);
  P(base, 0, 0.86 + bob, 0.54, 0.1, 0.08, 0.04, GOLD_L);
  // costelas marcadas
  for (const zz of [-0.06, -0.2]) for (const sg of [1, -1]) P(base, sg * 0.275, 0.74 + bob, zz, 0.012, 0.2, 0.06, 0x8a5a1e);
  // cauda com tufo vermelho
  const tail = joint(base, 0, 0.82 + bob, -0.7, -0.5 + Math.sin(t * 4) * 0.14, 0, Math.sin(t * 5) * 0.22);
  P(tail, 0, -0.24, 0, 0.09, 0.5, 0.09, furD);
  P(tail, 0, -0.52, 0, 0.17, 0.18, 0.17, mane);
  P(tail, 0, -0.64, 0, 0.1, 0.1, 0.1, maneD);
  // quatro patas grossas com garras douradas
  for (const [x, zz, ph] of [[0.21, 0.34, 0], [-0.21, 0.34, Math.PI], [0.22, -0.42, Math.PI], [-0.22, -0.42, 0]]) {
    const a = lunge ? (zz > 0 ? -1.0 : 0.85) : Math.sin(gait + ph) * 0.6;
    const leg = joint(base, x, 0.6 + bob, zz, a, 0, 0);
    P(leg, 0, -0.27, 0.02, 0.18, 0.52, 0.2, furD);
    P(leg, 0, -0.52, 0.06, 0.23, 0.1, 0.3, 0x9a6420);
    P(leg, 0, -0.55, 0.2, 0.22, 0.06, 0.09, 0x2a2018);
    for (const gx of [-0.07, 0.07]) P(leg, gx, -0.53, 0.25, 0.05, 0.04, 0.08, GOLD_L);
  }
  // cabeça alta e à frente do peito, com juba espinhosa em volta
  const hd = joint(base, 0, 0.98 + bob, 0.58, -0.08 + (lunge ? -0.3 : 0), 0, Math.sin(gait * 0.5) * 0.05);
  P(hd, 0, 0.02, -0.04, 0.68, 0.66, 0.2, maneD);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    P(hd, Math.sin(a) * 0.36, Math.cos(a) * 0.36, -0.04, 0.16, 0.24, 0.24, k % 2 ? mane : 0x8a1a1a, 0, a);
    if (k % 2 === 0) P(hd, Math.sin(a) * 0.46, Math.cos(a) * 0.46, -0.04, 0.07, 0.09, 0.09, GOLD_L, 0, a);
  }
  // crânio, focinho comprido e claro, nariz e orelhas
  P(hd, 0, 0.04, 0.14, 0.44, 0.4, 0.4, fur);
  P(hd, 0, 0.24, 0.12, 0.44, 0.08, 0.38, furD);
  P(hd, 0, -0.02, 0.42, 0.3, 0.22, 0.26, 0xd8a850);
  P(hd, 0, 0.08, 0.57, 0.14, 0.09, 0.04, 0x2a1810);
  P(hd, 0, -0.11, 0.556, 0.24, 0.04, 0.02, 0x4a1010);
  for (const sg of [1, -1]) {
    P(hd, sg * 0.17, 0.28, 0.06, 0.12, 0.14, 0.1, furD, 0, -sg * 0.3);
    // olhos vermelhos e sobrancelha
    L(hd, sg * 0.1, 0.14, 0.346, 0.11, 0.06, 0.02, 0xff2a1a);
    P(hd, sg * 0.1, 0.21, 0.342, 0.16, 0.05, 0.02, maneD);
    // presas superiores
    P(hd, sg * 0.09, -0.1, 0.53, 0.045, 0.11, 0.045, TEETH);
  }
  // goela aberta e mandíbula
  P(hd, 0, -0.18, 0.44, 0.26, 0.1, 0.26, 0x6a1a1a);
  const jaw = 0.3 + (z.attackT > 0 || lunge ? 0.4 : 0);
  P(hd, 0, -0.24, 0.42, 0.24, 0.07, 0.3, furD, jaw);
  P(hd, 0, -0.2, 0.46, 0.2, 0.05, 0.24, 0x9a1620, jaw * 0.5);
  for (const sg of [1, -1]) P(hd, sg * 0.08, -0.25, 0.52, 0.04, 0.08, 0.04, TEETH, jaw);
}
BODIES.rm_beast = drawBeast;
OTHER_COLORS.rm_beast = [0xc08a3a, 0xa82020];

// Espírito do Imperador: imperador espectral azul/ciano, coroa de louros, corpo luminoso sem pernas
function drawSpirit(B, G, base, z, col, t) {
  base = joint(base, 0, -0.45, 0); // sobe o conjunto para flutuar acima do chão
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const bob = Math.sin(t * 2.2 + z.walk * 0.3) * 0.06;
  const sway = Math.sin(t * 1.5) * 0.05;
  // manto espectral afinando para baixo, em vez de pernas
  const low = joint(base, 0, -0.04 + bob, 0, 0, 0, sway);
  L(low, 0, -0.18, 0, 0.6, 0.4, 0.44, 0x3ab0d0);
  L(low, 0, -0.44, 0.02, 0.46, 0.22, 0.36, 0x2a90b0);
  L(low, 0, -0.6, 0.04, 0.32, 0.14, 0.28, 0x1a7494);
  // barra rasgada: rastro espectral atrás, sem parecer pernas
  const trail = joint(low, 0, -0.5, -0.2, 0, 0, Math.sin(t * 1.6) * 0.18);
  L(trail, 0, -0.24, 0, 0.14, 0.48, 0.1, 0x1f86a8);
  L(trail, 0, -0.48, 0.04, 0.08, 0.18, 0.06, 0x146a8c);
  // tronco com couraça imperial e brilho interno
  L(base, 0, 0.2 + bob, 0, 0.62, 0.52, 0.42, 0x4ac8e8);
  L(base, 0, 0.14 + bob, 0.21, 0.34, 0.3, 0.02, 0x9af0ff);
  P(base, 0, 0.34 + bob, 0.21, 0.5, 0.32, 0.03, 0xc8a850);
  P(base, 0, 0.34 + bob, 0.23, 0.3, 0.12, 0.02, GOLD_L);
  P(base, 0, 0.03 + bob, 0.215, 0.24, 0.12, 0.02, GOLD);
  // faixa da toga e contorno luminoso nas laterais
  L(base, 0.02, 0.18 + bob, 0.212, 0.14, 0.44, 0.02, 0x2a90b0, 0, -0.45);
  for (const sg of [1, -1]) L(base, sg * 0.315, 0.2 + bob, 0, 0.025, 0.48, 0.4, 0x9af0ff);
  // medalhão de louros no peito, luminoso
  L(base, 0, 0.34 + bob, 0.235, 0.08, 0.08, 0.02, 0xe8fff8);
  // braços flutuantes com punhos brilhantes
  for (const sg of [1, -1]) {
    const a = joint(base, sg * 0.35, 0.42 + bob, 0, -0.5 + Math.sin(t * 2.6 + sg) * 0.08, 0, sg * 0.22);
    L(a, 0, -0.24, 0, 0.16, 0.48, 0.16, 0x46c0e0);
    P(a, 0, -0.08, 0, 0.18, 0.08, 0.18, GOLD);
    L(a, 0, -0.5, 0.02, 0.14, 0.14, 0.16, 0xa8f8ff);
  }
  // cabeça serena, olhos claros e coroa de louros
  const hd = joint(base, 0, 0.86 + bob, 0, 0, 0, sway);
  L(hd, 0, -0.1, 0, 0.22, 0.2, 0.24, 0x2a90b0);
  L(hd, 0, 0.06, 0, 0.44, 0.44, 0.44, 0x5ad4ee);
  L(hd, 0, 0.06, 0.225, 0.34, 0.32, 0.02, 0x9af4ff);
  for (const sg of [1, -1]) {
    P(hd, sg * 0.1, 0.11, 0.24, 0.16, 0.09, 0.02, 0x1a7494);
    L(hd, sg * 0.1, 0.11, 0.252, 0.1, 0.055, 0.02, 0xf0ffff);
    P(hd, sg * 0.1, 0.17, 0.246, 0.16, 0.035, 0.02, 0x2a90b0);
  }
  P(hd, 0, -0.05, 0.248, 0.16, 0.03, 0.02, 0x2a90b0);
  P(hd, 0, -0.21, 0.18, 0.36, 0.05, 0.32, 0x1a7494);
  // diadema e coroa de louros: aro fino com folhas nas laterais
  P(hd, 0, 0.24, 0.23, 0.4, 0.04, 0.02, GOLD);
  P(hd, 0, 0.31, -0.02, 0.48, 0.06, 0.46, GOLD);
  for (const sg of [1, -1]) {
    for (let k = 0; k < 4; k++) P(hd, sg * 0.23, 0.34, 0.15 - k * 0.11, 0.08, 0.12, 0.05, k % 2 ? GOLD : GOLD_L, 0, sg * 0.7);
    P(hd, sg * 0.24, 0.27, 0, 0.06, 0.1, 0.42, GOLD, 0, sg * 0.1);
  }
  // contorno luminoso: ombros, barra do manto e halo atrás da cabeça
  for (const sg of [1, -1]) L(base, sg * 0.34, 0.52 + bob, 0.02, 0.24, 0.06, 0.34, 0xb8f8ff);
  L(low, 0, -0.62, 0.04, 0.22, 0.05, 0.2, 0x9af0ff);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + t * 0.4;
    L(hd, Math.sin(a) * 0.4, 0.02 + Math.cos(a) * 0.36, -0.12, 0.05, 0.05, 0.05, 0x9af0ff);
  }
  // faíscas de blink ao redor
  for (let k = 0; k < 4; k++) {
    const a = t * 1.3 + k * 1.57;
    L(base, Math.sin(a) * 0.5, 0.3 + Math.cos(a * 1.3) * 0.3 + bob, Math.cos(a) * 0.4, 0.06, 0.06, 0.06, 0x70e8ff);
  }
}
BODIES.rm_spirit = drawSpirit;
OTHER_COLORS.rm_spirit = [0x4ac8e8, GOLD];

// Estandarte Legionário: mastro com águia dourada, pano vermelho com SPQR, base de pedra e corrupção roxa
function drawStandard(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  // base de pedra com entulho
  P(base, 0, 0.08, 0, 0.95, 0.16, 0.8, 0x8a8478);
  P(base, 0, 0.2, 0, 0.7, 0.12, 0.6, 0x9a9488);
  P(base, 0.36, 0.19, 0.26, 0.18, 0.14, 0.16, 0x7a7468);
  P(base, -0.36, 0.17, -0.22, 0.16, 0.1, 0.14, 0x7a7468);
  // mastro de madeira com aros dourados
  P(base, 0, 1.35, 0, 0.08, 2.4, 0.08, RM_WOOD);
  for (const y of [0.42, 1.0, 1.62, 2.24]) P(base, 0, y, 0, 0.11, 0.06, 0.11, GOLD);
  // travessa do estandarte
  P(base, 0, 2.36, 0, 1.0, 0.07, 0.07, GOLD);
  for (const sg of [1, -1]) P(base, sg * 0.51, 2.36, 0, 0.1, 0.14, 0.1, GOLD_L);
  // pano vermelho com moldura dourada
  P(base, 0, 1.8, 0.05, 0.74, 0.96, 0.03, RM_RED);
  P(base, 0, 2.3, 0.05, 0.82, 0.08, 0.05, GOLD);
  P(base, 0, 1.3, 0.05, 0.82, 0.09, 0.05, GOLD);
  for (const sg of [1, -1]) P(base, sg * 0.38, 1.8, 0.05, 0.04, 0.94, 0.05, GOLD);
  // águia dourada no pano
  for (const sg of [1, -1]) P(base, sg * 0.16, 1.98, 0.075, 0.22, 0.07, 0.02, GOLD_L, 0, -sg * 0.55);
  P(base, 0, 1.98, 0.075, 0.09, 0.22, 0.02, GOLD_L);
  P(base, 0, 2.1, 0.075, 0.1, 0.08, 0.02, GOLD);
  // quatro cravos dourados: leitura de SPQR a distância
  for (const x of [-0.21, -0.07, 0.07, 0.21]) P(base, x, 1.52, 0.075, 0.075, 0.075, 0.02, GOLD);
  // águia imperial no topo, asas abertas e bico
  P(base, 0, 2.62, 0, 0.16, 0.22, 0.14, GOLD_L);
  for (const sg of [1, -1]) {
    P(base, sg * 0.22, 2.68, 0, 0.3, 0.1, 0.05, GOLD, 0, -sg * 0.45);
    P(base, sg * 0.34, 2.72, 0, 0.14, 0.07, 0.05, GOLD_L, 0, -sg * 0.45);
  }
  P(base, 0, 2.76, 0.09, 0.08, 0.08, 0.06, GOLD_L);
  P(base, 0, 2.74, 0.14, 0.05, 0.04, 0.05, 0xd4a020);
  // corrupção roxa: cristal na base e cubos flutuando devagar
  L(base, 0, 0.3, 0.3, 0.14, 0.16, 0.14, 0xa050e0);
  L(base, -0.32, 0.26, -0.24, 0.1, 0.12, 0.1, 0x8a3ac0);
  for (let k = 0; k < 5; k++) {
    const a = t * 0.9 + k * 1.26;
    L(base, Math.sin(a) * 0.62, 1.05 + Math.sin(t * 2 + k) * 0.32 + k * 0.16, Math.cos(a) * 0.45, 0.08, 0.08, 0.08, pulse > 0.5 ? 0xc070ff : 0x8a3ac0);
  }
}
BODIES.rm_standard = drawStandard;
OTHER_COLORS.rm_standard = [0x8a8478, RM_RED];

// Catapulta de Cerco: estrutura pesada de madeira sobre 4 rodas com braço articulado e rocha em chamas
function drawCatapult(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const throwing = z.state === 'throw';
  const snap = z.attackT > 0 ? Math.min(1, z.attackT / 0.45) : 0;
  // base de vigas paralelas e travessas
  for (const sg of [1, -1]) {
    P(base, sg * 0.52, 0.38, 0, 0.16, 0.18, 1.55, RM_WOOD);
    // cavalete em A nas laterais
    P(base, sg * 0.52, 0.9, 0.16, 0.14, 1.05, 0.16, 0x5c3618, 0.22);
    P(base, sg * 0.52, 0.9, -0.26, 0.14, 1.05, 0.16, 0x5c3618, -0.22);
  }
  P(base, 0, 0.38, 0.62, 1.2, 0.16, 0.18, 0x5c3618);
  P(base, 0, 0.38, -0.62, 1.2, 0.16, 0.18, 0x5c3618);
  // travessa superior de impacto (com reforço de ferro e detalhes dourados)
  P(base, 0, 1.32, -0.05, 1.22, 0.18, 0.2, RM_WOOD);
  P(base, 0, 1.32, -0.05, 1.26, 0.08, 0.24, RM_STEEL_D);
  P(base, 0, 1.44, -0.05, 0.36, 0.08, 0.12, GOLD);
  // 4 rodas de madeira com aro metálico
  for (const sx of [-0.66, 0.66]) {
    for (const sz of [-0.54, 0.54]) {
      P(base, sx, 0.3, sz, 0.12, 0.56, 0.56, 0x4a2c14);
      P(base, sx, 0.3, sz, 0.14, 0.44, 0.44, RM_STEEL_D);
      P(base, sx, 0.3, sz, 0.16, 0.14, 0.14, GOLD);
    }
  }
  // braço lançador articulado: puxa para trás na preparação e dispara para frente
  const armAng = throwing ? -0.95 - Math.sin(t * 14) * 0.05 : snap > 0 ? 0.55 * snap : -0.35;
  const arm = joint(base, 0, 0.46, 0.22, armAng, 0, 0);
  P(arm, 0, 0.62, -0.2, 0.14, 1.35, 0.14, RM_WOOD);
  P(arm, 0, 1.26, -0.24, 0.42, 0.16, 0.42, 0x5c3618);
  P(arm, 0, 1.32, -0.24, 0.46, 0.06, 0.46, RM_STEEL_D);
  // rocha em chamas carregada na colher (some brevemente logo após disparar)
  if (snap < 0.25) {
    const glow = throwing ? 0xffa020 : 0xff5a1a;
    P(arm, 0, 1.5, -0.24, 0.42, 0.38, 0.42, 0x3e3632);
    L(arm, 0, 1.54, -0.24, 0.32, 0.44, 0.14, glow);
    L(arm, 0, 1.54, -0.24, 0.14, 0.44, 0.32, 0xffd040);
  }
}
BODIES.rm_catapult = drawCatapult;
OTHER_COLORS.rm_catapult = [RM_WOOD, 0xff6a1a];

// Elefante de Guerra: corpo massivo blindado, presas de marfim, tromba animada e manto vermelho/dourado
function drawElephant(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const sw = Math.sin(z.walk * 1.4);
  const atk = z.attackT > 0 ? Math.sin((z.attackT / 0.35) * Math.PI) : 0;
  const wind = z.state === 'wind' ? 1 : 0;
  const lunge = z.state === 'lunge' ? 1 : 0;
  const hide = 0x6e6a64;
  const hideD = 0x524e48;
  // 4 patas em pilar
  for (const [sx, sz, ph] of [[-0.44, 0.5, 0], [0.44, 0.5, Math.PI], [-0.44, -0.52, Math.PI], [0.44, -0.52, 0]]) {
    const leg = joint(base, sx, 0.62, sz, Math.sin(z.walk * 1.4 + ph) * 0.28, 0, 0);
    P(leg, 0, -0.32, 0, 0.36, 0.68, 0.36, hide);
    P(leg, 0, -0.62, 0.04, 0.38, 0.1, 0.38, hideD);
    P(leg, 0, -0.18, 0, 0.4, 0.1, 0.4, GOLD);
  }
  // tronco largo + manto de guerra vermelho com borda dourada
  const bob = Math.abs(sw) * 0.04;
  P(base, 0, 1.12 + bob, 0, 1.12, 0.88, 1.48, hide);
  P(base, 0, 1.24 + bob, -0.04, 1.18, 0.62, 1.0, RM_RED);
  P(base, 0, 0.92 + bob, -0.04, 1.2, 0.08, 1.04, GOLD);
  P(base, 0, 1.56 + bob, -0.04, 0.92, 0.1, 0.88, GOLD);
  for (const sg of [1, -1]) P(base, sg * 0.6, 1.24 + bob, -0.04, 0.03, 0.26, 0.32, GOLD_L);
  // cauda
  P(base, 0, 1.02 + bob, -0.82, 0.1, 0.42, 0.1, hideD, 0.35);
  // cabeça maciça com placa dourada na testa, orelhas grandes, olhos vermelhos, presas e tromba
  const hd = joint(base, 0, 1.26 + bob, 0.86, -0.15 * wind + 0.2 * lunge - atk * 0.25, 0, 0);
  P(hd, 0, 0.05, 0, 0.78, 0.74, 0.66, hide);
  P(hd, 0, 0.24, 0.26, 0.44, 0.42, 0.16, GOLD);
  P(hd, 0, 0.3, 0.35, 0.16, 0.22, 0.04, RM_RED);
  for (const sg of [1, -1]) {
    const ear = joint(hd, sg * 0.42, 0.1, -0.08, 0, 0, sg * (0.18 + Math.sin(t * 4) * 0.08 + wind * 0.25));
    P(ear, sg * 0.24, -0.04, 0, 0.46, 0.56, 0.09, hideD);
    P(ear, sg * 0.24, -0.04, 0.05, 0.34, 0.42, 0.03, 0x8a5850);
    // olhos vermelhos brilhantes
    L(hd, sg * 0.24, 0.12, 0.34, 0.12, 0.09, 0.03, 0xff2a1a);
    // presas grandes de marfim com aro dourado
    const tusk = joint(hd, sg * 0.28, -0.22, 0.28, -0.35, sg * 0.2, 0);
    P(tusk, 0, 0, 0.28, 0.14, 0.14, 0.56, 0xf2ebd8);
    P(tusk, 0, 0.06, 0.58, 0.1, 0.1, 0.24, 0xfff8e8, -0.45);
    P(tusk, 0, 0, 0.16, 0.17, 0.17, 0.08, GOLD);
  }
  // tromba articulada
  const trunk = joint(hd, 0, -0.14, 0.34, -0.35 - wind * 0.65 - atk * 0.5 + Math.sin(t * 3) * 0.12, 0, 0);
  P(trunk, 0, -0.22, 0.1, 0.22, 0.48, 0.22, hide);
  P(trunk, 0, -0.52, 0.2, 0.18, 0.32, 0.18, hideD, -0.4);
}
BODIES.rm_elephant = drawElephant;
OTHER_COLORS.rm_elephant = [0x6e6a64, RM_RED];

// Torre de Cerco (Balista romana montada pelo Engenheiro)
function drawRmTurret(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const aim = z.aimT > 0 ? 1 : 0;
  // base de madeira/pedra em tripé
  P(base, 0, 0.12, 0, 0.9, 0.22, 0.9, 0x7a7468);
  P(base, 0, 0.62, 0, 0.22, 0.85, 0.22, RM_WOOD);
  P(base, 0, 0.45, 0, 0.64, 0.14, 0.64, 0x5c3618);
  // trilho da balista e arco metálico
  P(base, 0, 1.12, 0.12, 0.22, 0.16, 1.05, RM_WOOD);
  P(base, 0, 1.12, 0.56, 0.28, 0.22, 0.16, RM_STEEL_D);
  for (const sg of [1, -1]) {
    P(base, sg * 0.48, 1.14, 0.44, 0.72, 0.08, 0.1, RM_STEEL, 0, sg * 0.12);
    P(base, sg * 0.84, 1.14, 0.4, 0.1, 0.14, 0.12, GOLD);
  }
  // escudo frontal vermelho com detalhe dourado
  P(base, 0, 0.85, 0.52, 0.62, 0.48, 0.06, RM_RED);
  P(base, 0, 0.85, 0.56, 0.14, 0.36, 0.02, GOLD);
  // virote pronto (brilha durante a mira)
  P(base, 0, 1.24, 0.18, 0.06, 0.06, 0.96, 0xd8c49a);
  if (aim) L(base, 0, 1.24, 0.7, 0.14, 0.14, 0.18, 0xffe060);
  else P(base, 0, 1.24, 0.68, 0.1, 0.08, 0.16, RM_STEEL);
}
BODIES.rm_turret = drawRmTurret;
OTHER_COLORS.rm_turret = [RM_WOOD, GOLD];

// Carruagem de Guerra Romana: caixa dourada/vermelha, condutor legionário e dois cavalos blindados
function drawRmChariot(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const wind = z.state === 'wind';
  const roll = z.walk * 2.2;
  // caixa da carruagem (madeira + vermelho imperial + moldura dourada)
  P(base, 0, 0.68, -0.56, 1.1, 0.52, 0.88, RM_WOOD);
  P(base, 0, 0.7, -0.1, 1.04, 0.44, 0.06, RM_RED);
  P(base, 0, 0.96, -0.56, 1.16, 0.09, 0.94, GOLD);
  P(base, 0, 0.72, -0.06, 0.3, 0.24, 0.03, GOLD_L);
  P(base, 0, 0.5, 0.3, 0.08, 0.08, 1.05, RM_WOOD);
  // rodas grandes com raios dourados
  for (const sg of [1, -1]) {
    const w = joint(base, sg * 0.62, 0.5, -0.56, roll, 0, 0);
    P(w, 0, 0, 0, 0.09, 0.92, 0.92, 0x4a2c14);
    P(w, 0, 0, 0, 0.11, 0.12, 0.96, GOLD);
    P(w, 0, 0, 0, 0.11, 0.96, 0.12, GOLD);
    P(w, 0, 0, 0, 0.13, 0.22, 0.22, RM_STEEL);
  }
  // condutor romano com elmo de crista vermelha, capa e lança
  P(base, 0, 1.24, -0.5, 0.4, 0.5, 0.3, RM_STEEL);
  P(base, 0, 1.24, -0.68, 0.44, 0.52, 0.04, RM_RED);
  P(base, 0, 1.66, -0.5, 0.34, 0.34, 0.34, RM_SKIN);
  P(base, 0, 1.84, -0.5, 0.38, 0.14, 0.38, RM_STEEL);
  P(base, 0, 2.0, -0.5, 0.1, 0.2, 0.44, RM_RED);
  L(base, 0.08, 1.68, -0.32, 0.06, 0.04, 0.02, 0xff2a1a);
  L(base, -0.08, 1.68, -0.32, 0.06, 0.04, 0.02, 0xff2a1a);
  // lança romana pronta para arremesso
  P(base, 0.32, 1.38, -0.15, 0.05, 0.05, 1.2, RM_WOOD, -0.25);
  P(base, 0.32, 1.54, 0.44, 0.08, 0.06, 0.24, RM_STEEL, -0.25);
  // dois cavalos de guerra blindados puxando à frente
  for (const sg of [1, -1]) {
    const hx = sg * 0.34;
    const gal = Math.sin(z.walk * 2.5 + (sg > 0 ? 0 : 1.2));
    P(base, hx, 0.94 + gal * 0.03, 0.86, 0.32, 0.36, 0.84, 0x7c6e5c);
    P(base, hx, 1.0 + gal * 0.03, 0.86, 0.35, 0.2, 0.52, RM_RED);
    P(base, hx, 1.0 + gal * 0.03, 1.16, 0.35, 0.24, 0.16, GOLD);
    const nk = joint(base, hx, 1.12, 1.24, -0.65 + (wind ? -0.35 : 0), 0, 0);
    P(nk, 0, 0.2, 0, 0.18, 0.42, 0.2, 0x7c6e5c);
    P(nk, 0, 0.42, 0.14, 0.2, 0.2, 0.36, 0x6c5e4c);
    P(nk, 0, 0.48, 0.16, 0.22, 0.1, 0.24, GOLD);
    L(nk, 0.08, 0.44, 0.26, 0.04, 0.04, 0.04, 0xff2a1a);
    L(nk, -0.08, 0.44, 0.26, 0.04, 0.04, 0.04, 0xff2a1a);
    for (const [lx, lz, ph] of [[-0.09, 0.28, 0], [0.09, 0.28, Math.PI], [-0.09, -0.28, Math.PI], [0.09, -0.28, 0]]) {
      const lg = joint(base, hx + lx, 0.72, 0.86 + lz, Math.sin(z.walk * 2.5 + ph + (sg > 0 ? 0 : 1.2)) * 0.55, 0, 0);
      P(lg, 0, -0.34, 0, 0.09, 0.68, 0.09, 0x5c4e3e);
    }
  }
}
BODIES.rm_chariot = drawRmChariot;
OTHER_COLORS.rm_chariot = [RM_RED, GOLD];

// Águia Imperial Corrompida: asas roxas/carmesim grandes, peitoral dourado, bico curvo e energia roxa
function drawRmEagle(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const flap = Math.sin(t * 8.5 + z.walk) * 0.52;
  const dive = z.state === 'lunge' ? 0.6 : z.state === 'wind' ? -0.38 : 0.1;
  const body = joint(base, 0, -0.08, 0, dive, 0, 0);
  const purp = 0x5a1a8a;
  const purpL = 0x9a30d0;
  // tronco blindado dourado e roxo
  P(body, 0, 0, 0, 0.44, 0.38, 0.82, purp);
  P(body, 0, -0.1, 0.14, 0.42, 0.22, 0.56, GOLD);
  P(body, 0, 0.14, -0.04, 0.32, 0.08, 0.62, RM_RED);
  // cauda em leque roxa/dourada
  P(body, 0, 0.02, -0.58, 0.52, 0.06, 0.38, purp);
  P(body, 0, 0.04, -0.62, 0.34, 0.06, 0.32, GOLD);
  // cabeça de águia com colar dourado, bico curvo e olhos roxos brilhantes
  const hd = joint(body, 0, 0.22, 0.48, -dive * 0.4, 0, 0);
  P(hd, 0, 0, 0, 0.34, 0.32, 0.34, 0xe8e0d0);
  P(hd, 0, 0.12, -0.04, 0.36, 0.09, 0.36, purp);
  P(hd, 0, -0.04, 0.22, 0.14, 0.12, 0.16, GOLD_L);
  P(hd, 0, -0.11, 0.28, 0.08, 0.09, 0.07, GOLD, 0.65);
  L(hd, 0.13, 0.03, 0.16, 0.07, 0.06, 0.04, 0xe060ff);
  L(hd, -0.13, 0.03, 0.16, 0.07, 0.06, 0.04, 0xe060ff);
  // asas grandes batendo (roxo escuro + penas carmesim e brilho roxo nas pontas)
  for (const sg of [1, -1]) {
    const wg = joint(body, sg * 0.22, 0.1, 0.05, 0, 0, sg * (0.16 + flap));
    P(wg, sg * 0.52, 0, 0, 1.04, 0.08, 0.62, purp);
    P(wg, sg * 0.42, 0.02, 0.26, 0.82, 0.06, 0.12, GOLD);
    for (let k = 0; k < 3; k++) P(wg, sg * (0.3 + k * 0.3), -0.01, -0.3, 0.24, 0.05, 0.18, RM_RED);
    const tip = joint(wg, sg * 1.04, 0, 0, 0, 0, sg * flap * 0.6);
    P(tip, sg * 0.34, 0, -0.06, 0.68, 0.05, 0.46, purpL);
    L(tip, sg * 0.44, -0.01, -0.26, 0.46, 0.04, 0.12, 0xc040ff);
  }
  // garras douradas
  for (const sg of [1, -1]) P(body, sg * 0.13, -0.28, 0.12, 0.09, 0.18, 0.09, GOLD);
  if (z.attackT > 0 || z.state === 'wind') L(hd, 0, -0.04, 0.38, 0.18, 0.18, 0.18, 0xd060ff);
}
BODIES.rm_eagle = drawRmEagle;
OTHER_COLORS.rm_eagle = [0x9a30d0, GOLD];

// Desenha um inimigo. z = { type, def, look, pos, facing, scale, walk, hurtT, attackT, state, alive, deadT, fallDir, rise, flyY }
// ------------------------------------------------------------------ Cemitério Naval — criaturas marinhas com anatomia própria
function drawNvCrab(B, G, base, z, col, t) {
  const m = base;
  // carapaça
  B.part(m, 0, 0.5, 0, 0, 0, 0, 0, 0, 1.6, 0.7, 2.0, col(0xc84830));
  // pinças
  B.part(m, -1.1, 0.7, 0.6, 0, 0.3, 0, 0, 0, 0.7, 0.5, 0.9, col(0x7a2c1e));
  B.part(m, 1.1, 0.7, 0.6, 0, -0.3, 0, 0, 0, 0.7, 0.5, 0.9, col(0x7a2c1e));
  // patas (6)
  for (let i = 0; i < 3; i++) {
    const x = -1.2 + i * 0.6;
    B.part(m, x, 0.15, 0.9, 0, 0, 0, 0, 0, 0.25, 0.3, 0.25, col(0x7a2c1e));
    B.part(m, x, 0.15, -0.9, 0, 0, 0, 0, 0, 0.25, 0.3, 0.25, col(0x7a2c1e));
  }
  // olhos
  G.part(m, -0.3, 0.85, 1.0, 0, 0, 0, 0, 0, 0.18, 0.18, 0.12, 0xffe060);
  G.part(m, 0.3, 0.85, 1.0, 0, 0, 0, 0, 0, 0.18, 0.18, 0.12, 0xffe060);
}
function drawNvOctopus(B, G, base, z, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c) => G.part(base, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const bob = Math.sin(t * 2.2) * 0.06;
  // manto bulboso (cabeça alongada para trás)
  P(0, 1.35 + bob, -0.15, 1.25, 1.05, 1.35, 0x5a4a9a);
  P(0, 1.95 + bob, -0.35, 0.95, 0.55, 1.0, 0x6c5cb4);
  P(0, 2.3 + bob, -0.5, 0.55, 0.35, 0.6, 0x7a6ac4);
  // manchas
  P(-0.4, 1.7 + bob, -0.3, 0.2, 0.2, 0.3, 0x3a2c6a); P(0.35, 1.5 + bob, -0.55, 0.22, 0.22, 0.3, 0x3a2c6a);
  // rosto / sifão
  P(0, 1.0 + bob, 0.55, 0.7, 0.4, 0.3, 0x4a3c84);
  // 8 tentáculos curvos em 2 segmentos
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const w = Math.sin(t * 3 + i) * 0.25;
    const cx = Math.sin(a), cz = Math.cos(a);
    P(cx * 0.55, 0.6, cz * 0.55, 0.24, 0.7, 0.24, 0x4a3c84, cz * 0.6, -cx * 0.6);
    P(cx * (1.0 + w * 0.2), 0.15, cz * (1.0 + w * 0.2), 0.2, 0.2, 0.55, 0x3a2c6a, 0, 0);
    P(cx * 1.25, 0.1, cz * 1.25, 0.12, 0.12, 0.12, 0xb89ae8); // ventosa na ponta
  }
  // olhos grandes com pupila
  P(-0.45, 1.35 + bob, 0.55, 0.32, 0.3, 0.12, 0xf0e0a0); P(0.45, 1.35 + bob, 0.55, 0.32, 0.3, 0.12, 0xf0e0a0);
  L(-0.45, 1.35 + bob, 0.62, 0.22, 0.08, 0.06, 0xff3a1a); L(0.45, 1.35 + bob, 0.62, 0.22, 0.08, 0.06, 0xff3a1a);
}
function drawNvAngler(B, G, base, z, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c) => G.part(base, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const sw = Math.sin(t * 6) * 0.08;
  // corpo arredondado
  P(0, 0.95, 0, 1.2, 1.0, 1.3, 0x3a7a8c);
  P(0, 0.6, 0.05, 1.05, 0.35, 1.15, 0x8ab8c0); // ventre claro
  // cabeçorra com mandíbula inferior saliente
  P(0, 1.05, 0.85, 1.25, 0.75, 0.6, 0x2e6474);
  P(0, 0.55, 0.95, 1.35, 0.35, 0.75, 0x23505e, -0.15);
  // dentes em agulha (superior e inferior)
  for (let i = 0; i < 6; i++) {
    const x = -0.5 + i * 0.2;
    P(x, 0.82, 1.2, 0.07, 0.28, 0.07, 0xf2f0dc);
    P(x + 0.1, 0.78, 1.28, 0.07, 0.26, 0.07, 0xf2f0dc);
  }
  // haste da isca + bulbo luminoso
  P(0, 1.7, 0.7, 0.08, 0.7, 0.08, 0x23505e, 0.5);
  P(0, 2.0, 1.05, 0.08, 0.08, 0.5, 0x23505e);
  L(0, 1.85, 1.35, 0.3, 0.3, 0.3, 0x60f0ff);
  // olhos pequenos brilhantes
  L(-0.5, 1.25, 1.05, 0.12, 0.12, 0.08, 0xc0ffff); L(0.5, 1.25, 1.05, 0.12, 0.12, 0.08, 0xc0ffff);
  // nadadeiras peitorais e cauda
  P(-0.7, 0.85, 0.1, 0.12, 0.45, 0.5, 0x2e6474, 0, 0.4 + sw); P(0.7, 0.85, 0.1, 0.12, 0.45, 0.5, 0x2e6474, 0, -0.4 - sw);
  P(sw, 0.95, -0.85, 0.2, 0.5, 0.5, 0x2e6474);
  P(sw * 2, 0.95, -1.25, 0.12, 0.95, 0.45, 0x3a7a8c);
  // espinhos dorsais
  for (let i = 0; i < 3; i++) P(0, 1.55, -0.4 + i * 0.3, 0.06, 0.25, 0.08, 0x8ab8c0);
}
function drawNvShark(B, G, base, z, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c) => G.part(base, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const sw = Math.sin(t * 5 + z.walk) * 0.12;
  const bite = z.attackT > 0 ? 0.25 : 0.08;
  // corpo afunilado em 4 seções
  P(0, 0.85, 0.75, 0.95, 0.85, 0.9, 0x4c7e9a);
  P(0, 0.85, -0.1, 1.05, 0.95, 0.9, 0x4c7e9a);
  P(sw * 0.5, 0.85, -0.9, 0.8, 0.75, 0.8, 0x44728c);
  P(sw, 0.85, -1.6, 0.5, 0.5, 0.7, 0x3c6680);
  // ventre branco
  P(0, 0.48, 0.3, 0.85, 0.2, 1.8, 0xdfe8ec);
  // focinho
  P(0, 0.95, 1.4, 0.75, 0.55, 0.5, 0x4c7e9a);
  // mandíbula com fileira de dentes
  P(0, 0.42 - bite, 1.2, 0.75, 0.22, 0.75, 0x2c4a5c);
  for (let i = 0; i < 5; i++) { P(-0.3 + i * 0.15, 0.6 - bite * 0.5, 1.5, 0.07, 0.16, 0.07, 0xffffff); }
  // guelras
  for (let i = 0; i < 3; i++) { P(-0.53, 0.85, 0.5 - i * 0.15, 0.04, 0.4, 0.05, 0x23394a); P(0.53, 0.85, 0.5 - i * 0.15, 0.04, 0.4, 0.05, 0x23394a); }
  // barbatana dorsal triangular (3 degraus)
  P(0, 1.45, -0.05, 0.14, 0.35, 0.7, 0x35596e); P(0, 1.75, -0.2, 0.12, 0.3, 0.45, 0x35596e); P(0, 2.0, -0.32, 0.1, 0.25, 0.2, 0x35596e);
  // peitorais
  P(-0.7, 0.55, 0.35, 0.6, 0.1, 0.4, 0x35596e, 0, -0.35); P(0.7, 0.55, 0.35, 0.6, 0.1, 0.4, 0x35596e, 0, 0.35);
  // cauda em meia-lua
  P(sw * 1.5, 1.3, -2.05, 0.12, 0.9, 0.35, 0x35596e, -0.5); P(sw * 1.5, 0.55, -2.0, 0.12, 0.6, 0.3, 0x35596e, 0.5);
  // olhos vermelhos abissais e cicatriz
  L(-0.48, 1.05, 1.15, 0.06, 0.14, 0.14, 0xff2a1a); L(0.48, 1.05, 1.15, 0.06, 0.14, 0.14, 0xff2a1a);
  P(0.53, 1.0, 0.2, 0.03, 0.5, 0.08, 0xc8d4d8, 0.6);
}
function drawNvSerpent(B, G, base, z, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c) => G.part(base, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  // corpo em S ao longo do eixo de avanço (+z = frente), segmentos encostados e afinando
  const N = 9;
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    const zz = 0.9 - i * 0.48;
    const x = Math.sin(t * 3 - i * 0.7) * 0.45 * k;
    const s = 0.75 - k * 0.45;
    const y = 0.4 + (1 - k) * 0.5;
    P(x, y, zz, s, s, 0.55, i % 2 ? 0x1e8a6c : 0x26a07e);
    P(x, y - s * 0.45, zz, s * 0.8, 0.1, 0.5, 0xd8d080); // escamas ventrais
    if (i < N - 2) P(x, y + s * 0.55, zz, 0.08, 0.22, 0.3, 0x40e0a0); // crista
  }
  // pescoço erguido e cabeça
  P(0, 1.3, 1.3, 0.6, 0.7, 0.5, 0x26a07e, -0.3);
  P(0, 1.75, 1.75, 0.75, 0.5, 0.85, 0x2bb88c);
  P(0, 1.45, 1.85, 0.65, 0.22, 0.75, 0x1a6a54, 0.25); // mandíbula aberta
  // presas
  P(-0.2, 1.52, 2.15, 0.07, 0.26, 0.07, 0xffffff); P(0.2, 1.52, 2.15, 0.07, 0.26, 0.07, 0xffffff);
  // chifres/barbatanas laterais
  P(-0.45, 2.0, 1.5, 0.12, 0.4, 0.3, 0x40e0a0, 0, 0.5); P(0.45, 2.0, 1.5, 0.12, 0.4, 0.3, 0x40e0a0, 0, -0.5);
  // olhos venenosos
  L(-0.32, 1.88, 2.0, 0.1, 0.12, 0.14, 0xb0ff40); L(0.32, 1.88, 2.0, 0.1, 0.12, 0.14, 0xb0ff40);
}
function drawNvMimic(B, G, base, z, col, t) {
  const m = base;
  // baú
  B.part(m, 0, 0.4, 0, 0, 0, 0, 0, 0, 1.4, 0.7, 1.0, col(0x8a5828));
  // tampa aberta
  B.part(m, 0, 1.0, -0.3, 0.6, 0, 0, 0, 0, 1.4, 0.25, 0.9, col(0x6a4020));
  // dentes
  for (let i = 0; i < 5; i++) {
    const x = -0.5 + i * 0.25;
    B.part(m, x, 0.75, 0.4, 0, 0, 0, 0, 0, 0.08, 0.2, 0.08, 0xeeeecc);
  }
  // pernas
  B.part(m, -0.5, 0.1, 0.3, 0, 0, 0, 0, 0, 0.18, 0.3, 0.18, col(0x3a2810));
  B.part(m, 0.5, 0.1, 0.3, 0, 0, 0, 0, 0, 0.18, 0.3, 0.18, col(0x3a2810));
  B.part(m, -0.5, 0.1, -0.3, 0, 0, 0, 0, 0, 0.18, 0.3, 0.18, col(0x3a2810));
  B.part(m, 0.5, 0.1, -0.3, 0, 0, 0, 0, 0, 0.18, 0.3, 0.18, col(0x3a2810));
  // língua
  B.part(m, 0, 0.6, 0.5, 0, 0, 0, 0, 0, 0.15, 0.12, 0.4, 0xcc3333);
}
function drawNvPirate(B, G, base, z, col, t) {
  const m = base;
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const SK = 0x5a9a7a; // pele azulada de criatura afogada
  // calças piratas desgastadas (finais das pernas, por baixo dos botas)
  P(-0.12, 0.45, 0, 0.22, 0.9, 0.22, 0x2c3c4c);
  P(0.12, 0.45, 0, 0.22, 0.9, 0.22, 0x2c3c4c);
  // botas altas deterioradas (peças finais das pernas, na base do chão)
  P(-0.13, -0.58, 0, 0.38, 0.22, 0.40, 0x3a3632);
  P(0.13, -0.58, 0, 0.38, 0.22, 0.40, 0x3a3632);
  // casaco longo rasgado e encharcado
  P(0, 0.92, 0, 0.62, 0.68, 0.40, 0x2c3a40);
  P(0.20, 0.95, 0.02, 0.24, 0.02, 0.14, 0x2a2a30, 0.3);
  P(-0.30, 1.05, -0.05, 0.18, 0.02, 0.10, 0x2a2a30, -0.4);
  P(0, 0.55, 0.15, 0.45, 0.06, 0.30, 0x2a2a3a);
  // camisa antiga por baixo (fina, dobram a borda do casaco)
  P(0, -0.60, 0, 0.40, 0.20, 0.22, 0x9aa8a0);
  // cinto largo com fivela
  P(0, -0.65, 0, 0.68, 0.07, 0.40, 0x2c2620);
  P(0, -0.65, 0, 0.30, 0.09, 0.30, 0xffc860);
  // fios marítimos pendurados do cinto
  P(0.35, -0.65, 0.15, 0.05, 0.05, 0.22, 0x7a6050, 0.5);
  P(-0.35, -0.65, 0.15, 0.05, 0.05, 0.22, 0x7a6050, -0.5);
  // braços e mãos (pele afogada)
  P(-0.35, 0.95, 0, 0.20, 0.70, 0.20, SK);
  P(0.35, 0.95, 0, 0.20, 0.70, 0.20, SK);
  P(-0.35, 0.55, 0, 0.16, 0.16, 0.16, SK);
  P(0.46, 0.62, 0.36, 0.12, 0.08, 0.08, SK);
  P(-0.35, 0.55, 0.10, 0.10, 0.08, 0.06, 0x7a7a7a);
  // cabeça (pele afogada)
  P(0, 1.45, 0, 0.42, 0.45, 0.40, SK);
  // barba irregular e bigode
  P(0, 1.28, 0.16, 0.18, 0.04, 0.10, 0x3a2a18);
  P(0, 1.24, 0.18, 0.16, 0.03, 0.06, 0x4a4038);
  P(-0.10, 1.32, 0.10, 0.05, 0.05, 0.06, 0x3a2a18);
  P(0.10, 1.33, 0.11, 0.05, 0.04, 0.06, 0x3a2a18);
  P(0.02, 1.20, 0.16, 0.05, 0.04, 0.04, 0x3a2a18);
  // tapa-olho + olho direito com brilho sobrenatural discreto
  P(-0.12, 1.46, 0.22, 0.08, 0.08, 0.06, 0x0a0a0a);
  L(-0.12, 1.46, 0.22, 0.03, 0.05, 0.04, 0xffffff);
  L(0.12, 1.5, 0.2, 0.08, 0.08, 0.05, 0xffffff);
  P(0.12, 1.48, 0.2, 0.055, 0.055, 0.035, 0x3aa0a0);
  L(0.12, 1.48, 0.2, 0.03, 0.04, 0.02, 0x70f0ff);
  // chapéu pirata (tricórnio) + bandana sob o chapéu
  P(0, 1.75, 0, 0.55, 0.11, 0.50, 0x3a2e2c);
  P(0.52, 1.60, 0.05, 0.11, 0.13, 0.12, 0x2a2220);
  P(-0.52, 1.60, 0.05, 0.11, 0.13, 0.12, 0x2a2220);
  P(0, 1.85, 0, 0.07, 0.10, 0.07, 0x3a2e2c);
  P(0, 1.71, 0.10, 0.5, 0.02, 0.24, 0xff3e1a);
  // sabre pirata (enferrujado)
  B.part(m, 0.45, 0.7, 0.3, 0, -0.6, 0, 0, 0, 0.06, 0.06, 0.9, col(0x9aa4b2));
  // algas no fundo das pernas
  P(-0.2, 1.0, 0.2, 0.06, 0.4, 0.06, 0x3a5a3a);
  P(0.15, 0.9, 0.25, 0.06, 0.35, 0.06, 0x3a5a3a);
}
function drawNvHarpooner(B, G, base, z, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c) => G.part(base, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const w = Math.sin(z.walk || 0) * 0.35;
  const aim = z.attackT > 0 ? -0.5 : 0;
  // botas e calça de oleado
  P(-0.15, 0.45, 0, 0.24, 0.9, 0.26, 0x2a3a3a, w); P(0.15, 0.45, 0, 0.24, 0.9, 0.26, 0x2a3a3a, -w);
  P(-0.15, 0.1, 0.04, 0.28, 0.2, 0.36, 0x1a1412); P(0.15, 0.1, 0.04, 0.28, 0.2, 0.36, 0x1a1412);
  // capa de chuva amarelada e rasgada (marca do arpoador)
  P(0, 1.15, 0, 0.62, 0.8, 0.38, 0xb89a3a);
  P(0, 0.72, -0.05, 0.66, 0.2, 0.42, 0x8a7028);
  P(0, 1.2, -0.22, 0.6, 0.95, 0.06, 0x8a7028); // aba das costas
  // cinto com corrente enrolada
  P(0, 0.85, 0, 0.66, 0.1, 0.42, 0x3a2a1a);
  for (let i = 0; i < 4; i++) P(-0.25 + i * 0.17, 0.95 + (i % 2) * 0.06, 0.22, 0.1, 0.1, 0.06, 0x7a8088);
  // braços: esquerdo segura o arpão, direito puxa a corrente
  P(-0.42, 1.15, 0.1, 0.2, 0.7, 0.2, 0xb89a3a, -0.6 + aim); P(0.42, 1.1, 0, 0.2, 0.7, 0.2, 0xb89a3a, 0.2);
  P(-0.42, 0.95, 0.45, 0.16, 0.16, 0.16, 0x6a8a84); P(0.42, 0.78, 0.05, 0.16, 0.16, 0.16, 0x6a8a84);
  // cabeça afogada esverdeada com chapéu sueste
  P(0, 1.78, 0, 0.44, 0.44, 0.42, 0x6a8a84);
  P(0, 2.05, -0.05, 0.62, 0.08, 0.62, 0x8a7028);
  P(0, 2.13, 0, 0.42, 0.14, 0.42, 0xb89a3a);
  P(0, 1.98, -0.32, 0.6, 0.1, 0.25, 0x8a7028, 0.4); // aba traseira caída
  // barba de algas
  P(0, 1.55, 0.18, 0.36, 0.18, 0.1, 0x2c5a34); P(-0.1, 1.42, 0.2, 0.08, 0.16, 0.06, 0x2c5a34);
  L(-0.11, 1.82, 0.22, 0.08, 0.06, 0.04, 0x80ffd0); L(0.11, 1.82, 0.22, 0.08, 0.06, 0.04, 0x80ffd0);
  // arpão longo com ponta farpada
  P(-0.42, 1.05, 0.7, 0.07, 0.07, 1.9, 0x5a3c22, aim * 0.3);
  P(-0.42, 1.05 + aim * 0.15, 1.7, 0.12, 0.12, 0.3, 0xa8b0b8);
  P(-0.42, 1.05 + aim * 0.15, 1.55, 0.3, 0.06, 0.08, 0xa8b0b8);
  // corrente pendurada do arpão
  for (let i = 0; i < 4; i++) P(-0.3 + i * 0.12, 0.85 - i * 0.08, 0.35 - i * 0.05, 0.08, 0.08, 0.08, 0x7a8088);
}
function drawNvGhost(B, G, base, z, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c) => G.part(base, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const f = Math.sin(t * 2.5) * 0.1; // flutua
  const y0 = 0.35 + f;
  // sem pernas: cauda espectral que se desfaz em fiapos
  L(0, y0 + 0.15, -0.05, 0.42, 0.3, 0.3, 0x3ab8d8);
  L(0.05 + Math.sin(t * 4) * 0.08, y0 - 0.12, -0.12, 0.26, 0.25, 0.2, 0x2a90b0);
  L(-0.04 + Math.sin(t * 4 + 1) * 0.1, y0 - 0.32, -0.2, 0.14, 0.18, 0.12, 0x1e6a88);
  // uniforme de marinheiro: camisa listrada + gola
  for (let i = 0; i < 4; i++) P(0, y0 + 0.45 + i * 0.17, 0, 0.56, 0.17, 0.34, i % 2 ? 0xd8f4ff : 0x2a5a8a);
  P(0, y0 + 1.15, -0.12, 0.62, 0.12, 0.3, 0x2a5a8a); // gola marinheira
  P(0, y0 + 1.05, 0.18, 0.14, 0.18, 0.04, 0xd04040); // lenço
  // braços estendidos (assombração)
  P(-0.4, y0 + 0.9, 0.3, 0.18, 0.18, 0.65, 0xd8f4ff); P(0.4, y0 + 0.9, 0.3, 0.18, 0.18, 0.65, 0xd8f4ff);
  L(-0.4, y0 + 0.9, 0.68, 0.16, 0.16, 0.14, 0x9af4ff); L(0.4, y0 + 0.9, 0.68, 0.16, 0.16, 0.14, 0x9af4ff);
  // crânio pálido com boné de marinheiro
  P(0, y0 + 1.48, 0, 0.44, 0.44, 0.42, 0xcfe8ee);
  P(0, y0 + 1.36, 0.19, 0.3, 0.1, 0.06, 0x203038); // boca
  P(0, y0 + 1.75, 0, 0.5, 0.12, 0.46, 0xffffff);
  P(0, y0 + 1.72, 0.24, 0.3, 0.05, 0.12, 0x1a2a40);
  // órbitas vazias que brilham
  L(-0.11, y0 + 1.52, 0.22, 0.11, 0.1, 0.04, 0x70f0ff); L(0.11, y0 + 1.52, 0.22, 0.11, 0.1, 0.04, 0x70f0ff);
  // névoa / aura flutuando ao redor
  for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.57; L(Math.sin(a) * 0.6, y0 + 0.6 + i * 0.25, Math.cos(a) * 0.45, 0.08, 0.08, 0.08, 0x70e8ff); }
}
function drawNvBrute(B, G, base, z, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(base, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c) => G.part(base, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const w = Math.sin(z.walk || 0) * 0.25;
  const slam = z.attackT > 0 || z.state === 'slam' ? -1.1 : 0;
  // pernas curtas e grossas
  P(-0.3, 0.45, 0, 0.42, 0.9, 0.44, 0x2a3a3a, w); P(0.3, 0.45, 0, 0.42, 0.9, 0.44, 0x2a3a3a, -w);
  // tronco largo e curvado, pele inchada de afogado
  P(0, 1.35, 0.05, 1.2, 1.0, 0.8, 0x4c7a6a, 0.15);
  P(0, 1.95, 0.15, 1.05, 0.45, 0.75, 0x4c7a6a, 0.15);
  // barriga com cracas
  P(0, 1.1, 0.42, 0.8, 0.55, 0.12, 0x6a9a84);
  for (let i = 0; i < 5; i++) P(-0.35 + i * 0.18, 1.05 + (i % 2) * 0.25, 0.5, 0.12, 0.12, 0.08, 0xd8d0b0);
  // correntes cruzadas no peito
  for (let i = 0; i < 5; i++) P(-0.45 + i * 0.22, 1.85 - i * 0.18, 0.5, 0.1, 0.1, 0.08, 0x7a8088);
  // braços gigantes, esquerdo ergue a âncora
  P(-0.8, 1.55, 0.1, 0.45, 1.0, 0.45, 0x4c7a6a, slam); P(0.8, 1.35, 0.1, 0.45, 1.0, 0.45, 0x4c7a6a, 0.1);
  P(0.8, 0.8, 0.15, 0.4, 0.35, 0.4, 0x3a5a4c);
  // cabeça pequena afundada nos ombros, com capuz de lona
  P(0, 2.3, 0.35, 0.44, 0.42, 0.42, 0x6a9a84);
  P(0, 2.48, 0.25, 0.56, 0.28, 0.52, 0x5a4a38);
  P(0, 2.15, 0.56, 0.3, 0.1, 0.05, 0x1a2020);
  L(-0.11, 2.32, 0.57, 0.08, 0.07, 0.04, 0xffb040); L(0.11, 2.32, 0.57, 0.08, 0.07, 0.04, 0xffb040);
  // âncora gigante
  const ay = slam ? 2.7 : 1.0, az = slam ? 0.6 : 0.55;
  P(-0.8, ay, az, 0.14, 1.5, 0.14, 0x5a646e);
  P(-0.8, ay + 0.7, az, 0.5, 0.12, 0.12, 0x5a646e);
  P(-0.8, ay - 0.72, az, 1.1, 0.16, 0.18, 0x5a646e);
  P(-1.3, ay - 0.55, az, 0.16, 0.38, 0.18, 0x5a646e); P(-0.3, ay - 0.55, az, 0.16, 0.38, 0.18, 0x5a646e);
  P(-0.8, ay + 0.85, az, 0.26, 0.26, 0.08, 0x5a646e);
}
Object.assign(BODIES, { nv_harpooner: drawNvHarpooner, nv_ghost: drawNvGhost, nv_brute: drawNvBrute });

// ------------------------------------------------------------------ MODELOS: Lab (14) + Folclore do Vale (10)
// Silhueta e anatomia dirigidas pela habilidade de cada criatura. Voxel, sem alterar rigs/colisoes.
function drawLabMob(kind, B, G, m, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const bob = Math.sin((t || 0) * 2) * 0.02;
  if (kind === 'lb_specter') {
    // ESPECTRO: manto flutuante sem pernas, bracoes espectrais, cranio alongado
    for (let i = 0; i < 4; i++) P(0, 0.42 + i * 0.28, 0, 0.62 - i * 0.06, 0.3, 0.5 - i * 0.04, i % 2 ? 0x1e4452 : 0x16323c);
    L(-0.2, 0.3, 0.1, 0.1, 0.26, 0.06, 0x70e8ff, 0, 0.3);
    L(0.22, 0.24, 0.08, 0.08, 0.22, 0.05, 0x70e8ff, 0, -0.3);
    L(-0.28, 1.05, 0.12, 0.14, 0.3, 0.08, 0x3a8fa0, 0, 0.5);
    L(0.3, 1.05, 0.1, 0.14, 0.32, 0.08, 0x3a8fa0, 0, -0.5);
    P(0, 1.42, 0.02, 0.86, 0.16, 0.6, 0x24515f);
    P(0, 1.2, 0, 0.42, 0.4, 0.36, 0x1c3d48);
    P(0, 1.62, 0.04, 0.34, 0.42, 0.32, 0x9ad8e8);
    P(0, 1.44, 0.2, 0.2, 0.12, 0.12, 0x7ab8c8);
    L(-0.09, 1.68, 0.19, 0.07, 0.08, 0.03, 0x9affff);
    L(0.09, 1.68, 0.19, 0.07, 0.08, 0.03, 0x9affff);
    L(0, 1.24, 0.2, 0.12, 0.12, 0.05, 0x9affff);
    P(-0.46, 1.3, 0.06, 0.12, 0.34, 0.12, 0x1c3d48, 0, 0.35);
    P(0.46, 1.3, 0.06, 0.12, 0.34, 0.12, 0x1c3d48, 0, -0.35);
    P(-0.52, 0.98, 0.16, 0.1, 0.34, 0.1, 0x2a7a8a, 0.5, 0.2);
    P(0.52, 0.98, 0.16, 0.1, 0.34, 0.1, 0x2a7a8a, 0.5, -0.2);
    L(-0.56, 0.8, 0.28, 0.12, 0.06, 0.12, 0x9affff);
    L(0.56, 0.8, 0.28, 0.12, 0.06, 0.12, 0x9affff);
  } else if (kind === 'lb_tremor') {
    // TREMOR: massa tipo gorila, bracos ate o chao, cabeca afundada, placas nas costas
    P(-0.26, 0.36, 0, 0.36, 0.72, 0.36, 0x3a3228);
    P(0.26, 0.36, 0, 0.36, 0.72, 0.36, 0x3a3228);
    P(-0.26, 0.07, 0.08, 0.4, 0.16, 0.48, 0x241e18);
    P(0.26, 0.07, 0.08, 0.4, 0.16, 0.48, 0x241e18);
    P(0, 1.1, 0, 1.02, 0.78, 0.72, 0x5c5240);
    P(0, 1.02, 0.34, 0.66, 0.44, 0.12, 0x6e6250);
    P(0, 1.52, -0.16, 0.78, 0.26, 0.34, 0x3a3a34);
    P(-0.3, 1.62, -0.3, 0.16, 0.3, 0.16, 0x2a2a24, 0, 0.4);
    P(0.3, 1.62, -0.3, 0.16, 0.3, 0.16, 0x2a2a24, 0, -0.4);
    P(-0.62, 1.1, 0, 0.28, 0.72, 0.28, 0x504636, 0, 0.16);
    P(0.62, 1.1, 0, 0.28, 0.72, 0.28, 0x504636, 0, -0.16);
    P(-0.7, 0.5, 0.12, 0.36, 0.44, 0.36, 0x5c5240);
    P(0.7, 0.5, 0.12, 0.36, 0.44, 0.36, 0x5c5240);
    P(-0.7, 0.14, 0.18, 0.44, 0.26, 0.46, 0x3a3228);
    P(0.7, 0.14, 0.18, 0.44, 0.26, 0.46, 0x3a3228);
    P(0, 1.72, 0.12, 0.3, 0.24, 0.28, 0x6a6050);
    P(0, 1.82, 0.14, 0.36, 0.1, 0.32, 0x3a3a34);
    L(-0.08, 1.74, 0.27, 0.06, 0.05, 0.02, 0xffc040);
    L(0.08, 1.74, 0.27, 0.06, 0.05, 0.02, 0xffc040);
    L(-0.3, 0.03, 0.42, 0.05, 0.02, 0.5, 0xffa030);
    L(0.3, 0.03, 0.42, 0.05, 0.02, 0.5, 0xffa030);
  } else if (kind === 'lb_launcher') {
    // LANC0ADOR: tanque acido nas costas, canhao no braco, mascara de gas
    P(-0.2, 0.4, 0, 0.24, 0.8, 0.24, 0x3a4048);
    P(0.2, 0.4, 0, 0.24, 0.8, 0.24, 0x3a4048);
    P(-0.2, 0.07, 0.08, 0.28, 0.14, 0.4, 0x24282c);
    P(0.2, 0.07, 0.08, 0.28, 0.14, 0.4, 0x24282c);
    P(0, 1.08, -0.04, 0.62, 0.62, 0.5, 0x4e5a62, -0.18);
    P(0, 1.22, -0.42, 0.54, 0.78, 0.36, 0x3a4a3a);
    L(0, 1.22, -0.6, 0.36, 0.56, 0.04, 0x9aff40);
    P(0, 1.62, -0.4, 0.2, 0.16, 0.2, 0x2a3a2a);
    P(0.34, 1.3, -0.1, 0.08, 0.08, 0.44, 0x2a3034, 0.4);
    P(0, 1.02, 0.4, 0.26, 0.26, 0.52, 0x6a7278);
    P(0, 1.02, 0.68, 0.18, 0.18, 0.2, 0x24282c);
    L(0, 0.9, 0.76, 0.06, 0.12, 0.06, 0x9aff40);
    P(-0.4, 1.0, 0.06, 0.16, 0.5, 0.16, 0x4e5a62, 0, 0.3);
    P(0, 1.5, 0.06, 0.34, 0.28, 0.3, 0x5a6268);
    P(0, 1.46, 0.25, 0.22, 0.18, 0.14, 0x24282c);
    L(-0.07, 1.5, 0.33, 0.06, 0.05, 0.02, 0x9aff40);
  } else if (kind === 'lb_suppressor') {
    // SUPRESSOR: alto e fino, sem bracos, antena parabólica e anel de campo
    P(-0.14, 0.5, 0, 0.12, 1.0, 0.12, 0x2a4a3a);
    P(0.14, 0.5, 0, 0.12, 1.0, 0.12, 0x2a4a3a);
    P(-0.14, 0.06, 0.05, 0.2, 0.12, 0.3, 0x1e3428);
    P(0.14, 0.06, 0.05, 0.2, 0.12, 0.3, 0x1e3428);
    P(0, 1.16, 0, 0.34, 0.62, 0.26, 0x2f5a42);
    L(0, 1.2, 0.14, 0.18, 0.18, 0.06, 0x70ffa0);
    L(0, 1.02, 0, 1.06, 0.05, 1.06, 0x3aff8a);
    P(0, 1.6, 0.02, 0.26, 0.28, 0.24, 0x3a6a4a);
    L(-0.08, 1.64, 0.15, 0.06, 0.04, 0.02, 0xd8ffe0);
    L(0.08, 1.64, 0.15, 0.06, 0.04, 0.02, 0xd8ffe0);
    P(0, 1.86, 0, 0.06, 0.26, 0.06, 0x2a4a3a);
    P(0, 1.98, 0, 0.56, 0.05, 0.56, 0x2f5a42);
    L(0, 2.02, 0, 0.4, 0.03, 0.4, 0x70ffa0);
    L(0, 2.14, 0, 0.1, 0.2, 0.1, 0x70ffa0);
  } else if (kind === 'lb_corrosive') {
    // CORROSIVO: corpo inchado, sem pernas (tentaculos), sacos acidos luminosos
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      P(Math.cos(a) * 0.34, 0.34, Math.sin(a) * 0.3, 0.16, 0.6, 0.16, 0x3a5a3a, Math.sin(a) * 0.5, Math.cos(a) * 0.5);
      P(Math.cos(a) * 0.42, 0.06, Math.sin(a) * 0.38, 0.2, 0.14, 0.2, 0x2a4030);
    }
    P(0, 1.02, 0, 0.86, 0.74, 0.78, 0x4a6a48);
    P(-0.34, 1.2, 0.16, 0.22, 0.28, 0.22, 0x3a5a3a);
    P(0.34, 1.2, 0.16, 0.22, 0.28, 0.22, 0x3a5a3a);
    L(-0.34, 1.34, 0.16, 0.14, 0.06, 0.14, 0x9aff4a);
    L(0.34, 1.34, 0.16, 0.14, 0.06, 0.14, 0x9aff4a);
    L(0, 0.98, 0.4, 0.3, 0.24, 0.06, 0x9aff4a);
    L(-0.14, 0.7, 0.42, 0.06, 0.22, 0.04, 0x9aff4a);
    L(0.16, 0.64, 0.42, 0.05, 0.18, 0.04, 0x9aff4a);
    P(0, 1.52, 0.12, 0.28, 0.24, 0.26, 0x5a7a50);
    P(0, 1.42, 0.26, 0.18, 0.1, 0.1, 0x3a5a3a);
    P(-0.5, 1.06, 0.1, 0.14, 0.4, 0.14, 0x4a6a48, 0, 0.4);
    P(0.5, 1.06, 0.1, 0.14, 0.4, 0.14, 0x4a6a48, 0, -0.4);
  } else if (kind === 'lb_incendiary') {
    // INCENDIARIO: forno ambulante, chamine, grelha incandescente, latas de combustivel
    P(-0.18, 0.34, 0, 0.2, 0.68, 0.2, 0x3a2a22);
    P(0.18, 0.34, 0, 0.2, 0.68, 0.2, 0x3a2a22);
    P(-0.18, 0.06, 0.06, 0.24, 0.12, 0.34, 0x241810);
    P(0.18, 0.06, 0.06, 0.24, 0.12, 0.34, 0x241810);
    P(0, 1.0, 0, 0.58, 0.78, 0.54, 0x4a3a30);
    L(0, 0.98, 0.28, 0.42, 0.42, 0.05, 0xff6a1a);
    L(0, 0.98, 0.29, 0.06, 0.42, 0.04, 0xffd060);
    L(0.14, 0.98, 0.29, 0.06, 0.42, 0.04, 0xffd060);
    P(0.16, 1.52, -0.08, 0.14, 0.44, 0.14, 0x3a2a22);
    L(0.16, 1.82, -0.08, 0.2, 0.14, 0.2, 0x6a3a2a);
    P(-0.32, 1.12, -0.3, 0.2, 0.34, 0.22, 0x8a3a1a);
    P(0.32, 1.12, -0.3, 0.2, 0.34, 0.22, 0x8a3a1a);
    P(0, 1.58, 0.06, 0.3, 0.26, 0.28, 0x4a3a30);
    L(0, 1.6, 0.21, 0.24, 0.06, 0.04, 0xff9a4a);
    L(-0.42, 0.94, 0.14, 0.1, 0.3, 0.1, 0xff6a1a, 0, 0.35);
    L(0.42, 0.94, 0.14, 0.1, 0.3, 0.1, 0xff6a1a, 0, -0.35);
    P(-0.36, 1.0, 0.06, 0.14, 0.44, 0.14, 0x4a3a30, 0, 0.3);
    P(0.36, 1.0, 0.06, 0.14, 0.44, 0.14, 0x4a3a30, 0, -0.3);
  } else if (kind === 'lb_freezer') {
    // CONGELADOR: golem de gelo com espinhos cristalinos e pernas digitigradas
    P(-0.18, 0.34, 0, 0.2, 0.56, 0.2, 0x4a7a8a, -0.2);
    P(0.18, 0.34, 0, 0.2, 0.56, 0.2, 0x4a7a8a, -0.2);
    P(-0.18, 0.7, 0.1, 0.16, 0.3, 0.16, 0x3f6a7a);
    P(0.18, 0.7, 0.1, 0.16, 0.3, 0.16, 0x3f6a7a);
    P(-0.18, 0.06, 0.14, 0.24, 0.12, 0.34, 0x355a68);
    P(0.18, 0.06, 0.14, 0.24, 0.12, 0.34, 0x355a68);
    P(0, 1.08, 0, 0.62, 0.62, 0.46, 0x5a8aa0);
    P(-0.32, 1.42, -0.14, 0.16, 0.5, 0.16, 0x9ae0ff, 0, 0.45);
    P(0.32, 1.42, -0.14, 0.16, 0.5, 0.16, 0x9ae0ff, 0, -0.45);
    P(0, 1.56, -0.1, 0.18, 0.62, 0.18, 0xaef0ff, 0.2, 0);
    P(-0.44, 1.0, 0.06, 0.18, 0.58, 0.18, 0x4a7a8a, 0, 0.2);
    P(0.44, 1.0, 0.06, 0.18, 0.58, 0.18, 0x4a7a8a, 0, -0.2);
    L(-0.48, 0.68, 0.16, 0.16, 0.16, 0.24, 0x9ae0ff);
    L(0.48, 0.68, 0.16, 0.16, 0.16, 0.24, 0x9ae0ff);
    P(0, 1.58, 0.04, 0.3, 0.3, 0.28, 0x7ab0c8);
    P(0, 1.78, 0.02, 0.14, 0.24, 0.14, 0xaef0ff, 0.2, 0);
    L(-0.08, 1.62, 0.18, 0.06, 0.05, 0.02, 0xcaf8ff);
    L(0.08, 1.62, 0.18, 0.06, 0.05, 0.02, 0xcaf8ff);
    L(0, 0.02, 0.3, 0.44, 0.03, 0.3, 0x6ac0e0);
  } else if (kind === 'lb_hunter') {
    // CACADOR: quadrúpede predador, coluna curvada, laminas nos antebracos, cauda
    P(0, 1.02, 0.02, 0.5, 0.4, 0.7, 0x5a2a20, -0.4);
    P(0, 1.16, 0.44, 0.32, 0.28, 0.36, 0x6a3a2a);
    P(0, 1.06, 0.66, 0.22, 0.18, 0.2, 0x4a2018);
    L(-0.08, 1.2, 0.56, 0.06, 0.05, 0.02, 0xff6030);
    L(0.08, 1.2, 0.56, 0.06, 0.05, 0.02, 0xff6030);
    P(-0.3, 0.98, 0.3, 0.16, 0.5, 0.16, 0x4a2018, 0.6, 0);
    P(0.3, 0.98, 0.3, 0.16, 0.5, 0.16, 0x4a2018, 0.6, 0);
    P(-0.38, 0.52, 0.52, 0.14, 0.5, 0.14, 0x3a1810, -0.4, 0);
    P(0.38, 0.52, 0.52, 0.14, 0.5, 0.14, 0x3a1810, -0.4, 0);
    L(-0.44, 0.44, 0.66, 0.3, 0.04, 0.04, 0xff6030, 0, 0.5);
    L(0.44, 0.44, 0.66, 0.3, 0.04, 0.04, 0xff6030, 0, -0.5);
    P(-0.28, 0.44, -0.3, 0.2, 0.72, 0.3, 0x3a1810, -0.3, 0);
    P(0.28, 0.44, -0.3, 0.2, 0.72, 0.3, 0x3a1810, -0.3, 0);
    P(0, 0.86, -0.6, 0.14, 0.14, 0.5, 0x3a1810, 0.5, 0);
    L(0, 0.82, -0.88, 0.1, 0.1, 0.14, 0xff6030);
    P(0, 1.22, -0.1, 0.42, 0.16, 0.4, 0x4a2018, -0.3);
  } else if (kind === 'lb_pack') {
    // MATILHA: quadrupede alongado com tres cabecas e espinhos dorsais
    P(0, 0.78, 0, 0.5, 0.42, 0.92, 0x5a4a3a);
    P(-0.22, 0.36, 0.34, 0.16, 0.72, 0.16, 0x4a3a2a);
    P(0.22, 0.36, 0.34, 0.16, 0.72, 0.16, 0x4a3a2a);
    P(-0.22, 0.36, -0.34, 0.16, 0.72, 0.16, 0x4a3a2a);
    P(0.22, 0.36, -0.34, 0.16, 0.72, 0.16, 0x4a3a2a);
    P(-0.22, 0.05, 0.38, 0.2, 0.1, 0.26, 0x241a12);
    P(0.22, 0.05, 0.38, 0.2, 0.1, 0.26, 0x241a12);
    P(-0.22, 0.05, -0.38, 0.2, 0.1, 0.26, 0x241a12);
    P(0.22, 0.05, -0.38, 0.2, 0.1, 0.26, 0x241a12);
    P(0, 1.02, 0.5, 0.3, 0.28, 0.3, 0x6a5a4a);
    P(0, 0.98, 0.68, 0.2, 0.16, 0.16, 0x4a3a2a);
    P(-0.32, 0.92, 0.4, 0.22, 0.22, 0.24, 0x5a4a3a);
    P(0.32, 0.92, 0.4, 0.22, 0.22, 0.24, 0x5a4a3a);
    P(-0.32, 0.9, 0.54, 0.16, 0.12, 0.12, 0x3a2a1a);
    P(0.32, 0.9, 0.54, 0.16, 0.12, 0.12, 0x3a2a1a);
    L(-0.1, 1.05, 0.64, 0.05, 0.04, 0.02, 0xffcc40);
    L(0.1, 1.05, 0.64, 0.05, 0.04, 0.02, 0xffcc40);
    L(-0.35, 0.95, 0.52, 0.05, 0.04, 0.02, 0xff7040);
    L(0.35, 0.95, 0.52, 0.05, 0.04, 0.02, 0xff7040);
    for (let i = 0; i < 4; i++) P(0, 1.06 + i * 0.02, 0.2 - i * 0.24, 0.12, 0.24, 0.12, 0x3a2a1a, 0, 0.3);
  } else if (kind === 'lb_signaler') {
    // SINALIZADOR: totem/tripe com farol giratorio e antenas - silhueta de pilar
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      P(Math.cos(a) * 0.34, 0.34, Math.sin(a) * 0.34, 0.1, 0.72, 0.1, 0x3a3a3a, Math.sin(a) * 0.35, -Math.cos(a) * 0.35);
    }
    P(0, 0.36, 0, 0.24, 0.24, 0.24, 0x4a4a4a);
    P(0, 1.02, 0, 0.2, 1.3, 0.2, 0x4a4a4a);
    P(-0.3, 1.3, 0, 0.26, 0.36, 0.06, 0x5a5a5a, 0, 0.4);
    P(0.3, 1.3, 0, 0.26, 0.36, 0.06, 0x5a5a5a, 0, -0.4);
    L(0, 1.72, 0, 0.36, 0.36, 0.36, 0xffc040);
    L(0, 1.72, 0, 0.24, 0.5, 0.24, 0xff8a20);
    P(0, 1.94, 0, 0.06, 0.24, 0.06, 0x5a5a5a);
    L(0, 2.1, 0, 0.08, 0.08, 0.08, 0xfff0a0);
    L(0, 2.5, 0, 0.34, 0.7, 0.34, 0xffc040);
    P(-0.2, 0.7, 0.06, 0.1, 0.2, 0.1, 0x5a5a5a);
    P(0.2, 0.7, 0.06, 0.1, 0.2, 0.1, 0x5a5a5a);
  } else if (kind === 'lb_puppeteer') {
    // TITEREIRO: corpo suspenso, sem pernas, fios e maos flutuantes, mascara alongada
    P(0, 1.1, 0, 0.3, 0.62, 0.26, 0x6a3a8a);
    P(0, 1.52, 0.02, 0.26, 0.44, 0.22, 0xd8c8e0);
    L(-0.07, 1.56, 0.15, 0.05, 0.05, 0.02, 0x8a4aff);
    L(0.07, 1.56, 0.15, 0.05, 0.05, 0.02, 0x8a4aff);
    L(0, 1.34, 0.14, 0.1, 0.1, 0.05, 0xb050ff);
    P(0, 0.78, 0, 0.22, 0.24, 0.2, 0x4a2a6a);
    for (let i = 0; i < 3; i++) {
      P(-0.16 + i * 0.16, 0.5 - i * 0.06, 0, 0.04, 0.36, 0.04, 0x3a2054, 0, (i - 1) * 0.2);
    }
    const arms = [[-0.42, 1.42, 0.1, 0.5], [0.42, 1.5, 0.06, -0.5], [-0.6, 1.12, -0.1, 0.9], [0.6, 1.18, -0.06, -0.9]];
    for (const [ax, ay, az, rz] of arms) {
      P(ax * 0.55, ay * 0.9, az, 0.05, 0.5, 0.05, 0x3a2054, 0, rz);
      L(ax, ay, az + 0.06, 0.12, 0.12, 0.12, 0xb050ff);
      L(ax * 0.55, ay + 0.34, az, 0.03, 0.5, 0.03, 0xd8a0ff, 0, rz * 0.4);
    }
    L(0, 0.3, 0, 0.03, 0.5, 0.03, 0xd8a0ff);
    L(-0.14, 0.24, 0, 0.03, 0.4, 0.03, 0xd8a0ff);
    L(0.14, 0.24, 0, 0.03, 0.4, 0.03, 0xd8a0ff);
  } else if (kind === 'lb_camouflaged') {
    // CAMUFLADO: silhueta baixa e achatada, capa, so os olhos e linhas de camuflagem brilham
    P(0, 0.5, 0, 0.54, 0.34, 0.74, 0x1c221c);
    P(0, 0.66, -0.06, 0.42, 0.18, 0.5, 0x232b23, -0.2);
    P(0, 0.78, 0.34, 0.3, 0.24, 0.26, 0x1c221c);
    L(-0.09, 0.82, 0.47, 0.08, 0.04, 0.02, 0xffd040);
    L(0.09, 0.82, 0.47, 0.08, 0.04, 0.02, 0xffd040);
    for (let i = 0; i < 4; i++) P(-0.3 + i * 0.2, 0.4, 0.24, 0.06, 0.3, 0.06, 0x2a332a, 0.4, 0.3);
    L(0, 0.56, 0.3, 0.56, 0.02, 0.04, 0x3a4a32);
    L(0, 0.44, 0.3, 0.5, 0.02, 0.04, 0x3a4a32);
    P(-0.28, 0.34, 0.3, 0.12, 0.5, 0.12, 0x1c221c, 0.3, 0.2);
    P(0.28, 0.34, 0.3, 0.12, 0.5, 0.12, 0x1c221c, 0.3, -0.2);
    L(-0.32, 0.14, 0.42, 0.06, 0.14, 0.06, 0xffd040);
    L(0.32, 0.14, 0.42, 0.06, 0.14, 0.06, 0xffd040);
  } else if (kind === 'lb_demolisher') {
    // DEMOLIDOR: esteiras, torso blindado, bracos-broca e cabeca embutida
    P(-0.42, 0.26, 0, 0.34, 0.5, 1.0, 0x22222a);
    P(0.42, 0.26, 0, 0.34, 0.5, 1.0, 0x22222a);
    for (let i = 0; i < 4; i++) {
      P(-0.42, 0.26, -0.36 + i * 0.24, 0.38, 0.54, 0.1, 0x3a3a42);
      P(0.42, 0.26, -0.36 + i * 0.24, 0.38, 0.54, 0.1, 0x3a3a42);
    }
    P(0, 1.16, 0, 0.92, 0.82, 0.82, 0x5a5a52);
    P(0, 1.44, 0.1, 0.7, 0.3, 0.5, 0x4a4a42);
    P(-0.58, 1.02, 0.3, 0.28, 0.28, 0.6, 0x7a7a70);
    P(0.58, 1.02, 0.3, 0.28, 0.28, 0.6, 0x7a7a70);
    P(-0.58, 1.02, 0.72, 0.18, 0.18, 0.24, 0x8a8a80);
    P(0.58, 1.02, 0.72, 0.18, 0.18, 0.24, 0x8a8a80);
    P(-0.58, 1.02, 0.9, 0.08, 0.08, 0.16, 0x9a9a90);
    P(0.58, 1.02, 0.9, 0.08, 0.08, 0.16, 0x9a9a90);
    P(0, 1.52, 0.34, 0.26, 0.2, 0.2, 0x3a3a34);
    L(0, 1.54, 0.45, 0.2, 0.05, 0.03, 0xffd040);
    L(-0.32, 1.18, 0.42, 0.28, 0.06, 0.03, 0xffd040);
    L(0, 1.6, -0.1, 0.5, 0.06, 0.4, 0xffa020);
  } else if (kind === 'lb_aerial') {
    // AEREO MUTANTE: asas abertas, corpo fino, cauda, garras recolhidas
    P(0, 1.0, 0, 0.3, 0.32, 0.62, 0x3a5a2a);
    P(0, 1.1, 0.44, 0.26, 0.24, 0.3, 0x4a7a3a);
    P(0, 1.02, 0.64, 0.14, 0.12, 0.2, 0xffb040);
    L(-0.08, 1.16, 0.54, 0.05, 0.04, 0.02, 0xfff080);
    L(0.08, 1.16, 0.54, 0.05, 0.04, 0.02, 0xfff080);
    P(-0.46, 1.12, 0, 0.62, 0.07, 0.42, 0x4a7a3a, 0, 0.16);
    P(0.46, 1.12, 0, 0.62, 0.07, 0.42, 0x4a7a3a, 0, -0.16);
    P(-0.94, 1.2, -0.08, 0.44, 0.06, 0.32, 0x3f6a32, 0, 0.1);
    P(0.94, 1.2, -0.08, 0.44, 0.06, 0.32, 0x3f6a32, 0, -0.1);
    L(-0.45, 1.08, -0.14, 0.6, 0.02, 0.4, 0x2aff8a);
    L(0.45, 1.08, -0.14, 0.6, 0.02, 0.4, 0x2aff8a);
    P(0, 0.98, -0.44, 0.12, 0.1, 0.4, 0x3a5a2a);
    P(0, 0.96, -0.66, 0.24, 0.06, 0.16, 0x3a5a2a);
    P(-0.1, 0.74, 0.06, 0.1, 0.3, 0.1, 0x3a5a2a);
    P(0.1, 0.74, 0.06, 0.1, 0.3, 0.1, 0x3a5a2a);
    P(-0.1, 0.62, 0.12, 0.14, 0.08, 0.2, 0xffb040);
    P(0.1, 0.62, 0.12, 0.14, 0.08, 0.2, 0xffb040);
  }
  void bob;
}

function drawFolkMob(kind, B, G, m, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  if (kind === 'ff_saci') {
    // SACI: uma unica perna, gorro vermelho pontudo, cachimbo e fumaca
    P(0, 0.46, 0, 0.18, 0.92, 0.18, 0x6a2a1a);
    P(0, 0.06, 0.1, 0.26, 0.12, 0.34, 0x2a1410);
    P(0, 1.04, 0, 0.34, 0.42, 0.3, 0x8a3a22);
    P(0, 0.86, 0, 0.16, 0.14, 0.16, 0xc8a070);
    P(-0.28, 1.04, 0.06, 0.12, 0.36, 0.12, 0x8a3a22, 0, 0.3);
    P(0.28, 1.04, 0.06, 0.12, 0.36, 0.12, 0x8a3a22, 0, -0.3);
    P(0, 1.42, 0, 0.36, 0.34, 0.32, 0xd8a070);
    P(0, 1.64, 0, 0.44, 0.18, 0.42, 0xc02020);
    P(0, 1.78, -0.04, 0.2, 0.2, 0.2, 0xc02020, 0, 0.4);
    P(0, 1.86, -0.12, 0.1, 0.12, 0.1, 0xa01818, 0, 0.6);
    L(-0.09, 1.46, 0.17, 0.06, 0.06, 0.02, 0xfff0a0);
    L(0.09, 1.46, 0.17, 0.06, 0.06, 0.02, 0xfff0a0);
    P(0, 1.36, 0.19, 0.14, 0.06, 0.06, 0x5a3020);
    P(0.2, 1.36, 0.32, 0.06, 0.06, 0.26, 0x4a2a18, 0, -0.2);
    L(0.3, 1.34, 0.44, 0.06, 0.06, 0.04, 0xff6a1a);
    L(0.34, 1.5, 0.5, 0.08, 0.14, 0.08, 0x5a4a4a);
    L(0.2, 1.62, 0.46, 0.1, 0.16, 0.1, 0x4a3a3a);
  } else if (kind === 'ff_curupira') {
    // CURUPIRA: pes virados para tras, cabelo de fogo, cajado e raizes
    P(-0.17, 0.5, 0, 0.14, 0.9, 0.14, 0x3a6a2a);
    P(0.17, 0.5, 0, 0.14, 0.9, 0.14, 0x3a6a2a);
    P(-0.17, 0.06, -0.14, 0.24, 0.12, 0.36, 0x2a4a1a);
    P(0.17, 0.06, -0.14, 0.24, 0.12, 0.36, 0x2a4a1a);
    P(0, 1.06, 0, 0.32, 0.52, 0.26, 0x4a7a32);
    P(-0.3, 0.94, 0.04, 0.12, 0.5, 0.12, 0x4a7a32, 0, 0.2);
    P(0.3, 0.94, 0.04, 0.12, 0.5, 0.12, 0x4a7a32, 0, -0.2);
    P(0, 1.46, 0, 0.3, 0.3, 0.28, 0xb07040);
    L(-0.08, 1.5, 0.15, 0.06, 0.05, 0.02, 0xffe060);
    L(0.08, 1.5, 0.15, 0.06, 0.05, 0.02, 0xffe060);
    P(0, 1.68, -0.02, 0.34, 0.3, 0.32, 0xc02a10);
    P(0, 1.86, -0.04, 0.18, 0.24, 0.18, 0xff5a20, 0, 0.2);
    P(-0.14, 1.82, 0.02, 0.1, 0.22, 0.1, 0xff7a20, 0, 0.5);
    P(0.14, 1.82, 0.02, 0.1, 0.22, 0.1, 0xff7a20, 0, -0.5);
    P(0, 1.94, -0.02, 0.1, 0.16, 0.1, 0xffb040);
    P(0.4, 0.9, 0.08, 0.06, 1.6, 0.06, 0x6a4a2a, 0, 0.06);
    L(0.4, 1.78, 0.08, 0.1, 0.16, 0.1, 0xff5a20);
    P(-0.3, 0.14, 0.2, 0.14, 0.12, 0.4, 0x2a4a1a, 0.3, 0.4);
    P(0.3, 0.14, 0.2, 0.14, 0.12, 0.4, 0x2a4a1a, 0.3, -0.4);
  } else if (kind === 'ff_pisadeira') {
    // PISADEIRA: corpo baixo sobre bracos longos, pes enormes
    P(0, 0.88, 0, 0.5, 0.36, 0.62, 0x3a3a2a, -0.1);
    P(-0.34, 0.6, 0.24, 0.14, 0.9, 0.14, 0x2a2a20);
    P(0.34, 0.6, 0.24, 0.14, 0.9, 0.14, 0x2a2a20);
    P(-0.34, 0.12, 0.32, 0.18, 0.12, 0.26, 0x1c1c14);
    P(0.34, 0.12, 0.32, 0.18, 0.12, 0.26, 0x1c1c14);
    P(-0.2, 0.12, 0.3, 0.26, 0.14, 0.78, 0x2a2a20);
    P(0.2, 0.12, 0.3, 0.26, 0.14, 0.78, 0x2a2a20);
    P(0, 0.7, 0.4, 0.3, 0.26, 0.24, 0x4a4a34, 0.3);
    L(-0.08, 0.72, 0.52, 0.06, 0.05, 0.02, 0xffa860);
    L(0.08, 0.72, 0.52, 0.06, 0.05, 0.02, 0xffa860);
    L(0, 0.62, 0.5, 0.2, 0.04, 0.04, 0xff7050);
    for (let i = 0; i < 3; i++) P(0, 1.06 - i * 0.02, 0.1 - i * 0.24, 0.1, 0.18, 0.1, 0x2a2a20);
    P(0, 0.6, -0.5, 0.14, 0.14, 0.3, 0x2a2a20, 0.4);
  } else if (kind === 'ff_iara') {
    // IARA: cauda de peixe, cabelo longo, escamas luminosas
    P(0, 0.5, -0.1, 0.34, 0.4, 0.34, 0x3a7a8a);
    P(0, 0.3, -0.42, 0.26, 0.24, 0.36, 0x2f6a7a);
    P(0, 0.16, -0.72, 0.4, 0.08, 0.3, 0x287080);
    P(0, 0.1, -0.6, 0.3, 0.06, 0.2, 0x3a8a9a);
    P(0, 0.94, 0, 0.3, 0.44, 0.26, 0x6aa0b0);
    L(0, 0.94, 0.14, 0.22, 0.3, 0.04, 0x8ae0f0);
    P(-0.3, 0.98, 0.06, 0.1, 0.42, 0.1, 0x6aa0b0, 0, 0.25);
    P(0.3, 0.98, 0.06, 0.1, 0.42, 0.1, 0x6aa0b0, 0, -0.25);
    P(0, 1.3, 0, 0.28, 0.3, 0.26, 0x9ac0c8);
    L(-0.07, 1.34, 0.14, 0.05, 0.05, 0.02, 0x9affff);
    L(0.07, 1.34, 0.14, 0.05, 0.05, 0.02, 0x9affff);
    P(0, 1.5, -0.06, 0.34, 0.26, 0.32, 0x1e3a4a);
    P(0, 1.36, -0.24, 0.3, 0.5, 0.16, 0x1e3a4a);
    P(-0.16, 1.1, -0.28, 0.12, 0.4, 0.12, 0x1e3a4a);
    P(0.16, 1.1, -0.28, 0.12, 0.4, 0.12, 0x1e3a4a);
    L(0, 1.72, -0.06, 0.12, 0.14, 0.12, 0x70d8ff);
    L(0.44, 0.9, 0.2, 0.06, 0.3, 0.06, 0x70c8ff);
  } else if (kind === 'ff_cuca') {
    // CUCA: focinho de jacare, corcunda com fungos, garras
    P(-0.24, 0.42, 0, 0.2, 0.72, 0.24, 0x2a3a22);
    P(0.24, 0.42, 0, 0.2, 0.72, 0.24, 0x2a3a22);
    P(0, 0.9, 0, 0.52, 0.52, 0.6, 0x2a3a22, -0.1);
    P(0, 1.3, 0.28, 0.34, 0.26, 0.3, 0x3a4a2a);
    P(0, 1.24, 0.58, 0.24, 0.16, 0.36, 0x2a3a1a);
    L(-0.08, 1.3, 0.76, 0.05, 0.04, 0.02, 0xffe040);
    L(0.08, 1.3, 0.76, 0.05, 0.04, 0.02, 0xffe040);
    P(0, 1.17, 0.7, 0.2, 0.04, 0.24, 0x8a2a2a);
    P(-0.36, 1.0, 0.16, 0.14, 0.5, 0.14, 0x2a3a22, 0, 0.25);
    P(0.36, 1.0, 0.16, 0.14, 0.5, 0.14, 0x2a3a22, 0, -0.25);
    P(-0.4, 0.7, 0.3, 0.16, 0.12, 0.24, 0x3a4a2a);
    P(0.4, 0.7, 0.3, 0.16, 0.12, 0.24, 0x3a4a2a);
    L(-0.44, 0.66, 0.44, 0.1, 0.06, 0.12, 0x9aff2a);
    L(0.44, 0.66, 0.44, 0.1, 0.06, 0.12, 0x9aff2a);
    P(-0.2, 1.14, -0.22, 0.14, 0.14, 0.14, 0x6a7a4a);
    P(0.18, 1.2, -0.26, 0.12, 0.12, 0.12, 0x6a7a4a);
    L(-0.2, 1.24, -0.22, 0.1, 0.06, 0.1, 0x9aff2a);
    L(0.18, 1.29, -0.26, 0.08, 0.05, 0.08, 0x9aff2a);
  } else if (kind === 'ff_mula') {
    // MULA SEM CABECA: equino de quatro patas, pescoco em chamas
    P(-0.24, 0.42, 0.4, 0.16, 0.84, 0.16, 0x2a1a16);
    P(0.24, 0.42, 0.4, 0.16, 0.84, 0.16, 0x2a1a16);
    P(-0.24, 0.42, -0.4, 0.16, 0.84, 0.16, 0x2a1a16);
    P(0.24, 0.42, -0.4, 0.16, 0.84, 0.16, 0x2a1a16);
    P(-0.24, 0.06, 0.42, 0.2, 0.12, 0.24, 0x1a100c);
    P(0.24, 0.06, 0.42, 0.2, 0.12, 0.24, 0x1a100c);
    P(-0.24, 0.06, -0.42, 0.2, 0.12, 0.24, 0x1a100c);
    P(0.24, 0.06, -0.42, 0.2, 0.12, 0.24, 0x1a100c);
    P(0, 0.9, 0, 0.46, 0.42, 0.94, 0x3a2218);
    P(0, 1.16, 0.52, 0.24, 0.5, 0.24, 0x3a2218, 0.5, 0);
    L(0, 1.46, 0.72, 0.3, 0.34, 0.3, 0xff4a10);
    L(0, 1.7, 0.78, 0.18, 0.3, 0.18, 0xff8a20);
    L(-0.1, 1.88, 0.76, 0.08, 0.2, 0.08, 0xffc040);
    L(0.1, 1.9, 0.8, 0.07, 0.18, 0.07, 0xffb030);
    L(0, 1.1, -0.56, 0.1, 0.5, 0.1, 0xff6a20, 0.6, 0);
    L(0, 1.0, -0.62, 0.18, 0.14, 0.18, 0xff8a20);
    P(0, 1.12, -0.02, 0.5, 0.1, 0.5, 0x8a2020);
    L(-0.3, 0.9, 0.2, 0.06, 0.16, 0.06, 0xff5a20);
    L(0.3, 0.9, 0.2, 0.06, 0.16, 0.06, 0xff5a20);
  } else if (kind === 'ff_lobisomem') {
    // LOBISOMEM: bipede lupino, focinho, orelhas, garras e cauda
    P(-0.2, 0.48, 0, 0.2, 0.5, 0.22, 0x4a4a34, -0.2);
    P(0.2, 0.48, 0, 0.2, 0.5, 0.22, 0x4a4a34, -0.2);
    P(-0.2, 0.2, 0.1, 0.16, 0.24, 0.16, 0x3a3a28);
    P(0.2, 0.2, 0.1, 0.16, 0.24, 0.16, 0x3a3a28);
    P(-0.2, 0.06, 0.2, 0.22, 0.12, 0.36, 0x2a2a1c);
    P(0.2, 0.06, 0.2, 0.22, 0.12, 0.36, 0x2a2a1c);
    P(0, 1.1, 0.1, 0.46, 0.56, 0.4, 0x4a4a34, -0.18);
    P(0, 1.42, 0.38, 0.34, 0.3, 0.36, 0x5a5a40);
    P(0, 1.36, 0.62, 0.2, 0.18, 0.26, 0x4a4a34);
    P(-0.12, 1.56, 0.34, 0.1, 0.16, 0.08, 0x3a3a28, 0, 0.2);
    P(0.12, 1.56, 0.34, 0.1, 0.16, 0.08, 0x3a3a28, 0, -0.2);
    L(-0.09, 1.46, 0.52, 0.06, 0.05, 0.02, 0xffcc00);
    L(0.09, 1.46, 0.52, 0.06, 0.05, 0.02, 0xffcc00);
    L(0, 1.28, 0.72, 0.14, 0.04, 0.04, 0x8a1a1a);
    P(-0.4, 1.06, 0.2, 0.14, 0.56, 0.14, 0x4a4a34, 0, 0.25);
    P(0.4, 1.06, 0.2, 0.14, 0.56, 0.14, 0x4a4a34, 0, -0.25);
    P(-0.46, 0.74, 0.34, 0.14, 0.14, 0.2, 0x5a5a40);
    P(0.46, 0.74, 0.34, 0.14, 0.14, 0.2, 0x5a5a40);
    L(-0.5, 0.7, 0.46, 0.1, 0.04, 0.1, 0xffcc00);
    L(0.5, 0.7, 0.46, 0.1, 0.04, 0.1, 0xffcc00);
    P(0, 0.9, -0.44, 0.16, 0.16, 0.4, 0x4a4a34, 0.5, 0);
    P(0, 0.72, -0.66, 0.12, 0.12, 0.2, 0x3a3a28, 0.8, 0);
  } else if (kind === 'ff_boto') {
    // BOTO: corpo de golfinho, barbatana dorsal, peitorais, jato de agua
    P(0, 0.55, 0, 0.34, 0.34, 0.9, 0x9a6a7a);
    P(0, 0.55, 0.56, 0.16, 0.14, 0.3, 0xc08a9a);
    P(0, 0.55, 0.72, 0.1, 0.08, 0.1, 0x8a5a6a);
    P(0, 0.9, -0.06, 0.1, 0.3, 0.34, 0x8a5a6a, 0.2, 0);
    P(-0.32, 0.5, 0.16, 0.32, 0.06, 0.24, 0x8a5a6a, 0, 0.3);
    P(0.32, 0.5, 0.16, 0.32, 0.06, 0.24, 0x8a5a6a, 0, -0.3);
    P(0, 0.5, -0.52, 0.44, 0.06, 0.22, 0x8a5a6a);
    P(0, 0.62, -0.44, 0.14, 0.2, 0.2, 0x9a6a7a);
    L(-0.11, 0.62, 0.4, 0.05, 0.05, 0.03, 0xfff0a0);
    L(0.11, 0.62, 0.4, 0.05, 0.05, 0.03, 0xfff0a0);
    L(0, 1.02, 0.1, 0.06, 0.2, 0.06, 0x70c8ff);
    L(0, 1.16, 0.12, 0.12, 0.1, 0.12, 0x9ae0ff);
    L(-0.2, 0.3, 0.2, 0.08, 0.02, 0.4, 0x70b880);
    L(0.22, 0.28, 0.1, 0.08, 0.02, 0.4, 0x70b880);
  } else if (kind === 'ff_caipora') {
    // CAIPORA: alta e esguia, chifres/gravetos, manto de folhas, lanca
    P(-0.16, 0.52, 0, 0.18, 1.0, 0.18, 0x3a4a2a);
    P(0.16, 0.52, 0, 0.18, 1.0, 0.18, 0x3a4a2a);
    P(-0.16, 0.06, 0.06, 0.24, 0.12, 0.34, 0x2a3a1e);
    P(0.16, 0.06, 0.06, 0.24, 0.12, 0.34, 0x2a3a1e);
    P(0, 1.18, 0, 0.42, 0.54, 0.3, 0x2a3a22);
    P(0, 1.0, -0.24, 0.5, 0.5, 0.16, 0x4a5a2a);
    L(-0.12, 1.1, 0.16, 0.14, 0.1, 0.03, 0x8aff5a);
    L(0.1, 0.98, 0.16, 0.12, 0.08, 0.03, 0x8aff5a);
    P(0, 1.56, 0, 0.3, 0.3, 0.28, 0x6a5636);
    P(0, 1.72, 0.02, 0.34, 0.14, 0.3, 0x4a3a22);
    P(-0.16, 1.7, 0, 0.08, 0.3, 0.08, 0x6a5a3a, 0, 0.4);
    P(0.16, 1.7, 0, 0.08, 0.3, 0.08, 0x6a5a3a, 0, -0.4);
    P(-0.24, 1.84, -0.02, 0.06, 0.18, 0.06, 0x6a5a3a, 0, 0.8);
    P(0.24, 1.84, -0.02, 0.06, 0.18, 0.06, 0x6a5a3a, 0, -0.8);
    L(-0.08, 1.56, 0.15, 0.05, 0.04, 0.02, 0xffe060);
    L(0.08, 1.56, 0.15, 0.05, 0.04, 0.02, 0xffe060);
    P(-0.34, 1.12, 0.06, 0.12, 0.5, 0.12, 0x2a3a22, 0, 0.2);
    P(0.34, 1.12, 0.06, 0.12, 0.5, 0.12, 0x2a3a22, 0, -0.2);
    P(0.4, 1.0, 0.12, 0.05, 1.8, 0.05, 0x7a5a3a, 0, 0.04);
    L(0.4, 1.94, 0.14, 0.1, 0.22, 0.1, 0xffd040);
    P(0, 0.9, -0.3, 0.3, 0.5, 0.16, 0x3a4a22);
  } else if (kind === 'ff_boitata') {
    // BOITATA: serpente em S, escamas incandescentes, sem pernas
    const seg = [[0.62, 0.28, -0.36, 0.34], [0.4, 0.3, -0.06, 0.32], [0.14, 0.34, 0.24, 0.3], [-0.2, 0.42, 0.44, 0.28], [-0.56, 0.56, 0.5, 0.26], [-0.86, 0.74, 0.4, 0.24]];
    for (const [sx, sy, sz, ss] of seg) {
      P(sx, sy, sz, ss, ss * 0.9, ss, 0x6a2a10);
      L(sx, sy + ss * 0.42, sz, ss * 0.5, 0.04, ss * 0.5, 0xff8a20);
    }
    P(-1.02, 0.94, 0.26, 0.4, 0.34, 0.42, 0xff9a3a);
    P(-1.18, 0.94, 0.42, 0.2, 0.18, 0.24, 0xb03a10);
    L(-1.12, 1.02, 0.34, 0.07, 0.06, 0.03, 0xfff0a0);
    L(-0.9, 1.02, 0.3, 0.07, 0.06, 0.03, 0xfff0a0);
    L(-1.05, 0.82, 0.46, 0.16, 0.04, 0.04, 0xff5a10);
    L(-0.6, 1.24, 0.5, 0.08, 0.22, 0.08, 0xffc040);
    L(-0.2, 1.1, 0.48, 0.08, 0.2, 0.08, 0xffb030);
    L(0.2, 1.02, 0.3, 0.07, 0.18, 0.07, 0xffc040);
    L(-0.6, 0.16, 0.5, 0.5, 0.04, 0.18, 0xff6a10);
    L(0.34, 0.12, 0.1, 0.4, 0.04, 0.16, 0xff6a10);
  }
}

// PILOTO DO REWORK — Zumbi (walker): postura curvada, cabeça projetada, mandíbula articulada,
// braços desiguais com cotovelo, joelhos, pés, costelas expostas. Mantém a paleta original.
function drawWalkerV2(B, G, base, z, col, t) {
  const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const SK = ZUMBI_SKIN, SKD = 0x5e7a4a, SH = ZUMBI_SHIRT, PA = 0x5f6b3a, BO = 0x3a3424, HA = ZUMBI_HAIR;
  const g = z.walk || 0;
  const s = Math.sin(g);
  const bob = Math.abs(s) * 0.035;
  const atk = z.attackT > 0 ? Math.min(1, z.attackT * 3) : 0;
  // pernas com joelho (arrasta a perna direita, manca)
  for (const [x, ph, drag] of [[0.13, 0, 0], [-0.13, Math.PI, 0.35]]) {
    const a = Math.sin(g + ph) * (0.6 - drag * 0.5);
    const hip = joint(base, x, 0.5 + bob, 0, a, 0, 0);
    P(hip, 0, -0.12, 0, 0.19, 0.26, 0.2, PA);
    const knee = joint(hip, 0, -0.24, 0, Math.max(0, -a) * 0.9 + 0.12 + drag * 0.2, 0, 0);
    P(knee, 0, -0.1, 0, 0.17, 0.22, 0.18, x > 0 ? PA : SKD);
    P(knee, 0, -0.23, 0.05, 0.2, 0.08, 0.3, BO);
    if (x < 0) P(knee, 0.03, -0.06, 0.09, 0.07, 0.07, 0.03, 0x8a1a1a);
  }
  // tronco curvado para frente
  const torso = joint(base, 0, 0.5 + bob, 0, 0.32 + atk * 0.15, 0, s * 0.06);
  P(torso, 0, 0.12, 0, 0.5, 0.26, 0.28, PA);
  P(torso, 0, 0.36, 0, 0.54, 0.3, 0.3, SH);
  P(torso, 0.1, 0.36, 0.151, 0.22, 0.22, 0.02, SK); // rasgo na camisa
  for (let i = 0; i < 3; i++) P(torso, 0.1, 0.3 + i * 0.06, 0.162, 0.18, 0.025, 0.02, 0xd8d0b0); // costelas
  P(torso, -0.14, 0.26, 0.152, 0.12, 0.1, 0.02, 0x7a1414); // sangue
  P(torso, -0.27, 0.4, -0.04, 0.08, 0.14, 0.26, SH, 0, 0.2); // trapo pendurado
  P(torso, 0, 0.03, 0, 0.52, 0.06, 0.3, 0x2a2418); // cinto
  // cabeça projetada, assimétrica
  const head = joint(torso, 0, 0.53, 0.1, -0.35 - atk * 0.2, 0, 0.18 + Math.sin(g * 0.5) * 0.08);
  P(head, 0, 0.17, 0.02, 0.46, 0.36, 0.44, SK);
  P(head, 0, 0.36, -0.02, 0.48, 0.06, 0.46, HA);
  P(head, 0.18, 0.3, -0.06, 0.12, 0.12, 0.34, HA);
  P(head, -0.06, 0.26, 0.21, 0.36, 0.06, 0.06, SKD); // sobrancelha pesada
  P(head, -0.11, 0.19, 0.225, 0.13, 0.1, 0.02, 0x1a1a10); // órbita
  P(head, 0.11, 0.18, 0.225, 0.1, 0.08, 0.02, 0x1a1a10);
  L(head, -0.11, 0.19, 0.235, 0.08, 0.06, 0.02, 0xb4ff3a);
  L(head, 0.11, 0.18, 0.235, 0.05, 0.05, 0.02, 0xb4ff3a);
  P(head, 0, 0.1, 0.24, 0.07, 0.07, 0.05, SKD); // nariz podre
  const jawA = 0.15 + atk * 0.55 + Math.max(0, Math.sin(t * 2.3)) * 0.12;
  const jaw = joint(head, 0, 0.02, 0.06, jawA, 0, 0);
  P(jaw, 0, -0.05, 0.08, 0.4, 0.1, 0.32, SK);
  P(jaw, 0, -0.02, 0.2, 0.3, 0.04, 0.06, 0x3a0a0a);
  for (const tx of [-0.1, -0.02, 0.07]) P(jaw, tx, 0.01, 0.22, 0.04, 0.05, 0.03, TEETH);
  for (const tx of [-0.08, 0.03, 0.11]) P(head, tx, 0.0, 0.22, 0.04, 0.05, 0.03, TEETH);
  // braços: esquerdo estendido (agarra), direito mais baixo e torto
  for (const [x, lift, bend] of [[0.33, 1.35, 0.25], [-0.33, 0.95, 0.75]]) {
    const sw = Math.sin(g * 0.5 + x * 4) * 0.12;
    const sh = joint(torso, x, 0.44, 0, -lift + sw - atk * 0.5, 0, x > 0 ? 0.12 : -0.18);
    P(sh, 0, -0.06, 0, 0.18, 0.16, 0.2, SH);
    P(sh, 0, -0.2, 0, 0.14, 0.24, 0.15, SK);
    const el = joint(sh, 0, -0.32, 0, -bend + atk * 0.3, 0, 0);
    P(el, 0, -0.12, 0, 0.13, 0.24, 0.14, x > 0 ? SK : SKD);
    P(el, 0, -0.27, 0.02, 0.15, 0.08, 0.16, SK);
    for (const fx of [-0.05, 0, 0.05]) P(el, fx, -0.34, 0.05, 0.035, 0.09, 0.035, 0xc8c0a0, 0.3);
  }
}

// ===== REWORK V2: esqueleto articulado comum (quadril/joelho, ombro/cotovelo, pescoço/mandíbula).
// Cada mob define proporções, postura, cores e peças próprias via `o` e o callback `o.extra(J, P, L)`.
function drawRigV2(B, G, base, z, col, t, o) {
  const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const g = (z.walk || 0) * (o.gait || 1);
  const s = Math.sin(g);
  const bob = Math.abs(s) * (o.bob ?? 0.035);
  const atk = z.attackT > 0 ? Math.min(1, z.attackT * 3) : 0;
  const cast = z.state === 'cast' || z.state === 'spit' ? 1 : 0;
  const lunge = z.state === 'lunge' || z.state === 'charge' || z.state === 'wind' ? 1 : 0;
  const slam = z.state === 'slam' ? Math.min(1, (0.75 - (z.stateT || 0)) / 0.45) : 0;
  const W = o.w || 1; // largura do corpo
  const legH = o.legH || 0.5; // altura do quadril
  const hipX = 0.13 * (o.hipW || W);
  const thigh = legH * 0.5, shin = legH * 0.46;
  const legs = o.noLegs ? [] : o.oneLeg ? [[0, 0]] : [[hipX, 0], [-hipX, Math.PI]];
  if (o.noLegs) for (let i = 0; i < 3; i++) { // cauda espectral no lugar das pernas
    const sw = Math.sin(t * 3 + i) * 0.08;
    P(base, sw * i, legH - 0.12 - i * 0.16, -i * 0.05, (0.5 - i * 0.13) * W, 0.18, (0.32 - i * 0.07) * W, i % 2 ? (o.tail2 || o.pants) : o.pants);
  }
  for (const [x, ph] of legs) {
    const a = o.oneLeg ? -Math.abs(Math.sin(g * 1.5)) * 0.4 : lunge ? (x > 0 ? -0.9 : 0.7) : Math.sin(g + ph) * (o.stride ?? 0.6);
    const hip = joint(base, x, legH + bob, 0, a, 0, 0);
    P(hip, 0, -thigh / 2, 0, 0.2 * (o.legW || W), thigh + 0.04, 0.21 * (o.legW || W), o.pants);
    const knee = joint(hip, 0, -thigh, 0, Math.max(0, -a) * 0.9 + (o.knee ?? 0.1), 0, 0);
    P(knee, 0, -shin / 2, 0, 0.18 * (o.legW || W), shin, 0.19 * (o.legW || W), o.shin || o.pants);
    P(knee, 0, -shin - 0.01, 0.05, 0.21 * (o.legW || W), 0.08, 0.3 * (o.footL || 1), o.boots);
  }
  const torso = joint(base, 0, legH + bob, 0, (o.hunch ?? 0.2) + atk * 0.15 + lunge * 0.35, 0, s * 0.05);
  const tH = o.torsoH || 0.56;
  P(torso, 0, tH * 0.22, 0, 0.5 * W, tH * 0.46, 0.3 * (o.depth || W), o.belly || o.pants);
  P(torso, 0, tH * 0.68, 0, 0.56 * W * (o.chest || 1), tH * 0.54, 0.32 * (o.depth || W), o.shirt);
  const neckY = tH + 0.02;
  const hs = o.head || 1;
  const head = joint(torso, 0, neckY, 0.06 * (o.headFwd ?? 1), -(o.headDown ?? 0.25) - atk * 0.15, 0, (o.headTilt ?? 0.1) + Math.sin(g * 0.5) * 0.06);
  P(head, 0, 0.17 * hs, 0.02, 0.44 * hs * (o.headW || 1), 0.34 * hs, 0.42 * hs, o.skin);
  const fz = 0.21 * hs + 0.02;
  if (!o.noFace) {
    P(head, 0, 0.27 * hs, fz - 0.01, 0.4 * hs, 0.06, 0.04, o.brow || o.skin, 0.1);
    for (const sg of [-1, 1]) {
      P(head, sg * 0.1 * hs, 0.19 * hs, fz, 0.12 * hs, 0.09 * hs, 0.02, 0x14140e);
      L(head, sg * 0.1 * hs, 0.19 * hs, fz + 0.01, 0.07 * hs, 0.05 * hs, 0.02, o.eye || 0xb4ff3a);
    }
  }
  const jawA = (o.jaw ?? 0.15) + atk * 0.5 + cast * 0.4 + Math.max(0, Math.sin(t * 2.1)) * 0.1;
  const jaw = joint(head, 0, 0.03 * hs, 0.05, jawA, 0, 0);
  P(jaw, 0, -0.05 * hs, 0.08, 0.38 * hs * (o.headW || 1), 0.1 * hs, 0.3 * hs, o.jawC || o.skin);
  P(jaw, 0, -0.02, 0.19 * hs + 0.02, 0.28 * hs, 0.04, 0.05, 0x3a0a0a);
  if (!o.noTeeth) for (const tx of [-0.09, 0, 0.09]) {
    P(jaw, tx * hs, 0.01, 0.21 * hs + 0.02, 0.04, 0.05, 0.03, TEETH);
    P(head, tx * hs + 0.03, 0.0, 0.21 * hs + 0.02, 0.04, 0.05, 0.03, TEETH);
  }
  const shY = tH * 0.86;
  const armW = o.armW || 1;
  const arms = [];
  for (const sg of [1, -1]) {
    let lift, bend, spread = sg * 0.12;
    const sw = Math.sin(g + (sg > 0 ? Math.PI : 0));
    if (slam > 0) { lift = 2.9 * slam; bend = 0.3; spread = sg * 0.1; }
    else if (o.arms === 'run') { lift = 0.3 + sw * 0.9 + atk * 1.0; bend = 1.0; }
    else if (o.arms === 'brawl') { lift = 0.3 + sw * 0.3 + atk * (sg > 0 ? 1.4 : 0.6); bend = 0.5; spread = sg * 0.3; }
    else if (o.arms === 'cast') { lift = sg > 0 ? 0.6 + cast * 1.6 + atk : 1.2 + cast * 1.2; bend = sg > 0 ? 0.4 : 0.9; spread = sg * 0.2; }
    else if (o.arms === 'shield') { lift = sg > 0 ? 1.25 : 0.4 + sw * 0.3 + atk * 1.2; bend = sg > 0 ? 1.1 : 0.4; spread = sg > 0 ? -0.2 : -0.1; }
    else if (o.arms === 'blades') { lift = 0.9 + atk * 1.3 + lunge * 0.8 + sw * 0.15; bend = 0.9 - atk * 0.6; spread = sg * 0.35; }
    else { lift = (sg > 0 ? 1.35 : 0.95) + Math.sin(g * 0.5 + sg) * 0.12 + atk * 0.5; bend = sg > 0 ? 0.25 : 0.7; }
    const sh = joint(torso, sg * (0.31 * W * (o.chest || 1) + 0.02), shY, 0, -lift, 0, spread);
    P(sh, 0, -0.06, 0, 0.2 * armW, 0.16, 0.21 * armW, o.sleeve || o.shirt);
    P(sh, 0, -0.2, 0, 0.15 * armW, 0.26, 0.16 * armW, o.arm || o.skin);
    const el = joint(sh, 0, -0.33, 0, -bend, 0, 0);
    P(el, 0, -0.12, 0, 0.14 * armW, 0.24, 0.15 * armW, o.arm || o.skin);
    P(el, 0, -0.27, 0.02, 0.17 * armW * (o.hand || 1), 0.1 * (o.hand || 1), 0.17 * armW * (o.hand || 1), o.hands || o.arm || o.skin);
    if (!o.noClaws) for (const fx of [-0.05, 0, 0.05]) P(el, fx * armW, -0.35 * (o.hand || 1), 0.05, 0.035, 0.09, 0.035, o.claw || 0xc8c0a0, 0.3);
    arms.push({ sh, el, sg });
  }
  if (o.extra) o.extra({ torso, head, jaw, arms, tH, hs, W, atk, cast, lunge, t, g, z }, P, L);
}

const V2 = {
  brute: (B, G, b, z, col, t) => drawRigV2(B, G, b, z, col, t, {
    skin: PALE, shirt: PALE, pants: 0x5a4232, boots: 0x332620, hands: 0xa82020, eye: 0xff3a2a,
    w: 1.35, chest: 1.25, depth: 1.2, legW: 1.25, legH: 0.42, torsoH: 0.66, head: 0.8, headFwd: 1.6, headDown: 0.1, hunch: 0.35,
    arms: 'brawl', armW: 1.55, hand: 1.6, stride: 0.45, gait: 0.8, jaw: 0.25,
    extra: (J, P) => {
      P(J.torso, 0, J.tH * 0.7, 0.17, 0.5, 0.3, 0.04, 0xc8c0b0); // peitoral
      for (const [x, y] of [[-0.2, 0.5], [0.15, 0.35], [0.05, 0.62]]) P(J.torso, x, y, 0.18, 0.12, 0.04, 0.02, 0x8a1a1a); // cicatrizes
      P(J.torso, 0, J.tH * 0.98, -0.1, 0.5, 0.18, 0.28, 0xb8b0a0); // corcova
      for (const a of J.arms) { P(a.el, 0, -0.27, 0.02, 0.3, 0.06, 0.3, 0x6a5040); P(a.sh, 0, -0.02, 0, 0.28, 0.1, 0.28, 0x6a5040); }
    },
  }),
  runner: (B, G, b, z, col, t) => drawRigV2(B, G, b, z, col, t, {
    skin: 0xc9c1b1, shirt: 0xdcd6c6, pants: 0x3c3c3c, boots: 0x2c2a28, eye: 0xff4a2a,
    w: 0.82, legH: 0.58, torsoH: 0.5, head: 0.92, hunch: 0.55, headDown: -0.1, headFwd: 1.4, arms: 'run', armW: 0.8, stride: 0.95, gait: 1.2, jaw: 0.35, bob: 0.06,
    extra: (J, P) => {
      for (let i = 0; i < 4; i++) P(J.torso, 0, 0.12 + i * 0.09, -0.17, 0.06, 0.05, 0.04, 0xa8a090); // coluna saltada
      P(J.torso, 0.14, J.tH * 0.6, 0.165, 0.14, 0.18, 0.02, 0x7a1414);
      P(J.head, 0, 0.36, -0.04, 0.3, 0.05, 0.3, 0x3a3028); // careca com tufos
      P(J.head, -0.12, 0.38, 0.06, 0.08, 0.08, 0.08, 0x3a3028);
    },
  }),
  spitter: (B, G, b, z, col, t) => drawRigV2(B, G, b, z, col, t, {
    skin: 0x7e9a48, shirt: 0x7e9a48, pants: 0x5a4a34, boots: 0x3a3022, eye: 0xf0ff40, jawC: 0x6a8a38,
    w: 1.0, chest: 0.85, legH: 0.52, head: 1.05, headW: 0.9, hunch: 0.15, headDown: -0.2, jaw: 0.4, arms: 'reach', noTeeth: true,
    extra: (J, P, L) => {
      P(J.torso, 0, J.tH * 0.95, 0.06, 0.32, 0.26, 0.32, 0x9aba58); // papo de ácido
      L(J.torso, 0, J.tH * 0.95, 0.23, 0.2, 0.14, 0.02, 0xb6ff3a);
      for (const [x, y] of [[-0.18, 0.3], [0.2, 0.45], [-0.1, 0.55]]) L(J.torso, x, y, 0.17, 0.08, 0.08, 0.02, 0xa8ff30); // pústulas
      L(J.jaw, 0, -0.1, 0.2, 0.08, 0.14 + J.cast * 0.1, 0.06, 0xb6ff3a); // baba
      P(J.head, 0, 0.36, 0, 0.12, 0.1, 0.3, 0x5a7a30); // crista
    },
  }),
  bloater: (B, G, b, z, col, t) => drawRigV2(B, G, b, z, col, t, {
    skin: PALE, shirt: 0xb8b0a0, belly: 0xd8c8b0, pants: 0x4a3a2c, boots: 0x2c241c, eye: 0xffd040,
    w: 1.55, chest: 1.1, depth: 1.7, legW: 1.1, legH: 0.4, torsoH: 0.62, head: 0.72, headFwd: 0.6, headDown: 0.0, hunch: -0.08, arms: 'reach', armW: 0.85, stride: 0.4, gait: 0.75, bob: 0.05,
    extra: (J, P, L) => {
      const pulse = 1 + Math.sin(J.t * 6) * 0.06;
      P(J.torso, 0, 0.24, 0.12, 0.66 * pulse, 0.44 * pulse, 0.5 * pulse, 0xd8c0a0); // barriga inchada
      for (const [x, y, zz] of [[-0.22, 0.32, 0.38], [0.2, 0.16, 0.38], [0.05, 0.42, 0.38], [0.3, 0.38, 0.2]]) L(J.torso, x, y, zz, 0.1, 0.1, 0.04, 0xffb020); // bolhas incandescentes
      for (let i = 0; i < 3; i++) P(J.torso, -0.1 + i * 0.1, 0.2 + i * 0.08, 0.385, 0.03, 0.2, 0.02, 0x8a3a20, 0, 0.4 * (i - 1)); // veias
      P(J.torso, 0.2, 0.46, -0.3, 0.12, 0.12, 0.12, 0x5a5a50); // fusível
      if (Math.sin(J.t * 22) > 0) L(J.torso, 0.2, 0.58, -0.3, 0.1, 0.1, 0.1, 0xffe060);
    },
  }),
  armored: (B, G, b, z, col, t) => drawRigV2(B, G, b, z, col, t, {
    skin: 0x8a8a80, shirt: ARMOR, sleeve: ARMOR, hands: ARMOR_D, arm: ARMOR_D, pants: 0x2e3034, shin: ARMOR, boots: 0x1c1d20, eye: 0xff3a2a,
    w: 1.15, chest: 1.1, depth: 1.15, legW: 1.15, legH: 0.48, torsoH: 0.6, head: 0.9, hunch: 0.12, headDown: 0.05, arms: 'shield', armW: 1.2, noClaws: true, gait: 0.85, stride: 0.45,
    extra: (J, P, L) => {
      P(J.head, 0, 0.24, 0.02, 0.5, 0.2, 0.48, ARMOR); // capacete
      P(J.head, 0, 0.19, 0.24, 0.42, 0.05, 0.03, 0x1a1a1a); // fenda do visor
      L(J.head, 0, 0.19, 0.255, 0.3, 0.025, 0.02, 0xff3a2a);
      P(J.torso, 0, J.tH * 0.68, 0.17, 0.5, 0.42, 0.05, ARMOR_D); // peitoral
      for (const sg of [-1, 1]) P(J.torso, sg * 0.36, J.tH * 0.92, 0, 0.26, 0.12, 0.38, ARMOR, 0, sg * -0.3); // ombreiras
      const sh = J.arms[0].el; // escudo no braço esquerdo
      P(sh, 0.05, -0.2, -0.16, 0.66, 0.86, 0.08, ARMOR);
      P(sh, 0.05, -0.2, -0.205, 0.5, 0.7, 0.02, ARMOR_D);
      L(sh, 0.05, -0.08, -0.22, 0.12, 0.12, 0.02, 0xffc107);
    },
  }),
  summoner: (B, G, b, z, col, t) => drawRigV2(B, G, b, z, col, t, {
    skin: 0x24182c, shirt: ROBE, sleeve: ROBE, hands: 0x9a8aa8, arm: ROBE_D, pants: ROBE, shin: ROBE_D, boots: 0x1e1424, eye: 0xd060ff, brow: 0x1a1020,
    w: 0.95, legH: 0.52, torsoH: 0.62, head: 0.95, headW: 0.85, hunch: 0.1, arms: 'cast', stride: 0.35, gait: 0.8, noTeeth: true, jaw: 0.05, hand: 0.8,
    extra: (J, P, L) => {
      P(J.head, 0, 0.3, -0.04, 0.54, 0.4, 0.52, ROBE); // capuz
      P(J.head, 0, 0.46, -0.16, 0.3, 0.2, 0.3, ROBE_D, -0.4);
      P(J.torso, 0, -0.12, 0, 0.64, 0.4, 0.42, ROBE); // saia do manto
      P(J.torso, 0, J.tH * 0.6, 0.165, 0.08, 0.5, 0.02, 0xb070e0); // faixa rúnica
      const staff = J.arms[1].el; // cajado
      P(staff, 0, -0.1, 0.12, 0.06, 1.3, 0.06, 0x3a2a1a);
      P(staff, 0, 0.58, 0.12, 0.14, 0.14, 0.14, 0x2a1a2a);
      L(staff, 0, 0.58, 0.12, 0.1 + J.cast * 0.08, 0.1 + J.cast * 0.08, 0.1 + J.cast * 0.08, 0xd060ff);
      if (J.cast) L(J.arms[0].el, 0, -0.34, 0.06, 0.16, 0.16, 0.16, 0xb040ff);
    },
  }),
  reaper: (B, G, b, z, col, t) => drawRigV2(B, G, b, z, col, t, {
    skin: 0xb8b0a0, shirt: 0x2e2438, pants: 0x241c2e, boots: 0x140f18, hands: 0x9a9284, arm: 0x9a9284, eye: 0xff2a50,
    w: 0.85, legH: 0.6, torsoH: 0.56, head: 0.85, headW: 0.8, hunch: 0.4, headDown: -0.05, arms: 'blades', armW: 0.8, stride: 0.8, gait: 1.1, noClaws: true, jaw: 0.3, knee: 0.35,
    extra: (J, P, L) => {
      P(J.head, 0, 0.12, 0.02, 0.36, 0.26, 0.36, 0xd8d0c0); // crânio exposto
      for (const sg of [-1, 1]) P(J.head, sg * 0.18, 0.34, -0.06, 0.06, 0.24, 0.06, 0x2e2438, -0.5, sg * -0.4); // chifres
      P(J.torso, 0, J.tH * 0.9, -0.16, 0.58, 0.3, 0.12, 0x2e2438, 0.4); // capa
      P(J.torso, 0, J.tH * 0.4, -0.2, 0.5, 0.5, 0.06, 0x241c2e, 0.2);
      for (const a of J.arms) { // lâminas curvas
        P(a.el, 0, -0.5, 0.12, 0.05, 0.42, 0.1, 0xc8ccd4, 0.6);
        P(a.el, 0, -0.66, 0.3, 0.04, 0.2, 0.08, 0xe0e4ec, 1.2);
        L(a.el, 0, -0.45, 0.16, 0.02, 0.3, 0.02, 0xff2a50);
      }
    },
  }),
};

// ===== REWORK V2 — lote 2: Templo, Coliseu e chefões que usavam o corpo genérico
const R2 = (o) => (B, G, b, z, col, t) => drawRigV2(B, G, b, z, col, t, o);
const bowOn = (a, P, L, wood, glow) => { // arco no antebraço
  P(a.el, 0, -0.3, 0.12, 0.05, 0.9, 0.06, wood, 0.0);
  P(a.el, 0, 0.12, 0.2, 0.05, 0.2, 0.05, wood, -0.6);
  P(a.el, 0, -0.72, 0.2, 0.05, 0.2, 0.05, wood, 0.6);
  L(a.el, 0, -0.3, 0.02, 0.015, 0.84, 0.015, glow);
};
Object.assign(V2, {
  // --- TEMPLO ---
  mummy: R2({
    skin: BANDAGE, shirt: BANDAGE, pants: BANDAGE, boots: 0x8a7a5a, hands: BANDAGE_D, eye: 0x40e0ff, brow: BANDAGE_D,
    w: 0.95, legH: 0.5, hunch: 0.25, headDown: 0.2, stride: 0.4, gait: 0.75, jaw: 0.05, noTeeth: true, arms: 'reach', knee: 0.2,
    extra: (J, P, L) => {
      for (let i = 0; i < 5; i++) P(J.torso, 0, 0.08 + i * 0.12, 0.165, 0.54, 0.035, 0.02, BANDAGE_D, 0, (i % 2 ? 0.08 : -0.08)); // faixas
      for (let i = 0; i < 3; i++) P(J.head, 0, 0.08 + i * 0.1, 0.235, 0.46, 0.03, 0.02, BANDAGE_D, 0, (i - 1) * 0.12);
      for (const a of J.arms) P(a.el, 0.06, -0.3, -0.06, 0.04, 0.34, 0.08, BANDAGE, 0.3); // faixa solta pendurada
      P(J.torso, 0.22, -0.02, 0.1, 0.06, 0.4, 0.06, BANDAGE, 0.2, 0.2);
      L(J.torso, -0.12, J.tH * 0.6, 0.17, 0.14, 0.14, 0.02, 0x40e0ff); // escaravelho no peito
      P(J.torso, -0.12, J.tH * 0.6, 0.168, 0.2, 0.2, 0.02, GOLD);
    },
  }),
  anubis: R2({
    skin: JACKAL, shirt: IMPERIAL, pants: GOLD, boots: GOLD, hands: JACKAL, eye: 0xffd040, brow: 0x1a1410,
    w: 1.25, chest: 1.25, legH: 0.56, torsoH: 0.66, head: 0.95, headW: 0.8, hunch: 0.05, headDown: -0.05, arms: 'shield', armW: 1.15, noClaws: true, jaw: 0.1, stride: 0.5,
    extra: (J, P, L) => {
      P(J.head, 0, 0.12, 0.32, 0.18, 0.14, 0.3, JACKAL); // focinho
      P(J.head, 0, 0.13, 0.48, 0.08, 0.06, 0.04, 0x0a0a0a);
      for (const sg of [-1, 1]) { P(J.head, sg * 0.14, 0.48, -0.04, 0.09, 0.34, 0.12, JACKAL, -0.1, sg * -0.12); P(J.head, sg * 0.14, 0.48, 0.02, 0.04, 0.24, 0.02, GOLD, -0.1, sg * -0.12); }
      P(J.torso, 0, J.tH * 0.9, 0.04, 0.8, 0.16, 0.44, GOLD); // colar usekh
      P(J.torso, 0, J.tH * 0.8, 0.17, 0.6, 0.1, 0.04, 0x2a6aa8);
      P(J.torso, 0, -0.06, 0.1, 0.36, 0.34, 0.05, GOLD); // saiote
      const sh = J.arms[0].el;
      P(sh, 0.05, -0.2, -0.16, 0.7, 0.9, 0.08, GOLD);
      P(sh, 0.05, -0.2, -0.205, 0.5, 0.7, 0.02, IMPERIAL);
      L(sh, 0.05, -0.12, -0.22, 0.16, 0.1, 0.02, 0x40e0ff); // olho de Hórus
      P(J.arms[1].el, 0, -0.1, 0.14, 0.07, 1.1, 0.07, GOLD); // lança
      P(J.arms[1].el, 0, 0.5, 0.14, 0.14, 0.2, 0.04, 0xd8dce4);
    },
  }),
  archer: R2({
    skin: BANDAGE, shirt: 0xc8b890, pants: 0xc8b890, boots: 0x7a5a32, hands: BANDAGE_D, eye: 0x8aff40, brow: BANDAGE_D,
    w: 0.85, legH: 0.56, torsoH: 0.52, head: 0.92, hunch: 0.12, arms: 'reach', armW: 0.85, noTeeth: true, jaw: 0.05, stride: 0.55,
    extra: (J, P, L) => {
      P(J.head, 0, 0.3, -0.02, 0.5, 0.22, 0.5, 0xc8b890); // lenço do deserto
      P(J.head, 0, 0.18, -0.26, 0.4, 0.4, 0.1, 0xb0a078, 0.2);
      P(J.head, 0, 0.08, 0.235, 0.44, 0.12, 0.03, 0xb0a078); // máscara
      P(J.torso, 0.1, J.tH * 0.55, -0.2, 0.18, 0.5, 0.18, 0x7a5a32, 0, 0.3); // aljava
      for (const dx of [-0.04, 0.03, 0.09]) L(J.torso, 0.1 + dx, J.tH * 0.55 + 0.3, -0.2, 0.03, 0.14, 0.03, 0x8aff40);
      bowOn(J.arms[0], P, L, 0x6a4a28, 0xeae0c0);
    },
  }),
  priest: R2({
    skin: BANDAGE_D, shirt: 0x5a2a8a, sleeve: 0x5a2a8a, arm: 0x4a2272, pants: 0x4a2272, shin: 0x3a1a5e, boots: 0x2a1640, hands: BANDAGE_D, eye: 0xd060ff,
    w: 0.95, legH: 0.52, torsoH: 0.62, head: 0.9, headW: 0.85, hunch: 0.15, arms: 'cast', stride: 0.3, gait: 0.75, noTeeth: true, jaw: 0.05, hand: 0.8,
    extra: (J, P, L) => {
      P(J.head, 0, 0.42, -0.02, 0.36, 0.34, 0.36, GOLD); // coroa alta (hedjet)
      P(J.head, 0, 0.62, -0.02, 0.22, 0.2, 0.22, GOLD);
      L(J.head, 0, 0.42, 0.18, 0.08, 0.08, 0.02, 0xd060ff);
      P(J.torso, 0, -0.12, 0, 0.66, 0.42, 0.44, 0x5a2a8a); // túnica longa
      P(J.torso, 0, J.tH * 0.9, 0.04, 0.72, 0.12, 0.42, GOLD); // colar
      const st = J.arms[1].el; // cetro ankh
      P(st, 0, -0.1, 0.12, 0.06, 1.2, 0.06, GOLD);
      P(st, 0, 0.6, 0.12, 0.2, 0.05, 0.05, GOLD);
      P(st, 0, 0.7, 0.12, 0.05, 0.2, 0.05, GOLD);
      L(st, 0, 0.72, 0.12, 0.08 + J.cast * 0.08, 0.08 + J.cast * 0.08, 0.08 + J.cast * 0.08, 0xd060ff);
    },
  }),
  construct: R2({
    skin: 0xd8a848, shirt: 0xc89838, arm: 0xd8a848, pants: 0xb8883a, boots: 0x8a6a30, hands: 0xb88a38, eye: 0x40e0ff, noFace: false,
    w: 1.5, chest: 1.35, depth: 1.3, legW: 1.4, legH: 0.42, torsoH: 0.7, head: 0.7, headW: 1.1, headFwd: 1.4, headDown: 0.05, hunch: 0.3, arms: 'brawl', armW: 1.7, hand: 1.7, noClaws: true, noTeeth: true, jaw: 0.0, stride: 0.35, gait: 0.65,
    extra: (J, P, L) => {
      for (const [x, y] of [[-0.25, 0.2], [0.2, 0.45], [-0.05, 0.62], [0.3, 0.15]]) P(J.torso, x, y, 0.2, 0.18, 0.14, 0.06, 0xb88a38); // blocos soltos
      L(J.torso, 0, J.tH * 0.6, 0.21, 0.18, 0.18, 0.02, 0x40e0ff); // núcleo
      for (const a of J.arms) { P(a.sh, 0, 0.04, 0, 0.34, 0.2, 0.34, 0xa87a30); L(a.el, 0, -0.18, 0.13, 0.03, 0.2, 0.02, 0x40e0ff); }
      for (let i = 0; i < 3; i++) P(J.torso, -0.3 + i * 0.3, -0.04 - ((J.t * 0.6 + i * 0.33) % 1) * 0.3, 0.1, 0.06, 0.06, 0.06, 0xe8c070); // areia caindo
    },
  }),
  skeleton: R2({
    skin: BONE, shirt: BONE_D, pants: BONE_D, boots: BONE_D, hands: BONE, arm: BONE, eye: 0xffc040,
    w: 0.75, chest: 0.95, legW: 0.6, legH: 0.56, torsoH: 0.54, head: 0.95, hunch: 0.25, arms: 'brawl', armW: 0.6, stride: 0.8, gait: 1.2, jaw: 0.3, bob: 0.05,
    extra: (J, P, L) => {
      for (let i = 0; i < 4; i++) P(J.torso, 0, J.tH * 0.45 + i * 0.07, 0.15, 0.5, 0.03, 0.04, BONE); // costelas
      P(J.torso, 0, J.tH * 0.5, 0, 0.06, 0.5, 0.06, BONE); // coluna
      P(J.head, 0, 0.4, -0.02, 0.5, 0.12, 0.48, 0x2a5aa8); // nemes azul e ouro
      for (const sg of [-1, 1]) P(J.head, sg * 0.24, 0.12, -0.02, 0.06, 0.4, 0.3, 0x2a5aa8);
      P(J.head, 0, 0.46, 0.2, 0.08, 0.1, 0.04, GOLD);
      for (const a of J.arms) P(a.el, 0, -0.42, 0.06, 0.04, 0.36, 0.08, 0xd8dce4, 0.4); // khopesh
    },
  }),
  // --- COLISEU ---
  rm_legion: R2({
    skin: RM_SKIN, shirt: RM_STEEL, sleeve: RM_RED, pants: RM_SKIN, boots: RM_LEATHER, hands: RM_SKIN_D, eye: 0xff4a2a,
    w: 1.0, legH: 0.5, hunch: 0.15, arms: 'shield', noClaws: true, stride: 0.5,
    extra: (J, P, L) => {
      P(J.head, 0, 0.32, -0.01, 0.5, 0.18, 0.48, RM_STEEL); // galea
      for (const sg of [-1, 1]) P(J.head, sg * 0.24, 0.14, 0.06, 0.04, 0.22, 0.2, RM_STEEL);
      P(J.head, 0, 0.46, 0, 0.08, 0.1, 0.4, RM_RED);
      for (let i = 0; i < 3; i++) P(J.torso, 0, J.tH * 0.48 + i * 0.1, 0.165, 0.56, 0.05, 0.03, 0x8a909a); // lorica
      P(J.torso, 0, -0.06, 0.02, 0.54, 0.16, 0.34, RM_RED); // saiote
      const sh = J.arms[0].el; // scutum
      P(sh, 0.05, -0.2, -0.16, 0.62, 0.96, 0.1, RM_RED);
      P(sh, 0.05, -0.2, -0.215, 0.16, 0.16, 0.03, GOLD);
      P(sh, 0.05, -0.2, -0.212, 0.04, 0.9, 0.02, GOLD);
      P(J.arms[1].el, 0, -0.38, 0.12, 0.05, 0.4, 0.06, 0xd8dce4, 1.2); // gládio
    },
  }),
  rm_centurion: R2({
    skin: RM_SKIN, shirt: GOLD, sleeve: RM_RED, pants: RM_SKIN, boots: GOLD, hands: RM_SKIN_D, eye: 0xff4a2a,
    w: 1.15, chest: 1.15, legH: 0.52, torsoH: 0.62, hunch: 0.05, headDown: -0.05, arms: 'brawl', armW: 1.1, noClaws: true, stride: 0.5,
    extra: (J, P, L) => {
      P(J.head, 0, 0.32, -0.01, 0.5, 0.18, 0.48, GOLD);
      P(J.head, 0, 0.5, 0, 0.62, 0.16, 0.12, RM_RED); // crista transversal de centurião
      P(J.torso, 0, J.tH * 0.7, 0.17, 0.5, 0.4, 0.04, 0xd8a838); // peitoral musculado
      for (const sg of [-1, 1]) L(J.torso, sg * 0.12, J.tH * 0.72, 0.195, 0.1, 0.1, 0.02, 0xffe080); // medalhas
      P(J.torso, 0, J.tH * 0.85, -0.2, 0.6, 0.2, 0.06, RM_RED); // capa
      P(J.torso, 0, J.tH * 0.3, -0.24, 0.66, 0.6, 0.05, RM_RED, 0.15);
      P(J.arms[1].el, 0, -0.48, 0.1, 0.05, 0.5, 0.07, 0xd8dce4, 1.2); // espada longa
      P(J.arms[0].el, 0, -0.1, 0.1, 0.05, 0.6, 0.05, 0x6a4a28); // vara de vinha
    },
  }),
  rm_archer: R2({
    skin: RM_SKIN, shirt: RM_RED, pants: RM_SKIN, boots: RM_LEATHER, hands: RM_SKIN_D, eye: 0xff4a2a,
    w: 0.85, legH: 0.56, torsoH: 0.52, head: 0.92, hunch: 0.1, arms: 'reach', armW: 0.85, stride: 0.55,
    extra: (J, P, L) => {
      P(J.head, 0, 0.3, -0.01, 0.48, 0.14, 0.46, RM_LEATHER); // gorro de couro
      P(J.torso, 0, J.tH * 0.7, 0.165, 0.56, 0.08, 0.03, RM_LEATHER, 0, 0.6); // bandoleira
      P(J.torso, -0.12, J.tH * 0.55, -0.2, 0.18, 0.5, 0.18, RM_LEATHER, 0, -0.3);
      for (const dx of [-0.04, 0.03]) P(J.torso, -0.12 + dx, J.tH * 0.55 + 0.3, -0.2, 0.03, 0.14, 0.03, 0xe0e0e0);
      bowOn(J.arms[0], P, L, 0x5a3a20, 0xeae0c0);
    },
  }),
  rm_gladiator: R2({
    skin: RM_SKIN, shirt: RM_SKIN, pants: RM_LEATHER, boots: RM_LEATHER, hands: RM_LEATHER, arm: RM_SKIN, eye: 0xff2a2a,
    w: 1.15, chest: 1.25, legH: 0.5, torsoH: 0.6, head: 0.9, hunch: 0.32, headFwd: 1.3, arms: 'brawl', armW: 1.25, noClaws: true, stride: 0.7, gait: 1.05,
    extra: (J, P, L) => {
      P(J.head, 0, 0.2, 0.02, 0.5, 0.42, 0.5, RM_STEEL); // elmo fechado de mirmilão
      for (let i = 0; i < 4; i++) P(J.head, -0.12 + i * 0.08, 0.2, 0.255, 0.02, 0.2, 0.02, 0x1a1a1a); // grade
      P(J.head, 0, 0.48, -0.02, 0.06, 0.18, 0.5, RM_STEEL); // crista de peixe
      P(J.torso, 0, J.tH * 0.62, 0.17, 0.5, 0.02, 0.03, 0x8a1a1a, 0, 0.6); // cicatriz
      P(J.torso, 0, -0.04, 0.02, 0.56, 0.2, 0.34, RM_LEATHER); // subligaculum
      P(J.torso, 0, 0.06, 0.18, 0.16, 0.08, 0.03, GOLD);
      P(J.arms[1].sh, 0, -0.1, 0, 0.26, 0.4, 0.26, RM_STEEL); // manica
      P(J.arms[1].el, 0, -0.42, 0.1, 0.06, 0.44, 0.07, 0xd8dce4, 1.2); // gládio
      P(J.arms[0].el, 0, -0.26, -0.12, 0.36, 0.36, 0.06, RM_STEEL); // escudo redondo pequeno
    },
  }),
  rm_praetor: R2({
    skin: 0x7a5a9a, shirt: 0x5a2a8a, sleeve: 0x4a2272, arm: 0x4a2272, pants: 0x3a1a5e, boots: 0x2a1640, hands: 0x6a4a8a, eye: 0xd060ff,
    w: 1.0, legH: 0.52, torsoH: 0.64, head: 0.92, hunch: 0.05, headDown: -0.05, arms: 'cast', stride: 0.3, gait: 0.75, noTeeth: true, jaw: 0.05, hand: 0.8,
    extra: (J, P, L) => {
      for (let i = 0; i < 7; i++) P(J.head, -0.24 + i * 0.08, 0.38, 0.0, 0.06, 0.08, 0.5, 0x3a6a2a, 0, (i - 3) * 0.12); // coroa de louros
      P(J.torso, 0, J.tH * 0.6, 0.0, 0.72, 0.5, 0.42, 0x5a2a8a, 0, 0.25); // toga cruzada
      P(J.torso, 0.1, J.tH * 0.62, 0.2, 0.12, 0.6, 0.03, GOLD, 0, 0.5);
      P(J.torso, 0, -0.12, 0, 0.64, 0.4, 0.42, 0x4a2272);
      const st = J.arms[1].el; // cetro com águia
      P(st, 0, -0.1, 0.12, 0.06, 1.2, 0.06, GOLD);
      P(st, 0, 0.6, 0.12, 0.24, 0.08, 0.1, GOLD);
      L(st, 0, 0.68, 0.12, 0.08 + J.cast * 0.1, 0.08 + J.cast * 0.1, 0.08 + J.cast * 0.1, 0xd060ff);
    },
  }),
  rm_engineer: R2({
    skin: RM_SKIN, shirt: RM_LEATHER, sleeve: RM_RED, pants: 0x4a3420, boots: RM_LEATHER, hands: RM_SKIN_D, eye: 0xffc040,
    w: 1.1, chest: 1.05, legH: 0.46, torsoH: 0.58, head: 0.9, hunch: 0.28, arms: 'brawl', armW: 1.05, noClaws: true, stride: 0.45, gait: 0.85,
    extra: (J, P, L) => {
      P(J.head, 0, 0.3, 0.0, 0.48, 0.12, 0.46, 0x8a909a); // capacete simples
      L(J.head, 0, 0.26, 0.24, 0.3, 0.05, 0.02, 0xffc040); // óculos
      P(J.torso, 0, J.tH * 0.35, 0.17, 0.5, 0.5, 0.04, 0x6a4a28); // avental
      P(J.torso, 0, J.tH * 0.6, -0.26, 0.5, 0.56, 0.24, 0x5a3a20); // mochila de ferramentas
      for (const x of [-0.16, 0.12]) P(J.torso, x, J.tH * 0.6 + 0.4, -0.26, 0.05, 0.36, 0.05, 0x6a4a28);
      P(J.torso, 0, J.tH * 0.6 + 0.4, -0.26, 0.36, 0.05, 0.05, 0x6a4a28);
      P(J.arms[1].el, 0, -0.3, 0.1, 0.05, 0.4, 0.05, 0x5a3a20); // martelo
      P(J.arms[1].el, 0, -0.52, 0.1, 0.22, 0.12, 0.12, 0x6a7078);
    },
  }),
  // --- CHEFÕES ---
  boss: R2({
    skin: STONE, shirt: 0x5e4e46, arm: STONE, pants: STONE_D, boots: 0x3a302a, hands: 0x6a3a2c, eye: 0xff3a1a, brow: STONE_D,
    w: 1.5, chest: 1.3, depth: 1.25, legW: 1.4, legH: 0.44, torsoH: 0.72, head: 0.85, headFwd: 1.5, headDown: 0.05, hunch: 0.3, arms: 'brawl', armW: 1.6, hand: 1.7, stride: 0.4, gait: 0.7, jaw: 0.22, claw: 0xc02020,
    extra: (J, P, L) => {
      for (const sg of [-1, 1]) { P(J.head, sg * 0.28, 0.46, 0, 0.12, 0.3, 0.12, 0xb01c1c, 0, sg * -0.55); P(J.head, sg * 0.4, 0.64, 0, 0.08, 0.2, 0.08, 0xd83030, 0, sg * -0.15); }
      for (const [x, y, r] of [[0.06, 0.3, 0.35], [-0.12, 0.2, -0.5], [0.15, 0.5, 0.2], [-0.2, 0.6, 0.4]]) L(J.torso, x, y, 0.2, 0.03, 0.3, 0.02, LAVA);
      for (const a of J.arms) { P(a.sh, 0, 0.0, 0, 0.36, 0.26, 0.36, 0x5e504a); P(a.sh, 0.06, 0.18, 0, 0.08, 0.22, 0.08, 0xc02020, 0, -0.5); L(a.el, 0, -0.27, 0.16, 0.2, 0.04, 0.02, LAVA); }
      for (let i = 0; i < 3; i++) P(J.torso, 0, J.tH * 0.6 + i * 0.12, -0.22, 0.1, 0.2, 0.1, 0xc02020, -0.6); // espinhos nas costas
    },
  }),
  devourer: R2({
    skin: 0x7a8a4a, shirt: 0x3a2a22, sleeve: 0x6a7a3a, arm: 0x6a7a3a, pants: 0x2a221c, boots: 0x1e1a14, hands: 0x5a3a2a, eye: 0xb4ff3a, belly: 0x8a9a58,
    w: 1.5, chest: 1.15, depth: 1.6, legW: 1.3, legH: 0.42, torsoH: 0.68, head: 1.1, headW: 1.2, headFwd: 1.8, headDown: -0.15, hunch: 0.35, arms: 'brawl', armW: 1.4, hand: 1.5, stride: 0.45, gait: 0.75, jaw: 0.6,
    extra: (J, P, L) => {
      P(J.torso, 0, 0.26, 0.16, 0.7, 0.42, 0.4, 0x8a9a58); // pança
      P(J.torso, 0, 0.28, 0.37, 0.5, 0.06, 0.02, 0x3a0a0a); // boca na barriga
      for (const x of [-0.18, -0.06, 0.06, 0.18]) P(J.torso, x, 0.31, 0.375, 0.04, 0.06, 0.02, TEETH);
      for (const x of [-0.12, 0, 0.12]) { P(J.jaw, x, 0.02, 0.27, 0.05, 0.1, 0.03, TEETH); P(J.head, x + 0.06, -0.02, 0.27, 0.05, 0.1, 0.03, TEETH); } // presas grandes
      for (const [x, y] of [[-0.3, 0.5], [0.3, 0.42], [0.12, 0.65]]) L(J.torso, x, y, 0.2, 0.1, 0.1, 0.02, 0xb4ff3a);
      P(J.torso, 0, J.tH * 0.8, -0.18, 0.6, 0.12, 0.08, 0x8a1a12, 0, 0); // correntes
    },
  }),
  mechworker: R2({
    skin: 0x7a8088, shirt: 0x2e4a6a, sleeve: 0x5a6068, arm: 0x5a6068, pants: 0x3a3e44, shin: 0x5a6068, boots: 0x22262a, hands: 0x9aa0a8, eye: 0x3fe0ff,
    w: 1.4, chest: 1.2, depth: 1.25, legW: 1.3, legH: 0.48, torsoH: 0.66, head: 0.85, hunch: 0.2, headDown: 0.05, arms: 'brawl', armW: 1.5, hand: 1.6, noClaws: true, stride: 0.4, gait: 0.75,
    extra: (J, P, L) => {
      P(J.head, 0, 0.3, 0.0, 0.5, 0.18, 0.48, 0xe8a020); // capacete de obra
      P(J.head, 0, 0.24, 0.24, 0.56, 0.04, 0.08, 0xe8a020);
      L(J.head, 0, 0.36, 0.25, 0.12, 0.06, 0.02, 0xfff0a0);
      for (const [x, y] of [[-0.18, 0.5], [0.18, 0.5]]) L(J.torso, x, y, 0.2, 0.06, 0.3, 0.02, 0xe8a020); // faixas refletivas
      P(J.torso, 0, J.tH * 0.6, -0.28, 0.5, 0.5, 0.22, 0x3a3e44); // motor nas costas
      for (const x of [-0.14, 0.14]) { P(J.torso, x, J.tH * 0.6 + 0.4, -0.3, 0.1, 0.3, 0.1, 0x2a2e34); L(J.torso, x, J.tH * 0.6 + 0.56, -0.3, 0.08, 0.04, 0.08, 0xff6a20); }
      const [r, l] = J.arms; // britadeira e garra
      P(r.el, 0, -0.42, 0.04, 0.2, 0.2, 0.2, 0x6a7078);
      P(r.el, 0, -0.62, 0.04, 0.08, 0.3, 0.08, 0xc8ccd4);
      for (const fx of [-0.1, 0.1]) P(l.el, fx, -0.46, 0.06, 0.07, 0.3, 0.1, 0x9aa0a8, 0.3, fx * 3);
      L(l.el, 0, -0.18, 0.13, 0.03, 0.22, 0.02, 0x3fe0ff);
    },
  }),
  guardian: R2({
    skin: 0x5a3a22, shirt: 0x3a5a2a, arm: 0x4a3020, pants: 0x2e2a1a, shin: 0x4a3020, boots: 0x1e1a12, hands: 0x6a4a2a, eye: 0xc070ff, claw: 0x3a5a2a,
    w: 1.4, chest: 1.2, depth: 1.2, legW: 1.35, legH: 0.48, torsoH: 0.72, head: 0.95, headW: 0.9, hunch: 0.15, headDown: -0.05, arms: 'brawl', armW: 1.35, hand: 1.5, stride: 0.35, gait: 0.7, noTeeth: true, jaw: 0.1,
    extra: (J, P, L) => {
      for (const sg of [-1, 1]) { P(J.head, sg * 0.22, 0.5, -0.04, 0.08, 0.42, 0.08, 0x4a3020, -0.2, sg * -0.5); P(J.head, sg * 0.38, 0.74, -0.08, 0.06, 0.22, 0.06, 0x4a3020, -0.2, sg * 0.3); } // galhada
      P(J.head, 0, 0.38, -0.02, 0.48, 0.1, 0.46, 0x3a5a2a); // musgo
      for (const [x, y, s] of [[-0.24, 0.62, 0.16], [0.2, 0.4, 0.12], [0.3, 0.7, 0.1]]) { P(J.torso, x, y, 0.2, 0.04, s * 0.6, 0.04, 0xe8e0c8); L(J.torso, x, y + s * 0.4, 0.2, s, s * 0.4, s, 0xc070ff); } // cogumelos
      for (let i = 0; i < 4; i++) P(J.torso, -0.24 + i * 0.16, J.tH * 0.4, 0.17, 0.05, J.tH * 0.8, 0.03, 0x3a2414, 0, (i - 1.5) * 0.15); // casca
      for (const a of J.arms) for (const fx of [-0.07, 0.07]) P(a.el, fx, -0.48, 0.04, 0.05, 0.3, 0.05, 0x4a3020, 0.4, fx * 4); // raízes-dedos
      L(J.torso, 0, J.tH * 0.6, 0.21, 0.16, 0.16, 0.02, 0xc070ff);
    },
  }),
  general: R2({
    skin: 0xc9b090, shirt: 0x4a5a2a, sleeve: 0x4a5a2a, arm: 0x4a5a2a, pants: 0x2e3420, boots: 0x1e1e18, hands: 0xb09a7a, eye: 0xff3a1a,
    w: 1.3, chest: 1.2, depth: 1.1, legW: 1.2, legH: 0.52, torsoH: 0.68, head: 0.9, hunch: 0.05, headDown: -0.1, arms: 'brawl', armW: 1.25, noClaws: true, stride: 0.45, gait: 0.8, jaw: 0.2,
    extra: (J, P, L) => {
      P(J.head, 0, 0.36, 0.02, 0.52, 0.12, 0.5, 0x2e3420); // quepe
      P(J.head, 0, 0.3, 0.26, 0.5, 0.04, 0.14, 0x1a1e14);
      L(J.head, 0, 0.38, 0.27, 0.1, 0.08, 0.02, 0xffc107);
      for (const sg of [-1, 1]) { P(J.torso, sg * 0.36, J.tH * 0.94, 0, 0.3, 0.1, 0.36, 0x3a4a22); for (let i = 0; i < 3; i++) L(J.torso, sg * 0.36 + (i - 1) * 0.07, J.tH * 0.94 + 0.06, 0.15, 0.04, 0.02, 0.06, 0xffc107); } // dragonas
      P(J.torso, 0, J.tH * 0.6, 0.17, 0.56, 0.5, 0.05, 0x2e3a1e); // colete blindado
      for (let i = 0; i < 4; i++) L(J.torso, -0.14 + (i % 2) * 0.08, J.tH * 0.72 - Math.floor(i / 2) * 0.07, 0.2, 0.05, 0.04, 0.02, [0xe53935, 0xffc107, 0x29b6f6, 0x2ecc71][i]); // medalhas
      P(J.torso, 0, J.tH * 0.85, -0.2, 0.62, 0.2, 0.06, 0xb01c1c); // capa
      P(J.torso, 0, J.tH * 0.3, -0.24, 0.68, 0.66, 0.05, 0xb01c1c, 0.15);
      P(J.arms[1].el, 0, -0.42, 0.12, 0.14, 0.14, 0.36, 0x2a2e34, 1.4); // pistola-canhão
      L(J.arms[1].el, 0, -0.42, 0.32, 0.08, 0.08, 0.02, 0xff6a20);
    },
  }),
});

function drawLabBoss(kind, B, G, m, col, t) {
  const P = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => G.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, c);
  const pulse = 0.5 + 0.5 * Math.sin((t || 0) * 3);
  if (kind === 'lb_colossa') {
    // COLOSSA RAINHA: matriarca mutante, coroa de espinhos, saco de ovos nas costas, garras enormes
    P(-0.3, 0.42, 0, 0.42, 0.84, 0.44, 0x4a2a3a);
    P(0.3, 0.42, 0, 0.42, 0.84, 0.44, 0x4a2a3a);
    P(-0.3, 0.08, 0.1, 0.5, 0.16, 0.6, 0x2a1622);
    P(0.3, 0.08, 0.1, 0.5, 0.16, 0.6, 0x2a1622);
    P(0, 1.3, 0, 1.2, 0.96, 0.8, 0x7a3a5a);
    P(0, 1.2, 0.38, 0.8, 0.6, 0.1, 0x9a5a7a);
    for (let i = 0; i < 3; i++) P(0, 0.98 + i * 0.2, 0.44, 0.6 - i * 0.1, 0.06, 0.04, 0x5a2a40);
    P(0, 1.4, -0.62, 1.0, 0.9, 0.6, 0x9a4a6a);
    for (let i = 0; i < 5; i++) L(-0.36 + i * 0.18, 1.2 + (i % 2) * 0.3, -0.94, 0.14, 0.14, 0.06, 0xff60c0);
    P(0, 2.0, 0.08, 0.56, 0.5, 0.5, 0x8a4a6a);
    P(0, 1.86, 0.34, 0.44, 0.18, 0.1, 0x3a0a1a);
    for (let i = 0; i < 4; i++) L(-0.15 + i * 0.1, 1.82, 0.4, 0.04, 0.1, 0.03, 0xffffff);
    L(-0.14, 2.08, 0.34, 0.1, 0.08, 0.03, 0xff3060);
    L(0.14, 2.08, 0.34, 0.1, 0.08, 0.03, 0xff3060);
    for (let i = 0; i < 5; i++) P(-0.24 + i * 0.12, 2.38 + (i === 2 ? 0.12 : 0), 0, 0.08, 0.34 + (i === 2 ? 0.16 : 0), 0.08, 0xffc107);
    P(-0.82, 1.4, 0, 0.36, 0.8, 0.36, 0x6a2a4a, 0, 0.2);
    P(0.82, 1.4, 0, 0.36, 0.8, 0.36, 0x6a2a4a, 0, -0.2);
    P(-0.96, 0.8, 0.2, 0.46, 0.4, 0.46, 0x7a3a5a);
    P(0.96, 0.8, 0.2, 0.46, 0.4, 0.46, 0x7a3a5a);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) P(s * 0.96 + (i - 1) * 0.14, 0.5, 0.42, 0.08, 0.3, 0.08, 0xe0d0c0, 0.4);
    L(0, 1.3, 0.44, 0.3, 0.3 * (0.6 + pulse * 0.4), 0.04, 0xff60c0);
  } else if (kind === 'lb_core') {
    // NUCLEO INFECTADO: reator estacionario, nucleo pulsante, aneis, cabos e canhoes
    P(0, 0.2, 0, 1.6, 0.4, 1.6, 0x2a2e36);
    P(0, 0.46, 0, 1.3, 0.14, 1.3, 0x3a3f48);
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
      P(x, 1.0, z, 0.2, 1.1, 0.2, 0x4a505a);
      L(x, 1.6, z, 0.24, 0.1, 0.24, 0xffc107);
    }
    P(0, 1.3, 0, 0.9, 0.9, 0.9, 0x1a3a1a);
    L(0, 1.3, 0, 0.64 + pulse * 0.14, 0.64 + pulse * 0.14, 0.64 + pulse * 0.14, 0x7aff40);
    P(0, 1.3, 0, 1.4, 0.12, 1.4, 0x5a606a);
    P(0, 1.3, 0, 0.12, 1.4, 1.4, 0x5a606a);
    L(-0.2, 1.42, 0.48, 0.14, 0.14, 0.03, 0xff2020);
    L(0.2, 1.42, 0.48, 0.14, 0.14, 0.03, 0xff2020);
    P(0, 2.06, 0, 0.5, 0.3, 0.5, 0x3a3f48);
    P(0, 2.3, 0.2, 0.18, 0.18, 0.6, 0x24282e);
    L(0, 2.3, 0.52, 0.12, 0.12, 0.04, 0x7aff40);
    for (const s of [-1, 1]) {
      P(s * 0.92, 1.3, 0.1, 0.3, 0.3, 0.3, 0x3a3f48);
      P(s * 0.92, 1.3, 0.46, 0.14, 0.14, 0.5, 0x24282e);
      L(s * 0.92, 1.3, 0.72, 0.1, 0.1, 0.04, 0x7aff40);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      P(Math.cos(a) * 0.9, 0.62, Math.sin(a) * 0.9, 0.12, 0.12, 0.4, 0x1a1e22, 0, 0);
    }
  } else if (kind === 'lb_abominable') {
    // ABOMINAVEL: massa de carne costurada, tres cabecas, bracos desiguais, tubos
    P(-0.34, 0.4, 0, 0.44, 0.8, 0.44, 0x6a5a4a);
    P(0.34, 0.4, 0, 0.44, 0.8, 0.44, 0x5a4a3a);
    P(0, 1.3, 0, 1.4, 1.1, 1.0, 0xb07a6a);
    P(0, 1.16, 0.48, 1.0, 0.7, 0.1, 0xc88a7a);
    for (let i = 0; i < 4; i++) P(-0.1 + (i % 2) * 0.2, 0.9 + i * 0.2, 0.54, 0.4, 0.04, 0.03, 0x2a1a1a);
    P(0, 1.3, -0.52, 0.5, 0.5, 0.2, 0x8a4a3a);
    L(0, 1.3, -0.64, 0.3, 0.3, 0.04, 0xa0ff50);
    for (const [x, y, s] of [[0, 2.1, 0.46], [-0.52, 1.96, 0.32], [0.54, 1.92, 0.34]]) {
      P(x, y, 0.1, s, s, s, 0x9a6a5a);
      L(x - s * 0.22, y + s * 0.1, 0.1 + s / 2 + 0.01, s * 0.18, s * 0.18, 0.03, 0xffe040);
      L(x + s * 0.22, y + s * 0.1, 0.1 + s / 2 + 0.01, s * 0.18, s * 0.18, 0.03, 0xffe040);
      P(x, y - s * 0.28, 0.1 + s / 2, s * 0.6, s * 0.14, 0.04, 0x3a0a0a);
    }
    P(-1.02, 1.2, 0.1, 0.56, 1.1, 0.56, 0xb07a6a, 0, 0.12);
    P(-1.1, 0.5, 0.2, 0.7, 0.5, 0.7, 0x8a5a4a);
    P(0.86, 1.4, 0.1, 0.26, 0.7, 0.26, 0x9a6a5a, 0, -0.2);
    P(0.94, 0.94, 0.3, 0.08, 0.5, 0.08, 0xd0d0d0, 0.3);
    P(1.04, 0.94, 0.3, 0.08, 0.5, 0.08, 0xd0d0d0, 0.3);
    P(-0.4, 1.9, -0.3, 0.1, 0.1, 0.6, 0x5a6a5a, 0.6);
    P(0.4, 1.9, -0.3, 0.1, 0.1, 0.6, 0x5a6a5a, 0.6);
  } else if (kind === 'lb_exogeneral') {
    // EXO GENERAL: exoesqueleto militar, capacete com viseira, ombreiras, canhao e lamina
    P(-0.3, 0.44, 0, 0.34, 0.88, 0.36, 0x3a4a3a);
    P(0.3, 0.44, 0, 0.34, 0.88, 0.36, 0x3a4a3a);
    P(-0.3, 0.5, 0.2, 0.38, 0.3, 0.1, 0x5a6a5a);
    P(0.3, 0.5, 0.2, 0.38, 0.3, 0.1, 0x5a6a5a);
    P(-0.3, 0.08, 0.1, 0.44, 0.16, 0.56, 0x1a1e1a);
    P(0.3, 0.08, 0.1, 0.44, 0.16, 0.56, 0x1a1e1a);
    P(0, 1.32, 0, 1.0, 0.9, 0.66, 0x4a5a46);
    P(0, 1.36, 0.34, 0.7, 0.6, 0.08, 0x2e3a2c);
    L(0, 1.36, 0.39, 0.22, 0.22, 0.03, 0xe53935);
    P(0, 1.36, -0.46, 0.7, 0.8, 0.3, 0x2a302a);
    L(-0.2, 1.4, -0.62, 0.1, 0.5, 0.04, 0x29b6f6);
    L(0.2, 1.4, -0.62, 0.1, 0.5, 0.04, 0x29b6f6);
    P(-0.7, 1.74, 0, 0.6, 0.3, 0.7, 0x5a6a56);
    P(0.7, 1.74, 0, 0.6, 0.3, 0.7, 0x5a6a56);
    L(-0.7, 1.9, 0.2, 0.4, 0.04, 0.1, 0xffc107);
    L(0.7, 1.9, 0.2, 0.4, 0.04, 0.1, 0xffc107);
    P(0, 2.06, 0.04, 0.5, 0.5, 0.5, 0x3a4a3a);
    P(0, 2.34, 0, 0.56, 0.1, 0.56, 0x2a342a);
    L(0, 2.06, 0.3, 0.42, 0.1, 0.04, 0xe53935);
    P(0.2, 2.5, -0.1, 0.04, 0.4, 0.04, 0x8a8a8a);
    P(-0.74, 1.2, 0.08, 0.3, 0.7, 0.3, 0x3a4a3a);
    P(-0.74, 0.88, 0.44, 0.3, 0.3, 0.9, 0x2a2e2a);
    L(-0.74, 0.88, 0.9, 0.18, 0.18, 0.04, 0xffc107);
    P(0.74, 1.2, 0.08, 0.3, 0.7, 0.3, 0x3a4a3a);
    P(0.74, 0.86, 0.2, 0.32, 0.3, 0.32, 0x5a6a56);
    P(0.74, 0.86, 0.8, 0.06, 0.14, 0.9, 0xc0c8d0);
  }
}

Object.assign(BODIES, {
  walker: drawWalkerV2,
  ...V2,
  lb_colossa: (B, G, m, z, col, t) => drawLabBoss('lb_colossa', B, G, m, col, t),
  lb_core: (B, G, m, z, col, t) => drawLabBoss('lb_core', B, G, m, col, t),
  lb_abominable: (B, G, m, z, col, t) => drawLabBoss('lb_abominable', B, G, m, col, t),
  lb_exogeneral: (B, G, m, z, col, t) => drawLabBoss('lb_exogeneral', B, G, m, col, t),
  lb_specter: (B, G, m, z, col, t) => drawLabMob('lb_specter', B, G, m, col, t),
  lb_tremor: (B, G, m, z, col, t) => drawLabMob('lb_tremor', B, G, m, col, t),
  lb_launcher: (B, G, m, z, col, t) => drawLabMob('lb_launcher', B, G, m, col, t),
  lb_suppressor: (B, G, m, z, col, t) => drawLabMob('lb_suppressor', B, G, m, col, t),
  lb_corrosive: (B, G, m, z, col, t) => drawLabMob('lb_corrosive', B, G, m, col, t),
  lb_incendiary: (B, G, m, z, col, t) => drawLabMob('lb_incendiary', B, G, m, col, t),
  lb_freezer: (B, G, m, z, col, t) => drawLabMob('lb_freezer', B, G, m, col, t),
  lb_hunter: (B, G, m, z, col, t) => drawLabMob('lb_hunter', B, G, m, col, t),
  lb_pack: (B, G, m, z, col, t) => drawLabMob('lb_pack', B, G, m, col, t),
  lb_signaler: (B, G, m, z, col, t) => drawLabMob('lb_signaler', B, G, m, col, t),
  lb_puppeteer: (B, G, m, z, col, t) => drawLabMob('lb_puppeteer', B, G, m, col, t),
  lb_camouflaged: (B, G, m, z, col, t) => drawLabMob('lb_camouflaged', B, G, m, col, t),
  lb_demolisher: (B, G, m, z, col, t) => drawLabMob('lb_demolisher', B, G, m, col, t),
  lb_aerial: (B, G, m, z, col, t) => drawLabMob('lb_aerial', B, G, m, col, t),
  ff_saci: (B, G, m, z, col, t) => drawFolkMob('ff_saci', B, G, m, col, t),
  ff_curupira: (B, G, m, z, col, t) => drawFolkMob('ff_curupira', B, G, m, col, t),
  ff_pisadeira: (B, G, m, z, col, t) => drawFolkMob('ff_pisadeira', B, G, m, col, t),
  ff_iara: (B, G, m, z, col, t) => drawFolkMob('ff_iara', B, G, m, col, t),
  ff_cuca: (B, G, m, z, col, t) => drawFolkMob('ff_cuca', B, G, m, col, t),
  ff_mula: (B, G, m, z, col, t) => drawFolkMob('ff_mula', B, G, m, col, t),
  ff_lobisomem: (B, G, m, z, col, t) => drawFolkMob('ff_lobisomem', B, G, m, col, t),
  ff_boto: (B, G, m, z, col, t) => drawFolkMob('ff_boto', B, G, m, col, t),
  ff_caipora: (B, G, m, z, col, t) => drawFolkMob('ff_caipora', B, G, m, col, t),
  ff_boitata: (B, G, m, z, col, t) => drawFolkMob('ff_boitata', B, G, m, col, t),
});


// ===== REWORK V2 — lote 3: Laboratório e Floresta Sombria (substitui os modelos de blocos parados)
// Quadrúpede articulado: tronco, pescoço/cabeça com mandíbula, 4 patas com joelho, cauda.
function drawQuadV2(B, G, base, z, col, t, o) {
  const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const g = (z.walk || 0) * (o.gait || 1.3);
  const lunge = z.state === 'lunge' ? 1 : 0;
  const atk = z.attackT > 0 ? Math.min(1, z.attackT * 3) : 0;
  const bob = Math.abs(Math.sin(g)) * 0.04;
  const H = o.h || 0.55, Lg = o.len || 0.9, W = o.w || 0.42;
  const body = joint(base, 0, H + bob, 0, -lunge * 0.15 + (o.pitch || 0), 0, 0);
  P(body, 0, 0.02, -0.05, W, o.bodyH || 0.36, Lg, o.c1);
  P(body, 0, 0.0, Lg * 0.36, W * 1.1, (o.bodyH || 0.36) * 1.15, Lg * 0.36, o.c2 || o.c1); // peito
  P(body, 0, -(o.bodyH || 0.36) * 0.45, 0, W * 0.8, 0.05, Lg * 0.7, o.belly || o.c2 || o.c1);
  const head = joint(body, 0, (o.neckY ?? 0.12), Lg * 0.5 + 0.04, -0.15 + lunge * -0.25 + Math.sin(g * 0.5) * 0.05, 0, 0);
  const hs = o.head || 1;
  P(head, 0, 0.06 * hs, 0.12 * hs, 0.36 * hs, 0.32 * hs, 0.34 * hs, o.c2 || o.c1);
  P(head, 0, -0.01 * hs, 0.36 * hs, 0.24 * hs, 0.16 * hs, (o.snout || 0.26) * hs, o.c1);
  P(head, 0, 0.06 * hs, (0.36 + (o.snout || 0.26) / 2) * hs, 0.1 * hs, 0.06 * hs, 0.03, 0x14100c);
  const jawA = 0.2 + atk * 0.5 + lunge * 0.4;
  const jaw = joint(head, 0, -0.08 * hs, 0.24 * hs, jawA, 0, 0);
  P(jaw, 0, -0.03, 0.12 * hs, 0.22 * hs, 0.06, (o.snout || 0.26) * hs, o.jaw || o.c2 || o.c1);
  P(jaw, 0, 0.0, 0.12 * hs, 0.18 * hs, 0.03, (o.snout || 0.26) * 0.9 * hs, 0x5a1010);
  for (const sg of [-1, 1]) {
    P(head, sg * 0.1 * hs, 0.13 * hs, 0.29 * hs, 0.1 * hs, 0.07 * hs, 0.02, 0x0a0a08);
    L(head, sg * 0.1 * hs, 0.13 * hs, 0.3 * hs, 0.07 * hs, 0.05 * hs, 0.02, o.eye || 0xff3a2a);
    P(head, sg * 0.07 * hs, -0.06 * hs, (0.36 + (o.snout || 0.26) / 2 - 0.03) * hs, 0.03, 0.06, 0.03, TEETH);
    if (o.ears !== false) P(head, sg * 0.13 * hs, 0.28 * hs, 0.04, 0.08 * hs, 0.16 * hs, 0.06, o.c1, -0.3, sg * -0.2);
  }
  for (const [x, zz, ph] of [[W * 0.38, Lg * 0.36, 0], [-W * 0.38, Lg * 0.36, Math.PI], [W * 0.38, -Lg * 0.38, Math.PI], [-W * 0.38, -Lg * 0.38, 0]]) {
    const a = lunge ? (zz > 0 ? -1.0 : 0.8) : Math.sin(g + ph) * 0.6;
    const hip = joint(body, x, -0.06, zz, a, 0, 0);
    P(hip, 0, -H * 0.24, 0, (o.legW || 0.15), H * 0.5, (o.legW || 0.15) * 1.1, o.c2 || o.c1);
    const kn = joint(hip, 0, -H * 0.46, 0, zz > 0 ? Math.max(0, -a) * 0.8 : -Math.max(0, a) * 0.8 - 0.15, 0, 0);
    P(kn, 0, -H * 0.22, 0, (o.legW || 0.15) * 0.85, H * 0.46, (o.legW || 0.15) * 0.9, o.leg || o.c1);
    P(kn, 0, -H * 0.46, 0.04, (o.legW || 0.15) * 1.1, 0.07, (o.legW || 0.15) * 1.5, o.foot || 0x2a1a14);
  }
  if (o.tail !== false) {
    const tl = joint(body, 0, 0.08, -Lg * 0.5, -0.6 + Math.sin(t * 6) * 0.2, Math.sin(t * 5) * 0.3, 0);
    P(tl, 0, 0, -0.18, 0.08, 0.08, 0.38, o.c1);
  }
  if (o.extra) o.extra({ body, head, jaw, Lg, H, W, hs, t, g, atk, lunge }, P, L);
}

// Serpente segmentada ondulante
function drawSnakeV2(B, G, base, z, col, t, o) {
  const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const g = (z.walk || 0) * 1.4 + t * 2;
  const n = o.n || 9;
  const lunge = z.state === 'lunge' ? 1 : 0;
  for (let i = n - 1; i >= 1; i--) {
    const s = 1 - i / (n + 2);
    const x = Math.sin(g - i * 0.7) * 0.22 * (i / n + 0.3);
    P(base, x, 0.14 * s + 0.04, -i * 0.26 + 0.2, 0.34 * s, 0.26 * s, 0.3, i % 2 ? o.c1 : o.c2);
    if (o.glow) L(base, x, 0.28 * s + 0.06, -i * 0.26 + 0.2, 0.14 * s, 0.04, 0.16, o.glow);
  }
  const rise = 0.35 + lunge * 0.25;
  const head = joint(base, Math.sin(g) * 0.06, rise, 0.36, -0.2 - lunge * 0.3, 0, 0);
  P(base, Math.sin(g) * 0.1, rise * 0.5, 0.26, 0.3, rise, 0.28, o.c2); // pescoço erguido
  P(head, 0, 0.06, 0.12, 0.4, 0.24, 0.42, o.c1);
  const jaw = joint(head, 0, -0.05, 0.0, 0.25 + lunge * 0.5 + (z.attackT > 0 ? 0.4 : 0), 0, 0);
  P(jaw, 0, -0.03, 0.18, 0.34, 0.06, 0.36, o.c2);
  for (const sg of [-1, 1]) {
    L(head, sg * 0.13, 0.14, 0.28, 0.07, 0.05, 0.04, o.eye);
    P(head, sg * 0.08, -0.04, 0.3, 0.03, 0.1, 0.03, TEETH);
  }
  if (o.extra) o.extra({ head, jaw, t, g }, P, L);
}

const Q = (o) => (B, G, b, z, col, t) => drawQuadV2(B, G, b, z, col, t, o);
const V3 = {
  // --- LABORATÓRIO ---
  lb_specter: R2({
    skin: 0x9ad8e8, shirt: 0x1e4452, pants: 0x16323c, tail2: 0x24515f, arm: 0x3a8fa0, hands: 0x70e8ff, eye: 0x9affff, brow: 0x5aa8b8, claw: 0x9affff,
    noLegs: true, legH: 0.55, w: 0.9, torsoH: 0.56, head: 1.0, headW: 0.9, hunch: 0.15, headDown: 0.1, arms: 'reach', armW: 0.8, jaw: 0.5, noTeeth: true,
    extra: (J, P, L) => {
      L(J.torso, 0, J.tH * 0.6, 0.17, 0.16, 0.24, 0.02, 0x70e8ff); // núcleo infectado visível
      for (const [x, y] of [[-0.2, 0.2], [0.18, 0.4]]) L(J.torso, x, y, 0.165, 0.06, 0.14, 0.02, 0x70e8ff);
      P(J.head, 0, 0.34, -0.1, 0.36, 0.2, 0.3, 0x1e4452, -0.5); // capuz rasgado
    },
  }),
  lb_tremor: R2({
    skin: 0x6a6050, shirt: 0x5c5240, pants: 0x3a3228, boots: 0x241e18, arm: 0x504636, hands: 0x5c5240, eye: 0xffc040, brow: 0x3a3a34,
    w: 1.5, chest: 1.3, depth: 1.25, legW: 1.4, legH: 0.42, torsoH: 0.7, head: 0.7, headFwd: 1.8, headDown: 0.0, hunch: 0.45, arms: 'brawl', armW: 1.7, hand: 1.9, noClaws: true, stride: 0.35, gait: 0.65, jaw: 0.2,
    extra: (J, P, L) => {
      for (let i = 0; i < 3; i++) P(J.torso, (i - 1) * 0.26, J.tH * 0.9, -0.2, 0.2, 0.26, 0.14, 0x3a3a34, -0.4); // placas nas costas
      for (const a of J.arms) { L(a.el, 0, -0.3, 0.2, 0.3, 0.04, 0.02, 0xffa030); P(a.sh, 0, 0.02, 0, 0.36, 0.2, 0.36, 0x3a3a34); } // punhos sísmicos
      L(J.torso, 0, J.tH * 0.55, 0.2, 0.4, 0.04, 0.02, 0xffa030);
    },
  }),
  lb_launcher: R2({
    skin: 0x7a8a6a, shirt: 0x4e5a62, pants: 0x3a4048, boots: 0x24282c, arm: 0x4e5a62, hands: 0x6a7278, eye: 0x9aff40,
    w: 1.0, legH: 0.52, torsoH: 0.58, head: 0.9, hunch: 0.2, arms: 'reach', noTeeth: true, jaw: 0.0, stride: 0.5,
    extra: (J, P, L) => {
      P(J.head, 0, 0.12, 0.2, 0.4, 0.26, 0.12, 0x2a3034); // máscara de gás
      for (const sg of [-1, 1]) L(J.head, sg * 0.1, 0.2, 0.27, 0.09, 0.08, 0.02, 0x9aff40);
      P(J.head, 0, 0.02, 0.3, 0.12, 0.12, 0.14, 0x3a4048);
      P(J.torso, 0, J.tH * 0.6, -0.32, 0.46, 0.62, 0.3, 0x3a4a3a); // tanque ácido
      L(J.torso, 0, J.tH * 0.6, -0.48, 0.3, 0.46, 0.02, 0x9aff40);
      P(J.torso, 0.2, J.tH * 0.95, -0.2, 0.06, 0.06, 0.36, 0x2a3034, 0.6); // mangueira
      const r = J.arms[0].el; // canhão no braço
      P(r, 0, -0.34, 0.04, 0.24, 0.42, 0.24, 0x6a7278);
      P(r, 0, -0.58, 0.04, 0.16, 0.08, 0.16, 0x24282c);
      L(r, 0, -0.62, 0.04, 0.1, 0.02, 0.1, 0x9aff40);
    },
  }),
  lb_suppressor: R2({
    skin: 0x6a9a7a, shirt: 0x1e4a32, pants: 0x1a3a28, boots: 0x0e1e14, arm: 0x2a5a3a, hands: 0x6a9a7a, eye: 0x40ff9a,
    w: 1.1, chest: 1.1, legH: 0.54, torsoH: 0.62, head: 0.85, hunch: 0.05, headDown: -0.05, arms: 'cast', noTeeth: true, jaw: 0.05, stride: 0.4,
    extra: (J, P, L) => {
      P(J.head, 0, 0.24, 0.0, 0.5, 0.32, 0.48, 0x1e4a32); // capacete fechado
      L(J.head, 0, 0.2, 0.25, 0.36, 0.05, 0.02, 0x40ff9a);
      P(J.torso, 0, J.tH * 0.6, -0.26, 0.4, 0.56, 0.2, 0x2a3a30); // gerador
      for (const x of [-0.12, 0.12]) { P(J.torso, x, J.tH * 0.6 + 0.4, -0.26, 0.06, 0.4, 0.06, 0x8a9a90); L(J.torso, x, J.tH * 0.6 + 0.62, -0.26, 0.1, 0.1, 0.1, 0x40ff9a); }
      const p = 0.5 + 0.5 * Math.sin(J.t * 4);
      L(J.torso, 0, -0.5, 0, 1.4 + p * 0.3, 0.02, 1.4 + p * 0.3, 0x2ecc71); // anel do campo
    },
  }),
  lb_corrosive: R2({
    skin: 0x5a7a3a, shirt: 0x4a6a30, pants: 0x3a5a2a, boots: 0x2a3a1a, arm: 0x5a7a3a, hands: 0x6a8a3a, eye: 0xc0ff40, jawC: 0x4a6a30,
    w: 1.1, chest: 0.95, depth: 1.3, legH: 0.48, torsoH: 0.6, head: 0.95, headW: 1.1, hunch: 0.3, headFwd: 1.3, arms: 'reach', jaw: 0.45, stride: 0.45, gait: 0.85,
    extra: (J, P, L) => {
      for (const [x, y, s] of [[-0.22, 0.25, 0.18], [0.2, 0.42, 0.14], [0.02, 0.15, 0.2], [0.26, 0.15, 0.1]]) { P(J.torso, x, y, 0.2, s, s, 0.08, 0x7a9a3a); L(J.torso, x, y, 0.245, s * 0.6, s * 0.6, 0.02, 0xc0ff40); } // bolsas ácidas
      L(J.jaw, 0, -0.12, 0.22, 0.06, 0.18, 0.04, 0xc0ff40); // baba ácida
      for (const a of J.arms) L(a.el, 0, -0.42, 0.06, 0.05, 0.12, 0.05, 0xc0ff40);
      L(J.torso, 0, -0.5, 0.1, 0.5, 0.02, 0.5, 0x8aff30); // poça
    },
  }),
  lb_incendiary: R2({
    skin: 0x5a3020, shirt: 0x4a2a1a, pants: 0x3a2018, boots: 0x1a0e0a, arm: 0x5a3020, hands: 0x3a2018, eye: 0xffb020, brow: 0x2a1410,
    w: 1.0, legH: 0.52, torsoH: 0.6, head: 0.92, hunch: 0.15, arms: 'reach', jaw: 0.3, stride: 0.5, claw: 0xff6a10,
    extra: (J, P, L) => {
      for (const [x, y, r] of [[0.08, 0.3, 0.3], [-0.12, 0.5, -0.4], [0.18, 0.62, 0.2], [-0.05, 0.12, 0.5]]) L(J.torso, x, y, 0.17, 0.04, 0.24, 0.02, 0xff6a10); // fissuras de lava
      L(J.head, 0.06, 0.12, 0.235, 0.03, 0.2, 0.02, 0xff6a10);
      for (const x of [-0.14, 0.14]) { P(J.torso, x, J.tH * 0.6, -0.26, 0.16, 0.5, 0.16, 0x8a2a10); L(J.torso, x, J.tH * 0.6 + 0.3, -0.26, 0.08, 0.1, 0.08, 0xffd040); } // tanques de combustível
      const f = 0.08 + Math.abs(Math.sin(J.t * 12)) * 0.08;
      L(J.head, 0, 0.42, 0, f, f * 2, f, 0xff8a20); // chama na cabeça
      L(J.arms[0].el, 0, -0.42, 0.04, 0.12, f * 2, 0.12, 0xff6a10);
    },
  }),
  lb_freezer: R2({
    skin: 0x8ab8c8, shirt: 0x5a8aa0, pants: 0x3a6a80, boots: 0x2a4a5a, arm: 0x6a9ab0, hands: 0xb0f0ff, eye: 0x9affff, brow: 0x4a7a90, claw: 0xd0ffff,
    w: 1.05, legH: 0.54, torsoH: 0.6, head: 0.92, hunch: 0.1, arms: 'reach', jaw: 0.2, stride: 0.45, gait: 0.85,
    extra: (J, P, L) => {
      for (const [x, y, h, r] of [[-0.24, 0.62, 0.36, 0.4], [0.24, 0.62, 0.4, -0.4], [0, 0.66, 0.46, 0], [-0.12, 0.5, 0.26, 0.7]]) L(J.torso, x, J.tH * 0.9 + 0.05, -0.12, 0.08, h, 0.08, 0xc0f8ff); // cristais nas costas
      P(J.head, 0, 0.32, 0, 0.5, 0.08, 0.48, 0xc0f8ff); // geada
      for (const sg of [-1, 1]) L(J.head, sg * 0.18, 0.42, 0, 0.06, 0.2, 0.06, 0xc0f8ff);
      for (const a of J.arms) L(a.el, 0, -0.32, 0.04, 0.2, 0.08, 0.2, 0x9affff);
      L(J.torso, 0, J.tH * 0.6, 0.17, 0.14, 0.14, 0.02, 0x29b6f6);
    },
  }),
  lb_hunter: Q({
    c1: 0x5a1a14, c2: 0x7a2a1a, belly: 0x3a0e0a, leg: 0x4a1410, foot: 0x1a0a08, eye: 0xffe040, h: 0.62, len: 0.95, w: 0.4, head: 1.0, snout: 0.3, gait: 1.5, ears: false,
    extra: (J, P, L) => {
      for (let i = 0; i < 5; i++) P(J.body, 0, 0.22, J.Lg * 0.35 - i * 0.18, 0.08, 0.16 - i * 0.02, 0.08, 0xc8c0a0, -0.4); // espinhos ósseos
      for (const sg of [-1, 1]) { P(J.body, sg * 0.24, -0.06, J.Lg * 0.5, 0.05, 0.05, 0.36, 0xd8dce4, 0.6); L(J.body, sg * 0.24, -0.16, J.Lg * 0.66, 0.03, 0.03, 0.22, 0xff6a20); } // lâminas de aço
      P(J.head, 0, 0.26, 0.0, 0.3, 0.1, 0.3, 0x3a0e0a); // crânio blindado
    },
  }),
  lb_pack: Q({
    c1: 0x6a4a30, c2: 0x7a5a3a, belly: 0x9a7a5a, leg: 0x5a3a24, eye: 0xff4a2a, h: 0.48, len: 0.82, w: 0.36, head: 0.9, gait: 1.4,
    extra: (J, P, L) => {
      P(J.body, 0, 0.06, J.Lg * 0.3, 0.46, 0.1, 0.12, 0x6a7078); // coleira metálica
      L(J.body, 0, 0.06, J.Lg * 0.37, 0.08, 0.06, 0.02, 0xe53935);
      for (const [x, zz] of [[0.15, 0], [-0.12, -0.2]]) P(J.body, x, 0.19, zz, 0.16, 0.04, 0.2, 0x8a909a); // placas de ferro
      P(J.body, 0.22, 0.0, -0.05, 0.02, 0.18, 0.3, 0x8a1a1a); // ferida
    },
  }),
  lb_signaler: R2({
    skin: 0x8a8070, shirt: 0x3a3a40, pants: 0x2a2a30, boots: 0x1a1a1e, arm: 0x4a4a52, hands: 0x8a8070, eye: 0xffc107,
    w: 0.8, legH: 0.62, torsoH: 0.56, head: 0.85, hunch: 0.1, arms: 'cast', armW: 0.85, stride: 0.5, jaw: 0.3,
    extra: (J, P, L) => {
      P(J.torso, 0, J.tH + 0.1, -0.16, 0.08, 0.9, 0.08, 0x6a6a72); // antena nas costas
      const p = 0.5 + 0.5 * Math.sin(J.t * 8);
      L(J.torso, 0, J.tH + 0.6, -0.16, 0.18 + p * 0.1, 0.18 + p * 0.1, 0.18 + p * 0.1, 0xffc107); // farol
      P(J.torso, 0, J.tH * 0.6, 0.17, 0.56, 0.08, 0.03, 0xffc107, 0, 0.5); // faixa refletiva
      L(J.head, 0.12, 0.2, 0.24, 0.1, 0.1, 0.02, 0xe53935); // olho-lanterna
      P(J.arms[0].el, 0, -0.32, 0.06, 0.1, 0.24, 0.1, 0x2a2a30); // sinalizador na mão
      L(J.arms[0].el, 0, -0.48, 0.06, 0.08, 0.1, 0.08, 0xe53935);
    },
  }),
  lb_puppeteer: R2({
    skin: 0x6a4a7a, shirt: 0x2a1a3a, pants: 0x1e1228, boots: 0x140c1c, arm: 0x4a2a5a, hands: 0x8a6a9a, eye: 0xe070ff, brow: 0x1e1228, claw: 0xe070ff,
    w: 0.85, legH: 0.64, torsoH: 0.62, head: 0.88, headW: 0.85, hunch: 0.25, headDown: 0.15, arms: 'cast', armW: 0.75, hand: 1.2, stride: 0.35, gait: 0.75, jaw: 0.1, noTeeth: true,
    extra: (J, P, L) => {
      P(J.head, 0, 0.08, 0.24, 0.36, 0.32, 0.03, 0xe8e0f0); // máscara de teatro
      for (const sg of [-1, 1]) P(J.head, sg * 0.1, 0.16, 0.26, 0.1, 0.05, 0.02, 0x14080e);
      P(J.head, 0, -0.02, 0.26, 0.18, 0.03, 0.02, 0x14080e, 0, 0.3);
      for (const sg of [-1, 1]) { P(J.torso, sg * 0.28, J.tH * 0.9, -0.14, 0.06, 0.5, 0.06, 0x4a2a5a, -0.5, sg * -0.5); P(J.torso, sg * 0.5, J.tH * 1.2, -0.32, 0.05, 0.36, 0.05, 0x4a2a5a, 0.4, sg * -0.2); } // apêndices
      for (const a of J.arms) for (const fx of [-0.05, 0.05]) L(a.el, fx, -0.8, 0.05, 0.01, 0.9, 0.01, 0xe070ff); // fios
    },
  }),
  lb_camouflaged: Q({
    c1: 0x1a2418, c2: 0x243022, belly: 0x141c12, leg: 0x1a2418, foot: 0x0e140c, eye: 0xffd040, h: 0.34, len: 0.9, w: 0.5, head: 0.9, snout: 0.16, gait: 1.1, ears: false, tail: false, legW: 0.13, pitch: 0.05,
    extra: (J, P, L) => {
      for (const [x, zz, c] of [[0.15, 0.1, 0x2e3a24], [-0.12, -0.2, 0x3a4a2a], [0.05, -0.32, 0x1e2a1a], [-0.18, 0.25, 0x2e3a24]]) P(J.body, x, 0.19, zz, 0.18, 0.03, 0.2, c); // manchas camufladas
      for (const sg of [-1, 1]) { P(J.head, sg * 0.12, 0.3, 0.0, 0.05, 0.22, 0.05, 0x1a2418, -0.6, sg * -0.3); P(J.body, sg * 0.32, 0.0, J.Lg * 0.5, 0.04, 0.04, 0.3, 0x8a8a6a, 0.3, sg * 0.3); } // antenas, garras
    },
  }),
  lb_demolisher: R2({
    skin: 0x6a6a5a, shirt: 0x5a5a52, pants: 0x3a3a42, shin: 0x22222a, boots: 0x22222a, arm: 0x7a7a70, hands: 0x8a8a80, eye: 0xffd040, brow: 0x3a3a34,
    w: 1.5, chest: 1.3, depth: 1.3, legW: 1.5, legH: 0.44, torsoH: 0.68, head: 0.7, headFwd: 0.8, headDown: -0.05, hunch: 0.25, arms: 'brawl', armW: 1.6, hand: 1.6, noClaws: true, stride: 0.3, gait: 0.6, jaw: 0.1,
    extra: (J, P, L) => {
      P(J.head, 0, 0.22, 0.02, 0.52, 0.32, 0.5, 0x4a4a42); // elmo blindado
      L(J.head, 0, 0.2, 0.27, 0.36, 0.05, 0.02, 0xffd040);
      P(J.torso, 0, J.tH * 0.9, 0.0, 0.9, 0.12, 0.5, 0xffa020); // faixa de alerta
      for (let i = 0; i < 4; i++) P(J.torso, -0.3 + i * 0.2, J.tH * 0.9, 0.26, 0.08, 0.13, 0.02, 0x1a1a1a);
      for (const a of J.arms) { // braços-broca
        P(a.el, 0, -0.4, 0.04, 0.24, 0.22, 0.24, 0x7a7a70);
        P(a.el, 0, -0.58, 0.04, 0.16, 0.2, 0.16, 0x9a9a90, 0, J.t * 8);
        P(a.el, 0, -0.74, 0.04, 0.08, 0.16, 0.08, 0xc8ccd4, 0, J.t * 8);
      }
    },
  }),
  lb_aerial: (B, G, b, z, col, t) => {
    const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
    const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
    const flap = Math.sin(t * 10) * 0.6, dive = z.state === 'lunge' ? 0.5 : 0;
    const body = joint(b, 0, 0, 0, 0.2 + dive, 0, 0);
    P(body, 0, 0, 0, 0.32, 0.3, 0.7, 0x3a5a2a);
    P(body, 0, 0.02, 0.05, 0.26, 0.24, 0.4, 0x4a7a3a);
    for (let i = 0; i < 3; i++) L(body, 0, 0.16, 0.2 - i * 0.18, 0.06, 0.04, 0.1, 0x2aff8a);
    const head = joint(body, 0, 0.08, 0.42, -0.2, 0, 0);
    P(head, 0, 0.02, 0.1, 0.28, 0.24, 0.28, 0x4a7a3a);
    P(head, 0, -0.04, 0.3, 0.12, 0.08, 0.2, 0xffb040); // bico
    const jaw = joint(head, 0, -0.08, 0.2, 0.2 + (z.attackT > 0 || z.state === 'spit' ? 0.5 : 0), 0, 0);
    P(jaw, 0, -0.02, 0.08, 0.1, 0.04, 0.16, 0xd08a30);
    for (const sg of [-1, 1]) {
      L(head, sg * 0.1, 0.08, 0.22, 0.06, 0.05, 0.03, 0xfff080);
      const w1 = joint(body, sg * 0.16, 0.08, 0.05, 0, 0, sg * flap);
      P(w1, sg * 0.32, 0, 0, 0.62, 0.05, 0.44, 0x4a7a3a);
      L(w1, sg * 0.32, -0.03, -0.05, 0.56, 0.02, 0.36, 0x2aff8a);
      const w2 = joint(w1, sg * 0.62, 0, 0, 0, 0, sg * flap * 0.6);
      P(w2, sg * 0.24, 0, -0.06, 0.5, 0.04, 0.34, 0x3f6a32);
      for (let i = 0; i < 3; i++) P(w2, sg * (0.1 + i * 0.16), 0, -0.26, 0.06, 0.03, 0.14, 0x2a4a20);
      const leg = joint(body, sg * 0.1, -0.14, -0.05, 0.6 + dive, 0, 0);
      P(leg, 0, -0.14, 0, 0.07, 0.26, 0.07, 0x3a5a2a);
      for (const fx of [-0.04, 0.04]) P(leg, fx, -0.3, 0.06, 0.03, 0.1, 0.03, 0xffb040, 0.5);
    }
    const tl = joint(body, 0, 0, -0.38, -0.2 + Math.sin(t * 4) * 0.2, Math.sin(t * 3) * 0.3, 0);
    P(tl, 0, 0, -0.2, 0.1, 0.06, 0.42, 0x3a5a2a);
    P(tl, 0, 0, -0.44, 0.28, 0.04, 0.14, 0x2a4a20);
  },
  // --- FLORESTA SOMBRIA (folclore) ---
  ff_saci: R2({
    skin: 0x5a3420, shirt: 0x8a2018, pants: 0x6a1a14, boots: 0x2a1410, arm: 0x5a3420, hands: 0x5a3420, eye: 0xffa020, brow: 0x2a1410,
    oneLeg: true, w: 0.8, legH: 0.56, torsoH: 0.5, head: 1.0, hunch: 0.1, headDown: -0.1, arms: 'run', armW: 0.8, stride: 0, gait: 1.2, jaw: 0.35, bob: 0.08,
    extra: (J, P, L) => {
      P(J.head, 0, 0.38, -0.02, 0.48, 0.14, 0.46, 0xc8201a); // gorro vermelho
      P(J.head, 0.06, 0.52, -0.1, 0.3, 0.14, 0.3, 0xc8201a, -0.3, -0.3);
      P(J.head, 0.14, 0.62, -0.2, 0.14, 0.12, 0.14, 0xe02a20, -0.6, -0.4);
      P(J.jaw, 0.14, -0.04, 0.24, 0.04, 0.04, 0.22, 0x3a2414, 0, 0.2); // cachimbo
      P(J.jaw, 0.16, 0.0, 0.36, 0.08, 0.1, 0.08, 0x3a2414);
      L(J.jaw, 0.16, 0.06, 0.36, 0.05, 0.03, 0.05, 0xff6a10);
      for (let i = 0; i < 2; i++) L(J.head, 0.2 + i * 0.06, 0.4 + ((J.t * 0.8 + i * 0.5) % 1) * 0.4, 0.3, 0.06, 0.06, 0.06, 0x8a8a8a); // fumaça
      for (const [x, y] of [[-0.3, -0.3], [0.32, -0.42]]) L(J.torso, x, y + Math.sin(J.t * 6 + x * 9) * 0.1, 0.1, 0.06, 0.06, 0.06, 0xff6a10); // brasas
    },
  }),
  ff_curupira: R2({
    skin: 0x8a4a2a, shirt: 0x2e6a2a, pants: 0x2a5a22, boots: 0x8a4a2a, arm: 0x8a4a2a, hands: 0x8a4a2a, eye: 0xffe040, brow: 0x3a1a0a, claw: 0x2e2010,
    w: 0.85, legH: 0.56, torsoH: 0.52, head: 0.95, hunch: 0.3, headFwd: 1.3, arms: 'run', armW: 0.8, stride: 0.8, gait: 1.25, jaw: 0.3,
    extra: (J, P, L) => {
      for (let i = 0; i < 6; i++) P(J.head, -0.2 + i * 0.08, 0.38 + (i % 2) * 0.08, -0.06, 0.1, 0.24, 0.2, 0xe03a14, -0.4, (i - 2.5) * 0.12); // cabelo de fogo
      for (let i = 0; i < 3; i++) L(J.head, -0.12 + i * 0.12, 0.52 + Math.abs(Math.sin(J.t * 9 + i)) * 0.08, -0.08, 0.06, 0.1, 0.06, 0xff8a20);
      P(J.torso, 0, -0.04, 0.02, 0.5, 0.2, 0.32, 0x4a7a2a); // tanga de folhas
      for (let i = 0; i < 4; i++) P(J.torso, -0.18 + i * 0.12, -0.16, 0.14, 0.1, 0.16, 0.03, 0x3a8a2a, 0.2);
      P(J.arms[1].el, 0, -0.1, 0.12, 0.05, 1.0, 0.05, 0x5a3a20); // lança de galho
      L(J.arms[1].el, 0, 0.42, 0.12, 0.08, 0.12, 0.08, 0xff6a10);
    },
  }),
  ff_pisadeira: R2({
    skin: 0x6a6a52, shirt: 0x2a2a22, pants: 0x1e1e18, boots: 0x6a6a52, arm: 0x6a6a52, hands: 0x6a6a52, eye: 0xff2a2a, brow: 0x1a1a14, claw: 0xd8d0b0,
    w: 0.75, chest: 0.85, legW: 0.6, legH: 0.7, torsoH: 0.58, head: 0.9, headW: 0.8, hunch: 0.65, headFwd: 1.6, headDown: -0.25, arms: 'blades', armW: 0.6, hand: 1.4, stride: 0.5, gait: 0.9, jaw: 0.5, knee: 0.4,
    extra: (J, P, L) => {
      for (let i = 0; i < 5; i++) P(J.head, -0.18 + i * 0.09, 0.2, -0.24, 0.08, 0.56, 0.06, 0x14140e, 0.2); // cabelo longo sujo
      P(J.head, 0, 0.36, -0.02, 0.44, 0.06, 0.42, 0x14140e);
      for (let i = 0; i < 4; i++) P(J.torso, 0, J.tH * 0.45 + i * 0.07, 0.15, 0.4, 0.025, 0.03, 0xa8a088); // costelas
      for (const a of J.arms) for (const fx of [-0.06, 0, 0.06]) P(a.el, fx, -0.48, 0.08, 0.025, 0.26, 0.025, 0xd8d0b0, 0.5); // unhas longas
    },
  }),
  ff_iara: R2({
    skin: 0x6aa8b0, shirt: 0x1e5a6a, pants: 0x1e6a7a, tail2: 0x2a8a9a, arm: 0x6aa8b0, hands: 0x8ad0d8, eye: 0x9affff, brow: 0x1e4a5a, claw: 0x9affff,
    noLegs: true, legH: 0.55, w: 0.85, torsoH: 0.56, head: 0.92, headW: 0.85, hunch: 0.05, headDown: -0.05, arms: 'cast', armW: 0.75, jaw: 0.4, noTeeth: true,
    extra: (J, P, L) => {
      for (let i = 0; i < 6; i++) P(J.head, -0.22 + i * 0.09, 0.14, -0.24, 0.08, 0.64 + (i % 2) * 0.1, 0.06, 0x0e2a3a, 0.25); // cabelo encharcado
      P(J.head, 0, 0.36, -0.02, 0.46, 0.06, 0.44, 0x0e2a3a);
      for (let i = 0; i < 3; i++) P(J.torso, 0, -0.08 - i * 0.12, -0.1, 0.36 - i * 0.06, 0.06, 0.2, 0x2a8a9a); // escamas
      L(J.torso, 0, J.tH * 0.6, 0.17, 0.12, 0.12, 0.02, 0x9affff);
      L(J.torso, 0, -0.62, -0.2 + Math.sin(J.t * 3) * 0.1, 0.5, 0.04, 0.24, 0x2a8a9a); // barbatana caudal
      if (J.cast) L(J.arms[0].el, 0, -0.38, 0.06, 0.18, 0.18, 0.18, 0x29b6f6);
    },
  }),
  ff_cuca: R2({
    skin: 0x4a6a2a, shirt: 0x3a2a4a, pants: 0x2a1e34, boots: 0x3a5a22, arm: 0x4a6a2a, hands: 0x5a7a32, eye: 0xffd020, jawC: 0x3a5a22, claw: 0xd8d0a0,
    w: 1.05, legH: 0.46, torsoH: 0.58, head: 1.15, headW: 1.1, hunch: 0.45, headFwd: 1.6, headDown: -0.2, arms: 'cast', stride: 0.4, gait: 0.8, jaw: 0.4,
    extra: (J, P, L) => {
      P(J.head, 0, 0.06, 0.34, 0.3, 0.18, 0.32, 0x4a6a2a); // focinho de jacaré
      P(J.jaw, 0, -0.04, 0.32, 0.28, 0.08, 0.34, 0x3a5a22);
      for (const x of [-0.1, 0, 0.1]) { P(J.head, x, -0.04, 0.46, 0.03, 0.06, 0.03, TEETH); P(J.jaw, x + 0.05, 0.02, 0.44, 0.03, 0.06, 0.03, TEETH); }
      for (let i = 0; i < 7; i++) P(J.head, -0.24 + i * 0.08, 0.38, -0.1, 0.08, 0.3, 0.08, 0xe0d070, -0.5, (i - 3) * 0.15); // cabelo palha amarela
      P(J.torso, 0, -0.12, 0, 0.62, 0.42, 0.42, 0x3a2a4a); // vestido de bruxa
      for (let i = 0; i < 4; i++) P(J.torso, 0, J.tH * 0.9 - i * 0.2, -0.18, 0.1, 0.12, 0.08, 0x3a5a22, -0.4); // espinhos de jacaré
      for (const [x, y] of [[-0.2, 0.3], [0.2, 0.45]]) { P(J.torso, x, y, 0.17, 0.04, 0.1, 0.04, 0xe8e0c8); L(J.torso, x, y + 0.06, 0.17, 0.1, 0.04, 0.1, 0xb0ff40); } // fungos
    },
  }),
  ff_mula: Q({
    c1: 0x3a1e14, c2: 0x4a2a1a, belly: 0x2a140e, leg: 0x2a1410, foot: 0x1a1a1a, eye: 0xff6a10, h: 0.8, len: 1.15, w: 0.44, head: 0.001, gait: 1.2, legW: 0.15,
    extra: (J, P, L) => {
      const f = 0.14 + Math.abs(Math.sin(J.t * 12)) * 0.1;
      P(J.body, 0, 0.2, J.Lg * 0.5, 0.24, 0.3, 0.2, 0x3a1e14, -0.4); // pescoço cortado
      L(J.body, 0, 0.42, J.Lg * 0.56, 0.26, f * 3, 0.26, 0xff6a10); // fogo no lugar da cabeça
      L(J.body, 0, 0.62, J.Lg * 0.58, 0.14, f * 2, 0.14, 0xffd040);
      P(J.body, 0, 0.22, -0.05, 0.5, 0.06, 0.6, 0x8a1a1a); // sela vermelha
      P(J.body, 0, 0.18, -0.05, 0.54, 0.18, 0.04, 0xffc107);
      for (let i = 0; i < 3; i++) L(J.body, 0, 0.1 + i * 0.06, -J.Lg * 0.58 - i * 0.08, 0.1, 0.1, 0.1, 0xff6a10); // cauda de fogo
    },
  }),
  ff_lobisomem: R2({
    skin: 0x4a4030, shirt: 0x4a4030, pants: 0x3a2a1e, boots: 0x2a2018, arm: 0x4a4030, hands: 0x3a3226, eye: 0xffe040, brow: 0x2a2418, jawC: 0x3a3226, claw: 0xe0d8c0,
    w: 1.25, chest: 1.35, depth: 1.15, legW: 1.1, legH: 0.52, torsoH: 0.66, head: 0.95, hunch: 0.5, headFwd: 1.5, headDown: -0.3, arms: 'blades', armW: 1.15, hand: 1.3, stride: 0.75, gait: 1.15, jaw: 0.4, knee: 0.45,
    extra: (J, P, L) => {
      P(J.head, 0, 0.08, 0.34, 0.24, 0.18, 0.32, 0x4a4030); // focinho
      P(J.head, 0, 0.12, 0.5, 0.1, 0.06, 0.04, 0x0a0a0a);
      P(J.jaw, 0, -0.02, 0.32, 0.22, 0.06, 0.3, 0x3a3226);
      for (const x of [-0.08, 0.08]) { P(J.head, x, -0.02, 0.46, 0.035, 0.1, 0.035, TEETH); P(J.jaw, x, 0.04, 0.42, 0.035, 0.08, 0.035, TEETH); }
      for (const sg of [-1, 1]) P(J.head, sg * 0.16, 0.42, -0.04, 0.1, 0.24, 0.08, 0x3a3226, -0.2, sg * -0.25); // orelhas
      for (let i = 0; i < 5; i++) P(J.torso, -0.24 + i * 0.12, J.tH * 0.95, -0.16, 0.1, 0.18, 0.1, 0x3a3226, -0.6); // pelo eriçado
      P(J.torso, 0, J.tH * 0.62, 0.17, 0.34, 0.3, 0.03, 0x6a5a44); // peito
      P(J.torso, 0.14, J.tH * 0.4, 0.18, 0.12, 0.03, 0.02, 0x7aff40); // infecção
      P(J.torso, 0, -0.06, -0.24, 0.1, 0.1, 0.4, 0x4a4030, -0.6); // cauda
    },
  }),
  ff_boto: (B, G, b, z, col, t) => {
    const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
    const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
    const sw = Math.sin((z.walk || 0) * 1.4 + t * 2);
    const body = joint(b, 0, 0.62 + sw * 0.05, 0, -0.1, 0, 0);
    // tronco humanoide sobre corpo de boto (boto encantado, de chapéu)
    P(body, 0, 0, 0, 0.5, 0.44, 0.9, 0xc88a9a);
    P(body, 0, -0.18, 0.02, 0.4, 0.1, 0.8, 0xe8c8d0);
    P(body, 0, 0.28, -0.05, 0.08, 0.26, 0.24, 0xa86a7a, -0.3); // barbatana dorsal
    const head = joint(body, 0, 0.12, 0.46, -0.15, 0, 0);
    P(head, 0, 0.04, 0.12, 0.42, 0.36, 0.34, 0xc88a9a);
    P(head, 0, -0.04, 0.42, 0.16, 0.12, 0.34, 0xd89aaa); // bico longo
    const jaw = joint(head, 0, -0.1, 0.24, 0.15 + (z.state === 'spit' || z.attackT > 0 ? 0.45 : 0), 0, 0);
    P(jaw, 0, -0.02, 0.2, 0.14, 0.05, 0.36, 0xe8c8d0);
    for (const x of [-0.04, 0.04]) P(jaw, x, 0.02, 0.32, 0.025, 0.04, 0.025, TEETH);
    for (const sg of [-1, 1]) { P(head, sg * 0.16, 0.12, 0.24, 0.08, 0.06, 0.02, 0x0a0a0a); L(head, sg * 0.16, 0.12, 0.25, 0.05, 0.04, 0.02, 0x9affff); }
    P(head, 0, 0.26, 0.04, 0.6, 0.04, 0.56, 0xf0ece0); // chapéu branco
    P(head, 0, 0.36, 0.04, 0.34, 0.18, 0.32, 0xf0ece0);
    P(head, 0, 0.3, 0.04, 0.35, 0.04, 0.33, 0x2a2a2a);
    for (const sg of [-1, 1]) { const fin = joint(body, sg * 0.24, -0.14, 0.2, 0.3, 0, sg * (0.6 + sw * 0.3)); P(fin, sg * 0.14, 0, 0, 0.3, 0.05, 0.2, 0xa86a7a); }
    const tail = joint(body, 0, 0, -0.46, sw * 0.4, 0, 0);
    P(tail, 0, 0, -0.18, 0.3, 0.26, 0.38, 0xb87a8a);
    P(tail, 0, 0, -0.42, 0.66, 0.06, 0.22, 0xa86a7a);
    for (let i = 0; i < 3; i++) L(b, Math.sin(t * 2 + i * 2) * 0.4, 0.05, Math.cos(t * 2 + i * 2) * 0.4, 0.08, 0.02, 0.08, 0x29b6f6); // água em volta
  },
  ff_caipora: R2({
    skin: 0x6a4a2a, shirt: 0x2a4a1e, pants: 0x2a3a18, boots: 0x3a2a18, arm: 0x6a4a2a, hands: 0x6a4a2a, eye: 0x9aff40, brow: 0x2a1a0a,
    w: 1.05, legH: 0.5, torsoH: 0.62, head: 0.95, hunch: 0.2, arms: 'reach', stride: 0.5, jaw: 0.2,
    extra: (J, P, L) => {
      P(J.head, 0, 0.12, 0.24, 0.34, 0.3, 0.03, 0x8a6a3a); // máscara de casca
      for (const sg of [-1, 1]) L(J.head, sg * 0.09, 0.18, 0.26, 0.07, 0.05, 0.02, 0x9aff40);
      for (let i = 0; i < 5; i++) P(J.head, -0.2 + i * 0.1, 0.42 + (i % 2) * 0.1, -0.04, 0.08, 0.3, 0.06, 0x3a8a2a, -0.2, (i - 2) * 0.2); // cocar de folhas
      P(J.torso, 0, J.tH * 0.6, 0.0, 0.66, 0.5, 0.4, 0x3a5a22); // manto de musgo
      for (let i = 0; i < 4; i++) P(J.torso, -0.24 + i * 0.16, J.tH * 0.25, 0.2, 0.1, 0.2, 0.03, 0x2a4a1e, 0.2);
      P(J.torso, 0, J.tH * 0.4, -0.24, 0.2, 0.2, 0.2, 0x5a3a1a); // cabaça
      const st = J.arms[0].el; // zarabatana/cajado
      P(st, 0, -0.1, 0.12, 0.06, 1.1, 0.06, 0x5a3a1a);
      L(st, 0, 0.46, 0.12, 0.1, 0.1, 0.1, 0x9aff40);
    },
  }),
  ff_boitata: (B, G, b, z, col, t) => drawSnakeV2(B, G, b, z, col, t, {
    c1: 0x8a2a10, c2: 0x5a1a0a, eye: 0xffe040, glow: 0xff6a10, n: 10,
    extra: (J, P, L) => {
      const f = 0.1 + Math.abs(Math.sin(t * 10)) * 0.08;
      for (const sg of [-1, 1]) L(J.head, sg * 0.13, 0.15, 0.3, f, f, f, 0xffd040); // olhos de fogo
      for (let i = 0; i < 4; i++) L(J.head, -0.12 + i * 0.08, 0.2 + f, -0.05 - i * 0.04, 0.06, f * 2, 0.06, 0xff8a20); // crista de chamas
    },
  }),
};
Object.assign(BODIES, V3);

// ===== REWORK V2 — lote 4: Cemitério Naval (substitui os modelos de blocos parados)
const NV_SK = 0x5a9a7a; // pele de afogado
function drawNvChestV2(B, G, base, z, col, t) { // Baú Devorador: tampa-mandíbula, língua, perninhas
  const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const g = (z.walk || 0) * 1.6, lunge = z.state === 'lunge' ? 1 : 0, atk = z.attackT > 0 ? 1 : 0;
  const hop = Math.abs(Math.sin(g)) * 0.08 + lunge * 0.15;
  for (const [x, zz, ph] of [[0.26, 0.2, 0], [-0.26, 0.2, Math.PI], [0.26, -0.2, Math.PI], [-0.26, -0.2, 0]]) {
    const leg = joint(base, x, 0.24 + hop, zz, Math.sin(g + ph) * 0.6, 0, 0);
    P(leg, 0, -0.12, 0, 0.1, 0.24, 0.1, 0x3a2414);
    P(leg, 0, -0.24, 0.04, 0.14, 0.05, 0.18, 0x2a1a0e);
  }
  const box = joint(base, 0, 0.42 + hop, 0, 0, 0, Math.sin(g) * 0.05);
  P(box, 0, 0, 0, 0.8, 0.36, 0.54, 0x8a4a1e);
  for (const x of [-0.3, 0, 0.3]) P(box, x, 0, 0, 0.06, 0.38, 0.56, 0x5a3a20); // ripas de ferro
  P(box, 0, 0.2, 0.0, 0.84, 0.06, 0.58, 0x3a2a1a);
  for (let i = 0; i < 6; i++) P(box, -0.3 + i * 0.12, 0.2, 0.27, 0.05, 0.08, 0.03, TEETH); // dentes de baixo
  L(box, 0, 0.12, 0.05, 0.36, 0.06, 0.3, 0xff3a2a); // boca brilhando
  const lid = joint(box, 0, 0.2, -0.27, -(0.35 + atk * 0.5 + lunge * 0.5 + Math.max(0, Math.sin(t * 2)) * 0.15), 0, 0);
  P(lid, 0, 0.1, 0.27, 0.82, 0.18, 0.56, 0x7a3e18);
  P(lid, 0, 0.2, 0.27, 0.6, 0.06, 0.5, 0x8a4a1e);
  for (let i = 0; i < 6; i++) P(lid, -0.3 + i * 0.12, 0.0, 0.53, 0.05, 0.09, 0.03, TEETH);
  for (const sg of [-1, 1]) { P(lid, sg * 0.18, 0.12, 0.555, 0.12, 0.08, 0.02, 0x0a0a0a); L(lid, sg * 0.18, 0.12, 0.565, 0.08, 0.05, 0.02, 0xffd040); } // olhos na tampa
  P(lid, 0, 0.12, 0.55, 0.1, 0.12, 0.03, 0xffc860); // fechadura
  const tg = joint(box, 0, 0.12, 0.1, -0.2 - lunge * 0.5 + Math.sin(t * 5) * 0.15, 0, 0);
  P(tg, 0, 0, 0.18, 0.18, 0.05, 0.36, 0xc83a5a); // língua
  for (const [x, zz] of [[-0.2, -0.1], [0.24, 0.08]]) L(box, x, 0.26, zz, 0.08, 0.06, 0.08, 0xffd040); // moedas
}
function drawNvCrabV2(B, G, base, z, col, t) { // Caranguejo: 6 patas articuladas, pinças com dedo móvel, olhos em haste
  const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const g = (z.walk || 0) * 2, atk = z.attackT > 0 ? 1 : 0;
  const body = joint(base, 0, 0.42 + Math.abs(Math.sin(g)) * 0.03, 0, 0, 0, Math.sin(g) * 0.06);
  P(body, 0, 0, 0, 0.9, 0.26, 0.62, 0xd84a2a);
  P(body, 0, 0.12, -0.02, 0.7, 0.1, 0.5, 0xe86a3a);
  for (const x of [-0.24, 0, 0.24]) P(body, x, 0.18, -0.05, 0.12, 0.06, 0.2, 0xffe0a0); // espinhos claros
  for (const sg of [-1, 1]) {
    const st = joint(body, sg * 0.14, 0.12, 0.26, -0.2 + Math.sin(t * 3 + sg) * 0.15, 0, 0);
    P(st, 0, 0.12, 0, 0.05, 0.24, 0.05, 0xc83a20);
    P(st, 0, 0.26, 0, 0.1, 0.1, 0.1, 0x1a1a1a);
    L(st, 0, 0.26, 0.04, 0.06, 0.06, 0.04, 0xffd040);
    for (let i = 0; i < 3; i++) { // patas
      const a = Math.sin(g + i * 2 + (sg > 0 ? 0 : Math.PI)) * 0.4;
      const hip = joint(body, sg * 0.42, -0.02, 0.18 - i * 0.2, 0, a, sg * -0.5);
      P(hip, sg * 0.16, 0, 0, 0.32, 0.07, 0.07, 0xc83a20);
      const kn = joint(hip, sg * 0.32, 0, 0, 0, 0, sg * -1.1);
      P(kn, sg * 0.14, 0, 0, 0.3, 0.06, 0.06, 0xb83018);
    }
    const arm = joint(body, sg * 0.4, 0.02, 0.3, -0.3 - atk * 0.5, sg * -0.4, 0);
    P(arm, 0, 0, 0.16, 0.12, 0.12, 0.3, 0xc83a20);
    const claw = joint(arm, 0, 0, 0.34, 0, 0, 0);
    P(claw, 0, 0.02, 0.14, 0.26, 0.2, 0.3, 0xe84a2a);
    const fing = joint(claw, 0, -0.08, 0.06, 0.3 + atk * 0.5 + Math.max(0, Math.sin(t * 4)) * 0.2, 0, 0);
    P(fing, 0, -0.03, 0.14, 0.18, 0.08, 0.26, 0xf06a3a);
    P(claw, 0, 0.1, 0.3, 0.2, 0.06, 0.1, 0xffe0a0);
  }
  P(body, 0, -0.08, 0.32, 0.3, 0.06, 0.04, 0x5a1010); // boca
}
function drawNvOctopusV2(B, G, base, z, col, t) { // Polvo: cabeça bulbosa pulsante, 8 tentáculos de 3 segmentos
  const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const pulse = 1 + Math.sin(t * 3) * 0.05, spit = z.state === 'spit' || z.attackT > 0 ? 1 : 0;
  const head = joint(base, 0, 0.62, 0, -0.15, 0, Math.sin(t * 1.5) * 0.06);
  P(head, 0, 0.34, -0.06, 0.66 * pulse, 0.62 * pulse, 0.66 * pulse, 0x5a3aa8);
  P(head, 0, 0.66, -0.12, 0.48, 0.2, 0.5, 0x6a4ab8);
  for (const [x, y] of [[-0.2, 0.5], [0.22, 0.4], [0.05, 0.62]]) P(head, x, y, 0.26, 0.08, 0.08, 0.04, 0x8a6ad8); // manchas
  for (const sg of [-1, 1]) {
    P(head, sg * 0.18, 0.2, 0.3, 0.18, 0.18, 0.06, 0xf0e8c0);
    P(head, sg * 0.18, 0.2, 0.335, 0.1, 0.14, 0.02, 0x0a0a0a); // pupila horizontal
    L(head, sg * 0.18, 0.24, 0.34, 0.04, 0.03, 0.02, 0xffffff);
  }
  P(head, 0, 0.02, 0.32, 0.16, 0.12 + spit * 0.08, 0.1, 0x2a1a4a); // sifão
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    let seg = joint(base, Math.sin(a) * 0.26, 0.42, Math.cos(a) * 0.26, 0, a, 0);
    for (let k = 0; k < 3; k++) {
      seg = joint(seg, 0, 0, k ? 0.2 : 0, 0.55 + Math.sin(t * 3 + i + k) * 0.35, 0, 0);
      P(seg, 0, 0, 0.1, 0.16 - k * 0.04, 0.12 - k * 0.03, 0.24, k % 2 ? 0x4a2a98 : 0x5a3aa8);
      if (k < 2) P(seg, 0, -0.06 + k * 0.01, 0.1, 0.08, 0.03, 0.08, 0xe0b0e0); // ventosas
    }
  }
}
function drawNvFishV2(B, G, base, z, col, t, o) { // peixe articulado (Peixe-Lanterna, Tubarão)
  const P = (m, x, y, zz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, x, y, zz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  const L = (m, x, y, zz, sx, sy, sz, c) => G.part(m, x, y, zz, 0, 0, 0, 0, 0, sx, sy, sz, c);
  const sw = Math.sin((z.walk || 0) * 1.5 + t * 2), lunge = z.state === 'lunge' ? 1 : 0, bite = z.attackT > 0 || z.state === 'spit' || lunge ? 1 : 0;
  const body = joint(base, 0, o.h + Math.sin(t * 2) * 0.04, 0, -lunge * 0.2, sw * 0.12, 0);
  P(body, 0, 0, 0, o.w, o.bh, o.len, o.c1);
  P(body, 0, -o.bh * 0.32, 0.02, o.w * 0.86, o.bh * 0.4, o.len * 0.9, o.belly);
  P(body, 0, o.bh * 0.55, -o.len * 0.05, 0.06, o.fin, o.len * 0.3, o.c2, -0.3); // barbatana dorsal
  const head = joint(body, 0, 0, o.len / 2, 0, -sw * 0.08, 0);
  P(head, 0, 0.02, o.hl / 2, o.w * 0.92, o.bh * 0.84, o.hl, o.c1);
  for (const sg of [-1, 1]) { P(head, sg * o.w * 0.46, o.bh * 0.2, o.hl * 0.6, 0.02, 0.1, 0.1, 0x0a0a0a); L(head, sg * o.w * 0.47, o.bh * 0.2, o.hl * 0.6, 0.02, 0.06, 0.06, o.eye); }
  const jaw = joint(head, 0, -o.bh * 0.2, o.hl * 0.1, 0.15 + bite * 0.55 + Math.max(0, Math.sin(t * 2.5)) * 0.1, 0, 0);
  P(jaw, 0, -0.04, o.hl * 0.5, o.w * 0.8, 0.08, o.hl * 0.95, o.belly);
  for (let i = 0; i < 5; i++) { const x = -o.w * 0.32 + i * o.w * 0.16; P(head, x, -o.bh * 0.16, o.hl * 0.98, 0.04, 0.1, 0.03, TEETH); P(jaw, x + 0.03, 0.02, o.hl * 0.96, 0.04, 0.09, 0.03, TEETH); }
  L(head, 0, -o.bh * 0.05, o.hl * 0.6, o.w * 0.6, 0.04, o.hl * 0.6, 0x8a1010);
  for (const sg of [-1, 1]) { const pf = joint(body, sg * o.w * 0.5, -o.bh * 0.2, o.len * 0.2, 0.2, 0, sg * (0.7 + sw * 0.3)); P(pf, sg * 0.16, 0, 0, 0.32, 0.04, 0.2, o.c2); }
  const tail = joint(body, 0, 0, -o.len / 2, 0, sw * 0.6, 0);
  P(tail, 0, 0, -0.18, o.w * 0.5, o.bh * 0.5, 0.36, o.c1);
  P(tail, 0, 0, -0.42, 0.06, o.bh * 1.4, 0.22, o.c2);
  if (o.extra) o.extra({ body, head, jaw, t, sw, bite }, P, L);
}
Object.assign(BODIES, {
  nv_pirate: R2({
    skin: NV_SK, shirt: 0x2c3a40, sleeve: 0x2c3a40, arm: NV_SK, pants: 0x2c3c4c, shin: 0x3a3632, boots: 0x2a2622, hands: NV_SK, eye: 0x70f0ff, brow: 0x3a2a18,
    w: 1.0, legH: 0.52, torsoH: 0.6, head: 0.95, hunch: 0.15, arms: 'blades', armW: 0.9, noClaws: true, jaw: 0.3, stride: 0.6,
    extra: (J, P, L) => {
      P(J.head, 0, 0.36, 0, 0.62, 0.08, 0.52, 0x1e1a16); // tricórnio: aba
      P(J.head, 0, 0.44, -0.02, 0.4, 0.16, 0.38, 0x1e1a16);
      for (const sg of [-1, 1]) P(J.head, sg * 0.28, 0.42, 0.06, 0.12, 0.12, 0.2, 0x1e1a16, 0, sg * -0.4); // pontas dobradas
      P(J.head, 0, 0.44, 0.2, 0.12, 0.1, 0.02, 0xe8e0c8); // caveira
      P(J.head, 0, 0.3, 0.0, 0.48, 0.05, 0.46, 0xb01c1c); // bandana
      P(J.head, -0.1, 0.19, 0.245, 0.14, 0.11, 0.03, 0x0a0a0a); // tapa-olho
      P(J.head, 0, 0.26, 0.2, 0.5, 0.025, 0.02, 0x0a0a0a, 0, -0.3);
      P(J.jaw, 0, -0.1, 0.18, 0.34, 0.14, 0.1, 0x3a2a18); // barba
      P(J.head, 0, 0.06, 0.25, 0.24, 0.04, 0.03, 0x3a2a18); // bigode
      P(J.torso, 0, J.tH * 0.35, 0.0, 0.66, 0.84, 0.4, 0x2c3a40); // casaco longo
      for (let i = 0; i < 4; i++) P(J.torso, -0.24 + i * 0.16, -0.08 - (i % 2) * 0.06, -0.12, 0.12, 0.14, 0.18, 0x24323a); // barra rasgada
      P(J.torso, 0, J.tH * 0.62, 0.165, 0.18, 0.5, 0.02, 0x9aa8a0); // camisa
      P(J.torso, 0, J.tH * 0.25, 0.0, 0.7, 0.08, 0.44, 0x2c2620); // cinto
      P(J.torso, 0, J.tH * 0.25, 0.225, 0.14, 0.1, 0.02, 0xffc860); // fivela
      P(J.torso, -0.32, J.tH * 0.15, 0.05, 0.06, 0.4, 0.08, 0x2a1a0e, 0.3); // bainha
      P(J.torso, 0.25, J.tH * 0.5, 0.17, 0.05, 0.3, 0.02, 0x3a5a3a); // algas
      P(J.arms[1].el, 0, -0.5, 0.1, 0.04, 0.5, 0.08, 0x9aa4b2, 0.5); // sabre
      P(J.arms[1].el, 0, -0.28, 0.06, 0.16, 0.04, 0.08, 0xffc860);
      P(J.arms[0].el, 0, -0.34, 0.06, 0.04, 0.14, 0.04, 0xa8b0b8); // gancho
      P(J.arms[0].el, 0, -0.42, 0.12, 0.04, 0.04, 0.14, 0xa8b0b8);
    },
  }),
  nv_harpooner: R2({
    skin: NV_SK, shirt: 0xe0b020, sleeve: 0xe0b020, arm: NV_SK, pants: 0x2a3a4a, boots: 0x1a1a1a, hands: NV_SK, eye: 0x70f0ff,
    w: 0.95, legH: 0.54, torsoH: 0.58, head: 0.92, hunch: 0.2, arms: 'reach', armW: 0.9, noClaws: true, jaw: 0.2, stride: 0.55,
    extra: (J, P, L) => {
      P(J.head, 0, 0.36, -0.06, 0.56, 0.12, 0.6, 0xe0b020); // chapéu sueste
      P(J.head, 0, 0.44, 0.0, 0.4, 0.12, 0.4, 0xe0b020);
      P(J.jaw, 0, -0.12, 0.16, 0.34, 0.2, 0.1, 0x3a6a3a); // barba de algas
      for (const x of [-0.12, 0, 0.12]) P(J.jaw, x, -0.26, 0.16, 0.05, 0.12, 0.04, 0x2a5a2a);
      P(J.torso, 0, J.tH * 0.3, 0.0, 0.6, 0.8, 0.38, 0xe0b020); // capa de chuva longa
      for (let i = 0; i < 3; i++) P(J.torso, 0, J.tH * 0.4 + i * 0.12, 0.2, 0.04, 0.04, 0.02, 0x1a1a1a); // botões
      const h = J.arms[0].el; // arpão com corrente
      P(h, 0, -0.1, 0.14, 0.05, 1.3, 0.05, 0x6a4a28, 0.3);
      P(h, 0, 0.58, 0.34, 0.14, 0.18, 0.04, 0xa8b0b8, 0.3);
      for (let i = 0; i < 5; i++) P(h, 0.04, -0.3 - i * 0.08, 0.02 - i * 0.04, 0.04, 0.05, 0.04, 0x8a909a);
    },
  }),
  nv_ghost: R2({
    skin: 0xd8e8f0, shirt: 0xe8f0f8, pants: 0x9ac8e8, tail2: 0x7ab0d8, arm: 0x9ac8e8, hands: 0xb0e0ff, eye: 0x40e0ff, brow: 0x7ab0d8, claw: 0x9affff,
    noLegs: true, legH: 0.55, w: 0.9, torsoH: 0.56, head: 0.95, hunch: 0.1, arms: 'reach', armW: 0.85, jaw: 0.5,
    extra: (J, P, L) => {
      for (let i = 0; i < 4; i++) P(J.torso, 0, J.tH * 0.3 + i * 0.1, 0.165, 0.56, 0.04, 0.02, 0x2a5aa8); // camisa listrada
      P(J.head, 0, 0.36, 0, 0.42, 0.1, 0.42, 0xf0f0f0); // gorro de marinheiro
      P(J.head, 0, 0.42, 0.0, 0.48, 0.03, 0.48, 0x2a5aa8);
      P(J.torso, 0, J.tH * 0.95, 0.12, 0.3, 0.06, 0.1, 0xb01c1c); // lenço
      L(J.torso, 0, J.tH * 0.6, -0.17, 0.3, 0.3, 0.02, 0x9affff); // brilho espectral
      for (let i = 0; i < 3; i++) L(J.torso, Math.sin(J.t * 2 + i) * 0.3, -0.5 - i * 0.1, Math.cos(J.t * 2 + i) * 0.2, 0.1, 0.06, 0.1, 0xb0f0ff); // névoa
    },
  }),
  nv_brute: R2({
    skin: 0x4a7a6a, shirt: 0x3a5a4a, arm: 0x4a7a6a, pants: 0x2a3a3a, boots: 0x1a2222, hands: 0x3a5a4a, eye: 0x70f0ff, brow: 0x2a3a3a,
    w: 1.5, chest: 1.3, depth: 1.25, legW: 1.4, legH: 0.44, torsoH: 0.7, head: 0.75, headFwd: 1.6, headDown: 0.05, hunch: 0.35, arms: 'brawl', armW: 1.6, hand: 1.7, noClaws: true, stride: 0.4, gait: 0.7, jaw: 0.25,
    extra: (J, P, L) => {
      for (const [x, y] of [[-0.25, 0.25], [0.2, 0.4], [0.05, 0.15], [0.3, 0.55], [-0.15, 0.55]]) P(J.torso, x, y, 0.2, 0.1, 0.1, 0.06, 0xd8d0b8); // cracas
      for (let i = 0; i < 6; i++) P(J.torso, -0.4 + i * 0.16, J.tH * 0.8 - i * 0.08, 0.2, 0.06, 0.08, 0.06, 0x6a6a6a); // corrente cruzada
      P(J.torso, 0, J.tH * 0.98, -0.12, 0.6, 0.18, 0.3, 0x2a4a3a); // corcova
      const a = J.arms[1].el; // âncora gigante
      P(a, 0, -0.3, 0.1, 0.1, 1.1, 0.1, 0x4a4a52);
      P(a, 0, -0.84, 0.1, 0.7, 0.1, 0.12, 0x4a4a52);
      for (const sg of [-1, 1]) P(a, sg * 0.32, -0.74, 0.1, 0.1, 0.2, 0.12, 0x4a4a52, 0, sg * 0.4);
      P(a, 0, 0.24, 0.1, 0.24, 0.24, 0.06, 0x4a4a52);
    },
  }),
  nv_mimic: drawNvChestV2,
  nv_crab: drawNvCrabV2,
  nv_octopus: drawNvOctopusV2,
  nv_angler: (B, G, b, z, col, t) => drawNvFishV2(B, G, b, z, col, t, {
    c1: 0x2a5a6a, c2: 0x1e4a58, belly: 0x5a8a8a, eye: 0xffe040, h: 0.55, w: 0.62, bh: 0.56, len: 0.6, hl: 0.42, fin: 0.26,
    extra: (J, P, L) => {
      const lure = joint(J.head, 0, 0.3, 0.1, -0.5 + Math.sin(J.t * 2) * 0.15, 0, 0); // haste com isca luminosa
      P(lure, 0, 0.2, 0, 0.04, 0.4, 0.04, 0x1e4a58);
      const p = 0.1 + Math.abs(Math.sin(J.t * 4)) * 0.05;
      L(lure, 0, 0.44, 0.06, p, p, p, 0x9affff);
    },
  }),
  nv_shark: (B, G, b, z, col, t) => drawNvFishV2(B, G, b, z, col, t, {
    c1: 0x4a6a80, c2: 0x3a5a70, belly: 0xe0e8ec, eye: 0xff3a2a, h: 0.5, w: 0.5, bh: 0.46, len: 1.05, hl: 0.48, fin: 0.5,
    extra: (J, P) => { for (let i = 0; i < 3; i++) P(J.head, 0.25, 0.02, 0.05 - i * 0.07, 0.02, 0.18, 0.025, 0x1e2a34); }, // guelras
  }),
  nv_serpent: (B, G, b, z, col, t) => drawSnakeV2(B, G, b, z, col, t, {
    c1: 0x2a8a6a, c2: 0x1e6a50, eye: 0xffe040, glow: 0x5affc8, n: 8,
    extra: (J, P) => { for (let i = 0; i < 4; i++) P(J.head, 0, 0.22, 0.1 - i * 0.1, 0.04, 0.16 - i * 0.02, 0.08, 0x9affd8, -0.4); }, // crista
  }),
});

export function drawEnemy(B, G, z, t) {
  const type = z.type;
  const def = z.def;
  const flash = z.hurtT > 0;
  const col = (c) => (flash ? 0xffffff : c);
  const body = BODIES[type];
  const dead = !z.alive;
  const k = dead ? Math.min(1, z.deadT * 4) : 0;
  const sink = dead ? Math.max(0, z.deadT - 2.5) * 0.25 : 0;
  const rise = z.rise * 1.4 * z.scale;
  if (!body) {
    const look = z.look;
    if (dead) {
      drawCharacter(B, z.pos.x, 0.15 * z.scale - sink, z.pos.z, z.fallDir + Math.PI, z.scale, look, { tilt: (-Math.PI / 2) * k, walk: 0, swing: 0, G });
      return;
    }
    const lean = type === 'runner' ? 0.35 : z.state === 'wind' ? 0.4 : z.state === 'charge' || z.state === 'lunge' ? 0.5 : type === 'reaper' ? 0.22 : type === 'brute' ? 0.15 : look.lean ?? 0.1;
    const raise = z.state === 'slam' ? Math.min(1, (0.75 - z.stateT) / 0.45) : z.state === 'cast' ? 1 : 0;
    drawCharacter(B, z.pos.x, -rise, z.pos.z, z.facing, z.scale, look, {
      walk: z.walk, swing: type === 'summoner' ? 0.2 : type === 'reaper' ? (z.state === 'lunge' ? 1.2 : 0.75) : z.state === 'charge' ? 1 : type === 'runner' ? 0.9 : 0.55, hurt: z.hurtT,
      attack: z.attackT > 0 ? Math.sin((z.attackT / 0.35) * Math.PI) : 0, lean, raise,
      headTilt: type === 'armored' || type === 'reaper' ? 0 : Math.sin(z.walk * 0.7) * 0.12, G,
    });
    // brilho extra: pavio do explosivo pisca; cristal do invocador pulsa
    if (type === 'bloater' && Math.sin(t * 22) > 0) G.box(z.pos.x, 1.3 * z.scale, z.pos.z, 0.16, 0.16, 0.16, 0xffe060, t * 9);
    return;
  }
  const baseFlyY = z.def?.hover ?? 1.4;
  let y = -rise;
  if (z.def?.fly) y = dead ? Math.max(0.15, (z.flyY ?? baseFlyY) * (1 - k)) : z.flyY ?? baseFlyY;
  const ghost = type === 'specter' || type === 'rm_spirit';
  const ry = dead ? z.fallDir + Math.PI : z.facing;
  const roll = dead ? (type === 'spider' ? Math.PI * k : ghost ? 0.12 * k : (-Math.PI / 2) * k) : 0;
  let tilt = roll;
  if (!dead && (type === 'dog' || body === drawHound || body === drawBeast) && z.state === 'lunge') tilt = 0.15;
  if (!dead && type === 'bat') tilt = 0.25 + (z.attackT > 0 ? 0.35 : 0);
  if (!dead && type === 'wasp') tilt = 0.12;
  const sc = ghost && dead ? z.scale * Math.max(0.2, 1 - z.deadT * 0.55) : z.scale;
  const m = baseMatrix(z.pos.x, y + (dead && type === 'spider' ? 0.9 * k : 0) - sink, z.pos.z, ry, sc, tilt);
  _base.copy(m);
  body(B, G, _base, dead ? { ...z, walk: 0, attackT: 0 } : z, col, dead ? 0 : t);
}


// appended necropole models
function drawNcVampire(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.9, 0, 0.3, 0.6, 0.25, 0x1a0a1a); // corpo
  P(base, 0, 1.35, 0, 0.28, 0.28, 0.28, 0xe8d8c8); // cabeça
  P(base, 0, 1.05, -0.15, 0.34, 0.05, 0.1, 0x2a0a1a); // capa
  for (const sg of [1,-1]) P(base, sg*0.12, 1.32, 0.16, 0.04, 0.04, 0.02, 0xff2a2a);
}
function drawNcNosferatu(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.85, 0, 0.22, 0.55, 0.2, 0x4a3a4a);
  P(base, 0, 1.25, 0, 0.24, 0.24, 0.22, 0x9a8a9a);
  for (const sg of [1,-1]) P(base, sg*0.35, 0.95, 0, 0.3, 0.02, 0.25, 0x3a2a3a, 0, sg*0.4); // asas
}
function drawNcKnight(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.9, 0, 0.4, 0.7, 0.35, 0x5a4a3a); // armadura
  P(base, 0, 1.35, 0, 0.26, 0.1, 0.26, 0x3a2a1a); // sem cabeça (pescoço cortado)
  P(base, 0.3, 0.8, 0.2, 0.08, 0.8, 0.08, 0x7a6a5a); // espada
}
function drawNcExecutioner(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.95, 0, 0.45, 0.8, 0.4, 0x3a2a2a);
  P(base, 0, 1.4, 0, 0.3, 0.3, 0.3, 0x2a1a1a); // máscara
  P(base, 0.35, 0.85, 0.1, 0.15, 0.9, 0.15, 0x5a4a4a); // cutelo
}
function drawNcReaper(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 1.0, 0, 0.35, 0.9, 0.3, 0x1a0a2a); // manto
  P(base, 0, 1.5, 0, 0.22, 0.22, 0.22, 0x3a2a4a);
  P(base, 0.3, 1.0, 0.1, 0.06, 1.0, 0.06, 0x6a5a7a); // foice
}
function drawNcBanshee(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 1.0, 0, 0.3, 0.8, 0.25, 0x9a8aaa);
  P(base, 0, 1.45, 0, 0.26, 0.26, 0.26, 0xc8b8d8);
  P(base, 0, 0.6, 0, 0.4, 0.05, 0.4, 0x7a6a8a); // vestido
}
function drawNcAbomination(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.8, 0, 0.7, 0.9, 0.6, 0x6a3a3a);
  P(base, -0.2, 1.3, 0.1, 0.25, 0.25, 0.25, 0x8a5a5a);
  P(base, 0.25, 1.2, -0.1, 0.22, 0.22, 0.22, 0x7a4a4a);
}
function drawNcGargoyle(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.85, 0, 0.4, 0.7, 0.35, 0x7a7a7a);
  P(base, 0, 1.3, 0, 0.3, 0.3, 0.3, 0x5a5a5a);
  for (const sg of [1,-1]) P(base, sg*0.3, 1.0, -0.1, 0.15, 0.4, 0.12, 0x6a6a6a, 0, sg*0.5); // asas de pedra
}
function drawNcPlague(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.9, 0, 0.3, 0.6, 0.25, 0x5a7a3a);
  P(base, 0, 1.35, 0.1, 0.28, 0.28, 0.3, 0x3a4a1a); // máscara bico
  P(base, 0.15, 1.2, 0.25, 0.1, 0.1, 0.15, 0x8a9a5a);
}
function drawNcTombking(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.9, 0, 0.35, 0.7, 0.3, 0xd8c8a0);
  P(base, 0, 1.4, 0, 0.3, 0.15, 0.3, 0x9a8a6a); // coroa quebrada
  P(base, 0.3, 0.9, 0.1, 0.08, 0.8, 0.08, 0xc8b890); // lança
}

// chefes da Necrópole (mesmo padrão B.part dos mobs nc_*)
function drawNcMatriarch(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.9, 0, 0.4, 0.8, 0.3, 0x9a8aaa); // vestido espectral
  P(base, 0, 0.35, 0, 0.55, 0.3, 0.4, 0x6a5a7a); // barra rasgada
  P(base, 0, 1.45, 0, 0.3, 0.3, 0.28, 0xd8d0e8); // rosto
  P(base, 0, 1.55, -0.05, 0.4, 0.35, 0.3, 0x3a2a4a); // véu
  P(base, 0, 1.78, 0, 0.36, 0.08, 0.1, 0xd4a020); // tiara
  for (const sg of [1, -1]) {
    P(base, sg * 0.09, 1.47, 0.15, 0.06, 0.05, 0.02, 0x29b6f6); // olhos
    P(base, sg * 0.32, 1.0, 0.05, 0.1, 0.55, 0.1, 0x9a8aaa, 0, sg * 0.5); // braços
  }
  P(base, 0, 1.35, 0.16, 0.12, 0.08, 0.02, 0x1a0a2a); // boca do grito
}
function drawNcColossus(B, G, base, z, col, t) {
  const P = (m, cx, cy, cz, sx, sy, sz, c, rx = 0, rz = 0) => B.part(m, cx, cy, cz, rx, rz, 0, 0, 0, sx, sy, sz, col(c));
  P(base, 0, 0.95, 0, 0.6, 0.7, 0.42, 0x7a7a7a); // tronco de lápides
  P(base, 0, 1.0, 0.22, 0.3, 0.4, 0.04, 0xd8c8a0); // costelas
  P(base, 0, 1.5, 0, 0.36, 0.3, 0.32, 0xd8c8a0); // crânio
  for (const sg of [1, -1]) {
    P(base, sg * 0.1, 1.52, 0.17, 0.07, 0.06, 0.02, 0x2ecc71); // olhos
    P(base, sg * 0.45, 1.05, 0, 0.22, 0.65, 0.22, 0x5a5a5a); // braços
    P(base, sg * 0.45, 0.62, 0.04, 0.3, 0.24, 0.3, 0x8a8a8a); // punhos de pedra
    P(base, sg * 0.18, 0.32, 0, 0.22, 0.45, 0.24, 0x5a5a5a); // pernas
    P(base, sg * 0.32, 1.42, -0.05, 0.12, 0.3, 0.06, 0x6a6a6a, 0, sg * 0.3); // lápides nos ombros
  }
}
Object.assign(BODIES, { nc_matriarch: drawNcMatriarch, nc_colossus: drawNcColossus });
