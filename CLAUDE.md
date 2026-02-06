# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deni AI is a multi-provider AI chat application built with Next.js 16 (App Router), React 19, TypeScript, and featuring Stripe billing integration. The application supports multiple AI providers (OpenAI, Anthropic, Google) with usage tracking and subscription-based access controls.

**Key Technologies:**

- Next.js 16 (canary) with React 19 and React Compiler enabled
- TypeScript (strict mode)
- Bun runtime (preferred) or Node.js 20+
- oxlint for linting and oxfmt for formatting
- Tailwind CSS v4 via `@tailwindcss/postcss`
- shadcn/ui components
- PostgreSQL (Neon serverless) with Drizzle ORM
- better-auth for authentication (Google, GitHub, Passkey)
- tRPC for type-safe API routes
- Vercel AI SDK for chat streaming
- Stripe for billing and subscriptions

## Development Commands

**Development:**

```bash
bun dev                 # Start dev server at http://localhost:3000
bun run build          # Build for production
bun run start          # Start production server
```

**Code Quality:**

```bash
bun run lint           # Run oxlint linter
bun run format         # Format code with oxfmt
```

**Database (Drizzle):**

```bash
bun run db:generate    # Generate migration files from schema changes
bun run db:migrate     # Apply migrations to database
bun run db:push        # Push schema directly to database (no migration files)
```

**Authentication:**

```bash
bun run auth:generate  # Regenerate better-auth schema (outputs to src/db/schema/auth-schema.ts)
```

**Stripe Local Testing:**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Environment Variables

Required variables (validated via `src/env.ts` using Zod):

**Database:**

- `DATABASE_URL` - PostgreSQL connection URL (Neon serverless)

**Authentication:**

