import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";

export const metadata = { title: "Loyalty" };
export const dynamic = "force-dynamic";

/**
 * Business Loyalty in production: the approved V3 Loyalty surface has no
 * backend yet (no programs, members, visits, rewards or Wallet passes are
 * stored), so this route ships the visual shell in a clearly disabled
 * state. It names the business, shows what the feature will do and
 * promises nothing that does not exist: no program is created, no card
 * is issued to Apple Wallet or Google Wallet, no count is shown. The
 * approved Loyalty Home composition (docs/design-lab-v3/screens/
 * x-business-loyalty.md) lands here when the backend does.
 */
export default async function BusinessLoyaltyPage() {
  const ctx = await requireBusinessContext("/business/loyalty");
  const business = ctx.activeBusiness;
  return (
    <main className="fs-phone-main" id="main">
      <div className="v3 xs-wrap">
        <h1 className="fs-t-page" style={{ marginTop: 12 }}>Loyalty</h1>
        <p className="fs-t-body" style={{ marginTop: 8, color: "var(--fs-muted)" }}>Coming soon. Loyalty is not available yet for {business.name}; nothing here is set up, counted or issued.</p>

        <div className="xs-soon" aria-label="What Loyalty will do">
          <div className="xs-soon-card" aria-hidden>
            <span className="t-fact">Example card design</span>
            <span><span className="t-object" style={{ display: "block", color: "#fff" }}>{business.name}</span><span className="t-fact">Visits and rewards, kept by the business</span></span>
          </div>
          <ul className="xs-soon-list">
            <li>A visits or points program with one reward, on your own card design.</li>
            <li>Customers join from a campaign, a creator&rsquo;s link, your QR at the counter or your TapMart link, and the source is recorded.</li>
            <li>A visit counts once per business day; a ready reward is redeemed at the counter.</li>
            <li>Apple Wallet and Google Wallet passes are planned. No pass is issued today.</li>
          </ul>
          <p className="fs-t-meta">You will be told in Notifications when Loyalty opens for your business.</p>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
          <Link href="/business" className="fs-btn fs-btn-secondary">Back to Home</Link>
          <Link href="/business/create" className="fs-btn fs-btn-quiet fs-link-ink">Create a campaign</Link>
        </div>
      </div>
    </main>
  );
}
