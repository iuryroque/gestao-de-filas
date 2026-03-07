"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { api } from "~/trpc/react"
import { useTheme } from "../_components/ThemeContext"
import { ThemeToggle } from "../_components/ThemeToggle"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CallEntry {
  id: string
  code: string
  service: string | null
  isPriority: boolean
  noShowCount: number
  calledAt: Date | string | null
  desk: { name: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function announce(text: string, muted: boolean) {
  if (muted || typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = "pt-BR"
  utter.rate = 0.9
  window.speechSynthesis.speak(utter)
}

function buildAnnouncement(call: CallEntry): string {
  const desk = call.desk?.name ?? "guichê"
  const prefix = call.isPriority ? "Atendimento preferencial. " : ""
  const recall = call.noShowCount > 0 ? "Segunda chamada. " : ""
  return `${prefix}${recall}Senha ${call.code}, ${desk}.`
}

function timeSinceCalled(calledAt: Date | string | null): string {
  if (!calledAt) return ""
  const mins = Math.floor((Date.now() - new Date(calledAt).getTime()) / 60_000)
  return mins < 1 ? "agora" : `há ${mins} min`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PainelPage() {
  const [muted, setMuted] = useState(false)
  const lastTopIdRef = useRef<string | null>(null)
  const { highContrast } = useTheme()

  const {
    data: calls,
    isError,
    isFetching,
  } = api.ticket.recentCalls.useQuery(
    { limit: 5 },
    {
      refetchInterval: 2_000,
      refetchOnWindowFocus: true,
      // treat stale data as valid; panel just shows last known state if offline
    },
  )

  // ── Detect new top call and trigger voice ─────────────────────────────────
  useEffect(() => {
    if (!calls || calls.length === 0) return
    const top = calls[0]
    if (!top) return
    if (top.id !== lastTopIdRef.current) {
      lastTopIdRef.current = top.id
      announce(buildAnnouncement(top as CallEntry), muted)
    }
  }, [calls, muted])

  const toggleMute = useCallback(() => {
    setMuted((v) => {
      if (!v) window.speechSynthesis?.cancel()
      return !v
    })
  }, [])

  // ── Derived data ──────────────────────────────────────────────────────────
  const [current, ...history] = (calls ?? []) as CallEntry[]
  const recentHistory = history.slice(0, 3)

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen flex flex-col select-none transition-colors ${highContrast ? "bg-slate-900 text-white" : "bg-gray-50 text-slate-900"}`}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className={`flex items-center justify-between px-8 py-4 border-b ${highContrast ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🏛️</span>
          <span className="text-xl font-bold tracking-wide">Painel de Atendimento</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {/* Connection status */}
          {isError ? (
            <span
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-sm bg-red-900/60 border border-red-500 text-red-300 px-3 py-1.5 rounded-full"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Conexão indisponível — aguarde
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm text-green-400">
              <span
                className={`w-2 h-2 rounded-full bg-green-400 ${isFetching ? "animate-pulse" : ""}`}
              />
              Online
            </span>
          )}

          {/* Mute button */}
      <button
            id="painel-mute-btn"
            onClick={toggleMute}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
              muted
                ? (highContrast ? "border-yellow-400 bg-yellow-900/40 text-yellow-300" : "border-yellow-500 bg-yellow-50 text-yellow-700")
                : (highContrast ? "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-400" : "border-gray-200 bg-gray-50 text-slate-600 hover:border-gray-300")
            }`}
            aria-pressed={muted}
            aria-label={muted ? "Modo silencioso ativado — clique para ligar o som" : "Som ativado — clique para silenciar"}
          >
            <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
            {muted ? "Silencioso" : "Com som"}
          </button>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center gap-10 p-8" aria-label="Chamada atual">

        {/* Empty state */}
        {!current && !isError && (
          <div className="text-center">
            <p className={`text-4xl font-light mb-2 ${highContrast ? "text-slate-400" : "text-gray-400"}`}>Nenhuma senha chamada</p>
            <p className={highContrast ? "text-slate-500 text-lg" : "text-gray-500 text-lg"}>Aguardando chamadas do atendimento…</p>
          </div>
        )}

        {/* Error / offline state */}
        {isError && !current && (
          <div className="text-center">
            <p className="text-4xl font-light text-red-400 mb-2">Conexão indisponível</p>
            <p className={highContrast ? "text-slate-400 text-lg" : "text-gray-400 text-lg"}>Reconectando ao servidor…</p>
          </div>
        )}

        {/* Current call — BIG display */}
        {current && (
          <div
            className={`w-full max-w-3xl rounded-3xl border-4 p-10 text-center shadow-2xl transition-all ${
              current.isPriority
                ? "border-amber-400 bg-amber-950/60 shadow-amber-900/50"
                : "border-blue-500 bg-blue-950/60 shadow-blue-900/50"
            }`}
            aria-live="polite"
            aria-atomic="true"
            role="status"
          >
            {/* Priority badge */}
            {current.isPriority && (
              <div className="inline-flex items-center gap-2 bg-amber-400 text-amber-950 font-black px-5 py-1.5 rounded-full text-lg mb-5 uppercase tracking-widest">
                ⭐ Atendimento Preferencial
              </div>
            )}

            {/* Recall badge */}
            {current.noShowCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-4 py-1 rounded-full text-base mb-4 uppercase tracking-wide">
                📢 Segunda Chamada
              </div>
            )}

            {/* Ticket code */}
            <div
              className={`font-black tracking-widest leading-none mb-4 ${
                current.isPriority ? "text-amber-300" : "text-blue-300"
              }`}
              style={{ fontSize: "clamp(5rem, 15vw, 10rem)" }}
              aria-label={`Senha ${current.code}`}
            >
              {current.code}
            </div>

            {/* Service */}
            {current.service && (
              <p className="text-2xl text-slate-300 font-medium mb-4">{current.service}</p>
            )}

            {/* Desk */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-5xl font-light text-slate-400">→</span>
              <span
                className="text-5xl font-black text-white"
                aria-label={`Guichê ${current.desk?.name ?? ""}`}
              >
                {current.desk?.name ?? "—"}
              </span>
            </div>
          </div>
        )}

        {/* ── Recent history ─────────────────────────────────────────────── */}
        {recentHistory.length > 0 && (
          <section aria-label="Últimas chamadas" className="w-full max-w-3xl">
            <h2 className={`text-xs font-semibold uppercase tracking-widest mb-3 ${highContrast ? "text-slate-500" : "text-gray-400"}`}>
              Últimas chamadas
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {recentHistory.map((call) => (
                <div
                  key={call.id}
                  className={`rounded-2xl border p-4 text-center transition-colors ${
                    call.isPriority
                      ? (highContrast ? "border-amber-700/60 bg-amber-950/30" : "border-amber-200 bg-amber-50")
                      : (highContrast ? "border-slate-700 bg-slate-800/60" : "border-gray-200 bg-white shadow-sm")
                  }`}
                >
                  {call.isPriority && (
                    <span className="text-xs text-amber-500 font-bold block mb-1">⭐ PREFERENCIAL</span>
                  )}
                  {call.noShowCount > 0 && (
                    <span className="text-xs text-orange-500 font-semibold block mb-1">📢 2ª chamada</span>
                  )}
                  <div
                    className={`text-3xl font-black mb-1 ${
                      call.isPriority ? "text-amber-500" : (highContrast ? "text-slate-200" : "text-gray-700")
                    }`}
                  >
                    {call.code}
                  </div>
                  <div className={`text-sm font-medium ${highContrast ? "text-slate-400" : "text-gray-500"}`}>
                    {call.desk?.name ?? "—"}
                  </div>
                  <div className={`text-xs mt-1 ${highContrast ? "text-slate-600" : "text-gray-300"}`}>
                    {timeSinceCalled(call.calledAt)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className={`text-center py-4 text-xs border-t ${highContrast ? "text-slate-600 border-slate-800" : "text-gray-400 border-gray-100"}`}>
        {muted && (
          <p className="text-yellow-500 font-semibold text-sm mb-1">
            🔇 Modo silencioso ativo — fique atento ao painel
          </p>
        )}
        Gestão de Filas · Sistema de Atendimento
      </footer>
    </div>
  )
}
