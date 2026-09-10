-- TapMart business services: content shoots, brand kits, social snapshots,
-- Google Business health checks, and richer calendar posts.
--
-- Nothing here estimates or fakes data. Every stored row carries a `source`
-- so the product can say where a number or a proposal came from.

-- ------------------------------------------------------------ content shoots
-- A shoot is one visit from a photographer or videographer, allocated by plan
-- (see src/config/plans.ts) and assigned by an admin.
create table if not exists content_shoots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  scheduled_for date,
  status text not null default 'planned'
    check (status in ('planned', 'scheduled', 'done', 'cancelled')),
  photos_planned int not null default 10,
  videos_planned int not null default 3,
  deliverable_urls text[] not null default '{}',
  assigned_to uuid references profiles(id) on delete set null,
  assigned_label text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_shoots_business_idx on content_shoots (business_id, scheduled_for);

-- ---------------------------------------------------------------- brand kits
-- `kit` is the approved kit and only approve_brand_kit-style code writes it.
-- `proposed` is the pending proposal (AI or template) waiting for approval.
create table if not exists brand_kits (
  business_id uuid primary key references businesses(id) on delete cascade,
  kit jsonb not null default '{}'::jsonb,
  proposed jsonb,
  proposed_source text check (proposed_source in ('ai', 'template')),
  status text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------- social snapshots
-- Growth numbers for a period. `source` says whether the business typed them
-- in (manual) or a provider API reported them (api).
create table if not exists social_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  provider text not null check (provider in ('instagram', 'facebook', 'tiktok', 'google_business')),
  period_start date not null,
  period_end date not null,
  source text not null check (source in ('manual', 'api')),
  metrics jsonb not null,
  top_post jsonb,
  created_at timestamptz not null default now()
);
create index if not exists social_snapshots_business_idx on social_snapshots (business_id, period_start);

-- ---------------------------------------------------- google health checks
-- A run of the Google Business checklist. `profile` means the checks were
-- derived from the business row itself; `api` means the Business Profile API.
create table if not exists google_health_checks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  source text not null check (source in ('profile', 'api')),
  checks jsonb not null,
  score int,
  created_at timestamptz not null default now()
);
create index if not exists google_health_checks_business_idx on google_health_checks (business_id, created_at desc);

-- ------------------------------------------------------------ calendar posts
alter table calendar_posts
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'ai', 'template')),
  add column if not exists format text
    check (format is null or format in ('reel', 'photo', 'story', 'post')),
  add column if not exists thumbnail_url text,
  add column if not exists caption text,
  add column if not exists recommended_time timestamptz;

-- ----------------------------------------------------------------------- RLS
-- Modelled on business_subscriptions_member (0021): members of the business
-- and admins can read; writes go through server actions.
alter table content_shoots enable row level security;
alter table brand_kits enable row level security;
alter table social_snapshots enable row level security;
alter table google_health_checks enable row level security;

drop policy if exists content_shoots_member on content_shoots;
create policy content_shoots_member on content_shoots for select
  using (is_admin() or assigned_to = auth.uid()
         or exists (select 1 from business_members m
                     where m.business_id = content_shoots.business_id
                       and m.profile_id = auth.uid()));

drop policy if exists brand_kits_member on brand_kits;
create policy brand_kits_member on brand_kits for select
  using (is_admin() or exists (select 1 from business_members m
                               where m.business_id = brand_kits.business_id
                                 and m.profile_id = auth.uid()));

drop policy if exists social_snapshots_member on social_snapshots;
create policy social_snapshots_member on social_snapshots for select
  using (is_admin() or exists (select 1 from business_members m
                               where m.business_id = social_snapshots.business_id
                                 and m.profile_id = auth.uid()));

drop policy if exists google_health_checks_member on google_health_checks;
create policy google_health_checks_member on google_health_checks for select
  using (is_admin() or exists (select 1 from business_members m
                               where m.business_id = google_health_checks.business_id
                                 and m.profile_id = auth.uid()));
