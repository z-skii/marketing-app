import Link from "next/link";
import { CheckCircle, Star } from "@phosphor-icons/react/dist/ssr";
import { compactCount, type Person } from "@/lib/v2/marketplace";
import { isVideoUrl } from "@/lib/v2/opportunities";
import { MediaPreview } from "@/components/v2/MediaPreview";

/**
 * The person marketplace card from OpenAI's Business Home design: a 4:5
 * portrait with the Instagram chip and the rating chip on top, the name
 * and one metadata line over the bottom scrim, and a 60px split action
 * footer: Story (primary) and Reel (secondary). The media opens the
 * person; the segments start the direct request.
 */
export function PersonCard({ person, index = 0, priority = false }: { person: Person; index?: number; priority?: boolean }) {
  const name = person.display_name ?? person.username;
  const connected = person.instagram?.status === "connected";
  const handle = connected && person.instagram?.handle ? person.instagram.handle.replace(/^@/, "") : person.username;
  const image = person.media.find((m) => !isVideoUrl(m)) ?? (connected ? person.instagram?.avatar_url : null) ?? person.avatar_url ?? null;
  const followers = connected && person.instagram?.followers != null ? `${compactCount(person.instagram.followers)} IG` : null;
  const meta = [`@${handle}`, person.city, person.completed_jobs > 0 ? `${person.completed_jobs} done` : null].filter(Boolean).join(" · ");
  const href = `/business/people/${person.username}`;

  return (
    <article className="card reveal min-w-0 overflow-hidden" style={{ animationDelay: `${Math.min(index, 5) * 35}ms` }}>
      <Link href={href} className="block" aria-label={`${name}, open profile`}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#151b1e]">
          {image ? (
            <MediaPreview src={image} alt="" className="absolute inset-0 h-full w-full object-cover" priority={priority} sizes="(min-width: 1024px) 260px, 50vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface-2 font-display text-[28px] font-[760] text-ink">{name.trim()[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-[image:var(--tm-scrim)]" aria-hidden />
          <span className={`glass-tag is-glass absolute top-2.5 left-2.5 ${followers ? "" : "!text-ink-soft"}`}>{followers ?? "Not connected"}</span>
          {person.rating_avg != null && (
            <span className="glass-tag is-glass absolute top-2.5 right-2.5"><Star size={11} weight="fill" aria-hidden />{person.rating_avg.toFixed(1)}</span>
          )}
          <div className="absolute inset-x-3 bottom-3 min-w-0">
            <p className="truncate font-display text-[15px] leading-[19px] font-[800] tracking-[-0.15px] text-ink">
              {name}
              {person.verification === "verified" && <CheckCircle size={16} weight="fill" className="ml-1 inline-block align-[-3px] text-signal" aria-label="Verified" />}
            </p>
            <p className="truncate text-[12px] leading-4 text-ink-2">{meta}</p>
          </div>
        </div>
      </Link>
      <div className="flex h-[60px] items-center gap-1 px-2">
        <Link href={`${href}?request=story`} className="btn btn-signal h-11 min-h-11 flex-1 rounded-[14px] px-2 !text-[13px] shadow-none" aria-label={`Request a Story from ${name}`}>Story</Link>
        <Link href={`${href}?request=reel`} className="btn h-11 min-h-11 flex-1 rounded-[14px] border-rule px-2 !text-[13px]" aria-label={`Request a Reel from ${name}`}>Reel</Link>
      </div>
    </article>
  );
}
