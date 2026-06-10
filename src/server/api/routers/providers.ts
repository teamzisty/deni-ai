import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { providerKey, providerSetting } from "@/db/schema";
import { decryptFromB64, encryptToB64 } from "@/lib/crypto";
import { normalizePublicBaseUrl } from "@/lib/network-security";

import { protectedProcedure, router } from "../trpc";

const ProviderIdSchema = z.union([
  z.literal("openai"),
  z.literal("anthropic"),
  z.literal("google"),
  z.literal("xai"),
]);

export const providersRouter = router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const [keys, settings] = await Promise.all([
      ctx.db.select().from(providerKey).where(eq(providerKey.userId, ctx.userId)),
      ctx.db.select().from(providerSetting).where(eq(providerSetting.userId, ctx.userId)),
    ]);

    return {
      keys: keys.map((k) => ({ provider: k.provider, configured: true })),
      settings: settings.map((s) => ({
        provider: s.provider,
        preferByok: s.preferByok,
        baseUrl: s.baseUrl,
      })),
    };
  }),

  upsertKey: protectedProcedure
    .input(
      z.object({
        provider: ProviderIdSchema,
        apiKey: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const keyEnc = await encryptToB64(input.apiKey);
      await ctx.db
        .insert(providerKey)
        .values({ userId: ctx.userId, provider: input.provider, keyEnc })
        .onConflictDoUpdate({
          target: [providerKey.userId, providerKey.provider],
          set: { keyEnc },
        });
      return { ok: true };
    }),

  deleteKey: protectedProcedure
    .input(z.object({ provider: ProviderIdSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(providerKey)
        .where(and(eq(providerKey.userId, ctx.userId), eq(providerKey.provider, input.provider)));
      return { ok: true };
    }),

  upsertSetting: protectedProcedure
    .input(
      z.object({
        provider: ProviderIdSchema,
        preferByok: z.boolean().optional(),
        baseUrl: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseUrl =
        input.baseUrl === undefined
          ? undefined
          : input.baseUrl === null
            ? null
            : await normalizePublicBaseUrl(input.baseUrl);

      if (input.baseUrl !== undefined && input.baseUrl !== null && !baseUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid base URL",
        });
      }

      const existing = await ctx.db
        .select()
        .from(providerSetting)
        .where(
          and(eq(providerSetting.userId, ctx.userId), eq(providerSetting.provider, input.provider)),
        )
        .limit(1);

      const current = existing[0];
      const preferByok = input.preferByok ?? current?.preferByok ?? false;
      const resolvedBaseUrl = baseUrl === undefined ? (current?.baseUrl ?? null) : baseUrl;

      await ctx.db
        .insert(providerSetting)
        .values({
          userId: ctx.userId,
          provider: input.provider,
          preferByok,
          baseUrl: resolvedBaseUrl,
        })
        .onConflictDoUpdate({
          target: [providerSetting.userId, providerSetting.provider],
          set: { preferByok, baseUrl: resolvedBaseUrl },
        });

      return { ok: true };
    }),

  revealKeyLast4: protectedProcedure
    .input(z.object({ provider: ProviderIdSchema }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({ keyEnc: providerKey.keyEnc })
        .from(providerKey)
        .where(and(eq(providerKey.userId, ctx.userId), eq(providerKey.provider, input.provider)))
        .limit(1);

      if (!row[0]) return { configured: false as const };
      const apiKey = await decryptFromB64(row[0].keyEnc);
      return {
        configured: true as const,
        last4: apiKey.slice(-4),
      };
    }),
});

export type ProvidersRouter = typeof providersRouter;
