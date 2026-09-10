import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { listCarsForBusiness, listPeople, type Car, type Person } from "@/lib/v2/marketplace";
import { FilterBar } from "@/components/v2/FilterBar";
import { ScreenHeader } from "@/components/v2/ui";
import { PersonCard } from "./people/PersonCard";
import { CarCard } from "./cars/CarCard";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

type Tab = "for_you" | "people" | "cars" | "nearby";
const TABS: { key: Tab; label: string }[] = [
  { key: "for_you", label: "For you" },
  { key: "people", label: "People" },
  { key: "cars", label: "Cars" },
  { key: "nearby", label: "Nearby" },
];

/**
 * Business Home is a marketplace: the people and the cars a business can
 * advertise through. No numbers, no intro. Pick someone, send a request.
 */
export default async function BusinessHome({ searchParams }: { searchParams: Promise<{ tab?: string; offset?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business"), searchParams]);
  const business = ctx.activeBusiness;
  const tab: Tab = TABS.find((t) => t.key === params.tab)?.key ?? "for_you";
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 12;

  const city = (await sqlOne<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]))?.city ?? ctx.city;
  const base = { businessId: business.id, viewerId: ctx.user.id, viewerCity: city };

  const [people, cars] = await Promise.all([
    tab === "cars" ? Promise.resolve([] as Person[])
      : listPeople({ ...base, tab: tab === "nearby" ? "nearby" : tab === "people" ? "people" : "for_you", limit: pageSize + 1, offset }),
    tab === "people" ? Promise.resolve([] as Car[])
      : listCarsForBusiness({ ...base, nearby: tab === "nearby", limit: tab === "cars" ? pageSize + 1 : 8, offset: tab === "cars" ? offset : 0 }),
  ]);

  const paged = tab === "cars" ? cars : people;
  const hasMore = paged.length > pageSize;
  const shownPeople = people.slice(0, pageSize);
  const shownCars = tab === "cars" ? cars.slice(0, pageSize) : cars;
  const href = (key: Tab, off = 0) => `/business${key === "for_you" && !off ? "" : `?tab=${key}${off ? `&offset=${off}` : ""}`}`;

  const empty = shownPeople.length === 0 && shownCars.length === 0;
  const emptyLine =
    tab === "cars" ? "No cars are listed for ads yet."
    : tab === "nearby" ? `Nobody in ${city ?? "your city"} is earning on TapMart yet.`
    : "Nobody is earning on TapMart yet.";

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} showSearch={false} kicker="People and cars to advertise through" title={city ?? business.name} unread={ctx.unreadNotifications} />

      <div className="mt-4">
        <FilterBar label="Marketplace tabs" active={tab} items={TABS.map((t) => ({ key: t.key, label: t.label, href: href(t.key) }))} />
      </div>

      {empty ? (
        <p className="mt-8 text-sm text-ink-soft">{offset > 0 ? "That is everyone." : emptyLine}</p>
      ) : (
        <>
          {tab !== "cars" && shownPeople.length > 0 && (
            <section className="mt-5" aria-label="People">
              {tab === "nearby" && <h2 className="eyebrow mb-3">People in {city ?? "your city"}</h2>}
              <PeopleGrid people={tab === "for_you" && shownCars.length > 0 ? shownPeople.slice(0, 4) : shownPeople} nearbyTag={tab !== "nearby"} />
            </section>
          )}

          {tab === "for_you" && shownCars.length > 0 && (
            <section className="mt-8" aria-label="Available cars">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="eyebrow">Available cars</h2>
                <Link href={href("cars")} className="link-row text-sm">All cars<CaretRight size={16} aria-hidden /></Link>
              </div>
              <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:-mx-8 md:px-8 [&::-webkit-scrollbar]:hidden">
                {shownCars.map((car, i) => <li key={car.id} className="shrink-0 snap-start"><CarCard car={car} index={i} rail /></li>)}
              </ul>
            </section>
          )}

          {tab === "for_you" && shownCars.length > 0 && shownPeople.length > 4 && (
            <section className="mt-8" aria-label="More people">
              <h2 className="eyebrow mb-3">More people</h2>
              <PeopleGrid people={shownPeople.slice(4)} startIndex={4} />
            </section>
          )}

          {(tab === "cars" || tab === "nearby") && shownCars.length > 0 && (
            <section className="mt-8" aria-label="Cars">
              {tab === "nearby" && <h2 className="eyebrow mb-3">Cars in {city ?? "your city"}</h2>}
              <ul className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {shownCars.map((car, i) => <li key={car.id}><CarCard car={car} index={i} /></li>)}
              </ul>
            </section>
          )}

          {(hasMore || offset > 0) && (tab === "cars" || tab === "people") && (
            <div className="mt-6 flex items-center justify-between">
              {offset > 0 ? <Link href={href(tab, Math.max(offset - pageSize, 0))} className="btn">Newer</Link> : <span />}
              {hasMore && <Link href={href(tab, offset + pageSize)} className="btn">More</Link>}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function PeopleGrid({ people, startIndex = 0, nearbyTag = true }: { people: Person[]; startIndex?: number; nearbyTag?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {people.map((p, i) => <li key={p.id}><PersonCard person={p} index={startIndex + i} priority={startIndex + i < 4} nearbyTag={nearbyTag} /></li>)}
    </ul>
  );
}
