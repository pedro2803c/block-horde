// Block Horde — PvP Online até 5 jogadores via WebRTC P2P (PeerJS, topologia estrela)
// O jogador 1 (host) cria a sala com código de 5 letras; até 4 convidados entram com o mesmo código.
import Peer from 'peerjs';

const PREFIX = 'bh-pvp-v1-';
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const PVP_MAX_PLAYERS = 5;

export function makeRoomCode(len = 5) {
  let out = '';
  for (let i = 0; i < len; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export class PvpPeer {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.peer = null;
    this.conns = new Map(); // peerId -> DataConnection (host: até 4; guest: 1 para o host)
    this.role = null; // 'host' | 'guest'
    this.code = '';
    this.closed = false;
  }

  get connected() {
    for (const c of this.conns.values()) if (c.open) return true;
    return false;
  }

  _emit(name, payload) {
    try { this.handlers[name]?.(payload); } catch (_) {}
  }

  _bindConn(conn) {
    const pid = conn.peer;
    this.conns.set(pid, conn);
    conn.on('open', () => {
      this._emit('connected', { role: this.role, code: this.code, peerId: pid });
    });
    conn.on('data', (msg) => {
      if (msg && typeof msg === 'object') this._emit('data', { msg, peerId: pid });
    });
    conn.on('close', () => {
      this.conns.delete(pid);
      this._emit('disconnected', { peerId: pid, reason: this.role === 'host' ? 'Um jogador saiu da sala.' : 'O host encerrou a sala.' });
    });
    conn.on('error', (err) => {
      this._emit('error', { peerId: pid, message: err?.message || 'Erro na conexão P2P.' });
    });
  }

  host(customCode = '') {
    this.close();
    this.closed = false;
    this.role = 'host';
    this.code = (customCode || makeRoomCode(5)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || makeRoomCode(5);
    this.peer = new Peer(PREFIX + this.code, { debug: 0 });
    this.peer.on('open', () => {
      this._emit('ready', { role: 'host', code: this.code });
    });
    this.peer.on('connection', (conn) => {
      if (this.conns.size >= PVP_MAX_PLAYERS - 1) {
        conn.on('open', () => { try { conn.send({ t: 'full' }); } catch (_) {} conn.close(); });
        return;
      }
      this._bindConn(conn);
    });
    this.peer.on('error', (err) => {
      if (err?.type === 'unavailable-id' && !customCode) {
        this.host(makeRoomCode(5));
        return;
      }
      this._emit('error', { message: err?.type === 'network' ? 'Sem conexão com o servidor de pareamento.' : (err?.message || 'Erro ao criar sala.') });
    });
    return this.code;
  }

  join(rawCode) {
    this.close();
    this.closed = false;
    this.role = 'guest';
    this.code = String(rawCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (this.code.length < 4) {
      this._emit('error', { message: 'Digite um código de sala válido (4 a 6 caracteres).' });
      return;
    }
    this.peer = new Peer(undefined, { debug: 0 });
    this.peer.on('open', () => {
      this._emit('ready', { role: 'guest', code: this.code });
      const conn = this.peer.connect(PREFIX + this.code, { reliable: false });
      this._bindConn(conn);
    });
    this.peer.on('error', (err) => {
      const msg = err?.type === 'peer-unavailable'
        ? `Sala "${this.code}" não encontrada. Confira o código com o jogador 1.`
        : (err?.message || 'Não foi possível entrar na sala.');
      this._emit('error', { message: msg });
    });
  }

  sendTo(peerId, msg) {
    const c = this.conns.get(peerId);
    if (!c || !c.open) return false;
    try { c.send(msg); return true; } catch (_) { return false; }
  }

  broadcast(msg, exceptPeerId = null) {
    let sent = 0;
    for (const [pid, c] of this.conns.entries()) {
      if (pid === exceptPeerId || !c.open) continue;
      try { c.send(msg); sent++; } catch (_) {}
    }
    return sent;
  }

  send(msg) {
    return this.broadcast(msg) > 0;
  }

  close() {
    this.closed = true;
    for (const c of this.conns.values()) { try { c.close(); } catch (_) {} }
    this.conns.clear();
    try { this.peer?.destroy(); } catch (_) {}
    this.peer = null;
  }
}
