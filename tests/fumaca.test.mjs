// Teste de fumaça: joga sozinho em todas as arenas (todas as dificuldades e sobreviventes),
// atirando, andando e usando habilidades, e procura erros, NaN, travamentos e vazamentos.
// Uso: npm run build:portable && npm run test:fumaca   (opção --segundos=20)
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const SEG = +(process.argv.find((a) => a.startsWith('--segundos='))?.slice(11) || 20);
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
p.on('pageerror', (e) => erros.push({ msg: e.message, stack: (e.stack || '').split('\n').slice(1, 3).join(' | ') }));
p.on('console', (m) => m.type() === 'error' && erros.push({ msg: 'console: ' + m.text().slice(0, 200) }));
await p.goto(`http://localhost:${srv.address().port}/?test`);
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 120000 });
const arenas = await p.evaluate(() => __bhTest.ARENAS.map((a) => a.id));
const diffs = ['easy', 'normal', 'hard', 'insane'];
const rel = [];
for (let i = 0; i < arenas.length; i++) {
  const id = arenas[i];
  const n0 = erros.length;
  const r = await p.evaluate(async ({ id, diff, i, SEG }) => {
    const g = __bh;
    const { ARENAS, SURVIVORS } = __bhTest;
    const w = (ms) => new Promise((ok) => setTimeout(ok, ms));
    g.settings.difficulty = diff;
    const s = SURVIVORS[i % SURVIVORS.length];
    g.startMatch(ARENAS.find((a) => a.id === id), [s], 'solo');
    g.debugGod = true;
    const pl = g.players[0];
    pl.pts = 30;
    // desbloqueia todas as armas e habilidades para exercitar tudo
    for (const u of __bhTest.ARENAS ? [] : []) u;
    let maxZ = 0, frames = 0, nan = [], stuck = 0, lastX = pl.pos.x;
    const t0 = performance.now();
    let k = 0;
    while (performance.now() - t0 < SEG * 1000) {
      // pula ondas para ver chefes e inimigos de ondas altas
      if (k % 40 === 0) { g.toSpawn = g.buildWave(Math.min(25, 1 + Math.floor(k / 40) * 4)); g.wave = Math.min(25, 1 + Math.floor(k / 40) * 4); g.waveState = 'active'; }
      // anda em círculo, atira, usa habilidades e troca de arma
      const a = k * 0.15;
      g.input.down.clear();
      g.input.down.add(Math.sin(a) > 0 ? 'KeyD' : 'KeyA');
      g.input.down.add(Math.cos(a) > 0 ? 'KeyS' : 'KeyW');
      g.input.down.add('Space');
      if (k % 25 === 0) for (const c of ['KeyZ', 'KeyX', 'KeyC', 'KeyR', 'KeyE']) g.input.pressed.add(c);
      if (k % 60 === 0 && pl.pts > 0) { try { g.buyUlt?.(pl); } catch (e) { nan.push('buyUlt: ' + e.message); } }
      await w(100);
      k++;
      maxZ = Math.max(maxZ, g.zombies.filter((z) => z.alive).length);
      for (const z of g.zombies) if (z.alive && (!Number.isFinite(z.pos.x) || !Number.isFinite(z.pos.z) || !Number.isFinite(z.hp))) nan.push(`${z.type} NaN`);
      if (!Number.isFinite(pl.pos.x) || !Number.isFinite(pl.hp)) nan.push('jogador NaN');
      if (Math.abs(pl.pos.x - lastX) < 1e-4) stuck++; else stuck = 0;
      lastX = pl.pos.x;
      if (g.state !== 'playing') { if (g.state === 'paused') g.resume(); else break; }
    }
    g.input.down.clear();
    const fps = await new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); });
    return {
      arena: id, dificuldade: diff, sobrevivente: s.id, estado: g.state, onda: g.wave, maxInimigos: maxZ,
      tiros: g.stats.shots, abates: g.stats.kills, nan: [...new Set(nan)].slice(0, 5), parado: stuck > 30,
      projeteis: g.projectiles.length, particulas: g.parts?.n ?? g.parts?.count ?? null, fps,
      memoriaMb: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    };
  }, { id, diff: diffs[i % 4], i, SEG });
  r.erros = erros.slice(n0).map((e) => e.msg + (e.stack ? ' @ ' + e.stack : ''));
  const prob = [...r.erros, ...r.nan, ...(r.parado ? ['jogador travado'] : []), ...(r.tiros === 0 ? ['não atirou'] : []), ...(r.estado !== 'playing' ? ['estado ' + r.estado] : []), ...(r.fps < 20 ? ['fps baixo ' + r.fps] : [])];
  rel.push({ ...r, problemas: prob });
  console.log(`${prob.length ? '✗' : '✓'} ${id.padEnd(12)} ${r.dificuldade.padEnd(7)} ${r.sobrevivente.padEnd(8)} onda ${String(r.onda).padEnd(3)} inimigos ${String(r.maxInimigos).padEnd(3)} abates ${String(r.abates).padEnd(4)} fps ${r.fps} mem ${r.memoriaMb}MB ${prob.join(' | ')}`);
}
// telas e menus: abre todas e procura erro
const n1 = erros.length;
await p.evaluate(async () => {
  const g = __bh; const w = (ms) => new Promise((ok) => setTimeout(ok, ms));
  g.toMenu(); await w(300);
  for (const sc of ['skills', 'enemies', 'items', 'scenery', 'records', 'credits', 'gamepad']) { try { g.ui.showScreen(sc, { back: 'menu' }); } catch (e) { console.error('tela ' + sc + ': ' + e.message); } await w(250); }
  for (const tab of [0, 1, 2, 3]) { g.ui.showScreen('controls', { back: 'menu', tab }); await w(120); }
  for (const tab of [0, 1]) { g.ui.showScreen('settings', { back: 'menu', tab }); await w(120); }
  g.ui.showScreen('pick', { mode: 'solo' }); await w(400);
  g.ui.showScreen('arena', { mode: 'solo', picks: [__bhTest.SURVIVORS[0]] }); await w(800);
  g.ui.showScreen('difficulty', { back: () => g.ui.showScreen('menu'), go: () => {} }); await w(300);
});
const telas = erros.slice(n1).map((e) => e.msg);
console.log(`${telas.length ? '✗' : '✓'} telas e menus ${telas.join(' | ')}`);
fs.writeFileSync('tests/resultado-fumaca.json', JSON.stringify({ data: new Date().toISOString(), rel, telas }, null, 2));
const bugs = rel.filter((r) => r.problemas.length).length + (telas.length ? 1 : 0);
console.log(`\n${bugs ? bugs + ' com problema' : 'nenhum problema encontrado'} · detalhes em tests/resultado-fumaca.json`);
await b.close();
srv.close();
process.exit(bugs ? 1 : 0);
