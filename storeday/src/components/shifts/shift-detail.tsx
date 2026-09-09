"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ImageOff, Pencil, Square } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/modal";
import { KV } from "@/components/ui/stat";
import { useToast } from "@/components/ui/toast";
import { formatDistance } from "@/lib/calc/geo";
import { formatMoney } from "@/lib/utils/currency";
import { formatDateTime, formatLongDate, formatMinutes, formatTime } from "@/lib/utils/time";
import { managerClockOutAction } from "@/app/(app)/shifts/actions";
import { AdjustShiftModal } from "./adjust-shift-modal";
import { LiveElapsed } from "./live-timer";
import { FlagBadges, VerificationBadge, verificationHint } from "./verification-badge";

export interface ShiftDetailProps {
  shift: {
    id: string; status: string; verification_status: string; business_date: string; clock_in_at: string; clock_out_at: string | null;
    break_minutes: number; worked_minutes: number | null; hourly_rate_snapshot: number | null; labor_cost: number | null; source: string; note: string | null;
    employee_id: string; employee_name: string; location_id: string; location_name: string; timezone: string;
    store_lat: number | null; store_lng: number | null; store_address: string | null; radius_m: number;
  };
  verifications: Array<{
    id: string; kind: "clock_in" | "clock_out"; recorded_at: string; latitude: number | null; longitude: number | null; accuracy_m: number | null;
    distance_m: number | null; radius_m: number | null; within_radius: boolean | null; status: string; flags: string[]; device_info: Record<string, unknown>; photo_id: string | null;
  }>;
  photos: Array<{ id: string; kind: "clock_in" | "clock_out"; url: string | null; taken_at: string; bytes: number | null }>;
  adjustments: Array<{
    id: string; created_at: string; by: string; reason: string; original_clock_in: string | null; original_clock_out: string | null;
    new_clock_in: string | null; new_clock_out: string | null; original_minutes: number | null; new_minutes: number | null;
  }>;
  isManager: boolean;
  canEdit: boolean;
  isSelf: boolean;
  currency: string;
}

