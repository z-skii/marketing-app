import Link from "next/link";
import { ArrowRight, Gear, PencilSimple, Megaphone, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getBusinessOpportunities, getMyVehicles } from "@/lib/v2/opportunities";
import { brandState, fmtDate, hostOf, loadBusinessIdentity, STATE_WORD } from "@/lib/fs/business-identity";
import { OpportunityCard } from "@/components/app/OpportunityCard";
import { SettingsGroup, SettingsRow } from "@/components/fs/settings/Rows";
import { DSection } from "@/components/fs/work/DetailKit";
import { StatsRow } from "@/components/fs/profile/Parts";
import { CopyLink } from "@/components/fs/profile/CopyLink";
import { BusinessHero, Gallery, AboutRows, type GalleryItem } from "@/components/fs/profile/BusinessParts";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

/**
 * The business's own page: the brand as the public sees it (cover, logo,
 * name, type, city, verified, description), the numbers, the open
 * campaigns as cards, the content gallery from real media, then the
 * management rows (plan, next shoot, campaigns, scheduled content,
 * connections, brand kit) and the about rows. Editing lives behind Edit
 * and the gear. Every figure is a count of real records.
 */
export default async function BusinessProfilePage() {
  const ctx = await requireBusinessContext("/business/profile");
  const identity = await loadBusinessIdentity(ctx.activeBusiness.id);
  if (!identity) return null;
  const { row, providers, counts, subscription, plan, shoot, brand } = identity;
  const [campaigns, vehicles, stats, media, deliverables, reviewStats] = await Promise.all([
    getBusinessOpportunities(row.id, ctx.user.id),
    getMyVehicles(ctx.user.id),
    sqlOne<{ campaigns: string; creators: string }>(
      `select (select count(*) from campaigns c where c.business_id = $1 and c.status in ('open', 'completed', 'closed') and c.kind in ('recreate_reel', 'instagram_story', 'car_ads'))::text as campaigns,
              (select count(distinct s.creator_id) from submissions s join campaigns c on c.id = s.campaign_id where c.business_id = $1 and s.status in ('approved', 'paid'))::text as creators`,
      [row.id],
    ),
    sql<{ url: string; title: string; kind: string }>(
      `select coalesce(c.details->>'reference_media_url', c.details->>'creative_url', c.details->>'media_url', c.details->>'artwork_url') as url, c.title, c.kind::text as kind
         from campaigns c where c.business_id = $1 and c.status <> 'draft'
          and coalesce(c.details->>'reference_media_url', c.details->>'creative_url', c.details->>'media_url', c.details->>'artwork_url') is not null
        order by c.published_at desc nulls last limit 8`,
      [row.id],
    ),
    sql<{ url: string; caption: string | null }>(`select coalesce(thumbnail_url, url) as url, caption from content_deliverables where business_id = $1 and status in ('approved', 'scheduled', 'published') order by created_at desc limit 8`, [row.id]).catch(() => []),
    sqlOne<{ avg: string | null; n: string }>(`select round(avg(rating)::numeric, 1)::text as avg, count(*)::text as n from reviews where subject_type = 'business' and subject_id = $1`, [row.id]),
  ]);
  const ig = providers.find((p) => p.provider === "instagram")!;
  const google = providers.find((p) => p.provider === "google_business")!;
  const website = hostOf(row.website);
  const websiteHref = row.website ? (row.website.startsWith("http") ? row.website : `https://${row.website}`) : null;
  const kit = brandState(brand);
  const shootWhen = shoot?.scheduled_for ? fmtDate(shoot.scheduled_for) : null;
  const attention = providers.filter((p) => p.state === "error" || p.state === "needs_reconnect");
  const planSub = !subscription || !plan ? "No plan" : subscription.status === "active" ? (subscription.current_period_end ? `Renews ${fmtDate(subscription.current_period_end)}` : "Active") : subscription.status === "trialing" ? "Trial" : "Past due";
  const reviewCount = Number(reviewStats?.n ?? 0);
  const accent = brand?.kit.palette?.[0] ?? null;
  const gallery: GalleryItem[] = [
    ...deliverables.map((d) => ({ url: d.url, title: d.caption ?? "Shoot content" })),
    ...media.map((m) => ({ url: m.url, title: m.title, tall: m.kind !== "car_ads" })),
    ...(brand?.kit.image_examples ?? []).slice(0, 4).map((u) => ({ url: u, title: `${row.name} brand` })),
  ].filter((g, i, all) => all.findIndex((x) => x.url === g.url) === i).slice(0, 8);
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tapmart.live").replace(/\/$/, "");
  const joined = await sqlOne<{ created_at: string }>(`select created_at from businesses where id = $1`, [row.id]);

  return (
    <main className="fs-phone-main" id="main">
      <div className="pf-biz-page">
        <div style={{ minWidth: 0 }}>
          <BusinessHero cover={row.cover_url} logo={row.logo_url} name={row.name} slug={row.slug} category={row.category} city={row.city} verified={row.verification === "verified"} description={row.description} accent={accent}
            actions={<>
              <Link href="/business/edit" className="btn btn-sm"><PencilSimple size={16} aria-hidden /> Edit</Link>
              <CopyLink url={`${host}/b/${row.slug}`} label="Share" className="btn btn-sm"><ShareNetwork size={16} aria-hidden /> Share</CopyLink>
              <Link href="/business/settings" className="iconbtn is-sm" aria-label="Settings" data-tip="Settings"><Gear size={20} aria-hidden /></Link>
              {(!row.logo_url || !row.cover_url) && <Link href="/business/edit" className="btn btn-ghost btn-sm">{!row.logo_url ? "Add a logo" : "Add a cover"}</Link>}
            </>} />
          <div className="pf-biz-text">
            <StatsRow items={[
              { v: stats?.campaigns ?? "0", l: Number(stats?.campaigns ?? 0) === 1 ? "Campaign" : "Campaigns" },
              { v: stats?.creators ?? "0", l: Number(stats?.creators ?? 0) === 1 ? "Creator" : "Creators" },
              ...(reviewCount > 0 && reviewStats?.avg ? [{ v: reviewStats.avg, l: "Rating", star: true }] : [{ v: String(counts.delivered), l: "Delivered" }]),
            ]} />
          </div>

          <DSection title="Open now" id="open" meta={campaigns.length > 0 ? `${campaigns.length}` : undefined}>
            {campaigns.length === 0 ? (
              <div className="pf-empty"><Megaphone size={28} aria-hidden /><b>Nothing open right now</b><span>Publish a campaign and it appears here for everyone.</span><Link href="/business/create" className="btn btn-sm" style={{ marginTop: 4 }}>New campaign <ArrowRight size={16} aria-hidden /></Link></div>
            ) : (
              <div className="pf-opps">
                {campaigns.map((card, i) => <OpportunityCard key={card.id} card={card} vehicles={vehicles} priority={i === 0} />)}
              </div>
            )}
          </DSection>

          {gallery.length > 0 && (
            <DSection title="Content" id="content" meta={<Link href="/business/content" className="link-accent">Open Content</Link>}><Gallery items={gallery} owner={row.name} /></DSection>
          )}
          {gallery.length === 0 && (
            <DSection title="Content" id="content">
              <div className="pf-empty"><b>No content yet</b><span>Campaign creatives and shoot files show here.</span><Link href="/business/content" className="btn btn-sm" style={{ marginTop: 4 }}>Content <ArrowRight size={16} aria-hidden /></Link></div>
            </DSection>
          )}
        </div>

        <aside className="pf-biz-side">
          <DSection title="Manage" id="manage">
            <SettingsGroup title="Right now" id="now-title">
              <SettingsRow href="/business/plan" title={plan ? `${plan.name} plan` : "No plan"} value={planSub} status={subscription ? (subscription.status === "active" ? "Active" : subscription.status === "trialing" ? "Trial" : "Past due") : undefined} tone={subscription?.status === "past_due" ? "problem" : "confirmed"} />
              <SettingsRow href={shoot ? `/business/content/shoots/${shoot.id}` : "/business/content"} title="Next shoot" value={shootWhen ?? (plan ? "None booked" : "Needs a plan")} />
              <SettingsRow href="/business/campaigns" title="Campaigns" value={counts.active > 0 ? `${counts.active} running` : "None running"} status={counts.review > 0 ? `${counts.review} to review` : undefined} tone="waiting" />
              <SettingsRow href="/business/content?view=calendar" title="Scheduled" value={counts.scheduled > 0 ? `${counts.scheduled} post${counts.scheduled === 1 ? "" : "s"}` : "Nothing"} />
              <SettingsRow href="/business/settings/connections" title="Connections" value={attention.length > 0 ? undefined : `${STATE_WORD[ig.state].label} · ${STATE_WORD[google.state].label}`} status={attention.length > 0 ? "Needs attention" : undefined} tone="problem" />
              <SettingsRow href="/business/brand" title="Brand kit" status={kit.label} tone={kit.tone} end={brand?.kit.palette?.length ? <span aria-hidden style={{ display: "inline-flex", gap: 4 }}>{brand.kit.palette.slice(0, 4).map((c) => <i key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c, boxShadow: "inset 0 0 0 1px rgba(18,20,23,0.12)" }} />)}</span> : undefined} />
              <SettingsRow href={`/b/${row.slug}`} external title="Public page" />
            </SettingsGroup>
          </DSection>
          <DSection title="About" id="about">
            <AboutRows city={row.city} website={website} websiteHref={websiteHref} instagram={ig.state === "connected" ? ig.name : null} joined={joined ? new Date(joined.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "On TapMart"} category={row.category} />
          </DSection>
        </aside>
      </div>
    </main>
  );
}
