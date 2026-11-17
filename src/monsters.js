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
  const look = h ? { zombie: true, ...h } : { zombie: true, skin: OTHER_COLORS[type][0], shirt: OTHER_COLORS[type][1] };
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

const BODIES = { spider: drawSpider, bat: drawBat, dog: drawDog, spore: drawSpore, wasp: drawWasp, specter: drawSpecter };

// ------------------------------------------------------------------ Egito Antigo (só no Templo Antigo)
const GOLD = 0xd4a020;
const GOLD_L = 0xf0c840;
const IMPERIAL = 0x2a4aa0;
const BANDAGE = 0xd8cba0;
const BANDAGE_D = 0xb3a57a;
const JACKAL = 0x22222a;
Object.assign(HUMANS, {
  // Múmia Guerreira: bandagens, armadura danificada, olhos vermelhos e detalhes dourados
  mummy: {
    skin: BANDAGE, shirt: BANDAGE, sleeve: BANDAGE, hands: BANDAGE_D, pants: BANDAGE, boots: 0x7a6a4a, noFace: true, arms: 'reach',
    extras: [
      ...face(0xff3a2a, { brow: BANDAGE_D, mouth: 0x2a1a0a, open: 0.06, fangs: false }),
      // faixas cruzadas na cabeça, no tronco e nas pernas
      ['head', 0, 0.48, 0.278, 0.58, 0.04, 0.02, BANDAGE_D, 0, 0.12],
      ['head', 0, 0.22, 0.278, 0.58, 0.04, 0.02, BANDAGE_D, 0, -0.1],
      ['torso', 0, 0.12, 0.166, 0.56, 0.04, 0.012, BANDAGE_D, 0, 0.2],
      ['torso', 0, 0.3, 0.166, 0.56, 0.04, 0.012, BANDAGE_D, 0, -0.18],
      ...mirror(['legL', 0, -0.15, 0.121, 0.2, 0.04, 0.012, BANDAGE_D, 0, 0.25], ['armL', 0, -0.2, 0.096, 0.18, 0.035, 0.012, BANDAGE_D, 0, 0.3]),
      // colar e cinto dourados, armadura danificada no ombro
      ['torso', 0, 0.5, 0.15, 0.5, 0.08, 0.06, GOLD],
      ['torso', 0, 0.44, 0.17, 0.3, 0.05, 0.03, IMPERIAL],
      ['torso', 0, 0.02, 0, 0.6, 0.07, 0.36, GOLD],
      ['armL', 0.02, -0.04, 0, 0.24, 0.12, 0.25, 0x8a7448],
      // tira de bandagem solta
      ['armR', -0.02, -0.62, 0.02, 0.05, 0.28, 0.02, BANDAGE, 0, 0.2],
    ],
  },
  // Guardião Anúbis: cabeça de chacal, armadura dourada e azul, machado cerimonial
  anubis: {
    skin: JACKAL, shirt: IMPERIAL, sleeve: JACKAL, hands: JACKAL, pants: GOLD, boots: GOLD, noFace: true, arms: 'brawl',
    extras: [
      // focinho, nariz, orelhas altas e olhos luminosos
      ['head', 0, 0.2, 0.38, 0.26, 0.18, 0.26, JACKAL],
      ['head', 0, 0.26, 0.52, 0.1, 0.07, 0.04, 0x0a0a0a],
      ...mirror(['head', 0.17, 0.72, -0.02, 0.11, 0.34, 0.08, JACKAL, 0, -0.12], ['head', 0.17, 0.7, 0.03, 0.05, 0.22, 0.012, GOLD, 0, -0.12]),
      ...mirror(['head', 0.13, 0.36, 0.276, 0.12, 0.05, 0.02, GOLD_L, 0, 0.25, GLOW]),
      // toucado listrado azul e dourado
      ...mirror(['head', 0.29, 0.2, -0.05, 0.04, 0.4, 0.4, IMPERIAL], ['head', 0.3, 0.2, -0.05, 0.02, 0.06, 0.4, GOLD]),
      ['head', 0, 0.2, -0.29, 0.56, 0.42, 0.04, IMPERIAL],
      // colar largo, peitoral e saia dourados
      ['torso', 0, 0.48, 0.12, 0.62, 0.14, 0.14, GOLD],
      ['torso', 0, 0.36, 0.172, 0.26, 0.12, 0.012, GOLD_L, 0, 0, GLOW],
      ['torso', 0, 0.02, 0, 0.62, 0.08, 0.38, GOLD],
      ...mirror(['armL', 0.04, -0.02, 0, 0.3, 0.16, 0.3, GOLD], ['armL', 0, -0.45, 0, 0.22, 0.08, 0.22, GOLD]),
      // machado cerimonial na mão direita
      ['armR', 0, -0.6, 0.08, 0.06, 0.9, 0.06, 0x5a3a20],
      ['armR', 0, -0.25, 0.3, 0.05, 0.36, 0.3, GOLD],
      ['armR', 0, -0.25, 0.44, 0.06, 0.38, 0.04, GOLD_L],
    ],
  },
  // Arqueiro do Deserto: armadura egípcia leve, arco dourado e aljava
  archer: {
    skin: 0xa8845a, shirt: 0xe8dcc0, sleeve: 0xa8845a, hands: 0x8a6a44, pants: 0xe8dcc0, boots: 0x7a5a32, noFace: true, arms: 'reach',
    extras: [
      ...face(0x8aff3a, { brow: 0x3a2a14, open: 0.06, fangs: false }),
      // toucado listrado
      ['head', 0, 0.52, -0.02, 0.6, 0.1, 0.6, IMPERIAL],
      ...mirror(['head', 0.29, 0.28, -0.06, 0.04, 0.34, 0.36, IMPERIAL], ['head', 0.3, 0.28, -0.06, 0.02, 0.05, 0.36, GOLD]),
      ['head', 0, 0.5, 0.29, 0.6, 0.05, 0.02, GOLD],
      // colar e cinto
      ['torso', 0, 0.5, 0.15, 0.5, 0.07, 0.06, GOLD],
      ['torso', 0, 0.02, 0, 0.58, 0.07, 0.36, GOLD],
      // aljava com flechas luminosas nas costas
      ['torso', 0.12, 0.34, -0.24, 0.14, 0.44, 0.12, 0x6a4a28, 0, 0.35],
      ...mirror(['torso', 0.2, 0.62, -0.24, 0.025, 0.14, 0.025, 0x8aff3a, 0, 0.35, GLOW]),
      // arco dourado na mão esquerda
      ['armL', 0, -0.55, 0.16, 0.05, 1.0, 0.05, GOLD],
      ['armL', 0, -0.55, 0.1, 0.012, 0.95, 0.012, 0xeeeeee],
      ['armL', 0, -0.08, 0.16, 0.06, 0.08, 0.06, GOLD_L],
      ['armL', 0, -1.02, 0.16, 0.06, 0.08, 0.06, GOLD_L],
    ],
  },
});

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
  // Sacerdote Profano: manto roxo, cajado cerimonial com cristal violeta
  priest: {
    skin: 0x8a6a4a, shirt: 0x5a2a8a, sleeve: 0x5a2a8a, hands: 0x7a5a3a, pants: 0x4a2272, boots: 0x2a1640, noFace: true, arms: 'reach',
    extras: [
      ...face(0xc070ff, { brow: 0x2a1a14, open: 0.06, fangs: false }),
      // capuz e máscara dourada
      ['head', 0, 0.42, -0.04, 0.64, 0.36, 0.62, 0x4a2272],
      ['head', 0, 0.62, -0.02, 0.4, 0.12, 0.4, 0x4a2272],
      ['head', 0, 0.46, 0.3, 0.5, 0.06, 0.02, GOLD],
      // manto longo com faixa dourada e runas
      ['torso', 0, 0.02, 0, 0.62, 0.3, 0.4, 0x4a2272],
      ['torso', 0, 0.3, 0.172, 0.08, 0.5, 0.012, GOLD],
      ...mirror(['torso', 0.14, 0.26, 0.172, 0.05, 0.05, 0.012, 0xc070ff, 0, 0, GLOW]),
      ...mirror(['legL', 0, -0.2, 0, 0.26, 0.44, 0.28, 0x4a2272]),
      // cajado com cristal violeta
      ['armR', 0, -0.55, 0.12, 0.05, 1.2, 0.05, GOLD],
      ['armR', 0, 0.12, 0.12, 0.16, 0.2, 0.16, 0xc070ff, 0, 0.6, GLOW],
    ],
  },
  // Construto de Areia: blocos de areia, armadura de rocha, núcleo dourado
  construct: {
    skin: 0xd8b878, shirt: 0xc8a060, sleeve: 0xd8b878, hands: 0x8a7458, pants: 0xb8904e, boots: 0x6a5a44, noFace: true, arms: 'brawl',
    extras: [
      ...mirror(['head', 0.13, 0.33, 0.276, 0.12, 0.07, 0.02, GOLD_L, 0, 0.1, GLOW]),
      ['head', 0, 0.5, 0, 0.66, 0.16, 0.66, 0x8a7458],
      ['head', 0.18, 0.2, 0.25, 0.16, 0.14, 0.08, 0xc09858],
      // placas de rocha e núcleo dourado brilhando
      ['torso', 0, 0.3, 0.17, 0.4, 0.4, 0.04, 0x8a7458],
      ['torso', 0, 0.3, 0.2, 0.14, 0.14, 0.02, GOLD_L, 0, 0.785, GLOW],
      ...mirror(['armL', 0.04, -0.02, 0, 0.36, 0.26, 0.36, 0x8a7458], ['armL', 0, -0.52, 0, 0.38, 0.32, 0.38, 0xa88a5a]),
      ['torso', -0.2, 0.08, 0.17, 0.14, 0.12, 0.04, 0xe8c888],
      ['torso', 0.22, 0.48, 0.17, 0.1, 0.1, 0.04, 0xe8c888],
      ...mirror(['legL', 0, -0.3, 0.12, 0.24, 0.18, 0.04, 0x8a7458]),
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
  const neck = joint(base, 0, 0.3, 0.12, -0.5 - up, 0, Math.sin(t * 2) * 0.08);
  P(neck, 0, 0.22, 0, 0.26, 0.5, 0.26, 0xd4a020);
  const head = joint(neck, 0, 0.5, 0.06, 0.5 + up, 0, 0);
  P(head, 0, 0.02, 0.1, 0.36, 0.2, 0.46, 0xd4a020);
  P(head, 0, 0.13, 0.08, 0.3, 0.02, 0.36, 0xa01a14);
  G.part(head, 0.13, 0.08, 0.22, 0, 0, 0, 0, 0, 0.07, 0.05, 0.08, 0xff3a1a);
  G.part(head, -0.13, 0.08, 0.22, 0, 0, 0, 0, 0, 0.07, 0.05, 0.08, 0xff3a1a);
  if (z.attackT > 0 || z.state === 'lunge') P(head, 0, -0.1, 0.32, 0.04, 0.12, 0.02, TEETH);
  // capuz de naja
  P(neck, 0, 0.42, -0.04, 0.5, 0.36, 0.06, 0xb88818);
  P(neck, 0, 0.42, -0.01, 0.2, 0.24, 0.02, 0xa01a14);
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
  L(hd, 0.1, 0.02, 0.225, 0.1, 0.05, 0.02, 0xffffff);
  L(hd, -0.1, 0.02, 0.225, 0.1, 0.05, 0.02, 0xffffff);
}
BODIES.serpent = drawSerpent;
BODIES.phantom = drawPhantom;
OTHER_COLORS.serpent = [0xd4a020, 0xa01a14];
OTHER_COLORS.phantom = [0x3ac8e8, GOLD];

// Desenha um inimigo. z = { type, def, look, pos, facing, scale, walk, hurtT, attackT, state, alive, deadT, fallDir, rise, flyY }
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
    const lean = type === 'runner' ? 0.35 : z.state === 'wind' ? 0.4 : z.state === 'charge' || z.state === 'lunge' ? 0.5 : type === 'reaper' ? 0.22 : type === 'brute' ? 0.15 : 0.1;
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
  const baseFlyY = z.def.hover ?? 1.4;
  let y = -rise;
  if (z.def.fly) y = dead ? Math.max(0.15, (z.flyY ?? baseFlyY) * (1 - k)) : z.flyY ?? baseFlyY;
  const ghost = type === 'specter';
  const ry = dead ? z.fallDir + Math.PI : z.facing;
  const roll = dead ? (type === 'spider' ? Math.PI * k : ghost ? 0.12 * k : (-Math.PI / 2) * k) : 0;
  let tilt = roll;
  if (!dead && type === 'dog' && z.state === 'lunge') tilt = 0.15;
  if (!dead && type === 'bat') tilt = 0.25 + (z.attackT > 0 ? 0.35 : 0);
  if (!dead && type === 'wasp') tilt = 0.12;
  const sc = ghost && dead ? z.scale * Math.max(0.2, 1 - z.deadT * 0.55) : z.scale;
  const m = baseMatrix(z.pos.x, y + (dead && type === 'spider' ? 0.9 * k : 0) - sink, z.pos.z, ry, sc, tilt);
  _base.copy(m);
  body(B, G, _base, dead ? { ...z, walk: 0, attackT: 0 } : z, col, dead ? 0 : t);
}

