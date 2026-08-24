import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME, SITE_TAGLINE } from "@/config/site";

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/rules", label: "Rules" },
  { href: "/creator-terms", label: "Creator Terms" },
  ...(CONTACT_EMAIL ? [{ href: `mailto:${CONTACT_EMAIL}`, label: "Contact" }] : []),
];

export function Footer() {
  return (
    <footer className="rule mt-24">
      <div className="shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-sm font-700 uppercase tracking-[-0.03em]">{SITE_NAME}</div>
          <p className="eyebrow mt-1 !normal-case !tracking-normal">{SITE_TAGLINE}</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="eyebrow hover:text-ink transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
