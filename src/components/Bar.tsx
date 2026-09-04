import Link from "next/link";
import type { BarRow } from "@/lib/data";
import { OpenArrowIcon } from "@/components/icons";

/**
 * THE BAR — a continuously moving tape of live links.
 *
 * The track is duplicated and translated by exactly -50%, which makes the loop
 * seamless without JavaScript. Only the first copy carries real links; the
 * duplicate is hidden from assistive tech so the list is announced once rather
 * than endlessly. Hover or keyboard focus pauses the tape, and reduced-motion
 * users get a plain horizontal scroller instead (see globals.css).
 *
 * Every ninth entry rides as a "feature": name over domain on a deeper ground,
 * so the tape reads like broadcast programming rather than a stock ticker. On
 * the live screen (`docked={false}`) the Bar sits in the page grid and can
 * carry the Surprise Me control at its right edge.
 */
export function Bar({
  items,
  docked = true,
  surprise,
}: {
  items: BarRow[];
  docked?: boolean;
  surprise?: React.ReactNode;
}) {
  if (items.length === 0) {
    if (docked) return null;
    return (
      <aside className="border-t border-ink bg-surface" aria-label="The Bar">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <p className="font-mono text-[0.75rem] tracking-tight text-ink-soft">
            Your link could be here.
          </p>
          <Link href="/add" className="eyebrow !text-signal underline underline-offset-4">
            Add yours
          </Link>
        </div>
      </aside>
    );
  }

  // Constant perceived speed: ~2.2s of travel per entry.
  const duration = Math.max(30, Math.round(items.length * 2.2));

  const track = (copy: "primary" | "echo") =>
    items.map((item, index) => {
      const feature = index % 9 === 4;
      return (
        <Link
          key={`${copy}-${item.link_id}`}
          href={item.placement_id ? `/go/${item.placement_id}?s=bar` : `/x/${item.slug}?s=bar`}
          rel="nofollow sponsored noopener"
          target="_blank"
          tabIndex={copy === "echo" ? -1 : undefined}
          className={`group flex shrink-0 items-center gap-2 border-r border-rule px-4 transition-colors hover:bg-ink hover:text-paper ${
            feature ? "bar-feature py-1.5" : "py-2.5 md:py-3"
          }`}
        >
          <OpenArrowIcon className="text-signal transition-colors group-hover:text-paper" />
          {feature ? (
            <span className="flex flex-col whitespace-nowrap">
              <span className="font-display text-[0.75rem] leading-tight font-700 tracking-[-0.02em] md:text-[0.8125rem]">
                {item.display_name}
              </span>
              <span translate="no" className="font-mono text-[0.625rem] leading-tight text-ink-faint group-hover:text-paper/70">
                {item.domain}
              </span>
            </span>
          ) : (
            <span translate="no" className="font-mono text-[0.6875rem] tracking-tight whitespace-nowrap md:text-[0.75rem]">
              {item.domain}
            </span>
          )}
        </Link>
      );
    });

  const tape = (
    <div className="tape relative min-w-0 flex-1 overflow-hidden">
      {/* Edge fades hint that the tape continues past the viewport. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-surface to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface to-transparent"
      />
      <div className="tape-track" style={{ ["--tape-duration" as string]: `${duration}s` }}>
        <div className="flex shrink-0 items-center">{track("primary")}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {track("echo")}
        </div>
      </div>
    </div>
  );

  if (docked) {
    return (
      <aside
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-surface"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label={`The Bar: ${items.length} live links`}
      >
        {tape}
      </aside>
    );
  }

  return (
    <aside
      className="flex items-stretch border-t border-ink bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label={`The Bar: ${items.length} live links`}
    >
      {tape}
      {surprise}
    </aside>
  );
}
