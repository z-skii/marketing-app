"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import { addISODays, businessDateOf, formatShortDate, fromISODate } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import { StoreSelect } from "@/components/ui/filters";
import { useToast } from "@/components/ui/toast";
import { copyWeekAction } from "@/app/(app)/schedule/actions";
import { compactTime, durationHours, formatH } from "./schedule-time";
import { ShiftModal, type ShiftModalState, type ShiftRow } from "./shift-modal";

export interface ScheduleEmployee { id: string; name: string; assigned: boolean }

export interface ScheduleWeekProps {
  location: { id: string; name: string; timezone: string };
  locations: Array<{ id: string; name: string; timezone: string }>;
  weekStart: string;
  days: string[];
  today: string;
  rows: ScheduleEmployee[];
  employeeOptions: Array<{ id: string; name: string }>;
  shifts: ShiftRow[];
  canEdit: boolean;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ScheduleWeek({ location, locations, weekStart, days, today, rows, employeeOptions, shifts, canEdit }: ScheduleWeekProps) {
  const tz = location.timezone;
  const router = useRouter();
  const toast = useToast();
  const [modal, setModal] = useState<ShiftModalState | null>(null);
  const [copying, startCopy] = useTransition();
  const [mobileDay, setMobileDay] = useState(() => (days.includes(today) ? today : days[0]));

  const byCell = useMemo(() => {
    const m = new Map<string, ShiftRow[]>();
    for (const s of shifts) {
      const key = `${s.employee_id}|${businessDateOf(s.starts_at, tz)}`;
      const arr = m.get(key) ?? [];
      arr.push(s);
      m.set(key, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return m;
  }, [shifts, tz]);
  const cell = (empId: string, day: string) => byCell.get(`${empId}|${day}`) ?? [];
  const hoursOf = (list: ShiftRow[]) => list.reduce((acc, s) => acc + durationHours(s.starts_at, s.ends_at), 0);
  const dayTotals = days.map((d) => hoursOf(shifts.filter((s) => businessDateOf(s.starts_at, tz) === d)));
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);
  const nameOf = (id: string) => rows.find((r) => r.id === id)?.name ?? employeeOptions.find((e) => e.id === id)?.name ?? "Employee";

  const href = (week: string) => `/schedule?location=${location.id}&week=${week}`;
  const thisWeek = days.includes(today);
  const weekLabel = `${formatShortDate(days[0])} – ${formatShortDate(days[6])}`;

  const copy = (from: string, to: string, label: string) => startCopy(async () => {
    const res = await copyWeekAction(location.id, from, to);
    if (!res.ok) { toast.push(res.error, "danger"); return; }
    toast.push(`${label}: ${res.data.created} added${res.data.skipped ? `, ${res.data.skipped} already there` : ""}`, "success");
    router.refresh();
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-md border border-border bg-surface">
          <Link href={href(addISODays(weekStart, -7))} className="px-2 py-1.5 text-text-2 hover:bg-surface-2 rounded-l-md" aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></Link>
          <span className="px-2 text-[13px] font-medium whitespace-nowrap tnum">{weekLabel}</span>
          <Link href={href(addISODays(weekStart, 7))} className="px-2 py-1.5 text-text-2 hover:bg-surface-2 rounded-r-md" aria-label="Next week"><ChevronRight className="h-4 w-4" /></Link>
        </div>
        {!thisWeek && <Link href={`/schedule?location=${location.id}`} className="text-[12.5px] text-accent hover:underline">This week</Link>}
        <StoreSelect locations={locations} allowAll={false} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <Button size="sm" variant="secondary" onClick={() => copy(addISODays(weekStart, -7), weekStart, "Copied last week")} disabled={copying}><Copy className="h-3.5 w-3.5" />Copy last week</Button>
              <Button size="sm" variant="secondary" onClick={() => copy(weekStart, addISODays(weekStart, 7), "Copied to next week")} disabled={copying}><Copy className="h-3.5 w-3.5" />This week → next</Button>
              <Button size="sm" onClick={() => setModal({ mode: "add", date: thisWeek ? today : days[0] })}><Plus className="h-3.5 w-3.5" />Add shift</Button>
            </>
          )}
        </div>
      </div>
      {!canEdit && <p className="text-[12px] text-text-3">Read-only: you do not have the &ldquo;Manage schedules&rdquo; permission.</p>}

      {/* Desktop grid */}
      <div className="hidden md:block card overflow-x-auto scrollbar-thin">
        <table className="table min-w-[860px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface-2 z-10 min-w-[160px]">Employee</th>
              {days.map((d) => (
                <th key={d} className={cn("text-center", d === today && "text-accent")}>
                  <div>{DOW[new Date(d + "T00:00:00").getDay()]}</div>
                  <div className={cn("text-[12px] font-normal tnum normal-case tracking-normal", d === today ? "text-accent" : "text-text-3")}>{format(fromISODate(d), "MMM d")}</div>
                </th>
              ))}
              <th className="num">Hours</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="text-center text-text-3 py-8">No employees are assigned to {location.name}. Assign them from the Employees page{canEdit ? ", or add a shift for anyone with the button above" : ""}.</td></tr>
            )}
            {rows.map((r) => {
              const weekHours = hoursOf(shifts.filter((s) => s.employee_id === r.id));
              return (
                <tr key={r.id}>
                  <td className="sticky left-0 bg-surface z-10 font-medium">
                    <div className="truncate max-w-[180px]">{r.name}</div>
                    {!r.assigned && <div className="text-[10.5px] text-text-3 uppercase tracking-wide">not assigned here</div>}
                  </td>
                  {days.map((d) => {
                    const list = cell(r.id, d);
                    return (
                      <td key={d} className={cn("!whitespace-normal align-top p-1 min-w-[96px]", d === today && "bg-accent-soft/40", canEdit && "cursor-pointer hover:bg-surface-2")}
                        onClick={() => canEdit && setModal({ mode: "add", employee_id: r.id, date: d })}>
                        <div className="flex flex-col gap-1 min-h-[34px]">
                          {list.map((s) => <Chip key={s.id} shift={s} tz={tz} canEdit={canEdit} onClick={() => setModal({ mode: "edit", shift: s })} />)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="num font-medium">{weekHours ? formatH(weekHours) : <span className="text-text-3">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 bg-surface-2 z-10">Scheduled</td>
              {dayTotals.map((h, i) => <td key={days[i]} className="text-center tnum">{h ? formatH(h) : <span className="text-text-3 font-normal">—</span>}</td>)}
              <td className="num">{formatH(weekTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile: day-by-day */}
      <div className="md:hidden space-y-3">
        <div className="grid grid-cols-7 rounded-md border border-border bg-surface p-0.5">
          {days.map((d, i) => (
            <button key={d} type="button" onClick={() => setMobileDay(d)}
              className={cn("py-1.5 rounded text-center", mobileDay === d ? "bg-accent text-white" : d === today ? "text-accent" : "text-text-2")}>
              <div className="text-[10.5px] uppercase">{DOW[new Date(d + "T00:00:00").getDay()]}</div>
              <div className="text-[13px] font-medium tnum">{Number(d.slice(8))}</div>
              {dayTotals[i] > 0 && <div className={cn("mx-auto mt-0.5 h-1 w-1 rounded-full", mobileDay === d ? "bg-white" : "bg-accent")} />}
            </button>
          ))}
        </div>
        <div className="card divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-[13px] font-medium">{formatShortDate(mobileDay)}</div>
            <div className="text-[12px] text-text-3 tnum">{formatH(dayTotals[days.indexOf(mobileDay)] ?? 0)} scheduled</div>
          </div>
          {shifts.filter((s) => businessDateOf(s.starts_at, tz) === mobileDay).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).map((s) => (
            <button key={s.id} type="button" disabled={!canEdit} onClick={() => setModal({ mode: "edit", shift: s })}
              className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left disabled:cursor-default active:bg-surface-2">
              <div className="min-w-0">
                <div className="text-[14px] font-medium truncate">{nameOf(s.employee_id)}</div>
                {s.note && <div className="text-[12px] text-text-3 truncate">{s.note}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] tnum">{compactTime(s.starts_at, tz)}–{compactTime(s.ends_at, tz)}</div>
                <div className="text-[11.5px] text-text-3 tnum">{formatH(durationHours(s.starts_at, s.ends_at))}</div>
              </div>
            </button>
          ))}
          {shifts.every((s) => businessDateOf(s.starts_at, tz) !== mobileDay) && <div className="px-3 py-6 text-center text-[13px] text-text-3">Nobody scheduled.</div>}
          {canEdit && (
            <div className="p-2"><Button block variant="secondary" onClick={() => setModal({ mode: "add", date: mobileDay })}><Plus className="h-4 w-4" />Add shift</Button></div>
          )}
        </div>
      </div>

      {modal && (
        <ShiftModal state={modal} timezone={tz} locationId={location.id} locations={locations} employees={employeeOptions} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function Chip({ shift, tz, canEdit, onClick }: { shift: ShiftRow; tz: string; canEdit: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={!canEdit} title={shift.note ?? undefined}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn("w-full rounded border px-1.5 py-0.5 text-[11.5px] tnum text-left leading-tight whitespace-nowrap",
        "bg-accent-soft border-accent/30 text-accent", canEdit ? "hover:border-accent" : "cursor-default")}>
      {compactTime(shift.starts_at, tz)}–{compactTime(shift.ends_at, tz)}
      {shift.series_id && <span className="ml-1 opacity-60" title="Weekly series">↻</span>}
    </button>
  );
}
