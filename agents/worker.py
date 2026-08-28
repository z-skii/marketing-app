"""Worker — every 5 minutes: execute owner-approved proposals.

    python -m agents.worker

Each approved proposal is claimed with FOR UPDATE SKIP LOCKED (overlapping
workers can't double-execute), dispatched on kind with its stored payload,
and marked executed or failed. Failures are NOT retried automatically; they
stay visible on the approval page for the owner.
"""

from __future__ import annotations

from typing import Any, Callable

from . import db
from .tools import gmail_tools, meta_ads_tools, social_tools, stripe_tools, supabase_tools
from .tools import tiktok_ads_tools


def _execute_price_change(payload: dict[str, Any]) -> Any:
    return supabase_tools.apply_price_change(payload["changes"])


def _execute_reset_time_change(payload: dict[str, Any]) -> Any:
    return supabase_tools.apply_reset_time_change(payload["board_reset_utc_hour"])


def _execute_flag_link(payload: dict[str, Any]) -> Any:
    return supabase_tools.flag_link(payload["slug"], payload.get("reason", "flagged by agent"))


def _execute_ban(payload: dict[str, Any]) -> Any:
    return supabase_tools.ban_link(
        payload["slug"], payload.get("reason", "banned"),
        block_domain=bool(payload.get("block_domain")),
    )


def _execute_refund(payload: dict[str, Any]) -> Any:
    return stripe_tools.execute_refund(
        payload["payment_intent_id"],
        payload.get("amount_cents"),
        payload.get("reason", "approved refund"),
    )


def _execute_email(payload: dict[str, Any]) -> Any:
    return gmail_tools.send_email(
        payload["to"], payload["subject"], payload["body"],
        reply_to_thread_id=payload.get("reply_to_thread_id"),
    )


def _execute_social_post(payload: dict[str, Any]) -> Any:
    return social_tools.post(payload["platform"], payload["text"], payload.get("asset_url"))


def _execute_ad_campaign(payload: dict[str, Any]) -> Any:
    if payload["platform"] == "meta":
        return meta_ads_tools.meta_create_campaign(
            payload["name"], payload["objective"], payload["daily_budget_cents"])
    return tiktok_ads_tools.tiktok_create_campaign(
        payload["name"], payload["objective"], payload["daily_budget_cents"])


def _execute_budget_change(payload: dict[str, Any]) -> Any:
    if payload["platform"] == "meta":
        return meta_ads_tools.meta_update_budget(payload["object_id"], payload["daily_budget_cents"])
    return tiktok_ads_tools.tiktok_update_budget(payload["object_id"], payload["daily_budget_cents"])


def _execute_resume_ad(payload: dict[str, Any]) -> Any:
    if payload["platform"] == "meta":
        return meta_ads_tools.meta_resume(payload["object_id"])
    return tiktok_ads_tools.tiktok_resume(payload["object_id"])


def _execute_approval_only(payload: dict[str, Any]) -> Any:
    # The approval itself is the outcome: an approved creative_batch becomes
    # usable by Ads/Social; creative_request and 'other' are acknowledgements.
    return {"noted": True}


DISPATCH: dict[str, Callable[[dict[str, Any]], Any]] = {
    "price_change": _execute_price_change,
    "reset_time_change": _execute_reset_time_change,
    "flag_link": _execute_flag_link,
    "ban": _execute_ban,
    "refund": _execute_refund,
    "email": _execute_email,
    "outreach_email": _execute_email,
    "social_post": _execute_social_post,
    "ad_campaign": _execute_ad_campaign,
    "budget_change": _execute_budget_change,
    "resume_ad": _execute_resume_ad,
    "creative_batch": _execute_approval_only,
    "creative_request": _execute_approval_only,
    "other": _execute_approval_only,
}


def execute_proposal(proposal_id: str) -> str | None:
    """Claim and execute one approved proposal. Returns the final status."""
    with db.transaction() as cur:
        cur.execute(
            """select id, kind, payload from agent_proposals
                where id = %s and status = 'approved'
                for update skip locked""",
            (proposal_id,),
        )
        proposal = cur.fetchone()
        if proposal is None:
            return None

        handler = DISPATCH.get(proposal["kind"])
        if handler is None:
            status, result = "failed", {"error": f"no executor for kind {proposal['kind']!r}"}
        else:
            try:
                status, result = "executed", {"ok": True, "result": handler(proposal["payload"])}
            except Exception as exc:
                status, result = "failed", {"error": str(exc)}

        cur.execute(
            """update agent_proposals
                  set status = %s::proposal_status, executed_at = now(),
                      execution_result = %s::jsonb
                where id = %s""",
            (status, db.jsonb(result), proposal_id),
        )
        return status


def drain(limit: int = 20) -> dict[str, int]:
    rows = db.query(
        "select id from agent_proposals where status = 'approved' order by created_at limit %s",
        (limit,),
    )
    outcome = {"executed": 0, "failed": 0}
    for row in rows:
        status = execute_proposal(str(row["id"]))
        if status:
            outcome[status] += 1
    print(f"[worker] {outcome['executed']} executed, {outcome['failed']} failed", flush=True)
    return outcome


if __name__ == "__main__":
    drain()
