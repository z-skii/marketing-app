import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { StatusChip } from "@/components/v2/ui";
import { CreatorForm } from "./CreatorForm";

export const metadata = { title: "Creator profile" };
export const dynamic = "force-dynamic";

export default async function CreatorProfilePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const cp = await sqlOne<{
    categories: string[]; service_radius_miles: number | null; portfolio_url: string | null;
    equipment: string | null; pricing_note: string | null; verification: string;
    verification_note: string | null;
  }>(
    `select categories, service_radius_miles, portfolio_url, equipment, pricing_note,
            verification::text as verification, verification_note
       from creator_profiles where profile_id = $1`,
    [ctx.user.id],
  );

  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 py-5 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Creator profile</h1>
        <StatusChip status={cp?.verification ?? "unverified"} />
      </div>
      <p className="mt-1 text-sm text-ink-faint">
        Verified creators can take professional jobs — photoshoots, video work,
        anything a business needs done in person.
      </p>
      {cp?.verification === "rejected" && cp.verification_note && (
        <p className="mt-2 border border-signal p-3 text-xs">
          Verification feedback: {cp.verification_note}
        </p>
      )}
      <CreatorForm
        initial={{
          categories: cp?.categories ?? [],
          serviceRadius: cp?.service_radius_miles ?? null,
          portfolioUrl: cp?.portfolio_url ?? "",
          equipment: cp?.equipment ?? "",
          pricingNote: cp?.pricing_note ?? "",
          verification: cp?.verification ?? "unverified",
        }}
      />
    </main>
  );
}
