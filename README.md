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
| Solo | WASD | Clique ou Espaço (mira com o mouse) | Q / E, roda do mouse, 1–9 | P ou ESC pausa |
| Co-op, jogador 1 | WASD | Espaço | Q / E | P ou ESC pausa |
| Co-op, jogador 2 | Setas | Enter, Num 0 ou L | , / . ou Shift direito | |

No teclado, a mira segue a direção do movimento e corrige levemente para o zumbi mais próximo à frente.

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
  | x4 | Escopeta |
  | x5 | Barris explosivos |
  | x6 | Pistola: disparo rápido |
  | x7 | Fuzil, que atravessa inimigos |
  | x8 | Barricadas |
  | x9 | Submetralhadora: +40% de dano |
  | x10 | Minas |
  | x12 | Escopeta: 11 projéteis |
  | x14 | Lança-foguetes |
  | x16 | Explosões maiores |
  | x18 | Fuzil: atravessa 8 inimigos |
  | x20 | Caixas de munição em dobro |

  A tela de pausa mostra a lista com o que já foi liberado.
- **Objetos que você coloca**:
  - Barris explodem quando levam tiro, e uma explosão detona outros barris por perto.
  - Barricadas bloqueiam a passagem; os zumbis desviam ou ficam batendo nelas até quebrá-las.
  - Minas explodem quando um zumbi pisa nelas.
- **Caixas** de munição e de kit médico aparecem pelo mapa.
- **Fogo amigo**: suas explosões também ferem você e seu parceiro, com dano reduzido.
- **Co-op**: quem cai volta na onda seguinte com metade da vida. A partida acaba quando os dois caem.
- **4 arenas de sobrevivência**, cada uma com estratégia própria, mais a Necrópole de bônus:

  | Arena | Dificuldade | Libera no | Evento | Chefão | O que muda no jogo |
  |---|---|---|---|---|---|
  | Cidade Abandonada | Média | início | Alarme de horda: até 3 carros disparam e chamam mortos pelo portão mais próximo | O Devorador | Carros com alarme explodem, gerador acende as ruas, marquises dão +alcance |
  | Complexo Industrial | Alta | nível 5 | Sobrecarga das máquinas: prensas e vapor aceleram, piso elétrico liga mais, luzes piscam | O Operário Mutante | Esteiras arrastam todos, prensas e vapor ferem a horda |
  | Floresta Sombria | Muito alta | nível 10 | Névoa tóxica: visão curta e dano crescente fora das ruínas e da cabana; esporos mais fortes | O Guardião da Floresta | Zumbis brotam da vegetação, árvores caem e bloqueiam trilhas |
  | Base Militar | Extrema | nível 15 | Ataque de reforços: esquadrões entram por uma entrada diferente a cada vez | O General Infectado | Torres automáticas, portões, gerador e plataformas de tiro |

  Cada arena também deixa os inimigos mais fortes, rápidos e numerosos conforme a dificuldade.
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
  data.js      armas, desbloqueios, inimigos, sobreviventes, arenas
  style.css    estilo da interface
  core/        áudio procedural e números aleatórios
portable/      BlockHorde.html, a versão de arquivo único (gerada por `npm run build:portable`)
```
