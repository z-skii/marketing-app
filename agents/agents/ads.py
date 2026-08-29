"""Ads agent — every 6 hours.

Reads Meta/TikTok insights and Tapmart signup metrics to compute cost per
signup. Pausing over-cap spend is auto-execute (it stops money leaving);
campaigns, budget changes, and resumes are proposals, and campaigns require
an owner-approved creative batch to exist first.
"""

from __future__ import annotations

from datetime import datetime, timezone

from .. import config
from ..llm.grok import Tool
from ..tools import meta_ads_tools, social_tools, supabase_tools, tiktok_ads_tools
from ..tools.proposal_tools import make_create_proposal_tool, owner_feedback_context
from . import AgentDef, RunContext

PROPOSAL_KINDS = ["ad_campaign", "budget_change", "resume_ad", "creative_request"]


def build_tools(ctx: RunContext) -> list[Tool]:
    metrics = [t for t in supabase_tools.ops_read_tools() if t.name == "get_metrics"]
    assets = [t for t in social_tools.social_read_tools() if t.name == "get_approved_assets"]
    return (
        meta_ads_tools.ads_read_tools()
        + tiktok_ads_tools.tiktok_read_tools()
        + metrics + assets
        + [meta_ads_tools.ads_pause_tool(), tiktok_ads_tools.tiktok_pause_tool(),
           make_create_proposal_tool(ctx.agent, ctx.run_id, PROPOSAL_KINDS)]
    )


def build_context(ctx: RunContext) -> str:
    now = datetime.now(timezone.utc)
    return (
        f"Time now: {now:%Y-%m-%d %H:%M} UTC.\n"
        f"Caps: max cost per signup ${config.get_float('max_cost_per_signup_usd'):.2f} "
        f"over the last 24h; daily ad spend cap ${config.get_float('ads_daily_cap_usd'):.2f}.\n\n"
        f"{owner_feedback_context(ctx.agent)}\n\n"
        "Compute cost per signup from ad spend and get_metrics signups. Pause anything "
        "over cap and say so. Only propose an ad_campaign if get_approved_assets returns "
        "at least one approved batch; otherwise file a creative_request proposal instead."
    )


AGENT = AgentDef(
    name="ads",
    proposal_kinds=PROPOSAL_KINDS,
    build_tools=build_tools,
    build_context=build_context,
)
