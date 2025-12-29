import { billingRouter } from "./routers/billing";
import { chatRouter } from "./routers/chat";
import { migrationRouter } from "./routers/migration";
import { providersRouter } from "./routers/providers";
import { shareRouter } from "./routers/share";
import { router, t } from "./trpc";

export const appRouter = router({
  chat: chatRouter,
  billing: billingRouter,
  migration: migrationRouter,
  providers: providersRouter,
  share: shareRouter,
});

export const createCaller = t.createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
