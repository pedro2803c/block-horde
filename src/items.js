// Biblioteca de itens do Block Horde: modelos em blocos (chão, mão e vitrine), dados e sorteio.
// O mesmo modelo serve para o coletável no mapa, a arma na mão e o cartão 3D do menu "Itens".

// ---------------------------------------------------------------- armas na mão
// Peça de arma: [f, u, s, lf, lu, ls, cor, brilho?]
// f = para a frente a partir da empunhadura, u = para cima, s = para o lado; l* = tamanhos.
export const GUN_MODELS = {
  pistol: [
    [0.12, 0.03, 0, 0.26, 0.07, 0.08, 0x9a9ea6],
    [0.1, -0.02, 0, 0.22, 0.05, 0.075, 0x2a2a2e],
    [0, -0.09, 0, 0.075, 0.15, 0.07, 0x1c1c20],
    [0.06, -0.065, 0, 0.06, 0.03, 0.03, 0x1c1c20],
    [0.24, 0.07, 0, 0.02, 0.025, 0.02, 0x1c1c20],
  ],
  scythe_soul: [
    [0.0, 0.0, 0, 0.12, 0.4, 0.06, 0x6a5a7a],
    [0.0, 0.3, 0, 0.6, 0.08, 0.06, 0x6a5a7a],
    [0.3, 0.3, 0, 0.15, 0.06, 0.06, 0x8a7a9a],
    [0.0, -0.3, 0, 0.08, 0.3, 0.06, 0x4a3a5a],
  ],
  uzi: [
    [0.14, 0.02, 0, 0.3, 0.09, 0.09, 0x2a2a2e],
    [0.32, 0.03, 0, 0.08, 0.035, 0.035, 0x18181a],
    [0.07, -0.13, 0, 0.05, 0.18, 0.06, 0x18181a],
    [0, -0.08, 0, 0.06, 0.1, 0.07, 0x18181a],
    [-0.08, 0.04, 0, 0.1, 0.03, 0.05, 0x18181a],
  ],
  shotgun: [
    [0.1, 0.01, 0, 0.22, 0.09, 0.09, 0x222226],
    [0.38, 0.035, 0, 0.4, 0.05, 0.06, 0x2e2e34],
    [0.34, -0.025, 0, 0.32, 0.04, 0.05, 0x222226],
    [0.3, -0.035, 0, 0.14, 0.06, 0.075, 0x8a5a2a],
    [0, -0.08, 0, 0.06, 0.09, 0.065, 0x7a4a22],
    [-0.15, -0.03, 0, 0.24, 0.1, 0.07, 0x7a4a22],
  ],
  rifle: [
    [0.16, 0.02, 0, 0.34, 0.1, 0.09, 0xc6b289],
    [0.4, 0.025, 0, 0.16, 0.075, 0.085, 0xb09c70],
    [0.54, 0.03, 0, 0.14, 0.03, 0.03, 0x1a1a1a],
    [0.13, -0.1, 0, 0.07, 0.1, 0.06, 0x1a1a1a],
    [0.17, -0.18, 0, 0.07, 0.08, 0.06, 0x1a1a1a],
    [0, -0.08, 0, 0.06, 0.1, 0.07, 0x2a2a22],
    [-0.13, 0, 0, 0.2, 0.085, 0.07, 0xc6b289],
    [0.12, 0.09, 0, 0.1, 0.04, 0.03, 0x1a1a1a],
  ],
  sniper: [
    [0.2, 0.02, 0, 0.4, 0.09, 0.09, 0x4a5a2a],
    [0.63, 0.03, 0, 0.46, 0.035, 0.035, 0x1e1e1e],
    [0.87, 0.03, 0, 0.05, 0.055, 0.055, 0x111111],
    [0.16, 0.12, 0, 0.28, 0.065, 0.065, 0x161616],
    [0.305, 0.12, 0, 0.015, 0.05, 0.05, 0x40ff60, true],
    [0.1, 0.075, 0, 0.03, 0.03, 0.03, 0x161616],
    [0.22, 0.075, 0, 0.03, 0.03, 0.03, 0x161616],
    [0.1, -0.08, 0, 0.06, 0.07, 0.05, 0x1a1a1a],
    [0, -0.08, 0, 0.06, 0.1, 0.07, 0x1a1a1a],
    [-0.14, -0.01, 0, 0.24, 0.1, 0.075, 0x1a1a1a],
  ],
  rocket: [
    [0.24, 0.05, 0, 0.72, 0.13, 0.13, 0x3a4a3a],
    [0.59, 0.05, 0, 0.05, 0.16, 0.16, 0x2a3a2a],
    [-0.1, 0.05, 0, 0.05, 0.15, 0.15, 0x2a3a2a],
    [0, -0.07, 0, 0.06, 0.1, 0.07, 0x1a1a1a],
    [0.15, 0.14, 0.05, 0.06, 0.05, 0.03, 0x1a1a1a],
  ],
  // ---- expansão do arsenal ----
  lmg: [
    [0.18, 0.02, 0, 0.44, 0.12, 0.11, 0x3a3c34],
    [0.42, 0.03, 0, 0.14, 0.1, 0.1, 0x4a4c44],
    [0.53, 0.03, 0, 0.24, 0.05, 0.05, 0x1e1e1e],
    [0.66, 0.03, 0, 0.04, 0.08, 0.08, 0x111111],
    [0.12, -0.12, 0, 0.16, 0.14, 0.1, 0x5a5e3a],
    [0.12, -0.05, 0.07, 0.1, 0.03, 0.04, 0xe0a830],
    [0, -0.08, 0, 0.06, 0.1, 0.07, 0x1a1a1a],
    [-0.16, 0, 0, 0.22, 0.1, 0.07, 0x3a3c34],
    [0.16, 0.1, 0, 0.14, 0.04, 0.05, 0x1a1a1a],
    [0.56, -0.08, 0.04, 0.02, 0.12, 0.02, 0x1a1a1a],
    [0.56, -0.08, -0.04, 0.02, 0.12, 0.02, 0x1a1a1a],
  ],
  flamer: [
    [0.14, 0.02, 0, 0.36, 0.1, 0.1, 0x5a4a3a],
    [0.42, 0.03, 0, 0.24, 0.06, 0.06, 0x2a2a2a],
    [0.56, 0.03, 0, 0.05, 0.09, 0.09, 0x1a1a1a],
    [0.59, 0.03, 0, 0.02, 0.05, 0.05, 0x40a0ff, true],
    [0.1, -0.13, 0, 0.2, 0.14, 0.14, 0xb03a1a],
    [0.1, -0.13, 0, 0.21, 0.03, 0.15, 0xe8b020],
    [0, -0.08, 0, 0.06, 0.1, 0.07, 0x1a1a1a],
    [-0.12, 0, 0, 0.16, 0.08, 0.07, 0x3a3a3a],
  ],
  glauncher: [
    [0.12, 0.02, 0, 0.3, 0.1, 0.1, 0x4a5236],
    [0.38, 0.03, 0, 0.24, 0.1, 0.1, 0x3a3e2c],
    [0.51, 0.03, 0, 0.03, 0.12, 0.12, 0x1a1a1a],
    [0.14, -0.03, 0, 0.14, 0.16, 0.16, 0x2a2c22],
    [0.14, -0.03, 0, 0.15, 0.04, 0.17, 0xe8b020],
    [0, -0.1, 0, 0.06, 0.1, 0.07, 0x1a1a1a],
    [-0.14, 0, 0, 0.2, 0.09, 0.07, 0x4a5236],
  ],
  plasma: [
    [0.16, 0.02, 0, 0.38, 0.1, 0.1, 0x2a3a4a],
    [0.42, 0.03, 0, 0.2, 0.07, 0.07, 0x1a2430],
    [0.54, 0.03, 0, 0.06, 0.09, 0.09, 0x40e0ff, true],
    [0.2, 0.03, 0.055, 0.26, 0.03, 0.01, 0x40e0ff, true],
    [0.2, 0.03, -0.055, 0.26, 0.03, 0.01, 0x40e0ff, true],
    [0.1, -0.11, 0, 0.1, 0.1, 0.06, 0x40e0ff, true],
    [0, -0.08, 0, 0.06, 0.1, 0.07, 0x1a1a1a],
    [-0.14, 0, 0, 0.2, 0.09, 0.07, 0x2a3a4a],
  ],
  cryo: [
    [0.14, 0.02, 0, 0.34, 0.11, 0.11, 0x5a7a8a],
    [0.38, 0.03, 0, 0.18, 0.08, 0.08, 0x3a4a56],
    [0.49, 0.03, 0, 0.05, 0.12, 0.12, 0xa8ecff, true],
    [0.12, 0.12, 0, 0.16, 0.08, 0.08, 0xd8f4ff],
    [0.12, 0.12, 0, 0.17, 0.02, 0.09, 0x3a4a56],
    [0, -0.08, 0, 0.06, 0.1, 0.07, 0x1a1a1a],
    [-0.12, 0, 0, 0.18, 0.09, 0.07, 0x5a7a8a],
  ],
  acidgun: [
    [0.12, 0.02, 0, 0.3, 0.1, 0.1, 0x3a5a2a],
    [0.36, 0.03, 0, 0.2, 0.06, 0.06, 0x2a2a2a],
    [0.47, 0.03, 0, 0.04, 0.08, 0.08, 0x8aff4a, true],
    [0.14, 0.13, 0, 0.14, 0.12, 0.12, 0x8aff4a, true],
    [0.14, 0.13, 0, 0.16, 0.02, 0.13, 0x2a2a2a],
    [0, -0.08, 0, 0.06, 0.1, 0.07, 0x1a1a1a],
    [-0.12, 0, 0, 0.18, 0.09, 0.07, 0x3a5a2a],
  ],
  pharaoh: [[0.16, 0.03, 0, 0.35, 0.09, 0.09, 0xd4a020], [0.42, 0.03, 0, 0.35, 0.035, 0.035, 0xc8ccd4], [0.12, -0.08, 0, 0.09, 0.12, 0.08, 0x1c1c20], [0.05, 0.13, 0, 0.12, 0.04, 0.11, 0x3fe0ff, true]],
  anubis_shotgun: [[0.12, 0.02, 0, 0.24, 0.11, 0.11, 0x2a2a34], [0.39, 0.03, 0, 0.38, 0.08, 0.08, 0x9a9ea6], [0.13, -0.09, 0, 0.1, 0.14, 0.09, 0x1c1c20], [-0.12, -0.02, 0, 0.22, 0.1, 0.08, 0x2a2a34], [0.27, 0.11, 0, 0.15, 0.035, 0.13, 0xd4a020]],
  scarab_smg: [[0.14, 0.02, 0, 0.31, 0.11, 0.1, 0x2a6a70], [0.36, 0.03, 0, 0.13, 0.04, 0.04, 0x9a7040], [0.04, -0.12, 0, 0.08, 0.18, 0.08, 0x1c1c20], [0.15, 0.12, 0, 0.17, 0.035, 0.11, 0xd4a020, true]],
  sobek_launcher: [[0.12, 0.02, 0, 0.32, 0.13, 0.13, 0x4a7a3a], [0.4, 0.03, 0, 0.32, 0.1, 0.1, 0x6a8a50], [0.52, 0.03, 0, 0.08, 0.14, 0.14, 0x2a4a2a], [0.13, -0.1, 0, 0.15, 0.15, 0.13, 0x9a7040], [0.18, 0.15, 0, 0.12, 0.04, 0.14, 0x3fe0ff, true]],
  sphinx_drill: [[0.18, 0.02, 0, 0.42, 0.13, 0.12, 0xb08a40], [0.48, 0.03, 0, 0.28, 0.07, 0.07, 0xd4a020], [0.68, 0.03, 0, 0.1, 0.1, 0.1, 0xe8e0c8], [0.12, -0.1, 0, 0.12, 0.16, 0.1, 0x2a2a34], [0.19, 0.12, 0, 0.2, 0.035, 0.12, 0xd4a020, true]],
  desert_bow: [[0.15, 0, 0, 0.07, 0.52, 0.07, 0x8a5a2a], [0.16, 0, 0, 0.035, 0.4, 0.035, 0xe8e0c8], [0.19, 0.02, 0, 0.34, 0.035, 0.04, 0xd4a020]],
  bastet_staff: [[0.2, 0, 0, 0.08, 0.65, 0.08, 0x6a3a82], [0.2, 0.34, 0, 0.24, 0.08, 0.08, 0xd4a020], [0.2, 0.45, 0, 0.15, 0.16, 0.12, 0xc070ff, true], [0.2, 0.51, 0, 0.05, 0.23, 0.05, 0xe8e0c8]],
  priest_staff: [[0.2, 0, 0, 0.08, 0.62, 0.08, 0x4a2a62], [0.2, 0.32, 0, 0.24, 0.11, 0.1, 0x8a3ad0], [0.2, 0.4, 0, 0.11, 0.12, 0.1, 0xb050ff, true], [0.2, 0.48, 0, 0.18, 0.06, 0.12, 0xd4a020]],
  horus_spear: [[0.2, 0, 0, 0.07, 0.72, 0.07, 0x9a7040], [0.2, 0.4, 0, 0.2, 0.2, 0.08, 0x3fe0ff, true], [0.2, 0.56, 0, 0.1, 0.22, 0.05, 0xe8e0c8], [0.2, 0.28, 0, 0.24, 0.04, 0.04, 0xd4a020]],
  mummy_blade: [[0.05, 0, 0, 0.12, 0.08, 0.08, 0x9a7040], [0.22, 0, 0, 0.28, 0.07, 0.025, 0xc8b890], [0.37, 0.02, 0, 0.14, 0.1, 0.025, 0xe8e0c8], [0.22, 0.06, 0, 0.24, 0.025, 0.02, 0xd4a020, true]],
  roman_gladius: [[0.22, 0, 0, 0.34, 0.06, 0.04, 0xc8c0a0], [0.05, 0, 0, 0.12, 0.05, 0.05, 0x8a6a3a], [0.4, 0, 0, 0.08, 0.1, 0.03, 0xd4a020, true]],
  roman_pilum: [[0.25, 0, 0, 0.55, 0.04, 0.04, 0x8a6a3a], [0.55, 0, 0, 0.12, 0.02, 0.02, 0xc8ccd4], [0.05, 0, 0, 0.1, 0.05, 0.05, 0x6a4a2a]],
  roman_centurion_bow: [[0.12, 0, 0, 0.06, 0.5, 0.06, 0x8a5a2a], [0.13, 0, 0, 0.03, 0.38, 0.03, 0xe8e0c8], [0.16, 0.02, 0, 0.3, 0.03, 0.04, 0xd4a020]],
  roman_colosseum_shotgun: [[0.18, 0.02, 0, 0.32, 0.1, 0.1, 0x5a3a22], [0.42, 0.03, 0, 0.34, 0.09, 0.09, 0x9a9ea6], [0.12, -0.09, 0, 0.1, 0.13, 0.09, 0x1c1c20], [0.28, 0.1, 0, 0.14, 0.03, 0.12, 0xd4a020]],
  roman_legion_smg: [[0.14, 0.02, 0, 0.32, 0.11, 0.1, 0x2a2a2e], [0.38, 0.03, 0, 0.14, 0.04, 0.04, 0x9a7040], [0.04, -0.12, 0, 0.08, 0.18, 0.08, 0x1c1c20], [0.16, 0.12, 0, 0.18, 0.035, 0.11, 0xd4a020, true]],
  roman_emperor_rifle: [[0.16, 0.03, 0, 0.38, 0.09, 0.09, 0xc6b289], [0.42, 0.03, 0, 0.36, 0.035, 0.035, 0xc8ccd4], [0.12, -0.08, 0, 0.09, 0.12, 0.08, 0x1c1c20], [0.06, 0.13, 0, 0.13, 0.04, 0.12, 0xd4a020, true]],
  roman_vestal_flamer: [[0.15, 0.02, 0, 0.28, 0.1, 0.1, 0xd04a1a], [0.35, 0.03, 0, 0.3, 0.08, 0.08, 0x9a9ea6], [0.55, 0.03, 0, 0.12, 0.12, 0.12, 0xffc040, true]],
  roman_siege_glauncher: [[0.12, 0.02, 0, 0.32, 0.13, 0.13, 0x4a5236], [0.4, 0.03, 0, 0.32, 0.1, 0.1, 0x6a6a70], [0.52, 0.03, 0, 0.08, 0.14, 0.14, 0x2a4a2a], [0.13, -0.1, 0, 0.15, 0.15, 0.13, 0x9a7040]],
  roman_ballista: [[0.14, 0, 0, 0.07, 0.55, 0.07, 0x6a4a2a], [0.15, 0, 0, 0.035, 0.42, 0.035, 0xe8e0c8], [0.18, 0.02, 0, 0.32, 0.035, 0.04, 0xb08040, true]],
  roman_colossus_hammer: [[0.2, 0, 0, 0.12, 0.08, 0.08, 0x6a6a70], [0.32, 0, 0, 0.28, 0.12, 0.12, 0x8a8a90], [0.32, 0.18, 0, 0.22, 0.06, 0.2, 0xd4a020, true]],
  nv_harpoon: [[0.14, 0, 0, 0.46, 0.08, 0.08, 0x3b6c82], [0.42, 0, 0, 0.22, 0.14, 0.05, 0x29b6f6, true]],
  nv_pirate_shotgun: [[0.08, -0.02, 0, 0.24, 0.10, 0.09, 0x6a4326], [0.30, 0.02, 0, 0.34, 0.10, 0.10, 0x363c44], [0.48, 0.02, 0, 0.08, 0.13, 0.13, 0xd4a040]],
  nv_trident: [[0.20, 0, 0, 0.62, 0.06, 0.06, 0x2c6884], [0.54, 0, 0, 0.18, 0.24, 0.06, 0x29b6f6, true]],
  nv_ghost_saber: [[0.06, 0, 0, 0.12, 0.08, 0.08, 0xd4a040], [0.28, 0, 0, 0.42, 0.07, 0.03, 0x70e8ff, true]],
  nv_anchor: [[0.18, 0, 0, 0.44, 0.08, 0.08, 0x4c5864], [0.42, 0, 0, 0.18, 0.36, 0.12, 0x343c44]],
  knife: [
    [0, 0, 0, 0.13, 0.05, 0.05, 0x1a1a1a],
    [-0.02, 0, 0, 0.02, 0.055, 0.055, 0x2e2e32],
    [0.03, 0, 0, 0.02, 0.055, 0.055, 0x2e2e32],
    [0.075, 0, 0, 0.02, 0.09, 0.06, 0x3a3a3e],
    [0.16, 0.005, 0, 0.15, 0.055, 0.016, 0xd8dce4],
    [0.255, -0.004, 0, 0.05, 0.03, 0.016, 0xd8dce4],
  ],
  axe: [
    [0.2, 0, 0, 0.62, 0.045, 0.045, 0xc8963a],
    [-0.1, 0, 0, 0.06, 0.055, 0.055, 0x7a5420],
    [0.47, 0.0, 0, 0.1, 0.07, 0.06, 0x5a5a60],
    [0.47, -0.1, 0, 0.11, 0.14, 0.035, 0xc0281e],
    [0.47, -0.19, 0, 0.15, 0.05, 0.03, 0xd8dce4],
    [0.47, 0.07, 0, 0.05, 0.07, 0.04, 0x5a5a60],
  ],
};
const gunLen = (m) => Math.max(...m.map((p) => p[0] + p[3] / 2)) - Math.min(...m.map((p) => p[0] - p[3] / 2));
// comprimento de cada arma na mão (armas sem modelo — granadas e estruturas — não aparecem na mão)
export const GUN_LEN = {};
for (const id of Object.keys(GUN_MODELS)) if (id !== 'knife' && id !== 'axe') GUN_LEN[id] = +gunLen(GUN_MODELS[id]).toFixed(2);

