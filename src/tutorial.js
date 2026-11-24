// Sistema de tutorial do BLOCK HORDE: estado central, 12 etapas, dicas contextuais e manual.
// Persistência: chave oficial 'blockhorde_tutorial_v1' (já sincronizada pelo platform.js).
// Valor antigo '1' = tutorial curto já concluído → tratado como "concluído".
import { platform } from './platform.js';
import { ULT_REQ } from './abilities.js';

export const TUTORIAL_KEY = 'blockhorde_tutorial_v1';

export function loadTut() {
  const raw = platform.getItem(TUTORIAL_KEY);
  if (!raw) return { status: 'new', step: 0, done: [], seen: [] };
  if (raw === '1') return { status: 'done', step: 12, done: [], seen: [] };
  try {
    const s = JSON.parse(raw);
    return { status: s.status || 'new', step: s.step | 0, done: s.done || [], seen: s.seen || [] };
  } catch {
    return { status: 'new', step: 0, done: [], seen: [] };
  }
}
export function saveTut(s) {
  platform.setItem(TUTORIAL_KEY, JSON.stringify({ status: s.status, step: s.step, done: s.done, seen: s.seen }));
}

// plataforma: 'pad' (controle), 'touch' (celular) ou 'web' (teclado e mouse)
export const platOf = (g) => (g.pad?.usingPad ? 'pad' : g.input.touchMode ? 'touch' : 'web');

