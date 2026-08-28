"""Social posting (X, Threads), prospect search, and asset lookup.

Posting is propose-first: the social agent drafts, the owner approves, the
worker calls post_to_x / post_to_threads. When the owner flips
social_auto_post_threads to true in agent_config (spec: after two weeks of
clean approvals), the agent gets post_to_threads as a direct tool.

Env: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET (OAuth 1.0a
user context for POST /2/tweets); THREADS_ACCESS_TOKEN, THREADS_USER_ID.
"""

from __future__ import annotations

import os
import time
from typing import Any

import requests

from .. import db
from ..llm.grok import Tool

X_MAX = 280
THREADS_MAX = 500


# ---------------------------------------------------------------- posting


def post_to_x(text: str) -> dict[str, Any]:
    from requests_oauthlib import OAuth1

    keys = [os.environ.get(k) for k in
            ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET")]
    if not all(keys):
        raise RuntimeError("X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET are not set")
    if len(text) > X_MAX:
        raise ValueError(f"text is {len(text)} chars; X allows {X_MAX}")
    response = requests.post(
        "https://api.x.com/2/tweets",
        auth=OAuth1(*keys),
        json={"text": text},
        timeout=30,
    )
    response.raise_for_status()
    return {"posted": True, "platform": "x", "id": response.json().get("data", {}).get("id")}


def post_to_threads(text: str, image_url: str | None = None) -> dict[str, Any]:
    token = os.environ.get("THREADS_ACCESS_TOKEN")
    user_id = os.environ.get("THREADS_USER_ID")
    if not (token and user_id):
        raise RuntimeError("THREADS_ACCESS_TOKEN / THREADS_USER_ID are not set")
    if len(text) > THREADS_MAX:
        raise ValueError(f"text is {len(text)} chars; Threads allows {THREADS_MAX}")

    params: dict[str, Any] = {"text": text, "access_token": token}
    if image_url:
        params |= {"media_type": "IMAGE", "image_url": image_url}
    else:
        params["media_type"] = "TEXT"
    creation = requests.post(f"https://graph.threads.net/v1.0/{user_id}/threads",
                             params=params, timeout=30)
    creation.raise_for_status()
    container_id = creation.json()["id"]
    time.sleep(2)  # Threads asks for a moment between create and publish
    publish = requests.post(
        f"https://graph.threads.net/v1.0/{user_id}/threads_publish",
        params={"creation_id": container_id, "access_token": token}, timeout=30,
    )
    publish.raise_for_status()
    return {"posted": True, "platform": "threads", "id": publish.json().get("id")}


def post(platform: str, text: str, asset_url: str | None = None) -> dict[str, Any]:
    """Worker dispatch for approved social_post proposals."""
    if platform == "x":
        return post_to_x(text)
    if platform == "threads":
        return post_to_threads(text, image_url=asset_url)
    raise ValueError(f"unknown platform {platform!r}")


# ---------------------------------------------------------------- reads


def get_approved_assets(limit: int = 10) -> list[dict[str, Any]]:
    """Creative assets from approved/executed creative_batch proposals."""
    rows = db.query(
        """select id, title, assets, created_at from agent_proposals
            where agent = 'creative' and kind = 'creative_batch'
              and status in ('approved','executed') and assets is not null
            order by created_at desc limit %s""",
        (min(int(limit), 25),),
    )
    return [
        {"proposal_id": str(r["id"]), "title": r["title"],
         "assets": r["assets"], "created_at": r["created_at"]}
        for r in rows
    ]


def draft_post(platform: str, text: str) -> dict[str, Any]:
    """Validate a draft against the platform's limits before proposing it."""
    limit = X_MAX if platform == "x" else THREADS_MAX
    return {
        "platform": platform,
        "text": text,
        "chars": len(text),
        "limit": limit,
        "ok": len(text) <= limit,
    }


def search_prospects(query: str) -> dict[str, Any]:
    """Web search via Grok's server-side live search: creators, small
    businesses, and app makers who want traffic to a link."""
    from .. import config as agent_config
    from ..llm.grok import make_client

    client = make_client()
    response = client.chat.completions.create(
        model=agent_config.model_for("social"),
        messages=[
            {"role": "system",
             "content": ("Search the live web and return up to 5 concrete prospects as a JSON list "
                         "of {name, url_or_handle, why_fit, contact_hint}. Prospects are creators, "
                         "small businesses, and app makers who want traffic to a link. "
                         "Only real, verifiable entries — no invented contacts.")},
            {"role": "user", "content": query},
        ],
        extra_body={"search_parameters": {"mode": "on", "max_search_results": 10}},
    )
    return {"results": response.choices[0].message.content}


def social_read_tools() -> list[Tool]:
    return [
        Tool(
            name="get_approved_assets",
            description="Owner-approved creative assets available for posts.",
            parameters={"type": "object", "properties": {
                "limit": {"type": "integer", "minimum": 1, "maximum": 25},
            }, "required": []},
            func=get_approved_assets,
        ),
        Tool(
            name="draft_post",
            description="Check a draft against the platform character limit before proposing it.",
            parameters={"type": "object", "properties": {
                "platform": {"type": "string", "enum": ["x", "threads"]},
                "text": {"type": "string"},
            }, "required": ["platform", "text"]},
            func=draft_post,
        ),
        Tool(
            name="search_prospects",
            description=("Live web search for outreach prospects (creators, small businesses, "
                         "app makers who want traffic to a link)."),
            parameters={"type": "object", "properties": {
                "query": {"type": "string"},
            }, "required": ["query"]},
            func=search_prospects,
        ),
    ]


def threads_post_tool() -> Tool:
    return Tool(
        name="post_to_threads",
        description="Post to Threads immediately (auto-execute enabled by the owner).",
        parameters={"type": "object", "properties": {
            "text": {"type": "string"},
            "image_url": {"type": "string"},
        }, "required": ["text"]},
        func=post_to_threads,
    )
