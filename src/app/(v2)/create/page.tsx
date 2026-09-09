import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne, sql } from "@/lib/db";
import { EmptyState } from "@/components/v2/ui";
import { CreateWizard } from "./CreateWizard";

export const metadata = { title: "Create" };
export const dynamic = "force-dynamic";

type Prefill = {
  kind?: string; title?: string; brief?: string; payDollars?: number;
  slots?: number; requirements?: string[];
};

/** The + Create flow for businesses: a campaign or job, step by step. */
export default async function CreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;

  // "Turn this into a campaign": a marketing idea pre-fills the wizard.
  let initialDraft: Record<string, string> | undefined;
  if (params.rec && ctx.businesses.length > 0) {
    const rec = await sqlOne<{ prefill: Prefill }>(
      `select prefill from marketing_recommendations r
        where r.id = $1 and r.business_id = any($2::uuid[])`,
      [params.rec, ctx.businesses.map((b) => b.id)],
    );
    if (rec?.prefill) {
      const p = rec.prefill;
      initialDraft = {
        kind: p.kind ?? "ugc",
        title: p.title ?? "",
        brief: p.brief ?? "",
        payDollars: p.payDollars ? String(p.payDollars) : "",
        slots: p.slots ? String(p.slots) : "1",
        requirements: (p.requirements ?? []).join("\n"),
      };
      await sql(`update marketing_recommendations set status = 'used' where id = $1`, [params.rec]);
    }
  }

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <Link href="/home" className="font-mono text-xs text-ink-faint hover:text-ink">← Home</Link>
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Create</h1>

      {ctx.businesses.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Add your business first"
            body="Campaigns and jobs are posted by a business. Adding yours takes under a minute."
            actionHref="/business/new"
            actionLabel="Add business"
          />
        </div>
      ) : (
        <div className="mt-5">
          <CreateWizard
            businesses={ctx.businesses.map((b) => ({ id: b.id, name: b.name }))}
            defaultCity={ctx.city ?? ""}
            initialDraft={initialDraft}
          />
        </div>
      )}
    </main>
  );
}
