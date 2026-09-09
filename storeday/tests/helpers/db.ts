import { Client } from "pg";
import { execSync } from "node:child_process";

export const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://app:app@127.0.0.1:5432/storeday_test";

/** Rebuilds the test database from the migrations (fresh schema each test file). */
export function resetTestDatabase() {
  const url = new URL(DATABASE_URL);
  const db = url.pathname.slice(1);
  execSync(`bash scripts/db-reset.sh ${db}`, {
    stdio: "pipe",
    env: { ...process.env, PGHOST: url.hostname, PGUSER: url.username, PGPASSWORD: url.password, PGPORT: url.port || "5432" },
  });
}

export async function connect(): Promise<Client> {
  const c = new Client({ connectionString: DATABASE_URL });
  await c.connect();
  return c;
}

/** Run a callback as an authenticated Supabase user (RLS active) inside one transaction. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export async function asUser<T>(c: Client, userId: string | null, fn: (q: (sql: string, params?: unknown[]) => Promise<Row[]>) => Promise<T>): Promise<T> {
  await c.query("begin");
  try {
    await c.query(`set local role ${userId ? "authenticated" : "anon"}`);
    await c.query("select set_config('request.jwt.claim.sub', $1, true)", [userId ?? ""]);
    await c.query("select set_config('request.jwt.claim.role', $1, true)", [userId ? "authenticated" : "anon"]);
    const q = async (sql: string, params?: unknown[]) => (await c.query(sql, params)).rows;
    const out = await fn(q);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback");
    throw e;
  }
}

export async function createAuthUser(c: Client, email: string, fullName = "Test User"): Promise<string> {
  const { rows } = await c.query("insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id", [email, { full_name: fullName }]);
  return rows[0].id as string;
}
