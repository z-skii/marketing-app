import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CaretDown, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles, getOpportunities, fmtDate, type EarnKind, type FeedTab, type Opportunity, type VehicleSummary } from "@/lib/v2/opportunities";
import { sqlOne } from "@/lib/db";
import { placementLabel } from "@/components/v2/EarnCards";
import { SaveToggle } from "@/components/fs/SaveToggle";
import { PlaneMedia, moneyWhole } from "@/v3/app/parts";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * User Home in the approved V3 language: WHAT CAN I EARN FROM RIGHT NOW.
 * The real open campaigns as physically different objects on one dark
 * stage, each a photographic plane with its terms attached as opaque
 * paper: Recreate an open reference, Story a tall creative, Car a wide
 * photographic field with its monthly band. Same data, filters and paging
 * as before; the resume line and the city prompt stay above the stage.
 * Opening a plane goes to the real opportunity (/o/[id]); Save is the
 * real toggle.
 */
const ORDER: { key: FeedTab; label: string }[] = [
  { key: "for_you", label: "For you" },
  { key: "nearby", label: "Nearby" },
  { key: "top_pay", label: "Top pay" },
];
const KINDS: { key: string; kind: EarnKind; label: string }[] = [
  { key: "recreate", kind: "recreate_reel", label: "Recreate Reels" },
  { key: "stories", kind: "instagram_story", label: "Instagram Stories" },
  { key: "cars", kind: "car_ads", label: "Car ads" },
];
const OBJ: Record<EarnKind, string> = { recreate_reel: "recreate", instagram_story: "story", car_ads: "car" };
const TAG: Record<EarnKind, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ offset?: string; f?: string; k?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  if (ctx.mode === "business") redirect("/business");

  const tab: FeedTab = ORDER.some((o) => o.key === params.f) ? (params.f as FeedTab) : "for_you";
  const kindEntry = KINDS.find((k) => k.key === params.k) ?? null;
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 12;
  const href = (o: { f?: FeedTab; k?: string | null; offset?: number }) => {
    const f = o.f ?? tab; const k = o.k === undefined ? kindEntry?.key ?? null : o.k; const off = o.offset ?? 0;
    const q = [f !== "for_you" ? `f=${f}` : null, k ? `k=${k}` : null, off ? `offset=${off}` : null].filter(Boolean).join("&");
    return `/home${q ? `?${q}` : ""}`;
  };

  const [cards, vehicles, resume] = await Promise.all([
    getOpportunities({ viewerId: ctx.user.id, viewerCity: ctx.city, tab, kind: kindEntry?.kind ?? null, limit: pageSize + 1, offset }),
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
  const firstPage = cards.slice(0, pageSize);
  // the stage holds one object of each kind (the lead of its kind); everything else follows in the same language
  const leads = (["recreate_reel", "instagram_story", "car_ads"] as const).map((k) => firstPage.find((c) => c.kind === k)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const stage = offset === 0 && !kindEntry ? leads : firstPage.slice(0, 3);
  const rest = firstPage.filter((c) => !stage.includes(c));
  const listedVehicle = vehicles.find((v) => v.status === "listed");

  return (
    <main className="fs-phone-main" id="main">
      <div className="v3 xs-wrap">
        <h1 className="fs-t-page" style={{ marginTop: 12 }}>Find paid work</h1>

        {resume && (
          <Link href="/activity" className="fs-row-link" style={{ minHeight: 44, marginTop: 12 }}>
            <span className="fs-t-label"><span className="fs-status is-waiting">{resume.kind === "revision" ? "Revision requested" : "Accepted, ready to film"}</span> · {resume.title}</span>
            <ArrowRight size={20} aria-hidden style={{ color: "var(--fs-accent)", flexShrink: 0 }} />
          </Link>
        )}
        {!ctx.city && (
          <Link href="/me/edit" className="fs-row-link" style={{ minHeight: 44, marginTop: 12 }}>
            <span className="fs-t-label" style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={18} aria-hidden style={{ color: "var(--fs-muted)" }} />Add your city for Nearby</span>
            <ArrowRight size={20} aria-hidden style={{ color: "var(--fs-accent)", flexShrink: 0 }} />
          </Link>
        )}

        <nav className="fs-filters" aria-label="Ordering" style={{ marginTop: 8, marginBottom: 16 }}>
          {ORDER.map((o) => <Link key={o.key} href={o.key === "nearby" && !ctx.city ? "/me/edit" : href({ f: o.key })} aria-current={o.key === tab ? "page" : undefined}>{o.label}</Link>)}
          <details className={kindEntry ? "is-on" : ""}>
            <summary aria-haspopup="menu">{kindEntry ? kindEntry.label : "Kind"} <CaretDown size={14} aria-hidden /></summary>
            <div className="fs-menu" role="menu">
              <Link href={href({ k: null })} aria-current={!kindEntry ? "page" : undefined} role="menuitem">All kinds</Link>
              {KINDS.map((k) => <Link key={k.key} href={href({ k: k.key })} aria-current={kindEntry?.key === k.key ? "page" : undefined} role="menuitem">{k.label}</Link>)}
            </div>
          </details>
        </nav>

        {firstPage.length === 0 ? (
          <div style={{ marginTop: 24, maxWidth: 480 }}>
            <p className="fs-t-task">No open work right now.</p>
            <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>{kindEntry || tab !== "for_you" ? "Try another ordering or kind." : "New campaigns appear here as businesses publish them."}</p>
            {kindEntry || tab !== "for_you" ? (
              <Link href="/home" className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>Show everything</Link>
            ) : !listedVehicle ? (
              <Link href="/me/vehicles/new" className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>Add your car for car ads</Link>
            ) : null}
          </div>
        ) : (
          <section className="xs-stage xs-home" aria-label="Opportunities">
            {stage.map((card, i) => <OpportunityObject key={card.id} card={card} vehicles={vehicles} priority={i === 0} />)}
            {rest.length > 0 && <div className="xs-home-more">{rest.map((card) => <OpportunityObject key={card.id} card={card} vehicles={vehicles} compact />)}</div>}
          </section>
        )}

        {(hasMore || offset > 0) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 24, maxWidth: 480 }}>
            {offset > 0 ? <Link href={href({ offset: Math.max(offset - pageSize, 0) })} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>Newer</Link> : <span />}
            {hasMore && <Link href={href({ offset: offset + pageSize })} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>More work</Link>}
          </div>
        )}
      </div>
    </main>
  );
}

