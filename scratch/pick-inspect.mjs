import { chromium } from 'playwright';
import fs from 'fs';

const URL = process.env.URL || 'http://localhost:5199/';
const OUT = 'tests/hud-shots/pick';
fs.mkdirSync(OUT, { recursive: true });
const sizes = (process.env.SIZES || '1366x768,1920x1080,1024x768,390x844,844x390').split(',').map((s) => s.split('x').map(Number));
const b = await chromium.launch({ channel: 'chrome', headless: true });
for (const [w, h] of sizes) {
  const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: w, height: h } });
  await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL);
  await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  await p.getByText('Escolher arena e sobrevivente').click();
  await p.waitForTimeout(1200);
  const info = await p.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
    const grid = document.querySelector('.pick-grid');
    const panel = document.querySelector('.overlay.pick .panel');
    const cards = [...document.querySelectorAll('.pick-card')].map((c) => ({ ...r(c), name: c.querySelector('strong')?.textContent }));
    return { screen: window.__bh.ui.screen, panel: panel && r(panel), grid: grid && r(grid), cards, scroll: { sh: document.querySelector('.overlay.pick .panel')?.scrollHeight, ch: document.querySelector('.overlay.pick .panel')?.clientHeight } };
  });
  console.log(`\n=== ${w}x${h} ===`);
  console.log(JSON.stringify(info));
  if (errs.length) console.log('ERROS:', errs);
  await p.screenshot({ path: `${OUT}/antes-${w}x${h}.png` });
  await ctx.close();
}
await b.close();
