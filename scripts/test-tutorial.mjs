// Teste real do tutorial (Playwright, build de produção).
// Uso: npx vite preview --port 4173  e depois  node scripts/test-tutorial.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BH_URL || 'http://127.0.0.1:4173/';
const OUT = path.resolve('prints/tutorial');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const report = {};
const KEY = 'blockhorde_tutorial_v1';

for (const dev of ['web', 'mobile']) {
  const ctx = await browser.newContext(dev === 'web'
    ? { viewport: { width: 1366, height: 768 } }
    : { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const R = (report[dev] = { steps: [] });
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${dev}-${n}.png`) });
  await page.goto(BASE + '?test&tutorial', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  await page.waitForTimeout(800);

  // A) 1º acesso: boas-vindas com 3 opções
  R.welcome = await page.evaluate(() => ({ screen: window.__bh.ui.screen, buttons: [...document.querySelectorAll('.welcome .menu-buttons button')].map((b) => b.textContent.trim()) }));
  await shot('00-boas-vindas');
  await page.locator('.welcome button', { hasText: 'manual' }).click();
  await page.waitForTimeout(300);
  R.manual = await page.evaluate(() => ({ screen: window.__bh.ui.screen, cats: document.querySelectorAll('.manual-cats button').length, items: document.querySelectorAll('.manual-list li').length, first: document.querySelector('.manual-list li')?.textContent }));
  await shot('13-manual');

  // começar tutorial numa partida solo real
  R.start = await page.evaluate((KEY) => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.resetTutorial(0); g.debugGod = true;
    g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    return { tut: !!g.tut, step: g.tut?.step, saved: JSON.parse(localStorage.getItem(KEY) || '{}').status };
  }, KEY);
  await page.waitForTimeout(1200);

  // B/C) cada etapa: visível, destaque, não cobre HUD crítico, não avança sem ação, avança com a ação real
  const names = ['01-movimentacao', '02-mira', '03-combate', '04-armas', '05-habilidades', '06-hordas', '07-chefoes', '08-montarias', '09-progressao', '10-inventario', '11-arenas', '12-final'];
  for (let k = 0; k < 12; k++) {
    const info = await page.evaluate(() => {
      const g = window.__bh; const st = document.querySelector('.tutorial');
      return { step: g.tut?.step, title: st.querySelector('.tut-title')?.textContent, visible: !st.classList.contains('hidden'), hl: [...document.querySelectorAll('.tut-hl')].map((e) => e.className.split(' ').slice(0, 2).join('.')) };
    });
    await shot(names[k]);
    info.overlap = await page.evaluate(() => {
      const t = document.querySelector('.tutorial').getBoundingClientRect();
      const hit = (sel) => [...document.querySelectorAll(sel)].some((e) => {
        const r = e.getBoundingClientRect();
        if (!r.width || getComputedStyle(e).display === 'none' || e.closest('.hidden')) return false;
        return !(r.right <= t.left || r.left >= t.right || r.bottom <= t.top || r.top >= t.bottom);
      });
      return ['.top', '.radar', '.players .pp.p1', '.boss', '.stick', '.tbtns'].filter(hit);
    });
    await page.waitForTimeout(1500);
    info.heldWithoutAction = await page.evaluate((k) => window.__bh.tut?.step === k, k);
    await page.evaluate(async (k) => {
      const g = window.__bh; const p = g.players[0];
      const spawn = (n) => { for (let i = 0; i < n; i++) g.spawnZombie('walker', p.pos.x + 3 + i * 0.3, p.pos.z + 2); };
      if (k === 0) p.pos.x += 4;
      else if (k === 1) g.stats.shots += 4;
      else if (k === 2 || k === 11) { spawn(k === 2 ? 3 : 8); for (const z of g.zombies) if (z.alive) g.damageZombie(z, 1e5, 1, 0, p); }
      else if (k === 3) { g.cycleWeapon(p, 1); if (g.tut?.step === 3) p.reloadT = 0.5; }
      else if (k === 4) { p.cds[1] = 5; }
      else document.querySelector('.tutorial .tut-next:not(.hidden)')?.click();
      await new Promise((r) => setTimeout(r, 1500));
    }, k);
    info.advanced = await page.evaluate((k) => (window.__bh.tut ? window.__bh.tut.step : 12) > k, k);
    R.steps.push(info);
  }
  await page.waitForTimeout(300);
  await shot('12b-concluido');
  R.done = await page.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return { tutAtivo: !!window.__bh.tut, status: s.status, etapas: s.done.length }; }, KEY);

  // D) persistência: recarrega → sem boas-vindas e sem reiniciar
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  await page.waitForTimeout(600);
  R.persist = await page.evaluate(() => {
    const g = window.__bh; const scr = g.ui.screen; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    return { telaAposRecarregar: scr, tutorialReiniciou: !!g.tut };
  });
  R.resumeStep = await page.evaluate(() => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.resetTutorial(5); g.toMenu(); g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    return g.tut?.step;
  });
  R.skip = await page.evaluate((KEY) => { window.__bh.skipTutorial(); return JSON.parse(localStorage.getItem(KEY)).status; }, KEY);

  // E) gameplay: dano igual com e sem tutorial
  R.gameplay = await page.evaluate(() => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    const hit = () => { const p = g.players[0]; p.weapon = 'pistol'; const z = g.spawnZombie('walker', p.pos.x + 3, p.pos.z); z.hp = 1000; g.damageZombie(z, 10, 1, 0, p); return Math.round(1000 - z.hp); };
    const sem = hit();
    g.resetTutorial(0); g.toMenu(); g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    return { semTutorial: sem, comTutorial: hit(), tutAtivo: !!g.tut };
  });
  // dica contextual: registra uma vez só
  R.hint = await page.evaluate((KEY) => {
    const g = window.__bh; g.testMode = false; g.tutHint('boss'); g.tutHint('boss'); g.testMode = true;
    return JSON.parse(localStorage.getItem(KEY)).seen.filter((x) => x === 'boss').length;
  }, KEY);
  await shot('14-dica-contextual');
  R.errors = errors.slice(0, 5);
  await ctx.close();
}
console.log(JSON.stringify(report, null, 1));
await browser.close();
