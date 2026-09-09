import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { pool, rebuildSchema, truncateAll, q, createUser, topUp } from "./helpers/db";

/**
 * TapMart V2 marketplace: the database enforces the rules that matter even if
 * application code is wrong — ownership, money, and one-payment-per-work.
 */

const $ = (d: number) => Math.round(d * 100);

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterAll(() => pool.end());

async function makeBusiness(ownerId: string, name = "Demo Biz") {
  const [b] = await q<{ id: string }>(
    `insert into businesses (owner_id, name, slug) values ($1, $2, $3) returning id`,
    [ownerId, name, name.toLowerCase().replace(/\s/g, "-") + Math.random().toString(36).slice(2, 6)],
  );
  await q(`insert into business_members (business_id, profile_id, member_role) values ($1, $2, 'owner')`,
    [b.id, ownerId]);
  return b.id;
}

async function makeCampaign(businessId: string, ownerId: string, payCents = $(40)) {
  const [c] = await q<{ id: string }>(
    `insert into campaigns (business_id, created_by, kind, title, brief, pay_cents, slots, status, published_at)
     values ($1, $2, 'ugc', 'Recreate our video', 'Do the thing, 15-25s vertical.', $3, 5, 'open', now())
     returning id`,
    [businessId, ownerId, payCents],
  );
  return c.id;
}

