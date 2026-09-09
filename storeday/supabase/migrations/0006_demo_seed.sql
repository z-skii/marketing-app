-- Storeday — demo data. Creates a separate "Storeday Demo" business for the caller with
-- 3 stores, 10 employees, 30 days of realistic accounting, shifts, expenses, schedules,
-- checklists and closeouts. Safe to run more than once (creates another demo org each time).

create or replace function public.seed_demo_data() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_org uuid; v_profile public.profiles%rowtype;
  v_locs uuid[] := '{}'; v_loc uuid; v_i int; v_d int; v_day date; v_today date; v_dow int;
  v_emp uuid; v_emps uuid[]; v_mgr uuid; v_me uuid;
  v_cat_supplies uuid; v_cat_maint uuid; v_cat_delivery uuid; v_cat_rent uuid; v_cat_util uuid; v_cat_ins uuid; v_cat_inv uuid;
  v_base numeric; v_sales numeric; v_cash numeric; v_card numeric; v_other numeric; v_cash_goods numeric; v_check_goods numeric;
  v_util numeric; v_oth numeric; v_diff numeric; v_start timestamptz; v_end timestamptz; v_n int; v_status public.verification_status;
  v_shift uuid; v_rep uuid; v_tpl_open uuid; v_tpl_close uuid; v_sub uuid; v_item record; v_closed_at timestamptz;
  v_names text[] := array['John Carter','Mike Alvarez','Sarah Kim','Emily Brooks','David Nguyen','Priya Patel','Chris Morgan','Ana Lopez','Tom Reed','Jasmine Hall'];
  v_rates numeric[] := array[15, 16, 14, 15.5, 17, 14.5, 16, 15, 13.5, 18];
  v_loc_names text[] := array['Mr Tobacco', 'Cloud Pass', 'Corner Mart'];
  v_loc_addr text[] := array['310 S Bickett Blvd', '2410 Hillsborough St', '905 W Main St'];
  v_loc_city text[] := array['Louisburg', 'Raleigh', 'Durham'];
  v_loc_lat double precision[] := array[36.0999, 35.7871, 35.9982];
  v_loc_lng double precision[] := array[-78.3012, -78.6640, -78.9084];
  v_loc_base numeric[] := array[5600, 4300, 3500];
  v_tz text := 'America/New_York';
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  perform setseed(0.4242);
  select * into v_profile from public.profiles where id = v_uid;
  v_today := (now() at time zone v_tz)::date;

  -- Organization -------------------------------------------------------------
  v_org := public.create_organization('Storeday Demo', 'Convenience store', v_tz, 'USD');
  update public.organizations set is_demo = true, onboarding_completed = true, onboarding_step = 7 where id = v_org;
  update public.organization_settings set cash_check_enabled = true, default_geofence_radius_m = 90 where organization_id = v_org;

  select id into v_cat_supplies from public.expense_categories where organization_id = v_org and name = 'Supplies';
  select id into v_cat_maint from public.expense_categories where organization_id = v_org and name = 'Maintenance';
  select id into v_cat_delivery from public.expense_categories where organization_id = v_org and name = 'Delivery';
  select id into v_cat_rent from public.expense_categories where organization_id = v_org and name = 'Rent';
  select id into v_cat_util from public.expense_categories where organization_id = v_org and name = 'Utilities';
  select id into v_cat_ins from public.expense_categories where organization_id = v_org and name = 'Insurance';
  select id into v_cat_inv from public.expense_categories where organization_id = v_org and name = 'Inventory';
  select id into v_tpl_open from public.checklist_templates where organization_id = v_org and kind = 'opening' limit 1;
  select id into v_tpl_close from public.checklist_templates where organization_id = v_org and kind = 'closing' limit 1;

  -- Stores -------------------------------------------------------------------
  for v_i in 1..3 loop
    insert into public.locations (organization_id, name, address_line1, city, state, postal_code, phone, timezone, latitude, longitude, sort_order, created_by)
    values (v_org, v_loc_names[v_i], v_loc_addr[v_i], v_loc_city[v_i], 'NC', '27549', '(919) 555-01' || (10 + v_i)::text, v_tz, v_loc_lat[v_i], v_loc_lng[v_i], v_i, v_uid)
    returning id into v_loc;
    v_locs := array_append(v_locs, v_loc);
    update public.location_settings set starting_cash = 200, opens_at = time '09:00', closes_at = time '22:00', require_closing_checklist = false where location_id = v_loc;
    -- Recurring expenses per store
    insert into public.recurring_expenses (organization_id, location_id, category_id, amount, vendor, description, payment_method, frequency, day_of_month, next_due_date, auto_mark_paid, created_by) values
      (v_org, v_loc, v_cat_rent, 1800 + v_i * 200, 'Landlord', 'Monthly rent', 'check', 'monthly', 1, date_trunc('month', v_today - 30)::date, true, v_uid),
      (v_org, v_loc, v_cat_util, 150, 'Spectrum', 'Internet', 'ach', 'monthly', 5, (date_trunc('month', v_today - 30) + interval '4 days')::date, true, v_uid),
      (v_org, v_loc, v_cat_ins, 700, 'State Farm', 'Business insurance', 'ach', 'monthly', 15, (date_trunc('month', v_today - 30) + interval '14 days')::date, false, v_uid);
  end loop;

  -- Employees ----------------------------------------------------------------
  -- The caller as an employee too, so the owner can try the clock screen.
  insert into public.employees (organization_id, user_id, first_name, last_name, email, role, start_date, default_location_id, created_by)
  values (v_org, v_uid, coalesce(nullif(split_part(coalesce(v_profile.full_name, ''), ' ', 1), ''), 'You'), coalesce(nullif(split_part(coalesce(v_profile.full_name, ''), ' ', 2), ''), '(Owner)'), v_profile.email, 'owner', v_today - 400, v_locs[1], v_uid)
  returning id into v_me;
  insert into public.employee_pay_rates (organization_id, employee_id, hourly_rate, effective_from, created_by) values (v_org, v_me, 0, v_today - 400, v_uid);
  for v_i in 1..3 loop
    insert into public.employee_locations (organization_id, employee_id, location_id) values (v_org, v_me, v_locs[v_i]);
  end loop;

  v_emps := '{}';
  for v_i in 1..10 loop
    insert into public.employees (organization_id, first_name, last_name, email, phone, role, start_date, default_location_id, created_by)
    values (v_org, split_part(v_names[v_i], ' ', 1), split_part(v_names[v_i], ' ', 2),
      lower(replace(v_names[v_i], ' ', '.')) || '@example.com', '(919) 555-02' || lpad(v_i::text, 2, '0'),
      case when v_i in (1, 5, 8) then 'manager'::public.org_role else 'employee'::public.org_role end, v_today - (120 + v_i * 40), v_locs[((v_i - 1) % 3) + 1], v_uid)
    returning id into v_emp;
    v_emps := array_append(v_emps, v_emp);
    insert into public.employee_pay_rates (organization_id, employee_id, hourly_rate, effective_from, created_by) values (v_org, v_emp, v_rates[v_i], v_today - 400, v_uid);
    insert into public.employee_locations (organization_id, employee_id, location_id) values (v_org, v_emp, v_locs[((v_i - 1) % 3) + 1]);
    if v_i = 10 then insert into public.employee_locations (organization_id, employee_id, location_id) values (v_org, v_emp, v_locs[2]) on conflict do nothing; end if;
  end loop;

  -- 30 days of history --------------------------------------------------------
  for v_d in reverse 30..1 loop
    v_day := v_today - v_d;
    v_dow := extract(dow from v_day);
    for v_i in 1..3 loop
      v_loc := v_locs[v_i];
      -- Shifts: opener (employee i, i+3) and closer (i+6 / 10)
      v_n := 0;
      foreach v_emp in array array[v_emps[v_i], v_emps[v_i + 3], v_emps[case when v_i = 1 then 10 else v_i + 6 end]] loop
        v_n := v_n + 1;
        v_start := (v_day + case v_n when 1 then time '08:52' when 2 then time '12:30' else time '15:05' end + ((random() * 20 - 10)::int || ' minutes')::interval) at time zone v_tz;
        v_end := (v_day + case v_n when 1 then time '15:10' when 2 then time '20:00' else time '22:15' end + ((random() * 20 - 10)::int || ' minutes')::interval) at time zone v_tz;
        if v_n = 2 and v_dow in (1, 2, 3) then continue; end if; -- lighter mid-shift on slow days
        v_status := case when random() < 0.04 then 'location_issue'::public.verification_status when random() < 0.03 then 'missing_photo'::public.verification_status when random() < 0.02 then 'manager_adjusted'::public.verification_status else 'verified'::public.verification_status end;
        insert into public.shifts (organization_id, location_id, employee_id, business_date, clock_in_at, clock_out_at, status, verification_status, hourly_rate_snapshot, source, created_by)
        values (v_org, v_loc, v_emp, v_day, v_start, v_end, 'completed', v_status, app.rate_on(v_emp, v_day), 'clock', v_uid)
        returning id into v_shift;
        perform app.finalize_shift_minutes(v_shift);
        insert into public.shift_verifications (organization_id, location_id, shift_id, kind, recorded_at, latitude, longitude, accuracy_m, distance_m, radius_m, within_radius, status, flags, created_by)
        values (v_org, v_loc, v_shift, 'clock_in', v_start, v_loc_lat[v_i] + (random() - 0.5) * 0.0004, v_loc_lng[v_i] + (random() - 0.5) * 0.0004, 8 + random() * 20,
          case when v_status = 'location_issue' then 310 + random() * 200 else random() * 40 end, 90, v_status <> 'location_issue', v_status, '{}', v_uid),
          (v_org, v_loc, v_shift, 'clock_out', v_end, v_loc_lat[v_i] + (random() - 0.5) * 0.0004, v_loc_lng[v_i] + (random() - 0.5) * 0.0004, 8 + random() * 20, random() * 40, 90, true, 'verified', '{}', v_uid);
        if v_status = 'manager_adjusted' then
          insert into public.time_adjustments (organization_id, location_id, shift_id, adjusted_by, reason, original_clock_in, original_clock_out, new_clock_in, new_clock_out, original_minutes, new_minutes)
          values (v_org, v_loc, v_shift, v_uid, 'Forgot to clock out, left at close', v_start, v_end + interval '3 hours', v_start, v_end, 0, 0);
        end if;
      end loop;

      -- Daily numbers
      v_base := v_loc_base[v_i] * case when v_dow in (5, 6) then 1.18 when v_dow = 0 then 0.9 else 1 end;
      v_sales := app.round2((v_base * (0.88 + random() * 0.24))::numeric);
      v_cash := app.round2((v_sales * (0.40 + random() * 0.1))::numeric);
      v_other := case when random() < 0.3 then app.round2((20 + random() * 80)::numeric) else 0 end;
      v_card := app.round2((v_sales - v_cash - v_other)::numeric);
      v_cash_goods := case when random() < 0.6 then app.round2((v_sales * (0.05 + random() * 0.06))::numeric) else 0 end;
      v_check_goods := case when v_dow in (1, 4) then app.round2((v_sales * (0.95 + random() * 0.35))::numeric) when random() < 0.25 then app.round2((v_sales * (0.2 + random() * 0.2))::numeric) else 0 end;
      v_util := case when extract(day from v_day) in (2, 16) then app.round2((120 + random() * 160)::numeric) else 0 end;
      v_oth := case when random() < 0.35 then app.round2((10 + random() * 60)::numeric) else 0 end;
      v_diff := case when random() < 0.7 then 0 when random() < 0.7 then -app.round2((random() * 12)::numeric) else app.round2((random() * 8)::numeric) end;
      if v_i = 1 and v_d = 1 then v_diff := -18; end if; -- yesterday: Mr Tobacco $18 short
      insert into public.daily_reports (organization_id, location_id, business_date, cash_sales, card_sales, other_sales, cash_goods, check_goods, utilities, other_expenses, expected_cash, actual_cash, notes, created_by)
      values (v_org, v_loc, v_day, v_cash, v_card, v_other, v_cash_goods, v_check_goods, v_util, v_oth, app.round2((200 + v_cash - v_cash_goods)::numeric), app.round2((200 + v_cash - v_cash_goods + v_diff)::numeric),
        case when v_diff < -10 then 'Drawer short — recounted twice.' when v_dow = 5 then 'Busy Friday, lottery line all evening.' else null end, v_uid)
      returning id into v_rep;

      -- Detailed expenses
      if random() < 0.3 then
        insert into public.expenses (organization_id, location_id, business_date, amount, category_id, payment_method, vendor, description, status, paid_at, created_by)
        values (v_org, v_loc, v_day, app.round2((25 + random() * 90)::numeric), v_cat_supplies, 'cash', 'Sam''s Club', 'Bags, receipt paper, cleaning', 'paid', v_day::timestamp at time zone v_tz, v_uid);
      end if;
      if random() < 0.12 then
        insert into public.expenses (organization_id, location_id, business_date, amount, category_id, payment_method, vendor, description, status, paid_at, created_by)
        values (v_org, v_loc, v_day, app.round2((120 + random() * 300)::numeric), v_cat_maint, 'credit_card', 'Ace Hardware', 'Cooler repair', 'paid', v_day::timestamp at time zone v_tz, v_uid);
      end if;
      if v_dow = 3 and random() < 0.6 then
        insert into public.expenses (organization_id, location_id, business_date, amount, category_id, payment_method, vendor, description, status, paid_at, created_by)
        values (v_org, v_loc, v_day, app.round2((40 + random() * 40)::numeric), v_cat_delivery, 'cash', 'Local courier', 'Delivery fee', 'paid', v_day::timestamp at time zone v_tz, v_uid);
      end if;

      -- Checklists
      insert into public.checklist_submissions (organization_id, location_id, template_id, kind, business_date, status, started_at, completed_at, submitted_by, created_by)
      values (v_org, v_loc, v_tpl_open, 'opening', v_day, 'completed', (v_day + time '08:55') at time zone v_tz, (v_day + time '09:04') at time zone v_tz, v_uid, v_uid) returning id into v_sub;
      insert into public.checklist_submission_items (organization_id, submission_id, item_id, checked, checked_at, checked_by)
      select v_org, v_sub, ci.id, true, (v_day + time '09:03') at time zone v_tz, v_uid from public.checklist_items ci where ci.template_id = v_tpl_open;
      if not (v_i = 2 and v_d = 1) then -- yesterday: Cloud Pass closing checklist missing
        insert into public.checklist_submissions (organization_id, location_id, template_id, kind, business_date, status, started_at, completed_at, submitted_by, created_by)
        values (v_org, v_loc, v_tpl_close, 'closing', v_day, 'completed', (v_day + time '21:50') at time zone v_tz, (v_day + time '22:06') at time zone v_tz, v_uid, v_uid) returning id into v_sub;
        insert into public.checklist_submission_items (organization_id, submission_id, item_id, checked, checked_at, checked_by)
        select v_org, v_sub, ci.id, true, (v_day + time '22:05') at time zone v_tz, v_uid from public.checklist_items ci where ci.template_id = v_tpl_close;
      end if;

      -- Close the day (skip yesterday for Corner Mart → "missing closeout" attention)
      if not (v_i = 3 and v_d = 1) then
        perform public.close_day(v_loc, v_day);
        v_closed_at := (v_day + time '22:20' + ((random() * 30)::int || ' minutes')::interval) at time zone v_tz;
        perform set_config('app.closed_edit', 'on', true);
        update public.daily_reports set closed_at = v_closed_at where id = v_rep;
        perform set_config('app.closed_edit', 'off', true);
        update public.closeout_reports set closed_at = v_closed_at where daily_report_id = v_rep;
      end if;
    end loop;
  end loop;

  -- Recurring expenses materialized for the period
  perform public.materialize_recurring_expenses(v_org, v_today);

  -- Today: openers already clocked in; one outside-radius clock-in ---------------
  for v_i in 1..3 loop
    v_loc := v_locs[v_i];
    v_start := (v_today + time '08:58' + ((v_i * 3) || ' minutes')::interval) at time zone v_tz;
    if v_start > now() then v_start := now() - interval '35 minutes'; end if;
    v_status := case when v_i = 2 then 'location_issue'::public.verification_status else 'verified'::public.verification_status end;
    insert into public.shifts (organization_id, location_id, employee_id, business_date, clock_in_at, status, verification_status, hourly_rate_snapshot, created_by)
    values (v_org, v_loc, v_emps[v_i], v_today, v_start, 'active', v_status, app.rate_on(v_emps[v_i], v_today), v_uid) returning id into v_shift;
    insert into public.shift_verifications (organization_id, location_id, shift_id, kind, recorded_at, latitude, longitude, accuracy_m, distance_m, radius_m, within_radius, status, flags, created_by)
    values (v_org, v_loc, v_shift, 'clock_in', v_start, v_loc_lat[v_i] + 0.0001, v_loc_lng[v_i], 12, case when v_i = 2 then 412 else 14 end, 90, v_i <> 2, v_status, '{}', v_uid);
    if v_i = 2 then
      perform app.notify_managers(v_org, v_loc, 'outside_radius', 'Mike Alvarez clocked in outside the store radius', 'Cloud Pass — 412 m away', jsonb_build_object('shift_id', v_shift));
    end if;
    -- Opening checklist done today
    insert into public.checklist_submissions (organization_id, location_id, template_id, kind, business_date, status, started_at, completed_at, submitted_by, created_by)
    values (v_org, v_loc, v_tpl_open, 'opening', v_today, 'completed', v_start, v_start + interval '6 minutes', v_uid, v_uid) returning id into v_sub;
    insert into public.checklist_submission_items (organization_id, submission_id, item_id, checked, checked_at, checked_by)
    select v_org, v_sub, ci.id, true, v_start + interval '5 minutes', v_uid from public.checklist_items ci where ci.template_id = v_tpl_open;
  end loop;
  -- A draft in progress for today at Mr Tobacco
  insert into public.daily_reports (organization_id, location_id, business_date, cash_sales, card_sales, created_by)
  values (v_org, v_locs[1], v_today, 1240.50, 1876.25, v_uid);

  -- Schedules: next 7 days ---------------------------------------------------
  for v_d in 0..7 loop
    v_day := v_today + v_d;
    for v_i in 1..3 loop
      insert into public.schedules (organization_id, location_id, employee_id, starts_at, ends_at, created_by) values
        (v_org, v_locs[v_i], v_emps[v_i], (v_day + time '09:00') at time zone v_tz, (v_day + time '15:00') at time zone v_tz, v_uid),
        (v_org, v_locs[v_i], v_emps[v_i + 3], (v_day + time '12:00') at time zone v_tz, (v_day + time '20:00') at time zone v_tz, v_uid),
        (v_org, v_locs[v_i], v_emps[case when v_i = 1 then 10 else v_i + 6 end], (v_day + time '15:00') at time zone v_tz, (v_day + time '22:00') at time zone v_tz, v_uid);
    end loop;
  end loop;

  -- Cloud Pass requires the closing checklist from now on (yesterday's is missing → attention item).
  update public.location_settings set require_closing_checklist = true where location_id = v_locs[2];
  perform app.notify_managers(v_org, v_locs[3], 'missing_closeout', 'Corner Mart was not closed out for ' || to_char(v_today - 1, 'Mon DD'), 'Open Quick Close to finish the day', jsonb_build_object('location_id', v_locs[3], 'date', v_today - 1));
  perform app.log_activity(v_org, null, 'demo.seeded', 'organization', v_org, null, jsonb_build_object('stores', 3, 'employees', 10, 'days', 30));
  update public.profiles set active_organization_id = v_org where id = v_uid;
  return v_org;
end $$;

grant execute on function public.seed_demo_data() to authenticated;

-- Owner can delete a demo business entirely (cascades).
create or replace function public.delete_demo_organization(p_org uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.organizations where id = p_org and owner_id = auth.uid() and is_demo) then
    raise exception 'Only the owner can delete a demo business';
  end if;
  delete from public.organizations where id = p_org;
  update public.profiles set active_organization_id = (
    select organization_id from public.organization_members where user_id = auth.uid() and status = 'active' order by created_at limit 1)
  where id = auth.uid();
end $$;
grant execute on function public.delete_demo_organization(uuid) to authenticated;
