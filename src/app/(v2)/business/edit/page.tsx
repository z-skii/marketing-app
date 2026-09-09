import { BackButton } from "@/components/v2/BackButton";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { EditBusinessForm } from "./EditBusinessForm";

export const metadata = { title: "Edit business" };
export const dynamic = "force-dynamic";

export default async function EditBusinessPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const ref = ctx.businesses[0];
  if (!ref) redirect("/business/new");

  const business = await sqlOne<{
    id: string; name: string; category: string | null; description: string | null;
    address: string | null; city: string | null; phone: string | null; website: string | null;
    logo_url: string | null; cover_url: string | null; socials: Record<string, string>;
    brand: Record<string, string>; target_note: string | null;
  }>(`select id, name, category, description, address, city, phone, website,
             logo_url, cover_url, socials, brand, target_note
        from businesses where id = $1`, [ref.id]);
  if (!business) redirect("/business/new");

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <BackButton fallback="/business" label="Business" />
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Business profile &amp; brand kit</h1>
      <EditBusinessForm business={business} />
    </main>
  );
}
