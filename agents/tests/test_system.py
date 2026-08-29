"""End-to-end agent-system tests: a full ops run producing a brief and a
proposal, the worker executing approved proposals, cap enforcement, schedule
logic, and the tool-call budget."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from .conftest import FakeGrok

BRIEF = (
    "**Yesterday**: 4 qualified / 4 rejected clicks, $0.20 revenue, one $20 top-up, 1 signup.\n"
    "**Board**: Test Link holds #1.\n**Watchlist**: rejection ratio 50%.\n"
    "**Proposals**: price_change filed."
)


def make_ops_script():
    return [
        [("get_board_snapshot", "{}"), ("get_metrics", json.dumps({"range": "24h"}))],
        [("detect_click_anomalies", "{}"),
         ("create_proposal", json.dumps({
             "kind": "price_change",
             "title": "Raise board click price to 6¢",
             "rationale": "Board demand supports it: 12 opens on 300¢ score.",
             "payload": {"changes": {"board_click_price_cents": 6}},
         }))],
        BRIEF,
    ]


def test_ops_full_run_writes_brief_and_proposal(db, seeded):
    from agents import orchestrator

    run_id = orchestrator.run_one("ops", client=FakeGrok(make_ops_script()))

    run = db.query_one("select * from agent_runs where id = %s", (run_id,))
    assert run["agent"] == "ops"
    assert run["finished_at"] is not None
    assert "**Yesterday**" in run["summary"]
    assert "[verified] proposals filed: 1" in run["summary"]
    assert run["input_tokens"] == 300 and run["output_tokens"] == 150
    assert run["error"] is None

    actions = db.query("select tool from agent_actions where run_id = %s order by created_at", (run_id,))
    assert [a["tool"] for a in actions] == [
        "get_board_snapshot", "get_metrics", "detect_click_anomalies", "create_proposal",
    ]

    proposal = db.query_one("select * from agent_proposals where run_id = %s", (run_id,))
    assert proposal["kind"] == "price_change"
    assert proposal["status"] == "pending"
    assert proposal["payload"] == {"changes": {"board_click_price_cents": 6}}


def test_ops_tools_return_real_data(db, seeded):
    from agents.tools import supabase_tools

    snapshot = supabase_tools.get_board_snapshot()
    assert snapshot["board"][0]["display_name"] == "Test Link"
    assert snapshot["settings"]["board_click_price_cents"] == "5"

    metrics = supabase_tools.get_metrics("24h")
    assert metrics["qualified_clicks"] == 4
    assert metrics["rejected_clicks"] == 4
    assert metrics["topups_cents"] == 2000
    assert metrics["rejection_breakdown"][0]["reason"] == "duplicate_window"

    payments = supabase_tools.get_stripe_payments("7d")
    assert payments[0]["amount_cents"] == 2000


def test_duplicate_pending_proposal_is_skipped(db):
    from agents.tools.proposal_tools import create_proposal

    first = create_proposal(agent="ops", run_id=None, kind="price_change", title="t",
                            rationale="r", payload={"changes": {"board_click_price_cents": 7}})
    second = create_proposal(agent="ops", run_id=None, kind="price_change", title="t2",
                             rationale="r2", payload={"changes": {"board_click_price_cents": 7}})
    assert first["status"] == "pending"
    assert second["status"] == "duplicate_pending_skipped"
    assert second["proposal_id"] == first["proposal_id"]


def test_worker_executes_approved_price_change(db, seeded):
    from agents import worker
    from agents.tools.proposal_tools import create_proposal

    created = create_proposal(agent="ops", run_id=None, kind="price_change", title="6¢",
                              rationale="r", payload={"changes": {"board_click_price_cents": 6}})
    # Pending proposals are untouched by the worker.
    assert worker.drain() == {"executed": 0, "failed": 0}

    db.execute("update agent_proposals set status = 'approved', decided_at = now() where id = %s",
               (created["proposal_id"],))
    assert worker.drain() == {"executed": 1, "failed": 0}

    setting = db.query_one("select value #>> '{}' as v from app_settings where key = 'board_click_price_cents'")
    assert setting["v"] == "6"
    final = db.query_one("select status, execution_result from agent_proposals where id = %s",
                         (created["proposal_id"],))
    assert final["status"] == "executed"
    assert final["execution_result"]["ok"] is True


def test_worker_executes_flag_link_and_ban(db, seeded):
    from agents import worker
    from agents.tools.proposal_tools import create_proposal

    flag = create_proposal(agent="ops", run_id=None, kind="flag_link", title="flag",
                           rationale="r", payload={"slug": "test-link", "reason": "50% rejected"})
    db.execute("update agent_proposals set status = 'approved' where id = %s", (flag["proposal_id"],))
    worker.drain()
    link = db.query_one("select moderation_status::text as m, moderation_note from links where slug = 'test-link'")
    assert link["m"] == "suspended"
    assert "50% rejected" in link["moderation_note"]

    ban = create_proposal(agent="admin", run_id=None, kind="ban", title="ban",
                          rationale="r", payload={"slug": "test-link", "reason": "spam",
                                                  "block_domain": True})
    db.execute("update agent_proposals set status = 'approved' where id = %s", (ban["proposal_id"],))
    worker.drain()
    assert db.query_one("select 1 as x from blocked_domains where domain = 'example.com'")


def test_worker_failure_is_recorded_not_retried(db):
    from agents import worker
    from agents.tools.proposal_tools import create_proposal

    bad = create_proposal(agent="ops", run_id=None, kind="flag_link", title="bad",
                          rationale="r", payload={"slug": "does-not-exist"})
    db.execute("update agent_proposals set status = 'approved' where id = %s", (bad["proposal_id"],))
    assert worker.drain() == {"executed": 0, "failed": 1}
    row = db.query_one("select status, execution_result from agent_proposals where id = %s",
                       (bad["proposal_id"],))
    assert row["status"] == "failed"
    assert "does-not-exist" in row["execution_result"]["error"]
    # Failed proposals stay failed: a second drain must not pick them up.
    assert worker.drain() == {"executed": 0, "failed": 0}


def test_creative_batch_rejects_fabricated_assets(db):
    from agents import audit
    from agents.tools.proposal_tools import make_create_proposal_tool

    run_id = audit.start_run("creative", "test-model")
    tool = make_create_proposal_tool("creative", run_id, ["creative_batch"])

    fabricated = tool.func(kind="creative_batch", title="fake", rationale="r",
                           payload={"items": [{"asset_url": "https://cdn.example.com/x.jpg"}]},
                           assets=["https://cdn.example.com/x.jpg"])
    assert "were not produced" in fabricated["error"]

    empty = tool.func(kind="creative_batch", title="empty", rationale="r", payload={})
    assert "at least one asset" in empty["error"]

    # An asset actually produced by a generation tool in this run passes.
    real_url = "https://proj.supabase.co/storage/v1/object/public/agent-assets/a.png"
    audit.log_action(run_id, "creative", "generate_image",
                     {"prompt": "p"}, {"asset_url": real_url, "prompt": "p"})
    ok = tool.func(kind="creative_batch", title="real", rationale="r",
                   payload={"items": [{"asset_url": real_url, "copy": "c"}]},
                   assets=[real_url])
    assert ok["status"] == "pending"


def test_rejection_notes_feed_the_next_run(db):
    from agents.tools.proposal_tools import create_proposal, owner_feedback_context

    created = create_proposal(agent="creative", run_id=None, kind="creative_batch",
                              title="Garbled ticker batch", rationale="r",
                              payload={"items": []})
    db.execute(
        """update agent_proposals
              set status = 'rejected', decided_at = now(),
                  execution_result = '{"rejection_note": "no words inside images"}'::jsonb
            where id = %s""",
        (created["proposal_id"],),
    )
    context = owner_feedback_context("creative")
    assert "REJECTED" in context
    assert "no words inside images" in context
    assert "standing rule" in context


def test_refund_cap_refuses_above_cap_without_touching_stripe(db, seeded):
    from agents.tools import stripe_tools

    result = stripe_tools.issue_refund_capped("pi_test_1", amount_cents=2000, reason="too big")
    assert "exceeds the auto-refund cap" in result["error"]


def test_schedule_logic(db):
    from agents import config

    now = datetime(2026, 8, 28, 12, 30, tzinfo=timezone.utc)
    assert config.is_due("ops", None, now)
    assert config.is_due("ops", now - timedelta(minutes=61), now)
    assert not config.is_due("ops", now - timedelta(minutes=10), now)
    assert not config.is_due("admin", now - timedelta(minutes=5), now)
    assert config.is_due("admin", now - timedelta(minutes=15), now)

    # creative fires at 07:00 New York (11:00 UTC in August).
    assert config.is_due("creative", now - timedelta(hours=24), now)
    assert not config.is_due("creative", now - timedelta(minutes=30), now)
    before_seven_et = datetime(2026, 8, 28, 10, 0, tzinfo=timezone.utc)
    assert not config.is_due("creative", before_seven_et - timedelta(hours=20), before_seven_et)


def test_brief_run_detection(db):
    from agents import config

    eight_et = datetime(2026, 8, 28, 12, 5, tzinfo=timezone.utc)   # 08:05 New York
    nine_et = datetime(2026, 8, 28, 13, 5, tzinfo=timezone.utc)
    assert config.is_brief_run(eight_et)
    assert not config.is_brief_run(nine_et)


def test_tool_call_budget_terminates_loop(db, seeded):
    from agents import orchestrator

    endless = [[("get_metrics", "{}")] for _ in range(30)]
    run_id = orchestrator.run_one("ops", client=FakeGrok(endless))
    run = db.query_one("select summary from agent_runs where id = %s", (run_id,))
    assert run["summary"].startswith("stopped: tool budget exhausted")
    assert "[verified]" in run["summary"]
    actions = db.query_one("select count(*)::int as n from agent_actions where run_id = %s", (run_id,))
    assert actions["n"] <= 16  # budget of 15, final in-flight batch may add one


def test_agent_tool_scopes(db):
    """Agents never get tools outside their list; propose-only stays propose-only."""
    from agents.agents import RunContext, registry

    names = {
        name: {tool.name for tool in agent.build_tools(RunContext(agent=name, run_id=None))}
        for name, agent in registry().items()
    }
    assert "create_proposal" in names["ops"]
    assert names["ops"].isdisjoint({"send_email", "issue_refund", "meta_pause_ad", "post_to_threads"})
    assert "issue_refund" in names["admin"] and "ban_link" not in names["admin"]
    assert "generate_image" in names["creative"]
    assert "meta_pause_ad" in names["ads"] and "meta_create_campaign" not in names["ads"]
    assert "post_to_threads" not in names["social"]  # propose-only until the owner flips the flag
    db.execute("""insert into agent_config (key, value) values ('social_auto_post_threads','true')
                  on conflict (key) do update set value = 'true'""")
    social = registry()["social"]
    assert "post_to_threads" in {t.name for t in social.build_tools(RunContext(agent="social", run_id=None))}
    db.execute("delete from agent_config where key = 'social_auto_post_threads'")
