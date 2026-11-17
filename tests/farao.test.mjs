// Chefão Faraó Renegado: entrada, 3 fases, ataques e chefão do Templo Antigo.
// Uso: npm run build:portable && npm run test:farao
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
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });

const R = await p.evaluate(async () => {
  const g = __bh;
  const { ARENAS, SURVIVORS } = __bhTest;
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const espera = async (fn, ms = 8000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await w(80); } return false; };
  const out = {};
  const templo = ARENAS.find((a) => a.id === 'templo');
  g.startMatch(templo, [SURVIVORS[0]], 'solo');
  out.chefaoDoTemplo = g.buildWave(5).includes('pharaoh');
  g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
  out.foraDoTemplo = g.buildWave(5).includes('pharaoh');
  g.startMatch(templo, [SURVIVORS[0]], 'solo');
  const pl = g.players[0];
  setInterval(() => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; }, 50);
  g.zombies.length = 0;
  pl.hp = pl.maxHp = 5000;
  let banners = [];
  const ob = g.ui.banner.bind(g.ui);
  g.ui.banner = (t, k) => { banners.push(t); return ob(t, k); };
  g.wave = 5;
  const f = g.spawnZombie('pharaoh', pl.pos.x + 7, pl.pos.z);
  out.entradaEmerge = f.rise > 1;
  out.avisoEntrada = banners.includes('O FARAÓ RENEGADO DESPERTOU!');
  out.barraDeVida = g.boss === f;
  // fase 1: ondas de energia e explosões no chão
  f.waveCd = 0; f.blastCd = 0;
  out.ondasDeEnergia = await espera(() => g.projectiles.filter((q) => q.kind === 'acid').length >= 8, 3000);
  // explosões caem em pontos aleatórios perto do jogador (dá para desviar): conta as explosões
  let boom = 0; const oe = g.explosion.bind(g); g.explosion = (...a) => { boom++; return oe(...a); };
  out.explosaoNoChao = await espera(() => boom >= 2, 4000);
  g.explosion = oe;
  // fase 2
  f.hp = f.maxHp * 0.6;
  out.fase2 = await espera(() => f.phase === 2, 3000);
  out.invulneravelNaTroca = f.invulT > 0 && (() => { const h = f.hp; g.damageZombie(f, 50, 1, 0, pl); return f.hp === h; })();
  out.invocaMumias = await espera(() => g.zombies.some((q) => q.alive && q.type === 'mummy'), 5000);
  out.tempestade = await espera(() => g.sandStormT > 0 && pl.slowT > 0, 5000);
  // fase 3
  const v2 = f.speed;
  f.invulT = 0;
  f.hp = f.maxHp * 0.3;
  out.fase3 = await espera(() => f.phase === 3, 3000);
  out.maisRapidoNaFase3 = f.speed > v2;
  out.avisosDeFase = banners.filter((t) => t.startsWith('FARAÓ:'));
  // derrota
  f.invulT = 0;
  g.damageZombie(f, 1e6, 1, 0, pl);
  out.derrotado = !f.alive && g.sandStormT === 0;
  // print: faraó na arena
  g.zombies.length = 0; g.projectiles.length = 0;
  const v = g.spawnZombie('pharaoh', pl.pos.x, pl.pos.z + 4);
  v.rise = 0; v.speed = 0; v.facing = 0;
  g.debugGod = true;
  return out;
});
await p.waitForTimeout(1500);
fs.mkdirSync('tests/hud-shots', { recursive: true });
await p.screenshot({ path: 'tests/hud-shots/farao.png' });
console.log(JSON.stringify(R, null, 1));
const ok = R.chefaoDoTemplo && !R.foraDoTemplo && R.entradaEmerge && R.avisoEntrada && R.barraDeVida && R.ondasDeEnergia && R.explosaoNoChao && R.fase2 && R.invulneravelNaTroca && R.invocaMumias && R.tempestade && R.fase3 && R.maisRapidoNaFase3 && R.avisosDeFase.length === 2 && R.derrotado && !erros.length;
console.log(erros.length ? 'erros: ' + erros.join(' | ') : '', ok ? '✓ Faraó ok' : '✗ falhou');
await b.close();
srv.close();
process.exit(ok ? 0 : 1);
