# BACKLOG — Bestiário Egito Antigo (guardado, ainda não implementado)

> **Regra do Pedro (2026-11-17): estes 14 inimigos e 4 chefões aparecem SOMENTE na arena do Egito.** Não entram no sorteio das outras arenas.
> **Arena definida pelo Pedro: Templo Antigo (`id: 'templo'`).** A "arena do Egito" é ela; não criar arena nova.
> **Progresso:** Etapas 1–3 feitas (2026-11-17): estrutura `only`/`group`/`aura`/`kite`/`deathBurst`/veneno + Múmia Guerreira, Guardião Anúbis, Arqueiro do Deserto, Escaravelho Gigante. Teste: `npm run test:egito`. Etapa 4 feita: Serpente Sagrada, Sacerdote Profano, Fantasma do Faraó, Construto de Areia (`regen`, `quake`, veneno na mordida, maldição com lentidão, cor do teletransporte). Etapa 5 feita: Escorpião Imperial, Híbrido Chacal, Portal das Almas (`static`, `summon.windup`), Esqueleto de Faraó (`dodge`). Próxima: Etapa 6 (Carruagem Maldita, Hórus Corrompido).
> Especificação original abaixo. O texto fala em Godot 4, mas o projeto é Three.js: adaptar aos sistemas existentes (`src/data.js` ENEMIES, `src/monsters.js`, `Game.buildWave/updateZombie`).

---

# BLOCK HORDE — EXPANSÃO EGITO ANTIGO
## Implementação completa de inimigos, chefões e inteligência artificial
### Godot 4 | 3D Voxel | Gameplay

Você é o desenvolvedor responsável por implementar o BESTIÁRIO EGITO ANTIGO no projeto BLOCK HORDE.

A imagem anexada é a referência visual oficial e obrigatória dos novos inimigos e chefões.

Sua missão é transformar todos os personagens apresentados na imagem em entidades completas e funcionais dentro do jogo.

IMPORTANTE: não criar somente modelos 3D. Cada inimigo precisa ter IA, comportamento, ataques, atributos, animações, colisões, efeitos, áudio e integração com o sistema de ondas.

# 1. REGRAS DE DESENVOLVIMENTO

- Trabalhar no projeto BLOCK HORDE existente.
- Não criar outro projeto.
- Não apagar funcionalidades existentes.
- Não duplicar sistemas já implementados.
- Auditar a arquitetura atual antes de começar.
- Reutilizar sistemas existentes de combate, dano, IA, animação, ondas e progressão.
- Manter o padrão visual oficial do BLOCK HORDE.
- Criar assets individuais para cada criatura.
- Não utilizar a imagem de referência como textura ou modelo.
- Não declarar funcionalidades concluídas sem testar.

Antes de desenvolver, identificar os sistemas e arquivos que serão reutilizados e apresentar o plano de implementação.

# 2. DIREÇÃO VISUAL

Todos os personagens devem seguir a imagem de referência:

- Estilo 3D voxel/cartoon.
- Formas geométricas e blocadas.
- Silhuetas marcantes.
- Proporções caricatas.
- Cores fortes e contrastantes.
- Armaduras e acessórios egípcios.
- Olhos luminosos.
- Efeitos mágicos e sobrenaturais.
- Materiais estilizados.

Paleta temática:
- Dourado.
- Areia.
- Azul imperial.
- Roxo mágico.
- Verde venenoso.
- Vermelho.
- Preto e pedra envelhecida.

Manter escala e proporções compatíveis com os personagens existentes.

# 3. OS 14 INIMIGOS

Implementar individualmente:

## 01 — MÚMIA GUERREIRA
Função: inimigo básico e numeroso.

Aparência:
- Corpo coberto de bandagens.
- Armadura egípcia danificada.
- Olhos vermelhos.
- Detalhes dourados.

IA:
- Persegue o jogador.
- Ataca corpo a corpo.
- Surge em grupos.
- Pode aparecer em tumbas e portais.

Animações: idle, caminhada, corrida, ataque, dano e morte.

## 02 — GUARDIÃO ANÚBIS
Função: elite defensiva.

Aparência:
- Cabeça de chacal.
- Armadura dourada e azul.
- Machado cerimonial.
- Olhos luminosos.

IA:
- Protege inimigos próximos.
- Bloqueia ataques.
- Executa golpes pesados.
- Persegue o jogador.

## 03 — ARQUEIRO DO DESERTO
Função: ataque à distância.

Aparência:
- Armadura egípcia.
- Arco dourado.
- Flechas luminosas.

IA:
- Mantém distância.
- Procura posições elevadas.
- Dispara flechas envenenadas.
- Reposiciona-se quando ameaçado.

## 04 — ESCARAVELHO GIGANTE
Função: perseguidor explosivo.

Aparência:
- Besouro gigante.
- Carapaça azul e dourada.
- Patas reforçadas.
- Olhos vermelhos.

