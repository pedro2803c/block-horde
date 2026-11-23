// Spawn dos 10 mobs folclóricos do Vale (exclusividade + defs).
import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });

const report = await page.evaluate(async () => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  g.startMatch(ARENAS.find((x) => x.id === 'vale'), [SURVIVORS[0]], 'solo');
  const ids = ['ff_saci', 'ff_curupira', 'ff_pisadeira', 'ff_iara', 'ff_cuca', 'ff_mula', 'ff_lobisomem', 'ff_boto', 'ff_caipora', 'ff_boitata'];
  const out = [];
  for (const id of ids) {
    const s = g.freeSpot(22, 22, 1.4);
    const z = g.spawnZombie(id, s.x, s.z);
    out.push([id, !!z, z ? z.alive : null]);
  }
  return { out };
});
console.log(JSON.stringify({ report, errors }, null, 1));
await b.close();
