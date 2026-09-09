"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Alert, ErrorText, Field, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { toDateTimeLocal } from "@/lib/utils/datetime-local";
import { adjustShiftAction } from "@/app/(app)/shifts/actions";

export function AdjustShiftModal({ open, onClose, shift, timezone }: {
  open: boolean; onClose: () => void; timezone: string;
  shift: { id: string; clock_in_at: string; clock_out_at: string | null; break_minutes: number; status: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, action, pending] = useActionState(adjustShiftAction, null);
  useEffect(() => {
    if (state?.ok) { toast.push("Hours corrected", "success"); onClose(); router.refresh(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <Modal open={open} onClose={onClose} title="Correct hours">
      <form action={action} className="space-y-3">
        <input type="hidden" name="shift_id" value={shift.id} />
        <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
        <Alert tone="info">Times are in the store&apos;s timezone ({timezone}). The original times are kept in the audit history.</Alert>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Clock in"><Input name="clock_in" type="datetime-local" required defaultValue={toDateTimeLocal(shift.clock_in_at, timezone)} /></Field>
          <Field label="Clock out" hint={shift.status === "active" ? "blank = still working" : undefined}><Input name="clock_out" type="datetime-local" defaultValue={toDateTimeLocal(shift.clock_out_at, timezone)} /></Field>
        </div>
        <Field label="Unpaid break" hint="minutes"><Input name="break_minutes" type="number" min={0} max={1440} step={5} inputMode="numeric" className="w-32" defaultValue={shift.break_minutes} /></Field>
        <Field label="Reason" hint="required · shown in the audit log"><Textarea name="reason" required minLength={3} placeholder="e.g. Forgot to clock out, left at 5:15 PM per camera" /></Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending}>Save correction</Button>
        </div>
      </form>
    </Modal>
  );
}
