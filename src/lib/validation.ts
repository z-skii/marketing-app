import { z } from "zod";

/**
 * Destination URLs come from the public. We validate them strictly and never
 * fetch them server-side, which keeps the submission path free of SSRF.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal",
]);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) return true;
  if (hostname.endsWith(".localhost") || hostname.endsWith(".local")) return true;
  if (hostname === "169.254.169.254") return true;

  // IPv4 private and loopback ranges.
  const v4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    if (a >= 224) return true;
  }
  // Bare IPv6 literals are refused outright.
  if (hostname.includes(":")) return true;
  return false;
}

export type UrlCheck =
  | { ok: true; url: string; domain: string }
  | { ok: false; reason: string };

export function checkDestinationUrl(raw: string): UrlCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "Add a link." };

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: "That doesn't look like a valid link." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: "Links must start with https://" };
  }
  if (parsed.protocol === "http:") {
    // Upgrade rather than reject: almost every real destination supports TLS.
    parsed.protocol = "https:";
  }
  if (!parsed.hostname.includes(".")) {
    return { ok: false, reason: "That doesn't look like a valid domain." };
  }
  if (isPrivateHost(parsed.hostname)) {
    return { ok: false, reason: "That address can't be used." };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "Links can't contain credentials." };
  }
  if (parsed.href.length > 2048) {
    return { ok: false, reason: "That link is too long." };
  }

  parsed.hash = "";
  const domain = parsed.hostname.replace(/^www\./, "").toLowerCase();
  return { ok: true, url: parsed.toString(), domain };
}

export const linkAppearanceSchema = z.object({
  displayName: z.string().trim().min(2, "Add a name.").max(40, "Keep the name under 40 characters."),
  shortDescription: z.string().trim().max(90, "Keep it to one short sentence.").optional().or(z.literal("")),
  imageUrl: z.string().trim().url().max(2048).optional().or(z.literal("")),
});

export const placementSelectionSchema = z.object({
  board: z.coerce.number().int().min(0).default(0),
  spot: z.coerce.number().int().min(0).default(0),
  bar: z.coerce.number().int().min(0).default(0),
});

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email.");


/** A URL-safe slug derived from the display name, with a short random suffix. */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return base || "link";
}

/** Account passwords: long enough to matter, capped where bcrypt stops reading. */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.");

/**
 * Public usernames: 3-24 characters of letters, digits, underscore, or
 * period. Uniqueness is enforced case-insensitively in the database; names
 * that could impersonate the platform are reserved.
 */
const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "support", "root", "system", "mod", "moderator",
  "staff", "help", "official", "untitled", "owner", "security", "api",
]);

export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.]{3,24}$/, "3-24 letters, numbers, underscores, or periods.")
  .refine((v) => !RESERVED_USERNAMES.has(v.toLowerCase()), {
    message: "That username is reserved.",
  });
