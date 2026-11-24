// Capturas das moedas no chão, da coleta e da loja no celular (Playwright).
import { chromium } from 'playwright';
import path from 'node:path';
const BASE = process.env.BH_URL || 'http://127.0.0.1:4173/';
const OUT = path.resolve('prints/economia');
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [name, opts] of [['web', { viewport: { width: 1366, height: 768 } }], ['mobile', { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
  const ctx = await browser.newContext({ locale: 'pt-BR', ...opts });
  await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', JSON.stringify({ status: 'done', step: 12, done: [], seen: ['shop', 'boss', 'mount', 'levelup', 'unlock', 'ability', 'weapon'] })));
  const page = await ctx.newPage();
  await page.goto(BASE + '?test', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.debugGod = true; g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    const p = g.players[0];
    // inimigos derrotados a 3–5 m do jogador: moedas caem no campo de visão
    const spots = [[3.5, 2], [-3.5, 2], [4, -2.5], [-3, -3], [0, 3.8], [2, 4]];
    for (const [dx, dz] of spots) { const z = g.spawnZombie(['walker', 'runner', 'spitter', 'brute'][Math.floor(Math.random() * 4)], p.pos.x + dx, p.pos.z + dz); if (z) g.damageZombie(z, 1e6, 1, 0, p); }
    for (const c of g.coins) if (!c.v) c.v = 10;
  });
  await sleep(4000);
  if (name === 'web') await page.screenshot({ path: path.join(OUT, '01-moedas-no-chao.png') });
  // coleta: anda até um monte
  await page.evaluate(() => { const g = window.__bh; const p = g.players[0]; const c = g.coins[0]; if (c) { p.pos.x = c.x - 0.4; p.pos.z = c.z; } });
  await sleep(2500);
  if (name === 'web') await page.screenshot({ path: path.join(OUT, '02-coletando-moedas.png') });
  if (name === 'mobile') {
    await page.evaluate(() => { const g = window.__bh; g.waveState = 'intermission'; g.waveT = 99; g.wallet += 640; });
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, 'mobile-01-hud-moedas.png') });
    await page.evaluate(() => document.querySelector('.coin-chip').click());
    await sleep(3000);
    await page.screenshot({ path: path.join(OUT, 'mobile-02-loja.png') });
    await page.locator('.shop-tabs .tab', { hasText: 'Armas' }).first().click();
    await sleep(3000);
    await page.screenshot({ path: path.join(OUT, 'mobile-03-loja-armas.png') });
  }
  await ctx.close();
}
await browser.close();
console.log('ok');
