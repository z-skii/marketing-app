import { getVehicle, zoneOf, type PlacementZone, type ZoneKey } from "./catalog";

/**
 * A placement: which zone, which artwork, how large and where inside the
 * zone. Offsets are fractions (-1 to 1) of the free room left in the zone
 * once the artwork size is known, so a placement can never leave its
 * panel. Stored on campaigns as details.placement_config (jsonb); no
 * migration.
 */
export type Placement = {
  zone: ZoneKey;
  artworkUrl: string | null;
  /** 0.25 to 1: the artwork width as a fraction of the zone width. */
  scale: number;
  offsetX: number;
  offsetY: number;
  /** Degrees, -15 to 15. */
  rotation: number;
};

export const DEFAULT_PLACEMENT: Omit<Placement, "zone" | "artworkUrl"> = { scale: 0.82, offsetX: 0, offsetY: 0, rotation: 0 };

export function makePlacement(zone: ZoneKey, artworkUrl: string | null, partial: Partial<Placement> = {}): Placement {
  return { zone, artworkUrl, ...DEFAULT_PLACEMENT, ...partial };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function normalizePlacement(p: Placement): Placement {
  return {
    ...p,
    scale: clamp(Number.isFinite(p.scale) ? p.scale : DEFAULT_PLACEMENT.scale, 0.25, 1),
    offsetX: clamp(Number.isFinite(p.offsetX) ? p.offsetX : 0, -1, 1),
    offsetY: clamp(Number.isFinite(p.offsetY) ? p.offsetY : 0, -1, 1),
    rotation: clamp(Number.isFinite(p.rotation) ? p.rotation : 0, -15, 15),
  };
}

/** Read a stored placement_config, tolerating anything that is not one. */
export function readPlacement(raw: unknown, fallbackZone: ZoneKey | null, artworkUrl: string | null, vehicleId?: string): Placement | null {
  const vehicle = getVehicle(vehicleId);
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const zone = typeof r.zone === "string" && zoneOf(vehicle, r.zone) ? (r.zone as ZoneKey) : fallbackZone;
    if (zone) {
      return normalizePlacement({
        zone,
        artworkUrl: typeof r.artworkUrl === "string" && r.artworkUrl ? r.artworkUrl : artworkUrl,
        scale: Number(r.scale), offsetX: Number(r.offsetX), offsetY: Number(r.offsetY), rotation: Number(r.rotation),
      });
    }
  }
  return fallbackZone ? makePlacement(fallbackZone, artworkUrl) : null;
}

/** The decal box for a placement given the artwork's aspect ratio: width, height (metres) and the offset from the zone centre. */
export function decalBox(zone: PlacementZone, p: Placement, aspect: number): { w: number; h: number; dx: number; dy: number } {
  const [zw, zh] = zone.size;
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : 2;
  let w = zw * p.scale;
  let h = w / a;
  if (h > zh) { h = zh; w = h * a; }
  const dx = p.offsetX * Math.max(0, (zw - w) / 2);
  const dy = p.offsetY * Math.max(0, (zh - h) / 2);
  return { w, h, dx, dy };
}
