import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { apiKey } from "@/db/schema";
import { generateApiKey, getKeyPrefix, hashApiKey } from "@/lib/api-key-utils";

import { protectedProcedure, router } from "../trpc";

export const apiKeysRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
      })
      .from(apiKey)
      .where(eq(apiKey.userId, ctx.userId))
      .orderBy(apiKey.createdAt);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: apiKey.id })
        .from(apiKey)
        .where(eq(apiKey.userId, ctx.userId));

      if (existing.length >= 5) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Maximum of 5 API keys allowed. Revoke an existing key first.",
        });
      }

      const raw = generateApiKey();
      const keyHash = await hashApiKey(raw);
      const keyPrefix = getKeyPrefix(raw);

      await ctx.db.insert(apiKey).values({
        userId: ctx.userId,
        name: input.name,
        keyHash,
        keyPrefix,
      });

      return { key: raw, keyPrefix };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(apiKey)
        .where(and(eq(apiKey.id, input.id), eq(apiKey.userId, ctx.userId)))
        .returning({ id: apiKey.id });

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found.",
        });
      }

      return { ok: true };
    }),
});
