import "server-only";
import { sql, sqlOne } from "@/lib/db";

/**
 * Which kinds of in-app notifications a person wants. Stored as a small
 * object of category -> boolean in notification_prefs.prefs; a missing key
 * means on. notify() checks this before inserting, so muting is real.
 */
export const NOTIFICATION_KINDS: { key: string; label: string; sub: string }[] = [
  { key: "submission", label: "Submissions and applications", sub: "Someone sent work or applied to a campaign" },
  { key: "direct_request", label: "Direct requests", sub: "Answers to the requests you send, and requests sent to you" },
  { key: "content", label: "Content", sub: "Shoots, delivered photos and videos, scheduled posts" },
  { key: "car_offer", label: "Car offers", sub: "Offers, counters and booking steps" },
  { key: "system", label: "TapMart", sub: "Account, plan and payment notices" },
];

export type NotificationPrefs = Record<string, boolean>;

export async function getNotificationPrefs(profileId: string): Promise<NotificationPrefs> {
  const row = await sqlOne<{ prefs: NotificationPrefs }>(`select prefs from notification_prefs where profile_id = $1`, [profileId]);
  return row?.prefs ?? {};
}

export async function setNotificationPref(profileId: string, key: string, on: boolean) {
  if (!NOTIFICATION_KINDS.some((k) => k.key === key)) throw new Error("Unknown notification kind.");
  await sql(
    `insert into notification_prefs (profile_id, prefs) values ($1, jsonb_build_object($2::text, $3::boolean))
     on conflict (profile_id) do update set prefs = notification_prefs.prefs || jsonb_build_object($2::text, $3::boolean)`,
    [profileId, key, on],
  );
}

/** Categories that are not one of the kinds above map onto the nearest kind. */
export function kindFor(category: string): string {
  if (category.startsWith("submission") || category === "application" || category === "opportunity") return "submission";
  if (category === "direct_request") return "direct_request";
  if (category === "content" || category === "shoot" || category === "deliverable") return "content";
  if (category === "car_offer" || category === "booking") return "car_offer";
  return "system";
}

export async function wantsNotification(profileId: string, category: string): Promise<boolean> {
  const prefs = await getNotificationPrefs(profileId);
  return prefs[kindFor(category)] !== false;
}
