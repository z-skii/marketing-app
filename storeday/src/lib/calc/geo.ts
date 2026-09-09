/** Haversine distance in meters (same formula as app.distance_m in SQL). */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function metersToFeet(m: number): number {
  return m * 3.28084;
}

export function feetToMeters(ft: number): number {
  return ft / 3.28084;
}

export function formatDistance(m: number | null | undefined, unit: "ft" | "m" = "ft"): string {
  if (m == null) return "—";
  if (unit === "m") return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  const ft = metersToFeet(m);
  return ft < 1000 ? `${Math.round(ft)} ft` : `${(ft / 5280).toFixed(1)} mi`;
}

/** Inside when within radius plus (capped) GPS accuracy — mirrors clock_in() in SQL. */
export function isWithinRadius(distanceM: number, radiusM: number, accuracyM = 0): boolean {
  return distanceM <= radiusM + Math.min(accuracyM || 0, 50);
}
