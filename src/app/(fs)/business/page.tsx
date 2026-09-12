import Link from "next/link";
import { ArrowRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { listCarsForBusiness, listPeople, type Car, type Person } from "@/lib/v2/marketplace";
import { imageRatio } from "@/lib/fs/media-ratio";
import { PersonAssembly, PersonSpread, type PersonSpreadData } from "@/components/fs/business/People";
import { CarAssembly, CarShelfItem } from "@/components/fs/business/Cars";
import { ShelfControls } from "@/components/fs/business/ShelfControls";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * Business Home in Frame Shift: a discovery marketplace. Find people and
 * cars to market the business through. On desktop an open source-ratio
 * people ribbon followed immediately by physical advertising inventory;
 * on phones a clean vertical discovery list. Same real queries, ranking,
 * views and request flows as before; no analytics, no counts invented.
 */
type Tab = "for_you" | "people" | "cars" | "nearby";
const TABS: { key: Tab; label: string }[] = [
  { key: "for_you", label: "For you" },
  { key: "people", label: "People" },
  { key: "cars", label: "Cars" },
  { key: "nearby", label: "Nearby" },
];

async function withRatios(people: Person[]): Promise<PersonSpreadData[]> {
  return Promise.all(people.map(async (person) => ({ person, ratio: await imageRatio(person.samples[0]?.url) })));
}

export default async function BusinessHome({ searchParams }: { searchParams: Promise<{ tab?: string; offset?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business"), searchParams]);
  const business = ctx.activeBusiness;
  const tab: Tab = TABS.find((t) => t.key === params.tab)?.key ?? "for_you";
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 12;

  const [details, attention] = await Promise.all([
    sqlOne<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]),
    sqlOne<{ decisions: string; files: string }>(
      `select
         ((select count(*) from applications a join campaigns c on c.id = a.campaign_id where c.business_id = $1 and a.status = 'applied')
        + (select count(*) from submissions s join campaigns c on c.id = s.campaign_id where c.business_id = $1 and s.status in ('submitted', 'under_review')))::text as decisions,
         (select count(*) from content_deliverables d where d.business_id = $1 and d.status = 'new')::text as files`,
      [business.id],
    ),
  ]);
  const city = details?.city ?? null;
  const base = { businessId: business.id, viewerId: ctx.user.id, viewerCity: city };

  // Each query fails on its own: a people failure never erases usable cars.
  const [peopleResult, carsResult] = await Promise.allSettled([
    tab === "cars" ? Promise.resolve([] as Person[])
      : listPeople({ ...base, tab: tab === "nearby" ? "nearby" : tab === "people" ? "people" : "for_you", limit: pageSize + 1, offset }),
    tab === "people" ? Promise.resolve([] as Car[])
      : listCarsForBusiness({ ...base, nearby: tab === "nearby", limit: tab === "cars" ? pageSize + 1 : 8, offset: tab === "cars" ? offset : 0 }),
  ]);
  const people = peopleResult.status === "fulfilled" ? peopleResult.value : [];
  const cars = carsResult.status === "fulfilled" ? carsResult.value : [];
  const peopleFailed = peopleResult.status === "rejected";
  const carsFailed = carsResult.status === "rejected";

  const paged = tab === "cars" ? cars : people;
  const hasMore = paged.length > pageSize;
  const shownPeople = await withRatios(people.slice(0, pageSize));
  const shownCars = tab === "cars" ? cars.slice(0, pageSize) : cars;
  const href = (key: Tab, off = 0) => `/business${key === "for_you" && !off ? "" : `?tab=${key}${off ? `&offset=${off}` : ""}`}`;
  const decisions = Number(attention?.decisions ?? 0);
  const files = Number(attention?.files ?? 0);
  const nearbyNoCity = tab === "nearby" && !city;
  const peopleLabel = tab === "nearby" ? `People in ${city}` : "People";
  const carsLabel = tab === "nearby" ? `Cars in ${city}` : "Available cars";

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-purpose-row">
        <h1 className="fs-t-page">Find people and cars</h1>
        <Link href="/business/edit" className="fs-btn fs-btn-secondary fs-city-btn" aria-label={city ? `Business city ${city}. Change it` : "Add your business city"}>
          <MapPin size={18} aria-hidden />{city ?? "Add your city"}
        </Link>
      </div>

      {(decisions > 0 || files > 0) && (
        <div className="fs-attention" aria-label="Needs your decision" style={{ marginTop: 4 }}>
          {decisions > 0 && <Link href="/business/campaigns?tab=review" className="fs-btn fs-btn-quiet fs-link-ink fs-link-ul" style={{ paddingLeft: 0, minHeight: 44 }}>{decisions} campaign decision{decisions === 1 ? "" : "s"} <ArrowRight size={18} aria-hidden /></Link>}
          {files > 0 && <Link href="/business/content" className="fs-btn fs-btn-quiet fs-link-ink fs-link-ul" style={{ paddingLeft: 0, minHeight: 44 }}>{files} file{files === 1 ? "" : "s"} to approve <ArrowRight size={18} aria-hidden /></Link>}
        </div>
      )}

      <div className="fs-discovery-head" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <nav className="fs-filters is-work" aria-label="Discovery" style={{ flex: 1 }}>
          {TABS.map((t) => <Link key={t.key} href={href(t.key)} aria-current={tab === t.key ? "page" : undefined}>{t.label}</Link>)}
        </nav>
        {tab === "for_you" && shownPeople.length > 0 && (
          <span className="fs-desk-only" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href={href("people")} className="fs-btn fs-btn-quiet fs-link-ink" style={{ minHeight: 44 }}>See all people</Link>
            <ShelfControls target="people-ribbon" label="people" />
          </span>
        )}
      </div>

      {nearbyNoCity && (
        <div style={{ marginTop: 24, maxWidth: 480 }}>
          <p className="fs-t-task">Nearby needs your business city.</p>
          <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>People and cars are matched to the city on your business profile.</p>
          <Link href="/business/edit" className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>Add your city</Link>
        </div>
      )}

      {/* People */}
      {!nearbyNoCity && tab !== "cars" && (
        <section aria-labelledby="people-title">
          <h2 id="people-title" className={tab === "for_you" ? "fs-sr" : "fs-t-section"} style={tab === "for_you" ? undefined : { marginTop: 16 }}>{peopleLabel}</h2>
          {peopleFailed ? (
            <p className="fs-t-body" style={{ marginTop: 16 }}><span className="fs-status is-problem">People could not be loaded.</span> <Link href={href(tab)} className="fs-link-ink fs-link-ul">Try again</Link></p>
          ) : shownPeople.length === 0 ? (
            <div style={{ marginTop: 16, maxWidth: 480 }}>
              <p className="fs-t-task">{tab === "nearby" ? `Nobody in ${city} is earning on TapMart yet.` : "Nobody is earning on TapMart yet."}</p>
              <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>People appear here as they join and share work.</p>
            </div>
          ) : tab === "for_you" ? (
            <>
              <div data-shelf="people-ribbon" className="fs-people-ribbon fs-desk-only">
                {shownPeople.map((s) => <PersonSpread key={s.person.id} s={s} canRequest={s.person.id !== ctx.user.id} />)}
              </div>
              <ul className="fs-people-list fs-phone-only">
                {shownPeople.slice(0, 4).map((s) => <li key={s.person.id}><PersonAssembly s={s} canRequest={s.person.id !== ctx.user.id} /></li>)}
              </ul>
              {shownPeople.length > 4 && <Link href={href("people")} className="fs-btn fs-btn-quiet fs-link-ink fs-phone-only" style={{ paddingLeft: 0, marginTop: 8 }}>See all people <ArrowRight size={18} aria-hidden /></Link>}
            </>
          ) : (
            <>
              <div className="fs-people-grid fs-desk-only">
                {shownPeople.map((s) => <PersonSpread key={s.person.id} s={s} canRequest={s.person.id !== ctx.user.id} />)}
              </div>
              <ul className="fs-people-list fs-phone-only">
                {shownPeople.map((s) => <li key={s.person.id}><PersonAssembly s={s} canRequest={s.person.id !== ctx.user.id} /></li>)}
              </ul>
            </>
          )}
        </section>
      )}

      {/* Cars */}
      {!nearbyNoCity && tab !== "people" && (
        <section aria-labelledby="cars-title" className={tab === "for_you" ? "fs-cars-after-people" : undefined} style={{ marginTop: tab === "cars" ? 16 : 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, minHeight: 44, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h2 id="cars-title" className="fs-t-section">{carsLabel}</h2>
              <span className="fs-t-body" style={{ color: "var(--fs-muted)" }}>Monthly advertising space</span>
            </span>
            {tab === "for_you" && shownCars.length > 0 && (
              <>
                <span className="fs-desk-only" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link href={href("cars")} className="fs-btn fs-btn-quiet fs-link-ink" style={{ minHeight: 44 }}>See all cars</Link>
                  <ShelfControls target="car-shelf" label="cars" />
                </span>
                <Link href={href("cars")} className="fs-btn fs-btn-quiet fs-link-ink fs-phone-only" style={{ paddingLeft: 0, minHeight: 44 }}>See all cars <ArrowRight size={18} aria-hidden /></Link>
              </>
            )}
          </div>
          {carsFailed ? (
            <p className="fs-t-body" style={{ marginTop: 12 }}><span className="fs-status is-problem">Cars could not be loaded.</span> <Link href={href(tab)} className="fs-link-ink fs-link-ul">Try again</Link></p>
          ) : shownCars.length === 0 ? (
            <div style={{ marginTop: 12, maxWidth: 480 }}>
              <p className="fs-t-task">{tab === "nearby" ? `No cars in ${city} are listed for ads yet.` : "No cars are listed for ads yet."}</p>
              <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>Owners list their cars with the placements they offer and an asking price.</p>
            </div>
          ) : tab === "for_you" ? (
            <>
              <ul data-shelf="car-shelf" className="fs-shelf fs-desk-only">
                {shownCars.map((c, i) => <CarShelfItem key={c.id} c={c} priority={i < 3} />)}
              </ul>
              <ul className="fs-car-list fs-phone-only">
                {shownCars.slice(0, 3).map((c, i) => <CarAssembly key={c.id} c={c} priority={i === 0} />)}
              </ul>
            </>
          ) : (
            <ul className="fs-car-list fs-car-grid">
              {shownCars.map((c, i) => <CarAssembly key={c.id} c={c} priority={i < 2} />)}
            </ul>
          )}
        </section>
      )}

      {(hasMore || offset > 0) && (tab === "cars" || tab === "people") && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 24, maxWidth: 480 }}>
          {offset > 0 ? <Link href={href(tab, Math.max(offset - pageSize, 0))} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>Newer</Link> : <span />}
          {hasMore && <Link href={href(tab, offset + pageSize)} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>More</Link>}
        </div>
      )}
    </main>
  );
}
