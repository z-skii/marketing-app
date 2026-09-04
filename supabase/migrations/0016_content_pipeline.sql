-- Content pipeline: the generation agent drafts posts and ads into
-- content_queue; the owner reviews at /admin/content; the publish cron sends
-- approved items whose time has come. agent_runs (0013) is reused as the run
-- log and gains the cost/output columns this pipeline reports.

create table content_queue (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid references agent_runs(id),
  platform      text not null check (platform in ('threads','instagram')),
  format        text not null check (format in ('post','caption','story_ad','feed_ad')),
  copy          text not null,
  -- Rendered creative (storage URL, or a render-endpoint URL until storage
  -- is configured). Null for text-only posts.
  asset_url     text,
  -- The exact template/text params the ad was rendered from, so it can be
  -- re-rendered or edited later.
  ad_params     jsonb,
  hashtags      text[],
  status        text not null default 'draft'
                check (status in ('draft','approved','ready','published','rejected','failed')),
  scheduled_for timestamptz,
  published_at  timestamptz,
  -- Platform post id / error detail from the publish attempt.
  publish_result jsonb,
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index content_queue_status_idx on content_queue (status, scheduled_for);
create index content_queue_created_idx on content_queue (created_at desc);

-- The existing run log learns to carry what a generation run cost and made.
alter table agent_runs add column if not exists cost_usd numeric;
alter table agent_runs add column if not exists output_count int;

-- Nothing publishes without approval unless the owner flips this on.
insert into app_settings (key, value)
values ('feature_agent_auto_publish', to_jsonb('false'::text))
on conflict (key) do nothing;
