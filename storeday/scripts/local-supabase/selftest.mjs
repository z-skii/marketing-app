#!/usr/bin/env node
// End-to-end check of the local Supabase-compatible server through @supabase/supabase-js.
// By default it starts its own server on a random port against DATABASE_URL; set LOCAL_SUPABASE_URL to test a running one.
// Run: node scripts/local-supabase/selftest.mjs   (after `bash scripts/db-reset.sh`)
import { createRequire } from "node:module";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

const OWNER_EMAIL = process.env.SELFTEST_EMAIL || "owner@local.test";
const OTHER_EMAIL = process.env.SELFTEST_OTHER_EMAIL || "stranger@local.test";
const PASSWORD = "Password123!";
const ANON_KEY = "local-anon-key";

let failures = 0;
let stepNo = 0;
async function step(name, fn) {
  stepNo++;
  const label = `${String(stepNo).padStart(2, "0")}. ${name}`;
  try {
    const out = await fn();
    console.log(`ok   ${label}${out ? ` — ${out}` : ""}`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${label}\n     ${e?.message || e}`);
  }
}
const must = (res, what) => {
  if (res.error) throw new Error(`${what}: ${res.error.message || JSON.stringify(res.error)}${res.error.code ? ` [${res.error.code}]` : ""}`);
  return res.data;
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

let server = null;
let tmpStorage = null;
let baseUrl = process.env.LOCAL_SUPABASE_URL;
if (!baseUrl) {
  const { createServer } = await import("./server.mjs");
  tmpStorage = await mkdtemp(path.join(os.tmpdir(), "local-supabase-selftest-"));
  process.env.LOCAL_SUPABASE_QUIET = process.env.LOCAL_SUPABASE_QUIET ?? "1";
  server = await createServer({ port: 0, storageDir: tmpStorage });
  baseUrl = server.url;
  console.log(`started test server on ${baseUrl}`);
} else console.log(`using running server at ${baseUrl}`);

const supabase = createClient(baseUrl, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const anonClient = createClient(baseUrl, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function signUpOrIn(client, email) {
  const up = await client.auth.signUp({ email, password: PASSWORD, options: { data: { full_name: "Local Owner" } } });
  if (!up.error) {
    assert(up.data.session?.access_token, "signUp should return a session (autoconfirm)");
    return up.data;
  }
  if (!/already registered/i.test(up.error.message)) throw new Error(`signUp: ${up.error.message}`);
  const inn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  return must(inn, "signInWithPassword (existing user)");
}

const state = {};
try {
  await step(`signUp ${OWNER_EMAIL} (or sign in if it already exists)`, async () => {
    const data = await signUpOrIn(supabase, OWNER_EMAIL);
    state.uid = data.user.id;
    state.session = data.session;
    assert(data.user.email === OWNER_EMAIL, "user.email mismatch");
    assert(data.user.aud === "authenticated" && data.user.role === "authenticated", "user aud/role");
    return `uid=${state.uid}`;
  });

  await step("profile row was created by the auth trigger", async () => {
    const rows = must(await supabase.from("profiles").select("id, email, full_name").eq("id", state.uid), "select profiles");
    assert(rows.length === 1 && rows[0].email === OWNER_EMAIL, `expected 1 profile row, got ${JSON.stringify(rows)}`);
    return `full_name=${JSON.stringify(rows[0].full_name)}`;
  });

  await step("rpc create_organization", async () => {
    const org = must(await supabase.rpc("create_organization", { p_name: "Test Biz", p_timezone: "America/New_York" }), "create_organization");
    assert(typeof org === "string" && org.length === 36, `expected uuid, got ${JSON.stringify(org)}`);
    state.org = org;
    return `org=${org}`;
  });

  await step("insert location .select('id').single()", async () => {
    const loc = must(
      await supabase.from("locations").insert({ organization_id: state.org, name: "Main St", timezone: "America/New_York", latitude: 40.7128, longitude: -74.006 }).select("id").single(),
      "insert location",
    );
    assert(loc.id && Object.keys(loc).length === 1, `expected {id}, got ${JSON.stringify(loc)}`);
    state.loc = loc.id;
    return `location=${loc.id}`;
  });

  await step("insert employee .select() (return=representation, full row)", async () => {
    const rows = must(
      await supabase.from("employees").insert({ organization_id: state.org, first_name: "Jane", last_name: "Doe", email: "jane@local.test", default_location_id: state.loc, start_date: "2026-01-15" }).select(),
      "insert employee",
    );
    assert(Array.isArray(rows) && rows.length === 1, "expected one row");
    const e = rows[0];
    assert(e.start_date === "2026-01-15", `date should be YYYY-MM-DD string, got ${JSON.stringify(e.start_date)}`);
    assert(typeof e.created_at === "string" && /^\d{4}-\d{2}-\d{2}T/.test(e.created_at), `timestamptz should be ISO string, got ${e.created_at}`);
    assert(e.employment_status === "active" && e.role === "employee", "defaults applied");
    state.emp = e.id;
    return `employee=${e.id}`;
  });

  await step("insert pay rate + employee_locations (numeric comes back as a number)", async () => {
    const rate = must(await supabase.from("employee_pay_rates").insert({ organization_id: state.org, employee_id: state.emp, hourly_rate: 18.5, effective_from: "2026-01-01" }).select("hourly_rate").single(), "insert pay rate");
    assert(rate.hourly_rate === 18.5, `numeric should be number 18.5, got ${JSON.stringify(rate.hourly_rate)}`);
    must(await supabase.from("employee_locations").insert({ organization_id: state.org, employee_id: state.emp, location_id: state.loc }), "insert employee_locations");
    return "hourly_rate=18.5";
  });

  await step("select employees with to-many embeds employee_pay_rates(...), employee_locations(...)", async () => {
    const rows = must(await supabase.from("employees").select("*, employee_pay_rates(hourly_rate, effective_from), employee_locations(location_id)").eq("organization_id", state.org).order("first_name"), "select employees+embeds");
    const jane = rows.find((r) => r.id === state.emp);
    assert(jane, "jane not found");
    assert(Array.isArray(jane.employee_pay_rates) && jane.employee_pay_rates.length === 1 && jane.employee_pay_rates[0].hourly_rate === 18.5, `pay rates embed wrong: ${JSON.stringify(jane.employee_pay_rates)}`);
    assert(Array.isArray(jane.employee_locations) && jane.employee_locations[0].location_id === state.loc, `locations embed wrong: ${JSON.stringify(jane.employee_locations)}`);
    return `${rows.length} employees`;
  });

  await step("organization_members with organizations!inner(id, name) to-one embed", async () => {
    const rows = must(
      await supabase.from("organization_members").select("organization_id, role, permissions, organizations!inner(id, name)").eq("user_id", state.uid).eq("status", "active"),
      "select members",
    );
    const m = rows.find((r) => r.organization_id === state.org);
    assert(m && m.role === "owner", `owner membership missing: ${JSON.stringify(rows)}`);
    assert(m.organizations && !Array.isArray(m.organizations) && m.organizations.name === "Test Biz", `to-one embed wrong: ${JSON.stringify(m.organizations)}`);
    assert(typeof m.permissions === "object", "jsonb should be an object");
    return `role=${m.role} org=${m.organizations.name}`;
  });

  await step("rpc save_daily_report_draft (returns composite row)", async () => {
    const report = must(
      await supabase.rpc("save_daily_report_draft", { p_location_id: state.loc, p_date: "2026-09-01", p_patch: { cash_sales: 1200.5, card_sales: 800, cash_goods: 300.25, notes: "selftest" } }),
      "save_daily_report_draft",
    );
    assert(report && !Array.isArray(report) && report.cash_sales === 1200.5 && report.status === "open", `unexpected report: ${JSON.stringify(report)}`);
    state.reportId = report.id;
    return `report=${report.id} cash_sales=${report.cash_sales}`;
  });

  await step("select from view daily_accounting (derived totals)", async () => {
    const rows = must(await supabase.from("daily_accounting").select("*").eq("location_id", state.loc), "select daily_accounting");
    assert(rows.length === 1, `expected 1 row, got ${rows.length}`);
    const r = rows[0];
    assert(r.total_sales === 2000.5 && r.goods_total === 300.25 && r.profit === 1700.25, `derived totals wrong: ${JSON.stringify(r)}`);
    return `total_sales=${r.total_sales} profit=${r.profit}`;
  });

  await step("rpc accounting_totals with p_location_ids: null (returns table)", async () => {
    const rows = must(await supabase.rpc("accounting_totals", { p_org: state.org, p_location_ids: null, p_from: "2026-09-01", p_to: "2026-09-30" }), "accounting_totals");
    assert(Array.isArray(rows) && rows.length === 1, `expected 1 row, got ${JSON.stringify(rows)}`);
    assert(rows[0].total_sales === 2000.5 && rows[0].days_with_data === 1, `totals wrong: ${JSON.stringify(rows[0])}`);
    return `total_sales=${rows[0].total_sales} days=${rows[0].days_with_data}`;
  });

  await step("rpc accounting_totals with p_location_ids: [loc] (uuid[] arg)", async () => {
    const rows = must(await supabase.rpc("accounting_totals", { p_org: state.org, p_location_ids: [state.loc], p_from: "2026-09-01", p_to: "2026-09-30" }), "accounting_totals");
    assert(rows[0].total_sales === 2000.5, `totals wrong: ${JSON.stringify(rows[0])}`);
    return "ok";
  });

  await step("notifications count with { count: 'exact', head: true } and .is('read_at', null)", async () => {
    const res = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", state.uid).is("read_at", null);
    must(res, "count notifications");
    assert(typeof res.count === "number", `count should be a number, got ${res.count}`);
    assert(res.data === null, "head request should have no body");
    return `count=${res.count}`;
  });

  await step("upsert expense_categories onConflict organization_id,name ignoreDuplicates", async () => {
    const before = must(await supabase.from("expense_categories").select("id", { count: "exact", head: true }).eq("organization_id", state.org), "count before");
    const res = await supabase.from("expense_categories").upsert([{ organization_id: state.org, name: "Inventory", bucket: "goods" }, { organization_id: state.org, name: "Selftest Cat", bucket: "other" }], { onConflict: "organization_id,name", ignoreDuplicates: true }).select("id, name");
    const rows = must(res, "upsert");
    assert(rows.length === 1 && rows[0].name === "Selftest Cat", `ignoreDuplicates should insert only the new row: ${JSON.stringify(rows)}`);
    const again = must(await supabase.from("expense_categories").upsert({ organization_id: state.org, name: "Selftest Cat", bucket: "utilities" }, { onConflict: "organization_id,name" }).select("bucket").single(), "merge upsert");
    assert(again.bucket === "utilities", "merge-duplicates should update");
    void before;
    return "ignore + merge both behave";
  });

  await step("filters: in(), neq, gte/lte, or(ilike), order desc, limit, range, maybeSingle", async () => {
    const cats = must(await supabase.from("expense_categories").select("name, bucket").eq("organization_id", state.org).in("bucket", ["goods", "labor"]).order("name", { ascending: false }), "in filter");
    assert(cats.length === 2 && cats[0].name === "Labor", `in/order wrong: ${JSON.stringify(cats)}`);
    const like = must(await supabase.from("expense_categories").select("name").eq("organization_id", state.org).or("name.ilike.%self%,name.ilike.%rent%"), "or/ilike");
    assert(like.length === 2, `or/ilike wrong: ${JSON.stringify(like)}`);
    const notGoods = must(await supabase.from("expense_categories").select("name").eq("organization_id", state.org).neq("bucket", "goods").limit(2), "neq/limit");
    assert(notGoods.length === 2, "limit 2");
    const ranged = await supabase.from("expense_categories").select("name", { count: "exact" }).eq("organization_id", state.org).order("sort_order").range(0, 2);
    must(ranged, "range");
    assert(ranged.data.length === 3 && ranged.count >= 12, `range/count wrong: ${ranged.data.length}/${ranged.count}`);
    const none = must(await supabase.from("expense_categories").select("id").eq("organization_id", state.org).eq("name", "does-not-exist").maybeSingle(), "maybeSingle none");
    assert(none === null, "maybeSingle should be null");
    const single = await supabase.from("expense_categories").select("id").eq("organization_id", state.org).single();
    assert(single.error && single.error.code === "PGRST116", `single() on many rows should fail with PGRST116, got ${JSON.stringify(single.error)}`);
    const gte = must(await supabase.from("daily_reports").select("id").eq("location_id", state.loc).gte("business_date", "2026-09-01").lte("business_date", "2026-09-30"), "gte/lte");
    assert(gte.length === 1, "date range filter");
    return "all filter shapes ok";
  });

  await step("update + delete with return=representation, json path filter", async () => {
    const upd = must(await supabase.from("expense_categories").update({ sort_order: 99, is_active: false }).eq("organization_id", state.org).eq("name", "Selftest Cat").select("name, sort_order, is_active").single(), "update");
    assert(upd.sort_order === 99 && upd.is_active === false, `update wrong: ${JSON.stringify(upd)}`);
    const noFilter = await supabase.from("expense_categories").update({ sort_order: 1 });
    assert(noFilter.error, "update without filters must be refused");
    const del = must(await supabase.from("expense_categories").delete().eq("organization_id", state.org).eq("name", "Selftest Cat").select("name"), "delete");
    assert(del.length === 1, "delete should return the removed row");
    const perms = must(await supabase.from("organization_members").select("id").eq("organization_id", state.org).filter("permissions->>can_edit_hours", "is", null), "json path filter");
    assert(perms.length === 1, "json path filter");
    return "ok";
  });

  await step("nested embed + embedded filter + embedded order/limit", async () => {
    const rows = must(
      await supabase.from("organizations").select("name, locations(name, employees(first_name, employee_pay_rates(hourly_rate))), expense_categories(name)").eq("id", state.org)
        .order("name", { referencedTable: "expense_categories", ascending: false }).limit(2, { referencedTable: "expense_categories" }),
      "nested embed",
    );
    assert(rows.length === 1, "one org");
    const org = rows[0];
    assert(org.expense_categories.length === 2 && org.expense_categories[0].name === "Utilities", `embedded order/limit: ${JSON.stringify(org.expense_categories)}`);
    assert(org.locations[0].employees.length >= 1, "nested to-many under to-many");
    // employees → locations is via default_location_id (m2o)
    const emps = must(await supabase.from("employees").select("first_name, locations!default_location_id(name)").eq("organization_id", state.org).eq("locations.name", "Main St"), "embedded filter");
    assert(emps[0].locations?.name === "Main St", `m2o embed by column hint: ${JSON.stringify(emps)}`);
    return "ok";
  });

  await step("storage: upload buffer to shift-photos, createSignedUrl, fetch it", async () => {
    const pathInBucket = `${state.org}/${state.loc}/x.jpg`;
    const bytes = Buffer.from("\xff\xd8\xff\xe0selftest-jpeg-bytes", "binary");
    const up = must(await supabase.storage.from("shift-photos").upload(pathInBucket, bytes, { contentType: "image/jpeg", upsert: false }), "upload");
    assert(up.path === pathInBucket && up.fullPath === `shift-photos/${pathInBucket}`, `upload response: ${JSON.stringify(up)}`);
    const dup = await supabase.storage.from("shift-photos").upload(pathInBucket, bytes, { contentType: "image/jpeg", upsert: false });
    assert(dup.error, "duplicate upload without upsert should fail");
    must(await supabase.storage.from("shift-photos").upload(pathInBucket, bytes, { contentType: "image/jpeg", upsert: true }), "upsert upload");
    const signed = must(await supabase.storage.from("shift-photos").createSignedUrl(pathInBucket, 600), "createSignedUrl");
    const res = await fetch(signed.signedUrl);
    assert(res.status === 200 && res.headers.get("content-type") === "image/jpeg", `signed fetch: ${res.status} ${res.headers.get("content-type")}`);
    const body = Buffer.from(await res.arrayBuffer());
    assert(body.equals(bytes), "downloaded bytes differ");
    const multi = must(await supabase.storage.from("shift-photos").createSignedUrls([pathInBucket, "missing/none.jpg"], 600), "createSignedUrls");
    assert(multi[0].signedUrl && !multi[0].error && multi[1].error, `createSignedUrls: ${JSON.stringify(multi)}`);
    // Browser-style upload (Blob → multipart/form-data)
    const blob = new Blob([bytes], { type: "image/png" });
    must(await supabase.storage.from("checklist-photos").upload(`${state.org}/${state.loc}/blob.png`, blob, { contentType: "image/png", upsert: true }), "blob upload");
    const objects = must(await supabase.from("shift_photos").select("id").limit(1), "storage does not break rest");
    void objects;
    const removed = must(await supabase.storage.from("checklist-photos").remove([`${state.org}/${state.loc}/blob.png`]), "remove");
    assert(removed.length === 1, "remove should report the deleted object");
    return `signedUrl ok (${body.length} bytes)`;
  });

  await step("auth.getUser with the session's access token", async () => {
    const res = must(await supabase.auth.getUser(state.session.access_token), "getUser");
    assert(res.user.id === state.uid && res.user.email === OWNER_EMAIL, "getUser mismatch");
    assert(res.user.app_metadata?.provider === "email" && Array.isArray(res.user.identities), "user shape");
    return `user=${res.user.email}`;
  });

  await step("refresh token rotation + reuse inside grace window", async () => {
    const r1 = must(await supabase.auth.refreshSession({ refresh_token: state.session.refresh_token }), "refresh 1");
    const r2 = must(await supabase.auth.refreshSession({ refresh_token: state.session.refresh_token }), "refresh 2 (reuse)");
    assert(r1.session.refresh_token === r2.session.refresh_token, "reused refresh token should yield the same successor");
    assert(r1.session.refresh_token !== state.session.refresh_token, "refresh token should rotate");
    return "rotated";
  });

  await step("signInWithPassword for the same user (and wrong password rejected)", async () => {
    const bad = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: "nope-nope" });
    assert(bad.error && /invalid login/i.test(bad.error.message), `wrong password should fail: ${JSON.stringify(bad.error)}`);
    const ok = must(await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: PASSWORD }), "signInWithPassword");
    assert(ok.session?.access_token && ok.user.id === state.uid, "session missing");
    state.session = ok.session;
    return "signed in";
  });

  await step("updateUser (metadata + password) then sign in with the new password and restore", async () => {
    const upd = must(await supabase.auth.updateUser({ data: { full_name: "Local Owner Updated" }, password: "Another123!" }), "updateUser");
    assert(upd.user.user_metadata.full_name === "Local Owner Updated", "metadata merge");
    must(await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: "Another123!" }), "sign in with new password");
    must(await supabase.auth.updateUser({ password: PASSWORD, data: { full_name: "Local Owner" } }), "restore password");
    return "ok";
  });

  await step("RLS: a second user who is not a member sees no daily_reports of the first org", async () => {
    const other = createClient(baseUrl, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const data = await signUpOrIn(other, OTHER_EMAIL);
    assert(data.user.id !== state.uid, "different user");
    const reports = must(await other.from("daily_reports").select("*").eq("organization_id", state.org), "select as stranger");
    assert(reports.length === 0, `stranger should see 0 reports, saw ${reports.length}`);
    const orgs = must(await other.from("organizations").select("id").eq("id", state.org), "orgs as stranger");
    assert(orgs.length === 0, "stranger should not see the org");
    const ins = await other.from("locations").insert({ organization_id: state.org, name: "Hacked" }).select();
    assert(ins.error && ins.error.code === "42501", `RLS insert should fail with 42501, got ${JSON.stringify(ins.error)}`);
    const rpc = await other.rpc("save_daily_report_draft", { p_location_id: state.loc, p_date: "2026-09-02", p_patch: {} });
    assert(rpc.error && /not allowed/i.test(rpc.error.message), `RPC should raise 'Not allowed', got ${JSON.stringify(rpc.error)}`);
    await other.auth.signOut();
    return "stranger sees nothing, writes rejected";
  });

  await step("anon (no session) cannot read daily_reports; service key bypasses RLS", async () => {
    const anon = must(await anonClient.from("daily_reports").select("id").eq("organization_id", state.org), "anon select");
    assert(anon.length === 0, "anon should see nothing");
    const admin = createClient(baseUrl, "local-service-role-key", { auth: { persistSession: false, autoRefreshToken: false } });
    const all = must(await admin.from("daily_reports").select("id").eq("organization_id", state.org), "service select");
    assert(all.length === 1, `service role should see the report, saw ${all.length}`);
    const orgs = must(await admin.from("organizations").select("id, name, timezone").eq("id", state.org), "service orgs");
    assert(orgs.length === 1, "service sees org");
    const checks = must(await admin.rpc("run_org_checks", { p_org: state.org }), "run_org_checks as service");
    assert(typeof checks === "number", `scalar rpc should return a number, got ${JSON.stringify(checks)}`);
    return `service role ok (run_org_checks=${checks})`;
  });

  await step("signOut", async () => {
    must(await supabase.auth.signOut(), "signOut");
    const after = await supabase.auth.refreshSession({ refresh_token: state.session.refresh_token });
    assert(after.error, "refresh after global signOut should fail");
    return "signed out; refresh token revoked";
  });
} finally {
  if (server) await server.close();
  if (tmpStorage) await rm(tmpStorage, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} step(s) FAILED` : "\nall steps passed");
process.exit(failures ? 1 : 0);
