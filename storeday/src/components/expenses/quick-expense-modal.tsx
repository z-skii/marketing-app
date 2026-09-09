"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorText } from "@/components/ui/form";
import { createExpenseAction, type ExpenseRow } from "@/app/(app)/expenses/actions";
import { ExpenseFields } from "./expense-form";

export interface CategoryOption { id: string; name: string; bucket: string }

/**
 * "+ Add Detailed Expense" — a bottom sheet / dialog that never leaves the current page.
 * Amount · Category · Payment · Vendor · Receipt · Note → ADD
 * Shares its fields with the full expense form (ExpenseFields); the date is fixed to the day being closed.
 */
export function QuickExpenseModal({ open, onClose, organizationId, locationId, date, categories, onAdded, locations }: {
  open: boolean; onClose: () => void; organizationId: string; locationId: string; date: string; categories: CategoryOption[];
  onAdded: (expense: ExpenseRow) => void; locations?: Array<{ id: string; name: string }>;
}) {
  if (!open) return null;
  return <QuickExpenseSheet onClose={onClose} organizationId={organizationId} locationId={locationId} date={date} categories={categories} onAdded={onAdded} locations={locations} />;
}

function QuickExpenseSheet({ onClose, organizationId, locationId, date, categories, onAdded, locations }: {
  onClose: () => void; organizationId: string; locationId: string; date: string; categories: CategoryOption[];
  onAdded: (expense: ExpenseRow) => void; locations?: Array<{ id: string; name: string }>;
}) {
  const [state, action, pending] = useActionState(createExpenseAction, null);
  const [amount, setAmount] = useState<number | null>(null);
  const handled = useRef<ExpenseRow | null>(null);

  useEffect(() => {
    if (state?.ok && handled.current !== state.data) {
      handled.current = state.data;
      onAdded(state.data);
      onClose();
    }
  }, [state, onAdded, onClose]);

  const storeOptions = locations && locations.length > 0 ? locations : [{ id: locationId, name: "Store" }];

  return (
    <Modal open onClose={onClose} title="Add detailed expense"
      footer={<><Button variant="secondary" onClick={onClose} type="button">Cancel</Button><Button type="submit" form="quick-expense-form" loading={pending} disabled={!amount}>Add</Button></>}>
      <form id="quick-expense-form" action={action} className="space-y-3">
        <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
        <ExpenseFields organizationId={organizationId} locations={storeOptions} categories={categories} defaultLocationId={locationId} defaultDate={date}
          showDate={false} showStatus={false} onAmountChange={setAmount} categoryFieldId="qe-category" />
      </form>
    </Modal>
  );
}
