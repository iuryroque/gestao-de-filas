---
id: US-04
epic: EP02 - Operação do Atendente
status: Backlog
release: MVP 1.0
story_points: 8
prioridade: Crítica
---

# US-04: Interface de Guichê com Ações Rápidas

## História de Usuário

- **Como um** atendente de guichê
- **Eu quero** uma interface simples com as ações de atendimento disponíveis em poucos cliques
- **Para que** eu possa focar no atendimento ao cidadão sem ser travado por burocracia digital

---

## Contexto e Motivação

A interface do atendente é o coração operacional do sistema. Um painel de guichê mal projetado tem consequências diretas e mensuráveis: cada clique extra por atendimento multiplicado por centenas de atendimentos ao dia representa horas de produtividade perdida. Mais invisível, mas igualmente danoso, é o custo cognitivo: quando o atendente precisa pensar sobre onde clicar, tira sua atenção do cidadão à sua frente, gerando a percepção de atendimento frio e mecânico.

O contexto específico de serviços públicos adiciona uma camada de complexidade: o atendente frequentemente recebe um cidadão já estressado pela espera, que chegou ao guichê com documentação incompleta, ou que não sabe exatamente o que precisa. O sistema não pode ser mais um elemento de frustração nessa equação. A interface deve requerer o mínimo de atenção visual possível para as ações rotineiras — chamar próximo, pausar, finalizar — permitindo que o atendente mantenha contato visual com o cidadão durante a operação.

A interface deve exibir de forma proeminente as informações sobre o cidadão atual (senha, serviço solicitado, prioridade, tempo de espera até chegar ao guichê) e as ações disponíveis em botões de grande área de toque, com confirmação apenas para ações irreversíveis. O histórico dos últimos atendimentos do próprio guichê deve estar acessível em um clique, sem precisar abrir outro módulo do sistema.

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Chamar próxima senha — Caminho Feliz**
- **Dado que** o atendente está logado no sistema e seu guichê está ativo
- **Quando** ele pressiona o botão "Chamar Próximo"
- **Então** o sistema deve chamar a primeira senha da fila (respeitando a ordem de prioridade: senhas P- antes de regulares)
- **E** deve exibir na tela do atendente: código da senha, nome do serviço, tipo (prioritário/regular) e o tempo que o cidadão aguarda na fila
- **E** o painel de chamada (US-03) deve ser atualizado simultaneamente

**Cenário 2: Finalizar atendimento**
- **Dado que** o atendente está com uma senha em atendimento ativo
- **Quando** ele pressiona "Finalizar Atendimento"
- **Então** o sistema deve registrar o timestamp de finalização do atendimento
- **E** deve calcular e armazenar o TMA (Tempo Médio de Atendimento) daquele ticket
- **E** a interface deve retornar ao estado "aguardando" (pronto para chamar próximo)
- **E** não deve exibir mensagem de confirmação para essa ação

**Cenário 3: Pausar atendimento (intervalo ou ausência temporária)**
- **Dado que** o atendente precisa se ausentar temporariamente
- **Quando** ele pressiona "Pausar Guichê" e seleciona o motivo da pausa (intervalo, suporte técnico, reunião — lista configurável)
- **Então** o guichê deve mudar para status "Em Pausa" no sistema
- **E** nenhuma nova senha deve ser chamada para aquele guichê enquanto estiver em pausa
- **E** o tempo de pausa deve começar a ser registrado a partir desse momento
- **E** o botão "Retomar Atendimento" deve ser exibido proeminentemente

**Cenário 4: Chamar próximo sem senhas disponíveis na fila (edge case)**
- **Dado que** o atendente pressiona "Chamar Próximo"
- **Quando** não há senhas aguardando na fila atribuída ao seu guichê
- **Então** o sistema deve exibir uma mensagem clara: "Sua fila está vazia no momento"
- **E** nenhum chamado deve ser disparado no painel de exibição
- **E** o status do guichê deve permanecer ativo (não pausa automaticamente)

**Cenário 5: Sessão expirada durante atendimento (edge case)**
- **Dado que** o atendente está com um ticket em atendimento ativo
- **Quando** a sessão do sistema expira por inatividade de autenticação
- **Então** o sistema deve exibir a tela de re-autenticação sobreposta, sem encerrar o ticket ativo
- **E** após re-autenticar, o atendente deve retornar ao estado exato em que estava, com o ticket ainda aberto e o timer de TMA continuando

**Cenário 6: Atendente tenta chamar próximo tendo ticket ainda aberto (edge case)**
- **Dado que** o atendente possui um ticket em status "Em Atendimento"
- **Quando** ele pressiona "Chamar Próximo" sem ter finalizado o atendimento atual
- **Então** o sistema deve exibir uma mensagem de alerta: "Você possui um atendimento em andamento. Finalize-o antes de chamar o próximo."
- **E** nenhum novo ticket deve ser chamado

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Três ações principais (Chamar Próximo, Finalizar, Pausar) acessíveis na tela principal sem necessidade de scroll ou submenu
- [ ] Registro de timestamps de início e fim de atendimento funcionando corretamente e sendo persistido para cálculo de TMA
- [ ] Lógica de prioridade validada: senhas P- são sempre chamadas antes de senhas regulares dentro da mesma fila
- [ ] Motivos de pausa configuráveis pelo administrador e corretamente vinculados ao log de cada atendente
- [ ] Interface testada e aprovada por ao menos 3 atendentes reais em sessão de usabilidade guiada

---

## Dependências

- **US-01** (Emissão de Senha) — os tickets chamados aqui são os emitidos via triagem
- **US-03** (Painel de Chamada) — a ação "Chamar Próximo" dispara a atualização do painel

---

## Notas Técnicas e Restrições de Negócio

- **Regra de prioridade:** Dentro da mesma fila, senhas prioritárias (P-) devem ser sempre chamadas antes de senhas regulares, independentemente da ordem de emissão. Entre senhas do mesmo tipo, vale a ordem FIFO (First In, First Out) por timestamp de emissão.
- **Fila multi-serviço:** Um guichê pode ser configurado para atender mais de uma fila simultaneamente (ex: guichê polivalente). A lógica de "Chamar Próximo" deve respeitar a proporção configurada (ex: 70% fila A / 30% fila B) para evitar starvation de uma fila.
- **Timeout de ticket aberto:** O sistema deve alertar o atendente (aviso visual não-bloqueante) se um ticket permanecer em status "Em Atendimento" por tempo superior ao dobro do TMA médio histórico daquele serviço, sinalizando possível esquecimento de finalização.
- **Auditoria:** Todas as ações do atendente (chamar, pausar, finalizar, reconvocar) devem ser registradas com timestamp e ID do atendente para fins de auditoria.
