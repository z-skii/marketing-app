"""Postgres access for the agent service.

The agents talk to the same Supabase Postgres as the app, over the pooled
connection string (AGENTS_DATABASE_URL, falling back to DATABASE_URL). The
connection authenticates as the database owner, so RLS does not apply here;
RLS confines the browser-facing paths instead.
"""

from __future__ import annotations

import json
import os
from contextlib import contextmanager
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row

_conn: psycopg.Connection | None = None


def connection() -> psycopg.Connection:
    global _conn
    if _conn is None or _conn.closed:
        url = os.environ.get("AGENTS_DATABASE_URL") or os.environ.get("DATABASE_URL")
        if not url:
            raise RuntimeError(
                "AGENTS_DATABASE_URL (or DATABASE_URL) is not set. Point it at the "
                "Supabase connection pooler, or a local Postgres for development."
            )
        _conn = psycopg.connect(url, row_factory=dict_row, autocommit=True)
        # Supabase's transaction pooler (PgBouncer) doesn't support server-side
        # prepared statements; disabling them keeps either pooler mode safe.
        _conn.prepare_threshold = None
    return _conn


def query(sql: str, params: tuple | list = ()) -> list[dict[str, Any]]:
    with connection().cursor() as cur:
        cur.execute(sql, params)
        if cur.description is None:
            return []
        return cur.fetchall()


def query_one(sql: str, params: tuple | list = ()) -> dict[str, Any] | None:
    rows = query(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple | list = ()) -> None:
    with connection().cursor() as cur:
        cur.execute(sql, params)


@contextmanager
def transaction() -> Iterator[psycopg.Cursor]:
    conn = connection()
    with conn.transaction():
        with conn.cursor() as cur:
            yield cur


def jsonb(value: Any) -> str:
    """Serialize a Python value for a jsonb parameter."""
    return json.dumps(value, default=str)
