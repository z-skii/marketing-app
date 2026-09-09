-- Storeday — core schema.
-- Multi-tenant: every business row carries organization_id; location_id where relevant.
-- All ids are UUIDs. Money is numeric(12,2) in the business's currency.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ enums
create type public.org_role as enum ('owner', 'manager', 'employee');
create type public.member_status as enum ('active', 'invited', 'inactive');
create type public.employment_status as enum ('active', 'inactive', 'terminated');
create type public.shift_status as enum ('active', 'completed', 'cancelled');
create type public.verification_status as enum (
  'verified', 'location_issue', 'missing_photo', 'needs_review', 'manager_adjusted', 'manual', 'unverified'
);
create type public.verification_kind as enum ('clock_in', 'clock_out');
create type public.report_status as enum ('open', 'closed');
create type public.accounting_bucket as enum ('goods', 'labor', 'utilities', 'other');
create type public.payment_method as enum ('cash', 'credit_card', 'debit_card', 'check', 'ach', 'other');
create type public.expense_status as enum ('paid', 'expected');
create type public.recurrence_frequency as enum ('weekly', 'biweekly', 'monthly', 'yearly');
create type public.checklist_kind as enum ('opening', 'closing', 'custom');
create type public.submission_status as enum ('in_progress', 'completed');
create type public.notification_kind as enum (
  'employee_clock_in', 'employee_clock_out', 'employee_late', 'store_not_opened', 'store_not_closed',
  'missing_closeout', 'cash_shortage', 'large_expense', 'outside_radius', 'forgot_clock_out',
  'invitation', 'general'
);
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- ------------------------------------------------------------------ helpers
create schema if not exists app;

create or replace function app.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------------ profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  active_organization_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function app.set_updated_at();

-- Auto-create a profile for every auth user.
create or replace function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function app.handle_new_user();

-- ------------------------------------------------------------------ organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text,
  currency text not null default 'USD',
  timezone text not null default 'America/New_York',
  owner_id uuid not null references auth.users(id),
  onboarding_step int not null default 1,
  onboarding_completed boolean not null default false,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index organizations_owner_idx on public.organizations(owner_id);
create trigger organizations_updated before update on public.organizations for each row execute function app.set_updated_at();

create table public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  currency text not null default 'USD',
  week_starts_on int not null default 1 check (week_starts_on between 0 and 6), -- 0=Sunday
  cash_check_enabled boolean not null default true,
  other_sales_enabled boolean not null default true,
  default_geofence_radius_m int not null default 76, -- ~250 ft
  overtime_enabled boolean not null default true,
  overtime_weekly_hours numeric(5,2) not null default 40,
  overtime_daily_hours numeric(5,2),          -- null = no daily OT rule
  overtime_multiplier numeric(4,2) not null default 1.5,
  allow_clock_in_without_photo boolean not null default true, -- flagged, not blocked
  allow_clock_in_outside_radius boolean not null default true, -- flagged, not blocked
  employee_can_view_accounting boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organization_settings_updated before update on public.organization_settings for each row execute function app.set_updated_at();

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'employee',
  status public.member_status not null default 'active',
  -- manager permissions: can_edit_hours, can_manage_schedule, can_edit_closed_days, can_add_expenses, can_view_reports
  permissions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members(user_id);
create trigger organization_members_updated before update on public.organization_members for each row execute function app.set_updated_at();

-- ------------------------------------------------------------------ locations
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  phone text,
  timezone text not null default 'America/New_York',
  latitude double precision,
  longitude double precision,
  geofence_radius_m int,                       -- null = organization default
  is_active boolean not null default true,
  sort_order int not null default 0,
  color text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index locations_org_idx on public.locations(organization_id);
create trigger locations_updated before update on public.locations for each row execute function app.set_updated_at();

create table public.location_settings (
  location_id uuid primary key references public.locations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  require_accounting_closeout boolean not null default true,
  require_closing_checklist boolean not null default false,
  require_opening_checklist boolean not null default false,
  require_employee_verification boolean not null default true,
  require_cash_count boolean not null default false,
  require_manager_approval boolean not null default false,
  starting_cash numeric(12,2) not null default 0,    -- drawer float used for expected cash
  opens_at time,                                     -- for "store did not open" alerts
  closes_at time,                                    -- for "store did not close" alerts
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger location_settings_updated before update on public.location_settings for each row execute function app.set_updated_at();

create table public.location_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_primary boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (location_id, user_id)
);
create index location_members_user_idx on public.location_members(user_id);
create index location_members_org_idx on public.location_members(organization_id);

