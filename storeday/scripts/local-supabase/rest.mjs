// PostgREST-compatible subset: schema cache, select/embed parsing, filter parsing, SQL generation.
// Every result row is rendered by Postgres itself (`to_json(row)`) so types come back exactly like PostgREST.
import { HttpError, splitTopLevel, unquote } from "./util.mjs";

const RELKINDS = ["r", "v", "m", "p", "f"];

// ================================================================ schema cache
export class Catalog {
  constructor(pool, schemas = ["public"]) {
    this.pool = pool;
    this.schemas = schemas;
    this.loadedAt = 0;
    this.ttlMs = 10_000;
    this.data = null;
    this.loading = null;
  }

  async get(force = false) {
    if (!force && this.data && Date.now() - this.loadedAt < this.ttlMs) return this.data;
    if (!this.loading) this.loading = this.load().finally(() => (this.loading = null));
    return this.loading;
  }

  async relation(schema, name) {
    let cat = await this.get();
    let rel = cat.relations.get(`${schema}.${name}`);
    if (!rel) {
      cat = await this.get(true);
      rel = cat.relations.get(`${schema}.${name}`);
    }
    return rel || null;
  }

  async functions(schema, name) {
    let cat = await this.get();
    let fns = cat.functions.get(`${schema}.${name}`);
    if (!fns) {
      cat = await this.get(true);
      fns = cat.functions.get(`${schema}.${name}`);
    }
    return fns || [];
  }

  async load() {
    const schemas = this.schemas;
    const client = await this.pool.connect();
    try {
      const rels = await client.query(
        `select n.nspname as schema, c.relname as name, c.relkind as kind
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = any($1) and c.relkind = any($2)`,
        [schemas, RELKINDS],
      );
      const cols = await client.query(
        `select n.nspname as schema, c.relname as rel, a.attname as name, format_type(a.atttypid, a.atttypmod) as type,
                pg_get_expr(d.adbin, d.adrelid) as def, a.attnum,
                exists (select 1 from pg_constraint k where k.conrelid = c.oid and k.contype = 'p' and a.attnum = any (k.conkey)) as pk
         from pg_attribute a
         join pg_class c on c.oid = a.attrelid
         join pg_namespace n on n.oid = c.relnamespace
         left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
         where n.nspname = any($1) and c.relkind = any($2) and a.attnum > 0 and not a.attisdropped
         order by a.attnum`,
        [schemas, RELKINDS],
      );
      const fks = await client.query(
        `select k.conname as name, n.nspname as schema, c.relname as "table",
                (select array_agg(a.attname::text order by x.ord) from unnest(k.conkey) with ordinality x(attnum, ord)
                   join pg_attribute a on a.attrelid = k.conrelid and a.attnum = x.attnum) as cols,
                fn.nspname as fschema, fc.relname as ftable,
                (select array_agg(a.attname::text order by x.ord) from unnest(k.confkey) with ordinality x(attnum, ord)
                   join pg_attribute a on a.attrelid = k.confrelid and a.attnum = x.attnum) as fcols
         from pg_constraint k
         join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace
         join pg_class fc on fc.oid = k.confrelid join pg_namespace fn on fn.oid = fc.relnamespace
         where k.contype = 'f' and n.nspname = any($1) and fn.nspname = any($1)`,
        [schemas],
      );
      const fns = await client.query(
        `select p.oid::int as oid, n.nspname as schema, p.proname as name, p.proretset as retset,
                format_type(p.prorettype, null) as rettype, t.typtype as rettyptype, t.typrelid::int as retrelid,
                p.pronargdefaults as ndefaults, coalesce(p.proargnames, '{}'::text[]) as argnames, p.proargmodes::text[] as argmodes,
                (select array_agg(format_type(x.t, null) order by x.ord)
                   from unnest(coalesce(p.proallargtypes, p.proargtypes::oid[])) with ordinality x(t, ord)) as argtypes
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type t on t.oid = p.prorettype
         where n.nspname = any($1) and p.prokind = 'f'`,
        [schemas],
      );

      const relations = new Map();
      for (const r of rels.rows) relations.set(`${r.schema}.${r.name}`, { schema: r.schema, name: r.name, kind: r.kind, columns: [], columnMap: new Map(), pk: [] });
      for (const c of cols.rows) {
        const rel = relations.get(`${c.schema}.${c.rel}`);
        if (!rel) continue;
        const col = { name: c.name, type: c.type, def: c.def, pk: c.pk };
        rel.columns.push(col);
        rel.columnMap.set(c.name, col);
        if (c.pk) rel.pk.push(c.name);
      }
      const foreignKeys = fks.rows.map((f) => ({ name: f.name, schema: f.schema, table: f.table, cols: f.cols, fschema: f.fschema, ftable: f.ftable, fcols: f.fcols }));
      const functions = new Map();
      for (const f of fns.rows) {
        const modes = f.argmodes || [];
        const argtypes = f.argtypes || [];
        const args = [];
        for (let i = 0; i < argtypes.length; i++) {
          const mode = modes[i] || "i";
          if (mode === "i" || mode === "b" || mode === "v") args.push({ name: f.argnames[i] || "", type: argtypes[i], mode });
        }
        const required = Math.max(0, args.length - f.ndefaults);
        const fn = {
          oid: f.oid,
          schema: f.schema,
          name: f.name,
          retset: f.retset,
          rettype: f.rettype,
          rettyptype: f.rettyptype,
          retrelid: f.retrelid,
          args,
          required,
          returnsVoid: f.rettype === "void",
          returnsComposite: f.rettyptype === "c" || f.rettype === "record",
        };
        const key = `${f.schema}.${f.name}`;
        if (!functions.has(key)) functions.set(key, []);
        functions.get(key).push(fn);
      }
      this.data = { relations, foreignKeys, functions };
      this.loadedAt = Date.now();
      return this.data;
    } finally {
      client.release();
    }
  }
}

