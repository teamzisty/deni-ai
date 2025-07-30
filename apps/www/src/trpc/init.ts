import { auth } from '@/lib/auth'
import { initTRPC, TRPCError } from '@trpc/server'
import { cache } from 'react'
import { headers } from 'next/headers'

/**
 * tRPC context
 */
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  return {
    session,
  }
})

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<typeof createTRPCContext>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
})

// Base router and procedure helpers
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure

export const protectedProcedure = baseProcedure.use(async (opts) => {
  const { session } = await opts.ctx;
  if (!session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({
      ctx: {
          ...opts.ctx,
          user: session.user,
      },
  });
});