// ---------------------------------------------------------------- armadilhas e defesas (base fixa + cabeça que gira)
// Peça: [dx, dy, dz, sx, sy, sz, cor, brilho?] — mesmo formato dos modelos do mundo; frente da cabeça = +z
const towerBase = (c) => [
  [0, 0.12, 0, 0.82, 0.24, 0.82, 0x3a3e46], [0, 0.26, 0, 0.66, 0.06, 0.66, c],
  [0, 0.6, 0, 0.26, 0.66, 0.26, 0x4a4e56], ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => [a * 0.36, 0.06, b * 0.36, 0.14, 0.12, 0.14, 0x1a1a1e]),
  [0, 0.25, 0.42, 0.3, 0.06, 0.02, 0xe8b020],
];
export const TRAP_MODELS = {
  proxmine: { base: [
    [0, 0.05, 0, 0.56, 0.1, 0.56, 0x3a3a2a], [0, 0.11, 0, 0.42, 0.04, 0.42, 0x4a4a36], [0.16, 0.2, 0.16, 0.03, 0.2, 0.03, 0x1a1a1a],
    [0.16, 0.31, 0.16, 0.05, 0.05, 0.05, 0xff3020, true], [0, 0.14, 0, 0.16, 0.03, 0.16, 0x1a1a1a],
  ] },
  spikes: { base: [
    [0, 0.04, 0, 0.94, 0.08, 0.94, 0x3a2e24], [0, 0.09, 0, 0.86, 0.03, 0.12, 0x5a4a3a], [0, 0.09, 0, 0.12, 0.03, 0.86, 0x5a4a3a],
    ...[-1, 0, 1].flatMap((a) => [-1, 0, 1].map((b) => [a * 0.3, 0.24, b * 0.3, 0.07, 0.34, 0.07, (a + b) % 2 ? 0xb8bcc4 : 0x9aa0a8])),
    ...[-1, 0, 1].flatMap((a) => [-1, 0, 1].map((b) => [a * 0.3, 0.43, b * 0.3, 0.035, 0.06, 0.035, 0xe8ecf2])),
  ] },
  efence: { base: [
    [-0.42, 0.6, 0, 0.1, 1.2, 0.1, 0x3a3e46], [0.42, 0.6, 0, 0.1, 1.2, 0.1, 0x3a3e46],
    [-0.42, 0.05, 0, 0.22, 0.1, 0.22, 0x1a1a1e], [0.42, 0.05, 0, 0.22, 0.1, 0.22, 0x1a1a1e],
    ...[0.35, 0.7, 1.05].map((y) => [0, y, 0, 0.76, 0.025, 0.025, 0xffd84a, true]),
    ...[0.35, 0.7, 1.05].flatMap((y) => [[-0.36, y, 0, 0.05, 0.06, 0.06, 0xe8e0c8], [0.36, y, 0, 0.05, 0.06, 0.06, 0xe8e0c8]]),
    [0, 0.85, 0.03, 0.22, 0.16, 0.01, 0xe8b020], [0, 0.85, 0.036, 0.06, 0.1, 0.01, 0x1a1a1a],
  ] },
  ltower: { base: towerBase(0xd82020), head: [
    [0, 1.02, 0, 0.42, 0.26, 0.5, 0x2a2c32], [0, 1.02, 0.3, 0.12, 0.12, 0.18, 0x1a1a1e], [0, 1.02, 0.4, 0.09, 0.09, 0.02, 0xff2a20, true],
    [0, 1.18, -0.05, 0.3, 0.06, 0.3, 0xd82020], [0.23, 1.02, 0, 0.04, 0.16, 0.3, 0x4a4e56], [-0.23, 1.02, 0, 0.04, 0.16, 0.3, 0x4a4e56],
  ] },
  ftower: { base: towerBase(0xe8701a), head: [
    [0, 1.0, -0.04, 0.38, 0.3, 0.42, 0x5a4a3a], [0, 1.0, 0.28, 0.14, 0.14, 0.24, 0x2a2a2a], [0, 1.0, 0.41, 0.06, 0.06, 0.02, 0x40a0ff, true],
    [0, 1.22, -0.1, 0.24, 0.14, 0.24, 0xb03a1a], [0, 1.22, -0.1, 0.25, 0.03, 0.25, 0xe8b020],
  ] },
  itower: { base: towerBase(0x5ac8ff), head: [
    [0, 0.98, 0, 0.36, 0.14, 0.36, 0x3a4a56], [0, 1.2, 0, 0.18, 0.36, 0.18, 0xa8ecff, true], [0, 1.2, 0, 0.26, 0.14, 0.1, 0x7ad8ff, true],
    [0, 1.42, 0, 0.08, 0.12, 0.08, 0xffffff, true], [0, 1.0, 0.22, 0.1, 0.1, 0.12, 0x5a7a8a],
  ] },
};
// granadas especiais: mesmo corpo da granada comum com outras cores e faixa luminosa
const grenadeLike = (body, band, cap = 0x6a6e72) => [
  [0, 0, 0, 0.24, 0.27, 0.24, body], [0, 0, 0, 0.29, 0.18, 0.18, body], [0, 0, 0, 0.18, 0.18, 0.29, body],
  [0, 0.045, 0, 0.3, 0.025, 0.3, band, true], [0, -0.05, 0, 0.3, 0.025, 0.3, band, true],
  [0, 0.165, 0, 0.1, 0.07, 0.1, cap], [0, 0.1, 0.135, 0.05, 0.17, 0.022, 0x8a8e92], [-0.09, 0.2, 0, 0.08, 0.08, 0.016, 0xc8ccd4],
];

