import "server-only";
import { sql, sqlOne, transaction } from "@/lib/db";

/**
 * Durable background jobs on Postgres (table `jobs`, migration 0023).
 *
 *   enqueueJob(kind, payload)      writes a row
 *   registerJobHandler(kind, fn)   says what a kind does (src/lib/jobs/handlers.ts)
 *   runDueJobs(limit)              claims due rows with FOR UPDATE SKIP LOCKED
 *                                  and runs them; called by /api/jobs/run on a
 *                                  cron and by the dev route on demand
 *
 * A failing handler backs off exponentially (run_after = now + 2^attempts
 * minutes) until max_attempts, then the job is marked failed with its error.
 * Several workers can run at once; SKIP LOCKED keeps them off each other's rows.
 */

export type JobStatus = "queued" | "running" | "done" | "failed";

export type JobRow = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  run_after: string;
  error: string | null;
  result: unknown;
};

export type JobHandler = (payload: Record<string, unknown>, job: JobRow) => Promise<unknown>;

const handlers = new Map<string, JobHandler>();

export function registerJobHandler(kind: string, handler: JobHandler) {
  handlers.set(kind, handler);
}

export function hasJobHandler(kind: string): boolean {
  return handlers.has(kind);
}

export async function enqueueJob(
  kind: string,
  payload: Record<string, unknown> = {},
  opts: { runAfter?: Date; maxAttempts?: number } = {},
): Promise<{ id: string }> {
  const row = await sqlOne<{ id: string }>(
    `insert into jobs (kind, payload, run_after, max_attempts)
     values ($1, $2::jsonb, coalesce($3::timestamptz, now()), $4)
     returning id`,
    [kind, JSON.stringify(payload), opts.runAfter ?? null, Math.max(1, Math.round(opts.maxAttempts ?? 5))],
  );
  return { id: row!.id };
}

export async function getJob(id: string): Promise<JobRow | null> {
  return sqlOne<JobRow>(
    `select id, kind, payload, status, attempts, max_attempts,
            to_jsonb(run_after) #>> '{}' as run_after, error, result
       from jobs where id = $1`,
    [id],
  );
}

/** Claim one due job. Returns null when nothing is due. */
async function claimJob(): Promise<JobRow | null> {
  return transaction(async (client) => {
    const picked = await client.query<JobRow>(
      `select id, kind, payload, status, attempts, max_attempts,
              to_jsonb(run_after) #>> '{}' as run_after, error, result
         from jobs
        where status = 'queued' and run_after <= now()
        order by run_after, created_at
        limit 1
        for update skip locked`,
    );
    const job = picked.rows[0];
    if (!job) return null;
    await client.query(
      `update jobs set status = 'running', locked_at = now(), attempts = attempts + 1, updated_at = now()
        where id = $1`,
      [job.id],
    );
    return { ...job, status: "running", attempts: job.attempts + 1 };
  });
}

async function finishJob(job: JobRow, result: unknown) {
  await sql(
    `update jobs set status = 'done', result = $2::jsonb, error = null, locked_at = null, updated_at = now()
      where id = $1`,
    [job.id, JSON.stringify(result ?? null)],
  );
}

async function failJob(job: JobRow, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const exhausted = job.attempts >= job.max_attempts;
  const backoffMinutes = Math.min(2 ** job.attempts, 24 * 60);
  await sql(
    `update jobs
        set status = case when $3 then 'failed' else 'queued' end,
            error = $2,
            locked_at = null,
            run_after = case when $3 then run_after else now() + ($4::int * interval '1 minute') end,
            updated_at = now()
      where id = $1`,
    [job.id, message.slice(0, 2000), exhausted, backoffMinutes],
  );
}

/**
 * Run up to `limit` due jobs, one at a time. A job whose kind has no
 * registered handler is treated as a failure (so it backs off and is visible
 * in the table) rather than being silently dropped.
 */
export async function runDueJobs(limit = 10): Promise<{ ran: number; failed: number }> {
  let ran = 0;
  let failed = 0;
  for (let i = 0; i < limit; i++) {
    const job = await claimJob();
    if (!job) break;
    const handler = handlers.get(job.kind);
    try {
      if (!handler) throw new Error(`No handler registered for job kind "${job.kind}"`);
      const result = await handler(job.payload ?? {}, job);
      await finishJob(job, result);
      ran++;
    } catch (error) {
      await failJob(job, error);
      failed++;
    }
  }
  return { ran, failed };
}
