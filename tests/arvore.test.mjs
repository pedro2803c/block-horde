// Teste da Árvore de Habilidades: regras (Game.nodeState/buyPassive/buyUlt), tela (UI.scr_tree),
// abrir/fechar (Tab e controle simulado), co-op, celular e persistência.
// Uso: npm run test:arvore   (sobe o vite dev sozinho; ou --url=http://localhost:5173/)
// Resultado: tests/resultado-arvore.json
// Limite: controle é simulado pela Gamepad API; não testa controle físico nem toque real de dedo.
import { chromium, devices } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function servidor() {
  if (arg('url')) return { url: arg('url'), stop() {} };
  const port = 5600 + Math.floor(Math.random() * 300);
  const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* subindo */ }
    await sleep(500);
  }
  return { url, stop: () => pr.kill() };
}

const MOCK = () => {
  const st = { pads: [null, null, null, null] };
  for (const t of ['gamepadconnected', 'gamepaddisconnected']) window.addEventListener(t, (e) => { if (!e.__fake) e.stopImmediatePropagation(); }, true);
  navigator.getGamepads = () => st.pads;
  window.__pad = {
    plug() {
      const gp = { id: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), vibrationActuator: { playEffect: () => Promise.resolve() } };
      st.pads[0] = gp;
      window.dispatchEvent(Object.assign(new Event('gamepadconnected'), { gamepad: gp, __fake: true }));
    },
    set(i, v) { st.pads[0].buttons[i] = { pressed: v > 0.5, value: v }; st.pads[0].timestamp++; },
  };
};

const casos = [];
const caso = (nome, ok, esperado, observado) => {
  casos.push({ caso: nome, status: ok ? 'passou' : 'falhou', esperado, observado });
  console.log(`${ok ? '✓' : '✗'} ${nome}${ok ? '' : `\n    esperado: ${esperado}\n    observado: ${JSON.stringify(observado)}`}`);
};

