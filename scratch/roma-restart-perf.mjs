// Mede FPS e recursos do renderer após 1 partida e após 9 partidas seguidas.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 6313;
const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
const url = `http://localhost:${port}/`;
for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch {} await sleep(500); }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(url + '?test');
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });

const R = await p.evaluate(async () => {
  const g = __bh;
  const { ARENAS, SURVIVORS } = __bhTest;
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const medir = async (seg = 5) => {
    let frames = 0; const t0 = performance.now();
    const loop = () => { frames++; if (performance.now() - t0 < seg * 1000) requestAnimationFrame(loop); };
    requestAnimationFrame(loop); await w(seg * 1000 + 100);
    const m = g.renderer.info.memory; const r = g.renderer.info.render;
    return { fps: +(frames / seg).toFixed(1), geometrias: m.geometries, texturas: m.textures, chamadas: r.calls, triangulos: r.triangles };
  };
  const col = ARENAS.find((a) => a.id === 'coliseu');
  g.startMatch(col, [SURVIVORS[0]], 'solo');
  await w(3000);
  const uma = await medir(4);
  for (const a of ARENAS) g.startMatch(a, [SURVIVORS[0]], 'solo');
  g.startMatch(col, [SURVIVORS[0]], 'solo');
  await w(3000);
  const nove = await medir(4);
  return { uma, nove };
});
console.log(JSON.stringify(R, null, 1));
await b.close(); pr.kill();
