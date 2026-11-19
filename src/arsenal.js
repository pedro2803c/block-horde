// Expansão do arsenal do Block Horde (métodos misturados na classe Game):
//  - carregador e recarga (pente inteiro ou cartucho por cartucho)
//  - efeitos elementais nos inimigos: fogo (queima), gelo (lentidão e congelamento), ácido (corrosão) e EMP
//  - áreas no chão criadas pelos jogadores: fogo, poça ácida, nuvem tóxica e gelo
//  - armas novas: lança-chamas (cone), lança-granadas (arco com ricochete), plasma/criogênico (projéteis) e lança-ácido
//  - granadas especiais (EMP, incendiária, congelante, tóxica)
//  - armadilhas e torres posicionáveis com durabilidade, bateria e alcance
import { WEAPONS, TRAPS, RESIST } from './data.js';
import { TRAP_MODELS } from './items.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const compact = (arr, keep) => {
  let n = 0;
  for (let i = 0; i < arr.length; i++) if (keep(arr[i])) arr[n++] = arr[i];
  arr.length = n;
};
const MAX_HAZARDS = 40;
const HAZARD_COLORS = {
  fire: [0xff7a1a, 0xffc040, 0xff4010],
  acid: [0x8aff4a, 0x5ac82a, 0xc8ff6a],
  toxic: [0x9ad04a, 0x6a9a2a, 0xb8e060],
  frost: [0xc8f0ff, 0x8ad8ff, 0xffffff],
};
// partes de madeira que pegam fogo
const WOODEN = new Set(['crate', 'woodblock', 'logs', 'pallet', 'signpost', 'cabin', 'banner']);
export const WALK_TRAPS = new Set(['mine', 'proxmine', 'spikes']);

