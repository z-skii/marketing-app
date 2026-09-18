import Link from "next/link";
import { ArrowRight, CaretRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { listCarsForBusiness, listPeople, type Car, type Person } from "@/lib/v2/marketplace";
import { personName, provenance } from "@/components/fs/business/People";
import { carName, zoneLine } from "@/components/fs/business/Cars";
import { formatMoney } from "@/components/fs/parts";
import { PlaneMedia } from "@/v3/app/parts";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * Business Home in the approved V3 language: WHO CAN MARKET MY BUSINESS.
 * Real people as objects on the dark stage (portrait plane, their own
 * work stills, the terms sheet with View person and Request), real
 * listed cars as photographic planes with the asking rate attached. Same
 * real queries, ranking, views and request flows as before; the
 * attention lines and the discovery filters stay above the stage. No
 * count is invented; Loyalty is reachable as a coming soon row.
 */
type Tab = "for_you" | "people" | "cars" | "nearby";
const TABS: { key: Tab; label: string }[] = [
  { key: "for_you", label: "For you" },
  { key: "people", label: "People" },
  { key: "cars", label: "Cars" },
  { key: "nearby", label: "Nearby" },
];

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
      : listCarsForBusiness({ ...base, nearby: tab === "nearby", limit: tab === "cars" ? pageSize + 1 : 4, offset: tab === "cars" ? offset : 0 }),
  ]);
  const people = peopleResult.status === "fulfilled" ? peopleResult.value : [];
  const cars = carsResult.status === "fulfilled" ? carsResult.value : [];
  const peopleFailed = peopleResult.status === "rejected";
  const carsFailed = carsResult.status === "rejected";

  const paged = tab === "cars" ? cars : people;
  const hasMore = paged.length > pageSize;
  const shownPeople = people.slice(0, tab === "for_you" ? 4 : pageSize);
  const shownCars = tab === "cars" ? cars.slice(0, pageSize) : cars;
  const href = (key: Tab, off = 0) => `/business${key === "for_you" && !off ? "" : `?tab=${key}${off ? `&offset=${off}` : ""}`}`;
  const decisions = Number(attention?.decisions ?? 0);
  const files = Number(attention?.files ?? 0);
  const nearbyNoCity = tab === "nearby" && !city;
  const showPeople = !nearbyNoCity && tab !== "cars";
  const showCars = !nearbyNoCity && tab !== "people";
  const [lead, ...others] = shownPeople;
  const [leadCar, ...otherCars] = shownCars;

  return (
    <main className="fs-phone-main" id="main">
      <div className="v3 xs-wrap">
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

        <nav className="fs-filters is-work" aria-label="Discovery" style={{ marginTop: 8, marginBottom: 16 }}>
          {TABS.map((t) => <Link key={t.key} href={href(t.key)} aria-current={tab === t.key ? "page" : undefined}>{t.label}</Link>)}
        </nav>

        {nearbyNoCity && (
          <div style={{ marginTop: 24, maxWidth: 480 }}>
            <p className="fs-t-task">Nearby needs your business city.</p>
            <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>People and cars are matched to the city on your business profile.</p>
            <Link href="/business/edit" className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>Add your city</Link>
          </div>
        )}

        {!nearbyNoCity && (
          <section className="xs-stage xs-biz" aria-label="People and cars">
            {/* People: the lead person as the full object, the others as smaller objects in the same language */}
            {showPeople && (peopleFailed ? (
              <p className="t-body xs-biz-note"><span className="state bad">People could not be loaded.</span> <Link href={href(tab)} className="link t-action">Try again</Link></p>
            ) : !lead ? (
              <div className="xs-biz-note"><p className="t-object">{tab === "nearby" ? `Nobody in ${city} is earning on TapMart yet.` : "Nobody is earning on TapMart yet."}</p><p className="t-fact">People appear here as they join and share work.</p></div>
            ) : (
              <>
                <PersonObject p={lead} canRequest={lead.id !== ctx.user.id} lead />
              </>
            ))}

            {/* Cars: physical advertising inventory, the asking rate attached to the photograph */}
            {showCars && (carsFailed ? (
              <p className="t-body xs-biz-note xs-car"><span className="state bad">Cars could not be loaded.</span> <Link href={href(tab)} className="link t-action">Try again</Link></p>
            ) : !leadCar ? (
              <div className="xs-biz-note xs-car"><p className="t-object">{tab === "nearby" ? `No cars in ${city} are listed for ads yet.` : "No cars are listed for ads yet."}</p><p className="t-fact">Owners list their cars with the placements they offer and an asking price.</p></div>
            ) : (
              <>
                <CarObject c={leadCar} priority />
              </>
            ))}
            {/* the further people and cars follow in the same language */}
            {showPeople && !peopleFailed && others.length > 0 && <div className="xs-biz-more">{others.map((p) => <PersonObject key={p.id} p={p} canRequest={p.id !== ctx.user.id} />)}</div>}
            {showCars && !carsFailed && otherCars.length > 0 && <div className="xs-biz-more xs-biz-more-cars">{otherCars.map((c) => <CarObject key={c.id} c={c} />)}</div>}
          </section>
        )}

        {tab === "for_you" && !nearbyNoCity && (people.length > 4 || cars.length > 0) && (
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {people.length > 4 && <Link href={href("people")} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>See all people <ArrowRight size={18} aria-hidden /></Link>}
            {cars.length > 0 && <Link href={href("cars")} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>See all cars <ArrowRight size={18} aria-hidden /></Link>}
          </div>
        )}

        {(hasMore || offset > 0) && (tab === "cars" || tab === "people") && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 24, maxWidth: 480 }}>
            {offset > 0 ? <Link href={href(tab, Math.max(offset - pageSize, 0))} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>Newer</Link> : <span />}
            {hasMore && <Link href={href(tab, offset + pageSize)} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>More</Link>}
          </div>
        )}

        <section aria-label="More" style={{ marginTop: 32 }}>
          <Link href="/business/loyalty" className="fs-row-link" style={{ minHeight: 56 }}>
            <span className="fs-t-body">Loyalty <span className="fs-status is-neutral">· Coming soon</span></span>
            <CaretRight size={20} aria-hidden style={{ color: "var(--fs-muted)", flexShrink: 0 }} />
          </Link>
        </section>
      </div>
    </main>
  );
}

