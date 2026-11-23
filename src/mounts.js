// Block Horde — Sistema de Montarias 3D (uma por arena)
// Cada montaria tem status, arma própria, assento e modelo 3D desenhado no BoxBatch.

import { WEAPONS } from './data.js';
import { baseMatrix } from './render.js';

export const MOUNT_USE_DIST = 3.2;

export const MOUNTS = {
  praca:   { name: 'Jipe Blindado',             hp: 240, speed: 8.5,  weapon: 'm_mount_mg',     color: 0x4a6a4a, size: 1.6, kind: 'vehicle',  seatY: 0.62, seatZ: -0.15 },
  armazem: { name: 'Empilhadeira de Combate',   hp: 280, speed: 6.5,  weapon: 'm_mount_fork',   color: 0xffc107, size: 1.5, kind: 'forklift', seatY: 0.68, seatZ: -0.22 },
  vale:    { name: 'Javali Mutante',            hp: 200, speed: 9.5,  weapon: 'm_mount_tusk',   color: 0x8a5a3a, size: 1.3, kind: 'beast',    seatY: 0.72, seatZ: -0.05 },
  distrito:{ name: 'Tanque Blindado',           hp: 420, speed: 5.5,  weapon: 'm_mount_cannon', color: 0x5a6a5a, size: 2.0, kind: 'tank',     seatY: 0.94, seatZ: -0.10 },
  coliseu: { name: 'Quadriga de Guerra',        hp: 220, speed: 10.5, weapon: 'm_mount_lance',  color: 0xd4af37, size: 1.8, kind: 'chariot',  seatY: 0.64, seatZ: -0.58 },
  lab:     { name: 'Exoesqueleto Experimental', hp: 200, speed: 7.0,  weapon: 'm_mount_plasma', color: 0x40ffb0, size: 1.2, kind: 'exo',      seatY: 0.46, seatZ:  0.00 },
  templo:  { name: 'Leão de Sekhmet',           hp: 260, speed: 9.0,  weapon: 'm_mount_roar',   color: 0xd4a040, size: 1.6, kind: 'lion',     seatY: 0.78, seatZ: -0.05 },
  naval:   { name: 'Tubarão Esqueleto',         hp: 360, speed: 9.2,  weapon: 'm_mount_bite',   color: 0x40e0ff, size: 2.0, kind: 'shark',    seatY: 0.94, seatZ: -0.12, noRespawn: true },
  templo_2: { name: 'Quadriga Sacrificial',    hp: 260, speed: 11.0, weapon: 'm_mount_lance2',   color: 0xc8a048, size: 1.8, kind: 'chariot', seatY: 0.64, seatZ: -0.58 },
  templo_3: { name: 'Vaca Real',               hp: 240, speed: 9.5,  weapon: 'm_mount_tusk2',    color: 0xd8b070, size: 1.6, kind: 'beast',    seatY: 0.68, seatZ: -0.05 },
  cemiterio: { name: 'Golem de Ossos', hp: 420, speed: 5.0, weapon: 'm_mount_bone', color: 0xd8c8a0, size: 2.2, kind: 'golem', seatY: 1.20, seatZ: -0.10 },
};

// Armas das montarias (registradas em WEAPONS)
const MOUNT_WEAPONS = {
  m_mount_mg:     { name: 'Metralhadora', kind: 'gun',    dmg: 16, range: 24, rate: 0.10, pellets: 1, spread: 0.03, mag: Infinity, ammo: Infinity, color: 0xffd040, sound: 'shot_lmg', heavy: true, kick: 0.05 },
  m_mount_fork:   { name: 'Garfos',       kind: 'gun',    dmg: 34, range: 5,  rate: 0.55, pellets: 1, spread: 0.12, mag: Infinity, ammo: Infinity, color: 0xffc107, sound: 'melee_hit', heavy: true },
  m_mount_tusk:   { name: 'Presas',       kind: 'gun',    dmg: 40, range: 4,  rate: 0.50, pellets: 1, spread: 0.15, mag: Infinity, ammo: Infinity, color: 0xd8b080, sound: 'melee_hit', heavy: true },
  m_mount_cannon: { name: 'Canhão',       kind: 'rocket', dmg: 95, range: 32, rate: 1.30, speed: 20, pellets: 1, spread: 0, radius: 3.4, mag: Infinity, ammo: Infinity, color: 0xff8020, sound: 'shot_rifle', heavy: true, kick: 0.4 },
  m_mount_lance:  { name: 'Lança',        kind: 'gun',    dmg: 46, range: 7,  rate: 0.65, pellets: 1, spread: 0.08, mag: Infinity, ammo: Infinity, color: 0xffe080, sound: 'shot_rifle', heavy: true },
  m_mount_lance2: { name: 'Lança Sacrificial', kind: 'gun', dmg: 42, range: 8, rate: 0.62, pellets: 1, spread: 0.05, mag: Infinity, ammo: Infinity, color: 0xffc060, sound: 'shot_rifle', heavy: true },
  m_mount_tusk2:  { name: 'Presas Sagradas',   kind: 'gun', dmg: 38, range: 4.3, rate: 0.50, pellets: 1, spread: 0.12, mag: Infinity, ammo: Infinity, color: 0xd8b080, sound: 'melee_hit', heavy: true },
  m_mount_plasma: { name: 'Plasma',       kind: 'bolt',   dmg: 24, range: 22, rate: 0.18, speed: 26, pellets: 1, spread: 0, mag: Infinity, ammo: Infinity, color: 0x40ffb0, sound: 'shot_plasma', heavy: false },
  m_mount_roar:   { name: 'Rugido',              kind: 'flame',  dmg: 18, range: 7,  rate: 0.14, arc: 1.1, burn: { dps: 12, t: 3 }, pellets: 1, spread: 0.05, mag: Infinity, ammo: Infinity, color: 0xffb040, sound: 'flame', heavy: false },
  m_mount_bite:   { name: 'Mandíbulas', kind: 'gun',    dmg: 58, range: 5.5, rate: 0.45, pellets: 1, spread: 0.10, mag: Infinity, ammo: Infinity, color: 0x40e0ff, sound: 'stomp', heavy: true },
  m_mount_bone:   { name: 'Punho Ósseo', kind: 'gun',    dmg: 55, range: 3.0, rate: 0.60, pellets: 1, spread: 0.10, mag: Infinity, ammo: Infinity, color: 0xd8c8a0, sound: 'melee_hit', heavy: true },
};

