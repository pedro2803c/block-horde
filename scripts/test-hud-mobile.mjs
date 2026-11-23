// HUD mobile (paisagem, toque): sobreposições, centro livre, avisos de montaria, munição, joystick e recarga em 3 telas.
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
const OUT = 'prints/hud-mobile'; fs.mkdirSync(OUT, { recursive: true });
const SIZES = [['compacto', 740, 360, 2], ['grande', 915, 412, 2.6], ['tablet', 1180, 820, 2]];
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
const report = [];
for (const [name, w, hgt, dpr] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  await page.touchscreen.tap(5, 5); // liga o modo toque
  await page.evaluate(() => { const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS.find((a) => a.id === 'praca'), [SURVIVORS[0]], 'solo'); const p = g.players[0]; p.hp = p.maxHp; window.__keepHp = setInterval(() => { p.hp = p.maxHp; }, 200);
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.spawnZombie(i % 2 ? 'walker' : 'runner', p.pos.x + Math.cos(a) * 6, p.pos.z + Math.sin(a) * 5); } });
  await page.waitForTimeout(2500);
  const pendingShown = await page.evaluate(() => !document.querySelector('.mount-waypoint').classList.contains('hidden'));
  await page.screenshot({ path: `${OUT}/${name}-hud.png` });
  // munição baixa + controles em uso: arrasta joystick e aperta recarga
  await page.evaluate(() => { const g = window.__bh, p = g.players[0]; const w = p.weapon; p.clip[w] = 1; p.reloadT = 0; });
  const cdp = await ctx.newCDPSession(page);
  const sx = 70, sy = hgt - 70;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy, id: 1 }] });
  for (let k = 1; k <= 6; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + k * 8, y: sy - k * 4, id: 1 }] }); await page.waitForTimeout(30); }
  const moving = await page.evaluate(() => !!window.__bh.input.touchMove);
  const pos0 = await page.evaluate(() => [window.__bh.players[0].pos.x, window.__bh.players[0].pos.z]);
  await page.waitForTimeout(600);
  const pos1 = await page.evaluate(() => [window.__bh.players[0].pos.x, window.__bh.players[0].pos.z]);
  await page.screenshot({ path: `${OUT}/${name}-controles.png` });
  const states = await page.evaluate(() => ({ wpnLow: document.querySelector('.tb.wpn').className, rel: document.querySelector('.tb.rel').className }));
  const rel = await page.locator('.tb.rel').boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx + 48, y: sy - 24, id: 1 }, { x: rel.x + rel.width / 2, y: rel.y + rel.height / 2, id: 2 }] });
  await page.waitForTimeout(250);
  const reloading = await page.evaluate(() => window.__bh.players[0].reloadT > 0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  // montaria aparece de fato (chefe iniciado) → aviso compacto no topo
  await page.evaluate(() => { const g = window.__bh; const p = g.players[0]; const z = g.spawnZombie('boss', p.pos.x + 9, p.pos.z) || g.zombies[0]; g.releaseMount(z); });
  await page.waitForTimeout(400);
  let notice = null; for (let i = 0; i < 15 && !(notice || '').includes('montaria'); i++) { notice = await page.evaluate(() => document.querySelector('.notices .notice')?.textContent || null); if (!(notice || '').includes('montaria')) await page.waitForTimeout(200); }
  await page.screenshot({ path: `${OUT}/${name}-montaria.png` });
  // sobreposições e centro livre
  const geo = await page.evaluate(() => {
    const sel = { status: '.players .pp', topo: '.hud .top', pausa: '.pause-btn', radar: '.radar', aviso: '.notice', waypoint: '.mount-waypoint:not(.hidden)', chefe: '.hud > .boss:not(.hidden)' };
    const R = {}; for (const [k, s] of Object.entries(sel)) { const e = document.querySelector(s); if (e) { const r = e.getBoundingClientRect(); if (r.width) R[k] = r; } }
    document.querySelectorAll('.tbtns .tb:not(.hidden)').forEach((e, i) => { const r = e.getBoundingClientRect(); if (r.width) R['btn_' + e.className.split(' ').slice(1).join('.')] = r; });
    const keys = Object.keys(R), over = [];
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const a = R[keys[i]], c = R[keys[j]]; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) over.push(keys[i] + '×' + keys[j]); }
    const W = innerWidth, H = innerHeight, cx = { left: W * 0.3, right: W * 0.7, top: H * 0.3, bottom: H * 0.72 };
    const centro = keys.filter((k) => { const a = R[k]; return a.left < cx.right && cx.left < a.right && a.top < cx.bottom && cx.top < a.bottom; });
    const minTouch = Math.min(...keys.filter((k) => k.startsWith('btn_') && !k.includes('locked')).map((k) => Math.min(R[k].width, R[k].height)));
    const gaps = []; const bk = keys.filter((k) => k.startsWith('btn_'));
    for (let i = 0; i < bk.length; i++) for (let j = i + 1; j < bk.length; j++) { const a = R[bk[i]], c = R[bk[j]]; const ca = [(a.left + a.right) / 2, (a.top + a.bottom) / 2], cc = [(c.left + c.right) / 2, (c.top + c.bottom) / 2]; gaps.push(Math.round(Math.hypot(ca[0] - cc[0], ca[1] - cc[1]) - a.width / 2 - c.width / 2)); }
    return { over, centro, minTouch: Math.round(minTouch), minGap: Math.min(...gaps), hs: getComputedStyle(document.body).getPropertyValue('--hs'), narrow: document.body.classList.contains('hud-narrow') };
  });
  await page.waitForTimeout(3800); const wpTxt = await page.evaluate(() => { const e = document.querySelector('.mount-waypoint'); return e.classList.contains('hidden') ? null : e.textContent; }); await page.screenshot({ path: `${OUT}/${name}-distancia.png` });
  report.push({ waypointDepois: wpTxt, tela: `${name} ${w}x${hgt}`, avisoPendenteNaTela: pendingShown, joystickMove: moving, andou: Math.hypot(pos1[0] - pos0[0], pos1[1] - pos0[1]).toFixed(2), estados: states, recarregou: reloading, avisoMontaria: notice, ...geo, errors });
  await ctx.close();
}
console.log(JSON.stringify(report, null, 1)); await b.close();
