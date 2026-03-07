---
name: db-migrate
description: Generate and optionally apply Drizzle database migrations for this repository. Use when the user asks to create migrations from schema changes, inspect generated SQL, or run database migrations. Execute `bun run db:generate`, show the generated SQL for review, and only run `bun run db:migrate` if the user explicitly asked to apply migrations.
---

Generate and review database migrations.

1. Run `bun run db:generate` to generate migration files from schema changes in `src/db/schema/`.
2. Read the generated SQL and summarize the migration for review.
3. If the user explicitly asked to apply migrations, run `bun run db:migrate`.
4. Otherwise, stop after generation and report the next apply command.
