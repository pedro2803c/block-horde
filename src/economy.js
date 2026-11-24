// Economia do BLOCK HORDE: moedas da partida (temporárias), loja e inventário permanente.
// Regras: moedas só existem durante a partida e somem 100% na morte; compras concluídas são permanentes.
// Persistência local (mesma infraestrutura do restante do jogo: platform.js). Validação por servidor: pendente.
import { platform } from './platform.js';

export const SHOP_KEY = 'blockhorde_shop_v1';

// ---------------------------------------------------------------- recompensas por inimigo
// Faixas iniciais do PROT (parâmetros de teste, não definitivos)
export const COIN_TABLE = {
  common: [5, 10],
  special: [15, 25],
  elite: [30, 60],
  boss: [200, 500],
};
export const COMMON_DROP_CHANCE = 0.7; // inimigos comuns nem sempre deixam moedas
export const COIN_PILE_LIMIT = 60; // montes simultâneos no chão (acima disso, agrupa no mais próximo)
export const COIN_LIFE = 40; // segundos até um monte sumir
export const COIN_MERGE_DIST = 1.1;
export const COIN_PICK_DIST = 1.1;
export const COIN_MAGNET_DIST = 3.2;

export function enemyTier(def) {
  if (def.boss) return 'boss';
  if (def.hp >= 150 || def.score >= 50) return 'elite';
  if (def.score >= 28 || def.spit || def.lunge || def.fly || def.quake || def.summon || def.lob) return 'special';
  return 'common';
}
// valor de um inimigo: faixa da categoria × dificuldade (fácil rende menos, difícil mais)
export function coinReward(def, diffMul = 1, rnd = Math.random) {
  const tier = enemyTier(def);
  if (tier === 'common' && rnd() > COMMON_DROP_CHANCE) return { tier, value: 0 };
  const [a, b] = COIN_TABLE[tier];
  const base = a + Math.floor(rnd() * (b - a + 1));
  return { tier, value: Math.max(1, Math.round(base * diffMul)) };
}

// ---------------------------------------------------------------- catálogo da loja
export const RARITY = {
  common: { name: 'Comum', color: '#c8ccd4', price: 50 },
  rare: { name: 'Raro', color: '#29B6F6', price: 250 },
  epic: { name: 'Épico', color: '#b06cff', price: 750 },
  legendary: { name: 'Lendário', color: '#FFC107', price: 2000 },
};

