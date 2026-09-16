import { redirect } from "next/navigation";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { BusinessDetailsForm } from "@/components/fs/settings/BusinessDetailsForm";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Business details" };
export const dynamic = "force-dynamic";

export default async function EditBusinessPage() {
  const ctx = await requireBusinessContext("/business/edit");
  const business = await sqlOne<{
    id: string; name: string; category: string | null; description: string | null;
    address: string | null; city: string | null; phone: string | null; website: string | null;
    logo_url: string | null; cover_url: string | null; socials: Record<string, string>;
    brand: Record<string, string>; target_note: string | null;
  }>(`select id, name, category, description, address, city, phone, website, logo_url, cover_url, socials, brand, target_note from businesses where id = $1`, [ctx.activeBusiness.id]);
  if (!business) redirect("/business/new");
  const canEdit = ctx.activeBusiness.member_role === "owner" || ctx.activeBusiness.member_role === "manager" || ctx.user.role === "admin";
  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Business details" lede="What people and customers see. The essentials are on top." back={<BackLink fallback="/business/settings" label="Settings" />} />
      {canEdit ? <BusinessDetailsForm business={business} /> : <p className="fs-t-body" style={{ marginTop: 16 }}>Only the owner or a manager can change these details.</p>}
    </main>
  );
}
