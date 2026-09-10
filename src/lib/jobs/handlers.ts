import "server-only";
import { registerJobHandler } from "@/lib/jobs";
import { JOB_POLL, JOB_PROCESS, pollScan, processScan } from "@/lib/vehicles/scans";

/**
 * The job registry. Import this module (for its side effects) anywhere that
 * calls runDueJobs so every kind has a handler: the cron route, the dev
 * route and the scan server actions all do.
 */

function scanId(payload: Record<string, unknown>): string {
  const id = payload.scanId;
  if (typeof id !== "string" || !id) throw new Error("Job payload is missing scanId.");
  return id;
}

registerJobHandler(JOB_PROCESS, async (payload) => {
  const scan = await processScan(scanId(payload));
  return scan ? { status: scan.status, stage: scan.stage } : { status: "missing" };
});

registerJobHandler(JOB_POLL, async (payload) => {
  const scan = await pollScan(scanId(payload));
  return scan ? { status: scan.status, progress: scan.progress } : { status: "missing" };
});

export const JOB_KINDS = [JOB_PROCESS, JOB_POLL] as const;
