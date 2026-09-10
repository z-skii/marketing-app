import { BackButton } from "@/components/v2/BackButton";
import { sqlOne } from "@/lib/db";
import { requireBusinessContext } from "@/lib/v2/core";
import { getBrandKit } from "@/lib/business/brand";
import { getGoogleProfileSnapshot } from "@/lib/google/business";
import { googleConfigured } from "@/lib/google/oauth";
import { getInstagramBusiness } from "@/lib/social/instagram-business";
import { metaConfigured } from "@/lib/social/meta";
import { connectionState } from "@/lib/social/summary";
import { BrandStudio } from "./BrandStudio";

export const metadata = { title: "Your brand" };
export const dynamic = "force-dynamic";

/**
 * Your brand: the approved kit as a visual, or the research flow that
 * builds one from real sources (connected Instagram, the Google listing,
 * the website, the logo, uploaded photos). A proposal never replaces the
 * kit in use until it is approved.
 */
export default async function BrandPage() {
  const ctx = await requireBusinessContext("/business/brand");
  const business = ctx.activeBusiness;
  const [record, ig, google, details] = await Promise.all([
    getBrandKit(business.id),
    getInstagramBusiness(business.id),
    getGoogleProfileSnapshot(business.id),
    sqlOne<{ website: string | null; logo_url: string | null }>(`select website, logo_url from businesses where id = $1`, [business.id]),
  ]);
  const igState = connectionState(ig);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">Your brand</h1>
      <BrandStudio
        record={record}
        businessName={business.name}
        sources={{
          instagram: { connected: igState === "connected" && ig?.source === "oauth", handle: igState === "connected" ? ig?.external_name ?? null : null, configured: metaConfigured() },
          google: { connected: Boolean(google), title: google?.name ?? null, configured: googleConfigured() },
          website: details?.website ?? null,
          logoUrl: details?.logo_url ?? record.kit.logo_url ?? null,
        }}
        canEdit={business.member_role === "owner" || business.member_role === "manager" || ctx.user.role === "admin"}
      />
    </main>
  );
}
