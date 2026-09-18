"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { List } from "@phosphor-icons/react";
import { Sheet } from "../ui/Sheet";
import { Viewer } from "../ui/Viewer";
import { Wordmark } from "../ui/parts";
import { MotionStrip } from "../motion";

/**
 * Public shell for the production homepage: a 56px floating navigation
 * lens inset 12px (the one persistent glass object on the page), the
 * compact motion strip beneath it on opaque canvas, chapter anchors in
 * Menu, and the quiet document footer. Sign in and Sign up are the real
 * product routes; a signed in visitor gets one way back into the app.
 */
const CHAPTERS = [
  { href: "#recreate", label: "Recreate" }, { href: "#post", label: "Post" }, { href: "#drive", label: "Drive" }, { href: "#get-paid", label: "Get paid" },
  { href: "#find-people", label: "Find people" }, { href: "#find-cars", label: "Find cars" }, { href: "#create", label: "Create" }, { href: "#review", label: "Review" }, { href: "#content", label: "Monthly content" }, { href: "#loyalty", label: "Loyalty" }, { href: "#plans", label: "Plans" },
];

export type OpenApp = { href: string; label: string } | null;

/** The tone of the stage passing beneath the given viewport y: dark, inspection or none. The navigation stack follows what is beneath it. */
function useStageTone(y: number): "dark" | "inspection" | null {
  const [tone, setTone] = useState<"dark" | "inspection" | null>(null);
  useEffect(() => {
    // Stages are queried on every check, so a stage mounted after the navigation (a refresh, a late scene) is still followed.
    const check = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-stage-dark], [data-stage-tone]"));
      const hit = els.find((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
      setTone(!hit ? null : hit.dataset.stageDark === "true" || hit.dataset.stageTone === "dark" ? "dark" : "inspection");
    };
    check(); window.addEventListener("scroll", check, { passive: true }); window.addEventListener("resize", check);
    const mo = new MutationObserver(check); mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-stage-tone", "data-stage-dark"] });
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); mo.disconnect(); };
  }, [y]);
  return tone;
}
const useStageDark = (y: number) => useStageTone(y) === "dark";

function closeSheet(e: React.MouseEvent<HTMLElement>) { (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }

export function PublicNav({ open }: { open: OpenApp }) {
  const dark = useStageDark(130);
  return (
    <header className={`x-nav lens${dark ? " lens-dark x-dark" : ""}`} data-nav>
      <a href="#top" aria-label="TapMart" className="x-nav-brand"><Wordmark size={20} onInk={dark} /></a>
      <span className="x-nav-actions">
        {open ? <Link href={open.href} className="link link-plain t-action x-nav-signin">{open.label}</Link> : <Link href="/sign-in" className="link link-plain t-action x-nav-signin">Sign in</Link>}
        <Sheet title="Menu" variant="full" triggerClass="link link-plain t-action x-nav-menu" trigger={<><List size={20} aria-hidden />Menu</>}>
          <nav className="site-menu-list" aria-label="Menu">
            <p className="t-fact" style={{ marginTop: 8 }}>Make money</p>
            {CHAPTERS.slice(0, 4).map((c) => <a key={c.href} href={c.href} className="sheet-row" onClick={closeSheet}>{c.label}</a>)}
            <p className="t-fact" style={{ marginTop: 16 }}>Grow your business</p>
            {CHAPTERS.slice(4).map((c) => <a key={c.href} href={c.href} className="sheet-row" onClick={closeSheet}>{c.label}</a>)}
            <p className="t-fact" style={{ marginTop: 16 }}>Your account</p>
            {open ? <Link href={open.href} className="sheet-row">{open.label}</Link> : (
              <>
                <Link href="/sign-up" className="sheet-row">Create an account</Link>
                <Link href="/sign-in" className="sheet-row">Sign in</Link>
              </>
            )}
          </nav>
        </Sheet>
      </span>
    </header>
  );
}

/** The motion strip: the opaque 44px band of the navigation stack, so Pause motion is reachable in every scene. */
export function PublicStrip() {
  const tone = useStageTone(124);
  return <div className={`x-pubstrip${tone === "dark" ? " x-dark" : ""}`} data-tone={tone ?? undefined}><div className="x-inner"><MotionStrip label="Examples on this page are not real accounts" /></div></div>;
}

/** The examples on this page, on demand: which media is illustrative and which captures are the real product. */
export function Sources({ trigger, className = "link link-plain t-fact-ink" }: { trigger: string; className?: string }) {
  return (
    <Sheet title="About the examples" variant="full" triggerClass={className} trigger={trigger}>
      <p className="t-body" style={{ marginTop: 8 }}>The people, businesses, campaigns and amounts on this page are examples that show how TapMart works. They are not real accounts, real campaigns or real earnings.</p>
      <dl className="facts" style={{ marginTop: 16, gridTemplateColumns: "1fr" }}>
        <div><dt>Campaign media</dt><dd>The reference still, the Story creative, the vehicles and the delivered photographs are illustrative marketing media prepared for this page.</dd></div>
        <div><dt>People</dt><dd>Maya, Nora, Eli and Jasmine are example creators. Their portraits and work stills are illustrative, not the work of real members.</dd></div>
        <div><dt>Amounts</dt><dd>Example campaign pay. Real pay is set by each business per campaign; the fee and the payout minimum shown under Get paid are the product&rsquo;s live settings.</dd></div>
        <div><dt>Loyalty</dt><dd>The Loyalty sequence shows a planned feature. It is coming soon; no card is issued to Apple Wallet or Google Wallet today.</dd></div>
        <div><dt>Real product captures</dt><dd style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Viewer src="/marketing/frames/user-home-390.webp" alt="Real product capture: Personal Home" label="Personal Home capture" className="link t-action" style={{ minHeight: 44 }}>Personal Home</Viewer>
          <Viewer src="/marketing/frames/business-home-1440.webp" alt="Real product capture: Business Home" label="Business Home capture" className="link t-action" style={{ minHeight: 44 }}>Business Home</Viewer>
        </dd></div>
      </dl>
    </Sheet>
  );
}

const LEGAL = [
  { href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }, { href: "/creator-terms", label: "Creator terms" }, { href: "/rules", label: "Campaign rules" },
];

export function PublicFooter({ year }: { year: number }) {
  return (
    <footer className="x-footer x-inner">
      <hr className="divider" />
      <div className="x-footer-links">
        {LEGAL.map((l) => <Link key={l.href} href={l.href} className="link link-plain t-fact-ink" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>{l.label}</Link>)}
        <a href="#plans" className="link link-plain t-fact-ink" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Plans</a>
        <Sources trigger="About the examples" />
      </div>
      <p className="t-note" style={{ marginTop: 8 }}>&copy; {year} TapMart. People, businesses, campaigns and amounts shown on this page are examples, not real accounts.</p>
    </footer>
  );
}

export function Chapter({ id, verb, children, dark = false, className = "" }: { id: string; verb: string; children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <section id={id} className={`x-chapter ${className}${dark ? " x-dark" : ""}`} aria-labelledby={`${id}-h`} data-stage-dark={dark ? "true" : undefined}>
      <div className="x-inner x-stage">
        <h2 id={`${id}-h`} className="t-verb x-chapter-h">{verb}</h2>
        {children}
      </div>
    </section>
  );
}
