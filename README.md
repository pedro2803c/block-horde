# BLOCK HORDE

Jogo original de sobrevivência em ondas, com câmera de cima, personagens "cabeça de caixa" e co-op local para 2 jogadores no mesmo teclado. Roda no navegador.

Matar zumbis em sequência enche o **multiplicador**. Cada novo nível de multiplicador libera armas e melhorias, que ficam com você até o fim da partida.

Feito com Three.js (WebGL), JavaScript (ES modules), Vite e Web Audio API. Personagens, cenário, sons e música são todos gerados por código: não há arquivos de imagem nem de áudio.

## Versão portátil (sem servidor e sem internet)

Abra **`portable/BlockHorde.html`** com dois cliques: o jogo abre direto no navegador (Chrome, Edge ou Firefox), sem `npm`, sem servidor local e sem internet. É um arquivo só (~1 MB), com código, estilos e fontes dentro, que pode ser copiado para um pendrive ou enviado para outra pessoa.

- Os recordes e as configurações ficam salvos no navegador, separados dos da versão `localhost`.
- Para gerar o arquivo de novo depois de mudar o código:

```bash
npm run build:portable
```

## Versão online

O jogo está publicado em **https://block-horde.vercel.app** (projeto `block-horde` na Vercel). Para publicar uma versão nova:

```bash
npm run build:portable
```

Depois copie `portable/BlockHorde.html` para `publish/block-horde/index.html` e, dentro de `publish/block-horde`, rode:

```bash
npx vercel deploy --prod
```

## Versão CrazyGames

`npm run build:crazygames` gera `crazygames/build` com o SDK da CrazyGames v3. O pacote pronto para envio fica em `crazygames/BlockHorde-crazygames.zip`, as capas em `crazygames/covers` e o passo a passo em [crazygames/LEIA-ME-CRAZYGAMES.md](crazygames/LEIA-ME-CRAZYGAMES.md).

O SDK fica inerte fora da CrazyGames. Ele cuida de três coisas:

- **Eventos de jogo:** carregamento, início e fim de jogo, `happytime` e `muteAudio`.
- **Salvamento:** os dados vão para a conta pelo `SDK.data`.
- **Anúncios:**
  - de intervalo, no fim de partida, no máximo 1 a cada 3 min;
  - com recompensa, para continuar com metade da vida (1 vez por partida, a partir da onda 3) ou dobrar o XP de perfil.

Em todas as versões:

- **Idioma:** a interface troca para inglês sozinha quando o idioma não é português (`?lang=en` ou `?lang=pt` forçam).
- **Menu:** o primeiro botão é "Jogar agora".
- **Primeira partida solo:** aparecem 4 dicas curtas, que podem ser puladas.

Para testar o SDK localmente, use `?useLocalSdk=true`.

## Como iniciar (desenvolvimento)

Requisitos: Node.js 18 ou mais recente e um navegador com WebGL (Chrome, Edge ou Firefox).

```bash
npm install
```

```bash
npm run dev
```

Abra **http://localhost:5174**.

Versão de produção:

```bash
npm run build
```

```bash
npm run preview
```

O preview abre em http://localhost:4174. A pasta `dist/` pode ser publicada em qualquer hospedagem estática.

## Controles

| Modo | Mover | Atirar | Trocar arma | Outros |
|---|---|---|---|---|
| Solo | WASD | Clique ou Espaço (mira com o mouse) | Q / E, roda do mouse, 1–9, 0 e - (grupos) | G recarrega · P ou ESC pausa |
| Co-op, jogador 1 | WASD | Espaço | Q / E | G recarrega · P ou ESC pausa |
| Co-op, jogador 2 | Setas | Enter, Num 0 ou L | , / . ou Shift direito | H ou Num 3 recarrega |

No teclado, a mira segue a direção do movimento e corrige levemente para o zumbi mais próximo à frente.
As teclas 1–9, 0 e - escolhem um **grupo** de armas; apertar de novo a mesma tecla alterna entre as armas do grupo (o HUD mostra quantas o grupo tem).

