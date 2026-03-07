const request = require('supertest');
const app = require('../src/index');
const WebSocket = require('ws');

describe('Extra API tests: transfer, noshow, websocket', () => {
  let created;

  test('should create a ticket to be transferred and noshowed', async () => {
    const res = await request(app).post('/tickets').send({ queueId: 'q1', meta: { service: 'X', source: 'jest-extra' } });
    expect(res.status).toBe(201);
    created = res.body;
    expect(created).toHaveProperty('id');
  });

  test('should transfer ticket to another queue', async () => {
    const res = await request(app).post(`/tickets/${created.id}/transfer`).send({ toQueueId: 'q2', reason: 'teste' });
    expect(res.status).toBe(200);
    expect(res.body.queueId).toBe('q2');
    expect(res.body.status).toBe('waiting');
  });

  test('should register noshow', async () => {
    const res = await request(app).post(`/tickets/${created.id}/noshow`).send({ reason: 'não compareceu' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('noshow');
  });

  test('websocket broadcast is invoked on ticket.create', async () => {
    // create a local WS server and hook global broadcast to it
    const wss = new WebSocket.Server({ port: 0 });
    const port = wss.address().port;
    let received = null;
    const client = new WebSocket(`ws://localhost:${port}`);

    await new Promise(resolve => wss.on('listening', resolve));

    client.on('message', msg => { received = JSON.parse(msg); });

    // set global broadcast to forward to our wss
    global.__wss_broadcast = (data) => {
      const s = JSON.stringify(data);
      wss.clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) c.send(s);
      });
    };

    await new Promise((resolve, reject) => {
      client.on('open', resolve);
      client.on('error', reject);
    });

    const r = await request(app).post('/tickets').send({ queueId: 'wsq', meta: { service: 'WS' } });
    expect(r.status).toBe(201);

    // wait briefly for ws message
    await new Promise(res => setTimeout(res, 100));
    expect(received).not.toBeNull();
    expect(received.type).toBe('ticket.created');

    client.close();
    wss.close();
  });

});
