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
- For Stripe billing/custom checkout, also set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`STRIPE_WEBHOOK_SECRET` is optional for local development).

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
- Do not branch UI copy on locale with flags like `isJapanese` or `locale === "ja"` when `useExtracted()` can express it. Prefer translated strings and structure the JSX so ordering and wording come from translations, not locale conditionals.
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

■ Branch / PR / Merge Policy (Agents)

Default branch for day-to-day work is **`canary`**. **`master`** is the promotion/release target.

When the user asks to commit / push / PR / merge (including phrasing like 「全commit & push & pr & instant merge」):

1. **Work branch → `canary`**
   - Create a feature/fix branch from up-to-date `canary`.
   - Commit scoped changes (conventional commits).
   - Push the branch and open a PR with **base = `canary`**.
   - If the user asked to merge (or "instant merge"), merge that PR into `canary` (delete the head branch when appropriate) and pull `canary` locally.
2. **`canary` → `master` (required promotion step)**
   - After landing work on `canary`, **always open a PR with base = `master` and head = `canary`** to promote.
   - If the user asked to merge / instant merge, merge that PR into `master` as well (do not leave promotion only on `canary`).
   - Reuse an open canary→master PR if one already exists; otherwise create one. Title/body should summarize what is being promoted.

Other rules:

- Keep changes scoped to the task. Separate incidental refactors.
- Document purpose, context, and verification steps concisely.
- Do not force-push shared branches (`canary`, `master`) unless the user explicitly requests it.
- In this environment, do not perform git commits/branching unless explicitly instructed (patches only)—except when the user asked for commit/push/PR/merge as above.

■ Communication

- Agent responses should match the user's language. Detect from recent user messages; if unclear, ask briefly.
- Code, identifiers, and file contents should be written in English unless the user explicitly requests otherwise.

■ Troubleshooting

- Build failures (React Compiler/Next canary):
  - Revisit hooks, side effects, and dependency arrays in recent changes.
  - Confirm runtime (Node 20+/Bun).
- Env validation failures: Ensure `.env` has all required keys (see `src/env.ts`).

If you need to deviate from these guidelines, propose a minimal plan first (goal/impact/alternatives) before proceeding.

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
