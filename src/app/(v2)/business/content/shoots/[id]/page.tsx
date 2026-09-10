import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretRight, CheckCircle, Play } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { getShoot } from "@/lib/business/shoots";
import { listDeliverables } from "@/lib/business/deliverables";
import { Chip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { dayLabel, longDayLabel, shootTimeLabel } from "../../dates";
import { deliverableStatusLabel, deliverableStatusTone, deliveryLabel, shootStatusLabel, shootStatusTone } from "../../types";

export const metadata = { title: "Shoot" };
export const dynamic = "force-dynamic";

/**
 * One content shoot: when, what is planned, who is coming, and every file
 * that came back with its state. Booking and status stay with the admin;
 * approving and scheduling happen on the Content tab.
 */
export default async function ShootPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireBusinessContext("/business/content"), params]);
  const business = ctx.activeBusiness;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const shoot = await getShoot(id, business.id);
  if (!shoot) notFound();

  const files = await listDeliverables(business.id, { shootId: shoot.id, limit: 500 });
  const photos = files.filter((f) => f.kind === "photo").length;
  const videos = files.length - photos;
  const time = shootTimeLabel(shoot.starts_at);
  const delivery = deliveryLabel(shoot.delivery_status);
  const uploader = files.find((f) => f.uploader_name);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/content" label="Content" />
      <p className="mt-3 text-sm text-ink-faint">{business.name}</p>
      <h1 className="font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2rem]">
        {shoot.scheduled_for ? longDayLabel(shoot.scheduled_for) : "Date to be set"}
        {time && <span className="text-ink-soft"> · {time}</span>}
      </h1>
      {shoot.scheduled_for && <p className="mt-1.5 text-sm text-ink-faint">{dayLabel(shoot.scheduled_for)}</p>}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="tnum font-display text-[1.0625rem] leading-tight font-700">{shoot.photos_planned} photos · {shoot.videos_planned} videos</p>
          <p className="mt-0.5 truncate text-sm text-ink-soft">{shoot.assigned_label ?? "TapMart team"}{delivery ? ` · ${delivery}` : ""}</p>
        </div>
        <Chip tone={shootStatusTone(shoot.status)}>{shootStatusLabel(shoot.status)}</Chip>
      </div>
      {shoot.notes && <p className="mt-3 text-sm whitespace-pre-wrap text-ink-soft">{shoot.notes}</p>}

      <section className="mt-9" aria-labelledby="deliverables-title">
        <h2 id="deliverables-title" className="eyebrow">Deliverables</h2>
        {files.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            {shoot.status === "done" ? "Nothing was uploaded for this shoot." : "Deliverables appear here after the shoot."}
          </p>
        ) : (
          <>
            <p className="tnum mt-2 text-sm text-ink-soft">
              {[photos > 0 && `${photos} ${photos === 1 ? "photo" : "photos"}`, videos > 0 && `${videos} ${videos === 1 ? "video" : "videos"}`].filter(Boolean).join(" · ")}
            </p>
            <ul className="mt-3 grid grid-cols-3 gap-1" aria-label="Delivered files">
              {files.map((f, i) => (
                <li key={f.id} className="reveal relative aspect-square overflow-hidden rounded-[10px] bg-surface-2" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                  <MediaPreview src={f.url} poster={f.thumbnail_url} alt="" className="h-full w-full object-cover" sizes="(min-width: 768px) 224px, 33vw" />
                  <span className="glass-tag absolute top-1.5 left-1.5">
                    <Chip tone={deliverableStatusTone(f.status, f.edit_note)}>{deliverableStatusLabel(f.status, f.edit_note)}</Chip>
                  </span>
                  {f.kind === "video" && (
                    <span className="glass-tag absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full text-ink" aria-hidden>
                      <Play size={14} weight="fill" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {uploader && (
              <p className="mt-3 text-sm text-ink-soft">
                Uploaded by <span className="font-600 text-ink">{uploader.uploader_name}</span>
                {uploader.uploader_verified && (
                  <>
                    {" "}<CheckCircle size={16} weight="fill" className="inline-block align-[-3px] text-signal" aria-hidden />
                    {" "}Verified TapMart Creator
                  </>
                )}
              </p>
            )}
            <Link href="/business/content" className="link-row mt-2">Approve and schedule on Content<CaretRight size={16} aria-hidden /></Link>
          </>
        )}
      </section>

      <Link href="/business/content/shoots" className="link-row mt-6">All shoots<CaretRight size={16} aria-hidden /></Link>
    </main>
  );
}
