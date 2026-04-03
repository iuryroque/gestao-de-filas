import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  requirePermission,
} from "~/server/api/trpc";

import bcrypt from "bcryptjs";

export const adminRouter = createTRPCRouter({
  
  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  
  getUsers: protectedProcedure
    .use(requirePermission("admin:access"))
    .query(async ({ ctx }) => {
      // Returns all users including their group info
      return ctx.db.user.findMany({
        include: {
          group: true
        },
        orderBy: { name: 'asc' }
      });
    }),

  saveUser: protectedProcedure
    .use(requirePermission("users:manage"))
    .input(z.object({
      id: z.string().optional(),
      name: z.string().min(2),
      email: z.string().email().optional().nullable(),
      username: z.string().min(3),
      password: z.string().min(4).optional().nullable(),
      groupId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, name, email, username, password, groupId } = input;
      
      const userData: any = {
        name,
        email,
        username,
        groupId,
      };

      if (password) {
        userData.password = await bcrypt.hash(password, 10);
      }

      if (id) {
        return ctx.db.user.update({
          where: { id },
          data: userData
        });
      } else {
        if (!password) throw new Error("Senha é obrigatória para novos usuários");
        return ctx.db.user.create({
          data: userData
        });
      }
    }),

  deleteUser: protectedProcedure
    .use(requirePermission("users:manage"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Don't allow self-deletion
      if (input.id === ctx.session.user.id) {
        throw new Error("Você não pode excluir seu próprio usuário.");
      }
      return ctx.db.user.delete({
        where: { id: input.id }
      });
    }),

  updateUserGroup: protectedProcedure
    .use(requirePermission("users:manage"))
    .input(z.object({
      userId: z.string(),
      groupId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { groupId: input.groupId },
        include: { group: true }
      });
    }),

  // -------------------------------------------------------------
  // GROUPS & PERMISSIONS
  // -------------------------------------------------------------
  
  getGroups: protectedProcedure
    .use(requirePermission("admin:access"))
    .query(async ({ ctx }) => {
      return ctx.db.group.findMany({
        include: {
          _count: {
             select: { users: true }
          },
          permissions: {
             include: { permission: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    }),

  getAllPermissions: protectedProcedure
    .use(requirePermission("admin:access"))
    .query(async ({ ctx }) => {
      return ctx.db.permission.findMany({
        orderBy: { code: 'asc' }
      });
    }),

  // Creates or updates a group and syncs their permissions
  saveGroup: protectedProcedure
    .use(requirePermission("groups:manage"))
    .input(z.object({
      id: z.string().optional(),
      name: z.string().min(2),
      description: z.string().optional(),
      permissionCodes: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, permissionCodes } = input;
      
      // Look up permission IDs based on codes
      const perms = await ctx.db.permission.findMany({
        where: { code: { in: permissionCodes } },
        select: { id: true }
      });

      if (id) {
         // UPDATE
         // 1. Update basic info
         const updated = await ctx.db.group.update({
           where: { id },
           data: { name, description }
         });
         
         // 2. Wipe existing relations
         await ctx.db.groupPermission.deleteMany({
            where: { groupId: id }
         });

         // 3. Re-insert
         if (perms.length > 0) {
            await ctx.db.groupPermission.createMany({
               data: perms.map(p => ({
                 groupId: id,
                 permissionId: p.id
               }))
            });
         }
         return updated;
      } else {
         // CREATE
         return ctx.db.group.create({
            data: {
               name,
               description,
               permissions: {
                  create: perms.map(p => ({
                     permission: { connect: { id: p.id } }
                  }))
               }
            }
         });
      }
    }),
    
});
