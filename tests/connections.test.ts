import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { pool, rebuildSchema, truncateAll, q, createUser, TEST_DB } from "./helpers/db";

/**
 * Provider connections: nothing is scored, counted or proposed before a
 * real connection exists, and the OAuth pipeline builds the right requests.
 * Google and Meta are never reached: fetch is mocked where a test needs it.
 */

process.env.DATABASE_URL = `postgresql://${process.env.PGUSER ?? "app"}:${process.env.PGPASSWORD ?? "app"}@${process.env.PGHOST ?? "127.0.0.1"}:5432/${TEST_DB}`;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;
delete process.env.META_APP_ID;
delete process.env.META_APP_SECRET;

import { getGoogleSummary, connectionStateFrom } from "@/lib/google/summary";
import { NotConnectedError, evaluateGoogleProfile, getLastGoogleHealth, profileFromLocation, runGoogleHealth, storeGoogleHealth } from "@/lib/google/business";
import { exchangeCode, googleAuthUrl, disconnectGoogle, withGoogleToken, GOOGLE_TOKEN_URL } from "@/lib/google/oauth";
import { fixesFrom, patchFor, hoursToGooglePeriods } from "@/lib/google/fixes";
import { consumeState, createState } from "@/lib/oauth/state";
import { getInstagramForProfile, connectInstagramManually, confirmInstagramManually, meetsFollowerRequirement } from "@/lib/v2/instagram";
import { researchBrand, readWebsiteHtml, heuristicToneWords, NO_SOURCES_MESSAGE } from "@/lib/business/brand";
import { snapshotFrom } from "@/lib/social/instagram-business";
import { pool as appPool } from "@/lib/db";

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
});
afterAll(async () => {
  await appPool().end();
  await pool.end();
});

async function makeBusiness(ownerId: string, extra: Partial<{ name: string; website: string | null; logo: string | null; phone: string | null }> = {}) {
  const name = extra.name ?? "Demo Biz";
  const [b] = await q<{ id: string }>(
    `insert into businesses (owner_id, name, slug, category, website, logo_url, phone)
     values ($1, $2, $3, 'Coffee shop', $4, $5, $6) returning id`,
    [ownerId, name, name.toLowerCase().replace(/\s/g, "-") + Math.random().toString(36).slice(2, 6), extra.website ?? null, extra.logo ?? null, extra.phone ?? null],
  );
  await q(`insert into business_members (business_id, profile_id, member_role) values ($1, $2, 'owner')`, [b.id, ownerId]);
  return b.id;
}

/** A realistic location as the Business Information API returns it. */
const LOCATION = {
  name: "locations/123",
  title: "Demo Coffee Co.",
  categories: { primaryCategory: { displayName: "Coffee shop", name: "categories/gcid:coffee_shop" } },
  storefrontAddress: { addressLines: ["12 Main St"], locality: "Springfield", administrativeArea: "IL", postalCode: "62701", regionCode: "US" },
  phoneNumbers: {},
  regularHours: { periods: [
    { openDay: "MONDAY", openTime: { hours: 8 }, closeDay: "MONDAY", closeTime: { hours: 17 } },
    { openDay: "TUESDAY", openTime: { hours: 8 }, closeDay: "TUESDAY", closeTime: { hours: 17 } },
  ] },
  profile: { description: "Coffee and pastries." },
  metadata: { mapsUri: "https://maps.google.com/?cid=1", newReviewUri: "https://search.google.com/local/writereview?placeid=1" },
  openInfo: { status: "OPEN" },
};

const REVIEWS = {
  totalReviewCount: 3,
  averageRating: 4.3,
  reviews: [
    { reviewId: "r1", name: "accounts/1/locations/123/reviews/r1", reviewer: { displayName: "Ana" }, starRating: "FIVE", comment: "Great flat white.", createTime: "2026-08-01T10:00:00Z" },
    { reviewId: "r2", name: "accounts/1/locations/123/reviews/r2", reviewer: { displayName: "Ben" }, starRating: "FOUR", comment: "Cosy.", createTime: "2026-08-10T10:00:00Z", reviewReply: { comment: "Thanks!" } },
    { reviewId: "r3", name: "accounts/1/locations/123/reviews/r3", reviewer: { displayName: "Cy" }, starRating: "THREE", comment: "Slow on Sundays.", createTime: "2026-08-20T10:00:00Z" },
  ],
};

