import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Creator Terms" };

export default function CreatorTermsPage() {
  return (
    <LegalPage title="Creator Terms" updated="August 2026">
      <p>
        Creators share the board and earn a share of what their traffic actually produces.
      </p>

      <h2>What you earn from</h2>
      <p>
        You earn only when someone who arrived through your share link goes on to make a qualified
        outbound open. You are not paid for pageviews, visits, impressions, or sign-ups. A single
        open pays a single commission, once.
      </p>

      <h2>Attribution</h2>
      <p>
        Opening your share link starts a referral session tied to that visitor&rsquo;s anonymous
        identifier. If they make a qualified open while that session is valid, the commission is
        yours. The most recent share link a visitor opened is the one credited.
      </p>

      <h2>Holding period</h2>
      <p>
        Earnings arrive as pending and become available after a fraud-review period. Earnings found
        to come from invalid traffic are reversed during that period and are not paid.
      </p>

      <h2>Payouts</h2>
      <p>
        You can request a payout once your available balance passes the minimum. Payouts are
        reviewed and processed manually; nothing is sent automatically. We may withhold a payout
        while a fraud review is open.
      </p>

      <h2>Not allowed</h2>
      <ul>
        <li>Generating your own referred opens, directly or through anyone acting for you.</li>
        <li>Automated traffic, click exchanges, or paid-to-click services.</li>
        <li>Misrepresenting what the site is in order to get a click.</li>
        <li>Spamming your share link, or posting it where you have been asked not to.</li>
      </ul>

      <h2>Ending the arrangement</h2>
      <p>
        Either side can stop at any time. We may close a creator account for the behaviour above and
        withhold earnings connected to it.
      </p>
    </LegalPage>
  );
}
