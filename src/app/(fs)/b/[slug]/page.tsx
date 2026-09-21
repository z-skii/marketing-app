import Link from "next/link";
import { notFound } from "next/navigation";
import { Megaphone } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getBusinessOpportunities, getMyVehicles } from "@/lib/v2/opportunities";
import { hostOf } from "@/lib/fs/business-identity";
import { OpportunityCard } from "@/components/app/OpportunityCard";
import { SaveToggle } from "@/components/fs/SaveToggle";
import { DSection } from "@/components/fs/work/DetailKit";
import { StatsRow } from "@/components/fs/profile/Parts";
import { BusinessHero, Gallery, AboutRows, type GalleryItem } from "@/components/fs/profile/BusinessParts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await sqlOne<{ name: string }>(`select name from businesses where lower(slug) = lower($1)`, [slug]);
  return { title: b?.name ?? "Business" };
}

/**
 * A business's public page: the brand first (cover, logo, name, type,
 * city, verified only when the record says so, a short description), the
 * numbers the record holds, every open public campaign as the same card
 * Home uses, the business's real creatives as a gallery, and the compact
 * about rows lower down. Nothing private, nothing not on the record.
 */
export default async function BusinessPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const [ctx, { slug }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;
  const business = await sqlOne<{ id: string; name: string; slug: string; category: string | null; description: string | null; city: string | null; website: string | null; logo_url: string | null; cover_url: string | null; verification: string; created_at: string }>(
    `select id, name, slug, category, description, city, website, logo_url, cover_url, verification::text as verification, created_at from businesses where lower(slug) = lower($1)`,
    [slug],
  );
  if (!business) notFound();
  const [campaigns, vehicles, saved, reviewStats, counts, media, instagram, brand] = await Promise.all([
    getBusinessOpportunities(business.id, ctx.user.id),
    getMyVehicles(ctx.user.id),
    sqlOne(`select 1 as x from saved_items where profile_id = $1 and item_type = 'business' and item_id = $2`, [ctx.user.id, business.id]),
    sqlOne<{ avg: string | null; n: string }>(`select round(avg(rating)::numeric, 1)::text as avg, count(*)::text as n from reviews where subject_type = 'business' and subject_id = $1`, [business.id]),
    sqlOne<{ campaigns: string; creators: string }>(
      `select (select count(*) from campaigns c where c.business_id = $1 and c.status in ('open', 'completed', 'closed') and c.kind in ('recreate_reel', 'instagram_story', 'car_ads'))::text as campaigns,
              (select count(distinct s.creator_id) from submissions s join campaigns c on c.id = s.campaign_id where c.business_id = $1 and s.status in ('approved', 'paid'))::text as creators`,
      [business.id],
    ),
    sql<{ url: string; title: string; kind: string }>(
      `select coalesce(c.details->>'reference_media_url', c.details->>'creative_url', c.details->>'media_url', c.details->>'artwork_url') as url, c.title, c.kind::text as kind
         from campaigns c where c.business_id = $1 and c.audience = 'public' and c.status <> 'draft'
          and coalesce(c.details->>'reference_media_url', c.details->>'creative_url', c.details->>'media_url', c.details->>'artwork_url') is not null
        order by c.published_at desc nulls last limit 8`,
      [business.id],
    ),
    sqlOne<{ external_name: string | null }>(`select external_name from connected_accounts where business_id = $1 and provider = 'instagram' and status = 'connected'`, [business.id]),
    sqlOne<{ kit: { palette?: string[]; image_examples?: string[] } | null }>(`select kit from brand_kits where business_id = $1 and status = 'approved'`, [business.id]).catch(() => null),
  ]);
  const reviewCount = Number(reviewStats?.n ?? 0);
  const verified = business.verification === "verified";
  const website = hostOf(business.website);
  const websiteHref = business.website ? (business.website.startsWith("http") ? business.website : `https://${business.website}`) : null;
  const mine = ctx.businesses.some((b) => b.id === business.id);
  const accent = brand?.kit?.palette?.[0] ?? null;
  const gallery: GalleryItem[] = [
    ...media.map((m) => ({ url: m.url, title: m.title, tall: m.kind !== "car_ads" })),
    ...(brand?.kit?.image_examples ?? []).slice(0, 4).map((u) => ({ url: u, title: `${business.name} brand` })),
  ].filter((g, i, all) => all.findIndex((x) => x.url === g.url) === i).slice(0, 8);
  const joined = new Date(business.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <main className="fs-phone-main" id="main">
      <div className="pf-biz-page">
        <div style={{ minWidth: 0 }}>
          <BusinessHero cover={business.cover_url} logo={business.logo_url} name={business.name} slug={business.slug} category={business.category} city={business.city} verified={verified} description={business.description} accent={accent}
            actions={mine ? <Link href="/business/profile" className="btn btn-sm">This is your business</Link> : <SaveToggle itemType="business" itemId={business.id} initialSaved={Boolean(saved)} />} />
          <div className="pf-biz-text">
            <StatsRow items={[
              { v: counts?.campaigns ?? "0", l: Number(counts?.campaigns ?? 0) === 1 ? "Campaign" : "Campaigns" },
              { v: counts?.creators ?? "0", l: Number(counts?.creators ?? 0) === 1 ? "Creator" : "Creators" },
              ...(reviewCount > 0 && reviewStats?.avg ? [{ v: reviewStats.avg, l: "Rating", star: true }] : []),
            ]} />
          </div>

          <DSection title="Open now" id="open" meta={campaigns.length > 0 ? `${campaigns.length}` : undefined}>
            {campaigns.length === 0 ? (
              <div className="pf-empty"><Megaphone size={28} aria-hidden /><b>Nothing open right now</b><span>{mine ? "Publish a campaign and it appears here." : "Save the business to find it again."}</span></div>
            ) : (
              <div className="pf-opps">
                {campaigns.map((card, i) => <OpportunityCard key={card.id} card={card} vehicles={vehicles} priority={i === 0} />)}
              </div>
            )}
          </DSection>

          {gallery.length > 0 && (
            <DSection title="Content" id="content"><Gallery items={gallery} owner={business.name} /></DSection>
          )}
        </div>

        <aside className="pf-biz-side">
          <DSection title="About" id="about">
            <AboutRows city={business.city} website={website} websiteHref={websiteHref} instagram={instagram?.external_name ?? null} joined={joined} category={business.category} />
          </DSection>
        </aside>
      </div>
    </main>
  );
}
