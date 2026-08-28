"""Higgsfield generation + Supabase storage upload for the creative agent.

Generation is auto-execute but costs Higgsfield credits, so the daily cap
(higgsfield_daily_cap_credits) is enforced HERE by counting today's
generation actions in agent_actions — the model cannot exceed it.

Env: HIGGSFIELD_API_KEY (and HIGGSFIELD_API_SECRET if the account uses key +
secret auth), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. The endpoint paths
below follow the Higgsfield platform API; if the account is on a different
API version, adjust the constants — nothing else references them.
"""

from __future__ import annotations

import os
import time
import uuid
from typing import Any

import requests

from .. import config, db
from ..llm.grok import Tool

HIGGSFIELD_BASE = os.environ.get("HIGGSFIELD_API_BASE", "https://platform.higgsfield.ai")
TEXT2IMAGE_PATH = "/v1/text2image/soul"
TEXT2VIDEO_PATH = "/v1/text2video"
JOB_SET_PATH = "/v1/job-sets/{id}"
POLL_SECONDS = 5
POLL_TIMEOUT = 420

IMAGE_CREDITS = 1
VIDEO_CREDITS = 5

ASSETS_BUCKET = os.environ.get("AGENT_ASSETS_BUCKET", "agent-assets")


def _headers() -> dict[str, str]:
    key = os.environ.get("HIGGSFIELD_API_KEY")
    if not key:
        raise RuntimeError("HIGGSFIELD_API_KEY is not set")
    headers = {"hf-api-key": key, "Content-Type": "application/json"}
    secret = os.environ.get("HIGGSFIELD_API_SECRET")
    if secret:
        headers["hf-secret"] = secret
    return headers


def credits_spent_today() -> int:
    row = db.query_one(
        """select
             count(*) filter (where tool = 'generate_image')::int as images,
             count(*) filter (where tool = 'generate_video')::int as videos
           from agent_actions
          where created_at >= date_trunc('day', now())
            and tool in ('generate_image','generate_video')
            and (result ->> 'error') is null"""
    )
    return (row["images"] * IMAGE_CREDITS + row["videos"] * VIDEO_CREDITS) if row else 0


def _check_cap(cost: int) -> None:
    cap = int(config.get_float("higgsfield_daily_cap_credits"))
    spent = credits_spent_today()
    if spent + cost > cap:
        raise RuntimeError(
            f"daily Higgsfield credit cap reached ({spent}/{cap} spent, this would cost {cost}). "
            "Try again tomorrow or ask the owner to raise higgsfield_daily_cap_credits."
        )


def _run_job(path: str, params: dict[str, Any]) -> str:
    """Submit a generation job and poll until it yields a result URL."""
    response = requests.post(f"{HIGGSFIELD_BASE}{path}", headers=_headers(),
                             json={"params": params}, timeout=60)
    response.raise_for_status()
    job_set_id = response.json().get("id")

    deadline = time.monotonic() + POLL_TIMEOUT
    while time.monotonic() < deadline:
        status = requests.get(
            f"{HIGGSFIELD_BASE}{JOB_SET_PATH.format(id=job_set_id)}",
            headers=_headers(), timeout=30,
        )
        status.raise_for_status()
        for job in status.json().get("jobs", []):
            if job.get("status") == "failed":
                raise RuntimeError(f"generation job failed: {job}")
            results = job.get("results") or {}
            url = (results.get("raw") or {}).get("url") or results.get("url")
            if job.get("status") == "completed" and url:
                return url
        time.sleep(POLL_SECONDS)
    raise RuntimeError(f"generation timed out after {POLL_TIMEOUT}s (job set {job_set_id})")


def generate_image(prompt: str, aspect_ratio: str = "1:1") -> dict[str, Any]:
    """Generate one image and store it in Supabase storage. Costs 1 credit."""
    _check_cap(IMAGE_CREDITS)
    source_url = _run_job(TEXT2IMAGE_PATH, {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "quality": "1080p",
        "batch_size": 1,
    })
    return {"asset_url": upload_asset(source_url, "png")["asset_url"], "prompt": prompt}


def generate_video(prompt: str, aspect_ratio: str = "9:16",
                   duration_seconds: int = 5) -> dict[str, Any]:
    """Generate one short video and store it in Supabase storage. Costs 5 credits."""
    _check_cap(VIDEO_CREDITS)
    source_url = _run_job(TEXT2VIDEO_PATH, {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "duration": int(duration_seconds),
    })
    return {"asset_url": upload_asset(source_url, "mp4")["asset_url"], "prompt": prompt}


# ---------------------------------------------------------- storage


def _supabase() -> tuple[str, str]:
    url = (os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set")
    return url, key


def ensure_bucket() -> None:
    url, key = _supabase()
    response = requests.post(
        f"{url}/storage/v1/bucket",
        headers={"Authorization": f"Bearer {key}"},
        json={"id": ASSETS_BUCKET, "name": ASSETS_BUCKET, "public": True},
        timeout=30,
    )
    # 400/409 = already exists; anything else is a real failure.
    if response.status_code not in (200, 201, 400, 409):
        response.raise_for_status()


def upload_asset(source_url: str, extension: str) -> dict[str, Any]:
    """Copy a generated asset from its temporary URL into the public
    agent-assets bucket; returns the permanent public URL."""
    url, key = _supabase()
    ensure_bucket()
    asset = requests.get(source_url, timeout=120)
    asset.raise_for_status()
    path = f"{time.strftime('%Y-%m-%d')}/{uuid.uuid4().hex}.{extension}"
    content_type = "video/mp4" if extension == "mp4" else f"image/{extension}"
    response = requests.post(
        f"{url}/storage/v1/object/{ASSETS_BUCKET}/{path}",
        headers={"Authorization": f"Bearer {key}", "Content-Type": content_type},
        data=asset.content, timeout=120,
    )
    response.raise_for_status()
    return {"asset_url": f"{url}/storage/v1/object/public/{ASSETS_BUCKET}/{path}"}


def creative_tools() -> list[Tool]:
    return [
        Tool(
            name="generate_image",
            description=("Generate one image with Higgsfield and store it permanently. "
                         "Costs 1 credit against the daily cap."),
            parameters={"type": "object", "properties": {
                "prompt": {"type": "string"},
                "aspect_ratio": {"type": "string", "enum": ["1:1", "9:16", "16:9", "4:5"]},
            }, "required": ["prompt"]},
            func=generate_image,
        ),
        Tool(
            name="generate_video",
            description=("Generate one short video with Higgsfield and store it permanently. "
                         "Costs 5 credits against the daily cap."),
            parameters={"type": "object", "properties": {
                "prompt": {"type": "string"},
                "aspect_ratio": {"type": "string", "enum": ["9:16", "16:9", "1:1"]},
                "duration_seconds": {"type": "integer", "minimum": 3, "maximum": 10},
            }, "required": ["prompt"]},
            func=generate_video,
        ),
    ]
