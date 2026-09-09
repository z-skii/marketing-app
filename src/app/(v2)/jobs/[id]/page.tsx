import { redirect } from "next/navigation";

/** Campaigns are opportunities now: /o/[id]. */
export default async function LegacyJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/o/${id}`);
}
