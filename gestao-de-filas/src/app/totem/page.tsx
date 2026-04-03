"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { api } from "~/trpc/react"
import { useTheme } from "../_components/ThemeContext"
import { ThemeToggle } from "../_components/ThemeToggle"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "home" | "category" | "priority" | "confirm" | "receipt"

interface Service {
  id: string
  name: string
  icon: string
  queueName: string
  description: string
}

interface PriorityGroup {
  id: string
  label: string
}

interface TicketResult {
  id: string
  code: string
  number: number
  service: string
  position: number
  estimatedWait: number
  isPriority: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INACTIVITY_WARN_MS = 60_000 // 60 seconds before showing countdown
const COUNTDOWN_SECONDS = 15

const SERVICES: Service[] = [
  { id: "geral",       name: "Atendimento Geral",      icon: "🪪", queueName: "Geral",       description: "Dúvidas gerais e orientações" },
  { id: "documentos",  name: "Emissão de Documentos",  icon: "📄", queueName: "Documentos",  description: "RG, CPF e outros documentos" },
  { id: "cobranca",    name: "Cobrança / Pagamentos",  icon: "💰", queueName: "Cobrança",    description: "Boletos, débitos e parcelamentos" },
  { id: "previdencia", name: "Previdência Social",      icon: "🏥", queueName: "Previdência", description: "Aposentadoria, auxílios e benefícios" },
  { id: "trabalho",    name: "Carteira de Trabalho",   icon: "💼", queueName: "Trabalho",    description: "CTPS digital e registros trabalhistas" },
  { id: "cadastro",    name: "Cadastro / Atualização", icon: "✏️", queueName: "Cadastro",    description: "Atualização de dados pessoais" },
]

const PRIORITY_GROUPS: PriorityGroup[] = [
  { id: "idoso",    label: "Idoso (60 anos ou mais)" },
  { id: "gestante", label: "Gestante" },
  { id: "pcd",      label: "Pessoa com Deficiência (PCD)" },
  { id: "crianca",  label: "Pessoa com criança de colo" },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TotemPage() {
  const [step, setStep]                     = useState<Step>("home")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [priorityId, setPriorityId]         = useState<string | null>(null)
  const [ticket, setTicket]                 = useState<TicketResult | null>(null)
  const { highContrast } = useTheme()
  const [countdown, setCountdown]           = useState<number | null>(null)
  const [emitError, setEmitError]           = useState<string | null>(null)

  const lastActivityRef = useRef<number>(Date.now())

  const resetToHome = useCallback(() => {
    setStep("home")
    setSelectedService(null)
    setPriorityId(null)
    setTicket(null)
    setEmitError(null)
    setCountdown(null)
    lastActivityRef.current = Date.now()
  }, [])

  const touch = useCallback(() => {
    lastActivityRef.current = Date.now()
    setCountdown(null)
  }, [])

  // ── Inactivity countdown (only on active steps) ────────────────────────────
  useEffect(() => {
    if (step === "home" || step === "receipt") {
      setCountdown(null)
      return
    }
    const timer = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= INACTIVITY_WARN_MS) {
        setCountdown((prev) => {
          if (prev === null) return COUNTDOWN_SECONDS
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  useEffect(() => {
    if (countdown === 0) resetToHome()
  }, [countdown, resetToHome])

  // ── tRPC ──────────────────────────────────────────────────────────────────
  const createMutation = api.ticket.create.useMutation()

  const { data: queueStatus } = api.ticket.queueStatus.useQuery(
    { queueName: selectedService?.queueName ?? "" },
    { enabled: step === "confirm" && !!selectedService },
  )

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleServiceSelect(service: Service) {
    touch()
    setSelectedService(service)
    setStep("priority")
  }

  function handlePrioritySelect(id: string) {
    touch()
    setPriorityId(id)
    setStep("confirm")
  }

  function handleConfirm() {
    if (!selectedService) return
    touch()
    setEmitError(null)
    const isPriority = priorityId !== null && priorityId !== "none"

    createMutation.mutate(
      { queueName: selectedService.queueName, service: selectedService.name, isPriority },
      {
        onSuccess: (data) => {
          setTicket({
            id: data.id,
            code: data.code,
            number: data.number,
            service: data.service ?? selectedService.name,
            position: data.position,
            estimatedWait: data.estimatedWait,
            isPriority: data.isPriority,
          })
          setStep("receipt")
        },
        onError: (err) => {
          setEmitError(err.message)
        },
      },
    )
  }

  // ─── Theme helpers ──────────────────────────────────────────────────────────
  const bg  = highContrast ? "bg-black text-white" : "bg-surface text-primary"
  const card = highContrast
    ? "border-2 border-white bg-black hover:bg-white/10 active:bg-white/20 transition-all rounded-3xl"
    : "bg-surface-lowest shadow-ambient hover:shadow-xl active:scale-[0.98] transition-all rounded-[2rem]"
  const btnPrimary = highContrast
    ? "bg-white text-black hover:bg-gray-200 font-black py-6 px-10 rounded-[2rem] text-2xl min-h-[80px] w-full transition-all disabled:opacity-50"
    : "bg-primary text-on-primary shadow-ambient hover:brightness-110 active:scale-[0.98] font-black py-6 px-10 rounded-[2rem] text-2xl min-h-[80px] w-full transition-all disabled:opacity-50"
  const btnSecondary = highContrast
    ? "bg-black text-white border-2 border-white hover:bg-white/10 font-bold py-5 px-8 rounded-[2rem] text-xl min-h-[70px] w-full transition-all"
    : "bg-surface-low text-primary hover:brightness-95 font-bold py-5 px-8 rounded-[2rem] text-xl min-h-[70px] w-full transition-all"

  const isPriority = priorityId !== null && priorityId !== "none"
  const priorityLabel = PRIORITY_GROUPS.find((g) => g.id === priorityId)?.label

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: HOME
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "home") {
    return (
      <div className={`${bg} min-h-screen flex flex-col items-center justify-center relative`}>
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="text-center px-8 max-w-lg w-full flex flex-col gap-6">
          <div className="text-9xl mb-4 animate-bounce" aria-hidden="true">🏛️</div>
          <h1 className="text-6xl font-display font-black leading-[0.9] tracking-tighter">Atendimento <br/><span className="opacity-40">Presencial</span></h1>
          <p className={`text-2xl font-body mt-2 mb-8 ${highContrast ? "text-white/60" : "text-secondary/60 italic"}`}>
            Toque para iniciar sua jornada guiada.
          </p>
          <button
            className={btnPrimary}
            onClick={() => { touch(); setStep("category") }}
            aria-label="Emitir senha de atendimento"
          >
            Emitir Senha
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: CATEGORY SELECTION
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "category") {
    return (
      <div className={`${bg} fixed inset-0 flex flex-col overflow-hidden`} onClick={touch}>
        <CountdownOverlay countdown={countdown} onContinue={touch} btnPrimary={btnPrimary} />
        <TotemHeader title="Selecione o serviço" onBack={resetToHome} highContrast={highContrast} />
        <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
          <div className="grid grid-cols-2 gap-4" role="list">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                role="listitem"
                className={`${card} p-6 text-left flex flex-col gap-2 min-h-[140px] cursor-pointer`}
                onClick={() => handleServiceSelect(s)}
                aria-label={s.name}
              >
                <span className="text-5xl mb-2" aria-hidden="true">{s.icon}</span>
                <span className="text-2xl font-display font-black leading-tight tracking-tight">{s.name}</span>
                <span className={`text-sm font-body ${highContrast ? "text-white/60" : "text-secondary/60"}`}>{s.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: PRIORITY DECLARATION
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "priority") {
    return (
      <div className={`${bg} fixed inset-0 flex flex-col overflow-hidden`} onClick={touch}>
        <CountdownOverlay countdown={countdown} onContinue={touch} btnPrimary={btnPrimary} />
        <TotemHeader title="Atendimento preferencial?" onBack={() => setStep("category")} highContrast={highContrast} />
        <div className="flex-1 p-6 max-w-xl mx-auto w-full flex flex-col gap-4">
          <p className={`text-lg ${highContrast ? "text-gray-300" : "text-gray-500"}`}>
            Selecione sua condição. A declaração é de sua responsabilidade (Lei Federal 10.048/2000).
          </p>
          {PRIORITY_GROUPS.map((g) => (
            <button
              key={g.id}
              className={`${card} p-5 text-left min-h-[64px] flex items-center gap-3`}
              onClick={() => handlePrioritySelect(g.id)}
              aria-label={g.label}
            >
              <span className="text-2xl" aria-hidden="true">⭐</span>
              <span className="text-xl font-semibold">{g.label}</span>
            </button>
          ))}
          <button
            className={`${card} p-5 text-left min-h-[64px] flex items-center gap-3`}
            onClick={() => handlePrioritySelect("none")}
            aria-label="Atendimento regular, sem preferencial"
          >
            <span className="text-3xl" aria-hidden="true">🚶</span>
            <span className="text-2xl font-display font-black tracking-tight leading-none pt-1">Não — atendimento regular</span>
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: CONFIRMATION
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "confirm") {
    return (
      <div className={`${bg} fixed inset-0 flex flex-col overflow-hidden`} onClick={touch}>
        <CountdownOverlay countdown={countdown} onContinue={touch} btnPrimary={btnPrimary} />
        <TotemHeader title="Confirme seu atendimento" onBack={() => setStep("priority")} highContrast={highContrast} />
        <div className="flex-1 p-6 max-w-xl mx-auto w-full flex flex-col gap-6">

          {/* Service summary card */}
          <div className={`${highContrast ? "bg-black border-2 border-white" : "bg-surface-lowest shadow-ambient"} rounded-[2.5rem] p-10`}>
            <div className="text-7xl mb-6" aria-hidden="true">{selectedService?.icon}</div>
            <h2 className="text-4xl font-display font-black tracking-tighter mb-2">{selectedService?.name}</h2>
            <p className={`text-xl font-body ${highContrast ? "text-white/60" : "text-secondary/60"}`}>{selectedService?.description}</p>

            {/* Estimated wait */}
            {queueStatus && (
              <div className={`mt-4 flex items-center gap-3 text-lg font-medium ${highContrast ? "text-gray-200" : "text-gray-700"}`}>
                <span aria-hidden="true">⏱</span>
                <span>
                  Estimativa de espera:{" "}
                  <strong>
                    {queueStatus.estimatedWait === 0
                      ? "Atendimento imediato"
                      : `~${String(queueStatus.estimatedWait)} min`}
                  </strong>
                  {" "}({String(queueStatus.waitingCount)} na fila)
                </span>
              </div>
            )}

            {/* Priority badge */}
            {isPriority && priorityLabel && (
              <div
                className={`mt-8 ${highContrast ? "bg-white text-black" : "bg-warning-container/40 text-on-warning-container"} rounded-[2rem] px-8 py-6 transition-all`}
                role="status"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Status Atendimento</div>
                <div className="text-2xl font-display font-black tracking-tight">⭐ PREFERENCIAL</div>
                <div className="text-sm font-body opacity-70 mt-2">{priorityLabel}</div>
              </div>
            )}
          </div>

          {/* Service unavailable error */}
          {emitError && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-4 text-lg" role="alert">
              ⚠️ {emitError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              className={btnPrimary}
              onClick={handleConfirm}
              disabled={createMutation.isPending}
              aria-busy={createMutation.isPending}
            >
              {createMutation.isPending ? "Emitindo senha…" : "✅ Confirmar e Emitir Senha"}
            </button>
            <button
              className={btnSecondary}
              onClick={() => { touch(); setStep("priority") }}
            >
              ← Corrigir
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: RECEIPT
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "receipt" && ticket) {
    const now = new Date()
    const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    return (
      <div className={`${bg} fixed inset-0 flex flex-col overflow-hidden`}>
        {/* Banner sem bordas, Tonal Layering */}
        <div className={`${highContrast ? "bg-white text-black" : "bg-primary text-on-primary"} text-center py-8 px-6 shadow-ambient`}>
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase italic">Senha Emitida com Sucesso!</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full gap-8">
          
          <div className="flex flex-col lg:flex-row items-center gap-10 w-full">
            {/* Main ticket card — Authority Rule: Massive Display */}
            <div
              className={`${highContrast ? "bg-black border-4 border-white" : "bg-surface-lowest shadow-ambient"} rounded-[4rem] p-16 flex-1 text-center relative overflow-hidden`}
              aria-live="polite"
              role="status"
            >
              {/* Background watermark for premium feel */}
              {!highContrast && <div className="absolute top-0 right-0 text-[15rem] font-black text-primary/5 select-none -translate-y-1/4 translate-x-1/4 italic">{ticket.code.charAt(0)}</div>}

              {ticket.isPriority && (
                <div className={`${highContrast ? "bg-white text-black" : "bg-warning-container/30 text-on-warning-container border border-warning-container/20"} rounded-full px-8 py-2 text-xs font-black uppercase tracking-[0.2em] mb-6 inline-block`}>
                  ⭐ ATENDIMENTO PREFERENCIAL
                </div>
              )}

              {/* Ticket code — Authority Scale */}
              <div className={`text-[10rem] font-display font-black tracking-tighter leading-none mb-4 ${highContrast ? "text-white" : "text-primary"}`} aria-label={`Senha ${ticket.code}`}>
                {ticket.code}
              </div>

              <p className={`text-2xl font-body font-bold mb-10 ${highContrast ? "text-white/60" : "text-secondary/60"}`}>{ticket.service}</p>

              {/* Stats row with Tonal Layering */}
              <div className="flex justify-center gap-20">
                <div className="text-center group">
                  <div className={`text-6xl font-display font-black ${highContrast ? "text-white" : "text-primary"}`}>{String(ticket.position)}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-2">Posição na Fila</div>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-display font-black ${highContrast ? "text-white" : "text-primary"}`}>
                    {ticket.estimatedWait === 0 ? "—" : `~${String(ticket.estimatedWait)}'`}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-2">{ticket.estimatedWait === 0 ? "Atendimento Imediato" : "Minutos de Espera"}</div>
                </div>
              </div>

              <div className={`absolute bottom-8 left-0 right-0 text-[10px] font-black uppercase tracking-widest opacity-20 ${highContrast ? "text-white" : "text-primary"}`}>
                {dateStr} — {timeStr}
              </div>
            </div>

            {/* Actions Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              <button
                className={`${btnSecondary} !bg-surface-low/50 backdrop-blur-md border border-white/10 flex items-center justify-center gap-3`}
                onClick={() => window.print()}
                aria-label="Imprimir comprovante"
              >
                <span>🖨️</span>
                <span>Imprimir Ticket</span>
              </button>
              
              <button
                className={`${btnPrimary} flex items-center justify-center gap-3 mt-4 h-32 text-3xl`}
                onClick={resetToHome}
                aria-label="Voltar ao início para nova senha"
              >
                Nova senha
              </button>

              <div className={`mt-6 text-center p-6 rounded-3xl ${highContrast ? "border border-white/10" : "bg-primary/5"}`}>
                 <p className={`text-xs font-bold leading-relaxed ${highContrast ? "text-white/40" : "text-secondary/60"}`}>
                   Acompanhe as chamadas <br/>no painel eletrônico principal.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TotemHeader({
  title,
  onBack,
  highContrast,
}: {
  title: string
  onBack: () => void
  highContrast: boolean
}) {
  const cls = highContrast
    ? "bg-black border-b border-white"
    : "bg-surface-lowest/80 backdrop-blur-md"

  return (
    <div className={`${cls} px-6 py-4 flex items-center gap-4`}>
      <button
        onClick={onBack}
        className="text-3xl font-bold px-4 py-2 rounded-xl hover:bg-gray-100 min-w-[44px] min-h-[44px]"
        aria-label="Voltar"
      >
        ←
      </button>
      <h1 className="text-2xl font-bold flex-1">{title}</h1>
      <ThemeToggle />
    </div>
  )
}

function CountdownOverlay({
  countdown,
  onContinue,
  btnPrimary,
}: {
  countdown: number | null
  onContinue: () => void
  btnPrimary: string
}) {
  if (countdown === null) return null

  return (
    <div
      className="fixed inset-0 bg-primary/20 backdrop-blur-xl flex items-center justify-center z-50 transition-all p-6"
      role="alertdialog"
      aria-modal="true"
      aria-label="Sessão inativa"
    >
      <div className="bg-surface-lowest/90 backdrop-blur-2xl rounded-[3rem] p-12 text-center max-w-md w-full shadow-2xl border border-white/20">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary opacity-60 mb-6">Inatividade Detectada</div>
        <p className="text-3xl font-display font-black text-primary leading-tight mb-8">Deseja continuar seu atendimento?</p>
        <div className="relative inline-block mb-10 h-32 flex items-center justify-center">
            <p className="text-9xl font-display font-black text-primary" aria-live="polite">
                {String(countdown)}
            </p>
        </div>
        <button onClick={onContinue} className={btnPrimary}>
          Continuar Atendimento
        </button>
      </div>
    </div>
  )
}

