import Link from "next/link";
import { ArrowRight, CaretRight, Gear, PencilSimple, ShareNetwork, Play, InstagramLogo, Car, Images, Camera, Wallet, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles } from "@/lib/v2/opportunities";
import { countShootsAssignedTo } from "@/lib/business/shoots";
import { sql, sqlOne } from "@/lib/db";
import { formatMoney } from "@/components/fs/parts";
import { ProfileHead, StatsRow, Chips, WorkGrid, RecentWork, Reputation, skillChips, type RecentRow, type WorkTile } from "@/components/fs/profile/Parts";
import { DSection } from "@/components/fs/work/DetailKit";
import { CopyLink } from "@/components/fs/profile/CopyLink";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/**
 * The person's own profile: identity, portfolio, earnings reputation and
 * work history, the way another person would read it. The head with the
 * avatar, name, handle, city, verification and a short bio; a compact
 * stats row; skill chips from the record; the work grid; recent work as
 * rows; reputation only when reviews exist; the car and the private
 * rows (Instagram, verification, activity, settings) below. Every
 * figure is the person's own record.
 */
const STATUS: Record<string, { label: string; tone: RecentRow["tone"] }> = {
  submitted: { label: "In review", tone: "info" }, under_review: { label: "In review", tone: "info" },
  revision_requested: { label: "Revision", tone: "warning" }, approved: { label: "Approved", tone: "success" },
  paid: { label: "Paid", tone: "success" }, rejected: { label: "Not approved", tone: "alert" },
};
const KIND_NAME: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };

