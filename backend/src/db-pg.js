const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION || 'postgres://postgres:postgres@localhost:5432/gestao_filas';
const pool = new Pool({ connectionString });

async function initSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS queues (
    queueId TEXT PRIMARY KEY,
    lastNumber INTEGER DEFAULT 0
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS tickets (
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
    history JSONB,
    serviceId TEXT,
    priorityFlag BOOLEAN DEFAULT FALSE,
    code TEXT,
    followupPhone TEXT
  )`);

  // Idempotent additions for existing installations (PostgreSQL 9.6+ supports IF NOT EXISTS)
  const alterations = [
    "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS serviceId TEXT",
    "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priorityFlag BOOLEAN DEFAULT FALSE",
    "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS code TEXT",
    "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS followupPhone TEXT",
  ];
  for (const sql of alterations) {
    await pool.query(sql);
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    queueId TEXT NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ
  )`);
}

function _parseJsonField(v) {
  if (v == null) return null;
  return v;
}

function _rowToTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    queueId: row.queueid || row.queueId,
    serviceId: row.serviceid || row.serviceId || null,
    number: row.number,
    code: row.code || null,
    meta: row.meta || {},
    status: row.status,
    priorityFlag: !!(row.priorityflag || row.priorityFlag),
    createdAt: row.createdat ? row.createdat.toISOString() : null,
    calledAt: row.calledat ? row.calledat.toISOString() : null,
    attendedAt: row.attendedat ? row.attendedat.toISOString() : null,
    finalizedAt: row.finalizedat ? row.finalizedat.toISOString() : null,
    noshowAt: row.noshowat ? row.noshowat.toISOString() : null,
    guiche: row.guiche,
    attendant: row.attendant,
    result: row.result || null,
    noshowReason: row.noshowreason || null,
    history: row.history || []
    // followupPhone intentionally excluded (LGPD)
  };
}

function _rowToService(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category || null,
    queueId: row.queueid || row.queueId,
    isActive: !!(row.isactive !== undefined ? row.isactive : row.isActive),
    createdAt: row.createdat ? row.createdat.toISOString() : (row.createdAt || null),
  };
}

const DEFAULT_TMA_SECONDS = 300;

async function _computeTma(queueId) {
  const r = await pool.query(
    `SELECT calledAt, finalizedAt FROM tickets
     WHERE queueId = $1 AND status = 'finalized'
       AND calledAt IS NOT NULL AND finalizedAt IS NOT NULL`,
    [queueId]
  );
  const samples = r.rows
    .map((row) => (new Date(row.finalizedat || row.finalizedAt) - new Date(row.calledat || row.calledAt)) / 1000)
    .filter((x) => x > 0 && !Number.isNaN(x));

  if (!samples.length) return DEFAULT_TMA_SECONDS;
  return Math.round(samples.reduce((s, x) => s + x, 0) / samples.length);
}

async function resetDatabase() {
  await pool.query('DROP TABLE IF EXISTS tickets');
  await pool.query('DROP TABLE IF EXISTS queues');
  await pool.query('DROP TABLE IF EXISTS services');
  await initSchema();
}

async function ensureQueue(queueId) {
  const r = await pool.query('SELECT queueId, lastNumber FROM queues WHERE queueId = $1', [queueId]);
  if (r.rows.length) return r.rows[0];
  await pool.query('INSERT INTO queues(queueId, lastNumber) VALUES($1, $2)', [queueId, 0]);
  return { queueid: queueId, lastnumber: 0 };
}