## Como funciona

- **Ondas**:
  - Cada onda traz mais zumbis do que a anterior, entrando pelos portões amarelos da arena.
  - Novos tipos aparecem aos poucos; o primeiro de cada tipo vem garantido na onda em que é liberado. A tela **Inimigos**, no menu, mostra todos em 3D.
- **Inimigos** (modelos 3D feitos de caixas):

  | Inimigo | Desde | O que faz |
  |---|---|---|
  | Zumbi | onda 1 | Básico e numeroso |
  | Corredor | onda 2 | Muito rápido |
  | Explosivo | onda 3 | Cinto de dinamite: explode quando chega perto |
  | Cão Mutante | onda 3 | Rápido; dá botes curtos em linha reta |
  | Aranha Mutante | onda 4 | Rápida, anda em zigue-zague |
  | Cuspidor | onda 4 | Para a distância e cospe ácido |
  | Brutamontes | onda 5 | Muita vida e soco forte |
  | Morcego Demoníaco | onda 5 | Voa por cima de paredes e obstáculos |
  | Blindado | onda 6 | O escudo tira 85% do dano de tiros de frente; atire pelas costas ou use explosivos |
  | Invocador | onda 7 | Mantém distância e invoca até 6 reforços |
  | Esporo | onda 8 | Lento; finca raiz e lança esporos que deixam uma nuvem tóxica no chão (também ao morrer) |

- **A cada 5 ondas surge o Colosso**, chefão com barra de vida e três ataques, todos com aviso no chão:
  - investida em linha reta (faixa vermelha);
  - pancada no chão quando o jogador chega perto (anel vermelho);
  - pedra arremessada de longe (anel laranja onde ela vai cair).
- **Multiplicador**:
  - Cada abate enche a barra; com a barra cheia, o multiplicador sobe.
  - Se você ficar sem matar, a barra esvazia e o multiplicador cai.
  - Os pontos de cada abate são multiplicados pelo valor atual.
- **Desbloqueios** (permanentes na partida):

  | Mult. | Desbloqueio |
  |---|---|
  | x2 | Submetralhadora |
  | x3 | Granadas |
  | x4 | Escopeta tática · Barreira de espinhos |
  | x5 | Barris explosivos · Granada incendiária |
  | x6 | Pistola: disparo rápido · Lança-ácido |
  | x7 | Fuzil de assalto MK-5, que atravessa inimigos |
  | x8 | Barricadas · Granada congelante |
  | x9 | Submetralhadora: +40% de dano · Canhão criogênico |
  | x10 | Minas terrestres · Mina de proximidade |
  | x11 | Rifle de precisão · Cerca elétrica |
  | x12 | Escopeta: 11 projéteis · Lança-chamas |
  | x13 | Dinamite · Granada EMP |
  | x14 | Lança-foguetes · Granada tóxica |
  | x15 | Machado · Metralhadora pesada |
  | x16 | Explosões maiores · Torre de gelo |
  | x17 | Lança-granadas |
  | x18 | Fuzil: atravessa 8 inimigos · Torre de fogo |
  | x19 | Rifle de plasma |
  | x20 | Caixas de munição em dobro · Torre de laser |

  A tela de pausa mostra a lista com o que já foi liberado.
