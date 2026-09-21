import { sqlOne } from "@/lib/db";
import { requireBusinessContext } from "@/lib/v2/core";
import { getBrandKit } from "@/lib/business/brand";
import { getGoogleProfileSnapshot } from "@/lib/google/business";
import { googleConfigured } from "@/lib/google/oauth";
import { getInstagramBusiness } from "@/lib/social/instagram-business";
import { metaConfigured } from "@/lib/social/meta";
import { connectionState } from "@/lib/social/summary";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { BrandKitStudio } from "@/components/fs/business/BrandKit";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Brand kit" };
export const dynamic = "force-dynamic";

/**
 * Brand kit: the approved kit as a visual, or the sources that are real to
 * research, then the proposal beside what is in use, then the decision.
 * A proposal never replaces the kit in use until it is approved.
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
    <main className="fs-phone-main fs-utility" id="main" style={{ maxWidth: 816 }}>
      <UtilityHead title="Brand kit" lede="Nothing changes without your approval." back={<BackLink fallback="/business/settings" label="Settings" />} />
      <BrandKitStudio
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
