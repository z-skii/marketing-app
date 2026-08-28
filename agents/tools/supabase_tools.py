"""Read tools over the Tapmart database, plus the config/link writes the
worker uses when a price_change / reset_time_change / flag_link proposal is
approved. Money stays in integer cents end to end.
"""

from __future__ import annotations

from typing import Any

from .. import db
from ..llm.grok import Tool

_RANGES = {"1h": "1 hour", "24h": "24 hours", "48h": "48 hours", "7d": "7 days", "30d": "30 days"}


def _interval(range_: str) -> str:
    return _RANGES.get(range_, "24 hours")


# ---------------------------------------------------------------- reads


def get_board_snapshot() -> dict[str, Any]:
    """Current board ranking, live spot, bar occupancy, and pricing settings."""
    board = db.query(
        """select rank, display_name, domain, score_cents_today, opens_today,
                  remaining_cents, spent_cents, total_opens
             from public_board order by rank limit 25"""
    )
    spot = db.query_one(
        """select l.display_name, l.domain, s.starts_at, s.ends_at
             from spot_schedules s
             join placements p on p.id = s.placement_id
             join links l on l.id = p.link_id
            where s.starts_at <= now() and s.ends_at > now() and s.status <> 'cancelled'
            order by s.starts_at desc limit 1"""
    )
    bar = db.query_one("select count(*)::int as n from bar_queue")
    settings = db.query(
        """select key, value #>> '{}' as value from app_settings
            where key in ('board_click_price_cents','spot_click_price_cents','bar_click_price_cents',
                          'creator_commission_cents','board_reset_utc_hour','minimum_topup_cents',
                          'spot_appearances_per_day','spot_appearance_seconds')"""
    )
    return {
        "board": board,
        "live_spot": spot,
        "bar_size": bar["n"] if bar else 0,
        "settings": {row["key"]: row["value"] for row in settings},
    }


def get_metrics(range: str = "24h") -> dict[str, Any]:
    """Traffic, money, and signup metrics over a range (1h/24h/48h/7d/30d)."""
    interval = _interval(range)
    row = db.query_one(
        f"""select
          (select count(*) from click_events
            where qualified and created_at >= now() - interval '{interval}')      as qualified_clicks,
          (select count(*) from click_events
            where not qualified and created_at >= now() - interval '{interval}')  as rejected_clicks,
          (select coalesce(sum(debit_cents),0) from click_events
            where created_at >= now() - interval '{interval}')                    as click_revenue_cents,
          (select count(*) from profiles
            where created_at >= now() - interval '{interval}')                    as signups,
          (select count(*) from links
            where created_at >= now() - interval '{interval}')                    as new_links,
          (select coalesce(sum(amount_cents),0) from stripe_payments
            where status = 'succeeded'
              and created_at >= now() - interval '{interval}')                    as topups_cents,
          (select count(distinct anonymous_visitor_id) from click_events
            where created_at >= now() - interval '{interval}')                    as unique_clickers,
          (select count(*) from visitors
            where last_seen >= now() - interval '{interval}')                     as visitors_seen,
          (select count(*) from placements where status = 'active')               as active_placements,
          (select count(*) from placements
            where status = 'exhausted'
              and exhausted_at >= now() - interval '{interval}')                  as newly_exhausted"""
    )
    rejections = db.query(
        f"""select coalesce(rejection_reason,'unknown') as reason, count(*)::int as n
              from click_events
             where not qualified and created_at >= now() - interval '{interval}'
             group by 1 order by 2 desc limit 8"""
    )
    return {"range": range, **(row or {}), "rejection_breakdown": rejections}


def get_recent_signups(limit: int = 20) -> list[dict[str, Any]]:
    """Latest accounts with their links, credit, and top-up totals."""
    return db.query(
        """select p.member_no, p.username, p.created_at,
                  (select count(*) from links l where l.owner_id = p.id) as links,
                  coalesce(w.available_credit_cents, 0) as available_credit_cents,
                  coalesce((select sum(sp.amount_cents) from stripe_payments sp
                             where sp.user_id = p.id and sp.status = 'succeeded'), 0) as topup_cents
             from profiles p
             left join wallets w on w.user_id = p.id
            order by p.created_at desc limit %s""",
        (min(int(limit), 100),),
    )


