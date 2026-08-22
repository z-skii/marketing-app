export const dynamic = "force-dynamic";

/**
 * Deployment fingerprint. BUILD_TAG is bumped by hand whenever knowing exactly
 * which code is serving matters — checking this endpoint beats guessing from
 * behavior.
 */
const BUILD_TAG = "hardwired-config-1";

export function GET() {
  return Response.json({ build: BUILD_TAG });
}
