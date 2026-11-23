// Verificação rápida do estado do HUD de montaria em cada arena.
import { chromium } from 'playwright';

const ESPERADO = {
  praca: 'Jipe Blindado',
  armazem: 'Empilhadeira de Combate',
  vale: 'Javali Mutante',
  distrito: 'Tanque Blindado',
  coliseu: 'Quadriga de Guerra',
  lab: 'Exoesqueleto Experimental',
  templo: 'Leão de Sekhmet',
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page.goto('http://127.0.0.1:5173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });

let falhas = 0;
for (const [id, nome] of Object.entries(ESPERADO)) {
  await page.evaluate((arenaId) => {
    const g = window.__bh;
    const { ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS.find((a) => a.id === arenaId), [SURVIVORS[0]], 'solo');
    g.startMount(g.players[0], arenaId);
  }, id);
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const ind = document.querySelector('.mount-indicator');
    const barra = document.querySelector('.mount-bar');
    const way = document.querySelector('.mount-waypoint');
    const xh = document.querySelector('.xh');
    return {
      nome: ind?.querySelector('.mount-indicator-name')?.textContent,
      indVisivel: ind && !ind.classList.contains('hidden'),
      barraVisivel: barra && !barra.classList.contains('hidden'),
      barraPct: barra?.querySelector('.mount-bar-text')?.textContent,
      wayOculto: way && way.classList.contains('hidden'),
      corMira: xh?.style.getPropertyValue('--xc'),
    };
  });
  const ok = r.nome === nome && r.indVisivel && r.barraVisivel && r.wayOculto && r.barraPct === '100%';
  if (!ok) falhas++;
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${id.padEnd(9)} nome="${r.nome}" ind=${r.indVisivel} barra=${r.barraVisivel} pct=${r.barraPct} wayOculto=${r.wayOculto} mira=${r.corMira}`);
}
await browser.close();
console.log(falhas ? `\n${falhas} falha(s)` : '\nTodos os HUDs OK');
process.exit(falhas ? 1 : 0);
