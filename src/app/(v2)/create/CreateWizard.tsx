"use client";

import { useEffect, useState, useTransition } from "react";
import { Money } from "@/components/v2/ui";
import { createCampaign, type CreateCampaignInput } from "./actions";

/**
 * The Create wizard: seven small questions instead of one giant form.
 * Answers autosave to the browser so an interrupted draft survives.
 */

const KINDS = [
  { key: "ugc", title: "UGC / recreate content", sub: "People recreate a video or trend, you pay per approved version" },
  { key: "content", title: "Content campaign", sub: "Creators make original content featuring you" },
  { key: "photography", title: "Photography job", sub: "An on-location shoot. Pick one photographer" },
  { key: "videography", title: "Videography job", sub: "A filmed shoot or event. Pick one videographer" },
  { key: "general", title: "General marketing job", sub: "Anything else you need a real person for" },
];

const APPLICATION_KINDS = new Set(["photography", "videography", "general"]);
const DRAFT_KEY = "tapmart-create-draft";

const LABEL = "text-sm text-ink-soft";

type Draft = {
  kind: string; title: string; brief: string; referenceUrl: string;
  requirements: string; payDollars: string; slots: string; city: string;
  deadline: string; eventAt: string; verifiedOnly: boolean;
};

const EMPTY: Draft = {
  kind: "", title: "", brief: "", referenceUrl: "", requirements: "",
  payDollars: "", slots: "1", city: "", deadline: "", eventAt: "", verifiedOnly: false,
};

