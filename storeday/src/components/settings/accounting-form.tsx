"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorText, Field, Input, Select, Alert } from "@/components/ui/form";
import { SectionLabel } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { saveAccountingAction } from "@/app/(app)/settings/actions";

export interface AccountingSettingsValues {
  week_starts_on: number;
  cash_check_enabled: boolean;
  other_sales_enabled: boolean;
  employee_can_view_accounting: boolean;
  overtime_enabled: boolean;
  overtime_weekly_hours: number;
  overtime_daily_hours: number | null;
  overtime_multiplier: number;
}

export function AccountingForm({ values }: { values: AccountingSettingsValues }) {
  const [state, action, pending] = useActionState(saveAccountingAction, null);
  const [otEnabled, setOtEnabled] = useState(values.overtime_enabled);
  const router = useRouter();
  const toast = useToast();
  const handled = useRef<unknown>(null);
  useEffect(() => { if (state?.ok && handled.current !== state) { handled.current = state; toast.push("Accounting settings saved", "success"); router.refresh(); } }, [state, router, toast]);
  return (
    <form action={action} className="space-y-4 max-w-xl">
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <div className="card p-4 space-y-3">
        <SectionLabel>Daily accounting</SectionLabel>
        <Field label="Week starts on" hint="weekly reports and overtime weeks">
          <Select name="week_starts_on" defaultValue={String(values.week_starts_on)} className="w-40">
            <option value="1">Monday</option>
            <option value="0">Sunday</option>
          </Select>
        </Field>
        <Checkbox name="cash_check_enabled" defaultChecked={values.cash_check_enabled} label="Cash check at close" description="Compare expected vs actual drawer cash and flag over/short." />
        <Checkbox name="other_sales_enabled" defaultChecked={values.other_sales_enabled} label="Track “Other sales”" description="A third sales line for lottery, services, etc." />
        <Checkbox name="employee_can_view_accounting" defaultChecked={values.employee_can_view_accounting} label="Employees can view accounting" description="Off (recommended): only managers and owners ever see sales, expenses or profit." />
        <p className="text-[12px] text-text-3">
          Expense categories and recurring expenses live under Expenses: <Link href="/expenses/categories" className="underline hover:text-text">Categories</Link> · <Link href="/expenses/recurring" className="underline hover:text-text">Recurring expenses</Link>.
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <SectionLabel>Overtime</SectionLabel>
        <Checkbox name="overtime_enabled" checked={otEnabled} onChange={(e) => setOtEnabled(e.target.checked)} label="Apply overtime rules in payroll estimates" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Weekly hours" hint="over →OT"><Input name="overtime_weekly_hours" type="number" step="0.5" min={1} max={168} defaultValue={values.overtime_weekly_hours} disabled={!otEnabled} className="tnum" /></Field>
          <Field label="Daily hours" hint="blank = none"><Input name="overtime_daily_hours" type="number" step="0.5" min={1} max={24} defaultValue={values.overtime_daily_hours ?? ""} placeholder="—" disabled={!otEnabled} className="tnum" /></Field>
          <Field label="Multiplier" hint="× rate"><Input name="overtime_multiplier" type="number" step="0.05" min={1} max={5} defaultValue={values.overtime_multiplier} disabled={!otEnabled} className="tnum" /></Field>
        </div>
        <Alert tone="info">Payroll in Storeday is an <b>estimate</b> from verified shifts and hourly rates: no taxes, withholdings or benefits. Use it to check hours before running real payroll.</Alert>
      </div>
      <div className="flex justify-end"><Button type="submit" loading={pending}>Save changes</Button></div>
    </form>
  );
}
