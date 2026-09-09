import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { NewBusinessForm } from "./NewBusinessForm";

export const metadata = { title: "Add business" };
export const dynamic = "force-dynamic";

export default async function NewBusinessPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Add your business</h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">
        Name, category, city. Everything else can wait.
      </p>
      <NewBusinessForm defaultCity={ctx.city ?? ""} />
    </main>
  );
}
