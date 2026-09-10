"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight, CheckCircle, GoogleLogo, Globe, Image as ImageIcon, InstagramLogo, PencilSimple, X } from "@phosphor-icons/react";
import type { BrandKit, BrandKitRecord, BrandProposal, BrandSource, ExistingSignals } from "@/lib/business/brand";
import { NO_SOURCES_MESSAGE } from "@/lib/business/brand-messages";
import { Uploader } from "@/components/v2/Uploader";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Avatar, Chip } from "@/components/v2/ui";
import { approveBrand, discardBrand, researchBrandAction, saveLogo, saveWebsite } from "./actions";

/**
 * The brand screen in three steps: sources (what is real to research),
 * progress (one live line per source while research runs), and the result
 * (the brand as a visual, then the improvements to review). Only Approve
 * moves a proposal into the kit; "Keep mine" leaves the kit untouched.
 */

export type BrandSources = {
  instagram: { connected: boolean; handle: string | null; configured: boolean };
  google: { connected: boolean; title: string | null; configured: boolean };
  website: string | null;
  logoUrl: string | null;
};

type Step = "kit" | "sources" | "researching" | "result" | "review";

function hasKit(kit: BrandKit): boolean {
  return kit.palette.length > 0 || Boolean(kit.logo_url) || Boolean(kit.tone);
}

