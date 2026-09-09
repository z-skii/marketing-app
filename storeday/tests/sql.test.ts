import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "pg";
import { asUser, connect, createAuthUser, resetTestDatabase } from "./helpers/db";

/**
 * Pins the database contract: RLS isolation, derived accounting, close/reopen audit,
 * Verified Shift RPCs, adjustments and the demo seed. Runs against a local Postgres.
 */
let c: Client;
let owner: string, employee: string, outsider: string, org: string, loc: string, emp: string;

beforeAll(async () => {
  resetTestDatabase();
  c = await connect();
  owner = await createAuthUser(c, "owner@test.local", "Alex Owner");
  employee = await createAuthUser(c, "emp@test.local", "John Doe");
  outsider = await createAuthUser(c, "other@test.local", "Other Owner");
  org = await asUser(c, owner, async (q) => (await q("select create_organization('Test Biz', 'convenience', 'America/New_York') as id"))[0].id);
  loc = await asUser(c, owner, async (q) => (await q(
    "insert into locations (organization_id, name, latitude, longitude, timezone) values ($1, 'Mr Tobacco', 36.0999, -78.3012, 'America/New_York') returning id", [org]))[0].id);
  emp = await asUser(c, owner, async (q) => {
    const e = (await q("insert into employees (organization_id, user_id, first_name, last_name) values ($1, $2, 'John', 'Doe') returning id", [org, employee]))[0].id;
    await q("insert into employee_pay_rates (organization_id, employee_id, hourly_rate, effective_from) values ($1, $2, 15, '2020-01-01')", [org, e]);
    await q("insert into organization_members (organization_id, user_id, role) values ($1, $2, 'employee')", [org, employee]);
    await q("insert into employee_locations (organization_id, employee_id, location_id) values ($1, $2, $3)", [org, e, loc]);
    return e as string;
  });
});
afterAll(async () => { await c?.end(); });

describe("organization + RLS", () => {
  it("creates settings, default categories and checklists", async () => {
    const rows = await asUser(c, owner, (q) => q("select (select count(*) from expense_categories where organization_id=$1) cats, (select count(*) from checklist_templates where organization_id=$1) tpls, (select count(*) from organization_settings where organization_id=$1) settings", [org]));
    expect(Number(rows[0].cats)).toBe(11);
    expect(Number(rows[0].tpls)).toBe(2);
    expect(Number(rows[0].settings)).toBe(1);
  });
  it("materializes location_members from employee_locations", async () => {
    const rows = await asUser(c, owner, (q) => q("select count(*) from location_members where user_id=$1 and location_id=$2", [employee, loc]));
    expect(Number(rows[0].count)).toBe(1);
  });
  it("outsiders and employees cannot see accounting; employee sees only own pay rate", async () => {
    await asUser(c, owner, (q) => q("select save_daily_report_draft($1, '2026-09-08', '{\"cash_sales\": 100, \"card_sales\": 50}')", [loc]));
    const o = await asUser(c, outsider, (q) => q("select count(*) from daily_reports"));
    const e = await asUser(c, employee, (q) => q("select (select count(*) from daily_reports) r, (select count(*) from expense_categories) c, (select count(*) from employee_pay_rates) p, (select count(*) from locations) l"));
    expect(Number(o[0].count)).toBe(0);
    expect(Number(e[0].r)).toBe(0);
    expect(Number(e[0].c)).toBe(0);
    expect(Number(e[0].p)).toBe(1);
    expect(Number(e[0].l)).toBe(1);
  });
});

