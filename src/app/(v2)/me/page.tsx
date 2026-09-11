import Link from "next/link";
import { CaretRight, CheckCircle, InstagramLogo, Car as CarIcon, Wallet, ArrowUpRight, Camera, Gear } from "@phosphor-icons/react/dist/ssr";
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

  const stageMedia = stage ? (stage.glbUrl || stage.posterUrl || stage.photos.length > 0) : false;

  return (
    <main id="main" className="mx-auto w-full max-w-[1136px] px-4 pt-[14px] pb-6 rail:px-8 rail:pt-10">
      <div className="rail:grid rail:grid-cols-[660px_420px] rail:gap-x-7">
        <div className="min-w-0">
          {/* ------------------------------------------ identity (bare page content) */}
          <div className="flex items-start gap-4 px-0.5 rail:gap-5">
            <Avatar src={ctx.avatarUrl} name={name} size={96} ring />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h1 className="flex min-w-0 items-center gap-1.5 font-display text-[23px] leading-[29px] font-[800] tracking-[-0.45px] rail:text-[30px] rail:leading-9 rail:font-[820]">
                  <span className="truncate">{name}</span>
                  {ctx.isVerified && <CheckCircle size={16} weight="fill" className="shrink-0 text-signal" aria-label="Verified" />}
                </h1>
                <Link href="/me/settings" aria-label="Settings" className="iconbtn hidden shrink-0 rail:inline-grid"><Gear size={22} aria-hidden /></Link>
              </div>
              <p className="mt-0.5 truncate text-[13px] leading-[17px] font-600 text-ink-soft">{identityLine || `@${ctx.user.username}`}</p>
              <div className="mt-[14px] grid max-w-[230px] grid-cols-3 gap-2.5 rail:max-w-[300px]">
                <Figure value={formatCredit(Number(stats?.lifetime ?? 0))} label="Earned" tone="signal" />
                <Figure value={stats?.completed ?? "0"} label="Completed" />
                <Figure value={stats?.rating ? Number(stats.rating).toFixed(1) : "New"} label="Rating" tone={stats?.rating ? "ink" : "soft"} />
              </div>
            </div>
          </div>

          {/* ------------------------------------------ smart vehicle card (358x196, 660x300 on desktop) */}
          {car && stage ? (
            <section className="vehicle-card mt-6" aria-label="Your car">
              <Link href={`/me/vehicles/${car.id}`} className="flex h-12 items-center gap-2.5 px-3.5 pt-1" aria-label={`${car.year} ${car.make} ${car.model}, ${carStatus}. Manage vehicle`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2"><CarIcon size={18} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[14px] leading-[18px] font-700">{car.year} {car.make} {car.model}</span>
                  <span className={`status-text ${carOn ? "" : "is-done"} !text-[11px] !leading-[14px]`}><span aria-hidden className="status-dot" />{carOn ? "Vehicle Ready for Ads" : carStatus}{activeBookings > 0 ? ` · ${activeBookings} active` : ""}</span>
                </span>
                <span className="flex h-11 w-11 items-center justify-center text-ink-soft"><CaretRight size={18} aria-hidden /></span>
              </Link>
              <div className="relative mt-1 h-[160px] overflow-hidden bg-[#090c0e] rail:h-[240px]">
                {stageMedia ? (
                  <>
                    <VehicleStage glbUrl={stage.glbUrl} posterUrl={stage.posterUrl} photos={stage.photos} label={null} fill />
                    {!stage.glbUrl && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[image:var(--tm-scrim)]" aria-hidden />}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-between gap-3 bg-[#151b1e] px-4">
                    <span className="text-[12px] leading-4 text-ink-soft">Vehicle media not available</span>
                    <Link href={stage.scanHref} className="btn btn-sm shrink-0">Scan my car</Link>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="card mt-6 p-[18px]" aria-label="Your car">
              <CarIcon size={48} weight="regular" className="text-ink-2" aria-hidden />
              <p className="mt-3 font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px]">Add your vehicle</p>
              <p className="mt-1 text-[13px] leading-[18px] text-ink-soft">Scan your car to become available for car advertising.</p>
              <Link href="/me/vehicles/scan" className="btn btn-signal mt-4 w-full">Scan my car</Link>
            </section>
          )}
        </div>

        <div className="min-w-0 rail:pt-[22px]">
          {/* ------------------------------------------ your setup */}
          <h2 className="eyebrow mt-6 mb-2.5 rail:mt-0">Your setup</h2>
          <ul className="flex flex-col gap-[9px]" aria-label="Earning setup">
            <li>
              <SurfaceRow
                href="/me/instagram" icon={<InstagramLogo size={26} aria-hidden />}
                title={ig.status === "connected" ? "Instagram Connected" : "Connect Instagram"}
                sub={ig.handle ? `@${ig.handle}` : "Required for Reels and Stories"}
                status={ig.status === "connected" ? "Connected" : ig.status === "pending" ? "Checking" : "Not connected"}
                statusTone={ig.status === "connected" ? "signal" : ig.status === "pending" ? "warning" : "faint"}
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
                href="/activity" icon={<ArrowUpRight size={22} aria-hidden />}
                title="Recent Campaigns"
                sub={Number(stats?.active ?? 0) + Number(stats?.completed ?? 0) > 0 ? `${stats?.active ?? 0} active · ${stats?.completed ?? 0} completed` : "No campaigns yet"}
              />
            </li>
            <li>
              <SurfaceRow
                href="/earnings" icon={<Wallet size={22} aria-hidden />}
                title={available >= minPayout ? "Payout Ready" : "Payout"}
                sub={<><span className="font-700 text-signal">{formatCredit(available)}</span> available</>}
              />
            </li>
            <li>
              <SurfaceRow href="/me/shoots" icon={<Camera size={22} aria-hidden />} title="Your shoots" sub={assignedShoots > 0 ? `${assignedShoots} assigned` : "No shoots assigned"} />
            </li>
          </ul>

        </div>
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

function Figure({ value, label, tone = "ink" }: { value: string; label: string; tone?: "ink" | "signal" | "soft" }) {
  return (
    <div className="min-w-0">
      <p className={`tnum truncate font-display text-[18px] leading-5 font-[780] tracking-[-0.25px] ${tone === "signal" ? "text-signal" : tone === "soft" ? "text-ink-2" : "text-ink"}`}>{value}</p>
      <p className="mt-0.5 text-[10px] leading-3 font-[550] tracking-[0.1px] uppercase text-ink-soft">{label}</p>
    </div>
  );
}
