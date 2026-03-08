Title: US-02 — Acompanhamento Remoto da Fila via SMS/WhatsApp
Labels: epic/EP01, enhancement, privacy, frontend, integration
Assignee: @TODO

Descrição:
Como um cidadão que aguardou minha senha
Quero receber atualizações via SMS/WhatsApp sobre minha posição e chamadas
Para que eu possa me organizar e retornar no momento adequado

Critérios de Aceite:
- [ ] O sistema envia confirmação de emissão de senha com um código de acompanhamento
- [ ] Atualizações periódicas sobre posição na fila (ex: cada 5 posições ou a cada 10 minutos)
- [ ] Notificação quando estiver próximo a ser chamado (configurável: 1-5 posições)
- [ ] Consentimento explícito e opção de opt-out em conformidade com LGPD

DoD:
- [ ] Integração com gateway SMS/WhatsApp simulada e documentada
- [ ] Logs de envio e respostas persistidos
- [ ] Cenários BDD cobrindo opt-in/opt-out e falhas de entrega

Notas Técnicas:
- Armazenar apenas o mínimo necessário (hash dos números se requerido)
- Usar template multilíngue; suportar carga de mensagens em lote
- Implementar backoff e retry para envios falhos
