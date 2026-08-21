import { LegalPage } from "@/components/LegalPage";
import { SITE_NAME } from "@/config/site";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="August 2026">
      <p>
        By using {SITE_NAME} you agree to these terms. If you do not agree, do not use the service.
      </p>

      <h2>Credit</h2>
      <p>
        Credit is prepaid platform usage, not money held on deposit and not a stored-value
        instrument. It buys placement of your link on this site and nothing else. Credit has
        no cash value, does not earn interest, and cannot be transferred between accounts.
      </p>
      <p>
        Credit is consumed when a qualified outbound open occurs on one of your placements.
        Every movement of credit is written to an immutable ledger you can inspect from your
        dashboard.
      </p>

      <h2>Placements</h2>
      <p>
        Placement on The Board is ranked by the credit you add to The Board during the current
        daily round. Rank does not fall as your credit is spent. When a placement&rsquo;s remaining
        credit reaches zero it becomes inactive and stops appearing until it is funded again.
      </p>
      <p>
        Rankings are a display of paid placement. They are not a contest, there is no prize, and
        nothing here is a game of chance.
      </p>

      <h2>Refunds</h2>
      <p>
        Unspent credit sitting on a placement can be released back to your available balance at
        any time. Credit already consumed by qualified opens is not refundable. If you believe
        you were charged for invalid traffic, contact us and we will review the click record.
      </p>

      <h2>Your link</h2>
      <p>
        You are responsible for the destination you submit and for having the right to promote
        it. Links are reviewed before going live, and we may reject, suspend, or remove any link
        at our discretion.
      </p>

      <h2>Suspension</h2>
      <p>
        We may suspend an account or a link for abuse, fraud, illegal content, or repeated
        violations of the Platform Rules. Where an account is suspended for fraud we may withhold
        affected credit and earnings pending review.
      </p>

      <h2>No warranty</h2>
      <p>
        The service is provided as is. We do not guarantee any volume of traffic, any particular
        rank, or uninterrupted availability.
      </p>
    </LegalPage>
  );
}
