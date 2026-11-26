// Block Horde — Mixin de PvP Online (2 a 5 jogadores) + Horda de Zumbis (WebRTC P2P)
import { ARENAS, SURVIVORS } from '../data.js';
import { PvpPeer, PVP_MAX_PLAYERS } from './webrtc.js';
import { PVP_MOUNT_ORDER, pvpMountSpec, createPvpMountInstance } from './pvpMounts.js';

export const pvpMethods = {
  pvpState() {
    return this.pvp || null;
  },

  pvpLeave() {
    if (this.pvp?.peer) this.pvp.peer.close();
    this.pvp = null;
    this.pvpLocalIdx = 0;
  },

  pvpHost(arenaId, survivorId, mountId) {
    this.pvpLeave();
    const mId = pvpMountSpec(mountId || PVP_MOUNT_ORDER[0]).id;
    const state = {
      role: 'host',
      code: '',
      arenaId: arenaId || ARENAS[0].id,
      survivorId: survivorId || SURVIVORS[0].id,
      mountId: mId,
      status: 'creating',
      error: '',
      started: false,
      slots: [{ idx: 0, peerId: 'host', survivorId: survivorId || SURVIVORS[0].id, mountId: mId, label: 'Jogador 1 (Host)' }],
      kills: [0, 0, 0, 0, 0],
      syncT: 0,
      remoteTargets: {},
    };
    const refresh = () => { if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: 'lobby', arenaId: state.arenaId, survId: state.survivorId, mountId: state.mountId }, false); };
    const peer = new PvpPeer({
      ready: ({ code }) => {
        state.code = code;
        state.status = 'waiting';
        state.error = '';
        refresh();
      },
      connected: () => {
        state.status = 'waiting';
        refresh();
      },
      data: ({ msg, peerId }) => this.pvpOnData(msg, peerId),
      disconnected: ({ peerId, reason }) => {
        state.slots = state.slots.filter((s) => s.peerId !== peerId);
        state.slots.forEach((s, i) => { s.idx = i; });
        peer.broadcast({ t: 'lobby', arenaId: state.arenaId, slots: state.slots.map(({ idx, survivorId: sid, label }) => ({ idx, survivorId: sid, label })) });
        this.ui.alert(reason || 'Um jogador saiu da sala.', 'info', 'warning');
        refresh();
      },
      error: ({ message }) => {
        state.status = 'error';
        state.error = message || 'Erro na sala PvP.';
        refresh();
      },
    });
    state.peer = peer;
    this.pvp = state;
    state.code = peer.host();
    return state;
  },

  pvpStartFromHost() {
    const pv = this.pvp;
    if (!pv || pv.role !== 'host' || pv.slots.length < 2) return;
    pv.started = true;
    const aDef = ARENAS.find((a) => a.id === pv.arenaId) || ARENAS[0];
    const picks = pv.slots.map((s) => SURVIVORS.find((x) => x.id === s.survivorId) || SURVIVORS[0]);
    const survIds = picks.map((s) => s.id);
    const mountIds = pv.slots.map((s, i) => pvpMountSpec(s.mountId || PVP_MOUNT_ORDER[i % PVP_MOUNT_ORDER.length]).id);
    for (const s of pv.slots) {
      if (s.peerId !== 'host') pv.peer.sendTo(s.peerId, { t: 'start', arenaId: aDef.id, survIds, mountIds, myIdx: s.idx });
    }
    this.pvpLocalIdx = 0;
    this.startMatch(aDef, picks, 'pvp');
    this.initPvpMounts(mountIds);
    this.ui.alert(`PvP + Montarias iniciado com ${picks.length} jogadores!`, 'success', 'checkCircle');
  },

  pvpJoin(code, survivorId, mountId) {
    this.pvpLeave();
    const mId = pvpMountSpec(mountId || PVP_MOUNT_ORDER[1]).id;
    const state = {
      role: 'guest',
      code: String(code || '').toUpperCase().trim(),
      arenaId: ARENAS[0].id,
      survivorId: survivorId || SURVIVORS[1]?.id || SURVIVORS[0].id,
      mountId: mId,
      status: 'joining',
      error: '',
      started: false,
      slots: [],
      kills: [0, 0, 0, 0, 0],
      syncT: 0,
      remoteTargets: {},
    };
    const refresh = () => { if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: state.status === 'connected' || state.slots.length ? 'lobby' : 'join', survId: state.survivorId, mountId: state.mountId, code: state.code }, false); };
    const peer = new PvpPeer({
      ready: () => {
        state.status = 'connecting';
        refresh();
      },
      connected: () => {
        state.status = 'connected';
        peer.send({ t: 'hello', survivorId: state.survivorId, mountId: state.mountId });
        refresh();
      },
      data: ({ msg, peerId }) => this.pvpOnData(msg, peerId),
      disconnected: ({ reason }) => {
        state.status = 'disconnected';
        state.error = reason || 'O host encerrou a sala.';
        this.ui.alert(state.error, 'danger', 'warning');
        refresh();
      },
      error: ({ message }) => {
        state.status = 'error';
        state.error = message || 'Não foi possível conectar.';
        refresh();
      },
    });
    state.peer = peer;
    this.pvp = state;
    peer.join(state.code);
    return state;
  },

  pvpOnData(msg, peerId) {
    const pv = this.pvp;
    if (!pv || !msg) return;

    if (msg.t === 'full') {
      pv.status = 'error';
      pv.error = `Sala cheia (máximo ${PVP_MAX_PLAYERS} jogadores).`;
      if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: 'lobby', survId: pv.survivorId, code: pv.code }, false);
      return;
    }

    if (msg.t === 'hello' && pv.role === 'host') {
      if (pv.slots.length >= PVP_MAX_PLAYERS) {
        pv.peer.sendTo(peerId, { t: 'full' });
        return;
      }
      let existing = pv.slots.find((s) => s.peerId === peerId);
      if (!existing) {
        const idx = pv.slots.length;
        const mId = pvpMountSpec(msg.mountId || PVP_MOUNT_ORDER[idx % PVP_MOUNT_ORDER.length]).id;
        existing = { idx, peerId, survivorId: msg.survivorId || SURVIVORS[idx % SURVIVORS.length].id, mountId: mId, label: `Jogador ${idx + 1}` };
        pv.slots.push(existing);
      }
      const pubSlots = pv.slots.map(({ idx, survivorId: sid, mountId: mid, label }) => ({ idx, survivorId: sid, mountId: mid, label }));
      pv.peer.broadcast({ t: 'lobby', arenaId: pv.arenaId, slots: pubSlots });
      if (pv.started) {
        const aDef = ARENAS.find((a) => a.id === pv.arenaId) || ARENAS[0];
        const survIds = pv.slots.map((s) => s.survivorId || SURVIVORS[0].id);
        const mountIds = pv.slots.map((s, i) => pvpMountSpec(s.mountId || PVP_MOUNT_ORDER[i % PVP_MOUNT_ORDER.length]).id);
        pv.peer.sendTo(peerId, { t: 'start', arenaId: aDef.id, survIds, mountIds, myIdx: existing.idx });
      }
      if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: 'lobby', arenaId: pv.arenaId, survId: pv.survivorId, mountId: pv.mountId }, false);
      return;
    }

    if (msg.t === 'lobby' && pv.role === 'guest') {
      pv.arenaId = msg.arenaId || pv.arenaId;
      pv.slots = msg.slots || [];
      if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: 'lobby', survId: pv.survivorId, mountId: pv.mountId, code: pv.code }, false);
      return;
    }

    if (msg.t === 'start' && pv.role === 'guest') {
      pv.started = true;
      const aDef = ARENAS.find((a) => a.id === msg.arenaId) || ARENAS[0];
      const picks = (msg.survIds || []).map((id) => SURVIVORS.find((s) => s.id === id) || SURVIVORS[0]);
      const mountIds = (msg.mountIds || []).length ? msg.mountIds : picks.map((_, i) => PVP_MOUNT_ORDER[i % PVP_MOUNT_ORDER.length]);
      this.pvpLocalIdx = msg.myIdx || 1;
      this.startMatch(aDef, picks.length >= 2 ? picks : [SURVIVORS[0], SURVIVORS[1]], 'pvp');
      this.initPvpMounts(mountIds);
      this.ui.alert(`Conectado! PvP + Montarias com ${picks.length} jogadores!`, 'success', 'checkCircle');
      return;
    }

    if (msg.t === 'st') {
      if (typeof msg.idx === 'number' && msg.idx !== this.pvpLocalIdx) {
        pv.remoteTargets[msg.idx] = msg;
      }
      // host repassa o estado de cada convidado para os outros convidados
      if (pv.role === 'host') pv.peer.broadcast(msg, peerId);
      return;
    }

    if (msg.t === 'hit') {
      if (msg.targetIdx === this.pvpLocalIdx) {
        const me = this.players?.[this.pvpLocalIdx];
        const from = this.players?.[msg.fromIdx];
        if (me && me.alive && !this.debugGod) {
          const dmg = Math.max(1, Math.min(200, Number(msg.dmg) || 10));
          this.damagePlayer(me, dmg, from?.pos.x ?? me.pos.x, from?.pos.z ?? me.pos.z, 2);
          if (!me.alive) {
            const killMsg = { t: 'killed', killerIdx: msg.fromIdx, victimIdx: this.pvpLocalIdx };
            pv.peer.broadcast(killMsg);
            this.ui.alert('Você foi abatido por um rival! Renascendo em 3s...', 'danger', 'skull');
            setTimeout(() => {
              if (this.mode === 'pvp' && this.state === 'playing' && !me.alive) {
                me.alive = true;
                me.hp = me.maxHp;
                me.armor = 25;
                const sp = this.freeSpot(this.arena.W * 0.5, this.arena.D * 0.5, 2.5);
                me.pos.set(sp.x, 0, sp.z);
              }
            }, 3000);
          }
        }
      } else if (pv.role === 'host') {
        pv.peer.broadcast(msg, peerId);
      }
      return;
    }

    if (msg.t === 'killed') {
      if (typeof msg.killerIdx === 'number') {
        pv.kills[msg.killerIdx] = (pv.kills[msg.killerIdx] || 0) + 1;
        if (msg.killerIdx === this.pvpLocalIdx) {
          this.ui.alert(`Abate PvP! Seus abates: ${pv.kills[msg.killerIdx]}`, 'gold', 'trophy');
        }
      }
      if (pv.role === 'host') pv.peer.broadcast(msg, peerId);
    }
  },

  pvpTick(dt) {
    if (this.mode !== 'pvp' || !this.pvp?.peer?.connected || !this.players || this.players.length < 2) return;
    const pv = this.pvp;
    const localIdx = this.pvpLocalIdx || 0;
    const me = this.players[localIdx];
    if (!me) return;

    // envia estado local a ~20 Hz (inclui montaria PvP: id, montado, hp, destruída)
    pv.syncT += dt;
    const myM = me.pvpMount;
    if (myM) {
      myM.hurtT = Math.max(0, (myM.hurtT || 0) - dt);
      myM.skillCd = Math.max(0, (myM.skillCd || 0) - dt);
      if (me.isMounted && myM.alive) {
        myM.x = me.pos.x;
        myM.z = me.pos.z;
        myM.facing = me.facing;
        myM.walk = me.walk;
      }
    }
    if (pv.syncT >= 0.05) {
      pv.syncT = 0;
      pv.peer.broadcast({
        t: 'st',
        idx: localIdx,
        x: Math.round(me.pos.x * 100) / 100,
        z: Math.round(me.pos.z * 100) / 100,
        a: Math.round(me.facing * 100) / 100,
        hp: Math.round(me.hp),
        arm: Math.round(me.armor || 0),
        w: me.weapon,
        alive: me.alive ? 1 : 0,
        mId: myM?.id || '',
        mOn: me.isMounted && myM?.alive ? 1 : 0,
        mHp: Math.round(myM?.hp || 0),
        mDead: myM?.destroyed ? 1 : 0,
      });
    }

    // interpola posição/mira/montaria de todos os jogadores remotos (até 4)
    const k = Math.min(1, dt * 16);
    for (let i = 0; i < this.players.length; i++) {
      if (i === localIdx) continue;
      const other = this.players[i];
      const rt = pv.remoteTargets[i];
      if (!other || !rt) continue;
      const dx = (rt.x - other.pos.x) * k;
      const dz = (rt.z - other.pos.z) * k;
      other.pos.x += dx;
      other.pos.z += dz;
      other.walk += Math.hypot(dx, dz) * 2.6;
      other.facing = rt.a;
      other.hp = rt.hp;
      other.armor = rt.arm;
      other.alive = !!rt.alive;
      if (rt.w && other.weapon !== rt.w) other.weapon = rt.w;
      if (rt.mId && !other.pvpMount) other.pvpMount = createPvpMountInstance(other, rt.mId);
      if (other.pvpMount) {
        other.pvpMount.hp = rt.mHp ?? other.pvpMount.hp;
        other.pvpMount.destroyed = !!rt.mDead;
        other.pvpMount.alive = !other.pvpMount.destroyed;
        other.isMounted = !!rt.mOn && other.pvpMount.alive;
        if (other.isMounted) {
          other.pvpMount.x = other.pos.x;
          other.pvpMount.z = other.pos.z;
          other.pvpMount.facing = other.facing;
          other.pvpMount.walk = other.walk;
        }
      }
    }
  },

  // inicializa cada jogador montado na montaria escolhida no lobby PvP
  initPvpMounts(mountIds = []) {
    if (this.mode !== 'pvp' || !this.players) return;
    this.players.forEach((p, i) => {
      const mId = pvpMountSpec(mountIds[i] || PVP_MOUNT_ORDER[i % PVP_MOUNT_ORDER.length]).id;
      const inst = createPvpMountInstance(p, mId);
      p.pvpMount = inst;
      p.isMounted = true;
      p.mountId = mId;
      p.mountHp = inst.hp;
      p.mountMaxHp = inst.maxHp;
    });
  },

  // ataque físico corpo a corpo da montaria no PvP (sem projéteis, mísseis ou balas)
  pvpMountAttack(p, isSkill = false) {
    if (this.mode !== 'pvp' || !p?.isMounted || !p.pvpMount?.alive) return false;
    const m = p.pvpMount;
    const spec = m.spec;
    if (isSkill && m.skillCd > 0) return false;
    const range = isSkill ? spec.skillRange : spec.range;
    const dmg = isSkill ? spec.skillDmg : spec.dmg;
    const knock = isSkill ? spec.skillKnock : spec.knock;
    if (isSkill) m.skillCd = spec.skillCd;
    p.fireCd = isSkill ? Math.max(p.fireCd, 0.45) : spec.rate;
    p.firingT = 0.25;
    p.recoil = 0.35;
    this.audio.play(spec.sound || 'mnt_fork_hit', { volume: 0.7, pos: p.pos });
    const fx = Math.sin(p.facing);
    const fz = Math.cos(p.facing);
    // efeito visual de impacto físico frontal
    for (let k = 0; k < (isSkill ? 10 : 5); k++) {
      this.parts.spawn(p.pos.x + fx * (range * 0.65), 0.7, p.pos.z + fz * (range * 0.65), (Math.random() - 0.5) * 4, 1 + Math.random() * 2, (Math.random() - 0.5) * 4, 0.12, isSkill ? 0xffc107 : 0xeaedef, 0.35, 8, 1);
    }
    const localIdx = this.pvpLocalIdx || 0;
    // acerta zumbis da horda dentro do alcance físico
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const d = Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z);
      if (d <= range + z.radius) this.damageZombie(z, dmg, p, false, fx * knock, fz * knock);
    }
    // acerta rivais PvP dentro do alcance físico real
    if (p === this.players[localIdx] && this.pvp?.peer?.connected) {
      for (let i = 0; i < this.players.length; i++) {
        if (i === localIdx) continue;
        const other = this.players[i];
        if (!other || !other.alive) continue;
        const hitR = other.isMounted && other.pvpMount?.alive ? other.pvpMount.spec.radius : other.radius;
        const d = Math.hypot(other.pos.x - p.pos.x, other.pos.z - p.pos.z);
        if (d <= range + hitR) {
          this.pvp.peer.broadcast({ t: 'hit', fromIdx: localIdx, targetIdx: i, dmg });
        }
      }
    }
    return true;
  },

  // verifica se um disparo do jogador local acertou qualquer rival na arena (2 a 5 jogadores)
  pvpCheckHit(shooter, x0, z0, dx, dz, range, dmg) {
    if (this.mode !== 'pvp' || !this.pvp?.peer?.connected) return;
    const localIdx = this.pvpLocalIdx || 0;
    if (shooter !== this.players[localIdx]) return;
    for (let i = 0; i < this.players.length; i++) {
      if (i === localIdx) continue;
      const other = this.players[i];
      if (!other || !other.alive) continue;
      const rx = other.pos.x - x0, rz = other.pos.z - z0;
      const proj = rx * dx + rz * dz;
      if (proj < 0 || proj > range) continue;
      const perp = Math.abs(rx * dz - rz * dx);
      if (perp < 0.75) {
        this.pvp.peer.broadcast({ t: 'hit', fromIdx: localIdx, targetIdx: i, dmg: Math.max(4, Math.round(dmg * 0.45)) });
      }
    }
  },
};
