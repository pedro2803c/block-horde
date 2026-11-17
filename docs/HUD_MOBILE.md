# Block Horde — HUD mobile (v2)

Só vale com `body.touch`; o PC não muda. Estilos no bloco "HUD MOBILE v2" de `src/style.css`.

## Regiões
| Região | Conteúdo |
|---|---|
| Topo esquerdo | Cartão do jogador: retrato, nome, nível, +pt, XP, vida, arma e munição; bônus embaixo do retrato |
| Topo central | Pontos, onda, inimigos, dificuldade (só ícone em telas < 700 px) e multiplicador fino; chefe e dica logo abaixo (`--hud-top-b`, medido pelo jogo) |
| Topo direito | Pausa (44 px) e radar |
| Centro | Livre: sem caixas nem avisos |
| Inferior esquerdo | Joystick e "Tiro automático" |
| Inferior direito | Arma/ataque (74 px, destaque amarelo), faca, recarregar, 3 habilidades e ultimate (54 px) |

## Design system mobile (tokens em `body.touch`)
Espaço `--m-1..4` (4/8/12/16), fonte `--m-fs-xs..l` (10,5/12/14/18), ícone `--m-ic-s/m`, raio `--m-r`/`--m-r-s`, superfície `--m-surface`, linha `--m-line`, sombra `--m-shadow`, área segura `--m-st`, largura do cartão `--m-card-w`, coluna direita `--m-right-w`.

## Personalização
Tamanho dos botões (0,9–1,4; mínimo garante toque ≥ 44 px) e "Controles para canhoto" (joystick à direita, botões espelhados à esquerda).

## Teste
`npm run build:portable && npm run test:hud -- --tag=nome` gera prints em `tests/hud-shots/<tag>/` (7 telas × 9 cenas) e acusa sobreposição, ocupação do centro, toque < 44 px e fonte < 10 px.
