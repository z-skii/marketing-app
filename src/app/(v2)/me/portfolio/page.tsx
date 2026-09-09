import Link from "next/link";
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
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <Link href="/me" className="font-mono text-xs text-ink-faint hover:text-ink">← Profile</Link>
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Portfolio</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Your best work — businesses see this when you apply.
      </p>
      <section className="mt-4">
        <SectionTitle count={items.length}>Items</SectionTitle>
        <PortfolioManager items={items} />
      </section>
    </main>
  );
}
