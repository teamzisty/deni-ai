import { bots, db, user } from '@/lib/db';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm';

export const botRouter = createTRPCRouter({
    getBot: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
        const bot = await db.query.bots.findFirst({
            where: eq(bots.id, input.id),
        });
        if (!bot) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const author = await db.query.user.findFirst({
            where: eq(user.id, bot.userId),
            columns: {
                id: true,
                name: true,
                emailVerified: true
            }
        });
        return {
            ...bot,
            author,
        };
    }),
    getBots: protectedProcedure.query(async () => {
        const bots = await db.query.bots.findMany();
        return bots;
    }),
    createBot: protectedProcedure.input(z.object({
        name: z.string(),
        description: z.string(),
        instructions: z.array(z.object({
            content: z.string(),
        })),
    })).mutation(async ({ input, ctx }) => {
        const bot = await db.insert(bots).values({
            name: input.name,
            description: input.description,
            instructions: input.instructions,
            userId: ctx.user.id,
        }).returning();
        return bot[0];
    }),
    updateBot: protectedProcedure.input(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        systemInstruction: z.string(),
        instructions: z.array(z.object({
            content: z.string(),
        })),
    })).mutation(async ({ input, ctx }) => {
        const bot = await db.query.bots.findFirst({
            where: eq(bots.id, input.id),
        });
        if (!bot) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        if (bot.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const updatedBot = await db.update(bots).set({
            name: input.name,
            description: input.description,
            systemInstruction: input.systemInstruction,
            instructions: input.instructions,
        }).where(eq(bots.id, input.id)).returning();
        return updatedBot;
    }),
    deleteBot: protectedProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const bot = await db.query.bots.findFirst({
            where: eq(bots.id, input.id),
        });
        if (!bot) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        if (bot.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const deletedBot = await db.delete(bots).where(eq(bots.id, input.id)).returning();
        return deletedBot;
    }),
})