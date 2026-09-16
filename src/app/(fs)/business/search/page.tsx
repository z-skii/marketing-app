import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { listCarsForBusiness, listPeople, type Car, type Person } from "@/lib/v2/marketplace";
import { imageRatio } from "@/lib/fs/media-ratio";
import { PersonAssembly, PersonSpread } from "@/components/fs/business/People";
import { CarAssembly } from "@/components/fs/business/Cars";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

/**
 * Business search: the marketplace by name, username, city, make or
 * model, in the same compositions as Business Home. People and cars are
 * what the backend indexes for a business.
 */
export default async function BusinessSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/search"), searchParams]);
  const business = ctx.activeBusiness;
  const q = (params.q ?? "").trim().slice(0, 80);
  const city = (await sqlOne<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]))?.city ?? ctx.city;
  const [peopleResult, carsResult] = q
    ? await Promise.allSettled([
        listPeople({ businessId: business.id, viewerId: ctx.user.id, viewerCity: city, q, limit: 24 }),
        listCarsForBusiness({ viewerId: ctx.user.id, viewerCity: city, q, limit: 24 }),
      ])
    : [{ status: "fulfilled", value: [] as Person[] } as const, { status: "fulfilled", value: [] as Car[] } as const];
  const people = peopleResult.status === "fulfilled" ? peopleResult.value : [];
  const cars = carsResult.status === "fulfilled" ? carsResult.value : [];
  const failed = peopleResult.status === "rejected" || carsResult.status === "rejected";
  const shownPeople = await Promise.all(people.map(async (person) => ({ person, ratio: await imageRatio(person.samples[0]?.url) })));

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-purpose-row"><h1 className="fs-t-page">Search</h1></div>
      <form className="fs-search-form fs-utility" action="/business/search" role="search">
        <input className="fs-input" type="search" name="q" defaultValue={q} placeholder="People, cities, cars" aria-label="Search people and cars" autoFocus autoComplete="off" enterKeyHint="search" />
        <button type="submit" className="fs-btn fs-btn-primary" aria-label="Search"><MagnifyingGlass size={20} aria-hidden /><span className="fs-desk-only">Search</span></button>
      </form>
      {!q ? <p className="fs-t-meta" style={{ marginTop: 16 }}>A name, a username, a city, or a car make or model.</p>
        : failed ? <p className="fs-t-body" style={{ marginTop: 16 }}><span className="fs-status is-problem">Search could not be completed.</span> Try again.</p>
        : people.length === 0 && cars.length === 0 ? (
          <div style={{ marginTop: 24, maxWidth: 480 }}>
            <p className="fs-t-task">Nothing matches &ldquo;{q}&rdquo;.</p>
            <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>People are found by name, username or city. Cars by make, model or city.</p>
          </div>
        ) : (
          <>
            {people.length > 0 && (
              <section aria-labelledby="people-title" style={{ marginTop: 16 }}>
                <h2 id="people-title" className="fs-t-section">People <span className="fs-t-meta">· {people.length}</span></h2>
                <div className="fs-people-grid fs-desk-only">{shownPeople.map((s) => <PersonSpread key={s.person.id} s={s} canRequest={s.person.id !== ctx.user.id} />)}</div>
                <ul className="fs-people-list fs-phone-only">{shownPeople.map((s) => <li key={s.person.id}><PersonAssembly s={s} canRequest={s.person.id !== ctx.user.id} /></li>)}</ul>
              </section>
            )}
            {cars.length > 0 && (
              <section aria-labelledby="cars-title" style={{ marginTop: 32 }}>
                <h2 id="cars-title" className="fs-t-section">Cars <span className="fs-t-meta">· {cars.length}</span></h2>
                <ul className="fs-car-list fs-car-grid">{cars.map((c, i) => <li key={c.id}><CarAssembly c={c} priority={i < 3} /></li>)}</ul>
              </section>
            )}
          </>
        )}
    </main>
  );
}
