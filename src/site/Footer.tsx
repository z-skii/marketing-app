import Link from "next/link";
import { Wordmark } from "@/ds/Brand";

export function Footer({ year }: { year: number }) {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-grid">
        <div>
          <Wordmark size={24} />
          <p className="t-meta" style={{ marginTop: 12, maxWidth: "48ch" }}>Get paid to promote local businesses. People, businesses, campaigns and amounts shown on this page are examples, not real accounts.</p>
          <p className="t-meta" style={{ marginTop: 8 }}>© {year} TapMart</p>
        </div>
        <nav aria-label="Legal">
          <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/creator-terms">Creator terms</Link><Link href="/rules">Rules</Link><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create an account</Link>
        </nav>
      </div>
    </footer>
  );
}
