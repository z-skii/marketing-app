import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/utils/time";
import type { Json } from "@/types/database";

export const runtime = "nodejs";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function num(v: FormDataEntryValue | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Sniff the image type from magic bytes. Never trust the client's content type. */
function detectImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (bytes.length > 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return { mime: "image/webp", ext: "webp" };
  return null;
}

function parseDevice(raw: FormDataEntryValue | null): Json {
  if (typeof raw !== "string" || !raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      // Keep it small: only primitive values, capped length.
      const out: Record<string, Json> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 20)) {
        if (typeof val === "string") out[k] = val.slice(0, 300);
        else if (typeof val === "number" || typeof val === "boolean" || val === null) out[k] = val;
      }
      return out;
    }
  } catch { /* ignore malformed device json */ }
  return {};
}

/**
 * POST multipart/form-data:
 *   action=in|out, location_id (in) | shift_id (out), latitude, longitude, accuracy, photo (JPEG/PNG/WebP bytes), device (JSON)
 * Photos are accepted as bytes only — never as a URL — hashed server-side (sha256) for repeat detection,
 * uploaded under the user's own session (storage RLS), then clock_in/clock_out RPCs record everything with server timestamps.
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("Not signed in", 401);

  let form: FormData;
  try { form = await req.formData(); } catch { return bad("Expected multipart form data"); }

  const action = String(form.get("action") ?? "");
  if (action !== "in" && action !== "out") return bad("action must be 'in' or 'out'");
  const latitude = num(form.get("latitude"));
  const longitude = num(form.get("longitude"));
  const accuracy = num(form.get("accuracy"));
  if ((latitude == null) !== (longitude == null)) return bad("latitude and longitude must be sent together");
  if (latitude != null && (Math.abs(latitude) > 90 || Math.abs(longitude ?? 0) > 180)) return bad("Invalid coordinates");
  const device = parseDevice(form.get("device"));

  // Resolve organization / location / employee under RLS (the user can only see what they may access).
  let organizationId: string, locationId: string, employeeId: string, timezone: string, shiftId: string | null = null;
  if (action === "in") {
    locationId = String(form.get("location_id") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(locationId)) return bad("location_id is required");
    const { data: loc } = await supabase.from("locations").select("id, organization_id, timezone").eq("id", locationId).maybeSingle();
    if (!loc) return bad("Store not found or not assigned to you", 404);
    const { data: emp } = await supabase.from("employees").select("id, employment_status").eq("organization_id", loc.organization_id).eq("user_id", user.id).maybeSingle();
    if (!emp) return bad("You are not set up as an employee of this business", 403);
    if (emp.employment_status !== "active") return bad("Your employee record is not active", 403);
    organizationId = loc.organization_id; timezone = loc.timezone; employeeId = emp.id;
  } else {
    shiftId = String(form.get("shift_id") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(shiftId)) return bad("shift_id is required");
    const { data: shift } = await supabase.from("shifts").select("id, organization_id, location_id, employee_id, status, locations(timezone)").eq("id", shiftId).maybeSingle();
    if (!shift) return bad("Shift not found", 404);
    if (shift.status !== "active") return bad("This shift is already closed");
    organizationId = shift.organization_id; locationId = shift.location_id; employeeId = shift.employee_id;
    timezone = (shift.locations as { timezone: string } | null)?.timezone ?? "UTC";
  }

  // Photo: bytes only.
  let photoPath: string | undefined, photoHash: string | undefined, photoBytes: number | undefined;
  const photo = form.get("photo");
  if (photo && typeof photo !== "string" && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return bad("Photo is too large (max 8 MB)", 413);
    const buf = Buffer.from(await photo.arrayBuffer());
    const kind = detectImage(buf);
    if (!kind) return bad("Photo must be a JPEG, PNG or WebP image", 415);
    photoHash = createHash("sha256").update(buf).digest("hex");
    photoBytes = buf.byteLength;
    const day = todayIn(timezone);
    photoPath = `${organizationId}/${locationId}/${employeeId}/${day}/${action}-${Date.now()}.${kind.ext}`;
    const { error: upErr } = await supabase.storage.from("shift-photos").upload(photoPath, buf, { contentType: kind.mime, upsert: false, cacheControl: "31536000" });
    if (upErr) return bad(`Could not save the photo: ${upErr.message}`, 500);
  } else if (photo && typeof photo === "string") {
    return bad("Photo must be sent as image bytes");
  }

  const common = { p_latitude: latitude, p_longitude: longitude, p_accuracy_m: accuracy, p_photo_path: photoPath, p_photo_hash: photoHash, p_photo_bytes: photoBytes, p_device: device };
  const { data: shift, error } = action === "in"
    ? await supabase.rpc("clock_in", { p_location_id: locationId, ...common })
    : await supabase.rpc("clock_out", { p_shift_id: shiftId as string, ...common });
  if (error) {
    // Best effort: don't leave an orphan photo when the clock action was rejected.
    if (photoPath) await supabase.storage.from("shift-photos").remove([photoPath]).catch(() => {});
    const msg = error.message.replace(/^.*?:\s*(?=[A-Z])/, "");
    const status = /not authenticated/i.test(msg) ? 401 : /not allowed|not assigned|not an employee/i.test(msg) ? 403 : 400;
    return bad(msg, status);
  }
  return NextResponse.json({ ok: true, shift });
}
