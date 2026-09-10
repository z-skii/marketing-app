import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
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
  const line = stat ?? person.city ?? null;
  const href = `/business/people/${person.username}`;

  return (
    <article className="card reveal group min-w-0 overflow-hidden" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <Link href={href} className="block">
        <div className="relative h-[215px] w-full overflow-hidden bg-surface-2 lg:h-[260px]">
          {image ? (
            <MediaPreview src={image} alt="" className="hero-media absolute inset-0 h-full w-full object-cover" priority={priority} sizes="(min-width: 1024px) 24rem, 50vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-[24px] font-[760] text-ink-faint">{name.trim()[0]?.toUpperCase()}</div>
          )}
          <div className="media-scrim absolute inset-0" aria-hidden />
          <div className="absolute inset-x-4 bottom-[15px] z-[2] min-w-0">
            <h3 className="mb-1 truncate font-display text-[16px] leading-[1.15] font-[760] tracking-[-0.6px] text-ink">
              {name}
              {person.verification === "verified" && <CheckCircle size={14} weight="fill" className="ml-1 inline-block align-[-2px] text-signal" aria-label="Verified" />}
            </h3>
            <p className="truncate text-[13px] text-meta">@{handle}{line ? ` · ${line}` : ""}</p>
          </div>
        </div>
      </Link>
      <div className="flex h-[52px] items-center gap-2 px-2">
        <Link href={`${href}?request=story`} className="pill h-[36px] flex-1 justify-center !text-ink" aria-label={`Request a Story from ${name}`}>Story</Link>
        <Link href={`${href}?request=reel`} className="pill h-[36px] flex-1 justify-center !text-ink" aria-label={`Request a Reel from ${name}`}>Reel</Link>
      </div>
    </article>
  );
}