- **Carregador e recarga**: as armas de fogo têm pente (pistola 12, submetralhadora 40, fuzil 30, metralhadora 100...). O pente vazio recarrega sozinho; G recarrega antes. A escopeta carrega cartucho por cartucho e atirar interrompe a recarga. Trocar de arma cancela a recarga. O HUD mostra "pente / reserva" e uma barra de recarga; o personagem baixa a arma e um anel amarelo se completa em volta dele.
- **Arsenal** (dados em `src/data.js`, modelos em `src/items.js`, lógica em `src/arsenal.js`):

  | Arma | Categoria | Destaque |
  |---|---|---|
  | Fuzil de assalto MK-5 | Rifle de assalto | Automático, atravessa 3, recuo leve progressivo |
  | Escopeta tática | Curta distância | 7 projéteis, perde dano com a distância, recarga por cartucho |
  | Submetralhadora | Submetralhadora | Cadência altíssima; a dispersão cresce a cada disparo seguido |
  | Rifle de precisão | Sniper | Dano 120, luneta, atravessa 4 |
  | Metralhadora pesada | Suporte pesado | Cinto de 100, coice que empurra e passos curtos atirando |
  | Lança-chamas | Especial | Cone de fogo, incendeia, deixa fogo no chão, detona barris, queima madeira |
  | Lança-granadas | Explosiva | Arco balístico, explode no impacto, ricocheteia até 2 vezes |
  | Rifle de plasma | Energia | Projétil luminoso, atravessa 2, estouro de energia no impacto |
  | Canhão criogênico | Controle | Gela e congela inimigos comuns; chefões só ficam lentos |
  | Lança-ácido | Corrosiva | Corrosão por 4 s, poça ácida, derrete escudos e blindagem |

- **Efeitos e resistências**: fogo (queima), gelo (lentidão e congelamento), ácido (corrosão) e EMP. Cada inimigo tem resistências próprias (`RESIST` em `src/data.js`): o Guardião da Floresta queima mais, o Operário Mutante resiste a fogo, sofre com ácido e desliga com EMP, o Espectro é sensível a energia.
- **Granadas especiais**: EMP (desliga mecânicos 4 s), incendiária (fogo por 6 s), congelante e tóxica (nuvem de 8 s que não fere o time).
- **Equipamentos**: colete, capacete, mochila, **botas de velocidade** (+15% até cair) e **exoesqueleto temporário** (20 s: -45% de dano, golpes 60% mais fortes, imune a lentidão). Escudo, drone e torreta existem como habilidades.
- **Objetos que você coloca** (durabilidade, alcance e bateria em `TRAPS`, `src/data.js`):
  - Barris explodem quando levam tiro, e uma explosão detona outros barris por perto.
  - Barricadas bloqueiam a passagem; os zumbis desviam ou ficam batendo nelas até quebrá-las.
  - Minas terrestres explodem quando um zumbi pisa; a **mina de proximidade** detecta a 2,4 m e explode em 4 m.
  - **Barreira de espinhos**: andável, fere e atrasa quem passa e se gasta com o uso.
  - **Cerca elétrica**: bloqueia e dá choques que atordoam (40 descargas).
  - **Torres de laser, fogo e gelo**: miram sozinhas, têm 90 s de bateria e podem ser destruídas pela horda.
- **Caixas** de munição e de kit médico aparecem pelo mapa.
- **Fogo amigo**: suas explosões também ferem você e seu parceiro, com dano reduzido.
- **Co-op**: quem cai volta na onda seguinte com metade da vida. A partida acaba quando os dois caem.
- **7 arenas de sobrevivência**, cada uma com estratégia própria, mais a Necrópole de bônus:

  | Arena | Dificuldade | Libera no | Evento | Chefão | O que muda no jogo |
  |---|---|---|---|---|---|
  | Cidade Abandonada | Média | início | Alarme de horda: até 3 carros disparam e chamam mortos pelo portão mais próximo | O Devorador | Carros com alarme explodem, gerador acende as ruas, marquises dão +alcance |
  | Complexo Industrial | Alta | nível 5 | Sobrecarga das máquinas: prensas e vapor aceleram, piso elétrico liga mais, luzes piscam | O Operário Mutante | Esteiras arrastam todos, prensas e vapor ferem a horda |
  | Floresta Sombria | Muito alta | nível 10 | Névoa tóxica: visão curta e dano crescente fora das ruínas e da cabana; esporos mais fortes | O Guardião da Floresta | Zumbis brotam da vegetação, árvores caem e bloqueiam trilhas |
  | Base Militar | Extrema | nível 15 | Ataque de reforços: esquadrões entram por uma entrada diferente a cada vez | O General Infectado | Torres automáticas, portões, gerador e plataformas de tiro |
  | Coliseu da Arena | Alta | nível 3 | Prova de sobrevivência: portões abrem, espinhos aceleram, abates valem o dobro e quem sobrevive ganha suprimentos | O Colosso | Portões monumentais e túneis por onde a horda entra, armadilhas de espinhos, centro aberto para o chefão |
  | Laboratório de Pesquisa | Muito alta | nível 7 | Quebra de contenção: cápsulas soltam criaturas e tanques vazam | O Devorador | Painel holográfico tranca as portas automáticas, tanques biológicos e químicos destrutíveis, totem médico |
  | Templo Antigo | Extrema | nível 12 | Maldição do templo: escuridão, hieróglifos acesos, lâminas mais rápidas, portais e sarcófagos soltam mortos | O Guardião da Floresta | Placas de pressão com dardos, lâminas giratórias, portais mágicos, alavanca, portas secretas e câmara de desafio |

  Cada arena também deixa os inimigos mais fortes, rápidos e numerosos conforme a dificuldade.
