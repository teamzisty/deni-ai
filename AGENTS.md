AGENTS.md (Agent Working Guide for deni-ai)

This file applies to the entire repository tree rooted here. Follow these rules, steps, and cautions when making changes. If a deeper directory contains its own AGENTS.md, the more specific one takes precedence. Direct instructions from system/developers/users override this file.

■ Project Overview

- Framework: Next.js App Router (next@16 canary, React 19, React Compiler enabled)
- Language/Types: TypeScript (strict)
- Runtime: Bun (preferred; bun.lock present) or Node.js 20+
- Lint/Format: oxlint (linting) and oxfmt (formatting)
- Styles: Tailwind CSS v4 (via `@tailwindcss/postcss`)
- UI: shadcn/ui (generated under `src/components/ui/*`)
- DB: Postgres (Neon serverless) + Drizzle ORM (`drizzle-kit`)
- Auth: better-auth (Drizzle adapter)

■ Required Environment Variables (as enforced by `src/env.ts`)

- `DATABASE_URL` (Postgres connection URL / required)
- `NEXT_PUBLIC_BETTER_AUTH_URL` (public app URL, e.g., http://localhost:3000)
- `BETTER_AUTH_SECRET` (32-character secret)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  Note: These are validated strictly via Zod. Missing/invalid values will cause runtime or startup failures.

■ Common Scripts (Bun preferred)

- Dev server: `bun dev` (or `bun run dev` / fallback: `bun run dev`)
- Build: `bun run build` (fallback: `bun run build`)
- Start: `bun run start` (fallback: `bun run start`)
- Lint: `bun run lint` (oxlint)
- Format: `bun run format` (oxfmt)
- Drizzle generate: `bun run db:generate` (create migrations snapshot)
- Drizzle migrate: `bun run db:migrate`
- Drizzle push: `bun run db:push`
- Regenerate better-auth schema: `bun run auth:generate` (uses `bunx` under the hood; overwrites `src/db/schema/auth-schema.ts`)

■ Coding Conventions

- Formatting/Linting: Adhere to oxlint and oxfmt. Run `bun run lint` and `bun run format` before submitting changes.
- Exports: Prefer named exports where reasonable. Match existing code style.
- Type safety: Keep TypeScript strict. Avoid `any`; if unavoidable, scope it narrowly.
- Module paths: Use the `@/*` alias (from `tsconfig.json`) to avoid deep relative paths.
- File naming: Follow existing kebab-case for files (e.g., `auth-client.ts`).
- React/Next: App Router patterns (`src/app/**/page.tsx`, `layout.tsx`). Respect server/client component boundaries.
- React Compiler: Avoid sharing mutable closures or side effects that break assumptions. Follow existing patterns.

■ Database & Migrations (Drizzle)

- Schema files live in `src/db/schema/*`; aggregated exports in `src/db/schema/index.ts`.
- Migrations are output to `migrations/` (see `drizzle.config.ts`).
- Driver: Neon (`drizzle-orm/neon-http`). `DATABASE_URL` must be set.
- Typical flow:
  1. Edit schema → 2) `bun run db:generate` → 3) `bun run db:migrate` or `bun run db:push`
- Caution: For destructive changes (dropping columns, type changes), plan safe migrations and backups.

■ Authentication (better-auth)

- Server config: `src/lib/auth.ts` (Drizzle adapter + providers).
- Route: `src/app/api/auth/[...all]/route.ts` exports the better-auth handler.
- Client: `src/lib/auth-client.ts` has `baseURL` pinned to `http://localhost:3000`; change only if requested.
- Regenerate schema with `bun run auth:generate` (may overwrite `auth-schema.ts`).

■ Frontend & Styles

- Tailwind v4; keep a utility-first approach.
- shadcn/ui generated files under `src/components/ui/*` are generally not edited and are excluded from linting.
  - If changes are absolutely necessary, keep them minimal and non-breaking to component APIs.
- Shared utilities belong in `src/lib/utils.ts`; reusable logic goes under `src/lib/`.

■ Internationalization (i18n)

- Translation files are located in `messages/` directory (`en.json`, `ja.json`, etc.).
- When adding new user-facing text strings:
  1. Add the key and English text to `messages/en.json`.
  2. Add the corresponding Japanese translation to `messages/ja.json`.
  3. Ensure all translation files have the same keys.
- Use `next-intl` for translations in components (e.g., `useExtracted()` hook).
- Before completing i18n-related changes, verify that all language files are in sync.

■ Directory Guidelines

- Pages/Layouts: `src/app/**`
- Shared components: `src/components/**`
- UI (generated): `src/components/ui/**`
- DB/ORM: `src/db/**`
- Auth/Client libs: `src/lib/**`
- Custom hooks: `src/hooks/**`

■ Prohibited/Use Caution

- Do not add heavyweight dependencies or change the toolchain (e.g., new formatter) without explicit approval.
- Avoid unnecessary renames of files/exports. Keep diffs minimal and targeted.
- Do not add license/copyright headers.
- Avoid destructive edits to generated files (especially `src/components/ui/*`). If required, justify and document impact.
- Never hardcode secrets. Use environment variables.

■ Validating Changes

- At minimum locally:
  - Run `bun run lint` and `bun run format`.
  - Start dev: `bun run dev` and open http://localhost:3000.
  - For schema changes: run `db:generate` → `db:migrate|db:push` (requires `DATABASE_URL`).
- Tests are not set up. For riskier areas, note manual verification steps or TODOs where appropriate.

■ PR/Commit Policy (Agents)

- Keep changes scoped to the task. Separate incidental refactors.
- Document purpose, context, and verification steps concisely.
- In this environment, do not perform git commits/branching unless explicitly instructed (patches only).

■ Communication

- Agent responses should match the user's language. Detect from recent user messages; if unclear, ask briefly.
- Code, identifiers, and file contents should be written in English unless the user explicitly requests otherwise.

■ Troubleshooting

- Build failures (React Compiler/Next canary):
  - Revisit hooks, side effects, and dependency arrays in recent changes.
  - Confirm runtime (Node 20+/Bun).
- Env validation failures: Ensure `.env` has all required keys (see `src/env.ts`).

If you need to deviate from these guidelines, propose a minimal plan first (goal/impact/alternatives) before proceeding.

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app:{04-glossary.mdx}|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-cache-components.mdx,07-fetching-data.mdx,08-updating-data.mdx,09-caching-and-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,production-checklist.mdx,progressive-web-apps.mdx,public-static-pages.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route-segment-config.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,browserDebugInfoInTerminal.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,isolatedDevBuild.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-params.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,isolatedDevBuild.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
