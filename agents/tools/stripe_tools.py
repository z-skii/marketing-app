"""Stripe: look up payments and issue refunds.

issue_refund is exposed to the admin agent with the refund_auto_cap_usd cap
enforced HERE, in code — the model cannot talk its way past it. Refunds above
the cap must go through a proposal; the worker calls execute_refund, which
skips the cap because a human approved the amount.

A refund also claws the credit back off the member's wallet ledger so the
books match Stripe.
"""

from __future__ import annotations

import os
from typing import Any

from .. import config, db
from ..llm.grok import Tool


def _stripe():
    import stripe

    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY is not set")
    stripe.api_key = key
    return stripe


def _payment_row(payment_intent_id: str) -> dict[str, Any]:
    row = db.query_one(
        """select sp.id, sp.user_id, sp.amount_cents, sp.status::text, p.member_no
             from stripe_payments sp join profiles p on p.id = sp.user_id
            where sp.stripe_payment_intent_id = %s""",
        (payment_intent_id,),
    )
    if row is None:
        raise ValueError(f"no recorded payment with intent {payment_intent_id!r}")
    if row["status"] != "succeeded":
        raise ValueError(f"payment {payment_intent_id} is {row['status']}, not succeeded")
    return row


def execute_refund(payment_intent_id: str, amount_cents: int | None = None,
                   reason: str = "") -> dict[str, Any]:
    """Refund a payment (full by default) and claw back the platform credit."""
    row = _payment_row(payment_intent_id)
    amount = int(amount_cents) if amount_cents else int(row["amount_cents"])
    if not 0 < amount <= int(row["amount_cents"]):
        raise ValueError(f"refund amount {amount} exceeds payment of {row['amount_cents']} cents")

    stripe = _stripe()
    refund = stripe.Refund.create(payment_intent=payment_intent_id, amount=amount)

    # Mirror the refund on the credit ledger, clamped at the member's available
    # credit — credit already spent on placements can't go negative; the
    # difference is the cost of the goodwill refund.
    wallet = db.query_one(
        "select available_credit_cents from wallets where user_id = %s", (row["user_id"],)
    )
    clawback = min(amount, int(wallet["available_credit_cents"]) if wallet else 0)
    if clawback > 0:
        db.execute(
            "select admin_adjust_credit(null, %s::uuid, %s::bigint, %s)",
            (row["user_id"], -clawback, f"refund {refund['id']}: {reason}"[:500] or "refund"),
        )
    return {
        "refund_id": refund["id"],
        "payment_intent_id": payment_intent_id,
        "amount_cents": amount,
        "credit_clawed_back_cents": clawback,
        "member_no": row["member_no"],
    }


def issue_refund_capped(payment_intent_id: str, amount_cents: int | None = None,
                        reason: str = "") -> dict[str, Any]:
    """The admin agent's direct refund path: hard-capped by refund_auto_cap_usd."""
    row = _payment_row(payment_intent_id)
    amount = int(amount_cents) if amount_cents else int(row["amount_cents"])
    cap_cents = int(config.get_float("refund_auto_cap_usd") * 100)
    if amount > cap_cents:
        return {
            "error": (
                f"refund of {amount} cents exceeds the auto-refund cap of {cap_cents} cents. "
                "File a create_proposal with kind 'refund' instead."
            )
        }
    return execute_refund(payment_intent_id, amount, reason)


def issue_refund_tool() -> Tool:
    return Tool(
        name="issue_refund",
        description=(
            "Refund a Stripe payment and claw back the credit. Only works up to the "
            "auto-refund cap; larger refunds must be proposed for approval."
        ),
        parameters={
            "type": "object",
            "properties": {
                "payment_intent_id": {"type": "string"},
                "amount_cents": {
                    "type": "integer",
                    "description": "Partial refund in cents; omit for a full refund.",
                },
                "reason": {"type": "string"},
            },
            "required": ["payment_intent_id", "reason"],
        },
        func=issue_refund_capped,
    )
