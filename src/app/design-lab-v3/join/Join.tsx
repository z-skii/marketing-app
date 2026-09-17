"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { Sheet } from "../../design-lab-v2/Sheet";
import { Img } from "../../design-lab-v2/Img";
import { AppleCard, CardDetails, GoogleCard, Logo, PlatformLabel, type CardData } from "../wallet/Cards";
import { creators, type Member, type Source } from "../fixtures";
import { normalise, sourceForJoinCode, useLoyalty } from "../store";

/**
 * Join: the public customer signup. A 56px task header with Back and the
 * Lab control; the loop mark and business; the untreated artwork; the
 * source acknowledged; the reward and the counting rule; the short form.
 * After Create my card, the zero progress card leads as a labelled Apple
 * concept with platform tabs, then the two equal Wallet text actions with
 * the simulation note above them. Desktop is one deliberate stage: the
 * 375px pass, a 48px gap, a 280px action column.
 */
function Head({ short = false }: { short?: boolean }) {
  return (
    <header className="join-header">
      <Link href="/design-lab-v3/business/loyalty" className="link link-plain t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }} aria-label="Back"><ArrowLeft size={16} aria-hidden />Back</Link>
      <Sheet title="Design Lab" variant="menu" triggerClass="lab-entrance t-note" trigger={<>{short ? "Design Lab" : "Design Lab · Simulated signup"}</>}>
        <p className="t-body" style={{ marginTop: 8 }}>This signup keeps entered details in this browser until reload. Nothing is sent to a server. No pass is issued.</p>
        <Link href="/design-lab-v3/business/loyalty" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", marginTop: 12 }}>Return to business preview</Link>
      </Sheet>
    </header>
  );
}

function Brand({ card }: { card: CardData["design"] }) {
  return (
    <div className="join-brand-row"><span className="join-brand-mark" style={{ color: "var(--v2-ink)" }}><Logo design={card} size={28} /></span><span className="t-object">{card.businessName}</span></div>
  );
}

