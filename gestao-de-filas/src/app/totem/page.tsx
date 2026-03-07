import React, { useState } from 'react'

export default function TotemPage() {
  const [queueId, setQueueId] = useState('default')
  const [sending, setSending] = useState(false)
  const [ticket, setTicket] = useState(null as any)

  const types = [
    { id: 'default', label: 'Atendimento Geral' },
    { id: 'priority', label: 'Prioritário' },
    { id: 'info', label: 'Informações' }
  ]

  async function emitTicket() {
    setSending(true)
    setTicket(null)
      try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, meta: { source: 'totem' } })
      })
      const data = await res.json()
      if (res.status === 201) setTicket(data)
      else alert(data.error || 'Erro ao emitir')
    } catch (e) {
      alert('Erro de rede')
    } finally {
      setSending(false)
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, Roboto, Arial' }}>
      <h1>Totem — Emissão de Senha</h1>

      <fieldset style={{ marginTop: 16, border: 'none', padding: 0 }}>
        <legend style={{ fontWeight: 600 }}>Tipo de atendimento</legend>
        <div style={{ marginTop: 8 }} role="radiogroup" aria-label="Tipo de atendimento">
          {types.map(t => (
            <label key={t.id} style={{ display: 'block', marginBottom: 6 }}>
              <input
                type="radio"
                name="type"
                value={t.id}
                checked={queueId===t.id}
                onChange={() => setQueueId(t.id)}
                aria-checked={queueId===t.id}
              />{' '}
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={emitTicket}
          disabled={sending}
          style={{ padding: '12px 20px', fontSize: 16 }}
          aria-busy={sending}
        >
          {sending ? 'Emitindo...' : 'Emitir senha'}
        </button>
      </div>

      {ticket && (
        <section
          aria-live="polite"
          style={{ marginTop: 20, padding: 20, border: '1px solid #ccc', borderRadius: 6, maxWidth: 420 }}
        >
          <h2 style={{ marginTop: 0 }}>Senha emitida</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{ticket.number}</div>
            <div>
              <div style={{ fontSize: 12, color: '#555' }}>ID</div>
              <div style={{ fontSize: 12 }}>{ticket.id}</div>
            </div>
          </div>
          <p style={{ marginTop: 12 }}><strong>Status:</strong> {ticket.status}</p>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => window.print()} style={{ marginRight: 8 }}>Imprimir</button>
            <button onClick={() => { setTicket(null); setSending(false); }}>
              Fechar
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
