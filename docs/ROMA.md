# EXPANSÃO ROMA ANTIGA — plano oficial (Master Director)

> **Decisões do Pedro (2026-11-18):**
> 1. Os 14 inimigos romanos aparecem **somente no Coliseu da Arena** (`id: 'coliseu'`), com `only: ['coliseu']`, junto com os zumbis comuns — mesmo padrão do Egito no Templo. Não criar arena nova.
> 2. Os 4 chefões romanos substituem o Colosso genérico **só no Coliseu**, em rodízio: `boss: ['rm_caesar', 'rm_bull', 'rm_general', 'rm_colossus']` (ondas 5, 10, 15, 20…). O `boss` (Colosso) continua chefão das outras arenas.
>
> Referência visual oficial: `C:\Users\pedro\OpenBot\Shared\BlockHorde\roma-referencia.png`. Ordem completa: `C:\Users\pedro\OpenBot\Shared\BlockHorde\roma-ordem.txt`.
> Precedente técnico a seguir: `docs/backlog/EGITO_BESTIARIO.md` (etapas 1–12 do Egito).

## Arquitetura (reutilizar, não duplicar)
- Atributos e comportamentos: `src/data.js` → `ENEMIES` (campos já existentes: `group`, `aura`, `kite`, `spit` (+`arrow`, `poison`), `lunge` (+`windup`, `time`), `blink`, `fly`/`hover`/`strafe`, `summon` (+`windup`, `types`, `max`), `static`, `regen`, `quake`, `shield`, `deathBurst`, `dodge`, `loot`, `treasure`, `sfx`, `introSfx`, `fixedHp`, `summonedOnly`, `only`).
- Ondas: `Game.buildWave` (sorteio por `from`/`weight`, `group`, tipo novo garantido na onda de estreia, chefão a cada 5 ondas com rodízio por lista).
- IA: `Game.updateZombie`; chefões com `bossKind` + `Game.bossPhase` (fases) + `Game.bossCall` (invocação) + `<kind>Tick`.
- Modelos voxel: `src/monsters.js` (`HUMANS` para humanoides, `BODIES` para corpos próprios via `body:`).
- Sons: `src/core/Audio.js` (sintetizados, prefixo próprio `rm_*`).
- Tradução: `src/i18n-en.js`.
- **IDs já ocupados (não reutilizar):** `boss` (Colosso), `general` (O General Infectado), `archer`, `chariot`, `dog`. Todos os novos usam o prefixo `rm_`.

## Balanceamento
Não inventar valores definitivos. Ponto de partida = o equivalente egípcio ou genérico indicado abaixo, ajustado só o necessário para a função; qualquer desvio grande é proposto ao Master no relatório.

## Mapa dos 14 inimigos
| # | id | Nome | Base de comportamento existente | Novo a criar | Etapa |
|---|----|------|-------------------------------|--------------|-------|
| 01 | `rm_legion` | Legionário Zumbi | `mummy` (básico, `group`) | avanço em formação (bando coeso) | 1 |
| 02 | `rm_centurion` | Centurião Infectado | `anubis` (elite, `aura`, `shield`) | reforço de formação via aura | 1 |
| 03 | `rm_archer` | Arqueiro Romano | `archer` (`kite`, `spit.arrow`) | flecha perfurante, preparação/recuperação | 1 |
| 04 | `rm_gladiator` | Gladiador Corrompido | `skeleton`/`lunge` | investida + golpe agressivo | 1 |
| 10 | `rm_hound` | Cão de Caça Infectado | `dog`/`jackal` (corpo `dog`) | caça em matilha (`group`) | 1 |
| 05 | `rm_beast` | Besta de Arena (leão) | `jackal` (`lunge`) | corpo próprio de leão | 2 |
| 06 | `rm_praetor` | Pretor Sombrio | `priest` + `summon` | fortalece aliados (roxo) | 2 |
| 07 | `rm_spirit` | Espírito do Imperador | `phantom` (`fly`, `blink`) | dano por contato espectral (azul/ciano) | 2 |
| 11 | `rm_standard` | Estandarte Legionário | `portal` (`static`) | aura de força + velocidade visível | 2 |
| 08 | `rm_catapult` | Catapulta de Cerco | `static` + explosões anunciadas dos chefões | projétil em arco com área marcada | 3 |
| 09 | `rm_elephant` | Elefante de Guerra | `construct` + `lunge.windup` | atordoar, quebrar obstáculos destrutíveis | 3 |
| 12 | `rm_engineer` | Engenheiro de Cerco | `summon` | monta armadilha/torre compatível | 3 |
| 13 | `rm_chariot` | Carruagem de Guerra | `chariot` (`lunge.windup`, `spit`) | lanças; modelo romano | 3 |
| 14 | `rm_eagle` | Águia Imperial Corrompida | `horus` (`fly`, `strafe`, mergulho) | roxa | 3 |

## Chefões (rodízio do Coliseu)
| Ordem | id / `bossKind` | Nome | Base | Etapa |
|---|---|---|---|---|
| 1 | `rm_caesar` | César Maculado | `pharaoh` (fases, invocação, área) | 4 |
| 2 | `rm_bull` | Touro do Coliseu | `sobek` (investidas, fúria) + destruir cenário | 5 |
| 3 | `rm_general` | General da Legião Sombria | `bastet`/`bossCall` (elites, comandos) | 6 |
| 4 | `rm_colossus` | O Colosso Romano | `sphinx` (multifases, impacto, ponto fraco) | 7 |

## Etapas
1. Legionário, Centurião, Arqueiro, Gladiador, Cão de Caça — Enemy AI (dados/IA) + Character (modelos) → QA (`tests/roma.test.mjs`) → Integration.
2. Besta, Pretor, Espírito, Estandarte.
3. Catapulta, Elefante, Engenheiro, Carruagem, Águia (+ Level Design: posições de cerco/aéreas no Coliseu).
4–7. Um chefão por etapa (Enemy AI + Character + UI/UX para barra/fases/alertas + QA com teste próprio).
8. Áudio (`rm_*`), recompensas (`loot`/`treasure`) e interface — Audio Designer + UI/UX.
9. Desempenho com a mistura romana — Performance Specialist.
10. Integração final, documentação e publicação.

## Progresso
- Etapa 1: QA concluído em 2026-11-21 — `tests/roma.test.mjs` 50/50 (`tests/resultado-roma.json`), print em `tests/hud-shots/roma/coliseu-5-romanos.png`; regressão de fumaça sem problemas. Falta validação em celular real e publicação.
- Etapa 2: QA concluído em 2026-11-21 — `tests/roma.test.mjs` 90/90 (Etapas 1 e 2) em 3/3 rodadas consecutivas (`tests/resultado-roma.json`), print em `tests/hud-shots/roma/coliseu-etapa2.png`. Bug corrigido em QA: `rm_praetor` (`src/data.js`) precisava de `arrow: true` em `spit` para o raio roxo (alcance 11 m) não cair no chão aos ~7,5 m.
- Etapa 3: concluída e validada em 2026-11-21 — `rm_catapult`, `rm_elephant`, `rm_engineer` (+ `rm_turret` `summonedOnly`), `rm_chariot` e `rm_eagle` integrados (dados, IA, `siegeSpot`, modelos voxel, Bestiário e tradução EN). `tests/roma.test.mjs` **139/139** em **3/3 rodadas consecutivas** (`tests/resultado-roma.json`), print em `tests/hud-shots/roma/coliseu-etapa3.png`.
- Etapas 4–7: pendentes (os 4 chefões romanos: César Maculado, Touro do Coliseu, General da Legião Sombria, O Colosso Romano).
