// Roma Antiga, etapas 1, 2 e 3: exclusividade do Coliseu e comportamento dos 14 inimigos romanos (+ Torre de Cerco).
// Uso: npm run test:roma   (sobe o vite dev com o src/ atual; ou --url=http://localhost:5173/)
// Resultado: tests/resultado-roma.json · prints: tests/hud-shots/roma/coliseu-5-romanos.png, coliseu-etapa2.png, coliseu-etapa3.png
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function servidor() {
  if (arg('url')) return { url: arg('url'), stop() {} };
  const port = 5900 + Math.floor(Math.random() * 300);
  const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch { /* subindo */ } await sleep(500); }
  return { url, stop: () => pr.kill() };
}

const casos = [];
const caso = (nome, ok, esperado, observado) => {
  casos.push({ caso: nome, status: ok ? 'passou' : 'falhou', esperado, observado });
  console.log(`${ok ? '✓' : '✗'} ${nome}${ok ? '' : `\n    esperado: ${esperado}\n    observado: ${JSON.stringify(observado)}`}`);
};

const RM1 = ['rm_legion', 'rm_centurion', 'rm_archer', 'rm_gladiator', 'rm_hound'];
const RM2 = ['rm_praetor', 'rm_beast', 'rm_spirit', 'rm_standard'];
const RM3 = ['rm_engineer', 'rm_chariot', 'rm_eagle', 'rm_catapult', 'rm_elephant'];
const RM_WAVE = [...RM1, ...RM2, ...RM3]; // os 14 que entram nas ondas
const RM_ALL = [...RM_WAVE, 'rm_turret'];  // + unidade invocada

