"use client"

import React, { useState } from "react"
import { api } from "~/trpc/react"
import { useTheme } from "~/app/_components/ThemeContext"
import { Sidebar } from "../_components/layout/Sidebar"
import { Header } from "../_components/layout/Header"
import { StatusBanner } from "../_components/dashboard/StatusBanner"
import { QueueCard } from "../_components/dashboard/QueueCard"

// ─── Types ─────────────────────────────────────────────────────────────────

type SlaStatus = "ok" | "warning" | "critical"
type FilterStatus = "all" | "warning" | "critical"

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
    <div className={`min-h-screen flex transition-colors ${highContrast ? "bg-black" : "bg-surface"}`}>
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 p-10 overflow-y-auto">
          {/* Dashboard Header */}
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className={`text-4xl font-display font-black tracking-tight ${highContrast ? "text-white" : "text-primary"}`}>
                Dashboard de Monitoramento
              </h1>
              <p className={`text-xs font-body font-bold mt-2 uppercase tracking-widest ${highContrast ? "text-white/40" : "text-secondary/40"}`}>
                Atualizado às {lastUpdate} · Refetch em 5s
              </p>
            </div>

            {/* Filter Pill */}
            <div className={`flex p-1 rounded-2xl border transition-all ${
              highContrast ? "bg-black border-white" : "bg-surface-low border-secondary/5"
            }`}>
              {(["all", "warning", "critical"] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === f
                      ? (highContrast ? "bg-white text-black" : "bg-surface-lowest text-primary shadow-ambient")
                      : (highContrast ? "text-white/50 hover:text-white" : "text-secondary/40 hover:text-secondary")
                  }`}
                >
                  {f === "all" ? "Todas" : f === "warning" ? "Em Alerta" : "Crítico"}
                </button>
              ))}
            </div>
          </div>

          <StatusBanner 
            criticalCount={criticalCount} 
            warningCount={warningCount} 
            totalQueues={cards.length} 
          />

          {/* Cards Grid */}
          {cards.length === 0 ? (
            <div className={`text-center py-32 rounded-[2.5rem] border-2 border-dashed ${
              highContrast ? "border-white/20 text-white/40" : "border-secondary/10 text-secondary/30"
            }`}>
              <p className="text-3xl font-display font-black mb-2">Nenhuma fila operacional</p>
              <p className="text-sm font-body">As filas aparecerão aqui assim que tickets forem emitidos no totem.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`text-center py-20 ${highContrast ? "text-white/40" : "text-secondary/30"}`}>
              <p className="text-2xl font-display font-black">Nenhuma fila com este status</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filtered.map((card) => (
                <QueueCard key={card.queueId} card={card as any} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