export function BrandStudio({
  record, businessName, sources: initialSources, canEdit,
}: { record: BrandKitRecord; businessName: string; sources: BrandSources; canEdit: boolean }) {
  const router = useRouter();
  const approved = record.status === "approved" && hasKit(record.kit);
  const [kit, setKit] = useState<BrandKit>(record.kit);
  const [proposal, setProposal] = useState<BrandProposal | null>(record.proposed);
  const [source, setSource] = useState<BrandSource | null>(record.proposed_source);
  const [signals, setSignals] = useState<ExistingSignals | null>(record.existing_signals);
  const [sources, setSources] = useState<BrandSources>(initialSources);
  const [photos, setPhotos] = useState<string[]>([]);
  const [step, setStep] = useState<Step>(record.proposed ? "result" : approved ? "kit" : "sources");
  const [error, setError] = useState<string | null>(null);
  const [deciding, startDecide] = useTransition();
  const [researching, startResearch] = useTransition();

  const anySource = sources.instagram.connected || sources.google.connected || Boolean(sources.website) || Boolean(sources.logoUrl) || photos.length > 0;

  const research = () => {
    setError(null);
    setStep("researching");
    startResearch(async () => {
      const result = await researchBrandAction({ photoUrls: photos });
      if (!result.ok) { setError(result.error); setStep("sources"); return; }
      if (result.data) {
        setProposal(result.data.proposal);
        setSource(result.data.source);
        setSignals(result.data.signals);
      }
      setStep("result");
      router.refresh();
    });
  };

  const approve = () => {
    setError(null);
    startDecide(async () => {
      const result = await approveBrand();
      if (!result.ok) { setError(result.error); return; }
      if (result.data) setKit(result.data);
      setProposal(null);
      setSource(null);
      setStep("kit");
      router.refresh();
    });
  };

  const keepMine = () => {
    setError(null);
    startDecide(async () => {
      const result = await discardBrand();
      if (!result.ok) { setError(result.error); return; }
      setProposal(null);
      setSource(null);
      setStep(approved || hasKit(kit) ? "kit" : "sources");
      router.refresh();
    });
  };

  return (
    <div>
      {/* ------------------------------------------------------ THE KIT */}
      {step === "kit" && (
        <section className="mt-5" aria-label="Your brand kit">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="eyebrow">Your brand</h2>
            {canEdit && (
              <button type="button" className="link-row text-sm" onClick={() => setStep("sources")}>
                <PencilSimple size={16} aria-hidden />Refine my brand
              </button>
            )}
          </div>
          <BrandVisual kit={kit} businessName={businessName} traits={signals?.tone_words ?? []} />
        </section>
      )}

      {/* ------------------------------------------------------ SOURCES */}
      {step === "sources" && (
        <SourcesPanel
          title={approved || hasKit(kit) ? "Refine my brand" : "Build your Brand Kit"}
          sources={sources} photos={photos} canEdit={canEdit} anySource={anySource}
          onBack={approved || hasKit(kit) ? () => setStep("kit") : null}
          onWebsite={(website) => setSources((s) => ({ ...s, website }))}
          onLogo={(logoUrl) => setSources((s) => ({ ...s, logoUrl }))}
          onPhotos={setPhotos}
          onResearch={research}
        />
      )}

      {/* ----------------------------------------------------- PROGRESS */}
      {step === "researching" && <Progress sources={sources} photos={photos.length} running={researching} />}

      {/* ------------------------------------------------------- RESULT */}
      {step === "result" && proposal && (
        <section className="mt-5" aria-label="What research found">
          <div className="flex items-center justify-between gap-3">
            <h2 className="eyebrow">Your brand</h2>
            <Chip tone="faint">{source === "ai" ? "Proposed by AI" : "Proposed by template"}</Chip>
          </div>
          <BrandVisual kit={proposal} businessName={businessName} traits={signals?.tone_words ?? []} reveal />
          {signals?.notes && signals.notes.length > 0 && (
            <ul className="mt-5 flex flex-col gap-1 text-sm text-ink-faint" aria-label="What research looked at">
              {signals.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          <p className="mt-6 font-display text-[1.25rem] leading-tight font-700 tracking-[-0.02em]">
            {proposal.improvements.length === 0
              ? "TapMart found nothing to change. Your brand already reads as one."
              : `TapMart found ${proposal.improvements.length} way${proposal.improvements.length === 1 ? "" : "s"} to make your brand more consistent.`}
          </p>
          <button type="button" className="btn btn-signal btn-lg mt-4 w-full" onClick={() => setStep("review")}>
            Review improvements<CaretRight size={18} weight="bold" aria-hidden />
          </button>
        </section>
      )}

      {/* ------------------------------------------------------- REVIEW */}
      {step === "review" && proposal && (
        <section className="mt-5" aria-label="Review improvements">
          <button type="button" onClick={() => setStep("result")} className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 font-display text-sm font-600 text-ink-soft">
            <CaretLeft size={20} weight="bold" aria-hidden />Back
          </button>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="eyebrow">Improvements</h2>
            <Chip tone="faint">{source === "ai" ? "Proposed by AI" : "Proposed by template"}</Chip>
          </div>
          {proposal.improvements.length > 0 && (
            <ol className="mt-2 divide-y divide-rule">
              {proposal.improvements.map((line, i) => (
                <li key={line} className="reveal flex gap-3 py-3" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                  <span className="tnum w-6 shrink-0 font-display text-[1.0625rem] font-700 text-signal">{i + 1}</span>
                  <span className="text-[0.9375rem] text-ink">{line}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div>
              <h3 className="eyebrow">Existing</h3>
              <p className="mt-1 text-sm text-ink-faint">What research found in use</p>
              <Compare
                logo={signals?.logo_url ?? kit.logo_url}
                colors={signals?.colors.length ? signals.colors : kit.palette}
                fonts={signals?.fonts.length ? signals.fonts : [kit.type.display, kit.type.body].filter((f): f is string => Boolean(f))}
                voice={signals?.tone_words.length ? signals.tone_words.join(", ") : kit.tone}
                images={signals?.images.length ? signals.images : kit.image_examples}
                businessName={businessName}
              />
            </div>
            <div>
              <h3 className="eyebrow">Suggested</h3>
              <p className="mt-1 text-sm text-ink-faint">What changes</p>
              <Compare
                logo={proposal.logo_url}
                colors={proposal.palette}
                fonts={[proposal.type.display, proposal.type.body].filter((f): f is string => Boolean(f))}
                voice={proposal.tone}
                images={proposal.image_examples}
                businessName={businessName}
              />
            </div>
          </div>

          {canEdit ? (
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn btn-signal btn-lg flex-1" disabled={deciding} onClick={approve}>
                {deciding ? "One moment" : "Approve"}
              </button>
              <button type="button" className="btn btn-lg flex-1" disabled={deciding} onClick={keepMine}>Keep mine</button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink-faint">Only the owner or a manager can approve a kit.</p>
          )}
        </section>
      )}

      {error && <p role="alert" className="mt-4 text-sm alert-text">{error}</p>}
    </div>
  );
}

// ------------------------------------------------------------ sources

function SourcesPanel({
  title, sources, photos, canEdit, anySource, onBack, onWebsite, onLogo, onPhotos, onResearch,
}: {
  title: string; sources: BrandSources; photos: string[]; canEdit: boolean; anySource: boolean;
  onBack: (() => void) | null;
  onWebsite: (website: string | null) => void; onLogo: (url: string | null) => void;
  onPhotos: (urls: string[]) => void; onResearch: () => void;
}) {
  const [editingSite, setEditingSite] = useState(false);
  const [site, setSite] = useState(sources.website ?? "");
  const [siteError, setSiteError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const submitSite = () => {
    setSiteError(null);
    startSave(async () => {
      const result = await saveWebsite(site);
      if (!result.ok) { setSiteError(result.error); return; }
      onWebsite(result.data?.website ?? null);
      setEditingSite(false);
    });
  };

  const logoUploaded = (urls: string[]) => {
    const url = urls[0];
    if (!url) return;
    startSave(async () => {
      const result = await saveLogo(url);
      if (result.ok) onLogo(result.data?.logoUrl ?? url);
    });
  };

  return (
    <section className="mt-5" aria-label={title}>
      {onBack && (
        <button type="button" onClick={onBack} className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 font-display text-sm font-600 text-ink-soft">
          <CaretLeft size={20} weight="bold" aria-hidden />Back
        </button>
      )}
      <h2 className="font-display text-[1.375rem] leading-tight font-700 tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">TapMart reads what you already have and shows what it found.</p>

      <ul className="mt-4 divide-y divide-rule" aria-label="Sources">
        {/* Instagram */}
        <li className="reveal flex min-h-16 items-center gap-3 py-3">
          <InstagramLogo size={28} weight="fill" className="shrink-0 text-ink" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.0625rem] leading-tight font-600">Instagram</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
              {sources.instagram.connected
                ? <><CheckCircle size={16} weight="fill" className="text-rise" aria-hidden />Connected{sources.instagram.handle ? ` @${sources.instagram.handle}` : ""}</>
                : "Not connected"}
            </p>
          </div>
          {!sources.instagram.connected && <Link href="/business/settings/connections" className="btn btn-sm shrink-0">Connect</Link>}
        </li>
        {/* Google */}
        <li className="reveal flex min-h-16 items-center gap-3 py-3" style={{ animationDelay: "60ms" }}>
          <GoogleLogo size={28} weight="bold" className="shrink-0 text-ink" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.0625rem] leading-tight font-600">Google</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
              {sources.google.connected
                ? <><CheckCircle size={16} weight="fill" className="text-rise" aria-hidden />Connected{sources.google.title ? ` ${sources.google.title}` : ""}</>
                : "Not connected"}
            </p>
          </div>
          {!sources.google.connected && <Link href="/business/settings/connections" className="btn btn-sm shrink-0">Connect</Link>}
        </li>
        {/* Website */}
        <li className="reveal py-3" style={{ animationDelay: "120ms" }}>
          <div className="flex min-h-10 items-center gap-3">
            <Globe size={28} weight="fill" className="shrink-0 text-ink" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.0625rem] leading-tight font-600">Website</p>
              <p className="mt-0.5 truncate text-sm text-ink-soft">{sources.website ?? "No website on your profile"}</p>
            </div>
            {canEdit && !editingSite && (
              <button type="button" className="btn btn-sm shrink-0" onClick={() => setEditingSite(true)}>{sources.website ? "Change" : "Add website"}</button>
            )}
          </div>
          {editingSite && (
            <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); submitSite(); }}>
              <input className="field flex-1" type="text" inputMode="url" placeholder="https://" value={site} onChange={(e) => setSite(e.target.value)} maxLength={200} aria-label="Website" />
              <button type="submit" className="btn" disabled={saving}>{saving ? "Saving" : "Save"}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setEditingSite(false); setSiteError(null); }}>Cancel</button>
            </form>
          )}
          {siteError && <p role="alert" className="mt-2 text-sm alert-text">{siteError}</p>}
        </li>
        {/* Logo */}
        <li className="reveal flex min-h-16 items-center gap-3 py-3" style={{ animationDelay: "180ms" }}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
            {sources.logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={sources.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              : <ImageIcon size={24} className="text-ink-faint" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.0625rem] leading-tight font-600">Logo</p>
            <p className="mt-0.5 text-sm text-ink-soft">{sources.logoUrl ? "On your profile" : "No logo yet"}</p>
          </div>
          {canEdit && <Uploader id="brand-logo" folder="business" accept="image/*" label={sources.logoUrl ? "Replace" : "Upload"} onUploaded={logoUploaded} />}
        </li>
        {/* Photos */}
        <li className="reveal py-3" style={{ animationDelay: "240ms" }}>
          <div className="flex min-h-10 items-center gap-3">
            <ImageIcon size={28} weight="fill" className="shrink-0 text-ink" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.0625rem] leading-tight font-600">Photos</p>
              <p className="mt-0.5 text-sm text-ink-soft">{photos.length === 0 ? "Optional. Photos you like." : `${photos.length} of 8`}</p>
            </div>
            {canEdit && photos.length < 8 && (
              <Uploader id="brand-photos" folder="business" accept="image/*" multiple label="Add photos" onUploaded={(u) => onPhotos(Array.from(new Set([...photos, ...u])).slice(0, 8))} />
            )}
          </div>
          {photos.length > 0 && (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {photos.map((url) => (
                <li key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Remove photo" className="glass-tag absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full text-ink" onClick={() => onPhotos(photos.filter((x) => x !== url))}>
                    <X size={14} weight="bold" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>

      <button type="button" className="btn btn-signal btn-lg mt-6 w-full" disabled={!canEdit || !anySource} onClick={onResearch}>
        Research my brand
      </button>
      {!anySource && <p className="mt-3 text-sm text-ink-soft">{NO_SOURCES_MESSAGE}</p>}
      {!sources.instagram.configured && !sources.instagram.connected && (
        <p className="mt-3 text-sm text-ink-faint">TapMart&apos;s Instagram connection is not configured yet. Ask support to enable it.</p>
      )}
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
    "Writing your brand",
  ].filter((l): l is string => Boolean(l));
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= lines.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 700);
    return () => clearTimeout(t);
  }, [shown, lines.length]);

  return (
    <section className="card mt-5 px-5 py-6" aria-live="polite" aria-label="Researching">
      <ul className="flex flex-col gap-3">
        {lines.slice(0, shown).map((line, i) => {
          const current = i === shown - 1 && running;
          return (
            <li key={line} className="settle flex items-center gap-3 font-display text-[1.0625rem] font-600">
              {current ? <span className="live-dot" aria-hidden /> : <CheckCircle size={18} weight="fill" className="text-rise" aria-hidden />}
              <span className={current ? "text-ink" : "text-ink-soft"}>{line}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// -------------------------------------------------------------- visual

function BrandVisual({ kit, businessName, traits, reveal = false }: { kit: BrandKit; businessName: string; traits: string[]; reveal?: boolean }) {
  const delay = (i: number) => (reveal ? { animationDelay: `${Math.min(i, 6) * 60}ms` } : undefined);
  const cls = reveal ? "reveal" : "";
  const images = kit.image_examples;
  return (
    <div className="mt-3">
      <div className={`flex items-center gap-4 ${cls}`} style={delay(0)}>
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-surface">
          {kit.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.logo_url} alt={`${businessName} logo`} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Avatar src={null} name={businessName} size={56} /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[1.375rem] leading-tight font-700 tracking-[-0.02em]">{businessName}</p>
          {!kit.logo_url && <p className="mt-1 text-sm text-ink-faint">No logo yet</p>}
        </div>
      </div>

      <div className={`mt-6 ${cls}`} style={delay(1)}>
        <h3 className="eyebrow">Colors</h3>
        {kit.palette.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-3" aria-label="Colors">
            {kit.palette.slice(0, 6).map((hex, i) => (
              <li key={`${hex}-${i}`} className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-full" style={{ background: hex, boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-ink) 12%, transparent) inset" }} aria-hidden />
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-ink-soft">{hex}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-ink-faint">No colors yet</p>}
      </div>

      <div className={`mt-6 ${cls}`} style={delay(2)}>
        <h3 className="eyebrow">Type</h3>
        <dl className="mt-2 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[0.9375rem]">
          <dt className="text-ink-faint">Headline</dt><dd className="text-ink">{kit.type.display ?? "Not picked"}</dd>
          <dt className="text-ink-faint">Body</dt><dd className="text-ink">{kit.type.body ?? "Not picked"}</dd>
        </dl>
      </div>

      <div className={`mt-6 ${cls}`} style={delay(3)}>
        <h3 className="eyebrow">Photo style</h3>
        {kit.photo_style && <p className="mt-2 text-[0.9375rem] text-ink">{kit.photo_style}</p>}
        {images.length > 0 ? (
          <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:-mx-8 md:px-8" aria-label="Photo examples">
            {images.slice(0, 6).map((url, i) => (
              <li key={url} className="h-28 w-28 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2" style={delay(i)}>
                <MediaPreview src={url} alt="" className="h-full w-full object-cover" />
              </li>
            ))}
          </ul>
        ) : !kit.photo_style && <p className="mt-2 text-sm text-ink-faint">No photos yet</p>}
      </div>

      <div className={`mt-6 ${cls}`} style={delay(4)}>
        <h3 className="eyebrow">Voice</h3>
        {traits.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Voice">
            {traits.slice(0, 5).map((t) => <li key={t}><Chip tone="ink">{t}</Chip></li>)}
          </ul>
        ) : null}
        {kit.tone && <p className={`${traits.length ? "mt-2" : "mt-2"} text-[0.9375rem] text-ink`}>{kit.tone}</p>}
        {!kit.tone && traits.length === 0 && <p className="mt-2 text-sm text-ink-faint">No voice yet</p>}
      </div>

      <div className={`mt-6 ${cls}`} style={delay(5)}>
        <h3 className="eyebrow">Content style</h3>
        {kit.content_style && <p className="mt-2 text-[0.9375rem] text-ink">{kit.content_style}</p>}
        {images.length > 3 && (
          <ul className="mt-3 grid grid-cols-4 gap-1.5" aria-label="Content examples">
            {images.slice(0, 4).map((url) => (
              <li key={url} className="relative aspect-square overflow-hidden rounded-[8px] bg-surface-2">
                <MediaPreview src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </li>
            ))}
          </ul>
        )}
        {!kit.content_style && images.length <= 3 && <p className="mt-2 text-sm text-ink-faint">No content examples yet</p>}
      </div>

      {kit.guidelines.length > 0 && (
        <div className={`mt-6 ${cls}`} style={delay(6)}>
          <h3 className="eyebrow">Rules</h3>
          <ul className="mt-2 divide-y divide-rule">
            {kit.guidelines.map((g) => <li key={g} className="py-2 text-[0.9375rem] text-ink">{g}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- compare

function Compare({ logo, colors, fonts, voice, images, businessName }: {
  logo: string | null; colors: string[]; fonts: string[]; voice: string | null; images: string[]; businessName: string;
}) {
  return (
    <div className="card mt-3 p-4">
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
          {logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logo} alt={`${businessName} logo`} className="h-full w-full object-contain" />
            : <span className="flex h-full w-full items-center justify-center text-xs text-ink-faint">None</span>}
        </span>
        <span className="flex flex-wrap gap-1.5" aria-label={`${colors.length} colors`}>
          {colors.length > 0
            ? colors.slice(0, 6).map((c, i) => <span key={`${c}${i}`} className="h-7 w-7 rounded-full" style={{ background: c, boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-ink) 12%, transparent) inset" }} title={c} />)
            : <span className="text-sm text-ink-faint">No colors</span>}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-ink-faint">Type</dt><dd className="text-ink">{fonts.length ? fonts.join(" with ") : "None"}</dd>
        <dt className="text-ink-faint">Voice</dt><dd className="text-ink">{voice ?? "None"}</dd>
      </dl>
      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-4 gap-1.5" aria-label="Examples">
          {images.slice(0, 4).map((url) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-[8px] bg-surface-2">
              <MediaPreview src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
