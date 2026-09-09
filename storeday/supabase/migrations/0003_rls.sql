-- Storeday — Row Level Security.
-- Rules: owners see their organization; managers see assigned locations; employees see themselves.
-- Financial data (daily_reports, expenses, closeouts, pay rates) is never visible to employees.

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_settings enable row level security;
alter table public.organization_members enable row level security;
alter table public.locations enable row level security;
alter table public.location_settings enable row level security;
alter table public.location_members enable row level security;
alter table public.employees enable row level security;
alter table public.employee_pay_rates enable row level security;
alter table public.employee_locations enable row level security;
alter table public.invitations enable row level security;
alter table public.shift_photos enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_verifications enable row level security;
alter table public.time_adjustments enable row level security;
alter table public.schedules enable row level security;
alter table public.expense_categories enable row level security;
alter table public.receipts enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.expenses enable row level security;
alter table public.daily_reports enable row level security;
alter table public.closeout_reports enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_items enable row level security;
alter table public.checklist_submissions enable row level security;
alter table public.checklist_submission_items enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.activity_logs enable row level security;

-- profiles: self, plus members of a shared organization can read names.
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from public.organization_members a join public.organization_members b on a.organization_id = b.organization_id
    where a.user_id = auth.uid() and b.user_id = profiles.id and a.status = 'active'));
create policy profiles_update on public.profiles for update using (id = auth.uid());
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());

-- organizations
create policy organizations_select on public.organizations for select using (app.is_org_member(id));
create policy organizations_update on public.organizations for update using (app.is_org_owner(id));
create policy organizations_delete on public.organizations for delete using (owner_id = auth.uid());

create policy organization_settings_select on public.organization_settings for select using (app.is_org_member(organization_id));
create policy organization_settings_write on public.organization_settings for all using (app.is_org_owner(organization_id));

-- organization_members: everyone in the org sees the roster; owners manage it.
create policy organization_members_select on public.organization_members for select using (
  user_id = auth.uid() or app.is_org_member(organization_id));
create policy organization_members_insert on public.organization_members for insert with check (app.is_org_owner(organization_id));
create policy organization_members_update on public.organization_members for update using (app.is_org_owner(organization_id));
create policy organization_members_delete on public.organization_members for delete using (
  app.is_org_owner(organization_id) and user_id <> auth.uid());

-- locations: owner sees all; others their assigned ones.
-- Note: must not look the location row up through a STABLE helper (invisible to RETURNING on insert).
create policy locations_select on public.locations for select using (
  app.is_org_owner(organization_id) or exists (
    select 1 from public.location_members lm where lm.location_id = locations.id and lm.user_id = auth.uid()));
create policy locations_insert on public.locations for insert with check (app.is_org_owner(organization_id));
create policy locations_update on public.locations for update using (app.is_org_owner(organization_id));
create policy locations_delete on public.locations for delete using (app.is_org_owner(organization_id));

create policy location_settings_select on public.location_settings for select using (app.can_access_location(location_id));
create policy location_settings_write on public.location_settings for all using (app.is_org_owner(organization_id));

create policy location_members_select on public.location_members for select using (
  user_id = auth.uid() or app.can_access_location(location_id));
create policy location_members_write on public.location_members for all using (app.is_org_owner(organization_id));

-- employees: managers see the org's roster (needed for schedules, who's working, labor); employees see themselves.
create policy employees_select on public.employees for select using (
  user_id = auth.uid() or app.is_org_manager(organization_id));
create policy employees_insert on public.employees for insert with check (app.is_org_owner(organization_id));
create policy employees_update on public.employees for update using (app.is_org_owner(organization_id));
create policy employees_delete on public.employees for delete using (app.is_org_owner(organization_id));

-- pay rates: owners + managers (labor breakdown), and the employee's own.
create policy employee_pay_rates_select on public.employee_pay_rates for select using (
  app.is_org_manager(organization_id) or app.employee_user(employee_id) = auth.uid());
create policy employee_pay_rates_write on public.employee_pay_rates for all using (app.is_org_owner(organization_id));

create policy employee_locations_select on public.employee_locations for select using (
  app.is_org_manager(organization_id) or app.employee_user(employee_id) = auth.uid());
create policy employee_locations_write on public.employee_locations for all using (app.is_org_owner(organization_id));

create policy invitations_select on public.invitations for select using (app.is_org_manager(organization_id));
create policy invitations_write on public.invitations for all using (app.is_org_owner(organization_id));

-- shifts: managers of the location, or the employee themself. Writes go through RPCs (security definer).
create policy shifts_select on public.shifts for select using (
  app.can_access_location(location_id) and (app.is_org_manager(organization_id) or app.employee_user(employee_id) = auth.uid()));
create policy shifts_delete on public.shifts for delete using (app.is_org_owner(organization_id));

create policy shift_photos_select on public.shift_photos for select using (
  app.is_org_manager(organization_id) or created_by = auth.uid());
create policy shift_verifications_select on public.shift_verifications for select using (
  app.is_org_manager(organization_id) or created_by = auth.uid());
