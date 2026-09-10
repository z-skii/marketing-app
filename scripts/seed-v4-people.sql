-- TapMart V4 marketplace people seed. DEV ONLY, never production.
-- Five demo earners for the business marketplace (Business Home, search,
-- direct requests). Every account is *@example.test, signs in with the dev
-- password, and is prefixed "demo_" (usernames allow letters, digits, _ and .) so seeded rows are unmistakable. Media
-- reuses the files under public/uploads/seed; no new binaries.
--
--   demo_jasmine  Raleigh, NC   verified, Instagram connected (admin-confirmed count), 2 paid jobs, 2 reviews
--   demo_marcus   Durham, NC    verified, Instagram pending (handle only, no count), 1 paid job, 1 review, a listed car
--   demo_priya    Cary, NC      Instagram connected (admin-confirmed count), portfolio
--   demo_tyler    Raleigh, NC   no Instagram, 1 paid job, 1 review
--   demo_lena     Durham, NC    new, portfolio only
--
-- Usage: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/seed-v4-people.sql
-- Safe to re-run: nothing is duplicated. Requires scripts/seed-v2.sql
-- (the Demo Coffee Co. Recreate campaign carries the paid work).

do $$
declare
  reviewer uuid;
  campaign uuid;
  p_jasmine uuid; p_marcus uuid; p_priya uuid; p_tyler uuid; p_lena uuid;
  sub uuid;
  car uuid;
