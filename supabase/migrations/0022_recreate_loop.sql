-- TapMart V3: the Recreate loop.
--
-- A business finds a reference (a trend, a link, an upload), gets a brief it
-- can edit, publishes a campaign whose details carry a creator guide, and
-- creators get an advisory check before they submit. Nothing here decides
-- money: business approval stays authoritative.
--
-- --------------------------------------------------------- campaigns.details
-- Recreate campaigns gain three keys in the existing jsonb column
-- (see 0021 for the base shape):
--   brief     CampaignBrief (src/lib/ai/types.ts), the business-facing brief
--             that produced the campaign, kept for review and re-editing
--   guide     CreatorGuide (src/lib/ai/types.ts), the short imperative steps,
--             duration, orientation, rules and checklist creators see
--   trend_id  uuid of the trend_items row the campaign started from, or absent
--
-- ---------------------------------------------------------- submissions.meta
-- Recreate submissions gain two keys next to the story proof keys:
--   check        SubmissionCheck (src/lib/ai/types.ts), the advisory
--                pre-submission check the creator saw; `checked_by` says
--                whether it was the browser only, the model, or nothing
--   client_meta  ClientMediaMeta minus frames: duration, width, height, size
--                as the browser read them before upload

-- ------------------------------------------------------------- trend_items
-- Viral content discovery. `source` is honest about where a row came from:
-- manual (a business pasted a link), curated (TapMart staff), fixture (dev
-- only, never inserted in production) or api (a real provider). `views` is
-- null unless a provider had a real figure; it is never estimated.
create table if not exists trend_items (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('manual', 'curated', 'fixture', 'api')),
  business_id uuid references businesses(id) on delete cascade,
  category text,
  title text not null check (char_length(title) between 1 and 200),
  platform text not null default 'other' check (platform in ('instagram', 'tiktok', 'youtube', 'other')),
  reference_url text,
  media_url text,
  thumbnail_url text,
  views bigint check (views is null or views >= 0),
  growth_note text,
  fit_note text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists trend_items_business_idx on trend_items (business_id);
create index if not exists trend_items_category_idx on trend_items (category, status);

alter table trend_items enable row level security;
drop policy if exists trend_items_member on trend_items;
create policy trend_items_member on trend_items for select
  using (is_admin()
         or business_id is null
         or exists (select 1 from business_members m
                     where m.business_id = trend_items.business_id
                       and m.profile_id = auth.uid()));

-- ---------------------------------------------------------- campaign_briefs
-- A generated brief waiting for the business to review it in the wizard.
-- `source` says whether the model or the template wrote it. Once a campaign
-- is created from it the row is marked used and the brief lives on in
-- campaigns.details.brief.
create table if not exists campaign_briefs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  trend_id uuid references trend_items(id) on delete set null,
  brief jsonb not null,
  source text not null check (source in ('ai', 'template')),
  status text not null default 'draft' check (status in ('draft', 'used')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists campaign_briefs_business_idx on campaign_briefs (business_id, status);

alter table campaign_briefs enable row level security;
drop policy if exists campaign_briefs_member on campaign_briefs;
create policy campaign_briefs_member on campaign_briefs for select
  using (is_admin() or exists (select 1 from business_members m
                               where m.business_id = campaign_briefs.business_id
                                 and m.profile_id = auth.uid()));