// ================================================================ identifiers & expressions
export const qi = (s) => `"${String(s).replace(/"/g, '""')}"`;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Parses `col`, `col->a->>b`, `col::cast` into a SQL expression on `alias`. Returns {sql, name}. */
function columnExpr(alias, raw) {
  let cast = null;
  let expr = raw;
  const castIdx = expr.indexOf("::");
  if (castIdx >= 0) {
    cast = expr.slice(castIdx + 2);
    expr = expr.slice(0, castIdx);
  }
  const parts = expr.split(/(->>|->)/);
  const base = parts[0].trim();
  let sql = base === "*" ? `${qi(alias)}.*` : `${qi(alias)}.${qi(base)}`;
  let name = base;
  for (let i = 1; i < parts.length; i += 2) {
    const op = parts[i];
    const key = parts[i + 1].trim();
    sql += /^\d+$/.test(key) ? `${op}${key}` : `${op}${lit(key)}`;
    name = key;
  }
  if (cast) {
    if (!/^[a-zA-Z_][\w. \[\]]*$/.test(cast)) throw new HttpError(400, pgrstError("PGRST100", `Invalid cast "${cast}"`));
    sql = `(${sql})::${cast}`;
  }
  return { sql, name, base };
}

export const pgrstError = (code, message, details = null, hint = null) => ({ code, message, details, hint });

// ================================================================ select parsing
/** select=a,b:c,d::text,rel!inner(x,y),alias:rel!fk(*) → tree */
export function parseSelect(select) {
  const items = splitTopLevel(select || "*");
  return items.map(parseSelectItem);
}

function parseSelectItem(item) {
  const paren = item.indexOf("(");
  if (paren >= 0 && item.endsWith(")")) {
    const head = item.slice(0, paren);
    const inner = item.slice(paren + 1, -1);
    let alias = null;
    let name = head;
    const colon = head.indexOf(":");
    if (colon >= 0) {
      alias = head.slice(0, colon);
      name = head.slice(colon + 1);
    }
    const hints = name.split("!");
    name = hints.shift();
    let inner_ = false;
    let hint = null;
    for (const h of hints) {
      if (h === "inner") inner_ = true;
      else if (h === "left") inner_ = false;
      else hint = h;
    }
    return { kind: "embed", name, alias: alias || name, hint, inner: inner_, children: parseSelect(inner.trim() || "*") };
  }
  let alias = null;
  let expr = item;
  const colon = item.indexOf(":");
  if (colon >= 0 && !item.startsWith("::")) {
    alias = item.slice(0, colon);
    expr = item.slice(colon + 1);
  }
  return { kind: "column", expr: expr.trim(), alias };
}

