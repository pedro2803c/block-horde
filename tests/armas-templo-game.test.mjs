import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { UNLOCKS } from '../src/data.js';

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/fav')) return res.writeHead(204).end();
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream('portable/BlockHorde.html').pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 768 } });
  await context.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?test`);
  await page.waitForFunction(() => window.__bh && window.__bhTest?.ARENAS && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });
  const result = await page.evaluate((unlocks) => {
    const g = __bh;
    const { ARENAS, SURVIVORS } = __bhTest;
    const ids = ['pharaoh','anubis_shotgun','scarab_smg','sobek_launcher','sphinx_drill','desert_bow','bastet_staff','priest_staff','horus_spear','mummy_blade'];
    g.startMatch(ARENAS.find((a) => a.id !== 'templo'), [SURVIVORS[0]], 'solo');
    for (const id of ids) g.unlock(unlocks.find((u) => u.weapon === id));
    const outsideLocked = ids.every((id) => !g.unlocked.has(id));
    g.startMatch(ARENAS.find((a) => a.id === 'templo'), [SURVIVORS[0]], 'solo');
    g.state = 'paused';
    const p = g.players[0];
    for (const id of ids) g.unlock(unlocks.find((u) => u.weapon === id));
    const templeUnlocked = ids.every((id) => g.unlocked.has(id));
    const audioCalls = [];
    const playSound = g.audio.play.bind(g.audio);
    g.audio.play = (name, options) => { audioCalls.push(name); return playSound(name, options); };
    const fired = [];
    const reloaded = [];
    const specialCooldowns = [];
    for (const id of ids) {
      const w = g.wstat(id);
      p.weapon = id; p.fireCd = 0; p.reloadT = 0; p.alive = true; p.ammo[id] = 999; p.aim = 0;
      if (w.mag) p.clip[id] = w.mag;
      const before = g.stats.shots;
      g.fire(p);
      fired.push(g.stats.shots === before + 1);
      if (w.mag) {
        p.clip[id] = 0; p.reloadT = 0;
        g.startReload(p);
        reloaded.push(p.reloadW === id && p.reloadT > 0);
      }
      g.zombies.length = 0;
      g.spawnZombie('mummy', p.pos.x, p.pos.z + 1.1);
      const z = g.zombies[g.zombies.length - 1]; z.rise = 0;
      p.egyptProc ||= {};
      p.egyptProc[id] = (w.special.every || 1) - 1;
      g.weaponSpecial(p, z, w, 0, 1);
      specialCooldowns.push((p.egyptCd?.[id] || 0) > g.time);
    }
    const soundsCovered = ids.filter((id) => audioCalls.includes(g.wstat(id).sound)).length;
    g.state = 'playing';
    g.ui.updateHud(0);
    return { outsideLocked, templeUnlocked, fired: fired.filter(Boolean).length, reloaded: reloaded.filter(Boolean).length, reloadTotal: reloaded.length, specialCooldowns: specialCooldowns.filter(Boolean).length, specialTotal: specialCooldowns.length, soundsCovered, total: ids.length };
  }, UNLOCKS);
  await page.waitForTimeout(500);
  result.specialHudCount = await page.locator('.pp-special').count();
  result.specialHudTexts = await page.locator('.pp-special').allTextContents();
  result.specialHud = result.specialHudTexts.find((text) => text.includes('RECARGA')) || '';
  await page.screenshot({ path: path.join(os.tmpdir(), 'blockhorde-temple-weapon-hud.png') });
  console.log(JSON.stringify(result));
  assert.equal(result.outsideLocked, true, 'armas egípcias não ficam disponíveis fora do Templo');
  assert.equal(result.templeUnlocked, true, 'progressão do Templo libera as dez armas');
  assert.equal(result.fired, result.total, 'cada arma executa um disparo real');
  assert.equal(result.reloaded, result.reloadTotal, 'armas com carregador iniciam recarga');
  assert.equal(result.specialCooldowns, result.specialTotal, 'cada habilidade especial inicia sua recarga');
  assert.equal(result.soundsCovered, result.total, 'cada arma dispara seu efeito sonoro');
  assert.match(result.specialHud || '', /RECARGA/, 'HUD mostra o estado de recarga da habilidade');
  assert.equal(errors.length, 0, `erros de runtime: ${errors.join('; ')}`);
  console.log('✓ disparos e exclusividade do Templo validados');
} finally {
  await browser.close();
  server.close();
}
