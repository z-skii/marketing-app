"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Select } from "@/components/ui/form";
import { COMMON_TIMEZONES } from "@/lib/utils/time";
import { geocodeAction } from "@/app/(app)/stores/actions";
import type { ActionResult } from "@/lib/action-result";
import { metersToFeet } from "@/lib/calc/geo";

export interface LocationFormValues {
  id?: string; name?: string; address_line1?: string | null; city?: string | null; state?: string | null; postal_code?: string | null;
  phone?: string | null; timezone?: string; latitude?: number | null; longitude?: number | null; geofence_radius_m?: number | null;
}

export function LocationForm({ action, initial, defaultTimezone, submitLabel, onDone }: {
  action: (prev: ActionResult<{ id: string }> | null, fd: FormData) => Promise<ActionResult<{ id: string }>> | Promise<ActionResult>;
  initial?: LocationFormValues; defaultTimezone: string; submitLabel: string; onDone?: (id?: string) => void;
}) {
  const [state, formAction, pending] = useActionState(action as (p: ActionResult<{ id: string }> | null, fd: FormData) => Promise<ActionResult<{ id: string }>>, null);
  const [lat, setLat] = useState<string>(initial?.latitude != null ? String(initial.latitude) : "");
  const [lng, setLng] = useState<string>(initial?.longitude != null ? String(initial.longitude) : "");
  const [addr, setAddr] = useState({ address_line1: initial?.address_line1 ?? "", city: initial?.city ?? "", state: initial?.state ?? "", postal_code: initial?.postal_code ?? "" });
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [geoPending, startGeo] = useTransition();

  useEffect(() => { if (state?.ok) onDone?.(state.data?.id); }, [state, onDone]);

  const lookup = () => startGeo(async () => {
    setGeoMsg(null);
    const r = await geocodeAction([addr.address_line1, addr.city, addr.state, addr.postal_code].filter(Boolean).join(", "));
    if (r.ok) { setLat(r.data.latitude.toFixed(6)); setLng(r.data.longitude.toFixed(6)); setGeoMsg(`Found: ${r.data.display_name}`); }
    else setGeoMsg(r.error);
  });
  const useCurrent = () => {
    if (!navigator.geolocation) { setGeoMsg("Geolocation is not available in this browser."); return; }
    setGeoMsg("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); setGeoMsg(`Using your current location (±${Math.round(p.coords.accuracy)} m).`); },
      (e) => setGeoMsg(e.message), { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <form action={formAction} className="space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <Field label="Store name"><Input name="name" required defaultValue={initial?.name ?? ""} placeholder="e.g. Mr Tobacco" autoFocus /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Street address" className="sm:col-span-2"><Input name="address_line1" value={addr.address_line1} onChange={(e) => setAddr({ ...addr, address_line1: e.target.value })} placeholder="310 S Bickett Blvd" /></Field>
        <Field label="City"><Input name="city" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="State"><Input name="state" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} /></Field>
          <Field label="ZIP"><Input name="postal_code" value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })} /></Field>
        </div>
        <Field label="Phone"><Input name="phone" type="tel" defaultValue={initial?.phone ?? ""} /></Field>
        <Field label="Timezone"><Select name="timezone" defaultValue={initial?.timezone ?? defaultTimezone}>{Array.from(new Set([initial?.timezone ?? defaultTimezone, ...COMMON_TIMEZONES])).map((tz) => <option key={tz} value={tz}>{tz}</option>)}</Select></Field>
      </div>
      <div className="rounded-md border border-border bg-surface-2/50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[12.5px] font-medium">Store coordinates <span className="text-text-3 font-normal">(for Verified Shift)</span></div>
          <div className="flex gap-1.5">
            <Button type="button" size="sm" variant="secondary" onClick={lookup} loading={geoPending}><Search className="h-3.5 w-3.5" />Look up address</Button>
            <Button type="button" size="sm" variant="secondary" onClick={useCurrent}><LocateFixed className="h-3.5 w-3.5" />Use my location</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"><Input name="latitude" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="36.099" inputMode="decimal" /></Field>
          <Field label="Longitude"><Input name="longitude" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-78.301" inputMode="decimal" /></Field>
        </div>
        {geoMsg && <p className="text-[12px] text-text-2">{geoMsg}</p>}
        {!lat && <p className="text-[12px] text-text-3">Leave blank to geocode from the address automatically on save.</p>}
      </div>
      <Field label="Clock-in radius override" hint="feet · blank = business default">
        <Input name="geofence_radius_ft" type="number" min={30} step={5} className="w-40" defaultValue={initial?.geofence_radius_m ? Math.round(metersToFeet(initial.geofence_radius_m)) : ""} />
      </Field>
      <Button type="submit" size="lg" block loading={pending}>{submitLabel}</Button>
    </form>
  );
}
