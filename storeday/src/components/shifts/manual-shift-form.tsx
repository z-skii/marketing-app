"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, ErrorText, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { createManualShiftAction } from "@/app/(app)/shifts/actions";

export function ManualShiftForm({ employees, locations, defaults }: {
  employees: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string; timezone: string }>;
  defaults: { employee_id?: string; location_id?: string; date: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, action, pending] = useActionState(createManualShiftAction, null);
  const [locationId, setLocationId] = useState(defaults.location_id && locations.some((l) => l.id === defaults.location_id) ? defaults.location_id : locations[0]?.id ?? "");
  const tz = locations.find((l) => l.id === locationId)?.timezone;
  useEffect(() => {
    if (state?.ok) { toast.push("Shift added", "success"); router.push(`/shifts/${state.data.id}`); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (employees.length === 0) return <Alert tone="warn">No active employees yet. Add one on the Employees page first.</Alert>;
  if (locations.length === 0) return <Alert tone="warn">No stores yet. Add a store first.</Alert>;

  return (
    <form action={action} className="space-y-3">
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Employee">
          <Select name="employee_id" required defaultValue={defaults.employee_id && employees.some((e) => e.id === defaults.employee_id) ? defaults.employee_id : employees[0]?.id}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </Field>
        <Field label="Store">
          <Select name="location_id" required value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </Field>
        <Field label="Clock in" hint={tz ? `store time · ${tz}` : undefined}><Input name="clock_in" type="datetime-local" required defaultValue={`${defaults.date}T09:00`} /></Field>
        <Field label="Clock out"><Input name="clock_out" type="datetime-local" required defaultValue={`${defaults.date}T17:00`} /></Field>
      </div>
      <Field label="Unpaid break" hint="minutes"><Input name="break_minutes" type="number" min={0} max={1440} step={5} inputMode="numeric" className="w-32" defaultValue={0} /></Field>
      <Field label="Reason" hint="required"><Textarea name="reason" required minLength={3} placeholder="e.g. Phone died, worked the full shift (confirmed by camera)" /></Field>
      <Alert tone="info">This shift will be marked <b>Manual entry</b>. It counts toward labor at the employee&apos;s current rate.</Alert>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={pending}>Add shift</Button>
      </div>
    </form>
  );
}
