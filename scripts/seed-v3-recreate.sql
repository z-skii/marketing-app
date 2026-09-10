-- TapMart V3 Recreate loop demo seed. DEV ONLY, never production.
-- Adds curated and manual trend rows for the demo businesses and gives the
-- demo Recreate campaign a creator guide. Requires scripts/seed-v2.sql to
-- have run (it creates demo-coffee-co and demo-roastery).
-- Usage: psql "$DATABASE_URL" -f scripts/seed-v3-recreate.sql
-- Safe to re-run: rows are matched by reference_url and updated in place.

do $$
declare
  owner uuid;
  demo_business uuid;
  demo_roastery uuid;
  guide jsonb;
begin
  select id into demo_business from businesses where lower(slug) = 'demo-coffee-co';
  select id into demo_roastery from businesses where lower(slug) = 'demo-roastery';
  if demo_business is null or demo_roastery is null then
    raise exception 'Run scripts/seed-v2.sql first: demo businesses are missing.';
  end if;
  select owner_id into owner from businesses where id = demo_business;

  -- Two curated trends for every "Coffee shop" business. `views` stays null:
  -- TapMart never invents platform numbers. Matched by link on re-runs.
  if not exists (select 1 from trend_items where source = 'curated'
                   and reference_url = 'https://www.instagram.com/reel/demo-employee-pov-opening') then
    insert into trend_items (source, business_id, category, title, platform, reference_url, media_url, thumbnail_url,
                             views, growth_note, fit_note, status, created_by)
    values ('curated', null, 'Coffee shop', 'Employee POV: opening the shop', 'instagram',
            'https://www.instagram.com/reel/demo-employee-pov-opening', '/uploads/seed/demo-latte.webp',
            '/uploads/seed/demo-latte.webp', null, 'Curated by TapMart', 'Matches a cafe with a visible counter', 'active', owner);
  else
    update trend_items set title = 'Employee POV: opening the shop', category = 'Coffee shop', platform = 'instagram',
           media_url = '/uploads/seed/demo-latte.webp', thumbnail_url = '/uploads/seed/demo-latte.webp', views = null,
           growth_note = 'Curated by TapMart', fit_note = 'Matches a cafe with a visible counter', status = 'active'
     where source = 'curated' and reference_url = 'https://www.instagram.com/reel/demo-employee-pov-opening';
  end if;

  if not exists (select 1 from trend_items where source = 'curated'
                   and reference_url = 'https://www.instagram.com/reel/demo-first-sip') then
    insert into trend_items (source, business_id, category, title, platform, reference_url, media_url, thumbnail_url,
                             views, growth_note, fit_note, status, created_by)
    values ('curated', null, 'Coffee shop', 'First sip, one take', 'instagram',
            'https://www.instagram.com/reel/demo-first-sip', '/uploads/seed/demo-latte.webp',
            '/uploads/seed/demo-latte.webp', null, 'Curated by TapMart', 'Matches a cafe with a visible counter', 'active', owner);
  else
    update trend_items set title = 'First sip, one take', category = 'Coffee shop', platform = 'instagram',
           media_url = '/uploads/seed/demo-latte.webp', thumbnail_url = '/uploads/seed/demo-latte.webp', views = null,
           growth_note = 'Curated by TapMart', fit_note = 'Matches a cafe with a visible counter', status = 'active'
     where source = 'curated' and reference_url = 'https://www.instagram.com/reel/demo-first-sip';
  end if;

  -- One link Demo Coffee Co. pasted itself.
  if not exists (select 1 from trend_items where source = 'manual' and business_id = demo_business
                   and reference_url = 'https://www.instagram.com/reel/demo-latte-art-pasted') then
    insert into trend_items (source, business_id, category, title, platform, reference_url, media_url, thumbnail_url,
                             views, growth_note, fit_note, status, created_by)
    values ('manual', demo_business, 'Coffee shop', '[demo] Latte art reel we liked', 'instagram',
            'https://www.instagram.com/reel/demo-latte-art-pasted', null, null, null, null, null, 'active', owner);
  end if;

  -- The demo Recreate campaign gets a creator guide (template source: no
  -- model wrote it) so the creator screen has real steps to show.
  guide := jsonb_build_object(
    'steps', jsonb_build_array(
      jsonb_build_object('n', 1, 'text', 'Start outside the shop.', 'frame_url', '/uploads/seed/demo-coffee-cover.webp', 'timing', '0 to 4 s'),
      jsonb_build_object('n', 2, 'text', 'Walk in while filming.', 'frame_url', null, 'timing', '4 to 8 s'),
      jsonb_build_object('n', 3, 'text', 'Show the latte being poured.', 'frame_url', '/uploads/seed/demo-latte.webp', 'timing', '8 to 15 s'),
      jsonb_build_object('n', 4, 'text', 'Take the first sip.', 'frame_url', null, 'timing', '15 to 20 s'),
      jsonb_build_object('n', 5, 'text', 'End on the Demo Coffee sign.', 'frame_url', null, 'timing', '20 to 25 s')
    ),
    'duration_seconds', jsonb_build_array(15, 25),
    'orientation', 'vertical',
    'rules', jsonb_build_array('Say Demo Coffee once', 'Film at the shop on the day', 'Keep the shot order'),
    'avoid', jsonb_build_array('Stock footage', 'Other shops'' logos'),
    'checklist', jsonb_build_array('Demo Coffee visible at least once', 'The latte on screen', '15 to 25 seconds', 'Vertical 9:16'),
    'source', 'template'
  );
  update campaigns
     set details = details || jsonb_build_object('guide', guide)
   where business_id = demo_business and kind = 'recreate_reel'
     and title = '[demo] Recreate our latte pour video';

  raise notice 'Seeded Recreate loop: trends for % and %, guide on the demo campaign', demo_business, demo_roastery;
end $$;
