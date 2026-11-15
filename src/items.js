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
};
// armas e lâminas deitadas: o modelo da mão vira o modelo do chão (comprimento no eixo x)
for (const id of ['pistol', 'rifle', 'shotgun', 'sniper', 'axe', 'knife', 'uzi', 'rocket']) {
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
};
export const ITEM_ORDER = ['medkit', 'ammo', 'drink', 'grenade', 'supply', 'dynamite', 'pistol', 'rifle', 'shotgun', 'sniper', 'axe', 'knife', 'vest', 'helmet', 'backpack', 'binoculars', 'flashlight', 'radio'];
export const ITEM_CATS = { supply: 'Suprimento', weapon: 'Arma', gear: 'Proteção', util: 'Utilitário' };
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
