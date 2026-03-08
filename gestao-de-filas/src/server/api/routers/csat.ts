import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// ── Offensive content filter (configurable list) ─────────────────────────────

const OFFENSIVE_TERMS = [
  "idiota", "imbecil", "burro", "incompetente", "inútil", "lixo",
  "merda", "porcaria", "vagabundo", "ladrão",
];

function hasOffensiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  return OFFENSIVE_TERMS.some((term) => lower.includes(term));
}

// ── NPS helpers ───────────────────────────────────────────────────────────────

interface NpsResult {
  nps: number | null
  promoters: number
  neutrals: number
  detractors: number
  total: number
  insufficientData: boolean
}

function calcNps(ratings: number[]): NpsResult {
  const total = ratings.length;
  const MIN_RESPONSES = 10;

  if (total < MIN_RESPONSES) {
    return { nps: null, promoters: 0, neutrals: 0, detractors: 0, total, insufficientData: true };
  }

  const promoters  = ratings.filter((r) => r >= 4).length;
  const detractors = ratings.filter((r) => r <= 2).length;
  const neutrals   = ratings.filter((r) => r === 3).length;
  const nps = Math.round(((promoters - detractors) / total) * 100);

  return { nps, promoters, neutrals, detractors, total, insufficientData: false };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const csatRouter = createTRPCRouter({
  /**
   * US-11 Cenário 1 & 2: Submit a CSAT rating for a ticket, or record a skip.
   * - Deduplication: one response per ticket (returns 409 if already answered)
   * - Offensive comments are flagged for manager review, rating is always stored
   * - Rating must be 1–5 integers; skipped=true means no rating
   */
  submit: publicProcedure
    .input(
      z.discriminatedUnion("skipped", [
        z.object({
          skipped:  z.literal(false),
          ticketId: z.string().min(1),
          rating:   z.number().int().min(1).max(5),
          comment:  z.string().max(1000).optional(),
        }),
        z.object({
          skipped:  z.literal(true),
          ticketId: z.string().min(1),
        }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ticket exists and is done
      const ticket = await ctx.db.ticket.findUnique({
        where: { id: input.ticketId },
        select: { id: true, deskId: true, queueId: true, service: true, status: true },
      });

      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket não encontrado." });

      // Idempotency — prevent double submissions
      const existing = await ctx.db.csatResponse.findUnique({ where: { ticketId: input.ticketId } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Avaliação já registrada para este ticket." });

      if (input.skipped) {
        return ctx.db.csatResponse.create({
          data: {
            ticketId: input.ticketId,
            deskId:   ticket.deskId,
            queueId:  ticket.queueId,
            service:  ticket.service,
            skipped:  true,
          },
        });
      }

      const comment = input.comment?.trim() ?? undefined;
      const flagged = comment ? hasOffensiveContent(comment) : false;

      return ctx.db.csatResponse.create({
        data: {
          ticketId: input.ticketId,
          deskId:   ticket.deskId,
          queueId:  ticket.queueId,
          service:  ticket.service,
          rating:   input.rating,
          comment:  comment,
          flagged,
          skipped:  false,
        },
      });
    }),

  /**
   * US-11 Cenário 3: CSAT stats per desk/attendant for a period.
   * Returns: avgCsat, distribution (1-5 counts), responseRate, verbatim comments
   * (anonymised — no citizen PII)
   */
  attendantStats: publicProcedure
    .input(
      z.object({
        deskId:    z.string().optional(),
        startDate: z.string(),
        endDate:   z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(input.endDate);   end.setHours(23, 59, 59, 999);

      // Get all desks
      const desks = await ctx.db.desk.findMany({
        where: input.deskId ? { id: input.deskId } : {},
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      return Promise.all(
        desks.map(async (desk) => {
          const responses = await ctx.db.csatResponse.findMany({
            where: { deskId: desk.id, createdAt: { gte: start, lte: end } },
            select: { rating: true, comment: true, flagged: true, skipped: true, ticketId: true },
          })

          // Avg TMA for correlation with CSAT (US-11 CA 3.7)
          const doneTickets = await ctx.db.ticket.findMany({
            where: { deskId: desk.id, finishedAt: { gte: start, lte: end }, tma: { not: null } },
            select: { tma: true },
          })
          const avgTmaSeconds = doneTickets.length > 0
            ? +(doneTickets.reduce((s, t) => s + (t.tma ?? 0), 0) / doneTickets.length).toFixed(0)
            : null
          const avgTmaMinutes = avgTmaSeconds !== null ? +(avgTmaSeconds / 60).toFixed(1) : null;

          const totalAttempts = responses.length;
          const rated         = responses.filter((r) => !r.skipped && r.rating !== null);
          const avgCsat       = rated.length > 0
            ? +(rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(2)
            : null;
          const responseRate  = totalAttempts > 0
            ? +((rated.length / totalAttempts) * 100).toFixed(1)
            : 0;

          const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
          for (const r of rated) {
            if (r.rating) {
              const key = String(r.rating)
              distribution[key] = (distribution[key] ?? 0) + 1
            }
          }

          // Comments are returned verbatim but WITHOUT citizen PII — only ticketId for cross-referencing
          const comments = responses
            .filter((r) => r.comment && !r.flagged)
            .map((r) => ({ ticketId: r.ticketId, rating: r.rating, comment: r.comment }));

          const npsResult = calcNps(rated.map((r) => r.rating!));

          return {
            deskId:       desk.id,
            deskName:     desk.name,
            totalAttempts,
            ratedCount:   rated.length,
            avgCsat,
            responseRate,
            distribution,
            comments,
            avgTmaMinutes,
            nps:          npsResult,
          };
        }),
      );
    }),

  /**
   * US-11 Cenário 4: NPS per service for a period + monthly evolution.
   * Min 10 responses required; below that returns insufficientData=true.
   */
  serviceNps: publicProcedure
    .input(
      z.object({
        service:   z.string().optional(),
        startDate: z.string(),
        endDate:   z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(input.endDate);   end.setHours(23, 59, 59, 999);

      // Group by service
      const responses = await ctx.db.csatResponse.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          skipped:   false,
          rating:    { not: null },
          ...(input.service ? { service: input.service } : {}),
        },
        select: { service: true, rating: true, createdAt: true },
      });

      // Aggregate by service
      const serviceMap = new Map<string, number[]>();
      for (const r of responses) {
        const svc = r.service ?? "Geral";
        const arr = serviceMap.get(svc) ?? [];
        arr.push(r.rating!);
        serviceMap.set(svc, arr);
      }

      const results = Array.from(serviceMap.entries()).map(([service, ratings]) => ({
        service,
        ...calcNps(ratings),
      }));

      // Monthly NPS evolution per service
      const monthlyMap = new Map<string, Map<string, number[]>>();  // service -> month -> ratings
      for (const r of responses) {
        const svc   = r.service ?? "Geral";
        const month = r.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
        if (!monthlyMap.has(svc)) monthlyMap.set(svc, new Map());
        const months = monthlyMap.get(svc)!;
        const arr = months.get(month) ?? [];
        arr.push(r.rating!);
        months.set(month, arr);
      }

      const monthly = Array.from(monthlyMap.entries()).map(([service, months]) => ({
        service,
        evolution: Array.from(months.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, ratings]) => ({ month, ...calcNps(ratings) })),
      }));

      return { byService: results, monthlyEvolution: monthly };
    }),

  /**
   * US-11 Cenário 5: List flagged comments awaiting manager review.
   */
  pendingFlagged: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.csatResponse.findMany({
        where: { flagged: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true, ticketId: true, rating: true, comment: true,
          service: true, createdAt: true,
          // NO deskId exposed here to prevent indirect PII correlation at comment level
        },
      });
    }),

  /**
   * US-11 Cenário 5: Approve (unflag) or reject (clear comment) a flagged response.
   */
  reviewFlagged: publicProcedure
    .input(
      z.object({
        responseId: z.string(),
        action:     z.enum(["approve", "reject"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.csatResponse.findUnique({ where: { id: input.responseId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada." });

      if (input.action === "approve") {
        return ctx.db.csatResponse.update({
          where: { id: input.responseId },
          data:  { flagged: false },
        });
      } else {
        // Reject: keep the rating, clear the offensive comment
        return ctx.db.csatResponse.update({
          where: { id: input.responseId },
          data:  { flagged: false, comment: null },
        });
      }
    }),

  /**
   * Check if a ticket already has a CSAT response (to avoid showing the screen again).
   */
  checkExists: publicProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.csatResponse.findUnique({
        where:  { ticketId: input.ticketId },
        select: { id: true, skipped: true, rating: true },
      });
      return { exists: !!existing, skipped: existing?.skipped ?? false, rating: existing?.rating ?? null };
    }),
});
