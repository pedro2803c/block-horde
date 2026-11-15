# BLOCK HORDE — MASTER UI DESIGN SYSTEM
## PROTOCOLO OBRIGATÓRIO DE IDENTIDADE VISUAL E CONSTRUÇÃO DE INTERFACES

Atue como Lead UI/UX Designer, Game Interface Designer e Senior UI Developer, especializado em interfaces de jogos comerciais, utilizando Godot 4.

Sua responsabilidade é garantir que TODAS as interfaces do BLOCK HORDE sigam rigorosamente o Design System oficial apresentado como referência visual.

Este documento estabelece as regras permanentes para qualquer criação, alteração, expansão ou reconstrução de interface no projeto.

A referência visual oficial é a imagem do Design System (UI KIT) fornecida pelo usuário.

IMPORTANTE: ESTE DESIGN SYSTEM É O PADRÃO VISUAL OBRIGATÓRIO DO BLOCK HORDE.

Não crie interfaces com estilos diferentes, não invente novas identidades visuais e não simplifique os componentes existentes sem autorização.

# 1. IDENTIDADE VISUAL OFICIAL

A identidade visual do BLOCK HORDE combina:

- Interface de jogo de ação e sobrevivência.
- Estética militar e tecnológica.
- Painéis escuros com profundidade.
- Bordas metálicas.
- Contornos luminosos.
- Destaques em vermelho e amarelo.
- Botões com aparência tridimensional.
- Ícones fortes e facilmente identificáveis.
- Tipografia condensada, robusta e impactante.
- Elementos gráficos de combate e sobrevivência.

A interface deve transmitir:
- Ação.
- Urgência.
- Tecnologia.
- Combate.
- Sobrevivência.
- Profissionalismo.

# 2. PALETA DE CORES OFICIAL

Utilizar os seguintes tokens como referência principal:

CORES PRIMÁRIAS:

- Amarelo principal: #FFC107
- Vermelho de combate: #E53935
- Verde de sucesso: #2ECC71
- Azul informativo: #29B6F6

CORES ESTRUTURAIS:

- Fundo principal: #0E1117
- Painel: #1B1F28
- Borda: #2E3440
- Texto principal: #EAEDEF

REGRAS:
- Amarelo representa ações principais, seleção e destaque.
- Vermelho representa perigo, exclusão, dano e ações destrutivas.
- Verde representa sucesso, confirmação e recuperação.
- Azul representa informação, escudo e elementos tecnológicos.
- Fundos devem permanecer escuros.
- Textos principais devem apresentar contraste elevado.

Não introduzir cores aleatórias que descaracterizem a identidade visual.

Cores adicionais podem ser utilizadas apenas quando necessárias para identificar categorias, raridades ou elementos específicos do gameplay.

# 3. TIPOGRAFIA

Utilizar preferencialmente:

TÍTULOS:
- Bebas Neue.
- Caixa alta.
- Peso visual forte.
- Espaçamento e proporção consistentes.

INTERFACE:
- Exo 2.
- Boa legibilidade.
- Peso médio ou semibold.
- Textos compactos e organizados.

REGRAS:
- Títulos devem ser visualmente fortes.
- Botões devem possuir textos legíveis.
- Informações secundárias devem ter hierarquia inferior.
- Não misturar fontes aleatoriamente.
- Garantir suporte a acentos e caracteres especiais do português.

Verificar se as fontes estão disponíveis no projeto antes de utilizá-las.

# 4. PADRÃO OBRIGATÓRIO DOS BOTÕES

Todos os botões devem seguir o padrão visual da referência.

BOTÃO PRIMÁRIO:
- Fundo amarelo.
- Texto escuro.
- Bordas arredondadas.
- Ícone opcional.
- Sombra e profundidade.
- Hover com brilho amarelo.
- Pressionado com efeito de profundidade.

BOTÃO SECUNDÁRIO:
- Fundo azul-acinzentado escuro.
- Texto branco.
- Borda cinza.
- Hover com contorno luminoso.

BOTÃO DE PERIGO:
- Fundo vermelho.
- Texto branco.
- Utilizado para excluir, abandonar ou ações destrutivas.

BOTÃO DE SUCESSO:
- Fundo verde.
- Texto branco.
- Utilizado para confirmar operações.

BOTÃO EXTRA:
- Fundo escuro.
- Ícones de estrela, loja, equipamento ou outras funções.

ESTADOS OBRIGATÓRIOS:
1. Normal.
2. Hover.
3. Pressionado.
4. Desabilitado.
5. Selecionado.
6. Bloqueado.
7. Carregando, quando aplicável.

Não criar botões sem estados visuais.

# 5. PADRÃO DE PAINÉIS E JANELAS

