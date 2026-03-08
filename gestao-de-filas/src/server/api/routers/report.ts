import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// ── Helpers ───────────────────────────────────────────────────────────────────

function minutesBetween(a: Date, b: Date) {
  return Math.abs(b.getTime() - a.getTime()) / 60_000;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const reportRouter = createTRPCRouter({
  /**
   * US-09: Queue-level report with aggregated metrics for a date range.
   * Returns per-queue: totalTickets, avgTme, avgTma, noShowCount, noShowRate, byService breakdown.
   */
  queueReport: publicProcedure
    .input(
      z.object({
        startDate: z.string(),  // ISO date string
        endDate: z.string(),
        queueId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);

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
          // All tickets created in the period for this queue
          const tickets = await ctx.db.ticket.findMany({
            where: {
              queueId: queue.id,
              createdAt: { gte: start, lte: end },
            },
            select: {
              id: true,
              status: true,
              service: true,
              createdAt: true,
              calledAt: true,
              finishedAt: true,
              tma: true,
            },
          });

          const totalTickets = tickets.length;
          const noShowTickets = tickets.filter((t) => t.status === "no_show");
          const noShowCount = noShowTickets.length;
          const noShowRate = totalTickets > 0 ? +((noShowCount / totalTickets) * 100).toFixed(1) : 0;

          // TME: average wait (createdAt → calledAt) for called tickets
          const calledTickets = tickets.filter((t) => t.calledAt);
          const avgTme =
            calledTickets.length > 0
              ? +(
                  calledTickets.reduce((acc, t) => acc + minutesBetween(t.createdAt, t.calledAt!), 0) /
                  calledTickets.length
                ).toFixed(1)
              : 0;

          // TMA: average service time for done tickets (stored in seconds)
          const doneTickets = tickets.filter((t) => t.status === "done" && t.tma);
          const avgTma =
            doneTickets.length > 0
              ? +(doneTickets.reduce((acc, t) => acc + (t.tma ?? 0), 0) / doneTickets.length / 60).toFixed(1)
              : 0;

          // SLA breaches in period
          const slaBreaches = await ctx.db.slaBreachLog.count({
            where: {
              queueId: queue.id,
              createdAt: { gte: start, lte: end },
            },
          });

          // Breakdown by service
          const serviceMap = new Map<string, { count: number; totalTma: number; tmaCount: number }>();
          for (const t of tickets) {
            const svc = t.service ?? "Geral";
            const entry = serviceMap.get(svc) ?? { count: 0, totalTma: 0, tmaCount: 0 };
            entry.count++;
            if (t.tma) {
              entry.totalTma += t.tma;
              entry.tmaCount++;
            }
            serviceMap.set(svc, entry);
          }
          const byService = Array.from(serviceMap.entries()).map(([name, data]) => ({
            service: name,
            count: data.count,
            avgTma: data.tmaCount > 0 ? +(data.totalTma / data.tmaCount / 60).toFixed(1) : 0,
          }));

          return {
            queueId: queue.id,
            queueName: queue.name,
            sla: queue.sla,
            totalTickets,
            avgTme,
            avgTma,
            noShowCount,
            noShowRate,
            slaBreaches,
            byService,
          };
        }),
      );

      return results;
    }),

  /**
   * US-10: Attendant (desk) performance report.
   * Returns per-desk: totalAttended, avgTma, noShowCount, noShowRate, logs summary.
   */
  attendantReport: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        deskId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);

      const desks = await ctx.db.desk.findMany({
        where: input.deskId ? { id: input.deskId } : {},
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      const results = await Promise.all(
        desks.map(async (desk) => {
          // All tickets assigned to this desk in the period
          const tickets = await ctx.db.ticket.findMany({
            where: {
              deskId: desk.id,
              calledAt: { gte: start, lte: end },
            },
            select: {
              status: true,
              tma: true,
              service: true,
            },
          });

          const totalCalled = tickets.length;
          const doneTickets = tickets.filter((t) => t.status === "done");
          const totalAttended = doneTickets.length;
          const noShowTickets = tickets.filter((t) => t.status === "no_show");
          const noShowCount = noShowTickets.length;
          const noShowRate = totalCalled > 0 ? +((noShowCount / totalCalled) * 100).toFixed(1) : 0;

          // TMA for this desk
          const tmaTickets = doneTickets.filter((t) => t.tma);
          const avgTma =
            tmaTickets.length > 0
              ? +(tmaTickets.reduce((acc, t) => acc + (t.tma ?? 0), 0) / tmaTickets.length / 60).toFixed(1)
              : 0;

          // Pause tracking: use TicketLog note field to track pauses (best-effort)
          // Currently pauses are not logged in TicketLog, so totalPauseMinutes = 0
          // This will be populated once desk pause/resume actions log to TicketLog
          const totalPauseMinutes = 0;

          return {
            deskId: desk.id,
            deskName: desk.name,
            totalCalled,
            totalAttended,
            avgTma,
            noShowCount,
            noShowRate,
            totalPauseMinutes: +totalPauseMinutes.toFixed(0),
          };
        }),
      );

      return results;
    }),

  /**
   * Lists unique services found in the tickets db for filter dropdowns.
   */
  listServices: publicProcedure.query(async ({ ctx }) => {
    const tickets = await ctx.db.ticket.findMany({
      select: { service: true },
      distinct: ["service"],
      where: { service: { not: null } },
    });
    return tickets.map((t) => t.service).filter(Boolean) as string[];
  }),
});
