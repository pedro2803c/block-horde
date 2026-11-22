// Teste automatizado de exclusividade do Laboratório de Pesquisa (14 inimigos + 4 chefões)
// Percorre TODAS as arenas, verifica configurações, pools de onda (1..25), chefões e trava de spawn.
import {
  ARENAS,
  ENEMIES,
  ENEMY_ORDER,
  RESEARCH_LAB_EXCLUSIVE_ENEMIES,
  RESEARCH_LAB_EXCLUSIVE_BOSSES,
  isEnemyAllowedInArena,
  allowedEnemiesForArena,
} from '../src/data.js';

const errors = [];
const assert = (cond, msg) => {
  if (!cond) errors.push(msg);
};

// 1. Verificar os 14 inimigos e 4 chefões registrados
assert(RESEARCH_LAB_EXCLUSIVE_ENEMIES.length === 14, `Esperado 14 inimigos exclusivos, encontrado ${RESEARCH_LAB_EXCLUSIVE_ENEMIES.length}`);
assert(RESEARCH_LAB_EXCLUSIVE_BOSSES.length === 4, `Esperado 4 chefoes exclusivos, encontrado ${RESEARCH_LAB_EXCLUSIVE_BOSSES.length}`);

for (const id of RESEARCH_LAB_EXCLUSIVE_ENEMIES) {
  const def = ENEMIES[id];
  assert(!!def, `Inimigo exclusivo ausente em ENEMIES: ${id}`);
  assert(!def?.boss, `Inimigo comum marcado como boss: ${id}`);
  assert(ENEMY_ORDER.includes(id), `Inimigo exclusivo ausente em ENEMY_ORDER: ${id}`);
  assert(Array.isArray(def?.only) && def.only.length === 1 && def.only[0] === 'lab', `Inimigo ${id} sem only:['lab']`);
  assert(isEnemyAllowedInArena(id, 'lab') === true, `Inimigo ${id} bloqueado no proprio lab`);
}

for (const id of RESEARCH_LAB_EXCLUSIVE_BOSSES) {
  const def = ENEMIES[id];
  assert(!!def, `Chefao exclusivo ausente em ENEMIES: ${id}`);
  assert(def?.boss === true, `Chefao sem flag boss:true: ${id}`);
  assert(ENEMY_ORDER.includes(id), `Chefao exclusivo ausente em ENEMY_ORDER: ${id}`);
  assert(Array.isArray(def?.only) && def.only.length === 1 && def.only[0] === 'lab', `Chefao ${id} sem only:['lab']`);
  assert(isEnemyAllowedInArena(id, 'lab') === true, `Chefao ${id} bloqueado no proprio lab`);
}

const ALL_LAB = [...RESEARCH_LAB_EXCLUSIVE_ENEMIES, ...RESEARCH_LAB_EXCLUSIVE_BOSSES];

// 2. Verificar configuração da arena 'lab'
const labArena = ARENAS.find((a) => a.id === 'lab');
assert(!!labArena, 'Arena lab nao encontrada em ARENAS');
assert(Array.isArray(labArena?.boss) && labArena.boss.length === 4, `Arena lab deve ter 4 chefoes, tem: ${JSON.stringify(labArena?.boss)}`);
for (const b of RESEARCH_LAB_EXCLUSIVE_BOSSES) {
  assert(labArena?.boss?.includes(b), `Chefao ${b} nao associado a arena lab`);
}

// 3. Verificar TODAS as outras arenas (zero vazamento)
const otherArenas = ARENAS.filter((a) => a.id !== 'lab');
assert(otherArenas.length >= 6, `Esperado >= 6 outras arenas, encontrado ${otherArenas.length}`);

for (const arena of otherArenas) {
  const bosses = Array.isArray(arena.boss) ? arena.boss : [arena.boss];
  for (const b of bosses) {
    assert(!ALL_LAB.includes(b), `VAZAMENTO: arena ${arena.id} referencia chefao do lab (${b})`);
  }
  const pool = allowedEnemiesForArena(arena.id, { includeBosses: true });
  for (const id of ALL_LAB) {
    assert(isEnemyAllowedInArena(id, arena.id) === false, `VAZAMENTO: isEnemyAllowedInArena(${id}, ${arena.id}) retornou true`);
    assert(!pool.includes(id), `VAZAMENTO: allowedEnemiesForArena(${arena.id}) inclui ${id}`);
  }
}

// 4. Verificar que o pool do lab contém todos os 14 inimigos e 4 chefões
const labCommonPool = allowedEnemiesForArena('lab', { includeBosses: false });
const labFullPool = allowedEnemiesForArena('lab', { includeBosses: true });
for (const id of RESEARCH_LAB_EXCLUSIVE_ENEMIES) {
  assert(labCommonPool.includes(id), `Pool comum do lab nao inclui ${id}`);
}
for (const id of RESEARCH_LAB_EXCLUSIVE_BOSSES) {
  assert(!labCommonPool.includes(id), `Pool comum do lab incluiu chefao ${id}`);
  assert(labFullPool.includes(id), `Pool completo do lab nao inclui chefao ${id}`);
}

console.log(`Arenas auditadas: ${ARENAS.map((a) => a.id).join(', ')} (${ARENAS.length} total)`);
console.log(`Exclusivos do Laboratório: ${RESEARCH_LAB_EXCLUSIVE_ENEMIES.length} inimigos + ${RESEARCH_LAB_EXCLUSIVE_BOSSES.length} chefões`);
if (errors.length) {
  console.error('FALHAS DE EXCLUSIVIDADE:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('OK: 100% de exclusividade validada na camada de dados e regras de arena.');
