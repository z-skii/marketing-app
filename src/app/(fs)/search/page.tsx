import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { globalSearch, type SearchHit } from "@/lib/v2/feed";
import { Avatar } from "@/components/fs/parts";
import { Img } from "@/components/fs/Img";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

const GROUPS: { type: SearchHit["type"]; label: string; sub: string }[] = [
  { type: "campaign", label: "Open campaigns", sub: "Public campaigns you can take part in" },
  { type: "business", label: "Businesses", sub: "By name or category" },
  { type: "profile", label: "People", sub: "By name or username" },
];

/**
 * Search helps find a thing in TapMart: open public campaigns, businesses
 * and people, the three entities the backend indexes. Vehicles are private
 * and never searchable. Results are rows that open the thing itself.
 */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  const q = (params.q ?? "").trim().slice(0, 80);
  const hits = q ? await globalSearch(q, 12) : [];
  const groups = GROUPS.map((g) => ({ ...g, hits: hits.filter((h) => h.type === g.type) })).filter((g) => g.hits.length > 0);
  return (
    <main className="fs-phone-main fs-utility" id="main">
      <div className="fs-purpose-row"><h1 className="fs-t-page">Search</h1></div>
      <form className="fs-search-form" action="/search" role="search">
        <input className="fs-input" type="search" name="q" defaultValue={q} placeholder="Campaigns, businesses, people" aria-label="Search TapMart" autoFocus autoComplete="off" enterKeyHint="search" />
        <button type="submit" className="fs-btn fs-btn-primary" aria-label="Search"><MagnifyingGlass size={20} aria-hidden /><span className="fs-desk-only">Search</span></button>
      </form>
      {!q && <p className="fs-t-meta" style={{ marginTop: 16 }}>Open campaigns, businesses and people. Cars are private and are not searchable.</p>}
      {q && q.length < 2 && <p className="fs-t-meta" style={{ marginTop: 16 }}>Type at least two characters.</p>}
      {q.length >= 2 && groups.length === 0 && (
        <div style={{ marginTop: 24, maxWidth: 480 }}>
          <p className="fs-t-task">Nothing found for &ldquo;{q}&rdquo;.</p>
          <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>Try a shorter word, a city, or a business name.</p>
        </div>
      )}
      {groups.map((g) => (
        <section key={g.type} aria-labelledby={`sg-${g.type}`} style={{ marginTop: 24 }}>
          <h2 id={`sg-${g.type}`} className="fs-t-section">{g.label} <span className="fs-t-meta">· {g.hits.length}</span></h2>
          <ul className="fs-hit-list">
            {g.hits.map((h) => (
              <li key={`${h.type}-${h.id}`}>
                <Link href={h.href} className="fs-hit">
                  {h.type === "profile" ? <Avatar src={h.image_url} name={h.title} size={56} /> : h.image_url ? <span className="fs-hit-thumb"><Img src={h.image_url} alt="" loading="lazy" /></span> : <Avatar src={null} name={h.type === "campaign" ? h.subtitle ?? h.title : h.title} size={56} square />}
                  <span style={{ minWidth: 0 }}>
                    <span className="fs-t-body" style={{ display: "block", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</span>
                    {h.subtitle && <span className="fs-t-meta" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.subtitle}</span>}
                  </span>
                  <span className="fs-hit-end fs-t-meta">{h.type === "campaign" ? "Open" : h.type === "business" ? "Business" : "Person"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
