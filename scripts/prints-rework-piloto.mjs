// Captura os 24 mobs redesenhados no bestiÃ¡rio (render 3D real) e compara as imagens.
import { chromium } from 'playwright';
import fs from 'node:fs';
import crypto from 'node:crypto';

const LAB = ['lb_specter','lb_tremor','lb_launcher','lb_suppressor','lb_corrosive','lb_incendiary','lb_freezer','lb_hunter','lb_pack','lb_signaler','lb_puppeteer','lb_camouflaged','lb_demolisher','lb_aerial'];
const FOLK = ['ff_saci','ff_curupira','ff_pisadeira','ff_iara','ff_cuca','ff_mula','ff_lobisomem','ff_boto','ff_caipora','ff_boitata'];
const OUT = 'prints/rework-piloto';
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });

await page.evaluate(() => window.__bh.ui.showScreen('enemies'));
await page.waitForSelector('canvas.model');
await page.waitForTimeout(1200);

const result = [];
for (const id of ['walker','brute','runner']) {
  const name = id; const idx = {walker:0,brute:1,runner:4}[id];
  const card = page.locator('li.beast').nth(idx);
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await page.waitForTimeout(650);
  const canvas = card.locator('canvas.model');
  const buf = await canvas.screenshot({ path: `${OUT}/${id}.png` });
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
  const size = buf.length;
  result.push({ id, name, hash, size, distinct: false });
  await page.mouse.move(5, 5);
  await page.waitForTimeout(150);
}

// marca duplicatas exatas (silhueta/render idÃªnticos)
const seen = new Map();
for (const r of result) {
  if (seen.has(r.hash)) r.dupOf = seen.get(r.hash);
  else { seen.set(r.hash, r.id); r.distinct = true; }
}
fs.writeFileSync(`${OUT}/resultado.json`, JSON.stringify({ result, errors }, null, 1));
const dups = result.filter((r) => !r.distinct);
console.log('capturados:', result.length, '| unicos:', result.filter((r) => r.distinct).length);
console.log('duplicados:', dups.length ? JSON.stringify(dups) : 'nenhum');
console.log('menores imagens:', JSON.stringify(result.slice().sort((a, c) => a.size - c.size).slice(0, 4)));
console.log('erros JS:', errors.length ? errors.slice(0, 5) : 'nenhum');
await b.close();

