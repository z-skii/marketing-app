import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { listCarsForBusiness, listPeople } from "@/lib/v2/marketplace";
import { PersonCard } from "../people/PersonCard";
import { CarCard } from "../cars/CarCard";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

/**
 * Search the marketplace: people by username, name or city; cars by make,
 * model or city. The same cards as Business Home.
 */
export default async function BusinessSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/search"), searchParams]);
  const business = ctx.activeBusiness;
  const q = (params.q ?? "").trim().slice(0, 80);
  const city = (await sqlOne<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]))?.city ?? ctx.city;

  const [people, cars] = q
    ? await Promise.all([
        listPeople({ businessId: business.id, viewerId: ctx.user.id, viewerCity: city, q, limit: 24 }),
        listCarsForBusiness({ viewerId: ctx.user.id, viewerCity: city, q, limit: 24 }),
      ])
    : [[], []];

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-4 md:px-8 md:py-8">
      <form action="/business/search" method="get" role="search" className="relative">
        <MagnifyingGlass size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint" aria-hidden />
        <input
          type="search" name="q" defaultValue={q} autoFocus autoComplete="off" enterKeyHint="search"
          placeholder="People, cities, cars" aria-label="Search people and cars"
          className="field pl-12"
        />
      </form>

      {!q ? (
        <p className="mt-6 text-sm text-ink-soft">Try a name, a city, or a car.</p>
      ) : people.length === 0 && cars.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Nothing matches &ldquo;{q}&rdquo;.</p>
      ) : (
        <>
          {people.length > 0 && (
            <section className="mt-6" aria-label="People">
              <h2 className="eyebrow mb-3">People</h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {people.map((p, i) => <li key={p.id}><PersonCard person={p} index={i} priority={i < 4} /></li>)}
              </ul>
            </section>
          )}
          {cars.length > 0 && (
            <section className="mt-8" aria-label="Cars">
              <h2 className="eyebrow mb-3">Cars</h2>
              <ul className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {cars.map((c, i) => <li key={c.id}><CarCard car={c} index={i} /></li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
