import type { Metadata } from "next";
import { requireOwnerContext } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { AccountingForm } from "@/components/settings/accounting-form";

export const metadata: Metadata = { title: "Accounting settings" };

export default async function AccountingSettingsPage() {
  const ctx = await requireOwnerContext();
  const s = ctx.settings;
  return (
    <div>
      <PageHeader title="Settings" description="How days are closed, what employees can see, and overtime rules for payroll estimates." />
      <SettingsTabs active="accounting" isOwner />
      <AccountingForm values={{
        week_starts_on: s.week_starts_on, cash_check_enabled: s.cash_check_enabled, other_sales_enabled: s.other_sales_enabled,
        employee_can_view_accounting: s.employee_can_view_accounting, overtime_enabled: s.overtime_enabled,
        overtime_weekly_hours: Number(s.overtime_weekly_hours), overtime_daily_hours: s.overtime_daily_hours == null ? null : Number(s.overtime_daily_hours),
        overtime_multiplier: Number(s.overtime_multiplier),
      }} />
    </div>
  );
}
