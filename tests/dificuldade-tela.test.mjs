// Tela de dificuldade: seleção das 4 (mouse, controle, toque), botão Começar e nenhum número/porcentagem visível.
import { chromium, devices } from 'playwright';
import http from 'http'; import fs from 'fs';
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream('portable/BlockHorde.html').pipe(r); });
await new Promise((ok) => srv.listen(0, ok));
const b = await chromium.launch({ channel: 'chrome' });
let falhas = 0;
for (const [nome, opt] of [['pc', { viewport: { width: 1366, height: 768 } }], ['celular', devices['Pixel 7 landscape']]]) {
  const ctx = await b.newContext({ locale: 'pt-BR', ...opt });
  await ctx.addInitScript(() => { localStorage.setItem('blockhorde_tutorial_v1', '1'); const pads = [null]; navigator.getGamepads = () => pads; window.__pad = pads; });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${srv.address().port}/`);
  await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 120000 });
  await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Jogar agora').click());
  await p.waitForTimeout(800);
  const r = { nome };
  const txt = await p.evaluate(() => document.querySelector('.overlay.difficulty').innerText);
  r.semNumeros = !/%|\d+\s*[x×]|[+−-]\d/.test(txt) && !/\bpadrão\b/.test(txt);
  r.recomendada = /Recomendada/i.test(txt);
  r.selecao = [];
  for (const n of ['Fácil', 'Normal', 'Difícil', 'Insano']) {
    if (nome === 'celular') await p.locator('.diff-card', { hasText: n.toUpperCase() }).first().tap();
    else await p.locator('.diff-card', { hasText: n.toUpperCase() }).first().click();
    await p.waitForTimeout(250);
    r.selecao.push(await p.evaluate((n) => document.querySelector('.diff-card.selected')?.innerText.includes(n.toUpperCase()) && [...document.querySelectorAll('button')].some((x) => x.innerText.includes(`Começar · ${n}`)), n));
  }
  await p.screenshot({ path: `tests/hud-shots/dificuldade-${nome}.png` });
  // controle: direcional muda o foco, A seleciona
  await p.evaluate(() => { window.__pad[0] = { id: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; });
  const tap = async (i) => { await p.evaluate((i) => (window.__pad[0].buttons[i] = { pressed: true, value: 1 }), i); await p.waitForTimeout(120); await p.evaluate((i) => (window.__pad[0].buttons[i] = { pressed: false, value: 0 }), i); await p.waitForTimeout(200); };
  await tap(14); await tap(14); await tap(14);
  let pegou = false;
  for (let k = 0; k < 8 && !pegou; k++) { const f = await p.evaluate(() => document.activeElement?.className || ''); if (f.includes('diff-card')) { await tap(0); pegou = true; } else await tap(12); }
  r.controleSeleciona = pegou && await p.evaluate(() => !!document.querySelector('.diff-card.selected'));
  // começar
  await p.locator('button', { hasText: 'Começar' }).click();
  await p.waitForTimeout(800);
  r.comecou = await p.evaluate(() => __bh.state === 'playing' && __bh.diff.id === __bh.settings.difficulty);
  const ok = r.semNumeros && r.recomendada && r.selecao.every(Boolean) && r.controleSeleciona && r.comecou;
  if (!ok) falhas++;
  console.log(ok ? '✓' : '✗', JSON.stringify(r));
  await ctx.close();
}
await b.close(); srv.close();
process.exit(falhas ? 1 : 0);