// kind 'action' = conclui ao fazer a ação real; 'info' = conclui com o botão Continuar
// hl = seletor do elemento do HUD destacado (por plataforma; '*' vale para todas)
export const STEPS = [
  { id: 'move', title: 'Movimentação', kind: 'action',
    text: { web: 'Ande com W A S D. Mova-se um pouco para continuar.', touch: 'Arraste no lado esquerdo da tela para andar. Mova-se um pouco para continuar.', pad: 'Ande com o analógico esquerdo. Mova-se um pouco para continuar.' },
    hl: { touch: '.stick' },
    begin: (g, tu) => { const p = g.players[0]; tu.x = p.pos.x; tu.z = p.pos.z; },
    check: (g, tu) => { const p = g.players[0]; return Math.hypot(p.pos.x - tu.x, p.pos.z - tu.z) > 3; } },
  { id: 'aim', title: 'Câmera e mira', kind: 'action',
    text: { web: 'A câmera segue você. Mire com o mouse e clique (ou Espaço) para atirar. A assistência de mira (Manual, Assistido, Automático) fica em Configurações. Dispare 4 tiros.', touch: 'O tiro é automático no inimigo mais próximo. Para mirar você mesmo, segure e arraste no lado direito. Dispare 4 tiros.', pad: 'Mire com o analógico direito (solto, mira no mais próximo) e atire. Dispare 4 tiros.' },
    begin: (g, tu) => { tu.shots = g.stats.shots; },
    check: (g, tu) => g.stats.shots - tu.shots >= 4 },
  { id: 'combat', title: 'Primeiro combate', kind: 'action',
    text: { '*': 'Derrote 3 inimigos. Os números de dano saem do alvo atingido; o contador vermelho no topo mostra quantos faltam na onda.' },
    hl: { '*': '.top .chip.red' },
    begin: (g, tu) => { tu.kills = g.stats.kills; },
    check: (g, tu) => g.stats.kills - tu.kills >= 3 },
  { id: 'weapons', title: 'Armas e munição', kind: 'action',
    text: { web: 'Troque de arma com Q / E, roda do mouse ou teclas 1–9. G recarrega, F ataca corpo a corpo. A munição aparece ao lado do nome da arma. Troque de arma ou recarregue.', touch: 'Toque no botão da arma para trocar (segure para escolher na lista). O botão circular recarrega. Troque de arma ou recarregue.', pad: 'Troque de arma com os botões de ombro e recarregue com o botão de recarga. Troque de arma ou recarregue.' },
    hl: { web: '.players .pp.p1 .pp-weapon', touch: '.tb.wpn, .tb.rel', pad: '.players .pp.p1 .pp-weapon' },
    begin: (g, tu) => { const p = g.players[0]; tu.w = p.weapon; },
    check: (g, tu) => { const p = g.players[0]; return p.weapon !== tu.w || !!p.reloadT || !!p.reloading; } },
  { id: 'abilities', title: 'Habilidades especiais', kind: 'action',
    text: { web: 'Z · X · C usam as habilidades ativas; o ícone escurece durante a recarga. R é a ultimate, liberada na árvore (Tab) a partir do nível ' + ULT_REQ.level + '. Use uma habilidade.', touch: 'Os botões redondos usam as habilidades; o escurecido indica recarga. O do cadeado é a ultimate (nível ' + ULT_REQ.level + '). Use uma habilidade.', pad: 'Os botões de face usam as habilidades; o ícone escurece durante a recarga. Use uma habilidade.' },
    hl: { web: '.players .pp.p1 .abil', touch: '.tb.ab', pad: '.players .pp.p1 .abil' },
    check: (g) => { const p = g.players[0]; return (p.cds || []).slice(0, 3).some((c) => c > 0); } },
  { id: 'hordes', title: 'Inimigos e hordas', kind: 'info',
    text: { '*': 'Cada onda traz mais inimigos: rápidos, pesados, voadores e alguns que atiram de longe. Continue se movendo para não ser cercado e use o radar para ver de onde vêm.' },
    hl: { '*': '.radar' } },
  { id: 'bosses', title: 'Chefões', kind: 'info',
    text: { '*': 'A cada 5 ondas surge um chefão: um aviso vermelho anuncia a chegada e a barra de vida dele aparece no topo. Mantenha distância dos ataques e use as habilidades nele.' } },
  { id: 'mounts', title: 'Montarias', kind: 'info',
    text: { web: 'Quando um chefão aparece, a montaria da arena é liberada no mapa. Chegue perto e aperte V para montar. Ela tem ataques próprios e integridade; se for destruída, você volta a pé.', touch: 'Quando um chefão aparece, a montaria da arena é liberada no mapa. Chegue perto e toque em Montar. Ela tem ataques próprios e integridade; se for destruída, você volta a pé.', pad: 'Quando um chefão aparece, a montaria da arena é liberada no mapa. Chegue perto e use o botão de montar. Ela tem ataques e integridade próprios.' } },
  { id: 'xp', title: 'XP e evolução', kind: 'info',
    text: { web: 'Abates dão XP (barra fina sob o nome). Cada nível dá 1 ponto para a árvore de passivas: abra com Tab. A conta também sobe de nível e libera conteúdos.', touch: 'Abates dão XP (barra fina sob o nome). Cada nível dá 1 ponto para a árvore de passivas: abra pela pausa. A conta também sobe de nível e libera conteúdos.', pad: 'Abates dão XP (barra fina sob o nome). Cada nível dá 1 ponto para a árvore de passivas.' },
    hl: { '*': '.players .pp.p1 .xpbar' } },
  { id: 'inventory', title: 'Itens e equipamentos', kind: 'info',
    text: { '*': 'Encoste nos itens do chão para pegar: kits, munição, armas e equipamentos (colete, capacete, botas) que entram direto em uso. Os espaços de arma liberados ficam abaixo da arma; os trancados mostram cadeado. O catálogo completo fica em Itens, no menu.' },
    hl: { web: '.players .pp.p1 .slots', pad: '.players .pp.p1 .slots', touch: '.tb.wpn' } },
  { id: 'arenas', title: 'Arenas e dificuldade', kind: 'info',
    text: { '*': 'No menu, "Escolher arena e sobrevivente" mostra cada arena, sua dificuldade e seus inimigos, armas e montaria exclusivos. A dificuldade atual aparece no topo da tela.' },
    hl: { '*': '.top .diff-chip' } },
  { id: 'final', title: 'Missão final', kind: 'action',
    text: { '*': 'Missão: derrote 8 inimigos usando tudo o que aprendeu.' },
    hl: { '*': '.top .chip.red' },
    begin: (g, tu) => { tu.kills = g.stats.kills; },
    check: (g, tu) => g.stats.kills - tu.kills >= 8 },
];

// dicas contextuais (1ª vez que a mecânica aparece; nunca repetem)
export const HINTS = {
  boss: 'Chefão! Observe o padrão dos ataques e use as habilidades nele.',
  mount: { web: 'Montaria liberada! Vá até ela e aperte V para montar.', touch: 'Montaria liberada! Vá até ela e toque em Montar.', pad: 'Montaria liberada! Vá até ela e use o botão de montar.' },
  levelup: { web: 'Subiu de nível! Gaste o ponto na árvore (Tab).', touch: 'Subiu de nível! Gaste o ponto na árvore (pela pausa).', pad: 'Subiu de nível! Gaste o ponto na árvore de passivas.' },
  unlock: 'Novo item liberado! Ele já está nos seus espaços de arma.',
  ability: 'Habilidade usada: espere o ícone clarear para usar de novo.',
  weapon: 'Cada arma tem alcance, cadência e munição próprios. Teste qual combina com a situação.',
};

