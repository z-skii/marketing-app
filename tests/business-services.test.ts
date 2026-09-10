import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { pool, rebuildSchema, truncateAll, q, createUser, TEST_DB } from "./helpers/db";

/**
 * Business services: brand kit approval flow, plan-aware content shoots,
 * month proposals, Google profile checks and growth summaries. Everything
 * runs against the template paths: there is no ANTHROPIC_API_KEY and no
 * Instagram token here, and the tests must never reach the network.
 */

process.env.DATABASE_URL = `postgresql://${process.env.PGUSER ?? "app"}:${process.env.PGPASSWORD ?? "app"}@${process.env.PGHOST ?? "127.0.0.1"}:5432/${TEST_DB}`;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.IG_ACCESS_TOKEN;
delete process.env.IG_USER_ID;
delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;

import { approveBrandKit, discardProposal, getBrandKit, proposeBrandKit } from "@/lib/business/brand";
import { ensureMonthlyShoots, getNextShoot, listShoots, setShootStatus, shootDateFor } from "@/lib/business/shoots";
import { approveAll, moveCalendarPost, monthSlots, proposeMonth } from "@/lib/ai/schedule";
import { NotConnectedError, runGoogleHealth } from "@/lib/google/business";
import { addManualSnapshot, getGrowthSummary } from "@/lib/social/insights";
import { pool as appPool } from "@/lib/db";

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterAll(async () => {
  await appPool().end();
  await pool.end();
});

async function makeBusiness(ownerId: string, extra: Partial<{ name: string; category: string; phone: string; hours: unknown }> = {}) {
  const name = extra.name ?? "Demo Biz";
  const [b] = await q<{ id: string }>(
    `insert into businesses (owner_id, name, slug, category, phone, hours)
     values ($1, $2, $3, $4, $5, $6::jsonb) returning id`,
    [ownerId, name, name.toLowerCase().replace(/\s/g, "-") + Math.random().toString(36).slice(2, 6),
     extra.category ?? "Coffee shop", extra.phone ?? null, extra.hours === undefined ? null : JSON.stringify(extra.hours)],
  );
  await q(`insert into business_members (business_id, profile_id, member_role) values ($1, $2, 'owner')`, [b.id, ownerId]);
  return b.id;
}

async function subscribe(businessId: string, plan: "essential" | "growth") {
  await q(
    `insert into business_subscriptions (business_id, plan, status, billing) values ($1, $2, 'active', 'dev')
     on conflict (business_id) do update set plan = excluded.plan, status = 'active'`,
    [businessId, plan],
  );
}

describe("brand kit", () => {
  it("proposes a template kit, and only approval changes the kit and mirrors it into businesses.brand", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner, { name: "Bean Corner" });

    const { proposal, source } = await proposeBrandKit(business, { mode: "build" });
    expect(source).toBe("template");
    expect(proposal.palette.length).toBeGreaterThanOrEqual(3);
    expect(proposal.improvements.length).toBeLessThanOrEqual(3);
    expect(proposal.guidelines.some((g) => g.includes("Bean Corner"))).toBe(true);

    // Proposing changes nothing the business is using.
    let record = await getBrandKit(business);
    expect(record.status).toBe("draft");
    expect(record.kit.palette).toEqual([]);
    expect(record.proposed?.palette).toEqual(proposal.palette);
    expect(record.proposed_source).toBe("template");
    let [biz] = await q<{ brand: Record<string, unknown> }>(`select brand from businesses where id = $1`, [business]);
    expect(biz.brand).toEqual({});

    const kit = await approveBrandKit(business);
    expect(kit.palette).toEqual(proposal.palette);
    record = await getBrandKit(business);
    expect(record.status).toBe("approved");
    expect(record.kit.palette).toEqual(proposal.palette);
    expect(record.proposed).toBeNull();
    [biz] = await q<{ brand: Record<string, unknown> }>(`select brand from businesses where id = $1`, [business]);
    expect(biz.brand.palette).toEqual(proposal.palette);
    expect(biz.brand.colors).toBe(proposal.palette.join(", "));

    // A second proposal, then a discard, leaves the approved kit untouched.
    await q(`update businesses set brand = jsonb_build_object('colors', '#123456, #ABCDEF') where id = $1`, [business]);
    const second = await proposeBrandKit(business, { mode: "refine", notes: "make it bolder" });
    record = await getBrandKit(business);
    expect(record.kit.palette).toEqual(proposal.palette);
    expect(record.proposed?.palette).toEqual(second.proposal.palette);
    await discardProposal(business);
    record = await getBrandKit(business);
    expect(record.proposed).toBeNull();
    expect(record.kit.palette).toEqual(proposal.palette);
    expect(record.status).toBe("approved");

    // Approving with nothing pending is refused.
    await expect(approveBrandKit(business)).rejects.toThrow(/no proposal/);
  });
});