- **Objetos interativos** (lógica em `src/world.js`): todos mostram o estado numa luz (cinza desativado, verde disponível, amarelo ativado, vermelho danificado; destruído some). Tanque químico (nuvem tóxica ao quebrar), totem médico (cura em área, recarga de 35 s), portal de onda (ponto de surgimento), gerador e painéis.
- **Biblioteca de cenário** (`src/scenery*.js`, tela **Cenário**): 169 elementos, incluindo a biblioteca modular de 7 materiais (concreto, metal, tijolo, pedra, arenito, vidro, grade) × 8 variações (inteiro, danificado, destruído, coluna, canto, piso, rampa, plataforma), com 1 m de base e símbolo de mapa próprio.
- **Partículas de ambiente** por arena (poeira, cinzas, brasas, faíscas, vapor, esporos, areia), leves para não atrapalhar o combate.
- **Nível de perfil**: toda partida rende XP de perfil (pontos ÷ 10 + 20 por onda), salvo no navegador. Ele libera as arenas; recordes antigos contam na primeira vez.
- **Sangue e queimaduras**: as manchas de sangue e as marcas de explosão ficam pintadas no chão até o fim da partida.
- **Recordes**: um por arena e modo (solo e co-op), salvos no navegador.
- **Telas**:
  - Carregamento com progresso real da geração dos sons.
  - Menu com uma arena animada ao fundo.
  - Escolha de personagem com modelos 3D girando: Sgt. Barros (soldado camuflado), Rubro (demônio blindado), Vetor (ciborgue com visor brilhante) e Lia (paramédica). Muda só a aparência.
  - Escolha de arena com miniatura 3D da arena real, cartão selecionado em destaque e botão Jogar.
  - Configurações: volumes (sliders), qualidade gráfica (select) e FPS (toggle).
  - Controles em abas (Solo, Jogador 1, Jogador 2), recordes, pausa com lista de desbloqueios, fim de jogo e créditos.
- **Interface (design system)**:
  - Paleta: primária #FFC107, ação #E53935, sucesso #2ECC71, info #29B6F6, fundo #0E1117, painel #1B1F28, borda #2E3440, texto #EAEDEF.
  - Tipografia: Bebas Neue nos títulos e números, Exo 2 no restante.
  - Botões primário, secundário, perigo e sucesso, com ícone, brilho no foco e estado desabilitado; botões-ícone quadrados.
  - Janelas com borda vermelha, título com "///" e botão X (ESC também fecha).
  - HUD: indicadores de pontos, onda e zumbis restantes; barra do multiplicador; avatar 3D de cada jogador; barra de vida; slots de armas com ícones; radar; mira; barra do chefão; notificações (desbloqueio, onda concluída, vida baixa).

## Testes realizados

Os testes rodaram no navegador embutido, com um bot automatizado chamando o loop do jogo. Nesses testes a mira do bot é perfeita e, em parte deles, o personagem estava invencível.

- **Solo**: 20 minutos de jogo (onda 19), até 60 zumbis vivos ao mesmo tempo. A atualização da lógica levou cerca de 0,15 ms por quadro.
  - Três chefões apareceram e foram derrotados.
