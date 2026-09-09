-- Storeday — permission helpers, derived accounting, and transactional RPCs.

-- ================================================================ permission helpers
-- All security definer so RLS policies can call them without recursion.

create or replace function app.user_org_role(p_org uuid) returns public.org_role
language sql stable security definer set search_path = public as $$
  select role from public.organization_members
  where organization_id = p_org and user_id = auth.uid() and status = 'active'
  limit 1;
$$;

create or replace function app.is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_org and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function app.is_org_owner(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_org and user_id = auth.uid() and status = 'active' and role = 'owner'
  );
$$;

create or replace function app.is_org_manager(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_org and user_id = auth.uid() and status = 'active' and role in ('owner', 'manager')
  );
$$;

create or replace function app.location_org(p_loc uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from public.locations where id = p_loc;
$$;

-- Owner of the org, or any user assigned to the location.
create or replace function app.can_access_location(p_loc uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.locations l
    join public.organization_members m on m.organization_id = l.organization_id
      and m.user_id = auth.uid() and m.status = 'active'
    where l.id = p_loc
      and (m.role = 'owner' or exists (
        select 1 from public.location_members lm where lm.location_id = l.id and lm.user_id = auth.uid()
      ))
  );
$$;

-- Owner of the org, or a manager assigned to the location.
create or replace function app.can_manage_location(p_loc uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.locations l
    join public.organization_members m on m.organization_id = l.organization_id
      and m.user_id = auth.uid() and m.status = 'active'
    where l.id = p_loc
      and (m.role = 'owner' or (m.role = 'manager' and exists (
        select 1 from public.location_members lm where lm.location_id = l.id and lm.user_id = auth.uid()
      )))
  );
$$;

create or replace function app.member_permission(p_org uuid, p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case when role = 'owner' then true else coalesce((permissions ->> p_key)::boolean, false) end
     from public.organization_members
     where organization_id = p_org and user_id = auth.uid() and status = 'active'),
    false);
$$;

create or replace function app.current_employee_id(p_org uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.employees where organization_id = p_org and user_id = auth.uid() limit 1;
$$;

create or replace function app.employee_user(p_employee uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select user_id from public.employees where id = p_employee;
$$;

-- Owner sees every location; others see their assigned locations.
create or replace function public.my_location_ids(p_org uuid) returns setof uuid
language sql stable security definer set search_path = public as $$
  select l.id from public.locations l
  where l.organization_id = p_org and l.is_active
    and (app.is_org_owner(p_org) or exists (
      select 1 from public.location_members lm where lm.location_id = l.id and lm.user_id = auth.uid()));
$$;

-- ================================================================ small utilities
create or replace function app.round2(n numeric) returns numeric language sql immutable as $$
  select round(coalesce(n, 0), 2);
$$;

-- Haversine distance in meters.
create or replace function app.distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select case when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null else
    2 * 6371000.0 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    )) end;
$$;

-- Effective hourly rate for an employee on a date.
create or replace function app.rate_on(p_employee uuid, p_date date) returns numeric
language sql stable security definer set search_path = public as $$
  select hourly_rate from public.employee_pay_rates
  where employee_id = p_employee and effective_from <= p_date
  order by effective_from desc, created_at desc limit 1;
$$;

create or replace function app.location_today(p_loc uuid) returns date
language sql stable security definer set search_path = public as $$
  select (now() at time zone coalesce((select timezone from public.locations where id = p_loc), 'UTC'))::date;
$$;

