// GoTrue-compatible subset backed by auth.users in the local Postgres.
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { config, HttpError, signJwt, randomToken, parseJsonBody } from "./util.mjs";

const REFRESH_GRACE_MS = 10 * 60 * 1000; // a rotated refresh token keeps working this long (concurrent SSR refreshes)

export class Auth {
  constructor(pool) {
    this.pool = pool;
    this.oneTimeTokens = new Map(); // token → { userId, type, exp }
  }

  async init() {
    const c = await this.pool.connect();
    try {
      await c.query(`create table if not exists auth.local_passwords (user_id uuid primary key references auth.users(id) on delete cascade, hash text not null)`);
      await c.query(`create table if not exists auth.local_refresh_tokens (
        token text primary key, user_id uuid not null references auth.users(id) on delete cascade, session_id uuid not null,
        next_token text, rotated_at timestamptz, created_at timestamptz not null default now())`);
      for (const [col, type] of [
        ["encrypted_password", "text"],
        ["email_confirmed_at", "timestamptz"],
        ["raw_app_meta_data", "jsonb"],
        ["updated_at", "timestamptz"],
        ["last_sign_in_at", "timestamptz"],
      ]) {
        await c.query(`alter table auth.users add column if not exists ${col} ${type}`);
      }
    } finally {
      c.release();
    }
  }

