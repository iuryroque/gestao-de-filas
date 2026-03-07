"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { api } from "~/trpc/react"

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
  const [highContrast, setHighContrast]     = useState(false)
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

  // ── Theme helpers ──────────────────────────────────────────────────────────
  const bg  = highContrast ? "bg-black text-white" : "bg-gray-50 text-gray-900"
  const card = highContrast
    ? "border-2 border-white bg-gray-900 hover:bg-gray-800 active:bg-gray-700 transition-colors rounded-2xl"
    : "border border-gray-200 bg-white hover:bg-blue-50 active:bg-blue-100 shadow transition-colors rounded-2xl"
  const btnPrimary = highContrast
    ? "bg-white text-black hover:bg-gray-200 font-bold py-5 px-8 rounded-2xl text-2xl min-h-[64px] w-full transition-colors disabled:opacity-50"
    : "bg-blue-600 text-white hover:bg-blue-700 font-bold py-5 px-8 rounded-2xl text-2xl min-h-[64px] w-full transition-colors disabled:opacity-50"
  const btnSecondary = highContrast
    ? "bg-gray-800 text-white border border-white hover:bg-gray-700 font-semibold py-4 px-6 rounded-2xl text-xl min-h-[56px] w-full transition-colors"
    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 font-semibold py-4 px-6 rounded-2xl text-xl min-h-[56px] w-full transition-colors"

  const isPriority = priorityId !== null && priorityId !== "none"
  const priorityLabel = PRIORITY_GROUPS.find((g) => g.id === priorityId)?.label

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: HOME
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "home") {
    return (
      <div className={`${bg} min-h-screen flex flex-col items-center justify-center`}>
        <div className="text-center px-8 max-w-lg w-full flex flex-col gap-4">
          <div className="text-8xl mb-2" aria-hidden="true">🏛️</div>
          <h1 className="text-5xl font-black leading-tight">Atendimento Presencial</h1>
          <p className={`text-2xl mb-6 ${highContrast ? "text-gray-300" : "text-gray-500"}`}>
            Toque para emitir sua senha
          </p>
          <button
            className={btnPrimary}
            onClick={() => { touch(); setStep("category") }}
            aria-label="Emitir senha de atendimento"
          >
            Emitir Senha
          </button>
          <button
            className={btnSecondary}
            onClick={() => { touch(); setHighContrast((v) => !v) }}
            aria-label="Alternar modo alto contraste"
          >
            {highContrast ? "☀️ Alto Contraste: LIGADO" : "🌙 Alto Contraste: DESLIGADO"}
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
      <div className={`${bg} min-h-screen flex flex-col`} onClick={touch}>
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
                <span className="text-4xl" aria-hidden="true">{s.icon}</span>
                <span className="text-xl font-bold leading-tight">{s.name}</span>
                <span className={`text-sm ${highContrast ? "text-gray-300" : "text-gray-500"}`}>{s.description}</span>
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
      <div className={`${bg} min-h-screen flex flex-col`} onClick={touch}>
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
            <span className="text-2xl" aria-hidden="true">🚶</span>
            <span className="text-xl font-semibold">Não — atendimento regular</span>
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
      <div className={`${bg} min-h-screen flex flex-col`} onClick={touch}>
        <CountdownOverlay countdown={countdown} onContinue={touch} btnPrimary={btnPrimary} />
        <TotemHeader title="Confirme seu atendimento" onBack={() => setStep("priority")} highContrast={highContrast} />
        <div className="flex-1 p-6 max-w-xl mx-auto w-full flex flex-col gap-6">

          {/* Service summary card */}
          <div className={`${highContrast ? "bg-gray-900 border-2 border-white" : "bg-white border border-gray-200 shadow"} rounded-2xl p-6`}>
            <div className="text-5xl mb-3" aria-hidden="true">{selectedService?.icon}</div>
            <h2 className="text-3xl font-bold mb-1">{selectedService?.name}</h2>
            <p className={`text-lg ${highContrast ? "text-gray-300" : "text-gray-500"}`}>{selectedService?.description}</p>

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
                className="mt-4 bg-amber-100 border border-amber-400 text-amber-900 rounded-xl px-4 py-3 text-lg font-bold"
                role="status"
              >
                ⭐ ATENDIMENTO PREFERENCIAL
                <div className="text-base font-normal mt-1">{priorityLabel}</div>
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
      <div className={`${bg} min-h-screen flex flex-col`}>
        <div className="bg-blue-600 text-white text-center py-6">
          <h1 className="text-4xl font-black">Senha Emitida com Sucesso!</h1>
        </div>

        <div className="flex-1 p-6 max-w-xl mx-auto w-full flex flex-col gap-6">

          {/* Main ticket card */}
          <div
            className={`${highContrast ? "bg-gray-900 border-2 border-white" : "bg-white border border-gray-200 shadow-lg"} rounded-2xl p-8 text-center`}
            aria-live="polite"
            role="status"
          >
            {ticket.isPriority && (
              <div className="bg-amber-100 border border-amber-400 text-amber-900 rounded-xl px-4 py-2 text-lg font-bold mb-4 inline-block">
                ⭐ ATENDIMENTO PREFERENCIAL
              </div>
            )}

            {/* Ticket code — large display */}
            <div className="text-8xl font-black tracking-widest text-blue-600 my-4" aria-label={`Senha ${ticket.code}`}>
              {ticket.code}
            </div>

            <p className="text-2xl font-semibold mb-1">{ticket.service}</p>

            {/* Stats row */}
            <div className={`flex justify-center gap-10 mt-6 ${highContrast ? "text-gray-200" : "text-gray-600"}`}>
              <div className="text-center">
                <div className="text-4xl font-black text-gray-800">{String(ticket.position)}</div>
                <div className="text-sm mt-1">Na fila</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-gray-800">
                  {ticket.estimatedWait === 0 ? "—" : `~${String(ticket.estimatedWait)}`}
                </div>
                <div className="text-sm mt-1">{ticket.estimatedWait === 0 ? "Imediato" : "Min espera"}</div>
              </div>
            </div>

            <p className={`text-sm mt-6 ${highContrast ? "text-gray-400" : "text-gray-400"}`}>
              {dateStr} às {timeStr}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              className={btnSecondary}
              onClick={() => window.print()}
              aria-label="Imprimir comprovante"
            >
              🖨️ Imprimir comprovante
            </button>
            <button
              className={btnPrimary}
              onClick={resetToHome}
              aria-label="Voltar ao início para nova senha"
            >
              Nova senha
            </button>
          </div>

          <p className={`text-center text-xl ${highContrast ? "text-gray-300" : "text-gray-500"}`}>
            Aguarde ser chamado no painel de atendimento.
          </p>
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
    ? "bg-gray-900 border-b border-gray-700"
    : "bg-white border-b border-gray-200 shadow-sm"

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
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      role="alertdialog"
      aria-modal="true"
      aria-label="Sessão inativa"
    >
      <div className="bg-white rounded-2xl p-10 text-center max-w-sm mx-4 shadow-2xl">
        <p className="text-2xl font-bold text-gray-800 mb-4">Sessão inativa</p>
        <p className="text-8xl font-black text-red-600" aria-live="polite">{String(countdown)}</p>
        <p className="text-lg text-gray-600 mt-4">
          A tela retornará ao início em {String(countdown)} segundo{countdown !== 1 ? "s" : ""}.
        </p>
        <button onClick={onContinue} className={`${btnPrimary} mt-6`}>
          Continuar
        </button>
      </div>
    </div>
  )
}

