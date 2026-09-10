import Link from "next/link";
import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { listCarsForBusiness, listPeople, type Car, type Person } from "@/lib/v2/marketplace";
import { FilterBar } from "@/components/v2/FilterBar";
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
 * advertise through. Tabs, then faces, then cars. No title, no numbers, no
 * sentence. Pick someone, send a request.
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

  // On For you: four people (one row of three on wide screens, the fourth
  // hides there), then the cars rail, then everyone else.
  const preview = tab === "for_you" && shownCars.length > 0;
  const firstPeople = preview ? shownPeople.slice(0, 4) : shownPeople;
  const morePeople = preview ? shownPeople.slice(4) : [];
  const nearYou = Boolean(city) && firstPeople.some((p) => p.same_city);
  const peopleLabel = tab === "nearby" ? `People in ${city}` : nearYou ? "People near you" : "People";
  const carsLabel = tab === "nearby" ? `Cars in ${city}` : "Cars available";

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-3 pb-6 md:px-8 md:pt-6 md:pb-10">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <FilterBar label="Marketplace tabs" active={tab} items={TABS.map((t) => ({ key: t.key, label: t.label, href: href(t.key) }))} />
        </div>
        <Link href="/business/search" aria-label="Search people and cars" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink rail:hidden">
          <MagnifyingGlass size={22} aria-hidden />
        </Link>
      </div>

      {empty ? (
        <p className="mt-8 text-sm text-ink-soft">{offset > 0 ? "That is everyone." : emptyLine}</p>
      ) : (
        <>
          {tab !== "cars" && firstPeople.length > 0 && (
            <section className="mt-6" aria-label={peopleLabel}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="eyebrow">{peopleLabel}</h2>
                {preview && <Link href={href("people")} className="link-row text-sm">All people<CaretRight size={16} aria-hidden /></Link>}
              </div>
              <PeopleGrid people={firstPeople} hideFourthOnWide={preview} />
            </section>
          )}

          {tab === "for_you" && shownCars.length > 0 && (
            <section className="mt-6 md:mt-7" aria-label={carsLabel}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="eyebrow">{carsLabel}</h2>
                <Link href={href("cars")} className="link-row text-sm">All cars<CaretRight size={16} aria-hidden /></Link>
              </div>
              <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:-mx-8 md:gap-5 md:px-8 [&::-webkit-scrollbar]:hidden">
                {shownCars.map((car, i) => <li key={car.id} className="shrink-0 snap-start"><CarCard car={car} index={i} rail /></li>)}
              </ul>
            </section>
          )}

          {morePeople.length > 0 && (
            <section className="mt-8 md:mt-9" aria-label="More people">
              <h2 className="eyebrow">More people</h2>
              <PeopleGrid people={morePeople} startIndex={4} />
            </section>
          )}

          {(tab === "cars" || tab === "nearby") && shownCars.length > 0 && (
            <section className={tab === "nearby" ? "mt-9" : "mt-6"} aria-label={carsLabel}>
              <h2 className="eyebrow">{carsLabel}</h2>
              <ul className="mt-4 grid gap-x-4 gap-y-7 sm:grid-cols-2 md:gap-x-5 lg:grid-cols-3">
                {shownCars.map((car, i) => <li key={car.id}><CarCard car={car} index={i} /></li>)}
              </ul>
            </section>
          )}

          {(hasMore || offset > 0) && (tab === "cars" || tab === "people") && (
            <div className="mt-8 flex items-center justify-between">
              {offset > 0 ? <Link href={href(tab, Math.max(offset - pageSize, 0))} className="btn">Newer</Link> : <span />}
              {hasMore && <Link href={href(tab, offset + pageSize)} className="btn">More</Link>}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function PeopleGrid({ people, startIndex = 0, hideFourthOnWide = false }: { people: Person[]; startIndex?: number; hideFourthOnWide?: boolean }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-9 md:gap-x-5 lg:grid-cols-3">
      {people.map((p, i) => (
        <li key={p.id} className={hideFourthOnWide && i === 3 ? "lg:hidden" : undefined}>
          <PersonCard person={p} index={startIndex + i} priority={startIndex + i < 4} />
        </li>
      ))}
    </ul>
  );
}
