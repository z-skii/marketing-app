import Link from "next/link";
import { CaretRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { compactCount, type Person } from "@/lib/v2/marketplace";
import { isVideoUrl } from "@/lib/v2/opportunities";
import { MediaPreview } from "@/components/v2/MediaPreview";

/**
 * One person a business can advertise through. The portrait is the tile:
 * their best still (approved work or portfolio), else the Instagram picture
 * when that account is connected, else their TapMart photo. Name and handle
 * sit on the picture. Under it: one line (city and one real stat), one
 * filled request, one quiet request. Nothing else, no box around it.
 */
export function PersonCard({ person, index = 0, priority = false }: { person: Person; index?: number; priority?: boolean }) {
  const name = person.display_name ?? person.username;
  const connected = person.instagram?.status === "connected";
  const handle = connected && person.instagram?.handle ? person.instagram.handle.replace(/^@/, "") : person.username;
  // A still reads at a glance; a video's first frame often does not.
  const image = person.media.find((m) => !isVideoUrl(m)) ?? (connected ? person.instagram?.avatar_url : null) ?? person.avatar_url ?? null;
  const stat = connected && person.instagram?.followers != null
    ? `${compactCount(person.instagram.followers)} IG`
    : person.completed_jobs > 0 ? `${person.completed_jobs} ${person.completed_jobs === 1 ? "campaign" : "campaigns"}` : null;
  const line = [person.city, stat].filter(Boolean).join("  ·  ");
  const href = `/business/people/${person.username}`;

  return (
    <article className="card reveal group min-w-0 overflow-hidden" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
          {image ? (
            <MediaPreview src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out can-hover:group-hover:scale-[1.03]" priority={priority} sizes="(min-width: 1024px) 24rem, 50vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-[1.5rem] font-700 text-ink-faint">{name.trim()[0]?.toUpperCase()}</div>
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-1/2" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(7,8,9,0.7),rgba(7,8,9,0))]" aria-hidden />
          <div className="absolute inset-x-3 bottom-3 min-w-0 md:inset-x-4 md:bottom-4">
            <h3 className="truncate font-display text-[1.0625rem] leading-[1.2] font-600 tracking-[-0.01em] text-ink md:text-[1.125rem]">
              {name}
              {person.verification === "verified" && <CheckCircle size={18} weight="fill" className="ml-1 inline-block align-[-3px] text-signal" aria-label="Verified" />}
            </h3>
            <p className="mt-0.5 truncate text-[0.8125rem] text-ink-soft md:text-sm">@{handle}</p>
          </div>
        </div>
      </Link>
      <div className="px-3 pt-2.5 pb-3">
        {line && <p className="tnum truncate text-[0.8125rem] text-ink-soft md:text-sm">{line}</p>}
        <div className={`${line ? "mt-2.5" : ""} flex flex-col gap-0.5`}>
          <Link href={`${href}?request=story`} className="btn btn-signal btn-sm w-full">Request Story</Link>
          <Link href={`${href}?request=reel`} className="link-row justify-center text-sm">Request Reel<CaretRight size={14} weight="bold" aria-hidden /></Link>
        </div>
      </div>
    </article>
  );
}
