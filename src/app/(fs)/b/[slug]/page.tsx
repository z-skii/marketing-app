import Link from "next/link";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getBusinessOpportunities, getMyVehicles } from "@/lib/v2/opportunities";
import { hostOf } from "@/lib/fs/business-identity";
import { Img } from "@/components/fs/Img";
import { EarnObject } from "@/components/fs/EarnObjects";
import { SaveToggle } from "@/components/fs/SaveToggle";
import { Facts, Section } from "@/components/fs/work/DetailParts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await sqlOne<{ name: string }>(`select name from businesses where lower(slug) = lower($1)`, [slug]);
  return { title: b?.name ?? "Business" };
}

/**
 * A business's public page: who they are (real cover, logo, category,
 * city, website, verified only when the record says so), then every open
 * public campaign as the same objects Home uses. Nothing private, nothing
 * that is not on the record.
 */
export default async function BusinessPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const [ctx, { slug }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;
  const business = await sqlOne<{ id: string; name: string; category: string | null; description: string | null; city: string | null; website: string | null; logo_url: string | null; cover_url: string | null; verification: string; created_at: string }>(
    `select id, name, category, description, city, website, logo_url, cover_url, verification::text as verification, created_at from businesses where lower(slug) = lower($1)`,
    [slug],
  );
  if (!business) notFound();
  const [campaigns, vehicles, saved, reviewStats] = await Promise.all([
    getBusinessOpportunities(business.id, ctx.user.id),
    getMyVehicles(ctx.user.id),
    sqlOne(`select 1 as x from saved_items where profile_id = $1 and item_type = 'business' and item_id = $2`, [ctx.user.id, business.id]),
    sqlOne<{ avg: string | null; n: string }>(`select round(avg(rating)::numeric, 1)::text as avg, count(*)::text as n from reviews where subject_type = 'business' and subject_id = $1`, [business.id]),
  ]);
  const meta = [business.category, business.city].filter(Boolean).join(" · ");
  const reviewCount = Number(reviewStats?.n ?? 0);
  const verified = business.verification === "verified";
  const website = hostOf(business.website);
  const websiteHref = business.website ? (business.website.startsWith("http") ? business.website : `https://${business.website}`) : null;
  const mine = ctx.businesses.some((b) => b.id === business.id);

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail" style={{ marginTop: 12 }}>
        <div className="fs-detail-source" style={{ marginTop: 0 }}>
          {business.cover_url && <div className="fs-biz-cover"><Img src={business.cover_url} alt={`${business.name}, cover photo`} loading="eager" /></div>}
          <div className="fs-biz-plate" style={{ marginTop: business.cover_url ? 16 : 0 }}>
            <span className="fs-biz-logo">{business.logo_url ? <Img src={business.logo_url} alt={`${business.name} logo`} loading="eager" /> : <span aria-hidden className="fs-display" style={{ fontWeight: 700, fontSize: 40 }}>{(business.name.trim()[0] ?? "?").toUpperCase()}</span>}</span>
            <span style={{ minWidth: 0, paddingTop: 4 }}>
              <h1 className="fs-t-identity">{business.name}</h1>
              {meta && <p className="fs-t-meta" style={{ marginTop: 4 }}>{meta}</p>}
              <p className="fs-t-meta" style={{ marginTop: 4 }}>
                {verified ? <span className="fs-status is-confirmed">Verified business</span> : <span className="fs-status is-neutral">Not verified</span>}
                {reviewCount > 0 && <> · {reviewStats!.avg} from {reviewCount} review{reviewCount === 1 ? "" : "s"}</>}
              </p>
              {websiteHref && <p className="fs-t-meta" style={{ marginTop: 4 }}><a href={websiteHref} target="_blank" rel="noopener noreferrer" className="fs-link-ink fs-link-ul">{website}</a></p>}
            </span>
          </div>
          {business.description && <p className="fs-t-body" style={{ marginTop: 12, maxWidth: 560 }}>{business.description}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
            {mine ? <Link href="/business/profile" className="fs-btn fs-btn-secondary">This is your business</Link> : <SaveToggle itemType="business" itemId={business.id} initialSaved={Boolean(saved)} />}
          </div>
          <Section title="On the record">
            <Facts rows={[
              ["Category", business.category ?? "Not set"],
              ["City", business.city ?? "Not set"],
              ["Verification", verified ? "Verified by TapMart" : "Not verified"],
              ["Reviews", reviewCount > 0 ? `${reviewStats!.avg} average from ${reviewCount}` : "No reviews yet"],
              ["On TapMart since", new Date(business.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })],
            ]} />
          </Section>
        </div>

        <div className="fs-joint">
          <section aria-labelledby="open-title">
            <h2 id="open-title" className="fs-t-section">Open campaigns <span className="fs-t-meta">· {campaigns.length}</span></h2>
            {campaigns.length === 0 ? (
              <div style={{ marginTop: 12, maxWidth: 480 }}>
                <p className="fs-t-task">Nothing open right now.</p>
                <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>{mine ? "Publish a campaign and it appears here for everyone." : "Save the business to find it again when the next one opens."}</p>
              </div>
            ) : (
              <div className="fs-feed" style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 16 }}>
                {campaigns.map((card, i) => <EarnObject key={card.id} card={card} vehicles={vehicles} priority={i === 0} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
