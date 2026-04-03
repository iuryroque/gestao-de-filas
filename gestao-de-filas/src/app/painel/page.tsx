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
    <div className={`min-h-screen flex flex-col select-none transition-colors ${highContrast ? "bg-black text-white" : "bg-surface text-primary"}`}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className={`flex items-center justify-between px-12 py-8 transition-all ${highContrast ? "bg-black border-b border-white" : "bg-surface-lowest/80 backdrop-blur-md"}`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden="true">🏛️</span>
          <span className="text-2xl font-display font-black tracking-tighter">Atendimento Presencial</span>
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
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              muted
                ? (highContrast ? "bg-white text-black" : "bg-warning-container text-on-warning-container shadow-sm")
                : (highContrast ? "border-2 border-white text-white" : "bg-surface-low text-secondary/60 hover:bg-surface-variant/20")
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

        {/* Current call — BIG display: Authority Rule */}
        {current && (
          <div
            className={`w-full max-w-5xl rounded-[4rem] p-16 text-center transition-all ${
              current.isPriority
                ? (highContrast ? "border-4 border-white bg-black" : "bg-warning-container/30 shadow-ambient shadow-warning/20")
                : (highContrast ? "border-4 border-white bg-black" : "bg-surface-lowest shadow-ambient")
            }`}
            aria-live="polite"
            aria-atomic="true"
            role="status"
          >
            {/* Priority badge */}
            {current.isPriority && (
              <div className={`inline-flex items-center gap-3 ${highContrast ? "bg-white text-black" : "bg-warning-container text-on-warning-container"} font-black px-8 py-3 rounded-full text-xl mb-10 uppercase tracking-[0.2em] shadow-sm`}>
                ⭐ Preferencial
              </div>
            )}

            {/* Recall badge */}
            {current.noShowCount > 0 && (
              <div className={`inline-flex items-center gap-3 ${highContrast ? "bg-white text-black" : "bg-error-container text-on-error-container"} font-black px-6 py-2 rounded-full text-lg mb-8 uppercase tracking-widest animate-pulse`}>
                📢 2ª Chamada
              </div>
            )}

            {/* Ticket code */}
            <div
              className={`font-display font-black tracking-tighter leading-none mb-6 ${
                current.isPriority ? (highContrast ? "text-white" : "text-primary") : (highContrast ? "text-white" : "text-primary")
              }`}
              style={{ fontSize: "clamp(8rem, 25vw, 18rem)" }}
              aria-label={`Senha ${current.code}`}
            >
              {current.code}
            </div>

            {/* Service & Desk */}
            <div className="flex flex-col gap-4 mt-8">
                {current.service && (
                  <p className={`text-3xl font-body font-medium ${highContrast ? "text-white/60" : "text-secondary/60 italic"}`}>{current.service}</p>
                )}
                <div className="flex items-center justify-center gap-6">
                  <span className={`text-6xl font-display font-black ${highContrast ? "text-white" : "text-primary"}`}>
                    {current.desk?.name ?? "—"}
                  </span>
                </div>
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
                      className={`rounded-[2.5rem] p-8 text-center transition-all ${
                        call.isPriority
                          ? (highContrast ? "border-2 border-white bg-black" : "bg-warning-container/20 shadow-ambient shadow-warning/5")
                          : (highContrast ? "border-2 border-white bg-black" : "bg-surface-lowest shadow-ambient shadow-primary/5")
                      }`}
                    >
                      {call.isPriority && (
                        <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${highContrast ? "text-white" : "text-warning"}`}>⭐ PREFERENCIAL</span>
                      )}
                      <div
                        className={`text-5xl font-display font-black mb-1 ${
                          highContrast ? "text-white" : "text-primary"
                        }`}
                      >
                        {call.code}
                      </div>
                      <div className={`text-lg font-display font-black opacity-60 ${highContrast ? "text-white" : "text-primary"}`}>
                        {call.desk?.name ?? "—"}
                      </div>
                      <div className={`text-[10px] uppercase font-black tracking-tighter mt-3 opacity-30 ${highContrast ? "text-white" : "text-primary"}`}>
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