describe("Verified Shift", () => {
  let shift: string;
  it("clocks in verified inside the radius with a photo", async () => {
    const rows = await asUser(c, employee, (q) => q("select id, verification_status, status from clock_in($1, 36.0999, -78.3012, 10, 'p/a.jpg', 'hash-a', 1000)", [loc]));
    shift = rows[0].id;
    expect(rows[0].verification_status).toBe("verified");
    expect(rows[0].status).toBe("active");
  });
  it("refuses a second active shift", async () => {
    await expect(asUser(c, employee, (q) => q("select clock_in($1)", [loc]))).rejects.toThrow(/already have an active shift/);
  });
  it("clocks out and computes labor = minutes × rate", async () => {
    await c.query("update shifts set clock_in_at = now() - interval '8 hours 14 minutes' where id = $1", [shift]);
    const rows = await asUser(c, employee, (q) => q("select worked_minutes, labor_cost, status, verification_status from clock_out($1, 36.0999, -78.3012, 5, 'p/b.jpg', 'hash-b', 1000)", [shift]));
    expect(rows[0].worked_minutes).toBe(494);
    expect(Number(rows[0].labor_cost)).toBe(123.5);
    expect(rows[0].status).toBe("completed");
    expect(rows[0].verification_status).toBe("verified");
  });
  it("flags outside-radius, missing photo and repeated photos", async () => {
    const a = await asUser(c, employee, (q) => q("select id, verification_status from clock_in($1, 36.2, -78.3, 10, 'p/c.jpg', 'hash-c')", [loc]));
    expect(a[0].verification_status).toBe("location_issue");
    await asUser(c, employee, (q) => q("select clock_out($1)", [a[0].id]));
    const b = await asUser(c, employee, (q) => q("select id, verification_status from clock_in($1, 36.0999, -78.3012, 10, null, null)", [loc]));
    expect(b[0].verification_status).toBe("missing_photo");
    await asUser(c, employee, (q) => q("select clock_out($1)", [b[0].id]));
    const d = await asUser(c, employee, (q) => q("select id, verification_status from clock_in($1, 36.0999, -78.3012, 10, 'p/d.jpg', 'hash-a')", [loc]));
    expect(d[0].verification_status).toBe("needs_review");
    await asUser(c, employee, (q) => q("select clock_out($1)", [d[0].id]));
    const flagged = await asUser(c, owner, (q) => q("select count(*) from notifications where kind = 'outside_radius' and user_id = $1", [owner]));
    expect(Number(flagged[0].count)).toBeGreaterThanOrEqual(1);
  });
  it("manager adjustments require a reason and are audited; employees cannot adjust", async () => {
    await expect(asUser(c, employee, (q) => q("select adjust_shift($1, now() - interval '9 hours', now(), 'x')", [shift]))).rejects.toThrow(/Not allowed/);
    await expect(asUser(c, owner, (q) => q("select adjust_shift($1, now() - interval '9 hours', now(), '')", [shift]))).rejects.toThrow(/reason/);
    const rows = await asUser(c, owner, (q) => q("select worked_minutes, verification_status from adjust_shift($1, now() - interval '9 hours', now(), 'Forgot to clock in')", [shift]));
    expect(rows[0].worked_minutes).toBe(540);
    expect(rows[0].verification_status).toBe("manager_adjusted");
    const adj = await asUser(c, owner, (q) => q("select original_minutes, new_minutes, reason from time_adjustments where shift_id = $1", [shift]));
    expect(adj[0]).toMatchObject({ original_minutes: 494, new_minutes: 540, reason: "Forgot to clock in" });
    const log = await asUser(c, owner, (q) => q("select count(*) from activity_logs where action = 'shift.adjusted' and entity_id = $1", [shift]));
    expect(Number(log[0].count)).toBe(1);
  });
});

