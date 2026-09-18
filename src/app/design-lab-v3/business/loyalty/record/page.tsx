import { BusinessShell } from "../../../parts";
import { LoyaltyHome } from "../LoyaltyHome";
import { Record } from "./Record";

/**
 * The counter: scan a member QR (simulated) or search, count a visit,
 * redeem. Phone: a full height opaque task without the business
 * navigation. Desktop: a 560px working pane at the right of Loyalty Home,
 * which stays visible but inert as context. Fixture state only.
 */
export default async function RecordPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="record-page">
      <div className="record-context" inert aria-hidden><BusinessShell bare active="Business" title="Loyalty" mainClass="loy-main"><LoyaltyHome /></BusinessShell></div>
      <aside className="record-pane" aria-label="Add visit"><Record preset={sp.member ?? null} /></aside>
    </div>
  );
}
