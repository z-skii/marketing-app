"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { List } from "@phosphor-icons/react";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { Viewer } from "../../../design-lab-v2/Viewer";
import { Wordmark } from "../../../design-lab-v2/parts";
import { LabStrip } from "../motion";

/**
 * Public shell for the V3 homepage: a 56px floating navigation lens inset
 * 12px (the one persistent glass object on the page), the compact lab and
 * motion strip beneath it on opaque canvas, chapter anchors in Menu, and
 * the quiet document footer. Sign in and every live boundary open the
 * explicit lab notice: nothing here authenticates, sends or moves money.
 */
const CHAPTERS = [
  { href: "#recreate", label: "Recreate" }, { href: "#post", label: "Post" }, { href: "#drive", label: "Drive" }, { href: "#get-paid", label: "Get paid" },
  { href: "#find-people", label: "Find people" }, { href: "#find-cars", label: "Find cars" }, { href: "#create", label: "Create" }, { href: "#review", label: "Review" }, { href: "#content", label: "Monthly content" }, { href: "#loyalty", label: "Loyalty" },
];

/** Entry boundary: no accounts are created here; the two working previews are the useful alternative. */
export function Entry({ label, className = "btn btn-primary", business = false }: { label: string; className?: string; business?: boolean }) {
  return (
    <Sheet title="Outside this preview" triggerClass={className} trigger={label}>
      <p className="t-body" style={{ marginTop: 8 }}>This preview does not create accounts, send requests or move money.</p>
      <p className="t-fact" style={{ marginTop: 8 }}>Nothing is sent from this preview.</p>
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        {!business && <Link href="/design-lab-v3/home" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Personal preview</Link>}
        <Link href="/design-lab-v3/business" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Business preview</Link>
        {business && <Link href="/design-lab-v3/home" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Personal preview</Link>}
      </div>
    </Sheet>
  );
}

/** The tone of the stage passing beneath the given viewport y: dark, inspection or none. The navigation stack follows what is beneath it. */
function useStageTone(y: number): "dark" | "inspection" | null {
  const [tone, setTone] = useState<"dark" | "inspection" | null>(null);
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-stage-dark], [data-stage-tone]"));
    if (!els.length) return;
    const check = () => {
      const hit = els.find((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
      setTone(!hit ? null : hit.dataset.stageDark === "true" || hit.dataset.stageTone === "dark" ? "dark" : "inspection");
    };
    check(); window.addEventListener("scroll", check, { passive: true }); window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [y]);
  return tone;
}
const useStageDark = (y: number) => useStageTone(y) === "dark";

