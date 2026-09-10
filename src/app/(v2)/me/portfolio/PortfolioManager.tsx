"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { EmptyState } from "@/components/v2/ui";
import { addPortfolioItem, removePortfolioItem } from "../actions";

export function PortfolioManager({
  items,
}: { items: { id: string; media_url: string; caption: string | null }[] }) {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3">
      <div className="card p-4">
        <p className="font-display text-[0.9375rem] font-600">Add photos or videos</p>
        <p className="mt-1 text-sm text-ink-faint">Up to 24 items. The first six show on your profile.</p>
        <input
          className="field mt-3" maxLength={200} value={caption}
          onChange={(e) => setCaption(e.target.value)} placeholder="Caption for the next upload (optional)"
          aria-label="Caption"
        />
        <div className="mt-3">
          <Uploader
            folder="portfolio" multiple label="Add work"
            onUploaded={(urls) =>
              startTransition(async () => {
                setError(null);
                for (const url of urls) {
                  const result = await addPortfolioItem(url, caption);
                  if (!result.ok) { setError(result.error ?? "Failed."); break; }
                }
                setCaption("");
                router.refresh();
              })}
          />
        </div>
        {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
      </div>

      {items.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="card relative overflow-hidden">
              {/\.(mp4|webm|mov)($|\?)/i.test(item.media_url) ? (
                <video src={item.media_url} controls playsInline className="aspect-square w-full bg-surface-2 object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.media_url} alt={item.caption ?? "Portfolio item"} className="aspect-square w-full bg-surface-2 object-cover" />
              )}
              {item.caption && <p className="truncate px-3 py-2 text-sm text-ink-soft">{item.caption}</p>}
              <button
                type="button" aria-label="Remove item" disabled={pending}
                className="glass-tag absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-600 text-ink hover:text-signal"
                onClick={() => startTransition(async () => { await removePortfolioItem(item.id); router.refresh(); })}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="Nothing here yet"
            body="Upload photos or videos of your work. Businesses look at this before they hire."
          />
        </div>
      )}
    </div>
  );
}
