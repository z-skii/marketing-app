"""Social / outreach agent — three times a day.

Drafts posts for X and Threads and outreach email to prospects; everything is
a proposal initially. When the owner sets social_auto_post_threads=true in
agent_config (after two weeks of clean approvals), Threads posting becomes a
direct tool.
"""

from __future__ import annotations

from datetime import datetime, timezone

from .. import config
from ..llm.grok import Tool
from ..tools import social_tools
from ..tools.proposal_tools import make_create_proposal_tool, owner_feedback_context
from . import AgentDef, RunContext

PROPOSAL_KINDS = ["social_post", "outreach_email"]


def build_tools(ctx: RunContext) -> list[Tool]:
    tools = social_tools.social_read_tools() + [
        make_create_proposal_tool(ctx.agent, ctx.run_id, PROPOSAL_KINDS)
    ]
    if bool(config.get("social_auto_post_threads")):
        tools.append(social_tools.threads_post_tool())
    return tools


def build_context(ctx: RunContext) -> str:
    now = datetime.now(timezone.utc)
    auto = bool(config.get("social_auto_post_threads"))
    return (
        f"Time now: {now:%Y-%m-%d %H:%M} UTC.\n"
        + ("Threads auto-posting is ENABLED for you.\n" if auto
           else "All posting is propose-only right now.\n")
        + f"\n{owner_feedback_context(ctx.agent)}\n\n"
        + "Draft at most one post per platform this run (validate with draft_post, attach "
          "an approved asset when one fits) and at most two outreach emails to real "
          "prospects found via search_prospects. Include a scheduled_time in each "
          "social_post payload."
    )


AGENT = AgentDef(
    name="social",
    proposal_kinds=PROPOSAL_KINDS,
    build_tools=build_tools,
    build_context=build_context,
)
