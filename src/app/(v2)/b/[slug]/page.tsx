import Link from "next/link";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { Avatar, Chip, Money, SectionTitle } from "@/components/v2/ui";
import { SaveButton } from "@/components/v2/SaveButton";

export const dynamic = "force-dynamic";

/** A business's public page: who they are and their open opportunities. */
export default async function BusinessPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const [ctx, { slug }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;

  const business = await sqlOne<{
    id: string; name: string; category: string | null; description: string | null;
    city: string | null; website: string | null; logo_url: string | null; cover_url: string | null;
    socials: Record<string, string>;
  }>(
    `select id, name, category, description, city, website, logo_url, cover_url, socials
       from businesses where lower(slug) = lower($1)`,
    [slug],
  );
  if (!business) notFound();

  const [campaigns, saved, reviewStats] = await Promise.all([
    sql<{ id: string; title: string; kind: string; pay_cents: number; slots: number; approved: number }>(
      `select c.id, c.title, c.kind::text as kind, c.pay_cents::int as pay_cents, c.slots,
              (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved
         from campaigns c where c.business_id = $1 and c.status = 'open'
        order by c.published_at desc limit 20`,
      [business.id],
    ),
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

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      {business.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={business.cover_url} alt="" className="h-36 w-full border border-ink object-cover" />
      )}
      <header className={`flex items-start gap-4 ${business.cover_url ? "mt-3" : ""}`}>
        <Avatar src={business.logo_url} name={business.name} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-900 tracking-[-0.03em]">{business.name}</h1>
          <p className="font-mono text-[0.6875rem] text-ink-faint">
            {[business.category, business.city].filter(Boolean).join(" · ")}
          </p>
          {Number(reviewStats?.n ?? 0) > 0 && (
            <p className="mt-1 font-mono text-xs">
              <span className="text-signal">★ {reviewStats!.avg}</span>
              <span className="text-ink-faint"> · {reviewStats!.n} review{reviewStats!.n === "1" ? "" : "s"}</span>
            </p>
          )}
        </div>
        <SaveButton itemType="business" itemId={business.id} initialSaved={Boolean(saved)} />
      </header>

      {business.description && <p className="mt-4 text-sm leading-relaxed">{business.description}</p>}
      {business.website && (
        <p className="mt-2">
          <a href={business.website} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-signal underline underline-offset-2">
            {business.website.replace(/^https?:\/\//, "")} ↗
          </a>
        </p>
      )}

      <section className="rule mt-6 pt-5">
        <SectionTitle count={campaigns.length}>Open opportunities</SectionTitle>
        {campaigns.length === 0 && (
          <p className="mt-2 font-mono text-xs text-ink-faint">Nothing open right now — save the business to catch the next one.</p>
        )}
        <ul className="mt-2 flex flex-col gap-2">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link href={`/jobs/${c.id}`} className="flex items-center gap-3 border border-rule p-3 hover:border-ink">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-800">{c.title}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <Chip tone="faint">{c.kind.replaceAll("_", " ")}</Chip>
                    <span className="font-mono text-[0.625rem] text-ink-faint">
                      {Math.max(c.slots - c.approved, 0)} spot{c.slots - c.approved === 1 ? "" : "s"} left
                    </span>
                  </span>
                </span>
                <Money cents={c.pay_cents} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
