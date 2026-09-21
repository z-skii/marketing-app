import Link from "next/link";
import { ArrowRight, CaretRight, Gear, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles } from "@/lib/v2/opportunities";
import { countShootsAssignedTo } from "@/lib/business/shoots";
import { sql, sqlOne } from "@/lib/db";
import { fmtDate } from "@/lib/v2/opportunities";
import { Status, formatMoney } from "@/components/fs/parts";
import { PlaneMedia } from "@/v3/app/parts";
import { placementLabel } from "@/components/v2/EarnCards";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/**
 * User Profile in the approved V3 language: an identity a person would
 * share. The portrait as the focal plane on the dark stage, the name, the
 * public handle, the city and the completed count; the person's own
 * approved and submitted work as planes tagged with their kind; the real
 * vehicle as a quieter contact sheet with its honest state (a model only
 * when one was really built, otherwise the best real photograph). Every
 * value is the person's real record; missing things show their state.
 * Private money and administration sit below the stage as rows; the one
 * gear opens Settings.
 */
const WORK_STATE: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" }> = {
  submitted: { label: "In review", tone: "waiting" }, under_review: { label: "In review", tone: "waiting" },
  revision_requested: { label: "Revision requested", tone: "waiting" }, approved: { label: "Approved", tone: "confirmed" },
  paid: { label: "Paid", tone: "confirmed" }, rejected: { label: "Not approved", tone: "problem" },
};
const KIND_NAME: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car" };

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
    sql<{ id: string; status: string; media: string | null; kind: string; title: string; business: string; created_at: string }>(
      `select s.id, s.status::text as status, s.media_urls[1] as media, c.kind::text as kind, c.title, b.name as business, s.created_at
         from submissions s join campaigns c on c.id = s.campaign_id join businesses b on b.id = c.business_id
        where s.creator_id = $1 order by (s.status in ('approved', 'paid')) desc, s.created_at desc limit 3`,
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
  const igTag = ig.status === "connected" ? `@${ig.handle ?? ""}` : ig.status === "pending" ? "Instagram checking" : ig.status === "error" ? "Instagram issue" : "No Instagram";
  const igLine = ig.status === "connected"
    ? `@${ig.handle ?? ""}${ig.followers != null ? ` · ${ig.followers.toLocaleString()} followers` : ""}`
    : ig.status === "pending" ? (ig.handle ? `@${ig.handle} · Checking` : "Checking")
    : ig.status === "error" ? "Needs attention"
    : "Not connected";
  const verification = creator?.verification ?? (ctx.isCreator ? "unverified" : null);
  const verificationLabel = verification === "verified" ? "Verified" : verification === "pending" ? "In review" : verification === "rejected" ? "Not approved" : "Not verified";
  const verificationTone = verification === "verified" ? "confirmed" : verification === "pending" ? "waiting" : verification === "rejected" ? "problem" : "neutral";
  const available = Number(stats?.available ?? 0);
  const requested = Number(payout?.amount ?? 0);
  const ratingCount = Number(stats?.rating_count ?? 0);
  const completed = Number(stats?.completed ?? 0);
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tapmart.live").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const handle = `${host}/u/${ctx.user.username}`;
  const carPhoto = car ? (car.poster_url ?? car.photo_url ?? null) : null;
  const carState = car ? (car.model_glb_url ? "3D model" : car.scan_status && ["queued", "validating", "recognizing", "reconstructing"].includes(car.scan_status) ? "Scan in progress" : carPhoto ? "Photos only" : "No photos yet") : null;
  const carListing = car ? (car.status === "listed" && car.available ? "Listed for ads" : car.status === "listed" ? "Paused" : "Not listed yet") : null;

  return (
    <main className="fs-phone-main fs-profile-main" id="main">
      <div className="v3 xs-wrap">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44, marginTop: 12 }}>
          <h1 className="fs-t-page">Profile</h1>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/me/edit" className="fs-btn fs-btn-quiet fs-link-ink"><PencilSimple size={20} aria-hidden />Edit</Link>
            <Link href="/me/settings" className="fs-icon-btn" aria-label="Settings"><Gear size={24} aria-hidden /></Link>
          </span>
        </div>

        <div className="xs-stage xs-pf" style={{ marginTop: 12 }}>
          {/* identity: the portrait as the focal plane, the name, the public handle, the recorded facts */}
          <section className="xs-pf-identity" aria-label="Identity">
            <span className="xs-plane xs-pf-portrait" style={{ cursor: "default" }}>
              {ctx.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ctx.avatarUrl} alt={`${name}, profile photo`} width={312} height={390} fetchPriority="high" decoding="async" />
              ) : <span className="xs-plane-empty" aria-hidden><span style={{ fontSize: 64, fontWeight: 500 }}>{(name.trim()[0] ?? "?").toUpperCase()}</span></span>}
            </span>
            <div className="xs-pf-who">
              <h2 className="xs-pf-name">{name}</h2>
              <p className="t-fact xs-pf-handle">{handle}</p>
              <p className="t-fact">{ctx.city ?? "No city yet"}<span aria-hidden> · </span><span className="t-fact-ink">{completed}</span> Completed{ratingCount > 0 && stats?.rating ? <><span aria-hidden> · </span><span className="t-fact-ink">{Number(stats.rating).toFixed(1)}</span> rating, {ratingCount} review{ratingCount === 1 ? "" : "s"}</> : null}</p>
              <p className="xs-pf-tags"><span className="x-tag">{igTag}</span>{car && car.status === "listed" && car.available && <span className="x-tag">Vehicle listed</span>}{verification === "verified" && <span className="x-tag">Verified creator</span>}</p>
            </div>
          </section>

          {/* work: the person's own submissions as planes tagged with their kind; each opens Activity */}
          <section className="xs-pf-workwrap" aria-labelledby="work-h">
            <div className="x-pf-work-head"><h3 id="work-h" className="x-pf-work-h" style={{ color: "#fff" }}>Work</h3></div>
            {recent.length === 0 ? (
              <p className="t-fact" style={{ marginTop: 8 }}>No work yet.</p>
            ) : (
              <div className="xs-pf-work">
                {recent.map((w, i) => {
                  const st = WORK_STATE[w.status] ?? { label: w.status, tone: "neutral" as const };
                  return (
                    <Link key={w.id} href="/activity" className={`xs-plane xs-pf-item-${i}`} aria-label={`${w.title}, ${w.business}: ${KIND_NAME[w.kind] ?? w.kind}, ${st.label}`}>
                      <PlaneMedia src={w.media} alt="" sizes="(min-width: 1024px) 280px, 200px" priority={i === 0} tag={KIND_NAME[w.kind] ?? w.kind} tagBr={st.label} fallback="No file" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* the vehicle: the Drive object, photograph plus its facts, only what the record holds */}
          <section className="xs-obj xs-pf-vehicle" aria-labelledby="vehicle-h">
            {car ? (
              <>
                <Link href={`/me/vehicles/${car.id}`} className="xs-plane" aria-label={`View ${car.year} ${car.make} ${car.model}`}>
                  <PlaneMedia src={carPhoto} alt="" sizes="(min-width: 1024px) 320px, 100vw" tag="Car" tagBr={car.zones[0] ? placementLabel(car.zones[0]) : undefined} fallback="No photos yet" />
                </Link>
                <div className="x-paper xs-sheet">
                  <h3 id="vehicle-h" className="t-object">{car.year} {car.make} {car.model}</h3>
                  <span className="t-fact">{carListing}<span aria-hidden> · </span>{carState}{car.city ? <><span aria-hidden> · </span>{car.city}</> : null}</span>
                  <span className="xs-sheet-row"><span className="t-fact">{vehicles.length > 1 ? `${vehicles.length} cars` : "My car"}</span><Link href="/me/vehicles" className="link t-action">View</Link></span>
                </div>
              </>
            ) : (
              <div className="x-paper xs-sheet" style={{ borderRadius: 10, width: "100%" }}>
                <h3 id="vehicle-h" className="t-object">No car yet</h3>
                <span className="t-fact">Add your car for car ads.</span>
                <span className="xs-sheet-row"><Link href="/me/vehicles/scan" className="link t-action">Scan</Link><Link href="/me/vehicles/new" className="link t-action">Add car</Link></span>
              </div>
            )}
          </section>
        </div>

        {/* capabilities, money and administration: rows, not composition */}
        <section aria-label="Instagram and verification" style={{ marginTop: 24 }}>
          <Link href="/me/instagram" className="fs-row-link" style={{ minHeight: 64 }}>
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Instagram</span>
              <span className="fs-t-meta" style={{ display: "block" }}>{igLine}</span>
            </span>
            <CaretRight size={20} aria-hidden style={{ color: "var(--fs-muted)", flexShrink: 0 }} />
          </Link>
          <hr className="fs-divider" />
          <Link href="/me/creator" className="fs-row-link" style={{ minHeight: 48 }}>
            <span className="fs-t-body">Verification <Status tone={verificationTone}>· {verificationLabel}</Status></span>
            <CaretRight size={20} aria-hidden style={{ color: "var(--fs-muted)", flexShrink: 0 }} />
          </Link>
        </section>

        <section aria-labelledby="earn-title" style={{ marginTop: 24 }}>
          <h2 id="earn-title" className="fs-t-section">Earnings</h2>
          <p className="fs-t-task" style={{ marginTop: 12 }}>{formatMoney(available)} <span className="fs-t-meta">available</span></p>
          {requested > 0 && <p className="fs-t-meta" style={{ marginTop: 4 }}>Payout requested · {formatMoney(requested)}{payout?.at ? ` · ${fmtDate(payout.at)}` : ""}</p>}
          <Link href="/earnings" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 8 }}>Earnings <ArrowRight size={20} aria-hidden /></Link>
        </section>

        <section aria-label="More" style={{ marginTop: 24 }}>
          {[
            ["Activity", "/activity"],
            ["Portfolio", "/me/portfolio"],
            ["Share · Coming soon", "/share"],
            ["Public page", `/u/${ctx.user.username}`],
            ...(assignedShoots > 0 || ctx.isCreator ? [[assignedShoots > 0 ? `Shoots · ${assignedShoots}` : "Shoots", "/me/shoots"]] : []),
            ["Settings", "/me/settings"],
          ].map(([label, href], i) => (
            <div key={label}>
              {i > 0 && <hr className="fs-divider" />}
              <Link href={href} className="fs-row-link" style={{ minHeight: 56 }}>
                <span className="fs-t-body">{label}</span>
                <CaretRight size={20} aria-hidden style={{ color: "var(--fs-muted)", flexShrink: 0 }} />
              </Link>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

