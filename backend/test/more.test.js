const request = require('supertest');
const app = require('../src/index');

describe('Additional scenarios and edge cases', () => {
  beforeAll(async () => {
    const store = require('../src/store');
    if (store && store._resetDatabase) await store._resetDatabase();
  });

  test('calling nonexistent ticket returns 404', async () => {
    const res = await request(app).post('/tickets/does-not-exist/call').send({ guiche: '1' });
    expect(res.status).toBe(404);
  });

  test('finalize nonexistent returns 404', async () => {
    const res = await request(app).post('/tickets/does-not-exist/finalize').send({});
    expect(res.status).toBe(404);
  });

  test('transfer nonexistent returns 404', async () => {
    const res = await request(app).post('/tickets/does-not-exist/transfer').send({ toQueueId: 'x' });
    expect(res.status).toBe(404);
  });

  test('noshow nonexistent returns 404', async () => {
    const res = await request(app).post('/tickets/does-not-exist/noshow').send({ reason: 'x' });
    expect(res.status).toBe(404);
  });

  test('create multiple tickets and ensure FIFO on next call', async () => {
    // create three tickets
    const a = await request(app).post('/tickets').send({ queueId: 'fifo', meta: { source: 't' } });
    const b = await request(app).post('/tickets').send({ queueId: 'fifo', meta: { source: 't' } });
    const c = await request(app).post('/tickets').send({ queueId: 'fifo', meta: { source: 't' } });
    expect(a.status).toBe(201); expect(b.status).toBe(201); expect(c.status).toBe(201);

    const list = await request(app).get('/tickets').query({ queueId: 'fifo', status: 'waiting' });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    // debug output for flaky ordering
    
    // first waiting should be the first created
    expect(list.body[0].id).toBe(a.body.id);

    // simulate call next: call the first id
    const callRes = await request(app).post(`/tickets/${list.body[0].id}/call`).send({ guiche: 'G1' });
    expect(callRes.status).toBe(200);
    expect(callRes.body.status).toBe('called');
  });

  test('calling a called ticket updates calledAt (idempotency check)', async () => {
    const r = await request(app).post('/tickets').send({ queueId: 'recall', meta: {} });
    expect(r.status).toBe(201);
    const id = r.body.id;
    const c1 = await request(app).post(`/tickets/${id}/call`).send({ guiche: 'X' });
    expect(c1.status).toBe(200);
    const calledAt1 = c1.body.calledAt;
    // wait a tick
    await new Promise(res => setTimeout(res, 10));
    const c2 = await request(app).post(`/tickets/${id}/call`).send({ guiche: 'X' });
    expect(c2.status).toBe(200);
    const calledAt2 = c2.body.calledAt;
    expect(calledAt2).not.toBe(calledAt1);
  });

  test('double finalize is allowed and remains finalized', async () => {
    const r = await request(app).post('/tickets').send({ queueId: 'final', meta: {} });
    const id = r.body.id;
    await request(app).post(`/tickets/${id}/call`).send({ guiche: '1' });
    const f1 = await request(app).post(`/tickets/${id}/finalize`).send({ result: { ok: true } });
    expect(f1.status).toBe(200);
    expect(f1.body.status).toBe('finalized');
    const f2 = await request(app).post(`/tickets/${id}/finalize`).send({ result: { ok: true } });
    expect(f2.status).toBe(200);
    expect(f2.body.status).toBe('finalized');
  });

  test('transfer to same queue returns 200 and keeps queueId', async () => {
    const r = await request(app).post('/tickets').send({ queueId: 'sameq', meta: {} });
    const id = r.body.id;
    const t = await request(app).post(`/tickets/${id}/transfer`).send({ toQueueId: 'sameq' });
    expect(t.status).toBe(200);
    expect(t.body.queueId).toBe('sameq');
  });

  test('transfer moves between queues and updates stats', async () => {
    // create in qA
    const r = await request(app).post('/tickets').send({ queueId: 'qA', meta: {} });
    const id = r.body.id;
    // confirm waiting in qA
    const statsA1 = await request(app).get('/queues/qA/stats');
    expect(statsA1.body.waiting).toBeGreaterThanOrEqual(1);
    // transfer to qB
    const tr = await request(app).post(`/tickets/${id}/transfer`).send({ toQueueId: 'qB', reason: 'test' });
    expect(tr.status).toBe(200);
    expect(tr.body.queueId).toBe('qB');
    const statsA2 = await request(app).get('/queues/qA/stats');
    const statsB = await request(app).get('/queues/qB/stats');
    // qB waiting should be >=1
    expect(statsB.body.waiting).toBeGreaterThanOrEqual(1);
  });

  test('noshow removes from waiting and sets status noshow', async () => {
    const r = await request(app).post('/tickets').send({ queueId: 'noq', meta: {} });
    const id = r.body.id;
    const n = await request(app).post(`/tickets/${id}/noshow`).send({ reason: 'x' });
    expect(n.status).toBe(200);
    expect(n.body.status).toBe('noshow');
    const list = await request(app).get('/tickets').query({ queueId: 'noq', status: 'waiting' });
    const found = list.body.find(t => t.id === id);
    expect(found).toBeUndefined();
  });

  test('attend sets status attending', async () => {
    const r = await request(app).post('/tickets').send({ queueId: 'att', meta: {} });
    const id = r.body.id;
    const called = await request(app).post(`/tickets/${id}/call`).send({ guiche: 'G' });
    expect(called.status).toBe(200);
    const at = await request(app).post(`/tickets/${id}/attend`).send({ attendant: 'u1' });
    expect(at.status).toBe(200);
    expect(at.body.status).toBe('attending');
  });

  test('list filters return only matching statuses', async () => {
    // create tickets with different statuses
    const a = await request(app).post('/tickets').send({ queueId: 'filterq', meta: {} });
    const b = await request(app).post('/tickets').send({ queueId: 'filterq', meta: {} });
    await request(app).post(`/tickets/${a.body.id}/call`).send({ guiche: '1' });
    await request(app).post(`/tickets/${b.body.id}/finalize`).send({ result: {} });
    const waiting = await request(app).get('/tickets').query({ queueId: 'filterq', status: 'waiting' });
    const called = await request(app).get('/tickets').query({ queueId: 'filterq', status: 'called' });
    const finalized = await request(app).get('/tickets').query({ queueId: 'filterq', status: 'finalized' });
    expect(waiting.body.every(t => t.status === 'waiting')).toBe(true);
    expect(called.body.every(t => t.status === 'called' || t.status === 'attending')).toBe(true);
    expect(finalized.body.every(t => t.status === 'finalized')).toBe(true);
  });

});
