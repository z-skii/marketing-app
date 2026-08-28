"""Admin agent — every 15 minutes.

Answers support mail and handles accounts. Auto-executes support replies /
onboarding email and refunds up to refund_auto_cap_usd (the cap lives in the
refund tool, not in the prompt). Bans and above-cap refunds are proposals.
"""

from __future__ import annotations

from datetime import datetime, timezone

from .. import config
from ..llm.grok import Tool
from ..tools import gmail_tools, stripe_tools, supabase_tools
from ..tools.proposal_tools import make_create_proposal_tool
from . import AgentDef, RunContext

PROPOSAL_KINDS = ["refund", "ban", "email", "other"]


def build_tools(ctx: RunContext) -> list[Tool]:
    return (
        gmail_tools.gmail_tools()
        + supabase_tools.admin_read_tools()
        + [stripe_tools.issue_refund_tool(),
           make_create_proposal_tool(ctx.agent, ctx.run_id, PROPOSAL_KINDS)]
    )


def build_context(ctx: RunContext) -> str:
    cap = config.get_float("refund_auto_cap_usd")
    now = datetime.now(timezone.utc)
    return (
        f"Time now: {now:%Y-%m-%d %H:%M} UTC.\n"
        f"Auto-refund cap: ${cap:.2f}. Larger refunds and every ban go through create_proposal.\n"
        "Check the unread support inbox and handle each message: look the member up, "
        "answer what you can, mark handled mail read. If the inbox tools fail because "
        "Gmail is not configured yet, say so and stop."
    )


AGENT = AgentDef(
    name="admin",
    proposal_kinds=PROPOSAL_KINDS,
    build_tools=build_tools,
    build_context=build_context,
)
