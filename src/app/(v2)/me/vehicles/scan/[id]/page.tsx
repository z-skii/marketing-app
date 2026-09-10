import { notFound } from "next/navigation";
import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { devAuthEnabled } from "@/lib/supabase";
import { getScan } from "@/lib/vehicles/scans";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";
import { ScanStatus } from "./ScanStatus";

export const metadata = { title: "Your scan" };
export const dynamic = "force-dynamic";

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;
  const scan = await getScan(id, ctx.user.id);
  if (!scan) notFound();

  const photos = scan.capture.photos ?? [];
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <div className="mt-3">
        <VehicleStage glbUrl={scan.model?.glb_url ?? null} posterUrl={scan.model?.poster_url ?? photos[0]?.url ?? null} photos={photos} label={scan.model?.quality_label ?? null} compact />
      </div>
      <h1 className="mt-4 font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em]">Processing vehicle scan</h1>
      <div className="mt-4">
        <ScanStatus initial={scan} devMode={devAuthEnabled()} />
      </div>
    </main>
  );
}
