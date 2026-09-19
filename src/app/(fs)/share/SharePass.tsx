"use client";

import { AppleCard, type CardData } from "@/v3/wallet/Cards";
import { defaultCard, liveProgram } from "@/v3/examples";

const EXAMPLE: CardData = { design: defaultCard, program: liveProgram, firstName: "Member", memberId: "EXAMPLE", code: "example-share", progress: 2, ready: 0, state: "collecting" };

/** An example Wallet pass, labelled as such. No pass is issued. */
export function SharePass() {
  return (
    <div style={{ width: "min(100%, 320px)" }}>
      <div className="v3" style={{ background: "transparent" }}><AppleCard d={EXAMPLE} width={320} /></div>
      <p className="t-meta" style={{ marginTop: 10, textAlign: "center" }}>Example design. No pass is issued to any Wallet today.</p>
    </div>
  );
}