const { url, stop } = await servidor();
const browser = await chromium.launch({ headless: true });
try {
  // ------------------------------------------------------------- desktop solo
  const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  await page.evaluate(() => { __bh.quickStart(); __bh.debugGod = true; });
  await page.waitForFunction(() => __bh.state === 'playing', null, { timeout: 20000 });
  await sleep(1500);
  const ev = (f, a) => page.evaluate(f, a);
  const reset = (extra = {}) => ev((x) => { const p = __bh.players[0]; p.pas = {}; p.pts = 0; p.ultOn = false; Object.assign(p, x); }, extra);

  // 1. regras puras
  const R = await ev(() => {
    const g = __bh; const p = g.players[0]; const out = {};
    p.pas = {}; p.pts = 0;
    out.semPontos = { st: g.nodeState(p, 'damage'), comprou: g.buyPassive(p, 'damage'), pts: p.pts, nv: p.pas.damage || 0 };
    p.pts = 1;
    out.compra = { comprou: g.buyPassive(p, 'damage'), pts: p.pts, nv: p.pas.damage };
    p.pas = {}; p.pts = 100;
    out.preReqAntes = g.nodeState(p, 'crit');
    out.preReqCompraBloq = g.buyPassive(p, 'crit');
    g.buyPassive(p, 'damage');
    out.preReqNv1 = g.nodeState(p, 'crit');
    g.buyPassive(p, 'damage');
    out.preReqNv2 = g.nodeState(p, 'crit');
    out.terceiroNo = g.nodeState(p, 'multishot');
    p.pas = {}; p.pts = 100; const custos = [];
    for (let i = 0; i < 5; i++) { const a = p.pts; g.buyPassive(p, 'damage'); custos.push(a - p.pts); }
    out.custos = custos;
    const antes = p.pts;
    out.max = { st: g.nodeState(p, 'damage'), comprou: g.buyPassive(p, 'damage'), nv: p.pas.damage, cobrou: antes - p.pts };
    // nada desbloqueado sem compra: em todos os ramos, só os primeiros nós ficam liberados com pontos
    p.pas = {}; p.pts = 100;
    out.liberadosNv0 = Object.fromEntries(['damage', 'crit', 'multishot', 'vitality', 'armor', 'regen', 'ammo', 'agility', 'precision', 'cooldown'].map((id) => [id, g.nodeState(p, id)]));
    // Vitalidade
    p.pas = {}; p.pts = 10; p.maxHp = 100; p.hp = 50;
    g.buyPassive(p, 'vitality');
    out.vit = { maxHp: p.maxHp, hp: p.hp };
    // Ultimate
    p.pts = 5; p.lv = 4; p.ultOn = false;
    out.ultNv4 = { st: g.ultState(p), comprou: g.buyUlt(p), pts: p.pts };
    p.lv = 5; p.pts = 1;
    out.ult1pt = { st: g.ultState(p), comprou: g.buyUlt(p), pts: p.pts };
    p.pts = 3;
    out.ultOk = { comprou: g.buyUlt(p), pts: p.pts, on: p.ultOn };
    out.ultDupla = { st: g.ultState(p), comprou: g.buyUlt(p), pts: p.pts };
    // XP → ponto
    const lv = p.lv; const pts = p.pts; p.xp = 0;
    const d = g.diff.mul.xp; g.diff.mul.xp = 1; g.gainXp(p, 80 + 50 * (lv - 1)); g.diff.mul.xp = d;
    out.xp = { subiu: p.lv - lv, ganhou: p.pts - pts };
    return out;
  });
  caso('Pontos insuficientes: nada muda', R.semPontos.st === 'poor' && !R.semPontos.comprou && R.semPontos.pts === 0 && R.semPontos.nv === 0, "estado 'poor', compra falsa, pts 0, nível 0", R.semPontos);
  caso('Compra com 1 ponto: Nv.1 e pontos 1→0', R.compra.comprou && R.compra.pts === 0 && R.compra.nv === 1, 'comprou, pts 0, nível 1', R.compra);
  caso('Pré-requisito: Crítico bloqueado até Dano Nv.2', R.preReqAntes === 'locked' && !R.preReqCompraBloq && R.preReqNv1 === 'locked' && R.preReqNv2 === 'ok' && R.terceiroNo === 'locked', 'locked, locked(Nv1), ok(Nv2); Multitiro ainda locked', R);
  caso('Custos por nível 1,1,2,2,3', JSON.stringify(R.custos) === '[1,1,2,2,3]', '[1,1,2,2,3]', R.custos);
  caso('Nível máximo: não passa de 5 e não cobra', R.max.st === 'max' && !R.max.comprou && R.max.nv === 5 && R.max.cobrou === 0, "estado 'max', nível 5, cobrou 0", R.max);
  const lib = R.liberadosNv0; const primeiros = ['damage', 'vitality', 'regen', 'agility'];
  caso('Nenhuma habilidade liberada indevidamente', Object.entries(lib).every(([id, s]) => (primeiros.includes(id) ? s === 'ok' : s === 'locked')), 'só o 1º nó de cada ramo ok; demais locked', lib);
  caso('Vitalidade +15 vida máx. e +15 vida (uma vez)', R.vit.maxHp === 115 && R.vit.hp === 65, 'maxHp 115, hp 65', R.vit);
  caso('Ultimate bloqueada antes do nível 5', R.ultNv4.st === 'locked' && !R.ultNv4.comprou && R.ultNv4.pts === 5, 'locked, sem cobrar', R.ultNv4);
  caso('Ultimate com 1 ponto: sem pontos', R.ult1pt.st === 'poor' && !R.ult1pt.comprou && R.ult1pt.pts === 1, 'poor, sem cobrar', R.ult1pt);
  caso('Ultimate: libera e cobra 2', R.ultOk.comprou && R.ultOk.pts === 1 && R.ultOk.on, 'cobra 2, ultOn', R.ultOk);
  caso('Ultimate: não compra duas vezes', R.ultDupla.st === 'on' && !R.ultDupla.comprou && R.ultDupla.pts === 1, "'on', não cobra", R.ultDupla);
  caso('XP sobe 1 nível = +1 ponto', R.xp.subiu === 1 && R.xp.ganhou === 1, '+1 nível, +1 ponto', R.xp);

  // 2. tela: contador e compra
  const lerPts = () => ev(() => {
    const s = [...document.querySelectorAll('.overlay.tree small')].find((e) => /PONTOS DE HABILIDADE/i.test(e.textContent));
    return s?.parentElement?.querySelector('b')?.textContent ?? null;
  });
  const botaoCompra = () => page.locator('.overlay.tree button', { hasText: /^(Desbloquear|Evoluir para)/ }).first();
  const selecionar = async (nome) => { await page.locator('.overlay.tree button.node', { hasText: nome }).first().click(); await sleep(450); };

  await reset({ pts: 3 });
  await page.keyboard.press('Tab');
  await sleep(500);
  const ab = await ev(() => ({ state: __bh.state, tela: __bh.ui.screen, overlay: !!document.querySelector('.overlay.tree') }));
  caso('Tab abre a árvore e pausa', ab.state === 'paused' && ab.tela === 'tree' && ab.overlay, "state 'paused', tela 'tree'", ab);
  const t0 = await ev(() => __bh.time); await sleep(800); const t1 = await ev(() => __bh.time);
  caso('Jogo parado com a árvore aberta', t1 === t0, 'g.time não avança', { t0, t1 });
  const ptsAntes = await lerPts();
  await selecionar('Dano aumentado');
  await botaoCompra().click();
  await sleep(150);
  const ptsDepois = await lerPts();
  const nvTela = await ev(() => __bh.players[0].pas.damage || 0);
  caso('Contador na tela atualiza logo após comprar', ptsAntes === '3 pontos' && ptsDepois === '2 pontos' && nvTela === 1, "'3 pontos' → '2 pontos', Nv.1", { ptsAntes, ptsDepois, nvTela });
  const badge = await page.locator('.overlay.tree button.node', { hasText: 'Dano aumentado' }).first().innerText();
  caso('Nó mostra nível 1/5 depois da compra', /1\/5/.test(badge), "texto do nó com '1/5'", badge.replace(/\s+/g, ' '));

  // clique duplo rápido
  await reset({ pts: 10 });
  await page.keyboard.press('Tab'); await sleep(300); await page.keyboard.press('Tab'); await sleep(500); // reabre e redesenha
  await selecionar('Agilidade');
  await botaoCompra().dblclick();
  await sleep(500);
  const dbl = await ev(() => ({ pts: __bh.players[0].pts, nv: __bh.players[0].pas.agility || 0 }));
  caso('Clique duplo rápido compra só 1 nível', dbl.nv === 1 && dbl.pts === 9, 'Nv.1, pts 9', dbl);

  // Enter repetido no botão focado
  await reset({ pts: 10 });
  await page.keyboard.press('Tab'); await sleep(300); await page.keyboard.press('Tab'); await sleep(500);
  await selecionar('Regeneração');
  // o navegador sem tela pode atrasar cada tecla (>1 s): mede o intervalo real entre compras em vez de supor 40 ms
  await ev(() => { const g = __bh; g.__buyOrig ??= g.buyPassive; window.__buys = []; g.buyPassive = (p, id) => { const r = g.__buyOrig.call(g, p, id); if (r) window.__buys.push(performance.now()); return r; }; });
  await botaoCompra().focus();
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Enter'); await sleep(40); }
  await sleep(500);
  const ent = await ev(() => {
    const b = window.__buys; __bh.buyPassive = __bh.__buyOrig;
    const gaps = b.slice(1).map((t, i) => Math.round(t - b[i]));
    const a = document.activeElement;
    return { pts: __bh.players[0].pts, nv: __bh.players[0].pas.regen || 0, menorIntervaloMs: gaps.length ? Math.min(...gaps) : null, focoNaArvore: !!a?.closest('.overlay.tree'), foco: a?.dataset?.node || a?.textContent?.trim().slice(0, 40) };
  });
  const custoEnt = [...Array(ent.nv)].reduce((s, _, i) => s + Math.ceil((i + 1) / 2), 0);
  caso('Enter repetido rápido: nenhuma compra a menos de 350 ms da anterior e cobrança exata', (10 - ent.pts) === custoEnt && (ent.menorIntervaloMs === null || ent.menorIntervaloMs >= 350), 'pontos gastos = soma dos custos; intervalo entre compras ≥ 350 ms', ent);
  caso('Foco continua na árvore depois de comprar (inclusive no nível máximo)', ent.focoNaArvore, 'document.activeElement dentro de .overlay.tree', ent);
  // Enter mantido (autorepeat) não deve comprar níveis em sequência
  await sleep(500);
  const antesHold = await ev(() => ({ pts: __bh.players[0].pts, nv: __bh.players[0].pas.regen || 0 }));
  await botaoCompra().focus().catch(() => {});
  await page.keyboard.down('Enter'); await sleep(600); await page.keyboard.up('Enter'); await sleep(400);
  const hold = await ev(() => ({ pts: __bh.players[0].pts, nv: __bh.players[0].pas.regen || 0 }));
  caso('Gasto de pontos sempre igual ao custo dos níveis (Enter segurado)', (antesHold.pts - hold.pts) === [...Array(hold.nv - antesHold.nv)].reduce((s, _, i) => s + Math.ceil((antesHold.nv + i + 1) / 2), 0), 'pontos gastos = soma dos custos', { antesHold, hold });

  // botão sem pontos
  await reset({ pts: 0 });
  await page.keyboard.press('Tab'); await sleep(300); await page.keyboard.press('Tab'); await sleep(500);
  await selecionar('Agilidade');
  const semPts = await ev(() => {
    const b = [...document.querySelectorAll('.overlay.tree button')].find((e) => /^Desbloquear/.test(e.textContent.trim()));
    return { desabilitado: b?.disabled, aviso: /Pontos insuficientes/.test(document.querySelector('.overlay.tree').textContent) };
  });
  caso('Sem pontos: botão desabilitado e aviso visível', semPts.desabilitado === true && semPts.aviso, 'disabled + "Pontos insuficientes"', semPts);
  await selecionar('Precisão');
  const bloq = await ev(() => ({ txt: /Requer Agilidade no nível 2/.test(document.querySelector('.overlay.tree').textContent), botao: [...document.querySelectorAll('.overlay.tree button')].some((e) => /^(Desbloquear|Evoluir)/.test(e.textContent.trim())) }));
  caso('Nó bloqueado: mostra requisito e não oferece compra', bloq.txt && !bloq.botao, '"Requer Agilidade no nível 2", sem botão', bloq);

  // builds / equipadas
  const rod = await ev(() => document.querySelector('.overlay.tree .tree-footer, .overlay.tree')?.innerText || '');
  caso('Rodapé mostra equipadas e Ult separadas das passivas', /Equipadas:/.test(rod) && /Ult \(/.test(rod), 'texto "Equipadas: …" e "Ult (R)"', rod.match(/Equipadas:[^\n]*/)?.[0] || rod.slice(0, 200));
  const nomesAtivas = await ev(() => __bh.players[0].slots.slice(0, 3));
  caso('Equipadas não aparecem como nós da árvore', nomesAtivas.every((a) => !['damage', 'crit', 'multishot', 'vitality', 'armor', 'regen', 'ammo', 'agility', 'precision', 'cooldown'].includes(a)), 'slots ≠ passivas', nomesAtivas);

  // fechar com Tab e voltar
  await page.keyboard.press('Tab'); await sleep(500);
  const fe = await ev(() => ({ state: __bh.state, overlay: !!document.querySelector('.overlay.tree') }));
  const t2 = await ev(() => __bh.time); await sleep(600); const t3 = await ev(() => __bh.time);
  caso('Tab fecha e o combate volta a rodar', fe.state === 'playing' && !fe.overlay && t3 > t2, "state 'playing', g.time avança", { ...fe, t2, t3 });
  // Voltar ao jogo pelo botão
  await page.keyboard.press('Tab'); await sleep(500);
  await page.locator('.overlay.tree button', { hasText: 'Voltar ao jogo' }).click(); await sleep(400);
  caso('Botão "Voltar ao jogo" fecha e retoma', (await ev(() => __bh.state)) === 'playing', "'playing'", await ev(() => __bh.state));

  // controle simulado (botão 8 = 'tree')
  await ev(() => __pad.plug()); await sleep(500);
  const tap = async (i) => { await ev((i) => __pad.set(i, 1), i); await sleep(150); await ev((i) => __pad.set(i, 0), i); await sleep(400); };
  await tap(8);
  const padAb = await ev(() => ({ state: __bh.state, tela: __bh.ui.screen }));
  await tap(8);
  const padFe = await ev(() => ({ state: __bh.state, tela: __bh.ui.screen }));
  caso('Controle (botão 8 simulado) abre e fecha a árvore', padAb.state === 'paused' && padAb.tela === 'tree' && padFe.state === 'playing', 'abre (paused/tree) e fecha (playing)', { padAb, padFe });

  // persistência
  await reset({ pts: 4 }); await ev(() => __bh.buyPassive(__bh.players[0], 'damage'));
  const ls = await ev(() => ({ loadout: localStorage.getItem('blockhorde_loadout_v1'), chaves: Object.keys(localStorage) }));
  await ev(() => __bh.restart()); await sleep(1500);
  const depoisRestart = await ev(() => ({ pas: __bh.players[0].pas, pts: __bh.players[0].pts, lv: __bh.players[0].lv, ultOn: __bh.players[0].ultOn }));
  caso('Persistência (comportamento real): passivas zeram em nova partida', Object.keys(depoisRestart.pas).length === 0, 'pas vazio após restart (passivas por partida)', { depoisRestart, localStorageChaves: ls.chaves, loadout: ls.loadout });
  caso('Sem erros de JavaScript (desktop)', erros.length === 0, '0 erros', erros);
  await ctx.close();

  // ------------------------------------------------------------- co-op
  const c2 = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
  await c2.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
  const pg = await c2.newPage();
  await pg.goto(url);
  await pg.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  await pg.evaluate(() => { __bh.quickStart(); });
  await pg.waitForFunction(() => __bh.state === 'playing');
  await pg.evaluate(() => { const g = __bh; g.startMatch(g.arenaDef, [g.survivorPicks[0], g.survivorPicks[0]], 'coop'); g.debugGod = true; });
  await pg.waitForFunction(() => __bh.state === 'playing' && __bh.players.length === 2, null, { timeout: 20000 });
  await sleep(1200);
  await pg.evaluate(() => { const [a, b] = __bh.players; a.pas = {}; b.pas = {}; a.pts = 3; b.pts = 1; __bh.openTree(0); });
  await sleep(500);
  const abas = await pg.locator('.overlay.tree [role=tab]').allInnerTexts();
  await pg.locator('.overlay.tree button.node', { hasText: 'Dano aumentado' }).first().click(); await sleep(450);
  await pg.locator('.overlay.tree button', { hasText: /^Desbloquear/ }).first().click(); await sleep(300);
  const cp1 = await pg.evaluate(() => __bh.players.map((q) => ({ pts: q.pts, dano: q.pas.damage || 0 })));
  await pg.locator('.overlay.tree [role=tab]').nth(1).click(); await sleep(500);
  const ptsJ2 = await pg.evaluate(() => [...document.querySelectorAll('.overlay.tree small')].find((e) => /PONTOS DE HABILIDADE/i.test(e.textContent))?.parentElement?.querySelector('b')?.textContent);
  const nodeJ2 = (await pg.locator('.overlay.tree button.node', { hasText: 'Dano aumentado' }).first().innerText()).replace(/\s+/g, ' ');
  caso('Co-op: abas J1 e J2', abas.length === 2, '2 abas', abas);
  caso('Co-op: compra do J1 não gasta pontos do J2', cp1[0].pts === 2 && cp1[0].dano === 1 && cp1[1].pts === 1 && cp1[1].dano === 0, 'J1 pts 2 Nv1; J2 pts 1 Nv0', cp1);
  caso('Co-op: aba J2 mostra os pontos e níveis do J2', ptsJ2 === '1 ponto' && /0\/5/.test(nodeJ2), "'1 ponto' e Dano '0/5'", { ptsJ2, nodeJ2 });
  await c2.close();

  // ------------------------------------------------------------- celular
  for (const [nome, dev] of [['retrato-390x844', { ...devices['iPhone 13'], defaultBrowserType: undefined }], ['paisagem-844x390', { ...devices['iPhone 13 landscape'], defaultBrowserType: undefined }]]) {
    const cm = await browser.newContext({ locale: 'pt-BR', ...dev });
    await cm.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
    const pm = await cm.newPage();
    await pm.goto(url);
    await pm.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
    await pm.evaluate(() => { __bh.quickStart(); __bh.debugGod = true; });
    await pm.waitForFunction(() => __bh.state === 'playing');
    await sleep(1200);
    await pm.evaluate(() => { __bh.players[0].pts = 2; __bh.openTree(); });
    await sleep(600);
    const m = await pm.evaluate(async () => {
      const panel = document.querySelector('.overlay.tree .panel');
      const cs = getComputedStyle(panel);
      const rolavel = panel.scrollHeight > panel.clientHeight ? /(auto|scroll)/.test(cs.overflowY) : true;
      panel.scrollTop = panel.scrollHeight; await new Promise((r) => setTimeout(r, 200));
      const voltar = [...panel.querySelectorAll('button')].find((b) => /Voltar ao jogo/.test(b.textContent));
      const vr = voltar?.getBoundingClientRect();
      const voltarVisivel = !!vr && vr.bottom <= innerHeight + 1 && vr.top >= 0;
      const largura = document.documentElement.scrollWidth <= innerWidth + 1;
      // textos de nós cortados na horizontal
      const cortados = [...panel.querySelectorAll('.node b, .node-badge, .node-cost')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim());
      const nos = [...panel.querySelectorAll('button.node')].map((b) => b.getBoundingClientRect()).map((r) => Math.round(Math.min(r.width, r.height)));
      return { rolavel, voltarVisivel, semRolagemHorizontal: largura, cortados, menorNo: Math.min(...nos), scrollH: panel.scrollHeight, clientH: panel.clientHeight };
    });
    fs.mkdirSync(path.join(ROOT, 'tests', 'hud-shots', 'arvore'), { recursive: true });
    await pm.screenshot({ path: path.join(ROOT, 'tests', 'hud-shots', 'arvore', `${nome}.png`) });
    caso(`Celular ${nome}: painel rola e "Voltar" alcançável`, m.rolavel && m.voltarVisivel && m.semRolagemHorizontal, 'overflow rolável, Voltar visível ao fim, sem rolagem horizontal', m);
    caso(`Celular ${nome}: textos dos nós sem corte`, m.cortados.length === 0, 'nenhum texto cortado', m.cortados);
    caso(`Celular ${nome}: nós com ≥44 px de toque`, m.menorNo >= 44, '≥44 px', m.menorNo);
    await cm.close();
  }
} finally {
  await browser.close();
  stop();
}

const falhas = casos.filter((c) => c.status === 'falhou').length;
fs.writeFileSync(path.join(ROOT, 'tests', 'resultado-arvore.json'), JSON.stringify({ data: new Date().toISOString(), url, total: casos.length, falhas, casos }, null, 2));
console.log(`\n${casos.length - falhas}/${casos.length} casos passaram · tests/resultado-arvore.json`);
process.exit(falhas ? 1 : 0);
