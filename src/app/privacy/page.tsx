import { LegalPage } from "@/components/LegalPage";
import { SITE_NAME } from "@/config/site";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="August 2026">
      <p>
        {SITE_NAME} is built to need as little about you as possible. You can browse the board and
        open links without an account.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>An account holds your email address and the display details you enter for your links.</li>
        <li>
          A first-party anonymous visitor identifier is set in a cookie. It exists to stop the same
          person being billed twice for the same link and to attribute creator referrals.
        </li>
        <li>
          For each open we record the placement, a coarse timestamp, the user agent string, and a
          keyed one-way hash of the IP address. We do not store raw IP addresses.
        </li>
        <li>Payment records from Stripe: an amount, a status, and Stripe&rsquo;s own identifiers.</li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not build behavioural profiles or browser fingerprints.</li>
        <li>We do not sell or share personal data with third parties for advertising.</li>
        <li>We do not track you across other websites.</li>
        <li>We never fetch or preload the destinations people submit.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        Two cookies: a session cookie when you are signed in, and the anonymous visitor identifier
        described above. Both are first-party and httpOnly. There are no advertising cookies.
      </p>

      <h2>Processors</h2>
      <p>
        Supabase hosts the database, authentication, and uploaded images. Stripe processes
        payments. Vercel serves the site. Each receives only what it needs to perform that role.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request a copy of your data or ask us to delete your account by contacting us.
        Deleting an account removes your profile, links, and unspent credit records; ledger rows
        needed for financial and fraud records are retained in anonymised form.
      </p>
    </LegalPage>
  );
}
