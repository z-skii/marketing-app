import { Record } from "./Record";

/** The counter: scan a member QR (simulated) or search, count a visit, redeem. A focused task without the business navigation. Fixture state only. */
export default async function RecordPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const sp = await searchParams;
  return <div className="record-page"><Record preset={sp.member ?? null} /></div>;
}
