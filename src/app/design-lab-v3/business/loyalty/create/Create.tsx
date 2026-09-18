"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "@phosphor-icons/react";
import { Sheet } from "../../../../design-lab-v2/Sheet";
import { Img } from "../../../../design-lab-v2/Img";
import { REWARD_TERMS, defaultCard, type Program, type ProgramKind } from "../../../fixtures";
import { useLoyalty } from "../../../store";
import { AppleCard, GoogleCard, Logo, PlatformLabel, type CardData, type CardState } from "../../../wallet/Cards";
import { QR } from "../../../qr";
import { CardControls, contrast } from "./CardControls";
import { LabEntrance } from "../../../LabControl";
import { TaskHead } from "../TaskHead";
import { useOrigin } from "../../../useOrigin";

const STEPS = ["Program", "Reward", "Card", "Signup", "Launch"] as const;
const STATES: [CardState, string][] = [["collecting", "Collecting"], ["ready", "Reward ready"], ["redeemed", "Reward redeemed"], ["updated", "Updated offer"]];

/**
 * One five step task on one route: Program, Reward, Card, Signup, Launch.
 * The phone header is Back, the step and n of 5, Close; desktop shows
 * the five labels with an ink underline. The card preview is live on the
 * Card step; Signup inspects the customer page without enrolling anyone;
 * Launch demo program is the only commit and produces Live · simulated
 * with zero members.
 */
