import type { Metadata } from "next";
import { requireOwnerContext } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { BusinessForm } from "@/components/settings/business-form";

export const metadata: Metadata = { title: "Business settings" };

export default async function BusinessSettingsPage() {
  const ctx = await requireOwnerContext();
  return (
    <div>
      <PageHeader title="Settings" description="Business name, type, timezone and currency." />
      <SettingsTabs active="business" isOwner />
      <BusinessForm org={{ name: ctx.org.name, business_type: ctx.org.business_type, timezone: ctx.org.timezone, currency: ctx.settings.currency || ctx.org.currency }} orgCount={ctx.organizations.length} />
    </div>
  );
}
