# SPRINT PLAN — Gestão de Filas

**Produto:** Sistema de Gestão de Filas para Atendimento Presencial  
**Time estimado:** 2–3 desenvolvedores  
**Cadência:** Sprints de 2 semanas  
**Referência de velocidade:** ~15–20 SP por sprint (já descontadas cerimônias, code reviews e buffer de imprevistos)  
**Data de referência:** Início em 09/03/2026  

---

## Visão Geral do Roadmap

| Sprint | Período | Foco | SP |
|--------|---------|------|----|
| Sprint 0 | 09/03 – 20/03 | Fundação técnica (setup, DB, infra) | Setup |
| Sprint 1 | 23/03 – 03/04 | MVP – Totem: US-01 | 8 |
| Sprint 2 | 06/04 – 17/04 | MVP – Guichê: US-04 + US-05 | 13 |
| Sprint 3 | 20/04 – 01/05 | MVP – Painel público: US-03 + início US-08 | 12 |
| Sprint 4 | 04/05 – 15/05 | MVP – Dashboard completo: US-08 + Homologação | 13 |
| Sprint 5 | 18/05 – 29/05 | V1.1 – Transferência: US-06 + Visibilidade: US-07 | 13 |
| Sprint 6 | 01/06 – 12/06 | V1.1 – Relatórios: US-09 + Recursos: US-10 | 13 |
| Sprint 7 | 15/06 – 26/06 | V1.1 – SMS: US-02 + CSAT: US-11 | 13 |
| Sprint 8 | 29/06 – 10/07 | Estabilização, performance e release de produção | — |

---

## Sprint 0 — Fundação Técnica

**Período:** 09/03 – 20/03/2026  
**Objetivo:** Garantir que o time tenha ambiente, stack e infraestrutura alinhados antes de iniciar o desenvolvimento de features. Este sprint não soma Story Points — é um investimento de capacitação técnica.

### Tarefas

| Tarefa | Responsável sugerido | Prioridade |
|--------|---------------------|------------|
| Decisão de framework frontend (React, Vue ou HTML puro + Alpine.js) | Time completo (sync de 1h) | Crítica |
| Setup do banco de dados — SQLite para dev/staging, PostgreSQL para produção | Dev 1 | Crítica |
| Refatorar `src/store.js` para camada de persistência com repositório desacoplado | Dev 1 + Dev 2 | Crítica |
| Garantir que os 21 testes existentes passam com a camada de DB real | Dev 1 | Crítica |
| Setup ambiente de homologação (VPS, Railway, Render ou similar) | Dev 2 | Alta |
| Configurar pipeline de deploy no CI (GitHub Actions → staging automático) | Dev 2 | Alta |
| Definir estrutura de pastas do frontend e convenções de componentes | Time completo | Alta |
| Atualizar README com instruções de setup local e staging | Dev 3 | Média |

### Momentos de Teste
- **Dia 1–5:** Escrever testes de integração da camada de repositório (TDD — escrever teste antes da implementação do repositório).
- **Dia 6–10:** Validar que os 21 testes existentes continuam verdes com o novo repositório. Corrigir regressões imediatamente.

### Critérios de Conclusão da Sprint (DoS)
- [ ] Banco de dados persistindo dados localmente e em staging.
- [ ] Pipeline de CI verde com banco de dados real nos testes.
- [ ] Deploy automático para staging funcionando a partir de merge na `main`.
- [ ] Time alinhado sobre framework frontend e convenções de código.
- [ ] Documento de decisão de arquitetura registrado (ADR simples no repositório).

### Dependências
- Esta sprint desbloqueia todas as demais. Nenhuma Sprint 1+ pode começar sem o repositório persistido e o staging disponível.

---

## Sprint 1 — MVP: Totem (US-01)

**Período:** 23/03 – 03/04/2026  
**Objetivo:** O cidadão consegue emitir uma senha no totem físico, escolhendo o tipo de atendimento, e recebe uma senha impressa/exibida com seu número e posição na fila.

**Story Points comprometidos:** 8 SP

### Backlog da Sprint

