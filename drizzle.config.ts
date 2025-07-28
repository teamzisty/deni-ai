import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './apps/www/src/lib/db/schema.ts',
  out: './apps/www/src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});