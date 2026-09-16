import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getBusinessOpportunities, getMyVehicles } from "@/lib/v2/opportunities";
import { Avatar, EmptyState, SectionTitle } from "@/components/v2/ui";
import { EarnCard } from "@/components/v2/EarnCards";
import { SaveButton } from "@/components/v2/SaveButton";

export const dynamic = "force-dynamic";

/** A business's public page: who they are and every open campaign, as the same cards Home uses. */
export default async function BusinessPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const [ctx, { slug }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;

  const business = await sqlOne<{
    id: string; name: string; category: string | null; description: string | null;
    city: string | null; website: string | null; logo_url: string | null; cover_url: string | null;
    verification: string;
  }>(
    `select id, name, category, description, city, website, logo_url, cover_url, verification::text as verification
       from businesses where lower(slug) = lower($1)`,
    [slug],
  );
  if (!business) notFound();

  const [campaigns, vehicles, saved, reviewStats] = await Promise.all([
    getBusinessOpportunities(business.id, ctx.user.id),
    getMyVehicles(ctx.user.id),
    sqlOne(
      `select 1 as x from saved_items where profile_id = $1 and item_type = 'business' and item_id = $2`,
      [ctx.user.id, business.id],
    ),
    sqlOne<{ avg: string | null; n: string }>(
      `select round(avg(rating)::numeric, 1)::text as avg, count(*)::text as n
         from reviews where subject_type = 'business' and subject_id = $1`,
      [business.id],
    ),
  ]);

  const meta = [business.category, business.city].filter(Boolean).join("  ·  ");
  const reviewCount = Number(reviewStats?.n ?? 0);
  const verified = business.verification === "verified";
  const verifiedTag = verified && (
    <span className="glass-tag px-2.5 py-1 font-display text-xs font-600 text-signal">Verified business ✓</span>
  );

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      {business.cover_url ? (
        <header className="card relative overflow-hidden">
          <div className="relative aspect-[4/3] w-full bg-surface-2 md:aspect-[16/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={business.cover_url} alt="" className="h-full w-full object-cover" fetchPriority="high" />
            <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
              {verifiedTag}
              {meta && <span className="glass-tag px-2.5 py-1 font-display text-xs font-600 text-ink">{meta}</span>}
            </div>
            <span className="glass-tag absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full">
              <SaveButton itemType="business" itemId={business.id} initialSaved={Boolean(saved)} />
            </span>
            <div className="absolute inset-x-4 bottom-4 flex items-end gap-3">
              <Avatar src={business.logo_url} name={business.name} size={56} />
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-[1.5rem] leading-none font-700 tracking-[-0.02em] text-ink md:text-[1.5rem]">
                  {business.name}
                </h1>
                {reviewCount > 0 && (
                  <p className="mt-1.5 text-sm text-ink">
                    <span className="font-display font-600 text-signal">★ {reviewStats!.avg}</span>
                    <span className="text-ink-soft">{"  ·  "}{reviewStats!.n} review{reviewStats!.n === "1" ? "" : "s"}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className="flex items-start gap-4">
          <Avatar src={business.logo_url} name={business.name} size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">{business.name}</h1>
            {meta && <p className="mt-0.5 text-sm text-ink-faint">{meta}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {verifiedTag}
              {reviewCount > 0 && (
                <p className="text-sm">
                  <span className="font-display font-600 text-signal">★ {reviewStats!.avg}</span>
                  <span className="text-ink-faint">{"  ·  "}{reviewStats!.n} review{reviewStats!.n === "1" ? "" : "s"}</span>
                </p>
              )}
            </div>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2">
            <SaveButton itemType="business" itemId={business.id} initialSaved={Boolean(saved)} />
          </span>
        </header>
      )}

      {(business.description || business.website) && (
        <section className="mt-5">
          {business.description && <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{business.description}</p>}
          {business.website && (
            <p className={business.description ? "mt-2" : ""}>
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="font-display text-sm font-600 text-ink-soft hover:text-ink">
                {business.website.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}
        </section>
      )}

      <section className="mt-8">
        <SectionTitle count={campaigns.length}>Open campaigns</SectionTitle>
        {campaigns.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Nothing open right now" body="Save the business to catch the next one." />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {campaigns.map((card, i) => <EarnCard key={card.id} card={card} vehicles={vehicles} priority={i === 0} />)}
          </div>
        )}
      </section>
    </main>
  );
}
