-- Sprint 1: US-01 — Emissão de Senha com Triagem Inteligente
-- Adiciona suporte a serviços e campos de triagem nos tickets

-- Tabela de serviços disponíveis no totem
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  queueId TEXT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMPTZ
);

-- Novos campos nos tickets para suporte à triagem
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS serviceId TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priorityFlag BOOLEAN DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS followupPhone TEXT;
