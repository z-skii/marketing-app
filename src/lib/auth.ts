import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { sql, sqlOne } from "./db";

/**
 * Session handling.
 *
 * Identity is always resolved server-side from a signed, httpOnly cookie — the
 * browser never supplies a user id we trust. Supabase Auth owns the email OTP
 * challenge; once it verifies, we mint this cookie.
 */

const COOKIE = "untitled_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 16 characters.");
  }
  return value;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function verify(value: string, signature: string): boolean {
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export type CurrentUser = {
  id: string;
  memberNo: number;
  username: string;
  email: string | null;
  displayName: string | null;
  role: "user" | "admin";
  creatorEnabled: boolean;
  suspended: boolean;
};

export async function createSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  const index = raw.lastIndexOf(".");
  if (index < 1) return null;

  const userId = raw.slice(0, index);
  if (!verify(userId, raw.slice(index + 1))) return null;

  type ProfileRow = {
    id: string; member_no: string | null; username: string | null; email: string | null;
    display_name: string | null;
    role: "user" | "admin"; creator_enabled: boolean; suspended: boolean;
  };
  // Tolerates a deploy that lands moments before the member-number migration:
  // if the column is missing the session still works, numbered as 0.
  let profile: ProfileRow | null;
  try {
    profile = await sqlOne<ProfileRow>(
      `select p.id, p.member_no, p.username, u.email, p.display_name, p.role, p.creator_enabled, p.suspended
         from profiles p join auth.users u on u.id = p.id
        where p.id = $1`,
      [userId],
    );
  } catch {
    profile = await sqlOne<ProfileRow>(
      `select p.id, null as member_no, null as username, u.email, p.display_name, p.role, p.creator_enabled, p.suspended
         from profiles p join auth.users u on u.id = p.id
        where p.id = $1`,
      [userId],
    );
  }
  if (!profile || profile.suspended) return null;

  return {
    id: profile.id,
    memberNo: Number(profile.member_no ?? 0),
    username: profile.username ?? `member${Number(profile.member_no ?? 0)}`,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
    creatorEnabled: profile.creator_enabled,
    suspended: profile.suspended,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

/**
 * Find or create the local profile for a verified email address. Called only
 * after the email has actually been proven (Supabase OTP, or the explicitly
 * enabled development shortcut).
 */
export async function upsertUserByEmail(email: string, desiredUsername?: string): Promise<string> {
  const normalized = email.trim().toLowerCase();

  const existing = await sqlOne<{ id: string }>(
    `select id from auth.users where email = $1`, [normalized],
  );
  const id = existing?.id ?? randomUUID();
  if (!existing) {
    await sql(`insert into auth.users (id, email) values ($1, $2)`, [id, normalized]);
  }

  await insertProfileWithUsername(id, normalized, desiredUsername);
  await sql(`select ensure_wallet($1)`, [id]);
  return id;
}

/**
 * Creates the profile if it doesn't exist, resolving a unique username: the
 * requested name when free, the email's local part otherwise, then numbered
 * fallbacks. An existing profile is never renamed here.
 */
async function insertProfileWithUsername(id: string, email: string, desired?: string) {
  const clean = (v: string) => v.replace(/[^A-Za-z0-9_.]/g, "").slice(0, 24);
  const local = clean(email.split("@")[0] ?? "");
  const candidates = [
    desired ? clean(desired) : "",
    local,
    `${local.slice(0, 19)}${Math.floor(1000 + Math.random() * 9000)}`,
    `user${Math.floor(100000 + Math.random() * 900000)}`,
  ].filter((c) => c.length >= 3);

  for (const candidate of candidates) {
    try {
      await sql(
        `insert into profiles (id, display_name, username) values ($1, $2, $3)
         on conflict (id) do nothing`,
        [id, email.split("@")[0], candidate],
      );
      return;
    } catch {
      // Unique username collision: try the next candidate.
    }
  }
  try {
    await sql(
      `insert into profiles (id, display_name, username) values ($1, $2, $3)
       on conflict (id) do nothing`,
      [id, email.split("@")[0], `user${Date.now() % 1000000}`],
    );
  } catch {
    // Tolerates a deploy that lands moments before the username migration.
    await sql(
      `insert into profiles (id, display_name) values ($1, $2) on conflict (id) do nothing`,
      [id, email.split("@")[0]],
    );
  }
}