| # | Item | SP | Tipo |
|---|------|----|------|
| 1 | Implementar tela inicial do totem: seleção de tipo de atendimento | 3 | Feature |
| 2 | Integrar botão de emissão com `POST /tickets` | 2 | Feature |
| 3 | Exibir tela de confirmação com número da senha e posição estimada | 2 | Feature |
| 4 | Testes de componente/E2E do fluxo de emissão | 1 | Teste |

### Abordagem de Testes
- **Dia 1–3 (TDD):** Escrever testes de componente para cada tela do totem antes da implementação.
- **Dia 4–8:** Implementar as telas e integrações. Rodar testes a cada commit.
- **Dia 9:** Sessão de code review das PRs abertas (todo código novo deve ter ao menos 1 aprovação).
- **Dia 10:** QA manual no ambiente de staging. Simular fluxo completo totem → senha emitida.

### Critérios de Conclusão da Sprint (DoS)
- [ ] US-01 com todos os critérios de aceite do BDD validados.
- [ ] Testes cobrindo o fluxo feliz e os cenários de erro (fila cheia, tipo inválido).
- [ ] Código revisado e mergeado via PR aprovada.
- [ ] Feature acessível em staging.

### Dependências
- Requer Sprint 0 concluída (repositório persistido, staging disponível).

---

## Sprint 2 — MVP: Interface do Guichê (US-04) + Gestão de No-show (US-05)

**Período:** 06/04 – 17/04/2026  
**Objetivo:** O atendente consegue operar o guichê de forma completa — chamar, atender, finalizar e registrar no-show — com uma interface rápida e responsiva.

**Story Points comprometidos:** 13 SP (US-04: 8 SP + US-05: 5 SP)

### Backlog da Sprint

| # | Item | SP | Tipo |
|---|------|----|------|
| 1 | Tela de guichê: exibir próximo na fila e ações rápidas (Chamar / Atender / Finalizar) | 3 | Feature |
| 2 | Integrar ações com endpoints: `/call`, `/attend`, `/finalize` | 3 | Feature |
| 3 | Feedback visual em tempo real via WebSocket (senha chamada, status atualizado) | 2 | Feature |
| 4 | Implementar fluxo de no-show: botão dedicado + endpoint `/noshow` | 2 | Feature |
| 5 | Lógica de recolocação automática na fila após no-show (configurável: sim/não) | 2 | Feature |
| 6 | Testes de integração: fluxo guichê e no-show | 1 | Teste |

### Abordagem de Testes
- **Dia 1–2 (TDD):** Escrever testes de integração para os fluxos de guichê e no-show antes de tocar no frontend.
- **Dia 3–8:** Implementar features. PRs pequenas e frequentes (por funcionalidade, não por US inteira).
- **Dia 9:** Code review de todas as PRs abertas.
- **Dia 10:** QA manual em staging, testando fluxo totem → guichê → no-show de ponta a ponta.

### Critérios de Conclusão da Sprint (DoS)
- [ ] US-04 e US-05 com todos os critérios de aceite do BDD validados.
- [ ] Fluxo E2E (emissão → chamada → atendimento → finalização / no-show) funcionando em staging.
- [ ] Nenhuma regressão nos testes de Sprint 0 e Sprint 1.
- [ ] Código revisado e mergeado.

### Dependências
- Requer Sprint 1 concluída (fluxo de emissão de senha estável).

---

## Sprint 3 — MVP: Painel Público (US-03) + Início do Dashboard (US-08)

**Período:** 20/04 – 01/05/2026  
**Objetivo:** Implantar o painel de chamada público acessível via WebSocket e iniciar a construção do Dashboard de monitoramento.

**Story Points comprometidos:** 12 SP (US-03: 5 SP + 7 SP de US-08)

### Backlog da Sprint

| # | Item | SP | Tipo |
|---|------|----|------|
| 1 | Painel público: tela exibindo últimas senhas chamadas em tempo real (WebSocket) | 3 | Feature |
| 2 | Acessibilidade: suporte a leitores de tela, contraste WCAG AA, tamanho de fonte configurável | 2 | Feature |
| 3 | Dashboard: estrutura de layout e roteamento de telas | 2 | Feature |
| 4 | Dashboard: widgets de senhas em espera e tempo médio de espera por fila (dados em tempo real) | 3 | Feature |
| 5 | Testes de componente do painel público e dos widgets do dashboard | 2 | Teste |

