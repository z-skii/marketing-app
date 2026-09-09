"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { CalendarClock, ChevronDown, MapPin, MapPinOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { KV } from "@/components/ui/stat";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { distanceMeters, formatDistance, isWithinRadius } from "@/lib/calc/geo";
import { businessDateOf, formatMinutes, formatShortDate, formatTime, formatWeekdayDate, todayIn, addISODays } from "@/lib/utils/time";
import { CameraCapture, deviceInfo } from "./camera-capture";
import { LiveTimer, useNow } from "./live-timer";
import { VerificationBadge, verificationHint } from "./verification-badge";

export interface ClockLocation {
  id: string; name: string; address: string | null; latitude: number | null; longitude: number | null; timezone: string; radius_m: number;
}
export interface ClockShift {
  id: string; location_id: string; location_name: string; timezone: string; clock_in_at: string; clock_out_at: string | null;
  status: string; verification_status: string; worked_minutes: number | null; break_minutes: number;
}
export interface NextShift { id: string; starts_at: string; ends_at: string; location_name: string; timezone: string }

interface Props {
  employeeName: string;
  locations: ClockLocation[];
  activeShift: ClockShift | null;
  todayShifts: ClockShift[];
  nextShift: NextShift | null;
  allowWithoutPhoto: boolean;
  allowOutsideRadius: boolean;
}

type Position = { lat: number; lng: number; accuracy: number; at: number };
type GeoStatus = "pending" | "ok" | "denied" | "unavailable" | "unsupported";

function useWatchPosition(): { pos: Position | null; status: GeoStatus } {
  const [pos, setPos] = useState<Position | null>(null);
  const [status, setStatus] = useState<GeoStatus>("pending");
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const t = setTimeout(() => setStatus("unsupported"), 0);
      return () => clearTimeout(t);
    }
    const id = navigator.geolocation.watchPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() }); setStatus("ok"); },
      (e) => { setStatus(e.code === e.PERMISSION_DENIED ? "denied" : "unavailable"); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return { pos, status };
}

type ApiShift = { id: string; location_id: string; clock_in_at: string; clock_out_at: string | null; status: string; verification_status: string; worked_minutes: number | null; break_minutes: number };