Todos os painéis devem utilizar:

- Fundo escuro.
- Bordas metálicas ou cinza-azuladas.
- Cantos arredondados.
- Sombras discretas.
- Títulos em destaque.
- Hierarquia visual organizada.
- Espaçamento interno consistente.

JANELAS DE CONFIRMAÇÃO:
- Título destacado.
- Ícone correspondente à ação.
- Descrição objetiva.
- Botão primário de confirmação.
- Botão secundário de cancelamento.
- Botão de fechar no canto superior.

JANELAS DE SELEÇÃO:
- Cards com imagens.
- Nome do item.
- Descrição.
- Indicadores de seleção.
- Estado bloqueado quando necessário.

# 6. COMPONENTES OFICIAIS

Todas as interfaces devem reutilizar componentes padronizados.

Criar e manter uma biblioteca para:

1. Botões.
2. Cards.
3. Painéis.
4. Modais.
5. Abas.
6. Dropdowns.
7. Checkboxes.
8. Toggles.
9. Sliders.
10. Barras de progresso.
11. Barras de vida.
12. Barras de experiência.
13. Indicadores de recursos.
14. Inventário.
15. Slots de equipamentos.
16. Notificações.
17. Tooltips.
18. Ícones.
19. Indicadores de mira.
20. Mapas e minimapas.
21. HUD.
22. Indicadores de missão.
23. Elementos de seleção.
24. Elementos de carregamento.

Cada componente deve possuir propriedades configuráveis e aparência consistente.

# 7. PADRÃO DE CARDS

Todos os cards devem seguir uma estrutura visual comum.

ESTRUTURA:
- Fundo escuro.
- Borda metálica.
- Imagem ou ícone principal.
- Nome do conteúdo.
- Descrição.
- Informações complementares.
- Indicador de seleção ou bloqueio.

ESTADOS:
- Normal.
- Hover.
- Selecionado.
- Bloqueado.
- Desbloqueado.
- Indisponível.

Aplicar o mesmo padrão aos cards de:
- Arenas.
- Armas.
- Personagens.
- Inimigos.
- Chefões.
- Habilidades.
- Equipamentos.
- Itens.
- Missões.
- Conquistas.

# 8. HUD — INTERFACE DURANTE O GAMEPLAY

O HUD deve seguir a identidade visual oficial sem atrapalhar a visão do jogador.

Componentes:
- Vida.
- Armadura.
- Munição.
- Arma equipada.
- Habilidades ativas.
- Recargas.
- Indicadores de recursos.
- Pontuação.
- Ondas de inimigos.
- Minimapa, quando aplicável.
- Alertas de perigo.
- Informações de missão.

REGRAS:
- Informações essenciais devem ser identificadas rapidamente.
- Não ocupar áreas desnecessárias da tela.
- Evitar excesso de elementos.
- Manter hierarquia visual.
- Utilizar cores de acordo com a função.
- Adaptar a interface à resolução.

# 9. PADRÃO DAS TELAS DO JOGO

Aplicar obrigatoriamente o Design System às seguintes telas:

MENU PRINCIPAL:
- Logo.
- Botões principais.
- Seleção de modo.
- Configurações.
- Créditos.

SELEÇÃO DE ARENAS:
- Cards de mapas.
- Imagens de pré-visualização.
- Dificuldade.
- Recordes.
- Estado bloqueado.
- Seleção de arena.

SELEÇÃO DE PERSONAGENS:
- Cards de personagens.
- Atributos.
- Equipamentos.
- Aparência.
- Botão de seleção.

ARSENAL:
- Cards de armas.
- Categorias.
- Estatísticas.
- Munição.
- Melhorias.
- Equipamentos.

HABILIDADES:
- Árvore de habilidades.
- Cards de poderes.
- Descrições.
- Recargas.
- Evolução.
- Requisitos de desbloqueio.

INVENTÁRIO:
- Slots.
- Itens.
- Quantidades.
- Equipamentos.
- Indicadores de raridade.

CONFIGURAÇÕES:
- Áudio.
- Vídeo.
- Controles.
- Idioma.
- Acessibilidade.
- Qualidade gráfica.

MULTIPLAYER:
- Seleção de jogadores.
- Lobby.
- Convites.
- Indicadores de conexão.
- Estados de espera.

RESULTADOS:
- Vitória.
- Derrota.
- Pontuação.
- Inimigos eliminados.
- Recompensas.
- Experiência.
- Progressão.

# 10. MICROINTERAÇÕES E ANIMAÇÕES

Implementar interações consistentes:

