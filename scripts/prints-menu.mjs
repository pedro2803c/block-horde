// Capturas e checagens do menu principal em várias resoluções.
// Uso: node scripts/prints-menu.mjs <prefixo>   (BH_URL opcional; padrão preview local)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BH_URL || 'http://127.0.0.1:4173/';
const TAG = process.argv[2] || 'depois';
const OUT = path.resolve('prints/menu');
fs.mkdirSync(OUT, { recursive: true });
const VIEWS = [
  ['desktop-1920x1080', { width: 1920, height: 1080 }],
  ['desktop-1366x768', { width: 1366, height: 768 }],
  ['desktop-2560x1440', { width: 2560, height: 1440 }],
  ['tablet-1024x768', { width: 1024, height: 768, hasTouch: true, isMobile: true }],
  ['tablet-768x1024', { width: 768, height: 1024, hasTouch: true, isMobile: true }],
  ['mobile-horizontal-844x390', { width: 844, height: 390, hasTouch: true, isMobile: true }],
  ['mobile-horizontal-740x360', { width: 740, height: 360, hasTouch: true, isMobile: true }],
  ['mobile-vertical-390x844', { width: 390, height: 844, hasTouch: true, isMobile: true }],
];
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const report = {};
for (const [name, v] of VIEWS) {
  const { hasTouch, isMobile, ...viewport } = v;
  const ctx = await browser.newContext({ locale: 'pt-BR', viewport, hasTouch: !!hasTouch, isMobile: !!isMobile, deviceScaleFactor: isMobile ? 2 : 1 });
  await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', JSON.stringify({ status: 'done', step: 12, done: [], seen: [] })));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu' && document.querySelector('.overlay.menu'), null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `${TAG}-${name}.png`) });
  // checagens: botões dentro da tela (ou alcançáveis por rolagem), sem sobreposição, alvo de toque, logo inteira
  report[name] = await page.evaluate(() => {
    const W = innerWidth, H = innerHeight;
    const rect = (e) => e.getBoundingClientRect();
    const btns = [...document.querySelectorAll('.overlay.menu .menu-buttons button')];
    const fs = document.querySelector('.overlay.menu .fs-btn');
    const logo = document.querySelector('.overlay.menu .logo, .overlay.menu svg, .overlay.menu canvas');
    const scroller = document.querySelector('.overlay.menu .menu-nav') || document.querySelector('.overlay.menu .menu-box');
    const over = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const overlaps = [];
    for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) if (over(rect(btns[i]), rect(btns[j]))) overlaps.push(btns[i].textContent.trim() + ' x ' + btns[j].textContent.trim());
    const play = btns.find((b) => /Jogar agora/.test(b.textContent));
    const lr = logo && rect(logo);
    return {
      buttons: btns.length,
      labels: btns.map((b) => b.textContent.trim()),
      offscreenX: btns.filter((b) => { const r = rect(b); return r.left < 0 || r.right > W + 0.5; }).map((b) => b.textContent.trim()),
      belowFold: btns.filter((b) => rect(b).bottom > H + 0.5).map((b) => b.textContent.trim()),
      scrollable: scroller ? scroller.scrollHeight > scroller.clientHeight + 1 && getComputedStyle(scroller).overflowY !== 'visible' : false,
      pageScroll: document.documentElement.scrollHeight > H + 1,
      overlaps,
      fsOverPlay: !!(fs && play && over(rect(fs), rect(play))),
      playVisible: play ? rect(play).top >= 0 && rect(play).bottom <= H : false,
      minTouch: Math.round(Math.min(...btns.map((b) => rect(b).height))),
      heights: [...new Set(btns.slice(2).map((b) => Math.round(rect(b).height)))],
      logoCut: lr ? lr.left < 0 || lr.right > W + 0.5 || lr.top < 0 : null,
    };
  });
  report[name].errors = errors.length;
  await ctx.close();
}
console.log(JSON.stringify(report, null, 1));
await browser.close();
