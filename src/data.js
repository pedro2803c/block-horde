// Dados do jogo: armas, desbloqueios por multiplicador, inimigos, sobreviventes e arenas.
import { makeMap } from './scenery.js';

// kind: gun (disparo instantâneo), throw (projétil arremessado), rocket (projétil reto), place (objeto colocado no chão)
export const WEAPONS = {
  pistol: { name: 'Pistola', kind: 'gun', dmg: 12, rate: 0.3, spread: 0.035, range: 22, pellets: 1, pierce: 0, start: Infinity, pack: 0, sound: 'shot_pistol', color: 0x3a3a40 },
  uzi: { name: 'Submetralhadora', kind: 'gun', dmg: 9, rate: 0.085, spread: 0.1, range: 18, pellets: 1, pierce: 0, start: 160, pack: 120, sound: 'shot_smg', color: 0x2a2a2e },
  grenade: { name: 'Granadas', kind: 'throw', dmg: 130, rate: 0.65, radius: 3.6, start: 6, pack: 5, sound: 'throw', color: 0x3f5a2a },
  shotgun: { name: 'Escopeta', kind: 'gun', dmg: 10, rate: 0.75, spread: 0.3, range: 11, pellets: 7, pierce: 1, start: 24, pack: 16, sound: 'shot_shotgun', color: 0x5a3a22 },
  barrel: { name: 'Barril explosivo', kind: 'place', place: 'barrel', rate: 0.5, start: 4, pack: 3, sound: 'crate', color: 0xb02a1a },
  rifle: { name: 'Fuzil de assalto', kind: 'gun', dmg: 34, rate: 0.13, spread: 0.025, range: 30, pellets: 1, pierce: 3, start: 90, pack: 60, sound: 'shot_rifle', color: 0xc6b289 },
  sniper: { name: 'Rifle de precisão', kind: 'gun', dmg: 120, rate: 1.05, spread: 0.004, range: 42, pellets: 1, pierce: 4, knock: 3, heavy: true, start: 20, pack: 10, sound: 'shot_sniper', color: 0x4a5a2a },
  dynamite: { name: 'Dinamite', kind: 'throw', proj: 'dynamite', dmg: 230, rate: 0.9, radius: 5.4, fuse: 2.0, start: 3, pack: 2, sound: 'throw', color: 0xd02a20 },
  barricade: { name: 'Barricada', kind: 'place', place: 'barricade', rate: 0.4, start: 5, pack: 4, sound: 'crate', color: 0x8a6a3a },
  mine: { name: 'Minas', kind: 'place', place: 'mine', rate: 0.4, start: 5, pack: 4, sound: 'beep', color: 0x2a2a2a },
  rocket: { name: 'Lança-foguetes', kind: 'rocket', dmg: 150, rate: 0.95, radius: 3.8, speed: 22, start: 8, pack: 6, sound: 'shot_sniper', color: 0x3a4a3a },
};
export const WEAPON_ORDER = ['pistol', 'uzi', 'grenade', 'shotgun', 'barrel', 'rifle', 'sniper', 'barricade', 'mine', 'dynamite', 'rocket'];
// teclas de atalho (solo): 1–9, 0 e -
export const SLOT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'];
export const SLOT_CODES = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'];

// Ao alcançar cada nível de multiplicador pela primeira vez, o time ganha o item permanentemente na partida.
export const UNLOCKS = [
  { level: 2, weapon: 'uzi', text: 'Submetralhadora' },
  { level: 3, weapon: 'grenade', text: 'Granadas' },
  { level: 4, weapon: 'shotgun', text: 'Escopeta' },
  { level: 5, weapon: 'barrel', text: 'Barris explosivos' },
  { level: 6, upgrade: 'pistolFast', text: 'Pistola: disparo rápido' },
  { level: 7, weapon: 'rifle', text: 'Fuzil de assalto' },
  { level: 8, weapon: 'barricade', text: 'Barricadas' },
  { level: 9, upgrade: 'uziDmg', text: 'Submetralhadora: +40% de dano' },
  { level: 10, weapon: 'mine', text: 'Minas' },
  { level: 11, weapon: 'sniper', text: 'Rifle de precisão' },
  { level: 12, upgrade: 'shotgunPellets', text: 'Escopeta: 11 projéteis' },
  { level: 13, weapon: 'dynamite', text: 'Dinamite' },
  { level: 14, weapon: 'rocket', text: 'Lança-foguetes' },
  { level: 15, upgrade: 'axe', wicon: 'axe', text: 'Machado (corpo a corpo)' },
  { level: 16, upgrade: 'bigBoom', text: 'Explosões maiores' },
  { level: 18, upgrade: 'rifleRail', text: 'Fuzil de assalto: atravessa 8 inimigos' },
  { level: 20, upgrade: 'doubleAmmo', text: 'Caixas de munição em dobro' },
];

