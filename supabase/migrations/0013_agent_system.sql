-- Agent system: Grok-powered agents observe and propose; the owner approves
-- from /admin/agents; a worker executes approved proposals. Auto-executed
-- actions are audited in agent_actions.

create type proposal_status as enum ('pending','approved','rejected','executed','failed');

-- One row per agent invocation. The 8am ops run writes the daily brief to
-- summary; the Runs tab reads this table.
create table agent_runs (
  id            uuid primary key default gen_random_uuid(),
  agent         text not null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  model         text,
  input_tokens  int,
  output_tokens int,
  summary       text,
  error         text
);
create index agent_runs_started_idx on agent_runs (started_at desc);
create index agent_runs_agent_idx on agent_runs (agent, started_at desc);

-- Anything that spends money, contacts a customer, or posts publicly lands
-- here first. payload is the exact argument object the worker executes with.
create table agent_proposals (
  id                 uuid primary key default gen_random_uuid(),
  run_id             uuid references agent_runs(id),
  agent              text not null,
  kind               text not null,   -- 'price_change','ad_campaign','social_post','email','refund','ban',...
  title              text not null,
  rationale          text not null,
  payload            jsonb not null,
  estimated_cost_usd numeric not null default 0,
  assets             jsonb,           -- storage URLs for creatives
  status             proposal_status not null default 'pending',
  created_at         timestamptz not null default now(),
  decided_at         timestamptz,
  decided_by         uuid,
  executed_at        timestamptz,
  execution_result   jsonb
);
create index agent_proposals_status_idx on agent_proposals (status, created_at desc);
create index agent_proposals_run_idx on agent_proposals (run_id);

-- Auto-executed tool calls (inside each agent's explicit auto-execute scope).
create table agent_actions (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid references agent_runs(id),
  agent      text not null,
  tool       text not null,
  args       jsonb,
  result     jsonb,
  created_at timestamptz not null default now()
);
create index agent_actions_run_idx on agent_actions (run_id);
create index agent_actions_created_idx on agent_actions (created_at desc);

-- Caps, model names and schedules live in the database so the owner can
-- retune them without a deploy. Never hardcode these in agent code.
create table agent_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into agent_config (key, value) values
  ('refund_auto_cap_usd',          '10'),
  ('ads_daily_cap_usd',            '20'),
  ('max_cost_per_signup_usd',      '2.00'),
  ('higgsfield_daily_cap_credits', '20'),
  ('models', '{
     "ops": "grok-4",
     "ads": "grok-4",
     "admin": "grok-4-fast-reasoning",
     "creative": "grok-4-fast-reasoning",
     "social": "grok-4-fast-reasoning"
   }'),
  ('schedules', '{
     "ops":      {"every_minutes": 60},
     "admin":    {"every_minutes": 15},
     "creative": {"at": ["07:00"], "tz": "America/New_York"},
     "ads":      {"every_minutes": 360},
     "social":   {"at": ["09:00", "13:00", "19:00"], "tz": "America/New_York"},
     "worker":   {"every_minutes": 5}
   }'),
  ('ops_brief_hour_local', '8'),
  ('ops_brief_tz', '"America/New_York"')
on conflict (key) do nothing;

-- Only the service role (agents, worker, server code) and admins may touch
-- these tables. Direct-Postgres server code bypasses RLS as the table owner;
-- these policies confine anything arriving with a user JWT.
alter table agent_runs      enable row level security;
alter table agent_proposals enable row level security;
alter table agent_actions   enable row level security;
alter table agent_config    enable row level security;

create policy agent_runs_admin      on agent_runs      for all using (is_admin()) with check (is_admin());
create policy agent_proposals_admin on agent_proposals for all using (is_admin()) with check (is_admin());
create policy agent_actions_admin   on agent_actions   for all using (is_admin()) with check (is_admin());
create policy agent_config_admin    on agent_config    for all using (is_admin()) with check (is_admin());
