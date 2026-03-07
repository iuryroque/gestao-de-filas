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
    <main style={{ padding: 24 }}>
      <h1>Totem — Emissão de Senha</h1>
      <div style={{ marginTop: 16 }}>
        <label>Tipo de atendimento</label>
        <div style={{ marginTop: 8 }}>
          {types.map(t => (
            <label key={t.id} style={{ display: 'block', marginBottom: 6 }}>
              <input type="radio" name="type" value={t.id} checked={queueId===t.id} onChange={() => setQueueId(t.id)} />{' '}
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <button onClick={emitTicket} disabled={sending} style={{ marginTop: 16, padding: '8px 16px' }}>
        {sending ? 'Emitindo...' : 'Emitir senha'}
      </button>

      {ticket && (
        <section style={{ marginTop: 20, padding: 12, border: '1px solid #ccc' }}>
          <h2>Senha emitida</h2>
          <p><strong>Número:</strong> {ticket.number}</p>
          <p><strong>ID:</strong> {ticket.id}</p>
          <p><strong>Status:</strong> {ticket.status}</p>
        </section>
      )}
    </main>
  )
}
