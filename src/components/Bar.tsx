import Link from "next/link";
import type { BarRow } from "@/lib/data";

/**
 * THE BAR — a continuously moving tape of live links, fixed to the bottom of
 * the viewport.
 *
 * The track is duplicated and translated by exactly -50%, which makes the loop
 * seamless without JavaScript. Only the first copy carries real links; the
 * duplicate is hidden from assistive tech so the list is announced once rather
 * than endlessly. Hover or keyboard focus pauses the tape, and reduced-motion
 * users get a plain horizontal scroller instead (see globals.css).
 */
export function Bar({ items }: { items: BarRow[] }) {
  if (items.length === 0) return null;

  // Constant perceived speed: ~2.2s of travel per entry.
  const duration = Math.max(30, Math.round(items.length * 2.2));

  const track = (copy: "primary" | "echo") =>
    items.map((item) => (
      <Link
        key={`${copy}-${item.placement_id}`}
        href={`/go/${item.placement_id}`}
        rel="nofollow sponsored noopener"
        target="_blank"
        tabIndex={copy === "echo" ? -1 : undefined}
        className="group flex shrink-0 items-center gap-2 border-r border-rule px-4 py-3 transition-colors hover:bg-ink hover:text-paper"
      >
        <span aria-hidden="true" className="text-signal transition-colors group-hover:text-paper">
          ↗
        </span>
        <span translate="no" className="font-mono text-[0.75rem] tracking-tight whitespace-nowrap">
          {item.domain}
        </span>
      </Link>
    ));

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label={`The Bar — ${items.length} live links`}
    >
      <div className="tape relative overflow-hidden">
        {/* Edge fades hint that the tape continues past the viewport. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-surface to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface to-transparent"
        />
        <div
          className="tape-track"
          style={{ ["--tape-duration" as string]: `${duration}s` }}
        >
          <div className="flex shrink-0">{track("primary")}</div>
          <div className="flex shrink-0" aria-hidden="true">
            {track("echo")}
          </div>
        </div>
      </div>
    </aside>
  );
}
