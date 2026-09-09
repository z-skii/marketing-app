// Supabase Storage-compatible subset: files on disk under .local-storage/{bucket}/{path}, rows in storage.objects.
import { createReadStream } from "node:fs";
import { mkdir, writeFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { HttpError, signJwt, verifyJwt, parseJsonBody } from "./util.mjs";

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".heic": "image/heic",
  ".pdf": "application/pdf", ".txt": "text/plain", ".json": "application/json", ".csv": "text/csv", ".svg": "image/svg+xml", ".mp4": "video/mp4",
};

export class Storage {
  constructor(pool, rootDir) {
    this.pool = pool;
    this.root = rootDir;
  }

  async init() {
    await mkdir(this.root, { recursive: true });
    const c = await this.pool.connect();
    try {
      await c.query(`create unique index if not exists local_objects_bucket_name_idx on storage.objects (bucket_id, name)`);
      await c.query(`alter table storage.objects add column if not exists updated_at timestamptz default now()`);
      await c.query(`alter table storage.objects add column if not exists last_accessed_at timestamptz default now()`);
    } finally {
      c.release();
    }
  }

  /** Resolves bucket/objectPath to an absolute path inside the storage root, refusing traversal. */
  diskPath(bucket, objectPath) {
    const abs = path.resolve(this.root, bucket, objectPath);
    const base = path.resolve(this.root, bucket) + path.sep;
    if (!abs.startsWith(base) || !objectPath || objectPath.includes("\0")) throw storageError(400, "InvalidKey", "Invalid object key");
    return abs;
  }

  async bucket(client, id) {
    const r = await client.query(`select * from storage.buckets where id = $1`, [id]);
    if (!r.rows[0]) throw storageError(404, "Bucket not found", "Bucket not found");
    return r.rows[0];
  }

  signToken(bucket, objectPath, expiresIn) {
    const iat = Math.floor(Date.now() / 1000);
    return signJwt({ url: `${bucket}/${objectPath}`, iat, exp: iat + Math.max(1, Number(expiresIn) || 60) });
  }

  // ---------------------------------------------------------------- upload
  async parseUpload(req, bodyBuf) {
    const ct = req.headers["content-type"] || "application/octet-stream";
    if (ct.startsWith("multipart/form-data")) {
      const form = await new Response(bodyBuf, { headers: { "content-type": ct } }).formData();
      let file = null;
      let cacheControl = null;
      let metadata = null;
      for (const [key, value] of form.entries()) {
        if (typeof value === "object" && value && typeof value.arrayBuffer === "function") {
          if (!file || key === "" || key === "file") file = value;
        } else if (key === "cacheControl") cacheControl = String(value);
        else if (key === "metadata") {
          try {
            metadata = JSON.parse(String(value));
          } catch {
            metadata = null;
          }
        }
      }
      if (!file) throw storageError(400, "InvalidRequest", "No file found in multipart body");
      return { bytes: Buffer.from(await file.arrayBuffer()), mimetype: file.type || "application/octet-stream", cacheControl, metadata };
    }
    let metadata = null;
    if (req.headers["x-metadata"]) {
      try {
        metadata = JSON.parse(Buffer.from(req.headers["x-metadata"], "base64").toString("utf8"));
      } catch {
        metadata = null;
      }
    }
    return { bytes: bodyBuf, mimetype: ct.split(";")[0].trim(), cacheControl: req.headers["cache-control"] || null, metadata };
  }

