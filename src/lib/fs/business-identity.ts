import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { getSubscription, type Subscription } from "@/lib/v2/subscriptions";
import { getNextShoot, type ContentShoot } from "@/lib/business/shoots";
import { getBrandKit, type BrandKitRecord } from "@/lib/business/brand";
import { connectionState, type ConnectionState } from "@/lib/social/summary";
import { PLAN_BY_KEY, type Plan } from "@/config/plans";

/**
 * Everything the Business Profile and Settings show about one business,
 * read from the records that exist. No figure here is derived from a
 * guess: counts are counts, connections are the stored rows, the plan is
 * the stored subscription.
 */
export type BusinessRow = {
  id: string; name: string; slug: string; category: string | null; city: string | null; website: string | null;
  cover_url: string | null; logo_url: string | null; verification: string; description: string | null;
};

export type ProviderState = { provider: "instagram" | "google_business"; state: ConnectionState; name: string | null; error: string | null; syncedAt: string | null };

export type BusinessIdentity = {
  row: BusinessRow;
  providers: ProviderState[];
  counts: { active: number; scheduled: number; delivered: number; review: number };
  subscription: Subscription | null;
  plan: Plan | null;
  shoot: ContentShoot | null;
  brand: BrandKitRecord | null;
  members: number;
};

export function hostOf(url: string | null): string | null {
  if (!url) return null;
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

export async function loadBusinessIdentity(businessId: string): Promise<BusinessIdentity | null> {
  const [row, connections, counts, subscription, shoot, brand, members] = await Promise.all([
    sqlOne<BusinessRow>(
      `select id, name, slug, category, city, website, cover_url, logo_url, verification::text as verification, description from businesses where id = $1`,
      [businessId],
    ),
    sql<{ provider: "instagram" | "google_business"; status: string; external_name: string | null; last_error: string | null; last_synced_at: string | null; meta: Record<string, unknown> }>(
      `select provider, status::text as status, external_name, last_error, last_synced_at, meta from connected_accounts where business_id = $1 and provider in ('instagram', 'google_business')`,
      [businessId],
    ),
    sqlOne<{ active: string; scheduled: string; delivered: string; review: string }>(
      `select (select count(*) from campaigns where business_id = $1 and status = 'open' and kind in ('recreate_reel', 'instagram_story', 'car_ads'))::text as active,
              (select count(*) from calendar_posts where business_id = $1 and status = 'scheduled' and scheduled_for >= now())::text as scheduled,
              (select count(*) from content_deliverables where business_id = $1)::text as delivered,
              ((select count(*) from applications a join campaigns c on c.id = a.campaign_id where c.business_id = $1 and a.status = 'applied')
             + (select count(*) from submissions s join campaigns c on c.id = s.campaign_id where c.business_id = $1 and s.status in ('submitted', 'under_review')))::text as review`,
      [businessId],
    ),
    getSubscription(businessId),
    getNextShoot(businessId).catch(() => null),
    getBrandKit(businessId).catch(() => null),
    sqlOne<{ n: string }>(`select count(*)::text as n from business_members where business_id = $1`, [businessId]),
  ]);
  if (!row) return null;
  const providers: ProviderState[] = (["instagram", "google_business"] as const).map((provider) => {
    const c = connections.find((x) => x.provider === provider);
    const state = connectionState(c ? { status: c.status as "disconnected" | "pending" | "connected" | "error", last_error: c.last_error } : null);
    const location = (c?.meta as { location?: { title?: string } } | undefined)?.location;
    return { provider, state, name: provider === "google_business" ? location?.title ?? c?.external_name ?? null : c?.external_name ?? null, error: c?.last_error ?? null, syncedAt: c?.last_synced_at ?? null };
  });
  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  return {
    row,
    providers,
    counts: { active: Number(counts?.active ?? 0), scheduled: Number(counts?.scheduled ?? 0), delivered: Number(counts?.delivered ?? 0), review: Number(counts?.review ?? 0) },
    subscription: active,
    plan: active ? PLAN_BY_KEY[active.plan] : null,
    shoot,
    brand,
    members: Number(members?.n ?? 1),
  };
}

export function brandState(brand: BrandKitRecord | null): { label: string; tone: "confirmed" | "waiting" | "neutral"; sub: string } {
  const kit = brand?.kit;
  const has = Boolean(kit && (kit.palette.length > 0 || kit.logo_url || kit.type.display));
  if (!has) return { label: "Not built", tone: "neutral", sub: "No approved kit yet" };
  if (brand?.proposed) return { label: "Suggestions waiting", tone: "waiting", sub: "A proposal is waiting for your decision" };
  return { label: "Approved", tone: "confirmed", sub: `${kit!.palette.length} colour${kit!.palette.length === 1 ? "" : "s"}${kit!.type.display ? ` · ${kit!.type.display}` : ""}` };
}

export const STATE_WORD: Record<ConnectionState, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" }> = {
  connected: { label: "Connected", tone: "confirmed" },
  connecting: { label: "Finish connecting", tone: "waiting" },
  needs_reconnect: { label: "Reconnect required", tone: "problem" },
  error: { label: "Needs attention", tone: "problem" },
  not_connected: { label: "Not connected", tone: "neutral" },
};

export function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtTime(t: string | null | undefined): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: m ? "2-digit" : undefined }).replace(":00", "");
}
