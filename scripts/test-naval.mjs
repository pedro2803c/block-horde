// Teste real da Arena 09 — Cemitério Naval (Playwright no build de produção).
// Uso: npx vite preview --port 4173  e depois  node scripts/test-naval.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.BH_URL || 'http://127.0.0.1:4173/?test';
const OUT = path.resolve('prints/naval');
fs.mkdirSync(OUT, { recursive: true });
const NV = ['nv_pirate', 'nv_harpooner', 'nv_mimic', 'nv_crab', 'nv_ghost', 'nv_octopus', 'nv_angler', 'nv_brute', 'nv_shark', 'nv_serpent'];
const NW = ['nv_harpoon', 'nv_pirate_shotgun', 'nv_trident', 'nv_ghost_saber', 'nv_anchor'];

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on('pageerror', (e) => errors.push('page: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });

const res = {};
const run = (fn, arg) => page.evaluate(fn, arg);

// 1) arena carrega, mobs aparecem, montaria existe
res.load = await run(({ NV }) => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  const a = ARENAS.find((x) => x.id === 'naval');
  g.debugGod = true; g.startMatch(a, [SURVIVORS[0]], 'solo');
  const p = g.players[0];
  const spawned = NV.map((t) => !!g.spawnZombie(t, p.pos.x + 6, p.pos.z + 6));
  return { arena: g.arenaDef?.id || a.id, state: g.state, mount: g.worldMount?.def?.name, spawned: spawned.filter(Boolean).length };
}, { NV });
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, 'naval-arena.png') });
res.alive = await run(() => window.__bh.zombies.filter((z) => z.alive && z.type.startsWith('nv_')).length);

// 2) dano/ataque: mobs causam dano ao jogador com deus desligado por 3 s
res.dmg = await run(async () => {
  const g = window.__bh; const p = g.players[0]; g.debugGod = false; p.hp = p.maxHp = 5000;
  for (const z of g.zombies) if (z.alive) { z.pos.x = p.pos.x + 1; z.pos.z = p.pos.z + 1; }
  await new Promise((r) => setTimeout(r, 3000));
  const lost = 5000 - p.hp; g.debugGod = true; p.hp = p.maxHp; return { playerLost: Math.round(lost) };
});

// 3) armas + bônus
res.weapons = await run(({ NW }) => {
  const g = window.__bh; const p = g.players[0];
  const z = g.zombies.find((q) => q.alive) || g.spawnZombie('nv_pirate', p.pos.x + 3, p.pos.z);
  const out = {};
  for (const id of NW) { p.ammo[id] = 30; p.clip[id] = 8; p.weapon = id; const hp = z.hp; g.damageZombie(z, 10, 1, 0, p); out[id] = Math.round(hp - z.hp); z.hp = z.maxHp || 999; }
  g.updateNavalSet(p); const on = p.navalTempest;
  for (const id of NW) { p.ammo[id] = 0; p.clip[id] = 0; }
  g.updateNavalSet(p); const off = p.navalTempest;
  for (const id of NW.slice(0, 3)) { p.ammo[id] = 20; p.clip[id] = 8; }
  g.updateNavalSet(p);
  return { dmgPerWeapon: out, bonusOn: on, bonusOffAfterDrop: !off, bonusWith3: p.navalTempest };
}, { NW });

// 4) montaria: montar, 4 habilidades, destruir, não reaparece
res.mount = await run(async () => {
  const g = window.__bh; const p = g.players[0]; const wm = g.worldMount;
  g.zombies.forEach((z) => { if (z.alive) { z.pos.x = p.pos.x + 2; z.pos.z = p.pos.z; } });
  g.startMount(p, 'naval', true);
  const mounted = p.isMounted && wm.rider === p;
  const before = g.zombies.filter((z) => z.alive).reduce((s, z) => s + z.hp, 0);
  for (let i = 0; i < 4; i++) g.sharkAbility(p, i);
  const after = g.zombies.filter((z) => z.alive).reduce((s, z) => s + z.hp, 0);
  const fury = p.furyT > 0;
  g.dismount(p, true);
  const dead = !wm.alive;
  await new Promise((r) => setTimeout(r, 2500));
  wm.respawnT = 0; await new Promise((r) => setTimeout(r, 500));
  return { mounted, abilityDamage: Math.round(before - after), fury, destroyed: dead, respawned: wm.alive, onFoot: !p.isMounted };
});
await page.screenshot({ path: path.join(OUT, 'naval-pos-montaria.png') });

// 5) exclusividade: outras arenas recusam mobs navais; outras arenas iniciam
res.exclusive = await run(({ NV }) => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  const out = {};
  for (const a of ARENAS.filter((x) => x.id !== 'naval')) {
    g.startMatch(a, [SURVIVORS[0]], 'solo');
    const p = g.players[0];
    const leaks = NV.filter((t) => g.spawnZombie(t, p.pos.x + 4, p.pos.z + 4)).length;
    out[a.id] = { started: g.state, leaks, mount: !!g.worldMount };
  }
  return out;
}, { NV });

// 6) montaria visível (print)
await run(() => { const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest; g.startMatch(ARENAS.find((x) => x.id === 'naval'), [SURVIVORS[0]], 'solo'); const p = g.players[0]; g.startMount(p, 'naval', true); });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(OUT, 'naval-tubarao-montado.png') });

res.errors = errors;
console.log(JSON.stringify(res, null, 2));
await browser.close();
