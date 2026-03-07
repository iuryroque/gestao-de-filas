process.env.SQLITE_FILE = ':memory:';
const repo = require('../src/db');

beforeEach(() => {
  repo.resetDatabase();
});

describe('Repository behavior (SQLite)', () => {
  test('create and get ticket', () => {
    const t = repo.createTicket('r1', { svc: 'x' });
    expect(t).toHaveProperty('id');
    expect(t.queueId).toBe('r1');
    const g = repo.getTicket(t.id);
    expect(g).not.toBeNull();
    expect(g.id).toBe(t.id);
  });

  test('list tickets and ordering', () => {
    const a = repo.createTicket('r2', {});
    const b = repo.createTicket('r2', {});
    const list = repo.listTickets({ queueId: 'r2', status: 'waiting' });
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0].id).toBe(a.id);
  });

  test('call and finalize', () => {
    const t = repo.createTicket('r3', {});
    const c = repo.callTicket(t.id, 'g1');
    expect(c.status).toBe('called');
    expect(c.guiche).toBe('g1');
    const f = repo.finalizeTicket(t.id, { ok: true });
    expect(f.status).toBe('finalized');
    expect(f.result).toEqual({ ok: true });
  });

  test('transfer between queues', () => {
    const t = repo.createTicket('fromQ', {});
    const tr = repo.transferTicket(t.id, 'toQ', 'reason');
    expect(tr.queueId).toBe('toQ');
    expect(tr.status).toBe('waiting');
  });

  test('noshow sets status and removes from waiting list', () => {
    const t = repo.createTicket('nq', {});
    const n = repo.noshowTicket(t.id, 'no show');
    expect(n.status).toBe('noshow');
    const waiting = repo.listTickets({ queueId: 'nq', status: 'waiting' });
    const found = waiting.find(x => x.id === t.id);
    expect(found).toBeUndefined();
  });
});
