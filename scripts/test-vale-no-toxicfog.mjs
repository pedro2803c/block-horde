// Teste: Floresta Sombria sem Névoa Tóxica (§4-§5).
import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });

const report = await page.evaluate(async () => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  const vale = ARENAS.find((x) => x.id === 'vale');
  const out = { weather: vale.weather, toxicEvents: [], toastLeaks: [], events: [] };
  const origToast = g.ui.toast.bind(g.ui);
  g.ui.toast = (id, msg, kind, ...rest) => { if (String(msg).includes('névoa corrói')) out.toastLeaks.push(msg); return origToast(id, msg, kind, ...rest); };
  g.startMatch(vale, [SURVIVORS[0]], 'solo');
  g.debugGod = true;
  for (let i = 0; i < 22; i++) {
    out.events.push(g.event);
    await new Promise((r) => setTimeout(r, 2000));
  }
  out.events.push(g.event);
  return out;
});
console.log(JSON.stringify({ ...report, errors }, null, 1));
await b.close();
