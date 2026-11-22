import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
await p.goto('http://localhost:5199/');
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
await p.evaluate(() => __bh.ui.showScreen('pick', { mode: 'solo' }));
await p.waitForTimeout(800);
for (const st of [0, 167, 9999]) {
  const r = await p.evaluate((st) => {
    const panel = document.querySelector('.overlay.pick .panel');
    panel.scrollTop = st;
    const h = document.querySelector('.win-head');
    const g = document.querySelector('.pick-grid');
    const R = (e) => { const b = e.getBoundingClientRect(); return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1) }; };
    return { st: panel.scrollTop, panel: R(panel), head: R(h), grid: R(g), sticky: getComputedStyle(h).position, z: getComputedStyle(h).zIndex };
  }, st);
  console.log(JSON.stringify(r));
}
await b.close();
