import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/permissions";
import { formatMoney } from "@/lib/utils/currency";
import { formatDateTime, formatMinutes, formatShortDate, formatTime, resolveRange } from "@/lib/utils/time";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader, TableWrap } from "@/components/ui/misc";
import { Stat } from "@/components/ui/stat";
import { RoleBadge, AccountBadge, WorkingDot } from "@/components/team/team-badges";
import { EmployeeProfileForm } from "@/components/team/employee-profile-form";
import { PayRatePanel } from "@/components/team/pay-rate-panel";
import { PermissionsEditor } from "@/components/team/permissions-editor";
import { EmploymentStatusButton } from "@/components/team/employment-status-button";
import { ResendInvite } from "@/components/team/resend-invite";
import { accountState, hoursByEmployee } from "../data";
import { siteUrl } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireManagerContext();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase.from("employees").select("*").eq("organization_id", ctx.org.id).eq("id", id).maybeSingle();
  if (!emp) notFound();

  const wso = ctx.settings.week_starts_on;
  const thisWeek = resolveRange("this_week", ctx.today, wso);
  const lastWeek = resolveRange("last_week", ctx.today, wso);
  const thisMonth = resolveRange("this_month", ctx.today, wso);
  const nowIso = new Date().toISOString();

  const [rates, locRows, upcoming, recent, activeShift, invitation, member, hw, hl, hm] = await Promise.all([
    supabase.from("employee_pay_rates").select("id, hourly_rate, effective_from, created_at").eq("employee_id", id).order("effective_from", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("employee_locations").select("location_id").eq("employee_id", id),
    supabase.from("schedules").select("id, starts_at, ends_at, note, location_id, locations(name, timezone)").eq("employee_id", id).gte("starts_at", nowIso).order("starts_at").limit(7),
    supabase.from("shifts").select("id, business_date, clock_in_at, clock_out_at, worked_minutes, hourly_rate_snapshot, labor_cost, status, verification_status, location_id, locations(name, timezone)").eq("employee_id", id).neq("status", "cancelled").order("clock_in_at", { ascending: false }).limit(30),
    supabase.from("shifts").select("id, clock_in_at, location_id, locations(name, timezone)").eq("employee_id", id).eq("status", "active").maybeSingle(),
    supabase.from("invitations").select("token, expires_at").eq("employee_id", id).eq("status", "pending").gt("expires_at", nowIso).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    emp.user_id ? supabase.from("organization_members").select("id, role, permissions, status").eq("organization_id", ctx.org.id).eq("user_id", emp.user_id).maybeSingle() : Promise.resolve({ data: null }),
    hoursByEmployee(supabase, ctx.org.id, thisWeek.from, thisWeek.to),
    hoursByEmployee(supabase, ctx.org.id, lastWeek.from, lastWeek.to),
    hoursByEmployee(supabase, ctx.org.id, thisMonth.from, thisMonth.to),
  ]);

  const name = `${emp.first_name} ${emp.last_name ?? ""}`.trim();
  const currency = ctx.settings.currency;
  const locName = new Map(ctx.locations.map((l) => [l.id, l.name]));
  const locationIds = (locRows.data ?? []).map((r) => r.location_id);
  const stores = locationIds.map((x) => locName.get(x)).filter((x): x is string => Boolean(x));
  const rateList = (rates.data ?? []).map((r) => ({ id: r.id, hourly_rate: Number(r.hourly_rate), effective_from: r.effective_from, created_at: r.created_at }));
  const currentRate = rateList.filter((r) => r.effective_from <= ctx.today)[0]?.hourly_rate ?? null;
  const pendingIds = new Set(invitation.data ? [id] : []);
  const account = accountState(emp, pendingIds, id);
  const inviteUrl = invitation.data ? `${siteUrl()}/invite/${invitation.data.token}` : null;
  const working = activeShift.data;
  const workingLoc = working ? (working.locations as { name: string; timezone: string } | null) : null;
  const isSelf = emp.user_id === ctx.user.id;
  const memberPerms = (member.data?.permissions ?? {}) as Partial<Record<PermissionKey, boolean>>;
  const tile = (m: Map<string, { minutes: number; labor_cost: number; shifts: number }>) => m.get(id) ?? { minutes: 0, labor_cost: 0, shifts: 0 };
  const [tw, tl, tm] = [tile(hw), tile(hl), tile(hm)];

  return (
    <div>
      <PageHeader
        back={{ href: "/employees", label: "Employees" }}
        title={<span className="inline-flex items-center gap-2 flex-wrap">{name}<RoleBadge role={emp.role} /><StatusBadge kind="employment" value={emp.employment_status} /><AccountBadge state={account} /></span>}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {stores.length > 0 ? <span>{stores.join(", ")}</span> : <span className="text-warn">No stores assigned</span>}
            {emp.email && <a href={`mailto:${emp.email}`} className="inline-flex items-center gap-1 hover:text-text"><Mail className="h-3 w-3" />{emp.email}</a>}
            {emp.phone && <a href={`tel:${emp.phone}`} className="inline-flex items-center gap-1 hover:text-text"><Phone className="h-3 w-3" />{emp.phone}</a>}
            {emp.start_date && <span>Started {formatShortDate(emp.start_date)}, {emp.start_date.slice(0, 4)}</span>}
            {emp.end_date && <span>Ended {formatShortDate(emp.end_date)}, {emp.end_date.slice(0, 4)}</span>}
            {currentRate != null && <span className="tnum">{formatMoney(currentRate, { currency })}/hr</span>}
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {working && workingLoc && (
              <Link href={`/shifts/${working.id}`} className="inline-flex items-center gap-2 rounded-md border border-success/30 bg-success-soft px-2.5 py-1 text-[12.5px]">
                <WorkingDot label={`Working at ${workingLoc.name}`} /><span className="text-text-3">since {formatTime(working.clock_in_at, workingLoc.timezone)}</span>
              </Link>
            )}
            {ctx.isOwner && !isSelf && <EmploymentStatusButton employeeId={id} status={emp.employment_status} name={emp.first_name} hasActiveShift={!!working} />}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="This week" value={formatMinutes(tw.minutes)} sub={`${formatMoney(tw.labor_cost, { currency })} · ${tw.shifts} shifts`} />
        <Stat label="Last week" value={formatMinutes(tl.minutes)} sub={`${formatMoney(tl.labor_cost, { currency })} · ${tl.shifts} shifts`} />
        <Stat label="This month" value={formatMinutes(tm.minutes)} sub={`${formatMoney(tm.labor_cost, { currency })} · ${tm.shifts} shifts`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title="Recent shifts" description="Last 30 · labor = worked minutes × rate snapshot" action={<Link href={`/working`} className="text-[12.5px] text-text-3 hover:text-text">Who&apos;s working →</Link>} />
            {(recent.data ?? []).length === 0 ? (
              <CardBody><p className="text-[13px] text-text-3">No shifts yet. Shifts appear when they clock in, or when a manager adds a manual shift.</p></CardBody>
            ) : (
              <>
                <TableWrap className="hidden md:block border-0 rounded-none border-t">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Store</th><th>In</th><th>Out</th><th className="num">Hours</th><th className="num">Rate</th><th className="num">Cost</th><th>Verification</th></tr></thead>
                    <tbody>
                      {(recent.data ?? []).map((s) => {
                        const l = s.locations as { name: string; timezone: string } | null;
                        const tz = l?.timezone ?? ctx.org.timezone;
                        return (
                          <tr key={s.id}>
                            <td><Link href={`/shifts/${s.id}`} className="font-medium hover:underline">{formatShortDate(s.business_date)}</Link></td>
                            <td className="text-text-2">{l?.name ?? "—"}</td>
                            <td className="tnum">{formatTime(s.clock_in_at, tz)}</td>
                            <td className="tnum">{s.clock_out_at ? formatTime(s.clock_out_at, tz) : <span className="text-success">active</span>}</td>
                            <td className="num">{s.worked_minutes != null ? formatMinutes(s.worked_minutes) : "—"}</td>
                            <td className="num">{s.hourly_rate_snapshot != null ? formatMoney(Number(s.hourly_rate_snapshot), { currency }) : <span className="text-text-3">—</span>}</td>
                            <td className="num">{s.labor_cost != null ? formatMoney(Number(s.labor_cost), { currency }) : <span className="text-text-3">—</span>}</td>
                            <td>{s.status === "active" ? <StatusBadge kind="shift" value="active" /> : <StatusBadge kind="verification" value={s.verification_status} />}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrap>
                <div className="md:hidden divide-y divide-border border-t border-border">
                  {(recent.data ?? []).map((s) => {
                    const l = s.locations as { name: string; timezone: string } | null;
                    const tz = l?.timezone ?? ctx.org.timezone;
                    return (
                      <Link key={s.id} href={`/shifts/${s.id}`} className="block px-4 py-2.5">
                        <div className="flex items-center justify-between"><span className="font-medium">{formatShortDate(s.business_date)}</span><span className="tnum">{s.worked_minutes != null ? formatMinutes(s.worked_minutes) : "—"}{s.labor_cost != null && <span className="text-text-3"> · {formatMoney(Number(s.labor_cost), { currency })}</span>}</span></div>
                        <div className="mt-0.5 flex items-center justify-between text-[12.5px] text-text-2"><span>{l?.name ?? "—"} · {formatTime(s.clock_in_at, tz)} – {s.clock_out_at ? formatTime(s.clock_out_at, tz) : "now"}</span>{s.status === "active" ? <StatusBadge kind="shift" value="active" /> : <StatusBadge kind="verification" value={s.verification_status} />}</div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {ctx.isOwner && (
            <Card>
              <CardHeader title="Edit profile" description="Stores, role, contact and employment details" />
              <CardBody>
                <EmployeeProfileForm
                  employee={{ id, first_name: emp.first_name, last_name: emp.last_name ?? "", email: emp.email, phone: emp.phone, role: emp.role, employment_status: emp.employment_status, start_date: emp.start_date, end_date: emp.end_date, notes: emp.notes, location_ids: locationIds, user_id: emp.user_id }}
                  locations={ctx.locations.map((l) => ({ id: l.id, name: l.name }))}
                  isSelf={isSelf}
                />
              </CardBody>
            </Card>
          )}
          {!ctx.isOwner && emp.notes && (
            <Card><CardHeader title="Notes" /><CardBody><p className="text-[13px] whitespace-pre-wrap">{emp.notes}</p></CardBody></Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Upcoming shifts" description="Next 7 scheduled" action={<Link href="/schedule" className="text-[12.5px] text-text-3 hover:text-text">Schedule →</Link>} />
            <CardBody>
              {(upcoming.data ?? []).length === 0 ? <p className="text-[13px] text-text-3">Nothing scheduled.</p> : (
                <ul className="divide-y divide-border -my-1">
                  {(upcoming.data ?? []).map((s) => {
                    const l = s.locations as { name: string; timezone: string } | null;
                    const tz = l?.timezone ?? ctx.org.timezone;
                    return (
                      <li key={s.id} className="py-1.5 text-[13px] flex items-start justify-between gap-2">
                        <div><div className="font-medium tnum">{formatDateTime(s.starts_at, tz)} – {formatTime(s.ends_at, tz)}</div><div className="text-[12px] text-text-3">{l?.name ?? "—"}{s.note ? ` · ${s.note}` : ""}</div></div>
                        <span className="tnum text-text-3 text-[12px] whitespace-nowrap">{formatMinutes((new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 60000)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pay rate" description={currentRate != null ? `Current: ${formatMoney(currentRate, { currency })}/hr` : "No current rate"} />
            <CardBody><PayRatePanel employeeId={id} rates={rateList} today={ctx.today} canEdit={ctx.isOwner} currency={currency} /></CardBody>
          </Card>

          {ctx.isOwner && !emp.user_id && (
            <Card>
              <CardHeader title="Account" description={emp.email ? "They have not joined yet." : "Add an email in the profile to invite them."} />
              <CardBody>
                {emp.email ? <ResendInvite employeeId={id} existingUrl={inviteUrl} label={inviteUrl ? "Resend invitation" : "Send invitation"} /> : <p className="text-[13px] text-text-3">Without an account they cannot clock in themselves; managers can still add manual shifts for them.</p>}
              </CardBody>
            </Card>
          )}

          {ctx.isOwner && emp.role === "manager" && (
            <Card>
              <CardHeader title="Manager permissions" description={emp.user_id ? "What this manager may do in the stores they are assigned to" : "Available once they accept the invitation"} />
              <CardBody>
                {emp.user_id && member.data ? (
                  member.data.role === "owner" ? <p className="text-[13px] text-text-3">This person is an owner and has every permission.</p> : <PermissionsEditor employeeId={id} initial={memberPerms} />
                ) : (
                  <p className="text-[13px] text-text-3">Permissions are stored on the account. Send the invitation and come back after they join.</p>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
