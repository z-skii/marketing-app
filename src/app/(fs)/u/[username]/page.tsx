import Link from "next/link";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { imageRatio } from "@/lib/fs/media-ratio";
import { compactCount } from "@/lib/v2/marketplace";
import { Avatar } from "@/components/fs/parts";
import { Img } from "@/components/fs/Img";
import { Facts, Section } from "@/components/fs/work/DetailParts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { fmtDay } from "@/components/fs/business/campaign/parts";
import { FollowButton, ReportMenu } from "@/components/fs/inbox/ProfileSocial";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username}` };
}

const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/**
 * A creator's public profile: identity, city, verification and Instagram
 * provenance as recorded, real work samples at their own ratio, reviews.
 * No addresses, no documents, no earnings. Vehicles stay private; only
 * "Drives with TapMart" shows when a car is listed. A business viewing
 * the profile gets the two requests the product runs.
 */
export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [ctx, { username }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;
  const person = await sqlOne<{
    id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null; city: string | null; suspended: boolean;
    verification: string | null; completed_jobs: number | null; rating_avg: string | null; rating_count: number | null;
    ig_status: string | null; ig_handle: string | null; ig_followers: number | null; ig_verified_by: string | null;
  }>(
    `select p.id, p.username, p.display_name, p.avatar_url, p.bio, p.city, p.suspended,
            cp.verification::text as verification, cp.completed_jobs, cp.rating_avg::text as rating_avg, cp.rating_count,
            sa.status::text as ig_status, sa.handle as ig_handle, sa.follower_count as ig_followers, sa.verified_by::text as ig_verified_by
       from profiles p
       left join creator_profiles cp on cp.profile_id = p.id
       left join social_accounts sa on sa.profile_id = p.id and sa.provider = 'instagram'
      where lower(p.username) = lower($1)`,
    [username],
  );
  if (!person || person.suspended) notFound();

  const [counts, work, portfolio, drives, reviews, following] = await Promise.all([
    sqlOne<{ followers: string; following: string }>(`select (select count(*) from follows where followed_id = $1)::text as followers, (select count(*) from follows where follower_id = $1)::text as following`, [person.id]),
    sql<{ url: string; title: string }>(
      `select s.media_urls[1] as url, c.title from submissions s join campaigns c on c.id = s.campaign_id
        where s.creator_id = $1 and s.status in ('approved', 'paid') and cardinality(s.media_urls) > 0 order by s.created_at desc limit 6`,
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
  const samples = [...work.map((w) => ({ url: w.url, title: w.title, kind: "approved" as const })), ...portfolio.map((p) => ({ url: p.media_url, title: p.caption ?? "Portfolio", kind: "portfolio" as const }))].slice(0, 9);
  const ratios = await Promise.all(samples.map((s) => (VIDEO.test(s.url) ? Promise.resolve(9 / 16) : imageRatio(s.url))));
  const igConnected = person.ig_status === "connected";
  const igLine = igConnected ? `Instagram ${person.ig_verified_by === "api" ? "connected" : "confirmed by TapMart"}` : "Instagram not connected";
  const igDetail = igConnected ? [person.ig_handle ? `@${person.ig_handle.replace(/^@/, "")}` : null, person.ig_followers != null ? `${compactCount(person.ig_followers)} followers` : null].filter(Boolean).join(" · ") : "";
  const verified = person.verification === "verified";
  const ratingCount = person.rating_count ?? 0;
  const businessViewer = ctx.mode === "business" && ctx.activeBusiness;

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail" style={{ marginTop: 12 }}>
        <div className="fs-detail-source" style={{ marginTop: 0 }}>
          <div className="fs-person-hero">
            {person.avatar_url ? <span className="fs-media" style={{ width: 160, height: 160, flex: "none" }}><Img src={person.avatar_url} alt={`${name}, profile photo`} loading="eager" /></span> : <Avatar src={null} name={name} size={160} square />}
            <span style={{ minWidth: 0 }}>
              <h1 className="fs-t-page">{name}</h1>
              <p className="fs-t-meta" style={{ marginTop: 4, overflowWrap: "anywhere" }}>@{person.username}{person.city ? ` · ${person.city}` : ""}</p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>
                <span className={`fs-status is-${verified ? "confirmed" : "neutral"}`}>{verified ? "Verified creator" : person.verification === "pending" ? "Verification pending" : "Not verified"}</span>
                {drives && <> · Drives with TapMart</>}
              </p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{igLine}</p>
              {igDetail && <p className="fs-t-meta" style={{ overflowWrap: "anywhere" }}>{igDetail}</p>}
            </span>
          </div>
          {person.bio && <p className="fs-t-body" style={{ marginTop: 12, maxWidth: 448 }}>{person.bio}</p>}
          {!isMe && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
              {businessViewer ? (
                <>
                  <Link href={`/business/people/${person.username}?request=story`} className="fs-btn fs-btn-primary">Request Story</Link>
                  <Link href={`/business/people/${person.username}?request=reel`} className="fs-btn fs-btn-secondary">Request Reel</Link>
                </>
              ) : <FollowButton profileId={person.id} initialFollowing={Boolean(following)} />}
              <ReportMenu targetType="profile" targetId={person.id} />
            </div>
          )}
          {isMe && <Link href="/me/edit" className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>Edit profile</Link>}

          <Section title="Work">
            {samples.length === 0 ? <p className="fs-t-body" style={{ color: "var(--fs-muted)" }}>No work samples shared yet.</p> : (
              <ul className="fs-work-samples">
                {samples.map((s, i) => {
                  const r = ratios[i] ?? 0.8; const h = 200; const w = Math.round(Math.min(Math.max(h * r, 90), 300));
                  return (
                    <li key={`${s.url}-${i}`}>
                      <InspectButton src={s.url} alt={`${s.title}, ${s.kind === "approved" ? "approved work" : "portfolio"} by ${name}`} label={`Inspect ${s.title}`} className="fs-media" icon={false} style={{ width: w, height: h, display: "block" }}>
                        {VIDEO.test(s.url) ? <span className="fs-video-fallback">Video<span className="fs-video-note">Inspect to play</span></span> : <Img src={s.url} alt="" style={{ width: w, height: h, objectFit: "cover" }} loading={i < 3 ? "eager" : "lazy"} />}
                      </InspectButton>
                      <span className="fs-t-meta" style={{ display: "block", marginTop: 4, maxWidth: w }}>{s.kind === "approved" ? `${s.title} · Approved work` : s.title.toLowerCase() === "portfolio" ? "Portfolio" : `${s.title} · Portfolio`}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        <div className="fs-joint">
          <Section title="Recorded">
            <Facts rows={[
              ["Completed work", String(person.completed_jobs ?? 0)],
              ["Rating", ratingCount > 0 && person.rating_avg ? `${Number(person.rating_avg).toFixed(1)} from ${ratingCount} review${ratingCount === 1 ? "" : "s"}` : "No reviews yet"],
              ["Followers", `${counts?.followers ?? 0} on TapMart`],
              ["Following", counts?.following ?? "0"],
              ["Instagram", igConnected ? (person.ig_verified_by === "api" ? "Connected through Instagram" : "Confirmed manually by TapMart") : "Not connected"],
            ]} />
          </Section>
          {reviews.length > 0 && (
            <Section title={`Reviews · ${reviews.length}`}>
              <ul className="fs-plain-list">
                {reviews.map((r, i) => (
                  <li key={i} style={{ padding: "12px 0", borderTop: i ? "1px solid var(--fs-divider)" : undefined }}>
                    <p className="fs-t-meta"><span style={{ fontWeight: 500, color: "var(--fs-ink)" }}>{r.rating} of 5</span>{r.business_name ? ` · ${r.business_name}` : ""} · {fmtDay(r.created_at)}</p>
                    {r.body && <p className="fs-t-body" style={{ marginTop: 4 }}>{r.body}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}
