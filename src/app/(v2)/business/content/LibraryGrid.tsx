"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, X } from "@phosphor-icons/react";
import { Chip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { FilterBar } from "@/components/v2/FilterBar";
import { contentStatusLabel, contentStatusTone, type LibraryItem } from "./types";

type Filter = "all" | "photos" | "videos" | "scheduled" | "published";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "photos", label: "Photos" },
  { key: "videos", label: "Videos" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

function matches(item: LibraryItem, filter: Filter): boolean {
  switch (filter) {
    case "photos": return item.kind === "photo";
    case "videos": return item.kind === "video";
    case "scheduled": return item.postStatus === "scheduled";
    case "published": return item.postStatus === "published";
    default: return true;
  }
}

/**
 * Every file the business has to post with, as a square grid with one
 * filter row. The filter is page state, so the FilterBar's links are
 * intercepted here rather than navigating.
 */
export function LibraryGrid({ items }: { items: LibraryItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shown = useMemo(() => items.filter((i) => matches(i, filter)), [items, filter]);
  const open = openIndex == null ? null : shown[openIndex] ?? null;

  const filters = FILTERS.map((f) => ({ ...f, href: `/business/content?library=${f.key}` }));

  return (
    <div>
      <div
        className="mt-3"
        onClickCapture={(e) => {
          const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-key]");
          if (!link) return;
          e.preventDefault();
          e.stopPropagation();
          setFilter((link.dataset.key as Filter) ?? "all");
          setOpenIndex(null);
        }}
      >
        <FilterBar items={filters} active={filter} label="Library filter" />
      </div>

      {shown.length === 0 ? (
        <p className="mt-3 py-4 text-sm text-ink-soft">
          {items.length === 0 ? "Photos and videos land here after your first shoot or post." : "Nothing in the library matches that yet."}
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-1 min-[360px]:grid-cols-3" aria-label="Media">
          {shown.map((item, i) => (
            <li key={item.url} className="reveal" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`${item.kind === "video" ? "Video" : "Photo"}, ${item.source}`}
                className="relative block aspect-square w-full overflow-hidden rounded-[10px] bg-surface-2 text-left"
              >
                <MediaPreview src={item.url} alt="" className="h-full w-full object-cover" sizes="(min-width: 768px) 224px, 33vw" />
                {item.kind === "video" && (
                  <span className="glass-tag absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full text-ink" aria-hidden>
                    <Play size={14} weight="fill" />
                  </span>
                )}
                {(item.postStatus === "scheduled" || item.postStatus === "published") && (
                  <span className="absolute top-1.5 left-1.5">
                    <Chip tone={contentStatusTone(item.postStatus)}>{contentStatusLabel(item.postStatus)}</Chip>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <MediaSheet item={open} onClose={() => setOpenIndex(null)} />}
    </div>
  );
}

/** A full-screen look at one file. Escape or a tap anywhere closes it. */
function MediaSheet({ item, onClose }: { item: LibraryItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.source}
      className="glass fixed inset-0 z-50 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[1.0625rem] font-700">{item.source}</p>
          {item.postStatus && (item.postStatus === "scheduled" || item.postStatus === "published") && (
            <p className="mt-0.5 text-sm text-ink-faint">{contentStatusLabel(item.postStatus)}</p>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink">
          <X size={20} weight="bold" aria-hidden />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {item.kind === "video" ? (
          <video
            src={item.url} controls autoPlay playsInline
            className="max-h-full max-w-full rounded-[14px] bg-black"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="max-h-full max-w-full rounded-[14px] object-contain" />
        )}
      </div>
    </div>
  );
}