describe("daily accounting", () => {
  // A fixed past date keeps these assertions independent of the wall clock and timezone.
  const d = "2025-03-10";
  it("derives totals from the numbers entered once plus automatic labor", async () => {
    // 8h manual shift at $15/h → $120 labor on that date.
    await asUser(c, owner, (q) => q("select create_manual_shift($1, $2, '2025-03-10T09:00:00-04:00', '2025-03-10T17:00:00-04:00', 'Forgot to clock in')", [loc, emp]));
    await asUser(c, owner, (q) => q("select save_daily_report_draft($1, $2, '{\"cash_sales\": 2816.45, \"card_sales\": 3194.82, \"cash_goods\": 410, \"check_goods\": 875, \"utilities\": 0, \"other_expenses\": 35, \"expected_cash\": 2840, \"actual_cash\": 2836}')", [loc, d]));
    const rows = await asUser(c, owner, (q) => q("select total_sales, goods_total, labor_total, other_total, total_expenses, profit, cash_difference, labor_minutes, labor_employee_count from daily_accounting where location_id = $1 and business_date = $2", [loc, d]));
    const r = rows[0];
    expect(Number(r.total_sales)).toBe(6011.27);
    expect(Number(r.goods_total)).toBe(1285);
    expect(Number(r.labor_total)).toBe(120);
    expect(Number(r.labor_minutes)).toBe(480);
    expect(Number(r.labor_employee_count)).toBe(1);
    expect(Number(r.total_expenses)).toBe(1440);
    expect(Number(r.profit)).toBe(4571.27);
    expect(Number(r.cash_difference)).toBe(-4);
  });
  it("detailed expenses flow into buckets", async () => {
    await asUser(c, owner, (q) => q("insert into expenses (organization_id, location_id, business_date, amount, category_id, payment_method) select $1, $2, $3, 100, id, 'cash' from expense_categories where organization_id = $1 and name = 'Inventory'", [org, loc, d]));
    const rows = await asUser(c, owner, (q) => q("select goods_total, detailed_goods, profit from daily_accounting where location_id = $1 and business_date = $2", [loc, d]));
    expect(Number(rows[0].goods_total)).toBe(1385);
    expect(Number(rows[0].detailed_goods)).toBe(100);
    expect(Number(rows[0].profit)).toBe(4471.27);
  });
  it("closes the day with a snapshot, blocks silent edits, audits reasoned edits, reopens", async () => {
    const snap = await asUser(c, owner, (q) => q("select total_sales, profit, cash_difference, attention from close_day($1, $2)", [loc, d]));
    expect(Number(snap[0].total_sales)).toBe(6011.27);
    expect(Number(snap[0].profit)).toBe(4471.27);
    expect(snap[0].attention.some((a: { kind: string }) => a.kind === "cash_short")).toBe(true);
    await expect(asUser(c, owner, (q) => q("update daily_reports set cash_sales = 1 where location_id = $1 and business_date = $2", [loc, d]))).rejects.toThrow(/closed/);
    await expect(asUser(c, owner, (q) => q("select close_day($1, $2)", [loc, d]))).rejects.toThrow(/already closed/);
    const rep = (await asUser(c, owner, (q) => q("select id from daily_reports where location_id = $1 and business_date = $2", [loc, d])))[0].id;
    await expect(asUser(c, owner, (q) => q("select edit_daily_report($1, '{\"cash_sales\": 2890}')", [rep]))).rejects.toThrow(/reason/);
    const edited = await asUser(c, owner, (q) => q("select cash_sales from edit_daily_report($1, '{\"cash_sales\": 2890}', 'Forgot second register')", [rep]));
    expect(Number(edited[0].cash_sales)).toBe(2890);
    const log = await asUser(c, owner, (q) => q("select before_data->>'cash_sales' b, after_data->>'cash_sales' a, note from activity_logs where action = 'report.edited_closed' and entity_id = $1", [rep]));
    expect(log[0]).toMatchObject({ b: "2816.45", a: "2890.00", note: "Forgot second register" });
    const reopened = await asUser(c, owner, (q) => q("select status from reopen_day($1, 'Need to fix goods')", [rep]));
    expect(reopened[0].status).toBe("open");
    const totals = await asUser(c, owner, (q) => q("select * from accounting_totals($1, null, '2025-03-01', '2025-03-31')", [org]));
    expect(Number(totals[0].total_sales)).toBe(6084.82);
    expect(Number(totals[0].goods_total)).toBe(1385);
    expect(Number(totals[0].labor_total)).toBe(120);
  });
});

describe("demo seed", () => {
  it("creates a populated demo business for the caller", async () => {
    const demoOwner = await createAuthUser(c, "demo@test.local", "Demo Owner");
    const demoOrg = await asUser(c, demoOwner, async (q) => (await q("select seed_demo_data() as id"))[0].id);
    const rows = await asUser(c, demoOwner, (q) => q(`select
      (select count(*) from locations where organization_id=$1) locs,
      (select count(*) from employees where organization_id=$1) emps,
      (select count(*) from daily_reports where organization_id=$1 and status='closed') closed,
      (select count(*) from shifts where organization_id=$1) shifts,
      (select count(*) from schedules where organization_id=$1) sched,
      (select total_sales from accounting_totals($1, null, current_date - 31, current_date)) sales`, [demoOrg]));
    expect(Number(rows[0].locs)).toBe(3);
    expect(Number(rows[0].emps)).toBe(11);
    expect(Number(rows[0].closed)).toBe(89);
    expect(Number(rows[0].shifts)).toBeGreaterThan(200);
    expect(Number(rows[0].sched)).toBe(72);
    expect(Number(rows[0].sales)).toBeGreaterThan(300000);
    const other = await asUser(c, owner, (q) => q("select count(*) from daily_reports where organization_id = $1", [demoOrg]));
    expect(Number(other[0].count)).toBe(0);
    await asUser(c, demoOwner, (q) => q("select delete_demo_organization($1)", [demoOrg]));
    const gone = await c.query("select count(*) from organizations where id = $1", [demoOrg]);
    expect(Number(gone.rows[0].count)).toBe(0);
  });
});
