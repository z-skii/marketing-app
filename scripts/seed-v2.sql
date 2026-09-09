-- TapMart V2 demo seed — DEV ONLY, never production.
-- Every name is prefixed "Demo" so seeded rows are unmistakable.
-- Usage: psql "$DATABASE_URL" -f scripts/seed-v2.sql
-- Requires at least one existing profile (the dev admin) to own things.

do $$
declare
  owner uuid;
  demo_business uuid;
  demo_campaign uuid;
  demo_job uuid;
  demo_vehicle uuid;
begin
  select id into owner from profiles order by created_at limit 1;
  if owner is null then
    raise exception 'Seed needs at least one profile — sign up first.';
  end if;

  -- A demo business with a campaign and a professional job.
  insert into businesses (owner_id, name, slug, category, description, city)
  values (owner, 'Demo Coffee Co.', 'demo-coffee-co', 'Coffee shop',
          'Demo business seeded for development. Not a real company.', 'Raleigh, NC')
  on conflict do nothing
  returning id into demo_business;
  if demo_business is null then
    select id into demo_business from businesses where slug = 'demo-coffee-co';
  end if;

  insert into business_members (business_id, profile_id, member_role)
  values (demo_business, owner, 'owner') on conflict do nothing;

  insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots,
                         city, verified_only, status, published_at)
  values
    (demo_business, owner, 'ugc', '[demo] Recreate our latte pour video',
     'Film a 15–25 second vertical video recreating our slow-pour latte clip. Casual phone footage, mention Demo Coffee once. This is seeded demo data.',
     4000, 10, 'Raleigh, NC', false, 'open', now())
  returning id into demo_campaign;

  insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots,
                         city, verified_only, status, published_at, event_at)
  values
    (demo_business, owner, 'photography', '[demo] Coffee shop photoshoot',
     'Two-hour shoot at the demo shop: interior, drinks, staff. 20 edited photos delivered. Seeded demo data.',
     25000, 1, 'Raleigh, NC', true, 'open', now(), now() + interval '9 days')
  returning id into demo_job;

  -- A demo vehicle with zones.
  insert into vehicles (owner_id, year, make, model, body_type, color, monthly_miles,
                        city, radius_miles, status)
  values (owner, 2019, 'BMW', '330i', 'Sedan', 'Black', 1400, 'Raleigh, NC', 20, 'listed')
  returning id into demo_vehicle;

  insert into vehicle_zones (vehicle_id, zone, available, asking_cents_monthly) values
    (demo_vehicle, 'rear_window', true, 9000),
    (demo_vehicle, 'driver_door', true, 12500),
    (demo_vehicle, 'passenger_door', true, 12500),
    (demo_vehicle, 'full_wrap', false, null)
  on conflict do nothing;

  -- A welcome notification so the alerts screen isn't empty.
  insert into notifications (profile_id, category, title, body, href)
  values (owner, 'system', '[demo] Welcome to TapMart V2',
          'This notification came from the dev seed script.', '/home');

  raise notice 'Seeded: business %, campaigns % and %, vehicle %',
    demo_business, demo_campaign, demo_job, demo_vehicle;
end $$;
