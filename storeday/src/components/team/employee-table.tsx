import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, TableWrap } from "@/components/ui/misc";
import { formatMoney } from "@/lib/utils/currency";
import { formatMinutes } from "@/lib/utils/time";
import { AccountBadge, RoleBadge, WorkingDot } from "@/components/team/team-badges";
import type { AccountState } from "@/app/(app)/employees/data";

export interface EmployeeListRow {
  id: string; full_name: string; role: string; employment_status: string; stores: string[]; hourly_rate: number | null;
  account: AccountState; week_minutes: number; week_flagged: number; working: { location_name: string } | null;
}

/** Roster: dense table on desktop, cards on mobile. */
export function EmployeeTable({ rows, currency, emptyAction }: { rows: EmployeeListRow[]; currency: string; emptyAction?: React.ReactNode }) {
  if (rows.length === 0) return <EmptyState title="No employees match" description="Add your team so shifts, schedules and labor cost work automatically." action={emptyAction} />;
  return (
    <>
      <TableWrap className="hidden md:block">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Stores</th><th className="num">Rate</th><th>Status</th><th>Account</th><th className="num">This week</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/employees/${r.id}`} className="font-medium hover:underline">{r.full_name}</Link></td>
                <td><RoleBadge role={r.role} /></td>
                <td className="max-w-[220px] truncate text-text-2" title={r.stores.join(", ")}>{r.stores.length ? r.stores.join(", ") : <span className="text-text-3">—</span>}</td>
                <td className="num">{r.hourly_rate != null ? `${formatMoney(r.hourly_rate, { currency })}/hr` : <span className="text-text-3">—</span>}</td>
                <td><StatusBadge kind="employment" value={r.employment_status} /></td>
                <td><AccountBadge state={r.account} /></td>
                <td className="num">{r.week_minutes > 0 ? formatMinutes(r.week_minutes) : <span className="text-text-3">0m</span>}{r.week_flagged > 0 && <span className="ml-1 text-[11px] text-warn" title="Shifts needing review">⚑{r.week_flagged}</span>}</td>
                <td>{r.working && <WorkingDot label={`At ${r.working.location_name}`} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <div className="md:hidden space-y-2">
        {rows.map((r) => (
          <Link key={r.id} href={`/employees/${r.id}`} className="card block px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-[14px] truncate">{r.full_name}</div>
              <div className="flex items-center gap-1.5"><RoleBadge role={r.role} /><StatusBadge kind="employment" value={r.employment_status} /></div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-text-2">
              <span className="tnum">{r.hourly_rate != null ? `${formatMoney(r.hourly_rate, { currency })}/hr` : "no rate"}</span>
              <span className="tnum">{formatMinutes(r.week_minutes)} this week</span>
              <AccountBadge state={r.account} />
              {r.working && <WorkingDot label={`At ${r.working.location_name}`} />}
            </div>
            {r.stores.length > 0 && <div className="mt-1 text-[12px] text-text-3 truncate">{r.stores.join(", ")}</div>}
          </Link>
        ))}
      </div>
    </>
  );
}