// Inimigos. body: forma do modelo (monsters.js). from: onda em que começa a aparecer; weight: frequência.
export const ENEMIES = {
  walker: { name: 'Zumbi', desc: 'Básico e numeroso', icon: 'skull', hp: 30, speed: 1.75, dmg: 10, rate: 1.0, reach: 0.95, scale: 1, score: 10, from: 1, weight: 10 },
  brute: { name: 'Brutamontes', desc: 'Resistente e forte', icon: 'fist', hp: 190, speed: 1.3, dmg: 26, rate: 1.4, reach: 1.35, scale: 1.5, score: 45, from: 5, weight: 1.2 },
  spider: { name: 'Aranha Mutante', desc: 'Rápida e ágil', icon: 'spider', body: 'spider', hp: 22, speed: 3.6, dmg: 8, rate: 0.7, reach: 0.95, scale: 0.85, radius: 0.42, score: 20, from: 4, weight: 2, strafe: true, blood: [0x6aa020, 0x4a7a18] },
  bat: { name: 'Morcego Demoníaco', desc: 'Voador e persistente', icon: 'bat', body: 'bat', hp: 16, speed: 3.1, dmg: 6, rate: 0.9, reach: 0.9, scale: 0.9, radius: 0.36, score: 20, from: 5, weight: 1.6, fly: true },
  runner: { name: 'Corredor', desc: 'Muito rápido', icon: 'run', hp: 20, speed: 3.5, dmg: 7, rate: 0.8, reach: 0.9, scale: 0.92, score: 15, from: 2, weight: 3 },
  spitter: { name: 'Cuspidor', desc: 'Ataca à distância', icon: 'virus', hp: 60, speed: 1.7, dmg: 8, rate: 1.0, reach: 1.0, scale: 1.2, score: 25, from: 4, weight: 1.6, spit: { range: 9, dmg: 12, cd: 2.4 } },
  bloater: { name: 'Explosivo', desc: 'Explode ao se aproximar', icon: 'burst', hp: 35, speed: 2.0, dmg: 0, rate: 1, reach: 1.1, scale: 1.05, score: 20, from: 3, weight: 1.8, explode: { radius: 3.2, dmg: 34 } },
  armored: { name: 'Blindado', desc: 'Alta defesa: o escudo bloqueia tiros de frente', icon: 'shield', hp: 90, speed: 1.35, dmg: 14, rate: 1.2, reach: 1.05, scale: 1.12, score: 35, from: 6, weight: 1.2, shield: 0.15 },
  dog: { name: 'Cão Mutante', desc: 'Ágil e agressivo: dá botes', icon: 'paw', body: 'dog', hp: 28, speed: 3.2, dmg: 9, rate: 0.7, reach: 1.0, scale: 1, radius: 0.38, score: 20, from: 3, weight: 1.8, lunge: { range: 4, speed: 9, cd: 3 } },
  summoner: { name: 'Invocador', desc: 'Invoca reforços', icon: 'hood', hp: 70, speed: 1.6, dmg: 8, rate: 1.2, reach: 1.0, scale: 1.05, score: 50, from: 7, weight: 0.7, summon: { cd: 7, n: 2, max: 6, types: ['walker', 'walker', 'spider', 'runner'] }, blood: [0x5a2a7a, 0x3a1a5a] },
  spore: { name: 'Esporo', desc: 'Libera pragas tóxicas', icon: 'spore', body: 'spore', hp: 80, speed: 0.8, dmg: 0, rate: 1, reach: 1, scale: 1.1, radius: 0.5, score: 40, from: 8, weight: 0.8, spore: { range: 10, cd: 4.5, dps: 9, radius: 1.7, life: 5 }, blood: [0x7a3ab0, 0x5a2a8a] },
  reaper: { name: 'Ceifador', desc: 'Ágil e letal: corta com as lâminas e dá botes', icon: 'scythe', hp: 65, speed: 2.5, dmg: 15, rate: 0.85, reach: 1.15, scale: 1.12, score: 35, from: 7, weight: 1.1, lunge: { range: 5, speed: 11, cd: 2.8 }, blood: [0x8a1020, 0x4a0810] },
  wasp: { name: 'Vespa Mutante', desc: 'Voa e dispara ferrões venenosos', icon: 'wasp', body: 'wasp', hp: 38, speed: 3.3, dmg: 7, rate: 1.0, reach: 0.9, scale: 1, radius: 0.4, score: 30, from: 7, weight: 1.2, fly: true, spit: { range: 10, dmg: 8, cd: 2.2, color: 0xe8d040, splat: '#c8b020' }, blood: [0xc8b020, 0x6a5a10] },
  specter: { name: 'Espectro', desc: 'Teleporta-se e caça sem descanso', icon: 'ghost', body: 'specter', hp: 52, speed: 2.8, dmg: 11, rate: 0.9, reach: 1.1, scale: 1.08, radius: 0.38, score: 40, from: 9, weight: 0.9, fly: true, blink: { range: 12, cd: 6, dist: 3.2 }, blood: [0x70e8ff, 0x2a7a9a] },
  boss: { name: 'Colosso', desc: 'Gigante, resistente e com múltiplos ataques', icon: 'crown', hp: 1500, speed: 1.5, dmg: 36, rate: 1.3, reach: 2.2, scale: 2.6, score: 500, boss: true, blood: [0x5a4a44, 0xff5a1a] },
  devourer: { name: 'O Devorador', desc: 'Zumbi gigante que destrói obstáculos e investe contra a horda', icon: 'crown', hp: 1700, speed: 1.55, dmg: 40, rate: 1.25, reach: 2.3, scale: 2.7, score: 600, boss: true, bossKind: 'devourer', blood: [0x5a7a24, 0x2a3a10] },
  mechworker: { name: 'O Operário Mutante', desc: 'Blindado com braços mecânicos: resiste a tiros e esmaga o chão', icon: 'crown', hp: 1900, speed: 1.3, dmg: 42, rate: 1.3, reach: 2.4, scale: 2.6, score: 600, boss: true, bossKind: 'mechworker', plating: 0.6, blood: [0x8a8a90, 0xe8a020] },
  guardian: { name: 'O Guardião da Floresta', desc: 'Madeira, raízes e fungos: prende os jogadores e solta esporos', icon: 'crown', hp: 1800, speed: 1.35, dmg: 38, rate: 1.3, reach: 2.5, scale: 2.8, score: 600, boss: true, bossKind: 'guardian', blood: [0x4a6a24, 0x8a4ad0] },
  general: { name: 'O General Infectado', desc: 'Comandante blindado: convoca reforços e enfurece a horda', icon: 'crown', hp: 2000, speed: 1.4, dmg: 40, rate: 1.25, reach: 2.4, scale: 2.6, score: 600, boss: true, bossKind: 'general', blood: [0x6a7a2a, 0xb01c1c] },
};
export const ENEMY_ORDER = ['walker', 'brute', 'spider', 'bat', 'runner', 'spitter', 'bloater', 'armored', 'dog', 'summoner', 'spore', 'reaper', 'wasp', 'specter', 'boss', 'devourer', 'mechworker', 'guardian', 'general'];


