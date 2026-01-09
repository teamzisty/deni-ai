import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  customModel,
  type OpenAICompatibleApiStyle,
  providerKey,
  providerSetting,
} from "@/db/schema";
import { decryptFromB64, encryptToB64 } from "@/lib/crypto";

import { protectedProcedure, router } from "../trpc";

const ProviderIdSchema = z.union([
  z.literal("openai"),
  z.literal("anthropic"),
  z.literal("google"),
  z.literal("xai"),
  z.literal("openai_compatible"),
]);

function normalizeBaseUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const providersRouter = router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const [keys, settings, models] = await Promise.all([
      ctx.db.select().from(providerKey).where(eq(providerKey.userId, ctx.userId)),
      ctx.db.select().from(providerSetting).where(eq(providerSetting.userId, ctx.userId)),
      ctx.db.select().from(customModel).where(eq(customModel.userId, ctx.userId)),
    ]);

    return {
      keys: keys.map((k) => ({ provider: k.provider, configured: true })),
      settings: settings.map((s) => ({
        provider: s.provider,
        preferByok: s.preferByok,
        baseUrl: s.baseUrl,
        apiStyle: s.apiStyle as OpenAICompatibleApiStyle,
      })),
      customModels: models.map((m) => ({
        id: m.id,
        provider: m.provider,
        name: m.name,
        modelId: m.modelId,
        description: m.description,
        premium: m.premium,
        inputPriceMicros: m.inputPriceMicros,
        outputPriceMicros: m.outputPriceMicros,
        reasoningPriceMicros: m.reasoningPriceMicros,
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
        apiStyle: z.union([z.literal("chat"), z.literal("responses")]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseUrl =
        input.baseUrl === undefined
          ? undefined
          : input.baseUrl === null
            ? null
            : normalizeBaseUrl(input.baseUrl);

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
      const apiStyle = input.apiStyle ?? current?.apiStyle ?? "responses";

      await ctx.db
        .insert(providerSetting)
        .values({
          userId: ctx.userId,
          provider: input.provider,
          preferByok,
          baseUrl: resolvedBaseUrl,
          apiStyle,
        })
        .onConflictDoUpdate({
          target: [providerSetting.userId, providerSetting.provider],
          set: { preferByok, baseUrl: resolvedBaseUrl, apiStyle },
        });

      return { ok: true };
    }),

  createCustomModel: protectedProcedure
    .input(
      z.object({
        provider: z.literal("openai_compatible"),
        name: z.string().min(1),
        modelId: z.string().min(1),
        description: z.string().nullable().optional(),
        premium: z.boolean().optional(),
        inputPriceMicros: z.number().int().nonnegative().nullable().optional(),
        outputPriceMicros: z.number().int().nonnegative().nullable().optional(),
        reasoningPriceMicros: z.number().int().nonnegative().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db
        .insert(customModel)
        .values({
          userId: ctx.userId,
          provider: input.provider,
          name: input.name,
          modelId: input.modelId,
          description: input.description ?? null,
          premium: input.premium ?? false,
          inputPriceMicros: input.inputPriceMicros ?? null,
          outputPriceMicros: input.outputPriceMicros ?? null,
          reasoningPriceMicros: input.reasoningPriceMicros ?? null,
        })
        .returning({ id: customModel.id });

      return { id: created[0]?.id };
    }),

  deleteCustomModel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(customModel)
        .where(and(eq(customModel.userId, ctx.userId), eq(customModel.id, input.id)));
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
