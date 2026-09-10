import "server-only";
import { sql, sqlOne } from "@/lib/db";
import type { CatalogEntry, VehicleCatalogProvider } from "./types";

/**
 * Year / make / model catalog.
 *
 *   localCatalog   rows in vehicle_catalog with source = 'local' (the dev seed
 *                  from migration 0023; tests use only this one)
 *   vpicCatalog    NHTSA vPIC (https://vpic.nhtsa.dot.gov/api), used when
 *                  VEHICLE_CATALOG_PROVIDER=vpic and a cached reachability
 *                  probe says the API answers. Written against the documented
 *                  JSON shape; every call has a timeout and falls back to local.
 *
 * vPIC responses look like
 *   GET /api/vehicles/GetMakesForVehicleType/car?format=json
 *     { "Count": n, "Results": [{ "MakeId": 440, "MakeName": "ASTON MARTIN", ... }] }
 *   GET /api/vehicles/GetModelsForMakeYear/make/honda/modelyear/2020?format=json
 *     { "Count": n, "Results": [{ "Make_ID": 474, "Make_Name": "HONDA",
 *                                  "Model_ID": 1861, "Model_Name": "Accord" }] }
 */

const VPIC_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";
const VPIC_TIMEOUT_MS = 6_000;
const PROBE_TTL_MS = 10 * 60 * 1000;

type Probe = { reachable: boolean; checkedAt: number };
let probe: Probe | null = null;

function vpicConfigured(): boolean {
  return (process.env.VEHICLE_CATALOG_PROVIDER ?? "").trim().toLowerCase() === "vpic";
}

async function vpicFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VPIC_TIMEOUT_MS);
  try {
    const res = await fetch(`${VPIC_BASE}${path}${path.includes("?") ? "&" : "?"}format=json`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`vPIC ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Ask vPIC once per PROBE_TTL_MS whether it answers. Never throws. */
export async function probeVpic(force = false): Promise<boolean> {
  if (!vpicConfigured()) return false;
  if (!force && probe && Date.now() - probe.checkedAt < PROBE_TTL_MS) return probe.reachable;
  let reachable = false;
  try {
    const data = await vpicFetch<{ Count?: number }>("/GetVehicleVariableList");
    reachable = typeof data?.Count === "number";
  } catch {
    reachable = false;
  }
  probe = { reachable, checkedAt: Date.now() };
  return reachable;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export const vpicCatalog: VehicleCatalogProvider = {
  id: "vpic",
  available() {
    return vpicConfigured() && probe?.reachable === true && Date.now() - probe.checkedAt < PROBE_TTL_MS;
  },
  async makes() {
    const data = await vpicFetch<{ Results?: { MakeName?: string }[] }>("/GetMakesForVehicleType/car");
    const names = (data.Results ?? [])
      .map((r) => (typeof r.MakeName === "string" ? titleCase(r.MakeName.trim()) : ""))
      .filter(Boolean);
    return Array.from(new Set(names)).sort();
  },
  async models(year, make) {
    const data = await vpicFetch<{ Results?: { Model_ID?: number; Make_Name?: string; Model_Name?: string }[] }>(
      `/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}`,
    );
    const seen = new Set<string>();
    const entries: CatalogEntry[] = [];
    for (const r of data.Results ?? []) {
      const model = typeof r.Model_Name === "string" ? r.Model_Name.trim() : "";
      if (!model || seen.has(model.toLowerCase())) continue;
      seen.add(model.toLowerCase());
      entries.push({
        id: `vpic:${r.Model_ID ?? model}:${year}`,
        year,
        make: r.Make_Name ? titleCase(r.Make_Name) : make,
        model,
        trim: null,
        body_type: null,
        dims: null,
        source: "vpic",
      });
    }
    return entries.sort((a, b) => a.model.localeCompare(b.model));
  },
};

const LOCAL_SELECT = `select id, year, make, model, trim, body_type, dims, source from vehicle_catalog`;

export const localCatalog: VehicleCatalogProvider = {
  id: "local",
  available() {
    return true;
  },
  async makes(year) {
    const rows = await sql<{ make: string }>(
      `select distinct make from vehicle_catalog where source = 'local' and year = $1 order by make`,
      [year],
    );
    return rows.map((r) => r.make);
  },
  async models(year, make) {
    return sql<CatalogEntry>(
      `${LOCAL_SELECT} where source = 'local' and year = $1 and lower(make) = lower($2)
        order by model, trim nulls first`,
      [year, make],
    );
  },
};

/** vPIC when configured and reachable, otherwise the local seed. */
export async function catalogProvider(): Promise<VehicleCatalogProvider> {
  if (vpicConfigured() && (await probeVpic())) return vpicCatalog;
  return localCatalog;
}

export async function catalogMakes(year: number): Promise<string[]> {
  const provider = await catalogProvider();
  try {
    return await provider.makes(year);
  } catch {
    return provider.id === "local" ? [] : localCatalog.makes(year);
  }
}

export async function catalogModels(year: number, make: string): Promise<CatalogEntry[]> {
  const provider = await catalogProvider();
  try {
    return await provider.models(year, make);
  } catch {
    return provider.id === "local" ? [] : localCatalog.models(year, make);
  }
}

/**
 * Exact year + make + model lookup. Local rows win (they carry dimensions and
 * a database id the vehicle can reference); vPIC fills in when it is on.
 */
export async function findCatalogEntry(year: number, make: string, model: string): Promise<CatalogEntry | null> {
  const local = await sqlOne<CatalogEntry>(
    `${LOCAL_SELECT} where year = $1 and lower(make) = lower($2) and lower(model) = lower($3)
      order by (trim is null) desc, trim limit 1`,
    [year, make.trim(), model.trim()],
  );
  if (local) return local;
  if (vpicConfigured() && (await probeVpic())) {
    try {
      const entries = await vpicCatalog.models(year, make.trim());
      return entries.find((e) => e.model.toLowerCase() === model.trim().toLowerCase()) ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

export function catalogProviderStatus(): { id: "vpic" | "local"; available: boolean; message: string } {
  if (!vpicConfigured()) {
    return { id: "local", available: true, message: "Using the built-in development catalog (VEHICLE_CATALOG_PROVIDER is not vpic)." };
  }
  if (vpicCatalog.available()) return { id: "vpic", available: true, message: "NHTSA vPIC catalog is reachable." };
  return {
    id: "local",
    available: true,
    message: probe
      ? "NHTSA vPIC is configured but not reachable right now; using the local catalog."
      : "NHTSA vPIC is configured; reachability has not been checked yet, so the local catalog answers.",
  };
}