// Sobreviventes (apenas aparência; todos têm os mesmos atributos).
// extras: [osso, cx, cy, cz, sx, sy, sz, cor, rx, rz, brilho] — ver drawCharacter em render.js.
// mirror() duplica a peça no lado oposto (x e rz invertidos, armL <-> armR, legL <-> legR).
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
// cruz (kit médico) numa face lateral (x) ou frontal/traseira (z)
const CROSS = (bone, x, y, z, size, color, face = 'x') =>
  face === 'x'
    ? [[bone, x, y, z, 0.012, size, size * 0.33, color], [bone, x, y, z, 0.012, size * 0.33, size, color]]
    : [[bone, x, y, z, size, size * 0.33, 0.012, color], [bone, x, y, z, size * 0.33, size, 0.012, color]];

const CAMO = 0xc6b289;
const CAMO_D = 0x8e7a50;
const CAMO_M = 0xa89466;
const OLIVE = 0x5a5c3a;

export const SURVIVORS = [
  {
    id: 'soldado', name: 'Sgt. Barros', role: 'Soldado',
    skin: 0xe8c29c, shirt: CAMO, pants: CAMO, sleeve: CAMO, hands: 0xe0b890, boots: 0x24241c, noFace: true,
    extras: [
      // capacete camuflado com cobertura nas laterais
      ['head', 0, 0.5, -0.01, 0.62, 0.18, 0.62, 0xc0aa7c],
      ['head', 0, 0.42, 0.3, 0.62, 0.06, 0.06, 0xae9868],
      ...mirror(['head', 0.3, 0.33, -0.03, 0.06, 0.24, 0.56, 0xb8a274]),
      ['head', 0.13, 0.595, 0.1, 0.2, 0.012, 0.15, CAMO_D],
      ['head', -0.15, 0.595, -0.12, 0.17, 0.012, 0.2, 0x7a6a44],
      ['head', 0.311, 0.36, -0.12, 0.012, 0.1, 0.16, CAMO_D],
      ['head', 0, 0.3, -0.3, 0.5, 0.2, 0.06, 0x3a3a2a],
      // colete tático com bolsos, cinto e mochila com rádio
      ['torso', 0, 0.28, 0, 0.6, 0.44, 0.38, OLIVE],
      ['torso', -0.15, 0.15, 0.2, 0.15, 0.15, 0.05, 0x4a4c30],
      ['torso', 0, 0.15, 0.2, 0.12, 0.15, 0.05, 0x4a4c30],
      ['torso', 0.15, 0.15, 0.2, 0.15, 0.15, 0.05, 0x4a4c30],
      ['torso', 0.12, 0.38, 0.2, 0.12, 0.1, 0.04, 0x4a4c30],
      ['torso', 0, 0.025, 0, 0.58, 0.07, 0.36, 0x3a3a28],
      ['torso', 0, 0.3, -0.28, 0.46, 0.48, 0.2, 0x4e5236],
      ['torso', 0, 0.55, -0.28, 0.46, 0.06, 0.22, 0x42462c],
      ['torso', 0, 0.2, -0.39, 0.3, 0.16, 0.04, 0x42462c],
      ['torso', 0.17, 0.9, -0.33, 0.035, 0.7, 0.035, 0x1a1a1a],
      ['torso', 0.17, 0.58, -0.33, 0.07, 0.1, 0.07, 0x2a2a2a],
      // camuflagem nas mangas, bandeira do Brasil no ombro direito
      ['armL', 0.088, -0.14, 0.02, 0.012, 0.13, 0.12, CAMO_D],
      ['armL', 0, -0.32, 0.098, 0.12, 0.08, 0.012, CAMO_M],
      ['armR', 0, -0.3, 0.098, 0.1, 0.1, 0.012, CAMO_D],
      ['armR', -0.09, -0.1, 0, 0.012, 0.11, 0.16, 0x1c9a3a],
      ['armR', -0.096, -0.1, 0, 0.012, 0.065, 0.065, 0xf2d21a, Math.PI / 4],
      ['armR', -0.1, -0.1, 0, 0.012, 0.035, 0.035, 0x1a3a8a],
      // joelheiras e manchas na calça
      ...mirror(['legL', 0, -0.27, 0.125, 0.2, 0.13, 0.04, 0x262620]),
      ['legL', 0.04, -0.12, 0.122, 0.09, 0.1, 0.012, CAMO_D],
      ['legR', -0.03, -0.36, 0.122, 0.09, 0.08, 0.012, 0x7a6a44],
      ...mirror(['legL', 0.11, -0.17, 0, 0.03, 0.14, 0.15, CAMO_M]),
    ],
  },
  {
    id: 'rubro', name: 'Rubro', role: 'Demônio blindado',
    skin: 0xd41f1f, shirt: 0xd41f1f, pants: 0xc21a1a, sleeve: 0xd41f1f, hands: 0x161616, boots: 0x161616, noFace: true,
    extras: [
      // chifres pretos e "V" na testa
      ...mirror(['head', 0.24, 0.66, 0, 0.11, 0.3, 0.11, 0x161616, 0, -0.42]),
      ...mirror(['head', 0.33, 0.88, 0, 0.065, 0.24, 0.065, 0x161616, 0, -0.3]),
      ['head', 0, 0.47, 0.276, 0.1, 0.1, 0.012, 0x161616, 0, Math.PI / 4],
      ...mirror(['head', 0.276, 0.3, 0.1, 0.012, 0.1, 0.12, 0xa81414]),
      // ombreiras com espinhos
      ...mirror(['torso', 0.37, 0.5, 0, 0.28, 0.17, 0.34, 0xb81616]),
      ...mirror(['torso', 0.42, 0.64, 0, 0.07, 0.16, 0.07, 0x8a0e0e, 0, -0.5]),
      ...mirror(['torso', 0.45, 0.62, 0.11, 0.06, 0.13, 0.06, 0x8a0e0e, 0.3, -0.6]),
      ...mirror(['torso', 0.45, 0.62, -0.11, 0.06, 0.13, 0.06, 0x8a0e0e, -0.3, -0.6]),
      // peitoral com caveira branca
      ['torso', 0, 0.3, 0.165, 0.34, 0.3, 0.012, 0xb01616],
      ['torso', 0, 0.33, 0.172, 0.18, 0.12, 0.012, 0xf2f2f2],
      ['torso', 0, 0.245, 0.172, 0.12, 0.06, 0.012, 0xf2f2f2],
      ...mirror(['torso', 0.11, 0.41, 0.172, 0.04, 0.07, 0.012, 0xf2f2f2, 0, -0.4]),
      ...mirror(['torso', 0.04, 0.33, 0.18, 0.045, 0.045, 0.012, 0xb01616]),
      ['torso', 0, 0.025, 0, 0.56, 0.06, 0.34, 0x161616],
      // luvas grandes
      ...mirror(['armL', 0, -0.37, 0, 0.2, 0.12, 0.22, 0x161616]),
    ],
  },
  {
    id: 'vetor', name: 'Vetor', role: 'Ciborgue', gunGlow: 0x3fe0ff,
    skin: 0x1e1f24, shirt: 0xe8eaee, pants: 0x2a2c32, sleeve: 0xd8dbe0, hands: 0x1e1f24, boots: 0x1e1f24, noFace: true,
    extras: [
      // capacete com fones e visor ciano
      ['head', 0, 0.565, -0.02, 0.5, 0.06, 0.5, 0x2a2b30],
      ['head', 0, 0.26, 0.272, 0.5, 0.18, 0.03, 0x8a929c],
      ['head', 0, 0.26, 0.29, 0.42, 0.09, 0.02, 0x3fe0ff, 0, 0, true],
      ['head', 0, 0.07, 0.272, 0.34, 0.1, 0.03, 0x8a929c],
      ...mirror(['head', 0.3, 0.3, 0, 0.08, 0.26, 0.26, 0x8a929c]),
      ...mirror(['head', 0.345, 0.3, 0, 0.02, 0.15, 0.15, 0x5a626c]),
      ...mirror(['head', 0.29, 0.5, 0, 0.04, 0.12, 0.05, 0x5a626c]),
      // armadura branca com luzes no peito
      ['torso', 0, 0.31, 0.03, 0.58, 0.36, 0.36, 0xf2f3f5],
      ...mirror(['torso', 0.3, 0.22, 0, 0.06, 0.3, 0.3, 0x8a929c]),
      ...mirror(['torso', 0.1, 0.32, 0.215, 0.13, 0.08, 0.012, 0x3fb8ff, 0, 0.25, true]),
      ['torso', 0, 0.22, 0.215, 0.08, 0.06, 0.012, 0x3fe0ff, 0, 0, true],
      ['torso', 0, 0.07, 0, 0.5, 0.14, 0.3, 0x2a2c32],
      ['torso', 0, 0.3, -0.22, 0.4, 0.36, 0.1, 0x8a929c],
      ...mirror(['torso', 0.37, 0.48, 0, 0.26, 0.17, 0.32, 0xd8dbe0]),
      ...mirror(['torso', 0.37, 0.48, 0.165, 0.2, 0.05, 0.012, 0x5a626c]),
      // antebraços e pernas blindadas
      ...mirror(['armL', 0, -0.32, 0, 0.19, 0.14, 0.21, 0x8a929c]),
      ...mirror(['legL', 0, -0.11, 0, 0.23, 0.22, 0.26, 0xe8eaee]),
      ...mirror(['legL', 0, -0.26, 0.125, 0.16, 0.08, 0.03, 0x1e1f24]),
      ...mirror(['legL', 0, -0.33, 0, 0.22, 0.1, 0.25, 0xb8bcc4]),
    ],
  },
  {
    id: 'lia', name: 'Lia', role: 'Paramédica', oneHanded: true,
    skin: 0xe8c29c, shirt: 0xeeeeee, pants: 0x3a3b40, sleeve: 0xf07a1a, hands: 0xe0b890, boots: 0x2a2a2e, noFace: true,
    extras: [
      // boné laranja e cabelo castanho com rabo de cavalo
      ['head', 0, 0.53, -0.01, 0.6, 0.14, 0.6, 0xf07a1a],
      ['head', 0, 0.475, 0.37, 0.54, 0.04, 0.22, 0xd8661a],
      ['head', 0, 0.61, 0, 0.08, 0.03, 0.08, 0xd8661a],
      ['head', 0, 0.28, -0.285, 0.56, 0.46, 0.03, 0x7a3a1a],
      ...mirror(['head', 0.285, 0.3, -0.1, 0.03, 0.42, 0.36, 0x7a3a1a]),
      ['head', 0.14, 0.42, 0.28, 0.22, 0.1, 0.02, 0x7a3a1a],
      ['head', 0, 0.4, -0.36, 0.14, 0.14, 0.14, 0x6a3216],
      ['head', 0, 0.2, -0.47, 0.14, 0.34, 0.12, 0x7a3a1a, 0.55, 0],
      ['head', 0, -0.02, -0.58, 0.1, 0.18, 0.1, 0x6a3216, 0.3, 0],
      // jaqueta laranja aberta sobre a regata branca
      ...mirror(['torso', 0.19, 0.27, 0.01, 0.18, 0.54, 0.36, 0xf07a1a]),
      ['torso', 0, 0.27, -0.15, 0.58, 0.54, 0.06, 0xf07a1a],
      ...mirror(['torso', 0.11, 0.5, 0.17, 0.07, 0.1, 0.012, 0xd8661a]),
      ['torso', 0, 0.025, 0, 0.56, 0.06, 0.34, 0x3a3022],
      ...mirror(['torso', 0.15, 0.3, 0.19, 0.05, 0.5, 0.012, 0x2a2a2a]),
      // mochila com cruz vermelha
      ['torso', 0, 0.28, -0.27, 0.42, 0.44, 0.18, 0x7a7a5a],
      ['torso', 0, 0.12, -0.37, 0.3, 0.12, 0.04, 0x6a6a4a],
      ...CROSS('torso', 0, 0.33, -0.362, 0.14, 0xd82020, 'z'),
      // cruz branca na manga direita
      ...CROSS('armR', -0.09, -0.1, 0, 0.13, 0xffffff),
      // bolso na calça e maleta de primeiros socorros na mão esquerda
      ['legR', -0.11, -0.2, 0, 0.03, 0.14, 0.15, 0x2e2f33],
      ['armL', 0.02, -0.53, 0.04, 0.04, 0.04, 0.14, 0x1a1a1a],
      ['armL', 0.02, -0.66, 0.04, 0.12, 0.22, 0.3, 0xd81e1e],
      ...CROSS('armL', 0.083, -0.66, 0.04, 0.14, 0xffffff),
      ...CROSS('armL', -0.043, -0.66, 0.04, 0.14, 0xffffff),
    ],
  },
];

