import "server-only";
import { sql, sqlOne, transaction } from "@/lib/db";
import { enqueueJob } from "@/lib/jobs";
import {
  SCAN_ANGLES, SCAN_ANGLE_LABEL,
  type ScanAngle, type ScanCapture, type ScanStatus, type VehicleModelAsset,
  type VehicleRecognition, type VehicleScan,
} from "./types";
import { assessCapture, missingAngles } from "./quality";
import { recognizeVehicle } from "./recognition";
import { reconstructionProvider } from "./reconstruction";

/**
 * The scan pipeline. A scan is created from what the phone captured and then
 * moves through stages in a background job (`vehicle_scan.process`):
 *
 *   queued -> validating -> (needs_retake) -> recognizing -> reconstructing
 *          -> complete, or waiting_provider when no 3D provider is configured
 *
 * Every stage writes status, stage text and a progress percentage so the UI
 * can show the same words the notifications use. Nothing here invents a
 * model or a recognition: with no provider the honest result is null.
 */

export const JOB_PROCESS = "vehicle_scan.process";
export const JOB_POLL = "vehicle_scan.poll";
const POLL_INTERVAL_MS = 60_000;
const RETAKE_THRESHOLD = 75;
const NOTIFY_CATEGORY = "vehicle_scan";

const PROGRESS: Record<ScanStatus, number> = {
  queued: 0,
  validating: 10,
  needs_retake: 25,
  recognizing: 40,
  reconstructing: 60,
  waiting_provider: 60,
  complete: 100,
  failed: 0,
};

const SCAN_SELECT = `
  select s.id, s.vehicle_id, s.owner_id, s.status, s.stage, s.progress, s.capture, s.quality,
         s.recognition, s.model, s.provider, s.external_id, s.error,
         to_jsonb(s.created_at) #>> '{}' as created_at,
         to_jsonb(s.updated_at) #>> '{}' as updated_at
    from vehicle_scans s`;

type ScanRow = VehicleScan & { external_id: string | null };

export function scanPath(scanId: string) {
  return `/me/vehicles/scan/${scanId}`;
}

// ---------------------------------------------------------------- capture

/** Keep only well-formed entries; unknown angles and empty URLs are dropped. */
export function sanitizeCapture(input: Partial<ScanCapture> | null | undefined): ScanCapture {
  const isUrl = (u: unknown): u is string => typeof u === "string" && u.trim().length > 0 && u.length < 2048;
  const photos: ScanCapture["photos"] = [];
  const seen = new Set<ScanAngle>();
  for (const p of input?.photos ?? []) {
    if (!p || !(SCAN_ANGLES as readonly string[]).includes(p.angle) || !isUrl(p.url)) continue;
    if (seen.has(p.angle)) continue;
    seen.add(p.angle);
    photos.push({ angle: p.angle, url: p.url.trim() });
  }
  const detail_photos = (input?.detail_photos ?? [])
    .filter((d) => d && isUrl(d.url))
    .slice(0, 12)
    .map((d) => ({ label: String(d.label ?? "").slice(0, 60), url: d.url.trim() }));
  const video_urls = (input?.video_urls ?? []).filter(isUrl).slice(0, 3).map((u) => u.trim());
  const device = input?.device
    ? {
        user_agent: typeof input.device.user_agent === "string" ? input.device.user_agent.slice(0, 300) : undefined,
        has_depth: typeof input.device.has_depth === "boolean" ? input.device.has_depth : undefined,
      }
    : null;
  return { photos, detail_photos, video_urls, device };
}

/** Photos in walk-around order, front first: what recognition and posters use. */
function orderedPhotoUrls(capture: ScanCapture): string[] {
  const byAngle = new Map(capture.photos.map((p) => [p.angle, p.url] as const));
  return SCAN_ANGLES.map((a) => byAngle.get(a)).filter((u): u is string => Boolean(u));
}

function posterFromCapture(capture: ScanCapture): string | null {
  const byAngle = new Map(capture.photos.map((p) => [p.angle, p.url] as const));
  return byAngle.get("front") ?? byAngle.get("front_left") ?? orderedPhotoUrls(capture)[0] ?? null;
}

// ------------------------------------------------------------------ reads

