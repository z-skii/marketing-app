"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { updateEmployeeAction } from "@/app/(app)/employees/actions";

export interface EmployeeFormValues {
  id: string; first_name: string; last_name: string; email: string | null; phone: string | null; role: string;
  employment_status: string; start_date: string | null; end_date: string | null; notes: string | null; location_ids: string[];
  user_id: string | null;
}

/** Owner-only edit form. Stores checkboxes sync employee_locations; role changes sync the member role. */
export function EmployeeProfileForm({ employee, locations, isSelf }: { employee: EmployeeFormValues; locations: Array<{ id: string; name: string }>; isSelf: boolean }) {
  const [state, action, pending] = useActionState(updateEmployeeAction, null);
  const router = useRouter();
  const toast = useToast();
  const handled = useRef<unknown>(null);
  useEffect(() => {
    if (state?.ok && handled.current !== state) { handled.current = state; toast.push("Profile saved", "success"); router.refresh(); }
  }, [state, router, toast]);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={employee.id} />
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name"><Input name="first_name" required defaultValue={employee.first_name} /></Field>
        <Field label="Last name"><Input name="last_name" defaultValue={employee.last_name} /></Field>
        <Field label="Email" hint={employee.user_id ? "sign-in email is managed by the account" : "used for the invitation"}><Input name="email" type="email" defaultValue={employee.email ?? ""} /></Field>
        <Field label="Phone"><Input name="phone" type="tel" defaultValue={employee.phone ?? ""} /></Field>
        <Field label="Role" hint={employee.user_id ? "updates their account role" : undefined}>
          <Select name="role" defaultValue={employee.role === "manager" ? "manager" : "employee"} disabled={isSelf}>
            <option value="employee">Employee</option><option value="manager">Manager</option>
          </Select>
          {isSelf && <input type="hidden" name="role" value={employee.role === "manager" ? "manager" : "employee"} />}
        </Field>
        <Field label="Employment status">
          <Select name="employment_status" defaultValue={employee.employment_status} disabled={isSelf}>
            <option value="active">Active</option><option value="inactive">Inactive</option><option value="terminated">Terminated</option>
          </Select>
          {isSelf && <input type="hidden" name="employment_status" value={employee.employment_status} />}
        </Field>
        <Field label="Start date"><Input name="start_date" type="date" defaultValue={employee.start_date ?? ""} /></Field>
        <Field label="End date" hint="optional"><Input name="end_date" type="date" defaultValue={employee.end_date ?? ""} /></Field>
      </div>
      {locations.length > 0 && (
        <div>
          <div className="text-[12.5px] font-medium text-text-2 mb-1">Assigned stores <span className="font-normal text-text-3">· where they can clock in and be scheduled</span></div>
          <div className="flex flex-wrap gap-2">
            {locations.map((l) => (
              <label key={l.id} className="inline-flex items-center gap-1.5 text-[13px] rounded border border-border px-2 py-1 cursor-pointer has-checked:bg-accent-soft has-checked:border-accent">
                <input type="checkbox" name="location_ids" value={l.id} defaultChecked={employee.location_ids.includes(l.id)} className="accent-[var(--accent)]" />{l.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <Field label="Notes" hint="private to owners and managers"><Textarea name="notes" defaultValue={employee.notes ?? ""} placeholder="Availability, certifications, emergency contact…" /></Field>
      <div className="flex justify-end"><Button type="submit" loading={pending}>Save profile</Button></div>
    </form>
  );
}
