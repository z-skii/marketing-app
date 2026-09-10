import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { EmptyState, Money, ScreenHeader } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";

export const metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };
const EARN_KINDS = ["recreate_reel", "instagram_story", "car_ads"];

type Row = {
  id: string; kind: string; title: string; status: string; pay_cents: number; slots: number; city: string | null;
  media: string | null; vehicle: string | null;
  audience: "public" | "direct"; target_name: string | null; invite_status: string | null;
  approved: number; verified: number; cars_active: number; waiting: number; applications: number; artwork: number; created_at: string;
};

type Tab = "active" | "review" | "completed";
const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Completed" },
];

/**
 * Campaigns, one media card per campaign. Three tabs: what is running,
 * what is waiting on you, what is done. Each card shows the creative it is
 * about, a title, at most two metadata rows and one action. Older campaign
 * kinds only appear under Completed once they are closed.
 */
export default async function CampaignsPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string; needs?: string; f?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/campaigns"), searchParams]);
  const business = ctx.activeBusiness;
  // Older links: ?needs=review|drivers|artwork and ?f=needs land on Review; ?f=done on Completed.
  const tab: Tab =
    params.tab === "review" || params.tab === "completed" || params.tab === "active" ? params.tab
    : params.needs || params.f === "needs" ? "review"
    : params.f === "done" ? "completed"
    : "active";

  const rows = await sql<Row>(
    `select c.id, c.kind::text as kind, c.title, c.status::text as status, c.pay_cents::int as pay_cents, c.slots, c.city, c.created_at,
            c.audience, tp.username as target_name,
            (select i.status from campaign_invites i where i.campaign_id = c.id order by i.created_at desc limit 1) as invite_status,
            coalesce(c.details->>'reference_media_url', c.details->>'creative_url', c.details->>'artwork_url',
                     (select coalesce(v.poster_url, (select url from vehicle_photos p where p.vehicle_id = v.id order by p.created_at limit 1)) from vehicles v where v.id = c.target_vehicle_id),
                     tp.avatar_url) as media,
            (select coalesce(v.poster_url, (select url from vehicle_photos p where p.vehicle_id = v.id order by p.created_at limit 1))
               from car_bookings k join vehicles v on v.id = k.vehicle_id
              where k.campaign_id = c.id and k.status in ('active', 'completed', 'creative_pending') order by k.created_at limit 1) as vehicle,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status = 'paid')::int as verified,
            (select count(*) from car_bookings k where k.campaign_id = c.id and k.status in ('active', 'completed'))::int as cars_active,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('submitted', 'under_review'))::int as waiting,
            (select count(*) from applications a where a.campaign_id = c.id and a.status = 'applied')::int as applications,
            (select count(*) from car_bookings k where k.campaign_id = c.id and k.status = 'creative_pending')::int as artwork
       from campaigns c
       left join profiles tp on tp.id = c.target_profile_id
      where c.business_id = $1
      order by (c.status in ('open', 'paused')) desc, c.created_at desc`,
    [business.id],
  );

  const isDone = (r: Row) => ["closed", "completed", "cancelled"].includes(r.status);
  const legacy = (r: Row) => !EARN_KINDS.includes(r.kind);
  const needsYou = (r: Row) => r.waiting > 0 || r.applications > 0 || r.artwork > 0;
  const pending = (r: Row) => r.waiting + r.applications + r.artwork;

  const visible = rows.filter((r) => !legacy(r) || isDone(r));
  const shown = visible.filter((r) =>
    tab === "review" ? !isDone(r) && needsYou(r)
    : tab === "completed" ? isDone(r)
    : !legacy(r) && !isDone(r));
  const reviewCount = visible.filter((r) => !isDone(r) && needsYou(r)).length;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false}
        title="Campaigns" unread={ctx.unreadNotifications} showSearch={false}
        
      />

      <nav className="pill-row mt-5" aria-label="Campaign tabs">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "active" ? "/business/campaigns" : `/business/campaigns?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined} className="pill">
            {t.label}{t.key === "review" && reviewCount > 0 ? <span className="tnum ml-1.5 text-ink-soft">{reviewCount}</span> : null}
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="mt-5">
          {tab === "active" ? (
            <EmptyState title="Nothing running yet" body="Recreate a Reel, run a Story, or put your brand on a car." actionHref="/business/create" actionLabel="Create a campaign" />
          ) : tab === "review" ? (
            <EmptyState title="Nothing to review" body="Submissions and driver applications land here the moment they arrive." />
          ) : (
            <EmptyState title="Nothing finished yet" />
          )}
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c, i) => {
            const car = c.kind === "car_ads";
            const story = c.kind === "instagram_story";
            const media = car ? (c.vehicle ?? c.media) : c.media;
            const done = isDone(c);
            const direct = c.audience === "direct";
            const inviteLine = direct
              ? c.invite_status === "sent" ? "Waiting for an answer"
                : c.invite_status === "accepted" ? (car ? "Accepted, booking set up" : "Accepted, working on it")
                : c.invite_status === "declined" ? "Declined"
                : c.invite_status === "cancelled" ? "Withdrawn" : null
              : null;
            const lines = direct
              ? [`Sent to @${c.target_name ?? "someone"}`, c.waiting > 0 ? `${c.waiting} ready to review` : c.artwork > 0 ? "Waiting on artwork" : inviteLine]
              : car
              ? [c.city ?? "Any city", `${c.cars_active} ${c.cars_active === 1 ? "car" : "cars"} active`, c.applications > 0 ? `${c.applications} ${c.applications === 1 ? "application" : "applications"}` : c.artwork > 0 ? `${c.artwork} waiting on artwork` : null]
              : story
              ? [`${c.approved} active`, `${c.verified} verified`, c.waiting > 0 ? `${c.waiting} to verify` : null]
              : [`${c.approved} / ${c.slots} submissions`, c.waiting > 0 ? `${c.waiting} ready to review` : null];
            const meta = lines.filter((l): l is string => Boolean(l)).slice(0, 2);
            const hot = !done && pending(c) > 0;
            const cta = done ? "Open" : hot ? (story ? "Verify" : "Review") : "View";
            return (
              <li key={c.id} className="reveal" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <Link href={`/business/campaigns/${c.id}`} className="card block overflow-hidden">
                  <span className={`relative block w-full overflow-hidden bg-surface-2 ${car ? "aspect-[4/3]" : "aspect-[16/11] sm:aspect-[4/5]"}`}>
                    {media && <MediaPreview src={media} className="absolute inset-0 h-full w-full object-cover" />}
                    <span className="media-scrim absolute inset-x-0 bottom-0 h-3/5" aria-hidden />
                    <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-600 text-ink">{KIND_LABEL[c.kind] ?? c.kind.replaceAll("_", " ")}</span>
                    {c.status === "paused" && <span className="glass-tag absolute top-3 right-3 px-2.5 py-1 text-xs text-ink-faint">Paused</span>}
                    {c.status === "draft" && <span className="glass-tag absolute top-3 right-3 px-2.5 py-1 text-xs text-ink-faint">Draft</span>}
                    <span className="absolute inset-x-4 bottom-4">
                      <span className="line-clamp-2 block font-display text-[1.125rem] leading-[1.2] font-600 tracking-[-0.01em] text-ink">{c.title}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3 px-3.5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="tnum block truncate text-sm text-ink">{meta[0]}</span>
                      {meta[1] && <span className={`tnum mt-0.5 block truncate text-sm ${hot ? "text-ink" : "text-ink-soft"}`}>{meta[1]}</span>}
                      {!meta[1] && <Money cents={c.pay_cents} size="sm" suffix={car ? "/ mo" : undefined} />}
                    </span>
                    <span className={`btn btn-sm shrink-0 ${hot ? "btn-signal" : ""}`}>{cta}<CaretRight size={16} weight="bold" aria-hidden /></span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
