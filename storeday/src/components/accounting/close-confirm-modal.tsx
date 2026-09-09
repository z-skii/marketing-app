"use client";
import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { KV } from "@/components/ui/stat";
import { ErrorText } from "@/components/ui/form";
import { formatMoney } from "@/lib/utils/currency";
import type { DailyInputs, DailyTotals } from "@/lib/calc/accounting";
import { AttentionList } from "./attention-list";
import type { AttentionItem } from "./types";

/** "CLOSE SEPTEMBER 8?" — one confirmation with the day's numbers and attention items. */
export function CloseConfirmModal({ open, onClose, onConfirm, loading, error, dateLabel, storeName, currency, totals, inputs, attention }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading?: boolean; error?: string | null;
  dateLabel: string; storeName?: string; currency: string; totals: DailyTotals; inputs: DailyInputs; attention: AttentionItem[];
}) {
  const m = (v: number | null | undefined) => formatMoney(v ?? 0, { currency });
  const diff = totals.cashDifference;
  return (
    <Modal open={open} onClose={onClose} title={`Close ${dateLabel}?`}
      footer={<>
        <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Back</Button>
        <Button type="button" onClick={onConfirm} loading={loading} autoFocus>Confirm &amp; close day</Button>
      </>}>
      {storeName && <div className="text-[12.5px] text-text-3 mb-1">{storeName}</div>}
      <ErrorText>{error}</ErrorText>
      <div className="divide-y divide-border">
        <KV label="Sales" value={m(totals.totalSales)} strong />
        <KV label="Expenses" value={m(totals.totalExpenses)} />
        <KV label="Profit" value={m(totals.profit)} strong tone={totals.profit < 0 ? "danger" : "success"} />
        <KV label="Cash" value={m(inputs.cash_sales)} />
        <KV label="Card" value={m(inputs.card_sales)} />
        <KV label="Employees" value={totals.laborEmployeeCount} />
        <KV label="Hours" value={(totals.laborMinutes / 60).toFixed(1)} />
        <KV label="Labor" value={m(totals.laborTotal)} />
        <KV label="Cash difference" value={diff == null ? "—" : `${diff > 0 ? "+" : ""}${formatMoney(diff, { currency })}`} tone={diff == null ? undefined : diff < 0 ? "danger" : diff > 0 ? "warn" : "success"} />
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-1">Attention</div>
        <AttentionList items={attention} emptyLabel="Nothing needs attention" />
      </div>
    </Modal>
  );
}
