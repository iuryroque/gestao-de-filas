"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "~/trpc/react"

// ─── Constants ────────────────────────────────────────────────────────────────

const SKIP_TIMEOUT_SECONDS = 30

const STAR_LABELS: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CsatPage() {
  const params = useParams<{ ticketId: string }>()
  const ticketId = params?.ticketId ?? ""
  const router = useRouter()

  const [rating, setRating]   = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [step, setStep]       = useState<"rating" | "comment" | "done" | "already">("rating")
  const [countdown, setCountdown] = useState(SKIP_TIMEOUT_SECONDS)
  const [skipPending, setSkipPending] = useState(false)
  const [redirectIn, setRedirectIn] = useState(5)

  // Check if already answered
  const { data: existing, isLoading: checkLoading } = api.csat.checkExists.useQuery(
    { ticketId },
    { enabled: !!ticketId },
  )

  const submitMut = api.csat.submit.useMutation({
    onSuccess: () => setStep("done"),
  })

  // Mark as already answered if check returns true
  useEffect(() => {
    if (existing?.exists) setStep("already")
  }, [existing])

  // Auto-redirect after done: go to home after 5 seconds (AC 1.6)
  useEffect(() => {
    if (step !== "done") return
    const interval = setInterval(() => {
      setRedirectIn((c) => {
        if (c <= 1) {
          clearInterval(interval)
          router.push("/")
          return 0
        }
        return c - 1
      })
    }, 1_000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Auto-skip countdown
  useEffect(() => {
    if (step !== "rating" || checkLoading) return

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          handleSkip()
          return 0
        }
        return c - 1
      })
    }, 1_000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, checkLoading])

  function handleSkip() {
    if (skipPending) return
    setSkipPending(true)
    submitMut.mutate({ skipped: true, ticketId })
  }

  function handleSend() {
    if (!rating) return
    submitMut.mutate({
      skipped: false,
      ticketId,
      rating,
      comment: comment.trim() || undefined,
    })
  }

  // ── Renders ──────────────────────────────────────────────────────────────

  if (checkLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-blue-50">
        <p className="text-gray-500 animate-pulse">Carregando…</p>
      </main>
    )
  }

  if (step === "already") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Avaliação já registrada</h1>
          <p className="text-gray-500 text-sm">Obrigado pela sua participação!</p>
        </div>
      </main>
    )
  }

  if (step === "done") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Obrigado!</h1>
          <p className="text-gray-500">Sua avaliação foi registrada com sucesso.</p>
          <p className="text-gray-400 text-sm mt-4">Redirecionando em {redirectIn}s…</p>
        </div>
      </main>
    )
  }

  if (step === "rating") {
    const displayRating = hovered ?? rating
    return (
      <main className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Como foi seu atendimento?</h1>
          <p className="text-gray-500 text-sm mb-6">Avalie de 1 a 5 estrelas</p>

          {/* Stars */}
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                aria-label={STAR_LABELS[star]}
                className="text-5xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => { setRating(star); setStep("comment") }}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className={displayRating !== null && star <= displayRating ? "text-yellow-400" : "text-gray-300"}>
                  ★
                </span>
              </button>
            ))}
          </div>

          {displayRating && (
            <p className="text-sm text-gray-600 h-5">{STAR_LABELS[displayRating]}</p>
          )}

          {/* Skip */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleSkip}
              disabled={skipPending}
              className="text-gray-400 hover:text-gray-600 text-sm underline disabled:opacity-50"
            >
              Pular avaliação
            </button>
            <p className="text-gray-300 text-xs mt-1">
              Pulando automaticamente em {countdown}s
            </p>
          </div>
        </div>
      </main>
    )
  }

  // step === "comment"
  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-3">
          {"★".repeat(rating!).split("").map((_, i) => (
            <span key={i} className="text-yellow-400">★</span>
          ))}
          {"★".repeat(5 - rating!).split("").map((_, i) => (
            <span key={i} className="text-gray-300">★</span>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-1">{STAR_LABELS[rating!]}</h2>
        <p className="text-gray-500 text-sm mb-5">Deseja deixar um comentário? <span className="text-gray-400">(opcional)</span></p>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte-nos mais sobre a sua experiência…"
          maxLength={1000}
          rows={4}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <button
          onClick={handleSend}
          disabled={submitMut.isPending}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitMut.isPending ? "Enviando…" : "Enviar avaliação"}
        </button>

        <button
          onClick={() => setStep("rating")}
          className="mt-3 text-gray-400 hover:text-gray-600 text-sm underline"
        >
          Voltar
        </button>
      </div>
    </main>
  )
}
