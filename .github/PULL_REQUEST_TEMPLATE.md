<!-- Título: breve resumo das mudanças -->

## O que foi feito
- Adiciona workflow CI para executar testes contra PostgreSQL
- Adiciona adapter PostgreSQL (`backend/src/db-pg.js`) e opção `DB_CLIENT=pg`
- Adiciona migrations iniciais em `backend/migrations/0001_init.sql`
- Adiciona `docker-compose.yml` para Postgres dev e README com instruções
- Adiciona workflow de deploy para Railway (staging)

## Por que
Garantir que o CI valide a aplicação contra o mesmo engine de banco usado em produção (Postgres), aplicar migrations e habilitar deploy automático para staging.

## Checklist (obrigatório antes do merge)
- [ ] CI: Checks pass (workflow `.github/workflows/ci.yml`) — validação de testes contra Postgres
- [ ] Migrations: `backend/migrations/0001_init.sql` aplicadas com sucesso em staging
- [ ] Secrets: `RAILWAY_API_KEY`, `RAILWAY_PROJECT_ID`, `STAGING_DATABASE_URL` adicionados no repositório (se usar Railway)
- [ ] README: instruções de setup local revisadas e aceitas
- [ ] Revisão de código: pelo menos 1 aprovação

## Como testar localmente
1. Subir Postgres localmente:

```bash
cd backend
docker-compose up -d
```

2. Instalar dependências e rodar migrations:

```bash
npm install
npm run migrate:up
```

3. Iniciar servidor com Postgres adapter:

```bash
npm run start:dev:pg
```

4. Testar endpoint:

```bash
curl -X POST http://localhost:3000/tickets -H "Content-Type: application/json" -d '{"queueId":"fila-A","meta":{"type":"geral"}}'
```

Se preferir, crie o branch `ci/postgres-migrations` e abra o PR apontando para `main`.

---
Por favor cole aqui os logs do CI se algum teste falhar para que eu corrija as regressões.