export function Create({ initialStep }: { initialStep: number }) {
  const { state, dispatch } = useLoyalty();
  const hasLive = state.program.status === "live";
  const [step, setStep] = useState(initialStep);
  const d: Program = state.draft ?? { ...state.program, id: "draft", status: "draft", launchedAt: null, draftStep: 1, kind: "visits", requirement: 5, reward: { name: "Free coffee", terms: "", version: 1 }, card: defaultCard };
  const patch = (p: Partial<Program>) => dispatch({ type: "draft", patch: { ...p, draftStep: Math.max(d.draftStep, step) } });
  const card = (p: Partial<Program["card"]>) => dispatch({ type: "draftCard", patch: p });
  const [platform, setPlatform] = useState<"apple" | "google">("apple");
  const [previewState, setPreviewState] = useState<CardState>("collecting");
  const [signupSource, setSignupSource] = useState<"counter" | "creator">("counter");
  const [copied, setCopied] = useState(false);
  const [tried, setTried] = useState(false);
  const [terms, setTerms] = useState(false);
  const origin = useOrigin();
  const launched = state.receipt?.type === "launch" && !state.draft;
  const points = d.kind === "points";
  const reqOk = Number.isInteger(d.requirement) && (points ? d.requirement >= 2 && d.requirement <= 10000 : d.requirement >= 2 && d.requirement <= 50);
  const nameOk = d.reward.name.trim().length > 0;
  const contrastOk = contrast(d.card.bg, d.card.fg) >= 4.5 && contrast(d.card.bg, d.card.label) >= 3;
  const stepOk = step === 1 ? true : step === 2 ? reqOk && nameOk : step === 3 ? contrastOk : true;
  const preview: CardData = { design: d.card, program: d, firstName: "Sara", memberId: "LD-001", code: "LMQ-EXAMPLE-SARA", progress: previewState === "collecting" ? Math.min(3, d.requirement - 1) : previewState === "redeemed" ? 0 : d.requirement, ready: previewState === "ready" ? 1 : 0, state: previewState, offer: previewState === "updated" ? { title: "Afternoon coffee", body: "Ask us what’s pouring after 2 PM." } : null };
  const joinPath = `/design-lab-v3/join/${signupSource === "counter" ? "loopday-counter" : "loopday-jasmine-story"}`;
  const relative = "/design-lab-v3/join/loopday-counter";
  const counterUrl = `${origin}${relative}`;
  const next = () => { setTried(true); if (!stepOk) return; setTried(false); patch({ draftStep: step + 1 }); setStep((s) => Math.min(5, s + 1)); };
  const back = () => setStep((s) => Math.max(1, s - 1));
  const equation = `${d.requirement} ${points ? "points" : "visits"} → ${d.reward.name || "Reward"}`;

  if (hasLive && !launched && !state.draft) {
    return (
      <div className="create-page"><header className="record-bar"><span className="t-object">Create program</span><LabEntrance /></header>
        <p className="t-body" style={{ marginTop: 16 }}>Loopday already has a live program.</p>
        <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}><Link href="/design-lab-v3/business/loyalty/program" className="btn btn-primary">View program</Link><span className="t-note">The Design Lab control starts the blank creation scenario.</span></div>
      </div>
    );
  }

  const Brand = <div className="create-brand"><span className="loy-brand-mark" style={{ color: "var(--v2-ink)" }}><Logo design={d.card} size={28} /></span><span className="t-object">{d.card.businessName}</span></div>;
  const CloseSheet = (
    <Sheet title="Leave setup?" triggerClass="icon-btn" triggerLabel="Close" trigger={<X size={20} aria-hidden />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Link href="/design-lab-v3/business/loyalty" className="btn btn-primary" onClick={() => patch({ draftStep: step })}>Keep draft</Link>
        <Link href="/design-lab-v3/business/loyalty" className="link t-action" style={{ minHeight: 44 }} onClick={() => dispatch({ type: "draft", patch: null })}>Discard demo draft</Link>
        <button type="button" className="link t-action" style={{ minHeight: 44, textAlign: "left" }} onClick={(e) => (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close()}>Keep editing</button>
        <span className="t-note">Draft saved in this preview. A reload resets it.</span>
      </div>
    </Sheet>
  );

  return (
    <div className="create-page" data-step={step}>
      <TaskHead title={launched ? "Launch" : STEPS[step - 1]} fact={`Create program · ${step} of 5`} onBack={step > 1 && !launched ? back : undefined} close={CloseSheet} />
      <ol className="create-steps" aria-label="Steps">
        {STEPS.map((s, i) => <li key={s} aria-current={step === i + 1 ? "step" : undefined} data-done={step > i + 1 ? "true" : undefined}><button type="button" onClick={() => !launched && i + 1 <= Math.max(d.draftStep, step) && setStep(i + 1)} disabled={launched || i + 1 > Math.max(d.draftStep, step)}>{step > i + 1 && <Check size={12} weight="bold" aria-hidden className="create-step-check" />}{s}</button></li>)}
      </ol>
      <div className={`create-body${step === 3 ? " has-preview" : ""}`}>
        <section className="create-pane" aria-live="polite">
          {step === 1 && (
            <>
              {Brand}
              <span className="media create-brand-strip">{d.card.artwork && <Img src={d.card.artwork} alt="" position={d.card.artworkPosition} />}</span>
              <div className="create-choices" role="radiogroup" aria-label="Program">
                {(["visits", "points"] as ProgramKind[]).map((k) => (
                  <button type="button" key={k} role="radio" aria-checked={d.kind === k} className={`create-choice obj${d.kind === k ? " is-on" : ""}`} onClick={() => patch({ kind: k, requirement: k === "visits" ? 5 : 100 })}>
                    <span className="create-choice-marks" aria-hidden>{k === "visits" ? Array.from({ length: 5 }, (_, i) => <span key={i} className="mark" data-on="false" />) : <span className="create-point-token">1</span>}</span>
                    <span className="t-object">{k === "visits" ? "Visits" : "Points"}</span>
                    <span className="t-fact">{k === "visits" ? "One visit per qualifying purchase." : "One point per qualifying purchase."}</span>
                    <span className="create-choice-radio" aria-hidden>{d.kind === k && <Check size={14} weight="bold" />}</span>
                  </button>
                ))}
              </div>
              <p className="t-fact">One qualifying purchase counts per day.</p>
            </>
          )}
          {step === 2 && (
            <>
              <span className="t-title create-equation">{equation}</span>
                            <label className="join-field"><span className="t-fact-ink">Reward name</span><input className="join-input" value={d.reward.name} maxLength={24} onChange={(e) => { patch({ reward: { ...d.reward, name: e.target.value } }); card({ rewardTitle: e.target.value }); }} aria-invalid={tried && !nameOk ? true : undefined} />{tried && !nameOk && <span className="join-error">Enter a reward name.</span>}</label>
              <label className="join-field create-req"><span className="t-fact-ink">{points ? "Points to reward" : "Visits to reward"}</span><input className="join-input" type="number" inputMode="numeric" min={2} max={points ? 10000 : 50} step={1} value={d.requirement} onChange={(e) => patch({ requirement: Number(e.target.value) })} aria-invalid={tried && !reqOk ? true : undefined} />{tried && !reqOk && <span className="join-error">{!Number.isInteger(d.requirement) ? "Use a whole number." : points ? "Enter 2 to 10,000 points." : "Enter 2 to 50 visits."}</span>}<span className="t-fact">One qualifying purchase counts per day.</span></label>
              <div className="create-terms">
                <span className="t-fact-ink">Additional terms <span className="t-note">Optional</span></span>
                {terms || d.reward.terms ? <textarea className="join-input join-textarea" rows={3} value={d.reward.terms} maxLength={400} onChange={(e) => patch({ reward: { ...d.reward, terms: e.target.value } })} aria-label="Terms" /> : <button type="button" className="link t-action" style={{ minHeight: 44, alignSelf: "flex-start" }} onClick={() => setTerms(true)}>Add terms</button>}
                <details className="disclosure"><summary className="t-action">Program terms</summary><p className="t-fact" style={{ marginTop: 8 }}>{REWARD_TERMS}</p></details>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <a href="#card-controls" className="link t-action create-controls-anchor">Card controls</a>
              <CardControls design={d.card} onChange={card} />
              {tried && !contrastOk && <span className="join-error">Text needs more contrast.</span>}
            </>
          )}
          {step === 4 && (
            <div className="create-signup">
              <div className="create-signup-left">
                {Brand}
                <span className="t-fact-ink">{equation}</span>
                <span className="t-fact">One qualifying purchase counts per day.</span>
                <div className="create-launch-qr" data-active="false"><QR value="tapmart-demo:draft-loopday" size={160} label="Draft counter QR, not enrolling" ink="#18231D" paper="#FFFFFF" quiet={4} /><span className="t-note">Demo QR · activates after launch.</span></div>
                <div className="tabs" role="tablist" aria-label="Signup source">
                  <button type="button" role="tab" aria-selected={signupSource === "counter"} onClick={() => setSignupSource("counter")}>Counter QR</button>
                  <button type="button" role="tab" aria-selected={signupSource === "creator"} onClick={() => setSignupSource("creator")}>Creator link</button>
                </div>
              </div>
              <div className="create-signup-right">
                <span className="t-fact-ink">Signup preview · not live</span>
                <div className="create-signup-excerpt">
                  {signupSource === "creator" ? <span className="t-fact-ink">From Jasmine’s Story.</span> : <span className="t-fact-ink">Join at the counter.</span>}
                  <span className="t-title">{d.reward.name}</span>
                  <span className="t-body">Collect {d.requirement} {points ? "points" : "visits"}. Your next coffee is free.</span>
                  <span className="seq-field"><span className="t-fact">First name</span><span className="t-body">Tess</span></span>
                  <span className="seq-field"><span className="t-fact">Email</span><span className="t-body">tess@example.test</span></span>
                  <span className="join-consent" aria-disabled="true"><input type="checkbox" disabled /><span className="t-fact-ink">I agree to the demo program terms and privacy notice.</span></span>
                  <span className="t-fact">Launch before joining.</span>
                  <span className="btn btn-primary" aria-disabled="true" style={{ opacity: 0.5 }}>Create my card</span>
                </div>
                <Sheet title="Preview Wallet" variant="menu" triggerClass="link t-action" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger="Preview Wallet choices">
                  <div className="wc-wrap" style={{ marginTop: 8 }}><PlatformLabel platform="apple" /><AppleCard d={{ ...preview, firstName: "Tess", memberId: "LD-011", code: "LMQ-EXAMPLE-TESS", progress: 0, ready: 0, state: "collecting" }} width={320} className="wc-fit" /><PlatformLabel platform="apple" above={false} /><span className="t-note">Example member · Tess · 0 of {d.requirement} {points ? "points" : "visits"}</span></div>
                </Sheet>
                <Link href={joinPath} className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} target="_blank" rel="noreferrer">Open signup preview</Link>
              </div>
            </div>
          )}
          {step === 5 && (
            <>
              {Brand}
              <span className="t-title create-equation">{equation}</span>
              <span className="t-fact-ink">{launched ? "Live · simulated" : "Draft"}{launched ? " · 0 members" : ""}</span>
              <span className="t-fact">One qualifying purchase counts per day.</span>
              {!launched && <details className="disclosure"><summary className="t-action">Terms</summary><p className="t-fact" style={{ marginTop: 8 }}>{d.reward.terms || REWARD_TERMS}</p></details>}
              <div className="create-launch-qr" data-active={launched ? "true" : "false"}>
                <QR value={launched ? counterUrl : "tapmart-demo:draft-loopday"} size={launched ? 240 : 160} label={launched ? "Counter QR" : "Draft counter QR, not enrolling"} ink="#18231D" paper="#FFFFFF" quiet={4} />
                <span className="t-note">{launched ? "Demo QR · Design Lab only" : "Demo QR · activates after launch."}</span>
                {launched && <code className="create-launch-link t-fact-ink">{relative}</code>}
              </div>
              {!launched ? (
                <button type="button" className="btn btn-primary" style={{ minHeight: 56, alignSelf: "flex-start", padding: "0 24px", fontSize: 16 }} onClick={() => dispatch({ type: "launch" })}>Launch demo program</button>
              ) : (
                <>
                  <span className="t-note">No pass is issued.</span>
                  <Link href="/design-lab-v3/business/loyalty" className="btn btn-primary" style={{ alignSelf: "flex-start", minHeight: 52 }}>Open loyalty</Link>
                  <div className="create-launch-actions">
                    <button type="button" className="link t-action" onClick={() => { void navigator.clipboard?.writeText(counterUrl).catch(() => {}); setCopied(true); }}>{copied ? "Demo link copied." : "Copy demo link"}</button>
                    <Link href="/design-lab-v3/business/loyalty/qr" className="link t-action">Download demo QR</Link>
                    <Link href="/design-lab-v3/business/loyalty/qr?view=print" className="link t-action">Preview printout</Link>
                    <Link href={relative} className="link t-action">Open signup</Link>
                  </div>
                </>
              )}
            </>
          )}
          {!launched && (
            <div className="create-nav">
              <Link href="/design-lab-v3/business/loyalty" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} onClick={() => patch({ draftStep: step })}>Save draft</Link>
              {step < 5 && <button type="button" className="btn btn-primary" onClick={next}>Continue</button>}
            </div>
          )}
        </section>
        {step === 3 && (
          <aside className="create-preview" aria-label="Card preview">
            <div className="join-platforms" role="tablist" aria-label="Wallet">
              <button type="button" role="tab" aria-selected={platform === "apple"} onClick={() => setPlatform("apple")}>Apple Wallet</button>
              <button type="button" role="tab" aria-selected={platform === "google"} onClick={() => setPlatform("google")}>Google Wallet</button>
            </div>
            <div className="wc-wrap">
              <PlatformLabel platform={platform} />
              {platform === "apple" ? <AppleCard d={preview} width={375} className="wc-fit" /> : <GoogleCard d={preview} width={375} className="wc-fit" />}
              <PlatformLabel platform={platform} above={false} />
              <span className="t-note">Example member · Sara</span>
            </div>
            <label className="create-state-select"><span className="t-fact-ink">Preview state</span><select className="join-input" value={previewState} onChange={(e) => setPreviewState(e.target.value as CardState)} aria-label="Preview state">{STATES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}</select></label>
            {previewState === "updated" && <dl className="wc-details"><div><dt>Offer</dt><dd>Afternoon coffee. Ask us what’s pouring after 2 PM.</dd></div><div><dt>Where it lives</dt><dd>Apple back field; Google pass details message.</dd></div></dl>}
          </aside>
        )}
      </div>
    </div>
  );
}
