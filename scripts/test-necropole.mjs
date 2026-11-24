// Teste real da Necrópole (Playwright no build de produção).
// Uso: npx vite preview --port 4173  e depois  node scripts/test-necropole.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.BH_URL || 'http://127.0.0.1:4173/?test';
const OUT = path.resolve('prints/necropole');
fs.mkdirSync(OUT, { recursive: true });
const NC = ['nc_vampire', 'nc_nosferatu', 'nc_knight', 'nc_executioner', 'nc_reaper', 'nc_banshee', 'nc_abomination', 'nc_gargoyle', 'nc_plague', 'nc_tombking'];
const BOSSES = ['lich', 'nc_matriarch', 'nc_colossus'];
const NW = ['scythe_soul', 'nc_necro_staff', 'nc_exec_crossbow', 'nc_tomb_cannon', 'nc_beyond_pistol'];

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on('pageerror', (e) => errors.push('page: ' + e.message + ' @ ' + (e.stack||'').split('\n').slice(1,4).join(' | ')));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
const run = (fn, arg) => page.evaluate(fn, arg);
const res = {};

// 1) arena inicia; lista de chefes; ondas 5/10/15 trazem os 3 chefes
res.load = await run(() => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  const a = ARENAS.find((x) => x.id === 'cemiterio');
  g.debugGod = true; g.startMatch(a, [SURVIVORS[0]], 'solo');
  return { state: g.state, bossList: g.arenaDef.boss, wave5: g.buildWave(5)[0], wave10: g.buildWave(10)[0], wave15: g.buildWave(15)[0] };
});

// 2) cada chefe nasce, tem modelo, recebe dano e morre; montaria liberada
res.bosses = {};
for (const b of BOSSES) {
  const r = await run(async (b) => {
    const g = window.__bh; const p = g.players[0];
    for (const z of g.zombies) z.alive = false;
    const z = g.spawnZombie(b, p.pos.x + 6, p.pos.z);
    if (!z) return { spawned: false };
    const hasModel = !!(z.mesh || z.obj || z.group) && ((z.mesh || z.obj || z.group).children?.length || 0) > 0;
    await new Promise((r) => setTimeout(r, 1200));
    const hp0 = z.hp; p.weapon = 'pistol'; g.damageZombie(z, 50, 1, 0, p);
    const took = Math.round(hp0 - z.hp);
    return { spawned: true, boss: !!z.def.boss, hasModel, hp: Math.round(hp0), dmgTaken: took, bossBar: !!g.boss };
  }, b);
  await page.screenshot({ path: path.join(OUT, `chefe-${b}.png`) });
  r.killed = await run(() => { const g = window.__bh; const z = g.zombies.find((q) => q.alive && q.def.boss); if (!z) return false; g.damageZombie(z, 1e6, 1, 0, g.players[0]); return !z.alive; });
  res.bosses[b] = r;
}
res.mountReleased = await run(() => !!window.__bh.worldMount);

// 3) mobs: todos nascem e atacam (dano real ao jogador)
res.mobs = await run(async ({ NC }) => {
  const g = window.__bh; const p = g.players[0];
  for (const z of g.zombies) z.alive = false;
  const spawned = NC.filter((t, i) => !!g.spawnZombie(t, p.pos.x + 4 + (i % 5), p.pos.z + 3 + Math.floor(i / 5) * 2)).length;
  g.debugGod = false; p.hp = p.maxHp = 5000;
  await new Promise((r) => setTimeout(r, 2500));
  const ranged = Math.round(5000 - p.hp); // fase 1: à distância (projéteis)
  for (const z of g.zombies) if (z.alive) { z.pos.x = p.pos.x + 1; z.pos.z = p.pos.z + 1; }
  await new Promise((r) => setTimeout(r, 3000));
  const lost = Math.round(5000 - p.hp); g.debugGod = true; p.hp = p.maxHp;
  return { ranged, spawned, alive: g.zombies.filter((z) => z.alive && z.type.startsWith('nc_')).length, playerLost: lost, projectiles: (g.eshots || g.enemyShots || []).length };
}, { NC });
await page.screenshot({ path: path.join(OUT, 'mobs-gameplay.png') });

// 4) armas: dano real em mob, disparo real gera projétil, bônus Tempestade da Necrópole
res.weapons = await run(async ({ NW }) => {
  const g = window.__bh; const p = g.players[0]; 
  const z = g.zombies.find((q) => q.alive) || g.spawnZombie('nc_vampire', p.pos.x + 3, p.pos.z);
  const out = {};
  for (const id of NW) {
    p.ammo[id] = 30; p.clip[id] = 8; p.weapon = id; z.hp = 9999; const hp = z.hp; g.damageZombie(z, 10, 1, 0, p);
    out[id] = { exists: p.ammo[id] !== undefined, dmg: Math.round(hp - z.hp), unlocked: g.unlocked?.has ? true : null };
  }
  g.updateNecroSet(p); const on = p.necroTempest;
  for (const id of NW) { p.ammo[id] = 0; p.clip[id] = 0; }
  g.updateNecroSet(p); const off = !p.necroTempest;
  for (const id of NW.slice(0, 3)) { p.ammo[id] = 20; p.clip[id] = 8; }
  g.updateNecroSet(p);
  return { perWeapon: out, bonusOn: on, bonusOffAfterDrop: off, bonusWith3: p.necroTempest };
}, { NW });

// 5) exclusividade: chefes/mobs da Necrópole não entram em outra arena
res.exclusive = await run(({ NC }) => {
  const { isEnemyAllowedInArena } = window.__bhTest;
  if (!isEnemyAllowedInArena) return 'sem helper';
  return [...NC, 'lich', 'nc_matriarch', 'nc_colossus'].filter((t) => isEnemyAllowedInArena(t, 'praca')).length === 0;
}, { NC });

// 6) mobile: viewport de celular renderiza sem erro
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, 'mobile.png') });

res.errors = errors.slice(0, 10);
console.log(JSON.stringify(res, null, 1));
await browser.close();