const MEDIA = { totalMediaItemCount: 2, mediaItems: [{ name: "m1", createTime: "2026-03-01T00:00:00Z" }, { name: "m2", createTime: "2026-02-01T00:00:00Z" }] };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** Routes Google API calls to fixtures and records every request. */
function mockGoogle(calls: { url: string; init?: RequestInit }[]) {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push({ url, init });
    if (url.startsWith(GOOGLE_TOKEN_URL)) return jsonResponse({ access_token: "fresh-token", expires_in: 3600, scope: "business.manage" });
    if (url.includes("/v1/locations/123?")) return jsonResponse(LOCATION);
    if (url.includes("/reviews")) return jsonResponse(REVIEWS);
    if (url.includes("/media")) return jsonResponse(MEDIA);
    return jsonResponse({ error: { message: `unexpected ${url}` } }, 500);
  }));
}

async function insertConnectedGoogle(businessId: string, expiresAt = new Date(Date.now() + 3600_000)) {
  await q(
    `insert into connected_accounts (business_id, provider, status, source, access_token, refresh_token, token_expires_at, external_name, meta, connected_at)
     values ($1, 'google_business', 'connected', 'oauth', 'tok', 'refresh', $2, 'Demo Coffee Co.',
             $3::jsonb, now())`,
    [businessId, expiresAt.toISOString(), JSON.stringify({ location: { name: "locations/123", title: "Demo Coffee Co.", account: "accounts/1", address: "12 Main St" } })],
  );
}

describe("google summary before any connection", () => {
  it("is not_connected with no score and no issues, and the check refuses to run", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    const summary = await getGoogleSummary(business);
    expect(summary.status).toBe("not_connected");
    expect(summary.score).toBeNull();
    expect(summary.issues).toEqual([]);
    expect(summary.source).toBeNull();
    expect(summary.connection).toEqual({ status: "not_connected", locationTitle: null, lastSyncedAt: null });
    await expect(runGoogleHealth(business)).rejects.toBeInstanceOf(NotConnectedError);
    expect(await getLastGoogleHealth(business)).toBeNull();
    expect(await q(`select 1 from google_health_checks where business_id = $1`, [business])).toEqual([]);
  });

  it("maps every row state onto the five honest states", () => {
    expect(connectionStateFrom(null)).toBe("not_connected");
    expect(connectionStateFrom({ status: "pending", last_error: null })).toBe("connecting");
    expect(connectionStateFrom({ status: "connected", last_error: null })).toBe("connected");
    expect(connectionStateFrom({ status: "error", last_error: "Needs reconnect" })).toBe("needs_reconnect");
    expect(connectionStateFrom({ status: "error", last_error: "Google returned: server_error" })).toBe("error");
  });
});

