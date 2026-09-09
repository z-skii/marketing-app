"use client";

import { useEffect, useState, useTransition } from "react";
import { createCampaign, type CreateCampaignInput } from "./actions";

/**
 * The Create wizard: seven small questions instead of one giant form.
 * Answers autosave to the browser so an interrupted draft survives.
 */

const KINDS = [
  { key: "ugc", title: "UGC / recreate content", sub: "People recreate a video or trend, you pay per approved version" },
  { key: "content", title: "Content campaign", sub: "Creators make original content featuring you" },
  { key: "photography", title: "Photography job", sub: "An on-location shoot — pick one photographer" },
  { key: "videography", title: "Videography job", sub: "A filmed shoot or event — pick one videographer" },
  { key: "general", title: "General marketing job", sub: "Anything else you need a real person for" },
];

const APPLICATION_KINDS = new Set(["photography", "videography", "general"]);
const DRAFT_KEY = "tapmart-create-draft";

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

  const steps: { title: string; valid: boolean; body: React.ReactNode }[] = [
    {
      title: "What do you need?",
      valid: Boolean(d.kind) && Boolean(businessId),
      body: (
        <>
          {businesses.length > 1 && (
            <label className="mb-4 flex flex-col gap-1">
              <span className="eyebrow">Business</span>
              <select className="field" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          )}
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Campaign type">
            {KINDS.map((k) => (
              <button
                key={k.key} type="button" role="radio" aria-checked={d.kind === k.key}
                onClick={() => set({ kind: k.key })}
                className={`border px-4 py-3 text-left ${d.kind === k.key ? "border-signal bg-signal/5" : "border-rule hover:border-ink"}`}
              >
                <span className="font-display text-base font-800">{k.title}</span>
                <span className="block text-xs text-ink-faint">{k.sub}</span>
              </button>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "Describe it",
      valid: d.title.trim().length >= 4 && d.brief.trim().length >= 20,
      body: (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Title</span>
            <input className="field" maxLength={120} value={d.title} onChange={(e) => set({ title: e.target.value })}
              placeholder={applicationBased ? "Coffee shop photoshoot" : "Recreate this video"} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">What exactly do you want?</span>
            <textarea className="field min-h-28" maxLength={4000} value={d.brief} onChange={(e) => set({ brief: e.target.value })}
              placeholder="Plain words are fine — what the work is, what you'll use it for…" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Reference link <span className="text-ink-faint">(optional)</span></span>
            <input className="field" maxLength={500} value={d.referenceUrl} onChange={(e) => set({ referenceUrl: e.target.value })}
              placeholder="Link to the video / example to recreate" inputMode="url" />
          </label>
        </div>
      ),
    },
    {
      title: "Where?",
      valid: true,
      body: (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="eyebrow">City <span className="text-ink-faint">(blank = anywhere)</span></span>
            <input className="field" maxLength={60} value={d.city} onChange={(e) => set({ city: e.target.value })} placeholder="Raleigh, NC" />
          </label>
          {applicationBased && (
            <label className="flex flex-col gap-1">
              <span className="eyebrow">When is the shoot? <span className="text-ink-faint">(optional)</span></span>
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
          <label className="flex flex-col gap-1">
            <span className="eyebrow">One per line <span className="text-ink-faint">(optional)</span></span>
            <textarea className="field min-h-28" value={d.requirements} onChange={(e) => set({ requirements: e.target.value })}
              placeholder={"15–25 seconds\nproduct visible\nvertical 9:16\nmention the business name"} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={d.verifiedOnly} onChange={(e) => set({ verifiedOnly: e.target.checked })} />
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
          <label className="flex flex-col gap-1">
            <span className="eyebrow">{applicationBased ? "Pay for the job" : "Pay per approved submission"}</span>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-800">$</span>
              <input className="field flex-1" inputMode="decimal" value={d.payDollars}
                onChange={(e) => set({ payDollars: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="40" />
            </div>
          </label>
          {!applicationBased && (
            <label className="flex flex-col gap-1">
              <span className="eyebrow">How many approvals will you pay for?</span>
              <input className="field" inputMode="numeric" value={d.slots}
                onChange={(e) => set({ slots: e.target.value.replace(/[^0-9]/g, "") })} placeholder="20" />
            </label>
          )}
          <p className="font-mono text-[0.625rem] text-ink-faint">
            You only pay when you approve work. Approvals come out of your TapMart wallet.
          </p>
        </div>
      ),
    },
    {
      title: "Deadline",
      valid: true,
      body: (
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Submissions close <span className="text-ink-faint">(optional)</span></span>
          <input type="datetime-local" className="field" value={d.deadline} onChange={(e) => set({ deadline: e.target.value })} />
        </label>
      ),
    },
    {
      title: "Preview",
      valid: true,
      body: (
        <div className="border border-rule p-4">
          <p className="eyebrow">{KINDS.find((k) => k.key === d.kind)?.title ?? d.kind}</p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p className="font-display text-lg font-800">{d.title || "—"}</p>
            <p className="tnum font-display font-800 text-signal">${d.payDollars || "0"}</p>
          </div>
          <p className="mt-1.5 text-sm whitespace-pre-wrap text-ink-faint">{d.brief || "—"}</p>
          <p className="mt-2 font-mono text-[0.625rem] text-ink-faint">
            {[d.city || "anywhere",
              applicationBased ? "1 hire" : `${d.slots || 1} paid approvals`,
              d.verifiedOnly ? "verified only" : null,
              d.deadline ? `closes ${new Date(d.deadline).toLocaleDateString()}` : null,
            ].filter(Boolean).join(" · ")}
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
          <span key={i} className={`h-1 flex-1 ${i <= step ? "bg-signal" : "bg-rule"}`} />
        ))}
      </div>
      <h2 className="mt-4 font-display text-2xl font-900 tracking-[-0.03em]">{current.title}</h2>
      <div className="mt-4">{current.body}</div>

      {error && <p role="alert" className="mt-3 font-mono text-xs text-signal">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        {step > 0 && (
          <button type="button" className="btn btn-ghost !px-4 !py-2.5" onClick={() => setStep(step - 1)}>
            ← Back
          </button>
        )}
        {step < steps.length - 1 && (
          <button type="button" disabled={!current.valid} className="btn btn-signal ml-auto !px-6 !py-2.5"
            onClick={() => setStep(step + 1)}>
            Next
          </button>
        )}
        {step === steps.length - 1 && (
          <span className="ml-auto flex gap-2">
            <button type="button" disabled={pending} className="btn !px-4 !py-2.5" onClick={() => submit(false)}>
              Save draft
            </button>
            <button type="button" disabled={pending} className="btn btn-signal !px-6 !py-2.5" onClick={() => submit(true)}>
              {pending ? "Publishing…" : "Publish"}
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
