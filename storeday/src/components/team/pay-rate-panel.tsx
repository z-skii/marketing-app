"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/time";
import { addPayRateAction } from "@/app/(app)/employees/actions";

export interface PayRateItem { id: string; hourly_rate: number; effective_from: string; created_at: string }

/** Rate history (desc) + owner "Add rate" with an effective date. */
export function PayRatePanel({ employeeId, rates, today, canEdit, currency }: { employeeId: string; rates: PayRateItem[]; today: string; canEdit: boolean; currency: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addPayRateAction, null);
  const router = useRouter();
  const toast = useToast();
  const handled = useRef<unknown>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && handled.current !== state) { handled.current = state; formRef.current?.reset(); setOpen(false); toast.push("Rate added", "success"); router.refresh(); }
  }, [state, router, toast]);

  const currentId = rates.filter((r) => r.effective_from <= today).sort((a, b) => b.effective_from.localeCompare(a.effective_from) || b.created_at.localeCompare(a.created_at))[0]?.id;

  return (
    <div className="space-y-3">
      {rates.length === 0 ? (
        <p className="text-[13px] text-text-3">No pay rate yet. Shifts without a rate count hours but $0 labor.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Effective from</th><th className="num">Rate</th><th></th></tr></thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.id}>
                <td>{formatShortDate(r.effective_from)} <span className="text-text-3">{r.effective_from.slice(0, 4)}</span></td>
                <td className="num font-medium">{formatMoney(r.hourly_rate, { currency })}/hr</td>
                <td>{r.id === currentId ? <Badge tone="success">Current</Badge> : r.effective_from > today ? <Badge tone="warn">Scheduled</Badge> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {canEdit && !open && <Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />Add rate</Button>}
      {canEdit && open && (
        <form ref={formRef} action={action} className="rounded-md border border-border p-3 space-y-3">
          <input type="hidden" name="employee_id" value={employeeId} />
          <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hourly rate"><Input name="hourly_rate" type="number" step="0.25" min="0" inputMode="decimal" required autoFocus placeholder="15.00" /></Field>
            <Field label="Effective from"><Input name="effective_from" type="date" defaultValue={today} required /></Field>
          </div>
          <p className="text-[12px] text-text-3">Shifts snapshot the rate in effect on their business date. A future date schedules a raise: shifts before it keep the old rate, shifts on or after it use the new one. Past shifts are never rewritten.</p>
          <div className="flex gap-2 justify-end"><Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" size="sm" loading={pending}>Save rate</Button></div>
        </form>
      )}
    </div>
  );
}
