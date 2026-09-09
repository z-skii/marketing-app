-- TapMart V2: local marketing + creator + car advertising marketplace.
--
-- One account, many capabilities. This migration adds the marketplace domain
-- around the existing core (profiles, wallets, credit_ledger, payouts):
--   capabilities on profiles          businesses + members + brand kit
--   creator profiles + portfolios     vehicles + photos + ad zones
--   campaigns + applications          submissions + earnings
--   car offers + bookings + proofs    conversations + messages
--   notifications + preferences       follows + saves + blocks
--   reviews + reports                 connected accounts + content calendar
--   marketing recommendations
--
-- Money stays on the existing rails: businesses fund work from their credit
-- wallet (Stripe top-ups), approvals move credit into creator earnings via
-- credit_ledger, and payouts reuse payout_requests. The platform fee percent
-- lives in app_settings so admins can retune it without a deploy.

-- ---------------------------------------------------------------- capabilities

alter table profiles
  add column if not exists bio text,
  add column if not exists city text,
  add column if not exists wants_earn boolean not null default false,
  add column if not exists wants_business boolean not null default false,
  add column if not exists onboarded_at timestamptz;

-- ------------------------------------------------------------------- enums

create type verification_state as enum ('unverified', 'pending', 'verified', 'rejected');
create type campaign_kind as enum ('ugc', 'photography', 'videography', 'content', 'car_ads', 'general');
create type campaign_status as enum ('draft', 'open', 'paused', 'closed', 'completed', 'cancelled');
create type application_status as enum ('applied', 'accepted', 'declined', 'withdrawn');
create type submission_status as enum
  ('submitted', 'under_review', 'revision_requested', 'approved', 'rejected', 'paid');
create type vehicle_zone_kind as enum
  ('driver_door', 'passenger_door', 'driver_rear_door', 'passenger_rear_door',
   'rear_window', 'rear_panel', 'bumper', 'hood', 'full_side', 'partial_wrap', 'full_wrap');
create type car_offer_status as enum ('sent', 'countered', 'accepted', 'declined', 'cancelled', 'expired');
create type car_booking_status as enum
  ('creative_pending', 'installation_pending', 'active', 'proof_required',
   'completed', 'cancelled', 'disputed');
create type car_proof_kind as enum ('installation', 'periodic', 'odometer');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type connected_status as enum ('disconnected', 'pending', 'connected', 'error');
create type calendar_post_status as enum
  ('idea', 'draft', 'needs_approval', 'approved', 'scheduled', 'published', 'failed');

alter type ledger_type add value if not exists 'campaign_payment';
alter type ledger_type add value if not exists 'campaign_earning';
alter type ledger_type add value if not exists 'platform_fee';

-- --------------------------------------------------------------- businesses

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null,
  category text,
  description text,
  logo_url text,
  cover_url text,
  address text,
  city text,
  phone text,
  website text,
  hours jsonb,
  socials jsonb not null default '{}'::jsonb,
  brand jsonb not null default '{}'::jsonb,
  target_note text,
  goals text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index businesses_slug_key on businesses (lower(slug));
create index businesses_owner_idx on businesses (owner_id);
create index businesses_city_idx on businesses (lower(city));

create table business_members (
  business_id uuid not null references businesses(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner', 'manager', 'member')),
  created_at timestamptz not null default now(),
  primary key (business_id, profile_id)
);
create index business_members_profile_idx on business_members (profile_id);

-- ----------------------------------------------------------------- creators

create table creator_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  categories text[] not null default '{}',
  service_radius_miles int check (service_radius_miles between 1 and 500),
  portfolio_url text,
  equipment text,
  pricing_note text,
  verification verification_state not null default 'unverified',
  verification_note text,
  verified_at timestamptz,
  completed_jobs int not null default 0,
  rating_avg numeric(3, 2),
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);

create table portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  media_url text not null,
  caption text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index portfolio_items_profile_idx on portfolio_items (profile_id, sort);

-- ----------------------------------------------------------------- vehicles

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  year int not null check (year between 1960 and 2035),
  make text not null,
  model text not null,
  trim text,
  body_type text,
  color text,
  monthly_miles int check (monthly_miles between 0 and 20000),
  city text,
  radius_miles int check (radius_miles between 1 and 500),
  status text not null default 'draft' check (status in ('draft', 'listed', 'unlisted')),
  verification verification_state not null default 'unverified',
  verification_note text,
  rating_avg numeric(3, 2),
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);
create index vehicles_owner_idx on vehicles (owner_id);
create index vehicles_market_idx on vehicles (status, lower(city));

