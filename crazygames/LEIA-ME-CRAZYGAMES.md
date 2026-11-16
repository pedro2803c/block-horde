# Block Horde na CrazyGames: o que já está pronto e o que falta

## O que está nesta pasta

| Arquivo | Para quê |
| --- | --- |
| `BlockHorde-crazygames.zip` | O jogo para enviar (cerca de 0,55 MB). O `index.html` fica na raiz do zip e todos os caminhos são relativos. |
| `covers/cover-landscape-1920x1080.png` | Capa horizontal (16:9) |
| `covers/cover-portrait-800x1200.png` | Capa vertical (2:3) |
| `covers/cover-square-800x800.png` | Capa quadrada (1:1) |
| `build/` | O mesmo conteúdo do zip, descompactado |

As capas foram renderizadas pelo próprio jogo. O único texto é o título, sem bordas e sem "Play".

Para gerar o zip de novo depois de mudar o jogo:

```bash
npm run build:crazygames
```

Depois disso, compacte o **conteúdo** de `crazygames/build` (não a pasta).

## O que foi feito no jogo

- **Inglês automático.** O jogo usa o idioma da conta na CrazyGames (ou do navegador). Português aparece em português; qualquer outro idioma aparece em inglês. Para forçar, use `?lang=en` ou `?lang=pt`.
- **Jogar agora.** É o primeiro botão do menu e leva à partida com 1 clique, na Cidade Abandonada. A escolha de arena e sobrevivente continua no botão de baixo.
- **Tutorial curto.** Aparece só na primeira partida solo, com 4 dicas dentro do jogo (mover, atirar, itens e armas, habilidades e pausa). Cada dica avança sozinha quando você faz a ação, e o botão "Pular" fecha tudo.
- **SDK da CrazyGames v3.** Só carrega nesta versão; o site no Vercel e o arquivo portátil não mudam.
  - O jogo avisa a plataforma do carregamento (loading start/stop) e de quando você está jogando ou não: pausa, árvore de habilidades, fim de partida e menu.
  - "happytime" dispara ao derrotar um chefão.
  - O botão de som da CrazyGames (`muteAudio`) é respeitado.
- **Salvamento na conta (`SDK.data`).** Guarda configurações, recordes, perfil/XP, builds e o estado do tutorial. O que já estava no navegador é copiado na primeira vez.
- **Anúncios.**
  - **Intervalo (midgame).** Aparece no fim de partida, ao clicar "Jogar de novo" ou "Menu principal", no máximo 1 a cada 3 minutos. O som fica mudo durante o anúncio.
  - **Com recompensa: continuar com metade da vida.** Só a partir da onda 3 e só 1 vez por partida, então não aparece em toda morte. O botão some em 10 s, e você volta com 3 s de escudo e a horda atordoada.
  - **Com recompensa: dobrar o XP de perfil da partida.**
  - Os botões têm ícone de vídeo e são opcionais. A recompensa só vem se o vídeo terminar.
  - Sem anúncios disponíveis (Basic Launch, AdBlock ou fora da CrazyGames) os botões nem aparecem, e o jogo funciona igual.

Isso foi testado com o SDK em modo local (`?useLocalSdk=true`), com anúncios simulados. Dentro da CrazyGames de verdade, confira no **QA Tool** do portal de desenvolvedor antes de enviar.

## O que você precisa fazer

1. **Criar a conta de desenvolvedor** em https://developer.crazygames.com (a conta e o aceite dos termos são seus).
2. **Gravar os 2 vídeos.** Cada um tem de 15 a 20 s, sem som, e começa mostrando a capa.
   - **Horizontal:** 1920×1080.
   - **Vertical:** proporção 2:3, por exemplo 1080×1620.

   Dica: abra o jogo, use "Jogar agora", chegue a uma onda com bastante zumbi e grave com OBS ou com a Barra de Jogo do Windows (Win+G). Depois corte e reenquadre num editor como Clipchamp ou CapCut.
3. **Enviar o jogo** (Submit game) com o zip, as 3 capas e os 2 vídeos, usando as respostas abaixo.

## Respostas sugeridas para o formulário

- **Nome:** Block Horde
- **Gênero/tags:** Shooting, Zombie, Survival, Top-down, Voxel, 2 Player
- **Plataforma:** Desktop (o jogo usa teclado e mouse; não tem controles de toque)
- **Orientação:** Horizontal
- **Classificação:** PEGI 12 (violência fantasiosa contra zumbis de blocos)
- **Progress Save:** Sim (o jogo usa o módulo de dados do SDK)
- **Idiomas:** Inglês, Português
- **Descrição (EN):**
  > Survive endless waves of a blocky zombie horde across 8 arenas, each with its own hazard event, from car alarms in the city to a cursed temple. Kill in streaks to raise your multiplier and unlock new weapons mid-match, level up a skill tree, combo abilities, and play solo or 2-player co-op on one keyboard.
- **Controles (EN):**
  > WASD: move · Mouse: aim · Click/Space: shoot · F/Right click: melee · 1-9: weapons · Z/X/C: abilities · R: ultimate · G: reload · Tab: skill tree · P: pause
  > Player 2 (co-op): arrows to move, Enter to shoot, U/I/O abilities, J ultimate

## Depois do envio

- O jogo entra primeiro no **Basic Launch**, sem anúncios: com 500 partidas em 7 dias, ou depois de 21 dias, a CrazyGames decide se vai para o **Full Launch**.
- No Full Launch os anúncios passam a funcionar sozinhos (não precisa mudar nada no jogo).
- Eles olham principalmente estas métricas:
  - tempo médio de jogo, com meta de 10 minutos ou mais;
  - retenção no dia seguinte, com meta de 10–15%;
  - conversão, ou seja, quem clica e realmente começa a jogar, com meta de 80% ou mais;
  - CTR da capa.
