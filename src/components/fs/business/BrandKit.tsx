"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, X } from "@phosphor-icons/react";
import type { BrandKit, BrandKitRecord, BrandProposal, BrandSource, ExistingSignals } from "@/lib/business/brand";
import { NO_SOURCES_MESSAGE } from "@/lib/business/brand-messages";
import { approveBrand, discardBrand, researchBrandAction, saveLogo, saveWebsite } from "@/app/(v2)/business/brand/actions";
import { FsUploader } from "@/components/fs/work/Uploader";
import { Img } from "@/components/fs/Img";

/**
 * Brand kit in Frame Shift. Four moments, in the order the product runs:
 *
 *   Current brand   the approved kit as a visual (logo, colours, type,
 *                   photo style, voice, content style, rules)
 *   Sources         what is real to research: Instagram, Google, the
 *                   website, the logo, uploaded photos. TapMart reads
 *                   these before it suggests anything.
 *   Preview         what research found and what it proposes, side by
 *                   side, with the improvements numbered
 *   Approval        Approve moves the proposal into the kit; Keep mine
 *                   leaves the kit untouched. Nothing overwrites itself.
 */
export type BrandSources = {
  instagram: { connected: boolean; handle: string | null; configured: boolean };
  google: { connected: boolean; title: string | null; configured: boolean };
  website: string | null;
  logoUrl: string | null;
};

type Step = "kit" | "sources" | "researching" | "review";

function hasKit(kit: BrandKit): boolean {
  return kit.palette.length > 0 || Boolean(kit.logo_url) || Boolean(kit.tone);
}

