"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretLeft, PencilSimple, Sparkle, X } from "@phosphor-icons/react";
import type { BrandKit, BrandKitRecord, BrandProposal, BrandSource } from "@/lib/business/brand";
import { Uploader } from "@/components/v2/Uploader";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Avatar, Chip } from "@/components/v2/ui";
import { approveBrand, discardBrand, proposeBrand } from "./actions";

/**
 * The brand screen's moving parts. The approved kit is drawn from the
 * record; a proposal is drawn the same way underneath it, labelled with
 * where it came from, and only Approve moves it into the kit.
 */

type Mode = "build" | "refine";

function hasKit(kit: BrandKit): boolean {
  return kit.palette.length > 0 || Boolean(kit.logo_url) || Boolean(kit.tone);
}

export function BrandStudio({
  record, businessName, businessLogo, canEdit,
}: { record: BrandKitRecord; businessName: string; businessLogo: string | null; canEdit: boolean }) {
  const router = useRouter();
  const [kit, setKit] = useState<BrandKit>(record.kit);
  const [approved, setApproved] = useState(record.status === "approved" && hasKit(record.kit));
  const [proposal, setProposal] = useState<BrandProposal | null>(record.proposed);
  const [source, setSource] = useState<BrandSource | null>(record.proposed_source);
  const [mode, setMode] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, startPrepare] = useTransition();
  const [deciding, startDecide] = useTransition();

  const propose = (input: Parameters<typeof proposeBrand>[0]) => {
    setError(null);
    startPrepare(async () => {
      const result = await proposeBrand(input);
      if (!result.ok) { setError(result.error); return; }
      if (result.data) {
        setProposal(result.data.proposal);
        setSource(result.data.source);
      }
      setMode(null);
      router.refresh();
    });
  };

  const approve = () => {
    setError(null);
    startDecide(async () => {
      const result = await approveBrand();
      if (!result.ok) { setError(result.error); return; }
      if (result.data) setKit(result.data);
      setApproved(true);
      setProposal(null);
      setSource(null);
      router.refresh();
    });
  };

  const discard = () => {
    setError(null);
    startDecide(async () => {
      const result = await discardBrand();
      if (!result.ok) { setError(result.error); return; }
      setProposal(null);
      setSource(null);
      router.refresh();
    });
  };

  return (
    <div>
      {/* ------------------------------------------------- the approved kit */}
      {approved ? (
        <section className="mt-5" aria-label="Approved kit">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="eyebrow">Approved kit</h2>
            {canEdit && !proposal && !preparing && mode === null && (
              <button type="button" className="link-row text-sm" onClick={() => setMode("refine")}>
                <PencilSimple size={16} aria-hidden />Refine
              </button>
            )}
          </div>
          <KitVisual kit={kit} businessName={businessName} businessLogo={businessLogo} />
        </section>
      ) : (
        !proposal && !preparing && mode === null && (
          <section className="mt-5" aria-label="Start">
            <p className="text-sm text-ink-soft">No brand kit yet. One approved kit keeps every post, campaign and shoot on the same page.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Choice
                icon={<Sparkle size={28} weight="duotone" aria-hidden />}
                title="Build a brand"
                sub="From your name, category and photos."
                disabled={!canEdit}
                onClick={() => propose({ mode: "build" })}
              />
              <Choice
                icon={<PencilSimple size={28} weight="duotone" aria-hidden />}
                title="Refine my existing brand"
                sub="Bring your logo, site and photos."
                disabled={!canEdit}
                onClick={() => setMode("refine")}
              />
            </div>
          </section>
        )
      )}

      {/* ---------------------------------------------------- refine form */}
      {mode === "refine" && !preparing && (
        <RefineForm
          onBack={() => setMode(null)}
          onSubmit={(input) => propose({ mode: "refine", ...input })}
        />
      )}

      {/* -------------------------------------------------------- pending */}
      {preparing && (
        <section className="card mt-5 flex items-center gap-3 px-5 py-6" aria-live="polite" aria-label="Preparing">
          <span className="live-dot" aria-hidden />
          <p className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">Preparing your brand</p>
        </section>
      )}

      {/* ------------------------------------------------------ proposal */}
      {proposal && !preparing && (
        <section className={approved ? "mt-9" : "mt-5"} aria-label="Proposal">
          <div className="flex items-center justify-between gap-3">
            <h2 className="eyebrow">{source === "ai" ? "Proposed by AI" : "Proposed by template"}</h2>
            <Chip tone="faint">Not approved yet</Chip>
          </div>
          <KitVisual kit={proposal} businessName={businessName} businessLogo={businessLogo} />

          {proposal.improvements.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display text-[1.0625rem] font-700">
                {proposal.improvements.length === 1 ? "1 thing we can improve" : `${proposal.improvements.length} things we can improve`}
              </h3>
              <ol className="mt-2 divide-y divide-rule">
                {proposal.improvements.map((line, i) => (
                  <li key={line} className="reveal flex gap-3 py-3" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                    <span className="tnum w-6 shrink-0 font-display text-[1.0625rem] font-800 text-signal">{i + 1}</span>
                    <span className="text-[0.9375rem] text-ink">{line}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {canEdit ? (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn btn-signal btn-lg flex-1" disabled={deciding} onClick={approve}>
                {deciding ? "One moment" : "Approve"}
              </button>
              <button type="button" className="btn btn-lg flex-1" disabled={deciding} onClick={discard}>
                Discard
              </button>
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

// ------------------------------------------------------------- kit visual

function KitVisual({ kit, businessName, businessLogo }: { kit: BrandKit; businessName: string; businessLogo: string | null }) {
  const display = kit.type.display;
  const body = kit.type.body;
  return (
    <div className="mt-3">
      <div className="flex items-start gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-surface">
          {kit.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.logo_url} alt={`${businessName} logo`} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
              <Avatar src={businessLogo} name={businessName} size={56} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[1.25rem] leading-tight font-800 tracking-[-0.02em]">{businessName}</p>
          {display || body ? (
            <p className="mt-1 text-sm text-ink-soft">
              {display && <span className="text-ink">{display}</span>}
              {display && body && <span className="text-ink-faint"> with </span>}
              {body && <span className="text-ink">{body}</span>}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-faint">No type picked</p>
          )}
          {!kit.logo_url && <p className="mt-1 text-sm text-ink-faint">No logo yet</p>}
        </div>
      </div>

      {kit.palette.length > 0 ? (
        <ul className="mt-5 grid grid-cols-5 gap-2" aria-label="Palette">
          {kit.palette.slice(0, 5).map((hex, i) => (
            <li key={`${hex}-${i}`} className="min-w-0">
              <div className="aspect-square w-full rounded-[var(--radius-control)]" style={{ background: hex, boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-ink) 10%, transparent) inset" }} />
              <p className="mt-1.5 truncate font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-ink-soft">{hex}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-ink-faint">No colours yet</p>
      )}

      {(kit.tone || kit.photo_style) && (
        <dl className="mt-5 divide-y divide-rule">
          {kit.tone && (
            <div className="py-3">
              <dt className="eyebrow">Tone</dt>
              <dd className="mt-1 text-[0.9375rem] text-ink">{kit.tone}</dd>
            </div>
          )}
          {kit.photo_style && (
            <div className="py-3">
              <dt className="eyebrow">Photos</dt>
              <dd className="mt-1 text-[0.9375rem] text-ink">{kit.photo_style}</dd>
            </div>
          )}
        </dl>
      )}

      {kit.image_examples.length > 0 && (
        <ul className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:-mx-8 md:px-8" aria-label="Image examples">
          {kit.image_examples.map((url, i) => (
            <li key={url} className="reveal h-28 w-28 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <MediaPreview src={url} alt="" className="h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ pieces

function Choice({ icon, title, sub, onClick, disabled }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" disabled={disabled} onClick={onClick}
      className="card flex min-h-36 flex-col items-start justify-between p-5 text-left transition-transform active:scale-[0.99] disabled:opacity-60"
    >
      <span className="text-signal">{icon}</span>
      <span>
        <span className="block font-display text-[1.25rem] leading-tight font-800 tracking-[-0.02em]">{title}</span>
        <span className="mt-1 block text-sm text-ink-soft">{sub}</span>
      </span>
    </button>
  );
}

function RefineForm({
  onBack, onSubmit,
}: { onBack: () => void; onSubmit: (input: { website?: string; instagram?: string; logoUrl?: string; imageUrls?: string[] }) => void }) {
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  return (
    <form
      className="card mt-5 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          website: website.trim() || undefined,
          instagram: instagram.trim() || undefined,
          logoUrl: logoUrl ?? undefined,
          imageUrls: images,
        });
      }}
    >
      <button type="button" onClick={onBack} className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 font-display text-sm font-600 text-ink-soft">
        <CaretLeft size={20} weight="bold" aria-hidden />Start over
      </button>
      <h2 className="mt-2 font-display text-[1.25rem] leading-tight font-800 tracking-[-0.02em]">Refine my existing brand</h2>

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-sm font-600 text-ink-soft">Website</span>
          <input className="field" type="url" inputMode="url" placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={200} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-sm font-600 text-ink-soft">Instagram handle</span>
          <input className="field" type="text" placeholder="@yourshop" value={instagram} onChange={(e) => setInstagram(e.target.value)} maxLength={200} autoCapitalize="none" autoCorrect="off" />
        </label>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-600 text-ink-soft">Logo</p>
            <div className="mt-1.5">
              <Uploader id="brand-logo" folder="business" accept="image/*" label={logoUrl ? "Replace logo" : "Upload logo"} onUploaded={(u) => setLogoUrl(u[0] ?? null)} />
            </div>
          </div>
        </div>

        <div>
          <p className="font-display text-sm font-600 text-ink-soft">Photos you like <span className="text-ink-faint">({images.length} of 4)</span></p>
          {images.length > 0 && (
            <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {images.map((url) => (
                <li key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button" aria-label="Remove photo"
                    className="glass-tag absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full text-ink"
                    onClick={() => setImages((list) => list.filter((x) => x !== url))}
                  >
                    <X size={14} weight="bold" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {images.length < 4 && (
            <div className="mt-2">
              <Uploader
                id="brand-images" folder="business" accept="image/*" multiple label="Add photos"
                onUploaded={(u) => setImages((list) => Array.from(new Set([...list, ...u])).slice(0, 4))}
              />
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-lg mt-6 w-full">Prepare my brand</button>
    </form>
  );
}
