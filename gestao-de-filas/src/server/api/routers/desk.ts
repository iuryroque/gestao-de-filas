import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const deskRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.desk.findMany({ orderBy: { name: "asc" } });
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.desk.create({ data: { name: input.name } });
    }),

  activate: publicProcedure
    .input(z.object({ deskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.desk.update({
        where: { id: input.deskId },
        data: { status: "active", pauseReason: null },
      });
    }),

  pause: publicProcedure
    .input(z.object({ deskId: z.string(), reason: z.string().default("Intervalo") }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.desk.update({
        where: { id: input.deskId },
        data: { status: "paused", pauseReason: input.reason },
      });
    }),

  resume: publicProcedure
    .input(z.object({ deskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.desk.update({
        where: { id: input.deskId },
        data: { status: "active", pauseReason: null },
      });
    }),
});