  async upload(client, { bucket, objectPath, upsert, owner, file }) {
    await this.bucket(client, bucket);
    const abs = this.diskPath(bucket, objectPath);
    const existing = await client.query(`select id from storage.objects where bucket_id = $1 and name = $2`, [bucket, objectPath]);
    if (existing.rows.length && !upsert) throw storageError(409, "Duplicate", "The resource already exists");
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, file.bytes);
    const metadata = {
      eTag: `"${randomUUID().replace(/-/g, "")}"`,
      size: file.bytes.length,
      mimetype: file.mimetype,
      cacheControl: file.cacheControl || "max-age=3600",
      lastModified: new Date().toISOString(),
      contentLength: file.bytes.length,
      httpStatusCode: 200,
    };
    const r = await client.query(
      `insert into storage.objects (bucket_id, name, owner, metadata) values ($1, $2, $3, $4::jsonb)
       on conflict (bucket_id, name) do update set owner = excluded.owner, metadata = excluded.metadata, updated_at = now()
       returning id`,
      [bucket, objectPath, owner, JSON.stringify(file.metadata ? { ...metadata, userMetadata: file.metadata } : metadata)],
    );
    return { Key: `${bucket}/${objectPath}`, Id: r.rows[0].id };
  }

  // ---------------------------------------------------------------- HTTP
  async handle(req, res, url, bodyBuf, ctx) {
    const p = url.pathname.replace(/^\/storage\/v1/, "");
    const method = req.method;
    const segs = p.split("/").filter(Boolean).map((s) => decodeURIComponent(s));
    const client = await this.pool.connect();
    try {
      // buckets
      if (segs[0] === "bucket") {
        if (method === "GET" && !segs[1]) {
          const r = await client.query(`select id, name, owner::text, public, file_size_limit, allowed_mime_types, created_at, created_at as updated_at from storage.buckets order by id`);
          return { status: 200, body: r.rows };
        }
        if (method === "GET" && segs[1]) {
          const b = await this.bucket(client, segs[1]);
          return { status: 200, body: b };
        }
        if (method === "POST" && !segs[1]) {
          const body = parseJsonBody(bodyBuf, {});
          if (!body.id && !body.name) throw storageError(400, "InvalidRequest", "Bucket id is required");
          await client.query(
            `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ($1, $2, $3, $4, $5) on conflict (id) do nothing`,
            [body.id || body.name, body.name || body.id, Boolean(body.public), body.file_size_limit ?? null, body.allowed_mime_types ?? null],
          );
          return { status: 200, body: { name: body.name || body.id } };
        }
        if (method === "DELETE" && segs[1]) {
          await client.query(`delete from storage.objects where bucket_id = $1`, [segs[1]]);
          await client.query(`delete from storage.buckets where id = $1`, [segs[1]]);
          await rm(path.join(this.root, segs[1]), { recursive: true, force: true });
          return { status: 200, body: { message: "Successfully deleted" } };
        }
      }

      if (segs[0] !== "object") throw storageError(404, "NotFound", `Unsupported storage endpoint: ${method} ${p}`);

      // signed URL creation
      if (segs[1] === "sign" && method === "POST") {
        const bucket = segs[2];
        const objectPath = segs.slice(3).join("/");
        const body = parseJsonBody(bodyBuf, {});
        this.requireAuth(ctx);
        if (objectPath) {
          await this.requireObject(client, bucket, objectPath);
          const token = this.signToken(bucket, objectPath, body.expiresIn);
          return { status: 200, body: { signedURL: `/object/sign/${bucket}/${objectPath}?token=${token}` } };
        }
        const paths = Array.isArray(body.paths) ? body.paths : [];
        const out = [];
        for (const pth of paths) {
          const exists = await client.query(`select 1 from storage.objects where bucket_id = $1 and name = $2`, [bucket, pth]);
          if (!exists.rows.length) out.push({ error: "Object not found", path: pth, signedURL: null });
          else out.push({ error: null, path: pth, signedURL: `/object/sign/${bucket}/${pth}?token=${this.signToken(bucket, pth, body.expiresIn)}` });
        }
        return { status: 200, body: out };
      }

      // downloads
      if (method === "GET" || method === "HEAD") {
        let bucket;
        let objectPath;
        if (segs[1] === "sign") {
          bucket = segs[2];
          objectPath = segs.slice(3).join("/");
          const token = url.searchParams.get("token");
          let claims = null;
          try {
            claims = token ? verifyJwt(token) : null;
          } catch {
            throw storageError(400, "InvalidJWT", "jwt expired");
          }
          if (!claims || claims.url !== `${bucket}/${objectPath}`) throw storageError(400, "InvalidJWT", "invalid signature");
        } else if (segs[1] === "authenticated" || segs[1] === "public" || segs[1] === "info") {
          const offset = segs[1] === "info" ? (segs[2] === "authenticated" || segs[2] === "public" ? 3 : 2) : 2;
          bucket = segs[offset];
          objectPath = segs.slice(offset + 1).join("/");
          if (segs[1] !== "public") this.requireAuth(ctx);
          if (segs[1] === "info") {
            const obj = await this.requireObject(client, bucket, objectPath);
            return { status: 200, body: { ...obj, size: obj.metadata?.size, contentType: obj.metadata?.mimetype } };
          }
        } else {
          bucket = segs[1];
          objectPath = segs.slice(2).join("/");
          this.requireAuth(ctx);
        }
        const obj = await this.requireObject(client, bucket, objectPath);
        const abs = this.diskPath(bucket, objectPath);
        let st;
        try {
          st = await stat(abs);
        } catch {
          throw storageError(404, "NotFound", "Object not found on disk");
        }
        const mimetype = obj.metadata?.mimetype || MIME[path.extname(objectPath).toLowerCase()] || "application/octet-stream";
        const headers = {
          "Content-Type": mimetype,
          "Content-Length": st.size,
          "Cache-Control": obj.metadata?.cacheControl || "max-age=3600",
          "Last-Modified": new Date(st.mtimeMs).toUTCString(),
          ETag: obj.metadata?.eTag || `"${st.mtimeMs}"`,
        };
        const download = url.searchParams.get("download");
        if (download !== null) headers["Content-Disposition"] = `attachment; filename="${download || path.basename(objectPath)}"`;
        return { status: 200, stream: method === "HEAD" ? null : createReadStream(abs), headers };
      }

      // list objects
      if (segs[1] === "list" && method === "POST") {
        this.requireAuth(ctx);
        const bucket = segs[2];
        const body = parseJsonBody(bodyBuf, {});
        const prefix = String(body.prefix || "").replace(/^\/+/, "").replace(/\/+$/, "");
        const like = prefix ? `${prefix.replace(/[%_\\]/g, "\\$&")}/%` : "%";
        const r = await client.query(`select id, name, owner, metadata, created_at, updated_at, last_accessed_at from storage.objects where bucket_id = $1 and name like $2 order by name`, [bucket, like]);
        const seen = new Map();
        for (const row of r.rows) {
          const rest = prefix ? row.name.slice(prefix.length + 1) : row.name;
          const slash = rest.indexOf("/");
          if (slash >= 0) {
            const folder = rest.slice(0, slash);
            if (!seen.has(folder)) seen.set(folder, { name: folder, id: null, updated_at: null, created_at: null, last_accessed_at: null, metadata: null });
          } else seen.set(rest, { ...row, name: rest });
        }
        const items = [...seen.values()];
        const offset = Number(body.offset || 0);
        const limit = Number(body.limit || 100);
        return { status: 200, body: items.slice(offset, offset + limit) };
      }

      // delete
      if (method === "DELETE") {
        this.requireAuth(ctx);
        const bucket = segs[1];
        let prefixes;
        if (segs.length > 2) prefixes = [segs.slice(2).join("/")];
        else prefixes = parseJsonBody(bodyBuf, {})?.prefixes || [];
        const deleted = [];
        for (const pth of prefixes) {
          const r = await client.query(`delete from storage.objects where bucket_id = $1 and name = $2 returning id, name, bucket_id, owner, metadata, created_at, updated_at`, [bucket, pth]);
          if (r.rows[0]) {
            deleted.push(r.rows[0]);
            await rm(this.diskPath(bucket, pth), { force: true });
          }
        }
        return { status: 200, body: deleted };
      }

      // move / copy
      if ((segs[1] === "move" || segs[1] === "copy") && method === "POST") {
        this.requireAuth(ctx);
        const body = parseJsonBody(bodyBuf, {});
        const bucket = body.bucketId;
        const destBucket = body.destinationBucket || bucket;
        const src = await this.requireObject(client, bucket, body.sourceKey);
        const from = this.diskPath(bucket, body.sourceKey);
        const to = this.diskPath(destBucket, body.destinationKey);
        await mkdir(path.dirname(to), { recursive: true });
        const { copyFile } = await import("node:fs/promises");
        await copyFile(from, to);
        await client.query(
          `insert into storage.objects (bucket_id, name, owner, metadata) values ($1, $2, $3, $4::jsonb) on conflict (bucket_id, name) do update set metadata = excluded.metadata, updated_at = now()`,
          [destBucket, body.destinationKey, src.owner, JSON.stringify(src.metadata)],
        );
        if (segs[1] === "move") {
          await client.query(`delete from storage.objects where bucket_id = $1 and name = $2`, [bucket, body.sourceKey]);
          await rm(from, { force: true });
          return { status: 200, body: { message: "Successfully moved" } };
        }
        return { status: 200, body: { Key: `${destBucket}/${body.destinationKey}` } };
      }

      // upload (POST) / update (PUT)
      if (method === "POST" || method === "PUT") {
        this.requireAuth(ctx);
        const bucket = segs[1];
        const objectPath = segs.slice(2).join("/");
        if (!bucket || !objectPath) throw storageError(400, "InvalidRequest", "Bucket and object path are required");
        const file = await this.parseUpload(req, bodyBuf);
        const upsert = method === "PUT" || String(req.headers["x-upsert"] || "false") === "true";
        const owner = ctx.claims?.sub || null;
        const result = await this.upload(client, { bucket, objectPath, upsert, owner, file });
        return { status: 200, body: result };
      }

      throw storageError(404, "NotFound", `Unsupported storage endpoint: ${method} ${p}`);
    } finally {
      client.release();
    }
  }

  requireAuth(ctx) {
    if (ctx.role === "anon") throw storageError(401, "Unauthorized", "A signed-in user (or the service key) is required");
  }

  async requireObject(client, bucket, objectPath) {
    const r = await client.query(`select * from storage.objects where bucket_id = $1 and name = $2`, [bucket, objectPath]);
    if (!r.rows[0]) throw storageError(404, "not_found", "Object not found");
    return r.rows[0];
  }
}

export function storageError(status, error, message) {
  return new HttpError(status, { statusCode: String(status), error, message });
}
