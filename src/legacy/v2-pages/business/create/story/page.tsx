import { requireBusinessContext } from "@/lib/v2/core";
import { loadPrefill, loadWizardBusiness } from "@/app/(v2)/business/create/prefill";
import { StoryWizard } from "./StoryWizard";

export const metadata = { title: "Story ads" };
export const dynamic = "force-dynamic";

export default async function StoryCreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create/story"), searchParams]);
  const business = ctx.activeBusiness;
  const [full, prefill] = await Promise.all([
    loadWizardBusiness(business.id),
    loadPrefill(params.rec, business.id, "instagram_story"),
  ]);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 pb-32 md:px-8 md:py-8">
      <p className="text-sm text-ink-faint">{business.name}  ·  Instagram Story ads</p>
      <div className="mt-3">
        <StoryWizard business={full} defaultCity={full.city ?? ctx.city ?? ""} prefill={prefill} />
      </div>
    </main>
  );
}
