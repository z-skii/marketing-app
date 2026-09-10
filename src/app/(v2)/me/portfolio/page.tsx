import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { SectionTitle } from "@/components/v2/ui";
import { PortfolioManager } from "./PortfolioManager";

export const metadata = { title: "Portfolio" };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const items = await sql<{ id: string; media_url: string; caption: string | null }>(
    `select id, media_url, caption from portfolio_items
      where profile_id = $1 order by sort, created_at desc`,
    [ctx.user.id],
  );
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <h1 className="mt-3 font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">Portfolio</h1>
      <p className="mt-1 text-[0.9375rem] text-ink-soft">
        Your best work. Businesses see this when you apply.
      </p>
      <section className="mt-6">
        <SectionTitle count={items.length}>Your work</SectionTitle>
        <PortfolioManager items={items} />
      </section>
    </main>
  );
}