export async function getScan(id: string, ownerId: string): Promise<VehicleScan | null> {
  const row = await sqlOne<ScanRow>(`${SCAN_SELECT} where s.id = $1 and s.owner_id = $2`, [id, ownerId]);
  return row ? toScan(row) : null;
}

async function loadScan(id: string): Promise<ScanRow | null> {
  return sqlOne<ScanRow>(`${SCAN_SELECT} where s.id = $1`, [id]);
}

export async function listScansForVehicle(vehicleId: string): Promise<VehicleScan[]> {
  const rows = await sql<ScanRow>(`${SCAN_SELECT} where s.vehicle_id = $1 order by s.created_at desc`, [vehicleId]);
  return rows.map(toScan);
}

export async function latestScanForOwner(ownerId: string): Promise<VehicleScan | null> {
  const row = await sqlOne<ScanRow>(
    `${SCAN_SELECT} where s.owner_id = $1 order by s.created_at desc limit 1`,
    [ownerId],
  );
  return row ? toScan(row) : null;
}

function toScan(row: ScanRow): VehicleScan {
  const { external_id: _external, ...scan } = row;
  void _external;
  return { ...scan, progress: Number(scan.progress ?? 0) };
}

// ----------------------------------------------------------------- writes

export async function createScan(
  ownerId: string,
  vehicleId: string | null,
  capture: ScanCapture,
): Promise<VehicleScan> {
  const clean = sanitizeCapture(capture);
  if (vehicleId) {
    const owned = await sqlOne(`select 1 as ok from vehicles where id = $1 and owner_id = $2`, [vehicleId, ownerId]);
    if (!owned) throw new Error("Not your vehicle.");
  }
  const row = await sqlOne<ScanRow>(
    `insert into vehicle_scans (owner_id, vehicle_id, status, stage, progress, capture)
     values ($1, $2, 'queued', 'Queued', 0, $3::jsonb)
     returning id`,
    [ownerId, vehicleId, JSON.stringify(clean)],
  );
  await enqueueJob(JOB_PROCESS, { scanId: row!.id });
  return (await getScan(row!.id, ownerId))!;
}

/** Retake: merge new photos over the old ones by angle and run again. */
export async function addCapture(
  scanId: string,
  ownerId: string,
  morePhotos: ScanCapture["photos"],
): Promise<VehicleScan> {
  const existing = await getScan(scanId, ownerId);
  if (!existing) throw new Error("Scan not found.");
  const incoming = sanitizeCapture({ photos: morePhotos });
  const byAngle = new Map(existing.capture.photos.map((p) => [p.angle, p] as const));
  for (const p of incoming.photos) byAngle.set(p.angle, p);
  const merged: ScanCapture = {
    ...existing.capture,
    photos: SCAN_ANGLES.map((a) => byAngle.get(a)).filter((p): p is ScanCapture["photos"][number] => Boolean(p)),
  };
  await sql(
    `update vehicle_scans
        set capture = $3::jsonb, status = 'queued', stage = 'Queued', progress = 0,
            quality = null, error = null, updated_at = now()
      where id = $1 and owner_id = $2`,
    [scanId, ownerId, JSON.stringify(merged)],
  );
  await enqueueJob(JOB_PROCESS, { scanId });
  return (await getScan(scanId, ownerId))!;
}

/**
 * The person confirms (or corrects) what the car is. Writes the result onto
 * the vehicle, creating a draft vehicle when the scan was not attached to
 * one. The poster is the front photo until a real model exists.
 */
