import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { getBrandKit } from "@/lib/business/brand";
import { BrandStudio } from "./BrandStudio";

export const metadata = { title: "Your brand" };
export const dynamic = "force-dynamic";

/**
 * Your brand: the approved kit as a visual, or the choice to build or refine
 * one. A proposal (from the model or a template) sits below the kit and
 * changes nothing until it is approved.
 */
export default async function BrandPage() {
  const ctx = await requireBusinessContext("/business/brand");
  const business = ctx.activeBusiness;
  const record = await getBrandKit(business.id);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Your brand</h1>
      <BrandStudio
        record={record}
        businessName={business.name}
        businessLogo={business.logo_url}
        canEdit={business.member_role === "owner" || business.member_role === "manager" || ctx.user.role === "admin"}
      />
    </main>
  );
}
