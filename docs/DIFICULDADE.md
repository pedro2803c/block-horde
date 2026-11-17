# Block Horde — Dificuldade

Configuração central: `src/difficulty.js` (multiplicadores por nível). A dificuldade escolhida se soma à dificuldade própria de cada arena (`arena.diff`), que continua igual.

| Multiplicador | Onde é aplicado (um único ponto) |
|---|---|
| enemyHp / bossHp | `Game.spawnZombie` (vida inicial) |
| enemyDmg | `Game.damagePlayer` (todo dano recebido) |
| enemySpeed | `Game.spawnZombie` (velocidade) |
| aggression | `Game.updateZombie` (intervalo após cada ataque, 3 tipos de ataque) |
| count | `Game.buildWave` (inimigos por onda) |
| spawnRate | `Game.updateWaves` (intervalo entre aparecimentos) |
| aliveCap | `Game.aliveCap` (máximo vivos ao mesmo tempo) |
| resources | chance de item em objetos destruídos e limite de itens no mapa |
| xp | `Game.gainXp` (XP na partida) e XP de perfil no fim |

- Escolha antes de toda partida (Jogar agora e Escolher arena). Fica salva em `settings.difficulty`.
- A partida guarda a dificuldade do início (`matchDiff`); reiniciar mantém. Trocar em Configurações (com confirmação) vale da próxima partida em diante e não apaga progresso.
- Recordes gravam a dificuldade (`diff`) junto do resultado.
- Menu/demonstração sempre em Normal.
- Teste: `npm run build:portable && npm run test:dificuldade` mede no jogo vida, chefe, velocidade, inimigos por onda, máximo vivos, dano, XP, intervalo de ataque e de aparecimento.
- Não existe "Academia de Treinamento" nem campanha no jogo atual: há partidas por arena e um tutorial curto na primeira partida.
