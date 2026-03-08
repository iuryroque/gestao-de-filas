"use client"

import React, { useState } from "react"
import Link from "next/link"
import { api } from "~/trpc/react"
import { useTheme } from "~/app/_components/ThemeContext"
import { ThemeToggle } from "~/app/_components/ThemeToggle"

// ─── Types ────────────────────────────────────────────────────────────────────

type DeskStatus = "active" | "paused" | "closed"
type FilterStatus = "all" | DeskStatus

interface DeskEntry {
  id: string
  name: string
  status: string
  pauseReason: string | null
  queueId: string | null
  queue: { id: string; name: string } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOSE_REASONS = [
  "Manutenção programada",
  "Fim de expediente",
  "Falta de pessoal",
  "Problema técnico",
  "Outro",
]

// Simulated role — in real auth this comes from session
const DEMO_ROLE = "supervisor"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === "active")  return { label: "Ativo",    bg: "bg-green-100  text-green-700"  }
  if (status === "paused")  return { label: "Em Pausa", bg: "bg-yellow-100 text-yellow-700" }
  return                           { label: "Fechado",  bg: "bg-gray-100   text-gray-500"   }
}

function statusBadgeHC(status: string) {
  if (status === "active")  return "border-green-400  text-green-300  bg-green-950"
  if (status === "paused")  return "border-yellow-400 text-yellow-300 bg-yellow-950"
  return                           "border-gray-600   text-gray-400   bg-gray-900"
}

