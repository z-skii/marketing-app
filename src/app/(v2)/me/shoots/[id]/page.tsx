import { notFound } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { requireV2 } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getShootById } from "@/lib/business/shoots";
import { canUploadToShoot, listShootDeliverables } from "@/lib/business/deliverables";
import { Chip } from "@/components/v2/ui";
import { dayLabel, longDayLabel, shootTimeLabel } from "@/app/(v2)/business/content/dates";
import { shootStatusLabel, shootStatusTone } from "@/app/(v2)/business/content/types";
import { ShootUploader } from "./ShootUploader";

export const metadata = { title: "Shoot" };
export const dynamic = "force-dynamic";

/**
 * One assigned shoot for the creator: what was planned, what has been
 * uploaded, the uploader, and the button that says it is delivered. Only
 * the assigned verified creator or an admin can open it; everyone else
 * gets a 404, and every action checks again.
 */
export default async function MyShootPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireV2("/me/shoots"), params]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const allowed = await canUploadToShoot(id, { id: ctx.user.id, role: ctx.user.role });
  if (!allowed) notFound();
  const shoot = await getShootById(id);
  if (!shoot || shoot.status === "cancelled") notFound();

  const [business, files] = await Promise.all([
    sqlOne<{ name: string; address: string | null; city: string | null }>(`select name, address, city from businesses where id = $1`, [shoot.business_id]),
    listShootDeliverables(shoot.id),
  ]);
  const time = shootTimeLabel(shoot.starts_at);
  const delivered = shoot.delivery_status === "delivered";
  const where = [business?.address, business?.city].filter(Boolean).join(", ");

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me/shoots" label="Your shoots" />
      <p className="mt-3 text-sm text-ink-faint">{business?.name ?? "Business"}</p>
      <h1 className="font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2rem]">
        {shoot.scheduled_for ? longDayLabel(shoot.scheduled_for) : "Date to be set"}
        {time && <span className="text-ink-soft"> · {time}</span>}
      </h1>
      <p className="mt-1.5 text-sm text-ink-faint">
        {shoot.scheduled_for ? dayLabel(shoot.scheduled_for) : ""}{where ? `${shoot.scheduled_for ? " · " : ""}${where}` : ""}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="tnum font-display text-[1.0625rem] leading-tight font-700">{shoot.photos_planned} photos · {shoot.videos_planned} videos</p>
        <Chip tone={shootStatusTone(shoot.status)}>{delivered ? "Delivered" : shootStatusLabel(shoot.status)}</Chip>
      </div>
      {shoot.notes && <p className="mt-3 text-sm whitespace-pre-wrap text-ink-soft">{shoot.notes}</p>}

      {delivered && (
        <p className="mt-4 flex items-center gap-1.5 text-sm font-600 text-rise">
          <CheckCircle size={18} weight="fill" aria-hidden />Delivered. The business has been told.
        </p>
      )}

      <section className="mt-8" aria-labelledby="uploads-title">
        <h2 id="uploads-title" className="eyebrow">Your uploads</h2>
        <ShootUploader shootId={shoot.id} initial={files} delivered={delivered} />
      </section>
    </main>
  );
}
