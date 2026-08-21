-- UNTITLED — core schema
-- All monetary values are INTEGER CENTS (bigint). Never floating point.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums

create type user_role            as enum ('user', 'admin');
create type moderation_status    as enum ('pending', 'approved', 'rejected', 'suspended');
create type placement_type       as enum ('board', 'spot', 'bar');
create type placement_status     as enum ('pending', 'active', 'exhausted', 'paused');
create type ledger_type          as enum (
  'stripe_topup', 'board_allocate', 'spot_allocate', 'bar_allocate',
  'placement_release', 'qualified_click_debit', 'creator_commission',
  'admin_adjustment', 'refund', 'correction'
);
create type round_status         as enum ('active', 'closed');
create type spot_slot_status     as enum ('scheduled', 'played', 'skipped', 'cancelled');
create type earning_status       as enum ('pending', 'available', 'paid', 'rejected');
create type payout_status        as enum ('requested', 'approved', 'paid', 'rejected');
create type payment_status       as enum ('pending', 'succeeded', 'failed');

-- ---------------------------------------------------------------- identity

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  creator_enabled boolean     not null default true,
  role            user_role   not null default 'user',
  suspended       boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- Cached balances. The ledger below is the audit trail of record.
create table wallets (
  user_id                             uuid primary key references profiles(id) on delete cascade,
  available_credit_cents              bigint      not null default 0 check (available_credit_cents >= 0),
  cached_total_remaining_credit_cents bigint      not null default 0 check (cached_total_remaining_credit_cents >= 0),
  updated_at                          timestamptz not null default now()
);

-- ---------------------------------------------------------------- ledger

