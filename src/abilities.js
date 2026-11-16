import { platform } from './platform.js';
// Sistema de habilidades do Block Horde: 8 ativas, 10 passivas (5 níveis), 3 ultimates,
// árvore com 4 especializações, builds prontas e interações entre habilidades.
//
// Progressão dentro da partida: abates dão XP → cada nível dá 1 ponto → pontos compram níveis
// de passivas e a ultimate na árvore (Tab). Equipamento (3 ativas + 1 ultimate) é escolhido no menu.

// ---------------------------------------------------------------- ativas (3 espaços)
export const ACTIVES = {
  dash: { n: 1, name: 'Investida', icon: 'dash', cd: 8, color: '#3ab0ff', desc: 'Avança 5,5 m num instante, atropelando zumbis (30 de dano). Invulnerável durante o avanço.' },
  shield: { n: 2, name: 'Escudo tático', icon: 'hexShield', cd: 15, dur: 3, color: '#4fd0ff', desc: 'Barreira de energia por 3 s: bloqueia todo dano e destrói projéteis próximos.' },
  sgrenade: { n: 3, name: 'Granada especial', icon: 'sgrenade', cd: 12, color: '#9adcff', desc: 'Explosivo de alto impacto: 180 de dano em 4,5 m.' },
  turret: { n: 4, name: 'Torre automática', icon: 'turret', cd: 20, dur: 14, color: '#c8ccd4', desc: 'Implanta uma torre que atira sozinha nos inimigos a até 9 m por 14 s.' },
  kit: { n: 5, name: 'Kit de suporte', icon: 'medkit', cd: 30, dur: 5, color: '#60ff80', desc: 'Cura 45 de vida em 5 s, sua e de aliados a até 5 m.' },
  drone: { n: 6, name: 'Drone de ataque', icon: 'drone', cd: 25, dur: 15, color: '#ff5060', desc: 'Drone que persegue e metralha inimigos por 15 s.' },
  cloak: { n: 7, name: 'Camuflagem', icon: 'ghost', cd: 18, dur: 4.5, color: '#3ce0ff', desc: 'Invisível por 4,5 s: os inimigos perdem você de vista.' },
  efield: { n: 8, name: 'Campo elétrico', icon: 'bolt', cd: 22, dur: 6, color: '#7ab8ff', desc: 'Domo elétrico por 6 s: 28 de dano por segundo e −35% de velocidade em quem está perto.' },
};
export const ACTIVE_ORDER = Object.keys(ACTIVES);

// ---------------------------------------------------------------- ultimates (1 espaço, liberada na árvore)
export const ULTIMATES = {
  bombard: { n: 19, name: 'Bombardeio', icon: 'bomb', cd: 60, color: '#ff8a2a', desc: 'Ataque aéreo onde você mira: 12 explosões numa área de 6 m. Ótimo contra chefões.' },
  fury: { n: 20, name: 'Fúria total', icon: 'flame', cd: 45, dur: 10, color: '#ff5a1a', desc: 'Por 10 s: +60% de dano, −50% de dano recebido, +30% de velocidade e cadência.' },
  haven: { n: 21, name: 'Campo de sobrevivência', icon: 'dome', cd: 90, dur: 10, color: '#4fa8ff', desc: 'Domo de 5 m por 10 s: aliados dentro recebem −60% de dano e regeneram 6 de vida/s.' },
};
export const ULT_ORDER = Object.keys(ULTIMATES);

// ---------------------------------------------------------------- passivas (5 níveis)
// v(n): valor do bônus no nível n · fmt: texto do efeito
export const PASSIVES = {
  vitality: { n: 9, name: 'Vitalidade', icon: 'heart', v: (n) => 15 * n, fmt: (x) => `+${x} de vida máxima` },
  armor: { n: 10, name: 'Blindagem', icon: 'shield', v: (n) => 5 * n, fmt: (x) => `−${x}% de dano recebido` },
  ammo: { n: 11, name: 'Munição extra', icon: 'ammo', v: (n) => 15 * n, fmt: (x) => `+${x}% de munição coletada` },
  agility: { n: 12, name: 'Agilidade', icon: 'run', v: (n) => 5 * n, fmt: (x) => `+${x}% de velocidade` },
  precision: { n: 13, name: 'Precisão', icon: 'target', v: (n) => 12 * n, fmt: (x) => `−${x}% de dispersão` },
  cooldown: { n: 14, name: 'Recarga rápida', icon: 'refresh', v: (n) => 8 * n, fmt: (x) => `−${x}% de recarga das habilidades` },
  damage: { n: 15, name: 'Dano aumentado', icon: 'burst', v: (n) => 8 * n, fmt: (x) => `+${x}% de dano` },
  multishot: { n: 16, name: 'Multitiro', icon: 'multishot', v: (n) => 7 * n, fmt: (x) => `${x}% de chance de tiro extra` },
  crit: { n: 17, name: 'Crítico', icon: 'star', v: (n) => 5 * n, fmt: (x) => `${x}% de chance de dano dobrado` },
  regen: { n: 18, name: 'Regeneração', icon: 'regen', v: (n) => 0.6 * n, fmt: (x) => `+${x.toFixed(1)} de vida por segundo` },
};
export const MAX_LEVEL = 5;
export const levelCost = (next) => Math.ceil(next / 2); // 1, 1, 2, 2, 3 pontos

