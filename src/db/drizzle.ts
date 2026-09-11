import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/env";

import * as schema from "@/db/schema";

/**
 * Long-lived Docker / Dokploy process: TCP pool via postgres.js.
 * Neon WebSocket (`neon-serverless`) idle-closes after ~30m and Bun surfaces
 * that as unhandled AbortError. HTTP (`neon-http`) is per-query and slower
 * here. `prepare: false` stays compatible with Neon's PgBouncer pooler URL.
 */
export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    max: 8,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  },
  schema,
});
