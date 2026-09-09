"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { DEFAULT_MANAGER_PERMISSIONS, PERMISSION_LABELS, type PermissionKey } from "@/lib/permissions";
import { updateMemberPermissionsAction } from "@/app/(app)/employees/actions";

const KEYS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

/** Owner toggles for a manager's organization_members.permissions. */
export function PermissionsEditor({ employeeId, initial }: { employeeId: string; initial: Partial<Record<PermissionKey, boolean>> }) {
  const [values, setValues] = useState<Record<PermissionKey, boolean>>(() => {
    const out = { ...DEFAULT_MANAGER_PERMISSIONS };
    for (const k of KEYS) if (typeof initial[k] === "boolean") out[k] = initial[k] as boolean;
    return out;
  });
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const save = () => start(async () => {
    const r = await updateMemberPermissionsAction(employeeId, values);
    if (!r.ok) { toast.push(r.error, "danger"); return; }
    setDirty(false); toast.push("Permissions saved", "success"); router.refresh();
  });
  return (
    <div>
      <div className="divide-y divide-border">
        {KEYS.map((k) => (
          <Switch key={k} checked={values[k]} label={PERMISSION_LABELS[k]} onChange={(v) => { setValues((s) => ({ ...s, [k]: v })); setDirty(true); }} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 mt-2">
        <p className="text-[12px] text-text-3">Owners always have every permission. Changes apply on the manager&apos;s next page load.</p>
        <Button size="sm" onClick={save} loading={pending} disabled={!dirty}>Save</Button>
      </div>
    </div>
  );
}
