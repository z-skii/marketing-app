"use client";
import { useEffect, useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils/cn";
import { PAYMENT_METHODS } from "@/lib/expenses/constants";
import { ReceiptUploadControls, useReceiptUpload, type ReceiptRef } from "./receipt-upload";

export interface CategoryOption { id: string; name: string; bucket: string; is_active?: boolean }
export interface LocationOption { id: string; name: string }

/** Values used to pre-fill the fields when editing (all optional). */
export interface ExpenseFormInitial {
  id?: string; location_id?: string; business_date?: string; amount?: number | null; category_id?: string; payment_method?: string;
  vendor?: string | null; description?: string | null; status?: string; receipt?: ReceiptRef | null;
}

/**
 * The expense fields shared by the Quick Expense sheet (inside Quick Close) and the full Add / Edit modal.
 * Renders only inputs — the parent owns the <form action> and submit button. Emits hidden inputs for
 * amount and receipt_id so a plain FormData submit carries everything the server action needs.
 */
export function ExpenseFields({ organizationId, locations, categories, initial, defaultLocationId, defaultDate, showDate = true, showStatus = true, currency, onAmountChange, categoryFieldId = "expense-category" }: {
  organizationId: string; locations: LocationOption[]; categories: CategoryOption[]; initial?: ExpenseFormInitial;
  defaultLocationId?: string; defaultDate: string; showDate?: boolean; showStatus?: boolean; currency?: string;
  onAmountChange?: (amount: number | null) => void; categoryFieldId?: string;
}) {
  const [amount, setAmount] = useState<number | null>(initial?.amount ?? null);
  const [locationId, setLocationId] = useState(initial?.location_id ?? defaultLocationId ?? locations[0]?.id ?? "");
  const [date, setDate] = useState(initial?.business_date ?? defaultDate);
  const [status, setStatus] = useState(initial?.status ?? "paid");
  const { receipt, uploading, error: uploadError, upload, clear } = useReceiptUpload(organizationId, initial?.receipt ?? null);

  useEffect(() => { onAmountChange?.(amount); }, [amount, onAmountChange]);

  // Inactive categories are hidden unless the expense already uses one.
  const options = categories.filter((c) => c.is_active !== false || c.id === initial?.category_id);

  return (
    <>
      <input type="hidden" name="amount" value={amount ?? ""} />
      {receipt && <input type="hidden" name="receipt_id" value={receipt.id} />}
      {!showStatus && <input type="hidden" name="status" value={status} />}
      {!showDate && <input type="hidden" name="business_date" value={date} />}

      <div className={cn("grid gap-3", showDate ? "grid-cols-2" : "grid-cols-1")}>
        {locations.length > 1 ? (
          <Field label="Store"><Select name="location_id" value={locationId} onChange={(e) => setLocationId(e.target.value)} required>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        ) : <input type="hidden" name="location_id" value={locationId} />}
        {showDate && <Field label="Date"><Input type="date" name="business_date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} required /></Field>}
      </div>

      <Field label="Amount">
        <MoneyInput value={amount} onValueChange={setAmount} size="lg" autoFocus currency={currency}
          onEnter={() => document.querySelector<HTMLSelectElement>(`#${categoryFieldId}`)?.focus()} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select id={categoryFieldId} name="category_id" required defaultValue={initial?.category_id ?? options[0]?.id}>
            {options.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_active === false ? " (inactive)" : ""}</option>)}
          </Select>
        </Field>
        <Field label="Payment"><Select name="payment_method" defaultValue={initial?.payment_method ?? "cash"}>{PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Vendor"><Input name="vendor" defaultValue={initial?.vendor ?? ""} placeholder="e.g. Coca-Cola" maxLength={200} /></Field>
        <Field label="Note"><Input name="description" defaultValue={initial?.description ?? ""} placeholder="Optional" maxLength={1000} /></Field>
      </div>

      {showStatus && (
        <Field label="Status" hint="only Paid counts toward the day's totals">
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
            {(["paid", "expected"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={cn("px-3 py-1 text-[12.5px] rounded", status === s ? "bg-accent text-white font-medium" : "text-text-2 hover:bg-surface-2")}>
                {s === "paid" ? "Paid" : "Expected"}
              </button>
            ))}
          </div>
          <input type="hidden" name="status" value={status} />
        </Field>
      )}

      <ReceiptUploadControls receipt={receipt} uploading={uploading} error={uploadError} onClear={clear}
        onFile={(file) => upload(file, { locationId, date })} />
    </>
  );
}
