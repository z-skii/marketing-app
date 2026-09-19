import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles, getOpportunities, type EarnKind, type FeedTab } from "@/lib/v2/opportunities";
import { sqlOne } from "@/lib/db";
import { OpportunityCard } from "@/components/app/OpportunityCard";
import { PinIcon, ArrowRightIcon, PlayIcon, InstagramIcon, CarIcon, SparkleIcon, GridIcon as SquaresFourIcon, WarningIcon } from "@/ds/icons";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * Home: WHAT CAN I EARN FROM RIGHT NOW. A photographic marketplace of the
 * real open campaigns near the person: one filter row for the kind
 * (All, Recreate, Story, Car, Loyalty), one for the ordering (For you,
 * Nearby, Top pay), then the cards. Same data, filters and paging as
 * before; the resume line and the city prompt stay above the grid.
 */
const ORDER: { key: FeedTab; label: string }[] = [
  { key: "for_you", label: "For you" },
  { key: "nearby", label: "Nearby" },
  { key: "top_pay", label: "Top pay" },
];
const KINDS: { key: string; kind: EarnKind | null; label: string; icon: typeof PlayIcon }[] = [
  { key: "all", kind: null, label: "All", icon: SquaresFourIcon },
  { key: "recreate", kind: "recreate_reel", label: "Recreate", icon: PlayIcon },
  { key: "stories", kind: "instagram_story", label: "Story", icon: InstagramIcon },
  { key: "cars", kind: "car_ads", label: "Car", icon: CarIcon },
  { key: "loyalty", kind: null, label: "Loyalty", icon: SparkleIcon },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ offset?: string; f?: string; k?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  if (ctx.mode === "business") redirect("/business");

  const tab: FeedTab = ORDER.some((o) => o.key === params.f) ? (params.f as FeedTab) : "for_you";
  const kindEntry = KINDS.find((k) => k.key === params.k && k.key !== "all") ?? null;
  const loyalty = kindEntry?.key === "loyalty";
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 12;
  const href = (o: { f?: FeedTab; k?: string | null; offset?: number }) => {
    const f = o.f ?? tab; const k = o.k === undefined ? kindEntry?.key ?? null : o.k; const off = o.offset ?? 0;
    const q = [f !== "for_you" ? `f=${f}` : null, k ? `k=${k}` : null, off ? `offset=${off}` : null].filter(Boolean).join("&");
    return `/home${q ? `?${q}` : ""}`;
  };

  const [cards, vehicles, resume] = await Promise.all([
    loyalty ? Promise.resolve([]) : getOpportunities({ viewerId: ctx.user.id, viewerCity: ctx.city, tab, kind: kindEntry?.kind ?? null, limit: pageSize + 1, offset }),
    getMyVehicles(ctx.user.id),
    sqlOne<{ kind: string; title: string; n: string }>(
      `select * from (
         select 'revision' as kind, c.title, count(*)::text as n, max(s.created_at) as at
           from submissions s join campaigns c on c.id = s.campaign_id
          where s.creator_id = $1 and s.status = 'revision_requested' group by c.title
         union all
         select 'accepted', c.title, count(*)::text, max(a.decided_at)
           from applications a join campaigns c on c.id = a.campaign_id
          where a.applicant_id = $1 and a.status = 'accepted'
            and not exists (select 1 from submissions s where s.campaign_id = c.id and s.creator_id = $1)
          group by c.title
       ) x order by (kind = 'revision') desc, at desc nulls last limit 1`,
      [ctx.user.id],
    ),
  ]);
  const hasMore = cards.length > pageSize;
  const page = cards.slice(0, pageSize);
  const listedVehicle = vehicles.find((v) => v.status === "listed");

  return (
    <main className="fs-phone-main" id="main">
      <div className="ap-head">
        <div>
          <h1>Find paid work</h1>
          <p className="ap-sub">{ctx.city ? `Available near you · ${ctx.city}` : "Open campaigns from local businesses"}</p>
        </div>
      </div>

      {resume && (
        <Link href="/activity" className="ap-note" style={{ marginTop: 14 }}>
          <WarningIcon size={20} aria-hidden style={{ color: "var(--tm-warning)" }} />
          <span className="ap-note-text"><b style={{ fontWeight: 600 }}>{resume.kind === "revision" ? "Revision requested" : "Accepted, ready to film"}</b> · {resume.title}</span>
          <ArrowRightIcon size={18} aria-hidden style={{ color: "var(--tm-red)" }} />
        </Link>
      )}
      {!ctx.city && (
        <Link href="/me/edit" className="ap-note is-warm" style={{ marginTop: 10 }}>
          <PinIcon size={20} aria-hidden style={{ color: "var(--tm-muted)" }} />
          <span className="ap-note-text">Add your city to see work nearby</span>
          <ArrowRightIcon size={18} aria-hidden style={{ color: "var(--tm-red)" }} />
        </Link>
      )}

      <nav className="ap-chips" aria-label="Kind">
        {KINDS.map((k) => {
          const on = k.key === "all" ? !kindEntry : kindEntry?.key === k.key;
          return <Link key={k.key} href={href({ k: k.key === "all" ? null : k.key })} className="pill" aria-current={on ? "page" : undefined}><k.icon size={15} aria-hidden />{k.label}</Link>;
        })}
      </nav>
      <nav className="ap-chips" aria-label="Ordering" style={{ marginTop: 4 }}>
        {ORDER.map((o) => <Link key={o.key} href={o.key === "nearby" && !ctx.city ? "/me/edit" : href({ f: o.key })} className="pill" aria-current={o.key === tab ? "page" : undefined} style={{ background: o.key === tab ? undefined : "transparent", borderColor: o.key === tab ? undefined : "transparent" }}>{o.label}</Link>)}
      </nav>

      {loyalty ? (
        <section className="card" style={{ marginTop: 16, padding: 20, maxWidth: 560 }} aria-label="Loyalty">
          <span className="badge is-ink">Coming soon</span>
          <p className="t-h3" style={{ marginTop: 12 }}>Share a business's loyalty card and earn from every customer you bring.</p>
          <p className="t-body" style={{ marginTop: 8, color: "var(--tm-text2)" }}>Referral opportunities will appear here when loyalty programs launch. Nothing to accept yet.</p>
          <Link href="/share" className="btn" style={{ marginTop: 16 }}>How it will work <ArrowRightIcon size={16} aria-hidden /></Link>
        </section>
      ) : page.length === 0 ? (
        <section className="card" style={{ marginTop: 16, padding: 20, maxWidth: 560 }}>
          <p className="t-h3">No open work right now.</p>
          <p className="t-body" style={{ marginTop: 6, color: "var(--tm-text2)" }}>{kindEntry || tab !== "for_you" ? "Try another ordering or kind." : "New campaigns appear here as businesses publish them."}</p>
          {kindEntry || tab !== "for_you" ? (
            <Link href="/home" className="btn" style={{ marginTop: 16 }}>Show everything</Link>
          ) : !listedVehicle ? (
            <Link href="/me/vehicles/new" className="btn btn-signal" style={{ marginTop: 16 }}>Add your car for car ads</Link>
          ) : null}
        </section>
      ) : (
        <section className="ap-grid" aria-label="Opportunities">
          {page.map((card, i) => <OpportunityCard key={card.id} card={card} vehicles={vehicles} lead={i === 0 && offset === 0} priority={i === 0} />)}
        </section>
      )}

      {(hasMore || offset > 0) && !loyalty && (
        <div className="ap-pager">
          {offset > 0 ? <Link href={href({ offset: Math.max(offset - pageSize, 0) })} className="btn">Newer</Link> : <span />}
          {hasMore && <Link href={href({ offset: offset + pageSize })} className="btn btn-dark">More work <ArrowRightIcon size={16} aria-hidden /></Link>}
        </div>
      )}
    </main>
  );
}
