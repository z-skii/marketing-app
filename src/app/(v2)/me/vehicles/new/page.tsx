import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { safeReturnPath } from "@/lib/v2/paths";
import { VehicleWizard } from "./VehicleWizard";

export const metadata = { title: "Earn with your car" };
export const dynamic = "force-dynamic";

/** Add a vehicle. `?return=/o/<id>` sends the person back to the campaign afterwards. */
export default async function NewVehiclePage({
  searchParams,
}: { searchParams: Promise<{ return?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  const returnTo = safeReturnPath(params.return);
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback={returnTo ?? "/me/vehicles"} label={returnTo ? "Campaign" : "My vehicles"} />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">
        Earn with your car
      </h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">
        Businesses pay monthly to put their ad on cars like yours. Add it once, then apply to campaigns from Home.
      </p>
      <div className="mt-6">
        <VehicleWizard defaultCity={ctx.city ?? ""} returnTo={returnTo} />
      </div>
    </main>
  );
}
