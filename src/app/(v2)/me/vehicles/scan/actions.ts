"use server";

import { revalidatePath } from "next/cache";
import { requireOnboarded } from "@/lib/v2/core";
import { devAuthEnabled } from "@/lib/supabase";
import { runDueJobs } from "@/lib/jobs";
import "@/lib/jobs/handlers";
import {
  addCapture, confirmRecognition, createScan, getScan, scanPath,
} from "@/lib/vehicles/scans";
import type { ScanCapture, VehicleRecognition, VehicleScan } from "@/lib/vehicles/types";

/**
 * Scan your car: the phone uploads photos (via /api/v2/upload), then these
 * actions create the scan, feed retakes back in, confirm what the car is,
 * and (in development only) push the pipeline forward without a cron.
 */

type ScanResult = { ok: true; scan: VehicleScan } | { ok: false; error: string };

function message(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function startScan(input: { vehicleId?: string | null; capture: ScanCapture }): Promise<ScanResult> {
  const ctx = await requireOnboarded();
  try {
    const scan = await createScan(ctx.user.id, input.vehicleId ?? null, input.capture);
    if (input.vehicleId) revalidatePath(`/me/vehicles/${input.vehicleId}`);
    revalidatePath("/me/vehicles");
    return { ok: true, scan };
  } catch (error) {
    return { ok: false, error: message(error, "Could not start the scan.") };
  }
}

export async function retakeScan(scanId: string, photos: ScanCapture["photos"]): Promise<ScanResult> {
  const ctx = await requireOnboarded();
  try {
    const scan = await addCapture(scanId, ctx.user.id, photos);
    revalidatePath(scanPath(scanId));
    return { ok: true, scan };
  } catch (error) {
    return { ok: false, error: message(error, "Could not add those photos.") };
  }
}

export async function acceptRecognition(
  scanId: string,
  correction?: Partial<VehicleRecognition>,
): Promise<{ ok: true; scan: VehicleScan; vehicleId: string } | { ok: false; error: string }> {
  const ctx = await requireOnboarded();
  try {
    const result = await confirmRecognition(scanId, ctx.user.id, correction ?? {});
    revalidatePath(scanPath(scanId));
    revalidatePath(`/me/vehicles/${result.vehicleId}`);
    revalidatePath("/me/vehicles");
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: message(error, "Could not save the car details.") };
  }
}

/**
 * Development only: run due jobs right now and hand back the scan, so the
 * UI can be exercised without waiting for the cron.
 */
export async function runScanNow(scanId: string): Promise<ScanResult & { ran?: number; failed?: number }> {
  const ctx = await requireOnboarded();
  if (!devAuthEnabled()) return { ok: false, error: "Only available in development." };
  const existing = await getScan(scanId, ctx.user.id);
  if (!existing) return { ok: false, error: "Scan not found." };
  const { ran, failed } = await runDueJobs(10);
  const scan = await getScan(scanId, ctx.user.id);
  revalidatePath(scanPath(scanId));
  if (scan?.vehicle_id) revalidatePath(`/me/vehicles/${scan.vehicle_id}`);
  return scan ? { ok: true, scan, ran, failed } : { ok: false, error: "Scan not found." };
}

/** Read the scan for polling from the status screen. */
export async function getScanStatus(scanId: string): Promise<ScanResult> {
  const ctx = await requireOnboarded();
  const scan = await getScan(scanId, ctx.user.id);
  return scan ? { ok: true, scan } : { ok: false, error: "Scan not found." };
}

/** Catalog lookups for the "Change" form. Local seed or vPIC when configured. */
export async function catalogMakesAction(year: number): Promise<string[]> {
  await requireOnboarded();
  const { catalogMakes } = await import("@/lib/vehicles/catalog");
  return catalogMakes(year);
}

export async function catalogModelsAction(year: number, make: string): Promise<string[]> {
  await requireOnboarded();
  const { catalogModels } = await import("@/lib/vehicles/catalog");
  const rows = await catalogModels(year, make);
  return Array.from(new Set(rows.map((r) => r.model)));
}
