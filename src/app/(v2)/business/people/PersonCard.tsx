import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { personStats, type Person } from "@/lib/v2/marketplace";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Avatar } from "@/components/v2/ui";

/**
 * One person a business can advertise through. The media is the card: their
 * approved work or portfolio first, else the Instagram picture when that
 * account is connected, else their TapMart picture. Under it: one stat line
 * and the two requests. Nothing else.
 */
export function PersonCard({ person, index = 0, priority = false, nearbyTag = true }: { person: Person; index?: number; priority?: boolean; nearbyTag?: boolean }) {
  const name = person.display_name ?? person.username;
  const media = person.media[0] ?? person.instagram?.avatar_url ?? null;
  const stats = personStats(person);
  const href = `/business/people/${person.username}`;

  return (
    <article className="reveal card overflow-hidden" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
          {media ? (
            <MediaPreview src={media} alt="" className="absolute inset-0 h-full w-full object-cover" priority={priority} sizes="(min-width: 1024px) 20rem, 50vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
              <Avatar src={person.avatar_url} name={name} size={112} />
            </div>
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/5" aria-hidden />
          {nearbyTag && person.same_city && <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">Nearby</span>}
          <div className="absolute inset-x-3.5 bottom-3">
            <h3 className="truncate font-display text-[1.125rem] leading-[1.1] font-800 tracking-[-0.02em] text-ink sm:text-[1.25rem]">
              {name}
              {person.verification === "verified" && <CheckCircle size={18} weight="fill" className="ml-1 inline-block align-[-3px] text-signal" aria-label="Verified" />}
            </h3>
            <p className="mt-0.5 truncate text-[0.8125rem] text-ink-soft sm:text-sm">@{person.username}{person.city ? `, ${person.city}` : ""}</p>
          </div>
        </div>
      </Link>
      <div className="px-3.5 pt-2.5 pb-3.5">
        <div className="min-h-5">
          {stats.map((s) => <p key={s} className="tnum truncate text-[0.8125rem] text-ink-faint sm:text-sm">{s}</p>)}
        </div>
        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href={`${href}?request=story`} className="btn btn-sm !px-2">Request Story</Link>
          <Link href={`${href}?request=reel`} className="btn btn-sm !px-2">Request Reel</Link>
        </div>
      </div>
    </article>
  );
}
