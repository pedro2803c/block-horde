// Repete a abertura de telas (com partidas curtas entre elas) para reproduzir erro intermitente.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/fav')) return r.writeHead(204).end();
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream('portable/BlockHorde.html').pipe(r);
});
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 6).join(' | ')));
await p.goto(`http://localhost:${srv.address().port}/?test`);
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 120000 });
const arenas = await p.evaluate(() => __bhTest.ARENAS.map((a) => a.id));
for (let i = 0; i < 12; i++) {
  const before = erros.length;
  const passo = await p.evaluate(async ({ id }) => {
    const g = __bh; const w = (ms) => new Promise((ok) => setTimeout(ok, ms));
    let passo = 'start';
    try {
      g.startMatch(__bhTest.ARENAS.find((a) => a.id === id), [__bhTest.SURVIVORS[0]], 'solo');
    } catch (e) { return 'start falhou: ' + e.message; }
    await w(1500);
    g.toMenu(); await w(200);
    for (const sc of ['skills', 'enemies', 'items', 'scenery', 'records', 'credits', 'gamepad']) { passo = sc; g.ui.showScreen(sc, { back: 'menu' }); await w(150); }
    for (const tab of [0, 1, 2, 3]) { passo = 'controls' + tab; g.ui.showScreen('controls', { back: 'menu', tab }); await w(80); }
    for (const tab of [0, 1]) { passo = 'settings' + tab; g.ui.showScreen('settings', { back: 'menu', tab }); await w(80); }
    passo = 'pick'; g.ui.showScreen('pick', { mode: 'solo' }); await w(300);
    passo = 'arena'; g.ui.showScreen('arena', { mode: 'solo', picks: [__bhTest.SURVIVORS[0]] }); await w(600);
    passo = 'difficulty'; g.ui.showScreen('difficulty', { back: () => g.ui.showScreen('menu'), go: () => {} }); await w(300);
    return 'ok';
  }, { id: arenas[i % arenas.length] }).catch((e) => 'evaluate: ' + e.message.split('\n')[0]);
  console.log(`rodada ${i + 1} ${arenas[i % arenas.length]}: ${passo} · erros novos ${erros.length - before}`);
  for (const e of erros.slice(before)) console.log('   ', e);
}
await b.close(); srv.close();