export function Join({ code, memberId: presetMember }: { code: string; memberId: string | null }) {
  const { state, dispatch } = useLoyalty();
  const p = state.program;
  const source: Source | null = sourceForJoinCode(code);
  const creator = source?.creatorId ? creators[source.creatorId] : null;
  const [joined, setJoined] = useState<string | null>(presetMember);
  const [firstName, setFirstName] = useState("");
  const [contactKind, setContactKind] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [agree, setAgree] = useState(false);
  const [tried, setTried] = useState(false);
  const [platform, setPlatform] = useState<"apple" | "google">("apple");
  const [saved, setSaved] = useState<"apple" | "google" | null>(null);
  const [details, setDetails] = useState(false);
  const [notNow, setNotNow] = useState(false);
  const receipt = state.receipt;
  const duplicate = joined === "pending" && receipt?.type === "duplicate" ? state.members.find((m) => m.id === receipt.memberId) ?? null : null;
  const me: Member | null = state.members.find((m) => m.id === joined) ?? (joined === "pending" && !duplicate ? state.members.find((m) => m.contactNorm === normalise(contactKind, contact)) ?? null : null);
  const unitWord = p.kind === "visits" ? "visits" : "points";
  const sourceLine = creator ? `From ${creator.name}’s ${creator.type === "STORY" ? "Story" : creator.type === "RECREATE" ? "Reel" : "car"}.` : source?.type === "BUSINESS_QR" ? "Join at the counter." : null;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
  const phoneOk = contact.replace(/\D/g, "").length >= 10;
  const errors = { name: tried && firstName.trim().length === 0 ? "Enter your first name." : null, contact: tried && !(contactKind === "email" ? emailOk : phoneOk) ? (contactKind === "email" ? "Enter a valid email." : "Enter a valid phone number.") : null, agree: tried && !agree ? "Agree to the demo terms to continue." : null };
  const valid = firstName.trim().length > 0 && (contactKind === "email" ? emailOk : phoneOk) && agree;
  const submit = () => { setTried(true); if (!valid || !source) return; dispatch({ type: "signup", firstName, contactKind, contact, source }); setJoined("pending"); };
  const cardFor = (m: Member): CardData => ({ design: p.card, program: p, firstName: m.firstName, memberId: m.memberId, code: m.code, progress: m.progress, ready: m.ready, state: m.ready > 0 ? "ready" : "collecting" });


  if (!source) return <div className="join"><Head /><main className="join-main"><p className="t-object">This signup link is unavailable.</p></main></div>;
  if (p.status !== "live") return <div className="join"><Head /><main className="join-main"><Brand card={p.card} /><p className="t-fact-ink" style={{ marginTop: 16 }}>Signup preview · not live</p><h1 className="t-title" style={{ marginTop: 8 }}>This program isn’t live yet.</h1><p className="t-body" style={{ marginTop: 8 }}>Launch before joining.</p></main></div>;

  if (duplicate) {
    return (
      <div className="join"><Head />
        <main className="join-main"><Brand card={p.card} />
          <h1 className="t-title" style={{ marginTop: 16 }}>Already a member in this preview.</h1>
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Link href={`/design-lab-v3/card/${duplicate.code}`} className="btn btn-primary">Open demo card</Link>
            <button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => { setJoined(null); setTried(false); }}>Back</button>
          </div>
          <p className="t-note" style={{ marginTop: 16 }}>Card access is simulated; production recovery needs verification.</p>
        </main>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="join"><Head />
        <main className="join-main">
          <section className="join-invite">
            <Brand card={p.card} />
            <span className="media join-art">{p.card.artwork && <Img src={p.card.artwork} alt={p.card.artworkAlt} position={p.card.artworkPosition} />}</span>
            {sourceLine && <p className="t-fact-ink join-source">{sourceLine}</p>}
            <h1 className="t-title join-title">{p.reward.name}</h1>
            <p className="t-body">Collect {p.requirement} {unitWord}. Your next coffee is free.</p>
            <p className="t-fact">{p.kind === "visits" ? "One qualifying purchase per visit. One counted visit per day." : "One point per qualifying purchase. One counted purchase per day."}</p>
          </section>
          <form className="join-form" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <p className="t-note">Use fictional details only.</p>
            <label className="join-field"><span className="t-fact-ink">First name</span><input className="join-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" maxLength={40} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "err-name" : undefined} />{errors.name && <span id="err-name" className="join-error">{errors.name}</span>}</label>
            <div className="join-field">
              <span className="join-field-head"><span className="t-fact-ink">{contactKind === "email" ? "Email" : "Phone"}</span><button type="button" className="link t-fact-ink join-swap" onClick={() => { setContactKind((k) => (k === "email" ? "phone" : "email")); setContact(""); }}>{contactKind === "email" ? "Use phone" : "Use email"}</button></span>
              {contactKind === "phone" ? (
                <span className="join-phone">
                  <select className="join-input join-country" aria-label="Country code" defaultValue="+1"><option value="+1">United States +1</option></select>
                  <input className="join-input" value={contact} onChange={(e) => setContact(e.target.value)} type="tel" inputMode="tel" autoComplete="tel-national" aria-label="Phone" aria-invalid={errors.contact ? true : undefined} />
                </span>
              ) : (
                <input className="join-input" value={contact} onChange={(e) => setContact(e.target.value)} type="email" inputMode="email" autoComplete="email" aria-label="Email" aria-invalid={errors.contact ? true : undefined} aria-describedby="contact-why" />
              )}
              {errors.contact && <span className="join-error">{errors.contact}</span>}
              <span id="contact-why" className="t-note">Used to find your card at the counter. No texts or emails.</span>
            </div>
            <label className="join-consent"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} aria-invalid={errors.agree ? true : undefined} /><span className="t-fact-ink">I agree to the demo <Terms /> and <Privacy />.</span></label>
            {errors.agree && <span className="join-error">{errors.agree}</span>}
            <button type="submit" className="btn btn-primary join-submit">Create my card</button>
            <button type="button" className="link t-note join-demo" onClick={() => { setFirstName("Tess"); setContactKind("email"); setContact("tess@example.test"); }}>Use demo details</button>
          </form>
        </main>
      </div>
    );
  }

  const data = cardFor(me);
  return (
    <div className="join"><Head short />
      <main className="join-main join-main-card">
        <div className="join-stage">
          <div className="join-stage-pass">
            <h1 className="t-title">Your demo card</h1>
            {sourceLine && <span className="t-fact-ink">{sourceLine}</span>}
                        <div className="join-platforms" role="tablist" aria-label="Wallet">
              <button type="button" role="tab" aria-selected={platform === "apple"} onClick={() => setPlatform("apple")}>Apple Wallet</button>
              <button type="button" role="tab" aria-selected={platform === "google"} onClick={() => setPlatform("google")}>Google Wallet</button>
            </div>
            <div className="wc-wrap">
              <PlatformLabel platform={platform} />
              <div key={platform} className="settle">{platform === "apple" ? <AppleCard d={data} width={375} className="wc-fit" /> : <GoogleCard d={data} width={375} className="wc-fit" />}</div>
              {(saved || notNow || me.wallet !== "none") && <PlatformLabel platform={platform} above={false} />}
            </div>
          </div>
          <div className="join-stage-side">
            {!saved && !notNow && me.wallet === "none" ? (
              <div className="join-wallet-actions">
                <span className="t-note">Simulated actions. No pass is issued.</span>
                <button type="button" className="btn btn-primary wallet-btn" onClick={() => { dispatch({ type: "wallet", memberId: me.id, platform: "apple" }); setSaved("apple"); setPlatform("apple"); }}>Add to Apple Wallet</button>
                <button type="button" className="btn btn-primary wallet-btn" onClick={() => { dispatch({ type: "wallet", memberId: me.id, platform: "google" }); setSaved("google"); setPlatform("google"); }}>Add to Google Wallet</button>
                <button type="button" className="link t-action" style={{ minHeight: 44, alignSelf: "flex-start" }} onClick={() => setNotNow(true)}>Not now</button>
              </div>
            ) : notNow && me.wallet === "none" ? (
              <div className="join-wallet-actions">
                <span className="t-fact-ink">Wallet not added.</span>
                <span className="t-fact">You can still show this demo QR at the counter.</span>
                <button type="button" className="link t-action" style={{ minHeight: 44, alignSelf: "flex-start" }} onClick={() => setNotNow(false)}>Add to Wallet</button>
              </div>
            ) : (
              <div className="join-wallet-actions">
                <span className="t-fact-ink" role="status">{(saved ?? (me.wallet === "google" ? "google" : "apple")) === "apple" ? "Apple Wallet add simulated." : "Google Wallet add simulated."}</span>
                <span className="t-fact">Nothing was added to your device.</span>
                {me.wallet !== "both" && <button type="button" className="link t-action" style={{ minHeight: 44, alignSelf: "flex-start" }} onClick={() => { const other = me.wallet === "apple" ? "google" : "apple"; dispatch({ type: "wallet", memberId: me.id, platform: other }); setSaved(other); setPlatform(other); }}>Add another Wallet</button>}
              </div>
            )}
            <div className="join-after">
              <button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => setDetails((v) => !v)} aria-expanded={details}>Details</button>
              {(saved || notNow || me.wallet !== "none") && <Link href="/design-lab-v3/business/loyalty" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Done</Link>}
            </div>
            {details && <CardDetails d={data} platform={platform} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Terms() {
  return (
    <Sheet title="Demo program terms" triggerClass="link t-fact-ink" trigger="program terms">
      <ul className="reqs" style={{ marginTop: 8 }}>
        <li>One qualifying purchase earns one visit. A maximum of one visit counts per business day.</li>
        <li>Collect five visits for one free barista-made coffee on a later purchase.</li>
        <li>Redeeming a reward does not earn a visit. Earned rewards have no expiry in this example.</li>
        <li>Additional counted visits are kept toward your next reward.</li>
        <li>These are demo terms, not a live program agreement.</li>
      </ul>
    </Sheet>
  );
}

export function Privacy() {
  return (
    <Sheet title="Demo privacy notice" triggerClass="link t-fact-ink" trigger="privacy notice">
      <ul className="reqs" style={{ marginTop: 8 }}>
        <li>This Design Lab keeps entered details in this browser until reload. Nothing is sent to a server.</li>
        <li>The production design requires a first name and one contact. Businesses see masked contacts; creators see counts only.</li>
        <li>No contact details appear on the Wallet card.</li>
      </ul>
    </Sheet>
  );
}