create table vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  angle text not null check (angle in ('front', 'driver_side', 'rear', 'passenger_side', 'other')),
  url text not null,
  created_at timestamptz not null default now()
);
create index vehicle_photos_vehicle_idx on vehicle_photos (vehicle_id);

create table vehicle_zones (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  zone vehicle_zone_kind not null,
  available boolean not null default true,
  asking_cents_monthly bigint check (asking_cents_monthly is null or asking_cents_monthly > 0),
  unique (vehicle_id, zone)
);

-- ---------------------------------------------------------------- campaigns

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  kind campaign_kind not null,
  title text not null check (char_length(title) between 4 and 120),
  brief text not null,
  reference_url text,
  requirements text[] not null default '{}',
  pay_cents bigint not null check (pay_cents > 0),
  slots int not null default 1 check (slots between 1 and 500),
  city text,
  radius_miles int,
  deadline timestamptz,
  event_at timestamptz,
  verified_only boolean not null default false,
  rights_note text not null default
    'Approved content may be used by the business for its marketing. Creators keep the right to show the work in their portfolio.',
  status campaign_status not null default 'draft',
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index campaigns_feed_idx on campaigns (status, published_at desc);
create index campaigns_business_idx on campaigns (business_id, status);
create index campaigns_city_idx on campaigns (lower(city));

create table applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  applicant_id uuid not null references profiles(id) on delete cascade,
  message text,
  status application_status not null default 'applied',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (campaign_id, applicant_id)
);
create index applications_campaign_idx on applications (campaign_id, status);
create index applications_applicant_idx on applications (applicant_id, created_at desc);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  creator_id uuid not null references profiles(id) on delete cascade,
  media_urls text[] not null default '{}',
  note text,
  rights_ack boolean not null default false,
  status submission_status not null default 'submitted',
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz
);
create index submissions_campaign_idx on submissions (campaign_id, status, created_at);
create index submissions_creator_idx on submissions (creator_id, created_at desc);

-- V2 earnings: money a person made from marketplace work. Sits beside the
-- click-based creator_earnings table (sharer program) and both feed payouts.
create table earnings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  source text not null check (source in ('submission', 'booking', 'adjustment')),
  source_id uuid,
  amount_cents bigint not null check (amount_cents >= 0),
  fee_cents bigint not null default 0 check (fee_cents >= 0),
  status earning_status not null default 'available',
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index earnings_profile_idx on earnings (profile_id, status, available_at);
create unique index earnings_source_key on earnings (source, source_id) where source_id is not null;

-- ------------------------------------------------------------------ car ads

