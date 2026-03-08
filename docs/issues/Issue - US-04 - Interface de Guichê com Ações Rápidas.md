Title: US-04 — Interface de Guichê com Ações Rápidas
Labels: epic/EP02, mvp, priority/high, frontend
Assignee: @TODO

Descrição:
Como um atendente de guichê
Eu quero uma interface simples com as ações de atendimento disponíveis em poucos cliques
Para que eu possa focar no atendimento ao cidadão sem ser travado por burocracia digital

Critérios de Aceite:
- [ ] Ações principais (Chamar Próximo, Finalizar, Pausar) acessíveis sem scroll
- [ ] `POST /queues/{id}/call` integra e atualiza painel em ≤ 200ms (ideal)
- [ ] Sessão expirada não encerra ticket ativo
- [ ] Auditoria de ações do atendente registrada

DoD:
- [ ] Fluxo testado com 3 atendentes
- [ ] Integração com painel público (US-03) validada
- [ ] Contadores de fila e motivos de pausa visíveis

Notas:
- Suportar guichê polivalente e proporção de atendimento entre filas
- Atalhos de teclado (F2, F3) como acessibilidade para desktop
