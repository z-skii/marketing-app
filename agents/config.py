"""Agent configuration.

Model names, schedules, and spending caps live in the agent_config table so
the owner can retune them from SQL (or a future settings UI) without a deploy.
This module is the only place that reads them; agent code asks for typed
values and never hardcodes a cap or a model name.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from . import db

XAI_BASE_URL = "https://api.x.ai/v1"
DEFAULT_MODEL = "grok-4"
MAX_TOOL_CALLS_PER_RUN = 15

AGENT_NAMES = ["ops", "admin", "creative", "ads", "social"]

_DEFAULTS: dict[str, Any] = {
    "refund_auto_cap_usd": 10,
    "ads_daily_cap_usd": 20,
    "max_cost_per_signup_usd": 2.00,
    "higgsfield_daily_cap_credits": 20,
    "models": {name: DEFAULT_MODEL for name in AGENT_NAMES},
    "schedules": {
        "ops": {"every_minutes": 60},
        "admin": {"every_minutes": 15},
        "creative": {"at": ["07:00"], "tz": "America/New_York"},
        "ads": {"every_minutes": 360},
        "social": {"at": ["09:00", "13:00", "19:00"], "tz": "America/New_York"},
        "worker": {"every_minutes": 5},
    },
    "ops_brief_hour_local": 8,
    "ops_brief_tz": "America/New_York",
}


def get(key: str) -> Any:
    row = db.query_one("select value from agent_config where key = %s", (key,))
    if row is None:
        return _DEFAULTS.get(key)
    value = row["value"]
    if isinstance(value, str):
        try:
            return json.loads(value)
        except ValueError:
            return value
    return value


def get_float(key: str) -> float:
    return float(get(key))


def model_for(agent: str) -> str:
    models = get("models") or {}
    return models.get(agent, DEFAULT_MODEL)


def schedule_for(name: str) -> dict[str, Any]:
    schedules = get("schedules") or {}
    return schedules.get(name, _DEFAULTS["schedules"].get(name, {"every_minutes": 60}))


def is_due(name: str, last_started_at: datetime | None, now: datetime | None = None) -> bool:
    """Whether an agent's next run is due, given when its last run started.

    Two schedule shapes:
      {"every_minutes": N}                      — fixed interval
      {"at": ["07:00", ...], "tz": "..."}       — fire once per listed local time
    """
    now = now or datetime.now(timezone.utc)
    sched = schedule_for(name)

    if "every_minutes" in sched:
        if last_started_at is None:
            return True
        return now - last_started_at >= timedelta(minutes=int(sched["every_minutes"]) - 1)

    tz = ZoneInfo(sched.get("tz", "UTC"))
    local_now = now.astimezone(tz)
    for hhmm in sched.get("at", []):
        hour, minute = (int(part) for part in hhmm.split(":"))
        slot = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        # Due if a slot has passed today and no run has started since it.
        if slot <= local_now and (last_started_at is None or last_started_at < slot):
            return True
    return False


def is_brief_run(now: datetime | None = None) -> bool:
    """Whether an ops run happening now should write the daily brief."""
    now = now or datetime.now(timezone.utc)
    tz = ZoneInfo(str(get("ops_brief_tz") or "America/New_York"))
    return now.astimezone(tz).hour == int(get("ops_brief_hour_local") or 8)
