/* Migration 0001: create queues and tickets tables */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('queues', {
    queueId: { type: 'text', notNull: true, primaryKey: true },
    lastNumber: { type: 'integer', notNull: true, default: 0 }
  });

  pgm.createTable('tickets', {
    id: { type: 'text', notNull: true, primaryKey: true },
    queueId: { type: 'text' },
    number: { type: 'integer' },
    meta: { type: 'jsonb' },
    status: { type: 'text' },
    createdAt: { type: 'timestamptz' },
    calledAt: { type: 'timestamptz' },
    attendedAt: { type: 'timestamptz' },
    finalizedAt: { type: 'timestamptz' },
    noshowAt: { type: 'timestamptz' },
    guiche: { type: 'text' },
    attendant: { type: 'text' },
    result: { type: 'jsonb' },
    noshowReason: { type: 'text' },
    history: { type: 'jsonb' }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('tickets');
  pgm.dropTable('queues');
};
