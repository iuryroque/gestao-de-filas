"use client"
import React, { useCallback, useState } from "react"
import { api } from "~/trpc/react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "select_desk" | "main"

interface DeskInfo {
  id: string
  name: string
  status: string
  pauseReason: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NO_SHOW = 2

const PAUSE_REASONS = ["Intervalo", "Suporte técnico", "Reunião", "Outro"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function waitTimeLabel(createdAt: Date | string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000)
  return mins < 1 ? "< 1 min" : `${mins} min`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GuichePage() {
  const [step, setStep]               = useState<Step>("select_desk")
  const [desk, setDesk]               = useState<DeskInfo | null>(null)
  const [newDeskName, setNewDeskName] = useState("")
  const [pauseReason, setPauseReason] = useState("")
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [callError, setCallError]     = useState<string | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: desks, refetch: refetchDesks } = api.desk.list.useQuery()

  const { data: currentTicket, refetch: refetchCurrent } =
    api.ticket.currentForDesk.useQuery(
      { deskId: desk?.id ?? "" },
      { enabled: !!desk, refetchInterval: 4_000 },
    )

  const { data: queueStats } = api.ticket.queueStats.useQuery(undefined, {
    enabled: !!desk,
    refetchInterval: 8_000,
  })

  const { data: recentTickets, refetch: refetchRecent } =
    api.ticket.recentForDesk.useQuery(
      { deskId: desk?.id ?? "", limit: 5 },
      { enabled: !!desk },
    )

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createDeskMut   = api.desk.create.useMutation({ onSuccess: () => void refetchDesks() })
  const activateDeskMut = api.desk.activate.useMutation()
  const pauseDeskMut    = api.desk.pause.useMutation()
  const resumeDeskMut   = api.desk.resume.useMutation()
  const callNextMut     = api.ticket.callNext.useMutation()
  const finishMut       = api.ticket.finish.useMutation()
  const noShowMut       = api.ticket.noShow.useMutation()
  const recallMut       = api.ticket.recall.useMutation()

  const refreshAll = useCallback(() => {
    void refetchCurrent()
    void refetchRecent()
  }, [refetchCurrent, refetchRecent])

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleSelectDesk(d: DeskInfo) {
    await activateDeskMut.mutateAsync({ deskId: d.id })
    setDesk({ ...d, status: "active", pauseReason: null })
    setStep("main")
  }

  async function handleCreateDesk() {
    if (!newDeskName.trim()) return
    const created = await createDeskMut.mutateAsync({ name: newDeskName.trim() })
    await activateDeskMut.mutateAsync({ deskId: created.id })
    setDesk({ ...created, status: "active", pauseReason: null })
    setNewDeskName("")
    setStep("main")
  }

  async function handleCallNext() {
    if (!desk) return
    setCallError(null)
    try {
      await callNextMut.mutateAsync({ deskId: desk.id })
      refreshAll()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao chamar senha."
      setCallError(msg)
    }
  }

  async function handleFinish() {
    if (!currentTicket) return
    await finishMut.mutateAsync({ ticketId: currentTicket.id })
    refreshAll()
  }

  async function handleNoShow() {
    if (!currentTicket) return
    await noShowMut.mutateAsync({ ticketId: currentTicket.id })
    refreshAll()
  }

  async function handleRecall() {
    if (!currentTicket) return
    await recallMut.mutateAsync({ ticketId: currentTicket.id })
    refreshAll()
  }

  async function handlePause() {
    if (!desk) return
    await pauseDeskMut.mutateAsync({ deskId: desk.id, reason: pauseReason })
    setDesk((prev) => (prev ? { ...prev, status: "paused", pauseReason } : prev))
    setShowPauseModal(false)
    setPauseReason("")
  }

  async function handleResume() {
    if (!desk) return
    await resumeDeskMut.mutateAsync({ deskId: desk.id })
    setDesk((prev) => (prev ? { ...prev, status: "active", pauseReason: null } : prev))
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: SELECT DESK
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "select_desk") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Acesso ao Guichê</h1>
          <p className="text-gray-500 mb-6 text-sm">Selecione seu guichê para iniciar o atendimento</p>

          {/* Existing desks */}
          <div className="space-y-3 mb-6">
            {desks?.map((d) => (
              <button
                key={d.id}
                onClick={() => void handleSelectDesk(d)}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="font-semibold text-gray-700">{d.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  d.status === "active"  ? "bg-green-100 text-green-700"  :
                  d.status === "paused"  ? "bg-yellow-100 text-yellow-700" :
                                           "bg-gray-100 text-gray-500"
                }`}>
                  {d.status === "active" ? "Em uso" : d.status === "paused" ? "Em pausa" : "Disponível"}
                </span>
              </button>
            ))}
            {(!desks || desks.length === 0) && (
              <p className="text-gray-400 text-center py-4 text-sm">Nenhum guichê cadastrado</p>
            )}
          </div>

          {/* Create new desk */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 mb-3">Ou crie um novo guichê:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeskName}
                onChange={(e) => setNewDeskName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleCreateDesk()}
                placeholder="Ex: Guichê 01"
                className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => void handleCreateDesk()}
                disabled={!newDeskName.trim() || createDeskMut.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: MAIN ATTENDANT VIEW
  // ══════════════════════════════════════════════════════════════════════════
  const isPaused        = desk?.status === "paused"
  const hasOpenTicket   = !!currentTicket && ["calling", "awaiting_recall"].includes(currentTicket.status)
  const isAwaitingRecall = currentTicket?.status === "awaiting_recall"
  const canDeclareDefinitive = (currentTicket?.noShowCount ?? 0) >= MAX_NO_SHOW - 1

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{desk?.name}</h1>
            <span className={`text-sm font-medium ${isPaused ? "text-yellow-600" : "text-green-600"}`}>
              {isPaused ? `● Em pausa — ${desk?.pauseReason ?? ""}` : "● Ativo"}
            </span>
          </div>
          <div className="flex gap-2">
            {!isPaused ? (
              <button
                onClick={() => { setPauseReason(""); setShowPauseModal(true) }}
                className="px-3 py-1.5 text-sm border-2 border-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
              >
                Pausar
              </button>
            ) : (
              <button
                onClick={() => void handleResume()}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Retomar
              </button>
            )}
            <button
              onClick={() => { setStep("select_desk"); setDesk(null) }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* ── Queue stats banner ────────────────────────────────────────── */}
        {queueStats && queueStats.length > 0 && (
          <div className="bg-white rounded-xl px-4 py-2 mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
            {queueStats.map((q) => (
              <span key={q.queueName}>
                <span className="font-semibold text-gray-700">{q.waiting}</span>{" "}
                aguardando — {q.queueName}
              </span>
            ))}
          </div>
        )}

        {/* ── Current ticket card ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          {hasOpenTicket && currentTicket ? (
            <>
              {/* Ticket info */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-5xl font-black text-blue-700">{currentTicket.code}</span>
                  {currentTicket.isPriority && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      PRIORIDADE
                    </span>
                  )}
                  {isAwaitingRecall && (
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      AGUARDANDO RECONVOCAÇÃO
                    </span>
                  )}
                </div>
                <p className="text-gray-600 font-medium">{currentTicket.service ?? "Atendimento Geral"}</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  Aguardou {waitTimeLabel(currentTicket.createdAt)}
                  {currentTicket.noShowCount > 0 && ` · ${currentTicket.noShowCount}ª chamada`}
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => void handleFinish()}
                  disabled={finishMut.isPending}
                  className="py-5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-lg"
                >
                  ✓ Finalizar
                </button>

                {isAwaitingRecall ? (
                  <button
                    onClick={() => void handleRecall()}
                    disabled={recallMut.isPending}
                    className="py-5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg"
                  >
                    📢 Reconvocar
                  </button>
                ) : (
                  <button
                    onClick={() => void handleNoShow()}
                    disabled={noShowMut.isPending}
                    className="py-5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors text-lg"
                  >
                    ✗ Não Compareceu
                  </button>
                )}

                {/* Definitive no-show (only when awaiting recall and max attempts reached) */}
                {isAwaitingRecall && canDeclareDefinitive && (
                  <button
                    onClick={() => void handleNoShow()}
                    disabled={noShowMut.isPending}
                    className="col-span-2 py-3 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 disabled:opacity-50 transition-colors text-sm"
                  >
                    Declarar Não Comparecimento Definitivo
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg mb-6">Nenhuma senha em atendimento</p>
              <button
                onClick={() => void handleCallNext()}
                disabled={isPaused || callNextMut.isPending}
                className="px-10 py-5 bg-blue-600 text-white text-xl font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
              >
                {callNextMut.isPending ? "Chamando…" : "Chamar Próximo"}
              </button>
              {callError && (
                <p className="text-orange-600 text-sm mt-4 max-w-sm mx-auto">{callError}</p>
              )}
              {isPaused && (
                <p className="text-yellow-600 text-sm mt-3">Retome o guichê para chamar o próximo.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Recent history ────────────────────────────────────────────── */}
        {recentTickets && recentTickets.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Atendimentos recentes
            </h2>
            <div className="space-y-2">
              {recentTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-700 w-16">{t.code}</span>
                  <span className="text-gray-500 flex-1 px-2 truncate">{t.service ?? "Geral"}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.status === "done"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {t.status === "done" ? "Finalizado" : "Não Compareceu"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Pause modal ───────────────────────────────────────────────────── */}
      {showPauseModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPauseModal(false) }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Pausar Guichê</h2>
            <div className="space-y-2 mb-5">
              {PAUSE_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setPauseReason(r)}
                  className={`w-full py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    pauseReason === r
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 hover:border-gray-400 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handlePause()}
                disabled={!pauseReason || pauseDeskMut.isPending}
                className="flex-1 py-2.5 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 disabled:opacity-50 transition-colors"
              >
                Pausar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
