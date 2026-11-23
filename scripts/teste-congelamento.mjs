// Reproduz o travamento: partida real + evento climático ativo, e conta quadros desenhados.
// Se o update lança erro, o contador de quadros para de avançar (imagem congela).
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = process.argv[2] || 'dist';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/fav')) return r.writeHead(204).end();
  const u = q.url.split('?')[0];
  let f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!fs.existsSync(f)) f = path.join(ROOT, 'index.html');
  r.writeHead(200, { 'content-type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
  fs.createReadStream(f).pipe(r);
});
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(String(e.message)));
await p.goto(`http://localhost:${srv.address().port}/?test`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 90000 });
await p.evaluate(() => {
  const g = window.__bh, { ARENAS, SURVIVORS } = window.__bhTest;
  g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
  g.debugGod = true;
  window.__quadros = 0;
  const od = g.draw.bind(g); g.draw = (dt) => { window.__quadros++; return od(dt); };
  // força o mesmo evento climático da arena inicial, sem esperar os 32 s
  g.event = 'hordealarm'; g.eventLeft = 999; g.eventT = 999;
});
const a = await p.evaluate(() => window.__quadros);
await p.waitForTimeout(4000);
const res = await p.evaluate((antes) => ({ antes, depois: window.__quadros, estado: window.__bh.state, evento: window.__bh.event, erros: window.__errosPagina || [] }), a);
console.log(JSON.stringify({ artefato: ROOT, ...res, pageErrors: erros }, null, 1));
await b.close();
srv.close();
