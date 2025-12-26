import { eq } from "drizzle-orm";
import { z } from "zod";
import { chats } from "@/db/schema";
import type { MigrationExport } from "@/lib/migration";
import { normalizeMigrationPayload } from "@/lib/migration";
import { protectedProcedure, router } from "../trpc";

export const migrationRouter = router({
  export: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(chats)
      .where(eq(chats.uid, ctx.userId));

    const payload: MigrationExport = {
      format: "deni-ai-message-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      source: {
        app: "deni-ai",
        channel: "canary",
      },
      chats: rows.map((chat) => ({
        id: chat.id,
        title: chat.title ?? null,
        createdAt: chat.created_at?.toISOString() ?? null,
        updatedAt: chat.updated_at?.toISOString() ?? null,
        messages: (chat.messages as unknown[]) ?? [],
      })),
    };

    return payload;
  }),
  import: protectedProcedure
    .input(
      z.object({
        payload: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { conversations, warnings } = normalizeMigrationPayload(
        input.payload,
      );

      if (!conversations.length) {
        return {
          success: false,
          importedChats: 0,
          importedMessages: 0,
          warnings,
          error: "No conversations found to import",
        };
      }

      const now = new Date();
      const values = conversations.map((conversation) => ({
        uid: ctx.userId,
        title: conversation.title,
        messages: structuredClone(conversation.messages),
        created_at: conversation.createdAt ?? now,
        updated_at: conversation.updatedAt ?? now,
      }));

      const inserted = await ctx.db.insert(chats).values(values).returning({
        id: chats.id,
      });

      return {
        success: true,
        importedChats: inserted.length,
        importedMessages: conversations.reduce(
          (count, conversation) => count + conversation.messages.length,
          0,
        ),
        warnings,
      };
    }),
});

export type MigrationRouter = typeof migrationRouter;
