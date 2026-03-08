"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { api } from "~/trpc/react"
import { useTheme } from "~/app/_components/ThemeContext"

// ─── Helpers ───────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function thirtyDaysAgoISO() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type Tab = "queues" | "attendants" | "satisfaction"

export default function RelatoriosPage() {
  const { highContrast } = useTheme()
  const [tab, setTab] = useState<Tab>("queues")
  const [startDate, setStartDate] = useState(thirtyDaysAgoISO)
  const [endDate, setEndDate] = useState(todayISO)
  const [selectedQueue, setSelectedQueue] = useState<string>("")
  const [selectedDesk, setSelectedDesk] = useState<string>("")

  // Data queries
  const { data: queues } = api.ticket.listQueues.useQuery()
  const { data: desks } = api.desk.list.useQuery(undefined, { enabled: tab === "satisfaction" })
  const { data: queueReport = [] } = api.report.queueReport.useQuery(
    { startDate, endDate, queueId: selectedQueue || undefined },
    { enabled: tab === "queues" },
  )
  const { data: attendantReport = [] } = api.report.attendantReport.useQuery(
    { startDate, endDate },
    { enabled: tab === "attendants" },
  )

  // US-11: CSAT queries
  const { data: csatStats = [] } = api.csat.attendantStats.useQuery(
    { startDate, endDate, deskId: selectedDesk || undefined },
    { enabled: tab === "satisfaction" },
  )
  const { data: npsData } = api.csat.serviceNps.useQuery(
    { startDate, endDate },
    { enabled: tab === "satisfaction" },
  )
  const { data: flagged = [] } = api.csat.pendingFlagged.useQuery(
    { limit: 20 },
    { enabled: tab === "satisfaction" },
  )

  // Totals for queue report
  const queueTotals = useMemo(() => {
    if (queueReport.length === 0) return null
    const totalTickets = queueReport.reduce((a, q) => a + q.totalTickets, 0)
    const totalNoShow = queueReport.reduce((a, q) => a + q.noShowCount, 0)
    const avgTme = +(queueReport.reduce((a, q) => a + q.avgTme, 0) / queueReport.length).toFixed(1)
    const avgTma = +(queueReport.reduce((a, q) => a + q.avgTma, 0) / queueReport.length).toFixed(1)
    return { totalTickets, totalNoShow, noShowRate: totalTickets > 0 ? +((totalNoShow / totalTickets) * 100).toFixed(1) : 0, avgTme, avgTma }
  }, [queueReport])

  // CSV export handlers
  function exportQueueCSV() {
    const headers = ["Fila", "Total Tickets", "TME (min)", "TMA (min)", "No-Show", "No-Show %", "Breaches SLA"]
    const rows = queueReport.map((q) => [
      `"${q.queueName}"`, String(q.totalTickets), String(q.avgTme), String(q.avgTma),
      String(q.noShowCount), String(q.noShowRate), String(q.slaBreaches),
    ])
    downloadCSV(`relatorio_filas_${startDate}_${endDate}.csv`, headers, rows)
  }

  function exportAttendantCSV() {
    const headers = ["Guichê", "Chamados", "Atendidos", "TMA (min)", "No-Show", "No-Show %", "Pausa (min)"]
    const rows = attendantReport.map((d) => [
      `"${d.deskName}"`, String(d.totalCalled), String(d.totalAttended), String(d.avgTma),
      String(d.noShowCount), String(d.noShowRate), String(d.totalPauseMinutes),
    ])
    downloadCSV(`relatorio_atendentes_${startDate}_${endDate}.csv`, headers, rows)
  }

  const bg = highContrast ? "bg-black text-white" : "bg-gray-100 text-gray-900"
  const card = highContrast ? "bg-gray-900 border-2 border-gray-800" : "bg-white shadow-sm"
  const inputCls = highContrast
    ? "bg-black border-gray-700 text-white focus:border-blue-400"
    : "bg-white border-gray-200 text-gray-800 focus:border-blue-500"

  return (
    <main className={`min-h-screen p-6 ${bg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">📋 Relatórios</h1>
            <p className={`text-sm mt-1 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
              Métricas de atendimento e desempenho
            </p>
          </div>
          <Link href="/" className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            highContrast ? "border-gray-600 text-gray-300 hover:border-white" : "border-gray-200 text-gray-500 hover:border-gray-400"
          }`}>← Início</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([["queues", "Atendimento (US-09)"], ["attendants", "Atendentes (US-10)"], ["satisfaction", "Satisfação (US-11)"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                tab === key
                  ? (highContrast ? "border-white bg-white text-black" : "border-blue-500 bg-blue-600 text-white")
                  : (highContrast ? "border-gray-700 text-gray-400 hover:border-gray-500" : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white")
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Filters */}
        <div className={`rounded-2xl p-5 mb-6 ${card}`}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold uppercase ${highContrast ? "text-gray-500" : "text-gray-400"}`}>Início</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${inputCls}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold uppercase ${highContrast ? "text-gray-500" : "text-gray-400"}`}>Fim</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${inputCls}`} />
            </div>
            {tab === "queues" && (
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-bold uppercase ${highContrast ? "text-gray-500" : "text-gray-400"}`}>Fila</label>
                <select value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}
                  className={`rounded-lg border px-3 py-2 text-sm ${inputCls}`}>
                  <option value="">Todas</option>
                  {queues?.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
              </div>
            )}
            {tab === "satisfaction" && (
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-bold uppercase ${highContrast ? "text-gray-500" : "text-gray-400"}`}>Guichê</label>
                <select value={selectedDesk} onChange={(e) => setSelectedDesk(e.target.value)}
                  className={`rounded-lg border px-3 py-2 text-sm ${inputCls}`}>
                  <option value="">Todos</option>
                  {desks?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            <button
              onClick={tab === "queues" ? exportQueueCSV : exportAttendantCSV}
              disabled={tab === "satisfaction"}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-30 ${
                highContrast ? "bg-green-700 text-white hover:bg-green-600" : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >📥 Exportar CSV</button>
          </div>
        </div>

        {/* ── Queue Report (US-09) ──────────────────────────────── */}
        {tab === "queues" && (
          <>
            {/* Summary cards */}
            {queueTotals && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: "Total Tickets", value: queueTotals.totalTickets },
                  { label: "TME Médio", value: `${queueTotals.avgTme} min` },
                  { label: "TMA Médio", value: `${queueTotals.avgTma} min` },
                  { label: "No-Shows", value: queueTotals.totalNoShow },
                  { label: "Taxa No-Show", value: `${queueTotals.noShowRate}%` },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-4 text-center ${card}`}>
                    <p className={`text-2xl font-bold ${highContrast ? "text-white" : "text-gray-800"}`}>{s.value}</p>
                    <p className={`text-xs ${highContrast ? "text-gray-500" : "text-gray-400"}`}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            {queueReport.length === 0 ? (
              <div className={`text-center py-16 ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                <p className="text-xl mb-2">Nenhum atendimento registrado</p>
                <p className="text-sm">Ajuste o período ou os filtros de fila.</p>
              </div>
            ) : (
              <div className={`rounded-2xl overflow-hidden ${card}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={highContrast ? "bg-gray-800" : "bg-gray-50"}>
                      {["Fila", "Tickets", "TME (min)", "TMA (min)", "No-Show", "No-Show %", "Breaches SLA"].map((h) => (
                        <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase ${highContrast ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queueReport.map((q) => (
                      <tr key={q.queueId} className={`border-t ${highContrast ? "border-gray-800" : "border-gray-100"}`}>
                        <td className="px-4 py-3 font-semibold">{q.queueName}</td>
                        <td className="px-4 py-3">{q.totalTickets}</td>
                        <td className="px-4 py-3">{q.avgTme}</td>
                        <td className="px-4 py-3">{q.avgTma}</td>
                        <td className="px-4 py-3">{q.noShowCount}</td>
                        <td className="px-4 py-3">
                          <span className={q.noShowRate > 10 ? "text-red-500 font-bold" : ""}>{q.noShowRate}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={q.slaBreaches > 0 ? "text-red-500 font-bold" : ""}>{q.slaBreaches}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Service breakdown */}
            {queueReport.length > 0 && queueReport.some((q) => q.byService.length > 1) && (
              <div className={`rounded-2xl p-5 mt-6 ${card}`}>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${highContrast ? "text-gray-500" : "text-gray-400"}`}>
                  Detalhamento por Serviço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {queueReport.map((q) => (
                    <div key={q.queueId}>
                      <p className="font-semibold text-sm mb-2">{q.queueName}</p>
                      <div className="space-y-1">
                        {q.byService.map((s) => (
                          <div key={s.service} className={`flex justify-between text-xs px-3 py-2 rounded-lg ${highContrast ? "bg-black" : "bg-gray-50"}`}>
                            <span>{s.service}</span>
                            <span>{s.count} tickets · TMA {s.avgTma} min</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Attendant Report (US-10) ─────────────────────────── */}
        {tab === "attendants" && (
          <>
            {attendantReport.length === 0 ? (
              <div className={`text-center py-16 ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                <p className="text-xl mb-2">Nenhum atendimento registrado</p>
                <p className="text-sm">Ajuste o período para incluir dias com atividade.</p>
              </div>
            ) : (
              <>
                <div className={`rounded-2xl overflow-hidden ${card}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={highContrast ? "bg-gray-800" : "bg-gray-50"}>
                        {["Guichê", "Chamados", "Atendidos", "TMA (min)", "No-Show", "No-Show %", "Pausa (min)"].map((h) => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase ${highContrast ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attendantReport.map((d) => (
                        <tr key={d.deskId} className={`border-t ${highContrast ? "border-gray-800" : "border-gray-100"}`}>
                          <td className="px-4 py-3 font-semibold">{d.deskName}</td>
                          <td className="px-4 py-3">{d.totalCalled}</td>
                          <td className="px-4 py-3">{d.totalAttended}</td>
                          <td className="px-4 py-3">{d.avgTma}</td>
                          <td className="px-4 py-3">{d.noShowCount}</td>
                          <td className="px-4 py-3">
                            <span className={d.noShowRate > 15 ? "text-red-500 font-bold" : ""}>{d.noShowRate}%</span>
                          </td>
                          <td className="px-4 py-3">{d.totalPauseMinutes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Fair comparison note (US-10 CA 2) */}
                <p className={`text-xs mt-4 italic ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                  ⚠️ Atendentes com serviços de maior complexidade tendem a ter TMA mais alto. Compare com atendentes da mesma fila para análise justa.
                </p>
              </>
            )}
          </>
        )}

        {/* ── US-11: Satisfação tab ──────────────────────────────────────── */}
        {tab === "satisfaction" && (
          <div className="space-y-8">
            {/* NPS por Serviço */}
            <section>
              <h2 className={`text-lg font-bold mb-3 ${highContrast ? "text-white" : "text-gray-700"}`}>NPS por Serviço</h2>
              {!npsData || npsData.byService.length === 0 ? (
                <div className={`text-center py-10 rounded-2xl ${card} ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                  <p className="text-sm">Sem dados de NPS no período.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {npsData.byService.map((s) => (
                    <div key={s.service} className={`rounded-2xl p-5 ${card}`}>
                      <p className={`font-bold text-sm mb-3 truncate ${highContrast ? "text-gray-300" : "text-gray-600"}`}>{s.service}</p>
                      {s.insufficientData ? (
                        <p className={`text-xs italic ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                          Dados insuficientes (mín. 10 respostas, atual: {s.total})
                        </p>
                      ) : (
                        <>
                          <div className={`text-4xl font-black mb-2 ${(s.nps ?? 0) >= 50 ? "text-green-500" : (s.nps ?? 0) >= 0 ? "text-yellow-500" : "text-red-500"}`}>
                            {s.nps}
                          </div>
                          <div className={`text-xs space-y-0.5 ${highContrast ? "text-gray-400" : "text-gray-500"}`}>
                            <p>👍 Promotores: {s.promoters} &nbsp;·&nbsp; 😐 Neutros: {s.neutrals} &nbsp;·&nbsp; 👎 Detratores: {s.detractors}</p>
                            <p>Total de respostas: {s.total}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* CSAT por Guichê */}
            <section>
              <h2 className={`text-lg font-bold mb-3 ${highContrast ? "text-white" : "text-gray-700"}`}>CSAT por Guichê</h2>
              {csatStats.length === 0 ? (
                <div className={`text-center py-10 rounded-2xl ${card} ${highContrast ? "text-gray-600" : "text-gray-400"}`}>
                  <p className="text-sm">Sem avaliações registradas no período.</p>
                </div>
              ) : (
                <div className={`rounded-2xl overflow-hidden ${card}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={highContrast ? "bg-gray-800" : "bg-gray-50"}>
                        {["Guichê", "CSAT Médio", "TMA Médio", "Taxa Resposta", "Distribuição (1→5)"].map((h) => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase ${highContrast ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csatStats.map((d) => (
                        <tr key={d.deskId} className={`border-t ${highContrast ? "border-gray-800" : "border-gray-100"}`}>
                          <td className="px-4 py-3 font-semibold">{d.deskName}</td>
                          <td className="px-4 py-3">
                            {d.avgCsat !== null ? (
                              <span className={d.avgCsat >= 4 ? "text-green-500 font-bold" : d.avgCsat >= 3 ? "text-yellow-500 font-bold" : "text-red-500 font-bold"}>
                                {"★".repeat(Math.round(d.avgCsat))} {d.avgCsat}
                              </span>
                            ) : <span className={highContrast ? "text-gray-600" : "text-gray-400"}>—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {d.avgTmaMinutes !== null ? `${d.avgTmaMinutes} min` : <span className={highContrast ? "text-gray-600" : "text-gray-400"}>—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span title={`${d.ratedCount} de ${d.totalAttempts} tickets avaliados`}>
                              {d.responseRate}% <span className={`text-xs ${highContrast ? "text-gray-500" : "text-gray-400"}`}>({d.ratedCount}/{d.totalAttempts})</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 text-xs">
                              {[1,2,3,4,5].map((s) => (
                                <span key={s} title={`${s}★: ${d.distribution[String(s)] ?? 0}`} className={`px-1.5 py-0.5 rounded ${highContrast ? "bg-gray-800" : "bg-gray-100"}`}>
                                  {d.distribution[String(s)] ?? 0}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Monthly NPS Evolution (AC 4.4) */}
            {npsData && npsData.monthlyEvolution.length > 0 && (
              <section>
                <h2 className={`text-lg font-bold mb-3 ${highContrast ? "text-white" : "text-gray-700"}`}>Evolução Mensal do NPS</h2>
                <div className="space-y-4">
                  {npsData.monthlyEvolution.map((svc) => (
                    <div key={svc.service} className={`rounded-2xl p-5 ${card}`}>
                      <p className={`font-bold text-sm mb-3 ${highContrast ? "text-gray-300" : "text-gray-600"}`}>{svc.service}</p>
                      <div className="flex gap-3 flex-wrap">
                        {svc.evolution.map((m) => (
                          <div key={m.month} className={`rounded-xl px-4 py-3 text-center min-w-[80px] ${highContrast ? "bg-black border border-gray-800" : "bg-gray-50 border border-gray-100"}`}>
                            <p className={`text-xs mb-1 ${highContrast ? "text-gray-500" : "text-gray-400"}`}>{m.month}</p>
                            {m.insufficientData ? (
                              <p className={`text-xs italic ${highContrast ? "text-gray-600" : "text-gray-400"}`}>—</p>
                            ) : (
                              <p className={`text-xl font-black ${(m.nps ?? 0) >= 50 ? "text-green-500" : (m.nps ?? 0) >= 0 ? "text-yellow-500" : "text-red-500"}`}>
                                {m.nps}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Comentários Pendentes de Revisão */}
            {flagged.length > 0 && (
              <section>
                <h2 className={`text-lg font-bold mb-3 ${highContrast ? "text-yellow-400" : "text-yellow-600"}`}>
                  ⚠️ Comentários Aguardando Revisão ({flagged.length})
                </h2>
                <div className="space-y-3">
                  {flagged.map((r) => (
                    <div key={r.id} className={`rounded-xl p-4 border ${highContrast ? "bg-gray-900 border-yellow-700" : "bg-yellow-50 border-yellow-200"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-xs mb-1 ${highContrast ? "text-gray-500" : "text-gray-400"}`}>
                            Ticket: {r.ticketId.slice(0, 8)}… · {"★".repeat(r.rating ?? 0)} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                          <p className={`text-sm ${highContrast ? "text-white" : "text-gray-800"}`}>{r.comment}</p>
                        </div>
                        <ReviewButtons responseId={r.id} highContrast={highContrast} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Review Buttons sub-component ─────────────────────────────────────────

function ReviewButtons({ responseId, highContrast }: { responseId: string; highContrast: boolean }) {
  const utils = api.useUtils()
  const reviewMut = api.csat.reviewFlagged.useMutation({
    onSuccess: () => void utils.csat.pendingFlagged.invalidate(),
  })

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => reviewMut.mutate({ responseId, action: "approve" })}
        disabled={reviewMut.isPending}
        title="Aprovar (tornar visível)"
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
          highContrast ? "bg-green-800 text-green-300 hover:bg-green-700" : "bg-green-100 text-green-700 hover:bg-green-200"
        }`}
      >
        ✓ Aprovar
      </button>
      <button
        onClick={() => reviewMut.mutate({ responseId, action: "reject" })}
        disabled={reviewMut.isPending}
        title="Rejeitar (remover comentário, manter nota)"
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
          highContrast ? "bg-red-900 text-red-400 hover:bg-red-800" : "bg-red-100 text-red-700 hover:bg-red-200"
        }`}
      >
        ✗ Rejeitar
      </button>
    </div>
  )
}
