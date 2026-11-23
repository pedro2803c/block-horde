# BLOCK HORDE — GLOBAL UX/UI DESIGN SYSTEM & INTERFACE GOVERNANCE PROTOCOL

## MISSÃO

Estabelecer um padrão obrigatório e permanente de UX/UI para todo o BLOCK HORDE.

Toda funcionalidade nova, alteração de gameplay, menu, HUD, controle, notificação, sistema de progressão ou componente visual deve respeitar o padrão de interface existente.

O objetivo é impedir que novas funcionalidades sejam adicionadas de maneira isolada, causando desorganização, sobreposição, inconsistência visual ou problemas de usabilidade.

**REGRA PRINCIPAL: nenhuma nova funcionalidade pode comprometer a organização, legibilidade, acessibilidade ou consistência da interface existente.**

Este protocolo deve ser considerado em todas as futuras implementações.

# 1. AUDITORIA OBRIGATÓRIA ANTES DE CADA IMPLEMENTAÇÃO

Antes de desenvolver qualquer funcionalidade que tenha impacto visual:

1. Analisar a interface atual.
2. Identificar os componentes existentes.
3. Verificar o Design System.
4. Identificar a localização dos elementos relacionados.
5. Verificar os espaços disponíveis na interface.
6. Avaliar possíveis sobreposições.
7. Identificar impactos em desktop, tablet e mobile.
8. Definir como a nova funcionalidade será integrada visualmente.

Não criar uma nova interface sem verificar se já existe um componente equivalente.

Não adicionar elementos simplesmente no primeiro espaço disponível.

# 2. DESIGN SYSTEM GLOBAL

Manter a identidade visual existente do BLOCK HORDE.

### Paleta de cores

- Fundo principal: #0E1117
- Painéis: #1B1F28
- Bordas: #2E3440
- Texto principal: #EAEDEF
- Destaque: #FFC107
- Perigo: #E53935
- Sucesso: #2ECC71
- Informação: #29B6F6

### Tipografia

- Títulos: Bebas Neue.
- Interface e textos: Exo 2.
- Priorizar legibilidade em telas pequenas.
- Evitar excesso de fontes e variações tipográficas.

### Componentes

Padronizar: Botões, Cards, Painéis, Modais, Menus, Abas, Indicadores, Ícones, Barras de progresso, Notificações, Tooltips, Controles de gameplay.

Componentes equivalentes devem compartilhar estilos, espaçamentos, estados e comportamentos.

# 3. PROTOCOLO ESPECÍFICO PARA MOBILE

Organizar os elementos por regiões funcionais:

**REGIÃO SUPERIOR ESQUERDA**: Identificação do jogador, avatar, nível, vida, arma equipada, munição, recarga.

**REGIÃO SUPERIOR CENTRAL**: Pontuação, progresso da partida, onda atual, contadores importantes, dificuldade.

**REGIÃO SUPERIOR DIREITA**: Minimapa, indicadores de localização, botão de pausa.

**REGIÃO INFERIOR ESQUERDA**: Joystick de movimentação, informações auxiliares de gameplay.

**REGIÃO INFERIOR DIREITA**: Disparo, troca de armas, recarga, habilidades, interação, controles de montaria.

Regras: não sobrepor botões, não cobrir informações importantes, não esconder a mira, não bloquear a visão dos inimigos, não posicionar notificações sobre os controles, não permitir botões cortados nas bordas, manter áreas de toque adequadas, evitar agrupamentos excessivos, manter distâncias consistentes, respeitar áreas seguras, evitar elementos pequenos demais.

# 4. HIERARQUIA VISUAL

Prioridade 1 — Gameplay: Vida, Mira, Movimentação, Disparo, Habilidades essenciais, Perigos imediatos.

Prioridade 2 — Informações da partida: Onda, XP, Pontuação, Munição, Minimapa, Estado da montaria.

Prioridade 3 — Informações secundárias: Notificações, Conquistas, Avisos de desbloqueio, Informações complementares.

Nenhuma informação secundária pode prejudicar a leitura dos elementos essenciais.

# 5. NOTIFICAÇÕES E ALERTAS

Não cobrir a HUD, não cobrir os controles, não cobrir inimigos importantes. Posições consistentes, duração adequada, evitar notificações simultâneas excessivas, agrupar informações, animações discretas, leitura rápida, não interromper o combate. Notificações importantes têm prioridade sobre mensagens informativas.

# 6. NOVAS FUNCIONALIDADES

