import { billingRouter } from "./routers/billing";
import { chatRouter } from "./routers/chat";
import { router, t } from "./trpc";

export const appRouter = router({
  chat: chatRouter,
  billing: billingRouter,
});

export const createCaller = t.createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
