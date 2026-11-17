// Chefão final A Esfinge Eterna: ondas de choque, desmoronamento, construtos e raio de energia.
// Uso: npm run build:portable && npm run test:esfinge
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
  out.ondaDaEsfinge = g.buildWave(20).includes('sphinx');
  const pl = g.players[0];
  setInterval(() => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; }, 50);
  g.zombies.length = 0;
  pl.hp = pl.maxHp = 5000; pl.armor = 0;
  const banners = [];
  const ob = g.ui.banner.bind(g.ui);
  g.ui.banner = (t, k) => { banners.push(t); return ob(t, k); };
  g.wave = 20;
  const s = g.spawnZombie('sphinx', pl.pos.x + 5, pl.pos.z);
  out.entrada = s.rise > 1 && banners.includes('A ESFINGE ETERNA DESPERTOU!') && g.boss === s;
  s.rise = 0;
  // pancada com onda de choque
  let qk = 0; const oq = g.quake.bind(g); g.quake = (z, q) => { qk++; return oq(z, q); };
  s.pos.set(pl.pos.x + 2, 0, pl.pos.z); s.slamCd = 0;
  out.pancadaComOndaDeChoque = await espera(() => qk > 0, 8000);
  g.quake = oq;
  // fase 2: pedras caindo e construtos
  s.hp = s.maxHp * 0.6;
  out.fase2 = await espera(() => s.phase === 2, 3000);
  // pedras: cada uma é marcada no chão e cai 1,2 s depois (conta as quedas agendadas)
  let pedras = 0; const ol = g.later.bind(g); g.later = (t, fn) => { if (t === 1.2) pedras++; return ol(t, fn); };
  s.rockCd = 0;
  out.pedrasCaindo = await espera(() => pedras >= 3, 3000);
  g.later = ol;
  out.construtos = await espera(() => g.zombies.some((q) => q.alive && q.type === 'construct'), 6000);
  // fase 3: raio de energia anunciado
  s.invulT = 0;
  s.hp = s.maxHp * 0.3;
  out.fase3 = await espera(() => s.phase === 3, 3000);
  s.invulT = 0; s.beamCd = 0; s.state = 'move';
  s.pos.set(pl.pos.x + 6, 0, pl.pos.z);
  out.raioAnuncia = await espera(() => s.state === 'beam', 4000);
  const h0 = pl.hp;
  out.raioAcerta = await espera(() => pl.hp <= h0 - 30, 3000);
  out.avisos = banners.filter((t) => t.startsWith('ESFINGE:'));
  s.invulT = 0; g.damageZombie(s, 1e6, 1, 0, pl);
  out.derrotada = !s.alive;
  return out;
});
console.log(JSON.stringify(R, null, 1));
const ok = R.ondaDaEsfinge && R.entrada && R.pancadaComOndaDeChoque && R.fase2 && R.pedrasCaindo && R.construtos && R.fase3 && R.raioAnuncia && R.raioAcerta && R.avisos.length === 2 && R.derrotada && !erros.length;
console.log(erros.length ? 'erros: ' + erros.join(' | ') : '', ok ? '✓ Esfinge ok' : '✗ falhou');
await b.close();
srv.close();
process.exit(ok ? 0 : 1);
