// Rework V2: spawna os 25 mobs refeitos numa partida, deixa andar/atacar, mata metade (animação de morte), mede quadro e tira print.
import { chromium } from 'playwright';
import fs from 'node:fs';
const ARENA = process.argv[2] || null; const ONLY = process.argv[3] ? process.argv[3].split(',') : null;
const IDS0 = ['walker','brute','runner','spitter','bloater','armored','summoner','reaper','mummy','anubis','archer','priest','construct','skeleton','rm_legion','rm_centurion','rm_archer','rm_gladiator','rm_praetor','rm_engineer','boss','devourer','mechworker','guardian','general'];
const IDS = ONLY || IDS0;
fs.mkdirSync('prints/rework-gameplay', { recursive: true });
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1366, height: 768 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
const spawned = await page.evaluate(([ids, arena]) => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  g.startMatch(ARENAS.find((a) => a.id === arena) || ARENAS[0], [SURVIVORS[0]], 'solo');
  const p = g.players ? g.players[0] : g.player;
  if (p) { p.hp = p.maxHp = 1e9; }
  const px = p?.pos?.x ?? 0, pz = p?.pos?.z ?? 0;
  return ids.map((id, i) => { const a = (i / ids.length) * Math.PI * 2; const s = g.freeSpot(px + Math.cos(a) * 7, pz + Math.sin(a) * 7, 1.4); const z = g.spawnZombie(id, s.x, s.z); return [id, !!z]; });
}, [IDS, ARENA]);
await page.waitForTimeout(6000);
await page.screenshot({ path: `prints/rework-gameplay/vivos-${ARENA||'base'}.png` });
const killed = await page.evaluate(() => { const g = window.__bh; let n = 0; for (const z of g.zombies || []) if (z.alive && n++ % 2 === 0) { z.hp = 0; g.killZombie ? g.killZombie(z) : (z.alive = false); } return n; });
await page.waitForTimeout(1500);
await page.screenshot({ path: `prints/rework-gameplay/mortes-${ARENA||'base'}.png` });
const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(Math.round(n / 3)); }; requestAnimationFrame(f); }));
console.log(JSON.stringify({ naoNasceu: spawned.filter((s) => !s[1]).map((s) => s[0]), killed, fpsSwiftshader: fps, errors: errors.slice(0, 5) }));
await b.close();
