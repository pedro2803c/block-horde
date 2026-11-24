// Integração da economia ao jogo (mixin do Game): drop, coleta, carteira da partida, loja e perda na morte.
import { WEAPONS } from './data.js';
import {
  coinReward, COIN_PILE_LIMIT, COIN_LIFE, COIN_MERGE_DIST, COIN_PICK_DIST, COIN_MAGNET_DIST,
  SHOP_ITEMS, shopItem, loadShop, saveShop, logTx,
} from './economy.js';

const rand = (a, b) => a + Math.random() * (b - a);

export const EconomyMixin = {
  // ---------------------------------------------------------------- partida
  econReset() {
    this.wallet = 0; // saldo temporário da partida (compartilhado no co-op)
    this.coins = []; // montes de moedas no chão
    this.econ = { earned: 0, spent: 0, lost: 0, drops: 0, bought: [], lossDone: false };
    this.coinSndT = 0;
    this.coinBurst = 0; // moedas coletadas no último instante (indicador "+N" e som proporcional)
    this.coinBurstT = 0;
    this.shopData = loadShop();
  },

  // itens permanentes comprados e equipados entram em toda partida
  applyPermanent(p) {
    const s = this.shopData || loadShop();
    for (const it of SHOP_ITEMS) {
      if (!s.owned[it.id] || s.equipped[it.id] === false) continue;
      if (it.kind === 'weapon') {
        if (!WEAPONS[it.item]) continue;
        this.unlocked.add(it.item);
        p.ammo[it.item] = (p.ammo[it.item] || 0) + (WEAPONS[it.item].start === Infinity ? Infinity : WEAPONS[it.item].start);
        if (this.fillClip) this.fillClip(p, it.item);
      } else if (it.kind === 'gear') {
        if (it.item === 'helmet') p.helmet = true;
        else if (it.item === 'boots') p.boots = true;
        else if (it.item === 'backpack') p.pack = true;
        else if (it.item === 'vest') p.armor = p.maxArmor;
      }
    }
  },

  // ---------------------------------------------------------------- drop
  dropCoins(z) {
    if (this.demo || z.coinDone || !this.coins) return;
    z.coinDone = true; // nunca paga o mesmo inimigo duas vezes
    if (z.summoned || z.def.static) return; // invocados e estruturas não pagam (evita farming)
    const { tier, value } = coinReward(z.def, this.diff?.mul?.xp || 1);
    if (!value) return;
    this.econ.drops += value;
    // chefão: chuva de vários montes; demais: 1 monte
    const parts = tier === 'boss' ? 8 : 1;
    for (let k = 0; k < parts; k++) {
      const v = Math.round(value / parts) + (k === 0 ? value - Math.round(value / parts) * parts : 0);
      const a = rand(0, Math.PI * 2);
      const r = parts > 1 ? rand(0.6, 2.2) : rand(0, 0.35);
      this.addCoinPile(z.pos.x + Math.sin(a) * r, z.pos.z + Math.cos(a) * r, v, z.pos);
    }
    this.audio.play(tier === 'boss' ? 'coin_big' : 'coin_drop', { volume: tier === 'boss' ? 0.9 : 0.35, pos: z.pos, rate: rand(0.92, 1.1), priority: tier === 'boss' });
    if (tier === 'boss') this.ui.banner(`RECOMPENSA DO CHEFÃO: ${value} MOEDAS`, 'gold');
  },

  addCoinPile(x, z, v, from) {
    const A = this.arena;
    if (!A.inb(Math.floor(x), Math.floor(z)) || A.circleBlocked(x, z, 0.2)) { x = from.x; z = from.z; }
    // agrupa com monte próximo (menos objetos no cenário)
    const near = this.coins.find((c) => !c.taken && Math.hypot(c.x - x, c.z - z) < COIN_MERGE_DIST);
    if (near) { near.v += v; near.t = Math.min(near.t, 2); return near; }
    if (this.coins.length >= COIN_PILE_LIMIT) {
      // limite atingido: soma no monte mais próximo em vez de criar outro
      let best = this.coins[0];
      for (const c of this.coins) if (Math.hypot(c.x - x, c.z - z) < Math.hypot(best.x - x, best.z - z)) best = c;
      best.v += v;
      return best;
    }
    const c = { x, z, v, t: 0, fall: 0.45, sx: from.x, sz: from.z, taken: false };
    this.coins.push(c);
    return c;
  },

  // ---------------------------------------------------------------- coleta
  updateCoins(dt) {
    if (!this.coins) return;
    this.coinSndT -= dt;
    this.coinBurstT -= dt;
    if (this.coinBurstT <= 0 && this.coinBurst) {
      // som proporcional ao total juntado no instante
      const n = this.coinBurst;
      this.audio.play(n >= 100 ? 'coin_big' : n >= 25 ? 'coin_multi' : 'coin_pick', { volume: n >= 100 ? 0.8 : 0.55, rate: rand(0.95, 1.06) });
      this.coinBurst = 0;
    }
    for (const c of this.coins) {
      c.t += dt;
      if (c.fall > 0) { c.fall = Math.max(0, c.fall - dt); continue; }
      for (const p of this.players) {
        if (!p.alive || c.taken) continue;
        const d = Math.hypot(p.pos.x - c.x, p.pos.z - c.z);
        if (d < COIN_MAGNET_DIST && d > 0.01) {
          // ímã curto: o monte desliza até o jogador
          const sp = Math.min(d, dt * (4 + (COIN_MAGNET_DIST - d) * 4));
          c.x += ((p.pos.x - c.x) / d) * sp;
          c.z += ((p.pos.z - c.z) / d) * sp;
        }
        if (Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < COIN_PICK_DIST) this.takeCoins(p, c);
      }
    }
    for (let i = this.coins.length - 1; i >= 0; i--) if (this.coins[i].taken || this.coins[i].t > COIN_LIFE) this.coins.splice(i, 1);
  },

  takeCoins(p, c) {
    if (c.taken) return;
    c.taken = true;
    this.wallet += c.v;
    this.econ.earned += c.v;
    if (!this.coinBurst) this.coinBurstT = 0.12; // agrupa coletas seguidas num único som
    this.coinBurst += c.v;
    this.ui.coinGain?.(c.v);
    for (let k = 0; k < Math.min(10, 3 + Math.floor(c.v / 20)); k++) this.parts.spawn(c.x + rand(-0.2, 0.2), 0.5, c.z + rand(-0.2, 0.2), rand(-1.2, 1.2), rand(2, 4), rand(-1.2, 1.2), rand(0.06, 0.1), k % 3 ? 0xffc107 : 0xfff3b0, 0.5, 6, 2);
  },

  // ---------------------------------------------------------------- desenho (monte de moedas girando, com brilho)
  drawCoins(B, G) {
    if (!this.coins) return;
    for (const c of this.coins) {
      if (COIN_LIFE - c.t < 6 && Math.sin(c.t * 14) < -0.2) continue; // pisca antes de sumir
      let x = c.x;
      let z = c.z;
      let y = 0.32 + Math.sin(c.t * 3 + c.x) * 0.05;
      if (c.fall > 0) {
        const f = 1 - c.fall / 0.45;
        x = c.sx + (c.x - c.sx) * f;
        z = c.sz + (c.z - c.sz) * f;
        y += Math.sin(f * Math.PI) * 1.2;
      }
      const n = Math.min(5, 1 + Math.floor(Math.log2(1 + c.v / 6)));
      const ry = c.t * 3;
      for (let k = 0; k < n; k++) {
        const ox = (k % 2 ? 0.09 : -0.09) * (k > 0);
        const oz = (k % 3 ? 0.07 : -0.06) * (k > 0);
        B.box(x + ox, y + k * 0.07, z + oz, 0.36, 0.065, 0.36, k % 2 ? 0xe0a800 : 0xffc107, ry + k);
      }
      G.box(x, y + n * 0.07 + 0.01, z, 0.2, 0.03, 0.2, 0xfff3b0, ry);
    }
  },

  // ---------------------------------------------------------------- loja
  // compras liberadas durante a partida sempre que houver saldo (o jogo fica pausado com a loja aberta)
  canBuyNow() {
    return (this.state === 'paused' || this.state === 'playing') && !this.demo;
  },
  openShop() {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    this.state = 'paused';
    this.clearInput?.();
    this.audio.play('shop_open', { volume: 0.7 });
    this.ui.showScreen('shop', { inMatch: true });
    this.canvas.style.cursor = 'default';
  },
  // compra: valida tudo antes de descontar; só desconta uma vez (botão some após a compra)
  buy(id) {
    const it = shopItem(id);
    if (!it) return { ok: false, reason: 'Item inexistente.' };
    const inMatch = this.state === 'paused' || this.state === 'playing';
    if (!inMatch) return this.deny('As moedas só existem durante a partida. Compre no intervalo entre ondas.');
    if (!this.canBuyNow()) return this.deny('Compras liberadas só no intervalo entre ondas.');
    const s = this.shopData;
    if (it.kind !== 'consumable' && s.owned[id]) return this.deny('Você já possui este item.');
    if (this.wallet < it.price) return this.deny(`Saldo insuficiente: faltam ${it.price - this.wallet} moedas.`);
    if (it.kind === 'consumable') {
      const p = this.players.find((q) => q.alive) || this.players[0];
      if (!this.collect(p, { type: it.item })) return this.deny('Agora não tem efeito (vida ou armadura já cheias).');
    }
    this.wallet -= it.price;
    this.econ.spent += it.price;
    this.econ.bought.push(id);
    if (it.kind !== 'consumable') {
      s.owned[id] = true;
      s.equipped[id] = true;
      // permanente: já vale nesta partida também
      for (const p of this.players) this.applyOne(p, it);
      logTx(s, 'buy', { id, price: it.price });
      saveShop(s);
    }
    this.audio.play(it.rarity === 'legendary' ? 'shop_legend' : 'shop_buy', { volume: 0.85, priority: true });
    return { ok: true };
  },
  applyOne(p, it) {
    const s = this.shopData;
    const prev = { ...s.owned };
    s.owned = { [it.id]: true };
    const eq = { ...s.equipped };
    s.equipped = { [it.id]: true };
    this.applyPermanent(p);
    s.owned = prev;
    s.equipped = eq;
  },
  deny(reason) {
    this.audio.play('shop_deny', { volume: 0.7 });
    return { ok: false, reason };
  },
  toggleEquip(id) {
    const s = (this.shopData ||= loadShop());
    if (!s.owned[id]) return false;
    s.equipped[id] = s.equipped[id] === false;
    saveShop(s);
    this.audio.play(s.equipped[id] ? 'equip' : 'unequip', { volume: 0.7 });
    return s.equipped[id];
  },

  // ---------------------------------------------------------------- morte: perde 100% do saldo temporário, uma única vez
  loseCoinsOnDeath() {
    if (!this.econ || this.econ.lossDone || this.demo) return 0;
    this.econ.lossDone = true;
    const lost = this.wallet;
    if (lost <= 0) return 0; // sem saldo: nada a perder, sem som de perda
    this.wallet = 0;
    this.econ.lost += lost;
    for (const c of this.coins) c.taken = true; // moedas no chão também somem
    const s = (this.shopData ||= loadShop());
    logTx(s, 'death_loss', { lost, wave: this.wave });
    saveShop(s);
    setTimeout(() => this.audio.play('coin_loss', { volume: 0.85, priority: true }), 650); // depois do som de morte
    return lost;
  },
};
