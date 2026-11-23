import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:5173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
const out = await page.evaluate(async () => {
  const { mountDef } = await import('/src/mounts.js');
  const g = window.__bh;
  const { ARENAS, SURVIVORS } = window.__bhTest;
  g.startMatch(ARENAS.find(a => a.id === 'praca'), [SURVIVORS[0]], 'solo');
  g.startMount(g.players[0], 'praca');
  await new Promise(r => setTimeout(r, 200));
  const el = document.querySelector('.mount-indicator-name');
  return {
    modulo: mountDef('praca').name,
    dom: el.textContent,
    lang: document.documentElement.lang,
    nav: navigator.language,
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
