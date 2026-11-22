// TEMPORARIO - verificacao manual da Etapa 2 (Enemy AI). Apagar depois.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 6300 + Math.floor(Math.random() * 200);
const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
const url = `http://localhost:${port}/`;
for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch { /* subindo */ } await sleep(500); }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
p.on('console', (m) => m.type() === 'error' && erros.push('console: ' + m.text()));
let R;
try {
  await p.goto(url + '?test');
  try {
    await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  } catch (e) {
    console.log('FALHA AO CARREGAR', { url, erros, texto: (await p.evaluate(() => document.body.innerText.slice(0, 300))) });
    throw e;
  }
  R = await p.evaluate(async () => {
    const g = __bh;
    const { ARENAS, ENEMIES } = __bhTest;
    const R4 = ['rm_praetor', 'rm_beast', 'rm_spirit', 'rm_standard'];
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {};
    const col = ARENAS.find((a) => a.id === 'coliseu');

    // ---- progressao / exclusividade
    g.startMatch(col, [__bhTest.SURVIVORS[0]], 'solo');
    out.from = Object.fromEntries(R4.map((t) => [t, ENEMIES[t].from]));
    out.only = Object.fromEntries(R4.map((t) => [t, ENEMIES[t].only]));
    out.order = R4.every((t) => g.buildWave(1) !== null) && R4.map((t) => t);
    out.estreia = {}; out.garantia = {};
    for (const t of R4) {
      let first = 99;
      for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 12; wv++) if (g.buildWave(wv).includes(t)) { first = Math.min(first, wv); break; }
      out.estreia[t] = first;
      let ok = 0; for (let k = 0; k < 20; k++) if (g.buildWave(ENEMIES[t].from).includes(t)) ok++;
      out.garantia[t] = `${ok}/20`;
    }
    out.fora = [];
    for (const a of ARENAS) {
      if (a.id === 'coliseu') continue;
      g.startMatch(a, [__bhTest.SURVIVORS[0]], 'solo');
      const seen = new Set();
      for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 12; wv++) g.buildWave(wv).forEach((t) => seen.add(t));
      if (R4.some((t) => seen.has(t))) out.fora.push(a.id);
    }

    // ---- cenario controlado (modelo da Etapa 1 servindo de fallback visual: a IA e a mesma por id/def)
    g.startMatch(col, [__bhTest.SURVIVORS[0]], 'solo');
    g.state = 'playing';
    const semOndas = () => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; };
    semOndas(); const iv = setInterval(semOndas, 50);
    const pl = g.players[0];
    const at = (t, dx, dz) => { g.spawnZombie(t, pl.pos.x + dx, pl.pos.z + dz); const z = g.zombies[g.zombies.length - 1]; z.rise = 0; return z; };
    const at2 = (t, dx, dz, extra = {}) => {
      const z = at(t, dx, dz);
      const d = ENEMIES[t];
      z.attackCd = 99; z.spitCd = 99; z.lungeCd = 99; z.summonCd = 99; z.blinkCd = 99;
      z.contactCd = 0.1; z.auraT = 0; z.state = 'move'; z.stateT = 0; z.aimT = 0; z.recoverT = 0;
      Object.assign(z, extra);
      return z;
    };
    const livre = (d) => {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2; const x = pl.pos.x + Math.sin(a) * d, z = pl.pos.z + Math.cos(a) * d;
        if (g.arena.inb(Math.floor(x), Math.floor(z)) && !g.arena.circleBlocked(x, z, 0.9) && g.arena.walkable(x, z, pl.pos.x, pl.pos.z, 0.6) && g.arena.los(x, z, pl.pos.x, pl.pos.z)) return [Math.sin(a) * d, Math.cos(a) * d];
      }
      return [d, 0];
    };
    const dist = (z) => Math.hypot(z.pos.x - pl.pos.x, z.pos.z - pl.pos.z);
    const espera = async (fn, s = 6) => { const t0 = g.time, r0 = performance.now(); while (g.time - t0 < s && performance.now() - r0 < 90000) { if (fn()) return true; await w(30); } return false; };
    const wg = (s) => espera(() => false, s);
    const limpa = () => { g.zombies.length = 0; g.projectiles.length = 0; pl.alive = true; pl.hp = pl.maxHp = 500; pl.armor = 0; pl.shieldT = 0; pl.dashT = 0; };

    // ---- praetor: invoca, magia roxa, aura de dano
    out.praetor = {};
    limpa();
    const pr1 = at2('rm_praetor', ...livre(10), { summonCd: 0 });
    let maxMin = 0;
    const tS = g.time;
    while (g.time - tS < 14) { maxMin = Math.max(maxMin, pr1.minions.length); if (pr1.state === 'move' && pr1.summonCd <= 0) pr1.summonCd = 0; await w(40); }
    out.praetor.invocados = pr1.minions.length;
    out.praetor.tipos = [...new Set(pr1.minions.map((m) => m.type))];
    out.praetor.maxVisto = maxMin;
    out.praetor.maxDef = ENEMIES.rm_praetor.summon.max;
    limpa();
    const pr2 = at2('rm_praetor', ...livre(8), { spitCd: 0 });
    let viuRoxo = false; const hp0 = pl.hp;
    await espera(() => { if (g.projectiles.some((q) => q.color === 0xb050ff)) viuRoxo = true; return pl.hp < hp0; }, 10);
    out.praetor.magia = { viuRoxo, dano: +(hp0 - pl.hp).toFixed(1) };
    limpa();
    const pr3 = at2('rm_praetor', 20, 0);
    const perto = at2('rm_legion', 22, 0), longe = at2('rm_legion', -14, 0);
    perto.auraT = longe.auraT = 0;
    await wg(0.6);
    out.praetor.aura = { perto: perto.auraDmg, longe: longe.auraDmg, raio: ENEMIES.rm_praetor.aura.radius };

    // ---- besta: bote com intervalo irregular + dano
    out.besta = {};
    limpa();
    const bs = at2('rm_beast', ...livre(5), { lungeCd: 0 });
    const cds = []; let last = bs.state; const tB = g.time;
    while (cds.length < 5 && g.time - tB < 25) {
      if (bs.state === 'lunge' && last !== 'lunge') cds.push(+bs.lungeCd.toFixed(2));
      if (bs.state === 'move' && last === 'lunge') bs.lungeCd = 0;
      last = bs.state;
      await w(30);
    }
    const hpB = pl.hp;
    await espera(() => pl.hp < hpB, 8);
    out.besta.cds = cds;
    out.besta.dano = +(hpB - pl.hp).toFixed(1);
    out.besta.cdDef = ENEMIES.rm_beast.lunge.cd;
    out.besta.jitter = ENEMIES.rm_beast.lunge.jitter;

    // ---- espirito: flutua, contato, blink
    out.espirito = {};
    limpa();
    const sp = at2('rm_spirit', ...livre(9));
    await wg(0.6);
    out.espirito.voa = !!sp.def.fly;
    out.espirito.flyY = +sp.flyY.toFixed(2);
    limpa();
    const sp2 = at2('rm_spirit', ...livre(6), { attackCd: 999 });
    sp2.pos.x = pl.pos.x + 0.25; sp2.pos.z = pl.pos.z;
    const hpC = pl.hp;
    await espera(() => pl.hp < hpC, 5);
    out.espirito.contato = { dano: +(hpC - pl.hp).toFixed(1), def: ENEMIES.rm_spirit.contact };
    limpa();
    const sp3 = at2('rm_spirit', ...livre(10));
    sp3.blinkCd = 0;
    const p0 = { x: sp3.pos.x, z: sp3.pos.z };
    let salto = 0; const tBl = g.time;
    while (g.time - tBl < 6) { salto = Math.max(salto, Math.hypot(sp3.pos.x - p0.x, sp3.pos.z - p0.z)); if (salto > 2) break; await w(30); }
    out.espirito.blink = { salto: +salto.toFixed(2), distDef: ENEMIES.rm_spirit.blink.dist, through: ENEMIES.rm_spirit.blink.through };
    out.espirito.formacao = !!ENEMIES.rm_spirit.formation;

    // ---- estandarte: parado, aura de dano/velocidade, sem empilhar com centuriao
    out.estandarte = {};
    limpa();
    const st = at2('rm_standard', 20, 0);
    const s0 = { x: st.pos.x, z: st.pos.z };
    await wg(2);
    out.estandarte.andou = +Math.hypot(st.pos.x - s0.x, st.pos.z - s0.z).toFixed(3);
    const pertoS = at2('rm_legion', 22, 0), longeS = at2('rm_legion', -14, 0);
    pertoS.auraT = longeS.auraT = 0;
    await wg(0.6);
    out.estandarte.aura = { pertoDano: pertoS.auraDmg, pertoHaste: +pertoS.auraHaste.toFixed(2), longeDano: longeS.auraDmg, longeHaste: longeS.auraHaste, raio: ENEMIES.rm_standard.aura.radius };
    const ce = at2('rm_centurion', 23, 1);
    pertoS.auraT = 0;
    await wg(0.6);
    out.estandarte.comCenturiao = { dano: pertoS.auraDmg, haste: +pertoS.auraHaste.toFixed(2) };
    const hpZ = pertoS.hp;
    g.damageZombie(pertoS, 10, 1, 0, pl);
    out.estandarte.reducao = { levou: +(hpZ - pertoS.hp).toFixed(1), nan: Number.isNaN(pertoS.hp) };
    out.visiveis = g.zombies.filter((z) => z.alive).map((z) => z.type);

    clearInterval(iv);
    return out;
  });
  await sleep(300);
} finally { await b.close(); pr.kill(); }

console.log(JSON.stringify({ ...R, erros }, null, 2));
