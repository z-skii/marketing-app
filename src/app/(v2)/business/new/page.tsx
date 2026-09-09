import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { NewBusinessForm } from "./NewBusinessForm";

export const metadata = { title: "Add business" };
export const dynamic = "force-dynamic";

export default async function NewBusinessPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 py-5 md:py-8">
      <Link href="/business" className="font-mono text-xs text-ink-faint hover:text-ink">← Business</Link>
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Add your business</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Name, category, city — everything else can wait.
      </p>
      <NewBusinessForm defaultCity={ctx.city ?? ""} />
    </main>
  );
}
