"use client";

import Link from "next/link";
import { Img } from "../../design-lab-v2/Img";
import { Logo } from "../wallet/Cards";
import { counts, useLoyalty } from "../store";

/**
 * The Loyalty strip on Business Home: 1px separators, no card, no
 * shadow. A 56px square crop of the program's artwork with the loop mark
 * at left; Loyalty; two counts; one quiet 44px action. State dependent:
 * no program, draft, live without members, live.
 */
export function LoyaltyStrip() {
  const { state } = useLoyalty();
  const p = state.program;
  const c = counts(state);
  const design = state.draft?.card ?? p.card;
  const status = p.status;
  const line = status === "none" && !state.draft ? "Turn visits into rewards." : status !== "live" && state.draft ? `Draft · ${state.draft.reward.name}` : `${c.members} members · ${c.repeat} came back`;
  const action = status === "none" && !state.draft ? { href: "/design-lab-v3/business/loyalty/create", label: "Create program" } : status !== "live" && state.draft ? { href: `/design-lab-v3/business/loyalty/create?step=${state.draft.draftStep}`, label: "Continue setup" } : c.members === 0 ? { href: "/design-lab-v3/business/loyalty/qr", label: "View QR" } : { href: "/design-lab-v3/business/loyalty", label: "Open loyalty" };
  return (
    <div className="loy-strip" data-status={status}>
      <span className="loy-strip-art" style={{ background: design.bg, color: design.fg }}>{(status === "live" || state.draft) && design.artwork ? <><Img src={design.artwork} alt="" position={design.artworkPosition} loading="lazy" /><span className="loy-strip-corner" aria-hidden><Logo design={design} size={12} /></span></> : <span className="loy-strip-mark"><Logo design={design} size={26} /></span>}</span>
      <span className="loy-strip-text"><span className="t-object">Loyalty</span><span className="t-fact-ink">{line}</span></span>
      <Link href={action.href} className="link t-action loy-strip-action">{action.label}</Link>
    </div>
  );
}
