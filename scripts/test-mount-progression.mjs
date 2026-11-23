// Testa a progressão de montarias por confronto (spec §1-§5): Templo (3 chefs) + Naval.
import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });

const report = await page.evaluate(async () => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  const out = [];
  const snap = (tag) => out.push({ tag, mount: g.worldMount && g.worldMount.id, state: g.worldMount && g.worldMount.state, releases: g.mountReleases, started: [...g.bossStarted], mounted: g.players[0].isMounted });
  const spawnBoss = (t) => { const s = g.freeSpot(20, 20, 1.4); return g.spawnZombie(t, s.x, s.z); };

  // ---- Templo: chefes pharaoh, sobek, bastet, sphinx ----
  g.startMatch(ARENAS.find((x) => x.id === 'templo'), [SURVIVORS[0]], 'solo');
  g.debugGod = true;
  g.spawnT = 999;
  snap('match-start');
  const z1 = spawnBoss('pharaoh'); snap('pharaoh');
  const z2 = spawnBoss('sobek'); snap('sobek');
  const p = g.players[0];
  g.startMount(p, null, true);
  snap('player-mounted');
  const z3 = spawnBoss('bastet'); snap('bastet');
  spawnBoss('sphinx'); snap('sphinx');
  spawnBoss('pharaoh'); snap('dup-pharaoh');

  // ---- Naval: chefão genérico ----
  g.startMatch(ARENAS.find((x) => x.id === 'naval'), [SURVIVORS[0]], 'solo');
  g.debugGod = true;
  g.spawnT = 999;
  const n = g.freeSpot(20, 20, 1.4);
  const nb = g.spawnZombie('boss', n.x, n.z);
  snap('naval-boss');
  return { out, templeSpawns: [z1, z2, z3].map(Boolean), navalSpawned: !!nb };
});
console.log(JSON.stringify({ ...report, errors }, null, 1));
await b.close();
