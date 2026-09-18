"use client";

import { useRouter } from "next/navigation";
import { Wordmark } from "../../../design-lab-v2/parts";
import { LINK_CODES, SOURCES, business } from "../../fixtures";
import { useLoyalty } from "../../store";

export function Handoff({ code }: { code: string }) {
  const { dispatch } = useLoyalty();
  const router = useRouter();
  const link = LINK_CODES[code];
  return (
    <div className="join">
      <header className="join-header"><Wordmark size={20} /><span className="t-note">Design Lab · Fixture link</span></header>
      <main className="join-main">
        {!link ? <p className="t-object">This signup link is unavailable.</p> : (
          <>
            <p className="t-fact-ink">{SOURCES[link.source].label}<span aria-hidden> · </span>{SOURCES[link.source].sub}</p>
            <h1 className="t-title" style={{ marginTop: 8 }}>Join {business.name}</h1>
            <p className="t-fact" style={{ marginTop: 8 }}>{link.placed}. Tapping continues to Loopday’s signup and records one simulated link click. Nothing is sent.</p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 24, alignSelf: "flex-start" }} onClick={() => { dispatch({ type: "click", linkCode: code }); router.push(`/design-lab-v3/join/${link.joinCode}`); }}>Continue</button>
          </>
        )}
      </main>
    </div>
  );
}
