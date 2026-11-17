// Auditoria visual do HUD mobile: screenshots + medição de sobreposições e áreas de toque.
// Uso: npm run build:portable && npm run test:hud  (prints em tests/hud-shots/<etiqueta>/)
import { chromium, webkit, devices } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const TAG = process.argv.find((a) => a.startsWith('--tag='))?.slice(6) || 'atual';
const OUT = path.join('tests', 'hud-shots', TAG);
fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/fav')) return r.writeHead(204).end();
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream('portable/BlockHorde.html').pipe(r);
});
await new Promise((ok) => srv.listen(0, ok));
const url = `http://localhost:${srv.address().port}/`;
const DEV = [
  ['iphone-se', webkit, devices['iPhone SE landscape']],
  ['galaxy-s9', chromium, devices['Galaxy S9+ landscape']],
  ['pixel-7', chromium, devices['Pixel 7 landscape']],
  ['ultrawide-21x9', chromium, { viewport: { width: 960, height: 412 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.5 }],
  ['barras-do-navegador', chromium, { viewport: { width: 740, height: 300 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.5 }],
  ['ipad-mini', webkit, devices['iPad Mini landscape']],
  ['tab-s4', chromium, devices['Galaxy Tab S4 landscape']],
];
// componentes do HUD que não podem se sobrepor
const PARTS = {
  painel: '.pp:not(.hidden)', topo: '.top .chip, .top .mult', chefe: '.boss:not(.bar):not(.hidden)', radar: '.radar', pausa: '.pause-btn',
  aviso: '.notice:not(.out)', botoes: '.tb', auto: '.auto-tag', tutorial: '.tutorial:not(.hidden)',
};
const CENAS = ['1-combate', '2-alarme', '3-xp', '4-nivel', '5-item', '6-desbloqueio', '7-chefe', '8-pausa', '9-arvore'];
const rel = [];
for (const [nome, type, dev] of DEV) {
  const b = await type.launch({ headless: true, ...(type === chromium ? { channel: 'chrome' } : {}) });
  const ctx = await b.newContext({ locale: 'pt-BR', ...dev });
  await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
  const p = await ctx.newPage();
  await p.goto(url);
  await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  await p.evaluate(() => { __bh.quickStart(); __bh.debugGod = true; });
  await p.waitForTimeout(3500);
  for (const cena of CENAS) {
    await p.evaluate((cena) => {
      const g = __bh; const ui = g.ui; const pl = g.players[0];
      if (g.state === 'paused') g.resume();
      if (cena === '2-alarme') ui.banner('ALARME DE HORDA! CARROS DISPARANDO', 'bad');
      if (cena === '3-xp') for (let i = 0; i < 4; i++) ui.toast(0, '+XP', 'star');
      if (cena === '4-nivel') { pl.pts = 1; ui.toast(0, 'Nível 2! +1 ponto', 'tree'); }
      if (cena === '5-item') ui.toast(0, '+20 munição', 'ammo');
      if (cena === '6-desbloqueio') ui.unlockBanner('Submetralhadora');
      if (cena === '7-chefe') { g.wave = 5; g.spawnZombie('boss', pl.pos.x + 7, pl.pos.z); ui.banner('COLOSSO SURGIU!', 'bad'); }
      if (cena === '8-pausa') g.pause();
      if (cena === '9-arvore') g.openTree();
    }, cena);
    await p.waitForTimeout(700);
    const m = await p.evaluate((PARTS) => {
      const R = {};
      for (const [k, s] of Object.entries(PARTS)) R[k] = [...document.querySelectorAll(s)].filter((e) => e.offsetParent && e.style.visibility !== 'hidden').map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
      const hit = (a, c) => a.left < c.right - 1 && a.right > c.left + 1 && a.top < c.bottom - 1 && a.bottom > c.top + 1;
      const sob = [];
      const ks = Object.keys(R);
      const menu = !!document.querySelector('.screen .overlay, .overlay.pause, .overlay.tree');
      if (!menu) for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) for (const a of R[ks[i]]) for (const c of R[ks[j]]) if (hit(a, c)) sob.push(`${ks[i]}×${ks[j]}`);
      // botões entre si (o .tb é uma lista)
      if (!menu) R.botoes.forEach((a, i) => R.botoes.slice(i + 1).forEach((c) => hit(a, c) && sob.push('botao×botao')));
      const centro = { left: innerWidth * 0.3, right: innerWidth * 0.7, top: innerHeight * 0.32, bottom: innerHeight * 0.8 };
      const noCentro = menu ? [] : ['aviso', 'painel', 'topo', 'chefe', 'radar'].filter((k) => R[k].some((r) => hit(r, centro)));
      const toques = [...document.querySelectorAll('.tb, .pause-btn')].filter((e) => e.offsetParent).map((e) => Math.round(Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)));
      const fontes = [...document.querySelectorAll('.hud *')].filter((e) => e.offsetParent && e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize));
      return { sobreposicoes: [...new Set(sob)], centroOcupado: noCentro, menorToque: Math.min(...toques), menorFonte: +Math.min(...fontes).toFixed(1) };
    }, PARTS);
    await p.screenshot({ path: path.join(OUT, `${nome}_${cena}.png`) });
    rel.push({ aparelho: nome, cena, ...m });
  }
  await b.close();
}
srv.close();
fs.writeFileSync(path.join(OUT, 'relatorio.json'), JSON.stringify(rel, null, 2));
let bad = 0;
for (const r of rel) {
  const prob = [...r.sobreposicoes, ...r.centroOcupado.map((c) => `${c} no centro`), ...(r.menorToque < 44 ? [`toque ${r.menorToque}px`] : []), ...(r.menorFonte < 10 ? [`fonte ${r.menorFonte}px`] : [])];
  if (prob.length) bad++;
  console.log(`${prob.length ? '✗' : '✓'} ${r.aparelho.padEnd(20)} ${r.cena.padEnd(14)} ${prob.join(', ')}`);
}
console.log(`\n${rel.length - bad}/${rel.length} cenas sem problema · prints em ${OUT}`);
process.exit(bad ? 1 : 0);
