// Chefão Sobek, o Devorador + rodízio de chefões do Templo Antigo.
// Uso: npm run build:portable && npm run test:sobek
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
  const chefe = (wv) => g.buildWave(wv).find((t) => __bhTest.ENEMIES[t].boss);
  out.rodizio = [5, 10, 15, 20].map(chefe);
  out.filhoteForaDoSorteio = ![1, 3, 6, 9].some((wv) => g.buildWave(wv).includes('crocling'));
  const pl = g.players[0];
  setInterval(() => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; }, 50);
  g.zombies.length = 0;
  pl.hp = pl.maxHp = 5000; pl.armor = 0;
  const banners = [];
  const ob = g.ui.banner.bind(g.ui);
  g.ui.banner = (t, k) => { banners.push(t); return ob(t, k); };
  g.wave = 10;
  const s = g.spawnZombie('sobek', pl.pos.x + 3, pl.pos.z);
  out.entrada = s.rise > 1 && banners.includes('SOBEK, O DEVORADOR EMERGIU!') && g.boss === s;
  // giro com a cauda: anuncia parado e acerta ao redor
  s.tailCd = 0; s.rise = 0;
  out.caudaAnuncia = await espera(() => s.state === 'tail', 3000);
  const h0 = pl.hp;
  out.caudaAcerta = await espera(() => pl.hp <= h0 - 25, 3000);
  // fase 2: investidas mais frequentes e filhotes
  s.hp = s.maxHp * 0.6;
  out.fase2 = await espera(() => s.phase === 2, 3000);
  out.invulneravel = s.invulT > 0;
  out.investidaMaisFrequente = s.chargeCd <= 3.5;
  out.filhotes = await espera(() => g.zombies.some((q) => q.alive && q.type === 'crocling'), 5000);
  // fase 3: fúria
  const v = s.speed; s.invulT = 0;
  s.hp = s.maxHp * 0.3;
  out.fase3 = await espera(() => s.phase === 3, 3000);
  out.furiaMaisRapido = s.speed > v;
  out.avisos = banners.filter((t) => t.startsWith('SOBEK:'));
  s.invulT = 0; g.damageZombie(s, 1e6, 1, 0, pl);
  out.derrotado = !s.alive;
  return out;
});
console.log(JSON.stringify(R, null, 1));
const ok = R.rodizio.join() === 'pharaoh,sobek,bastet,pharaoh' && R.filhoteForaDoSorteio && R.entrada && R.caudaAnuncia && R.caudaAcerta && R.fase2 && R.invulneravel && R.investidaMaisFrequente && R.filhotes && R.fase3 && R.furiaMaisRapido && R.avisos.length === 2 && R.derrotado && !erros.length;
console.log(erros.length ? 'erros: ' + erros.join(' | ') : '', ok ? '✓ Sobek ok' : '✗ falhou');
await b.close();
srv.close();
process.exit(ok ? 0 : 1);
