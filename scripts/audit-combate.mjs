// Auditoria de combate (somente leitura do comportamento): simula ondas aceleradas em cada arena e mede
// travamentos de IA, spawn em obstáculo/fora do mapa, dano de inimigo morto, pico de inimigos vivos e
// momento em que a montaria fica disponível. Uso: vite preview --port 4173 ; node scripts/audit-combate.mjs [ondas]
import { chromium } from 'playwright';

const URL = process.env.BH_URL || 'http://localhost:4173/?test';
const WAVES = +(process.argv[2] || 10);
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, locale: 'pt-BR' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
const arenas = await page.evaluate(() => window.__bhTest.ARENAS.map((a) => a.id));
const out = {};
for (const id of arenas.filter((a) => !ONLY || ONLY.includes(a))) {
  out[id] = await page.evaluate(async ({ id, WAVES }) => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.debugGod = true;
    g.startMatch(ARENAS.find((a) => a.id === id), [SURVIVORS[0]], 'solo');
    g.tut = null;
    const A = g.arena; const p = g.players[0];
    const r = { mountAtStart: !!(g.worldMount && g.worldMount.alive), mountFirstAvail: null, bossAt: [], waves: [], stuck: [], inWall: 0, outside: 0, deadHits: 0, hits: 0, reachT: [], maxAlive: 0, spawnInWall: 0 };
    const origDmg = g.damagePlayer.bind(g);
    g.damagePlayer = (pl, dmg, x, z, k, special, src) => { r.hits++; const att = g.zombies.find((q) => Math.abs(q.pos.x - x) < 0.01 && Math.abs(q.pos.z - z) < 0.01); if (att && !att.alive) r.deadHits++; return origDmg(pl, dmg, x, z, k, special, src); };
    const origSpawn = g.spawnZombie.bind(g);
    g.spawnZombie = (t, x, z) => { const zb = origSpawn(t, x, z); if (zb) { zb._born = g.time; zb._lx = x; zb._lz = z; zb._lt = g.time; if (!zb.def.fly && A.circleBlocked(x, z, 0.15)) { r.spawnInWall++; (r.wallSpots ||= []).length < 5 && r.wallSpots.push({ t, x: +x.toFixed(1), z: +z.toFixed(1), gate: A.gates.some((q) => Math.hypot(q.x - x, q.z - z) < 1), grave: A.graves.some((q) => Math.hypot(q.x - x, q.z - z) < 1) }); } if (zb.def.boss) r.bossAt.push({ wave: g.wave, t: +g.time.toFixed(1), type: t, mountAvail: !!(g.worldMount && g.worldMount.alive) }); } return zb; };
    const dt = 1 / 30;
    let t0 = g.time; let waveStart = g.time; let curWave = g.wave; let waveMax = 0; let guard = 0;
    while (g.wave <= WAVES && guard++ < 30 * 60 * 40) {
      // jogador parado no centro livre e invulnerável; inimigos que chegam perto são abatidos para a onda andar
      g.update(dt);
      if (g.state !== 'playing') break;
      p.hp = p.maxHp;
      if (g.worldMount && r.mountFirstAvail === null) {
        const wm = g.worldMount; const bz = g.boss;
        r.mountFirstAvail = { wave: g.wave, t: +g.time.toFixed(1), bossAlive: !!(bz && bz.alive), bossSpawnT: r.bossAt[0]?.t, blocked: A.circleBlocked(wm.x, wm.z, 1.2), distBoss: bz ? +Math.hypot(bz.pos.x - wm.x, bz.pos.z - wm.z).toFixed(1) : null, distPlayer: +Math.hypot(p.pos.x - wm.x, p.pos.z - wm.z).toFixed(1) };
        // monta, toma golpe do chefe (vai para a montaria), depois a montaria é destruída
        g.startMount(p, wm.id, true);
        g.debugGod = false; const hp0 = wm.hp; g.damagePlayer(p, 30, bz.pos.x, bz.pos.z, 2, false);
        r.mountTookBossHit = wm.hp < hp0 && p.hp === p.maxHp;
        g.damagePlayer(p, wm.hp, bz.pos.x, bz.pos.z, 2, false);
        r.mountDestroyed = !wm.alive && !p.isMounted && p.alive; p.hp = p.maxHp; g.debugGod = true;
        r._destroyedAt = g.time;
      }
      if (r._destroyedAt && g.worldMount && g.worldMount.alive) r.mountRespawned = true;
      if (g.wave >= 1 && g.wave < 5 && g.worldMount) r.mountEarly = true;
      let alive = 0;
      for (const z of g.zombies) {
        if (!z.alive) continue;
        alive++;
        const d = Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z);
        if (!z.def.fly && A.circleBlocked(z.pos.x, z.pos.z, 0.05)) r.inWall++;
        if (z.pos.x < 0 || z.pos.z < 0 || z.pos.x > A.W || z.pos.z > A.D) r.outside++;
        // travado: 4 s sem andar 0,6 m, longe do jogador, sem atordoamento, não estático
        if (g.time - z._lt > 4) {
          const mv = Math.hypot(z.pos.x - z._lx, z.pos.z - z._lz);
          if (mv < 0.6 && d > (z.def.reach || 1) + 2.5 && !z.def.static && !(z.stunT > 0) && !z.def.kite && !z.def.siegeSpot && !(z.rise > 0) && !z.def.spit && !z.def.summon && !z.def.lob && !z.def.throw && !z.def.blink && !z.def.spore && !z.def.fly && !z.def.boss) { if (!r.traceZ) { r.traceZ = z; r.trace = []; } r.stuck.push({ type: z.type, wave: g.wave, x: +z.pos.x.toFixed(1), z: +z.pos.z.toFixed(1), d: +d.toFixed(1), state: z.state, cell: A.dist ? A.dist[Math.floor(z.pos.x) + Math.floor(z.pos.z) * A.W] : null, crowd: g.zombies.filter((q) => q.alive && q !== z && Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z) < 1.2).length, dynAround: [[1,0],[-1,0],[0,1],[0,-1]].map(([di,dj]) => A.dyn[Math.floor(z.pos.x)+di + (Math.floor(z.pos.z)+dj) * A.W]).join(''), blockAround: [[1,0],[-1,0],[0,1],[0,-1]].map(([di,dj]) => A.block[Math.floor(z.pos.x)+di + (Math.floor(z.pos.z)+dj) * A.W] ? 1 : 0).join(''), power: g.power, gatesShut: g.gatesClosed ?? null, boss: !!(g.boss && g.boss.alive), kx: +(z.kx||0).toFixed(2), slowT: +(z.slowT||0).toFixed(1), frozen: +(z.freezeT||0).toFixed(1), target: z.target ? 'x' : '' }); }
          z._lx = z.pos.x; z._lz = z.pos.z; z._lt = g.time;
        }
        const kill = z.def.boss ? g.time - z._born > 25 : d < (z.def.reach || 1) + 1.2 || g.time - z._born > 45;
        if (kill) { if (!z.def.boss && d < (z.def.reach || 1) + 1.2) r.reachT.push(g.time - z._born); g.damageZombie(z, 1e9, 0, 0, null, 0, true); }
      }
      if (r.traceZ && r.trace.length < 60) { const z = r.traceZ; const o = {}; const ok = A.flowDir(z.pos.x, z.pos.z, o); r.trace.push([+z.pos.x.toFixed(2), +z.pos.z.toFixed(2), z.state, ok ? [+o.x.toFixed(2), +o.z.toFixed(2), o.i, o.j] : 'noflow', +z.speed.toFixed(2), +(z.unstickT||0).toFixed(2), z.lit ? 'lit' : '', +(z.attackT||0).toFixed(2), z.alive]); }
      waveMax = Math.max(waveMax, alive);
      if (g.wave !== curWave) { if (curWave > 0) r.waves.push({ w: curWave, maxAlive: waveMax, secs: +(g.time - waveStart).toFixed(1), total: g.waveTotal }); curWave = g.wave; waveStart = g.time; waveMax = 0; }
      if (guard % 300 === 0) await new Promise((res) => setTimeout(res, 0));
    }
    r.maxAlive = Math.max(...r.waves.map((w) => w.maxAlive), 0); r.navRecoveries = g.navRecoveries || 0; r.mountRespawned = !!r.mountRespawned; delete r._destroyedAt; delete r.traceZ;
    r.reachAvg = r.reachT.length ? +(r.reachT.reduce((a, b) => a + b, 0) / r.reachT.length).toFixed(1) : null;
    r.reachSlow = r.reachT.filter((t) => t > 30).length;
    delete r.reachT;
    r.stuckN = r.stuck.length; r.stuckTypes = [...new Set(r.stuck.map((s) => s.type))]; r.stuck = r.stuck.slice(0, 6);
    return r;
  }, { id, WAVES });
  console.error(id, 'ok');
}
console.log(JSON.stringify({ out, errors }, null, 1));
await browser.close();