const { url, stop } = await servidor();
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
p.on('console', (m) => m.type() === 'error' && erros.push('console: ' + m.text()));
let R;
try {
  await p.goto(url + '?test');
  await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  R = await p.evaluate(async ({ RM1, RM2, RM3, RM_WAVE, RM_ALL }) => {
    const g = __bh;
    const { ARENAS, ENEMIES } = __bhTest;
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = (sec) => { const n = Math.ceil(sec * 60); for (let i = 0; i < n; i++) g.update(1 / 60); };
    const stepUntil = (fn, maxSec = 10) => {
      const n = Math.ceil(maxSec * 60);
      for (let i = 0; i < n; i++) {
        if (fn()) return true;
        g.update(1 / 60);
      }
      return !!fn();
    };
    const out = {};
    // ---- spawn por arena
    const ondas = (arena, list) => {
      g.startMatch(arena, [__bhTest.SURVIVORS[0]], 'solo');
      const seen = new Set();
      for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 12; wv++) g.buildWave(wv).forEach((t) => seen.add(t));
      return list.filter((t) => seen.has(t));
    };
    const col = ARENAS.find((a) => a.id === 'coliseu');
    out.arenas = ARENAS.map((a) => a.id);
    out.noColiseu = ondas(col, RM_WAVE);
    out.torreEmOndas = ondas(col, ['rm_turret']);
    out.foraDoColiseu = ARENAS.filter((a) => a.id !== 'coliseu').map((a) => [a.id, ondas(a, RM_ALL)]).filter(([, l]) => l.length);
    out.only = Object.fromEntries(RM_ALL.map((t) => [t, ENEMIES[t]?.only]));
    // ---- progressão: primeira onda em que aparece e garantia na onda de estreia
    g.startMatch(col, [__bhTest.SURVIVORS[0]], 'solo');
    out.estreia = {}; out.garantia = {};
    for (const t of RM_WAVE) {
      let first = 99;
      for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 12; wv++) if (g.buildWave(wv).includes(t)) { first = Math.min(first, wv); break; }
      out.estreia[t] = first;
      let ok = 0; for (let k = 0; k < 20; k++) if (g.buildWave(ENEMIES[t].from).includes(t)) ok++;
      out.garantia[t] = `${ok}/20`;
    }
    const seq = (t, n, wv) => { let hit = 0, tot = 0; for (let k = 0; k < 30; k++) { const l = g.buildWave(wv); for (let i = 0; i < l.length; i++) if (l[i] === t) { tot++; if (l.slice(i, i + n).every((x) => x === t)) hit++; } } return { tot, hit }; };
    out.grupoLegiao = seq('rm_legion', 4, 2);
    out.trioCaes = seq('rm_hound', 3, 3);

    // ---- cenário controlado no Coliseu
    g.state = 'playing';
    const semOndas = () => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; };
    semOndas(); const iv = setInterval(semOndas, 50);
    const pl = g.players[0];
    const at = (t, dx, dz) => { g.spawnZombie(t, pl.pos.x + dx, pl.pos.z + dz); const z = g.zombies[g.zombies.length - 1]; z.rise = 0; return z; };
    const distSeg = (qx, qz, px, pz, rx, rz) => {
      const vx = rx - px, vz = rz - pz;
      const t = Math.max(0, Math.min(1, ((qx - px) * vx + (qz - pz) * vz) / (vx * vx + vz * vz || 1)));
      return Math.hypot(qx - (px + vx * t), qz - (pz + vz * t));
    };
    const livre = (d, folga = 1.2) => {
      for (const f of [folga, 0.8, 0.5, 0]) {
        for (let k = 0; k < 24; k++) {
          const a = (k / 24) * Math.PI * 2; const x = pl.pos.x + Math.sin(a) * d, z = pl.pos.z + Math.cos(a) * d;
          if (!g.arena.inb(Math.floor(x), Math.floor(z)) || g.arena.circleBlocked(x, z, 0.9) || !g.arena.walkable(x, z, pl.pos.x, pl.pos.z, 0.6) || !g.arena.los(x, z, pl.pos.x, pl.pos.z)) continue;
          if (g.arena.props.some((q) => !q.dead && distSeg(q.x, q.z, pl.pos.x, pl.pos.z, x, z) < f)) continue;
          return [Math.sin(a) * d, Math.cos(a) * d];
        }
      }
      return [d, 0];
    };
    const dist = (z) => Math.hypot(z.pos.x - pl.pos.x, z.pos.z - pl.pos.z);
    const limpa = () => {
      g.zombies.length = 0;
      g.projectiles.length = 0;
      pl.alive = true;
      pl.hp = pl.maxHp = 250;
      pl.armor = 0;
      pl.shieldT = 0;
      pl.dashT = 0;
      pl.slowT = 0;
      pl.slowMul = 1;
      pl.stunT = 0;
      pl.rootT = 0;
      pl.exoT = 0;
      semOndas();
    };
    g.debugGod = false;
    out.por = {};
    for (const t of RM_ALL) {
      const r = (out.por[t] = {});
      limpa();
      const [dx, dz] = livre(9);
      const z = at(t, dx, dz);
      r.modelo = !!z.mesh || !!z.obj || !!z.group || g.zombies.includes(z);
      const d0 = dist(z);
      const x0 = z.pos.x, z0 = z.pos.z;
      if (z.lungeCd !== undefined) z.lungeCd = 0;
      if (z.spitCd !== undefined) z.spitCd = 0;
      if (z.lobCd !== undefined) z.lobCd = 0;
      if (z.summonCd !== undefined) z.summonCd = ENEMIES[t].spit ? 99 : 0;
      if (z.blinkCd !== undefined) z.blinkCd = 0;
      const hp0 = pl.hp;
      if (ENEMIES[t].static && !ENEMIES[t].spit && !ENEMIES[t].lob) {
        step(2);
        r.andou = +Math.hypot(z.pos.x - x0, z.pos.z - z0).toFixed(3);
        r.causouDano = pl.hp < hp0;
        r.danoSofrido = +(hp0 - pl.hp).toFixed(1);
      } else {
        const tDano = g.time;
        while (g.time - tDano < 15 && pl.hp === hp0 && z.alive) g.update(1 / 60);
        r.andou = +Math.hypot(z.pos.x - x0, z.pos.z - z0).toFixed(3);
        r.causouDano = pl.hp < hp0;
        r.danoSofrido = +(hp0 - pl.hp).toFixed(1);
        r.aproximou = +(d0 - dist(z)).toFixed(2);
        r.distFinal = +dist(z).toFixed(2);
        r.zVivo = z.alive;
        r.zHp = +z.hp.toFixed(1);
      }
      // arma comum: pistola por hitscan
      limpa();
      const [ex, ez] = livre(5);
      const z2 = at(t, ex, ez); z2.dodge = 0;
      const sx0 = z2.pos.x, sz0 = z2.pos.z;
      const hp1 = z2.hp;
      g.hitscan(pl, pl.pos.x, pl.pos.z, Math.atan2(z2.pos.x - pl.pos.x, z2.pos.z - pl.pos.z), g.wstat('pistol'));
      r.pistola = +(hp1 - z2.hp).toFixed(1);
      if (ENEMIES[t].static) {
        step(0.2);
        r.recuo = +Math.hypot(z2.pos.x - sx0, z2.pos.z - sz0).toFixed(3);
      }
      // explosão
      const hp2 = z2.hp; const sc0 = g.stats.score; const k0 = g.stats.kills;
      g.explosion(z2.pos.x, z2.pos.z, 3.6, 130, pl);
      r.explosao = +(hp2 - Math.max(0, z2.hp)).toFixed(1);
      if (z2.alive) g.damageZombie(z2, 9999, 1, 0, pl);
      r.morreu = !z2.alive;
      r.score = g.stats.score - sc0;
      r.kills = g.stats.kills - k0;
      r.scoreDef = ENEMIES[t].score;
      r.nan = Number.isNaN(z2.hp) || Number.isNaN(pl.hp);
    }

    // ==================== ETAPA 1 ====================
    limpa();
    const ce = at('rm_centurion', 30, 0);
    const perto = at('rm_legion', 32, 0), longe = at('rm_legion', -10, 0);
    const a1 = perto.hp, a2 = longe.hp;
    g.damageZombie(perto, 10, 1, 0, pl); g.damageZombie(longe, 10, 1, 0, pl);
    out.auraDano = { perto: +(a1 - perto.hp).toFixed(1), longe: +(a2 - longe.hp).toFixed(1), raio: ENEMIES.rm_centurion.aura.radius };
    limpa();
    const ce2 = at('rm_centurion', 12, 0); ce2.speed = 0;
    const l1 = at('rm_legion', 14, 0), l2 = at('rm_legion', -12, 0);
    for (const q of [l1, l2]) q.auraT = 0;
    step(0.5);
    out.auraHaste = { dentro: l1.auraHaste, fora: l2.auraHaste, raio: ENEMIES.rm_centurion.aura.radius };
    limpa();
    const [fx, fz] = livre(12);
    const L = [[0, 0], [1.8, 0], [0, 1.8], [1.8, 1.8]].map(([a, c]) => at('rm_legion', fx + a, fz + c));
    const spread = () => Math.max(...L.filter((q) => q.alive).flatMap((a) => L.filter((q) => q.alive).map((c) => Math.hypot(a.pos.x - c.pos.x, a.pos.z - c.pos.z))));
    const s0 = spread(); step(2.5);
    out.legiao = { inicio: +s0.toFixed(2), depois: +spread().toFixed(2), vivos: L.filter((q) => q.alive).length };
    limpa();
    const [ax, az] = livre(3);
    const ar = at('rm_archer', ax, az);
    const da0 = dist(ar); step(1.5);
    out.arqueiroDist = { inicio: +da0.toFixed(2), depois: +dist(ar).toFixed(2) };
    limpa();
    const [bx, bz] = livre(8);
    const ar2 = at('rm_archer', bx, bz); ar2.spitCd = 0;
    let mirou = false, parado = true, pos = null, recup = false, flechaAntesDaMira = false;
    stepUntil(() => {
      if (!mirou && g.projectiles.some((q) => q.kind === 'acid')) flechaAntesDaMira = true;
      if (ar2.aimT > 0) { if (!mirou) { mirou = true; pos = { x: ar2.pos.x, z: ar2.pos.z }; } else if (Math.hypot(ar2.pos.x - pos.x, ar2.pos.z - pos.z) > 0.05) parado = false; }
      if (ar2.recoverT > 0) recup = true;
      return mirou && recup;
    }, 6);
    out.arqueiroMira = { mirou, paradoNaMira: parado, recuperou: recup, flechaAntesDaMira };
    const A = g.arena; let cel = -1;
    for (let i = 0; i < A.cover.length; i++) if (A.cover[i] && !A.tallAt((i % A.W) + 0.5, Math.floor(i / A.W) + 0.5)) { cel = i; break; }
    if (cel >= 0) {
      g.projectiles.length = 0;
      const cx = (cel % A.W) + 0.5, cz = Math.floor(cel / A.W) + 0.5;
      const mk = (pierce) => ({ kind: 'acid', x: cx, y: 0.6, z: cz, vx: 0.01, vy: 0, vz: 0, t: 0, dmg: 1, color: 0xffffff, splat: '#fff', pierce });
      const pp = mk(true), pc = mk(false);
      g.projectiles.push(pp, pc);
      step(0.05);
      out.cobertura = { celula: [cx, cz], perfuranteViva: !pp.dead, comumMorreu: !!pc.dead || !g.projectiles.includes(pc) };
    } else out.cobertura = { celula: null };
    limpa();
    const [gx, gz] = livre(5);
    const gl = at('rm_gladiator', gx, gz); gl.lungeCd = 0;
    const ordem = [];
    let pw = null, paradoWind = true;
    stepUntil(() => {
      if (ordem[ordem.length - 1] !== gl.state) ordem.push(gl.state);
      if (gl.state === 'wind') { if (!pw) pw = { x: gl.pos.x, z: gl.pos.z }; else if (Math.hypot(gl.pos.x - pw.x, gl.pos.z - pw.z) > 0.05) paradoWind = false; }
      return ordem.includes('lunge');
    }, 6);
    out.gladiador = { ordem, paradoWind, windAntes: ordem.indexOf('wind') >= 0 && ordem.indexOf('wind') < ordem.indexOf('lunge') };
    limpa();
    const [hx, hz] = livre(11);
    const H = [0, 0.6, 1.2].map((o) => at('rm_hound', hx + o, hz + o * 0.3));
    for (const q of H) q.lungeCd = 9;
    const ang = (q) => Math.atan2(q.pos.x - pl.pos.x, q.pos.z - pl.pos.z);
    const abertura = () => { const a = H.map(ang); let m = 0; for (const x of a) for (const y of a) { let d = Math.abs(x - y); if (d > Math.PI) d = 2 * Math.PI - d; m = Math.max(m, d); } return +(m * 180 / Math.PI).toFixed(1); };
    const ab0 = abertura(); step(2.5);
    out.caes = { aberturaInicio: ab0, aberturaDepois: abertura(), lados: H.map((q) => q.flankSide) };

    // ==================== ETAPA 2 ====================
    out.pretor = {};
    limpa();
    const [px, pz] = livre(10);
    const pr = at('rm_praetor', px, pz);
    pr.spitCd = 99; pr.summonCd = 0;
    let castVisto = false;
    stepUntil(() => { if (pr.state === 'cast') castVisto = true; return pr.minions.length >= 2; }, 5);
    const inv1 = pr.minions.map((m) => m.type);
    pr.summonCd = 0; pr.spitCd = 99;
    stepUntil(() => pr.minions.length >= 4, 5);
    const apos2 = pr.minions.filter((m) => m.alive).length;
    pr.summonCd = 0; pr.spitCd = 99; step(2.5);
    out.pretor.invocacao = { castVisto, tiposValidos: inv1.length >= 2 && inv1.every((t) => ENEMIES.rm_praetor.summon.types.includes(t)), apos2, apos3: pr.minions.filter((m) => m.alive).length };
    limpa();
    const [pmx, pmz] = livre(8);
    const pr2 = at('rm_praetor', pmx, pmz); pr2.summonCd = 99; pr2.spitCd = 0;
    let prMirou = false, prRecup = false, projRoxo = null;
    stepUntil(() => {
      if (pr2.aimT > 0) prMirou = true;
      if (pr2.recoverT > 0) prRecup = true;
      const found = g.projectiles.find((q) => q.kind === 'acid' && q.color === 0xb050ff);
      if (found) projRoxo = { color: found.color, slow: found.slow };
      return prMirou && prRecup && !!projRoxo;
    }, 5);
    const hpSlow0 = pl.hp;
    stepUntil(() => pl.hp < hpSlow0 || pl.slowT > 0, 3);
    out.pretor.magia = { mirou: prMirou, recuperou: prRecup, projRoxo, aplicouSlow: pl.slowT > 0, dano: +(hpSlow0 - pl.hp).toFixed(1) };
    limpa();
    const pr3 = at('rm_praetor', 24, 0); pr3.speed = 0; pr3.summonCd = 99; pr3.spitCd = 99;
    const pPerto = at('rm_legion', 26, 0), pLonge = at('rm_legion', -12, 0);
    pPerto.auraT = pLonge.auraT = 0; step(0.5);
    const ph1 = pPerto.hp, ph2 = pLonge.hp;
    g.damageZombie(pPerto, 10, 1, 0, pl); g.damageZombie(pLonge, 10, 1, 0, pl);
    out.pretor.aura = { reducaoPerto: +(ph1 - pPerto.hp).toFixed(2), reducaoLonge: +(ph2 - pLonge.hp).toFixed(2), dmgPerto: pPerto.auraDmg, dmgLonge: pLonge.auraDmg, ring: ENEMIES.rm_praetor.aura.ring };

    limpa();
    const [bex, bez] = livre(5);
    const be = at('rm_beast', bex, bez);
    const cds = []; let entrouLunge = false, danoLunge = 0;
    for (let k = 0; k < 12; k++) {
      be.pos.x = pl.pos.x + bex; be.pos.z = pl.pos.z + bez;
      be.state = 'move'; be.lungeCd = 0; be.attackCd = 99;
      const hpB0 = pl.hp;
      if (stepUntil(() => { if (be.state === 'lunge') { entrouLunge = true; return true; } return false; }, 2)) {
        cds.push(+be.lungeCd.toFixed(3));
        if (k === 0) { step(0.6); danoLunge = +(hpB0 - pl.hp).toFixed(1); }
      }
      pl.hp = pl.maxHp = 250;
    }
    out.besta = { entrouLunge, danoLunge, variacao: cds.length ? +(Math.max(...cds) - Math.min(...cds)).toFixed(3) : 0 };

    out.espirito = {};
    limpa();
    const [spx, spz] = livre(9);
    const sp = at('rm_spirit', spx, spz); sp.blinkCd = 99; step(0.6);
    out.espirito.flutua = { fly: !!sp.def.fly, flyY: +sp.flyY.toFixed(2) };
    limpa();
    const sp2 = at('rm_spirit', 0.25, 0); sp2.attackCd = 999; sp2.blinkCd = 99; sp2.contactCd = 0; sp2.speed = 0;
    const hpC0 = pl.hp; stepUntil(() => pl.hp < hpC0, 2);
    const danoC1 = +(hpC0 - pl.hp).toFixed(1);
    const hpC1 = pl.hp; step(0.3); const repetiuCedo = pl.hp < hpC1;
    step(0.8); const segundoTick = +(hpC1 - pl.hp).toFixed(1);
    out.espirito.contato = { dano1: danoC1, repetiuCedo, segundoTick };
    limpa();
    const [sbx, sbz] = livre(10);
    const sp3 = at('rm_spirit', sbx, sbz); sp3.blinkCd = 0; sp3.speed = 0;
    const bp0 = { x: sp3.pos.x, z: sp3.pos.z }; let salto = 0;
    stepUntil(() => { salto = Math.hypot(sp3.pos.x - bp0.x, sp3.pos.z - bp0.z); return salto >= 2.5; }, 3);
    out.espirito.blink = { salto: +salto.toFixed(2), through: !!ENEMIES.rm_spirit.blink.through };

    out.estandarte = {};
    limpa();
    const st = at('rm_standard', 20, 0); const st0 = { x: st.pos.x, z: st.pos.z }; step(2);
    out.estandarte.andou = +Math.hypot(st.pos.x - st0.x, st.pos.z - st0.z).toFixed(3);
    const sPerto = at('rm_legion', 22, 0), sLonge = at('rm_legion', -14, 0);
    sPerto.auraT = sLonge.auraT = 0; step(0.5);
    out.estandarte.aura = { pertoDmg: sPerto.auraDmg, pertoHaste: +sPerto.auraHaste.toFixed(2), longeDmg: sLonge.auraDmg, longeHaste: +sLonge.auraHaste.toFixed(2), ring: ENEMIES.rm_standard.aura.ring };
    const ceS = at('rm_centurion', 23, 1); ceS.speed = 0;
    const prS = at('rm_praetor', 23, -1); prS.speed = 0; prS.summonCd = 99; prS.spitCd = 99;
    sPerto.auraT = 0; step(0.5);
    const hpS0 = sPerto.hp; g.damageZombie(sPerto, 10, 1, 0, pl);
    out.estandarte.semEmpilhar = { dmg: sPerto.auraDmg, haste: +sPerto.auraHaste.toFixed(2), danoRecebido: +(hpS0 - sPerto.hp).toFixed(2), nan: Number.isNaN(sPerto.hp) };
    limpa();
    const semAura = at('rm_legion', 0.8, 0); semAura.attackCd = 0; semAura.auraT = 0;
    const hpSem0 = pl.hp; stepUntil(() => pl.hp < hpSem0, 2);
    const danoSemAura = +(hpSem0 - pl.hp).toFixed(2);
    limpa();
    const stDmg = at('rm_standard', 2.5, 0);
    const comAura = at('rm_legion', 0.8, 0); comAura.auraT = 0; comAura.attackCd = 0.4;
    step(0.35); const hpCom0 = pl.hp; stepUntil(() => pl.hp < hpCom0, 2);
    out.estandarte.danoReal = { semAura: danoSemAura, comAura: +(hpCom0 - pl.hp).toFixed(2), auraDmg: comAura.auraDmg, stAlive: stDmg.alive };

    // ==================== ETAPA 3 ====================
    // ---- Catapulta de Cerco: siegeSpot livre, aviso no chão (throw), rocha em arco com dano em área e esquivável
    out.catapulta = {};
    limpa();
    const spot = g.siegeSpot(ENEMIES.rm_catapult.radius);
    out.catapulta.siegeSpotOk = !!spot && !A.circleBlocked(spot.x, spot.z, ENEMIES.rm_catapult.radius) && A.gates.every((gt) => Math.hypot(gt.x - spot.x, gt.z - spot.z) >= 3.5);
    const [cx0, cz0] = livre(12);
    const cat = at('rm_catapult', cx0, cz0); cat.lobCd = 0;
    let avisoVisto = false, rochaVista = null;
    stepUntil(() => {
      if (cat.state === 'throw' && cat.throwAt) avisoVisto = true;
      const rk = g.projectiles.find((q) => q.kind === 'rock');
      if (rk) rochaVista = { r: rk.r, dmg: rk.dmg };
      return avisoVisto && !!rochaVista;
    }, 4);
    const hpCat0 = pl.hp;
    stepUntil(() => pl.hp < hpCat0 || !g.projectiles.some((q) => q.kind === 'rock'), 4);
    const danoParado = +(hpCat0 - pl.hp).toFixed(1);
    // testa esquiva: durante o aviso, jogador sai do raio marcado e evita o dano
    limpa();
    const cat2 = at('rm_catapult', cx0, cz0); cat2.lobCd = 0;
    const plOrig = { x: pl.pos.x, z: pl.pos.z };
    stepUntil(() => cat2.state === 'throw' && !!cat2.throwAt, 2);
    const alvoMarcado = { ...cat2.throwAt };
    // move o jogador para fora do raio marcado (4 m de lado em célula livre)
    const [evX, evZ] = livre(4.5);
    pl.pos.x += evX; pl.pos.z += evZ;
    const hpEsq0 = pl.hp;
    stepUntil(() => g.projectiles.some((q) => q.kind === 'rock'), 3);
    stepUntil(() => !g.projectiles.some((q) => q.kind === 'rock'), 4);
    const danoEsquiva = +(hpEsq0 - pl.hp).toFixed(1);
    pl.pos.x = plOrig.x; pl.pos.z = plOrig.z;
    out.catapulta.ataque = { avisoVisto, rochaVista, danoParado, danoEsquiva, alvoNoJogador: Math.hypot(alvoMarcado.x - plOrig.x, alvoMarcado.z - plOrig.z) < 0.5 };

    // ---- Elefante de Guerra: wind→lunge, atordoa jogador (stunT), quebra obstáculo destrutível e barricada, quake atordoa
    out.elefante = {};
    limpa();
    const [elx, elz] = livre(7);
    const el = at('rm_elephant', elx, elz); el.lungeCd = 0;
    // coloca uma barricada do jogador no meio do caminho entre o elefante e o jogador
    const mx = pl.pos.x + elx * 0.5, mz = pl.pos.z + elz * 0.5;
    const bar = { kind: 'barricade', x: mx, z: mz, hp: 100, maxHp: 100, dead: false };
    g.placeables.push(bar);
    // também coloca um prop destrutível sintético no trajeto para garantir verificação determinística
    const propDestr = { x: pl.pos.x + elx * 0.35, z: pl.pos.z + elz * 0.35, hp: 40, maxHp: 40, dead: false, rot: 0, def: { id: 'crate', hp: 40, coll: 'none', mat: 'wood' }, parts: [[0, 0.5, 0, 0.8, 0.8, 0.8, 0x8a6a3a]] };
    A.props.push(propDestr);
    const elOrdem = [];
    let elStunMax = 0;
    const hpEl0 = pl.hp;
    stepUntil(() => {
      if (elOrdem[elOrdem.length - 1] !== el.state) elOrdem.push(el.state);
      if (pl.stunT > elStunMax) elStunMax = pl.stunT;
      return bar.dead && propDestr.dead && pl.hp < hpEl0 && elStunMax > 0;
    }, 5);
    // remove prop sintético caso não tenha morrido
    const idxP = A.props.indexOf(propDestr);
    if (idxP >= 0) A.props.splice(idxP, 1);
    out.elefante.investida = {
      windAntes: elOrdem.indexOf('wind') >= 0 && elOrdem.indexOf('wind') < elOrdem.indexOf('lunge'),
      quebrouBarricada: !!bar.dead,
      quebrouProp: !!propDestr.dead,
      dano: +(hpEl0 - pl.hp).toFixed(1),
      stunMax: +elStunMax.toFixed(2),
    };
    // quake do elefante também atordoa
    limpa();
    const el2 = at('rm_elephant', 2.0, 0);
    const hpQ0 = pl.hp;
    g.quake(el2, ENEMIES.rm_elephant.quake);
    out.elefante.quake = { dano: +(hpQ0 - pl.hp).toFixed(1), stunT: +pl.stunT.toFixed(2) };

    // ---- Engenheiro de Cerco + Torre de Cerco: cast, monta até max=2 torres, torre atira e morre, aura protege aliado
    out.engenheiro = {};
    limpa();
    const [enx, enz] = livre(9);
    const eng = at('rm_engineer', enx, enz); eng.summonCd = 0;
    let engCast = false;
    stepUntil(() => { if (eng.state === 'cast') engCast = true; return eng.minions.length >= 1; }, 4);
    const t1 = eng.minions[0];
    eng.summonCd = 0;
    stepUntil(() => eng.minions.length >= 2, 4);
    const n2 = eng.minions.filter((m) => m.alive).length;
    eng.summonCd = 0; step(2.5);
    const n3 = eng.minions.filter((m) => m.alive).length;
    // verifica aura de proteção do engenheiro em aliado próximo
    const aliPerto = at('rm_legion', enx + 1.5, enz);
    const aliLonge = at('rm_legion', enx - 12, enz);
    const ah1 = aliPerto.hp, ah2 = aliLonge.hp;
    g.damageZombie(aliPerto, 10, 1, 0, pl); g.damageZombie(aliLonge, 10, 1, 0, pl);
    out.engenheiro = {
      castVisto: engCast,
      tipoTorre: t1?.type,
      torreFixa: !!t1?.def.static,
      apos2: n2,
      apos3: n3,
      auraPerto: +(ah1 - aliPerto.hp).toFixed(2),
      auraLonge: +(ah2 - aliLonge.hp).toFixed(2),
    };

    // ---- Carruagem de Guerra: wind→lunge (atropela) e arremessa lanças (spit)
    out.carruagem = {};
    limpa();
    const [chx, chz] = livre(7);
    const ch = at('rm_chariot', chx, chz); ch.lungeCd = 0; ch.spitCd = 99;
    const chOrd = []; let chPw = null, chParado = true;
    const hpCh0 = pl.hp;
    stepUntil(() => {
      if (chOrd[chOrd.length - 1] !== ch.state) chOrd.push(ch.state);
      if (ch.state === 'wind') { if (!chPw) chPw = { x: ch.pos.x, z: ch.pos.z }; else if (Math.hypot(ch.pos.x - chPw.x, ch.pos.z - chPw.z) > 0.05) chParado = false; }
      return chOrd.includes('lunge') && pl.hp < hpCh0;
    }, 5);
    limpa();
    const [chx2, chz2] = livre(9);
    const ch2 = at('rm_chariot', chx2, chz2); ch2.lungeCd = 99; ch2.spitCd = 0;
    let lancaVista = false; const hpLan0 = pl.hp;
    stepUntil(() => {
      if (g.projectiles.some((q) => q.kind === 'acid')) lancaVista = true;
      return lancaVista && pl.hp < hpLan0;
    }, 4);
    out.carruagem = {
      windAntes: chOrd.indexOf('wind') >= 0 && chOrd.indexOf('wind') < chOrd.indexOf('lunge'),
      paradoWind: chParado,
      danoAtropelo: +(hpCh0 - pl.hp).toFixed(1),
      lancaVista,
      danoLanca: +(hpLan0 - pl.hp).toFixed(1),
    };

    // ---- Águia Imperial Corrompida: voa (flyY > 1), dispara energia roxa e mergulha (wind→lunge)
    out.aguia = {};
    limpa();
    const [agx, agz] = livre(6.5);
    const ag = at('rm_eagle', agx, agz); ag.lungeCd = 0; ag.spitCd = 99;
    const agOrd = []; const hpAg0 = pl.hp;
    stepUntil(() => {
      if (agOrd[agOrd.length - 1] !== ag.state) agOrd.push(ag.state);
      return agOrd.includes('lunge') && pl.hp < hpAg0;
    }, 5);
    const agFlyY = +ag.flyY.toFixed(2);
    limpa();
    const [agx2, agz2] = livre(9);
    const ag2 = at('rm_eagle', agx2, agz2); ag2.lungeCd = 99; ag2.spitCd = 0;
    let raioAguia = false; const hpAgR0 = pl.hp;
    stepUntil(() => {
      if (g.projectiles.some((q) => q.kind === 'acid' && q.color === 0xc040ff)) raioAguia = true;
      return raioAguia && pl.hp < hpAgR0;
    }, 4);
    out.aguia = {
      voa: !!ag.def.fly && agFlyY > 1,
      flyY: agFlyY,
      strafe: !!ag.def.strafe,
      windAntes: agOrd.indexOf('wind') >= 0 && agOrd.indexOf('wind') < agOrd.indexOf('lunge'),
      danoMergulho: +(hpAg0 - pl.hp).toFixed(1),
      raioRoxo: raioAguia,
      danoRaio: +(hpAgR0 - pl.hp).toFixed(1),
    };

    // ---- Bestiário: todos os 15 nomes aparecem sem erro
    g.ui.showScreen('enemies');
    await w(300);
    const bestTexto = document.body.innerText;
    out.bestiario = { faltando: RM_ALL.filter((t) => !bestTexto.includes(ENEMIES[t].name)), total: RM_ALL.length };
    g.ui.showScreen(null);

    // ---- print 1: Etapa 1
    limpa(); g.debugGod = true; clearInterval(iv); semOndas();
    const f = (t, x, zOff = 3) => { const z = at(t, x, zOff); z.facing = Math.PI; z.speed = 0; return z; };
    f('rm_legion', -4); f('rm_centurion', -2); f('rm_archer', 0); f('rm_gladiator', 2); f('rm_hound', 4);
    await w(250);
    g.state = 'paused'; g.ui.showScreen(null);
    out.visiveis1 = g.zombies.filter((z) => z.alive).map((z) => z.type);
    return out;
  }, { RM1, RM2, RM3, RM_WAVE, RM_ALL });
  await sleep(350);
  fs.mkdirSync(path.join(ROOT, 'tests', 'hud-shots', 'roma'), { recursive: true });
  await p.screenshot({ path: path.join(ROOT, 'tests', 'hud-shots', 'roma', 'coliseu-5-romanos.png') });

  // ---- print 2: Etapa 2
  R.visiveis2 = await p.evaluate(async () => {
    const g = __bh; const pl = g.players[0];
    g.state = 'playing'; g.zombies.length = 0; g.projectiles.length = 0;
    const f = (t, x) => {
      g.spawnZombie(t, pl.pos.x + x, pl.pos.z + 3.5);
      const z = g.zombies[g.zombies.length - 1];
      z.rise = 0; z.facing = Math.PI; z.speed = 0;
      z.summonCd = 99; z.spitCd = 99; z.lungeCd = 99; z.blinkCd = 99; z.attackCd = 99;
      return z;
    };
    f('rm_praetor', -4.5); f('rm_beast', -1.5); f('rm_spirit', 1.5); f('rm_standard', 4.5);
    g.update(1 / 60);
    await new Promise((r) => setTimeout(r, 250));
    g.state = 'paused'; g.ui.showScreen(null);
    return g.zombies.filter((z) => z.alive).map((z) => z.type);
  });
  await sleep(350);
  await p.screenshot({ path: path.join(ROOT, 'tests', 'hud-shots', 'roma', 'coliseu-etapa2.png') });

  // ---- print 3: Etapa 3 (os 5 + Torre de Cerco)
  R.visiveis3 = await p.evaluate(async () => {
    const g = __bh; const pl = g.players[0];
    g.state = 'playing'; g.zombies.length = 0; g.projectiles.length = 0;
    const f = (t, x, dz) => {
      g.spawnZombie(t, pl.pos.x + x, pl.pos.z + dz);
      const z = g.zombies[g.zombies.length - 1];
      z.rise = 0; z.facing = Math.PI; z.speed = 0;
      z.summonCd = 99; z.spitCd = 99; z.lungeCd = 99; z.lobCd = 99; z.attackCd = 99;
      return z;
    };
    f('rm_catapult', -5.2, 3.2);
    f('rm_elephant', -2.0, 3.8);
    f('rm_engineer', 1.2, 3.2);
    f('rm_turret', 2.9, 3.2);
    f('rm_chariot', 5.4, 3.6);
    f('rm_eagle', 0.0, 1.4);
    g.update(1 / 60);
    await new Promise((r) => setTimeout(r, 250));
    g.state = 'paused'; g.ui.showScreen(null);
    return g.zombies.filter((z) => z.alive).map((z) => z.type);
  });
  await sleep(350);
  await p.screenshot({ path: path.join(ROOT, 'tests', 'hud-shots', 'roma', 'coliseu-etapa3.png') });
} finally {
  await b.close();
  stop();
}

