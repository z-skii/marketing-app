-- TapMart V3 business services demo seed. DEV ONLY, never production.
-- Adds to the Demo Coffee Co. business created by scripts/seed-v2.sql:
--   one planned content shoot on the 18th of next month,
--   an approved brand kit,
--   six template calendar posts for the current month.
-- Usage: psql "$DATABASE_URL" -f scripts/seed-v3-business.sql
-- Safe to re-run: nothing is duplicated.

do $$
declare
  demo_business uuid;
  month_start date := date_trunc('month', current_date)::date;
  next_18th date := (date_trunc('month', current_date) + interval '1 month' + interval '17 days')::date;
  post_day date;
  i int;
  posted int := 0;
  titles text[] := array[
    '[demo] Behind the counter', '[demo] This week''s favourite', '[demo] Today''s hours',
    '[demo] How it is made', '[demo] The team', '[demo] Poll: this or that'
  ];
  captions text[] := array[
    'Ten seconds of the pour as it happens. No script, name Demo Coffee once.',
    'One drink, plain background, daylight. Name and price in the caption.',
    'Opening hours on a plain background in brand colours, address sticker.',
    'Start to finish of one drink in three cuts. Hands and detail over faces.',
    'One person, first name, what they do here.',
    'Two drinks side by side and a poll sticker. Reply to whoever votes.'
  ];
  formats text[] := array['reel', 'photo', 'story', 'reel', 'photo', 'story'];
  thumbs text[] := array['/uploads/seed/demo-latte.webp', '/uploads/seed/demo-coffee-cover.webp'];
begin
  select id into demo_business from businesses where lower(slug) = 'demo-coffee-co';
  if demo_business is null then
    raise exception 'Run scripts/seed-v2.sql first: demo-coffee-co does not exist.';
  end if;

  -- One planned shoot on the 18th of next month.
  if not exists (select 1 from content_shoots where business_id = demo_business and scheduled_for = next_18th) then
    insert into content_shoots (business_id, scheduled_for, status, photos_planned, videos_planned, notes)
    values (demo_business, next_18th, 'planned', 10, 3, 'Seeded demo shoot. Not a real booking.');
  end if;

  -- An approved brand kit, mirrored into businesses.brand like approveBrandKit does.
  insert into brand_kits (business_id, kit, proposed, proposed_source, status, approved_at, updated_at)
  values (
    demo_business,
    jsonb_build_object(
      'logo_url', null,
      'palette', jsonb_build_array('#0B0D0E', '#C8FF3D', '#F7F7F5'),
      'type', jsonb_build_object('display', 'Archivo', 'body', 'Inter'),
      'tone', 'Warm and unhurried. First names, short sentences, no exclamation marks.',
      'photo_style', 'Natural window light, close on hands and cups, steam and texture over wide shots.',
      'content_style', 'Behind the counter moments, one drink per post, people over decor.',
      'guidelines', jsonb_build_array(
        'Always spell the name exactly: Demo Coffee Co.',
        'Use #0B0D0E for text and #C8FF3D for one accent per post.',
        'One idea per post. No stock photos.'),
      'image_examples', jsonb_build_array('/uploads/seed/demo-latte.webp', '/uploads/seed/demo-coffee-cover.webp')
    ),
    null, null, 'approved', now(), now()
  )
  on conflict (business_id) do update
    set kit = excluded.kit, proposed = null, proposed_source = null,
        status = 'approved', approved_at = coalesce(brand_kits.approved_at, now()), updated_at = now();

  update businesses
     set brand = coalesce(brand, '{}'::jsonb)
                 || jsonb_build_object('palette', jsonb_build_array('#0B0D0E', '#C8FF3D', '#F7F7F5'),
                                       'colors', '#0B0D0E, #C8FF3D, #F7F7F5'),
         updated_at = now()
   where id = demo_business;

  -- Six template posts for the current month on Mon/Wed/Fri at 11:00 UTC,
  -- skipped when the month already has template or AI drafts.
  if not exists (
    select 1 from calendar_posts
     where business_id = demo_business and source in ('ai', 'template')
       and coalesce(scheduled_for, recommended_time) >= month_start
       and coalesce(scheduled_for, recommended_time) < month_start + interval '1 month'
  ) then
    i := 0;
    post_day := month_start;
    while posted < 6 and post_day < month_start + interval '1 month' loop
      if extract(isodow from post_day) in (1, 3, 5) then
        i := i + 1;
        posted := posted + 1;
        insert into calendar_posts
          (business_id, platform, status, title, copy, caption, format, source, thumbnail_url, recommended_time, scheduled_for)
        values (
          demo_business, 'instagram', 'idea', titles[i], captions[i], captions[i], formats[i], 'template',
          thumbs[((i - 1) % 2) + 1],
          (post_day::timestamp + interval '11 hours') at time zone 'UTC',
          (post_day::timestamp + interval '11 hours') at time zone 'UTC'
        );
      end if;
      post_day := post_day + 1;
    end loop;
  end if;
end $$;
