import type { ClientMediaMeta, SubmissionCheck } from "./types";

/**
 * What a Recreate submission keeps in submissions.meta: the advisory check
 * the creator saw and the numbers the browser read off the file. Frames are
 * dropped (they are large data URLs and only feed the check).
 */
export function submissionMeta(
  check: SubmissionCheck | null | undefined,
  clientMeta: ClientMediaMeta | null | undefined,
): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (check && Array.isArray(check.items) && ["client", "ai", "none"].includes(check.checked_by)) {
    meta.check = {
      items: check.items.slice(0, 40).map((i) => ({
        key: String(i.key).slice(0, 80),
        label: String(i.label).slice(0, 200),
        status: ["pass", "warn", "fail", "unknown"].includes(i.status) ? i.status : "unknown",
        note: typeof i.note === "string" ? i.note.slice(0, 300) : null,
      })),
      summary: String(check.summary ?? "").slice(0, 500),
      checked_by: check.checked_by,
      checked_at: typeof check.checked_at === "string" ? check.checked_at : new Date().toISOString(),
    };
  }
  if (clientMeta) {
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    meta.client_meta = {
      durationSeconds: num(clientMeta.durationSeconds),
      width: num(clientMeta.width),
      height: num(clientMeta.height),
      sizeBytes: num(clientMeta.sizeBytes),
    };
  }
  return meta;
}
