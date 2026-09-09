import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The old wizard lives on as the three campaign flows under Business mode. */
export default async function LegacyCreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string }> }) {
  const params = await searchParams;
  redirect(params.rec ? `/business/create?rec=${encodeURIComponent(params.rec)}` : "/business/create");
}