- **Inimigos novos**: cada tipo foi criado ao lado do jogador e observado por 10 s de simulação.
  - O cão deu botes, o Invocador chamou reforços, o Esporo criou nuvens e o Colosso usou investida, pancada e pedra.
  - Escudo do Blindado: um tiro de 10 tirou 1,5 de vida pela frente e 10 pelas costas.
  - Um bot jogou até a onda 12 com todos os tipos aparecendo, sem erros, com cerca de 0,36 ms por atualização.
  - A sequência de desbloqueios funcionou até x13.
- **Co-op**: os dois jogadores caíram até o fim de jogo. A tela de fim e o recorde salvo foram conferidos.
- **Teclado real**, com eventos de tecla disparados no navegador:
  - Jogador 1 e jogador 2 se movem, atiram e trocam de arma.
  - ESC pausa e retoma a partida.
- **Objetos colocados e armas**:
  - Um zumbi preso por um anel de barricadas quebrou uma delas e chegou ao jogador.
  - A mina detonou com o bruto em cima.
  - O foguete causou dano no bruto.
  - Os dois barris explodiram em cadeia.
- **Menus**: fluxo completo (menu → personagem(ns) → arena → partida) e pausa com continuar, reiniciar e sair para o menu.
- `npm run build` sem erros, e nenhum erro no console.

Bugs encontrados e corrigidos nesses testes:

- Zumbis colados no jogador não levavam tiro: o disparo saía da ponta da arma, já à frente deles.
- O bruto atacava através da quina de contêineres.
- Zumbis que enxergavam o jogador tentavam ir em linha reta e travavam em bancos, lápides e barricadas.
- O multiplicador caía rápido demais.
- O inchado e as explosões próprias tiravam vida demais.
- A câmera ficava próxima demais em telas estreitas.

### Rodada de estresse (arenas novas)

Um bot jogou sozinho em todas as arenas: andou, fugiu, atirou, trocou de arma, usou habilidades e foi até os consoles. A cada quadro, o teste conferiu posições inválidas, vida e erros.

- 10 minutos por arena (até a onda 13), com todos os chefões, mais co-op e partidas com morte e reinício. Nenhum erro e nenhum vazamento de memória (geometrias e texturas estáveis).
- Carga máxima: 61 inimigos de todos os tipos e 2 jogadores, com cerca de 7 ms por quadro (lógica, montagem e desenho).
- Lógica do jogo: de 1,65 ms para cerca de 0,2 ms por quadro numa partida normal.
- Todas as armas, telas do menu, pausa, árvore de habilidades e troca de qualidade no meio da partida.

Bugs encontrados e corrigidos nessa rodada:

- **Piso elétrico**: não atordoava zumbis novos, porque o atordoamento virava NaN.
- **Esteiras**: só arrastavam zumbis que já tinham sido atordoados antes.
- **Espectro**: o teletransporte da descrição não existia; agora ele some e reaparece mais perto.
- **Base Militar**: o jogador nascia na quina do console da torre, preso pela metade. O nascimento agora procura um ponto livre, e a colisão empurra para fora quem fica exatamente na borda de um bloco.
- **Barris e caixas empurrados**: podiam parar por cima de zumbis ou jogadores, porque o teste de espaço tratava a célula como círculo.
- **Ferrões da Vespa**: saíam verdes como ácido, e não amarelos.
- **Barril, barricada ou mina sem espaço**: a tentativa contava como disparo nas estatísticas.
- **XP de perfil**: na primeira partida, o recorde recém-salvo era creditado duas vezes.

Otimizações:

- **HUD**: só toca no DOM quando um valor muda.
- **Radar**: redesenha a 20 Hz.
- **Dano**: a animação de dano não força mais recálculo de layout.
- **Linha de tiro**: percorre a grade célula a célula (DDA) em vez de amostrar a cada 12 cm.
- **Caminho dos zumbis**: fila de prioridade em vetor tipado.
- **Voxels**: matrizes escritas direto, cores em cache e envio à GPU só da parte usada.
- **Listas por quadro**: compactadas no lugar, sem gerar lixo para o coletor.

