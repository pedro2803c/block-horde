import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
await p.goto('http://localhost:5199/');
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
await p.evaluate(() => __bh.ui.showScreen('pick', { mode: 'coop' }));
await p.waitForTimeout(800);
await p.locator('.pick-card').first().click();
await p.waitForTimeout(600);
console.log(JSON.stringify(await p.evaluate(() => ({
  picks: __bh.ui.screenData.picks?.map((s) => s.id),
  cards: [...document.querySelectorAll('.pick-card')].map((c) => ({ name: c.querySelector('strong')?.textContent, cls: c.className, dis: c.disabled, df: c.getAttribute('data-focus') })),
  focusSel: !!document.querySelector('[data-focus]'),
})), null, 2));
await b.close();
