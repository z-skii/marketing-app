"""Gmail over the REST API with an OAuth refresh token.

Env: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and
GMAIL_SENDER (the support address mail goes out as). The refresh token needs
the gmail.modify scope (read + send + mark read).
"""

from __future__ import annotations

import base64
import os
from email.message import EmailMessage
from typing import Any

import requests

from ..llm.grok import Tool

GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"
TOKEN_URL = "https://oauth2.googleapis.com/token"


def _access_token() -> str:
    client_id = os.environ.get("GMAIL_CLIENT_ID")
    client_secret = os.environ.get("GMAIL_CLIENT_SECRET")
    refresh_token = os.environ.get("GMAIL_REFRESH_TOKEN")
    if not (client_id and client_secret and refresh_token):
        raise RuntimeError("GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN are not set")
    response = requests.post(TOKEN_URL, data={
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }, timeout=30)
    response.raise_for_status()
    return response.json()["access_token"]


def _get(path: str, **params: Any) -> dict[str, Any]:
    response = requests.get(
        f"{GMAIL_API}/{path}",
        headers={"Authorization": f"Bearer {_access_token()}"},
        params=params, timeout=30,
    )
    response.raise_for_status()
    return response.json()


def _post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = requests.post(
        f"{GMAIL_API}/{path}",
        headers={"Authorization": f"Bearer {_access_token()}"},
        json=payload, timeout=30,
    )
    response.raise_for_status()
    return response.json()


def _header(message: dict[str, Any], name: str) -> str:
    for header in message.get("payload", {}).get("headers", []):
        if header["name"].lower() == name.lower():
            return header["value"]
    return ""


def _body_text(payload: dict[str, Any]) -> str:
    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode(errors="replace")
    for part in payload.get("parts", []) or []:
        text = _body_text(part)
        if text:
            return text
    return ""


def list_unread_support_emails(limit: int = 10) -> list[dict[str, Any]]:
    """Unread inbox mail, oldest first, with sender, subject, and body text."""
    listing = _get("messages", q="is:unread in:inbox", maxResults=min(int(limit), 25))
    emails = []
    for ref in listing.get("messages", []) or []:
        message = _get(f"messages/{ref['id']}", format="full")
        emails.append({
            "message_id": message["id"],
            "thread_id": message["threadId"],
            "from": _header(message, "From"),
            "subject": _header(message, "Subject"),
            "date": _header(message, "Date"),
            "body": _body_text(message.get("payload", {}))[:4000] or message.get("snippet", ""),
        })
    emails.reverse()
    return emails


def send_email(to: str, subject: str, body: str,
               reply_to_thread_id: str | None = None) -> dict[str, Any]:
    """Send plain-text mail as the support address; pass reply_to_thread_id to
    answer within an existing conversation."""
    sender = os.environ.get("GMAIL_SENDER")
    if not sender:
        raise RuntimeError("GMAIL_SENDER is not set")
    mime = EmailMessage()
    mime["To"] = to
    mime["From"] = sender
    mime["Subject"] = subject
    mime.set_content(body)
    payload: dict[str, Any] = {
        "raw": base64.urlsafe_b64encode(mime.as_bytes()).decode()
    }
    if reply_to_thread_id:
        payload["threadId"] = reply_to_thread_id
    sent = _post("messages/send", payload)
    return {"sent": True, "message_id": sent.get("id"), "to": to, "subject": subject}


def mark_read(message_id: str) -> dict[str, Any]:
    _post(f"messages/{message_id}/modify", {"removeLabelIds": ["UNREAD"]})
    return {"message_id": message_id, "marked_read": True}


def gmail_tools() -> list[Tool]:
    return [
        Tool(
            name="list_unread_support_emails",
            description="Unread support inbox mail with sender, subject, and body text.",
            parameters={"type": "object", "properties": {
                "limit": {"type": "integer", "minimum": 1, "maximum": 25},
            }, "required": []},
            func=list_unread_support_emails,
        ),
        Tool(
            name="send_email",
            description=(
                "Send a plain-text email as the Tapmart support address. Auto-execute is "
                "allowed for support replies and onboarding only."
            ),
            parameters={"type": "object", "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
                "reply_to_thread_id": {"type": "string",
                                       "description": "Gmail thread id when replying."},
            }, "required": ["to", "subject", "body"]},
            func=send_email,
        ),
        Tool(
            name="mark_read",
            description="Mark a support email read once it has been handled.",
            parameters={"type": "object", "properties": {
                "message_id": {"type": "string"},
            }, "required": ["message_id"]},
            func=mark_read,
        ),
    ]