-- ------------------------------------------------------------------ employees
-- The HR record. Exists before the person has an account (user_id null until the invite is accepted).
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null default '',
  email text,
  phone text,
  role public.org_role not null default 'employee',
  employment_status public.employment_status not null default 'active',
  start_date date,
  end_date date,
  default_location_id uuid references public.locations(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index employees_org_idx on public.employees(organization_id);
create unique index employees_org_user_idx on public.employees(organization_id, user_id) where user_id is not null;
create trigger employees_updated before update on public.employees for each row execute function app.set_updated_at();

create table public.employee_pay_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  effective_from date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index employee_pay_rates_emp_idx on public.employee_pay_rates(employee_id, effective_from desc);

create table public.employee_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (employee_id, location_id)
);
create index employee_locations_loc_idx on public.employee_locations(location_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  email text not null,
  role public.org_role not null default 'employee',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invitations_org_idx on public.invitations(organization_id);
create trigger invitations_updated before update on public.invitations for each row execute function app.set_updated_at();

-- ------------------------------------------------------------------ shifts (Verified Shift)
create table public.shift_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  shift_id uuid,                                  -- set after the shift row exists
  kind public.verification_kind not null,
  storage_bucket text not null default 'shift-photos',
  storage_path text not null,
  content_hash text,                              -- sha256 of bytes, for repeat-photo detection
  content_type text,
  bytes int,
  width int,
  height int,
  taken_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index shift_photos_org_hash_idx on public.shift_photos(organization_id, content_hash);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  business_date date not null,                    -- clock-in date in the location's timezone
  clock_in_at timestamptz not null default now(),
  clock_out_at timestamptz,
  status public.shift_status not null default 'active',
  verification_status public.verification_status not null default 'unverified',
  break_minutes int not null default 0,
  worked_minutes int,                             -- set on clock-out / adjustment
  hourly_rate_snapshot numeric(10,2),
  labor_cost numeric(12,2),
  source text not null default 'clock',           -- 'clock' | 'manual'
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (clock_out_at is null or clock_out_at >= clock_in_at)
);
create index shifts_loc_date_idx on public.shifts(location_id, business_date);
create index shifts_org_date_idx on public.shifts(organization_id, business_date);
create index shifts_employee_idx on public.shifts(employee_id, clock_in_at desc);
create unique index shifts_one_active_per_employee on public.shifts(employee_id) where status = 'active';
create trigger shifts_updated before update on public.shifts for each row execute function app.set_updated_at();
alter table public.shift_photos add constraint shift_photos_shift_fk foreign key (shift_id) references public.shifts(id) on delete cascade;

create table public.shift_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  kind public.verification_kind not null,
  recorded_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  distance_m double precision,
  radius_m int,
  within_radius boolean,
  photo_id uuid references public.shift_photos(id) on delete set null,
  status public.verification_status not null default 'unverified',
  flags text[] not null default '{}',             -- e.g. {repeat_photo, low_accuracy, no_location}
  device_info jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index shift_verifications_shift_idx on public.shift_verifications(shift_id);

create table public.time_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  adjusted_by uuid not null references auth.users(id),
  reason text not null,
  original_clock_in timestamptz,
  original_clock_out timestamptz,
  new_clock_in timestamptz,
  new_clock_out timestamptz,
  original_minutes int,
  new_minutes int,
  created_at timestamptz not null default now()
);
create index time_adjustments_shift_idx on public.time_adjustments(shift_id);

-- ------------------------------------------------------------------ schedules
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  series_id uuid,                                 -- recurring series
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index schedules_loc_idx on public.schedules(location_id, starts_at);
create index schedules_emp_idx on public.schedules(employee_id, starts_at);
create trigger schedules_updated before update on public.schedules for each row execute function app.set_updated_at();

-- ------------------------------------------------------------------ accounting
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  bucket public.accounting_bucket not null default 'other',
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);
create trigger expense_categories_updated before update on public.expense_categories for each row execute function app.set_updated_at();

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  storage_bucket text not null default 'receipts',
  storage_path text not null,
  content_type text,
  bytes int,
  original_filename text,
  -- OCR-ready: populated later by an extraction job; never faked.
  ocr_status text not null default 'none',        -- none | pending | done | failed
  ocr_amount numeric(12,2),
  ocr_date date,
  ocr_vendor text,
  ocr_tax numeric(12,2),
  ocr_category_suggestion text,
  ocr_raw jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index receipts_org_idx on public.receipts(organization_id);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id),
  amount numeric(12,2) not null check (amount >= 0),
  vendor text,
  description text,
  payment_method public.payment_method not null default 'other',
  frequency public.recurrence_frequency not null default 'monthly',
  day_of_month int check (day_of_month between 1 and 31),
  next_due_date date not null,
  auto_mark_paid boolean not null default false,  -- if false, generated rows are 'expected' until confirmed
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recurring_expenses_org_idx on public.recurring_expenses(organization_id);
create trigger recurring_expenses_updated before update on public.recurring_expenses for each row execute function app.set_updated_at();

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  business_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  category_id uuid not null references public.expense_categories(id),
  payment_method public.payment_method not null default 'cash',
  vendor text,
  description text,
  receipt_id uuid references public.receipts(id) on delete set null,
  recurring_expense_id uuid references public.recurring_expenses(id) on delete set null,
  status public.expense_status not null default 'paid',
  paid_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expenses_loc_date_idx on public.expenses(location_id, business_date);
