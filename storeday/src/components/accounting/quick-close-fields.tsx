"use client";
import * as React from "react";
import { Plus } from "lucide-react";
import { SectionLabel } from "@/components/ui/card";
import { MoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/form";
import { formatMoney } from "@/lib/utils/currency";
import { sum, type DailyInputs, type DailyTotals, type DetailedExpenseTotals } from "@/lib/calc/accounting";
import { cn } from "@/lib/utils/cn";
import type { DetailedExpense, MoneyField } from "./types";

export type SetMoney = (key: MoneyField, value: number | null) => void;

/** One label + big money field. Enter/Tab move to the next field (MoneyInput handles data-nav). */
export function MoneyRow({ label, field, value, onChange, currency, autoFocus, hint, tone, allowNegative }: {
  label: React.ReactNode; field: MoneyField; value: number | null; onChange: SetMoney; currency: string; autoFocus?: boolean; hint?: React.ReactNode;
  tone?: "warn"; allowNegative?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1">
      <span className="min-w-0 text-[13.5px] text-text-2">
        {label}
        {hint && <span className="block text-[11.5px] text-text-3">{hint}</span>}
      </span>
      <MoneyInput size="lg" className={cn("w-44 shrink-0 md:w-40", tone === "warn" && "border-warn/60")} name={field} value={value}
        onValueChange={(v) => onChange(field, v)} currency={currency} autoFocus={autoFocus} allowNegative={allowNegative} aria-label={typeof label === "string" ? label : field} />
    </label>
  );
}

export function TotalLine({ label, value, currency, tone, big }: { label: string; value: number; currency: string; tone?: "success" | "danger"; big?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-1.5 mt-1">
      <span className={cn("text-[12px] font-semibold uppercase tracking-wide text-text-3", big && "text-text")}>{label}</span>
      <span className={cn("tnum font-semibold", big ? "text-[18px]" : "text-[15px]", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{formatMoney(value, { currency })}</span>
    </div>
  );
}

export function SalesSection({ inputs, onChange, currency, otherSalesEnabled, totals }: { inputs: DailyInputs; onChange: SetMoney; currency: string; otherSalesEnabled: boolean; totals: DailyTotals }) {
  return (
    <section>
      <SectionLabel>Sales</SectionLabel>
      <MoneyRow label="Cash sales" field="cash_sales" value={inputs.cash_sales} onChange={onChange} currency={currency} autoFocus />
      <MoneyRow label="Credit / card sales" field="card_sales" value={inputs.card_sales} onChange={onChange} currency={currency} />
      {otherSalesEnabled && <MoneyRow label="Other sales" field="other_sales" value={inputs.other_sales} onChange={onChange} currency={currency} hint="Lottery, services, etc." />}
      <TotalLine label="Total sales" value={totals.totalSales} currency={currency} big />
    </section>
  );
}

export function GoodsSection({ inputs, onChange, currency, detailed, totals }: { inputs: DailyInputs; onChange: SetMoney; currency: string; detailed: DetailedExpenseTotals; totals: DailyTotals }) {
  return (
    <section>
      <SectionLabel>Goods / Inventory</SectionLabel>
      <MoneyRow label="Cash goods" field="cash_goods" value={inputs.cash_goods} onChange={onChange} currency={currency} hint="Paid from the drawer" />
      <MoneyRow label="Check goods" field="check_goods" value={inputs.check_goods} onChange={onChange} currency={currency} hint="Paid by check / card / ACH" />
      {detailed.goods > 0 && <div className="flex justify-between text-[12px] text-text-3 py-0.5"><span>Detailed goods expenses</span><span className="tnum">{formatMoney(detailed.goods, { currency })}</span></div>}
      <TotalLine label="Goods" value={totals.goodsTotal} currency={currency} />
    </section>
  );
}

export function ExpensesSection({ inputs, onChange, currency, detailed, expenses, totals, onAddExpense, canAdd }: {
  inputs: DailyInputs; onChange: SetMoney; currency: string; detailed: DetailedExpenseTotals; expenses: DetailedExpense[]; totals: DailyTotals;
  onAddExpense: () => void; canAdd: boolean;
}) {
  return (
    <section>
      <SectionLabel right={canAdd && (
        <button type="button" tabIndex={-1} onClick={onAddExpense} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline">
          <Plus className="h-3.5 w-3.5" />Add detailed expense
        </button>
      )}>Expenses</SectionLabel>
      <MoneyRow label="Utilities" field="utilities" value={inputs.utilities} onChange={onChange} currency={currency} />
      <MoneyRow label="Other expenses" field="other_expenses" value={inputs.other_expenses} onChange={onChange} currency={currency} />
      {expenses.length > 0 && (
        <div className="mt-2 rounded-md border border-border divide-y divide-border">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12.5px]">
              <span className="min-w-0 truncate">
                <span className="font-medium">{e.category_name}</span>
                <span className="text-text-3"> · {e.bucket}{e.vendor ? ` · ${e.vendor}` : ""}{e.status !== "paid" ? " · expected" : ""}</span>
              </span>
              <span className={cn("tnum shrink-0", e.status !== "paid" && "text-text-3 line-through")}>{formatMoney(e.amount, { currency })}</span>
            </div>
          ))}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-2.5 py-1.5 text-[11.5px] text-text-3 bg-surface-2/60">
            {(["goods", "labor", "utilities", "other"] as const).filter((b) => detailed[b] > 0).map((b) => (
              <span key={b} className="tnum">{b}: {formatMoney(detailed[b], { currency })}</span>
            ))}
          </div>
        </div>
      )}
      <TotalLine label="Utilities + other" value={sum(totals.utilitiesTotal, totals.otherTotal)} currency={currency} />
    </section>
  );
}

export function CashCheckSection({ inputs, onChange, currency, expectedComputed, totals, onResetExpected, overridden }: {
  inputs: DailyInputs; onChange: SetMoney; currency: string; expectedComputed: number; totals: DailyTotals; onResetExpected: () => void; overridden: boolean;
}) {
  const diff = totals.cashDifference;
  return (
    <section>
      <SectionLabel right={overridden && <button type="button" tabIndex={-1} onClick={onResetExpected} className="text-[12px] text-accent hover:underline">Use calculated ({formatMoney(expectedComputed, { currency })})</button>}>Cash check</SectionLabel>
      <MoneyRow label="Expected closing cash" field="expected_cash" value={overridden ? inputs.expected_cash : (inputs.expected_cash ?? expectedComputed)} onChange={onChange} currency={currency}
        hint={overridden ? "Entered manually" : "Starting cash + cash sales − cash goods"} />
      <MoneyRow label="Actual closing cash" field="actual_cash" value={inputs.actual_cash} onChange={onChange} currency={currency} hint="Count the drawer" />
      <div className="flex items-center justify-between border-t border-border pt-1.5 mt-1">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-text-3">Over / short</span>
        <span className={cn("tnum text-[15px] font-semibold", diff == null ? "text-text-3" : diff < 0 ? "text-danger" : diff > 0 ? "text-warn" : "text-success")}>
          {diff == null ? "—" : diff === 0 ? "Even ✓" : `${diff > 0 ? "+" : "−"}${formatMoney(Math.abs(diff), { currency })} ${diff > 0 ? "over" : "short"}`}
        </span>
      </div>
    </section>
  );
}

export function NotesSection({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <section>
      <SectionLabel>Notes</SectionLabel>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Anything worth remembering about today…" rows={2} data-nav="" />
    </section>
  );
}
