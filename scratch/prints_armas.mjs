// Prints de validação visual das armas do Templo (HUD em jogo e catálogo), em 3 resoluções.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import { UNLOCKS } from '../src/data.js';

const out = 'scratch/prints-armas';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/fav')) return r.writeHead(204).end();
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream('portable/BlockHorde.html').pipe(r);
});
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ channel: 'chrome', headless: true });
const erros = [];
for (const [w, h] of [[1366, 768], [1920, 1080], [2560, 1440]]) {
  const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: w, height: h } });
  await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(`${w}: ${e.message}`));
  await p.goto(`http://localhost:${srv.address().port}/?test`);
  await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 120000 });
  await p.evaluate(async (unlocks) => {
    const g = __bh; const wt = (ms) => new Promise((ok) => setTimeout(ok, ms));
    g.startMatch(__bhTest.ARENAS.find((a) => a.id === 'templo'), [__bhTest.SURVIVORS[0]], 'solo');
    g.debugGod = true;
    for (const u of unlocks.filter((u) => u.only?.includes('templo'))) g.unlock(u);
    const pl = g.players[0];
    pl.weapon = 'horus_spear'; pl.ammo.horus_spear = 54;
    await wt(2500);
  }, UNLOCKS);
  await p.screenshot({ path: `${out}/hud-${w}x${h}.png` });
  // dispara a habilidade (estado RECARGA) para conferir o aviso
  await p.evaluate(async () => { const g = __bh; const pl = g.players[0]; pl.egyptCd = { horus_spear: g.time + 8 }; await new Promise((ok) => setTimeout(ok, 300)); });
  await p.screenshot({ path: `${out}/hud-recarga-${w}x${h}.png` });
  await p.evaluate(async () => { const g = __bh; g.toMenu(); await new Promise((ok) => setTimeout(ok, 300)); g.ui.showScreen('items', { back: 'menu' }); await new Promise((ok) => setTimeout(ok, 800)); });
  await p.evaluate(async () => { [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Arma')?.click(); await new Promise((ok) => setTimeout(ok, 500)); const sc = [...document.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 50 && getComputedStyle(e).overflowY !== 'visible' && e.querySelector('.card, [class*=card]')); if (sc) sc.scrollTop = sc.scrollHeight; await new Promise((ok) => setTimeout(ok, 1500)); });
  await p.screenshot({ path: `${out}/catalogo-${w}x${h}.png` });
  await ctx.close();
}
console.log('erros:', erros.length ? erros.join(' | ') : 'nenhum');
await b.close(); srv.close();
