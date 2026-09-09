#!/usr/bin/env node
// Local Supabase-compatible dev server: GoTrue + PostgREST + Storage subsets over the local Postgres.
// Usage: node scripts/local-supabase/server.mjs   (env: LOCAL_SUPABASE_PORT, DATABASE_URL, LOCAL_SUPABASE_JWT_SECRET,
//        LOCAL_SUPABASE_SERVICE_KEY, LOCAL_SUPABASE_QUIET=1, LOCAL_STORAGE_DIR)
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { config, HttpError, readBody, send, bearer, verifyJwt } from "./util.mjs";
import { Catalog } from "./rest.mjs";
import { RestHandler } from "./rest-handler.mjs";
import { Auth } from "./auth.mjs";
import { Storage } from "./storage.mjs";

const require = createRequire(import.meta.url);
const pg = require("pg");

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..", "..");
const storageDir = process.env.LOCAL_STORAGE_DIR || path.join(projectRoot, ".local-storage");

// pg type parsers: match PostgREST/JSON semantics for the few places rows are read directly.
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v))); // int8
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v))); // numeric
pg.types.setTypeParser(701, (v) => (v === null ? null : Number(v))); // float8
pg.types.setTypeParser(1082, (v) => v); // date → "YYYY-MM-DD"
pg.types.setTypeParser(1114, (v) => v); // timestamp
pg.types.setTypeParser(1184, (v) => (v === null ? null : new Date(v).toISOString())); // timestamptz → ISO

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "Content-Range, Content-Length, Range-Unit, Location, X-Supabase-Api-Version, Preference-Applied",
  "Access-Control-Max-Age": "86400",
};

export async function createServer(options = {}) {
  const port = options.port ?? config.port;
  const pool = new pg.Pool({ connectionString: options.databaseUrl || config.databaseUrl, max: 10 });
  pool.on("error", (e) => console.error("[pg] pool error", e.message));
  const catalog = new Catalog(pool, ["public"]);
  const rest = new RestHandler(pool, catalog);
  const auth = new Auth(pool);
  const storage = new Storage(pool, options.storageDir || storageDir);
  await auth.init();
  await storage.init();
  await ensureAnonGrants(pool);
  await catalog.get(true);

  /** Who is calling: anon | authenticated | service_role, plus JWT claims. */
  function authContext(req) {
    const token = bearer(req) || req.headers.apikey || null;
    if (!token) return { role: "anon", claims: null, token: null };
    if (token === config.serviceKey) return { role: "service_role", claims: { role: "service_role" }, token };
    if (token.split(".").length === 3) {
      let claims = null;
      try {
        claims = verifyJwt(token);
      } catch (e) {
        throw e; // expired → 401
      }
      if (!claims) {
        // Not signed by us: a real Supabase anon/publishable JWT still means "anonymous".
        try {
          const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
          if (payload?.role === "anon") return { role: "anon", claims: null, token };
        } catch {
          /* fallthrough */
        }
        throw new HttpError(401, { code: "PGRST301", message: "invalid JWT: signature verification failed", details: null, hint: null });
      }
      const role = claims.role === "service_role" || claims.role === "anon" ? claims.role : "authenticated";
      return { role, claims, token };
    }
    return { role: "anon", claims: null, token };
  }

  async function route(req, res, url) {
    const p = url.pathname;
    if (req.method === "OPTIONS") {
      const reqHeaders = req.headers["access-control-request-headers"];
      return send(res, 204, null, { ...CORS, ...(reqHeaders ? { "Access-Control-Allow-Headers": reqHeaders } : {}) });
    }
    if (p === "/" || p === "/health") return send(res, 200, { name: "local-supabase", status: "ok", services: ["auth", "rest", "storage"] }, CORS);
    if (p.startsWith("/realtime/")) {
      return send(res, 404, { message: "Realtime is not available in the local dev server" }, CORS);
    }
    const body = await readBody(req);
    const ctx = authContext(req);
    let out;
    if (p.startsWith("/auth/v1")) out = await auth.handle(req, url, body, ctx);
    else if (p.startsWith("/rest/v1")) out = await rest.handle(req, url, body, ctx);
    else if (p.startsWith("/storage/v1")) out = await storage.handle(req, res, url, body, ctx);
    else if (p.startsWith("/functions/v1")) throw new HttpError(404, { code: "not_found", message: "Edge functions are not available locally" });
    else throw new HttpError(404, { message: `No route for ${req.method} ${p}` });

    const headers = { ...CORS, ...(out.headers || {}) };
    if (p.startsWith("/auth/v1")) headers["X-Supabase-Api-Version"] = "2024-01-01";
    if (out.stream) {
      res.writeHead(out.status, headers);
      out.stream.on("error", () => res.destroy());
      out.stream.pipe(res);
      return;
    }
    send(res, out.status, out.body, headers);
  }

  const server = http.createServer(async (req, res) => {
    const started = performance.now();
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    res.on("finish", () => {
      if (!config.quiet) console.log(`${req.method} ${url.pathname}${url.search ? url.search.slice(0, 120) : ""} ${res.statusCode} ${(performance.now() - started).toFixed(1)}ms`);
    });
    try {
      await route(req, res, url);
    } catch (e) {
      if (e instanceof HttpError) {
        send(res, e.status, e.body, { ...CORS, ...e.headers });
      } else {
        console.error(`[error] ${req.method} ${url.pathname}:`, e);
        send(res, 500, { code: "XX000", message: e?.message || "Internal error", details: null, hint: null }, CORS);
      }
    }
  });
  // Realtime websocket upgrade → refuse quickly so supabase-js falls back to polling/backoff.
  server.on("upgrade", (req, socket) => {
    socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
    socket.destroy();
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const actualPort = server.address().port;
  const close = async () => {
    await new Promise((r) => server.close(r));
    await pool.end();
  };
  return { server, pool, catalog, port: actualPort, url: `http://127.0.0.1:${actualPort}`, close };
}

/** Supabase's default privileges grant anon/authenticated/service_role on everything in `public`; the local shim only grants
 *  authenticated/service_role, so mirror the rest here (RLS still decides what anon can actually see). */
async function ensureAnonGrants(pool) {
  const stmts = [
    "grant usage on schema public to anon",
    "grant select, insert, update, delete on all tables in schema public to anon",
    "grant usage, select on all sequences in schema public to anon",
    "grant execute on all functions in schema public to anon",
    "alter default privileges in schema public grant select, insert, update, delete on tables to anon",
    "alter default privileges in schema public grant execute on functions to anon",
  ];
  for (const sql of stmts) {
    try {
      await pool.query(sql);
    } catch (e) {
      if (!config.quiet) console.warn(`[startup] ${sql}: ${e.message}`);
    }
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  createServer()
    .then(({ url }) => {
      console.log(`local-supabase listening on ${url}`);
      console.log(`  db: ${config.databaseUrl}`);
      console.log(`  storage: ${storageDir}`);
      console.log(`  anon key: any value (e.g. local-anon-key) · service key: ${config.serviceKey}`);
    })
    .catch((e) => {
      console.error("failed to start local-supabase:", e);
      process.exit(1);
    });
}
