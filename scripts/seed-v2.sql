-- TapMart demo seed. DEV ONLY, never production.
-- Every name is prefixed "Demo" so seeded rows are unmistakable, and the
-- media is generated under public/uploads/seed (no real brands).
-- Usage: psql "$DATABASE_URL" -f scripts/seed-v2.sql
-- Safe to re-run: existing demo rows are updated, not duplicated.
-- Requires at least one existing profile (the dev admin) to own things.
--
-- What it creates: two demo businesses, one of each earning type
-- (Recreate a Reel, Instagram Story, Car ad), a listed vehicle, an
-- Essential subscription, a trend and an idea for the business overview.

do $$
declare
  owner uuid;
  creator uuid;
  demo_business uuid;
  demo_roastery uuid;
  demo_vehicle uuid;
begin
  select id into owner from profiles order by created_at limit 1;
  if owner is null then
    raise exception 'Seed needs at least one profile. Sign up first.';
  end if;
  select id into creator from profiles where id <> owner order by created_at limit 1;

  -- Two demo businesses with cover photography, so the feed has media.
  insert into businesses (owner_id, name, slug, category, description, city, cover_url, verification)
  values (owner, 'Demo Coffee Co.', 'demo-coffee-co', 'Coffee shop',
          'Demo business seeded for development. Not a real company.', 'Raleigh, NC',
          '/uploads/seed/demo-coffee-cover.webp', 'verified')
  on conflict (lower(slug)) do update set cover_url = excluded.cover_url, verification = excluded.verification
  returning id into demo_business;

  insert into businesses (owner_id, name, slug, category, description, city, cover_url, verification)
  values (owner, 'Demo Roastery', 'demo-roastery', 'Cafe',
          'Second demo business seeded for development. Not a real company.', 'Raleigh, NC',
          '/uploads/seed/demo-latte.webp', 'verified')
  on conflict (lower(slug)) do update set cover_url = excluded.cover_url, verification = excluded.verification
  returning id into demo_roastery;

  insert into business_members (business_id, profile_id, member_role)
  values (demo_business, owner, 'owner'), (demo_roastery, owner, 'owner')
  on conflict do nothing;

  -- Legacy demo campaigns from earlier seeds leave the marketplace.
  update campaigns set status = 'closed'
   where business_id in (demo_business, demo_roastery)
     and kind in ('photography', 'videography', 'content', 'general') and status = 'open';

  -- 1. Recreate a Reel
  if not exists (select 1 from campaigns where business_id = demo_business and title = '[demo] Recreate our latte pour video') then
    insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots, city,
                           status, published_at, deadline, requirements, reference_url, details)
    values
      (demo_business, owner, 'recreate_reel', '[demo] Recreate our latte pour video',
       'Film your own version of our slow-pour latte clip. Casual phone footage, vertical, mention Demo Coffee once. Seeded demo data.',
       7500, 8, 'Raleigh, NC', 'open', now() - interval '1 day', now() + interval '4 days',
       '{"15 to 25 seconds","Show the drink being poured","Say Demo Coffee once","Vertical 9:16"}',
       'https://www.instagram.com/reel/demo',
       '{"reference_media_url":"/uploads/seed/tapmart-recreate.jpg","duration_seconds":[15,25]}'::jsonb);
  else
    update campaigns set kind = 'recreate_reel', pay_cents = 7500, slots = 8,
           brief = 'Film your own version of our slow-pour latte clip. Casual phone footage, vertical, mention Demo Coffee once. Seeded demo data.',
           requirements = '{"15 to 25 seconds","Show the drink being poured","Say Demo Coffee once","Vertical 9:16"}',
           details = '{"reference_media_url":"/uploads/seed/tapmart-recreate.jpg","duration_seconds":[15,25]}'::jsonb,
           deadline = coalesce(deadline, now() + interval '4 days')
     where business_id = demo_business and title = '[demo] Recreate our latte pour video';
  end if;

  -- 2. Instagram Story
  if not exists (select 1 from campaigns where business_id = demo_roastery and title = '[demo] Post our iced latte story') then
    insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots, city,
                           status, published_at, deadline, requirements, details)
    values
      (demo_roastery, owner, 'instagram_story', '[demo] Post our iced latte story',
       'Share this ready-made story with your followers and keep it live for a full day. We pay per verified story. Seeded demo data.',
       2500, 20, 'Raleigh, NC', 'open', now() - interval '2 days', now() + interval '12 days',
       '{"Keep it live 24 hours","Tag @demoroastery","Do not crop the creative"}',
       '{"creative_url":"/uploads/seed/tapmart-story.jpg","min_followers":1000,"live_hours":24}'::jsonb);
  end if;
  -- The old content campaign with the previous title becomes the story campaign.
  update campaigns set status = 'closed'
   where business_id = demo_roastery and title = '[demo] Post your iced latte' and status = 'open';

  -- 3. Car ad
  if not exists (select 1 from campaigns where business_id = demo_roastery and title = '[demo] Drivers wanted in Raleigh') then
    insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots, city,
                           status, published_at, starts_on, requirements, details)
    values
      (demo_roastery, owner, 'car_ads', '[demo] Drivers wanted in Raleigh',
       'A rear-window decal for 30 days. We handle printing and installation, you drive like normal. Paid monthly. Seeded demo data.',
       30000, 3, 'Raleigh, NC', 'open', now() - interval '3 days', current_date + 6,
       '{"Drive at least 800 miles a month","Park where people can see it","One photo of the decal each week"}',
       '{"placements":["rear_window"],"duration_days":30,"vehicle_prefs":{"colors":["Black","White"],"body_types":[]},"artwork_url":"/uploads/seed/demo-car-artwork.png","media_url":"/uploads/seed/tapmart-car.jpg"}'::jsonb);
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

  -- The second account (the demo creator) has an Instagram handle on file.
  if creator is not null then
    insert into social_accounts (profile_id, provider, handle, follower_count, status, verified_by, connected_at)
    values (creator, 'instagram', 'democreator', 1850, 'connected', 'manual', now())
    on conflict (profile_id, provider) do nothing;
  end if;

  -- Demo Coffee Co. is on Essential (dev billing, no Stripe involved).
  insert into business_subscriptions (business_id, plan, status, billing, current_period_end)
  values (demo_business, 'essential', 'active', 'dev', now() + interval '30 days')
  on conflict (business_id) do nothing;

  -- One trend and one idea so the overview shows "Turn into a campaign".
  delete from marketing_recommendations where business_id = demo_business and title like '[demo]%';
  insert into marketing_recommendations (business_id, kind, title, body, stat, reference_url, prefill) values
    (demo_business, 'trend', '[demo] Employee POV videos',
     'First-person "a day behind the bar" clips are the format coffee shops are getting shared with right now. Real staff, phone footage, no script.',
     'Format seen across local coffee accounts this month', 'https://www.instagram.com/reel/demo-pov',
     '{"kind":"recreate_reel","title":"Recreate our behind-the-bar POV","brief":"Film a 15 to 25 second first-person clip of a real visit: walking in, ordering, the drink. Casual phone footage is exactly right. Say Demo Coffee once.","payDollars":50,"slots":10,"requirements":["15 to 25 seconds","Vertical 9:16","Say Demo Coffee once","Your real visit, no stock footage"]}'::jsonb),
    (demo_business, 'idea', '[demo] Put the shop on three cars this month',
     'Rear-window decals on cars that park downtown reach the people who walk past your door every day. Thirty days, paid monthly.',
     null, null,
     '{"kind":"car_ads","title":"Rear-window decals around downtown","brief":"A rear-window decal for 30 days. We print and install, you drive like normal.","payDollars":300,"slots":3,"requirements":["Drive at least 800 miles a month","One photo of the decal each week"]}'::jsonb);

  -- A welcome notification so the alerts screen isn't empty.
  if not exists (select 1 from notifications where profile_id = owner and title = '[demo] Welcome to TapMart') then
    insert into notifications (profile_id, category, title, body, href)
    values (owner, 'system', '[demo] Welcome to TapMart',
            'This notification came from the dev seed script.', '/home');
  end if;

  raise notice 'Seeded: businesses % and %, vehicle %', demo_business, demo_roastery, demo_vehicle;
end $$;
