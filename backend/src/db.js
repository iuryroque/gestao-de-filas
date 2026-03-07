const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, '..', 'data', 'dev.sqlite3');

function ensureDataDir(file) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDataDir(DB_FILE);

const db = new Database(DB_FILE);

function migrate() {
  db.pragma('journal_mode = WAL');
  db.prepare(`CREATE TABLE IF NOT EXISTS queues (
    queueId TEXT PRIMARY KEY,
    lastNumber INTEGER DEFAULT 0
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    queueId TEXT,
    number INTEGER,
    meta TEXT,
    status TEXT,
    createdAt TEXT,
    calledAt TEXT,
    attendedAt TEXT,
    finalizedAt TEXT,
    noshowAt TEXT,
    guiche TEXT,
    attendant TEXT,
    result TEXT,
    noshowReason TEXT,
    history TEXT,
    serviceId TEXT,
    priorityFlag INTEGER DEFAULT 0,
    code TEXT,
    followupPhone TEXT
  )`).run();

  // Idempotent additions for existing installations
  const alterations = [
    'ALTER TABLE tickets ADD COLUMN serviceId TEXT',
    'ALTER TABLE tickets ADD COLUMN priorityFlag INTEGER DEFAULT 0',
    'ALTER TABLE tickets ADD COLUMN code TEXT',
    'ALTER TABLE tickets ADD COLUMN followupPhone TEXT',
  ];
  for (const sql of alterations) {
    try { db.prepare(sql).run(); } catch (err) {
      // Ignore "duplicate column name" errors — column already exists
      if (!err.message || !err.message.includes('duplicate column name')) throw err;
    }
  }

  db.prepare(`CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    queueId TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT
  )`).run();
}

migrate();

function _parseJsonField(v) {
  if (v == null) return null;
  try { return JSON.parse(v); } catch (e) { return v; }
}

function _rowToTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    queueId: row.queueId,
    serviceId: row.serviceId || null,
    number: row.number,
    code: row.code || null,
    meta: _parseJsonField(row.meta) || {},
    status: row.status,
    priorityFlag: !!row.priorityFlag,
    createdAt: row.createdAt,
    calledAt: row.calledAt,
    attendedAt: row.attendedAt,
    finalizedAt: row.finalizedAt,
    noshowAt: row.noshowAt,
    guiche: row.guiche,
    attendant: row.attendant,
    result: _parseJsonField(row.result) || null,
    noshowReason: row.noshowReason || null,
    history: _parseJsonField(row.history) || []
    // followupPhone intentionally excluded (LGPD)
  };
}

function _rowToService(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category || null,
    queueId: row.queueId,
    isActive: !!row.isActive,
    createdAt: row.createdAt,
  };
}

const DEFAULT_TMA_SECONDS = 300;

function _computeTma(queueId) {
  const rows = db.prepare(
    `SELECT calledAt, finalizedAt FROM tickets
     WHERE queueId = ? AND status = 'finalized'
       AND calledAt IS NOT NULL AND finalizedAt IS NOT NULL`
  ).all(queueId);

  const samples = rows
    .map((r) => (new Date(r.finalizedAt) - new Date(r.calledAt)) / 1000)
    .filter((x) => x > 0 && !Number.isNaN(x));

  if (!samples.length) return DEFAULT_TMA_SECONDS;
  return Math.round(samples.reduce((s, x) => s + x, 0) / samples.length);
}

function resetDatabase() {
  // drop tables and re-run migrations — useful for tests
  db.prepare('DROP TABLE IF EXISTS tickets').run();
  db.prepare('DROP TABLE IF EXISTS queues').run();
  db.prepare('DROP TABLE IF EXISTS services').run();
  migrate();
}

function ensureQueue(queueId) {
  const q = db.prepare('SELECT queueId, lastNumber FROM queues WHERE queueId = ?').get(queueId);
  if (q) return q;
  db.prepare('INSERT INTO queues(queueId, lastNumber) VALUES(?, 0)').run(queueId);
  return { queueId, lastNumber: 0 };
}