def get_stripe_payments(range: str = "7d") -> list[dict[str, Any]]:
    """Stripe top-ups over a range, newest first."""
    return db.query(
        f"""select sp.amount_cents, sp.status::text, sp.created_at, p.member_no
              from stripe_payments sp
              join profiles p on p.id = sp.user_id
             where sp.created_at >= now() - interval '{_interval(range)}'
             order by sp.created_at desc limit 50"""
    )


def detect_click_anomalies() -> dict[str, Any]:
    """Click-spam signals from the last 24h: hot visitors, hot IPs, and links
    with unusual rejection ratios."""
    hot_visitors = db.query(
        """select anonymous_visitor_id, count(*)::int as clicks,
                  count(*) filter (where not qualified)::int as rejected,
                  count(distinct link_id)::int as links_hit
             from click_events
            where created_at >= now() - interval '24 hours'
            group by 1 having count(*) >= 20
            order by 2 desc limit 10"""
    )
    hot_ips = db.query(
        """select ip_hash, count(*)::int as clicks,
                  count(distinct anonymous_visitor_id)::int as visitors
             from click_events
            where created_at >= now() - interval '24 hours' and ip_hash is not null
            group by 1 having count(*) >= 30
            order by 2 desc limit 10"""
    )
    suspect_links = db.query(
        """select l.slug, l.display_name, l.domain,
                  count(*)::int as clicks,
                  count(*) filter (where not qualified)::int as rejected
             from click_events c join links l on l.id = c.link_id
            where c.created_at >= now() - interval '24 hours'
            group by l.id
           having count(*) >= 30
              and count(*) filter (where not qualified) > count(*) / 2
            order by rejected desc limit 10"""
    )
    return {"hot_visitors": hot_visitors, "hot_ips": hot_ips, "suspect_links": suspect_links}


# ------------------------------------------------- worker write paths

PRICE_KEYS = {
    "board_click_price_cents", "spot_click_price_cents", "bar_click_price_cents",
    "creator_commission_cents", "minimum_topup_cents",
}


def apply_price_change(changes: dict[str, int]) -> dict[str, Any]:
    """Executed by the worker for an approved price_change proposal."""
    applied = {}
    for key, value in changes.items():
        if key not in PRICE_KEYS:
            raise ValueError(f"{key} is not a price setting")
        cents = int(value)
        if not 1 <= cents <= 100_000:
            raise ValueError(f"{key}={cents} is out of range")
        db.execute(
            """insert into app_settings (key, value) values (%s, to_jsonb(%s::bigint))
               on conflict (key) do update set value = excluded.value, updated_at = now()""",
            (key, cents),
        )
        applied[key] = cents
    return {"applied": applied}


def apply_reset_time_change(board_reset_utc_hour: int) -> dict[str, Any]:
    hour = int(board_reset_utc_hour)
    if not 0 <= hour <= 23:
        raise ValueError("board_reset_utc_hour must be 0–23")
    db.execute(
        """insert into app_settings (key, value) values ('board_reset_utc_hour', to_jsonb(%s::bigint))
           on conflict (key) do update set value = excluded.value, updated_at = now()""",
        (hour,),
    )
    return {"board_reset_utc_hour": hour}


def flag_link(slug: str, reason: str) -> dict[str, Any]:
    """Suspend a link pending human review (suspected click spam). Reversible
    from the moderation queue."""
    row = db.query_one(
        """update links
              set moderation_status = 'suspended',
                  moderation_note = %s,
                  updated_at = now()
            where slug = %s
            returning id, slug, display_name""",
        (f"[agent] {reason}"[:500], slug),
    )
    if row is None:
        raise ValueError(f"no link with slug {slug!r}")
    return {"flagged": row}


def ban_link(slug: str, reason: str, block_domain: bool = False) -> dict[str, Any]:
    """Executed by the worker for an approved ban proposal: suspend and
    disable the link, optionally block its domain for future submissions."""
    row = db.query_one(
        """update links
              set moderation_status = 'suspended', enabled = false,
                  moderation_note = %s, updated_at = now()
            where slug = %s
            returning id, slug, display_name, domain""",
        (f"[ban] {reason}"[:500], slug),
    )
    if row is None:
        raise ValueError(f"no link with slug {slug!r}")
    if block_domain:
        db.execute(
            """insert into blocked_domains (domain, reason) values (%s, %s)
               on conflict (domain) do nothing""",
            (row["domain"], reason[:500]),
        )
    return {"banned": row, "domain_blocked": bool(block_domain)}


