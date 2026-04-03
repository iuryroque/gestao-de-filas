"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { api } from "~/trpc/react"
import { useTheme } from "../_components/ThemeContext"
import { ThemeToggle } from "../_components/ThemeToggle"
import { Sidebar } from "../_components/layout/Sidebar"
import { Header } from "../_components/layout/Header"
import { CallingCard } from "../_components/guiche/CallingCard"
import { StatsOverview } from "../_components/guiche/StatsOverview"
import { NextTicketsList } from "../_components/guiche/NextTicketsList"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "select_desk" | "main"

interface CsatPrompt {
  ticketId: string
  code: string
}
type Role = "attendant" | "supervisor" | "admin"

interface DeskInfo {
  id: string
  name: string
  status: string
  pauseReason: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NO_SHOW = 2

const PAUSE_REASONS = ["Intervalo", "Suporte técnico", "Reunião", "Outro"]

// Simulated role — in a real auth flow, this would come from the session
const DEMO_ROLE: Role = "supervisor"

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
  const [timeoutWarning, setTimeoutWarning] = useState(false)
  const [reintegrateNote, setReintegrateNote] = useState("")
  const [reintegrateId, setReintegrateId]     = useState<string | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedQueueId, setSelectedQueueId]     = useState<string | null>(null)
  const [transferError, setTransferError]         = useState<string | null>(null)
  const [csatPrompt, setCsatPrompt]               = useState<CsatPrompt | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { highContrast } = useTheme()

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: desks, refetch: refetchDesks } = api.desk.list.useQuery()

  const { data: currentTicket, refetch: refetchCurrent } =
    api.ticket.currentForDesk.useQuery(
      { deskId: desk?.id ?? "" },
      { enabled: !!desk, refetchInterval: 4_000 },
    )

  // US-07: queue status panel — uses dashboard overview filtered to the desk's queue
  const currentQueueId = currentTicket?.queueId
  const { data: queueOverview } = api.dashboard.overview.useQuery(
    { queueId: currentQueueId },
    { enabled: !!desk && !!currentQueueId, refetchInterval: 3_000 },
  )
  const queuePanel = queueOverview?.[0] ?? null

  const { data: recentTickets, refetch: refetchRecent } =
    api.ticket.recentForDesk.useQuery(
      { deskId: desk?.id ?? "", limit: 5 },
      { enabled: !!desk },
    )

  const { data: avgTmaData } = api.ticket.avgTma.useQuery(
    {},
    { enabled: !!desk },
  )

  // ── Timeout Warning (US-04) ───────────────────────────────────────────────
  useEffect(() => {
    if (timeoutRef.current) clearInterval(timeoutRef.current)
    if (!currentTicket?.calledAt) {
      setTimeoutWarning(false)
      return
    }
    const avgSeconds = avgTmaData?.avgTma ?? 5 * 60 // fallback: 5 min
    const threshold = avgSeconds * 2 * 1000 // 2x TMA in ms

    timeoutRef.current = setInterval(() => {
      const elapsed = Date.now() - new Date(currentTicket.calledAt!).getTime()
      setTimeoutWarning(elapsed > threshold)
    }, 10_000) // check every 10s

    return () => { if (timeoutRef.current) clearInterval(timeoutRef.current) }
  }, [currentTicket?.calledAt, avgTmaData?.avgTma])

  // ── Transfer queries (US-06) ───────────────────────────────────────────────
  const { data: allQueues } = api.ticket.listQueues.useQuery(undefined, {
    enabled: showTransferModal,
  })

  const { data: targetQueueInfo } = api.ticket.queueInfo.useQuery(
    { queueId: selectedQueueId ?? "" },
    { enabled: !!selectedQueueId },
  )

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createDeskMut    = api.desk.create.useMutation({ onSuccess: () => void refetchDesks() })
  const activateDeskMut  = api.desk.activate.useMutation()
  const pauseDeskMut     = api.desk.pause.useMutation()
  const resumeDeskMut    = api.desk.resume.useMutation()
  const callNextMut      = api.ticket.callNext.useMutation()
  const finishMut        = api.ticket.finish.useMutation()
  const noShowMut        = api.ticket.noShow.useMutation()
  const recallMut        = api.ticket.recall.useMutation()
  const reintegrateMut   = api.ticket.reintegrate.useMutation()
  const transferMut      = api.ticket.transfer.useMutation()

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
    setCsatPrompt({ ticketId: currentTicket.id, code: currentTicket.code })
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

  async function handleReintegrate() {
    if (!reintegrateId) return
    await reintegrateMut.mutateAsync({ ticketId: reintegrateId, note: reintegrateNote || undefined })
    setReintegrateId(null)
    setReintegrateNote("")
    refreshAll()
  }

  async function handleTransfer() {
    if (!currentTicket || !selectedQueueId) return
    setTransferError(null)
    try {
      await transferMut.mutateAsync({
        ticketId: currentTicket.id,
        targetQueueId: selectedQueueId,
      })
      setShowTransferModal(false)
      setSelectedQueueId(null)
      refreshAll()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao transferir."
      setTransferError(msg)
    }
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

  return (
    <div className={`min-h-screen flex transition-colors ${highContrast ? "bg-black" : "bg-surface"}`}>
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header deskName={desk?.name} status={desk?.status} />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <main className="flex-1 p-8 overflow-y-auto space-y-12">
             <div className="flex justify-center">
                <CallingCard 
                  ticketCode={hasOpenTicket ? currentTicket!.code : null}
                  service={currentTicket?.service ?? undefined}
                  onCallNext={handleCallNext}
                  onRecall={handleRecall}
                  onTransfer={() => setShowTransferModal(true)}
                  onFinish={handleFinish}
                  isPending={callNextMut.isPending}
                />
             </div>

             <StatsOverview />
          </main>

          {/* Right Panel */}
          <NextTicketsList />
        </div>
      </div>

      {/* ── Modals (Maintained functionality) ────────────────────────────── */}
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

      {reintegrateId && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setReintegrateId(null) }}
        >
          <div className={`rounded-3xl p-8 w-full max-w-sm shadow-2xl ${highContrast ? "bg-gray-900 border-2 border-blue-400" : "bg-white"}`}>
            <h2 className={`text-xl font-bold mb-2 ${highContrast ? "text-white" : "text-gray-800"}`}>Reintegrar à Fila</h2>
            <p className={`text-sm mb-6 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
              O cidadão retornará ao final da fila como uma nova emissão. Registre o motivo (opcional).
            </p>
            <textarea
              value={reintegrateNote}
              onChange={(e) => setReintegrateNote(e.target.value)}
              placeholder="Ex: Cidadão precisou de auxílio para locomover-se"
              rows={3}
              className={`w-full rounded-xl border-2 px-4 py-3 text-sm resize-none focus:outline-none mb-6 transition-colors ${
                highContrast
                  ? "bg-black border-gray-700 text-white focus:border-blue-400"
                  : "bg-gray-50 border-gray-200 focus:border-blue-500"
              }`}
            />
            <div className="flex gap-4">
              <button
                onClick={() => setReintegrateId(null)}
                className={`flex-1 py-3 border-2 rounded-xl font-bold transition-colors ${
                  highContrast ? "border-gray-700 text-gray-400 hover:border-white hover:text-white" : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleReintegrate()}
                disabled={reintegrateMut.isPending}
                className={`flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                  highContrast ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {reintegrateMut.isPending ? "Reintegrando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && currentTicket && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTransferModal(false) }}
        >
          <div className={`rounded-3xl p-8 w-full max-w-md shadow-2xl ${highContrast ? "bg-gray-900 border-2 border-purple-400" : "bg-white"}`}>
            <h2 className={`text-xl font-bold mb-1 ${highContrast ? "text-white" : "text-gray-800"}`}>
              Transferir Ticket {currentTicket.code}
            </h2>
            <p className={`text-sm mb-6 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
              Selecione a fila de destino. O cidadão será posicionado conforme o horário original da senha.
            </p>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {allQueues?.filter(q => q.id !== currentTicket.queueId).map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQueueId(q.id)}
                  className={`w-full py-3 px-4 rounded-xl border-2 text-left text-sm font-semibold transition-all ${
                    selectedQueueId === q.id
                      ? (highContrast ? "border-purple-400 bg-purple-950 text-white" : "border-purple-500 bg-purple-50 text-purple-700")
                      : (highContrast ? "border-gray-700 text-gray-300 hover:border-gray-500" : "border-gray-100 text-gray-600 hover:border-gray-300")
                  }`}
                >
                  {q.name}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setShowTransferModal(false); setSelectedQueueId(null) }}
                className={`flex-1 py-3 border-2 rounded-xl font-bold transition-colors ${
                  highContrast ? "border-gray-700 text-gray-400 hover:border-white hover:text-white" : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleTransfer()}
                disabled={!selectedQueueId || transferMut.isPending}
                className={`flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                  highContrast ? "bg-purple-600 text-white hover:bg-purple-500" : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {transferMut.isPending ? "Transferindo…" : "Confirmar Transferência"}
              </button>
            </div>
          </div>
        </div>
      )}

      {csatPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center ${highContrast ? "bg-gray-900 border-2 border-green-400" : "bg-white"}`}>
            <h2 className={`text-xl font-bold mb-2 ${highContrast ? "text-white" : "text-gray-800"}`}>
              Avaliação de Atendimento
            </h2>
            <p className={`text-sm mb-4 ${highContrast ? "text-gray-300" : "text-gray-500"}`}>
              Ticket <strong>{csatPrompt.code}</strong> finalizado.
            </p>
            <button
              onClick={() => setCsatPrompt(null)}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                highContrast ? "bg-white text-black hover:bg-gray-200" : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              Fechar e Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
