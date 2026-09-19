import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles } from "@/lib/v2/opportunities";
import { placementLabel } from "@/components/v2/EarnCards";
import { VerifiedIcon, PlusIcon, ArrowRightIcon, CarIcon } from "@/ds/icons";
import { Badge } from "@/ds/ui";

export const metadata = { title: "My vehicles" };
export const dynamic = "force-dynamic";

/**
 * The person's cars, private to them, in the car language: each vehicle
 * on its own dark stage with its photograph, its verification, whether it
 * is available for ads and what placements it is open to. Campaigns that
 * need a car are found on Home; this is where the car itself lives.
 */
export default async function MyVehiclesPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const vehicles = await getMyVehicles(ctx.user.id);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <div className="ap-head">
        <div><h1>My cars</h1><p className="ap-sub">Your car earns while you drive.</p></div>
        {vehicles.length > 0 && <Link href="/me/vehicles/new" className="btn btn-sm shrink-0"><PlusIcon size={16} aria-hidden />Add a car</Link>}
      </div>

      {vehicles.length === 0 ? (
        <section className="ap-carstage mt-6">
          <div className="ap-carstage-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/cars/wagon-1600.webp" alt="" style={{ objectFit: "contain", padding: "6% 4%" }} fetchPriority="high" />
          </div>
          <p className="ap-carstage-name">Make money with your car.</p>
          <p className="t-meta mt-2 max-w-md">Add your car with a few guided photos. Businesses near you pay monthly for a placement on a door, the rear window or the full side. You keep driving the way you already do.</p>
          <Link href="/me/vehicles/new" className="btn btn-signal btn-lg mt-5">Add your car <ArrowRightIcon size={18} aria-hidden /></Link>
        </section>
      ) : (
        <ul className="mt-5 flex flex-col gap-5">
          {vehicles.map((v, i) => {
            const available = v.status === "listed" && v.available;
            return (
              <li key={v.id}>
                <Link href={`/me/vehicles/${v.id}`} className="ap-carstage block" aria-label={`Manage ${v.year} ${v.make} ${v.model}`}>
                  <div className="ap-carstage-tags">
                    {v.verification === "verified" && <span className="glass-tag is-dark"><VerifiedIcon size={14} weight="fill" aria-hidden />Verified</span>}
                    {v.model_glb_url && <span className="glass-tag is-dark">3D model</span>}
                  </div>
                  <div className="ap-carstage-photo">
                    {v.poster_url ?? v.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(v.poster_url ?? v.photo_url) as string} alt="" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
                    ) : (
                      <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--env-on-dark-muted)" }}><CarIcon size={40} aria-hidden /></span>
                    )}
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="ap-carstage-name" style={{ marginTop: 0 }}>{v.year} {v.make} {v.model}</p>
                      <p className="t-meta mt-1 truncate">{v.zones.length > 0 ? v.zones.map(placementLabel).join(" · ") : "No placements marked available"}</p>
                    </div>
                    <Badge tone={available ? "success" : "neutral"} dot className="shrink-0">{v.status === "listed" ? (v.available ? "Available for ads" : "Paused") : "Not listed"}</Badge>
                  </div>
                  <span className="btn btn-glass is-dark btn-sm mt-4">Manage <ArrowRightIcon size={14} aria-hidden /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
