// Block Horde — Mixin de PvP Online (2 a 5 jogadores) + Horda de Zumbis (WebRTC P2P)
import { ARENAS, SURVIVORS } from '../data.js';
import { PvpPeer, PVP_MAX_PLAYERS } from './webrtc.js';

export const pvpMethods = {
  pvpState() {
    return this.pvp || null;
  },

  pvpLeave() {
    if (this.pvp?.peer) this.pvp.peer.close();
    this.pvp = null;
    this.pvpLocalIdx = 0;
  },

  pvpHost(arenaId, survivorId) {
    this.pvpLeave();
    const state = {
      role: 'host',
      code: '',
      arenaId: arenaId || ARENAS[0].id,
      survivorId: survivorId || SURVIVORS[0].id,
      status: 'creating',
      error: '',
      started: false,
      slots: [{ idx: 0, peerId: 'host', survivorId: survivorId || SURVIVORS[0].id, label: 'Jogador 1 (Host)' }],
      kills: [0, 0, 0, 0, 0],
      syncT: 0,
      remoteTargets: {},
    };
    const refresh = () => { if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: 'lobby', arenaId: state.arenaId, survId: state.survivorId }, false); };
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
    for (const s of pv.slots) {
      if (s.peerId !== 'host') pv.peer.sendTo(s.peerId, { t: 'start', arenaId: aDef.id, survIds, myIdx: s.idx });
    }
    this.pvpLocalIdx = 0;
    this.startMatch(aDef, picks, 'pvp');
    this.ui.alert(`PvP iniciado com ${picks.length} jogadores!`, 'success', 'checkCircle');
  },

  pvpJoin(code, survivorId) {
    this.pvpLeave();
    const state = {
      role: 'guest',
      code: String(code || '').toUpperCase().trim(),
      arenaId: ARENAS[0].id,
      survivorId: survivorId || SURVIVORS[1]?.id || SURVIVORS[0].id,
      status: 'joining',
      error: '',
      started: false,
      slots: [],
      kills: [0, 0, 0, 0, 0],
      syncT: 0,
      remoteTargets: {},
    };
    const refresh = () => { if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: state.status === 'connected' || state.slots.length ? 'lobby' : 'join', survId: state.survivorId, code: state.code }, false); };
    const peer = new PvpPeer({
      ready: () => {
        state.status = 'connecting';
        refresh();
      },
      connected: () => {
        state.status = 'connected';
        peer.send({ t: 'hello', survivorId: state.survivorId });
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
        existing = { idx, peerId, survivorId: msg.survivorId || SURVIVORS[idx % SURVIVORS.length].id, label: `Jogador ${idx + 1}` };
        pv.slots.push(existing);
      }
      const pubSlots = pv.slots.map(({ idx, survivorId: sid, label }) => ({ idx, survivorId: sid, label }));
      pv.peer.broadcast({ t: 'lobby', arenaId: pv.arenaId, slots: pubSlots });
      if (pv.started) {
        const aDef = ARENAS.find((a) => a.id === pv.arenaId) || ARENAS[0];
        const survIds = pv.slots.map((s) => s.survivorId || SURVIVORS[0].id);
        pv.peer.sendTo(peerId, { t: 'start', arenaId: aDef.id, survIds, myIdx: existing.idx });
      }
      if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: 'lobby', arenaId: pv.arenaId, survId: pv.survivorId }, false);
      return;
    }

    if (msg.t === 'lobby' && pv.role === 'guest') {
      pv.arenaId = msg.arenaId || pv.arenaId;
      pv.slots = msg.slots || [];
      if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { view: 'lobby', survId: pv.survivorId, code: pv.code }, false);
      return;
    }

    if (msg.t === 'start' && pv.role === 'guest') {
      pv.started = true;
      const aDef = ARENAS.find((a) => a.id === msg.arenaId) || ARENAS[0];
      const picks = (msg.survIds || []).map((id) => SURVIVORS.find((s) => s.id === id) || SURVIVORS[0]);
      this.pvpLocalIdx = msg.myIdx || 1;
      this.startMatch(aDef, picks.length >= 2 ? picks : [SURVIVORS[0], SURVIVORS[1]], 'pvp');
      this.ui.alert(`Conectado! PvP com ${picks.length} jogadores!`, 'success', 'checkCircle');
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

    // envia estado local a ~20 Hz (posição, mira, vida, arma e abates)
    pv.syncT += dt;
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
      });
    }

    // interpola posição/mira de todos os jogadores remotos (até 4)
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
      // PvP é sempre a pé: garante que nenhum estado de montaria sobreviva
      other.pvpMount = null;
      other.isMounted = false;
    }
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
