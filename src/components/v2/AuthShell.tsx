import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/config/site";

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/rules", label: "Rules" },
  { href: "/creator-terms", label: "Creator terms" },
  ...(CONTACT_EMAIL ? [{ href: `mailto:${CONTACT_EMAIL}`, label: "Contact" }] : []),
];

/**
 * Chrome for the signed-out screens (sign in, sign up, password reset):
 * the wordmark on top, the form in the middle, the legal links at the bottom.
 * Same graphite as the app so the hand-off after sign-in is seamless.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-root flex min-h-dvh flex-col bg-paper">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-5">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-800 tracking-[-0.03em]">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-signal" />
          {SITE_NAME}
        </Link>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10 md:py-16">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-5xl px-5 py-6">
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-faint" aria-label="Footer">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
