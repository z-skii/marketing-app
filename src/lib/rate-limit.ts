import "server-only";

/**
 * Fixed-window in-process rate limiter.
 *
 * Scoped per serverless instance, which is the right ceiling for what it
 * guards: the click path is already idempotent and financially safe on its own
 * (duplicate window + atomic debit), so this only sheds abusive request volume
 * early. Swap for a shared store (Upstash, Vercel KV) if instance-local limits
 * ever prove too generous.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Cheap sweep: when the map grows too large, drop expired buckets first.
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
        if (buckets.size < MAX_BUCKETS / 2) break;
      }
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

export const LIMITS = {
  /** Outbound opens per visitor per minute — far above human clicking speed. */
  go: { limit: 30, windowMs: 60_000 },
  /** OTP requests per address per window, to stop email bombing. */
  otpRequest: { limit: 5, windowMs: 10 * 60_000 },
  /** Code attempts per address per window, to stop brute force. */
  otpVerify: { limit: 10, windowMs: 10 * 60_000 },
} as const;
