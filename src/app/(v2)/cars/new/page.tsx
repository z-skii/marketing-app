import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { VehicleWizard } from "./VehicleWizard";

export const metadata = { title: "List your car" };
export const dynamic = "force-dynamic";

export default async function NewVehiclePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <BackButton fallback="/cars" label="Car Ads" />
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">
        Earn with your car
      </h1>
      <p className="mt-1 text-sm text-ink-faint">
        Businesses pay monthly for ad space on cars like yours.
      </p>
      <div className="mt-5">
        <VehicleWizard defaultCity={ctx.city ?? ""} />
      </div>
    </main>
  );
}