// Arenas reconstruídas. Cada caractere é um bloco de 1 m; símbolos em SCENERY/SCENERY2.
// perfil persistente: // XP do perfil para passar do nível l para l+1
export const profileNeed = (l) => 300 + 150 * (l - 1);
// XP de perfil ganho numa partida
export const matchXp = (score, wave) => Math.round(score / 10 + wave * 20);

export const ARENAS = [
  {
    id: 'praca', name: 'Cidade Abandonada', desc: 'Zona de quarentena: ruas rachadas, prédios tomados e carros abandonados.', floor: 'concrete',
    theme: 'city', ambient: 'city', weather: 'hordealarm', boss: 'devourer', unlock: 1,
    diff: { label: 'Média', tier: 1, hp: 1, speed: 1, count: 1 }, eventName: 'Alarme de horda',
    tip: 'Atire de longe nos carros, use as marquises (+alcance) e ligue o gerador para iluminar as ruas.', lampI: 14, lampsOff: true,
    light: { sky: 0x2e3a34, fog: 0x2e3a34, sun: 0xffe8c0, sunI: 2.2, hemi: 1.4 },
    map: makeMap(46, 32, '#', [[13, 0, 5, 'h'], [13, 31, 5, 'h'], [0, 12, 4, 'v'], [45, 12, 4, 'v']], (m) => {
      m.rect(1, 1, 44, 30, 'f');
      // calçadas em cruz
      m.rect(1, 10, 44, 11, 'k');
      m.rect(1, 20, 44, 21, 'k');
      m.rect(14, 1, 15, 30, 'k');
      m.rect(30, 1, 31, 30, 'k');
      // prédios destruídos com fachadas
      m.rect(2, 2, 10, 8, 'Y'); m.rect(2, 9, 10, 9, 'J');
      m.rect(33, 2, 43, 7, 'Y'); m.rect(33, 8, 43, 8, 'J');
      m.rect(3, 23, 11, 29, 'Y'); m.rect(3, 22, 11, 22, 'J');
      m.rect(34, 23, 43, 29, 'Y'); m.rect(34, 22, 43, 22, 'J');
      // lojas saqueadas
      for (const x of [18, 19, 27, 28]) { m.put(x, 8, '$'); m.put(x, 23, '$'); }
      // veículos
      m.put(20, 13, 'q');
      for (const [x, y] of [[5, 13], [38, 17], [24, 24], [8, 18]]) m.put(x, y, 's');
      // entulho
      for (const [x, y] of [[11, 9], [32, 9], [12, 22], [33, 22], [2, 12], [43, 19]]) m.put(x, y, ':');
      // cobertura e barricadas
      m.rect(17, 15, 19, 15, 'Q');
      m.rect(26, 15, 28, 15, 'Q');
      m.rect(16, 18, 18, 18, 'I');
      m.rect(27, 18, 29, 18, 'S');
      // postes, tambores e vegetação invadindo
      for (const [x, y] of [[14, 10], [30, 10], [14, 20], [30, 20], [22, 9], [22, 22]]) m.put(x, y, 'i');
      for (const [x, y] of [[12, 5], [33, 12], [9, 27], [36, 20]]) m.put(x, y, '&');
      for (const [x, y] of [[3, 13], [43, 13], [3, 19], [43, 19], [12, 28], [33, 3], [20, 6], [25, 25]]) m.put(x, y, 'A');
      for (const [x, y] of [[6, 14], [39, 14], [6, 18], [39, 18], [17, 3], [28, 28]]) m.put(x, y, 'u');
      // caixas, cones e gerador
      for (const [x, y] of [[19, 12], [26, 12], [19, 20], [26, 20]]) m.put(x, y, 'X');
      for (const [x, y] of [[21, 10], [25, 21], [13, 16], [32, 16]]) m.put(x, y, 'z');
      m.put(22, 17, '8');
      for (const [x, y] of [[2, 16], [43, 16], [16, 2], [29, 29]]) m.put(x, y, '"');
      // acesso elevado: marquises e escadas de incêndio colados aos prédios
      m.rect(11, 3, 12, 4, 'N'); m.rect(31, 3, 32, 4, 'N');
      m.rect(12, 25, 13, 26, 'N'); m.rect(32, 25, 33, 26, 'N');
    }),
  },
  {
    id: 'armazem', name: 'Complexo Industrial', desc: 'Fábrica dos Mortos: esteiras, prensas, vapor e piso elétrico.', floor: 'industrial',
    theme: 'factory', ambient: 'factory', weather: 'overload', boss: 'mechworker', unlock: 5,
    diff: { label: 'Alta', tier: 2, hp: 1.15, speed: 1.05, count: 1.1 }, eventName: 'Sobrecarga das máquinas',
    tip: 'Atraia a horda para prensas, vapor e piso elétrico. Cuidado com as esteiras.', lampI: 12,
    light: { sky: 0x221a13, fog: 0x2e2219, sun: 0xffb060, sunI: 1.85, hemi: 1.15 },
    map: makeMap(46, 32, '#', [[18, 0, 5, 'h'], [18, 31, 5, 'h'], [0, 13, 4, 'v'], [45, 13, 4, 'v']], (m) => {
      m.rect(1, 1, 44, 30, '=');
      // contêineres empilhados
      m.rect(2, 2, 6, 5, 'C'); m.rect(39, 2, 43, 5, 'C');
      m.rect(2, 26, 6, 29, 'C'); m.rect(39, 26, 43, 29, 'C');
      m.rect(9, 2, 12, 4, 'C'); m.rect(34, 27, 37, 29, 'C');
      // máquinas e tanques
      for (const x of [9, 12, 15, 18]) m.put(x, 6, '2');
      for (const x of [28, 31, 34, 37]) m.put(x, 25, '2');
      for (const [x, y] of [[25, 3], [28, 3], [31, 3], [25, 28], [28, 28]]) m.put(x, y, '0');
      // tubulações
      for (let y = 8; y <= 12; y++) m.put(20, y, '-');
      for (let y = 19; y <= 23; y++) m.put(26, y, '-');
      // esteiras: ida a leste, volta a oeste, com passagem no meio
      for (let x = 4; x <= 40; x++) if (x < 22 || x > 23) m.put(x, 14, '>');
      for (let x = 4; x <= 40; x++) if (x < 22 || x > 23) m.put(x, 17, '<');
      // prensas e saídas de vapor
      m.put(24, 11, '3'); m.put(24, 20, '3');
      for (const [x, y] of [[12, 10], [34, 10], [12, 21], [34, 21]]) m.put(x, y, '4');
      // piso elétrico central e console
      m.rect(19, 15, 22, 16, 'e');
      m.put(18, 16, '5');
      // empilhadeiras, barris, caixas e giroflex
      for (const [x, y] of [[14, 8], [30, 23]]) m.put(x, y, '1');
      for (const [x, y] of [[17, 7], [27, 7], [17, 24], [27, 24]]) m.put(x, y, 'x');
      for (const [x, y] of [[7, 12], [38, 12], [7, 19], [38, 19]]) m.put(x, y, 'X');
      for (const [x, y] of [[10, 15], [35, 15], [10, 17], [35, 17]]) m.put(x, y, '9');
      // barreiras e cobertura
      m.rect(7, 9, 9, 9, 'I');
      m.rect(36, 9, 38, 9, 'I');
      m.rect(7, 22, 9, 22, 'S');
      m.rect(36, 22, 38, 22, 'S');
      m.rect(15, 15, 16, 15, 'Q');
      m.rect(29, 16, 30, 16, 'Q');
    }),
  },
  {
    id: 'vale', name: 'Floresta Sombria', desc: 'Território infectado: neblina, cogumelos luminosos e lagoa tóxica.', floor: 'wild',
    theme: 'forest', ambient: 'forest', weather: 'toxicfog', boss: 'guardian', unlock: 10,
    diff: { label: 'Muito alta', tier: 3, hp: 1.28, speed: 1.08, count: 1.2 }, eventName: 'Névoa tóxica',
    shelters: [[6, 5, 9, 8], [35, 5, 38, 7]],
    tip: 'Na névoa tóxica, abrigue-se nas ruínas ou na cabana. A vegetação esconde emboscadas.', lampI: 8,
    light: { sky: 0x18231f, fog: 0x243530, sun: 0x9ab0e0, sunI: 0.95, hemi: 0.75 },
    map: makeMap(46, 32, '#', [[21, 0, 4, 'h'], [21, 31, 4, 'h'], [0, 15, 4, 'v'], [45, 15, 4, 'v']], (m) => {
      m.rect(1, 1, 44, 30, 'g');
      // trilhas de terra
      m.rect(1, 15, 44, 16, 'd');
      m.rect(22, 1, 23, 30, 'd');
      m.rect(6, 9, 39, 9, 'd');
      // lago contaminado
      m.rect(33, 22, 41, 29, 'm');
      m.rect(34, 23, 40, 28, '~');
      // ruínas antigas
      m.rect(5, 4, 10, 4, '%'); m.rect(5, 5, 5, 9, '%'); m.rect(5, 9, 10, 9, '%'); m.rect(10, 5, 10, 7, '%');
      m.rect(6, 5, 9, 8, 'm');
      // cabana abandonada
      m.rect(34, 4, 39, 4, '['); m.rect(34, 5, 34, 8, '['); m.rect(39, 5, 39, 8, '[');
      m.rect(34, 8, 35, 8, '['); m.rect(38, 8, 39, 8, '[');
      m.rect(35, 5, 38, 7, 'h');
      // pinheiros gigantes
      for (const [x, y] of [[2, 2], [4, 13], [2, 20], [2, 28], [13, 2], [17, 3], [28, 2], [32, 2], [43, 2], [43, 8], [43, 13], [43, 20], [43, 27], [8, 29], [15, 29], [28, 29], [36, 13], [40, 18], [30, 20], [12, 12]]) m.put(x, y, '!');
      // árvores retorcidas, secas e rochas
      for (const [x, y] of [[16, 6], [31, 11], [11, 24], [40, 13], [26, 26], [7, 20], [37, 2]]) m.put(x, y, 'y');
      for (const [x, y] of [[14, 20], [28, 4], [6, 27], [20, 28], [42, 24]]) m.put(x, y, 'D');
      for (const [x, y] of [[10, 11], [38, 7], [18, 22], [3, 10]]) m.put(x, y, 'R');
      // cogumelos luminosos, raízes e arbustos
      for (const [x, y] of [[18, 11], [19, 11], [29, 7], [8, 18], [37, 19], [15, 27], [26, 13], [33, 16]]) m.put(x, y, '*');
      for (const [x, y] of [[12, 8], [33, 12], [20, 24], [9, 6], [27, 20]]) m.put(x, y, ',');
      for (const [x, y] of [[7, 12], [24, 5], [35, 20], [13, 26], [41, 10], [19, 19], [30, 24]]) m.put(x, y, 'u');
      for (const [x, y] of [[3, 17], [18, 14], [24, 12], [39, 15], [31, 27], [14, 17]]) m.put(x, y, '"');
      // troncos caídos
      m.rect(17, 12, 18, 12, 'L');
      m.rect(29, 21, 30, 21, 'L');
    }),
  },
  {
    id: 'distrito', name: 'Base Militar', desc: 'Última Resistência: muros, portões, holofotes e blindados.', floor: 'concrete',
    theme: 'military', ambient: 'military', weather: 'alarm', boss: 'general', unlock: 15,
    diff: { label: 'Extrema', tier: 4, hp: 1.42, speed: 1.12, count: 1.3 }, eventName: 'Ataque de reforços',
    tip: 'Ligue o gerador, feche os portões e suba nas plataformas. Os reforços trocam de entrada.', lampI: 18,
    light: { sky: 0x141a18, fog: 0x161c1a, sun: 0xc8d8ff, sunI: 1.6, hemi: 1.0 },
    map: makeMap(46, 32, '#', [[20, 0, 4, 'h'], [20, 31, 4, 'h'], [0, 13, 4, 'v'], [45, 13, 4, 'v']], (m) => {
      // muros internos: três setores, com portões e vãos largos
      m.rect(1, 9, 12, 9, 'K'); m.rect(16, 9, 19, 9, 'K'); m.rect(25, 9, 29, 9, 'K'); m.rect(33, 9, 44, 9, 'K');
      m.rect(1, 22, 12, 22, 'K'); m.rect(16, 22, 19, 22, 'K'); m.rect(25, 22, 29, 22, 'K'); m.rect(33, 22, 44, 22, 'K');
      // portões militares
      for (const x of [13, 14, 15, 30, 31, 32]) { m.put(x, 9, ']'); m.put(x, 22, ']'); }
      // barracas
      for (const [x, y] of [[3, 3], [8, 3], [37, 3], [41, 3], [3, 26], [8, 26], [37, 26]]) m.put(x, y, '(');
      // helicóptero destruído e blindado
      m.put(23, 3, ')');
      m.put(21, 26, '{');
      // plataformas elevadas (piso) com pilares nos cantos
      for (const [x, y] of [[5, 13], [38, 13], [5, 18], [38, 18]]) {
        m.rect(x, y, x + 1, y + 1, 'N');
        m.put(x - 1, y, '+'); m.put(x + 2, y + 1, '+');
      }
      // torres de holofote
      for (const [x, y] of [[14, 12], [31, 12], [14, 19], [31, 19]]) m.put(x, y, '}');
      // consoles de portão e de torre + gerador central (sem energia nada disso funciona)
      m.put(22, 11, '7'); m.put(22, 20, '6');
      m.put(23, 16, '8');
      // guarita
      m.put(19, 12, '?');
      // cobertura, munição e barris
      m.rect(17, 15, 19, 15, 'Q'); m.rect(26, 15, 28, 15, 'Q');
      m.rect(9, 12, 11, 12, 'S'); m.rect(34, 12, 36, 12, 'S');
      m.rect(9, 19, 11, 19, 'I'); m.rect(34, 19, 36, 19, 'I');
      for (const [x, y] of [[4, 11], [40, 11], [4, 20], [40, 20]]) m.put(x, y, 'X');
      for (const [x, y] of [[7, 16], [38, 16], [16, 16], [29, 16]]) m.put(x, y, 'x');
    }),
  },
  {
    id: 'cemiterio', name: 'Necrópole', desc: 'Cemitério Velho elevado a necrópole: capela, criptas e covas que vomitam mortos.', floor: 'graveyard',
    theme: 'graveyard', ambient: 'graveyard', weather: 'fog', boss: 'boss', unlock: 1,
    diff: { label: 'Alta', tier: 2, hp: 1.12, speed: 1.04, count: 1.1 }, eventName: 'Neblina densa',
    tip: 'As covas vomitam mortos: não fique parado perto delas.', lampI: 6,
    light: { sky: 0x10141f, fog: 0x10141f, sun: 0x9ab0e0, sunI: 1.3, hemi: 1.0 },
    map: makeMap(46, 32, '#', [[21, 0, 4, 'h'], [21, 31, 4, 'h'], [0, 15, 4, 'v'], [45, 15, 4, 'v']], (m) => {
      // caminhos de terra e manchas de musgo
      m.rect(1, 15, 44, 16, 'd');
      m.rect(22, 1, 23, 30, 'd');
      for (const [x, y] of [[6, 6], [7, 6], [6, 7], [37, 6], [38, 6], [37, 7], [6, 25], [7, 25], [37, 25], [38, 25], [15, 12], [30, 12], [15, 20], [30, 20]]) m.put(x, y, 'm');
      // capela
      m.rect(17, 3, 26, 3, 'K');
      m.rect(17, 4, 17, 8, 'K');
      m.rect(26, 4, 26, 8, 'K');
      m.rect(17, 8, 20, 8, 'K');
      m.rect(23, 8, 26, 8, 'K');
      m.rect(18, 4, 25, 7, '.');
      m.put(21, 10, 'é'); m.put(22, 10, 'é');
      // criptas
      for (const [x, y] of [[5, 10], [39, 10], [5, 22], [39, 22], [12, 3], [32, 3]]) m.put(x, y, 'ã');
      // grades de ferro
      m.rect(4, 12, 12, 12, 'õ'); m.rect(33, 12, 41, 12, 'õ');
      m.rect(4, 19, 12, 19, 'õ'); m.rect(33, 19, 41, 19, 'õ');
      // estátuas e velas
      for (const [x, y] of [[12, 8], [33, 8], [12, 24], [33, 24]]) m.put(x, y, 'â');
      for (const [x, y] of [[19, 2], [24, 2], [9, 9], [36, 9], [9, 23], [36, 23]]) m.put(x, y, 'á');
      // covas: pontos de surgimento
      for (const [x, y] of [[4, 4], [7, 3], [10, 5], [14, 6], [29, 5], [35, 4], [41, 7], [4, 15], [8, 18], [4, 27], [9, 29], [13, 25], [17, 27], [27, 27], [31, 29], [36, 26], [41, 22], [27, 18], [18, 18]]) m.put(x, y, 'ç');
      // árvores secas, muretas e arbustos
      for (const [x, y] of [[2, 2], [43, 2], [2, 29], [43, 29], [14, 11], [31, 21], [20, 25]]) m.put(x, y, 'D');
      m.rect(17, 18, 20, 18, 'Z');
      m.rect(25, 13, 28, 13, 'Z');
      for (const [x, y] of [[15, 14], [30, 14], [8, 14], [37, 14]]) m.put(x, y, 'u');
    }),
  },
];

