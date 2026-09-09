"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateStepper } from "@/components/ui/filters";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { ReportStatus, StoreOption } from "./types";

/** STORE select · DATE stepper · STATUS badge. State lives in the URL (?location=&date=). */
export function StoreDateBar({ locations, locationId, date, max, status, showStore = true, className, right }: {
  locations: StoreOption[]; locationId?: string; date: string; max: string; status?: ReportStatus | null | "none";
  showStore?: boolean; className?: string; right?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v == null || v === "") next.delete(k); else next.set(k, v); }
    router.push(`${pathname}?${next.toString()}`);
  };
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {showStore && (
        <select className="field w-auto py-1 pr-7 font-medium" value={locationId ?? ""} onChange={(e) => set({ location: e.target.value })} aria-label="Store">
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      )}
      <DateStepper date={date} max={max} onChange={(d) => set({ date: d })} />
      {status !== undefined && <StatusBadge kind="report" value={status === "none" ? null : status} />}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
