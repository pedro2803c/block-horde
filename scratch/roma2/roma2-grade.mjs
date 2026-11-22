// Grade temporaria dos 4 romanos da Etapa 2 (Character). Nao faz parte dos testes.
// Uso: node scratch/roma2/roma2-grade.mjs
// Gera frente.png, lado.png, ataque.png e escala.png em scratch/roma2/.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'scratch', 'roma2');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const port = 6100 + Math.floor(Math.random() * 300);
const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
const url = `http://localhost:${port}/`;
for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch { /* subindo */ } await sleep(500); }

const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ locale: 'pt-BR', viewport: { width: 1180, height: 520 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
await p.goto(url + '?test');
await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 60000 });

await p.evaluate(async () => {
  window.__m = await import('/src/monsters.js');
  window.__pv = __bh.ui.getPreview();
  const TYPES = ['rm_praetor', 'rm_beast', 'rm_spirit', 'rm_standard'];
  window.__TYPES = TYPES;
  // enquadramento de vitrine (nao e a escala de jogo)
  window.__FIT = { rm_praetor: 0.92, rm_beast: 1.0, rm_spirit: 0.85, rm_standard: 0.55 };

  window.__drawCell = (canvas, type, angle, pose) => {
    const pv = window.__pv;
    const def = __bhTest.ENEMIES[type];
    const z = {
      type, def, look: window.__m.enemyLook(type), pos: { x: 0, y: 0, z: 0 }, facing: angle,
      scale: pose.scale, walk: pose.walk ?? 0.9, hurtT: 0, attackT: pose.attackT ?? 0,
      state: pose.state ?? 'move', stateT: 0, alive: true, rise: 0, flyY: def.fly ? 1.35 : undefined,
    };
    pv.B.begin(); pv.G.begin();
    window.__m.drawEnemy(pv.B, pv.G, z, pose.t ?? 1.3);
    pv.B.end(); pv.G.end();
    pv.renderer.render(pv.scene, pv.camera);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(pv.renderer.domElement, 0, 0, canvas.width, canvas.height);
  };

  window.__sheet = (kind) => {
    const wrap = document.createElement('div');
    wrap.className = 'bh2-sheet';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99;background:#e8d8b0;display:flex; align-items:center; justify-content:center; gap:14px; padding:10px';
    const poses = {
      frente: { angle: 0.12, pose: { state: 'move', walk: 0.9 } },
      lado: { angle: Math.PI / 2 + 0.12, pose: { state: 'move', walk: 0.9 } },
      ataque: { angle: 0.18, pose: null },
    };
    for (const t of window.__TYPES) {
      const base = poses[kind] || poses.frente;
      let pose;
      if (kind === 'ataque') {
        pose = t === 'rm_praetor' ? { state: 'cast', attackT: 0.35, walk: 0 }
          : t === 'rm_beast' ? { state: 'lunge', walk: 3.4 }
            : t === 'rm_spirit' ? { state: 'move', attackT: 0.35, walk: 1.2 }
              : { state: 'cast', walk: 0 };
      } else pose = { ...base.pose };
      pose.scale = window.__FIT[t];
      if (kind === 'lado') pose.scale = { rm_praetor: 0.95, rm_beast: 0.8, rm_spirit: 0.8, rm_standard: 0.52 }[t];
      pose.t = kind === 'ataque' ? 1.9 : 1.3;
      const cell = document.createElement('div');
      cell.style.cssText = 'display:flex;flex-direction:column;gap:6px';
      const c = document.createElement('canvas');
      c.width = 250;
      c.height = 320;
      c.style.cssText = 'width:250px;height:320px;background:#f4e6c4;outline:1px solid #c8b080';
      const n = document.createElement('div');
      n.textContent = t + (kind === 'ataque' ? (t === 'rm_praetor' ? ' (conjuracao)' : t === 'rm_beast' ? ' (bote)' : t === 'rm_spirit' ? ' (ataque)' : ' (idle)') : '');
      n.style.cssText = 'font:700 14px sans-serif;text-align:center;color:#3a2a10';
      cell.append(c, n);
      wrap.append(cell);
      window.__drawCell(c, t, base.angle, pose);
    }
    document.body.append(wrap);
    return wrap;
  };

  // escala real: os 4 com a escala do data.js + zumbi comum (1,0) como regua
  window.__escala = () => {
    const pv = window.__pv;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99;background:#e8d8b0;display:flex;align-items:center;justify-content:center';
    const c = document.createElement('canvas');
    c.width = 1000; c.height = 440;
    c.style.cssText = 'width:1000px;height:440px;background:#f4e6c4;outline:1px solid #c8b080';
    const cap = document.createElement('div');
    cap.textContent = 'escala de jogo (def.scale): walker 1,0 | praetor 1,1 | besta 1,15 | espirito 1,25 | estandarte 1,2';
    cap.style.cssText = 'position:absolute;bottom:4px;font:700 13px sans-serif;color:#3a2a10';
    wrap.append(c, cap);
    document.body.append(wrap);
    pv.renderer.setSize(1000, 440, false);
    pv.camera.aspect = 1000 / 440;
    pv.camera.updateProjectionMatrix();
    pv.camera.position.set(0, 1.75, 8.2);
    pv.camera.lookAt(0, 1.3, 0);
    pv.B.begin(); pv.G.begin();
    const row = [['walker', -2.7, 1], ['rm_praetor', -1.35, __bhTest.ENEMIES.rm_praetor.scale], ['rm_beast', 0, __bhTest.ENEMIES.rm_beast.scale], ['rm_spirit', 1.35, __bhTest.ENEMIES.rm_spirit.scale], ['rm_standard', 2.7, __bhTest.ENEMIES.rm_standard.scale]];
    for (const [t, x, sc] of row) {
      const def = __bhTest.ENEMIES[t];
      const z = { type: t, def, look: window.__m.enemyLook(t), pos: { x, y: 0, z: 0 }, facing: 0.12, scale: sc, walk: 0.9, hurtT: 0, attackT: 0, state: 'move', stateT: 0, alive: true, rise: 0, flyY: def.fly ? 1.35 : undefined };
      window.__m.drawEnemy(pv.B, pv.G, z, 1.3);
    }
    pv.B.end(); pv.G.end();
    pv.renderer.render(pv.scene, pv.camera);
    c.getContext('2d').drawImage(pv.renderer.domElement, 0, 0, c.width, c.height);
    pv.renderer.setSize(220, 280, false);
    pv.camera.aspect = 220 / 280;
    pv.camera.updateProjectionMatrix();
    pv.camera.position.set(0, 1.5, 3.8);
    pv.camera.lookAt(0, 1.0, 0);
    return wrap;
  };
});

for (const kind of ['frente', 'lado', 'ataque']) {
  const h = await p.evaluateHandle((k) => window.__sheet(k), kind);
  await p.waitForTimeout(200);
  await h.asElement().screenshot({ path: path.join(OUT, kind + '.png') });
  await p.evaluate(() => document.querySelector('.bh2-sheet').remove());
}
let h = await p.evaluateHandle(() => window.__escala());
await p.waitForTimeout(200);
await h.asElement().screenshot({ path: path.join(OUT, 'escala.png') });
await p.evaluate(() => document.querySelector('canvas').closest('div').remove());

console.log(errs.length ? 'ERROS:\n' + errs.join('\n') : 'sem erros de pagina');
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).join(', '));
await b.close();
pr.kill();
