import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Platform Rules" };

export default function RulesPage() {
  return (
    <LegalPage title="Platform Rules" updated="August 2026">
      <p>Short version: send real people to a real thing you are allowed to promote.</p>

      <h2>Links must not</h2>
      <ul>
        <li>Point to malware, phishing, or deceptive download pages.</li>
        <li>Impersonate a person, company, or product you do not represent.</li>
        <li>Contain sexual content involving minors, or any illegal content.</li>
        <li>Sell regulated goods where you are not licensed to do so.</li>
        <li>Redirect somewhere different from what the listing describes.</li>
        <li>Use a cloaked or conditional destination that varies by visitor.</li>
      </ul>

      <h2>Traffic must be real</h2>
      <p>
        Opens are filtered before they are billed. Automated traffic, bots, click farms, incentivised
        clicking, and clicking your own links do not count and are not charged. Repeatedly attempting
        to generate invalid traffic will get the account suspended.
      </p>

      <h2>How opens are counted</h2>
      <ul>
        <li>One qualified open per visitor, per link, inside the duplicate window.</li>
        <li>Browser prefetches and link previews are never billed.</li>
        <li>Known bots and non-browser clients are never billed.</li>
        <li>An owner opening their own link is never billed.</li>
        <li>An open on a placement with no remaining credit is never billed.</li>
      </ul>

      <h2>Ranking</h2>
      <p>
        The Board ranks by credit added during the current daily round. Spending credit does not
        lower your rank. The round resets daily; unspent credit carries over untouched.
      </p>

      <h2>Enforcement</h2>
      <p>
        We may reject a link, suspend a placement, block a domain, or suspend an account. Where we
        can, we will tell you why. Credit consumed by traffic later found to be invalid may be
        returned at our discretion.
      </p>
    </LegalPage>
  );
}
