// Captura cards do bestiário por id (posição em ENEMY_ORDER). Uso: node scripts/prints-rework-lote.mjs pasta id1,id2,...
import { chromium } from 'playwright';
import fs from 'node:fs';
import { ENEMY_ORDER } from '../src/data.js';
const [, , dir, list] = process.argv;
const OUT = `prints/${dir}`; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
await page.evaluate(() => window.__bh.ui.showScreen('enemies')); await page.waitForSelector('canvas.model'); await page.waitForTimeout(1200);
for (const id of list.split(',')) {
  const idx = ENEMY_ORDER.indexOf(id); if (idx < 0) { console.log('fora da ordem:', id); continue; }
  const card = page.locator('li.beast').nth(idx); await card.scrollIntoViewIfNeeded(); await card.hover(); await page.waitForTimeout(650);
  { const bb = await card.locator('canvas.model').boundingBox(); await page.screenshot({ path: `${OUT}/${id}.png`, clip: bb }); } await page.mouse.move(5, 5); await page.waitForTimeout(150);
}
console.log('erros JS:', errors.length ? errors.slice(0, 5) : 'nenhum'); await b.close();
