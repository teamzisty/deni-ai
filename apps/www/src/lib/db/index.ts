import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../env';

// Database connection URL
const connectionString = env.DATABASE_URL;

// Create the connection
const client = postgres(connectionString);

// Create the drizzle instance
export const db = drizzle(client, { schema });

// Export the client for direct queries if needed
export { client };

// Export all schema
export * from './schema';