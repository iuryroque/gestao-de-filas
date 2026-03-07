---
id: US-05
epic: EP02 - Operação do Atendente
status: Backlog
release: MVP 1.0
story_points: 5
prioridade: Crítica
---

# US-05: Gestão de No-show

## História de Usuário

- **Como um** atendente de guichê
- **Eu quero** registrar rapidamente o não comparecimento de um cidadão chamado
- **Para que** a fila não fique travada e o próximo cidadão seja chamado sem atraso

---

## Contexto e Motivação

O no-show — a situação em que a senha é chamada mas o cidadão não comparece ao guichê — é um dos principais causadores de inconsistência entre as métricas do sistema e a realidade operacional. Sem um fluxo claro de gestão, o atendente fica em um limbo: não pode chamar o próximo sem "abandonar" o ticket aberto, gerando um estado fantasma no sistema que distorce os tempos de espera exibidos para os demais na fila e no painel de gestão.

A causa do no-show pode ser variada: o cidadão foi ao banheiro, não ouviu o chamado, está fazendo acompanhamento remoto e ainda não retornou, ou simplesmente desistiu e foi embora. A política de tratamento precisa ser calibrada: chamar uma única vez e cancelar é muito rígido para o contexto público; chamar indefinidamente paralisa a fila. A solução é uma política de reconvocação configurável, com máximo de tentativas e intervalo entre elas, após o qual o ticket é automaticamente marcado como "Não Comparecido" e excluído da fila ativa.

É importante que o cidadão que teve o ticket cancelado por no-show tenha a possibilidade de ser reintegrado à fila pelo supervisor, mediante justificativa — esta é uma válvula de escape importante para situações específicas (ex: cidadão idoso que precisa de ajuda para se locomover).

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Registro de no-show pelo atendente — Caminho Feliz**
- **Dado que** o atendente chamou uma senha e o cidadão não compareceu ao guichê
- **Quando** o atendente pressiona o botão "Não Compareceu" na interface do guichê
- **Então** o sistema deve registrar a primeira tentativa de chamado como falhada com timestamp
- **E** deve exibir para o atendente a opção de "Reconvocar Agora" ou "Próxima Senha"
- **E** o ticket deve entrar em status "Aguardando Reconvocação" com contador de tentativas inicializado em 1

**Cenário 2: Reconvocação automática via painel**
- **Dado que** um ticket está em status "Aguardando Reconvocação"
- **Quando** o atendente aciona "Reconvocar"
- **Então** o painel de chamada (US-03) deve exibir novamente a senha com indicação "SEGUNDA CHAMADA"
- **E** o aviso sonoro deve ser reproduzido novamente
- **E** o contador de tentativas deve ser incrementado

**Cenário 3: No-show definitivo após esgotamento das tentativas**
- **Dado que** um ticket atingiu o número máximo de tentativas configurado (padrão: 2 reconvocações)
- **Quando** o atendente registra o não comparecimento na última tentativa
- **Então** o sistema deve alterar o status do ticket para "Não Comparecido"
- **E** deve remover a senha da fila ativa
- **E** deve registrar no log do ticket: número de tentativas, timestamps de cada chamada e identificador do atendente
- **E** o atendente deve poder imediatamente chamar o próximo da fila

**Cenário 4: Reintegração à fila pelo supervisor (edge case)**
- **Dado que** um ticket foi marcado como "Não Comparecido"
- **Quando** o supervisor acessa o ticket e aciona "Reintegrar à Fila" com motivo registrado
- **Então** o ticket deve retornar à fila no final, como se fosse uma nova emissão (sem prioridade de posição original)
- **E** o status do ticket deve ser atualizado para "Em Espera" novamente

**Cenário 5: No-show de ticket prioritário (edge case)**
- **Dado que** o ticket em no-show possui marcação de prioridade (prefixo P-)
- **Quando** o fluxo de no-show é aplicado
- **Então** o processo de no-show segue exatamente o mesmo fluxo de tickets regulares (sem tratamento diferenciado no no-show)
- **E** o status de prioridade é preservado caso o ticket seja reintegrado à fila (via Cenário 4)

**Cenário 6: Atendente chama próximo sem registrar no-show do atual (edge case)**
- **Dado que** o atendente tem um ticket em status "Em Atendimento" ou "Em Chamada"
- **Quando** ele tenta acionar "Chamar Próximo" sem registrar o resultado do ticket atual
- **Então** o sistema deve bloquear a ação e exibir: "Por favor, finalize ou registre o não comparecimento antes de chamar o próximo."

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Fluxo completo de no-show (tentativa → reconvocação → no-show definitivo) implementado e testado de ponta a ponta
- [ ] Número máximo de tentativas e intervalo entre reconvocações configuráveis pelo administrador por tipo de fila
- [ ] Log de auditoria do ticket registra cada tentativa de chamada com timestamp e ID do atendente
- [ ] Ação de reintegração à fila pelo supervisor implementada e restrita ao perfil de supervisor (controle de acesso)
- [ ] Impacto no cálculo de TME validado: tempo de no-show não distorce a média de espera dos demais cidadãos

---

## Dependências

- **US-04** (Interface de Guichê com Ações Rápidas) — o no-show é acionado a partir da interface do atendente
- **US-03** (Painel de Chamada) — a reconvocação atualiza o painel

---

## Notas Técnicas e Restrições de Negócio

- **Configuração por fila:** O número máximo de tentativas (padrão: 2) e o intervalo mínimo entre reconvocações (padrão: sem intervalo obrigatório, a critério do atendente) devem ser configuráveis por tipo de fila pelo administrador.
- **Impacto no TME:** Tickets em no-show não devem ser contabilizados no cálculo do Tempo Médio de Espera, pois distorceriam as métricas. Devem ser excluídos da amostra de cálculo.
- **Status do guichê:** Durante o período entre a primeira chamada e a declaração de no-show definitivo, o guichê deve permanecer em status "Ativo" para que as métricas de disponibilidade do atendente não sejam afetadas.
- **Acesso de reintegração:** A reintegração à fila é uma ação exclusiva do perfil Supervisor. O atendente não tem essa permissão.
