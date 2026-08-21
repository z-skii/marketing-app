import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  pool, rebuildSchema, truncateAll, q, createUser, createLink,
  topUp, allocate, placement, boardScore, click,
} from "./helpers/db";

const $ = (dollars: number) => Math.round(dollars * 100);

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterAll(() => pool.end());

/** Drain a placement by exactly n qualified clicks, each from a fresh visitor. */
async function drain(placementId: string, clicks: number) {
  for (let i = 0; i < clicks; i++) {
    const r = await click(placementId, `visitor-${randomUUID()}`);
    if (!r.qualified) return i;
  }
  return clicks;
}

describe("board scoring invariant", () => {
  it("§64 — clicks drain remaining credit but never lower the board score", async () => {
    const user = await createUser();
    await topUp(user, $(50));
    const link = await createLink(user);
    const p = await allocate(user, link, "board", $(50));

    expect(await boardScore(p)).toBe($(50));
    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(50));

    // $49 of clicks at 5c each.
    const spent = await drain(p, 980);
    expect(spent).toBe(980);

    expect(await boardScore(p)).toBe($(50));                       // score holds
    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(1));
  });

  it("§65 — a top-up raises the score by the amount added this round", async () => {
    const user = await createUser();
    await topUp(user, $(70));
    const link = await createLink(user);
    const p = await allocate(user, link, "board", $(50));
    await drain(p, 980);

    expect(await boardScore(p)).toBe($(50));
    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(1));

    await allocate(user, link, "board", $(20));

    expect(await boardScore(p)).toBe($(70));
    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(21));
  });

  it("§66 — the daily reset clears the score but never the money", async () => {
    const user = await createUser();
    await topUp(user, $(70));
    const link = await createLink(user);
    const p = await allocate(user, link, "board", $(70));
    await drain(p, 980);   // $49 spent → $21 left

    expect(await boardScore(p)).toBe($(70));
    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(21));

    await q(`select close_round_and_open_next()`);

    expect(await boardScore(p)).toBe(0);
    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(21));

    // And a fresh allocation scores from zero again.
    await topUp(user, $(10));
    await allocate(user, link, "board", $(10));
    expect(await boardScore(p)).toBe($(10));
    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(31));
  });

  it("§67 — the last affordable click exhausts the placement and delists it", async () => {
    const user = await createUser();
    await topUp(user, $(5));
    const link = await createLink(user);
    const p = await allocate(user, link, "board", 5);   // exactly one click

    const first = await click(p);
    expect(first.qualified).toBe(true);

    const after = await placement(p);
    expect(Number(after.remaining_credit_cents)).toBe(0);
    expect(after.status).toBe("exhausted");

    // Gone from the public board, but the score survives in history.
    const board = await q(`select * from public_board where placement_id = $1`, [p]);
    expect(board).toHaveLength(0);
    expect(await boardScore(p)).toBe(5);   // the round score keeps its 5c

    const second = await click(p);
    expect(second.qualified).toBe(false);
    expect(second.rejection_reason).toBe("placement_inactive");
    expect(second.destination_url).toContain("https://");   // still redirects
  });

  it("§68 — the same visitor is charged once per link inside the duplicate window", async () => {
    const user = await createUser();
    await topUp(user, $(10));
    const link = await createLink(user);
    const board = await allocate(user, link, "board", $(5));
    const bar = await allocate(user, link, "bar", $(5));

    const visitor = "visitor-repeat";
    expect((await click(board, visitor)).qualified).toBe(true);

    const again = await click(board, visitor);
    expect(again.qualified).toBe(false);
    expect(again.rejection_reason).toBe("duplicate_window");

    // Deduplication is per canonical link, so another placement of the same
    // link is not a way around it.
    const viaBar = await click(bar, visitor);
    expect(viaBar.qualified).toBe(false);
    expect(viaBar.rejection_reason).toBe("duplicate_window");

    expect(Number((await placement(board)).remaining_credit_cents)).toBe($(5) - 5);
    expect(Number((await placement(bar)).remaining_credit_cents)).toBe($(5));
  });

  it("rejects an owner clicking their own link", async () => {
    const user = await createUser();
    await topUp(user, $(5));
    const link = await createLink(user);
    const p = await allocate(user, link, "board", $(5));

    const r = await click(p, "v1", { viewerUser: user });
    expect(r.qualified).toBe(false);
    expect(r.rejection_reason).toBe("owner_click");
  });

  it("never charges for a link that is still awaiting moderation", async () => {
    const user = await createUser();
    await topUp(user, $(5));
    const link = await createLink(user, { approved: false });
    const p = await allocate(user, link, "board", $(5));

    expect((await placement(p)).status).toBe("pending");
    const r = await click(p);
    expect(r.qualified).toBe(false);
    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(5));
  });
});

