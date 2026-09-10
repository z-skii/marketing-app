import type { StagePhoto } from "@/components/v2/vehicle/VehicleStage";

/**
 * What VehicleStage needs, built from a vehicle row plus its photos and the
 * latest scan. Scan captures win when they cover at least two angles; the
 * label says which level the stage is showing, never more.
 */

export type StageProps = {
  glbUrl: string | null;
  posterUrl: string | null;
  photos: StagePhoto[];
  label: string | null;
};

export function buildStage(input: {
  glbUrl: string | null;
  posterUrl: string | null;
  photos: StagePhoto[];
  scanPhotos: StagePhoto[] | null | undefined;
  scanQualityLabel: string | null | undefined;
}): StageProps {
  const scan = (input.scanPhotos ?? []).filter((p) => p && typeof p.url === "string" && p.url);
  const photos = scan.length >= 2 ? scan : input.photos;
  const posterUrl = input.posterUrl ?? photos[0]?.url ?? null;
  const label = input.glbUrl ? "3D scan" : input.scanQualityLabel ?? (photos.length >= 2 ? "Photo scan" : null);
  return { glbUrl: input.glbUrl, posterUrl, photos, label };
}