### Abordagem de Testes
- **Dia 1–3 (TDD):** Testes do painel público — eventos WebSocket (conexão, recebimento de broadcast).
- **Dia 4–8:** Implementar painel e início do dashboard.
- **Dia 9:** Code review.
- **Dia 10:** QA em staging. Testar painel em múltiplos dispositivos/resoluções.

### Critérios de Conclusão da Sprint (DoS)
- [ ] US-03 com todos os critérios de aceite validados (incluindo acessibilidade básica).
- [ ] Estrutura base do dashboard publicada em staging.
- [ ] Pelo menos 2 widgets do dashboard funcionando com dados reais.
- [ ] Nenhuma regressão nos testes anteriores.

### Dependências
- Requer Sprint 2 concluída (fluxo de chamada de guichê estável).

---

## Sprint 4 — MVP: Dashboard Completo (US-08) + Homologação do MVP

**Período:** 04/05 – 15/05/2026  
**Objetivo:** Completar o Dashboard de monitoramento com alertas de SLA e conduzir a homologação formal do MVP completo com stakeholders.

**Story Points comprometidos:** 13 SP (6 SP restantes de US-08 + 7 SP de buffer/homologação)

### Backlog da Sprint

| # | Item | SP | Tipo |
|---|------|----|------|
| 1 | Dashboard: alertas de SLA (destaque visual quando ticket excede tempo-limite) | 3 | Feature |
| 2 | Dashboard: indicador de atendentes ativos e guichês abertos por fila | 2 | Feature |
| 3 | Dashboard: gráfico de volume de atendimentos nas últimas horas | 1 | Feature |
| 4 | Testes de alertas de SLA (mock de tempo expirado) | 2 | Teste |
| 5 | Sessão de UAT (User Acceptance Testing) com PO e stakeholders | — | QA |
| 6 | Correção de bugs e ajustes identificados na UAT | 3 | Bug fix |
| 7 | Checklist de segurança básica (inputs sanitizados, sem dados sensíveis expostos em logs) | 2 | Segurança |

### Abordagem de Testes
- **Dia 1–4 (TDD):** Testes dos alertas de SLA com mock de timestamps.
- **Dia 5–7:** Implementar widgets restantes.
- **Dia 8:** Code review + congelamento de features para UAT.
- **Dia 9:** Sessão de UAT com stakeholders no ambiente de staging.
- **Dia 10:** Correção dos bugs críticos levantados na UAT.

### Critérios de Conclusão da Sprint (DoS — MVP Gate ✅)
- [ ] US-01, US-03, US-04, US-05, US-08 com 100% dos critérios de aceite BDD validados.
- [ ] Sessão de UAT realizada com registro formal.
- [ ] Zero bugs críticos em aberto.
- [ ] Cobertura de testes ≥ 80% nas rotas de backend.
- [ ] Checklist de segurança básica completado.
- [ ] MVP aprovado pelo PO para avanço ao V1.1.

### Dependências
- Requer Sprint 3 concluída.
- **Gate obrigatório:** V1.1 só inicia após aprovação formal do MVP nesta sprint.

---

## Sprint 5 — V1.1: Transferência (US-06) + Visibilidade entre Filas (US-07)

**Período:** 18/05 – 29/05/2026  
**Objetivo:** Dar ao atendente capacidade de transferir tickets e ter visibilidade das filas adjacentes para tomada de decisão operacional.

**Story Points comprometidos:** 13 SP (US-06: 5 SP + US-07: 8 SP)

### Backlog da Sprint