function portraitSrc(p: Person) {
  return p.avatar_url ?? (p.instagram?.status === "connected" ? p.instagram.avatar_url : null) ?? null;
}

/** A person as an object: the portrait plane, up to two of their own work stills, the sheet with who they are, View person and Request. */
function PersonObject({ p, canRequest, lead = false }: { p: Person; canRequest: boolean; lead?: boolean }) {
  const name = personName(p);
  const stills = p.samples.slice(0, lead ? 2 : 1);
  const facts = [p.city, p.completed_jobs > 0 ? `${p.completed_jobs} completed` : null, p.rating_count > 0 && p.rating_avg != null ? `${p.rating_avg.toFixed(1)} rating · ${p.rating_count} review${p.rating_count === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ");
  return (
    <article className={`xs-obj xs-person${lead ? " xs-person-lead" : ""}`} aria-labelledby={`person-${p.id}-t`}>
      <div className="xs-person-media">
        <Link href={`/business/people/${p.username}`} className="xs-plane xs-person-portrait" aria-label={`View person ${name}`}>
          <PlaneMedia src={portraitSrc(p)} alt="" sizes="(min-width: 1024px) 280px, 226px" priority={lead} fallback="No portrait" tag={p.has_listed_vehicle ? "Vehicle listed" : undefined} />
        </Link>
        {stills.length > 0 && (
          <div className="xs-person-work">
            {stills.map((s, i) => (
              <span key={s.url} className={`xs-plane xs-plane-back xs-person-still xs-person-still-${i}`} style={{ cursor: "default" }}>
                <PlaneMedia src={s.url} alt={`${name}: ${s.title}`} sizes="224px" fallback="No file" tag={s.kind === "approved" ? "Approved work" : "Portfolio"} />
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="x-paper xs-sheet">
        <h2 id={`person-${p.id}-t`} className="t-object">{name}</h2>
        <span className="t-fact">{provenance(p)}</span>
        {facts && <span className="t-fact">{facts}</span>}
        <span className="xs-sheet-row">
          <Link href={`/business/people/${p.username}`} className="link t-action">View person</Link>
          {canRequest && <Link href={`/business/people/${p.username}?request=story`} className="btn btn-primary">Request</Link>}
        </span>
      </div>
    </article>
  );
}

/** A car as an object: the photograph with the placement tagged, the asking rate and the placements attached. */
function CarObject({ c, priority = false }: { c: Car; priority?: boolean }) {
  const still = c.stage.posterUrl ?? c.stage.photos[0]?.url ?? null;
  const priced = c.zones.filter((z) => z.asking_cents != null);
  const min = priced.length ? Math.min(...priced.map((z) => z.asking_cents as number)) : null;
  const name = carName(c);
  return (
    <article className="xs-obj xs-car" aria-labelledby={`car-${c.id}-t`}>
      <Link href={`/business/cars/${c.id}`} className="xs-plane" aria-label={`View ${c.owner_name}'s ${name}`}>
        <PlaneMedia src={still} alt="" sizes="(min-width: 1024px) 376px, 100vw" priority={priority} fallback="No photo yet" tag="Car" tagBr={zoneLine(c)} />
      </Link>
      <div className="x-paper xs-sheet">
        <span className="t-fact">{c.owner_name}{c.city ? <><span aria-hidden> · </span>{c.city}</> : null}{c.stage.glbUrl ? <><span aria-hidden> · </span>3D model</> : null}</span>
        {min != null ? (
          <span className="xs-money"><span className="x-money-hero">{formatMoney(min).replace(/\.00$/, "")}</span><span className="t-fact-ink">{priced.length > 1 ? `from, /month` : "/month asking"}</span></span>
        ) : <span className="t-fact-ink">Asking price to be agreed</span>}
        {priced.length > 1 && <span className="t-fact-ink">{priced.length} placements priced</span>}
        <span className="xs-sheet-row">
          <h2 id={`car-${c.id}-t`} className="t-object">{name}{c.color ? <span className="t-fact"> · {c.color}</span> : null}</h2>
          <Link href={`/business/cars/${c.id}`} className="link t-action">View</Link>
        </span>
      </div>
    </article>
  );
}
