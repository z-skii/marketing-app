// Shared helpers for the local Supabase-compatible dev server: config, JWT, HTTP plumbing.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const config = {
  port: Number(process.env.LOCAL_SUPABASE_PORT || 54321),
  databaseUrl: process.env.DATABASE_URL || "postgresql://app:app@127.0.0.1:5432/storeday",
  jwtSecret: process.env.LOCAL_SUPABASE_JWT_SECRET || "local-dev-secret-please-change",
  serviceKey: process.env.LOCAL_SUPABASE_SERVICE_KEY || "local-service-role-key",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  quiet: process.env.LOCAL_SUPABASE_QUIET === "1",
  accessTokenTtl: Number(process.env.LOCAL_SUPABASE_JWT_EXP || 3600),
};

export class HttpError extends Error {
  constructor(status, body, headers = {}) {
    super(typeof body === "string" ? body : body?.message || body?.msg || `HTTP ${status}`);
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}

// ---------------------------------------------------------------- JWT (HS256)
const b64url = (buf) => Buffer.from(buf).toString("base64url");

export function signJwt(claims, secret = config.jwtSecret) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify(claims));
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

/** Returns the claims, or null when the token is not a valid HS256 JWT for our secret. Expired tokens throw. */
export function verifyJwt(token, secret = config.jwtSecret) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  let hdr;
  try {
    hdr = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (hdr?.alg !== "HS256") return null;
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest();
  const given = Buffer.from(sig, "base64url");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
    throw new HttpError(401, { code: "PGRST301", message: "JWT expired", details: null, hint: null });
  }
  return claims;
}

export const randomToken = (bytes = 24) => randomBytes(bytes).toString("base64url");

// ---------------------------------------------------------------- HTTP helpers
export function readBody(req, limit = 100 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, { message: "Payload too large" }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export function parseJsonBody(buf, fallback = undefined) {
  const text = buf.toString("utf8").trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new HttpError(400, { code: "PGRST102", message: `Empty or invalid json: ${e.message}`, details: null, hint: null });
  }
}

export function send(res, status, body, headers = {}) {
  const h = { ...headers };
  let payload;
  if (body === undefined || body === null || body === "") {
    payload = "";
  } else if (Buffer.isBuffer(body) || typeof body === "string") {
    payload = body;
  } else {
    payload = JSON.stringify(body);
    if (!h["Content-Type"]) h["Content-Type"] = "application/json; charset=utf-8";
  }
  res.writeHead(status, h);
  if (res.req?.method === "HEAD") res.end();
  else res.end(payload);
}

export function bearer(req) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

/** Splits `s` on `sep` at parenthesis depth 0, honouring double-quoted segments. */
export function splitTopLevel(s, sep = ",") {
  const out = [];
  let depth = 0;
  let quoted = false;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === "\\" && i + 1 < s.length) {
        cur += s[++i];
        continue;
      }
      if (c === '"') quoted = false;
      cur += c;
      continue;
    }
    if (c === '"') {
      quoted = true;
      cur += c;
    } else if (c === "(") {
      depth++;
      cur += c;
    } else if (c === ")") {
      depth--;
      cur += c;
    } else if (c === sep && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  if (cur !== "" || out.length) out.push(cur);
  return out.map((x) => x.trim()).filter((x) => x !== "");
}

export const unquote = (v) => (v.length >= 2 && v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1).replace(/\\(.)/g, "$1") : v);

export const nowIso = () => new Date().toISOString();
