import Link from "next/link";
import { Gear, CaretRight, CheckCircle, InstagramLogo, Car as CarIcon, Wallet, Megaphone, Camera, Star } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles } from "@/lib/v2/opportunities";
import { countShootsAssignedTo } from "@/lib/business/shoots";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { Avatar, SurfaceRow } from "@/components/v2/ui";
import { VehicleStage, type StagePhoto } from "@/components/v2/vehicle/VehicleStage";
import { IdentitySwitcher, type Identity } from "./IdentitySwitcher";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/**
 * Your TapMart earning identity. Who you are, what you have earned, your
 * car on stage, and the three things that unlock work. Settings live
 * behind the gear; switching identities lives at the bottom.
 */
export default async function MePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const [stats, vehicles, settings, assignedShoots] = await Promise.all([
    sqlOne<{ rating: string | null; completed: string; lifetime: string; available: string; saved: string; active: string }>(
      `select cp.rating_avg::text as rating,
              (select count(*) from submissions s where s.creator_id = $1 and s.status in ('approved', 'paid'))::text as completed,
              (select coalesce(sum(amount_cents), 0) from earnings
                where profile_id = $1 and status in ('available', 'requested', 'paid'))::text as lifetime,
              (select coalesce(sum(amount_cents), 0) from earnings
                where profile_id = $1 and status = 'available')::text as available,
              (select count(*) from saved_items where profile_id = $1 and item_type = 'campaign')::text as saved,
              ((select count(*) from applications a where a.applicant_id = $1 and a.status in ('applied', 'accepted'))
               + (select count(*) from submissions s where s.creator_id = $1 and s.status in ('submitted', 'under_review', 'revision_requested'))
               + (select count(*) from car_bookings k join vehicles v on v.id = k.vehicle_id
                   where v.owner_id = $1 and k.status in ('creative_pending', 'installation_pending', 'active', 'proof_required')))::text as active
         from (select 1) one
         left join creator_profiles cp on cp.profile_id = $1`,
      [ctx.user.id],
    ),
    getMyVehicles(ctx.user.id),
    getSettings(),
    countShootsAssignedTo(ctx.user.id),
  ]);

  const car = vehicles[0] ?? null;
  const stage = car ? await loadStage(car.id) : null;
  const activeBookings = car ? Number((await sqlOne<{ n: string }>(
    `select count(*)::text as n from car_bookings k where k.vehicle_id = $1 and k.status in ('creative_pending', 'installation_pending', 'active', 'proof_required')`,
    [car.id],
  ))?.n ?? 0) : 0;

  const name = ctx.user.displayName ?? `@${ctx.user.username}`;
  const available = Number(stats?.available ?? 0);
  const minPayout = Number(settings.minimum_payout_cents ?? "2500");
  const ig = ctx.instagram;

  const identities: Identity[] = [
    { id: "personal", name, sub: "Personal", logo: ctx.avatarUrl, active: ctx.mode === "user" },
    ...ctx.businesses.map((b) => ({
      id: b.id, name: b.name, sub: "Business", logo: b.logo_url, active: ctx.activeBusiness?.id === b.id,
    })),
  ];

  const carStatus = car ? (car.status === "listed" && car.available ? "Ready for ads" : car.status === "listed" ? "Paused" : "Not listed yet") : null;
  const carOn = Boolean(car && car.status === "listed" && car.available);
  const identityLine = [ctx.isCreator ? "Creator" : null, car ? "Drives with TapMart" : null, ctx.city].filter(Boolean).join("  ·  ");

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <section className="min-w-0">
          {/* ------------------------------------------------------ header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar src={ctx.avatarUrl} name={name} size={84} />
              <div className="min-w-0">
                <h1 className="truncate font-display text-[1.625rem] leading-none font-800 tracking-[-0.03em] md:text-[2rem]">
                  {name}
                  {ctx.isVerified && <CheckCircle size={22} weight="fill" className="ml-1.5 inline-block align-[-3px] text-signal" aria-label="Verified" />}
                </h1>
                <p className="mt-2 truncate text-sm text-ink-faint">{identityLine || `@${ctx.user.username}`}</p>
                <div className="mt-3 flex gap-6">
                  <Figure value={formatCredit(Number(stats?.lifetime ?? 0))} label="Earned" />
                  <Figure value={stats?.completed ?? "0"} label="Campaigns" />
                  <Figure value={stats?.rating ? Number(stats.rating).toFixed(1) : "New"} label="Rating" star={Boolean(stats?.rating)} />
                </div>
              </div>
            </div>
            <Link href="/me/settings" aria-label="Settings" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink">
              <Gear size={22} aria-hidden />
            </Link>
          </div>

          {/* ----------------------------------------------------- the car */}
          {car && stage ? (
            <section className="mt-6 overflow-hidden rounded-[16px] bg-surface" aria-label="Your car">
              <Link href={`/me/vehicles/${car.id}`} className="flex items-center gap-3 px-4 pt-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-[0.8125rem] font-800">{car.make.trim()[0]?.toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[1.0625rem] leading-tight font-700">{car.year} {car.make} {car.model}</span>
                  <span className={`mt-0.5 flex items-center gap-1.5 text-xs ${carOn ? "text-ink-soft" : "text-ink-faint"}`}>
                    {carOn && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />}
                    {carStatus}{activeBookings > 0 ? ` · ${activeBookings} active` : ""}
                  </span>
                </span>
                <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
              </Link>
              <div className="px-2 pt-2 pb-2">
                <VehicleStage glbUrl={stage.glbUrl} posterUrl={stage.posterUrl} photos={stage.photos} label={stage.label} compact />
              </div>
              {stage.scanHint && (
                <div className="px-4 pb-3.5">
                  <Link href={stage.scanHref} className="link-row text-sm">{stage.scanHint}<CaretRight size={14} aria-hidden /></Link>
                </div>
              )}
            </section>
          ) : (
            <section className="relative mt-6 overflow-hidden rounded-[16px] bg-surface px-5 py-7" aria-label="Your car">
              <CarIcon size={40} weight="duotone" className="text-ink-soft" aria-hidden />
              <p className="mt-3 font-display text-[1.375rem] leading-[1.05] font-800 tracking-[-0.03em]">Make money with your car</p>
              <p className="mt-1.5 max-w-xs text-sm text-ink-soft">Scan it once. Car campaigns near you show whether it qualifies.</p>
              <Link href="/me/vehicles/scan" className="btn btn-signal mt-4">Scan my car</Link>
            </section>
          )}

          {/* --------------------------------------------------------- rows */}
          <ul className="mt-2.5 flex flex-col gap-2" aria-label="Earning setup">
            <li>
              <SurfaceRow
                href="/me/instagram" icon={<InstagramLogo size={22} aria-hidden />}
                title={ig.status === "connected" ? "Instagram connected" : ig.status === "pending" ? "Instagram being confirmed" : "Connect Instagram"}
                sub={ig.handle ? `@${ig.handle}` : "For Story campaigns"}
                status={ig.status === "connected" ? "Connected" : ig.status === "pending" ? "Checking" : undefined}
                statusTone={ig.status === "connected" ? "signal" : "faint"}
              />
            </li>
            {car && (
              <li>
                <SurfaceRow
                  href={`/me/vehicles/${car.id}`} icon={<CarIcon size={22} aria-hidden />}
                  title={carOn ? "Vehicle ready for ads" : "Your vehicle"} sub={`${car.year} ${car.make} ${car.model}`}
                  status={carOn ? "Active" : carStatus ?? undefined} statusTone={carOn ? "signal" : "faint"}
                />
              </li>
            )}
            <li>
              <SurfaceRow
                href="/activity" icon={<Megaphone size={22} aria-hidden />}
                title="Recent campaigns" sub={`${stats?.active ?? 0} active · ${stats?.completed ?? 0} completed`}
              />
            </li>
            <li>
              <SurfaceRow
                href="/earnings" icon={<Wallet size={22} aria-hidden />}
                title={available >= minPayout ? "Payout ready" : "Earnings"}
                sub={available > 0 ? `${formatCredit(available)} available` : `Payouts start at ${formatCredit(minPayout)}`}
                status={available >= minPayout ? "Ready" : undefined} statusTone="signal"
              />
            </li>
            {assignedShoots > 0 && (
              <li>
                <SurfaceRow href="/me/shoots" icon={<Camera size={22} aria-hidden />} title="Your shoots" sub={`${assignedShoots} assigned`} />
              </li>
            )}
          </ul>

          <ul className="mt-5 divide-y divide-rule">
            <Row href="/activity?tab=saved" title="Saved" value={String(stats?.saved ?? 0)} />
            <Row href={`/u/${ctx.user.username}`} title="Public profile and reviews" />
          </ul>
        </section>

        {/* ------------------------------------------------- identity rail */}
        <aside className="mt-10 lg:mt-0">
          <h2 className="eyebrow">Use TapMart as</h2>
          <div className="mt-2">
            <IdentitySwitcher identities={identities} canAddBusiness flat />
          </div>
        </aside>
      </div>
    </main>
  );
}

