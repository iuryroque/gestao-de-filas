Title: US-07 — Visibilidade e Prioridade entre Filas
Labels: epic/EP02, backend, policy, frontend
Assignee: @TODO

Descrição:
Como um gestor de unidade
Quero ver a composição das filas e aplicar regras de prioridade entre serviços
Para balancear carga e garantir atendimento a casos críticos

Critérios de Aceite:
- [ ] Visualização consolidada com número de senhas por serviço e tempos médios
- [ ] Capacidade de definir regras de prioridade (ex.: prioridade para idosos)
- [ ] Logs de alterações de prioridade

DoD:
- [ ] UI para configuração de prioridades e validação com supervisor
- [ ] Engine simples de priorização aplicada no despacho de senhas
- [ ] Testes unitários das regras mais comuns (idade, gestante, deficiente)

Notas Técnicas:
- Regras avaliadas no momento de emissão e/ou re-ordenamento da fila
- Prioridade não deve quebrar garantias de fairness além do permitido por lei
