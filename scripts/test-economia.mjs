// Teste real da economia, loja e áudio (Playwright no build de produção).
// Uso: npx vite preview --port 4173  e depois  node scripts/test-economia.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BH_URL || 'http://127.0.0.1:4173/';
const OUT = path.resolve('prints/economia');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const R = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot(ctxOpts, clean = true) {
  const ctx = await browser.newContext({ locale: 'pt-BR', ...ctxOpts });
  await ctx.addInitScript((clean) => {
    localStorage.setItem('blockhorde_tutorial_v1', JSON.stringify({ status: 'done', step: 12, done: [], seen: ['shop', 'boss', 'mount', 'levelup', 'unlock', 'ability', 'weapon'] }));
    if (clean && !sessionStorage.getItem('econ_init')) { localStorage.removeItem('blockhorde_shop_v1'); sessionStorage.setItem('econ_init', '1'); }
  }, clean);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '?test', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  // som: precisa de um gesto do usuário
  await page.mouse.click(5, 5);
  await page.evaluate(() => window.__bh.audio.unlock());
  return { ctx, page, errors };
}
const start = (page) => page.evaluate(() => {
  const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
  g.debugGod = true; g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
  return g.state;
});

// ============================================================ WEB
{
  const { ctx, page, errors } = await boot({ viewport: { width: 1366, height: 768 } });
  await start(page);
  await sleep(800);

  // A) drop: valor correto, sem duplicar
  R.A_drop = await page.evaluate(() => {
    const g = window.__bh; const p = g.players[0];
    const out = {};
    const before = g.econ.drops;
    const types = ['walker', 'runner', 'spitter', 'brute'];
    const zs = types.map((t, i) => g.spawnZombie(t, p.pos.x + 5 + i, p.pos.z + 3));
    for (const z of zs) g.damageZombie(z, 1e6, 1, 0, p);
    const afterFirst = g.econ.drops;
    for (const z of zs) { z.alive = true; g.killZombie(z, 1, 0, p); } // tentativa de pagar de novo
    out.dropsTotal = afterFirst - before;
    out.duplicatePaid = g.econ.drops - afterFirst;
    out.piles = g.coins.length;
    out.onGround = g.coins.reduce((s, c) => s + c.v, 0);
    out.groundMatchesDrops = out.onGround === g.econ.drops;
    // chefão: faixa 200–500 × dificuldade
    const b = g.spawnZombie('boss', p.pos.x + 9, p.pos.z);
    const d0 = g.econ.drops;
    g.damageZombie(b, 1e7, 1, 0, p);
    out.bossReward = g.econ.drops - d0;
    out.bossInRange = out.bossReward >= 200 && out.bossReward <= 500;
    out.bossPiles = g.coins.length;
    return out;
  });
  await sleep(700);
  await page.screenshot({ path: path.join(OUT, '01-moedas-dropadas.png') });

  // B) coleta: o jogador passa pelos montes e o saldo sobe exatamente o valor coletado
  R.B_coleta = await page.evaluate(async () => {
    const g = window.__bh; const p = g.players[0];
    const ground = g.coins.reduce((s, c) => s + c.v, 0);
    const w0 = g.wallet;
    for (const c of [...g.coins]) { p.pos.x = c.x; p.pos.z = c.z; await new Promise((r) => setTimeout(r, 1600)); }
    await new Promise((r) => setTimeout(r, 600));
    return { ground, collected: g.wallet - w0, wallet: g.wallet, left: g.coins.length, hud: document.querySelector('.coin-chip b')?.textContent };
  });
  await page.screenshot({ path: path.join(OUT, '02-saldo-atualizado.png') });

  // D) loja: navegação, compra ok, saldo insuficiente, duplicada, fora do intervalo, consumível sem efeito
  R.D_loja = await page.evaluate(() => {
    const g = window.__bh; const p = g.players[0];
    const out = {};
    g.waveState = 'active';
    out.duringWave = g.buy('c_medkit').reason;
    g.waveState = 'intermission'; g.waveT = 99;
    const w = g.wallet;
    g.wallet = 0;
    out.noMoney = g.buy('w_uzi');
    out.noMoneyCharged = g.wallet !== 0;
    g.wallet = w + 1200; // saldo para testar compras (valor somado ao coletado)
    const before = g.wallet;
    out.buyUzi = g.buy('w_uzi');
    out.charged = before - g.wallet;
    out.dup = g.buy('w_uzi');
    out.dupCharged = before - g.wallet - out.charged;
    out.saved = JSON.parse(localStorage.getItem('blockhorde_shop_v1')).owned.w_uzi === true;
    out.uziNow = g.unlocked.has('uzi');
    p.hp = p.maxHp;
    const w2 = g.wallet;
    out.medkitFull = g.buy('c_medkit');
    out.medkitFullCharged = w2 - g.wallet;
    p.hp = 20;
    out.medkitHurt = g.buy('c_medkit').ok;
    out.medkitHp = p.hp;
    out.legendNoMoney = g.buy('w_plasma').reason;
    return out;
  });
  await page.evaluate(() => window.__bh.openShop());
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT, '03-loja-na-partida.png') });
  R.D_nav = {};
  for (const cat of ['Armas', 'Acessórios', 'Montarias', 'Roupas e skins', 'Melhorias', 'Colecionáveis', 'Na partida']) {
    await page.locator('.shop-tabs .tab', { hasText: cat }).first().click();
    await sleep(900);
    R.D_nav[cat] = await page.evaluate(() => ({ cards: document.querySelectorAll('.shop-card').length, soon: !!document.querySelector('.shop-soon') }));
    if (cat === 'Armas') await page.screenshot({ path: path.join(OUT, '04-loja-armas-previa-3d.png') });
    if (cat === 'Montarias') await page.screenshot({ path: path.join(OUT, '05-loja-categoria-em-breve.png') });
  }
  // compra pela interface (épico: 2 toques) e saldo insuficiente pela interface
  await page.locator('.shop-tabs .tab', { hasText: 'Armas' }).first().click();
  await sleep(600);
  R.D_ui = await page.evaluate(() => ({ wallet: window.__bh.wallet }));
  const sniper = page.locator('.shop-card', { hasText: 'Rifle de precisão' }).locator('.shop-buy');
  await sniper.click(); await sleep(200);
  R.D_ui.confirmLabel = await page.locator('.shop-card', { hasText: 'Rifle de precisão' }).locator('.shop-buy').textContent();
  await page.locator('.shop-card', { hasText: 'Rifle de precisão' }).locator('.shop-buy').click();
  await sleep(500);
  R.D_ui.sniperOwned = await page.evaluate(() => !!JSON.parse(localStorage.getItem('blockhorde_shop_v1')).owned.w_sniper);
  R.D_ui.alert = await page.evaluate(() => [...document.querySelectorAll('.alert, .notice')].map((e) => e.textContent).slice(-1)[0]);
  await page.screenshot({ path: path.join(OUT, '06-compra-concluida.png') });
  await sleep(2600);
  await page.locator('.shop-card', { hasText: 'Rifle de plasma' }).locator('.shop-buy').click({ force: true });
  await sleep(400);
  R.D_ui.denyAlert = await page.evaluate(() => [...document.querySelectorAll('.alert, .notice')].map((e) => e.textContent).slice(-1)[0]);
  await page.screenshot({ path: path.join(OUT, '07-saldo-insuficiente.png') });
  await page.locator('.shop .win-head .close').click();
  await sleep(300);

  // C) morte: perde 100% uma vez; itens permanentes ficam
  R.C_morte = await page.evaluate(async () => {
    const g = window.__bh; g.wallet = 1250;
    const logBefore = JSON.parse(localStorage.getItem('blockhorde_shop_v1')).log.filter((l) => l.type === 'death_loss').length;
    g.debugGod = false;
    for (const p of g.players) { p.alive = false; p.hp = 0; }
    g.gameOver();
    const after = g.wallet;
    g.gameOver(); // segunda chamada não pode descontar de novo
    const s = JSON.parse(localStorage.getItem('blockhorde_shop_v1'));
    return { walletAfter: after, lost: g.econ.lost, lossLogs: s.log.filter((l) => l.type === 'death_loss').length - logBefore, permanent: Object.keys(s.owned), screen: g.ui.screen, text: document.querySelector('.coin-loss')?.textContent };
  });
  await sleep(900);
  await page.screenshot({ path: path.join(OUT, '08-morte-moedas-perdidas.png') });
  // morte sem moedas: sem perda nem som
  R.C_semSaldo = await page.evaluate(() => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo'); g.wallet = 0;
    for (const p of g.players) { p.alive = false; p.hp = 0; }
    const played = []; const orig = g.audio.play.bind(g.audio); g.audio.play = (n, o) => { played.push(n); return orig(n, o); };
    g.gameOver();
    return new Promise((r) => setTimeout(() => { g.audio.play = orig; r({ lost: g.econ.lost, lossSound: played.includes('coin_loss') }); }, 900));
  });

  // E) persistência: recarregar a página e iniciar nova partida
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  await page.mouse.click(5, 5);
  await page.evaluate(() => window.__bh.audio.unlock());
  R.E_persist = await page.evaluate(() => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    const has = { uzi: g.unlocked.has('uzi'), sniper: g.unlocked.has('sniper'), wallet: g.wallet };
    g.toggleEquip('w_uzi'); // desequipar
    g.toMenu(); g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    has.uziAfterUnequip = g.unlocked.has('uzi');
    g.toggleEquip('w_uzi'); g.toMenu();
    return has;
  });
  await page.evaluate(() => window.__bh.ui.showScreen('shop', { inMatch: false }));
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT, '09-inventario-itens-permanentes.png') });

  // F) áudio: sons gerados, canais e volumes salvos
  R.F_audio = await page.evaluate(() => {
    const g = window.__bh; const a = g.audio;
    const names = ['coin_drop', 'coin_pick', 'coin_multi', 'coin_big', 'coin_loss', 'shop_open', 'shop_close', 'shop_tab', 'shop_select', 'shop_buy', 'shop_legend', 'shop_deny', 'equip', 'unequip'];
    const missing = names.filter((n) => !a.buffers[n]);
    const dur = Object.fromEntries(names.filter((n) => a.buffers[n]).map((n) => [n, +a.buffers[n].duration.toFixed(2)]));
    g.settings.ambient = 0.2; g.settings.ui = 0.3; g.applyVolumes(); g.saveSettings();
    return { missing, dur, vol: a.vol, uiBus: a.uiBus ? +a.uiBus.gain.value.toFixed(2) : null, ambientBus: a.ambientBus ? +a.ambientBus.gain.value.toFixed(3) : null };
  });
  await page.evaluate(() => window.__bh.ui.showScreen('settings', { back: 'menu' }));
  await sleep(400);
  R.F_settingsUi = await page.evaluate(() => [...document.querySelectorAll('.settings label.set span')].map((e) => e.textContent).filter((t) => /Volume|Música|Efeitos|Ambiente|Interface/.test(t)));
  await page.screenshot({ path: path.join(OUT, '10-configuracoes-audio.png') });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
  await page.mouse.click(5, 5);
  await page.evaluate(() => window.__bh.audio.unlock());
  R.F_volPersist = await page.evaluate(() => ({ ambient: window.__bh.settings.ambient, ui: window.__bh.settings.ui }));
  await page.evaluate(() => { const g = window.__bh; g.settings.ambient = 0.5; g.settings.ui = 0.8; g.saveSettings(); });
  // sobreposição: 40 coletas no mesmo instante viram 1 som
  R.F_throttle = await page.evaluate(async () => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest; g.audio.unlock();
    g.debugGod = true; g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    const played = []; const orig = g.audio.play.bind(g.audio); g.audio.play = (n, o) => { played.push(n); return orig(n, o); };
    const p = g.players[0];
    for (let k = 0; k < 40; k++) g.takeCoins(p, { v: 7, x: p.pos.x, z: p.pos.z, taken: false });
    await new Promise((r) => setTimeout(r, 4000));
    g.audio.play = orig;
    return { coinSounds: played.filter((n) => n.startsWith('coin')).length, which: [...new Set(played.filter((n) => n.startsWith('coin')))], wallet: g.wallet };
  });

  // G) desempenho com muitas recompensas: 300 abates seguidos
  R.G_perf = await page.evaluate(async () => {
    const g = window.__bh; const p = g.players[0];
    let maxPiles = 0;
    for (let k = 0; k < 300; k++) {
      const z = g.spawnZombie('walker', p.pos.x + 6 + (k % 10), p.pos.z + 4 + Math.floor(k / 10) % 6);
      if (z) g.damageZombie(z, 1e6, 1, 0, p);
      maxPiles = Math.max(maxPiles, g.coins.length);
    }
    const t0 = performance.now();
    for (let k = 0; k < 600; k++) g.updateCoins(1 / 60);
    const ms = (performance.now() - t0) / 600;
    const fr = [];
    let last = performance.now();
    await new Promise((res) => { let n = 0; const f = (now) => { fr.push(now - last); last = now; if (++n < 90) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    fr.sort((a, b) => a - b);
    return { maxPiles, updateCoinsMs: +ms.toFixed(4), frameMedianMs: +fr[45].toFixed(1) };
  });

  // balanceamento: moedas esperadas por onda (média de 400 sorteios por onda, dificuldade Normal, arena Praça)
  R.balance = await page.evaluate(() => {
    const g = window.__bh; const { ENEMIES, ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS[0], [SURVIVORS[0]], 'solo');
    const p = g.players[0];
    const perWave = [];
    for (let w = 1; w <= 15; w++) {
      let tot = 0; const runs = 30;
      for (let r = 0; r < runs; r++) {
        const list = g.buildWave(w);
        const d0 = g.econ.drops;
        for (const t of list) g.dropCoins({ def: ENEMIES[t], pos: { x: p.pos.x, z: p.pos.z }, coinDone: false });
        tot += g.econ.drops - d0;
        g.coins.length = 0;
      }
      perWave.push(Math.round(tot / runs));
    }
    let acc = 0; const cum = perWave.map((v) => (acc += v));
    const waveFor = (price) => cum.findIndex((c) => c >= price) + 1 || '>15';
    return { perWave, cumulative: cum, waveToBuy: { comum50: waveFor(50), raro250: waveFor(250), epico750: waveFor(750), lendario2000: waveFor(2000), catalogoInteiro: waveFor(7950) } };
  });
  R.errors = errors;
  await ctx.close();
}

// ============================================================ CELULAR (deitado)
{
  const { ctx, page, errors } = await boot({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, false);
  await start(page);
  await sleep(600);
  await page.evaluate(() => {
    const g = window.__bh; const p = g.players[0];
    for (let i = 0; i < 6; i++) { const z = g.spawnZombie('runner', p.pos.x + 2 + i * 0.6, p.pos.z + 2); g.damageZombie(z, 1e6, 1, 0, p); }
    g.wallet = 640; g.waveState = 'intermission'; g.waveT = 99;
  });
  await sleep(900);
  await page.screenshot({ path: path.join(OUT, 'mobile-01-hud-moedas.png') });
  R.M_hud = await page.evaluate(() => {
    const chip = document.querySelector('.coin-chip').getBoundingClientRect();
    const over = (sel) => [...document.querySelectorAll(sel)].some((e) => { const r = e.getBoundingClientRect(); return r.width && !(r.right <= chip.left || r.left >= chip.right || r.bottom <= chip.top || r.top >= chip.bottom); });
    return { chipVisible: chip.width > 0 && chip.top >= 0, overlaps: ['.radar', '.pause-btn', '.players .pp.p1', '.tbtns', '.stick'].filter(over), canBuy: document.querySelector('.coin-chip').classList.contains('can-buy') };
  });
  await page.evaluate(() => document.querySelector('.coin-chip').click());
  await sleep(1500);
  R.M_shop = await page.evaluate(() => ({ screen: window.__bh.ui.screen, cards: document.querySelectorAll('.shop-card').length, minBtn: Math.min(...[...document.querySelectorAll('.shop-card .btn, .shop-card .shop-buy')].map((b) => b.getBoundingClientRect().height)), scroll: (() => { const p = document.querySelector('.shop .panel'); return p.scrollHeight > p.clientHeight; })() }));
  await page.screenshot({ path: path.join(OUT, 'mobile-02-loja.png') });
  R.M_errors = errors;
  await ctx.close();
}
console.log(JSON.stringify(R, null, 1));
await browser.close();
