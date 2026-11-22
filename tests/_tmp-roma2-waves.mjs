// TEMPORARIO - mede estreia/exclusividade da Etapa 2 replicando Game.buildWave. Apagar depois.
import { ENEMIES, ENEMY_ORDER, ARENAS } from '../src/data.js';

const R4 = ['rm_praetor', 'rm_beast', 'rm_spirit', 'rm_standard'];

function buildWave(w, arenaId) {
  const n = Math.round(6 + w * 4);
  const list = [];
  const here = (t) => !ENEMIES[t].only || ENEMIES[t].only.includes(arenaId);
  const pool = ENEMY_ORDER.filter((t) => !ENEMIES[t].boss && ENEMIES[t].from <= w && here(t)).map((t) => {
    const d = ENEMIES[t];
    const grow = Math.min(2, 1 + (w - d.from) * 0.12);
    return [t, t === 'walker' ? Math.max(3.5, d.weight - w * 0.45) : d.weight * grow];
  });
  const total = pool.reduce((a, [, wt]) => a + wt, 0);
  for (let k = 0; k < n; k++) {
    let r = Math.random() * total;
    let t = 'walker';
    for (const [id, wt] of pool) { r -= wt; if (r <= 0) { t = id; break; } }
    list.push(t);
    const gr = ENEMIES[t].group || 1;
    for (let g = 1; g < gr && k + 1 < n; g++, k++) list.push(t);
  }
  for (const t of ENEMY_ORDER) if (ENEMIES[t].from === w && !ENEMIES[t].boss && here(t) && !list.includes(t)) list.splice(Math.floor(list.length * 0.3), 0, t);
  const bs = ARENAS.find((a) => a.id === arenaId).boss;
  if (w % 5 === 0) list.splice(Math.floor(list.length * 0.6), 0, Array.isArray(bs) ? bs[(w / 5 - 1) % bs.length] : bs || 'boss');
  return list;
}

const estreia = {}, garantia = {}, media = {};
for (const t of R4) {
  let first = 99; const counts = [];
  for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 12; wv++) { const n = buildWave(wv, 'coliseu').filter((x) => x === t).length; if (n && wv < first) first = wv; }
  for (let wv = 1; wv <= 12; wv++) { let s = 0; for (let k = 0; k < 30; k++) s += buildWave(wv, 'coliseu').filter((x) => x === t).length; counts.push(+(s / 30).toFixed(2)); }
  estreia[t] = first; media[t] = counts;
  let ok = 0; for (let k = 0; k < 20; k++) if (buildWave(ENEMIES[t].from, 'coliseu').includes(t)) ok++;
  garantia[t] = `${ok}/20`;
}
const fora = [];
for (const a of ARENAS) {
  if (a.id === 'coliseu') continue;
  const seen = new Set();
  for (let k = 0; k < 30; k++) for (let wv = 1; wv <= 12; wv++) buildWave(wv, a.id).forEach((t) => seen.add(t));
  const bad = R4.filter((t) => seen.has(t)); if (bad.length) fora.push([a.id, bad]);
}
console.log(JSON.stringify({ from: Object.fromEntries(R4.map((t) => [t, ENEMIES[t].from])), only: Object.fromEntries(R4.map((t) => [t, ENEMIES[t].only])), estreia, garantia, media, fora, ordem: R4.map((t) => ENEMY_ORDER.indexOf(t)) }, null, 2));