// ================================================================ filter parsing
const OPS = {
  eq: (c, p) => `${c} = ${p()}`,
  neq: (c, p) => `${c} <> ${p()}`,
  gt: (c, p) => `${c} > ${p()}`,
  gte: (c, p) => `${c} >= ${p()}`,
  lt: (c, p) => `${c} < ${p()}`,
  lte: (c, p) => `${c} <= ${p()}`,
  like: (c, p) => `${c} like ${p((v) => v.replace(/\*/g, "%"))}`,
  ilike: (c, p) => `${c} ilike ${p((v) => v.replace(/\*/g, "%"))}`,
  match: (c, p) => `${c} ~ ${p()}`,
  imatch: (c, p) => `${c} ~* ${p()}`,
  isdistinct: (c, p) => `${c} is distinct from ${p()}`,
  cs: (c, p) => `${c} @> ${p()}`,
  cd: (c, p) => `${c} <@ ${p()}`,
  ov: (c, p) => `${c} && ${p()}`,
  sl: (c, p) => `${c} << ${p()}`,
  sr: (c, p) => `${c} >> ${p()}`,
  nxr: (c, p) => `${c} &< ${p()}`,
  nxl: (c, p) => `${c} &> ${p()}`,
  adj: (c, p) => `${c} -|- ${p()}`,
};
const FTS = { fts: "to_tsquery", plfts: "plainto_tsquery", phfts: "phraseto_tsquery", wfts: "websearch_to_tsquery" };

/** Parses "op.value" (with optional "not." prefix) into a condition callback. */
function parseOpValue(raw) {
  let negate = false;
  let rest = raw;
  if (rest.startsWith("not.")) {
    negate = true;
    rest = rest.slice(4);
  }
  const dot = rest.indexOf(".");
  const op = dot >= 0 ? rest.slice(0, dot) : rest;
  const value = dot >= 0 ? rest.slice(dot + 1) : "";
  return { negate, op, value };
}

/** Renders a single column condition. `params` is the shared parameter array. */
function renderCondition(alias, column, { negate, op, value }, params) {
  const { sql: col } = columnExpr(alias, column);
  const push = (v) => {
    params.push(v);
    return `$${params.length}`;
  };
  let sql;
  if (op === "in") {
    const inner = value.startsWith("(") && value.endsWith(")") ? value.slice(1, -1) : value;
    const vals = splitTopLevel(inner).map(unquote);
    sql = vals.length ? `${col} in (${vals.map((v) => push(v)).join(", ")})` : "false";
  } else if (op === "is") {
    const v = value.toLowerCase();
    if (v === "null") sql = `${col} is null`;
    else if (v === "not_null" || v === "not.null") sql = `${col} is not null`;
    else if (v === "true" || v === "false" || v === "unknown") sql = `${col} is ${v}`;
    else throw new HttpError(400, pgrstError("PGRST100", `Unexpected value for "is" operator: ${value}`));
  } else if (op in FTS) {
    sql = `${col} @@ ${FTS[op]}(${push(value)})`;
  } else if (/^(fts|plfts|phfts|wfts)\(\w+\)$/.test(op)) {
    const m = /^(\w+)\((\w+)\)$/.exec(op);
    sql = `${col} @@ ${FTS[m[1]]}(${lit(m[2])}, ${push(value)})`;
  } else if (op in OPS) {
    sql = OPS[op](col, (xform) => push(xform ? xform(value) : value));
  } else {
    throw new HttpError(400, pgrstError("PGRST100", `Unknown operator "${op}" in filter for column "${column}"`, `unexpected "${op}"`));
  }
  return negate ? `not (${sql})` : sql;
}

/** Parses a logic tree "or=(a.eq.1,b.eq.2,and(c.gt.3))" into SQL. */
function renderLogic(alias, kind, value, params, negate = false) {
  const inner = value.startsWith("(") && value.endsWith(")") ? value.slice(1, -1) : value;
  const items = splitTopLevel(inner);
  const parts = items.map((item) => {
    const m = /^(not\.)?(and|or)\((.*)\)$/s.exec(item);
    if (m) return renderLogic(alias, m[2], `(${m[3]})`, params, Boolean(m[1]));
    // column.op.value — the column may itself contain json arrows, never dots.
    const dot = item.indexOf(".");
    if (dot < 0) throw new HttpError(400, pgrstError("PGRST100", `Unexpected filter in logic tree: ${item}`));
    const column = item.slice(0, dot);
    const rest = item.slice(dot + 1);
    const parsed = parseOpValue(rest);
    parsed.value = unquote(parsed.value);
    return renderCondition(alias, column, parsed, params);
  });
  const joined = parts.length ? `(${parts.join(kind === "or" ? " or " : " and ")})` : "true";
  return negate ? `not ${joined}` : joined;
}

// ================================================================ query tree
const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns", "and", "or", "not.and", "not.or"]);

