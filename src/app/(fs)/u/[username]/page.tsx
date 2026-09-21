import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, InstagramLogo, Car, Images, PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { compactCount } from "@/lib/v2/marketplace";
import { formatMoney } from "@/components/fs/parts";
import { ProfileHead, StatsRow, Chips, WorkGrid, RecentWork, Reputation, Reviews, skillChips, type RecentRow, type WorkTile } from "@/components/fs/profile/Parts";
import { DSection } from "@/components/fs/work/DetailKit";
import { FollowButton, ReportMenu } from "@/components/fs/inbox/ProfileSocial";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username}` };
}

/**
 * A creator's public profile: who they are in seconds (avatar, name,
 * handle, city, verification, a short bio), the stats the record holds,
 * what they do as chips, the work grid, recent approved work as rows and
 * reviews. No addresses, no documents, no earnings. Vehicles stay
 * private; only "Drives with TapMart" shows when a car is listed.
 */
const KIND_NAME: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [ctx, { username }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;
  const person = await sqlOne<{
    id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null; city: string | null; suspended: boolean;
    verification: string | null; completed_jobs: number | null; rating_avg: string | null; rating_count: number | null;
    ig_status: string | null; ig_handle: string | null; ig_followers: number | null;
  }>(
    `select p.id, p.username, p.display_name, p.avatar_url, p.bio, p.city, p.suspended,
            cp.verification::text as verification, cp.completed_jobs, cp.rating_avg::text as rating_avg, cp.rating_count,
            sa.status::text as ig_status, sa.handle as ig_handle, sa.follower_count as ig_followers
       from profiles p
       left join creator_profiles cp on cp.profile_id = p.id
       left join social_accounts sa on sa.profile_id = p.id and sa.provider = 'instagram'
      where lower(p.username) = lower($1)`,
    [username],
  );
  if (!person || person.suspended) notFound();

  const [counts, work, portfolio, drives, reviews, following] = await Promise.all([
    sqlOne<{ followers: string }>(`select (select count(*) from follows where followed_id = $1)::text as followers`, [person.id]),
    sql<{ id: string; url: string | null; title: string; kind: string; business: string; logo: string | null; pay_cents: number; campaign_id: string }>(
      `select s.id, s.media_urls[1] as url, c.title, c.kind::text as kind, b.name as business, b.logo_url as logo, c.pay_cents::int as pay_cents, c.id as campaign_id
         from submissions s join campaigns c on c.id = s.campaign_id join businesses b on b.id = c.business_id
        where s.creator_id = $1 and s.status in ('approved', 'paid') order by s.created_at desc limit 8`,
      [person.id],
    ),
    sql<{ media_url: string; caption: string | null }>(`select media_url, caption from portfolio_items where profile_id = $1 order by sort, created_at desc limit 12`, [person.id]),
    sqlOne(`select 1 as x from vehicles v where v.owner_id = $1 and v.status = 'listed' limit 1`, [person.id]),
    sql<{ rating: number; body: string | null; created_at: string; business_name: string | null }>(
      `select r.rating, r.body, r.created_at, (select b.name from businesses b where b.owner_id = r.reviewer_id order by b.created_at limit 1) as business_name
         from reviews r where r.subject_type = 'profile' and r.subject_id = $1 order by r.created_at desc limit 6`,
      [person.id],
    ),
    sqlOne(`select 1 as x from follows where follower_id = $1 and followed_id = $2`, [ctx.user.id, person.id]),
  ]);

  const isMe = person.id === ctx.user.id;
  const name = person.display_name ?? person.username;
  const verified = person.verification === "verified";
  const ratingCount = person.rating_count ?? 0;
  const rating = person.rating_avg ? Number(person.rating_avg) : null;
  const completed = person.completed_jobs ?? 0;
  const igConnected = person.ig_status === "connected";
  const businessViewer = ctx.mode === "business" && ctx.activeBusiness;
  const tiles: WorkTile[] = [...work.filter((w) => w.url).map((w) => ({ url: w.url as string, title: w.title, kind: "approved" as const, tag: KIND_NAME[w.kind] ?? "Approved" })), ...portfolio.map((p) => ({ url: p.media_url, title: p.caption ?? "Portfolio", kind: "portfolio" as const }))].slice(0, 9);
  const chips = skillChips(
    { kinds: work.map((w) => w.kind), hasCar: Boolean(drives), hasPortfolio: portfolio.length > 0, instagram: igConnected },
    { reel: <Play size={16} weight="fill" aria-hidden />, story: <InstagramLogo size={16} aria-hidden />, car: <Car size={16} aria-hidden />, photo: <Images size={16} aria-hidden />, instagram: <InstagramLogo size={16} aria-hidden /> },
  );
  const rows: RecentRow[] = work.slice(0, 5).map((w) => ({ id: w.id, logo: w.logo, business: w.business, kind: KIND_NAME[w.kind] ?? w.kind, status: "Approved", tone: "success" as const, amount: formatMoney(w.pay_cents).replace(/\.00$/, ""), href: businessViewer ? undefined : `/o/${w.campaign_id}` }));
  const followers = Number(counts?.followers ?? 0);

  return (
    <main className="fs-phone-main" id="main">
      <div className="pf-page">
        <aside className="pf-side">
          <ProfileHead avatar={person.avatar_url} name={name} handle={person.username} city={person.city} verified={verified} bio={person.bio}
            badges={<>{igConnected && person.ig_handle && <span><InstagramLogo size={14} aria-hidden />@{person.ig_handle.replace(/^@/, "")}{person.ig_followers != null ? ` · ${compactCount(person.ig_followers)}` : ""}</span>}{drives && <span><Car size={14} aria-hidden />Drives with TapMart</span>}</>}
            actions={isMe ? <Link href="/me/edit" className="btn btn-sm">Edit profile</Link> : (
              <>
                {businessViewer ? (
                  <>
                    <Link href={`/business/people/${person.username}?request=story`} className="btn btn-signal btn-md"><PaperPlaneTilt size={16} aria-hidden /> Request Story</Link>
                    <Link href={`/business/people/${person.username}?request=reel`} className="btn">Request Reel</Link>
                  </>
                ) : <FollowButton profileId={person.id} initialFollowing={Boolean(following)} />}
                <ReportMenu targetType="profile" targetId={person.id} />
              </>
            )} />
          <StatsRow items={[
            { v: String(completed), l: completed === 1 ? "Job" : "Jobs" },
            ...(ratingCount > 0 && rating != null ? [{ v: rating.toFixed(1), l: "Rating", star: true }] : []),
            ...(followers > 0 ? [{ v: compactCount(followers), l: "Followers" }] : []),
          ]} />
          <Chips items={chips} />
        </aside>

        <div className="pf-main">
          <DSection title="Work" id="work" meta={tiles.length > 0 ? `${tiles.length}` : undefined}>
            <WorkGrid items={tiles} owner={name} />
          </DSection>
          {rows.length > 0 && (
            <DSection title="Recent work" id="recent"><RecentWork rows={rows} /></DSection>
          )}
          {ratingCount > 0 && (
            <DSection title="Reputation" id="reputation">
              <Reputation rating={rating} reviews={ratingCount} completed={completed} />
              <div style={{ marginTop: 8 }}><Reviews items={reviews} /></div>
            </DSection>
          )}
        </div>
      </div>
    </main>
  );
}
