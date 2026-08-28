"""create_proposal — the one write path every agent shares.

Anything that spends money, contacts a customer, or posts publicly becomes a
pending row in agent_proposals; the owner approves it on /admin/agents and
worker.py executes it. The payload must be the exact arguments the worker
will execute with.
"""

from __future__ import annotations

from typing import Any

from .. import db
from ..llm.grok import Tool


def create_proposal(
    *,
    agent: str,
    run_id: str | None,
    kind: str,
    title: str,
    rationale: str,
    payload: dict[str, Any],
    estimated_cost_usd: float = 0,
    assets: list[str] | None = None,
) -> dict[str, Any]:
    # An identical pending proposal means nothing changed since the last run —
    # don't stack duplicates for the owner to wade through.
    existing = db.query_one(
        """select id from agent_proposals
            where agent = %s and kind = %s and status = 'pending' and payload = %s::jsonb""",
        (agent, kind, db.jsonb(payload)),
    )
    if existing:
        return {"proposal_id": str(existing["id"]), "status": "duplicate_pending_skipped"}

    row = db.query_one(
        """insert into agent_proposals
             (run_id, agent, kind, title, rationale, payload, estimated_cost_usd, assets)
           values (%s, %s, %s, %s, %s, %s::jsonb, %s, %s::jsonb)
           returning id""",
        (
            run_id, agent, kind, title, rationale,
            db.jsonb(payload), estimated_cost_usd,
            db.jsonb(assets) if assets is not None else None,
        ),
    )
    assert row is not None
    return {"proposal_id": str(row["id"]), "status": "pending"}


def make_create_proposal_tool(agent: str, run_id: str | None, kinds: list[str]) -> Tool:
    """The create_proposal tool, bound to this run and this agent's allowed kinds."""

    def impl(**kwargs: Any) -> dict[str, Any]:
        kind = kwargs.get("kind", "")
        if kind not in kinds:
            return {"error": f"kind must be one of {kinds}"}
        return create_proposal(
            agent=agent,
            run_id=run_id,
            kind=kind,
            title=str(kwargs.get("title", ""))[:200],
            rationale=str(kwargs.get("rationale", "")),
            payload=kwargs.get("payload") or {},
            estimated_cost_usd=float(kwargs.get("estimated_cost_usd") or 0),
            assets=kwargs.get("assets"),
        )

    return Tool(
        name="create_proposal",
        description=(
            "File a proposal for the owner to approve. Use for anything outside your "
            "auto-execute scope. payload must contain the exact arguments the worker "
            "will execute with once approved."
        ),
        parameters={
            "type": "object",
            "properties": {
                "kind": {"type": "string", "enum": kinds},
                "title": {"type": "string", "description": "Short human-readable title."},
                "rationale": {
                    "type": "string",
                    "description": "Why this action, with the numbers that justify it.",
                },
                "payload": {
                    "type": "object",
                    "description": "Exact execution arguments for the worker.",
                },
                "estimated_cost_usd": {"type": "number"},
                "assets": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Storage URLs of any creatives attached to this proposal.",
                },
            },
            "required": ["kind", "title", "rationale", "payload"],
        },
        func=impl,
    )