const EST = {
  rm_legion: 1, rm_hound: 2, rm_archer: 3, rm_gladiator: 4, rm_centurion: 5,
  rm_praetor: 6, rm_beast: 6, rm_spirit: 7, rm_standard: 8,
  rm_engineer: 7, rm_chariot: 8, rm_eagle: 8, rm_catapult: 9, rm_elephant: 9,
};
caso('Os 14 inimigos de onda aparecem no Coliseu (ondas 1–12)', R.noColiseu.length === 14, '14 tipos', R.noColiseu);
caso('rm_turret (summonedOnly) não entra no sorteio comum de ondas', R.torreEmOndas.length === 0, 'lista vazia', R.torreEmOndas);
caso(`Nenhum romano nas outras ${R.arenas.length - 1} arenas`, R.foraDoColiseu.length === 0, 'lista vazia', R.foraDoColiseu);
caso('only = [coliseu] nos 15', RM_ALL.every((t) => JSON.stringify(R.only[t]) === '["coliseu"]'), '["coliseu"]', R.only);
for (const t of RM_WAVE) {
  caso(`${t}: estreia na onda ${EST[t]}`, R.estreia[t] === EST[t], `onda ${EST[t]}`, R.estreia[t]);
  caso(`${t}: garantido na onda de estreia`, R.garantia[t] === '20/20', '20/20', R.garantia[t]);
}
for (const t of RM_ALL) {
  const r = R.por[t];
  caso(`${t}: modelo criado sem erro`, r.modelo, 'objeto 3D criado', r.modelo);
  if (t === 'rm_standard') {
    caso(`${t}: fixo (não anda, sem recuo e sem dano direto)`, r.andou === 0 && r.recuo === 0 && !r.causouDano, 'andou 0, recuo 0, dano 0', { andou: r.andou, recuo: r.recuo, causouDano: r.causouDano });
  } else if (t === 'rm_catapult' || t === 'rm_turret') {
    caso(`${t}: fixo (não anda/sem recuo) e causa dano à distância`, r.andou === 0 && r.recuo === 0 && r.causouDano && r.danoSofrido > 0, 'andou 0, recuo 0, dano > 0', { andou: r.andou, recuo: r.recuo, danoSofrido: r.danoSofrido });
  } else {
    caso(`${t}: persegue/ataca e causa dano`, r.causouDano && r.danoSofrido > 0, 'jogador perde vida', { danoSofrido: r.danoSofrido, aproximou: r.aproximou, distFinal: r.distFinal });
  }
  caso(`${t}: pistola causa dano`, r.pistola > 0, '> 0', r.pistola);
  caso(`${t}: explosão causa dano`, r.explosao > 0, '> 0', r.explosao);
  caso(`${t}: morre, dá score/abate e sem NaN`, r.morreu && r.kills === 1 && r.score >= r.scoreDef && !r.nan, `kills 1, score ≥ ${r.scoreDef}, sem NaN`, { morreu: r.morreu, kills: r.kills, score: r.score, nan: r.nan });
}