function createTicket(queueId, meta = {}, opts = {}) {
  const { serviceId = null, priorityFlag = false, followupPhone = null } = opts;

  const q = ensureQueue(queueId);
  const last = db.prepare('SELECT lastNumber FROM queues WHERE queueId = ?').get(queueId).lastNumber;
  const number = last + 1;
  db.prepare('UPDATE queues SET lastNumber = ? WHERE queueId = ?').run(number, queueId);

  const id = require('uuid').v4();
  const createdAt = new Date().toISOString();
  const history = [{ when: createdAt, action: 'created' }];
  const code = priorityFlag
    ? `P-${String(number).padStart(3, '0')}`
    : String(number).padStart(3, '0');

  db.prepare(`INSERT INTO tickets(id, queueId, number, meta, status, createdAt, history, serviceId, priorityFlag, code, followupPhone)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, queueId, number, JSON.stringify(meta || {}), 'waiting', createdAt,
    JSON.stringify(history), serviceId, priorityFlag ? 1 : 0, code, followupPhone
  );

  const ticket = getTicket(id);

  // Compute queue position (1-indexed, including this ticket)
  const position = db.prepare(
    'SELECT COUNT(*) as cnt FROM tickets WHERE queueId = ? AND status = ?'
  ).get(queueId, 'waiting').cnt;

  // estWait = tickets ahead × TMA (first in queue waits 0)
  const tma = _computeTma(queueId);
  const estWait = Math.max(0, (position - 1) * tma);

  const baseUrl = process.env.BASE_URL || '';
  const followUrl = `${baseUrl}/acompanhar/${id}`;

  return Object.assign({}, ticket, { position, estWait, followUrl });
}

function getTicket(id) {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  return _rowToTicket(row);
}

function updateTicket(id, patch) {
  const t = getTicket(id);
  if (!t) return null;
  const merged = Object.assign({}, t, patch);
  // keep history as array
  const history = Array.isArray(merged.history) ? merged.history : (t.history || []);
  db.prepare(`UPDATE tickets SET queueId = ?, number = ?, meta = ?, status = ?, createdAt = ?, calledAt = ?, attendedAt = ?, finalizedAt = ?, noshowAt = ?, guiche = ?, attendant = ?, result = ?, noshowReason = ?, history = ?, serviceId = ?, priorityFlag = ?, code = ? WHERE id = ?`).run(
    merged.queueId,
    merged.number,
    JSON.stringify(merged.meta || {}),
    merged.status,
    merged.createdAt,
    merged.calledAt || null,
    merged.attendedAt || null,
    merged.finalizedAt || null,
    merged.noshowAt || null,
    merged.guiche || null,
    merged.attendant || null,
    merged.result ? JSON.stringify(merged.result) : null,
    merged.noshowReason || null,
    JSON.stringify(history),
    merged.serviceId || null,
    merged.priorityFlag ? 1 : 0,
    merged.code || null,
    id
  );
  return getTicket(id);
}

function callTicket(id, guiche) {
  const t = getTicket(id);
  if (!t) return null;
  const calledAt = new Date().toISOString();
  t.status = 'called';
  t.calledAt = calledAt;
  t.guiche = guiche || null;
  t.history = t.history || [];
  t.history.push({ when: calledAt, action: 'called', guiche });
  return updateTicket(id, t);
}

function attendTicket(id, attendant) {
  const t = getTicket(id);
  if (!t) return null;
  const attendedAt = new Date().toISOString();
  t.status = 'attending';
  t.attendedAt = attendedAt;
  t.attendant = attendant || null;
  t.history = t.history || [];
  t.history.push({ when: attendedAt, action: 'attending', attendant });
  return updateTicket(id, t);
}

function finalizeTicket(id, result = {}) {
  const t = getTicket(id);
  if (!t) return null;
  const finalizedAt = new Date().toISOString();
  t.status = 'finalized';
  t.finalizedAt = finalizedAt;
  t.result = result;
  t.history = t.history || [];
  t.history.push({ when: finalizedAt, action: 'finalized', result });
  // Clear followupPhone on finalization (LGPD: retain only during ticket lifetime)
  db.prepare('UPDATE tickets SET followupPhone = NULL WHERE id = ?').run(id);
  return updateTicket(id, t);
}

function transferTicket(id, destQueueId, reason) {
  const t = getTicket(id);
  if (!t) return null;
  const from = t.queueId;
  if (from === destQueueId) return t;
  ensureQueue(destQueueId);
  t.queueId = destQueueId;
  t.status = 'waiting';
  const when = new Date().toISOString();
  t.history = t.history || [];
  t.history.push({ when, action: 'transferred', from, to: destQueueId, reason });
  return updateTicket(id, t);
}

function noshowTicket(id, reason) {
  const t = getTicket(id);
  if (!t) return null;
  const when = new Date().toISOString();
  t.status = 'noshow';
  t.noshowAt = when;
  t.noshowReason = reason || null;
  t.history = t.history || [];
  t.history.push({ when, action: 'noshow', reason });
  return updateTicket(id, t);
}

function listTickets(filter = {}) {
  let sql = 'SELECT * FROM tickets';
  const clauses = [];
  const params = [];
  if (filter.queueId) {
    clauses.push('queueId = ?'); params.push(filter.queueId);
  }
  if (filter.status) {
    clauses.push('status = ?'); params.push(filter.status);
  }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY number ASC';
  const rows = db.prepare(sql).all(...params);
  return rows.map(_rowToTicket);
}

function createService({ id, name, category, queueId, isActive = true }) {
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO services(id, name, category, queueId, isActive, createdAt)
    VALUES(?,?,?,?,?,?)`).run(id, name, category || null, queueId, isActive ? 1 : 0, createdAt);
  return getService(id);
}