for (const m of Object.values(MOUNTS)) {
  m.maxHp = m.hp;
}

for (const [id, w] of Object.entries(MOUNT_WEAPONS)) {
  if (!WEAPONS[id]) WEAPONS[id] = w;
}

// ---- Habilidades de combate das montarias (fonte única) ----
// A ordem segue os botões de habilidade: heavy, dash, second, special (slot 0..3 do HUD/controle/toque).
// kind: burst (rajada de tiros) | cone (leque frontal) | area (círculo) | line (estocada em linha)
//       sides (lâminas laterais) | charge (investida que atropela) | bite (mordida curta) | nova (onda em volta) | fury (fúria)
// O dano é aplicado pelo sistema real do jogo (Game.mountAbility → damageZombie / hitscan / explosion).
export const MOUNT_SKILLS = {
  praca: [
    { act: 'heavy', name: 'Rajada Pesada', icon: 'target', cd: 5, kind: 'burst', shots: 8, dmg: 22, range: 20, spread: 0.05, sound: 'shot_lmg', desc: 'Rajada de 8 tiros da metralhadora pesada, de longo alcance.' },
    { act: 'dash',  name: 'Atropelamento', icon: 'run',    cd: 8, kind: 'charge', dur: 0.45, dmg: 70, knock: 14, sound: 'roar', desc: 'Acelera e atropela os inimigos à frente.' },
  ],
  armazem: [
    { act: 'heavy',  name: 'Aríete Frontal',       icon: 'paw',   cd: 5, kind: 'cone', range: 3.2, arc: 1.0, dmg: 85, knock: 13, sound: 'hit_armor', desc: 'Golpe dos garfos à frente: dano alto e empurrão forte.' },
    { act: 'second', name: 'Empurrão Hidráulico',  icon: 'burst', cd: 8, kind: 'cone', range: 3.6, arc: 1.4, dmg: 25, knock: 18, stun: 0.4, sound: 'stomp', desc: 'Empurra todos à frente sem matar: abre espaço para manobrar.' },
  ],
  vale: [
    { act: 'heavy', name: 'Garras',    icon: 'paw', cd: 4, kind: 'cone', range: 3.4, arc: 1.6, dmg: 55, knock: 7, sound: 'blade', desc: 'Garras em leque: fere vários inimigos à frente.' },
    { act: 'dash',  name: 'Investida', icon: 'run', cd: 7, kind: 'charge', dur: 0.4, dmg: 55, knock: 10, sound: 'roar', desc: 'Corrida curta que atropela quem estiver no caminho.' },
  ],
  distrito: [
    { act: 'heavy', name: 'Metralhadora de Casco', icon: 'target', cd: 4, kind: 'burst', shots: 6, dmg: 18, range: 18, spread: 0.05, sound: 'shot_lmg', desc: 'Seis tiros de metralhadora para alvos próximos.' },
  ],
  coliseu: [
    { act: 'heavy',  name: 'Estocada de Lança', icon: 'target', cd: 5, kind: 'line', range: 8, width: 1.0, dmg: 85, knock: 8, sound: 'blade', desc: 'Estocada longa que fura a fila de inimigos à frente.' },
    { act: 'dash',   name: 'Atropelamento',     icon: 'run',    cd: 8, kind: 'charge', dur: 0.45, dmg: 70, knock: 14, sound: 'roar', desc: 'Acelera e atropela os inimigos à frente.' },
    { act: 'second', name: 'Lâminas Laterais',  icon: 'burst',  cd: 6, kind: 'sides', offset: 1.5, radius: 2.0, dmg: 60, knock: 9, sound: 'blade', desc: 'As foices das rodas cortam dos dois lados.' },
  ],
  lab: [
    { act: 'heavy',  name: 'Braço Mecânico',  icon: 'paw',   cd: 4, kind: 'cone', range: 3.0, arc: 1.1, dmg: 70, knock: 11, sound: 'hit_armor', desc: 'Golpe pesado do braço hidráulico à frente.' },
    { act: 'second', name: 'Pulso Energético', icon: 'burst', cd: 9, kind: 'area', radius: 4.5, dmg: 65, knock: 6, stun: 0.8, sound: 'emp', desc: 'Descarga de plasma em volta: dano em área e atordoa.' },
  ],
  templo: [
    { act: 'heavy',  name: 'Patada Solar',     icon: 'paw',   cd: 4, kind: 'cone', range: 3.2, arc: 1.3, dmg: 65, knock: 10, sound: 'blade', desc: 'Patada de leão com dano alto à frente.' },
    { act: 'dash',   name: 'Investida Sagrada', icon: 'run',   cd: 8, kind: 'charge', dur: 0.4, dmg: 60, knock: 12, sound: 'roar', desc: 'Avanço sagrado que atropela os inimigos.' },
    { act: 'second', name: 'Onda Solar',       icon: 'burst', cd: 9, kind: 'area', radius: 5, dmg: 55, knock: 5, burn: { dps: 10, t: 2.5 }, sound: 'wave', desc: 'Onda de fogo em volta: dano em área e queimadura.' },
  ],
  cemiterio: [
    { act: 'heavy',  name: 'Golpe de Ossos',  icon: 'paw',   cd: 4, kind: 'cone', range: 3.6, arc: 1.4, dmg: 80, knock: 10, sound: 'melee_hit', desc: 'Golpe pesado de osso: dano alto a frente.' },
    { act: 'dash',   name: 'Investida Ossea', icon: 'run',   cd: 8, kind: 'charge', dur: 0.45, dmg: 70, knock: 12, sound: 'stomp', desc: 'Avanco pesado que atropela os inimigos.' },
    { act: 'second', name: 'Onda de Ossos',    icon: 'burst', cd: 9, kind: 'area', radius: 5, dmg: 70, knock: 6, sound: 'stomp', desc: 'Onda de energia ossea em volta: dano em area.' },
    { act: 'special', name: 'Furia do Tumulo', icon: 'flame', cd: 18, kind: 'fury', dur: 8, sound: 'roar', desc: 'Por 8 s: mais velocidade de ataque e dano.' },
  ],
  naval: [
    { act: 'heavy',   name: 'Mordida Destruidora', icon: 'paw',   cd: 4,  kind: 'bite', dmg: 160, radius: 1.6, offset: 1.8, knock: 4, sound: 'stomp', desc: 'Mordida frontal de dano muito alto.' },
    { act: 'dash',    name: 'Investida Abissal',   icon: 'run',   cd: 7,  kind: 'charge', dur: 0.45, dmg: 30, ram: 2, knock: 6, sound: 'roar', desc: 'Avanço rápido que atropela quem estiver no caminho.' },
    { act: 'second',  name: 'Onda Esquelética',    icon: 'burst', cd: 10, kind: 'nova', radius: 4.5, dmg: 90, knock: 4, stun: 1.0, sound: 'stomp', desc: 'Impacto aquático em volta: dano em área e atordoa.' },
    { act: 'special', name: 'Fúria Predadora',     icon: 'flame', cd: 18, kind: 'fury', dur: 8, sound: 'roar', desc: 'Por 8 s: mais velocidade de ataque e dano.' },
  ],
  templo_2: [
    { act: 'heavy', name: 'Gado da Sacrifica', icon: 'target', cd: 5, kind: 'burst', shots: 6, dmg: 12, range: 20, spread: 0.05, sound: 'shot_rifle', desc: 'Rajada do escoteiro centenário: inimigos no alcance ganham dano em pilha.' },
    { act: 'dash',  name: 'Investida da Guarda', icon: 'run', cd: 8, kind: 'charge', dur: 0.45, dmg: 68, knock: 14, sound: 'roar', desc: 'Solene avanço que atropela quem estiver no caminho.' },
  ],
  templo_3: [
    { act: 'heavy', name: 'Mordida Real', icon: 'paw', cd: 4, kind: 'cone', range: 3.2, arc: 1.5, dmg: 58, knock: 9, sound: 'blade', desc: 'Garras do vaca real em leque: fere vários inimigos à frente.' },
    { act: 'dash',  name: 'Investida Sacrificial', icon: 'run', cd: 7, kind: 'charge', dur: 0.4, dmg: 60, knock: 12, sound: 'roar', desc: 'Corrida pesada que atropela os invasores.' },
  ],
};
// atropelamento passivo: dano ao encostar com velocidade (só veículos e montarias pesadas)
export const MOUNT_RAM = {
  praca:    { dmg: 26, knock: 9 },
  armazem:  { dmg: 18, knock: 7 },
  distrito: { dmg: 30, knock: 11 },
  coliseu:  { dmg: 28, knock: 10 },
  vale:     { dmg: 22, knock: 8 },
  templo:   { dmg: 20, knock: 7 },
  templo_2: { dmg: 26, knock: 8 },
  templo_3: { dmg: 24, knock: 7 },
  cemiterio: { dmg: 24, knock: 9 },
};