/**
 * A node is one relation in the response shape.
 * { rel, alias, fields: [...], embeds: [{...}], where: [sql], order: [], limit, offset }
 */
export class QueryBuilder {
  constructor(catalog, schema) {
    this.catalog = catalog;
    this.schema = schema;
    this.params = [];
    this.aliasSeq = 0;
  }

  nextAlias() {
    return `_t${this.aliasSeq++}`;
  }

  push(v) {
    this.params.push(v);
    return `$${this.params.length}`;
  }

  /** Builds the root node for a relation (or a function-returned row type, `rel` may be null for scalar sources). */
  async buildRoot(rel, selectTree, searchParams, opts = {}) {
    const root = await this.buildNode(rel, selectTree, opts);
    await this.applyParams(root, searchParams, opts);
    return root;
  }

  async buildNode(rel, selectTree, opts) {
    const node = { rel, alias: this.nextAlias(), fields: [], embeds: [], where: [], order: [], limit: null, offset: null };
    for (const item of selectTree) {
      if (item.kind === "column") {
        node.fields.push(item);
      } else {
        if (!rel) throw new HttpError(400, pgrstError("PGRST200", `Cannot embed "${item.name}" on a scalar result`));
        const join = await this.resolveEmbed(rel, item);
        const child = await this.buildNode(join.target, item.children, opts);
        node.embeds.push({ ...item, join, node: child });
      }
    }
    return node;
  }