IA:
- Corre em alta velocidade.
- Persegue o jogador.
- Explode ao ser eliminado.
- Causa dano em área.

## 05 — SERPENTE SAGRADA
Função: emboscada.

Aparência:
- Cobra gigante.
- Escamas douradas.
- Detalhes vermelhos.
- Olhos luminosos.

IA:
- Surge do chão.
- Ataca em linha reta.
- Aplica veneno.
- Desaparece e reaparece.

## 06 — SACERDOTE PROFANO
Função: suporte mágico.

Aparência:
- Manto roxo.
- Cajado cerimonial.
- Cristal violeta.
- Energia mágica.

IA:
- Conjura maldições.
- Fortalece aliados.
- Invoca múmias.
- Dispara projéteis mágicos.

## 07 — FANTASMA DO FARAÓ
Função: inimigo espectral.

Aparência:
- Vestes de faraó.
- Corpo translúcido.
- Energia azul e ciano.
- Adornos antigos.

IA:
- Atravessa obstáculos compatíveis.
- Teletransporta-se.
- Ataca por contato.
- Desaparece e reaparece.

## 08 — CONSTRUTO DE AREIA
Função: tanque.

Aparência:
- Corpo de blocos de areia.
- Armadura rochosa.
- Partículas douradas.
- Estrutura gigantesca.

IA:
- Alta resistência.
- Golpes pesados.
- Regeneração limitada.
- Ondas de choque ao atingir o chão.

## 09 — ESCORPIÃO IMPERIAL
Função: predador de emboscada.

Aparência:
- Escorpião gigante.
- Armadura preta e dourada.
- Pinças robustas.
- Ferrão roxo.

IA:
- Investidas.
- Ataques com pinças.
- Ferrão venenoso.
- Saltos contra o jogador.

## 10 — HÍBRIDO CHACAL
Função: perseguidor ágil.

Aparência:
- Criatura humanoide com características de chacal.
- Armadura egípcia.
- Garras.
- Olhos vermelhos.

IA:
- Corre rapidamente.
- Executa saltos.
- Realiza ataques consecutivos.
- Persegue agressivamente.

## 11 — PORTAL DAS ALMAS
Função: estrutura de invocação.

Aparência:
- Obelisco antigo.
- Portal roxo luminoso.
- Runas mágicas.
- Fragmentos flutuantes.

Comportamento:
- Invoca inimigos periodicamente.
- Possui vida própria.
- Pode ser destruído.
- Emite sinais antes de invocar.

## 12 — ESQUELETO DE FARAÓ
Função: inimigo ágil.

Aparência:
- Esqueleto com adornos de faraó.
- Armadura dourada.
- Espada cerimonial.
- Olhos vermelhos.

IA:
- Ataca em sequência.
- Executa esquivas.
- Avança rapidamente.
- Alterna ataques e reposicionamento.

## 13 — CARRUAGEM MALDITA
Função: atropelamento e pressão.

Aparência:
- Carruagem dourada.
- Rodas grandes.
- Dois cavalos esqueletos ou corrompidos.
- Condutor infectado.

IA:
- Avança pelo cenário.
- Atropela jogadores.
- Dispara projéteis.
- Executa investidas anunciadas.

## 14 — HÓRUS CORROMPIDO
Função: inimigo aéreo de elite.

Aparência:
- Cabeça de falcão.
- Asas douradas.
- Armadura azul e dourada.
- Olhos luminosos.

IA:
- Voa em círculos.
- Dispara rajadas de energia.
- Executa mergulhos.
- Ataca em alta velocidade.

# 4. OS QUATRO CHEFÕES

Todos devem possuir barra de vida, entrada especial, arena própria, ataques exclusivos, fases e recompensas.

## CHEFÃO 01 — FARAÓ RENEGADO

Aparência:
- Faraó gigantesco.
- Coroa imperial.
- Armadura azul e dourada.
- Olhos vermelhos.

Ataques:
- Tempestade de areia.
- Invocação de múmias.
- Ondas de energia.
- Explosões no chão.

Fases:
1. Combate físico e mágico.
2. Invocação de tropas.
3. Poder total da corrupção.

## CHEFÃO 02 — SOBEK, O DEVORADOR

Aparência:
- Crocodilo gigantesco.
- Escamas verdes.
- Armadura dourada.
- Mandíbula poderosa.

Ataques:
- Mordidas.
- Investidas brutais.
- Golpes com a cauda.
- Invocação de crocodilos menores.

Fases:
1. Ataques físicos.
2. Investidas e invocações.
3. Fúria do Devorador.

## CHEFÃO 03 — BASTET SOMBRIA

Aparência:
- Figura felina humanoide.
- Armadura roxa e dourada.
- Olhos luminosos.
- Cajado mágico.

Ataques:
- Teletransporte.
- Projéteis mágicos.
- Clones ilusórios.
- Investidas rápidas.
- Explosões de energia.

