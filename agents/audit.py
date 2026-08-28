"""Audit trail helpers: agent_runs rows and agent_actions entries.

Every agent invocation gets an agent_runs row (start_run / finish_run), and
every tool call an agent makes is recorded in agent_actions via log_action.
"""

from __future__ import annotations

from typing import Any

from . import db


def start_run(agent: str, model: str) -> str:
    row = db.query_one(
        "insert into agent_runs (agent, model) values (%s, %s) returning id",
        (agent, model),
    )
    assert row is not None
    return str(row["id"])


def finish_run(
    run_id: str,
    summary: str | None = None,
    error: str | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
) -> None:
    db.execute(
        """update agent_runs
              set finished_at = now(), summary = %s, error = %s,
                  input_tokens = %s, output_tokens = %s
            where id = %s""",
        (summary, error, input_tokens, output_tokens, run_id),
    )


def log_action(run_id: str | None, agent: str, tool: str, args: Any, result: Any) -> None:
    db.execute(
        """insert into agent_actions (run_id, agent, tool, args, result)
           values (%s, %s, %s, %s::jsonb, %s::jsonb)""",
        (run_id, agent, tool, db.jsonb(args), db.jsonb(result)),
    )
