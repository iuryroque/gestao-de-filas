"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "~/trpc/react"
import { useTheme } from "~/app/_components/ThemeContext"

// ─── Types ─────────────────────────────────────────────────────────────────

type SlaStatus = "ok" | "warning" | "critical"
type FilterStatus = "all" | "warning" | "critical"

interface QueueCard {
  queueId: string
  queueName: string
  waitingCount: number
  priorityCount: number
  activeDesks: number
  sla: number
  slaStatus: SlaStatus
  tme2h: number
  tma2h: number
  tme1h: number
  tme4h: number
  estimatedWaitMinutes: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function slaColors(status: SlaStatus, highContrast: boolean) {
  if (status === "critical") {
    return highContrast
      ? "border-red-400 bg-red-950 text-white"
      : "border-red-400 bg-red-50 text-red-900"
  }
  if (status === "warning") {
    return highContrast
      ? "border-yellow-400 bg-yellow-950 text-white"
      : "border-yellow-400 bg-yellow-50 text-yellow-900"
  }
  return highContrast
    ? "border-green-500 bg-gray-900 text-white"
    : "border-green-300 bg-white text-gray-800"
}

function slaLabel(status: SlaStatus) {
  if (status === "critical") return "🔴 Crítico"
  if (status === "warning") return "🟡 Em Alerta"
  return "🟢 OK"
}

function slaTimeRemaining(tme: number, sla: number) {
  const remaining = sla - tme
  if (remaining <= 0) return "SLA violado"
  return `${remaining.toFixed(0)} min restantes`
}

// ─── Queue Card Component ─────────────────────────────────────────────────

function QueueCardComponent({
  card,
  highContrast,
}: {
  card: QueueCard
  highContrast: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isCritical = card.slaStatus === "critical"

  return (
    <div
      className={`rounded-2xl border-2 p-5 transition-all cursor-pointer ${slaColors(card.slaStatus, highContrast)} ${
        isCritical ? "animate-pulse-slow shadow-red-200 shadow-lg" : "shadow-sm"
      }`}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold">{card.queueName}</h3>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isCritical
                ? "bg-red-500 text-white"
                : card.slaStatus === "warning"
                ? "bg-yellow-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {slaLabel(card.slaStatus)}
          </span>
        </div>
        {card.activeDesks === 0 && card.waitingCount > 0 && (
          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg animate-bounce">
            NENHUM GUICHÊ ATIVO
          </div>
        )}
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold">{card.waitingCount}</p>
          <p className="text-xs opacity-70">Aguardando</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{card.tme2h.toFixed(0)}<span className="text-sm font-normal"> min</span></p>
          <p className="text-xs opacity-70">TME (2h)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{card.activeDesks}</p>
          <p className="text-xs opacity-70">Guichês ativos</p>
        </div>
      </div>

      {/* SLA progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1 opacity-70">
          <span>SLA: {card.sla} min</span>
          <span>
            {card.slaStatus !== "ok"
              ? slaTimeRemaining(card.tme2h, card.sla)
              : `${((card.tme2h / card.sla) * 100).toFixed(0)}% usado`}
          </span>
        </div>
        <div className={`w-full h-2 rounded-full ${highContrast ? "bg-gray-700" : "bg-gray-200"}`}>
          <div
            className={`h-2 rounded-full transition-all ${
              isCritical ? "bg-red-500" : card.slaStatus === "warning" ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min((card.tme2h / card.sla) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Priority & priority count */}
      {card.priorityCount > 0 && (
        <p className="text-xs opacity-70">🟡 {card.priorityCount} prioritários na fila</p>
      )}

      {/* Expanded details */}
      {expanded && (
        <div
          className={`mt-4 pt-4 border-t ${highContrast ? "border-gray-700" : "border-gray-200"} space-y-3`}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-bold uppercase tracking-wider opacity-60">Detalhes e Tendências</p>

          <div className={`rounded-xl p-3 text-sm ${highContrast ? "bg-black/30" : "bg-gray-50"}`}>
            <p className="font-semibold mb-2">
              TME — Tempo Médio de Espera
              <span className="ml-1 text-xs font-normal opacity-60">(emissão → chamada)</span>
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-bold">{card.tme1h.toFixed(1)} min</p>
                <p className="text-xs opacity-60">Última hora</p>
              </div>
              <div>
                <p className="font-bold">{card.tme2h.toFixed(1)} min</p>
                <p className="text-xs opacity-60">Últimas 2h</p>
              </div>
              <div>
                <p className="font-bold">{card.tme4h.toFixed(1)} min</p>
                <p className="text-xs opacity-60">Últimas 4h</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-3 text-sm ${highContrast ? "bg-black/30" : "bg-gray-50"}`}>
            <p className="font-semibold mb-2">
              TMA — Tempo Médio de Atendimento
              <span className="ml-1 text-xs font-normal opacity-60">(chamada → finalização)</span>
            </p>
            <div className="text-center">
              <p className="font-bold text-lg">{card.tma2h.toFixed(1)} min</p>
              <p className="text-xs opacity-60">Últimas 2h</p>
            </div>
          </div>

          <p className={`text-xs italic opacity-50 ${highContrast ? "" : "text-gray-500"}`}>
            TME alto + TMA normal → problema de capacidade (abrir mais guichês).<br />
            TMA alto + TME normal → complexidade de serviço ou formação de atendente.
          </p>
        </div>
      )}

      <p className="text-right text-xs mt-2 opacity-40">Clique para {expanded ? "recolher" : "expandir"}</p>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { highContrast } = useTheme()
  const [filter, setFilter] = useState<FilterStatus>("all")

  const { data: cards = [], dataUpdatedAt } = api.dashboard.overview.useQuery(
    {},
    { refetchInterval: 5_000 },
  )

  const filtered = cards.filter((c) => {
    if (filter === "all") return true
    return c.slaStatus === filter
  })

  const criticalCount = cards.filter((c) => c.slaStatus === "critical").length
  const warningCount  = cards.filter((c) => c.slaStatus === "warning").length

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")
    : "--"

  return (
    <main
      className={`min-h-screen p-6 ${
        highContrast ? "bg-black text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Monitoramento</h1>
            <p className={`text-sm mt-1 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
              Atualizado às {lastUpdate} · Refetch a cada 5s
            </p>
          </div>
          <Link
            href="/"
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              highContrast
                ? "border-gray-600 text-gray-300 hover:border-white"
                : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            ← Início
          </Link>
        </div>

        {/* Summary banners */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm animate-pulse">
              🔴 {criticalCount} fila{criticalCount > 1 ? "s" : ""} em estado CRÍTICO
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-xl font-bold text-sm">
              🟡 {warningCount} fila{warningCount > 1 ? "s" : ""} em alerta
            </div>
          )}
          {criticalCount === 0 && warningCount === 0 && cards.length > 0 && (
            <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm">
              🟢 Todas as filas dentro do SLA
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 mb-6">
          {(["all", "warning", "critical"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                filter === f
                  ? highContrast
                    ? "border-white bg-white text-black"
                    : "border-blue-500 bg-blue-600 text-white"
                  : highContrast
                  ? "border-gray-700 text-gray-400 hover:border-gray-500"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
              }`}
            >
              {f === "all" ? "Todas" : f === "warning" ? "Em Alerta" : "Crítico"}
            </button>
          ))}
          <span className={`ml-auto self-center text-sm ${highContrast ? "text-gray-500" : "text-gray-400"}`}>
            {filtered.length} de {cards.length} filas
          </span>
        </div>

        {/* Cards grid */}
        {cards.length === 0 ? (
          <div className={`text-center py-20 ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
            <p className="text-2xl mb-2">Nenhuma fila ativa</p>
            <p className="text-sm">Emita uma senha no totem para criar uma fila.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-20 ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
            <p className="text-xl">Nenhuma fila com este status</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((card) => (
              <QueueCardComponent
                key={card.queueId}
                card={card as QueueCard}
                highContrast={highContrast}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
