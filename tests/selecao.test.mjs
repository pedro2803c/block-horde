// Seleção de sobreviventes: distribuição sem buracos, modelos de frente,
// fluxo solo/co-op e responsividade (desktop, tablet, celular deitado e em pé).
// Uso: npm run test:selecao   (sobe o vite dev com o src/ atual)
// Resultado: tests/resultado-selecao.json · prints em tests/hud-shots/selecao/
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(ROOT, 'tests', 'hud-shots', 'selecao');
fs.mkdirSync(OUT, { recursive: true });

async function servidor() {
  if (arg('url')) return { url: arg('url'), stop() {} };
  const port = 5900 + Math.floor(Math.random() * 300);
  const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* subindo */
    }
    await sleep(500);
  }
  return { url, stop: () => pr.kill() };
}

const casos = [];
const caso = (nome, ok, esperado, observado) => {
  casos.push({ caso: nome, status: ok ? 'passou' : 'falhou', esperado, observado });
  console.log(`${ok ? '✓' : '✗'} ${nome}${ok ? '' : `\n    esperado: ${esperado}\n    observado: ${JSON.stringify(observado)}`}`);
};

const { url, stop } = await servidor();
const b = await chromium.launch({ channel: 'chrome', headless: true });
const erros = [];
const bruto = {};

