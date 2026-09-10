-- TapMart V4 content seed. DEV ONLY, never production.
-- Puts the Content tab in its honest starting state for Demo Coffee Co.:
--   demo-creator (profile username democreator) is a verified creator,
--   this month's Demo Coffee Co. shoot is booked for them on the 18th at 2 PM,
--   template and AI calendar posts for the demo businesses are gone.
-- No deliverables are seeded: the empty states must be real.
-- Usage: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/seed-v4-content.sql
-- Safe to re-run.

do $$
declare
  demo_business uuid;
  creator uuid;
  creator_name text;
  month_start date := date_trunc('month', current_date)::date;
  shoot_day date := month_start + interval '17 days';
  shoot uuid;
begin
  select id into demo_business from businesses where lower(slug) = 'demo-coffee-co';
  if demo_business is null then
    raise exception 'Run scripts/seed-v2.sql first: demo-coffee-co does not exist.';
  end if;
  select id, coalesce(display_name, username) into creator, creator_name from profiles where username = 'democreator';
  if creator is null then
    raise exception 'Run scripts/seed-v2.sql first: democreator does not exist.';
  end if;

  -- A verified creator: the only kind that can be assigned to a shoot and upload for it.
  insert into creator_profiles (profile_id, verification, verified_at)
  values (creator, 'verified', now())
  on conflict (profile_id) do update
    set verification = 'verified', verified_at = coalesce(creator_profiles.verified_at, now());

  -- This month's shoot, booked for the creator on the 18th at 14:00.
  select id into shoot from content_shoots
   where business_id = demo_business and status <> 'cancelled'
     and scheduled_for >= month_start and scheduled_for < month_start + interval '1 month'
   order by scheduled_for limit 1;
  if shoot is null then
    insert into content_shoots (business_id, scheduled_for, status, photos_planned, videos_planned)
    values (demo_business, shoot_day, 'planned', 10, 3) returning id into shoot;
  end if;
  update content_shoots
     set scheduled_for = shoot_day, starts_at = time '14:00', status = 'scheduled',
         assigned_to = creator, assigned_label = creator_name, updated_at = now()
   where id = shoot;

  -- Template and AI plans are not content. Remove them for the demo businesses.
  delete from calendar_posts
   where business_id in (select id from businesses where lower(slug) like 'demo-%')
     and (source in ('template', 'ai') or status = 'idea');
end $$;
