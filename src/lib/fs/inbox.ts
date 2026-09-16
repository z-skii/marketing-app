import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { KIND_LABEL, isEarnKind } from "@/lib/v2/opportunities";

/**
 * Conversations as the person sees them: the other person, the last line,
 * the unread state, and the real thing the thread is about. A thread is
 * anchored to a campaign, a car offer or booking, a business or a profile;
 * the context line names it and links to it in the viewer's mode.
 */
export type Thread = {
  id: string; topic_type: string | null; topic_id: string | null;
  campaign_kind: string | null; campaign_title: string | null; campaign_business_id: string | null;
  vehicle_label: string | null;
  other_id: string | null; other_name: string | null; other_username: string | null; other_avatar: string | null;
  last_body: string | null; last_at: string | null; unread: boolean;
};

const THREAD_SELECT = `
  select c.id, c.topic_type, c.topic_id::text as topic_id,
         cp.kind::text as campaign_kind, cp.title as campaign_title, cp.business_id::text as campaign_business_id,
         (case when c.topic_type in ('offer', 'booking') then (select v.year || ' ' || v.make || ' ' || v.model from vehicles v
             where v.id = coalesce((select vehicle_id from car_bookings bk where bk.id = c.topic_id), (select vehicle_id from car_offers o where o.id = c.topic_id))) end) as vehicle_label,
         p.id as other_id, p.display_name as other_name, p.username as other_username, p.avatar_url as other_avatar,
         lm.body as last_body, lm.created_at as last_at,
         (lm.created_at > m.last_read_at and lm.sender_id is distinct from $1) as unread
    from conversation_members m
    join conversations c on c.id = m.conversation_id
    left join campaigns cp on c.topic_type = 'campaign' and cp.id = c.topic_id
    left join lateral (select body, created_at, sender_id from messages msg where msg.conversation_id = c.id order by created_at desc limit 1) lm on true
    left join lateral (select p2.id, p2.display_name, p2.username, p2.avatar_url from conversation_members m2 join profiles p2 on p2.id = m2.profile_id
                        where m2.conversation_id = c.id and m2.profile_id <> $1 limit 1) p on true
   where m.profile_id = $1`;

export async function listThreads(profileId: string): Promise<Thread[]> {
  return sql<Thread>(`${THREAD_SELECT} and lm.created_at is not null order by unread desc nulls last, lm.created_at desc limit 100`, [profileId]);
}

export async function getThread(profileId: string, conversationId: string): Promise<Thread | null> {
  return sqlOne<Thread>(`${THREAD_SELECT} and c.id = $2`, [profileId, conversationId]);
}

/** "Recreate · Latte pour" or "Car ad · 2017 BMW 328i": the real thing the thread is about, and where it lives for this viewer. */
export function threadContext(t: Thread, mode: "user" | "business", activeBusinessId: string | null): { label: string; href: string | null } | null {
  if (t.topic_type === "campaign" && t.topic_id) {
    const kind = t.campaign_kind && isEarnKind(t.campaign_kind) ? KIND_LABEL[t.campaign_kind] : "Campaign";
    const mine = mode === "business" && activeBusinessId && t.campaign_business_id === activeBusinessId;
    return { label: t.campaign_title ? `${kind} · ${t.campaign_title}` : kind, href: mine ? `/business/campaigns/${t.topic_id}` : mode === "user" ? `/o/${t.topic_id}` : null };
  }
  if (t.topic_type === "offer" || t.topic_type === "booking") return { label: t.vehicle_label ? `Car ad · ${t.vehicle_label}` : "Car ad", href: null };
  if (t.topic_type === "business") return { label: "Business", href: null };
  if (t.topic_type === "profile") return { label: "Profile", href: null };
  return null;
}

export function fmtWhen(iso: string, now = Date.now()): string {
  const d = new Date(iso);
  const sameDay = new Date(now).toDateString() === d.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (now - d.getTime() < 6 * 86_400_000) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