async function createTicket(queueId, meta = {}, opts = {}) {
  const { serviceId = null, priorityFlag = false, followupPhone = null } = opts;

  await ensureQueue(queueId);
  const lastRes = await pool.query('SELECT lastNumber FROM queues WHERE queueId = $1', [queueId]);
  const last = lastRes.rows[0].lastnumber || lastRes.rows[0].lastNumber || 0;
  const number = last + 1;
  await pool.query('UPDATE queues SET lastNumber = $1 WHERE queueId = $2', [number, queueId]);

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const history = [{ when: createdAt, action: 'created' }];
  const code = priorityFlag
    ? `P-${String(number).padStart(3, '0')}`
    : String(number).padStart(3, '0');

  await pool.query(
    `INSERT INTO tickets(id, queueId, number, meta, status, createdAt, history, serviceId, priorityFlag, code, followupPhone)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [id, queueId, number, meta, 'waiting', createdAt, history, serviceId, priorityFlag, code, followupPhone]
  );

  const ticket = await getTicket(id);

  // Compute queue position (1-indexed)
  const posRes = await pool.query(
    'SELECT COUNT(*) as cnt FROM tickets WHERE queueId = $1 AND status = $2',
    [queueId, 'waiting']
  );
  const position = parseInt(posRes.rows[0].cnt, 10);

  const tma = await _computeTma(queueId);
  const estWait = Math.max(0, (position - 1) * tma);

  const baseUrl = process.env.BASE_URL || '';
  const followUrl = `${baseUrl}/acompanhar/${id}`;

  return Object.assign({}, ticket, { position, estWait, followUrl });
}

async function getTicket(id) {
  const r = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
  return _rowToTicket(r.rows[0]);
}

async function updateTicket(id, patch) {
  const t = await getTicket(id);
  if (!t) return null;
  const merged = Object.assign({}, t, patch);
  const history = Array.isArray(merged.history) ? merged.history : (t.history || []);
  await pool.query(
    `UPDATE tickets SET queueId=$1, number=$2, meta=$3, status=$4, createdAt=$5, calledAt=$6, attendedAt=$7, finalizedAt=$8, noshowAt=$9, guiche=$10, attendant=$11, result=$12, noshowReason=$13, history=$14, serviceId=$15, priorityFlag=$16, code=$17 WHERE id=$18`,
    [
      merged.queueId,
      merged.number,
      merged.meta || {},
      merged.status,
      merged.createdAt,
      merged.calledAt || null,
      merged.attendedAt || null,
      merged.finalizedAt || null,
      merged.noshowAt || null,
      merged.guiche || null,
      merged.attendant || null,
      merged.result || null,
      merged.noshowReason || null,
      history,
      merged.serviceId || null,
      merged.priorityFlag || false,
      merged.code || null,
      id,
    ]
  );
  return getTicket(id);
}

async function callTicket(id, guiche) {
  const t = await getTicket(id);
  if (!t) return null;
  const calledAt = new Date().toISOString();
  t.status = 'called';
  t.calledAt = calledAt;
  t.guiche = guiche || null;
  t.history = t.history || [];
  t.history.push({ when: calledAt, action: 'called', guiche });
  return updateTicket(id, t);
}

async function attendTicket(id, attendant) {
  const t = await getTicket(id);
  if (!t) return null;
  const attendedAt = new Date().toISOString();
  t.status = 'attending';
  t.attendedAt = attendedAt;
  t.attendant = attendant || null;
  t.history = t.history || [];
  t.history.push({ when: attendedAt, action: 'attending', attendant });
  return updateTicket(id, t);
}

async function finalizeTicket(id, result = {}) {
  const t = await getTicket(id);
  if (!t) return null;
  const finalizedAt = new Date().toISOString();
  t.status = 'finalized';
  t.finalizedAt = finalizedAt;
  t.result = result;
  t.history = t.history || [];
  t.history.push({ when: finalizedAt, action: 'finalized', result });
  // Clear followupPhone on finalization (LGPD)
  await pool.query('UPDATE tickets SET followupPhone = NULL WHERE id = $1', [id]);
  return updateTicket(id, t);
}

async function transferTicket(id, destQueueId, reason) {
  const t = await getTicket(id);
  if (!t) return null;
  const from = t.queueId;
  if (from === destQueueId) return t;
  await ensureQueue(destQueueId);
  t.queueId = destQueueId;
  t.status = 'waiting';
  const when = new Date().toISOString();
  t.history = t.history || [];
  t.history.push({ when, action: 'transferred', from, to: destQueueId, reason });
  return updateTicket(id, t);
}

async function noshowTicket(id, reason) {
  const t = await getTicket(id);
  if (!t) return null;
  const when = new Date().toISOString();
  t.status = 'noshow';
  t.noshowAt = when;
  t.noshowReason = reason || null;
  t.history = t.history || [];
  t.history.push({ when, action: 'noshow', reason });
  return updateTicket(id, t);
}

async function listTickets(filter = {}) {
  const clauses = [];
  const params = [];
  if (filter.queueId) { params.push(filter.queueId); clauses.push(`queueId = $${params.length}`); }
  if (filter.status) { params.push(filter.status); clauses.push(`status = $${params.length}`); }
  let sql = 'SELECT * FROM tickets';
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY number ASC';
  const r = await pool.query(sql, params);
  return r.rows.map(_rowToTicket);
}

async function getQueueStats(queueId) {
  const totalRes = await pool.query('SELECT COUNT(*) as cnt FROM tickets WHERE queueId = $1', [queueId]);
  const waitingRes = await pool.query('SELECT COUNT(*) as cnt FROM tickets WHERE queueId = $1 AND status = $2', [queueId, 'waiting']);
  const calledRes = await pool.query('SELECT COUNT(*) as cnt FROM tickets WHERE queueId = $1 AND (status = $2 OR status = $3)', [queueId, 'called', 'attending']);
  const finalizedRes = await pool.query('SELECT COUNT(*) as cnt FROM tickets WHERE queueId = $1 AND status = $2', [queueId, 'finalized']);

  const rows = (await pool.query('SELECT createdAt, calledAt, finalizedAt FROM tickets WHERE queueId = $1 AND status = $2', [queueId, 'finalized'])).rows;
  const samples = rows.map(r => {
    const a = new Date(r.createdat || r.createdAt);
    const b = r.calledat ? new Date(r.calledat) : new Date(r.finalizedat || r.finalizedAt || r.createdAt);
    return (b - a) / 1000;
  }).filter(x => !Number.isNaN(x));
  const tme = samples.length ? Math.round(samples.reduce((s,x)=>s+x,0)/samples.length) : null;

  return {
    queueId,
    count: parseInt(totalRes.rows[0].cnt, 10),
    waiting: parseInt(waitingRes.rows[0].cnt, 10),
    called: parseInt(calledRes.rows[0].cnt, 10),
    finalized: parseInt(finalizedRes.rows[0].cnt, 10),
    tme_seconds: tme
  };
}

async function createService({ id, name, category, queueId, isActive = true }) {
  const createdAt = new Date().toISOString();
  await pool.query(
    `INSERT INTO services(id, name, category, queueId, isActive, createdAt) VALUES($1,$2,$3,$4,$5,$6)`,
    [id, name, category || null, queueId, isActive, createdAt]
  );
  return getService(id);
}

async function getService(id) {
  const r = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
  return _rowToService(r.rows[0]);
}

async function listServices(filter = {}) {
  const clauses = [];
  const params = [];
  if (filter.isActive !== undefined) {
    params.push(filter.isActive);
    clauses.push(`isActive = $${params.length}`);
  }
  let sql = 'SELECT * FROM services';
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY name ASC';
  const r = await pool.query(sql, params);
  return r.rows.map(_rowToService);
}

module.exports = {
  initSchema,
  createTicket,
  getTicket,
  callTicket,
  attendTicket,
  finalizeTicket,
  transferTicket,
  noshowTicket,
  listTickets,
  getQueueStats,
  createService,
  getService,
  listServices,
  resetDatabase,
  _pool: pool
};
