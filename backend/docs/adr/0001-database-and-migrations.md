# ADR 0001 — Banco de Dados e Migrações

Status: Proposed

Data: 2026-03-06

Context
-------
O repositório atualmente usa SQLite (via `better-sqlite3`) para desenvolvimento, com migrações implícitas executadas por `backend/src/db.js`. Para produção, precisamos de um banco relacional robusto (PostgreSQL) e um sistema de migrations versionadas executáveis no CI/CD.

Decision
--------
- Manter SQLite para `development` e `test` (arquivo local `data/dev.sqlite3`) para simplicidade local.
- Adotar PostgreSQL como banco de produção e staging.
- Introduzir uma ferramenta de migrations para controlar versões de esquema em produção. Proposta inicial: usar `node-pg-migrate` (leve, focado em PostgreSQL) ou `knex` se quisermos um query-builder multi-db. A escolha final será tomada junto com a equipe durante a implementação; por ora adotamos `node-pg-migrate` como padrão recomendado.
- Implementar um adapter PostgreSQL (`backend/src/db-pg.js`) que exponha a mesma interface do `db.js` (createTicket, getTicket, listTickets, etc.). O app continuará a usar `backend/src/store.js` que delega para o adapter via `process.env.DB_CLIENT`.

Consequences
------------
- Será necessário:
  - adicionar `pg` e `node-pg-migrate` como dependências de produção/dev; configurar scripts `npm run migrate:up` e `migrate:down`.
  - escrever migrations iniciais para as tabelas `queues` e `tickets` (equivalentes às criadas em `db.js`).
  - adaptar testes para suportar execução contra SQLite (padrão) e contra PostgreSQL em CI (com um service container ou connection string de staging).
- A migração gradual permite manter a base de código atual para desenvolvimento local enquanto a infra de produção recebe suporte de migrations versionadas.

Next Steps
----------
1. Decidir formalmente entre `node-pg-migrate` e `knex` (reunião rápida ou PR com comparação). — Tarefa criada.
2. Implementar `backend/src/db-pg.js` com a mesma interface do `db.js` (draft inicialmente com `pg` queries). — Tarefa criada.
3. Adicionar scripts de migrations e criar as migrations iniciais para `queues` e `tickets`.
4. Atualizar CI (`.github/workflows`) para executar migrations antes dos testes em staging.
