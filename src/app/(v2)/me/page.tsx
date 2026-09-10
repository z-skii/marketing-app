import Link from "next/link";
import { Gear, CaretRight, CheckCircle, InstagramLogo, Car as CarIcon, Wallet } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles } from "@/lib/v2/opportunities";
import { countShootsAssignedTo } from "@/lib/business/shoots";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { Avatar } from "@/components/v2/ui";
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

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <section className="min-w-0">
          {/* ------------------------------------------------------ header */}
          <div className="flex items-center gap-4">
            <Avatar src={ctx.avatarUrl} name={name} size={72} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2rem]">
                {name}
                {ctx.isVerified && <CheckCircle size={22} weight="fill" className="ml-2 inline-block align-[-3px] text-signal" aria-label="Verified" />}
              </h1>
              <p className="mt-1.5 truncate text-sm text-ink-faint">@{ctx.user.username}{ctx.city ? ` · ${ctx.city}` : ""}</p>
            </div>
            <Link href="/me/settings" aria-label="Settings" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink">
              <Gear size={22} aria-hidden />
            </Link>
          </div>

          {/* ------------------------------------------------- the numbers */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Figure value={formatCredit(Number(stats?.lifetime ?? 0))} label="Earned" tone="signal" />
            <Figure value={stats?.completed ?? "0"} label="Completed" />
            <Figure value={stats?.rating ? Number(stats.rating).toFixed(1) : "New"} label="Rating" />
          </div>

          {/* ----------------------------------------------------- your car */}
          <section className="mt-9" aria-labelledby="car-title">
            <div className="flex items-baseline justify-between">
              <h2 id="car-title" className="eyebrow">Your car</h2>
              {car && <Link href={`/me/vehicles/${car.id}`} className="link-row text-sm">Manage<CaretRight size={16} aria-hidden /></Link>}
            </div>
            {car && stage ? (
              <div className="mt-3">
                <VehicleStage glbUrl={stage.glbUrl} posterUrl={stage.posterUrl} photos={stage.photos} label={stage.label} />
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[1.5rem] leading-none font-800 tracking-[-0.03em]">{car.year} {car.make} {car.model}</p>
                    <p className={`mt-2 flex items-center gap-1.5 text-sm ${car.status === "listed" && car.available ? "text-signal" : "text-ink-faint"}`}>
                      {car.status === "listed" && car.available ? <><CheckCircle size={16} weight="fill" aria-hidden />Available for ads</> : car.status === "listed" ? "Paused" : "Not listed yet"}
                      {activeBookings > 0 && <span className="text-ink-soft"> · {activeBookings} active campaign{activeBookings === 1 ? "" : "s"}</span>}
                    </p>
                  </div>
                  {stage.scanHint && <Link href={stage.scanHref} className="btn btn-sm shrink-0">{stage.scanHint}</Link>}
                </div>
              </div>
            ) : (
              <div className="relative mt-3 overflow-hidden rounded-[var(--radius-card)] bg-[radial-gradient(ellipse_at_50%_90%,_var(--color-surface-2),_var(--color-paper)_70%)] px-5 py-8 md:px-8 md:py-10">
                <CarIcon size={56} weight="duotone" className="text-ink-soft" aria-hidden />
                <p className="mt-4 max-w-sm font-display text-[1.5rem] leading-[1.05] font-800 tracking-[-0.03em]">Make money with your car</p>
                <p className="mt-2 max-w-xs text-sm text-ink-soft">Scan it once. Car campaigns near you show whether it qualifies.</p>
                <Link href="/me/vehicles/scan" className="btn btn-signal btn-lg mt-5">Scan my car</Link>
              </div>
            )}
          </section>

          {/* ------------------------------------------------ earning setup */}
          <section className="mt-9" aria-label="Earning setup">
            <h2 className="eyebrow">Earning setup</h2>
            <ul className="mt-2 divide-y divide-rule">
              <SetupRow
                href="/me/instagram"
                icon={<InstagramLogo size={22} aria-hidden />}
                title="Instagram"
                value={ig.status === "connected" ? `@${ig.handle}` : ig.status === "pending" ? `@${ig.handle} · Checking` : "Not connected"}
                on={ig.status === "connected"}
                sub={ig.status === "connected" && ig.followers ? `${ig.followers.toLocaleString()} followers` : "For Story campaigns"}
              />
              <SetupRow
                href="/earnings"
                icon={<Wallet size={22} aria-hidden />}
                title="Payout"
                value={available >= minPayout ? `${formatCredit(available)} ready` : available > 0 ? `${formatCredit(available)} available` : "Nothing yet"}
                on={available >= minPayout}
                sub={available >= minPayout ? "Request it from Earnings" : `Payouts start at ${formatCredit(minPayout)}`}
              />
            </ul>
          </section>

          {/* ---------------------------------------------------- activity */}
          <section className="mt-9" aria-label="My activity">
            <h2 className="eyebrow">My activity</h2>
            <ul className="mt-2 divide-y divide-rule">
              <Row href="/activity" title="In progress" value={String(stats?.active ?? 0)} />
              <Row href="/activity?tab=submitted" title="Waiting on review" />
              <Row href="/earnings" title="Payments" />
              <Row href="/activity?tab=saved" title="Saved" value={String(stats?.saved ?? 0)} />
              <Row href={`/u/${ctx.user.username}`} title="Public profile and reviews" />
              {assignedShoots > 0 && <Row href="/me/shoots" title={`Your shoots · ${assignedShoots} assigned`} />}
            </ul>
          </section>
        </section>

        {/* ------------------------------------------------- identity rail */}
        <aside className="mt-10 lg:mt-0">
          <h2 className="eyebrow">Use TapMart as</h2>
          <div className="mt-2">
            <IdentitySwitcher identities={identities} canAddBusiness />
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

function Figure({ value, label, tone = "ink" }: { value: string; label: string; tone?: "ink" | "signal" }) {
  return (
    <div className="min-w-0">
      <p className={`tnum truncate font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] ${tone === "signal" ? "text-signal" : "text-ink"}`}>{value}</p>
      <p className="mt-1.5 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function SetupRow({ href, icon, title, value, sub, on }: { href: string; icon: React.ReactNode; title: string; value: string; sub?: string; on: boolean }) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-3 py-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${on ? "bg-signal text-signal-ink" : "bg-surface-2 text-ink-soft"}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[1.0625rem] font-700">{title} <span className={`font-600 ${on ? "text-signal" : "text-ink-soft"}`}>· {value}</span></span>
          {sub && <span className="block truncate text-sm text-ink-faint">{sub}</span>}
        </span>
        <CaretRight size={18} className="text-ink-faint" aria-hidden />
      </Link>
    </li>
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
