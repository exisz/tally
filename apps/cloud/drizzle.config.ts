import type { Config } from 'drizzle-kit';

/**
 * Drizzle config for tally cloud (libSQL / Turso).
 *
 * ⚠️ DO NOT run `drizzle-kit push` against prod — migrations are gated by
 * the `no-destructive-migrations` convention. Use `drizzle-kit generate` to
 * emit SQL files only; review and apply manually.
 */
export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'file:./local.db',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  },
} satisfies Config;
