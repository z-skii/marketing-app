// HTTP layer of the PostgREST subset: transactions with RLS context, CRUD, RPC.
import { HttpError, parseJsonBody, unquote } from "./util.mjs";
import { QueryBuilder, parseSelect, qi, pgrstError, mapPgError } from "./rest.mjs";

const OBJECT_ACCEPT = "application/vnd.pgrst.object+json";

export function parsePrefer(header) {
  const out = {};
  for (const part of String(header || "").split(",")) {
    const [k, v] = part.trim().split("=");
    if (k) out[k.trim()] = v === undefined ? true : v.trim();
  }
  return out;
}

/** Runs `fn(client)` inside a transaction that carries the caller's role and JWT claims (what RLS policies read). */
export async function withRequestTx(pool, ctx, fn, { rollback = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${qi(ctx.role)}`);
    const claims = ctx.claims || {};
    await client.query(
      `select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', $2, true),
              set_config('request.jwt.claim.email', $3, true), set_config('request.jwt.claims', $4, true),
              set_config('request.jwt.claim.session_id', $5, true)`,
      [claims.sub || "", ctx.role, claims.email || "", JSON.stringify({ ...claims, role: ctx.role }), claims.session_id || ""],
    );
    const out = await fn(client);
    await client.query(rollback ? "rollback" : "commit");
    return out;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    if (e instanceof HttpError) throw e;
    if (e && e.code && typeof e.code === "string" && /^[0-9A-Z]{5}$/.test(e.code)) throw mapPgError(e, ctx.role);
    throw e;
  } finally {
    client.release();
  }
}

export class RestHandler {
  constructor(pool, catalog) {
    this.pool = pool;
    this.catalog = catalog;
  }

  async handle(req, url, bodyBuf, ctx) {
    const method = req.method;
    const rest = url.pathname.replace(/^\/rest\/v1\/?/, "");
    if (rest === "") return { status: 200, body: { swagger: "2.0", info: { title: "local-postgrest", description: "Local PostgREST-compatible API" }, paths: {} } };
    const schema = (["GET", "HEAD"].includes(method) ? req.headers["accept-profile"] : req.headers["content-profile"]) || "public";
    if (!this.catalog.schemas.includes(schema)) {
      throw new HttpError(406, pgrstError("PGRST106", `The schema must be one of the following: ${this.catalog.schemas.join(", ")}`));
    }
    const prefer = parsePrefer(req.headers.prefer);
    const wantsObject = String(req.headers.accept || "").includes(OBJECT_ACCEPT);
    const rollback = prefer.tx === "rollback";

    if (rest.startsWith("rpc/")) {
      const fn = decodeURIComponent(rest.slice(4));
      return withRequestTx(this.pool, ctx, (client) => this.rpc(client, { method, schema, fn, url, bodyBuf, prefer, wantsObject, req }), { rollback });
    }
    const table = decodeURIComponent(rest.split("/")[0]);
    const rel = await this.catalog.relation(schema, table);
    if (!rel) {
      throw new HttpError(404, pgrstError("PGRST205", `Could not find the table '${schema}.${table}' in the schema cache`, null, `Perhaps you meant one of the tables in schema '${schema}'`));
    }
    const args = { method, schema, rel, url, bodyBuf, prefer, wantsObject, req };
    switch (method) {
      case "GET":
      case "HEAD":
        return withRequestTx(this.pool, ctx, (client) => this.read(client, args), { rollback });
      case "POST":
        return withRequestTx(this.pool, ctx, (client) => this.insert(client, args), { rollback });
      case "PATCH":
        return withRequestTx(this.pool, ctx, (client) => this.update(client, args), { rollback });
      case "PUT":
        return withRequestTx(this.pool, ctx, (client) => this.insert(client, { ...args, prefer: { ...prefer, resolution: "merge-duplicates" } }), { rollback });
      case "DELETE":
        return withRequestTx(this.pool, ctx, (client) => this.remove(client, args), { rollback });
      default:
        throw new HttpError(405, pgrstError("PGRST105", `Method ${method} not allowed`));
    }
  }

  // ---------------------------------------------------------------- shared response shaping
  finish({ rows, count, offset, status, wantsObject, prefer, head }) {
    let body = rows;
    let code = status;
    if (wantsObject) {
      if (rows.length !== 1) {
        throw new HttpError(406, pgrstError("PGRST116", "JSON object requested, multiple (or no) rows returned", `The result contains ${rows.length} rows`, null));
      }
      body = rows[0];
    }
    const total = count == null ? "*" : String(count);
    const range = rows.length ? `${offset}-${offset + rows.length - 1}/${total}` : `*/${total}`;
    const headers = { "Content-Range": range, "Range-Unit": "items" };
    if (prefer && Object.keys(prefer).length) headers["Preference-Applied"] = Object.entries(prefer).map(([k, v]) => (v === true ? k : `${k}=${v}`)).join(", ");
    if (head) return { status: code, body: null, headers };
    return { status: code, body, headers };
  }

  rangeFrom(req, url) {
    let limit = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : null;
    let offset = url.searchParams.has("offset") ? Number(url.searchParams.get("offset")) : 0;
    const range = req.headers.range;
    if (range && limit == null) {
      const m = /^(?:items=)?(\d+)-(\d+)?$/.exec(range.trim());
      if (m) {
        offset = Number(m[1]);
        if (m[2] !== undefined) limit = Number(m[2]) - offset + 1;
      }
    }
    return { limit, offset };
  }

  /** Runs the shaped query. `cte` (a data-modifying statement) is placed at the top level as `_src`, which then acts as the source. */
  async representation(client, qb, root, source, { withCount = false, cte = null } = {}) {
    const prefix = cte ? `with _src as (${cte}) ` : "";
    const sql = `${prefix}select to_json(_r) as j from (${qb.renderNode(root, source)}) _r`;
    const res = await client.query(sql, qb.params);
    const rows = res.rows.map((r) => r.j);
    let count = null;
    if (withCount) {
      if (cte) count = rows.length;
      else count = (await client.query(`select count(*)::int as n from (${qb.renderNode(root, source, [], { noLimit: true })}) _c`, qb.params)).rows[0].n;
    }
    return { rows, count };
  }

  wantsCount(prefer) {
    return ["exact", "planned", "estimated"].includes(prefer.count);
  }

  // ---------------------------------------------------------------- GET / HEAD
  async read(client, { method, schema, rel, url, prefer, wantsObject, req }) {
    const qb = new QueryBuilder(this.catalog, schema);
    const root = await qb.buildRoot(rel, parseSelect(url.searchParams.get("select")), url.searchParams);
    const { limit, offset } = this.rangeFrom(req, url);
    root.limit = limit;
    root.offset = offset;
    const source = qb.relSource(rel);
    const head = method === "HEAD";
    let rows = [];
    let count = null;
    if (head) {
      if (this.wantsCount(prefer)) {
        const c = await client.query(`select count(*)::int as n from (${qb.renderNode(root, source, [], { noLimit: true })}) _c`, qb.params);
        count = c.rows[0].n;
      }
    } else {
      ({ rows, count } = await this.representation(client, qb, root, source, { withCount: this.wantsCount(prefer) }));
    }
    return this.finish({ rows, count, offset: offset || 0, status: 200, wantsObject: wantsObject && !head, prefer, head });
  }

  // ---------------------------------------------------------------- POST (insert / upsert)
  async insert(client, { schema, rel, url, bodyBuf, prefer, wantsObject }) {
    const body = parseJsonBody(bodyBuf, null);
    if (body === null || body === undefined) throw new HttpError(400, pgrstError("PGRST102", "Empty or invalid json"));
    const rows = Array.isArray(body) ? body : [body];
    const columns = url.searchParams.has("columns")
      ? url.searchParams.get("columns").split(",").map((c) => unquote(c.trim())).filter(Boolean)
      : [...new Set(rows.flatMap((r) => Object.keys(r || {})))];
    for (const c of columns) {
      if (!rel.columnMap.has(c)) throw new HttpError(400, pgrstError("PGRST204", `Could not find the '${c}' column of '${rel.name}' in the schema cache`));
    }
    const qb = new QueryBuilder(this.catalog, schema);
    const root = await qb.buildRoot(rel, parseSelect(url.searchParams.get("select")), url.searchParams);
    const target = qb.relSource(rel);
    const payload = qb.push(JSON.stringify(rows));
    let insertSql;
    if (columns.length === 0) {
      insertSql = `insert into ${target} default values`;
      if (rows.length !== 1) throw new HttpError(400, pgrstError("PGRST102", "All object keys must match when inserting multiple rows without columns"));
    } else {
      const exprs = columns.map((c) => {
        const col = rel.columnMap.get(c);
        if (prefer.missing === "default" && col.def) return `case when _j.v ? ${sqlLit(c)} then _p.${qi(c)} else ${col.def} end`;
        return `_p.${qi(c)}`;
      });
      insertSql = `insert into ${target} (${columns.map(qi).join(", ")}) select ${exprs.join(", ")} from jsonb_array_elements(${payload}::jsonb) with ordinality as _j(v, ord), jsonb_populate_record(null::${target}, _j.v) as _p order by _j.ord`;
    }
    if (prefer.resolution) {
      const conflictCols = url.searchParams.has("on_conflict") ? url.searchParams.get("on_conflict").split(",").map((c) => unquote(c.trim())) : rel.pk;
      if (!conflictCols.length) throw new HttpError(400, pgrstError("PGRST102", `Table '${rel.name}' has no primary key; pass onConflict for upserts`));
      const conflict = `(${conflictCols.map(qi).join(", ")})`;
      if (prefer.resolution === "ignore-duplicates") insertSql += ` on conflict ${conflict} do nothing`;
      else {
        const setCols = columns.filter((c) => !conflictCols.includes(c));
        insertSql += setCols.length ? ` on conflict ${conflict} do update set ${setCols.map((c) => `${qi(c)} = excluded.${qi(c)}`).join(", ")}` : ` on conflict ${conflict} do nothing`;
      }
    }
    const wantsRepr = prefer.return === "representation";
    if (!wantsRepr && !wantsObject) {
      const res = await client.query(`with _src as (${insertSql} returning 1) select count(*)::int as n from _src`, qb.params);
      const n = res.rows[0].n;
      const headers = { "Content-Range": `*/${this.wantsCount(prefer) ? n : "*"}` };
      return { status: 201, body: null, headers };
    }
    const { rows: out, count } = await this.representation(client, qb, root, "_src", { withCount: this.wantsCount(prefer), cte: `${insertSql} returning *` });
    return this.finish({ rows: out, count, offset: 0, status: 201, wantsObject, prefer });
  }

  // ---------------------------------------------------------------- PATCH
  async update(client, { schema, rel, url, bodyBuf, prefer, wantsObject }) {
    const body = parseJsonBody(bodyBuf, null);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, pgrstError("PGRST102", "PATCH body must be a JSON object"));
    const columns = Object.keys(body);
    for (const c of columns) {
      if (!rel.columnMap.has(c)) throw new HttpError(400, pgrstError("PGRST204", `Could not find the '${c}' column of '${rel.name}' in the schema cache`));
    }
    const qb = new QueryBuilder(this.catalog, schema);
    const root = await qb.buildRoot(rel, parseSelect(url.searchParams.get("select")), url.searchParams);
    this.requireFilters(qb, root, "UPDATE");
    const target = qb.relSource(rel);
    const alias = qi(root.alias);
    const where = qb.renderWhere(root);
    let mutation;
    if (columns.length === 0) {
      mutation = `select ${alias}.* from ${target} as ${alias}${where}`;
    } else {
      const payload = qb.push(JSON.stringify(body));
      const sets = columns.map((c) => `${qi(c)} = _upd.${qi(c)}`).join(", ");
      mutation = `update ${target} as ${alias} set ${sets} from jsonb_populate_record(null::${target}, ${payload}::jsonb) as _upd${where} returning ${alias}.*`;
    }
    return this.mutationResult(client, qb, root, mutation, prefer, wantsObject, 200);
  }

  // ---------------------------------------------------------------- DELETE
  async remove(client, { schema, rel, url, prefer, wantsObject }) {
    const qb = new QueryBuilder(this.catalog, schema);
    const root = await qb.buildRoot(rel, parseSelect(url.searchParams.get("select")), url.searchParams);
    this.requireFilters(qb, root, "DELETE");
    const target = qb.relSource(rel);
    const alias = qi(root.alias);
    const mutation = `delete from ${target} as ${alias}${qb.renderWhere(root)} returning ${alias}.*`;
    return this.mutationResult(client, qb, root, mutation, prefer, wantsObject, 200, 204);
  }

  requireFilters(qb, root, verb) {
    if (root.where.length === 0 && qb.innerConditions(root).length === 0) {
      throw new HttpError(400, pgrstError("PGRST102", `Refusing to ${verb} without any filters (local safety rule; add .eq()/.in()/... to the query)`));
    }
  }

  async mutationResult(client, qb, root, mutation, prefer, wantsObject, status, minimalStatus = 204) {
    const wantsRepr = prefer.return === "representation";
    // Filters and order live on the mutation itself; the representation only shapes the returned rows.
    const shaped = { ...root, where: [], order: root.order, limit: null, offset: null };
    if (!wantsRepr && !wantsObject) {
      const res = await client.query(`with _src as (${mutation}) select count(*)::int as n from _src`, qb.params);
      return { status: minimalStatus, body: null, headers: { "Content-Range": `*/${this.wantsCount(prefer) ? res.rows[0].n : "*"}` } };
    }
    const { rows, count } = await this.representation(client, qb, shaped, "_src", { withCount: this.wantsCount(prefer), cte: mutation });
    return this.finish({ rows, count, offset: 0, status, wantsObject, prefer });
  }

  // ---------------------------------------------------------------- RPC
  async rpc(client, { method, schema, fn, url, bodyBuf, prefer, wantsObject, req }) {
    const isGet = method === "GET" || method === "HEAD";
    const overloads = await this.catalog.functions(schema, fn);
    let args;
    if (isGet) {
      args = {};
      const names = new Set(overloads.flatMap((f) => f.args.map((a) => a.name)));
      for (const [k, v] of url.searchParams.entries()) if (names.has(k)) args[k] = v;
    } else {
      const parsed = parseJsonBody(bodyBuf, {});
      args = parsed && typeof parsed === "object" ? parsed : {};
    }
    const provided = Object.keys(args);
    const single = overloads.find((f) => f.args.length === 1 && !f.args[0].name && /^jsonb?$/.test(f.args[0].type));
    let chosen = overloads
      .filter((f) => provided.every((p) => f.args.some((a) => a.name === p)) && f.args.slice(0, f.required).every((a) => provided.includes(a.name)))
      .sort((a, b) => b.args.length - a.args.length)[0];
    let call;
    const qb = new QueryBuilder(this.catalog, schema);
    if (!chosen && single && !isGet) {
      chosen = single;
      call = `${qi(schema)}.${qi(fn)}(${qb.push(JSON.stringify(args))}::${single.args[0].type})`;
    } else if (chosen) {
      const parts = [];
      for (const a of chosen.args) {
        if (!(a.name in args)) continue;
        parts.push(`${qi(a.name)} => ${qb.push(serializeArg(args[a.name], a.type))}::${a.type}`);
      }
      call = `${qi(schema)}.${qi(fn)}(${parts.join(", ")})`;
    } else {
      throw new HttpError(
        404,
        pgrstError(
          "PGRST202",
          `Could not find the function ${schema}.${fn}(${provided.join(", ")}) in the schema cache`,
          `Searched for the function ${schema}.${fn} with parameter${provided.length === 1 ? "" : "s"} ${provided.join(", ") || "(none)"} or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.`,
          overloads.length ? `Perhaps you meant to call the function ${schema}.${fn}(${overloads[0].args.map((a) => a.name).join(", ")})` : null,
        ),
      );
    }

    const head = method === "HEAD";
    if (chosen.returnsVoid) {
      await client.query(`select ${call}`, qb.params);
      return { status: 204, body: null, headers: { "Content-Range": "*/*" } };
    }

    // Filters on the function result (select/order/limit/filters) apply to set-returning composite results.
    const retRel = chosen.returnsComposite ? await this.catalog.relation(schema, chosen.rettype.replace(/^[^.]+\./, "")) : null;
    const ignoreKeys = new Set(Object.keys(args));
    if (chosen.retset && chosen.returnsComposite) {
      const root = await qb.buildRoot(retRel, parseSelect(url.searchParams.get("select")), url.searchParams, { ignoreKeys, rpcArgs: true });
      const { limit, offset } = this.rangeFrom(req, url);
      root.limit = limit;
      root.offset = offset;
      let rows = [];
      let count = null;
      if (head) {
        if (this.wantsCount(prefer)) {
          const c = await client.query(`select count(*)::int as n from (${qb.renderNode(root, call, [], { noLimit: true })}) _c`, qb.params);
          count = c.rows[0].n;
        }
      } else ({ rows, count } = await this.representation(client, qb, root, call, { withCount: this.wantsCount(prefer) }));
      return this.finish({ rows, count, offset: offset || 0, status: 200, wantsObject: wantsObject && !head, prefer, head });
    }
    if (chosen.retset) {
      const { limit, offset } = this.rangeFrom(req, url);
      let sql = `select to_json(_x) as j from ${call} as _x`;
      if (limit != null) sql += ` limit ${Math.max(0, limit)}`;
      if (offset) sql += ` offset ${offset}`;
      const res = await client.query(sql, qb.params);
      const rows = res.rows.map((r) => r.j);
      let count = null;
      if (this.wantsCount(prefer)) count = (await client.query(`select count(*)::int as n from ${call} as _x`, qb.params)).rows[0].n;
      return this.finish({ rows, count, offset: offset || 0, status: 200, wantsObject: wantsObject && !head, prefer, head });
    }
    if (chosen.returnsComposite) {
      const root = await qb.buildRoot(retRel, parseSelect(url.searchParams.get("select")), url.searchParams, { ignoreKeys, rpcArgs: true });
      const { rows } = await this.representation(client, qb, root, call);
      const headers = { "Content-Range": rows.length ? `0-${rows.length - 1}/*` : "*/*" };
      return { status: 200, body: head ? null : (rows[0] ?? null), headers };
    }
    const res = await client.query(`select to_json(${call}) as j`, qb.params);
    const value = res.rows[0]?.j ?? null;
    return { status: 200, body: head ? null : JSON.stringify(value), headers: { "Content-Type": "application/json; charset=utf-8", "Content-Range": "0-0/*" } };
  }
}

const sqlLit = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Converts a JSON argument into something `pg` can bind for the declared Postgres type. */
function serializeArg(value, type) {
  if (value === null || value === undefined) return null;
  if (/^jsonb?$/.test(type)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (type.endsWith("[]")) return value; // pg serializes JS arrays as Postgres array literals
    return JSON.stringify(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}