describe("google health on a connected account", () => {
  it("reads the listing through the API, stores a traceable run and surfaces issues", async () => {
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    const owner = await createUser();
    const business = await makeBusiness(owner, { phone: "555 0100" });
    await insertConnectedGoogle(business);
    const calls: { url: string; init?: RequestInit }[] = [];
    mockGoogle(calls);

    const health = await runGoogleHealth(business);
    expect(health.source).toBe("api");
    expect(health.checks.every((c) => c.source === "api" && "observed" in c)).toBe(true);
    const byKey = Object.fromEntries(health.checks.map((c) => [c.key, c]));
    expect(byKey.name.status).toBe("ok");
    expect(byKey.name.observed).toBe("Demo Coffee Co.");
    expect(byKey.phone.status).toBe("missing");
    expect(byKey.phone.observed).toBeNull();
    expect(byKey.hours.status).toBe("warn");
    expect(byKey.hours.detail).toBe("Hours for 2 of 7 days.");
    expect(byKey.reviews.status).toBe("warn");
    expect(byKey.reviews.detail).toBe("2 reviews without a reply.");
    expect(byKey.reviews.observed).toEqual({ total: 3, unanswered: 2 });
    expect(byKey.photo_activity.status).toBe("warn");
    expect(byKey.photo_activity.detail).toBe("No photos added in 90 days.");
    expect(byKey.photos.observed).toBe(2);

    // Only Google endpoints were called, with the stored token.
    expect(calls.map((c) => new URL(c.url).host)).toEqual([
      "mybusinessbusinessinformation.googleapis.com", "mybusiness.googleapis.com", "mybusiness.googleapis.com",
    ]);
    expect(calls[0].url).toContain("readMask=");
    expect((calls[0].init?.headers as Record<string, string>).authorization).toBe("Bearer tok");

    // The snapshot is stored on the connection and the run in google_health_checks.
    const [row] = await q<{ meta: { profile: { reviews: { unanswered: number }; address: string } }; last_synced_at: string }>(
      `select meta, last_synced_at from connected_accounts where business_id = $1 and provider = 'google_business'`, [business],
    );
    expect(row.meta.profile.reviews.unanswered).toBe(2);
    expect(row.meta.profile.address).toBe("12 Main St, Springfield, IL, 62701");
    expect(row.last_synced_at).not.toBeNull();
    const stored = await q<{ source: string }>(`select source from google_health_checks where business_id = $1`, [business]);
    expect(stored).toEqual([{ source: "api" }]);

    const summary = await getGoogleSummary(business);
    expect(summary.status).toBe("attention");
    expect(summary.source).toBe("api");
    expect(summary.score).toBe(health.score);
    expect(summary.issues.length).toBeGreaterThan(0);
    expect(summary.issues[0]).toBe("No phone number.");
    expect(summary.connection.locationTitle).toBe("Demo Coffee Co.");

    // Fixes: phone can be sent (TapMart has one), reviews cannot.
    const fixes = fixesFrom(health.checks.filter((c) => c.status !== "ok"), row.meta.profile as never, { phone: "555 0100", website: null, description: null, hours: null });
    const phone = fixes.find((f) => f.key === "phone")!;
    expect(phone).toMatchObject({ current: null, proposed: "555 0100", canApply: true });
    const reviews = fixes.find((f) => f.key === "reviews")!;
    expect(reviews.canApply).toBe(false);
    expect(reviews.reason).toContain("Google does not allow this change through the API");
    expect(reviews.href).toBe("https://maps.google.com/?cid=1");
    expect(patchFor("phone", "555 0100")).toEqual({ updateMask: "phoneNumbers.primaryPhone", body: { phoneNumbers: { primaryPhone: "555 0100" } } });

    // Disconnecting removes tokens, the snapshot and every stored run.
    await disconnectGoogle(business);
    expect(await getLastGoogleHealth(business)).toBeNull();
    expect((await getGoogleSummary(business)).status).toBe("not_connected");
    expect(await q(`select 1 from google_health_checks where business_id = $1`, [business])).toEqual([]);
    const [after] = await q<{ access_token: string | null; meta: object }>(`select access_token, meta from connected_accounts where business_id = $1 and provider = 'google_business'`, [business]);
    expect(after.access_token).toBeNull();
    expect(after.meta).toEqual({});
  });

  it("refreshes an expired token before calling the API and marks a failed refresh as needs reconnect", async () => {
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    const owner = await createUser();
    const business = await makeBusiness(owner);
    await insertConnectedGoogle(business, new Date(Date.now() - 1000));
    const calls: { url: string; init?: RequestInit }[] = [];
    mockGoogle(calls);

    const seen = await withGoogleToken(business, async (token) => token);
    expect(seen).toBe("fresh-token");
    expect(calls[0].url).toBe(GOOGLE_TOKEN_URL);
    expect(String(calls[0].init?.body)).toContain("grant_type=refresh_token");
    const [row] = await q<{ access_token: string }>(`select access_token from connected_accounts where business_id = $1`, [business]);
    expect(row.access_token).toBe("fresh-token");

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "invalid_grant" }, 400)));
    await q(`update connected_accounts set token_expires_at = now() - interval '1 minute' where business_id = $1`, [business]);
    await expect(withGoogleToken(business, async () => "never")).rejects.toThrow("Needs reconnect");
    expect((await getGoogleSummary(business)).status).toBe("needs_reconnect");
  });

  it("evaluates a stored snapshot without Google and keeps observed values", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    await insertConnectedGoogle(business);
    const profile = profileFromLocation(LOCATION as never, {
      account: "accounts/1",
      reviews: { data: null, reason: "Google did not allow reading reviews for this location (HTTP 403)." },
      media: { data: null, reason: "Google did not allow reading photos for this location (HTTP 403)." },
    });
    expect(profile.reviews?.unavailable_reason).toContain("403");
    const checks = evaluateGoogleProfile(profile, new Date("2026-09-10T00:00:00Z"));
    // No reviews and no photo checks when Google refused those reads: nothing is invented.
    expect(checks.some((c) => c.key === "reviews" || c.key === "photos" || c.key === "photo_activity")).toBe(false);
    const health = await storeGoogleHealth(business, profile);
    expect((await getLastGoogleHealth(business))?.checks.find((c) => c.key === "hours")?.observed).toEqual(LOCATION.regularHours.periods);
    expect(health.score).toBeGreaterThan(0);
  });
});

