"""TikTok Ads over the Business API.

Env: TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID. Same posture as Meta: the
agent reads and pauses; creation, budgets, and resumes go through proposals.
TikTok budgets are in whole currency units, so these helpers convert from the
integer cents used everywhere else in this codebase.
"""

from __future__ import annotations

import os
from typing import Any

import requests

from ..llm.grok import Tool

BASE = "https://business-api.tiktok.com/open_api/v1.3"


def _headers() -> dict[str, str]:
    token = os.environ.get("TIKTOK_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("TIKTOK_ACCESS_TOKEN is not set")
    return {"Access-Token": token}


def _advertiser() -> str:
    advertiser = os.environ.get("TIKTOK_ADVERTISER_ID")
    if not advertiser:
        raise RuntimeError("TIKTOK_ADVERTISER_ID is not set")
    return advertiser


def _call(method: str, path: str, payload: dict[str, Any]) -> dict[str, Any]:
    if method == "GET":
        response = requests.get(f"{BASE}{path}", headers=_headers(), params=payload, timeout=30)
    else:
        response = requests.post(f"{BASE}{path}", headers=_headers(), json=payload, timeout=30)
    response.raise_for_status()
    body = response.json()
    if body.get("code") not in (0, None):
        raise RuntimeError(f"TikTok API error {body.get('code')}: {body.get('message')}")
    return body.get("data", {})


def tiktok_get_insights(days: int = 7) -> dict[str, Any]:
    import json as _json
    from datetime import date, timedelta

    end = date.today()
    start = end - timedelta(days=max(1, min(int(days), 30)))
    data = _call("GET", "/report/integrated/get/", {
        "advertiser_id": _advertiser(),
        "report_type": "BASIC",
        "data_level": "AUCTION_CAMPAIGN",
        "dimensions": _json.dumps(["campaign_id"]),
        "metrics": _json.dumps(["spend", "impressions", "clicks", "cpc", "campaign_name"]),
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "page_size": 50,
    })
    return {"rows": data.get("list", [])}


def tiktok_pause(campaign_id: str) -> dict[str, Any]:
    _call("POST", "/campaign/status/update/", {
        "advertiser_id": _advertiser(),
        "campaign_ids": [campaign_id],
        "operation_status": "DISABLE",
    })
    return {"campaign_id": campaign_id, "status": "DISABLE"}


def tiktok_resume(campaign_id: str) -> dict[str, Any]:
    _call("POST", "/campaign/status/update/", {
        "advertiser_id": _advertiser(),
        "campaign_ids": [campaign_id],
        "operation_status": "ENABLE",
    })
    return {"campaign_id": campaign_id, "status": "ENABLE"}


def tiktok_update_budget(campaign_id: str, daily_budget_cents: int) -> dict[str, Any]:
    _call("POST", "/campaign/update/", {
        "advertiser_id": _advertiser(),
        "campaign_id": campaign_id,
        "budget": int(daily_budget_cents) / 100,
    })
    return {"campaign_id": campaign_id, "daily_budget_cents": int(daily_budget_cents)}


def tiktok_create_campaign(name: str, objective: str,
                           daily_budget_cents: int) -> dict[str, Any]:
    data = _call("POST", "/campaign/create/", {
        "advertiser_id": _advertiser(),
        "campaign_name": name,
        "objective_type": objective,
        "budget_mode": "BUDGET_MODE_DAY",
        "budget": int(daily_budget_cents) / 100,
        "operation_status": "DISABLE",  # created paused; attach ads before spend
    })
    return {"campaign_id": data.get("campaign_id"), "name": name}


def tiktok_read_tools() -> list[Tool]:
    return [
        Tool(
            name="tiktok_get_insights",
            description="TikTok campaign spend/clicks/impressions for the last N days.",
            parameters={"type": "object", "properties": {
                "days": {"type": "integer", "minimum": 1, "maximum": 30},
            }, "required": []},
            func=tiktok_get_insights,
        ),
    ]


def tiktok_pause_tool() -> Tool:
    return Tool(
        name="tiktok_pause_ad",
        description=("Pause a TikTok campaign. Auto-execute ONLY when cost per signup exceeds "
                     "the cap over the last 24h or daily spend exceeds the daily cap."),
        parameters={"type": "object", "properties": {
            "campaign_id": {"type": "string"},
        }, "required": ["campaign_id"]},
        func=tiktok_pause,
    )