export function BrandKitStudio({ record, businessName, sources: initialSources, canEdit }: { record: BrandKitRecord; businessName: string; sources: BrandSources; canEdit: boolean }) {
  const router = useRouter();
  const approved = record.status === "approved" && hasKit(record.kit);
  const [kit, setKit] = useState<BrandKit>(record.kit);
  const [proposal, setProposal] = useState<BrandProposal | null>(record.proposed);
  const [source, setSource] = useState<BrandSource | null>(record.proposed_source);
  const [signals, setSignals] = useState<ExistingSignals | null>(record.existing_signals);
  const [sources, setSources] = useState<BrandSources>(initialSources);
  const [photos, setPhotos] = useState<string[]>([]);
  const [step, setStep] = useState<Step>(record.proposed ? "review" : approved || hasKit(record.kit) ? "kit" : "sources");
  const [error, setError] = useState<string | null>(null);
  const [deciding, startDecide] = useTransition();
  const [researching, startResearch] = useTransition();
  const anySource = sources.instagram.connected || sources.google.connected || Boolean(sources.website) || Boolean(sources.logoUrl) || photos.length > 0;

  const research = () => {
    setError(null); setStep("researching");
    startResearch(async () => {
      const r = await researchBrandAction({ photoUrls: photos });
      if (!r.ok) { setError(r.error); setStep("sources"); return; }
      if (r.data) { setProposal(r.data.proposal); setSource(r.data.source); setSignals(r.data.signals); }
      setStep("review"); router.refresh();
    });
  };
  const approve = () => {
    setError(null);
    startDecide(async () => {
      const r = await approveBrand();
      if (!r.ok) { setError(r.error); return; }
      if (r.data) setKit(r.data);
      setProposal(null); setSource(null); setStep("kit"); router.refresh();
    });
  };
  const keepMine = () => {
    setError(null);
    startDecide(async () => {
      const r = await discardBrand();
      if (!r.ok) { setError(r.error); return; }
      setProposal(null); setSource(null); setStep(hasKit(kit) ? "kit" : "sources"); router.refresh();
    });
  };

  return (
    <div>
      {step === "kit" && (
        <section aria-label="Current brand" style={{ marginTop: 16 }}>
          <div className="fs-brand-head">
            <p className="fs-t-label">Current brand <span className={`fs-status is-${record.status === "approved" ? "confirmed" : "waiting"}`}>· {record.status === "approved" ? "Approved" : "Draft"}</span></p>
            {canEdit && <button type="button" className="fs-btn fs-btn-secondary" onClick={() => setStep("sources")}>Suggest improvements</button>}
          </div>
          <BrandVisual kit={kit} businessName={businessName} traits={signals?.tone_words ?? []} profileLogo={sources.logoUrl} />
        </section>
      )}

      {step === "sources" && (
        <SourcesPanel
          title={hasKit(kit) ? "What TapMart will read" : "Build the brand kit from what is real"}
          back={hasKit(kit) ? () => setStep("kit") : null}
          sources={sources} photos={photos} canEdit={canEdit} anySource={anySource}
          onWebsite={(website) => setSources((s) => ({ ...s, website }))}
          onLogo={(logoUrl) => setSources((s) => ({ ...s, logoUrl }))}
          onPhotos={setPhotos} onResearch={research}
        />
      )}

      {step === "researching" && <Progress sources={sources} photos={photos.length} running={researching} />}

      {step === "review" && proposal && (
        <section aria-label="Suggestions" style={{ marginTop: 16 }}>
          <p className="fs-t-label">Suggestions <span className="fs-status is-waiting">· Waiting for your decision</span></p>
          <p className="fs-t-meta" style={{ marginTop: 4 }}>{source === "ai" ? "Proposed from what TapMart read in your sources." : "Proposed from the details already on your profile."} Nothing has changed yet.</p>
          {signals?.notes && signals.notes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p className="fs-t-label">What research found</p>
              <ul className="fs-plain-list" aria-label="What research found">
                {signals.notes.map((n) => <li key={n} className="fs-t-meta" style={{ padding: "2px 0" }}>{n}</li>)}
              </ul>
            </div>
          )}
          <p className="fs-t-task" style={{ marginTop: 16 }}>
            {proposal.improvements.length === 0 ? "Nothing to change. Your brand already reads as one." : `${proposal.improvements.length} way${proposal.improvements.length === 1 ? "" : "s"} to make your brand more consistent`}
          </p>
          {proposal.improvements.length > 0 && (
            <ol className="fs-plain-list" style={{ marginTop: 8 }}>
              {proposal.improvements.map((line, i) => (
                <li key={line} style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", gap: 8, padding: "8px 0", borderTop: i ? "1px solid var(--fs-divider)" : undefined }}>
                  <span className="fs-display fs-tnum" style={{ fontWeight: 700, fontSize: 18 }}>{i + 1}</span>
                  <span className="fs-t-body">{line}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="fs-brand-compare">
            <div className="fs-brand-side">
              <p className="fs-t-label">In use now</p>
              <p className="fs-t-meta">Your saved brand kit</p>
              <Compare
                logo={signals?.logo_url ?? kit.logo_url}
                colors={signals?.colors.length ? signals.colors : kit.palette}
                fonts={signals?.fonts.length ? signals.fonts : [kit.type.display, kit.type.body].filter((f): f is string => Boolean(f))}
                voice={signals?.tone_words.length ? signals.tone_words.join(", ") : kit.tone}
                images={signals?.images.length ? signals.images : kit.image_examples}
                businessName={businessName}
              />
            </div>
            <div className="fs-brand-side is-proposed">
              <p className="fs-t-label">Proposed</p>
              <p className="fs-t-meta">What would change</p>
              <Compare logo={proposal.logo_url} colors={proposal.palette} fonts={[proposal.type.display, proposal.type.body].filter((f): f is string => Boolean(f))} voice={proposal.tone} images={proposal.image_examples} businessName={businessName} />
            </div>
          </div>

          <details className="fs-disclosure is-command" style={{ marginTop: 16 }}>
            <summary className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>Preview the proposed kit in full</summary>
            <BrandVisual kit={proposal} businessName={businessName} traits={signals?.tone_words ?? []} />
          </details>

          {canEdit ? (
            <div className="fs-plane is-decision" style={{ marginTop: 16 }} aria-label="Decision">
              <p className="fs-t-label">Your decision</p>
              <p className="fs-t-body" style={{ marginTop: 4 }}>Approve replaces the kit in use with the proposal. Keep mine discards the proposal and changes nothing.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button type="button" className="fs-btn fs-btn-primary" disabled={deciding} onClick={approve}>{deciding ? "One moment" : "Approve the proposal"}</button>
                <button type="button" className="fs-btn fs-btn-secondary" disabled={deciding} onClick={keepMine}>Keep mine</button>
              </div>
            </div>
          ) : <p className="fs-t-meta" style={{ marginTop: 16 }}>Only the owner or a manager can approve a kit.</p>}
        </section>
      )}

      {error && <p role="alert" className="fs-field-error" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}

// ------------------------------------------------------------ sources

function SourcesPanel({ title, back, sources, photos, canEdit, anySource, onWebsite, onLogo, onPhotos, onResearch }: {
  title: string; back: (() => void) | null; sources: BrandSources; photos: string[]; canEdit: boolean; anySource: boolean;
  onWebsite: (website: string | null) => void; onLogo: (url: string | null) => void; onPhotos: (urls: string[]) => void; onResearch: () => void;
}) {
  const [editingSite, setEditingSite] = useState(false);
  const [site, setSite] = useState(sources.website ?? "");
  const [siteError, setSiteError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const submitSite = () => { setSiteError(null); startSave(async () => { const r = await saveWebsite(site); if (!r.ok) { setSiteError(r.error); return; } onWebsite(r.data?.website ?? null); setEditingSite(false); }); };
  const logoUploaded = (urls: string[]) => { const url = urls[0]; if (!url) return; startSave(async () => { const r = await saveLogo(url); if (r.ok) onLogo(r.data?.logoUrl ?? url); }); };
  const stateWord = (on: boolean, detail: string | null) => on ? <span className="fs-status is-confirmed">Connected{detail ? ` · ${detail}` : ""}</span> : <span className="fs-status is-neutral">Not connected</span>;

  return (
    <section aria-label={title} style={{ marginTop: 16 }}>
      {back && <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }} onClick={back}>Back to the current brand</button>}
      <p className="fs-t-task">{title}</p>
      <p className="fs-t-meta" style={{ marginTop: 4 }}>TapMart reads what you already have and shows what it found before it suggests anything.</p>
      <ul className="fs-plain-list" aria-label="Sources" style={{ marginTop: 8 }}>
        <li className="fs-conn-row">
          <span className="fs-t-label" aria-hidden>IG</span>
          <span style={{ minWidth: 0 }}><span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Instagram</span><span className="fs-t-meta" style={{ display: "block" }}>{stateWord(sources.instagram.connected, sources.instagram.handle ? `@${sources.instagram.handle}` : null)}</span></span>
          {!sources.instagram.connected && <span className="fs-conn-actions"><Link href="/business/settings/connections" className="fs-btn fs-btn-secondary fs-btn-sm">Connect</Link></span>}
        </li>
        <li className="fs-conn-row">
          <span className="fs-t-label" aria-hidden>G</span>
          <span style={{ minWidth: 0 }}><span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Google Business Profile</span><span className="fs-t-meta" style={{ display: "block" }}>{stateWord(sources.google.connected, sources.google.title)}</span></span>
          {!sources.google.connected && <span className="fs-conn-actions"><Link href="/business/settings/connections" className="fs-btn fs-btn-secondary fs-btn-sm">Connect</Link></span>}
        </li>
        <li className="fs-conn-row" style={{ display: "block" }}>
          <div className="fs-conn-row" style={{ borderTop: 0, padding: 0, minHeight: 48 }}>
            <span className="fs-t-label" aria-hidden>www</span>
            <span style={{ minWidth: 0 }}><span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Website</span><span className="fs-t-meta" style={{ display: "block", overflowWrap: "anywhere" }}>{sources.website ?? "No website on your profile"}</span></span>
            {canEdit && !editingSite && <span className="fs-conn-actions"><button type="button" className="fs-btn fs-btn-secondary fs-btn-sm" onClick={() => setEditingSite(true)}>{sources.website ? "Change" : "Add website"}</button></span>}
          </div>
          {editingSite && (
            <form style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); submitSite(); }}>
              <input className="fs-input" style={{ flex: "1 1 200px" }} type="text" inputMode="url" placeholder="https://" value={site} onChange={(e) => setSite(e.target.value)} maxLength={200} aria-label="Website" />
              <button type="submit" className="fs-btn fs-btn-primary" disabled={saving}>{saving ? "Saving" : "Save"}</button>
              <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" onClick={() => { setEditingSite(false); setSiteError(null); }}>Cancel</button>
            </form>
          )}
          {siteError && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{siteError}</p>}
        </li>
        <li className="fs-conn-row">
          <span className="fs-biz-logo" style={{ width: 40, height: 40 }}>{sources.logoUrl ? <Img src={sources.logoUrl} alt="Logo" /> : null}</span>
          <span style={{ minWidth: 0 }}><span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Logo</span><span className="fs-t-meta" style={{ display: "block" }}>{sources.logoUrl ? "On your profile" : "No logo yet"}</span></span>
          {canEdit && <span className="fs-conn-actions"><FsUploader id="fs-brand-logo" folder="business" accept="image/*" label={sources.logoUrl ? "Replace" : "Upload"} onUploaded={logoUploaded} /></span>}
        </li>
        <li className="fs-conn-row" style={{ display: "block" }}>
          <div className="fs-conn-row" style={{ borderTop: 0, padding: 0, minHeight: 48 }}>
            <span className="fs-t-label" aria-hidden>{photos.length}</span>
            <span style={{ minWidth: 0 }}><span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Photos you like</span><span className="fs-t-meta" style={{ display: "block" }}>{photos.length === 0 ? "Optional, up to 8" : `${photos.length} of 8`}</span></span>
            {canEdit && photos.length < 8 && <span className="fs-conn-actions"><FsUploader id="fs-brand-photos" folder="business" accept="image/*" multiple label="Add photos" onUploaded={(u) => onPhotos(Array.from(new Set([...photos, ...u])).slice(0, 8))} /></span>}
          </div>
          {photos.length > 0 && (
            <ul className="fs-brand-images" aria-label="Photos added">
              {photos.map((url) => (
                <li key={url} style={{ position: "relative" }}>
                  <Img src={url} alt="" />
                  <button type="button" aria-label="Remove photo" className="fs-icon-btn" style={{ position: "absolute", top: 4, right: 4, background: "#fff", width: 36, height: 36 }} onClick={() => onPhotos(photos.filter((x) => x !== url))}><X size={16} aria-hidden /></button>
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
      <div style={{ marginTop: 16 }}>
        <button type="button" className="fs-btn fs-btn-primary" disabled={!canEdit || !anySource} onClick={onResearch}>Read my sources and suggest</button>
        {!anySource && <p className="fs-t-meta" style={{ marginTop: 8 }}>{NO_SOURCES_MESSAGE}</p>}
        {!canEdit && <p className="fs-t-meta" style={{ marginTop: 8 }}>Only the owner or a manager can research the brand.</p>}
        {!sources.instagram.configured && !sources.instagram.connected && <p className="fs-t-meta" style={{ marginTop: 8 }}>TapMart&apos;s Instagram connection is not configured yet. Ask support to enable it.</p>}
      </div>
    </section>
  );
}

// ----------------------------------------------------------- progress

function Progress({ sources, photos, running }: { sources: BrandSources; photos: number; running: boolean }) {
  const lines = [
    sources.instagram.connected ? "Reading your Instagram" : null,
    sources.google.connected ? "Reading your Google listing" : null,
    sources.website ? "Reading your website" : null,
    sources.logoUrl ? "Looking at your logo" : null,
    photos > 0 ? `Looking at ${photos} photo${photos === 1 ? "" : "s"}` : null,
    "Writing the proposal",
  ].filter((l): l is string => Boolean(l));
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= lines.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 700);
    return () => clearTimeout(t);
  }, [shown, lines.length]);
  return (
    <section className="fs-plane" aria-live="polite" aria-label="Researching" style={{ marginTop: 16 }}>
      <ul className="fs-progress-lines">
        {lines.slice(0, shown).map((line, i) => {
          const current = i === shown - 1 && running;
          return <li key={line} className="fs-t-body" style={{ display: "flex", alignItems: "center", gap: 12, color: current ? "var(--fs-ink)" : "var(--fs-muted)" }}>{current ? <span className="fs-live-dot" aria-hidden /> : <CheckCircle size={18} weight="fill" aria-hidden style={{ color: "var(--fs-confirmed)" }} />}{line}</li>;
        })}
      </ul>
    </section>
  );
}

// -------------------------------------------------------------- visual

export function Swatches({ colors, small = false }: { colors: string[]; small?: boolean }) {
  if (colors.length === 0) return <p className="fs-t-meta" style={{ marginTop: 8 }}>No colours yet</p>;
  return (
    <ul className="fs-swatches" aria-label="Colours">
      {colors.slice(0, 6).map((hex, i) => <li key={`${hex}-${i}`}><span className={`fs-swatch${small ? " is-small" : ""}`} style={{ background: hex }} aria-hidden />{hex.toUpperCase()}</li>)}
    </ul>
  );
}

function BrandVisual({ kit, businessName, traits, profileLogo = null }: { kit: BrandKit; businessName: string; traits: string[]; profileLogo?: string | null }) {
  const images = kit.image_examples;
  const logo = kit.logo_url ?? profileLogo;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className="fs-brand-logo">{logo ? <Img src={logo} alt={`${businessName} logo`} /> : <span className="fs-t-meta">No logo</span>}</span>
        <span style={{ minWidth: 0 }}>
          <span className="fs-t-section" style={{ display: "block", overflowWrap: "anywhere" }}>{businessName}</span>
          <span className="fs-t-meta" style={{ display: "block" }}>{kit.logo_url ? "Logo in the kit" : logo ? "Logo from your profile, not yet part of the kit" : "No logo yet"}</span>
        </span>
      </div>
      <div style={{ marginTop: 20 }}><p className="fs-t-label">Colours</p><Swatches colors={kit.palette} /></div>
      <div style={{ marginTop: 20 }}>
        <p className="fs-t-label">Typography direction</p>
        <dl className="fs-facts" style={{ marginTop: 8 }}>
          <div style={{ display: "contents" }}><dt>Headlines</dt><dd>{kit.type.display ?? "Not picked yet"}</dd></div>
          <div style={{ display: "contents" }}><dt>Body</dt><dd>{kit.type.body ?? "Not picked yet"}</dd></div>
        </dl>
      </div>
      <div style={{ marginTop: 20 }}>
        <p className="fs-t-label">Photo style</p>
        <p className="fs-t-body" style={{ marginTop: 4, color: kit.photo_style ? undefined : "var(--fs-muted)" }}>{kit.photo_style ?? "No photo style yet"}</p>
        {images.length > 0 && <ul className="fs-brand-images" aria-label="Photo examples">{images.slice(0, 4).map((url) => <li key={url}><Img src={url} alt="" /></li>)}</ul>}
      </div>
      <div style={{ marginTop: 20 }}>
        <p className="fs-t-label">Voice</p>
        {traits.length > 0 && <p className="fs-t-body" style={{ marginTop: 4, fontWeight: 500 }}>{traits.slice(0, 5).join(" · ")}</p>}
        <p className="fs-t-body" style={{ marginTop: 4, color: kit.tone ? undefined : "var(--fs-muted)" }}>{kit.tone ?? (traits.length ? "" : "No voice yet")}</p>
      </div>
      <div style={{ marginTop: 20 }}>
        <p className="fs-t-label">Content style</p>
        <p className="fs-t-body" style={{ marginTop: 4, color: kit.content_style ? undefined : "var(--fs-muted)" }}>{kit.content_style ?? "No content style yet"}</p>
      </div>
      {kit.guidelines.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p className="fs-t-label">Rules</p>
          <ul className="fs-plain-list" style={{ marginTop: 4 }}>{kit.guidelines.map((g, i) => <li key={g} className="fs-t-body" style={{ padding: "6px 0", borderTop: i ? "1px solid var(--fs-divider)" : undefined }}>{g}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function Compare({ logo, colors, fonts, voice, images, businessName }: { logo: string | null; colors: string[]; fonts: string[]; voice: string | null; images: string[]; businessName: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <span className="fs-brand-logo" style={{ width: 56, height: 56 }}>{logo ? <Img src={logo} alt={`${businessName} logo`} /> : <span className="fs-t-meta">None</span>}</span>
      <Swatches colors={colors} small />
      <dl className="fs-facts" style={{ marginTop: 12 }}>
        <div style={{ display: "contents" }}><dt>Type</dt><dd>{fonts.length ? fonts.join(" with ") : "None"}</dd></div>
        <div style={{ display: "contents" }}><dt>Voice</dt><dd>{voice ?? "None"}</dd></div>
      </dl>
      {images.length > 0 && <ul className="fs-brand-images" aria-label="Examples">{images.slice(0, 4).map((url) => <li key={url}><Img src={url} alt="" /></li>)}</ul>}
    </div>
  );
}