ETAPA A — ANÁLISE: Identificar todos os elementos visuais e interações necessários.

ETAPA B — INTEGRAÇÃO: Utilizar componentes existentes sempre que possível.

ETAPA C — RESPONSIVIDADE: Adaptar para desktop, tablet e mobile.

ETAPA D — CONSISTÊNCIA: Verificar cores, fontes, ícones, espaçamentos, dimensões e hierarquia.

ETAPA E — TESTES: Verificar sobreposições, cortes, acessibilidade e funcionamento.

ETAPA F — APROVAÇÃO: Só considerar concluída quando integrada visualmente ao restante do jogo.

# 7. SISTEMA DE CONTROLES

Botões com tamanhos proporcionais, ícones reconhecíveis, estados visuais, feedback visual, espaçamento adequado, configuração centralizada, compatibilidade com teclado, mouse, controle e touchscreen. Novas ações não devem ser adicionadas sem verificar o layout atual. Quando houver excesso de botões, reorganizar hierarquicamente ou utilizar controles contextuais, sem remover funcionalidades.

# 8. MENUS, MODAIS E PAINÉIS

Hierarquia de títulos, espaçamento consistente, botões padronizados, contraste adequado, navegação intuitiva, scroll quando necessário, feedback de interação, adaptação para diferentes resoluções. Evitar painéis excessivamente grandes, textos apertados e espaços vazios desnecessários.

# 9. SISTEMA DE MONTARIAS E INTERFACES CONTEXTUAIS

Adaptar a HUD aos comandos da montaria, mostrar somente as ações disponíveis, exibir integridade e munição quando aplicável, exibir cooldown das habilidades, evitar sobreposição com os controles normais, manter a mesma identidade visual. Ao desmontar, restaurar a interface normal corretamente. Aplicar o mesmo princípio a armas especiais, habilidades e outras funcionalidades contextuais.

# 10. TESTES OBRIGATÓRIOS DE RESPONSIVIDADE

Toda alteração visual deve ser testada em: Desktop, Tablet, Celular com tela pequena, Celular com tela grande, Orientação horizontal, Orientação vertical (se suportada).

Verificar: sobreposições, cortes de elementos, botões fora da tela, textos ilegíveis, espaçamentos inconsistentes, controles difíceis de alcançar, minimapa e HUD, notificações, área útil de gameplay, performance de renderização.

# 11. REGRA DE NÃO REGRESSÃO

Toda nova implementação deve preservar a interface e os sistemas existentes. Não remover componentes sem autorização, não duplicar componentes equivalentes, não criar estilos conflitantes, não alterar posições globais sem avaliar impactos, não quebrar layouts existentes, não comprometer controles já configurados, não substituir componentes funcionais por versões inferiores. Se uma nova função exigir espaço, reorganizar os elementos de maneira planejada, respeitando a hierarquia visual.

# 12. CHECKLIST OBRIGATÓRIO ANTES DE FINALIZAR QUALQUER FUNÇÃO

[ ] Respeita o Design System.
[ ] Reutiliza componentes existentes.
[ ] Mantém a hierarquia visual.
[ ] Não cria sobreposições.
[ ] Não cobre elementos importantes.
[ ] Funciona em mobile.
[ ] Funciona em desktop.
[ ] Possui espaçamento consistente.
[ ] Possui tipografia legível.
[ ] Mantém controles acessíveis.
[ ] Não prejudica o gameplay.
[ ] Não causa regressões em outras telas.
[ ] Foi testada em diferentes resoluções.

# 13. REGRA PERMANENTE PARA TODOS OS AGENTES

Este protocolo deve ser incorporado às instruções globais de desenvolvimento do BLOCK HORDE. Todo agente que criar ou modificar gameplay, inimigos, armas, montarias, arenas, chefes, inventário, progressão, menus, HUD, notificações, configurações ou multiplayer deve obrigatoriamente respeitar este padrão. Nenhum agente está autorizado a criar interfaces isoladas que desrespeitem o Design System.

## RESULTADO ESPERADO

O BLOCK HORDE deve apresentar uma experiência visual consistente, organizada e profissional em todas as telas e funcionalidades. Toda nova implementação deve parecer parte de um único produto, e não um componente adicionado separadamente.

**REGRA FINAL: FUNCIONALIDADE NOVA NÃO SIGNIFICA INTERFACE NOVA E DESPADRONIZADA. TODA NOVA FUNÇÃO DEVE SE INTEGRAR AO UX/UI EXISTENTE.**
