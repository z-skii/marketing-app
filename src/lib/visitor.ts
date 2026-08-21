import "server-only";
import { cookies, headers } from "next/headers";
import { createHmac, randomUUID } from "node:crypto";

/**
 * Visitor identity for click qualification.
 *
 * We use a first-party anonymous id plus a keyed hash of the request IP. The raw
 * IP is never stored, and we do not fingerprint the browser.
 */

const VISITOR_COOKIE = "untitled_vid";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 400;

export async function getVisitorId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VISITOR_COOKIE)?.value ?? null;
}

/** Read the visitor id, minting one if this is their first request. */
export async function ensureVisitorId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_MAX_AGE,
  });
  return id;
}

export async function requestIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip");
}

/** A keyed, non-reversible hash. One signal among several — never an identity. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const key = process.env.CLICK_HASH_SECRET ?? process.env.AUTH_SECRET;
  if (!key) return null;
  return createHmac("sha256", key).update(ip).digest("base64url").slice(0, 32);
}
