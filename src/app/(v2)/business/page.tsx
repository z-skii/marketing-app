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
  const firstPeople = preview ? shownPeople.slice(0, 2) : shownPeople;
  const morePeople = preview ? shownPeople.slice(2) : [];
  const nearYou = Boolean(city) && firstPeople.some((p) => p.same_city);
  const peopleLabel = tab === "nearby" ? `People in ${city}` : nearYou ? "People near you" : "People";
  const carsLabel = tab === "nearby" ? `Cars in ${city}` : "Cars available";

  return (
    <main id="main" className="mx-auto w-full max-w-[1272px] px-4 pt-[14px] pb-6 rail:px-8 rail:pt-0">
      <div className="hidden rail:flex rail:h-16 rail:items-center rail:justify-between">
        <h1 className="font-display text-[30px] leading-9 font-[820] tracking-[-0.8px]">Marketplace</h1>
        <Link href="/business/search" className="btn"><MagnifyingGlass size={18} aria-hidden />Search</Link>
      </div>
      <h1 className="sr-only rail:hidden">Marketplace</h1>
      <div className="flex items-center gap-2 rail:mt-6">
        <div className="min-w-0 flex-1">
          <FilterBar label="Marketplace tabs" active={tab} items={TABS.map((t) => ({ key: t.key, label: t.label, href: href(t.key) }))} />
        </div>
        <Link href="/business/search" aria-label="Search people and cars" className="iconbtn is-surface shrink-0 rail:hidden">
          <MagnifyingGlass size={22} aria-hidden />
        </Link>
      </div>

      {empty ? (
        <div className="card mt-6 max-w-[420px] p-[18px]">
          <p className="font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px]">{tab === "cars" ? "No cars available yet" : "No creators here yet"}</p>
          <p className="mt-1.5 text-[13px] leading-[18px] text-ink-soft">{offset > 0 ? "That is everyone." : tab === "cars" ? "Check back later or search another city." : emptyLine}</p>
          <Link href="/business/search" className="btn mt-[18px]">Search</Link>
        </div>
      ) : (
        <>
          {tab !== "cars" && firstPeople.length > 0 && (
            <section aria-label={peopleLabel}>
              <div className="mt-[18px] mb-2.5 flex h-11 items-center justify-between gap-3">
                <h2 className="eyebrow">{peopleLabel}</h2>
                {preview && <Link href={href("people")} className="btn btn-ghost -mr-3 text-[14px] !text-ink-2">All people<CaretRight size={16} aria-hidden /></Link>}
              </div>
              <PeopleGrid people={firstPeople} />
            </section>
          )}

          {tab === "for_you" && shownCars.length > 0 && (
            <section aria-label={carsLabel}>
              <div className="mt-6 mb-2.5 flex h-11 items-center justify-between gap-3">
                <h2 className="eyebrow">{carsLabel}</h2>
                <Link href={href("cars")} className="btn btn-ghost -mr-3 text-[14px] !text-ink-2">All cars<CaretRight size={16} aria-hidden /></Link>
              </div>
              <ul className="grid gap-[14px] rail:grid-cols-[repeat(auto-fill,360px)] rail:gap-[18px]">
                {shownCars.slice(0, 3).map((car, i) => <li key={car.id}><CarCard car={car} index={i} /></li>)}
              </ul>
            </section>
          )}

          {morePeople.length > 0 && (
            <section aria-label="More people">
              <h2 className="eyebrow mt-6 mb-2.5">More people</h2>
              <PeopleGrid people={morePeople} startIndex={2} />
            </section>
          )}

          {(tab === "cars" || tab === "nearby") && shownCars.length > 0 && (
            <section aria-label={carsLabel}>
              <h2 className="eyebrow mt-6 mb-2.5">{carsLabel}</h2>
              <ul className="grid gap-[14px] rail:grid-cols-[repeat(auto-fill,360px)] rail:gap-[18px]">
                {shownCars.map((car, i) => <li key={car.id}><CarCard car={car} index={i} /></li>)}
              </ul>
            </section>
          )}

          {(hasMore || offset > 0) && (tab === "cars" || tab === "people") && (
            <div className="mt-4 flex items-center justify-between gap-3">
              {offset > 0 ? <Link href={href(tab, Math.max(offset - pageSize, 0))} className="btn flex-1">Newer</Link> : <span />}
              {hasMore && <Link href={href(tab, offset + pageSize)} className="btn flex-1">More</Link>}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function PeopleGrid({ people, startIndex = 0 }: { people: Person[]; startIndex?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-[14px] rail:grid-cols-[repeat(auto-fill,260px)] rail:gap-[18px]">
      {people.map((p, i) => (
        <li key={p.id}>
          <PersonCard person={p} index={startIndex + i} priority={startIndex + i < 4} />
        </li>
      ))}
    </ul>
  );
}
