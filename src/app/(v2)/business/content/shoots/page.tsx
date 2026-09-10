import { Camera } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { listShoots } from "@/lib/business/shoots";
import { StatusChip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { dayLabel } from "../dates";

export const metadata = { title: "Shoots" };
export const dynamic = "force-dynamic";

/**
 * Every content shoot for the business, newest first. Who goes and whether
 * it happened is decided by an admin, so this screen only shows what is
 * booked and what came back from it.
 */
export default async function ShootsPage() {
  const ctx = await requireBusinessContext("/business/content/shoots");
  const business = ctx.activeBusiness;
  const shoots = await listShoots(business.id, 24);

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
            const delivered = s.deliverable_urls.length;
            return (
              <li key={s.id} className="reveal py-4" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[1.375rem] leading-none font-800 tracking-[-0.03em]">
                      {s.scheduled_for ? dayLabel(s.scheduled_for) : "Date to be set"}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-soft">
                      {s.photos_planned} photos · {s.videos_planned} short videos
                      {delivered > 0 && <span className="text-ink"> · {delivered} delivered</span>}
                    </p>
                    {s.assigned_label && <p className="mt-0.5 truncate text-sm text-ink-faint">with {s.assigned_label}</p>}
                  </div>
                  <StatusChip status={s.status} />
                </div>
                {delivered > 0 && (
                  <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8" aria-label={`${delivered} delivered files`}>
                    {s.deliverable_urls.map((url) => (
                      <span key={url} className="block h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                        <MediaPreview src={url} alt="" className="h-full w-full object-cover" sizes="96px" />
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
