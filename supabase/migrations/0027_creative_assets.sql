-- The creative asset library: everything the OpenAI creative system makes
-- for a business is saved here as a draft with its brief, its review, the
-- models that made it and what it cost. Nothing here is published by being
-- created; only an approved final asset may be picked up by a campaign or
-- publishing flow, and that flow records the pick itself.
create table creative_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  type text not null check (type in ('STORY_AD', 'RECREATE_COVER', 'CAR_AD_PREVIEW', 'SOCIAL_POST', 'CAMPAIGN_COVER', 'BRAND_ASSET')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  stage text not null default 'draft' check (stage in ('draft', 'final')),
  url text not null,
  aspect text not null,
  size text,
  width int,
  height int,
  director_model text not null,
  image_model text not null,
  prompt text not null,
  version int not null default 1,
  round int not null default 1,
  parent_id uuid references creative_assets(id) on delete set null,
  source_urls text[] not null default '{}',
  brief jsonb not null default '{}'::jsonb,
  review jsonb,
  usage jsonb not null default '[]'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references profiles(id) on delete set null
);
create index creative_assets_business_idx on creative_assets (business_id, created_at desc);
create index creative_assets_campaign_idx on creative_assets (campaign_id) where campaign_id is not null;