### Expansão do arsenal e das arenas

- Cada uma das 26 armas e estruturas foi disparada contra inimigos de teste: todas causaram dano, e as estruturas foram colocadas e funcionaram.
- Recarga: a submetralhadora esvaziou 40 tiros, recarregou sozinha (40 / 60 na reserva) e abriu a dispersão até o limite. A escopeta recarregou cartucho a cartucho (2 → 3 → 6).
- Efeitos: o lança-chamas incendiou (3 s) e deixou fogo no chão; o criogênico congelou o zumbi comum e só gelou o chefe (limite de 60); a EMP desligou o Operário por 4 s; a granada congelante congelou o corredor e só gelou o brutamontes (resistente); o ácido corroeu e deixou poça; a nuvem tóxica feriu a horda e não o jogador.
- Armadilhas: espinhos atrasaram e se desgastaram, a cerca gastou descargas, a torre de gelo congelou e a de laser desligou ao fim da bateria.
- Arenas novas: todos os portões e pontos de surgimento alcançam os jogadores. Objetos: contenção do laboratório (portas trancadas e evento encerrado), totem (cura e recarga), espinhos (45 de dano), placa de pressão (6 dardos), lâmina, alavanca e portas secretas, portais mágicos, altar (elite e 2 caixas de recompensa), vidro quebrando a tiros.
- 2.400 quadros em co-op em cada uma das 8 arenas com o arsenal inteiro: nenhum erro e nenhum valor inválido, cerca de 0,2 ms de lógica por quadro.
- Carga: 80 inimigos, 18 áreas no chão e 6 torres com lança-chamas e metralhadora atirando: 1,3 ms por quadro (lógica e montagem), pior quadro 6,8 ms.

## Limitações conhecidas

- O balanceamento foi ajustado com o bot, não com jogadores humanos. As ondas acima de 20 não foram testadas.
- O co-op é só local, no mesmo teclado. Alguns teclados não registram muitas teclas apertadas ao mesmo tempo, o que pode atrapalhar dois jogadores.
- Não há suporte a controle (gamepad) nem a telas de toque.
- As fontes (Bebas Neue e Exo 2) vêm dos pacotes `@fontsource` e ficam embutidas no jogo; nada é baixado da internet.
- `?test` no endereço (por exemplo, http://localhost:5174/?test) faz a partida continuar quando a aba fica em segundo plano. Serve só para testes automatizados.

## Estrutura

```
src/
  main.js      ponto de entrada
  Game.js      partida: jogadores, zumbis, armas, ondas, multiplicador, explosões, câmera
  Arena.js     mapa em grade, colisão, linha de tiro, caminho dos zumbis, chão pintado
  render.js    lote de caixas instanciadas, esqueleto dos personagens com acessórios, partículas
  monsters.js  modelos 3D dos 12 inimigos (humanoides com peças extras; aranha, morcego, cão e esporo com esqueleto próprio)
  Preview.js   renderizador dos modelos 3D nas telas de escolha e de inimigos
  UI.js        menus, janelas, HUD, radar e notificações (componentes do design system)
  icons.js     ícones SVG da interface e silhuetas das armas
  Input.js     teclado compartilhado e mouse
  data.js      armas, estruturas, resistências, desbloqueios, inimigos, sobreviventes, arenas
  items.js     modelos e catálogo de itens, armas na mão, armadilhas e equipamento no corpo
  arsenal.js   carregador e recarga, efeitos elementais, áreas no chão, projéteis novos, armadilhas e torres
  world.js     objetos interativos (estados), eventos do laboratório, coliseu e templo, partículas de ambiente
  scenery.js   biblioteca de cenário (scenery2.js e scenery3.js: expansões temáticas e blocos modulares)
  crosshairs.js miras
  style.css    estilo da interface
  core/        áudio procedural e números aleatórios
portable/      BlockHorde.html, a versão de arquivo único (gerada por `npm run build:portable`)
```
