import Link from "next/link";
import { Camera, MapPin, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import type { ContentShoot } from "@/lib/business/shoots";
import { EmptyCard } from "./EmptyCard";
import { longDayLabel, shootTimeLabel } from "./dates";

/**
 * This month's shoot as one appointment: the date big, the time, a calendar
 * tile, where, what is planned, and one way in. Built from the shoot row
 * only; a shoot has no picture until it has happened.
 */
export function ShootCard({ shoot, subscribed, location, primary }: { shoot: ContentShoot | null; subscribed: boolean; location: string; primary: boolean }) {
  if (!subscribed) {
    return (
      <EmptyCard
        icon={<Camera size={22} aria-hidden />} title="No shoot booked" copy="A monthly shoot comes with a TapMart plan."
        action={<Link href="/business/plan" className="btn btn-signal w-full">View plans</Link>}
      />
    );
  }
  if (!shoot || !shoot.scheduled_for) {
    return <EmptyCard icon={<Camera size={22} aria-hidden />} title="No shoot booked" copy="Your monthly shoot is being scheduled. It appears here once the date is set." />;
  }

  const booked = shoot.status === "scheduled";
  const time = shootTimeLabel(shoot.starts_at);
  const day = new Date(`${shoot.scheduled_for}T00:00:00Z`);
  const month = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(day);
  const dayNo = day.getUTCDate();

  return (
    <article className="card reveal p-4">
      <div className="flex h-[34px] items-start justify-between">
        <span className={`status-text ${booked ? "" : "is-warning"}`}><span aria-hidden className="status-dot" />{booked ? "Booked" : "Being scheduled"}</span>
        <span className="glass-tag">Monthly shoot</span>
      </div>
      <div className="mt-1 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[34px] leading-[38px] font-[850] tracking-[-0.8px]">{longDayLabel(shoot.scheduled_for)}</p>
          <p className="mt-1 font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px] text-ink-2">{time ?? "Time to be set"}</p>
        </div>
        <div aria-hidden className="flex h-[92px] w-[82px] shrink-0 flex-col items-center rounded-[18px] bg-[#171d20] pt-3.5 rail:h-[98px] rail:w-[88px]">
          <span className="eyebrow !text-[12px] !leading-[14px] !tracking-[1px]">{month}</span>
          <span className="tnum mt-1 font-display text-[34px] leading-9 font-[850]">{dayNo}</span>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 truncate text-[12px] leading-4 text-ink-soft"><MapPin size={16} aria-hidden className="shrink-0" />{location}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] leading-[17px] font-600 text-ink-2">
        <Camera size={15} aria-hidden /><VideoCamera size={15} aria-hidden className="ml-0.5" />
        <span className="tnum">{shoot.photos_planned} photos · {shoot.videos_planned} videos</span>
      </p>
      <Link href={`/business/content/shoots/${shoot.id}`} className={`btn ${primary ? "btn-signal shadow-none" : ""} mt-4 w-full`}>Open shoot</Link>
    </article>
  );
}
