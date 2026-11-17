// Bestiário Egito (etapa 3): exclusividade do Templo Antigo e comportamento de cada inimigo.
// Uso: npm run build:portable && npm run test:egito
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
  const { ARENAS } = __bhTest;
  const EG = ['mummy', 'anubis', 'archer', 'scarab', 'serpent', 'priest', 'phantom', 'construct'];
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = {};
  const ondas = (arena) => {
    g.startMatch(arena, [__bhTest.SURVIVORS[0]], 'solo');
    const seen = new Set();
    for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 9; wv++) g.buildWave(wv).forEach((t) => seen.add(t));
    return EG.filter((t) => seen.has(t));
  };
  const templo = ARENAS.find((a) => a.id === 'templo');
  out.noTemplo = ondas(templo);
  out.foraDoTemplo = ARENAS.filter((a) => a.id !== 'templo').map((a) => [a.id, ondas(a)]).filter(([, l]) => l.length);
  // múmias em grupos de 3 seguidos
  g.startMatch(templo, [__bhTest.SURVIVORS[0]], 'solo');
  let trios = 0, mum = 0;
  for (let k = 0; k < 40; k++) { const l = g.buildWave(1); for (let i = 0; i < l.length; i++) if (l[i] === 'mummy') { mum++; if (l[i + 1] === 'mummy' && l[i + 2] === 'mummy') trios++; } }
  out.mumiasEmGrupo = mum > 0 && trios > 0;
  // cenário controlado
  g.debugGod = false;
  g.state = 'paused';
  const pl = g.players[0];
  const at = (t, dx, dz) => { g.spawnZombie(t, pl.pos.x + dx, pl.pos.z + dz); const z = g.zombies[g.zombies.length - 1]; z.rise = 0; return z; };
  g.zombies.length = 0;
  // aura do Anúbis: múmia perto leva 60% do dano; longe leva 100%
  const an = at('anubis', 8, 0);
  const perto = at('mummy', 9, 0);
  const longe = at('mummy', -9, 0);
  const h1 = perto.hp, h2 = longe.hp;
  g.damageZombie(perto, 10, 1, 0, pl);
  g.damageZombie(longe, 10, 1, 0, pl);
  out.auraAnubis = { pertoPerdeu: +(h1 - perto.hp).toFixed(1), longePerdeu: +(h2 - longe.hp).toFixed(1) };
  // escudo frontal do Anúbis
  an.facing = Math.atan2(pl.pos.x - an.pos.x, pl.pos.z - an.pos.z);
  const ha = an.hp;
  g.damageZombie(an, 10, (an.pos.x - pl.pos.x) / 8, (an.pos.z - pl.pos.z) / 8, pl);
  out.escudoFrontal = +(ha - an.hp).toFixed(1);
  // escaravelho explode ao morrer e fere quem está perto
  g.zombies.length = 0;
  pl.hp = 100; pl.armor = 0;
  const sc = at('scarab', 1.2, 0);
  g.damageZombie(sc, 999, 1, 0, pl);
  g.state = 'playing';
  await w(400);
  out.explosaoEscaravelho = 100 - Math.round(pl.hp);
  // arqueiro: recua quando perto e envenena
  g.zombies.length = 0;
  pl.hp = 100; pl.poisonT = 0;
  const ar = at('archer', 2.5, 0);
  const d0 = Math.hypot(ar.pos.x - pl.pos.x, ar.pos.z - pl.pos.z);
  await w(900);
  out.arqueiroRecuou = +(Math.hypot(ar.pos.x - pl.pos.x, ar.pos.z - pl.pos.z) - d0).toFixed(2);
  ar.spitCd = 0;
  let pois = false;
  for (let i = 0; i < 40 && !pois; i++) { await w(100); pois = pl.poisonT > 0; }
  out.flechaEnvenena = pois;
  // ---- etapa 4 ----
  const espera = async (fn, ms = 6000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await w(80); } return false; };
  // serpente: mordida envenena
  g.zombies.length = 0; g.projectiles.length = 0; pl.hp = 100; pl.poisonT = 0;
  const se = at('serpent', 1.0, 0); se.attackCd = 0; se.lungeCd = 9;
  out.serpenteEnvenena = await espera(() => pl.poisonT > 0);
  // serpente: some e reaparece (teletransporte)
  se.pos.set(pl.pos.x + 10, 0, pl.pos.z); se.blinkCd = 0; se.lungeCd = 9;
  const sx = se.pos.x;
  out.serpenteReaparece = await espera(() => Math.abs(se.pos.x - sx) > 2.5, 3000);
  // sacerdote: maldição deixa lento e invoca múmias
  g.zombies.length = 0; g.projectiles.length = 0; pl.hp = 100; pl.slowT = 0;
  const pr = at('priest', 5, 0); pr.spitCd = 0; pr.summonCd = 0;
  out.maldicaoLentidao = await espera(() => pl.slowT > 0);
  out.sacerdoteInvoca = await espera(() => g.zombies.some((q) => q !== pr && q.alive && (q.type === 'mummy' || q.type === 'scarab')));
  // fantasma: teletransporta
  g.zombies.length = 0;
  const fa = at('phantom', 9, 0); fa.blinkCd = 0;
  const fx0 = fa.pos.x;
  out.fantasmaTeleporta = await espera(() => Math.abs(fa.pos.x - fx0) > 2.5, 3000);
  // construto: regenera até o limite e o golpe gera onda de choque
  g.zombies.length = 0; pl.hp = 100;
  const co = at('construct', 30, 30);
  co.hp -= 200;
  const hBaixo = co.hp;
  await w(3000);
  out.construtoRegenera = +(co.hp - hBaixo).toFixed(1);
  co.regenLeft = 0; const hFix = co.hp; await w(800);
  out.construtoParaDeRegenerar = co.hp === hFix;
  co.pos.set(pl.pos.x + 1.4, 0, pl.pos.z); co.attackCd = 0; pl.hp = 100; pl.armor = 0;
  let qk = 0; const oq = g.quake.bind(g); g.quake = (z, q) => { qk++; return oq(z, q); };
  out.ondaDeChoque = await espera(() => qk > 0);
  g.quake = oq;
  g.debugGod = true;
  // visual: os quatro lado a lado
  g.zombies.length = 0;
  g.projectiles.length = 0;
  const f = (t, x) => { const z = at(t, x, 3); z.facing = Math.PI; z.speed = 0; return z; };
  f('mummy', -3); f('anubis', -1); f('archer', 1); f('scarab', 3);
  g.state = 'paused';
  g.ui.showScreen(null);
  return out;
});
await p.waitForTimeout(400);
fs.mkdirSync('tests/hud-shots', { recursive: true });
await p.screenshot({ path: 'tests/hud-shots/egito-etapa3.png' });
console.log(JSON.stringify(R, null, 1));
const ok = R.noTemplo.length === 8 && R.serpenteEnvenena && R.serpenteReaparece && R.maldicaoLentidao && R.sacerdoteInvoca && R.fantasmaTeleporta && R.construtoRegenera > 0 && R.construtoParaDeRegenerar && R.ondaDeChoque && !R.foraDoTemplo.length && R.mumiasEmGrupo && R.auraAnubis.pertoPerdeu < R.auraAnubis.longePerdeu && R.escudoFrontal < 5 && R.explosaoEscaravelho > 0 && R.arqueiroRecuou > 0 && R.flechaEnvenena && !erros.length;
console.log(erros.length ? 'erros: ' + erros.join(' | ') : '', ok ? '✓ Egito ok' : '✗ falhou');
await b.close();
srv.close();
process.exit(ok ? 0 : 1);
