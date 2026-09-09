"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorText } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { createExpenseAction, updateExpenseAction } from "@/app/(app)/expenses/actions";
import { ExpenseFields, type CategoryOption, type ExpenseFormInitial, type LocationOption } from "./expense-form";

export interface ExpenseModalProps {
  open: boolean; onClose: () => void; organizationId: string; locations: LocationOption[]; categories: CategoryOption[];
  /** Default date for a new expense (today in the org timezone). */
  today: string; currency?: string;
  /** When set (with an id) the modal edits that expense instead of creating one. */
  initial?: ExpenseFormInitial; defaultLocationId?: string; onSaved?: () => void;
}

/** Full Add / Edit expense dialog. State resets every time it opens (the inner form is unmounted when closed). */
export function ExpenseModal(props: ExpenseModalProps) {
  if (!props.open) return null;
  return <ExpenseModalInner {...props} />;
}

type FormAction = (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;

function ExpenseModalInner({ onClose, organizationId, locations, categories, today, currency, initial, defaultLocationId, onSaved }: ExpenseModalProps) {
  const isEdit = Boolean(initial?.id);
  const [state, action, pending] = useActionState((isEdit ? updateExpenseAction : createExpenseAction) as FormAction, null);
  const [amount, setAmount] = useState<number | null>(initial?.amount ?? null);
  const router = useRouter();
  const toast = useToast();
  const done = useRef(false);

  useEffect(() => {
    if (state?.ok && !done.current) {
      done.current = true;
      toast.push(isEdit ? "Expense updated" : "Expense added", "success");
      router.refresh();
      onSaved?.();
      onClose();
    }
  }, [state, isEdit, router, toast, onSaved, onClose]);

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit expense" : "Add expense"} size="md"
      footer={<><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" form="expense-form" loading={pending} disabled={!amount}>{isEdit ? "Save" : "Add expense"}</Button></>}>
      <form id="expense-form" action={action} className="space-y-3">
        <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
        {initial?.id && <input type="hidden" name="id" value={initial.id} />}
        <ExpenseFields organizationId={organizationId} locations={locations} categories={categories} initial={initial} currency={currency}
          defaultLocationId={defaultLocationId} defaultDate={today} showDate showStatus onAmountChange={setAmount} />
      </form>
    </Modal>
  );
}
