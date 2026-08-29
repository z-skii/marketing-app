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


def owner_feedback_context(agent: str, limit: int = 12) -> str:
    """The owner's recent verdicts on this agent's proposals, formatted for
    the run context. Approvals are the taste to repeat; rejections — above
    all ones with a note — are standing instructions until revoked."""
    rows = db.query(
        """select kind, title, status::text as status,
                  execution_result ->> 'rejection_note' as note
             from agent_proposals
            where agent = %s and status in ('approved','executed','rejected')
            order by decided_at desc nulls last, created_at desc
            limit %s""",
        (agent, limit),
    )
    if not rows:
        return "Owner feedback so far: none yet."
    lines = ["Owner feedback on your recent proposals (newest first):"]
    for row in rows:
        verdict = "APPROVED" if row["status"] in ("approved", "executed") else "REJECTED"
        line = f"- {verdict}: [{row['kind']}] {row['title']}"
        if row["note"]:
            line += f" — owner said: \"{row['note']}\""
        lines.append(line)
    lines.append(
        "Treat every rejection note as a standing rule. Repeat what gets approved; "
        "never re-propose a rejected pattern unless the owner's notes say otherwise."
    )
    return "\n".join(lines)


def _generated_asset_urls(run_id: str | None) -> set[str]:
    if run_id is None:
        return set()
    rows = db.query(
        """select result ->> 'asset_url' as url from agent_actions
            where run_id = %s and tool in ('generate_image','generate_video')
              and result ? 'asset_url'""",
        (run_id,),
    )
    return {row["url"] for row in rows if row["url"]}


def _validate_creative_batch(run_id: str | None, kwargs: dict[str, Any]) -> str | None:
    """A creative batch may only reference assets actually generated during
    this run — the audit trail is the source of truth, not the model's word.
    Kills fabricated asset URLs outright."""
    generated = _generated_asset_urls(run_id)
    claimed = set(kwargs.get("assets") or [])
    for item in (kwargs.get("payload") or {}).get("items", []):
        if isinstance(item, dict) and item.get("asset_url"):
            claimed.add(item["asset_url"])
    if not claimed:
        return ("a creative_batch needs at least one asset; generate images/videos "
                "first, or file nothing this run")
    fabricated = claimed - generated
    if fabricated:
        return ("these asset URLs were not produced by generate_image/generate_video "
                f"in this run and cannot be proposed: {sorted(fabricated)}. "
                f"The URLs actually generated in this run are: {sorted(generated)} — "
                "retry create_proposal copying these EXACTLY. If generation failed, "
                "file no proposal and report the failure instead.")
    return None


def make_create_proposal_tool(agent: str, run_id: str | None, kinds: list[str]) -> Tool:
    """The create_proposal tool, bound to this run and this agent's allowed kinds."""

    def impl(**kwargs: Any) -> dict[str, Any]:
        kind = kwargs.get("kind", "")
        if kind not in kinds:
            return {"error": f"kind must be one of {kinds}"}
        if kind == "creative_batch":
            problem = _validate_creative_batch(run_id, kwargs)
            if problem:
                return {"error": problem}
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
