// Block Horde — Sistema de Montarias 3D (uma por arena)
// Cada montaria tem status, arma própria, assento e modelo 3D desenhado no BoxBatch.

import * as THREE from 'three';
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
  m_mount_mg:     { name: 'Metralhadora', kind: 'gun',    dmg: 16, range: 24, rate: 0.10, pellets: 1, spread: 0.03, mag: Infinity, ammo: Infinity, color: 0xffd040, sound: 'mnt_jeep_mg', heavy: true, kick: 0.05 },
  m_mount_fork:   { name: 'Garfos',       kind: 'gun',    dmg: 34, range: 5,  rate: 0.55, pellets: 1, spread: 0.12, mag: Infinity, ammo: Infinity, color: 0xffc107, sound: 'mnt_fork_hit', heavy: true },
  m_mount_tusk:   { name: 'Presas',       kind: 'gun',    dmg: 40, range: 4,  rate: 0.50, pellets: 1, spread: 0.15, mag: Infinity, ammo: Infinity, color: 0xd8b080, sound: 'mnt_boar_tusk', heavy: true },
  m_mount_cannon: { name: 'Canhão',       kind: 'rocket', dmg: 95, range: 32, rate: 1.30, speed: 20, pellets: 1, spread: 0, radius: 3.4, mag: Infinity, ammo: Infinity, color: 0xff8020, sound: 'mnt_tank_cannon', heavy: true, kick: 0.4 },
  m_mount_lance:  { name: 'Lança',        kind: 'gun',    dmg: 46, range: 7,  rate: 0.65, pellets: 1, spread: 0.08, mag: Infinity, ammo: Infinity, color: 0xffe080, sound: 'mnt_chariot_lance', heavy: true },
  m_mount_lance2: { name: 'Lança Sacrificial', kind: 'gun', dmg: 42, range: 8, rate: 0.62, pellets: 1, spread: 0.05, mag: Infinity, ammo: Infinity, color: 0xffc060, sound: 'mnt_chariot_lance', heavy: true },
  m_mount_tusk2:  { name: 'Presas Sagradas',   kind: 'gun', dmg: 38, range: 4.3, rate: 0.50, pellets: 1, spread: 0.12, mag: Infinity, ammo: Infinity, color: 0xd8b080, sound: 'mnt_cow_tusk', heavy: true },
  m_mount_plasma: { name: 'Plasma',       kind: 'bolt',   dmg: 24, range: 22, rate: 0.18, speed: 26, pellets: 1, spread: 0, mag: Infinity, ammo: Infinity, color: 0x40ffb0, sound: 'mnt_exo_plasma', heavy: false },
  m_mount_roar:   { name: 'Rugido',              kind: 'flame',  dmg: 18, range: 7,  rate: 0.14, arc: 1.1, burn: { dps: 12, t: 3 }, pellets: 1, spread: 0.05, mag: Infinity, ammo: Infinity, color: 0xffb040, sound: 'mnt_lion_roar', heavy: false },
  m_mount_bite:   { name: 'Mandíbulas', kind: 'gun',    dmg: 58, range: 5.5, rate: 0.45, pellets: 1, spread: 0.10, mag: Infinity, ammo: Infinity, color: 0x40e0ff, sound: 'mnt_shark_bite', heavy: true },
  m_mount_bone:   { name: 'Punho Ósseo', kind: 'gun',    dmg: 55, range: 3.0, rate: 0.60, pellets: 1, spread: 0.10, mag: Infinity, ammo: Infinity, color: 0xd8c8a0, sound: 'mnt_golem_bone', heavy: true },
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
    { act: 'heavy', name: 'Rajada Pesada', icon: 'target', cd: 5, kind: 'burst', shots: 8, dmg: 22, range: 20, spread: 0.05, sound: 'mnt_jeep_mg', desc: 'Rajada de 8 tiros da metralhadora pesada, de longo alcance.' },
    { act: 'dash',  name: 'Atropelamento', icon: 'run',    cd: 8, kind: 'charge', dur: 0.45, dmg: 70, knock: 14, sound: 'roar', desc: 'Acelera e atropela os inimigos à frente.' },
  ],
  armazem: [
    { act: 'heavy',  name: 'Aríete Frontal',       icon: 'paw',   cd: 5, kind: 'cone', range: 3.2, arc: 1.0, dmg: 85, knock: 13, sound: 'mnt_fork_hit', desc: 'Golpe dos garfos à frente: dano alto e empurrão forte.' },
    { act: 'second', name: 'Empurrão Hidráulico',  icon: 'burst', cd: 8, kind: 'cone', range: 3.6, arc: 1.4, dmg: 25, knock: 18, stun: 0.4, sound: 'mnt_fork_push', desc: 'Empurra todos à frente sem matar: abre espaço para manobrar.' },
  ],
  vale: [
    { act: 'heavy', name: 'Garras',    icon: 'paw', cd: 4, kind: 'cone', range: 3.4, arc: 1.6, dmg: 55, knock: 7, sound: 'mnt_boar_tusk', desc: 'Garras em leque: fere vários inimigos à frente.' },
    { act: 'dash',  name: 'Investida', icon: 'run', cd: 7, kind: 'charge', dur: 0.4, dmg: 55, knock: 10, sound: 'mnt_boar_charge', desc: 'Corrida curta que atropela quem estiver no caminho.' },
  ],
  distrito: [
    { act: 'heavy', name: 'Metralhadora de Casco', icon: 'target', cd: 4, kind: 'burst', shots: 6, dmg: 18, range: 18, spread: 0.05, sound: 'mnt_jeep_mg', desc: 'Seis tiros de metralhadora para alvos próximos.' },
  ],
  coliseu: [
    { act: 'heavy',  name: 'Estocada de Lança', icon: 'target', cd: 5, kind: 'line', range: 8, width: 1.0, dmg: 85, knock: 8, sound: 'mnt_chariot_lance', desc: 'Estocada longa que fura a fila de inimigos à frente.' },
    { act: 'dash',   name: 'Atropelamento',     icon: 'run',    cd: 8, kind: 'charge', dur: 0.45, dmg: 70, knock: 14, sound: 'roar', desc: 'Acelera e atropela os inimigos à frente.' },
    { act: 'second', name: 'Lâminas Laterais',  icon: 'burst',  cd: 6, kind: 'sides', offset: 1.5, radius: 2.0, dmg: 60, knock: 9, sound: 'blade', desc: 'As foices das rodas cortam dos dois lados.' },
  ],
  lab: [
    { act: 'heavy',  name: 'Braço Mecânico',  icon: 'paw',   cd: 4, kind: 'cone', range: 3.0, arc: 1.1, dmg: 70, knock: 11, sound: 'mnt_fork_hit', desc: 'Golpe pesado do braço hidráulico à frente.' },
    { act: 'second', name: 'Pulso Energético', icon: 'burst', cd: 9, kind: 'area', radius: 4.5, dmg: 65, knock: 6, stun: 0.8, sound: 'emp', desc: 'Descarga de plasma em volta: dano em área e atordoa.' },
  ],
  templo: [
    { act: 'heavy',  name: 'Patada Solar',     icon: 'paw',   cd: 4, kind: 'cone', range: 3.2, arc: 1.3, dmg: 65, knock: 10, sound: 'blade', desc: 'Patada de leão com dano alto à frente.' },
    { act: 'dash',   name: 'Investida Sagrada', icon: 'run',   cd: 8, kind: 'charge', dur: 0.4, dmg: 60, knock: 12, sound: 'mnt_lion_roar', desc: 'Avanço sagrado que atropela os inimigos.' },
    { act: 'second', name: 'Onda Solar',       icon: 'burst', cd: 9, kind: 'area', radius: 5, dmg: 55, knock: 5, burn: { dps: 10, t: 2.5 }, sound: 'wave', desc: 'Onda de fogo em volta: dano em área e queimadura.' },
  ],
  cemiterio: [
    { act: 'heavy',  name: 'Golpe de Ossos',  icon: 'paw',   cd: 4, kind: 'cone', range: 3.6, arc: 1.4, dmg: 80, knock: 10, sound: 'mnt_golem_bone', desc: 'Golpe pesado de osso: dano alto a frente.' },
    { act: 'dash',   name: 'Investida Ossea', icon: 'run',   cd: 8, kind: 'charge', dur: 0.45, dmg: 70, knock: 12, sound: 'stomp', desc: 'Avanco pesado que atropela os inimigos.' },
    { act: 'second', name: 'Onda de Ossos',    icon: 'burst', cd: 9, kind: 'area', radius: 5, dmg: 70, knock: 6, sound: 'mnt_golem_bone', desc: 'Onda de energia ossea em volta: dano em area.' },
    { act: 'special', name: 'Furia do Tumulo', icon: 'flame', cd: 18, kind: 'fury', dur: 8, sound: 'roar', desc: 'Por 8 s: mais velocidade de ataque e dano.' },
  ],
  naval: [
    { act: 'heavy',   name: 'Mordida Destruidora', icon: 'paw',   cd: 4,  kind: 'bite', dmg: 160, radius: 1.6, offset: 1.8, knock: 4, sound: 'mnt_shark_bite', desc: 'Mordida frontal de dano muito alto.' },
    { act: 'dash',    name: 'Investida Abissal',   icon: 'run',   cd: 7,  kind: 'charge', dur: 0.45, dmg: 30, ram: 2, knock: 6, sound: 'roar', desc: 'Avanço rápido que atropela quem estiver no caminho.' },
    { act: 'second',  name: 'Onda Esquelética',    icon: 'burst', cd: 10, kind: 'nova', radius: 4.5, dmg: 90, knock: 4, stun: 1.0, sound: 'mnt_shark_nova', desc: 'Impacto aquático em volta: dano em área e atordoa.' },
    { act: 'special', name: 'Fúria Predadora',     icon: 'flame', cd: 18, kind: 'fury', dur: 8, sound: 'roar', desc: 'Por 8 s: mais velocidade de ataque e dano.' },
  ],
  templo_2: [
    { act: 'heavy', name: 'Gado da Sacrifica', icon: 'target', cd: 5, kind: 'burst', shots: 6, dmg: 12, range: 20, spread: 0.05, sound: 'mnt_chariot_lance', desc: 'Rajada do escoteiro centenário: inimigos no alcance ganham dano em pilha.' },
    { act: 'dash',  name: 'Investida da Guarda', icon: 'run', cd: 8, kind: 'charge', dur: 0.45, dmg: 68, knock: 14, sound: 'roar', desc: 'Solene avanço que atropela quem estiver no caminho.' },
  ],
  templo_3: [
    { act: 'heavy', name: 'Mordida Real', icon: 'paw', cd: 4, kind: 'cone', range: 3.2, arc: 1.5, dmg: 58, knock: 9, sound: 'mnt_cow_tusk', desc: 'Garras do vaca real em leque: fere vários inimigos à frente.' },
    { act: 'dash',  name: 'Investida Sacrificial', icon: 'run', cd: 7, kind: 'charge', dur: 0.4, dmg: 60, knock: 12, sound: 'mnt_cow_tusk', desc: 'Corrida pesada que atropela os invasores.' },
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

// ===== REWORK V2 — montarias: modelos articulados (juntas, rosto com mandíbula, peças móveis).
// Mesmo padrão dos inimigos V2: cada parte presa a uma articulação (quadril/joelho, ombro/cotovelo, pescoço/mandíbula),
// rodas que giram, esteiras que correm, suspensão, recuo de arma. Status, armas, assento e colisão não mudam.
const _me = new THREE.Euler();
const _mq = new THREE.Quaternion();
const _mv = new THREE.Vector3();
const _m1 = new THREE.Vector3(1, 1, 1);
const _mj = new THREE.Matrix4();
const JPOOL = Array.from({ length: 160 }, () => new THREE.Matrix4());
let jpi = 0;
// articulação: matriz do pai · translação · rotação (YXZ)
function J(parent, px, py, pz, rx = 0, ry = 0, rz = 0) {
  const out = JPOOL[jpi++ % JPOOL.length];
  _me.set(rx, ry, rz, 'YXZ');
  _mq.setFromEuler(_me);
  _mj.compose(_mv.set(px, py, pz), _mq, _m1);
  return out.multiplyMatrices(parent, _mj);
}

const TOOTH = 0xeee4cc;
const MOUTH = 0x3a0808;

// rosto bravo (olho escuro + brilho + sobrancelha inclinada) numa face voltada para +z
function mFace(M, head, x, y, z, s, eye, brow) {
  for (const sg of [-1, 1]) {
    M.P(head, sg * x, y, z, 0.12 * s, 0.09 * s, 0.02, 0x0a0806);
    M.L(head, sg * x, y - 0.005, z + 0.012, 0.075 * s, 0.055 * s, 0.02, eye);
    M.P(head, sg * x, y + 0.075 * s, z + 0.01, 0.16 * s, 0.04 * s, 0.03, brow, 0, sg * 0.38);
  }
}

// roda arredondada (3 caixas giradas = dodecágono) com aro, raios e cubo
function wheel(M, m, x, y, z, r, wd, rot, tire, rim, hub) {
  for (let k = 0; k < 3; k++) M.P(m, x, y, z, wd, r * 2, r * 1.16, tire, rot + (k * Math.PI) / 3);
  const sg = x > 0 ? 1 : -1;
  for (let k = 0; k < 2; k++) M.P(m, x + sg * wd * 0.12, y, z, wd * 0.9, r * 1.25, r * 0.22, rim, rot + (k * Math.PI) / 2);
  M.P(m, x + sg * wd * 0.5, y, z, 0.04, r * 0.5, r * 0.5, hub, rot + Math.PI / 4);
}

// Quadrúpede de montaria: tronco com peito e ancas, pescoço, cabeça com mandíbula, 4 patas com joelho e casco, cauda em 2 partes.
function quadMount(base, M, o) {
  const { P, L, t, atk } = M;
  const g = M.w * (o.gait || 1);
  const run = M.moving ? 1 : 0;
  const bob = Math.abs(Math.sin(g)) * 0.05 * run + Math.sin(t * 2.2) * 0.012;
  const H = o.h, Lg = o.len, W = o.w, BH = o.bodyH, hs = o.hs || 1;
  const body = J(base, o.x || 0, H + bob, o.z || 0, (o.pitch || 0) + Math.sin(g * 2) * 0.03 * run, 0, Math.sin(g) * 0.025 * run);
  P(body, 0, 0, -0.02, W, BH, Lg * 0.72, o.c1); // barriga/costas
  P(body, 0, 0.03, Lg * 0.3, W * 1.1, BH * 1.12, Lg * 0.36, o.c2); // peito e ombros
  P(body, 0, 0.02, -Lg * 0.34, W * 1.02, BH * 0.98, Lg * 0.32, o.c1); // ancas
  P(body, 0, -BH * 0.5, 0.02, W * 0.78, 0.06, Lg * 0.7, o.belly); // ventre
  // pescoço e cabeça
  const neck = J(body, 0, BH * 0.25, Lg * 0.46, (o.neckUp ?? 0.5) + atk * 0.15 + Math.sin(g) * 0.05 * run, 0, 0);
  P(neck, 0, 0.12, 0.08, W * (o.neckW || 0.62), BH * (o.neckL || 0.9), 0.34 * hs, o.c2);
  const head = J(neck, 0, BH * (o.neckL || 0.9) * 0.55, 0.12, -(o.neckUp ?? 0.5) + (o.headPitch || 0) + atk * 0.2, Math.sin(t * 0.8) * 0.1, 0);
  P(head, 0, 0.02 * hs, 0.12 * hs, 0.48 * hs, 0.4 * hs, 0.4 * hs, o.c2); // crânio
  const sn = o.snout || 0.3;
  P(head, 0, -0.06 * hs, (0.32 + sn / 2) * hs, 0.34 * hs, 0.22 * hs, sn * hs, o.muzzle || o.c1); // focinho
  const front = (0.32 + sn) * hs;
  if (o.nose) {
    P(head, 0, -0.04 * hs, front + 0.01, 0.26 * hs, 0.16 * hs, 0.03, o.nose);
    for (const sg of [-1, 1]) P(head, sg * 0.06 * hs, -0.04 * hs, front + 0.025, 0.05 * hs, 0.06 * hs, 0.02, 0x140a06);
  }
  mFace(M, head, 0.13 * hs, 0.1 * hs, 0.325 * hs, hs, o.eye, o.brow || 0x1a120c);
  const jawA = 0.1 + atk * 0.55 + (o.pant ? Math.max(0, Math.sin(t * 3)) * 0.08 : 0);
  const jaw = J(head, 0, -0.13 * hs, 0.3 * hs, jawA, 0, 0);
  P(jaw, 0, -0.035 * hs, (sn / 2 + 0.02) * hs, 0.3 * hs, 0.07 * hs, sn * hs, o.jaw || o.muzzle || o.c1);
  P(jaw, 0, 0.0, (sn / 2 + 0.02) * hs, 0.24 * hs, 0.03, sn * 0.92 * hs, MOUTH);
  if (o.fangs !== false) for (const sg of [-1, 1]) {
    P(head, sg * 0.1 * hs, -0.18 * hs, front - 0.04 * hs, 0.04 * hs, 0.08 * hs, 0.04 * hs, TOOTH);
    P(jaw, sg * 0.08 * hs, 0.03 * hs, (sn + 0.0) * hs, 0.035 * hs, 0.07 * hs, 0.035 * hs, TOOTH);
  }
  if (o.ears !== false) for (const sg of [-1, 1]) {
    const ear = J(head, sg * 0.18 * hs, 0.2 * hs, 0.02, -0.25 + Math.max(0, Math.sin(t * 1.7 + sg)) * 0.25, 0, sg * -(o.earOut || 0.35));
    P(ear, 0, 0.08 * hs, 0, 0.12 * hs, 0.18 * hs, 0.05, o.c2);
    P(ear, 0, 0.08 * hs, 0.026, 0.06 * hs, 0.11 * hs, 0.01, o.earIn || 0x8a5a48);
  }
  // patas: quadril -> joelho -> casco
  const LW = o.legW || 0.16;
  for (const [x, zz, ph] of [[W * 0.36, Lg * 0.34, 0], [-W * 0.36, Lg * 0.34, Math.PI], [W * 0.36, -Lg * 0.36, Math.PI], [-W * 0.36, -Lg * 0.36, 0]]) {
    const a = Math.sin(g + ph) * 0.65 * run;
    const fr = zz > 0;
    const hip = J(body, x, -BH * 0.15, zz, a, 0, 0);
    P(hip, 0, -H * 0.2, 0, LW * 1.25, H * 0.52, LW * 1.4, fr ? o.c2 : o.c1); // coxa
    const kn = J(hip, 0, -H * 0.44, fr ? 0.02 : -0.02, fr ? Math.max(0, -a) * 0.9 : -Math.max(0, a) * 0.9 - 0.12 * run, 0, 0);
    P(kn, 0, -H * 0.2, 0, LW, H * 0.44, LW * 1.05, o.leg || o.c1); // canela
    P(kn, 0, -H * 0.43, 0.025, LW * 1.2, 0.09, LW * 1.4, o.hoof); // casco/pata
    if (o.claws) for (const cx of [-1, 0, 1]) P(kn, cx * LW * 0.35, -H * 0.44, LW * 0.75, 0.035, 0.05, 0.07, o.claws);
  }
  // cauda
  if (o.tail !== false) {
    const tl = J(body, 0, BH * 0.32, -Lg * 0.5, -(o.tailUp ?? 0.7) + Math.sin(t * 5) * 0.18, Math.sin(t * 3.3) * 0.35, 0);
    P(tl, 0, 0, -0.14, 0.08, 0.08, 0.3, o.c1);
    const t2 = J(tl, 0, 0, -0.28, 0.4 + Math.sin(t * 5 + 1) * 0.2, Math.sin(t * 3.3 + 0.8) * 0.3, 0);
    P(t2, 0, 0, -0.12, 0.07, 0.07, 0.26, o.c1);
    if (o.tuft) P(t2, 0, 0, -0.28, 0.15, 0.15, 0.15, o.tuft);
  }
  if (o.saddle) {
    const s = o.saddle;
    P(body, 0, BH / 2 + 0.03, s.z, W * 0.92, 0.07, 0.62, s.blanket); // manta
    for (const sg of [-1, 1]) P(body, sg * (W * 0.5 + 0.01), BH * 0.2, s.z, 0.03, BH * 0.55, 0.56, s.blanket); // abas laterais
    P(body, 0, BH / 2 + 0.08, s.z, W * 0.7, 0.08, 0.46, s.seat); // sela
    P(body, 0, BH / 2 + 0.15, s.z + 0.22, W * 0.4, 0.12, 0.08, s.seat); // cabeça da sela
    for (const sg of [-1, 1]) {
      P(body, sg * (W * 0.5 + 0.02), -BH * 0.1, s.z + 0.05, 0.02, BH * 0.9, 0.07, 0x2a1a10); // cilha
      P(body, sg * (W * 0.5 + 0.05), -BH * 0.5, s.z + 0.05, 0.04, 0.1, 0.12, s.trim || 0xb8a070); // estribo
    }
    if (s.trim) P(body, 0, BH / 2 + 0.07, s.z - 0.31, W * 0.92, 0.04, 0.02, s.trim);
  }
  if (o.extra) o.extra({ body, neck, head, jaw, H, Lg, W, BH, hs, g, front }, P, L);
}

// Carro de guerra (Quadriga): 4 cavalos lado a lado, rodas com raios e foices giratórias, parapeito e lança
function chariotMount(base, M, o) {
  const { P, L, t, atk, w } = M;
  const run = M.moving ? 1 : 0;
  const car = J(base, 0, Math.abs(Math.sin(w * 1.3)) * 0.03 * run, -0.58, 0, 0, Math.sin(w * 0.9) * 0.02 * run);
  for (const sx of [-0.86, 0.86]) {
    wheel(M, car, sx, 0.46, 0, 0.43, 0.12, w, o.wood, o.gold, o.gold);
    for (let k = 0; k < 3; k++) P(car, sx, 0.46, 0, 0.08, 0.74, 0.05, o.gold, w + (k * Math.PI) / 3); // raios
    const sc = J(car, sx + Math.sign(sx) * 0.12, 0.46, 0, w * 1.0, 0, 0); // foice gira junto com o cubo
    P(sc, Math.sign(sx) * 0.12, 0, 0, 0.22, 0.08, 0.1, 0x6a6e74);
    P(sc, Math.sign(sx) * 0.3, 0.02, 0.06, 0.2, 0.05, 0.22, 0xcfd8dc, 0, Math.sign(sx) * 0.2);
  }
  P(car, 0, 0.46, 0, 1.9, 0.08, 0.08, 0x3a2a14); // eixo
  P(car, 0, 0.5, 0, 1.4, 0.1, 1.0, o.wood); // piso
  P(car, 0, 0.88, 0.48, 1.38, 0.7, 0.12, o.gold); // parapeito frontal
  P(car, 0, 1.25, 0.48, 1.42, 0.06, 0.16, o.trim); // borda
  for (const sg of [-1, 1]) {
    P(car, sg * 0.66, 0.78, 0.0, 0.12, 0.5, 1.0, o.side); // laterais
    P(car, sg * 0.66, 1.04, 0.0, 0.16, 0.05, 1.02, o.trim);
    P(car, sg * 0.66, 0.78, -0.08, 0.02, 0.3, 0.6, o.emblem2); // relevo lateral
  }
  P(car, 0, 0.9, 0.55, 0.46, 0.46, 0.03, o.emblem); // brasão
  P(car, 0, 0.9, 0.57, 0.22, 0.22, 0.03, o.gold);
  if (o.sun) L(car, 0, 0.9, 0.58, 0.14, 0.14, 0.02, o.sun);
  // lança montada à direita (avança no ataque)
  const thrust = atk * 0.35;
  P(car, 0.76, 1.04, 1.1 + thrust, 0.08, 0.08, 1.9, 0x6b4c1a);
  P(car, 0.76, 1.04, 2.1 + thrust, 0.14, 0.14, 0.12, o.gold);
  P(car, 0.76, 1.04, 2.28 + thrust, 0.06, 0.12, 0.26, 0xdfe6ea);
  L(car, 0.76, 1.04, 2.36 + thrust, 0.05, 0.08, 0.12, o.tip);
  for (const sg of [-1, 1]) P(car, sg * 0.18, 0.6, 0.98, 0.08, 0.08, 1.1, o.wood); // varais
  P(car, 0, 0.82, 1.5, 1.5, 0.08, 0.08, o.gold); // canga
  // 4 cavalos com armadura, cada um com seu passo
  const xs = [-0.54, -0.18, 0.18, 0.54];
  for (let i = 0; i < 4; i++) {
    quadMount(base, { ...M, w: w + i * 0.7 }, {
      x: xs[i], z: 1.36, h: 0.6, len: 0.78, w: 0.28, bodyH: 0.3, hs: 0.62, snout: 0.38, neckUp: 0.9, neckL: 1.5, neckW: 0.55, headPitch: 0.5,
      c1: o.horse, c2: o.horse2, belly: o.horse2, muzzle: o.horse2, leg: o.horse, hoof: 0x2a2218, legW: 0.1, eye: o.eye, fangs: false,
      earOut: 0.1, tailUp: 0.9, tuft: o.mane, nose: 0x3a2a22, gait: 1.3,
      extra: (K, P2) => {
        P2(K.body, 0, K.BH * 0.32, 0.06, K.W * 1.15, 0.08, K.Lg * 0.86, o.barding); // manta de armadura
        for (const sg of [-1, 1]) P2(K.body, sg * K.W * 0.56, 0.0, 0.06, 0.03, K.BH * 0.8, K.Lg * 0.8, o.barding);
        P2(K.neck, 0, 0.14, -0.06, 0.06, 0.4, 0.12, o.mane); // crina
        P2(K.head, 0, 0.16, 0.12, 0.32, 0.1, 0.44, o.helm); // testeira
        P2(K.head, 0, 0.3, 0.02, 0.06, 0.22, 0.12, o.plume); // penacho
        for (const sg of [-1, 1]) P2(K.head, sg * 0.17, 0.06, 0.18, 0.03, 0.12, 0.1, o.helm); // antolhos
      },
    });
  }
}

// Desenha o modelo 3D de cada montaria (+ marcador luminoso quando estacionada)
export function drawMount(B, G, wm, time, near = false) {
  if (!wm || !wm.alive || !wm.def) return;
  const def = wm.def;
  const flash = wm.hurtT > 0;
  const c = (hex) => (flash ? 0xffffff : hex);
  const w = wm.wheelT || 0;
  const rider = wm.rider && !wm.rider.preview ? wm.rider : null;
  const moving = Math.abs(w - (wm._lastW ?? w)) > 1e-4 || (wm.rider && wm.rider.preview && w > 0);
  wm._lastW = w;
  const atk = rider && rider.firingT > 0 ? Math.min(1, rider.firingT * 2.2) : 0;
  const fury = rider && rider.furyT > 0;
  const base = baseMatrix(wm.x, 0, wm.z, wm.facing, 1);
  const P = (m, x, y, z, sx, sy, sz, col, rx = 0, rz = 0) => B.part(m, x, y, z, rx, rz, 0, 0, 0, sx, sy, sz, c(col));
  const L = (m, x, y, z, sx, sy, sz, col) => G.part(m, x, y, z, 0, 0, 0, 0, 0, sx, sy, sz, col);
  const M = { P, L, t: time, w, atk, moving, fury };

  // Marcador luminoso no chão + seta flutuante quando estacionada (facilita localizar no mapa)
  if (!wm.rider) {
    const ringCol = near ? 0xffc107 : 0x29b6f6;
    const rad = Math.max(1.35, def.size * 0.95);
    const segs = 16;
    for (let k = 0; k < segs; k++) {
      const a = (k / segs) * Math.PI * 2 + time * (near ? 1.8 : 0.7);
      G.box(wm.x + Math.sin(a) * rad, 0.05, wm.z + Math.cos(a) * rad, 0.28, 0.03, 0.08, k % 2 === 0 ? ringCol : def.color, a + Math.PI / 2);
    }
    const by = 2.35 + Math.sin(time * 3.8) * 0.16;
    G.box(wm.x, by, wm.z, 0.28, 0.28, 0.28, near ? 0xffc107 : 0x29b6f6, time * 2.2);
    G.box(wm.x, by - 0.34, wm.z, 0.14, 0.18, 0.14, 0xffc107, -time * 2.2);
  }

  const draw = MOUNT_MODELS[wm.id] || MOUNT_MODELS[def.kind] || MOUNT_MODELS.lion;
  draw(base, M, def);
}

const MOUNT_MODELS = {
  // ---------------- JIPE BLINDADO (Cidade Abandonada)
  praca(base, M) {
    const { P, L, t, w, atk } = M;
    const run = M.moving ? 1 : 0;
    for (const sx of [-0.76, 0.76]) for (const sz of [-0.74, 0.74]) {
      const sus = Math.sin(w * 1.7 + sx * 3 + sz * 2) * 0.025 * run;
      wheel(M, base, sx, 0.31 + sus, sz, 0.31, 0.3, w, 0x1a1e24, 0x6b7280, 0xffc107);
      P(base, sx, 0.62, sz, 0.36, 0.08, 0.66, 0x2d3a2d); // para-lama
    }
    const body = J(base, 0, Math.sin(w * 2.1) * 0.02 * run, 0, Math.sin(w * 1.1) * 0.012 * run, 0, Math.sin(w * 0.8) * 0.015 * run);
    P(body, 0, 0.46, 0, 1.36, 0.24, 2.1, 0x232a23); // chassi
    P(body, 0, 0.72, 0.62, 1.26, 0.32, 0.86, 0x4a6a4a); // capô
    for (let i = 0; i < 4; i++) P(body, -0.3 + i * 0.2, 0.89, 0.62, 0.08, 0.02, 0.6, 0x3a543a); // frisos do capô
    P(body, 0, 0.9, 0.22, 0.4, 0.06, 0.24, 0x2d3a2d); // entrada de ar
    P(body, 0, 0.68, -0.6, 1.3, 0.34, 0.9, 0x3d583d); // traseira
    for (const sg of [-1, 1]) {
      P(body, sg * 0.69, 0.68, -0.05, 0.05, 0.24, 1.6, 0x34503a); // blindagem lateral
      for (const zz of [-0.6, -0.1, 0.4]) P(body, sg * 0.72, 0.7, zz, 0.02, 0.05, 0.05, 0x8a929c); // rebites
      P(body, sg * 0.74, 0.86, 0.22, 0.06, 0.1, 0.12, 0x1b1f28); // retrovisor
    }
    // para-brisa rebatível com vidro
    P(body, 0, 1.08, 0.18, 1.2, 0.06, 0.06, 0x262c34);
    for (const sg of [-1, 1]) P(body, sg * 0.58, 0.98, 0.18, 0.06, 0.26, 0.06, 0x262c34);
    P(body, 0, 0.98, 0.19, 1.1, 0.18, 0.02, 0x6fa8c8);
    // grade, para-choque e faróis
    P(body, 0, 0.7, 1.06, 0.9, 0.26, 0.05, 0x1b1f28);
    for (let i = 0; i < 5; i++) P(body, -0.32 + i * 0.16, 0.7, 1.09, 0.05, 0.22, 0.02, 0x3a4048);
    P(body, 0, 0.5, 1.14, 1.4, 0.18, 0.12, 0x262c34); // para-choque
    for (const sg of [-1, 1]) {
      P(body, sg * 0.32, 0.72, 1.22, 0.08, 0.36, 0.08, 0x262c34); // quebra-mato
      P(body, sg * 0.46, 0.73, 1.08, 0.22, 0.18, 0.05, 0x1b1f28);
      L(body, sg * 0.46, 0.73, 1.1, 0.16, 0.12, 0.03, 0xffe880);
      L(body, sg * 0.5, 0.68, -1.06, 0.16, 0.1, 0.03, 0xe53935);
    }
    P(body, 0, 0.86, 1.2, 0.6, 0.06, 0.06, 0x262c34);
    P(body, 0, 0.74, -1.12, 0.62, 0.62, 0.2, 0x1a1e24); // estepe
    P(body, 0, 0.74, -1.12, 0.62, 0.62, 0.2, 0x1a1e24, Math.PI / 4);
    P(body, 0, 0.74, -1.23, 0.24, 0.24, 0.03, 0x6b7280);
    // gaiola + galões
    for (const sg of [-1, 1]) {
      P(body, sg * 0.6, 1.2, 0.12, 0.08, 0.76, 0.08, 0x262c34);
      P(body, sg * 0.6, 1.2, -0.84, 0.08, 0.76, 0.08, 0x262c34);
      P(body, sg * 0.6, 1.56, -0.36, 0.08, 0.08, 1.04, 0x262c34);
      P(body, sg * 0.45, 0.98, -0.86, 0.18, 0.26, 0.14, sg > 0 ? 0x4a5a3a : 0xb03020); // galões
    }
    P(body, 0, 1.56, -0.84, 1.26, 0.08, 0.08, 0x262c34);
    P(body, 0, 1.56, 0.12, 1.26, 0.08, 0.08, 0x262c34);
    // antena que balança
    const ant = J(body, -0.56, 0.86, -1.0, -0.15 - Math.sin(w * 2) * 0.12 * run, 0, Math.sin(t * 2.6) * 0.08);
    P(ant, 0, 0.5, 0, 0.025, 1.0, 0.025, 0x1b1f28);
    L(ant, 0, 1.0, 0, 0.05, 0.05, 0.05, 0xe53935);
    // metralhadora giratória no teto: varre quando parada, recua no tiro
    const tur = J(body, 0, 1.62, -0.36, 0, atk ? 0 : Math.sin(t * 0.7) * 0.35, 0);
    P(tur, 0, 0.04, 0, 0.5, 0.1, 0.5, 0x2e3440); // anel
    P(tur, 0, 0.16, 0.0, 0.28, 0.2, 0.44, 0x2e3440);
    P(tur, 0, 0.24, 0.28, 0.5, 0.26, 0.04, 0x3a4048); // escudo
    const rec = atk ? Math.sin(t * 60) * 0.04 : 0;
    P(tur, 0, 0.16, 0.5 - rec, 0.08, 0.08, 0.72, 0x1b1f28); // cano
    P(tur, 0, 0.16, 0.42 - rec, 0.13, 0.13, 0.22, 0x262c34); // camisa
    P(tur, 0.2, 0.1, -0.06, 0.14, 0.14, 0.18, 0x4a5a3a); // caixa de munição
    for (let i = 0; i < 4; i++) P(tur, 0.12 - i * 0.03, 0.12 - i * 0.03, 0.1 + i * 0.03, 0.04, 0.03, 0.05, 0xc8a040); // fita de balas
    if (atk) L(tur, 0, 0.16, 0.9, 0.18 + Math.abs(rec) * 3, 0.18, 0.12, 0xffc107);
    else L(tur, 0, 0.16, 0.87, 0.06, 0.06, 0.04, 0xffc107);
  },

  // ---------------- EMPILHADEIRA DE COMBATE (Complexo Industrial)
  armazem(base, M) {
    const { P, L, t, w, atk } = M;
    const run = M.moving ? 1 : 0;
    for (const sx of [-0.64, 0.64]) {
      wheel(M, base, sx, 0.27, 0.52, 0.27, 0.26, w, 0x1a1e24, 0xffc107, 0x22262e);
      wheel(M, base, sx, 0.22, -0.62, 0.22, 0.22, w * 1.2, 0x1a1e24, 0xffc107, 0x22262e);
    }
    const body = J(base, 0, Math.sin(w * 2.2) * 0.015 * run, 0, 0, 0, Math.sin(w) * 0.01 * run);
    P(body, 0, 0.52, -0.08, 1.16, 0.46, 1.5, 0xffc107); // corpo
    for (let i = 0; i < 6; i++) P(body, -0.5 + i * 0.2, 0.32, 0.68, 0.1, 0.12, 0.02, i % 2 ? 0x1b1f28 : 0xffc107, 0, 0.6); // faixa zebrada
    P(body, 0, 0.58, -0.8, 1.2, 0.58, 0.4, 0x22262e); // contrapeso
    for (let i = 0; i < 5; i++) P(body, -0.48 + i * 0.24, 0.84, -1.0, 0.12, 0.08, 0.02, i % 2 ? 0x1b1f28 : 0xffc107, 0, 0.6);
    P(body, 0, 0.8, -0.18, 0.7, 0.1, 0.5, 0x2e3440); // assento
    P(body, 0, 1.08, -0.42, 0.6, 0.5, 0.1, 0x2e3440); // encosto
    P(body, 0, 1.06, 0.36, 0.12, 0.32, 0.12, 0x262c34, -0.5); // coluna do volante
    P(body, 0, 1.2, 0.28, 0.34, 0.04, 0.3, 0x1b1f28, -0.5); // volante
    for (const sg of [-1, 1]) {
      P(body, sg * 0.52, 1.2, 0.36, 0.08, 0.96, 0.08, 0x1f242c); // gaiola
      P(body, sg * 0.52, 1.2, -0.58, 0.08, 0.96, 0.08, 0x1f242c);
      P(body, sg * 0.52, 1.66, -0.11, 0.08, 0.08, 1.02, 0x1f242c);
    }
    for (let i = 0; i < 4; i++) P(body, 0, 1.68, -0.48 + i * 0.24, 1.1, 0.04, 0.06, 0x262c36); // grade do teto
    const flash = Math.sin(t * 12) > 0;
    P(body, 0, 1.72, -0.35, 0.22, 0.06, 0.22, 0x1b1f28);
    L(body, 0, 1.8, -0.35, 0.16, 0.12, 0.16, flash ? 0xffc107 : 0xff6f00); // giroflex
    P(body, -0.46, 1.1, -0.78, 0.1, 0.6, 0.1, 0x3a4048); // escape
    L(body, -0.46, 1.48 + ((t * 0.8) % 0.4), -0.78, 0.1, 0.08, 0.1, 0x7a8088); // fumaça
    L(body, 0.4, 0.66, 0.66, 0.14, 0.1, 0.03, 0xffe880); // farol
    // mastro + carro hidráulico que sobe e desce; no ataque os garfos avançam e sobem
    for (const sg of [-1, 1]) {
      P(body, sg * 0.42, 1.12, 0.8, 0.12, 1.62, 0.14, 0x22262e);
      P(body, sg * 0.28, 0.9, 0.7, 0.07, 0.9, 0.07, 0x9aa4b2); // pistão
      P(body, sg * 0.28, 0.6, 0.7, 0.1, 0.4, 0.1, 0x353c48);
    }
    P(body, 0, 1.92, 0.8, 0.98, 0.1, 0.14, 0x22262e);
    const lift = 0.12 + Math.sin(t * 1.3) * 0.05 + atk * 0.35;
    const carr = J(body, 0, lift, 0.9 + atk * 0.18, -atk * 0.15, 0, 0);
    P(carr, 0, 0.42, 0, 1.0, 0.36, 0.1, 0x353c48);
    for (let i = 0; i < 4; i++) P(carr, -0.36 + i * 0.24, 0.42, 0.06, 0.08, 0.3, 0.02, i % 2 ? 0x1b1f28 : 0xffc107);
    for (const sg of [-1, 1]) {
      P(carr, sg * 0.36, 0.26, 0.58, 0.16, 0.08, 1.16, 0x9aa4b2); // garfo
      P(carr, sg * 0.36, 0.38, 0.04, 0.16, 0.34, 0.08, 0x9aa4b2);
      P(carr, sg * 0.36, 0.26, 1.2, 0.12, 0.06, 0.1, 0xcfd8dc);
      L(carr, sg * 0.36, 0.26, 1.24, 0.1, 0.05, 0.05, 0xffc107);
      for (const zz of [0.3, 0.7]) P(carr, sg * 0.36, 0.33, zz, 0.06, 0.08, 0.04, 0x6a7280); // dentes de serra
    }
  },

  // ---------------- JAVALI MUTANTE (Floresta Sombria)
  vale(base, M) {
    quadMount(base, M, {
      h: 0.74, len: 1.5, w: 1.0, bodyH: 0.66, hs: 1.45, snout: 0.3, neckUp: 0.1, neckL: 0.5, neckW: 0.8, headPitch: 0.05,
      c1: 0x6d452c, c2: 0x7d4f33, belly: 0x8c6040, muzzle: 0x9c6b4a, leg: 0x5c3822, hoof: 0x241810, legW: 0.2, eye: 0xff9800, brow: 0x2a160a,
      nose: 0xc08a6a, earIn: 0x9c6b4a, tailUp: 0.4, gait: 1.25, pant: true,
      saddle: { z: -0.08, blanket: 0x3a2a1c, seat: 0x2e231c, trim: 0x6a5a3a },
      extra: (K, P, L) => {
        for (let i = 0; i < 7; i++) P(K.body, 0, K.BH / 2 + 0.1 + (i % 2) * 0.05, 0.62 - i * 0.12, 0.08, 0.2 + (i % 2) * 0.06, 0.08, 0x2a160a, -0.4); // crina espetada
        for (const sg of [-1, 1]) { // presas curvas presas à mandíbula
          const tk = J(K.jaw, sg * 0.27, 0.02, 0.46, -0.35, 0, sg * -0.5);
          P(tk, 0, 0.14, 0, 0.09, 0.3, 0.09, 0xf2e8cf);
          P(tk, sg * -0.05, 0.32, -0.05, 0.07, 0.14, 0.07, 0xf2e8cf, -0.7, sg * 0.5);
        }
        for (const [x, y, z] of [[0.38, 0.12, 0.3], [-0.42, 0.02, -0.2], [0.3, -0.1, -0.5]]) { // bolhas mutantes
          P(K.body, x, y, z, 0.14, 0.14, 0.14, 0x5a6a20);
          L(K.body, x + Math.sign(x) * 0.05, y, z, 0.06, 0.06, 0.06, 0xa8ff40);
        }
        P(K.head, 0, 0.22, 0.04, 0.5, 0.06, 0.3, 0x2a160a); // topete
        for (let i = 0; i < 3; i++) P(K.body, -0.3 + i * 0.3, 0.05, 0.75, 0.04, 0.3, 0.02, 0x4a2a18); // cicatrizes
      },
    });
  },

  // ---------------- TANQUE BLINDADO (Base Militar)
  distrito(base, M) {
    const { P, L, t, w, atk } = M;
    const run = M.moving ? 1 : 0;
    for (const sx of [-0.92, 0.92]) {
      P(base, sx, 0.34, 0, 0.42, 0.5, 2.3, 0x1e2228); // esteira
      for (const sz of [-0.96, -0.48, 0, 0.48, 0.96]) wheel(M, base, sx + Math.sign(sx) * 0.02, 0.26, sz, 0.2, 0.36, w, 0x2a3038, 0x4b535e, 0xffc107);
      for (const sz of [-1.2, 1.2]) wheel(M, base, sx, 0.4, sz, 0.18, 0.38, w, 0x2a3038, 0x4b535e, 0x4b535e); // roda motriz
      const off = ((w * 0.18) % 0.24 + 0.24) % 0.24; // elos da esteira correndo
      for (let i = 0; i < 10; i++) {
        P(base, sx, 0.61, -1.08 + i * 0.24 + off, 0.44, 0.05, 0.1, 0x30363e);
        P(base, sx, 0.07, 1.08 - i * 0.24 - off, 0.44, 0.05, 0.1, 0x30363e);
      }
      P(base, sx, 0.64, 0, 0.48, 0.06, 2.44, 0x3d4b3d); // saia blindada
      P(base, sx + Math.sign(sx) * 0.24, 0.48, 0, 0.04, 0.3, 2.3, 0x3d4b3d);
    }
    const hull = J(base, 0, Math.sin(w * 1.5) * 0.012 * run, 0, Math.sin(w * 0.7) * 0.01 * run - atk * 0.04, 0, 0);
    P(hull, 0, 0.66, -0.05, 1.5, 0.42, 2.14, 0x4a594a); // casco
    P(hull, 0, 0.74, 1.08, 1.44, 0.26, 0.34, 0x5a6a5a, -0.5); // glacis inclinado
    P(hull, 0, 0.88, 0.46, 1.48, 0.05, 0.14, 0xffc107); // faixa tática
    for (const [x, z, s] of [[-0.4, -0.5, 0.34], [0.3, 0.2, 0.28], [0.45, -0.8, 0.22]]) P(hull, x, 0.875, z, s, 0.02, s * 1.3, 0x354235); // camuflagem
    for (const sg of [-1, 1]) {
      L(hull, sg * 0.56, 0.72, 1.24, 0.18, 0.1, 0.04, 0xffe082);
      L(hull, sg * 0.56, 0.68, -1.12, 0.18, 0.1, 0.04, 0xe53935);
      P(hull, sg * 0.4, 0.62, 1.28, 0.12, 0.08, 0.1, 0x262c34); // ganchos
      P(hull, sg * 0.5, 0.9, -0.95, 0.2, 0.12, 0.18, 0x2a3038); // escapes
      P(hull, sg * 0.32, 0.92, -0.7, 0.36, 0.08, 0.36, 0x3a463a); // grade do motor
    }
    L(hull, -0.5, 1.0 + ((t * 0.7) % 0.5), -0.95, 0.12, 0.08, 0.12, 0x6a7078); // fumaça
    // torre: gira um pouco para mirar, canhão recua no disparo
    const tur = J(hull, 0, 0.88, -0.1, 0, atk ? 0 : Math.sin(t * 0.5) * 0.3, 0);
    P(tur, 0, 0.2, 0, 1.18, 0.42, 1.2, 0x3d4b3d);
    P(tur, 0, 0.2, 0.62, 0.9, 0.34, 0.12, 0x4a594a, -0.35); // mantelete
    P(tur, 0, 0.12, -0.7, 1.0, 0.3, 0.3, 0x354235); // cesto traseiro
    for (const sg of [-1, 1]) {
      for (let i = 0; i < 3; i++) P(tur, sg * 0.62, 0.22, -0.3 + i * 0.22, 0.06, 0.16, 0.14, 0x2e382e); // lançadores de fumaça
      P(tur, sg * 0.44, 0.44, -0.4, 0.02, 0.9, 0.02, 0x1b1f28); // antenas
    }
    P(tur, 0.26, 0.45, -0.1, 0.38, 0.08, 0.38, 0x2e382e); // escotilha
    P(tur, 0.26, 0.52, 0.02, 0.06, 0.08, 0.36, 0x1b1f28); // metralhadora do comandante
    const rec = atk * 0.3;
    P(tur, 0, 0.2, 1.3 - rec, 0.2, 0.2, 1.5, 0x2b3138); // cano
    P(tur, 0, 0.2, 0.86 - rec, 0.28, 0.28, 0.3, 0x354235); // luva
    P(tur, 0, 0.2, 2.06 - rec, 0.32, 0.3, 0.24, 0x1e2228); // freio de boca
    L(tur, 0, 0.2, 2.2 - rec, 0.16, 0.16, 0.04, 0xff8020);
    if (atk > 0.5) L(tur, 0, 0.2, 2.45 - rec, 0.5, 0.5, 0.4, 0xffb040);
  },

  // ---------------- QUADRIGA DE GUERRA (Coliseu)
  coliseu(base, M) {
    chariotMount(base, M, {
      wood: 0x6b4c1a, gold: 0xd4af37, trim: 0xf0d060, side: 0xb8922a, emblem: 0xe53935, emblem2: 0x8a1a14, tip: 0xffe080,
      horse: 0xd8c3a5, horse2: 0xe6d6bc, mane: 0x6a4a2a, barding: 0x9a1c18, helm: 0xd4af37, plume: 0xe53935, eye: 0xffc107,
    });
  },
  // ---------------- QUADRIGA SACRIFICIAL (Templo Antigo): visual egípcio
  templo_2(base, M) {
    chariotMount(base, M, {
      wood: 0x5a3a18, gold: 0xc8a048, trim: 0x29b6f6, side: 0x1e4a8a, emblem: 0x1e4a8a, emblem2: 0xc8a048, tip: 0xffc060, sun: 0xff9800,
      horse: 0x2a2420, horse2: 0x3a322a, mane: 0x141010, barding: 0x1e4a8a, helm: 0xc8a048, plume: 0x29b6f6, eye: 0xffd54f,
    });
  },

  // ---------------- EXOESQUELETO EXPERIMENTAL (Laboratório): moldura bípede em volta do piloto
  lab(base, M) {
    const { P, L, t, w, atk, fury } = M;
    const run = M.moving ? 1 : 0;
    const g = w * 1.1;
    const bob = Math.abs(Math.sin(g)) * 0.05 * run;
    const pel = J(base, 0, 0.98 + bob, 0, 0, Math.sin(g) * 0.06 * run, 0);
    P(pel, 0, -0.5, 0, 0.8, 0.1, 0.5, 0x263238); // plataforma dos pés do piloto
    P(pel, 0, -0.1, -0.3, 0.86, 0.3, 0.2, 0x1b262c); // cinto do quadril
    L(pel, 0, -0.1, -0.19, 0.3, 0.06, 0.02, 0x40ffb0);
    for (const [sg, ph] of [[-1, 0], [1, Math.PI]]) {
      const a = Math.sin(g + ph) * 0.55 * run;
      const hip = J(pel, sg * 0.56, -0.08, -0.05, a, 0, 0);
      P(hip, 0, 0, 0, 0.24, 0.24, 0.24, 0x37474f); // junta do quadril
      P(hip, 0, -0.24, 0, 0.22, 0.44, 0.28, 0x263238); // coxa
      P(hip, sg * 0.13, -0.24, 0.04, 0.04, 0.36, 0.06, 0x9aa4b2); // pistão da coxa
      const kn = J(hip, 0, -0.46, 0, -Math.max(0, a) * 1.0 - 0.15, 0, 0);
      P(kn, 0, 0, 0.04, 0.2, 0.18, 0.22, 0x37474f);
      L(kn, sg * 0.11, 0, 0.08, 0.02, 0.08, 0.08, 0x40ffb0);
      P(kn, 0, -0.2, -0.02, 0.2, 0.42, 0.24, 0x2e3b46); // canela
      const an = J(kn, 0, -0.42, 0, Math.max(0, a) * 0.6, 0, 0);
      P(an, 0, -0.02, 0.08, 0.32, 0.1, 0.5, 0x37474f); // pé
      P(an, 0, -0.02, 0.36, 0.3, 0.08, 0.08, 0xffc107);
    }
    const tor = J(pel, 0, 0.0, 0, 0.05 - atk * 0.06, -Math.sin(g) * 0.06 * run, 0);
    P(tor, 0, 0.5, -0.4, 0.66, 0.9, 0.18, 0x1b262c); // coluna/encosto
    P(tor, 0, 0.56, -0.6, 0.6, 0.7, 0.3, 0x2e3b46); // mochila do reator
    const pulse = 0.85 + Math.sin(t * 6) * 0.15;
    L(tor, 0, 0.56, -0.76, 0.3 * pulse, 0.46 * pulse, 0.04, fury ? 0xff5a1a : 0x40ffb0);
    for (let i = 0; i < 3; i++) P(tor, 0, 0.32 + i * 0.2, -0.77, 0.4, 0.03, 0.03, 0x1b262c); // grade do reator
    for (const sg of [-1, 1]) P(tor, sg * 0.24, 1.04, -0.62, 0.08, 0.3, 0.08, 0x9aa4b2); // dutos
    // arco de proteção sobre o piloto com visor-sensor
    for (const sg of [-1, 1]) P(tor, sg * 0.5, 1.16, -0.2, 0.08, 0.7, 0.08, 0x263238, 0.3, sg * 0.1);
    P(tor, 0, 1.48, -0.08, 1.02, 0.08, 0.1, 0x263238);
    P(tor, 0, 1.52, -0.02, 0.4, 0.12, 0.16, 0x37474f);
    L(tor, 0, 1.52, 0.065, 0.3, 0.05, 0.02, 0xe53935); // sensor vermelho
    for (const sg of [-1, 1]) {
      const sh = J(tor, sg * 0.74, 0.94, -0.12, -0.25 - atk * 0.9 + Math.sin(g + (sg > 0 ? 0 : Math.PI)) * 0.25 * run, 0, sg * -0.08);
      P(sh, 0, 0.06, 0, 0.42, 0.36, 0.48, 0x2e3b46); // ombreira
      P(sh, 0, 0.26, 0, 0.36, 0.06, 0.42, 0xffc107);
      L(sh, sg * 0.21, 0.06, 0.1, 0.02, 0.12, 0.2, 0x40ffb0);
      P(sh, 0, -0.24, 0, 0.2, 0.4, 0.22, 0x263238); // braço
      const el = J(sh, 0, -0.44, 0.02, -0.9 + atk * 0.85, 0, 0);
      P(el, 0, 0, 0, 0.2, 0.2, 0.2, 0x37474f);
      P(el, 0, -0.3, 0, 0.26, 0.5, 0.28, 0x37474f); // antebraço-canhão
      for (let i = 0; i < 3; i++) L(el, 0, -0.18 - i * 0.14, 0, 0.3, 0.04, 0.32, 0x40ffb0); // bobinas de plasma
      P(el, 0, -0.62, 0, 0.16, 0.16, 0.16, 0x1b262c); // boca do canhão
      L(el, 0, -0.71, 0, 0.12, 0.04 + atk * 0.08, 0.12, 0x40ffb0);
    }
  },

  // ---------------- LEÃO DE SEKHMET (Templo Antigo)
  templo(base, M) {
    quadMount(base, M, {
      h: 0.8, len: 1.5, w: 0.9, bodyH: 0.58, hs: 1.35, snout: 0.24, neckUp: 0.35, neckL: 0.7, neckW: 0.8, headPitch: 0.0,
      c1: 0xd4a040, c2: 0xdcae50, belly: 0xe8c47a, muzzle: 0xe8c47a, jaw: 0xe0b458, leg: 0xc48f32, hoof: 0xb07a28, legW: 0.18, eye: 0xffd54f, brow: 0x6a4010,
      nose: 0x5a3010, claws: 0xf2e8cf, earIn: 0x8d5b18, tailUp: 0.9, tuft: 0x8d5b18, gait: 1.2, pant: true,
      saddle: { z: -0.12, blanket: 0x1e4a8a, seat: 0x6a4010, trim: 0xffc107 },
      extra: (K, P, L) => {
        // juba em camadas em volta da cabeça (presa ao pescoço) e no peito
        P(K.neck, 0, 0.2, 0.0, 0.92, 0.82, 0.4, 0x8d5b18);
        P(K.head, 0, 0.0, -0.04, 0.92, 0.9, 0.2, 0xa0681e);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          P(K.head, Math.sin(a) * 0.46, Math.cos(a) * 0.46, -0.06, 0.22, 0.22, 0.18, i % 2 ? 0x8d5b18 : 0x7a4a12, 0, -a);
        }
        P(K.body, 0, -0.1, K.Lg * 0.46, 0.7, 0.44, 0.16, 0x8d5b18);
        // colar usekh azul e dourado
        P(K.body, 0, 0.06, K.Lg * 0.5, K.W * 1.16, 0.5, 0.06, 0x29b6f6);
        for (const y of [-0.12, 0.06, 0.24]) P(K.body, 0, y, K.Lg * 0.535, K.W * 1.18, 0.04, 0.02, 0xffc107);
        // disco solar com uraeus
        L(K.head, 0, 0.62, -0.02, 0.4, 0.4, 0.06, 0xff9800);
        L(K.head, 0, 0.62, 0.02, 0.24, 0.24, 0.04, 0xffe082);
        P(K.head, 0, 0.36, 0.04, 0.06, 0.16, 0.06, 0xffc107);
        for (let i = 0; i < 3; i++) P(K.head, 0, 0.12, 0.33 + i * 0.001, 0.22 - i * 0.05, 0.02, 0.02, 0x6a4010); // marcas da testa
        if (M.atk) L(K.jaw, 0, 0.05, 0.6, 0.18, 0.12, 0.3, 0xffb040); // brasa do rugido
      },
    });
  },

  // ---------------- VACA REAL (Templo Antigo): chifres em lira com disco solar (estilo Hathor)
  templo_3(base, M) {
    quadMount(base, M, {
      h: 0.72, len: 1.56, w: 0.98, bodyH: 0.66, hs: 1.4, snout: 0.26, neckUp: 0.15, neckL: 0.55, neckW: 0.8, headPitch: 0.05,
      c1: 0xd8b070, c2: 0xe2bf84, belly: 0xf0dcb0, muzzle: 0xe8a8a0, jaw: 0xe8a8a0, leg: 0xc89a5a, hoof: 0x2a2018, legW: 0.19, eye: 0xffc107, brow: 0x5a3a1a,
      nose: 0xd08880, earIn: 0xe8a8a0, earOut: 1.1, tailUp: 1.35, tuft: 0x4a2a1a, gait: 1.1,
      saddle: { z: -0.1, blanket: 0x1e4a8a, seat: 0x6a3a1a, trim: 0xffc107 },
      extra: (K, P, L) => {
        for (const [x, y, z, s] of [[0.5, 0.1, -0.3, 0.34], [-0.5, -0.02, 0.2, 0.3], [0.5, -0.05, 0.4, 0.22], [-0.5, 0.12, -0.5, 0.26]]) P(K.body, x, y, z, 0.02, s, s * 1.3, 0x6a3a1a); // malhas
        for (const sg of [-1, 1]) { // chifres em lira
          const hn = J(K.head, sg * 0.18, 0.2, 0.08, 0, 0, sg * -0.9);
          P(hn, 0, 0.14, 0, 0.09, 0.3, 0.09, 0xf2e8cf);
          const h2 = J(hn, 0, 0.28, 0, 0, 0, sg * 1.2);
          P(h2, 0, 0.12, 0, 0.07, 0.26, 0.07, 0xf2e8cf);
          P(h2, 0, 0.27, 0, 0.05, 0.08, 0.05, 0xffc107);
        }
        L(K.head, 0, 0.5, 0.06, 0.3, 0.3, 0.05, 0xff9800); // disco solar entre os chifres
        L(K.head, 0, 0.5, 0.09, 0.18, 0.18, 0.03, 0xffe082);
        P(K.head, 0, -0.02 * K.hs, K.front + 0.03, 0.14, 0.14, 0.03, 0xffc107); // argola dourada no focinho
        P(K.head, 0, -0.06 * K.hs, K.front + 0.05, 0.08, 0.06, 0.03, 0x1a1208);
        P(K.body, 0, -0.06, K.Lg * 0.5, K.W * 1.12, 0.42, 0.06, 0x29b6f6); // colar
        for (const y of [-0.2, 0.0, 0.18]) P(K.body, 0, y, K.Lg * 0.535, K.W * 1.14, 0.04, 0.02, 0xffc107);
        P(K.neck, 0, -0.12, 0.12, 0.3, 0.26, 0.2, 0xf0dcb0); // papada
      },
    });
  },

  // ---------------- TUBARÃO ESQUELETO (Cemitério Naval)
  naval(base, M) {
    const { P, L, t, w, atk, fury } = M;
    const sw = t * 3 + w * 0.6;
    const bone = 0xd8d2c4, bone2 = 0xeae4d6, bone3 = 0xbab2a2;
    const body = J(base, 0, 0.76 + Math.sin(t * 2) * 0.04, 0, -atk * 0.08, Math.sin(sw) * 0.06, Math.sin(sw * 0.5) * 0.03);
    // espinha em segmentos que ondulam
    let seg = body;
    for (let i = 0; i < 7; i++) {
      seg = i === 0 ? J(body, 0, 0, 0.5, 0, 0, 0) : J(seg, 0, 0, -0.32, 0, Math.sin(sw - i * 0.7) * 0.12, 0);
      const s = 1 - i * 0.1;
      P(seg, 0, 0, -0.16, 0.2 * s, 0.2 * s, 0.24, bone);
      P(seg, 0, 0.14 * s, -0.16, 0.06, 0.16 * s, 0.1, bone2, -0.3); // processo da vértebra
      if (i < 5) for (const sg of [-1, 1]) { // costelas arqueadas
        P(seg, sg * 0.34 * s, -0.08, -0.16, 0.36 * s, 0.07, 0.08, bone2, 0, sg * 0.5);
        P(seg, sg * 0.52 * s, -0.36 * s, -0.16, 0.07, 0.4 * s, 0.08, bone2, 0, sg * -0.2);
        P(seg, sg * 0.32 * s, -0.6 * s, -0.16, 0.28 * s, 0.06, 0.08, bone3, 0, sg * -0.6);
      }
      if (i === 4) { // barbatana dorsal de ossos atrás do piloto
        for (let k = 0; k < 3; k++) P(seg, 0, 0.32 + k * 0.08, -0.06 - k * 0.12, 0.05, 0.42 - k * 0.1, 0.05, bone2, -0.7);
      }
      if (i === 6) { // cauda
        const tl = J(seg, 0, 0, -0.32, 0, Math.sin(sw - 5) * 0.4, 0);
        for (const sg of [-1, 1]) {
          P(tl, 0, sg * 0.24, -0.16, 0.05, 0.5, 0.06, bone2, sg * 0.7);
          P(tl, 0, sg * 0.16, -0.08, 0.04, 0.3, 0.05, bone3, sg * 0.4);
        }
      }
    }
    // núcleo espectral dentro das costelas
    L(body, 0, -0.26, -0.3, 0.3, 0.26, 0.9, fury ? 0xff5a1a : 0x29b6f6);
    for (let i = 0; i < 3; i++) L(body, Math.sin(t * 2 + i * 2) * 0.4, -0.2 + Math.cos(t * 3 + i) * 0.2, -0.3 - i * 0.4, 0.08, 0.08, 0.08, 0x9affff);
    // plataforma do piloto amarrada na espinha
    P(body, 0, 0.18, -0.12, 0.9, 0.08, 0.84, 0x523b2c);
    for (let i = 0; i < 4; i++) P(body, 0, 0.225, -0.45 + i * 0.22, 0.92, 0.02, 0.04, 0x3a2a1c);
    for (const sg of [-1, 1]) {
      P(body, sg * 0.46, 0.26, -0.12, 0.06, 0.2, 0.84, 0x3b3f46); // amurada
      P(body, sg * 0.3, 0.0, -0.12, 0.04, 0.36, 0.06, 0x7a6a4a); // cordas
    }
    // barbatanas peitorais de ossos
    for (const sg of [-1, 1]) {
      const pf = J(body, sg * 0.42, -0.3, 0.3, 0.2, 0, sg * (0.6 + Math.sin(sw) * 0.25));
      for (let k = 0; k < 3; k++) P(pf, sg * 0.3, 0, -k * 0.12, 0.6 - k * 0.12, 0.05, 0.05, bone2, 0, 0);
    }
    // crânio com mandíbula articulada e dentes
    const head = J(body, 0, 0.02, 0.5, 0, Math.sin(sw + 0.5) * -0.06, 0);
    P(head, 0, 0.12, 0.36, 0.9, 0.34, 0.74, bone2);
    P(head, 0, 0.18, 0.84, 0.56, 0.22, 0.34, bone); // focinho
    for (const sg of [-1, 1]) {
      P(head, sg * 0.3, 0.2, 0.62, 0.2, 0.18, 0.04, 0x141414); // órbita
      L(head, sg * 0.3, 0.2, 0.645, 0.12, 0.1, 0.02, 0x40f0ff);
      P(head, sg * 0.3, 0.32, 0.6, 0.24, 0.05, 0.04, bone3, 0, sg * 0.35); // arcada brava
      P(head, sg * 0.46, 0.0, 0.3, 0.02, 0.18, 0.4, bone3); // guelras
    }
    for (let i = 0; i < 6; i++) P(head, -0.3 + i * 0.12, -0.08, 0.86 - Math.abs(i - 2.5) * 0.04, 0.07, 0.16, 0.06, 0xffffff); // dentes de cima
    const jaw = J(head, 0, -0.06, 0.1, 0.18 + atk * 0.6 + Math.max(0, Math.sin(t * 1.8)) * 0.12, 0, 0);
    P(jaw, 0, -0.1, 0.4, 0.78, 0.1, 0.8, bone);
    for (let i = 0; i < 6; i++) P(jaw, -0.28 + i * 0.112, -0.01, 0.74 - Math.abs(i - 2.5) * 0.04, 0.06, 0.15, 0.05, 0xffffff);
    L(jaw, 0, -0.04, 0.4, 0.5, 0.03, 0.5, 0x29b6f6);
  },

  // ---------------- GOLEM DE OSSOS (Necrópole): gigante corcunda, piloto nas costas
  cemiterio(base, M) {
    const { P, L, t, w, atk, fury } = M;
    const run = M.moving ? 1 : 0;
    const g = w * 0.8;
    const bone = 0xd8c8a0, bone2 = 0xe8d8b0, bone3 = 0xb8a880, dark = 0x2a2418;
    const pel = J(base, 0, 1.02 + Math.abs(Math.sin(g)) * 0.05 * run, -0.1, 0, Math.sin(g) * 0.08 * run, 0);
    P(pel, 0, 0, 0, 0.9, 0.26, 0.5, bone3); // pélvis
    for (const sg of [-1, 1]) P(pel, sg * 0.36, 0.08, 0, 0.26, 0.3, 0.46, bone, 0, sg * 0.3);
    // pernas grossas com joelho
    for (const [sg, ph] of [[-1, 0], [1, Math.PI]]) {
      const a = Math.sin(g + ph) * 0.45 * run;
      const hip = J(pel, sg * 0.42, -0.08, 0.04, a, 0, sg * 0.08);
      P(hip, 0, -0.26, 0, 0.3, 0.52, 0.32, bone); // fêmur
      P(hip, 0, -0.04, 0, 0.36, 0.14, 0.36, bone3);
      const kn = J(hip, 0, -0.5, 0, -Math.max(0, a) * 0.8 - 0.05, 0, 0);
      P(kn, 0, 0, 0.04, 0.32, 0.2, 0.32, bone2); // rótula
      P(kn, sg * 0.04, -0.24, 0, 0.14, 0.42, 0.14, bone);
      P(kn, -sg * 0.06, -0.24, 0, 0.1, 0.4, 0.1, bone3);
      P(kn, 0, -0.47, 0.08, 0.42, 0.12, 0.54, bone3); // pé
      for (const x of [-0.13, 0, 0.13]) P(kn, x, -0.48, 0.38, 0.09, 0.08, 0.12, bone2);
    }
    // plataforma do piloto (presa ao quadril) e espinha curvada para a frente
    P(pel, 0, 0.17, -0.02, 0.84, 0.08, 0.6, 0x3a2a1a);
    for (const sg of [-1, 1]) P(pel, sg * 0.44, 0.3, -0.02, 0.06, 0.22, 0.6, bone2);
    const spine = J(pel, 0, 0.18, 0.2, 0.55 + atk * 0.2 + Math.sin(t * 1.5) * 0.03, 0, 0);
    for (let i = 0; i < 4; i++) P(spine, 0, 0.1 + i * 0.2, -0.04, 0.18, 0.14, 0.18, bone2);
    const chest = J(spine, 0, 0.82, 0.0, -0.25, Math.sin(g) * -0.1 * run, 0);
    // caixa torácica aberta com chama verde
    P(chest, 0, 0.1, 0.06, 1.1, 0.16, 0.6, bone2); // clavículas/ombros
    for (let i = 0; i < 4; i++) for (const sg of [-1, 1]) {
      P(chest, sg * 0.34, -0.06 - i * 0.14, 0.26, 0.34 - i * 0.03, 0.07, 0.07, bone, 0, sg * 0.15);
      P(chest, sg * 0.48 - sg * i * 0.02, -0.06 - i * 0.14, 0.06, 0.07, 0.07, 0.4, bone3);
    }
    P(chest, 0, -0.3, 0.3, 0.12, 0.56, 0.06, bone2); // esterno
    const fl = 0.8 + Math.sin(t * 8) * 0.2;
    L(chest, 0, -0.26, 0.08, 0.36 * fl, 0.4 * fl, 0.3, fury ? 0xff5a1a : 0x2ecc71);
    L(chest, Math.sin(t * 5) * 0.08, -0.04 + ((t * 0.9) % 0.3), 0.08, 0.12, 0.14, 0.12, 0xa8ffb0);
    // crânio com chifres e mandíbula
    const head = J(chest, 0, 0.2, 0.34, -0.3 + Math.sin(t * 0.9) * 0.05, Math.sin(t * 0.6) * 0.18, 0);
    P(head, 0, 0.16, 0.1, 0.52, 0.44, 0.48, bone2);
    P(head, 0, 0.0, 0.32, 0.4, 0.14, 0.12, bone); // maçãs
    for (const sg of [-1, 1]) {
      P(head, sg * 0.13, 0.17, 0.345, 0.15, 0.13, 0.02, dark); // órbita
      L(head, sg * 0.13, 0.16, 0.36, 0.08, 0.07, 0.02, 0x2ecc71);
      P(head, sg * 0.13, 0.27, 0.35, 0.18, 0.04, 0.03, bone3, 0, sg * 0.38);
      const hn = J(head, sg * 0.24, 0.32, 0.0, -0.3, 0, sg * -0.6);
      P(hn, 0, 0.14, 0, 0.1, 0.3, 0.1, bone3);
      P(hn, sg * 0.04, 0.3, -0.04, 0.07, 0.14, 0.07, dark, -0.4, sg * 0.4);
    }
    P(head, 0, 0.06, 0.345, 0.08, 0.08, 0.02, dark); // nariz
    const jaw = J(head, 0, -0.06, 0.1, 0.12 + atk * 0.5 + Math.max(0, Math.sin(t * 2.2)) * 0.06, 0, 0);
    P(jaw, 0, -0.06, 0.12, 0.42, 0.1, 0.4, bone);
    for (let i = 0; i < 5; i++) {
      P(head, -0.14 + i * 0.07, -0.05, 0.33, 0.045, 0.07, 0.03, TOOTH);
      P(jaw, -0.14 + i * 0.07, 0.01, 0.31, 0.045, 0.06, 0.03, TOOTH);
    }
    // braços longos: ombro -> cotovelo -> punho de ossos
    for (const [sg, ph] of [[-1, Math.PI], [1, 0]]) {
      const swing = Math.sin(g + ph) * 0.4 * run;
      const sh = J(chest, sg * 0.66, 0.08, 0.08, -swing - atk * 1.2, 0, sg * 0.18);
      P(sh, 0, 0.04, 0, 0.42, 0.34, 0.42, bone3); // ombreira
      for (const k of [-1, 1]) P(sh, k * 0.12, 0.26, 0, 0.08, 0.2, 0.08, bone2); // espinhos
      P(sh, 0, -0.32, 0, 0.18, 0.6, 0.18, bone);
      const el = J(sh, 0, -0.62, 0, -0.5 - atk * 0.3 + Math.sin(t * 1.4) * 0.05, 0, 0);
      P(el, 0, 0, 0, 0.24, 0.22, 0.24, bone2);
      P(el, sg * 0.05, -0.3, 0, 0.12, 0.56, 0.12, bone);
      P(el, -sg * 0.06, -0.3, 0, 0.09, 0.54, 0.09, bone3);
      P(el, 0, -0.66, 0.02, 0.44, 0.34, 0.4, bone2); // punho
      for (let k = 0; k < 4; k++) P(el, -0.15 + k * 0.1, -0.84, 0.12, 0.08, 0.12, 0.1, bone3);
      L(el, 0, -0.66, 0.23, 0.2, 0.08, 0.02, 0x2ecc71);
    }
  },
};
// tipos antigos apontam para o modelo equivalente (montarias futuras com o mesmo "kind")
Object.assign(MOUNT_MODELS, {
  vehicle: MOUNT_MODELS.praca, forklift: MOUNT_MODELS.armazem, beast: MOUNT_MODELS.vale, tank: MOUNT_MODELS.distrito,
  chariot: MOUNT_MODELS.coliseu, exo: MOUNT_MODELS.lab, lion: MOUNT_MODELS.templo, shark: MOUNT_MODELS.naval, golem: MOUNT_MODELS.cemiterio,
});
