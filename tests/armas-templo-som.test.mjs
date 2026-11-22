// Templo Antigo: verificação objetiva dos 10 sons das armas (audíveis, sem clipping e distintos entre si).
// Uso: npm run test:armas-templo-som   (sobe o vite dev com o src/ atual)
// Resultado: tests/resultado-armas-som.json
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 6200 + Math.floor(Math.random() * 200);
const pr = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
const url = `http://localhost:${port}/`;
for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch { /* subindo */ } await sleep(500); }

const ARMAS = {
  pharaoh: 'eg_royal', anubis_shotgun: 'eg_judgment', scarab_smg: 'eg_scarab_gun', sobek_launcher: 'eg_river',
  sphinx_drill: 'eg_sphinx', desert_bow: 'eg_bow', bastet_staff: 'eg_shadow', priest_staff: 'eg_curse',
  horus_spear: 'eg_divine', mummy_blade: 'eg_sand_blade',
};
const BANDAS = [80, 120, 180, 270, 400, 600, 900, 1300, 1900, 2800, 4000, 6000];

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 640, height: 360 } });
await ctx.addInitScript(() => localStorage.setItem('blockhorde_tutorial_v1', '1'));
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
let R;
try {
  await p.goto(url + '?test');
  await p.waitForFunction(() => window.__bh && document.body.innerText.includes('Jogar agora'), null, { timeout: 120000 });
  R = await p.evaluate(async ({ ARMAS, BANDAS }) => {
  const g = __bh;
  const SR = 44100;
  const goertzel = (d, f, n) => {
    const w = 2 * Math.PI * f / SR;
    const c = 2 * Math.cos(w);
    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < n; i++) {
      const hann = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1));
      s0 = d[i] * hann + c * s1 - s2; s2 = s1; s1 = s0;
    }
    return Math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) / n;
  };
  const medir = (buf) => {
    const d = buf.getChannelData(0);
    let peak = 0, soma = 0;
    for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; soma += d[i] * d[i]; }
    // janela mais forte (2048 amostras, passo 1024) para o timbre
    let best = 0, bestI = 0;
    for (let i = 0; i + 2048 <= d.length; i += 1024) {
      let e = 0; for (let k = 0; k < 2048; k++) e += d[i + k] * d[i + k];
      if (e > best) { best = e; bestI = i; }
    }
    const win = d.subarray(bestI, bestI + 2048);
    const bands = BANDAS.map((f) => goertzel(win, f, 2048));
    const norm = Math.hypot(...bands) || 1;
    return { dur: +buf.duration.toFixed(3), peak: +peak.toFixed(3), rms: +Math.sqrt(soma / d.length).toFixed(4), bands: bands.map((v) => +(v / norm).toFixed(4)), win: bestI / SR };
  };
  const sons = {};
  for (const [id, nome] of Object.entries(ARMAS)) {
    const buf = g.audio.buffers[nome];
    sons[id] = buf ? { nome, ...medir(buf) } : { nome, ausente: true };
  }
  // cada arma dispara e pede o próprio som
  const tocados = [];
  const op = g.audio.play.bind(g.audio);
  g.audio.play = (n, o) => { tocados.push(n); return op(n, o); };
  const { ARENAS, SURVIVORS } = __bhTest;
  g.startMatch(ARENAS.find((a) => a.id === 'templo'), [SURVIVORS[0]], 'solo');
  g.state = 'playing'; g.toSpawn = []; g.waveState = 'intermission'; g.waveT = 9999;
  const pl = g.players[0];
  const usado = {};
  for (const id of Object.keys(ARMAS)) {
    pl.ammo[id] = 99; pl.clip[id] = 99; pl.weapon = id; pl.fireCd = 0; pl.reloadT = 0;
    tocados.length = 0;
    g.fire(pl);
    usado[id] = tocados.includes(ARMAS[id]);
  }
  return { sons, usado };
  }, { ARMAS, BANDAS });
} finally {
  await b.close();
  pr.kill();
}

const nomes = Object.keys(ARMAS);
const falhas = [];
for (const id of nomes) {
  const s = R.sons[id];
  if (s.ausente) { falhas.push(`${id}: som ausente`); continue; }
  if (!(s.dur >= 0.2 && s.dur <= 1.0)) falhas.push(`${id}: duração ${s.dur}s fora de 0,2–1,0`);
  if (s.peak < 0.05) falhas.push(`${id}: volume de pico baixo (${s.peak})`);
  if (s.rms < 0.005) falhas.push(`${id}: RMS baixo (${s.rms})`);
  if (s.peak > 1.0) falhas.push(`${id}: clipping (pico ${s.peak})`);
  if (!R.usado[id]) falhas.push(`${id}: não pediu o som ${ARMAS[id]} ao disparar`);
}
const sim = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
let maxPar = '', maxSim = 0;
const presentes = nomes.filter((id) => !R.sons[id].ausente);
for (let i = 0; i < presentes.length; i++) for (let j = i + 1; j < presentes.length; j++) {
  const s = sim(R.sons[presentes[i]].bands, R.sons[presentes[j]].bands);
  if (s > maxSim) { maxSim = s; maxPar = `${presentes[i]} × ${presentes[j]}`; }
}
if (maxSim >= 0.995) falhas.push(`sons iguais: ${maxPar} (semelhança ${maxSim.toFixed(3)})`);
if (erros.length) falhas.push('erros de JavaScript: ' + erros.join(' | '));

const out = { data: new Date().toISOString(), armas: R.sons, usado: R.usado, semelhancaMaxima: { par: maxPar, valor: +maxSim.toFixed(4) }, falhas };
fs.writeFileSync(path.join(ROOT, 'tests', 'resultado-armas-som.json'), JSON.stringify(out, null, 2));
for (const id of nomes) {
  const s = R.sons[id];
  console.log(`${falhas.some((f) => f.startsWith(id + ':')) ? '✗' : '✓'} ${id.padEnd(15)} ${s.nome.padEnd(15)} ${s.dur}s pico ${s.peak} rms ${s.rms}`);
}
console.log(`\nSom mais parecido: ${maxPar} (${maxSim.toFixed(3)})`);
console.log(falhas.length ? `\n${falhas.length} falha(s):\n- ${falhas.join('\n- ')}` : `\n10/10 sons audíveis, sem clipping e distintos`);
process.exit(falhas.length ? 1 : 0);
