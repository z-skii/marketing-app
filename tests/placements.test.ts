import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { pool, rebuildSchema, truncateAll, q, createUser, createLink, topUp, allocate, click } from "./helpers/db";

const $ = (d: number) => Math.round(d * 100);

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterAll(() => pool.end());

/** Open the daily round at this instant, so the whole day is still schedulable. */
async function openRoundNow() {
  await q(`select ensure_current_round()`);
  await q(`update daily_rounds set starts_at = now(), ends_at = now() + interval '1 day'
           where status = 'active'`);
}

async function fundedLinks(count: number, type: "bar" | "spot", cents = $(5)) {
  const user = await createUser();
  await topUp(user, cents * count);
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const link = await createLink(user, { name: `Link ${String(i).padStart(3, "0")}` });
    ids.push(await allocate(user, link, type, cents));
  }
  return { user, placements: ids };
}

describe("the bar", () => {
  it("§73 — never shows more than the configured capacity, and queues the rest", async () => {
    await q(`update app_settings set value = '10' where key = 'bar_capacity'`);
    const { placements } = await fundedLinks(14, "bar");

    const live = await q(`select * from public_bar`);
    expect(live).toHaveLength(10);

    const queued = await q(`select * from bar_queue where queue_position > 10`);
    expect(queued).toHaveLength(4);

    // Entry order decides who is on the strip.
    const positions = await q<{ queue_position: number; placement_id: string }>(
      `select queue_position, placement_id from bar_queue order by queue_position`,
    );
    expect(positions.map((p) => p.placement_id).slice(0, 10)).toEqual(placements.slice(0, 10));
  });

  it("promotes the next waiting link when a live one runs out of credit", async () => {
    await q(`update app_settings set value = '2' where key = 'bar_capacity'`);
    const { placements } = await fundedLinks(3, "bar", 5);   // one click each

    let live = await q<{ placement_id: string }>(`select * from public_bar order by queue_position`);
    expect(live.map((l) => l.placement_id)).toEqual(placements.slice(0, 2));

    // Exhaust the link sitting at position 1.
    const r = await click(placements[0]);
    expect(r.qualified).toBe(true);

    live = await q<{ placement_id: string }>(`select * from public_bar order by queue_position`);
    expect(live).toHaveLength(2);
    expect(live.map((l) => l.placement_id)).toEqual([placements[1], placements[2]]);
  });

  it("lets a new link enter immediately while there is room", async () => {
    await q(`update app_settings set value = '100' where key = 'bar_capacity'`);
    const { user } = await fundedLinks(3, "bar");
    expect(await q(`select * from public_bar`)).toHaveLength(3);

    await topUp(user, $(5));
    const link = await createLink(user);
    await allocate(user, link, "bar", $(5));

    expect(await q(`select * from public_bar`)).toHaveLength(4);
  });

  it("keeps unapproved links off the strip", async () => {
    const user = await createUser();
    await topUp(user, $(10));
    const pending = await createLink(user, { approved: false });
    await allocate(user, pending, "bar", $(5));

    expect(await q(`select * from public_bar`)).toHaveLength(0);
  });
});

describe("the spot", () => {
  it("§72 — gives each eligible link its full run of appearances, spread across the day", async () => {
    const { placements } = await fundedLinks(6, "spot");
    // Simulate the scheduler running at the moment the round opens, so the
    // whole day is still ahead of it.
    await openRoundNow();
    const created = await q<{ schedule_spot_day: number }>(`select schedule_spot_day()`);
    expect(created[0].schedule_spot_day).toBeGreaterThan(0);

    const perDay = 10;
    for (const p of placements) {
      const slots = await q<{ starts_at: Date }>(
        `select starts_at from spot_schedules where placement_id = $1 order by starts_at`, [p],
      );
      expect(slots.length).toBe(perDay);

      // No two appearances back to back: they are spread through the day.
      const gapsMinutes = slots.slice(1).map(
        (s, i) => (s.starts_at.getTime() - slots[i].starts_at.getTime()) / 60000,
      );
      // 1440 minutes / 10 appearances = one every 144 minutes.
      for (const gap of gapsMinutes) expect(Math.round(gap)).toBe(144);
    }
  });

  it("never books two links into the same minute", async () => {
    await fundedLinks(12, "spot");
    await openRoundNow();
    await q(`select schedule_spot_day()`);

    const clashes = await q<{ n: string }>(
      `select count(*) as n from (
         select starts_at from spot_schedules group by starts_at having count(*) > 1
       ) x`,
    );
    expect(Number(clashes[0].n)).toBe(0);
  });

  it("shows one link at a time and skips a placement that has run dry", async () => {
    const { placements } = await fundedLinks(3, "spot", 5);
    await q(`select schedule_spot_day()`);

    // Force a known slot around now for the first placement.
    await q(`delete from spot_schedules`);
    await q(
      `insert into spot_schedules (placement_id, round_id, starts_at, ends_at, status)
       select $1, id, now() - interval '10 seconds', now() + interval '50 seconds', 'scheduled'
       from daily_rounds where status = 'active'`, [placements[0]],
    );

    let spot = await q(`select * from public_spot`);
    expect(spot).toHaveLength(1);

    // Drain it; it should drop out of the spot immediately.
    await click(placements[0]);
    spot = await q(`select * from public_spot`);
    expect(spot).toHaveLength(0);
  });

  it("caps the schedule at the configured spot capacity", async () => {
    await q(`update app_settings set value = '4' where key = 'spot_capacity'`);
    await fundedLinks(9, "spot");
    await openRoundNow();
    await q(`select schedule_spot_day()`);

    const distinct = await q<{ n: string }>(
      `select count(distinct placement_id) as n from spot_schedules`,
    );
    expect(Number(distinct[0].n)).toBe(4);
  });
});
