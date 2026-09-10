import "server-only";
import { sqlOne } from "@/lib/db";

/**
 * Business health: a score out of 100 built only from things the business
 * has actually done. Every signal is listed with its points and where to
 * fix it, so the number is never a mystery. No signal is estimated.
 */

export type HealthSignal = {
  key: string;
  label: string;
  points: number;
  ok: boolean;
  /** Why it matters, in one line. */
  why: string;
  fix: { href: string; label: string };
};

export type BusinessHealth = {
  score: number;
  max: number;
  label: "Strong" | "Needs attention" | "Getting started";
  signals: HealthSignal[];
};

export function healthLabel(score: number): BusinessHealth["label"] {
  if (score >= 80) return "Strong";
  if (score >= 50) return "Needs attention";
  return "Getting started";
}

export async function getBusinessHealth(businessId: string): Promise<BusinessHealth> {
  const row = await sqlOne<{
    logo: boolean; cover: boolean; description: boolean; hours: boolean; website: boolean; contact: boolean;
    verified: boolean; connected: boolean; recent_post: boolean; recent_campaign: boolean;
  }>(
    `select
       (b.logo_url is not null) as logo,
       (b.cover_url is not null) as cover,
       (coalesce(char_length(b.description), 0) >= 40) as description,
       (b.hours is not null and b.hours::text not in ('{}', 'null', '[]')) as hours,
       (b.website is not null and b.website <> '') as website,
       ((b.phone is not null and b.phone <> '') or (b.address is not null and b.address <> '')) as contact,
       (b.verification = 'verified') as verified,
       exists (select 1 from connected_accounts a where a.business_id = b.id and a.status = 'connected') as connected,
       exists (select 1 from calendar_posts p where p.business_id = b.id
                and p.status = 'published' and p.published_at > now() - interval '14 days') as recent_post,
       exists (select 1 from campaigns c where c.business_id = b.id
                and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
                and c.published_at > now() - interval '30 days') as recent_campaign
     from businesses b where b.id = $1`,
    [businessId],
  );
  const r = row ?? {
    logo: false, cover: false, description: false, hours: false, website: false, contact: false,
    verified: false, connected: false, recent_post: false, recent_campaign: false,
  };

  const signals: HealthSignal[] = [
    { key: "logo", label: "Logo", points: 10, ok: r.logo, why: "Your mark on every campaign card and notification.", fix: { href: "/business/edit", label: "Add a logo" } },
    { key: "cover", label: "Cover photo", points: 10, ok: r.cover, why: "The photo behind your public page and car campaigns.", fix: { href: "/business/edit", label: "Add a cover photo" } },
    { key: "description", label: "Description", points: 10, ok: r.description, why: "A few sentences people read before they take part.", fix: { href: "/business/edit", label: "Write a description" } },
    { key: "hours", label: "Opening hours", points: 10, ok: r.hours, why: "Hours come in with your Google Business Profile connection.", fix: { href: "/business/social", label: "Connect Google" } },
    { key: "website", label: "Website", points: 5, ok: r.website, why: "Where your public page sends people.", fix: { href: "/business/edit", label: "Add your website" } },
    { key: "contact", label: "Phone or address", points: 5, ok: r.contact, why: "How drivers and creators reach you.", fix: { href: "/business/edit", label: "Add contact details" } },
    { key: "connected", label: "A connected account", points: 10, ok: r.connected, why: "Needed for auto-posting from the content calendar.", fix: { href: "/business/social", label: "Connect an account" } },
    { key: "recent_post", label: "A post in the last 14 days", points: 15, ok: r.recent_post, why: "Published from your content calendar.", fix: { href: "/business/content", label: "Plan a post" } },
    { key: "recent_campaign", label: "A campaign in the last 30 days", points: 15, ok: r.recent_campaign, why: "Real people making content or driving for you.", fix: { href: "/business/create", label: "Run a campaign" } },
    { key: "verified", label: "Verified business", points: 10, ok: r.verified, why: "Checked by TapMart. Verified businesses get a mark on every card.", fix: { href: "/business/edit", label: "Complete your profile" } },
  ];

  const max = signals.reduce((s, x) => s + x.points, 0);
  const score = signals.filter((x) => x.ok).reduce((s, x) => s + x.points, 0);
  return { score, max, label: healthLabel(score), signals };
}
