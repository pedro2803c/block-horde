// Teste real da UX/UI de montarias: HUD contextual, controles (teclado, controle, toque), catálogo e detalhes.
// Uso: npx vite preview --port 4173  e depois  node scripts/test-montarias-ux.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.BH_URL || 'http://localhost:4173/?test';
const OUT = path.resolve('prints/montarias-ux');
fs.mkdirSync(OUT, { recursive: true });
const ARENAS = ['praca', 'armazem', 'vale', 'distrito', 'coliseu', 'lab', 'templo', 'naval'];
const res = { hud: {}, overlap: {}, errors: [] };
const ok = (c, msg) => { if (!c) res.errors.push('FALHA: ' + msg); };

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });

// controle falso (Gamepad API) para testar o botão de montar no controle
const FAKE_PAD = () => {
  window.__padBtns = Array(17).fill(false);
  const pad = () => ({ id: 'Xbox Series X|S (STANDARD GAMEPAD Vendor: 045e Product: 0b12)', index: 0, connected: true, mapping: 'standard', timestamp: performance.now(), axes: [0, 0, 0, 0], buttons: window.__padBtns.map((p) => ({ pressed: p, touched: p, value: p ? 1 : 0 })) });
  navigator.getGamepads = () => (window.__padOn ? [pad()] : []);
};

async function newPage(vp, opts = {}) {
  const ctx = await browser.newContext({ viewport: vp, locale: 'pt-BR', ...opts });
  await ctx.addInitScript(FAKE_PAD);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => res.errors.push('page: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') res.errors.push('console: ' + m.text()); });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  await page.evaluate(() => { try { localStorage.removeItem('blockhorde.mountkeys.v1'); } catch {} window.__bh.mountKeys = { toggle: 'KeyV', heavy: 'KeyZ', dash: 'KeyX', second: 'KeyC', special: 'KeyR' }; });
  return { ctx, page };
}
const frames = (page, n = 4) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const key = async (page, code) => { await page.keyboard.down(code); await frames(page, 3); await page.keyboard.up(code); await frames(page, 3); };
const start = (page, id) => page.evaluate((id) => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  g.debugGod = true; g.startMatch(ARENAS.find((a) => a.id === id), [SURVIVORS[0]], 'solo');
  g.tut = null;
}, id);
const rectsOverlap = (page) => page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') return null; const b = e.getBoundingClientRect(); return b.width && b.height ? b : null; };
  const cmds = r('.mount-cmds');
  const others = { radar: r('.radar'), players: r('.pp.p1'), indicator: r('.mount-indicator'), bar: r('.mount-bar'), pause: r('.pause-btn') };
  const hit = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const out = {};
  for (const [k, v] of Object.entries(others)) out[k] = !!hit(cmds, v);
  out.inViewport = !!cmds && cmds.top >= 0 && cmds.right <= innerWidth && cmds.bottom <= innerHeight;
  return out;
});

