// Print individual de cada mob naval (close-up, câmera fixa). Uso: vite preview --port 4173 e node scripts/prints-mobs-navais.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('prints/mobs-navais');
fs.mkdirSync(OUT, { recursive: true });
const MOBS = [
  ['nv_pirate', '01-pirata-afogado'], ['nv_crab', '02-caranguejo-colossal'], ['nv_harpooner', '03-arpoador-amaldicoado'],
  ['nv_octopus', '04-polvo-abissal'], ['nv_ghost', '05-marinheiro-fantasma'], ['nv_angler', '06-peixe-lanterna-abissal'],
  ['nv_brute', '07-brutamontes-do-naufragio'], ['nv_shark', '08-tubarao-abissal'], ['nv_serpent', '09-serpente-das-profundezas'],
  ['nv_mimic', '10-bau-devorador'],
];
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:4173/?test', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__bh && window.__bh.state === 'menu', null, { timeout: 60000 });
const report = [];
for (const [type, file] of MOBS) {
  const info = await page.evaluate((type) => {
    const g = window.__bh; const { ARENAS, SURVIVORS } = window.__bhTest;
    g.startMatch(ARENAS.find((x) => x.id === 'naval'), [SURVIVORS[0]], 'solo');
    g.debugGod = true;
    const p = g.players[0];
    for (const z of g.zombies) z.alive = false;
    const sx = p.pos.x, sz = p.pos.z; p.pos.x += 25; const z = g.spawnZombie(type, sx, sz);
    if (!z) return { ok: false };
    const fx = z.pos.x, fz = z.pos.z;
    clearInterval(window.__hold);
    window.__hold = setInterval(() => { z.pos.x = fx; z.pos.z = fz; z.hp = z.maxHp || 9999; g.spawnT = 999; for (const o of g.zombies) if (o !== z) o.alive = false; for (const k of Object.keys(g)) { const v = g[k]; if (Array.isArray(v) && v.length && k !== 'zombies' && k !== 'players' && v[0] && typeof v[0] === 'object' && (v[0].pos || v[0].x !== undefined)) v.length = 0; } }, 16);
    const cam = g.camera;
    cam.position.set = function () { return this; };
    cam.lookAt = function () {};
    const s = (z.scale || z.def?.scale || 1);
    const FR = { nv_pirate: [5, 1.0], nv_crab: [6.5, 0.6], nv_harpooner: [6, 1.1], nv_octopus: [6.5, 1.1], nv_ghost: [6.5, 2.6], nv_angler: [6, 1.0], nv_brute: [8, 1.5], nv_shark: [7.5, 0.9], nv_serpent: [8.5, 1.0], nv_mimic: [5, 0.6] }; const [dd, ty] = FR[type] || [6, 1]; const d = dd * s;
    cam.position.x = fx + d * 0.8; cam.position.y = ty * s + d * 0.38; cam.position.z = fz + d * 0.6;
    Object.getPrototypeOf(Object.getPrototypeOf(cam)).lookAt.call(cam, fx, ty * s, fz);
    const T = window.__bhTest.THREE || g.scene.constructor && null;
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
    return { ok: true, name: z.def?.name || z.name || type, custom: !!z.mesh };
  }, type);
  await page.waitForTimeout(1500);
  if (info.ok) await page.screenshot({ path: path.join(OUT, file + '.png') });
  report.push({ type, file, ...info });
}
console.log(JSON.stringify({ report, errors }, null, 2));
await b.close();