// ---- Catálogo (menu MONTARIAS + HUD contextual) — só informação, não altera gameplay ----
// skills: ações extras da montaria; "act" liga a habilidade à ação configurável em mountControls.js
export const MOUNT_INFO = {
  praca:   { arena: 'Cidade Abandonada', desc: 'Veículo militar blindado com metralhadora pesada no teto. Rápido e resistente nas ruas.', traits: ['Veículo', 'Tiro contínuo', 'Alcance longo'], attack: 'Metralhadora: rajada contínua; rajada pesada e atropelamento.' },
  armazem: { arena: 'Complexo Industrial', desc: 'Empilhadeira reforçada que usa os garfos como arma de impacto em curta distância.', traits: ['Veículo', 'Corpo a corpo', 'Resistente'], attack: 'Garfos: golpe frontal, aríete e empurrão hidráulico.' },
  vale:    { arena: 'Floresta Sombria', desc: 'Javali mutante veloz que ataca com presas afiadas.', traits: ['Criatura', 'Corpo a corpo', 'Ágil'], attack: 'Presas: mordida curta, garras e investida.' },
  distrito:{ arena: 'Base Militar', desc: 'Tanque pesado e lento, com canhão explosivo de longo alcance.', traits: ['Veículo pesado', 'Explosivo', 'Muito resistente'], attack: 'Canhão explosivo e metralhadora de casco.' },
  coliseu: { arena: 'Coliseu', desc: 'Carro de guerra puxado a cavalos, o mais rápido de todos, armado com lança.', traits: ['Carro de guerra', 'Muito rápido', 'Corpo a corpo'], attack: 'Lança: estocada, atropelamento e lâminas laterais.' },
  lab:     { arena: 'Laboratório de Pesquisa', desc: 'Armadura experimental que dispara rajadas rápidas de plasma.', traits: ['Armadura', 'Energia', 'Cadência alta'], attack: 'Plasma: rajadas, braço mecânico e pulso energético.' },
  templo:  { arena: 'Templo Antigo', desc: 'Leão sagrado de Sekhmet que solta um rugido de fogo à frente.', traits: ['Criatura', 'Fogo', 'Área curta'], attack: 'Rugido de fogo, patada solar, investida e onda solar.' },
  naval:   { arena: 'Cemitério Naval', desc: 'Esqueleto de tubarão com mandíbulas enormes e plataforma para o piloto. Unidade única: destruído, não volta na partida.', traits: ['Criatura', 'Corpo a corpo', '4 habilidades', 'Única por partida'], attack: 'Mandíbulas: mordida frontal de curta distância.' },
  templo_2: { arena: 'Templo Antigo', desc: 'Quadriga real dos santuários: carro de guerra veloz com alcance longo.', traits: ['Veículo', 'Carro de guerra', 'Alcance longo'], attack: 'Lança sacrificial: estocada longa, gado da sacrifício e investida da guarda.' },
  templo_3: { arena: 'Templo Antigo', desc: 'Vaca real dos santuários: corpo-a-corpo robusto com presas afiadas.', traits: ['Criatura', 'Bruto', 'Corpo a corpo'], attack: 'Presas sagradas: mordida curta, garras e investida sacrificial.' },
  cemiterio: { arena: 'Necrópole', desc: 'Golem de ossos animado por magia negra. Lento, pesado e devastador em combate corpo a corpo.', traits: ['Criatura', 'Corpo a corpo', 'Pesado', '4 habilidades'], attack: 'Punho ósseo: golpe pesado de curta distância.' },
};
// cada montaria recebe suas habilidades reais no catálogo/HUD/controles
for (const [id, list] of Object.entries(MOUNT_SKILLS)) if (MOUNT_INFO[id]) MOUNT_INFO[id].skills = list;
// ordem do catálogo; entradas "future" ainda não existem no jogo (só aparecem como "Em breve")
export const MOUNT_CATALOG = [
  'praca', 'armazem', 'vale', 'distrito',
  'cemiterio',
  'coliseu', 'lab', 'templo', 'templo_2', 'templo_3', 'naval',
];

