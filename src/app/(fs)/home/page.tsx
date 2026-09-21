import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles, getOpportunities, type EarnKind, type FeedTab } from "@/lib/v2/opportunities";
import { sqlOne } from "@/lib/db";
import { OpportunityCard } from "@/components/app/OpportunityCard";
import { formatMoney } from "@/components/fs/parts";
import { PinIcon, ArrowRightIcon, PlayIcon, InstagramIcon, CarIcon, SparkleIcon, GridIcon as SquaresFourIcon, WarningIcon, WalletIcon } from "@/ds/icons";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * Home: WHAT CAN I EARN FROM RIGHT NOW. A photographic marketplace of the
 * real open campaigns near the person: one filter row for the kind
 * (All, Recreate, Story, Cars, Share), one for the ordering (For you,
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
  { key: "cars", kind: "car_ads", label: "Cars", icon: CarIcon },
  { key: "share", kind: null, label: "Share", icon: SparkleIcon },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ offset?: string; f?: string; k?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  if (ctx.mode === "business") redirect("/business");

  const tab: FeedTab = ORDER.some((o) => o.key === params.f) ? (params.f as FeedTab) : "for_you";
  const kindKey = params.k === "loyalty" ? "share" : params.k;
  const kindEntry = KINDS.find((k) => k.key === kindKey && k.key !== "all") ?? null;
  const loyalty = kindEntry?.key === "share";
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 12;
  const href = (o: { f?: FeedTab; k?: string | null; offset?: number }) => {
    const f = o.f ?? tab; const k = o.k === undefined ? kindEntry?.key ?? null : o.k; const off = o.offset ?? 0;
    const q = [f !== "for_you" ? `f=${f}` : null, k ? `k=${k}` : null, off ? `offset=${off}` : null].filter(Boolean).join("&");
    return `/home${q ? `?${q}` : ""}`;
  };

  const [cards, vehicles, resume, sums] = await Promise.all([
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
    sqlOne<{ available: string }>(`select coalesce(sum(amount_cents) filter (where status = 'available'), 0)::text as available from earnings where profile_id = $1`, [ctx.user.id]),
  ]);
  const available = Number(sums?.available ?? 0);
  const firstName = (ctx.user.displayName ?? ctx.user.username).trim().split(/\s+/)[0];
  const hasMore = cards.length > pageSize;
  const page = cards.slice(0, pageSize);
  const listedVehicle = vehicles.find((v) => v.status === "listed");

  return (
    <main className="fs-phone-main" id="main">
      <div className="ap-head">
        <div>
          <h1>Hi, {firstName}</h1>
          <p className="ap-sub">{ctx.city ? <><PinIcon size={16} aria-hidden style={{ verticalAlign: "-3px", marginRight: 4 }} />{ctx.city}</> : "Paid work from local businesses"}</p>
        </div>
        <Link href="/earnings" className="btn btn-sm shrink-0" aria-label={`${formatMoney(available)} available. Open Earnings`}><WalletIcon size={16} aria-hidden />{formatMoney(available)}</Link>
      </div>

      {resume && (
        <Link href="/activity" className="ap-note" style={{ marginTop: 14 }}>
          <WarningIcon size={20} aria-hidden style={{ color: "var(--tm-warning)" }} />
          <span className="ap-note-text"><b style={{ fontWeight: 600 }}>{resume.kind === "revision" ? "Revision requested" : "Accepted, ready to film"}</b> · {resume.title}</span>
          <ArrowRightIcon size={20} aria-hidden style={{ color: "var(--tm-red)" }} />
        </Link>
      )}
      {!ctx.city && (
        <Link href="/me/edit" className="ap-note is-warm" style={{ marginTop: 10 }}>
          <PinIcon size={20} aria-hidden style={{ color: "var(--tm-muted)" }} />
          <span className="ap-note-text">Add your city for nearby work</span>
          <ArrowRightIcon size={20} aria-hidden style={{ color: "var(--tm-red)" }} />
        </Link>
      )}

      <nav className="ap-chips" aria-label="Kind">
        {KINDS.map((k) => {
          const on = k.key === "all" ? !kindEntry : kindEntry?.key === k.key;
          return <Link key={k.key} href={href({ k: k.key === "all" ? null : k.key })} className="pill" aria-current={on ? "page" : undefined}><k.icon size={16} aria-hidden />{k.label}</Link>;
        })}
      </nav>
      <nav className="ap-chips is-quiet" aria-label="Ordering" style={{ marginTop: 4 }}>
        {ORDER.map((o) => <Link key={o.key} href={o.key === "nearby" && !ctx.city ? "/me/edit" : href({ f: o.key })} className="pill" aria-current={o.key === tab ? "page" : undefined}>{o.label}</Link>)}
      </nav>

      {loyalty ? (
        <section className="card" style={{ marginTop: 16, padding: 20, maxWidth: 560 }} aria-label="Share">
          <span className="badge is-ink">Coming soon</span>
          <p className="t-h3" style={{ marginTop: 12 }}>Share a loyalty card, earn per customer.</p>
          <Link href="/share" className="btn" style={{ marginTop: 16 }}>How it works <ArrowRightIcon size={16} aria-hidden /></Link>
        </section>
      ) : page.length === 0 ? (
        <section className="card" style={{ marginTop: 16, padding: 20, maxWidth: 560 }}>
          <p className="t-h3">No open work yet.</p>
          <p className="t-body" style={{ marginTop: 6, color: "var(--tm-text2)" }}>{kindEntry || tab !== "for_you" ? "Try another filter." : "New campaigns land here."}</p>
          {kindEntry || tab !== "for_you" ? (
            <Link href="/home" className="btn" style={{ marginTop: 16 }}>Show all</Link>
          ) : !listedVehicle ? (
            <Link href="/me/vehicles/new" className="btn btn-signal" style={{ marginTop: 16 }}>Add your car</Link>
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
          {hasMore && <Link href={href({ offset: offset + pageSize })} className="btn btn-dark">More <ArrowRightIcon size={16} aria-hidden /></Link>}
        </div>
      )}
    </main>
  );
}
