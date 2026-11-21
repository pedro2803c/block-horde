import assert from 'node:assert/strict';
import { SCENERY } from '../src/scenery.js';

const ids = ['roman_lever', 'roman_gate', 'roman_platform', 'roman_elevator', 'roman_portal'];
for (const id of ids) {
  assert.ok(SCENERY[id], `${id}: registrado no cenário`);
  assert.ok(SCENERY[id].model, `${id}: modelo 3D`);
}
console.log('✓ 5 elementos interativos romanos registrados com modelo');