- `NEXT_PUBLIC_BETTER_AUTH_URL` - Public app URL (e.g., http://localhost:3000)
- `BETTER_AUTH_SECRET` - 32-character secret for better-auth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth

**AI Providers:**

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Generative AI API key

**Billing:**

- `STRIPE_SECRET_KEY` - Stripe secret key (required)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (optional for local dev)

Missing or invalid environment variables will cause startup failures due to strict Zod validation in `src/env.ts`.

## Architecture

### Dual API Pattern

The application uses two complementary API approaches:

1. **tRPC API** (`/api/trpc`) - Type-safe API for CRUD operations
   - Server routers in `src/server/api/routers/`
   - Client setup in `src/lib/trpc/`
   - Context includes DB and better-auth session
   - Two procedure types: `publicProcedure` and `protectedProcedure`
   - Current routers: `chat` (chat CRUD), `billing` (subscription management)

2. **AI SDK Streaming Endpoint** (`POST /api/chat`) - Vercel AI SDK for real-time chat
   - Direct streaming response (not tRPC compatible)
   - Handles AI provider selection and model routing
   - Includes usage tracking, and DuckDuckGo search tool
   - Updates chat via `updateChat()` helper on completion

### Authentication Flow

- **Server config:** `src/lib/auth.ts` exports better-auth instance with Drizzle adapter
- **API route:** `src/app/api/auth/[...all]/route.ts` handles all better-auth endpoints
- **Client SDK:** `src/lib/auth-client.ts` (baseURL: http://localhost:3000)
- **Session access:** Use `auth.api.getSession({ headers })` server-side
- **Schema:** Auto-generated in `src/db/schema/auth-schema.ts` (don't edit manually)

### Database Schema Organization

Schemas are organized by domain in `src/db/schema/`:

- `auth-schema.ts` - better-auth tables (auto-generated, don't edit)
- `chat.ts` - Chat and message tables
- `billing.ts` - Subscription and billing data
- `usage.ts` - Usage tracking per user/category
- `provider-keys.ts` - User-provided API keys (encrypted)
- `index.ts` - Aggregates all schemas for Drizzle

**Migration workflow:**

1. Edit schema files in `src/db/schema/`
2. Run `bun run db:generate` to create migration snapshot in `migrations/`
3. Run `bun run db:migrate` to apply (or `db:push` for direct schema push)

### AI Provider Integration

**Provider routing** (`src/app/api/chat/route.ts`):

- Model selection based on `models` constant from `src/lib/constants.ts`
- Supports OpenAI, Anthropic, Google, and custom "voids" provider
- Premium vs basic model categorization for usage tracking
- Provider-specific options (reasoning, thinking configs)

**Usage tracking** (`src/lib/usage.ts`):

- Pre-request usage limit checks
- Post-request usage consumption recording
- Categories: `basic` or `premium`
- Returns 402 status when limit exceeded

**Search tool:**

- DuckDuckGo search via `ts-duckduckgo-search` package
- Exposed to AI models as `search` tool with query and amount parameters

### Billing & Stripe Integration

**Stripe setup:**

- Webhook endpoint: `POST /api/stripe/webhook`
- Subscribe to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Subscription plans defined in `src/lib/stripe-subscriptions.ts`
- Billing router in `src/server/api/routers/billing.ts` handles checkout and portal access

**Data flow:**

1. User initiates checkout via tRPC `billing.createCheckoutSession`
2. Stripe processes payment
3. Webhook updates `billing` table with subscription data
4. Usage limits updated based on subscription tier

### Component Structure

**UI Components** (`src/components/ui/`):

- shadcn/ui generated components (minimal edits, excluded from linting)
- Use existing components; avoid creating new UI primitives

**Feature Components:**

- `src/components/chat/` - Chat interface, composer, home
- `src/components/ai-elements/` - Message rendering, reasoning display, sources
- `src/components/billing/` - Billing page and subscription UI
- Layout components: `header.tsx`, `sidebar.tsx`, `footer.tsx`

**Route Groups:**

- `(app)` - Main authenticated app (chat, settings)
- `(auth)` - Authentication pages
- `(home)` - Landing page

### Client State Management

- **tRPC React Query**: Used for all data fetching and mutations
- **AI SDK useChat**: Manages streaming chat state in `src/components/chat/chat-interface.tsx`
- **Providers**: Wrapped in `src/components/providers.tsx` (TRPCProvider, ThemeProvider, Auth, etc.)

## Key Conventions

**Module Paths:**

- Use `@/*` alias for imports (configured in `tsconfig.json`)
- Avoid deep relative paths

**File Naming:**

- kebab-case for files: `auth-client.ts`, `chat-interface.tsx`

**TypeScript:**

- Strict mode enabled
- Avoid `any` - use `unknown` and type guards when needed
- Leverage tRPC and Drizzle type inference

**React Patterns:**

- Server Components by default (App Router)
- Use `"use client"` only when needed (event handlers, hooks, browser APIs)
- Respect React Compiler constraints (no shared mutable closures)

**Code Style:**

- Prefer named exports
- Follow existing patterns in the codebase
- Run `bun run lint` and `bun run format` before committing

## Working with Auth

**Adding new OAuth providers:**

1. Add provider config in `src/lib/auth.ts`
2. Add environment variables to `src/env.ts`
3. Update `.env` with client ID/secret
4. Run `bun run auth:generate` if schema changes needed

**Accessing session:**

```typescript
// Server-side (API routes, Server Components)
const session = await auth.api.getSession({ headers: await headers() });
const userId = session?.session?.userId;

// Client-side
import { useSession } from "@daveyplate/better-auth-tanstack";
const { data: session } = useSession();
```

## Working with tRPC

**Adding a new router:**

1. Create router file in `src/server/api/routers/[name].ts`
2. Define procedures using `publicProcedure` or `protectedProcedure`
3. Import and add to `appRouter` in `src/server/api/root.ts`

**Using in components:**

```typescript
import { trpc } from "@/lib/trpc/react";

// In component
const { data, isLoading } = trpc.chat.getById.useQuery({ id: chatId });
const mutation = trpc.chat.create.useMutation();
```

## Working with Drizzle

**Schema changes:**

1. Edit schema files in `src/db/schema/`
2. Export new tables from `src/db/schema/index.ts`
3. Run `bun run db:generate` to create migration
4. Review generated SQL in `migrations/`
5. Run `bun run db:migrate` to apply

**Querying:**

```typescript
import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";

// In server context
const result = await db.select().from(chats).where(eq(chats.id, chatId));
```

## Common Patterns

**Protected API routes:**

- Use `protectedProcedure` in tRPC routers for authenticated-only endpoints
- For REST routes, check session manually and return 401 if unauthorized

**Error handling:**

- tRPC: Use `TRPCError` with appropriate error codes
- REST: Return `NextResponse.json()` with proper status codes
- Client: Display errors via toast (sonner)

**Usage limits:**

- Always check usage before expensive operations (AI calls)
- Use `getUsageSummary()` and `consumeUsage()` from `src/lib/usage.ts`
- Return 402 status with `reason: "usage_limit"` when exceeded

## Troubleshooting

**Build failures:**

- Check React 19 compatibility (React Compiler enabled)
- Verify Node.js 20+ or Bun installed
- Clear `.next` directory and rebuild

**Environment validation failures:**

- All required env vars must be present in `.env`
- Check `src/env.ts` for exact requirements
- Ensure `DATABASE_URL` and URLs are valid formats

**Database connection issues:**

- Verify `DATABASE_URL` is correct
- For Neon, ensure using `@neondatabase/serverless` driver
- Check if migrations are up to date: `bun run db:migrate`

**Auth issues:**

- Verify `NEXT_PUBLIC_BETTER_AUTH_URL` matches actual app URL
- Ensure `BETTER_AUTH_SECRET` is exactly 32 characters
- Regenerate auth schema if provider changes: `bun run auth:generate`

**Stripe webhook not working:**

- For local dev, use `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Verify `STRIPE_WEBHOOK_SECRET` matches webhook signing secret
- Check webhook events are configured in Stripe Dashboard

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output CLAUDE.md|01-app:{04-glossary.mdx}|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-cache-components.mdx,07-fetching-data.mdx,08-updating-data.mdx,09-caching-and-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,production-checklist.mdx,progressive-web-apps.mdx,public-static-pages.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route-segment-config.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,browserDebugInfoInTerminal.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,isolatedDevBuild.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-params.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,isolatedDevBuild.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
