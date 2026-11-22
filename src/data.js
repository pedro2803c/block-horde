// Dados do jogo: armas, desbloqueios por multiplicador, inimigos, sobreviventes e arenas.
import { makeMap } from './scenery.js';
import { modCh } from './scenery3.js';

// kind: gun (disparo instantâneo), throw (projétil arremessado), rocket (projétil reto), place (objeto colocado no chão),
//       flame (jato contínuo em cone), lob (granada lançada em arco), bolt (projétil de energia/gelo), glob (bolha ácida em arco)
// mag/reload: carregador e tempo de recarga (s); shell: recarrega um cartucho por vez · bloom: dispersão extra por disparo (recuo progressivo)
// el: elemento aplicado ao acertar (fire, ice, acid, energy) · cat: categoria mostrada no arsenal
export const WEAPONS = {
  pistol: { name: 'Pistola', cat: 'Pistola', kind: 'gun', dmg: 12, rate: 0.3, spread: 0.035, range: 22, pellets: 1, pierce: 0, mag: 12, reload: 1.0, start: Infinity, pack: 0, sound: 'shot_pistol', color: 0x3a3a40 },
  uzi: { name: 'Submetralhadora', cat: 'Submetralhadora', kind: 'gun', dmg: 9, rate: 0.085, spread: 0.07, bloom: 0.012, bloomMax: 0.12, range: 18, pellets: 1, pierce: 0, mag: 40, reload: 1.6, start: 160, pack: 120, sound: 'shot_smg', color: 0x2a2a2e },
  grenade: { name: 'Granadas', cat: 'Granada', kind: 'throw', dmg: 130, rate: 0.65, radius: 3.6, start: 6, pack: 5, sound: 'throw', color: 0x3f5a2a },
  shotgun: { name: 'Escopeta tática', cat: 'Curta distância', kind: 'gun', dmg: 10, rate: 0.75, spread: 0.3, range: 11, pellets: 7, pierce: 1, mag: 6, reload: 0.42, shell: true, start: 24, pack: 16, sound: 'shot_shotgun', color: 0x5a3a22 },
  barrel: { name: 'Barril explosivo', cat: 'Construção', kind: 'place', place: 'barrel', rate: 0.5, start: 4, pack: 3, sound: 'crate', color: 0xb02a1a },
  rifle: { name: 'Fuzil de assalto MK-5', cat: 'Rifle de assalto', kind: 'gun', dmg: 34, rate: 0.13, spread: 0.025, bloom: 0.004, bloomMax: 0.04, range: 30, pellets: 1, pierce: 3, mag: 30, reload: 1.8, start: 90, pack: 60, sound: 'shot_rifle', color: 0xc6b289 },
  sniper: { name: 'Rifle de precisão', cat: 'Sniper', kind: 'gun', dmg: 120, rate: 1.05, spread: 0.004, range: 42, pellets: 1, pierce: 4, knock: 3, heavy: true, mag: 5, reload: 2.4, start: 20, pack: 10, sound: 'shot_sniper', color: 0x4a5a2a },
  dynamite: { name: 'Dinamite', cat: 'Granada', kind: 'throw', proj: 'dynamite', dmg: 230, rate: 0.9, radius: 5.4, fuse: 2.0, start: 3, pack: 2, sound: 'throw', color: 0xd02a20 },
  barricade: { name: 'Barricada', cat: 'Construção', kind: 'place', place: 'barricade', rate: 0.4, start: 5, pack: 4, sound: 'crate', color: 0x8a6a3a },
  mine: { name: 'Minas terrestres', cat: 'Armadilha', kind: 'place', place: 'mine', rate: 0.4, start: 5, pack: 4, sound: 'beep', color: 0x2a2a2a },
  rocket: { name: 'Lança-foguetes', cat: 'Explosiva', kind: 'rocket', dmg: 150, rate: 0.95, radius: 3.8, speed: 22, mag: 2, reload: 2.0, start: 8, pack: 6, sound: 'shot_sniper', color: 0x3a4a3a },
  // ---- expansão do arsenal ----
  lmg: { name: 'Metralhadora pesada', cat: 'Suporte pesado', kind: 'gun', dmg: 20, rate: 0.075, spread: 0.05, bloom: 0.007, bloomMax: 0.1, range: 26, pellets: 1, pierce: 1, knock: 1.4, mag: 100, reload: 3.4, slowFire: 0.55, kick: 0.6, start: 200, pack: 150, sound: 'shot_lmg', color: 0x3a3c34 },
  flamer: { name: 'Lança-chamas', cat: 'Especial', kind: 'flame', dmg: 7, rate: 0.06, range: 6.2, arc: 0.55, el: 'fire', burn: { dps: 12, t: 3 }, mag: 100, reload: 2.6, start: 300, pack: 200, sound: 'flame', color: 0xb03a1a },
  glauncher: { name: 'Lança-granadas', cat: 'Explosiva', kind: 'lob', dmg: 110, rate: 0.7, radius: 3.2, speed: 15, bounces: 2, mag: 6, reload: 2.8, start: 12, pack: 8, sound: 'shot_gl', color: 0x4a5236 },
  plasma: { name: 'Rifle de plasma', cat: 'Energia', kind: 'bolt', dmg: 48, rate: 0.22, speed: 34, pierce: 2, blast: 1.3, el: 'energy', glow: 0x40e0ff, mag: 20, reload: 2.2, start: 60, pack: 40, sound: 'shot_plasma', color: 0x2a3a4a },
  cryo: { name: 'Canhão criogênico', cat: 'Controle', kind: 'bolt', dmg: 12, rate: 0.16, speed: 26, pierce: 0, el: 'ice', chill: 30, glow: 0xa8ecff, mag: 30, reload: 2.0, start: 90, pack: 60, sound: 'shot_cryo', color: 0x5a7a8a },
  acidgun: { name: 'Lança-ácido', cat: 'Corrosiva', kind: 'glob', dmg: 16, rate: 0.35, el: 'acid', corrode: { dps: 12, t: 4 }, puddle: { r: 1.2, life: 4, dps: 10 }, mag: 12, reload: 2.2, start: 40, pack: 30, sound: 'spit', color: 0x3a5a2a },
  egrenade: { name: 'Granada EMP', cat: 'Granada', kind: 'throw', proj: 'g_emp', dmg: 20, rate: 0.65, radius: 5, start: 3, pack: 2, sound: 'throw', color: 0x2a6ad8 },
  igrenade: { name: 'Granada incendiária', cat: 'Granada', kind: 'throw', proj: 'g_fire', dmg: 40, rate: 0.65, radius: 3, area: { life: 6, dps: 16 }, start: 3, pack: 2, sound: 'throw', color: 0xd85a1a },
  fgrenade: { name: 'Granada congelante', cat: 'Granada', kind: 'throw', proj: 'g_frost', dmg: 30, rate: 0.65, radius: 3.6, start: 3, pack: 2, sound: 'throw', color: 0x7ad8ff },
  tgrenade: { name: 'Granada tóxica', cat: 'Granada', kind: 'throw', proj: 'g_toxic', dmg: 10, rate: 0.65, radius: 3, area: { life: 8, dps: 14 }, start: 3, pack: 2, sound: 'throw', color: 0x6ab02a },
  proxmine: { name: 'Mina de proximidade', cat: 'Armadilha', kind: 'place', place: 'proxmine', rate: 0.4, start: 3, pack: 2, sound: 'beep', color: 0x3a3a2a },
  spikes: { name: 'Barreira de espinhos', cat: 'Armadilha', kind: 'place', place: 'spikes', rate: 0.4, start: 4, pack: 3, sound: 'crate', color: 0x6a6a70 },
  efence: { name: 'Cerca elétrica', cat: 'Armadilha', kind: 'place', place: 'efence', rate: 0.4, start: 3, pack: 2, sound: 'crate', color: 0xe8b020 },
  ltower: { name: 'Torre de laser', cat: 'Defesa', kind: 'place', place: 'ltower', rate: 0.6, start: 1, pack: 1, sound: 'crate', color: 0xd82020 },
  ftower: { name: 'Torre de fogo', cat: 'Defesa', kind: 'place', place: 'ftower', rate: 0.6, start: 1, pack: 1, sound: 'crate', color: 0xe8701a },
  itower: { name: 'Torre de gelo', cat: 'Defesa', kind: 'place', place: 'itower', rate: 0.6, start: 1, pack: 1, sound: 'crate', color: 0x5ac8ff },
  // Arsenal exclusivo do Templo Antigo. Os campos especiais são consumidos pelo combate compartilhado.
  pharaoh: { name: 'Rifle do Faraó', cat: 'Rifle de assalto', kind: 'gun', dmg: 30, rate: 0.12, spread: 0.022, bloom: 0.003, bloomMax: 0.035, range: 32, pellets: 1, pierce: 2, mag: 36, reload: 1.7, start: 108, pack: 72, sound: 'eg_royal', color: 0xd4a020, special: { id: 'royal', name: 'Bênção Real', every: 8, cooldown: 9, el: 'energy', bonus: 1.7 } },
  anubis_shotgun: { name: 'Espingarda Anúbis', cat: 'Curta distância', kind: 'gun', dmg: 11, rate: 0.72, spread: 0.26, range: 12, pellets: 8, pierce: 1, mag: 7, reload: 1.8, start: 42, pack: 28, sound: 'eg_judgment', color: 0x2a2a34, special: { id: 'judgment', name: 'Julgamento de Anúbis', every: 5, cooldown: 8, stun: 0.55 } },
  scarab_smg: { name: 'SMG Escaravelho', cat: 'Submetralhadora', kind: 'gun', dmg: 8, rate: 0.075, spread: 0.065, bloom: 0.008, bloomMax: 0.1, range: 19, pellets: 1, pierce: 0, mag: 42, reload: 1.5, start: 210, pack: 140, sound: 'eg_scarab_gun', color: 0x2a6a70, special: { id: 'swarm', name: 'Enxame do Escaravelho', every: 20, cooldown: 12, bonus: 2.2 } },
  sobek_launcher: { name: 'Lança-granadas de Sobek', cat: 'Explosiva', kind: 'lob', dmg: 95, rate: 0.72, radius: 3.4, speed: 15, bounces: 1, mag: 6, reload: 2.6, start: 12, pack: 8, sound: 'eg_river', color: 0x4a7a3a, special: { id: 'nile', name: 'Ácido do Rio Nilo', cooldown: 10, acid: { dps: 9, t: 3.5 } } },
  sphinx_drill: { name: 'Perfuradora da Esfinge', cat: 'Suporte pesado', kind: 'gun', dmg: 18, rate: 0.07, spread: 0.045, bloom: 0.006, bloomMax: 0.09, range: 28, pellets: 1, pierce: 3, knock: 1.3, mag: 90, reload: 3.1, start: 180, pack: 120, slowFire: 0.6, sound: 'eg_sphinx', color: 0xb08a40, special: { id: 'wrath', name: 'Fúria da Esfinge', every: 24, cooldown: 14, bonus: 2.4 } },
  desert_bow: { name: 'Arco do Deserto', cat: 'Precisão', kind: 'bolt', dmg: 76, rate: 0.78, speed: 34, pierce: 2, glow: 0xe8b020, mag: 8, reload: 1.8, start: 32, pack: 20, sound: 'eg_bow', color: 0x8a5a2a, special: { id: 'venom', name: 'Flecha Envenenada', cooldown: 7, poison: { dps: 7, t: 4 } } },
  bastet_staff: { name: 'Bastão de Bastet', cat: 'Energia', kind: 'bolt', dmg: 38, rate: 0.26, speed: 27, pierce: 1, blast: 1.1, el: 'energy', glow: 0xc070ff, mag: 24, reload: 2, start: 72, pack: 48, sound: 'eg_shadow', color: 0x7a3ab0, special: { id: 'shadow', name: 'Garras das Sombras', every: 12, cooldown: 11, bonus: 1.8 } },
  priest_staff: { name: 'Cajado do Sacerdote', cat: 'Maldição', kind: 'glob', dmg: 17, rate: 0.38, el: 'acid', corrode: { dps: 8, t: 3 }, puddle: { r: 1, life: 3, dps: 7 }, mag: 14, reload: 2, start: 42, pack: 28, sound: 'eg_curse', color: 0x8a3ad0, special: { id: 'curse', name: 'Maldição Profana', every: 6, cooldown: 9, slow: { t: 2, mul: 0.55 } } },
  horus_spear: { name: 'Lança de Hórus', cat: 'Especial', kind: 'bolt', dmg: 52, rate: 0.2, speed: 38, pierce: 4, blast: 0.7, el: 'energy', glow: 0x3fe0ff, mag: 18, reload: 1.9, start: 54, pack: 36, sound: 'eg_divine', color: 0x3fe0ff, special: { id: 'divine', name: 'Rajada Divina', every: 10, cooldown: 10, bonus: 2 } },
  mummy_blade: { name: 'Lâmina da Múmia', cat: 'Corpo a corpo', kind: 'gun', dmg: 54, rate: 0.48, spread: 0, range: 1.85, pellets: 1, pierce: 1, knock: 2.3, start: Infinity, pack: 0, sound: 'eg_sand_blade', color: 0xc8b890, melee: true, special: { id: 'resurrection', name: 'Ressurreição das Areias', every: 7, cooldown: 12, heal: 2 } },
  // ---- Arsenal exclusivo do Coliseu da Arena ----
  roman_gladius: { name: 'Gládio Legionário', cat: 'Corpo a corpo', kind: 'gun', dmg: 46, rate: 0.42, spread: 0, range: 1.9, pellets: 1, pierce: 1, knock: 2.0, start: Infinity, pack: 0, sound: 'melee_hit', color: 0xc8c0a0, melee: true, special: { id: 'legion_strike', name: 'Golpe da Legião', every: 6, cooldown: 10, armorBreak: 0.35, bonus: 1.6 } },
  roman_pilum: { name: 'Lança Pilum', cat: 'Arremesso', kind: 'throw', proj: 'roman_pilum', dmg: 95, rate: 0.85, radius: 0, start: 12, pack: 8, sound: 'throw', color: 0x8a6a3a, pierce: 3, special: { id: 'tactical_throw', name: 'Arremesso Tático', cooldown: 8, stun: 0.6 } },
  roman_centurion_bow: { name: 'Arco Centurião', cat: 'Precisão', kind: 'bolt', dmg: 68, rate: 0.72, speed: 36, pierce: 2, glow: 0xd4a020, mag: 8, reload: 1.6, start: 32, pack: 20, sound: 'eg_bow', color: 0x8a5a2a, special: { id: 'eagle_arrow', name: 'Flecha da Águia', cooldown: 7, mark: { t: 4, mul: 1.35 } } },
  roman_colosseum_shotgun: { name: 'Escopeta do Coliseu', cat: 'Curta distância', kind: 'gun', dmg: 12, rate: 0.7, spread: 0.28, range: 12, pellets: 8, pierce: 1, mag: 7, reload: 1.9, start: 42, pack: 28, sound: 'shot_shotgun', color: 0x5a3a22, el: 'fire', burn: { dps: 10, t: 3 }, special: { id: 'arena_blast', name: 'Explosão da Arena', every: 5, cooldown: 9, radius: 3.2, dmg: 80 } },
  roman_legion_smg: { name: 'SMG da Legião', cat: 'Submetralhadora', kind: 'gun', dmg: 9, rate: 0.08, spread: 0.06, bloom: 0.01, bloomMax: 0.11, range: 20, pellets: 1, pierce: 0, mag: 45, reload: 1.5, start: 225, pack: 150, sound: 'shot_smg', color: 0x2a2a2e, special: { id: 'imperial_march', name: 'Marcha Imperial', every: 25, cooldown: 12, bonus: 2.0, haste: 1.25 } },
  roman_emperor_rifle: { name: 'Rifle do Imperador', cat: 'Rifle de assalto', kind: 'gun', dmg: 36, rate: 0.12, spread: 0.02, bloom: 0.003, bloomMax: 0.035, range: 34, pellets: 1, pierce: 3, mag: 32, reload: 1.7, start: 96, pack: 64, sound: 'shot_rifle', color: 0xc6b289, special: { id: 'caesar_decree', name: 'Decreto de César', every: 10, cooldown: 11, mark: { t: 5, mul: 1.5 } } },
  roman_vestal_flamer: { name: 'Lança-chamas Vestal', cat: 'Especial', kind: 'flame', dmg: 8, rate: 0.055, range: 6.5, arc: 0.5, el: 'fire', burn: { dps: 14, t: 4 }, mag: 110, reload: 2.4, start: 330, pack: 220, sound: 'flame', color: 0xd04a1a, special: { id: 'sacred_fire', name: 'Fogo Sagrado', cooldown: 13, area: { life: 7, dps: 18 } } },
  roman_siege_glauncher: { name: 'Lança-granadas de Cerco', cat: 'Explosiva', kind: 'lob', dmg: 105, rate: 0.75, radius: 3.6, speed: 14, bounces: 1, mag: 6, reload: 2.8, start: 12, pack: 8, sound: 'shot_gl', color: 0x4a5236, special: { id: 'siege_bombardment', name: 'Bombardeio de Cerco', cooldown: 12, stun: 1.0, radius: 4.2 } },
  roman_ballista: { name: 'Besta Romana', cat: 'Precisão', kind: 'bolt', dmg: 82, rate: 0.68, speed: 40, pierce: 4, glow: 0xb08040, mag: 6, reload: 1.9, start: 24, pack: 16, sound: 'eg_bow', color: 0x6a4a2a, special: { id: 'piercing_bolt', name: 'Virote Perfurante', cooldown: 9, pierce: 6, bonus: 1.5 } },
  roman_colossus_hammer: { name: 'Martelo do Colosso', cat: 'Corpo a corpo', kind: 'gun', dmg: 70, rate: 0.6, spread: 0, range: 2.2, pellets: 1, pierce: 1, knock: 3.5, start: Infinity, pack: 0, sound: 'melee_hit', color: 0x6a6a70, melee: true, special: { id: 'colossus_impact', name: 'Impacto do Colosso', every: 5, cooldown: 12, stun: 1.4, slow: { t: 2.5, mul: 0.5 } } },
};
export const TEMPLE_WEAPONS = ['pharaoh', 'anubis_shotgun', 'scarab_smg', 'sobek_launcher', 'sphinx_drill', 'desert_bow', 'bastet_staff', 'priest_staff', 'horus_spear', 'mummy_blade'];
// Arsenal exclusivo do Coliseu da Arena. Mesmo padrão do Templo: kind/special consumidos pelo combate compartilhado.
export const COLISEUM_WEAPONS = ['roman_gladius', 'roman_pilum', 'roman_centurion_bow', 'roman_colosseum_shotgun', 'roman_legion_smg', 'roman_emperor_rifle', 'roman_vestal_flamer', 'roman_siege_glauncher', 'roman_ballista', 'roman_colossus_hammer'];
// Estruturas posicionáveis: hp = durabilidade · block: ocupa a célula (a horda ataca) · life: bateria (s) · range: detecção
export const TRAPS = {
  barricade: { hp: 260, block: true },
  barrel: { hp: 14 },
  mine: { hp: 14, range: 0.7 },
  proxmine: { hp: 14, range: 2.4, radius: 4, dmg: 160, delay: 0.5 },
  spikes: { hp: 240, range: 0.65, dmg: 18, tick: 0.5, slow: 0.5, wear: 8 },
  efence: { hp: 200, block: true, range: 1.45, dmg: 14, cd: 0.9, stun: 0.4, charges: 40 },
  ltower: { hp: 220, block: true, range: 9, dps: 34, life: 90 },
  ftower: { hp: 220, block: true, range: 4.5, dmg: 6, cd: 0.15, arc: 0.7, life: 90 },
  itower: { hp: 220, block: true, range: 8, cd: 0.7, life: 90 },
};
// grupos das teclas 1–9, 0 e -: apertar de novo a mesma tecla alterna entre as armas do grupo
export const WEAPON_GROUPS = [
  ['pistol'], ['uzi', 'scarab_smg', 'roman_legion_smg'], ['shotgun', 'anubis_shotgun', 'roman_colosseum_shotgun'], ['rifle', 'lmg', 'pharaoh', 'sphinx_drill', 'roman_emperor_rifle'], ['sniper', 'plasma', 'desert_bow', 'roman_centurion_bow', 'roman_ballista'], ['rocket', 'glauncher', 'sobek_launcher', 'roman_siege_glauncher'], ['flamer', 'cryo', 'acidgun', 'bastet_staff', 'priest_staff', 'horus_spear', 'roman_vestal_flamer'],
  ['grenade', 'igrenade', 'fgrenade', 'tgrenade', 'egrenade', 'dynamite', 'roman_pilum'], ['barrel', 'barricade', 'spikes', 'efence'], ['mine', 'proxmine', 'mummy_blade', 'roman_gladius', 'roman_colossus_hammer'], ['ltower', 'ftower', 'itower'],
];
export const WEAPON_ORDER = WEAPON_GROUPS.flat();
// teclas de atalho (solo): 1–9, 0 e -
export const SLOT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'];
export const SLOT_CODES = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'];
// resistências elementais: multiplicador do efeito (dano contínuo, lentidão e congelamento). mech: sensível a EMP
export const RESIST = {
  guardian: { fire: 1.6, ice: 0.7 },
  mechworker: { fire: 0.6, acid: 1.5, mech: true },
  devourer: { acid: 0.6 },
  general: { ice: 0.8 },
  boss: { fire: 0.8 },
  spore: { acid: 0.4, fire: 1.4 },
  spitter: { acid: 0.5 },
  wasp: { acid: 0.5, fire: 1.3 },
  specter: { fire: 0.5, ice: 0.8, energy: 2.5 },
  brute: { ice: 0.7 },
  armored: { acid: 1.4 },
  bat: { fire: 1.3 },
};