export function PublicNav() {
  const dark = useStageDark(44);
  return (
    <header className={`x-nav lens${dark ? " lens-dark x-dark" : ""}`} data-nav>
      <a href="#top" aria-label="TapMart" className="x-nav-brand"><Wordmark size={20} onInk={dark} /></a>
      <span className="x-nav-actions">
        <Entry label="Sign in" className="link link-plain t-action x-nav-signin" />
        <Sheet title="Menu" variant="full" triggerClass="link link-plain t-action x-nav-menu" trigger={<><List size={20} aria-hidden />Menu</>}>
          <nav className="site-menu-list" aria-label="Menu">
            <p className="t-fact" style={{ marginTop: 8 }}>Make money</p>
            {CHAPTERS.slice(0, 4).map((c) => <a key={c.href} href={c.href} className="sheet-row" onClick={(e) => (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close()}>{c.label}</a>)}
            <p className="t-fact" style={{ marginTop: 16 }}>Grow your business</p>
            {CHAPTERS.slice(4).map((c) => <a key={c.href} href={c.href} className="sheet-row" onClick={(e) => (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close()}>{c.label}</a>)}
            <p className="t-fact" style={{ marginTop: 16 }}>Working previews</p>
            <Link href="/design-lab-v3/home" className="sheet-row">Personal preview</Link>
            <Link href="/design-lab-v3/business" className="sheet-row">Business preview</Link>
          </nav>
        </Sheet>
      </span>
    </header>
  );
}

/** The lab and motion strip: the opaque 44px band of the navigation stack, so Pause motion is reachable in every scene. */
export function PublicStrip() {
  const tone = useStageTone(100);
  return <div className={`x-pubstrip${tone === "dark" ? " x-dark" : ""}`} data-tone={tone ?? undefined}><div className="x-inner"><LabStrip /></div></div>;
}

/** Media sources: exact provenance on demand, from docs/design-lab-v3/MEDIA_MANIFEST.json. */
export function Sources({ trigger, className = "link link-plain t-fact-ink" }: { trigger: string; className?: string }) {
  return (
    <Sheet title="Media sources" variant="full" triggerClass={className} trigger={trigger}>
      <p className="t-body" style={{ marginTop: 8 }}>People, businesses, campaigns and amounts on this page are fictional fixtures. The bindings below are the ones the page renders.</p>
      <dl className="facts" style={{ marginTop: 16, gridTemplateColumns: "1fr" }}>
        <div><dt>Shared brief</dt><dd>reference-loopday-01.jpg, the Loopday Coffee reference bound to the US$75 Recreate this Reel opportunity (Counter pour). Reviewed 4:5 crop of a 9:16 still.</dd></div>
        <div><dt>Creator version</dt><dd>maya-work-pour-01.jpg and maya-work-cup-02.jpg: Maya Chen&rsquo;s own Counter pour stills for Loopday Coffee, approved Sep 10, 2026 in the fixture record. No ledger record exists for this campaign, so no amount is shown as earned.</dd></div>
        <div><dt>Recorded earnings example</dt><dd>maya-loopday-submission-01.jpg: Latte take, Loopday Coffee, approved Aug 9, 2026, credited US$75.00 (gross US$80.00, fee US$5.00). A separate recorded example, not the Counter pour brief.</dd></div>
        <div><dt>Story creative</dt><dd>story-loopday-01.jpg, the finished Loopday creative bound to the US$25 Post for 24 hours opportunity.</dd></div>
        <div><dt>Car campaign</dt><dd>vehicle-eli-01.jpg as the vehicle example bound to the US$300 /month Spurroom Bikes campaign, with placement-rear-doors.svg as its supported zone plan. Eli&rsquo;s listing (US$240 /month asking rate, Rear doors) is a separate record.</dd></div>
        <div><dt>People</dt><dd>portrait-maya-01, portrait-nora-01, portrait-eli-01 with each person&rsquo;s own work stills. Jasmine has no portrait.</dd></div>
        <div><dt>Delivered content</dt><dd>content-loopday-*.jpg, Loopday Coffee&rsquo;s own delivered subscription photographs.</dd></div>
        <div><dt>Real product captures</dt><dd style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Viewer src="/marketing/frames/user-home-390.webp" alt="Real product capture: Personal Home" label="Personal Home capture" className="link t-action" style={{ minHeight: 44 }}>Personal Home</Viewer>
          <Viewer src="/marketing/frames/business-home-1440.webp" alt="Real product capture: Business Home" label="Business Home capture" className="link t-action" style={{ minHeight: 44 }}>Business Home</Viewer>
        </dd></div>
      </dl>
    </Sheet>
  );
}

function Legal({ label }: { label: string }) {
  return <Sheet title={label} triggerClass="link link-plain t-fact-ink" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger={label}><p className="t-body" style={{ marginTop: 8 }}>{label} are outside this preview. The production documents apply.</p></Sheet>;
}

export function PublicFooter() {
  return (
    <footer className="x-footer x-inner">
      <hr className="divider" />
      <div className="x-footer-links">
        <Legal label="Terms" /><Legal label="Privacy" /><Legal label="Creator terms" /><Legal label="Campaign rules" /><Legal label="Plan information" /><Sources trigger="Media sources" />
      </div>
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
