import type { Metadata } from "next";
import { requireOwnerContext } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { ClockInForm } from "@/components/settings/clock-in-form";

export const metadata: Metadata = { title: "Clock-in settings" };

export default async function ClockInSettingsPage() {
  const ctx = await requireOwnerContext();
  const s = ctx.settings;
  return (
    <div>
      <PageHeader title="Settings" description="Verified Shift: GPS radius and photo rules that apply to every store unless a store overrides them." />
      <SettingsTabs active="clock-in" isOwner />
      <ClockInForm
        values={{ default_geofence_radius_m: s.default_geofence_radius_m, allow_clock_in_without_photo: s.allow_clock_in_without_photo, allow_clock_in_outside_radius: s.allow_clock_in_outside_radius }}
        storesWithOwnRadius={ctx.locations.filter((l) => l.geofence_radius_m != null).map((l) => ({ name: l.name, radius_m: l.geofence_radius_m as number }))}
      />
    </div>
  );
}
