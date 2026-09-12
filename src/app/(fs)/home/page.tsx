import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CaretDown, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles, getOpportunities, type EarnKind, type FeedTab } from "@/lib/v2/opportunities";
import { sqlOne } from "@/lib/db";
import { EarnObject } from "@/components/fs/EarnObjects";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * User Home in Frame Shift: find paid work. One line to resume work that
 * needs you, the discovery controls, then the real open campaigns as three
 * distinct earning objects. Same data, same filters and paging as before;
 * the composition is the approved Lab's.
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
  const leads = (["recreate_reel", "instagram_story", "car_ads"] as const).map((k) => firstPage.find((c) => c.kind === k)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const page = offset === 0 && !kindEntry ? [...leads, ...firstPage.filter((c) => !leads.includes(c))] : firstPage;
  const listedVehicle = vehicles.find((v) => v.status === "listed");

  return (
    <main className="fs-phone-main" id="main">
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

      <nav className="fs-filters" aria-label="Ordering" style={{ marginTop: 8 }}>
        {ORDER.map((o) => <Link key={o.key} href={o.key === "nearby" && !ctx.city ? "/me/edit" : href({ f: o.key })} aria-current={o.key === tab ? "page" : undefined}>{o.label}</Link>)}
        <details className={kindEntry ? "is-on" : ""}>
          <summary aria-haspopup="menu">{kindEntry ? kindEntry.label : "Kind"} <CaretDown size={14} aria-hidden /></summary>
          <div className="fs-menu" role="menu">
            <Link href={href({ k: null })} aria-current={!kindEntry ? "page" : undefined} role="menuitem">All kinds</Link>
            {KINDS.map((k) => <Link key={k.key} href={href({ k: k.key })} aria-current={kindEntry?.key === k.key ? "page" : undefined} role="menuitem">{k.label}</Link>)}
          </div>
        </details>
      </nav>

      {page.length === 0 ? (
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
        <div className="fs-feed" style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16 }}>
          {page.map((card, i) => <EarnObject key={card.id} card={card} vehicles={vehicles} priority={i < 2} />)}
        </div>
      )}

      {(hasMore || offset > 0) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 24, maxWidth: 480 }}>
          {offset > 0 ? <Link href={href({ offset: Math.max(offset - pageSize, 0) })} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>Newer</Link> : <span />}
          {hasMore && <Link href={href({ offset: offset + pageSize })} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>More work</Link>}
        </div>
      )}
    </main>
  );
}