export default async function MePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const uid = ctx.user.id;

  const [stats, vehicles, recent, portfolio, payout, assignedShoots, creator] = await Promise.all([
    sqlOne<{ rating: string | null; rating_count: string; completed: string; lifetime: string; available: string }>(
      `select cp.rating_avg::text as rating, coalesce(cp.rating_count, 0)::text as rating_count,
              (select count(*) from submissions s where s.creator_id = $1 and s.status in ('approved', 'paid'))::text as completed,
              (select coalesce(sum(amount_cents), 0) from earnings where profile_id = $1 and status in ('available', 'requested', 'paid'))::text as lifetime,
              (select coalesce(sum(amount_cents), 0) from earnings where profile_id = $1 and status = 'available')::text as available
         from (select 1) one left join creator_profiles cp on cp.profile_id = $1`,
      [uid],
    ),
    getMyVehicles(uid),
    sql<{ id: string; status: string; media: string | null; kind: string; title: string; business: string; logo: string | null; pay_cents: number; campaign_id: string; created_at: string }>(
      `select s.id, s.status::text as status, s.media_urls[1] as media, c.kind::text as kind, c.title, b.name as business, b.logo_url as logo, c.pay_cents::int as pay_cents, c.id as campaign_id, s.created_at
         from submissions s join campaigns c on c.id = s.campaign_id join businesses b on b.id = c.business_id
        where s.creator_id = $1 order by s.created_at desc limit 8`,
      [uid],
    ),
    sql<{ media_url: string; caption: string | null }>(`select media_url, caption from portfolio_items where profile_id = $1 order by sort, created_at desc limit 12`, [uid]),
    sqlOne<{ amount: string }>(`select coalesce(sum(amount_cents), 0)::text as amount from payout_requests where creator_user_id = $1 and status in ('requested', 'approved')`, [uid]),
    countShootsAssignedTo(uid),
    sqlOne<{ verification: string }>(`select verification::text as verification from creator_profiles where profile_id = $1`, [uid]),
  ]);

  const name = ctx.user.displayName ?? ctx.user.username;
  const car = vehicles[0] ?? null;
  const ig = ctx.instagram;
  const verification = creator?.verification ?? (ctx.isCreator ? "unverified" : null);
  const verified = verification === "verified";
  const available = Number(stats?.available ?? 0);
  const lifetime = Number(stats?.lifetime ?? 0);
  const requested = Number(payout?.amount ?? 0);
  const ratingCount = Number(stats?.rating_count ?? 0);
  const rating = stats?.rating ? Number(stats.rating) : null;
  const completed = Number(stats?.completed ?? 0);
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tapmart.live").replace(/\/$/, "");
  const publicUrl = `${host}/u/${ctx.user.username}`;
  const approvedWork: WorkTile[] = recent.filter((w) => ["approved", "paid"].includes(w.status) && w.media).map((w) => ({ url: w.media as string, title: w.title, kind: "approved" as const, tag: KIND_NAME[w.kind] ?? "Approved" }));
  const tiles: WorkTile[] = [...approvedWork, ...portfolio.map((p) => ({ url: p.media_url, title: p.caption ?? "Portfolio", kind: "portfolio" as const }))].slice(0, 9);
  const chips = skillChips(
    { kinds: recent.filter((w) => ["approved", "paid"].includes(w.status)).map((w) => w.kind), hasCar: Boolean(car && car.status === "listed"), hasPortfolio: portfolio.length > 0, instagram: ig.status === "connected" },
    { reel: <Play size={16} weight="fill" aria-hidden />, story: <InstagramLogo size={16} aria-hidden />, car: <Car size={16} aria-hidden />, photo: <Images size={16} aria-hidden />, instagram: <InstagramLogo size={16} aria-hidden /> },
  );
  const rows: RecentRow[] = recent.slice(0, 5).map((w) => ({ id: w.id, logo: w.logo, business: w.business, kind: KIND_NAME[w.kind] ?? w.kind, status: STATUS[w.status]?.label ?? w.status, tone: STATUS[w.status]?.tone ?? "neutral", amount: formatMoney(w.pay_cents).replace(/\.00$/, ""), href: `/o/${w.campaign_id}` }));
  const carPhoto = car ? (car.poster_url ?? car.photo_url ?? null) : null;
  const carListing = car ? (car.status === "listed" && car.available ? "Listed for ads" : car.status === "listed" ? "Paused" : "Not listed yet") : null;
  const igValue = ig.status === "connected" ? `@${ig.handle ?? ""}${ig.followers != null ? ` · ${ig.followers.toLocaleString()} followers` : ""}` : ig.status === "pending" ? "Checking" : ig.status === "error" ? "Needs attention" : "Not connected";

  return (
    <main className="fs-phone-main" id="main">
      <div className="pf-page">
        <aside className="pf-side">
          <ProfileHead avatar={ctx.avatarUrl} name={name} handle={ctx.user.username} city={ctx.city} verified={verified} bio={ctx.bio}
            actions={<>
              <Link href="/me/edit" className="btn btn-sm"><PencilSimple size={16} aria-hidden /> Edit</Link>
              <CopyLink url={publicUrl} label="Share" className="btn btn-sm"><ShareNetwork size={16} aria-hidden /> Share</CopyLink>
              <Link href="/me/settings" className="iconbtn is-sm" aria-label="Settings" data-tip="Settings"><Gear size={20} aria-hidden /></Link>
            </>} />
          <StatsRow items={[
            { v: String(completed), l: completed === 1 ? "Job" : "Jobs" },
            ...(ratingCount > 0 && rating != null ? [{ v: rating.toFixed(1), l: "Rating", star: true }] : []),
            { v: formatMoney(lifetime).replace(/\.00$/, ""), l: "Earned" },
          ]} />
          <Chips items={chips} />
          <div className="dt-section pf-desk-only">
            <Link href="/earnings" className="dt-biz" aria-label="Earnings">
              <span className="dt-need-icon" style={{ background: "var(--tm-surface2)", color: "var(--tm-text)" }}><Wallet size={20} aria-hidden /></span>
              <span style={{ minWidth: 0 }}><b>{formatMoney(available)} available</b><span className="dt-biz-sub">{requested > 0 ? `Payout requested · ${formatMoney(requested)}` : "Earnings"}</span></span>
              <span className="dt-biz-go btn btn-sm">Open <ArrowRight size={16} aria-hidden /></span>
            </Link>
          </div>
        </aside>

        <div className="pf-main">
          <DSection title="Work" id="work" meta={tiles.length > 0 ? `${tiles.length}` : undefined}>
            <WorkGrid items={tiles} owner={name} emptyHref="/me/portfolio" emptyLabel="Add to portfolio" />
            {tiles.length > 0 && <div style={{ marginTop: 10 }}><Link href="/me/portfolio" className="btn btn-sm">Manage portfolio <ArrowRight size={16} aria-hidden /></Link></div>}
          </DSection>

          {rows.length > 0 && (
            <DSection title="Recent work" id="recent">
              <RecentWork rows={rows} />
              <Link href="/activity" className="btn btn-sm" style={{ marginTop: 8 }}>All activity <ArrowRight size={16} aria-hidden /></Link>
            </DSection>
          )}

          {ratingCount > 0 && (
            <DSection title="Reputation" id="reputation">
              <Reputation rating={rating} reviews={ratingCount} completed={completed} />
            </DSection>
          )}

          <DSection title="My car" id="car">
            {car ? (
              <Link href={`/me/vehicles/${car.id}`} className="dt-biz" aria-label={`${car.year} ${car.make} ${car.model}`}>
                <span style={{ width: 72, aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", background: "var(--env-charcoal)", flexShrink: 0 }}>
                  {carPhoto
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={carPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                    : <span className="fs-video-fallback" style={{ fontSize: 11 }}>No photo</span>}
                </span>
                <span style={{ minWidth: 0 }}><b>{car.year} {car.make} {car.model}</b><span className="dt-biz-sub">{carListing}{vehicles.length > 1 ? ` · ${vehicles.length} cars` : ""}</span></span>
                <span className="dt-biz-go btn btn-sm">View <ArrowRight size={16} aria-hidden /></span>
              </Link>
            ) : (
              <div className="pf-empty"><Car size={28} aria-hidden /><b>No car yet</b><span>Add your car for car ads.</span><Link href="/me/vehicles/new" className="btn btn-sm" style={{ marginTop: 4 }}>Add car <ArrowRight size={16} aria-hidden /></Link></div>
            )}
          </DSection>

          <DSection title="Account" id="rows">
            <ul className="pf-rows">
              {[
                { href: "/me/instagram", icon: <InstagramLogo size={20} aria-hidden />, label: "Instagram", value: igValue, tone: ig.status === "connected" ? "" : ig.status === "error" ? "is-alert" : "" },
                { href: "/me/creator", icon: <SealCheck size={20} aria-hidden />, label: "Verification", value: verified ? "Verified" : verification === "pending" ? "In review" : verification === "rejected" ? "Not approved" : "Not verified", tone: verified ? "is-success" : "" },
                { href: "/earnings", icon: <Wallet size={20} aria-hidden />, label: "Earnings", value: `${formatMoney(available)} available`, tone: "" },
                ...(assignedShoots > 0 || ctx.isCreator ? [{ href: "/me/shoots", icon: <Camera size={20} aria-hidden />, label: "Shoots", value: assignedShoots > 0 ? `${assignedShoots} assigned` : "None", tone: "" }] : []),
                { href: `/u/${ctx.user.username}`, icon: <ShareNetwork size={20} aria-hidden />, label: "Public page", value: "", tone: "" },
              ].map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="pf-row">
                    <span className="dt-need-icon" style={{ background: "var(--tm-surface2)", color: "var(--tm-text)" }}>{r.icon}</span>
                    <span style={{ minWidth: 0 }}><b>{r.label}</b>{r.value && <span className={`pf-row-sub${r.tone ? ` ${r.tone}` : ""}`}>{r.value}</span>}</span>
                    <CaretRight size={18} aria-hidden style={{ color: "var(--tm-muted)" }} />
                  </Link>
                </li>
              ))}
            </ul>
          </DSection>
        </div>
      </div>
    </main>
  );
}
