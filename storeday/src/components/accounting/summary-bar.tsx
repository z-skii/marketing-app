"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/currency";
import type { DailyTotals } from "@/lib/calc/accounting";
import { cn } from "@/lib/utils/cn";
import type { SaveStatus } from "./types";

export function SaveIndicator({ status, error }: { status: SaveStatus; error?: string | null }) {
  if (status === "error") return <span className="text-[12px] text-danger" title={error ?? undefined}>Not saved · {error ?? "retrying"}</span>;
  if (status === "saving") return <span className="text-[12px] text-text-3">Saving…</span>;
  if (status === "dirty") return <span className="text-[12px] text-text-3">Unsaved changes</span>;
  if (status === "saved") return <span className="text-[12px] text-success">Draft saved ✓</span>;
  return null;
}

/** Sticky bottom bar: SALES / EXPENSES / PROFIT live + CLOSE DAY. */
export function SummaryBar({ totals, currency, status, error, onClose, closing, disabled }: {
  totals: DailyTotals; currency: string; status: SaveStatus; error?: string | null; onClose: () => void; closing?: boolean; disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-[calc(3.25rem+env(safe-area-inset-bottom))] md:bottom-0 z-20 -mx-3 md:-mx-6 mt-4 border-t border-border bg-surface/95 backdrop-blur px-3 md:px-6 py-2.5">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3">
        <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
          <Metric label="Sales" value={totals.totalSales} currency={currency} />
          <Metric label="Expenses" value={totals.totalExpenses} currency={currency} />
          <Metric label="Profit" value={totals.profit} currency={currency} tone={totals.profit < 0 ? "danger" : "success"} />
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <Button type="button" size="lg" onClick={onClose} loading={closing} disabled={disabled} data-nav="" className="min-w-[128px]">Close day</Button>
          <SaveIndicator status={status} error={error} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, currency, tone }: { label: string; value: number; currency: string; tone?: "success" | "danger" }) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-3">{label}</div>
      <div className={cn("tnum text-[16px] md:text-[18px] font-semibold leading-tight truncate", tone === "danger" && "text-danger", tone === "success" && "text-success")}>{formatMoney(value, { currency })}</div>
    </div>
  );
}
