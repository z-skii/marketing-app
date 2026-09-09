"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Repeat, Trash2 } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { TableWrap } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";
import { BUCKET_LABEL, BUCKET_TONE, paymentLabel, type AccountingBucket } from "@/lib/expenses/constants";
import { deleteExpenseAction, markExpensePaidAction } from "@/app/(app)/expenses/actions";
import { ExpenseModal } from "./expense-modal";
import { ReceiptLink } from "./receipt-link";
import type { CategoryOption, ExpenseFormInitial, LocationOption } from "./expense-form";

export interface ExpenseListRow {
  id: string; business_date: string; location_id: string; location_name: string; category_id: string; category_name: string; bucket: string;
  vendor: string | null; description: string | null; payment_method: string; amount: number; status: string; recurring_expense_id: string | null;
  receipt: { id: string; content_type: string | null; original_filename: string | null } | null;
}

export function ExpenseTable({ rows, organizationId, locations, categories, today, currency, canWrite, showStore }: {
  rows: ExpenseListRow[]; organizationId: string; locations: LocationOption[]; categories: CategoryOption[]; today: string; currency: string; canWrite: boolean; showStore: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<ExpenseFormInitial | null>(null);
  const [deleting, setDeleting] = useState<ExpenseListRow | null>(null);
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const edit = (r: ExpenseListRow) => setEditing({
    id: r.id, location_id: r.location_id, business_date: r.business_date, amount: r.amount, category_id: r.category_id, payment_method: r.payment_method,
    vendor: r.vendor, description: r.description, status: r.status, receipt: r.receipt ? { id: r.receipt.id, name: r.receipt.original_filename ?? "Receipt" } : null,
  });
  const markPaid = (r: ExpenseListRow) => { setBusyId(r.id); start(async () => {
    const res = await markExpensePaidAction(r.id);
    setBusyId(null);
    if (res.ok) { toast.push("Marked as paid", "success"); router.refresh(); } else toast.push(res.error, "danger");
  }); };
  const confirmDelete = () => { if (!deleting) return; const id = deleting.id; start(async () => {
    const res = await deleteExpenseAction(id);
    setDeleting(null);
    if (res.ok) { toast.push("Expense deleted", "success"); router.refresh(); } else toast.push(res.error, "danger");
  }); };

  const actions = (r: ExpenseListRow) => canWrite ? (
    <div className="flex items-center justify-end gap-0.5">
      {r.status === "expected" && (
        <button type="button" onClick={() => markPaid(r)} disabled={pending && busyId === r.id} title="Mark as paid"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] text-success hover:bg-success-soft disabled:opacity-50"><Check className="h-3.5 w-3.5" />Paid</button>
      )}
      <button type="button" onClick={() => edit(r)} title="Edit" className="rounded p-1 text-text-3 hover:text-text hover:bg-surface-2"><Pencil className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={() => setDeleting(r)} title="Delete" className="rounded p-1 text-text-3 hover:text-danger hover:bg-danger-soft"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  ) : null;

  return (
    <>
      {/* Desktop table */}
      <TableWrap className="hidden md:block">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>{showStore && <th>Store</th>}<th>Category</th><th>Vendor</th><th>Description</th><th>Payment</th>
              <th className="num">Amount</th><th>Status</th><th className="text-center">Receipt</th>{canWrite && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={cn(r.status === "expected" && "text-text-2")}>
                <td><Link href={`/expenses/${r.id}`} className="tnum hover:text-accent hover:underline">{formatShortDate(r.business_date)}</Link></td>
                {showStore && <td className="max-w-[140px] truncate">{r.location_name}</td>}
                <td><span className="inline-flex items-center gap-1.5">{r.category_name}<Badge tone={BUCKET_TONE[r.bucket as AccountingBucket] ?? "neutral"}>{BUCKET_LABEL[r.bucket as AccountingBucket] ?? r.bucket}</Badge></span></td>
                <td className="max-w-[160px] truncate">{r.vendor || <span className="text-text-3">—</span>}</td>
                <td className="max-w-[220px] truncate text-text-2" title={r.description ?? undefined}>
                  {r.recurring_expense_id && <Repeat className="inline h-3 w-3 mr-1 text-text-3" aria-label="Recurring" />}{r.description || <span className="text-text-3">—</span>}
                </td>
                <td className="text-text-2">{paymentLabel(r.payment_method)}</td>
                <td className="num font-medium text-text">{formatMoney(r.amount, { currency })}</td>
                <td><StatusBadge kind="expense" value={r.status} /></td>
                <td className="text-center">{r.receipt ? <ReceiptLink receiptId={r.receipt.id} contentType={r.receipt.content_type} /> : <span className="text-text-3">—</span>}</td>
                {canWrite && <td>{actions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="card px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/expenses/${r.id}`} className="text-[13.5px] font-medium truncate block">{r.vendor || r.category_name}</Link>
                <div className="text-[12px] text-text-3 truncate">
                  <span className="tnum">{formatShortDate(r.business_date)}</span>{showStore && <> · {r.location_name}</>} · {r.category_name} · {paymentLabel(r.payment_method)}
                </div>
                {r.description && <div className="text-[12.5px] text-text-2 truncate mt-0.5">{r.description}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="tnum text-[15px] font-semibold">{formatMoney(r.amount, { currency })}</div>
                <StatusBadge kind="expense" value={r.status} className="mt-1" />
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Badge tone={BUCKET_TONE[r.bucket as AccountingBucket] ?? "neutral"}>{BUCKET_LABEL[r.bucket as AccountingBucket] ?? r.bucket}</Badge>
                {r.receipt && <ReceiptLink receiptId={r.receipt.id} contentType={r.receipt.content_type} label="Receipt" />}
              </div>
              {actions(r)}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ExpenseModal open onClose={() => setEditing(null)} organizationId={organizationId} locations={locations} categories={categories} today={today} currency={currency} initial={editing} />
      )}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Delete expense?" confirmLabel="Delete" tone="danger" loading={pending}>
        {deleting && <>This removes <strong>{formatMoney(deleting.amount, { currency })}</strong> ({deleting.category_name}{deleting.vendor ? ` · ${deleting.vendor}` : ""}) from {formatShortDate(deleting.business_date)}. The day&apos;s totals update immediately.</>}
      </ConfirmDialog>
    </>
  );
}