# ------------------------------------------------- admin agent reads


def get_user(member_no: int | None = None, email: str | None = None,
             username: str | None = None) -> dict[str, Any]:
    """Look up one account by member number, email, or username."""
    row = db.query_one(
        """select p.id, p.member_no, p.username, p.display_name, p.role::text,
                  p.suspended, p.created_at, u.email,
                  coalesce(w.available_credit_cents, 0) as available_credit_cents
             from profiles p
             join auth.users u on u.id = p.id
             left join wallets w on w.user_id = p.id
            where (%s::bigint is not null and p.member_no = %s)
               or (%s::text is not null and lower(u.email) = lower(%s))
               or (%s::text is not null and lower(p.username) = lower(%s))
            limit 1""",
        (member_no, member_no, email, email, username, username),
    )
    if row is None:
        return {"found": False}
    user_id = row.pop("id")
    ledger = db.query(
        """select transaction_type::text, amount_cents, reason, created_at
             from credit_ledger where user_id = %s
            order by created_at desc limit 10""",
        (user_id,),
    )
    return {"found": True, **row, "recent_ledger": ledger}


def get_user_links(member_no: int) -> list[dict[str, Any]]:
    return db.query(
        """select l.slug, l.display_name, l.domain, l.moderation_status::text,
                  l.enabled, l.total_opens, l.created_at,
                  coalesce((select sum(p2.remaining_credit_cents) from placements p2
                             where p2.link_id = l.id), 0) as remaining_credit_cents
             from links l join profiles p on p.id = l.owner_id
            where p.member_no = %s
            order by l.created_at desc limit 25""",
        (member_no,),
    )


def get_user_payments(member_no: int) -> list[dict[str, Any]]:
    return db.query(
        """select sp.stripe_payment_intent_id, sp.amount_cents, sp.status::text, sp.created_at
             from stripe_payments sp join profiles p on p.id = sp.user_id
            where p.member_no = %s
            order by sp.created_at desc limit 25""",
        (member_no,),
    )


# ---------------------------------------------------------------- tools


def _tool(name: str, description: str, func, params: dict[str, Any] | None = None,
          required: list[str] | None = None) -> Tool:
    return Tool(
        name=name,
        description=description,
        parameters={"type": "object", "properties": params or {}, "required": required or []},
        func=func,
    )


RANGE_PARAM = {"range": {"type": "string", "enum": list(_RANGES), "description": "Lookback window."}}


def ops_read_tools() -> list[Tool]:
    return [
        _tool("get_board_snapshot",
              "Current board ranking with credit and opens, the live spot, bar size, and pricing settings.",
              get_board_snapshot),
        _tool("get_metrics",
              "Traffic, revenue, signup and placement metrics over a lookback window.",
              get_metrics, RANGE_PARAM),
        _tool("get_recent_signups",
              "Latest accounts with links, credit, and lifetime top-ups.",
              get_recent_signups, {"limit": {"type": "integer", "minimum": 1, "maximum": 100}}),
        _tool("get_stripe_payments",
              "Stripe top-ups over a lookback window, newest first.",
              get_stripe_payments, RANGE_PARAM),
        _tool("detect_click_anomalies",
              "Click-spam signals from the last 24h: hot visitors, hot IPs, links with high rejection ratios.",
              detect_click_anomalies),
    ]


def admin_read_tools() -> list[Tool]:
    lookup = {
        "member_no": {"type": "integer"},
        "email": {"type": "string"},
        "username": {"type": "string"},
    }
    return [
        _tool("get_user",
              "Look up one account (by member_no, email, or username): credit, role, recent ledger.",
              get_user, lookup),
        _tool("get_user_links",
              "A member's links with moderation status and remaining credit.",
              get_user_links, {"member_no": {"type": "integer"}}, ["member_no"]),
        _tool("get_user_payments",
              "A member's Stripe top-ups with payment-intent ids (needed for refunds).",
              get_user_payments, {"member_no": {"type": "integer"}}, ["member_no"]),
    ]
