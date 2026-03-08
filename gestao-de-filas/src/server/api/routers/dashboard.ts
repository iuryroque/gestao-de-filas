import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the Date boundary for "last N hours".
 */
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

/**
 * Computes average wait time (TME) in minutes for tickets finished
 * within the given window.  TME = createdAt → calledAt interval.
 * no-show tickets are excluded.
 */
async function computeTme(
  db: Parameters<Parameters<typeof publicProcedure["query"]>[0]>[0]["ctx"]["db"],
  queueId: string,
  since: Date,
): Promise<number> {
  const tickets = await db.ticket.findMany({
    where: {
      queueId,
      status: { notIn: ["no_show", "waiting", "transferred"] },
      calledAt: { gte: since },
    },
    select: { createdAt: true, calledAt: true },
  });
  if (tickets.length === 0) return 0;
  const totalMs = tickets.reduce((acc, t) => {
    if (!t.calledAt) return acc;
    return acc + (t.calledAt.getTime() - t.createdAt.getTime());
  }, 0);
  return +(totalMs / tickets.length / 60_000).toFixed(1);
}

/**
 * Computes average service time (TMA) in minutes for finished tickets
 * within the given window.  TMA = calledAt → finishedAt interval.
 */
async function computeTma(
  db: Parameters<Parameters<typeof publicProcedure["query"]>[0]>[0]["ctx"]["db"],
  queueId: string,
  since: Date,
): Promise<number> {
  const tickets = await db.ticket.findMany({
    where: {
      queueId,
      status: "done",
      finishedAt: { gte: since },
      tma: { not: null },
    },
    select: { tma: true },
  });
  if (tickets.length === 0) return 0;
  const sum = tickets.reduce((acc, t) => acc + (t.tma ?? 0), 0);
  return +(sum / tickets.length / 60).toFixed(1); // stored in seconds → minutes
}

// ── Router ────────────────────────────────────────────────────────────────────

export const dashboardRouter = createTRPCRouter({
  /**
   * Returns monitoring data for all active queues.
   * - waitingCount, priorityCount, activeDesks
   * - tme2h, tma2h  (last 2 hours)
   * - sla, slaStatus ("ok" | "warning" | "critical")
   * Used by /dashboard (US-08) and the Guichê queue panel (US-07).
   */
  overview: publicProcedure
    .input(
      z.object({
        queueId: z.string().optional(), // filter to a single queue (US-07)
      }),
    )
    .query(async ({ ctx, input }) => {
      const window2h = hoursAgo(2);
      const window1h = hoursAgo(1);
      const window4h = hoursAgo(4);

      const queues = await ctx.db.queue.findMany({
        where: {
          isActive: true,
          ...(input.queueId ? { id: input.queueId } : {}),
        },
        select: { id: true, name: true, sla: true },
        orderBy: { name: "asc" },
      });

      const results = await Promise.all(
        queues.map(async (queue) => {
          const [waitingCount, priorityCount, activeDesks, tme2h, tma2h, tme1h, tme4h] =
            await Promise.all([
              ctx.db.ticket.count({
                where: { queueId: queue.id, status: "waiting" },
              }),
              ctx.db.ticket.count({
                where: { queueId: queue.id, status: "waiting", isPriority: true },
              }),
              ctx.db.desk.count({
                where: {
                  status: "active",
                  OR: [{ queueId: queue.id }, { queueId: null }],
                },
              }),
              computeTme(ctx.db, queue.id, window2h),
              computeTma(ctx.db, queue.id, window2h),
              computeTme(ctx.db, queue.id, window1h),
              computeTme(ctx.db, queue.id, window4h),
            ]);

          // SLA status calculation
          const slaWarningThreshold = queue.sla * 0.8;
          let slaStatus: "ok" | "warning" | "critical" = "ok";
          if (tme2h >= queue.sla) {
            slaStatus = "critical";
          } else if (tme2h >= slaWarningThreshold) {
            slaStatus = "warning";
          }

          // Persist SLA breach log if critical (avoid duplicate within 5 min)
          if (slaStatus === "critical") {
            const recentBreach = await ctx.db.slaBreachLog.findFirst({
              where: {
                queueId: queue.id,
                createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
              },
            });
            if (!recentBreach) {
              await ctx.db.slaBreachLog.create({
                data: {
                  queueId: queue.id,
                  tmeMinutes: tme2h,
                  slaLimit: queue.sla,
                },
              });
            }
          }

          return {
            queueId: queue.id,
            queueName: queue.name,
            waitingCount,
            priorityCount,
            activeDesks,
            sla: queue.sla,
            slaStatus,
            tme2h,
            tma2h,
            tme1h,
            tme4h,
            estimatedWaitMinutes: Math.round(waitingCount * (tma2h > 0 ? tma2h : 5)),
          };
        }),
      );

      return results;
    }),

  /**
   * Returns recent SLA breach events.
   */
  recentBreaches: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.slaBreachLog.findMany({
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: { queue: { select: { name: true } } },
      });
    }),
});
