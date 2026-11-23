// Captura individuais do Pirata Afogado (vite preview em 4173). Uso: node scripts/print-pirata-afogado.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('prints/pirata-afogado');
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });

// Static views: frontal, lateral, back, perspective (front center target, back = zombie).
const setupStatic = (view, d = 5) =>
  page.evaluate((args) => {
    const { view, d } = args;
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS.find((x) => x.id === 'naval'), [SURVIVORS[0]], 'solo');
    g.debugGod = true;
    const p = g.players[0];
    for (const z of g.zombies) z.alive = false;
    const sx = p.pos.x, sz = p.pos.z;
    const z = g.spawnZombie('nv_pirate', sx + 1.5, sz);
    if (!z) return { ok: false, view };
    const fx = z.pos.x, fz = z.pos.z;
    clearInterval(window.__hold);
    window.__hold = setInterval(() => {
      z.pos.x = fx; z.pos.z = fz; z.hp = 9999; g.spawnT = 999;
      for (const o of g.zombies) if (o !== z) o.alive = false;
      for (const k of Object.keys(g)) { const v = g[k]; if (Array.isArray(v) && v.length && k !== 'zombies' && k !== 'players' && v[0] && typeof v[0] === 'object' && (v[0].pos || v[0].x !== undefined)) v.length = 0; }
    }, 16);
    const cam = g.camera;
    cam.position.set = function () { return this; };
    cam.lookAt = function () {};
    const f = { x: fx, y: 0.9, z: fz };
    let cp;
    if (view === 'frontal') cp = { x: fx, y: 0.95, z: fz - d };
    else if (view === 'lateral') cp = { x: fx + d, y: 0.95, z: fz };
    else if (view === 'back') cp = { x: fx, y: 0.95, z: fz + d };
    else cp = { x: fx + d * 0.8, y: 0.95 + 0.7, z: fz - d * 0.45 };
    cam.position.x = cp.x; cam.position.y = cp.y; cam.position.z = cp.z;
    Object.getPrototypeOf(Object.getPrototypeOf(cam)).lookAt.call(cam, f.x, f.y, f.z);
    g.scene.traverse((o) => { if (o.isMesh && !o.userData.__studio && o !== g.B.mesh && o !== g.G.mesh) o.visible = false; });
    if (!window.__studio) {
      const C = g.scene.children.find((o) => o.isInstancedMesh)?.geometry.constructor;
      const anyMesh = g.scene.children.find((o) => o.isInstancedMesh);
      const Mesh = Object.getPrototypeOf(anyMesh.constructor.prototype).constructor;
      const floorGeo = new C(60, 0.1, 60);
      const mat = anyMesh.material.clone(); mat.color && mat.color.setHex(0x3a4250); mat.vertexColors = false;
      const floor = new Mesh(floorGeo, mat); floor.position.y = -0.05; floor.userData.__studio = true; g.scene.add(floor);
      const L = g.scene.children.find((o) => o.isDirectionalLight || o.isHemisphereLight);
      if (L) { const l2 = L.clone(); l2.intensity = (L.intensity || 1) * 1.2; l2.position.set(-8, 12, 10); g.scene.add(l2); }
      window.__studio = floor;
    }
    window.__studio.position.x = fx; window.__studio.position.z = fz; window.__studio.visible = true;
    document.querySelectorAll('#hud, .hud, #ui > *:not(canvas), .toast, .notify').forEach((e) => (e.style.visibility = 'hidden'));
    return { ok: true, name: z.def?.name || 'nv_pirate', view };
  }, { view, d });

for (const view of ['frontal', 'lateral', 'back', 'perspective']) {
  const info = await setupStatic(view);
  if (info.ok) await page.waitForTimeout(1300);
  if (info.ok) await page.screenshot({ path: path.join(OUT, view + '.png') });
  console.log(JSON.stringify({ view, ok: info.ok, name: info.name, errors }));
}

// Gameplay print: zombie walking in the arena near the player, camera third person.
{
  const info = await page.evaluate(() => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS.find((x) => x.id === 'naval'), [SURVIVORS[0]], 'solo');
    g.debugGod = true;
    const p = g.players[0];
    for (const z of g.zombies) z.alive = false;
    const z = g.spawnZombie('nv_pirate', p.pos.x + 5, p.pos.z);
    if (!z) return { ok: false };
    g.spawnT = 999;
    clearInterval(window.__hold2);
    window.__hold2 = setInterval(() => { z.hp = 9999; z.stateT = 0; }, 16);
    const cam = g.camera;
    cam.position.set = function () { return this; };
    cam.lookAt = function () {};
    cam.position.x = p.pos.x - 0.4; cam.position.y = 0.9 + 0.5; cam.position.z = p.pos.z;
    const f = { x: z.pos.x, y: 0.9, z: z.pos.z };
    Object.getPrototypeOf(Object.getPrototypeOf(cam)).lookAt.call(cam, f.x, f.y, f.z);
    document.querySelectorAll('#hud, .hud, #ui > *:not(canvas), .toast, .notify').forEach((e) => (e.style.visibility = 'hidden'));
    return { ok: true, name: z.def?.name || 'nv_pirate' };
  });
  if (info.ok) await page.waitForTimeout(1300);
  if (info.ok) await page.screenshot({ path: path.join(OUT, 'gameplay.png') });
  console.log(JSON.stringify({ view: 'gameplay', ok: info.ok, name: info.name, errors }));
}
await b.close();
