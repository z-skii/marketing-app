-- Storeday — operational helpers: expense alerts, scheduled checks, hours summaries.

-- Large expense notification (threshold is per-user preference, default $500).
create or replace function app.expense_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_loc text; v_cat text;
begin
  if new.status <> 'paid' then return new; end if;
  select name into v_loc from public.locations where id = new.location_id;
  select name into v_cat from public.expense_categories where id = new.category_id;
  perform app.notify_managers(new.organization_id, new.location_id, 'large_expense',
    'Large expense: $' || to_char(new.amount, 'FM999,999,990.00') || ' at ' || coalesce(v_loc, 'store'),
    coalesce(v_cat, '') || case when new.vendor is not null then ' · ' || new.vendor else '' end,
    jsonb_build_object('expense_id', new.id, 'amount', new.amount), new.amount);
  return new;
end $$;
create trigger expenses_notify_large after insert on public.expenses for each row execute function app.expense_notify();

-- Per-employee hours and labor for a period (for reports, employee cards, payroll estimate).
create or replace function public.employee_hours_summary(p_org uuid, p_from date, p_to date)
returns table (employee_id uuid, employee_name text, shifts bigint, minutes bigint, labor_cost numeric, flagged bigint)
language sql stable security invoker set search_path = public as $$
  select s.employee_id, trim(e.first_name || ' ' || e.last_name), count(*), coalesce(sum(s.worked_minutes), 0),
    app.round2(sum(s.labor_cost)), count(*) filter (where s.verification_status in ('location_issue', 'missing_photo', 'needs_review'))
  from public.shifts s join public.employees e on e.id = s.employee_id
  where s.organization_id = p_org and s.status = 'completed' and s.business_date between p_from and p_to
  group by s.employee_id, e.first_name, e.last_name;
$$;

