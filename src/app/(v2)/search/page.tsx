import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { globalSearch } from "@/lib/v2/feed";
import { Avatar, Chip } from "@/components/v2/ui";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

/** Global search across jobs, businesses, people and cars. */
export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  const q = (params.q ?? "").trim();
  const hits = q ? await globalSearch(q) : [];

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Search</h1>
      <form className="mt-4 flex gap-2" action="/search">
        <input
          className="field flex-1" name="q" defaultValue={q}
          placeholder="Jobs, businesses, people, cars…" aria-label="Search"
          autoFocus enterKeyHint="search"
        />
        <button type="submit" className="btn btn-signal !px-5">Go</button>
      </form>

      {q && (
        <section className="mt-5">
          {hits.length === 0 && (
            <p className="font-mono text-xs text-ink-faint">Nothing found for “{q}”.</p>
          )}
          <ul className="flex flex-col gap-2">
            {hits.map((h, i) => (
              <li key={i}>
                <Link href={h.href} className="flex items-center gap-3 border border-rule p-3 hover:border-ink">
                  <Avatar src={h.image_url} name={h.title} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-800">{h.title}</span>
                    {h.subtitle && <span className="block truncate text-xs text-ink-faint">{h.subtitle}</span>}
                  </span>
                  <Chip tone="faint">{h.type}</Chip>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
