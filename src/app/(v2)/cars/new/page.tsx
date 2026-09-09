import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { VehicleWizard } from "./VehicleWizard";

export const metadata = { title: "List your car" };
export const dynamic = "force-dynamic";

export default async function NewVehiclePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/cars" label="Car Ads" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">
        Earn with your car
      </h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">
        Businesses pay monthly for ad space on cars like yours.
      </p>
      <div className="mt-6">
        <VehicleWizard defaultCity={ctx.city ?? ""} />
      </div>
    </main>
  );
}
