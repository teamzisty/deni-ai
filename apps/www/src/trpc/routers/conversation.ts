import { createTRPCRouter, protectedProcedure } from "../init";
import { chatSessions, db, sharedConversations } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const conversationRouter = createTRPCRouter({
    getConversation: protectedProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ input, ctx }) => {
        try {
            const conversation = await db.query.chatSessions.findFirst({
                where: eq(chatSessions.id, input.id),
            });
            return conversation;
        } catch (error) {
            console.error(error);
            return null;
        }
    }),
    getConversations: protectedProcedure.query(async ({ ctx }) => {
        try {
            const conversations = await db.query.chatSessions.findMany({
                where: eq(chatSessions.userId, ctx.user.id),
                orderBy: desc(chatSessions.createdAt),
            });
            return conversations;
        } catch (error) {
            console.error(error);
            return [];
        }
    }),
    createConversation: protectedProcedure.input(z.object({
        title: z.string(),
        botId: z.string().optional(),
        hubId: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
        try {
            const conversation = await db.insert(chatSessions).values({
                userId: ctx.user.id,
                title: input.title,
            ...(input.botId ? { bot: { id: input.botId } } : {}),
            hubId: input.hubId,
            }).returning();
            return conversation[0];
        } catch (error) {
            console.error(error);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }
    }),
    updateConversation: protectedProcedure.input(z.object({
        id: z.string(),
        title: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const conversation = await db.update(chatSessions).set({
            title: input.title,
        }).where(eq(chatSessions.id, input.id));
        return conversation;
    }),
    deleteConversation: protectedProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const conversation = await db.delete(chatSessions).where(eq(chatSessions.id, input.id));
    }),
    deleteAllConversations: protectedProcedure.mutation(async ({ ctx }) => {
        const conversations = await db.delete(chatSessions).where(eq(chatSessions.userId, ctx.user.id));
    }),
    addConversationToHub: protectedProcedure.input(z.object({
        conversationId: z.string(),
        hubId: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const conversation = await db.update(chatSessions).set({
            hubId: input.hubId,
        }).where(eq(chatSessions.id, input.conversationId));
    }),
    removeConversationFromHub: protectedProcedure.input(z.object({
        conversationId: z.string(),
        hubId: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const conversation = await db.update(chatSessions).set({
            hubId: null,
        }).where(eq(chatSessions.id, input.conversationId));
    }),
    shareConversation: protectedProcedure.input(z.object({
        conversationId: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const conversation = await db.query.chatSessions.findFirst({
            where: eq(chatSessions.id, input.conversationId),
        });
        if (!conversation) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const sharedConversation = await db.insert(sharedConversations).values({
            title: conversation.title || '',
            sessionId: conversation.id,
            sessionType: 'chat',
            userId: ctx.user.id,
            messages: conversation.messages,
            viewCount: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }).returning();
        return sharedConversation[0];
    }),
});