// Etapa 1
caso('Legionários em grupos de 4 na lista da onda', R.grupoLegiao.hit > 0, 'há sequências de 4', R.grupoLegiao);
caso('Cães em trio na lista da onda', R.trioCaes.hit > 0, 'há sequências de 3', R.trioCaes);
caso('Formação: legião não se espalha', R.legiao.depois <= R.legiao.inicio + 0.5 && R.legiao.vivos >= 3, 'afastamento máx. não cresce', R.legiao);
caso('Aura do centurião: reduz dano só dentro do raio', R.auraDano.perto < R.auraDano.longe, 'perto < longe', R.auraDano);
caso('Aura do centurião: acelera só dentro do raio', R.auraHaste.dentro > 1 && (R.auraHaste.fora ?? 1) === 1, 'dentro 1,15; fora 1', R.auraHaste);
caso('Arqueiro recua/mantém distância quando perto', R.arqueiroDist.depois > R.arqueiroDist.inicio, 'distância aumenta', R.arqueiroDist);
caso('Arqueiro prepara antes de atirar, parado, e recupera', R.arqueiroMira.mirou && R.arqueiroMira.paradoNaMira && R.arqueiroMira.recuperou && !R.arqueiroMira.flechaAntesDaMira, 'aimT>0 parado → tiro → recoverT>0', R.arqueiroMira);
caso('Flecha perfurante atravessa cobertura baixa (comum é barrada)', R.cobertura.celula && R.cobertura.perfuranteViva && R.cobertura.comumMorreu, 'perfurante viva, comum morta', R.cobertura);
caso('Gladiador anuncia (wind) antes da investida e fica parado', R.gladiador.windAntes && R.gladiador.paradoWind, "'wind' antes de 'lunge'", R.gladiador);
caso('Cães abrem para os lados (aproximado)', R.caes.aberturaDepois > R.caes.aberturaInicio + 10 && new Set(R.caes.lados).size === 3, 'abertura angular cresce >10°; lados −1/0/1', R.caes);