  /** Resolves an embedded resource name (+hint) into a join description via foreign keys. */
  async resolveEmbed(parent, item) {
    const cat = await this.catalog.get();
    const { name, hint } = item;
    const parentKey = `${parent.schema}.${parent.name}`;
    const targetByName = cat.relations.get(`${this.schema}.${name}`) || cat.relations.get(`${parent.schema}.${name}`);
    const candidates = [];

    const hintOk = (fk, tableForHint) => !hint || hint === fk.name || hint === fk.cols.join(",") || hint === tableForHint;
    for (const fk of cat.foreignKeys) {
      const fkTableKey = `${fk.schema}.${fk.table}`;
      const fkTargetKey = `${fk.fschema}.${fk.ftable}`;
      // parent → target (to-one): matched by target table name, FK constraint name, or the FK column name.
      if (fkTableKey === parentKey) {
        const byName = targetByName && fkTargetKey === `${targetByName.schema}.${targetByName.name}`;
        const byFkName = fk.name === name;
        const byColumn = fk.cols.length === 1 && fk.cols[0] === name;
        if ((byName || byFkName || byColumn) && hintOk(fk, fk.ftable)) candidates.push({ type: "m2o", fk, target: cat.relations.get(fkTargetKey) });
      }
      // target → parent (to-many): matched by source table name or FK constraint name.
      if (fkTargetKey === parentKey) {
        const byName = targetByName && fkTableKey === `${targetByName.schema}.${targetByName.name}`;
        const byFkName = fk.name === name;
        if ((byName || byFkName) && hintOk(fk, fk.table)) candidates.push({ type: "o2m", fk, target: cat.relations.get(fkTableKey) });
      }
    }
    // Many-to-many through a junction table: J has FKs to both parent and target.
    if (candidates.length === 0 && targetByName) {
      const targetKey = `${targetByName.schema}.${targetByName.name}`;
      const byTable = new Map();
      for (const fk of cat.foreignKeys) {
        const k = `${fk.schema}.${fk.table}`;
        if (!byTable.has(k)) byTable.set(k, []);
        byTable.get(k).push(fk);
      }
      for (const [jkey, fks] of byTable) {
        if (hint && !(jkey === `${this.schema}.${hint}` || fks.some((f) => f.name === hint))) continue;
        const toParent = fks.find((f) => `${f.fschema}.${f.ftable}` === parentKey);
        const toTarget = fks.find((f) => `${f.fschema}.${f.ftable}` === targetKey && f !== toParent);
        if (toParent && toTarget) candidates.push({ type: "m2m", junction: cat.relations.get(jkey), fkParent: toParent, fkTarget: toTarget, target: targetByName });
      }
    }
    // Dedupe (an FK can match both by name and by column).
    const seen = new Set();
    const unique = candidates.filter((c) => {
      const k = `${c.type}:${c.fk ? c.fk.name : c.junction.name}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (unique.length === 0) {
      throw new HttpError(
        400,
        pgrstError(
          "PGRST200",
          `Could not find a relationship between '${parent.name}' and '${name}' in the schema cache`,
          `Searched for a foreign key relationship between '${parent.name}' and '${name}'${hint ? ` using the hint '${hint}'` : ""} in the schema 'public', but no matches were found.`,
          `Verify that '${parent.name}' and '${name}' exist in the schema 'public' and that there is a foreign key relationship between them. If a new relationship was created, try reloading the schema cache.`,
        ),
      );
    }
    if (unique.length > 1) {
      throw new HttpError(
        300,
        pgrstError(
          "PGRST201",
          `Could not embed because more than one relationship was found for '${parent.name}' and '${name}'`,
          unique.map((c) => ({ cardinality: c.type === "m2o" ? "many-to-one" : c.type === "o2m" ? "one-to-many" : "many-to-many", embedding: `${parent.name} with ${name}`, relationship: c.fk ? `${c.fk.name} using ${c.fk.table}(${c.fk.cols.join(",")}) and ${c.fk.ftable}(${c.fk.fcols.join(",")})` : c.junction.name })),
          `Try changing '${name}' to one of the following: ${unique.map((c) => `'${name}!${c.fk ? c.fk.name : c.junction.name}'`).join(", ")}. Find the desired relationship in the 'details' key.`,
        ),
      );
    }
    return unique[0];
  }

  /** Routes query-string params (filters, order, limit, offset, logic) to the right node. */
  async applyParams(root, searchParams, opts = {}) {
    for (const [rawKey, value] of searchParams.entries()) {
      if (RESERVED.has(rawKey) && !rawKey.includes(".")) {
        if (rawKey === "order") root.order.push(...parseOrder(value));
        else if (rawKey === "limit") root.limit = Number(value);
        else if (rawKey === "offset") root.offset = Number(value);
        else if (rawKey === "and" || rawKey === "or") root.where.push(renderLogic(root.alias, rawKey, value, this.params));
        else if (rawKey === "not.and" || rawKey === "not.or") root.where.push(renderLogic(root.alias, rawKey.slice(4), value, this.params, true));
        continue;
      }
      if (opts.ignoreKeys && opts.ignoreKeys.has(rawKey)) continue;
      // rel.rel2.col=eq.v  → walk into embeds
      const segs = rawKey.split(".");
      let node = root;
      let i = 0;
      while (i < segs.length - 1) {
        const emb = node.embeds.find((e) => e.alias === segs[i] || e.name === segs[i]);
        if (!emb) break;
        node = emb.node;
        i++;
      }
      const key = segs.slice(i).join(".");
      if (key === "order") node.order.push(...parseOrder(value));
      else if (key === "limit") node.limit = Number(value);
      else if (key === "offset") node.offset = Number(value);
      else if (key === "and" || key === "or") node.where.push(renderLogic(node.alias, key, value, this.params));
      else if (key === "not.and" || key === "not.or") node.where.push(renderLogic(node.alias, key.slice(4), value, this.params, true));
      else if (i < segs.length - 1 && !opts.rpcArgs) {
        // Unknown prefix: PostgREST treats it as a column with dots → no such column. Give a clear message.
        throw new HttpError(400, pgrstError("PGRST100", `Could not find a relationship for filter "${rawKey}"`));
      } else if (opts.rpcArgs && i < segs.length - 1) {
        continue; // GET /rpc arg with dots — ignore
      } else {
        node.where.push(renderCondition(node.alias, key, parseOpValue(value), this.params));
      }
    }
  }

  // ---------------------------------------------------------------- SQL rendering
  /** `select <fields>, <embeds> from <source> as alias where ... order ... limit ...` */
  renderNode(node, source, extraWhere = [], { noLimit = false } = {}) {
    const sel = [];
    for (const f of node.fields) {
      const { sql, name } = columnExpr(node.alias, f.expr);
      if (f.expr === "*") sel.push(sql);
      else sel.push(`${sql} as ${qi(f.alias || name)}`);
    }
    for (const e of node.embeds) sel.push(`${this.renderEmbed(node, e)} as ${qi(e.alias)}`);
    if (sel.length === 0) sel.push(`${qi(node.alias)}.*`);
    const where = [...extraWhere, ...node.where, ...this.innerConditions(node)];
    let sql = `select ${sel.join(", ")} from ${source} as ${qi(node.alias)}`;
    if (where.length) sql += ` where ${where.join(" and ")}`;
    if (node.order.length) sql += ` order by ${node.order.map((o) => this.renderOrder(node, o)).filter(Boolean).join(", ")}`.replace(/ order by $/, "");
    if (!noLimit && node.limit != null && Number.isFinite(node.limit)) sql += ` limit ${Math.max(0, Math.floor(node.limit))}`;
    if (!noLimit && node.offset != null && Number.isFinite(node.offset) && node.offset > 0) sql += ` offset ${Math.floor(node.offset)}`;
    return sql;
  }

  renderOrder(node, o) {
    if (o.embed) return null; // order=rel(col) is ignored gracefully
    const { sql } = columnExpr(node.alias, o.column);
    return `${sql} ${o.desc ? "desc" : "asc"}${o.nulls ? ` nulls ${o.nulls}` : ""}`;
  }

  relSource(rel) {
    return `${qi(rel.schema)}.${qi(rel.name)}`;
  }

  joinCondition(parentAlias, embed) {
    const { join } = embed;
    const child = embed.node;
    if (join.type === "m2o") {
      return join.fk.cols.map((c, i) => `${qi(child.alias)}.${qi(join.fk.fcols[i])} = ${qi(parentAlias)}.${qi(c)}`).join(" and ");
    }
    if (join.type === "o2m") {
      return join.fk.cols.map((c, i) => `${qi(child.alias)}.${qi(c)} = ${qi(parentAlias)}.${qi(join.fk.fcols[i])}`).join(" and ");
    }
    // m2m: exists (select 1 from junction j where j.fkTarget = child.pk and j.fkParent = parent.pk)
    const j = `_j${this.aliasSeq++}`;
    const toTarget = join.fkTarget.cols.map((c, i) => `${qi(j)}.${qi(c)} = ${qi(child.alias)}.${qi(join.fkTarget.fcols[i])}`).join(" and ");
    const toParent = join.fkParent.cols.map((c, i) => `${qi(j)}.${qi(c)} = ${qi(parentAlias)}.${qi(join.fkParent.fcols[i])}`).join(" and ");
    return `exists (select 1 from ${this.relSource(join.junction)} as ${qi(j)} where ${toTarget} and ${toParent})`;
  }

  renderEmbed(parent, embed) {
    const child = embed.node;
    const inner = this.renderNode(child, this.relSource(child.rel), [this.joinCondition(parent.alias, embed)]);
    if (embed.join.type === "m2o") return `(select to_json(_e) from (${inner}) _e limit 1)`;
    return `(select coalesce(json_agg(to_json(_e)), '[]'::json) from (${inner}) _e)`;
  }

  /** For `!inner` embeds: parent rows must have at least one matching child. */
  innerConditions(node) {
    const conds = [];
    for (const e of node.embeds) {
      if (!e.inner) continue;
      const child = e.node;
      const where = [this.joinCondition(node.alias, e), ...child.where, ...this.innerConditions(child)];
      conds.push(`exists (select 1 from ${this.relSource(child.rel)} as ${qi(child.alias)} where ${where.join(" and ")})`);
    }
    return conds;
  }

  /** WHERE clause only (for counts, updates, deletes). */
  renderWhere(node) {
    const where = [...node.where, ...this.innerConditions(node)];
    return where.length ? ` where ${where.join(" and ")}` : "";
  }
}

export function parseOrder(value) {
  return splitTopLevel(value).map((item) => {
    if (item.includes("(")) return { embed: true, raw: item };
    const parts = item.split(".");
    const column = parts.shift();
    const o = { column, desc: false, nulls: null };
    for (const p of parts) {
      const q = p.toLowerCase();
      if (q === "desc") o.desc = true;
      else if (q === "asc") o.desc = false;
      else if (q === "nullsfirst") o.nulls = "first";
      else if (q === "nullslast") o.nulls = "last";
    }
    return o;
  });
}

// ================================================================ error mapping
export function mapPgError(err, role) {
  const code = err.code || "";
  let status = 400;
  if (code === "23505" || code === "23503" || code === "40001" || code === "40P01") status = 409;
  else if (code === "42501") status = role === "anon" ? 401 : 403;
  else if (code === "42P01" || code === "42883") status = 404;
  else if (code.startsWith("08") || code.startsWith("53") || code === "57P01") status = 503;
  else if (/^PT\d{3}$/.test(code)) status = Number(code.slice(2));
  else if (code.startsWith("22") || code.startsWith("23") || code.startsWith("42") || code.startsWith("P0") || code.startsWith("2")) status = 400;
  return new HttpError(status, { code: code || "XX000", message: err.message, details: err.detail ?? null, hint: err.hint ?? null });
}
