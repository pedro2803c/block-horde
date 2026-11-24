# PROT — REGRA OBRIGATÓRIA DE VALIDAÇÃO DE CHEFÕES E MONTARIAS | BLOCK HORDE

## 1. REGRA PRINCIPAL

Todo novo chefão adicionado ao BLOCK HORDE deverá obrigatoriamente possuir uma montaria correspondente, que deverá ser instanciada e testada dentro do jogo.

A implementação de um novo chefão não poderá ser considerada concluída enquanto a montaria associada não tiver sido apresentada e validada.

## 2. FLUXO OBRIGATÓRIO DE IMPLEMENTAÇÃO

Sempre que um novo chefão for criado:

1. Identificar a arena e o chefão.
2. Identificar a montaria correspondente.
3. Verificar se a montaria está implementada e funcional.
4. Instanciar a montaria na arena de teste.
5. Permitir que o jogador controle a montaria.
6. Testar individualmente todos os seus poderes.
7. Disparar os projéteis contra o chefão.
8. Confirmar trajetória, colisão e impacto.
9. Confirmar que os ataques retiram vida real do chefão.
10. Validar animações, efeitos, cooldowns e controles.

## 3. TESTE VISUAL OBRIGATÓRIO

Antes de aprovar o novo chefão, apresentar uma demonstração dentro do jogo contendo:

- Chefão aparecendo na arena.
- Montaria correspondente aparecendo.
- Jogador utilizando a montaria.
- Disparo de diferentes projéteis.
- Míssil atingindo o chefão.
- Projétil de fogo ou magia atingindo o chefão.
- Efeito de impacto.
- Barra de vida do chefão diminuindo efetivamente.

A demonstração deverá utilizar os modelos, sistemas e recursos reais do jogo, não imagens simuladas.

## 4. TESTE FUNCIONAL

Cada habilidade deverá ser testada separadamente.

Registrar:
- Nome da habilidade.
- Tipo de projétil.
- Dano configurado.
- Vida do chefão antes do impacto.
- Vida do chefão depois do impacto.
- Resultado do teste.

Se o projétil não causar dano real, a habilidade será considerada reprovada.

## 5. BLOQUEIO DE APROVAÇÃO

Criar uma etapa de validação no fluxo de desenvolvimento.

Estados possíveis:

- Em desenvolvimento.
- Aguardando montaria.
- Montaria instanciada.
- Em teste de combate.
- Reprovado.
- Aprovado.

O chefão só poderá receber o status de implementação concluída quando a montaria e seus poderes forem aprovados.

Não permitir que uma montagem visual ou um efeito sem dano seja considerado funcional.

## 6. REGRA PARA NOVOS CONTEÚDOS

Aplicar essa exigência a todos os novos chefões e às respectivas montarias adicionados futuramente.

Não alterar chefões ou montarias já existentes sem necessidade. Fazer auditoria de compatibilidade e preservar os sistemas atuais.

## 7. RELATÓRIO FINAL

Para cada novo chefão, apresentar:

| Validação | Resultado |
|---|---|
| Chefão implementado | Aprovado/Pendente |
| Montaria correspondente | Aprovado/Pendente |
| Montaria aparece na arena | Aprovado/Pendente |
| Projéteis funcionais | Aprovado/Pendente |
| Dano real no chefão | Aprovado/Pendente |
| Testes de habilidades | Aprovado/Pendente |
| Evidências de gameplay | Apresentadas/Pendentes |

**REGRA DEFINITIVA: NOVO CHEFÃO SEM MONTARIA TESTADA NÃO É IMPLEMENTAÇÃO CONCLUÍDA.**
