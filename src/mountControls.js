// Block Horde — Controles de montarias (teclado configurável, controle e toque)
// Só define QUAIS teclas acionam as ações que as montarias já têm; não muda dano nem habilidades.
import { platform } from './platform.js';
import { ABILITY_KEYS } from './abilities.js';
import { MOUNTS, MOUNT_INFO } from './mounts.js';

const STORE_KEY = 'blockhorde.mountkeys.v1';

// ações de montaria. "slot" = índice da habilidade equivalente no controle/toque (mesmo botão das habilidades)
// fixed = mostrada mas não remapeada aqui (usa o comando geral do jogo)
export const MOUNT_ACTIONS = [
  { id: 'toggle',  name: 'Montar / desmontar',   icon: 'vehicle', pad: 'mount' },
  { id: 'fire',    name: 'Ataque principal',     icon: 'target',  fixed: true, pad: 'fire' },
  { id: 'heavy',   name: 'Ataque pesado',        icon: 'paw',     slot: 0, pad: 'ab0' },
  { id: 'dash',    name: 'Movimento especial',   icon: 'run',     slot: 1, pad: 'ab1' },
  { id: 'second',  name: 'Habilidade secundária', icon: 'burst',  slot: 2, pad: 'ab2' },
  { id: 'special', name: 'Habilidade especial',  icon: 'flame',   slot: 3, pad: 'ult' },
];
// "Acelerar" foi pedido, mas nenhuma montaria atual tem essa ação: não é exibido (regra: só ações reais)

export const MOUNT_DEFAULTS = {
  toggle: 'KeyV',
  heavy: ABILITY_KEYS.solo[0][0],
  dash: ABILITY_KEYS.solo[1][0],
  second: ABILITY_KEYS.solo[2][0],
  special: ABILITY_KEYS.solo[3][0],
};

// teclas reservadas pelo jogo (solo/J1) — uma ação de montaria não pode usar nenhuma delas
export const RESERVED = {
  KeyW: 'Mover', KeyA: 'Mover', KeyS: 'Mover', KeyD: 'Mover',
  Space: 'Atirar', KeyE: 'Próxima arma', KeyQ: 'Arma anterior', KeyF: 'Faca / machado', KeyG: 'Recarregar',
  KeyP: 'Pausar', Escape: 'Pausar', Tab: 'Árvore de habilidades',
  Digit1: 'Grupo de armas', Digit2: 'Grupo de armas', Digit3: 'Grupo de armas', Digit4: 'Grupo de armas', Digit5: 'Grupo de armas',
  Digit6: 'Grupo de armas', Digit7: 'Grupo de armas', Digit8: 'Grupo de armas', Digit9: 'Grupo de armas', Digit0: 'Grupo de armas', Minus: 'Grupo de armas',
};
const ABILITY_NAMES = ['Habilidade 1', 'Habilidade 2', 'Habilidade 3', 'Ultimate'];

export function loadMountKeys() {
  let saved = {};
  try {
    saved = JSON.parse(platform.getItem(STORE_KEY) || '{}') || {};
  } catch {
    saved = {};
  }
  const out = { ...MOUNT_DEFAULTS };
  for (const k of Object.keys(MOUNT_DEFAULTS)) if (typeof saved[k] === 'string' && saved[k]) out[k] = saved[k];
  // configuração salva inválida (ex.: editada à mão): volta ao padrão
  return checkAll(out).length ? { ...MOUNT_DEFAULTS } : out;
}
export function saveMountKeys(keys) {
  try {
    platform.setItem(STORE_KEY, JSON.stringify(keys));
  } catch {
    /* sem armazenamento */
  }
}

// conflito de uma tecla para uma ação: devolve o motivo (texto) ou null
export function conflictFor(keys, action, code) {
  if (RESERVED[code]) return `já usada em "${RESERVED[code]}"`;
  for (const a of MOUNT_ACTIONS) {
    if (a.fixed || a.id === action) continue;
    if (keys[a.id] === code) return `já usada em "${a.name}"`;
  }
  const act = MOUNT_ACTIONS.find((a) => a.id === action);
  const abIdx = ABILITY_KEYS.solo.findIndex((k) => k[0] === code);
  if (abIdx >= 0) {
    // montar/desmontar funciona a pé: não pode dividir tecla com habilidade
    if (action === 'toggle') return `já usada em "${ABILITY_NAMES[abIdx]}"`;
    // habilidade da montaria só pode dividir com a habilidade do MESMO botão (senão as duas disparam)
    if (act && act.slot !== abIdx) return `já usada em "${ABILITY_NAMES[abIdx]}" (botão de outra habilidade)`;
  }
  return null;
}
export function checkAll(keys) {
  const out = [];
  for (const a of MOUNT_ACTIONS) {
    if (a.fixed) continue;
    const why = conflictFor(keys, a.id, keys[a.id]);
    if (why) out.push({ action: a.id, why });
  }
  return out;
}

// nome legível de uma tecla
export function keyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  const map = { Space: 'Espaço', ShiftLeft: 'Shift esq.', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl esq.', ControlRight: 'Ctrl dir.', AltLeft: 'Alt', Enter: 'Enter', Backquote: "'", Semicolon: 'Ç', BracketLeft: '´', BracketRight: '[', Backslash: ']', Comma: ',', Period: '.', Slash: ';', Quote: '~', CapsLock: 'Caps', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
  return map[code] || code;
}

// ações que uma montaria realmente tem (para HUD, catálogo e lista de controles)
export function actionsOf(mountId) {
  const def = MOUNTS[mountId];
  if (!def) return [];
  const info = MOUNT_INFO[mountId] || {};
  const skills = info.skills || [];
  const out = [
    { id: 'toggle', name: 'Entrar / sair', icon: 'vehicle' },
    { id: 'fire', name: `Ataque principal`, detail: info.attack || '', icon: 'target' },
  ];
  for (const s of skills) out.push({ id: s.act, name: s.name, icon: s.icon, cd: s.cd, detail: s.desc, slot: MOUNT_ACTIONS.find((a) => a.id === s.act)?.slot });
  return out;
}
// quais montarias usam cada ação (lista de controles mostra só as ações existentes)
export function mountsUsing(actionId) {
  return Object.keys(MOUNTS).filter((id) => actionsOf(id).some((a) => a.id === actionId));
}
