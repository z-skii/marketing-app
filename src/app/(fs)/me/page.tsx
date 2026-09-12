import Link from "next/link";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles } from "@/lib/v2/opportunities";
import { countShootsAssignedTo } from "@/lib/business/shoots";
import { sql, sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { fmtDate, isVideoUrl } from "@/lib/v2/opportunities";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Status } from "@/components/fs/parts";
import { VehicleMoment } from "@/components/fs/VehicleMoment";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/**
 * User Profile in Frame Shift: an identity plate, the earned record, the
 * capabilities that unlock work as literal states, one Smart Vehicle
 * moment, recent work, private money, then the secondary destinations.
 * Every value is the person's real record; missing things show their
 * honest state.
 */
const WORK_STATE: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" }> = {
  submitted: { label: "In review", tone: "waiting" }, under_review: { label: "In review", tone: "waiting" },
  revision_requested: { label: "Revision requested", tone: "waiting" }, approved: { label: "Approved", tone: "confirmed" },
  paid: { label: "Paid", tone: "confirmed" }, rejected: { label: "Not approved", tone: "problem" },
};
const KIND_NAME: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };

export default async function MePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const uid = ctx.user.id;

  const [stats, vehicles, recent, payout, assignedShoots, creator] = await Promise.all([
    sqlOne<{ rating: string | null; rating_count: string; completed: string; lifetime: string; available: string }>(
      `select cp.rating_avg::text as rating, coalesce(cp.rating_count, 0)::text as rating_count,
              (select count(*) from submissions s where s.creator_id = $1 and s.status in ('approved', 'paid'))::text as completed,
              (select coalesce(sum(amount_cents), 0) from earnings where profile_id = $1 and status in ('available', 'requested', 'paid'))::text as lifetime,
              (select coalesce(sum(amount_cents), 0) from earnings where profile_id = $1 and status = 'available')::text as available
         from (select 1) one left join creator_profiles cp on cp.profile_id = $1`,
      [uid],
    ),
    getMyVehicles(uid),
    sql<{ id: string; status: string; media: string | null; kind: string; title: string; created_at: string }>(
      `select s.id, s.status::text as status, s.media_urls[1] as media, c.kind::text as kind, c.title, s.created_at
         from submissions s join campaigns c on c.id = s.campaign_id
        where s.creator_id = $1 order by s.created_at desc limit 3`,
      [uid],
    ),
    sqlOne<{ amount: string; at: string | null }>(
      `select coalesce(sum(amount_cents), 0)::text as amount, max(created_at)::text as at
         from payout_requests where creator_user_id = $1 and status in ('requested', 'approved')`,
      [uid],
    ),
    countShootsAssignedTo(uid),
    sqlOne<{ verification: string }>(`select verification::text as verification from creator_profiles where profile_id = $1`, [uid]),
  ]);

  const name = ctx.user.displayName ?? `@${ctx.user.username}`;
  const car = vehicles[0] ?? null;
  const ig = ctx.instagram;
  const igLine = ig.status === "connected"
    ? `@${ig.handle ?? ""} · ${ig.verifiedBy === "api" ? "Connected" : "Confirmed manually"}${ig.followers != null ? ` · ${ig.followers.toLocaleString()} followers` : ""}`
    : ig.status === "pending" ? (ig.handle ? `@${ig.handle} · Checking` : "Checking")
    : ig.status === "error" ? "Connection needs attention"
    : "Not connected · Required for Reels and Stories";
  const verification = creator?.verification ?? (ctx.isCreator ? "unverified" : null);
  const verificationLabel = verification === "verified" ? "Verified" : verification === "pending" ? "In review" : verification === "rejected" ? "Not approved" : "Not verified";
  const verificationTone = verification === "verified" ? "confirmed" : verification === "pending" ? "waiting" : verification === "rejected" ? "problem" : "neutral";
  const lifetime = Number(stats?.lifetime ?? 0);
  const available = Number(stats?.available ?? 0);
  const requested = Number(payout?.amount ?? 0);
  const ratingCount = Number(stats?.rating_count ?? 0);

  return (
    <>
      {/* Identity plate: the portrait crosses the graphite plane by 12px; the record stays still below. */}
      <div className="fs-on-dark fs-masthead" style={{ background: "var(--fs-graphite)", color: "var(--fs-on-dark)", padding: "12px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 36 }}>
          <h1 className="fs-t-page">Profile</h1>
          <Link href="/me/edit" className="fs-btn fs-btn-quiet" style={{ color: "var(--fs-focus-dark)", minHeight: 44, margin: "-4px 0" }}>Edit profile</Link>
        </div>
        <div className="fs-identity-plate" style={{ marginTop: 16, position: "relative", zIndex: 1 }}>
          <div className="fs-media fs-plate-portrait" style={{ width: 104, height: 130, background: "var(--fs-stage)", display: "grid", placeItems: "center" }}>
            {ctx.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ctx.avatarUrl} alt={`${name}, profile photo`} width={104} height={130} />
            ) : <span aria-hidden className="fs-display" style={{ fontWeight: 700, fontSize: 40, color: "var(--fs-on-dark)" }}>{(name.trim()[0] ?? "?").toUpperCase()}</span>}
          </div>
          <div style={{ paddingTop: 16, minWidth: 0 }}>
            <p className="fs-t-identity">{name}</p>
            <p style={{ marginTop: 4, fontSize: 16, lineHeight: "24px", color: "var(--fs-muted-dark)", overflowWrap: "anywhere" }}>@{ctx.user.username}</p>
            <p className="fs-t-meta" style={{ marginTop: 2, color: "var(--fs-muted-dark)" }}>{ctx.city ?? "Add your city"}</p>
          </div>
        </div>
      </div>

      <main className="fs-phone-main fs-profile-main" id="main" style={{ paddingTop: 34 }}>
        <div className="fs-profile-grid">
        <div>
        <dl className="fs-record-strip">
          <Fact value={formatCredit(lifetime)} label="Earned" />
          <Fact value={stats?.completed ?? "0"} label="Completed" />
          <Fact value={stats?.rating ? Number(stats.rating).toFixed(1) : "New"} label={ratingCount > 0 ? `Rating · ${ratingCount} review${ratingCount === 1 ? "" : "s"}` : "Rating"} />
        </dl>

        <section aria-label="Instagram and verification" style={{ marginTop: 12 }}>
          <Link href="/me/instagram" className="fs-row-link" style={{ minHeight: 64 }}>
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Instagram</span>
              <span className="fs-t-meta" style={{ display: "block" }}>{igLine}</span>
            </span>
            <CaretRight size={20} aria-hidden style={{ color: "var(--fs-muted)", flexShrink: 0 }} />
          </Link>
          <hr className="fs-divider" />
          <Link href="/me/creator" className="fs-row-link" style={{ minHeight: 48 }}>
            <span className="fs-t-body">Creator verification <Status tone={verificationTone}>· {verificationLabel}</Status></span>
            <CaretRight size={20} aria-hidden style={{ color: "var(--fs-muted)", flexShrink: 0 }} />
          </Link>
        </section>

        <section aria-labelledby="vehicles-title" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
            <h2 id="vehicles-title" className="fs-t-section">Vehicles</h2>
            <Link href={car ? "/me/vehicles" : "/me/vehicles/new"} className="fs-btn fs-btn-quiet">{car ? "All vehicles" : "Add vehicle"}</Link>
          </div>
          {car ? (
            <VehicleMoment vehicle={car} style={{ marginTop: 12 }} />
          ) : (
            <div style={{ marginTop: 12 }}>
              <p className="fs-t-body">No vehicle yet.</p>
              <p className="fs-t-meta" style={{ marginTop: 2 }}>Add your car to become available for car advertising.</p>
              <Link href="/me/vehicles/scan" className="fs-btn fs-btn-secondary" style={{ marginTop: 12 }}>Scan my car</Link>
            </div>
          )}
        </section>
        </div>

        <div>
        <section aria-labelledby="work-title" className="fs-profile-work">
          <h2 id="work-title" className="fs-t-section">Recent work</h2>
          {recent.length === 0 ? (
            <p className="fs-t-meta" style={{ marginTop: 12 }}>No submitted work yet. Approved work appears here.</p>
          ) : (
            <ul className="fs-work-strip" style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
              {recent.map((w) => {
                const st = WORK_STATE[w.status] ?? { label: w.status, tone: "neutral" as const };
                return (
                  <li key={w.id}>
                    <Link href="/activity" style={{ display: "block" }} aria-label={`${w.title}: ${KIND_NAME[w.kind] ?? w.kind}, ${st.label}`}>
                      <span className="fs-media fs-contain fs-work-thumb" style={{ display: "block", background: "var(--fs-underlay)" }}>
                        {w.media ? <MediaPreview src={w.media} alt="" className="fs-ref-media" sizes="104px" /> : <span style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--fs-muted)", fontSize: 14 }}>No file</span>}
                        {w.media && isVideoUrl(w.media) && <span className="fs-media-caption">Video</span>}
                      </span>
                      <span className="fs-t-meta" style={{ display: "block", marginTop: 8, color: "var(--fs-ink)" }}>{KIND_NAME[w.kind] ?? w.kind}</span>
                      <Status tone={st.tone} className="fs-block">{st.label}</Status>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/activity" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 8 }}>View Activity <ArrowRight size={18} aria-hidden /></Link>
        </section>

        <section aria-labelledby="earn-title" style={{ marginTop: 24 }}>
          <h2 id="earn-title" className="fs-t-section">Earnings</h2>
          <p className="fs-t-task" style={{ marginTop: 12 }}>Available {formatCredit(available)}</p>
          <p className="fs-t-meta" style={{ marginTop: 2 }}>From approved work</p>
          {requested > 0 ? (
            <>
              <p className="fs-t-body" style={{ marginTop: 8 }}>Payout requested · {formatCredit(requested)}</p>
              {payout?.at && <p className="fs-t-meta">{fmtDate(payout.at)}</p>}
            </>
          ) : <p className="fs-t-body" style={{ marginTop: 8 }}>No payout requested</p>}
          <Link href="/earnings" className="fs-btn fs-btn-secondary" style={{ marginTop: 16, width: "100%", maxWidth: 400 }}>Open Earnings</Link>
        </section>

        <section aria-label="More" style={{ marginTop: 32 }}>
          {[
            ["Portfolio", "/me/portfolio"],
            ["Public profile and reviews", `/u/${ctx.user.username}`],
            ...(assignedShoots > 0 || ctx.isCreator ? [[assignedShoots > 0 ? `Your shoots · ${assignedShoots} assigned` : "Your shoots", "/me/shoots"]] : []),
            ["Settings", "/me/settings"],
          ].map(([label, href], i) => (
            <div key={label}>
              {i > 0 && <hr className="fs-divider" />}
              <Link href={href} className="fs-row-link" style={{ minHeight: 64 }}>
                <span className="fs-t-body">{label}</span>
                <CaretRight size={20} aria-hidden style={{ color: "var(--fs-muted)", flexShrink: 0 }} />
              </Link>
            </div>
          ))}
        </section>
        </div>
        </div>
      </main>
    </>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="fs-money-record">{value}</dd>
      <dt className="fs-t-meta" style={{ marginTop: 2, whiteSpace: "nowrap" }}>{label}</dt>
    </div>
  );
}
