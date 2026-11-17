// Egito, etapa 11: sons próprios (sintetizados e tocados) e recompensas (itens dos elites, tesouro dos chefões).
// Uso: npm run build:portable && npm run test:egito-som
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/fav')) return r.writeHead(204).end();
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream('portable/BlockHorde.html').pipe(r);
});
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
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
  const espera = async (fn, ms = 6000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await w(80); } return false; };
  const out = {};
  const EG = ['eg_mummy', 'eg_hiss', 'eg_jackal', 'eg_scarab', 'eg_arrow', 'eg_magic', 'eg_horn', 'eg_sand', 'eg_beam', 'eg_rumble'];
  out.sonsSintetizados = EG.filter((n) => g.audio.buffers[n]?.duration > 0).length;
  const tocados = [];
  const op = g.audio.play.bind(g.audio);
  g.audio.play = (n, o) => { tocados.push(n); return op(n, o); };
  g.startMatch(ARENAS.find((a) => a.id === 'templo'), [SURVIVORS[0]], 'solo');
  const pl = g.players[0];
  setInterval(() => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; }, 50);
  g.zombies.length = 0; pl.hp = pl.maxHp = 5000; pl.armor = 0;
  const at = (t, dx) => { g.spawnZombie(t, pl.pos.x + dx, pl.pos.z); const z = g.zombies[g.zombies.length - 1]; z.rise = 0; return z; };
  // múmia: ataque e morte com som próprio
  const m = at('mummy', 1); m.attackCd = 0;
  out.somAtaqueMumia = await espera(() => tocados.includes('eg_mummy'));
  // arqueiro: flecha com som próprio
  g.zombies.length = 0; const a = at('archer', 7); a.spitCd = 0;
  out.somFlecha = await espera(() => tocados.includes('eg_arrow'));
  // chefão: trombeta na entrada
  g.zombies.length = 0; g.wave = 5;
  const f = g.spawnZombie('pharaoh', pl.pos.x + 7, pl.pos.z);
  out.trombetaDoChefao = tocados.includes('eg_horn');
  // tempestade de areia
  f.rise = 0; f.hp = f.maxHp * 0.6; f.stormCd = 0;
  out.somTempestade = await espera(() => tocados.includes('eg_sand'), 14000);
  // tesouro do templo ao derrotar
  const s0 = g.stats.score; const p0 = g.pickups.length;
  f.invulT = 0; g.damageZombie(f, 1e6, 1, 0, pl);
  out.tesouroPontos = g.stats.score - s0;
  out.tesouroItens = g.pickups.length - p0;
  // elite deixa item às vezes (Carruagem: 50%)
  let caiu = 0;
  for (let i = 0; i < 20; i++) { g.zombies.length = 0; const c = at('chariot', 12); const n0 = g.pickups.length; g.damageZombie(c, 1e6, 1, 0, pl); if (g.pickups.length > n0) caiu++; }
  out.carruagemDeixouItem = `${caiu}/20`;
  out.eliteDropaAsVezes = caiu > 2 && caiu < 18;
  return out;
});
console.log(JSON.stringify(R, null, 1));
const ok = R.sonsSintetizados === 10 && R.somAtaqueMumia && R.somFlecha && R.trombetaDoChefao && R.somTempestade && R.tesouroPontos >= 400 && R.tesouroItens >= 2 && R.eliteDropaAsVezes && !erros.length;
console.log(erros.length ? 'erros: ' + erros.join(' | ') : '', ok ? '✓ Sons e recompensas ok' : '✗ falhou');
await b.close();
srv.close();
process.exit(ok ? 0 : 1);
