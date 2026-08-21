import { Pool } from "pg";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

export const TEST_DB = process.env.TEST_DATABASE ?? "untitled_test";

const connection = {
  host: process.env.PGHOST ?? "127.0.0.1",
  user: process.env.PGUSER ?? "app",
  password: process.env.PGPASSWORD ?? "app",
  database: TEST_DB,
};

export const pool = new Pool({ ...connection, max: 24 });

/** Rebuild the schema from migrations. Run once per test file. */
export function rebuildSchema() {
  execFileSync("bash", ["scripts/db-reset.sh", TEST_DB], {
    stdio: "pipe",
    env: { ...process.env, PGPASSWORD: connection.password },
  });
}

export async function truncateAll() {
  await pool.query(`
    truncate table credit_ledger, click_events, creator_earnings, creator_sessions,
      creator_referrals, payout_requests, stripe_payments, bar_queue, spot_schedules,
      board_round_entries, daily_rounds, placements, links, wallets, profiles,
      admin_audit_log restart identity cascade;
    delete from auth.users;
  `);
}

export async function q<T = Record<string, string>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool.query(sql, params);
  return r.rows as T[];
}

export async function createUser(email = `${randomUUID()}@example.test`) {
  const [u] = await q<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`, [email],
  );
  await q(`insert into profiles (id, display_name) values ($1, $2)`, [u.id, email.split("@")[0]]);
  await q(`select ensure_wallet($1)`, [u.id]);
  return u.id;
}

export async function topUp(userId: string, cents: number) {
  await q(`select apply_stripe_topup($1, $2, $3, $4)`, [
    userId, `cs_test_${randomUUID()}`, `pi_${randomUUID()}`, cents,
  ]);
}

export async function createLink(ownerId: string, opts: Partial<{ approved: boolean; name: string }> = {}) {
  const slug = `link-${randomUUID().slice(0, 8)}`;
  const [l] = await q<{ id: string }>(
    `insert into links (owner_id, slug, destination_url, domain, display_name, moderation_status)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [ownerId, slug, `https://${slug}.example.com`, `${slug}.example.com`,
     opts.name ?? slug, opts.approved === false ? "pending" : "approved"],
  );
  return l.id;
}

export async function allocate(userId: string, linkId: string, type: "board" | "spot" | "bar", cents: number) {
  const [row] = await q<{ allocate_to_placement: string }>(
    `select allocate_to_placement($1, $2, $3::placement_type, $4)`, [userId, linkId, type, cents],
  );
  return row.allocate_to_placement;
}

export async function placement(id: string) {
  const [p] = await q(`select * from placements where id = $1`, [id]);
  return p;
}

export async function boardScore(placementId: string) {
  const [row] = await q<{ score_cents: string }>(
    `select e.score_cents from board_round_entries e
     join daily_rounds r on r.id = e.round_id and r.status = 'active'
     where e.placement_id = $1`, [placementId],
  );
  return row ? Number(row.score_cents) : null;
}

export async function click(placementId: string, visitor: string = randomUUID(), extra: Partial<{
  creatorUser: string | null; creatorReferral: string | null; viewerUser: string | null; preReject: string | null;
}> = {}) {
  const [row] = await q<{
    qualified: boolean;
    rejection_reason: string | null;
    destination_url: string | null;
    debited_cents: string;
  }>(
    `select * from record_click($1, $2, null, 'test-agent', $3, $4, $5, $6)`,
    [placementId, visitor, extra.creatorUser ?? null, extra.creatorReferral ?? null,
     extra.viewerUser ?? null, extra.preReject ?? null],
  );
  return { ...row, debited_cents: Number(row.debited_cents) };
}
