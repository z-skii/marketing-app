import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { pool, rebuildSchema, truncateAll, q, createUser, TEST_DB } from "./helpers/db";

/**
 * Content deliverables: only the assigned verified creator (or an admin)
 * can upload for a shoot; the business approves, schedules and publishes
 * what exists; the content state follows. No network, no AI.
 */

process.env.DATABASE_URL = `postgresql://${process.env.PGUSER ?? "app"}:${process.env.PGPASSWORD ?? "app"}@${process.env.PGHOST ?? "127.0.0.1"}:5432/${TEST_DB}`;
delete process.env.ANTHROPIC_API_KEY;

import {
  addDeliverable, approveDeliverable, canUploadToShoot, finishDelivery, listDeliverables, markPublished,
  requestEdit, scheduleDeliverable,
} from "@/lib/business/deliverables";
import { getContentState } from "@/lib/business/content-state";
import { assignShootTo, listShootsAssignedTo } from "@/lib/business/shoots";
import { pool as appPool } from "@/lib/db";

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterAll(async () => {
  await appPool().end();
  await pool.end();
});

async function makeBusiness(ownerId: string) {
  const [b] = await q<{ id: string }>(
    `insert into businesses (owner_id, name, slug, category) values ($1, 'Test Cafe', $2, 'Coffee shop') returning id`,
    [ownerId, `test-cafe-${Math.random().toString(36).slice(2, 8)}`],
  );
  await q(`insert into business_members (business_id, profile_id, member_role) values ($1, $2, 'owner')`, [b.id, ownerId]);
  return b.id;
}

async function subscribe(businessId: string) {
  await q(`insert into business_subscriptions (business_id, plan, status, billing) values ($1, 'essential', 'active', 'dev')`, [businessId]);
}

async function makeCreator(verified: boolean) {
  const id = await createUser();
  await q(`insert into creator_profiles (profile_id, verification) values ($1, $2)`, [id, verified ? "verified" : "pending"]);
  return id;
}

async function makeShoot(businessId: string, assignedTo: string | null) {
  const [s] = await q<{ id: string }>(
    `insert into content_shoots (business_id, scheduled_for, starts_at, status, photos_planned, videos_planned, assigned_to, assigned_label)
     values ($1, current_date + 8, '14:00', $3, 10, 3, $2, 'Alex') returning id`,
    [businessId, assignedTo, assignedTo ? "scheduled" : "planned"],
  );
  return s.id;
}

const user = (id: string) => ({ id, role: "user" as const });
const admin = (id: string) => ({ id, role: "admin" as const });

describe("upload permission", () => {
  it("refuses anyone who is not the assigned verified creator or an admin", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    const creator = await makeCreator(true);
    const stranger = await makeCreator(true);
    const unverified = await makeCreator(false);
    const shoot = await makeShoot(business, creator);

    // The business owner is not the assignee.
    await expect(addDeliverable({ shootId: shoot, uploadedBy: user(owner), url: "/uploads/x.jpg" })).rejects.toThrow("FORBIDDEN");
    // A verified creator who is not assigned.
    await expect(addDeliverable({ shootId: shoot, uploadedBy: user(stranger), url: "/uploads/x.jpg" })).rejects.toThrow("FORBIDDEN");
    // Assigned, but not verified any more.
    await assignShootTo(shoot, null, "Outside photographer");
    await q(`update content_shoots set assigned_to = $2 where id = $1`, [shoot, unverified]);
    await expect(addDeliverable({ shootId: shoot, uploadedBy: user(unverified), url: "/uploads/x.jpg" })).rejects.toThrow("FORBIDDEN");
    expect(await canUploadToShoot(shoot, user(unverified))).toBe(false);
    // Marking delivered is refused the same way.
    await expect(finishDelivery(shoot, user(owner))).rejects.toThrow("FORBIDDEN");
    expect(await listDeliverables(business)).toHaveLength(0);
  });

  it("lets the assigned verified creator and admins upload, and flips the shoot to processing", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    const creator = await makeCreator(true);
    const adminId = await createUser();
    await q(`update profiles set role = 'admin' where id = $1`, [adminId]);
    const shoot = await makeShoot(business, creator);

    const photo = await addDeliverable({ shootId: shoot, uploadedBy: user(creator), url: "/uploads/submissions/a.webp" });
    expect(photo.kind).toBe("photo");
    expect(photo.status).toBe("new");
    expect(photo.uploader_verified).toBe(true);
    const video = await addDeliverable({ shootId: shoot, uploadedBy: admin(adminId), url: "/uploads/submissions/b.webm" });
    expect(video.kind).toBe("video");

    const [row] = await q<{ delivery_status: string; status: string }>(`select delivery_status, status from content_shoots where id = $1`, [shoot]);
    expect(row.delivery_status).toBe("processing");
    expect(row.status).toBe("scheduled");

    const mine = await listShootsAssignedTo(creator);
    expect(mine).toHaveLength(1);
    expect(mine[0].photos_uploaded).toBe(1);
    expect(mine[0].videos_uploaded).toBe(1);
  });

  it("only assigns verified creators", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    const shoot = await makeShoot(business, null);
    const pending = await makeCreator(false);
    await expect(assignShootTo(shoot, pending, null)).rejects.toThrow("verified");
    const verified = await makeCreator(true);
    const assigned = await assignShootTo(shoot, verified, "Alex");
    expect(assigned.status).toBe("scheduled");
    expect(assigned.assigned_to).toBe(verified);
  });
});

