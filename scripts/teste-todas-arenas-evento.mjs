// Todas as 9 arenas: inicia partida, ativa o evento climático da arena e confere se os quadros seguem e não há erros.
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

const arenas = await p.evaluate(() => window.__bhTest.ARENAS.map((a) => ({ id: a.id, nome: a.name, clima: a.weather })));
const saida = [];
for (const a of arenas) {
  erros.length = 0;
  const antes = await p.evaluate((arena) => {
    const g = window.__bh, { SURVIVORS } = window.__bhTest;
    g.startMatch(window.__bhTest.ARENAS.find((x) => x.id === arena.id), [SURVIVORS[0]], 'solo');
    g.debugGod = true;
    g.event = arena.clima; g.eventLeft = 999; g.eventT = 999;
    window.__quadros = 0;
    if (!window.__drawWrapped) { const od = g.draw.bind(g); g.draw = (dt) => { window.__quadros++; return od(dt); }; window.__drawWrapped = true; }
    return window.__quadros;
  }, a);
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => ({ quadros: window.__quadros, estado: window.__bh.state, evento: window.__bh.event }));
  saida.push({ arena: a.id, nome: a.nome, clima: a.clima, quadrosAntes: antes, quadrosDepois: r.quadros, estado: r.estado, erros: erros.slice() });
  console.log(JSON.stringify(saida.at(-1)));
}
fs.writeFileSync('tests/resultado-arenas-evento.json', JSON.stringify({ data: new Date().toISOString(), artefato: ROOT, saida }, null, 2));
await b.close();
srv.close();
