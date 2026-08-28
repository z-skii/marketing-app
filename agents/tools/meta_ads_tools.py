"""Meta (Facebook/Instagram) Ads over the Graph API.

Env: META_ACCESS_TOKEN, META_AD_ACCOUNT_ID (numeric, without the act_ prefix).
The ads agent may call get-insights and pause directly; campaign creation,
budget changes, and resumes only run through approved proposals (the worker).
Budgets are integer cents, matching Meta's minor-units convention.
"""

from __future__ import annotations

import os
from typing import Any

import requests

from ..llm.grok import Tool

GRAPH = "https://graph.facebook.com/v21.0"


def _token() -> str:
    token = os.environ.get("META_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("META_ACCESS_TOKEN is not set")
    return token


def _account() -> str:
    account = os.environ.get("META_AD_ACCOUNT_ID")
    if not account:
        raise RuntimeError("META_AD_ACCOUNT_ID is not set")
    return f"act_{account.removeprefix('act_')}"


def _get(path: str, **params: Any) -> dict[str, Any]:
    response = requests.get(f"{GRAPH}/{path}",
                            params={**params, "access_token": _token()}, timeout=30)
    response.raise_for_status()
    return response.json()


def _post(path: str, **data: Any) -> dict[str, Any]:
    response = requests.post(f"{GRAPH}/{path}",
                             data={**data, "access_token": _token()}, timeout=30)
    response.raise_for_status()
    return response.json()


def meta_get_insights(date_preset: str = "last_7d") -> dict[str, Any]:
    """Campaign-level spend/clicks/impressions plus each campaign's status."""
    insights = _get(
        f"{_account()}/insights",
        level="campaign",
        date_preset=date_preset,
        fields="campaign_id,campaign_name,spend,impressions,clicks,cpc,actions",
    )
    campaigns = _get(f"{_account()}/campaigns",
                     fields="id,name,status,daily_budget,effective_status", limit=50)
    return {"insights": insights.get("data", []), "campaigns": campaigns.get("data", [])}


def meta_pause(object_id: str) -> dict[str, Any]:
    """Pause a campaign, ad set, or ad. Stops spend; safe to auto-execute."""
    _post(object_id, status="PAUSED")
    return {"id": object_id, "status": "PAUSED"}


def meta_resume(object_id: str) -> dict[str, Any]:
    _post(object_id, status="ACTIVE")
    return {"id": object_id, "status": "ACTIVE"}


def meta_update_budget(object_id: str, daily_budget_cents: int) -> dict[str, Any]:
    _post(object_id, daily_budget=int(daily_budget_cents))
    return {"id": object_id, "daily_budget_cents": int(daily_budget_cents)}


def meta_create_campaign(name: str, objective: str, daily_budget_cents: int,
                         start_paused: bool = True) -> dict[str, Any]:
    """Create a campaign (paused by default so ad sets/ads attach before spend)."""
    created = _post(
        f"{_account()}/campaigns",
        name=name,
        objective=objective,
        status="PAUSED" if start_paused else "ACTIVE",
        daily_budget=int(daily_budget_cents),
        special_ad_categories="[]",
    )
    return {"campaign_id": created.get("id"), "name": name}


def ads_read_tools() -> list[Tool]:
    return [
        Tool(
            name="meta_get_insights",
            description="Meta campaign insights (spend, clicks, impressions) and campaign statuses.",
            parameters={"type": "object", "properties": {
                "date_preset": {"type": "string",
                                "enum": ["today", "yesterday", "last_3d", "last_7d", "last_30d"]},
            }, "required": []},
            func=meta_get_insights,
        ),
    ]


def ads_pause_tool() -> Tool:
    return Tool(
        name="meta_pause_ad",
        description=("Pause a Meta campaign/adset/ad. Auto-execute ONLY when cost per signup "
                     "exceeds the cap over the last 24h or daily spend exceeds the daily cap."),
        parameters={"type": "object", "properties": {
            "object_id": {"type": "string"},
        }, "required": ["object_id"]},
        func=meta_pause,
    )