-- Scheduled/opportunistic checks. Idempotent per (kind, location, date) via data->>'dedupe_key'.
-- Called by the hourly cron (service role) and when an owner opens the dashboard.
create or replace function public.run_org_checks(p_org uuid) returns int
language plpgsql security definer set search_path = public as $$
declare l record; s record; v_now timestamptz := now(); v_local timestamp; v_today date; v_yday date; v_key text; v_count int := 0; v_name text;
begin
  if auth.uid() is not null and not app.is_org_manager(p_org) then raise exception 'Not allowed'; end if;

  -- Forgot to clock out: active shift older than 14 hours.
  for s in select sh.id, sh.location_id, sh.clock_in_at, trim(e.first_name || ' ' || e.last_name) as name
      from public.shifts sh join public.employees e on e.id = sh.employee_id
      where sh.organization_id = p_org and sh.status = 'active' and sh.clock_in_at < v_now - interval '14 hours' loop
    v_key := 'forgot_clock_out:' || s.id;
    if not exists (select 1 from public.notifications where organization_id = p_org and data ->> 'dedupe_key' = v_key) then
      v_count := v_count + app.notify_managers(p_org, s.location_id, 'forgot_clock_out', s.name || ' may have forgotten to clock out',
        'Clocked in ' || to_char(s.clock_in_at, 'Mon DD HH12:MI AM') || ' and still active', jsonb_build_object('dedupe_key', v_key, 'shift_id', s.id));
    end if;
  end loop;

  for l in select loc.*, ls.opens_at, ls.closes_at, ls.require_accounting_closeout
      from public.locations loc join public.location_settings ls on ls.location_id = loc.id
      where loc.organization_id = p_org and loc.is_active loop
    v_local := v_now at time zone l.timezone;
    v_today := v_local::date; v_yday := v_today - 1;

    -- Store did not open: 45 min past opens_at with no shift and no opening checklist today.
    if l.opens_at is not null and v_local::time > l.opens_at + interval '45 minutes' then
      v_key := 'store_not_opened:' || l.id || ':' || v_today;
      if not exists (select 1 from public.shifts where location_id = l.id and business_date = v_today)
         and not exists (select 1 from public.checklist_submissions where location_id = l.id and business_date = v_today and kind = 'opening')
         and not exists (select 1 from public.notifications where organization_id = p_org and data ->> 'dedupe_key' = v_key) then
        v_count := v_count + app.notify_managers(p_org, l.id, 'store_not_opened', l.name || ' has not opened', 'No clock-in or opening checklist by ' || to_char(l.opens_at, 'HH12:MI AM'), jsonb_build_object('dedupe_key', v_key, 'date', v_today));
      end if;
    end if;

    -- Store did not close / missing closeout: 90 min past closes_at.
    if l.closes_at is not null and v_local::time > l.closes_at + interval '90 minutes' then
      v_key := 'store_not_closed:' || l.id || ':' || v_today;
      if exists (select 1 from public.shifts where location_id = l.id and business_date = v_today)
         and not exists (select 1 from public.checklist_submissions where location_id = l.id and business_date = v_today and kind = 'closing' and status = 'completed')
         and exists (select 1 from public.location_settings where location_id = l.id and require_closing_checklist)
         and not exists (select 1 from public.notifications where organization_id = p_org and data ->> 'dedupe_key' = v_key) then
        v_count := v_count + app.notify_managers(p_org, l.id, 'store_not_closed', l.name || ' closing checklist not completed', 'Expected by ' || to_char(l.closes_at, 'HH12:MI AM'), jsonb_build_object('dedupe_key', v_key, 'date', v_today));
      end if;
    end if;

    -- Missing closeout for yesterday (checked from 9am local).
    if coalesce(l.require_accounting_closeout, true) and v_local::time > time '09:00' then
      v_key := 'missing_closeout:' || l.id || ':' || v_yday;
      if not exists (select 1 from public.daily_reports where location_id = l.id and business_date = v_yday and status = 'closed')
         and (exists (select 1 from public.shifts where location_id = l.id and business_date = v_yday) or exists (select 1 from public.daily_reports where location_id = l.id and business_date = v_yday))
         and not exists (select 1 from public.notifications where organization_id = p_org and data ->> 'dedupe_key' = v_key) then
        v_count := v_count + app.notify_managers(p_org, l.id, 'missing_closeout', l.name || ' was not closed out for ' || to_char(v_yday, 'Mon DD'), 'Open Quick Close to finish the day', jsonb_build_object('dedupe_key', v_key, 'date', v_yday, 'location_id', l.id));
      end if;
    end if;
  end loop;

  -- Employee late: scheduled shift started 15+ minutes ago with no clock-in today.
  for s in select sc.id, sc.location_id, sc.starts_at, sc.employee_id, trim(e.first_name || ' ' || e.last_name) as name
      from public.schedules sc join public.employees e on e.id = sc.employee_id
      where sc.organization_id = p_org and sc.starts_at between v_now - interval '3 hours' and v_now - interval '15 minutes'
        and not exists (select 1 from public.shifts sh where sh.employee_id = sc.employee_id and sh.clock_in_at between sc.starts_at - interval '2 hours' and sc.ends_at) loop
    v_key := 'employee_late:' || s.id;
    if not exists (select 1 from public.notifications where organization_id = p_org and data ->> 'dedupe_key' = v_key) then
      v_count := v_count + app.notify_managers(p_org, s.location_id, 'employee_late', s.name || ' has not clocked in for a scheduled shift',
        'Scheduled ' || to_char(s.starts_at at time zone (select timezone from public.locations where id = s.location_id), 'HH12:MI AM'), jsonb_build_object('dedupe_key', v_key, 'schedule_id', s.id));
    end if;
  end loop;
  return v_count;
end $$;

grant execute on function public.employee_hours_summary(uuid, date, date) to authenticated, service_role;
grant execute on function public.run_org_checks(uuid) to authenticated, service_role;
