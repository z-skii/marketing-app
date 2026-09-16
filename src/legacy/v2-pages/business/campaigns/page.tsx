import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { formatCredit } from "@/lib/money";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { Money } from "@/components/v2/ui";
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

  const visible = rows.filter((r) => !legacy(r) || isDone(r));
  const shown = visible.filter((r) =>
    tab === "review" ? !isDone(r) && needsYou(r)
    : tab === "completed" ? isDone(r)
    : !legacy(r) && !isDone(r));
  const reviewCount = visible.filter((r) => !isDone(r) && needsYou(r)).length;

  const emptyCopy = {
    active: { title: "No active campaigns", body: "Create one from the Create tab when you are ready." },
    review: { title: "Nothing to review", body: "Submissions, Story verification and car applications will appear here." },
    completed: { title: "No completed campaigns yet", body: "Closed campaigns and finished direct requests will appear here." },
  }[tab];
  const ordered = [...shown].sort((a, b) => Number(!isDone(b) && needsYou(b)) - Number(!isDone(a) && needsYou(a)));

  return (
    <main id="main" className="mx-auto w-full max-w-[1208px] px-4 pt-[14px] pb-6 rail:px-8 rail:pt-0">
      <div className="rail:flex rail:h-16 rail:items-center">
        <h1 className="font-display text-[23px] leading-[29px] font-[800] tracking-[-0.45px] rail:text-[30px] rail:leading-9 rail:font-[820] rail:tracking-[-0.8px]">Campaigns</h1>
      </div>

      <nav className="pill-row mt-[14px] !gap-2.5 rail:mt-4" aria-label="Campaign tabs">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "active" ? "/business/campaigns" : `/business/campaigns?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined} className="pill">
            {t.label}{t.key === "review" && reviewCount > 0 ? <span className="tnum inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-signal/18 px-1 text-[11px] leading-[13px] font-[760] text-signal">{reviewCount}</span> : null}
          </Link>
        ))}
      </nav>

      {ordered.length === 0 ? (
        <div className="card mt-[18px] max-w-[420px] p-[18px]">
          <p className="font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px]">{emptyCopy.title}</p>
          <p className="mt-1.5 text-[13px] leading-[18px] text-ink-soft">{emptyCopy.body}</p>
        </div>
      ) : (
        <ul className="mt-[18px] grid gap-[14px] rail:grid-cols-[repeat(auto-fill,360px)] rail:gap-[18px]">
          {ordered.map((c, i) => {
            const car = c.kind === "car_ads";
            const story = c.kind === "instagram_story";
            const media = car ? (c.vehicle ?? c.media) : c.media;
            const done = isDone(c);
            const direct = c.audience === "direct";
            const hot = !done && needsYou(c);
            const kindLabel = KIND_LABEL[c.kind] ?? c.kind.replaceAll("_", " ");
            const audience = direct
              ? c.invite_status === "sent" ? `Sent to @${c.target_name ?? "someone"}`
                : c.invite_status === "accepted" ? `Accepted by @${c.target_name ?? "someone"}`
                : c.invite_status === "declined" ? "Declined" : c.invite_status === "cancelled" ? "Withdrawn" : "Direct"
              : "Public";
            const progress = car
              ? [c.applications > 0 ? `${c.applications} applied` : null, c.artwork > 0 ? "Artwork needed" : null, `${c.cars_active} ${c.cars_active === 1 ? "car" : "cars"} active`].filter(Boolean)[0]
              : story ? (c.waiting > 0 ? `${c.waiting} to verify` : `${c.verified}/${c.approved} verified`)
              : (c.waiting > 0 ? `${c.waiting} ready to review` : `${c.approved}/${c.slots} approved`);
            const st = done ? { label: "Done", cls: "is-done" } : hot ? { label: "Review", cls: "is-review" } : c.status === "paused" ? { label: "Paused", cls: "is-warning" } : c.status === "draft" ? { label: "Draft", cls: "is-done" } : direct && c.invite_status === "sent" ? { label: "Pending", cls: "is-warning" } : { label: "Active", cls: "" };
            const cta = story && c.waiting > 0 ? "Verify" : c.artwork > 0 ? "Add artwork" : "Review";
            const href = `/business/campaigns/${c.id}`;

            if (!hot) {
              return (
                <li key={c.id} className="reveal" style={{ animationDelay: `${Math.min(i, 5) * 35}ms` }}>
                  <Link href={href} className="row flex min-h-[84px] items-center gap-3 p-3 transition-[background,transform] duration-100 active:scale-[0.985]" aria-label={`${c.title}, ${kindLabel}, ${st.label}`}>
                    {media ? (
                      <MediaPreview src={media} className={`shrink-0 rounded-[12px] bg-[#151b1e] object-cover ${car ? "h-14 w-14 rounded-[13px]" : "h-16 w-12"}`} />
                    ) : (
                      <span className={`shrink-0 rounded-[12px] bg-[#151b1e] ${car ? "h-14 w-14" : "h-16 w-12"}`} aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[14px] leading-[18px] font-700 tracking-[-0.1px]">{c.title}</span>
                      <span className="block truncate text-[12px] leading-4 text-ink-soft">{kindLabel} · {audience}</span>
                      <span className={`status-text ${st.cls} !font-500 !text-ink-soft`}><span aria-hidden className="status-dot" />{done ? "Closed" : c.status === "paused" ? "Paused" : c.status === "draft" ? "Draft" : progress}</span>
                    </span>
                    {c.pay_cents > 0 && <Money cents={c.pay_cents} size="sm" suffix={car ? "/mo" : undefined} />}
                    <CaretRight size={18} className="shrink-0 text-ink-soft" aria-hidden />
                  </Link>
                </li>
              );
            }
            if (story) {
              return (
                <li key={c.id} className="reveal" style={{ animationDelay: `${Math.min(i, 5) * 35}ms` }}>
                  <Link href={href} className="card flex gap-3 p-3" aria-label={`${c.title}, Story, ${progress}`}>
                    <span className="relative h-[224px] w-[126px] shrink-0 overflow-hidden rounded-[16px] bg-[#090c0e]">
                      {media ? <MediaPreview src={media} className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-[12px] text-ink-faint">No media</span>}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex flex-wrap gap-1.5"><span className="glass-tag">Story</span><span className="inline-flex h-6 items-center rounded-full bg-white/7 px-2 text-[11px] font-[650] text-ink-soft">{direct ? "Direct" : "Public"}</span></span>
                      <span className={`status-text ${st.cls} mt-2`}><span aria-hidden className="status-dot" />{st.label}</span>
                      {c.pay_cents > 0 && <span className="tnum mt-2 font-display text-[24px] leading-7 font-[820] tracking-[-0.6px] text-signal">{formatCredit(c.pay_cents)}</span>}
                      <span className="mt-1 line-clamp-2 font-display text-[15px] leading-[19px] font-[740] tracking-[-0.15px]">{c.title}</span>
                      <span className="mt-1 truncate text-[12px] leading-4 text-ink-soft">{direct ? audience : progress}</span>
                      <span className="btn btn-signal mt-auto w-full">{cta}</span>
                    </span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={c.id} className="reveal" style={{ animationDelay: `${Math.min(i, 5) * 35}ms` }}>
                <Link href={href} className="card block overflow-hidden" aria-label={`${c.title}, ${kindLabel}, ${progress}`}>
                  <span className="relative block h-[220px] w-full overflow-hidden bg-[#151b1e]">
                    {media ? <MediaPreview src={media} className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-[12px] text-ink-faint">No media</span>}
                    <span className="absolute inset-x-0 top-0 h-[72px] bg-[image:var(--tm-scrim-top)]" aria-hidden />
                    <span className="absolute inset-x-0 bottom-0 h-[120px] bg-[image:var(--tm-scrim)]" aria-hidden />
                    <span className="absolute top-[14px] left-[14px] flex gap-1.5"><span className="glass-tag">{kindLabel}</span><span className="inline-flex h-6 items-center rounded-full bg-white/9 px-2 text-[11px] font-[650] text-ink-2">{direct ? "Direct" : "Public"}</span></span>
                    <span className={`status-text ${st.cls} absolute top-[14px] right-[14px] h-6 rounded-full bg-[color:var(--tm-lime-tint)] px-2`}><span aria-hidden className="status-dot" />{st.label}</span>
                    <span className="absolute inset-x-[14px] bottom-[14px] block">
                      {c.pay_cents > 0 && <span className="tnum block font-display text-[27px] leading-[30px] font-[850] tracking-[-0.7px] text-signal">{formatCredit(c.pay_cents)}{car ? <span className="text-[12px] font-700 text-ink-2">/mo</span> : null}</span>}
                      <span className="mt-1 line-clamp-2 block font-display text-[20px] leading-[25px] font-[760] tracking-[-0.35px] text-ink">{c.title}</span>
                    </span>
                  </span>
                  <span className="flex h-[92px] items-center justify-between gap-3 px-[14px]">
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[14px] leading-[18px] font-700">{direct ? audience : progress}</span>
                      <span className="block truncate text-[12px] leading-4 text-ink-soft">{direct ? progress : audience}</span>
                    </span>
                    <span className="btn btn-signal shrink-0">{cta}</span>
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
