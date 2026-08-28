"""Agent-system tests run against a real Postgres built from the repo's
migrations (scripts/db-reset.sh agents_test), with a scripted fake Grok
client — no network, no xAI key.

Skipped entirely unless AGENTS_TEST_DATABASE_URL is set.
"""

from __future__ import annotations

import os
import uuid

import pytest

TEST_URL = os.environ.get("AGENTS_TEST_DATABASE_URL")

if TEST_URL:
    os.environ["AGENTS_DATABASE_URL"] = TEST_URL

collect_ignore_glob = [] if TEST_URL else ["test_*.py"]


@pytest.fixture()
def db():
    from agents import db as agents_db

    yield agents_db
    # Each test starts from a clean agent state; app data is reseeded per test.
    agents_db.execute("delete from agent_actions")
    agents_db.execute("delete from agent_proposals")
    agents_db.execute("delete from agent_runs")


@pytest.fixture()
def seeded(db):
    """A tiny live-looking dataset: one member, one link on the board with
    clicks (some rejected), and a succeeded Stripe payment."""
    user_id = str(uuid.uuid4())
    db.execute("insert into auth.users (id, email) values (%s, 'member@example.com')", (user_id,))
    db.execute(
        "insert into profiles (id, display_name, role) values (%s, 'Member One', 'user')",
        (user_id,),
    )
    db.execute(
        "insert into wallets (user_id, available_credit_cents, cached_total_remaining_credit_cents)"
        " values (%s, 500, 900) on conflict (user_id) do update set available_credit_cents = 500",
        (user_id,),
    )
    link = db.query_one(
        """insert into links (owner_id, slug, destination_url, domain, display_name, moderation_status)
           values (%s, 'test-link', 'https://example.com', 'example.com', 'Test Link', 'approved')
           returning id""",
        (user_id,),
    )
    placement = db.query_one(
        """insert into placements (link_id, owner_id, placement_type, remaining_credit_cents, status)
           values (%s, %s, 'board', 400, 'active') returning id""",
        (link["id"], user_id),
    )
    db.execute("select ensure_current_round()")
    round_row = db.query_one("select id from daily_rounds where status = 'active'")
    db.execute(
        """insert into board_round_entries (round_id, placement_id, score_cents, opens_count)
           values (%s, %s, 300, 12)""",
        (round_row["id"], placement["id"]),
    )
    for i in range(8):
        db.execute(
            """insert into click_events
                 (placement_id, link_id, anonymous_visitor_id, qualified, rejection_reason, debit_cents)
               values (%s, %s, %s, %s, %s, %s)""",
            (placement["id"], link["id"], f"visitor-{i % 2}",
             i % 2 == 0, None if i % 2 == 0 else "duplicate_window", 5 if i % 2 == 0 else 0),
        )
    db.execute(
        """insert into stripe_payments
             (user_id, stripe_session_id, stripe_payment_intent_id, amount_cents, status)
           values (%s, 'cs_test_1', 'pi_test_1', 2000, 'succeeded')""",
        (user_id,),
    )
    yield {"user_id": user_id, "link_id": str(link["id"]), "placement_id": str(placement["id"])}
    db.execute("delete from click_events")
    db.execute("delete from board_round_entries")
    db.execute("delete from bar_queue")
    db.execute("delete from spot_schedules")
    db.execute("delete from stripe_payments")
    db.execute("delete from placements")
    db.execute("delete from links")
    db.execute("delete from credit_ledger")
    db.execute("delete from admin_audit_log")
    db.execute("delete from wallets")
    db.execute("delete from profiles")
    db.execute("delete from auth.users")


class FakeMessage:
    def __init__(self, content=None, tool_calls=None):
        self.content = content
        self.tool_calls = tool_calls or None


class FakeToolCall:
    counter = 0

    def __init__(self, name: str, arguments: str):
        FakeToolCall.counter += 1
        self.id = f"call_{FakeToolCall.counter}"
        self.function = type("F", (), {"name": name, "arguments": arguments})()


class FakeResponse:
    def __init__(self, message: FakeMessage):
        self.choices = [type("C", (), {"message": message})()]
        self.usage = type("U", (), {"prompt_tokens": 100, "completion_tokens": 50})()


class FakeGrok:
    """Scripted chat client: pops the next turn from a list. Each turn is
    either a list of (tool_name, args_json) pairs or a final text string.
    When called with tool_choice='none' it always answers in text."""

    def __init__(self, turns):
        self.turns = list(turns)
        self.calls = []
        outer = self

        class Completions:
            def create(self, **kwargs):
                outer.calls.append(kwargs)
                if kwargs.get("tool_choice") == "none":
                    return FakeResponse(FakeMessage(content="stopped: tool budget exhausted"))
                turn = outer.turns.pop(0)
                if isinstance(turn, str):
                    return FakeResponse(FakeMessage(content=turn))
                return FakeResponse(FakeMessage(
                    tool_calls=[FakeToolCall(name, args) for name, args in turn]
                ))

        self.chat = type("Chat", (), {"completions": Completions()})()
