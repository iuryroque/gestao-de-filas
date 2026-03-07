import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const ticketRouter = createTRPCRouter({
  /**
   * Returns the current status of a queue (isActive, waiting count, estimated wait).
   * Called on the confirmation step so the citizen sees the wait before emitting.
   */
  queueStatus: publicProcedure
    .input(z.object({ queueName: z.string() }))
    .query(async ({ ctx, input }) => {
      const queue = await ctx.db.queue.findUnique({
        where: { name: input.queueName },
      });

      if (!queue) {
        return { isActive: true, waitingCount: 0, estimatedWait: 0 };
      }

      const waitingCount = await ctx.db.ticket.count({
        where: { queueId: queue.id, status: "waiting" },
      });

      return {
        isActive: queue.isActive,
        waitingCount,
        estimatedWait: waitingCount * queue.tma,
      };
    }),

  /**
   * Emits a new ticket for a queue.
   * - Upserts the queue by name.
   * - Validates the queue is active (throws PRECONDITION_FAILED if not).
   * - Computes separate sequences for regular (0001) and priority (P-0001) tickets.
   * - Returns the ticket plus position and estimatedWait (minutes).
   */
  create: publicProcedure
    .input(
      z.object({
        queueName: z.string().min(1),
        service: z.string().optional(),
        isPriority: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure queue exists (upsert by unique name)
      const queue = await ctx.db.queue.upsert({
        where: { name: input.queueName },
        update: {},
        create: { name: input.queueName },
      });

      if (!queue.isActive) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Este serviço está temporariamente indisponível. Tente mais tarde ou use o agendamento online.",
        });
      }

      // Separate number sequences for priority and regular tickets
      const lastOfKind = await ctx.db.ticket.findFirst({
        where: { queueId: queue.id, isPriority: input.isPriority },
        orderBy: { number: "desc" },
        select: { number: true },
      });

      const number = (lastOfKind?.number ?? 0) + 1;
      const paddedNum = String(number).padStart(4, "0");
      const code = input.isPriority ? `P-${paddedNum}` : paddedNum;

      const ticket = await ctx.db.ticket.create({
        data: {
          code,
          number,
          queueId: queue.id,
          userId: ctx.session?.user?.id ?? undefined,
          status: "waiting",
          isPriority: input.isPriority,
          priority: input.isPriority ? 10 : 0,
          service: input.service ?? undefined,
        },
      });

      // Calculate position in queue (ticket was just inserted)
      let position: number;
      if (input.isPriority) {
        // Position among priority tickets only
        position = await ctx.db.ticket.count({
          where: { queueId: queue.id, isPriority: true, status: "waiting" },
        });
      } else {
        // Regular tickets wait behind all priority tickets
        const priorityAhead = await ctx.db.ticket.count({
          where: { queueId: queue.id, isPriority: true, status: "waiting" },
        });
        const regularAhead = await ctx.db.ticket.count({
          where: { queueId: queue.id, isPriority: false, status: "waiting" },
        });
        position = priorityAhead + regularAhead;
      }

      const estimatedWait = Math.max(0, (position - 1) * queue.tma);

      return { ...ticket, position, estimatedWait };
    }),

  // ── Guichê procedures (US-04 / US-05) ─────────────────────────────────────

  /**
   * Returns the active ticket (calling / awaiting_recall) for a given desk.
   */
  currentForDesk: publicProcedure
    .input(z.object({ deskId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ticket.findFirst({
        where: { deskId: input.deskId, status: { in: ["calling", "awaiting_recall"] } },
      });
    }),

  /**
   * Returns the last N finished/no-show tickets for a desk.
   */
  recentForDesk: publicProcedure
    .input(z.object({ deskId: z.string(), limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ticket.findMany({
        where: { deskId: input.deskId, status: { in: ["done", "no_show"] } },
        orderBy: { finishedAt: "desc" },
        take: input.limit,
      });
    }),

  /**
   * Returns waiting count per queue (for the desk status banner).
   */
  queueStats: publicProcedure.query(async ({ ctx }) => {
    const queues = await ctx.db.queue.findMany({
      select: { id: true, name: true },
    });
    const stats = await Promise.all(
      queues.map(async (q) => {
        const waiting = await ctx.db.ticket.count({
          where: { queueId: q.id, status: "waiting" },
        });
        return { queueName: q.name, waiting };
      }),
    );
    return stats.filter((s) => s.waiting > 0);
  }),

  /**
   * Returns the audit log for a specific ticket.
   */
  logs: publicProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ticketLog.findMany({
        where: { ticketId: input.ticketId },
        orderBy: { createdAt: "asc" },
      });
    }),

  /**
   * Calls the next waiting ticket for a desk.
   * Respects priority (P- first) then FIFO.
   * Throws if the desk already has an open ticket.
   */
  callNext: publicProcedure
    .input(z.object({ deskId: z.string(), actorId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Guard: no open ticket already active on this desk
      const open = await ctx.db.ticket.findFirst({
        where: { deskId: input.deskId, status: { in: ["calling", "awaiting_recall"] } },
      });
      if (open) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Você possui um atendimento em andamento. Finalize-o antes de chamar o próximo.",
        });
      }

      // Find next ticket: priority first, then FIFO by createdAt
      const next = await ctx.db.ticket.findFirst({
        where: { status: "waiting" },
        orderBy: [{ isPriority: "desc" }, { createdAt: "asc" }],
      });

      if (!next) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sua fila está vazia no momento.",
        });
      }

      const updated = await ctx.db.ticket.update({
        where: { id: next.id },
        data: { status: "calling", deskId: input.deskId, calledAt: new Date() },
      });

      // Audit log
      await ctx.db.ticketLog.create({
        data: { ticketId: updated.id, action: "called", actorId: input.actorId },
      });

      return updated;
    }),

  /**
   * Finalizes the current ticket for a desk (marks as done).
   * Calculates TMA (Tempo de Atendimento) in seconds.
   */
  finish: publicProcedure
    .input(z.object({ ticketId: z.string(), actorId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.ticket.findUniqueOrThrow({
        where: { id: input.ticketId },
      });

      // Calculate TMA: seconds between first call and finish
      const tma = ticket.calledAt
        ? Math.round((Date.now() - ticket.calledAt.getTime()) / 1000)
        : null;

      const updated = await ctx.db.ticket.update({
        where: { id: input.ticketId },
        data: {
          status: "done",
          finishedAt: new Date(),
          ...(tma !== null ? { tma } : {}),
        },
      });

      // Audit log
      await ctx.db.ticketLog.create({
        data: { ticketId: input.ticketId, action: "finished", actorId: input.actorId },
      });

      return updated;
    }),

  /**
   * Registers a no-show for the current ticket.
   * - If noShowCount + 1 < MAX_NO_SHOW (2): → awaiting_recall
   * - If noShowCount + 1 >= MAX_NO_SHOW    : → no_show (definitive)
   */
  noShow: publicProcedure
    .input(z.object({ ticketId: z.string(), actorId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.ticket.findUniqueOrThrow({
        where: { id: input.ticketId },
      });

      const MAX_NO_SHOW = 2;
      const newCount = ticket.noShowCount + 1;
      const isDefinitive = newCount >= MAX_NO_SHOW;

      const updated = await ctx.db.ticket.update({
        where: { id: input.ticketId },
        data: {
          noShowCount: newCount,
          status: isDefinitive ? "no_show" : "awaiting_recall",
          finishedAt: isDefinitive ? new Date() : undefined,
        },
      });

      // Audit log
      await ctx.db.ticketLog.create({
        data: {
          ticketId: input.ticketId,
          action: isDefinitive ? "no_show" : "first_no_show",
          actorId: input.actorId,
        },
      });

      return updated;
    }),

  /**
   * Recalls a ticket that is in awaiting_recall state.
   */
  recall: publicProcedure
    .input(z.object({ ticketId: z.string(), actorId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.ticket.update({
        where: { id: input.ticketId },
        data: { status: "calling", calledAt: new Date() },
      });

      // Audit log
      await ctx.db.ticketLog.create({
        data: { ticketId: input.ticketId, action: "recalled", actorId: input.actorId },
      });

      return updated;
    }),

  /**
   * Reintegrates a no-show ticket back to the end of the queue.
   * This is a supervisor-only action in the frontend (enforced via role check).
   */
  reintegrate: publicProcedure
    .input(
      z.object({
        ticketId: z.string(),
        note: z.string().optional(),
        actorId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.ticket.update({
        where: { id: input.ticketId },
        data: {
          status: "waiting",
          deskId: null,
          calledAt: null,
          finishedAt: null,
          noShowCount: 0,
        },
      });

      // Audit log
      await ctx.db.ticketLog.create({
        data: {
          ticketId: input.ticketId,
          action: "reintegrated",
          actorId: input.actorId,
          note: input.note,
        },
      });

      return updated;
    }),

  // ── Painel público (US-03) ─────────────────────────────────────────────────

  /**
   * Returns the most recently called tickets (calling | awaiting_recall),
   * including the desk name — used by the public display panel via polling.
   */
  recentCalls: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ticket.findMany({
        where: { status: { in: ["calling", "awaiting_recall"] } },
        orderBy: { calledAt: "desc" },
        take: input.limit,
        include: { desk: { select: { name: true } } },
      });
    }),

  /**
   * Returns the average TMA (in seconds) across recent done tickets.
   * Used to compute the timeout warning threshold in the Guichê UI.
   */
  avgTma: publicProcedure
    .input(z.object({ queueId: z.string().optional(), last: z.number().int().default(20) }))
    .query(async ({ ctx, input }) => {
      const tickets = await ctx.db.ticket.findMany({
        where: {
          status: "done",
          tma: { not: null },
          ...(input.queueId ? { queueId: input.queueId } : {}),
        },
        orderBy: { finishedAt: "desc" },
        take: input.last,
        select: { tma: true },
      });
      if (tickets.length === 0) return { avgTma: null };
      const sum = tickets.reduce((acc, t) => acc + (t.tma ?? 0), 0);
      return { avgTma: Math.round(sum / tickets.length) };
    }),
});
