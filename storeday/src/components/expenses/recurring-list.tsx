"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { EmptyState, TableWrap } from "@/components/ui/misc";
import { Switch } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";
import { BUCKET_LABEL, BUCKET_TONE, frequencyLabel, paymentLabel, type AccountingBucket } from "@/lib/expenses/constants";
import { deleteRecurringExpenseAction, toggleRecurringExpenseAction, type RecurringExpenseRow } from "@/app/(app)/expenses/actions";
import { RecurringModal, type RecurringFormInitial } from "./recurring-form";
import type { CategoryOption, LocationOption } from "./expense-form";

export function RecurringList({ rows, locations, categories, today, currency, isOwner }: {
  rows: RecurringExpenseRow[]; locations: LocationOption[]; categories: CategoryOption[]; today: string; currency: string; isOwner: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [modal, setModal] = useState<{ initial?: RecurringFormInitial } | null>(null);
  const [deleting, setDeleting] = useState<RecurringExpenseRow | null>(null);
  const [pending, start] = useTransition();

  const toInitial = (r: RecurringExpenseRow): RecurringFormInitial => ({
    id: r.id, location_id: r.location_id, category_id: r.category_id, amount: r.amount, vendor: r.vendor, description: r.description,
    payment_method: r.payment_method, frequency: r.frequency, day_of_month: r.day_of_month, next_due_date: r.next_due_date, auto_mark_paid: r.auto_mark_paid,
  });
  const toggle = (r: RecurringExpenseRow, active: boolean) => start(async () => {
    const res = await toggleRecurringExpenseAction(r.id, active);
    if (res.ok) { toast.push(active ? "Schedule resumed" : "Schedule paused", "success"); router.refresh(); } else toast.push(res.error, "danger");
  });
  const confirmDelete = () => { if (!deleting) return; const id = deleting.id; start(async () => {
    const res = await deleteRecurringExpenseAction(id);
    setDeleting(null);
    if (res.ok) { toast.push("Recurring expense deleted", "success"); router.refresh(); } else toast.push(res.error, "danger");
  }); };

  const canAdd = locations.length > 0 && categories.some((c) => c.is_active !== false);
  const addButton = isOwner ? (
    <Button size="sm" onClick={() => setModal({})} disabled={!canAdd} title={!canAdd ? "Add a store and a category first" : undefined}><Plus className="h-4 w-4" />Add recurring expense</Button>
  ) : null;

  const rowActions = (r: RecurringExpenseRow) => isOwner ? (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" onClick={() => setModal({ initial: toInitial(r) })} title="Edit" className="rounded p-1 text-text-3 hover:text-text hover:bg-surface-2"><Pencil className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={() => setDeleting(r)} title="Delete" className="rounded p-1 text-text-3 hover:text-danger hover:bg-danger-soft"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  ) : null;

  const activeSwitch = (r: RecurringExpenseRow) => isOwner
    ? <Switch checked={r.is_active} onChange={(v) => toggle(r, v)} label={<span className="sr-only">Active</span>} disabled={pending} />
    : <Badge tone={r.is_active ? "success" : "neutral"}>{r.is_active ? "Active" : "Paused"}</Badge>;

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[12.5px] text-text-3 max-w-2xl">
          Each schedule creates an expense on its due date. <span className="text-text-2 font-medium">Expected</span> rows are reminders that do not touch the day&apos;s totals;
          they become <span className="text-text-2 font-medium">Paid</span> (and count) when you confirm them, or right away when Auto-mark paid is on.
        </p>
        {addButton}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No recurring expenses" description="Rent, utilities, subscriptions, loan payments — set them up once and they show up on the right day." action={addButton ?? undefined} />
      ) : (
        <>
          <TableWrap className="hidden md:block">
            <table className="table">
              <thead>
                <tr><th>Name / vendor</th>{locations.length > 1 && <th>Store</th>}<th>Category</th><th className="num">Amount</th><th>Frequency</th><th>Next due</th><th>Auto-mark paid</th><th>Active</th>{isOwner && <th className="text-right">Actions</th>}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={cn(!r.is_active && "text-text-3")}>
                    <td className="max-w-[240px]">
                      <div className="truncate font-medium text-text">{r.vendor || r.category_name}</div>
                      <div className="truncate text-[12px] text-text-3">{[r.description, paymentLabel(r.payment_method)].filter(Boolean).join(" · ")}</div>
                    </td>
                    {locations.length > 1 && <td className="max-w-[140px] truncate">{r.location_name}</td>}
                    <td><span className="inline-flex items-center gap-1.5">{r.category_name}<Badge tone={BUCKET_TONE[r.bucket as AccountingBucket] ?? "neutral"}>{BUCKET_LABEL[r.bucket as AccountingBucket] ?? r.bucket}</Badge></span></td>
                    <td className="num font-medium text-text">{formatMoney(r.amount, { currency })}</td>
                    <td>{frequencyLabel(r.frequency)}{r.frequency === "monthly" && r.day_of_month ? <span className="text-text-3"> · day {r.day_of_month}</span> : null}</td>
                    <td className="tnum">{r.is_active ? <span className={cn(r.next_due_date <= today && "text-warn font-medium")}>{formatShortDate(r.next_due_date)}</span> : <span className="text-text-3">paused</span>}</td>
                    <td>{r.auto_mark_paid ? <Badge tone="success">Paid</Badge> : <Badge tone="warn">Expected</Badge>}</td>
                    <td>{activeSwitch(r)}</td>
                    {isOwner && <td>{rowActions(r)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          <div className="md:hidden space-y-2">
            {rows.map((r) => (
              <div key={r.id} className={cn("card px-3 py-2.5", !r.is_active && "opacity-70")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium truncate">{r.vendor || r.category_name}</div>
                    <div className="text-[12px] text-text-3 truncate">{frequencyLabel(r.frequency)}{locations.length > 1 && <> · {r.location_name}</>} · {r.category_name}</div>
                    <div className="text-[12px] text-text-3 mt-0.5">Next: <span className="tnum text-text-2">{r.is_active ? formatShortDate(r.next_due_date) : "paused"}</span> · {r.auto_mark_paid ? "auto-paid" : "expected until confirmed"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="tnum text-[15px] font-semibold">{formatMoney(r.amount, { currency })}</div>
                    <Badge tone={BUCKET_TONE[r.bucket as AccountingBucket] ?? "neutral"} className="mt-1">{BUCKET_LABEL[r.bucket as AccountingBucket] ?? r.bucket}</Badge>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12px] text-text-3">{activeSwitch(r)}{isOwner && <span>{r.is_active ? "Active" : "Paused"}</span>}</div>
                  {rowActions(r)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && <RecurringModal open onClose={() => setModal(null)} locations={locations} categories={categories} today={today} currency={currency} initial={modal.initial} />}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Delete recurring expense?" confirmLabel="Delete" tone="danger" loading={pending}>
        {deleting && <>No more occurrences of <strong>{deleting.vendor || deleting.category_name}</strong> ({formatMoney(deleting.amount, { currency })}, {frequencyLabel(deleting.frequency).toLowerCase()}) will be created. Expenses already generated are kept. To stop it temporarily, switch it off instead.</>}
      </ConfirmDialog>
    </>
  );
}
