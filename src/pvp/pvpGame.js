// Block Horde — Mixin de PvP Online 1v1 + Horda de Zumbis (WebRTC P2P)
import { ARENAS, SURVIVORS } from '../data.js';
import { PvpPeer } from './webrtc.js';

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
      kills: [0, 0],
      syncT: 0,
      remoteTarget: null,
    };
    const peer = new PvpPeer({
      ready: ({ code }) => {
        state.code = code;
        state.status = 'waiting';
        state.error = '';
        if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { tab: 'host' }, false);
      },
      connected: () => {
        state.status = 'connected';
        if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { tab: 'host' }, false);
      },
      data: (msg) => this.pvpOnData(msg),
      disconnected: ({ reason }) => {
        state.status = 'disconnected';
        state.error = reason || 'Conexão encerrada.';
        this.ui.alert(state.error, 'danger', 'warning');
        if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { tab: 'host' }, false);
      },
      error: ({ message }) => {
        state.status = 'error';
        state.error = message || 'Erro na sala PvP.';
        if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { tab: 'host' }, false);
      },
    });
    state.peer = peer;
    this.pvp = state;
    state.code = peer.host();
    return state;
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
      kills: [0, 0],
      syncT: 0,
      remoteTarget: null,
    };
    const peer = new PvpPeer({
      ready: () => {
        state.status = 'connecting';
        if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { tab: 'join' }, false);
      },
      connected: () => {
        state.status = 'connected';
        peer.send({ t: 'hello', survivorId: state.survivorId });
        if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { tab: 'join' }, false);
      },
      data: (msg) => this.pvpOnData(msg),
      disconnected: ({ reason }) => {
        state.status = 'disconnected';
        state.error = reason || 'O host encerrou a sala.';
        this.ui.alert(state.error, 'danger', 'warning');
        if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { tab: 'join' }, false);
      },
      error: ({ message }) => {
        state.status = 'error';
        state.error = message || 'Não foi possível conectar.';
        if (this.ui.screen === 'pvp') this.ui.showScreen('pvp', { tab: 'join' }, false);
      },
    });
    state.peer = peer;
    this.pvp = state;
    peer.join(state.code);
    return state;
  },

  pvpOnData(msg) {
    const pv = this.pvp;
    if (!pv || !msg) return;
    if (msg.t === 'hello' && pv.role === 'host') {
      const aDef = ARENAS.find((a) => a.id === pv.arenaId) || ARENAS[0];
      const s0 = SURVIVORS.find((s) => s.id === pv.survivorId) || SURVIVORS[0];
      const s1 = SURVIVORS.find((s) => s.id === msg.survivorId) || SURVIVORS[1] || SURVIVORS[0];
      pv.peer.send({ t: 'start', arenaId: aDef.id, s0: s0.id, s1: s1.id });
      this.pvpLocalIdx = 0;
      this.startMatch(aDef, [s0, s1], 'pvp');
      this.ui.alert('Jogador 2 entrou! Duelo PvP + Horda iniciado!', 'success', 'checkCircle');
    } else if (msg.t === 'start' && pv.role === 'guest') {
      const aDef = ARENAS.find((a) => a.id === msg.arenaId) || ARENAS[0];
      const s0 = SURVIVORS.find((s) => s.id === msg.s0) || SURVIVORS[0];
      const s1 = SURVIVORS.find((s) => s.id === msg.s1) || SURVIVORS[1] || SURVIVORS[0];
      this.pvpLocalIdx = 1;
      this.startMatch(aDef, [s0, s1], 'pvp');
      this.ui.alert('Conectado! Duelo PvP + Horda iniciado!', 'success', 'checkCircle');
    } else if (msg.t === 'st') {
      pv.remoteTarget = msg;
    } else if (msg.t === 'hit') {
      const me = this.players?.[this.pvpLocalIdx];
      if (me && me.alive && !this.debugGod) {
        const dmg = Math.max(1, Math.min(200, Number(msg.dmg) || 10));
        this.damagePlayer(me, dmg, 'pvp');
        if (!me.alive) {
          pv.peer.send({ t: 'killed' });
          this.ui.alert('Você foi abatido pelo rival! Renascendo em 3s...', 'danger', 'skull');
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
    } else if (msg.t === 'killed') {
      pv.kills[this.pvpLocalIdx] = (pv.kills[this.pvpLocalIdx] || 0) + 1;
      this.ui.alert(`Abate PvP! Placar: ${pv.kills[0]} x ${pv.kills[1]}`, 'gold', 'trophy');
    }
  },

  pvpTick(dt) {
    if (this.mode !== 'pvp' || !this.pvp?.peer?.connected || !this.players || this.players.length < 2) return;
    const pv = this.pvp;
    const localIdx = this.pvpLocalIdx || 0;
    const remoteIdx = localIdx === 0 ? 1 : 0;
    const me = this.players[localIdx];
    const other = this.players[remoteIdx];
    if (!me || !other) return;

    // envia estado local a ~20 Hz
    pv.syncT += dt;
    if (pv.syncT >= 0.05) {
      pv.syncT = 0;
      pv.peer.send({
        t: 'st',
        x: Math.round(me.pos.x * 100) / 100,
        z: Math.round(me.pos.z * 100) / 100,
        a: Math.round(me.facing * 100) / 100,
        hp: Math.round(me.hp),
        arm: Math.round(me.armor || 0),
        w: me.weapon,
        alive: me.alive ? 1 : 0,
      });
    }

    // interpola posição/mira do jogador remoto
    const rt = pv.remoteTarget;
    if (rt) {
      const k = Math.min(1, dt * 16);
      other.pos.x += (rt.x - other.pos.x) * k;
      other.pos.z += (rt.z - other.pos.z) * k;
      other.facing = rt.a;
      other.hp = rt.hp;
      other.armor = rt.arm;
      other.alive = !!rt.alive;
      if (rt.w && other.weapon !== rt.w) other.weapon = rt.w;
    }
  },

  // verifica se um disparo do jogador local acertou o rival no modo PvP
  pvpCheckHit(shooter, x0, z0, dx, dz, range, dmg) {
    if (this.mode !== 'pvp' || !this.pvp?.peer?.connected) return;
    const localIdx = this.pvpLocalIdx || 0;
    if (shooter !== this.players[localIdx]) return;
    const other = this.players[localIdx === 0 ? 1 : 0];
    if (!other || !other.alive) return;
    const rx = other.pos.x - x0, rz = other.pos.z - z0;
    const proj = rx * dx + rz * dz;
    if (proj < 0 || proj > range) return;
    const perp = Math.abs(rx * dz - rz * dx);
    if (perp < 0.75) {
      this.pvp.peer.send({ t: 'hit', dmg: Math.max(4, Math.round(dmg * 0.45)) });
    }
  },
};
