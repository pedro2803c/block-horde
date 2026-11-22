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
};

// Armas das montarias (registradas em WEAPONS)
const MOUNT_WEAPONS = {
  m_mount_mg:     { name: 'Metralhadora', kind: 'gun',    dmg: 16, range: 24, rate: 0.10, pellets: 1, spread: 0.03, mag: Infinity, ammo: Infinity, color: 0xffd040, sound: 'shot_lmg', heavy: true, kick: 0.05 },
  m_mount_fork:   { name: 'Garfos',       kind: 'gun',    dmg: 34, range: 5,  rate: 0.55, pellets: 1, spread: 0.12, mag: Infinity, ammo: Infinity, color: 0xffc107, sound: 'melee_hit', heavy: true },
  m_mount_tusk:   { name: 'Presas',       kind: 'gun',    dmg: 40, range: 4,  rate: 0.50, pellets: 1, spread: 0.15, mag: Infinity, ammo: Infinity, color: 0xd8b080, sound: 'melee_hit', heavy: true },
  m_mount_cannon: { name: 'Canhão',       kind: 'rocket', dmg: 95, range: 32, rate: 1.30, speed: 20, pellets: 1, spread: 0, mag: Infinity, ammo: Infinity, color: 0xff8020, sound: 'shot_rifle', heavy: true, kick: 0.4 },
  m_mount_lance:  { name: 'Lança',        kind: 'gun',    dmg: 46, range: 7,  rate: 0.65, pellets: 1, spread: 0.08, mag: Infinity, ammo: Infinity, color: 0xffe080, sound: 'shot_rifle', heavy: true },
  m_mount_plasma: { name: 'Plasma',       kind: 'bolt',   dmg: 24, range: 22, rate: 0.18, speed: 26, pellets: 1, spread: 0, mag: Infinity, ammo: Infinity, color: 0x40ffb0, sound: 'shot_plasma', heavy: false },
  m_mount_roar:   { name: 'Rugido',       kind: 'flame',  dmg: 10, range: 9,  rate: 0.14, pellets: 1, spread: 0.05, mag: Infinity, ammo: Infinity, color: 0xffb040, sound: 'flame', heavy: false },
};

for (const m of Object.values(MOUNTS)) {
  m.maxHp = m.hp;
}

for (const [id, w] of Object.entries(MOUNT_WEAPONS)) {
  if (!WEAPONS[id]) WEAPONS[id] = w;
}

// helpers
export function isMountWeapon(id) { return !!MOUNT_WEAPONS[id]; }
export function mountForArena(arenaId) { return MOUNTS[arenaId] || null; }
export function mountDef(id) { return MOUNTS[id] || null; }
export function allMountIds() { return Object.keys(MOUNTS); }
export function mountWeaponDef(id) { return MOUNT_WEAPONS[id] || null; }

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
