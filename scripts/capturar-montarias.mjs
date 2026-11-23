// Captura screenshots reais de cada montaria no jogo (via Playwright).
// Uso: npm run dev  (em outro terminal) e depois node scripts/capturar-montarias.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('prints/montarias');
fs.mkdirSync(OUT, { recursive: true });

const MONTARIAS = [
  ['praca', 'Jipe Blindado'],
  ['armazem', 'Empilhadeira de Combate'],
  ['vale', 'Javali Mutante'],
  ['distrito', 'Tanque Blindado'],
  ['coliseu', 'Quadriga de Guerra'],
  ['lab', 'Exoesqueleto Experimental'],
  ['templo', 'Leão de Sekhmet'],
];

const URL = process.env.BH_URL || 'http://127.0.0.1:5173/?test';

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--no-sandbox',
  ],
});

const page = await browser.newPage({
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
});

page.on('pageerror', (e) => console.error('[pageerror]', e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
await page.mouse.move(683, 384);

for (const [id, nome] of MONTARIAS) {
  const info = await page.evaluate((arenaId) => {
    const g = window.__bh;
    const { ARENAS, SURVIVORS } = window.__bhTest;
    const arena = ARENAS.find((a) => a.id === arenaId);
    if (!arena) return { erro: 'arena não encontrada' };
    g.debugGod = true;
    g.startMatch(arena, [SURVIVORS[0]], 'solo');
    const p = g.players[0];
    g.startMount(p, arenaId);
    return {
      arena: arena.name,
      montaria: p.mountId,
      montado: p.isMounted,
      hp: p.mountHp,
      arma: p.weapon,
    };
  }, id);

  await page.waitForTimeout(1800);
  const arquivo = path.join(OUT, `montaria-${id}.png`);
  await page.screenshot({ path: arquivo });
  console.log(`${id.padEnd(9)} -> ${arquivo}  ${JSON.stringify(info)}`);
}

await browser.close();
console.log(`\n${MONTARIAS.length} prints salvos em ${OUT}`);
