Title: US-06 — Transferência de Senha entre Guichês
Labels: epic/EP02, backend, frontend, api
Assignee: @TODO

Descrição:
Como um atendente
Quero transferir uma senha em atendimento para outro guichê ou serviço
Para que o cidadão seja atendido pelo time/serviço mais adequado

Critérios de Aceite:
- [ ] Transferência pode ser feita por busca de guichê ou seleção de serviço
- [ ] Motivo de transferência registrado no histórico do ticket
- [ ] Notificação de transferência exibida no painel de destino
- [ ] Permissões: apenas atendentes autorizados podem transferir

DoD:
- [ ] Endpoint `/tickets/{id}/transfer` documentado e com stub funcional
- [ ] Interface no guichê para selecionar destino e confirmar transferência
- [ ] Testes E2E simulando transferência e chegada no guichê destino

Notas Técnicas:
- Garantir atomicidade: remover do atendimento origem e inserir na fila destino
- Auditoria obrigatória (quem transferiu, quando, motivo)