// ataques corpo a corpo: a faca já vem com todos; o machado substitui a faca quando liberado
export const MELEE = {
  knife: { id: 'knife', name: 'Faca tática', dmg: 26, rate: 0.32, anim: 0.26, range: 1.25, arc: 1.4, max: 1, knock: 1.4, shake: 0.05, a0: -2.1, a1: -1.0 },
  axe: { id: 'axe', name: 'Machado', dmg: 75, rate: 0.8, anim: 0.55, range: 1.85, arc: 2.5, max: 4, knock: 4.5, shake: 0.3, a0: -3.0, a1: -0.6 },
};

// ---------------------------------------------------------------- modelos do mundo
// Peça: [dx, dy, dz, sx, sy, sz, cor, brilho?] — centro do item na origem, frente = +z.
const front = (parts) => parts.flatMap((p) => [p, [p[0], p[1], -p[2], ...p.slice(3)]]); // repete na face de trás
const MODELS = {
  medkit: [
    [0, 0, 0, 0.56, 0.38, 0.22, 0xd81e1e],
    [0, -0.12, 0, 0.58, 0.05, 0.24, 0xa81414],
    [0.29, 0.06, 0, 0.025, 0.08, 0.1, 0xe8e8e8],
    [-0.29, 0.06, 0, 0.025, 0.08, 0.1, 0xe8e8e8],
    [0, 0.25, 0, 0.22, 0.04, 0.05, 0x1a1a1a],
    [0.095, 0.215, 0, 0.035, 0.06, 0.05, 0x1a1a1a],
    [-0.095, 0.215, 0, 0.035, 0.06, 0.05, 0x1a1a1a],
    ...front([[0, 0.01, 0.112, 0.22, 0.07, 0.01, 0xffffff], [0, 0.01, 0.112, 0.07, 0.22, 0.01, 0xffffff]], 0.112),
  ],
  ammo: [
    [0, 0, 0, 0.56, 0.32, 0.3, 0x56602e],
    [0, 0.18, 0, 0.6, 0.06, 0.33, 0x464e24],
    [0, 0.225, 0, 0.18, 0.03, 0.05, 0x2a2e18],
    [0.3, 0.13, 0, 0.02, 0.06, 0.08, 0x8a8e72],
    [-0.3, 0.13, 0, 0.02, 0.06, 0.08, 0x8a8e72],
    ...front([
      [0.22, 0, 0.152, 0.05, 0.26, 0.01, 0x464e24], [-0.22, 0, 0.152, 0.05, 0.26, 0.01, 0x464e24],
      ...[-1, 0, 1].flatMap((k) => [[k * 0.09, -0.03, 0.158, 0.062, 0.15, 0.012, 0xe0a830], [k * 0.09, 0.075, 0.158, 0.042, 0.06, 0.012, 0xc07a24]]),
    ], 0.158),
  ],
  drink: [
    [0, 0, 0, 0.2, 0.36, 0.2, 0x1e5ad8],
    [0, 0.19, 0, 0.18, 0.03, 0.18, 0xc8ccd4],
    [0, -0.185, 0, 0.18, 0.02, 0.18, 0xc8ccd4],
    [0.035, 0.21, 0, 0.06, 0.014, 0.03, 0xe0e4ea],
    [0, 0.14, 0, 0.21, 0.02, 0.21, 0x163e9a],
    ...front([
      [0.022, 0.065, 0.102, 0.05, 0.09, 0.01, 0xffffff, true],
      [0, 0, 0.102, 0.11, 0.04, 0.01, 0xffffff, true],
      [-0.022, -0.065, 0.102, 0.05, 0.09, 0.01, 0xffffff, true],
    ], 0.102),
  ],
  grenade: [
    [0, 0, 0, 0.24, 0.27, 0.24, 0x3f5a2a],
    [0, 0, 0, 0.29, 0.18, 0.18, 0x3f5a2a],
    [0, 0, 0, 0.18, 0.18, 0.29, 0x3f5a2a],
    [0, 0.045, 0, 0.3, 0.025, 0.3, 0x2e4220],
    [0, -0.05, 0, 0.3, 0.025, 0.3, 0x2e4220],
    [0, 0.165, 0, 0.1, 0.07, 0.1, 0x6a6e72],
    [0, 0.1, 0.135, 0.05, 0.17, 0.022, 0x8a8e92],
    [-0.09, 0.2, 0, 0.08, 0.08, 0.016, 0xc8ccd4],
  ],
  supply: [
    [0, 0, 0, 0.66, 0.66, 0.66, 0xc89a5a],
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => [a * 0.31, 0, b * 0.31, 0.085, 0.7, 0.085, 0x8a6232]),
    ...[1, -1].flatMap((a) => [1, -1].flatMap((b) => [[0, a * 0.31, b * 0.31, 0.7, 0.085, 0.085, 0x8a6232], [b * 0.31, a * 0.31, 0, 0.085, 0.085, 0.7, 0x8a6232]])),
    [0, 0, 0.336, 0.6, 0.1, 0.02, 0xa87a42], [0, 0, -0.336, 0.6, 0.1, 0.02, 0xa87a42],
    [0.336, 0, 0, 0.02, 0.1, 0.6, 0xa87a42], [-0.336, 0, 0, 0.02, 0.1, 0.6, 0xa87a42],
    [0, 0.336, 0, 0.1, 0.02, 0.6, 0xa87a42],
    [0.12, 0.16, 0.334, 0.12, 0.02, 0.012, 0x9a7040], [-0.15, -0.17, 0.334, 0.1, 0.02, 0.012, 0x9a7040],
  ],
  dynamite: [
    ...[-1, 0, 1].map((k) => [k * 0.105, 0, 0, 0.1, 0.38, 0.1, 0xd02a20]),
    ...[-1, 0, 1].map((k) => [k * 0.105, 0.195, 0, 0.07, 0.012, 0.07, 0xe8d8b0]),
    [0, 0.04, 0, 0.335, 0.07, 0.115, 0x1a1a1a],
    [0, -0.1, 0, 0.335, 0.05, 0.115, 0x1a1a1a],
    [0, 0.235, 0, 0.18, 0.06, 0.1, 0x2a2a2a],
    [0, 0.04, 0.062, 0.12, 0.05, 0.01, 0xff3020, true],
    [0, 0.285, 0, 0.14, 0.03, 0.04, 0x2a2a2a],
    [0.11, 0.28, 0, 0.016, 0.09, 0.016, 0xd8c890],
  ],
  vest: [
    [0, 0, 0, 0.48, 0.5, 0.24, 0x1e1e22],
    ...front([[0, 0.04, 0.125, 0.34, 0.3, 0.02, 0x2c2e34], [0.12, -0.17, 0.13, 0.11, 0.11, 0.03, 0x2c2e34], [-0.12, -0.17, 0.13, 0.11, 0.11, 0.03, 0x2c2e34], [0, -0.17, 0.13, 0.08, 0.11, 0.03, 0x2c2e34]], 0.125),
    [0.16, 0.29, 0, 0.1, 0.08, 0.22, 0x1e1e22],
    [-0.16, 0.29, 0, 0.1, 0.08, 0.22, 0x1e1e22],
    [0.25, -0.02, 0, 0.03, 0.36, 0.2, 0x2c2e34],
    [-0.25, -0.02, 0, 0.03, 0.36, 0.2, 0x2c2e34],
    [0, -0.24, 0, 0.5, 0.04, 0.26, 0x141416],
  ],
  helmet: [
    [0, 0, 0, 0.46, 0.22, 0.46, 0x1c1d22],
    [0, 0.13, 0, 0.36, 0.06, 0.36, 0x1c1d22],
    [0.24, -0.08, 0, 0.04, 0.16, 0.22, 0x2a2c32],
    [-0.24, -0.08, 0, 0.04, 0.16, 0.22, 0x2a2c32],
    [0, -0.08, -0.2, 0.42, 0.14, 0.06, 0x1c1d22],
    [0, -0.06, 0.235, 0.36, 0.08, 0.02, 0x3fe0ff, true],
    [0, 0.03, 0.234, 0.07, 0.06, 0.02, 0x2a2c32],
  ],
  backpack: [
    [0, 0, 0, 0.42, 0.46, 0.24, 0xc6b289],
    [0, 0.16, 0.04, 0.44, 0.16, 0.28, 0xb09c70],
    [0, -0.08, 0.14, 0.3, 0.18, 0.06, 0xb09c70],
    [0.24, -0.06, 0, 0.07, 0.22, 0.16, 0xa89466],
    [-0.24, -0.06, 0, 0.07, 0.22, 0.16, 0xa89466],
    [0.12, 0.02, -0.13, 0.06, 0.4, 0.02, 0x5a4a30],
    [-0.12, 0.02, -0.13, 0.06, 0.4, 0.02, 0x5a4a30],
    [0.1, 0.1, 0.185, 0.04, 0.06, 0.02, 0x2a2a2a],
    [-0.1, 0.1, 0.185, 0.04, 0.06, 0.02, 0x2a2a2a],
    [0, 0.27, -0.02, 0.12, 0.04, 0.04, 0x5a4a30],
  ],
  binoculars: [
    [0.08, 0, -0.02, 0.13, 0.13, 0.28, 0x1c1c1e],
    [-0.08, 0, -0.02, 0.13, 0.13, 0.28, 0x1c1c1e],
    [0.08, 0, 0.13, 0.15, 0.15, 0.08, 0x2a2a2e],
    [-0.08, 0, 0.13, 0.15, 0.15, 0.08, 0x2a2a2e],
    [0.08, 0, 0.175, 0.1, 0.1, 0.01, 0x3aa8ff, true],
    [-0.08, 0, 0.175, 0.1, 0.1, 0.01, 0x3aa8ff, true],
    [0, 0.02, -0.02, 0.06, 0.06, 0.12, 0x2a2a2e],
    [0, 0.07, -0.03, 0.04, 0.04, 0.04, 0x4a4a50],
    [0.08, 0, -0.17, 0.08, 0.08, 0.03, 0x3a3a3e],
    [-0.08, 0, -0.17, 0.08, 0.08, 0.03, 0x3a3a3e],
  ],
  flashlight: [
    [0, 0, -0.05, 0.09, 0.09, 0.32, 0x1c1c1e],
    [0, 0, -0.12, 0.105, 0.105, 0.025, 0x2e2e32],
    [0, 0, -0.06, 0.105, 0.105, 0.025, 0x2e2e32],
    [0, 0, 0, 0.105, 0.105, 0.025, 0x2e2e32],
    [0, 0, 0.14, 0.14, 0.14, 0.1, 0x26262a],
    [0, 0, 0.193, 0.11, 0.11, 0.01, 0xffe060, true],
    [0, 0.05, 0.04, 0.03, 0.02, 0.04, 0x4a4a50],
  ],
  radio: [
    [0, 0, 0, 0.2, 0.36, 0.1, 0x1c1c1e],
    [0.06, 0.3, 0, 0.03, 0.26, 0.03, 0x2a2a2e],
    [0.06, 0.44, 0, 0.045, 0.03, 0.045, 0x2a2a2e],
    [-0.05, 0.2, 0, 0.045, 0.04, 0.045, 0x4a4a50],
    [0, 0.1, 0.052, 0.14, 0.07, 0.01, 0x60ff70, true],
    ...[-1, 0, 1].flatMap((i) => [-0.02, -0.07, -0.12].map((y) => [i * 0.05, y, 0.052, 0.035, 0.03, 0.01, 0x5a5e66])),
    [0, -0.16, 0.052, 0.12, 0.02, 0.01, 0x3a3e46],
  ],
  egrenade: grenadeLike(0x2a4a8a, 0x40c8ff, 0x3a3e46),
  igrenade: grenadeLike(0x8a3a1a, 0xff8a20),
  fgrenade: grenadeLike(0xc8e0ec, 0x40a8ff, 0x8aa8c0),
  tgrenade: grenadeLike(0x4a6a2a, 0x9aff4a),
  boots: [
    ...[-0.11, 0.11].flatMap((x) => [
      [x, -0.02, 0.02, 0.17, 0.26, 0.2, 0x2a2a2e], [x, -0.17, 0.06, 0.19, 0.08, 0.32, 0x1a1a1e],
      [x, -0.06, 0.17, 0.17, 0.12, 0.08, 0x2a2a2e], [x + (x > 0 ? 0.09 : -0.09), -0.02, 0.02, 0.01, 0.2, 0.16, 0x40c8ff, true],
      [x, 0.1, 0.02, 0.18, 0.04, 0.21, 0x3a3a40],
    ]),
  ],
  exo: [
    [0, 0.12, -0.06, 0.08, 0.5, 0.06, 0x5a5e66], [0, 0.34, -0.04, 0.42, 0.08, 0.1, 0x5a5e66], [0, -0.1, -0.04, 0.36, 0.07, 0.1, 0x5a5e66],
    [0.2, 0.18, 0.02, 0.06, 0.32, 0.06, 0x8a8e96], [-0.2, 0.18, 0.02, 0.06, 0.32, 0.06, 0x8a8e96],
    [0.14, -0.3, 0, 0.06, 0.36, 0.06, 0x8a8e96], [-0.14, -0.3, 0, 0.06, 0.36, 0.06, 0x8a8e96],
    [0, 0.2, 0.02, 0.12, 0.12, 0.03, 0xffc107, true], [0.2, 0.36, 0.02, 0.08, 0.08, 0.08, 0xe8b020], [-0.2, 0.36, 0.02, 0.08, 0.08, 0.08, 0xe8b020],
  ],
};
for (const [id, m] of Object.entries(TRAP_MODELS)) {
  // catálogo: base + cabeça; centro vertical na origem
  const all = [...m.base, ...(m.head || [])];
  const top = Math.max(...all.map((p) => p[1] + p[4] / 2));
  MODELS[id] = all.map(([x, y, z, ...r]) => [x, y - top / 2, z, ...r]);
}
// armas e lâminas deitadas: o modelo da mão vira o modelo do chão (comprimento no eixo x)
// armas exclusivas do Templo Antigo (catálogo, modelo no chão e ordem do arsenal)
const TEMPLE_WEAPONS = ['pharaoh', 'anubis_shotgun', 'scarab_smg', 'sobek_launcher', 'sphinx_drill', 'desert_bow', 'bastet_staff', 'priest_staff', 'horus_spear', 'mummy_blade'];
const COLISEUM_WEAPONS = ['roman_gladius', 'roman_pilum', 'roman_centurion_bow', 'roman_colosseum_shotgun', 'roman_legion_smg', 'roman_emperor_rifle', 'roman_vestal_flamer', 'roman_siege_glauncher', 'roman_ballista', 'roman_colossus_hammer'];
const NAVAL_WEAPONS = ['nv_harpoon', 'nv_pirate_shotgun', 'nv_trident', 'nv_ghost_saber', 'nv_anchor'];
for (const id of ['pistol', 'rifle', 'shotgun', 'sniper', 'axe', 'knife', 'uzi', 'rocket', 'lmg', 'flamer', 'glauncher', 'plasma', 'cryo', 'acidgun', ...TEMPLE_WEAPONS, ...COLISEUM_WEAPONS, ...NAVAL_WEAPONS]) {
  const m = GUN_MODELS[id];
  const lo = Math.min(...m.map((p) => p[0] - p[3] / 2));
  const c = lo + gunLen(m) / 2;
  MODELS[id] = m.map(([f, u, s, lf, lu, ls, col, glow]) => [f - c, u, s, lf, lu, ls, col, glow]);
}
const modelSize = (m) => Math.max(...[0, 1, 2].map((a) => Math.max(...m.map((p) => Math.abs(p[a]) + p[a + 3] / 2)) * 2));

