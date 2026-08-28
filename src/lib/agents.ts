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
