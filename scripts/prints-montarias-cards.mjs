// Prints dos cards de montaria (parado e andando). Uso: npx vite preview --port 4173 & node scripts/prints-montarias-cards.mjs pasta
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = `prints/${process.argv[2] || 'montarias-v2'}`; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
await page.evaluate(() => window.__bh.ui.showScreen('mounts')); await page.waitForSelector('li.mount-card canvas'); await page.waitForTimeout(1500);
const n = await page.locator('li.mount-card').count();
for (let i = 0; i < n; i++) {
  const card = page.locator('li.mount-card').nth(i); await card.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5); await page.waitForTimeout(500);
  const bb = await card.locator('canvas').first().boundingBox();
  await page.screenshot({ path: `${OUT}/${String(i + 1).padStart(2, '0')}-parado.png`, clip: bb });
  await card.hover(); await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${String(i + 1).padStart(2, '0')}-andando.png`, clip: bb });
}
console.log('cards:', n, 'erros JS:', errors.length ? errors.slice(0, 5) : 'nenhum'); await b.close();
