"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Select, Alert } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { COMMON_TIMEZONES } from "@/lib/utils/time";
import { saveBusinessAction } from "@/app/(app)/settings/actions";

const BUSINESS_TYPES = ["Convenience store", "Tobacco / smoke shop", "Gas station", "Retail store", "Restaurant", "Barber shop", "Salon", "Coffee shop", "Other"];

export function BusinessForm({ org, orgCount }: { org: { name: string; business_type: string | null; timezone: string; currency: string }; orgCount: number }) {
  const [state, action, pending] = useActionState(saveBusinessAction, null);
  const router = useRouter();
  const toast = useToast();
  const handled = useRef<unknown>(null);
  useEffect(() => { if (state?.ok && handled.current !== state) { handled.current = state; toast.push("Business settings saved", "success"); router.refresh(); } }, [state, router, toast]);
  const types = BUSINESS_TYPES.includes(org.business_type ?? "") || !org.business_type ? BUSINESS_TYPES : [org.business_type, ...BUSINESS_TYPES];
  const tzs = Array.from(new Set([org.timezone, ...COMMON_TIMEZONES]));
  return (
    <form action={action} className="card p-4 space-y-4 max-w-xl">
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <Field label="Business name"><Input name="name" defaultValue={org.name} required maxLength={120} /></Field>
      <Field label="Business type"><Select name="business_type" defaultValue={org.business_type ?? ""}>{["", ...types].map((t) => <option key={t} value={t}>{t || "Not set"}</option>)}</Select></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Timezone" hint="for “today” and reports"><Select name="timezone" defaultValue={org.timezone}>{tzs.map((tz) => <option key={tz} value={tz}>{tz}</option>)}</Select></Field>
        <Field label="Currency" hint="3-letter code"><Input name="currency" defaultValue={org.currency} maxLength={3} className="w-24 uppercase" required /></Field>
      </div>
      <p className="text-[12px] text-text-3">Each store has its own timezone for clock-ins and business dates; this one is the default for the business.</p>
      <div className="flex justify-end"><Button type="submit" loading={pending}>Save changes</Button></div>
      <Alert tone="info" title="More than one business?">
        {orgCount > 1
          ? "Switch between your businesses with the selector at the top of the sidebar. Each has its own stores, team and settings."
          : "Creating a second business from Settings is not available yet. Sign up again with another email or ask us to add one; the switcher in the sidebar appears once you belong to more than one."}
      </Alert>
    </form>
  );
}
