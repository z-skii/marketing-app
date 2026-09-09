import "server-only";

export interface GeocodeResult { latitude: number; longitude: number; display_name: string }

/** Forward geocoding via OpenStreetMap Nominatim (light use; owners can also pin coordinates manually). */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": "Storeday/1.0 (store operations app)", Accept: "application/json" },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const r = rows[0];
    if (!r) return null;
    return { latitude: Number(r.lat), longitude: Number(r.lon), display_name: r.display_name };
  } catch {
    return null;
  }
}