// Etapa 2
caso('Pretor: prepara (cast), invoca reforços romanos e respeita teto max=4', R.pretor.invocacao.castVisto && R.pretor.invocacao.tiposValidos && R.pretor.invocacao.apos2 === 4 && R.pretor.invocacao.apos3 === 4, 'cast + tipos romanos + teto 4', R.pretor.invocacao);
caso('Pretor: prepara, dispara raio roxo com slow e recupera', R.pretor.magia.mirou && R.pretor.magia.recuperou && R.pretor.magia.projRoxo?.color === 0xb050ff && R.pretor.magia.aplicouSlow && R.pretor.magia.dano > 0, 'raio 0xb050ff + slow + dano', R.pretor.magia);
caso('Pretor: aura roxa reduz dano recebido e reforça dano dos aliados', R.pretor.aura.reducaoPerto < R.pretor.aura.reducaoLonge && R.pretor.aura.dmgPerto === 1.15 && R.pretor.aura.dmgLonge === 1 && R.pretor.aura.ring === 0xb050ff, 'redução < longe, dmg 1.15 dentro / 1 fora', R.pretor.aura);
caso('Besta: investe (lunge), causa dano e alterna cooldown irregular (jitter)', R.besta.entrouLunge && R.besta.danoLunge > 0 && R.besta.variacao > 0.3, 'lunge + dano > 0 + variação > 0.3s', R.besta);
caso('Espírito: flutua acima do chão (flyY > 1)', R.espirito.flutua.fly && R.espirito.flutua.flyY > 1.0, 'fly=true, flyY > 1', R.espirito.flutua);
caso('Espírito: fere por contato espectral com recarga própria', R.espirito.contato.dano1 > 0 && !R.espirito.contato.repetiuCedo && R.espirito.contato.segundoTick > 0, 'tick1 > 0, respeita cd, tick2 > 0', R.espirito.contato);
caso('Espírito: reposiciona por blink (salto ≥ 2,5 m) atravessando obstáculos', R.espirito.blink.salto >= 2.5 && R.espirito.blink.through, 'salto ≥ 2,5 m e through=true', R.espirito.blink);
caso('Estandarte: permanece imóvel e aplica aura dourada só dentro do raio', R.estandarte.andou === 0 && R.estandarte.aura.pertoDmg === 1.25 && R.estandarte.aura.pertoHaste === 1.2 && R.estandarte.aura.longeDmg === 1 && R.estandarte.aura.longeHaste === 1 && R.estandarte.aura.ring === 0xffc040, 'andou 0; dentro 1.25/1.2; fora 1/1', R.estandarte.aura);
caso('Estandarte + Centurião + Pretor: auras não empilham multiplicativamente e sem NaN', R.estandarte.semEmpilhar.dmg === 1.25 && R.estandarte.semEmpilhar.haste === 1.2 && R.estandarte.semEmpilhar.danoRecebido < 10 && !R.estandarte.semEmpilhar.nan, 'max dmg 1.25, max haste 1.2, redução ativa, sem NaN', R.estandarte.semEmpilhar);
caso('Estandarte: aliado bufado causa mais dano real no jogador', R.estandarte.danoReal.comAura > R.estandarte.danoReal.semAura && R.estandarte.danoReal.auraDmg === 1.25, 'comAura > semAura', R.estandarte.danoReal);

