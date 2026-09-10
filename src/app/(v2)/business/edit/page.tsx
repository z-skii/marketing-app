import { BackButton } from "@/components/v2/BackButton";
import { redirect } from "next/navigation";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { EditBusinessForm } from "./EditBusinessForm";

export const metadata = { title: "Edit business" };
export const dynamic = "force-dynamic";

export default async function EditBusinessPage() {
  const ctx = await requireBusinessContext("/business/edit");
  const ref = ctx.activeBusiness;

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
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">Business and brand kit</h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">What creators and customers see. The essentials are on top.</p>
      <EditBusinessForm business={business} />
    </main>
  );
}
