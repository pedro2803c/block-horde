// Block Horde — Sistema de Montarias no PvP (9 montarias balanceadas, 100% combate físico corpo a corpo)
// Reutiliza os modelos 3D oficiais de src/mounts.js sem alterar o comportamento PvE.
import { MOUNTS, mountDef } from '../mounts.js';

export const PVP_MOUNT_ORDER = [
  'praca',      // 1. Jipe Blindado
  'armazem',    // 2. Empilhadeira de Combate
  'vale',       // 3. Lobo Alfa Infectado (modelo fera)
  'distrito',   // 4. Tanque Blindado
  'cemiterio',  // 5. Golem de Ossos
  'coliseu',    // 6. Quadriga de Guerra
  'lab',        // 7. Exoesqueleto Experimental
  'templo',     // 8. Apófis, Serpente do Caos (modelo templo)
  'naval',      // 9. Tubarão Esqueleto
];

// Matriz de balanceamento PvP: nenhuma montaria domina todos os atributos.
// Pesadas = alta resistência + impacto, menor velocidade; Rápidas = alta mobilidade, menor resistência.
// TODAS as habilidades são físicas e de curta distância (sem projéteis, mísseis ou balas).
export const PVP_MOUNTS = {
  praca: {
    id: 'praca', name: 'Jipe Blindado', category: 'Veículo',
    hp: 240, speed: 7.6, dmg: 24, range: 3.1, rate: 0.55, knock: 10, radius: 1.35,
    sound: 'mnt_jeep_mg',
    desc: 'Investida veloz e atropelamento blindado em curta distância.',
    skillName: 'Atropelamento', skillDesc: 'Avanço físico que atropela e empurra o rival.',
    skillCd: 6, skillDmg: 42, skillRange: 3.8, skillKnock: 14,
  },
  armazem: {
    id: 'armazem', name: 'Empilhadeira de Combate', category: 'Veículo',
    hp: 290, speed: 6.2, dmg: 28, range: 3.0, rate: 0.62, knock: 12, radius: 1.35,
    sound: 'mnt_fork_hit',
    desc: 'Empurrão hidráulico e esmagamento frontal com garfos de aço.',
    skillName: 'Aríete Hidráulico', skillDesc: 'Golpe frontal de alto impacto e repulsão.',
    skillCd: 6, skillDmg: 48, skillRange: 3.4, skillKnock: 16,
  },
  vale: {
    id: 'vale', name: 'Lobo Alfa Infectado', category: 'Criatura',
    hp: 195, speed: 8.6, dmg: 22, range: 2.8, rate: 0.42, knock: 7, radius: 1.15,
    sound: 'mnt_boar_tusk',
    desc: 'Mordidas rápidas, garras ferozes e investida ágil.',
    skillName: 'Investida Selvagem', skillDesc: 'Salto predador com corte de garras.',
    skillCd: 5, skillDmg: 38, skillRange: 3.6, skillKnock: 10,
  },
  distrito: {
    id: 'distrito', name: 'Tanque Blindado', category: 'Veículo Pesado',
    hp: 380, speed: 5.1, dmg: 36, range: 3.4, rate: 0.85, knock: 15, radius: 1.65,
    sound: 'mnt_tank_cannon',
    desc: 'Blindagem máxima com impacto e esmagamento físico pesado.',
    skillName: 'Esmagamento Blindado', skillDesc: 'Choque físico de casco em curta distância.',
    skillCd: 7, skillDmg: 56, skillRange: 3.8, skillKnock: 18,
  },
  cemiterio: {
    id: 'cemiterio', name: 'Golem de Ossos', category: 'Criatura Pesada',
    hp: 360, speed: 5.3, dmg: 34, range: 3.5, rate: 0.80, knock: 14, radius: 1.60,
    sound: 'mnt_golem_bone',
    desc: 'Socos colossais, pisões e golpes físicos em área curta.',
    skillName: 'Pisão Sísmico', skillDesc: 'Onda física ao redor que fere e empurra.',
    skillCd: 7, skillDmg: 52, skillRange: 4.0, skillKnock: 15,
  },
  coliseu: {
    id: 'coliseu', name: 'Quadriga de Guerra', category: 'Veículo Ágil',
    hp: 215, speed: 8.8, dmg: 25, range: 3.3, rate: 0.52, knock: 9, radius: 1.40,
    sound: 'mnt_chariot_lance',
    desc: 'Investida em alta velocidade com lâminas laterais cortantes.',
    skillName: 'Lâminas Laterais', skillDesc: 'Corte físico dos dois lados ao passar perto.',
    skillCd: 5.5, skillDmg: 44, skillRange: 3.6, skillKnock: 11,
  },
  lab: {
    id: 'lab', name: 'Exoesqueleto Experimental', category: 'Mecânica',
    hp: 260, speed: 6.8, dmg: 27, range: 3.0, rate: 0.50, knock: 11, radius: 1.15,
    sound: 'mnt_fork_hit',
    desc: 'Golpes hidráulicos precisos com braços mecânicos reforçados.',
    skillName: 'Impacto Mecânico', skillDesc: 'Soco duplo de braços hidráulicos.',
    skillCd: 5.5, skillDmg: 46, skillRange: 3.3, skillKnock: 13,
  },
  templo: {
    id: 'templo', name: 'Apófis, Serpente do Caos', category: 'Criatura',
    hp: 250, speed: 7.8, dmg: 26, range: 3.2, rate: 0.50, knock: 10, radius: 1.35,
    sound: 'mnt_lion_roar',
    desc: 'Constrição brutal, mordida venenosa curta e investida.',
    skillName: 'Bote Constritor', skillDesc: 'Mordida e pressão física em curta distância.',
    skillCd: 6, skillDmg: 45, skillRange: 3.6, skillKnock: 12,
  },
  naval: {
    id: 'naval', name: 'Tubarão Esqueleto', category: 'Criatura',
    hp: 310, speed: 7.4, dmg: 31, range: 3.3, rate: 0.60, knock: 12, radius: 1.50,
    sound: 'mnt_shark_bite',
    desc: 'Mordida devastadora e investida predatória implacável.',
    skillName: 'Mordida Predatória', skillDesc: 'Avanço curto com mandíbulas de alto dano.',
    skillCd: 6.5, skillDmg: 50, skillRange: 3.7, skillKnock: 13,
  },
};

export function pvpMountSpec(id) {
  return PVP_MOUNTS[id] || PVP_MOUNTS.praca;
}

export function createPvpMountInstance(p, mountId) {
  const spec = pvpMountSpec(mountId);
  const base = mountDef(spec.id) || MOUNTS.praca;
  return {
    id: spec.id,
    spec,
    def: { ...base, name: spec.name, hp: spec.hp, maxHp: spec.hp, speed: spec.speed },
    hp: spec.hp,
    maxHp: spec.hp,
    alive: true,
    destroyed: false,
    hurtT: 0,
    walk: 0,
    skillCd: 0,
    x: p.pos.x,
    z: p.pos.z,
    facing: p.facing,
    rider: p,
  };
}
