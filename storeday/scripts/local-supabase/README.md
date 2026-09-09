# Local Supabase-compatible dev server

A single Node process that speaks enough of the Supabase HTTP API (GoTrue auth, PostgREST, Storage) for the
Storeday app to run entirely against the local Postgres in this container. No Docker, no network, no extra
npm packages — only `pg` and `node:crypto`.

```
npm run db:reset          # rebuild the local DB from supabase/local + supabase/migrations
npm run local:supabase    # start the server on http://127.0.0.1:54321
npm run dev:local         # next dev with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 etc.
npm run local:selftest    # end-to-end check through @supabase/supabase-js (starts its own server on a random port)
```

`dev:local` sets `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key`,
`SUPABASE_SERVICE_ROLE_KEY=local-service-role-key`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000` and spawns `next dev`
(extra args are passed through, e.g. `npm run dev:local -- -p 3100`). Existing environment variables win over `.env.local`.

## Files

| file | role |
| --- | --- |
| `server.mjs` | HTTP entry point: routing, CORS, logging, JWT → role resolution, realtime 404, startup migrations |
| `auth.mjs` | GoTrue subset (`/auth/v1/*`) |
| `rest.mjs` | PostgREST engine: schema cache (`pg_catalog`), `select` / embed / filter / order parsing, SQL generation |
| `rest-handler.mjs` | PostgREST HTTP layer: per-request transaction with RLS context, GET/HEAD/POST/PATCH/DELETE, `/rpc/*` |
| `storage.mjs` | Storage subset (`/storage/v1/*`), files under `.local-storage/{bucket}/{path}` |
| `selftest.mjs` | The verification script (see below) |

## Configuration (environment)

| variable | default | meaning |
| --- | --- | --- |
| `LOCAL_SUPABASE_PORT` | `54321` | listen port (127.0.0.1 only) |
| `DATABASE_URL` | `postgresql://app:app@127.0.0.1:5432/storeday` | Postgres; the `app` role must be a superuser (it is, locally) so `set local role` works |
| `LOCAL_SUPABASE_JWT_SECRET` | `local-dev-secret-please-change` | HS256 secret for access tokens and signed storage URLs |
| `LOCAL_SUPABASE_SERVICE_KEY` | `local-service-role-key` | the value that is treated as the service-role key |
| `LOCAL_SUPABASE_JWT_EXP` | `3600` | access-token lifetime in seconds |
| `LOCAL_STORAGE_DIR` | `<project>/.local-storage` | where uploaded files live (git-ignored) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | used for the recovery/invite links printed to the console |
| `LOCAL_SUPABASE_QUIET=1` | | silence the per-request log line (`METHOD path status ms`) |

The anon / publishable key sent in the `apikey` header is accepted as-is (any value). A Bearer token is resolved to a
role: the service key → `service_role`; a JWT signed with our secret → `authenticated` (claims are used for RLS);
anything else → `anon`.

## What is supported

### Auth (`/auth/v1`)
- `POST /signup` — auto-confirmed. Inserts into `auth.users` (`id, email, raw_user_meta_data, raw_app_meta_data,
  email_confirmed_at, created_at, updated_at`), so the migrations' `on_auth_user_created` trigger creates the profile.
  Returns `{access_token, refresh_token, expires_in, expires_at, token_type, user}` like GoTrue with autoconfirm.
- `POST /token?grant_type=password|refresh_token|pkce` — refresh tokens are stored in `auth.local_refresh_tokens`
  (created at startup) and rotated; a rotated token stays valid for 10 minutes and returns the same successor, so the
  concurrent refreshes Next's middleware + server components perform do not log the user out.
- `GET /user`, `PUT /user` (`password`, `data` merged into `raw_user_meta_data`, `email`), `POST /logout` (204),
  `POST /recover`, `POST /resend`, `POST /invite` (service key only; creates the user when missing), `POST|GET /verify`,
  `GET /health`, `GET /settings`, and `/admin/users*` + `/admin/generate_link` for `auth.admin.*` (service key only).
- There is **no email**. `recover` / `invite` / `generate_link` print a ready-to-open link to the console
  (`.../auth/callback?code=...`); `exchangeCodeForSession(code)` (`grant_type=pkce`) accepts it (the PKCE verifier is
  not checked). `resend` just logs. `verify` accepts those one-time tokens or falls back to a 200 stub.
- Passwords: scrypt hashes in `auth.local_passwords(user_id, hash)` (created at startup). If a user has no row there,
  `auth.users.encrypted_password` is checked with pgcrypto: `encrypted_password = crypt($1, encrypted_password)`, so
  users seeded in SQL with `crypt(...)` can sign in. Sign-ups also write a `crypt()` hash into `encrypted_password`.
  Missing columns (`encrypted_password, email_confirmed_at, raw_app_meta_data, updated_at, last_sign_in_at`) are added
  to `auth.users` at startup.
- JWT (HS256): `{iss:"local", sub, aud:"authenticated", role:"authenticated", email, exp, iat, session_id, app_metadata,
  user_metadata, aal, amr, is_anonymous}`.
- Errors use the 2024-01-01 GoTrue shape `{code, message}` (plus legacy `msg`/`error_code`), e.g.
  `invalid_credentials` (400), `user_already_exists` (422), `weak_password` (422).

### REST (`/rest/v1`, PostgREST subset)
Every request runs in one transaction: `begin; set local role <anon|authenticated|service_role>;
set_config('request.jwt.claim.sub'|'role'|'email'|'session_id', ..., true); set_config('request.jwt.claims', ...)` —
exactly what `auth.uid()` / `auth.role()` in `supabase/local/000_auth_shim.sql` read, so **RLS policies apply as in
production**. `service_role` has `bypassrls`. `Prefer: tx=rollback` is honoured.

At startup the server also grants anon the privileges Supabase's default privileges would give it
(`grant ... on all tables/sequences/functions in schema public to anon`) so anonymous requests get RLS-filtered results
(usually `[]`) instead of `42501`, as on hosted Supabase.

- **Reading**: `select=` with columns, `*`, aliases `alias:col`, casts `col::text`, JSON paths `data->>key`, and
  embedded resources `rel(cols)`, `rel!inner(cols)`, `rel!fk_name(cols)`, `rel!fk_column(cols)`, `alias:rel(...)`,
  nested to any depth. Relationships are resolved from `pg_catalog` foreign keys: parent→target FK gives an object
  (to-one, `null` when missing), target→parent FK gives an array (to-many, `[]` when empty), and a junction table with
  FKs to both gives many-to-many. Ambiguity returns PostgREST's `PGRST201` with the hint to use `!fk_name`.
- **Filters**: `eq, neq, gt, gte, lt, lte, like, ilike` (`*` → `%`), `match, imatch`, `is` (`null|true|false|unknown`),
  `isdistinct`, `in.(a,"b,c")`, `cs, cd, ov, sl, sr, nxr, nxl, adj`, `fts/plfts/phfts/wfts[(lang)]`, `not.<op>`,
  `or=(...)`, `and=(...)`, `not.or=(...)`, nested logic, and embedded-column filters `rel.col=eq.v` (applied inside the
  embed; with `!inner` they also filter the parent rows). `rel.order=`, `rel.limit=`, `rel.offset=` shape the embed.
- `order=col.asc|desc[.nullsfirst|nullslast]` (multiple), `limit`, `offset`, `Range` header. `order=rel(col)` is ignored.
- `Prefer: count=exact` (planned/estimated are treated as exact) → `Content-Range: from-to/total`; `HEAD` returns
  headers only (`{ count: "exact", head: true }`).
- `Accept: application/vnd.pgrst.object+json` (`.single()`) → the object, or `406` `{code:"PGRST116", ...}`.
  `.maybeSingle()` is handled by supabase-js on top of a normal array response.
- **Insert** (`POST`): object or array (`columns=` honoured, missing keys → `null`, `Prefer: missing=default` → column
  default). Values are coerced by Postgres through `jsonb_populate_record`, so enums, numerics, arrays, dates and jsonb
  all work. `Prefer: return=representation` returns the rows shaped by `select` (embeds included); otherwise `201`
  with an empty body. `Prefer: resolution=merge-duplicates` + `on_conflict=a,b` → `on conflict (a,b) do update set
  <every payload column>`; `resolution=ignore-duplicates` → `do nothing`; without `on_conflict` the primary key is used.
- **Update** (`PATCH`) and **delete** (`DELETE`) require at least one filter (a local safety rule — PostgREST would
  happily touch the whole table). Both support `return=representation` + `select` and `count=exact`.
- **RPC** (`POST /rpc/fn` with a JSON body, `GET /rpc/fn?arg=v`): the overload whose argument names match is called
  with named, explicitly cast parameters (`fn(p_a => $1::uuid, p_ids => $2::uuid[], p_patch => $3::jsonb)`), so `null`,
  arrays, objects and dates all work. `returns void` → 204; scalar → the JSON scalar; composite (`returns
  public.shifts`) → object; `returns setof|table` → array (with `select`/filters/order/limit applied to the result and
  `count=exact` supported); `setof <scalar>` → array of scalars.
- **Errors** are PostgREST-shaped `{code, message, details, hint}`: `23505`/`23503` → 409, `42501` → 401 for anon /
  403 otherwise (RLS/permission), `42P01`/`42883` → 404, `P0001` (`raise exception`) and other `22xxx/23xxx/42xxx` →
  400, `PGRST116` → 406, unknown table → 404 `PGRST205`, unknown function → 404 `PGRST202`, unknown column in a
  payload → 400 `PGRST204`, no relationship → 400 `PGRST200`.
- **Types**: rows are produced by Postgres `to_json(row)`, so `numeric`/`int8`/`float8` are JSON numbers, `date` is
  `"YYYY-MM-DD"`, `timestamptz` is ISO 8601 with offset, `json/jsonb` are objects, arrays are arrays — the same as
  PostgREST. The schema cache refreshes every 10 s and immediately when an unknown table/function is requested, so new
  migrations are picked up without a restart.

### Storage (`/storage/v1`)
- `POST /object/{bucket}/{path}` (raw body with `content-type`, or the browser's `multipart/form-data`) — `x-upsert`
  respected, `409 Duplicate` otherwise. Files go to `.local-storage/{bucket}/{path}` (path traversal refused) and a row
  is written to `storage.objects (bucket_id, name, owner=sub, metadata{size, mimetype, cacheControl, eTag, ...})`.
  Returns `{Key, Id}`. `PUT` = upsert. The bucket must exist in `storage.buckets` (the migrations create
  `shift-photos`, `receipts`, `checklist-photos`).
- `POST /object/sign/{bucket}/{path}` `{expiresIn}` → `{signedURL}`; `POST /object/sign/{bucket}` `{expiresIn, paths}`
  → array (`createSignedUrls`). The token is an HS256 JWT `{url, exp}`.
- `GET /object/sign/{bucket}/{path}?token=` (token only), `GET /object/authenticated/{bucket}/{path}` and
  `GET /object/{bucket}/{path}` (Bearer), `GET /object/public/{bucket}/{path}` — stream the file with its content type;
  `?download` sets `Content-Disposition`. `GET /object/info/...` returns metadata.
- `DELETE /object/{bucket}` `{prefixes:[...]}` (and `DELETE /object/{bucket}/{path}`) → deleted rows;
  `POST /object/list/{bucket}`, `POST /object/move`, `POST /object/copy`; `GET /bucket`, `GET /bucket/{id}`,
  `POST /bucket`, `DELETE /bucket/{id}`.
- Uploads, signing, listing and deletes need a signed-in user (any valid access token) or the service key.
  **Storage RLS policies are not evaluated** — every authenticated user can read/write every object.

### Realtime / functions
- `GET /realtime/v1/websocket` (and any websocket upgrade) is answered with `404`, so `supabase-js` channels never
  connect; the app's realtime subscriptions simply do nothing (it falls back to refreshing). `/functions/v1/*` → 404.

## Limits (by design)
- No email of any kind: confirmation is automatic, recovery/invite links are printed to the server console.
- No realtime, no edge functions, no storage RLS, no image transforms, no OAuth/OTP/MFA, no PKCE verifier check.
- PostgREST features not implemented: aggregates (`sum()`, `count()` inside `select`), `order=rel(col)`, spread embeds
  `...rel(*)`, computed-column embeds, `Prefer: handling=strict/max-affected`, CSV/EXPLAIN media types, `limit` on
  update/delete, views are embeddable only when they carry real FKs (i.e. tables only), RPC function-result embeds.
- Refresh tokens live in the DB; the session survives server restarts. One-time recovery/invite codes live in memory.
- Everything runs as the superuser `app` and switches role with `set local role`; auth/storage table writes bypass RLS.

## Self-test

`node scripts/local-supabase/selftest.mjs` starts its own server on a random port (temporary storage dir) against
`DATABASE_URL` and walks through the app's real call patterns with `@supabase/supabase-js`: sign-up (or sign-in when
`owner@local.test` already exists), `create_organization`, inserts with `.select().single()`, to-many / to-one /
`!inner` / nested embeds, `save_daily_report_draft`, the `daily_accounting` view, `accounting_totals` with a `null`
and a `uuid[]` argument, `{count:"exact", head:true}`, upserts (`ignoreDuplicates` and merge), filters (`in`, `or`
with `ilike`, `neq`, `gte/lte`, `range`, `maybeSingle`, `single` → `PGRST116`, JSON path filters), update/delete with
representation, storage upload (Buffer and Blob) + signed URL fetch + `createSignedUrls` + `remove`, `getUser`,
refresh rotation, `signInWithPassword`, `updateUser`, RLS isolation for a second non-member user (empty reads, `42501`
on insert, `Not allowed` from RPC), anon vs service-role, and `signOut`. Set `LOCAL_SUPABASE_URL=http://127.0.0.1:54321`
to run it against an already running server instead. Run `npm run db:reset` first for a clean slate (it is also fine
to run repeatedly on the same DB).