// ---------------------------------------------------------------- árvore: 4 especializações
// cada ramo é uma sequência: o próximo nó exige o anterior no nível 2
export const BRANCHES = [
  { id: 'assault', name: 'Assalto', tag: 'Ofensivo', color: '#ff5a4e', icon: 'burst', desc: 'Dano elevado e combate direto.', nodes: ['damage', 'crit', 'multishot'] },
  { id: 'defense', name: 'Defesa', tag: 'Resistência', color: '#4fa8ff', icon: 'shield', desc: 'Mais proteção e sobrevivência.', nodes: ['vitality', 'armor'] },
  { id: 'support', name: 'Suporte', tag: 'Cooperativo', color: '#60ff80', icon: 'medkit', desc: 'Cura, munição e sustentação do time.', nodes: ['regen', 'ammo'] },
  { id: 'mobility', name: 'Mobilidade', tag: 'Velocidade', color: '#ffc93a', icon: 'run', desc: 'Velocidade, precisão e posicionamento.', nodes: ['agility', 'precision', 'cooldown'] },
];
export const NODE_REQ = 2; // nível do nó anterior para liberar o próximo
export const ULT_REQ = { level: 5, cost: 2 }; // ultimate: nível 5 do personagem e 2 pontos

// ---------------------------------------------------------------- builds prontas
export const BUILDS = [
  { id: 'assault', name: 'Assalto', kind: 'Especialização', actives: ['dash', 'sgrenade', 'drone'], ult: 'fury', passives: ['damage', 'crit', 'ammo'], desc: 'Dano, crítico e munição.' },
  { id: 'defense', name: 'Defesa', kind: 'Especialização', actives: ['shield', 'turret', 'efield'], ult: 'haven', passives: ['armor', 'vitality'], desc: 'Blindagem, vitalidade e escudo.' },
  { id: 'support', name: 'Suporte', kind: 'Especialização', actives: ['kit', 'turret', 'shield'], ult: 'haven', passives: ['regen', 'ammo'], desc: 'Regeneração, kit e campo de sobrevivência.' },
  { id: 'mobility', name: 'Mobilidade', kind: 'Especialização', actives: ['dash', 'cloak', 'efield'], ult: 'bombard', passives: ['agility', 'precision', 'cooldown'], desc: 'Agilidade, investida e camuflagem.' },
  { id: 'hunter', name: 'Caçador', kind: 'Combinação', actives: ['dash', 'drone', 'sgrenade'], ult: 'bombard', passives: ['precision', 'damage'], desc: 'Investida + Precisão + Dano aumentado: velocidade, precisão e alto dano.' },
  { id: 'protector', name: 'Protetor', kind: 'Combinação', actives: ['shield', 'kit', 'turret'], ult: 'haven', passives: ['armor', 'regen'], desc: 'Escudo + Kit de suporte + Campo de sobrevivência: defesa e proteção coletiva.' },
  { id: 'destroyer', name: 'Destruidor', kind: 'Combinação', actives: ['sgrenade', 'efield', 'turret'], ult: 'fury', passives: ['ammo', 'multishot'], desc: 'Munição extra + Multitiro + Fúria total: máximo poder de eliminação.' },
];

// ---------------------------------------------------------------- interações entre habilidades
export const SYNERGIES = [
  { a: 'sgrenade', b: 'efield', name: 'Explosão elétrica', desc: 'Granada especial que explode dentro de um Campo elétrico (seu ou do parceiro): raio maior e raios em cadeia que atordoam até 8 inimigos.' },
  { a: 'dash', b: 'shield', name: 'Aríete', desc: 'Investida com o Escudo tático ativo: dano e empurrão dobrados.' },
];

// ---------------------------------------------------------------- XP e equipamento salvo
export const xpNeed = (level) => 80 + 50 * (level - 1);
export const DEFAULT_LOADOUT = { actives: ['dash', 'shield', 'sgrenade'], ult: 'bombard' };
const KEY = 'blockhorde_loadout_v1';
export function loadLoadouts() {
  let out;
  try {
    out = JSON.parse(platform.getItem(KEY) || 'null');
  } catch {
    out = null;
  }
  const ok = (l) => l && Array.isArray(l.actives) && l.actives.length === 3 && l.actives.every((a) => ACTIVES[a]) && ULTIMATES[l.ult];
  return [0, 1].map((k) => (ok(out?.[k]) ? out[k] : { ...DEFAULT_LOADOUT, actives: [...DEFAULT_LOADOUT.actives] }));
}
export function saveLoadouts(list) {
  try {
    platform.setItem(KEY, JSON.stringify(list));
  } catch {
    /* sem armazenamento */
  }
}
// teclas das habilidades: [ativa 1, ativa 2, ativa 3, ultimate]
export const ABILITY_KEYS = {
  solo: [['KeyZ'], ['KeyX'], ['KeyC'], ['KeyR']],
  p1: [['KeyZ'], ['KeyX'], ['KeyC'], ['KeyR']],
  p2: [['KeyU', 'Numpad4'], ['KeyI', 'Numpad5'], ['KeyO', 'Numpad6'], ['KeyJ', 'Numpad8']],
};
export const ABILITY_LABELS = { solo: ['Z', 'X', 'C', 'R'], p1: ['Z', 'X', 'C', 'R'], p2: ['U', 'I', 'O', 'J'] };
