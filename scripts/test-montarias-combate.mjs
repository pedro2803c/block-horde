// Auditoria real dos ataques das montarias (Playwright no build de produção).
// Uso: npx vite preview --port 4173  e depois  node scripts/test-montarias-combate.mjs
// Cada montaria é montada na sua arena e cada ataque é medido na vida real de um inimigo.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.BH_URL || 'http://127.0.0.1:4173/?test';
const OUT = path.resolve('prints/montarias-combate');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on('pageerror', (e) => errors.push('page: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });

const run = (fn, arg) => page.evaluate(fn, arg);
const res = {};
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

// helpers dentro da página
await run(() => {
  window.__t = {
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    spawnAt(g, x, z) {
      for (let k = 0; k < 14; k++) {
        const a = k * 0.9;
        const zz = g.spawnZombie('walker', x + Math.sin(a) * k * 0.35, z + Math.cos(a) * k * 0.35);
        if (zz) return zz;
      }
      return null;
    },
    openSpot(g) {
      const A = g.arena;
      for (let t = 0; t < 4000; t++) {
        const x = 4 + Math.random() * (A.W - 8);
        const z = 4 + Math.random() * (A.D - 8);
        if (A.circleBlocked(x, z, 2.2)) continue;
        if (A.rayFree(x, z, 0, 1, 12) < 12) continue;
        return { x, z };
      }
      return { x: A.W / 2, z: A.D / 2 };
    },
    target(g, p, dist, angOff = 0) {
      const a = p.aim + angOff;
      const x = p.pos.x + Math.sin(a) * dist;
      const z = p.pos.z + Math.cos(a) * dist;
      let zz = null;
      for (let k = 0; k < 8 && !zz; k++) zz = g.spawnZombie('walker', x + (Math.random()-0.5)*1.5, z + (Math.random()-0.5)*1.5);
      if (!zz) return null;
      zz.pos.set(x, 0, z);
      zz.hp = zz.maxHp = 1e6;
      zz.stunT = 999;
      zz.attackCd = 999;
      zz.kx = zz.kz = 0;
      return zz;
    },
    clear(g) {
      for (const z of g.zombies) z.alive = false;
      g.zombies.length = 0;
      g.boss = null;
    },
    setup(g, arenaId) {
      const { ARENAS, SURVIVORS } = window.__bhTest;
      const a = ARENAS.find((x) => x.id === arenaId);
      g.debugGod = true;
      g.worldMount = null;
      g.startMatch(a, [SURVIVORS[0]], 'solo');
      const p = g.players[0];
      p.hp = p.maxHp = 1e6;
      p.pas = {};
      p.navalTempest = false;
      p.furyT = 0;
      // libera a montaria do jeito real: o chefe aparece e morre
      const bs = g.arenaDef.boss;
      const bz = g.spawnZombie(Array.isArray(bs) ? bs[0] : bs || 'boss', p.pos.x + 14, p.pos.z);
      if (bz) { bz.alive = false; g.boss = null; }
      window.__t.clear(g);
      const spot = window.__t.openSpot(g);
      p.pos.set(spot.x, 0, spot.z);
      if (g.worldMount) { g.worldMount.x = spot.x; g.worldMount.z = spot.z; }
      g.startMount(p, arenaId, true);
      p.aim = 0; // mira fixa (+Z) para medir frente/trás
      return p;
    },
  };
});

// ------------------------------------------------------------------ 1) cada montaria e cada ataque
const MOUNT_IDS = ['praca', 'armazem', 'vale', 'distrito', 'coliseu', 'lab', 'templo', 'naval'];
res.mounts = {};
for (const id of MOUNT_IDS) {
  res.mounts[id] = await run(async ({ id }) => {
    const g = window.__bh;
    const T = window.__t;
    const { MOUNTS, MOUNT_SKILLS } = window.__bhTest;
    const p = T.setup(g, id);
    const wm = g.worldMount;
    const out = { name: wm?.def?.name, weapon: p.weapon, mountWeapon: MOUNTS[id].weapon, skills: {}, basic: null, checks: {} };

    // --- ataque principal: dano real no alvo
    T.clear(g);
    let t = T.target(g, p, 2.0);
    if (t) {
      const hp0 = t.hp;
      g.fire(p);
      await T.sleep(160);
      out.basic = { dmg: Math.round(hp0 - t.hp), fireCd: +p.fireCd.toFixed(2) };
    }
    // --- troca de arma não pode tirar o ataque da montaria
    g.cycleWeapon(p, 1);
    g.selectWeapon(p, 'pistol');
    g.selectGroup(p, 0);
    out.checks.weaponLocked = p.weapon === MOUNTS[id].weapon;

    // --- cada habilidade
    const list = MOUNT_SKILLS[id] || [];
    for (const sk of list) {
      const slot = { heavy: 0, dash: 1, second: 2, special: 3 }[sk.act];
      T.clear(g);
      p.sharkCd = [0, 0, 0, 0];
      p.dashT = 0;
      p.furyT = 0;
      let front = null;
      let behind = null;
      let side = null;
      let outside = null;
      const dist = sk.kind === 'line' ? 5 : sk.kind === 'burst' ? 6 : sk.kind === 'sides' ? 0 : sk.kind === 'area' || sk.kind === 'nova' ? 3 : sk.kind === 'charge' ? 1.5 : 2.2;
      if (sk.kind === 'sides') {
        side = T.target(g, p, 1.5, Math.PI / 2);
      } else {
        front = T.target(g, p, dist);
        if (sk.kind === 'cone' || sk.kind === 'line') behind = T.target(g, p, 2.0, Math.PI);
        if (sk.kind === 'area' || sk.kind === 'nova') outside = T.target(g, p, 8.0);
      }
      const hpF = front ? front.hp : 0;
      const hpB = behind ? behind.hp : 0;
      const hpS = side ? side.hp : 0;
      const hpO = outside ? outside.hp : 0;
      const t0 = g.time;
      const dbgBefore = { isMounted: p.isMounted, mountId: p.mountId, rider: g.worldMount?.rider === p, alive: g.worldMount?.alive, dashT: p.dashT, time: g.time };
      g.mountAbility(p, slot);
      const cdSet = p.sharkCd[slot] > t0;
      const dbgAfter = { cdVal: p.sharkCd[slot], t0, time: g.time, dashT: p.dashT, furyT: p.furyT };
      await T.sleep(sk.kind === 'burst' ? 1100 : sk.kind === 'charge' ? 900 : 200);
      const dmgFront = front ? Math.round(hpF - front.hp) : 0;
      const dmgBehind = behind ? Math.round(hpB - behind.hp) : 0;
      const dmgSide = side ? Math.round(hpS - side.hp) : 0;
      const dmgOutside = outside ? Math.round(hpO - outside.hp) : 0;
      // segunda ativação durante a recarga: não pode causar dano
      const hp2 = front ? front.hp : side ? side.hp : 0;
      const cdBefore2 = p.sharkCd[slot];
      g.mountAbility(p, slot);
      await T.sleep(220);
      const dmgAgain = (sk.kind === 'charge' || sk.kind === 'burst') ? 0 : (front ? Math.round(hp2 - front.hp) : side ? Math.round(hp2 - side.hp) : 0);
      out.skills[sk.act] = {
        name: sk.name, kind: sk.kind, cd: sk.cd, cdSet,
        dmg: dmgFront || dmgSide, dmgBehind, dmgOutside,
        dmgOnCooldown: dmgAgain,
        fury: sk.kind === 'fury' ? p.furyT > 0 : undefined,
        dash: sk.kind === 'charge' ? p.dashDmg : undefined,
        dbgBefore, dbgAfter,
      };
    }

    // --- chefe: dano real no chefe da arena
    T.clear(g);
    const bs = g.arenaDef.boss;
    const bossType = Array.isArray(bs) ? bs[0] : bs;
    const boss = g.spawnZombie(bossType, p.pos.x + Math.sin(p.aim) * 2.4, p.pos.z + Math.cos(p.aim) * 2.4);
    if (boss) {
      boss.pos.set(p.pos.x + Math.sin(p.aim) * 2.4, 0, p.pos.z + Math.cos(p.aim) * 2.4);
      boss.stunT = 999;
      boss.attackCd = 999;
      const hp0 = boss.hp;
      p.sharkCd = [0, 0, 0, 0];
      g.fire(p);
      g.mountAbility(p, 0);
      await T.sleep(600);
      out.checks.bossDmg = Math.round(hp0 - boss.hp);
      out.checks.bossType = boss.type;
    }

    // --- desmontar e montar de novo: ataque continua real
    T.clear(g);
    g.dismount(p);
    const onFoot = !p.isMounted && p.weapon !== MOUNTS[id].weapon;
    g.startMount(p, id, true);
    p.sharkCd = [0, 0, 0, 0];
    t = T.target(g, p, 2.0);
    const hpR = t ? t.hp : 0;
    p.sharkCd = [0,0,0,0];
    g.mountAbility(p, 0);
    await T.sleep(600);
    out.checks.remount = { onFoot, dmg: t ? Math.round(hpR - t.hp) : 0, mounted: p.isMounted, tNull: !t };

    // --- destruída: não pode mais causar dano
    T.clear(g);
    t = T.target(g, p, 2.0);
    g.dismount(p, true);
    const cdBefore = p.sharkCd[0];
    g.mountAbility(p, 0);
    out.checks.destroyed = { dmg: 0, alive: wm.alive, mounted: p.isMounted, cdUnchanged: p.sharkCd[0] === cdBefore };
    out.checks.hp = Math.round(p.hp);
    return out;
  }, { id });
  const m = res.mounts[id];
  const label = m.name || id;
  ok(m.basic && m.basic.dmg > 0, `${label}: ataque principal sem dano`);
  ok(m.weapon === m.mountWeapon, `${label}: arma da montaria não equipada (${m.weapon})`);
  ok(m.checks.weaponLocked, `${label}: troca de arma tirou o ataque da montaria`);
  for (const [act, s] of Object.entries(m.skills)) {
    if (s.kind === 'fury') {
      ok(s.fury && s.cdSet, `${label}/${s.name}: fúria não ativou`);
      continue;
    }
    ok(s.dmg > 0, `${label}/${s.name}: nenhum dano aplicado`);
    ok(s.cdSet, `${label}/${s.name}: recarga não registrada`);
    ok(s.dmgOnCooldown === 0, `${label}/${s.name}: causou dano durante a recarga`);
    if (s.kind === 'cone' || s.kind === 'line') ok(s.dmgBehind === 0, `${label}/${s.name}: atingiu inimigo atrás`);
    if (s.kind === 'area' || s.kind === 'nova') ok(s.dmgOutside === 0, `${label}/${s.name}: atingiu fora do raio`);
  }
  ok(m.checks.bossDmg > 0, `${label}: sem dano no chefe`);
  ok(m.checks.remount.onFoot && m.checks.remount.dmg > 0 && m.checks.remount.mounted, `${label}: falhou ao remontar`);
  ok(m.checks.destroyed.alive === false && m.checks.destroyed.mounted === false && m.checks.destroyed.cdUnchanged, `${label}: dano após a montaria ser destruída`);
}

// ------------------------------------------------------------------ 2) HUD/controles/catálogo mostram os ataques reais
res.ui = await run(async () => {
  const g = window.__bh;
  const T = window.__t;
  const p = T.setup(g, 'praca');
  await T.sleep(400);
  const rows = [...document.querySelectorAll('.mount-cmds .mc-row')].map((r) => r.dataset.act + ':' + r.querySelector('.mc-name')?.textContent);
  const bar = !document.querySelector('.mount-bar')?.classList.contains('hidden');
  return { rows, bar, mount: g.worldMount?.def?.name };
});
ok(res.ui.bar, 'HUD da montaria não apareceu');
ok(res.ui.rows.some((r) => r.startsWith('heavy')) && res.ui.rows.some((r) => r.startsWith('dash')), 'HUD não listou as habilidades da montaria');
await page.screenshot({ path: path.join(OUT, 'hud-praca.png') });

// catálogo: cada card deve listar as habilidades reais
res.catalog = await run(() => {
  const g = window.__bh;
  g.toMenu();
  g.ui.showScreen('mounts');
  return [...document.querySelectorAll('.mount-card .beast-stats')].map((e) => e.textContent.trim());
});
ok(res.catalog.length >= 8 && res.catalog.some((t) => /[1-4] habilidades/.test(t)), 'catálogo não listou as habilidades das montarias');

// ------------------------------------------------------------------ 3) celular: botão de habilidade dispara o ataque
const mob = await browser.newPage({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
const mobErrors = [];
mob.on('pageerror', (e) => mobErrors.push('page: ' + e.message));
await mob.goto(URL, { waitUntil: 'domcontentloaded' });
await mob.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
await mob.evaluate(() => {
  window.__t = {
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    spawnAt(g, x, z) {
      for (let k = 0; k < 14; k++) {
        const a = k * 0.9;
        const zz = g.spawnZombie('walker', x + Math.sin(a) * k * 0.35, z + Math.cos(a) * k * 0.35);
        if (zz) return zz;
      }
      return null;
    },
    target(g, p, dist) {
      const x = p.pos.x + Math.sin(p.aim) * dist;
      const z = p.pos.z + Math.cos(p.aim) * dist;
      const zz = this.spawnAt(g, x, z);
      if (!zz) return null;
      zz.pos.set(x, 0, z);
      zz.hp = zz.maxHp = 1e6;
      zz.stunT = 999;
      return zz;
    },
  };
});
res.mobile = await mob.evaluate(async () => {
  const g = window.__bh;
  const T = window.__t;
  const { ARENAS, SURVIVORS } = window.__bhTest;
  const a = ARENAS.find((x) => x.id === 'praca');
  g.debugGod = true;
  g.startMatch(a, [SURVIVORS[0]], 'solo');
  g.touch.setMode(true); // mesmo estado de um celular depois do primeiro toque
  const p = g.players[0];
  p.pas = {}; p.navalTempest = false; p.hp = p.maxHp = 1e6; p.aim = 0;
  const bs = g.arenaDef.boss;
  const bz = g.spawnZombie(Array.isArray(bs) ? bs[0] : bs || 'boss', p.pos.x + 14, p.pos.z);
  if (bz) { bz.alive = false; g.boss = null; }
  for (const z of g.zombies) z.alive = false;
  g.zombies.length = 0;
  g.startMount(p, 'praca', true);
  await T.sleep(300);
  const labels = [...document.querySelectorAll('.ab .tl')].map((e) => e.textContent).filter(Boolean);
  const t = T.target(g, p, 2.0);
  const hp0 = t ? t.hp : 0;
  // toque no primeiro botão de habilidade (mesmo caminho do dedo: press do código)
  g.input.pressed.add(p.akeys[0][0]);
  await T.sleep(900);
  return { labels, dmg: t ? Math.round(hp0 - t.hp) : 0, mounted: p.isMounted };
});
ok(res.mobile.labels.length >= 1, 'celular: botões sem legenda da montaria');
ok(res.mobile.dmg > 0, 'celular: habilidade da montaria não causou dano');
await mob.screenshot({ path: path.join(OUT, 'mobile-praca.png') });
await mob.close();

// ------------------------------------------------------------------ 4) console limpo
res.errors = errors.concat(mobErrors);
ok(res.errors.length === 0, 'erros de JavaScript: ' + res.errors.slice(0, 3).join(' | '));

await page.screenshot({ path: path.join(OUT, 'resumo.png') });
await browser.close();

fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify(res, null, 2));
console.log(JSON.stringify(res, null, 2));
if (fail.length) {
  console.error('\nFALHAS:\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log('\nTodos os ataques das montarias passaram.');
