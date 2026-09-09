import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { Avatar, Chip, SectionTitle } from "@/components/v2/ui";
import { FollowButton, ReportMenu } from "./ProfileSocial";

export const dynamic = "force-dynamic";

/**
 * A public profile: identity, badges, reputation, portfolio, listed cars.
 * No addresses, no verification documents, no earnings — public means public.
 */
export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [ctx, { username }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;

  const person = await sqlOne<{
    id: string; username: string; display_name: string | null; avatar_url: string | null;
    bio: string | null; city: string | null; suspended: boolean;
    verification: string | null; categories: string[] | null; completed_jobs: number | null;
    rating_avg: string | null; rating_count: number | null;
  }>(
    `select p.id, p.username, p.display_name, p.avatar_url, p.bio, p.city, p.suspended,
            cp.verification::text as verification, cp.categories, cp.completed_jobs,
            cp.rating_avg::text as rating_avg, cp.rating_count
       from profiles p left join creator_profiles cp on cp.profile_id = p.id
      where lower(p.username) = lower($1)`,
    [username],
  );
  if (!person || person.suspended) notFound();

  const [counts, portfolio, vehicles, reviews, following] = await Promise.all([
    sqlOne<{ followers: string; following: string }>(
      `select (select count(*) from follows where followed_id = $1)::text as followers,
              (select count(*) from follows where follower_id = $1)::text as following`,
      [person.id],
    ),
    sql<{ media_url: string; caption: string | null }>(
      `select media_url, caption from portfolio_items where profile_id = $1
        order by sort, created_at desc limit 12`,
      [person.id],
    ),
    sql<{ id: string; year: number; make: string; model: string; photo_url: string | null }>(
      `select v.id, v.year, v.make, v.model,
              (select url from vehicle_photos p where p.vehicle_id = v.id limit 1) as photo_url
         from vehicles v where v.owner_id = $1 and v.status = 'listed' limit 6`,
      [person.id],
    ),
    sql<{ rating: number; body: string | null; created_at: string }>(
      `select rating, body, created_at from reviews
        where subject_type = 'profile' and subject_id = $1
        order by created_at desc limit 6`,
      [person.id],
    ),
    sqlOne(
      `select 1 as x from follows where follower_id = $1 and followed_id = $2`,
      [ctx.user.id, person.id],
    ),
  ]);

  const isMe = person.id === ctx.user.id;

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <header className="flex items-start gap-4">
        <Avatar src={person.avatar_url} name={person.display_name ?? person.username} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-900 tracking-[-0.03em]">
            {person.display_name ?? `@${person.username}`}
          </h1>
          <p className="font-mono text-[0.6875rem] text-ink-faint">
            @{person.username}{person.city ? ` · ${person.city}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {person.verification === "verified" && <Chip tone="rise">verified creator</Chip>}
            {(person.categories ?? []).slice(0, 4).map((c) => (
              <Chip key={c} tone="faint">{c.replaceAll("_", " ")}</Chip>
            ))}
          </div>
        </div>
        {!isMe && (
          <div className="flex flex-col items-end gap-2">
            <FollowButton profileId={person.id} initialFollowing={Boolean(following)} />
            <ReportMenu targetType="profile" targetId={person.id} />
          </div>
        )}
      </header>

      {person.bio && <p className="mt-4 text-sm leading-relaxed">{person.bio}</p>}

      <div className="mt-4 flex gap-5 font-mono text-xs">
        <span><strong className="tnum font-display text-base">{person.completed_jobs ?? 0}</strong> jobs</span>
        <span><strong className="tnum font-display text-base">{counts?.followers ?? 0}</strong> followers</span>
        <span><strong className="tnum font-display text-base">{counts?.following ?? 0}</strong> following</span>
        {person.rating_avg && (
          <span><strong className="tnum font-display text-base text-signal">★ {Number(person.rating_avg).toFixed(1)}</strong> ({person.rating_count})</span>
        )}
      </div>

      {portfolio.length > 0 && (
        <section className="mt-6">
          <SectionTitle count={portfolio.length}>Work</SectionTitle>
          <ul className="mt-2 grid grid-cols-3 gap-1.5">
            {portfolio.map((item, i) => (
              <li key={i} className="border border-rule">
                {/\.(mp4|webm|mov)($|\?)/i.test(item.media_url) ? (
                  <video src={item.media_url} controls playsInline className="aspect-square w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.media_url} alt={item.caption ?? "Work sample"} className="aspect-square w-full object-cover" loading="lazy" />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {vehicles.length > 0 && (
        <section className="mt-6">
          <SectionTitle count={vehicles.length}>Cars available for ads</SectionTitle>
          <ul className="mt-2 flex gap-2 overflow-x-auto">
            {vehicles.map((v) => (
              <li key={v.id} className="shrink-0">
                <a href={`/cars/${v.id}`} className="block w-40 border border-rule hover:border-ink">
                  {v.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.photo_url} alt="" className="h-24 w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-24 items-center justify-center font-mono text-[0.625rem] text-ink-faint">no photo</span>
                  )}
                  <span className="block truncate px-2 py-1.5 font-mono text-[0.6875rem] font-600">
                    {v.year} {v.make} {v.model}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="rule mt-6 pt-5">
          <SectionTitle count={reviews.length}>Reviews</SectionTitle>
          <ul className="mt-2 flex flex-col gap-2">
            {reviews.map((r, i) => (
              <li key={i} className="border-b border-rule pb-2 last:border-b-0">
                <p className="text-signal" aria-label={`${r.rating} out of 5`}>
                  {"★".repeat(r.rating)}<span className="text-rule">{"★".repeat(5 - r.rating)}</span>
                </p>
                {r.body && <p className="mt-0.5 text-sm">{r.body}</p>}
                <p className="mt-0.5 font-mono text-[0.625rem] text-ink-faint">
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