function formatTs(ts: Date | string) {
  return new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ─── History sidebar for one desk ────────────────────────────────────────────

function DeskHistoryDrawer({
  desk,
  onClose,
  highContrast,
}: {
  desk: DeskEntry
  onClose: () => void
  highContrast: boolean
}) {
  const { data: history = [], isLoading } = api.desk.stateHistory.useQuery(
    { deskId: desk.id, limit: 20 },
    { enabled: true },
  )

  const bg   = highContrast ? "bg-gray-950 border-l-2 border-white" : "bg-white shadow-2xl"
  const text = highContrast ? "text-white" : "text-gray-800"

  return (
    <aside className={`fixed right-0 top-0 h-full w-80 z-50 flex flex-col p-6 overflow-y-auto transition-colors ${bg}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-bold ${text}`}>Histórico — {desk.name}</h2>
        <button
          onClick={onClose}
          aria-label="Fechar histórico"
          className={`text-2xl leading-none ${highContrast ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-600"}`}
        >
          ×
        </button>
      </div>

      {isLoading && (
        <p className={`text-sm ${highContrast ? "text-gray-500" : "text-gray-400"}`}>Carregando…</p>
      )}

      {!isLoading && history.length === 0 && (
        <p className={`text-sm ${highContrast ? "text-gray-500" : "text-gray-400"}`}>
          Nenhum registro encontrado.
        </p>
      )}

      <ul className="space-y-3">
        {history.map((entry) => {
          const badge = highContrast ? statusBadgeHC(entry.state) : statusBadge(entry.state).bg
          const label = statusBadge(entry.state).label
          return (
            <li
              key={entry.id}
              className={`rounded-xl p-3 text-sm border ${
                highContrast ? `border ${badge}` : `bg-gray-50 border-gray-100`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${badge}`}>{label}</span>
                <span className={`text-xs ${highContrast ? "text-gray-500" : "text-gray-400"}`}>
                  {formatTs(entry.createdAt)}
                </span>
              </div>
              {entry.reason && (
                <p className={`text-xs mt-1 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
                  {entry.reason}
                </p>
              )}
              {entry.actorRole && (
                <p className={`text-xs mt-0.5 uppercase tracking-wider ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                  {entry.actorRole}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

// ─── Close Desk Modal ─────────────────────────────────────────────────────────

function CloseDeskModal({
  desk,
  onConfirm,
  onCancel,
  highContrast,
  isPending,
}: {
  desk: DeskEntry
  onConfirm: (reason: string) => void
  onCancel: () => void
  highContrast: boolean
  isPending: boolean
}) {
  const [reason, setReason] = useState("")
  const [custom, setCustom]   = useState("")

  const effectiveReason = reason === "Outro" ? custom.trim() : reason

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className={`rounded-3xl p-8 w-full max-w-sm shadow-2xl ${
        highContrast ? "bg-gray-900 border-2 border-white" : "bg-white"
      }`}>
        <h2 className={`text-xl font-bold mb-2 ${highContrast ? "text-white" : "text-gray-800"}`}>
          Fechar guichê
        </h2>
        <p className={`text-sm mb-6 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
          <span className="font-semibold">{desk.name}</span> — Selecione a justificativa
        </p>

        <div className="space-y-2 mb-4">
          {CLOSE_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full py-3 rounded-xl border-2 text-sm font-bold transition-all text-left px-4 ${
                reason === r
                  ? (highContrast ? "border-white bg-white text-black" : "border-blue-500 bg-blue-50 text-blue-700")
                  : (highContrast ? "border-gray-700 text-gray-400 hover:border-gray-500" : "border-gray-100 text-gray-600 hover:border-gray-300")
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {reason === "Outro" && (
          <input
            autoFocus
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Descreva a justificativa…"
            className={`w-full border-2 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none ${
              highContrast
                ? "bg-black border-gray-700 text-white focus:border-white"
                : "bg-white border-gray-200 focus:border-blue-500"
            }`}
          />
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className={`flex-1 py-3 border-2 rounded-xl font-bold text-sm ${
              highContrast ? "border-gray-700 text-gray-400 hover:border-white hover:text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={() => { if (effectiveReason) onConfirm(effectiveReason) }}
            disabled={!effectiveReason || isPending}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Fechando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Assign Queue Modal ───────────────────────────────────────────────────────

function AssignQueueModal({
  desk,
  queues,
  onConfirm,
  onCancel,
  highContrast,
  isPending,
}: {
  desk: DeskEntry
  queues: { id: string; name: string }[]
  onConfirm: (queueId: string | null) => void
  onCancel: () => void
  highContrast: boolean
  isPending: boolean
}) {
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(desk.queueId)

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className={`rounded-3xl p-8 w-full max-w-sm shadow-2xl ${
        highContrast ? "bg-gray-900 border-2 border-white" : "bg-white"
      }`}>
        <h2 className={`text-xl font-bold mb-2 ${highContrast ? "text-white" : "text-gray-800"}`}>
          Atribuir fila
        </h2>
        <p className={`text-sm mb-6 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
          <span className="font-semibold">{desk.name}</span> — Selecione para qual fila este guichê vai atender
        </p>

        <div className="space-y-2 mb-6">
          {/* Option: all queues */}
          <button
            onClick={() => setSelectedQueueId(null)}
            className={`w-full py-3 rounded-xl border-2 text-sm font-bold transition-all text-left px-4 ${
              selectedQueueId === null
                ? (highContrast ? "border-white bg-white text-black" : "border-blue-500 bg-blue-50 text-blue-700")
                : (highContrast ? "border-gray-700 text-gray-400 hover:border-gray-500" : "border-gray-100 text-gray-600 hover:border-gray-300")
            }`}
          >
            🔀 Todas as filas
          </button>
          {queues.map((q) => (
            <button
              key={q.id}
              onClick={() => setSelectedQueueId(q.id)}
              className={`w-full py-3 rounded-xl border-2 text-sm font-bold transition-all text-left px-4 ${
                selectedQueueId === q.id
                  ? (highContrast ? "border-white bg-white text-black" : "border-blue-500 bg-blue-50 text-blue-700")
                  : (highContrast ? "border-gray-700 text-gray-400 hover:border-gray-500" : "border-gray-100 text-gray-600 hover:border-gray-300")
              }`}
            >
              {q.name}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-3 border-2 rounded-xl font-bold text-sm ${
              highContrast ? "border-gray-700 text-gray-400 hover:border-white hover:text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(selectedQueueId)}
            disabled={isPending}
            className={`flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors ${
              highContrast ? "bg-white text-black hover:bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isPending ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecursosPage() {
  const { highContrast } = useTheme()
  const [filter, setFilter]                   = useState<FilterStatus>("all")
  const [closeTarget, setCloseTarget]         = useState<DeskEntry | null>(null)
  const [assignTarget, setAssignTarget]       = useState<DeskEntry | null>(null)
  const [historyTarget, setHistoryTarget]     = useState<DeskEntry | null>(null)
  const [warningMessage, setWarningMessage]   = useState<string | null>(null)
  const [successMessage, setSuccessMessage]   = useState<string | null>(null)

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: desks = [], refetch: refetchDesks } = api.desk.list.useQuery(
    undefined,
    { refetchInterval: 5_000 },
  )
  const { data: queues = [] }                         = api.desk.listQueues.useQuery()
  const { data: recentChanges = [], refetch: refetchChanges } =
    api.desk.recentStateChanges.useQuery({ limit: 20 }, { refetchInterval: 5_000 })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const closeMut        = api.desk.close.useMutation()
  const assignMut       = api.desk.assignToQueue.useMutation()
  const activateMut     = api.desk.activate.useMutation()

  function flash(msg: string) {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3500)
  }

  async function handleClose(reason: string) {
    if (!closeTarget) return
    const result = await closeMut.mutateAsync({
      deskId: closeTarget.id,
      reason,
      actorRole: DEMO_ROLE as "supervisor" | "admin",
    })
    setCloseTarget(null)
    await Promise.all([refetchDesks(), refetchChanges()])
    if (result.warningEmptyQueue) {
      setWarningMessage(`⚠ A fila ficou sem nenhum guichê ativo. Alguns cidadãos podem estar aguardando.`)
    }
    flash(`Guichê ${result.desk.name} fechado com sucesso.`)
  }

  async function handleAssign(queueId: string | null) {
    if (!assignTarget) return
    const result = await assignMut.mutateAsync({
      deskId: assignTarget.id,
      queueId,
      actorRole: DEMO_ROLE as "supervisor" | "admin",
    })
    setAssignTarget(null)
    await Promise.all([refetchDesks(), refetchChanges()])
    const queueLabel = result.queue?.name ?? "todas as filas"
    flash(`${result.name} agora atende: ${queueLabel}.`)
  }

  async function handleReopen(desk: DeskEntry) {
    await activateMut.mutateAsync({ deskId: desk.id })
    await Promise.all([refetchDesks(), refetchChanges()])
    flash(`Guichê ${desk.name} reaberto.`)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = desks.filter((d) => filter === "all" || d.status === filter) as DeskEntry[]

  const stats = {
    active: desks.filter((d) => d.status === "active").length,
    paused: desks.filter((d) => d.status === "paused").length,
    closed: desks.filter((d) => d.status === "closed").length,
  }

  const bg   = highContrast ? "bg-black text-white" : "bg-gray-100 text-gray-900"
  const card = highContrast ? "bg-gray-900 border-2 border-gray-800" : "bg-white shadow-sm"

  return (
    <main className={`min-h-screen p-6 transition-colors ${bg}`}>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">🗄 Painel de Recursos</h1>
            <p className={`text-sm mt-1 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
              Gerencie guichês e atribuições de fila em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                highContrast ? "border-gray-600 text-gray-300 hover:border-white" : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              ← Início
            </Link>
          </div>
        </div>

        {/* ── Toast messages ───────────────────────────────────────────── */}
        {warningMessage && (
          <div className="mb-4 rounded-2xl px-5 py-4 bg-orange-500/10 border-2 border-orange-400 flex items-start gap-3">
            <div>
              <p className="font-bold text-orange-600 text-sm">{warningMessage}</p>
            </div>
            <button
              onClick={() => setWarningMessage(null)}
              className="ml-auto text-orange-400 hover:text-orange-600 font-bold"
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-2xl px-5 py-3 bg-green-500/10 border border-green-400 text-green-700 text-sm font-medium">
            ✓ {successMessage}
          </div>
        )}

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Ativos",     count: stats.active, color: highContrast ? "text-green-400"  : "text-green-600"  },
            { label: "Em Pausa",   count: stats.paused, color: highContrast ? "text-yellow-400" : "text-yellow-600" },
            { label: "Fechados",   count: stats.closed, color: highContrast ? "text-gray-400"   : "text-gray-500"   },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-2xl p-5 text-center ${card}`}>
              <p className={`text-4xl font-black ${color}`}>{count}</p>
              <p className={`text-xs mt-1 font-medium uppercase tracking-wider ${highContrast ? "text-gray-500" : "text-gray-400"}`}>{label}</p>
            </div>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">

          {/* ── Desk grid ─────────────────────────────────────────────── */}
          <section className="lg:col-span-2">
            {/* Filter tabs */}
            <div className={`flex gap-2 mb-4 p-1 rounded-2xl w-fit ${highContrast ? "bg-gray-900" : "bg-gray-200"}`}>
              {(["all", "active", "paused", "closed"] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    filter === f
                      ? (highContrast ? "bg-white text-black" : "bg-white text-gray-800 shadow")
                      : (highContrast ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700")
                  }`}
                >
                  {f === "all" ? "Todos" : f === "active" ? "Ativos" : f === "paused" ? "Em Pausa" : "Fechados"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.length === 0 && (
                <p className={`text-center py-8 text-sm ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                  Nenhum guichê encontrado
                </p>
              )}
              {filtered.map((desk) => {
                const badge = statusBadge(desk.status)
                return (
                  <div
                    key={desk.id}
                    className={`rounded-2xl p-5 transition-colors ${card} ${
                      desk.status === "active" && !highContrast ? "border-l-4 border-green-400" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Left: name + status */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-bold text-lg ${highContrast ? "text-white" : "text-gray-800"}`}>{desk.name}</h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            highContrast ? statusBadgeHC(desk.status) + " border" : badge.bg
                          }`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
                          {desk.queue?.name
                            ? `Fila: ${desk.queue.name}`
                            : "Atende todas as filas"}
                        </p>
                        {desk.pauseReason && (
                          <p className={`text-xs mt-0.5 ${highContrast ? "text-yellow-400" : "text-yellow-600"}`}>
                            Motivo da pausa: {desk.pauseReason}
                          </p>
                        )}
                      </div>

                      {/* Right: actions */}
                      <div className="flex flex-wrap gap-2 justify-end">
                        {/* History */}
                        <button
                          onClick={() => setHistoryTarget(desk)}
                          title="Ver histórico"
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                            highContrast
                              ? "border-gray-700 text-gray-400 hover:border-gray-400 hover:text-white"
                              : "border-gray-200 text-gray-500 hover:border-gray-400"
                          }`}
                        >
                          📋 Histórico
                        </button>

                        {/* Assign queue */}
                        <button
                          onClick={() => setAssignTarget(desk)}
                          title="Atribuir à fila"
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                            highContrast
                              ? "border-purple-700 text-purple-400 hover:border-purple-400 hover:text-purple-300"
                              : "border-purple-200 text-purple-600 hover:border-purple-400 bg-purple-50"
                          }`}
                        >
                          ↗ Atribuir fila
                        </button>

                        {/* Open / close */}
                        {desk.status === "closed" ? (
                          <button
                            onClick={() => void handleReopen(desk)}
                            disabled={activateMut.isPending}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            ▶ Abrir
                          </button>
                        ) : (
                          <button
                            onClick={() => setCloseTarget(desk)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            ✕ Fechar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Recent state changes ──────────────────────────────────── */}
          <section>
            <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${highContrast ? "text-gray-500" : "text-gray-400"}`}>
              Histórico Recente
            </h2>
            <div className={`rounded-2xl p-4 ${card} space-y-2 max-h-[28rem] overflow-y-auto`}>
              {recentChanges.length === 0 && (
                <p className={`text-sm text-center py-4 ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                  Nenhum evento registrado
                </p>
              )}
              {recentChanges.map((entry) => {
                const badge = statusBadge(entry.state)
                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl p-3 text-xs border ${
                      highContrast ? "border-gray-800 bg-black" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${highContrast ? "text-white" : "text-gray-700"}`}>
                        {entry.desk.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full font-bold ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    {entry.reason && (
                      <p className={`truncate ${highContrast ? "text-gray-400" : "text-gray-500"}`}>{entry.reason}</p>
                    )}
                    <p className={`mt-0.5 ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                      {formatTs(entry.createdAt)}
                      {entry.actorRole && ` · ${entry.actorRole}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {closeTarget && (
        <CloseDeskModal
          desk={closeTarget}
          onConfirm={(reason) => void handleClose(reason)}
          onCancel={() => setCloseTarget(null)}
          highContrast={highContrast}
          isPending={closeMut.isPending}
        />
      )}
      {assignTarget && (
        <AssignQueueModal
          desk={assignTarget}
          queues={queues}
          onConfirm={(queueId) => void handleAssign(queueId)}
          onCancel={() => setAssignTarget(null)}
          highContrast={highContrast}
          isPending={assignMut.isPending}
        />
      )}

      {/* ── History drawer ─────────────────────────────────────────────── */}
      {historyTarget && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setHistoryTarget(null)}
          />
          <DeskHistoryDrawer
            desk={historyTarget}
            onClose={() => setHistoryTarget(null)}
            highContrast={highContrast}
          />
        </>
      )}
    </main>
  )
}
