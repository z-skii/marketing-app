-- TapMart business marketplace: direct requests to people and cars, real
-- provider connections for Instagram and Google, content deliverables from
-- verified creators, and brand research inputs.
--
-- Nothing here fakes data. Every provider row records where it came from,
-- and every deliverable records who uploaded it.

-- ------------------------------------------------------- direct requests
-- A campaign is either public (on User Home for everyone eligible) or direct
-- (sent to one person, optionally for one of their cars). Direct campaigns
-- reuse the whole campaign, submission, booking and pay machinery; the only
-- extra is the invite row that carries the offer and the person's answer.
alter table campaigns add column if not exists audience text not null default 'public'
  check (audience in ('public', 'direct'));
alter table campaigns add column if not exists target_profile_id uuid references profiles(id) on delete set null;
alter table campaigns add column if not exists target_vehicle_id uuid references vehicles(id) on delete set null;
create index if not exists campaigns_target_idx on campaigns (target_profile_id) where audience = 'direct';

create table if not exists campaign_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete set null,
  business_id uuid not null references businesses(id) on delete cascade,
  kind campaign_kind not null,
  pay_cents bigint not null default 0,
  message text,
  status text not null default 'sent'
    check (status in ('sent', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (campaign_id, profile_id)
);
create index if not exists campaign_invites_profile_idx on campaign_invites (profile_id, status);
create index if not exists campaign_invites_business_idx on campaign_invites (business_id, status);

-- --------------------------------------------------- provider connections
-- Business connections (Instagram, Facebook, TikTok, Google Business).
-- Tokens are stored server-side only; `meta` holds what the provider told us
-- (ids, names, the chosen Google location). `source` says how the row was
-- made: oauth (the real integration) or manual (a person typed a handle).
alter table connected_accounts add column if not exists external_id text;
alter table connected_accounts add column if not exists avatar_url text;
alter table connected_accounts add column if not exists access_token text;
alter table connected_accounts add column if not exists refresh_token text;
alter table connected_accounts add column if not exists token_expires_at timestamptz;
alter table connected_accounts add column if not exists scope text;
alter table connected_accounts add column if not exists source text not null default 'manual'
  check (source in ('oauth', 'manual'));
alter table connected_accounts add column if not exists meta jsonb not null default '{}'::jsonb;
alter table connected_accounts add column if not exists last_error text;
alter table connected_accounts add column if not exists last_synced_at timestamptz;

-- Person connections (a user's own Instagram). Same idea, on social_accounts.
alter table social_accounts add column if not exists external_id text;
alter table social_accounts add column if not exists avatar_url text;
alter table social_accounts add column if not exists access_token text;
alter table social_accounts add column if not exists token_expires_at timestamptz;
alter table social_accounts add column if not exists meta jsonb not null default '{}'::jsonb;
alter table social_accounts add column if not exists last_error text;
alter table social_accounts add column if not exists last_synced_at timestamptz;

-- Short-lived OAuth state, so a callback can be tied to the person and the
-- business that started it.
create table if not exists oauth_states (
  state text primary key,
  provider text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  return_to text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------ content deliverables
-- What a verified creator delivered for a shoot. One row per photo or video.
-- Only the assigned creator (or an admin) can insert for a shoot; the
-- business approves, schedules and publishes.
alter table content_shoots add column if not exists completed_at timestamptz;
alter table content_shoots add column if not exists starts_at time;
alter table content_shoots add column if not exists delivery_status text not null default 'none'
  check (delivery_status in ('none', 'processing', 'delivered'));

create table if not exists content_deliverables (
  id uuid primary key default gen_random_uuid(),
  shoot_id uuid not null references content_shoots(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  kind text not null check (kind in ('photo', 'video')),
  url text not null,
  thumbnail_url text,
  caption text,
  status text not null default 'new'
    check (status in ('new', 'approved', 'rejected', 'scheduled', 'published')),
  edit_note text,
  calendar_post_id uuid references calendar_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_deliverables_business_idx on content_deliverables (business_id, status);
create index if not exists content_deliverables_shoot_idx on content_deliverables (shoot_id);

alter table calendar_posts add column if not exists deliverable_id uuid references content_deliverables(id) on delete set null;

-- ------------------------------------------------------------ brand research
-- What the research looked at (which sources were live, what each yielded)
-- and the signals the business already has, kept apart from suggestions.
alter table brand_kits add column if not exists research jsonb;
alter table brand_kits add column if not exists existing_signals jsonb;
alter table brand_kits add column if not exists researched_at timestamptz;