Fases:
1. Magia e teletransporte.
2. Clones e ilusões.
3. Tempestade de energia sombria.

## CHEFÃO 04 — A ESFINGE ETERNA

Aparência:
- Criatura monumental.
- Cabeça de faraó ou leão estilizado.
- Corpo de pedra e ouro.
- Inscrições antigas.

Ataques:
- Pancadas gigantescas.
- Ondas de choque.
- Desmoronamento de pedras.
- Invocação de construtos.
- Raios de energia.

Fases:
1. Ataques físicos.
2. Ataques ambientais.
3. Despertar completo da Esfinge.

# 5. SISTEMA DE INTELIGÊNCIA ARTIFICIAL

Criar comportamentos individuais usando uma arquitetura reutilizável.

Estados possíveis:
- IDLE.
- PATROL.
- DETECT_PLAYER.
- CHASE.
- POSITION.
- PREPARE_ATTACK.
- ATTACK.
- SPECIAL_ABILITY.
- RETREAT.
- STUNNED.
- TAKE_DAMAGE.
- DEATH.

Cada inimigo deve utilizar apenas os estados necessários para seu comportamento.

Não criar IA genérica idêntica para todos.

Implementar:
- Detecção de jogadores.
- Alcance de percepção.
- Linha de visão.
- Distância de ataque.
- Navegação.
- Reação a dano.
- Priorização de alvos.
- Cooldowns.
- Recuperação após ataques.

# 6. CONFIGURAÇÃO DE ATRIBUTOS

Criar configurações individuais para:

- Vida.
- Dano.
- Velocidade.
- Armadura.
- Resistência.
- Alcance.
- Cadência.
- Cooldown.
- XP concedida.
- Recompensas.
- Resistências e fraquezas.

Utilizar a escala de atributos existente no projeto. Não alterar globalmente o balanceamento.

# 7. ANIMAÇÕES E MODELOS

Cada criatura precisa de:
- Modelo 3D individual.
- Materiais.
- Rig quando necessário.
- Idle.
- Movimento.
- Ataque.
- Habilidade especial.
- Recebimento de dano.
- Morte.

Chefões precisam adicionalmente de:
- Entrada cinematográfica.
- Animação de mudança de fase.
- Ataques especiais.
- Derrota.
- Efeitos de vitória.

# 8. INTEGRAÇÃO COM O SISTEMA DE ONDAS

Introduzir os inimigos progressivamente.

Considerar:
- Dificuldade.
- Função tática.
- Quantidade simultânea.
- Frequência de spawn.
- Combinações.
- Limite de criaturas.
- Eventos especiais.

Os chefões devem surgir em eventos próprios.

# 9. DESEMPENHO

Testar hordas com 20, 50, 100 e 200 inimigos.

Implementar quando necessário:
- Object Pooling.
- Limites de invocação.
- Controle de processamento.
- Otimização de colisões.
- Gerenciamento de partículas.
- Liberação de recursos.
- Controle de entidades fora da arena.

Medir FPS, tempo de processamento e consumo de memória.

# 10. ORDEM DE EXECUÇÃO

ETAPA 1 — Auditoria e planejamento técnico.

ETAPA 2 — Estrutura modular de inimigos.

ETAPA 3 — Múmia, Guardião Anúbis, Arqueiro e Escaravelho.

ETAPA 4 — Serpente, Sacerdote, Fantasma e Construto.

ETAPA 5 — Escorpião, Híbrido, Portal e Esqueleto.

ETAPA 6 — Carruagem e Hórus.

ETAPA 7 — Faraó Renegado.

ETAPA 8 — Sobek.

ETAPA 9 — Bastet Sombria.

ETAPA 10 — Esfinge Eterna.

ETAPA 11 — Integração com ondas, áudio, HUD e recompensas.

ETAPA 12 — Testes extremos e otimização.

Não avançar para a próxima etapa enquanto a atual possuir bugs críticos.

# 11. CRITÉRIOS DE ACEITAÇÃO

Um inimigo somente estará concluído quando:
- Modelo 3D integrado.
- Visual validado com a referência.
- IA funcionando.
- Ataques funcionando.
- Animações funcionando.
- Colisões corretas.
- Áudio integrado.
- Spawn funcionando.
- Morte e recompensas funcionando.
- Testes executados.

Um chefão também precisa ter fases, barra de vida, arena e apresentação especial.

Ao finalizar, apresentar:
1. Arquivos criados.
2. Arquivos modificados.
3. Funcionalidades implementadas.
4. Testes executados.
5. Bugs encontrados.
6. Bugs corrigidos.
7. Pendências.

RESULTADO FINAL: IMPLEMENTAR OS 14 INIMIGOS E OS QUATRO CHEFÕES DO EGITO ANTIGO COMO ENTIDADES COMPLETAS E FUNCIONAIS DO BLOCK HORDE, SEM COMPROMETER OS SISTEMAS EXISTENTES.