export const ArsenalMixin = {
  // ------------------------------------------------------------------ munição: carregador + reserva
  usable(p, id) {
    if (id === 'pistol') return true;
    const w = WEAPONS[id];
    return (p.ammo[id] || 0) + (w.mag ? p.clip[id] || 0 : 0) > 0;
  },
  // passa munição da reserva para o carregador (pistola: reserva infinita)
  fillClip(p, id) {
    const w = WEAPONS[id];
    if (!w.mag) return;
    const need = w.mag - (p.clip[id] || 0);
    if (need <= 0) return;
    const take = Math.min(need, p.ammo[id] || 0);
    p.clip[id] = (p.clip[id] || 0) + take;
    p.ammo[id] -= take;
  },
  startReload(p) {
    const id = p.weapon;
    const w = WEAPONS[id];
    if (!w.mag || p.reloadT > 0 || !p.alive) return false;
    if ((p.clip[id] || 0) >= w.mag || !(p.ammo[id] > 0)) return false;
    const fast = (p.energyT > 0 ? 0.7 : 1) * (p.exoT > 0 ? 0.85 : 1);
    p.reloadW = id;
    p.reloadMax = w.reload * fast;
    p.reloadT = p.reloadMax;
    this.audio.play(w.shell ? 'pump' : 'reload_out', { volume: 0.5, pos: p.pos, rate: w.shell ? 1.3 : 1 });
    return true;
  },
  updateReload(p, dt) {
    if (!(p.reloadT > 0)) return;
    if (p.weapon !== p.reloadW || !p.alive) {
      p.reloadT = 0;
      return;
    }
    p.reloadT -= dt;
    if (p.reloadT > 0) return;
    const id = p.reloadW;
    const w = WEAPONS[id];
    p.reloadT = 0;
    if (w.shell) {
      // escopeta: um cartucho por vez (atirar interrompe)
      if (p.ammo[id] > 0) {
        p.clip[id] = (p.clip[id] || 0) + 1;
        p.ammo[id]--;
      }
      this.audio.play('reload_in', { volume: 0.35, pos: p.pos, rate: 1.5 });
      if (p.clip[id] < w.mag && p.ammo[id] > 0) p.reloadT = p.reloadMax;
      else this.audio.play('pump', { volume: 0.5, pos: p.pos });
    } else {
      this.fillClip(p, id);
      this.audio.play('reload_in', { volume: 0.5, pos: p.pos });
    }
  },
  // munição mostrada no HUD: "carregador / reserva"
  ammoText(p, id) {
    const w = WEAPONS[id];
    const res = id === 'pistol' ? '∞' : String(p.ammo[id] || 0);
    return w.mag ? `${p.clip[id] || 0} / ${res}` : res;
  },

  // ------------------------------------------------------------------ efeitos elementais
  resist(z, el) {
    return RESIST[z.type]?.[el] ?? 1;
  },
  applyStatus(z, el, amt, src) {
    if (!z.alive) return;
    const r = this.resist(z, el) * (z.def.boss && (el === 'poison' || el === 'acid') ? 0.45 : 1);
    if (el === 'fire') {
      z.burnDps = Math.max(z.burnT > 0 ? z.burnDps : 0, amt.dps * r);
      z.burnT = Math.max(z.burnT || 0, amt.t);
      z.burnSrc = src;
    } else if (el === 'acid') {
      z.corrodeDps = Math.max(z.corrodeT > 0 ? z.corrodeDps : 0, amt.dps * r);
      z.corrodeT = Math.max(z.corrodeT || 0, amt.t);
      z.corrodeSrc = src;
    } else if (el === 'poison') {
      z.poisonDps = Math.max(z.poisonT > 0 ? z.poisonDps : 0, amt.dps * r);
      z.poisonT = Math.max(z.poisonT || 0, amt.t);
      z.poisonSrc = src;
    } else if (el === 'ice') {
      if (z.frozenT > 0) return;
      // chefões nunca congelam: ficam no máximo 36% mais lentos
      const cap = z.def.boss ? 60 : 100;
      z.chill = Math.min(cap, (z.chill || 0) + amt * r);
      if (!z.def.boss && z.chill >= 100) {
        z.frozenT = 2.2 * Math.min(1.3, r);
        z.chill = 0;
        this.audio.play('freeze', { volume: 0.45, pos: z.pos, rate: rand(0.9, 1.2) });
      }
    } else if (el === 'emp') {
      // mecânicos desligam (e perdem a blindagem); energia (espectro) sofre mais; o resto só atordoa
      const mech = RESIST[z.type]?.mech;
      const t = mech ? 4 : z.type === 'specter' ? 2.5 : 1.1;
      if (mech) z.empT = Math.max(z.empT || 0, t);
      z.stunT = Math.max(z.stunT || 0, z.def.boss && !mech ? 0.6 : t);
    }
  },
  // retorna o multiplicador de velocidade; -1 se o inimigo morreu no dano contínuo
  updateStatus(z, dt) {
    let mul = 1;
    if (z.burnT > 0 || z.corrodeT > 0 || z.poisonT > 0) {
      z.stTick = (z.stTick || 0) + dt;
      if (z.stTick >= 0.5) {
        z.stTick = 0;
        if (z.burnT > 0) this.damageZombie(z, z.burnDps * 0.5, 0, 0, z.burnSrc, 0, true);
        if (z.alive && z.corrodeT > 0) this.damageZombie(z, z.corrodeDps * 0.5, 0, 0, z.corrodeSrc, 0, true);
        if (z.alive && z.poisonT > 0) this.damageZombie(z, z.poisonDps * 0.5, 0, 0, z.poisonSrc, 0, true);
        if (!z.alive) return -1;
      }
    }
    const top = z.def.fly ? z.flyY || 1.4 : 1.6 * z.scale;
    if (z.burnT > 0) {
      z.burnT -= dt;
      if (Math.random() < dt * 16) this.parts.spawn(z.pos.x + rand(-0.3, 0.3), rand(0.4, top), z.pos.z + rand(-0.3, 0.3), rand(-0.4, 0.4), rand(1.5, 3), rand(-0.4, 0.4), rand(0.07, 0.14), pick(HAZARD_COLORS.fire), 0.4, -1.5, 2);
      mul *= 1.12; // em chamas, correm desesperados
    }
    if (z.corrodeT > 0) {
      z.corrodeT -= dt;
      if (Math.random() < dt * 10) this.parts.spawn(z.pos.x + rand(-0.3, 0.3), rand(0.3, top), z.pos.z + rand(-0.3, 0.3), 0, rand(-0.5, 0.5), 0, 0.06, pick(HAZARD_COLORS.acid), 0.6, 6, 2);
    }
    if (z.poisonT > 0) {
      z.poisonT -= dt;
      if (Math.random() < dt * 8) this.parts.spawn(z.pos.x + rand(-0.3, 0.3), rand(0.4, top), z.pos.z + rand(-0.3, 0.3), 0, rand(0.2, 0.8), 0, 0.07, 0x8aff4a, 0.5, 0, 2);
    }
    if (z.chill > 0) {
      z.chill = Math.max(0, z.chill - dt * 14);
      mul *= 1 - (z.chill / 100) * 0.6;
      if (Math.random() < dt * 6) this.parts.spawn(z.pos.x + rand(-0.3, 0.3), rand(0.3, top), z.pos.z + rand(-0.3, 0.3), 0, 0.3, 0, 0.05, 0xd8f4ff, 0.5, 1, 2);
    }
    if (z.frozenT > 0) {
      z.frozenT -= dt;
      mul = 0;
      z.attackCd = Math.max(z.attackCd, 0.2);
      if (z.frozenT <= 0) {
        // o gelo estilhaça
        for (let k = 0; k < 10; k++) this.parts.spawn(z.pos.x, rand(0.4, top), z.pos.z, rand(-3, 3), rand(1, 3), rand(-3, 3), rand(0.06, 0.12), pick(HAZARD_COLORS.frost), 0.6, 14, 2);
        this.audio.play('glass', { volume: 0.3, pos: z.pos, rate: 1.4 });
      }
    }
    if (z.empT > 0) {
      z.empT -= dt;
      mul = 0;
      if (Math.random() < dt * 14) this.parts.spawn(z.pos.x + rand(-0.4, 0.4), rand(0.6, top), z.pos.z + rand(-0.4, 0.4), rand(-2, 2), rand(0, 2), rand(-2, 2), 0.05, pick([0x40c8ff, 0xffffff]), 0.25, 0, 2);
    }
    if (z.spikeT > 0) {
      z.spikeT -= dt;
      mul *= 0.5;
    }
    return mul;
  },
  // cubos de gelo em volta do congelado; brilho azul no desligado pelo EMP
  drawStatus(G, z) {
    if (!z.alive) return;
    if (z.frozenT > 0) {
      const h = (z.def.fly ? 0.9 : 1.7) * z.scale;
      const y0 = z.def.fly ? (z.flyY || 1.4) - 0.4 : 0;
      for (let k = 0; k < 4; k++) {
        const a = k * 1.57 + z.strafe;
        G.box(z.pos.x + Math.sin(a) * z.radius * 0.8, y0 + h * (0.3 + (k % 2) * 0.35), z.pos.z + Math.cos(a) * z.radius * 0.8, 0.32 * z.scale, h * 0.45, 0.32 * z.scale, k % 2 ? 0xc8f0ff : 0x8ad8ff, a);
      }
    } else if (z.chill > 30) G.box(z.pos.x, 0.03, z.pos.z, z.radius * 2.2, 0.02, z.radius * 2.2, 0x8ad8ff, z.strafe);
  },

  // ------------------------------------------------------------------ áreas no chão (feitas pelo time: não ferem jogadores)
  addHazard(kind, x, z, r, life, dps, owner) {
    for (const h of this.hazards) if (h.kind === kind && Math.hypot(h.x - x, h.z - z) < r * 0.6) {
      h.life = Math.max(h.life, life);
      h.max = Math.max(h.max, h.life);
      h.r = Math.max(h.r, r);
      return h;
    }
    if (this.hazards.length >= MAX_HAZARDS) this.hazards.shift();
    const h = { kind, x, z, r, life, max: life, dps, tick: 0, owner, seed: Math.random() * 9 };
    this.hazards.push(h);
    const A = this.arena;
    // marcas permanentes no chão só para ácido (mancha pequena) e fogo (chamuscado); gelo e veneno somem com a área
    if (kind === 'acid') A.splat(x, z, r * 0.45, '#4a8a1a', 0.35);
    else if (kind === 'fire') A.scorch(x, z, r * 0.7);
    return h;
  },
  updateHazards(dt) {
    for (const h of this.hazards) {
      h.life -= dt;
      h.tick -= dt;
      if (h.tick <= 0) {
        h.tick = 0.5;
        for (const z of this.zombies) {
          if (!z.alive) continue;
          if ((h.kind === 'fire' || h.kind === 'acid' || h.kind === 'frost') && z.def.fly) continue; // voadores passam por cima
          if (Math.hypot(z.pos.x - h.x, z.pos.z - h.z) > h.r + z.radius * 0.5) continue;
          if (h.kind === 'fire') {
            this.damageZombie(z, h.dps * 0.5, 0, 0, h.owner, 0, true);
            this.applyStatus(z, 'fire', { dps: 8, t: 2 }, h.owner);
          } else if (h.kind === 'acid') {
            this.damageZombie(z, h.dps * 0.5, 0, 0, h.owner, 0, true);
            this.applyStatus(z, 'acid', { dps: 8, t: 2 }, h.owner);
          } else if (h.kind === 'toxic') this.damageZombie(z, h.dps * 0.5, 0, 0, h.owner, 0, true);
          else if (h.kind === 'frost') this.applyStatus(z, 'ice', 22, h.owner);
        }
        if (h.kind === 'fire') {
          // fogo detona barris e queima madeira
          for (const b of this.placeables) if (!b.dead && b.kind === 'barrel' && Math.hypot(b.x - h.x, b.z - h.z) < h.r + 0.4) {
            if (!b.owner) b.owner = h.owner;
            this.damageBarrel(b, 99);
          }
          for (const pr of this.arena.props) if (!pr.dead && pr.def.hp && WOODEN.has(pr.def.id) && Math.hypot(pr.x - h.x, pr.z - h.z) < h.r + 0.5) this.damageProp(pr, 14, h.owner, 0, 0, true);
          for (const c of this.pickups) if (c.type === 'supply' && !c.taken && Math.hypot(c.x - h.x, c.z - h.z) < h.r) this.openSupply(c, h.owner);
        }
      }
      // partículas leves (o combate continua visível)
      const n = h.kind === 'fire' ? 9 : 3;
      if (Math.random() < dt * n) {
        const a = rand(0, 6.28);
        const rr = Math.sqrt(Math.random()) * h.r;
        const x = h.x + Math.sin(a) * rr;
        const z = h.z + Math.cos(a) * rr;
        if (h.kind === 'fire') this.parts.spawn(x, 0.15, z, rand(-0.3, 0.3), rand(1.5, 3), rand(-0.3, 0.3), rand(0.08, 0.16), pick(HAZARD_COLORS.fire), 0.5, -1.5, 2);
        else if (h.kind === 'acid') this.parts.spawn(x, 0.08, z, 0, rand(0.5, 1), 0, 0.06, pick(HAZARD_COLORS.acid), 0.4, 3, 2);
        else if (h.kind === 'toxic') this.parts.spawn(x, rand(0.2, 0.8), z, rand(-0.3, 0.3), rand(0.2, 0.6), rand(-0.3, 0.3), rand(0.14, 0.26), pick(HAZARD_COLORS.toxic), 1.2, -0.2, 2);
        else this.parts.spawn(x, 0.1, z, 0, rand(0.3, 0.8), 0, 0.05, pick(HAZARD_COLORS.frost), 0.5, 0, 2);
      }
    }
    compact(this.hazards, (h) => h.life > 0);
  },
  drawHazards(G, t) {
    for (const h of this.hazards) {
      const f = Math.min(1, h.life / 0.8, (h.max - h.life) / 0.25 + 0.3);
      const cols = HAZARD_COLORS[h.kind];
      const n = Math.min(10, 3 + Math.round(h.r * 3));
      for (let k = 0; k < n; k++) {
        const a = h.seed + k * 2.399;
        const rr = h.r * Math.sqrt((k + 0.5) / n) * 0.9;
        const x = h.x + Math.sin(a) * rr;
        const z = h.z + Math.cos(a) * rr;
        if (h.kind === 'fire') {
          const sy = (0.25 + Math.random() * 0.35) * f;
          G.box(x, sy / 2, z, 0.22 * f, sy, 0.22 * f, cols[k % 3], a);
        } else if (h.kind === 'acid') {
          G.box(x, 0.03, z, 0.34 * f, 0.03, 0.34 * f, cols[k % 3], a);
          if ((k + Math.floor(t * 3)) % 4 === 0) G.box(x, 0.08 + Math.sin(t * 6 + k) * 0.04, z, 0.08, 0.08, 0.08, cols[2]);
        } else if (h.kind === 'toxic') {
          const s = (0.45 + (k % 2) * 0.2) * f;
          G.box(x + Math.sin(t * 0.7 + k) * 0.2, 0.3 + (k % 3) * 0.2, z + Math.cos(t * 0.7 + k) * 0.2, s, s * 0.7, s, cols[k % 3], a + t * 0.3);
        } else G.box(x, 0.04 + (k % 2) * 0.06, z, 0.26 * f, 0.08 + (k % 3) * 0.08, 0.26 * f, cols[k % 3], a);
      }
    }
  },

  // ------------------------------------------------------------------ lança-chamas: cone contínuo
  fireFlame(p, ang, w, mx, mz) {
    const dx = Math.sin(ang);
    const dz = Math.cos(ang);
    const range = w.range;
    const wall = this.arena.rayFree(p.pos.x, p.pos.z, dx, dz, range);
    const inCone = (x, z, rad = 0) => {
      const ex = x - p.pos.x;
      const ez = z - p.pos.z;
      const d = Math.hypot(ex, ez);
      if (d > Math.min(range, wall + 0.6) + rad) return false;
      return d < 0.9 + rad || Math.abs(angDiff(ang, Math.atan2(ex, ez))) < w.arc / 2 + rad / Math.max(1, d);
    };
    for (const z of this.zombies) {
      if (!z.alive || !inCone(z.pos.x, z.pos.z, z.radius)) continue;
      this.damageZombie(z, w.dmg, dx, dz, p, 0.25, true);
      this.weaponSpecial(p, z, w, dx, dz);
      this.applyStatus(z, 'fire', w.burn, p);
    }
    for (const b of this.placeables) if (!b.dead && b.kind === 'barrel' && inCone(b.x, b.z, 0.3)) {
      if (!b.owner) b.owner = p;
      this.damageBarrel(b, w.dmg);
    }
    for (const pr of this.arena.props) if (!pr.dead && pr.def.hp && !pr.def.boomOnly && inCone(pr.x, pr.z, 0.4)) this.damageProp(pr, w.dmg * (WOODEN.has(pr.def.id) ? 1.5 : 0.4), p, dx, dz);
    for (const c of this.pickups) if (c.type === 'supply' && !c.taken && inCone(c.x, c.z, 0.3)) this.openSupply(c, p);
    // jato visível
    const reach = Math.min(range, wall);
    for (let k = 0; k < 7; k++) {
      const a = ang + rand(-w.arc / 2, w.arc / 2) * 0.8;
      const sp = reach / 0.32 * rand(0.7, 1.05);
      this.parts.spawn(mx, 1.0, mz, Math.sin(a) * sp, rand(-0.3, 0.8), Math.cos(a) * sp, rand(0.12, 0.26), pick(HAZARD_COLORS.fire), rand(0.22, 0.34), -2, 2);
    }
    if (Math.random() < 0.3) this.parts.spawn(mx + dx * reach * 0.7, 1.3, mz + dz * reach * 0.7, rand(-0.5, 0.5), rand(1, 2), rand(-0.5, 0.5), rand(0.2, 0.35), 0x3a3634, 0.9, -1, 0);
    // fogo persistente onde o jato toca o chão
    p.flameAcc = (p.flameAcc || 0) + 1;
    if (p.flameAcc >= 5) {
      p.flameAcc = 0;
      const d = Math.min(reach - 0.3, range * 0.8);
      const fx = p.pos.x + dx * d;
      const fz = p.pos.z + dz * d;
      const ter = this.arena.terrainAt(fx, fz);
      if (d > 1 && ter !== 8 && ter !== 14) this.addHazard('fire', fx, fz, 0.85, 2.6, 12, p);
    }
    p.flameSnd = (p.flameSnd || 0) - w.rate;
    if (p.flameSnd <= 0) {
      p.flameSnd = 0.24;
      this.audio.play('flame', { volume: 0.5, pos: p.pos, rate: rand(0.9, 1.1) });
    }
  },

  // ------------------------------------------------------------------ granadas especiais
  elementBlast(pr) {
    const w = pr.w;
    const r = w.radius * (this.upg.bigBoom ? 1.25 : 1);
    const owner = pr.owner;
    const kind = pr.kind;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const d = Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z);
      if (d > r + z.radius) continue;
      const nx = (z.pos.x - pr.x) / (d || 1);
      const nz = (z.pos.z - pr.z) / (d || 1);
      if (w.dmg) {
        this.damageZombie(z, w.dmg * Math.max(0.4, 1 - d / (r + 0.5)), nx, nz, owner, kind === 'g_fire' ? 2 : 0.5);
        this.weaponSpecial(owner, z, w, nx, nz);
      }
      if (!z.alive) continue;
      if (kind === 'g_emp') this.applyStatus(z, 'emp', 1, owner);
      else if (kind === 'g_frost') this.applyStatus(z, 'ice', 120, owner);
      else if (kind === 'g_fire') this.applyStatus(z, 'fire', { dps: 14, t: 4 }, owner);
    }
    const cols = { g_emp: [0x40c8ff, 0xffffff, 0x2a6ad8], g_fire: HAZARD_COLORS.fire, g_frost: HAZARD_COLORS.frost, g_toxic: HAZARD_COLORS.toxic }[kind];
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      this.parts.spawn(pr.x, 0.5, pr.z, Math.sin(a) * r * 2.2, rand(0.5, 2.5), Math.cos(a) * r * 2.2, rand(0.1, 0.22), pick(cols), 0.5, kind === 'g_fire' ? -1 : 2, 2);
    }
    if (kind === 'g_emp') {
      this.audio.play('emp', { volume: 0.9, pos: pr, priority: true });
      // o pulso também desliga carros com alarme e sobrecarrega o piso elétrico
      for (const q of this.arena.props) if (!q.dead && q.def.id === 'acar' && Math.hypot(q.x - pr.x, q.z - pr.z) < r + 1) q.alarmT = 0;
      for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < r) this.ui.toast(p.id, 'Pulso EMP!', 'bolt');
      this.noiseShake(0.35);
    } else if (kind === 'g_fire') {
      this.audio.play('explosion', { volume: 0.55, pos: pr, rate: 1.4 });
      this.audio.play('flame', { volume: 0.8, pos: pr, rate: 0.7 });
      this.addHazard('fire', pr.x, pr.z, r, w.area.life, w.area.dps, owner);
      for (let k = 0; k < 4; k++) {
        const a = rand(0, 6.28);
        this.addHazard('fire', pr.x + Math.sin(a) * r * 0.6, pr.z + Math.cos(a) * r * 0.6, r * 0.45, w.area.life * 0.8, w.area.dps, owner);
      }
      this.noiseShake(0.4);
    } else if (kind === 'g_frost') {
      this.audio.play('freeze', { volume: 0.9, pos: pr, rate: 0.8, priority: true });
      this.addHazard('frost', pr.x, pr.z, r, 4, 0, owner);
      this.noiseShake(0.25);
    } else if (kind === 'g_toxic') {
      this.audio.play('splash', { volume: 0.8, pos: pr, rate: 0.5 });
      this.addHazard('toxic', pr.x, pr.z, r, w.area.life, w.area.dps, owner);
    }
  },

  // ------------------------------------------------------------------ projéteis novos
  // devolve true quando o projétil terminou
  updateNewProjectile(pr, dt) {
    const A = this.arena;
    if (pr.kind === 'dart') {
      // dardo do templo: fere quem estiver no caminho (jogador ou inimigo)
      pr.x += pr.vx * dt;
      pr.z += pr.vz * dt;
      let end = pr.t > 1.5 || A.tallAt(pr.x, pr.z);
      if (!end) for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 0.45) {
        this.damagePlayer(p, 12, pr.x - pr.vx, pr.z - pr.vz, 2, true);
        end = true;
      }
      if (!end) for (const z of this.zombies) if (z.alive && !z.def.fly && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < z.radius + 0.15) {
        this.damageZombie(z, 40, Math.sin(pr.ang), Math.cos(pr.ang), null, 1.2);
        end = true;
        break;
      }
      if (end) for (let k = 0; k < 4; k++) this.parts.spawn(pr.x, pr.y, pr.z, rand(-1.5, 1.5), rand(0.5, 2), rand(-1.5, 1.5), 0.05, 0x8a6a34, 0.4, 12, 0);
      return end;
    }
    if (pr.kind === 'bolt') {
      const w = pr.w;
      const nx = pr.x + pr.vx * dt;
      const nz = pr.z + pr.vz * dt;
      const glow = w.glow || 0x40e0ff;
      if (Math.random() < 0.8) this.parts.spawn(pr.x, pr.y, pr.z, rand(-0.3, 0.3), rand(-0.2, 0.3), rand(-0.3, 0.3), rand(0.05, 0.1), glow, 0.25, 0, 2);
      let end = A.tallAt(nx, nz) || pr.t > 1.4;
      // cenário que leva tiro
      if (!end) for (const q of A.props) if (!q.dead && q.def.shoot && Math.hypot(q.x - nx, q.z - nz) < q.def.shoot) {
        this.damageProp(q, w.dmg, pr.owner, Math.sin(pr.ang), Math.cos(pr.ang));
        end = true;
        break;
      }
      if (!end) for (const z of this.zombies) {
        if (!z.alive || pr.hit.has(z)) continue;
        if (Math.hypot(z.pos.x - nx, z.pos.z - nz) > z.radius + 0.22) continue;
        pr.hit.add(z);
        const dx = Math.sin(pr.ang);
        const dz = Math.cos(pr.ang);
        this.damageZombie(z, w.dmg, dx, dz, pr.owner, w.el === 'energy' ? 1.6 : 0.4);
        this.weaponSpecial(pr.owner, z, w, dx, dz);
        if (w.el === 'ice') this.applyStatus(z, 'ice', w.chill, pr.owner);
        if (w.el === 'energy') this.plasmaBurst(nx, nz, w, pr.owner, z);
        if (++pr.pierced > (w.pierce || 0)) {
          end = true;
          break;
        }
      }
      pr.x = nx;
      pr.z = nz;
      if (end) {
        for (let k = 0; k < 8; k++) this.parts.spawn(pr.x, pr.y, pr.z, rand(-3, 3), rand(0, 3), rand(-3, 3), rand(0.05, 0.12), pick([glow, 0xffffff]), 0.35, 6, 2);
        if (w.el === 'energy' && !pr.burst) this.plasmaBurst(pr.x, pr.z, w, pr.owner, null);
        this.audio.play(w.el === 'ice' ? 'freeze' : 'zap', { volume: 0.25, pos: pr, rate: rand(1.3, 1.7) });
      }
      return end;
    }
    if (pr.kind === 'glob') {
      pr.vy -= 14 * dt;
      pr.x += pr.vx * dt;
      pr.z += pr.vz * dt;
      pr.y += pr.vy * dt;
      if (Math.random() < 0.6) this.parts.spawn(pr.x, pr.y, pr.z, 0, 0, 0, 0.06, pick(HAZARD_COLORS.acid), 0.3, 6, 2);
      let hit = pr.y <= 0.08 || A.tallAt(pr.x, pr.z) || pr.t > 3;
      if (!hit) for (const z of this.zombies) if (z.alive && pr.y < 1.8 && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < z.radius + 0.25) {
        hit = true;
        break;
      }
      if (hit) {
        const w = pr.w;
        for (const z of this.zombies) {
          if (!z.alive) continue;
          const d = Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z);
          if (d > 1.0 + z.radius) continue;
          this.damageZombie(z, w.dmg * (d < z.radius + 0.3 ? 1 : 0.6), (z.pos.x - pr.x) / (d || 1), (z.pos.z - pr.z) / (d || 1), pr.owner, 0.4);
          this.weaponSpecial(pr.owner, z, w);
          this.applyStatus(z, 'acid', w.corrode, pr.owner);
        }
        const gx = Math.min(A.W - 1, Math.max(1, pr.x));
        const gz = Math.min(A.D - 1, Math.max(1, pr.z));
        this.addHazard('acid', gx, gz, w.puddle.r, w.puddle.life, w.puddle.dps, pr.owner);
        for (let k = 0; k < 10; k++) this.parts.spawn(pr.x, 0.3, pr.z, rand(-2.5, 2.5), rand(1, 3), rand(-2.5, 2.5), 0.08, pick(HAZARD_COLORS.acid), 0.5, 14, 2);
        this.audio.play('splash', { pos: pr, volume: 0.55, rate: 1.2 });
      }
      return hit;
    }
    if (pr.kind === 'lobgren') {
      // granada lançada: explode ao tocar o chão ou um inimigo; ricocheteia nas paredes
      pr.vy -= 18 * dt;
      const nx = pr.x + pr.vx * dt;
      const nz = pr.z + pr.vz * dt;
      let boom = false;
      const wallX = A.tallAt(nx, pr.z) || (A.blocked(Math.floor(nx), Math.floor(pr.z)) && pr.y < 0.8);
      const wallZ = A.tallAt(pr.x, nz) || (A.blocked(Math.floor(pr.x), Math.floor(nz)) && pr.y < 0.8);
      if (wallX || wallZ) {
        if (pr.bounces-- <= 0) boom = true;
        else {
          if (wallX) pr.vx *= -0.75;
          if (wallZ) pr.vz *= -0.75;
          this.audio.play('bounce', { pos: pr, volume: 0.5, rate: 0.8 });
          for (let k = 0; k < 4; k++) this.parts.spawn(pr.x, pr.y, pr.z, rand(-2, 2), rand(0, 2), rand(-2, 2), 0.05, 0xffd27a, 0.25, 10, 2);
        }
      }
      if (!wallX) pr.x = nx;
      if (!wallZ) pr.z = nz;
      pr.y += pr.vy * dt;
      if (Math.random() < 0.7) this.parts.spawn(pr.x, pr.y, pr.z, 0, 0.3, 0, rand(0.08, 0.14), 0x8a8a8a, 0.4, -1, 0);
      if (pr.y <= 0.12 || pr.t > 2.2) boom = true;
      if (!boom) for (const z of this.zombies) if (z.alive && pr.y < (z.def.fly ? 2.2 : 1.6) && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < z.radius + 0.25) {
        boom = true;
        break;
      }
      if (boom) this.explosion(pr.x, pr.z, pr.w.radius * (this.upg.bigBoom ? 1.4 : 1), pr.w.dmg, pr.owner);
      return boom;
    }
    return false;
  },
  // estouro de plasma: dano em área pequena (só inimigos) e faíscas
  plasmaBurst(x, z, w, owner, skip) {
    for (const q of this.zombies) {
      if (!q.alive || q === skip) continue;
      const d = Math.hypot(q.pos.x - x, q.pos.z - z);
      if (d < w.blast + q.radius) {
        this.damageZombie(q, w.dmg * 0.45, (q.pos.x - x) / (d || 1), (q.pos.z - z) / (d || 1), owner, 1.2);
        if (q.alive && this.resist(q, 'energy') > 1) q.stunT = Math.max(q.stunT || 0, 0.8);
      }
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      this.parts.spawn(x, 1, z, Math.sin(a) * 4, rand(0.5, 2), Math.cos(a) * 4, 0.08, pick([w.glow, 0xffffff]), 0.3, 2, 2);
    }
    const l = this.boomLights[this.boomIdx++ % 2];
    l.position.set(x, 1.6, z);
    l.color.setHex(w.glow);
    l.intensity = 18;
  },
  drawNewProjectile(B, G, pr, drawItem) {
    if (pr.kind === 'dart') {
      B.box(pr.x, pr.y, pr.z, 0.05, 0.05, 0.42, 0x5a4a3a, pr.ang);
      G.box(pr.x + Math.sin(pr.ang) * 0.22, pr.y, pr.z + Math.cos(pr.ang) * 0.22, 0.06, 0.06, 0.08, 0xff5020, pr.ang);
      return true;
    }
    if (pr.kind === 'bolt') {
      const c = pr.w.glow || 0x40e0ff;
      if (pr.w.el === 'ice') {
        G.box(pr.x, pr.y, pr.z, 0.16, 0.16, 0.16, 0xffffff, pr.t * 12);
        G.box(pr.x - pr.vx * 0.012, pr.y, pr.z - pr.vz * 0.012, 0.1, 0.1, 0.34, c, pr.ang);
      } else {
        G.box(pr.x, pr.y, pr.z, 0.14, 0.14, 0.6, c, pr.ang);
        G.box(pr.x, pr.y, pr.z, 0.07, 0.07, 0.75, 0xffffff, pr.ang);
      }
      return true;
    }
    if (pr.kind === 'glob') {
      G.box(pr.x, pr.y, pr.z, 0.22, 0.22, 0.22, 0x8aff4a, pr.t * 8);
      G.box(pr.x, pr.y, pr.z, 0.14, 0.28, 0.14, 0x5ac82a, -pr.t * 6);
      return true;
    }
    if (pr.kind === 'lobgren') {
      const a = Math.atan2(pr.vx, pr.vz);
      B.box(pr.x, pr.y, pr.z, 0.16, 0.16, 0.26, 0x4a5236, a);
      G.box(pr.x, pr.y, pr.z, 0.17, 0.04, 0.27, 0xe8b020, a);
      return true;
    }
    if (pr.kind && pr.kind.startsWith('g_')) {
      drawItem(B, G, pr.w === WEAPONS.egrenade ? 'egrenade' : pr.w === WEAPONS.igrenade ? 'igrenade' : pr.w === WEAPONS.fgrenade ? 'fgrenade' : 'tgrenade', pr.x, pr.y, pr.z, pr.t * 8, 0.85);
      return true;
    }
    return false;
  },

  // ------------------------------------------------------------------ armadilhas e torres
  nearestEnemy(x, z, range, needLos = true) {
    let best = null;
    let bd = range;
    for (const q of this.zombies) {
      if (!q.alive) continue;
      const d = Math.hypot(q.pos.x - x, q.pos.z - z);
      if (d >= bd) continue;
      if (needLos && !this.arena.los(x, z, q.pos.x, q.pos.z)) continue;
      bd = d;
      best = q;
    }
    return best;
  },
  damageTrap(b, dmg) {
    if (b.dead) return;
    b.hp -= dmg;
    b.hurtT = 0.1;
    if (b.hp <= 0) this.breakTrap(b, 'destruída');
  },
  breakTrap(b, why) {
    if (b.dead) return;
    this.removePlaceable(b);
    const m = TRAP_MODELS[b.kind];
    const parts = m ? [...m.base, ...(m.head || [])] : [[0, 0.3, 0, 0.5, 0.5, 0.5, 0x6a6a70]];
    for (let k = 0; k < 14; k++) {
      const q = pick(parts);
      this.parts.spawn(b.x + rand(-0.3, 0.3), rand(0.2, 1.1), b.z + rand(-0.3, 0.3), rand(-3, 3), rand(1, 4), rand(-3, 3), rand(0.06, 0.14), q[6], rand(0.7, 1.2), 16, 0);
    }
    this.audio.play('hit_armor', { volume: 0.7, pos: b, rate: 0.6 });
    if (b.owner && why) this.ui.toast(b.owner.id, `${WEAPONS[b.kind].name} ${why}`, 'warning', 'bad');
  },
  updateTraps(dt) {
    for (const b of this.placeables) {
      if (b.dead) continue;
      const T = TRAPS[b.kind];
      if (!T) continue;
      b.hurtT = Math.max(0, (b.hurtT || 0) - dt);
      if (b.armT > 0) continue;
      if (T.life) {
        b.life -= dt;
        if (b.life <= 0) {
          this.breakTrap(b, 'sem bateria');
          continue;
        }
      }
      if (b.kind === 'proxmine') {
        if (b.trig === undefined) {
          if (this.nearestEnemy(b.x, b.z, T.range, false)) {
            b.trig = T.delay;
            this.audio.play('beep', { pos: b, volume: 0.9, rate: 1.4 });
          }
        } else if ((b.trig -= dt) <= 0) {
          this.removePlaceable(b);
          this.explosion(b.x, b.z, T.radius * (this.upg.bigBoom ? 1.3 : 1), T.dmg, b.owner);
        }
      } else if (b.kind === 'spikes') {
        b.tick = (b.tick || 0) - dt;
        let wear = 0;
        for (const z of this.zombies) {
          if (!z.alive || z.def.fly) continue;
          if (Math.abs(z.pos.x - b.x) > 0.5 + z.radius * 0.5 || Math.abs(z.pos.z - b.z) > 0.5 + z.radius * 0.5) continue;
          z.spikeT = 0.3;
          if (b.tick <= 0) {
            this.damageZombie(z, T.dmg, 0, 0, b.owner, 0, true);
            wear += T.wear;
            for (let k = 0; k < 3; k++) this.parts.spawn(z.pos.x, 0.4, z.pos.z, rand(-1.5, 1.5), rand(1, 2.5), rand(-1.5, 1.5), 0.07, pick(z.def.blood || [0x8a0a0a, 0xa31212]), 0.6, 16, 0);
          }
        }
        if (b.tick <= 0) b.tick = T.tick;
        if (wear) this.damageTrap(b, wear);
      } else if (b.kind === 'efence') {
        b.cd = (b.cd || 0) - dt;
        if (b.cd <= 0) {
          let n = 0;
          for (const z of this.zombies) {
            if (!z.alive || n >= 3 || Math.hypot(z.pos.x - b.x, z.pos.z - b.z) > T.range + z.radius) continue;
            n++;
            this.addBolt(b.x + rand(-0.3, 0.3), rand(0.4, 1.05), b.z, z.pos.x, 0.9, z.pos.z, 0.18);
            this.damageZombie(z, T.dmg * (RESIST[z.type]?.mech ? 1.6 : 1), 0, 0, b.owner, 0.6);
            if (z.alive) {
              z.stunT = Math.max(z.stunT || 0, T.stun);
              z.shockT = Math.max(z.shockT || 0, 1.5);
            }
          }
          if (n) {
            b.cd = T.cd;
            b.charges--;
            b.zapT = 0.15;
            this.audio.play('zap', { pos: b, volume: 0.6, rate: rand(0.9, 1.2) });
            if (b.charges <= 0) this.breakTrap(b, 'descarregada');
          }
        }
        b.zapT = Math.max(0, (b.zapT || 0) - dt);
      } else if (b.kind === 'ltower' || b.kind === 'ftower' || b.kind === 'itower') {
        this.updateTower(b, T, dt);
      }
    }
  },
  updateTower(b, T, dt) {
    b.scanT = (b.scanT || 0) - dt;
    if (b.scanT <= 0 || !b.target?.alive) {
      b.scanT = 0.3;
      b.target = this.nearestEnemy(b.x, b.z, T.range, true);
    }
    const tg = b.target;
    if (!tg) {
      b.ang = (b.ang || 0) + dt * 0.6; // varredura
      b.beam = 0;
      return;
    }
    const want = Math.atan2(tg.pos.x - b.x, tg.pos.z - b.z);
    b.ang = (b.ang || 0) + angDiff(b.ang || 0, want) * Math.min(1, dt * 10);
    const aimed = Math.abs(angDiff(b.ang, want)) < 0.25;
    if (!aimed) return;
    const hx = b.x + Math.sin(b.ang) * 0.4;
    const hz = b.z + Math.cos(b.ang) * 0.4;
    if (b.kind === 'ltower') {
      b.beam = 1;
      b.acc = (b.acc || 0) + dt;
      if (b.acc >= 0.1) {
        this.damageZombie(tg, T.dps * b.acc, Math.sin(b.ang), Math.cos(b.ang), b.owner, 0.1, true);
        b.acc = 0;
        if (Math.random() < 0.5) this.parts.spawn(tg.pos.x, 1, tg.pos.z, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.06, pick([0xff3020, 0xffd060]), 0.3, 8, 2);
      }
      b.sndT = (b.sndT || 0) - dt;
      if (b.sndT <= 0) {
        b.sndT = 0.45;
        this.audio.play('laser', { pos: b, volume: 0.3, rate: rand(0.95, 1.05) });
      }
    } else if (b.kind === 'ftower') {
      b.cd = (b.cd || 0) - dt;
      if (b.cd <= 0) {
        b.cd = T.cd;
        // mesmo fogo do lança-chamas, com alcance e abertura da torre
        this.towerFlame(b, { ...WEAPONS.flamer, dmg: T.dmg, range: T.range, arc: T.arc, rate: T.cd }, hx, hz);
      }
    } else if (b.kind === 'itower') {
      b.cd = (b.cd || 0) - dt;
      if (b.cd <= 0) {
        b.cd = T.cd;
        const a = Math.atan2(tg.pos.x - hx, tg.pos.z - hz);
        const w = { dmg: 10, el: 'ice', chill: 40, speed: 22, pierce: 0, glow: 0xa8ecff };
        this.projectiles.push({ kind: 'bolt', x: hx, y: 1.2, z: hz, vx: Math.sin(a) * w.speed, vz: Math.cos(a) * w.speed, ang: a, t: 0, w, owner: b.owner, hit: new Set(), pierced: 0 });
        this.audio.play('shot_cryo', { pos: b, volume: 0.35 });
      }
    }
  },
  towerFlame(b, w, hx, hz) {
    const ang = b.ang;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const ex = z.pos.x - b.x;
      const ez = z.pos.z - b.z;
      const d = Math.hypot(ex, ez);
      if (d > w.range + z.radius || Math.abs(angDiff(ang, Math.atan2(ex, ez))) > w.arc / 2 + z.radius / Math.max(1, d)) continue;
      if (!this.arena.los(b.x, b.z, z.pos.x, z.pos.z)) continue;
      this.damageZombie(z, w.dmg, Math.sin(ang), Math.cos(ang), b.owner, 0.2, true);
      this.applyStatus(z, 'fire', w.burn, b.owner);
    }
    for (let k = 0; k < 5; k++) {
      const a = ang + rand(-w.arc / 2, w.arc / 2) * 0.8;
      const sp = (w.range / 0.32) * rand(0.6, 1);
      this.parts.spawn(hx, 1.0, hz, Math.sin(a) * sp, rand(-0.2, 0.6), Math.cos(a) * sp, rand(0.1, 0.22), pick(HAZARD_COLORS.fire), rand(0.2, 0.32), -2, 2);
    }
    b.sndT = (b.sndT || 0) - w.rate;
    if (b.sndT <= 0) {
      b.sndT = 0.3;
      this.audio.play('flame', { pos: b, volume: 0.4 });
    }
  },
  drawTrap(B, G, b, t) {
    const m = TRAP_MODELS[b.kind];
    if (!m) return false;
    const flash = b.hurtT > 0;
    const low = b.hp < (TRAPS[b.kind].hp || 1) * 0.3;
    for (const q of m.base) {
      const glow = q[7];
      let on = true;
      if (b.kind === 'proxmine' && glow) on = b.armT <= 0 && Math.sin(t * (b.trig !== undefined ? 40 : 6)) > 0;
      if (b.kind === 'efence' && glow) on = (b.zapT > 0 || Math.sin(t * 9 + b.x) > 0.6);
      (glow && on ? G : B).box(b.x + q[0], q[1], b.z + q[2], q[3], q[4], q[5], flash ? 0xffffff : glow && !on ? 0x3a3a2a : q[6]);
    }
    if (m.head) {
      const a = b.ang || 0;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const dying = (b.life !== undefined && b.life < 8 && Math.sin(t * 16) > 0) || (low && Math.sin(t * 10) > 0.4);
      for (const q of m.head) {
        const wx = b.x + q[0] * c + q[2] * s;
        const wz = b.z - q[0] * s + q[2] * c;
        const glow = q[7] && !dying;
        (glow ? G : B).box(wx, q[1], wz, q[3], q[4], q[5], flash ? 0xffffff : q[7] && dying ? 0x3a3a3a : q[6], a);
      }
      // feixe da torre de laser
      if (b.kind === 'ltower' && b.beam && b.target?.alive) {
        const tg = b.target;
        const hx = b.x + s * 0.42;
        const hz = b.z + c * 0.42;
        const dx = tg.pos.x - hx;
        const dz = tg.pos.z - hz;
        const len = Math.hypot(dx, dz);
        const ty = tg.def.fly ? tg.flyY || 1.4 : 0.9 * tg.scale;
        const w = 0.05 + Math.sin(t * 40) * 0.015;
        G.box((hx + tg.pos.x) / 2, (1.02 + ty) / 2, (hz + tg.pos.z) / 2, w, w, len, 0xff2a20, Math.atan2(dx, dz));
        G.box((hx + tg.pos.x) / 2, (1.02 + ty) / 2, (hz + tg.pos.z) / 2, w * 0.4, w * 0.4, len, 0xffd0c0, Math.atan2(dx, dz));
      }
    }
    // barra de durabilidade quando danificada
    const max = TRAPS[b.kind].hp;
    if (b.hp < max && b.kind !== 'proxmine') {
      const f = Math.max(0, b.hp / max);
      G.box(b.x - 0.3 + 0.3 * f, 1.6, b.z, 0.6 * f, 0.05, 0.05, f > 0.5 ? 0x2ecc71 : f > 0.25 ? 0xffc107 : 0xe53935);
    }
    return true;
  },
};
