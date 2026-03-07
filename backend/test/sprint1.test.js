const store = require('../src/store');
const request = require('supertest');
const app = require('../src/index');

beforeEach(() => {
  store._resetDatabase();
});

describe('Sprint 1 — US-01: Emissão de Senha com Triagem Inteligente', () => {
  // ─────────────────────────────────────────────────────────────
  // Catálogo de Serviços
  // ─────────────────────────────────────────────────────────────
  describe('GET /services — catálogo de serviços', () => {
    test('retorna lista vazia quando não há serviços cadastrados', async () => {
      const res = await request(app).get('/services');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    test('retorna apenas serviços ativos por padrão', async () => {
      await request(app)
        .post('/services')
        .send({ id: 'svc-ativo', name: 'Ativo', queueId: 'fila-ativa', isActive: true });
      await request(app)
        .post('/services')
        .send({ id: 'svc-inativo', name: 'Inativo', queueId: 'fila-inativa', isActive: false });

      const res = await request(app).get('/services');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe('svc-ativo');
    });

    test('retorna todos os serviços quando ?all=true', async () => {
      await request(app)
        .post('/services')
        .send({ id: 'svc-a', name: 'Ativo', queueId: 'qa', isActive: true });
      await request(app)
        .post('/services')
        .send({ id: 'svc-b', name: 'Inativo', queueId: 'qb', isActive: false });

      const res = await request(app).get('/services?all=true');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    test('serviço retornado contém os campos esperados', async () => {
      await request(app)
        .post('/services')
        .send({ id: 'svc-completo', name: 'Documentos', queueId: 'docs', category: 'Identificação' });

      const res = await request(app).get('/services');
      expect(res.status).toBe(200);
      const svc = res.body[0];
      expect(svc).toHaveProperty('id', 'svc-completo');
      expect(svc).toHaveProperty('name', 'Documentos');
      expect(svc).toHaveProperty('queueId', 'docs');
      expect(svc).toHaveProperty('category', 'Identificação');
      expect(svc).toHaveProperty('isActive', true);
      expect(svc).toHaveProperty('createdAt');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Cadastro de Serviços
  // ─────────────────────────────────────────────────────────────
  describe('POST /services — cadastro de serviço', () => {
    test('cria serviço com campos obrigatórios e retorna 201', async () => {
      const res = await request(app)
        .post('/services')
        .send({ id: 'svc-docs', name: 'Emissão de Documentos', queueId: 'docs' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: 'svc-docs',
        name: 'Emissão de Documentos',
        queueId: 'docs',
        isActive: true,
      });
    });

    test('retorna 400 quando id está ausente', async () => {
      const res = await request(app)
        .post('/services')
        .send({ name: 'Sem ID', queueId: 'q1' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('retorna 400 quando name está ausente', async () => {
      const res = await request(app)
        .post('/services')
        .send({ id: 'svc-x', queueId: 'q1' });

      expect(res.status).toBe(400);
    });

    test('retorna 400 quando queueId está ausente', async () => {
      const res = await request(app)
        .post('/services')
        .send({ id: 'svc-x', name: 'Sem fila' });

      expect(res.status).toBe(400);
    });

    test('cria serviço com categoria e isActive=false', async () => {
      const res = await request(app).post('/services').send({
        id: 'svc-inativo',
        name: 'Fechado',
        queueId: 'fila-fechada',
        category: 'Outros',
        isActive: false,
      });

      expect(res.status).toBe(201);
      expect(res.body.isActive).toBe(false);
      expect(res.body.category).toBe('Outros');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Emissão de senha via serviceId
  // ─────────────────────────────────────────────────────────────
  describe('POST /tickets com serviceId — emissão de senha', () => {
    beforeEach(async () => {
      await request(app)
        .post('/services')
        .send({ id: 'svc-docs', name: 'Documentos', queueId: 'fila-docs' });
    });

    test('emite senha usando serviceId e retorna campos obrigatórios do comprovante', async () => {
      const res = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('position');
      expect(res.body).toHaveProperty('estWait');
      expect(res.body).toHaveProperty('followUrl');
      expect(res.body.serviceId).toBe('svc-docs');
      expect(res.body.queueId).toBe('fila-docs');
      expect(res.body.status).toBe('waiting');
    });

    test('código da senha é formatado com 3 dígitos (zero-padded)', async () => {
      const res = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('001');
    });

    test('códigos são sequenciais dentro da mesma fila', async () => {
      const r1 = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });
      const r2 = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });
      const r3 = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });

      expect(r1.body.code).toBe('001');
      expect(r2.body.code).toBe('002');
      expect(r3.body.code).toBe('003');
    });

    test('posição na fila reflete a ordem de chegada', async () => {
      const r1 = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });
      const r2 = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });
      const r3 = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });

      expect(r1.body.position).toBe(1);
      expect(r2.body.position).toBe(2);
      expect(r3.body.position).toBe(3);
    });

    test('tempo de espera estimado (estWait) é número inteiro >= 0', async () => {
      const res = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });

      expect(res.status).toBe(201);
      expect(typeof res.body.estWait).toBe('number');
      expect(Number.isInteger(res.body.estWait)).toBe(true);
      expect(res.body.estWait).toBeGreaterThanOrEqual(0);
    });

    test('primeiro da fila tem estWait = 0', async () => {
      const res = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });

      expect(res.body.position).toBe(1);
      expect(res.body.estWait).toBe(0);
    });

    test('followUrl contém o ID do ticket', async () => {
      const res = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });

      expect(res.status).toBe(201);
      expect(res.body.followUrl).toContain(res.body.id);
    });

    test('comprovante contém data/hora de criação', async () => {
      const res = await request(app).post('/tickets').send({ serviceId: 'svc-docs' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('createdAt');
      expect(new Date(res.body.createdAt).toString()).not.toBe('Invalid Date');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Senhas prioritárias (Cenário 2 do BDD)
  // ─────────────────────────────────────────────────────────────
  describe('Senha prioritária — priorityFlag', () => {
    beforeEach(async () => {
      await request(app)
        .post('/services')
        .send({ id: 'svc-prio', name: 'Atendimento Prioritário', queueId: 'fila-prio' });
    });

    test('senha com priorityFlag=true gera código com prefixo P-', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-prio', priorityFlag: true });

      expect(res.status).toBe(201);
      expect(res.body.code).toMatch(/^P-\d{3}$/);
      expect(res.body.priorityFlag).toBe(true);
    });

    test('senha com priorityFlag=false gera código sem prefixo P-', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-prio', priorityFlag: false });

      expect(res.status).toBe(201);
      expect(res.body.code).toMatch(/^\d{3}$/);
      expect(res.body.priorityFlag).toBe(false);
    });

    test('senha sem priorityFlag gera código sem prefixo P-', async () => {
      const res = await request(app).post('/tickets').send({ serviceId: 'svc-prio' });

      expect(res.status).toBe(201);
      expect(res.body.code).not.toMatch(/^P-/);
    });

    test('múltiplas senhas prioritárias são sequenciais', async () => {
      const r1 = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-prio', priorityFlag: true });
      const r2 = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-prio', priorityFlag: true });

      expect(r1.body.code).toBe('P-001');
      expect(r2.body.code).toBe('P-002');
    });

    test('senhas regulares e prioritárias compartilham a sequência numérica da fila', async () => {
      const r1 = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-prio', priorityFlag: false });
      const r2 = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-prio', priorityFlag: true });
      const r3 = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-prio', priorityFlag: false });

      expect(r1.body.code).toBe('001');
      expect(r2.body.code).toBe('P-002');
      expect(r3.body.code).toBe('003');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Disponibilidade de serviço (Cenário 5 do BDD)
  // ─────────────────────────────────────────────────────────────
  describe('Disponibilidade do serviço', () => {
    test('emitir senha para serviceId inexistente retorna 422 com mensagem de erro', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-nao-existe' });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('error');
    });

    test('emitir senha para serviço inativo retorna 422 com mensagem de erro', async () => {
      await request(app)
        .post('/services')
        .send({ id: 'svc-fechado', name: 'Serviço Fechado', queueId: 'q-fechado', isActive: false });

      const res = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-fechado' });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('error');
    });

    test('POST /tickets sem queueId nem serviceId retorna 400', async () => {
      const res = await request(app).post('/tickets').send({});

      expect(res.status).toBe(400);
    });

    test('POST /tickets com queueId direto continua funcionando (retrocompatibilidade)', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({ queueId: 'fila-direta', meta: { service: 'Legado' } });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.queueId).toBe('fila-direta');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Acompanhamento remoto e LGPD
  // ─────────────────────────────────────────────────────────────
  describe('Acompanhamento remoto — followupPhone (LGPD)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/services')
        .send({ id: 'svc-sms', name: 'Com Acompanhamento', queueId: 'fila-sms' });
    });

    test('emissão aceita followupPhone e retorna 201', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-sms', followupPhone: '(61) 99999-9999' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    test('telefone não é exposto no endpoint de listagem (LGPD)', async () => {
      await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-sms', followupPhone: '(61) 99999-9999' });

      const listRes = await request(app)
        .get('/tickets')
        .query({ queueId: 'fila-sms' });

      expect(listRes.status).toBe(200);
      listRes.body.forEach((t) => {
        expect(t).not.toHaveProperty('followupPhone');
      });
    });

    test('telefone não é exposto no endpoint de stats da fila (LGPD)', async () => {
      await request(app)
        .post('/tickets')
        .send({ serviceId: 'svc-sms', followupPhone: '(61) 99999-9999' });

      const statsRes = await request(app).get('/queues/fila-sms/stats');
      expect(statsRes.status).toBe(200);
      expect(statsRes.body).not.toHaveProperty('followupPhone');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tempo de espera estimado baseado em TMA histórico
  // ─────────────────────────────────────────────────────────────
  describe('Cálculo de estWait com TMA histórico', () => {
    test('estWait aumenta proporcionalmente à posição na fila', async () => {
      await request(app)
        .post('/services')
        .send({ id: 'svc-tma', name: 'TMA Test', queueId: 'fila-tma' });

      const r1 = await request(app).post('/tickets').send({ serviceId: 'svc-tma' });
      const r2 = await request(app).post('/tickets').send({ serviceId: 'svc-tma' });
      const r3 = await request(app).post('/tickets').send({ serviceId: 'svc-tma' });

      // Position 1 => 0 wait, position 2 => 1×TMA, position 3 => 2×TMA
      expect(r1.body.estWait).toBe(0);
      expect(r2.body.estWait).toBeGreaterThan(0);
      expect(r3.body.estWait).toBeGreaterThan(r2.body.estWait);
    });
  });
});
