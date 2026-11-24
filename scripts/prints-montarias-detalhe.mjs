// Prints da tela de detalhe de cada montaria (modelo grande). Uso: node scripts/prints-montarias-detalhe.mjs pasta [ids]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { MOUNT_CATALOG } from '../src/mounts.js';
const OUT = `prints/${process.argv[2] || 'montarias-v2'}`; fs.mkdirSync(OUT, { recursive: true });
const ids = process.argv[3] ? process.argv[3].split(',') : MOUNT_CATALOG;
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1366, height: 768 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
for (const id of ids) {
  await page.evaluate((id) => window.__bh.ui.showScreen('mount', { id }), id);
  await page.waitForSelector('.md-view canvas'); await page.waitForTimeout(1600);
  const bb = await page.locator('.md-view canvas').first().boundingBox();
  await page.screenshot({ path: `${OUT}/det-${id}.png`, clip: bb });
}
console.log('erros JS:', errors.length ? errors.slice(0, 5) : 'nenhum'); await b.close();
