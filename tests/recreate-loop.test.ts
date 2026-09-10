import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TEST_DB, pool, q, createUser, rebuildSchema, truncateAll } from "./helpers/db";

/**
 * TapMart V3 Recreate loop: brief templates and clamps, creator guides,
 * the advisory submission check, and trend providers. No key is configured
 * here, so every path exercises the template fallback and nothing touches
 * the network.
 */

// The lib modules read DATABASE_URL lazily; point them at the test database
// before the first query so they share the schema the helpers rebuild.
process.env.DATABASE_URL = `postgresql://app:app@127.0.0.1:5432/${TEST_DB}`;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.AUTH_DEV_MODE;

import { DEFAULT_PAY_CENTS, generateBrief, normalizeBrief, templateBrief } from "../src/lib/ai/brief";
import { buildCreatorGuide, guideFromCampaign, shortenStep } from "../src/lib/ai/guide";
import { checkSubmission } from "../src/lib/ai/check";
import { isAiConfigured } from "../src/lib/ai/client";
import { submissionMeta } from "../src/lib/ai/submission-meta";
import {
  addManualTrend, archiveTrend, fixtureProvider, getTrendsForBusiness, listProviderStatus, mergeTrends,
} from "../src/lib/trends";
import type { TrendItem } from "../src/lib/trends/types";
import type { CampaignBrief } from "../src/lib/ai/types";

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterAll(async () => {
  await pool.end();
  const { pool: appPool } = await import("../src/lib/db");
  await appPool().end();
});

async function makeBusiness(ownerId: string, category: string | null = "Coffee shop") {
  const [b] = await q<{ id: string }>(
    `insert into businesses (owner_id, name, slug, category, city) values ($1, 'Demo Biz', $2, $3, 'Raleigh, NC') returning id`,
    [ownerId, `biz-${Math.random().toString(36).slice(2, 8)}`, category],
  );
  await q(`insert into business_members (business_id, profile_id, member_role) values ($1, $2, 'owner')`, [b.id, ownerId]);
  return b.id;
}

const NO_DASH = /[–—]/;

describe("brief template", () => {
  it("is not configured for AI in tests", () => {
    expect(isAiConfigured()).toBe(false);
  });

  it("writes a sensible generic recreate brief and labels it template", async () => {
    const { brief, source } = await generateBrief({
      businessName: "Demo Coffee Co.", category: "Coffee shop", city: "Raleigh, NC",
      referenceUrl: "https://www.instagram.com/reel/demo", referenceTitle: "Employee POV: opening the shop",
    });
    expect(source).toBe("template");
    expect(brief.title).toContain("Employee POV");
    expect(brief.steps.length).toBeGreaterThanOrEqual(5);
    expect(brief.steps.length).toBeLessThanOrEqual(7);
    expect(brief.steps.map((s) => s.n)).toEqual(brief.steps.map((_, i) => i + 1));
    expect(brief.orientation).toBe("vertical");
    expect(brief.duration_seconds[0]).toBeGreaterThanOrEqual(15);
    expect(brief.duration_seconds[1]).toBeLessThanOrEqual(30);
    expect(brief.suggested_pay_cents).toBe(DEFAULT_PAY_CENTS);
    expect(brief.suggested_pay_cents).toBe(7500);
    expect(brief.suggested_slots).toBe(8);
    expect(brief.deadline_days).toBe(10);
    expect(brief.required_elements.length).toBeGreaterThan(0);
    expect(brief.summary).toContain("Demo Coffee Co.");
    const everything = JSON.stringify(brief);
    expect(NO_DASH.test(everything)).toBe(false);
  });

  it("uses the pay override and the trend when given", () => {
    const trend: TrendItem = {
      id: "t1", source: "curated", business_id: null, category: "Coffee shop", title: "First sip, one take",
      platform: "tiktok", reference_url: "https://www.tiktok.com/@x/video/1", media_url: null, thumbnail_url: null,
      views: null, growth_note: "Curated by TapMart", fit_note: "Matches a cafe with a visible counter", created_at: new Date().toISOString(),
    };
    const brief = templateBrief({ businessName: "Demo Roastery", category: null, city: null, trend }, 5000);
    expect(brief.suggested_pay_cents).toBe(5000);
    expect(brief.title).toBe("Recreate: First sip, one take");
    expect(brief.summary).toContain("Matches a cafe");
    expect(brief.location).toBe("Demo Roastery");
  });

  it("clamps numbers and fixes reversed durations", () => {
    const raw = {
      title: "x", summary: "y", steps: [{ n: 9, text: "Do the thing" }],
      duration_seconds: [40, 10], suggested_pay_cents: 9_999_999, suggested_slots: 0, deadline_days: 500,
      orientation: "vertical", pace: "fast", editing_style: "", location: "",
      must_keep: [], can_change: [], required_elements: [], avoid: [], spoken_lines: [],
    };
    const brief = normalizeBrief(raw)!;
    expect(brief).not.toBeNull();
    expect(brief.duration_seconds).toEqual([10, 40]);
    expect(brief.suggested_pay_cents).toBe(500_000);
    expect(brief.suggested_slots).toBe(1);
    expect(brief.deadline_days).toBe(90);
    expect(brief.steps[0].n).toBe(1);
    expect(brief.editing_style.length).toBeGreaterThan(0);
  });

  it("rejects shapes that are not a brief", () => {
    expect(normalizeBrief(null)).toBeNull();
    expect(normalizeBrief({ title: "only a title" })).toBeNull();
    expect(normalizeBrief({ title: "t", summary: "s", steps: [], duration_seconds: [15, 25] })).toBeNull();
  });
});