export function ClockScreen({ employeeName, locations, activeShift, todayShifts, nextShift, allowWithoutPhoto, allowOutsideRadius }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { pos, status: geoStatus } = useWatchPosition();
  // Local copy of the active shift so the screen updates instantly; re-synced whenever the server sends fresh props.
  const [shift, setShift] = useState<ClockShift | null>(activeShift);
  const [syncedFrom, setSyncedFrom] = useState(activeShift);
  if (activeShift !== syncedFrom) { setSyncedFrom(activeShift); setShift(activeShift); }
  const [manualLocationId, setManualLocationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "camera" | "submitting" | "summary">("idle");
  const [pending, setPending] = useState<"in" | "out">("in");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ClockShift | null>(null);

  // Nearest store wins unless the employee picks one; an active shift pins its store.
  const nearest = useMemo(() => {
    if (!pos) return null;
    let best: { loc: ClockLocation; d: number } | null = null;
    for (const loc of locations) {
      if (loc.latitude == null || loc.longitude == null) continue;
      const d = distanceMeters(pos.lat, pos.lng, loc.latitude, loc.longitude);
      if (!best || d < best.d) best = { loc, d };
    }
    return best?.loc ?? null;
  }, [pos, locations]);
  const location = useMemo(() => {
    if (shift) return locations.find((l) => l.id === shift.location_id) ?? null;
    if (manualLocationId) return locations.find((l) => l.id === manualLocationId) ?? null;
    return nearest ?? locations[0] ?? null;
  }, [shift, manualLocationId, nearest, locations]);

  const tz = location?.timezone ?? shift?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = useNow(1000);
  const distance = pos && location?.latitude != null && location.longitude != null ? distanceMeters(pos.lat, pos.lng, location.latitude, location.longitude) : null;
  const within = distance != null && location ? isWithinRadius(distance, location.radius_m, pos?.accuracy ?? 0) : null;
  const locationKnown = geoStatus === "ok" && distance != null;
  const outside = locationKnown && within === false;
  const noLocation = geoStatus === "denied" || geoStatus === "unavailable" || geoStatus === "unsupported" || (geoStatus === "ok" && distance == null);
  const blocked = !shift && !allowOutsideRadius && (outside || noLocation);
  // Don't let someone clock in with no coordinates just because GPS hasn't answered yet (watchPosition times out after 20s).
  const waitingForLocation = !shift && geoStatus === "pending" && location?.latitude != null;

  const submit = async (action: "in" | "out", photo: Blob | null) => {
    if (action === "in" && !location) return;
    if (action === "out" && !shift) return;
    setPhase("submitting");
    setError(null);
    try {
      const fd = new FormData();
      fd.set("action", action);
      if (action === "in") fd.set("location_id", location!.id); else fd.set("shift_id", shift!.id);
      if (pos && geoStatus === "ok") { fd.set("latitude", String(pos.lat)); fd.set("longitude", String(pos.lng)); fd.set("accuracy", String(Math.round(pos.accuracy))); }
      if (photo) fd.set("photo", photo, "photo.jpg");
      fd.set("device", JSON.stringify(deviceInfo()));
      const res = await fetch("/api/shifts/clock", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({ ok: false, error: "Unexpected server response" }))) as { ok: boolean; shift?: ApiShift; error?: string };
      if (!json.ok || !json.shift) throw new Error(json.error ?? "Could not save");
      const s = json.shift;
      const loc = locations.find((l) => l.id === s.location_id);
      const mapped: ClockShift = {
        id: s.id, location_id: s.location_id, location_name: loc?.name ?? shift?.location_name ?? "Store", timezone: loc?.timezone ?? tz,
        clock_in_at: s.clock_in_at, clock_out_at: s.clock_out_at, status: s.status, verification_status: s.verification_status,
        worked_minutes: s.worked_minutes, break_minutes: s.break_minutes,
      };
      if (action === "in") {
        setShift(mapped);
        setPhase("idle");
        toast.push(`Clocked in at ${formatTime(s.clock_in_at, mapped.timezone)}`, "success");
      } else {
        setShift(null);
        setSummary(mapped);
        setPhase("summary");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("idle");
    }
  };

  const start = (action: "in" | "out") => { setPending(action); setError(null); setPhase("camera"); };

  return (
    <div className="max-w-md mx-auto space-y-3 pb-4">
      {/* Store + clock */}
      <Card className="px-4 pt-4 pb-3 text-center">
        {location ? (
          <>
            {locations.length > 1 && !shift ? (
              <label className="relative inline-flex items-center justify-center gap-1 max-w-full">
                <select
                  aria-label="Store"
                  value={location.id}
                  onChange={(e) => setManualLocationId(e.target.value)}
                  className="appearance-none bg-transparent text-[20px] font-semibold tracking-tight text-center pr-6 max-w-full truncate focus:outline-none"
                >
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <ChevronDown className="absolute right-0 h-4 w-4 text-text-3 pointer-events-none" />
              </label>
            ) : (
              <div className="text-[20px] font-semibold tracking-tight truncate">{location.name}</div>
            )}
            {location.address && <div className="text-[12.5px] text-text-3 truncate">{location.address}</div>}
          </>
        ) : (
          <div className="text-[16px] font-semibold">No store assigned</div>
        )}
        <div className="mt-3 text-[13px] text-text-2" suppressHydrationWarning>{formatWeekdayDate(todayIn(tz, now))}</div>
        <div className="tnum text-[40px] font-semibold leading-none tracking-tight mt-1" suppressHydrationWarning>{format(new TZDate(now, tz), "h:mm:ss")}<span className="text-[18px] font-medium text-text-3 ml-1.5" suppressHydrationWarning>{format(new TZDate(now, tz), "a")}</span></div>
        <LocationLine geoStatus={geoStatus} distance={distance} within={within} hasCoords={location?.latitude != null && location?.longitude != null} accuracy={pos?.accuracy ?? null} />
      </Card>

      {error && <Alert tone="danger" title="Not saved">{error}</Alert>}

      {phase === "summary" && summary ? (
        <Card className="p-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3">Shift complete</div>
          <div className="text-[18px] font-semibold">{summary.location_name}</div>
          <div className="divide-y divide-border">
            <KV label="Clock in" value={formatTime(summary.clock_in_at, summary.timezone)} />
            <KV label="Clock out" value={formatTime(summary.clock_out_at, summary.timezone)} />
            {summary.break_minutes > 0 && <KV label="Break" value={formatMinutes(summary.break_minutes)} />}
            <KV label="Total" value={formatMinutes(summary.worked_minutes)} strong />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <VerificationBadge status={summary.verification_status} />
            <Link href={`/shifts/${summary.id}`} className="text-[13px] text-accent">View shift</Link>
          </div>
          {verificationHint(summary.verification_status) && <p className="text-[12.5px] text-text-3">{verificationHint(summary.verification_status)}</p>}
          <Button size="xl" block variant="secondary" onClick={() => { setSummary(null); setPhase("idle"); }}>Done</Button>
        </Card>
      ) : shift ? (
        <Card className="p-4 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-success"><span className="h-2 w-2 rounded-full bg-success animate-pulse" />Shift active</div>
          <LiveTimer from={shift.clock_in_at} className="block text-[44px] font-semibold leading-none tracking-tight" />
          <div className="text-[13.5px] text-text-2">Clocked in {formatTime(shift.clock_in_at, shift.timezone)} · {shift.location_name}</div>
          <div className="flex flex-col items-center gap-1">
            <VerificationBadge status={shift.verification_status} />
            {verificationHint(shift.verification_status) && shift.verification_status !== "verified" && <p className="text-[12px] text-text-3 max-w-xs">{verificationHint(shift.verification_status)}</p>}
          </div>
          {outside && <Alert tone="warn">You&apos;re {formatDistance(distance)} from the store. Your clock-out will be flagged for review.</Alert>}
          <Button size="xl" block variant="danger" className="h-16 text-[18px]" onClick={() => start("out")} loading={phase === "submitting"}>
            <Camera className="h-5 w-5" />Clock out
          </Button>
        </Card>
      ) : (
        <Card className="p-4 space-y-3">
          {blocked ? (
            <Alert tone="danger" title={noLocation ? "Location is required to clock in" : "You must be at the store to clock in"}>
              {noLocation ? "Turn on location for this site (Settings → Privacy → Location) and reload." : `You're ${formatDistance(distance)} away; the store radius is ${formatDistance(location?.radius_m)}. Move closer and try again.`}
            </Alert>
          ) : outside ? (
            <Alert tone="warn">You&apos;re {formatDistance(distance)} from the store (radius {formatDistance(location?.radius_m)}). You can still clock in, but it will be flagged for a manager to review.</Alert>
          ) : noLocation ? (
            <Alert tone="warn">Your location is off, so this clock-in can&apos;t be verified and will be flagged for review. Turn on location for this site to get a Verified ✓ shift.</Alert>
          ) : location && location.latitude == null ? (
            <Alert tone="warn">This store has no map coordinates yet, so location can&apos;t be verified. Ask your manager to set the store address.</Alert>
          ) : null}
          <Button size="xl" block className="h-16 text-[18px]" onClick={() => start("in")} disabled={!location || blocked || waitingForLocation} loading={phase === "submitting"}>
            <Camera className="h-5 w-5" />{waitingForLocation ? "Finding your location…" : "Clock in"}
          </Button>
          <p className="text-center text-[12px] text-text-3">Takes a live photo and records your location. Hi {employeeName}.</p>
        </Card>
      )}

      {/* Today */}
      <Card className="p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-2">Today</div>
        {todayShifts.length === 0 && !shift ? (
          <div className="text-[13px] text-text-3">No shifts yet today.</div>
        ) : (
          <ul className="divide-y divide-border">
            {shift && (
              <li className="py-2 flex items-center justify-between gap-3 text-[13.5px]">
                <div className="min-w-0"><div className="font-medium truncate">{shift.location_name}</div><div className="text-text-3 text-[12.5px]">{formatTime(shift.clock_in_at, shift.timezone)} – now</div></div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-success">Working</span>
              </li>
            )}
            {todayShifts.map((s) => (
              <li key={s.id}>
                <Link href={`/shifts/${s.id}`} className="py-2 flex items-center justify-between gap-3 text-[13.5px]">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.location_name}</div>
                    <div className="text-text-3 text-[12.5px]">{formatTime(s.clock_in_at, s.timezone)} – {formatTime(s.clock_out_at, s.timezone)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="tnum font-semibold">{formatMinutes(s.worked_minutes)}</div>
                    <VerificationBadge status={s.verification_status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Next shift */}
      <Card className="p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-2 flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />Next shift</div>
        {nextShift ? (
          <Link href="/my/schedule" className="block">
            <div className="text-[15px] font-semibold">{dayLabel(nextShift.starts_at, nextShift.timezone)} · {formatTime(nextShift.starts_at, nextShift.timezone)} – {formatTime(nextShift.ends_at, nextShift.timezone)}</div>
            <div className="text-[13px] text-text-2">{nextShift.location_name}</div>
          </Link>
        ) : (
          <div className="text-[13px] text-text-3">Nothing scheduled. <Link href="/my/schedule" className="text-accent">See schedule</Link></div>
        )}
      </Card>

      {phase === "camera" || phase === "submitting" ? (
          <CameraCapture
            title={pending === "in" ? `Clock in · ${location?.name ?? ""}` : `Clock out · ${shift?.location_name ?? ""}`}
            busy={phase === "submitting"}
            busyLabel={pending === "in" ? "Clocking you in…" : "Clocking you out…"}
            hint={pending === "in" ? "Point the camera at the store or register" : "One more photo to close your shift"}
            onCapture={(blob) => submit(pending, blob)}
            onCancel={() => setPhase("idle")}
            renderFallback={(failure) => (
              allowWithoutPhoto ? (
                <div className="space-y-2">
                  <Alert tone="warn">Without a photo this {pending === "in" ? "clock-in" : "clock-out"} will be marked <b>Missing photo</b> and flagged for a manager to review.</Alert>
                  <Button type="button" size="lg" block variant="secondary" onClick={() => submit(pending, null)}>{pending === "in" ? "Clock in without photo" : "Clock out without photo"}</Button>
                </div>
              ) : (
                <Alert tone="danger">A live photo is required to {pending === "in" ? "clock in" : "clock out"} at this business. {failure === "denied" ? "Allow camera access and try again." : "Use a phone with a camera, or ask a manager to record your shift."}</Alert>
              )
            )}
          />
      ) : null}
    </div>
  );
}

function LocationLine({ geoStatus, distance, within, hasCoords, accuracy }: { geoStatus: GeoStatus; distance: number | null; within: boolean | null; hasCoords: boolean; accuracy: number | null }) {
  let icon = <MapPin className="h-4 w-4" />, text = "", cls = "text-text-2";
  if (geoStatus === "pending") { text = "Finding your location…"; cls = "text-text-3"; }
  else if (geoStatus === "denied") { icon = <MapPinOff className="h-4 w-4" />; text = "Location off"; cls = "text-warn"; }
  else if (geoStatus === "unsupported" || geoStatus === "unavailable") { icon = <MapPinOff className="h-4 w-4" />; text = "Location unavailable"; cls = "text-warn"; }
  else if (!hasCoords) { text = "Store location not set"; cls = "text-text-3"; }
  else if (within) { text = "At store ✓"; cls = "text-success"; }
  else { text = `${formatDistance(distance)} from store`; cls = "text-warn"; }
  return (
    <div className={cn("mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-medium", cls)}>
      {icon}{text}
      {geoStatus === "ok" && accuracy != null && accuracy > 150 && <span className="text-[11.5px] font-normal text-text-3">(±{formatDistance(accuracy)})</span>}
    </div>
  );
}

function dayLabel(ts: string, tz: string): string {
  const d = businessDateOf(ts, tz);
  const today = todayIn(tz);
  if (d === today) return "Today";
  if (d === addISODays(today, 1)) return "Tomorrow";
  return formatShortDate(d);
}
