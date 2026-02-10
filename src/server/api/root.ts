import { apiKeysRouter } from "./routers/api-keys";
import { billingRouter } from "./routers/billing";
import { chatRouter } from "./routers/chat";
import { migrationRouter } from "./routers/migration";
import { organizationRouter } from "./routers/organization";
import { providersRouter } from "./routers/providers";
import { shareRouter } from "./routers/share";
import { router, t } from "./trpc";

export const appRouter = router({
  apiKeys: apiKeysRouter,
  chat: chatRouter,
  billing: billingRouter,
  migration: migrationRouter,
  organization: organizationRouter,
  providers: providersRouter,
  share: shareRouter,
});

export const createCaller = t.createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
