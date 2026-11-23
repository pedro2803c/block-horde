import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page.goto('http://127.0.0.1:5173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
await page.evaluate(() => {
  const g = window.__bh;
  const { ARENAS, SURVIVORS } = window.__bhTest;
  g.startMatch(ARENAS.find(a => a.id === 'praca'), [SURVIVORS[0]], 'solo');
});
await page.waitForTimeout(250);
const r = await page.evaluate(() => {
  const w = document.querySelector('.mount-waypoint');
  return {
    visivel: w && !w.classList.contains('hidden'),
    texto: w?.querySelector('.mount-waypoint-text')?.textContent,
    mountId: window.__bh.players[0].mountId,
  };
});
console.log(JSON.stringify(r));
await browser.close();
process.exit(r.visivel && /Jipe Blindado/.test(r.texto) ? 0 : 1);
