import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

import { db } from "@/db/drizzle";
import { auth } from "@/lib/auth";

export async function createContext(opts: FetchCreateContextFnOptions) {
  // Derive session from incoming request headers via better-auth
  const session = await auth.api.getSession({ headers: opts.req.headers });
  return { db, session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
const enforceUser = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.session.userId,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUser);

export type ProtectedContext = Context & { userId: string };
