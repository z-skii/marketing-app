import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils/time";
import { Elapsed } from "./elapsed";

export interface WorkingShift { id: string; employee_name: string; clock_in_at: string; verification_status: string }

/** Who is clocked in right now at one store, with a live elapsed timer. */
export function StoreWorkingList({ shifts, timezone }: { shifts: WorkingShift[]; timezone: string }) {
  if (shifts.length === 0) return <p className="text-[13px] text-text-3">Nobody is clocked in.</p>;
  return (
    <ul className="divide-y divide-border">
      {shifts.map((s) => (
        <li key={s.id} className="flex items-center gap-3 py-1.5 text-[13px]">
          <Link href={`/shifts/${s.id}`} className="font-medium hover:underline min-w-0 truncate">{s.employee_name}</Link>
          <span className="text-text-3">since {formatTime(s.clock_in_at, timezone)}</span>
          {s.verification_status !== "verified" && s.verification_status !== "manual" && <StatusBadge kind="verification" value={s.verification_status} />}
          <Elapsed since={s.clock_in_at} className="ml-auto tnum font-semibold text-accent" />
        </li>
      ))}
    </ul>
  );
}
