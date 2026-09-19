import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { listCarsForBusiness, listPeople, type Car, type Person } from "@/lib/v2/marketplace";
import { listShoots } from "@/lib/business/shoots";
import { PersonCard, CarCard } from "@/components/app/BusinessCards";
import { Count } from "@/components/app/Count";
import { PinIcon, ArrowRightIcon, CheckCircleIcon, ImageIcon, MegaphoneIcon, CameraIcon, SparkleIcon, LightningIcon } from "@/ds/icons";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * Business Home answers three questions with real records: what needs my
 * attention (decisions waiting, files to approve), what is working (open
 * campaigns, the next shoot), what should I do next (one recommended
 * action derived from those counts). Then the marketplace: real people
 * and real listed cars as objects, with the same queries, ranking, views
 * and request flows as before. No count is invented; Loyalty is a coming
 * soon row.
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

  const [details, attention, shoots] = await Promise.all([
    sqlOne<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]),
    sqlOne<{ decisions: string; files: string; open: string; running_cars: string }>(
      `select
         ((select count(*) from applications a join campaigns c on c.id = a.campaign_id where c.business_id = $1 and a.status = 'applied')
        + (select count(*) from submissions s join campaigns c on c.id = s.campaign_id where c.business_id = $1 and s.status in ('submitted', 'under_review')))::text as decisions,
         (select count(*) from content_deliverables d where d.business_id = $1 and d.status = 'new')::text as files,
         (select count(*) from campaigns c where c.business_id = $1 and c.status = 'open')::text as open,
         (select count(*) from car_bookings k where k.business_id = $1 and k.status = 'active')::text as running_cars`,
      [business.id],
    ),
    listShoots(business.id, 6).catch(() => []),
  ]);
  const city = details?.city ?? null;
  const base = { businessId: business.id, viewerId: ctx.user.id, viewerCity: city };

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
  const open = Number(attention?.open ?? 0);
  const runningCars = Number(attention?.running_cars ?? 0);
  const nextShoot = shoots.find((s) => s.status === "scheduled" && s.scheduled_for) ?? shoots.find((s) => s.status === "planned") ?? null;
  const shootLabel = nextShoot?.scheduled_for ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${nextShoot.scheduled_for}T00:00:00Z`)) : nextShoot ? "Being scheduled" : "None booked";
  const nearbyNoCity = tab === "nearby" && !city;
  const showPeople = !nearbyNoCity && tab !== "cars";
  const showCars = !nearbyNoCity && tab !== "people";

  const next = decisions > 0
    ? { href: "/business/campaigns?view=review", title: `Decide on ${decisions} submission${decisions === 1 ? "" : "s"}`, body: "Creators and drivers are waiting on you.", cta: "Review" }
    : files > 0
      ? { href: "/business/content", title: `Approve ${files} delivered file${files === 1 ? "" : "s"}`, body: "New content from your shoot is ready to check.", cta: "Open Content" }
      : open === 0
        ? { href: "/business/create", title: "Start your first campaign", body: "Recreate, Story or Car, set up one decision at a time.", cta: "Create" }
        : { href: "/business/content", title: "Everything is moving", body: `${open} open campaign${open === 1 ? "" : "s"}. Check what is scheduled this week.`, cta: "Content" };

  return (
    <main className="fs-phone-main" id="main">
      <div className="ap-head">
        <div><h1>{business.name}</h1><p className="ap-sub">What needs your attention, what is working, what to do next.</p></div>
        <Link href="/business/edit" className="btn btn-sm shrink-0" aria-label={city ? `Business city ${city}. Change it` : "Add your business city"}><PinIcon size={16} aria-hidden />{city ?? "Add your city"}</Link>
      </div>

      <div className="ap-attention" aria-label="Attention">
        <Link href="/business/campaigns?view=review" className={`ap-attn ${decisions > 0 ? "is-hot" : ""}`}><span className="ap-attn-icon"><CheckCircleIcon size={18} aria-hidden /></span><b><Count value={decisions} /></b><span>Needs approval</span></Link>
        <Link href="/business/content" className={`ap-attn ${files > 0 ? "is-hot" : ""}`}><span className="ap-attn-icon"><ImageIcon size={18} aria-hidden /></span><b><Count value={files} /></b><span>Content ready</span></Link>
        <Link href="/business/campaigns" className="ap-attn"><span className="ap-attn-icon"><MegaphoneIcon size={18} aria-hidden /></span><b><Count value={open} /></b><span>Active campaigns{runningCars > 0 ? ` · ${runningCars} car${runningCars === 1 ? "" : "s"} on the road` : ""}</span></Link>
        <Link href="/business/content?view=shoots" className="ap-attn"><span className="ap-attn-icon"><CameraIcon size={18} aria-hidden /></span><b style={{ fontSize: 20 }}>{shootLabel}</b><span>Next shoot</span></Link>
      </div>
      <Link href={next.href} className="ap-next">
        <span className="ap-next-icon"><LightningIcon size={20} aria-hidden /></span>
        <span style={{ minWidth: 0 }}><b>{next.title}</b><span>{next.body}</span></span>
        <span className="btn btn-glass is-dark btn-sm">{next.cta} <ArrowRightIcon size={14} aria-hidden /></span>
      </Link>

      <section className="ap-section" aria-labelledby="market-h">
        <div className="ap-section-head"><h2 id="market-h">Find people and cars</h2></div>
        <nav className="ap-chips" aria-label="Discovery" style={{ marginTop: 0 }}>
          {TABS.map((t) => <Link key={t.key} href={href(t.key)} className="pill" aria-current={tab === t.key ? "page" : undefined}>{t.label}</Link>)}
        </nav>

        {nearbyNoCity && (
          <div className="card" style={{ marginTop: 16, padding: 20, maxWidth: 560 }}>
            <p className="t-h3">Nearby needs your business city.</p>
            <p className="t-body" style={{ marginTop: 6, color: "var(--tm-text2)" }}>People and cars are matched to the city on your business profile.</p>
            <Link href="/business/edit" className="btn btn-signal" style={{ marginTop: 16 }}>Add your city</Link>
          </div>
        )}

        {!nearbyNoCity && (
          <div className="ap-grid" aria-label="People and cars">
            {showPeople && (peopleFailed ? (
              <p className="t-body"><span className="badge is-alert">People could not be loaded.</span> <Link href={href(tab)} className="link-row">Try again</Link></p>
            ) : shownPeople.length === 0 ? (
              <div className="card" style={{ padding: 20 }}><p className="t-h3">{tab === "nearby" ? `Nobody in ${city} is earning on TapMart yet.` : "Nobody is earning on TapMart yet."}</p><p className="t-meta" style={{ marginTop: 6 }}>People appear here as they join and share work.</p></div>
            ) : shownPeople.map((p, i) => <PersonCard key={p.id} p={p} canRequest={p.id !== ctx.user.id} lead={i === 0 && tab === "for_you"} priority={i === 0} />))}
            {showCars && (carsFailed ? (
              <p className="t-body"><span className="badge is-alert">Cars could not be loaded.</span> <Link href={href(tab)} className="link-row">Try again</Link></p>
            ) : shownCars.length === 0 ? (
              <div className="card" style={{ padding: 20 }}><p className="t-h3">{tab === "nearby" ? `No cars in ${city} are listed for ads yet.` : "No cars are listed for ads yet."}</p><p className="t-meta" style={{ marginTop: 6 }}>Owners list their cars with the placements they offer and an asking price.</p></div>
            ) : shownCars.map((c, i) => <CarCard key={c.id} c={c} priority={i === 0 && !showPeople} />))}
          </div>
        )}

        {tab === "for_you" && !nearbyNoCity && (people.length > 4 || cars.length > 0) && (
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {people.length > 4 && <Link href={href("people")} className="btn">See all people <ArrowRightIcon size={16} aria-hidden /></Link>}
            {cars.length > 0 && <Link href={href("cars")} className="btn">See all cars <ArrowRightIcon size={16} aria-hidden /></Link>}
          </div>
        )}

        {(hasMore || offset > 0) && (tab === "cars" || tab === "people") && (
          <div className="ap-pager">
            {offset > 0 ? <Link href={href(tab, Math.max(offset - pageSize, 0))} className="btn">Newer</Link> : <span />}
            {hasMore && <Link href={href(tab, offset + pageSize)} className="btn btn-dark">More <ArrowRightIcon size={16} aria-hidden /></Link>}
          </div>
        )}
      </section>

      <section className="ap-section" aria-label="More">
        <Link href="/business/loyalty" className="ap-note">
          <SparkleIcon size={20} aria-hidden style={{ color: "var(--tm-info)" }} />
          <span className="ap-note-text"><b style={{ fontWeight: 600 }}>Loyalty</b> <span className="badge is-ink" style={{ marginLeft: 6, minHeight: 22 }}>Coming soon</span><span className="t-meta" style={{ display: "block" }}>A Wallet stamp card for repeat customers.</span></span>
          <ArrowRightIcon size={18} aria-hidden style={{ color: "var(--tm-red)" }} />
        </Link>
      </section>
    </main>
  );
}