// helpers
export function isMountWeapon(id) { return !!MOUNT_WEAPONS[id]; }
export function mountForArena(arenaId) { return MOUNTS[arenaId] || null; }
export function mountDef(id) { return MOUNTS[id] || null; }

// Progressão de montarias por confronto (arena): em cada confronto contra um chefe, uma montaria diferente é liberada.
export const ARENA_MOUNT_ORDER = {
  templo: ['templo', 'templo_2', 'templo_3'],
  naval:  ['naval'],
};
export function mountOrderForArena(arenaId) { return ARENA_MOUNT_ORDER[arenaId] || [arenaId]; }
export function allMountIds() { return Object.keys(MOUNTS); }
export function mountWeaponDef(id) { return MOUNT_WEAPONS[id] || null; }
export function mountSkills(id) { return MOUNT_SKILLS[id] || null; }
// habilidade da montaria no slot do botão (0..3): heavy, dash, second, special
const MOUNT_SLOT = { heavy: 0, dash: 1, second: 2, special: 3 };
export function mountSkillAt(id, slot) {
  const list = MOUNT_SKILLS[id];
  if (!list) return null;
  return list.find((s) => MOUNT_SLOT[s.act] === slot) || null;
}
export function mountRam(id) { return MOUNT_RAM[id] || null; }