async function loadStage(vehicleId: string) {
  const v = await sqlOne<{ v: Record<string, unknown> }>(`select row_to_json(v) as v from vehicles v where v.id = $1`, [vehicleId]);
  const row = v?.v ?? {};
  const glbUrl = typeof row.model_glb_url === "string" ? row.model_glb_url : null;
  const posterFromRow = typeof row.poster_url === "string" ? row.poster_url : null;
  const photos = await sql<{ angle: string; url: string }>(
    `select angle::text as angle, url from vehicle_photos where vehicle_id = $1 order by created_at`,
    [vehicleId],
  );
  let scanPhotos: StagePhoto[] = [];
  let scanStatus: string | null = null;
  let scanIdOf: string | null = null;
  let quality: string | null = null;
  try {
    const scan = await sqlOne<{ id: string; status: string; capture: { photos?: StagePhoto[] } | null; quality: { label?: string } | null }>(
      `select id, status, capture, quality from vehicle_scans where vehicle_id = $1 order by created_at desc limit 1`,
      [vehicleId],
    );
    if (scan) {
      scanStatus = scan.status;
      scanIdOf = scan.id;
      scanPhotos = scan.capture?.photos ?? [];
      quality = scan.quality?.label ?? null;
    }
  } catch {
    // vehicle_scans arrives with a later migration; the stage still works on photos alone.
  }
  const stagePhotos = scanPhotos.length >= 2 ? scanPhotos : photos;
  const posterUrl = posterFromRow ?? stagePhotos[0]?.url ?? null;
  const label = glbUrl ? "3D scan" : quality ?? (stagePhotos.length >= 2 ? "Photo scan" : null);
  const running = scanStatus && ["queued", "validating", "recognizing", "reconstructing"].includes(scanStatus);
  const scanHint = glbUrl || scanStatus === "waiting_provider" ? null
    : scanStatus === "needs_retake" ? "Rescan angles"
    : running ? "Scan in progress"
    : "Scan my car";
  const scanHref = scanStatus && scanStatus !== "complete" && scanStatus !== "failed" ? `/me/vehicles/scan/${scanIdOf}` : `/me/vehicles/scan?vehicle=${vehicleId}`;
  return { glbUrl, posterUrl, photos: stagePhotos, label, scanHint, scanHref };
}

function Figure({ value, label, star = false }: { value: string; label: string; star?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="tnum flex items-center gap-1 font-display text-[1.125rem] leading-none font-800 tracking-[-0.02em] md:text-[1.25rem]">
        {value}{star && <Star size={14} weight="fill" className="text-signal" aria-hidden />}
      </p>
      <p className="mt-1 text-xs text-ink-faint">{label}</p>
    </div>
  );
}

function Row({ href, title, value }: { href: string; title: string; value?: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-14 items-center justify-between gap-3 py-3">
        <span className="font-display text-[1.0625rem] font-700">{title}</span>
        <span className="flex items-center gap-2 text-ink-faint">
          {value && <span className="tnum font-display text-base font-700 text-ink">{value}</span>}
          <CaretRight size={18} aria-hidden />
        </span>
      </Link>
    </li>
  );
}