create policy time_adjustments_select on public.time_adjustments for select using (
  app.is_org_manager(organization_id) or exists (
    select 1 from public.shifts s where s.id = time_adjustments.shift_id and app.employee_user(s.employee_id) = auth.uid()));

-- schedules: anyone at the location can see it; owners and permitted managers edit.
create policy schedules_select on public.schedules for select using (app.can_access_location(location_id));
create policy schedules_write on public.schedules for all using (
  app.is_org_owner(organization_id) or (app.can_manage_location(location_id) and app.member_permission(organization_id, 'can_manage_schedule')))
  with check (
  app.is_org_owner(organization_id) or (app.can_manage_location(location_id) and app.member_permission(organization_id, 'can_manage_schedule')));

-- accounting: owners and managers of the location only.
create policy expense_categories_select on public.expense_categories for select using (app.is_org_manager(organization_id));
create policy expense_categories_write on public.expense_categories for all using (app.is_org_owner(organization_id));

create policy receipts_select on public.receipts for select using (app.is_org_manager(organization_id));
create policy receipts_insert on public.receipts for insert with check (app.is_org_manager(organization_id));
create policy receipts_delete on public.receipts for delete using (app.is_org_manager(organization_id));

create policy recurring_expenses_select on public.recurring_expenses for select using (app.can_manage_location(location_id));
create policy recurring_expenses_write on public.recurring_expenses for all using (app.is_org_owner(organization_id));

create policy expenses_select on public.expenses for select using (app.can_manage_location(location_id));
create policy expenses_insert on public.expenses for insert with check (app.can_manage_location(location_id));
create policy expenses_update on public.expenses for update using (app.can_manage_location(location_id));
create policy expenses_delete on public.expenses for delete using (app.can_manage_location(location_id));

create policy daily_reports_select on public.daily_reports for select using (app.can_manage_location(location_id));
create policy daily_reports_insert on public.daily_reports for insert with check (app.can_manage_location(location_id));
create policy daily_reports_update on public.daily_reports for update using (app.can_manage_location(location_id));
create policy daily_reports_delete on public.daily_reports for delete using (app.is_org_owner(organization_id) and status = 'open');

create policy closeout_reports_select on public.closeout_reports for select using (app.can_manage_location(location_id));

-- Store Check
create policy checklist_templates_select on public.checklist_templates for select using (
  app.is_org_member(organization_id) and (location_id is null or app.can_access_location(location_id)));
create policy checklist_templates_write on public.checklist_templates for all using (app.is_org_owner(organization_id));
create policy checklist_items_select on public.checklist_items for select using (app.is_org_member(organization_id));
create policy checklist_items_write on public.checklist_items for all using (app.is_org_owner(organization_id));

create policy checklist_submissions_select on public.checklist_submissions for select using (app.can_access_location(location_id));
create policy checklist_submissions_insert on public.checklist_submissions for insert with check (app.can_access_location(location_id));
create policy checklist_submissions_update on public.checklist_submissions for update using (app.can_access_location(location_id));
create policy checklist_submission_items_select on public.checklist_submission_items for select using (
  exists (select 1 from public.checklist_submissions s where s.id = submission_id and app.can_access_location(s.location_id)));
create policy checklist_submission_items_write on public.checklist_submission_items for all using (
  exists (select 1 from public.checklist_submissions s where s.id = submission_id and app.can_access_location(s.location_id)));

-- notifications: yours only.
create policy notifications_select on public.notifications for select using (user_id = auth.uid());
create policy notifications_update on public.notifications for update using (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete using (user_id = auth.uid());
create policy notification_preferences_all on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- activity logs: managers read; inserts happen through app.log_activity (definer).
create policy activity_logs_select on public.activity_logs for select using (app.is_org_manager(organization_id));

-- ================================================================ realtime
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.shifts, public.daily_reports, public.notifications, public.checklist_submissions;
  end if;
end $$;

-- ================================================================ storage
-- Private buckets. Paths are {organization_id}/{location_id}/... so policies can check access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('shift-photos', 'shift-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('receipts', 'receipts', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('checklist-photos', 'checklist-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'storage' and tablename = 'objects') then
    execute $p$
      create policy storage_private_insert on storage.objects for insert to authenticated with check (
        bucket_id in ('shift-photos', 'receipts', 'checklist-photos')
        and app.is_org_member(((storage.foldername(name))[1])::uuid))
    $p$;
    execute $p$
      create policy storage_private_select on storage.objects for select to authenticated using (
        bucket_id in ('shift-photos', 'receipts', 'checklist-photos')
        and (owner = auth.uid() or app.is_org_manager(((storage.foldername(name))[1])::uuid)))
    $p$;
    execute $p$
      create policy storage_private_delete on storage.objects for delete to authenticated using (
        bucket_id in ('shift-photos', 'receipts', 'checklist-photos')
        and app.is_org_owner(((storage.foldername(name))[1])::uuid))
    $p$;
  end if;
exception when others then
  raise notice 'storage policies skipped: %', sqlerrm;
end $$;
