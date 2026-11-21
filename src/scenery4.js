// Biblioteca de cenário — expansão Roma Antiga (Coliseu).
// Mesmo formato de scenery.js/scenery2.js/scenery3.js. Registrado em scenery.js via Object.assign.
const R = (r, a, b) => a + (b - a) * r();
const cube = (side, top, extra = []) => [[0, 0.5, 0, 1, 1, 1, side], [0, 0.97, 0, 1.02, 0.08, 1.02, top], ...extra];

export const SCENERY4 = {
  // ---- Arquitetura ----
  roman_column: { n: 100, ch: 'Y', name: 'Coluna romana', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Coluna de mármore com capitel. Bloqueia passagem e tiros.', theme: 'coliseu', model: () => [[0, 0, 0, 0.55, 2.6, 0.55, 0xd8d0b8], [0, 2.62, 0, 0.75, 0.25, 0.75, 0xe8e0c8], [0, -0.05, 0, 0.65, 0.1, 0.65, 0xb8b098]] },
  roman_arch: { n: 101, ch: 'y', name: 'Arco triunfal', cat: 'structure', beh: 'static', coll: 'tall', span: [3, 1], desc: 'Arco de pedra monumental. Passagem livre no centro.', theme: 'coliseu', model: () => [[-1.2, 0.5, 0, 0.6, 2.6, 0.6, 0xd8d0b8], [1.2, 0.5, 0, 0.6, 2.6, 0.6, 0xd8d0b8], [0, 2.1, 0, 3.0, 0.8, 0.6, 0xe8e0c8]] },
  roman_wall: { n: 102, ch: 'W', name: 'Parede de pedra', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Parede de blocos de pedra cinza.', theme: 'coliseu', model: () => [[0, 0.5, 0, 1, 2.4, 0.4, 0x9a9ca0], [0, 0.5, 0, 1, 2.4, 0.4, 0x8a8c90]] },
  roman_stairs: { n: 103, ch: 'z', name: 'Escadaria do fórum', cat: 'structure', beh: 'static', coll: 'floor', desc: 'Degraus de pedra. Suba para o fórum.', theme: 'coliseu', model: () => [[0, 0.1, 0, 1, 0.2, 1, 0x9a9ca0], [0, 0.3, 0, 1, 0.2, 0.85, 0xa0a2a6], [0, 0.5, 0, 1, 0.2, 0.7, 0xaaacb0]] },
  roman_aqueduct: { n: 104, ch: 'q', name: 'Aquaduto', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Arcos de aqueduto. Passagem livre embaixo.', theme: 'coliseu', model: () => [[-0.7, 0.5, 0, 0.4, 2.4, 0.4, 0xc8c0a8], [0.7, 0.5, 0, 0.4, 2.4, 0.4, 0xc8c0a8], [0, 2.2, 0, 1.8, 0.3, 0.4, 0xd8d0b8]] },
  roman_statue_caesar: { n: 105, ch: 'C', name: 'Estátua de César', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Estátua de mármore de César. Decorativa.', theme: 'coliseu', model: () => [[0, 0, 0, 0.6, 0.4, 0.6, 0xd8d0b8], [0, 1.2, 0, 0.35, 1.6, 0.35, 0xe8e0c8], [0, 2.9, 0, 0.5, 0.4, 0.5, 0xd8d0b8]] },
  roman_statue_legion: { n: 106, ch: 'L', name: 'Estátua da legião', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Soldado romano em mármore.', theme: 'coliseu', model: () => [[0, 0, 0, 0.5, 0.4, 0.5, 0xd8d0b8], [0, 1.2, 0, 0.3, 1.6, 0.3, 0xe8e0c8], [0.25, 2.0, 0, 0.15, 0.6, 0.15, 0xc8c0a8]] },
  roman_colosseum_piece: { n: 107, ch: 'O', name: 'Trecho do Coliseu', cat: 'structure', beh: 'static', coll: 'tall', desc: 'Arquibancada modular do Coliseu.', theme: 'coliseu', model: () => [[0, 0.5, 0, 1, 2.8, 0.8, 0xd8c098], [0, 2.9, 0, 1.05, 0.2, 0.85, 0xe8d0a8]] },

  // ---- Objetos interativos ----
  roman_chest: { n: 108, ch: 'b', name: 'Baú imperial', cat: 'urban', beh: 'interact', coll: 'low', hp: 40, desc: 'Baú com recompensas. Quebre ou abra.', theme: 'coliseu', model: () => [[0, 0.25, 0, 0.7, 0.5, 0.5, 0x8a6a3a], [0, 0.6, 0, 0.75, 0.2, 0.55, 0x6a4a2a]] },
  roman_amphora: { n: 109, ch: 'a', name: 'Ânfora romana', cat: 'urban', beh: 'destruct', coll: 'low', hp: 20, desc: 'Ânfora destrutível. Pode soltar item.', theme: 'coliseu', model: () => [[0, 0.35, 0, 0.35, 0.7, 0.35, 0xc8a06a], [0, 0.75, 0, 0.25, 0.15, 0.25, 0xb8905a]] },
  roman_lever: { n: 110, ch: 'v', name: 'Alavanca de arena', cat: 'urban', beh: 'interact', coll: 'low', desc: 'Ativa mecanismos (portões, plataformas).', theme: 'coliseu', model: () => [[0, 0.4, 0, 0.2, 0.8, 0.2, 0x6a6a70], [0.15, 0.75, 0, 0.35, 0.12, 0.12, 0xd4a020]] },
  roman_gate: { n: 111, ch: 'G', name: 'Portão da arena', cat: 'structure', beh: 'interact', coll: 'tall', desc: 'Portão que abre e fecha.', theme: 'coliseu', model: () => [[0, 1.0, 0, 1.6, 2.0, 0.2, 0x8a6a3a], [0, 1.0, 0, 0.2, 2.0, 0.2, 0x6a4a2a]] },
  roman_platform: { n: 112, ch: 'P', name: 'Plataforma móvel', cat: 'urban', beh: 'interact', coll: 'floor', desc: 'Plataforma com movimento configurável.', theme: 'coliseu', model: () => [[0, 0.1, 0, 1, 0.2, 1, 0x9a9ca0]] },
  roman_elevator: { n: 113, ch: 'E', name: 'Máquina de elevação', cat: 'urban', beh: 'interact', coll: 'tall', desc: 'Elevador de arena funcional.', theme: 'coliseu', model: () => [[0, 0.5, 0, 0.8, 1.0, 0.8, 0x6a6a70], [0, 1.6, 0, 0.9, 0.2, 0.9, 0x8a8a90]] },
  roman_drum: { n: 114, ch: 'T', name: 'Tambor de guerra', cat: 'urban', beh: 'interact', coll: 'low', desc: 'Tambor que inicia eventos ou chama reforços.', theme: 'coliseu', model: () => [[0, 0.4, 0, 0.5, 0.8, 0.5, 0x8a5a2a], [0, 0.9, 0, 0.55, 0.15, 0.55, 0xd4a020]] },

  // ---- Armadilhas ----
  roman_stakes: { n: 115, ch: 's', name: 'Estacas de areia', cat: 'urban', beh: 'static', coll: 'low', hazard: true, desc: 'Estacas que ferem quem pisa.', theme: 'coliseu', model: () => [[0, 0.3, 0, 1, 0.6, 1, 0x8a6a3a]] },
  roman_blade: { n: 116, ch: 'l', name: 'Lâmina oscilante', cat: 'urban', beh: 'interact', coll: 'low', hazard: true, desc: 'Lâmina que oscila e fere.', theme: 'coliseu', model: () => [[0, 0.8, 0, 0.9, 0.15, 0.15, 0xc8c0a0]] },
  roman_spike_floor: { n: 117, ch: 'i', name: 'Piso de lanças', cat: 'urban', beh: 'static', coll: 'low', hazard: true, desc: 'Piso com lanças que ferem.', theme: 'coliseu', model: () => [[0, 0.1, 0, 1, 0.2, 1, 0x8a6a3a]] },
  roman_darts: { n: 118, ch: 'd', name: 'Dardos de parede', cat: 'urban', beh: 'interact', coll: 'none', hazard: true, desc: 'Dardos disparados da parede.', theme: 'coliseu', model: () => [[0, 0.8, 0, 0.15, 0.15, 0.15, 0xc8c0a0]] },
  roman_fire_pit: { n: 119, ch: 'f', name: 'Fosso de fogo', cat: 'urban', beh: 'static', coll: 'floor', hazard: true, desc: 'Fosso com fogo que fere.', theme: 'coliseu', model: () => [[0, 0.05, 0, 1, 0.1, 1, 0xff7a1a, 0, true]] },
  roman_roller: { n: 120, ch: 'r', name: 'Rolo espinhoso', cat: 'urban', beh: 'interact', coll: 'low', hazard: true, desc: 'Rolo com espinhos que se move.', theme: 'coliseu', model: () => [[0, 0.4, 0, 0.9, 0.8, 0.9, 0x8a6a3a]] },
  roman_pillar_collapse: { n: 121, ch: 'P', name: 'Pilar colapsável', cat: 'structure', beh: 'destruct', coll: 'tall', hp: 120, desc: 'Pilar que desaba ao ser atingido.', theme: 'coliseu', model: () => [[0, 0.5, 0, 0.5, 2.4, 0.5, 0xd8d0b8]] },
  roman_quicksand: { n: 122, ch: 'Q', name: 'Areia movediça', cat: 'terrain', beh: 'static', coll: 'floor', slow: true, desc: 'Areia que prende e deixa lento.', theme: 'coliseu', model: () => [[0, 0.05, 0, 1, 0.1, 1, 0xd8bf7c]] },

  // ---- Decoração ----
  roman_spqr: { n: 123, ch: 'S', name: 'Estandarte SPQR', cat: 'urban', beh: 'static', coll: 'none', desc: 'Estandarte romano decorativo.', theme: 'coliseu', model: () => [[0, 0.9, 0, 0.1, 1.8, 0.1, 0x8a1610], [0.15, 1.8, 0, 0.4, 0.3, 0.05, 0xd4a020]] },
  roman_tent: { n: 124, ch: 't', name: 'Tenda do mercado', cat: 'urban', beh: 'static', coll: 'tall', desc: 'Tenda de mercado romano.', theme: 'coliseu', model: () => [[0, 0.6, 0, 1.2, 1.2, 1.2, 0xc8a06a], [0, 1.3, 0, 1.3, 0.15, 1.3, 0x8a5a2a]] },
  roman_torch: { n: 125, ch: 'i', name: 'Tocha romana', cat: 'urban', beh: 'interact', coll: 'low', light: true, desc: 'Tocha que ilumina a área.', theme: 'coliseu', model: () => [[0, 0.6, 0, 0.12, 1.2, 0.12, 0x6a4a2a], [0, 1.35, 0, 0.18, 0.18, 0.18, 0xff7a1a, 0, true]] },
  roman_brazier: { n: 126, ch: 'B', name: 'Braseiro cerimonial', cat: 'urban', beh: 'interact', coll: 'low', light: true, desc: 'Braseiro com fogo cerimonial.', theme: 'coliseu', model: () => [[0, 0.3, 0, 0.5, 0.6, 0.5, 0x6a6a70], [0, 0.95, 0, 0.45, 0.15, 0.45, 0xff7a1a, 0, true]] },
  roman_cart: { n: 127, ch: 'c', name: 'Carrinho de carga', cat: 'urban', beh: 'interact', coll: 'low', push: true, desc: 'Carrinho empurrável.', theme: 'coliseu', model: () => [[0, 0.2, 0, 0.8, 0.4, 0.5, 0x8a6a3a], [0, 0.05, 0, 0.15, 0.1, 0.5, 0x6a4a2a]] },
  roman_crate: { n: 128, ch: 'x', name: 'Caixas e caixotes', cat: 'urban', beh: 'destruct', coll: 'low', hp: 40, desc: 'Caixotes de madeira destrutíveis.', theme: 'coliseu', model: () => [[0, 0.25, 0, 0.5, 0.5, 0.5, 0x8a6a3a]] },

  // ---- Elementos especiais ----
  roman_portal: { n: 129, ch: 'r', name: 'Portal da Legião', cat: 'urban', beh: 'interact', coll: 'none', desc: 'Portal com destino configurável.', theme: 'coliseu', model: () => [[0, 0.9, 0, 0.1, 1.8, 0.1, 0x7a3ab0, 0, true], [0, 0.9, 0, 1.2, 1.8, 0.1, 0x7a3ab0, 0, true]] },
  roman_relic: { n: 130, ch: 'R', name: 'Relíquia imperial', cat: 'urban', beh: 'interact', coll: 'none', desc: 'Relíquia coletável.', theme: 'coliseu', model: () => [[0, 0.4, 0, 0.3, 0.6, 0.3, 0xd4a020, 0, true]] },
  roman_crystal: { n: 131, ch: 'k', name: 'Cristal de poder', cat: 'urban', beh: 'interact', coll: 'none', desc: 'Cristal que ativa objetivos.', theme: 'coliseu', model: () => [[0, 0.5, 0, 0.3, 1.0, 0.3, 0x3fe0ff, 0, true]] },
  roman_control_point: { n: 132, ch: 'O', name: 'Ponto de controle', cat: 'urban', beh: 'interact', coll: 'none', desc: 'Ponto de controle da progressão.', theme: 'coliseu', model: () => [[0, 0.1, 0, 0.8, 0.2, 0.8, 0x2ecc71]] },
};

export const TERRAIN_PAINT4 = {};
export const TERRAIN_CODE4 = {};
