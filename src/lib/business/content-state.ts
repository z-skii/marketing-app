import "server-only";
import { sql } from "@/lib/db";
import { getSubscription, type Subscription } from "@/lib/v2/subscriptions";
import { countDeliverables, type DeliverableCounts } from "./deliverables";
import { ensureMonthlyShoots, getLastShoot, getNextShoot, getShootById, type ContentShoot } from "./shoots";

/**
 * Where a business is on the way from "subscribed" to "content published".
 * The Content tab renders from this, so it only ever shows what exists:
 * a real shoot on a real date, real files a verified creator uploaded, and
 * calendar posts made from those files.
 */

export const CONTENT_STATES = [
  "NOT_SUBSCRIBED",
  "SUBSCRIBED_NO_SHOOT",
  "SHOOT_SCHEDULED",
  "SHOOT_COMPLETED",
  "CONTENT_PROCESSING",
  "CONTENT_DELIVERED",
  "CONTENT_APPROVED",
  "CONTENT_SCHEDULED",
  "CONTENT_PUBLISHED",
] as const;

export type ContentState = (typeof CONTENT_STATES)[number];

export type ContentStateInfo = {
  state: ContentState;
  subscription: Subscription | null;
  /** The soonest shoot that has not happened yet (booked ones first). */
  nextShoot: ContentShoot | null;
  /** The most recent shoot that happened. */
  lastShoot: ContentShoot | null;
  /** The shoot whose content is on its way or has just landed. */
  deliveringShoot: ContentShoot | null;
  counts: DeliverableCounts;
};

/** The rank of a state: higher wins when several apply. */
export function stateRank(state: ContentState): number {
  return CONTENT_STATES.indexOf(state);
}

export function atLeast(state: ContentState, floor: ContentState): boolean {
  return stateRank(state) >= stateRank(floor);
}

export async function getContentState(businessId: string, now = new Date()): Promise<ContentStateInfo> {
  const subscription = await getSubscription(businessId);
  const live = subscription && (subscription.status === "active" || subscription.status === "trialing");
  const empty: DeliverableCounts = { new: 0, approved: 0, rejected: 0, scheduled: 0, published: 0, total: 0 };
  if (!live) {
    return { state: "NOT_SUBSCRIBED", subscription, nextShoot: null, lastShoot: null, deliveringShoot: null, counts: empty };
  }

  // A subscribed business always has its month's shoot slots planned.
  await ensureMonthlyShoots(businessId, now);

  const [nextShoot, lastShoot, counts, delivering] = await Promise.all([
    getNextShoot(businessId),
    getLastShoot(businessId),
    countDeliverables(businessId),
    sql<{ id: string; delivery_status: string; status: string }>(
      `select id, delivery_status, status from content_shoots
        where business_id = $1 and status <> 'cancelled' and delivery_status <> 'none'
        order by (delivery_status = 'processing') desc, updated_at desc limit 1`,
      [businessId],
    ).then((rows) => rows[0] ?? null),
  ]);

  let state: ContentState = "SUBSCRIBED_NO_SHOOT";
  if (nextShoot && nextShoot.status === "scheduled" && nextShoot.scheduled_for) state = "SHOOT_SCHEDULED";
  if (lastShoot) state = "SHOOT_COMPLETED";
  if (delivering?.delivery_status === "processing") state = "CONTENT_PROCESSING";
  if (delivering?.delivery_status === "delivered" || counts.new > 0) state = "CONTENT_DELIVERED";
  if (counts.approved > 0) state = "CONTENT_APPROVED";
  if (counts.scheduled > 0) state = "CONTENT_SCHEDULED";
  if (counts.published > 0) state = "CONTENT_PUBLISHED";

  let deliveringShoot: ContentShoot | null = null;
  if (delivering) {
    deliveringShoot = lastShoot?.id === delivering.id ? lastShoot
      : nextShoot?.id === delivering.id ? nextShoot
      : await getShootById(delivering.id);
  }

  return { state, subscription, nextShoot, lastShoot, deliveringShoot, counts };
}
