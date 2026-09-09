import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { EmptyState, Money, SectionTitle, StatusChip } from "@/components/v2/ui";
import { ZONE_LABELS } from "../../cars/zones";

export const metadata = { title: "Car campaigns" };
export const dynamic = "force-dynamic";

/** The business's car advertising: offers in flight and running bookings. */
export default async function BusinessCarAdsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const ids = ctx.businesses.map((b) => b.id);

  const [offers, bookings] = ids.length
    ? await Promise.all([
        sql<{ id: string; vehicle_id: string; vehicle: string; status: string; monthly_cents: number; counter_cents: number | null; zones: string[] }>(
          `select o.id, o.vehicle_id, v.year || ' ' || v.make || ' ' || v.model as vehicle,
                  o.status::text as status, o.monthly_cents::int as monthly_cents,
                  o.counter_cents::int as counter_cents, o.zones::text[] as zones
             from car_offers o join vehicles v on v.id = o.vehicle_id
            where o.business_id = any($1::uuid[]) and o.status in ('sent', 'countered')
            order by o.created_at desc`,
          [ids],
        ),
        sql<{ id: string; vehicle_id: string; vehicle: string; status: string; monthly_cents: number; zones: string[] }>(
          `select k.id, k.vehicle_id, v.year || ' ' || v.make || ' ' || v.model as vehicle,
                  k.status::text as status, k.monthly_cents::int as monthly_cents, k.zones::text[] as zones
             from car_bookings k join vehicles v on v.id = k.vehicle_id
            where k.business_id = any($1::uuid[])
            order by k.created_at desc`,
          [ids],
        ),
      ])
    : [[], []];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business" label="Business" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Car campaigns</h1>
        <Link href="/cars?tab=browse" className="btn btn-signal btn-sm shrink-0">Find cars</Link>
      </div>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">Offers you sent to drivers, and the cars already carrying your name.</p>

      <section className="mt-6">
        <SectionTitle count={offers.length}>Offers in flight</SectionTitle>
        {offers.length === 0 && <p className="mt-3 text-sm text-ink-faint">No open offers.</p>}
        <ul className="row-list mt-3">
          {offers.map((o) => (
            <li key={o.id}>
              <Link href={`/cars/${o.vehicle_id}`} className={`card flex items-center gap-3 p-4 ${o.status === "countered" ? "card-signal" : ""}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{o.vehicle}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusChip status={o.status} />
                    <span className="text-sm text-ink-faint">
                      {o.zones.map((z) => ZONE_LABELS[z] ?? z).join(" + ")}
                      {o.counter_cents != null && `  ·  Countered $${Math.round(o.counter_cents / 100)} a month`}
                    </span>
                  </span>
                </span>
                <Money cents={o.monthly_cents} size="sm" suffix="/ mo" />
                <span aria-hidden className="text-ink-faint">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <SectionTitle count={bookings.length}>Bookings</SectionTitle>
        {bookings.length === 0 && (
          <div className="mt-3">
            <EmptyState
              title="No car campaigns yet"
              body="Real cars driving your name around town. Browse what is available near you."
              actionHref="/cars?tab=browse" actionLabel="Browse cars"
            />
          </div>
        )}
        <ul className="row-list mt-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/cars/${b.vehicle_id}`} className="card flex items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{b.vehicle}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusChip status={b.status} />
                    <span className="text-sm text-ink-faint">
                      {b.zones.map((z) => ZONE_LABELS[z] ?? z).join(" + ")}
                    </span>
                  </span>
                </span>
                <Money cents={b.monthly_cents} size="sm" suffix="/ mo" />
                <span aria-hidden className="text-ink-faint">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
