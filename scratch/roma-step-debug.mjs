// Repete o cenário COM o prelúdio do teste e mostra onde/o que bloqueia o legionário.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 6316 + Number(process.argv[2] || 0);
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
  const ondas = (arena) => { g.startMatch(arena, [SURVIVORS[0]], 'solo'); const seen = new Set(); for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 12; wv++) g.buildWave(wv).forEach((t) => seen.add(t)); return RM.filter((t) => seen.has(t)); };
  const col = ARENAS.find((a) => a.id === 'coliseu');
  ondas(col); for (const a of ARENAS) if (a.id !== 'coliseu') ondas(a);
  g.startMatch(col, [SURVIVORS[0]], 'solo');
  g.state = 'playing';
  const semOndas = () => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; };
  semOndas(); const iv = setInterval(semOndas, 50);
  const pl = g.players[0];
  g.debugGod = false; pl.alive = true; pl.hp = pl.maxHp = 100; pl.armor = 0;
  g.zombies.length = 0; g.projectiles.length = 0;
  const livre = (d) => {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2; const x = pl.pos.x + Math.sin(a) * d, z = pl.pos.z + Math.cos(a) * d;
      if (g.arena.inb(Math.floor(x), Math.floor(z)) && !g.arena.circleBlocked(x, z, 0.9) && g.arena.walkable(x, z, pl.pos.x, pl.pos.z, 0.6) && g.arena.los(x, z, pl.pos.x, pl.pos.z)) return [Math.sin(a) * d, Math.cos(a) * d];
    }
    return [d, 0];
  };
  const [dx, dz] = livre(9);
  const spawn = { x: pl.pos.x + dx, z: pl.pos.z + dz };
  g.spawnZombie('rm_legion', spawn.x, spawn.z);
  const z = g.zombies[g.zombies.length - 1];
  z.rise = 0;
  let parouEm = null, hpAnt = pl.hp, semDano = 0;
  for (let i = 0; i < 900; i++) {
    g.update(1 / 60);
    if (pl.hp < hpAnt) { hpAnt = pl.hp; semDano = 0; } else semDano++;
    if (semDano === 120 && !parouEm) parouEm = { d: +Math.hypot(z.pos.x - pl.pos.x, z.pos.z - pl.pos.z).toFixed(2), x: +z.pos.x.toFixed(2), z: +z.pos.z.toFixed(2), game: +g.time.toFixed(2) };
  }
  clearInterval(iv);
  const A = g.arena;
  const out = { pl: { x: +pl.pos.x.toFixed(2), z: +pl.pos.z.toFixed(2) }, spawn: { x: +spawn.x.toFixed(2), z: +spawn.z.toFixed(2) }, final: { x: +z.pos.x.toFixed(2), z: +z.pos.z.toFixed(2), d: +Math.hypot(z.pos.x - pl.pos.x, z.pos.z - pl.pos.z).toFixed(2) }, hp: +pl.hp.toFixed(1), parouEm, props: A.props.length };
  try { const o = {}; const ok = A.flowDir(z.pos.x, z.pos.z, o); out.flow = { ok, x: +(o.x || 0).toFixed(2), z: +(o.z || 0).toFixed(2) }; } catch (e) { out.flow = String(e); }
  out.walk = A.walkable(z.pos.x, z.pos.z, pl.pos.x, pl.pos.z, z.wallR * 0.9);
  out.los = A.los(z.pos.x, z.pos.z, pl.pos.x, pl.pos.z);
  out.cell = { i: Math.floor(z.pos.x), j: Math.floor(z.pos.z), dyn: A.dyn[A.idx(Math.floor(z.pos.x), Math.floor(z.pos.z))] };
  const near = A.props.map((q) => ({ id: q.def.id, d: +Math.hypot(q.x - z.pos.x, q.z - z.pos.z).toFixed(2), x: q.x, z: q.z, dead: q.dead })).sort((a, b2) => a.d - b2.d).slice(0, 4);
  out.near = near;
  return out;
});
console.log(JSON.stringify(R, null, 1));
await b.close(); pr.kill();
