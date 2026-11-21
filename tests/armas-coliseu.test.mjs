import assert from 'node:assert/strict';
import { COLISEUM_WEAPONS, WEAPONS, WEAPON_ORDER, UNLOCKS } from '../src/data.js';
import { GUN_LEN, GUN_MODELS, ITEMS } from '../src/items.js';
import { SOUND_NAMES } from '../src/core/Audio.js';

assert.equal(COLISEUM_WEAPONS.length, 10, 'a ficha deve conter dez armas');
assert.equal(new Set(COLISEUM_WEAPONS).size, 10, 'os ids das armas devem ser únicos');
for (const id of COLISEUM_WEAPONS) {
  const w = WEAPONS[id];
  assert.ok(w, `${id}: definição de combate`);
  assert.ok(WEAPON_ORDER.includes(id), `${id}: seleção/troca de arma`);
  assert.ok(GUN_MODELS[id]?.length >= 3, `${id}: modelo 3D próprio`);
  assert.ok(GUN_LEN[id] > 0, `${id}: encaixe e comprimento calculados`);
  assert.equal(ITEMS[id]?.weapon, id, `${id}: catálogo e inventário`);
  assert.ok(SOUND_NAMES.includes(w.sound), `${id}: som próprio (${w.sound})`);
  assert.ok(w.special?.id && w.special?.name, `${id}: habilidade especial`);
  const unlock = UNLOCKS.find((u) => u.weapon === id);
  assert.ok(unlock, `${id}: desbloqueio por progressão`);
  assert.deepEqual(unlock.only, ['coliseu'], `${id}: restrita ao Coliseu`);
  for (const field of ['dmg', 'rate']) assert.ok(Number.isFinite(w[field]) && w[field] > 0, `${id}: ${field} configurável`);
  if (w.mag) assert.ok(Number.isFinite(w.reload) && w.reload > 0, `${id}: recarga configurável`);
}
console.log('✓ 10 armas do Coliseu: dados, modelos, áudio, catálogo, troca, habilidades e desbloqueio exclusivo');