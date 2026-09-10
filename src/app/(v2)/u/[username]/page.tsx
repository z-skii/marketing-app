import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { Avatar, Chip, SectionTitle, Stat } from "@/components/v2/ui";
import { FollowButton, ReportMenu } from "./ProfileSocial";

export const dynamic = "force-dynamic";

/**
 * A public profile: the work first, then identity, badges and reputation.
 * No addresses, no verification documents, no earnings, and no vehicles:
 * a car is private, only "Drives with TapMart" shows.
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

  const [counts, portfolio, drives, reviews, following] = await Promise.all([
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
    sqlOne(
      `select 1 as x from vehicles v where v.owner_id = $1 and v.status = 'listed' limit 1`,
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
  const name = person.display_name ?? person.username;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <header className="flex items-start gap-4">
        <Avatar src={person.avatar_url} name={name} size={88} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">
            {person.display_name ?? `@${person.username}`}
          </h1>
          <p className="mt-0.5 text-sm text-ink-faint">
            @{person.username}{person.city ? `  ·  ${person.city}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {person.verification === "verified" && <Chip tone="rise">Verified</Chip>}
            {drives && <Chip tone="ink">Drives with TapMart</Chip>}
          </div>
        </div>
      </header>

      {!isMe && (
        <div className="mt-4 flex items-center gap-3">
          <FollowButton profileId={person.id} initialFollowing={Boolean(following)} />
          <ReportMenu targetType="profile" targetId={person.id} />
        </div>
      )}

      <div className="card mt-5 grid grid-cols-3 gap-4 p-4 md:grid-cols-4 md:p-5">
        <Stat value={person.completed_jobs ?? 0} label="Completed" />
        <Stat value={counts?.followers ?? 0} label="Followers" />
        <Stat value={counts?.following ?? 0} label="Following" />
        {person.rating_avg && (
          <Stat
            value={`★ ${Number(person.rating_avg).toFixed(1)}`}
            label="Rating"
            sub={`${person.rating_count ?? 0} review${person.rating_count === 1 ? "" : "s"}`}
          />
        )}
      </div>

      {portfolio.length > 0 && (
        <section className="mt-6">
          <SectionTitle count={portfolio.length}>Work</SectionTitle>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {portfolio.map((item, i) => (
              <li key={i} className="overflow-hidden rounded-[10px] bg-surface-2">
                {/\.(mp4|webm|mov)($|\?)/i.test(item.media_url) ? (
                  <video src={item.media_url} controls playsInline className="aspect-square w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.media_url} alt={item.caption ?? "Work sample"} className="aspect-square w-full object-cover" loading={i < 6 ? "eager" : "lazy"} />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {person.bio && (
        <section className="mt-6">
          <SectionTitle>About</SectionTitle>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{person.bio}</p>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="mt-6">
          <SectionTitle count={reviews.length}>Reviews</SectionTitle>
          <ul className="row-list mt-3">
            {reviews.map((r, i) => (
              <li key={i} className="card p-4">
                <p className="flex items-center justify-between gap-3">
                  <span className="font-display text-base font-600 text-signal" aria-label={`${r.rating} out of 5`}>
                    {"★".repeat(r.rating)}<span className="text-ink-faint">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-sm text-ink-faint">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </p>
                {r.body && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{r.body}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
