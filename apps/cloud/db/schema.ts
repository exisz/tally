/**
 * Tally cloud — Turso (libSQL) schema (Drizzle ORM).
 *
 * ⚠️ Schema FILES only. Do NOT run `drizzle-kit push` against prod —
 * see convention `no-destructive-migrations`. Migrations land in S4.
 *
 * Tracking: PLANET-1484 (sync), PLANET-1490 (tokens), PLANET-1491 (audit log).
 */
import {
  sqliteTable,
  text,
  integer,
  blob,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core';

/** Logto-issued user identity (sub). */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),                       // Logto sub
  email: text('email'),                              // may be null (GitHub OAuth)
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

/** Per-user, per-bucket sync metadata (E2EE — payloads are opaque). */
export const buckets = sqliteTable(
  'buckets',
  {
    id: text('id').primaryKey(),                     // bucket UUID, client-assigned
    userId: text('user_id').notNull().references(() => users.id),
    type: text('type').notNull(),                    // e.g. 'currentwindow', 'afkstatus'
    hostname: text('hostname').notNull(),            // device hostname (plaintext, low-entropy)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => ({
    userIdx: index('buckets_user_idx').on(t.userId),
  }),
);

/** Encrypted event blobs. Cloud cannot read `data`. */
export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),                     // event UUID
    bucketId: text('bucket_id').notNull().references(() => buckets.id),
    userId: text('user_id').notNull().references(() => users.id),
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
    durationMs: integer('duration_ms').notNull(),
    // XChaCha20-Poly1305 ciphertext of the original `data` payload.
    encryptedData: blob('encrypted_data').notNull(),
    nonce: blob('nonce').notNull(),
  },
  (t) => ({
    userTsIdx: index('events_user_ts_idx').on(t.userId, t.timestamp),
    bucketTsIdx: index('events_bucket_ts_idx').on(t.bucketId, t.timestamp),
  }),
);

/**
 * Agent M2M tokens (PLANET-1490). The plaintext `token` is shown once at
 * creation and never persisted; we keep an HMAC-SHA-256 fingerprint so revocation
 * checks can hit O(1) and audit logs can correlate by id.
 */
export const agentTokens = sqliteTable(
  'agent_tokens',
  {
    id: text('id').primaryKey(),                     // ULID
    userId: text('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),                    // user-facing label
    tokenHash: text('token_hash').notNull(),         // hex SHA-256 of bearer token
    logtoAppId: text('logto_app_id').notNull(),      // M2M app id in Logto
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    userIdx: index('agent_tokens_user_idx').on(t.userId),
    hashIdx: index('agent_tokens_hash_idx').on(t.tokenHash),
  }),
);

/** Token audit log (PLANET-1491). */
export const agentTokenAudit = sqliteTable(
  'agent_token_audit',
  {
    id: text('id').primaryKey(),                     // ULID
    tokenId: text('token_id').notNull().references(() => agentTokens.id),
    event: text('event').notNull(),                  // 'created' | 'used' | 'revoked'
    at: integer('at', { mode: 'timestamp_ms' }).notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
  },
  (t) => ({
    tokenIdx: index('agent_token_audit_token_idx').on(t.tokenId),
  }),
);
