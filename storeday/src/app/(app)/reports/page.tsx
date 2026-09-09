import { redirect } from "next/navigation";

/** /reports → the Daily report (tabs on /reports/[report]). */
export default async function ReportsIndex({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) q.set(k, v);
  if (!q.get("range")) q.set("range", "this_month");
  const s = q.toString();
  redirect(`/reports/daily${s ? `?${s}` : ""}`);
}
