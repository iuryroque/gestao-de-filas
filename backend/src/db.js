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
    history TEXT
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
    number: row.number,
    meta: _parseJsonField(row.meta) || {},
    status: row.status,
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
  };
}

function resetDatabase() {
  // drop tables and re-run migrations — useful for tests
  db.prepare('DROP TABLE IF EXISTS tickets').run();
  db.prepare('DROP TABLE IF EXISTS queues').run();
  migrate();
}

function ensureQueue(queueId) {
  const q = db.prepare('SELECT queueId, lastNumber FROM queues WHERE queueId = ?').get(queueId);
  if (q) return q;
  db.prepare('INSERT INTO queues(queueId, lastNumber) VALUES(?, 0)').run(queueId);
  return { queueId, lastNumber: 0 };
}

function createTicket(queueId, meta = {}) {
  const q = ensureQueue(queueId);
  const last = db.prepare('SELECT lastNumber FROM queues WHERE queueId = ?').get(queueId).lastNumber;
  const number = last + 1;
  db.prepare('UPDATE queues SET lastNumber = ? WHERE queueId = ?').run(number, queueId);
  const id = require('uuid').v4();
  const createdAt = new Date().toISOString();
  const history = [{ when: createdAt, action: 'created' }];
  db.prepare(`INSERT INTO tickets(id, queueId, number, meta, status, createdAt, history)
    VALUES(?,?,?,?,?,?,?)`).run(id, queueId, number, JSON.stringify(meta || {}), 'waiting', createdAt, JSON.stringify(history));
  return getTicket(id);
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
  db.prepare(`UPDATE tickets SET queueId = ?, number = ?, meta = ?, status = ?, createdAt = ?, calledAt = ?, attendedAt = ?, finalizedAt = ?, noshowAt = ?, guiche = ?, attendant = ?, result = ?, noshowReason = ?, history = ? WHERE id = ?`).run(
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
  resetDatabase,
  _db: db
};
