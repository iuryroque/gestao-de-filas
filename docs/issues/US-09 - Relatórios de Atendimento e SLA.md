Title: US-09 — Relatórios de Atendimento e SLA
Labels: epic/EP03, analytics, backend
Assignee: @TODO

Descrição:
Como um gestor
Quero relatórios periódicos sobre TME, TMA, taxa de no-show e infrações de SLA
Para analisar performance e tomar decisões informadas

Critérios de Aceite:
- [ ] Relatórios diários/semanais/mensais exportáveis em CSV
- [ ] Métricas: TME, TMA, no-show %, tempo médio por serviço
- [ ] Filtros por unidade, serviço e período

DoD:
- [ ] Pipeline básico de agregação implementado (pseudostub ok)
- [ ] Documentação das queries e requisitos de retenção de dados
- [ ] Testes de integração com dados de amostra

Notas Técnicas:
- Armazenar timestamps de eventos para permitir agregações corretas
- Considerar rollups por hora/dia para consultas pesadas
