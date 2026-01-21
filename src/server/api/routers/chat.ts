import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { chats } from "@/db/schema";
import { protectedProcedure, router } from "../trpc";

export const chatRouter = router({
  getChats: protectedProcedure.query(async ({ ctx }) => {
    const userChats = await ctx.db
      .select()
      .from(chats)
      .where(eq(chats.uid, ctx.userId))
      .orderBy(desc(chats.updated_at));
    return userChats;
  }),
  createChat: protectedProcedure.mutation(async ({ ctx }) => {
    const newChat = await ctx.db
      .insert(chats)
      .values({
        uid: ctx.userId,
        title: "New Chat",
      })
      .returning();
    return newChat[0].id;
  }),
  getChat: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const chat = await ctx.db.select().from(chats).where(eq(chats.id, input.id));
      return chat;
    }),
  updateChat: protectedProcedure
    .input(
      z
        .object({
          id: z.string().min(1),
          title: z.string(),
          messages: z.array(
            z.object({
              id: z.uuid(),
              role: z.enum(["user", "assistant"]),
              parts: z.json(),
              attachments: z.json(),
              createdAt: z.date(),
            }),
          ),
        })
        .partial(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chat ID is required",
        });
      }
      const { id, ...fields } = input;
      const updatedChat = await ctx.db
        .update(chats)
        .set({ ...fields, updated_at: new Date() })
        .where(eq(chats.id, id))
        .returning();
      if (!updatedChat[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }
      return updatedChat[0].id;
    }),
  deleteChat: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deletedChat = await ctx.db.delete(chats).where(eq(chats.id, input.id)).returning();
      if (!deletedChat[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }
      return deletedChat[0];
    }),
  deleteAllChats: protectedProcedure.mutation(async ({ ctx }) => {
    const deletedChats = await ctx.db
      .delete(chats)
      .where(eq(chats.uid, ctx.userId))
      .returning({ id: chats.id });

    return { deletedCount: deletedChats.length };
  }),
});

export type ChatRouter = typeof chatRouter;
