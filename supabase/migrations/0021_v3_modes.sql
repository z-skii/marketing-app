-- TapMart V3: one account, two modes, three earning types, two plans.
--
-- Nothing is dropped. Legacy campaign kinds (photography, videography,
-- content, general) keep their rows but leave the marketplace: the feed
-- only serves recreate_reel, instagram_story and car_ads.

-- --------------------------------------------------------------- campaigns
-- Type-specific facts live in one jsonb column instead of three tables:
--   recreate_reel:   { reference_media_url, duration_seconds: [min,max] }
--   instagram_story: { creative_url, min_followers, live_hours }
--   car_ads:         { placements: vehicle_zone_kind[], duration_days,
--                      vehicle_prefs: { colors: [], body_types: [] }, artwork_url }
alter table campaigns add column if not exists details jsonb not null default '{}'::jsonb;
alter table campaigns add column if not exists starts_on date;

update campaigns set kind = 'recreate_reel' where kind = 'ugc';

-- Car campaigns: a driver applies with a specific vehicle; acceptance turns
-- into the existing offer + booking pair so the installation / proof /
-- monthly-payment workflow is unchanged.
alter table applications add column if not exists vehicle_id uuid references vehicles(id) on delete set null;
alter table car_offers add column if not exists campaign_id uuid references campaigns(id) on delete set null;
alter table car_bookings add column if not exists campaign_id uuid references campaigns(id) on delete set null;
create index if not exists car_bookings_campaign_idx on car_bookings (campaign_id);
create index if not exists car_offers_campaign_idx on car_offers (campaign_id);

-- Story proof lives on the submission: { story_url, posted_at, verified_by }.
alter table submissions add column if not exists meta jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------- vehicles
alter table vehicles add column if not exists available boolean not null default true;

-- --------------------------------------------------- people's social accounts
-- Instagram for Story campaigns. `verified_by` is honest about how the
-- handle was checked: 'manual' until a real Graph API connection exists.
create table if not exists social_accounts (
  profile_id uuid not null references profiles(id) on delete cascade,
  provider text not null check (provider in ('instagram')),
  handle text check (handle is null or char_length(handle) between 1 and 60),
  follower_count int check (follower_count is null or follower_count >= 0),
  status connected_status not null default 'disconnected',
  verified_by text not null default 'none' check (verified_by in ('none', 'manual', 'api')),
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (profile_id, provider)
);
alter table social_accounts enable row level security;
create policy social_accounts_owner on social_accounts for select
  using (profile_id = auth.uid() or is_admin());

-- ------------------------------------------------------------ subscriptions
-- Two plans. Prices are app settings (plan_essential_cents, plan_growth_cents)
-- so they change without a deploy; the feature lists live in src/config/plans.ts.
create table if not exists business_subscriptions (
  business_id uuid primary key references businesses(id) on delete cascade,
  plan text not null check (plan in ('essential', 'growth')),
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'cancelled')),
  billing text not null default 'dev' check (billing in ('dev', 'stripe', 'manual')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table business_subscriptions enable row level security;
create policy business_subscriptions_member on business_subscriptions for select
  using (is_admin() or exists (select 1 from business_members m
                               where m.business_id = business_subscriptions.business_id
                                 and m.profile_id = auth.uid()));

-- ----------------------------------------------------------------- context
-- Which identity the person is using: null = personal, else a business they
-- belong to. Remembered server-side so every device opens the same mode.
alter table profiles add column if not exists active_business_id uuid references businesses(id) on delete set null;

-- --------------------------------------------------------- ideas and trends
-- Trends are recommendations with a reference and a real, sourced stat.
alter table marketing_recommendations
  add column if not exists kind text not null default 'idea' check (kind in ('idea', 'trend')),
  add column if not exists reference_url text,
  add column if not exists stat text;

-- ------------------------------------------------------- business verification
-- Set by an admin after checking the business is real. Never inferred.
alter table businesses add column if not exists verification verification_state not null default 'unverified';