function mapsLink(lat: number | null | undefined, lng: number | null | undefined): string | null {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** "iPhone · Safari (PWA)" from stored device info. Nothing fancy, no fingerprinting. */
export function summarizeDevice(info: Record<string, unknown>): string {
  const ua = String(info.userAgent ?? "");
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : String(info.platform ?? "Unknown device");
  const browser = /CriOS|Chrome/.test(ua) && !/Edg/.test(ua) ? "Chrome" : /Edg/.test(ua) ? "Edge" : /FxiOS|Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "";
  const parts = [os, browser].filter(Boolean).join(" · ");
  const extra = [info.standalone ? "home screen app" : null, info.screen ? String(info.screen) : null, info.by === "manager" ? "by manager" : null].filter(Boolean).join(", ");
  return extra ? `${parts} (${extra})` : parts || "—";
}

export function ShiftDetail({ shift, verifications, photos, adjustments, isManager, canEdit, isSelf, currency }: ShiftDetailProps) {
  const router = useRouter();
  const toast = useToast();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [outPending, startOut] = useTransition();
  const tz = shift.timezone;
  const active = shift.status === "active";

  const clockOutNow = () => startOut(async () => {
    const r = await managerClockOutAction(shift.id);
    if (r.ok) { toast.push("Shift clocked out", "success"); setConfirmOut(false); router.refresh(); }
    else toast.push(r.error, "danger");
  });

  const byKind = (k: "clock_in" | "clock_out") => verifications.find((v) => v.kind === k) ?? null;
  const photoFor = (v: { photo_id: string | null; kind: "clock_in" | "clock_out" }) => photos.find((p) => p.id === v.photo_id) ?? photos.find((p) => p.kind === v.kind) ?? null;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        back={isManager ? { href: "/working", label: "Who's Working" } : { href: "/my/hours", label: "My hours" }}
        title={<span className="flex items-center gap-2 flex-wrap">{shift.employee_name} <StatusBadge kind="shift" value={shift.status} /><VerificationBadge status={shift.verification_status} /></span>}
        description={<>{shift.location_name} · {formatLongDate(shift.business_date)}{isManager && <> · <Link href={`/employees/${shift.employee_id}`} className="text-accent">Employee profile</Link></>}</>}
        actions={isManager ? (
          <>
            {canEdit && <Button variant="secondary" onClick={() => setAdjustOpen(true)}><Pencil className="h-3.5 w-3.5" />Correct hours</Button>}
            {active && <Button variant="danger" onClick={() => setConfirmOut(true)}><Square className="h-3.5 w-3.5" />Clock out now</Button>}
          </>
        ) : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader title="Times" description={`Store time · ${tz}`} />
          <CardBody>
            <div className="divide-y divide-border">
              <KV label="Clock in" value={formatTime(shift.clock_in_at, tz)} />
              <KV label="Clock out" value={active ? <span className="text-success">Still working · <LiveElapsed from={shift.clock_in_at} breakMinutes={shift.break_minutes} /></span> : formatTime(shift.clock_out_at, tz)} />
              <KV label="Break" value={formatMinutes(shift.break_minutes)} />
              <KV label="Duration" value={active ? "—" : formatMinutes(shift.worked_minutes)} strong />
              {isManager && (
                <>
                  <KV label="Rate" value={shift.hourly_rate_snapshot != null ? `${formatMoney(shift.hourly_rate_snapshot, { currency })}/h` : "No rate set"} />
                  <KV label="Labor cost" value={active ? "—" : formatMoney(shift.labor_cost, { currency })} />
                </>
              )}
              <KV label="Source" value={shift.source === "manual" ? "Manual entry" : "Clock in / out"} />
            </div>
            {shift.note && <p className="mt-2 text-[13px] text-text-2"><span className="text-text-3">Note:</span> {shift.note}</p>}
            {verificationHint(shift.verification_status) && <p className="mt-2 text-[12.5px] text-text-3">{verificationHint(shift.verification_status)}</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Store" description={shift.store_address ?? undefined} />
          <CardBody>
            <div className="divide-y divide-border">
              <KV label="Store" value={shift.location_name} />
              <KV label="Clock-in radius" value={formatDistance(shift.radius_m)} />
              <KV label="Map" value={mapsLink(shift.store_lat, shift.store_lng) ? <a className="inline-flex items-center gap-1 text-accent" href={mapsLink(shift.store_lat, shift.store_lng)!} target="_blank" rel="noopener noreferrer">Open in Maps <ExternalLink className="h-3 w-3" /></a> : <span className="text-text-3">No coordinates set</span>} />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {(["clock_in", "clock_out"] as const).map((kind) => {
          const v = byKind(kind);
          const photo = v ? photoFor(v) : photos.find((p) => p.kind === kind) ?? null;
          return (
            <Card key={kind}>
              <CardHeader title={kind === "clock_in" ? "Clock-in verification" : "Clock-out verification"} action={v ? <VerificationBadge status={v.status} /> : null} />
              <CardBody>
                {!v ? (
                  <div className="text-[13px] text-text-3">{kind === "clock_out" && active ? "Not clocked out yet." : shift.source === "manual" ? "Manual entry — no verification recorded." : "No verification recorded."}</div>
                ) : (
                  <div className="space-y-3">
                    <PhotoView photo={photo} />
                    <div className="divide-y divide-border">
                      <KV label="Recorded" value={formatDateTime(v.recorded_at, tz)} />
                      <KV label="Distance from store" value={v.distance_m == null ? <span className="text-warn">No location</span> : <span className={v.within_radius ? "text-success" : "text-warn"}>{formatDistance(v.distance_m)}{v.within_radius ? " · inside" : " · outside"}</span>} />
                      <KV label="GPS accuracy" value={v.accuracy_m == null ? "—" : `±${formatDistance(v.accuracy_m)}`} />
                      <KV label="Radius used" value={formatDistance(v.radius_m)} />
                      <KV label="Position" value={mapsLink(v.latitude, v.longitude) ? <a className="inline-flex items-center gap-1 text-accent" href={mapsLink(v.latitude, v.longitude)!} target="_blank" rel="noopener noreferrer">Open in Maps <ExternalLink className="h-3 w-3" /></a> : "—"} />
                      <KV label="Device" value={<span className="text-[12.5px] font-normal text-text-2">{summarizeDevice(v.device_info)}</span>} />
                    </div>
                    {v.flags.length > 0 && <div className="flex items-center gap-2 flex-wrap"><span className="text-[12px] text-text-3">Flags</span><FlagBadges flags={v.flags} /></div>}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card className="mt-3">
        <CardHeader title="Corrections" description="Every change to the times is recorded with who did it and why." />
        <CardBody>
          {adjustments.length === 0 ? (
            <div className="text-[13px] text-text-3">No corrections.</div>
          ) : (
            <ul className="divide-y divide-border">
              {adjustments.map((a) => (
                <li key={a.id} className="py-2 text-[13px]">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium">{a.by}</span>
                    <span className="text-text-3 text-[12px]">{formatDateTime(a.created_at, tz)}</span>
                  </div>
                  <div className="mt-0.5 text-text-2 tnum">
                    {formatTime(a.original_clock_in, tz)} – {formatTime(a.original_clock_out, tz)} ({formatMinutes(a.original_minutes)})
                    <span className="mx-1.5 text-text-3">→</span>
                    {formatTime(a.new_clock_in, tz)} – {a.new_clock_out ? formatTime(a.new_clock_out, tz) : "open"} ({formatMinutes(a.new_minutes)})
                  </div>
                  <div className="mt-0.5 text-text-2">“{a.reason}”</div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {isSelf && !isManager && shift.verification_status !== "verified" && shift.verification_status !== "manager_adjusted" && (
        <p className="mt-3 text-[12.5px] text-text-3">Something look wrong? Ask your manager to correct this shift — they can fix the times with a note.</p>
      )}

      {canEdit && <AdjustShiftModal open={adjustOpen} onClose={() => setAdjustOpen(false)} shift={shift} timezone={tz} />}
      <ConfirmDialog open={confirmOut} onClose={() => setConfirmOut(false)} onConfirm={clockOutNow} title="Clock out now?" confirmLabel="Clock out" tone="danger" loading={outPending}>
        <div className="space-y-2">
          <p>{shift.employee_name} will be clocked out at the current time (<b>{formatTime(new Date(), tz)}</b>, store time). Nothing is estimated.</p>
          <Alert tone="warn">No photo or location is captured for a manager clock-out, so the shift will be marked <b>Missing photo</b>. If they actually left earlier, use “Correct hours” afterwards.</Alert>
        </div>
      </ConfirmDialog>

      {photos.length > 0 && photos.every((p) => !p.url) && <Alert tone="warn" className="mt-3">Photos exist but could not be loaded. You may not have access, or the storage bucket policy is missing.</Alert>}
    </div>
  );
}

function PhotoView({ photo }: { photo: { url: string | null; taken_at: string; bytes: number | null } | null }) {
  if (!photo) {
    return <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-[13px] text-text-3"><ImageOff className="h-4 w-4" />No photo</div>;
  }
  if (!photo.url) {
    return <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-[13px] text-text-3"><ImageOff className="h-4 w-4" />Photo unavailable</div>;
  }
  return (
    <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-border bg-surface-2">
      {/* Signed Supabase URLs are short-lived, so next/image optimization is not useful here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="Verification photo" className="w-full max-h-72 object-contain bg-black/80" loading="lazy" />
      <div className="px-2 py-1 text-[11px] text-text-3 flex items-center justify-between"><span>Live photo</span>{photo.bytes != null && <Badge>{Math.round(photo.bytes / 1024)} KB</Badge>}</div>
    </a>
  );
}
