"use client";

import Link from "next/link";
import { ArrowLeft, CaretRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { LabEntrance } from "../../LabControl";

/**
 * The Loyalty page head. Phone: a 56px row with Back, the title and the
 * one primary action. Desktop: the Business / Loyalty breadcrumb above the
 * title, Design Lab · Fictional preview at the right, the primary action
 * aligned to the title's right edge.
 */
export function LoyaltyHead({ title, here, action, backHref = "/design-lab-v3/business" }: { title: string; here?: string; action?: ReactNode; backHref?: string }) {
  return (
    <div className="loy-headblock">
      <nav className="loy-crumb t-fact" aria-label="Where you are">
        <Link href="/design-lab-v3/business/profile" className="link link-plain">Business</Link>
        <CaretRight size={12} aria-hidden />
        {here ? <><Link href="/design-lab-v3/business/loyalty" className="link link-plain">Loyalty</Link><CaretRight size={12} aria-hidden /><span aria-current="page">{here}</span></> : <span aria-current="page">Loyalty</span>}
      </nav>
      <div className="loy-titlerow">
        <Link href={backHref} className="icon-btn loy-back-btn" aria-label={here ? "Back to Loyalty" : "Back to Business Home"}><ArrowLeft size={20} /></Link>
        <Link href={backHref} className="link t-action loy-back-desk" aria-label={here ? "Back to Loyalty" : "Back to Business Home"}><ArrowLeft size={16} aria-hidden />Back</Link>
        <h2 className="t-title loy-title">{title}</h2>
        <span className="loy-context"><LabEntrance /></span>
        {action && <span className="loy-headaction">{action}</span>}
      </div>
    </div>
  );
}

export function LoyaltyCrumb({ here }: { here?: string }) {
  return <LoyaltyHead title={here ?? "Loyalty"} here={here} backHref={here ? "/design-lab-v3/business/loyalty" : "/design-lab-v3/business"} />;
}