// ---------------------------------------------------------------- catálogo
// cat: supply (consumível), weapon (arma), gear (proteção), util (utilitário)
// get: como conseguir (texto do menu). weapon: o coletável dá munição dessa arma.
export const ITEMS = {
  medkit: { name: 'Kit médico', cat: 'supply', icon: 'medkit', ring: 0xff5050, rarity: 'Comum', desc: 'Recupera 60% da vida máxima.', get: 'Mapa e caixas de madeira' },
  ammo: { name: 'Caixa de munição', cat: 'supply', icon: 'ammo', ring: 0xffd040, rarity: 'Comum', desc: 'Repõe munição de todas as armas liberadas e +10 de vida.', get: 'Mapa e caixas de madeira' },
  drink: { name: 'Bebida energética', cat: 'supply', icon: 'drink', ring: 0x40c8ff, rarity: 'Incomum', desc: 'Por 10 s: +30% de velocidade e armas/golpes 30% mais rápidos.', get: 'Mapa e caixas de madeira' },
  grenade: { name: 'Granada', cat: 'supply', icon: 'burst', ring: 0x8ad050, rarity: 'Incomum', weapon: 'grenade', desc: 'Explode após um curto intervalo. Dano em área.', get: 'Multiplicador x3 · pacotes nas caixas' },
  supply: { name: 'Caixa de suprimentos', cat: 'supply', icon: 'crate', ring: 0xc89a5a, rarity: 'Incomum', desc: 'Encoste, atire ou golpeie para abrir: solta 2 itens aleatórios.', get: 'Mapa e queda do Colosso' },
  dynamite: { name: 'Dinamite', cat: 'supply', icon: 'dynamite', ring: 0xff6040, rarity: 'Rara', weapon: 'dynamite', desc: 'Pavio de 2 s e explosão enorme: limpa grupos inteiros.', get: 'Multiplicador x13 · pacotes nas caixas' },
  pistol: { name: 'Pistola', cat: 'weapon', icon: 'target', ring: 0xc8ccd4, rarity: 'Inicial', desc: 'Semiautomática, precisa e com munição infinita.', get: 'Arma inicial' },
  rifle: { name: 'Fuzil de assalto', cat: 'weapon', icon: 'target', ring: 0xe0c890, rarity: 'Rara', weapon: 'rifle', desc: 'Automático, cadência alta e atravessa inimigos.', get: 'Multiplicador x7 · munição nas caixas' },
  shotgun: { name: 'Escopeta', cat: 'weapon', icon: 'target', ring: 0xc08a50, rarity: 'Incomum', weapon: 'shotgun', desc: 'Leque de projéteis: devastadora de perto, fraca de longe.', get: 'Multiplicador x4 · munição nas caixas' },
  sniper: { name: 'Rifle de precisão', cat: 'weapon', icon: 'target', ring: 0x60ff70, rarity: 'Épica', weapon: 'sniper', desc: 'Dano altíssimo, longo alcance e atravessa 4 inimigos. Disparo lento.', get: 'Multiplicador x11 · munição nas caixas' },
  axe: { name: 'Machado', cat: 'weapon', icon: 'burst', ring: 0xff5a40, rarity: 'Épica', desc: 'Corpo a corpo pesado: atinge até 4 inimigos à frente. Substitui a faca.', get: 'Multiplicador x15 ou caixa de madeira' },
  knife: { name: 'Faca tática', cat: 'weapon', icon: 'burst', ring: 0xd8dce4, rarity: 'Inicial', desc: 'Corpo a corpo rápido e de curto alcance. Sempre disponível (F / botão direito).', get: 'Todos começam com ela' },
  vest: { name: 'Colete balístico', cat: 'gear', icon: 'vest', ring: 0x4fd0ff, rarity: 'Rara', desc: '50 pontos de armadura que absorvem o dano antes da vida.', get: 'Mapa e caixas de madeira' },
  helmet: { name: 'Capacete tático', cat: 'gear', icon: 'helmet', ring: 0x3fe0ff, rarity: 'Rara', desc: '-40% de dano de ataques especiais (explosões, ácido, pedras, botes).', get: 'Mapa e caixas de madeira' },
  backpack: { name: 'Mochila tática', cat: 'util', icon: 'backpack', ring: 0xe0c890, rarity: 'Rara', desc: '+50% de munição em toda caixa e pacote coletado.', get: 'Mapa e caixas de madeira' },
  binoculars: { name: 'Binóculos', cat: 'util', icon: 'binoculars', ring: 0x3aa8ff, rarity: 'Incomum', desc: 'Marca todos os inimigos e amplia o radar por 15 s (para o time).', get: 'Mapa e caixas de madeira' },
  flashlight: { name: 'Lanterna tática', cat: 'util', icon: 'flashlight', ring: 0xffe060, rarity: 'Incomum', desc: 'Feixe de luz por 45 s: ofusca e deixa 35% mais lento quem estiver nele.', get: 'Mapa (mais comum no cemitério)' },
  radio: { name: 'Rádio comunicador', cat: 'util', icon: 'radio', ring: 0x60ff70, rarity: 'Épica', desc: 'Pede ataque aéreo no maior grupo de inimigos. Sem inimigos, pede suprimentos.', get: 'Mapa a partir da onda 3 e caixas' },
  // ---- expansão ----
  uzi: { name: 'Submetralhadora', cat: 'weapon', icon: 'target', ring: 0xa8acb4, rarity: 'Comum', weapon: 'uzi', desc: 'Cadência altíssima e pente de 40. O recuo cresce a cada disparo seguido.', get: 'Multiplicador x2 · munição nas caixas' },
  rocket: { name: 'Lança-foguetes', cat: 'weapon', icon: 'target', ring: 0x8aa080, rarity: 'Épica', weapon: 'rocket', desc: 'Foguete com dano em área; com a mira travada, persegue o alvo. 2 por carga.', get: 'Multiplicador x14 · munição nas caixas' },
  lmg: { name: 'Metralhadora pesada', cat: 'weapon', icon: 'target', ring: 0xb0b48a, rarity: 'Épica', weapon: 'lmg', desc: 'Cinto de 100 tiros para segurar hordas. Recuo forte e você anda mais devagar atirando.', get: 'Multiplicador x15 · munição nas caixas' },
  flamer: { name: 'Lança-chamas', cat: 'weapon', icon: 'flame', ring: 0xff7a30, rarity: 'Épica', weapon: 'flamer', desc: 'Jato de fogo em cone: incendeia inimigos, deixa chamas no chão e detona barris.', get: 'Multiplicador x12 · combustível nas caixas' },
  glauncher: { name: 'Lança-granadas', cat: 'weapon', icon: 'burst', ring: 0xc8b060, rarity: 'Épica', weapon: 'glauncher', desc: 'Granadas em arco que explodem no impacto e ricocheteiam até 2 vezes nas paredes.', get: 'Multiplicador x17 · munição nas caixas' },
  plasma: { name: 'Rifle de plasma', cat: 'weapon', icon: 'bolt', ring: 0x40e0ff, rarity: 'Lendária', weapon: 'plasma', desc: 'Disparos de energia que atravessam 2 inimigos e estouram no impacto. Usa células.', get: 'Multiplicador x19 · células nas caixas' },
  cryo: { name: 'Canhão criogênico', cat: 'weapon', icon: 'snow', ring: 0xa8ecff, rarity: 'Rara', weapon: 'cryo', desc: 'Projéteis congelantes: deixam mais lento e congelam inimigos comuns. Chefões só ficam lentos.', get: 'Multiplicador x9 · munição nas caixas' },
  acidgun: { name: 'Lança-ácido', cat: 'weapon', icon: 'virus', ring: 0x8aff4a, rarity: 'Rara', weapon: 'acidgun', desc: 'Bolhas químicas: corroem por 4 s, deixam poças e enfraquecem escudos.', get: 'Multiplicador x6 · munição nas caixas' },
  egrenade: { name: 'Granada EMP', cat: 'supply', icon: 'bolt', ring: 0x40c8ff, rarity: 'Rara', weapon: 'egrenade', desc: 'Pulso eletromagnético: desliga inimigos mecânicos por 4 s e atordoa o resto.', get: 'Multiplicador x13 · pacotes nas caixas' },
  igrenade: { name: 'Granada incendiária', cat: 'supply', icon: 'flame', ring: 0xff8a20, rarity: 'Incomum', weapon: 'igrenade', desc: 'Espalha fogo por 6 s: queima quem passa e detona barris.', get: 'Multiplicador x5 · pacotes nas caixas' },
  fgrenade: { name: 'Granada congelante', cat: 'supply', icon: 'snow', ring: 0x7ad8ff, rarity: 'Incomum', weapon: 'fgrenade', desc: 'Congela inimigos comuns na área e deixa os fortes lentos.', get: 'Multiplicador x8 · pacotes nas caixas' },
  tgrenade: { name: 'Granada tóxica', cat: 'supply', icon: 'spore', ring: 0x9aff4a, rarity: 'Incomum', weapon: 'tgrenade', desc: 'Nuvem venenosa por 8 s que corrói a horda (não fere o time).', get: 'Multiplicador x14 · pacotes nas caixas' },
  pharaoh: { name: 'Rifle do Faraó', cat: 'weapon', icon: 'crown', ring: 0xd4a020, rarity: 'Épica', weapon: 'pharaoh', desc: 'Rifle de assalto. Bênção Real fortalece periodicamente um disparo.', get: 'Templo Antigo · multiplicador x4' },
  anubis_shotgun: { name: 'Espingarda Anúbis', cat: 'weapon', icon: 'skull', ring: 0x8a6a3a, rarity: 'Rara', weapon: 'anubis_shotgun', desc: 'Escopeta de curto alcance. Julgamento de Anúbis pode interromper inimigos.', get: 'Templo Antigo · multiplicador x3' },
  scarab_smg: { name: 'SMG Escaravelho', cat: 'weapon', icon: 'burst', ring: 0x29b6f6, rarity: 'Incomum', weapon: 'scarab_smg', desc: 'Submetralhadora rápida. Enxame do Escaravelho reforça rajadas periódicas.', get: 'Templo Antigo · multiplicador x2' },
  sobek_launcher: { name: 'Lança-granadas de Sobek', cat: 'weapon', icon: 'burst', ring: 0x2ecc71, rarity: 'Épica', weapon: 'sobek_launcher', desc: 'Granadas em arco. Ácido do Rio Nilo deixa corrosão no impacto.', get: 'Templo Antigo · multiplicador x6' },
  sphinx_drill: { name: 'Perfuradora da Esfinge', cat: 'weapon', icon: 'target', ring: 0xffc107, rarity: 'Lendária', weapon: 'sphinx_drill', desc: 'Metralhadora pesada perfurante. Fúria da Esfinge amplifica rajadas.', get: 'Templo Antigo · multiplicador x10' },
  desert_bow: { name: 'Arco do Deserto', cat: 'weapon', icon: 'target', ring: 0xe8b020, rarity: 'Rara', weapon: 'desert_bow', desc: 'Arco de precisão. Flecha Envenenada aplica dano contínuo.', get: 'Templo Antigo · multiplicador x5' },
  bastet_staff: { name: 'Bastão de Bastet', cat: 'weapon', icon: 'ghost', ring: 0xc070ff, rarity: 'Épica', weapon: 'bastet_staff', desc: 'Arma mágica. Garras das Sombras reforçam impactos de energia.', get: 'Templo Antigo · multiplicador x7' },
  priest_staff: { name: 'Cajado do Sacerdote', cat: 'weapon', icon: 'hood', ring: 0x8a3ad0, rarity: 'Rara', weapon: 'priest_staff', desc: 'Projéteis de maldição deixam inimigos lentos e corroídos.', get: 'Templo Antigo · multiplicador x8' },
  horus_spear: { name: 'Lança de Hórus', cat: 'weapon', icon: 'bolt', ring: 0x29b6f6, rarity: 'Lendária', weapon: 'horus_spear', desc: 'Energia perfurante. Rajada Divina fortalece disparos periódicos.', get: 'Templo Antigo · multiplicador x9' },
  mummy_blade: { name: 'Lâmina da Múmia', cat: 'weapon', icon: 'burst', ring: 0xeaeDEF, rarity: 'Épica', weapon: 'mummy_blade', desc: 'Arma corpo a corpo. Ressurreição das Areias recupera vida em sequência.', get: 'Templo Antigo · multiplicador x11' },
  roman_gladius: { name: 'Gládio Legionário', cat: 'weapon', icon: 'fist', ring: 0xc8c0a0, rarity: 'Épica', weapon: 'roman_gladius', desc: 'Lâmina curta. Golpe da Legião quebra armadura em sequência.', get: 'Coliseu · multiplicador x2' },
  roman_pilum: { name: 'Lança Pilum', cat: 'weapon', icon: 'run', ring: 0x8a6a3a, rarity: 'Rara', weapon: 'roman_pilum', desc: 'Arremesso tático que perfura múltiplos inimigos e atordoa.', get: 'Coliseu · multiplicador x3' },
  roman_centurion_bow: { name: 'Arco Centurião', cat: 'weapon', icon: 'target', ring: 0xd4a020, rarity: 'Rara', weapon: 'roman_centurion_bow', desc: 'Projéteis de energia que marcam o alvo. Flecha da Águia aumenta dano recebido.', get: 'Coliseu · multiplicador x4' },
  roman_colosseum_shotgun: { name: 'Escopeta do Coliseu', cat: 'weapon', icon: 'burst', ring: 0xff7a30, rarity: 'Épica', weapon: 'roman_colosseum_shotgun', desc: 'Escopeta incendiária. Explosão da Arena causa dano em área.', get: 'Coliseu · multiplicador x5' },
  roman_legion_smg: { name: 'SMG da Legião', cat: 'weapon', icon: 'run', ring: 0xb0b48a, rarity: 'Épica', weapon: 'roman_legion_smg', desc: 'Submetralhadora rápida. Marcha Imperial acelera o disparo.', get: 'Coliseu · multiplicador x6' },
  roman_emperor_rifle: { name: 'Rifle do Imperador', cat: 'weapon', icon: 'crown', ring: 0xd4a020, rarity: 'Lendária', weapon: 'roman_emperor_rifle', desc: 'Rifle preciso. Decreto de César marca o alvo para mais dano.', get: 'Coliseu · multiplicador x7' },
  roman_vestal_flamer: { name: 'Lança-chamas Vestal', cat: 'weapon', icon: 'flame', ring: 0xff7a30, rarity: 'Épica', weapon: 'roman_vestal_flamer', desc: 'Jato de fogo sagrado. Fogo Sagrado deixa área em chamas.', get: 'Coliseu · multiplicador x8' },
  roman_siege_glauncher: { name: 'Lança-granadas de Cerco', cat: 'weapon', icon: 'burst', ring: 0xc8b060, rarity: 'Épica', weapon: 'roman_siege_glauncher', desc: 'Granadas em arco. Bombardeio de Cerco atordoa e danifica área.', get: 'Coliseu · multiplicador x9' },
  roman_ballista: { name: 'Besta Romana', cat: 'weapon', icon: 'target', ring: 0xb08040, rarity: 'Lendária', weapon: 'roman_ballista', desc: 'Virote perfurante que atravessa vários inimigos.', get: 'Coliseu · multiplicador x10' },
  roman_colossus_hammer: { name: 'Martelo do Colosso', cat: 'weapon', icon: 'fist', ring: 0x6a6a70, rarity: 'Lendária', weapon: 'roman_colossus_hammer', desc: 'Martelo pesado. Impacto do Colosso atordoa e imobiliza.', get: 'Coliseu · multiplicador x11' },
  nv_harpoon:        { name: 'Arpão Abissal',            cat: 'weapon', icon: 'target', ring: 0x29b6f6, rarity: 'Épica',    weapon: 'nv_harpoon',        desc: 'Dispara arpões que atravessam inimigos e puxam o alvo atingido.', get: 'Cemitério Naval · Arsenal do Naufrágio' },
  nv_pirate_shotgun: { name: 'Escopeta Pirata',          cat: 'weapon', icon: 'burst',  ring: 0xd4a040, rarity: 'Épica',    weapon: 'nv_pirate_shotgun', desc: 'Curto alcance, espalhamento amplo, alto dano e recarga cartucho a cartucho.', get: 'Cemitério Naval · Arsenal do Naufrágio' },
  nv_trident:        { name: 'Tridente das Profundezas', cat: 'weapon', icon: 'bolt',   ring: 0x29b6f6, rarity: 'Lendária', weapon: 'nv_trident',        desc: 'Energia aquática em linha que atravessa múltiplos inimigos.', get: 'Cemitério Naval · Arsenal do Naufrágio' },
  nv_ghost_saber:    { name: 'Sabre Fantasmagórico',     cat: 'weapon', icon: 'burst',  ring: 0x70e8ff, rarity: 'Épica',    weapon: 'nv_ghost_saber',    desc: 'Combos espectrais rápidos com dano extra contra mortos-vivos.', get: 'Cemitério Naval · Arsenal do Naufrágio' },
  nv_anchor:         { name: 'Âncora Esmagadora',        cat: 'weapon', icon: 'fist',   ring: 0xffc107, rarity: 'Lendária', weapon: 'nv_anchor',         desc: 'Arma pesada que esmaga o solo em área e derruba inimigos.', get: 'Cemitério Naval · Arsenal do Naufrágio' },
  boots: { name: 'Botas de velocidade', cat: 'gear', icon: 'run', ring: 0x40c8ff, rarity: 'Rara', desc: '+15% de velocidade permanente (até cair).', get: 'Mapa e caixas de madeira' },
  exo: { name: 'Exoesqueleto temporário', cat: 'gear', icon: 'fist', ring: 0xffc107, rarity: 'Épica', desc: 'Por 20 s: -45% de dano recebido, golpes 60% mais fortes e imune a lentidão.', get: 'Caixas de madeira a partir da onda 4' },
  proxmine: { name: 'Mina de proximidade', cat: 'trap', icon: 'target', ring: 0xff3020, rarity: 'Rara', weapon: 'proxmine', desc: 'Detecta a 2,4 m, apita e explode em área grande (4 m).', get: 'Multiplicador x10 · cargas nas caixas' },
  spikes: { name: 'Barreira de espinhos', cat: 'trap', icon: 'shield', ring: 0xb8bcc4, rarity: 'Incomum', weapon: 'spikes', desc: 'Andável: fere e atrasa quem passa. Gasta com o uso (durabilidade 240).', get: 'Multiplicador x4 · cargas nas caixas' },
  efence: { name: 'Cerca elétrica', cat: 'trap', icon: 'bolt', ring: 0xffd84a, rarity: 'Rara', weapon: 'efence', desc: 'Bloqueia a passagem e dá choques que atordoam e atrasam (40 descargas).', get: 'Multiplicador x11 · cargas nas caixas' },
  ltower: { name: 'Torre de laser', cat: 'trap', icon: 'turret', ring: 0xff3020, rarity: 'Lendária', weapon: 'ltower', desc: 'Feixe contínuo no inimigo à vista a até 9 m. Bateria de 90 s.', get: 'Multiplicador x20' },
  ftower: { name: 'Torre de fogo', cat: 'trap', icon: 'flame', ring: 0xff7a30, rarity: 'Épica', weapon: 'ftower', desc: 'Lança chamas em quem chega a 4,5 m e incendeia. Bateria de 90 s.', get: 'Multiplicador x18' },
  itower: { name: 'Torre de gelo', cat: 'trap', icon: 'snow', ring: 0x5ac8ff, rarity: 'Épica', weapon: 'itower', desc: 'Dispara projéteis congelantes a até 8 m. Bateria de 90 s.', get: 'Multiplicador x16' },
};
export const ITEM_ORDER = ['medkit', 'ammo', 'drink', 'grenade', 'igrenade', 'fgrenade', 'tgrenade', 'egrenade', 'supply', 'dynamite', 'pistol', 'uzi', 'rifle', 'lmg', 'shotgun', 'sniper', 'rocket', 'glauncher', 'flamer', 'plasma', 'cryo', 'acidgun', 'axe', 'knife', ...TEMPLE_WEAPONS, ...COLISEUM_WEAPONS, ...NAVAL_WEAPONS, 'vest', 'helmet', 'boots', 'exo', 'backpack', 'binoculars', 'flashlight', 'radio', 'proxmine', 'spikes', 'efence', 'ltower', 'ftower', 'itower'];
export const ITEM_CATS = { supply: 'Suprimento', weapon: 'Arma', gear: 'Proteção', util: 'Utilitário', trap: 'Armadilha' };
for (const id of ITEM_ORDER) {
  const it = ITEMS[id];
  it.id = id;
  it.size = modelSize(MODELS[id]);
  it.pick = id === 'supply' ? 1 : Math.max(1, Math.min(1.5, 0.58 / it.size)); // escala no chão (~0,6 m)
}

