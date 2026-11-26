// Valida que o PvP não tem mais montaria: telas, partida simulada, HUD e controles.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.TEST_URL || 'http://localhost:4179/?test';
const OUT = path.resolve('prints/pvp-nomount');
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch({ headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__bh, { timeout: 15000 });

  // abre PvP > Criar Sala
  await page.evaluate(() => window.__bh.ui.showScreen('pvp', { view: 'create' }));
  await page.waitForTimeout(250);
  const createAudit = await page.evaluate(() => {
    const root = document.querySelector('.pvp-create-win') || document.body;
    const txt = root.innerText.toUpperCase();
    return {
      hasMountWord: /MONTARIA/.test(txt),
      mountCards: document.querySelectorAll('.pvp-mount-card').length,
      mountGrids: document.querySelectorAll('.pvp-mount-grid').length,
      steps: [...root.querySelectorAll('.pvp-step-num')].map((e) => e.textContent.trim()),
    };
  });
  check('Tela Criar Sala sem montaria', !createAudit.hasMountWord && !createAudit.mountCards && !createAudit.mountGrids, JSON.stringify(createAudit));
  await page.screenshot({ path: path.join(OUT, 'criar-sala.png') });

  // abre Entrar na Sala
  await page.evaluate(() => window.__bh.ui.showScreen('pvp', { view: 'join' }));
  await page.waitForTimeout(250);
  const joinAudit = await page.evaluate(() => {
    const root = document.querySelector('.pvp-join-win') || document.body;
    const txt = root.innerText.toUpperCase();
    return {
      hasMountWord: /MONTARIA/.test(txt),
      mountCards: document.querySelectorAll('.pvp-mount-card').length,
      mountGrids: document.querySelectorAll('.pvp-mount-grid').length,
    };
  });
  check('Tela Entrar na Sala sem montaria', !joinAudit.hasMountWord && !joinAudit.mountCards && !joinAudit.mountGrids, JSON.stringify(joinAudit));
  await page.screenshot({ path: path.join(OUT, 'entrar-sala.png') });

  // partida PvP simulada (sala fake local, sem broker)
  const sim = await page.evaluate(() => {
    const g = window.__bh;
    g.pvpHost('courtyard', 'kairo');
    g.pvp.slots.push({ idx: 1, peerId: 'host', survivorId: 'maya', label: 'Jogador 2' });
    g.pvpStartFromHost();
    return { state: g.state, mode: g.mode, players: g.players.length };
  });
  await page.waitForFunction(() => window.__bh.state === 'playing', { timeout: 8000 });
  check('Partida PvP inicia (2 jogadores)', sim.state === 'playing' && sim.mode === 'pvp' && sim.players >= 2, JSON.stringify(sim));

  const st = await page.evaluate(() => {
    const g = window.__bh;
    // tenta montar por tecla (KeyM padrão) e por chamada direta
    const before = g.players.map((p) => ({ mounted: !!p.isMounted, mount: p.pvpMount || null, mountId: p.mountId ?? null }));
    g.input.down.add('KeyM');
    return { before, worldMount: g.worldMount };
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__bh.input.down.delete('KeyM'));
  const after = await page.evaluate(() => {
    const g = window.__bh;
    g.releaseMount({ type: 'boss_test', _mountReleased: false }); // chefe em PvP não deve liberar montaria
    return {
      mounted: g.players.map((p) => !!p.isMounted),
      mounts: g.players.map((p) => p.pvpMount || null),
      worldMount: g.worldMount,
      mountBarHidden: document.querySelector('.mount-bar')?.classList.contains('hidden'),
      mountIndicatorHidden: document.querySelector('.mount-indicator')?.classList.contains('hidden'),
    };
  });
  check('Nenhum jogador montado/montaria instanciada', after.mounted.every((v) => !v) && after.mounts.every((m) => !m), JSON.stringify(after));
  check('Chefe em PvP não libera montaria', !after.worldMount, JSON.stringify({ worldMount: after.worldMount }));
  check('HUD sem barra/indicador de montaria', after.mountBarHidden && after.mountIndicatorHidden, JSON.stringify({ bar: after.mountBarHidden, ind: after.mountIndicatorHidden }));
  await page.screenshot({ path: path.join(OUT, 'partida-pvp.png') });
  check('Sem erros de página no PvP', errors.length === 0, errors.join(' | '));
  await ctx.close();

  // mobile: botão de montar deve ficar oculto no PvP
  const mctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const mp = await mctx.newPage();
  const merr = [];
  mp.on('pageerror', (e) => merr.push(e.message));
  await mp.goto(URL, { waitUntil: 'networkidle' });
  await mp.waitForFunction(() => !!window.__bh, { timeout: 15000 });
  await mp.evaluate(() => {
    const g = window.__bh;
    g.pvpHost('courtyard', 'kairo');
    g.pvp.slots.push({ idx: 1, peerId: 'host', survivorId: 'maya', label: 'Jogador 2' });
    g.pvpStartFromHost();
  });
  await mp.waitForFunction(() => window.__bh.state === 'playing', { timeout: 8000 });
  await mp.waitForTimeout(600);
  const mobile = await mp.evaluate(() => {
    const btn = document.querySelector('.touch .tb.mnt');
    const touch = document.querySelector('.touch');
    return {
      touchMode: !!window.__bh.input.touchMode,
      touchVisible: !!touch && !touch.classList.contains('hidden'),
      mountBtnHidden: !btn || btn.classList.contains('hidden'),
    };
  });
  check('Mobile: controles visíveis e sem botão Montar no PvP', mobile.touchVisible && mobile.mountBtnHidden, JSON.stringify(mobile));
  await mp.screenshot({ path: path.join(OUT, 'mobile-pvp.png') });
  check('Sem erros de página no PvP mobile', merr.length === 0, merr.join(' | '));
  await mctx.close();
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify({ results, ok: results.every((r) => r.pass) }, null, 2));
  const fails = results.filter((r) => !r.pass);
  console.log(`\n${results.length - fails.length}/${results.length} OK`);
  if (fails.length) process.exitCode = 1;
}
