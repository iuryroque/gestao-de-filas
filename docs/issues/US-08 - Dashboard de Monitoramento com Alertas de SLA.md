Title: US-08 — Dashboard de Monitoramento em Tempo Real com Alertas de SLA
Labels: epic/EP03, mvp, priority/high, frontend, analytics
Assignee: @TODO

Descrição:
Como um supervisor
Eu quero um dashboard que mostre em tempo real o estado de todas as filas com alertas visuais quando o SLA está em risco
Para que eu possa intervir proativamente antes que a experiência do cidadão seja comprometida

Critérios de Aceite:
- [ ] Card por fila com TME, TMA, número de senhas aguardando e status de SLA
- [ ] Alerta amarelo em 80% do SLA e vermelho em 100% do SLA
- [ ] Log de breach de SLA persistido com timestamp
- [ ] Filtro por unidade/serviço e persistência de preferências de visualização

DoD:
- [ ] Integração com fontes de métricas (tickets/timestamps) funcionando
- [ ] Atualização em tempo real (≤ 3s)
- [ ] Teste com supervisor validando ações de intervenção (realocar/abrir guichê)

Notas Técnicas:
- Janela de cálculo padrão: últimas 2 horas. Excluir tickets em no-show do cálculo.
- Permissões: apenas Supervisor/Gestor acessam
