import Link from "next/link";
import { Wordmark } from "@/components/fs/parts";
import { CONTACT_EMAIL, SITE_NAME } from "@/config/site";

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/rules", label: "Rules" },
  { href: "/creator-terms", label: "Creator terms" },
  ...(CONTACT_EMAIL ? [{ href: `mailto:${CONTACT_EMAIL}`, label: "Contact" }] : []),
];

/**
 * Shared shell for the policy pages: the product wordmark and Sign in on
 * top, one readable column, the same legal links at the bottom as the
 * signed out screens. Same material as the rest of the product so the
 * hand off from a footer link and back is seamless.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-root flex min-h-dvh flex-col bg-paper">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
        <Link href="/" aria-label={`${SITE_NAME} home`} className="inline-flex items-center"><Wordmark size={22} /></Link>
        <Link href="/sign-in" className="btn btn-sm">Sign in</Link>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 md:py-16">
        <article className="max-w-2xl">
          <h1 className="font-display text-4xl leading-[1] font-500 tracking-[-0.035em] md:text-5xl">
            {title}
          </h1>
          <p className="eyebrow mt-4">Last updated {updated}</p>
          <div className="mt-10 flex flex-col gap-6 text-ink-2 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-500 [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
            {children}
          </div>
          <p className="rule mt-14 pt-6 text-xs text-ink-faint">
            These are starter product documents written for an early build. Have them
            reviewed by a lawyer before operating at any scale.
          </p>
        </article>
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