describe("creator attribution", () => {
  it("§69 — one qualified click charges once and pays the creator once", async () => {
    const owner = await createUser();
    const creator = await createUser();
    await topUp(owner, $(5));
    const link = await createLink(owner);
    const p = await allocate(owner, link, "board", $(5));

    const [ref] = await q<{ id: string }>(
      `insert into creator_referrals (creator_user_id, referral_code, target_type)
       values ($1, $2, 'home') returning id`, [creator, "abc123"],
    );

    const r = await click(p, "referred-visitor", { creatorUser: creator, creatorReferral: ref.id });
    expect(r.qualified).toBe(true);
    expect(r.debited_cents).toBe(5);

    const earnings = await q(`select * from creator_earnings where creator_user_id = $1`, [creator]);
    expect(earnings).toHaveLength(1);
    expect(Number(earnings[0].amount_cents)).toBe(1);
    expect(earnings[0].status).toBe("pending");

    expect(Number((await placement(p)).remaining_credit_cents)).toBe($(5) - 5);

    // A repeat from the same visitor pays nothing further.
    const dup = await click(p, "referred-visitor", { creatorUser: creator, creatorReferral: ref.id });
    expect(dup.qualified).toBe(false);
    expect(await q(`select * from creator_earnings where creator_user_id = $1`, [creator])).toHaveLength(1);
  });

  it("a creator never earns from clicks on their own link", async () => {
    const owner = await createUser();
    await topUp(owner, $(5));
    const link = await createLink(owner);
    const p = await allocate(owner, link, "board", $(5));

    const r = await click(p, "v", { creatorUser: owner });
    expect(r.qualified).toBe(true);
    expect(await q(`select * from creator_earnings`)).toHaveLength(0);
  });
});

describe("concurrency and idempotency", () => {
  it("§70 — simultaneous clicks never overspend a nearly empty placement", async () => {
    const user = await createUser();
    await topUp(user, $(10));
    const link = await createLink(user);
    const p = await allocate(user, link, "board", 25);   // exactly 5 clicks of 5c

    const attempts = 40;
    const results = await Promise.all(
      Array.from({ length: attempts }, (_, i) => click(p, `race-visitor-${i}`)),
    );

    const ok = results.filter((r) => r.qualified);
    expect(ok).toHaveLength(5);
    expect(ok.reduce((s, r) => s + r.debited_cents, 0)).toBe(25);

    const after = await placement(p);
    expect(Number(after.remaining_credit_cents)).toBe(0);
    expect(Number(after.remaining_credit_cents)).toBeGreaterThanOrEqual(0);
    expect(after.status).toBe("exhausted");

    // The ledger agrees with the placement.
    const [led] = await q<{ sum: string }>(
      `select coalesce(sum(-amount_cents),0) as sum from credit_ledger
       where user_id = $1 and transaction_type = 'qualified_click_debit'`, [user],
    );
    expect(Number(led.sum)).toBe(25);
  });

  it("§71 — a replayed Stripe webhook credits the user exactly once", async () => {
    const user = await createUser();
    const session = `cs_test_${randomUUID()}`;

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        q<{ apply_stripe_topup: boolean }>(
          `select apply_stripe_topup($1, $2, $3, $4)`, [user, session, "pi_1", $(25)],
        ).then((r) => r[0].apply_stripe_topup).catch(() => false),
      ),
    );

    expect(results.filter(Boolean)).toHaveLength(1);

    const [w] = await q<{ available_credit_cents: string }>(
      `select available_credit_cents from wallets where user_id = $1`, [user],
    );
    expect(Number(w.available_credit_cents)).toBe($(25));

    const ledger = await q(
      `select * from credit_ledger where user_id = $1 and transaction_type = 'stripe_topup'`, [user],
    );
    expect(ledger).toHaveLength(1);
  });

  it("keeps the cached wallet total in step with the source rows", async () => {
    const user = await createUser();
    await topUp(user, $(100));
    const link = await createLink(user);
    const b = await allocate(user, link, "board", $(50));
    await allocate(user, link, "spot", $(30));
    await allocate(user, link, "bar", $(20));

    const [w] = await q<{ available_credit_cents: string; cached_total_remaining_credit_cents: string }>(
      `select * from wallets where user_id = $1`, [user],
    );
    expect(Number(w.available_credit_cents)).toBe(0);
    expect(Number(w.cached_total_remaining_credit_cents)).toBe($(100));

    await drain(b, 10);   // 50c of clicks

    const [w2] = await q<{ cached_total_remaining_credit_cents: string }>(
      `select * from wallets where user_id = $1`, [user],
    );
    const [truth] = await q<{ wallet_total_credit_cents: string }>(
      `select wallet_total_credit_cents($1)`, [user],
    );
    expect(Number(w2.cached_total_remaining_credit_cents)).toBe($(100) - 50);
    expect(Number(truth.wallet_total_credit_cents)).toBe(Number(w2.cached_total_remaining_credit_cents));
  });

  it("refuses to allocate more than the available credit", async () => {
    const user = await createUser();
    await topUp(user, $(10));
    const link = await createLink(user);
    await expect(allocate(user, link, "board", $(11))).rejects.toThrow(/insufficient available credit/);
  });
});

describe("placements share one canonical link", () => {
  it("keeps a separate balance per placement type", async () => {
    const user = await createUser();
    await topUp(user, $(80));
    const link = await createLink(user);
    const board = await allocate(user, link, "board", $(40));
    const spot = await allocate(user, link, "spot", $(25));
    const bar = await allocate(user, link, "bar", $(15));

    expect(Number((await placement(board)).remaining_credit_cents)).toBe($(40));
    expect(Number((await placement(spot)).remaining_credit_cents)).toBe($(25));
    expect(Number((await placement(bar)).remaining_credit_cents)).toBe($(15));

    const links = await q(`select count(*) as n from links where id = $1`, [link]);
    expect(Number(links[0].n)).toBe(1);
  });
});