export async function confirmRecognition(
  scanId: string,
  ownerId: string,
  correction: Partial<VehicleRecognition> = {},
): Promise<{ scan: VehicleScan; vehicleId: string }> {
  const scan = await getScan(scanId, ownerId);
  if (!scan) throw new Error("Scan not found.");

  const base: VehicleRecognition = scan.recognition ?? {
    year_min: null, year_max: null, make: null, model: null, body_type: null,
    color: null, trim: null, confidence: 0, provider: "user", checked_at: new Date().toISOString(),
  };
  const clean = (v: string | null | undefined, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  const merged: VehicleRecognition = {
    year_min: correction.year_min ?? base.year_min,
    year_max: correction.year_max ?? correction.year_min ?? base.year_max,
    make: clean(correction.make, 40) ?? base.make,
    model: clean(correction.model, 40) ?? base.model,
    body_type: clean(correction.body_type, 30) ?? base.body_type,
    color: clean(correction.color, 30) ?? base.color,
    trim: clean(correction.trim, 40) ?? base.trim,
    confidence: Object.keys(correction).length > 0 ? 1 : base.confidence,
    provider: Object.keys(correction).length > 0 ? `user+${base.provider}` : base.provider,
    checked_at: new Date().toISOString(),
  };
  const year = merged.year_max ?? merged.year_min;
  if (!merged.make || !merged.model) throw new Error("Add the make and model.");
  if (!year || year < 1960 || year > 2035) throw new Error("Add the year.");

  const poster = scan.model?.poster_url ?? posterFromCapture(scan.capture);

  const vehicleId = await transaction(async (client) => {
    let id = scan.vehicle_id;
    if (id) {
      const updated = await client.query(
        `update vehicles
            set year = $3, make = $4, model = $5, body_type = coalesce($6, body_type),
                color = coalesce($7, color), trim = coalesce($8, trim),
                recognition = $9::jsonb, scan_id = $2,
                poster_url = coalesce($10, poster_url),
                model_glb_url = coalesce($11, model_glb_url)
          where id = $1 and owner_id = $12 returning id`,
        [id, scan.id, year, merged.make, merged.model, merged.body_type, merged.color, merged.trim,
         JSON.stringify(merged), poster, scan.model?.glb_url ?? null, ownerId],
      );
      if (updated.rowCount === 0) throw new Error("Not your vehicle.");
    } else {
      const inserted = await client.query<{ id: string }>(
        `insert into vehicles (owner_id, year, make, model, body_type, color, trim, status,
                               recognition, scan_id, poster_url, model_glb_url)
         values ($1, $2, $3, $4, $5, $6, $7, 'draft', $8::jsonb, $9, $10, $11)
         returning id`,
        [ownerId, year, merged.make, merged.model, merged.body_type, merged.color, merged.trim,
         JSON.stringify(merged), scan.id, poster, scan.model?.glb_url ?? null],
      );
      id = inserted.rows[0].id;
    }
    await client.query(
      `update vehicle_scans set recognition = $3::jsonb, vehicle_id = $2, updated_at = now()
        where id = $1`,
      [scan.id, id, JSON.stringify(merged)],
    );
    return id;
  });

  return { scan: (await getScan(scanId, ownerId))!, vehicleId };
}

// --------------------------------------------------------------- pipeline

async function setStage(
  scanId: string,
  status: ScanStatus,
  stage: string,
  extra: {
    progress?: number; quality?: unknown; recognition?: unknown; model?: unknown;
    provider?: string | null; externalId?: string | null; error?: string | null;
  } = {},
) {
  await sql(
    `update vehicle_scans
        set status = $2, stage = $3, progress = $4,
            quality = coalesce($5::jsonb, quality),
            recognition = case when $6::text is null then recognition else $6::jsonb end,
            model = coalesce($7::jsonb, model),
            provider = coalesce($8, provider),
            external_id = coalesce($9, external_id),
            error = $10,
            updated_at = now()
      where id = $1`,
    [
      scanId, status, stage, Math.max(0, Math.min(100, Math.round(extra.progress ?? PROGRESS[status]))),
      extra.quality === undefined ? null : JSON.stringify(extra.quality),
      extra.recognition === undefined ? null : JSON.stringify(extra.recognition),
      extra.model === undefined ? null : JSON.stringify(extra.model),
      extra.provider ?? null,
      extra.externalId ?? null,
      extra.error ?? null,
    ],
  );
}

/** One notification per (scan, title): re-runs never spam the owner. */
async function notifyOwnerOnce(scan: ScanRow, title: string, body: string) {
  await sql(
    `insert into notifications (profile_id, category, title, body, href)
     select $1, $2, $3, $4, $5
      where not exists (select 1 from notifications
                         where profile_id = $1 and category = $2 and title = $3 and href = $5)`,
    [scan.owner_id, NOTIFY_CATEGORY, title, body, scanPath(scan.id)],
  );
}

async function applyModelToVehicle(scan: ScanRow, model: VehicleModelAsset) {
  if (!scan.vehicle_id) return;
  await sql(
    `update vehicles
        set model_glb_url = $2, poster_url = coalesce($3, poster_url), scan_id = $4
      where id = $1 and owner_id = $5`,
    [scan.vehicle_id, model.glb_url, model.poster_url, scan.id, scan.owner_id],
  );
}

/**
 * `vehicle_scan.process`: validate, recognize, then hand off to a
 * reconstruction provider or stop honestly.
 */
export async function processScan(scanId: string): Promise<VehicleScan | null> {
  const scan = await loadScan(scanId);
  if (!scan) return null;
  try {
    await setStage(scanId, "validating", "Checking your photos");
    const quality = assessCapture(scan.capture);

    if (quality.coverage_pct < RETAKE_THRESHOLD) {
      const missing = missingAngles(quality).map((a) => SCAN_ANGLE_LABEL[a]);
      const stage = missing.length > 0 ? `Rescan these angles: ${missing.join(", ")}` : "Add more photos";
      await setStage(scanId, "needs_retake", stage, { quality });
      await notifyOwnerOnce(
        scan,
        "Rescan these angles",
        missing.length > 0
          ? `Your car scan is missing ${missing.join(", ")}. Add those and we will pick up where you left off.`
          : "Your car scan needs more photos. Walk around the car and take all eight angles.",
      );
      return getScan(scanId, scan.owner_id);
    }

    await setStage(scanId, "recognizing", "Identifying your car", { quality });
    const recognition = await recognizeVehicle(orderedPhotoUrls(scan.capture));
    // Stored even when null: "we could not tell" is a real result.
    await setStage(scanId, "recognizing", "Identifying your car", { recognition, progress: 55 });

    const provider = reconstructionProvider();
    if (!provider.available()) {
      await setStage(scanId, "waiting_provider", "Waiting for reconstruction provider", {
        provider: provider.id,
        error: null,
      });
      await notifyOwnerOnce(
        scan,
        "Your scan is saved",
        "Your scan is saved. 3D reconstruction is not set up in this environment yet.",
      );
      return getScan(scanId, scan.owner_id);
    }

    await setStage(scanId, "reconstructing", "Building your 3D model", { provider: provider.id });
    const fresh = (await loadScan(scanId))!;
    const { external_id } = await provider.submit(toScan(fresh));
    await setStage(scanId, "reconstructing", "Building your 3D model", {
      provider: provider.id, externalId: external_id, progress: 62,
    });
    await enqueueJob(JOB_POLL, { scanId }, { runAfter: new Date(Date.now() + POLL_INTERVAL_MS) });
    return getScan(scanId, scan.owner_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed.";
    await setStage(scanId, "failed", "Something went wrong", { error: message });
    throw error;
  }
}

/**
 * `vehicle_scan.poll`: ask the provider how the model is coming along and
 * re-schedule until it is done or failed.
 */
export async function pollScan(scanId: string): Promise<VehicleScan | null> {
  const scan = await loadScan(scanId);
  if (!scan) return null;
  if (scan.status !== "reconstructing" || !scan.external_id) return toScan(scan);

  const provider = reconstructionProvider();
  if (!provider.available() || provider.id !== scan.provider) {
    await setStage(scanId, "waiting_provider", "Waiting for reconstruction provider", { error: null });
    return getScan(scanId, scan.owner_id);
  }

  const result = await provider.poll(scan.external_id);
  if (result.status === "done" && result.model) {
    await setStage(scanId, "complete", "Your 3D car is ready", { model: result.model });
    await applyModelToVehicle(scan, result.model);
    await notifyOwnerOnce(scan, "Your 3D car is ready", "Open your car to see the model and place ads on it.");
    return getScan(scanId, scan.owner_id);
  }
  if (result.status === "failed") {
    await setStage(scanId, "failed", "Reconstruction failed", {
      error: result.error ?? "The reconstruction provider could not build a model from this scan.",
    });
    await notifyOwnerOnce(scan, "We could not build your 3D car", "Try scanning again in even light with all eight angles.");
    return getScan(scanId, scan.owner_id);
  }
  const progress = 62 + Math.round(Math.max(0, Math.min(100, result.progress)) * 0.35);
  await setStage(scanId, "reconstructing", "Building your 3D model", { progress });
  await enqueueJob(JOB_POLL, { scanId }, { runAfter: new Date(Date.now() + POLL_INTERVAL_MS) });
  return getScan(scanId, scan.owner_id);
}