describe("creator guide", () => {
  const brief: CampaignBrief = {
    title: "Recreate our latte pour", summary: "Same shots, your take.",
    steps: [
      { n: 1, text: "Open on the outside of the shop so people know where you are, then walk in." },
      { n: 2, text: "Please make sure to show the latte being poured slowly into the cup, close enough to see the foam." },
      { n: 3, text: "Take the first sip." },
    ],
    must_keep: ["The order of the shots"], can_change: ["Music"], required_elements: ["The latte on screen"],
    avoid: ["Stock footage"], spoken_lines: ["This is Demo Coffee."], duration_seconds: [15, 25],
    orientation: "vertical", editing_style: "Simple cuts", pace: "medium", location: "Demo Coffee",
    suggested_pay_cents: 7500, suggested_slots: 8, deadline_days: 10,
  };

  it("shortens steps to at most 9 words, imperative, one sentence", () => {
    expect(shortenStep("Please make sure to show the latte being poured slowly into the cup, close enough to see the foam."))
      .toBe("Show the latte being poured slowly into the cup.");
    for (const s of brief.steps) {
      const line = shortenStep(s.text);
      expect(line.split(" ").length).toBeLessThanOrEqual(9);
      expect(line.endsWith(".")).toBe(true);
    }
  });

  it("builds a template guide from a brief and attaches frames by index", async () => {
    const { guide } = await buildCreatorGuide(brief, { referenceFrameUrls: ["/uploads/seed/demo-latte.webp"] });
    expect(guide.source).toBe("template");
    expect(guide.steps).toHaveLength(3);
    expect(guide.steps[0].frame_url).toBe("/uploads/seed/demo-latte.webp");
    expect(guide.steps[1].frame_url).toBeNull();
    expect(guide.steps[0].timing).toMatch(/^\d+ to \d+ s$/);
    expect(guide.duration_seconds).toEqual([15, 25]);
    expect(guide.orientation).toBe("vertical");
    expect(guide.rules).toContain("The order of the shots");
    expect(guide.rules).toContain('Say: "This is Demo Coffee."');
    expect(guide.checklist).toContain("The latte on screen");
    expect(guide.checklist).toContain("15 to 25 seconds");
    expect(guide.checklist).toContain("Vertical 9:16");
    expect(guide.avoid).toEqual(["Stock footage"]);
  });

  it("guideFromCampaign returns the stored guide when present", () => {
    const stored = {
      steps: [{ n: 1, text: "Start outside the shop.", frame_url: null, timing: "0 to 4 s" }],
      duration_seconds: [15, 25], orientation: "vertical", rules: ["Say Demo Coffee once"], avoid: [], checklist: ["15 to 25 seconds"], source: "template",
    };
    const guide = guideFromCampaign({ guide: stored, duration_seconds: [10, 60] }, ["Ignored requirement"]);
    expect(guide.steps[0].text).toBe("Start outside the shop.");
    expect(guide.duration_seconds).toEqual([15, 25]);
    expect(guide.rules).toEqual(["Say Demo Coffee once"]);
  });

  it("guideFromCampaign derives a template guide from requirements", () => {
    const guide = guideFromCampaign(
      { reference_media_url: "/uploads/seed/demo-latte.webp", duration_seconds: [15, 25] },
      ["15 to 25 seconds", "Show the drink being poured", "Say Demo Coffee once", "Vertical 9:16"],
    );
    expect(guide.source).toBe("template");
    expect(guide.duration_seconds).toEqual([15, 25]);
    expect(guide.orientation).toBe("vertical");
    expect(guide.steps.map((s) => s.text)).toEqual(["Show the drink being poured.", "Say Demo Coffee once."]);
    expect(guide.steps.every((s) => s.frame_url === null)).toBe(true);
    expect(guide.rules).toHaveLength(4);
    expect(guide.checklist).toContain("Vertical 9:16");
  });

  it("guideFromCampaign reads duration and orientation from requirements alone", () => {
    const guide = guideFromCampaign({}, ["20 to 40 seconds", "Horizontal 16:9", "Show the sign"]);
    expect(guide.duration_seconds).toEqual([20, 40]);
    expect(guide.orientation).toBe("horizontal");
    expect(guide.steps).toHaveLength(1);
    const empty = guideFromCampaign({}, []);
    expect(empty.duration_seconds).toEqual([15, 30]);
    expect(empty.steps.length).toBeGreaterThan(0);
  });
});

