import { neon } from "@neondatabase/serverless";
import { and, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../src/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

const RETENTION_DAYS = 7;
const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

const deleted = await db
  .delete(schema.user)
  .where(and(eq(schema.user.isAnonymous, true), lt(schema.user.createdAt, cutoff)))
  .returning({ id: schema.user.id });

console.log(
  `Deleted ${deleted.length} anonymous user(s) created before ${cutoff.toISOString()}`,
);
process.exit(0);
