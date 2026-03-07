# Backend — Gestão de Filas

Este README descreve como rodar o backend localmente com PostgreSQL (melhor prática para alinhar com produção).

Requisitos
- Docker & Docker Compose (para Postgres local)
- Node 18+ e npm

Passos rápidos (Linux/macOS / PowerShell similar)

1) Subir Postgres via Docker Compose

```bash
cd backend
docker-compose up -d
```

2) Instalar dependências

```bash
npm install
```

3) Rodar migrations (usa `node-pg-migrate`)

```bash
npm run migrate:up
```

4) Iniciar servidor usando adapter Postgres

```bash
npm run start:dev:pg
```

Variáveis de ambiente úteis
- `DB_CLIENT=pg` — usar adapter Postgres (default: SQLite)
- `DATABASE_URL` ou `PG_CONNECTION` — connection string para Postgres (ex: `postgres://user:pass@host:5432/dbname`)
- `PORT` — porta do servidor (default 3000)

Testar endpoint (exemplo)

```bash
curl -X POST http://localhost:3000/tickets -H "Content-Type: application/json" -d '{"queueId":"fila-A","meta":{"type":"geral"}}'
```

Se retornar `201` com o objeto do ticket, o fluxo está funcionando.

Observações
- Em CI/staging recomendamos executar `npm run migrate:up` antes de executar os testes ou iniciar a aplicação.
- Para desenvolvimento rápido sem Docker ainda é possível usar SQLite (padrão) — não recomendado se produção usa Postgres.

Deploy para Staging (Railway)
--------------------------------
Para habilitar deploy automático para `staging` via Railway, configure os seguintes secrets no repositório GitHub:

- `RAILWAY_API_KEY` — sua chave de API Railway
- `RAILWAY_PROJECT_ID` — ID do projeto Railway destino
- `STAGING_DATABASE_URL` — connection string do Postgres usado em staging

O workflow `.github/workflows/deploy-staging.yml` executa ao dar push em `main` e usa a Railway CLI para publicar o serviço.

Passos rápidos na Railway (manual / resumo):
1. Criar projeto em Railway e um ambiente `staging`.
2. Criar um Postgres service no Railway e copiar a `DATABASE_URL` para `STAGING_DATABASE_URL` no GitHub Secrets.
3. Gerar API key no Railway e salvar em `RAILWAY_API_KEY` no GitHub Secrets.
4. Opcional: ajustar `RAILWAY_PROJECT_ID` ou usar a integração GitHub oficial do Railway.