// kind:
//  'weapon'    permanente: começa toda partida com a arma liberada e munição inicial
//  'gear'      permanente: começa toda partida equipado (pode desequipar)
//  'consumable' temporário: efeito imediato só nesta partida
export const SHOP_ITEMS = [
  // --- na partida (temporários)
  { id: 'c_medkit', cat: 'match', kind: 'consumable', item: 'medkit', name: 'Kit médico', rarity: 'common', price: 40, desc: 'Recupera 60% da vida agora.' },
  { id: 'c_ammo', cat: 'match', kind: 'consumable', item: 'ammo', name: 'Caixa de munição', rarity: 'common', price: 60, desc: 'Munição para todas as armas liberadas e +10 de vida.' },
  { id: 'c_drink', cat: 'match', kind: 'consumable', item: 'drink', name: 'Bebida energética', rarity: 'common', price: 50, desc: 'Fica mais rápido por 10 s.' },
  { id: 'c_vest', cat: 'match', kind: 'consumable', item: 'vest', name: 'Colete (recarga)', rarity: 'rare', price: 120, desc: 'Armadura cheia agora.' },
  // --- armas permanentes
  { id: 'w_uzi', cat: 'weapons', kind: 'weapon', item: 'uzi', name: 'Submetralhadora', rarity: 'common', price: 50, desc: 'Começa toda partida com a submetralhadora liberada.' },
  { id: 'w_shotgun', cat: 'weapons', kind: 'weapon', item: 'shotgun', name: 'Escopeta', rarity: 'rare', price: 250, desc: 'Começa toda partida com a escopeta liberada.' },
  { id: 'w_acidgun', cat: 'weapons', kind: 'weapon', item: 'acidgun', name: 'Lança-ácido', rarity: 'rare', price: 250, desc: 'Começa toda partida com o lança-ácido liberado.' },
  { id: 'w_cryo', cat: 'weapons', kind: 'weapon', item: 'cryo', name: 'Canhão criogênico', rarity: 'rare', price: 300, desc: 'Começa toda partida com o canhão criogênico liberado.' },
  { id: 'w_rifle', cat: 'weapons', kind: 'weapon', item: 'rifle', name: 'Fuzil de assalto', rarity: 'rare', price: 350, desc: 'Começa toda partida com o fuzil liberado.' },
  { id: 'w_sniper', cat: 'weapons', kind: 'weapon', item: 'sniper', name: 'Rifle de precisão', rarity: 'epic', price: 750, desc: 'Começa toda partida com o rifle de precisão liberado.' },
  { id: 'w_flamer', cat: 'weapons', kind: 'weapon', item: 'flamer', name: 'Lança-chamas', rarity: 'epic', price: 800, desc: 'Começa toda partida com o lança-chamas liberado.' },
  { id: 'w_rocket', cat: 'weapons', kind: 'weapon', item: 'rocket', name: 'Lança-foguetes', rarity: 'epic', price: 900, desc: 'Começa toda partida com o lança-foguetes liberado.' },
  { id: 'w_plasma', cat: 'weapons', kind: 'weapon', item: 'plasma', name: 'Rifle de plasma', rarity: 'legendary', price: 2000, desc: 'Começa toda partida com o rifle de plasma liberado.' },
  // --- acessórios permanentes (equipamentos que já existem no jogo)
  { id: 'g_backpack', cat: 'gear', kind: 'gear', item: 'backpack', name: 'Mochila tática', rarity: 'rare', price: 250, desc: 'Começa equipado: +50% de munição coletada.' },
  { id: 'g_helmet', cat: 'gear', kind: 'gear', item: 'helmet', name: 'Capacete tático', rarity: 'rare', price: 300, desc: 'Começa equipado: -40% de dano especial.' },
  { id: 'g_boots', cat: 'gear', kind: 'gear', item: 'boots', name: 'Botas de velocidade', rarity: 'epic', price: 750, desc: 'Começa equipado: +15% de velocidade.' },
  { id: 'g_vest', cat: 'gear', kind: 'gear', item: 'vest', name: 'Colete balístico', rarity: 'epic', price: 800, desc: 'Começa cada partida com a armadura cheia.' },
];
export const SHOP_CATS = [
  { id: 'match', name: 'Na partida', icon: 'medkit' },
  { id: 'weapons', name: 'Armas', icon: 'target' },
  { id: 'gear', name: 'Acessórios', icon: 'backpack' },
  // categorias do PROT que dependem de sistemas que o jogo ainda não tem: aparecem como "em breve", sem itens à venda
  { id: 'skins', name: 'Roupas e skins', icon: 'users', soon: 'O jogo ainda não tem sistema de aparências para sobreviventes.' },
  { id: 'mounts', name: 'Montarias', icon: 'vehicle', soon: 'As montarias são liberadas pelos chefões de cada arena; compra e aparências alternativas ainda não existem.' },
  { id: 'upgrades', name: 'Melhorias', icon: 'tree', soon: 'Melhorias de atributos já vêm da árvore de passivas; compras permanentes de atributos ainda não foram balanceadas.' },
  { id: 'collect', name: 'Colecionáveis', icon: 'star', soon: 'Emblemas e efeitos ainda não têm onde ser exibidos no jogo.' },
];
export const shopItem = (id) => SHOP_ITEMS.find((s) => s.id === id);

// ---------------------------------------------------------------- inventário permanente (local)
export function loadShop() {
  try {
    const s = JSON.parse(platform.getItem(SHOP_KEY) || '{}');
    return { owned: s.owned || {}, equipped: s.equipped || {}, log: Array.isArray(s.log) ? s.log : [], seq: s.seq | 0 };
  } catch {
    return { owned: {}, equipped: {}, log: [], seq: 0 };
  }
}
export function saveShop(s) {
  platform.setItem(SHOP_KEY, JSON.stringify({ owned: s.owned, equipped: s.equipped, log: s.log.slice(-80), seq: s.seq }));
}
// registro de transações importantes (compras, mortes com perda)
export function logTx(s, type, data) {
  s.seq++;
  s.log.push({ n: s.seq, t: Date.now(), type, ...data });
}
