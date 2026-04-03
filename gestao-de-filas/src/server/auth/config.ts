import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      groupId?: string | null;
      username: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    groupId?: string | null;
    username?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Portal do Servidor",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
         const parsedCredentials = z
           .object({ username: z.string(), password: z.string().min(4) })
           .safeParse(credentials);

         if (!parsedCredentials.success) return null;

         const { username, password } = parsedCredentials.data;
         
         const user = await db.user.findUnique({
           where: { username }
         });

         if (!user || !user.password) return null;

         const passwordsMatch = await bcrypt.compare(password, user.password);

         if (passwordsMatch) {
            return {
               id: user.id,
               name: user.name,
               email: user.email,
               username: user.username,
               role: user.role,
               groupId: user.groupId,
            };
         }
         
         return null;
      }
    }),
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt" // Required for Credentials provider
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.groupId = (user as any).groupId;
        token.username = (user as any).username;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        role: token.role as string,
        groupId: token.groupId as string | null,
        username: token.username as string,
      },
    }),
  },
} satisfies NextAuthConfig;
