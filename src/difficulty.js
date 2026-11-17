// Dificuldade escolhida pelo jogador: UM lugar com todos os multiplicadores.
// Cada multiplicador é aplicado em um único ponto do código (ver comentários) para não duplicar.
// Ela se soma à dificuldade própria de cada arena (arena.diff), que é outra camada.
export const DIFFICULTIES = [
  {
    id: 'easy', name: 'Fácil', title: 'Explorador', color: '#2ecc71', icon: 'heart',
    desc: 'Para conhecer as arenas e as armas com calma.',
    mul: { enemyHp: 0.7, enemyDmg: 0.6, enemySpeed: 0.88, aggression: 1.3, spawnRate: 0.75, count: 0.75, aliveCap: 0.7, bossHp: 0.65, resources: 1.4, xp: 0.75 },
  },
  {
    id: 'normal', name: 'Normal', title: 'Sobrevivente', color: '#29b6f6', icon: 'shield',
    desc: 'A experiência pensada para o Block Horde.',
    mul: { enemyHp: 1, enemyDmg: 1, enemySpeed: 1, aggression: 1, spawnRate: 1, count: 1, aliveCap: 1, bossHp: 1, resources: 1, xp: 1 },
  },
  {
    id: 'hard', name: 'Difícil', title: 'Guerreiro', color: '#ffc107', icon: 'fist',
    desc: 'Hordas maiores e mais rápidas. Munição e cura ficam raras.',
    mul: { enemyHp: 1.3, enemyDmg: 1.35, enemySpeed: 1.1, aggression: 0.85, spawnRate: 1.25, count: 1.25, aliveCap: 1.2, bossHp: 1.4, resources: 0.75, xp: 1.3 },
  },
  {
    id: 'insane', name: 'Insano', title: 'Pesadelo', color: '#e53935', icon: 'skull',
    desc: 'Cada erro custa caro. Só para quem domina o jogo.',
    mul: { enemyHp: 1.7, enemyDmg: 1.8, enemySpeed: 1.2, aggression: 0.7, spawnRate: 1.5, count: 1.5, aliveCap: 1.4, bossHp: 2, resources: 0.5, xp: 1.75 },
  },
];
export const DIFF_BY_ID = Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d]));
export const diffOf = (id) => DIFF_BY_ID[id] || DIFF_BY_ID.normal;

// o que cada multiplicador faz, para mostrar no cartão (valores reais, não só visual)
export const DIFF_ROWS = [
  ['enemyHp', 'Vida dos inimigos', 'pct'],
  ['enemyDmg', 'Dano recebido', 'pct'],
  ['enemySpeed', 'Velocidade dos inimigos', 'pct'],
  ['aggression', 'Intervalo entre ataques', 'pct'],
  ['count', 'Inimigos por onda', 'pct'],
  ['spawnRate', 'Ritmo de aparecimento', 'pct'],
  ['bossHp', 'Resistência dos chefes', 'pct'],
  ['resources', 'Itens e munição no mapa', 'pct'],
  ['xp', 'Experiência ganha', 'pct'],
];
export const fmtMul = (v) => (v === 1 ? 'padrão' : `${v > 1 ? '+' : '−'}${Math.round(Math.abs(v - 1) * 100)}%`);