/** The media a campaign really has: the reference (or its URL) for Recreate, the supplied creative for Story, the campaign visual for Car. */
function media(card: Opportunity): { src: string | null; poster: string | null; alt: string; sizes: string; fallback: string } {
  if (card.kind === "recreate_reel") return { src: card.details.reference_media_url ?? card.reference_url ?? null, poster: card.business_cover, alt: `Reference for ${card.title}`, sizes: "(min-width: 1024px) 360px, 100vw", fallback: "Reference link only" };
  if (card.kind === "instagram_story") return { src: card.details.creative_url ?? null, poster: null, alt: `The supplied Story creative for ${card.business_name}`, sizes: "214px", fallback: "No creative yet" };
  return { src: card.details.media_url ?? card.details.artwork_url ?? card.business_cover ?? null, poster: null, alt: `Campaign visual for ${card.title}`, sizes: "(min-width: 1024px) 376px, 100vw", fallback: "No campaign visual" };
}

/** One opportunity as an object: the plane opens the real opportunity; the sheet holds the business, the money and its basis, the title, View and Save. */
function OpportunityObject({ card, vehicles, priority = false, compact = false }: { card: Opportunity; vehicles: VehicleSummary[]; priority?: boolean; compact?: boolean }) {
  const m = media(card);
  const placements = (card.details.placements ?? []).map(placementLabel);
  const basis = card.kind === "car_ads" ? "/month" : card.kind === "instagram_story" ? `after ${card.details.live_hours ?? 24}h live and approval` : "On approval";
  const listed = vehicles.some((v) => v.status === "listed");
  const deadline = card.deadline ? `Apply by ${fmtDate(card.deadline)}` : null;
  const spots = card.slots > 0 ? `${Math.max(card.slots - card.approved_count, 0)} of ${card.slots} spots` : null;
  return (
    <article className={`xs-obj xs-op xs-op-${OBJ[card.kind]}${compact ? " xs-op-compact" : ""}`} aria-labelledby={`op-${card.id}-t`}>
      <Link href={`/o/${card.id}`} className="xs-plane" aria-label={`View ${card.title}, ${card.business_name}`}>
        <PlaneMedia src={m.src} poster={m.poster} alt="" sizes={m.sizes} priority={priority} fallback={m.fallback} tag={TAG[card.kind]} tagBr={card.kind === "car_ads" && placements.length > 0 ? placements[0] : undefined} />
      </Link>
      <div className="x-paper xs-sheet">
        <span className="t-fact">{card.business_name}{card.city ? <><span aria-hidden> · </span>{card.city}</> : null}</span>
        <span className="xs-money"><span className="x-money-hero">{moneyWhole(card.pay_cents)}</span><span className="t-fact-ink">{basis}</span></span>
        {card.kind === "car_ads" && <span className="t-fact-ink">{listed ? "Monthly approval" : "Vehicle required"}{placements.length > 1 ? <><span aria-hidden> · </span>{placements.length} placements</> : null}</span>}
        {(deadline || spots) && <span className="t-fact">{[spots, deadline].filter(Boolean).join(" · ")}</span>}
        <span className="xs-sheet-row">
          <h2 id={`op-${card.id}-t`} className="t-object">{card.title}</h2>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SaveToggle itemType="campaign" itemId={card.id} initialSaved={card.saved} />
            <Link href={`/o/${card.id}`} className="link t-action">View</Link>
          </span>
        </span>
      </div>
    </article>
  );
}