// ---------------------------------------------------------------- desenho
// Desenha o modelo girado em Y (ry) e escalado; brilho vai para o lote emissivo G.
export function drawItem(B, G, id, x, y, z, ry = 0, scale = 1, flash = false) {
  const m = MODELS[id];
  if (!m) return;
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  for (const p of m) {
    const dx = p[0] * scale;
    const dz = p[2] * scale;
    const col = flash ? 0xffffff : p[6];
    (p[7] && G ? G : B).box(x + dx * c + dz * s, y + p[1] * scale, z - dx * s + dz * c, p[3] * scale, p[4] * scale, p[5] * scale, col, ry);
  }
}

// ---------------------------------------------------------------- equipamento no corpo
// Peças presas aos ossos (mesmo formato de look.extras em render.js)
export const GEAR = {
  helmet: [
    ['head', 0, 0.6, -0.01, 0.6, 0.1, 0.6, 0x1c1d22],
    ['head', 0, 0.5, -0.02, 0.64, 0.12, 0.62, 0x1c1d22],
    ['head', 0.32, 0.33, -0.02, 0.04, 0.2, 0.26, 0x2a2c32],
    ['head', -0.32, 0.33, -0.02, 0.04, 0.2, 0.26, 0x2a2c32],
    ['head', 0, 0.42, 0.3, 0.5, 0.08, 0.04, 0x3fe0ff, 0, 0, true],
  ],
  vest: [
    ['torso', 0, 0.3, 0, 0.62, 0.42, 0.4, 0x1e1e22],
    ['torso', 0, 0.32, 0.205, 0.4, 0.28, 0.02, 0x2c2e34],
    ['torso', 0.13, 0.12, 0.21, 0.12, 0.1, 0.03, 0x2c2e34],
    ['torso', -0.13, 0.12, 0.21, 0.12, 0.1, 0.03, 0x2c2e34],
    ['torso', 0.17, 0.53, 0, 0.12, 0.05, 0.36, 0x1e1e22],
    ['torso', -0.17, 0.53, 0, 0.12, 0.05, 0.36, 0x1e1e22],
  ],
  backpack: [
    ['torso', 0, 0.3, -0.31, 0.44, 0.46, 0.2, 0xc6b289],
    ['torso', 0, 0.5, -0.3, 0.46, 0.1, 0.24, 0xb09c70],
    ['torso', 0, 0.18, -0.425, 0.3, 0.16, 0.05, 0xb09c70],
    ['torso', 0.25, 0.22, -0.3, 0.06, 0.2, 0.14, 0xa89466],
    ['torso', -0.25, 0.22, -0.3, 0.06, 0.2, 0.14, 0xa89466],
  ],
  flashlight: [
    ['torso', 0.21, 0.44, 0.2, 0.08, 0.08, 0.14, 0x1c1c1e],
    ['torso', 0.21, 0.44, 0.275, 0.065, 0.065, 0.012, 0xffe060, 0, 0, true],
  ],
  boots: [
    ['legL', 0, -0.36, 0.03, 0.25, 0.2, 0.31, 0x2a2a2e], ['legR', 0, -0.36, 0.03, 0.25, 0.2, 0.31, 0x2a2a2e],
    ['legL', 0.128, -0.36, 0.03, 0.01, 0.14, 0.22, 0x40c8ff, 0, 0, true], ['legR', -0.128, -0.36, 0.03, 0.01, 0.14, 0.22, 0x40c8ff, 0, 0, true],
  ],
  exo: [
    ['torso', 0, 0.3, -0.2, 0.1, 0.5, 0.06, 0x5a5e66], ['torso', 0, 0.52, -0.18, 0.6, 0.08, 0.1, 0x8a8e96],
    ['torso', 0, 0.3, 0.19, 0.14, 0.14, 0.03, 0xffc107, 0, 0, true],
    ['armL', 0.1, -0.2, 0, 0.04, 0.4, 0.06, 0x8a8e96], ['armR', -0.1, -0.2, 0, 0.04, 0.4, 0.06, 0x8a8e96],
    ['legL', 0.12, -0.2, 0, 0.04, 0.4, 0.06, 0x8a8e96], ['legR', -0.12, -0.2, 0, 0.04, 0.4, 0.06, 0x8a8e96],
    ['legL', 0.13, -0.02, 0, 0.05, 0.05, 0.05, 0xe8b020], ['legR', -0.13, -0.02, 0, 0.05, 0.05, 0.05, 0xe8b020],
  ],
};

// ---------------------------------------------------------------- sorteio
export function rollTable(table) {
  let total = 0;
  for (const [, w] of table) total += Math.max(0, w);
  let r = Math.random() * total;
  for (const [id, w] of table) {
    if (w <= 0) continue;
    r -= w;
    if (r <= 0) return id;
  }
  return table.find(([, w]) => w > 0)?.[0] ?? null;
}
