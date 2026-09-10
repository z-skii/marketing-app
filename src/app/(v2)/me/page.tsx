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

  const carStatus = car ? (car.status === "listed" && car.available ? "Ready for ads" : car.status === "listed" ? "Paused" : "Not listed yet") : null;
  const carOn = Boolean(car && car.status === "listed" && car.available);
  const identityLine = [ctx.isCreator ? "Creator" : null, ctx.city].filter(Boolean).join("  ·  ");

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pt-3 pb-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-xl">
        <section className="min-w-0">
          {/* ------------------------------------------------------ header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar src={ctx.avatarUrl} name={name} size={88} />
              <div className="min-w-0">
                <h1 className="truncate font-display text-[1.625rem] leading-[1.15] font-700 tracking-[-0.02em]">
                  {name}
                  {ctx.isVerified && <CheckCircle size={22} weight="fill" className="ml-1.5 inline-block align-[-3px] text-signal" aria-label="Verified" />}
                </h1>
                <p className="mt-0.5 truncate text-sm text-ink-soft">{identityLine || `@${ctx.user.username}`}</p>
                <div className="mt-3 flex gap-6">
                  <Figure value={formatCredit(Number(stats?.lifetime ?? 0))} label="Earned" />
                  <Figure value={stats?.completed ?? "0"} label="Campaigns" />
                  <Figure value={stats?.rating ? Number(stats.rating).toFixed(1) : null} label="Rating" star={Boolean(stats?.rating)} />
                </div>
              </div>
            </div>
            <Link href="/me/settings" aria-label="Settings" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink rail:flex">
              <Gear size={22} aria-hidden />
            </Link>
          </div>

          {/* ----------------------------------------------------- the car */}
          {car && stage ? (
            <section className="row relative mt-6 h-[152px] overflow-hidden" aria-label="Your car">
              <div className="absolute inset-y-0 right-0 w-[64%]">
                <VehicleStage glbUrl={stage.glbUrl} posterUrl={stage.posterUrl} photos={stage.photos} label={null} fill />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-[linear-gradient(to_right,var(--color-surface),transparent)]" aria-hidden />
              </div>
              <Link href={`/me/vehicles/${car.id}`} className="absolute inset-0 flex items-start justify-between gap-2 p-4" aria-label={`${car.year} ${car.make} ${car.model}, ${carStatus}`}>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[1.0625rem] leading-[1.3] font-600 tracking-[-0.01em]">{car.year} {car.make} {car.model}</span>
                  <span className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                    {carOn && <span aria-hidden className="status-dot" />}
                    {carStatus}{activeBookings > 0 ? ` · ${activeBookings} active` : ""}
                  </span>
                </span>
                <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
              </Link>
              {stage.scanHint && (
                <Link href={stage.scanHref} className="absolute bottom-3 left-4 z-10 text-sm text-ink-soft underline-offset-2 can-hover:hover:underline">{stage.scanHint}</Link>
              )}
            </section>
          ) : (
            <section className="row relative mt-6 overflow-hidden px-4 py-5" aria-label="Your car">
              <div className="flex items-center gap-3.5">
                <span className="icon-square"><CarIcon size={22} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1.0625rem] font-600 tracking-[-0.01em]">Make money with your car</p>
                  <p className="mt-0.5 text-sm text-ink-soft">Scan it once. Car campaigns show whether it qualifies.</p>
                </div>
              </div>
              <Link href="/me/vehicles/scan" className="btn btn-signal mt-4 w-full">Scan my car</Link>
            </section>
          )}

          {/* --------------------------------------------------------- rows */}
          <ul className="mt-2.5 flex flex-col gap-2.5" aria-label="Earning setup">
            <li>
              <SurfaceRow
                href="/me/instagram" icon={<InstagramLogo size={22} aria-hidden />} iconTone="instagram"
                title="Instagram"
                sub={ig.handle ? `@${ig.handle}` : "For Story campaigns"}
                status={ig.status === "connected" ? "Connected" : ig.status === "pending" ? "Checking" : undefined}
                statusTone={ig.status === "connected" ? "signal" : "faint"}
              />
            </li>
            {car && (
              <li>
                <SurfaceRow
                  href={`/me/vehicles/${car.id}`} icon={<CarIcon size={22} aria-hidden />}
                  title={carOn ? "Vehicle Ready for Ads" : "Your vehicle"} sub={`${car.year} ${car.make} ${car.model}`}
                  status={carOn ? "Active" : carStatus ?? undefined} statusTone={carOn ? "signal" : "faint"}
                />
              </li>
            )}
            <li>
              <SurfaceRow
                href="/activity" icon={<Megaphone size={22} aria-hidden />} iconTone="warn"
                title="Recent Campaigns" sub={`${stats?.active ?? 0} active · ${stats?.completed ?? 0} completed`}
              />
            </li>
            <li>
              <SurfaceRow
                href="/earnings" icon={<Wallet size={22} aria-hidden />} iconTone="success"
                title={available >= minPayout ? "Payout Ready" : "Earnings"}
                sub={available > 0 ? `${formatCredit(available)} available` : `Payouts start at ${formatCredit(minPayout)}`}
              />
            </li>
            {assignedShoots > 0 && (
              <li>
                <SurfaceRow href="/me/shoots" icon={<Camera size={22} aria-hidden />} title="Your shoots" sub={`${assignedShoots} assigned`} />
              </li>
            )}
          </ul>

        </section>
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

function Figure({ value, label, star = false }: { value: string | null; label: string; star?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="tnum flex items-center gap-1 font-display text-[1.25rem] leading-none font-600 tracking-[-0.02em]">
        {value ?? <span className="text-ink-faint">New</span>}{star && <Star size={15} weight="fill" className="text-warn" aria-hidden />}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
