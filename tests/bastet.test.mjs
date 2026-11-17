// Chefão Bastet Sombria: teletransporte, projéteis, clones e tempestade de energia.
// Uso: npm run build:portable && npm run test:bastet
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/fav')) return r.writeHead(204).end();
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream('portable/BlockHorde.html').pipe(r);
});
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
await p.goto(`http://localhost:${srv.address().port}/?test`);
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 120000 });
const R = await p.evaluate(async () => {
  const g = __bh;
  const { ARENAS, SURVIVORS } = __bhTest;
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const espera = async (fn, ms = 8000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await w(80); } return false; };
  const out = {};
  const templo = ARENAS.find((a) => a.id === 'templo');
  g.startMatch(templo, [SURVIVORS[0]], 'solo');
  out.ondaDaBastet = g.buildWave(15).includes('bastet');
  const pl = g.players[0];
  setInterval(() => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; }, 50);
  g.zombies.length = 0;
  pl.hp = pl.maxHp = 5000; pl.armor = 0;
  const banners = [];
  const ob = g.ui.banner.bind(g.ui);
  g.ui.banner = (t, k) => { banners.push(t); return ob(t, k); };
  g.wave = 15;
  const s = g.spawnZombie('bastet', pl.pos.x + 6, pl.pos.z);
  out.entrada = s.rise > 0.5 && banners.includes('BASTET SOMBRIA SURGIU DAS SOMBRAS!') && g.boss === s;
  s.rise = 0;
  // teletransporte
  s.tpCd = 0;
  const p0 = { x: s.pos.x, z: s.pos.z };
  out.teletransporta = await espera(() => Math.hypot(s.pos.x - p0.x, s.pos.z - p0.z) > 2, 3000);
  out.reapareceaPerto = Math.hypot(s.pos.x - pl.pos.x, s.pos.z - pl.pos.z) < 8;
  // leque de projéteis mágicos
  g.projectiles.length = 0; s.boltCd = 0;
  out.projeteisMagicos = await espera(() => g.projectiles.filter((q) => q.kind === 'acid' && q.color === 0xc070ff).length >= 3, 3000);
  // fase 2: clones
  s.hp = s.maxHp * 0.6;
  out.fase2 = await espera(() => s.phase === 2, 3000);
  out.clones = await espera(() => g.zombies.filter((q) => q.alive && q.type === 'bastetclone').length >= 2, 6000);
  const c = g.zombies.find((q) => q.alive && q.type === 'bastetclone');
  if (c) g.damageZombie(c, 45, 1, 0, pl);
  out.cloneFragil = c ? !c.alive : false;
  // fase 3: tempestade de energia sombria
  s.invulT = 0;
  s.hp = s.maxHp * 0.3;
  out.fase3 = await espera(() => s.phase === 3, 3000);
  s.blastCd = 0; s.invulT = 0;
  const h0 = pl.hp;
  out.tempestadeDeEnergia = await espera(() => pl.hp < h0 - 5, 4000);
  out.avisos = banners.filter((t) => t.startsWith('BASTET:'));
  s.invulT = 0; g.damageZombie(s, 1e6, 1, 0, pl);
  out.derrotada = !s.alive;
  return out;
});
console.log(JSON.stringify(R, null, 1));
const ok = R.ondaDaBastet && R.entrada && R.teletransporta && R.reapareceaPerto && R.projeteisMagicos && R.fase2 && R.clones && R.cloneFragil && R.fase3 && R.tempestadeDeEnergia && R.avisos.length === 2 && R.derrotada && !erros.length;
console.log(erros.length ? 'erros: ' + erros.join(' | ') : '', ok ? '✓ Bastet ok' : '✗ falhou');
await b.close();
srv.close();
process.exit(ok ? 0 : 1);
