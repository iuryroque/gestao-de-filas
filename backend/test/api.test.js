const request = require('supertest');
const app = require('../src/index');

describe('API smoke tests', () => {
  let created;

  test('POST /tickets should create a ticket', async () => {
    const res = await request(app)
      .post('/tickets')
      .send({ queueId: 'default', meta: { service: 'TestService', source: 'jest' } })
      .set('Accept', 'application/json');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('number');
    expect(res.body.status).toBe('waiting');
    created = res.body;
  });

  test('GET /tickets should list waiting tickets', async () => {
    const res = await request(app).get('/tickets').query({ queueId: 'default', status: 'waiting' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(t => t.id === created.id);
    expect(found).toBeTruthy();
  });

  test('POST /tickets/:id/call should move to called', async () => {
    const res = await request(app).post(`/tickets/${created.id}/call`).send({ guiche: 'test-1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('called');
  });

  test('POST /tickets/:id/finalize should finalize', async () => {
    const res = await request(app).post(`/tickets/${created.id}/finalize`).send({ result: { outcome: 'ok' } });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('finalized');
  });

  test('GET /queues/:id/stats returns stats object', async () => {
    const res = await request(app).get('/queues/default/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('queueId');
    expect(res.body).toHaveProperty('waiting');
    expect(res.body).toHaveProperty('called');
    expect(res.body).toHaveProperty('finalized');
    expect(res.body).toHaveProperty('tme_seconds');
  });
});
