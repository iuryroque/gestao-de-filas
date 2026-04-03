"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2 } from "lucide-react"
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

  // Real Performance Metrics for StatsOverview
  const today = new Date().toISOString()
  const { data: performanceData } = api.report.attendantReport.useQuery(
    { startDate: today, endDate: today, deskId: desk?.id },
    { enabled: !!desk, refetchInterval: 10_000 }
  )
  const deskPerf = performanceData?.[0]

  const { data: waitingData } = api.ticket.waitingTickets.useQuery(
    { limit: 10 },
    { enabled: !!desk, refetchInterval: 5_000 }
  )
  
  const nextTickets = waitingData?.map(t => ({
    id: t.id,
    code: t.code,
    service: t.queue.name,
    time: new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    wait: waitTimeLabel(t.createdAt),
    isCritical: t.isPriority
  })) ?? []

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createDeskMut    = api.desk.create.useMutation({ onSuccess: () => void refetchDesks() })
  const activateDeskMut  = api.desk.activate.useMutation()
  const pauseDeskMut     = api.desk.pause.useMutation()
  const resumeDeskMut    = api.desk.resume.useMutation()
  const callNextMut      = api.ticket.callNext.useMutation({
    onError: (err) => {
      console.error("[tRPC Ticket.callNext Error]:", err.message, err.data);
      setCallError(err.message);
    }
  })
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
      <main className={`min-h-screen flex items-center justify-center p-6 transition-colors ${highContrast ? "bg-black" : "bg-surface"}`}>
        <div className={`w-full max-w-md rounded-[3rem] shadow-ambient p-10 transition-colors ${highContrast ? "bg-black border-2 border-white" : "bg-surface-lowest"}`}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className={`text-4xl font-display font-black tracking-tighter mb-2 ${highContrast ? "text-white" : "text-primary"}`}>Acesso ao Guichê</h1>
              <p className={`text-sm font-body ${highContrast ? "text-white/40" : "text-secondary/60"}`}>Selecione seu posto para iniciar a jornada.</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Existing desks */}
          <div className="space-y-3 mb-6">
            {desks?.map((d) => (
              <button
                key={d.id}
                onClick={() => void handleSelectDesk(d)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${
                  highContrast 
                    ? "border-2 border-white bg-black hover:bg-white/10" 
                    : "bg-surface-low hover:bg-surface-variant/40"
                }`}
              >
                <span className={`font-display font-black tracking-tight ${highContrast ? "text-white" : "text-primary"}`}>{d.name}</span>
                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                  d.status === "active"  ? (highContrast ? "bg-white text-black" : "bg-success-container text-on-success-container") :
                  d.status === "paused"  ? (highContrast ? "bg-white text-black" : "bg-warning-container text-on-warning-container") :
                                           (highContrast ? "bg-white/10 text-white/50" : "bg-surface-lowest text-secondary/40")
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
          <div className={`mt-8 pt-8 ${highContrast ? "border-t border-white/20" : "border-t border-secondary/5"}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${highContrast ? "text-white/40" : "text-secondary/40"}`}>Ou crie um novo guichê:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeskName}
                onChange={(e) => setNewDeskName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleCreateDesk()}
                placeholder="Ex: Guichê 01"
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-body transition-all ${
                  highContrast
                    ? "bg-black border-2 border-white text-white focus:bg-white/10"
                    : "bg-surface-low text-primary focus:bg-surface-variant/20 outline-none"
                }`}
              />
              <button
                onClick={() => void handleCreateDesk()}
                disabled={!newDeskName.trim() || createDeskMut.isPending}
                className={`px-6 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50 ${
                  highContrast
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-primary text-on-primary shadow-sm hover:brightness-110"
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
    <div className={`h-screen flex overflow-hidden transition-colors ${highContrast ? "bg-black" : "bg-surface"}`}>
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header deskName={desk?.name} status={desk?.status} />
        
        {/* Error Alert Banner */}
        {callError && (
          <div className={`px-10 py-4 flex items-center justify-between animate-in slide-in-from-top duration-300 ${
            highContrast ? "bg-white text-black" : "bg-error-container text-on-error-container border-b border-error-container/20"
          }`}>
            <p className="text-sm font-black uppercase tracking-widest">{callError}</p>
            <button 
              onClick={() => setCallError(null)}
              className={`p-2 rounded-lg font-black ${highContrast ? "hover:bg-black/10" : "hover:bg-on-error-container/10"}`}
            >
              FECHAR
            </button>
          </div>
        )}
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <main className="flex-1 p-6 flex flex-col justify-between overflow-hidden">
             <div className="flex justify-center flex-1 items-center min-h-0">
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

             <StatsOverview 
                completed={deskPerf?.totalAttended ?? 0}
                tma={deskPerf?.avgTma ? `${Math.floor(deskPerf.avgTma)}:${String(Math.round((deskPerf.avgTma % 1) * 60)).padStart(2, '0')}` : "--"}
                slaBreaches={deskPerf?.noShowCount ?? 0}
              />
          </main>

          {/* Right Panel */}
          <NextTicketsList tickets={nextTickets} />
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
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className={`rounded-[3rem] p-12 w-full max-w-sm shadow-ambient text-center transition-all ${
            highContrast ? "bg-black border-4 border-white" : "bg-surface-lowest"
          }`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 ${
              highContrast ? "bg-white text-black" : "bg-success-container/30 text-success"
            }`}>
               <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <h2 className={`text-2xl font-display font-black mb-2 ${highContrast ? "text-white" : "text-primary"}`}>
              Atendimento Finalizado
            </h2>
            <p className={`text-sm font-body mb-10 ${highContrast ? "text-white/60" : "text-secondary/60"}`}>
              Ticket <strong className={highContrast ? "text-white" : "text-primary"}>{csatPrompt.code}</strong> concluído com sucesso.
            </p>
            
            <button
              onClick={() => setCsatPrompt(null)}
              className={`w-full py-5 rounded-2xl font-display font-black text-lg transition-all hover:scale-[1.03] active:scale-[0.97] shadow-ambient ${
                highContrast 
                  ? "bg-white text-black" 
                  : "bg-primary text-on-primary shadow-primary/20"
              }`}
            >
              Concluir Jornada
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
