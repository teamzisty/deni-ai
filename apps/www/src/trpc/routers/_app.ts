import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { botRouter } from './bot'
import { hubRouter } from './hub'
import { conversationRouter } from './conversation';
import { settingsRouter } from './settings';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/db/schema';
import { getAllUsage } from '@/lib/usage';
import { z } from 'zod';
import { updateUser } from '@/lib/auth-client';
import { auth } from '@/lib/auth';

/**
 * Api Router definition
 */
export const appRouter = createTRPCRouter({
  bot: botRouter,
  hub: hubRouter,
  conversation: conversationRouter,
  settings: settingsRouter,
  user: {
    getUser: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.id) return null;
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id),
        });
        return user || null;
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
    getUsage: protectedProcedure.query(async ({ ctx }) => {
      try {
        const usage = await getAllUsage(ctx.user.id);
        return usage;
      } catch (error) {
        console.error(error);
        return [];
      }
    }),
    updatePassword: protectedProcedure.input(z.object({
      password: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const { password } = input;

      const authc = await auth.$context;
      const hash = await authc.password.hash(password);

      await authc.internalAdapter.updatePassword(ctx.user.id, hash);
    }),
  },
});

// export type definition of API
export type AppRouter = typeof appRouter;
