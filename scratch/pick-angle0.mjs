import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
await p.goto('http://localhost:5199/');
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
await p.getByText('Escolher arena e sobrevivente').click();
await p.waitForTimeout(800);
await p.evaluate(() => {
  const ui = window.__bh.ui;
  const pv = ui.getPreview();
  ui.previewItems.forEach((it, k) => { it.angle = 0; pv.draw(it.canvas, it.look, 0, 0, false); });
});
await p.screenshot({ path: 'tests/hud-shots/pick/angle0.png' });
await b.close();
