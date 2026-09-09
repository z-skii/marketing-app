import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { StatusChip } from "@/components/v2/ui";
import { CreatorForm } from "./CreatorForm";

export const metadata = { title: "Verification" };
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
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Verification</h1>
        <StatusChip status={cp?.verification ?? "unverified"} />
      </div>
      <p className="mt-1 text-[0.9375rem] text-ink-soft">
        The verified mark tells businesses a real person checked your account.
        Verified people get picked first for Reels, Stories and car campaigns.
      </p>
      {cp?.verification === "rejected" && cp.verification_note && (
        <div className="card card-signal mt-4 p-4">
          <p className="font-display text-[0.9375rem] font-700">Verification feedback</p>
          <p className="mt-1 text-sm text-ink-soft">{cp.verification_note}</p>
        </div>
      )}
      <CreatorForm
        initial={{
          portfolioUrl: cp?.portfolio_url ?? "",
          verification: cp?.verification ?? "unverified",
        }}
      />
    </main>
  );
}
