"""Ops agent — hourly, read-only.

Watches the board, money, signups, and click quality. Files price_change,
reset_time_change, and flag_link proposals; writes the daily brief on the
8am run.
"""

from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from .. import config
from ..llm.grok import Tool
from ..tools import supabase_tools
from ..tools.proposal_tools import make_create_proposal_tool
from . import AgentDef, RunContext

PROPOSAL_KINDS = ["price_change", "reset_time_change", "flag_link"]


def build_tools(ctx: RunContext) -> list[Tool]:
    return supabase_tools.ops_read_tools() + [
        make_create_proposal_tool(ctx.agent, ctx.run_id, PROPOSAL_KINDS)
    ]


def build_context(ctx: RunContext) -> str:
    tz = ZoneInfo(str(config.get("ops_brief_tz") or "America/New_York"))
    now = datetime.now(timezone.utc).astimezone(tz)
    mode = (
        "This is the DAILY BRIEF run: end with the full daily brief."
        if ctx.is_brief_run
        else "This is a routine hourly check: only file proposals if something changed; "
             "end with one or two sentences on what you saw."
    )
    return (
        f"Time now: {now:%A %Y-%m-%d %H:%M} ({tz.key}).\n"
        f"{mode}\n"
        "Start from get_board_snapshot and get_metrics, then dig into anything unusual."
    )


AGENT = AgentDef(
    name="ops",
    proposal_kinds=PROPOSAL_KINDS,
    build_tools=build_tools,
    build_context=build_context,
)