-- Immutable. balance_before/after track the user's TOTAL remaining platform
-- credit (available + every placement's remaining), so allocations net to zero
-- while top-ups and click debits move it.
create table credit_ledger (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid        not null references profiles(id) on delete cascade,
  amount_cents        bigint      not null,
  transaction_type    ledger_type not null,
  balance_before_cents bigint     not null,
  balance_after_cents  bigint     not null,
  related_entity_type text,
  related_entity_id   uuid,
  reason              text,
  metadata            jsonb       not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create index credit_ledger_user_idx on credit_ledger (user_id, created_at desc);
create index credit_ledger_entity_idx on credit_ledger (related_entity_type, related_entity_id);

revoke update, delete on credit_ledger from public;

-- ---------------------------------------------------------------- links

create table links (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references profiles(id) on delete cascade,
  slug              text not null unique,
  destination_url   text not null,
  domain            text not null,
  display_name      text not null,
  short_description text,
  image_url         text,
  moderation_status moderation_status not null default 'pending',
  moderation_note   text,
  enabled           boolean     not null default true,
  total_opens       bigint      not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index links_owner_idx on links (owner_id, created_at desc);
create index links_moderation_idx on links (moderation_status, created_at desc);
create index links_domain_idx on links (domain);

create table blocked_domains (
  domain     text primary key,
  reason     text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- placements

-- One canonical link may hold one placement of each type simultaneously.
-- remaining_credit_cents is drained ONLY by qualified outbound clicks.
create table placements (
  id                    uuid primary key default gen_random_uuid(),
  link_id               uuid not null references links(id) on delete cascade,
  owner_id              uuid not null references profiles(id) on delete cascade,
  placement_type        placement_type   not null,
  remaining_credit_cents bigint          not null default 0 check (remaining_credit_cents >= 0),
  status                placement_status not null default 'pending',
  opens_count           bigint           not null default 0,
  activated_at          timestamptz,
  exhausted_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (link_id, placement_type)
);
create index placements_active_idx on placements (placement_type, status) where status = 'active';
create index placements_owner_idx on placements (owner_id);

-- ---------------------------------------------------------------- board rounds

create table daily_rounds (
  id         uuid primary key default gen_random_uuid(),
  starts_at  timestamptz  not null,
  ends_at    timestamptz  not null,
  status     round_status not null default 'active',
  created_at timestamptz  not null default now()
);
create unique index daily_rounds_one_active_idx on daily_rounds (status) where status = 'active';
create index daily_rounds_starts_idx on daily_rounds (starts_at desc);

-- INVARIANT: score_cents only ever INCREASES, and only when board credit is
-- added during this round. Qualified clicks never reduce it.
create table board_round_entries (
  id            uuid primary key default gen_random_uuid(),
  round_id      uuid   not null references daily_rounds(id) on delete cascade,
  placement_id  uuid   not null references placements(id) on delete cascade,
  score_cents   bigint not null default 0 check (score_cents >= 0),
  opens_count   bigint not null default 0,
  previous_rank integer,
  final_rank    integer,
  activated_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (round_id, placement_id)
);
create index board_round_entries_rank_idx
  on board_round_entries (round_id, score_cents desc, previous_rank nulls last, activated_at, placement_id);

-- ---------------------------------------------------------------- spot

create table spot_schedules (
  id           uuid primary key default gen_random_uuid(),
  placement_id uuid not null references placements(id) on delete cascade,
  round_id     uuid references daily_rounds(id) on delete cascade,
  starts_at    timestamptz      not null,
  ends_at      timestamptz      not null,
  status       spot_slot_status not null default 'scheduled',
  created_at   timestamptz not null default now()
);
create index spot_schedules_window_idx on spot_schedules (starts_at, ends_at);
create index spot_schedules_upcoming_idx on spot_schedules (status, starts_at) where status = 'scheduled';
create index spot_schedules_placement_idx on spot_schedules (placement_id, starts_at);

-- ---------------------------------------------------------------- bar

create table bar_queue (
  id           uuid primary key default gen_random_uuid(),
  placement_id uuid not null unique references placements(id) on delete cascade,
  queue_position integer not null,
  entered_at   timestamptz not null default now()
);
create index bar_queue_position_idx on bar_queue (queue_position);

-- ---------------------------------------------------------------- creators

create table creator_referrals (
  id              uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references profiles(id) on delete cascade,
  referral_code   text not null unique,
  target_type     text not null default 'home',
  target_id       uuid,
  clicks_count    bigint not null default 0,
  created_at      timestamptz not null default now()
);
create index creator_referrals_user_idx on creator_referrals (creator_user_id, created_at desc);

create table creator_sessions (
  id                  uuid primary key default gen_random_uuid(),
  creator_user_id     uuid not null references profiles(id) on delete cascade,
  referral_id         uuid references creator_referrals(id) on delete set null,
  anonymous_visitor_id text not null,
  first_seen_at       timestamptz not null default now(),
  expires_at          timestamptz not null,
  unique (anonymous_visitor_id)
);
create index creator_sessions_lookup_idx on creator_sessions (anonymous_visitor_id, expires_at desc);

-- ---------------------------------------------------------------- clicks

create table click_events (
  id                   uuid primary key default gen_random_uuid(),
  placement_id         uuid not null references placements(id) on delete cascade,
  link_id              uuid not null references links(id) on delete cascade,
  anonymous_visitor_id text not null,
  ip_hash              text,
  user_agent           text,
  creator_referral_id  uuid references creator_referrals(id) on delete set null,
  creator_user_id      uuid references profiles(id) on delete set null,
  qualified            boolean not null,
  rejection_reason     text,
  debit_cents          bigint  not null default 0,
  creator_earning_cents bigint not null default 0,
  created_at           timestamptz not null default now()
);
create index click_events_placement_idx on click_events (placement_id, created_at desc);
-- Duplicate-window lookup: same visitor → same canonical link.
create index click_events_dedupe_idx on click_events (anonymous_visitor_id, link_id, created_at desc)
  where qualified;
create index click_events_creator_idx on click_events (creator_user_id, created_at desc) where creator_user_id is not null;
create index click_events_recent_idx on click_events (created_at desc);

create table creator_earnings (
  id              uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references profiles(id) on delete cascade,
  click_event_id  uuid not null unique references click_events(id) on delete cascade,
  amount_cents    bigint not null check (amount_cents >= 0),
  status          earning_status not null default 'pending',
  available_at    timestamptz not null,
  created_at      timestamptz not null default now()
);
create index creator_earnings_user_idx on creator_earnings (creator_user_id, status, available_at);

create table payout_requests (
  id              uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references profiles(id) on delete cascade,
  amount_cents    bigint not null check (amount_cents > 0),
  status          payout_status not null default 'requested',
  admin_notes     text,
  created_at      timestamptz not null default now(),
  processed_at    timestamptz
);
create index payout_requests_status_idx on payout_requests (status, created_at desc);

-- ---------------------------------------------------------------- stripe

create table stripe_payments (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles(id) on delete cascade,
  stripe_session_id        text not null unique,
  stripe_payment_intent_id text,
  stripe_event_id          text unique,
  amount_cents             bigint not null check (amount_cents > 0),
  status                   payment_status not null default 'pending',
  processed_at             timestamptz,
  created_at               timestamptz not null default now()
);
create index stripe_payments_user_idx on stripe_payments (user_id, created_at desc);

-- ---------------------------------------------------------------- admin

create table app_settings (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

create table admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid references profiles(id) on delete set null,
  action        text not null,
  target_type   text,
  target_id     uuid,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index admin_audit_log_idx on admin_audit_log (created_at desc);
