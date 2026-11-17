# Block Horde — Sistema universal de controles

## Arquitetura

- `src/gamepad.js` — **ControllerManager** central (Gamepad API do navegador).
  - Detecta conexão e desconexão (`gamepadconnected`, `gamepaddisconnected` e leitura a cada quadro).
  - Identifica fabricante, modelo, ID de fabricante e produto, número de botões e eixos, mapeamento e vibração.
  - Traduz botões em **ações universais** (`fire`, `melee`, `ab0..ab2`, `ult`, `reload`, `next`, `prev`, `tree`, `pause`, `confirm`, `back`).
  - As ações viram as **mesmas teclas virtuais e direcionais** que o teclado e o celular já usam (`Input.vdown`, `touchMove`, `touchAim`). Não existe gameplay separado por controle.
  - Perfil individual salvo por dispositivo (`fabricante:produto`) em `blockhorde.gamepad.v1`.
- `src/Input.js` — teclas virtuais (`vdown`), `padActive` e aviso de volta ao teclado/mouse (`onDevice`).
- `src/Game.js` — chama `pad.update()` a cada quadro, mira automática com controle (respeita o modo de mira), vibração ao levar dano.
- `src/UI.js` — tela **Controle** (diagnóstico, ajustes, botões), aba **Controle** em Controles, ícones da HUD conforme o controle ativo.
- `src/style.css` — estilos `.pad-*` no padrão do Design System.

## Mapeamento padrão (layout standard)

| Ação | Xbox | PlayStation | Nintendo |
|---|---|---|---|
| Mover | Analógico esq. / Direcional | Analógico esq. / Direcional | Analógico esq. / Direcional |
| Mirar | Analógico dir. | Analógico dir. | Analógico dir. |
| Atirar | RT | R2 | ZR |
| Faca / machado | RB | R1 | R |
| Habilidade 1 | LB | L1 | L |
| Habilidade 2 | LT | L2 | ZL |
| Habilidade 3 | A | ✕ | B |
| Ultimate | Y | △ | X |
| Recarregar | X | □ | Y |
| Próxima / anterior arma | → / ← | → / ← | → / ← |
| Árvore de habilidades | View | Share/Create | − |
| Pausar | Menu | Options | + |
| Menu: confirmar / voltar | A / B | ✕ / ○ | B / A (posição física) |
| Menu: trocar aba | LB / RB | L1 / R1 | L / R |

Os ícones Nintendo seguem a posição física: o botão de baixo é B e o da direita é A.

## Perfis reconhecidos

Por ID de fabricante e produto e pelo nome: Xbox 360, Xbox One, One S, Elite, Series X|S (USB e Bluetooth); DualShock 4; DualSense e DualSense Edge; Switch Pro Controller; Joy-Con; 8BitDo (layout Xbox ou Nintendo, conforme o modo); Logitech F310/F710; Hori, PDP, PowerA e genéricos.
Controles fora do padrão (DirectInput) usam o eixo "hat" como direcional e podem ser remapeados.

## Limitações conhecidas (navegador)

- O navegador só mostra o controle depois do **primeiro botão pressionado**.
- O tipo de conexão (USB × Bluetooth) **não é informado** pela Gamepad API; o jogo só mostra Bluetooth quando o nome do dispositivo indica.
- No Windows, controles XInput podem aparecer todos como "Xbox 360 Controller (XInput)": o modelo exato fica oculto.
- Vibração: funciona no Chrome/Edge (`vibrationActuator`). Firefox e Safari geralmente **não** vibram. Joy-Con e alguns genéricos não informam vibração.
- iOS/iPadOS: Safari reconhece controles MFi, Xbox e PlayStation via Bluetooth; Joy-Con depende da versão do sistema.
- Android: Chrome reconhece controles Bluetooth/USB-OTG compatíveis com HID.
- **Esquiva:** o jogo não tem botão de esquiva próprio; a esquiva é a habilidade **Investida**, acionada pelo botão da habilidade em que ela estiver equipada.
- **Co-op local:** o 1º controle é o Jogador 1 e o 2º, o Jogador 2. No co-op, a mira segue o movimento, igual ao teclado.

## Testes executados

Ambiente: Chrome (navegador automatizado), Windows 11, **controle simulado via Gamepad API** (DualSense, ID `054c:0ce6`, layout standard). **Nenhum controle físico foi testado.**

| Teste | Resultado |
|---|---|
| Reconhecimento (Sony / DualSense / perfil PlayStation) | ✓ aprovado (simulado) |
| Menu: ✕ confirma "Jogar agora" | ✓ |
| Movimento pelo analógico esquerdo | ✓ (x 23 → 25,7) |
| Mira pelo analógico direito | ✓ (ângulo correto) |
| Disparo por R2 | ✓ (munição 12 → 4) |
| Habilidade 1 (L1 → Investida) | ✓ (entrou em recarga, igual à tecla Z) |
| Árvore (Share) abre e ○ fecha | ✓ |
| Pausa (Options) e retomada | ✓ |
| Navegação no menu pelo direcional, com foco amarelo visível | ✓ |
| Vibração ao levar dano | ✓ (chamada ao atuador registrada) |
| Recarregar (□) | ✓ |
| Remapear (Atirar → R1), salvar perfil e marcar conflito | ✓ |
| HUD com ícones do PlayStation (L1, L2, ✕, △) | ✓ |
| Tela de diagnóstico: botões, analógicos, gatilhos e eixos brutos ao vivo | ✓ |

## Checklist para validar com controle físico (pendente)

Repetir para cada controle (Xbox One, Series, DS4, DualSense, Switch Pro, Joy-Con, 8BitDo, Logitech e genérico), em PC e celular:

- [ ] Reconhecimento: fabricante, modelo e ícones corretos na tela Controle
- [ ] Todos os botões acendem no diagnóstico
- [ ] Analógicos centrados (zona morta) e chegando a ±1
- [ ] Gatilhos analógicos (barra) e ponto de acionamento
- [ ] Direcional digital
- [ ] Testar vibração
- [ ] Desconectar e reconectar durante a partida (deve pausar e voltar a funcionar)
- [ ] Remapear, reiniciar o jogo e conferir que o perfil foi mantido
- [ ] Restaurar padrões
- [ ] Alternar teclado/mouse ↔ controle ↔ touch sem travar comandos
- [ ] Tutorial (academia): todos os passos concluídos só com o controle
- [ ] Combate: mover, mirar, atirar, faca, 3 habilidades, ultimate, recarregar, trocar arma, árvore, pausa
- [ ] Co-op com dois controles
