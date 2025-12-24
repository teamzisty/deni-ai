import { billingRouter } from "./routers/billing";
import { chatRouter } from "./routers/chat";
import { providersRouter } from "./routers/providers";
import { shareRouter } from "./routers/share";
import { router, t } from "./trpc";

export const appRouter = router({
  chat: chatRouter,
  billing: billingRouter,
  providers: providersRouter,
  share: shareRouter,
});

export const createCaller = t.createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