describe("delivery and the content state", () => {
  it("walks from booked shoot to published content", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    await subscribe(business);
    const creator = await makeCreator(true);
    const shoot = await makeShoot(business, creator);

    expect((await getContentState(business)).state).toBe("SHOOT_SCHEDULED");

    const d = await addDeliverable({ shootId: shoot, uploadedBy: user(creator), url: "/uploads/submissions/a.webp" });
    expect((await getContentState(business)).state).toBe("CONTENT_DELIVERED");

    const done = await finishDelivery(shoot, user(creator));
    expect(done.status).toBe("done");
    expect(done.delivery_status).toBe("delivered");
    expect(done.completed_at).not.toBeNull();
    const notes = await q<{ title: string }>(`select title from notifications where profile_id = $1`, [owner]);
    expect(notes.map((n) => n.title)).toContain("Your content is ready");

    // Another business cannot touch it.
    const other = await createUser();
    const otherBusiness = await makeBusiness(other);
    await expect(approveDeliverable(d.id, otherBusiness)).rejects.toThrow();

    await requestEdit(d.id, business, "Warmer colours");
    expect((await listDeliverables(business, { status: ["new"] }))[0].edit_note).toBe("Warmer colours");

    const approved = await approveDeliverable(d.id, business);
    expect(approved.status).toBe("approved");
    expect(approved.edit_note).toBeNull();
    expect((await getContentState(business)).state).toBe("CONTENT_APPROVED");

    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const scheduled = await scheduleDeliverable(d.id, business, `${tomorrow}T11:00`, "instagram", "photo");
    expect(scheduled.status).toBe("scheduled");
    expect(scheduled.calendar_post_id).not.toBeNull();
    const [post] = await q<{ status: string; source: string; media_urls: string[]; deliverable_id: string; format: string }>(
      `select status::text as status, source, media_urls, deliverable_id, format from calendar_posts where id = $1`, [scheduled.calendar_post_id],
    );
    expect(post.status).toBe("scheduled");
    expect(post.source).toBe("shoot");
    expect(post.media_urls).toEqual(["/uploads/submissions/a.webp"]);
    expect(post.deliverable_id).toBe(d.id);
    expect(post.format).toBe("photo");
    expect((await getContentState(business)).state).toBe("CONTENT_SCHEDULED");

    await expect(scheduleDeliverable(d.id, business, `${tomorrow}T12:00`)).rejects.toThrow();

    const published = await markPublished(d.id, business);
    expect(published.status).toBe("published");
    const [after] = await q<{ status: string }>(`select status::text as status from calendar_posts where id = $1`, [scheduled.calendar_post_id]);
    expect(after.status).toBe("published");
    expect((await getContentState(business)).state).toBe("CONTENT_PUBLISHED");
  });

  it("reports the states before any content exists", async () => {
    const owner = await createUser();
    const business = await makeBusiness(owner);
    expect((await getContentState(business)).state).toBe("NOT_SUBSCRIBED");
    await subscribe(business);
    // ensureMonthlyShoots plans a slot, but a planned slot is not a booked shoot.
    expect((await getContentState(business)).state).toBe("SUBSCRIBED_NO_SHOOT");
  });
});
