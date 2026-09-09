"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deleteExpenseAction, markExpensePaidAction } from "@/app/(app)/expenses/actions";
import { ExpenseModal } from "./expense-modal";
import type { CategoryOption, ExpenseFormInitial, LocationOption } from "./expense-form";

/** Edit / Mark paid / Delete for the expense detail page. */
export function ExpenseDetailActions({ organizationId, locations, categories, today, currency, initial, status }: {
  organizationId: string; locations: LocationOption[]; categories: CategoryOption[]; today: string; currency: string; initial: ExpenseFormInitial & { id: string }; status: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  const markPaid = () => start(async () => {
    const r = await markExpensePaidAction(initial.id);
    if (r.ok) { toast.push("Marked as paid", "success"); router.refresh(); } else toast.push(r.error, "danger");
  });
  const remove = () => start(async () => {
    const r = await deleteExpenseAction(initial.id);
    setConfirming(false);
    if (r.ok) { toast.push("Expense deleted", "success"); router.push("/expenses"); router.refresh(); } else toast.push(r.error, "danger");
  });

  return (
    <>
      {status === "expected" && <Button variant="success" size="sm" onClick={markPaid} loading={pending}><Check className="h-3.5 w-3.5" />Mark paid</Button>}
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
      <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirming(true)}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
      <ExpenseModal open={editing} onClose={() => setEditing(false)} organizationId={organizationId} locations={locations} categories={categories} today={today} currency={currency} initial={initial} />
      <ConfirmDialog open={confirming} onClose={() => setConfirming(false)} onConfirm={remove} title="Delete expense?" confirmLabel="Delete" tone="danger" loading={pending}>
        This removes the expense and updates the day&apos;s totals. The receipt file, if any, stays in storage.
      </ConfirmDialog>
    </>
  );
}
