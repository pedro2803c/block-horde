// Cartões do bestiário: todo inimigo (chefes primeiro) inteiro no quadro, sem tocar as bordas, e sem texto sobre o modelo.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { ENEMIES, ENEMY_ORDER } from '../src/data.js';
const OUT = 'prints/chefes-cards'; fs.mkdirSync(OUT, { recursive: true });
const ALL = process.argv[2] === 'todos';
const ids = ENEMY_ORDER.filter((id) => ALL || ENEMIES[id].boss);
const SIZES = [['desktop', 1366, 768, false], ['mobile', 740, 360, true], ['tablet', 1180, 820, true]];
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
const rep = {};
for (const [name, w, h, touch] of SIZES.filter((s) => !process.argv[3] || s[0] === process.argv[3])) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:4173/?test'); await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  if (touch) await page.touchscreen.tap(5, 5);
  await page.evaluate(() => window.__bh.ui.showScreen('enemies')); await page.waitForSelector('canvas.model'); await page.waitForTimeout(800);
  const res = [];
  for (const id of ids) {
    const card = page.locator('li.beast').nth(ENEMY_ORDER.indexOf(id));
    await card.scrollIntoViewIfNeeded(); await card.hover().catch(() => {}); await page.waitForTimeout(500);
    const r = await card.evaluate((li) => {
      const c = li.querySelector('canvas.model'); const g = c.getContext('2d'); const W = c.width, H = c.height; const d = g.getImageData(0, 0, W, H).data;
      const solid = (x, y) => d[(y * W + x) * 4 + 3] > 200; // sombra é translúcida; modelo é opaco
      let top = 0, bot = 0, lef = 0, rig = 0, minY = H, maxY = 0;
      for (let x = 0; x < W; x++) { if (solid(x, 1)) top++; if (solid(x, H - 2)) bot++; }
      for (let y = 0; y < H; y++) { if (solid(1, y)) lef++; if (solid(W - 2, y)) rig++; for (let x = 0; x < W; x += 2) if (solid(x, y)) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); } }
      const cr = c.getBoundingClientRect(); const over = [...li.querySelectorAll('.beast-name, small, .beast-stats')].some((t) => { const q = t.getBoundingClientRect(); return q.width && q.left < cr.right - 2 && cr.left < q.right - 2 && q.top < cr.bottom - 2 && cr.top < q.bottom - 2; });
      return { borda: top + bot + lef + rig, ocupa: Math.round(((maxY - minY) / H) * 100), folgaTopo: minY, folgaBase: H - maxY, textoSobre: over, css: `${Math.round(cr.width)}x${Math.round(cr.height)}` };
    });
    if (ENEMIES[id].boss) { const bb = await card.boundingBox(); await page.screenshot({ path: `${OUT}/${name}-${id}.png`, clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(bb.width, w), height: Math.min(bb.height, h) } }).catch(() => {}); }
    res.push({ id, ...r });
  }
  rep[name] = { ruins: res.filter((r) => r.borda > 0 || r.textoSobre || r.ocupa < 35), total: res.length, chefes: res.filter((r) => ENEMIES[r.id].boss).map((r) => `${r.id}:${r.ocupa}%/${r.folgaTopo}-${r.folgaBase}`), errors };
  await ctx.close();
}
console.log(JSON.stringify(rep, null, 1)); await b.close();