// Desenha o modelo 3D voxel de cada montaria (+ marcador luminoso quando estacionada)
export function drawMount(B, G, wm, time, near = false) {
  if (!wm || !wm.alive || !wm.def) return;
  const def = wm.def;
  const flash = wm.hurtT > 0;
  const c = (hex) => (flash ? 0xffffff : hex);
  const w = wm.wheelT || 0;
  const bob = wm.rider ? Math.sin(w * 2) * 0.03 : 0;
  const base = baseMatrix(wm.x, bob, wm.z, wm.facing, 1);

  const p = (px, py, pz, rx, rz, cx, cy, cz, sx, sy, sz, col) =>
    B.part(base, px, py, pz, rx, rz, cx, cy, cz, sx, sy, sz, c(col));
  const g = (px, py, pz, rx, rz, cx, cy, cz, sx, sy, sz, col) =>
    G.part(base, px, py, pz, rx, rz, cx, cy, cz, sx, sy, sz, col);
  const box = (cx, cy, cz, sx, sy, sz, col) => p(0, 0, 0, 0, 0, cx, cy, cz, sx, sy, sz, col);
  const glow = (cx, cy, cz, sx, sy, sz, col) => g(0, 0, 0, 0, 0, cx, cy, cz, sx, sy, sz, col);

  // Marcador luminoso no chão + seta flutuante quando estacionada (facilita localizar no mapa)
  if (!wm.rider) {
    const ringCol = near ? 0xffc107 : 0x29b6f6;
    const rad = Math.max(1.35, def.size * 0.95);
    const segs = 16;
    for (let k = 0; k < segs; k++) {
      const a = (k / segs) * Math.PI * 2 + time * (near ? 1.8 : 0.7);
      const bx = wm.x + Math.sin(a) * rad;
      const bz = wm.z + Math.cos(a) * rad;
      G.box(bx, 0.05, bz, 0.28, 0.03, 0.08, k % 2 === 0 ? ringCol : def.color, a + Math.PI / 2);
    }
    // Diamante/beacon flutuante acima da montaria estacionada
    const by = 2.35 + Math.sin(time * 3.8) * 0.16;
    G.box(wm.x, by, wm.z, 0.28, 0.28, 0.28, near ? 0xffc107 : 0x29b6f6, time * 2.2);
    G.box(wm.x, by - 0.34, wm.z, 0.14, 0.18, 0.14, 0xffc107, -time * 2.2);
  }

  switch (def.kind) {
    case 'vehicle': {
      // JIPE BLINDADO (praca)
      const wr = w;
      for (const sx of [-0.76, 0.76]) {
        for (const sz of [-0.78, 0.78]) {
          p(sx, 0.30, sz, wr, 0, 0, 0, 0, 0.28, 0.56, 0.56, 0x1a1e24);
          p(sx + (sx > 0 ? 0.11 : -0.11), 0.30, sz, wr, 0, 0, 0, 0, 0.08, 0.26, 0.26, 0x6b7280);
        }
      }
      box(0, 0.44, 0, 1.38, 0.28, 2.18, 0x2d3a2d);        // chassi inferior
      box(0, 0.70, 0.58, 1.28, 0.38, 0.92, 0x4a6a4a);     // capô dianteiro
      box(0, 0.66, -0.58, 1.30, 0.34, 0.96, 0x3d583d);    // caçamba/assento
      box(0, 0.52, 1.14, 1.32, 0.20, 0.14, 0x232830);     // para-choque blindado
      box(0, 0.72, 1.07, 0.86, 0.24, 0.06, 0x1f242b);     // grade frontal
      glow(-0.46, 0.72, 1.09, 0.22, 0.14, 0.06, 0xffe880); // farol E
      glow( 0.46, 0.72, 1.09, 0.22, 0.14, 0.06, 0xffe880); // farol D
      glow(-0.48, 0.68, -1.09, 0.20, 0.12, 0.05, 0xe53935); // lanterna E
      glow( 0.48, 0.68, -1.09, 0.20, 0.12, 0.05, 0xe53935); // lanterna D
      // Gaiola / santantônio
      for (const sx of [-0.58, 0.58]) {
        box(sx, 1.18, 0.12, 0.09, 0.76, 0.09, 0x262c34);
        box(sx, 1.18, -0.82, 0.09, 0.76, 0.09, 0x262c34);
        box(sx, 1.54, -0.35, 0.09, 0.09, 1.02, 0x262c34);
      }
      box(0, 1.54, 0.12, 1.24, 0.09, 0.09, 0x262c34);
      box(0, 1.54, -0.82, 1.24, 0.09, 0.09, 0x262c34);
      // Metralhadora montada no teto
      box(0, 1.66, -0.35, 0.24, 0.20, 0.46, 0x2e3440);
      box(0, 1.68, 0.18, 0.10, 0.10, 0.72, 0x1b1f28);
      glow(0, 1.68, 0.56, 0.12, 0.12, 0.08, 0xffc107);
      break;
    }

    case 'forklift': {
      // EMPILHADEIRA DE COMBATE (armazem)
      const wr = w;
      for (const sx of [-0.66, 0.66]) {
        p(sx, 0.26, 0.55, wr, 0, 0, 0, 0, 0.24, 0.48, 0.48, 0x1a1e24);
        p(sx, 0.22, -0.62, wr, 0, 0, 0, 0, 0.22, 0.40, 0.40, 0x1a1e24);
        p(sx + (sx > 0 ? 0.10 : -0.10), 0.26, 0.55, wr, 0, 0, 0, 0, 0.06, 0.22, 0.22, 0xffc107);
      }
      box(0, 0.48, -0.10, 1.18, 0.46, 1.58, 0xffc107);    // corpo amarelo industrial
      box(0, 0.56, -0.78, 1.22, 0.56, 0.42, 0x22262e);    // contrapeso traseiro escuro
      box(0, 0.86, -0.78, 1.14, 0.08, 0.34, 0xffc107);    // faixa de alerta
      // Cabine / grade protetora
      for (const sx of [-0.52, 0.52]) {
        box(sx, 1.18, 0.35, 0.09, 0.96, 0.09, 0x1f242c);
        box(sx, 1.18, -0.58, 0.09, 0.96, 0.09, 0x1f242c);
        box(sx, 1.64, -0.12, 0.09, 0.09, 1.02, 0x1f242c);
      }
      box(0, 1.64, -0.12, 1.10, 0.08, 0.88, 0x262c36);
      // Giroflex âmbar no teto
      glow(0, 1.78, -0.35, 0.18, 0.18, 0.18, Math.sin(time * 12) > 0 ? 0xffc107 : 0xff6f00);
      // Mastro frontal + garfos de combate reforçados
      for (const sx of [-0.42, 0.42]) {
        box(sx, 1.12, 0.82, 0.12, 1.62, 0.14, 0x22262e);
        box(sx, 0.28, 1.48, 0.16, 0.10, 1.18, 0x9aa4b2);  // garfo de aço
        glow(sx, 0.28, 2.08, 0.14, 0.08, 0.08, 0xffc107); // ponta energizada
      }
      box(0, 0.52, 0.88, 0.98, 0.32, 0.10, 0x353c48);     // travessa do garfo
      break;
    }

    case 'beast': {
      // JAVALI MUTANTE (vale)
      const s = Math.sin(w) * 0.45;
      // 4 patas musculosas articuladas
      p(-0.46, 0.52,  0.52,  s, 0, 0, -0.24, 0, 0.26, 0.52, 0.28, 0x5c3822);
      p( 0.46, 0.52,  0.52, -s, 0, 0, -0.24, 0, 0.26, 0.52, 0.28, 0x5c3822);
      p(-0.46, 0.52, -0.56, -s, 0, 0, -0.24, 0, 0.28, 0.52, 0.30, 0x5c3822);
      p( 0.46, 0.52, -0.56,  s, 0, 0, -0.24, 0, 0.28, 0.52, 0.30, 0x5c3822);
      // Tronco robusto + crina dorsal + sela
      box(0, 0.72, -0.02, 1.06, 0.68, 1.56, 0x6d452c);
      box(0, 1.10,  0.10, 0.24, 0.20, 1.24, 0x3a2012);    // crina/espinhos dorsais
      box(0, 1.04, -0.08, 0.86, 0.14, 0.64, 0x2e231c);    // sela tática
      // Cabeça larga + focinho + presas curvas gigantes
      box(0, 0.74,  0.96, 0.82, 0.56, 0.62, 0x7d4f33);
      box(0, 0.58,  1.34, 0.48, 0.32, 0.26, 0x9c6b4a);    // focinho
      glow(-0.28, 0.86, 1.22, 0.12, 0.10, 0.08, 0xff9800); // olho mutante E
      glow( 0.28, 0.86, 1.22, 0.12, 0.10, 0.08, 0xff9800); // olho mutante D
      // Presas marfim
      p(-0.34, 0.56, 1.26, -0.45,  0.22, 0, 0.16, 0.22, 0.12, 0.14, 0.52, 0xf2e8cf);
      p( 0.34, 0.56, 1.26, -0.45, -0.22, 0, 0.16, 0.22, 0.12, 0.14, 0.52, 0xf2e8cf);
      // Orelhas e cauda
      box(-0.38, 1.08, 0.78, 0.18, 0.22, 0.12, 0x5c3822);
      box( 0.38, 1.08, 0.78, 0.18, 0.22, 0.12, 0x5c3822);
      p(0, 0.82, -0.86, 0.3 + Math.sin(time * 6) * 0.15, 0, 0, -0.14, -0.12, 0.10, 0.32, 0.10, 0x4a2a18);
      break;
    }

    case 'tank': {
      // TANQUE BLINDADO (distrito)
      // Esteiras blindadas esquerda/direita
      for (const sx of [-0.92, 0.92]) {
        box(sx, 0.32, 0, 0.42, 0.54, 2.48, 0x1e2228);
        for (const sz of [-0.88, -0.30, 0.30, 0.88]) {
          p(sx + (sx > 0 ? 0.18 : -0.18), 0.26, sz, w, 0, 0, 0, 0, 0.10, 0.30, 0.30, 0x4b535e);
        }
      }
      // Casco blindado militar
      box(0, 0.58, 0, 1.56, 0.46, 2.28, 0x4a594a);
      box(0, 0.68, 0.98, 1.48, 0.28, 0.44, 0x5a6a5a);     // blindagem frontal inclinada
      box(0, 0.82, 0.45, 1.52, 0.06, 0.16, 0xffc107);     // faixa tática amarela
      glow(-0.56, 0.68, 1.22, 0.20, 0.12, 0.06, 0xffe082);
      glow( 0.56, 0.68, 1.22, 0.20, 0.12, 0.06, 0xffe082);
      glow(-0.56, 0.64, -1.16, 0.22, 0.12, 0.05, 0xe53935);
      glow( 0.56, 0.64, -1.16, 0.22, 0.12, 0.05, 0xe53935);
      // Torre blindada + canhão pesado
      box(0, 1.04, -0.08, 1.18, 0.48, 1.22, 0x3d4b3d);
      box(0, 1.32, -0.12, 0.68, 0.12, 0.68, 0x2e382e);    // escotilha do comandante
      box(0, 1.06,  1.15, 0.22, 0.22, 1.56, 0x2b3138);    // cano do canhão
      box(0, 1.06,  1.94, 0.32, 0.30, 0.24, 0x1e2228);    // freio de boca
      glow(0, 1.06, 2.08, 0.18, 0.18, 0.06, 0xff8020);
      break;
    }

    case 'chariot': {
      // QUADRIGA DE GUERRA (coliseu)
      const wr = w;
      // Rodas douradas com lâminas laterais
      for (const sx of [-0.88, 0.88]) {
        p(sx, 0.46, -0.58, wr, 0, 0, 0, 0, 0.14, 0.86, 0.86, 0x8c6820);
        p(sx, 0.46, -0.58, wr + Math.PI / 4, 0, 0, 0, 0, 0.16, 0.72, 0.16, 0xd4af37);
        p(sx + (sx > 0 ? 0.22 : -0.22), 0.46, -0.58, 0, 0, 0, 0, 0, 0.36, 0.10, 0.16, 0xcfd8dc); // foice de roda
      }
      // Plataforma e escudo frontal da biga
      box(0, 0.44, -0.58, 1.46, 0.16, 1.08, 0x6b4c1a);
      box(0, 0.86, -0.10, 1.38, 0.72, 0.16, 0xd4af37);    // parapeito dourado
      box(-0.66, 0.80, -0.58, 0.14, 0.60, 0.96, 0xb8922a);
      box( 0.66, 0.80, -0.58, 0.14, 0.60, 0.96, 0xb8922a);
      box(0, 0.86, -0.01, 0.46, 0.48, 0.06, 0xe53935);    // brasão carmesim
      // Lança de guerra montada à direita
      box(0.76, 1.02, 0.52, 0.09, 0.09, 1.90, 0x6b4c1a);
      glow(0.76, 1.02, 1.54, 0.14, 0.14, 0.28, 0xffe080);
      // Hastes de atrelagem + corcel blindado na frente
      box(-0.34, 0.62, 0.44, 0.08, 0.08, 1.15, 0x8c6820);
      box( 0.34, 0.62, 0.44, 0.08, 0.08, 1.15, 0x8c6820);
      const s = Math.sin(w * 1.2) * 0.5;
      p(-0.24, 0.58, 1.38,  s, 0, 0, -0.28, 0, 0.16, 0.58, 0.18, 0xc7b299);
      p( 0.24, 0.58, 1.38, -s, 0, 0, -0.28, 0, 0.16, 0.58, 0.18, 0xc7b299);
      p(-0.24, 0.58, 0.72, -s, 0, 0, -0.28, 0, 0.16, 0.58, 0.18, 0xc7b299);
      p( 0.24, 0.58, 0.72,  s, 0, 0, -0.28, 0, 0.16, 0.58, 0.18, 0xc7b299);
      box(0, 0.84, 1.05, 0.66, 0.52, 1.08, 0xd4af37);     // armadura do corcel
      box(0, 1.24, 1.54, 0.36, 0.48, 0.36, 0xd8c3a5);     // pescoço
      box(0, 1.44, 1.74, 0.34, 0.28, 0.48, 0xd4af37);     // elmo da cabeça
      glow(-0.14, 1.46, 1.94, 0.08, 0.08, 0.06, 0xffc107);
      glow( 0.14, 1.46, 1.94, 0.08, 0.08, 0.06, 0xffc107);
      break;
    }

    case 'exo': {
      // EXOESQUELETO EXPERIMENTAL (lab)
      const s = Math.sin(w) * 0.42;
      // Pernas hidráulicas bípedes
      p(-0.42, 0.78, 0,  s, 0, 0, -0.36, 0, 0.30, 0.76, 0.36, 0x263238);
      p( 0.42, 0.78, 0, -s, 0, 0, -0.36, 0, 0.30, 0.76, 0.36, 0x263238);
      p(-0.42, 0.78, 0,  s, 0, 0, -0.72, 0.08, 0.36, 0.16, 0.52, 0x37474f);
      p( 0.42, 0.78, 0, -s, 0, 0, -0.72, 0.08, 0.36, 0.16, 0.52, 0x37474f);
      // Estrutura do tronco + reator dorsal de plasma
      box(0, 0.92, -0.18, 0.96, 0.66, 0.54, 0x1b262c);
      box(0, 1.32, -0.44, 0.68, 0.78, 0.34, 0x2e3b46);
      glow(0, 1.34, -0.62, 0.32, 0.44, 0.08, 0x40ffb0);   // reator de plasma
      // Ombreiras pesadas + braços canhão de plasma
      for (const sx of [-0.74, 0.74]) {
        box(sx, 1.54, 0.04, 0.44, 0.42, 0.54, 0x2e3b46);
        glow(sx, 1.56, 0.32, 0.22, 0.14, 0.06, 0x40ffb0);
        box(sx, 1.12, 0.42, 0.26, 0.28, 0.86, 0x37474f);
        glow(sx, 1.12, 0.88, 0.20, 0.20, 0.14, 0x40ffb0); // emissor de plasma
      }
      // Barra protetora frontal
      box(0, 1.82, 0.02, 1.06, 0.10, 0.52, 0x263238);
      glow(0, 1.82, 0.29, 0.62, 0.06, 0.06, 0x40ffb0);
      break;
    }

    case 'shark': {
      // TUBARÃO ESQUELETO (Arena 09 — Cemitério Naval)
      const sway = Math.sin(time * 4 + w) * 0.25;
      box(0, 0.72, -0.08, 0.42, 0.40, 2.05, 0xd8d2c4);
      for (const sz of [-0.62, -0.26, 0.10, 0.46]) {
        box(-0.56, 0.70, sz, 0.16, 0.62, 0.14, 0xeae4d6);
        box( 0.56, 0.70, sz, 0.16, 0.62, 0.14, 0xeae4d6);
        box(0, 0.40, sz, 1.18, 0.14, 0.14, 0xcac2b2);
      }
      box(0, 0.98, -0.14, 0.96, 0.12, 0.92, 0x523b2c);
      box(-0.52, 0.96, -0.14, 0.10, 0.24, 0.88, 0x3b3f46);
      box( 0.52, 0.96, -0.14, 0.10, 0.24, 0.88, 0x3b3f46);
      box(0, 0.72,  0.64, 1.24, 0.12, 0.12, 0x48382c);
      box(0, 1.38, -0.44, 0.12, 0.66, 0.46, 0xd8d2c4);
      p(-0.84, 0.52, 0.24, 0,  0.35, 0, 0, 0, 0.68, 0.12, 0.42, 0xcac2b2);
      p( 0.84, 0.52, 0.24, 0, -0.35, 0, 0, 0, 0.68, 0.12, 0.42, 0xcac2b2);
      box(0, 0.92, 1.18, 1.06, 0.42, 0.88, 0xeae4d6);
      box(0, 0.46, 1.14, 0.94, 0.22, 0.78, 0xd4cebe);
      for (const tx of [-0.36, -0.12, 0.12, 0.36]) {
        box(tx, 0.68, 1.54, 0.10, 0.22, 0.08, 0xffffff);
        box(tx, 0.58, 1.48, 0.09, 0.16, 0.08, 0xffffff);
      }
      glow(-0.42, 1.02, 1.34, 0.16, 0.12, 0.12, 0x40f0ff);
      glow( 0.42, 1.02, 1.34, 0.16, 0.12, 0.12, 0x40f0ff);
      glow(0, 0.72, 0.10, 0.34, 0.30, 0.95, 0x29b6f6);
      p(0, 0.72, -1.24, 0, sway, 0, 0, 0, -0.35, 0.26, 0.26, 0.65, 0xd8d2c4);
      p(0, 0.84, -1.78, 0, sway * 1.4, 0, 0, 0, 0, 0.12, 0.92, 0.46, 0xeae4d6);
      break;
    }

    case 'golem': {
      const s = Math.sin(w) * 0.18;
      box(0, 0.55, 0, 1.3, 1.1, 1.1, 0xc8b890);
      box(0, 1.35, 0, 1.0, 0.9, 0.9, 0xd8c8a0);
      box(0, 1.95, 0, 0.7, 0.6, 0.7, 0xe8d8b0);
      p(-0.85, 1.3, 0, s, 0, 0, 0, 0, 0.35, 0.9, 0.35, 0xb8a880);
      p(0.85, 1.3, 0, -s, 0, 0, 0, 0, 0.35, 0.9, 0.35, 0xb8a880);
      p(-0.35, 0.2, 0.2, 0, 0, 0, 0, 0, 0.4, 0.4, 0.4, 0xa89870);
      p(0.35, 0.2, 0.2, 0, 0, 0, 0, 0, 0.4, 0.4, 0.4, 0xa89870);
      glow(-0.18, 2.0, 0.32, 0.12, 0.10, 0.06, 0x2ecc71);
      glow(0.18, 2.0, 0.32, 0.12, 0.10, 0.06, 0x2ecc71);
      break;
    }
    case 'lion':
    default: {
      // LEÃO DE SEKHMET (templo)
      const s = Math.sin(w) * 0.48;
      // Patas douradas de leão
      p(-0.42, 0.58,  0.56,  s, 0, 0, -0.28, 0, 0.24, 0.58, 0.26, 0xc48f32);
      p( 0.42, 0.58,  0.56, -s, 0, 0, -0.28, 0, 0.24, 0.58, 0.26, 0xc48f32);
      p(-0.42, 0.58, -0.58, -s, 0, 0, -0.28, 0, 0.26, 0.58, 0.28, 0xc48f32);
      p( 0.42, 0.58, -0.58,  s, 0, 0, -0.28, 0, 0.26, 0.58, 0.28, 0xc48f32);
      // Corpo régio + colar egípcio lápis-lazúli
      box(0, 0.78, -0.02, 0.92, 0.58, 1.56, 0xd4a040);
      box(0, 0.88,  0.54, 1.02, 0.54, 0.34, 0x29b6f6);    // colar egípcio azul
      box(0, 0.88,  0.62, 1.06, 0.16, 0.20, 0xffc107);    // friso dourado
      // Juba volumosa + cabeça + disco solar de Sekhmet
      box(0, 0.98,  0.86, 0.98, 0.84, 0.54, 0x8d5b18);    // juba
      box(0, 0.94,  1.18, 0.62, 0.52, 0.46, 0xd4a040);    // cabeça
      box(0, 0.80,  1.44, 0.38, 0.26, 0.22, 0xe0b458);    // focinho
      glow(-0.20, 1.04, 1.42, 0.12, 0.08, 0.06, 0xffd54f); // olho solar E
      glow( 0.20, 1.04, 1.42, 0.12, 0.08, 0.06, 0xffd54f); // olho solar D
      // Disco solar brilhante sobre a cabeça
      glow(0, 1.54, 1.08, 0.38, 0.38, 0.10, 0xff9800);
      glow(0, 1.54, 1.08, 0.22, 0.22, 0.14, 0xffe082);
      // Cauda com tufo
      p(0, 0.86, -0.84, 0.4 + Math.sin(time * 5) * 0.18, 0, 0, -0.18, -0.22, 0.10, 0.44, 0.10, 0xc48f32);
      p(0, 0.64, -1.10, 0, 0, 0, 0, 0, 0.18, 0.18, 0.18, 0x8d5b18);
      break;
    }
  }
}