describe("google oauth", () => {
  it("builds the consent URL with offline access and the business.manage scope", () => {
    process.env.GOOGLE_CLIENT_ID = "client-1";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    const url = new URL(googleAuthUrl("state-x", "https://tapmart.test/api/oauth/google/callback"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/business.manage");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("state-x");
    expect(url.searchParams.get("redirect_uri")).toBe("https://tapmart.test/api/oauth/google/callback");
  });

  it("exchangeCode posts the right form to the token endpoint and returns absolute expiry", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-1";
    process.env.GOOGLE_CLIENT_SECRET = "secret-1";
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL, init?: RequestInit) => {
      calls.push({ url: String(input), init });
      return jsonResponse({ access_token: "at", refresh_token: "rt", expires_in: 3599, scope: "https://www.googleapis.com/auth/business.manage" });
    }));
    const now = new Date("2026-09-10T12:00:00Z");
    const tokens = await exchangeCode("code-abc", "https://tapmart.test/api/oauth/google/callback", now);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://oauth2.googleapis.com/token");
    expect(calls[0].init?.method).toBe("POST");
    const body = new URLSearchParams(String(calls[0].init?.body));
    expect(body.get("code")).toBe("code-abc");
    expect(body.get("client_id")).toBe("client-1");
    expect(body.get("client_secret")).toBe("secret-1");
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("redirect_uri")).toBe("https://tapmart.test/api/oauth/google/callback");
    expect(tokens).toEqual({ access_token: "at", refresh_token: "rt", expires_at: "2026-09-10T12:59:59.000Z", scope: "https://www.googleapis.com/auth/business.manage" });
  });

  it("refuses without credentials", async () => {
    await expect(exchangeCode("code", "https://tapmart.test/cb")).rejects.toThrow("not configured");
  });

  it("oauth states are single use and expire after 15 minutes", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    const state = await createState({ provider: "google_business", profileId: owner, businessId: business, returnTo: "/business/settings/connections" });
    expect(state.length).toBeGreaterThan(30);
    const first = await consumeState(state);
    expect(first).toMatchObject({ provider: "google_business", profileId: owner, businessId: business, returnTo: "/business/settings/connections" });
    expect(await consumeState(state)).toBeNull();

    const old = await createState({ provider: "instagram_user", profileId: owner });
    expect(await consumeState(old, new Date(Date.now() + 16 * 60_000))).toBeNull();
    expect(await consumeState("nope")).toBeNull();
  });
});

describe("a person's instagram", () => {
  it("shows no follower count while a manual handle is pending, and only after an admin confirms it", async () => {
    const person = await createUser();
    await connectInstagramManually(person, "@demo.creator", 1850);
    let ig = await getInstagramForProfile(person);
    expect(ig.status).toBe("pending");
    expect(ig.handle).toBe("demo.creator");
    expect(ig.followers).toBeNull();
    expect(ig.media).toEqual([]);
    expect(ig.verifiedBy).toBe("manual");
    expect(await meetsFollowerRequirement(person, 1000)).toEqual({ ok: false, followers: null });

    await confirmInstagramManually(person);
    ig = await getInstagramForProfile(person);
    expect(ig.status).toBe("connected");
    expect(ig.followers).toBe(1850);
    expect(await meetsFollowerRequirement(person, 1000)).toEqual({ ok: true, followers: 1850 });
  });

  it("has nothing for a person without a row", async () => {
    const person = await createUser();
    const ig = await getInstagramForProfile(person);
    expect(ig).toMatchObject({ status: "disconnected", handle: null, followers: null, avatarUrl: null, verifiedBy: "none", media: [], apiConfigured: false });
  });
});

