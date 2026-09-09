import Link from "next/link";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEmployees } from "@/lib/data/team";
import { resolveRange } from "@/lib/utils/time";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { ParamSelect, StoreSelect } from "@/components/ui/filters";
import { Button } from "@/components/ui/button";
import { EmployeeAddButton } from "@/components/team/employee-add-button";
import { EmployeeTable, type EmployeeListRow } from "@/components/team/employee-table";
import { InvitationsList } from "@/components/team/invitations-list";
import { accountState, activeShiftByEmployee, hoursByEmployee, listPendingInvitations, pendingInviteEmployeeIds } from "./data";

export const dynamic = "force-dynamic";

type StatusFilter = "active" | "inactive" | "all";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  const tab = sp.tab === "invitations" && ctx.isOwner ? "invitations" : "employees";
  const status: StatusFilter = sp.status === "inactive" || sp.status === "all" ? sp.status : "active";
  const locationId = sp.location && ctx.locations.some((l) => l.id === sp.location) ? sp.location : null;
  const supabase = await createSupabaseServerClient();
  const week = resolveRange("this_week", ctx.today, ctx.settings.week_starts_on);

  const [employees, hours, active, pendingIds, invitations] = await Promise.all([
    listEmployees(supabase, ctx.org.id, { includeInactive: true }),
    hoursByEmployee(supabase, ctx.org.id, week.from, week.to),
    activeShiftByEmployee(supabase, ctx.org.id),
    pendingInviteEmployeeIds(supabase, ctx.org.id),
    tab === "invitations" ? listPendingInvitations(supabase, ctx.org.id) : Promise.resolve([]),
  ]);
  const locName = new Map(ctx.locations.map((l) => [l.id, l.name]));

  const rows: EmployeeListRow[] = employees
    .filter((e) => status === "all" ? true : status === "active" ? e.employment_status === "active" : e.employment_status !== "active")
    .filter((e) => !locationId || e.location_ids.includes(locationId))
    .map((e) => {
      const h = hours.get(e.id);
      const a = active.get(e.id);
      return {
        id: e.id, full_name: e.full_name, role: e.role, employment_status: e.employment_status,
        stores: e.location_ids.map((id) => locName.get(id)).filter((x): x is string => Boolean(x)),
        hourly_rate: e.hourly_rate, account: accountState(e, pendingIds, e.id),
        week_minutes: h?.minutes ?? 0, week_flagged: h?.flagged ?? 0,
        working: a ? { location_name: locName.get(a.location_id) ?? "store" } : null,
      };
    });

  const pendingCount = pendingIds.size;
  const locs = ctx.locations.map((l) => ({ id: l.id, name: l.name }));
  const tabs = [
    { href: "/employees", label: "Employees", active: tab === "employees", count: employees.filter((e) => e.employment_status === "active").length },
    { href: "/employees/payroll", label: "Payroll estimate", active: false },
    ...(ctx.isOwner ? [{ href: "/employees?tab=invitations", label: "Invitations", active: tab === "invitations", count: pendingCount || undefined }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        description={`${employees.filter((e) => e.employment_status === "active").length} active · ${active.size} working now`}
        actions={ctx.isOwner ? <EmployeeAddButton locations={locs} /> : undefined}
      />
      <Tabs items={tabs} />
      {tab === "invitations" ? (
        <InvitationsList invitations={invitations} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ParamSelect paramKey="status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "all", label: "All statuses" }]} />
            {ctx.locations.length > 1 && <StoreSelect locations={locs} />}
            <span className="text-[12.5px] text-text-3 ml-auto tnum">{rows.length} shown · hours are {week.label.toLowerCase()} ({week.from} → {week.to})</span>
          </div>
          <EmployeeTable rows={rows} currency={ctx.settings.currency} emptyAction={ctx.isOwner ? <EmployeeAddButton locations={locs} /> : undefined} />
          <div className="flex flex-wrap gap-2 text-[12.5px] text-text-3">
            <Link href="/working" className="hover:text-text underline-offset-2 hover:underline">Who&apos;s working →</Link>
            <span>·</span>
            <Link href="/schedule" className="hover:text-text underline-offset-2 hover:underline">Schedule →</Link>
            {!ctx.isOwner && <span className="ml-auto">Only the owner can add or edit employees.</span>}
          </div>
        </div>
      )}
      {tab === "invitations" && <div className="mt-3"><Link href="/employees"><Button variant="ghost" size="sm">← Back to roster</Button></Link></div>}
    </div>
  );
}