// ---------- 1) HUD contextual de cada montaria (teclado) ----------
{
  const { ctx, page } = await newPage({ width: 1366, height: 768 });
  for (const id of ARENAS) {
    await start(page, id);
    await frames(page, 4);
    await page.evaluate(() => { const g = window.__bh; const p = g.players[0]; p.pos.set(g.worldMount.x + 1, 0, g.worldMount.z); });
    await frames(page, 3);
    await key(page, 'KeyV'); // perto: monta pela tecla real
    await frames(page, 6);
    const info = await page.evaluate(() => {
      const g = window.__bh; const p = g.players[0];
      const rows = [...document.querySelectorAll('.mount-cmds .mc-row')].map((r) => r.querySelector('kbd').textContent + '=' + r.querySelector('.mc-name').textContent);
      return { mounted: p.isMounted, visible: !document.querySelector('.mount-cmds').classList.contains('hidden'), title: document.querySelector('.mc-title b')?.textContent, rows };
    });
    res.hud[id] = info;
    ok(info.mounted, `${id}: não montou com V`);
    ok(info.visible, `${id}: painel de comandos não apareceu`);
    ok(info.rows[0]?.startsWith('V='), `${id}: tecla de montar errada`);
    ok(info.rows.length === (id === 'naval' ? 6 : 2), `${id}: número de ações (${info.rows.length})`);
    res.overlap[id] = await rectsOverlap(page);
    if (['praca', 'naval'].includes(id)) await page.screenshot({ path: path.join(OUT, `hud-${id}-1366.png`) });
    await key(page, 'KeyV');
    await frames(page, 3);
    ok(await page.evaluate(() => !window.__bh.players[0].isMounted && document.querySelector('.mount-cmds').classList.contains('hidden')), `${id}: não desmontou / painel não sumiu`);
  }
  // ---------- 2) tubarão: tecla real dispara habilidade, mostra recarga, não mexe nas habilidades do personagem ----------
  await start(page, 'naval');
  await page.evaluate(() => { const g = window.__bh; g.startMount(g.players[0], 'naval', true); });
  await frames(page, 3);
  const cdsBefore = await page.evaluate(() => window.__bh.players[0].cds.slice());
  await key(page, 'KeyZ');
  await frames(page, 3);
  res.shark = await page.evaluate(() => { const g = window.__bh; const p = g.players[0]; const row = document.querySelector('.mc-row[data-act="heavy"]'); return { biteCd: +((p.sharkCd?.[0] || 0) - g.time).toFixed(1), rowOff: row.classList.contains('off'), rowText: row.querySelector('.mc-cd').textContent, cds: p.cds.slice() }; });
  ok(res.shark.biteCd > 3, 'tubarão: Z não disparou Mordida');
  ok(res.shark.rowOff, 'tubarão: HUD não marcou indisponível');
  ok(JSON.stringify(res.shark.cds) === JSON.stringify(cdsBefore), 'tubarão: recarga vazou para habilidade do personagem');
  await page.screenshot({ path: path.join(OUT, 'hud-naval-recarga.png') });

  // ---------- 3) menu de controles: remapear, conflito, salvar, restaurar ----------
  await page.evaluate(() => { const g = window.__bh; g.dismount(g.players[0]); g.ui.showScreen('controls', { back: 'menu', tab: 4 }); });
  await frames(page, 3);
  const clickAlter = (act) => page.click(`tr[data-mact="${act}"] button`);
  await clickAlter('toggle'); await key(page, 'KeyW'); await frames(page, 3);
  const c1 = await page.evaluate(() => ({ msg: document.querySelector('.mc-msg')?.className + ' ' + document.querySelector('.mc-msg')?.textContent, key: window.__bh.mountKeys.toggle }));
  ok(c1.key === 'KeyV' && c1.msg.includes('bad'), 'conflito com W não foi bloqueado');
  await clickAlter('heavy'); await key(page, 'KeyX'); await frames(page, 3);
  const c2 = await page.evaluate(() => ({ msg: document.querySelector('.mc-msg')?.textContent, key: window.__bh.mountKeys.heavy }));
  ok(c2.key === 'KeyZ', 'conflito heavy=X (botão de outra habilidade) não foi bloqueado');
  await clickAlter('dash'); await key(page, 'KeyV'); await frames(page, 3);
  const c3 = await page.evaluate(() => window.__bh.mountKeys.dash);
  ok(c3 === 'KeyX', 'duplicidade dash=V (montar) não foi bloqueada');
  await clickAlter('toggle'); await key(page, 'KeyT'); await frames(page, 3);
  const c4 = await page.evaluate(() => ({ key: window.__bh.mountKeys.toggle, saved: localStorage.getItem('blockhorde.mountkeys.v1'), cell: document.querySelector('tr[data-mact="toggle"] .mk').textContent }));
  ok(c4.key === 'KeyT' && c4.saved.includes('KeyT') && c4.cell === 'T', 'remapear para T falhou/sem salvar');
  await page.screenshot({ path: path.join(OUT, 'controles-montarias.png') });
  res.controls = { conflictW: c1.msg.trim(), conflictX: c2.msg, ...c4 };
  // salvo sobrevive a recarregar a página
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  res.controls.afterReload = await page.evaluate(() => window.__bh.mountKeys.toggle);
  ok(res.controls.afterReload === 'KeyT', 'configuração não persistiu após recarregar');
  // nova tecla funciona no jogo e a antiga não
  await start(page, 'praca');
  await page.evaluate(() => { const g = window.__bh; const p = g.players[0]; p.pos.set(g.worldMount.x + 1, 0, g.worldMount.z); });
  await frames(page, 3);
  await key(page, 'KeyV'); await frames(page, 3);
  const oldKey = await page.evaluate(() => window.__bh.players[0].isMounted);
  await key(page, 'KeyT'); await frames(page, 3);
  const newKey = await page.evaluate(() => ({ m: window.__bh.players[0].isMounted, kbd: document.querySelector('.mc-row kbd')?.textContent, wp: document.querySelector('.mount-waypoint-text')?.textContent }));
  ok(!oldKey && newKey.m && newKey.kbd === 'T', 'tecla remapeada não funcionou no jogo');
  res.controls.inGame = { oldKeyMounted: oldKey, newKeyMounted: newKey.m, hudKey: newKey.kbd };
  // restaurar padrões
  await page.evaluate(() => window.__bh.ui.showScreen('controls', { back: 'menu', tab: 4 }));
  await frames(page, 3);
  await page.click('text=Restaurar padrões');
  res.controls.restored = await page.evaluate(() => JSON.stringify(window.__bh.mountKeys));
  ok(res.controls.restored.includes('"toggle":"KeyV"'), 'restaurar padrões falhou');

  // ---------- 4) controle: botão de montar (RS) e glifos no HUD ----------
  await start(page, 'naval');
  await page.evaluate(() => { const g = window.__bh; const p = g.players[0]; p.pos.set(g.worldMount.x + 1, 0, g.worldMount.z); window.__padOn = true; window.__padBtns[0] = true; });
  await frames(page, 3);
  await page.evaluate(() => { window.__padBtns[0] = false; });
  await frames(page, 3);
  await page.evaluate(() => { window.__padBtns[11] = true; });
  await frames(page, 3);
  await page.evaluate(() => { window.__padBtns[11] = false; });
  await frames(page, 5);
  res.pad = await page.evaluate(() => ({ using: window.__bh.pad.usingPad, mounted: window.__bh.players[0].isMounted, rows: [...document.querySelectorAll('.mount-cmds .mc-row kbd')].map((k) => k.textContent) }));
  ok(res.pad.mounted, 'controle: botão RS não montou');
  ok(res.pad.rows[0] === 'RS' && res.pad.rows[2] === 'LB', 'controle: HUD não mostra glifos do controle');
  await page.screenshot({ path: path.join(OUT, 'hud-naval-controle.png') });
  await page.evaluate(() => { window.__padOn = false; });

  // ---------- 5) catálogo e detalhes ----------
  await page.evaluate(() => { window.__bh.pad.setUsing(false); window.__bh.quitToMenu ? window.__bh.quitToMenu() : null; window.__bh.ui.showScreen('mounts'); });
  await frames(page, 15);
  res.catalog = await page.evaluate(() => [...document.querySelectorAll('.mount-card')].map((c) => c.querySelector('.beast-name').textContent + ' | ' + c.querySelector('.item-tags').textContent));
  ok(res.catalog.length === 9, 'catálogo não tem 9 cards');
  await page.screenshot({ path: path.join(OUT, 'menu-montarias-1366.png') });
  await page.click('.mount-card:nth-child(9)');
  await frames(page, 12);
  res.detail = await page.evaluate(() => ({ title: document.querySelector('.mount-detail .win-head')?.textContent, skills: document.querySelectorAll('.md-skills li').length, how: document.querySelectorAll('.md-how li').length, ctrl: document.querySelectorAll('.mount-detail tbody tr').length }));
  ok(res.detail.skills === 5 && res.detail.how === 5 && res.detail.ctrl === 6, 'detalhes do tubarão incompletos');
  await page.screenshot({ path: path.join(OUT, 'detalhe-tubarao-1366.png') });
  await page.click('.mount-card.locked').catch(() => {});
  await ctx.close();
}

