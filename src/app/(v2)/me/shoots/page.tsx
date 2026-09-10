import Link from "next/link";
import { Camera, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { requireV2 } from "@/lib/v2/core";
import { listShootsAssignedTo } from "@/lib/business/shoots";
import { Avatar, Chip } from "@/components/v2/ui";
import { dayLabel, shootTimeLabel } from "@/app/(v2)/business/content/dates";
import { deliveryLabel, shootStatusLabel, shootStatusTone } from "@/app/(v2)/business/content/types";

export const metadata = { title: "Your shoots" };
export const dynamic = "force-dynamic";

/**
 * Content shoots assigned to this person by TapMart. Not marketplace work:
 * nothing here is applied for, and it never appears on Home. Reached from
 * the Profile row only.
 */
export default async function MyShootsPage() {
  const ctx = await requireV2("/me/shoots");
  const shoots = await listShootsAssignedTo(ctx.user.id);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Your shoots</h1>
      <p className="mt-1 text-sm text-ink-soft">Shoots TapMart assigned to you. Upload the files here after each one.</p>

      {shoots.length === 0 ? (
        <div className="mt-8 py-10 text-center">
          <Camera size={40} weight="duotone" className="mx-auto text-ink-soft" aria-hidden />
          <p className="mt-3 text-sm text-ink-soft">No shoots assigned to you yet.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {shoots.map((s, i) => {
            const time = shootTimeLabel(s.starts_at);
            const uploaded = s.photos_uploaded + s.videos_uploaded;
            const delivery = deliveryLabel(s.delivery_status);
            return (
              <li key={s.id} className="reveal" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <Link href={`/me/shoots/${s.id}`} className="flex min-h-16 items-center gap-3 py-3">
                  <Avatar src={s.business_logo_url} name={s.business_name} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[1.0625rem] font-700">{s.business_name}</span>
                    <span className="tnum block truncate text-sm text-ink-soft">
                      {s.scheduled_for ? dayLabel(s.scheduled_for) : "Date to be set"}{time ? ` · ${time}` : ""} · {s.photos_planned} photos · {s.videos_planned} videos
                    </span>
                    <span className="block truncate text-sm text-ink-faint">
                      {delivery ?? "Nothing uploaded yet"}{uploaded > 0 ? ` · ${uploaded} uploaded` : ""}
                    </span>
                  </span>
                  <Chip tone={shootStatusTone(s.status)}>{shootStatusLabel(s.status)}</Chip>
                  <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
