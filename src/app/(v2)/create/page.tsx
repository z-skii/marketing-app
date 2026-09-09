import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { EmptyState } from "@/components/v2/ui";
import { CreateWizard } from "./CreateWizard";

export const metadata = { title: "Create" };
export const dynamic = "force-dynamic";

/** The + Create flow for businesses: a campaign or job, step by step. */
export default async function CreatePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

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
          />
        </div>
      )}
    </main>
  );
}
