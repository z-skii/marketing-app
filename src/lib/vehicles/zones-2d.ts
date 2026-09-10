import type { PlacementZone, ScanAngle } from "./types";

/**
 * Approximate 2D placement boxes for the photo-based ad preview. Each box is
 * a percentage of the photo (x, y, w, h) with an optional vertical skew in
 * degrees that leans the artwork with the body panel. Zones that a given
 * angle cannot see are simply absent: the preview says so instead of
 * guessing. Real placement comes with the 3D reconstruction provider.
 */

export type ZoneBox = { x: number; y: number; w: number; h: number; skew?: number };

export type PhotoAngle = ScanAngle | "driver_side" | "passenger_side" | "front" | "rear" | "other";

const DRIVER_SIDE: Partial<Record<PlacementZone, ZoneBox>> = {
  driver_door: { x: 30, y: 40, w: 22, h: 22 },
  driver_rear_door: { x: 53, y: 40, w: 18, h: 20 },
  full_side: { x: 12, y: 35, w: 76, h: 30 },
  partial_wrap: { x: 12, y: 38, w: 52, h: 28 },
  full_wrap: { x: 6, y: 22, w: 88, h: 50 },
};

const PASSENGER_SIDE: Partial<Record<PlacementZone, ZoneBox>> = {
  passenger_door: { x: 48, y: 40, w: 22, h: 22 },
  passenger_rear_door: { x: 29, y: 40, w: 18, h: 20 },
  full_side: { x: 12, y: 35, w: 76, h: 30 },
  partial_wrap: { x: 36, y: 38, w: 52, h: 28 },
  full_wrap: { x: 6, y: 22, w: 88, h: 50 },
};

const FRONT: Partial<Record<PlacementZone, ZoneBox>> = {
  hood: { x: 22, y: 30, w: 56, h: 24 },
  partial_wrap: { x: 16, y: 28, w: 68, h: 40 },
  full_wrap: { x: 10, y: 18, w: 80, h: 60 },
};

const REAR: Partial<Record<PlacementZone, ZoneBox>> = {
  rear_window: { x: 28, y: 22, w: 44, h: 22 },
  rear_panel: { x: 26, y: 50, w: 48, h: 18 },
  partial_wrap: { x: 16, y: 28, w: 68, h: 40 },
  full_wrap: { x: 10, y: 18, w: 80, h: 60 },
};

export const ZONE_BOXES: Record<PhotoAngle, Partial<Record<PlacementZone, ZoneBox>>> = {
  left: DRIVER_SIDE,
  driver_side: DRIVER_SIDE,
  right: PASSENGER_SIDE,
  passenger_side: PASSENGER_SIDE,
  front: FRONT,
  rear: REAR,
  front_left: {
    hood: { x: 42, y: 32, w: 34, h: 18, skew: -6 },
    driver_door: { x: 20, y: 42, w: 16, h: 20, skew: 6 },
    driver_rear_door: { x: 9, y: 42, w: 11, h: 18, skew: 6 },
    full_side: { x: 8, y: 36, w: 42, h: 28, skew: 7 },
    partial_wrap: { x: 8, y: 38, w: 34, h: 26, skew: 7 },
    full_wrap: { x: 6, y: 22, w: 88, h: 50 },
  },
  front_right: {
    hood: { x: 24, y: 32, w: 34, h: 18, skew: 6 },
    passenger_door: { x: 64, y: 42, w: 16, h: 20, skew: -6 },
    passenger_rear_door: { x: 80, y: 42, w: 11, h: 18, skew: -6 },
    full_side: { x: 50, y: 36, w: 42, h: 28, skew: -7 },
    partial_wrap: { x: 58, y: 38, w: 34, h: 26, skew: -7 },
    full_wrap: { x: 6, y: 22, w: 88, h: 50 },
  },
  rear_left: {
    rear_window: { x: 52, y: 24, w: 28, h: 18, skew: 8 },
    rear_panel: { x: 54, y: 50, w: 30, h: 16, skew: 8 },
    driver_rear_door: { x: 26, y: 40, w: 16, h: 22, skew: -5 },
    driver_door: { x: 12, y: 40, w: 14, h: 20, skew: -5 },
    full_side: { x: 8, y: 36, w: 42, h: 28, skew: -6 },
    partial_wrap: { x: 8, y: 38, w: 34, h: 26, skew: -6 },
    full_wrap: { x: 6, y: 22, w: 88, h: 50 },
  },
  rear_right: {
    rear_window: { x: 20, y: 24, w: 28, h: 18, skew: -8 },
    rear_panel: { x: 16, y: 50, w: 30, h: 16, skew: -8 },
    passenger_rear_door: { x: 58, y: 40, w: 16, h: 22, skew: 5 },
    passenger_door: { x: 74, y: 40, w: 14, h: 20, skew: 5 },
    full_side: { x: 50, y: 36, w: 42, h: 28, skew: 6 },
    partial_wrap: { x: 58, y: 38, w: 34, h: 26, skew: 6 },
    full_wrap: { x: 6, y: 22, w: 88, h: 50 },
  },
  other: {},
};

/** The box for a zone as seen from an angle, or null when it is not visible. */
export function zoneBox(angle: string, zone: string): ZoneBox | null {
  const byZone = ZONE_BOXES[angle as PhotoAngle];
  if (!byZone) return null;
  return byZone[zone as PlacementZone] ?? null;
}
