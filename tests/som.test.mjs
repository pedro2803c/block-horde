import { chromium, firefox, webkit } from 'playwright';
import http from 'http'; import fs from 'fs';
const srv = http.createServer((q, r) => { if (q.url.startsWith('/fav')) return r.writeHead(204).end(); r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream('portable/BlockHorde.html').pipe(r); });
await new Promise((ok) => srv.listen(0, ok));
const url = `http://localhost:${srv.address().port}/`;
const gate = ['--autoplay-policy=user-gesture-required'];
const NAVS = [['Chrome', chromium, { channel: 'chrome', args: gate }], ['Edge', chromium, { channel: 'msedge', args: gate }],
  ['Firefox', firefox, { firefoxUserPrefs: { 'media.autoplay.default': 1, 'media.autoplay.blocking_policy': 2 } }], ['Safari (WebKit)', webkit, {}]];
for (const [nav, type, opt] of NAVS) {
  for (const mobile of [false, true]) {
    const b = await type.launch({ headless: true, ...opt });
    const ctx = await b.newContext({ locale: 'pt-BR', viewport: mobile ? { width: 844, height: 390 } : { width: 1366, height: 768 }, hasTouch: mobile, ...(mobile && type !== firefox ? { isMobile: true } : {}) });
    await ctx.addInitScript(() => { const pads = [null]; navigator.getGamepads = () => pads; window.__plug = () => { pads[0] = { id: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; }; window.__press = (v) => (pads[0].buttons[0] = { pressed: !!v, value: v }); });
    const p = await ctx.newPage();
    await p.goto(url); await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
    await p.waitForTimeout(800);
    const st = () => p.evaluate(() => ({ som: __bh.audio.ctx?.state || 'sem contexto', aviso: !document.querySelector('.sound-hint').classList.contains('hidden') }));
    const a = await st();
    await p.evaluate(() => { __plug(); __press(1); }); await p.waitForTimeout(300); await p.evaluate(() => __press(0)); await p.waitForTimeout(600);
    const c = await st();
    if (mobile) await p.touchscreen.tap(400, 200); else await p.mouse.click(683, 700);
    await p.waitForTimeout(700);
    const d = await st();
    console.log(`${nav.padEnd(16)} ${mobile ? 'celular' : 'PC     '} | abrir: ${a.som}${a.aviso ? ' + aviso' : ''} | controle: ${c.som}${c.aviso ? ' + aviso' : ''} | clique/toque: ${d.som}${d.aviso ? ' + aviso' : ''}`);
    await b.close();
  }
}
srv.close();