  // ---------------------------------------------------------------- passwords
  hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `scrypt$${salt}$${hash}`;
  }

  verifyScrypt(password, stored) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    const a = scryptSync(password, salt, 64);
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }

  async setPassword(client, userId, password) {
    await client.query(
      `insert into auth.local_passwords (user_id, hash) values ($1, $2) on conflict (user_id) do update set hash = excluded.hash`,
      [userId, this.hashPassword(password)],
    );
    // Also keep a pgcrypto hash so SQL seeds/tests that compare encrypted_password keep working.
    try {
      await client.query(`update auth.users set encrypted_password = crypt($2, gen_salt('bf', 6)), updated_at = now() where id = $1`, [userId, password]);
    } catch {
      /* pgcrypto not available: scrypt hash is enough */
    }
  }

  async checkPassword(client, userId, password) {
    const local = await client.query(`select hash from auth.local_passwords where user_id = $1`, [userId]);
    if (local.rows[0]?.hash) return this.verifyScrypt(password, local.rows[0].hash);
    try {
      const r = await client.query(
        `select encrypted_password is not null and encrypted_password = crypt($2, encrypted_password) as ok from auth.users where id = $1`,
        [userId, password],
      );
      return Boolean(r.rows[0]?.ok);
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------- users
  async loadUser(client, where, params) {
    const r = await client.query(`select to_jsonb(u) as u from auth.users u where ${where} limit 1`, params);
    return r.rows[0] ? this.toUser(r.rows[0].u) : null;
  }

  toUser(row) {
    const now = new Date().toISOString();
    const created = row.created_at || now;
    return {
      id: row.id,
      aud: "authenticated",
      role: "authenticated",
      email: row.email,
      email_confirmed_at: row.email_confirmed_at || created,
      phone: "",
      confirmed_at: row.email_confirmed_at || created,
      last_sign_in_at: row.last_sign_in_at || created,
      app_metadata: row.raw_app_meta_data || { provider: "email", providers: ["email"] },
      user_metadata: row.raw_user_meta_data || {},
      identities: [],
      created_at: created,
      updated_at: row.updated_at || created,
      is_anonymous: false,
    };
  }

  async createUser(client, { email, password, data, confirmed = true }) {
    const normalized = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw authError(400, "validation_failed", "Unable to validate email address: invalid format");
    const existing = await client.query(`select id from auth.users where lower(email) = $1`, [normalized]);
    if (existing.rows.length) throw authError(422, "user_already_exists", "User already registered");
    const id = randomUUID();
    await client.query(
      `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, email_confirmed_at, created_at, updated_at)
       values ($1, $2, $3::jsonb, $4::jsonb, case when $5 then now() end, now(), now())`,
      [id, normalized, JSON.stringify(data || {}), JSON.stringify({ provider: "email", providers: ["email"] }), confirmed],
    );
    if (password) await this.setPassword(client, id, password);
    return this.loadUser(client, "u.id = $1", [id]);
  }

  // ---------------------------------------------------------------- sessions
  buildSession(user, sessionId, refreshToken) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + config.accessTokenTtl;
    const claims = {
      iss: "local",
      sub: user.id,
      aud: "authenticated",
      exp,
      iat,
      email: user.email,
      phone: "",
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      role: "authenticated",
      aal: "aal1",
      amr: [{ method: "password", timestamp: iat }],
      session_id: sessionId,
      is_anonymous: false,
    };
    return { access_token: signJwt(claims), token_type: "bearer", expires_in: config.accessTokenTtl, expires_at: exp, refresh_token: refreshToken, user };
  }

  async issueSession(client, user, sessionId = randomUUID()) {
    const refresh = randomToken(24);
    await client.query(`insert into auth.local_refresh_tokens (token, user_id, session_id) values ($1, $2, $3)`, [refresh, user.id, sessionId]);
    return this.buildSession(user, sessionId, refresh);
  }

  async refreshSession(client, refreshToken) {
    const r = await client.query(`select * from auth.local_refresh_tokens where token = $1`, [refreshToken]);
    const row = r.rows[0];
    if (!row) throw authError(400, "refresh_token_not_found", "Invalid Refresh Token: Refresh Token Not Found");
    const user = await this.loadUser(client, "u.id = $1", [row.user_id]);
    if (!user) throw authError(400, "user_not_found", "User from refresh token not found");
    if (row.next_token) {
      const age = Date.now() - new Date(row.rotated_at).getTime();
      if (age > REFRESH_GRACE_MS) throw authError(400, "refresh_token_already_used", "Invalid Refresh Token: Already Used");
      // Reuse inside the grace window: hand out the same successor so concurrent refreshes agree.
      return this.buildSession(user, row.session_id, row.next_token);
    }
    const session = await this.issueSession(client, user, row.session_id);
    await client.query(`update auth.local_refresh_tokens set next_token = $2, rotated_at = now() where token = $1`, [refreshToken, session.refresh_token]);
    return session;
  }

  async revokeUserSessions(client, userId) {
    await client.query(`delete from auth.local_refresh_tokens where user_id = $1`, [userId]);
  }

  oneTime(userId, type, ttlSec = 3600) {
    const token = randomToken(24);
    this.oneTimeTokens.set(token, { userId, type, exp: Date.now() + ttlSec * 1000 });
    return token;
  }

  consumeOneTime(token) {
    const t = this.oneTimeTokens.get(token);
    if (!t) return null;
    this.oneTimeTokens.delete(token);
    if (t.exp < Date.now()) return null;
    return t;
  }

  // ---------------------------------------------------------------- HTTP routes
  /** @returns {Promise<{status:number, body:any}>} */
  async handle(req, url, bodyBuf, ctx) {
    const path = url.pathname.replace(/^\/auth\/v1/, "") || "/";
    const method = req.method;
    const json = () => parseJsonBody(bodyBuf, {}) ?? {};
    const requireUser = async (client) => {
      if (!ctx.claims?.sub) throw authError(401, "no_authorization", "This endpoint requires a Bearer token");
      const user = await this.loadUser(client, "u.id = $1", [ctx.claims.sub]);
      if (!user) throw authError(403, "user_not_found", "User from sub claim in JWT does not exist");
      return user;
    };

    if (path === "/health" && method === "GET") return { status: 200, body: { version: "local", name: "local-gotrue", description: "Local Supabase-compatible auth stub" } };
    if (path === "/settings" && method === "GET") {
      return { status: 200, body: { external: { email: true, phone: false }, disable_signup: false, mailer_autoconfirm: true, phone_autoconfirm: false, sms_provider: "" } };
    }

    const client = await this.pool.connect();
    try {
      if (path === "/token" && method === "POST") {
        const grant = url.searchParams.get("grant_type");
        const body = json();
        if (grant === "password") {
          const email = String(body.email || "").trim().toLowerCase();
          const user = email ? await this.loadUser(client, "lower(u.email) = $1", [email]) : null;
          if (!user || !(await this.checkPassword(client, user.id, String(body.password ?? "")))) {
            throw authError(400, "invalid_credentials", "Invalid login credentials");
          }
          await client.query(`update auth.users set last_sign_in_at = now() where id = $1`, [user.id]);
          user.last_sign_in_at = new Date().toISOString();
          return { status: 200, body: await this.issueSession(client, user) };
        }
        if (grant === "refresh_token") {
          if (!body.refresh_token) throw authError(400, "validation_failed", "refresh_token required");
          return { status: 200, body: await this.refreshSession(client, String(body.refresh_token)) };
        }
        if (grant === "pkce") {
          const t = body.auth_code ? this.consumeOneTime(String(body.auth_code)) : null;
          if (!t) throw authError(400, "flow_state_not_found", "invalid flow state, no valid flow state found");
          const user = await this.loadUser(client, "u.id = $1", [t.userId]);
          if (!user) throw authError(404, "user_not_found", "User not found");
          return { status: 200, body: await this.issueSession(client, user) };
        }
        throw authError(400, "unsupported_grant_type", `Unsupported grant_type: ${grant}`);
      }

      if (path === "/signup" && method === "POST") {
        const body = json();
        if (!body.email) throw authError(400, "validation_failed", "Signup requires a valid email");
        if (!body.password || String(body.password).length < 6) throw authError(422, "weak_password", "Password should be at least 6 characters.");
        const user = await this.createUser(client, { email: body.email, password: String(body.password), data: body.data });
        const session = await this.issueSession(client, user);
        log(`[auth] signed up ${user.email} (autoconfirmed)`);
        return { status: 200, body: session };
      }

      if (path === "/user" && method === "GET") {
        const user = await requireUser(client);
        return { status: 200, body: user };
      }

      if (path === "/user" && method === "PUT") {
        const user = await requireUser(client);
        const body = json();
        if (body.password != null) {
          if (String(body.password).length < 6) throw authError(422, "weak_password", "Password should be at least 6 characters.");
          await this.setPassword(client, user.id, String(body.password));
        }
        if (body.data && typeof body.data === "object") {
          await client.query(`update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || $2::jsonb, updated_at = now() where id = $1`, [user.id, JSON.stringify(body.data)]);
        }
        if (body.email) {
          const email = String(body.email).trim().toLowerCase();
          const dup = await client.query(`select 1 from auth.users where lower(email) = $1 and id <> $2`, [email, user.id]);
          if (dup.rows.length) throw authError(422, "email_exists", "A user with this email address has already been registered");
          await client.query(`update auth.users set email = $2, updated_at = now() where id = $1`, [user.id, email]);
        }
        return { status: 200, body: await this.loadUser(client, "u.id = $1", [user.id]) };
      }

      if (path === "/logout" && method === "POST") {
        if (ctx.claims?.sub) {
          const scope = url.searchParams.get("scope") || "global";
          if (scope === "global") await this.revokeUserSessions(client, ctx.claims.sub);
          else if (ctx.claims.session_id) await client.query(`delete from auth.local_refresh_tokens where session_id = $1`, [ctx.claims.session_id]);
        }
        return { status: 204, body: null };
      }

      if (path === "/recover" && method === "POST") {
        const body = json();
        const email = String(body.email || "").trim().toLowerCase();
        const user = email ? await this.loadUser(client, "lower(u.email) = $1", [email]) : null;
        if (user) {
          const code = this.oneTime(user.id, "recovery");
          const redirect = url.searchParams.get("redirect_to") || body.redirect_to || `${config.siteUrl}/auth/callback?type=recovery`;
          const link = `${redirect}${redirect.includes("?") ? "&" : "?"}code=${code}`;
          log(`[auth] password recovery for ${email} — open: ${link}`);
        } else log(`[auth] password recovery requested for unknown email ${email}`);
        return { status: 200, body: {} };
      }

      if (path === "/resend" && method === "POST") {
        const body = json();
        log(`[auth] resend ${body.type || "signup"} requested for ${body.email || body.phone || "?"} (local: accounts are auto-confirmed, nothing to send)`);
        return { status: 200, body: {} };
      }

      if (path === "/invite" && method === "POST") {
        if (ctx.role !== "service_role") throw authError(401, "not_admin", "This endpoint requires a service_role key");
        const body = json();
        const email = String(body.email || "").trim().toLowerCase();
        let user = email ? await this.loadUser(client, "lower(u.email) = $1", [email]) : null;
        if (!user) user = await this.createUser(client, { email, data: body.data, confirmed: true });
        const code = this.oneTime(user.id, "invite", 7 * 24 * 3600);
        const redirect = url.searchParams.get("redirect_to") || body.redirect_to || `${config.siteUrl}/auth/callback`;
        const link = `${redirect}${redirect.includes("?") ? "&" : "?"}code=${code}`;
        log(`[auth] invited ${email} — open: ${link}`);
        return { status: 200, body: user };
      }

      if (path === "/verify" && (method === "POST" || method === "GET")) {
        const body = method === "POST" ? json() : Object.fromEntries(url.searchParams.entries());
        const token = body.token_hash || body.token;
        const t = token ? this.consumeOneTime(String(token)) : null;
        if (t) {
          const user = await this.loadUser(client, "u.id = $1", [t.userId]);
          if (user) return { status: 200, body: await this.issueSession(client, user) };
        }
        // Stub: accounts are auto-confirmed locally, so treat unknown tokens as already verified.
        if (body.email) {
          const user = await this.loadUser(client, "lower(u.email) = $1", [String(body.email).toLowerCase()]);
          if (user) return { status: 200, body: await this.issueSession(client, user) };
        }
        return { status: 200, body: { msg: "verified (local stub)", code: 200 } };
      }

      if (path.startsWith("/admin/")) {
        if (ctx.role !== "service_role") throw authError(401, "not_admin", "This endpoint requires a service_role key");
        const m = /^\/admin\/users(?:\/([^/]+))?$/.exec(path);
        if (m && method === "GET" && !m[1]) {
          const r = await client.query(`select to_jsonb(u) as u from auth.users u order by created_at`);
          return { status: 200, body: { users: r.rows.map((x) => this.toUser(x.u)), aud: "authenticated" } };
        }
        if (m && method === "GET" && m[1]) {
          const user = await this.loadUser(client, "u.id = $1", [m[1]]);
          if (!user) throw authError(404, "user_not_found", "User not found");
          return { status: 200, body: user };
        }
        if (m && method === "POST" && !m[1]) {
          const body = json();
          const user = await this.createUser(client, { email: body.email, password: body.password, data: body.user_metadata || body.data, confirmed: body.email_confirm !== false });
          return { status: 200, body: user };
        }
        if (m && method === "PUT" && m[1]) {
          const body = json();
          if (body.password) await this.setPassword(client, m[1], String(body.password));
          if (body.user_metadata) await client.query(`update auth.users set raw_user_meta_data = $2::jsonb, updated_at = now() where id = $1`, [m[1], JSON.stringify(body.user_metadata)]);
          if (body.email) await client.query(`update auth.users set email = $2, updated_at = now() where id = $1`, [m[1], String(body.email).toLowerCase()]);
          const user = await this.loadUser(client, "u.id = $1", [m[1]]);
          if (!user) throw authError(404, "user_not_found", "User not found");
          return { status: 200, body: user };
        }
        if (m && method === "DELETE" && m[1]) {
          await client.query(`delete from auth.users where id = $1`, [m[1]]);
          return { status: 200, body: {} };
        }
        if (path === "/admin/generate_link" && method === "POST") {
          const body = json();
          const email = String(body.email || "").toLowerCase();
          let user = await this.loadUser(client, "lower(u.email) = $1", [email]);
          if (!user) user = await this.createUser(client, { email, password: body.password, data: body.data });
          const code = this.oneTime(user.id, body.type || "magiclink", 7 * 24 * 3600);
          const redirect = body.redirect_to || `${config.siteUrl}/auth/callback`;
          const action_link = `${redirect}${redirect.includes("?") ? "&" : "?"}code=${code}`;
          return { status: 200, body: { ...user, action_link, email_otp: "", hashed_token: code, redirect_to: redirect, verification_type: body.type || "magiclink" } };
        }
      }

      throw authError(404, "not_found", `Unsupported auth endpoint: ${method} ${path}`);
    } finally {
      client.release();
    }
  }
}

export function authError(status, code, message) {
  return new HttpError(status, { code, error_code: code, msg: message, message, error: code, error_description: message });
}

function log(msg) {
  if (!config.quiet) console.log(msg);
}
