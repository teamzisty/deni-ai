# syntax=docker/dockerfile:1
#
# Dokploy (Dockerfile build)
# -------------------------
# Application settings:
#   Build Type:        Dockerfile
#   Dockerfile path:   Dockerfile
#   Docker context:    .
#   Port:              3000
#
# Environment (service Environment tab):
#   - Put ALL required secrets/public vars there (same as .env.production).
#   - Mark NEXT_PUBLIC_* as build-time so they are embedded into the client bundle.
#   - Server secrets (DATABASE_URL, API keys, …) are read at runtime.
#
# Notes:
#   - Dependencies install with Bun (bun.lock).
#   - Next.js build + runtime use Node.js (Bun has crashed mid-build on some VPS CPUs).
#
# Local:
#   docker build -t deni-ai .
#   docker run --rm -p 3000:3000 --env-file .env.production deni-ai

# ---------------------------------------------------------------------------
# Install dependencies (Bun workspaces + bun.lock)
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/disposable-email-domains ./packages/disposable-email-domains
RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# Build with Node (stable Next.js production build)
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
  NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Dokploy injects service env during `docker build` (as build-args / env).
# Defaults are placeholders so the image can compile without real secrets.
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ARG BETTER_AUTH_SECRET=01234567890123456789012345678901
ARG GOOGLE_CLIENT_ID=build
ARG GOOGLE_CLIENT_SECRET=build
ARG GITHUB_CLIENT_ID=build
ARG GITHUB_CLIENT_SECRET=build
ARG STRIPE_SECRET_KEY=sk_test_build
ARG GOOGLE_GENERATIVE_AI_API_KEY=build
ARG ANTHROPIC_API_KEY=build
ARG GROQ_API_KEY=build
ARG OPENROUTER_API_KEY=build
ARG BRAVE_SEARCH_API_KEY=build
ARG TURNSTILE_SECRET_KEY=build
ARG NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=build
# Optional vars are NOT defaulted to "". emptyStringAsUndefined in src/env.ts
# treats "" from Dokploy as unset.

ENV DATABASE_URL=$DATABASE_URL \
  BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
  GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
  GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
  GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID \
  GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET \
  STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
  GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_GENERATIVE_AI_API_KEY \
  ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  GROQ_API_KEY=$GROQ_API_KEY \
  OPENROUTER_API_KEY=$OPENROUTER_API_KEY \
  BRAVE_SEARCH_API_KEY=$BRAVE_SEARCH_API_KEY \
  TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET_KEY \
  NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL \
  NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

# Use Node for `next build` — Bun has segfaulted during "Finalizing page optimization"
# on some hosts (SIGILL / exit 132).
RUN node ./node_modules/next/dist/bin/next build

# ---------------------------------------------------------------------------
# Runtime (Next.js standalone + Node)
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Dokploy / Traefik reach the container on this port.
# HOSTNAME=0.0.0.0 is required so the proxy can connect.
ENV PORT=3000 \
  HOSTNAME=0.0.0.0 \
  NEXT_TELEMETRY_DISABLED=1 \
  NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
