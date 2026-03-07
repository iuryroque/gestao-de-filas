-- Migration inicial: criar tabelas queues e tickets
CREATE TABLE IF NOT EXISTS queues (
  queueId TEXT PRIMARY KEY,
  lastNumber INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  queueId TEXT,
  number INTEGER,
  meta JSONB,
  status TEXT,
  createdAt TIMESTAMPTZ,
  calledAt TIMESTAMPTZ,
  attendedAt TIMESTAMPTZ,
  finalizedAt TIMESTAMPTZ,
  noshowAt TIMESTAMPTZ,
  guiche TEXT,
  attendant TEXT,
  result JSONB,
  noshowReason TEXT,
  history JSONB
);