create index expenses_org_date_idx on public.expenses(organization_id, business_date);
create unique index expenses_recurring_once_idx on public.expenses(recurring_expense_id, business_date) where recurring_expense_id is not null;
create trigger expenses_updated before update on public.expenses for each row execute function app.set_updated_at();

-- The daily accounting record: one row per location per business date.
-- Numbers a manager types once. Everything else is derived (see daily_accounting view).
create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  business_date date not null,
  status public.report_status not null default 'open',
  cash_sales numeric(12,2),
  card_sales numeric(12,2),
  other_sales numeric(12,2),
  cash_goods numeric(12,2),
  check_goods numeric(12,2),
  utilities numeric(12,2),
  other_expenses numeric(12,2),
  expected_cash numeric(12,2),
  actual_cash numeric(12,2),
  notes text,
  closed_at timestamptz,
  closed_by uuid references auth.users(id),
  reopened_at timestamptz,
  reopened_by uuid references auth.users(id),
  close_count int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, business_date)
);
create index daily_reports_org_date_idx on public.daily_reports(organization_id, business_date);
create trigger daily_reports_updated before update on public.daily_reports for each row execute function app.set_updated_at();

-- Immutable snapshot taken each time a day is closed. The audit record of what was closed.
create table public.closeout_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  daily_report_id uuid not null references public.daily_reports(id) on delete cascade,
  business_date date not null,
  cash_sales numeric(12,2) not null default 0,
  card_sales numeric(12,2) not null default 0,
  other_sales numeric(12,2) not null default 0,
  total_sales numeric(12,2) not null default 0,
  goods_total numeric(12,2) not null default 0,
  labor_total numeric(12,2) not null default 0,
  utilities_total numeric(12,2) not null default 0,
  other_total numeric(12,2) not null default 0,
  total_expenses numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  margin numeric(8,4),
  labor_minutes int not null default 0,
  labor_employee_count int not null default 0,
  expected_cash numeric(12,2),
  actual_cash numeric(12,2),
  cash_difference numeric(12,2),
  attention jsonb not null default '[]'::jsonb,
  comparisons jsonb not null default '{}'::jsonb,
  closed_by uuid references auth.users(id),
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index closeout_reports_report_idx on public.closeout_reports(daily_report_id, closed_at desc);

-- ------------------------------------------------------------------ Store Check
create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade, -- null = every location
  name text not null,
  kind public.checklist_kind not null default 'custom',
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index checklist_templates_org_idx on public.checklist_templates(organization_id);
create trigger checklist_templates_updated before update on public.checklist_templates for each row execute function app.set_updated_at();

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  label text not null,
  requires_photo boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index checklist_items_template_idx on public.checklist_items(template_id, sort_order);

create table public.checklist_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  kind public.checklist_kind not null,
  business_date date not null,
  status public.submission_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  submitted_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, location_id, business_date)
);
create index checklist_submissions_loc_date_idx on public.checklist_submissions(location_id, business_date);
create trigger checklist_submissions_updated before update on public.checklist_submissions for each row execute function app.set_updated_at();

create table public.checklist_submission_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  submission_id uuid not null references public.checklist_submissions(id) on delete cascade,
  item_id uuid not null references public.checklist_items(id) on delete cascade,
  checked boolean not null default false,
  checked_at timestamptz,
  checked_by uuid references auth.users(id),
  photo_path text,                                -- in bucket checklist-photos
  note text,
  created_at timestamptz not null default now(),
  unique (submission_id, item_id)
);

-- ------------------------------------------------------------------ notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.notification_kind not null default 'general',
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- keys: employee_clock_in, employee_clock_out, employee_late, store_not_opened, store_not_closed,
  -- missing_closeout, cash_shortage, large_expense, outside_radius, forgot_clock_out (booleans)
  -- cash_shortage_threshold, large_expense_threshold (numbers)
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create trigger notification_preferences_updated before update on public.notification_preferences for each row execute function app.set_updated_at();

-- ------------------------------------------------------------------ activity log
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,                            -- e.g. day.closed, day.reopened, report.edited, expense.deleted
  entity_type text,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  note text,
  created_at timestamptz not null default now()
);
create index activity_logs_org_idx on public.activity_logs(organization_id, created_at desc);
create index activity_logs_entity_idx on public.activity_logs(entity_type, entity_id);

-- profiles.active_organization_id references organizations (added after both exist)
alter table public.profiles add constraint profiles_active_org_fk
  foreign key (active_organization_id) references public.organizations(id) on delete set null;
