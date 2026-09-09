"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { setEmploymentStatusAction } from "@/app/(app)/employees/actions";

/** Deactivate / reactivate. Never deletes: shifts and history stay. */
export function EmploymentStatusButton({ employeeId, status, name, hasActiveShift }: { employeeId: string; status: string; name: string; hasActiveShift: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const active = status === "active";
  const run = () => start(async () => {
    const r = await setEmploymentStatusAction(employeeId, active ? "inactive" : "active");
    setOpen(false);
    if (!r.ok) { toast.push(r.error, "danger"); return; }
    toast.push(active ? `${name} deactivated` : `${name} reactivated`, "success");
    router.refresh();
  });
  return (
    <>
      <Button size="sm" variant={active ? "secondary" : "success"} className={active ? "text-danger" : undefined} onClick={() => setOpen(true)}>{active ? "Deactivate" : "Reactivate"}</Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} onConfirm={run} loading={pending} title={active ? `Deactivate ${name}?` : `Reactivate ${name}?`} confirmLabel={active ? "Deactivate" : "Reactivate"} tone={active ? "danger" : "primary"}>
        {active ? (
          <>They will no longer be able to sign in, clock in or appear in schedules. Their shifts, hours and pay history are kept — employees are never deleted.{hasActiveShift && <> <b>They are clocked in right now; the shift will be closed with a &ldquo;deactivated&rdquo; note.</b></>}</>
        ) : (
          <>Restores sign-in and clock-in for their assigned stores and clears the end date.</>
        )}
      </ConfirmDialog>
    </>
  );
}
