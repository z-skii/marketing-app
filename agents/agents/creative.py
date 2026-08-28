"""Creative agent — daily, plus on demand when Ads/Social need a batch.

Generates ad creatives and post images with Higgsfield (auto-execute, capped
per day in code) and files them as a creative_batch proposal the owner
approves before Ads or Social may use them.
"""

from __future__ import annotations

from datetime import datetime, timezone

from .. import config
from ..llm.grok import Tool
from ..tools import higgsfield_tools, supabase_tools
from ..tools.proposal_tools import make_create_proposal_tool
from . import AgentDef, RunContext

PROPOSAL_KINDS = ["creative_batch"]


def build_tools(ctx: RunContext) -> list[Tool]:
    reads = [t for t in supabase_tools.ops_read_tools()
             if t.name in ("get_board_snapshot", "get_metrics")]
    return (
        reads
        + higgsfield_tools.creative_tools()
        + [make_create_proposal_tool(ctx.agent, ctx.run_id, PROPOSAL_KINDS)]
    )


def build_context(ctx: RunContext) -> str:
    cap = int(config.get_float("higgsfield_daily_cap_credits"))
    spent = higgsfield_tools.credits_spent_today()
    now = datetime.now(timezone.utc)
    return (
        f"Time now: {now:%Y-%m-%d %H:%M} UTC.\n"
        f"Higgsfield credits: {spent}/{cap} used today (image=1, video=5).\n"
        "Pull real numbers from the board and metrics first, then generate a small "
        "batch of creatives that use them, and file ONE creative_batch proposal "
        "listing every asset URL with its copy variant."
    )


AGENT = AgentDef(
    name="creative",
    proposal_kinds=PROPOSAL_KINDS,
    build_tools=build_tools,
    build_context=build_context,
)
