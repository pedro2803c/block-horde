// Grade temporária dos 5 romanos da Etapa 1 + zumbi comum (escala). Não faz parte dos testes.
// Uso: npm run build:portable && node scratch/roma/roma-grade.mjs saida.png [angulo] [ativo 0|1]
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs';
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream('portable/BlockHorde.html').pipe(r); });
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ locale: 'pt-BR', viewport: { width: 1360, height: 300 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(`http://localhost:${srv.address().port}/`);
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'));
await p.evaluate(([ang, act]) => {
  const T = ['walker', 'rm_legion', 'rm_centurion', 'rm_archer', 'rm_gladiator', 'rm_hound'];
  const pv = __bh.ui.getPreview();
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:99;background:#e8d8b0;display:grid;grid-template-columns:repeat(6,224px);padding:6px';
  for (const t of T) {
    const c = document.createElement('canvas'); c.width = 220; c.height = 260; c.style.cssText = 'width:220px;height:260px;background:#f4e6c4;outline:1px solid #c8b080';
    const cell = document.createElement('div'); cell.append(c);
    const n = document.createElement('div'); n.textContent = t; n.style.cssText = 'font:700 13px sans-serif;text-align:center;color:#3a2a10';
    cell.append(n); wrap.append(cell);
    pv.enemy(c, t, ang, act ? 0.1 : 1.3, !!act);
  }
  document.body.append(wrap);
}, [+(process.argv[3] || 0.35), +(process.argv[4] || 0)]);
await p.waitForTimeout(300);
await p.screenshot({ path: process.argv[2] });
if (errs.length) console.log('ERROS:', errs.join('\n'));
await b.close(); srv.close();
