---
id: US-09
epic: EP03 - Visão da Gestão
status: Backlog
release: V2
story_points: 13
prioridade: Média
---

# US-09: Alocação Dinâmica de Atendentes entre Filas

## História de Usuário

- **Como um** supervisor de unidade
- **Eu quero** realocar atendentes entre filas diferentes em tempo real pelo painel de gestão
- **Para que** eu possa equilibrar a carga entre filas sobrecarregadas e ociosas sem precisar de comunicação verbal e sem impacto no atendimento em andamento

---

## Contexto e Motivação

Um dos paradoxos comuns em agências com múltiplas filas é ver um atendente com fila vazia a poucos metros de um colega com 30 pessoas esperando — e ninguém capaz de agir rapidamente porque o realinhamento exige comunicação verbal, aprovação, reconfiguração de sistema e, eventualmente, confusão sobre quem está atendendo o quê. O resultado é ineficiência estrutural visível a qualquer visitante, mas opaca para a gestão sem ferramentas adequadas.

A alocação dinâmica resolve isso ao dar ao supervisor o controle direto sobre a configuração das filas atendidas por cada guichê, com efeito imediato no sistema. Isso não é apenas uma funcionalidade de conveniência: é uma alavanca poderosa de gestão que, quando usada proativamente (combinada com os alertas de SLA da US-08), pode evitar breakdowns completos de atendimento em dias de alta demanda, como vencimento de impostos, datas de renovações periódicas ou pós-feriados.

Do ponto de vista do atendente, a realocação deve ser transparente: ele recebe uma notificação em sua interface informando que sua fila foi modificada, podendo ver quais filas passa a atender, sem interrupção do atendimento atual (que deve ser finalizado normalmente antes que a nova configuração entre em efeito para seu guichê).

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Realocação bem-sucedida — Caminho Feliz**
- **Dado que** o supervisor está no dashboard (US-08) e identifica uma fila sobrecarregada
- **Quando** ele acessa o painel de alocação e seleciona um atendente disponível para atribuição à fila sobrecarregada
- **Então** a nova configuração deve ser salva e entrar em vigor a partir do próximo "Chamar Próximo" daquele atendente
- **E** o atendente deve receber uma notificação em sua interface: "Sua configuração de fila foi atualizada. A partir do próximo atendimento, você passará a atender: [lista de filas]."

**Cenário 2: Realocação não interrompe atendimento em andamento**
- **Dado que** o atendente X está com um ticket em status "Em Atendimento" no momento da realocação
- **Quando** o supervisor confirma a realocação deste atendente
- **Então** o ticket em andamento deve ser finalizado normalmente pelo atendente X sem impacto
- **E** somente a partir do próximo "Chamar Próximo" a nova fila de origem é aplicada

**Cenário 3: Supervisor remove atendente de uma fila sem substituição (edge case)**
- **Dado que** o supervisor remove um atendente de uma fila que passará a ter zero guichês ativos
- **Quando** a realocação é confirmada
- **Então** o sistema deve exibir um aviso antes da confirmação: "A fila [NOME] ficará sem nenhum guichê ativo. Deseja continuar?"
- **E** se confirmado, o alerta de "Fila sem guichê ativo" deve ser disparado imediatamente no dashboard (conforme US-08/Cenário 5)

**Cenário 4: Tentativa de realocar atendente em pausa (edge case)**
- **Dado que** o atendente alvo da realocação está em status "Em Pausa"
- **Quando** o supervisor tenta realocá-lo
- **Então** o sistema deve exibir um alerta: "O atendente [NOME] está em pausa. A realocação será registrada, mas só terá efeito quando ele retornar."
- **E** o supervisor deve poder confirmar ou cancelar

**Cenário 5: Auditoria da realocação**
- **Dado que** uma realocação foi realizada
- **Quando** o gestor ou auditor consulta o histórico de alocações
- **Então** deve ver: nome do supervisor que realizou a ação, atendente realocado, fila de origem, fila de destino e timestamp da realocação

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Interface de realocação no painel do supervisor permite atribuição em no máximo 3 interações (seleção de atendente, seleção de fila, confirmação)
- [ ] Realocação não interrompe atendimento em andamento — efeito só no próximo ticket, validado em teste de integração
- [ ] Notificação enviada à interface do atendente imediatamente após confirmação da realocação
- [ ] Aviso de "fila ficará sem guichê ativo" implementado e exibido antes da confirmação
- [ ] Log de auditoria de todas as realocações persistido com os campos obrigatórios

---

## Dependências

- **US-08** (Dashboard de Monitoramento) — a realocação é geralmente acionada em resposta a um alerta de SLA
- **US-04** (Interface de Guichê) — a notificação de realocação é recebida na interface do atendente
- **US-07** (Visibilidade da Fila) — o painel do atendente reflete automaticamente a nova configuração de filas após a realocação

---

## Notas Técnicas e Restrições de Negócio

- **Efeito da realocação:** A nova configuração de filas de um guichê entra em efeito a partir do próximo ticket. O ticket atual não pode ser transferido automaticamente para outro guichê.
- **Configuração de guichê polivalente:** Após a realocação, o guichê pode estar configurado para atender múltiplas filas. A proporção de atendimento entre filas (ex: 60% fila A, 40% fila B) deve ser configurável pelo supervisor ou administrador.
- **Permissão:** Apenas supervisores e gestores podem executar realocações. Atendentes não têm essa permissão.
- **Limite de filas por guichê:** Por questão de rastreabilidade e complexidade cognitiva do atendente, um guichê deve atender no máximo 3 filas simultaneamente. O sistema deve bloquear realocações que excedam esse limite.