// Ao alcançar cada nível de multiplicador pela primeira vez, o time ganha o item permanentemente na partida.
export const UNLOCKS = [
  { level: 2, weapon: 'uzi', text: 'Submetralhadora' },
  { level: 3, weapon: 'grenade', text: 'Granadas' },
  { level: 4, weapon: 'shotgun', text: 'Escopeta tática' },
  { level: 4, weapon: 'spikes', text: 'Barreira de espinhos' },
  { level: 5, weapon: 'barrel', text: 'Barris explosivos' },
  { level: 5, weapon: 'igrenade', text: 'Granada incendiária' },
  { level: 6, upgrade: 'pistolFast', text: 'Pistola: disparo rápido' },
  { level: 6, weapon: 'acidgun', text: 'Lança-ácido' },
  { level: 7, weapon: 'rifle', text: 'Fuzil de assalto MK-5' },
  { level: 8, weapon: 'barricade', text: 'Barricadas' },
  { level: 8, weapon: 'fgrenade', text: 'Granada congelante' },
  { level: 9, upgrade: 'uziDmg', text: 'Submetralhadora: +40% de dano' },
  { level: 9, weapon: 'cryo', text: 'Canhão criogênico' },
  { level: 10, weapon: 'mine', text: 'Minas terrestres' },
  { level: 10, weapon: 'proxmine', text: 'Mina de proximidade' },
  { level: 11, weapon: 'sniper', text: 'Rifle de precisão' },
  { level: 11, weapon: 'efence', text: 'Cerca elétrica' },
  { level: 12, upgrade: 'shotgunPellets', text: 'Escopeta: 11 projéteis' },
  { level: 12, weapon: 'flamer', text: 'Lança-chamas' },
  { level: 13, weapon: 'dynamite', text: 'Dinamite' },
  { level: 13, weapon: 'egrenade', text: 'Granada EMP' },
  { level: 14, weapon: 'rocket', text: 'Lança-foguetes' },
  { level: 14, weapon: 'tgrenade', text: 'Granada tóxica' },
  { level: 15, upgrade: 'axe', wicon: 'axe', text: 'Machado (corpo a corpo)' },
  { level: 15, weapon: 'lmg', text: 'Metralhadora pesada' },
  { level: 16, upgrade: 'bigBoom', text: 'Explosões maiores' },
  { level: 16, weapon: 'itower', text: 'Torre de gelo' },
  { level: 17, weapon: 'glauncher', text: 'Lança-granadas' },
  { level: 18, upgrade: 'rifleRail', text: 'Fuzil de assalto: atravessa 8 inimigos' },
  { level: 18, weapon: 'ftower', text: 'Torre de fogo' },
  { level: 19, weapon: 'plasma', text: 'Rifle de plasma' },
  { level: 20, upgrade: 'doubleAmmo', text: 'Caixas de munição em dobro' },
  { level: 20, weapon: 'ltower', text: 'Torre de laser' },
  { level: 2, weapon: 'scarab_smg', text: 'SMG Escaravelho', only: ['templo'] },
  { level: 3, weapon: 'anubis_shotgun', text: 'Espingarda Anúbis', only: ['templo'] },
  { level: 4, weapon: 'pharaoh', text: 'Rifle do Faraó', only: ['templo'] },
  { level: 5, weapon: 'desert_bow', text: 'Arco do Deserto', only: ['templo'] },
  { level: 6, weapon: 'sobek_launcher', text: 'Lança-granadas de Sobek', only: ['templo'] },
  { level: 7, weapon: 'bastet_staff', text: 'Bastão de Bastet', only: ['templo'] },
  { level: 8, weapon: 'priest_staff', text: 'Cajado do Sacerdote', only: ['templo'] },
  { level: 9, weapon: 'horus_spear', text: 'Lança de Hórus', only: ['templo'] },
  { level: 10, weapon: 'sphinx_drill', text: 'Perfuradora da Esfinge', only: ['templo'] },
  { level: 11, weapon: 'mummy_blade', text: 'Lâmina da Múmia', only: ['templo'] },
  { level: 2, weapon: 'roman_gladius', text: 'Gládio Legionário', only: ['coliseu'] },
  { level: 3, weapon: 'roman_pilum', text: 'Lança Pilum', only: ['coliseu'] },
  { level: 4, weapon: 'roman_centurion_bow', text: 'Arco Centurião', only: ['coliseu'] },
  { level: 5, weapon: 'roman_colosseum_shotgun', text: 'Escopeta do Coliseu', only: ['coliseu'] },
  { level: 6, weapon: 'roman_legion_smg', text: 'SMG da Legião', only: ['coliseu'] },
  { level: 7, weapon: 'roman_emperor_rifle', text: 'Rifle do Imperador', only: ['coliseu'] },
  { level: 8, weapon: 'roman_vestal_flamer', text: 'Lança-chamas Vestal', only: ['coliseu'] },
  { level: 9, weapon: 'roman_siege_glauncher', text: 'Lança-granadas de Cerco', only: ['coliseu'] },
  { level: 10, weapon: 'roman_ballista', text: 'Besta Romana', only: ['coliseu'] },
  { level: 11, weapon: 'roman_colossus_hammer', text: 'Martelo do Colosso', only: ['coliseu'] },
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
  // ---- Egito Antigo: exclusivos do Templo Antigo (only) ----
  mummy: { name: 'Múmia Guerreira', desc: 'Básica e numerosa: surge em grupos de três', icon: 'skull', hp: 34, speed: 1.65, dmg: 11, rate: 1.0, reach: 0.95, scale: 1, score: 12, from: 1, weight: 6, group: 3, only: ['templo'], blood: [0xc8b890, 0x6a5a3a], sfx: { attack: 'eg_mummy', die: 'eg_mummy' } },
  anubis: { name: 'Guardião Anúbis', desc: 'Elite: escudo frontal, golpes pesados e protege aliados próximos', icon: 'shield', hp: 150, speed: 1.35, dmg: 26, rate: 1.6, reach: 1.45, scale: 1.3, score: 60, from: 3, weight: 0.9, shield: 0.2, aura: { radius: 4.5, mul: 0.6 }, only: ['templo'], blood: [0x2a2a34, 0xd4a020], sfx: { attack: 'eg_jackal', die: 'eg_mummy' }, loot: 0.35 },
  archer: { name: 'Arqueiro do Deserto', desc: 'Mantém distância, recua e dispara flechas envenenadas', icon: 'target', hp: 40, speed: 1.9, dmg: 6, rate: 1.0, reach: 0.95, scale: 1, score: 25, from: 2, weight: 2, kite: 4, spit: { range: 12, dmg: 8, cd: 2.2, color: 0x8aff3a, splat: '#5aa02a', arrow: true, sfx: 'eg_arrow', poison: { dps: 4, t: 3 } }, only: ['templo'], sfx: { die: 'eg_mummy' } },
  scarab: { name: 'Escaravelho Gigante', desc: 'Corre muito e explode ao ser eliminado', icon: 'burst', body: 'scarab', hp: 26, speed: 3.9, dmg: 9, rate: 0.8, reach: 0.95, scale: 1, radius: 0.45, score: 22, from: 2, weight: 2, deathBurst: { radius: 2.6, dmg: 22 }, only: ['templo'], blood: [0x2a6aa0, 0xd4a020], sfx: { attack: 'eg_scarab', die: 'eg_scarab' } },
  serpent: { name: 'Serpente Sagrada', desc: 'Surge do chão, dá botes em linha reta, envenena e reaparece em outro ponto', icon: 'bolt', body: 'serpent', hp: 45, speed: 2.6, dmg: 10, rate: 1.0, reach: 1.1, scale: 1, radius: 0.4, score: 30, from: 4, weight: 1.3, lunge: { range: 5, speed: 12, cd: 3 }, blink: { range: 16, cd: 7, dist: 5, color: 0xd4a020 }, poison: { dps: 5, t: 3 }, only: ['templo'], blood: [0xd4a020, 0x8a1a10], sfx: { attack: 'eg_hiss', die: 'eg_hiss' } },
  priest: { name: 'Sacerdote Profano', desc: 'Invoca múmias, fortalece aliados e lança maldições que deixam lento', icon: 'hood', hp: 70, speed: 1.5, dmg: 8, rate: 1.2, reach: 1.0, scale: 1.05, score: 55, from: 5, weight: 0.7, summon: { cd: 8, n: 2, max: 6, types: ['mummy', 'mummy', 'scarab'] }, spit: { range: 10, dmg: 9, cd: 2.6, color: 0xb050ff, splat: '#7a2ab0', sfx: 'eg_magic', slow: { t: 2, mul: 0.6 } }, aura: { radius: 5, mul: 0.75 }, only: ['templo'], blood: [0x7a3ab0, 0x4a1a6a], sfx: { die: 'eg_mummy' } },
  phantom: { name: 'Fantasma do Faraó', desc: 'Espectral: flutua sobre obstáculos e se teletransporta', icon: 'ghost', body: 'phantom', hp: 55, speed: 2.7, dmg: 12, rate: 0.9, reach: 1.1, scale: 1.1, radius: 0.38, score: 45, from: 6, weight: 0.9, fly: true, hover: 1.0, blink: { range: 12, cd: 5, dist: 3.5, color: 0x70e8ff }, only: ['templo'], blood: [0x70e8ff, 0x2a7a9a], sfx: { attack: 'eg_magic', die: 'eg_magic' } },
  construct: { name: 'Construto de Areia', desc: 'Tanque: regenera aos poucos e cada golpe solta uma onda de choque', icon: 'fist', hp: 320, speed: 1.0, dmg: 30, rate: 1.8, reach: 1.6, scale: 1.75, score: 90, from: 7, weight: 0.5, regen: { rate: 6, max: 120 }, quake: { radius: 3, dmg: 14 }, only: ['templo'], blood: [0xe0c080, 0xb08a40], sfx: { die: 'eg_rumble' } },
  scorpion: { name: 'Escorpião Imperial', desc: 'Salta contra o jogador, prende com as pinças e envenena com o ferrão', icon: 'scythe', body: 'scorpion', hp: 85, speed: 2.3, dmg: 13, rate: 1.0, reach: 1.25, scale: 1.15, radius: 0.5, score: 45, from: 6, weight: 0.9, lunge: { range: 6, speed: 11, cd: 3 }, poison: { dps: 5, t: 3 }, only: ['templo'], blood: [0x7a2ab0, 0x1a1a20], sfx: { attack: 'eg_scarab', die: 'eg_scarab' } },
  jackal: { name: 'Híbrido Chacal', desc: 'Corre muito, salta e ataca em sequência', icon: 'paw', body: 'jackal', radius: 0.42, hp: 42, speed: 3.4, dmg: 7, rate: 0.5, reach: 1.0, scale: 1.05, score: 30, from: 4, weight: 1.4, lunge: { range: 5, speed: 12, cd: 2.2 }, only: ['templo'], blood: [0x8a1610, 0x4a2a14], sfx: { attack: 'eg_jackal', die: 'eg_jackal' } },
  portal: { name: 'Portal das Almas', desc: 'Estrutura fixa: brilha e invoca inimigos até ser destruída', icon: 'spore', body: 'portal', hp: 260, speed: 0, dmg: 0, rate: 1, reach: 1, scale: 1, radius: 0.9, score: 80, from: 5, weight: 0.35, static: true, summon: { cd: 7, n: 2, max: 6, windup: 1.6, types: ['mummy', 'mummy', 'scarab', 'jackal'] }, only: ['templo'], blood: [0x8a3ad0, 0x6a5e52], sfx: { die: 'eg_magic' } },
  skeleton: { name: 'Esqueleto de Faraó', desc: 'Ágil: avança rápido, ataca em sequência e esquiva de tiros', icon: 'skull', hp: 50, speed: 2.4, dmg: 9, rate: 0.55, reach: 1.15, scale: 1, score: 35, from: 5, weight: 1.1, lunge: { range: 5, speed: 10, cd: 3.5 }, dodge: { chance: 0.3, cd: 2 }, only: ['templo'], blood: [0xe8e0c8, 0xb8ae90], sfx: { die: 'eg_scarab' } },
  chariot: { name: 'Carruagem Maldita', desc: 'Para, brilha e investe para atropelar; dispara projéteis de longe', icon: 'run', body: 'chariot', hp: 220, speed: 2.2, dmg: 18, rate: 1.4, reach: 1.4, scale: 1.1, radius: 0.8, score: 80, from: 8, weight: 0.45, lunge: { range: 10, speed: 10, cd: 4.5, windup: 0.8, time: 0.9 }, spit: { range: 11, dmg: 8, cd: 3, color: 0xffd040, splat: '#c8a020', arrow: true, sfx: 'eg_arrow' }, only: ['templo'], blood: [0xe8e0c8, 0xd4a020], sfx: { die: 'eg_rumble' }, loot: 0.5 },
  horus: { name: 'Hórus Corrompido', desc: 'Elite aérea: voa em círculos, dispara rajadas de energia e mergulha', icon: 'bat', body: 'horus', hp: 90, speed: 3.0, dmg: 12, rate: 1.0, reach: 1.1, scale: 1.1, radius: 0.45, score: 70, from: 8, weight: 0.6, fly: true, hover: 1.8, strafe: true, lunge: { range: 7, speed: 13, cd: 4, windup: 0.4 }, spit: { range: 11, dmg: 10, cd: 2.4, color: 0x3fe0ff, splat: '#2a9ab0', arrow: true, sfx: 'eg_magic' }, only: ['templo'], blood: [0x3fe0ff, 0xd4a020], sfx: { attack: 'eg_jackal', die: 'eg_magic' }, loot: 0.35 },
  // ---- Roma Antiga: exclusivos do Coliseu da Arena (only) ----
  rm_legion: { name: 'Legionário Zumbi', desc: 'Básico e numeroso: avança em formação cerrada', icon: 'shield', hp: 34, speed: 1.65, dmg: 11, rate: 1.0, reach: 1.0, scale: 1, score: 12, from: 1, weight: 5, group: 4, formation: { tag: 'legion', radius: 4 }, only: ['coliseu'], blood: [0x8a1610, 0x6a5a3a] },
  rm_centurion: { name: 'Centurião Infectado', desc: 'Elite: escudo frontal, comanda a formação, protege e acelera os legionários próximos', icon: 'shield', hp: 150, speed: 1.35, dmg: 26, rate: 1.6, reach: 1.45, scale: 1.3, score: 60, from: 5, weight: 0.8, shield: 0.2, aura: { radius: 4.5, mul: 0.6, haste: 1.15 }, formation: { tag: 'legion', radius: 5, lead: true }, only: ['coliseu'], blood: [0x8a1610, 0xd4a020], loot: 0.35 },
  rm_archer: { name: 'Arqueiro Romano', desc: 'Mantém distância, mira com calma e dispara flechas que atravessam coberturas', icon: 'target', hp: 40, speed: 1.9, dmg: 6, rate: 1.0, reach: 0.95, scale: 1, score: 25, from: 3, weight: 1.6, kite: 5, spit: { range: 13, dmg: 10, cd: 2.6, windup: 0.6, recover: 0.4, pierce: true, color: 0xe8d8b0, splat: '#8a6a3a', arrow: true, sfx: 'eg_arrow' }, only: ['coliseu'], blood: [0x8a1610, 0x6a5a3a] },
  rm_gladiator: { name: 'Gladiador Corrompido', desc: 'Agressivo: prepara o golpe e investe com tudo contra o jogador', icon: 'fist', hp: 65, speed: 2.3, dmg: 14, rate: 0.8, reach: 1.2, scale: 1.1, score: 40, from: 4, weight: 1.0, lunge: { range: 6, speed: 11, cd: 3.2, windup: 0.35, time: 0.45 }, only: ['coliseu'], blood: [0x8a1610, 0x4a2a14], loot: 0.15 },
  rm_hound: { name: 'Cão de Caça Infectado', desc: 'Caça em matilha: cerca o jogador por vários lados e dá botes', icon: 'paw', radius: 0.38, hp: 28, speed: 3.2, dmg: 9, rate: 0.7, reach: 1.0, scale: 0.9, score: 20, from: 2, weight: 1.2, group: 3, formation: { tag: 'hound', radius: 5, flank: true }, lunge: { range: 4, speed: 9, cd: 3 }, only: ['coliseu'], blood: [0x8a1610, 0x4a2a14] },
  rm_praetor: { name: 'Pretor Sombrio', desc: 'Suporte mágico: invoca reforços, fortalece aliados e lança raios roxos', icon: 'hood', hp: 82, speed: 1.4, dmg: 8, rate: 1.2, reach: 1.0, scale: 1.1, score: 70, from: 6, weight: 0.65, summon: { cd: 9, n: 2, max: 4, windup: 1.0, types: ['rm_legion', 'rm_legion', 'rm_hound'] }, spit: { range: 11, dmg: 10, cd: 2.4, windup: 0.5, recover: 0.3, arrow: true, color: 0xb050ff, splat: '#7a2ab0', sfx: 'eg_magic', slow: { t: 1.5, mul: 0.7 } }, aura: { radius: 5, mul: 0.85, dmg: 1.15, ring: 0xb050ff }, only: ['coliseu'], blood: [0x7a3ab0, 0x4a1a6a], sfx: { die: 'eg_magic' }, loot: 0.3 },
  rm_beast: { name: 'Besta de Arena', desc: 'Leão veloz e imprevisível: morde e alterna investidas curtas e longas', icon: 'paw', hp: 60, speed: 3.1, dmg: 12, rate: 0.7, reach: 1.15, scale: 1.15, radius: 0.5, score: 40, from: 6, weight: 0.9, lunge: { range: 6, speed: 12, cd: 2.6, jitter: 0.45 }, only: ['coliseu'], blood: [0x8a1610, 0x4a2a14], sfx: { attack: 'eg_jackal', die: 'eg_jackal' }, loot: 0.15 },
  rm_spirit: { name: 'Espírito do Imperador', desc: 'Espectral: flutua, atravessa obstáculos, reposiciona por blink e fere por contato', icon: 'ghost', hp: 70, speed: 2.5, dmg: 10, rate: 1.0, reach: 1.1, scale: 1.25, radius: 0.4, score: 55, from: 7, weight: 0.8, fly: true, hover: 1.3, blink: { range: 13, cd: 4.5, dist: 4, through: true, color: 0x70e8ff }, contact: { dmg: 5, cd: 0.9, radius: 0.55 }, only: ['coliseu'], blood: [0x70e8ff, 0x2a7a9a], sfx: { attack: 'eg_magic', die: 'eg_magic' }, loot: 0.2 },
  rm_standard: { name: 'Estandarte Legionário', desc: 'Suporte fixo: aura que aumenta o dano e a velocidade dos inimigos próximos', icon: 'flag', hp: 190, speed: 0, dmg: 0, rate: 1, reach: 1, scale: 1.2, radius: 0.6, score: 60, from: 8, weight: 0.3, static: true, aura: { radius: 5.5, dmg: 1.25, haste: 1.2, ring: 0xffc040 }, only: ['coliseu'], blood: [0x8a1610, 0xd4a020], loot: 0.3 },
  rm_engineer: { name: 'Engenheiro de Cerco', desc: 'Suporte tático: constrói torres de cerco no campo e protege aliados próximos', icon: 'gear', hp: 72, speed: 1.65, dmg: 10, rate: 1.1, reach: 1.05, scale: 1.05, score: 65, from: 7, weight: 0.65, summon: { cd: 10, n: 1, max: 2, windup: 1.2, types: ['rm_turret'], color: 0xffc040 }, aura: { radius: 4.5, mul: 0.88, ring: 0xd4a020 }, only: ['coliseu'], blood: [0x8a1610, 0x7a4a24], sfx: { attack: 'melee_hit', die: 'zombie_die' }, loot: 0.25 },
  rm_turret: { name: 'Torre de Cerco', desc: 'Balista de madeira erguida pelo Engenheiro: dispara virotes até ser destruída', icon: 'target', hp: 55, speed: 0, dmg: 0, rate: 1, reach: 1, scale: 0.95, radius: 0.55, score: 15, from: 99, weight: 0, summonedOnly: true, static: true, spit: { range: 12, dmg: 7, cd: 2.2, windup: 0.35, arrow: true, color: 0xe8c870, splat: '#7a4a24', sfx: 'eg_arrow' }, only: ['coliseu'], blood: [0x7a4a24, 0xb4b8c0], sfx: { die: 'eg_rumble' } },
  rm_chariot: { name: 'Carruagem de Guerra', desc: 'Avança em alta velocidade após aviso para atropelar e arremessa lanças romanas', icon: 'run', hp: 230, speed: 2.3, dmg: 20, rate: 1.35, reach: 1.45, scale: 1.15, radius: 0.82, score: 85, from: 8, weight: 0.45, lunge: { range: 10.5, speed: 12, cd: 4.4, windup: 0.75, time: 0.85 }, spit: { range: 12, dmg: 10, cd: 2.8, windup: 0.35, arrow: true, color: 0xe8d0a0, splat: '#8a6a3a', sfx: 'eg_arrow' }, only: ['coliseu'], blood: [0x8a1610, 0xd4a020], sfx: { die: 'eg_rumble' }, loot: 0.45 },
  rm_eagle: { name: 'Águia Imperial Corrompida', desc: 'Inimigo aéreo: voa em círculos, dispara energia roxa e mergulha sobre o jogador', icon: 'bat', hp: 95, speed: 3.1, dmg: 14, rate: 0.95, reach: 1.15, scale: 1.15, radius: 0.48, score: 75, from: 8, weight: 0.55, fly: true, hover: 1.9, strafe: true, lunge: { range: 8, speed: 14, cd: 3.8, windup: 0.45, time: 0.45 }, spit: { range: 12, dmg: 10, cd: 2.5, arrow: true, color: 0xc040ff, splat: '#7a2ab0', sfx: 'eg_magic' }, only: ['coliseu'], blood: [0x9a30d0, 0xd4a020], sfx: { attack: 'eg_jackal', die: 'eg_magic' }, loot: 0.35 },
  rm_catapult: { name: 'Catapulta de Cerco', desc: 'Unidade de cerco fixa: prepara e lança rochas em chamas com área de impacto marcada', icon: 'burst', hp: 240, speed: 0, dmg: 0, rate: 1, reach: 1, scale: 1.25, radius: 0.95, score: 85, from: 9, weight: 0.3, static: true, siegeSpot: true, lob: { range: 22, minRange: 4, dmg: 26, radius: 2.3, cd: 5.5, windup: 1.35, color: 0xff6a1a }, only: ['coliseu'], blood: [0x7a4a24, 0xff6a1a], sfx: { attack: 'throw', die: 'eg_rumble' }, loot: 0.4 },
  rm_elephant: { name: 'Elefante de Guerra', desc: 'Tanque brutal: investe quebrando obstáculos, gera onda de choque e atordoa o jogador', icon: 'fist', hp: 360, speed: 1.25, dmg: 32, rate: 1.7, reach: 1.7, scale: 1.65, radius: 0.95, score: 110, from: 9, weight: 0.4, lunge: { range: 9.5, speed: 9.5, cd: 5.5, windup: 0.85, time: 0.85, smash: true, stun: 1.2 }, quake: { radius: 3.4, dmg: 16, stun: 0.8 }, only: ['coliseu'], blood: [0x6e6860, 0x8a1610], sfx: { attack: 'stomp', die: 'eg_rumble' }, loot: 0.55 },
  pharaoh: { name: 'Faraó Renegado', desc: 'Chefão do Templo: 3 fases, tempestade de areia, múmias, ondas de energia e explosões no chão', icon: 'crown', hp: 2100, speed: 1.45, dmg: 40, rate: 1.3, reach: 2.4, scale: 2.6, score: 650, boss: true, bossKind: 'pharaoh', intro: 'O FARAÓ RENEGADO DESPERTOU!', riseIntro: 1.6, blood: [0xd8cba0, 0xd4a020], introSfx: 'eg_horn', treasure: 400 },
  sobek: { name: 'Sobek, o Devorador', desc: 'Chefão do Templo: mordidas, investidas brutais, giro com a cauda e crocodilos menores', icon: 'crown', hp: 2300, speed: 1.5, dmg: 44, rate: 1.2, reach: 2.5, scale: 2.7, score: 700, boss: true, bossKind: 'sobek', intro: 'SOBEK, O DEVORADOR EMERGIU!', riseIntro: 1.6, blood: [0x4a7a3a, 0xd4a020], introSfx: 'eg_horn', treasure: 450 },
  crocling: { name: 'Crocodilo do Nilo', desc: 'Filhote invocado por Sobek: pequeno, rápido e dá botes', icon: 'paw', body: 'crocling', hp: 30, speed: 3.0, dmg: 8, rate: 0.8, reach: 0.9, scale: 0.8, radius: 0.4, score: 10, from: 99, weight: 0, summonedOnly: true, lunge: { range: 4, speed: 10, cd: 3 }, only: ['templo'], blood: [0x4a7a3a, 0x2a4a1a], sfx: { attack: 'eg_hiss' } },
  bastet: { name: 'Bastet Sombria', desc: 'Chefão do Templo: teletransporte, projéteis mágicos, clones ilusórios e tempestade de energia', icon: 'crown', hp: 2000, speed: 2.0, dmg: 34, rate: 1.0, reach: 2.2, scale: 2.4, score: 700, boss: true, bossKind: 'bastet', intro: 'BASTET SOMBRIA SURGIU DAS SOMBRAS!', riseIntro: 1.2, blood: [0x8a3ad0, 0x1a1a22], introSfx: 'eg_horn', treasure: 450 },
  bastetclone: { name: 'Ilusão de Bastet', desc: 'Clone ilusório: frágil, mas ataca e lança magia', icon: 'ghost', hp: 40, speed: 2.6, dmg: 12, rate: 1.0, reach: 1.4, scale: 1.7, score: 15, from: 99, weight: 0, summonedOnly: true, fixedHp: true, spit: { range: 10, dmg: 8, cd: 2.8, color: 0xc070ff, splat: '#7a2ab0', sfx: 'eg_magic' }, only: ['templo'], blood: [0xc070ff, 0x4a2272], sfx: { die: 'eg_magic' } },
  sphinx: { name: 'A Esfinge Eterna', desc: 'Chefão final do Templo: pancadas com ondas de choque, desmoronamento, construtos e raios de energia', icon: 'crown', body: 'sphinx', hp: 2800, speed: 1.1, dmg: 46, rate: 1.6, reach: 2.8, scale: 2.2, radius: 1.4, score: 900, boss: true, bossKind: 'sphinx', intro: 'A ESFINGE ETERNA DESPERTOU!', riseIntro: 1.8, blood: [0xd8b070, 0xd4a020], introSfx: 'eg_horn', treasure: 600 },
  boss: { name: 'Colosso', desc: 'Gigante, resistente e com múltiplos ataques', icon: 'crown', hp: 1500, speed: 1.5, dmg: 36, rate: 1.3, reach: 2.2, scale: 2.6, score: 500, boss: true, blood: [0x5a4a44, 0xff5a1a] },
  devourer: { name: 'O Devorador', desc: 'Zumbi gigante que destrói obstáculos e investe contra a horda', icon: 'crown', hp: 1700, speed: 1.55, dmg: 40, rate: 1.25, reach: 2.3, scale: 2.7, score: 600, boss: true, bossKind: 'devourer', blood: [0x5a7a24, 0x2a3a10] },
  mechworker: { name: 'O Operário Mutante', desc: 'Blindado com braços mecânicos: resiste a tiros e esmaga o chão', icon: 'crown', hp: 1900, speed: 1.3, dmg: 42, rate: 1.3, reach: 2.4, scale: 2.6, score: 600, boss: true, bossKind: 'mechworker', plating: 0.6, blood: [0x8a8a90, 0xe8a020] },
  guardian: { name: 'O Guardião da Floresta', desc: 'Madeira, raízes e fungos: prende os jogadores e solta esporos', icon: 'crown', hp: 1800, speed: 1.35, dmg: 38, rate: 1.3, reach: 2.5, scale: 2.8, score: 600, boss: true, bossKind: 'guardian', blood: [0x4a6a24, 0x8a4ad0] },
  general: { name: 'O General Infectado', desc: 'Comandante blindado: convoca reforços e enfurece a horda', icon: 'crown', hp: 2000, speed: 1.4, dmg: 40, rate: 1.25, reach: 2.4, scale: 2.6, score: 600, boss: true, bossKind: 'general', blood: [0x6a7a2a, 0xb01c1c] },
   // ---- Laboratório de Pesquisa: exclusivos (only: ['lab']) ----
   lb_specter: { name: 'Espectro Infectado', desc: 'Espectral: flutua, atravessa obstáculos e fere por contato espectral', icon: 'ghost', hp: 60, speed: 2.6, dmg: 12, rate: 0.9, reach: 1.1, scale: 1.1, radius: 0.4, score: 45, from: 2, weight: 1.0, fly: true, hover: 1.2, blink: { range: 12, cd: 5, dist: 3.5, through: true, color: 0x70e8ff }, contact: { dmg: 6, cd: 0.8, radius: 0.55 }, only: ['lab'], blood: [0x70e8ff, 0x2a7a9a], sfx: { attack: 'eg_magic', die: 'eg_magic' } },
   lb_tremor: { name: 'Tremor', desc: 'Tanque: cada golpe gera onda de choque que atordoa', icon: 'fist', hp: 280, speed: 1.1, dmg: 28, rate: 1.6, reach: 1.5, scale: 1.5, radius: 0.7, score: 70, from: 3, weight: 0.6, quake: { radius: 3.2, dmg: 15, stun: 0.9 }, only: ['lab'], blood: [0x8a6a4a, 0x4a3a2a], sfx: { attack: 'stomp', die: 'eg_rumble' } },
   lb_launcher: { name: 'Lancador', desc: 'Mantem distancia e dispara projeteis de acido em arco', icon: 'target', hp: 55, speed: 1.8, dmg: 8, rate: 1.0, reach: 0.9, scale: 1.0, score: 30, from: 2, weight: 1.3, kite: 6, lob: { range: 14, minRange: 4, dmg: 14, radius: 1.8, cd: 3.5, windup: 0.8, color: 0x4aff4a }, only: ['lab'], blood: [0x4aff4a, 0x2a6a2a], sfx: { attack: 'throw', die: 'zombie_die' } },
   lb_suppressor: { name: 'Supressor', desc: 'Area de negacao: projeta campo que desacelera e silencia', icon: 'shield', hp: 90, speed: 1.5, dmg: 10, rate: 1.2, reach: 1.0, scale: 1.1, radius: 0.5, score: 50, from: 4, weight: 0.8, aura: { radius: 4.5, mul: 0.7, slow: { t: 2, mul: 0.5 }, ring: 0x4aff4a }, only: ['lab'], blood: [0x4aff4a, 0x2a4a2a], sfx: { die: 'zombie_die' } },
   lb_corrosive: { name: 'Corrosivo', desc: 'Corroi armadura e deixa poca de acido no chao', icon: 'spore', hp: 45, speed: 2.0, dmg: 7, rate: 0.8, reach: 1.0, scale: 1.0, score: 28, from: 2, weight: 1.4, spit: { range: 8, dmg: 6, cd: 2.0, color: 0x4aff4a, splat: '#2a6a2a', sfx: 'throw', corrode: { t: 3, mul: 0.7 } }, only: ['lab'], blood: [0x4aff4a, 0x2a6a2a], sfx: { die: 'zombie_die' } },
   lb_incendiary: { name: 'Incendiario', desc: 'Dispara projeteis de fogo que queimam o alvo', icon: 'burst', hp: 40, speed: 2.2, dmg: 8, rate: 0.9, reach: 0.95, scale: 1.0, score: 32, from: 2, weight: 1.3, spit: { range: 10, dmg: 7, cd: 2.2, color: 0xff6a1a, splat: '#c84020', sfx: 'throw', burn: { dps: 8, t: 3 } }, only: ['lab'], blood: [0xff6a1a, 0xc84020], sfx: { die: 'zombie_die' } },
   lb_freezer: { name: 'Congelador', desc: 'Dispara raios de gelo que desaceleram e congelam', icon: 'bolt', hp: 50, speed: 1.9, dmg: 6, rate: 1.0, reach: 0.95, scale: 1.0, score: 30, from: 3, weight: 1.2, spit: { range: 11, dmg: 5, cd: 2.0, color: 0x80d0ff, splat: '#4a90c0', sfx: 'eg_magic', chill: { t: 2.5, mul: 0.5 } }, only: ['lab'], blood: [0x80d0ff, 0x4a90c0], sfx: { die: 'zombie_die' } },
   lb_hunter: { name: 'Cacador', desc: 'Rapido e implacavel: persegue sem parar e da botes', icon: 'paw', hp: 55, speed: 3.0, dmg: 12, rate: 0.7, reach: 1.0, scale: 1.0, radius: 0.4, score: 35, from: 2, weight: 1.4, lunge: { range: 5, speed: 11, cd: 2.8 }, only: ['lab'], blood: [0x8a1610, 0x4a2a14], sfx: { attack: 'zombie_die', die: 'zombie_die' } },
   lb_pack: { name: 'Matilha', desc: 'Caca em grupo: cerca o jogador por varios lados', icon: 'paw', hp: 35, speed: 3.3, dmg: 9, rate: 0.6, reach: 0.95, scale: 0.9, radius: 0.35, score: 22, from: 2, weight: 1.5, group: 3, formation: { tag: 'pack', radius: 4, flank: true }, lunge: { range: 4, speed: 10, cd: 2.5 }, only: ['lab'], blood: [0x8a1610, 0x4a2a14], sfx: { attack: 'zombie_die', die: 'zombie_die' } },
   lb_signaler: { name: 'Sinalizador', desc: 'Marca o jogador e chama reforcos ao ser atacado', icon: 'flag', hp: 60, speed: 1.7, dmg: 8, rate: 1.0, reach: 0.95, scale: 1.0, score: 40, from: 4, weight: 0.7, summon: { cd: 6, n: 2, max: 4, windup: 0.8, types: ['lb_hunter', 'lb_pack'] }, mark: { t: 4, mul: 1.3 }, only: ['lab'], blood: [0xffc040, 0xd4a020], sfx: { die: 'zombie_die' } },
   lb_puppeteer: { name: 'Titereiro', desc: 'Controla inimigos proximos: aumenta velocidade e dano de aliados', icon: 'hood', hp: 75, speed: 1.4, dmg: 8, rate: 1.2, reach: 1.0, scale: 1.05, score: 55, from: 5, weight: 0.6, aura: { radius: 6, mul: 0.8, haste: 1.2, dmg: 1.15, ring: 0xb050ff }, only: ['lab'], blood: [0xb050ff, 0x4a1a6a], sfx: { die: 'eg_magic' } },
   lb_camouflaged: { name: 'Camuflado', desc: 'Invisivel ate atacar: embosca o jogador de perto', icon: 'ghost', hp: 45, speed: 2.4, dmg: 14, rate: 0.8, reach: 1.1, scale: 0.95, radius: 0.38, score: 38, from: 3, weight: 1.0, lunge: { range: 4, speed: 12, cd: 3.0, windup: 0.2 }, only: ['lab'], blood: [0x4a6a4a, 0x2a4a2a], sfx: { attack: 'zombie_die', die: 'zombie_die' } },
   lb_demolisher: { name: 'Demolidor', desc: 'Quebra obstaculos e destroi coberturas: ataque pesado em area', icon: 'fist', hp: 200, speed: 1.2, dmg: 25, rate: 1.5, reach: 1.6, scale: 1.4, radius: 0.65, score: 60, from: 6, weight: 0.5, lunge: { range: 4, speed: 8, cd: 4.0, smash: true, stun: 0.8 }, quake: { radius: 2.5, dmg: 18 }, only: ['lab'], blood: [0x6a6a6a, 0x4a4a4a], sfx: { attack: 'stomp', die: 'eg_rumble' } },
   lb_aerial: { name: 'Aereo Mutante', desc: 'Inimigo aereo: voa, dispara rajadas de acido e mergulha', icon: 'bat', hp: 70, speed: 2.8, dmg: 10, rate: 0.9, reach: 1.0, scale: 1.0, radius: 0.4, score: 45, from: 5, weight: 0.7, fly: true, hover: 1.5, strafe: true, lunge: { range: 6, speed: 12, cd: 3.5, windup: 0.4 }, spit: { range: 10, dmg: 8, cd: 2.2, color: 0x4aff4a, splat: '#2a6a2a', sfx: 'throw' }, only: ['lab'], blood: [0x4aff4a, 0x2a6a2a], sfx: { attack: 'zombie_die', die: 'zombie_die' } },
   // ---- Chefoes do Laboratorio (only: ['lab']) ----
   lb_colossa: { name: 'A Colossa Rainha', desc: 'Chefao: gigante, convoca matilha, golpes em area e regeneracao', icon: 'crown', hp: 2500, speed: 1.2, dmg: 42, rate: 1.5, reach: 2.6, scale: 2.8, score: 800, boss: true, bossKind: 'colossa', intro: 'A COLOSSA RAINHA DESPERTOU!', riseIntro: 1.6, blood: [0x8a3ad0, 0x4a1a6a], introSfx: 'eg_horn', treasure: 500 },
   lb_core: { name: 'O Nucleo Infectado', desc: 'Chefao: nucleo estacionario que dispara projeteis, invoca inimigos e gera campos de forca', icon: 'crown', hp: 2200, speed: 0, dmg: 0, rate: 1, reach: 1, scale: 2.2, radius: 1.2, score: 750, boss: true, bossKind: 'core', static: true, intro: 'O NUCLEO INFECTADO ATIVOU!', riseIntro: 1.8, blood: [0x4aff4a, 0x2a6a2a], introSfx: 'eg_horn', treasure: 480 },
   lb_abominable: { name: 'O Abominavel', desc: 'Chefao: bruto de forca, investidas devastadoras, ondas de choque e regeneracao', icon: 'crown', hp: 2800, speed: 1.3, dmg: 50, rate: 1.6, reach: 2.8, scale: 3.0, score: 900, boss: true, bossKind: 'abominable', intro: 'O ABOMINAVEL SURGIU DAS SOMBRAS!', riseIntro: 1.5, blood: [0x6a4a2a, 0x4a2a1a], introSfx: 'eg_horn', treasure: 550 },
   lb_exogeneral: { name: 'O Exo General', desc: 'Chefao: comandante blindado, invoca reforcos, enfurece a horda e dispara rajadas de energia', icon: 'crown', hp: 2400, speed: 1.35, dmg: 44, rate: 1.2, reach: 2.4, scale: 2.6, score: 850, boss: true, bossKind: 'exogeneral', plating: 0.5, intro: 'O EXO GENERAL TOMOU O COMANDO!', riseIntro: 1.4, blood: [0x8a8a90, 0x4aff4a], introSfx: 'eg_horn', treasure: 520 },
};
export const ENEMY_ORDER = ['walker', 'brute', 'spider', 'bat', 'runner', 'spitter', 'bloater', 'armored', 'dog', 'summoner', 'spore', 'reaper', 'wasp', 'specter', 'boss', 'devourer', 'mechworker', 'guardian', 'general', 'mummy', 'anubis', 'archer', 'scarab', 'serpent', 'priest', 'phantom', 'construct', 'scorpion', 'jackal', 'portal', 'skeleton', 'chariot', 'horus', 'crocling', 'bastetclone', 'rm_legion', 'rm_centurion', 'rm_archer', 'rm_gladiator', 'rm_hound', 'rm_praetor', 'rm_beast', 'rm_spirit', 'rm_standard', 'rm_engineer', 'rm_turret', 'rm_chariot', 'rm_eagle', 'rm_catapult', 'rm_elephant', 'pharaoh', 'sobek', 'bastet', 'sphinx', 'lb_specter', 'lb_tremor', 'lb_launcher', 'lb_suppressor', 'lb_corrosive', 'lb_incendiary', 'lb_freezer', 'lb_hunter', 'lb_pack', 'lb_signaler', 'lb_puppeteer', 'lb_camouflaged', 'lb_demolisher', 'lb_aerial', 'lb_colossa', 'lb_core', 'lb_abominable', 'lb_exogeneral'];


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
  {
    id: 'gatito', name: 'Gatito', role: 'Assalto',
    skin: 0xff8a00, shirt: 0xd41f1f, pants: 0x1a1a1a, sleeve: 0xff8a00, hands: 0x1e1e1e, boots: 0x161616, noFace: true,
    extras: [
      // orelhas de gato com miolo rosa
      ...mirror(['head', 0.19, 0.66, -0.04, 0.16, 0.18, 0.1, 0xff8a00]),
      ...mirror(['head', 0.19, 0.65, 0.015, 0.08, 0.1, 0.012, 0xf4a6b8]),
      // bandana vermelha
      ['head', 0, 0.5, 0, 0.6, 0.08, 0.6, 0xd41f1f],
      ['head', 0, 0.44, -0.33, 0.1, 0.16, 0.06, 0xb01818],
      // listras de tigre na testa e nas laterais
      ['head', 0, 0.42, 0.285, 0.05, 0.08, 0.012, 0x111111],
      ...mirror(['head', 0.1, 0.43, 0.285, 0.04, 0.06, 0.012, 0x111111]),
      ...mirror(['head', 0.285, 0.34, 0.05, 0.012, 0.05, 0.2, 0x111111]),
      ...mirror(['head', 0.285, 0.22, 0.05, 0.012, 0.05, 0.16, 0x111111]),
      // olhos amarelos com pupila e sobrancelha brava
      ...mirror(['head', 0.13, 0.33, 0.285, 0.12, 0.1, 0.012, 0xffd700]),
      ...mirror(['head', 0.12, 0.33, 0.292, 0.04, 0.09, 0.012, 0x0a0a0a]),
      ...mirror(['head', 0.13, 0.4, 0.292, 0.15, 0.03, 0.012, 0x111111, 0, -0.3]),
      // focinho branco, nariz rosa, bigodes
      ['head', 0, 0.16, 0.3, 0.3, 0.14, 0.05, 0xf4f4f4],
      ['head', 0, 0.22, 0.33, 0.08, 0.05, 0.02, 0xe86a8a],
      ['head', 0, 0.12, 0.33, 0.1, 0.02, 0.02, 0x111111],
      ...mirror(['head', 0.2, 0.17, 0.31, 0.12, 0.012, 0.012, 0x111111]),
      // colete tático preto com emblema de pata
      ['torso', 0, 0.3, 0.19, 0.48, 0.42, 0.03, 0x1a1a1a],
      ['torso', 0, 0.3, -0.19, 0.48, 0.42, 0.03, 0x1a1a1a],
      ['torso', 0, 0.28, 0.21, 0.12, 0.1, 0.012, 0xffd700],
      ...mirror(['torso', 0.08, 0.37, 0.21, 0.05, 0.05, 0.012, 0xffd700]),
      ['torso', 0, 0.025, 0, 0.58, 0.06, 0.38, 0x2a2a2a],
      // cauda listrada
      ['torso', 0, 0.05, -0.26, 0.08, 0.08, 0.16, 0xff8a00],
      ['torso', 0, 0.0, -0.36, 0.08, 0.08, 0.08, 0x111111],
      ['torso', 0, -0.05, -0.44, 0.08, 0.08, 0.1, 0xff8a00],
      // listras nos braços, luvas
      ...mirror(['armL', 0, -0.15, 0, 0.19, 0.03, 0.19, 0x111111]),
      ...mirror(['armL', 0, -0.28, 0, 0.19, 0.03, 0.19, 0x111111]),
      // joelheiras vermelhas e listras nas pernas
      ...mirror(['legL', 0, -0.22, 0.125, 0.2, 0.12, 0.04, 0xd41f1f]),
      ...mirror(['legL', 0.115, -0.1, 0, 0.012, 0.04, 0.2, 0xff8a00]),
    ],
  },
  {
    id: 'patito', name: 'Patito', role: 'Especialista',
    skin: 0xf6f6f6, shirt: 0xffd600, pants: 0x34363c, sleeve: 0xffd600, hands: 0x161616, boots: 0x161616, noFace: true,
    extras: [
      // bico laranja largo de pato (superior e inferior)
      ['head', 0, 0.2, 0.37, 0.36, 0.08, 0.2, 0xff9800],
      ['head', 0, 0.13, 0.34, 0.3, 0.06, 0.14, 0xe67e00],
      ...mirror(['head', 0.06, 0.225, 0.47, 0.03, 0.012, 0.03, 0xb85c00]),
      // olhos grandes e sobrancelhas marotas
      ...mirror(['head', 0.13, 0.34, 0.285, 0.12, 0.13, 0.012, 0xffffff]),
      ...mirror(['head', 0.11, 0.33, 0.292, 0.06, 0.09, 0.012, 0x0a0a0a]),
      ...mirror(['head', 0.13, 0.44, 0.292, 0.16, 0.035, 0.012, 0x0a0a0a, 0, -0.3]),
      // tufo de penas no topo
      ['head', 0, 0.66, 0.1, 0.06, 0.12, 0.06, 0xf6f6f6],
      ['head', 0.04, 0.64, 0.04, 0.05, 0.08, 0.05, 0xf6f6f6],
      // boné amarelo virado para trás
      ['head', 0, 0.55, -0.02, 0.6, 0.1, 0.6, 0xffd600],
      ['head', 0, 0.53, -0.38, 0.46, 0.04, 0.18, 0xd4a800],
      ['head', 0, 0.61, -0.02, 0.06, 0.03, 0.06, 0xd4a800],
      // colete preto com símbolo de pato
      ['torso', 0, 0.3, 0.19, 0.48, 0.42, 0.03, 0x1a1a1a],
      ['torso', 0, 0.3, -0.19, 0.48, 0.42, 0.03, 0x1a1a1a],
      ['torso', 0, 0.3, 0.21, 0.14, 0.12, 0.012, 0xffd600],
      ['torso', 0.09, 0.3, 0.215, 0.06, 0.03, 0.012, 0xff9800],
      ['torso', 0, 0.025, 0, 0.58, 0.06, 0.38, 0x2a2a2a],
      ...mirror(['torso', 0.2, 0.05, 0.2, 0.1, 0.1, 0.04, 0x3a3a3a]),
      // mochila tática e rabinho de penas
      ['torso', 0, 0.3, -0.29, 0.42, 0.42, 0.16, 0x2a2c30],
      ['torso', 0, 0.16, -0.38, 0.3, 0.1, 0.03, 0xffd600],
      ['torso', 0, 0.02, -0.24, 0.16, 0.06, 0.1, 0xf6f6f6],
      // joelheiras metálicas e faixa amarela nas botas
      ...mirror(['legL', 0, -0.22, 0.125, 0.2, 0.12, 0.04, 0x9aa0a8]),
      ...mirror(['legL', 0, -0.36, 0, 0.23, 0.04, 0.25, 0xffd600]),
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
    theme: 'city', ambient: 'city', weather: 'hordealarm', boss: 'devourer', unlock: 1, particles: ['dust', 'ash'],
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
    theme: 'factory', ambient: 'factory', weather: 'overload', boss: 'mechworker', unlock: 5, particles: ['sparks', 'steam'],
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
    theme: 'forest', ambient: 'forest', weather: 'toxicfog', boss: 'guardian', unlock: 10, particles: ['spores'],
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
    theme: 'military', ambient: 'military', weather: 'alarm', boss: 'general', unlock: 15, particles: ['dust'],
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
    theme: 'graveyard', ambient: 'graveyard', weather: 'fog', boss: 'boss', unlock: 1, particles: ['ash', 'motes'],
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
  // ---------------------------------------------------------------- arenas da expansão
  {
    id: 'coliseu', name: 'Coliseu da Arena', desc: 'Areia, arquibancadas lotadas, portões monumentais e túneis por onde a horda sobe.', floor: 'colosseum',
    theme: 'colosseum', ambient: 'colosseum', weather: 'trial', boss: 'boss', unlock: 3, spawnShare: 0.45,
    diff: { label: 'Alta', tier: 2, hp: 1.15, speed: 1.05, count: 1.1 }, eventName: 'Prova de sobrevivência',
    particles: ['sand', 'dust'],
    tip: 'Fique de olho nas luzes vermelhas: os espinhos sobem. Na prova, cada abate vale o dobro.',
    light: { sky: 0x8a9ab0, fog: 0xa89878, sun: 0xffe8c0, sunI: 2.3, hemi: 1.45 },
    map: makeMap(46, 32, '#', [[21, 0, 4, 'h'], [21, 31, 4, 'h'], [0, 14, 4, 'v'], [45, 14, 4, 'v']], (m) => {
      m.rect(1, 1, 44, 30, 'a');
      // arquibancadas em volta de toda a arena, com cantos arredondados
      m.rect(1, 1, 44, 2, 'Ø'); m.rect(1, 29, 44, 30, 'Ø'); m.rect(1, 3, 2, 28, 'Ø'); m.rect(43, 3, 44, 28, 'Ø');
      for (const [x, y] of [[3, 3], [42, 3], [3, 28], [42, 28], [4, 3], [41, 3], [4, 28], [41, 28], [3, 4], [42, 4], [3, 27], [42, 27]]) m.put(x, y, 'Ø');
      // passagens dos quatro portões monumentais (a grade sobe quando a horda entra)
      m.rect(21, 1, 24, 1, 'a'); m.rect(21, 30, 24, 30, 'a'); m.rect(1, 14, 1, 17, 'a'); m.rect(44, 14, 44, 17, 'a');
      for (let k = 21; k <= 24; k++) { m.put(k, 2, 'Ÿ'); m.put(k, 29, 'Ÿ'); }
      for (let k = 14; k <= 17; k++) { m.put(2, k, 'Ÿ'); m.put(43, k, 'Ÿ'); }
      // centro em mosaico, aberto para o chefão
      m.rect(17, 11, 28, 20, 'ù');
      // colunas romanas e estátuas de gladiadores
      for (const [x, y] of [[8, 6], [15, 5], [30, 5], [37, 6], [8, 25], [15, 26], [30, 26], [37, 25], [6, 11], [6, 20], [39, 11], [39, 20]]) m.put(x, y, 'Ñ');
      for (const [x, y] of [[12, 9], [33, 9], [12, 22], [33, 22]]) m.put(x, y, 'Æ');
      // bandeiras na frente das arquibancadas
      for (const [x, y] of [[7, 3], [13, 3], [32, 3], [38, 3], [7, 28], [13, 28], [32, 28], [38, 28]]) m.put(x, y, 'ß');
      // armadilhas de espinhos em anel e túneis subterrâneos
      for (const [x, y] of [[17, 10], [28, 10], [17, 21], [28, 21], [22, 8], [23, 23], [13, 15], [32, 16], [10, 12], [35, 19]]) m.put(x, y, 'Œ');
      for (const [x, y] of [[9, 16], [36, 15], [20, 6], [25, 25]]) m.put(x, y, 'Þ');
      // ruínas de pedra (blocos modulares: inteiro, danificado e destruído) como cobertura
      const sw = modCh('stone', 'wall'); const sd = modCh('stone', 'dmg'); const sr = modCh('stone', 'ruin');
      m.put(15, 9, sw); m.put(16, 9, sd); m.put(30, 22, sw); m.put(29, 22, sd);
      for (const [x, y] of [[10, 19], [35, 12], [19, 24], [26, 7]]) m.put(x, y, sr);
      // barris, caixas e o totem médico
      for (const [x, y] of [[5, 8], [40, 23]]) m.put(x, y, 'x');
      for (const [x, y] of [[5, 23], [40, 8], [19, 27], [26, 4]]) m.put(x, y, 'X');
      m.put(14, 18, 'Ú'); m.put(31, 13, 'Ú');
    }),
  },
  {
    id: 'lab', name: 'Laboratório de Pesquisa', desc: 'Salas de contenção, tanques biológicos e portas automáticas: os experimentos fugiram.', floor: 'lab',
    theme: 'lab', ambient: 'lab', weather: 'breach', boss: 'devourer', unlock: 7, spawnShare: 0.25, maxLights: 8, lightMul: 1,
    diff: { label: 'Muito alta', tier: 3, hp: 1.25, speed: 1.07, count: 1.18 }, eventName: 'Quebra de contenção',
    particles: ['sparks', 'steam'],
    tip: 'Na quebra de contenção, segure o painel holográfico do átrio: tranca as portas e sela as cápsulas.', lampI: 10,
    light: { sky: 0x141c22, fog: 0x1a262c, sun: 0xd0e8ff, sunI: 1.45, hemi: 1.05 },
    map: makeMap(46, 32, '#', [[21, 0, 4, 'h'], [21, 31, 4, 'h'], [0, 14, 4, 'v'], [45, 14, 4, 'v']], (m) => {
      m.rect(1, 1, 44, 30, 'ò');
      const W = 'Ë';
      const room = (x0, y0, x1, y1) => { m.rect(x0, y0, x1, y0, W); m.rect(x0, y1, x1, y1, W); m.rect(x0, y0, x0, y1, W); m.rect(x1, y0, x1, y1, W); };
      // quatro salas de pesquisa nos cantos, cada uma com duas portas automáticas
      room(2, 2, 12, 9); room(33, 2, 43, 9); room(2, 22, 12, 29); room(33, 22, 43, 29);
      for (const [x, y] of [[7, 9], [12, 5], [38, 9], [33, 5], [7, 22], [12, 26], [38, 22], [33, 26]]) m.put(x, y, 'Í');
      // NO: tanques biológicos e bancadas
      for (const x of [4, 6, 8, 10]) m.put(x, 3, 'Ö');
      m.put(5, 6, 'Î'); m.put(9, 6, 'Î');
      // NE: cápsulas de contenção
      for (const x of [35, 37, 39, 41]) m.put(x, 3, 'Ü');
      m.put(36, 6, 'Î'); m.put(40, 6, 'Î');
      // SO: almoxarifado químico com vazamento
      for (const [x, y] of [[4, 24], [4, 27], [10, 27]]) m.put(x, y, '@');
      m.rect(6, 25, 8, 26, '~');
      m.put(10, 24, 'Î');
      // SE: cápsulas e tanques
      for (const x of [35, 39]) m.put(x, 23, 'Ü');
      for (const x of [37, 41]) m.put(x, 28, 'Ö');
      m.put(36, 26, 'Î');
      // corredores técnicos com tubulação e divisórias de vidro (blocos modulares)
      const gw = modCh('glass', 'wall'); const gd = modCh('glass', 'dmg');
      for (const x of [15, 16, 29, 30]) { m.put(x, 9, 'Ï'); m.put(x, 22, 'Ï'); }
      for (const [x, y] of [[18, 9], [19, 9], [26, 9], [27, 9], [18, 22], [19, 22], [26, 22], [27, 22]]) m.put(x, y, gw);
      m.put(20, 9, gd); m.put(25, 22, gd);
      // átrio: painel holográfico (contenção), totem médico, colunas e plataformas com rampa
      m.put(22, 15, 'Ì'); m.put(24, 17, 'Ú');
      const mc = modCh('metal', 'col'); const mp = modCh('metal', 'plat'); const mr = modCh('metal', 'ramp');
      for (const [x, y] of [[17, 12], [28, 12], [17, 19], [28, 19]]) m.put(x, y, mc);
      m.rect(14, 12, 15, 13, mp); m.put(14, 14, mr); m.rect(30, 18, 31, 19, mp); m.put(31, 17, mr);
      // cobertura: bancadas, concreto danificado e entulho
      for (const [x, y] of [[20, 13], [25, 18], [9, 15], [36, 16]]) m.put(x, y, 'Î');
      m.put(19, 17, modCh('concrete', 'dmg')); m.put(26, 14, modCh('concrete', 'ruin'));
      // portais de onda (experimento de teletransporte) e tanques químicos no corredor
      m.put(5, 15, 'Ô'); m.put(40, 16, 'Ô');
      m.put(13, 18, '@'); m.put(32, 13, '@');
    }),
  },
  {
    id: 'templo', name: 'Templo Antigo', desc: 'Pedra, hieróglifos e armadilhas: dardos, lâminas, portais mágicos e uma câmara escondida.', floor: 'temple',
    theme: 'temple', ambient: 'temple', weather: 'curse', boss: ['pharaoh', 'sobek', 'bastet', 'sphinx'], unlock: 12, spawnShare: 0.3, maxLights: 8,
    diff: { label: 'Extrema', tier: 4, hp: 1.38, speed: 1.1, count: 1.28 }, eventName: 'Maldição do templo',
    particles: ['motes', 'embers'],
    tip: 'Atraia a horda para as placas de pressão e as lâminas. A alavanca abre a câmara do desafio ao norte.', lampI: 8,
    light: { sky: 0x18120c, fog: 0x2a2016, sun: 0xffc890, sunI: 1.25, hemi: 0.9 },
    map: makeMap(46, 32, '#', [[6, 0, 3, 'h'], [37, 0, 3, 'h'], [21, 31, 4, 'h'], [0, 14, 4, 'v'], [45, 14, 4, 'v']], (m) => {
      m.rect(1, 1, 44, 30, 'ð');
      // câmara de desafio ao norte, atrás das portas secretas
      m.rect(17, 1, 17, 5, 'Ð'); m.rect(28, 1, 28, 5, 'Ð'); m.rect(17, 5, 28, 5, 'Ð');
      m.put(22, 5, 'Ä'); m.put(23, 5, 'Ä');
      m.put(22, 2, 'À');
      m.put(19, 2, 'X'); m.put(26, 2, 'X'); m.put(20, 3, 'Õ'); m.put(25, 3, 'Õ');
      m.put(18, 4, 'ê'); m.put(27, 4, 'ê');
      // santuário: muros de arenito com faixas de hieróglifos e quatro entradas
      m.rect(12, 8, 33, 8, 'Ð'); m.rect(12, 24, 33, 24, 'Ð'); m.rect(12, 8, 12, 24, 'Ð'); m.rect(33, 8, 33, 24, 'Ð');
      for (const x of [13, 14, 31, 32]) { m.put(x, 8, 'Ê'); m.put(x, 24, 'Ê'); }
      m.rect(21, 8, 24, 8, 'ð'); m.rect(21, 24, 24, 24, 'ð'); m.rect(12, 14, 12, 17, 'ð'); m.rect(33, 14, 33, 17, 'ð');
      // lançadores de dardos na parede norte (atiram para dentro) e placas de pressão na linha de tiro
      for (const x of [16, 19, 26, 29]) m.put(x, 8, 'Å');
      for (const [x, y] of [[16, 12], [19, 14], [26, 14], [29, 12]]) m.put(x, y, 'Ç');
      // pilares, sarcófagos e lâminas giratórias
      for (const [x, y] of [[15, 10], [30, 10], [15, 22], [30, 22], [19, 18], [26, 18]]) m.put(x, y, 'Ó');
      for (const [x, y] of [[16, 20], [29, 20], [22, 21]]) m.put(x, y, 'Õ');
      for (const [x, y] of [[22, 11], [14, 16], [31, 15]]) m.put(x, y, 'Ý');
      // corredor do norte guardado por lâminas e a alavanca das portas secretas
      m.put(19, 6, 'Ý'); m.put(26, 7, 'Ý');
      m.put(14, 6, 'Â');
      // pátio externo: obeliscos, portais mágicos (par), portais de onda e ruínas modulares de arenito
      for (const [x, y] of [[8, 9], [37, 9], [8, 22], [37, 22]]) m.put(x, y, 'Ò');
      m.put(5, 16, 'Ã'); m.put(40, 15, 'Ã');
      for (const [x, y] of [[9, 4], [36, 27], [9, 27]]) m.put(x, y, 'Ô');
      const sw = modCh('sand', 'wall'); const sd = modCh('sand', 'dmg'); const sr = modCh('sand', 'ruin'); const sc = modCh('sand', 'col');
      for (const [x, y] of [[4, 7], [41, 7], [4, 24], [41, 24]]) m.put(x, y, sc);
      m.put(3, 11, sw); m.put(3, 12, sd); m.put(42, 19, sw); m.put(42, 20, sd);
      for (const [x, y] of [[10, 20], [35, 11], [6, 28], [39, 3]]) m.put(x, y, sr);
      // tochas nos corredores
      for (const [x, y] of [[20, 9], [25, 9], [11, 13], [34, 13], [11, 18], [34, 18], [20, 23], [25, 23]]) m.put(x, y, 'ê');
      for (const [x, y] of [[6, 12], [39, 19]]) m.put(x, y, 'X');
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
  'G recarrega a arma (J2: H). Trocar de arma cancela a recarga; a escopeta carrega cartucho por cartucho e você pode atirar no meio.',
  'Aperte de novo a mesma tecla numérica para alternar entre as armas do grupo: 7 = lança-chamas, criogênico e ácido.',
  'Gelo congela inimigos comuns; chefões só ficam mais lentos. Ácido derrete o escudo do Blindado.',
  'A granada EMP desliga o Operário Mutante por 4 s e tira a blindagem dele.',
  'Torres posicionáveis têm bateria de 90 s: coloque onde a horda vai passar.',
  'O fogo detona barris e queima caixas de madeira: cuidado onde você aponta o lança-chamas.',
];
