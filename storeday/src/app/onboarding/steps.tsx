"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorText, Field, Input, Select } from "@/components/ui/form";
import { COMMON_TIMEZONES } from "@/lib/utils/time";
import { createBusinessAction, saveAccountingPrefsAction, saveClockSettingsAction, setOnboardingStepAction } from "./actions";
import { createLocationAction } from "@/app/(app)/stores/actions";
import { LocationForm } from "@/components/locations/location-form";
import { EmployeeQuickAdd } from "@/components/team/employee-quick-add";

const BUSINESS_TYPES = ["Convenience store", "Tobacco / smoke shop", "Gas station", "Retail store", "Restaurant", "Barber shop", "Salon", "Coffee shop", "Other"];

function StepCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 space-y-4">
      <div><h1 className="text-[18px] font-semibold">{title}</h1>{description && <p className="text-[13px] text-text-3 mt-0.5">{description}</p>}</div>
      {children}
    </div>
  );
}

export function BusinessStep() {
  const [state, action, pending] = useActionState(createBusinessAction, null);
  const guess = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York";
  return (
    <StepCard title="Your business" description="You can add more businesses later.">
      <form action={action} className="space-y-4">
        <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
        <Field label="Business name"><Input name="name" required autoFocus placeholder="e.g. Mr Tobacco LLC" /></Field>
        <Field label="Business type"><Select name="business_type" defaultValue="">{["", ...BUSINESS_TYPES].map((t) => <option key={t} value={t}>{t || "Select…"}</option>)}</Select></Field>
        <Field label="Timezone"><Select name="timezone" defaultValue={COMMON_TIMEZONES.includes(guess) ? guess : "America/New_York"}>{Array.from(new Set([guess, ...COMMON_TIMEZONES])).map((tz) => <option key={tz} value={tz}>{tz}</option>)}</Select></Field>
        <Button type="submit" size="lg" block loading={pending}>Continue</Button>
      </form>
    </StepCard>
  );
}

export function StoreStep({ orgTimezone }: { orgTimezone: string }) {
  const router = useRouter();
  return (
    <StepCard title="Add your first store" description="Coordinates power Verified Shift. Use the address lookup or your current location.">
      <LocationForm action={createLocationAction} defaultTimezone={orgTimezone} submitLabel="Add store & continue" onDone={() => router.refresh()} />
    </StepCard>
  );
}

export function AccountingStep({ categories, currency }: { categories: Array<{ id: string; name: string }>; currency: string }) {
  const [state, action, pending] = useActionState(saveAccountingPrefsAction, null);
  const router = useRouter();
  if (state?.ok) router.refresh();
  return (
    <StepCard title="Accounting preferences" description="Defaults that match a typical store. Change anything later in Settings.">
      <form action={action} className="space-y-4">
        <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
        <Field label="Currency"><Input name="currency" defaultValue={currency} maxLength={3} className="w-24 uppercase" /></Field>
        <Checkbox name="cash_check_enabled" defaultChecked label="Cash check at close" description="Compare expected vs actual drawer cash and flag over/short." />
        <Checkbox name="other_sales_enabled" defaultChecked label="Track “Other sales”" description="A third sales line for lottery, services, etc." />
        <div>
          <div className="text-[12.5px] font-medium text-text-2 mb-1">Expense categories</div>
          <div className="flex flex-wrap gap-1.5">{categories.map((c) => <span key={c.id} className="rounded border border-border bg-surface-2 px-2 py-0.5 text-[12px]">{c.name}</span>)}</div>
          <Input name="extra_categories" placeholder="Add more, comma separated (e.g. Lottery, ATM fees)" className="mt-2" />
        </div>
        <Button type="submit" size="lg" block loading={pending}>Continue</Button>
      </form>
    </StepCard>
  );
}

export function EmployeesStep({ locations, employees }: { locations: Array<{ id: string; name: string }>; employees: Array<{ id: string; full_name: string; role: string; hourly_rate: number | null }> }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const next = () => start(async () => { await setOnboardingStepAction(6); router.refresh(); });
  return (
    <StepCard title="Add employees" description="Add your team now or later from the Employees page. Each person gets an invitation link.">
      {employees.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {employees.map((e) => <li key={e.id} className="flex justify-between px-3 py-2 text-[13px]"><span>{e.full_name} <span className="text-text-3 capitalize">· {e.role}</span></span><span className="tnum text-text-2">{e.hourly_rate != null ? `$${e.hourly_rate}/hr` : "—"}</span></li>)}
        </ul>
      )}
      <EmployeeQuickAdd locations={locations} onAdded={() => router.refresh()} />
      <Button size="lg" block onClick={next} loading={pending}>{employees.length ? "Continue" : "Skip for now"}</Button>
    </StepCard>
  );
}

export function ClockStep() {
  const [state, action, pending] = useActionState(saveClockSettingsAction, null);
  const [radius, setRadius] = useState(250);
  return (
    <StepCard title="Clock-in settings" description="Employees clock in with a live photo and GPS. Choose how strict to be.">
      <form action={action} className="space-y-4">
        <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
        <Field label="Allowed GPS radius" hint="feet from the store">
          <div className="flex items-center gap-3">
            <input type="range" name="radius_ft" min={50} max={1500} step={25} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
            <span className="tnum w-16 text-right font-medium">{radius} ft</span>
          </div>
        </Field>
        <Checkbox name="require_photo" label="Require a live photo to clock in" description="Off: clock-ins without a photo are allowed but flagged for review." />
        <Checkbox name="block_outside" label="Block clock-ins outside the radius" description="Off: outside-radius clock-ins are allowed but flagged and you are notified." />
        <Button type="submit" size="lg" block loading={pending}>Finish & open dashboard</Button>
      </form>
    </StepCard>
  );
}
