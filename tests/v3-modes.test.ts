import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { pool, rebuildSchema, truncateAll, q, createUser } from "./helpers/db";

/**
 * TapMart V3: one account with two modes, three earning types, two plans.
 * These tests pin the database rules the new structure leans on.
 */

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterAll(() => pool.end());

async function makeBusiness(ownerId: string, name = "Demo Biz") {
  const [b] = await q<{ id: string }>(
    `insert into businesses (owner_id, name, slug) values ($1, $2, $3) returning id`,
    [ownerId, name, name.toLowerCase().replace(/\s/g, "-") + Math.random().toString(36).slice(2, 6)],
  );
  await q(`insert into business_members (business_id, profile_id, member_role) values ($1, $2, 'owner')`, [b.id, ownerId]);
  return b.id;
}

describe("campaign kinds", () => {
  it("accepts the three earning kinds and keeps type facts in details", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    for (const kind of ["recreate_reel", "instagram_story", "car_ads"]) {
      const [c] = await q<{ id: string; kind: string; min_followers: string | null }>(
        `insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots, status, details)
         values ($1, $2, $3::campaign_kind, 'Test campaign', 'A brief long enough to pass.', 2500, 3, 'open',
                 '{"min_followers": 1000}'::jsonb)
         returning id, kind::text as kind, details->>'min_followers' as min_followers`,
        [business, owner, kind],
      );
      expect(c.kind).toBe(kind);
      expect(c.min_followers).toBe("1000");
    }
    await expect(
      q(`insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots)
         values ($1, $2, 'story_post', 'Bad kind', 'A brief long enough to pass.', 2500, 3)`, [business, owner]),
    ).rejects.toThrow();
  });
});

describe("car campaigns", () => {
  it("a driver applies with a vehicle; acceptance becomes one offer and one booking tied to the campaign", async () => {
    const owner = await createUser();
    const driver = await createUser();
    const business = await makeBusiness(owner);
    const [c] = await q<{ id: string }>(
      `insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots, status, details)
       values ($1, $2, 'car_ads', 'Drivers wanted', 'Rear window decal for thirty days.', 30000, 3, 'open',
               '{"placements":["rear_window"],"duration_days":30}'::jsonb) returning id`,
      [business, owner],
    );
    const [v] = await q<{ id: string }>(
      `insert into vehicles (owner_id, year, make, model, color, status) values ($1, 2019, 'BMW', '330i', 'Black', 'listed') returning id`,
      [driver],
    );
    await q(`insert into applications (campaign_id, applicant_id, vehicle_id) values ($1, $2, $3)`, [c.id, driver, v.id]);

    const [offer] = await q<{ id: string }>(
      `insert into car_offers (vehicle_id, business_id, created_by, campaign_id, zones, monthly_cents, months, status)
       values ($1, $2, $3, $4, '{rear_window}', 30000, 1, 'accepted') returning id`,
      [v.id, business, owner, c.id],
    );
    await q(
      `insert into car_bookings (offer_id, vehicle_id, business_id, campaign_id, zones, monthly_cents)
       values ($1, $2, $3, $4, '{rear_window}', 30000)`,
      [offer.id, v.id, business, c.id],
    );
    const bookings = await q<{ campaign_id: string; status: string }>(
      `select campaign_id, status::text as status from car_bookings where vehicle_id = $1`, [v.id],
    );
    expect(bookings).toHaveLength(1);
    expect(bookings[0].campaign_id).toBe(c.id);
    expect(bookings[0].status).toBe("creative_pending");
  });
});

describe("instagram and story proof", () => {
  it("one instagram handle per person, with an honest verification source", async () => {
    const person = await createUser();
    await q(
      `insert into social_accounts (profile_id, provider, handle, follower_count, status, verified_by)
       values ($1, 'instagram', 'someone', 1200, 'pending', 'manual')`,
      [person],
    );
    await expect(
      q(`insert into social_accounts (profile_id, provider, handle) values ($1, 'instagram', 'other')`, [person]),
    ).rejects.toThrow();
    await expect(
      q(`update social_accounts set verified_by = 'magic' where profile_id = $1`, [person]),
    ).rejects.toThrow();
  });

  it("story proof rides on a submission with its link and time in meta", async () => {
    const owner = await createUser();
    const person = await createUser();
    const business = await makeBusiness(owner);
    const [c] = await q<{ id: string }>(
      `insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots, status, details)
       values ($1, $2, 'instagram_story', 'Post our story', 'Keep it live for a day please.', 2500, 20, 'open',
               '{"live_hours":24}'::jsonb) returning id`,
      [business, owner],
    );
    const [s] = await q<{ story_url: string }>(
      `insert into submissions (campaign_id, creator_id, media_urls, rights_ack, meta)
       values ($1, $2, '{"https://x/shot.png"}', true, '{"story_url":"https://instagram.com/stories/x/1","verified_by":"pending"}'::jsonb)
       returning meta->>'story_url' as story_url`,
      [c.id, person],
    );
    expect(s.story_url).toBe("https://instagram.com/stories/x/1");
  });
});

describe("plans and modes", () => {
  it("one subscription per business, only the two plans", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    await q(`insert into business_subscriptions (business_id, plan) values ($1, 'essential')`, [business]);
    await expect(
      q(`insert into business_subscriptions (business_id, plan) values ($1, 'growth')`, [business]),
    ).rejects.toThrow();
    await expect(
      q(`update business_subscriptions set plan = 'enterprise' where business_id = $1`, [business]),
    ).rejects.toThrow();
  });

  it("the active business must be one the person belongs to (app rule), and clears when the business goes", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    await q(`update profiles set active_business_id = $2 where id = $1`, [owner, business]);
    await q(`delete from businesses where id = $1`, [business]);
    const [p] = await q<{ active_business_id: string | null }>(
      `select active_business_id from profiles where id = $1`, [owner],
    );
    expect(p.active_business_id).toBeNull();
  });
});
