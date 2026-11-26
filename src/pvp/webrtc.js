// Block Horde — PvP Online 1v1 via WebRTC P2P (PeerJS, 100% gratuito)
// O jogador 1 (host) cria uma sala com código de 5 letras; o jogador 2 entra com o código.
import Peer from 'peerjs';

const PREFIX = 'bh-pvp-v1-';
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeRoomCode(len = 5) {
  let out = '';
  for (let i = 0; i < len; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export class PvpPeer {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.peer = null;
    this.conn = null;
    this.role = null; // 'host' | 'guest'
    this.code = '';
    this.connected = false;
    this.closed = false;
  }

  _emit(name, payload) {
    try { this.handlers[name]?.(payload); } catch (_) {}
  }

  _bindConn(conn) {
    this.conn = conn;
    conn.on('open', () => {
      this.connected = true;
      this._emit('connected', { role: this.role, code: this.code });
    });
    conn.on('data', (msg) => {
      if (msg && typeof msg === 'object') this._emit('data', msg);
    });
    conn.on('close', () => {
      this.connected = false;
      this._emit('disconnected', { reason: 'O outro jogador desconectou.' });
    });
    conn.on('error', (err) => {
      this._emit('error', { message: err?.message || 'Erro na conexão P2P.' });
    });
  }

  host(customCode = '') {
    this.close();
    this.closed = false;
    this.role = 'host';
    this.code = (customCode || makeRoomCode(5)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || makeRoomCode(5);
    const id = PREFIX + this.code;
    this.peer = new Peer(id, { debug: 0 });
    this.peer.on('open', () => {
      this._emit('ready', { role: 'host', code: this.code });
    });
    this.peer.on('connection', (conn) => {
      if (this.conn && this.connected) { conn.close(); return; }
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

  send(msg) {
    if (!this.conn || !this.connected) return false;
    try { this.conn.send(msg); return true; } catch (_) { return false; }
  }

  close() {
    this.closed = true;
    this.connected = false;
    try { this.conn?.close(); } catch (_) {}
    try { this.peer?.destroy(); } catch (_) {}
    this.conn = null;
    this.peer = null;
  }
}
