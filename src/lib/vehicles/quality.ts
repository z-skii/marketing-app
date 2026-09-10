import {
  SCAN_ANGLES, SCAN_ANGLE_LABEL,
  type QualityIssue, type ScanAngle, type ScanCapture, type ScanQuality,
} from "./types";

/**
 * Deterministic capture assessment. No image analysis happens here: coverage
 * is purely which of the eight walk-around angles have a photo. Each angle is
 * worth 12.5 percent.
 *
 * Video: we cannot analyze video server-side (no ffmpeg in this runtime), so
 * a video only counts as full coverage when the person also took at least
 * four photos. That way there is always something to recognize from and to
 * show as a poster.
 */

const ANGLE_PCT = 100 / SCAN_ANGLES.length;
const MIN_PHOTOS = 8;
const MIN_PHOTOS_WITH_VIDEO = 4;

export function assessCapture(capture: ScanCapture): ScanQuality {
  const photos = Array.isArray(capture?.photos) ? capture.photos : [];
  const videos = Array.isArray(capture?.video_urls) ? capture.video_urls.filter(Boolean) : [];
  const photoCount = photos.filter((p) => typeof p?.url === "string" && p.url).length;
  const hasVideo = videos.length > 0;

  const seen = new Set<ScanAngle>();
  for (const p of photos) {
    if ((SCAN_ANGLES as readonly string[]).includes(p?.angle) && p.url) seen.add(p.angle);
  }
  const missing = SCAN_ANGLES.filter((a) => !seen.has(a));

  const issues: QualityIssue[] = [];
  if (photoCount === 0 && !hasVideo) {
    issues.push({ code: "no_media", label: "No photos or video yet", angle: null });
  }

  const videoCoversAll = hasVideo && photoCount >= MIN_PHOTOS_WITH_VIDEO;
  let coverage = videoCoversAll ? 100 : Math.round(seen.size * ANGLE_PCT);
  coverage = Math.max(0, Math.min(100, coverage));

  if (!videoCoversAll) {
    for (const angle of missing) {
      issues.push({ code: "missing_angle", label: `Missing ${SCAN_ANGLE_LABEL[angle]}`, angle });
    }
    if (photoCount > 0 && photoCount < MIN_PHOTOS && !hasVideo) {
      issues.push({
        code: "too_few_photos",
        label: `Only ${photoCount} of ${MIN_PHOTOS} photos`,
        angle: null,
      });
    }
  }

  const label =
    coverage >= 100 ? "Excellent coverage"
    : coverage >= 75 ? "Good coverage"
    : "Needs more angles";

  return { coverage_pct: coverage, photo_count: photoCount, has_video: hasVideo, issues, label };
}

/** The angles a retake should focus on, in walk-around order. */
export function missingAngles(quality: ScanQuality): ScanAngle[] {
  return quality.issues
    .filter((i) => i.code === "missing_angle" && i.angle)
    .map((i) => i.angle as ScanAngle);
}
