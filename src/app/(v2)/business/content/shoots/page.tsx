import Link from "next/link";
import { Camera, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { listShoots } from "@/lib/business/shoots";
import { listDeliverables, type Deliverable } from "@/lib/business/deliverables";
import { Chip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { dayLabel, shootTimeLabel } from "../dates";
import { deliveryLabel, shootStatusLabel, shootStatusTone } from "../types";

export const metadata = { title: "Shoots" };
export const dynamic = "force-dynamic";

/**
 * Every content shoot for the business, newest first. Who goes and whether
 * it happened is decided by an admin; what came back was uploaded by the
 * assigned verified creator. This screen only shows what is booked and
 * what was delivered.
 */
export default async function ShootsPage() {
  const ctx = await requireBusinessContext("/business/content/shoots");
  const business = ctx.activeBusiness;
  const [shoots, files] = await Promise.all([listShoots(business.id, 24), listDeliverables(business.id, { limit: 500 })]);
  const byShoot = new Map<string, Deliverable[]>();
  for (const f of files) byShoot.set(f.shoot_id, [...(byShoot.get(f.shoot_id) ?? []), f]);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/content" label="Content" />
      <p className="mt-3 text-sm text-ink-faint">{business.name}</p>
      <h1 className="font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Shoots</h1>

      {shoots.length === 0 ? (
        <div className="mt-8 py-10 text-center">
          <Camera size={40} weight="duotone" className="mx-auto text-ink-soft" aria-hidden />
          <p className="mt-3 text-sm text-ink-soft">Shoots appear here once your plan books one.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {shoots.map((s, i) => {
            const delivered = byShoot.get(s.id) ?? [];
            const time = shootTimeLabel(s.starts_at);
            const delivery = deliveryLabel(s.delivery_status);
            return (
              <li key={s.id} className="reveal py-4" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[1.375rem] leading-none font-800 tracking-[-0.03em]">
                      {s.scheduled_for ? dayLabel(s.scheduled_for) : "Date to be set"}
                      {time && <span className="text-ink-soft"> · {time}</span>}
                    </p>
                    <p className="tnum mt-1.5 text-sm text-ink-soft">
                      {s.photos_planned} photos · {s.videos_planned} videos
                      {delivered.length > 0 && <span className="text-ink"> · {delivered.length} delivered</span>}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-ink-faint">{s.assigned_label ?? "TapMart team"}{delivery ? ` · ${delivery}` : ""}</p>
                  </div>
                  <Chip tone={shootStatusTone(s.status)}>{shootStatusLabel(s.status)}</Chip>
                </div>
                {delivered.length > 0 && (
                  <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8" aria-label={`${delivered.length} delivered files`}>
                    {delivered.slice(0, 12).map((f) => (
                      <span key={f.id} className="block h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                        <MediaPreview src={f.url} poster={f.thumbnail_url} alt="" className="h-full w-full object-cover" sizes="96px" />
                      </span>
                    ))}
                  </div>
                )}
                <Link href={`/business/content/shoots/${s.id}`} className="link-row">View shoot<CaretRight size={16} aria-hidden /></Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