// ---------- 6) resoluções ----------
for (const [w, h] of [[1920, 1080], [2560, 1440]]) {
  const { ctx, page } = await newPage({ width: w, height: h });
  await start(page, 'naval');
  await page.evaluate(() => { const g = window.__bh; g.startMount(g.players[0], 'naval', true); });
  await frames(page, 8);
  res.overlap[`naval-${w}`] = await rectsOverlap(page);
  await page.screenshot({ path: path.join(OUT, `hud-naval-${w}.png`) });
  await page.evaluate(() => { window.__bh.ui.showScreen('mounts'); });
  await frames(page, 12);
  await page.screenshot({ path: path.join(OUT, `menu-montarias-${w}.png`) });
  await ctx.close();
}

// ---------- 7) celular (toque) ----------
{
  const { ctx, page } = await newPage({ width: 844, height: 390 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await page.evaluate(() => window.__bh.touch.setMode(true));
  await start(page, 'naval');
  await page.evaluate(() => { const g = window.__bh; const p = g.players[0]; p.pos.set(g.worldMount.x + 1, 0, g.worldMount.z); });
  await frames(page, 5);
  const btn = await page.$('.tb.mnt');
  const vis = await page.evaluate(() => !document.querySelector('.tb.mnt').classList.contains('hidden'));
  await btn.tap();
  await frames(page, 5);
  res.touch = await page.evaluate(() => {
    const g = window.__bh; const p = g.players[0];
    const r = (s) => document.querySelector(s)?.getBoundingClientRect();
    const bar = r('.mount-bar'); const btns = r('.tbtns');
    const hit = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { mounted: p.isMounted, panelHidden: document.querySelector('.mount-cmds').classList.contains('hidden'), label: document.querySelector('.tb.mnt .tl').textContent, caps: [...document.querySelectorAll('.tb.ab .tl')].map((e) => e.textContent), barOverButtons: !!hit(bar, btns) };
  });
  res.touch.buttonVisible = vis;
  ok(vis && res.touch.mounted, 'toque: botão Montar não funcionou');
  ok(res.touch.caps.length === 4, 'toque: botões não mostram golpes do tubarão');
  ok(!res.touch.barOverButtons, 'toque: barra da montaria sobre os botões');
  await page.screenshot({ path: path.join(OUT, 'mobile-naval-montado.png') });
  await page.evaluate(() => window.__bh.ui.showScreen('mounts'));
  await frames(page, 12);
  await page.screenshot({ path: path.join(OUT, 'mobile-menu-montarias.png') });
  await page.evaluate(() => window.__bh.ui.showScreen('mount', { id: 'naval' }));
  await frames(page, 10);
  await page.screenshot({ path: path.join(OUT, 'mobile-detalhe-tubarao.png') });
  await ctx.close();
}

for (const [k, v] of Object.entries(res.overlap)) for (const [o, hit] of Object.entries(v)) if (o === 'inViewport' ? !hit : hit) res.errors.push(`sobreposição/viewport em ${k}: ${o}`);
console.log(JSON.stringify(res, null, 1));
await browser.close();
