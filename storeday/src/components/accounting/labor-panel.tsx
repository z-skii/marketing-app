"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/currency";
import { formatHours, formatTime } from "@/lib/utils/time";
import type { LaborSummary } from "@/lib/calc/accounting";
import { cn } from "@/lib/utils/cn";
import type { LaborRow } from "./types";

/** Automatic labor line: "3 Employees · 23.2 Hours · $351.00", expandable to the shift list. */
export function LaborPanel({ rows, summary, timezone, currency, defaultOpen = false, className }: {
  rows: LaborRow[]; summary: LaborSummary; timezone: string; currency: string; defaultOpen?: boolean; className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const active = rows.filter((r) => r.status === "active");
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14px] tnum">
          <b>{summary.employeeCount}</b> {summary.employeeCount === 1 ? "Employee" : "Employees"}
          <span className="text-text-3"> · </span><b>{(summary.minutes / 60).toFixed(1)}</b> Hours
          <span className="text-text-3"> · </span><b>{formatMoney(summary.cost, { currency })}</b>
        </div>
        {rows.length > 0 && (
          <button type="button" tabIndex={-1} onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-[12.5px] text-accent hover:underline">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}{open ? "Hide employees" : "View employees"}
          </button>
        )}
      </div>
      {rows.length === 0 && <p className="text-[12.5px] text-text-3 mt-1">No shifts recorded for this day. Labor is added automatically from clock-ins.</p>}
      {active.map((s) => (
        <div key={s.shift_id} className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-warn/30 bg-warn-soft px-2.5 py-1.5 text-[12.5px] font-semibold text-warn uppercase tracking-wide">
          <AlertTriangle className="h-3.5 w-3.5" />{s.employee_name} is still clocked in
          <span className="font-normal normal-case tracking-normal">· Started {formatTime(s.clock_in_at, timezone)}</span>
          <Link href={`/shifts/${s.shift_id}`} tabIndex={-1} className="font-medium normal-case tracking-normal underline underline-offset-2">View shift</Link>
        </div>
      ))}
      {open && rows.length > 0 && (
        <div className="mt-2 overflow-x-auto scrollbar-thin rounded-md border border-border">
          <table className="table">
            <thead><tr><th>Employee</th><th>In</th><th>Out</th><th className="num">Hours</th><th className="num">Rate</th><th className="num">Cost</th><th>Verification</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.shift_id} className={cn(r.status === "active" && "text-warn")}>
                  <td><Link href={`/shifts/${r.shift_id}`} tabIndex={-1} className="hover:underline">{r.employee_name}</Link></td>
                  <td className="tnum">{formatTime(r.clock_in_at, timezone)}</td>
                  <td className="tnum">{r.clock_out_at ? formatTime(r.clock_out_at, timezone) : <span className="text-warn">Working</span>}</td>
                  <td className="num">{r.status === "completed" ? formatHours(r.worked_minutes) : "—"}</td>
                  <td className="num">{formatMoney(r.hourly_rate, { currency })}</td>
                  <td className="num font-medium">{r.status === "completed" ? formatMoney(r.labor_cost, { currency }) : "—"}</td>
                  <td><StatusBadge kind="verification" value={r.verification_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
