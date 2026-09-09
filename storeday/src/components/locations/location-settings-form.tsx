"use client";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Switch } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/money-input";
import { SectionLabel } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { updateLocationSettingsAction } from "@/app/(app)/stores/actions";

export interface LocationSettingsValues {
  require_accounting_closeout: boolean;
  require_closing_checklist: boolean;
  require_opening_checklist: boolean;
  require_employee_verification: boolean;
  require_cash_count: boolean;
  require_manager_approval: boolean;
  starting_cash: number;
  opens_at: string | null;
  closes_at: string | null;
}

const SWITCHES: Array<{ key: keyof LocationSettingsValues & `require_${string}`; label: string; description: string }> = [
  { key: "require_accounting_closeout", label: "Daily accounting closeout", description: "Notify when yesterday was not closed out by 9 AM." },
  { key: "require_closing_checklist", label: "Closing checklist", description: "Must be completed before the day can be closed." },
  { key: "require_opening_checklist", label: "Opening checklist", description: "Flag when the store opens without it." },
  { key: "require_employee_verification", label: "Verified clock-ins", description: "Photo + location on every clock-in at this store." },
  { key: "require_cash_count", label: "Cash count", description: "A drawer count is required to close the day." },
  { key: "require_manager_approval", label: "Manager approval", description: "Only a manager or the owner can close the day." },
];

/** Sends checkbox-style "on" values via hidden inputs so updateLocationSettingsAction can read them. */
export function LocationSettingsForm({ locationId, initial, currency }: { locationId: string; initial: LocationSettingsValues; currency: string }) {
  const [state, action, pending] = useActionState(updateLocationSettingsAction, null);
  const [values, setValues] = useState(initial);
  const toast = useToast();
  useEffect(() => { if (state?.ok) toast.push("Settings saved", "success"); }, [state, toast]);
  const set = <K extends keyof LocationSettingsValues>(k: K, v: LocationSettingsValues[K]) => setValues((s) => ({ ...s, [k]: v }));
  const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="location_id" value={locationId} />
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>

      <div>
        <SectionLabel>Daily close requirements</SectionLabel>
        <div className="divide-y divide-border">
          {SWITCHES.map((s) => (
            <div key={s.key}>
              <input type="hidden" name={s.key} value={values[s.key] ? "on" : "off"} />
              <Switch checked={values[s.key]} onChange={(v) => set(s.key, v)} label={s.label} description={s.description} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Cash drawer</SectionLabel>
        <Field label="Starting cash" hint="drawer float · used for Expected Closing Cash">
          <input type="hidden" name="starting_cash" value={values.starting_cash ?? 0} />
          <MoneyInput value={values.starting_cash} onValueChange={(v) => set("starting_cash", v ?? 0)} currency={currency} className="w-40" />
        </Field>
      </div>

      <div>
        <SectionLabel>Hours</SectionLabel>
        <p className="text-[12.5px] text-text-3 mb-2">Used for “store did not open” and “store did not close” notifications. Leave blank to disable.</p>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <Field label="Opens at"><Input type="time" name="opens_at" defaultValue={hhmm(initial.opens_at)} /></Field>
          <Field label="Closes at"><Input type="time" name="closes_at" defaultValue={hhmm(initial.closes_at)} /></Field>
        </div>
      </div>

      <Button type="submit" loading={pending}>Save settings</Button>
    </form>
  );
}
