import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/env";

import * as schema from "@/db/schema";

/**
 * Long-lived Docker / Dokploy process: TCP pool via postgres.js.
 * Date values in raw `sql` fragments must be ISO strings (`::timestamptz`);
 * postgres.js cannot serialize a Date instance (unlike neon-http).
 * `prepare: false` stays compatible with Neon's PgBouncer pooler URL.
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
