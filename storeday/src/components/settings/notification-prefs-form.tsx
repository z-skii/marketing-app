"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorText, Switch, Alert } from "@/components/ui/form";
import { SectionLabel } from "@/components/ui/card";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils/currency";
import { NOTIFICATION_KINDS } from "@/components/notifications/kinds";
import { saveNotificationPreferencesAction } from "@/app/(app)/notifications/actions";

export interface PrefsValues { enabled: Record<string, boolean>; cash_shortage_threshold: number; large_expense_threshold: number }

export function NotificationPrefsForm({ values, currency }: { values: PrefsValues; currency: string }) {
  const [state, action, pending] = useActionState(saveNotificationPreferencesAction, null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(values.enabled);
  const [cash, setCash] = useState<number | null>(values.cash_shortage_threshold);
  const [large, setLarge] = useState<number | null>(values.large_expense_threshold);
  const router = useRouter();
  const toast = useToast();
  const handled = useRef<unknown>(null);
  useEffect(() => { if (state?.ok && handled.current !== state) { handled.current = state; toast.push("Notification preferences saved", "success"); router.refresh(); } }, [state, router, toast]);
  return (
    <form action={action} className="space-y-4 max-w-xl">
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <div className="card p-4">
        <SectionLabel>Notify me about</SectionLabel>
        <div className="divide-y divide-border">
          {NOTIFICATION_KINDS.map((k) => (
            <div key={k.kind}>
              <input type="hidden" name={k.kind} value={enabled[k.kind] ? "on" : "off"} />
              <Switch checked={!!enabled[k.kind]} onChange={(v) => setEnabled((e) => ({ ...e, [k.kind]: v }))} label={k.label} description={k.description} />
            </div>
          ))}
        </div>
      </div>
      <div className="card p-4 space-y-3">
        <SectionLabel>Thresholds</SectionLabel>
        <label className="flex items-center justify-between gap-3 text-[13.5px]">
          <span>Only notify me when a cash shortage exceeds</span>
          <span className="w-32"><MoneyInput value={cash} onValueChange={setCash} currency={currency} disabled={!enabled.cash_shortage} /></span>
          <input type="hidden" name="cash_shortage_threshold" value={cash ?? ""} />
        </label>
        <label className="flex items-center justify-between gap-3 text-[13.5px]">
          <span>Only notify me when an expense exceeds</span>
          <span className="w-32"><MoneyInput value={large} onValueChange={setLarge} currency={currency} disabled={!enabled.large_expense} /></span>
          <input type="hidden" name="large_expense_threshold" value={large ?? ""} />
        </label>
        <p className="text-[12px] text-text-3">Defaults: {formatMoney(20, { currency })} shortage, {formatMoney(500, { currency })} expense. Leave blank to use the default.</p>
      </div>
      <Alert tone="info">These are your own preferences for this business. Notifications are delivered in the app (bell icon); email and push delivery are not set up.</Alert>
      <div className="flex justify-end"><Button type="submit" loading={pending}>Save preferences</Button></div>
    </form>
  );
}
