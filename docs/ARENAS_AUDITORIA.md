# Block Horde — Auditoria das arenas (antes da reconstrução, 14/11/2026)

Backup completo do código: `src_backup_pre_arenas_2026-11-14/`.

## Arenas existentes (src/data.js → ARENAS)
| id | Nome | Piso | Construção | Chefão |
|---|---|---|---|---|
| praca | Praça Central | grass | mapa em texto (46×32): fonte, bancos, árvores, carros, caixotes | Colosso |
| armazem | Armazém 7 | concrete | mapa em texto: contêineres e caixotes | Colosso |
| cemiterio | Cemitério Velho | graveyard | mapa em texto: lápides, muros de pedra, árvores | Colosso |
| distrito | Distrito Industrial | industrial | makeMap + biblioteca de cenário (scenery.js) | Colosso |
| vale | Vale Selvagem | wild | makeMap + biblioteca de cenário | Colosso |

## Sistemas envolvidos
- `src/Arena.js`: grade de 1 m (block/tall/dyn/terrain/cover), campo de fluxo (Dijkstra) para navegação dos zumbis, chão pintado em canvas, objetos estáticos instanciados, objetos dinâmicos (props) desenhados a cada quadro, luzes dos postes (até 6).
- `src/scenery.js`: biblioteca modular (35 elementos), símbolos de mapa, `makeMap`.
- `src/Game.js`: ondas, surgimento pelos portões `G`, chefão a cada 5 ondas (`buildWave`), itens, habilidades, cenário destrutível.
- `src/monsters.js`: modelos dos inimigos e do Colosso.
- `src/core/Audio.js`: efeitos sintetizados no carregamento e música procedural (menu/ambient/combat/boss). Sem som ambiente por arena.
- Recordes salvos por `id` da arena e modo (localStorage `blockhorde_records_v1`).

## Plano de reconstrução (cada arena antiga ganha uma identidade nova; nenhuma é apagada)
| Antes | Depois | Chefão |
|---|---|---|
| Praça Central | Cidade Abandonada — Zona de Quarentena | O Devorador |
| Armazém 7 | Complexo Industrial — Fábrica dos Mortos | O Operário Mutante |
| Vale Selvagem | Floresta Sombria — Território Infectado | O Guardião da Floresta |
| Distrito Industrial | Base Militar — Última Resistência | O General Infectado |
| Cemitério Velho | Necrópole — Vale dos Lamentos (arena extra, identidade própria) | Colosso |

As arenas reconstruídas usam ids novos (recordes antigos continuam guardados, mas não se misturam com os mapas novos).
