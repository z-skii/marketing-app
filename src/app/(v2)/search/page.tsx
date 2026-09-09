import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { globalSearch, type SearchHit } from "@/lib/v2/feed";
import { Avatar, EmptyState, SectionTitle } from "@/components/v2/ui";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

/** Initial for a hit without a photo: the business behind a job, the make of a car. */
function avatarName(h: SearchHit) {
  if (h.type === "campaign") return h.subtitle ?? h.title;
  if (h.type === "vehicle") return h.title.replace(/^\d{4}\s+/, "");
  return h.title;
}

const GROUPS: { type: SearchHit["type"]; label: string }[] = [
  { type: "campaign", label: "Jobs" },
  { type: "business", label: "Businesses" },
  { type: "profile", label: "People" },
  { type: "vehicle", label: "Cars" },
];

/** Global search across jobs, businesses, people and cars. */
export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  const q = (params.q ?? "").trim();
  const hits = q ? await globalSearch(q) : [];
  const groups = GROUPS.map((g) => ({ ...g, hits: hits.filter((h) => h.type === g.type) })).filter((g) => g.hits.length > 0);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <h1 className="sr-only">Search</h1>
      <form className="flex gap-2" action="/search" role="search">
        <input
          className="field flex-1 text-[1.0625rem]" name="q" defaultValue={q}
          placeholder="Jobs, businesses, people, cars" aria-label="Search"
          autoFocus enterKeyHint="search"
        />
        <button type="submit" className="btn btn-signal shrink-0">Search</button>
      </form>

      {q && groups.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title={`Nothing found for "${q}"`}
            body="Try a shorter word, a city, or a business name."
          />
        </div>
      )}

      {groups.map((g) => (
        <section key={g.type} className="mt-6">
          <SectionTitle count={g.hits.length}>{g.label}</SectionTitle>
          <ul className="row-list mt-3">
            {g.hits.map((h) => (
              <li key={`${h.type}-${h.id}`}>
                <Link href={h.href} className="card flex items-center gap-3 p-3">
                  {h.image_url && h.type !== "profile" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.image_url} alt="" className="h-14 w-14 shrink-0 rounded-[10px] bg-surface-2 object-cover" loading="lazy" />
                  ) : (
                    <Avatar src={h.image_url} name={avatarName(h)} size={56} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[1.0625rem] font-800 tracking-[-0.02em]">{h.title}</span>
                    {h.subtitle && <span className="block truncate text-sm text-ink-faint">{h.subtitle}</span>}
                  </span>
                  <span aria-hidden className="text-ink-faint">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
