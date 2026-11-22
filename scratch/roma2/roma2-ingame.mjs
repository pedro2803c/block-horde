// Print in-game dos 4 romanos da Etapa 2 no Coliseu (temporario, nao e teste).
// Uso: node scratch/roma2/roma2-ingame.mjs
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 6400 + Math.floor(Math.random() * 300);
const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
const url = `http://localhost:${port}/`;
for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch { /* subindo */ } await sleep(500); }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => {
  localStorage.setItem('blockhorde_tutorial_v1', '1');
  localStorage.removeItem('blockhorde.save.v1');
});
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url + '?test');
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
const info = await p.evaluate(async () => {
  const g = __bh;
  const { ARENAS } = __bhTest;
  const col = ARENAS.find((a) => a.id === 'coliseu');
  g.startMatch(col, [__bhTest.SURVIVORS[0]], 'solo');
  g.state = 'playing';
  const semOndas = () => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; };
  const iv = setInterval(semOndas, 50);
  semOndas();
  g.debugGod = true;
  const pl = g.players[0];
  const at = (t, x, z) => { g.spawnZombie(t, pl.pos.x + x, pl.pos.z + z); const q = g.zombies[g.zombies.length - 1]; q.rise = 0; q.speed = 0; q.facing = Math.PI; return q; };
  const list = [['rm_praetor', -4.2], ['rm_beast', -1.5], ['rm_spirit', 1.5], ['rm_standard', 4.2]];
  for (const [t, x] of list) at(t, x, 4.2);
  await new Promise((r) => setTimeout(r, 900));
  clearInterval(iv);
  g.state = 'paused';
  g.ui.showScreen(null);
  return { vivos: g.zombies.filter((z) => z.alive).map((z) => z.type), escala: Object.fromEntries(list.map(([t]) => [t, __bhTest.ENEMIES[t].scale])) };
});
await sleep(400);
await p.screenshot({ path: path.join(ROOT, 'scratch', 'roma2', 'ingame.png') });
console.log(JSON.stringify(info));
console.log(errs.length ? 'ERROS: ' + errs.join(' | ') : 'sem erro de pagina');
await b.close();
pr.kill();
