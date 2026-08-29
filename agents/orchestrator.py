"""Orchestrator: run each agent that is due.

    python -m agents.orchestrator --agent ops     # run one agent now
    python -m agents.orchestrator --due           # run whichever agents are due
    python -m agents.orchestrator --due --worker  # also drain approved proposals

For each run: open an agent_runs row, build the agent's context and tools,
drive the Grok tool loop, and record summary, tokens, and any error.
"""

from __future__ import annotations

import argparse
import sys
import traceback
from datetime import datetime, timezone

from . import audit, config, db
from .agents import RunContext, registry
from .llm.grok import run_agent


def last_run_started(agent: str) -> datetime | None:
    row = db.query_one(
        "select started_at from agent_runs where agent = %s order by started_at desc limit 1",
        (agent,),
    )
    return row["started_at"] if row else None


def _verified_postscript(run_id: str) -> str:
    """A system-counted truth line appended to every summary: what this run
    actually filed and did, per the audit trail — models sometimes claim
    otherwise, and the reader deserves the count next to the claim."""
    row = db.query_one(
        """select
             (select count(*) from agent_proposals where run_id = %s) as proposals,
             (select count(*) from agent_actions where run_id = %s
               and tool <> 'create_proposal' and (result ->> 'error') is null) as actions,
             (select count(*) from agent_actions where run_id = %s
               and (result ->> 'error') is not null) as failed""",
        (run_id, run_id, run_id),
    )
    if row is None:
        return ""
    return (f"\n\n[verified] proposals filed: {row['proposals']} · "
            f"successful tool calls: {row['actions']} · failed: {row['failed']}")


def run_one(name: str, client=None, now: datetime | None = None) -> str:
    """Run a single agent to completion. Returns the run id."""
    agents = registry()
    if name not in agents:
        raise SystemExit(f"unknown agent {name!r} (have: {', '.join(agents)})")
    agent_def = agents[name]

    model = config.model_for(name)
    run_id = audit.start_run(name, model)
    ctx = RunContext(agent=name, run_id=run_id,
                     is_brief_run=(name == "ops" and config.is_brief_run(now)))
    try:
        result = run_agent(
            agent_def.system_prompt(),
            agent_def.build_context(ctx),
            agent_def.build_tools(ctx),
            model,
            agent=name,
            run_id=run_id,
            client=client,
        )
        audit.finish_run(
            run_id,
            summary=(result.content or "") + _verified_postscript(run_id),
            error="; ".join(result.errors) or None,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
        )
    except Exception:
        audit.finish_run(run_id, error=traceback.format_exc(limit=5))
        raise
    return run_id


def run_due(client=None, now: datetime | None = None) -> list[str]:
    now = now or datetime.now(timezone.utc)
    ran = []
    for name in registry():
        if config.is_due(name, last_run_started(name), now):
            print(f"[orchestrator] running {name}", flush=True)
            try:
                ran.append(run_one(name, client=client, now=now))
            except Exception as exc:
                # One agent failing must not stop the others; the error is
                # already on its agent_runs row.
                print(f"[orchestrator] {name} failed: {exc}", file=sys.stderr, flush=True)
    return ran


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Tapmart agents.")
    parser.add_argument("--agent", help="run this agent now, regardless of schedule")
    parser.add_argument("--due", action="store_true", help="run all agents that are due")
    parser.add_argument("--worker", action="store_true", help="also execute approved proposals")
    args = parser.parse_args()

    if args.agent:
        run_id = run_one(args.agent)
        row = db.query_one("select summary, error from agent_runs where id = %s", (run_id,))
        print(f"run {run_id}\nsummary: {row['summary']}\nerror: {row['error']}")
    elif args.due:
        ran = run_due()
        print(f"[orchestrator] {len(ran)} run(s) completed")
    elif not args.worker:
        parser.error("pass --agent NAME or --due")

    if args.worker:
        from . import worker

        worker.drain()


if __name__ == "__main__":
    main()