describe("submission check", () => {
  const campaign = {
    kind: "recreate_reel",
    title: "[demo] Recreate our latte pour video",
    business_name: "Demo Coffee Co.",
    requirements: ["15 to 25 seconds", "Show the drink being poured", "Say Demo Coffee once", "Vertical 9:16"],
    details: {
      reference_media_url: "/uploads/seed/demo-latte.webp",
      duration_seconds: [15, 25],
      guide: {
        steps: [{ n: 1, text: "Start outside the shop." }], duration_seconds: [15, 25], orientation: "vertical",
        rules: [], avoid: [], checklist: ["Demo Coffee visible at least once", "15 to 25 seconds", "Vertical 9:16"], source: "template",
      },
    } as Record<string, unknown>,
  };
  const byKey = (items: { key: string; status: string }[]) => Object.fromEntries(items.map((i) => [i.key, i.status]));

  it("is unknown, never pass, when the browser read nothing", async () => {
    const check = await checkSubmission({ campaign, mediaUrl: "https://cdn.example/v.mp4", clientMeta: null });
    expect(check.checked_by).toBe("none");
    const s = byKey(check.items);
    expect(s.file).toBe("pass");
    expect(s.duration).toBe("unknown");
    expect(s.orientation).toBe("unknown");
    expect(s.req_0).toBe("unknown");
    expect(check.items.filter((i) => i.key.startsWith("req_")).every((i) => i.status === "unknown")).toBe(true);
    expect(check.summary.length).toBeGreaterThan(0);
    expect(typeof check.checked_at).toBe("string");
  });

  it("fails a video that is too long and marks checked_by client", async () => {
    const check = await checkSubmission({
      campaign, mediaUrl: "https://cdn.example/v.mp4",
      clientMeta: { durationSeconds: 48, width: 1080, height: 1920, sizeBytes: 1_000 },
    });
    expect(check.checked_by).toBe("client");
    const s = byKey(check.items);
    expect(s.duration).toBe("fail");
    expect(s.orientation).toBe("pass");
    expect(s.req_0).toBe("unknown");
  });

  it("passes duration and warns when slightly outside the range", async () => {
    const ok = await checkSubmission({
      campaign, mediaUrl: "https://cdn.example/v.mp4",
      clientMeta: { durationSeconds: 20, width: 1080, height: 1920, sizeBytes: null },
    });
    expect(byKey(ok.items).duration).toBe("pass");
    const near = await checkSubmission({
      campaign, mediaUrl: "https://cdn.example/v.mp4",
      clientMeta: { durationSeconds: 27, width: null, height: null, sizeBytes: null },
    });
    expect(byKey(near.items).duration).toBe("warn");
    expect(byKey(near.items).orientation).toBe("unknown");
    expect(near.checked_by).toBe("client");
  });

  it("fails a horizontal video when the guide wants vertical", async () => {
    const check = await checkSubmission({
      campaign, mediaUrl: "https://cdn.example/v.mp4",
      clientMeta: { durationSeconds: null, width: 1920, height: 1080, sizeBytes: null },
    });
    expect(byKey(check.items).orientation).toBe("fail");
    expect(byKey(check.items).duration).toBe("unknown");
    expect(check.checked_by).toBe("client");
  });

  it("fails the file item without a media URL and stays advisory without a key even with frames", async () => {
    const check = await checkSubmission({
      campaign, mediaUrl: "",
      clientMeta: { durationSeconds: 20, width: 1080, height: 1920, sizeBytes: 5, frames: ["data:image/jpeg;base64,/9j/4AAQ"] },
    });
    expect(byKey(check.items).file).toBe("fail");
    expect(check.checked_by).toBe("client");
    expect(check.items.filter((i) => i.key.startsWith("req_")).every((i) => i.status === "unknown")).toBe(true);
  });

  it("falls back to requirements when the campaign has no guide", async () => {
    const legacy = { ...campaign, details: { duration_seconds: [15, 25] } as Record<string, unknown> };
    const check = await checkSubmission({
      campaign: legacy, mediaUrl: "https://cdn.example/v.mp4",
      clientMeta: { durationSeconds: 10, width: 720, height: 1280, sizeBytes: null },
    });
    expect(byKey(check.items).duration).toBe("fail");
    expect(check.items.find((i) => i.key === "req_0")?.label).toBe("Show the drink being poured");
  });

  it("submissionMeta keeps the check and the numbers, drops frames", () => {
    const meta = submissionMeta(
      { items: [{ key: "duration", label: "15 to 25 seconds", status: "pass", note: "20 s" }], summary: "ok", checked_by: "client", checked_at: "2026-09-10T00:00:00.000Z" },
      { durationSeconds: 20, width: 1080, height: 1920, sizeBytes: 100, frames: ["data:image/jpeg;base64,abc"] },
    );
    expect(meta.check).toMatchObject({ checked_by: "client", summary: "ok" });
    expect(meta.client_meta).toEqual({ durationSeconds: 20, width: 1080, height: 1920, sizeBytes: 100 });
    expect(JSON.stringify(meta)).not.toContain("frames");
    expect(submissionMeta(null, null)).toEqual({});
  });
});

