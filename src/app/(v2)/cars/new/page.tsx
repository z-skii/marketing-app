import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { VehicleWizard } from "./VehicleWizard";

export const metadata = { title: "List your car" };
export const dynamic = "force-dynamic";

export default async function NewVehiclePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <Link href="/cars" className="font-mono text-xs text-ink-faint hover:text-ink">← Car Ads</Link>
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
