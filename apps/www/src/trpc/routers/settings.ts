import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db, userSettings } from "@/lib/db";
import { settingsSchema } from "@/lib/schemas/settings";

export const settingsRouter = createTRPCRouter({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
        const settings = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, ctx.user.id),
        });
        return settings;
    }),
    updateSettings: protectedProcedure.input(settingsSchema).mutation(async ({ input, ctx }) => {
        const settings = await db.update(userSettings).set({
            settings: input,
        }).where(eq(userSettings.userId, ctx.user.id));
        return settings;
    }),
});