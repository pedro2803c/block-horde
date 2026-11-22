// Confere as direções escolhidas pelo seletor de caminho livre em cada distância usada no teste.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 6318;
const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
const url = `http://localhost:${port}/`;
for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch {} await sleep(500); }
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 640, height: 360 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(url + '?test');
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
const R = await p.evaluate(() => {
  const g = __bh;
  const col = __bhTest.ARENAS.find((a) => a.id === 'coliseu');
  g.startMatch(col, [__bhTest.SURVIVORS[0]], 'solo');
  const pl = g.players[0];
  const distSeg = (qx, qz, px, pz, rx, rz) => {
    const vx = rx - px, vz = rz - pz;
    const t = Math.max(0, Math.min(1, ((qx - px) * vx + (qz - pz) * vz) / (vx * vx + vz * vz || 1)));
    return Math.hypot(qx - (px + vx * t), qz - (pz + vz * t));
  };
  const livre = (d, folga) => {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2; const x = pl.pos.x + Math.sin(a) * d, z = pl.pos.z + Math.cos(a) * d;
      if (!g.arena.inb(Math.floor(x), Math.floor(z)) || g.arena.circleBlocked(x, z, 0.9) || !g.arena.walkable(x, z, pl.pos.x, pl.pos.z, 0.6) || !g.arena.los(x, z, pl.pos.x, pl.pos.z)) continue;
      if (g.arena.props.some((q) => !q.dead && distSeg(q.x, q.z, pl.pos.x, pl.pos.z, x, z) < folga)) continue;
      return { k, x: +x.toFixed(1), z: +z.toFixed(1) };
    }
    return null;
  };
  return {
    pl: { x: +pl.pos.x.toFixed(2), z: +pl.pos.z.toFixed(2) }, W: g.arena.W, D: g.arena.D, props: g.arena.props.length,
    casos: Object.fromEntries([[9, 1.2], [5, 0.8], [12, 1.2], [3, 0.8], [8, 1.2], [5, 1.2], [11, 1.2]].map(([d, f]) => [`${d}m/${f}m`, livre(d, f)])),
  };
});
console.log(JSON.stringify(R, null, 1));
await b.close(); pr.kill();