async function abrir(w, h, { toque = false } = {}) {
  const ctx = await b.newContext({
    locale: 'pt-BR',
    viewport: { width: w, height: h },
    hasTouch: toque,
    isMobile: toque,
  });
  await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(`${w}x${h}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && erros.push(`${w}x${h}: console: ${m.text()}`));
  await p.goto(url + '?test');
  await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  return { ctx, p };
}

async function medir(p) {
  await p.evaluate(() => __bh.ui.showScreen('pick', { mode: 'solo' }));
  await p.waitForTimeout(900);
  await p.mouse.move(2, 2);
  await p.waitForTimeout(350);
  return p.evaluate(() => {
    const R = (el) => {
      const r = el.getBoundingClientRect();
      return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) };
    };
    const panel = document.querySelector('.overlay.pick .panel');
    const grid = document.querySelector('.pick-grid');
    const cards = [...document.querySelectorAll('.pick-card')].map((c) => ({
      ...R(c),
      name: c.querySelector('strong')?.textContent,
      modelo: R(c.querySelector('canvas')),
      vazio: (() => {
        const cv = c.querySelector('canvas');
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 12) n++;
        return n;
      })(),
    }));
    const rows = [];
    for (const c of [...cards].sort((a, b) => a.y - b.y || a.x - b.x)) {
      const row = rows.find((r) => Math.abs(r[0].y - c.y) <= 8);
      if (row) row.push(c);
      else rows.push([c]);
    }
    rows.forEach((r) => r.sort((a, b) => a.x - b.x));
    return {
      screen: __bh.ui.screen,
      cols: +getComputedStyle(grid).getPropertyValue('--cols'),
      panel: R(panel),
      grid: R(grid),
      cards,
      rows: rows.map((r) => r.map((c) => c.name)),
      rowRects: rows.map((r) => r.map((c) => ({ x: c.x, w: c.w, y: c.y }))),
      rolagem: { sh: panel.scrollHeight, ch: panel.clientHeight },
      angulos: __bh.ui.previewItems.map((it) => +it.angle.toFixed(3)),
      ativos: __bh.ui.previewItems.map((it) => it.active),
      overflowX: document.documentElement.scrollWidth - innerWidth,
    };
  });
}

const VISTAS = [
  ['desktop-1366', 1366, 768, false],
  ['desktop-1920', 1920, 1080, false],
  ['tablet-1024', 1024, 768, false],
  ['celular-deitado', 844, 390, true],
  ['janela-estreita-390', 390, 844, false],
  ['janela-estreita-320', 320, 568, false],
];

for (const [nome, w, h, toque] of VISTAS) {
  const { ctx, p } = await abrir(w, h, { toque });
  const m = await medir(p);
  bruto[nome] = m;
  const rows = m.rowRects;
  const flat = m.cards;
  const linhas = rows.map((r) => r.length);
  const semOrfao = rows.every((r, i) => r.length > 1 || i === rows.length - 1);
  const unicaCentral = rows.every((r) => {
    if (r.length !== 1) return true;
    const centro = r[0].x + r[0].w / 2;
    return Math.abs(centro - (m.grid.x + m.grid.w / 2)) <= 2;
  });
  const larguras = rows.map((r) => Math.max(...r.map((c) => c.w)) - Math.min(...r.map((c) => c.w)));
  const vaos = rows.flatMap((r) => r.slice(1).map((c, i) => +(c.x - (r[i].x + r[i].w)).toFixed(1)));
  const dentro = flat.every((c) => c.x >= m.grid.x - 1 && c.right <= m.grid.right + 1);
  const modelosOk = flat.every((c) => c.modelo.w >= c.w * 0.75);
  const desenhados = flat.every((c) => c.vazio > 800);
  const angulosOk = m.angulos.every((a) => Math.abs(a) <= 0.21);
  const semRolagem = m.rolagem.sh <= m.rolagem.ch + 1;
  const esperaRolagem = w <= 520;

  caso(`${nome}: 5 sobreviventes`, flat.length === 5, '5 cartões', flat.length);
  caso(`${nome}: linhas sem cartão isolado no canto`, semOrfao, 'nenhuma linha incompleta antes da última', linhas);
  caso(`${nome}: linha incompleta centralizada`, unicaCentral, 'centro da grade', rows.map((r) => (r.length === 1 ? +(r[0].x + r[0].w / 2).toFixed(1) : null)));
  caso(`${nome}: larguras iguais`, Math.max(...larguras) <= 1.1, '≤ 1,1 px de diferença', larguras);
  caso(`${nome}: espaçamentos uniformes`, new Set(vaos).size <= 1 && Math.min(...vaos) >= 7, 'um único vão ≥ 7 px', [...new Set(vaos)]);
  caso(`${nome}: cartões dentro da grade`, dentro && m.overflowX <= 1, 'sem estouro horizontal', { dentro, overflowX: m.overflowX });
  caso(`${nome}: modelos grandes o bastante`, modelosOk, '≥ 75% da largura do cartão', flat.map((c) => `${c.modelo.w}/${c.w}`));
  caso(`${nome}: modelos desenhados`, desenhados, 'pixels visíveis em todos', flat.map((c) => c.vazio));
  caso(`${nome}: modelos de frente (sem giro parado)`, angulosOk, '|ângulo| ≤ 0,21 rad', m.angulos);
  caso(`${nome}: altura sem rolagem`, esperaRolagem || semRolagem, esperaRolagem ? 'rolagem permitida no celular em pé' : 'painel cabe na tela', m.rolagem);
  if (esperaRolagem) {
    caso(`${nome}: rolagem curta`, m.rolagem.sh - m.rolagem.ch <= 260, '≤ 260 px', m.rolagem.sh - m.rolagem.ch);
    await p.evaluate(() => { const el = document.querySelector('.overlay.pick .panel'); el.scrollTop = el.scrollHeight; });
    await p.waitForTimeout(300);
    const fim = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('.pick-card')];
      const ultimo = cards[cards.length - 1].getBoundingClientRect();
      const rodape = document.querySelector('.overlay.pick .panel > .row:last-child').getBoundingClientRect();
      return { ultimoFim: +ultimo.bottom.toFixed(1), rodapeTopo: +rodape.top.toFixed(1) };
    });
    caso(`${nome}: último cartão visível acima do rodapé`, fim.ultimoFim <= fim.rodapeTopo + 2, 'fim do cartão ≤ topo do rodapé', fim);
    await p.screenshot({ path: path.join(OUT, `${nome}-fim.png`) });
    await p.evaluate(() => { document.querySelector('.overlay.pick .panel').scrollTop = 0; });
    await p.waitForTimeout(250);
  }
  await p.screenshot({ path: path.join(OUT, `${nome}.png`) });

  // destaque do cartão sob o mouse e animação de frente
  await p.hover('.pick-card:nth-child(2)');
  await p.waitForTimeout(550);
  const hov = await p.evaluate(() => {
    const c = document.querySelectorAll('.pick-card')[1];
    const it = __bh.ui.previewItems[1];
    return { ativo: it.active, angulo: +it.angle.toFixed(3), borda: getComputedStyle(c).borderTopColor };
  });
  caso(`${nome}: hover destaca e vira de frente`, hov.ativo && Math.abs(hov.angulo) < 0.06 && hov.borda === 'rgb(255, 193, 7)', 'ativo, ângulo ~0 e borda amarela', hov);
  await p.screenshot({ path: path.join(OUT, `${nome}-hover.png`) });

  await ctx.close();
}

// fluxo real: menu -> escolha -> arena (solo) e co-op com J1/J2
{
  const { ctx, p } = await abrir(1366, 768);
  await p.getByText('Escolher arena e sobrevivente').click();
  await p.waitForTimeout(700);
  const aberto = await p.evaluate(() => __bh.ui.screen);
  caso('menu abre a escolha de sobrevivente', aberto === 'pick', 'pick', aberto);
  await p.locator('.pick-card').first().click();
  await p.waitForTimeout(500);
  const solo = await p.evaluate(() => ({ screen: __bh.ui.screen, picks: __bh.ui.screenData.picks?.map((s) => s.id) }));
  caso('solo: clicar no primeiro sobrevivente vai para a arena', solo.screen === 'arena' && solo.picks?.[0] === 'soldado', "arena com ['soldado']", solo);

  await p.evaluate(() => __bh.ui.showScreen('pick', { mode: 'coop' }));
  await p.waitForTimeout(600);
  await p.locator('.pick-card').first().click();
  await p.waitForTimeout(500);
  const j1 = await p.evaluate(() => ({
    screen: __bh.ui.screen,
    picks: __bh.ui.screenData.picks?.map((s) => s.id),
    taken: document.querySelectorAll('.pick-card.taken').length,
    badge: document.querySelector('.pick-card.taken .badge')?.textContent.trim(),
    livres: document.querySelectorAll('.pick-card:not(.taken)').length,
    foco: document.activeElement?.querySelector('strong')?.textContent,
  }));
  caso('co-op: J1 escolhe e a tela continua para J2', j1.screen === 'pick' && j1.picks?.length === 1 && j1.taken === 1 && j1.badge === 'J1' && j1.livres === 4, 'pick, 1 escolhido, selo J1, 4 livres', j1);
  caso('co-op: foco vai para o primeiro livre', j1.foco === 'Vetor', 'Vetor', j1.foco);
  await p.screenshot({ path: path.join(OUT, 'coop-j2.png') });
  await p.locator('.pick-card:not(.taken)').first().click();
  await p.waitForTimeout(500);
  const j2 = await p.evaluate(() => ({ screen: __bh.ui.screen, picks: __bh.ui.screenData.picks?.map((s) => s.id) }));
  caso('co-op: J2 escolhe e vai para a arena com os dois', j2.screen === 'arena' && j2.picks?.length === 2 && j2.picks[1] === 'vetor', "arena com ['soldado','vetor']", j2);

  // voltar remove a última escolha e depois volta ao menu
  await p.evaluate(() => __bh.ui.showScreen('pick', { mode: 'coop' }));
  await p.waitForTimeout(500);
  await p.locator('.pick-card').first().click();
  await p.waitForTimeout(400);
  await p.getByText('Voltar', { exact: true }).click();
  await p.waitForTimeout(400);
  const volta1 = await p.evaluate(() => ({ screen: __bh.ui.screen, picks: __bh.ui.screenData.picks?.length }));
  caso('voltar desfaz a escolha do jogador', volta1.screen === 'pick' && volta1.picks === 0, 'pick com 0 escolhas', volta1);
  await p.getByText('Voltar', { exact: true }).click();
  await p.waitForTimeout(400);
  const volta2 = await p.evaluate(() => __bh.ui.screen);
  caso('voltar de novo retorna ao menu', volta2 === 'menu', 'menu', volta2);

  // teclado: Enter no cartão focado escolhe
  await p.evaluate(() => __bh.ui.showScreen('pick', { mode: 'solo' }));
  await p.waitForTimeout(500);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  const teclado = await p.evaluate(() => ({ screen: __bh.ui.screen, pick: __bh.ui.screenData.picks?.[0]?.id }));
  caso('teclado: Enter escolhe o sobrevivente focado', teclado.screen === 'arena' && teclado.pick === 'soldado', "arena com 'soldado'", teclado);
  await ctx.close();
}

// celular de verdade: em pé pede para girar; deitado abre a seleção em uma linha
{
  const { ctx, p } = await abrir(390, 844, { toque: true });
  const emPe = await p.evaluate(() => {
    const lock = document.querySelector('.rotate-lock');
    return { bloqueio: document.body.classList.contains('portrait-lock'), visivel: !!lock && getComputedStyle(lock).display !== 'none' };
  });
  caso('celular em pé: aviso para girar', emPe.bloqueio && emPe.visivel, 'aviso visível', emPe);
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(700);
  const deitado = await p.evaluate(() => {
    const lock = document.querySelector('.rotate-lock');
    return { bloqueio: document.body.classList.contains('portrait-lock'), visivel: !!lock && getComputedStyle(lock).display !== 'none' };
  });
  caso('celular deitado: interface liberada', !deitado.bloqueio && !deitado.visivel, 'sem aviso', deitado);
  await p.evaluate(() => __bh.ui.showScreen('pick', { mode: 'solo' }));
  await p.waitForTimeout(900);
  const m = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.pick-card')];
    const grid = document.querySelector('.pick-grid');
    const ys = cards.map((c) => c.getBoundingClientRect().y);
    const linhas = Math.max(...ys) - Math.min(...ys) <= 8 ? 1 : new Set(ys.map((y) => Math.round(y / 8))).size;
    return { n: cards.length, linhas, cols: +getComputedStyle(grid).getPropertyValue('--cols'), overflowX: document.documentElement.scrollWidth - innerWidth };
  });
  caso('celular deitado: 5 cartões em uma linha', m.n === 5 && m.linhas === 1 && m.cols === 5 && m.overflowX <= 1, '5 cartões, 1 linha, sem estouro', m);
  await p.screenshot({ path: path.join(OUT, 'celular-real-deitado.png') });
  await ctx.close();
}

await b.close();
stop();

caso('sem erros de JavaScript', erros.length === 0, 'nenhum erro', erros.slice(0, 8));
const falhas = casos.filter((c) => c.status === 'falhou');
const resultado = { data: new Date().toISOString(), url, total: casos.length, falhas: falhas.length, casos, bruto, erros };
fs.writeFileSync(path.join(ROOT, 'tests', 'resultado-selecao.json'), JSON.stringify(resultado, null, 2));
console.log(`\n${falhas.length ? '✗' : '✓'} ${casos.length - falhas.length}/${casos.length} passaram · resultado em tests/resultado-selecao.json`);
process.exit(falhas.length ? 1 : 0);
