import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { devAuthEnabled } from "@/lib/supabase";
import { sqlOne } from "@/lib/db";
import { ScanCapture } from "./ScanCapture";

export const metadata = { title: "Scan my car" };
export const dynamic = "force-dynamic";

/**
 * Guided vehicle scan. `?vehicle=<id>` attaches the scan to a car that is
 * already on the profile; otherwise the scan creates the car.
 */
export default async function ScanPage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  let vehicleId: string | null = null;
  if (params.vehicle) {
    const own = await sqlOne<{ id: string }>(`select id from vehicles where id = $1 and owner_id = $2`, [params.vehicle, ctx.user.id]);
    vehicleId = own?.id ?? null;
  }
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <h1 className="mt-3 font-display text-[1.5rem] leading-[1.05] font-700 tracking-[-0.02em] md:text-[1.5rem]">Scan your car</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Walk around it and take a photo at each marker.</p>
      <div className="mt-6">
        <ScanCapture vehicleId={vehicleId} devMode={devAuthEnabled()} />
      </div>
    </main>
  );
}