create or replace function app.effective_radius(p_loc uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(l.geofence_radius_m, s.default_geofence_radius_m, 76)
  from public.locations l
  left join public.organization_settings s on s.organization_id = l.organization_id
  where l.id = p_loc;
$$;

-- ================================================================ activity log + notifications
create or replace function app.log_activity(
  p_org uuid, p_loc uuid, p_action text, p_entity_type text, p_entity_id uuid,
  p_before jsonb default null, p_after jsonb default null, p_note text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.activity_logs (organization_id, location_id, actor_id, action, entity_type, entity_id, before_data, after_data, note)
  values (p_org, p_loc, auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after, p_note)
  returning id into v_id;
  return v_id;
end $$;

-- Notify owners (and managers assigned to the location) that opted into this kind.
-- p_amount is compared against the kind's threshold pref when present.
create or replace function app.notify_managers(
  p_org uuid, p_loc uuid, p_kind public.notification_kind, p_title text, p_body text,
  p_data jsonb default '{}'::jsonb, p_amount numeric default null
) returns int language plpgsql security definer set search_path = public as $$
declare
  r record; v_prefs jsonb; v_enabled boolean; v_threshold numeric; v_count int := 0;
  v_default boolean;
begin
  -- Quiet by default for high-volume kinds.
  v_default := p_kind not in ('employee_clock_in', 'employee_clock_out');
  for r in
    select m.user_id, m.role from public.organization_members m
    where m.organization_id = p_org and m.status = 'active' and m.role in ('owner', 'manager')
      and (m.role = 'owner' or p_loc is null or exists (
        select 1 from public.location_members lm where lm.location_id = p_loc and lm.user_id = m.user_id))
  loop
    select prefs into v_prefs from public.notification_preferences where organization_id = p_org and user_id = r.user_id;
    v_prefs := coalesce(v_prefs, '{}'::jsonb);
    v_enabled := coalesce((v_prefs ->> p_kind::text)::boolean, v_default);
    if not v_enabled then continue; end if;
    if p_amount is not null then
      v_threshold := case p_kind
        when 'cash_shortage' then coalesce((v_prefs ->> 'cash_shortage_threshold')::numeric, 20)
        when 'large_expense' then coalesce((v_prefs ->> 'large_expense_threshold')::numeric, 500)
        else null end;
      if v_threshold is not null and abs(p_amount) < v_threshold then continue; end if;
    end if;
    insert into public.notifications (organization_id, location_id, user_id, kind, title, body, data)
    values (p_org, p_loc, r.user_id, p_kind, p_title, p_body, p_data);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- ================================================================ derived accounting
-- One row per (location, business_date) that has any data. All totals derived here — never stored twice.
create or replace view public.daily_accounting with (security_invoker = true) as
with keys as (
  select organization_id, location_id, business_date from public.daily_reports
  union
  select organization_id, location_id, business_date from public.shifts where status = 'completed'
  union
  select organization_id, location_id, business_date from public.expenses where status = 'paid'
),
labor as (
  select location_id, business_date,
    count(distinct employee_id)::int as employee_count,
    coalesce(sum(worked_minutes), 0)::int as minutes,
    app.round2(sum(labor_cost)) as cost
  from public.shifts where status = 'completed' group by 1, 2
),
exp as (
  select e.location_id, e.business_date,
    app.round2(sum(e.amount) filter (where c.bucket = 'goods')) as goods,
    app.round2(sum(e.amount) filter (where c.bucket = 'labor')) as labor,
    app.round2(sum(e.amount) filter (where c.bucket = 'utilities')) as utilities,
    app.round2(sum(e.amount) filter (where c.bucket = 'other')) as other,
    count(*)::int as expense_count
  from public.expenses e join public.expense_categories c on c.id = e.category_id
  where e.status = 'paid' group by 1, 2
),
base as (
  select k.organization_id, k.location_id, k.business_date,
    r.id as daily_report_id, r.status, r.notes, r.closed_at, r.closed_by,
    r.cash_sales, r.card_sales, r.other_sales, r.cash_goods, r.check_goods, r.utilities, r.other_expenses,
    r.expected_cash, r.actual_cash,
    app.round2(coalesce(r.cash_sales, 0) + coalesce(r.card_sales, 0) + coalesce(r.other_sales, 0)) as total_sales,
    app.round2(coalesce(r.cash_goods, 0) + coalesce(r.check_goods, 0) + coalesce(x.goods, 0)) as goods_total,
    app.round2(coalesce(lb.cost, 0) + coalesce(x.labor, 0)) as labor_total,
    app.round2(coalesce(r.utilities, 0) + coalesce(x.utilities, 0)) as utilities_total,
    app.round2(coalesce(r.other_expenses, 0) + coalesce(x.other, 0)) as other_total,
    coalesce(lb.minutes, 0) as labor_minutes,
    coalesce(lb.employee_count, 0) as labor_employee_count,
    coalesce(x.expense_count, 0) as detailed_expense_count,
    app.round2(x.goods) as detailed_goods, app.round2(x.labor) as detailed_labor,
    app.round2(x.utilities) as detailed_utilities, app.round2(x.other) as detailed_other
  from keys k
  left join public.daily_reports r on r.location_id = k.location_id and r.business_date = k.business_date
  left join labor lb on lb.location_id = k.location_id and lb.business_date = k.business_date
  left join exp x on x.location_id = k.location_id and x.business_date = k.business_date
)
select b.*,
  app.round2(b.goods_total + b.labor_total + b.utilities_total + b.other_total) as total_expenses,
  app.round2(b.total_sales - (b.goods_total + b.labor_total + b.utilities_total + b.other_total)) as profit,
  case when b.total_sales > 0
    then round((b.total_sales - (b.goods_total + b.labor_total + b.utilities_total + b.other_total)) / b.total_sales * 100, 2)
    else null end as margin_pct,
  case when b.expected_cash is not null and b.actual_cash is not null
    then app.round2(b.actual_cash - b.expected_cash) else null end as cash_difference
from base b;

-- Aggregate totals for a set of locations and a date range.
create or replace function public.accounting_totals(p_org uuid, p_location_ids uuid[], p_from date, p_to date)
returns table (
  cash_sales numeric, card_sales numeric, other_sales numeric, total_sales numeric,
  goods_total numeric, labor_total numeric, utilities_total numeric, other_total numeric,
  total_expenses numeric, profit numeric, margin_pct numeric,
  labor_minutes bigint, labor_employee_count bigint, days_with_data bigint, days_closed bigint,
  cash_difference numeric
) language sql stable security invoker set search_path = public as $$
  select
    app.round2(sum(cash_sales)), app.round2(sum(card_sales)), app.round2(sum(other_sales)), app.round2(sum(total_sales)),
    app.round2(sum(goods_total)), app.round2(sum(labor_total)), app.round2(sum(utilities_total)), app.round2(sum(other_total)),
    app.round2(sum(total_expenses)), app.round2(sum(profit)),
    case when coalesce(sum(total_sales), 0) > 0 then round(sum(profit) / sum(total_sales) * 100, 2) else null end,
    coalesce(sum(labor_minutes), 0), coalesce(sum(labor_employee_count), 0),
    count(*) filter (where daily_report_id is not null), count(*) filter (where status = 'closed'),
    app.round2(sum(cash_difference))
  from public.daily_accounting
  where organization_id = p_org and business_date between p_from and p_to
    and (p_location_ids is null or location_id = any (p_location_ids));
$$;

-- Per-day totals (all selected locations combined) — chart series.
create or replace function public.accounting_by_day(p_org uuid, p_location_ids uuid[], p_from date, p_to date)
returns table (
  business_date date, total_sales numeric, cash_sales numeric, card_sales numeric,
  total_expenses numeric, labor_total numeric, goods_total numeric, profit numeric, reports int, closed int
) language sql stable security invoker set search_path = public as $$
  select business_date, app.round2(sum(total_sales)), app.round2(sum(cash_sales)), app.round2(sum(card_sales)),
    app.round2(sum(total_expenses)), app.round2(sum(labor_total)), app.round2(sum(goods_total)), app.round2(sum(profit)),
    count(daily_report_id)::int, (count(*) filter (where status = 'closed'))::int
  from public.daily_accounting
  where organization_id = p_org and business_date between p_from and p_to
    and (p_location_ids is null or location_id = any (p_location_ids))
  group by business_date order by business_date;
$$;

-- Per-location totals — rankings & location cards.
create or replace function public.accounting_by_location(p_org uuid, p_from date, p_to date)
returns table (
  location_id uuid, total_sales numeric, cash_sales numeric, card_sales numeric, goods_total numeric,
  labor_total numeric, utilities_total numeric, other_total numeric, total_expenses numeric, profit numeric,
  margin_pct numeric, labor_minutes bigint, days_closed bigint, days_with_data bigint, cash_difference numeric
) language sql stable security invoker set search_path = public as $$
  select location_id, app.round2(sum(total_sales)), app.round2(sum(cash_sales)), app.round2(sum(card_sales)),
    app.round2(sum(goods_total)), app.round2(sum(labor_total)), app.round2(sum(utilities_total)), app.round2(sum(other_total)),
    app.round2(sum(total_expenses)), app.round2(sum(profit)),
    case when coalesce(sum(total_sales), 0) > 0 then round(sum(profit) / sum(total_sales) * 100, 2) else null end,
    coalesce(sum(labor_minutes), 0), count(*) filter (where status = 'closed'), count(daily_report_id),
    app.round2(sum(cash_difference))
  from public.daily_accounting
  where organization_id = p_org and business_date between p_from and p_to
  group by location_id;
$$;

-- Labor detail for a location/day: one row per completed shift with the rate used.
create or replace function public.labor_detail(p_loc uuid, p_date date)
returns table (
  shift_id uuid, employee_id uuid, employee_name text, clock_in_at timestamptz, clock_out_at timestamptz,
  worked_minutes int, hourly_rate numeric, labor_cost numeric, status public.shift_status,
  verification_status public.verification_status
) language sql stable security invoker set search_path = public as $$
  select s.id, s.employee_id, trim(e.first_name || ' ' || e.last_name), s.clock_in_at, s.clock_out_at,
    s.worked_minutes, s.hourly_rate_snapshot, s.labor_cost, s.status, s.verification_status
  from public.shifts s join public.employees e on e.id = s.employee_id
  where s.location_id = p_loc and s.business_date = p_date and s.status <> 'cancelled'
  order by s.clock_in_at;
$$;

-- ================================================================ organization lifecycle
create or replace function public.create_organization(p_name text, p_business_type text default null, p_timezone text default 'America/New_York', p_currency text default 'USD')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into public.organizations (name, business_type, timezone, currency, owner_id, created_by)
  values (p_name, p_business_type, coalesce(p_timezone, 'America/New_York'), coalesce(p_currency, 'USD'), v_uid, v_uid)
  returning id into v_org;
  insert into public.organization_settings (organization_id, currency, default_geofence_radius_m)
  values (v_org, coalesce(p_currency, 'USD'), 76);
  insert into public.organization_members (organization_id, user_id, role, status, created_by)
  values (v_org, v_uid, 'owner', 'active', v_uid);
  insert into public.notification_preferences (organization_id, user_id, prefs) values (v_org, v_uid, '{}'::jsonb);
  perform app.seed_default_categories(v_org);
  perform app.seed_default_checklists(v_org);
  update public.profiles set active_organization_id = v_org where id = v_uid;
  perform app.log_activity(v_org, null, 'organization.created', 'organization', v_org, null, jsonb_build_object('name', p_name));
  return v_org;
end $$;

create or replace function app.seed_default_categories(p_org uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.expense_categories (organization_id, name, bucket, is_default, sort_order) values
    (p_org, 'Inventory', 'goods', true, 1),
    (p_org, 'Labor', 'labor', true, 2),
    (p_org, 'Utilities', 'utilities', true, 3),
    (p_org, 'Rent', 'other', true, 4),
    (p_org, 'Maintenance', 'other', true, 5),
    (p_org, 'Supplies', 'other', true, 6),
    (p_org, 'Marketing', 'other', true, 7),
    (p_org, 'Insurance', 'other', true, 8),
    (p_org, 'Taxes', 'other', true, 9),
    (p_org, 'Delivery', 'other', true, 10),
    (p_org, 'Miscellaneous', 'other', true, 11)
  on conflict do nothing;
end $$;

create or replace function app.seed_default_checklists(p_org uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_open uuid; v_close uuid;
begin
  insert into public.checklist_templates (organization_id, name, kind) values (p_org, 'Opening', 'opening') returning id into v_open;
  insert into public.checklist_items (organization_id, template_id, label, sort_order) values
    (p_org, v_open, 'Store unlocked', 1), (p_org, v_open, 'Register ready', 2), (p_org, v_open, 'Lights on', 3),
    (p_org, v_open, 'Store clean', 4), (p_org, v_open, 'Cash drawer counted', 5), (p_org, v_open, 'Front area stocked', 6);
  insert into public.checklist_templates (organization_id, name, kind) values (p_org, 'Closing', 'closing') returning id into v_close;
  insert into public.checklist_items (organization_id, template_id, label, requires_photo, sort_order) values
    (p_org, v_close, 'Register closed', false, 1), (p_org, v_close, 'Cash counted', false, 2), (p_org, v_close, 'Trash removed', false, 3),
    (p_org, v_close, 'Floors checked', false, 4), (p_org, v_close, 'Doors locked', false, 5), (p_org, v_close, 'Alarm activated', false, 6),
    (p_org, v_close, 'Closing photo', true, 7);
end $$;

-- Location creation also creates its settings row.
create or replace function app.handle_new_location() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.location_settings (location_id, organization_id) values (new.id, new.organization_id)
  on conflict do nothing;
  return new;
end $$;
create trigger on_location_created after insert on public.locations for each row execute function app.handle_new_location();

-- Keep location_members in sync with employee_locations for employees who have accounts.
create or replace function app.sync_location_member() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if tg_op = 'DELETE' then
    select user_id into v_user from public.employees where id = old.employee_id;
    if v_user is not null then
      delete from public.location_members where location_id = old.location_id and user_id = v_user;
    end if;
    return old;
  end if;
  select user_id into v_user from public.employees where id = new.employee_id;
  if v_user is not null then
    insert into public.location_members (organization_id, location_id, user_id)
    values (new.organization_id, new.location_id, v_user) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger employee_locations_sync after insert or delete on public.employee_locations
  for each row execute function app.sync_location_member();

-- When an employee gets linked to a user, materialize their location memberships.
create or replace function app.sync_employee_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null and (old.user_id is distinct from new.user_id) then
    insert into public.location_members (organization_id, location_id, user_id)
    select el.organization_id, el.location_id, new.user_id from public.employee_locations el where el.employee_id = new.id
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger employees_user_sync after update of user_id on public.employees
  for each row execute function app.sync_employee_user();

-- ================================================================ invitations
create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv public.invitations%rowtype; v_uid uuid := auth.uid(); v_email text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_inv from public.invitations where token = p_token;
  if v_inv.id is null then raise exception 'Invitation not found'; end if;
  if v_inv.status <> 'pending' then raise exception 'Invitation is no longer valid'; end if;
  if v_inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'Invitation has expired';
  end if;
  insert into public.organization_members (organization_id, user_id, role, status, created_by)
  values (v_inv.organization_id, v_uid, v_inv.role, 'active', v_inv.created_by)
  on conflict (organization_id, user_id) do update set role = excluded.role, status = 'active';
  if v_inv.employee_id is not null then
    update public.employees set user_id = v_uid where id = v_inv.employee_id and (user_id is null or user_id = v_uid);
  end if;
  insert into public.notification_preferences (organization_id, user_id) values (v_inv.organization_id, v_uid) on conflict do nothing;
  update public.invitations set status = 'accepted', accepted_at = now(), accepted_by = v_uid where id = v_inv.id;
  select email into v_email from public.profiles where id = v_uid;
  update public.profiles set active_organization_id = v_inv.organization_id where id = v_uid and active_organization_id is null;
  perform app.log_activity(v_inv.organization_id, null, 'member.joined', 'employee', v_inv.employee_id, null,
    jsonb_build_object('email', v_email, 'role', v_inv.role));
  return v_inv.organization_id;
end $$;

-- Public, minimal preview of an invitation for the accept page (no auth needed).
create or replace function public.invitation_preview(p_token text)
returns table (organization_name text, email text, role public.org_role, status public.invitation_status, expires_at timestamptz, employee_name text)
language sql stable security definer set search_path = public as $$
  select o.name, i.email, i.role, case when i.status = 'pending' and i.expires_at < now() then 'expired'::public.invitation_status else i.status end,
    i.expires_at, trim(coalesce(e.first_name, '') || ' ' || coalesce(e.last_name, ''))
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  left join public.employees e on e.id = i.employee_id
  where i.token = p_token;
$$;

-- ================================================================ Verified Shift
create or replace function public.clock_in(
  p_location_id uuid,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_accuracy_m double precision default null,
  p_photo_path text default null,
  p_photo_hash text default null,
  p_photo_bytes int default null,
  p_device jsonb default '{}'::jsonb
) returns public.shifts language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_loc public.locations%rowtype; v_emp public.employees%rowtype;
  v_shift public.shifts%rowtype; v_photo uuid; v_dist double precision; v_radius int; v_within boolean;
  v_status public.verification_status; v_flags text[] := '{}'; v_date date; v_repeat boolean := false;
  v_settings public.organization_settings%rowtype;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_loc from public.locations where id = p_location_id;
  if v_loc.id is null then raise exception 'Location not found'; end if;
  select * into v_emp from public.employees where organization_id = v_loc.organization_id and user_id = v_uid;
  if v_emp.id is null then raise exception 'You are not an employee of this business'; end if;
  if v_emp.employment_status <> 'active' then raise exception 'Employee is not active'; end if;
  if not app.can_access_location(p_location_id) then raise exception 'You are not assigned to this location'; end if;
  if exists (select 1 from public.shifts where employee_id = v_emp.id and status = 'active') then
    raise exception 'You already have an active shift';
  end if;
  select * into v_settings from public.organization_settings where organization_id = v_loc.organization_id;

  v_radius := app.effective_radius(p_location_id);
  v_dist := app.distance_m(p_latitude, p_longitude, v_loc.latitude, v_loc.longitude);
  if v_dist is null then
    v_within := null; v_flags := array_append(v_flags, 'no_location');
  else
    -- Tolerate GPS error: inside if within radius plus (capped) reported accuracy.
    v_within := v_dist <= v_radius + least(coalesce(p_accuracy_m, 0), 50);
    if coalesce(p_accuracy_m, 0) > 150 then v_flags := array_append(v_flags, 'low_accuracy'); end if;
  end if;
  if p_photo_hash is not null and exists (
    select 1 from public.shift_photos where organization_id = v_loc.organization_id and content_hash = p_photo_hash
      and created_at > now() - interval '60 days') then
    v_repeat := true; v_flags := array_append(v_flags, 'repeat_photo');
  end if;

  if p_photo_path is null then v_status := 'missing_photo';
  elsif v_within is not true then v_status := 'location_issue';
  elsif v_repeat then v_status := 'needs_review';
  else v_status := 'verified'; end if;

  if p_photo_path is null and not coalesce(v_settings.allow_clock_in_without_photo, true) then
    raise exception 'A live photo is required to clock in';
  end if;
  if v_within is not true and not coalesce(v_settings.allow_clock_in_outside_radius, true) then
    raise exception 'You must be at the store to clock in';
  end if;

  v_date := app.location_today(p_location_id);
  insert into public.shifts (organization_id, location_id, employee_id, business_date, clock_in_at, status, verification_status, hourly_rate_snapshot, created_by)
  values (v_loc.organization_id, p_location_id, v_emp.id, v_date, now(), 'active', v_status, app.rate_on(v_emp.id, v_date), v_uid)
  returning * into v_shift;

  if p_photo_path is not null then
    insert into public.shift_photos (organization_id, location_id, shift_id, kind, storage_path, content_hash, bytes, created_by)
    values (v_loc.organization_id, p_location_id, v_shift.id, 'clock_in', p_photo_path, p_photo_hash, p_photo_bytes, v_uid)
    returning id into v_photo;
  end if;
  insert into public.shift_verifications (organization_id, location_id, shift_id, kind, latitude, longitude, accuracy_m, distance_m, radius_m, within_radius, photo_id, status, flags, device_info, created_by)
  values (v_loc.organization_id, p_location_id, v_shift.id, 'clock_in', p_latitude, p_longitude, p_accuracy_m, v_dist, v_radius, v_within, v_photo, v_status, v_flags, coalesce(p_device, '{}'::jsonb), v_uid);

  perform app.log_activity(v_loc.organization_id, p_location_id, 'shift.clock_in', 'shift', v_shift.id, null,
    jsonb_build_object('employee', trim(v_emp.first_name || ' ' || v_emp.last_name), 'status', v_status, 'distance_m', v_dist));
  perform app.notify_managers(v_loc.organization_id, p_location_id, 'employee_clock_in',
    trim(v_emp.first_name || ' ' || v_emp.last_name) || ' clocked in', 'At ' || v_loc.name,
    jsonb_build_object('shift_id', v_shift.id, 'employee_id', v_emp.id));
  if v_status = 'location_issue' then
    perform app.notify_managers(v_loc.organization_id, p_location_id, 'outside_radius',
      trim(v_emp.first_name || ' ' || v_emp.last_name) || ' clocked in outside the store radius',
      v_loc.name || ' — ' || coalesce(round(v_dist)::text || ' m away', 'no location provided'),
      jsonb_build_object('shift_id', v_shift.id, 'employee_id', v_emp.id));
  end if;
  return v_shift;
end $$;

create or replace function app.finalize_shift_minutes(p_shift_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v public.shifts%rowtype; v_minutes int; v_rate numeric;
begin
  select * into v from public.shifts where id = p_shift_id;
  if v.clock_out_at is null then return; end if;
  v_minutes := greatest(0, floor(extract(epoch from (v.clock_out_at - v.clock_in_at)) / 60)::int - coalesce(v.break_minutes, 0));
  v_rate := coalesce(v.hourly_rate_snapshot, app.rate_on(v.employee_id, v.business_date), 0);
  update public.shifts set worked_minutes = v_minutes, hourly_rate_snapshot = v_rate,
    labor_cost = app.round2(v_minutes / 60.0 * v_rate)
  where id = p_shift_id;
end $$;

create or replace function public.clock_out(
  p_shift_id uuid,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_accuracy_m double precision default null,
  p_photo_path text default null,
  p_photo_hash text default null,
  p_photo_bytes int default null,
  p_device jsonb default '{}'::jsonb
) returns public.shifts language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_shift public.shifts%rowtype; v_loc public.locations%rowtype; v_emp public.employees%rowtype;
  v_photo uuid; v_dist double precision; v_radius int; v_within boolean; v_status public.verification_status;
  v_flags text[] := '{}'; v_final public.verification_status;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_shift from public.shifts where id = p_shift_id;
  if v_shift.id is null then raise exception 'Shift not found'; end if;
  if v_shift.status <> 'active' then raise exception 'Shift is not active'; end if;
  select * into v_emp from public.employees where id = v_shift.employee_id;
  if v_emp.user_id is distinct from v_uid and not app.can_manage_location(v_shift.location_id) then
    raise exception 'Not allowed';
  end if;
  select * into v_loc from public.locations where id = v_shift.location_id;

  v_radius := app.effective_radius(v_loc.id);
  v_dist := app.distance_m(p_latitude, p_longitude, v_loc.latitude, v_loc.longitude);
  if v_dist is null then v_within := null; v_flags := array_append(v_flags, 'no_location');
  else v_within := v_dist <= v_radius + least(coalesce(p_accuracy_m, 0), 50); end if;
  if p_photo_hash is not null and exists (
    select 1 from public.shift_photos where organization_id = v_loc.organization_id and content_hash = p_photo_hash and created_at > now() - interval '60 days') then
    v_flags := array_append(v_flags, 'repeat_photo');
  end if;
  if p_photo_path is null then v_status := 'missing_photo';
  elsif v_within is not true then v_status := 'location_issue';
  elsif 'repeat_photo' = any (v_flags) then v_status := 'needs_review';
  else v_status := 'verified'; end if;

  if p_photo_path is not null then
    insert into public.shift_photos (organization_id, location_id, shift_id, kind, storage_path, content_hash, bytes, created_by)
    values (v_loc.organization_id, v_loc.id, v_shift.id, 'clock_out', p_photo_path, p_photo_hash, p_photo_bytes, v_uid)
    returning id into v_photo;
  end if;
  insert into public.shift_verifications (organization_id, location_id, shift_id, kind, latitude, longitude, accuracy_m, distance_m, radius_m, within_radius, photo_id, status, flags, device_info, created_by)
  values (v_loc.organization_id, v_loc.id, v_shift.id, 'clock_out', p_latitude, p_longitude, p_accuracy_m, v_dist, v_radius, v_within, v_photo, v_status, v_flags, coalesce(p_device, '{}'::jsonb), v_uid);

  -- Overall shift status: worst of clock-in and clock-out.
  v_final := case
    when v_shift.verification_status = 'manager_adjusted' then 'manager_adjusted'
    when 'location_issue' in (v_shift.verification_status::text, v_status::text) then 'location_issue'
    when 'missing_photo' in (v_shift.verification_status::text, v_status::text) then 'missing_photo'
    when 'needs_review' in (v_shift.verification_status::text, v_status::text) then 'needs_review'
    when v_shift.verification_status = 'verified' and v_status = 'verified' then 'verified'
    else 'unverified' end;

  update public.shifts set clock_out_at = now(), status = 'completed', verification_status = v_final where id = p_shift_id;
  perform app.finalize_shift_minutes(p_shift_id);
  select * into v_shift from public.shifts where id = p_shift_id;

  perform app.log_activity(v_loc.organization_id, v_loc.id, 'shift.clock_out', 'shift', v_shift.id, null,
    jsonb_build_object('employee', trim(v_emp.first_name || ' ' || v_emp.last_name), 'minutes', v_shift.worked_minutes, 'status', v_final));
  perform app.notify_managers(v_loc.organization_id, v_loc.id, 'employee_clock_out',
    trim(v_emp.first_name || ' ' || v_emp.last_name) || ' clocked out',
    v_loc.name || ' — ' || (v_shift.worked_minutes / 60)::text || 'h ' || (v_shift.worked_minutes % 60)::text || 'm',
    jsonb_build_object('shift_id', v_shift.id, 'employee_id', v_emp.id));
  if v_status = 'location_issue' then
    perform app.notify_managers(v_loc.organization_id, v_loc.id, 'outside_radius',
      trim(v_emp.first_name || ' ' || v_emp.last_name) || ' clocked out outside the store radius', v_loc.name,
      jsonb_build_object('shift_id', v_shift.id, 'employee_id', v_emp.id));
  end if;
  return v_shift;
end $$;

-- Manager time adjustment: audited, reason required, never silent.
create or replace function public.adjust_shift(p_shift_id uuid, p_clock_in timestamptz, p_clock_out timestamptz, p_reason text, p_break_minutes int default null)
returns public.shifts language plpgsql security definer set search_path = public as $$
declare v public.shifts%rowtype; v_uid uuid := auth.uid(); v_before jsonb;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required'; end if;
  select * into v from public.shifts where id = p_shift_id;
  if v.id is null then raise exception 'Shift not found'; end if;
  if not app.can_manage_location(v.location_id) then raise exception 'Not allowed'; end if;
  if not (app.is_org_owner(v.organization_id) or app.member_permission(v.organization_id, 'can_edit_hours')) then
    raise exception 'You do not have permission to adjust hours';
  end if;
  if p_clock_out is not null and p_clock_out < p_clock_in then raise exception 'Clock-out must be after clock-in'; end if;
  v_before := to_jsonb(v);
  insert into public.time_adjustments (organization_id, location_id, shift_id, adjusted_by, reason, original_clock_in, original_clock_out, new_clock_in, new_clock_out, original_minutes)
  values (v.organization_id, v.location_id, v.id, v_uid, p_reason, v.clock_in_at, v.clock_out_at, p_clock_in, p_clock_out, v.worked_minutes);
  update public.shifts set clock_in_at = p_clock_in, clock_out_at = p_clock_out,
    break_minutes = coalesce(p_break_minutes, break_minutes),
    status = case when p_clock_out is null then 'active'::public.shift_status else 'completed'::public.shift_status end,
    verification_status = 'manager_adjusted',
    business_date = (p_clock_in at time zone (select timezone from public.locations where id = v.location_id))::date
  where id = p_shift_id;
  perform app.finalize_shift_minutes(p_shift_id);
  select * into v from public.shifts where id = p_shift_id;
  update public.time_adjustments set new_minutes = v.worked_minutes where shift_id = p_shift_id and adjusted_by = v_uid and created_at = (select max(created_at) from public.time_adjustments where shift_id = p_shift_id);
  perform app.log_activity(v.organization_id, v.location_id, 'shift.adjusted', 'shift', v.id, v_before, to_jsonb(v), p_reason);
  return v;
end $$;

-- Manual shift entry by a manager (e.g. forgot to clock in). Audited; verification = manual.
create or replace function public.create_manual_shift(p_location_id uuid, p_employee_id uuid, p_clock_in timestamptz, p_clock_out timestamptz, p_reason text, p_break_minutes int default 0)
returns public.shifts language plpgsql security definer set search_path = public as $$
declare v public.shifts%rowtype; v_org uuid; v_uid uuid := auth.uid(); v_date date;
begin
  if not app.can_manage_location(p_location_id) then raise exception 'Not allowed'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required'; end if;
  v_org := app.location_org(p_location_id);
  if not exists (select 1 from public.employees where id = p_employee_id and organization_id = v_org) then raise exception 'Employee not found'; end if;
  v_date := (p_clock_in at time zone (select timezone from public.locations where id = p_location_id))::date;
  insert into public.shifts (organization_id, location_id, employee_id, business_date, clock_in_at, clock_out_at, status, verification_status, break_minutes, hourly_rate_snapshot, source, note, created_by)
  values (v_org, p_location_id, p_employee_id, v_date, p_clock_in, p_clock_out,
    case when p_clock_out is null then 'active'::public.shift_status else 'completed'::public.shift_status end, 'manual', coalesce(p_break_minutes, 0),
    app.rate_on(p_employee_id, v_date), 'manual', p_reason, v_uid)
  returning * into v;
  perform app.finalize_shift_minutes(v.id);
  select * into v from public.shifts where id = v.id;
  perform app.log_activity(v_org, p_location_id, 'shift.manual_created', 'shift', v.id, null, to_jsonb(v), p_reason);
  return v;
end $$;

-- ================================================================ daily close
-- Direct updates to a closed report are blocked unless made through edit_daily_report (which audits them).
create or replace function app.guard_closed_report() returns trigger
language plpgsql as $$
begin
  if old.status = 'closed' and current_setting('app.closed_edit', true) is distinct from 'on' then
    raise exception 'This day is closed. Use edit_daily_report with a reason.';
  end if;
  return new;
end $$;
create trigger daily_reports_closed_guard before update on public.daily_reports
  for each row execute function app.guard_closed_report();

-- Attention items for a location/day (used by close confirmation, brief and dashboard).
create or replace function app.day_attention(p_loc uuid, p_date date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb := '[]'::jsonb; a public.daily_accounting%rowtype; r record; ls public.location_settings%rowtype;
begin
  select * into a from public.daily_accounting where location_id = p_loc and business_date = p_date;
  select * into ls from public.location_settings where location_id = p_loc;
  if a.cash_difference is not null and a.cash_difference < 0 then
    v := v || jsonb_build_object('kind', 'cash_short', 'severity', 'warn', 'amount', a.cash_difference,
      'message', 'Cash is $' || to_char(abs(a.cash_difference), 'FM999,999,990.00') || ' short');
  elsif a.cash_difference is not null and a.cash_difference > 0 then
    v := v || jsonb_build_object('kind', 'cash_over', 'severity', 'info', 'amount', a.cash_difference,
      'message', 'Cash is $' || to_char(a.cash_difference, 'FM999,999,990.00') || ' over');
  end if;
  for r in select s.id, trim(e.first_name || ' ' || e.last_name) as name, s.clock_in_at from public.shifts s
      join public.employees e on e.id = s.employee_id
      where s.location_id = p_loc and s.business_date = p_date and s.status = 'active' loop
    v := v || jsonb_build_object('kind', 'still_clocked_in', 'severity', 'warn', 'shift_id', r.id, 'employee', r.name,
      'started_at', r.clock_in_at, 'message', r.name || ' is still clocked in');
  end loop;
  for r in select s.id, trim(e.first_name || ' ' || e.last_name) as name, s.verification_status from public.shifts s
      join public.employees e on e.id = s.employee_id
      where s.location_id = p_loc and s.business_date = p_date and s.verification_status in ('location_issue', 'missing_photo', 'needs_review') loop
    v := v || jsonb_build_object('kind', 'shift_' || r.verification_status, 'severity', 'info', 'shift_id', r.id, 'employee', r.name,
      'message', r.name || case r.verification_status when 'location_issue' then ' clocked in outside the allowed radius'
        when 'missing_photo' then ' clocked in without a photo' else ' has a shift that needs review' end);
  end loop;
  if coalesce(ls.require_closing_checklist, false) and not exists (
      select 1 from public.checklist_submissions where location_id = p_loc and business_date = p_date and kind = 'closing' and status = 'completed') then
    v := v || jsonb_build_object('kind', 'missing_closing_checklist', 'severity', 'warn', 'message', 'Closing checklist not completed');
  end if;
  if coalesce(ls.require_opening_checklist, false) and not exists (
      select 1 from public.checklist_submissions where location_id = p_loc and business_date = p_date and kind = 'opening' and status = 'completed') then
    v := v || jsonb_build_object('kind', 'missing_opening_checklist', 'severity', 'info', 'message', 'Opening checklist not completed');
  end if;
  return v;
end $$;

-- Comparisons for a closed day: vs yesterday, vs same weekday last week, vs trailing 30-day average.
create or replace function app.day_comparisons(p_loc uuid, p_date date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_today numeric; v_yest numeric; v_lastwk numeric; v_avg numeric; v_profit numeric; v_profit_yest numeric;
begin
  select total_sales, profit into v_today, v_profit from public.daily_accounting where location_id = p_loc and business_date = p_date;
  select total_sales, profit into v_yest, v_profit_yest from public.daily_accounting where location_id = p_loc and business_date = p_date - 1 and daily_report_id is not null;
  select total_sales into v_lastwk from public.daily_accounting where location_id = p_loc and business_date = p_date - 7 and daily_report_id is not null;
  select avg(total_sales) into v_avg from public.daily_accounting
    where location_id = p_loc and business_date between p_date - 30 and p_date - 1 and daily_report_id is not null and total_sales > 0;
  return jsonb_build_object(
    'vs_yesterday', case when coalesce(v_yest, 0) > 0 then round((v_today - v_yest) / v_yest * 100, 1) end,
    'vs_last_week', case when coalesce(v_lastwk, 0) > 0 then round((v_today - v_lastwk) / v_lastwk * 100, 1) end,
    'vs_average', case when coalesce(v_avg, 0) > 0 then round((v_today - v_avg) / v_avg * 100, 1) end,
    'yesterday_sales', v_yest, 'last_week_sales', v_lastwk, 'average_sales', app.round2(v_avg),
    'profit_vs_yesterday', case when coalesce(v_profit_yest, 0) > 0 then round((v_profit - v_profit_yest) / v_profit_yest * 100, 1) end
  );
end $$;

create or replace function public.close_day(p_location_id uuid, p_date date)
returns public.closeout_reports language plpgsql security definer set search_path = public as $$
declare r public.daily_reports%rowtype; a public.daily_accounting%rowtype; ls public.location_settings%rowtype;
  v_uid uuid := auth.uid(); v_snap public.closeout_reports%rowtype; v_att jsonb; v_cmp jsonb; v_loc public.locations%rowtype;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not app.can_manage_location(p_location_id) then raise exception 'Not allowed'; end if;
  select * into r from public.daily_reports where location_id = p_location_id and business_date = p_date;
  if r.id is null then raise exception 'Nothing entered for this day yet'; end if;
  if r.status = 'closed' then raise exception 'Day is already closed'; end if;
  if r.cash_sales is null and r.card_sales is null and r.other_sales is null then raise exception 'Enter sales before closing'; end if;
  select * into ls from public.location_settings where location_id = p_location_id;
  if coalesce(ls.require_cash_count, false) and r.actual_cash is null then raise exception 'A cash count is required before closing'; end if;
  if coalesce(ls.require_closing_checklist, false) and not exists (
      select 1 from public.checklist_submissions where location_id = p_location_id and business_date = p_date and kind = 'closing' and status = 'completed') then
    raise exception 'The closing checklist must be completed before closing';
  end if;
  if coalesce(ls.require_manager_approval, false) and not app.is_org_manager(r.organization_id) then
    raise exception 'A manager or owner must close this day';
  end if;

  select * into a from public.daily_accounting where location_id = p_location_id and business_date = p_date;
  v_att := app.day_attention(p_location_id, p_date);
  v_cmp := app.day_comparisons(p_location_id, p_date);

  perform set_config('app.closed_edit', 'on', true);
  update public.daily_reports set status = 'closed', closed_at = now(), closed_by = v_uid, close_count = close_count + 1 where id = r.id;
  perform set_config('app.closed_edit', 'off', true);

  insert into public.closeout_reports (organization_id, location_id, daily_report_id, business_date,
    cash_sales, card_sales, other_sales, total_sales, goods_total, labor_total, utilities_total, other_total,
    total_expenses, profit, margin, labor_minutes, labor_employee_count, expected_cash, actual_cash, cash_difference,
    attention, comparisons, closed_by)
  values (r.organization_id, p_location_id, r.id, p_date,
    coalesce(a.cash_sales, 0), coalesce(a.card_sales, 0), coalesce(a.other_sales, 0), a.total_sales, a.goods_total, a.labor_total,
    a.utilities_total, a.other_total, a.total_expenses, a.profit, a.margin_pct, a.labor_minutes, a.labor_employee_count,
    a.expected_cash, a.actual_cash, a.cash_difference, v_att, v_cmp, v_uid)
  returning * into v_snap;

  select * into v_loc from public.locations where id = p_location_id;
  perform app.log_activity(r.organization_id, p_location_id, 'day.closed', 'daily_report', r.id, null,
    jsonb_build_object('date', p_date, 'sales', a.total_sales, 'profit', a.profit));
  if a.cash_difference is not null and a.cash_difference < 0 then
    perform app.notify_managers(r.organization_id, p_location_id, 'cash_shortage',
      v_loc.name || ' was $' || to_char(abs(a.cash_difference), 'FM999,999,990.00') || ' short',
      'Closeout for ' || to_char(p_date, 'Mon DD'), jsonb_build_object('daily_report_id', r.id, 'date', p_date), abs(a.cash_difference));
  end if;
  return v_snap;
end $$;

create or replace function public.reopen_day(p_report_id uuid, p_reason text)
returns public.daily_reports language plpgsql security definer set search_path = public as $$
declare r public.daily_reports%rowtype; v_uid uuid := auth.uid();
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required'; end if;
  select * into r from public.daily_reports where id = p_report_id;
  if r.id is null then raise exception 'Not found'; end if;
  if not app.can_manage_location(r.location_id) then raise exception 'Not allowed'; end if;
  if not (app.is_org_owner(r.organization_id) or app.member_permission(r.organization_id, 'can_edit_closed_days')) then
    raise exception 'You do not have permission to reopen closed days';
  end if;
  if r.status <> 'closed' then raise exception 'Day is not closed'; end if;
  perform set_config('app.closed_edit', 'on', true);
  update public.daily_reports set status = 'open', reopened_at = now(), reopened_by = v_uid where id = r.id;
  perform set_config('app.closed_edit', 'off', true);
  perform app.log_activity(r.organization_id, r.location_id, 'day.reopened', 'daily_report', r.id, to_jsonb(r), null, p_reason);
  select * into r from public.daily_reports where id = p_report_id;
  return r;
end $$;

-- Edit numbers on a report. Open days: free (draft autosave). Closed days: reason required + audited.
create or replace function public.edit_daily_report(p_report_id uuid, p_patch jsonb, p_reason text default null)
returns public.daily_reports language plpgsql security definer set search_path = public as $$
declare r public.daily_reports%rowtype; v_before jsonb; v_after jsonb; k text; v_allowed text[] :=
  array['cash_sales','card_sales','other_sales','cash_goods','check_goods','utilities','other_expenses','expected_cash','actual_cash','notes'];
begin
  select * into r from public.daily_reports where id = p_report_id;
  if r.id is null then raise exception 'Not found'; end if;
  if not app.can_manage_location(r.location_id) then raise exception 'Not allowed'; end if;
  for k in select jsonb_object_keys(p_patch) loop
    if not (k = any (v_allowed)) then raise exception 'Field % cannot be edited', k; end if;
  end loop;
  if r.status = 'closed' then
    if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required to edit a closed day'; end if;
    if not (app.is_org_owner(r.organization_id) or app.member_permission(r.organization_id, 'can_edit_closed_days')) then
      raise exception 'You do not have permission to edit closed days';
    end if;
    perform set_config('app.closed_edit', 'on', true);
  end if;
  v_before := to_jsonb(r);
  update public.daily_reports set
    cash_sales = case when p_patch ? 'cash_sales' then (p_patch ->> 'cash_sales')::numeric else cash_sales end,
    card_sales = case when p_patch ? 'card_sales' then (p_patch ->> 'card_sales')::numeric else card_sales end,
    other_sales = case when p_patch ? 'other_sales' then (p_patch ->> 'other_sales')::numeric else other_sales end,
    cash_goods = case when p_patch ? 'cash_goods' then (p_patch ->> 'cash_goods')::numeric else cash_goods end,
    check_goods = case when p_patch ? 'check_goods' then (p_patch ->> 'check_goods')::numeric else check_goods end,
    utilities = case when p_patch ? 'utilities' then (p_patch ->> 'utilities')::numeric else utilities end,
    other_expenses = case when p_patch ? 'other_expenses' then (p_patch ->> 'other_expenses')::numeric else other_expenses end,
    expected_cash = case when p_patch ? 'expected_cash' then (p_patch ->> 'expected_cash')::numeric else expected_cash end,
    actual_cash = case when p_patch ? 'actual_cash' then (p_patch ->> 'actual_cash')::numeric else actual_cash end,
    notes = case when p_patch ? 'notes' then (p_patch ->> 'notes') else notes end
  where id = p_report_id;
  perform set_config('app.closed_edit', 'off', true);
  select * into r from public.daily_reports where id = p_report_id;
  v_after := to_jsonb(r);
  if v_before ->> 'status' = 'closed' then
    perform app.log_activity(r.organization_id, r.location_id, 'report.edited_closed', 'daily_report', r.id, v_before, v_after, p_reason);
  end if;
  return r;
end $$;

-- Draft upsert used by Quick Close / Rapid Entry autosave. Only for open days.
create or replace function public.save_daily_report_draft(p_location_id uuid, p_date date, p_patch jsonb)
returns public.daily_reports language plpgsql security definer set search_path = public as $$
declare r public.daily_reports%rowtype; v_org uuid; v_uid uuid := auth.uid();
begin
  if not app.can_manage_location(p_location_id) then raise exception 'Not allowed'; end if;
  v_org := app.location_org(p_location_id);
  insert into public.daily_reports (organization_id, location_id, business_date, created_by)
  values (v_org, p_location_id, p_date, v_uid)
  on conflict (location_id, business_date) do nothing;
  select * into r from public.daily_reports where location_id = p_location_id and business_date = p_date;
  if r.status = 'closed' then raise exception 'Day is closed'; end if;
  return public.edit_daily_report(r.id, p_patch, null);
end $$;

-- ================================================================ store status (opened/closed today)
create or replace function public.store_status(p_org uuid, p_date date)
returns table (
  location_id uuid, opened_at timestamptz, opened_by_name text, closed_at timestamptz, closed_by_name text,
  working_count int, closeout_status public.report_status, closeout_id uuid,
  opening_checklist_status public.submission_status, closing_checklist_status public.submission_status
) language sql stable security invoker set search_path = public as $$
  select l.id,
    coalesce(o.completed_at, fs.first_in) as opened_at,
    coalesce(o.by_name, fs.first_name) as opened_by_name,
    c.completed_at as closed_at, c.by_name as closed_by_name,
    coalesce(w.cnt, 0)::int, r.status, r.id, o.status, c.status
  from public.locations l
  left join lateral (
    select s.completed_at, s.status, trim(e.first_name || ' ' || e.last_name) as by_name
    from public.checklist_submissions s left join public.employees e on e.user_id = s.submitted_by and e.organization_id = l.organization_id
    where s.location_id = l.id and s.business_date = p_date and s.kind = 'opening' order by s.completed_at desc nulls last limit 1) o on true
  left join lateral (
    select s.completed_at, s.status, trim(e.first_name || ' ' || e.last_name) as by_name
    from public.checklist_submissions s left join public.employees e on e.user_id = s.submitted_by and e.organization_id = l.organization_id
    where s.location_id = l.id and s.business_date = p_date and s.kind = 'closing' order by s.completed_at desc nulls last limit 1) c on true
  left join lateral (
    select min(s.clock_in_at) as first_in, (array_agg(trim(e.first_name || ' ' || e.last_name) order by s.clock_in_at))[1] as first_name
    from public.shifts s join public.employees e on e.id = s.employee_id
    where s.location_id = l.id and s.business_date = p_date and s.status <> 'cancelled') fs on true
  left join lateral (select count(*) as cnt from public.shifts s where s.location_id = l.id and s.status = 'active') w on true
  left join public.daily_reports r on r.location_id = l.id and r.business_date = p_date
  where l.organization_id = p_org and l.is_active;
$$;

-- ================================================================ recurring expenses
-- Materialize due recurring expenses up to a date (idempotent). Called by cron and on expense pages.
create or replace function public.materialize_recurring_expenses(p_org uuid, p_until date default current_date)
returns int language plpgsql security definer set search_path = public as $$
declare re record; v_count int := 0; v_due date; v_next date;
begin
  if not app.is_org_manager(p_org) and auth.role() is distinct from 'service_role' and auth.uid() is not null then
    raise exception 'Not allowed';
  end if;
  for re in select * from public.recurring_expenses where organization_id = p_org and is_active loop
    v_due := re.next_due_date;
    while v_due <= p_until loop
      insert into public.expenses (organization_id, location_id, business_date, amount, category_id, payment_method, vendor, description, recurring_expense_id, status, paid_at, created_by)
      values (re.organization_id, re.location_id, v_due, re.amount, re.category_id, re.payment_method, re.vendor, re.description, re.id,
        case when re.auto_mark_paid then 'paid'::public.expense_status else 'expected'::public.expense_status end, case when re.auto_mark_paid then now() end, re.created_by)
      on conflict do nothing;
      v_count := v_count + 1;
      v_next := case re.frequency
        when 'weekly' then v_due + 7
        when 'biweekly' then v_due + 14
        when 'monthly' then (date_trunc('month', v_due) + interval '1 month' + ((least(coalesce(re.day_of_month, extract(day from v_due)::int), 28) - 1) || ' days')::interval)::date
        when 'yearly' then (v_due + interval '1 year')::date end;
      v_due := v_next;
    end loop;
    update public.recurring_expenses set next_due_date = v_due where id = re.id and next_due_date <> v_due;
  end loop;
  return v_count;
end $$;

-- ================================================================ grants
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema app to authenticated, service_role;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;
grant execute on all functions in schema app to authenticated, service_role;
grant execute on function public.invitation_preview(text) to anon;
alter default privileges in schema public grant all on tables to authenticated, service_role;
alter default privileges in schema public grant execute on functions to authenticated, service_role;

-- Public wrapper so server actions can log activity for edits done through plain table updates.
create or replace function public.log_activity_public(
  p_org uuid, p_loc uuid, p_action text, p_entity_type text default null, p_entity_id uuid default null,
  p_before jsonb default null, p_after jsonb default null, p_note text default null
) returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not app.is_org_member(p_org) then raise exception 'Not allowed'; end if;
  return app.log_activity(p_org, p_loc, p_action, p_entity_type, p_entity_id, p_before, p_after, p_note);
end $$;
grant execute on function public.log_activity_public(uuid, uuid, text, text, uuid, jsonb, jsonb, text) to authenticated, service_role;
