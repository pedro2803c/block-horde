// Objetos interativos e eventos das arenas novas (métodos misturados na classe Game).
// Todo objeto interativo tem um estado visível na luz 'state':
//   desativado (cinza) · disponível (verde) · ativado (amarelo piscando) · danificado (vermelho) · destruído (some)
// Laboratório: tanques biológicos, cápsulas, painel holográfico (contenção) e portas automáticas.
// Coliseu: portões monumentais, túneis, armadilhas de espinhos e a Prova de sobrevivência.
// Templo: placas de pressão + dardos, lâminas giratórias, portas secretas, portais mágicos e o altar do desafio.
// Comuns: tanque químico, totem médico e portal de onda.

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const STATE_COLORS = { off: 0x3a3a3a, ready: 0x2ecc71, active: 0xffc107, damaged: 0xe53935 };
export const STATE_NAMES = { off: 'Desativado', ready: 'Disponível', active: 'Ativado', damaged: 'Danificado', destroyed: 'Destruído' };
const TOTEM_COOLDOWN = 35;
const PANEL_COOLDOWN = 30;

export const WorldMixin = {
  initWorldObjects() {
    const A = this.arena;
    this.lockdownT = 0;
    this.secretOpen = false;
    this.challenge = null;
    this.trialKills = 0;
    this.tportals = A.props.filter((p) => p.def.id === 'tportal');
    for (const pr of A.props) {
      const id = pr.def.id;
      pr.cdT = 0;
      pr.activeT = 0;
      if (id === 'labdoor') {
        // passagem livre; só tranca durante a contenção
        pr.open = false;
        pr.locked = false;
        A.setPropBlock(pr, false);
      } else if (id === 'secretdoor') {
        A.setPropBlock(pr, true);
        pr.open = false;
      } else if (id === 'capsule') pr.open = false;
      else if (id === 'blade') pr.bladeA = pr.seed;
      else if (id === 'spiketrap') pr.t = pr.seed % 4.5;
    }
    this.flowT = 0;
  },

  // estado do objeto (para a luz e para o catálogo)
  propState(pr) {
    if (pr.dead) return 'destroyed';
    const id = pr.def.id;
    if (pr.def.hp && pr.hp < pr.maxHp * 0.5 && id !== 'sarcophagus') return 'damaged';
    if (id === 'labdoor') return pr.locked ? 'off' : pr.open ? 'active' : 'ready';
    if (id === 'capsule') return pr.open ? 'damaged' : this.lockdownT > 0 ? 'off' : 'ready';
    if (id === 'holopanel') return this.lockdownT > 0 ? 'active' : pr.cdT > 0 ? 'off' : 'ready';
    if (id === 'lever') return this.secretOpen ? 'active' : 'ready';
    if (id === 'altar') return this.challenge ? 'active' : pr.cdT > 0 ? 'off' : 'ready';
    if (pr.activeT > 0) return 'active';
    if (pr.cdT > 0) return 'off';
    return 'ready';
  },

  updateWorldObjects(dt) {
    const A = this.arena;
    const ev = this.event;
    if (this.lockdownT > 0) {
      this.lockdownT = Math.max(0, this.lockdownT - dt);
      if (this.lockdownT === 0) this.ui.alert('Contenção encerrada: portas automáticas liberadas.', 'info', 'info');
    }
    const blink = Math.sin(this.time * 10) > 0;
    for (const pr of A.props) {
      if (pr.dead) continue;
      const id = pr.def.id;
      pr.cdT = Math.max(0, (pr.cdT || 0) - dt);
      pr.flashT = Math.max(0, (pr.flashT || 0) - dt);
      if (pr.def.states) {
        const st = this.propState(pr);
        pr.stateCol = st === 'active' || st === 'damaged' ? (blink ? STATE_COLORS[st] : 0x3a3a3a) : STATE_COLORS[st];
      }
      if (id === 'chemtank') {
        // tanque danificado vaza
        if (pr.hp < pr.maxHp * 0.5 && Math.random() < dt * 8) this.parts.spawn(pr.x + rand(-0.4, 0.4), rand(0.3, 1.2), pr.z + rand(-0.4, 0.4), rand(-0.5, 0.5), rand(-0.5, 0.3), rand(-0.5, 0.5), 0.07, pick([0x8aff4a, 0x5ac82a]), 0.7, 8, 2);
      } else if (id === 'medtotem') {
        const damaged = pr.hp < pr.maxHp * 0.5;
        if (pr.activeT > 0) {
          pr.activeT -= dt;
          pr.healT = (pr.healT || 0) + dt;
          if (pr.healT >= 0.5) {
            pr.healT = 0;
            for (const p of this.players) if (p.alive && p.hp < p.maxHp && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 3) {
              p.hp = Math.min(p.maxHp, p.hp + (damaged ? 2.5 : 5));
              this.parts.spawn(p.pos.x + rand(-0.3, 0.3), 1, p.pos.z + rand(-0.3, 0.3), 0, rand(1, 2), 0, 0.08, 0x60ff80, 0.6, -1, 2);
            }
          }
          if (pr.activeT <= 0) pr.cdT = TOTEM_COOLDOWN;
        } else if (pr.cdT <= 0) {
          const p = this.nearPlayer(pr, 1.3);
          if (p) this.holdUse(pr, p, dt, 1.2, 'Ativando o totem médico...', () => {
            pr.activeT = 6;
            this.audio.play('heal', { volume: 0.9, pos: pr });
            this.ui.banner(damaged ? 'TOTEM MÉDICO ATIVO (DANIFICADO: CURA PELA METADE)' : 'TOTEM MÉDICO ATIVO', 'good');
          });
          else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
        }
      } else if (id === 'labdoor') {
        // abre sozinha para quem chega (jogador ou inimigo); na contenção tranca e vira parede
        const lock = this.lockdownT > 0;
        if (lock !== pr.locked) {
          const busy = lock && [...this.players, ...this.zombies].some((e) => e.alive && Math.hypot(e.pos.x - pr.x, e.pos.z - pr.z) < 0.75);
          if (!busy) {
            pr.locked = lock;
            A.setPropBlock(pr, lock);
            this.flowT = 0;
            if (lock) pr.open = false;
          }
        }
        if (!pr.locked) {
          const near = [...this.players, ...this.zombies].some((e) => e.alive && Math.hypot(e.pos.x - pr.x, e.pos.z - pr.z) < 1.5);
          if (near !== pr.open && pr.cdT <= 0) {
            pr.open = near;
            pr.cdT = 0.4;
            this.audio.play('door', { volume: 0.3, pos: pr, rate: near ? 1.4 : 1.2 });
          }
        }
      } else if (id === 'holopanel') {
        const p = this.nearPlayer(pr, 1.3);
        if (p && pr.cdT <= 0 && this.lockdownT <= 0) this.holdUse(pr, p, dt, 1.5, 'Ativando a contenção...', () => this.startLockdown(pr));
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
      } else if (id === 'spiketrap') {
        const per = ev === 'trial' ? 2.8 : 4.5;
        pr.t = ((pr.t || 0) + dt) % per;
        const up = pr.t > per - 0.7;
        pr.warn = pr.t > per - 1.3 && !up;
        const k = up ? Math.min(1, (pr.t - (per - 0.7)) / 0.08) : Math.max(0, (pr.spikeK || 0) - dt * 4);
        if (up && !pr.hit) {
          pr.hit = true;
          this.audio.play('blade', { volume: 0.45, pos: pr, rate: 1.6 });
          for (const p of this.players) if (p.alive && Math.abs(p.pos.x - pr.x) < 0.6 && Math.abs(p.pos.z - pr.z) < 0.6) this.damagePlayer(p, 16, pr.x, pr.z, 2, true);
          for (const z of this.zombies) if (z.alive && !z.def.fly && Math.abs(z.pos.x - pr.x) < 0.5 + z.radius * 0.5 && Math.abs(z.pos.z - pr.z) < 0.5 + z.radius * 0.5) this.damageZombie(z, 45, 0, 0, null, 0);
        }
        if (!up) pr.hit = false;
        pr.spikeK = k;
      } else if (id === 'blade') {
        pr.bladeA = (pr.bladeA || 0) + dt * (ev === 'curse' ? 15 : 9);
        pr.cutT = (pr.cutT || 0) - dt;
        if (pr.cutT <= 0) {
          pr.cutT = 0.4;
          let hit = false;
          for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 0.8) {
            this.damagePlayer(p, 9, pr.x, pr.z, 3, true);
            hit = true;
          }
          for (const z of this.zombies) if (z.alive && !z.def.fly && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < 0.75 + z.radius) {
            this.damageZombie(z, 28, (z.pos.x - pr.x) || 0.1, (z.pos.z - pr.z) || 0.1, null, 1.5);
            hit = true;
          }
          if (hit) this.audio.play('melee_hit', { volume: 0.4, pos: pr, rate: 1.5 });
        }
        if (Math.random() < dt * 2) this.audio.play('blade', { volume: 0.12, pos: pr, rate: rand(0.9, 1.1) });
      } else if (id === 'pplate') {
        pr.pressT = Math.max(0, (pr.pressT || 0) - dt);
        const on = this.players.some((p) => p.alive && Math.abs(p.pos.x - pr.x) < 0.45 && Math.abs(p.pos.z - pr.z) < 0.45)
          || this.zombies.some((z) => z.alive && !z.def.fly && Math.abs(z.pos.x - pr.x) < 0.45 && Math.abs(z.pos.z - pr.z) < 0.45);
        if (on) pr.pressT = 0.3;
        if (on && pr.cdT <= 0) {
          pr.cdT = 2.5;
          pr.glyph = true;
          this.later(0.6, () => (pr.glyph = false));
          this.audio.play('crate', { volume: 0.5, pos: pr, rate: 1.6 });
          this.fireDarts(pr);
        }
      } else if (id === 'dartwall') {
        pr.warn = pr.cdT > 0;
      } else if (id === 'lever') {
        const p = this.nearPlayer(pr, 1.3);
        if (p && pr.cdT <= 0) this.holdUse(pr, p, dt, 1, this.secretOpen ? 'Fechando a passagem...' : 'Puxando a alavanca...', () => this.toggleSecret(pr));
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
        pr.leverOn = this.secretOpen;
      } else if (id === 'tportal') {
        for (const p of this.players) {
          if (!p.alive) continue;
          if (p.tpLock && Math.hypot(p.pos.x - p.tpLock.x, p.pos.z - p.tpLock.z) > 1) p.tpLock = null;
          if (p.tpLock || Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) > 0.45) continue;
          const k = this.tportals.indexOf(pr);
          const dest = this.tportals[k ^ 1];
          if (!dest || dest.dead) continue;
          const s = this.freeSpotNear(dest.x, dest.z, p.radius);
          p.pos.set(s.x, 0, s.z);
          p.vel.set(0, 0, 0);
          p.tpLock = dest;
          pr.flashT = dest.flashT = 0.6;
          this.audio.play('portal', { volume: 0.7, pos: dest });
          for (const q of [pr, dest]) for (let n = 0; n < 16; n++) this.parts.spawn(q.x + rand(-0.4, 0.4), rand(0.3, 2), q.z + rand(-0.4, 0.4), rand(-1.5, 1.5), rand(0.5, 2), rand(-1.5, 1.5), 0.08, pick([0x40e0c0, 0xc8fff4]), 0.6, -1, 2);
        }
        pr.glyph = ev === 'curse';
      } else if (id === 'altar') {
        const p = this.nearPlayer(pr, 1.3);
        if (p && pr.cdT <= 0 && !this.challenge && this.waveState === 'active') this.holdUse(pr, p, dt, 1.5, 'Invocando o desafio...', () => this.startChallenge(pr));
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
      } else if (id === 'glyphwall' || id === 'obelisk') {
        pr.glyph = ev === 'curse';
      } else if (id === 'portcullis') {
        pr.openT = Math.max(0, (pr.openT || 0) - dt);
        const want = pr.openT > 0 || ev === 'trial' ? 2.3 : 0;
        pr.barsY = (pr.barsY || 0) + (want - (pr.barsY || 0)) * Math.min(1, dt * 3);
      }
    }
    // câmara de desafio: quando a elite cai, o time ganha suprimentos
    const ch = this.challenge;
    if (ch && ch.mobs.every((z) => !z.alive)) {
      this.challenge = null;
      this.ui.banner('DESAFIO VENCIDO! SUPRIMENTOS LIBERADOS', 'gold');
      this.audio.play('victory', { volume: 0.8, priority: true });
      for (let k = 0; k < 2; k++) {
        const s = this.lootSpot(ch.altar.x, ch.altar.z + 1.2);
        this.spawnPickup('supply', s.x, s.z, ch.altar);
      }
      if (!this.demo) this.stats.score += 300 * this.mult;
    }
  },

  // ---- laboratório
  startLockdown(pr) {
    this.lockdownT = 18;
    pr.cdT = PANEL_COOLDOWN;
    this.clouds.length = 0; // a contenção purga os vazamentos
    if (this.event === 'breach') this.endEvent();
    this.audio.play('siren', { volume: 0.6, rate: 1.6 });
    this.ui.banner('CONTENÇÃO ATIVADA: PORTAS TRANCADAS POR 18 S', 'info');
  },
  openCapsule(pr) {
    if (pr.open || pr.dead) return false;
    pr.open = true;
    const dx = Math.sin(pr.rot);
    const dz = Math.cos(pr.rot);
    const s = this.freeSpotNear(pr.x + dx * 1.1, pr.z + dz * 1.1, 0.4);
    const type = this.wave >= 6 ? pick(['reaper', 'spore', 'spider', 'specter']) : pick(['spider', 'runner', 'spitter']);
    const z = this.spawnZombie(type, s.x, s.z);
    z.rise = 0;
    this.audio.play('glass', { volume: 0.8, pos: pr, rate: 0.8 });
    this.audio.play('scream', { volume: 0.5, pos: pr });
    for (let k = 0; k < 14; k++) this.parts.spawn(pr.x + dx * 0.4, rand(0.4, 2), pr.z + dz * 0.4, dx * rand(1, 3) + rand(-1, 1), rand(0.5, 2), dz * rand(1, 3) + rand(-1, 1), 0.08, pick([0x8ad8f0, 0xffffff, 0xb060ff]), 0.7, 12, 2);
    return true;
  },
  // ---- templo
  fireDarts(plate) {
    for (const w of this.arena.props) {
      if (w.dead || w.def.id !== 'dartwall' || Math.hypot(w.x - plate.x, w.z - plate.z) > 8) continue;
      w.cdT = 0.4;
      const dx = Math.sin(w.rot);
      const dz = Math.cos(w.rot);
      for (const off of [-0.25, 0, 0.25]) {
        const ox = w.x + dx * 0.6 + Math.cos(w.rot) * off;
        const oz = w.z + dz * 0.6 - Math.sin(w.rot) * off;
        this.projectiles.push({ kind: 'dart', x: ox, y: 1.1, z: oz, vx: dx * 15, vz: dz * 15, ang: w.rot, t: 0 });
      }
      this.audio.play('dart', { volume: 0.7, pos: w });
    }
  },
  toggleSecret(lever) {
    this.secretOpen = !this.secretOpen;
    lever.cdT = 1.5;
    for (const d of this.arena.props) if (d.def.id === 'secretdoor' && !d.dead) {
      d.open = this.secretOpen;
      this.arena.setPropBlock(d, !this.secretOpen);
      for (let k = 0; k < 10; k++) this.parts.spawn(d.x + rand(-0.5, 0.5), rand(0.2, 2), d.z + rand(-0.5, 0.5), rand(-1, 1), rand(0.5, 1.5), rand(-1, 1), rand(0.1, 0.2), 0xc8a868, 1, 6, 0);
    }
    this.flowT = 0;
    this.audio.play('door', { volume: 0.9, rate: 0.6 });
    this.noiseShake(0.3);
    this.ui.banner(this.secretOpen ? 'PASSAGEM SECRETA ABERTA!' : 'PASSAGEM SECRETA FECHADA', this.secretOpen ? 'good' : 'info');
  },
  startChallenge(altar) {
    altar.cdT = 75;
    const n = Math.min(4, 2 + Math.floor(this.wave / 4));
    const mobs = [];
    for (let k = 0; k < n; k++) {
      const s = this.freeSpotNear(altar.x + rand(-2, 2), altar.z + rand(1.5, 3), 0.5);
      const z = this.spawnZombie(pick(['brute', 'reaper', 'armored', 'specter']), s.x, s.z);
      z.hp = z.maxHp = z.hp * 1.4;
      z.rise = 0.6;
      mobs.push(z);
    }
    this.challenge = { altar, mobs };
    this.audio.play('portal', { volume: 1, pos: altar, rate: 0.6, priority: true });
    this.ui.banner(`CÂMARA DE DESAFIO: DERROTE A ELITE (${n})`, 'bad');
  },

  // ---- destruição de objetos especiais
  onPropDestroyed(pr, by) {
    const id = pr.def.id;
    if (pr.def.glass) this.audio.play('glass', { volume: 0.8, pos: pr });
    if (id === 'chemtank') {
      // nuvem que fere todo mundo: jogadores (nuvem da horda) e inimigos (área tóxica)
      this.addCloud(pr.x, pr.z, { radius: 2.8, dps: 10, life: 7 });
      this.addHazard('toxic', pr.x, pr.z, 2.8, 7, 18, by && by.ctl ? by : null);
      this.audio.play('steam', { volume: 0.9, pos: pr, rate: 0.7 });
      this.ui.alert('Tanque químico rompido: nuvem tóxica!', 'danger', 'warning');
    } else if (id === 'biotank') {
      pr.broken = true;
      this.audio.play('glass', { volume: 0.9, pos: pr });
      this.addCloud(pr.x, pr.z, { radius: 1.6, dps: 8, life: 5 });
      const s = this.freeSpotNear(pr.x, pr.z, 0.4);
      const z = this.spawnZombie(this.wave >= 5 ? pick(['spore', 'spitter', 'reaper']) : pick(['spitter', 'runner']), s.x, s.z);
      z.rise = 0;
    } else if (id === 'sarcophagus') {
      if (Math.random() < 0.5) {
        const s = this.freeSpotNear(pr.x, pr.z, 0.4);
        const z = this.spawnZombie('walker', s.x, s.z);
        z.rise = 0.8;
        this.audio.play('groan2', { volume: 0.6, pos: pr, rate: 0.8 });
      } else this.spawnPickup(this.rollSupply(), pr.x, pr.z, { x: pr.x, z: pr.z });
    }
  },

  // ---- pontos de surgimento especiais (portais, portões, túneis)
  onSpawnPoint(gv) {
    const pr = this.arena.propAt(gv.i, gv.j);
    if (gv.id === 'wportal') {
      if (pr) pr.flashT = 0.8;
      for (let k = 0; k < 12; k++) this.parts.spawn(gv.x, 0.2, gv.z, rand(-1.5, 1.5), rand(1, 3), rand(-1.5, 1.5), rand(0.08, 0.14), pick([0xb060ff, 0xe8c0ff]), 0.7, -1, 2);
      this.audio.play('portal', { volume: 0.35, pos: gv, rate: rand(1.1, 1.4) });
    } else if (gv.id === 'portcullis') {
      if (pr) pr.openT = 2.5;
    } else if (gv.id === 'tunnel') {
      for (let k = 0; k < 10; k++) this.parts.spawn(gv.x, 0.2, gv.z, rand(-1.5, 1.5), rand(1, 3), rand(-1.5, 1.5), rand(0.08, 0.16), pick([0x8a7a5a, 0x5a4a3a]), 0.7, 8, 0);
    } else return false;
    return true;
  },

  // ---- eventos das arenas novas
  startWorldEvent(kind) {
    if (kind === 'breach') {
      this.breachT = 0.5;
      this.ui.alert('Feche a contenção no painel holográfico!', 'danger', 'warning');
    } else if (kind === 'trial') {
      this.trialKills = 0;
      this.trialSpawnT = 1.5;
      this.audio.play('crowd', { volume: 0.9, priority: true });
      this.ui.alert('Abates valem o dobro de pontos durante a prova!', 'info', 'trophy');
    } else if (kind === 'curse') {
      this.curseT = 1;
    }
  },
  updateWorldEvent(ev, dt) {
    const A = this.arena;
    if (ev === 'breach') {
      this.breachT -= dt;
      if (this.breachT <= 0) {
        this.breachT = rand(4, 6);
        if (this.lockdownT <= 0) {
          const caps = A.props.filter((p) => !p.dead && p.def.id === 'capsule' && !p.open);
          if (caps.length && this.countAlive() < this.aliveCap() + 4) this.openCapsule(pick(caps));
          // vazamento perto de um tanque
          const tanks = A.props.filter((p) => !p.dead && p.def.id === 'biotank');
          if (tanks.length) {
            const t = pick(tanks);
            this.addCloud(t.x + rand(-1, 1), t.z + rand(-1, 1), { radius: 1.5, dps: 7, life: 5 });
          }
        }
      }
    } else if (ev === 'trial') {
      this.trialSpawnT -= dt;
      if (this.trialSpawnT <= 0 && this.countAlive() < this.aliveCap()) {
        this.trialSpawnT = rand(3.5, 5);
        const gates = A.graves.filter((g) => g.id === 'portcullis');
        const g = gates.length ? pick(gates) : pick(A.gates);
        this.onSpawnPoint(g);
        for (const t of this.wave >= 6 ? ['runner', 'runner', 'brute'] : ['runner', 'walker', 'walker']) this.spawnZombie(t, g.x + rand(-0.4, 0.4), g.z + rand(-0.4, 0.4));
      }
      if (Math.random() < dt * 0.25) this.audio.play('crowd', { volume: 0.35, rate: rand(0.9, 1.1) });
    } else if (ev === 'curse') {
      this.curseT -= dt;
      if (this.curseT <= 0 && this.countAlive() < this.aliveCap()) {
        this.curseT = rand(3, 4.5);
        const portals = A.graves.filter((g) => g.id === 'wportal');
        if (portals.length) {
          const g = pick(portals);
          this.onSpawnPoint(g);
          this.spawnZombie(this.wave >= 6 && Math.random() < 0.4 ? 'specter' : 'walker', g.x, g.z);
        }
        const sar = A.props.filter((p) => !p.dead && p.def.id === 'sarcophagus');
        if (sar.length && Math.random() < 0.5) this.destroyProp(pick(sar), null);
      }
    }
  },
  endWorldEvent(kind) {
    if (kind === 'trial' && this.players.some((p) => p.alive)) {
      this.ui.banner(`PROVA SUPERADA! ${this.trialKills} ABATES`, 'gold');
      this.audio.play('crowd', { volume: 1, rate: 1.2, priority: true });
      const c = { x: this.arena.W / 2, z: this.arena.D / 2 };
      const s = this.lootSpot(c.x, c.z);
      this.spawnPickup('supply', s.x, s.z, c);
    }
  },

  // ---- partículas ambientes (leves, sem atrapalhar o combate)
  updateAmbientParticles(dt) {
    const list = this.arena.def.particles;
    if (!list || this.settings.quality === 'low') return;
    const cx = this.camTarget.x;
    const cz = this.camTarget.z;
    for (const kind of list) {
      if (Math.random() > dt * 7) continue;
      const x = cx + rand(-14, 14);
      const z = cz + rand(-10, 10);
      if (kind === 'dust') this.parts.spawn(x, rand(0.2, 2.5), z, rand(0.2, 0.6), rand(-0.05, 0.1), rand(-0.2, 0.2), rand(0.04, 0.08), pick([0xc8b898, 0xa89878]), rand(2, 3.5), 0, 2);
      else if (kind === 'ash') this.parts.spawn(x, rand(3, 6), z, rand(-0.3, 0.3), rand(-0.6, -0.3), rand(-0.3, 0.3), rand(0.04, 0.07), pick([0x8a8a8a, 0x5a5a5a]), rand(3, 5), 0, 0);
      else if (kind === 'embers') this.parts.spawn(x, rand(0.1, 0.6), z, rand(-0.3, 0.3), rand(0.6, 1.4), rand(-0.3, 0.3), rand(0.03, 0.06), pick([0xff8a20, 0xffc040]), rand(1.5, 2.5), -0.2, 2);
      else if (kind === 'sparks') {
        if (Math.random() < 0.3) for (let k = 0; k < 4; k++) this.parts.spawn(x, rand(1, 2.4), z, rand(-2.5, 2.5), rand(0.5, 2.5), rand(-2.5, 2.5), 0.04, pick([0xffd040, 0xffffff, 0x9adcff]), 0.4, 12, 2);
      } else if (kind === 'spores') this.parts.spawn(x, rand(0.3, 1.8), z, rand(-0.2, 0.2), rand(0.05, 0.2), rand(-0.2, 0.2), rand(0.04, 0.07), pick([0xb060ff, 0x3ce0ff]), rand(2.5, 4), -0.02, 2);
      else if (kind === 'sand') this.parts.spawn(x - 3, rand(0.1, 1.2), z, rand(1.5, 3), rand(-0.1, 0.2), rand(-0.3, 0.3), rand(0.03, 0.06), pick([0xe0c890, 0xc8b078]), rand(1.5, 2.5), 0.3, 0);
      else if (kind === 'motes') this.parts.spawn(x, rand(0.5, 2.5), z, rand(-0.1, 0.1), rand(-0.05, 0.08), rand(-0.1, 0.1), rand(0.03, 0.05), pick([0xfff0c0, 0x40e0c0]), rand(3, 5), 0, 2);
      else if (kind === 'steam') this.parts.spawn(x, rand(0.1, 0.4), z, rand(-0.2, 0.2), rand(0.4, 0.8), rand(-0.2, 0.2), rand(0.14, 0.24), 0xc8d4dc, rand(1.2, 2), -0.2, 2);
    }
  },
};