describe("brand research", () => {
  it("refuses when there is nothing real to research", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    await expect(researchBrand(business)).rejects.toThrow(NO_SOURCES_MESSAGE);
    expect(await q(`select 1 from brand_kits where business_id = $1`, [business])).toEqual([]);
  });

  it("reads a website honestly, records a failed fetch, and proposes from what it found", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner, { website: "https://example.test", logo: null });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      `<html><head><title>Bean &amp; Co</title><meta name="description" content="Small batch coffee, roasted in town.">
       <meta property="og:image" content="/hero.jpg"><meta name="theme-color" content="#2b1d14"><link rel="icon" href="/favicon.png">
       <style>.a{color:#C9A67A}.b{background:#c9a67a}.c{border-color:#C9A67A}.d{color:#123456}h1{font-family:"Fraunces",serif}p{font-family:Inter,sans-serif}</style>
       </head><body><img src="/one.jpg"><img src="https://cdn.example.test/two.png"></body></html>`,
      { status: 200, headers: { "content-type": "text/html" } },
    )));
    const { research, signals, proposal, source } = await researchBrand(business);
    expect(source).toBe("template");
    expect(research.sources.website.status).toBe("used");
    expect(research.sources.website.title).toBe("Bean & Co");
    expect(research.sources.website.og_image).toBe("https://example.test/hero.jpg");
    expect(research.sources.website.colors).toEqual(["#C9A67A"]);
    expect(research.sources.website.fonts).toEqual(["Fraunces", "Inter"]);
    expect(research.sources.instagram.status).toBe("not_connected");
    expect(research.sources.google.status).toBe("not_connected");
    expect(research.sources.logo.status).toBe("missing");
    expect(signals.colors).toEqual(["#2B1D14", "#C9A67A"]);
    expect(signals.tone_source).toBe("heuristic");
    expect(proposal.palette.slice(0, 2)).toEqual(["#2B1D14", "#C9A67A"]);
    expect(proposal.type.display).toBe("Fraunces");
    expect(proposal.image_examples).toContain("https://example.test/hero.jpg");
    const [row] = await q<{ research: { sources: { website: { status: string } } }; existing_signals: { colors: string[] }; researched_at: string; proposed_source: string }>(
      `select research, existing_signals, researched_at, proposed_source from brand_kits where business_id = $1`, [business],
    );
    expect(row.research.sources.website.status).toBe("used");
    expect(row.existing_signals.colors).toEqual(signals.colors);
    expect(row.researched_at).not.toBeNull();
    expect(row.proposed_source).toBe("template");

    // A site that cannot be reached is recorded as failed, not invented.
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    const second = await researchBrand(business);
    expect(second.research.sources.website.status).toBe("failed");
    expect(second.research.sources.website.note).toBe("The website could not be reached from TapMart.");
    expect(second.research.sources.website.colors).toEqual([]);
  });

  it("parses html and tone heuristically without a model", () => {
    const read = readWebsiteHtml(`<title>Shop</title><style>a{color:#fff}b{color:#000}c{color:#ABCDEF}d{color:#abcdef}e{color:#abcdef}</style><img src="x.jpg">`, "https://shop.test/page");
    expect(read.colors).toEqual(["#ABCDEF"]);
    expect(read.images).toEqual(["https://shop.test/x.jpg"]);
    expect(heuristicToneWords(["Handmade in our neighbourhood. Open today!", "Come say hi."])).toEqual(expect.arrayContaining(["crafted", "local", "direct", "concise"]));
    expect(heuristicToneWords([])).toEqual([]);
    expect(hoursToGooglePeriods({ monday: "09:00-17:00", sunday: "closed" })).toEqual([{ openDay: "MONDAY", openTime: { hours: 9, minutes: 0 }, closeDay: "MONDAY", closeTime: { hours: 17, minutes: 0 } }]);
    expect(hoursToGooglePeriods({ mon: "8-5" })).toBeNull();
  });
});

describe("business instagram growth", () => {
  it("only reports a follower change when two real readings exist in the period", () => {
    const now = new Date("2026-09-10T12:00:00Z");
    expect(snapshotFrom({ followers: 100, history: [{ day: "2026-09-09", followers: 100 }] }, now)).toBeNull();
    const snap = snapshotFrom({
      followers: 130,
      history: [{ day: "2026-08-20", followers: 100 }, { day: "2026-09-09", followers: 130 }],
      media: [{ id: "m", media_type: "IMAGE", media_url: "https://cdn/x.jpg", thumbnail_url: null, permalink: "https://instagram.com/p/x", caption: "Hi", timestamp: "2026-09-01T00:00:00Z", like_count: 3, comments_count: 1 }],
    }, now);
    expect(snap?.source).toBe("api");
    expect(snap?.metrics.followers_delta).toBe(30);
    expect(snap?.metrics.reach).toBeNull();
    expect(snap?.top_post?.href).toBe("https://instagram.com/p/x");
  });
});