describe("trend providers", () => {
  it("serves fixtures only when dev auth is on", async () => {
    delete process.env.AUTH_DEV_MODE;
    expect(fixtureProvider.available()).toBe(false);
    expect(await fixtureProvider.fetch({ businessId: "x", category: "Coffee shop", city: null })).toEqual([]);
    expect(listProviderStatus().find((p) => p.id === "fixture")?.available).toBe(false);
    expect(listProviderStatus().find((p) => p.id === "api")?.available).toBe(false);

    process.env.AUTH_DEV_MODE = "true";
    try {
      expect(fixtureProvider.available()).toBe(true);
      const items = await fixtureProvider.fetch({ businessId: "x", category: "Coffee shop", city: null });
      expect(items).toHaveLength(3);
      for (const t of items) {
        expect(t.id.startsWith("fixture-")).toBe(true);
        expect(t.source).toBe("fixture");
        expect(t.views).toBeNull();
        expect(t.growth_note).toBe("Development fixture");
      }
      expect(items[0].media_url).toBe("/uploads/seed/demo-latte.webp");
    } finally {
      delete process.env.AUTH_DEV_MODE;
    }
  });

  it("mergeTrends puts manual first, dedupes by link, caps at 12", () => {
    const mk = (id: string, source: TrendItem["source"], url: string | null): TrendItem => ({
      id, source, business_id: null, category: null, title: id, platform: "other", reference_url: url,
      media_url: null, thumbnail_url: null, views: null, growth_note: null, fit_note: null, created_at: "2026-01-01T00:00:00.000Z",
    });
    const merged = mergeTrends([
      [mk("c1", "curated", "https://www.instagram.com/reel/abc/"), mk("c2", "curated", "https://instagram.com/reel/xyz")],
      [mk("m1", "manual", "https://instagram.com/reel/abc?utm=1")],
      [mk("f1", "fixture", null), mk("f2", "fixture", null)],
    ]);
    expect(merged.map((t) => t.id)).toEqual(["m1", "c2", "f1", "f2"]);
    const many = mergeTrends([Array.from({ length: 20 }, (_, i) => mk(`c${i}`, "curated", `https://x.com/${i}`))]);
    expect(many).toHaveLength(12);
  });

  it("getTrendsForBusiness merges manual and curated rows for the category and dedupes by link", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner, "Coffee shop");
    const other = await makeBusiness(owner, "Gym");

    await q(
      `insert into trend_items (source, business_id, category, title, platform, reference_url, growth_note) values
         ('curated', null, 'Coffee shop', 'Employee POV: opening the shop', 'instagram', 'https://www.instagram.com/reel/pov', 'Curated by TapMart'),
         ('curated', null, null, 'Walk in with me', 'tiktok', 'https://www.tiktok.com/@x/video/1', 'Curated by TapMart'),
         ('curated', null, 'Gym', 'Rack pull PR', 'instagram', 'https://www.instagram.com/reel/gym', 'Curated by TapMart'),
         ('curated', null, 'Coffee shop', 'Archived one', 'instagram', 'https://www.instagram.com/reel/old', 'Curated by TapMart')`,
    );
    await q(`update trend_items set status = 'archived' where title = 'Archived one'`);
    const manual = await addManualTrend(business, owner, { url: "https://instagram.com/reel/pov?igsh=1" });
    expect(manual.source).toBe("manual");
    expect(manual.platform).toBe("instagram");
    expect(manual.views).toBeNull();

    const trends = await getTrendsForBusiness(business);
    const titles = trends.map((t) => t.title);
    expect(trends[0].source).toBe("manual");
    expect(trends[0].id).toBe(manual.id);
    expect(titles).not.toContain("Employee POV: opening the shop");
    expect(titles).toContain("Walk in with me");
    expect(titles).not.toContain("Rack pull PR");
    expect(titles).not.toContain("Archived one");
    expect(trends).toHaveLength(2);
    expect(trends.every((t) => t.views === null)).toBe(true);

    // Adding the same link twice does not duplicate it.
    const again = await addManualTrend(business, owner, { url: "https://instagram.com/reel/pov?igsh=1" });
    expect(again.id).toBe(manual.id);

    // Another business does not see this business's manual link, and only its own category.
    const otherTrends = await getTrendsForBusiness(other);
    expect(otherTrends.map((t) => t.title).sort()).toEqual(["Rack pull PR", "Walk in with me"]);

    // Archiving a manual trend removes it; curated rows cannot be archived per business.
    expect(await archiveTrend(manual.id, business)).toBe(true);
    const curatedId = (await q<{ id: string }>(`select id from trend_items where title = 'Walk in with me'`))[0].id;
    expect(await archiveTrend(curatedId, business)).toBe(false);
    const after = await getTrendsForBusiness(business);
    expect(after.map((t) => t.title)).toEqual(["Employee POV: opening the shop", "Walk in with me"]);
  });

  it("campaign_briefs rows cascade from the business and keep the trend link", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    const [t] = await q<{ id: string }>(
      `insert into trend_items (source, business_id, title, platform, reference_url) values ('manual', $1, 'x', 'other', 'https://x.com/1') returning id`,
      [business],
    );
    const { saveBrief, getBrief, markBriefUsed } = await import("../src/lib/ai/briefs");
    const brief = templateBrief({ businessName: "Demo Biz", category: "Coffee shop", city: "Raleigh, NC" });
    const id = await saveBrief({ businessId: business, userId: owner, trendId: t.id, brief, source: "template" });
    const stored = await getBrief(id, business);
    expect(stored?.brief.title).toBe(brief.title);
    expect(stored?.trend_id).toBe(t.id);
    expect(stored?.status).toBe("draft");
    expect(await getBrief(id, "00000000-0000-0000-0000-000000000000")).toBeNull();
    await markBriefUsed(id);
    expect((await getBrief(id, business))?.status).toBe("used");
    await q(`delete from trend_items where id = $1`, [t.id]);
    expect((await getBrief(id, business))?.trend_id).toBeNull();
  });
});
