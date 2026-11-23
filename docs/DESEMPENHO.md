# Desempenho — Block Horde

## Como repetir

```bash
npm run build:portable && npm run test:desempenho
# CPU 4x mais lenta (celular intermediário):
npm run test:desempenho -- --lento=4
```

O teste usa o build `portable/BlockHorde.html`, arena do Templo Antigo, qualidade `medium`, e injeta cargas fixas de inimigos. A primeira carga (15) só aquece e não entra na tabela. O bruto fica em `tests/resultado-desempenho.json` (fora do Git).

## Medição atual — 23/11/2026, CPU normal (`--lento=1`)

Carregamento até o menu: 2977 ms. Sem erros de página.

| Inimigos | Lógica (ms) | Desenho (ms) | Pior quadro (ms) | Draw calls | Triângulos (mil) | Memória (MB) |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 1,2 | 0,6 | 39,2 | 7 | 34 | 17,7 |
| 10 | 1,2 | 0,8 | 12,1 | 7 | 43 | 13,3 |
| 25 | 1,5 | 1,4 | 8,7 | 7 | 56 | 15,5 |
| 48 | 2,2 | 1,9 | 15,3 | 7 | 77 | 15,8 |
| 75 | 2,7 | 2,9 | 35,5 | 7 | 98 | 14,9 |
| 100 | 3,3 | 3,6 | 167,9 | 7 | 119 | 14,7 |
| 200 | 7,0 | 6,5 | 260,8 | 7 | 205 | 17,9 |

## Conclusão

- Até ~75 inimigos, lógica e desenho ficam bem abaixo do orçamento de 16,7 ms (60 FPS). O pior quadro isolado passa do orçamento em 0 e 75 inimigos, mas é pico de aquecimento/GC, não custo sustentado.
- Com 100 e 200 inimigos, o pior quadro passa de 167 ms e 260 ms. Há gargalo real em hordas grandes, tanto na lógica quanto no desenho. O jogo limita inimigos vivos por dificuldade (`aliveCap`, `Game.js`), então essas cargas extremas dependem do modo de jogo.
- `draw calls` se mantém em 7 porque o jogo agrupa caixas em lotes (`BoxBatch`). O custo cresce pelo número de peças enviadas, não por chamadas de desenho.
- A escala de renderização não caiu em nenhuma carga (`escala_render: 1`): o sistema de adaptação só atua no modo toque.

## Modo lento (CPU 4x)

Medido em rodada anterior (23/11/2026, 18:13): com 9 inimigos, 42 FPS e pior quadro de 57,6 ms; com 97 inimigos, 16 FPS e pior quadro de 108,8 ms. O modo lento congela antes: o orçamento de 33,3 ms (30 FPS) é estourado já com 48 inimigos.

## Limites

- O navegador de teste roda sem placa de vídeo (SwiftShader). O tempo de desenho pode ser pessimista em relação a um celular com GPU, e otimista em relação a um celular fraco.
- O teste não ouve nem vê o jogo. Qualidade de som e visual exigem verificação humana.
- Não foi testado em aparelho real.

## Bug de congelamento investigado em 23/11/2026

O bundle publicado até esta data continha `EVENT_LABEL` usado sem declaração em `src/UI.js` (`updateHud`). O primeiro evento climático de cada arena dispara `ReferenceError: EVENT_LABEL is not defined` e aborta o quadro antes do desenho — a imagem congela. Todas as 9 arenas têm evento climático, então o defeito afetava o jogo inteiro. A correção (declarar `EVENT_LABEL`) já estava no working tree e foi validada: com o evento forçado, o bundle corrigido continuou desenhando quadros e não registrou erros; o bundle publicado desenhou zero quadros e registrou o erro.