begin
  select id into reviewer from profiles order by created_at limit 1;
  if reviewer is null then
    raise exception 'Seed needs at least one profile. Sign up first.';
  end if;
  select id into campaign from campaigns
   where kind = 'recreate_reel' and title = '[demo] Recreate our latte pour video' order by created_at limit 1;
  if campaign is null then
    raise exception 'Run scripts/seed-v2.sql first: the demo Recreate campaign does not exist.';
  end if;

  -- ------------------------------------------------------------- accounts
  insert into auth.users (id, email)
  select gen_random_uuid(), e from (values
    ('demo-jasmine@example.test'), ('demo-marcus@example.test'), ('demo-priya@example.test'),
    ('demo-tyler@example.test'), ('demo-lena@example.test')) v(e)
  where not exists (select 1 from auth.users u where u.email = v.e);

  select id into p_jasmine from auth.users where email = 'demo-jasmine@example.test';
  select id into p_marcus  from auth.users where email = 'demo-marcus@example.test';
  select id into p_priya   from auth.users where email = 'demo-priya@example.test';
  select id into p_tyler   from auth.users where email = 'demo-tyler@example.test';
  select id into p_lena    from auth.users where email = 'demo-lena@example.test';

  insert into profiles (id, username, display_name, city, bio, avatar_url, wants_earn, onboarded_at) values
    (p_jasmine, 'demo_jasmine', 'Jasmine Reed', 'Raleigh, NC', 'Coffee, thrift and slow mornings. Seeded demo account.', '/uploads/seed/demo-latte.webp', true, now() - interval '40 days'),
    (p_marcus,  'demo_marcus',  'Marcus Bell',  'Durham, NC',  'Drives all over the Triangle. Seeded demo account.', '/uploads/seed/demo-bmw.webp', true, now() - interval '30 days'),
    (p_priya,   'demo_priya',   'Priya Nair',   'Cary, NC',    'Food and neighbourhood stories. Seeded demo account.', '/uploads/seed/demo-story.jpg', true, now() - interval '20 days'),
    (p_tyler,   'demo_tyler',   'Tyler Okafor', 'Raleigh, NC', 'Phone footage, no script. Seeded demo account.', '/uploads/seed/demo-coffee-cover.webp', true, now() - interval '12 days'),
    (p_lena,    'demo_lena',    'Lena Ortiz',   'Durham, NC',  'Just getting started. Seeded demo account.', null, true, now() - interval '3 days')
  on conflict (id) do nothing;

  perform ensure_wallet(p_jasmine), ensure_wallet(p_marcus), ensure_wallet(p_priya), ensure_wallet(p_tyler), ensure_wallet(p_lena);

  -- ------------------------------------------------------ creator profiles
  insert into creator_profiles (profile_id, categories, verification, verified_at) values
    (p_jasmine, '{"reels","stories"}', 'verified', now() - interval '35 days'),
    (p_marcus,  '{"car ads","reels"}', 'verified', now() - interval '25 days'),
    (p_priya,   '{"stories"}',          'unverified', null),
    (p_tyler,   '{"reels"}',            'pending', null),
    (p_lena,    '{}',                   'unverified', null)
  on conflict (profile_id) do nothing;

  -- ------------------------------------------------------------ instagram
  -- Connected rows are the admin-confirmed path (verified_by = manual), so
  -- their follower counts may be shown. The pending row has no count.
  insert into social_accounts (profile_id, provider, handle, follower_count, status, verified_by, connected_at) values
    (p_jasmine, 'instagram', 'jasmine.reed.demo', 12400, 'connected', 'manual', now() - interval '35 days'),
    (p_priya,   'instagram', 'priya.eats.demo',    3200, 'connected', 'manual', now() - interval '18 days'),
    (p_marcus,  'instagram', 'marcusbell.demo',    null, 'pending',   'none',   null)
  on conflict (profile_id, provider) do nothing;

  -- ------------------------------------------------- paid work and reviews
  -- Each review hangs off a paid submission on the demo Recreate campaign,
  -- and the creator's rating is the average of exactly those rows.
  if not exists (select 1 from submissions where campaign_id = campaign and creator_id = p_jasmine) then
    insert into submissions (campaign_id, creator_id, media_urls, note, rights_ack, status, reviewed_at, paid_at, created_at)
    values (campaign, p_jasmine, '{"/uploads/seed/demo-latte.webp"}', 'Seeded demo work.', true, 'paid', now() - interval '20 days', now() - interval '20 days', now() - interval '21 days')
    returning id into sub;
    insert into reviews (reviewer_id, subject_type, subject_id, context_type, context_id, rating, body, created_at)
    values (reviewer, 'profile', p_jasmine, 'submission', sub, 5, 'Fast, exactly the brief, and the pour looked great.', now() - interval '19 days')
    on conflict do nothing;

    insert into submissions (campaign_id, creator_id, media_urls, note, rights_ack, status, reviewed_at, paid_at, created_at)
    values (campaign, p_jasmine, '{"/uploads/seed/demo-coffee-cover.webp"}', 'Seeded demo work, second take.', true, 'paid', now() - interval '8 days', now() - interval '8 days', now() - interval '9 days')
    returning id into sub;
    insert into reviews (reviewer_id, subject_type, subject_id, context_type, context_id, rating, body, created_at)
    values (reviewer, 'profile', p_jasmine, 'submission', sub, 5, 'Second one was even better. Would ask again.', now() - interval '7 days')
    on conflict do nothing;
  end if;

  if not exists (select 1 from submissions where campaign_id = campaign and creator_id = p_marcus) then
    insert into submissions (campaign_id, creator_id, media_urls, note, rights_ack, status, reviewed_at, paid_at, created_at)
    values (campaign, p_marcus, '{"/uploads/seed/demo-coffee-cover.webp"}', 'Seeded demo work.', true, 'paid', now() - interval '14 days', now() - interval '14 days', now() - interval '15 days')
    returning id into sub;
    insert into reviews (reviewer_id, subject_type, subject_id, context_type, context_id, rating, body, created_at)
    values (reviewer, 'profile', p_marcus, 'submission', sub, 4, 'Good energy, a little long. Easy to work with.', now() - interval '13 days')
    on conflict do nothing;
  end if;

  if not exists (select 1 from submissions where campaign_id = campaign and creator_id = p_tyler) then
    insert into submissions (campaign_id, creator_id, media_urls, note, rights_ack, status, reviewed_at, paid_at, created_at)
    values (campaign, p_tyler, '{"/uploads/seed/demo-latte.webp"}', 'Seeded demo work.', true, 'paid', now() - interval '5 days', now() - interval '5 days', now() - interval '6 days')
    returning id into sub;
    insert into reviews (reviewer_id, subject_type, subject_id, context_type, context_id, rating, body, created_at)
    values (reviewer, 'profile', p_tyler, 'submission', sub, 5, 'Natural on camera. Delivered a day early.', now() - interval '4 days')
    on conflict do nothing;
  end if;

  -- Ratings and completed counts derived from the rows above, never typed in.
  update creator_profiles cp
     set rating_avg = sub.avg, rating_count = sub.n,
         completed_jobs = greatest(cp.completed_jobs,
           (select count(*) from submissions s where s.creator_id = cp.profile_id and s.status = 'paid'))
    from (select subject_id, round(avg(rating)::numeric, 2) as avg, count(*)::int as n
            from reviews where subject_type = 'profile' group by subject_id) sub
   where cp.profile_id = sub.subject_id
     and cp.profile_id in (p_jasmine, p_marcus, p_priya, p_tyler, p_lena);

  -- ------------------------------------------------------------ portfolio
  insert into portfolio_items (profile_id, media_url, caption, sort)
  select v.pid, v.url, v.cap, v.s from (values
    (p_priya, '/uploads/seed/demo-story.jpg',        'Iced latte story', 0),
    (p_priya, '/uploads/seed/demo-latte.webp',       'Slow pour', 1),
    (p_lena,  '/uploads/seed/demo-coffee-cover.webp','Counter light', 0),
    (p_jasmine, '/uploads/seed/demo-story.jpg',      'Story frame', 0)) v(pid, url, cap, s)
  where not exists (select 1 from portfolio_items pi where pi.profile_id = v.pid and pi.media_url = v.url);

  -- ------------------------------------------------------------- vehicle
  -- Marcus lists a car with three open placements (the seed photo is the
  -- demo BMW, so the car is a BMW).
  select id into car from vehicles where owner_id = p_marcus and make = 'BMW' and model = '328i' limit 1;
  if car is null then
    insert into vehicles (owner_id, year, make, model, body_type, color, monthly_miles, city, radius_miles, status, available)
    values (p_marcus, 2017, 'BMW', '328i', 'Sedan', 'Black', 1200, 'Durham, NC', 25, 'listed', true)
    returning id into car;
    insert into vehicle_zones (vehicle_id, zone, available, asking_cents_monthly) values
      (car, 'rear_window', true, 8000),
      (car, 'driver_door', true, 11000),
      (car, 'passenger_door', true, 11000),
      (car, 'full_wrap', false, null)
    on conflict do nothing;
    insert into vehicle_photos (vehicle_id, angle, url) values (car, 'driver_side', '/uploads/seed/demo-bmw.webp');
  end if;

  raise notice 'Seeded people: demo_jasmine %, demo_marcus %, demo_priya %, demo_tyler %, demo_lena %; vehicle %',
    p_jasmine, p_marcus, p_priya, p_tyler, p_lena, car;
end $$;
