import "server-only";
import { sql } from "./db";

/**
 * Data access for the agent system: proposals awaiting the owner's decision
 * and the run log. Written by the Python service in /agents; decided here.
 */

export type ProposalStatus = "pending" | "approved" | "rejected" | "executed" | "failed";

export type AgentProposal = {
  id: string;
  run_id: string | null;
  agent: string;
  kind: string;
  title: string;
  rationale: string;
  payload: Record<string, unknown>;
  estimated_cost_usd: string;
  assets: string[] | null;
  status: ProposalStatus;
  created_at: string;
  decided_at: string | null;
  executed_at: string | null;
  execution_result: Record<string, unknown> | null;
};

export type AgentRun = {
  id: string;
  agent: string;
  started_at: string;
  finished_at: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  summary: string | null;
  error: string | null;
};

export async function getProposals(statuses: ProposalStatus[], limit = 50): Promise<AgentProposal[]> {
  return sql<AgentProposal>(
    `select id, run_id, agent, kind, title, rationale, payload, estimated_cost_usd,
            assets, status::text, created_at, decided_at, executed_at, execution_result
       from agent_proposals
      where status = any($1::proposal_status[])
      order by created_at desc
      limit $2`,
    [statuses, limit],
  );
}

export async function getProposalCounts(): Promise<Record<string, number>> {
  const rows = await sql<{ status: string; n: string }>(
    `select status::text, count(*)::text as n from agent_proposals group by status`,
  );
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
}

export async function getRuns(limit = 40): Promise<AgentRun[]> {
  return sql<AgentRun>(
    `select id, agent, started_at, finished_at, model, input_tokens, output_tokens, summary, error
       from agent_runs
      order by started_at desc
      limit $1`,
    [limit],
  );
}

// ---------------------------------------------------------------- HQ

export type AgentStatus = {
  agent: string;
  last_started: string | null;
  last_finished: string | null;
  last_summary: string | null;
  last_error: string | null;
  runs_today: number;
  tokens_today: number;
  pending_proposals: number;
};

const AGENT_NAMES = ["ops", "admin", "creative", "ads", "social"];

/** One row per agent: latest run, today's usage, open proposals. Agents with
 * no runs yet read as dormant (their secrets aren't configured). */
export async function getAgentRoster(): Promise<AgentStatus[]> {
  const rows = await sql<AgentStatus>(
    `select a.agent,
            r.started_at as last_started, r.finished_at as last_finished,
            r.summary as last_summary, r.error as last_error,
            coalesce(t.runs_today, 0)::int as runs_today,
            coalesce(t.tokens_today, 0)::int as tokens_today,
            coalesce(p.pending, 0)::int as pending_proposals
       from unnest($1::text[]) as a(agent)
       left join lateral (
         select started_at, finished_at, summary, error from agent_runs
          where agent = a.agent order by started_at desc limit 1
       ) r on true
       left join lateral (
         select count(*) as runs_today,
                sum(coalesce(input_tokens,0) + coalesce(output_tokens,0)) as tokens_today
           from agent_runs
          where agent = a.agent and started_at >= date_trunc('day', now())
       ) t on true
       left join lateral (
         select count(*) as pending from agent_proposals
          where agent = a.agent and status = 'pending'
       ) p on true`,
    [AGENT_NAMES],
  );
  return rows;
}

export type FeedItem = {
  type: "run" | "action" | "proposal";
  agent: string;
  text: string;
  detail: string | null;
  at: string;
  id: string;
};

/** Merged live feed: runs finishing, tools being called, proposals moving. */
export async function getActivityFeed(limit = 40): Promise<FeedItem[]> {
  return sql<FeedItem>(
    `(select 'run'::text as type, agent,
             case when finished_at is null then 'run started'
                  when error is not null then 'run finished with error'
                  else 'run finished' end as text,
             coalesce(summary, error) as detail,
             coalesce(finished_at, started_at) as at, id::text
        from agent_runs order by started_at desc limit $1)
     union all
     (select 'action', agent, tool, args::text, created_at, id::text
        from agent_actions order by created_at desc limit $1)
     union all
     (select 'proposal', agent, status::text || ' · ' || title,
             rationale, coalesce(executed_at, decided_at, created_at), id::text
        from agent_proposals order by created_at desc limit $1)
     order by at desc limit $1`,
    [limit],
  );
}

