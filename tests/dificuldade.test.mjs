// Mede, dentro do jogo, os valores reais de cada dificuldade (não só o que o cartão mostra).
// Uso: npm run build:portable && npm run test:dificuldade
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
const ctx = await b.newContext({ locale: 'pt-BR' });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
await p.goto(`http://localhost:${srv.address().port}/`);
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });

const medir = (id) => p.evaluate((id) => {
  const g = __bh;
  g.settings.difficulty = id;
  g.quickStart();
  g.debugGod = false;
  g.wave = 5;
  const rnd = Math.random;
  Math.random = () => 0.5; // tira a variação aleatória das medidas
  const z = g.spawnZombie('walker', 5, 5);
  const zb = g.zombies[g.zombies.length - 1];
  const boss = (g.spawnZombie('boss', 6, 6), g.zombies[g.zombies.length - 1]);
  const n = g.buildWave(5).length;
  const cap = g.aliveCap();
  const pl = g.players[0];
  pl.armor = 0; pl.hp = 1000; pl.shieldT = 0; pl.dashT = 0;
  g.damagePlayer(pl, 10, pl.pos.x + 1, pl.pos.z, 0);
  const dmg = 1000 - pl.hp;
  const xp0 = pl.xp + pl.lv * 1e6; pl.xp = 0; pl.lv = 1; pl.pts = 0;
  g.gainXp(pl, 4);
  const xp = pl.xp;
  // intervalo de ataque e de aparecimento: roda a lógica real
  zb.attackCd = 0; zb.state = 'move'; zb.pos.set(pl.pos.x + 0.6, 0, pl.pos.z); zb.rise = 0;
  g.updateZombie(zb, 0.016);
  const atk = zb.attackCd;
  g.waveState = 'active'; g.toSpawn = ['walker']; g.spawnT = 0;
  g.zombies.forEach((q) => (q.alive = false));
  try { g.updateWaves?.(0.001); } catch { /* nome pode variar */ }
  const spawnGap = g.spawnT;
  Math.random = rnd;
  const r = { id, vidaZumbi: Math.round(zb.hp), vidaChefe: Math.round(boss.hp), velocidade: +zb.speed.toFixed(2), inimigosOnda5: n, maxVivos: cap, danoDe10: +dmg.toFixed(1), xpDe4: xp, intervaloAtaque: +atk.toFixed(2), intervaloSpawn: +spawnGap.toFixed(3) };
  g.toMenu();
  return r;
}, id);

const out = [];
for (const id of ['easy', 'normal', 'hard', 'insane']) out.push(await medir(id));
console.table(out);
// cada dificuldade precisa ser estritamente mais dura que a anterior em cada eixo
const keys = { vidaZumbi: 1, vidaChefe: 1, velocidade: 1, inimigosOnda5: 1, maxVivos: 1, danoDe10: 1, xpDe4: 1, intervaloAtaque: -1 };
let falhas = 0;
for (const [k, dir] of Object.entries(keys)) {
  for (let i = 1; i < out.length; i++) {
    const ok = dir > 0 ? out[i][k] > out[i - 1][k] : out[i][k] < out[i - 1][k];
    if (!ok) {
      falhas++;
      console.log(`✗ ${k}: ${out[i - 1].id}=${out[i - 1][k]} → ${out[i].id}=${out[i][k]}`);
    }
  }
}
console.log(falhas ? `${falhas} falha(s)` : '✓ todas as dificuldades alteram o jogo na ordem esperada');
await b.close();
srv.close();
process.exit(falhas ? 1 : 0);
