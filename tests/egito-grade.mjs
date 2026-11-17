// Grade de frente dos 14 inimigos do Egito (comparação com a arte de referência).
// Uso: npm run build:portable && node tests/egito-grade.mjs saida.png [angulo]
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs';
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream('portable/BlockHorde.html').pipe(r); });
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ locale: 'pt-BR', viewport: { width: 1540, height: 760 } });
await p.goto(`http://localhost:${srv.address().port}/`);
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'));
await p.evaluate((ang) => {
  const T = ['mummy', 'anubis', 'archer', 'scarab', 'serpent', 'priest', 'phantom', 'construct', 'scorpion', 'jackal', 'portal', 'skeleton', 'chariot', 'horus'];
  const pv = __bh.ui.getPreview();
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:99;background:#e8d8b0;display:grid;grid-template-columns:repeat(7,220px);gap:0;padding:10px';
  for (const t of T) {
    const c = document.createElement('canvas'); c.width = 220; c.height = 280; c.style.cssText = 'width:220px;height:280px;background:#f4e6c4;outline:1px solid #c8b080';
    const lab = document.createElement('div'); lab.textContent = __bh.ui.g ? '' : '';
    const cell = document.createElement('div'); cell.append(c);
    const n = document.createElement('div'); n.textContent = t; n.style.cssText = 'font:700 13px sans-serif;text-align:center;color:#3a2a10';
    cell.append(n); wrap.append(cell);
    pv.enemy(c, t, ang, 1.3, false);
  }
  document.body.append(wrap);
}, +(process.argv[3] || 0.35));
await p.waitForTimeout(300);
await p.screenshot({ path: process.argv[2] });
await b.close(); srv.close();