| # | Item | SP | Tipo |
|---|------|----|------|
| 1 | Interface de transferência no guichê: selecionar fila destino + confirmar | 2 | Feature |
| 2 | Integrar com endpoint `POST /tickets/:id/transfer` | 2 | Feature |
| 3 | Notificação WebSocket para a fila destino ao receber ticket transferido | 1 | Feature |
| 4 | Widget de visibilidade: exibir tamanho e SLA atual das filas adjacentes no guichê | 4 | Feature |
| 5 | Configuração de permissão: atendente só vê filas às quais tem acesso | 2 | Feature |
| 6 | Testes de transferência (fluxo + edge cases: fila destino fechada, ticket já finalizado) | 2 | Teste |

### Abordagem de Testes
- **Dia 1–3 (TDD):** Escrever testes de transferência incluindo casos de erro.
- **Dia 4–8:** Implementar features. Code review contínuo via PRs.
- **Dia 9:** Code review final.
- **Dia 10:** QA em staging. Testar transferência de ponta a ponta e visibilidade de filas.

### Critérios de Conclusão da Sprint (DoS)
- [ ] US-06 e US-07 com critérios de aceite BDD validados.
- [ ] Testes cobrindo transferência para fila válida, fila fechada e ticket inválido.
- [ ] Nenhuma regressão no MVP.

---

## Sprint 6 — V1.1: Relatórios (US-09) + Painel de Recursos (US-10)

**Período:** 01/06 – 12/06/2026  
**Objetivo:** Dar ao gestor acesso a relatórios históricos e controle operacional para abrir/fechar guichês dinamicamente.

**Story Points comprometidos:** 13 SP (US-09: 8 SP + US-10: 5 SP)

### Backlog da Sprint

| # | Item | SP | Tipo |
|---|------|----|------|
| 1 | Endpoint de relatório agregado por período (dia/semana/mês): volume, TMA, SLA cumprido | 3 | Feature |
| 2 | Tela de relatório com filtros de período e exportação (CSV) | 3 | Feature |
| 3 | Tela de painel de recursos: lista de guichês com status (aberto/fechado/pausado) | 2 | Feature |
| 4 | Ações de gestor: abrir/fechar guichê, reatribuir atendente | 2 | Feature |
| 5 | Testes do endpoint de relatório e do painel de recursos | 3 | Teste |

### Abordagem de Testes
- **Dia 1–3 (TDD):** Testes do endpoint de relatório com dados de seed controlados no banco.
- **Dia 4–8:** Implementar relatório e painel de recursos.
- **Dia 9:** Code review.
- **Dia 10:** QA em staging. Validar dados do relatório contra registros conhecidos.

### Critérios de Conclusão da Sprint (DoS)
- [ ] US-09 e US-10 com critérios de aceite BDD validados.
- [ ] Relatório exportável em CSV com dados corretos.
- [ ] Painel de recursos permitindo abertura/fechamento de guichês em tempo real.
- [ ] Nenhuma regressão nas sprints anteriores.

---

## Sprint 7 — V1.1: Acompanhamento Remoto (US-02) + CSAT (US-11)

**Período:** 15/06 – 26/06/2026  
**Objetivo:** Permitir que o cidadão acompanhe sua posição na fila via SMS e responda a uma pesquisa de satisfação após o atendimento.

**Story Points comprometidos:** 13 SP (US-02: 8 SP + US-11: 5 SP)

### Backlog da Sprint

| # | Item | SP | Tipo |
|---|------|----|------|
| 1 | Integração com provedor de SMS (Twilio ou similar) — configurado via variável de ambiente | 3 | Feature |
| 2 | Envio de SMS na emissão da senha e ao ser chamado | 3 | Feature |
| 3 | Coleta de número de telefone opcional no totem | 2 | Feature |
| 4 | Envio de link/formulário de CSAT via SMS após finalização do atendimento | 2 | Feature |
| 5 | Tela de CSAT: avaliação 1–5 + comentário opcional | 2 | Feature |
| 6 | Vinculação automática da resposta CSAT ao ticket | 1 | Feature |
| 7 | Testes: mock do provedor SMS + fluxo de CSAT | 2 | Teste |

### Abordagem de Testes
- **Dia 1–3 (TDD):** Testes com mock do cliente SMS (evitar chamadas reais em CI).
- **Dia 4–8:** Implementar integração SMS e fluxo CSAT.
- **Dia 9:** Code review com atenção à LGPD (número de telefone não deve ser logado nem exposto).
- **Dia 10:** QA em staging com SMS sandbox do provedor.

