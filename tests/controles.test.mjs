// Teste automático de controles: simula cada modelo pela Gamepad API e roda o mesmo
// roteiro de jogo em Chrome, Edge e Firefox. Uso: npm run test:controles
// Opções: --browser=chrome|edge|firefox   --modelo=texto   --url=http://...
// Limite: simula o que o navegador entrega; não testa driver, Bluetooth nem vibração física.
import { chromium, firefox } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');

// id e layout como os navegadores costumam informar cada controle
const STD = { mapping: 'standard', buttons: 17, axes: 4 };
const MODELOS = [
  { nome: 'Xbox (XInput, Windows)', id: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', fam: 'xbox', fire: 'RT', ...STD },
  { nome: 'Xbox One', id: 'Xbox One Controller (STANDARD GAMEPAD Vendor: 045e Product: 02ea)', fam: 'xbox', fire: 'RT', ...STD },
  { nome: 'Xbox Series X|S (Bluetooth)', id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', fam: 'xbox', fire: 'RT', ...STD },
  { nome: 'DualShock 4', id: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)', fam: 'playstation', fire: 'R2', ...STD },
  { nome: 'DualSense', id: 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', fam: 'playstation', fire: 'R2', ...STD },
  { nome: 'Switch Pro Controller', id: 'Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)', fam: 'nintendo', fire: 'ZR', ...STD },
  { nome: 'Joy-Con (par)', id: 'Joy-Con L+R (STANDARD GAMEPAD Vendor: 057e Product: 200e)', fam: 'nintendo', fire: 'ZR', ...STD },
  { nome: '8BitDo Pro 2 (modo X)', id: '8BitDo Pro 2 (STANDARD GAMEPAD Vendor: 2dc8 Product: 6006)', fam: 'xbox', fire: 'RT', ...STD },
  { nome: 'Logitech F310', id: 'Logitech Gamepad F310 (STANDARD GAMEPAD Vendor: 046d Product: c21d)', fam: 'xbox', fire: 'RT', ...STD },
  { nome: 'Genérico USB (estilo Firefox)', id: '0079-0006-Generic   USB  Joystick', fam: 'generic', fire: 'R2', mapping: '', buttons: 12, axes: 10, hat: true },
];
const NAVS = [
  ['Chrome', chromium, { channel: 'chrome' }],
  ['Edge', chromium, { channel: 'msedge' }],
  ['Firefox', firefox, {}],
];

// controle falso instalado antes do jogo carregar
const MOCK = () => {
  const st = { pads: [null, null, null, null] };
  // ignora controles reais ligados ao PC: só o simulado entra no teste
  for (const t of ['gamepadconnected', 'gamepaddisconnected']) window.addEventListener(t, (e) => { if (!e.__fake) e.stopImmediatePropagation(); }, true);
  navigator.getGamepads = () => st.pads;
  window.__pad = {
    plug(m) {
      const gp = { id: m.id, index: 0, connected: true, mapping: m.mapping, timestamp: 0, axes: new Array(m.axes).fill(0),
        buttons: Array.from({ length: m.buttons }, () => ({ pressed: false, value: 0 })),
        vibrationActuator: { type: 'dual-rumble', playEffect: () => { window.__rumble = (window.__rumble || 0) + 1; return Promise.resolve('complete'); } } };
      if (m.hat) gp.axes[9] = 1.2857; // direcional solto
      st.pads[0] = gp;
      window.dispatchEvent(Object.assign(new Event('gamepadconnected'), { gamepad: gp, __fake: true }));
    },
    unplug() {
      const gp = st.pads[0];
      st.pads[0] = null;
      window.dispatchEvent(Object.assign(new Event('gamepaddisconnected'), { gamepad: gp, __fake: true }));
    },
    set(i, v) { st.pads[0].buttons[i] = { pressed: v > 0.5, value: v }; },
    axes(a) { a.forEach((v, i) => (st.pads[0].axes[i] = v)); },
    gp: () => st.pads[0],
  };
};

function servir() {
  const file = path.join(ROOT, 'portable', 'BlockHorde.html');
  if (!fs.existsSync(file)) throw new Error('Rode antes: npm run build:portable');
  const srv = http.createServer((q, r) => {
    if (q.url.startsWith('/favicon')) return r.writeHead(204).end();
    r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(r);
  });
  return new Promise((ok) => srv.listen(0, () => ok({ srv, url: `http://localhost:${srv.address().port}/` })));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function roteiro(page, m) {
  const R = {};
  const ev = (f, a) => page.evaluate(f, a);
  const tap = async (i) => { await ev((i) => __pad.set(i, 1), i); await sleep(120); await ev((i) => __pad.set(i, 0), i); await sleep(180); };
  const dpad = async (dir) => {
    if (!m.hat) return tap({ up: 12, down: 13 }[dir]);
    await ev((v) => __pad.axes(Object.assign([], { 9: v })), dir === 'up' ? -1 : 0.1429); await sleep(120);
    await ev(() => { const a = []; a[9] = 1.2857; __pad.axes(a); }); await sleep(180);
  };
  const ck = (nome, ok, info = '') => (R[nome] = ok ? '✓' : `✗ ${info}`.trim());

  await ev((m) => __pad.plug(m), m);
  await tap(0); // primeiro botão: o navegador "libera" o controle; A/✕ confirma "Jogar agora"
  await page.waitForFunction(() => __bh.state === 'playing', null, { timeout: 8000 }).catch(() => {});
  const info = await ev(() => __bh.pad.active?.info);
  ck('reconhece', info?.family === m.fam, `${info?.family}/${info?.maker}`);
  R.modelo_lido = info ? `${info.maker} · ${info.model}` : '—';
  ck('menu (confirmar)', await ev(() => __bh.state === 'playing'));
  await ev(() => { __bh.debugGod = true; __bh.skipTutorial?.(); });
  await sleep(300);
  const glyphs = await ev(() => [...document.querySelectorAll('kbd[data-ab]')].map((k) => k.textContent).join(' '));
  const fireG = await ev(() => __bh.pad.actionGlyph('fire'));
  ck('ícones', fireG === m.fire && !/^[ZXCR] /.test(glyphs + ' '), `${fireG} | ${glyphs}`);

  const x0 = await ev(() => __bh.players[0].pos.x);
  await ev(() => __pad.axes([1, 0])); await sleep(700); await ev(() => __pad.axes([0, 0]));
  const dx = (await ev(() => __bh.players[0].pos.x)) - x0;
  ck('mover (analógico)', dx > 1, dx.toFixed(2));

  if (m.axes >= 4) {
    await ev(() => __pad.axes([0, 0, -1, 0])); await sleep(250);
    const aim = await ev(() => __bh.players[0].aim);
    await ev(() => __pad.axes([0, 0, 0, 0]));
    ck('mirar (analógico dir.)', Math.abs(Math.abs(aim) - Math.PI / 2) < 0.3, aim.toFixed(2));
  }
  const s0 = await ev(() => __bh.stats.shots);
  await ev(() => __pad.set(7, 1)); await sleep(700); await ev(() => __pad.set(7, 0));
  ck('atirar', (await ev(() => __bh.stats.shots)) > s0);

  await tap(4);
  ck('habilidade 1', await ev(() => __bh.players[0].cds[0] > 0));

  await ev(() => { const p = __bh.players[0]; __bh.debugGod = false; __bh.damagePlayer(p, 3, p.pos.x + 1, p.pos.z, 0); __bh.debugGod = true; });
  ck('vibração (chamada)', (await ev(() => window.__rumble || 0)) > 0);

  await tap(8);
  ck('árvore (abrir)', await ev(() => __bh.ui.screen === 'tree'));
  await ev(() => { __bh.players[0].pts = 3; __bh.ui.showScreen('tree', { k: 0 }); });
  await sleep(450);
  let comprou = false;
  for (let k = 0; k < 12 && !comprou; k++) {
    const t = await ev(() => (document.activeElement?.disabled ? '' : document.activeElement?.innerText || ''));
    if (/Comprar/.test(t)) {
      await tap(0);
      comprou = await ev(() => Object.keys(__bh.players[0].pas).length > 0);
      break;
    }
    await dpad('down');
  }
  ck('árvore (comprar)', comprou);
  await tap(8);
  ck('árvore (fechar)', await ev(() => __bh.state === 'playing'));

  await tap(9);
  ck('pausar', await ev(() => __bh.ui.screen === 'pause'));
  await sleep(250);
  const f0 = await ev(() => document.activeElement?.innerText);
  await dpad('down');
  ck('menu (navegar)', (await ev(() => document.activeElement?.innerText)) !== f0);
  await tap(8);
  ck('árvore pela pausa', await ev(() => __bh.ui.screen === 'tree'));
  await tap(8);

  await ev(() => __pad.unplug()); await sleep(250);
  ck('desconectar pausa', await ev(() => __bh.state === 'paused'));
  await ev((m) => __pad.plug(m), m); await tap(0); await sleep(200);
  ck('reconectar', await ev(() => __bh.pad.pads.length === 1));
  return R;
}

const { srv, url } = arg('url') ? { url: arg('url') } : await servir();
const fNav = arg('browser');
const fMod = arg('modelo');
const linhas = [];
let falhas = 0;
for (const [nav, type, opt] of NAVS) {
  if (fNav && !nav.toLowerCase().includes(fNav.toLowerCase())) continue;
  let browser;
  try {
    browser = await type.launch({ headless: true, ...opt });
  } catch (e) {
    console.log(`${nav}: não foi possível abrir (${e.message.split('\n')[0]})`);
    continue;
  }
  for (const m of MODELOS) {
    if (fMod && !m.nome.toLowerCase().includes(fMod.toLowerCase())) continue;
    const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
    await ctx.addInitScript(MOCK);
    await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
    const page = await ctx.newPage();
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message.slice(0, 120)));
    let R;
    try {
      await page.goto(url);
      await page.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
      R = await roteiro(page, m);
    } catch (e) {
      R = { falha: e.message.split('\n')[0].slice(0, 120) };
    }
    if (erros.length) R.erros_js = erros.join(' | ');
    const bad = Object.entries(R).filter(([k, v]) => k === 'falha' || k === 'erros_js' || String(v).startsWith('✗'));
    falhas += bad.length;
    linhas.push({ nav, modelo: m.nome, ok: !bad.length, R });
    console.log(`${bad.length ? '✗' : '✓'} ${nav.padEnd(8)} ${m.nome.padEnd(30)} ${bad.length ? bad.map(([k, v]) => `${k}: ${v}`).join(' · ') : R.modelo_lido}`);
    await ctx.close();
  }
  await browser.close();
}
srv?.close();
const out = path.join(ROOT, 'tests', 'resultado-controles.json');
fs.writeFileSync(out, JSON.stringify({ data: new Date().toISOString(), url, linhas }, null, 2));
console.log(`\n${linhas.filter((l) => l.ok).length}/${linhas.length} combinações aprovadas · ${falhas} falha(s) · detalhes: tests/resultado-controles.json`);
process.exit(falhas ? 1 : 0);