// Etapa 3
caso('Catapulta: siegeSpot escolhe posição aberta fora dos portões', R.catapulta.siegeSpotOk, 'ponto livre fora dos portões', R.catapulta.siegeSpotOk);
caso('Catapulta: prepara aviso no chão, lança rocha em área e permite esquiva', R.catapulta.ataque.avisoVisto && R.catapulta.ataque.rochaVista?.r === 2.3 && R.catapulta.ataque.danoParado > 0 && R.catapulta.ataque.danoEsquiva === 0 && R.catapulta.ataque.alvoNoJogador, 'aviso + rocha r=2.3 + dano parado > 0 + esquiva 0', R.catapulta.ataque);
caso('Elefante: anuncia (wind) → investe, quebra barricada/prop, fere e atordoa', R.elefante.investida.windAntes && R.elefante.investida.quebrouBarricada && R.elefante.investida.quebrouProp && R.elefante.investida.dano > 0 && R.elefante.investida.stunMax > 0, 'wind→lunge + quebra + dano + stun', R.elefante.investida);
caso('Elefante: onda de choque (quake) fere e atordoa o jogador', R.elefante.quake.dano > 0 && R.elefante.quake.stunT > 0, 'dano > 0 e stunT > 0', R.elefante.quake);
caso('Engenheiro: prepara (cast), monta Torre de Cerco (teto max=2) e aura protege aliado', R.engenheiro.castVisto && R.engenheiro.tipoTorre === 'rm_turret' && R.engenheiro.torreFixa && R.engenheiro.apos2 === 2 && R.engenheiro.apos3 === 2 && R.engenheiro.auraPerto < R.engenheiro.auraLonge, 'cast + rm_turret fixa + teto 2 + aura', R.engenheiro);
caso('Carruagem: anuncia parado (wind) → atropela (lunge) e lança lanças', R.carruagem.windAntes && R.carruagem.paradoWind && R.carruagem.danoAtropelo > 0 && R.carruagem.lancaVista && R.carruagem.danoLanca > 0, 'wind parado→lunge + lança', R.carruagem);
caso('Águia: voa em círculos, anuncia mergulho e dispara energia roxa', R.aguia.voa && R.aguia.strafe && R.aguia.windAntes && R.aguia.danoMergulho > 0 && R.aguia.raioRoxo && R.aguia.danoRaio > 0, 'voa + strafe + wind→lunge + raio roxo', R.aguia);

// Bestiário, prints e erros
caso('Bestiário exibe todos os 15 romanos (14 + Torre de Cerco)', R.bestiario.faltando.length === 0, '0 faltando', R.bestiario);
caso('Etapa 1: os 5 visíveis no print', RM1.every((t) => R.visiveis1.includes(t)), '5 tipos vivos', R.visiveis1);
caso('Etapa 2: os 4 visíveis no print', RM2.every((t) => R.visiveis2.includes(t)), '4 tipos vivos', R.visiveis2);
caso('Etapa 3: os 6 modelos visíveis no print', [...RM3, 'rm_turret'].every((t) => R.visiveis3.includes(t)), '6 tipos vivos', R.visiveis3);
caso('Sem erros de JavaScript', erros.length === 0, '0 erros', erros);

const falhas = casos.filter((c) => c.status === 'falhou').length;
fs.writeFileSync(path.join(ROOT, 'tests', 'resultado-roma.json'), JSON.stringify({ data: new Date().toISOString(), total: casos.length, falhas, casos, bruto: R }, null, 2));
console.log(`\n${casos.length - falhas}/${casos.length} casos passaram · tests/resultado-roma.json · tests/hud-shots/roma/`);
process.exit(falhas ? 1 : 0);
