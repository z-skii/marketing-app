"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorText, Field } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { metersToFeet } from "@/lib/calc/geo";
import { saveClockInAction } from "@/app/(app)/settings/actions";

export function ClockInForm({ values, storesWithOwnRadius }: {
  values: { default_geofence_radius_m: number; allow_clock_in_without_photo: boolean; allow_clock_in_outside_radius: boolean };
  storesWithOwnRadius: Array<{ name: string; radius_m: number }>;
}) {
  const [state, action, pending] = useActionState(saveClockInAction, null);
  const [radius, setRadius] = useState(Math.round(metersToFeet(values.default_geofence_radius_m) / 25) * 25 || 250);
  const router = useRouter();
  const toast = useToast();
  const handled = useRef<unknown>(null);
  useEffect(() => { if (state?.ok && handled.current !== state) { handled.current = state; toast.push("Clock-in settings saved", "success"); router.refresh(); } }, [state, router, toast]);
  return (
    <form action={action} className="card p-4 space-y-4 max-w-xl">
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <Field label="Default GPS radius" hint="feet from the store">
        <div className="flex items-center gap-3">
          <input type="range" name="radius_ft" min={50} max={1500} step={25} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
          <span className="tnum w-16 text-right font-medium">{radius} ft</span>
        </div>
        <p className="text-[12px] text-text-3 mt-1">≈ {Math.round(radius / 3.28084)} m. GPS accuracy (up to 50 m) is added on top, so a phone standing inside the store is never rejected.</p>
      </Field>
      {storesWithOwnRadius.length > 0 && (
        <p className="text-[12px] text-text-3">Stores with their own radius (edit on the store page): {storesWithOwnRadius.map((s) => `${s.name} (${Math.round(metersToFeet(s.radius_m))} ft)`).join(", ")}.</p>
      )}
      <Checkbox name="require_photo" defaultChecked={!values.allow_clock_in_without_photo} label="Require a live photo to clock in" description="Off: clock-ins without a photo are allowed but flagged for review." />
      <Checkbox name="block_outside" defaultChecked={!values.allow_clock_in_outside_radius} label="Block clock-ins outside the radius" description="Off: outside-radius clock-ins are allowed but flagged and managers are notified." />
      <div className="flex justify-end"><Button type="submit" loading={pending}>Save changes</Button></div>
    </form>
  );
}