### Critérios de Conclusão da Sprint (DoS)
- [ ] US-02 e US-11 com critérios de aceite BDD validados.
- [ ] Número de telefone não armazenado em log nem exposto em endpoint público (LGPD).
- [ ] SMS enviado com sucesso em ambiente sandbox.
- [ ] CSAT vinculado corretamente ao ticket no banco de dados.

> **Atenção PO:** Providenciar credenciais de sandbox do provedor SMS antes do início desta sprint.

---

## Sprint 8 — Estabilização, Performance e Release de Produção

**Período:** 29/06 – 10/07/2026  
**Objetivo:** Estabilizar o produto completo, realizar testes de carga, corrigir dívidas técnicas acumuladas e fazer o deploy de produção.

| # | Item | Prioridade |
|---|------|-----------|
| 1 | Triagem e correção de todos os bugs em aberto | Crítica |
| 2 | Teste de carga básico: simular 50+ tickets simultâneos (k6 ou Artillery) | Alta |
| 3 | Revisão de segurança: inputs validados, headers HTTP de segurança, rate limiting básico | Alta |
| 4 | Otimização de queries identificadas nos testes de carga | Alta |
| 5 | Migração para banco PostgreSQL de produção (se SQLite foi usado até aqui) | Alta |
| 6 | Sessão final de UAT com stakeholders | Alta |
| 7 | Deploy de produção + monitoramento básico (uptime check, alertas de erro) | Alta |
| 8 | Atualizar documentação: README, variáveis de ambiente, guia de operação | Média |

### Critérios de Conclusão da Sprint (DoS — Release Gate 🚀)
- [ ] Zero bugs críticos em aberto.
- [ ] Testes de carga dentro do SLA definido.
- [ ] Checklist de segurança OWASP básico completado.
- [ ] UAT final aprovado pelo PO.
- [ ] Sistema deployado e estável em produção por pelo menos 24h.
- [ ] Documentação de operação entregue.

---

## Resumo de Dependências Críticas

```
Sprint 0 (Fundação)
    └── Sprint 1 (US-01: Totem)
            └── Sprint 2 (US-04 + US-05: Guichê)
                    └── Sprint 3 (US-03 + início US-08)
                            └── Sprint 4 (US-08 completo + MVP Gate ✅)
                                    ├── Sprint 5 (US-06 + US-07)
                                    ├── Sprint 6 (US-09 + US-10)
                                    └── Sprint 7 (US-02 + US-11)
                                                └── Sprint 8 (Estabilização + Release 🚀)
```

> As Sprints 5, 6 e 7 são independentes entre si — para um time de 2–3 devs a sequência linear é recomendada. Com 4+ devs podem ser paralelizadas.

---

## Convenções e Cerimônias

| Cerimônia | Quando | Duração |
|-----------|--------|---------|
| Sprint Planning | Primeiro dia de cada sprint | 2h |
| Daily Standup | Todos os dias | 15 min |
| Code Review (PRs) | Contínuo — mínimo 1 aprovação para merge | — |
| QA em Staging | Último dia de cada sprint | 2h |
| Sprint Review + Retrospectiva | Último dia de cada sprint | 1h30 |

## Política de Branches

- `main` → produção (protegida, merge apenas via PR aprovada)
- `staging` → ambiente de homologação (deploy automático via CI)
- `feature/US-XX-descricao` → branches de desenvolvimento
- Nenhum commit direto em `main` ou `staging`.

---

## Definição de Pronto (DoD) Global

Para toda User Story ser considerada pronta:
- [ ] Código implementado e revisado (PR aprovada por ≥ 1 dev)
- [ ] Todos os critérios de aceite BDD validados
- [ ] Testes automatizados cobrindo fluxo feliz e principais casos de erro
- [ ] CI verde (build + testes passando)
- [ ] Feature funcionando em staging
- [ ] Sem secrets ou dados sensíveis hardcoded no código