export function CreateWizard({
  businesses, defaultCity, initialDraft,
}: {
  businesses: { id: string; name: string }[];
  defaultCity: string;
  initialDraft?: Partial<Draft>;
}) {
  const [step, setStep] = useState(0);
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [d, setD] = useState<Draft>({ ...EMPTY, city: defaultCity, ...initialDraft });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Restore and autosave the draft locally; publishing clears it. A prefill
  // from a marketing idea takes priority over the stored draft.
  useEffect(() => {
    if (initialDraft) return;
    const restore = setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) setD({ ...EMPTY, city: defaultCity, ...JSON.parse(raw) });
      } catch { /* fresh draft */ }
    }, 0);
    return () => clearTimeout(restore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* full/blocked */ }
  }, [d]);

  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));
  const applicationBased = APPLICATION_KINDS.has(d.kind);

  const submit = (publish: boolean) =>
    startTransition(async () => {
      setError(null);
      const input: CreateCampaignInput = {
        businessId,
        kind: d.kind,
        title: d.title,
        brief: d.brief,
        referenceUrl: d.referenceUrl || undefined,
        requirements: d.requirements.split("\n"),
        payDollars: Number(d.payDollars),
        slots: applicationBased ? 1 : Number(d.slots) || 1,
        city: d.city,
        deadline: d.deadline || undefined,
        eventAt: d.eventAt || undefined,
        verifiedOnly: d.verifiedOnly,
        publish,
      };
      const result = await createCampaign(input);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
      else try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    });

  const payCents = Math.round((Number(d.payDollars) || 0) * 100);
  const businessName = businesses.find((b) => b.id === businessId)?.name ?? "";

  const steps: { title: string; valid: boolean; body: React.ReactNode }[] = [
    {
      title: "What do you need?",
      valid: Boolean(d.kind) && Boolean(businessId),
      body: (
        <>
          {businesses.length > 1 && (
            <label className="mb-4 flex flex-col gap-1.5">
              <span className={LABEL}>Business</span>
              <select className="field" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          )}
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Campaign type">
            {KINDS.map((k) => {
              const on = d.kind === k.key;
              return (
                <button
                  key={k.key} type="button" role="radio" aria-checked={on}
                  onClick={() => set({ kind: k.key })}
                  className={`card-2 p-4 text-left transition-transform active:scale-[0.99] ${on ? "bg-signal text-signal-ink" : "text-ink"}`}
                >
                  <span className="block font-display text-[1.0625rem] leading-tight font-800 tracking-[-0.02em]">{k.title}</span>
                  <span className={`mt-1 block text-sm ${on ? "text-signal-ink/75" : "text-ink-faint"}`}>{k.sub}</span>
                </button>
              );
            })}
          </div>
        </>
      ),
    },
    {
      title: "Describe it",
      valid: d.title.trim().length >= 4 && d.brief.trim().length >= 20,
      body: (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Title</span>
            <input className="field" maxLength={120} value={d.title} onChange={(e) => set({ title: e.target.value })}
              placeholder={applicationBased ? "Coffee shop photoshoot" : "Recreate this video"} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>What exactly do you want?</span>
            <textarea className="field min-h-28" maxLength={4000} value={d.brief} onChange={(e) => set({ brief: e.target.value })}
              placeholder="Plain words are fine: what the work is, what you will use it for." />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Reference link <span className="text-ink-faint">(optional)</span></span>
            <input className="field" maxLength={500} value={d.referenceUrl} onChange={(e) => set({ referenceUrl: e.target.value })}
              placeholder="Link to the video or example to recreate" inputMode="url" />
          </label>
        </div>
      ),
    },
    {
      title: "Where?",
      valid: true,
      body: (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>City <span className="text-ink-faint">(leave blank for anywhere)</span></span>
            <input className="field" maxLength={60} value={d.city} onChange={(e) => set({ city: e.target.value })} placeholder="Raleigh, NC" />
          </label>
          {applicationBased && (
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>When is the shoot? <span className="text-ink-faint">(optional)</span></span>
              <input type="datetime-local" className="field" value={d.eventAt} onChange={(e) => set({ eventAt: e.target.value })} />
            </label>
          )}
        </div>
      ),
    },
    {
      title: "Requirements",
      valid: true,
      body: (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>One per line <span className="text-ink-faint">(optional)</span></span>
            <textarea className="field min-h-28" value={d.requirements} onChange={(e) => set({ requirements: e.target.value })}
              placeholder={"15 to 25 seconds\nproduct visible\nvertical 9:16\nmention the business name"} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-signal" checked={d.verifiedOnly} onChange={(e) => set({ verifiedOnly: e.target.checked })} />
            Verified creators only
          </label>
        </div>
      ),
    },
    {
      title: "Budget",
      valid: Number(d.payDollars) >= 5,
      body: (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{applicationBased ? "Pay for the job" : "Pay per approved submission"}</span>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-800 text-signal">$</span>
              <input className="field flex-1" inputMode="decimal" value={d.payDollars}
                onChange={(e) => set({ payDollars: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="40" />
            </div>
          </label>
          {!applicationBased && (
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>How many approvals will you pay for?</span>
              <input className="field" inputMode="numeric" value={d.slots}
                onChange={(e) => set({ slots: e.target.value.replace(/[^0-9]/g, "") })} placeholder="20" />
            </label>
          )}
          <p className="text-sm text-ink-faint">
            You only pay when you approve work. Approvals come out of your TapMart wallet.
          </p>
        </div>
      ),
    },
    {
      title: "Deadline",
      valid: true,
      body: (
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Submissions close <span className="text-ink-faint">(optional)</span></span>
          <input type="datetime-local" className="field" value={d.deadline} onChange={(e) => set({ deadline: e.target.value })} />
        </label>
      ),
    },
    {
      title: "Preview",
      valid: true,
      body: (
        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm text-ink-faint">{KINDS.find((k) => k.key === d.kind)?.title ?? d.kind}</span>
            <Money cents={payCents} size="lg" suffix={applicationBased ? "for the job" : "each"} />
          </div>
          <h3 className="mt-2 font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em] text-ink">
            {d.title.trim() || "Untitled"}
          </h3>
          {businessName && <p className="mt-2 text-sm text-ink-soft"><span className="font-600 text-ink">{businessName}</span></p>}
          <p className="mt-2 text-sm whitespace-pre-wrap text-ink-soft">{d.brief.trim() || "No brief yet"}</p>
          <p className="mt-3 text-sm text-ink-faint">
            {[d.city || "Anywhere",
              applicationBased ? "1 hire" : `${d.slots || 1} paid approvals`,
              d.verifiedOnly ? "Verified creators" : null,
              d.deadline ? `Closes ${new Date(d.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : null,
            ].filter(Boolean).join("  ·  ")}
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div>
      <div className="flex items-center gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-signal" : "bg-surface-2"}`} />
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-faint">Step {step + 1} of {steps.length}</p>
      <h2 className="mt-2 font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em]">{current.title}</h2>
      <div className="mt-5">{current.body}</div>

      {error && <p role="alert" className="mt-3 text-sm text-signal">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            ← Back
          </button>
        )}
        {step < steps.length - 1 && (
          <button type="button" disabled={!current.valid} className="btn btn-signal ml-auto"
            onClick={() => setStep(step + 1)}>
            Next
          </button>
        )}
        {step === steps.length - 1 && (
          <span className="ml-auto flex gap-2">
            <button type="button" disabled={pending} className="btn" onClick={() => submit(false)}>
              Save draft
            </button>
            <button type="button" disabled={pending} className="btn btn-signal" onClick={() => submit(true)}>
              {pending ? "Publishing…" : "Publish"}
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
