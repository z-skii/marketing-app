import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { getShoot } from "@/lib/business/shoots";
import { Chip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { dayLabel, longDayLabel } from "../../dates";
import { isVideoUrl, shootStatusLabel, shootStatusTone } from "../../types";

export const metadata = { title: "Shoot" };
export const dynamic = "force-dynamic";

/**
 * One content shoot: when, what is planned, who is coming, and what came
 * back from it. Booking and status stay with the admin; this screen shows.
 */
export default async function ShootPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireBusinessContext("/business/content"), params]);
  const business = ctx.activeBusiness;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const shoot = await getShoot(id, business.id);
  if (!shoot) notFound();

  const files = shoot.deliverable_urls;
  const photos = files.filter((u) => !isVideoUrl(u)).length;
  const videos = files.length - photos;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/content" label="Content" />
      <p className="mt-3 text-sm text-ink-faint">{business.name}</p>
      <h1 className="font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2rem]">
        {shoot.scheduled_for ? longDayLabel(shoot.scheduled_for) : "Date to be set"}
      </h1>
      {shoot.scheduled_for && <p className="mt-1.5 text-sm text-ink-faint">{dayLabel(shoot.scheduled_for)}</p>}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[1.0625rem] leading-tight font-700">{shoot.photos_planned} photos · {shoot.videos_planned} short videos</p>
          <p className="mt-0.5 truncate text-sm text-ink-soft">{shoot.assigned_label ?? "TapMart team"}</p>
        </div>
        <Chip tone={shootStatusTone(shoot.status)}>{shootStatusLabel(shoot.status)}</Chip>
      </div>
      {shoot.notes && <p className="mt-3 text-sm whitespace-pre-wrap text-ink-soft">{shoot.notes}</p>}

      <section className="mt-9" aria-labelledby="deliverables-title">
        <h2 id="deliverables-title" className="eyebrow">Deliverables</h2>
        {files.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Deliverables appear here after the shoot.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              {[photos > 0 && `${photos} ${photos === 1 ? "photo" : "photos"}`, videos > 0 && `${videos} ${videos === 1 ? "video" : "videos"}`].filter(Boolean).join(" · ")}
            </p>
            <ul className="mt-3 grid grid-cols-3 gap-1" aria-label="Delivered files">
              {files.map((url, i) => (
                <li key={url} className="reveal aspect-square overflow-hidden rounded-[10px] bg-surface-2" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                  <MediaPreview src={url} alt="" className="h-full w-full object-cover" sizes="(min-width: 768px) 224px, 33vw" />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <Link href="/business/content/shoots" className="link-row mt-6">All shoots<CaretRight size={16} aria-hidden /></Link>
    </main>
  );
}
