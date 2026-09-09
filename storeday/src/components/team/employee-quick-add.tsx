"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Select } from "@/components/ui/form";
import { createEmployeeAction } from "@/app/(app)/employees/actions";

/** Compact add-employee form used in onboarding and the Employees page. */
export function EmployeeQuickAdd({ locations, onAdded }: { locations: Array<{ id: string; name: string }>; onAdded?: () => void }) {
  const [state, action, pending] = useActionState(createEmployeeAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState(false);
  // Derived from the last successful action result, so no setState is needed inside the effect.
  const lastInvite = state?.ok && state.data.invite_url ? { url: state.data.invite_url, emailed: state.data.invite_emailed } : null;
  const handled = useRef<unknown>(null);
  useEffect(() => {
    if (state?.ok && handled.current !== state) {
      handled.current = state;
      formRef.current?.reset();
      onAdded?.();
    }
  }, [state, onAdded]);
  const copy = async () => { if (!lastInvite) return; try { await navigator.clipboard.writeText(lastInvite.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <form ref={formRef} action={action} className="rounded-md border border-border p-3 space-y-3">
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      {lastInvite && (
        <div className="rounded-md bg-success-soft border border-success/30 p-2.5 text-[12.5px]">
          <div className="text-success font-medium">Employee added.</div>
          <div className="text-text-2 mt-0.5">{lastInvite.emailed ? "An invitation email was sent. You can also share this link:" : "Share this invitation link with them (email sending is not configured):"}</div>
          <div className="flex items-center gap-2 mt-1"><code className="flex-1 truncate text-[11.5px] bg-surface rounded px-2 py-1 border border-border">{lastInvite.url}</code><Button type="button" size="sm" variant="secondary" onClick={copy}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}</Button></div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name"><Input name="first_name" required /></Field>
        <Field label="Last name"><Input name="last_name" /></Field>
        <Field label="Email" hint="for the invite"><Input name="email" type="email" /></Field>
        <Field label="Phone"><Input name="phone" type="tel" /></Field>
        <Field label="Role"><Select name="role" defaultValue="employee"><option value="employee">Employee</option><option value="manager">Manager</option></Select></Field>
        <Field label="Hourly rate"><Input name="hourly_rate" type="number" step="0.25" min="0" inputMode="decimal" placeholder="15.00" /></Field>
      </div>
      {locations.length > 0 && (
        <div>
          <div className="text-[12.5px] font-medium text-text-2 mb-1">Assigned stores</div>
          <div className="flex flex-wrap gap-2">
            {locations.map((l, i) => (
              <label key={l.id} className="inline-flex items-center gap-1.5 text-[13px] rounded border border-border px-2 py-1 cursor-pointer has-checked:bg-accent-soft has-checked:border-accent">
                <input type="checkbox" name="location_ids" value={l.id} defaultChecked={i === 0} className="accent-[var(--accent)]" />{l.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <Button type="submit" variant="secondary" loading={pending}>Add employee</Button>
    </form>
  );
}
