Title: US-03 — Painel de Chamada Acessível e não Invasivo
Labels: epic/EP01, mvp, priority/high, frontend, infra
Assignee: @TODO

Descrição:
Como um cidadão aguardando atendimento
Eu quero visualizar as senhas sendo chamadas em um painel claro e ouvir um aviso sonoro discreto
Para que eu saiba quando e para qual guichê me dirigir sem ansiedade

Critérios de Aceite:
- [ ] Painel exibe chamada em ≤ 2s após ação do atendente
- [ ] Exibe senha + guichê + destaque para prioritários (visualmente e por som)
- [ ] Mantém histórico das 3 últimas chamadas
- [ ] Modo silencioso disponível via configuração de gestor
- [ ] Reconexão automática após perda de rede sem exibir chamadas antigas como novas

Definição de Pronto:
- [ ] Cliente do painel implementado (WebSocket) e testado
- [ ] Volume e TTS configuráveis pelo gestor
- [ ] Testes de acessibilidade e leitura a 10m validados

Notas Técnicas:
- Usar conexão persistente (WebSocket) para atualizações.
- TTS em PT-BR com arquivos/snippets fornecidos.
