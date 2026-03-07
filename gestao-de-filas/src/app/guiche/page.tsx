"use client"
import React, { useCallback, useState } from "react"
import { api } from "~/trpc/react"
import { useTheme } from "../_components/ThemeContext"
import { ThemeToggle } from "../_components/ThemeToggle"

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
  const { highContrast } = useTheme()

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
      <main className={`min-h-screen flex items-center justify-center p-6 transition-colors ${highContrast ? "bg-black" : "bg-gray-50"}`}>
        <div className={`w-full max-w-md rounded-2xl shadow-lg p-8 transition-colors ${highContrast ? "bg-gray-900 border-2 border-white" : "bg-white"}`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className={`text-2xl font-bold mb-1 ${highContrast ? "text-white" : "text-gray-800"}`}>Acesso ao Guichê</h1>
              <p className={`text-sm ${highContrast ? "text-gray-400" : "text-gray-500"}`}>Selecione seu guichê para iniciar o atendimento</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Existing desks */}
          <div className="space-y-3 mb-6">
            {desks?.map((d) => (
              <button
                key={d.id}
                onClick={() => void handleSelectDesk(d)}
                className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                  highContrast 
                    ? "border-gray-700 hover:border-white hover:bg-gray-800 bg-black" 
                    : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <span className={`font-semibold ${highContrast ? "text-white" : "text-gray-700"}`}>{d.name}</span>
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
          <div className={`border-t pt-6 ${highContrast ? "border-gray-800" : "border-gray-100"}`}>
            <p className={`text-sm mb-3 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>Ou crie um novo guichê:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeskName}
                onChange={(e) => setNewDeskName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleCreateDesk()}
                placeholder="Ex: Guichê 01"
                className={`flex-1 border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${
                  highContrast
                    ? "bg-black border-gray-700 text-white focus:border-white"
                    : "bg-white border-gray-200 focus:border-blue-500"
                }`}
              />
              <button
                onClick={() => void handleCreateDesk()}
                disabled={!newDeskName.trim() || createDeskMut.isPending}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  highContrast
                    ? "bg-white text-black hover:bg-gray-200 font-bold"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
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
    <main className={`min-h-screen p-4 transition-colors ${highContrast ? "bg-black" : "bg-gray-100"}`}>
      <div className="max-w-2xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-xl font-bold ${highContrast ? "text-white" : "text-gray-800"}`}>{desk?.name}</h1>
            <span className={`text-sm font-medium ${isPaused ? "text-yellow-600" : highContrast ? "text-green-400" : "text-green-600"}`}>
              {isPaused ? `● Em pausa — ${desk?.pauseReason ?? ""}` : "● Ativo"}
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <div className="flex gap-2">
              {!isPaused ? (
                <button
                  onClick={() => { setPauseReason(""); setShowPauseModal(true) }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                >
                  Pausar
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                >
                  Retomar
                </button>
              )}
            </div>
            <button
              onClick={() => { setStep("select_desk"); setDesk(null) }}
              className={`px-3 py-1.5 text-sm transition-colors ${highContrast ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              Sair
            </button>
          </div>
        </div>

        {/* ── Queue stats banner ────────────────────────────────────────── */}
        {queueStats && queueStats.length > 0 && (
          <div className={`rounded-xl px-4 py-2 mb-4 flex flex-wrap gap-4 text-sm transition-colors ${highContrast ? "bg-gray-900 text-gray-400 border border-gray-800" : "bg-white text-gray-500 shadow-sm"}`}>
            {queueStats.map((q) => (
              <span key={q.queueName}>
                <span className={`font-semibold ${highContrast ? "text-gray-200" : "text-gray-700"}`}>{q.waiting}</span>{" "}
                aguardando — {q.queueName}
              </span>
            ))}
          </div>
        )}

        {/* ── Current ticket card ───────────────────────────────────────── */}
        <div className={`rounded-3xl shadow-xl overflow-hidden mb-6 transition-colors border-2 p-8 ${
          highContrast ? "bg-gray-900 border-white" : "bg-white border-transparent"
        }`}>
          {hasOpenTicket && currentTicket ? (
            <>
              {/* Ticket info */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`text-6xl font-black ${highContrast ? "text-white" : "text-blue-700"}`}>{currentTicket.code}</span>
                  {currentTicket.isPriority && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      PRIORIDADE
                    </span>
                  )}
                  {isAwaitingRecall && (
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      AGUARDANDO RECONVOCAÇÃO
                    </span>
                  )}
                </div>
                <p className={`text-2xl font-medium ${highContrast ? "text-gray-300" : "text-gray-600"}`}>{currentTicket.service ?? "Atendimento Geral"}</p>
                <p className={`text-sm mt-2 ${highContrast ? "text-gray-500" : "text-gray-400"}`}>
                  Cidadão aguardou {waitTimeLabel(currentTicket.createdAt)}
                  {currentTicket.noShowCount > 0 && ` · ${currentTicket.noShowCount}ª chamada`}
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => void handleFinish()}
                  disabled={finishMut.isPending}
                  className={`py-6 text-white font-bold rounded-2xl text-xl transition-all shadow-md disabled:opacity-50 ${
                    highContrast ? "bg-green-700 border-2 border-white hover:bg-green-600" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  ✓ Finalizar
                </button>

                {isAwaitingRecall ? (
                  <button
                    onClick={() => void handleRecall()}
                    disabled={recallMut.isPending}
                    className={`py-6 text-white font-bold rounded-2xl text-xl transition-all shadow-md disabled:opacity-50 ${
                      highContrast ? "bg-blue-700 border-2 border-white hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    📢 Reconvocar
                  </button>
                ) : (
                  <button
                    onClick={() => void handleNoShow()}
                    disabled={noShowMut.isPending}
                    className={`py-6 text-white font-bold rounded-2xl text-xl transition-all shadow-md disabled:opacity-50 ${
                      highContrast ? "bg-orange-700 border-2 border-white hover:bg-orange-600" : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    ✗ Não Compareceu
                  </button>
                )}

                {/* Definitive no-show */}
                {isAwaitingRecall && canDeclareDefinitive && (
                  <button
                    onClick={() => void handleNoShow()}
                    disabled={noShowMut.isPending}
                    className={`col-span-2 py-4 font-bold rounded-2xl transition-all ${
                      highContrast 
                        ? "bg-red-950 text-red-300 border-2 border-red-800 hover:bg-red-900" 
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    Declarar Não Comparecimento Definitivo
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className={`text-xl mb-10 ${highContrast ? "text-gray-400" : "text-gray-400"}`}>Nenhuma senha em atendimento</p>
              <button
                onClick={() => void handleCallNext()}
                disabled={isPaused || callNextMut.isPending}
                className={`px-12 py-6 text-2xl font-bold rounded-3xl transition-all shadow-xl disabled:opacity-50 ${
                  highContrast 
                    ? "bg-white text-black hover:bg-gray-200" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {callNextMut.isPending ? "Chamando…" : "Chamar Próximo"}
              </button>
              {callError && (
                <p className="text-red-500 text-sm mt-6 max-w-sm mx-auto font-medium">{callError}</p>
              )}
              {isPaused && (
                <p className="text-yellow-600 text-md mt-6 font-medium">Retome o guichê para chamar o próximo.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Recent history ────────────────────────────────────────────── */}
        {recentTickets && recentTickets.length > 0 && (
          <div className={`rounded-3xl p-6 transition-colors ${highContrast ? "bg-gray-900 border-2 border-gray-800" : "bg-white shadow-lg"}`}>
            <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${highContrast ? "text-gray-500" : "text-gray-400"}`}>
              Atendimentos recentes
            </h2>
            <div className="space-y-3">
              {recentTickets.map((t) => (
                <div key={t.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                  highContrast ? "bg-black border-gray-800" : "bg-gray-50 border-gray-100"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg ${highContrast ? "text-gray-200" : "text-gray-700"}`}>{t.code}</span>
                    <span className={`text-xs ${highContrast ? "text-gray-400" : "text-gray-500"}`}>{t.service ?? "Geral"}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    t.status === "done"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {t.status === "done" ? "Finalizado" : "No-Show"}
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
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPauseModal(false) }}
        >
          <div className={`rounded-3xl p-8 w-full max-w-sm shadow-2xl transition-colors ${highContrast ? "bg-gray-900 border-2 border-white" : "bg-white"}`}>
            <h2 className={`text-2xl font-bold mb-6 ${highContrast ? "text-white" : "text-gray-800"}`}>Pausar Guichê</h2>
            <div className="space-y-3 mb-8">
              {PAUSE_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setPauseReason(r)}
                  className={`w-full py-4 rounded-xl border-2 text-md font-bold transition-all ${
                    pauseReason === r
                      ? (highContrast ? "border-white bg-white text-black" : "border-blue-500 bg-blue-50 text-blue-700")
                      : (highContrast ? "border-gray-700 text-gray-400 hover:border-gray-500" : "border-gray-100 text-gray-600 hover:border-gray-300")
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPauseModal(false)}
                className={`flex-1 py-3 border-2 rounded-xl font-bold transition-colors ${
                  highContrast ? "border-gray-700 text-gray-400 hover:border-white hover:text-white" : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => void handlePause()}
                disabled={!pauseReason || pauseDeskMut.isPending}
                className={`flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                  highContrast ? "bg-white text-black hover:bg-gray-200" : "bg-yellow-500 text-white hover:bg-yellow-600"
                }`}
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
