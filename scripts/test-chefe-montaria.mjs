// Fluxo real (jogo rodando, sem simulação acelerada): partida começa a pé, aviso de ameaça na onda do chefe,
// montaria liberada só quando o chefe surge, notificação e marcador. Desktop e celular. Gera prints.
// Uso: npx vite preview --port 4173  e depois  node scripts/test-chefe-montaria.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.BH_URL || 'http://localhost:4173/?test';
const OUT = path.resolve('prints/chefe-montaria');
fs.mkdirSync(OUT, { recursive: true });
const res = { errors: [] };
const ok = (c, m) => { if (!c) res.errors.push('FALHA: ' + m); };
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });

for (const [name, vp, opts] of [['desktop', { width: 1366, height: 768 }, {}], ['mobile', { width: 844, height: 390 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
  const ctx = await browser.newContext({ viewport: vp, locale: 'pt-BR', ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => res.errors.push(`${name} page: ${e.message}`));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  if (name === 'mobile') await page.evaluate(() => window.__bh.touch.setMode(true));
  const r = {};
  r.start = await page.evaluate(() => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.debugGod = true; g.startMatch(ARENAS.find((a) => a.id === 'praca'), [SURVIVORS[0]], 'solo'); g.tut = null;
    window.__toasts = []; const ot = g.ui.toast.bind(g.ui); g.ui.toast = (...a) => { window.__toasts.push(a[1]); return ot(...a); };
    window.__banners = []; const ob = g.ui.banner.bind(g.ui); g.ui.banner = (...a) => { window.__banners.push(a[0]); return ob(...a); };
    return { mount: !!g.worldMount, pending: g.mountPending?.def.name };
  });
  await page.waitForTimeout(1500);
  r.hint = await page.evaluate(() => document.querySelector('.mount-waypoint')?.classList.contains('hidden') ? null : document.querySelector('.mount-waypoint-text').textContent);
  await page.screenshot({ path: path.join(OUT, `${name}-1-inicio-a-pe.png`) });
  ok(!r.start.mount, `${name}: montaria existe no início`);
  ok(/chega com o chefe/.test(r.hint || ''), `${name}: aviso "chega com o chefe" ausente`);
  // pula para o fim da onda 4: a próxima é a do chefe
  await page.evaluate(() => { const g = window.__bh; for (const z of g.zombies) z.alive = false; g.toSpawn = []; g.wave = 4; g.waveState = 'intermission'; g.waveT = 0.3; });
  await page.waitForFunction(() => window.__bh.wave === 5, null, { timeout: 30000 });
  r.prep = await page.evaluate(() => ({ boss: !!window.__bh.boss, mount: !!window.__bh.worldMount, spawnT: +window.__bh.spawnT.toFixed(1) }));
  ok(!r.prep.boss && !r.prep.mount, `${name}: chefe/montaria antes do aviso terminar`);
  await page.waitForTimeout(2200);
  r.prep2 = await page.evaluate(() => ({ banners: window.__banners.slice(), mount: !!window.__bh.worldMount }));
  ok(r.prep2.banners.some((b) => /AMEAÇA/.test(b)), `${name}: aviso de ameaça não apareceu`);
  ok(!r.prep2.mount, `${name}: montaria liberada durante a preparação`);
  await page.screenshot({ path: path.join(OUT, `${name}-2-preparacao.png`) });
  await page.waitForFunction(() => window.__bh.boss && window.__bh.boss.alive, null, { timeout: 60000 });
  r.boss = await page.evaluate(() => { const g = window.__bh; const wm = g.worldMount; return { type: g.boss.type, mount: !!wm, name: wm?.def.name, blocked: wm ? g.arena.circleBlocked(wm.x, wm.z, 1.2) : null, toasts: window.__toasts.filter((t) => /Montaria liberada/.test(t)) }; });
  ok(r.boss.mount && !r.boss.blocked, `${name}: montaria não liberada na aparição do chefe`);
  ok(r.boss.toasts.length === 1, `${name}: notificação de liberação (${r.boss.toasts.length})`);
  await page.waitForTimeout(1800);
  r.marker = await page.evaluate(() => document.querySelector('.mount-waypoint-text')?.textContent);
  await page.screenshot({ path: path.join(OUT, `${name}-3-chefe-montaria-liberada.png`) });
  // acesso, golpe do chefe na montaria, destruição, segue a pé, sem reaparecer
  r.fight = await page.evaluate(async () => {
    const g = window.__bh; const p = g.players[0]; const wm = g.worldMount;
    p.pos.set(wm.x + 1, 0, wm.z);
    await new Promise((s) => setTimeout(s, 300));
    g.startMount(p, wm.id);
    const mounted = p.isMounted;
    g.debugGod = false;
    const before = wm.hp; g.damagePlayer(p, 40, g.boss.pos.x, g.boss.pos.z, 2, false); const hitMount = wm.hp < before && p.hp === p.maxHp;
    g.damagePlayer(p, wm.hp, g.boss.pos.x, g.boss.pos.z, 2, false);
    const destroyed = !wm.alive && !p.isMounted && p.alive;
    g.debugGod = true; p.hp = p.maxHp;
    await new Promise((s) => setTimeout(s, 4000));
    return { mounted, hitMount, destroyed, respawned: !!(g.worldMount && g.worldMount.alive), stillPlaying: g.state === 'playing', weapon: p.weapon };
  });
  ok(r.fight.mounted && r.fight.hitMount && r.fight.destroyed && !r.fight.respawned && r.fight.stillPlaying, `${name}: fluxo montar/destruir/a pé`);
  await page.screenshot({ path: path.join(OUT, `${name}-4-destruida-a-pe.png`) });
  res[name] = r;
  await ctx.close();
}
console.log(JSON.stringify(res, null, 1));
await browser.close();
