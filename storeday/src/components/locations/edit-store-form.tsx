"use client";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { ErrorText } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { LocationForm, type LocationFormValues } from "@/components/locations/location-form";
import { archiveLocationAction, updateLocationAction } from "@/app/(app)/stores/actions";
import type { ActionResult } from "@/lib/action-result";

/** LocationForm passes an ActionResult<{ id }> as prev; the update action only cares that it is an ActionResult. */
const updateAction = (prev: ActionResult<{ id: string }> | null, fd: FormData) => updateLocationAction(prev as ActionResult | null, fd);

export function EditStoreForm({ initial, defaultTimezone }: { initial: LocationFormValues & { id: string }; defaultTimezone: string }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const onDone = useCallback(() => { toast.push("Store saved", "success"); router.push(`/stores/${initial.id}`); }, [router, toast, initial.id]);
  const archive = () => start(async () => {
    const r = await archiveLocationAction(initial.id);
    if (!r.ok) { setError(r.error); setConfirm(false); return; }
    toast.push("Store archived", "neutral");
    router.push("/stores");
  });
  return (
    <div className="space-y-6">
      <LocationForm action={updateAction} initial={initial} defaultTimezone={defaultTimezone} submitLabel="Save changes" onDone={onDone} />
      <div className="rounded-md border border-danger/30 p-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[13.5px] font-medium">Archive this store</div>
          <p className="text-[12.5px] text-text-3">Hides it from every list and stops clock-ins. Past accounting and shifts are kept.</p>
          <ErrorText>{error}</ErrorText>
        </div>
        <Button type="button" variant="danger" size="sm" onClick={() => setConfirm(true)}><Archive className="h-3.5 w-3.5" />Archive store</Button>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={archive} title={`Archive ${initial.name}?`} confirmLabel="Archive" tone="danger" loading={pending}>
        Employees will no longer be able to clock in here and it disappears from dashboards. Historical data stays intact.
      </ConfirmDialog>
    </div>
  );
}
