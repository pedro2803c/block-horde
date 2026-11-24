// Monta cada montaria na sua arena, anda e atira; tira prints recortados em volta do piloto (estacionada e em ação).
// Uso: npx vite preview --port 4173  e  node scripts/prints-montarias-partida.mjs pasta
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = `prints/${process.argv[2] || 'montarias-v2'}`; fs.mkdirSync(OUT, { recursive: true });
const ARENA = { templo_2: 'templo', templo_3: 'templo' };
const ALL = ['praca', 'armazem', 'vale', 'distrito', 'cemiterio', 'coliseu', 'lab', 'templo', 'templo_2', 'templo_3', 'naval'];
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1366, height: 768 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
const res = {};
const clip = { x: 383, y: 134, width: 600, height: 500 };
for (const id of ALL) {
  const r1 = await page.evaluate(async ({ id, arenaId }) => {
    const g = window.__bh; const T = window.__bhTest;
    const arena = T.ARENAS.find((a) => a.id === arenaId);
    g.debugGod = true; g.startMatch(arena, [T.SURVIVORS[0]], 'solo');
    await new Promise((r) => setTimeout(r, 300));
    const p = g.players[0]; const A = g.arena;
    let spot = { x: A.W / 2, z: A.D / 2 };
    for (let t = 0; t < 3000; t++) { const x = 6 + Math.random() * (A.W - 12), z = 6 + Math.random() * (A.D - 12); if (!A.circleBlocked(x, z, 3) && A.rayFree(x, z, 0, 1, 10) >= 10) { spot = { x, z }; break; } }
    p.pos.set(spot.x - 2.2, 0, spot.z - 1.5);
    const def = T.MOUNTS[id];
    g.worldMount = { id, def, x: spot.x, z: spot.z, spawnX: spot.x, spawnZ: spot.z, facing: 0.6, hp: def.maxHp, maxHp: def.maxHp, rider: null, alive: true, respawnT: 0, hurtT: 0, wheelT: 0, state: 'disponível' };
    for (const z of g.zombies) z.alive = false;
    g.camDist = 9;
    return { arena: arena && arena.id };
  }, { id, arenaId: ARENA[id] || id });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/jogo-${id}-parada.png`, clip });
  const r2 = await page.evaluate(({ id }) => {
    const g = window.__bh; const p = g.players[0];
    g.startMount(p, id, true);
    for (const z of g.zombies) z.alive = false;
    return { montado: p.isMounted, mountId: p.mountId };
  }, { id });
  await page.mouse.move(683, 200);
  await page.keyboard.down('KeyW');
  await page.mouse.down();
  await page.waitForTimeout(1100);
  const w = await page.evaluate(() => { const g = window.__bh; g.camDist = 9; return g.worldMount.wheelT; });
  await page.screenshot({ path: `${OUT}/jogo-${id}-acao.png`, clip });
  await page.mouse.up(); await page.keyboard.up('KeyW');
  res[id] = { ...r1, ...r2, wheelT: +w.toFixed(2) };
}
console.log(JSON.stringify(res, null, 0));
console.log('erros JS:', errors.length ? errors.slice(0, 5) : 'nenhum'); await b.close();
