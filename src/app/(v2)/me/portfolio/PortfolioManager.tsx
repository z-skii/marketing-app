"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
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
      <div className="border border-rule p-3">
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
        <input
          className="field mt-2 w-full !py-2 !text-xs" maxLength={200} value={caption}
          onChange={(e) => setCaption(e.target.value)} placeholder="Caption for the next upload (optional)"
          aria-label="Caption"
        />
        {error && <p role="alert" className="mt-2 font-mono text-xs text-signal">{error}</p>}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="relative border border-rule">
            {/\.(mp4|webm|mov)($|\?)/i.test(item.media_url) ? (
              <video src={item.media_url} controls playsInline className="aspect-square w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.media_url} alt={item.caption ?? "Portfolio item"} className="aspect-square w-full object-cover" />
            )}
            {item.caption && <p className="truncate px-2 py-1 text-[0.6875rem] text-ink-faint">{item.caption}</p>}
            <button
              type="button" aria-label="Remove item" disabled={pending}
              className="absolute top-1 right-1 border border-ink bg-paper px-1.5 py-0.5 font-mono text-[0.625rem] hover:bg-signal hover:text-white"
              onClick={() => startTransition(async () => { await removePortfolioItem(item.id); router.refresh(); })}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="mt-3 font-mono text-xs text-ink-faint">Nothing here yet — upload photos or videos of your work.</p>
      )}
    </div>
  );
}