/** The submission-approval money move, as the server action performs it. */
async function payApproval(payerId: string, workerId: string, submissionId: string, amount: number, feePct = 15) {
  const fee = Math.floor((amount * feePct) / 100);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const w = await client.query(
      `select available_credit_cents from wallets where user_id = $1 for update`, [payerId]);
    const available = Number(w.rows[0]?.available_credit_cents ?? 0);
    if (available < amount) throw new Error("insufficient");
    await client.query(
      `update wallets set available_credit_cents = available_credit_cents - $2 where user_id = $1`,
      [payerId, amount]);
    await client.query(
      `insert into credit_ledger (user_id, amount_cents, transaction_type, balance_before_cents,
                                  balance_after_cents, related_entity_type, related_entity_id, reason)
       values ($1, $2, 'campaign_payment', $3, $4, 'submission', $5, 'test')`,
      [payerId, -amount, available, available - amount, submissionId]);
    const ins = await client.query(
      `insert into earnings (profile_id, source, source_id, amount_cents, fee_cents, status)
       values ($1, 'submission', $2, $3, $4, 'available')
       on conflict (source, source_id) where source_id is not null do nothing
       returning id`,
      [workerId, submissionId, amount - fee, fee]);
    if (ins.rowCount === 0) throw new Error("already paid");
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

describe("campaign submissions and money", () => {
  it("pays a creator exactly once per approved submission", async () => {
    const owner = await createUser();
    const creator = await createUser();
    await topUp(owner, $(100));
    const business = await makeBusiness(owner);
    const campaign = await makeCampaign(business, owner, $(40));
    const [s] = await q<{ id: string }>(
      `insert into submissions (campaign_id, creator_id, media_urls, rights_ack)
       values ($1, $2, '{"https://x/1.png"}', true) returning id`,
      [campaign, creator],
    );

    await payApproval(owner, creator, s.id, $(40));
    await expect(payApproval(owner, creator, s.id, $(40))).rejects.toThrow("already paid");

    const [wallet] = await q<{ available_credit_cents: string }>(
      `select available_credit_cents from wallets where user_id = $1`, [owner]);
    expect(Number(wallet.available_credit_cents)).toBe($(60));

    const earnings = await q<{ amount_cents: string; fee_cents: string }>(
      `select amount_cents, fee_cents from earnings where profile_id = $1`, [creator]);
    expect(earnings).toHaveLength(1);
    expect(Number(earnings[0].amount_cents)).toBe($(34)); // 40 minus 15%
    expect(Number(earnings[0].fee_cents)).toBe($(6));
  });

  it("refuses approval the wallet can't cover, changing nothing", async () => {
    const owner = await createUser();
    const creator = await createUser();
    await topUp(owner, $(10));
    const business = await makeBusiness(owner);
    const campaign = await makeCampaign(business, owner, $(40));
    const [s] = await q<{ id: string }>(
      `insert into submissions (campaign_id, creator_id, media_urls, rights_ack)
       values ($1, $2, '{"https://x/1.png"}', true) returning id`,
      [campaign, creator],
    );

    await expect(payApproval(owner, creator, s.id, $(40))).rejects.toThrow("insufficient");
    const earnings = await q(`select 1 from earnings where profile_id = $1`, [creator]);
    expect(earnings).toHaveLength(0);
    const [wallet] = await q<{ available_credit_cents: string }>(
      `select available_credit_cents from wallets where user_id = $1`, [owner]);
    expect(Number(wallet.available_credit_cents)).toBe($(10));
  });

  it("one application per person per campaign", async () => {
    const owner = await createUser();
    const applicant = await createUser();
    const business = await makeBusiness(owner);
    const campaign = await makeCampaign(business, owner);
    await q(`insert into applications (campaign_id, applicant_id) values ($1, $2)`, [campaign, applicant]);
    await expect(
      q(`insert into applications (campaign_id, applicant_id) values ($1, $2)`, [campaign, applicant]),
    ).rejects.toThrow();
  });
});

describe("car ads", () => {
  it("a booking is unique per offer and offers need at least one zone", async () => {
    const driver = await createUser();
    const owner = await createUser();
    const business = await makeBusiness(owner);
    const [v] = await q<{ id: string }>(
      `insert into vehicles (owner_id, year, make, model, status)
       values ($1, 2019, 'BMW', '330i', 'listed') returning id`,
      [driver],
    );
    await expect(
      q(`insert into car_offers (vehicle_id, business_id, zones, monthly_cents)
         values ($1, $2, '{}', 30000)`, [v.id, business]),
    ).rejects.toThrow();

    const [offer] = await q<{ id: string }>(
      `insert into car_offers (vehicle_id, business_id, zones, monthly_cents)
       values ($1, $2, '{driver_door,passenger_door}', 30000) returning id`,
      [v.id, business],
    );
    await q(
      `insert into car_bookings (offer_id, vehicle_id, business_id, zones, monthly_cents)
       values ($1, $2, $3, '{driver_door,passenger_door}', 30000)`,
      [offer.id, v.id, business],
    );
    await expect(
      q(`insert into car_bookings (offer_id, vehicle_id, business_id, zones, monthly_cents)
         values ($1, $2, $3, '{driver_door}', 30000)`, [offer.id, v.id, business]),
    ).rejects.toThrow();
  });
});

describe("social guardrails", () => {
  it("no self-follows, no duplicate reviews per completed work", async () => {
    const a = await createUser();
    const b = await createUser();
    await expect(
      q(`insert into follows (follower_id, followed_id) values ($1, $1)`, [a]),
    ).rejects.toThrow();
    await q(`insert into follows (follower_id, followed_id) values ($1, $2)`, [a, b]);

    const business = await makeBusiness(b);
    const campaign = await makeCampaign(business, b);
    const [s] = await q<{ id: string }>(
      `insert into submissions (campaign_id, creator_id, media_urls, rights_ack, status)
       values ($1, $2, '{"https://x/1.png"}', true, 'paid') returning id`,
      [campaign, a],
    );
    await q(
      `insert into reviews (reviewer_id, subject_type, subject_id, context_type, context_id, rating)
       values ($1, 'business', $2, 'submission', $3, 5)`,
      [a, business, s.id],
    );
    await expect(
      q(`insert into reviews (reviewer_id, subject_type, subject_id, context_type, context_id, rating)
         values ($1, 'business', $2, 'submission', $3, 4)`, [a, business, s.id]),
    ).rejects.toThrow();
  });

  it("conversation membership is the read boundary the app checks", async () => {
    const a = await createUser();
    const outsider = await createUser();
    const [conv] = await q<{ id: string }>(
      `insert into conversations (topic_type, topic_id) values ('profile', gen_random_uuid()) returning id`,
    );
    await q(`insert into conversation_members (conversation_id, profile_id) values ($1, $2)`, [conv.id, a]);
    await q(`insert into messages (conversation_id, sender_id, body) values ($1, $2, 'hello')`, [conv.id, a]);

    const asMember = await q(
      `select 1 from conversation_members where conversation_id = $1 and profile_id = $2`,
      [conv.id, a],
    );
    const asOutsider = await q(
      `select 1 from conversation_members where conversation_id = $1 and profile_id = $2`,
      [conv.id, outsider],
    );
    expect(asMember).toHaveLength(1);
    expect(asOutsider).toHaveLength(0);
  });
});
