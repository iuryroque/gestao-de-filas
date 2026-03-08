Title: US-05 — Gestão de No-show
Labels: epic/EP02, mvp, priority/high, backend
Assignee: @TODO

Descrição:
Como um atendente de guichê
Eu quero registrar rapidamente o não comparecimento de um cidadão chamado
Para que a fila não fique travada e o próximo cidadão seja chamado sem atraso

Critérios de Aceite:
- [ ] Registro de no-show com contador de tentativas por ticket
- [ ] Reconvocação mostra indicação "SEGUNDA CHAMADA" e dispara som
- [ ] Ticket é expirado após N tentativas (configurável)
- [ ] Tickets em no-show são excluídos do cálculo de TME

DoD:
- [ ] Endpoint `POST /tickets/{id}/noshow` implementado
- [ ] Configuração admin: maxAttempts por fila
- [ ] Reintegração de ticket via Supervisor implementada

Notas Técnicas:
- No-show não deve afetar métricas de TME; registrar no log com timestamps e atendente
