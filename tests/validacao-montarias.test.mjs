// Validacao de projeteis ofensivos das montarias contra chefao.
// Uso: npm run build:portable && node tests/validacao-montarias.test.mjs
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
  const arena = ARENAS.find((a) => a.id === 'praca');
  g.startMatch(arena, [SURVIVORS[0]], 'solo');
  const pl = g.players[0];
  setInterval(() => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; }, 50);
  g.zombies.length = 0;
  pl.hp = pl.maxHp = 5000;
  g.wave = 5;
  let boss = null;
  for (const t of Object.keys(__bhTest.ENEMIES)) { boss = g.spawnZombie(t, pl.pos.x + 8, pl.pos.z); if (boss) break; }
  boss.hp = boss.maxHp = 500;
  boss.maxHp = 500;
  g.releaseMount(boss);
  const wm = g.worldMount;
  out.montariaLiberada = !!wm && wm.alive;
  // montar
  if (wm) {
    pl.pos.x = wm.x; pl.pos.z = wm.z;
    g.startMount(pl, arena.id);
  }
  out.montado = !!pl.isMounted;
  // apontar para o boss
  if (pl.isMounted) {
    pl.aim = Math.atan2(boss.pos.x - pl.pos.x, boss.pos.z - pl.pos.z);
  }
  const hpAntes = boss.hp;
  // disparar habilidade 0 (burst/line)
  if (pl.isMounted) {
    const sk = g.mountSkillAt ? g.mountSkillAt(pl.mountId, 0) : null;
    if (sk) g.mountAbility(pl, 0);
  }
  // esperar projétil atingir
  // aproximar e disparar mais perto
  pl.pos.x = boss.pos.x - 3; pl.pos.z = boss.pos.z;
  pl.aim = Math.atan2(boss.pos.x - pl.pos.x, boss.pos.z - pl.pos.z);
  if (pl.isMounted) g.mountAbility(pl, 0);
  const atingiu = await espera(() => boss.hp < hpAntes, 6000);
  out.hpAntes = hpAntes;
  out.hpDepois = boss.hp;
  out.danoReal = atingiu;
  // teste direto de dano
  const hp0 = boss.hp;
  g.damageZombie(boss, 22, 1, 0, pl, 0.6);
  out.danoDireto = boss.hp < hp0;
  out.hpDepoisDireto = boss.hp;
  out.projeteisGerados = g.projectiles.filter((q) => q.kind === 'mproj').length;
  out.invulT = boss.invulT;
  out.alive = boss.alive;
  out.radius = boss.radius;
  out.mprojDist = g.projectiles.filter((q)=>q.kind==='mproj').map((q)=>Math.hypot(q.x-boss.pos.x,q.z-boss.pos.z).toFixed(2));
  out.erros = 0;
  return out;
});

console.log(JSON.stringify(R, null, 2));
await b.close();
srv.close();
