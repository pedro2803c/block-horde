// Desempenho com hordas de 0, 10, 25, 50, 75, 100 e 200 inimigos do Egito no Templo Antigo.
// Também registra chamadas de desenho, triângulos, pior quadro e tempo de carregamento.
// Mede FPS, tempo da lógica (update) e do desenho por quadro, e memória do JS.
// Uso: npm run build:portable && npm run test:desempenho
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/fav')) return r.writeHead(204).end();
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream('portable/BlockHorde.html').pipe(r);
});
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-precise-memory-info', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
// --lento=4: simula um processador 4x mais lento (celular intermediário)
const lento = +(process.argv.find((x) => x.startsWith('--lento='))?.slice(8) || 1);
if (lento > 1) await (await ctx.newCDPSession(p)).send('Emulation.setCPUThrottlingRate', { rate: lento });
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
const tLoad0 = Date.now();
await p.goto(`http://localhost:${srv.address().port}/?test`);
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 120000 });
const carregamento_ms = Date.now() - tLoad0;

const linhas = await p.evaluate(async () => {
  const g = __bh;
  const { ARENAS, SURVIVORS } = __bhTest;
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  g.settings.quality = 'medium';
  g.startMatch(ARENAS.find((a) => a.id === 'templo'), [SURVIVORS[0]], 'solo');
  g.debugGod = true;
  setInterval(() => { g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999; }, 50);
  const pl = g.players[0];
  // mede lógica e desenho separadamente
  const tU = []; const tD = []; const calls = []; const tris = [];
  const ou = g.update.bind(g); g.update = (dt) => { const t = performance.now(); ou(dt); tU.push(performance.now() - t); };
  const od = g.draw.bind(g); g.draw = (dt) => { const t = performance.now(); od(dt); tD.push(performance.now() - t); const ri = g.renderer.info.render; calls.push(ri.calls); tris.push(ri.triangles); };
  const MIX = ['mummy', 'mummy', 'mummy', 'scarab', 'archer', 'jackal', 'skeleton', 'anubis', 'serpent', 'scorpion', 'priest', 'phantom', 'horus', 'construct', 'chariot'];
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length * 0.95)] : 0; };
  const out = [];
  // a 1ª rodada só aquece (compilação dos gráficos e dos sons), não entra no resultado
  for (const n of [15, 0, 10, 25, 50, 75, 100, 200]) {
    g.zombies.length = 0; g.corpses.length = 0; g.projectiles.length = 0;
    for (let i = 0; i < n; i++) {
      for (let tries = 0; tries < 20; tries++) {
        const a = Math.random() * 6.28, d = 6 + Math.random() * 14;
        const x = pl.pos.x + Math.sin(a) * d, z = pl.pos.z + Math.cos(a) * d;
        if (!g.arena.inb(Math.floor(x), Math.floor(z)) || g.arena.circleBlocked(x, z, 0.5)) continue;
        const zb = g.spawnZombie(MIX[i % MIX.length], x, z); zb.rise = 0;
        if (zb.def.summon) zb.summonCd = 999; // não invocar durante a medição (número fixo)
        break;
      }
    }
    await w(1500); // estabiliza
    tU.length = 0; tD.length = 0; calls.length = 0; tris.length = 0;
    let frames = 0; const t0 = performance.now();
    await new Promise((res) => { const f = () => { frames++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    const secs = (performance.now() - t0) / 1000;
    if (n === 15) continue;
    out.push({
      inimigos: g.zombies.filter((z) => z.alive).length,
      fps: Math.round(frames / secs),
      logica_ms: +med(tU).toFixed(2), logica_p95_ms: +p95(tU).toFixed(2),
      desenho_ms: +med(tD).toFixed(2), desenho_p95_ms: +p95(tD).toFixed(2),
      pior_quadro_ms: +Math.max(0, ...tU.map((u, i) => u + (tD[i] || 0))).toFixed(1),
      draw_calls: Math.round(med(calls)), triangulos_mil: Math.round(med(tris) / 1000),
      memoria_mb: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
      escala_render: g.adapt?.scale ?? 1,
    });
  }
  return out;
});
console.table(linhas);
console.log('carregamento até o menu (ms):', carregamento_ms);
fs.writeFileSync('tests/resultado-desempenho.json', JSON.stringify({ data: new Date().toISOString(), lento, carregamento_ms, linhas, erros }, null, 2));
console.log(erros.length ? 'erros: ' + erros.join(' | ') : 'sem erros');
await b.close();
srv.close();