export const TIPS = [
  'Matar em sequência enche a barra do multiplicador. Ao subir de nível, novas armas são liberadas.',
  'Se você ficar sem matar, o multiplicador cai — mas o que foi liberado continua seu.',
  'Atire nos barris quando a horda estiver perto. Explosões encadeiam!',
  'Barricadas seguram os zumbis por um tempo. Use-as para fechar corredores.',
  'Caixas de munição aparecem pelo mapa durante a partida.',
  'Cuidado: suas explosões também ferem você e seu parceiro.',
  'A cada 5 ondas surge o Colosso: cuidado com a pancada no chão e as pedras.',
  'O Blindado bloqueia tiros de frente: dê a volta ou use explosivos.',
  'Mate o Invocador primeiro, senão ele não para de chamar reforços.',
  'Saia da nuvem roxa do Esporo: ela machuca enquanto você estiver dentro.',
  'Caixas de madeira guardam 2 itens aleatórios: encoste, atire ou golpeie para abrir.',
  'O colete absorve 50 de dano antes da vida. Você o perde se cair.',
  'Faca no F (ou botão direito): ótima quando a horda encosta.',
  'O rádio chama um ataque aéreo no maior grupo: fique fora do círculo vermelho!',
  'A lanterna ofusca: quem está no feixe anda 35% mais devagar.',
  'Itens que você não pode usar (vida cheia, já equipado) ficam no chão para o parceiro.',
];