function getService(id) {
  const row = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  return _rowToService(row);
}

function listServices(filter = {}) {
  const clauses = [];
  const params = [];
  if (filter.isActive !== undefined) {
    clauses.push('isActive = ?');
    params.push(filter.isActive ? 1 : 0);
  }
  let sql = 'SELECT * FROM services';
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY name ASC';
  const rows = db.prepare(sql).all(...params);
  return rows.map(_rowToService);
}

function getQueueStats(queueId) {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM tickets WHERE queueId = ?').get(queueId).cnt;
  const waiting = db.prepare('SELECT COUNT(*) as cnt FROM tickets WHERE queueId = ? AND status = ?').get(queueId, 'waiting').cnt;
  const called = db.prepare('SELECT COUNT(*) as cnt FROM tickets WHERE queueId = ? AND (status = ? OR status = ?)').get(queueId, 'called', 'attending').cnt;
  const finalized = db.prepare('SELECT COUNT(*) as cnt FROM tickets WHERE queueId = ? AND status = ?').get(queueId, 'finalized').cnt;

  // compute tme_seconds: avg time from createdAt to calledAt for finalized tickets in this queue
  const rows = db.prepare('SELECT createdAt, calledAt, finalizedAt FROM tickets WHERE queueId = ? AND status = ?').all(queueId, 'finalized');
  const samples = rows.map(r => {
    const a = new Date(r.createdAt);
    const b = r.calledAt ? new Date(r.calledAt) : new Date(r.finalizedAt || r.createdAt);
    return (b - a) / 1000;
  }).filter(x => !Number.isNaN(x));
  const tme = samples.length ? Math.round(samples.reduce((s,x)=>s+x,0)/samples.length) : null;

  return {
    queueId,
    count: total,
    waiting,
    called,
    finalized,
    tme_seconds: tme
  };
}

module.exports = {
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
  _db: db
};