- Hover com iluminação.
- Botões com feedback de pressão.
- Cards com destaque ao selecionar.
- Transições suaves entre janelas.
- Animações de abertura e fechamento.
- Barras de progresso animadas.
- Feedback visual de desbloqueio.
- Alertas com animações.
- Indicadores de recarga.
- Efeitos de confirmação.

Evitar animações excessivas que prejudiquem a performance ou a leitura.

# 11. ÍCONES

Utilizar iconografia consistente.

Preferir:
- Ícones vetoriais.
- PNGs transparentes.
- Símbolos militares e tecnológicos.
- Ícones de armas e equipamentos.
- Símbolos de vida, escudo, energia e munição.

Todos devem possuir:
- Estilo visual compatível.
- Espessura consistente.
- Tamanho padronizado.
- Boa legibilidade.
- Contraste adequado.

Não misturar ícones realistas, flat e cartoon sem justificativa.

# 12. RESPONSIVIDADE E RESOLUÇÕES

As interfaces devem funcionar corretamente em:

- 1920 × 1080.
- 1600 × 900.
- 1366 × 768.
- 2560 × 1440.

Utilizar containers, anchors, containers de layout e escalabilidade apropriada da Godot.

Não posicionar todos os elementos exclusivamente por coordenadas fixas.

Garantir que textos, botões e painéis não sejam cortados.

# 13. ARQUITETURA DO DESIGN SYSTEM

Criar uma estrutura centralizada e reutilizável.

Sugestão de organização:

res://UI/
    DesignSystem/
        Themes/
        Fonts/
        Colors/
        Icons/
        Components/
            Buttons/
            Cards/
            Panels/
            Modals/
            Tabs/
            Inputs/
            ProgressBars/
            Notifications/
        HUD/
        Screens/
            MainMenu/
            ArenaSelection/
            CharacterSelection/
            Arsenal/
            Skills/
            Inventory/
            Settings/
            Multiplayer/
            Results/

Utilizar Theme Resources, cenas reutilizáveis e componentes compartilhados sempre que apropriado.

Não duplicar componentes quando já existir uma versão oficial.

# 14. REGRAS DE CONSISTÊNCIA

Estas regras são permanentes:

- Toda interface nova deve seguir o Design System.
- Toda interface antiga deve ser adaptada quando for revisada.
- Não criar uma segunda identidade visual.
- Não utilizar cores fora da paleta sem justificativa.
- Não utilizar tipografias aleatórias.
- Não criar botões com estilos inconsistentes.
- Não misturar padrões de cards.
- Não criar painéis sem hierarquia.
- Não reduzir a qualidade visual para acelerar a implementação.
- Não substituir componentes oficiais sem necessidade.
- Não alterar funcionalidades para adequar visualmente uma interface.

Quando houver dúvida sobre o estilo, consultar primeiro a referência visual oficial e os componentes existentes.

# 15. PROTOCOLO OBRIGATÓRIO ANTES DE CADA IMPLEMENTAÇÃO

Antes de criar qualquer tela ou componente:

1. Consultar o Design System oficial.
2. Verificar se o componente já existe.
3. Reutilizar a versão oficial sempre que possível.
4. Identificar os tokens de cor, tipografia, bordas e espaçamentos.
5. Planejar a hierarquia visual.
6. Implementar a interface.
7. Comparar visualmente com a referência.
8. Testar todos os estados.
9. Verificar responsividade.
10. Corrigir divergências.

Não considerar uma interface concluída apenas porque está funcional.

Ela precisa estar funcional E visualmente consistente.

# 16. VALIDAÇÃO VISUAL

Após implementar qualquer interface:

- Capturar screenshot.
- Comparar com o Design System.
- Verificar alinhamentos.
- Verificar espaçamentos.
- Verificar proporções.
- Verificar cores.
- Verificar tipografia.
- Verificar estados de interação.
- Verificar consistência entre componentes.

Corrigir as divergências encontradas antes de finalizar.

# 17. REGRA MESTRA

O DESIGN SYSTEM DO BLOCK HORDE É A FONTE OFICIAL DE VERDADE PARA TODA A INTERFACE DO JOGO.

Nenhuma tela, menu, janela, painel, botão, card, HUD ou componente poderá adotar um estilo visual independente.

Toda nova funcionalidade deverá nascer visualmente integrada ao sistema existente.

Não quero interfaces genéricas de Godot.

Quero uma interface de jogo comercial, consistente, moderna, tecnológica, militar e visualmente reconhecível como BLOCK HORDE.

Sempre priorize:
1. Consistência visual.
2. Reutilização de componentes.
3. Qualidade profissional.
4. Clareza e usabilidade.
5. Performance.
6. Fidelidade à referência.

Este protocolo deve ser considerado obrigatório durante todo o desenvolvimento futuro do BLOCK HORDE.