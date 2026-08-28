"""Postgres access for the agent service.

The agents talk to the same Supabase Postgres as the app, over the pooled
connection string (AGENTS_DATABASE_URL, falling back to DATABASE_URL). The
connection authenticates as the database owner, so RLS does not apply here;
RLS confines the browser-facing paths instead.
"""

from __future__ import annotations

import json
import os
import re
from contextlib import contextmanager
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row

_conn: psycopg.Connection | None = None


def _sanitize_url(url: str) -> str:
    """Make a pasted connection string acceptable to libpq: drop Prisma's
    ?pgbouncer=true parameter and percent-encode characters (spaces above
    all) inside the password, which Node's driver tolerates raw but psycopg
    rejects."""
    from urllib.parse import quote

    url = re.sub(r"pgbouncer=[^&]*&?", "", url).rstrip("?&")
    scheme, sep, remainder = url.partition("://")
    if sep and "@" in remainder:
        userinfo, _, hostpart = remainder.rpartition("@")
        user, colon, password = userinfo.partition(":")
        if colon:
            # safe="%" keeps already-encoded sequences intact.
            userinfo = f"{user}:{quote(password, safe='%')}"
        return f"{scheme}://{userinfo}@{hostpart}"
    return url


def _derive_pooler_url(url: str) -> str | None:
    """Supabase's direct db.<ref>.supabase.co host is IPv6-only, so a pasted
    direct connection string is unreachable from IPv4-only runners. Derive
    the equivalent pooler URL (postgres.<ref> user, IPv4 pooler host) as a
    fallback candidate. Override the host with SUPABASE_POOLER_HOST if the
    project ever leaves us-east-1."""
    match = re.match(
        r"(?P<scheme>[^:]+)://(?P<user>[^:@]+):(?P<password>.*)"
        r"@db\.(?P<ref>[a-z0-9]+)\.supabase\.co(?::\d+)?(?P<rest>/.*)?$",
        url,
    )
    if not match:
        return None
    host = os.environ.get("SUPABASE_POOLER_HOST", "aws-0-us-east-1.pooler.supabase.com")
    return (
        f"{match['scheme']}://{match['user']}.{match['ref']}:{match['password']}"
        f"@{host}:5432{match['rest'] or '/postgres'}"
    )


def _qualify_pooler_user(url: str) -> str | None:
    """The pooler routes by project: its username must be postgres.<ref>.
    A pooler URL pasted with a bare 'postgres' user gets the ref appended
    (this project's by default; override with SUPABASE_PROJECT_REF)."""
    match = re.match(
        r"(?P<scheme>[^:]+)://postgres:(?P<after>.*@[^@]*\.pooler\.supabase\.com[:/].*)$", url
    )
    if not match:
        return None
    ref = os.environ.get("SUPABASE_PROJECT_REF", "mzqlmhuzbtcotmorgadf")
    return f"{match['scheme']}://postgres.{ref}:{match['after']}"


def _candidate_urls() -> list[str]:
    urls = []
    for var in ("AGENTS_DATABASE_URL", "DATABASE_URL", "DIRECT_URL"):
        url = os.environ.get(var)
        if url and url not in urls:
            urls.append(url)
    for url in list(urls):
        for derived in (_derive_pooler_url(url), _qualify_pooler_user(url)):
            if derived and derived not in urls:
                urls.append(derived)
    return urls


def connection() -> psycopg.Connection:
    global _conn
    if _conn is None or _conn.closed:
        urls = _candidate_urls()
        if not urls:
            raise RuntimeError(
                "AGENTS_DATABASE_URL (or DATABASE_URL) is not set. Point it at the "
                "Supabase connection pooler, or a local Postgres for development."
            )
        # The first URL that actually connects wins: Supabase's direct
        # db.<ref> host is IPv6-only and unreachable from IPv4-only runners,
        # so a stale direct URL falls through to a pooler URL.
        last_error: Exception | None = None
        for url in urls:
            url = _sanitize_url(url)
            try:
                _conn = psycopg.connect(
                    url, row_factory=dict_row, autocommit=True, connect_timeout=10
                )
                break
            except psycopg.OperationalError as exc:
                last_error = exc
        else:
            raise last_error  # every candidate failed; surface the last error
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
