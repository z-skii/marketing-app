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
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <BackButton fallback="/business" label="Business" />
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Car campaigns</h1>
        <Link href="/cars?tab=browse" className="btn btn-signal !px-4 !py-2 text-xs">Find cars</Link>
      </div>

      <section className="mt-4">
        <SectionTitle count={offers.length}>Offers in flight</SectionTitle>
        {offers.length === 0 && <p className="mt-2 font-mono text-xs text-ink-faint">No open offers.</p>}
        <ul className="mt-2 flex flex-col gap-2">
          {offers.map((o) => (
            <li key={o.id}>
              <Link href={`/cars/${o.vehicle_id}`} className="flex items-center gap-3 border border-rule p-3 hover:border-ink">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-800">{o.vehicle}</span>
                  <span className="font-mono text-[0.625rem] text-ink-faint">
                    {o.zones.map((z) => ZONE_LABELS[z] ?? z).join(" + ")}
                    {o.counter_cents != null && ` · countered $${Math.round(o.counter_cents / 100)}/mo`}
                  </span>
                </span>
                <StatusChip status={o.status} />
                <Money cents={o.monthly_cents} suffix="/mo" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rule mt-6 pt-5">
        <SectionTitle count={bookings.length}>Bookings</SectionTitle>
        {bookings.length === 0 && (
          <div className="mt-2">
            <EmptyState
              title="No car campaigns yet"
              body="Real cars driving your name around town — browse what's available near you."
              actionHref="/cars?tab=browse" actionLabel="Browse cars"
            />
          </div>
        )}
        <ul className="mt-2 flex flex-col gap-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/cars/${b.vehicle_id}`} className="flex items-center gap-3 border border-rule p-3 hover:border-ink">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-800">{b.vehicle}</span>
                  <span className="font-mono text-[0.625rem] text-ink-faint">
                    {b.zones.map((z) => ZONE_LABELS[z] ?? z).join(" + ")}
                  </span>
                </span>
                <StatusChip status={b.status} />
                <Money cents={b.monthly_cents} suffix="/mo" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