create table car_offers (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  zones vehicle_zone_kind[] not null check (cardinality(zones) >= 1),
  monthly_cents bigint not null check (monthly_cents > 0),
  months int not null default 1 check (months between 1 and 24),
  message text,
  status car_offer_status not null default 'sent',
  counter_cents bigint check (counter_cents is null or counter_cents > 0),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index car_offers_vehicle_idx on car_offers (vehicle_id, status);
create index car_offers_business_idx on car_offers (business_id, status);

create table car_bookings (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references car_offers(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  zones vehicle_zone_kind[] not null,
  monthly_cents bigint not null,
  status car_booking_status not null default 'creative_pending',
  starts_on date,
  ends_on date,
  artwork_url text,
  created_at timestamptz not null default now()
);
create index car_bookings_vehicle_idx on car_bookings (vehicle_id, status);
create index car_bookings_business_idx on car_bookings (business_id, status);

create table car_proofs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references car_bookings(id) on delete cascade,
  kind car_proof_kind not null,
  media_url text,
  odometer_miles int check (odometer_miles is null or odometer_miles >= 0),
  note text,
  created_at timestamptz not null default now()
);
create index car_proofs_booking_idx on car_proofs (booking_id, created_at desc);

-- ---------------------------------------------------------------- messaging

create table conversations (
  id uuid primary key default gen_random_uuid(),
  topic_type text check (topic_type in ('campaign', 'offer', 'booking', 'business', 'profile')),
  topic_id uuid,
  created_at timestamptz not null default now()
);
create index conversations_topic_idx on conversations (topic_type, topic_id);

create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);
create index conversation_members_profile_idx on conversation_members (profile_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  kind text not null default 'text' check (kind in ('text', 'system')),
  body text not null check (char_length(body) between 1 and 4000),
  media_url text,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on messages (conversation_id, created_at);

-- ------------------------------------------------------------ notifications

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_inbox_idx on notifications (profile_id, created_at desc);
create index notifications_unread_idx on notifications (profile_id) where read_at is null;

create table notification_prefs (
  profile_id uuid primary key references profiles(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb
);

-- ------------------------------------------------------------------- social

create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followed_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
create index follows_followed_idx on follows (followed_id);

create table saved_items (
  profile_id uuid not null references profiles(id) on delete cascade,
  item_type text not null check (item_type in ('campaign', 'vehicle', 'profile', 'business')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, item_type, item_id)
);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ------------------------------------------------------- reviews and safety

create table reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references profiles(id) on delete cascade,
  subject_type text not null check (subject_type in ('profile', 'business')),
  subject_id uuid not null,
  context_type text not null check (context_type in ('submission', 'booking')),
  context_id uuid not null,
  rating int not null check (rating between 1 and 5),
  categories jsonb not null default '{}'::jsonb,
  body text,
  created_at timestamptz not null default now(),
  unique (reviewer_id, context_type, context_id)
);
create index reviews_subject_idx on reviews (subject_type, subject_id, created_at desc);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check
    (target_type in ('profile', 'business', 'campaign', 'vehicle', 'submission', 'message')),
  target_id uuid not null,
  reason text not null,
  detail text,
  status report_status not null default 'open',
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index reports_queue_idx on reports (status, created_at);

-- -------------------------------------------- marketing management (business)

create table connected_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  provider text not null check (provider in ('google_business', 'instagram', 'facebook', 'tiktok')),
  status connected_status not null default 'disconnected',
  external_name text,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (business_id, provider)
);

create table calendar_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook', 'tiktok', 'google_business', 'other')),
  status calendar_post_status not null default 'idea',
  title text not null,
  copy text,
  media_urls text[] not null default '{}',
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index calendar_posts_business_idx on calendar_posts (business_id, scheduled_for);

create table marketing_recommendations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null,
  body text not null,
  prefill jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'used', 'dismissed')),
  created_at timestamptz not null default now()
);
create index marketing_recommendations_idx on marketing_recommendations (business_id, status, created_at desc);

-- ---------------------------------------------------------------------- RLS
-- The app talks to Postgres server-side with full authorization enforced in
-- server actions; RLS mirrors ownership for anything that reaches the
-- database through PostgREST with user credentials.

alter table businesses enable row level security;
alter table business_members enable row level security;
alter table creator_profiles enable row level security;
alter table portfolio_items enable row level security;
alter table vehicles enable row level security;
alter table vehicle_photos enable row level security;
alter table vehicle_zones enable row level security;
alter table campaigns enable row level security;
alter table applications enable row level security;
alter table submissions enable row level security;
alter table earnings enable row level security;
alter table car_offers enable row level security;
alter table car_bookings enable row level security;
alter table car_proofs enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table notification_prefs enable row level security;
alter table follows enable row level security;
alter table saved_items enable row level security;
alter table blocks enable row level security;
alter table reviews enable row level security;
alter table reports enable row level security;
alter table connected_accounts enable row level security;
alter table calendar_posts enable row level security;
alter table marketing_recommendations enable row level security;

create policy earnings_owner on earnings for select using (profile_id = auth.uid() or is_admin());
create policy notifications_owner on notifications for select using (profile_id = auth.uid() or is_admin());
create policy vehicles_owner on vehicles for select using (owner_id = auth.uid() or status = 'listed' or is_admin());
create policy campaigns_public on campaigns for select
  using (status in ('open', 'closed', 'completed') or is_admin()
         or exists (select 1 from business_members m where m.business_id = campaigns.business_id and m.profile_id = auth.uid()));
create policy messages_member on messages for select
  using (exists (select 1 from conversation_members cm
                  where cm.conversation_id = messages.conversation_id and cm.profile_id = auth.uid()));

-- Earnings can sit in a payout request before being paid out.
alter type earning_status add value if not exists 'requested';
