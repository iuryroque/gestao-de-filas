import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function logDeskState(
  ctx: { db: import("~/server/db").PrismaClient },
  deskId: string,
  state: string,
  reason?: string,
  actorRole?: string,
  queueId?: string,
) {
  await ctx.db.deskStateLog.create({
    data: { deskId, state, reason, actorRole, queueId },
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

export const deskRouter = createTRPCRouter({
  /**
   * List all desks with their current queue assignment.
   */
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.desk.findMany({
      orderBy: { name: "asc" },
      include: { queue: { select: { id: true, name: true } } },
    });
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.desk.create({ data: { name: input.name } });
    }),

  activate: publicProcedure
    .input(z.object({ deskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const desk = await ctx.db.desk.update({
        where: { id: input.deskId },
        data: { status: "active", pauseReason: null },
      });
      await logDeskState(ctx, input.deskId, "active", undefined, "attendant");
      return desk;
    }),

  pause: publicProcedure
    .input(z.object({ deskId: z.string(), reason: z.string().default("Intervalo") }))
    .mutation(async ({ ctx, input }) => {
      const desk = await ctx.db.desk.update({
        where: { id: input.deskId },
        data: { status: "paused", pauseReason: input.reason },
      });
      await logDeskState(ctx, input.deskId, "paused", input.reason, "attendant");
      return desk;
    }),

  resume: publicProcedure
    .input(z.object({ deskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const desk = await ctx.db.desk.update({
        where: { id: input.deskId },
        data: { status: "active", pauseReason: null },
      });
      await logDeskState(ctx, input.deskId, "active", undefined, "attendant");
      return desk;
    }),

  /**
   * US-10: Supervisor force-closes a desk with a mandatory justification.
   * Warns if the desk currently has a ticket in progress (does not abort it).
   */
  close: publicProcedure
    .input(
      z.object({
        deskId: z.string(),
        reason: z.string().min(1, "Justificativa obrigatória"),
        actorRole: z.enum(["supervisor", "admin"]).default("supervisor"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if this is the last active desk serving a queue with waiting tickets
      const desk = await ctx.db.desk.findUnique({ where: { id: input.deskId } });
      if (!desk) throw new TRPCError({ code: "NOT_FOUND", message: "Guichê não encontrado." });

      const queueId = desk.queueId;
      let warningEmptyQueue = false;

      if (queueId) {
        const otherActiveDesks = await ctx.db.desk.count({
          where: { queueId, status: "active", id: { not: input.deskId } },
        });
        const waiting = await ctx.db.ticket.count({
          where: { queueId, status: "waiting" },
        });
        warningEmptyQueue = otherActiveDesks === 0 && waiting > 0;
      }

      const updated = await ctx.db.desk.update({
        where: { id: input.deskId },
        data: { status: "closed", pauseReason: null },
      });

      await logDeskState(ctx, input.deskId, "closed", input.reason, input.actorRole);

      return { desk: updated, warningEmptyQueue };
    }),

  /**
   * US-10: Assign a desk to a specific queue (or null = all queues).
   * Takes effect from the next "Chamar Próximo" call (does not interrupt current ticket).
   */
  assignToQueue: publicProcedure
    .input(
      z.object({
        deskId: z.string(),
        queueId: z.string().nullable(),
        actorRole: z.enum(["supervisor", "admin"]).default("supervisor"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate queue exists when provided
      if (input.queueId) {
        const queue = await ctx.db.queue.findUnique({ where: { id: input.queueId } });
        if (!queue) throw new TRPCError({ code: "NOT_FOUND", message: "Fila não encontrada." });
      }

      const updated = await ctx.db.desk.update({
        where: { id: input.deskId },
        data: { queueId: input.queueId },
        include: { queue: { select: { id: true, name: true } } },
      });

      const reason = input.queueId
        ? `Atribuído à fila: ${updated.queue?.name ?? input.queueId}`
        : "Removido de fila específica (agora atende todas)";

      await logDeskState(ctx, input.deskId, updated.status, reason, input.actorRole, input.queueId ?? undefined);

      return updated;
    }),

  /**
   * US-10: Get the state change history for a specific desk (audit log).
   */
  stateHistory: publicProcedure
    .input(z.object({ deskId: z.string(), limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.deskStateLog.findMany({
        where: { deskId: input.deskId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  /**
   * US-10: Get recent state changes across all desks (for the resources panel).
   */
  recentStateChanges: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.deskStateLog.findMany({
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: { desk: { select: { id: true, name: true } } },
      });
    }),

  /**
   * US-10: List all queues (used in the resources panel to re-assign desks).
   */
  listQueues: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.queue.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }),
});
