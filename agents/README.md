# Tapmart agent system

Grok-powered agents that run Tapmart day to day. Agents observe, draft, and
propose; the owner approves from **/admin/agents**; `worker.py` executes
approved proposals. Nothing that spends money, contacts a customer, or posts
publicly runs without approval unless it is inside an explicit auto-execute
scope (support replies, refunds under cap, creative generation under the
daily credit cap, pausing over-cap ad spend).

## Layout

- `orchestrator.py` — run agents that are due (`--due`), or one now (`--agent ops`)
- `worker.py` — execute owner-approved proposals (dispatch on `kind`)
- `config.py` — reads models/schedules/caps from the `agent_config` table
- `llm/grok.py` — xAI chat-completions tool loop (15 tool calls/run cap)
- `audit.py` — `agent_runs` / `agent_actions` writers
- `tools/` — one thin module per hand (Supabase, Stripe, Gmail, Higgsfield,
  Meta, TikTok, X/Threads, proposals)
- `agents/` + `prompts/` — one definition + system prompt per agent
- `tests/` — end-to-end tests against a local Postgres with a scripted fake Grok

## Agents

| agent    | schedule            | auto-execute                                   | proposes |
|----------|---------------------|------------------------------------------------|----------|
| ops      | hourly (8am ET run writes the daily brief) | nothing (read-only)     | price_change, reset_time_change, flag_link |
| admin    | every 15 min        | support/onboarding email; refunds ≤ cap (enforced in code) | refund > cap, ban, other |
| creative | daily 7am ET        | Higgsfield generation ≤ daily credit cap (in code) | creative_batch |
| ads      | every 6 h           | pause over-cap spend                           | ad_campaign, budget_change, resume_ad, creative_request |
| social   | 9am/1pm/7pm ET      | none (Threads auto-post via `social_auto_post_threads` config) | social_post, outreach_email |

Caps and models live in `agent_config` (seeded by migration 0013):
`refund_auto_cap_usd`, `ads_daily_cap_usd`, `max_cost_per_signup_usd`,
`higgsfield_daily_cap_credits`, `models`, `schedules`.

## Running

```sh
pip install -r agents/requirements.txt
export AGENTS_DATABASE_URL=postgresql://...   # Supabase pooler URI
export XAI_API_KEY=...
python -m agents.orchestrator --agent ops     # first ops run; check the Runs tab
python -m agents.orchestrator --due           # what the schedule does
python -m agents.worker                       # execute approved proposals
```

Scheduling starts as the GitHub Actions cron in
`.github/workflows/agents.yml` (every 15 min; set the `AGENTS_DATABASE_URL`
and `XAI_API_KEY` repo secrets, plus per-tool secrets as they come online).
Move to a Railway/Fly service later for the worker's true 5-minute cadence.

## Secrets

Required: `XAI_API_KEY`, `AGENTS_DATABASE_URL`.
Per tool, optional until that agent goes live: `STRIPE_SECRET_KEY`;
`GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`GMAIL_REFRESH_TOKEN`/`GMAIL_SENDER`;
`HIGGSFIELD_API_KEY` (+ `HIGGSFIELD_API_SECRET`), `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` (asset storage); `META_ACCESS_TOKEN` +
`META_AD_ACCOUNT_ID`; `TIKTOK_ACCESS_TOKEN` + `TIKTOK_ADVERTISER_ID`;
`X_API_KEY`/`X_API_SECRET`/`X_ACCESS_TOKEN`/`X_ACCESS_TOKEN_SECRET`;
`THREADS_ACCESS_TOKEN`/`THREADS_USER_ID`. Agent-service env only — never in
the Next.js client.

## Tests

```sh
sudo -u postgres psql -c "create role app login password 'app' superuser" # once
PGPASSWORD=app bash scripts/db-reset.sh agents_test
AGENTS_TEST_DATABASE_URL='postgresql://app:app@127.0.0.1:5432/agents_test' \
  python -m pytest agents/tests
```