// manual: só mecânicas implementadas; controles por plataforma
export const MANUAL = [
  { id: 'controls', title: 'Controles', icon: 'gamepad', body: {
    web: ['Andar: W A S D', 'Mirar: mouse · Atirar: clique ou Espaço', 'Trocar arma: Q / E, roda do mouse, 1–9', 'Recarregar: G · Corpo a corpo: F', 'Habilidades: Z · X · C · Ultimate: R', 'Montar/desmontar: V · Árvore: Tab · Pausa: P ou Esc', 'Teclas podem ser trocadas em Controles.'],
    touch: ['Andar: arraste no lado esquerdo', 'Tiro automático; segure e arraste à direita para mirar', 'Botão da arma: toque troca, segure abre a lista', 'Botões redondos: habilidades; cadeado: ultimate', 'Botão circular: recarregar · faca: corpo a corpo', 'Montar: botão Montar, quando perto da montaria'],
    pad: ['Andar: analógico esquerdo · Mirar: analógico direito', 'Atirar, trocar arma e habilidades: veja os ícones em Controles', 'O botão Voltar pula as dicas do tutorial'] } },
  { id: 'move', title: 'Movimentação', icon: 'run', body: { '*': ['A câmera acompanha o sobrevivente de cima.', 'Fique em movimento: parado, a horda cerca você.', 'Há uma habilidade de investida (dash) para escapar.'] } },
  { id: 'combat', title: 'Combate', icon: 'target', body: { '*': ['Mira: Manual, Assistida ou Automática (Configurações).', 'Números de dano saem do alvo; críticos causam o dobro.', 'Corpo a corpo serve quando a munição acaba.'] } },
  { id: 'weapons', title: 'Armas', icon: 'bolt', body: { '*': ['Cada arma tem dano, cadência, alcance e pente próprios.', 'A pistola tem munição infinita.', 'Novas armas são liberadas por nível durante a partida e aparecem nos espaços de arma.', 'Algumas arenas têm arsenais exclusivos com especiais e bônus de conjunto.'] } },
  { id: 'abilities', title: 'Habilidades', icon: 'bolt', body: { '*': ['3 habilidades ativas + 1 ultimate, escolhidas em "Habilidades e builds".', 'Cada uma tem tempo de recarga; o ícone mostra quando volta.', 'A ultimate é liberada na árvore a partir do nível ' + ULT_REQ.level + '.'] } },
  { id: 'enemies', title: 'Inimigos', icon: 'skull', body: { '*': ['Há inimigos rápidos, pesados, voadores, que atiram e que envenenam.', 'Cada arena tem inimigos próprios; veja a lista em Inimigos, no menu.', 'O radar mostra de onde a horda vem.'] } },
  { id: 'bosses', title: 'Chefões', icon: 'crown', body: { '*': ['Aparecem a cada 5 ondas, com aviso e barra de vida no topo.', 'Cada arena alterna seus próprios chefões.', 'Habilidades de atordoar têm efeito reduzido em chefões.'] } },
  { id: 'mounts', title: 'Montarias', icon: 'vehicle', body: { '*': ['A montaria da arena é liberada quando um chefão aparece.', 'Montado, você usa os ataques e habilidades da montaria.', 'Ela tem integridade própria: destruída, você volta a pé.', 'Veja todas em Montarias, no menu.'] } },
  { id: 'xp', title: 'XP e evolução', icon: 'tree', body: { '*': ['Abates dão XP na partida; cada nível dá 1 ponto.', 'Pontos vão para a árvore de passivas (5 níveis por ramo).', 'Ao fim da partida a conta ganha XP e libera conteúdos.'] } },
  { id: 'inventory', title: 'Itens e equipamentos', icon: 'backpack', body: { '*': ['Itens no chão são pegos ao encostar.', 'Equipamentos (colete, capacete, botas, exoesqueleto) entram em uso ao pegar.', 'Armadilhas e torres podem ser posicionadas.', 'Catálogo completo em Itens, no menu.'] } },
  { id: 'arenas', title: 'Arenas', icon: 'map', body: { '*': ['Cada arena tem dificuldade, clima, inimigos, chefões e montaria próprios.', 'Escolha em "Escolher arena e sobrevivente".', 'A dificuldade geral é escolhida antes de jogar.'] } },
  { id: 'coop', title: 'Multijogador', icon: 'users', body: { '*': ['Co-op local: 2 jogadores no mesmo teclado ("Co-op" no menu).', 'Não há multijogador online por enquanto.'] } },
];
export const pickText = (obj, plat) => (typeof obj === 'string' ? obj : obj[plat] || obj['*'] || obj.web);
