"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Select, Switch } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { FREQUENCIES, PAYMENT_METHODS } from "@/lib/expenses/constants";
import { createRecurringExpenseAction, updateRecurringExpenseAction } from "@/app/(app)/expenses/actions";
import type { CategoryOption, LocationOption } from "./expense-form";

export interface RecurringFormInitial {
  id?: string; location_id?: string; category_id?: string; amount?: number | null; vendor?: string | null; description?: string | null;
  payment_method?: string; frequency?: string; day_of_month?: number | null; next_due_date?: string; auto_mark_paid?: boolean;
}

export function RecurringModal(props: { open: boolean; onClose: () => void; locations: LocationOption[]; categories: CategoryOption[]; today: string; currency: string; initial?: RecurringFormInitial }) {
  if (!props.open) return null;
  return <RecurringModalInner {...props} />;
}

function RecurringModalInner({ onClose, locations, categories, today, currency, initial }: { onClose: () => void; locations: LocationOption[]; categories: CategoryOption[]; today: string; currency: string; initial?: RecurringFormInitial }) {
  const isEdit = Boolean(initial?.id);
  const [state, action, pending] = useActionState(isEdit ? updateRecurringExpenseAction : createRecurringExpenseAction, null);
  const [amount, setAmount] = useState<number | null>(initial?.amount ?? null);
  const [frequency, setFrequency] = useState(initial?.frequency ?? "monthly");
  const [nextDue, setNextDue] = useState(initial?.next_due_date ?? today);
  const [dayOfMonth, setDayOfMonth] = useState<string>(initial?.day_of_month ? String(initial.day_of_month) : String(Number((initial?.next_due_date ?? today).slice(8, 10))));
  const [autoPaid, setAutoPaid] = useState(initial?.auto_mark_paid ?? false);
  const router = useRouter();
  const toast = useToast();
  const done = useRef(false);

  useEffect(() => {
    if (state?.ok && !done.current) {
      done.current = true;
      toast.push(isEdit ? "Recurring expense updated" : "Recurring expense added", "success");
      router.refresh();
      onClose();
    }
  }, [state, isEdit, router, toast, onClose]);

  const options = categories.filter((c) => c.is_active !== false || c.id === initial?.category_id);

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit recurring expense" : "Add recurring expense"}
      footer={<><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" form="recurring-form" loading={pending} disabled={!amount}>{isEdit ? "Save" : "Add"}</Button></>}>
      <form id="recurring-form" action={action} className="space-y-3">
        <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
        {initial?.id && <input type="hidden" name="id" value={initial.id} />}
        <input type="hidden" name="amount" value={amount ?? ""} />
        <input type="hidden" name="auto_mark_paid" value={autoPaid ? "true" : "false"} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Store"><Select name="location_id" defaultValue={initial?.location_id ?? locations[0]?.id} required>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
          <Field label="Category"><Select name="category_id" defaultValue={initial?.category_id ?? options[0]?.id} required>{options.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_active === false ? " (inactive)" : ""}</option>)}</Select></Field>
        </div>
        <Field label="Amount"><MoneyInput value={amount} onValueChange={setAmount} size="lg" currency={currency} autoFocus onEnter={() => document.querySelector<HTMLInputElement>("#rec-vendor")?.focus()} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Vendor / name"><Input id="rec-vendor" name="vendor" defaultValue={initial?.vendor ?? ""} placeholder="e.g. Duke Energy" maxLength={200} /></Field>
          <Field label="Note"><Input name="description" defaultValue={initial?.description ?? ""} placeholder="Optional" maxLength={1000} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Payment"><Select name="payment_method" defaultValue={initial?.payment_method ?? "other"}>{PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
          <Field label="Frequency"><Select name="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>{FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={isEdit ? "Next due date" : "First due date"} hint={isEdit ? undefined : "past dates are generated right away"}>
            <Input type="date" name="next_due_date" value={nextDue} onChange={(e) => { if (!e.target.value) return; setNextDue(e.target.value); if (frequency === "monthly") setDayOfMonth(String(Number(e.target.value.slice(8, 10)))); }} required />
          </Field>
          {frequency === "monthly" && (
            <Field label="Day of month" hint="29–31 roll to the 28th">
              <Input type="number" name="day_of_month" min={1} max={31} inputMode="numeric" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
            </Field>
          )}
        </div>
        <div className="rounded-md border border-border bg-surface-2/50 px-3">
          <Switch checked={autoPaid} onChange={setAutoPaid} label="Auto-mark as paid"
            description={autoPaid ? "Each occurrence is created as Paid and counts toward that day's totals immediately." : "Off: each occurrence is created as Expected and stays out of the totals until you confirm it was paid."} />
        </div>
      </form>
    </Modal>
  );
}
