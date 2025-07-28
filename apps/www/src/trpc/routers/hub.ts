import { db, hubs, user } from '@/lib/db';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm';

export const hubRouter = createTRPCRouter({
    getHubs: protectedProcedure.query(async () => {
        const hubs = await db.query.hubs.findMany();
        return hubs;
    }),
    getHub: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
        const hub = await db.query.hubs.findFirst({
            where: eq(hubs.id, input.id),
        });
        if (!hub) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const author = await db.query.user.findFirst({
            where: eq(user.id, hub.userId),
            columns: {
                id: true,
                name: true,
                emailVerified: true
            }
        });
        return {
            ...hub,
            author,
        };
    }),
    createHub: protectedProcedure.input(z.object({
        name: z.string(),
        description: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const hub = await db.insert(hubs).values({
            name: input.name,
            description: input.description,
            userId: ctx.user.id,
        }).returning();
        return hub[0];
    }),
    updateHub: protectedProcedure.input(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const hub = await db.query.hubs.findFirst({
            where: eq(hubs.id, input.id),
        });
        if (!hub) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        if (hub.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const updatedHub = await db.update(hubs).set({
            name: input.name,
            description: input.description,
        }).where(eq(hubs.id, input.id)).returning();
        return updatedHub;
    }),
    deleteHub: protectedProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const hub = await db.query.hubs.findFirst({
            where: eq(hubs.id, input.id),
        });
        if (!hub) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        if (hub.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const deletedHub = await db.delete(hubs).where(eq(hubs.id, input.id)).returning();
        return deletedHub;
    }),
})