// Valida o cenário corrigido: caminho livre de props + avanço em passos fixos (60 Hz).
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 6317;
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
const R = await p.evaluate(async () => {
  const g = __bh;
  const { ARENAS, SURVIVORS } = __bhTest;
  const RM = ['rm_legion', 'rm_centurion', 'rm_archer', 'rm_gladiator', 'rm_hound'];
  const col = ARENAS.find((a) => a.id === 'coliseu');
  const semOndas = () => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; };
  semOndas(); setInterval(semOndas, 50);
  const ondas = (arena) => { g.startMatch(arena, [SURVIVORS[0]], 'solo'); const seen = new Set(); for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 12; wv++) g.buildWave(wv).forEach((t) => seen.add(t)); return RM.filter((t) => seen.has(t)); };
  // distância de um ponto ao segmento (px,pz)-(qx,qz)
  const distSeg = (qx, qz, px, pz, rx, rz) => {
    const vx = rx - px, vz = rz - pz;
    const t = Math.max(0, Math.min(1, ((qx - px) * vx + (qz - pz) * vz) / (vx * vx + vz * vz || 1)));
    return Math.hypot(qx - (px + vx * t), qz - (pz + vz * t));
  };
  const out = [];
  for (let it = 0; it < 10; it++) {
    ondas(col); for (const a of ARENAS) if (a.id !== 'coliseu') ondas(a);
    g.startMatch(col, [SURVIVORS[0]], 'solo');
    g.state = 'playing';
    const pl = g.players[0];
    g.debugGod = false; pl.alive = true; pl.hp = pl.maxHp = 100; pl.armor = 0;
    g.zombies.length = 0; g.projectiles.length = 0;
    const livre = (d) => {
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2; const x = pl.pos.x + Math.sin(a) * d, z = pl.pos.z + Math.cos(a) * d;
        if (!g.arena.inb(Math.floor(x), Math.floor(z)) || g.arena.circleBlocked(x, z, 0.9) || !g.arena.walkable(x, z, pl.pos.x, pl.pos.z, 0.6) || !g.arena.los(x, z, pl.pos.x, pl.pos.z)) continue;
        // nenhum prop a menos de 1,2 m do caminho
        if (g.arena.props.some((q) => !q.dead && distSeg(q.x, q.z, pl.pos.x, pl.pos.z, x, z) < 1.2)) continue;
        return [Math.sin(a) * d, Math.cos(a) * d];
      }
      return null;
    };
    const pos = livre(9);
    if (!pos) { out.push({ it, erro: 'sem caminho livre' }); continue; }
    const [dx, dz] = pos;
    g.spawnZombie('rm_legion', pl.pos.x + dx, pl.pos.z + dz);
    const z = g.zombies[g.zombies.length - 1];
    z.rise = 0;
    const t0 = g.time;
    let dano = 0, hpAnt = pl.hp;
    while (g.time - t0 < 15 && pl.hp > 0) {
      g.update(1 / 60);
      if (pl.hp < hpAnt) { dano += hpAnt - pl.hp; hpAnt = pl.hp; }
    }
    out.push({ it, vivo: z.alive, hpZ: +z.hp.toFixed(1), dano: +dano.toFixed(1), d: +Math.hypot(z.pos.x - pl.pos.x, z.pos.z - pl.pos.z).toFixed(2), seg: +(g.time - t0).toFixed(1), spawn: { x: +(pl.pos.x + dx).toFixed(1), z: +(pl.pos.z + dz).toFixed(1) } });
  }
  return out;
});
console.log(JSON.stringify(R, null, 1));
await b.close(); pr.kill();
