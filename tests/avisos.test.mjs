// Avisos do celular: nunca cobrem HUD/controles, um por vez, fila e menus. Também confere que o PC não mudou.
// Uso: npm run build:portable && npm run test:avisos
import { chromium, webkit, devices } from 'playwright';
import http from 'http';
import fs from 'fs';

const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/fav')) return r.writeHead(204).end();
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream('portable/BlockHorde.html').pipe(r);
});
await new Promise((ok) => srv.listen(0, ok));
const url = `http://localhost:${srv.address().port}/`;
const DEV = [
  ['iPhone SE', webkit, devices['iPhone SE landscape']],
  ['Pixel 7', chromium, devices['Pixel 7 landscape']],
  ['Galaxy S9+', chromium, devices['Galaxy S9+ landscape']],
  ['iPhone 13', webkit, devices['iPhone 13 landscape']],
  ['iPad Mini', webkit, devices['iPad Mini landscape']],
  ['Galaxy Tab S4', chromium, devices['Galaxy Tab S4 landscape']],
  ['PC 1366x768', chromium, { viewport: { width: 1366, height: 768 } }],
];
let falhas = 0;
for (const [nome, type, dev] of DEV) {
  const b = await type.launch({ headless: true, ...(type === chromium ? { channel: 'chrome' } : {}) });
  const ctx = await b.newContext({ locale: 'pt-BR', ...dev });
  await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
  const p = await ctx.newPage();
  await p.goto(url);
  await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  const r = await p.evaluate(async () => {
    const g = __bh;
    const w = (ms) => new Promise((ok) => setTimeout(ok, ms));
    g.quickStart();
    g.debugGod = true;
    await w(1500);
    const ui = g.ui;
    const sel = ['.pp:not(.hidden)', '.top .chip', '.top .mult', '.boss:not(.hidden)', '.pause-btn', '.radar', '.xpbar', '.tb', '.stick', '.auto-tag'];
    const hit = (a, c) => a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top;
    let overlaps = [];
    let maxVis = 0;
    let shown = 0;
    let seen = new Set();
    let stop = false;
    const watch = () => {
      const v = [...document.querySelectorAll('.notice:not(.out)')].filter((n) => n.style.visibility !== 'hidden' && n.offsetParent);
      maxVis = Math.max(maxVis, v.length);
      for (const n of v) {
        if (!seen.has(n)) { seen.add(n); shown++; }
        const nr = n.getBoundingClientRect();
        for (const el of document.querySelectorAll(sel.join(','))) {
          if (!el.offsetParent) continue;
          const er = el.getBoundingClientRect();
          if (er.width && hit(nr, er)) overlaps.push(`${n.innerText.trim().slice(0, 18)} × ${el.className.split(' ')[0]}`);
        }
        const pr = n.style.pointerEvents || getComputedStyle(n).pointerEvents;
        if (pr !== 'none') overlaps.push('recebe toque');
      }
      if (!stop) requestAnimationFrame(watch);
    };
    watch();
    // rajada: XP repetido, nível, desbloqueio, chefe, onda e avisos comuns
    for (let i = 0; i < 8; i++) ui.toast(0, '+XP', 'star');
    ui.toast(0, 'Nível 4! +1 ponto', 'tree');
    ui.unlockBanner('Escopeta tática');
    ui.banner('CHEFE A CAMINHO!', 'bad');
    ui.banner('ONDA 3');
    for (let i = 0; i < 5; i++) ui.alert(`Comum ${i}`, 'info', 'info');
    // chefe na tela: a barra do chefe também é protegida
    g.wave = 5; g.spawnZombie('boss', g.players[0].pos.x + 6, g.players[0].pos.z);
    await w(9000);
    // menu aberto: comuns são descartados, importante espera
    g.pause();
    ui.alert('Comum com menu', 'info', 'info');
    ui.toast(0, 'Nível 5! +1 ponto', 'tree');
    await w(800);
    const duranteMenu = document.querySelectorAll('.notice:not(.out)').length;
    const filaMenu = (ui.nq || []).map((n) => n.text);
    g.resume();
    await w(900);
    const aposMenu = [...document.querySelectorAll('.notice:not(.out)')].map((n) => n.innerText.replace(/\s+/g, ' '));
    stop = true;
    return { touch: g.input.touchMode, tela: `${innerWidth}x${innerHeight}`, mostrados: shown, maxVis, sobreposicoes: [...new Set(overlaps)].slice(0, 5), duranteMenu, filaMenu, aposMenu, pcAlerts: document.querySelectorAll('.alerts .alert').length };
  });
  const ok = r.touch
    ? !r.sobreposicoes.length && r.maxVis <= 1 && r.duranteMenu === 0 && !r.filaMenu.includes('Comum com menu') && r.aposMenu.some((t) => t.includes('Nível 5'))
    : r.mostrados === 0; // PC: continua usando os avisos antigos, nada do sistema mobile
  if (!ok) falhas++;
  console.log(`${ok ? '✓' : '✗'} ${nome.padEnd(14)} ${JSON.stringify(r)}`);
  await b.close();
}
srv.close();
console.log(falhas ? `${falhas} falha(s)` : '✓ avisos ok em todos os aparelhos');
process.exit(falhas ? 1 : 0);