describe("content shoots", () => {
  it("creates the plan's shoots for the month once, and more for growth", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);

    // No subscription, no shoots.
    expect(await ensureMonthlyShoots(business)).toEqual({ created: 0, plan: null, total: 0 });

    await subscribe(business, "essential");
    const first = await ensureMonthlyShoots(business);
    expect(first).toEqual({ created: 1, plan: "essential", total: 1 });
    const again = await ensureMonthlyShoots(business);
    expect(again).toEqual({ created: 0, plan: "essential", total: 1 });

    const shoots = await listShoots(business, 10);
    expect(shoots).toHaveLength(1);
    expect(shoots[0].status).toBe("planned");
    expect(shoots[0].photos_planned).toBe(10);
    expect(shoots[0].videos_planned).toBe(3);
    const next = await getNextShoot(business);
    expect(next?.id).toBe(shoots[0].id);

    // Upgrading to growth adds the second shoot, and only the second.
    await subscribe(business, "growth");
    expect(await ensureMonthlyShoots(business)).toEqual({ created: 1, plan: "growth", total: 2 });
    expect(await ensureMonthlyShoots(business)).toEqual({ created: 0, plan: "growth", total: 2 });
    expect(await listShoots(business, 10)).toHaveLength(2);

    // Status changes are for admins or the assigned person only.
    const stranger = await createUser();
    await expect(setShootStatus(shoots[0].id, "done", { userId: stranger, isAdmin: false })).rejects.toThrow(/admin/);
    const done = await setShootStatus(shoots[0].id, "done", { userId: stranger, isAdmin: true });
    expect(done.status).toBe("done");
  });

  it("puts the shoot on the 18th, or the next available day when that has passed", () => {
    expect(shootDateFor(2026, 9, 0, new Date("2026-09-03T12:00:00Z"))).toBe("2026-09-18");
    expect(shootDateFor(2026, 9, 0, new Date("2026-09-20T12:00:00Z"))).toBe("2026-09-21");
    expect(shootDateFor(2026, 9, 0, new Date("2026-09-30T12:00:00Z"))).toBe("2026-09-30");
    expect(shootDateFor(2026, 2, 1, new Date("2026-02-01T12:00:00Z"))).toBe("2026-02-04");
  });
});

describe("month proposal", () => {
  it("creates twelve template drafts once with the reel/photo/story mix", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    await q(`update businesses set cover_url = '/uploads/seed/demo-coffee-cover.webp' where id = $1`, [business]);

    const result = await proposeMonth(business, "2026-10");
    expect(result.source).toBe("template");
    expect(result.created).toBe(12);
    const formats = result.posts.map((p) => p.format);
    expect(formats.filter((f) => f === "reel")).toHaveLength(4);
    expect(formats.filter((f) => f === "photo")).toHaveLength(4);
    expect(formats.filter((f) => f === "story")).toHaveLength(4);
    expect(result.posts.every((p) => p.thumbnail_url === "/uploads/seed/demo-coffee-cover.webp")).toBe(true);

    const again = await proposeMonth(business, "2026-10");
    expect(again.created).toBe(0);
    expect(again.existing).toBe(12);
    expect(again.source).toBe("existing");

    const rows = await q<{ status: string; source: string; format: string; recommended_time: string }>(
      `select status, source, format, recommended_time from calendar_posts where business_id = $1 order by recommended_time`,
      [business],
    );
    expect(rows).toHaveLength(12);
    expect(rows.every((r) => r.status === "idea" && r.source === "template")).toBe(true);
    // Mon/Wed/Fri at 11:00 in the default zone (America/New_York, UTC-4 in October).
    const slots = monthSlots("2026-10", "America/New_York");
    expect(slots[0].toISOString()).toBe("2026-10-02T15:00:00.000Z");
    for (const s of slots) expect([1, 3, 5]).toContain(new Date(s.getTime() - 4 * 3600 * 1000).getUTCDay());

    expect(await approveAll(business, "2026-10")).toBe(12);
    const approved = await q<{ n: string }>(`select count(*)::text as n from calendar_posts where business_id = $1 and status = 'approved'`, [business]);
    expect(Number(approved[0].n)).toBe(12);

    const [post] = await q<{ id: string }>(`select id from calendar_posts where business_id = $1 limit 1`, [business]);
    expect(await moveCalendarPost(post.id, business, "2026-10-31T15:00:00Z")).toBe(true);
    const [moved] = await q<{ scheduled_for: Date }>(`select scheduled_for from calendar_posts where id = $1`, [post.id]);
    expect(new Date(moved.scheduled_for).toISOString()).toBe("2026-10-31T15:00:00.000Z");
  });
});

describe("google business health", () => {
  it("refuses to run before Google is connected and stores nothing", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner, { hours: null });

    await expect(runGoogleHealth(business)).rejects.toBeInstanceOf(NotConnectedError);
    const stored = await q(`select 1 from google_health_checks where business_id = $1`, [business]);
    expect(stored).toEqual([]);
  });
});

describe("growth summary", () => {
  it("is unavailable without data and manual once the business types numbers in", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);

    const empty = await getGrowthSummary(business);
    expect(empty.source).toBe("unavailable");
    expect(empty.metrics).toEqual({ reach: null, followers_delta: null, views: null, engagement_pct: null });
    expect(empty.top_post).toBeNull();
    expect(empty.next_action?.href).toBe("/business/create");

    await addManualSnapshot(business, {
      provider: "instagram", periodStart: "2026-08-01", periodEnd: "2026-08-28",
      reach: 1200, followersDelta: 35, views: 4100, engagementPct: 3.2,
      topPost: { title: "Latte pour", thumbnailUrl: "/uploads/seed/demo-latte.webp", views: 900, href: "https://instagram.com/p/demo" },
    });
    await q(
      `insert into marketing_recommendations (business_id, kind, title, body, status) values ($1, 'trend', 'A trend', 'Body', 'new')`,
      [business],
    );

    const manual = await getGrowthSummary(business);
    expect(manual.source).toBe("manual");
    expect(manual.provider).toBe("instagram");
    expect(manual.period).toEqual({ start: "2026-08-01", end: "2026-08-28" });
    expect(manual.metrics).toEqual({ reach: 1200, followers_delta: 35, views: 4100, engagement_pct: 3.2 });
    expect(manual.top_post?.title).toBe("Latte pour");
    expect(manual.top_post?.views).toBe(900);
    expect(manual.next_action?.href).toBe("/business/trends");

    await expect(addManualSnapshot(business, { provider: "instagram", periodStart: "2026-08-01", periodEnd: "2026-08-28" }))
      .rejects.toThrow(/at least one number/);
  });
});
