-- TapMart V2 demo seed. DEV ONLY, never production.
-- Every name is prefixed "Demo" so seeded rows are unmistakable, and the
-- photos are generated stock under public/uploads/seed (no real brands).
-- Usage: psql "$DATABASE_URL" -f scripts/seed-v2.sql
-- Safe to re-run: existing demo rows are updated, not duplicated.
-- Requires at least one existing profile (the dev admin) to own things.

do $$
declare
  owner uuid;
  demo_business uuid;
  demo_roastery uuid;
  demo_campaign uuid;
  demo_job uuid;
  demo_vehicle uuid;
begin
  select id into owner from profiles order by created_at limit 1;
  if owner is null then
    raise exception 'Seed needs at least one profile. Sign up first.';
  end if;

  -- Two demo businesses with cover photography, so the feed has media.
  insert into businesses (owner_id, name, slug, category, description, city, cover_url)
  values (owner, 'Demo Coffee Co.', 'demo-coffee-co', 'Coffee shop',
          'Demo business seeded for development. Not a real company.', 'Raleigh, NC',
          '/uploads/seed/demo-coffee-cover.webp')
  on conflict (lower(slug)) do update set cover_url = excluded.cover_url
  returning id into demo_business;

  insert into businesses (owner_id, name, slug, category, description, city, cover_url)
  values (owner, 'Demo Roastery', 'demo-roastery', 'Cafe',
          'Second demo business seeded for development. Not a real company.', 'Raleigh, NC',
          '/uploads/seed/demo-latte.webp')
  on conflict (lower(slug)) do update set cover_url = excluded.cover_url
  returning id into demo_roastery;

  insert into business_members (business_id, profile_id, member_role)
  values (demo_business, owner, 'owner'), (demo_roastery, owner, 'owner')
  on conflict do nothing;

  -- Campaigns: only insert the ones that are not there yet.
  if not exists (select 1 from campaigns where business_id = demo_business and title = '[demo] Recreate our latte pour video') then
    insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots,
                           city, verified_only, status, published_at)
    values
      (demo_business, owner, 'ugc', '[demo] Recreate our latte pour video',
       'Film a 15 to 25 second vertical video recreating our slow-pour latte clip. Casual phone footage, mention Demo Coffee once. This is seeded demo data.',
       4000, 10, 'Raleigh, NC', false, 'open', now())
    returning id into demo_campaign;
  end if;

  if not exists (select 1 from campaigns where business_id = demo_business and title = '[demo] Coffee shop photoshoot') then
    insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots,
                           city, verified_only, status, published_at, event_at)
    values
      (demo_business, owner, 'photography', '[demo] Coffee shop photoshoot',
       'Two-hour shoot at the demo shop: interior, drinks, staff. 20 edited photos delivered. Seeded demo data.',
       25000, 1, 'Raleigh, NC', true, 'open', now(), now() + interval '9 days')
    returning id into demo_job;
  end if;

  if not exists (select 1 from campaigns where business_id = demo_roastery and title = '[demo] Post your iced latte') then
    insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots,
                           city, verified_only, status, published_at, deadline)
    values
      (demo_roastery, owner, 'content', '[demo] Post your iced latte',
       'Grab any iced drink, post a photo or a short clip and tag the shop. We pay per approved post. Seeded demo data.',
       2500, 20, 'Raleigh, NC', false, 'open', now() - interval '2 days', now() + interval '12 days');
  end if;

  -- One demo vehicle with zones and a real-looking photo.
  select id into demo_vehicle from vehicles
   where owner_id = owner and make = 'BMW' and model = '330i' order by created_at limit 1;
  if demo_vehicle is null then
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
  end if;

  if not exists (select 1 from vehicle_photos where vehicle_id = demo_vehicle) then
    insert into vehicle_photos (vehicle_id, angle, url)
    values (demo_vehicle, 'driver_side', '/uploads/seed/demo-bmw.webp');
  end if;

  -- Two marketing ideas so the dashboard shows the "turn into a campaign" flow.
  if not exists (select 1 from marketing_recommendations where business_id = demo_business) then
    insert into marketing_recommendations (business_id, title, body, prefill) values
      (demo_business, '[demo] POV visit videos are pulling views',
       'Short first-person "come with me" videos of a normal visit read as authentic and get shared locally. Real customers filming, not a crew.',
       '{"kind":"ugc","title":"POV visit video for Demo Coffee Co.","brief":"Film a 15 to 25 second vertical POV video of a real visit: walking in, the drink, one genuine reaction. Casual phone footage is exactly right. Mention us by name once.","payDollars":40,"slots":10,"requirements":["15 to 25 seconds","vertical 9:16","business name mentioned","your real visit, no stock footage"]}'::jsonb),
      (demo_business, '[demo] Fresh photos beat stale listings',
       'Profiles with recent photos convert better on Google and Instagram. One short shoot refreshes your whole presence.',
       '{"kind":"photography","title":"Photo refresh for Demo Coffee Co.","brief":"A 1 to 2 hour shoot at the shop: exterior, interior, drinks close up, a few people shots. Deliver 20 edited photos we can use across Google, Instagram and the site.","payDollars":250,"slots":1,"requirements":["20 edited photos","shot on location","usable for social and Google profile"]}'::jsonb);
  end if;

  -- A welcome notification so the alerts screen isn't empty.
  if not exists (select 1 from notifications where profile_id = owner and title = '[demo] Welcome to TapMart') then
    insert into notifications (profile_id, category, title, body, href)
    values (owner, 'system', '[demo] Welcome to TapMart',
            'This notification came from the dev seed script.', '/home');
  end if;

  raise notice 'Seeded: businesses % and %, vehicle %', demo_business, demo_roastery, demo_vehicle;
end $$;