export type HqStats = {
  qualified_today: number; rejected_today: number; revenue_cents_today: number;
  topups_cents_today: number; signups_today: number; visitors_hour: number;
  active_placements: number; pending_total: number;
};

export async function getHqStats(): Promise<HqStats> {
  const row = await sql<Record<string, string>>(
    `select
       (select count(*) from click_events where qualified
         and created_at >= date_trunc('day', now() at time zone 'America/New_York')
                             at time zone 'America/New_York') as qualified_today,
       (select count(*) from click_events where not qualified
         and created_at >= date_trunc('day', now() at time zone 'America/New_York')
                             at time zone 'America/New_York') as rejected_today,
       (select coalesce(sum(debit_cents),0) from click_events
         where created_at >= date_trunc('day', now() at time zone 'America/New_York')
                               at time zone 'America/New_York') as revenue_cents_today,
       (select coalesce(sum(amount_cents),0) from stripe_payments
         where status = 'succeeded'
           and created_at >= date_trunc('day', now() at time zone 'America/New_York')
                               at time zone 'America/New_York') as topups_cents_today,
       (select count(*) from profiles
         where created_at >= date_trunc('day', now() at time zone 'America/New_York')
                               at time zone 'America/New_York') as signups_today,
       (select count(*) from visitors where last_seen >= now() - interval '1 hour') as visitors_hour,
       (select count(*) from placements where status = 'active') as active_placements,
       (select count(*) from agent_proposals where status = 'pending') as pending_total`,
  );
  const n = (k: string) => Number(row[0]?.[k] ?? 0);
  return {
    qualified_today: n("qualified_today"), rejected_today: n("rejected_today"),
    revenue_cents_today: n("revenue_cents_today"), topups_cents_today: n("topups_cents_today"),
    signups_today: n("signups_today"), visitors_hour: n("visitors_hour"),
    active_placements: n("active_placements"), pending_total: n("pending_total"),
  };
}

/** Human next-run description from the schedules config. */
export async function getSchedules(): Promise<Record<string, string>> {
  const row = await sql<{ value: unknown }>(
    `select value from agent_config where key = 'schedules'`,
  );
  const schedules = (row[0]?.value ?? {}) as Record<
    string, { every_minutes?: number; at?: string[]; tz?: string }
  >;
  const out: Record<string, string> = {};
  for (const name of AGENT_NAMES) {
    const sched = schedules[name];
    if (!sched) out[name] = "—";
    else if (sched.every_minutes) {
      out[name] = sched.every_minutes >= 60
        ? `every ${sched.every_minutes / 60}h`
        : `every ${sched.every_minutes}m`;
    } else out[name] = `daily ${(sched.at ?? []).join(", ")} ET`;
  }
  return out;
}

/** The most recent ops daily brief (the run started in the 8am hour, owner's
 * brief timezone) — pinned at the top of the Runs tab. */
export async function getLatestBrief(): Promise<AgentRun | null> {
  const rows = await sql<AgentRun>(
    `select r.id, r.agent, r.started_at, r.finished_at, r.model,
            r.input_tokens, r.output_tokens, r.summary, r.error
       from agent_runs r
      where r.agent = 'ops' and r.summary is not null
        and extract(hour from r.started_at at time zone
              coalesce((select value #>> '{}' from agent_config where key = 'ops_brief_tz'),
                       'America/New_York'))
            = coalesce((select (value #>> '{}')::int from agent_config
                         where key = 'ops_brief_hour_local'), 8)
      order by r.started_at desc
      limit 1`,
  );
  return rows[0] ?? null;
}
