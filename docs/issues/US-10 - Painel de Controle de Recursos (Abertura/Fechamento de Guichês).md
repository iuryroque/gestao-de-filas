Title: US-10 — Painel de Controle de Recursos (Abertura/Fechamento de Guichês)
Labels: epic/EP03, operations, frontend
Assignee: @TODO

Descrição:
Como um gestor operacional
Quero abrir, fechar e monitorar o estado dos guichês (online/offline/pausa)
Para ajustar a capacidade conforme demanda

Critérios de Aceite:
- [ ] Abertura/fechamento de guichês com justificativa e horário
- [ ] Estado visível no dashboard e nos painéis públicos
- [ ] Histórico de alteração de estado disponível

DoD:
- [ ] Endpoints para mutação de estado documentados e stubbed
- [ ] UI simples para operações rápidas com permissões
- [ ] Cenários de rollback quando um guichê for forçado offline

Notas Técnicas:
- Estado de guichê sincronizado via websocket para painéis e guichês
- Considerar janelas de manutenção e operações programadas
