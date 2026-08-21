import "server-only";
import { Pool, type PoolClient } from "pg";

/**
 * Server-side data access.
 *
 * Supabase provides Postgres, Auth and Storage. Application queries talk to
 * Postgres directly over the pooled connection string rather than through
 * PostgREST: the money logic lives in SQL functions that need real transactions,
 * and this keeps local development, CI and production on identical code paths.
 * Row Level Security still guards anything that reaches the database with a
 * user's own credentials.
 */

declare global {
  var __untitled_pool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Point it at your local Postgres, or at the " +
        "Supabase connection pooler in production. See .env.example.",
    );
  }
  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? undefined
      : { rejectUnauthorized: false },
  });
}

export function pool(): Pool {
  if (!global.__untitled_pool) global.__untitled_pool = createPool();
  return global.__untitled_pool;
}

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool().query(text, params);
  return result.rows as T[];
}

export async function sqlOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await sql<T>(text, params);
  return rows[0] ?? null;
}

/** Run several statements inside one transaction. */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
